import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Service {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    duration_minutes: number;
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
        } catch (err: any) {
            console.error('Error fetching services:', err);
            setError(err.message);
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
        setServices([...services, data]);
        return data;
    };

    const updateService = async (id: string, updates: Partial<Service>) => {
        const { error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        setServices(services.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteService = async (id: string) => {
        // Soft delete
        const { error } = await supabase
            .from('services')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        setServices(services.filter(s => s.id !== id));
    };

    return { services, loading, error, addService, updateService, deleteService };
}
