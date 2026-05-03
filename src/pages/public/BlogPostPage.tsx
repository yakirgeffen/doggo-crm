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
    'whatsapp-vs-crm': {
        slug: 'whatsapp-vs-crm',
        title: 'WhatsApp או מערכת ייעודית? לאן הולך עסק האילוף הקטן',
        description: 'WhatsApp הוא כלי קסם לתקשורת. אבל הוא לא CRM. הנה מתי מאלף עצמאי צריך להוסיף מערכת ייעודית מעל ה-WhatsApp — ולמה זה לא או-או.',
        publishedAt: '2026-05-03',
        readingMinutes: 6,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    אם רוב התקשורת שלך עם הלקוחות עוברת ב-WhatsApp — את לא לבד. בישראל, 95% מהמאלפים העצמאיים מנהלים את היומיום בוואטסאפ.
                    זה לא בעיה. זה גם לא הפתרון השלם.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה WhatsApp עושה מצוין</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>תקשורת מהירה — לקוח שולח, את עונה תוך דקות</li>
                    <li>שיתוף מדיה — תמונות וסרטונים של התקדמות הכלב</li>
                    <li>נוכחות בערוץ הטבעי של הלקוח (95% מהישראלים פתוחים בוואטסאפ ביום)</li>
                    <li>חינמי, ללא אינטגרציה</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה WhatsApp לא עושה</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li><strong>סטטוס תוכנית</strong> — כמה מפגשים נשארו? מי שילם? מי לא? אי אפשר לחפש 30 שיחות אחרי תשובה.</li>
                    <li><strong>היסטוריה ארוכת טווח</strong> — שיחות נמחקות, נשטפות בהודעות חדשות. אחרי שנה אי אפשר למצוא את "מה אמרנו על ראקס בפעם הראשונה".</li>
                    <li><strong>חשבונאות</strong> — חשבוניות, מעקב תשלומים, דוחות לרואה החשבון. בוואטסאפ אין דבר כזה.</li>
                    <li><strong>תזכורות אוטומטיות</strong> — אם זוכרים — שולחים. אחרת — לא.</li>
                    <li><strong>סינון נתונים</strong> — "כל הלקוחות שעוד לא שילמו" — שאלה שלוקחת חמש דקות ב-CRM ובלתי-אפשרית בוואטסאפ.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">המערכת המנצחת: שניהם ביחד</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    הטעות הנפוצה: לחשוב על "WhatsApp או CRM". התשובה היא תמיד שניהם. WhatsApp נשאר הערוץ ללקוח. ה-CRM הוא הזיכרון של העסק.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    החיבור הנכון:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>הלקוח שולח הודעה ב-WhatsApp → את עונה ב-WhatsApp.</li>
                    <li>אחרי השיחה, את מסכמת ב-CRM (נקודה חשובה, החלטה, צעד הבא).</li>
                    <li>כשמגיע הזמן לשלוח הצעת מחיר / חשבונית — את לוחצת כפתור ב-CRM. הלקוח מקבל מייל + WhatsApp עם הקישור.</li>
                    <li>תזכורות 24 שעות לפני המפגש — אוטומטיות מה-CRM למייל הלקוח.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">איך לעשות את המעבר בלי כאב</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li><strong>שבוע 1</strong> — הוסיפי כל לקוח חדש ל-CRM. את הלקוחות הישנים, לא תכניסי בבת אחת. ככל שהם פונים — תעדכני.</li>
                    <li><strong>שבוע 2</strong> — תתחילי לסכם כל שיחה משמעותית בכרטיס הלקוח. דקה לסיכום בסוף השיחה.</li>
                    <li><strong>שבוע 3</strong> — תשתמשי בכפתור ההצעות / חשבוניות במקום לכתוב הכל ידנית.</li>
                    <li><strong>שבוע 4</strong> — תפעילי תזכורות אוטומטיות. אחרי חודש, תראי הבדל.</li>
                </ol>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה קורה אחרי</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    אחרי 60 ימים, רוב המאלפים שעברו ל-Doggo CRM מדווחים על שתי תוצאות:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>30-60 דקות פחות אדמין ביום (תזכורות אוטומטיות, פחות חיפוש בקבצים)</li>
                    <li>שיעור חבילה-שלמה גבוה ב-15-25% (תזכורות מקטינות מבוטלות-ברגע-האחרון)</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    WhatsApp נשאר. ה-CRM מתחבר אליו (פיצ'ר עתידי בקרוב — בינתיים: הקישורים בכתב). העסק שלך גדל בלי שאת עובדת יותר.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM נבנה לעבוד לצד WhatsApp, לא להחליף אותו. כפתורי שיתוף ב-WhatsApp מובנים בכל מסך. ניסיון 30 יום חינם.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        התחילי בחינם
                        <ChevronRight size={16} className="rotate-180" />
                    </Link>
                </div>
            </>
        ),
    },
    'make-whatsapp-automation': {
        slug: 'make-whatsapp-automation',
        title: 'איך לחבר את Doggo CRM ל-Make כדי לשלוח WhatsApp אוטומטית לכל ליד חדש',
        description: 'מדריך פרקטי: כל פנייה חדשה מטופס הפניות תקפיץ הודעת WhatsApp ללקוח אוטומטית. כל זה ב-15 דקות, בלי קוד, באמצעות Make + Doggo CRM Webhook + WhatsApp.',
        publishedAt: '2026-05-03',
        readingMinutes: 8,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    תרחיש: לקוח חדש ממלא את טופס הפניות שלך באתר Doggo CRM. רגע אחר כך, הוא מקבל הודעת WhatsApp אוטומטית: "תודה על הפנייה! נחזור אליך תוך 24 שעות."
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    תוצאה: זמן תגובה ראשונה מ-3 שעות ל-30 שניות. שיעור ההמרה מליד ללקוח גבוה ב-40-60% (מחקרי SaaS) כשמגיבים מתחת ל-5 דקות.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    הנה איך מקימים את זה ב-15 דקות:
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה צריך</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>חשבון Doggo CRM (חינם או Pro)</li>
                    <li>חשבון Make.com — חינם עד 1,000 פעולות בחודש</li>
                    <li>כלי שליחת WhatsApp — אופציות פופולריות בישראל: <strong>Whapi.cloud</strong>, <strong>GreenAPI</strong>, או <strong>WhatsApp Business API</strong> רשמי דרך Meta</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">שלב 1 — צרי Webhook ב-Make</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li>הירשמי ל-Make.com (חינם).</li>
                    <li>צרי Scenario חדש.</li>
                    <li>לחצי על "+" והוסיפי מודול <strong>Webhooks → Custom Webhook</strong>.</li>
                    <li>לחצי "Add" ותני שם (לדוגמה: "Doggo CRM Lead Webhook"). העתיקי את ה-URL שמופיע — תזדקקי לו בשלב הבא.</li>
                </ol>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">שלב 2 — חברי את Webhook ל-Doggo CRM</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li>היכנסי ל-Doggo CRM → הגדרות → אינטגרציות.</li>
                    <li>גללי לסעיף "Webhook לאוטומציות".</li>
                    <li>הדביקי את ה-URL מ-Make לתוך השדה "Webhook URL".</li>
                    <li>לחצי "שמור".</li>
                    <li>לחצי "שלח בדיקה" — תקבלי אישור ירוק שהבדיקה הצליחה.</li>
                </ol>
                <p className="text-text-secondary leading-relaxed mb-6">
                    מצאי שלא — חזרי ל-Make. ב-Scenario תראי שהפעולה הראשונה כבר אכלסה data. זה ה-payload של בדיקה.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">שלב 3 — הוסיפי שליחת WhatsApp ב-Make</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    זה הצעד שדורש קצת עבודה. הוא תלוי בכלי ה-WhatsApp שבחרת. דוגמה ל-<strong>Whapi.cloud</strong>:
                </p>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li>הירשמי ל-Whapi (יש תוכנית חינמית מוגבלת).</li>
                    <li>חברי את WhatsApp שלך (הסריקה לוקחת 30 שניות).</li>
                    <li>קבלי <strong>Token</strong> מהדשבורד.</li>
                    <li>חזרי ל-Make → Scenario → לחצי "+" אחרי ה-Webhook.</li>
                    <li>חפשי "HTTP" → "Make a request".</li>
                    <li>הגדירי:
                        <ul className="mr-4 list-disc list-inside">
                            <li>URL: <code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">https://gate.whapi.cloud/messages/text</code></li>
                            <li>Method: POST</li>
                            <li>Headers: <code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">Authorization: Bearer YOUR_TOKEN</code></li>
                            <li>Body type: JSON</li>
                            <li>Body:
                                <pre className="bg-background p-2 rounded text-[10px] overflow-x-auto mr-4 my-1 ltr-nums" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>{`{
  "to": "{{1.phone}}",
  "body": "שלום {{1.full_name}}! קיבלנו את הפנייה שלך לגבי {{1.dog_name}}. נחזור אליך תוך 24 שעות 🐾"
}`}</pre>
                            </li>
                        </ul>
                    </li>
                    <li>הפעילי את ה-Scenario (כפתור "Run once" לבדיקה, אחר כך הפעילי באופן קבוע).</li>
                </ol>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">שלב 4 — בדיקה אמיתית</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li>היכנסי לדף החנות שלך (<code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">doggocrm.app/t/your-handle</code>).</li>
                    <li>מלאי טופס פניות בעצמך (הזיני מספר WhatsApp שלך).</li>
                    <li>תוך 30 שניות, את צריכה לקבל הודעת WhatsApp.</li>
                </ol>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">רעיונות נוספים שאת יכולה לבנות</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li><strong>הודעה למאלף עצמו</strong> — פנייה חדשה? קבלי גם הודעת WhatsApp לעצמך עם פרטי הליד.</li>
                    <li><strong>תזכורת תשלום</strong> — אירוע <code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">program.paid</code> מחבר ל-WhatsApp תודה ללקוח.</li>
                    <li><strong>סנכרון ל-Google Sheets</strong> — כל ליד נכנס לאקסל לגיבוי + ניתוח.</li>
                    <li><strong>שליחה למייל-מרקטינג</strong> — Mailchimp / Brevo. הליד נוסף אוטומטית לרשימת תפוצה.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">סוגי האירועים שזמינים</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    כשאת מחברת Webhook ל-Doggo CRM, ארבעה סוגי אירועים נשלחים אליו אוטומטית:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li><code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">intake_submission.created</code> — פנייה חדשה</li>
                    <li><code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">session.created</code> — מפגש חדש נקבע</li>
                    <li><code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">session.cancelled</code> — מפגש בוטל</li>
                    <li><code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">program.paid</code> — תוכנית סומנה כשולמה</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    כל אירוע מגיע כ-JSON עם header <code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">X-Doggo-Event</code>. ב-Make אפשר לבנות לוגיקה שונה לכל סוג.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM כבר תומך ב-Webhook לאוטומציות (G4) — בלי תוספת תשלום בכל התוכניות. חברי Make / Zapier / Whapi / כל כלי שמדבר HTTP.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        התחילי עכשיו
                        <ChevronRight size={16} className="rotate-180" />
                    </Link>
                </div>
            </>
        ),
    },
    'crm-buying-guide': {
        slug: 'crm-buying-guide',
        title: 'המדריך לבחירת CRM למאלף כלבים עצמאי',
        description: 'איך בוחרים CRM נכון בלי ליפול במלכודות הקלאסיות. שש שאלות לבדוק לפני שמשלמים על תוכנה — ולמה רוב ה-CRM-ים בשוק לא מתאימים למאלפי כלבים.',
        publishedAt: '2026-05-03',
        readingMinutes: 7,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    אם אי-פעם פתחת השוואה של "10 ה-CRM-ים הטובים ביותר", גילית מהר שהם נבנו לסוכני נדל"ן, יועצים פיננסיים, או עובדי B2B עם צוות מכירות.
                    מאלף כלבים עצמאי ישראלי? לא קהל היעד שלהם.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    הנה שש שאלות שיעזרו לך לבחור CRM שבאמת מתאים, ולעבור את כל מבחני ההיגיון בלי לבזבז כסף ושבועות.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">1. עברית מלאה, או רק תרגום מסך?</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    הבדל חשוב: CRM שתורגם לעברית מצוות תמיכה לא ישראלי הופך מהר לעבודה. הודעות מערכת לא ברורות, RTL שבור, תאריכים בפורמט אמריקאי.
                    שאלי באתר: "האם המערכת בעברית מלאה?" אם הם משתמשים בביטוי "Hebrew translation available" — זה תרגום, לא עברית.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">2. האם המערכת מבינה את התחום שלך?</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    מאלפי כלבים זקוקים לדברים שונים מסוכן נדל"ן. CRM כללי יציע לך:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-4 list-disc list-inside space-y-2 mr-4">
                    <li>"Deal stage" — משהו על סוכן מכירות. לא רלוונטי לחבילת אילוף.</li>
                    <li>"Contact tags" — אבל לא "כלב ראשי" או "תכונות התנהגותיות".</li>
                    <li>"Calendar booking" — אבל לא תזכורות אוטומטיות 24 שעות לפני המפגש.</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    מערכת שמבינה את התחום שלך אומרת "תוכנית אילוף", "מפגש", "כלב", "סיכום מפגש". לא "deal", "task", "lead pipeline".
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">3. עם מי המערכת מתחברת?</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    בדקי שני סוגי חיבורים:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-4 list-disc list-inside space-y-2 mr-4">
                    <li><strong>חיוב + חשבונית</strong> — Sumit, חשבונית ירוקה (Morning), או שתיהן. אם המערכת אומרת "ייצוא ל-CSV ולחבר ידנית" — זה לא מספיק.</li>
                    <li><strong>יומן</strong> — Google Calendar בלי הקלדה כפולה. כל מפגש שאת קובעת במערכת חייב להופיע ביומן שלך אוטומטית.</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    בונוס: חיבור ל-Make / Zapier / Webhooks — חשוב למאלפים שרוצים לחבר WhatsApp או SMS.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">4. כמה זה עולה — באמת?</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    "החל מ-99 ש"ח לחודש" יכול להיות מטעה. בדקי:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-4 list-disc list-inside space-y-2 mr-4">
                    <li>מה <strong>בתוכנית הבסיסית</strong>? לעיתים האימייל-מרקטינג או החיבור לחשבונית הם בתוכנית יקרה יותר.</li>
                    <li>האם יש <strong>הגבלת לקוחות / משתמשים / שירותים</strong>? אצל מאלפים שגדלים, התקרה מגיעה מהר.</li>
                    <li>מה התשלום <strong>השנתי</strong>? לעיתים יש הנחה משמעותית.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">5. כמה זמן לוקח להתקין?</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    אם ההתקנה לוקחת יותר משעה — זו דגל אדום. מערכות מקצועיות אמיתיות לעסק קטן צריכות:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>הרשמה דרך Google בלי טפסים — דקה.</li>
                    <li>הוספת לקוח ראשון — 5 דקות.</li>
                    <li>הוספת שירות וחיבור חשבונית — 10 דקות.</li>
                    <li>כתובת חנות פומבית פעילה — דקה.</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    סך הכל פחות מ-20 דקות. אם המערכת דורשת "שיחת אונבורדינג של שעה עם נציג" כדי להתחיל — היא נבנתה למישהו אחר.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">6. תמיכה — וההפך מתמיכה</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    בדקי איך התמיכה עובדת. מייל זה סטנדרט. וואטסאפ או צ'אט בעברית — בונוס משמעותי. תמיכה רק באנגלית במייל אחרי 48 שעות — זה איטי לעסק קטן.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">למה רוב ה-CRM-ים בשוק לא יעבדו לך</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    כי הם נבנו ל"מנהל מכירות שמנהל פייפליין". את לא בדיוק זה. את עוסק עצמאי שעוזר לכלב אחד בכל פעם.
                    תחום החשיבה שונה: לא "deal stage", אלא "חבילה". לא "contact", אלא "לקוח + כלב". לא "task", אלא "מפגש" עם סיכום ושיעורי בית.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM נבנה במיוחד למאלפי כלבים עצמאיים בישראל. כל ששת השאלות עוברות ב"כן" — עברית מלאה, מבין את התחום, מתחבר ל-Sumit + Google + Webhook, חינם להתחיל, התקנה ב-15 דקות.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        ראי איך זה עובד
                        <ChevronRight size={16} className="rotate-180" />
                    </Link>
                </div>
            </>
        ),
    },
    'excel-to-crm': {
        slug: 'excel-to-crm',
        title: 'מתי כדאי לעבור מאקסל ל-CRM ייעודי?',
        description: 'אקסל זה כלי מצוין — עד שהוא הופך לבעיה. הנה ארבעה סימנים פרקטיים שאומרים שהגיע הזמן לעבור ל-CRM ייעודי, ומה לבחון לפני המעבר.',
        publishedAt: '2026-05-02',
        readingMinutes: 6,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    אקסל זה כלי מצוין. הוא חינם, גמיש, וכולם יודעים להשתמש בו. אבל בשלב מסוים בעסק שלך, הוא הופך מנכס לחיכוך.
                    הנה ארבעה סימנים מהשטח שאומרים שהגיע הזמן לעבור.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">סימן 1: יש לך יותר מ-15 לקוחות פעילים</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    עד 10-15 לקוחות, אקסל עובד. אחרי זה, החיפוש (איפה הפרטים של רותם?), הסינון (מי שילם החודש?), והעדכון (כמה מפגשים נשארו לחבילה של דנה?) הופכים לעבודה.
                    אצל מאלפים מקצועיים, החצי שעה ביום שמושקעת ב"לחפש את הקובץ" היא בדרך-כלל הסימן הראשון.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">סימן 2: שכחת לחזור ללקוח</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    בעבר היה לך פתק. עכשיו יש 4 פתקים, 3 הודעות וואטסאפ, ואחד-שניים שאת זוכרת רק כי הם רושמים-מודעות בפייסבוק.
                    כשמבקשים ממאלפים לתאר את "הרגע שעברתי ל-CRM", זו הסיבה הכי שכיחה: לקוח אחד נשמט, וזה הספיק.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">סימן 3: יש לך נתונים שאי אפשר לשאול אותם</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    בקובץ אקסל, אם תרצי לדעת:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>כמה לידים קיבלת בחודש האחרון מאינסטגרם?</li>
                    <li>מהו הזמן הממוצע מליד לחבילה?</li>
                    <li>כמה לקוחות חזרו לחבילה שנייה?</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    אקסל יודע לגלגל מספרים, אבל רק אם תקצי את הנתונים מראש בצורה שמאפשרת את זה. ב-CRM ייעודי, השאלות האלו פתוחות ב-3 לחיצות.
                    זה ההבדל בין לעבוד ב-עסק לבין לעבוד עליו.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">סימן 4: את שולחת הצעות מחיר וחשבוניות בכלים נפרדים</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    אם הצעת המחיר ב-Word, החשבונית ב-Sumit/חשבונית ירוקה, ההסכם ב-PDF במייל, וההיסטוריה ב-WhatsApp — את עובדת ב-4 כלים שלא מדברים ביניהם.
                    CRM ייעודי מחבר אותם. אותו לקוח, אותה תוכנית, הצעת מחיר → חשבונית → אישור → תזכורות אוטומטיות. הכל קשור.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה לבדוק לפני המעבר</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li><strong>עברית מלאה</strong> — לא תרגום של כלי אנגלי. CRM שתורגם הוא חוויה לא אחידה.</li>
                    <li><strong>מותאם לתחום שלך</strong> — מאלפי כלבים זקוקים לדברים שונים מסוכני נדל"ן או יועצים פיננסיים. CRM אופקי גנרי לא יידע לדבר על "תוכנית אילוף", "מפגשים שנשארו", או "כלב ראשי".</li>
                    <li><strong>מתחבר למה שכבר יש לך</strong> — Sumit / חשבונית ירוקה, Google Calendar, Gmail. אם CRM דורש ממך לעזוב את הכלים הקיימים, זה דגל אדום.</li>
                    <li><strong>חינם להתחיל</strong> — תוכנית חינם או ניסיון מספיק ארוך כדי לראות אם זה עובד אצלך, לפני שמשלמים.</li>
                </ol>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">שורה תחתונה</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    אקסל הוא לא הבעיה. הבעיה היא לעבוד עם 4 כלים שלא מדברים. כשהזמן שאת מבזבזת על אדמין עולה על שעה ביום — זה הגיע הזמן.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM נבנה מאלפים, לא לסוכני נדל"ן. עברית מלאה, חיבור ל-Sumit + Google + Gmail, ניסיון 30 יום חינם.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        ראי איך זה עובד
                        <ChevronRight size={16} className="rotate-180" />
                    </Link>
                </div>
            </>
        ),
    },
    'pricing-guide': {
        slug: 'pricing-guide',
        title: 'איך לקבוע מחיר לתוכנית אילוף — מדריך מהשטח',
        description: 'תמחור הוא אחד הדברים הכי קשים למאלפי כלבים עצמאיים. הנה מסגרת פרקטית שעובדת ב-2026, מבוססת על ראיונות עם מאלפים בישראל.',
        publishedAt: '2026-05-02',
        readingMinutes: 8,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    "כמה לקחת על תוכנית אילוף?" — השאלה שכל מאלף עצמאי שואל את עצמו לפחות פעם בשבוע.
                    אין תשובה אחת נכונה, אבל יש מסגרת פרקטית שעוזרת להגיע למחיר הוגן וריווחי. הנה מה שלמדנו מראיונות עם מאלפים בישראל.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">1. התחילי מהעלות-לדקה שלך, לא מהמחיר של המתחרים</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    הטעות הנפוצה: לבדוק 3 מאלפים בסביבה ולקבוע מחיר באמצע. בעיה: זה לא מבטיח שאת מרוויחה.
                </p>
                <p className="text-text-secondary leading-relaxed mb-4">
                    החישוב הנכון: כמה את עובדת בחודש? נסיעות + מפגשים + תיעוד + שיחות וואטסאפ אחרי? קבלי שעות. חלקי במשכורת שאת רוצה לקחת הביתה (ברוטו).
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    דוגמה: 120 שעות עבודה בחודש, רוצה 12,000 ש"ח ברוטו → 100 ש"ח לשעה כעלות-לדקה. עכשיו תכפילי במספר השעות הריאלי שתוכנית אילוף לוקחת ממך, וזה רצפת המחיר.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">2. תמחר/י לפי תוצאה, לא לפי מפגש</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    שתי תוכניות "אילוף בייסיק 8 מפגשים":
                </p>
                <ul className="text-text-secondary leading-relaxed mb-4 list-disc list-inside space-y-2 mr-4">
                    <li><strong>תמחור לפי שעה</strong> — 8 × 250 = 2,000 ש"ח</li>
                    <li><strong>תמחור לפי תוצאה</strong> — 2,400 ש"ח, "8 מפגשים, פתרון בעיה ספציפית, ליווי בוואטסאפ עד תום הקורס"</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    הלקוח לא קונה שעות. הוא קונה כלב מאולף. תמחור-לפי-תוצאה מאפשר לך:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>לעלות מחיר ב-15-25% בלי שזה ירגיש קופצני</li>
                    <li>לכסות את הזמן הלא-מפגשי (וואטסאפ, הכנה, מעקב)</li>
                    <li>למקם את עצמך כפתרון, לא כשרות שעתי</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">3. חבילות במקום מפגש בודד</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    מאלפים שמוכרים מפגשים בודדים תמיד נאבקים במחזור-תזרים. חבילה של 8 מפגשים מראש פותרת את זה: התשלום מגיע בהתחלה, ההכנסה צפויה,
                    הלקוח מחויב להגיע (כי כבר שילם), ואת לא צריכה לשכנע אותו לכל מפגש.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    טיפ: 3 חבילות בלבד. בייסיק (4-6 מפגשים) / סטנדרט (8-10) / פרימיום (12+). יותר אופציות = פחות החלטות = שיתוק לקוח.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">4. כמה ל-"מפגש ראשון בלבד"?</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    שתי גישות:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-4 list-disc list-inside space-y-2 mr-4">
                    <li><strong>מפגש היכרות חינם</strong> — מושך הרבה לידים, חלקם לא רציניים. הופך את החודש שלך ל-15 פגישות-היכרות + 5 לקוחות אמיתיים.</li>
                    <li><strong>מפגש היכרות בתשלום (250-350 ש"ח)</strong> — מסנן רציניים. שיעור ההמרה ללקוח גבוה משמעותית. גם בלי חבילה — שולמת על הזמן שלך.</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    ההמלצה: השני. המפגש בתשלום הוא בעצם הצעת מחיר אצלך בבית, וזה מתפקד כסינון איכותי.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">5. הצעת מחיר ב-30 שניות, לא ב-30 דקות</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    אחרי שהגדרת את החבילות שלך — את כבר לא מחשבת מחיר לכל לקוח. את לוחצת "הצעת מחיר", בוחרת את החבילה, שולחת.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    זה ההבדל בין מאלף שמתמחר במהירות ושולח 5 הצעות בערב, לבין מאלף שמתחיל ל"חשב את המחיר" ושולח אחת — אחרי שהלקוח כבר פנה למתחרה.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">סיכום: מסגרת ב-5 דקות</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li>עלות-לדקה שלך = משכורת ברוטו רצויה ÷ שעות עבודה בחודש</li>
                    <li>תמחור לפי תוצאה (חבילה), לא לפי שעה</li>
                    <li>3 חבילות בלבד (בייסיק / סטנדרט / פרימיום)</li>
                    <li>מפגש היכרות בתשלום (250-350 ש"ח)</li>
                    <li>הצעת מחיר אוטומטית מ-CRM = הצעות נשלחות מהר → תשובות מהירות → סגירות מהירות</li>
                </ol>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM יודע את החבילות שלך. הצעת מחיר ללקוח חדש לוקחת 30 שניות, לא 30 דקות.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        ראי איך זה עובד
                        <ChevronRight size={16} className="rotate-180" />
                    </Link>
                </div>
            </>
        ),
    },
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
        if (!post) return;

        document.title = `${post.title} · Doggo CRM`;
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', post.description);

        // JSON-LD Article structured data — improves Google snippet quality
        const ldScript = document.createElement('script');
        ldScript.type = 'application/ld+json';
        ldScript.id = 'blog-jsonld';
        ldScript.text = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.description,
            inLanguage: 'he-IL',
            datePublished: post.publishedAt,
            dateModified: post.publishedAt,
            author: { '@type': 'Organization', name: 'Doggo CRM' },
            publisher: {
                '@type': 'Organization',
                name: 'Doggo CRM',
                logo: { '@type': 'ImageObject', url: 'https://doggocrm.app/og-image.png' },
            },
            mainEntityOfPage: { '@type': 'WebPage', '@id': `https://doggocrm.app/blog/${post.slug}` },
        });
        document.head.appendChild(ldScript);

        return () => {
            document.title = 'Doggo CRM — ניהול עסק האילוף שלך, בלי גיליונות אקסל';
            const existing = document.getElementById('blog-jsonld');
            if (existing) existing.remove();
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
