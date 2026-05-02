import { useState, useEffect } from 'react';
import { supabase, logActivity } from '../../lib/supabase';

interface StickyNoteProps {
    clientId: string;
    initialNote: string | null;
}

export function StickyNote({ clientId, initialNote }: StickyNoteProps) {
    const [note, setNote] = useState(initialNote || '');
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setNote(initialNote || '');
        setIsDirty(false);
    }, [initialNote]);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('clients')
            .update({ notes: note })
            .eq('id', clientId);

        if (!error) {
            await logActivity('client', clientId, 'note_updated', 'פתק הלקוח עודכן');
            setIsDirty(false);
        }
        setSaving(false);
    };

    return (
        <div className="mb-6">
            <div className="bg-warning/5 border border-warning/15 rounded-xl p-4 shadow-soft relative group transition-all focus-within:ring-2 focus-within:ring-warning/20">
                <div className="flex justify-between items-start mb-2">
                    <label className="text-xs font-bold text-warning uppercase tracking-widest flex items-center gap-1.5">
                        📌 פתק לקוח
                    </label>
                    {isDirty && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="text-xs bg-warning/10 text-warning px-3 py-1 rounded-lg font-medium hover:bg-warning/20 transition-colors animate-fade-in"
                        >
                            {saving ? 'שומר...' : 'שמור שינויים'}
                        </button>
                    )}
                </div>
                <textarea
                    value={note}
                    onChange={(e) => {
                        setNote(e.target.value);
                        setIsDirty(true);
                    }}
                    placeholder="רשום כאן דגשים קבועים ללקוח (למשל: קוד לדלת, רגישויות, שעות מועדפות...)"
                    className="w-full bg-transparent border-none p-0 text-text-primary placeholder-warning/30 resize-none focus:ring-0 min-h-[60px] text-sm leading-relaxed"
                />
            </div>
        </div>
    );
}
