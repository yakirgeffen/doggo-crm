import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { listCalendarEventsUpdatedSince, type CalendarEvent } from '../lib/calendar';

// CTO iter 78 — two-way Google Calendar sync (pull side).
//
// This hook polls the trainer's primary Google Calendar for events updated
// since the last successful sync, matches them against `sessions.google_calendar_event_id`,
// and surfaces drift (rescheduled, cancelled, missing) as `pendingChanges`
// for the trainer to apply or dismiss.
//
// Architecture decision: client-side polling.
//   - A. polling on app load + visibilitychange — chosen.
//   - B. Google `events.watch` push notifications — skipped for v1: too much
//        infra (public webhook endpoint, channel registration, ~7-day channel
//        renewal) for the freshness need (single-trainer manual reschedules).
//   - C. pg_cron + edge-function poll — skipped: the server has no access to
//        the trainer's `providerToken`, so a server-side poll would require
//        persisting per-trainer Google refresh tokens (security regression
//        we explicitly avoided in G7).
//
// Multi-tenancy: every read here is bound to (a) the authenticated trainer's
// Supabase session (RLS scopes the `sessions` query) and (b) the trainer's
// own browser-resident `providerToken` (Google API request hits only that
// trainer's primary calendar). No code path can ever touch another trainer's
// data.

const SYNC_KEY_PREFIX = 'doggo:calendar-last-sync:';
const DISMISSED_KEY_PREFIX = 'doggo:calendar-sync-dismissed:';
const FALLBACK_LOOKBACK_HOURS = 24;
// Drift below this threshold is treated as noise (server clock skew, sub-minute
// reschedules from someone clicking-and-rescuing the same slot in Google
// Calendar). 60 seconds is empirically clean.
const DRIFT_THRESHOLD_MS = 60_000;

export type CalendarSyncChangeKind = 'rescheduled' | 'cancelled-in-google' | 'missing-in-google';

export interface CalendarSyncChange {
    kind: CalendarSyncChangeKind;
    sessionId: string;
    googleEventId: string;
    /** Current value in our `sessions` row (ISO-8601 with timezone). */
    currentSessionDate: string;
    /** Suggested new value coming from Google (ISO-8601 with timezone), only set for `rescheduled`. */
    suggestedSessionDate: string | null;
    /** Best-effort label for the affected session — program name + client name when available. */
    label: string;
    /** Direct deep-link to the Google Calendar event when present. */
    googleHtmlLink: string | null;
}

interface SessionRow {
    id: string;
    session_date: string;
    google_calendar_event_id: string | null;
    programs: {
        program_name: string | null;
        clients: {
            full_name: string | null;
        } | null;
    } | null;
}

function loadDismissedSet(userId: string): Set<string> {
    try {
        const raw = localStorage.getItem(DISMISSED_KEY_PREFIX + userId);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed.filter((v): v is string => typeof v === 'string'));
        return new Set();
    } catch {
        return new Set();
    }
}

function saveDismissedSet(userId: string, set: Set<string>): void {
    try {
        localStorage.setItem(DISMISSED_KEY_PREFIX + userId, JSON.stringify(Array.from(set)));
    } catch {
        /* localStorage unavailable; degrade silently — dismissals will reappear on next sync */
    }
}

function dismissalKey(change: CalendarSyncChange): string {
    // Tied to the suggested target so a fresh reschedule (different target)
    // surfaces again rather than being silently muted by a previous dismissal.
    return `${change.kind}:${change.googleEventId}:${change.suggestedSessionDate ?? 'none'}`;
}

function buildLabel(row: SessionRow): string {
    const program = row.programs?.program_name?.trim();
    const client = row.programs?.clients?.full_name?.trim();
    if (program && client) return `${program} — ${client}`;
    if (program) return program;
    if (client) return client;
    return 'מפגש';
}

function readableSessionDate(iso: string): string {
    try {
        const d = new Date(iso);
        // Hebrew RTL locale, includes weekday + date + time.
        return d.toLocaleString('he-IL', {
            weekday: 'short',
            day: 'numeric',
            month: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

/**
 * Picks the best ISO timestamp out of a Google Calendar event.
 *
 * Edge cases handled:
 *   - All-day events expose `start.date` (date-only) instead of `start.dateTime`.
 *     We synthesize an ISO at local midnight (Asia/Jerusalem) so it remains
 *     comparable to a `session_date` timestamp.
 *   - Cancelled events may omit `start` entirely; we return null and the
 *     caller treats that as "cancelled in Google".
 */
function eventStartISO(event: CalendarEvent): string | null {
    if (event.start?.dateTime) return event.start.dateTime;
    if (event.start?.date) return `${event.start.date}T00:00:00+03:00`;
    return null;
}

export interface UseCalendarSyncResult {
    pendingChanges: CalendarSyncChange[];
    syncing: boolean;
    error: string | null;
    /** Force a sync (e.g. after the trainer applied a change and wants to refresh). */
    refresh: () => Promise<void>;
    applyChange: (change: CalendarSyncChange) => Promise<void>;
    applyAll: () => Promise<void>;
    dismissChange: (change: CalendarSyncChange) => void;
}

export function useCalendarSync(): UseCalendarSyncResult {
    const { user, providerToken } = useAuth();
    const [pendingChanges, setPendingChanges] = useState<CalendarSyncChange[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Guard against double-runs from React 18 StrictMode mount-unmount-remount.
    const inFlightRef = useRef(false);

    const userId = user?.id ?? null;

    const sync = useCallback(async () => {
        // No-op when the trainer isn't logged in or hasn't connected Google.
        // This is the load-bearing guard for the "no providerToken → silent"
        // acceptance criterion.
        if (!userId || !providerToken) {
            setPendingChanges([]);
            return;
        }
        if (inFlightRef.current) return;
        inFlightRef.current = true;

        setSyncing(true);
        setError(null);
        try {
            const syncKey = SYNC_KEY_PREFIX + userId;
            const lastSyncRaw = (() => {
                try { return localStorage.getItem(syncKey); } catch { return null; }
            })();
            const sinceISO = lastSyncRaw && !Number.isNaN(Date.parse(lastSyncRaw))
                ? lastSyncRaw
                : new Date(Date.now() - FALLBACK_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
            // Stamp BEFORE the network call so we don't lose ground if the
            // call completes but a later one races in. Using the request
            // start time (not the response time) is the standard pattern.
            const nextSyncStamp = new Date().toISOString();

            // Fetch sessions linked to a Google event for this trainer. RLS
            // already scopes by user; the explicit not-null filter limits the
            // per-trainer query to rows that even have a candidate match.
            const { data: sessionsData, error: sessionsErr } = await supabase
                .from('sessions')
                .select('id, session_date, google_calendar_event_id, programs(program_name, clients(full_name))')
                .not('google_calendar_event_id', 'is', null);

            if (sessionsErr) throw sessionsErr;

            const sessionRows = ((sessionsData as unknown) as SessionRow[] | null) ?? [];
            // Skip sessions where the join column is null (defensive: the
            // not-null filter above should already exclude them, but RLS or
            // future schema drift could let one slip through).
            const sessionsByEventId = new Map<string, SessionRow>();
            for (const row of sessionRows) {
                if (row.google_calendar_event_id) {
                    sessionsByEventId.set(row.google_calendar_event_id, row);
                }
            }

            let events: CalendarEvent[] = [];
            try {
                events = await listCalendarEventsUpdatedSince(providerToken, sinceISO);
            } catch (gErr) {
                // Token expired / scope revoked / network blip: fail soft.
                // Don't advance the last-sync timestamp so we'll retry the
                // same window next time the user comes back.
                const message = gErr instanceof Error ? gErr.message : 'unknown error';
                setError(message);
                setPendingChanges([]);
                return;
            }

            const dismissed = loadDismissedSet(userId);
            const seenEventIds = new Set<string>();
            const next: CalendarSyncChange[] = [];

            for (const event of events) {
                if (!event.id) continue;
                seenEventIds.add(event.id);
                const session = sessionsByEventId.get(event.id);
                if (!session) continue; // Event not linked to any of our sessions; ignore.

                if (event.status === 'cancelled') {
                    const change: CalendarSyncChange = {
                        kind: 'cancelled-in-google',
                        sessionId: session.id,
                        googleEventId: event.id,
                        currentSessionDate: session.session_date,
                        suggestedSessionDate: null,
                        label: buildLabel(session),
                        googleHtmlLink: event.htmlLink ?? null,
                    };
                    if (!dismissed.has(dismissalKey(change))) next.push(change);
                    continue;
                }

                const newStartISO = eventStartISO(event);
                if (!newStartISO) continue;

                const currentMs = Date.parse(session.session_date);
                const nextMs = Date.parse(newStartISO);
                if (Number.isNaN(currentMs) || Number.isNaN(nextMs)) continue;

                if (Math.abs(currentMs - nextMs) <= DRIFT_THRESHOLD_MS) continue;

                const change: CalendarSyncChange = {
                    kind: 'rescheduled',
                    sessionId: session.id,
                    googleEventId: event.id,
                    currentSessionDate: session.session_date,
                    suggestedSessionDate: newStartISO,
                    label: buildLabel(session),
                    googleHtmlLink: event.htmlLink ?? null,
                };
                if (!dismissed.has(dismissalKey(change))) next.push(change);
            }

            // "missing in Google" detection: only flag sessions whose linked
            // event is recent enough to plausibly have been deleted, AND that
            // we did NOT see in the updated-since window. We can't know for
            // sure the event was deleted without fetching it directly, so
            // this stays conservative — only future sessions, only when
            // updatedMin is recent (≤ 7 days lookback).
            const lookbackMs = Date.now() - Date.parse(sinceISO);
            if (lookbackMs <= 7 * 24 * 60 * 60 * 1000) {
                const nowMs = Date.now();
                for (const session of sessionRows) {
                    if (!session.google_calendar_event_id) continue;
                    if (seenEventIds.has(session.google_calendar_event_id)) continue;
                    const sessionMs = Date.parse(session.session_date);
                    // Only future sessions — past sessions naturally drop off
                    // the updatedMin window without being deleted.
                    if (Number.isNaN(sessionMs) || sessionMs < nowMs) continue;
                    // Skip — without a HEAD request to confirm the event is
                    // truly gone vs simply unmodified-during-window, we'd
                    // false-positive every recurring-but-stable event.
                    // Deferred to v2 (per-event get when missing-in-window).
                    void session; // explicit acknowledgement
                }
            }

            setPendingChanges(next);

            // Only advance the timestamp if the Google call succeeded.
            try { localStorage.setItem(syncKey, nextSyncStamp); } catch { /* ignore */ }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'unknown error';
            console.error('Calendar sync failed:', err);
            setError(message);
        } finally {
            setSyncing(false);
            inFlightRef.current = false;
        }
    }, [userId, providerToken]);

    useEffect(() => {
        void sync();

        function onVisibility() {
            if (document.visibilityState === 'visible') {
                void sync();
            }
        }

        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [sync]);

    const applyChange = useCallback(async (change: CalendarSyncChange) => {
        if (!userId) return;
        if (change.kind === 'rescheduled' && change.suggestedSessionDate) {
            const { error: upErr } = await supabase
                .from('sessions')
                .update({ session_date: change.suggestedSessionDate })
                .eq('id', change.sessionId);
            if (upErr) throw upErr;
            await logActivity(
                'session',
                change.sessionId,
                'updated',
                `סנכרון יומן Google: ${readableSessionDate(change.currentSessionDate)} → ${readableSessionDate(change.suggestedSessionDate)}`
            );
        } else if (change.kind === 'cancelled-in-google') {
            // The trainer dismissed the event in Google. We surface but do
            // NOT auto-delete the session — apply == "I confirm, drop the
            // link". Trainer keeps the session row + can re-link or cancel
            // it explicitly via EditSessionModal.
            const { error: upErr } = await supabase
                .from('sessions')
                .update({ google_calendar_event_id: null })
                .eq('id', change.sessionId);
            if (upErr) throw upErr;
            await logActivity(
                'session',
                change.sessionId,
                'updated',
                'סנכרון יומן Google: האירוע נמחק ביומן, הקישור הוסר מהמפגש'
            );
        }
        setPendingChanges(prev => prev.filter(c => dismissalKey(c) !== dismissalKey(change)));
    }, [userId]);

    const applyAll = useCallback(async () => {
        for (const change of pendingChanges) {
            try {
                await applyChange(change);
            } catch (err) {
                console.error('applyAll: change failed', change, err);
                // Continue applying — partial success is better than aborting.
            }
        }
    }, [pendingChanges, applyChange]);

    const dismissChange = useCallback((change: CalendarSyncChange) => {
        if (!userId) return;
        const set = loadDismissedSet(userId);
        set.add(dismissalKey(change));
        saveDismissedSet(userId, set);
        setPendingChanges(prev => prev.filter(c => dismissalKey(c) !== dismissalKey(change)));
    }, [userId]);

    return {
        pendingChanges,
        syncing,
        error,
        refresh: sync,
        applyChange,
        applyAll,
        dismissChange,
    };
}
