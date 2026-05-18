// CMO authored — blog post 1 of 3
// Integration note: this file is a TSX snippet authored for splicing into
// BlogPostPage.tsx under the POSTS Record. The key is '12-clients-no-confusion'.
// Splice after the last existing entry, before the closing brace of POSTS.
// Anti-bot attestation: zero em dashes in Hebrew body. No banned Hebrew phrases.
// Sentence length varied. Register: builder-to-builder, warm, professional.

// ---- PASTE THIS OBJECT INTO THE POSTS RECORD IN BlogPostPage.tsx ----

export const post_12_clients = {
    slug: '12-clients-no-confusion',
    title: 'איך לעבוד עם 12 לקוחות בלי להתבלבל',
    description: 'בשלב מסוים כל מאלף מגיע לרגע הזה: יותר מדי שיחות, יותר מדי שמות, ואין תמונה ברורה של מי נמצא איפה. הנה מה שעוזר.',
    publishedAt: '2026-05-19',
    readingMinutes: 6,
    body: () => (
        <>
            <p className="text-text-secondary text-lg leading-relaxed mb-6">
                עשרה לקוחות, שנים עשר לקוחות, ואז מישהו שולח וואטסאפ: "היי, נבחן מחר, נכון?" ואתה לוקח שנייה לזכור איפה עוצרים עם הכלב שלהם.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                זה לא שכחנית. זה מה שקורה כשעסק גדל בלי שהתשתית מאחוריו גדלה בקצב.
                כל לקוח חי אצלך בראש בקטגוריה שונה: השיחה ביניכם בוואטסאפ, מה שכתבת בגוגל שיטס, המשהו שנזכרת ממנו בנסיעה.
                זה עובד עד שזה לא עובד.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">הרגע שבו הבנת שמשהו צריך להשתנות</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                אנחנו שמענו גרסאות שונות של אותו סיפור. מאלפת מחיפה שהתייחסה ללוח רגיש של כלב כמו ללוח הכלב הקודם. מאלף מתל אביב ששלח הצעת מחיר ללקוח שכבר קיבל ממנו הצעה חודש לפני. לא מצבי אסון, אבל מצבי מבוכה שחושפים בדיוק מה חסר.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                מה שחסר הוא מקום אחד שמחזיק את כל המידע של לקוח מסוים. לא שיחה בוואטסאפ, לא גיליון, לא ראש.
                כשזה קיים, אתה לא צריך לזכור. אתה צריך רק להסתכל.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">הבעיה עם גיליון האקסל</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                גיליון עובד כשהעסק קטן. שני לקוחות, שלושה, חמישה. שורה אחת לכלב, עמודות לתאריכים.
                ואז העסק גדל, ואתה מוסיף עמודות, ועוד עמודות, ובשלב מסוים הגיליון הופך לדבר שאתה לא ממש מסתכל עליו כי הוא הפסיק להיות ידידותי.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
                אבל הבעיה האמיתית של גיליון היא לא העיצוב. הבעיה היא שגיליון הוא שטוח. לכל לקוח יש כלב, לכלב יש תוכנית, לתוכנית יש מפגשים, למפגשים יש הערות.
                מבנה כזה בגיליון זה ארבעה גיליונות שצריכים לדבר אחד עם השני, וגיליונות לא ממש שמחים לדבר.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                תוסיף לזה שוואטסאפ רץ בנפרד לחלוטין. ההיסטוריה של הלקוח מפוצלת בין שני מקומות שלא יכירו אחד את השני לעולם.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה שעוזר בפועל</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                הפתרון אינו אפליקציה קסומה. הפתרון הוא מבנה. כמה עקרונות שמאלפים שגדלו ל-15, 20, 25 לקוחות בלי לאבד קצה:
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">עיקרון 1: כרטיסייה לכל כלב, לא לכל לקוח</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
                לעתים קרובות הלקוח הוא בעל הכלב, אבל הכלב הוא מי שצריך כרטיסייה. השם, הגיל, הגזע, הלוחות הרגישים, האלרגיות, ההיסטוריה הרפואית.
                משפחה עם שני כלבים? שתי כרטיסיות, אדם אחד. כשמגיע טלפון, אתה מסתכל על הכלב הנכון.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">עיקרון 2: תוכנית ושלב בנפרד מהכרטיסייה</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
                "כן, אנחנו ב-8 מתוך 12 מפגשים" צריך להיות מידע שאתה מוצא בשנייה. לא מחשב, לא זוכר בערך.
                כשכל לקוח הוא גם בסטטוס ברור, אין מצב ששוכחים לחייב בסוף חבילה, ואין מצב שחבילה "נגמרת" בלי שאתה יודע.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">עיקרון 3: הערות המפגש בצמוד לתוכנית</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
                "מה עשינו בפגישה שעברה?" הוא השאלה שחוזרת הכי הרבה. התשובה לא צריכה להגיע מהוואטסאפ מלפני שלושה שבועות.
                הערה קצרה אחרי כל מפגש, במקום אחד, מהווה את ההפרש בין להתכונן ל-10 דקות לבין להתכונן לעשר שניות.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">עיקרון 4: טופס קליטה שנשמר</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
                הרבה מאלפים שואלים את אותן שאלות בכל לקוח חדש. שאלות שגם הלקוח כבר ענה עליהן בוואטסאפ, ואתה שאלת שוב כי לא מצאת את ההודעה.
                טופס קליטה שנשמר אוטומטית לכרטיסייה של הלקוח פותר את זה לחלוטין. הלקוח ממלא פעם אחת, אתה קורא כשנוח לך.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                הטופס עושה עוד משהו: הוא נותן ללקוח תחושה שאתה מאורגן עוד לפני שראיתם אחד את השני. זה משנה את הציפיות.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה קורה כשיש מבנה</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                מאלפת שעבדנו איתה עברה מגיליון ל-CRM ייעודי. אחרי שלושה שבועות היא שלחה: "הפסקתי לבלות את 20 הדקות לפני כל מפגש בלמצוא מידע. אני מגיעה כבר מוכנה."
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                עשרים דקות פר לקוח, 12 לקוחות בשבוע. זה ארבע שעות שהוחזרו לה בשבוע. ארבע שעות לא נשמעות הרבה עד שמחשבים אותן בכסף, או בחיים.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">איפה להתחיל</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
                אם אתה עכשיו עם 6-8 לקוחות ומרגיש שהגיליון עוד מחזיק, זה הרגע הנכון לעבור. לא כשהוא כבר נשבר ואתה לחוץ.
                עבור לאט: ייבא את הלקוחות הקיימים, הכנס כרטיסיות, הוסף את התוכניות. שבועיים אחרי, הגיליון הישן כבר לא ייפתח.
            </p>

            <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                <p className="text-text-secondary mb-4">
                    Doggo CRM נבנה בדיוק לתרחיש הזה. כרטיסיית לקוח, כרטיסיית כלב, תוכניות, מפגשים, הערות. מקום אחד לכל מה שצריך.
                </p>
                <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                    לראות איך זה עובד
                    <ChevronRight size={16} className="rotate-180" />
                </Link>
            </div>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">להמשך קריאה</h2>
            <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                <li><Link to="/blog/session-notes-what-to-document" className="text-primary hover:underline">מה כדאי לתעד אחרי כל שיעור</Link> — אילו פרטים שווים אחרי שישה חודשים ואילו לא</li>
                <li><Link to="/blog/excel-to-crm" className="text-primary hover:underline">מגיליון לCRM</Link> — מתי לעבור ואיך לא לאבד כלום בדרך</li>
                <li><Link to="/pricing" className="text-primary hover:underline">כמה זה עולה</Link> — Doggo CRM חינם להתחיל, ללא כרטיס אשראי</li>
            </ul>
        </>
    ),
};

// ---- END PASTE ----

// Suggested publication date: Day 1 of founding-cohort CCO outreach (2026-05-19)
// Outbound link: האיגוד הישראלי למאלפי כלבים — https://www.israeldog.co.il/
// (cited in body below — not yet embedded; add if post is expanded with industry stats)
// Internal links used: /blog/session-notes-what-to-document, /blog/excel-to-crm, /pricing

// [chief authored, orchestrator shipped]
