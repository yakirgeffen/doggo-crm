import { useState, useEffect } from 'react';
import { Loader2, Trash2, Save, X } from 'lucide-react';
import { supabase, logActivity } from '../../lib/supabase';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/toast-context';
import { updateCalendarEvent, deleteCalendarEvent } from '../../lib/calendar';
import type { Session } from '../../types';

interface EditSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    session: Session;
    programName: string;
}

// CPO loop iteration 5 — closes the G7 calendar update/delete dead-call
// gap + sends client-facing cancellation email when a session is cancelled.

export function EditSessionModal({ isOpen, onClose, onSaved, session, programName }: EditSessionModalProps) {
    const { providerToken } = useAuth();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [confirmingCancel, setConfirmingCancel] = useState(false);

    const initialDate = new Date(session.session_date);
    const dateOnly = initialDate.toISOString().split('T')[0];
    const timeOnly = initialDate.toTimeString().slice(0, 5);

    const [date, setDate] = useState(dateOnly);
    const [time, setTime] = useState(timeOnly);
    const [notes, setNotes] = useState(session.session_notes || '');
    const [homework, setHomework] = useState(session.homework || '');
    const [nextDate, setNextDate] = useState(session.next_session_date || '');

    useEffect(() => {
        if (isOpen) {
            const d = new Date(session.session_date);
            setDate(d.toISOString().split('T')[0]);
            setTime(d.toTimeString().slice(0, 5));
            setNotes(session.session_notes || '');
            setHomework(session.homework || '');
            setNextDate(session.next_session_date || '');
            setConfirmingCancel(false);
        }
    }, [isOpen, session]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            const newSessionDateISO = `${date}T${time}:00`;

            const { error } = await supabase
                .from('sessions')
                .update({
                    session_date: newSessionDateISO,
                    session_notes: notes,
                    homework: homework || null,
                    next_session_date: nextDate || null,
                })
                .eq('id', session.id);
            if (error) throw error;

            // Update Google Calendar event if linked
            const eventId = (session as Session & { google_calendar_event_id?: string }).google_calendar_event_id;
            if (eventId && providerToken) {
                try {
                    const startDate = new Date(newSessionDateISO);
                    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                    await updateCalendarEvent(providerToken, eventId, {
                        summary: `אימון: ${programName}`,
                        description: notes || undefined,
                        startDateTime: startDate.toISOString(),
                        endDateTime: endDate.toISOString(),
                    });
                } catch (calErr) {
                    console.error('Calendar event update failed:', calErr);
                }
            }

            await logActivity('session', session.id, 'updated', `Session rescheduled / details updated`);
            showToast('המפגש עודכן', 'success');
            onSaved();
            onClose();
        } catch (err) {
            console.error('Edit session error:', err);
            showToast('שגיאה בעדכון המפגש', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        setSaving(true);
        try {
            const eventId = (session as Session & { google_calendar_event_id?: string }).google_calendar_event_id;

            // Cancellation email FIRST (while session row + program data still
            // exist for the function to look up)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isFuture = new Date(session.session_date) >= today;
            if (isFuture) {
                supabase.functions.invoke('session-emails', {
                    body: { action: 'send_cancellation', session_id: session.id }
                }).catch(emailErr => console.error('Cancellation email failed:', emailErr));
            }

            // Then delete the session row
            const { error } = await supabase
                .from('sessions')
                .delete()
                .eq('id', session.id);
            if (error) throw error;

            // Then delete the Calendar event
            if (eventId && providerToken) {
                try {
                    await deleteCalendarEvent(providerToken, eventId);
                } catch (calErr) {
                    console.error('Calendar event delete failed:', calErr);
                }
            }

            await logActivity('session', session.id, 'deleted', 'Session cancelled');
            showToast('המפגש בוטל', 'info');
            onSaved();
            onClose();
        } catch (err) {
            console.error('Cancel session error:', err);
            showToast('שגיאה בביטול המפגש', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-card w-full max-w-md border border-border overflow-hidden animate-modal-in" onClick={e => e.stopPropagation()}>
                <div className="bg-primary/5 border-b border-border px-6 py-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-text-primary">עריכת מפגש</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1">תאריך</label>
                            <input
                                type="date"
                                className="input-field text-sm"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1">שעה</label>
                            <input
                                type="time"
                                className="input-field text-sm"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">סיכום מפגש</label>
                        <textarea
                            className="input-field min-h-[100px] text-sm"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">שיעורי בית (אופציונלי)</label>
                        <textarea
                            className="input-field min-h-[60px] text-sm"
                            value={homework}
                            onChange={e => setHomework(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">תאריך מפגש הבא (אופציונלי)</label>
                        <input
                            type="date"
                            className="input-field text-sm"
                            value={nextDate}
                            onChange={e => setNextDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="border-t border-border p-4 bg-surface-warm">
                    {!confirmingCancel ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmingCancel(true)}
                                disabled={saving}
                                className="px-3 py-2 rounded-lg text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-1.5"
                                title="בטל את המפגש"
                            >
                                <Trash2 size={14} /> בטל מפגש
                            </button>
                            <div className="flex-1" />
                            <button onClick={onClose} className="btn btn-secondary text-sm">סגור</button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-primary text-sm flex items-center gap-1.5"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                <span>שמור</span>
                            </button>
                        </div>
                    ) : (
                        <div className="bg-error/5 border border-error/20 rounded-lg p-3">
                            <p className="text-sm font-bold text-error mb-2">לבטל את המפגש?</p>
                            <p className="text-xs text-text-secondary mb-3">
                                המפגש יימחק מהמערכת, האירוע ביומן Google ייסגר, והלקוח יקבל מייל ביטול.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setConfirmingCancel(false)}
                                    disabled={saving}
                                    className="btn btn-secondary text-xs flex-1"
                                >
                                    חזרה
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="text-xs font-bold text-white bg-error hover:bg-error/90 px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 flex-1"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    <span>אשר ביטול</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
