import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, BookOpen, Loader2, MessageCircle } from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { useToast } from '../context/toast-context';
import { createCalendarEvent } from '../lib/calendar';
import { useSettings } from '../hooks/useSettings';
import { applyTemplate } from '../lib/whatsapp-template';

interface ClientOption {
    id: string;
    full_name: string;
    primary_dog_name: string;
    phone: string | null;
    programs: { id: string; program_name: string; status: string }[];
}

interface BookSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBooked: () => void;
    prefillDate?: string; // YYYY-MM-DD
    prefillTime?: string; // HH:MM
}

export function BookSessionModal({ isOpen, onClose, onBooked, prefillDate, prefillTime }: BookSessionModalProps) {
    const { user, providerToken } = useAuth();
    const { showToast } = useToast();
    const { settings } = useSettings();
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [date, setDate] = useState(prefillDate || new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(prefillTime || '10:00');
    const [saving, setSaving] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);
    const [bookedSuccess, setBookedSuccess] = useState<{ client: ClientOption; sessionDate: string } | null>(null);

    // Sync prefill props when they change
    const [prevPrefillDate, setPrevPrefillDate] = useState(prefillDate);
    const [prevPrefillTime, setPrevPrefillTime] = useState(prefillTime);
    if (prefillDate !== prevPrefillDate) {
        setPrevPrefillDate(prefillDate);
        if (prefillDate) setDate(prefillDate);
    }
    if (prefillTime !== prevPrefillTime) {
        setPrevPrefillTime(prefillTime);
        if (prefillTime) setTime(prefillTime);
    }

    const fetchClients = useCallback(async () => {
        if (!user) return;
        setLoadingClients(true);
        const { data, error } = await supabase
            .from('clients')
            .select('id, full_name, primary_dog_name, phone, programs(id, program_name, status)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('full_name');

        if (!error && data) {
            // Only show clients that have at least one active program
            // Define temporary type for the query result
            type ClientQuery = {
                id: string;
                full_name: string;
                primary_dog_name: string;
                phone: string | null;
                programs: { id: string; program_name: string; status: string }[];
            };

            const withActivePrograms = (data as unknown as ClientQuery[])
                .map((c) => ({
                    ...c,
                    programs: (c.programs || []).filter((p) => p.status === 'active')
                }))
                .filter((c) => c.programs.length > 0);
            setClients(withActivePrograms);
        }
        setLoadingClients(false);
    }, [user]);

    // Reset selections on each open transition.
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setSelectedClientId('');
            setSelectedProgramId('');
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch, setState resolves after I/O
        if (isOpen) fetchClients();
    }, [isOpen, fetchClients]);

    // Esc-key close — keyboard parity with backdrop click.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProgramId || !date) return;
        setSaving(true);

        const sessionDate = `${date}T${time}:00`;

        const { data, error } = await supabase.from('sessions').insert([{
            program_id: selectedProgramId,
            session_date: sessionDate,
        }]).select('id');

        if (error) {
            showToast('שגיאה בקביעת מפגש: ' + error.message, 'error');
        } else {
            if (data && data[0]) {
                await logActivity('session', data[0].id, 'created', `מפגש חדש נקבע (${date} ${time})`);
                await logActivity('program', selectedProgramId, 'updated', 'מפגש חדש נוסף לתוכנית');

                if (providerToken && selectedClient) {
                    try {
                        const program = selectedClient.programs.find(p => p.id === selectedProgramId);
                        const startDate = new Date(sessionDate);
                        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                        const event = await createCalendarEvent(providerToken, {
                            summary: `אימון: ${selectedClient.full_name} • ${selectedClient.primary_dog_name}`,
                            description: program ? `תוכנית: ${program.program_name}` : undefined,
                            startDateTime: startDate.toISOString(),
                            endDateTime: endDate.toISOString(),
                        });
                        await supabase
                            .from('sessions')
                            .update({ google_calendar_event_id: event.id })
                            .eq('id', data[0].id);
                    } catch (calErr) {
                        console.error('Google Calendar event creation failed:', calErr);
                    }
                }

                // Send booking confirmation email to client (fire-and-forget)
                supabase.functions.invoke('session-emails', {
                    body: { action: 'send_booking_confirmation', session_id: data[0].id }
                }).catch(emailErr => console.error('Booking confirmation email failed:', emailErr));
            }
            onBooked();
            // Show WhatsApp prompt instead of immediate close — trainers in IL
            // often want to send a WhatsApp confirmation in addition to the email.
            if (selectedClient) {
                setBookedSuccess({ client: selectedClient, sessionDate });
            } else {
                showToast('המפגש נקבע בהצלחה! 🐾', 'success');
                onClose();
            }
        }
        setSaving(false);
    };

    const handleClose = () => {
        setBookedSuccess(null);
        onClose();
    };

    if (!isOpen) return null;

    if (bookedSuccess) {
        const { client, sessionDate } = bookedSuccess;
        const dateObj = new Date(sessionDate);
        const dateLabel = dateObj.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', weekday: 'long' });
        const timeLabel = dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        const phoneDigits = (client.phone || '').replace(/[^\d]/g, '');
        const intl = phoneDigits.startsWith('0') ? '972' + phoneDigits.slice(1) : phoneDigits;
        const firstName = client.full_name.split(' ')[0];
        const fallback =
            `שלום ${firstName}!\n` +
            `מפגש האילוף של ${client.primary_dog_name} נקבע ליום ${dateLabel} בשעה ${timeLabel}.\n` +
            `נתראה! 🐾`;
        const messageText = applyTemplate(
            settings?.wa_template_booking ?? null,
            {
                firstName,
                dogName: client.primary_dog_name,
                date: dateLabel,
                time: timeLabel,
            },
            fallback
        );
        const message = encodeURIComponent(messageText);
        const waUrl = phoneDigits ? `https://wa.me/${intl}?text=${message}` : `https://wa.me/?text=${message}`;

        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={handleClose}>
                <div className="bg-surface rounded-2xl shadow-card w-full max-w-md border border-border overflow-hidden animate-modal-in" onClick={e => e.stopPropagation()}>
                    <div className="bg-success/5 border-b border-success/20 px-6 py-5 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">המפגש נקבע!</h2>
                            <p className="text-xs text-text-muted">{dateLabel} · {timeLabel}</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <p className="text-sm text-text-secondary leading-relaxed">
                            לשלוח אישור גם ב-WhatsApp ל-{client.full_name}? ההודעה כבר מוכנה.
                        </p>

                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={handleClose}
                            className="flex items-center justify-center gap-2 w-full bg-success/10 hover:bg-success/15 text-success font-bold py-3 rounded-xl transition-colors"
                        >
                            <MessageCircle size={18} />
                            {phoneDigits ? `שליחה ל-${phoneDigits}` : 'בחירת נמען ב-WhatsApp'}
                        </a>

                        <button
                            onClick={handleClose}
                            type="button"
                            className="btn btn-secondary w-full"
                        >
                            סיום בלי הודעה
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-surface rounded-2xl shadow-card w-full max-w-md border border-border overflow-hidden animate-modal-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-primary/5 border-b border-border px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">קביעת מפגש</h2>
                            <p className="text-xs text-text-muted">בחר לקוח ותוכנית לקביעת מפגש חדש</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-text-primary mb-1 flex items-center gap-1.5">
                                <Calendar size={14} className="text-text-muted" />
                                תאריך
                            </label>
                            <input
                                type="date"
                                required
                                className="input-field text-sm"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-primary mb-1 flex items-center gap-1.5">
                                <Clock size={14} className="text-text-muted" />
                                שעה
                            </label>
                            <input
                                type="time"
                                required
                                className="input-field text-sm"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Client Picker */}
                    <div>
                        <label className="text-sm font-medium text-text-primary mb-1 flex items-center gap-1.5">
                            <User size={14} className="text-text-muted" />
                            לקוח *
                        </label>
                        {loadingClients ? (
                            <div className="input-field py-3 space-y-2" role="status" aria-label="טוען לקוחות">
                                <div className="h-3 w-3/4 bg-border/40 rounded-md skeleton-shimmer" />
                                <div className="h-3 w-1/2 bg-border/30 rounded-md skeleton-shimmer" />
                                <div className="h-3 w-2/3 bg-border/30 rounded-md skeleton-shimmer" />
                            </div>
                        ) : (
                            <select
                                required
                                className="input-field text-sm"
                                value={selectedClientId}
                                onChange={e => {
                                    setSelectedClientId(e.target.value);
                                    setSelectedProgramId('');
                                }}
                            >
                                <option value="">בחר לקוח...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.full_name} • {c.primary_dog_name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Program Picker */}
                    {selectedClient && (
                        <div className="animate-fade-in">
                            <label className="text-sm font-medium text-text-primary mb-1 flex items-center gap-1.5">
                                <BookOpen size={14} className="text-text-muted" />
                                תוכנית *
                            </label>
                            <select
                                required
                                className="input-field text-sm"
                                value={selectedProgramId}
                                onChange={e => setSelectedProgramId(e.target.value)}
                            >
                                <option value="">בחר תוכנית...</option>
                                {selectedClient.programs.map(p => (
                                    <option key={p.id} value={p.id}>{p.program_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                            ביטול
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !selectedProgramId}
                            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>שומר...</span>
                                </>
                            ) : '🐾 קבע מפגש'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
