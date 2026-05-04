import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/Spinner';

export function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
                scopes: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events',
            },
        });
        if (error) {
            console.error('Google OAuth error:', error);
            setError('ההתחברות נכשלה. כדאי לנסות שוב, ובמקרה של בעיה חוזרת לפנות לתמיכה.');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flat-card w-full max-w-md p-10 bg-surface/80 backdrop-blur-sm shadow-elevated relative z-10">
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-4 text-4xl hover:bg-primary/15 transition-colors" title="חזרה לעמוד הבית">
                        🐾
                    </Link>
                    <h1 className="text-[28px] font-bold text-text-primary mb-2">Doggo CRM</h1>
                    <p className="text-text-secondary">מרכז השליטה שלך לאילוף</p>
                    <p className="text-xs text-text-muted mt-2">
                        חדשים? <Link to="/" className="text-primary hover:underline">קראו עוד על Doggo CRM</Link>
                    </p>
                </div>

                {error && (
                    <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 border border-error/20 flex items-start gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-surface border border-border hover:bg-surface-warm text-text-primary font-medium py-3.5 px-4 rounded-xl transition-all shadow-soft group"
                    >
                        {loading ? (
                            <Spinner size="lg" className="text-text-secondary" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>כניסה עם Google</span>
                            </>
                        )}
                    </button>

                </div>

                {/* Legal Links */}
                <div className="mt-8 pt-4 border-t border-border-light text-center">
                    <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
                        <Link to="/privacy" className="hover:text-primary hover:underline transition-colors">
                            מדיניות פרטיות
                        </Link>
                        <span>•</span>
                        <Link to="/terms" className="hover:text-primary hover:underline transition-colors">
                            תנאי שימוש
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
