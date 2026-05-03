import { useState } from 'react';
import { Calendar, Loader2, X, Check } from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';
import { useToast } from '../context/toast-context';
import { useAuth } from '../context/auth-context';
import { createCalendarEvent } from '../lib/calendar';

interface RecurringScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScheduled?: () => void;
    programId: string;
    programName: string;
    suggestedCount?: number;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'ראשון' },
    { value: 1, label: 'שני' },
    { value: 2, label: 'שלישי' },
    { value: 3, label: 'רביעי' },
    { value: 4, label: 'חמישי' },
    { value: 5, label: 'שישי' },
    { value: 6, label: 'שבת' },
];

export function RecurringScheduleModal({ isOpen, onClose, onScheduled, programId, programName, suggestedCount }: RecurringScheduleModalProps) {
    const { providerToken } = useAuth();
    const { showToast } = useToast();
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0]);
    const [count, setCount] = useState<number>(suggestedCount || 8);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const computeSessionDates = (): Date[] => {
        if (daysOfWeek.length === 0) return [];
        const dates: Date[] = [];
        const start = new Date(`${startDate}T${time}:00`);
        // Walk day-by-day forward; on each matching day-of-week, push a session.
        const cursor = new Date(start);
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
        // safety cap: walk at most 365 days to find `count` matches
        let walked = 0;
        while (dates.length < count && walked < 365) {
            if (sortedDays.includes(cursor.getDay())) {
                dates.push(new Date(cursor));
            }
            cursor.setDate(cursor.getDate() + 1);
            walked++;
        }
        return dates;
    };

    const toggleDay = (day: number) => {
        setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const previewDates = computeSessionDates();

    const handleSubmit = async () => {
        if (count < 1 || count > 52) {
            showToast('מספר מפגשים חייב להיות בין 1 ל-52', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const dates = computeSessionDates();
            const rows = dates.map(d => ({
                program_id: programId,
                session_date: d.toISOString(),
            }));

            const { data, error } = await supabase.from('sessions').insert(rows).select('id');
            if (error) throw error;

            const dayLabels = daysOfWeek.map(d => DAYS_OF_WEEK.find(x => x.value === d)?.label).filter(Boolean).join('+');
            await logActivity('program', programId, 'sessions_scheduled', `${dates.length} מפגשים נקבעו (${dayLabels} ${time})`);

            // Sync to Google Calendar (best-effort, fire-and-forget per session)
            if (providerToken && data) {
                for (let i = 0; i < data.length; i++) {
                    const sessionRow = data[i];
                    const sessionDate = dates[i];
                    const endDate = new Date(sessionDate.getTime() + 60 * 60 * 1000);
                    createCalendarEvent(providerToken, {
                        summary: `אימון: ${programName}`,
                        startDateTime: sessionDate.toISOString(),
                        endDateTime: endDate.toISOString(),
                    }).then(event => {
                        if (event?.id) {
                            supabase.from('sessions').update({ google_calendar_event_id: event.id }).eq('id', sessionRow.id);
                        }
                    }).catch(err => console.error('Calendar event failed:', err));
                }
            }

            showToast(`${dates.length} מפגשים נקבעו בהצלחה 🐾`, 'success');
            onScheduled?.();
            onClose();
        } catch (err) {
            console.error('Recurring schedule error:', err);
            showToast('שגיאה בקביעת המפגשים', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-card w-full max-w-md border border-border overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-primary/5 border-b border-border px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-primary" />
                        <h2 className="text-lg font-bold text-text-primary">תזמון אוטומטי של מפגשים</h2>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <p className="text-sm text-text-secondary">
                        קביעת {count} מפגשים שבועיים בלחיצה אחת.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1">תאריך התחלה</label>
                            <input
                                type="date"
                                className="input-field text-sm"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
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
                        <label className="block text-xs font-medium text-text-muted mb-1">ימים בשבוע (אפשר לבחור מספר)</label>
                        <div className="grid grid-cols-7 gap-1">
                            {DAYS_OF_WEEK.map(d => (
                                <button
                                    key={d.value}
                                    type="button"
                                    onClick={() => toggleDay(d.value)}
                                    className={`text-xs py-2 rounded-lg transition-colors ${daysOfWeek.includes(d.value) ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-surface-warm'}`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">מספר מפגשים</label>
                        <input
                            type="number"
                            min="1"
                            max="52"
                            className="input-field text-sm ltr-nums"
                            value={count}
                            onChange={e => setCount(Math.max(1, Math.min(52, Number(e.target.value) || 1)))}
                        />
                    </div>

                    <div className="bg-background border border-border rounded-xl p-3 max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold text-text-secondary mb-2">תצוגה מקדימה</p>
                        <ul className="text-xs text-text-muted space-y-1">
                            {previewDates.slice(0, 8).map((d, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                    <Check size={11} className="text-success shrink-0" />
                                    {d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}, {d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                </li>
                            ))}
                            {previewDates.length > 8 && (
                                <li className="text-text-muted/70">+ עוד {previewDates.length - 8} מפגשים...</li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border p-4 bg-surface-warm flex gap-2">
                    <button onClick={onClose} className="btn btn-secondary flex-1" disabled={submitting}>
                        ביטול
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || count < 1 || daysOfWeek.length === 0}
                        className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>קובע...</span>
                            </>
                        ) : (
                            <>
                                <Calendar size={14} />
                                <span>קבע {count} מפגשים</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
