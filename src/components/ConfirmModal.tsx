// PP-01: Replaces window.confirm() across the app.
// Usage:
//   const [confirm, setConfirm] = useState<ConfirmState | null>(null);
//   <ConfirmModal
//     isOpen={!!confirm}
//     message={confirm?.message ?? ''}
//     confirmLabel={confirm?.confirmLabel}
//     onConfirm={() => { setConfirm(null); confirm?.onConfirm(); }}
//     onCancel={() => setConfirm(null)}
//   />

import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** When true the confirm button renders in error/destructive style */
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    message,
    confirmLabel = 'אישור',
    cancelLabel = 'ביטול',
    destructive = true,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in"
            onClick={onCancel}
        >
            <div
                className="bg-surface rounded-2xl shadow-elevated w-full max-w-sm border border-border animate-modal-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed pt-1.5">
                            {message}
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-secondary flex-1"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`flex-1 btn ${destructive ? 'bg-error hover:bg-error/90 text-white' : 'btn-primary'}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
