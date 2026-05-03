import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// activity_logs.entity_type has no DB CHECK constraint — values are
// free-text. Keep a union here for autocomplete + signal of intent;
// add new values as new mutation surfaces are covered.
export type ActivityEntityType =
    | 'client'
    | 'program'
    | 'session'
    | 'email'
    | 'service'
    | 'settings'
    | 'client_attachment'
    | 'testimonial';

export interface ActivityLog {
    id: string;
    entity_type: ActivityEntityType;
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

export async function updateProgramStatus(programId: string, status: 'active' | 'paused' | 'completed') {
    const { error } = await supabase
        .from('programs')
        .update({ status })
        .eq('id', programId);

    if (!error) {
        await logActivity('program', programId, 'status_change', `Program marked as ${status}`);
    }

    return { error };
}
