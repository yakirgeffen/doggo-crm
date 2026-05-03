import { useCallback, useEffect, useState } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { type TrainerTestimonial } from '../types';

// Trainer-side hook: list/create/update/delete the trainer's own testimonials.
// Public storefront uses a separate direct query against trainer_testimonials
// (filtered by user_id + is_published=true) — RLS allows anon SELECT on
// published rows. See migration 20260503...trainer_testimonials.

export function useTestimonials() {
    const { user } = useAuth();
    const [items, setItems] = useState<TrainerTestimonial[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('trainer_testimonials')
            .select('*')
            .eq('user_id', user.id)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });
        if (!error && data) setItems(data as TrainerTestimonial[]);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch
        fetch();
    }, [fetch]);

    const create = useCallback(async (input: Omit<TrainerTestimonial, 'id' | 'user_id' | 'created_at' | 'display_order'> & { display_order?: number }) => {
        if (!user) throw new Error('Not authenticated');
        const { data, error } = await supabase
            .from('trainer_testimonials')
            .insert({ ...input, user_id: user.id, display_order: input.display_order ?? items.length })
            .select('*')
            .single();
        if (error) throw error;
        await logActivity('testimonial', data.id, 'created', `המלצה מ-${data.client_name}`);
        await fetch();
        return data as TrainerTestimonial;
    }, [user, items.length, fetch]);

    const update = useCallback(async (id: string, patch: Partial<Omit<TrainerTestimonial, 'id' | 'user_id' | 'created_at'>>) => {
        const { error } = await supabase.from('trainer_testimonials').update(patch).eq('id', id);
        if (error) throw error;
        await logActivity('testimonial', id, 'updated', `המלצה עודכנה`);
        await fetch();
    }, [fetch]);

    const remove = useCallback(async (id: string) => {
        const { error } = await supabase.from('trainer_testimonials').delete().eq('id', id);
        if (error) throw error;
        await logActivity('testimonial', id, 'deleted', `המלצה נמחקה`);
        await fetch();
    }, [fetch]);

    const togglePublished = useCallback(async (id: string, current: boolean) => {
        await update(id, { is_published: !current });
    }, [update]);

    return { items, loading, create, update, remove, togglePublished, refresh: fetch };
}
