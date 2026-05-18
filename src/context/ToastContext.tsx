import { useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext, type ToastType } from './toast-context';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

let nextId = 0;

// PP-24: differentiate toast duration by type so error messages stay readable
// success = 3000ms, info = 3500ms, error = 5500ms (Hebrew error strings are often longer)
const TOAST_DURATION: Record<ToastType, number> = {
    success: 3000,
    info: 3500,
    error: 5500,
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = ++nextId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, TOAST_DURATION[type]);
    }, []);

    const dismiss = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const icons = {
        success: <CheckCircle size={18} />,
        error: <AlertCircle size={18} />,
        info: <Info size={18} />,
    };

    const styles = {
        success: 'bg-success text-white',
        error: 'bg-error text-white',
        info: 'bg-primary text-white',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container — fixed bottom center */}
            <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 items-center pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-card text-sm font-medium animate-scale-in pointer-events-auto ${styles[toast.type]}`}
                    >
                        {icons[toast.type]}
                        <span>{toast.message}</span>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="opacity-70 hover:opacity-100 transition-opacity ms-2"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
