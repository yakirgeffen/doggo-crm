import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';
import { useServices } from '../hooks/useServices';

export function NewSessionPage() {
    const navigate = useNavigate();
    const { programId } = useParams<{ programId: string }>();
    const [loading, setLoading] = useState(false);
    const [programName, setProgramName] = useState('');
    const [programType, setProgramType] = useState<string>('fixed_sessions'); // Track type

    const { services } = useServices(); // Fetch active services

    const [formData, setFormData] = useState({
        session_date: new Date().toISOString().split('T')[0],
        session_notes: '',
        homework: '',
        next_session_date: '',
        service_id: '', // For open ended
        price: '', // For open ended
    });

    useEffect(() => {
        if (programId) {
            supabase
                .from('programs')
                .select('program_name, program_type')
                .eq('id', programId)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setProgramName(data.program_name);
                        setProgramType(data.program_type);
                    }
                });
        }
    }, [programId]);

    // Auto-fill price when service selected
    useEffect(() => {
        if (formData.service_id) {
            const service = services.find(s => s.id === formData.service_id);
            if (service) {
                setFormData(prev => ({ ...prev, price: service.price.toString() }));
            }
        }
    }, [formData.service_id, services]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!programId) return;
        setLoading(true);

        const payload = {
            program_id: programId,
            session_date: formData.session_date,
            session_notes: formData.session_notes,
            homework: formData.homework,
            next_session_date: formData.next_session_date || null,
            // Only save price/service if open ended (or if user populated them)
            price: formData.price ? parseFloat(formData.price) : null,
            currency: 'ILS',
            service_id: formData.service_id || null,
        };

        const { data, error } = await supabase.from('sessions').insert([payload]).select();

        if (error) {
            alert('Error logging session: ' + error.message);
            setLoading(false);
        } else {
            if (data && data[0]) {
                await logActivity('session', data[0].id, 'created', `Session logged for ${programName}`);
                await logActivity('program', programId, 'updated', 'Session added');
            }
            navigate(`/programs/${programId}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link to={`/programs/${programId}`} className="flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] mb-6 transition-colors font-medium text-sm">
                <ArrowLeft size={16} className="ml-2 rotate-180" /> {/* Flip arrow for RTL */}
                חזרה לתוכנית
            </Link>

            <div className="card p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[var(--color-text-main)]">תיעוד מפגש</h1>
                    {programName && <p className="text-[var(--color-text-muted)] mt-1">עבור {programName}</p>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">
                            תאריך המפגש *
                        </label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            value={formData.session_date}
                            onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                        />
                    </div>

                    {/* Service Selector (Only for Open Ended) */}
                    {programType === 'open_ended' && (
                        <div className="p-4 bg-[var(--tea-green-light)]/30 rounded-lg border border-[var(--color-primary)]/20 space-y-4 animate-fade-in">
                            <h3 className="text-sm font-bold text-[var(--color-primary)] flex items-center gap-2">
                                💰 חיוב עבור מפגש חד פעמי
                            </h3>

                            <div>
                                <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">סוג שירות</label>
                                <select
                                    className="input-field text-sm"
                                    value={formData.service_id}
                                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                                >
                                    <option value="">בחר שירות...</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} (₪{s.price})</option>
                                    ))}
                                </select>
                            </div>

                            {formData.service_id && (
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">מחיר לתשלום (₪)</label>
                                    <input
                                        type="number"
                                        className="input-field text-sm"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">
                            סיכום מפגש
                        </label>
                        <textarea
                            required
                            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-h-[150px]"
                            placeholder="על מה עבדנו היום?"
                            value={formData.session_notes}
                            onChange={(e) => setFormData({ ...formData, session_notes: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">
                            שיעורי בית / דגשים להמשך
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-h-[80px]"
                            placeholder="הנחיות לתרגול בבית..."
                            value={formData.homework}
                            onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 border-t border-[var(--color-border)]">
                        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">
                            תאריך המפגש הבא (אופציונלי)
                        </label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            value={formData.next_session_date}
                            onChange={(e) => setFormData({ ...formData, next_session_date: e.target.value })}
                        />
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            משמש לתיאום ציפיות. לא קובע אירוע ביומן באופן אוטומטי (עדיין).
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(`/programs/${programId}`)}
                            className="btn btn-secondary"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'שומר...' : 'שמור ותעד מפגש'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
