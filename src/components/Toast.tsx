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

    return (
        <div className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-in-right max-w-sm w-full
            ${type === 'success' ? 'bg-white border-green-100 text-green-900 shadow-green-900/5' : 'bg-white border-red-100 text-red-900 shadow-red-900/5'}
        `}>
            <div className={`shrink-0 ${type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </div>
            <p className="flex-1 text-sm font-bold">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors opacity-50 hover:opacity-100">
                <X size={16} />
            </button>
        </div>
    );
}
