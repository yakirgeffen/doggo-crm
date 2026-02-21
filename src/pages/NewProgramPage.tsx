import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import { useToast } from '../context/ToastContext';

export function NewProgramPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const preselectedClientId = searchParams.get('client_id');

    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

    const { services } = useServices();

    const [formData, setFormData] = useState({
        client_id: preselectedClientId || '',
        program_name: '',
        program_type: 'fixed_sessions',
        sessions_included: 5,
        status: 'active',
        price: '',
    });

    const handleServiceSelect = (serviceId: string) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            setFormData(prev => ({
                ...prev,
                program_name: service.name,
                price: service.price.toString(),
                program_type: 'fixed_sessions',
                sessions_included: 5
            }));
        }
    };

    useEffect(() => {
        supabase
            .from('clients')
            .select('id, full_name, primary_dog_name')
            .eq('is_active', true)
            .order('full_name')
            .then(({ data }) => {
                if (data) setClients(data);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            sessions_included: formData.program_type === 'fixed_sessions' ? formData.sessions_included : null,
            price: formData.price ? parseFloat(formData.price) : null,
            currency: 'ILS'
        };

        const { data, error } = await supabase.from('programs').insert([payload]).select();

        if (error) {
            showToast('שגיאה ביצירת תוכנית: ' + error.message, 'error');
            setLoading(false);
        } else {
            if (data && data[0]) {
                await logActivity('program', data[0].id, 'created', `Program "${formData.program_name}" created`);
                await logActivity('client', formData.client_id, 'updated', `Started program: ${formData.program_name}`);
            }
            navigate('/programs');
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <Link to="/programs" className="flex items-center text-text-muted hover:text-text-primary mb-6 transition-colors font-medium text-sm group w-fit">
                <ArrowRight size={18} className="me-2 group-hover:-translate-x-1 transition-transform" />
                חזרה לתוכניות
            </Link>

            <div className="flat-card p-8 border-t-4 border-t-primary shadow-card">
                <h1 className="text-[28px] font-bold text-text-primary mb-2">תוכנית חדשה</h1>
                <p className="text-text-muted mb-8 text-sm">הגדר תוכנית אילוף חדשה ללקוח.</p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-1.5">
                        <label htmlFor="np-client" className="block text-sm font-medium text-text-primary">
                            לקוח <span className="text-error">*</span>
                        </label>
                        <select
                            id="np-client"
                            required
                            className="input-field cursor-pointer"
                            value={formData.client_id}
                            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                        >
                            <option value="">בחר לקוח...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.full_name} ({c.primary_dog_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Service Template Selector */}
                    {services.length > 0 && (
                        <div className="bg-surface-warm p-4 rounded-xl border border-dashed border-border">
                            <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">
                                השתמש בתבנית שירות (אופציונלי)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {services.map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleServiceSelect(s.id)}
                                        className="text-xs font-medium px-3 py-1.5 bg-surface border border-border rounded-lg hover:border-primary hover:text-primary transition-all ltr-nums"
                                    >
                                        {s.name} (₪{s.price})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="np-name" className="block text-sm font-medium text-text-primary">
                            שם התוכנית <span className="text-error">*</span>
                        </label>
                        <input
                            id="np-name"
                            type="text"
                            required
                            placeholder="לדוגמה: אילוף גורים, שיקום ריאקטיביות"
                            className="input-field"
                            value={formData.program_name}
                            onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="np-price" className="block text-sm font-medium text-text-primary">
                            מחיר התוכנית
                        </label>
                        <div className="relative">
                            <span className="absolute start-3 top-2.5 text-text-muted text-sm">₪</span>
                            <input
                                id="np-price"
                                type="number"
                                placeholder="0.00"
                                className="input-field ps-8"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-text-primary">
                            סוג תוכנית
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${formData.program_type === 'fixed_sessions' ? 'bg-primary/5 border-primary shadow-soft' : 'bg-surface border-border hover:bg-surface-warm'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="fixed_sessions"
                                    className="scale-125 accent-primary"
                                    checked={formData.program_type === 'fixed_sessions'}
                                    onChange={() => setFormData({ ...formData, program_type: 'fixed_sessions' })}
                                />
                                <span className="font-medium">חבילה קבועה</span>
                            </label>
                            <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${formData.program_type === 'open_ended' ? 'bg-primary/5 border-primary shadow-soft' : 'bg-surface border-border hover:bg-surface-warm'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="open_ended"
                                    className="scale-125 accent-primary"
                                    checked={formData.program_type === 'open_ended'}
                                    onChange={() => setFormData({ ...formData, program_type: 'open_ended' })}
                                />
                                <span className="font-medium">מתמשך / תשלום פר מפגש</span>
                            </label>
                        </div>
                    </div>

                    {formData.program_type === 'fixed_sessions' && (
                        <div className="space-y-1.5 animate-fade-in">
                            <label htmlFor="np-sessions" className="block text-sm font-medium text-text-primary">
                                מספר מפגשים
                            </label>
                            <input
                                id="np-sessions"
                                type="number"
                                min="1"
                                required
                                className="input-field"
                                value={formData.sessions_included}
                                onChange={(e) => setFormData({ ...formData, sessions_included: parseInt(e.target.value) })}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-6 border-t border-border">
                        <button
                            type="button"
                            onClick={() => navigate('/programs')}
                            className="btn btn-secondary px-8"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary px-10 shadow-card"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                                    יוצר...
                                </span>
                            ) : 'צור תוכנית'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
