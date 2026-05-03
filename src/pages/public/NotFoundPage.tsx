import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, BookOpen, Calculator, ChevronLeft } from 'lucide-react';

// Custom 404. Replaces the silent <Navigate to="/"> catch-all that previously
// bounced unknown URLs back to the landing page (per Yakir's catch on
// 2026-05-03 where /pricing on master redirected to /).
//
// Copy: dog-training metaphor per Yakir's suggestion. The system speaks as
// "we" — gender-neutral by default, on-brand for a dog product. Three CTAs
// give visitors a clear way back: home, blog, cost calculator.

export function NotFoundPage() {
    const location = useLocation();

    useEffect(() => {
        const prevTitle = document.title;
        document.title = 'הופה, פקודה שלא הכרנו | Doggo CRM';
        return () => { document.title = prevTitle; };
    }, []);

    const attemptedPath = location.pathname;
    const isObviousTypo = attemptedPath.includes('//') || attemptedPath.endsWith('/.');

    return (
        <div dir="rtl" className="min-h-screen bg-background text-text-primary flex items-center justify-center px-6 py-12">
            <div className="max-w-xl w-full text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 text-primary mb-6 animate-fade-in">
                    <span className="text-5xl" role="img" aria-label="paw print">🐾</span>
                </div>

                <div className="text-xs font-mono text-text-muted ltr-nums mb-4" dir="ltr" style={{ direction: 'ltr', textAlign: 'center' }}>
                    404
                </div>

                <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
                    הופה, זאת פקודה שעוד לא למדנו
                </h1>

                <p className="text-lg text-text-secondary leading-relaxed mb-2">
                    הדף שחיפשתם לא נמצא. לפעמים זה תקלדה בכתובת, לפעמים זה דף שזז למקום אחר.
                </p>

                {!isObviousTypo && attemptedPath !== '/' && (
                    <p className="text-sm text-text-muted mb-8 font-mono dir-ltr break-all" dir="ltr" style={{ direction: 'ltr' }}>
                        {attemptedPath}
                    </p>
                )}

                <p className="text-base text-text-secondary leading-relaxed mb-10">
                    הנה כמה כיוונים מוכרים:
                </p>

                <div className="grid sm:grid-cols-3 gap-3 mb-10">
                    <Link
                        to="/"
                        className="flat-card p-5 hover:border-primary transition-colors group flex flex-col items-center gap-2"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                            <Home size={18} />
                        </div>
                        <span className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                            דף הבית
                        </span>
                    </Link>

                    <Link
                        to="/blog"
                        className="flat-card p-5 hover:border-primary transition-colors group flex flex-col items-center gap-2"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                            <BookOpen size={18} />
                        </div>
                        <span className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                            הבלוג
                        </span>
                    </Link>

                    <Link
                        to="/calculator"
                        className="flat-card p-5 hover:border-primary transition-colors group flex flex-col items-center gap-2"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                            <Calculator size={18} />
                        </div>
                        <span className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                            מחשבון מחירון
                        </span>
                    </Link>
                </div>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    חזרה לדף הבית
                    <ChevronLeft size={14} />
                </Link>
            </div>
        </div>
    );
}
