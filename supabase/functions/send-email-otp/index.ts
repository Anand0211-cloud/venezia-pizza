// Supabase Edge Function: send-email-otp
// Deploy with: supabase functions deploy send-email-otp
// Secrets: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, SMTP_FROM_EMAIL

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildOtpEmailHtml(otpCode: string, recipientEmail: string): string {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>Ihr Bestätigungscode - Venezia Pizza Service</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
              
              <!-- Italian Tricolore Top Bar -->
              <tr>
                <td style="height: 6px; background: linear-gradient(to right, #008c45 33.3%, #ffffff 33.3%, #ffffff 66.6%, #cd212a 66.6%);"></td>
              </tr>

              <!-- Header -->
              <tr>
                <td style="background-color: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
                  <div style="font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #e30613; margin-bottom: 6px;">
                    PIZZERIA • PASTA • BURGER • DÖNER
                  </div>
                  <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                    Venezia Pizza Service
                  </h1>
                  <p style="margin: 6px 0 0; font-size: 13.5px; color: #94a3b8;">
                    Straßberger Str. 37 • 08527 Plauen • Tel. 03741 224488
                  </p>
                </td>
              </tr>

              <!-- Title & Greeting Banner -->
              <tr>
                <td style="padding: 28px 24px 16px; text-align: center;">
                  <div style="display: inline-block; background-color: #fee2e2; color: #dc2626; border-radius: 9999px; padding: 6px 16px; font-size: 12px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
                    🔐 Anmeldecode
                  </div>
                  <h2 style="margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #0f172a;">
                    Ihr persönlicher Bestätigungscode
                  </h2>
                  <p style="margin: 0 auto; max-width: 460px; font-size: 14.5px; color: #475569; line-height: 1.6;">
                    Geben Sie den folgenden 6-stelligen Sicherheitscode ein, um sich bei Ihrem Kundenkonto anzumelden oder Ihre Bestellung abzuschließen:
                  </p>
                </td>
              </tr>

              <!-- Prominent OTP Code Box (NO LINKS, ONLY THE CODE) -->
              <tr>
                <td style="padding: 8px 24px 20px;" align="center">
                  <div style="background-color: #fff1f2; border: 2px dashed #e11d48; border-radius: 16px; padding: 26px 20px; text-align: center; max-width: 400px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.08);">
                    <div style="font-size: 11px; font-weight: 800; color: #9f1239; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                      Einmaliger Bestätigungscode
                    </div>
                    <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #e11d48; font-family: 'Courier New', Courier, monospace; margin: 6px 0; padding-left: 12px;">
                      ${otpCode}
                    </div>
                    <div style="margin-top: 10px; font-size: 13px; color: #9f1239; font-weight: 700;">
                      ⏱️ Gültig für die nächsten 10 Minuten
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Instructions & Security Notice -->
              <tr>
                <td style="padding: 0 24px 24px;">
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px;">
                    <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                      Wichtige Sicherheitshinweise:
                    </div>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #64748b; line-height: 1.6;">
                      <li><strong>Kein Klick-Link:</strong> Zu Ihrer Sicherheit enthält diese Nachricht bewusst keine anklickbaren Anmeldelinks. Geben Sie die 6 Ziffern direkt im Shop-Eingabefeld ein.</li>
                      <li><strong>Vertraulich:</strong> Geben Sie diesen Code niemals an Dritte weiter. Unser Team wird Sie niemals nach Ihrem Code fragen.</li>
                      <li><strong>Nicht angefordert?</strong> Falls Sie diesen Code nicht angefordert haben, können Sie diese E-Mail einfach ignorieren.</li>
                    </ul>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #0f172a; padding: 24px; text-align: center; color: #94a3b8; font-size: 12.5px;">
                  <div style="font-weight: 700; color: #ffffff; font-size: 14px; margin-bottom: 6px;">
                    Pizzeria Venezia Pizza Service Plauen
                  </div>
                  <div>Inhaber: Familie Tageja • Straßberger Str. 37, 08527 Plauen</div>
                  <div style="margin-top: 4px;">Telefon: 03741 224488 / +49 157 76953457</div>
                  <div style="margin-top: 8px; color: #64748b; font-size: 11.5px;">
                    Diese E-Mail wurde automatisch zur sicheren Bestätigung für <strong>${recipientEmail}</strong> gesendet.
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    const cleanEmail = (email || "").toLowerCase().trim();

    if (!cleanEmail || !cleanEmail.includes("@") || cleanEmail.length < 5) {
      return new Response(
        JSON.stringify({ success: false, error: "Ungültige E-Mail-Adresse" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cleanEmail === "admin@veneziapizzas.de") {
      return new Response(
        JSON.stringify({ success: false, error: "Diese E-Mail ist für Administratoren reserviert." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const host = Deno.env.get("SMTP_HOST") || "smtp.stackmail.com";
    const port = Number(Deno.env.get("SMTP_PORT")) || 465;
    const user = Deno.env.get("SMTP_USER") || "info@veneziapizzas.de";
    const pass = Deno.env.get("SMTP_PASS") || "Project@1234%";
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "Venezia Pizza Service";
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || user;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Create simple HMAC token for stateless verification
    const secret = Deno.env.get("OTP_SECRET") || "venezia_pizza_secure_otp_token_key_2025";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${cleanEmail}:${otpCode}:${expiresAt}`)
    );
    const hashHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
    const token = `${expiresAt}.${hashHex}`;

    const html = buildOtpEmailHtml(otpCode, cleanEmail);

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: cleanEmail,
      subject: `Dein Venezia Pizza Anmeldecode: ${otpCode}`,
      html,
    });

    return new Response(
      JSON.stringify({
        success: true,
        email: cleanEmail,
        token,
        messageId: info.messageId,
        message: `Ein 6-stelliger Bestätigungscode wurde per E-Mail an ${cleanEmail} gesendet.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
