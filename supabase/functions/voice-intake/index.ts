// ============================================================
// voice-intake — WhatsApp voice intake submission handler
// ------------------------------------------------------------
// Step 2 of the trainer-voice-intake build per work-order v1
// (geffen-studio:projects/doggo-crm/trainer-voice-intake-work-order-v1.md).
//
// Architecture (from work-order):
// - The bot service does Whisper STT + Claude extraction + WhatsApp
//   review-and-confirm. By the time it calls this function it has a
//   STRUCTURED payload of fields plus the trainer's phone number for
//   identity. This function does not do STT.
// - This function: identity validation → INSERT into intake_submissions
//   with intake_source='voice' → Resend notification email to trainer.
// - CORS posture: tighter than wildcard. Server-to-server only by intent;
//   the deployed app origin is allowed for opportunistic browser tests.
//
// Inputs (JSON body):
//   trainer_phone   — E.164 string, the trainer's WhatsApp number registered
//                     in voice_intake_trainers. Required.
//   owner_name      — extracted full name. Mapped to intake_submissions.full_name.
//                     Required (NOT NULL on the table).
//   owner_phone     — extracted phone. Mapped to intake_submissions.phone.
//   owner_email     — extracted email. Composed into notes (no column).
//   dog_name        — extracted dog name. Mapped to intake_submissions.dog_name.
//   dog_breed       — extracted breed. Mapped to intake_submissions.dog_breed.
//   dog_age         — extracted age. Mapped to intake_submissions.dog_age.
//   dog_gender      — extracted gender. Composed into notes (no column).
//   training_goals  — extracted goals. Composed into notes (primary content).
//
// Auth:
//   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
//   The bot service holds the service-role key (per voice-Liat substrate
//   pattern). The function compares the bearer to the env service-role key
//   before accepting the payload — no browser path is supported.
//
// Returns:
//   200 → { success: true, intake_id: <uuid> }
//   401 → { success: false, error, step }   (auth or unregistered phone)
//   400 → { success: false, error, step }   (missing required fields)
//   500 → { success: false, error, step }   (DB or Resend failure)
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@3.2.0"

// CORS — tighter than wildcard. The bot calls server-to-server, so CORS isn't
// load-bearing on the happy path; this surface restricts browser callers to
// the deployed app origin (configured via APP_URL env). Reason for keeping any
// CORS at all: opportunistic browser smoke-tests during development.
const allowedOrigin = Deno.env.get('APP_URL') ?? 'https://doggo-crm-test.vercel.app'
const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
}

const escapeHtml = (unsafe: string | null | undefined) => {
    if (!unsafe) return ''
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

type VoiceIntakePayload = {
    trainer_phone?: string
    owner_name?: string
    owner_phone?: string | null
    owner_email?: string | null
    dog_name?: string | null
    dog_breed?: string | null
    dog_age?: string | null
    dog_gender?: string | null
    training_goals?: string | null
}

const errResponse = (status: number, error: string, step: string) =>
    new Response(JSON.stringify({ success: false, error, step }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

// @ts-expect-error — Deno std import resolves at edge-function deploy time
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }
    if (req.method !== 'POST') {
        return errResponse(405, 'Method not allowed', 'method_check')
    }

    // Step 0 — Authorization. The bot sends the service-role key as bearer.
    // The function compares to its own env. Treating any non-match as 401
    // prevents anonymous browser invocations even if the verify_jwt platform
    // setting is left open.
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authHeader = req.headers.get('authorization') ?? ''
    const presentedToken = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!serviceRoleKey || presentedToken !== serviceRoleKey) {
        return errResponse(401, 'Unauthorized — service-role bearer required', 'auth')
    }

    let payload: VoiceIntakePayload
    try {
        payload = await req.json()
    } catch {
        return errResponse(400, 'Invalid JSON body', 'parse')
    }

    const trainerPhone = (payload.trainer_phone ?? '').trim()
    const ownerName = (payload.owner_name ?? '').trim()

    if (!trainerPhone) {
        return errResponse(400, 'trainer_phone is required', 'validate_trainer_phone')
    }
    if (!ownerName) {
        return errResponse(400, 'owner_name is required (intake_submissions.full_name is NOT NULL)', 'validate_owner_name')
    }
    // E.164 sanity check — matches the CHECK constraint on voice_intake_trainers.phone_e164
    if (!/^\+[1-9][0-9]{6,14}$/.test(trainerPhone)) {
        return errResponse(400, 'trainer_phone must be E.164 format (e.g. +972501234567)', 'validate_trainer_phone_format')
    }

    // Service-role client. RLS bypass is intentional — identity is proven by
    // the bearer check above; the trainer mapping below establishes scope.
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey,
    )

    // Step 1 — Identity validation: phone → trainer_id via voice_intake_trainers.
    const { data: registration, error: lookupError } = await supabaseClient
        .from('voice_intake_trainers')
        .select('trainer_id')
        .eq('phone_e164', trainerPhone)
        .maybeSingle()

    if (lookupError) {
        console.error('[voice-intake] trainer lookup error:', lookupError)
        return errResponse(500, 'Trainer lookup failed', 'trainer_lookup')
    }
    if (!registration) {
        return errResponse(401, 'Phone number is not registered with any trainer', 'trainer_unregistered')
    }
    const trainerId: string = registration.trainer_id

    // Compose notes from fields that don't have dedicated columns. Hebrew
    // labels match the existing surface (intake form / ProgramWorkspace).
    const noteParts: string[] = []
    if (payload.training_goals?.trim()) {
        noteParts.push(`מטרות אימון:\n${payload.training_goals.trim()}`)
    }
    if (payload.dog_gender?.trim()) {
        noteParts.push(`מין הכלב: ${payload.dog_gender.trim()}`)
    }
    if (payload.owner_email?.trim()) {
        noteParts.push(`אימייל בעלים: ${payload.owner_email.trim()}`)
    }
    const notes = noteParts.length > 0 ? noteParts.join('\n\n') : null

    // Step 2 — INSERT into intake_submissions.
    const { data: inserted, error: insertError } = await supabaseClient
        .from('intake_submissions')
        .insert({
            trainer_id: trainerId,
            full_name: ownerName,
            phone: payload.owner_phone?.trim() || null,
            dog_name: payload.dog_name?.trim() || null,
            dog_breed: payload.dog_breed?.trim() || null,
            dog_age: payload.dog_age?.trim() || null,
            notes,
            status: 'new',
            intake_source: 'voice',
            lead_source: 'voice-intake-whatsapp',
        })
        .select('id')
        .single()

    if (insertError || !inserted) {
        console.error('[voice-intake] insert error:', insertError)
        return errResponse(500, 'Failed to save submission', 'insert')
    }

    const intakeId = inserted.id

    // Step 3 — Resend notification (best-effort; do not fail the request if
    // email fails — match process-intake pattern).
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
        try {
            const resend = new Resend(resendKey)
            const { data: trainer, error: userError } =
                await supabaseClient.auth.admin.getUserById(trainerId)

            if (!userError && trainer?.user?.email) {
                await resend.emails.send({
                    from: 'Doggo CRM <notifications@doggocrm.app>', // P0-2 fix 2026-05-17 — verified sender, deploy gated on Yakir DNS verify
                    to: trainer.user.email,
                    subject: `🎙️ קבלה קולית חדשה ל-Doggo CRM — ${ownerName}`,
                    html: `
                    <div dir="rtl" style="font-family: sans-serif; padding: 20px; background: #f9fafb;">
                        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                            <h2 style="color: #4A6741; margin-top: 0;">קבלה קולית חדשה התקבלה!</h2>
                            <p style="color: #5A7D58; font-size: 12px; margin-bottom: 16px;">המקור: הודעה קולית ב-WhatsApp</p>
                            <p><strong>שם הבעלים:</strong> ${escapeHtml(ownerName)}</p>
                            <p><strong>טלפון:</strong> ${escapeHtml(payload.owner_phone) || '-'}</p>
                            <p><strong>אימייל:</strong> ${escapeHtml(payload.owner_email) || '-'}</p>
                            <p><strong>שם הכלב:</strong> ${escapeHtml(payload.dog_name) || '-'}</p>
                            <p><strong>גזע:</strong> ${escapeHtml(payload.dog_breed) || '-'}</p>
                            <p><strong>גיל:</strong> ${escapeHtml(payload.dog_age) || '-'}</p>
                            <p><strong>מין:</strong> ${escapeHtml(payload.dog_gender) || '-'}</p>
                            ${payload.training_goals ? `<p><strong>מטרות אימון:</strong><br/>${escapeHtml(payload.training_goals)}</p>` : ''}
                            <br/>
                            <a href="${Deno.env.get('APP_URL') ?? 'http://localhost:5173'}" style="background: #4A6741; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">כנס למערכת כדי לטפל</a>
                        </div>
                    </div>
                `,
                })
            }
        } catch (emailError) {
            console.error('[voice-intake] email failed (non-fatal):', emailError)
        }
    }

    return new Response(
        JSON.stringify({ success: true, intake_id: intakeId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
})
