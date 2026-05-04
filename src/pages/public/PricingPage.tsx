import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Check, X, Sparkles, ChevronLeft } from 'lucide-react';

// CCO + CMO loop iteration 2 — pricing surface for trainer-acquisition.
// Hebrew RTL. Three tiers: Free / Pro / Business per the strategic
// synthesis at meetings/active/2026-05-02-doggo-crm-strategic-synthesis.md.
// Tier prices and promos are recommendations pending Yakir's business-
// model ratification; until ratified, the buttons all route to /login
// (signup is free anyway — paid-tier billing wires in when ratified).

interface Tier {
    name: string;
    tagline: string;
    price: string;
    priceSubtitle: string;
    cta: string;
    highlight?: boolean;
    features: { label: string; included: boolean }[];
}

const TIERS: Tier[] = [
    {
        name: 'Solo Starter',
        tagline: 'התחלה חינם — לבחון ולהרגיש את המערכת',
        price: 'חינם',
        priceSubtitle: 'לעולם',
        cta: 'להתחיל בחינם',
        features: [
            { label: 'עד 10 לקוחות פעילים', included: true },
            { label: 'מאלף יחיד', included: true },
            { label: 'ניהול לקוחות, תוכניות, ומפגשים', included: true },
            { label: 'דף חנות פומבי + טופס פניות', included: true },
            { label: 'סנכרון יומן Google', included: true },
            { label: 'תוכנית שירותים בלתי מוגבלת', included: false },
            { label: 'חיבור Sumit / חשבונית ירוקה', included: false },
            { label: 'הצעות מחיר אוטומטיות', included: false },
            { label: 'הסרת לוגו Doggo CRM מהחנות', included: false },
        ],
    },
    {
        name: 'Working Trainer',
        tagline: 'למאלפים פעילים — ההגדרה הסטנדרטית',
        price: '₪119',
        priceSubtitle: 'לחודש · ₪1,190 לשנה (חודשיים מתנה)',
        cta: 'להתחלת ניסיון 30 יום',
        highlight: true,
        features: [
            { label: 'לקוחות, תוכניות, ומפגשים בלתי מוגבלים', included: true },
            { label: 'מאלף יחיד', included: true },
            { label: 'כל האינטגרציות: Google Calendar, Sumit, חשבונית ירוקה, Gmail', included: true },
            { label: 'הצעות מחיר אוטומטיות דרך Sumit', included: true },
            { label: 'דף חנות פומבי ללא לוגו Doggo CRM', included: true },
            { label: 'מעקב מקור פנייה (UTM) ודוחות', included: true },
            { label: 'תוכנית שירותים בלתי מוגבלת', included: true },
            { label: 'תמיכה במייל', included: true },
            { label: 'דומיין מותאם אישית', included: false },
        ],
    },
    {
        name: 'Growing Studio',
        tagline: 'לסטודיו עם מספר מאלפים',
        price: '₪249',
        priceSubtitle: 'לחודש · ₪2,490 לשנה',
        cta: 'אנחנו במרחק שיחה',
        features: [
            { label: 'הכל מ-Working Trainer', included: true },
            { label: 'מאלפים מרובים בארגון אחד', included: true },
            { label: 'דומיין מותאם אישית לחנות', included: true },
            { label: 'תמיכה בעדיפות גבוהה', included: true },
            { label: 'דוחות מתקדמים', included: true },
            { label: 'הדרכת התקנה ייחודית', included: true },
            { label: 'מנהל הצלחת לקוח ייעודי', included: false },
            { label: 'SLA חוזה מותאם', included: false },
        ],
    },
];

export function PricingPage() {
    useEffect(() => {
        document.title = 'מחירים · Doggo CRM — חינם להתחיל, 119 ש״ח/חודש לתוכנית מלאה';
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', 'תמחור פשוט: חינם להתחלה (עד 10 לקוחות), Working Trainer 119 ש״ח/חודש לתוכנית בלתי מוגבלת, Growing Studio 249 ש״ח/חודש למרובי-מאלפים. ניסיון 30 יום חינם.');
        return () => { document.title = 'Doggo CRM — ניהול עסק האילוף שלך, בלי גיליונות אקסל'; };
    }, []);

    return (
        <div dir="rtl" className="min-h-screen bg-background text-text-primary">
            <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
                <nav className="flex items-center justify-between mb-12">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="text-3xl">🐾</div>
                        <span className="font-bold text-lg">Doggo CRM</span>
                    </Link>
                    <Link
                        to="/login"
                        className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                    >
                        כניסה
                    </Link>
                </nav>

                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold py-1.5 px-3 rounded-full mb-4">
                        <Sparkles size={12} />
                        <span>תמחור פשוט · בלי אותיות קטנות</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
                        מחיר שמתאים לכל שלב בעסק
                    </h1>
                    <p className="text-lg text-text-secondary">
                        להתחיל בחינם. לשדרג רק כשהעסק גדל.
                    </p>
                </div>

                {/* Tier grid */}
                <div className="grid md:grid-cols-3 gap-8 md:gap-6 mb-12 pt-3">
                    {TIERS.map(tier => (
                        <div
                            key={tier.name}
                            className={`relative flat-card p-6 flex flex-col ${tier.highlight ? 'border-primary border-2 shadow-elevated' : ''}`}
                        >
                            {tier.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold py-1 px-3 rounded-full whitespace-nowrap">
                                    הכי פופולרי
                                </div>
                            )}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                                <p className="text-xs text-text-muted">{tier.tagline}</p>
                            </div>
                            <div className="mb-6 pb-6 border-b border-border">
                                <div className={`text-4xl font-black mb-1 ${/^[\d₪]/.test(tier.price) ? 'ltr-nums' : ''}`}>{tier.price}</div>
                                <p className="text-xs text-text-muted leading-relaxed">{tier.priceSubtitle}</p>
                            </div>
                            <ul className="space-y-2.5 mb-8 flex-1">
                                {tier.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        {f.included ? (
                                            <Check size={16} className="text-primary mt-0.5 shrink-0" />
                                        ) : (
                                            <X size={16} className="text-text-muted/40 mt-0.5 shrink-0" />
                                        )}
                                        <span className={f.included ? 'text-text-secondary' : 'text-text-muted/60 line-through'}>
                                            {f.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/login"
                                className={`btn ${tier.highlight ? 'btn-primary' : 'btn-secondary'} w-full text-center flex items-center justify-center gap-2`}
                            >
                                {tier.cta}
                                <ChevronLeft size={16} />
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Promos */}
                <section className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-8 md:p-10">
                    <h2 className="text-2xl font-bold text-center mb-8">מבצעים פעילים</h2>
                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        <PromoCard
                            title="ניסיון חינם 30 יום"
                            description="כל המאלפים מקבלים גישה מלאה לתוכנית Working Trainer ל-30 יום. בלי כרטיס אשראי בהרשמה."
                        />
                        <PromoCard
                            title="הנחה שנתית"
                            description="תשלום שנתי מקדמי = שני חודשים חינם. לפי החיוב היומי, נחסכים לך עשרות שקלים בחודש."
                        />
                        <PromoCard
                            title="הפניית חבר"
                            description="לכל מאלף שמצטרף בעקבותיכם — חודש Pro חינם נוסף. אין הגבלה."
                        />
                        <PromoCard
                            title="חברי-יסוד"
                            description="חמשת המאלפים הראשונים שיצטרפו ויספקו פידבק ייעודי — Pro חינם לכל החיים."
                        />
                    </div>
                </section>

                {/* FAQ */}
                <section className="mt-16 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8">שאלות נפוצות</h2>
                    <div className="space-y-4">
                        <FaqItem
                            q="האם נדרש כרטיס אשראי כדי להתחיל?"
                            a="לא. ההרשמה והתוכנית החינמית לא דורשות כרטיס אשראי. שדרוג ל-Pro דורש פרטי תשלום רק בשלב השדרוג עצמו."
                        />
                        <FaqItem
                            q="מה קורה אחרי 30 יום של הניסיון?"
                            a="ללא שדרוג, החשבון יחזור לתוכנית Solo Starter (חינם, עד 10 לקוחות פעילים). הנתונים נשמרים תמיד."
                        />
                        <FaqItem
                            q="איך עובד החיבור ל-Sumit וחשבונית ירוקה?"
                            a="במסך ההגדרות יש להזין את מפתחות ה-API מהשירות. המערכת יוצרת הצעות מחיר וחשבוניות ישירות דרך החשבון של המאלף — בלי עמלה מצידנו."
                        />
                        <FaqItem
                            q="מה לגבי פרטיות הלקוחות שלי?"
                            a="כל הנתונים מוגנים ב-RLS (Row Level Security) ברמת בסיס הנתונים. אף מאלף אחר לא יכול לראות את הלקוחות שלך, גם לא בטעות. אנחנו עומדים בדרישות הגנת הפרטיות הישראליות."
                        />
                        <FaqItem
                            q="האם המערכת מתאימה לאקדמיות אילוף עם מספר מאלפים?"
                            a="תוכנית Growing Studio נבנתה במיוחד לכך. כל מאלף יקבל כניסה משלו, וניהול ההרשאות מרוכז. אם זה מתאים — אנחנו במרחק הודעה."
                        />
                    </div>
                </section>

                {/* Final CTA */}
                <section className="mt-20 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        אפשר להתחיל?
                    </h2>
                    <p className="text-text-secondary mb-6">
                        הרשמה חינם · שדרוג רק לפי החלטה
                    </p>
                    <Link
                        to="/login"
                        className="btn btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2 shadow-elevated"
                    >
                        להתחיל בחינם
                        <ChevronLeft size={18} />
                    </Link>
                </section>

                <footer className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
                    <Link to="/" className="hover:text-primary transition-colors">← חזרה לעמוד הבית</Link>
                    <div className="flex items-center gap-4">
                        <Link to="/privacy" className="hover:text-primary transition-colors">מדיניות פרטיות</Link>
                        <span>·</span>
                        <Link to="/terms" className="hover:text-primary transition-colors">תנאי שימוש</Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}

function PromoCard({ title, description }: { title: string; description: string }) {
    return (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-soft">
            <h3 className="font-bold text-base mb-2 text-primary">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        </div>
    );
}

function FaqItem({ q, a }: { q: string; a: string }) {
    return (
        <details className="group bg-surface border border-border rounded-xl p-5 hover:border-primary/40 transition-colors">
            <summary className="font-bold text-base cursor-pointer list-none flex items-center justify-between">
                <span>{q}</span>
                <span className="text-text-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">{a}</p>
        </details>
    );
}
