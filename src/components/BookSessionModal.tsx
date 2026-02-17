import { useState, useEffect } from 'react';
import { Calendar, Clock, User, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ClientOption {
    id: string;
    full_name: string;
    primary_dog_name: string;
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
    const { user } = useAuth();
    const { showToast } = useToast();
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [date, setDate] = useState(prefillDate || new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(prefillTime || '10:00');
    const [saving, setSaving] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);

    // Sync prefill props when they change
    useEffect(() => {
        if (prefillDate) setDate(prefillDate);
        if (prefillTime) setTime(prefillTime);
    }, [prefillDate, prefillTime]);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setSelectedClientId('');
            setSelectedProgramId('');
            fetchClients();
        }
    }, [isOpen]);

    const fetchClients = async () => {
        if (!user) return;
        setLoadingClients(true);
        const { data, error } = await supabase
            .from('clients')
            .select('id, full_name, primary_dog_name, programs(id, program_name, status)')
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
    };

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProgramId || !date) return;
        setSaving(true);

        const sessionDate = `${date}T${time}:00`;

        const { error } = await supabase.from('sessions').insert([{
            program_id: selectedProgramId,
            session_date: sessionDate,
        }]);

        if (error) {
            showToast('שגיאה בקביעת מפגש: ' + error.message, 'error');
        } else {
            showToast('המפגש נקבע בהצלחה! 🐾', 'success');
            onBooked();
            onClose();
        }
        setSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-surface rounded-2xl shadow-card w-full max-w-md border border-border overflow-hidden"
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
                            <div className="input-field text-sm text-text-muted animate-pulse">טוען לקוחות...</div>
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
