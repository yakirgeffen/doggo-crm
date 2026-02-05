import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface UserSettings {
    user_id: string;
    business_name: string | null;
    work_days: number[]; // 0-6
    work_hours_start: string; // "09:00"
    work_hours_end: string; // "17:00"
}

export function useSettings() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchSettings();
    }, [user]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user!.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
                throw error;
            }

            if (data) {
                setSettings(data);
            } else {
                // Initialize defaults if not found
                const defaults: UserSettings = {
                    user_id: user!.id,
                    business_name: null,
                    work_days: [0, 1, 2, 3, 4], // Sun-Thu
                    work_hours_start: '09:00',
                    work_hours_end: '17:00'
                };
                // Auto-create? Or just wait for save? Let's wait for save to avoid junk.
                setSettings(defaults);
            }
        } catch (err: any) {
            console.error('Error fetching settings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        if (!user || !settings) return;

        const updated = { ...settings, ...newSettings };
        setSettings(updated); // Optimistic update

        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                ...newSettings,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error saving settings:', error);
            setError('Failed to save settings');
            fetchSettings(); // Revert
            throw error;
        }
    };

    return { settings, loading, error, updateSettings };
}
