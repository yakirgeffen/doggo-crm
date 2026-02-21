import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Send, X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
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
    onSuccess?: () => void;
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

export function EmailComposer({ clientEmail, clientName, dogName, entityType, entityId, trainerName = "המאלף", isOpen, onClose, onSuccess }: EmailComposerProps) {
    const { providerToken } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedTemplate('');
            setSubject('');
            setBody('');
            setSuccess(false);
            setError(null);
            setSending(false);
        }
    }, [isOpen]);

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
            await sendGmail({
                to: clientEmail,
                subject,
                body,
                token: providerToken
            });

            await logActivity(entityType, entityId, 'email_sent', `Email sent via Gmail API: ${subject}`);

            setSuccess(true);
            setTimeout(() => {
                onClose();
                onSuccess?.();
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
        onSuccess?.();
    };

    const dialogRef = useRef<HTMLDivElement>(null);

    // Focus trap + Escape key — IS 5568
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-fade-in">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="email-composer-title"
                className="bg-surface rounded-xl shadow-elevated w-full max-w-lg overflow-hidden border border-border"
            >

                {/* Header */}
                <div className="p-5 border-b border-border flex justify-between items-center bg-primary/5">
                    <h3 id="email-composer-title" className="font-bold text-text-primary flex items-center gap-2 text-lg">
                        <Mail size={20} className="text-primary" />
                        כתיבת אימייל
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1 hover:bg-black/5 rounded-lg" aria-label="סגור">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">

                    {/* Success Message */}
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-success/10 text-success rounded-lg flex items-center justify-center mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">האימייל נשלח בהצלחה!</h3>
                            <p className="text-text-muted">ההודעה תועדה בתיק הלקוח.</p>
                        </div>
                    ) : (
                        <>
                            {/* Error Banner */}
                            {error && (
                                <div className="bg-error/10 text-error p-3 rounded-lg text-sm flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1.5">
                                    תבנית
                                </label>
                                <select
                                    className="input-field"
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
                                <label className="block text-sm font-medium text-text-primary mb-1.5">
                                    נושא
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="נושא האימייל..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1.5">
                                    תוכן ההודעה
                                </label>
                                <textarea
                                    className="input-field min-h-[200px] resize-none"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="כתוב את ההודעה כאן..."
                                />
                            </div>

                            {!providerToken && (
                                <div className="bg-warning/10 text-warning p-3 rounded-lg text-xs flex gap-2">
                                    <AlertCircle size={16} />
                                    <p>שים לב: אינך מחובר דרך Google. השליחה תתבצע דרך תוכנת המייל במחשב שלך ולא תתועד אוטומטית.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-5 border-t border-border flex justify-between gap-3 bg-background">
                        <button onClick={handleFallbackMailto} className="btn text-text-muted text-sm underline hover:text-primary">
                            שימוש בתוכנת מייל חיצונית
                        </button>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="btn btn-secondary">
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
