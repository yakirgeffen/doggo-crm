import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { NewsletterCTA } from '../../components/public/NewsletterCTA';

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
    'tools-trainers-need': {
        slug: 'tools-trainers-need',
        title: '5 כלים שמאלפי כלבים מקצועיים לא יכולים בלעדיהם בעבודה היומיומית',
        description: 'מעבר ל-CRM — אילו כלים פרקטיים מאלפי כלבים בישראל באמת משתמשים בהם בכל יום? הנה רשימה מהשטח, בלי תקציב גדול.',
        publishedAt: '2026-05-03',
        readingMinutes: 5,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    מאלף עצמאי מקצועי לא צריך 30 כלים. הוא צריך 5 שעובדים ביחד. הנה הכלים שראינו אצל המאלפים שמרוויחים יותר ועובדים פחות.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">1. CRM ייעודי</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    זה ה-base. בלי CRM, כל השאר חסר תפקיד. ה-CRM הוא הזיכרון של העסק — לקוחות, תוכניות, מפגשים, חשבוניות, מקור הליד, היסטוריה. Doggo CRM היא דוגמה — חינם להתחיל.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">2. שירות חשבונית — Sumit או חשבונית ירוקה</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    כל מאלף עצמאי בישראל צריך אחד מהשניים לחשבוניות, קבלות, וחיוב באשראי. בחירה תלויה ברואה החשבון שלך. שניהם מתחברים ל-Doggo CRM ב-2 דקות. (כתבנו על השוואה בין השניים — קישור מתחת.)
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">3. WhatsApp Business (לא הרגיל)</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    WhatsApp Business (חינמי) נותן לך:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>תיאור עסק + תמונת לוגו (יותר אמין מ-WhatsApp רגיל)</li>
                    <li>הודעות אוטומטיות מחוץ לשעות עבודה</li>
                    <li>תיוגי שיחות (חדש / ממתין לתשובה / סגור)</li>
                    <li>קישור משוטף לאתר שלך</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    הקסם: שילוב WhatsApp Business עם ה-Webhook של Doggo CRM (דרך Make) → כל ליד מקבל תגובת WhatsApp תוך שניות. שיעור המרה ב-40% גבוה יותר.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">4. Google Calendar</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    בסיס. כל מפגש שנקבע חייב להופיע ביומן שלך אוטומטית. Doggo CRM כבר עושה את זה — אין מצב להחזיק שני יומנים.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">5. Canva (לא חובה אבל מקצר זמן)</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    תמונות לרשתות חברתיות. דף תוצאות לפני/אחרי. כרטיס ביקור דיגיטלי. גם בתוכנית החינמית — עובד מצוין. למי שמשווק באינסטגרם או טיקטוק — Canva זה הכלי.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">בונוס: מה לא צריך</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>אקסל — ה-CRM החליף אותו</li>
                    <li>תוכנת חשבונאות יקרה — Sumit/חשבונית ירוקה מספיקות לעוסק עצמאי</li>
                    <li>אפליקציית הודעות נוספת — WhatsApp + Make מספיק</li>
                </ul>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM מתחבר לכל הכלים שלמעלה. ב-15 דקות יש לך עסק שמתפקד אוטומטית.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        לראות איך זה עובד
                        <ChevronRight size={16} className="rotate-180" />
                    </Link>
                </div>
            </>
        ),
    },
    'intake-form-mistakes': {
        slug: 'intake-form-mistakes',
        title: '5 טעויות נפוצות בטופס פניות באתר של מאלפים',
        description: 'הטופס שלך נראה טוב — אבל לא מקבל פניות? הנה חמש טעויות שמורידות שיעור המרה בטופס פניות, ומה לעשות במקומן.',
        publishedAt: '2026-05-03',
        readingMinutes: 5,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    אם יש לך אתר ויש לך טופס פניות, ועדיין הפניות לא מגיעות — הבעיה לא בהכרח בתנועה. בעיה בתפקוד הטופס.
                    הנה חמש טעויות שראינו בעשרות אתרים של מאלפי כלבים, ומה לעשות במקומן.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">1. טופס ארוך מדי</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    שמת 12 שדות חובה כדי "לסנן רציניים". הסיכון: 80% נוטשים לפני סיום. בעיקר במובייל, שם רוב הפניות מגיעות.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    <strong>מה לעשות במקום:</strong> 4 שדות מקסימום בשלב הראשון. שם, טלפון, שם הכלב, מה רוצים לפתור. את שאר הפרטים אפשר לאסוף בשיחה הראשונה.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">2. אין הבטחה ברורה למה יקרה אחרי השליחה</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    הלקוח שולח פנייה ולא יודע מה הצעד הבא. תוך 24 שעות? 3 ימים? תקראו לו? תשלחו מייל? <br/>
                    <strong>מה לעשות במקום:</strong> ליד כפתור השליחה, או מיד אחרי, "נחזור אליך תוך 24 שעות בוואטסאפ". הסטה לערוץ ספציפי + לוח זמנים.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">3. אין הוכחה חברתית ליד הטופס</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    טופס בלי המלצה אחת או תמונה אחת של לקוח שעבדת איתו זה טופס מסוכן.
                    <strong>מה לעשות במקום:</strong> ציטוט אחד מלקוחה (אפילו ללא שם — "אמא של רקס") + תמונה של כלב מאומן. אמינות לפני התחייבות.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">4. אין מעקב מקור</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    מאיפה הליד הגיע? ידעת שזה היה ה-Reel באינסטגרם? או ה-3,000 שקל שהושקעו בקמפיין Google? בלי מעקב — אי אפשר לדעת.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    <strong>מה לעשות במקום:</strong> UTM פרמטרים בכל קישור שמופץ. אחרי 60 יום אפשר לדעת מי המקור הכי משתלם, ולכוון שם את המאמץ הבא.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">5. אין הגנת ספאם</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    טופס פתוח בלי CAPTCHA הופך לשפך לבוטים תוך שבוע. אז מגיעות 50 הודעות "Hey, my dog needs help" מאינדונזיה. לא רציני, גוזל זמן, מסתיר לידים אמיתיים.
                    <strong>מה לעשות במקום:</strong> Cloudflare Turnstile (חינמי ובלתי-פולשני) או reCAPTCHA. דקה להתקין.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">בונוס: מקבלים ליד? מהירות תגובה היא הכל</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    מחקרים מראים: שיעור ההמרה לעסקה גבוה ב-40-60% כשמגיבים תוך 5 דקות מקבלת הליד. מעל 30 דקות — שיעור ההמרה צונח. אוטומציה (הודעת WhatsApp אוטומטית בשנייה הראשונה) זה Gold Standard.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM מציע טופס פניות מוכן עם CAPTCHA, מעקב UTM אוטומטי, וטריגר Webhook לאוטומציות שלך — הכל בחינם.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        לראות איך זה עובד
                        <ChevronRight size={16} className="rotate-180" />
                    </Link>
                </div>
            </>
        ),
    },
    'quote-writing-guide': {
        slug: 'quote-writing-guide',
        title: 'המדריך השלם להצעת מחיר ללקוח אילוף',
        description: 'איך לכתוב הצעת מחיר שגורמת ללקוח לסגור — בלי להתמקח, בלי להסס. מדריך פרקטי מהשטח הישראלי.',
        publishedAt: '2026-05-03',
        readingMinutes: 6,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    הצעת מחיר לא נכתבה היטב? הלקוח הולך למתחרה. נכתבה היטב? הלקוח סוגר תוך שעה ובלי להתמקח.
                    הנה איך לכתוב הצעת מחיר שעובדת — מבוסס על ראיונות עם מאלפים שסוגרים שיעור-המרה גבוה.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">החלקים של הצעת מחיר טובה</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li><strong>פתיחה אישית</strong> — לא "שלום" — שם הלקוח, שם הכלב, ההתייחסות הספציפית למה שהם פנו עליו.</li>
                    <li><strong>מה התוכנית כוללת</strong> — בנקודות. מספר מפגשים, משך מפגש, איפה מתקיים, מה הלקוח מקבל.</li>
                    <li><strong>מה לא כלול</strong> — חשוב למנוע אכזבה. "ליווי בוואטסאפ אחרי תום הקורס לא כלול במחיר."</li>
                    <li><strong>מחיר ברור</strong> — סכום אחד, לא טווח. תשלומים אם רלוונטי.</li>
                    <li><strong>תוקף ההצעה</strong> — "תקף 14 ימים" — יוצר דחיפות.</li>
                    <li><strong>אופן התשלום</strong> — ביט, אשראי, תשלומים. מקל על הסגירה.</li>
                </ol>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">הטעות הנפוצה: הסבר מקצועי יותר מדי</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    מאלפים נוטים לכתוב כמו ספר. הצעת מחיר של 3 עמודים על שיטת האילוף, על הניסיון של המאלף, על המתודולוגיה.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    הלקוח לא יקרא את זה. הצעה טובה היא בעמוד אחד או פחות. הניסיון שלך + המתודולוגיה — באתר. בהצעה: רק התוצאה והמחיר.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה לעשות אחרי שליחת ההצעה</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li><strong>לשלוח גם הודעת WhatsApp</strong> — "שלום, הרגע שלחתי לך הצעת מחיר במייל. אם יש שאלות אני כאן." זמן תגובה ראשונה לפי 5 דקות = שיעור המרה גבוה ב-40%.</li>
                    <li><strong>לא לפחד לחזור</strong> — אם הלקוח לא הגיב תוך 3 ימים, שולחים הודעה: "רציתי לבדוק אם קיבלת את ההצעה ואם יש שאלות". זה לא לחץ — זה שירות.</li>
                    <li><strong>אבל לא יותר מ-3 פולואפים</strong> — אם הלקוח לא הגיב אחרי 3 ניסיונות בפער של שבוע, אין טעם להשקיע יותר. הוא לא קונה.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">דוגמת הצעה שעובדת (תבנית)</h2>
                <div className="bg-background border border-border rounded-xl p-5 my-6 text-sm leading-relaxed text-text-secondary">
                    <p className="mb-3"><strong>שלום [שם הלקוח],</strong></p>
                    <p className="mb-3">תודה ששלחת אלינו פנייה לגבי [שם הכלב]! הנה ההצעה לתוכנית האילוף שלכם.</p>
                    <p className="mb-2"><strong>מה התוכנית כוללת:</strong></p>
                    <ul className="list-disc list-inside mb-3 space-y-1 mr-4">
                        <li>8 מפגשים פרטיים, שעה כל אחד</li>
                        <li>אצלכם בבית — באזור המגורים שלכם</li>
                        <li>תוכנית מותאמת אישית, מותאמת לקצב הכלב</li>
                        <li>תיעוד מפגש אחרי כל מפגש בוואטסאפ</li>
                    </ul>
                    <p className="mb-2"><strong>מה לא כלול:</strong> ליווי וואטסאפ אחרי סיום הקורס (אבל אפשר להאריך — בנפרד).</p>
                    <p className="mb-2"><strong>מחיר:</strong> 2,400 ש"ח לכל החבילה. תשלום מלא או 4 תשלומים.</p>
                    <p className="mb-2"><strong>אופני תשלום:</strong> ביט, אשראי, או העברה.</p>
                    <p className="mb-3"><strong>תוקף ההצעה:</strong> 14 ימים מהיום.</p>
                    <p>אם אפשר, נשמח לקבוע מפגש היכרות ראשון לפני סיום שבועיים. דברו איתי ב-WhatsApp ב-050-XXXXXXX.</p>
                </div>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">למה Doggo CRM מקלה על הצעות מחיר</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    בלחיצה אחת ב-Doggo CRM בוחרים את החבילה מהקטלוג, מקבלים הצעת מחיר עם PDF, מספר מסמך מ-Sumit, ומעקב סטטוס.
                    הלקוח מקבל מייל מקצועי ולחיצה אחת על "אישור". המעקב נעשה במערכת, בלי לחפש בוואטסאפ.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM מפיק לך הצעות מחיר ב-30 שניות, עם PDF נשלח ישירות מהמערכת. ניסיון 30 יום חינם.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        להתחיל עכשיו
                        <ChevronRight size={16} className="rotate-180" />
                    </Link>
                </div>
            </>
        ),
    },
    'whatsapp-vs-crm': {
        slug: 'whatsapp-vs-crm',
        title: 'WhatsApp או מערכת ייעודית? לאן הולך עסק האילוף הקטן',
        description: 'WhatsApp הוא כלי קסם לתקשורת. אבל הוא לא CRM. הנה מתי מאלף עצמאי צריך להוסיף מערכת ייעודית מעל ה-WhatsApp — ולמה זה לא או-או.',
        publishedAt: '2026-05-03',
        readingMinutes: 6,
        body: () => (
            <>
                <p className="text-text-secondary text-lg leading-relaxed mb-6">
                    אם רוב התקשורת שלך עם הלקוחות עוברת ב-WhatsApp — זו לא תופעה יחידאית. בישראל, 95% מהמאלפים העצמאיים מנהלים את היומיום בוואטסאפ.
                    זה לא בעיה. זה גם לא הפתרון השלם.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה WhatsApp עושה מצוין</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>תקשורת מהירה — לקוח שולח, התשובה מגיעה תוך דקות</li>
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
                    <li>הלקוח שולח הודעה ב-WhatsApp → התשובה חוזרת ב-WhatsApp.</li>
                    <li>אחרי השיחה, סיכום ב-CRM (נקודה חשובה, החלטה, צעד הבא).</li>
                    <li>כשמגיע הזמן לשלוח הצעת מחיר / חשבונית — לחיצת כפתור ב-CRM. הלקוח מקבל מייל + WhatsApp עם הקישור.</li>
                    <li>תזכורות 24 שעות לפני המפגש — אוטומטיות מה-CRM למייל הלקוח.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">איך לעשות את המעבר בלי כאב</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li><strong>שבוע 1</strong> — להוסיף כל לקוח חדש ל-CRM. את הלקוחות הישנים, אין צורך להכניס בבת אחת. ככל שהם פונים — לעדכן.</li>
                    <li><strong>שבוע 2</strong> — להתחיל לסכם כל שיחה משמעותית בכרטיס הלקוח. דקה לסיכום בסוף השיחה.</li>
                    <li><strong>שבוע 3</strong> — להשתמש בכפתור ההצעות / חשבוניות במקום לכתוב הכל ידנית.</li>
                    <li><strong>שבוע 4</strong> — להפעיל תזכורות אוטומטיות. אחרי חודש — ההבדל ניכר.</li>
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
                    WhatsApp נשאר. ה-CRM מתחבר אליו (פיצ'ר עתידי בקרוב — בינתיים: הקישורים בכתב). העסק שלך גדל בלי תוספת שעות עבודה.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM נבנה לעבוד לצד WhatsApp, לא להחליף אותו. כפתורי שיתוף ב-WhatsApp מובנים בכל מסך. ניסיון 30 יום חינם.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        להתחיל בחינם
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

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">שלב 1 — יצירת Webhook ב-Make</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li>להירשם ל-Make.com (חינם).</li>
                    <li>ליצור Scenario חדש.</li>
                    <li>ללחוץ על "+" ולהוסיף מודול <strong>Webhooks → Custom Webhook</strong>.</li>
                    <li>ללחוץ "Add" ולתת שם (לדוגמה: "Doggo CRM Lead Webhook"). להעתיק את ה-URL שמופיע — הוא יידרש בשלב הבא.</li>
                </ol>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">שלב 2 — חיבור Webhook ל-Doggo CRM</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li>להיכנס ל-Doggo CRM → הגדרות → אינטגרציות.</li>
                    <li>לגלול לסעיף "Webhook לאוטומציות".</li>
                    <li>להדביק את ה-URL מ-Make לתוך השדה "Webhook URL".</li>
                    <li>ללחוץ "שמור".</li>
                    <li>ללחוץ "שלח בדיקה" — יופיע אישור ירוק שהבדיקה הצליחה.</li>
                </ol>
                <p className="text-text-secondary leading-relaxed mb-6">
                    אם לא — חזרה ל-Make. ב-Scenario תופיע בפעולה הראשונה data שכבר אכלסה. זה ה-payload של בדיקה.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">שלב 3 — הוספת שליחת WhatsApp ב-Make</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    זה הצעד שדורש קצת עבודה. הוא תלוי בכלי ה-WhatsApp הנבחר. דוגמה ל-<strong>Whapi.cloud</strong>:
                </p>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li>להירשם ל-Whapi (יש תוכנית חינמית מוגבלת).</li>
                    <li>לחבר את WhatsApp שלך (הסריקה לוקחת 30 שניות).</li>
                    <li>לקבל <strong>Token</strong> מהדשבורד.</li>
                    <li>לחזור ל-Make → Scenario → ללחוץ "+" אחרי ה-Webhook.</li>
                    <li>לחפש "HTTP" → "Make a request".</li>
                    <li>להגדיר:
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
                    <li>להפעיל את ה-Scenario (כפתור "Run once" לבדיקה, אחר כך להפעיל באופן קבוע).</li>
                </ol>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">שלב 4 — בדיקה אמיתית</h2>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-2 mr-4">
                    <li>להיכנס לדף החנות שלך (<code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">doggocrm.app/t/your-handle</code>).</li>
                    <li>למלא טופס פניות בעצמך (להזין מספר WhatsApp שלך).</li>
                    <li>תוך 30 שניות צריכה להגיע הודעת WhatsApp.</li>
                </ol>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">רעיונות נוספים לבנייה</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li><strong>הודעה למאלף עצמו</strong> — פנייה חדשה? לקבל גם הודעת WhatsApp עצמית עם פרטי הליד.</li>
                    <li><strong>תזכורת תשלום</strong> — אירוע <code dir="ltr" className="font-mono bg-background px-1 rounded text-[10px]">program.paid</code> מחבר ל-WhatsApp תודה ללקוח.</li>
                    <li><strong>סנכרון ל-Google Sheets</strong> — כל ליד נכנס לאקסל לגיבוי + ניתוח.</li>
                    <li><strong>שליחה למייל-מרקטינג</strong> — Mailchimp / Brevo. הליד נוסף אוטומטית לרשימת תפוצה.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">סוגי האירועים שזמינים</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    בחיבור Webhook ל-Doggo CRM, ארבעה סוגי אירועים נשלחים אליו אוטומטית:
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
                        Doggo CRM כבר תומך ב-Webhook לאוטומציות (G4) — בלי תוספת תשלום בכל התוכניות. אפשר לחבר Make / Zapier / Whapi / כל כלי שמדבר HTTP.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        להתחיל עכשיו
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
                    כדאי לשאול באתר: "האם המערכת בעברית מלאה?" אם הם משתמשים בביטוי "Hebrew translation available" — זה תרגום, לא עברית.
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
                    כדאי לבדוק שני סוגי חיבורים:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-4 list-disc list-inside space-y-2 mr-4">
                    <li><strong>חיוב + חשבונית</strong> — Sumit, חשבונית ירוקה (Morning), או שתיהן. אם המערכת אומרת "ייצוא ל-CSV ולחבר ידנית" — זה לא מספיק.</li>
                    <li><strong>יומן</strong> — Google Calendar בלי הקלדה כפולה. כל מפגש שנקבע במערכת חייב להופיע ביומן שלך אוטומטית.</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    בונוס: חיבור ל-Make / Zapier / Webhooks — חשוב למאלפים שרוצים לחבר WhatsApp או SMS.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">4. כמה זה עולה — באמת?</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    "החל מ-99 ש"ח לחודש" יכול להיות מטעה. כדאי לבדוק:
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
                    כדאי לבדוק איך התמיכה עובדת. מייל זה סטנדרט. וואטסאפ או צ'אט בעברית — בונוס משמעותי. תמיכה רק באנגלית במייל אחרי 48 שעות — זה איטי לעסק קטן.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">למה רוב ה-CRM-ים בשוק לא יעבדו לך</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    כי הם נבנו ל"מנהל מכירות שמנהל פייפליין". זה לא המקרה כאן — מאלף עצמאי עוזר לכלב אחד בכל פעם.
                    תחום החשיבה שונה: לא "deal stage", אלא "חבילה". לא "contact", אלא "לקוח + כלב". לא "task", אלא "מפגש" עם סיכום ושיעורי בית.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM נבנה במיוחד למאלפי כלבים עצמאיים בישראל. כל ששת השאלות עוברות ב"כן" — עברית מלאה, מבין את התחום, מתחבר ל-Sumit + Google + Webhook, חינם להתחיל, התקנה ב-15 דקות.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        לראות איך זה עובד
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
                    בעבר היה לך פתק. עכשיו יש 4 פתקים, 3 הודעות וואטסאפ, ואחד-שניים שעולים בזיכרון רק כי הם רושמים-מודעות בפייסבוק.
                    כשמבקשים ממאלפים לתאר את "הרגע שעברתי ל-CRM", זו הסיבה הכי שכיחה: לקוח אחד נשמט, וזה הספיק.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">סימן 3: יש לך נתונים שאי אפשר לשאול אותם</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    בקובץ אקסל, כשרוצים לדעת:
                </p>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                    <li>כמה לידים קיבלת בחודש האחרון מאינסטגרם?</li>
                    <li>מהו הזמן הממוצע מליד לחבילה?</li>
                    <li>כמה לקוחות חזרו לחבילה שנייה?</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    אקסל יודע לגלגל מספרים, אבל רק אם הנתונים מסודרים מראש בצורה שמאפשרת את זה. ב-CRM ייעודי, השאלות האלו פתוחות ב-3 לחיצות.
                    זה ההבדל בין לעבוד ב-עסק לבין לעבוד עליו.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">סימן 4: שליחת הצעות מחיר וחשבוניות בכלים נפרדים</h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                    אם הצעת המחיר ב-Word, החשבונית ב-Sumit/חשבונית ירוקה, ההסכם ב-PDF במייל, וההיסטוריה ב-WhatsApp — העבודה מתפצלת ל-4 כלים שלא מדברים ביניהם.
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
                    אקסל הוא לא הבעיה. הבעיה היא לעבוד עם 4 כלים שלא מדברים. כשהזמן שמבוזבז על אדמין עולה על שעה ביום — זה הגיע הזמן.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM נבנה מאלפים, לא לסוכני נדל"ן. עברית מלאה, חיבור ל-Sumit + Google + Gmail, ניסיון 30 יום חינם.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        לראות איך זה עובד
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

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">1. להתחיל מהעלות-לדקה שלך, לא מהמחיר של המתחרים</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    הטעות הנפוצה: לבדוק 3 מאלפים בסביבה ולקבוע מחיר באמצע. הבעיה: זה לא מבטיח רווחיות.
                </p>
                <p className="text-text-secondary leading-relaxed mb-4">
                    החישוב הנכון: כמה שעות עבודה בחודש? נסיעות + מפגשים + תיעוד + שיחות וואטסאפ אחרי? לסכם שעות. לחלק במשכורת שרוצים לקחת הביתה (ברוטו).
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    דוגמה: 120 שעות עבודה בחודש, יעד 12,000 ש"ח ברוטו → 100 ש"ח לשעה כעלות-לדקה. עכשיו אפשר להכפיל במספר השעות הריאלי שתוכנית אילוף לוקחת — וזו רצפת המחיר.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">2. תמחור לפי תוצאה, לא לפי מפגש</h2>
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
                    הלקוח מחויב להגיע (כי כבר שילם), ואין צורך לשכנע אותו לכל מפגש.
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
                    <li><strong>מפגש היכרות בתשלום (250-350 ש"ח)</strong> — מסנן רציניים. שיעור ההמרה ללקוח גבוה משמעותית. גם בלי חבילה — מקבלים תשלום על הזמן שלך.</li>
                </ul>
                <p className="text-text-secondary leading-relaxed mb-6">
                    ההמלצה: השני. המפגש בתשלום הוא בעצם הצעת מחיר אצלך בבית, וזה מתפקד כסינון איכותי.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">5. הצעת מחיר ב-30 שניות, לא ב-30 דקות</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    אחרי שהחבילות שלך מוגדרות — אין צורך לחשב מחיר לכל לקוח מחדש. לחיצה על "הצעת מחיר", בחירת החבילה, שליחה.
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
                        לראות איך זה עובד
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
                    <li><strong>חיוב מתחדש (Recurring)</strong> — למעבר עתידי למודל מנוי (לדוגמה, "תוכנית אילוף אונליין חודשית"), Sumit כבר תומכת בזה. בחשבונית ירוקה זו עבודה.</li>
                    <li><strong>ממשק UI מודרני יותר</strong> — סובייקטיבי, אבל הרבה מאלפים שדיברנו איתם מציינים את זה.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">איפה חשבונית ירוקה מובילה</h2>
                <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2">
                    <li><strong>היכרות בשוק</strong> — רואי חשבון ישראלים מכירים אותה היטב; פחות הסבר נדרש.</li>
                    <li><strong>אינטגרציות עם תוכנות נוספות</strong> — ל-Morning יש מערכת אקוסיסטם רחבה יותר של שותפים.</li>
                    <li><strong>תמחור פשוט יותר לעוסק פטור/מורשה</strong> — נקודת מבט שצריך לבדוק עם רואה חשבון, אבל נשמע פעמים רבות כשיקול.</li>
                </ul>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">השאלה האמיתית: כמה זמן חוסכים בכל חשבונית?</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    שני השירותים מצוינים בלהפיק חשבונית מהממשק שלהם. הבעיה: אצל מאלף שיש לו מערכת לקוחות (CRM) נפרדת, התהליך הוא:
                </p>
                <ol className="text-text-secondary leading-relaxed mb-6 list-decimal list-inside space-y-1 mr-4">
                    <li>לפתוח את ה-CRM, למצוא את הלקוח</li>
                    <li>לפתוח את חשבונית ירוקה / Sumit במסך נפרד</li>
                    <li>להקליד את שם הלקוח, מייל, פרטי השירות, סכום</li>
                    <li>לשלוח</li>
                    <li>לחזור ל-CRM, לרשום שהחשבונית נשלחה</li>
                </ol>
                <p className="text-text-secondary leading-relaxed mb-6">
                    זה 3-5 דקות לכל חשבונית. בנפח של 30 חשבוניות בחודש — זה שעתיים. במצב טוב 4 שעות.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">למה Doggo CRM מתחבר לשניהם</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    כשהCRM שלך כבר יודע מי הלקוח, מה התוכנית, ומה המחיר —
                    אין סיבה להקליד את זה שוב באתר חיצוני. ב-Doggo CRM, הצעת מחיר וחשבונית נשלחות בלחיצה אחת ישירות דרך החשבון Sumit
                    או חשבונית ירוקה <strong>שלך</strong>. לא דרך החשבון שלנו, לא עם עמלת תיווך — דרך החשבון שלך, באמצעות מפתחות ה-API שלך.
                </p>
                <p className="text-text-secondary leading-relaxed mb-4">
                    התוצאה: בעבודה עם Sumit, ההצעות והחשבוניות שלך יופיעו בדשבורד של Sumit כרגיל.
                    בעבודה עם חשבונית ירוקה, אותו דבר. אין שינוי במערכת החשבונאית — רק הפסקה של הקלדת אותם נתונים פעמיים.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">המלצה</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    בתחילת הדרך, בלי חשבון קיים — Sumit. הצעות המחיר הנטיביות וה-UI המודרני שווים את זה.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    כשרואה החשבון שלך עובד עם חשבונית ירוקה כבר — אין צורך לעבור. אפשר להמשיך עם Morning ולחבר אותה ל-Doggo CRM באותה קלות.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        Doggo CRM מתחבר לשני השירותים. בלי להחליף, בלי להקליד פעמיים.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        לראות איך זה עובד
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
                    העיקר: לא תלוי בזיכרון אנושי.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">3. הצעת מחיר ב-Word, חשבונית בנפרד, מעקב בראש</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    תהליך טיפוסי: לקוח חדש פונה. הצעת מחיר ב-Word שנכתבה לפני שנה נשלחת אליו. הלקוח אומר כן. פתיחה של חשבונית ירוקה (או Sumit), הקלדה מחדש של הכל, שליחה.
                    אחרי שבועיים: "סליחה, מה היה המחיר?" — לא ברור אם זה היה 2,400 או 2,800. וגם אין מקום אחיד לחזור אליו.
                </p>
                <p className="text-text-secondary leading-relaxed mb-6">
                    <strong>מה לעשות במקום:</strong> הצעת מחיר נשלחת ישירות מהמערכת — עם PDF, מספר מסמך, ומעקב סטטוס (נשלחה / נצפתה / אושרה).
                    כשהלקוח אומר כן, החשבונית כבר מקושרת אליה. בלי הקלדה כפולה.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">4. שיחה עם לקוח שאי-אפשר לאתר חצי שנה אחרי</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    הלקוח חוזר אחרי שמונה חודשים. "מה אמרת בפעם הקודמת על האילוף עם הסבא של הכלב?" — אין דרך להיזכר.
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
                    <strong>מה לעשות במקום:</strong> דף חנות אישי + טופס פניות עם מעקב מקור (UTM). תוך חודש יתברר בדיוק איזו השקעה משתלמת.
                </p>

                <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">החיבור בין החמש</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    כל אחת מהחמש לבד היא בעיה קלה. הקסם הוא שהן מתחברות: לקוח באקסל אחד, מפגש שלא תועד, הצעת מחיר ב-Word, חשבונית בידנית, וטופס פניות שלא יודע מאיפה הליד הגיע — זה לא חמישה קבצים נפרדים. זו חצי שעה ביום שהולכת לאיבוד.
                </p>
                <p className="text-text-secondary leading-relaxed mb-4">
                    כלי שמחבר אותן יכול להחזיר לך 30-60 דקות ביום. לחודש זה עוד 10-20 שעות שאפשר להפנות לאילוף עצמו, או לעצמך.
                </p>

                <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-text-secondary mb-4">
                        רוצה לראות איך זה עובד בפועל? Doggo CRM נבנה במיוחד למאלפי כלבים בישראל — לקוחות, תוכניות, יומן, חשבוניות והצעות מחיר במקום אחד.
                    </p>
                    <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                        להתחיל בחינם
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

                <RelatedPosts currentSlug={post.slug} />

                <div className="mt-16">
                    <NewsletterCTA
                        source={`blog:${post.slug}`}
                        title="היה מעניין?"
                        subtitle="טיפ שבועי על ניהול עסק אילוף — מחירון, שיווק, לקוחות, תהליכים. בלי ספאם."
                    />
                </div>

                <footer className="mt-12 pt-8 border-t border-border flex items-center justify-between text-sm text-text-muted">
                    <Link to="/blog" className="hover:text-primary transition-colors">← כל הפוסטים</Link>
                    <Link to="/" className="hover:text-primary transition-colors">דף הבית</Link>
                </footer>
            </article>
        </div>
    );
}

export const BLOG_POSTS_LIST = Object.values(POSTS);

function RelatedPosts({ currentSlug }: { currentSlug: string }) {
    const others = Object.values(POSTS).filter(p => p.slug !== currentSlug);
    // Pick 3 deterministically based on slug hash so each post shows a stable
    // set of related links (good for SEO crawling — same anchors every time).
    const hash = Array.from(currentSlug).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 0);
    const picks: typeof others = [];
    for (let i = 0; i < 3 && i < others.length; i++) {
        picks.push(others[(hash + i * 7) % others.length]);
    }
    if (picks.length === 0) return null;

    return (
        <section className="mt-16 pt-8 border-t border-border">
            <h2 className="text-xl font-bold mb-6 text-text-primary">פוסטים נוספים שיעניינו אותך</h2>
            <div className="grid gap-4 md:grid-cols-3">
                {picks.map(p => (
                    <Link
                        key={p.slug}
                        to={`/blog/${p.slug}`}
                        className="group flat-card p-5 hover:border-primary transition-colors"
                    >
                        <div className="text-xs text-text-muted mb-2 ltr-nums" dir="ltr" style={{ direction: 'ltr', textAlign: 'right' }}>
                            {p.readingMinutes} דק׳ קריאה
                        </div>
                        <h3 className="font-bold text-base text-text-primary group-hover:text-primary transition-colors mb-2 leading-snug">
                            {p.title}
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                            {p.description}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
