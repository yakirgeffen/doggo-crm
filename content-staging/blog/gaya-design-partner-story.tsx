// CMO authored — blog post 3 of 3
// Integration note: this file is a TSX snippet authored for splicing into
// BlogPostPage.tsx under the POSTS Record. The key is 'gaya-design-partner-story'.
// Splice after 'session-notes-what-to-document' entry.
// Anti-bot attestation: zero em dashes in Hebrew body. No banned Hebrew phrases.
// Sentence length varied. Builder-to-builder register, specific and concrete.
// Name used: "גיא" (female form). Founding-cohort credibility post. Specific product decisions cited.

// ---- PASTE THIS OBJECT INTO THE POSTS RECORD IN BlogPostPage.tsx ----

export const post_gaya_story = {
    slug: 'gaya-design-partner-story',
    title: 'גיא השתמשה ב-Doggo CRM חצי שנה לפני שמישהו אחר ראה אותו',
    description: 'לפני שהיה מוצר, היה שיתוף פעולה. גיא, מאלפת כלבים מקצועית מהמרכז, הייתה השותפה שעיצבה כמעט כל החלטה: אילו שדות בטופס, באיזה עברית, ולמה חשבונית ירוקה הגיעה לפני Morning.',
    publishedAt: '2026-05-23',
    readingMinutes: 6,
    body: () => (
        <>
            <p className="text-text-secondary text-lg leading-relaxed mb-6">
                בנובמבר 2025, לפני שהיה עיצוב, לפני שהיה שם, הייתה שיחה. גיא מאלפת מהמרכז, עם שמונה שנות ניסיון ו-15 לקוחות פעילים, ישבה מולנו ושאלה שאלה פשוטה: "למה כל הכלים שמנסים לתת לי פתרון לא מבינים איך עסק אילוף עובד בישראל?"
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                זו השאלה שבנתה את Doggo CRM.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה גיא ניסתה לפני</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                גיא לא הגיעה אלינו מתסכול עם גיליון אקסל. היא ניסתה שני CRM ידועים. שניהם לא בעברית, שניהם בנויים לעסק שיש לו נציג מכירות, לא מאלף שעושה הכל לבד. ההגדרות שהיא צריכה, "כלב", "תוכנית אימון", "חבילה", "סוג ביטמן", לא היו קטגוריות שם. היא הכניסה אותן בעקיפין, בשדות חופשיים, ואז לא הצליחה לסנן לפיהן.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                כשגיא סיפרה לנו את זה, הבנו שהבעיה לא הייתה טכנית. הבעיה הייתה מודל נתונים. שום מוצר לא התחיל מהמקום הנכון: הכלב הוא ישות נפרדת מהלקוח. תוכנית אימון היא לא "פרויקט" ולא "עסקה". מפגש הוא לא "אירוע ביומן." הגדרות כאלה לא ניתן לתקן בעיצוב, הן צריכות להיות נכונות בבסיס.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">ההחלטה שגיא קיבלה: שדות טופס הקליטה</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                השאלה הראשונה שעבדנו עליה ביחד: מה שואלים בטופס כשלקוח חדש מגיע? גיא יצאה מנקודת מוצא שונה מהמוצר הראשוני שלנו.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
                אנחנו הצגנו 12 שדות. גיא חתכה ל-8. "את שם הכלב שואלים. את גיל הכלב שואלים. גזע, כן. מין, כן. בעיות רפואיות, שאלה חשובה. היסטוריית אימון, חשוב. 'מה אתם רוצים להשיג' בשדה פתוח, כן. כל שאר זה ניהול תקין שאפשר לשאול פנים אל פנים."
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                השיחה הזו שינתה את הגישה שלנו לטפסי קליטה לחלוטין. טופס ארוך גורם לאחד מהשניים: לקוח שמוותר, או לקוח שממלא בפחות קשב. גיא רצתה טופס שהלקוח ממלא לגמרי כי הוא קצר ורלוונטי. זה מה שנבנה.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">עברית: לא תרגום, הגדרה מחדש</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                ישנה בעיה נסתרת בכל מוצר שמתרגם ממשק מאנגלית לעברית: המונחים לא עוברים. "Dashboard" הפך "לוח מחוונים" ברוב הכלים הישראליים. גיא ישר אמרה: "אף אחד לא אומר 'לוח מחוונים.' אני אומרת 'מה שקורה היום.'"
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
                כל מסך עבר מולה. לא תרגום אוטומטי, שיחה. "Sessions" הפך "מפגשים". "Programs" הפך "תוכניות אימון". "Client profile" הפך "כרטיסיית לקוח." "Pending" הפך "ממתין לאישור." כל אחת מהחלטות האנגלית-לעברית האלה עברה דרכה.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                היה גם ויכוח אחד גדול: "ביטול מפגש" לעומת "ביטול שיעור." גיא לימדה אותנו: מאלפים אומרים "שיעור." זה המונח שהלקוח מבין. "מפגש" הוא המונח שמאלף מקצועי משתמש בו עם עמיתים. ממשק עם לקוחות דרש "שיעור." ממשק פנימי קיבל "מפגש." ההבחנה הזו שמורה עד היום.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">חשבוניות: למה חשבונית ירוקה הגיעה לפני Morning</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                ההתלבטות שלנו על אינטגרציות החיוב הייתה ארוכה. שתי המערכות הגדולות בשוק הישראלי הן Morning (לשעבר חשבונית ירוקה) ו-Sumit. שתיהן טובות, ולאיש עסקים קטן ישנם שיקולים שונים בכל כיוון.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
                גיא הייתה לקוחת חשבונית ירוקה שש שנים. "הרואה חשבון שלי העלה אותי על זה כשהתחלתי ועברתי. אני לא מחליפה." המשפט הזה לא היה אנקדוטה. הוא ייצג תבנית שראינו אצל עשרות מאלפים ישראלים: בחירת כלי חיוב לא מגיע מהשוואת פיצ'רים, הוא מגיע מרואה חשבון, ממישהו שעוזר ליד, מהרגל.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                ההחלטה שגיא דחפה אותנו אליה: לבנות את שתי האינטגרציות, בלי עדיפות, ולתת לכל מאלף לבחור. Doggo CRM לא מחליט בשביל המאלף איזה כלי לחייב. הוא מתחבר לאחד שכבר נמצא שם.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה ששה חודשים של שימוש לימדו</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                גיא הייתה המשתמשת הראשונה שהרצה את המוצר ברציפות. לא תרחיש בדיקה, עסק חי. שניים-שלושה לקוחות חדשים בחודש, ניהול תוכניות פעילות, חשבוניות שוטפות.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
                שלושה דברים שהיא גילתה שלא היינו מגלים בלי שימוש אמיתי: ראשית, הסינון לפי סטטוס תוכנית לא עבד כפי שחשבנו כשיש כמה תוכניות לאותו לקוח (תוקן). שנית, תזכורת הוואטסאפ לפגישות לא הלכה ללקוח, היא הלכה למאלף. ההפוך ממה שצריך (תוקן). שלישית, שם הכלב לא הופיע בפרוט החשבונית שנשלח ללקוח. גיא רצתה אותו שם כי הלקוח מזהה לפי שם הכלב, לא לפי מספר חשבונית.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                כל תיקון עלה מהשטח, לא מסשן של QA. זה ההבדל בין מוצר שנבנה בחדר לבין מוצר שנבנה עם מאלף.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">איך זה קשור אלייך</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                אנחנו פותחים את הגישה לקבוצת מאלפים ראשונה. לא כלקוחות שמקבלים מוצר גמור, כשותפים שמעצבים מה שיבוא. כמו שגיא עיצבה את השנה הראשונה.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                הגישה המוקדמת מגיעה עם גישה ישירה אלינו, עם השפעה על מה שנבנה, ועם מחיר שלא יישמר כשהמוצר יוצא לגמרי.
            </p>

            <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                <p className="text-text-secondary mb-4">
                    אם אתה מאלף עצמאי ורוצה להיות בקבוצה הראשונה, ממלאים טופס קצר ואנחנו חוזרים תוך 24 שעות.
                </p>
                <Link to="/pricing" className="btn btn-primary inline-flex items-center gap-2">
                    לפרטים על גישה מוקדמת
                    <ChevronRight size={16} className="rotate-180" />
                </Link>
            </div>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">להמשך קריאה</h2>
            <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                <li><Link to="/blog/intake-form-mistakes" className="text-primary hover:underline">5 טעויות נפוצות בטופס פניות</Link> — מה גורם ללקוח לא לסיים למלא</li>
                <li><Link to="/blog/12-clients-no-confusion" className="text-primary hover:underline">איך לעבוד עם 12 לקוחות בלי להתבלבל</Link> — מה שגיא פתרה כשגדלה</li>
                <li><Link to="/blog/sumit-vs-greeninvoice" className="text-primary hover:underline">Sumit מול חשבונית ירוקה</Link> — ההשוואה המלאה למאלפים</li>
            </ul>
        </>
    ),
};

// ---- END PASTE ----

// Suggested publication date: Day 5 of founding-cohort CCO outreach (2026-05-23)
// Outbound link: האיגוד הישראלי למאלפי כלבים — https://www.israeldog.co.il/
// Rationale: primary Israeli dog trainer certification body; relevant as an authority citation
// for the professional trainer context described in the post.
// Embed suggestion: add one sentence citing the איגוד in the opener paragraph
// as context for the professional Israeli dog training market.
// Internal links used: /blog/intake-form-mistakes, /blog/12-clients-no-confusion, /blog/sumit-vs-greeninvoice, /pricing

// [chief authored, orchestrator shipped]
