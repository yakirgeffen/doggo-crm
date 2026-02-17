import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { type UserSettings } from '../types';

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
                    trainer_handle: null,
                    bio: null,
                    avatar_url: null,
                    specialties: [],
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

    const updateLocalSettings = (newSettings: Partial<UserSettings>) => {
        if (!settings) return;
        setSettings({ ...settings, ...newSettings });
    };

    const saveSettings = async (overrides?: Partial<UserSettings>) => {
        if (!user || !settings) return;

        const finalSettings = { ...settings, ...overrides };

        // Optimistically update local state if overrides provided
        if (overrides) {
            setSettings(finalSettings);
        }

        const { error } = await supabase
            .from('user_settings')
            .upsert({
                ...finalSettings,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error saving settings:', error);
            setError('Failed to save settings');
            fetchSettings(); // Revert to DB state
            throw error;
        }
    };

    return { settings, loading, error, updateLocalSettings, saveSettings };
}
