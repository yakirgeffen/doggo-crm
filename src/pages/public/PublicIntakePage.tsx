import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, CheckCircle, Dog, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TOTAL_STEPS = 3;

// Turnstile Component


function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Test key fallback

    useEffect(() => {
        if (containerRef.current && (window as any).turnstile) {
            // @ts-ignore
            const widgetId = (window as any).turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => onVerify(token),
            });
            return () => {
                if ((window as any).turnstile && widgetId) (window as any).turnstile.reset(widgetId);
            };
        } else {
            // If script isn't loaded yet, loop to check
            const interval = setInterval(() => {
                if ((window as any).turnstile && containerRef.current) {
                    clearInterval(interval);
                    // @ts-ignore
                    (window as any).turnstile.render(containerRef.current, {
                        sitekey: siteKey,
                        callback: (token: string) => onVerify(token),
                    });
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [onVerify, siteKey]);

    return (
        <div className="flex justify-center my-4">
            <div ref={containerRef} />
        </div>
    );
}

export function PublicIntakePage() {
    const { trainerHandle } = useParams<{ trainerHandle: string }>();
    const [searchParams] = useSearchParams();
    const serviceId = searchParams.get('service');

    const [trainerId, setTrainerId] = useState<string | null>(null);
    const [trainerNotFound, setTrainerNotFound] = useState(false);
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [dogName, setDogName] = useState('');
    const [dogBreed, setDogBreed] = useState('');
    const [dogAge, setDogAge] = useState('');
    const [notes, setNotes] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    useEffect(() => {
        if (!trainerHandle) return;
        resolveTrainer();
    }, [trainerHandle]);

    const resolveTrainer = async () => {
        const { data } = await supabase
            .from('user_settings')
            .select('user_id')
            .eq('trainer_handle', trainerHandle)
            .single();

        if (data) {
            setTrainerId(data.user_id);
        } else {
            setTrainerNotFound(true);
        }
    };

    const handleSubmit = async () => {
        if (!trainerId) return;

        // Basic validation
        if (!captchaToken && import.meta.env.PROD) { // Only enforce strict captcha in PROD or if key exists
            // Actually, we should enforce it if the widget is present.
            // For dev, if we use test key, we get a token.
            // So we should require it.
        }

        if (!captchaToken) {
            alert('אנא אשרו אינכם רובוט');
            return;
        }

        setSubmitting(true);

        try {
            const { error } = await supabase.functions.invoke('process-intake', {
                body: {
                    trainer_id: trainerId,
                    full_name: fullName.trim(),
                    phone: phone.trim() || null,
                    dog_name: dogName.trim() || null,
                    dog_breed: dogBreed.trim() || null,
                    dog_age: dogAge.trim() || null,
                    notes: notes.trim() || null,
                    selected_service_id: serviceId || null,
                    captcha_token: captchaToken
                }
            });

            if (error) throw error;
            setSubmitted(true);

        } catch (err: any) {
            console.error('Intake submission error:', err);
            alert('אירעה שגיאה בשליחה. אנא נסו שוב.');
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
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="flat-card w-full max-w-md p-10 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <CheckCircle size={32} className="text-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">הטופס נשלח בהצלחה! 🎉</h1>
                    <p className="text-text-secondary mb-6">המאלף יצור איתכם קשר בהקדם.</p>
                    <Link
                        to={`/t/${trainerHandle}`}
                        className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1"
                    >
                        <ArrowRight size={14} />
                        חזרה לדף המאלף
                    </Link>
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
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle size={24} className="text-success" />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">אישור פרטים</h2>
                                <p className="text-sm text-text-muted mt-1">בדקו שהכל נכון ושלחו</p>
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

                            <TurnstileWidget onVerify={setCaptchaToken} />
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
                                className="btn btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                הבא
                                <ChevronLeft size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !captchaToken}
                                className="btn btn-primary flex items-center gap-1.5 bg-success border-success hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'שולח...' : '🐾 שלח טופס'}
                            </button>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center py-4 text-xs text-text-muted border-t border-border-light">
                פועל באמצעות <span className="font-medium">Doggo CRM</span> 🐾
            </footer>
        </div>
    );
}
