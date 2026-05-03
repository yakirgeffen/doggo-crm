import { useState } from 'react';
import { Clock, Calendar, CheckCircle, MessageCircle, Pencil } from 'lucide-react';
import type { Session } from '../../types';
import { EditSessionModal } from './EditSessionModal';

interface SessionCardProps {
    session: Session;
    clientFirstName: string;
    programName?: string;
    onChanged?: () => void;
}

export function SessionCard({ session, clientFirstName, programName, onChanged }: SessionCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const whatsappSummary = encodeURIComponent(
        `היי ${clientFirstName}! 👋\n` +
        `סיכום מפגש (${new Date(session.session_date).toLocaleDateString('he-IL')}):\n\n` +
        `${session.session_notes || ''}\n\n` +
        (session.homework ? `📝 *שיעורי בית:*\n${session.homework}\n\n` : '') +
        (session.next_session_date
            ? `נתראה במפגש הבא ב-${new Date(session.next_session_date).toLocaleDateString('he-IL')}! 🐕`
            : 'נתראה!')
    );

    return (
        <div className="flat-card p-5 hover:border-primary transition-colors group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-4">
                    <div className="text-center w-12 shrink-0">
                        <div className="text-xs font-medium text-text-muted leading-none mb-1">
                            {new Date(session.session_date).toLocaleDateString('he-IL', { month: 'short' })}
                        </div>
                        <div className="text-xl font-bold text-text-primary leading-none ltr-nums">
                            {new Date(session.session_date).getDate()}
                        </div>
                    </div>

                    <div>
                        <div className="font-bold text-text-primary">מפגש אילוף</div>
                        <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                            <Clock size={12} />
                            {new Date(session.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {session.next_session_date && (
                    <div className="text-xs font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>הבא: {new Date(session.next_session_date).toLocaleDateString('he-IL')}</span>
                    </div>
                )}
            </div>

            {session.session_notes && (
                <div className="text-sm text-text-primary whitespace-pre-line leading-relaxed mb-3 ps-16">
                    {session.session_notes}
                </div>
            )}

            {session.homework && (
                <div className="ms-16 bg-accent/5 p-3 rounded-lg border border-accent/10 flex gap-3">
                    <CheckCircle size={16} className="text-accent/60 shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-bold text-accent uppercase block mb-0.5">שיעורי בית</span>
                        <span className="text-sm text-text-secondary">{session.homework}</span>
                    </div>
                </div>
            )}

            {/* Action Footer */}
            <div className="mt-4 pt-4 border-t border-border flex justify-end gap-2">
                {onChanged && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-medium text-text-secondary hover:text-primary flex items-center gap-1.5 bg-background hover:bg-surface-warm px-3 py-1.5 rounded-lg transition-colors"
                        title="עריכת מפגש"
                    >
                        <Pencil size={14} />
                        עריכה
                    </button>
                )}
                <a
                    href={`https://wa.me/?text=${whatsappSummary}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-success hover:text-success flex items-center gap-1.5 bg-success/10 hover:bg-success/15 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <MessageCircle size={14} />
                    שיתוף בוואטסאפ
                </a>
            </div>

            {onChanged && programName && (
                <EditSessionModal
                    isOpen={isEditing}
                    onClose={() => setIsEditing(false)}
                    onSaved={onChanged}
                    session={session}
                    programName={programName}
                />
            )}
        </div>
    );
}
