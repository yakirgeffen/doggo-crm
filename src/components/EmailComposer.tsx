import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Send, X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { logActivity, supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { sendGmail } from '../lib/gmail';

interface EmailComposerProps {
    clientEmail: string;
    clientName: string;
    dogName: string;
    trainerName?: string;
    entityType: 'client' | 'program';
    entityId: string;
    /**
     * Always the underlying client.id — used to persist a newly-entered email
     * back to the clients row even when entityType === 'program' (where
     * entityId points at the program, not the client).
     */
    clientId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    /**
     * Fired when the recipient email is updated and persisted to the client
     * record. Lets the parent re-fetch its `client.email` so subsequent opens
     * of the modal pre-populate from DB instead of stale prop.
     */
    onClientEmailUpdated?: (newEmail: string) => void;
}

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
}

// Hardcoded fallback templates — surfaced only when the trainer has
// no rows in the public.email_templates table. Once the trainer creates
// their own templates, these are suppressed and only their templates show.
const FALLBACK_TEMPLATES: EmailTemplate[] = [
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

// Lightweight RFC-5322-ish check — same shape Gmail and most clients accept.
// We don't try to validate every legal edge case; we just stop the obvious typos.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailComposer({
    clientEmail,
    clientName,
    dogName,
    entityType,
    entityId,
    clientId,
    trainerName = "המאלף",
    isOpen,
    onClose,
    onSuccess,
    onClientEmailUpdated,
}: EmailComposerProps) {
    const { providerToken } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    // Recipient is a controlled input — pre-populated from the client record
    // and editable. On send we'll persist any new value back to the client.
    const [recipient, setRecipient] = useState(clientEmail);
    const [templates, setTemplates] = useState<EmailTemplate[]>(FALLBACK_TEMPLATES);
    const [templatesLoading, setTemplatesLoading] = useState(false);

    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Reset composer state synchronously on each open transition.
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setSelectedTemplate('');
            setSubject('');
            setBody('');
            // Re-pull the latest client email from the prop on each open so
            // edits made by the auto-save flow propagate when the parent
            // re-opens the modal.
            setRecipient(clientEmail);
            setSuccess(false);
            setError(null);
            setSending(false);
        }
    }

    // Load this trainer's templates from DB on open; fall back to hardcoded
    // starter set if the trainer has 0 rows. Async fetch — setState below
    // resolves after I/O, not synchronously inside the effect.
    useEffect(() => {
        if (!isOpen) return;
        (async () => {
            setTemplatesLoading(true);
            const { data, error: fetchError } = await supabase
                .from('email_templates')
                .select('id, name, subject, body')
                .order('created_at', { ascending: true });

            if (!fetchError && data && data.length > 0) {
                setTemplates(data as EmailTemplate[]);
            } else {
                setTemplates(FALLBACK_TEMPLATES);
            }
            setTemplatesLoading(false);
        })();
    }, [isOpen]);

    const dialogRef = useRef<HTMLDivElement>(null);

    // Focus trap + Escape key — hooks must be called before any early return.
    useEffect(() => {
        if (!isOpen) return;
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
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const trimmedRecipient = recipient.trim();
    const recipientValid = EMAIL_RE.test(trimmedRecipient);
    const recipientIsNew = trimmedRecipient.toLowerCase() !== (clientEmail || '').trim().toLowerCase();
    const subjectFilled = subject.trim().length > 0;
    const bodyFilled = body.trim().length > 0;
    const canSend = recipientValid && subjectFilled && bodyFilled && !sending;

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        setSelectedTemplate(templateId);

        const template = templates.find(t => t.id === templateId);
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

    /**
     * Persists the entered recipient to clients.email when it differs from
     * the existing on-file value. Best-effort: we don't block the email send
     * on the persistence step. If save fails we surface a console warning but
     * still let the user see the success state for the actual delivery.
     */
    const persistRecipientIfNew = async () => {
        if (!recipientIsNew) return;
        const { error: updateErr } = await supabase
            .from('clients')
            .update({ email: trimmedRecipient })
            .eq('id', clientId);
        if (updateErr) {
            console.warn('Failed to persist new client email:', updateErr);
            return;
        }
        await logActivity('client', clientId, 'updated', `כתובת מייל עודכנה: ${trimmedRecipient}`);
        onClientEmailUpdated?.(trimmedRecipient);
    };

    const handleSendRealEmail = async () => {
        if (!providerToken) {
            setError("חסר חיבור ל-Google. כדאי להתחבר מחדש.");
            return;
        }
        if (!recipientValid) {
            setError("כתובת מייל נדרשת");
            return;
        }

        setSending(true);
        setError(null);

        try {
            await sendGmail({
                to: trimmedRecipient,
                subject,
                body,
                token: providerToken
            });

            await logActivity(entityType, entityId, 'email_sent', `אימייל נשלח דרך Gmail: ${subject}`);
            await persistRecipientIfNew();

            setSuccess(true);
            setTimeout(() => {
                onClose();
                onSuccess?.();
            }, 1500);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "שגיאה בשליחת האימייל");
            setSending(false);
        }
    };

    const handleFallbackMailto = () => {
        if (!recipientValid) {
            setError("כתובת מייל נדרשת");
            return;
        }
        const mailtoLink = `mailto:${trimmedRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        logActivity(entityType, entityId, 'email_sent', `נפתח עורך אימייל חיצוני: ${subject}`);
        // Fire-and-forget the persistence — same rationale as the Gmail path.
        void persistRecipientIfNew();
        onClose();
        onSuccess?.();
    };

    // Inline explanation surfaced under the disabled send button so trainers
    // know what's missing. Mirrors the disabled-button audit pattern used in
    // SendQuoteModal. Returns null when the button is enabled.
    const disabledReason: string | null = (() => {
        if (sending) return null;
        if (!recipientValid) return 'יש להזין כתובת מייל תקינה';
        if (!subjectFilled) return 'יש להזין נושא';
        if (!bodyFilled) return 'יש להזין תוכן הודעה';
        return null;
    })();

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="email-composer-title"
                className="bg-surface rounded-xl shadow-elevated w-full max-w-lg overflow-hidden border border-border animate-modal-in"
                onClick={e => e.stopPropagation()}
            >

                {/* Header */}
                <div className="p-5 border-b border-border flex justify-between items-center bg-primary/5">
                    <h3 id="email-composer-title" className="font-bold text-text-primary flex items-center gap-2 text-lg">
                        <Mail size={20} className="text-primary" />
                        כתיבת אימייל
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1 hover:bg-black/5 rounded-lg" aria-label="סגירה">
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
                            {recipientIsNew && (
                                <p className="text-text-muted text-sm mt-2">כתובת המייל נשמרה בכרטיס הלקוח.</p>
                            )}
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

                            {/* Recipient — editable. Pre-populated from client record;
                                anything new gets saved back on send. */}
                            <div>
                                <label htmlFor="email-composer-recipient" className="block text-sm font-medium text-text-primary mb-1.5">
                                    נמען
                                </label>
                                <input
                                    id="email-composer-recipient"
                                    type="email"
                                    dir="ltr"
                                    className="input-field text-start"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder="name@example.com"
                                    autoComplete="email"
                                />
                                {recipientIsNew && recipientValid && (
                                    <p className="text-xs text-text-muted mt-1">
                                        הכתובת תישמר בכרטיס הלקוח לאחר השליחה.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1.5">
                                    תבנית
                                </label>
                                <select
                                    className="input-field"
                                    value={selectedTemplate}
                                    onChange={handleTemplateChange}
                                    disabled={templatesLoading}
                                >
                                    <option value="">{templatesLoading ? 'טוען תבניות...' : 'בחירת תבנית...'}</option>
                                    {templates.map(t => (
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
                                    placeholder="כתיבת ההודעה כאן..."
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
                    <div className="p-5 border-t border-border bg-background space-y-2">
                        <div className="flex justify-between gap-3">
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
                                        disabled={!canSend}
                                        className="btn btn-primary flex items-center gap-2 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        disabled={!recipientValid}
                                        className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ExternalLink size={18} />
                                        פתח במחשב
                                    </button>
                                )}
                            </div>
                        </div>
                        {disabledReason && (
                            <p className="text-xs text-text-muted text-end">{disabledReason}</p>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
