import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useToast } from '../context/toast-context';
import { Spinner } from '../components/Spinner';

export function NewClientPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        primary_dog_name: '',
        primary_dog_breed: '',
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            full_name: formData.full_name,
            email: formData.email || null,
            phone: formData.phone || null,
            primary_dog_name: formData.primary_dog_name || null,
            primary_dog_breed: formData.primary_dog_breed || null,
            notes: formData.notes || null,
        };
        const { data, error } = await supabase.from('clients').insert([payload]).select();

        if (error) {
            // PP-33: show friendly Hebrew message; log technical details to console only
            console.error('Error creating client:', error);
            showToast('שגיאה ביצירת הלקוח — אנא נסו שוב.', 'error');
            setLoading(false);
        } else {
            if (data && data[0]) {
                await logActivity('client', data[0].id, 'created', `לקוח חדש: ${formData.full_name}`);
                // PP-13: navigate directly to the new client's profile page, not the list
                navigate(`/clients/${data[0].id}`);
            } else {
                navigate('/clients');
            }
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
                <p className="text-text-muted mb-8 text-sm">פרטי הלקוח החדש והכלב.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label htmlFor="nc-full-name" className="block text-sm font-medium text-text-primary">
                            שם מלא <span className="text-error">*</span>
                        </label>
                        <input
                            id="nc-full-name"
                            type="text"
                            required
                            placeholder="שם מלא"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <label htmlFor="nc-dog-breed" className="block text-sm font-medium text-text-primary">
                                גזע (אופציונלי)
                            </label>
                            <input
                                id="nc-dog-breed"
                                type="text"
                                placeholder="לדוגמה: לברדור, מעורב"
                                className="input-field"
                                value={formData.primary_dog_breed}
                                onChange={(e) => setFormData({ ...formData, primary_dog_breed: e.target.value })}
                            />
                        </div>
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
                                    <Spinner size="md" className="text-white" />
                                    שומרים...
                                </span>
                            ) : 'יצירת לקוח'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
