import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export function PrivacyPolicyPage() {
    useEffect(() => {
        document.title = 'מדיניות פרטיות · Doggo CRM';
        return () => { document.title = 'Doggo CRM — ניהול עסק האילוף שלך, בלי גיליונות אקסל'; };
    }, []);

    const lastUpdated = '2 במאי 2026';
    const contactEmail = 'yakirgeffen@gmail.com';
    const appName = 'Doggo CRM';
    const companyName = 'Doggo CRM';
    const websiteUrl = 'https://doggocrm.app';

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-surface-warm">
            {/* Header */}
            <header className="bg-surface border-b border-border sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield size={24} className="text-primary" />
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
                    <h1 className="text-4xl font-black text-text-primary mb-2">מדיניות פרטיות</h1>
                    <p className="text-text-muted mb-8">עודכן לאחרונה: {lastUpdated}</p>

                    <div className="prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">1. הקדמה</h2>
                            <p className="text-text-secondary leading-relaxed">
                                ברוכים הבאים ל-{appName}. אנחנו מכבדים את פרטיות המשתמשים ומחויבים להגנה על המידע האישי שלהם.
                                מדיניות פרטיות זו מסבירה כיצד אנחנו אוספים, משתמשים ומגינים על המידע במהלך השימוש
                                בפלטפורמת ניהול אילוף הכלבים שלנו.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">2. המידע שאנו אוספים</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">אנו אוספים את סוגי המידע הבאים:</p>

                            <h3 className="text-lg font-semibold text-text-secondary mb-2">2.1 פרטי חשבון</h3>
                            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                                <li>שם וכתובת אימייל (דרך התחברות עם Google)</li>
                                <li>תמונת פרופיל (מחשבון ה-Google של המשתמש)</li>
                                <li>אסימוני אימות לגישה לשירות</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-text-secondary mb-2">2.2 נתונים עסקיים</h3>
                            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                                <li>פרטי לקוחות המוזנים למערכת (שמות, פרטי קשר, מידע על כלבים)</li>
                                <li>תוכניות אימון ורשומות מפגשים</li>
                                <li>הערות והערכות התנהגותיות</li>
                                <li>נתוני תזמון ויומן</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-text-secondary mb-2">2.3 נתוני Google API</h3>
                            <p className="text-text-secondary leading-relaxed">
                                באישור מפורש, אנחנו עשויים לגשת לשירותי Google מוגבלים לשיפור הפונקציונליות:
                            </p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2 mt-2">
                                <li><strong>Gmail (שליחה בלבד):</strong> לשליחת תזכורות מפגשים ללקוחות בשם המאלף</li>
                                <li><strong>יומן (קריאה וכתיבה):</strong> לסנכרון מפגשים הנקבעים במערכת אל יומן ה-Google של המאלף, ולבדיקת הזמינות בעת תזמון. לעולם לא נמחק או נשנה אירועים שלא יצרנו.</li>
                            </ul>
                            <p className="text-text-secondary leading-relaxed mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <strong>חשוב:</strong> אנחנו לעולם לא קוראים, מאחסנים או ניגשים לתוכן האימייל של המשתמש.
                                אנחנו משתמשים רק ביכולת השליחה של Gmail למסירת תזכורות מאושרות מראש.
                            </p>

                            <h3 className="text-lg font-semibold text-text-secondary mb-2 mt-6">2.4 ספקי שירות חיצוניים</h3>
                            <p className="text-text-secondary leading-relaxed mb-2">
                                Doggo CRM משתמש בספקי שירות מהימנים לתפעול הפלטפורמה:
                            </p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li><strong>Supabase:</strong> אחסון מסד הנתונים ואימות. הנתונים מאוחסנים בתשתיות מאובטחות.</li>
                                <li><strong>Vercel:</strong> אירוח האפליקציה.</li>
                                <li><strong>Resend:</strong> שירות שליחת מייל טרנזקציוני (אישורי פגישה, תזכורות, הודעות לידים).</li>
                                <li><strong>Cloudflare Turnstile:</strong> CAPTCHA בטופס הפניות הציבורי, להגנה מפני בוטים.</li>
                                <li><strong>Sumit / חשבונית ירוקה (Morning):</strong> במקרה של חיבור חשבון, מפתחות ה-API משמשים אך ורק להפקת חשבוניות והצעות מחיר בשם המאלף. אנחנו לא מאחסנים את נתוני הלקוחות בחשבונות ספקי החיוב; הם נשלחים אליהם דרך ה-API שלהם.</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">3. כיצד אנחנו משתמשים במידע</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">אנחנו משתמשים במידע כדי:</p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li>לספק ולתחזק את שירות ניהול אילוף הכלבים שלנו</li>
                                <li>לאמת זהות ולאבטח את החשבון</li>
                                <li>לשלוח תזכורות מפגשים ללקוחות (באישור מראש)</li>
                                <li>להציג את זמינות היומן לצורך תזמון</li>
                                <li>לשפר את השירות וחוויית המשתמש שלנו</li>
                                <li>לתקשר עדכונים חשובים על השירות</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">4. אחסון נתונים ואבטחה</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                הנתונים מאוחסנים בצורה מאובטחת באמצעות נוהלים מקובלים בתעשייה:
                            </p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li>הנתונים מאוחסנים ב-Supabase, פלטפורמת מסד נתונים ענן מאובטחת</li>
                                <li>כל העברת הנתונים מוצפנת באמצעות TLS/SSL</li>
                                <li>אבטחה ברמת שורה (RLS) מבטיחה גישה לנתונים אישיים בלבד</li>
                                <li>האימות מטופל בצורה מאובטחת דרך Google OAuth 2.0</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">5. שיתוף נתונים</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                אנחנו <strong>לא</strong> מוכרים, משכירים או משתפים את המידע האישי עם צדדים שלישיים, למעט:
                            </p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li>באישור מפורש מראש</li>
                                <li>לציות לחובות חוקיות</li>
                                <li>להגנה על הזכויות שלנו או בטיחות המשתמשים</li>
                                <li>עם ספקי שירות שעוזרים להפעיל את הפלטפורמה שלנו (תחת הסכמי הגנת נתונים מחמירים)</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">6. הזכויות של המשתמש</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">למשתמש עומדת הזכות:</p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li><strong>גישה:</strong> לבקש עותק של המידע האישי</li>
                                <li><strong>תיקון:</strong> לעדכן או לתקן נתונים לא מדויקים</li>
                                <li><strong>מחיקה:</strong> לבקש מחיקה של החשבון והנתונים</li>
                                <li><strong>ביטול גישה:</strong> לנתק הרשאות Google בכל עת דרך הגדרות חשבון Google</li>
                                <li><strong>ייצוא:</strong> לבקש ייצוא של הנתונים בפורמט נייד</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">7. עוגיות ומעקב</h2>
                            <p className="text-text-secondary leading-relaxed">
                                אנו משתמשים בעוגיות חיוניות בלבד לאימות וניהול הפעלה.
                                אנחנו לא משתמשים בעוגיות מעקב, עוגיות אנליטיקה או עוגיות פרסום.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">8. פרטיות ילדים</h2>
                            <p className="text-text-secondary leading-relaxed">
                                השירות שלנו מיועד למאלפי כלבים מקצועיים ואינו מופנה לילדים מתחת לגיל 13.
                                אנחנו לא אוספים ביודעין מידע אישי מילדים.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">9. ציות לחוק הישראלי</h2>
                            <p className="text-text-secondary leading-relaxed">
                                Doggo CRM פועל בהתאם ל<strong>חוק הגנת הפרטיות, התשמ"א-1981</strong> ולתקנותיו (תקנות הגנת הפרטיות (אבטחת מידע), התשע"ז-2017).
                                מאלפי הכלבים המנהלים נתוני לקוחות הם מנהלי המאגר; Doggo CRM מספק את התשתית הטכנית כעוסק בנתונים מטעמם.
                                המידע מאוחסן בתשתיות עם אבטחה ברמת שורה (RLS) המבטיחה הפרדה מלאה בין מאגרי לקוחות של מאלפים שונים.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">10. שינויים במדיניות זו</h2>
                            <p className="text-text-secondary leading-relaxed">
                                אנחנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. הודעה על שינויים משמעותיים תינתן
                                על ידי פרסום המדיניות החדשה בדף זה ועדכון תאריך "עודכן לאחרונה".
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">11. יצירת קשר</h2>
                            <p className="text-text-secondary leading-relaxed">
                                לשאלות לגבי מדיניות פרטיות זו או למימוש זכויות הנתונים,
                                ניתן לפנות אלינו ב:
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
                    <Link to="/terms" className="text-primary hover:text-primary/80 font-medium hover:underline">
                        ← צפייה בתנאי השימוש
                    </Link>
                </div>
            </main>
        </div>
    );
}
