// Meta Conversions API (CAPI) — server-side mirror of the browser Pixel.
//
// Authored 2026-05-17 by Neta (Data IC). Pairs with `src/lib/analytics.ts`
// which posts events to this endpoint for high-priority taxonomy events.
//
// Why server-side:
//   - iOS 14.5+ App Tracking Transparency blocks Meta browser-Pixel events
//     from significant share of mobile traffic.
//   - Ad-blockers silently drop the browser Pixel; CAPI fires from origin.
//   - Event deduplication via `event_id`: Meta dedupes browser-Pixel and
//     CAPI fires that share an event_id, so we get the resilience of both
//     paths without double-counting.
//
// Required env vars (Supabase Functions secrets):
//   - META_PIXEL_ID            (matches VITE_META_PIXEL_ID on the client)
//   - META_CAPI_ACCESS_TOKEN   (long-lived system user token from Meta Business)
//   - META_CAPI_TEST_EVENT_CODE (optional — for Events Manager Test Events tab)
//
// Set via: supabase secrets set META_PIXEL_ID=... META_CAPI_ACCESS_TOKEN=...
//
// Docs: https://developers.facebook.com/docs/marketing-api/conversions-api

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CapiRequest {
    event_name: string;
    event_id: string;
    event_time: number; // unix seconds
    event_source_url?: string;
    action_source?: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
    properties?: Record<string, unknown>;
    user_email?: string | null;
    user_phone?: string | null;
}

async function sha256(input: string): Promise<string> {
    const buf = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function normalizeEmail(e: string): string {
    return e.trim().toLowerCase();
}

function normalizePhone(p: string): string {
    // E.164-ish: strip everything except digits + leading +. Meta accepts
    // hashed E.164 with no leading +; we strip + before hashing.
    return p.replace(/[^\d+]/g, '').replace(/^\+/, '');
}

// @ts-expect-error — Deno std resolves at edge-deploy time
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'POST only' }), {
            status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // @ts-expect-error — Deno.env resolves at edge-deploy time
    const pixelId = Deno.env.get('META_PIXEL_ID');
    // @ts-expect-error — Deno.env
    const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN');
    // @ts-expect-error — Deno.env
    const testEventCode = Deno.env.get('META_CAPI_TEST_EVENT_CODE');

    if (!pixelId || !accessToken) {
        // Soft-fail: in a not-yet-configured environment, the endpoint
        // responds 200 with a no-op marker so the client doesn't see
        // a 500 cascade during the rollout window. Once secrets are
        // configured, the endpoint becomes active.
        return new Response(JSON.stringify({ status: 'noop', reason: 'Meta CAPI not configured' }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    let body: CapiRequest;
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: 'invalid JSON' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Build the user_data block. Meta requires hashed PII.
    const userData: Record<string, unknown> = {};
    if (body.user_email) {
        userData.em = [await sha256(normalizeEmail(body.user_email))];
    }
    if (body.user_phone) {
        userData.ph = [await sha256(normalizePhone(body.user_phone))];
    }
    const clientIpAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('cf-connecting-ip')
        || '';
    const clientUserAgent = req.headers.get('user-agent') || '';
    if (clientIpAddress) userData.client_ip_address = clientIpAddress;
    if (clientUserAgent) userData.client_user_agent = clientUserAgent;

    // Forward fbp + fbc cookies if present in properties (browser passes them).
    const props = body.properties || {};
    if (typeof props.fbp === 'string') userData.fbp = props.fbp;
    if (typeof props.fbc === 'string') userData.fbc = props.fbc;
    // Synthesize fbc from fbclid query param if browser cookie is absent.
    if (!userData.fbc && typeof props.fbclid === 'string' && props.fbclid) {
        userData.fbc = `fb.1.${Date.now()}.${props.fbclid}`;
    }

    const eventPayload: Record<string, unknown> = {
        event_name: body.event_name,
        event_time: body.event_time || Math.floor(Date.now() / 1000),
        event_id: body.event_id,
        event_source_url: body.event_source_url || '',
        action_source: body.action_source || 'website',
        user_data: userData,
        custom_data: {
            // Pass-through of taxonomy properties as custom_data. Meta
            // recognizes specific keys (value, currency, content_name,
            // content_ids, content_type, content_category) — others are
            // accepted as custom fields.
            ...props,
        },
    };

    const requestBody: Record<string, unknown> = {
        data: [eventPayload],
    };
    if (testEventCode) {
        requestBody.test_event_code = testEventCode;
    }

    const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
        const json = await res.json();
        if (!res.ok) {
            console.error('[meta-capi] graph API error:', json);
            return new Response(JSON.stringify({ status: 'graph-error', detail: json }), {
                status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        return new Response(JSON.stringify({ status: 'ok', graph: json }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('[meta-capi] fetch failed:', err);
        return new Response(JSON.stringify({ status: 'fetch-failed', error: String(err) }), {
            status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
