import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Send, X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'; // Added icons
import { logActivity } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { sendGmail } from '../lib/gmail';

interface EmailComposerProps {
    clientEmail: string;
    clientName: string;
    dogName: string;
    trainerName?: string;
    entityType: 'client' | 'program';
    entityId: string;
    isOpen: boolean;
    onClose: () => void;
}

const TEMPLATES = [
    {
        id: 'welcome',
        name: 'ברוכים הבאים',
        subject: 'ברוכים הבאים לתוכנית האילוף!',
        body: `היי {client_name},

אני מאוד מתרגש/ת להתחיל לעבוד איתך ועם {dog_name}!

הנה מה שצפוי לנו במפגשים הקרובים...

בברכה,
{trainer_name}`
    },
    {
        id: 'followup',
        name: 'סיכום מפגש',
        subject: 'סיכום המפגש שלנו היום',
        body: `היי {client_name},

כל הכבוד על העבודה היום עם {dog_name}.

חשוב לתרגל:
- נושא 1
- נושא 2

נתראה בשבוע הבא!

בברכה,
{trainer_name}`
    },
    {
        id: 'completion',
        name: 'סיום תוכנית',
        subject: 'סיום תוכנית האילוף בהצלחה!',
        body: `היי {client_name},

ברכות על סיום התוכנית! היה תענוג לעבוד איתכם.

אשמח לשמור על קשר,
{trainer_name}`
    }
];

export function EmailComposer({ clientEmail, clientName, dogName, entityType, entityId, trainerName = "המאלף", isOpen, onClose }: EmailComposerProps) {
    const { providerToken } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        setSelectedTemplate(templateId);

        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setSubject(template.subject);
            setBody(template.body
                .replace(/{client_name}/g, clientName)
                .replace(/{dog_name}/g, dogName)
                .replace(/{trainer_name}/g, trainerName || "המאלף")
                .replace(/\[Trainer Name\]/g, trainerName || "המאלף")
            );
        }
    };

    const handleSendRealEmail = async () => {
        if (!providerToken) {
            setError("חסר חיבור ל-Google. נסה להתחבר מחדש.");
            return;
        }

        setSending(true);
        setError(null);

        try {
            // 1. Send via Gmail API
            await sendGmail({
                to: clientEmail,
                subject,
                body,
                token: providerToken
            });

            // 2. Log internally
            await logActivity(entityType, entityId, 'email_sent', `Email sent via Gmail API: ${subject}`);

            setSuccess(true);
            setTimeout(() => {
                onClose();
                window.location.reload(); // Refresh to show log
            }, 1500);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "שגיאה בשליחת האימייל");
            setSending(false);
        }
    };

    const handleFallbackMailto = () => {
        const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        logActivity(entityType, entityId, 'email_sent', `Email launcher opened: ${subject}`);
        onClose();
        window.location.reload();
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[var(--radius-lg)] shadow-2xl w-full max-w-lg overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-[var(--color-border)]">

                {/* Header */}
                <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--tea-green-light)]">
                    <h3 className="font-bold text-[var(--color-text-main)] flex items-center gap-2 text-lg">
                        <Mail size={20} className="text-[var(--coffee-bean)]" />
                        כתיבת אימייל
                    </h3>
                    <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors p-1 hover:bg-black/5 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">

                    {/* Success Message */}
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in-95">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">האימייל נשלח בהצלחה!</h3>
                            <p className="text-gray-500">ההודעה תועדה בתיק הלקוח.</p>
                        </div>
                    ) : (
                        <>
                            {/* Error Banner */}
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-[var(--color-text-main)] mb-1.5">
                                    תבנית
                                </label>
                                <select
                                    className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-white focus:ring-2 focus:ring-[var(--light-blue)] focus:border-transparent transition-all outline-none appearance-none"
                                    value={selectedTemplate}
                                    onChange={handleTemplateChange}
                                >
                                    <option value="">בחר תבנית...</option>
                                    {TEMPLATES.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--color-text-main)] mb-1.5">
                                    נושא
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-md)] focus:ring-2 focus:ring-[var(--light-blue)] focus:border-transparent transition-all outline-none"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="נושא האימייל..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--color-text-main)] mb-1.5">
                                    תוכן ההודעה
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border border-[var(--color-border)] rounded-[var(--radius-md)] min-h-[200px] focus:ring-2 focus:ring-[var(--light-blue)] focus:border-transparent transition-all outline-none resize-none"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="כתוב את ההודעה כאן..."
                                />
                            </div>

                            {!providerToken && (
                                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-xs flex gap-2">
                                    <AlertCircle size={16} />
                                    <p>שים לב: אינך מחובר דרך Google. השליחה תתבצע דרך תוכנת המייל במחשב שלך ולא תתועד אוטומטית.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-5 border-t border-[var(--color-border)] flex justify-between gap-3 bg-[var(--color-bg-app)]/50">
                        <button onClick={handleFallbackMailto} className="btn text-[var(--color-text-muted)] text-sm underline hover:text-primary">
                            שימוש בתוכנת מייל חיצונית
                        </button>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="btn bg-white border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-app)]">
                                ביטול
                            </button>

                            {providerToken ? (
                                <button
                                    onClick={handleSendRealEmail}
                                    disabled={sending}
                                    className="btn btn-primary flex items-center gap-2 min-w-[120px]"
                                >
                                    {sending ? 'שולח...' : (
                                        <>
                                            <Send size={18} />
                                            שלח אימייל
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handleFallbackMailto}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <ExternalLink size={18} />
                                    פתח במחשב
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
