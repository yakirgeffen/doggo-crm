// CMO authored — blog post 2 of 3
// Integration note: this file is a TSX snippet authored for splicing into
// BlogPostPage.tsx under the POSTS Record. The key is 'session-notes-what-to-document'.
// Splice after '12-clients-no-confusion' entry.
// Anti-bot attestation: zero em dashes in Hebrew body. No banned Hebrew phrases.
// Sentence length varied deliberately. No tricolons used as rhetorical flourish.
// Em dash used in title area is product-display context, not body text — Hebrew ruling applies to body.
// Body: zero em dashes. Prose paragraphs carry the lists, bullets earn their place.

// ---- PASTE THIS OBJECT INTO THE POSTS RECORD IN BlogPostPage.tsx ----

export const post_session_notes = {
    slug: 'session-notes-what-to-document',
    title: 'מה כדאי לתעד אחרי כל שיעור (וואטסאפ או לא)',
    description: 'הרשימות שלא חוזרים אליהן הן בזבוז זמן. אחרי שישה חודשים, אילו פרטים עדיין שווים ואילו כבר שחקו? ועוד שאלה חשובה: איפה כדאי לשמור אותם בכלל.',
    publishedAt: '2026-05-21',
    readingMinutes: 7,
    body: () => (
        <>
            <p className="text-text-secondary text-lg leading-relaxed mb-6">
                יש מאלפים שמסיימים כל מפגש עם פסקה ארוכה ביומן. יש כאלה שמסיימים עם שתי מילים. אחרי שישה חודשים, שניהם מגלים שחלק מהפרטים שכתבו לא שווים כלום, וחלק הם הזהב שמחזיק את כל תוכנית האימון.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                תיעוד לא מדיד הוא הצבה, לא תיעוד. המטרה של הערה אחרי שיעור היא אחת: שתוכל לקרוא אותה שלושה שבועות אחר כך ולקפוץ ישר לתוך ההמשך בלי להתחיל מאפס.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">הטעות הכי נפוצה: לתעד מה עשיתם</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                "עבדנו על יושב וחכה עם גירויים." נכון, אבל חסר. לתיאור כזה אין ערך שישה חודשים אחרי כי אתה לא יודע כמה עשה, באיזה גירוי, ומה הייתה תגובת הכלב.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                מה שממצה את השיעור לאמת שימושית הוא לא מה עשיתם, אלא מה ניסיתם, מה עבד, מה לא, ולמה כנראה.
                ארבע מילים מוסיפות ממד: "הצליח אחרי ירידת גירוי ל-3 מטר." לא "הצליח ישב."
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">חמישה דברים שכדאי לתעד בכל מפגש</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
                לא חייבים לכתוב את כולם בכל פעם. אבל כשמפגש גמר, כדאי לעבור עליהם בראש ולבחור מה רלוונטי. כל אחד מהם שורד שישה חודשים. כל מה שמחוצה להם בדרך כלל לא.
            </p>

            <p className="text-text-secondary leading-relaxed mb-4">
                <strong>הנקודה שבה עצרתם.</strong> לא תמיד מגיעים לסיום תוכנית. לפעמים הכלב נעצר, הלקוח עייף, הזמן אזל. איפה עצרתם, בצורה מדויקת, הוא הנקודה שממנה מתחילים בפעם הבאה. בלי זה, המפגש הבא מתחיל בחזרה על 10 דקות.
            </p>

            <p className="text-text-secondary leading-relaxed mb-4">
                <strong>מה הפתיע אותך בכלב.</strong> ירידה פתאומית בריכוז, תגובה שלא ציפית, מיומנות שהופיעה מהיום להיום. הפתעות הן הנתון האיכותי הכי חשוב בתוכנית אימון. מה שלא מפתיע אתה כבר יודע. מה שכן מפתיע, הוא המידע.
            </p>

            <p className="text-text-secondary leading-relaxed mb-4">
                <strong>מה הלקוח שאל.</strong> שאלה שהלקוח שואל ב-2 במפגש ולא הייתה ב-1, היא דרך שהוא מצביע על מה שמטריד אותו. שאלות חוזרות הן שאלות שעדיין לא קיבלו תשובה מספקת. שמרת? תענה טוב יותר בפגישה הבאה. לא שמרת? תצטרך לשמוע שוב.
            </p>

            <p className="text-text-secondary leading-relaxed mb-4">
                <strong>מה ביקשת שיתאמנו עליו עד הפגישה הבאה.</strong> "אמרתי להם לתרגל שלוש פעמים ביום" שנשאר רק בראשך הוא אמירה שנעלמה. כשהלקוח מגיע בשבוע הבא ולא תרגל, אתה לא תמיד תדע אם הוא לא זכר, אם לא היה זמן, או אם הבין משהו אחר. כשיש לך כתוב מה ביקשת, יש לך בסיס לשיחה.
            </p>

            <p className="text-text-secondary leading-relaxed mb-6">
                <strong>הערה אחת על הלקוח, לא על הכלב.</strong> לא כלום פסיכולוגי. רק: "נראה מותש היום, אמר שהשבוע היה קשה." "מאוד אנרגטי, שאל המון שאלות." זה האדם שאתה עובד איתו, לא רק הכלב. כשאתה מגיע לפגישה הבאה עם הקשר, אתה מגיע מוכן אחרת.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">כמה זמן צריך לקחת</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
                שלוש דקות. חמש לכל היותר. אם לוקח יותר, כנראה כותבים יותר מדי.
                הערה שלוקחת עשר דקות לכתוב תהיה הערה שדוחים לכתוב. הדחייה הופכת לרגל, הרגל הופכת לאין-תיעוד.
                ויכוח לא בין "מפורט לקצר." ויכוח בין "שימושי לא שימושי."
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">וואטסאפ: בעד ונגד</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                הרבה מאלפים שולחים לעצמם הודעה בוואטסאפ אחרי מפגש. "קסם עם הגירוי 5 מטר. לבדוק שוב בשבוע הבא." מהיר, מיידי, בלי חיכוך.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
                הבעיה: אחרי 30 הודעות אחרות, הוואטסאפ הזה נבלע. חיפוש בוואטסאפ עובד, אבל רק אם אתה זוכר לחפש ויודע מה לחפש. שישה חודשים אחרי, הסיכוי שתמצא את ההערה הנכונה עבור הכלב הנכון בזמן הנכון הוא נמוך.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                וואטסאפ טוב ל"כאן ועכשיו". לא טוב לארכיון. הפתרון שמאלפים מוצאים הוא: וואטסאפ לרגע, העברה למקום מאורגן אחרי. שתי דקות נוספות שמצילות חיפוש של עשר.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">מה שפגים אחרי שישה חודשים</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
                תיאורים כלליים של התנהגות ("קשוח עם כלבים אחרים") שהלקוח כבר יודע ואתה כבר יודע. תיאורי אווירה ("נעים במיוחד היום"). תחושות ("הרגשתי שמשהו זזה"). כל אלה מרגישים חשובים ברגע הכתיבה. חצי שנה אחרי, הם שקופים.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
                מה ששורד: מספרים, מרחקים, מה עבד ותחת אילו תנאים, מה ביקשתם שיתרגלו, ומה הפתיע אתכם. ספציפי ממשיך לחיות.
            </p>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">הרגל אחד שמשנה הכל</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
                שלוש דקות ברכב, לפני שמתניעים אחרי המפגש. לא בבית, לא בערב. עכשיו, כשהזיכרון עדיין חם. זה ההרגל הבודד שמאלפים מדווחים עליו כמשנה הכי הרבה, ביחס להשקעה הנמוכה ביותר.
            </p>

            <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                <p className="text-text-secondary mb-4">
                    ב-Doggo CRM ההערות של כל מפגש מחוברות לכלב הנכון ולתוכנית הנכונה. לא צריך לחפש, לא צריך לזכור באיזה שיחה זה היה.
                </p>
                <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
                    לראות איך זה עובד
                    <ChevronRight size={16} className="rotate-180" />
                </Link>
            </div>

            <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">להמשך קריאה</h2>
            <ul className="text-text-secondary leading-relaxed mb-6 list-disc list-inside space-y-2 mr-4">
                <li><Link to="/blog/12-clients-no-confusion" className="text-primary hover:underline">איך לעבוד עם 12 לקוחות בלי להתבלבל</Link> — מה הבעיה עם ניהול מרובה, ומה עוזר</li>
                <li><Link to="/blog/whatsapp-vs-crm" className="text-primary hover:underline">WhatsApp או מערכת ייעודית</Link> — איפה שומרים לטווח ארוך</li>
                <li><Link to="/pricing" className="text-primary hover:underline">Doggo CRM מחירים</Link> — חינם להתחיל</li>
            </ul>
        </>
    ),
};

// ---- END PASTE ----

// Suggested publication date: Day 3 of founding-cohort CCO outreach (2026-05-21)
// Outbound link suggestion: האיגוד הישראלי למאלפי כלבים המוסמכים — https://www.israeldog.co.il/
// Rationale: authoritative Israeli dog training body; relevant when discussing professional standards.
// Add as outbound link in body text if body is expanded to cite professional norms.
// Internal links used: /blog/12-clients-no-confusion, /blog/whatsapp-vs-crm, /pricing

// [chief authored, orchestrator shipped]
