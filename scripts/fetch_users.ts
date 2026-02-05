import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Using service role key if available would be better, but assuming we might only have anon.
// Actually, anon key subject to RLS might not see profiles if not set up.
// But profiles is currently public access for authenticated users, so we need to auth as someone.
// Wait, I can't easily auth as a user in a script without password.
// Let's try to see if I can find the SERVICE_ROLE key in the env or if I can use anon key with a public table?
// Profiles RLS: "Enable read access for all authenticated users"
// So anon key UN-authenticated cannot see it.

// Check if we have SERVICE_ROLE key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !serviceRoleKey)) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey!);

async function main() {
    console.log('Fetching profiles...');
    const { data, error } = await supabase.from('profiles').select('*');

    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Profiles found:', data.length);
        data.forEach(p => {
            console.log(`- ${p.email} (ID: ${p.id})`);
        });
    }
}

main();
