import { Link } from 'react-router-dom';
import { Calendar, Users, Receipt, Sparkles, MessageSquare, ChevronLeft } from 'lucide-react';

// G-CMO direction (2026-05-02 loop iteration) — public trainer-acquisition
// landing page. Surfaces Doggo CRM's value prop to dog-trainer visitors
// landing on the root domain. Single primary CTA (התחל בחינם → /login),
// Hebrew RTL, mobile-first per Israeli market research. Built for trainers
// who arrive via Google search ("CRM למאלפי כלבים").

export function LandingPage() {
    return (
        <div dir="rtl" className="min-h-screen bg-background text-text-primary">
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-transparent to-accent/10 pointer-events-none" />
                <div className="relative max-w-5xl mx-auto px-6 pt-12 pb-20 md:pt-20 md:pb-28">
                    <nav className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-2">
                            <div className="text-3xl">🐾</div>
                            <span className="font-bold text-lg">Doggo CRM</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/pricing" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                מחירים
                            </Link>
                            <Link to="/blog" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                בלוג
                            </Link>
                            <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                כניסה
                            </Link>
                        </div>
                    </nav>

                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold py-1.5 px-3 rounded-full mb-6">
                            <Sparkles size={12} />
                            <span>נבנה במיוחד למאלפי כלבים</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
                            ניהול עסק האילוף שלך —
                            <br />
                            <span className="text-primary">בלי גיליונות אקסל.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl leading-relaxed">
                            לקוחות, תוכניות אילוף, חשבוניות, יומן Google, הצעות מחיר, וטופס פניות פומבי — הכל במקום אחד, בעברית, ומותאם לסמארטפון.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <Link
                                to="/login"
                                className="btn btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2 shadow-elevated hover:shadow-card transition-shadow"
                            >
                                התחל בחינם
                                <ChevronLeft size={18} />
                            </Link>
                            <span className="text-sm text-text-muted">
                                ללא כרטיס אשראי · התחבר עם Google
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value props — three cards */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
                    כל מה שמאלף עצמאי צריך — ושום דבר מיותר
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <ValueCard
                        icon={<Users size={28} />}
                        title="ניהול לקוחות וכלבים"
                        description="כרטיס לקוח עם פרטי הכלב, תוכניות אילוף, היסטוריית מפגשים, ופתקיות אישיות. הכל בלחיצה."
                    />
                    <ValueCard
                        icon={<Calendar size={28} />}
                        title="יומן מסונכרן עם Google"
                        description="כשאת קובעת מפגש במערכת — האירוע נוצר אוטומטית ביומן Google שלך. בלי כפילויות."
                    />
                    <ValueCard
                        icon={<Receipt size={28} />}
                        title="חשבוניות והצעות מחיר"
                        description="חיבור ישיר ל-Sumit וחשבונית ירוקה (Morning). הפק הצעות מחיר ללקוחות בלחיצה אחת — בעברית."
                    />
                </div>
            </section>

            {/* How it works — three steps */}
            <section className="bg-surface-warm py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
                        איך זה עובד?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 md:gap-6 max-w-4xl mx-auto">
                        <Step
                            n={1}
                            title="הירשם דרך Google"
                            description="לחיצה אחת. בלי טפסים, בלי סיסמאות חדשות לזכור."
                        />
                        <Step
                            n={2}
                            title="הוסף לקוחות ושירותים"
                            description="הקטלוג שלך + הלקוחות הקיימים. ייקח לך 10 דקות."
                        />
                        <Step
                            n={3}
                            title="התחל לעבוד"
                            description="קבע מפגשים, שלח הצעות מחיר, עקוב אחרי תוכניות. כל יום, מהמכשיר שלך."
                        />
                    </div>
                </div>
            </section>

            {/* Public storefront pitch */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-xs font-bold py-1.5 px-3 rounded-full mb-4">
                            <MessageSquare size={12} />
                            <span>חדש</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">
                            דף חנות פומבי — שתעזור לך להשיג לקוחות חדשים
                        </h2>
                        <p className="text-text-secondary mb-4 leading-relaxed">
                            כל מאלף מקבל כתובת אישית: <code dir="ltr" className="bg-background px-2 py-0.5 rounded text-sm font-mono">doggocrm.com/t/your-name</code>. שתף את הקישור ב-WhatsApp, ברשתות, ובמודעות — וקבל פניות ישירות למערכת.
                        </p>
                        <ul className="space-y-2 text-sm text-text-secondary">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>מעקב אחרי מקור הפנייה (UTM) — תדע מאיפה כל ליד הגיע.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>טופס מאובטח עם CAPTCHA. בלי ספאם.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>הודעת מייל אוטומטית כשפנייה חדשה מגיעה.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-border rounded-2xl p-6 shadow-card">
                        <div className="bg-surface rounded-xl p-5 shadow-soft">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                    גג
                                </div>
                                <div>
                                    <p className="font-bold text-sm">גיא הגנן</p>
                                    <p className="text-xs text-text-muted">מאלפת מקצועית</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-4">
                                "תרגול זנב וכפיים, אילוף ביות, וטיפול בחרדות — אצלך בבית או אצלי."
                            </p>
                            <button className="w-full bg-primary text-white font-bold py-2.5 rounded-lg text-sm">
                                הזמן פגישת היכרות
                            </button>
                        </div>
                        <p className="text-xs text-text-muted text-center mt-3">
                            כך נראית חנות אישית של מאלף ב-Doggo CRM
                        </p>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="bg-primary text-white py-16">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        מוכן/ה להפסיק לנהל בקבצי וואטסאפ?
                    </h2>
                    <p className="text-white/80 text-lg mb-8">
                        Doggo CRM חינם להתחלה. בלי קליטה ארוכה, בלי שיחות מכירה.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl shadow-elevated hover:shadow-card transition-shadow"
                    >
                        התחל עכשיו
                        <ChevronLeft size={18} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8">
                <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span>🐾</span>
                        <span>Doggo CRM</span>
                        <span className="text-text-muted/60">·</span>
                        <span>נבנה למאלפים בישראל</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                        <Link to="/privacy" className="hover:text-primary transition-colors">מדיניות פרטיות</Link>
                        <span className="text-text-muted/40">·</span>
                        <Link to="/terms" className="hover:text-primary transition-colors">תנאי שימוש</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flat-card p-6 hover:border-primary transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        </div>
    );
}

function Step({ n, title, description }: { n: number; title: string; description: string }) {
    return (
        <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-card">
                {n}
            </div>
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">{description}</p>
        </div>
    );
}
