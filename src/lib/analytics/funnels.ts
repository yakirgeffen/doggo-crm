// DoggoCRM — Canonical funnel definitions
//
// Authored 2026-05-17 by Neta (Data IC).
//
// This file defines the conversion funnels the studio tracks for DoggoCRM.
// It is the machine-readable source of truth for funnel queries in PostHog,
// the Supabase attribution view, and any future dashboard surface.
//
// Companion docs:
//   - projects/doggo-crm/analytics/event-taxonomy.md  (event definitions)
//   - tools/social-presence-engine/db/views/signup-attribution.sql (Supabase view)
//
// These definitions are designed for use with PostHog's Funnel insight
// (Funnel Steps → Conversion Rates) and GA4 Exploration → Funnel Exploration.
// They are not executable code at runtime; they are data that can be consumed
// by configuration scripts or documentation generators.

import type { AnalyticsEventName } from '../analytics';

export interface FunnelStep {
    /** Event name from the taxonomy. */
    event: AnalyticsEventName;
    /** Human-readable step label. */
    label: string;
    /** Typical drop-off at this step vs. the previous step (expressed as % retained). */
    expectedRetentionRange: [min: number, max: number];
    /** Notes for the analyst reviewing this step. */
    notes?: string;
}

export interface Funnel {
    id: string;
    name: string;
    description: string;
    /** Steps in order. Step 1 is the entry point; the last step is the conversion goal. */
    steps: FunnelStep[];
    /** Who owns the funnel analysis. */
    owner: 'cpmo' | 'cpo' | 'cmo';
    /** Conversion window in days (how long after step 1 we wait for step N). */
    conversionWindowDays: number;
}

// ============================================================================
// Funnel: Founding-cohort signup (acquisition → activation)
// Owner: CPMO (acquisition measurement) + CPO (activation measurement)
// This is the primary funnel for the founding-cohort outreach period.
// ============================================================================

export const SIGNUP_FUNNEL: Funnel = {
    id: 'founding-cohort-signup',
    name: 'Founding Cohort Signup',
    description:
        'Traces the path from landing page visit through pricing consideration, ' +
        'signup, and first meaningful product action. Primary measurement vehicle ' +
        'for founding-cohort outreach attribution.',
    owner: 'cpmo',
    conversionWindowDays: 7,
    steps: [
        {
            event: 'page_view',
            label: 'Landing page visit',
            expectedRetentionRange: [100, 100],
            notes: 'Entry step — filter to path=/ or path=/pricing to scope to acquisition traffic.',
        },
        {
            event: 'pricing_page_view',
            label: 'Pricing page viewed',
            expectedRetentionRange: [20, 40],
            notes:
                'Significant drop expected — many visitors bounce before reaching pricing. ' +
                'This is the intent-signal step: reaching pricing indicates a trainer is ' +
                'evaluating seriously rather than just browsing.',
        },
        {
            event: 'login_start',
            label: 'Signup / login initiated',
            expectedRetentionRange: [30, 60],
            notes:
                'Drop from pricing → login is the primary friction point. ' +
                'A/B test surface: does adding social proof on pricing increase this rate?',
        },
        {
            event: 'signup_complete',
            label: 'Account created',
            expectedRetentionRange: [60, 85],
            notes:
                'Login-start → signup-complete is mostly OAuth friction (Google consent screen). ' +
                'Drop here indicates a consent/UX issue rather than intent problem.',
        },
        {
            event: 'first_dog_added',
            label: 'First dog added (activation signal)',
            expectedRetentionRange: [30, 55],
            notes:
                'First meaningful product action that requires data entry about a specific client. ' +
                'Trainers who reach this step are engaged with the product, not just exploring. ' +
                'If first_client_created shows higher retention than first_dog_added, trainers ' +
                'are creating clients without dogs — investigate whether the dog field is prominent enough.',
        },
    ],
};

// ============================================================================
// Funnel: Full activation (signup → retention-ready)
// Owner: CPO
// Measures whether a trainer reaches "retention-ready" state after signup.
// ============================================================================

export const ACTIVATION_FUNNEL: Funnel = {
    id: 'activation',
    name: 'Trainer Activation',
    description:
        'Tracks the trainer through the setup checklist and first key actions. ' +
        '"Activated" = completed signup, added a real client, and logged at least one session. ' +
        'Activation is the leading indicator of retention.',
    owner: 'cpo',
    conversionWindowDays: 3,
    steps: [
        {
            event: 'signup_complete',
            label: 'Account created',
            expectedRetentionRange: [100, 100],
            notes: 'Entry step for activation funnel.',
        },
        {
            event: 'first_client_created',
            label: 'First client added',
            expectedRetentionRange: [40, 65],
            notes:
                'Day 0 activation gate. Trainers who add a client within the first session ' +
                'are significantly more likely to return.',
        },
        {
            event: 'first_session_logged',
            label: 'First session logged',
            expectedRetentionRange: [50, 75],
            notes:
                'Requires navigating from client → program → new session. ' +
                'This is the "aha moment" candidate — investigate with session recordings ' +
                '(PostHog) whether trainers stall at program creation vs. session booking.',
        },
    ],
};

// ============================================================================
// Funnel: Payment conversion (activated trainer → paying customer)
// Owner: CPMO (commercial)
// Scaffolded — not active until commercial billing launches.
// ============================================================================

export const PAYMENT_FUNNEL: Funnel = {
    id: 'payment-conversion',
    name: 'Payment Conversion',
    description:
        'Scaffolded. Tracks trainers from trial state to paid conversion. ' +
        'Not measurable until the billing surface launches. ' +
        'Wire the revenue events (trial_started, paid_conversion) when billing ships.',
    owner: 'cpmo',
    conversionWindowDays: 30,
    steps: [
        {
            event: 'signup_complete',
            label: 'Account created',
            expectedRetentionRange: [100, 100],
        },
        {
            event: 'trial_started',
            label: 'Trial started',
            expectedRetentionRange: [10, 30],
            notes: 'Scaffolded — fires when user_settings.trial_started_at is populated.',
        },
        {
            event: 'paid_conversion',
            label: 'First payment',
            expectedRetentionRange: [20, 50],
            notes: 'Scaffolded — fires on successful billing confirmation.',
        },
    ],
};

// All funnels, for iteration in configuration scripts.
export const ALL_FUNNELS: Funnel[] = [
    SIGNUP_FUNNEL,
    ACTIVATION_FUNNEL,
    PAYMENT_FUNNEL,
];

// Step index lookup for use in analytics call sites.
// e.g. SIGNUP_FUNNEL_STEPS.pricing_viewed is the step object for pricing_page_view.
export const SIGNUP_FUNNEL_STEPS = {
    landing:          SIGNUP_FUNNEL.steps[0],
    pricing_viewed:   SIGNUP_FUNNEL.steps[1],
    signup_started:   SIGNUP_FUNNEL.steps[2],
    signup_completed: SIGNUP_FUNNEL.steps[3],
    first_dog_added:  SIGNUP_FUNNEL.steps[4],
} as const;
