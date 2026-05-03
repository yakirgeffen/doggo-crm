import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@3.2.0"

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
//   - if email doesn't exist → inserts (subscribed) AND sends a welcome email via Resend
//
// CAPTCHA: not enforced here — frontend uses minimal honeypot. If we see
// abuse, add Turnstile validation similar to process-intake.
// Welcome email is best-effort: a Resend failure does NOT roll back the
// subscription (the row in the DB is the source of truth).
// ============================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

function renderWelcomeEmail(): string {
    return [
        '<!doctype html>',
        '<html dir="rtl" lang="he"><head><meta charset="utf-8"><title>ברוכים הבאים</title></head>',
        '<body style="font-family:-apple-system,system-ui,sans-serif;background:#FAF9F7;color:#2C2A26;padding:40px 20px;max-width:560px;margin:0 auto;direction:rtl;">',
        '<div style="background:white;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">',
        '<div style="font-size:32px;margin-bottom:12px;">🐾</div>',
        '<h1 style="font-size:24px;font-weight:800;margin:0 0 8px;color:#2C2A26;">ברוכים הבאים ל-Doggo CRM</h1>',
        '<p style="font-size:15px;line-height:1.6;color:#5C5852;margin:0 0 16px;">תודה על ההרשמה! מדי שבוע נשלח טיפ אחד שימושי על ניהול עסק אילוף — מחירון, שיווק, לקוחות, או תהליכים. בלי ספאם.</p>',
        '<p style="font-size:15px;line-height:1.6;color:#5C5852;margin:0 0 24px;">הטיפ הראשון יגיע ביום ראשון הקרוב.</p>',
        '<div style="border-top:1px solid #E8E4DC;padding-top:20px;margin-top:24px;">',
        '<p style="font-size:13px;color:#8C8780;margin:0 0 8px;">בינתיים — כמה דברים שעשויים לעניין אתכם:</p>',
        '<ul style="font-size:13px;color:#5C5852;padding-right:20px;margin:0;">',
        '<li style="margin-bottom:6px;"><a href="https://doggocrm.app/free/cost-calculator" style="color:#4A6741;text-decoration:underline;">מחשבון מחירון לאילוף</a> — חישוב כמה לקחת לשעה</li>',
        '<li style="margin-bottom:6px;"><a href="https://doggocrm.app/blog" style="color:#4A6741;text-decoration:underline;">הבלוג</a> — 10 פוסטים על ניהול עסק אילוף</li>',
        '<li><a href="https://doggocrm.app/" style="color:#4A6741;text-decoration:underline;">Doggo CRM</a> — מערכת לניהול לקוחות, תוכניות, וחשבוניות</li>',
        '</ul></div></div>',
        '<p style="font-size:11px;color:#8C8780;text-align:center;margin:16px 0 0;">האימייל הזה הגיע כי הייתה הרשמה ב-doggocrm.app. לא רוצים לקבל יותר? אפשר פשוט לענות "להסיר" וננתק את הרשימה ידנית.</p>',
        '</body></html>',
    ].join('')
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

        // Best-effort welcome email — failures are logged but don't roll back the subscription.
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (resendKey) {
            try {
                const resend = new Resend(resendKey)
                const html = renderWelcomeEmail()
                await resend.emails.send({
                    from: 'Doggo CRM <notifications@resend.dev>',
                    to: rawEmail,
                    subject: 'ברוכים הבאים ל-Doggo CRM 🐾',
                    html,
                })
            } catch (mailErr) {
                console.error('Welcome email failed (non-fatal):', mailErr instanceof Error ? mailErr.message : mailErr)
            }
        }

        return new Response(JSON.stringify({ success: true, status: 'subscribed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
