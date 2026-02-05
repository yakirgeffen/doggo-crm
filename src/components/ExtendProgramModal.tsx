import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

interface ExtendProgramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (sessions: number, price: number) => Promise<void>;
    currentSessions: number | null;
    programName: string;
}

export function ExtendProgramModal({ isOpen, onClose, onConfirm, currentSessions, programName }: ExtendProgramModalProps) {
    const [sessionsToAdd, setSessionsToAdd] = useState(1);
    const [additionalPrice, setAdditionalPrice] = useState(0);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onConfirm(sessionsToAdd, additionalPrice);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
                <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-[var(--color-text-main)]">הרחבת תוכנית</h3>
                    <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full">
                        <X size={20} className="text-[var(--color-text-muted)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="text-sm text-[var(--color-text-muted)] mb-4 bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100">
                        מוסיף מפגשים לתוכנית <strong>{programName}</strong>.
                        <br />
                        ההיסטוריה והנתונים הקיימים יישמרו.
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--color-text-main)]">
                            כמה מפגשים להוסיף?
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSessionsToAdd(Math.max(1, sessionsToAdd - 1))}
                                className="w-10 h-10 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-gray-50 font-bold text-lg shadow-sm"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={sessionsToAdd}
                                onChange={(e) => setSessionsToAdd(parseInt(e.target.value) || 1)}
                                className="input-field text-center font-bold text-lg"
                            />
                            <button
                                type="button"
                                onClick={() => setSessionsToAdd(sessionsToAdd + 1)}
                                className="w-10 h-10 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-gray-50 font-bold text-lg shadow-sm"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            סה"כ יהיו: {currentSessions ? currentSessions + sessionsToAdd : sessionsToAdd} מפגשים
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--color-text-main)]">
                            תוספת למחיר (אופציונלי)
                        </label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute top-1/2 -translate-y-1/2 left-3 text-[var(--color-text-muted)]" />
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={additionalPrice === 0 ? '' : additionalPrice}
                                onChange={(e) => setAdditionalPrice(parseFloat(e.target.value) || 0)}
                                className="input-field pl-10"
                            />
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            המחיר יתווסף לסה"כ של התוכנית
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3 shadow-lg shadow-[var(--primary)]/20"
                        >
                            {loading ? 'מעדכן...' : `הוסף ${sessionsToAdd} מפגשים`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
