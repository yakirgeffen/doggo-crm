import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@3.2.0"

// ============================================================
// Scheduled reminders edge function — invoked by pg_cron daily.
// Scans sessions due in [now, now+25h] that have no reminder_24h
// row in email_send_log, sends Hebrew RTL reminder via Resend per
// session, inserts email_send_log row to prevent duplicates.
//
// Auth model: verify_jwt = false (cron has no JWT). The function is
// idempotent + caps at 100 sessions per invocation, so even if the
// URL is triggered externally, the worst case is reminders fire
// slightly earlier than scheduled (each fires exactly once due to
// the email_send_log unique constraint on session_id+template).
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
    return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatHebrewTime(d: Date): string {
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

interface SessionRow {
    id: string
    session_date: string
    user_id: string
    program_id: string
    programs: {
        program_name: string
        clients: {
            full_name: string
            email: string | null
            primary_dog_name: string | null
        } | null
    } | null
}

// @ts-expect-error Deno std import
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const now = new Date()
        const horizon = new Date(now.getTime() + 25 * 60 * 60 * 1000)

        // Pull sessions due in [now, now+25h]
        const { data: sessions, error: sessionsError } = await supabaseAdmin
            .from('sessions')
            .select(`id, session_date, user_id, program_id, programs:program_id ( program_name, clients:client_id ( full_name, email, primary_dog_name ) )`)
            .gte('session_date', now.toISOString())
            .lte('session_date', horizon.toISOString())
            .limit(100)

        if (sessionsError) throw new Error(`Sessions query failed: ${sessionsError.message}`)

        const candidates = (sessions || []) as unknown as SessionRow[]

        // Filter: skip sessions already reminded
        const sessionIds = candidates.map(s => s.id)
        const { data: alreadySent } = await supabaseAdmin
            .from('email_send_log')
            .select('session_id')
            .eq('email_template', 'reminder_24h')
            .in('session_id', sessionIds.length ? sessionIds : ['00000000-0000-0000-0000-000000000000'])

        const sentSet = new Set((alreadySent || []).map(r => r.session_id))
        const due = candidates.filter(s => !sentSet.has(s.id))

        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (!resendKey) {
            return new Response(JSON.stringify({ success: false, error: 'Resend not configured', candidates: candidates.length, due: due.length }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }
        const resend = new Resend(resendKey)

        let sentCount = 0
        let skippedCount = 0
        const errors: string[] = []

        for (const session of due) {
            try {
                const program = session.programs
                const client = program?.clients
                if (!client?.email) { skippedCount++; continue }

                // Trainer business name (best-effort)
                const { data: settings } = await supabaseAdmin
                    .from('user_settings')
                    .select('business_name')
                    .eq('user_id', session.user_id)
                    .maybeSingle()
                const { data: trainer } = await supabaseAdmin.auth.admin.getUserById(session.user_id)
                const trainerEmail = trainer?.user?.email ?? null
                const businessName = settings?.business_name || trainer?.user?.user_metadata?.full_name || 'המאלף שלך'

                const sessionDate = new Date(session.session_date)
                const dateLabel = formatHebrewDate(sessionDate)
                const timeLabel = formatHebrewTime(sessionDate)

                const subject = `🐾 תזכורת: פגישה מחר עם ${escapeHtml(client.primary_dog_name || client.full_name)}`
                const html = `<div dir="rtl" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px;background:#f7f4ed;max-width:560px;margin:0 auto;"><div style="background:white;padding:24px;border-radius:16px;box-shadow:0 2px 6px rgba(0,0,0,0.05);"><div style="font-size:32px;margin-bottom:8px;">⏰</div><h2 style="color:#4A6741;margin:0 0 16px;">תזכורת לפגישה</h2><p style="color:#444;line-height:1.7;">שלום ${escapeHtml(client.full_name)},<br/><br/>רק תזכורת קצרה — מחר יש לנו פגישה.</p><div style="background:#f3f4f0;padding:16px;border-radius:12px;margin:20px 0;"><p style="margin:0 0 6px;color:#666;font-size:13px;">תאריך</p><p style="margin:0 0 12px;font-weight:bold;font-size:16px;">${escapeHtml(dateLabel)}</p><p style="margin:0 0 6px;color:#666;font-size:13px;">שעה</p><p style="margin:0;font-weight:bold;font-size:16px;">${escapeHtml(timeLabel)}</p></div><p style="color:#444;line-height:1.7;">נתראה ב-${escapeHtml(timeLabel)}!</p><p style="color:#444;line-height:1.7;margin-top:24px;"><strong>${escapeHtml(businessName)}</strong></p></div></div>`

                await resend.emails.send({
                    from: 'Doggo CRM <notifications@resend.dev>',
                    replyTo: trainerEmail || undefined,
                    to: client.email,
                    subject,
                    html,
                })

                await supabaseAdmin
                    .from('email_send_log')
                    .insert({
                        session_id: session.id,
                        user_id: session.user_id,
                        client_email: client.email,
                        email_template: 'reminder_24h',
                    })

                sentCount++
            } catch (err) {
                errors.push(`session ${session.id}: ${err instanceof Error ? err.message : String(err)}`)
            }
        }

        return new Response(JSON.stringify({
            success: true,
            candidates: candidates.length,
            due: due.length,
            sent: sentCount,
            skipped: skippedCount,
            errors,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ success: false, error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
