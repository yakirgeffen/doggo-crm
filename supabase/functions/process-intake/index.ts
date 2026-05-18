import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@3.2.0"

// P1-1 (2026-05-17): hard-fail at module init if Turnstile secret is absent.
// Silent-skip was the previous behaviour (`if (turnstileSecret) { ... }`),
// which meant the test-mode frontend key let every submission through when
// the env var was missing in production. A missing secret is a deployment
// error, not a runtime condition to silently tolerate.
const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY')
if (!TURNSTILE_SECRET) {
    throw new Error('Turnstile secret not configured — set TURNSTILE_SECRET_KEY in Supabase secrets before deploying')
}

const corsHeaders = {
    // process-intake is legitimately public (called from any trainer's
    // embedded intake page on arbitrary domains). Wildcard is correct here.
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-expect-error — Deno std import resolves at edge-function deploy time, not in local TypeScript
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Helper to sanitize user input against HTML injection XSS
    const escapeHtml = (unsafe: string) => {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    try {
        // P0-2 (2026-05-17): `trainer_id` is no longer accepted from the
        // request body. A caller supplying an arbitrary UUID as `trainer_id`
        // previously caused the lead to land in that UUID's tenant, enabling
        // cross-tenant lead theft. The fix: accept `trainerHandle` (the URL
        // slug), resolve the real user_id server-side via service-role query,
        // and use only the server-resolved id for the insert.
        const {
            trainerHandle,
            full_name,
            phone,
            dog_name,
            dog_breed,
            dog_age,
            notes,
            selected_service_id,
            captcha_token,
            lead_source
        } = await req.json()

        // P0-2: resolve trainerHandle → user_id server-side.
        // Use service-role so the query is not subject to RLS, and query
        // user_settings directly (the anon-safe RPC exists for the browser
        // but we want the raw user_id without relying on the RPC's column
        // filter for this server-side path).
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        if (!trainerHandle || typeof trainerHandle !== 'string') {
            // Return 404 — no information leak about whether handle exists.
            return new Response(JSON.stringify({ error: 'Trainer not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
            })
        }

        const { data: trainerRow, error: trainerLookupError } = await supabaseAdmin
            .from('user_settings')
            .select('user_id')
            .eq('trainer_handle', trainerHandle.trim().toLowerCase())
            .maybeSingle()

        if (trainerLookupError || !trainerRow) {
            // Return 404 regardless of the error shape — no leak about slug existence.
            return new Response(JSON.stringify({ error: 'Trainer not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
            })
        }

        const resolvedTrainerId = trainerRow.user_id

        // 1. Verify Captcha — hard-required (P1-1: secret is guaranteed non-null at init)
        const ip = req.headers.get('cf-connecting-ip')
        const formData = new FormData()
        formData.append('secret', TURNSTILE_SECRET)
        formData.append('response', captcha_token)
        formData.append('remoteip', ip || '')

        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        })
        const outcome = await result.json()
        if (!outcome.success) {
            throw new Error('Captcha validation failed')
        }

        // 2. Insert into DB via Service Role (Bypassing RLS)
        // trainer_id is the server-resolved value — never the caller-supplied one.
        const { error: insertError } = await supabaseAdmin
            .from('intake_submissions')
            .insert({
                trainer_id: resolvedTrainerId,
                full_name,
                phone,
                dog_name,
                dog_breed,
                dog_age,
                notes,
                selected_service_id, // Can be null
                status: 'new',
                captcha_token, // Store for audit if needed
                lead_source: lead_source || null // UTM-derived string from public intake form, or null for direct visits
            })

        if (insertError) {
            console.error('Insert Error:', insertError)
            throw new Error('Failed to save submission')
        }

        // P0-2 audit log: every successful intake submission is recorded in
        // activity_logs so cross-tenant probing attempts are detectable.
        await supabaseAdmin
            .from('activity_logs')
            .insert({
                entity_type: 'intake_submission',
                entity_id: resolvedTrainerId,
                action: 'created',
                details: `intake received for trainer_handle=${trainerHandle}`,
                user_id: resolvedTrainerId,
            })
            .then(({ error }) => {
                if (error) console.error('Audit log insert failed (non-fatal):', error)
            })

        // 3. Send Email Notification
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (resendKey) {
            try {
                const resend = new Resend(resendKey)

                // Fetch trainer email using the server-resolved trainer_id
                const { data: trainer, error: userError } = await supabaseAdmin.auth.admin.getUserById(resolvedTrainerId)

                if (!userError && trainer?.user?.email) {
                    await resend.emails.send({
                        from: 'Doggo CRM <notifications@doggocrm.app>', // P0-2 fix 2026-05-17 — verified sender, deploy gated on Yakir DNS verify
                        to: trainer.user.email,
                        subject: `🐶 ליד חדש: ${full_name}`,
                        html: `
                        <div dir="rtl" style="font-family: sans-serif; padding: 20px; background: #f9fafb;">
                            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                                <h2 style="color: #15803d; margin-top: 0;">ליד חדש התקבל!</h2>
                                <p><strong>שם:</strong> ${escapeHtml(full_name)}</p>
                                <p><strong>טלפון:</strong> ${escapeHtml(phone) || '-'}</p>
                                <p><strong>שם הכלב:</strong> ${escapeHtml(dog_name) || '-'}</p>
                                ${notes ? `<p><strong>הערות:</strong><br/>${escapeHtml(notes)}</p>` : ''}
                                <br/>
                                <a href="${Deno.env.get('APP_URL') ?? 'http://localhost:5173'}" style="background: #15803d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">כנס למערכת כדי לטפל</a>
                            </div>
                        </div>
                    `
                    })
                }
            } catch (emailError) {
                console.error('Email sending failed:', emailError)
                // Don't fail the request if email fails, just log it
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Function Error:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
