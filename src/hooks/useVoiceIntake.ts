import { useState, useEffect, useCallback } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../context/auth-context';

// Trainer registration row in voice_intake_trainers — maps a WhatsApp phone
// (E.164) to the trainer for the bot's identity validation. Hook surface for
// the IntegrationsSettings panel section "WhatsApp Voice Intake".

export interface VoiceIntakeRegistration {
    id: string;
    phone_e164: string;
    created_at: string;
    updated_at: string;
}

const E164_RE = /^\+[1-9][0-9]{6,14}$/;

export function useVoiceIntake() {
    const { user } = useAuth();
    const [registration, setRegistration] = useState<VoiceIntakeRegistration | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchRegistration = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('voice_intake_trainers')
                .select('id, phone_e164, created_at, updated_at')
                .eq('trainer_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching voice-intake registration:', error);
                setRegistration(null);
                return;
            }
            setRegistration(data ?? null);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRegistration();
    }, [fetchRegistration]);

    const isValidE164 = (phone: string) => E164_RE.test(phone.trim());

    const saveRegistration = async (
        phoneE164: string,
    ): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'משתמש לא מזוהה' };
        const trimmed = phoneE164.trim();
        if (!isValidE164(trimmed)) {
            return {
                success: false,
                error: 'מספר טלפון חייב להיות בפורמט E.164 (לדוגמה +972501234567)',
            };
        }

        setSaving(true);
        try {
            // Upsert by trainer_id (one phone per trainer in v1).
            // We delete any existing row first then insert — safer than upsert
            // on a UNIQUE phone_e164 in case the trainer is changing numbers.
            const { error: deleteError } = await supabase
                .from('voice_intake_trainers')
                .delete()
                .eq('trainer_id', user.id);

            if (deleteError && deleteError.code !== 'PGRST116') {
                console.error('Voice-intake delete-before-upsert failed:', deleteError);
                return { success: false, error: 'שגיאה במחיקת רישום קודם' };
            }

            const { data, error: insertError } = await supabase
                .from('voice_intake_trainers')
                .insert({ trainer_id: user.id, phone_e164: trimmed })
                .select('id, phone_e164, created_at, updated_at')
                .single();

            if (insertError || !data) {
                console.error('Voice-intake insert failed:', insertError);
                // Most common: phone_e164 already used by another trainer
                const isDup = insertError?.code === '23505';
                return {
                    success: false,
                    error: isDup
                        ? 'מספר הטלפון כבר רשום עבור מאלף אחר'
                        : 'שגיאה בשמירת הרישום',
                };
            }

            setRegistration(data);
            await logActivity(
                'settings',
                user.id,
                'voice_intake_registered',
                `מספר טלפון לקבלות קוליות עודכן ל-${trimmed}`,
            );
            return { success: true };
        } finally {
            setSaving(false);
        }
    };

    const deleteRegistration = async (): Promise<{ success: boolean; error?: string }> => {
        if (!user || !registration) return { success: false, error: 'אין רישום למחיקה' };
        setSaving(true);
        try {
            const { error } = await supabase
                .from('voice_intake_trainers')
                .delete()
                .eq('trainer_id', user.id);
            if (error) {
                console.error('Voice-intake delete failed:', error);
                return { success: false, error: 'שגיאה במחיקת הרישום' };
            }
            setRegistration(null);
            await logActivity(
                'settings',
                user.id,
                'voice_intake_unregistered',
                'הוסר רישום קבלות קוליות',
            );
            return { success: true };
        } finally {
            setSaving(false);
        }
    };

    return {
        registration,
        loading,
        saving,
        isValidE164,
        saveRegistration,
        deleteRegistration,
    };
}
