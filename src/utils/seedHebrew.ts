import { supabase, logActivity } from '../lib/supabase';

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

function getRandom(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPhone() {
    return `05${Math.floor(Math.random() * 9 + 1)}-${Math.floor(Math.random() * 899999 + 100000)}`;
}

export async function seedHebrewData() {
    console.log('Starting seed...');
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
            notes: getRandom(NOTES),
            is_active: Math.random() > 0.3, // 70% active
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
    alert('Seeding complete! 10 Hebrew clients added.');
}
