import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, CheckCircle, Dog, User, BookOpen, Calculator, Clock } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/toast-context';
import { trackEvent } from '../../lib/analytics';

const TOTAL_STEPS = 3;
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Test key fallback

// G3 — UTM tracking. Build a serialized lead_source string from the
// canonical UTM params in the URL. Pipe-delimited key=value pairs are
// human-readable in admin views and trivially parseable by any future
// reporting surface. Direct-traffic visits (no utm_*) yield null so we
// can distinguish 'no campaign data' from 'campaign data captured'.
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'] as const;

function buildLeadSource(searchParams: URLSearchParams): string | null {
    const parts: string[] = [];
    for (const key of UTM_PARAMS) {
        const value = searchParams.get(key);
        if (value) parts.push(`${key}=${value.slice(0, 200)}`); // cap per-value length defensively
    }
    if (parts.length === 0) {
        const ref = searchParams.get('ref');
        if (ref) parts.push(`ref=${ref.slice(0, 200)}`);
    }
    return parts.length > 0 ? parts.join('|').slice(0, 1000) : null; // overall cap
}

export function PublicIntakePage() {
    const { trainerHandle } = useParams<{ trainerHandle: string }>();
    const [searchParams] = useSearchParams();
    const serviceId = searchParams.get('service');
    const { showToast } = useToast();

    // trainerId is resolved client-side solely to confirm the trainer exists
    // before showing/submitting the form. It is NOT sent to process-intake —
    // the edge function resolves the real user_id server-side from trainerHandle
    // (P0-2 cross-tenant fix 2026-05-17).
    const [trainerId, setTrainerId] = useState<string | null>(null);
    const [trainerNotFound, setTrainerNotFound] = useState(false);
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state.
    // INTENTIONAL ASYMMETRY (CPO 2026-05-03, QA Avner follow-up #4): this form
    // does NOT collect `behavioral_tags`, while the programmatic api-v1
    // `create_intake_submission` endpoint DOES. behavioral_tags is
    // trainer-vocabulary classification populated at conversion; dog-owners
    // self-tagging in their own vocabulary would degrade data quality and
    // bloat the form. Public surface stays simple; trainers tag during
    // initial-conversation conversion. See api-v1/index.ts for the matching
    // comment and `leadership/cpo/decisions-log.md` for the rationale.
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [dogName, setDogName] = useState('');
    const [dogBreed, setDogBreed] = useState('');
    const [dogAge, setDogAge] = useState('');
    const [notes, setNotes] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    // iter 136: Turnstile lifecycle states. Without these, a Turnstile load
    // failure (network blip, bot-detection, domain mismatch) silently leaves
    // the submit button disabled with no feedback — exactly Yakir's demo
    // symptom (2026-05-03). We track 'loading' (widget mounted but no token
    // yet), 'error' (widget reported failure), 'expired' (token aged out)
    // separately so the UI can show meaningful copy + a retry hint.
    const [captchaStatus, setCaptchaStatus] = useState<'loading' | 'ready' | 'error' | 'expired'>('loading');

    const resolveTrainer = useCallback(async () => {
        if (!trainerHandle) return;
        // TG-1: query the security-definer RPC; user_settings is no longer
        // anon-readable as of 2026-05-02 hardening.
        const { data } = await supabase
            .rpc('get_trainer_profile_by_handle', { handle: trainerHandle });

        const profile = Array.isArray(data) ? data[0] : null;
        if (profile) {
            setTrainerId(profile.user_id);
        } else {
            setTrainerNotFound(true);
        }
    }, [trainerHandle]);

    useEffect(() => {
        resolveTrainer();
    }, [resolveTrainer]);

    // Analytics: intake_form_view fires once when the trainer is resolved.
    // Authored 2026-05-17 by Neta (Data IC) — taxonomy entry: Acquisition §intake_form_view.
    useEffect(() => {
        if (!trainerId) return;
        void trackEvent('intake_form_view', {
            trainer_handle: trainerHandle || null,
            service_id: serviceId || null,
        });
    }, [trainerId, trainerHandle, serviceId]);

    // Track first form interaction once per mount (intake_form_start).
    const [hasStarted, setHasStarted] = useState(false);
    useEffect(() => {
        if (hasStarted) return;
        if (fullName.length > 0 || phone.length > 0 || dogName.length > 0) {
            setHasStarted(true);
            void trackEvent('intake_form_start', { trainer_handle: trainerHandle || null });
        }
    }, [fullName, phone, dogName, hasStarted, trainerHandle]);

    const handleSubmit = async () => {
        if (!trainerId) return;

        // iter 136: tightened validation. Removed dead `import.meta.env.PROD`
        // branch (it was a no-op block from initial scaffolding). Token is
        // required regardless of env — the test site key auto-passes in dev.
        if (!captchaToken) {
            // If the widget errored or expired, send a more useful message
            // than the generic "verify you're not a robot".
            if (captchaStatus === 'error') {
                showToast('שגיאה בטעינת אימות הזהות. רעננו את הדף ונסו שוב.', 'error');
            } else if (captchaStatus === 'expired') {
                showToast('אימות הזהות פג תוקף. אנא אשרו שוב.', 'error');
            } else {
                showToast('אנא המתינו לסיום אימות הזהות', 'error');
            }
            return;
        }

        setSubmitting(true);

        try {
            const { error } = await supabase.functions.invoke('process-intake', {
                body: {
                    // P0-2 (2026-05-17): trainer_id removed from request body.
                    // The edge function resolves user_id server-side from trainerHandle.
                    // Sending a client-controlled trainer_id was the cross-tenant
                    // lead-theft vector; trainerHandle is URL-derived and validated
                    // server-side against user_settings.
                    trainerHandle: trainerHandle,
                    full_name: fullName.trim(),
                    phone: phone.trim() || null,
                    dog_name: dogName.trim() || null,
                    dog_breed: dogBreed.trim() || null,
                    dog_age: dogAge.trim() || null,
                    notes: notes.trim() || null,
                    selected_service_id: serviceId || null,
                    captcha_token: captchaToken,
                    lead_source: buildLeadSource(searchParams)
                }
            });

            if (error) throw error;
            setSubmitted(true);

            // Analytics: intake_form_complete — high-priority conversion event.
            // Fires to GA4 + Meta Pixel (Lead) + Meta CAPI + PostHog.
            void trackEvent('intake_form_complete', {
                trainer_handle: trainerHandle || null,
                service_id: serviceId || null,
                lead_source: buildLeadSource(searchParams),
                user_email: null, // public intake form does not collect email
                user_phone: phone.trim() || null,
            });

        } catch (err) {
            console.error('Intake submission error:', err);
            showToast('אירעה שגיאה בשליחה. אנא נסו שוב.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const canAdvanceStep1 = fullName.trim().length > 0;

    if (trainerNotFound) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="flat-card w-full max-w-md p-10 text-center">
                    <div className="text-5xl mb-4">🐾</div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">מאלף לא נמצא</h1>
                    <p className="text-text-secondary">הקישור אינו תקין.</p>
                </div>
            </div>
        );
    }

    // Success screen
    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
                <div className="flat-card w-full max-w-lg p-8 md:p-10 animate-fade-in">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <CheckCircle size={32} className="text-success" />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary mb-2">הפנייה נקלטה 🐾</h1>
                        <p className="text-text-secondary leading-relaxed flex items-center justify-center gap-1.5">
                            <Clock size={14} className="text-text-muted" />
                            תגובה תגיע אליכם תוך 24 שעות.
                        </p>
                    </div>

                    <div className="border-t border-border pt-6 space-y-3">
                        <p className="text-xs font-medium text-text-muted text-center mb-3">בינתיים, כמה דברים שעשויים לעניין:</p>
                        {/* PP-27: removed target="_blank" — /blog and /calculator are internal SPA routes */}
                        <Link
                            to="/blog"
                            className="flat-card p-3 flex items-center gap-3 hover:border-primary transition-colors group"
                        >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                                <BookOpen size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">טיפים לאילוף הכלב</p>
                                <p className="text-xs text-text-muted truncate">בלוג Doggo CRM, 10 פוסטים</p>
                            </div>
                            <ChevronLeft size={16} className="text-text-muted shrink-0" />
                        </Link>
                        <Link
                            to="/calculator"
                            className="flat-card p-3 flex items-center gap-3 hover:border-primary transition-colors group"
                        >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                                <Calculator size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">מחשבון מחירון לאילוף</p>
                                <p className="text-xs text-text-muted truncate">השוואה לפי שעות + הוצאות</p>
                            </div>
                            <ChevronLeft size={16} className="text-text-muted shrink-0" />
                        </Link>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border text-center">
                        <Link
                            to={`/t/${trainerHandle}`}
                            className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1"
                        >
                            <ArrowRight size={14} />
                            חזרה לדף המאלף
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="bg-surface border-b border-border px-4 py-4">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <Link
                        to={`/t/${trainerHandle}`}
                        className="text-sm text-text-muted hover:text-primary flex items-center gap-1 transition-colors"
                    >
                        <ArrowRight size={14} />
                        חזרה
                    </Link>
                    <h1 className="text-sm font-bold text-text-primary">טופס קבלה</h1>
                    <span className="text-xs text-text-muted font-mono ltr-nums">
                        {step}/{TOTAL_STEPS}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="max-w-lg mx-auto mt-3">
                    <div className="h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* Form content */}
            <main className="flex-1 flex items-start justify-center px-4 py-8">
                <div className="w-full max-w-lg">

                    {/* Step 1: Owner Details */}
                    {step === 1 && (
                        <div className="animate-fade-in space-y-6">
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <User size={24} className="text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">פרטי הבעלים</h2>
                                <p className="text-sm text-text-muted mt-1">ספרו לנו מי אתם</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">שם מלא *</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="ישראל ישראלי"
                                    className="w-full rounded-xl border border-border bg-surface p-3 text-text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">טלפון</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="050-1234567"
                                    className="w-full rounded-xl border border-border bg-surface p-3 text-text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Dog Details */}
                    {step === 2 && (
                        <div className="animate-fade-in space-y-6">
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <Dog size={24} className="text-accent" />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">פרטי הכלב</h2>
                                <p className="text-sm text-text-muted mt-1">ספרו לנו על הכלב</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">שם הכלב</label>
                                <input
                                    type="text"
                                    value={dogName}
                                    onChange={(e) => setDogName(e.target.value)}
                                    placeholder="למשל: רקסי"
                                    className="w-full rounded-xl border border-border bg-surface p-3 text-text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">גזע</label>
                                    <input
                                        type="text"
                                        value={dogBreed}
                                        onChange={(e) => setDogBreed(e.target.value)}
                                        placeholder="למשל: גולדן"
                                        className="w-full rounded-xl border border-border bg-surface p-3 text-text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">גיל</label>
                                    <input
                                        type="text"
                                        value={dogAge}
                                        onChange={(e) => setDogAge(e.target.value)}
                                        placeholder="למשל: 3 חודשים"
                                        className="w-full rounded-xl border border-border bg-surface p-3 text-text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">הערות</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="בעיות התנהגות, ניסיון קודם עם מאלפים, מה שחשוב לכם..."
                                    className="w-full rounded-xl border border-border bg-surface p-3 text-text-primary focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none min-h-[100px]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && (
                        <div className="animate-fade-in space-y-6">
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle size={24} className="text-success" />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">אישור פרטים</h2>
                                <p className="text-sm text-text-muted mt-1">בדקו שהכל נכון ושלחו</p>
                            </div>

                            {/* PP-18: edit-back affordance so dog owners can fix typos without blind back-navigation */}
                            <div className="flex justify-end mb-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    עריכת פרטים
                                </button>
                            </div>

                            <div className="flat-card p-5 space-y-4 divide-y divide-border-light">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-text-muted">שם</span>
                                    <span className="text-sm font-medium text-text-primary">{fullName}</span>
                                </div>
                                {phone && (
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-sm text-text-muted">טלפון</span>
                                        <span className="text-sm font-medium text-text-primary ltr-nums" dir="ltr">{phone}</span>
                                    </div>
                                )}
                                {dogName && (
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-sm text-text-muted">שם הכלב</span>
                                        <span className="text-sm font-medium text-text-primary">{dogName}</span>
                                    </div>
                                )}
                                {dogBreed && (
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-sm text-text-muted">גזע</span>
                                        <span className="text-sm font-medium text-text-primary">{dogBreed}</span>
                                    </div>
                                )}
                                {dogAge && (
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-sm text-text-muted">גיל</span>
                                        <span className="text-sm font-medium text-text-primary">{dogAge}</span>
                                    </div>
                                )}
                                {notes && (
                                    <div className="pt-4">
                                        <span className="text-sm text-text-muted block mb-1">הערות</span>
                                        <span className="text-sm text-text-primary whitespace-pre-line">{notes}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center my-4 gap-2">
                                <Turnstile
                                    siteKey={TURNSTILE_SITE_KEY}
                                    onSuccess={(token) => {
                                        setCaptchaToken(token);
                                        setCaptchaStatus('ready');
                                    }}
                                    onError={() => {
                                        setCaptchaToken(null);
                                        setCaptchaStatus('error');
                                    }}
                                    onExpire={() => {
                                        setCaptchaToken(null);
                                        setCaptchaStatus('expired');
                                    }}
                                />
                                {/* iter 136: surface widget status — silent failures
                                    on this widget were the demo-blocker root cause.
                                    "loading" = initial render, "error" = network/bot
                                    blocked, "expired" = token aged out. */}
                                {captchaStatus === 'loading' && (
                                    <p className="text-xs text-text-muted">טוען אימות זהות...</p>
                                )}
                                {captchaStatus === 'error' && (
                                    <p className="text-xs text-error">שגיאה בטעינת אימות הזהות. רעננו את הדף ונסו שוב.</p>
                                )}
                                {captchaStatus === 'expired' && (
                                    <p className="text-xs text-warning">האימות פג תוקף. אנא אשרו שוב.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="text-sm font-medium text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                            >
                                <ChevronRight size={16} />
                                הקודם
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < TOTAL_STEPS ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={step === 1 && !canAdvanceStep1}
                                title={step === 1 && !canAdvanceStep1 ? 'יש להזין שם מלא כדי להמשיך' : undefined}
                                className="btn btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                הבא
                                <ChevronLeft size={16} />
                            </button>
                        ) : (
                            // iter 136: button label changes when waiting on captcha so
                            // a grayed-out "send" no longer reads as a permanently broken
                            // form. Title attribute also surfaces the reason for tooltip.
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !captchaToken}
                                title={
                                    submitting
                                        ? 'שולח טופס'
                                        : !captchaToken
                                            ? captchaStatus === 'error'
                                                ? 'שגיאה באימות זהות. רעננו את הדף'
                                                : captchaStatus === 'expired'
                                                    ? 'אימות פג תוקף. אשרו שוב'
                                                    : 'ממתין לאימות זהות...'
                                            : 'שלח טופס'
                                }
                                className="btn btn-primary flex items-center gap-1.5 bg-success border-success hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting
                                    ? 'שולח...'
                                    : !captchaToken && captchaStatus === 'loading'
                                        ? 'ממתין לאימות...'
                                        : '🐾 שלח טופס'}
                            </button>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center py-4 text-xs text-text-muted border-t border-border-light">
                פועל באמצעות{' '}
                <a
                    href="/?utm_source=intake_footer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                >
                    Doggo CRM
                </a>{' '}
                🐾 · CRM למאלפי כלבים
            </footer>
        </div>
    );
}
