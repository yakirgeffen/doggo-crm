import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Calculator, ChevronLeft, AlertTriangle, TrendingUp } from 'lucide-react';
import { NewsletterCTA } from '../../components/public/NewsletterCTA';

// CFO + CMO loop iteration 61 — public free tool. Helps an Israeli dog
// trainer compute the minimum hourly rate they need to charge to hit a
// take-home target after fixed costs, working hours, and tax. The math
// is intentionally simple (back-of-the-envelope) — the lead-gen value is
// not the calculator's accuracy but its existence as a thought trigger.
// anti-bot: em dashes removed from all user-facing labels and disclaimer text.

const fmtIls = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');

export function CostCalculatorPage() {
    const [targetMonthlyTakeHome, setTargetMonthlyTakeHome] = useState<number>(15000);
    const [monthlyFixedCosts, setMonthlyFixedCosts] = useState<number>(2500);
    const [billableHoursPerWeek, setBillableHoursPerWeek] = useState<number>(20);
    const [taxRatePct, setTaxRatePct] = useState<number>(25);
    const [showResult, setShowResult] = useState<boolean>(false);

    useEffect(() => {
        const prevTitle = document.title;
        document.title = 'מחשבון מחירון למאלפי כלבים | Doggo CRM';
        const meta = document.querySelector('meta[name="description"]');
        const prevMeta = meta?.getAttribute('content');
        meta?.setAttribute('content', 'מחשבון חינמי לחישוב המחיר המינימלי לשעת אילוף לפי הוצאות, שעות עבודה ומיסוי. לעצמאים ועוסקים מורשים בישראל.');
        return () => {
            document.title = prevTitle;
            if (prevMeta) meta?.setAttribute('content', prevMeta);
        };
    }, []);

    const calc = useMemo(() => {
        const targetGrossMonthly = targetMonthlyTakeHome / Math.max(0.01, 1 - taxRatePct / 100);
        const requiredMonthlyRevenue = targetGrossMonthly + monthlyFixedCosts;
        const billableHoursPerMonth = Math.max(1, billableHoursPerWeek * 4.33);
        const minHourlyRate = requiredMonthlyRevenue / billableHoursPerMonth;
        const annualGross = requiredMonthlyRevenue * 12;
        return {
            targetGrossMonthly,
            requiredMonthlyRevenue,
            billableHoursPerMonth,
            minHourlyRate,
            annualGross,
        };
    }, [targetMonthlyTakeHome, monthlyFixedCosts, billableHoursPerWeek, taxRatePct]);

    const handleCalculate = () => {
        setShowResult(true);
    };

    return (
        <div dir="rtl" className="min-h-screen bg-background text-text-primary">
            <article className="max-w-3xl mx-auto px-6 py-12">
                <nav className="flex items-center justify-between mb-8 text-sm">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🐾</span>
                        <span className="font-bold">Doggo CRM</span>
                    </Link>
                    <Link to="/blog" className="text-text-muted hover:text-primary transition-colors">← הבלוג</Link>
                </nav>

                <header className="mb-10 pb-8 border-b border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Calculator size={22} />
                        </div>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">כלי חינמי</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
                        מחשבון מחירון לאילוף כלבים
                    </h1>
                    <p className="text-lg text-text-secondary leading-relaxed">
                        כמה שווה להוציא על שעת אילוף? כמה צריך לקחת בשביל להגיע למשכורת היעד שלך? המחשבון נבנה במיוחד לעצמאים ולעוסקים מורשים בישראל.
                    </p>
                </header>

                <section className="flat-card p-6 md:p-8 space-y-5 mb-10">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">משכורת יעד נטו לחודש</label>
                        <p className="text-xs text-text-muted mb-2">כמה רוצים שיישאר בכיס בסוף החודש, אחרי מס.</p>
                        <div className="relative">
                            <span className="absolute end-3 top-3 text-text-muted text-sm">₪</span>
                            <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step={500}
                                value={targetMonthlyTakeHome}
                                onChange={(e) => setTargetMonthlyTakeHome(Number(e.target.value) || 0)}
                                className="input-field text-lg pe-8"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">הוצאות קבועות חודשיות</label>
                        <p className="text-xs text-text-muted mb-2">דלק/רכב, פרסום, ביטוחים, רואה חשבון, ציוד שמתבלה. בלי מס בשלב הזה.</p>
                        <div className="relative">
                            <span className="absolute end-3 top-3 text-text-muted text-sm">₪</span>
                            <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step={100}
                                value={monthlyFixedCosts}
                                onChange={(e) => setMonthlyFixedCosts(Number(e.target.value) || 0)}
                                className="input-field text-lg pe-8"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">שעות עבודה בתשלום בשבוע</label>
                        <p className="text-xs text-text-muted mb-2">רק שעות שמחויבות ללקוח, בלי שיווק, נסיעות או זמינות בהמתנה.</p>
                        <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={60}
                            step={1}
                            value={billableHoursPerWeek}
                            onChange={(e) => setBillableHoursPerWeek(Number(e.target.value) || 0)}
                            className="input-field text-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">שיעור מס משוער</label>
                        <p className="text-xs text-text-muted mb-2">לעצמאים בישראל, ברירת מחדל 25% (משלב הכנסה ומע״מ אפקטיבי). לחישוב מדויק כדאי להתייעץ עם רו״ח.</p>
                        <div className="relative">
                            <span className="absolute end-3 top-3 text-text-muted text-sm">%</span>
                            <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={60}
                                step={1}
                                value={taxRatePct}
                                onChange={(e) => setTaxRatePct(Number(e.target.value) || 0)}
                                className="input-field text-lg pe-8"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCalculate}
                        className="btn btn-primary w-full text-base py-3"
                    >
                        חישוב מחיר השעה המינימלי
                    </button>
                </section>

                {showResult && (
                    <section className="space-y-6 animate-fade-in mb-10">
                        <div className="flat-card p-6 md:p-8 bg-primary/5 border-primary/20">
                            <div className="flex items-center gap-2 mb-3 text-primary">
                                <TrendingUp size={20} />
                                <span className="font-bold text-sm">תוצאות החישוב</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <span className="text-sm text-text-secondary">הכנסה ברוטו נדרשת לחודש</span>
                                    <span className="font-bold text-text-primary ltr-nums">{fmtIls(calc.requiredMonthlyRevenue)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <span className="text-sm text-text-secondary">שעות מחויבות בחודש</span>
                                    <span className="font-bold text-text-primary ltr-nums">{Math.round(calc.billableHoursPerMonth)} שעות</span>
                                </div>
                                <div className="flex justify-between items-center py-3 bg-primary/10 rounded-xl px-3 -mx-3">
                                    <span className="font-bold text-text-primary">מחיר שעה מינימלי</span>
                                    <span className="text-2xl font-black text-primary ltr-nums">{fmtIls(calc.minHourlyRate)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 text-xs text-text-muted">
                                    <span>היקף שנתי משוער</span>
                                    <span className="ltr-nums">{fmtIls(calc.annualGross)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-4 rounded-xl bg-warning/5 border border-warning/20 text-xs text-text-secondary">
                            <AlertTriangle className="text-warning shrink-0 mt-0.5" size={14} />
                            <p>
                                המחשבון מציג רף מינימלי בלבד. הוא לא לוקח בחשבון תחרות מקומית, ניסיון, התמחויות, או ערך נוסף שאתם מציעים (חבילות, מעקב WhatsApp, סדנאות). המחיר בפועל אמור להיות גבוה יותר. לחישוב מסים וביטוח לאומי מדויקים כדאי להתייעץ עם רואה חשבון.
                            </p>
                        </div>

                        <NewsletterCTA
                            source="cost-calculator"
                            title="רוצים עוד כלים כאלה?"
                            subtitle="טיפים מעת לעת על מחירון, שיווק וניהול עסק אילוף. בלי ספאם. אפשר להסיר רישום בכל שלב."
                        />
                    </section>
                )}

                <footer className="mt-12 pt-8 border-t border-border flex items-center justify-between text-sm text-text-muted">
                    <Link to="/blog/pricing-guide" className="hover:text-primary transition-colors flex items-center gap-1">
                        <ChevronLeft size={14} />
                        מדריך מחירון מורחב
                    </Link>
                    <Link to="/" className="hover:text-primary transition-colors">דף הבית</Link>
                </footer>
            </article>
        </div>
    );
}
