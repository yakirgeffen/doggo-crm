#!/usr/bin/env node
// ============================================================
// check-vercel.mjs — surface failed Vercel deploys to the studio
//
// Class-of-bug surfaced 2026-05-03: Vercel build hit the Hobby-tier
// rate limit; deploys silently failed; Yakir noticed before the
// autonomous loop did. Pro upgrade lifted the rate limit, but the
// observability gap (failed deploys are invisible to the loop)
// remains.
//
// This script hits Vercel's REST API and lists deploys in ERROR
// state from the last 24h for the studio's project. Exits 0 if
// no errors, 1 if errors are found (non-fatal — informational).
// Can be wired to a Liat-routed signal or run ad-hoc as a CTO
// pre-handoff check.
//
// Auth:
//   Reads VERCEL_TOKEN from the environment. If missing, the script
//   emits a single informational line and exits 0 — gracefully no-ops
//   so it can sit in scripts/ even before Yakir provisions a token.
//
// Optional env:
//   VERCEL_TEAM_ID   — team-scope the query (recommended for studio team)
//   VERCEL_PROJECT_ID — narrow to a specific project (defaults to listing
//                       all team projects' last 24h failures)
//
// Usage:
//   npm run check:vercel
//
// Yakir-actionable to make this live:
//   1. Vercel dashboard → Settings → Tokens → Create token, scope to
//      studio team, 1-year expiry.
//   2. Store the token in 1Password under "Vercel API — studio team".
//   3. Add VERCEL_TOKEN (and VERCEL_TEAM_ID, VERCEL_PROJECT_ID if narrowing)
//      to your local .env or to the deploy environment running this check.
//
// Reference: tools/vercel-pro-playbook.md (geffen-studio) — REST API table.
// ============================================================

const TOKEN = process.env.VERCEL_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

const LOOKBACK_MS = 24 * 60 * 60 * 1000; // last 24h
const API_BASE = 'https://api.vercel.com';

if (!TOKEN) {
    console.log(
        '[check:vercel] VERCEL_TOKEN not set — skipping. ' +
        'See scripts/check-vercel.mjs header for setup.'
    );
    process.exit(0);
}

const since = Date.now() - LOOKBACK_MS;
const params = new URLSearchParams();
params.set('limit', '20');
params.set('since', String(since));
params.set('state', 'ERROR');
if (TEAM_ID) params.set('teamId', TEAM_ID);
if (PROJECT_ID) params.set('projectId', PROJECT_ID);

const url = `${API_BASE}/v6/deployments?${params.toString()}`;

let res;
try {
    res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            Accept: 'application/json',
        },
    });
} catch (err) {
    console.error(`[check:vercel] network error: ${err.message}`);
    process.exit(2);
}

if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[check:vercel] HTTP ${res.status}: ${body.slice(0, 300)}`);
    process.exit(2);
}

const json = await res.json();
const deployments = Array.isArray(json.deployments) ? json.deployments : [];

if (deployments.length === 0) {
    console.log('[check:vercel] no failed deploys in last 24h. all clear.');
    process.exit(0);
}

console.log(`[check:vercel] ${deployments.length} failed deploy(s) in last 24h:`);
for (const d of deployments) {
    const created = d.createdAt ? new Date(d.createdAt).toISOString() : 'unknown-time';
    const project = d.name || d.projectId || 'unknown-project';
    const target = d.target || 'unknown-target';
    const urlField = d.url ? `https://${d.url}` : 'no-url';
    const meta = d.meta || {};
    const branch = meta.githubCommitRef || meta.gitlabCommitRef || meta.bitbucketCommitRef || 'unknown-branch';
    console.log(`  - ${created} | ${project} | ${target} | branch=${branch} | ${urlField}`);
}

// Non-fatal: surface but don't block downstream automation. Caller decides.
process.exit(1);
