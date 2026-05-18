// Analytics relay — server-side mirror to PostHog + canonical event log.
//
// Authored 2026-05-17 by Neta (Data IC). Pairs with `src/lib/analytics.ts`
// which posts high-priority events here as a belt-and-suspenders against
// browser-side event loss (page-unload, ad-blockers, network blips).
//
// Writes:
//   - PostHog server-side capture (if POSTHOG_PROJECT_API_KEY set)
//   - `attribution_events` Supabase table (canonical event log)
//
// Required env vars:
//   - POSTHOG_PROJECT_API_KEY  (project API key — same as VITE_POSTHOG_KEY)
//   - POSTHOG_HOST             (default https://us.i.posthog.com)
//
// Set via: supabase secrets set POSTHOG_PROJECT_API_KEY=...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RelayRequest {
    event_name: string;
    properties: Record<string, unknown>;
}

// @ts-expect-error — Deno std
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'POST only' }), {
            status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    let body: RelayRequest;
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: 'invalid JSON' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const props = body.properties || {};
    const tasks: Promise<unknown>[] = [];

    // PostHog server-side capture.
    // @ts-expect-error — Deno.env
    const phKey = Deno.env.get('POSTHOG_PROJECT_API_KEY');
    // @ts-expect-error — Deno.env
    const phHost = Deno.env.get('POSTHOG_HOST') || 'https://us.i.posthog.com';
    if (phKey) {
        const distinctId = (props.user_id as string) || (props.session_id as string) || 'anonymous';
        const phPayload = {
            api_key: phKey,
            event: body.event_name,
            distinct_id: distinctId,
            properties: { ...props, $lib: 'doggo-relay-edge', $lib_version: '1.0.0' },
            timestamp: (props.timestamp as string) || new Date().toISOString(),
        };
        tasks.push(
            fetch(`${phHost}/i/v0/e/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(phPayload),
            }).catch(err => console.error('[relay] posthog send failed:', err))
        );
    }

    // Supabase write to attribution_events.
    // @ts-expect-error — Deno.env
    const supaUrl = Deno.env.get('SUPABASE_URL');
    // @ts-expect-error — Deno.env
    const supaServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supaUrl && supaServiceKey) {
        const supabase = createClient(supaUrl, supaServiceKey);
        tasks.push(
            supabase.from('attribution_events').insert([{
                event_name: body.event_name,
                user_id: props.user_id as string | null,
                session_id: props.session_id as string | null,
                path: props.path as string | null,
                referrer: props.referrer as string | null,
                utm_source: props.utm_source as string | null,
                utm_medium: props.utm_medium as string | null,
                utm_campaign: props.utm_campaign as string | null,
                utm_term: props.utm_term as string | null,
                utm_content: props.utm_content as string | null,
                gclid: props.gclid as string | null,
                fbclid: props.fbclid as string | null,
                properties: props,
            }]).then(({ error }) => {
                if (error) console.error('[relay] supabase insert failed:', error);
            })
        );
    }

    await Promise.allSettled(tasks);
    return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
});
