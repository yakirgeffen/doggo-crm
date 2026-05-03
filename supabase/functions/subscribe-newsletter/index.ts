import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ============================================================
// subscribe-newsletter — public newsletter capture endpoint
//
// POST { email: string, source?: string }
// Returns: { success: true, status: 'subscribed' | 'already-subscribed' | 'resubscribed' }
//
// Behavior:
//   - lowercases + trims email
//   - dedupes via the unique index on lower(email)
//   - if email already exists and unsubscribed_at IS NULL → no-op (already-subscribed)
//   - if email already exists and unsubscribed_at IS NOT NULL → clears unsubscribed_at (resubscribed)
//   - if email doesn't exist → inserts (subscribed)
//
// CAPTCHA: not enforced here — frontend uses minimal honeypot. If we see
// abuse, add Turnstile validation similar to process-intake.
// ============================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// @ts-expect-error Deno std import
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    try {
        const body = await req.json()
        const rawEmail = (body?.email ?? '').toString().trim().toLowerCase()
        const source = (body?.source ?? null)?.toString().slice(0, 100) || null
        const honeypot = body?.website

        if (honeypot) {
            return new Response(JSON.stringify({ success: true, status: 'subscribed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        if (!rawEmail || !isValidEmail(rawEmail) || rawEmail.length > 254) {
            return new Response(JSON.stringify({ error: 'Valid email required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: existing, error: lookupError } = await supabaseAdmin
            .from('newsletter_subscribers')
            .select('id, unsubscribed_at')
            .eq('email', rawEmail)
            .maybeSingle()

        if (lookupError) {
            return new Response(JSON.stringify({ error: lookupError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (existing) {
            if (existing.unsubscribed_at) {
                const { error: updateError } = await supabaseAdmin
                    .from('newsletter_subscribers')
                    .update({ unsubscribed_at: null, source: source || undefined })
                    .eq('id', existing.id)
                if (updateError) {
                    return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                }
                return new Response(JSON.stringify({ success: true, status: 'resubscribed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ success: true, status: 'already-subscribed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const { error: insertError } = await supabaseAdmin
            .from('newsletter_subscribers')
            .insert({ email: rawEmail, source })
        if (insertError) {
            // Race condition: another request may have inserted between our lookup and insert.
            if (insertError.code === '23505') {
                return new Response(JSON.stringify({ success: true, status: 'already-subscribed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({ success: true, status: 'subscribed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
