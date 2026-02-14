import { useState, useEffect, useRef, useCallback } from 'react';
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

    const dialogRef = useRef<HTMLDivElement>(null);

    // Focus trap + Escape key — IS 5568
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') { onClose(); return; }
        if (e.key !== 'Tab' || !dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="extend-program-title"
                className="bg-surface rounded-xl w-full max-w-sm shadow-elevated overflow-hidden"
            >
                <div className="p-4 border-b border-border flex justify-between items-center bg-surface-warm">
                    <h3 id="extend-program-title" className="font-bold text-lg text-text-primary">הרחבת תוכנית</h3>
                    <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg" aria-label="סגור">
                        <X size={20} className="text-text-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="text-sm text-text-muted mb-4 bg-accent/10 text-accent p-3 rounded-xl border border-accent/15">
                        מוסיף מפגשים לתוכנית <strong>{programName}</strong>.
                        <br />
                        ההיסטוריה והנתונים הקיימים יישמרו.
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            כמה מפגשים להוסיף?
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSessionsToAdd(Math.max(1, sessionsToAdd - 1))}
                                className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-surface-warm font-bold text-lg shadow-soft"
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
                                className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-surface-warm font-bold text-lg shadow-soft"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-text-muted ltr-nums">
                            סה"כ יהיו: {currentSessions ? currentSessions + sessionsToAdd : sessionsToAdd} מפגשים
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            תוספת למחיר (אופציונלי)
                        </label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-text-muted" />
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={additionalPrice === 0 ? '' : additionalPrice}
                                onChange={(e) => setAdditionalPrice(parseFloat(e.target.value) || 0)}
                                className="input-field ps-10"
                            />
                        </div>
                        <p className="text-xs text-text-muted">
                            המחיר יתווסף לסה"כ של התוכנית
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3 shadow-card"
                        >
                            {loading ? 'מעדכן...' : `הוסף ${sessionsToAdd} מפגשים`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
