import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Authenticate User
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        // 2. Parse Request
        const { action, payload } = await req.json()

        // 3. Create Admin Client to access Vault (Bypass RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Fetch Keys from Vault
        const { data: vault, error: vaultError } = await supabaseAdmin
            .from('sys_integrations_vault')
            .select('access_key_id, secret_access_key')
            .eq('user_id', user.id)
            .eq('service_name', 'morning')
            .single()

        if (vaultError || !vault || !vault.access_key_id || !vault.secret_access_key) {
            throw new Error('Morning API keys not found via Vault. Please check Settings.')
        }

        const MORNING_API_URL = 'https://api.morning.co/api/v2' // Production URL

        // --- ACTION: TEST CONNECTION ---
        if (action === 'test_connection') {
            const tokenResponse = await fetch(`${MORNING_API_URL}/account/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: vault.access_key_id,
                    secret: vault.secret_access_key
                })
            });

            if (!tokenResponse.ok) {
                if (tokenResponse.status === 401) {
                    throw new Error('אימות נכשל. אנא בדוק את המפתחות ונסה שוב.')
                }
                throw new Error('Failed to authenticate with Morning.')
            }

            return new Response(JSON.stringify({ success: true, message: "החיבור ל-Morning בוצע בהצלחה! 🟢" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // --- ACTION: GENERATE PAYMENT LINK ---
        if (action === 'generate_link') {
            // 1. Get Token
            const tokenRes = await fetch(`${MORNING_API_URL}/account/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: vault.access_key_id,
                    secret: vault.secret_access_key
                })
            });

            if (!tokenRes.ok) throw new Error('Morning Auth Failed');
            const tokenData = await tokenRes.json();
            const token = tokenData.token;

            // 2. Create Document (Payment Link)
            const docRes = await fetch(`${MORNING_API_URL}/docs/digital-payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: payload.description,
                    amount: payload.amount,
                    currency: payload.currency || 'ILS',
                    client: {
                        name: payload.clientName,
                        email: payload.clientEmail,
                        phone: payload.clientPhone // Optional
                    },
                    maxPayments: 1,
                    paymentType: 'bit_cc',
                })
            });

            if (!docRes.ok) {
                const errText = await docRes.text();
                throw new Error(`Morning API Error: ${errText}`);
            }

            const docData = await docRes.json();

            return new Response(JSON.stringify({
                success: true,
                url: docData.url,
                id: docData.id
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error(`Unknown action: ${action}`)

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
