// DoggoCRM — PostHog wrapper
//
// Authored 2026-05-17 by Neta (Data IC).
//
// ENV VARS REQUIRED:
//   VITE_POSTHOG_KEY  — PostHog project API key (ph_xxxx...).
//   VITE_POSTHOG_HOST — PostHog ingestion host. Defaults to https://us.i.posthog.com
//                       (PostHog Cloud US). Override with your EU host or self-hosted
//                       instance URL if applicable.
//
// Usage:
//   Import only through `src/lib/analytics/index.ts`. Do not call posthog.*
//   directly from product code.
//
// PostHog is loaded via posthog-js. The app loads the snippet in index.html
// (or via npm install posthog-js + import in main.tsx). This wrapper does not
// import posthog-js directly — it reads the global `window.posthog` so that
// the build works in environments where PostHog is loaded async or is absent.
//
// Person identification:
//   We identify users by their Supabase UUID (never email). Email is set as a
//   person property only if analytics consent is granted. This satisfies
//   GDPR / Israeli Privacy Law minimization requirements.

interface PostHogClient {
    capture: (event: string, properties?: Record<string, unknown>) => void;
    identify: (distinctId: string, properties?: Record<string, unknown>) => void;
    reset: () => void;
    register?: (properties: Record<string, unknown>) => void;
    opt_in_capturing?: () => void;
    opt_out_capturing?: () => void;
    has_opted_out_capturing?: () => boolean;
}

function ph(): PostHogClient | undefined {
    if (typeof window === 'undefined') return undefined;
    return (window as unknown as { posthog?: PostHogClient }).posthog;
}

const PROJECT_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
export const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

/**
 * Initialize PostHog. Call once on app bootstrap.
 * If posthog-js is loaded via npm (not snippet), call posthog.init() before
 * this function. If loaded via snippet, the global is available on window by
 * the time this runs.
 *
 * Starts in opted-out state; the consent flow calls `setPostHogConsent(true)`
 * when the user grants analytics consent.
 */
export function initPostHog(): void {
    const client = ph();
    if (!client || !PROJECT_KEY) return;
    // Start opted-out. The consent banner will call opt_in_capturing() on grant.
    if (typeof client.opt_out_capturing === 'function' &&
        typeof client.has_opted_out_capturing === 'function' &&
        !client.has_opted_out_capturing()) {
        client.opt_out_capturing();
    }
}

/**
 * Grant or revoke PostHog event capture based on analytics consent.
 * Called from the consent banner on every consent state change.
 */
export function setPostHogConsent(granted: boolean): void {
    const client = ph();
    if (!client || !PROJECT_KEY) return;
    if (granted) {
        if (typeof client.opt_in_capturing === 'function') {
            client.opt_in_capturing();
        }
    } else {
        if (typeof client.opt_out_capturing === 'function') {
            client.opt_out_capturing();
        }
    }
}

/**
 * Identify the current user in PostHog.
 * Call after sign-in. Pass userId=null on sign-out to reset.
 *
 * @param userId   Supabase UUID. Never PII.
 * @param traits   Optional person properties. Do not include email unless the
 *                 caller has confirmed analytics consent is granted.
 */
export function identifyPostHog(userId: string | null, traits?: Record<string, unknown>): void {
    const client = ph();
    if (!client || !PROJECT_KEY) return;
    if (userId) {
        client.identify(userId, traits);
    } else {
        client.reset();
    }
}

/**
 * Register super-properties that attach to every subsequent PostHog event.
 * Used to persist UTM attribution across all events in the session without
 * repeating them in each trackEvent call.
 */
export function registerPostHogSuperProperties(properties: Record<string, unknown>): void {
    const client = ph();
    if (!client || !PROJECT_KEY || typeof client.register !== 'function') return;
    client.register(properties);
}

/**
 * Fire a single event to PostHog.
 */
export function trackPostHog(eventName: string, properties: Record<string, unknown>): void {
    const client = ph();
    if (!client || !PROJECT_KEY) return;
    client.capture(eventName, properties);
}

/**
 * Returns whether VITE_POSTHOG_KEY is configured.
 */
export function isPostHogEnabled(): boolean {
    return Boolean(PROJECT_KEY);
}
