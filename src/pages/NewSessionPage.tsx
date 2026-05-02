import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';
import { useServices } from '../hooks/useServices';
import { useToast } from '../context/toast-context';
import { useAuth } from '../context/auth-context';
import { createCalendarEvent } from '../lib/calendar';

export function NewSessionPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { providerToken } = useAuth();
    const { programId } = useParams<{ programId: string }>();
    const [loading, setLoading] = useState(false);
    const [programName, setProgramName] = useState('');
    const [programType, setProgramType] = useState<string>('fixed_sessions');

    const { services } = useServices();

    const [formData, setFormData] = useState({
        session_date: new Date().toISOString().split('T')[0],
        session_notes: '',
        homework: '',
        next_session_date: '',
        service_id: '',
        price: '',
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
            price: formData.price ? parseFloat(formData.price) : null,
            currency: 'ILS',
            service_id: formData.service_id || null,
        };

        const { data, error } = await supabase.from('sessions').insert([payload]).select();

        if (error) {
            showToast('שגיאה בתיעוד המפגש: ' + error.message, 'error');
            setLoading(false);
        } else {
            if (data && data[0]) {
                await logActivity('session', data[0].id, 'created', `Session logged for ${programName}`);
                await logActivity('program', programId, 'updated', 'Session added');

                if (providerToken) {
                    try {
                        const startDate = new Date(`${formData.session_date}T10:00:00`);
                        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                        const event = await createCalendarEvent(providerToken, {
                            summary: `אימון: ${programName}`,
                            description: formData.session_notes || undefined,
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

                navigate(`/programs/${programId}`, { state: { newSession: data[0] } });
            } else {
                navigate(`/programs/${programId}`);
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <Link to={`/programs/${programId}`} className="flex items-center text-text-muted hover:text-text-primary mb-6 transition-colors font-medium text-sm group w-fit">
                <ArrowRight size={16} className="me-2 group-hover:-translate-x-1 transition-transform" />
                חזרה לתוכנית
            </Link>

            <div className="flat-card p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-text-primary">תיעוד מפגש</h1>
                    {programName && <p className="text-text-muted mt-1">עבור {programName}</p>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div>
                        <label htmlFor="ns-date" className="block text-sm font-medium text-text-primary mb-1">
                            תאריך המפגש *
                        </label>
                        <input
                            id="ns-date"
                            type="date"
                            required
                            className="input-field"
                            value={formData.session_date}
                            onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                        />
                    </div>

                    {/* Service Selector (Only for Open Ended) */}
                    {programType === 'open_ended' && (
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/15 space-y-4 animate-fade-in">
                            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                                💰 חיוב עבור מפגש חד פעמי
                            </h3>

                            <div>
                                <label htmlFor="ns-service" className="block text-xs font-medium text-text-muted mb-1">סוג שירות</label>
                                <select
                                    id="ns-service"
                                    className="input-field text-sm"
                                    value={formData.service_id}
                                    onChange={(e) => {
                                        const service_id = e.target.value;
                                        const service = services.find(s => s.id === service_id);
                                        setFormData({
                                            ...formData,
                                            service_id,
                                            price: service ? service.price.toString() : formData.price,
                                        });
                                    }}
                                >
                                    <option value="">בחר שירות...</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} (₪{s.price})</option>
                                    ))}
                                </select>
                            </div>

                            {formData.service_id && (
                                <div>
                                    <label htmlFor="ns-price" className="block text-xs font-medium text-text-muted mb-1">מחיר לתשלום (₪)</label>
                                    <input
                                        id="ns-price"
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
                        <label htmlFor="ns-notes" className="block text-sm font-medium text-text-primary mb-1">
                            סיכום מפגש
                        </label>
                        <textarea
                            id="ns-notes"
                            required
                            className="input-field min-h-[150px]"
                            placeholder="על מה עבדנו היום?"
                            value={formData.session_notes}
                            onChange={(e) => setFormData({ ...formData, session_notes: e.target.value })}
                        />
                    </div>

                    <div>
                        <label htmlFor="ns-homework" className="block text-sm font-medium text-text-primary mb-1">
                            שיעורי בית / דגשים להמשך
                        </label>
                        <textarea
                            id="ns-homework"
                            className="input-field min-h-[80px]"
                            placeholder="הנחיות לתרגול בבית..."
                            value={formData.homework}
                            onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 border-t border-border">
                        <label htmlFor="ns-next-date" className="block text-sm font-medium text-text-primary mb-1">
                            תאריך המפגש הבא (אופציונלי)
                        </label>
                        <input
                            id="ns-next-date"
                            type="date"
                            className="input-field"
                            value={formData.next_session_date}
                            onChange={(e) => setFormData({ ...formData, next_session_date: e.target.value })}
                        />
                        <p className="text-xs text-text-muted mt-1">
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
