import { useState, useEffect } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../context/auth-context';

export interface Service {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    duration_minutes: number;
    type: 'fixed' | 'open';
    sessions_included: number | null;
    color?: string;
    is_active: boolean;
}

export function useServices() {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchServices();
    }, [user]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('is_active', true) // Only active
                .order('created_at', { ascending: true });

            if (error) throw error;
            setServices(data || []);
        } catch (err) {
            console.error('Error fetching services:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const addService = async (service: Partial<Service>) => {
        if (!user) return;
        const { data, error } = await supabase
            .from('services')
            .insert({
                user_id: user.id,
                ...service,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        await logActivity('service', data.id, 'created', `שירות חדש: ${data.name}`);
        setServices([...services, data]);
        return data;
    };

    const updateService = async (id: string, updates: Partial<Service>) => {
        const { error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        await logActivity('service', id, 'updated', `שירות עודכן${updates.name ? `: ${updates.name}` : ''}`);
        setServices(services.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteService = async (id: string) => {
        // Soft delete
        const service = services.find(s => s.id === id);
        const { error } = await supabase
            .from('services')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        await logActivity('service', id, 'deleted', `שירות נמחק${service ? `: ${service.name}` : ''}`);
        setServices(services.filter(s => s.id !== id));
    };

    return { services, loading, error, addService, updateService, deleteService };
}
