import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@3.2.0"

// ============================================================
// Session emails edge function — booking confirmations + reminders
// to the trainer's clients. Authenticated trainer invokes; the
// function looks up the session + client + trainer via service
// role and sends Hebrew RTL email via Resend.
//
// Architectural fit (per strategic-synthesis trainer-only decision):
//   Client doesn't have a login; communication is outbound. This
//   function is the email channel.
//
// Actions:
//   - send_booking_confirmation: triggered after BookSessionModal
//     or NewSessionPage successfully inserts a session.
//   - send_reminder: triggered by future cron / scheduled job
//     (G6 partial — not yet wired; the action is here for forward
//     compat).
// ============================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const escapeHtml = (s: unknown) => {
    if (s === null || s === undefined) return ''
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function formatHebrewDate(d: Date): string {
    return d.toLocaleDateString('he-IL', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
}

function formatHebrewTime(d: Date): string {
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

// @ts-expect-error — Deno std import resolves at edge-function deploy time, not in local TypeScript
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { action, session_id } = await req.json()
        if (!session_id) throw new Error('Missing session_id')

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Fetch session + program + client in one chain
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select(`
                id, session_date, session_notes, user_id, program_id,
                programs:program_id (
                    program_name,
                    clients:client_id ( full_name, email, primary_dog_name )
                )
            `)
            .eq('id', session_id)
            .single()

        if (sessionError || !session) throw new Error('Session not found')

        // RLS-equivalent ownership check — session.user_id must match the authed user
        if (session.user_id !== user.id) throw new Error('Not authorized for this session')

        // The select query returns programs as an object via PostgREST, but
        // the inferred TS type can be array; normalize defensively.
        type ProgramShape = {
            program_name: string;
            clients: { full_name: string; email: string | null; primary_dog_name: string | null } | { full_name: string; email: string | null; primary_dog_name: string | null }[];
        };
        const program: ProgramShape | undefined = Array.isArray(session.programs)
            ? session.programs[0]
            : session.programs
        if (!program) throw new Error('Program not found for session')

        const client = Array.isArray(program.clients) ? program.clients[0] : program.clients
        if (!client?.email) {
            // No client email — silently succeed (cannot send what we don't have)
            return new Response(JSON.stringify({ success: true, skipped: 'client has no email' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Fetch trainer info for the From: header
        const { data: trainer } = await supabaseAdmin.auth.admin.getUserById(user.id)
        const trainerEmail = trainer?.user?.email ?? null
        const { data: settings } = await supabaseAdmin
            .from('user_settings')
            .select('business_name')
            .eq('user_id', user.id)
            .maybeSingle()
        const trainerBusinessName = settings?.business_name || trainer?.user?.user_metadata?.full_name || 'המאלף שלך'

        const sessionDate = new Date(session.session_date)
        const sessionDateLabel = formatHebrewDate(sessionDate)
        const sessionTimeLabel = formatHebrewTime(sessionDate)

        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (!resendKey) {
            return new Response(JSON.stringify({ success: false, error: 'Resend not configured' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }
        const resend = new Resend(resendKey)

        if (action === 'send_booking_confirmation') {
            const subject = `🐾 אישור פגישה: ${escapeHtml(client.primary_dog_name || client.full_name)} ב-${sessionDateLabel}`
            const html = `
                <div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #f7f4ed; max-width: 560px; margin: 0 auto;">
                    <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
                        <div style="font-size: 32px; margin-bottom: 8px;">🐾</div>
                        <h2 style="color: #4A6741; margin: 0 0 16px;">הפגישה נקבעה!</h2>
                        <p style="color: #444; line-height: 1.7;">
                            שלום ${escapeHtml(client.full_name)},<br/><br/>
                            הפגישה עבור <strong>${escapeHtml(client.primary_dog_name || 'הכלב')}</strong> נקבעה.
                        </p>
                        <div style="background: #f3f4f0; padding: 16px; border-radius: 12px; margin: 20px 0;">
                            <p style="margin: 0 0 6px; color: #666; font-size: 13px;">תאריך</p>
                            <p style="margin: 0 0 12px; font-weight: bold; font-size: 16px;">${escapeHtml(sessionDateLabel)}</p>
                            <p style="margin: 0 0 6px; color: #666; font-size: 13px;">שעה</p>
                            <p style="margin: 0 0 12px; font-weight: bold; font-size: 16px;">${escapeHtml(sessionTimeLabel)}</p>
                            <p style="margin: 0 0 6px; color: #666; font-size: 13px;">תוכנית</p>
                            <p style="margin: 0; font-weight: bold; font-size: 16px;">${escapeHtml(program.program_name)}</p>
                        </div>
                        <p style="color: #444; line-height: 1.7;">
                            אם יש שאלות או צריכים לדחות, פשוט השיבו למייל הזה ואני אחזור אליכם.
                        </p>
                        <p style="color: #444; line-height: 1.7; margin-top: 24px;">
                            נתראה בקרוב 🐶<br/>
                            <strong>${escapeHtml(trainerBusinessName)}</strong>
                        </p>
                    </div>
                    <p style="text-align: center; color: #999; font-size: 11px; margin-top: 16px;">
                        נשלח באמצעות Doggo CRM
                    </p>
                </div>
            `

            await resend.emails.send({
                from: 'Doggo CRM <notifications@resend.dev>', // Verified-domain pending P1-3
                replyTo: trainerEmail || undefined,
                to: client.email,
                subject,
                html,
            })

            return new Response(JSON.stringify({ success: true, sent_to: client.email }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (action === 'send_reminder') {
            // G6 partial — manually-triggered reminder for now. Future cron-driven
            // surface picks up sessions due in 24h and invokes this action per-row.
            const subject = `🐾 תזכורת: פגישה מחר עם ${escapeHtml(client.primary_dog_name || client.full_name)}`
            const html = `
                <div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #f7f4ed; max-width: 560px; margin: 0 auto;">
                    <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
                        <div style="font-size: 32px; margin-bottom: 8px;">⏰</div>
                        <h2 style="color: #4A6741; margin: 0 0 16px;">תזכורת לפגישה</h2>
                        <p style="color: #444; line-height: 1.7;">
                            שלום ${escapeHtml(client.full_name)},<br/><br/>
                            רק תזכורת קצרה — מחר יש לנו פגישה.
                        </p>
                        <div style="background: #f3f4f0; padding: 16px; border-radius: 12px; margin: 20px 0;">
                            <p style="margin: 0 0 6px; color: #666; font-size: 13px;">תאריך</p>
                            <p style="margin: 0 0 12px; font-weight: bold; font-size: 16px;">${escapeHtml(sessionDateLabel)}</p>
                            <p style="margin: 0 0 6px; color: #666; font-size: 13px;">שעה</p>
                            <p style="margin: 0; font-weight: bold; font-size: 16px;">${escapeHtml(sessionTimeLabel)}</p>
                        </div>
                        <p style="color: #444; line-height: 1.7;">
                            נתראה ב-${escapeHtml(sessionTimeLabel)}!
                        </p>
                        <p style="color: #444; line-height: 1.7; margin-top: 24px;">
                            <strong>${escapeHtml(trainerBusinessName)}</strong>
                        </p>
                    </div>
                </div>
            `

            await resend.emails.send({
                from: 'Doggo CRM <notifications@resend.dev>',
                replyTo: trainerEmail || undefined,
                to: client.email,
                subject,
                html,
            })

            return new Response(JSON.stringify({ success: true, sent_to: client.email }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error(`Unknown action: ${action}`)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ success: false, error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
