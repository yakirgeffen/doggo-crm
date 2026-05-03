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
// Actions (phase 3 — bidirectional surface):
//   create:
//     - create_client
//     - create_intake_submission
//   read:
//     - list_clients (paginated; filter by is_active, search by name/email)
//     - get_client (by id)
//     - list_intake_submissions (paginated; filter by status)
//   update:
//     - update_client (partial update; restricted whitelist of fields)
//     - update_intake_submission_status (status transition)
//
// All actions are scoped to the trainer identified by X-Doggo-Token. The
// edge function uses service-role to bypass RLS but always enforces the
// `user_id = trainerId` (or `trainer_id = trainerId`) predicate manually
// to maintain isolation.
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
            const { full_name, email, phone, primary_dog_name, primary_dog_breed, notes, lead_source, behavioral_tags } = payload || {}
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
                    primary_dog_breed: primary_dog_breed || null,
                    notes: notes || null,
                    lead_source: lead_source || null,
                    behavioral_tags: Array.isArray(behavioral_tags) ? behavioral_tags : [],
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
            const { full_name, phone, dog_name, dog_breed, dog_age, notes, lead_source, behavioral_tags } = payload || {}
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
                    behavioral_tags: Array.isArray(behavioral_tags) ? behavioral_tags : [],
                    status: 'new',
                })
                .select('id')
                .single()
            if (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ success: true, submission_id: data?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'list_clients') {
            const { is_active, search, limit, offset } = payload || {}
            const safeLimit = Math.min(Math.max(parseInt(String(limit ?? 50), 10) || 50, 1), 200)
            const safeOffset = Math.max(parseInt(String(offset ?? 0), 10) || 0, 0)
            let query = supabaseAdmin
                .from('clients')
                .select('id, full_name, email, phone, primary_dog_name, primary_dog_breed, notes, lead_source, behavioral_tags, is_active, created_at', { count: 'exact' })
                .eq('user_id', trainerId)
                .order('created_at', { ascending: false })
                .range(safeOffset, safeOffset + safeLimit - 1)
            if (typeof is_active === 'boolean') {
                query = query.eq('is_active', is_active)
            }
            if (search && typeof search === 'string' && search.trim().length > 0) {
                const term = search.trim().replace(/[%,]/g, '')
                query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
            }
            const { data, error, count } = await query
            if (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ success: true, clients: data || [], total: count ?? null, limit: safeLimit, offset: safeOffset }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'get_client') {
            const { client_id } = payload || {}
            if (!client_id || typeof client_id !== 'string') {
                return new Response(JSON.stringify({ error: 'client_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            const { data, error } = await supabaseAdmin
                .from('clients')
                .select('id, full_name, email, phone, primary_dog_name, primary_dog_breed, notes, lead_source, behavioral_tags, is_active, created_at')
                .eq('user_id', trainerId)
                .eq('id', client_id)
                .maybeSingle()
            if (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            if (!data) {
                return new Response(JSON.stringify({ error: 'Client not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ success: true, client: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'update_client') {
            const { client_id, updates } = payload || {}
            if (!client_id || typeof client_id !== 'string') {
                return new Response(JSON.stringify({ error: 'client_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            if (!updates || typeof updates !== 'object') {
                return new Response(JSON.stringify({ error: 'updates object is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            const allowed = ['full_name', 'email', 'phone', 'primary_dog_name', 'primary_dog_breed', 'notes', 'lead_source', 'behavioral_tags', 'is_active']
            const filtered: Record<string, unknown> = {}
            for (const key of allowed) {
                if (Object.prototype.hasOwnProperty.call(updates, key)) {
                    filtered[key] = (updates as Record<string, unknown>)[key]
                }
            }
            if (Object.keys(filtered).length === 0) {
                return new Response(JSON.stringify({ error: 'No allowed fields in updates. Allowed: ' + allowed.join(', ') }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            const { data, error } = await supabaseAdmin
                .from('clients')
                .update(filtered)
                .eq('user_id', trainerId)
                .eq('id', client_id)
                .select('id')
                .maybeSingle()
            if (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            if (!data) {
                return new Response(JSON.stringify({ error: 'Client not found or not owned by this trainer' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ success: true, client_id: data.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'list_intake_submissions') {
            const { status, limit, offset } = payload || {}
            const safeLimit = Math.min(Math.max(parseInt(String(limit ?? 50), 10) || 50, 1), 200)
            const safeOffset = Math.max(parseInt(String(offset ?? 0), 10) || 0, 0)
            let query = supabaseAdmin
                .from('intake_submissions')
                .select('id, full_name, phone, dog_name, dog_breed, dog_age, notes, lead_source, behavioral_tags, status, selected_service_id, created_at', { count: 'exact' })
                .eq('trainer_id', trainerId)
                .order('created_at', { ascending: false })
                .range(safeOffset, safeOffset + safeLimit - 1)
            if (status && typeof status === 'string') {
                query = query.eq('status', status)
            }
            const { data, error, count } = await query
            if (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ success: true, submissions: data || [], total: count ?? null, limit: safeLimit, offset: safeOffset }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'update_intake_submission_status') {
            const { submission_id, status } = payload || {}
            if (!submission_id || typeof submission_id !== 'string') {
                return new Response(JSON.stringify({ error: 'submission_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            const allowedStatuses = ['new', 'approved', 'archived']
            if (!status || typeof status !== 'string' || !allowedStatuses.includes(status)) {
                return new Response(JSON.stringify({ error: 'status must be one of: ' + allowedStatuses.join(', ') }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            const { data, error } = await supabaseAdmin
                .from('intake_submissions')
                .update({ status })
                .eq('trainer_id', trainerId)
                .eq('id', submission_id)
                .select('id')
                .maybeSingle()
            if (error) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            if (!data) {
                return new Response(JSON.stringify({ error: 'Submission not found or not owned by this trainer' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ success: true, submission_id: data.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
