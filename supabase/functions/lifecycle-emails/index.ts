import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@3.2.0"

// ============================================================
// Lifecycle emails edge function — invoked by pg_cron daily.
// Iterates auth.users and fires the appropriate lifecycle email
// per (user_id, template) condition, writing to email_send_log to
// prevent duplicates.
//
// Five templates:
//  - welcome (T+0): first time we see the user
//  - setup_nudge (T+1+): signup >=1 day ago AND checklist <60%
//  - first_client (T+3+): signup >=3 days ago AND 0 clients
//  - tip_trick (T+7+): signup >=7 days ago AND >=1 client
//  - check_in (T+14+): signup >=14 days ago
//
// Auth: verify_jwt=false. Idempotent via email_send_log
// unique index (user_id, email_template) where session_id is null.
// ============================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const escapeHtml = (s: unknown) => {
    if (s === null || s === undefined) return ''
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

interface TrainerState {
    user_id: string
    email: string
    full_name: string | null
    days_since_signup: number
    business_name: string | null
    trainer_handle: string | null
    services_count: number
    clients_count: number
    is_billing_connected: boolean
}

// APP_URL prefers env so staging deploys link to staging origin and the
// custom-domain cutover doesn't require a function redeploy. Fallback to
// the production custom-domain if the env is unset (preserves the prior
// hardcoded behavior). Matches the env-driven pattern already used in
// `process-intake/index.ts` and `voice-intake/index.ts`. Surfaced via CPMO
// content review 2026-05-05 PM (geffen-studio:projects/doggo-crm/cpmo-
// reviews/2026-05-05-pm-content-review-welcomepage-lifecycle.md §Section 2).
const APP_URL = Deno.env.get('APP_URL') ?? 'https://doggocrm.app'

function emailShell(titleHe: string, bodyInnerHtml: string, iconEmoji: string, ctaUrl?: string, ctaLabel?: string): string {
    const cta = ctaUrl && ctaLabel
        ? `<div style="margin-top:24px;text-align:center;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#4A6741;color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;">${escapeHtml(ctaLabel)}</a></div>`
        : ''
    return `<div dir="rtl" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px;background:#f7f4ed;max-width:560px;margin:0 auto;"><div style="background:white;padding:24px;border-radius:16px;box-shadow:0 2px 6px rgba(0,0,0,0.05);"><div style="font-size:32px;margin-bottom:8px;">${iconEmoji}</div><h2 style="color:#4A6741;margin:0 0 16px;">${titleHe}</h2>${bodyInnerHtml}${cta}<p style="color:#999;font-size:11px;text-align:center;margin-top:24px;border-top:1px solid #eee;padding-top:12px;">Doggo CRM 🐾 · ${escapeHtml(APP_URL)}</p></div></div>`
}

const TEMPLATES: Record<string, (t: TrainerState) => { subject: string; html: string }> = {
    welcome: (t) => ({
        subject: '🐾 ברוכ/ה הבא/ה ל-Doggo CRM',
        html: emailShell(
            'נעים להכיר! 🐾',
            `<p style="color:#444;line-height:1.7;">שלום${t.full_name ? ` ${escapeHtml(t.full_name.split(' ')[0])}` : ''},<br/><br/>שמחים לראותך כאן. Doggo CRM נועד לקחת ממך את העומס האדמיניסטרטיבי — לקוחות, מפגשים, חשבוניות — כדי שתישאר/י עם הראש באימון עצמו.</p><p style="color:#444;line-height:1.7;">כדי להפיק מהמערכת את המקסימום, יש כמה הגדרות בסיסיות שכדאי לסיים:</p><ol style="color:#444;line-height:1.7;padding-right:20px;"><li>בחר/י כתובת חנות אישית</li><li>הגדר/י שם עסק ופרופיל ציבורי</li><li>הוסף/י את השירותים שלך לקטלוג</li><li>חבר/י Sumit (סאמיט) או Morning (חשבונית ירוקה)</li></ol><p style="color:#444;line-height:1.7;">אם יש שאלות, פשוט השב/י למייל הזה.</p>`,
            '🐾',
            APP_URL,
            'השלם/י את ההתקנה →'
        ),
    }),
    setup_nudge: (t) => ({
        subject: '🚀 עוד צעד ואת/ה מוכנ/ה להתחיל',
        html: emailShell(
            'בואו נסיים את ההתקנה',
            `<p style="color:#444;line-height:1.7;">שלום${t.full_name ? ` ${escapeHtml(t.full_name.split(' ')[0])}` : ''},<br/><br/>בדקתי את החשבון שלך — נראה שעוד לא סיימת את ההתקנה. כמה דקות עכשיו והמערכת ערוכה לעבודה אמיתית.</p><p style="color:#444;line-height:1.7;">${!t.business_name ? 'עוד לא הגדרת שם עסק. ' : ''}${!t.trainer_handle ? 'עוד לא בחרת כתובת חנות. ' : ''}${t.services_count === 0 ? 'עוד לא הוספת שירותים לקטלוג. ' : ''}${!t.is_billing_connected ? 'עוד לא חיברת Sumit (סאמיט) או Morning (חשבונית ירוקה).' : ''}</p>`,
            '🚀',
            APP_URL,
            'סיים/י את ההתקנה →'
        ),
    }),
    first_client: (t) => ({
        subject: '🐕 לקוח ראשון? בוא/י נעשה את זה ביחד',
        html: emailShell(
            'הזמן להוסיף לקוח ראשון',
            `<p style="color:#444;line-height:1.7;">שלום${t.full_name ? ` ${escapeHtml(t.full_name.split(' ')[0])}` : ''},<br/><br/>אם זה היום הראשון שלך עם Doggo CRM, ההמלצה שלנו: התחל/י עם לקוח אחד. ייקח לך פחות מ-5 דקות להוסיף את הפרטים, ולראות איך המערכת עובדת בפועל.</p><p style="color:#444;line-height:1.7;">פעם שיש לך לקוח אחד במערכת, הקסם מתחיל — תוכניות, מפגשים, סנכרון יומן, הצעות מחיר — הכל זורם משם.</p>`,
            '🐕',
            `${APP_URL}/clients/new`,
            'הוסף/י לקוח ראשון →'
        ),
    }),
    tip_trick: (t) => ({
        subject: '💡 שלושה קיצורי דרך שמאלפים מגלים בשבוע השני',
        html: emailShell(
            'שלושה פיצ׳רים שיחסכו לך זמן',
            `<p style="color:#444;line-height:1.7;">שלום${t.full_name ? ` ${escapeHtml(t.full_name.split(' ')[0])}` : ''},<br/><br/>רואים שאת/ה כבר בפנים — איזה כיף!</p><p style="color:#444;line-height:1.7;">הנה שלושת הפיצ׳רים שמאלפים מגלים בשבוע השני:</p><ul style="color:#444;line-height:1.7;padding-right:20px;"><li><strong>קביעת מפגש מהיומן הראשי</strong> — לחיצה אחת על שעה ריקה, מודאל מוכן עם הלקוח/תוכנית.</li><li><strong>הצעת מחיר במהירות</strong> — מכרטיס לקוח, "הצעת מחיר", בוחר/ת שירותים מהקטלוג, שולח/ת. Sumit מטפל בכל השאר.</li><li><strong>סנכרון אוטומטי ליומן</strong> — כל מפגש יופיע ביומן Google שלך מיידית. תזכורות אוטומטיות ללקוח 24 שעות לפני.</li></ul>`,
            '💡',
            APP_URL,
            'היכנס/י לחשבון →'
        ),
    }),
    check_in: (t) => ({
        subject: 'איך הולך לך עם Doggo CRM?',
        html: emailShell(
            'שבועיים אחרי — איך זה?',
            `<p style="color:#444;line-height:1.7;">שלום${t.full_name ? ` ${escapeHtml(t.full_name.split(' ')[0])}` : ''},<br/><br/>שבועיים אחרי שהצטרפת ל-Doggo CRM — כיף לראות אותך פה.</p><p style="color:#444;line-height:1.7;">רציתי פשוט לבדוק: איך זה עובר לך עד עכשיו? מה זורם טוב מול הלקוחות והכלבים, ומה היית רוצה שיעבוד אחרת?</p><p style="color:#444;line-height:1.7;">השב/י למייל הזה — אני קורא/ת כל תגובה ומגיב/ה אישית. גם הערה קטנה שעולה באמצע יום אימונים על משהו שלא מסתדר עוזרת לחדד את הכלי בדיוק עבור מאלפי כלבים בישראל.</p><p style="color:#444;line-height:1.7;">תודה,<br/>Doggo CRM 🐶</p>`,
            '💌'
        ),
    }),
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

        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (!resendKey) {
            return new Response(JSON.stringify({ success: false, error: 'Resend not configured' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
            })
        }
        const resend = new Resend(resendKey)

        // Pull all auth.users (cap 500)
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 })
        const users = usersList?.users || []

        // Pull all already-sent lifecycle rows in one shot
        const { data: sentRows } = await supabaseAdmin
            .from('email_send_log')
            .select('user_id, email_template')
            .is('session_id', null)
            .in('email_template', Object.keys(TEMPLATES))

        const sentSet = new Set((sentRows || []).map(r => `${r.user_id}|${r.email_template}`))
        const now = Date.now()

        const stats: { sent: number; skipped: number; per_template: Record<string, number>; errors: string[] } = {
            sent: 0, skipped: 0, per_template: {}, errors: [],
        }

        for (const user of users) {
            try {
                if (!user.email) { stats.skipped++; continue }
                const signupAt = new Date(user.created_at).getTime()
                const days = Math.floor((now - signupAt) / (24 * 60 * 60 * 1000))

                // Aggregate trainer state once
                const [settingsRes, servicesRes, clientsRes, vaultRes] = await Promise.all([
                    supabaseAdmin.from('user_settings').select('business_name, trainer_handle').eq('user_id', user.id).maybeSingle(),
                    supabaseAdmin.from('services').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
                    supabaseAdmin.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
                    // After iter 130 (composite PK on vault), a trainer may have one row per vendor (sumit, morning).
                    // Explicit `.in('service_name', ...)` keeps semantics — the .some(r => r.is_connected) check below
                    // wants ANY vendor connected, regardless of which one. Per QA Avner first-session follow-up #2.
                    supabaseAdmin.from('sys_integrations_vault').select('is_connected').eq('user_id', user.id).in('service_name', ['morning', 'sumit']),
                ])

                const trainer: TrainerState = {
                    user_id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
                    days_since_signup: days,
                    business_name: settingsRes.data?.business_name ?? null,
                    trainer_handle: settingsRes.data?.trainer_handle ?? null,
                    services_count: servicesRes.count ?? 0,
                    clients_count: clientsRes.count ?? 0,
                    is_billing_connected: (vaultRes.data || []).some(r => r.is_connected),
                }

                // Setup completeness ratio (0-1)
                const setupItems = [trainer.business_name, trainer.trainer_handle, trainer.services_count > 0, trainer.is_billing_connected, trainer.clients_count > 0]
                const setupRatio = setupItems.filter(Boolean).length / setupItems.length

                const templatesToSend: string[] = []
                if (!sentSet.has(`${user.id}|welcome`)) templatesToSend.push('welcome')
                if (days >= 1 && setupRatio < 0.6 && !sentSet.has(`${user.id}|setup_nudge`)) templatesToSend.push('setup_nudge')
                if (days >= 3 && trainer.clients_count === 0 && !sentSet.has(`${user.id}|first_client`)) templatesToSend.push('first_client')
                if (days >= 7 && trainer.clients_count >= 1 && !sentSet.has(`${user.id}|tip_trick`)) templatesToSend.push('tip_trick')
                if (days >= 14 && !sentSet.has(`${user.id}|check_in`)) templatesToSend.push('check_in')

                for (const tmpl of templatesToSend) {
                    const fn = TEMPLATES[tmpl]
                    if (!fn) continue
                    const { subject, html } = fn(trainer)
                    await resend.emails.send({
                        from: 'Doggo CRM <notifications@resend.dev>',
                        // CTO 2026-05-05 PM (CPMO content review §Section 3 #3 routing):
                        // welcome + check_in templates explicitly invite replies
                        // ("השב/י למייל הזה", "אני קורא/ת כל תגובה ומגיב/ה אישית").
                        // Without reply_to, replies route to notifications@resend.dev
                        // (unmonitored), making the promise false-on-delivery.
                        // Default to the studio-brand inbox per
                        // geffen-studio:tools/studio-accounts.md L47. Long-term:
                        // verified-sender domain + dedicated forwarder inbox is
                        // Yakir-actionable per studio-accounts.md L89-90.
                        // REPLY_TO_INBOX env override lets ops swap without redeploy.
                        replyTo: Deno.env.get('REPLY_TO_INBOX') ?? 'geffenstudio@proton.me',
                        to: trainer.email,
                        subject,
                        html,
                    })
                    await supabaseAdmin.from('email_send_log').insert({
                        user_id: user.id,
                        client_email: trainer.email,
                        email_template: tmpl,
                    })
                    stats.sent++
                    stats.per_template[tmpl] = (stats.per_template[tmpl] || 0) + 1
                }
            } catch (err) {
                stats.errors.push(`user ${user.id}: ${err instanceof Error ? err.message : String(err)}`)
            }
        }

        return new Response(JSON.stringify({ success: true, ...stats, users_scanned: users.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ success: false, error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
        })
    }
})
