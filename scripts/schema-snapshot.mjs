#!/usr/bin/env node
// ============================================================
// schema-snapshot.mjs — regenerate `scripts/schema-snapshot.json`
// from the live `public` schema.
//
// Workflow when `npm run check:schema` reports drift:
//   1. Apply pending migrations to live DB.
//   2. `npm run schema:snapshot` — overwrites the JSON file.
//   3. Commit the regenerated snapshot in the same PR as the
//      migration that caused the drift.
//
// Auth: same as `check-schema.mjs` (SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY). Gracefully no-ops if missing.
//
// Companion to `scripts/check-schema.mjs` (the diff side) and
// `scripts/schema-snapshot.json` (the artifact). See the check
// script header for the broader context (iter 121 install,
// silent-failure-class fix from iter 114/119/120 audit).
// ============================================================

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = resolve(__dirname, 'schema-snapshot.json');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.log(
        '[schema:snapshot] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — skipping. ' +
        'See scripts/schema-snapshot.mjs header for setup.'
    );
    process.exit(0);
}

const sql = `
    SELECT
        table_name::text AS table_name,
        jsonb_agg(
            jsonb_build_object(
                'name', column_name::text,
                'type', data_type::text,
                'nullable', is_nullable = 'YES',
                'default', column_default
            ) ORDER BY ordinal_position
        ) AS columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
    GROUP BY table_name
    ORDER BY table_name;
`;

const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
const res = await fetch(url, {
    method: 'POST',
    headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
});

if (!res.ok) {
    console.error(
        `[schema:snapshot] Could not query information_schema via REST (HTTP ${res.status}). ` +
        'This script requires an `exec_sql(text)` RPC function in the public schema. ' +
        'Fallback: run the equivalent SQL via Supabase MCP and paste into scripts/schema-snapshot.json manually.'
    );
    process.exit(1);
}

const rows = await res.json();
const tables = {};
for (const row of rows) {
    tables[row.table_name] = { columns: row.columns };
}

const out = {
    generated_at: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    project_id: SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0],
    schema: 'public',
    _purpose: 'Snapshot of the live public schema, regenerated via `npm run schema:snapshot` after every migration. `npm run check:schema` diffs the live DB against this file and fails on drift. Source of truth — when in doubt, trust this file over `supabase_schema.sql` (which is preserved as a founding-phase artifact only). Companion to the iter 117 schema-truth-stale callout and the iter 120 silent-prod-bug arc.',
    tables,
};

await writeFile(SNAPSHOT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`[schema:snapshot] Wrote ${Object.keys(tables).length} tables to scripts/schema-snapshot.json (project ${out.project_id}, generated ${out.generated_at}).`);
