import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';
import { Link } from 'react-router-dom';

export function NewClientPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        primary_dog_name: '',
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.from('clients').insert([formData]).select();

        if (error) {
            alert('Error creating client: ' + error.message);
            setLoading(false);
        } else {
            if (data && data[0]) {
                await logActivity('client', data[0].id, 'created', `Client ${formData.full_name} added`);
            }
            navigate('/clients');
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <Link to="/clients" className="flex items-center text-text-muted hover:text-text-primary mb-6 transition-colors font-medium text-sm group w-fit">
                <ArrowRight size={18} className="me-2 group-hover:-translate-x-1 transition-transform" />
                חזרה ללקוחות
            </Link>

            <div className="flat-card p-8 border-t-4 border-t-primary shadow-card">
                <h1 className="text-[28px] font-bold text-text-primary mb-2">לקוח חדש</h1>
                <p className="text-text-muted mb-8 text-sm">הזן את פרטי הלקוח החדש והכלב שלו.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label htmlFor="nc-full-name" className="block text-sm font-medium text-text-primary">
                            שם מלא <span className="text-error">*</span>
                        </label>
                        <input
                            id="nc-full-name"
                            type="text"
                            required
                            placeholder="לדוגמה: ישראל ישראלי"
                            className="input-field"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label htmlFor="nc-email" className="block text-sm font-medium text-text-primary">
                                אימייל
                            </label>
                            <input
                                id="nc-email"
                                type="email"
                                placeholder="example@mail.com"
                                className="input-field"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="nc-phone" className="block text-sm font-medium text-text-primary">
                                טלפון
                            </label>
                            <input
                                id="nc-phone"
                                type="tel"
                                placeholder="050-0000000"
                                className="input-field"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="nc-dog-name" className="block text-sm font-medium text-text-primary">
                            שם הכלב
                        </label>
                        <input
                            id="nc-dog-name"
                            type="text"
                            placeholder="לדוגמה: רקסי"
                            className="input-field"
                            value={formData.primary_dog_name}
                            onChange={(e) => setFormData({ ...formData, primary_dog_name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="nc-notes" className="block text-sm font-medium text-text-primary">
                            הערות ראשוניות
                        </label>
                        <textarea
                            id="nc-notes"
                            placeholder="פרטים חשובים על הכלב, התנהגות, מטרות..."
                            className="input-field min-h-[120px]"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-border">
                        <button
                            type="button"
                            onClick={() => navigate('/clients')}
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
                            ) : 'צור לקוח'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
