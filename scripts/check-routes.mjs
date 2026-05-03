#!/usr/bin/env node
// ============================================================
// check-routes.mjs — build-time route-existence linter
//
// Triggered by Yakir's catch on 2026-05-03: /pricing and /blog redirected
// to / on doggo-crm-test.vercel.app because the Routes for them existed
// only on a feature branch, not on master. The catch-all <Navigate to="/" />
// silently swallowed the "phantom" links.
//
// This script statically scans App.tsx for <Route path="..."> declarations
// and the rest of src/ for <Link to="..."> and navigate("...") calls.
// Every internal link destination (string literal starting with /) MUST
// match a registered Route path. Anything else exits with code 1 to fail
// the build.
//
// Limitations (intentional, KISS):
//   - Template-literal links like `/clients/${id}` are normalized to
//     /clients/:param and matched against :param-style routes.
//   - Dynamic links built from variables (e.g., `to={someVar}`) are skipped
//     with a "skipped" report. Flagged in the summary but not fatal.
//   - Query strings and fragment identifiers are stripped before matching.
// ============================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const APP_TSX = join(ROOT, 'src/App.tsx');
const SRC = join(ROOT, 'src');

function listSourceFiles(dir) {
    const files = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stats = statSync(full);
        if (stats.isDirectory()) {
            files.push(...listSourceFiles(full));
        } else if (/\.(tsx?|jsx?)$/.test(entry)) {
            files.push(full);
        }
    }
    return files;
}

function extractRoutePaths(appSrc) {
    // Capture <Route path="..."> declarations. We consume both top-level paths
    // (e.g., "/pricing") and nested-children paths that resolve under "/".
    // Nested children declared inside <Route path="/" element={<RootEntry />}>
    // are concatenated as /child.
    const paths = new Set();

    // Top-level <Route path="...">
    const topMatches = appSrc.matchAll(/<Route\s+[^>]*path=["']([^"']+)["']/g);
    for (const m of topMatches) {
        const p = m[1];
        if (p === '*') continue; // catch-all — never a valid Link target
        // Already includes /; if it doesn't start with /, treat as nested
        paths.add(p.startsWith('/') ? p : '/' + p);
    }

    // Nested children inside a parent <Route path="/" ...> block — they don't
    // have leading slashes in the JSX, so /clients vs clients distinction
    // matters. The simplest heuristic: any path NOT starting with / that
    // appeared in the matchAll above gets the / prefix.
    return paths;
}

function normalizeRoute(p) {
    // Convert React Router :param syntax to a regex-friendly placeholder.
    return p.replace(/:[^/]+/g, ':param').replace(/\/+$/, '') || '/';
}

function findInternalLinks(srcFiles) {
    const links = [];
    const skipped = [];

    for (const file of srcFiles) {
        const text = readFileSync(file, 'utf8');
        const rel = relative(ROOT, file);

        // Skip the App.tsx itself (its <Route> declarations would otherwise
        // show up as Link-like patterns to a careless regex).
        if (file === APP_TSX) continue;

        // Match <Link to="..."> with a literal string
        const literalLinks = text.matchAll(/<Link\s+[^>]*to=["'](\/[^"']*)["']/g);
        for (const m of literalLinks) {
            links.push({ file: rel, dest: m[1], kind: 'Link literal' });
        }

        // Match <Link to={`...${...}...`}> with a template literal starting with /
        const templateLinks = text.matchAll(/<Link\s+[^>]*to=\{`(\/[^`]*)`\}/g);
        for (const m of templateLinks) {
            // Normalize ${...} expressions to :param
            const normalized = m[1].replace(/\$\{[^}]+\}/g, ':param');
            links.push({ file: rel, dest: normalized, kind: 'Link template' });
        }

        // Match navigate("/...") with a literal string
        const literalNavs = text.matchAll(/navigate\(["'](\/[^"']*)["']/g);
        for (const m of literalNavs) {
            links.push({ file: rel, dest: m[1], kind: 'navigate literal' });
        }

        // Match navigate(`/...`) with a template literal
        const templateNavs = text.matchAll(/navigate\(`(\/[^`]*)`/g);
        for (const m of templateNavs) {
            const normalized = m[1].replace(/\$\{[^}]+\}/g, ':param');
            links.push({ file: rel, dest: normalized, kind: 'navigate template' });
        }

        // Detect dynamic non-literal cases (Link to={someVar} or navigate(someVar))
        // and report them as "skipped" without failing.
        const dynamicLinks = text.matchAll(/<Link\s+[^>]*to=\{(?!`)(?!"\/)([^}]+?)\}/g);
        for (const m of dynamicLinks) {
            const expr = m[1].trim();
            // Filter out obviously non-string-literal usage (functions, conditional, etc.)
            if (!expr.startsWith('"') && !expr.startsWith("'")) {
                skipped.push({ file: rel, expr: expr.slice(0, 60), kind: 'Link dynamic' });
            }
        }
    }

    return { links, skipped };
}

function matches(linkDest, routePaths) {
    const cleanDest = linkDest.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    const normalizedDest = normalizeRoute(cleanDest);

    for (const p of routePaths) {
        const normalizedRoute = normalizeRoute(p);
        if (normalizedRoute === normalizedDest) return true;
    }

    // Allow prefix match when the route declares :param at the suffix
    // (e.g., /clients/:id matches /clients/:param)
    for (const p of routePaths) {
        const re = '^' + p.replace(/:[^/]+/g, '[^/]+').replace(/\/$/, '') + '$';
        try {
            if (new RegExp(re).test(cleanDest)) return true;
        } catch { /* skip malformed */ }
    }

    return false;
}

function main() {
    const appSrc = readFileSync(APP_TSX, 'utf8');
    const routePaths = extractRoutePaths(appSrc);

    if (routePaths.size === 0) {
        console.error('check-routes: ❌ Could not extract any Route paths from App.tsx — regex outdated?');
        process.exit(2);
    }

    const sourceFiles = listSourceFiles(SRC);
    const { links, skipped } = findInternalLinks(sourceFiles);

    const broken = [];
    for (const link of links) {
        if (!matches(link.dest, routePaths)) {
            broken.push(link);
        }
    }

    console.log(`check-routes: scanned ${sourceFiles.length} source files`);
    console.log(`check-routes: ${routePaths.size} routes registered, ${links.length} internal links checked, ${skipped.length} dynamic links skipped`);

    if (broken.length > 0) {
        console.error('\ncheck-routes: ❌ Found phantom internal links — destination not in App.tsx Routes:');
        for (const b of broken) {
            console.error(`  ${b.file}: ${b.kind} → ${b.dest}`);
        }
        console.error('\nFix: add a Route in src/App.tsx, or correct the Link/navigate destination.');
        process.exit(1);
    }

    if (skipped.length > 0) {
        console.log('\ncheck-routes: ⚠️  Dynamic links not statically verifiable (informational only):');
        for (const s of skipped.slice(0, 10)) {
            console.log(`  ${s.file}: ${s.kind} → ${s.expr}...`);
        }
        if (skipped.length > 10) console.log(`  ... and ${skipped.length - 10} more`);
    }

    console.log('\ncheck-routes: ✅ All static internal links resolve to a registered Route.');
}

main();
