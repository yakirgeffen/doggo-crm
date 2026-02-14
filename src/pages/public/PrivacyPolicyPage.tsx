import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
    const lastUpdated = '6 בפברואר 2026';
    const contactEmail = 'yakirgeffen@gmail.com';
    const appName = 'DogGo CRM';
    const companyName = 'DogGo';
    const websiteUrl = 'https://doggo-crm-test.vercel.app';

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
                                ברוכים הבאים ל-{appName}. אנו מכבדים את פרטיותכם ומחויבים להגנה על המידע האישי שלכם.
                                מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגינים על המידע שלכם בעת השימוש
                                בפלטפורמת ניהול אילוף הכלבים שלנו.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">2. המידע שאנו אוספים</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">אנו אוספים את סוגי המידע הבאים:</p>

                            <h3 className="text-lg font-semibold text-text-secondary mb-2">2.1 פרטי חשבון</h3>
                            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                                <li>שם וכתובת אימייל (דרך התחברות עם Google)</li>
                                <li>תמונת פרופיל (מחשבון Google שלכם)</li>
                                <li>אסימוני אימות לגישה לשירות</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-text-secondary mb-2">2.2 נתונים עסקיים</h3>
                            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                                <li>פרטי לקוחות שאתם מזינים (שמות, פרטי קשר, מידע על כלבים)</li>
                                <li>תוכניות אימון ורשומות מפגשים</li>
                                <li>הערות והערכות התנהגותיות</li>
                                <li>נתוני תזמון ויומן</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-text-secondary mb-2">2.3 נתוני Google API</h3>
                            <p className="text-text-secondary leading-relaxed">
                                באישורכם המפורש, אנו עשויים לגשת לשירותי Google מוגבלים לשיפור הפונקציונליות:
                            </p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2 mt-2">
                                <li><strong>Gmail (שליחה בלבד):</strong> לשליחת תזכורות מפגשים ללקוחות שלכם בשמכם</li>
                                <li><strong>יומן (קריאה בלבד):</strong> לבדיקת הזמינות שלכם בעת תזמון מפגשים</li>
                            </ul>
                            <p className="text-text-secondary leading-relaxed mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <strong>חשוב:</strong> אנחנו לעולם לא קוראים, מאחסנים או ניגשים לתוכן האימייל שלכם.
                                אנו משתמשים רק ביכולת השליחה של Gmail למסירת תזכורות שאתם מאשרים.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">3. כיצד אנו משתמשים במידע שלכם</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">אנו משתמשים במידע שלכם כדי:</p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li>לספק ולתחזק את שירות ניהול אילוף הכלבים שלנו</li>
                                <li>לאמת את זהותכם ולאבטח את החשבון שלכם</li>
                                <li>לשלוח תזכורות מפגשים ללקוחות שלכם (באישורכם)</li>
                                <li>להציג את זמינות היומן שלכם לתזמון</li>
                                <li>לשפר את השירות וחוויית המשתמש שלנו</li>
                                <li>לתקשר עדכונים חשובים על השירות</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">4. אחסון נתונים ואבטחה</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                הנתונים שלכם מאוחסנים בצורה מאובטחת באמצעות נוהלים מקובלים בתעשייה:
                            </p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li>הנתונים מאוחסנים ב-Supabase, פלטפורמת מסד נתונים ענן מאובטחת</li>
                                <li>כל העברת הנתונים מוצפנת באמצעות TLS/SSL</li>
                                <li>אבטחה ברמת שורה (RLS) מבטיחה שתוכלו לגשת רק לנתונים שלכם</li>
                                <li>האימות מטופל בצורה מאובטחת דרך Google OAuth 2.0</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">5. שיתוף נתונים</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                אנחנו <strong>לא</strong> מוכרים, משכירים או משתפים את המידע האישי שלכם עם צדדים שלישיים, למעט:
                            </p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li>באישורכם המפורש</li>
                                <li>לציות לחובות חוקיות</li>
                                <li>להגנה על הזכויות שלנו או בטיחות המשתמשים</li>
                                <li>עם ספקי שירות שעוזרים להפעיל את הפלטפורמה שלנו (תחת הסכמי הגנת נתונים מחמירים)</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">6. הזכויות שלכם</h2>
                            <p className="text-text-secondary leading-relaxed mb-4">יש לכם את הזכות:</p>
                            <ul className="list-disc list-inside text-text-secondary space-y-2">
                                <li><strong>גישה:</strong> לבקש עותק של המידע האישי שלכם</li>
                                <li><strong>תיקון:</strong> לעדכן או לתקן נתונים לא מדויקים</li>
                                <li><strong>מחיקה:</strong> לבקש מחיקה של החשבון והנתונים שלכם</li>
                                <li><strong>ביטול גישה:</strong> לנתק הרשאות Google בכל עת דרך הגדרות חשבון Google</li>
                                <li><strong>ייצוא:</strong> לבקש ייצוא של הנתונים שלכם בפורמט נייד</li>
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
                            <h2 className="text-2xl font-bold text-text-primary mb-4">9. שינויים במדיניות זו</h2>
                            <p className="text-text-secondary leading-relaxed">
                                אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. נודיע לכם על שינויים משמעותיים
                                על ידי פרסום המדיניות החדשה בדף זה ועדכון תאריך "עודכן לאחרונה".
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">10. צרו קשר</h2>
                            <p className="text-text-secondary leading-relaxed">
                                אם יש לכם שאלות לגבי מדיניות פרטיות זו או שתרצו לממש את זכויות הנתונים שלכם,
                                אנא פנו אלינו ב:
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
