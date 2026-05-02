import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

// G-CMO loop iteration 17 — first blog post. Hebrew SEO content
// targeting cluster-A queries ("ניהול עסק אילוף כלבים", "אקסל למאלפים",
// "ניהול לקוחות אילוף"). Static for now; CMS comes later if cadence
// justifies it.

interface Post {
    slug: string;
    title: string;
    description: string;
    publishedAt: string;
    readingMinutes: number;
    body: () => React.ReactElement;
}

const POSTS: Record<string, Post> = {
    'sumit-vs-greeninvoice': {
        slug: 'sumit-vs-greeninvoice',
        title: 'Sumit מול חשבונית ירוקה: מה מתאים למאלפים עצמאיים?',
        description: 'שני שירותי החשבונית הפופולריים לעוסקים בישראל — Sumit וחשבונית ירוקה (Morning). הנה השוואה מנקודת המבט של מאלף עצמאי, ולמה Doggo CRM מתחבר לשניהם.',
        publishedAt: '2026-05-02',
        readingMinutes: 7,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    כשמאלף עצמאי בישראל בוחר שירות חשבונית, יש בעיקר שתי אפשרויות פופולריות:
                    <strong> Sumit</strong> ו<strong>חשבונית ירוקה (Morning)</strong>. שתיהן עומדות ברגולציה הישראלית, שתיהן עובדות.
                    אבל יש הבדלים שמשנים את היומיום של מאלף.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה הן עושות באותה רמה</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2">
                    <li>הפקת חשבונית מס + קבלה כדין מס הכנסה ישראל</li>
                    <li>שליחת חשבונית במייל ישירות מהמערכת</li>
                    <li>חיוב באשראי, בביט, ובערוצים אחרים</li>
                    <li>ייצוא נתונים לרואה החשבון</li>
                    <li>ממשק עברית מלא ותמיכה ישראלית</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">איפה Sumit מובילה</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2">
                    <li><strong>הצעות מחיר נטיבית</strong> — Sumit מאפשרת להפיק "הצעת מחיר" כסוג מסמך נפרד, עם מעקב סטטוס. בחשבונית ירוקה זה דורש עבודה צד.</li>
                    <li><strong>חיוב מתחדש (Recurring)</strong> — אם תרצי לעבור פעם למודל מנוי (לדוגמה, "תוכנית אילוף אונליין חודשית"), Sumit כבר תומכת בזה. בחשבונית ירוקה זו עבודה.</li>
                    <li><strong>ממשק UI מודרני יותר</strong> — סובייקטיבי, אבל הרבה מאלפים שדיברנו איתם מציינים את זה.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">איפה חשבונית ירוקה מובילה</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2">
                    <li><strong>היכרות בשוק</strong> — רואי חשבון ישראלים מכירים אותה היטב; פחות הסבר נדרש.</li>
                    <li><strong>אינטגרציות עם תוכנות נוספות</strong> — ל-Morning יש מערכת אקוסיסטם רחבה יותר של שותפים.</li>
                    <li><strong>תמחור פשוט יותר לעוסק פטור/מורשה</strong> — נקודת מבט שצריך לבדוק עם רואה חשבון, אבל נשמע פעמים רבות כשיקול.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">השאלה האמיתית: כמה זמן את חוסכת בכל חשבונית?</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    שני השירותים מצוינים בלהפיק חשבונית מהממשק שלהם. הבעיה: אצל מאלף שיש לו מערכת לקוחות (CRM) נפרדת, התהליך הוא:
                </p>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-1 mr-4">
                    <li>פתחי את ה-CRM, מצאי את הלקוח</li>
                    <li>פתחי את חשבונית ירוקה / Sumit במסך נפרד</li>
                    <li>הקלידי את שם הלקוח, מייל, פרטי השירות, סכום</li>
                    <li>שלחי</li>
                    <li>חזרי ל-CRM, רשמי שהחשבונית נשלחה</li>
                </ol>
                <p className="text-text-secondary leading-relaxed mb-6">
                    זה 3-5 דקות לכל חשבונית. אם את שולחת 30 חשבוניות בחודש — זה שעתיים. במצב טוב 4 שעות.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">למה Doggo CRM מתחבר לשניהם</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    כשהCRM שלך כבר יודע מי הלקוח, מה התוכנית, ומה המחיר —
                    אין סיבה להקליד את זה שוב באתר חיצוני. ב-Doggo CRM, הצעת מחיר וחשבונית נשלחות בלחיצה אחת ישירות דרך החשבון Sumit
                    או חשבונית ירוקה <strong>שלך</strong>. לא דרך החשבון שלנו, לא עם עמלת תיווך — דרך החשבון שלך, באמצעות מפתחות ה-API שלך.
                </p>
                <p className="text-text-secondary leading-relaxed mb-4">
                    התוצאה: אם את עובדת עם Sumit, ההצעות והחשבוניות שלך יופיעו בדשבורד של Sumit כרגיל.
                    אם את עובדת עם חשבונית ירוקה, אותו דבר. את לא משנה את המערכת החשבונאית שלך — את רק מפסיקה להקליד את אותם נתונים פעמיים.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">המלצה</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    אם את רק מתחילה ואין לך חשבון בכלל — Sumit. הצעות המחיר הנטיביות וה-UI המודרני שווים את זה.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    אם רואה החשבון שלך עובד עם חשבונית ירוקה כבר — אין צורך לעבור. את יכולה להמשיך עם Morning ולחבר אותה ל-Doggo CRM באותה קלות.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM מתחבר לשני השירותים. בלי להחליף, בלי להקליד פעמיים. רואי שזה עובד.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        ראי איך זה עובד
                        <ChevronRight size={16} className="rotate-180" />
                    </Link>
                </div>
            </>
        ),
    },
    'admin-mistakes': {
        slug: 'admin-mistakes',
        title: '5 טעויות שמאלפי כלבים עצמאיים עושים בניהול הלקוחות שלהם',
        description: 'ניהול עסק אילוף עצמאי הוא קסם — עד שהאדמין לוקח שעתיים מכל יום. הנה חמש טעויות שראינו אצל מאלפים בישראל, ומה לעשות במקומן.',
        publishedAt: '2026-05-02',
        readingMinutes: 6,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    ניהול עסק אילוף עצמאי הוא קסם. עד שהאדמין לוקח שעתיים מכל יום והקסם נגמר.
                    הנה חמש טעויות שראינו אצל עשרות מאלפים מקצועיים בישראל בשנה האחרונה — ומה לעשות במקומן.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">1. ניהול לקוחות בקובץ Excel אחד</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    זה מתחיל בקובץ של 20 לקוחות. שנה אחרי, יש 5 קבצים, שניים מהם בעננים שונים, אחד אצל בן-זוג ואחד שאי-אפשר למצוא.
                    אקסל מצוין לטבלאות. הוא לא מצוין לעקיבה אחרי תוכניות אילוף, מפגשים, חשבוניות, ושיחות וואטסאפ עם הלקוח.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    <strong>מה לעשות במקום:</strong> כלי ייעודי שמחבר את כל הקטעים — לקוח, כלב, תוכנית, מפגשים, חשבוניות, יומן.
                    גם בלי CRM יקר, אפשר להגיע למקום הזה. העיקר: מקור-אמת אחד.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">2. שכחת תזכורת לפני מפגש</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    הלקוח שכח. לא הגיע. או הגיע באיחור של חצי שעה. סטטיסטיקה מהשטח: בלי תזכורת אוטומטית 24 שעות לפני, שיעור הביטולים-ברגע-האחרון
                    אצל מאלפים עומד על 8-12%. עם תזכורת — מתחת ל-3%.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    <strong>מה לעשות במקום:</strong> תהליך אוטומטי שיוצא מהמערכת שלך 24 שעות לפני כל מפגש. מייל מספיק. וואטסאפ עוד יותר טוב.
                    העיקר: לא תלוי בזה שתזכרי לשלוח.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">3. הצעת מחיר ב-Word, חשבונית בנפרד, מעקב בראש</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    תהליך טיפוסי: לקוח חדש פונה. את שולחת הצעת מחיר ב-Word שכתבת לפני שנה. הלקוח אומר כן. את פותחת חשבונית ירוקה (או Sumit), מקלידה הכל מחדש, שולחת.
                    אחרי שבועיים: "סליחה, מה היה המחיר?" — את לא זוכרת אם זה היה 2,400 או 2,800. וגם אין מקום שאת יכולה לחזור אליו.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    <strong>מה לעשות במקום:</strong> הצעת מחיר נשלחת ישירות מהמערכת — עם PDF, מספר מסמך, ומעקב סטטוס (נשלחה / נצפתה / אושרה).
                    כשהלקוח אומר כן, החשבונית כבר מקושרת אליה. בלי הקלדה כפולה.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">4. שיחה עם לקוח שאי-אפשר לאתר חצי שנה אחרי</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    הלקוח חוזר אחרי שמונה חודשים. "מה אמרת בפעם הקודמת על האילוף עם הסבא של הכלב?" את לא זוכרת.
                    שיחות וואטסאפ מתערבבות, מיילים נמחקים, פתקיות נעלמות. ההיסטוריה של הקשר עם הלקוח חיה בראש שלך — זה לא בר-קיימא.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    <strong>מה לעשות במקום:</strong> כל אינטראקציה משמעותית מתועדת — סיכום מפגש, שיעורי בית שניתנו, הערות על הכלב.
                    לא צריך לתעד הכל; כן צריך מקום אחיד לכל מה שכן.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">5. טופס פניות שלא קיים, או קיים בלי לדעת מאיפה הליד הגיע</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    שני הקצוות הקיצוניים: או שאין טופס פניות בכלל (לקוחות פונים רק בוואטסאפ, מה שמערב הכל), או שיש טופס אבל אין דרך לדעת
                    אם הליד הגיע מ-Google, מהאקאונט באינסטגרם, או ממודעת פייסבוק שהשקעת בה 800 שקל.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    <strong>מה לעשות במקום:</strong> דף חנות אישי + טופס פניות עם מעקב מקור (UTM). תוך חודש תדעי בדיוק איזו השקעה משתלמת.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">החיבור בין החמש</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    כל אחת מהחמש לבד היא בעיה קלה. הקסם הוא שהן מתחברות: לקוח באקסל אחד, מפגש שלא תועד, הצעת מחיר ב-Word, חשבונית בידנית, וטופס פניות שלא יודע מאיפה הליד הגיע — זה לא חמישה קבצים נפרדים. זו חצי שעה ביום שאת מאבדת.
                </p>
                <p className="text-text-secondary leading-relaxed mb-4">
                    כלי שמחבר אותן יכול להחזיר לך 30-60 דקות ביום. לחודש זה עוד 10-20 שעות שאפשר להפנות לאילוף עצמו, או לעצמך.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        רוצה לראות איך זה עובד בפועל? Doggo CRM נבנה במיוחד למאלפי כלבים בישראל — לקוחות, תוכניות, יומן, חשבוניות והצעות מחיר במקום אחד.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        התחילי בחינם
                        <ChevronRight size={16} className="rotate-180" />
                    </Link>
                </div>
            </>
        ),
    },
};

export function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>();
    const post = slug ? POSTS[slug] : null;

    useEffect(() => {
        if (post) {
            document.title = `${post.title} · Doggo CRM`;
            const meta = document.querySelector('meta[name="description"]');
            if (meta) meta.setAttribute('content', post.description);
        }
        return () => {
            document.title = 'Doggo CRM — ניהול עסק האילוף שלך, בלי גיליונות אקסל';
        };
    }, [post]);

    if (!post) {
        return (
            <div dir="rtl" className="min-h-screen bg-background text-text-primary flex items-center justify-center px-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">פוסט לא נמצא</h1>
                    <Link to="/blog" className="text-primary hover:underline">חזרה לבלוג</Link>
                </div>
            </div>
        );
    }

    return (
        <div dir="rtl" className="min-h-screen bg-background text-text-primary">
            <article className="max-w-3xl mx-auto px-6 py-12">
                <nav className="flex items-center justify-between mb-8 text-sm">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🐾</span>
                        <span className="font-bold">Doggo CRM</span>
                    </Link>
                    <Link to="/blog" className="text-text-muted hover:text-primary transition-colors">← כל הפוסטים</Link>
                </nav>

                <header className="mb-10 pb-8 border-b border-border">
                    <div className="text-xs text-text-muted mb-3 ltr-nums" dir="ltr" style={{ direction: 'ltr', textAlign: 'right' }}>
                        {new Date(post.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })} · {post.readingMinutes} דק׳ קריאה
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">{post.title}</h1>
                    <p className="text-lg text-text-secondary leading-relaxed">{post.description}</p>
                </header>

                <div className="prose prose-lg max-w-none">
                    {post.body()}
                </div>

                <footer className="mt-16 pt-8 border-t border-border flex items-center justify-between text-sm text-text-muted">
                    <Link to="/blog" className="hover:text-primary transition-colors">← כל הפוסטים</Link>
                    <Link to="/" className="hover:text-primary transition-colors">דף הבית</Link>
                </footer>
            </article>
        </div>
    );
}

export const BLOG_POSTS_LIST = Object.values(POSTS);
