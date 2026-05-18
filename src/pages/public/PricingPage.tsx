import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Check, ChevronLeft, MessageCircle } from 'lucide-react';

// CCO founding-cohort pricing — cycle 6 alignment (TW-003).
// Commercial terms: ₪149/month, ILS bank transfer or Wise, no minimum term,
// no free trial, no card billing. Founding-cohort framing throughout.
// Three-tier structure replaced: only the Working Trainer tier is live.
// Growing Studio tier deferred until multi-trainer architecture is built.
// Promos section removed: "5 founders get Pro free for life" contradicted CCO terms.
// Anti-bot: no em dashes, no banned phrases, varied sentence lengths.

export function PricingPage() {
    useEffect(() => {
        document.title = 'מחירים · Doggo CRM — קבוצת ייסוד, ₪149 לחודש';
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', 'Doggo CRM לקבוצת הייסוד: ₪149 לחודש, העברה בנקאית, ללא התחייבות. כלי ניהול ייעודי למאלפי כלבים בישראל.');
        return () => { document.title = 'Doggo CRM — ניהול עסק האילוף שלך, בלי גיליונות אקסל'; };
    }, []);

    const features = [
        'לקוחות, תוכניות, ומפגשים בלתי מוגבלים',
        'כל האינטגרציות: Google Calendar, Sumit, חשבונית ירוקה, Gmail',
        'הצעות מחיר אוטומטיות דרך Sumit',
        'דף חנות פומבי ללא לוגו Doggo CRM',
        'טופס קבלה פומבי לאתר שלך',
        'מעקב מקור פנייה ודוחות',
        'תמיכה במייל',
    ];

    return (
        <div dir="rtl" className="min-h-screen bg-background text-text-primary">
            <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
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

                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold py-1.5 px-3 rounded-full mb-5">
                        <span>קבוצת ייסוד פתוחה עכשיו</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                        מחיר ישיר. בלי הפתעות.
                    </h1>
                    <p className="text-lg text-text-secondary max-w-xl mx-auto">
                        אנחנו בשלב ייסוד. המאלפים שנכנסים עכשיו מקבלים את המחיר הנמוך ביותר שיהיה אי פעם, ונשארים איתו לאורך זמן.
                    </p>
                </div>

                {/* Pricing card */}
                <div className="flat-card border-primary border-2 shadow-elevated p-8 md:p-10 mb-10 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold py-1 px-4 rounded-full whitespace-nowrap">
                        מחיר ייסוד, מובטח לנצח
                    </div>

                    {/* Price display */}
                    <div className="text-center mb-8 pb-8 border-b border-border">
                        <div className="text-6xl font-black ltr-nums mb-2">₪149</div>
                        <p className="text-text-muted text-sm">לחודש, ללא התחייבות</p>
                        <p className="text-text-secondary text-sm mt-1">תשלום בהעברה בנקאית או Wise. לא נדרש כרטיס אשראי.</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                        {features.map((f, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                                <Check size={16} className="text-primary mt-0.5 shrink-0" />
                                <span className="text-text-secondary">{f}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <div className="text-center">
                        <Link
                            to="/login"
                            className="btn btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2 shadow-elevated"
                        >
                            להצטרף לקבוצת הייסוד
                            <ChevronLeft size={18} />
                        </Link>
                        <p className="text-xs text-text-muted mt-3">
                            לאחר ההרשמה תקבלו פרטי תשלום לביצוע העברה בנקאית.
                        </p>
                    </div>
                </div>

                {/* Founding cohort context */}
                <section className="bg-surface border border-border rounded-2xl p-7 mb-10">
                    <h2 className="text-lg font-bold mb-4">מה זה קבוצת ייסוד?</h2>
                    <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
                        <p>
                            Doggo CRM נבנה עם מאלפים, לא בשבילם. המאלפות שנכנסות עכשיו הן שותפות עיצוב, לא לקוחות בתשלום גבוה.
                        </p>
                        <p>
                            בתמורה לפידבק אמיתי שעוזר לנו לשפר את המוצר, המחיר של ₪149 לחודש הוא המחיר שנשאר איתך. כשהמוצר יגדל והמחיר יעלה לשאר העולם, חברי הייסוד ממשיכים לשלם את אותו הסכום.
                        </p>
                        <p>
                            אין התחייבות. אם זה לא מתאים, עוצרים. פשוט כך.
                        </p>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-16 max-w-2xl mx-auto">
                    <h2 className="text-xl font-bold text-center mb-6">שאלות נפוצות</h2>
                    <div className="space-y-4">
                        <FaqItem
                            q="איך משלמים?"
                            a="העברה בנקאית רגילה לחשבון ישראלי, או Wise למי שמעדיף. פרטי התשלום מגיעים לאחר ההרשמה. אין כרטיס אשראי, אין חיוב אוטומטי."
                        />
                        <FaqItem
                            q="מה קורה אם אני רוצה להפסיק?"
                            a="עוצרים. אין חוזה, אין קנס יציאה, אין תקופת מינימום. כשמחליטים לעצור, מפסיקים להעביר."
                        />
                        <FaqItem
                            q="האם יהיו תכנונות נוספות בעתיד?"
                            a="כן. בעתיד נוסיף תמיכה בסטודיו עם מספר מאלפים ועוד. חברי הייסוד ימשיכו לשלם את המחיר שנרשמו אליו, ולא יושפעו משינויים."
                        />
                        <FaqItem
                            q="האם יש גרסה בחינם?"
                            a="בשלב הייסוד אין גרסה חינמית. המוצר נמצא עדיין בפיתוח פעיל, ואנחנו רוצים להגביל את הגישה לקבוצה קטנה שנותנת פידבק."
                        />
                        <FaqItem
                            q="איך עובד החיבור ל-Sumit וחשבונית ירוקה?"
                            a="במסך ההגדרות מזינים את מפתחות ה-API מהשירות. המערכת יוצרת הצעות מחיר וחשבוניות ישירות דרך החשבון של המאלף, בלי עמלה מצידנו."
                        />
                        <FaqItem
                            q="מה לגבי פרטיות הלקוחות שלי?"
                            a="כל הנתונים מוגנים ב-RLS ברמת בסיס הנתונים. אף מאלף אחר לא יכול לראות את הלקוחות שלך, גם לא בטעות. אנחנו עומדים בדרישות הגנת הפרטיות הישראליות."
                        />
                    </div>
                </section>

                {/* Final CTA */}
                <section className="text-center mb-16">
                    <h2 className="text-2xl font-bold mb-3">
                        מעניין אותך להצטרף?
                    </h2>
                    <p className="text-text-secondary mb-3 text-sm">
                        שני צעדים: נרשמים, ואז מקבלים פרטי תשלום.
                    </p>
                    <Link
                        to="/login"
                        className="btn btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2 shadow-elevated"
                    >
                        להצטרף לקבוצת הייסוד
                        <ChevronLeft size={18} />
                    </Link>
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-text-muted">
                        <MessageCircle size={14} />
                        <span>שאלות? כתבו לנו ב-</span>
                        <a
                            href="mailto:hello@doggocrm.app"
                            className="text-primary hover:underline"
                        >
                            hello@doggocrm.app
                        </a>
                    </div>
                </section>

                <footer className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
                    <Link to="/" className="hover:text-primary transition-colors">חזרה לעמוד הבית</Link>
                    <div className="flex items-center gap-4">
                        <Link to="/privacy" className="hover:text-primary transition-colors">מדיניות פרטיות</Link>
                        <span>·</span>
                        <Link to="/terms" className="hover:text-primary transition-colors">תנאי שימוש</Link>
                        <span>·</span>
                        <Link to="/pricing" className="hover:text-primary transition-colors">מחירים</Link>
                    </div>
                </footer>
            </div>
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
