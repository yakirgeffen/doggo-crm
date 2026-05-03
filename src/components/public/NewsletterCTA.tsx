import { useState } from 'react';
import { Mail, Check } from 'lucide-react';

interface NewsletterCTAProps {
    source: string;
    title?: string;
    subtitle?: string;
    variant?: 'inline' | 'card';
}

export function NewsletterCTA({ source, title, subtitle, variant = 'card' }: NewsletterCTAProps) {
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [doneState, setDoneState] = useState<'idle' | 'subscribed' | 'already-subscribed' | 'resubscribed' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim().toLowerCase();
        if (!isValidEmail(trimmed)) {
            setErrorMessage('יש להזין כתובת אימייל תקינה');
            setDoneState('error');
            return;
        }
        setSubmitting(true);
        setDoneState('idle');
        setErrorMessage(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe-newsletter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed, source, website }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setErrorMessage(data.error || 'שגיאה בהרשמה. כדאי לנסות שוב.');
                setDoneState('error');
            } else {
                setDoneState(data.status || 'subscribed');
                setEmail('');
            }
        } catch {
            setErrorMessage('שגיאה ברשת. כדאי לנסות שוב.');
            setDoneState('error');
        } finally {
            setSubmitting(false);
        }
    };

    const successMessage =
        doneState === 'subscribed' ? 'נרשמת! נשלח תוכן שימושי על אילוף-עסקי, בלי ספאם.'
        : doneState === 'resubscribed' ? 'ברוכים השבים — חזרתם לרשימה.'
        : doneState === 'already-subscribed' ? 'כבר רשומים — תודה!'
        : null;

    const containerClass = variant === 'card'
        ? 'flat-card p-6 md:p-8 max-w-xl mx-auto'
        : 'border border-border rounded-xl p-5 bg-surface';

    return (
        <div className={containerClass}>
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Mail size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-text-primary">
                        {title || 'רשימת מאלפים בישראל'}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                        {subtitle || 'טיפים שבועיים לניהול עסק אילוף — מחירון, שיווק, לקוחות, תהליכים. בלי ספאם, אפשר להסיר רישום בכל שלב.'}
                    </p>
                </div>
            </div>

            {successMessage ? (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-success/10 text-success text-sm font-medium animate-fade-in">
                    <Check size={18} />
                    {successMessage}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        name="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        autoComplete="off"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="hidden"
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="האימייל שלך"
                        required
                        disabled={submitting}
                        className="input-field flex-1"
                        autoComplete="email"
                    />
                    <button
                        type="submit"
                        disabled={submitting || !email.trim()}
                        className="btn btn-primary px-6 whitespace-nowrap"
                    >
                        {submitting ? 'שולח...' : 'להצטרפות'}
                    </button>
                </form>
            )}

            {doneState === 'error' && errorMessage && (
                <p className="text-xs text-error mt-2 animate-fade-in">{errorMessage}</p>
            )}
        </div>
    );
}
