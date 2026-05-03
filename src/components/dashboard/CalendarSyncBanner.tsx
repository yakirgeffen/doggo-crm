import { useState } from 'react';
import { CalendarSync, Check, X, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/toast-context';
import { useCalendarSync, type CalendarSyncChange } from '../../hooks/useCalendarSync';

// CTO iter 78 — Dashboard surface for two-way Google Calendar sync.
//
// Renders only when the trainer's `useCalendarSync()` hook has detected
// drift between Google Calendar and the CRM `sessions` table. Trainer
// can apply individual changes, apply all at once, or dismiss. Hidden
// when no drift, when trainer has no Google connection, or when the
// hook is still doing its initial fetch.
//
// Hebrew RTL gender-neutral copy throughout (verbal-noun + plural-action
// patterns per the studio Hebrew microcopy guide).

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString('he-IL', {
            weekday: 'short',
            day: 'numeric',
            month: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

function describeChange(change: CalendarSyncChange): string {
    if (change.kind === 'rescheduled' && change.suggestedSessionDate) {
        return `שונה מ-${formatDate(change.currentSessionDate)} ל-${formatDate(change.suggestedSessionDate)}`;
    }
    if (change.kind === 'cancelled-in-google') {
        return `האירוע נמחק ביומן Google (${formatDate(change.currentSessionDate)})`;
    }
    return `דרושה התאמה (${formatDate(change.currentSessionDate)})`;
}

export function CalendarSyncBanner() {
    const { pendingChanges, syncing, error, applyChange, applyAll, dismissChange } = useCalendarSync();
    const { showToast } = useToast();
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [applyingAll, setApplyingAll] = useState(false);

    if (pendingChanges.length === 0 && !error) return null;
    // If there's an error but we never had pending changes, stay quiet —
    // the most likely cause is a transient token issue and we don't want
    // a permanent banner for a network blip.
    if (pendingChanges.length === 0 && error) return null;

    const count = pendingChanges.length;

    const handleApply = async (change: CalendarSyncChange) => {
        const key = `${change.googleEventId}:${change.kind}`;
        setBusyKey(key);
        try {
            await applyChange(change);
            showToast('המפגש סונכרן עם יומן Google', 'success');
        } catch (err) {
            console.error('Apply change failed:', err);
            showToast('שגיאה בסנכרון. אפשר לנסות שוב.', 'error');
        } finally {
            setBusyKey(null);
        }
    };

    const handleApplyAll = async () => {
        setApplyingAll(true);
        try {
            await applyAll();
            showToast('כל השינויים מהיומן הוחלו', 'success');
        } catch (err) {
            console.error('Apply all failed:', err);
            showToast('חלק מהשינויים לא הוחלו. אפשר לנסות שוב פרטנית.', 'error');
        } finally {
            setApplyingAll(false);
        }
    };

    const handleDismiss = (change: CalendarSyncChange) => {
        dismissChange(change);
    };

    return (
        <div className="flat-card p-5 mb-6 bg-gradient-to-br from-warning/5 to-accent/5 border-warning/30 animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                        <CalendarSync size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-text-primary">
                            {count === 1
                                ? 'מפגש שונה ביומן Google'
                                : `${count} מפגשים שונו ביומן Google`}
                        </h2>
                        <p className="text-xs text-text-muted">
                            השינויים בוצעו ביומן ולא דרך המערכת. אפשר להחיל אותם או להתעלם.
                        </p>
                    </div>
                </div>
                {count > 1 && (
                    <button
                        onClick={handleApplyAll}
                        disabled={applyingAll || syncing}
                        className="btn btn-primary text-xs flex items-center gap-1.5 shrink-0"
                        title="החלת כל השינויים על המפגשים במערכת"
                    >
                        {applyingAll ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        <span>החלת הכל</span>
                    </button>
                )}
            </div>

            <ul className="space-y-2">
                {pendingChanges.map(change => {
                    const key = `${change.googleEventId}:${change.kind}`;
                    const isBusy = busyKey === key || applyingAll;
                    return (
                        <li
                            key={key}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border"
                        >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                {change.kind === 'cancelled-in-google' && (
                                    <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
                                )}
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-text-primary truncate">
                                        {change.label}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        {describeChange(change)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {change.googleHtmlLink && (
                                    <a
                                        href={change.googleHtmlLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-8 h-8 rounded-lg bg-border/20 text-text-muted flex items-center justify-center hover:bg-border/40 transition-colors"
                                        title="פתיחה ביומן Google"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                                <button
                                    onClick={() => handleApply(change)}
                                    disabled={isBusy}
                                    className="btn bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 px-3 py-1.5 text-xs font-medium flex items-center gap-1"
                                    title="החלת השינוי על המפגש במערכת"
                                >
                                    {isBusy ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Check size={14} />
                                    )}
                                    <span>החלה</span>
                                </button>
                                <button
                                    onClick={() => handleDismiss(change)}
                                    disabled={isBusy}
                                    className="btn bg-border/20 text-text-muted border border-border hover:bg-border/30 px-3 py-1.5 text-xs font-medium flex items-center gap-1"
                                    title="התעלמות מהשינוי"
                                >
                                    <X size={14} />
                                    <span>התעלמות</span>
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
