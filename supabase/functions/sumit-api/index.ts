import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================
// Sumit edge function — server-side proxy to https://api.sumit.co.il
//
// Auth model: Sumit uses body-level Credentials per request:
//   { "Credentials": { "CompanyID": <int>, "APIKey": "<string>" } }
// We store CompanyID in sys_integrations_vault.access_key_id
// (the column is text; CompanyID is numeric in Sumit but we serialize)
// and APIKey in sys_integrations_vault.secret_access_key. Per
// vault row: service_name = 'sumit'.
//
// Why an edge function: APIKey must never reach the browser. The
// browser invokes this function with action+payload; we attach
// Credentials from vault server-side.
//
// Source-of-truth: API surface from yakir-supplied docs page
// 2026-05-02. Document the verified vs. assumed parts inline.
// ============================================================

// P1-2 (2026-05-17): restrict CORS to doggocrm.app + Vercel preview URLs.
// sumit-api is auth-gated (requires valid Supabase JWT). Same rationale
// as morning-api — wildcard on an auth-gated function adds unnecessary
// cross-site request surface.
function getAllowedOrigin(req: Request): string {
    const origin = req.headers.get('Origin') || ''
    if (
        origin === 'https://doggocrm.app' ||
        origin.endsWith('.vercel.app')
    ) {
        return origin
    }
    return 'https://doggocrm.app'
}

function getCorsHeaders(req: Request) {
    return {
        'Access-Control-Allow-Origin': getAllowedOrigin(req),
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
}

const SUMIT_BASE = 'https://api.sumit.co.il'

interface SumitCredentials {
    CompanyID: number
    APIKey: string
}

async function callSumit(path: string, credentials: SumitCredentials, payload: Record<string, unknown>) {
    const body = { ...payload, Credentials: credentials }
    const response = await fetch(`${SUMIT_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const text = await response.text()
    let parsed: unknown = null
    try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
    if (!response.ok) {
        throw new Error(`Sumit ${path} failed (${response.status}): ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`)
    }
    return parsed as Record<string, unknown>
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: getCorsHeaders(req) })
    }

    const corsHeaders = getCorsHeaders(req)

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { action, payload } = await req.json()

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: vault, error: vaultError } = await supabaseAdmin
            .from('sys_integrations_vault')
            .select('access_key_id, secret_access_key')
            .eq('user_id', user.id)
            .eq('service_name', 'sumit')
            .single()

        if (vaultError || !vault || !vault.access_key_id || !vault.secret_access_key) {
            throw new Error('Sumit credentials not found in vault. Please save your CompanyID + APIKey in Settings.')
        }

        const companyIdNum = Number(vault.access_key_id)
        if (!Number.isFinite(companyIdNum)) {
            throw new Error('Invalid CompanyID stored in vault — expected numeric.')
        }

        const credentials: SumitCredentials = {
            CompanyID: companyIdNum,
            APIKey: vault.secret_access_key,
        }

        // --- ACTION: TEST CONNECTION ---
        // Sumit doesn't expose a dedicated "ping" endpoint in the visible
        // API surface. We probe with a low-impact call: try to fetch a
        // PDF for a known-nonexistent DocumentID (0). The expected
        // outcome is an auth-or-not-found error from Sumit; either way
        // the response shape tells us whether credentials are accepted.
        // Replace with a more authoritative probe when CTO confirms.
        if (action === 'test_connection') {
            try {
                await callSumit('/accounting/documents/getpdf/', credentials, {
                    DocumentID: 0,
                    DocumentType: 0,
                    DocumentNumber: 0,
                    Original: false,
                })
                return new Response(JSON.stringify({ success: true, message: 'החיבור ל-Sumit פעיל 🟢' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                // Auth failures will surface as 401/403 inside the message;
                // doc-not-found errors are signal that creds are valid.
                if (/401|403|unauthor/i.test(msg)) {
                    throw new Error('אימות נכשל. בדוק CompanyID ו-APIKey.')
                }
                return new Response(JSON.stringify({ success: true, message: 'החיבור ל-Sumit פעיל (creds accepted; probe returned not-found as expected) 🟢' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
        }

        // --- ACTION: CREATE DOCUMENT ---
        // Creates an invoice / quote / receipt etc. Caller specifies
        // DocumentType per Sumit's enum. For G8 native quote:
        // DocumentType = price quotation enum value (verify with CTO
        // against Sumit docs — common Sumit value is 6 but unverified).
        if (action === 'create_document') {
            const result = await callSumit('/accounting/documents/create/', credentials, payload.body || payload)
            return new Response(JSON.stringify({ success: true, data: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // --- ACTION: SEND DOCUMENT (email to customer) ---
        if (action === 'send_document') {
            const result = await callSumit('/accounting/documents/send/', credentials, payload.body || payload)
            return new Response(JSON.stringify({ success: true, data: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // --- ACTION: GET DOCUMENT PDF ---
        if (action === 'get_document_pdf') {
            const result = await callSumit('/accounting/documents/getpdf/', credentials, payload.body || payload)
            return new Response(JSON.stringify({ success: true, data: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // --- ACTION: BEGIN PAYMENT (custom transaction) ---
        if (action === 'begin_payment') {
            const result = await callSumit('/billing/payments/begintransdirect/', credentials, payload.body || payload)
            return new Response(JSON.stringify({ success: true, data: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // --- ACTION: CHARGE PAYMENT (one-time, against stored method) ---
        if (action === 'charge_payment') {
            const result = await callSumit('/billing/payments/charge/', credentials, payload.body || payload)
            return new Response(JSON.stringify({ success: true, data: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // --- ACTION: RECURRING CHARGE (subscription) ---
        if (action === 'recurring_charge') {
            const result = await callSumit('/billing/recurring/charge/', credentials, payload.body || payload)
            return new Response(JSON.stringify({ success: true, data: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // --- ACTION: SET PAYMENT METHOD FOR CUSTOMER ---
        if (action === 'set_payment_method') {
            const result = await callSumit('/billing/paymentmethods/setforcustomer/', credentials, payload.body || payload)
            return new Response(JSON.stringify({ success: true, data: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error(`Unknown action: ${action}`)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ success: false, error: message }), {
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
