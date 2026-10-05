import nodemailer from 'nodemailer';
import crypto from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET || 'venezia_pizza_secure_otp_token_key_2025';

function createOtpToken(email, code, expiresAt) {
  const hash = crypto.createHmac('sha256', OTP_SECRET).update(`${email.toLowerCase()}:${code}:${expiresAt}`).digest('hex');
  return `${expiresAt}.${hash}`;
}

function buildOtpEmailHtml(otpCode, recipientEmail) {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>Ihr Bestätigungscode - Venezia Pizza Service</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
      
      <!-- Container -->
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    const cleanEmail = (payload.email || '').toLowerCase().trim();

    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      return res.status(400).json({ success: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' });
    }

    if (cleanEmail === 'admin@veneziapizzas.de') {
      return res.status(403).json({
        success: false,
        error: 'Diese E-Mail ist für Administratoren reserviert. Bitte nutzen Sie das Admin-Portal.'
      });
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE !== 'false';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromName = (process.env.SMTP_FROM_NAME || 'Venezia Pizza Service').replace(/"/g, '');
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    if (!host || !user || !pass) {
      return res.status(500).json({ success: false, error: 'SMTP-Server ist noch nicht vollständig eingerichtet.' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const token = createOtpToken(cleanEmail, otpCode, expiresAt);

    const html = buildOtpEmailHtml(otpCode, cleanEmail);

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: cleanEmail,
      subject: `Dein Venezia Pizza Anmeldecode: ${otpCode}`,
      html
    });

    return res.status(200).json({
      success: true,
      email: cleanEmail,
      token,
      message: `Ein 6-stelliger Bestätigungscode wurde per E-Mail an ${cleanEmail} gesendet.`
    });
  } catch (err) {
    console.error('Error sending OTP email:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Bestätigungscode konnte nicht gesendet werden.'
    });
  }
}
