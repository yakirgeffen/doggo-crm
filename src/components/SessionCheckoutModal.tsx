import { MessageCircle, CheckCircle, Calendar, X } from 'lucide-react';
import type { Session } from '../types';

interface SessionCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session;
    clientFirstName: string;
    dogName: string;
    programName: string;
    sessionNumber: number;
    totalSessions: number | null;
}

export function SessionCheckoutModal({
    isOpen,
    onClose,
    session,
    clientFirstName,
    dogName,
    programName,
    sessionNumber,
    totalSessions,
}: SessionCheckoutModalProps) {
    if (!isOpen) return null;

    const progressLabel = totalSessions
        ? `מפגש ${sessionNumber} מתוך ${totalSessions}`
        : `מפגש #${sessionNumber}`;

    const dateLabel = new Date(session.session_date).toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    const whatsappMessage = encodeURIComponent(
        `היי ${clientFirstName}! 🐾\n` +
        `סיכום ${progressLabel}:\n` +
        `📅 ${dateLabel}\n\n` +
        (session.session_notes ? `📝 ${session.session_notes}\n\n` : '') +
        (session.homework ? `📚 *שיעורי בית:*\n${session.homework}\n\n` : '') +
        (session.next_session_date
            ? `📅 מפגש הבא: ${new Date(session.next_session_date).toLocaleDateString('he-IL')}\n\n`
            : '') +
        `נתראה! 🐕`
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-surface rounded-2xl shadow-card w-full max-w-md border border-border overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Success Header */}
                <div className="bg-gradient-to-bl from-success/10 via-primary/5 to-surface border-b border-border px-6 py-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-3 animate-fade-in">
                        <CheckCircle size={28} />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">המפגש תועד! 🎉</h2>
                    <p className="text-sm text-text-muted mt-1">{progressLabel}</p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Summary Card */}
                    <div className="bg-background rounded-xl p-4 space-y-3 border border-border">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-text-muted">לקוח</span>
                            <span className="text-sm font-bold text-text-primary">{clientFirstName} • {dogName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-text-muted">תוכנית</span>
                            <span className="text-sm font-medium text-text-primary">{programName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-text-muted">תאריך</span>
                            <span className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                                <Calendar size={12} />
                                {dateLabel}
                            </span>
                        </div>
                    </div>

                    {/* Notes Preview */}
                    {session.session_notes && (
                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                            <span className="text-xs font-bold text-primary uppercase block mb-1">📝 סיכום</span>
                            <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed line-clamp-4">
                                {session.session_notes}
                            </p>
                        </div>
                    )}

                    {session.homework && (
                        <div className="bg-accent/5 rounded-xl p-4 border border-accent/10">
                            <span className="text-xs font-bold text-accent uppercase block mb-1">📚 שיעורי בית</span>
                            <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed line-clamp-3">
                                {session.homework}
                            </p>
                        </div>
                    )}

                    {session.next_session_date && (
                        <div className="flex items-center gap-2 bg-surface-warm rounded-lg p-3 border border-border">
                            <Calendar size={16} className="text-accent shrink-0" />
                            <span className="text-sm text-text-secondary">
                                מפגש הבא: <strong>{new Date(session.next_session_date).toLocaleDateString('he-IL')}</strong>
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="btn btn-secondary flex-1 flex items-center justify-center gap-2">
                            <X size={16} />
                            סגור
                        </button>
                        <a
                            href={`https://wa.me/?text=${whatsappMessage}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#128C7E] border-none shadow-soft"
                        >
                            <MessageCircle size={16} />
                            שתף בוואטסאפ
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
