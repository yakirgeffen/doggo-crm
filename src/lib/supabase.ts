import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface ActivityLog {
    id: string;
    entity_type: 'client' | 'program' | 'session' | 'email';
    entity_id: string;
    action: string;
    description: string | null;
    performed_by: string | null;
    created_at: string;
}

export async function logActivity(
    entityType: ActivityLog['entity_type'],
    entityId: string,
    action: string,
    description?: string
) {
    const { error } = await supabase.from('activity_logs').insert([
        {
            entity_type: entityType,
            entity_id: entityId,
            action,
            description,
        },
    ]);

    if (error) {
        console.error('Failed to log activity:', error);
    }
}

export async function updateProgramStatus(programId: string, status: 'active' | 'completed' | 'cancelled') {
    const { error } = await supabase
        .from('programs')
        .update({ status })
        .eq('id', programId);

    if (!error) {
        await logActivity('program', programId, 'status_change', `Program marked as ${status}`);
    }

    return { error };
}
