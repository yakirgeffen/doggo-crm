import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dog, Send, Check, Heart } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { supabase } from '../../lib/supabase';

// Turnstile site key - hardcoded for production, env for local dev
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACYYsn_UV1PvI8el';

import { useToast } from '../../context/toast-context';

export function WelcomePage() {
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const trainerId = searchParams.get('t'); // Trainer ID from URL: /welcome?t=uuid

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        dog_name: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaError, setCaptchaError] = useState(false);
    const turnstileRef = useRef<TurnstileInstance>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate CAPTCHA
        if (!captchaToken) {
            setCaptchaError(true);
            return;
        }

        setIsSubmitting(true);
        setCaptchaError(false);

        const payload = {
            ...formData,
            trainer_id: trainerId || null, // Associate with trainer if provided
            captcha_token: captchaToken // Store for potential server-side verification
        };

        const { error } = await supabase.from('intake_submissions').insert([payload]);

        if (error) {
            console.error('Submission error:', error);
            showToast('אופס, משהו השתבש. נסה שוב.', 'error');
            // Reset CAPTCHA on error
            turnstileRef.current?.reset();
            setCaptchaToken(null);
        } else {
            setIsSuccess(true);
        }
        setIsSubmitting(false);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-surface-warm flex items-center justify-center p-6">
                <div className="bg-surface rounded-3xl shadow-elevated p-10 max-w-md w-full text-center animate-fade-in">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check size={40} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-text-primary mb-3">תודה רבה! 🎉</h1>
                    <p className="text-text-secondary text-lg">
                        קיבלנו את הפרטים שלך. ניצור קשר בהקדם!
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-2 text-primary">
                        <Heart size={18} />
                        <span className="text-sm font-medium">נתראה בקרוב</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-surface-warm flex items-center justify-center p-6">
            <div className="bg-surface rounded-3xl shadow-elevated p-8 md:p-10 max-w-lg w-full animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Dog size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-text-primary mb-2">ברוכים הבאים! 🐕</h1>
                    <p className="text-text-muted">ספרו לנו קצת על עצמכם ועל הכלב שלכם</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-1.5">
                            השם שלך <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-lg"
                            placeholder="ישראל ישראלי"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-1.5">
                            טלפון
                        </label>
                        <input
                            type="tel"
                            className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-lg"
                            placeholder="050-1234567"
                            dir="ltr"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-1.5">
                            שם הכלב 🐶
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-lg"
                            placeholder="רקס"
                            value={formData.dog_name}
                            onChange={(e) => setFormData({ ...formData, dog_name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-1.5">
                            איך אפשר לעזור?
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-lg resize-none"
                            placeholder="ספרו לנו מה הייתם רוצים לשפר..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {/* CAPTCHA */}
                    <div className="flex flex-col items-center">
                        <Turnstile
                            ref={turnstileRef}
                            siteKey={TURNSTILE_SITE_KEY}
                            onSuccess={(token) => {
                                setCaptchaToken(token);
                                setCaptchaError(false);
                            }}
                            onError={() => setCaptchaError(true)}
                            onExpire={() => setCaptchaToken(null)}
                        />
                        {captchaError && (
                            <p className="text-danger text-sm mt-2">אנא אשר שאתה לא רובוט</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                    >
                        {isSubmitting ? (
                            'שולח...'
                        ) : (
                            <>
                                <Send size={20} />
                                שליחה
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
