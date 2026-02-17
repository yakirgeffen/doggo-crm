
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load .env from project root
config({ path: path.join(process.cwd(), '.env') });
config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrphans() {
    console.log('Checking for orphans (NULL user_id)...');

    const tables = ['clients', 'programs', 'sessions', 'services'];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .is('user_id', null);

        if (error) {
            console.error(`Error checking ${table}:`, error.message);
        } else {
            console.log(`${table}: ${count} orphans found.`);
        }
    }

    // Check intake_submissions (trainer_id)
    const { count: intakeCount, error: intakeError } = await supabase
        .from('intake_submissions')
        .select('*', { count: 'exact', head: true })
        .is('trainer_id', null);

    if (intakeError) {
        console.error(`Error checking intake_submissions:`, intakeError.message);
    } else {
        console.log(`intake_submissions: ${intakeCount} orphans found.`);
    }
}

checkOrphans();
