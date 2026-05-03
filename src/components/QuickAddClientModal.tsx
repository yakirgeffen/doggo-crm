import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Dog, User, Phone } from 'lucide-react';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { useToast } from '../context/toast-context';
import { Spinner } from './Spinner';

interface QuickAddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickAddClientModal({ isOpen, onClose }: QuickAddClientModalProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [dogName, setDogName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ownerName.trim() || !user) return;

        setSaving(true);
        const { data, error } = await supabase
            .from('clients')
            .insert([{
                full_name: ownerName.trim(),
                primary_dog_name: dogName.trim() || null,
                phone: phone.trim() || null,
                is_active: true,
                user_id: user.id,
            }])
            .select('id')
            .single();

        setSaving(false);

        if (error) {
            console.error('Error adding client:', error);
            showToast('שגיאה בהוספת הלקוח', 'error');
            return;
        }

        if (data) {
            await logActivity('client', data.id, 'created', `לקוח חדש (הוספה מהירה): ${ownerName.trim()}`);
            onClose();
            navigate(`/clients/${data.id}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative flat-card w-full max-w-md p-6 shadow-elevated animate-modal-in">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Dog size={20} className="text-primary" />
                        לקוח חדש — מהיר
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-text-primary transition-colors p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="qac-dog-name" className="block text-sm font-medium text-text-primary flex items-center gap-1.5">
                            <Dog size={14} className="text-text-muted" />
                            שם הכלב
                        </label>
                        <input
                            id="qac-dog-name"
                            type="text"
                            value={dogName}
                            onChange={(e) => setDogName(e.target.value)}
                            placeholder="למשל: רקסי"
                            className="input-field"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="qac-owner-name" className="block text-sm font-medium text-text-primary flex items-center gap-1.5">
                            <User size={14} className="text-text-muted" />
                            שם הבעלים <span className="text-error">*</span>
                        </label>
                        <input
                            id="qac-owner-name"
                            type="text"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            placeholder="שם מלא"
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="qac-phone" className="block text-sm font-medium text-text-primary flex items-center gap-1.5">
                            <Phone size={14} className="text-text-muted" />
                            טלפון
                        </label>
                        <input
                            id="qac-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="050-1234567"
                            className="input-field ltr-nums"
                            dir="ltr"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !ownerName.trim()}
                            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Spinner size="md" />
                                    <span>שומרים...</span>
                                </>
                            ) : (
                                <>
                                    <Dog size={16} />
                                    <span>הוספת לקוח</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
