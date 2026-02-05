import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices'; // Import hook

export function NewProgramPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedClientId = searchParams.get('client_id');

    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

    const { services } = useServices(); // Fetch services

    const [formData, setFormData] = useState({
        client_id: preselectedClientId || '',
        program_name: '',
        program_type: 'fixed_sessions', // or 'open_ended'
        sessions_included: 5,
        status: 'active',
        price: '', // New field
    });

    // Auto-fill from Service Template
    const handleServiceSelect = (serviceId: string) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            setFormData(prev => ({
                ...prev,
                program_name: service.name,
                price: service.price.toString(),
                program_type: 'fixed_sessions', // Default to fixed?
                sessions_included: 5 // Default?
            }));
        }
    };

    useEffect(() => {
        // Fetch active clients for the dropdown
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
            alert('Error creating program: ' + error.message);
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
            <Link to="/programs" className="flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] mb-6 transition-colors font-bold text-sm group w-fit">
                <ArrowLeft size={18} className="ml-2 rotate-180 group-hover:translate-x-1 transition-transform rtl:-scale-x-100" />
                חזרה לתוכניות
            </Link>

            <div className="card p-8 border-t-4 border-t-[var(--coffee-bean)] shadow-[var(--shadow-float)]">
                <h1 className="text-3xl font-black text-[var(--color-text-main)] mb-2">תוכנית חדשה</h1>
                <p className="text-[var(--color-text-muted)] mb-8 text-sm">הגדר תוכנית אילוף חדשה ללקוח.</p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-[var(--color-text-main)]">
                            לקוח <span className="text-red-400">*</span>
                        </label>
                        <select
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
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-[var(--color-border)]">
                            <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
                                השתמש בתבנית שירות (אופציונלי)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {services.map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleServiceSelect(s.id)}
                                        className="text-xs font-bold px-3 py-1.5 bg-white border border-[var(--color-border)] rounded-full hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
                                    >
                                        {s.name} (₪{s.price})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-[var(--color-text-main)]">
                            שם התוכנית <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="לדוגמה: אילוף גורים, שיקום ריאקטיביות"
                            className="input-field"
                            value={formData.program_name}
                            onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-[var(--color-text-main)]">
                            מחיר התוכנית
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₪</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="input-field pl-8"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-[var(--color-text-main)]">
                            סוג תוכנית
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${formData.program_type === 'fixed_sessions' ? 'bg-[var(--tea-green-light)] border-[var(--color-primary)] shadow-sm' : 'bg-white border-[var(--color-border)] hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="fixed_sessions"
                                    className="scale-125 accent-[var(--color-primary)]"
                                    checked={formData.program_type === 'fixed_sessions'}
                                    onChange={() => setFormData({ ...formData, program_type: 'fixed_sessions' })}
                                />
                                <span className="font-bold">חבילה קבועה</span>
                            </label>
                            <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${formData.program_type === 'open_ended' ? 'bg-[var(--tea-green-light)] border-[var(--color-primary)] shadow-sm' : 'bg-white border-[var(--color-border)] hover:bg-[var(--color-bg-app)]'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="open_ended"
                                    className="scale-125 accent-[var(--color-primary)]"
                                    checked={formData.program_type === 'open_ended'}
                                    onChange={() => setFormData({ ...formData, program_type: 'open_ended' })}
                                />
                                <span className="font-bold">מתמשך / תשלום פר מפגש</span>
                            </label>
                        </div>
                    </div>

                    {formData.program_type === 'fixed_sessions' && (
                        <div className="space-y-1.5 animate-fade-in">
                            <label className="block text-sm font-bold text-[var(--color-text-main)]">
                                מספר מפגשים
                            </label>
                            <input
                                type="number"
                                min="1"
                                required
                                className="input-field"
                                value={formData.sessions_included}
                                onChange={(e) => setFormData({ ...formData, sessions_included: parseInt(e.target.value) })}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-6 border-t border-[var(--color-border)]">
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
                            className="btn btn-primary px-10 shadow-lg shadow-[var(--coffee-bean)]/20"
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
