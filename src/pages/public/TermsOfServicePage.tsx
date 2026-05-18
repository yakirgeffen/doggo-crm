import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export function TermsOfServicePage() {
    useEffect(() => {
        document.title = 'תנאי שימוש · Doggo CRM';
        return () => { document.title = 'Doggo CRM — ניהול עסק האילוף שלך, בלי גיליונות אקסל'; };
    }, []);

    const lastUpdated = '2 במאי 2026';
    const contactEmail = 'hello@doggocrm.app';
    const appName = 'Doggo CRM';
    const companyName = 'Doggo CRM';
    const websiteUrl = 'https://doggocrm.app';

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-surface-warm">
            {/* Header */}
            <header className="bg-surface border-b border-border sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText size={24} className="text-primary" />
                        <span className="font-bold text-text-primary">{appName}</span>
                    </div>
                    <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        <span className="font-medium">חזרה לאפליקציה</span>
                        <ArrowLeft size={20} />
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-surface rounded-2xl shadow-soft border border-border p-8 md:p-12">
                    <h1 className="text-4xl font-black text-text-primary mb-2">תנאי שימוש</h1>
                    <p className="text-text-muted mb-8">עודכן לאחרונה: {lastUpdated}</p>

                    <div className="prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">1. קבלת התנאים</h2>
                            <p className="text-text-secondary leading-relaxed">
                                גישה או שימוש ב-{appName} ("השירות") מהווים הסכמה להיות מחויבים לתנאי שימוש אלה.
                                בהיעדר הסכמה לתנאים אלה, יש להימנע משימוש בשירות שלנו.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">2. תיאור השירות</h2>
                            <p className="text-text-secondary leading-relaxed">
                                {appName} היא פלטפורמת ניהול קשרי לקוחות המיועדת למאלפי כלבים מקצועיים.
                                השירות מאפשר ניהול לקוחות, תזמון מפגשי אימון, מעקב אחר תוכניות
                                ותקשורת עם הלקוחות.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">3. חשבונות משתמש</h2>
                            <h3 className="text-lg font-semibold text-text-secondary mb-2">3.1 הרשמה</h3>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                לצורך שימוש בשירות, יש להתחבר באמצעות חשבון Google. האחריות לשמירה
                                על אבטחת פרטי ההתחברות לחשבון Google מוטלת על המשתמש.
                            </p>

                            <h3 className="text-lg font-semibold text-text-secondary mb-2">3.2 אחריות החשבון</h3>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li>יש לספק מידע מדויק בעת השימוש בשירות</li>
                                <li>האחריות לכל הפעילות תחת החשבון מוטלת על בעל החשבון</li>
                                <li>יש להודיע לנו מיד על כל גישה לא מורשית</li>
                                <li>השימוש בשירות זה מותר מגיל 18 ומעלה</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">4. שימוש מקובל</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">המשתמש בשירות מתחייב שלא:</p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li>להשתמש בשירות לכל מטרה בלתי חוקית</li>
                                <li>להעלות קוד זדוני, וירוסים או תוכן מזיק</li>
                                <li>לנסות לקבל גישה לא מורשית לשירות או למערכותיו</li>
                                <li>להפריע או לשבש את השירות</li>
                                <li>להפר כל חוק או תקנה ישימים</li>
                                <li>להטריד, לפגוע או להזיק לאחרים דרך השירות</li>
                                <li>להשתמש בשירות לשליחת ספאם או תקשורת לא רצויה</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">5. נתוני המשתמש</h2>
                            <h3 className="text-lg font-semibold text-text-secondary mb-2">5.1 בעלות</h3>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                הבעלות על כל הנתונים המוזנים לשירות, כולל מידע על לקוחות, רשומות אימון
                                והערות, נשמרת בידי המשתמש. אנחנו לא טוענים לבעלות על תוכן זה.
                            </p>

                            <h3 className="text-lg font-semibold text-text-secondary mb-2">5.2 רישיון שימוש</h3>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                שימוש בשירות מהווה הענקת רישיון מוגבל אלינו לאחסן, לעבד ולהציג את
                                הנתונים אך ורק לצורך אספקת השירות.
                            </p>

                            <h3 className="text-lg font-semibold text-text-secondary mb-2">5.3 הגנת נתונים</h3>
                            <p className="text-text-secondary leading-relaxed">
                                אנחנו מטפלים בנתוני המשתמשים בהתאם ל
                                <Link to="/privacy" className="text-primary hover:underline">מדיניות הפרטיות</Link> שלנו.
                                האחריות לקבלת הסכמה מתאימה מהלקוחות לאחסון המידע שלהם בשירות
                                מוטלת על המאלף.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">6. שירותי צד שלישי</h2>
                            <p className="text-text-secondary leading-relaxed">
                                השירות משתלב עם שירותי Google (Gmail, יומן) באישור מפורש מראש.
                                השימוש באינטגרציות אלה כפוף לתנאי השירות של Google.
                                אנחנו לא אחראים לזמינות או לפונקציונליות של שירותי צד שלישי.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">7. זמינות השירות</h2>
                            <p className="text-text-secondary leading-relaxed">
                                אנחנו שואפים לשמור על זמינות גבוהה של השירות, אך איננו מתחייבים
                                לגישה רציפה. אנחנו עשויים להשעות את השירות זמנית לתחזוקה,
                                עדכונים או עקב נסיבות שמעבר לשליטתנו.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">8. קניין רוחני</h2>
                            <p className="text-text-secondary leading-relaxed">
                                השירות, כולל העיצוב, התכונות והקוד שלו, שייך ל-{companyName}.
                                אין להעתיק, לשנות, להפיץ או לבצע הנדסה לאחור של כל חלק מהשירות
                                ללא אישורנו בכתב.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">9. הגבלת אחריות</h2>
                            <p className="text-text-secondary leading-relaxed p-4 bg-amber-50 rounded-lg border border-amber-200">
                                השירות מסופק "כמות שהוא" ללא אחריות מכל סוג שהוא, מפורשת או משתמעת.
                                במידה המרבית המותרת על פי חוק, {companyName.toUpperCase()} לא יישא באחריות
                                לכל נזק עקיף, מקרי, מיוחד, תוצאתי או עונשי הנובע מהשימוש בשירות.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">10. שיפוי</h2>
                            <p className="text-text-secondary leading-relaxed">
                                המשתמש בשירות מתחייב לשפות ולהגן על {companyName} מכל תביעות, נזקים
                                או הוצאות הנובעים מהשימוש בשירות, הפרת תנאים אלה
                                או הפרה של זכויות צד שלישי כלשהו.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">11. סיום</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                אנחנו רשאים להשעות או לסיים את הגישה לשירות בכל עת, עם או בלי סיבה.
                                גם המשתמש רשאי למחוק את החשבון בכל עת.
                            </p>
                            <p className="text-text-secondary leading-relaxed">
                                עם הסיום, הזכות להשתמש בשירות תפוג מיד.
                                ניתן לבקש ייצוא של הנתונים לפני מחיקת החשבון.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">12. שינויים בתנאים</h2>
                            <p className="text-text-secondary leading-relaxed">
                                אנחנו עשויים לשנות תנאים אלה בכל עת. הודעה על שינויים משמעותיים תינתן
                                על ידי פרסום התנאים המעודכנים בדף זה. המשך השימוש בשירות
                                לאחר השינויים מהווה הסכמה לתנאים המתוקנים.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">13. הדין החל</h2>
                            <p className="text-text-secondary leading-relaxed">
                                תנאים אלה יהיו כפופים לחוקי מדינת ישראל, מבלי להתחשב בכללי
                                ברירת הדין שלה. כל מחלוקת תיפתר בבתי המשפט בישראל.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">14. יצירת קשר</h2>
                            <p className="text-text-secondary leading-relaxed">
                                לשאלות בנוגע לתנאים אלה, ניתן לפנות אלינו ב:
                            </p>
                            <div className="mt-4 p-4 bg-background rounded-lg">
                                <p className="text-text-secondary">
                                    <strong>{companyName}</strong><br />
                                    אימייל: <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a><br />
                                    אתר: <a href={websiteUrl} className="text-primary hover:underline">{websiteUrl}</a>
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center">
                    <Link to="/privacy" className="text-primary hover:text-primary/80 font-medium hover:underline">
                        ← צפייה במדיניות הפרטיות
                    </Link>
                </div>
            </main>
        </div>
    );
}
