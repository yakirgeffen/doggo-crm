import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@3.2.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const {
            trainer_id,
            full_name,
            phone,
            dog_name,
            dog_breed,
            dog_age,
            notes,
            selected_service_id,
            captcha_token
        } = await req.json()

        // 1. Verify Captcha
        const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
        if (turnstileSecret) {
            const ip = req.headers.get('cf-connecting-ip')
            const formData = new FormData()
            formData.append('secret', turnstileSecret)
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
        }

        // 2. Insert into DB via Service Role (Bypassing RLS)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error: insertError } = await supabaseClient
            .from('intake_submissions')
            .insert({
                trainer_id,
                full_name,
                phone,
                dog_name,
                dog_breed,
                dog_age,
                notes,
                selected_service_id, // Can be null
                status: 'new',
                captcha_token // Store for audit if needed
            })

        if (insertError) {
            console.error('Insert Error:', insertError)
            throw new Error('Failed to save submission')
        }

        // 3. Send Email Notification
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (resendKey) {
            try {
                const resend = new Resend(resendKey)

                // Fetch trainer email
                const { data: trainer, error: userError } = await supabaseClient.auth.admin.getUserById(trainer_id)

                if (!userError && trainer?.user?.email) {
                    await resend.emails.send({
                        from: 'Doggo CRM <notifications@resend.dev>', // Should be a verified domain in prod
                        to: trainer.user.email,
                        subject: `🐶 ליד חדש: ${full_name}`,
                        html: `
                        <div dir="rtl" style="font-family: sans-serif; padding: 20px; background: #f9fafb;">
                            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                                <h2 style="color: #15803d; margin-top: 0;">ליד חדש התקבל!</h2>
                                <p><strong>שם:</strong> ${full_name}</p>
                                <p><strong>טלפון:</strong> ${phone || '-'}</p>
                                <p><strong>שם הכלב:</strong> ${dog_name || '-'}</p>
                                ${notes ? `<p><strong>הערות:</strong><br/>${notes}</p>` : ''}
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

    } catch (error: any) {
        console.error('Function Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
