import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useIntegrations() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [vaultData, setVaultData] = useState<{ access_key_id: string } | null>(null);

    // Check status on load
    useEffect(() => {
        if (!user) return;
        fetchStatus();
    }, [user]);

    const fetchStatus = async () => {
        try {
            const { data } = await supabase
                .from('sys_integrations_vault')
                .select('access_key_id, is_connected')
                .eq('user_id', user?.id)
                .eq('service_name', 'morning')
                .single();

            if (data) {
                setVaultData({ access_key_id: data.access_key_id });
                setIsConnected(data.is_connected || false);
            }
        } catch (error) {
            console.error('Error fetching integration status:', error);
        }
    };

    const saveKeys = async (keyId: string, secretKey: string) => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('sys_integrations_vault')
                .upsert({
                    user_id: user.id,
                    service_name: 'morning',
                    access_key_id: keyId,
                    secret_access_key: secretKey,
                    is_connected: false, // Reset status until tested
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            await fetchStatus();
            return { success: true };
        } catch (error) {
            console.error('Error saving keys:', error);
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('morning-api', {
                body: { action: 'test_connection' }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message || 'Connection failed');

            // Update status in DB
            await supabase
                .from('sys_integrations_vault')
                .update({ is_connected: true })
                .eq('user_id', user?.id)
                .eq('service_name', 'morning');

            setIsConnected(true);
            return { success: true, message: data.message };
        } catch (error: any) {
            console.error('Test connection error:', error);
            return { success: false, message: error.message || 'Connection failed' };
        } finally {
            setLoading(false);
        }
    };

    const generatePaymentLink = async (payload: { description: string; amount: number; clientName: string; clientEmail: string; clientPhone?: string; currency?: string }) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('morning-api', {
                body: {
                    action: 'generate_link',
                    payload
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message || 'Failed to generate link');

            return { success: true, url: data.url, id: data.id };
        } catch (error: any) {
            console.error('Generate Link error:', error);
            return { success: false, error: error.message || 'Generation failed' };
        } finally {
            setLoading(false);
        }
    };

    return {
        isConnected,
        vaultData,
        saveKeys,
        testConnection,
        generatePaymentLink,
        loading
    };
}
