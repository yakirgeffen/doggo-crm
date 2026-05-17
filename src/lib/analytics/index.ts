// DoggoCRM — Unified analytics provider (entry point)
//
// Authored 2026-05-17 by Neta (Data IC).
//
// This is the ONLY import surface for analytics in product code.
// No component or page should import from ga4.ts, meta-pixel.ts, or posthog.ts
// directly. Import from here:
//
//   import { track, identify, page } from '../lib/analytics';
//
// or for the full wrapper API:
//
//   import { track, identify, page, trackFirst, setConsent } from '../lib/analytics';
//
// Architecture:
//   track(event, properties) — fires all enabled destinations in parallel.
//   identify(userId, traits)  — propagates user identity to all destinations.
//   page()                    — fires a page_view event (convenience wrapper).
//
// Consent gating:
//   No marketing destination (Meta Pixel) fires until marketing consent is
//   granted. No analytics destination (GA4, PostHog) fires until analytics
//   consent is granted, with the exception of two essential auth events
//   (login_start, signup_complete) which bypass the analytics gate.
//   Events queued while consent is pending drain in order when consent is granted.
//
// Re-exports:
//   The full analytics.ts API surface is re-exported for call sites that were
//   wired before this split-module architecture existed (App.tsx, etc.).
//   Over time, callers should migrate to the three-function API above.

export {
    // Primary three-function API
    trackEvent as track,
    setUserId as identify,
    // Re-export everything from the monolithic wrapper for backward compat
    trackEvent,
    trackFirstEvent,
    trackFirstEvent as trackFirst,
    setUserId,
    setConsent,
    getConsent,
    loadConsentFromStorage,
    bootstrapAnalytics,
    captureAttributionFromUrl,
    markDailyActive,
    logActivityWithAnalytics,
    type AnalyticsEventName,
    type ConsentTier,
} from '../analytics';

// Convenience page() wrapper that fires page_view with the current document title.
import { trackEvent } from '../analytics';

export async function page(title?: string): Promise<void> {
    return trackEvent('page_view', {
        page_title: title ?? (typeof document !== 'undefined' ? document.title : ''),
    });
}

// Re-export destination-specific utilities for configuration surfaces (e.g.,
// the consent banner needs updateConsent for GA4 Consent Mode v2).
export { updateConsent as updateGA4Consent, identifyGA4, initGA4 } from './ga4';
export { initMetaPixel, isMetaPixelEnabled, META_STANDARD_EVENT_MAP } from './meta-pixel';
export { initPostHog, setPostHogConsent, identifyPostHog, isPostHogEnabled, POSTHOG_HOST } from './posthog';
