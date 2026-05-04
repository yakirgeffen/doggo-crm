import { useState } from 'react';
import { Pin, Plus } from 'lucide-react';
import { supabase, logActivity } from '../../lib/supabase';

interface StickyNoteProps {
    clientId: string;
    initialNote: string | null;
}

/**
 * Trainer-only "sticky note" attached to the client. Visually a folded paper
 * note when there's content, a near-invisible "add a note" affordance when
 * empty. The empty state used to render the full warning-yellow card with a
 * placeholder — that visual weight competed with the hero card and felt like
 * a system warning rather than a workspace tool. Polished iter 138 (Yakir
 * demo prep) to soften the empty state and tighten the filled state.
 */
export function StickyNote({ clientId, initialNote }: StickyNoteProps) {
    const [note, setNote] = useState(initialNote || '');
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    // When the saved note is empty AND the user hasn't requested editing, we
    // collapse the entire card into a single "add a note" link. The first
    // expand goes through this flag so the textarea + autofocus path runs.
    const [isExpanded, setIsExpanded] = useState(Boolean(initialNote && initialNote.trim().length > 0));
    const [prevInitial, setPrevInitial] = useState(initialNote);

    // Reset local note when parent supplies a new initialNote (e.g. client switch).
    if (initialNote !== prevInitial) {
        setPrevInitial(initialNote);
        setNote(initialNote || '');
        setIsDirty(false);
        setIsExpanded(Boolean(initialNote && initialNote.trim().length > 0));
    }

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('clients')
            .update({ notes: note })
            .eq('id', clientId);

        if (!error) {
            await logActivity('client', clientId, 'note_updated', 'פתק הלקוח עודכן');
            setIsDirty(false);
            // If we just saved an empty note, collapse back to the slim affordance.
            if (note.trim().length === 0) setIsExpanded(false);
        }
        setSaving(false);
    };

    // Slim affordance — shown only when there's no saved note AND we're not
    // currently editing. Mounts a single inline button under the hero,
    // matching the muted-text scale used elsewhere on the page.
    if (!isExpanded) {
        return (
            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors group"
                >
                    <span className="w-5 h-5 rounded-md bg-surface-warm group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Plus size={12} />
                    </span>
                    הוספת פתק לקוח
                </button>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <div className="bg-warning/[0.04] border border-warning/15 rounded-xl px-4 pt-3 pb-3 transition-all focus-within:border-warning/30 focus-within:bg-warning/[0.06]">
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-warning/90 uppercase tracking-widest flex items-center gap-1">
                        <Pin size={11} className="-rotate-12" />
                        פתק לקוח
                    </label>
                    {isDirty && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="text-xs bg-warning/15 text-warning px-2.5 py-0.5 rounded-md font-medium hover:bg-warning/25 transition-colors animate-fade-in disabled:opacity-50"
                        >
                            {saving ? 'שומרים...' : 'שמירה'}
                        </button>
                    )}
                </div>
                <textarea
                    autoFocus={!initialNote}
                    value={note}
                    onChange={(e) => {
                        setNote(e.target.value);
                        setIsDirty(true);
                    }}
                    placeholder="דגשים קבועים: קוד לדלת, רגישויות, שעות מועדפות..."
                    className="w-full bg-transparent border-none p-0 text-text-primary placeholder-warning/35 resize-none focus:ring-0 focus:outline-none min-h-[44px] text-sm leading-relaxed"
                />
            </div>
        </div>
    );
}
