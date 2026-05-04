import { supabase, logActivity } from '../lib/supabase';

// iter 135 hardening: this seed script was the source of the Feb 2 orphan
// rows that necessitated the iter 135 cleanup migration. The /seed route
// is gated behind `import.meta.env.DEV` in App.tsx AND a redirect in
// SeedPage.tsx, but a stale-build path or a future direct caller could
// bypass both. This module-level assertion provides a third defense:
// even if seedHebrewData() is called from a non-DEV runtime (test harness,
// console one-liner, etc.), it throws before mutating the DB.
//
// Relatedly, we now insert with explicit user_id from the authenticated
// session — the prior version omitted user_id and relied on the
// clients.user_id default (auth.uid()), which is fine when there's an
// auth context but creates NULL orphans when there isn't (service role,
// no session). Belt and suspenders.

function assertSeedAllowed(): void {
    if (!import.meta.env.DEV) {
        throw new Error(
            'seedHebrewData() called outside DEV build. Seed scripts must never run in production — the iter 135 audit traced 11 orphan client rows + 13 orphan program rows back to a Feb 2 seed run with no auth context. See CLAUDE.md "CRITICAL: Security & Data Isolation".'
        );
    }
}

const FIRST_NAMES = [
    'נועה', 'איתי', 'מאיה', 'יובל', 'דניאל', 'עומר', 'רוני', 'גיא', 'שירה', 'אורי',
    'עידו', 'מיכל', 'יוני', 'טל', 'עדי', 'תמר', 'אלון', 'גל', 'ניב'
];

const LAST_NAMES = [
    'כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'דהן', 'אברהם', 'פרידמן', 'מלכה', 'אזולאי',
    'חדד', 'עמר', 'גבאי', 'יוסף', 'שפירא'
];

const DOG_NAMES = [
    'שוקו', 'לאסי', 'בלה', 'מקס', 'לוקה', 'סימבה', 'נלה', 'טופי', 'לולה', 'רקס',
    'בוני', 'מיקה', 'צ\'ארלי', 'רוקי', 'ג\'וני', 'פו', 'כתם', 'שלג'
];

const DOG_BREEDS = [
    'לברדור', 'גולדן רטריבר', 'בורדר קולי', 'רועה גרמני', 'פודל', 'פוקס טרייר',
    'בולדוג צרפתי', "ג'ק ראסל", 'הסקי סיבירי', 'בייגל', 'מעורב', null, null,
];

const PROGRAMS = [
    { name: 'אילוף גורים', type: 'fixed_sessions', sessions: 5 },
    { name: 'משמעת מתקדמת', type: 'fixed_sessions', sessions: 10 },
    { name: 'טיפול בחרדות', type: 'open_ended', sessions: null },
    { name: 'אילוף בסיסי', type: 'fixed_sessions', sessions: 6 },
    { name: 'קבוצת גורים', type: 'fixed_sessions', sessions: 4 },
];

const NOTES = [
    'כלב אנרגטי מאוד, צריך הרבה פריקת אנרגיה.',
    'חששן מאנשים זרים, לעבוד על חשיפה.',
    'אוהב חטיפים, עובד טוב עם חיזוקים חיוביים.',
    'נוטה למשוך בטיול, לעבוד על הליכה רפויה.',
    'מסתדר מצוין עם כלבים אחרים.',
    'יש בעיה של נביחות כשמשאירים אותו לבד.'
];

function getRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPhone() {
    return `05${Math.floor(Math.random() * 9 + 1)}-${Math.floor(Math.random() * 899999 + 100000)}`;
}

export async function seedHebrewData() {
    assertSeedAllowed();
    console.log('Starting seed...');

    // iter 135: explicit user_id on every insert. The clients.user_id column
    // is now NOT NULL with default auth.uid(); the default WOULD pick up the
    // session, but being explicit removes any ambiguity (and fails loudly if
    // the seed is somehow called without an authenticated session, instead
    // of silently inserting orphans).
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('seedHebrewData() requires an authenticated session. Log in first, then visit /seed.');
    }

    const clientsToCreate = [];

    // 1. Generate 10 Clients
    for (let i = 0; i < 10; i++) {
        const firstName = getRandom(FIRST_NAMES);
        const lastName = getRandom(LAST_NAMES);
        clientsToCreate.push({
            full_name: `${firstName} ${lastName}`,
            email: `user${Date.now()}_${i}@example.com`,
            phone: getRandomPhone(),
            primary_dog_name: getRandom(DOG_NAMES),
            primary_dog_breed: getRandom(DOG_BREEDS),
            notes: getRandom(NOTES),
            is_active: Math.random() > 0.3, // 70% active
            user_id: user.id,
        });
    }

    const { data: clients, error: clientError } = await supabase
        .from('clients')
        .insert(clientsToCreate)
        .select();

    if (clientError) {
        console.error('Error creating clients:', clientError);
        return;
    }

    console.log(`Created ${clients.length} clients.`);

    // 2. Create Programs & Sessions for them
    for (const client of clients) {
        // 80% chance to have a program
        if (Math.random() > 0.2) {
            const progTemplate = getRandom(PROGRAMS);
            const { data: program, error: progError } = await supabase
                .from('programs')
                .insert([{
                    client_id: client.id,
                    program_name: progTemplate.name,
                    program_type: progTemplate.type,
                    sessions_included: progTemplate.sessions,
                    status: Math.random() > 0.3 ? 'active' : 'completed',
                    sessions_completed: Math.floor(Math.random() * 5),
                    user_id: user.id, // iter 135: explicit owner
                }])
                .select()
                .single();

            if (progError) {
                console.error('Error creating program:', progError);
                continue;
            }

            // Log activity
            await logActivity('client', client.id, 'updated', `Started program: ${program.program_name}`);

            // Maybe add some sessions logs?
            // For now, simple creation is enough to populate the list.
        }
    }

    console.log('Seeding complete!');
    // alert was removed as it does not exist in module scope or is bad practice
}
