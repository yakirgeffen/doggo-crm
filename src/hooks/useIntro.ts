import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { useSettings } from './useSettings';
import type { PageId } from '../lib/intro-content';

/**
 * useIntro — page-level intro modal state for a given page id.
 *
 * Reads `user_settings.intro_pages_seen` (text[]) via the existing
 * `useSettings` hook; returns whether the modal should auto-show and a
 * `dismiss()` function that persists the seen-state.
 *
 *   - `shouldShow`: true on first visit per page per user. Gated on
 *     `!loading` so the modal never flashes during the initial settings
 *     fetch (Suspense-then-async-fetch races).
 *   - `dismiss()`: appends `pageId` to the trainer's `intro_pages_seen`
 *     array, optimistically updates local state, and upserts the row.
 *     Idempotent — re-dismissal is a no-op array dedupe.
 *   - `forceShow()` / `setForceShow(false)`: lets the global `?` icon in
 *     the layout re-open an already-dismissed intro on demand. Lives in
 *     local component state — does not touch the DB.
 *
 * Direct upsert (not `saveSettings`) on dismiss — bypasses the
 * `logActivity('settings', ...)` side effect from useSettings.saveSettings,
 * since intro-dismiss is meta noise that doesn't belong in the activity
 * timeline.
 */
export function useIntro(pageId: PageId) {
    const { user } = useAuth();
    const { settings, loading, updateLocalSettings } = useSettings();
    const [searchParams, setSearchParams] = useSearchParams();
    const [forceShow, setForceShow] = useState(false);
    const [sessionClosed, setSessionClosed] = useState(false);

    const seen = useMemo(() => settings?.intro_pages_seen ?? [], [settings?.intro_pages_seen]);
    const autoShow = !loading && !!settings && !seen.includes(pageId);
    // Layout's global `?` icon adds `?intro=<pageId>` — picked up here so the
    // intro re-opens on demand even after it's been dismissed.
    const urlForceShow = searchParams.get('intro') === pageId;
    const shouldShow = (autoShow || forceShow || urlForceShow) && !sessionClosed;

    // When the URL param fires the intro, clear it from the address bar
    // after consumption — so a refresh doesn't keep re-opening the intro.
    useEffect(() => {
        if (!urlForceShow) return;
        const next = new URLSearchParams(searchParams);
        next.delete('intro');
        setSearchParams(next, { replace: true });
    }, [urlForceShow, searchParams, setSearchParams]);

    const dismiss = useCallback(async () => {
        setForceShow(false);
        setSessionClosed(true);
        if (!user || !settings) return;
        if (seen.includes(pageId)) return; // idempotent

        const next = [...seen, pageId];
        // Optimistic update — modal closes immediately even on slow networks.
        updateLocalSettings({ intro_pages_seen: next });

        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                intro_pages_seen: next,
                updated_at: new Date().toISOString(),
            });

        if (error) {
            // Revert to the prior seen-state. The intro will reappear on next
            // visit, which is the correct fallback (worse to silently mark
            // as seen when the DB write failed).
            console.error('Failed to persist intro dismissal:', error);
            updateLocalSettings({ intro_pages_seen: seen });
        }
    }, [user, settings, seen, pageId, updateLocalSettings]);

    return {
        shouldShow,
        dismiss,
        // Hides the modal for this browser session WITHOUT writing the seen
        // flag. Next mount/refresh shows it again — protects against the
        // accidental-backdrop-tap failure mode where the modal gets
        // permanently dismissed before the user actually engaged.
        closeForSession: () => {
            setForceShow(false);
            setSessionClosed(true);
        },
        // Lets the global `?` icon re-open an already-dismissed intro on
        // demand. Resets sessionClosed so a previously-closed intro can
        // reappear.
        openOnDemand: () => {
            setSessionClosed(false);
            setForceShow(true);
        },
    };
}
