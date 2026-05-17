// DoggoCRM — GA4 wrapper
//
// Authored 2026-05-17 by Neta (Data IC).
//
// ENV VAR REQUIRED:
//   VITE_GA4_MEASUREMENT_ID — Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX).
//   If absent, all functions no-op cleanly; the app never throws because a
//   tracking ID is not yet configured.
//
// Usage:
//   Import only through `src/lib/analytics/index.ts`. Do not call ga4.*
//   directly from product code — the unified provider handles consent gating,
//   base-property injection, and parallel-fire to all destinations.
//
// GA4 Consent Mode v2:
//   The `updateConsent()` function maps the studio's two-tier consent model
//   (analytics / marketing) to GA4's four consent signals. Call it once
//   from the consent banner on every consent state change.

// TypeScript shim for the global gtag function loaded via the GA4 script tag.
type GtagCommand = 'event' | 'config' | 'consent' | 'set' | 'js';
type GtagFn = (command: GtagCommand, ...args: unknown[]) => void;

function gtag(): GtagFn | undefined {
    if (typeof window === 'undefined') return undefined;
    return (window as unknown as { gtag?: GtagFn }).gtag;
}

// Measurement ID from Vite environment. Falsy value = destination disabled.
const MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || '';

/**
 * Initialize GA4. Called once on app bootstrap AFTER the gtag.js script has
 * loaded. Sends the `config` command so GA4 is ready to receive events.
 *
 * Consent Mode v2 is initialized to all-denied by default here. The consent
 * banner calls `updateConsent()` to grant tiers once the user decides.
 */
export function initGA4(): void {
    const fn = gtag();
    if (!fn || !MEASUREMENT_ID) return;
    // Set consent defaults before any event fires (Consent Mode v2).
    fn('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500,
    });
    fn('config', MEASUREMENT_ID, {
        send_page_view: false, // we fire page_view manually through trackEvent
    });
}

/**
 * Update GA4 Consent Mode v2 signals based on the studio consent state.
 * Call from the consent banner whenever the user grants or revokes consent.
 */
export function updateConsent(analyticsGranted: boolean, marketingGranted: boolean): void {
    const fn = gtag();
    if (!fn || !MEASUREMENT_ID) return;
    fn('consent', 'update', {
        analytics_storage: analyticsGranted ? 'granted' : 'denied',
        ad_storage: marketingGranted ? 'granted' : 'denied',
        ad_user_data: marketingGranted ? 'granted' : 'denied',
        ad_personalization: marketingGranted ? 'granted' : 'denied',
    });
}

/**
 * Set the GA4 user_id for cross-device / cross-session attribution.
 * Pass null to clear (on sign-out).
 */
export function identifyGA4(userId: string | null): void {
    const fn = gtag();
    if (!fn || !MEASUREMENT_ID) return;
    fn('config', MEASUREMENT_ID, { user_id: userId ?? undefined });
}

/**
 * Fire an event to GA4. Properties are passed as-is; GA4 accepts arbitrary
 * custom parameters alongside its reserved parameter set.
 */
export function trackGA4(eventName: string, properties: Record<string, unknown>): void {
    const fn = gtag();
    if (!fn || !MEASUREMENT_ID) return;
    fn('event', eventName, properties);
}
