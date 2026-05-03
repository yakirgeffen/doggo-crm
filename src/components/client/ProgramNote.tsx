import { useState } from 'react';
import { supabase, logActivity } from '../../lib/supabase';

interface ProgramNoteProps {
    programId: string;
    initialNote: string | null;
}

export function ProgramNote({ programId, initialNote }: ProgramNoteProps) {
    const [note, setNote] = useState(initialNote || '');
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [prevInitial, setPrevInitial] = useState(initialNote);

    if (initialNote !== prevInitial) {
        setPrevInitial(initialNote);
        setNote(initialNote || '');
        setIsDirty(false);
    }

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('programs')
            .update({ notes: note })
            .eq('id', programId);

        if (!error) {
            await logActivity('program', programId, 'note_updated', 'פתק תוכנית עודכן');
            setIsDirty(false);
        }
        setSaving(false);
    };

    return (
        <div className="mb-6">
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 shadow-soft relative group transition-all focus-within:ring-2 focus-within:ring-primary/20">
                <div className="flex justify-between items-start mb-2">
                    <label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                        📋 פתק תוכנית
                    </label>
                    {isDirty && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-lg font-medium hover:bg-primary/20 transition-colors animate-fade-in"
                        >
                            {saving ? 'שומרים...' : 'שמירת שינויים'}
                        </button>
                    )}
                </div>
                <textarea
                    value={note}
                    onChange={(e) => {
                        setNote(e.target.value);
                        setIsDirty(true);
                    }}
                    placeholder="הקשר תוכנית: יעדים, הערות מקצועיות, הגבלות הכלב, מה עובד / לא עובד..."
                    className="w-full bg-transparent border-none p-0 text-text-primary placeholder-primary/30 resize-none focus:ring-0 min-h-[60px] text-sm leading-relaxed"
                />
            </div>
        </div>
    );
}
