import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ============================================================
// Doggo CRM Public API v1 — bidirectional API surface (G5)
//
// Auth: per-trainer API token in X-Doggo-Token header. Token is
// SHA-256-hashed on the server and matched against
// user_settings.api_token_hash to identify the trainer. Writes
// are then performed via service-role on behalf of that trainer.
//
// Actions (this is phase 1 — minimal surface):
//   - create_client: create a client row scoped to the calling trainer
//   - create_intake_submission: create an intake_submission row
//
// Make / Zapier integration:
//   POST https://<project>.supabase.co/functions/v1/api-v1
//   Headers: X-Doggo-Token: <trainer-token>, Content-Type: application/json
//   Body: { "action": "create_client", "payload": { ... } }
// ============================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-doggo-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sha256Hex(input: string): Promise<string> {
    const buf = new TextEncoder().encode(input)
    const hashBuf = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// @ts-expect-error Deno std import
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    try {
        const token = req.headers.get('X-Doggo-Token') || req.headers.get('x-doggo-token')
        if (!token || token.length < 10) {
            return new Response(JSON.stringify({ error: 'Missing X-Doggo-Token header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const tokenHash = await sha256Hex(token)

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('user_settings')
            .select('user_id')
            .eq('api_token_hash', tokenHash)
            .maybeSingle()

        if (settingsError || !settings) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const trainerId = settings.user_id

        const body = await req.json()
        const { action, payload } = body || {}
        if (!action) {
            return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'create_client') {
            const { full_name, email, phone, primary_dog_name, notes, lead_source } = payload || {}
            if (!full_name) {
                return new Response(JSON.stringify({ error: 'full_name is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            const { data, error } = await supabaseAdmin
                .from('clients')
                .insert({
                    user_id: trainerId,
                    full_name,
                    email: email || null,
                    phone: phone || null,
                    primary_dog_name: primary_dog_name || null,
                    notes: notes || null,
                    lead_source: lead_source || null,
                    is_active: true,
                })
                .select('id')
                .single()
            if (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ success: true, client_id: data?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'create_intake_submission') {
            const { full_name, phone, dog_name, dog_breed, dog_age, notes, lead_source } = payload || {}
            if (!full_name) {
                return new Response(JSON.stringify({ error: 'full_name is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            const { data, error } = await supabaseAdmin
                .from('intake_submissions')
                .insert({
                    trainer_id: trainerId,
                    full_name,
                    phone: phone || null,
                    dog_name: dog_name || null,
                    dog_breed: dog_breed || null,
                    dog_age: dog_age || null,
                    notes: notes || null,
                    lead_source: lead_source || null,
                    status: 'new',
                })
                .select('id')
                .single()
            if (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ success: true, submission_id: data?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
