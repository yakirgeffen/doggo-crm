#!/usr/bin/env node
// ============================================================
// check-rls-defaults.mjs — RLS predicate vs column-default guard
//
// === [1] CLASS-OF-BUG ===
// RLS policies of the form `auth.uid() = X` silently reject every row
// when the comparison column X has NULL default AND a code path that
// writes to the table forgets to populate X explicitly. The trainer
// sees nothing (or a generic Hebrew toast); console-only error;
// production telemetry blind. Same surface as iter 120 (Doggo CRM
// 2026-05-03): `activity_logs.performed_by` had a NULL default while
// `auth.uid() = performed_by` was the policy; client `logActivity()`
// didn't set it; every audit-log write silently dropped for 71 days.
//
// Generalization (per QA Avner's Proposal 1, debrief 2026-05-03 #7):
// scan every RLS predicate of the shape `auth.uid() = X`, look up X's
// column default. If `auth.uid()` — safe (DB fills it in). If NULL —
// every writer to that table must populate the column explicitly, OR
// be allowlisted as a known-safe path (service-role bypass, intentional
// reliance on RLS rejection of NULL).
//
// === [2] AUTH ===
// Pure static. Reads scripts/schema-snapshot.json (substrate for both
// column defaults AND `rls_policies` array). No DB access at run time;
// regeneration of the snapshot is a separate step (`npm run schema:snapshot`)
// — see scripts/check-schema.mjs for the env-var requirements there.
// Wiring to prebuild has no env-var dependency.
//
// === [3] USAGE ===
//   npm run check:rls-defaults                       fail on violation
//   npm run check:rls-defaults -- --allow-drift      report but exit 0
//   Refresh substrate: `npm run schema:snapshot` after every migration
//   that adds/removes RLS policies or column defaults.
//
// === [4] ALLOWLIST MECHANISM ===
// Two ways to silence a false positive at an INSERT site:
//
//   (a) INLINE comment on the same line as `.from('<table>').insert(`
//       or any of the three lines immediately preceding it:
//
//         // btg:rls-default-ok <table>.<column> — <reason>
//         await supabase.from('email_send_log').insert({ ... })
//
//   (b) FILE-WIDE declaration anywhere in the file (typical for edge
//       functions where the entire file uses service-role and bypasses
//       RLS, OR for callers that intentionally rely on RLS rejection):
//
//         // btg:rls-default-ok-file <table>.<column> — <reason>
//
//       Multiple declarations stack; one per line. To allowlist all
//       columns of one table use:
//
//         // btg:rls-default-ok-file <table>.* — <reason>
//
// Reasons should be short and substantive ("service-role bypass",
// "intentional RLS rejection on missing user_id", etc.). The guard
// does not parse the reason — it's for future readers, including the
// next person to touch the file.
//
// === [5] WHAT THE GUARD DOES NOT CATCH ===
// Static heuristics on insert payloads:
//   - dynamic property names (`{ [colName]: val }`),
//   - spread operators with conditionally-included keys,
//   - payloads built incrementally across function boundaries,
//   - `.upsert()` calls where the row may exist with the column set
//     from a prior insert,
//   - service-role inserts via raw SQL or RPC.
// These false-positive surfaces all use the allowlist mechanism above.
// The guard ships strict by default; the allowlist is the explicit
// engineering decision to accept the structural risk.
//
// Reference: tools/build-time-guards.md (geffen-studio).
// Sibling guards: scripts/check-routes.mjs (iter 65), scripts/check-schema.mjs (iter 121).
// ============================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SNAPSHOT_PATH = resolve(__dirname, 'schema-snapshot.json');
const SRC_DIRS = ['src', 'supabase/functions'].map((d) => join(ROOT, d));

const ALLOW_DRIFT = process.argv.includes('--allow-drift');

// ---------- substrate ----------

const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));

if (!snapshot.tables || !snapshot.rls_policies) {
    console.error(
        '[check:rls-defaults] schema-snapshot.json missing required fields ' +
        '(tables and rls_policies). Run `npm run schema:snapshot` to refresh.'
    );
    process.exit(2);
}

// ---------- step 1: build column-default index ----------
//
// Map: tableName -> Map<columnName, defaultExpression-or-null>

const columnDefaults = new Map();
for (const [tableName, tableDef] of Object.entries(snapshot.tables)) {
    const colMap = new Map();
    for (const col of tableDef.columns) {
        colMap.set(col.name, col.default ?? null);
    }
    columnDefaults.set(tableName, colMap);
}

// ---------- step 2: parse RLS predicates ----------
//
// We're hunting exactly the iter-120 shape: predicates that contain
// `auth.uid() = <ident>` or `auth.uid() = <table>.<ident>` (plain
// equality; no function wrappers; no NOT/OR around it). pg_policies
// stringifies expressions in the canonical form `(auth.uid() = X)`,
// optionally with table prefix, so a regex on the printed form
// suffices. Any predicate the regex misses is reported as
// "unparsed" — surfaced for review, not failed silently.

const AUTH_UID_RE = /auth\.uid\(\)\s*=\s*(?:([a-zA-Z_][a-zA-Z0-9_]*)\.)?([a-zA-Z_][a-zA-Z0-9_]*)/g;

/**
 * From a single policy row, extract every (table, column) pair the
 * predicate compares against `auth.uid()`. Both qual and with_check
 * are scanned; duplicates collapse via the Set the caller maintains.
 */
function extractCmpColumns(policy) {
    const out = [];
    for (const expr of [policy.qual, policy.with_check]) {
        if (!expr) continue;
        for (const m of expr.matchAll(AUTH_UID_RE)) {
            const prefix = m[1]; // table prefix, may be undefined
            const column = m[2];
            // If a prefix is present and it doesn't match the policy's
            // table, skip — cross-table comparison is out of scope for
            // this guard's class-of-bug (would require a join analysis).
            if (prefix && prefix !== policy.table) continue;
            out.push({ table: policy.table, column });
        }
    }
    return out;
}

const requiresExplicit = new Map(); // table -> Set<column>
const safeAuthUid = new Map();      // table -> Set<column> with auth.uid() default

for (const policy of snapshot.rls_policies) {
    const pairs = extractCmpColumns(policy);
    for (const { table, column } of pairs) {
        const colMap = columnDefaults.get(table);
        if (!colMap || !colMap.has(column)) {
            // Schema drift surface — column referenced by a policy but
            // not in the snapshot. check-schema.mjs catches this class
            // separately, but we surface it here as a guard-internal
            // error so it never silently passes.
            console.error(
                `[check:rls-defaults] Policy ${JSON.stringify(policy.name)} on ${table} ` +
                `references column ${column} which is not in the snapshot. ` +
                `Refresh via \`npm run schema:snapshot\`.`
            );
            process.exit(2);
        }
        const def = colMap.get(column);
        // Match `auth.uid()` even with stray whitespace (Postgres
        // canonicalizes but be defensive).
        if (def && /^\s*auth\.uid\(\)\s*$/.test(def)) {
            if (!safeAuthUid.has(table)) safeAuthUid.set(table, new Set());
            safeAuthUid.get(table).add(column);
        } else if (def === null) {
            if (!requiresExplicit.has(table)) requiresExplicit.set(table, new Set());
            requiresExplicit.get(table).add(column);
        }
        // Other defaults (literal UUIDs, etc.) wouldn't match auth.uid()
        // semantically anyway — flagging as a safety check.
        else if (def !== null) {
            if (!requiresExplicit.has(table)) requiresExplicit.set(table, new Set());
            requiresExplicit.get(table).add(column);
        }
    }
}

// ---------- step 3: scan source for INSERT call sites ----------
//
// Heuristic detection: `.from('<table>').insert(` followed by a
// payload literal we can statically inspect. For each match we
// capture the file, line, and the payload text so the next step can
// decide whether the column is populated.

function listSourceFiles(roots) {
    const files = [];
    function walk(dir) {
        let entries;
        try {
            entries = readdirSync(dir);
        } catch {
            return;
        }
        for (const entry of entries) {
            // Skip node_modules, dist, build artifacts.
            if (entry === 'node_modules' || entry === 'dist' || entry === 'build' || entry === '.git') continue;
            const full = join(dir, entry);
            const stats = statSync(full);
            if (stats.isDirectory()) {
                walk(full);
            } else if (/\.(tsx?|jsx?|mjs)$/.test(entry)) {
                files.push(full);
            }
        }
    }
    for (const root of roots) walk(root);
    return files;
}

// Match `.from('<table>').insert(` where the insert call is on the
// same statement (allow whitespace + chained args before the dot).
// Captures the table name; the payload starts at the position
// immediately after the open-paren of `insert(`.
const INSERT_RE = /\.from\(\s*['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]\s*\)[\s\S]{0,300}?\.insert\s*\(/g;

/**
 * Given an INSERT match's end-of-`insert(` index, walk forward through
 * balanced parens to find the matching close. Inside, the first
 * top-level `{` ... `}` is the payload object literal. Return that
 * literal text or null if we can't isolate one statically.
 */
function extractPayloadLiteral(text, startIdx) {
    let depth = 1;
    let i = startIdx;
    while (i < text.length && depth > 0) {
        const ch = text[i];
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === '{') {
            // Found a top-level brace — extract the matching close.
            let braceDepth = 1;
            const start = i;
            i++;
            while (i < text.length && braceDepth > 0) {
                const c = text[i];
                if (c === '{') braceDepth++;
                else if (c === '}') braceDepth--;
                else if (c === '"' || c === "'" || c === '`') {
                    // Skip string literal contents to avoid mismatched braces inside strings.
                    const quote = c;
                    i++;
                    while (i < text.length && text[i] !== quote) {
                        if (text[i] === '\\') i++;
                        i++;
                    }
                }
                i++;
            }
            if (braceDepth === 0) return text.slice(start, i);
            return null;
        }
        i++;
    }
    return null;
}

/**
 * Decide whether a payload literal explicitly sets the named column.
 * Heuristic: the literal contains either `<column>:` or `<column>,`
 * (shorthand) or `<column>}` (shorthand at end) or a spread that
 * we treat as opaque (returns "spread" so caller can choose to
 * fail-on-spread or accept). Strings containing the column name
 * inside other identifiers are filtered by word boundaries.
 */
function payloadSetsColumn(payload, column) {
    // Strip line comments + block comments to avoid false matches in commentary.
    const stripped = payload
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

    // Spread operator detected — payload is partially opaque.
    const hasSpread = /\.\.\.[a-zA-Z_$]/.test(stripped);

    // Word-boundary match for the column name as a key.
    // Forms accepted:
    //   column: value
    //   column,
    //   column }    (shorthand at end)
    //   column )    (shorthand inside spread call — rare)
    const re = new RegExp(`(^|[\\s,{])${column}\\s*[:,}]`, 'm');
    if (re.test(stripped)) return 'set';
    if (hasSpread) return 'spread';
    return 'missing';
}

function lineNumber(text, idx) {
    let line = 1;
    for (let i = 0; i < idx; i++) if (text.charCodeAt(i) === 10) line++;
    return line;
}

function findInlineAllowlist(text, insertLine, table, column) {
    // Look at insertLine and the three lines preceding it for a comment
    // matching `btg:rls-default-ok <table>.<column>`. Whitespace
    // tolerant; the column may be `*` for table-wide.
    const lines = text.split('\n');
    const window = lines.slice(Math.max(0, insertLine - 4), insertLine).join('\n');
    // Trailing alternation: word-boundary for the named column (so we
    // don't match `user_id_foo`), or end-of-token for `*` (which is
    // not a word character so \b doesn't apply).
    const re = new RegExp(`btg:rls-default-ok\\s+${escapeRegex(table)}\\.(?:\\*(?![a-zA-Z0-9_])|${escapeRegex(column)}\\b)`);
    return re.test(window);
}

function findFileAllowlist(text, table, column) {
    const re = new RegExp(`btg:rls-default-ok-file\\s+${escapeRegex(table)}\\.(?:\\*(?![a-zA-Z0-9_])|${escapeRegex(column)}\\b)`);
    return re.test(text);
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------- step 4: cross-reference INSERT sites against requires-explicit columns ----------

const violations = [];
const spreadWarnings = [];
const sourceFiles = listSourceFiles(SRC_DIRS);

for (const file of sourceFiles) {
    const text = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file);

    INSERT_RE.lastIndex = 0;
    let match;
    while ((match = INSERT_RE.exec(text)) !== null) {
        const table = match[1];
        const requiredCols = requiresExplicit.get(table);
        if (!requiredCols || requiredCols.size === 0) continue;

        const payloadStart = INSERT_RE.lastIndex;
        const payload = extractPayloadLiteral(text, payloadStart);
        const insertLine = lineNumber(text, match.index);

        if (payload === null) {
            // Payload not statically extractable (e.g., variable holds the rows).
            // Allowlist check with column='*' is the escape hatch for these.
            for (const column of requiredCols) {
                if (findFileAllowlist(text, table, column) || findInlineAllowlist(text, insertLine, table, column)) continue;
                violations.push({
                    file: rel, line: insertLine, table, column,
                    reason: 'insert payload is not a static object literal — could not verify',
                });
            }
            continue;
        }

        for (const column of requiredCols) {
            if (findFileAllowlist(text, table, column)) continue;
            if (findInlineAllowlist(text, insertLine, table, column)) continue;

            const verdict = payloadSetsColumn(payload, column);
            if (verdict === 'set') continue;
            if (verdict === 'spread') {
                spreadWarnings.push({
                    file: rel, line: insertLine, table, column,
                });
                continue;
            }
            violations.push({
                file: rel, line: insertLine, table, column,
                reason: `payload omits ${column} (RLS would silently reject — column default is NULL)`,
            });
        }
    }
}

// ---------- step 5: report ----------

const safeCount = [...safeAuthUid.values()].reduce((n, s) => n + s.size, 0);
const requiresCount = [...requiresExplicit.values()].reduce((n, s) => n + s.size, 0);
console.log(
    `[check:rls-defaults] policies scanned: ${snapshot.rls_policies.length}; ` +
    `auth.uid()-defaulted columns (safe): ${safeCount}; ` +
    `NULL-defaulted columns requiring explicit population: ${requiresCount}; ` +
    `INSERT sites scanned: ${sourceFiles.length} files`
);

if (spreadWarnings.length > 0) {
    console.log('\n[check:rls-defaults] WARN — spread operator in payload (could not statically verify):');
    for (const w of spreadWarnings) {
        console.log(`  ${w.file}:${w.line} → ${w.table}.${w.column}`);
    }
    console.log('  (allowlist these with `// btg:rls-default-ok <table>.<column> — <reason>` if intentional)');
}

if (violations.length === 0) {
    console.log('\n[check:rls-defaults] OK — every INSERT to an RLS-protected table populates the comparison column or is allowlisted.');
    process.exit(0);
}

console.error(`\n[check:rls-defaults] ${violations.length} VIOLATION(S):`);
for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  →  ${v.table}.${v.column}`);
    console.error(`    ${v.reason}`);
    console.error(`    fix options:`);
    console.error(`      (a) populate ${v.column} explicitly in the insert payload`);
    console.error(`      (b) set the column default to auth.uid() via migration`);
    console.error(`      (c) allowlist with: // btg:rls-default-ok ${v.table}.${v.column} — <reason>`);
}

if (ALLOW_DRIFT) {
    console.error('\n[check:rls-defaults] --allow-drift passed; exiting 0 despite violations.');
    process.exit(0);
}
process.exit(1);
