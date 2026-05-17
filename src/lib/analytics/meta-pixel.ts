// DoggoCRM — Meta Pixel wrapper
//
// Authored 2026-05-17 by Neta (Data IC).
//
// ENV VAR REQUIRED:
//   VITE_META_PIXEL_ID — Meta (Facebook) Pixel ID (numeric string, e.g. "123456789012345").
//   If absent, all functions no-op cleanly.
//
// Usage:
//   Import only through `src/lib/analytics/index.ts`. Do not call metaPixel.*
//   directly from product code.
//
// Standard events:
//   Meta defines a fixed set of Standard Events (PageView, ViewContent, Lead, etc.)
//   that receive preferential treatment in Ads Manager optimization. All other
//   events fire as CustomEvent with the original event name preserved.
//   Reference: https://developers.facebook.com/docs/meta-pixel/reference
//
// Deduplication:
//   Every event carries an eventID built from `session_id:event_name:timestamp`.
//   Meta uses this to deduplicate browser-pixel fires against server-side CAPI
//   fires for the same event (iOS 14.5+ / ad-blocker resilience path).

// TypeScript shim for the fbq global loaded via Meta Pixel base code.
type FbqFn = (
    command: 'track' | 'trackCustom' | 'init' | 'trackSingle' | 'trackSingleCustom',
    eventOrPixelId: string,
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>
) => void;

function fbq(): FbqFn | undefined {
    if (typeof window === 'undefined') return undefined;
    return (window as unknown as { fbq?: FbqFn }).fbq;
}

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

// Map from studio event taxonomy names to Meta Standard Event names.
// Events absent from this map fire as CustomEvent.
// Source: https://developers.facebook.com/docs/meta-pixel/reference
export const META_STANDARD_EVENT_MAP: Record<string, string> = {
    page_view:                 'PageView',
    pricing_page_view:         'ViewContent',
    intake_form_view:          'ViewContent',
    intake_form_start:         'AddToCart',      // closest semantic: intent to start
    intake_form_complete:      'Lead',
    signup_complete:           'CompleteRegistration',
    trial_started:             'StartTrial',
    paid_conversion:           'Purchase',
    plan_upgraded:             'Subscribe',
    first_session_logged:      'CustomizeProduct', // trainer configured their workflow
};

/**
 * Initialize the Meta Pixel. Call once on app bootstrap.
 * Requires the fbq base code to already be loaded in index.html.
 * No-op if VITE_META_PIXEL_ID is not set.
 */
export function initMetaPixel(): void {
    const fn = fbq();
    if (!fn || !PIXEL_ID) return;
    fn('init', PIXEL_ID);
}

/**
 * Fire an event to Meta Pixel.
 *
 * @param eventName  Studio taxonomy event name (snake_case).
 * @param properties Event-specific properties to attach.
 * @param eventId    Deduplication ID (should match the CAPI event_id for the same event).
 */
export function trackMetaPixel(
    eventName: string,
    properties: Record<string, unknown>,
    eventId?: string
): void {
    const fn = fbq();
    if (!fn || !PIXEL_ID) return;

    const standardName = META_STANDARD_EVENT_MAP[eventName];
    const options = eventId ? { eventID: eventId } : undefined;

    if (standardName) {
        fn('track', standardName, properties, options);
    } else {
        fn('trackCustom', eventName, properties, options);
    }
}

/**
 * Returns whether VITE_META_PIXEL_ID is configured, so the caller can skip
 * the Meta-specific code path when the pixel is not enabled in this environment.
 */
export function isMetaPixelEnabled(): boolean {
    return Boolean(PIXEL_ID);
}
