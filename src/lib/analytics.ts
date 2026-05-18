// DoggoCRM Analytics — cross-destination wrapper.
//
// Authored 2026-05-17 by Neta (Data IC). Canonical: ALL analytics events
// fire through this module. No direct gtag() / fbq() / posthog.capture()
// calls outside `src/lib/analytics.ts` and the consent-banner module.
//
// Companion docs:
//   - projects/doggo-crm/analytics/event-taxonomy.md  (canonical event list)
//   - projects/doggo-crm/analytics/README.md          (architecture)
//
// Destinations (parallel-fire):
//   - GA4              gtag.js loaded in index.html
//   - Meta Pixel       fbq() loaded in index.html
//   - Meta CAPI        Supabase edge function `meta-capi` (server-side mirror)
//   - PostHog Cloud    posthog-js loaded in index.html or via npm
//
// Consent: events are queued until the user grants the relevant consent
// tier via the consent banner. On grant, the queue drains in order.
// Essential events (login_start, signup_complete) bypass the analytics
// tier but never bypass the security tier.

import { supabase } from './supabase';

/* -------------------------------------------------------------------------- */
/*  Configuration                                                             */
/* -------------------------------------------------------------------------- */

// Measurement IDs pulled from Vite env. Falsy values are valid — the
// wrapper no-ops the destination if its ID is missing, so the app
// never breaks because a tracking ID is not yet configured.
//
// Production values are surfaced via Vercel env vars per
// projects/doggo-crm/analytics/README.md §Configuration.
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || '';
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';

const CAPI_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/meta-capi`;
const RELAY_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/analytics-relay`;

/* -------------------------------------------------------------------------- */
/*  Event taxonomy — TypeScript mirror of event-taxonomy.md                   */
/* -------------------------------------------------------------------------- */

export type AnalyticsEventName =
    // Acquisition
    | 'page_view'
    | 'landing_engagement_25pct'
    | 'landing_engagement_75pct'
    | 'pricing_page_view'
    | 'pricing_cta_click'
    | 'intake_form_view'
    | 'intake_form_start'
    | 'intake_form_step_complete'
    | 'intake_form_complete'
    | 'login_start'
    | 'signup_complete'
    // Activation
    | 'setup_checklist_step_complete'
    | 'setup_checklist_complete'
    | 'first_client_created'
    | 'first_dog_added'
    | 'first_program_created'
    | 'first_session_logged'
    | 'first_invoice_sent'
    | 'first_quote_sent'
    | 'first_calendar_event_created'
    | 'first_voice_intake_used'
    | 'first_intake_form_published'
    | 'first_integration_connected'
    // Retention
    | 'trainer_active_day'
    | 'trainer_active_week'
    | 'client_added'
    | 'program_created'
    | 'session_logged'
    | 'program_renewed'
    | 'quote_sent'
    | 'invoice_sent'
    | 'integration_connected'
    | 'lead_approved'
    // Revenue (scaffolded; not wired until commercial launch)
    | 'trial_started'
    | 'paid_conversion'
    | 'plan_upgraded'
    | 'plan_downgraded'
    | 'churn'
    // Engagement
    | 'whatsapp_template_sent'
    | 'intro_modal_completed'
    | 'intro_modal_skipped'
    | 'calculator_complete'
    | 'blog_post_read';

// Subset that is paid-attribution critical. These fire to ALL destinations
// AND mirror to Meta CAPI server-side for iOS 14.5+ / ad-blocker resilience.
const HIGH_PRIORITY_EVENTS: ReadonlySet<AnalyticsEventName> = new Set([
    'pricing_page_view',
    'pricing_cta_click',
    'intake_form_view',
    'intake_form_start',
    'intake_form_step_complete',
    'intake_form_complete',
    'login_start',
    'signup_complete',
    'setup_checklist_step_complete',
    'setup_checklist_complete',
    'first_client_created',
    'first_program_created',
    'first_session_logged',
    'first_invoice_sent',
    'first_quote_sent',
    'trial_started',
    'paid_conversion',
    'plan_upgraded',
    'churn',
]);

// Map taxonomy events to Meta's standard event names. Events not in this
// map fire to Meta as `CustomEvent` with the original name preserved.
// Meta standard events docs: https://developers.facebook.com/docs/meta-pixel/reference
const META_STANDARD_EVENT_MAP: Partial<Record<AnalyticsEventName, string>> = {
    page_view: 'PageView',
    pricing_page_view: 'ViewContent',
    pricing_cta_click: 'AddToCart',
    intake_form_view: 'ViewContent',
    intake_form_start: 'AddToCart',
    intake_form_complete: 'Lead',
    signup_complete: 'CompleteRegistration',
    paid_conversion: 'Purchase',
    trial_started: 'StartTrial',
};

/* -------------------------------------------------------------------------- */
/*  Base property collection                                                  */
/* -------------------------------------------------------------------------- */

interface AttributionContext {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    gclid: string | null;
    fbclid: string | null;
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'] as const;
const ATTRIBUTION_STORAGE_KEY = 'doggo:attribution';
const SESSION_ID_STORAGE_KEY = 'doggo:analytics_session_id';

function getOrCreateSessionId(): string {
    if (typeof sessionStorage === 'undefined') return 'ssr';
    let id = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(SESSION_ID_STORAGE_KEY, id);
    }
    return id;
}

export function captureAttributionFromUrl(): AttributionContext {
    if (typeof window === 'undefined') {
        return UTM_KEYS.reduce((acc, k) => ({ ...acc, [k]: null }), {} as AttributionContext);
    }
    const params = new URLSearchParams(window.location.search);
    let stored: AttributionContext;
    try {
        stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '{}');
    } catch {
        stored = {} as AttributionContext;
    }
    // First-touch wins: don't overwrite existing stored values, but fill in
    // any nulls if a fresh URL provides them.
    const next = { ...stored } as AttributionContext;
    let dirty = false;
    for (const k of UTM_KEYS) {
        const fromUrl = params.get(k);
        if (fromUrl && !next[k]) {
            next[k] = fromUrl.slice(0, 200);
            dirty = true;
        } else if (next[k] === undefined) {
            next[k] = null;
            dirty = true;
        }
    }
    if (dirty) {
        try { sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next)); } catch { /* swallow */ }
    }
    return next;
}

interface BaseProperties {
    path: string;
    referrer: string;
    session_id: string;
    user_id: string | null;
    is_authenticated: boolean;
    locale: string;
    timestamp: string;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    gclid: string | null;
    fbclid: string | null;
}

let cachedUserId: string | null = null;

export function setUserId(id: string | null): void {
    cachedUserId = id;
    if (id) {
        // GA4
        if (typeof window !== 'undefined' && (window as unknown as { gtag?: GtagFn }).gtag && GA4_MEASUREMENT_ID) {
            (window as unknown as { gtag: GtagFn }).gtag('config', GA4_MEASUREMENT_ID, { user_id: id });
        }
        // PostHog identify
        const ph = (window as unknown as { posthog?: PostHogClient }).posthog;
        if (ph && typeof ph.identify === 'function') {
            ph.identify(id);
        }
    } else {
        const ph = (window as unknown as { posthog?: PostHogClient }).posthog;
        if (ph && typeof ph.reset === 'function') ph.reset();
    }
}

async function buildBaseProperties(): Promise<BaseProperties> {
    if (typeof window === 'undefined') {
        // SSR safe defaults (the SPA is client-only but guard anyway).
        return {
            path: '/',
            referrer: '',
            session_id: 'ssr',
            user_id: null,
            is_authenticated: false,
            locale: 'he-IL',
            timestamp: new Date().toISOString(),
            utm_source: null, utm_medium: null, utm_campaign: null,
            utm_term: null, utm_content: null, gclid: null, fbclid: null,
        };
    }

    const attribution = captureAttributionFromUrl();
    return {
        path: window.location.pathname,
        referrer: document.referrer || '',
        session_id: getOrCreateSessionId(),
        user_id: cachedUserId,
        is_authenticated: cachedUserId !== null,
        locale: navigator.language || 'he-IL',
        timestamp: new Date().toISOString(),
        ...attribution,
    };
}

/* -------------------------------------------------------------------------- */
/*  Consent state                                                             */
/* -------------------------------------------------------------------------- */

export type ConsentTier = 'essential' | 'analytics' | 'marketing';

interface ConsentState {
    analytics: boolean;   // GA4 + PostHog
    marketing: boolean;   // Meta Pixel + Meta CAPI
}

const CONSENT_STORAGE_KEY = 'doggo:consent';
let consentState: ConsentState = { analytics: false, marketing: false };
const queuedEvents: Array<{ name: AnalyticsEventName; properties: Record<string, unknown> }> = [];

export function loadConsentFromStorage(): ConsentState {
    if (typeof localStorage === 'undefined') return { analytics: false, marketing: false };
    try {
        const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            consentState = {
                analytics: !!parsed.analytics,
                marketing: !!parsed.marketing,
            };
        }
    } catch { /* swallow */ }
    return consentState;
}

export function setConsent(next: ConsentState): void {
    consentState = next;
    try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    } catch { /* swallow */ }

    // GA4 consent mode v2 update
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: GtagFn }).gtag) {
        (window as unknown as { gtag: GtagFn }).gtag('consent', 'update', {
            analytics_storage: next.analytics ? 'granted' : 'denied',
            ad_storage: next.marketing ? 'granted' : 'denied',
            ad_user_data: next.marketing ? 'granted' : 'denied',
            ad_personalization: next.marketing ? 'granted' : 'denied',
        });
    }

    // Drain any queued events that are now permitted.
    if (queuedEvents.length > 0) {
        const drain = queuedEvents.splice(0, queuedEvents.length);
        for (const evt of drain) {
            // Re-enter through the public API so consent gating is re-checked.
            trackEvent(evt.name, evt.properties);
        }
    }
}

export function getConsent(): ConsentState {
    return consentState;
}

/* -------------------------------------------------------------------------- */
/*  Destination shims (typed wrappers)                                        */
/* -------------------------------------------------------------------------- */

type GtagFn = (command: string, ...args: unknown[]) => void;

interface PostHogClient {
    capture: (event: string, properties?: Record<string, unknown>) => void;
    identify: (id: string, properties?: Record<string, unknown>) => void;
    reset: () => void;
    register?: (properties: Record<string, unknown>) => void;
}

type FbqFn = (command: string, eventOrName: string, properties?: Record<string, unknown>, options?: Record<string, unknown>) => void;

function fireGA4(name: AnalyticsEventName, props: Record<string, unknown>): void {
    if (!GA4_MEASUREMENT_ID || typeof window === 'undefined') return;
    const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
    if (!gtag) return;
    gtag('event', name, props);
}

function fireMetaPixel(name: AnalyticsEventName, props: Record<string, unknown>): void {
    if (!META_PIXEL_ID || typeof window === 'undefined') return;
    const fbq = (window as unknown as { fbq?: FbqFn }).fbq;
    if (!fbq) return;
    const mapped = META_STANDARD_EVENT_MAP[name];
    if (mapped) {
        fbq('track', mapped, props);
    } else {
        fbq('trackCustom', name, props);
    }
}

function firePostHog(name: AnalyticsEventName, props: Record<string, unknown>): void {
    if (!POSTHOG_KEY || typeof window === 'undefined') return;
    const ph = (window as unknown as { posthog?: PostHogClient }).posthog;
    if (!ph) return;
    ph.capture(name, props);
}

async function fireMetaCAPI(name: AnalyticsEventName, props: Record<string, unknown>): Promise<void> {
    if (!META_PIXEL_ID || !import.meta.env.VITE_SUPABASE_URL) return;
    // Fire-and-forget; never block the UI thread on this.
    try {
        await fetch(CAPI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_name: META_STANDARD_EVENT_MAP[name] || name,
                event_id: `${getOrCreateSessionId()}:${name}:${Date.now()}`,
                event_time: Math.floor(Date.now() / 1000),
                event_source_url: typeof window !== 'undefined' ? window.location.href : '',
                action_source: 'website',
                properties: props,
                user_email: props.user_email || null,
                user_phone: props.user_phone || null,
            }),
            keepalive: true,
        });
    } catch (err) {
        console.warn('[analytics] Meta CAPI fire failed (non-fatal):', err);
    }
}

async function fireRelay(name: AnalyticsEventName, props: Record<string, unknown>): Promise<void> {
    if (!import.meta.env.VITE_SUPABASE_URL) return;
    try {
        await fetch(RELAY_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_name: name, properties: props }),
            keepalive: true,
        });
    } catch (err) {
        console.warn('[analytics] relay fire failed (non-fatal):', err);
    }
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Fire an analytics event to all configured destinations.
 *
 * Consent gating:
 *   - If `analytics` consent is not granted, the event is queued (max 100).
 *     On grant, the queue drains in order.
 *   - If `marketing` consent is not granted, marketing destinations
 *     (Meta Pixel, Meta CAPI) are skipped but analytics destinations
 *     (GA4, PostHog) still fire if analytics consent is granted.
 *
 * `login_start` and `signup_complete` bypass analytics-consent gating
 * because they are required for the product to function (auth flow);
 * they are still subject to marketing-consent gating for marketing fires.
 */
export async function trackEvent(
    name: AnalyticsEventName,
    properties: Record<string, unknown> = {}
): Promise<void> {
    const base = await buildBaseProperties();
    const props = { ...base, ...properties };
    const isHighPriority = HIGH_PRIORITY_EVENTS.has(name);
    const isEssential = name === 'login_start' || name === 'signup_complete';

    // Consent gating.
    if (!consentState.analytics && !isEssential) {
        if (queuedEvents.length < 100) {
            queuedEvents.push({ name, properties });
        }
        return;
    }

    // Analytics-tier destinations.
    if (consentState.analytics || isEssential) {
        fireGA4(name, props);
        firePostHog(name, props);
    }

    // Marketing-tier destinations.
    if (consentState.marketing) {
        fireMetaPixel(name, props);
        if (isHighPriority) {
            // Server-side mirror for resilience against ad-blockers / iOS 14.5+.
            void fireMetaCAPI(name, props);
        }
    }

    // Server-side relay for high-priority events. Belt-and-suspenders for
    // event loss on page unload before browser fires complete.
    if (isHighPriority && consentState.analytics) {
        void fireRelay(name, props);
    }
}

/**
 * Drop-in replacement for `logActivity` that also fires the analytics
 * event for actions that map to the taxonomy. Use this in surfaces where
 * the activity log is the canonical write AND we want a marketing signal.
 *
 * Existing logActivity call sites can opt-in by changing the import.
 */
export async function logActivityWithAnalytics(
    entityType: 'client' | 'program' | 'session' | 'email' | 'service' | 'settings' | 'client_attachment' | 'testimonial',
    entityId: string,
    action: string,
    description?: string,
    analyticsEvent?: { name: AnalyticsEventName; properties?: Record<string, unknown> }
): Promise<void> {
    const { error } = await supabase.from('activity_logs').insert([{
        entity_type: entityType,
        entity_id: entityId,
        action,
        description,
    }]);
    if (error) {
        console.error('Failed to log activity:', error);
    }
    if (analyticsEvent) {
        void trackEvent(analyticsEvent.name, analyticsEvent.properties || {});
    }
}

/* -------------------------------------------------------------------------- */
/*  First-event idempotency                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fire a `first_*` event only if it has not fired previously for this user.
 *
 * Backing store: `auth.users.user_metadata.first_events` (array of strings).
 * The wrapper appends the event name on first fire; subsequent calls are no-op.
 *
 * Fallback if no authenticated session: fires unconditionally and logs a
 * console warning. The wrapper does not have a non-auth idempotency surface;
 * `first_*` events are by definition trainer-scoped.
 */
export async function trackFirstEvent(
    name: AnalyticsEventName,
    properties: Record<string, unknown> = {}
): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn(`[analytics] trackFirstEvent('${name}') called without auth — firing unconditionally.`);
        return trackEvent(name, properties);
    }

    const fired = (user.user_metadata?.first_events as string[] | undefined) || [];
    if (fired.includes(name)) {
        return;
    }

    await trackEvent(name, properties);

    const next = [...fired, name];
    const { error } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, first_events: next },
    });
    if (error) {
        console.warn(`[analytics] trackFirstEvent('${name}') metadata update failed:`, error);
    }
}

/* -------------------------------------------------------------------------- */
/*  Bootstrap                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Call once from `src/App.tsx` on mount. Loads consent, captures attribution,
 * subscribes to auth state, and fires the initial page_view.
 */
export function bootstrapAnalytics(): void {
    if (typeof window === 'undefined') return;

    loadConsentFromStorage();
    captureAttributionFromUrl();

    // Subscribe to Supabase auth state for user_id propagation.
    supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) setUserId(data.session.user.id);
    });
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            setUserId(session.user.id);
            // Heuristic: if user was created within the last 60s, treat as signup.
            const createdAt = new Date(session.user.created_at).getTime();
            if (Date.now() - createdAt < 60_000) {
                void trackEvent('signup_complete', {
                    provider: session.user.app_metadata?.provider || 'unknown',
                    email_domain: (session.user.email || '').split('@')[1] || null,
                });
            }
        } else if (event === 'SIGNED_OUT') {
            setUserId(null);
        }
    });
}

/* -------------------------------------------------------------------------- */
/*  Daily / weekly retention idempotency                                      */
/* -------------------------------------------------------------------------- */

const DAY_KEY = 'doggo:analytics_day_marker';
const WEEK_KEY = 'doggo:analytics_week_marker';

function isoDay(d: Date): string {
    // Asia/Jerusalem day key. We avoid Intl heavy lifting; UTC-day shift is
    // close enough for retention idempotency (worst case: a fire near midnight
    // crosses day boundaries by a few hours).
    return d.toISOString().slice(0, 10);
}
function isoWeek(d: Date): string {
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86_400_000 + onejan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function markDailyActive(): void {
    if (typeof localStorage === 'undefined') return;
    const today = isoDay(new Date());
    const stored = localStorage.getItem(DAY_KEY);
    if (stored === today) return;
    localStorage.setItem(DAY_KEY, today);
    void trackEvent('trainer_active_day', { day_iso: today });

    const week = isoWeek(new Date());
    const storedWeek = localStorage.getItem(WEEK_KEY);
    if (storedWeek !== week) {
        localStorage.setItem(WEEK_KEY, week);
        void trackEvent('trainer_active_week', { week_iso: week });
    }
}
