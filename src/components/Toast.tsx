import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'border-success/20 shadow-[0_4px_12px_rgba(90,125,88,0.08)]',
        error: 'border-error/20 shadow-[0_4px_12px_rgba(184,92,92,0.08)]',
    };

    const iconStyles = {
        success: 'text-success',
        error: 'text-error',
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`
            flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border animate-slide-in-right max-w-sm w-full
            ${styles[type]}
        `}>
            <div className={`shrink-0 ${iconStyles[type]}`}>
                {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </div>
            <p className="flex-1 text-sm font-medium text-text-primary">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-background rounded-lg transition-colors text-text-muted hover:text-text-primary">
                <X size={16} />
            </button>
        </div>
    );
}
