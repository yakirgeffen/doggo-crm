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
