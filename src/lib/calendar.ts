export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string; // For all-day events
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    location?: string;
    htmlLink: string;
    /** Present when an event was deleted; only surfaces with showDeleted=true. */
    status?: 'confirmed' | 'tentative' | 'cancelled';
    /** ISO 8601 timestamp of the last server-side modification. Used by sync to detect drift. */
    updated?: string;
}

export interface CalendarEventInput {
    summary: string;
    description?: string;
    location?: string;
    /** ISO 8601 datetime string with timezone (e.g., "2026-05-10T10:00:00+03:00"). */
    startDateTime: string;
    /** ISO 8601 datetime string with timezone. */
    endDateTime: string;
    /** Defaults to Asia/Jerusalem to match the Hebrew-RTL trainer audience. */
    timeZone?: string;
}

const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary';
const DEFAULT_TIMEZONE = 'Asia/Jerusalem';

/**
 * Fetches events from the user's primary Google Calendar.
 * Requires the 'https://www.googleapis.com/auth/calendar.events' scope
 * (read+write — read-only no longer covers write paths in this lib).
 */
export async function listUpcomingEvents(token: string): Promise<CalendarEvent[]> {
    const now = new Date().toISOString();
    const params = new URLSearchParams({
        calendarId: 'primary',
        timeMin: now,
        maxResults: '20',
        singleEvents: 'true',
        orderBy: 'startTime',
    });

    const response = await fetch(`${CALENDAR_BASE}/events?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.items || [];
}

/**
 * Creates an event on the user's primary Google Calendar (G7 one-way write).
 * Returns the created event so the caller can persist event.id alongside the
 * CRM session row for future update/delete.
 */
export async function createCalendarEvent(
    token: string,
    input: CalendarEventInput
): Promise<CalendarEvent> {
    const body = {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: { dateTime: input.startDateTime, timeZone: input.timeZone || DEFAULT_TIMEZONE },
        end: { dateTime: input.endDateTime, timeZone: input.timeZone || DEFAULT_TIMEZONE },
    };

    const response = await fetch(`${CALENDAR_BASE}/events`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create calendar event');
    }

    return response.json();
}

/**
 * Updates an existing event on the user's primary Google Calendar.
 * Used when a CRM session is rescheduled or its details change.
 */
export async function updateCalendarEvent(
    token: string,
    eventId: string,
    input: CalendarEventInput
): Promise<CalendarEvent> {
    const body = {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: { dateTime: input.startDateTime, timeZone: input.timeZone || DEFAULT_TIMEZONE },
        end: { dateTime: input.endDateTime, timeZone: input.timeZone || DEFAULT_TIMEZONE },
    };

    const response = await fetch(`${CALENDAR_BASE}/events/${encodeURIComponent(eventId)}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update calendar event');
    }

    return response.json();
}

/**
 * Lists events on the user's primary calendar that have been updated since
 * `sinceISO` (server-side `updated` timestamp). Used by the two-way sync
 * (CTO iter 78) to detect events the trainer rescheduled / cancelled
 * directly inside Google Calendar so we can reconcile the CRM `sessions`
 * row.
 *
 * Why polling on the client (Architecture A):
 *   - Polling is bound to the trainer's individual `providerToken`. The token
 *     never leaves the browser, which keeps multi-tenant isolation airtight
 *     (no per-trainer OAuth tokens stored server-side).
 *   - Approach B (Google `events.watch` push notifications) would be real-
 *     time, but requires (a) a public webhook endpoint, (b) channel
 *     registration, (c) channel renewal every ~7 days, (d) server-side
 *     storage of refresh tokens to act on the webhook. Skipped for v1 —
 *     the freshness need (single trainer, manual reschedule) doesn't
 *     justify the infra footprint.
 *   - Approach C (pg_cron + edge function poll) was considered but the
 *     server has no access to the trainer's `providerToken`, so a server-
 *     scheduled poll would require persisting per-trainer Google refresh
 *     tokens — a security regression we explicitly avoided in G7.
 *
 * Pagination is intentionally not implemented for v1; 250 results covers
 * roughly 8 days of dense scheduling, far above the freshness window
 * we ever poll.
 */
export async function listCalendarEventsUpdatedSince(
    token: string,
    sinceISO: string
): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
        updatedMin: sinceISO,
        singleEvents: 'true',
        showDeleted: 'true',
        maxResults: '250',
    });

    const response = await fetch(`${CALENDAR_BASE}/events?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to list calendar events');
    }

    const data = await response.json();
    return data.items || [];
}

/**
 * Deletes an event on the user's primary Google Calendar.
 * Used when a CRM session is cancelled.
 */
export async function deleteCalendarEvent(token: string, eventId: string): Promise<void> {
    const response = await fetch(`${CALENDAR_BASE}/events/${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    // 204 No Content on success; 410 Gone if already deleted (treat as success).
    if (!response.ok && response.status !== 410) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to delete calendar event');
    }
}
