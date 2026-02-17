import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { type Service } from '../../hooks/useServices';

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (service: Partial<Service>) => Promise<void>;
    initialData?: Service | null;
}

const COLORS = [
    '#15803d', // Green (Primary)
    '#0ea5e9', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#64748b', // Slate
];

export function ServiceModal({ isOpen, onClose, onSave, initialData }: ServiceModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('0');
    const [duration, setDuration] = useState('60');
    const [type, setType] = useState<'fixed' | 'open'>('open');
    const [sessionsIncluded, setSessionsIncluded] = useState('1');
    const [color, setColor] = useState(COLORS[0]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description || '');
                setPrice(initialData.price.toString());
                setDuration(initialData.duration_minutes.toString());
                setType(initialData.type);
                setSessionsIncluded(initialData.sessions_included?.toString() || '1');
                setColor(initialData.color || COLORS[0]);
            } else {
                // Reset for new
                setName('');
                setDescription('');
                setPrice('0');
                setDuration('60');
                setType('open');
                setSessionsIncluded('1');
                setColor(COLORS[0]);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                name,
                description: description || undefined,
                price: parseFloat(price),
                duration_minutes: parseInt(duration),
                type,
                sessions_included: type === 'fixed' ? parseInt(sessionsIncluded) : null,
                color,
                currency: 'ILS', // Default for now
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface w-full max-w-lg rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh] animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">
                        {initialData ? 'עריכת שירות' : 'שירות חדש'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-text-secondary hover:bg-background rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    <form id="service-form" onSubmit={handleSubmit} className="space-y-5">

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">שם השירות</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-text-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                                placeholder="לדוגמה: אילוף גורים"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">תיאור (אופציונלי)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-text-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all resize-none h-20"
                                placeholder="מה כלול בשירות?"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">מחיר (₪)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    required
                                    onFocus={e => e.target.select()}
                                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-text-primary focus:ring-2 focus:ring-primary/30 outline-none"
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">משך (דקות)</label>
                                <input
                                    type="number"
                                    min="15"
                                    step="5"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    required
                                    onFocus={e => e.target.select()}
                                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-text-primary focus:ring-2 focus:ring-primary/30 outline-none"
                                />
                            </div>
                        </div>

                        {/* Type Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-text-secondary">סוג שירות</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setType('open')}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${type === 'open'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border bg-background text-text-secondary hover:border-border-dark'
                                        }`}
                                >
                                    מפגשים בודדים
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('fixed')}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${type === 'fixed'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border bg-background text-text-secondary hover:border-border-dark'
                                        }`}
                                >
                                    חבילת מפגשים
                                </button>
                            </div>
                        </div>

                        {/* Sessions Count (Only for fixed) */}
                        {type === 'fixed' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">מספר מפגשים בחבילה</label>
                                <input
                                    type="number"
                                    min="2"
                                    value={sessionsIncluded}
                                    onChange={e => setSessionsIncluded(e.target.value)}
                                    required
                                    onFocus={e => e.target.select()}
                                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-text-primary focus:ring-2 focus:ring-primary/30 outline-none"
                                />
                            </div>
                        )}

                        {/* Color Picker */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">צבע זיהוי</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${color === c ? 'ring-2 ring-offset-2 ring-primary ring-offset-surface' : ''
                                            }`}
                                        style={{ backgroundColor: c }}
                                    >
                                        {color === c && <Check size={14} className="text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-warm/30 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost"
                        disabled={saving}
                    >
                        ביטול
                    </button>
                    <button
                        type="submit"
                        form="service-form"
                        disabled={saving}
                        className="btn btn-primary min-w-[100px]"
                    >
                        {saving ? 'שומר...' : (initialData ? 'שמור שינויים' : 'צור שירות')}
                    </button>
                </div>
            </div>
        </div>
    );
}
