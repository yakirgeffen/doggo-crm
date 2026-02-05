import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Checking for orphans (rows with user_id = NULL)...');

    // We can see NULL rows because of the "Hybrid" policy: "using (auth.uid() = user_id or user_id is null)"
    const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null);

    if (error) {
        console.error('Error checking orphans:', error);
    } else {
        console.log(`Found ${count} orphan clients.`);
    }
}

main();
