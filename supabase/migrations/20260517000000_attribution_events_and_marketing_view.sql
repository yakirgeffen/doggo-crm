-- Attribution events table + marketing_attribution materialized view.
--
-- Authored 2026-05-17 by Neta (Data IC). Pairs with:
--   - src/lib/analytics.ts                                 (browser-side wrapper)
--   - supabase/functions/analytics-relay/index.ts          (server-side mirror)
--   - projects/doggo-crm/analytics/event-taxonomy.md       (canonical events)
--
-- DEPLOY GATE: requires QA Engineer pre-review + CTO sign-off per Neta
-- profile §Hard Stop. Do NOT `supabase db push` until both approvals are
-- captured in the same work order.
--
-- RLS posture: service-role writes only. The `attribution_events` table
-- is studio analytics data, not user data. RLS is enabled with deny-all
-- defaults so anon and authenticated keys cannot read or write. Service
-- role bypasses RLS as designed.

-- ---------------------------------------------------------------------------
-- attribution_events: canonical event log for marketing analytics.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.attribution_events (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name      TEXT NOT NULL,
    user_id         UUID,
    session_id      TEXT,
    path            TEXT,
    referrer        TEXT,
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,
    utm_term        TEXT,
    utm_content     TEXT,
    gclid           TEXT,
    fbclid          TEXT,
    properties      JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.attribution_events IS
    'Canonical server-side event log for marketing analytics. Mirrored from src/lib/analytics.ts via the analytics-relay edge function. Service-role writes only.';

CREATE INDEX IF NOT EXISTS attribution_events_event_name_idx ON public.attribution_events (event_name);
CREATE INDEX IF NOT EXISTS attribution_events_user_id_idx ON public.attribution_events (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS attribution_events_session_id_idx ON public.attribution_events (session_id);
CREATE INDEX IF NOT EXISTS attribution_events_utm_campaign_idx ON public.attribution_events (utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS attribution_events_created_at_idx ON public.attribution_events (created_at DESC);
CREATE INDEX IF NOT EXISTS attribution_events_gclid_idx ON public.attribution_events (gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS attribution_events_fbclid_idx ON public.attribution_events (fbclid) WHERE fbclid IS NOT NULL;

-- Enable RLS with deny-all defaults. Service role bypasses RLS; anon +
-- authenticated keys must not read or write to this table.
ALTER TABLE public.attribution_events ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies are created — absence-of-policy
-- means deny-all under RLS-enabled tables. Service role bypasses regardless.
-- This matches the Neta first-task design note "RLS enabled with no
-- policies; service-role-only access" pattern.

-- ---------------------------------------------------------------------------
-- marketing_attribution view: per-user attribution chain joining
-- intake_submissions.lead_source + auth.users + attribution_events.
-- ---------------------------------------------------------------------------

-- Helper function: parse the pipe-delimited intake_submissions.lead_source
-- string into a JSONB object. Format from PublicIntakePage.tsx (G3 entry):
-- "utm_source=foo|utm_medium=bar|utm_campaign=baz" (per-pair key=value).

CREATE OR REPLACE FUNCTION public.parse_lead_source(lead_source TEXT)
RETURNS JSONB
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    result JSONB := '{}'::jsonb;
    pair TEXT;
    pair_parts TEXT[];
BEGIN
    IF lead_source IS NULL OR lead_source = '' THEN
        RETURN result;
    END IF;
    FOREACH pair IN ARRAY string_to_array(lead_source, '|') LOOP
        pair_parts := string_to_array(pair, '=');
        IF array_length(pair_parts, 1) = 2 THEN
            result := result || jsonb_build_object(pair_parts[1], pair_parts[2]);
        END IF;
    END LOOP;
    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.parse_lead_source IS
    'Parse pipe-delimited lead_source string into JSONB. Format authored by G3 entry in PublicIntakePage.tsx.';

-- The marketing_attribution view joins three sources of attribution data:
--   1. attribution_events (server-side event log from the wrapper)
--   2. intake_submissions.lead_source (legacy UTM capture, pre-wrapper)
--   3. auth.users (signup time + provider)
-- Per-user first-touch + last-touch attribution chain.

CREATE OR REPLACE VIEW public.marketing_attribution AS
WITH user_first_touch AS (
    SELECT DISTINCT ON (user_id)
        user_id,
        utm_source AS first_utm_source,
        utm_medium AS first_utm_medium,
        utm_campaign AS first_utm_campaign,
        gclid AS first_gclid,
        fbclid AS first_fbclid,
        path AS first_landing_path,
        referrer AS first_referrer,
        created_at AS first_touch_at
    FROM public.attribution_events
    WHERE user_id IS NOT NULL
    ORDER BY user_id, created_at ASC
),
user_last_touch AS (
    SELECT DISTINCT ON (user_id)
        user_id,
        utm_source AS last_utm_source,
        utm_medium AS last_utm_medium,
        utm_campaign AS last_utm_campaign,
        gclid AS last_gclid,
        fbclid AS last_fbclid,
        created_at AS last_touch_at
    FROM public.attribution_events
    WHERE user_id IS NOT NULL
    ORDER BY user_id, created_at DESC
),
user_event_counts AS (
    SELECT
        user_id,
        COUNT(*) FILTER (WHERE event_name = 'page_view') AS page_views,
        COUNT(*) FILTER (WHERE event_name = 'first_client_created') AS first_clients,
        COUNT(*) FILTER (WHERE event_name = 'first_session_logged') AS first_sessions,
        COUNT(*) FILTER (WHERE event_name = 'first_invoice_sent') AS first_invoices,
        COUNT(*) FILTER (WHERE event_name = 'paid_conversion') AS paid_conversions,
        COUNT(*) AS total_events
    FROM public.attribution_events
    WHERE user_id IS NOT NULL
    GROUP BY user_id
),
intake_chain AS (
    -- For trainers who originally landed via a public intake form (lead
    -- conversion path), pull the lead_source from intake_submissions.
    SELECT
        u.id AS user_id,
        (parse_lead_source(i.lead_source) ->> 'utm_source') AS intake_utm_source,
        (parse_lead_source(i.lead_source) ->> 'utm_medium') AS intake_utm_medium,
        (parse_lead_source(i.lead_source) ->> 'utm_campaign') AS intake_utm_campaign,
        i.created_at AS intake_created_at
    FROM auth.users u
    LEFT JOIN LATERAL (
        SELECT lead_source, created_at
        FROM public.intake_submissions
        WHERE phone = u.phone OR full_name = (u.raw_user_meta_data ->> 'full_name')
        ORDER BY created_at ASC
        LIMIT 1
    ) i ON TRUE
)
SELECT
    u.id AS user_id,
    u.email,
    u.created_at AS signup_at,
    u.raw_app_meta_data ->> 'provider' AS signup_provider,
    -- First-touch attribution (the campaign that first brought them in)
    ft.first_utm_source,
    ft.first_utm_medium,
    ft.first_utm_campaign,
    ft.first_gclid,
    ft.first_fbclid,
    ft.first_landing_path,
    ft.first_referrer,
    ft.first_touch_at,
    -- Last-touch attribution (the campaign of their most recent visit)
    lt.last_utm_source,
    lt.last_utm_medium,
    lt.last_utm_campaign,
    lt.last_touch_at,
    -- Intake-chain attribution (if they came via a public intake form)
    ic.intake_utm_source,
    ic.intake_utm_medium,
    ic.intake_utm_campaign,
    ic.intake_created_at,
    -- Activation milestone counts
    COALESCE(ec.page_views, 0) AS page_views,
    COALESCE(ec.first_clients, 0) AS first_clients,
    COALESCE(ec.first_sessions, 0) AS first_sessions,
    COALESCE(ec.first_invoices, 0) AS first_invoices,
    COALESCE(ec.paid_conversions, 0) AS paid_conversions,
    COALESCE(ec.total_events, 0) AS total_events,
    -- Tenure since signup
    EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 86400.0 AS days_since_signup
FROM auth.users u
LEFT JOIN user_first_touch ft ON ft.user_id = u.id
LEFT JOIN user_last_touch lt ON lt.user_id = u.id
LEFT JOIN user_event_counts ec ON ec.user_id = u.id
LEFT JOIN intake_chain ic ON ic.user_id = u.id;

COMMENT ON VIEW public.marketing_attribution IS
    'Per-user first-touch + last-touch attribution chain joining attribution_events + intake_submissions + auth.users. Service-role read only.';

-- Lock down access. Only service role should query this view; the data
-- contains email + signup metadata across all trainers.
REVOKE ALL ON public.marketing_attribution FROM PUBLIC;
REVOKE ALL ON public.marketing_attribution FROM anon;
REVOKE ALL ON public.marketing_attribution FROM authenticated;
