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

/**
 * Fetches events from the user's primary Google Calendar.
 * Requires the 'https://www.googleapis.com/auth/calendar.events.readonly' scope.
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

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        // If 401/403, it might mean scopes are missing or token expired
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.items || [];
}
