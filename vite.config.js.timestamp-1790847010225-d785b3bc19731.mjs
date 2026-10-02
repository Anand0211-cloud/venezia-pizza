// vite.config.js
import { defineConfig, loadEnv } from "file:///D:/VeneziaPIzza_Final/node_modules/vite/dist/node/index.js";
import react from "file:///D:/VeneziaPIzza_Final/node_modules/@vitejs/plugin-react/dist/index.js";

// server/emailPlugin.js
import nodemailer from "file:///D:/VeneziaPIzza_Final/node_modules/nodemailer/dist/esm/nodemailer.js";
import { createClient } from "file:///D:/VeneziaPIzza_Final/node_modules/@supabase/supabase-js/dist/index.mjs";
import fs from "fs";
import path from "path";
function loadLocalEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          const val = (match[2] || "").replace(/^["'](.*)["']$/, "$1").trim();
          if (!process.env[key] || process.env[key] === "") {
            process.env[key] = val;
          }
        }
      });
    }
  } catch (err) {
  }
}
async function getSmtpConfig() {
  loadLocalEnv();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: dbConfig } = await supabase.from("smtp_settings").select("*").eq("is_enabled", true).limit(1).maybeSingle();
      if (dbConfig && dbConfig.host && dbConfig.auth_user) {
        return {
          host: dbConfig.host,
          port: Number(dbConfig.port) || 465,
          secure: dbConfig.secure !== false,
          user: dbConfig.auth_user,
          pass: dbConfig.auth_password,
          fromName: dbConfig.sender_name || "Venezia Pizza Service",
          fromEmail: dbConfig.sender_email || dbConfig.auth_user
        };
      }
    } catch (e) {
    }
  }
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== "false",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: (process.env.SMTP_FROM_NAME || "Venezia Pizza Service").replace(/"/g, ""),
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
  };
}
function buildOrderHtmlEmail(order, type = "placed") {
  const isDelivered = type === "delivered";
  const isPickup = order.delivery_type === "pickup";
  const deliveryTypeLabel = isPickup ? "Selbstabholung im Restaurant" : "Lieferung an Adresse";
  const deliveryTimeEst = order.estimated_delivery_minutes || (isPickup ? 20 : 35);
  const items = order.order_items || [];
  const itemsHtml = items.map((item) => {
    const unitPrice = Number(item.unit_price || 0).toFixed(2).replace(".", ",");
    const totalPrice = Number(item.total_price || item.unit_price * item.quantity || 0).toFixed(2).replace(".", ",");
    const toppingsList = Array.isArray(item.toppings_selected) ? item.toppings_selected.join(", ") : item.toppings_selected || "";
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 8px; vertical-align: top;">
          <div style="font-weight: 700; color: #0f172a; font-size: 14.5px;">${item.item_name || "Gericht"}</div>
          ${item.selected_size ? `<div style="font-size: 12.5px; color: #64748b; margin-top: 2px;">Gr\xF6\xDFe: <b>${item.selected_size}</b></div>` : ""}
          ${item.is_american ? `<div style="font-size: 12px; color: #c026d3; font-weight: 600; margin-top: 2px;">\u2605 American Style K\xE4serand</div>` : ""}
          ${toppingsList ? `<div style="font-size: 12px; color: #059669; margin-top: 2px;">+ Extras: ${toppingsList}</div>` : ""}
          ${item.special_instructions ? `<div style="font-size: 12px; color: #d97706; font-style: italic; margin-top: 2px;">Hinweis: "${item.special_instructions}"</div>` : ""}
        </td>
        <td style="padding: 12px 8px; vertical-align: top; text-align: center; color: #334155; font-size: 14px; font-weight: 600;">
          ${item.quantity || 1}x
        </td>
        <td style="padding: 12px 8px; vertical-align: top; text-align: right; color: #0f172a; font-size: 14px; font-weight: 700; white-space: nowrap;">
          ${totalPrice} \u20AC
        </td>
      </tr>
    `;
  }).join("");
  const subtotal = Number(order.subtotal || 0).toFixed(2).replace(".", ",");
  const deliveryFee = Number(order.delivery_fee || 0).toFixed(2).replace(".", ",");
  const discount = Number(order.discount || 0).toFixed(2).replace(".", ",");
  const tip = Number(order.tip || 0).toFixed(2).replace(".", ",");
  const total = Number(order.total || 0).toFixed(2).replace(".", ",");
  let paymentLabel = "Barzahlung";
  if (order.payment_method === "paypal") paymentLabel = "PayPal";
  else if (order.payment_method === "stripe" || order.payment_method === "card") paymentLabel = "Kreditkarte / Online-Zahlung";
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>${isDelivered ? "Bestellung geliefert" : "Bestellbest\xE4tigung"} - Venezia Pizza Service</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
      
      <!-- Container -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
              
              <!-- Italian Tricolore Top Bar -->
              <tr>
                <td style="height: 6px; background: linear-gradient(to right, #008c45 33.3%, #ffffff 33.3%, #ffffff 66.6%, #cd212a 66.6%);"></td>
              </tr>

              <!-- Header -->
              <tr>
                <td style="background-color: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
                  <div style="font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #e30613; margin-bottom: 6px;">
                    PIZZERIA \u2022 PASTA \u2022 BURGER \u2022 D\xD6NER
                  </div>
                  <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                    Venezia Pizza Service
                  </h1>
                  <p style="margin: 6px 0 0; font-size: 13.5px; color: #94a3b8;">
                    Stra\xDFberger Str. 37 \u2022 08527 Plauen \u2022 Tel. 03741 224488
                  </p>
                </td>
              </tr>

              <!-- Order Status Banner -->
              <tr>
                <td style="padding: 24px 24px 18px; background-color: ${isDelivered ? "#f0fdf4" : "#ecfdf5"}; border-bottom: 1px solid ${isDelivered ? "#bbf7d0" : "#d1fae5"}; text-align: center;">
                  <div style="display: inline-block; background-color: ${isDelivered ? "#16a34a" : "#10b981"}; color: #ffffff; border-radius: 50%; width: 40px; height: 40px; line-height: 40px; font-size: 20px; margin-bottom: 8px;">
                    ${isDelivered ? "\u{1F355}" : "\u2713"}
                  </div>
                  <h2 style="margin: 0 0 6px; font-size: 20px; font-weight: 800; color: ${isDelivered ? "#14532d" : "#065f46"};">
                    ${isDelivered ? "Ihre Bestellung wurde erfolgreich geliefert!" : "Vielen Dank f\xFCr Ihre Bestellung!"}
                  </h2>
                  <p style="margin: 0; font-size: 14px; color: ${isDelivered ? "#166534" : "#047857"};">
                    ${isDelivered ? "Ihre Speisen wurden \xFCbergeben. Wir w\xFCnschen Ihnen einen guten Appetit und freuen uns auf das n\xE4chste Mal!" : "Ihre Bestellung wurde erfolgreich empfangen und wird jetzt in unserer K\xFCche frisch f\xFCr Sie zubereitet."}
                  </p>
                </td>
              </tr>

              <!-- Order Meta Cards -->
              <tr>
                <td style="padding: 24px 24px 12px;">
                  <table width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; width: 48%; vertical-align: top;">
                        <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Bestellnummer</div>
                        <div style="font-size: 18px; font-weight: 800; color: #e30613; margin-top: 4px;">#${order.order_number}</div>
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${new Date(order.created_at || Date.now()).toLocaleString("de-DE")}</div>
                      </td>
                      <td style="width: 4%;"></td>
                      <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; width: 48%; vertical-align: top;">
                        <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Status & Art</div>
                        <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${isDelivered ? "Geliefert (Abgeschlossen)" : deliveryTypeLabel}</div>
                        <div style="font-size: 12.5px; color: ${isDelivered ? "#16a34a" : "#10b981"}; font-weight: 700; margin-top: 4px;">
                          ${isDelivered ? "Erfolgreich zugestellt \u2713" : `Gesch\xE4tzte Dauer: ca. ${deliveryTimeEst} Min.`}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Delivery Address / Customer Info -->
              <tr>
                <td style="padding: 0 24px 16px;">
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
                      ${isPickup ? "Abholer-Informationen" : "Lieferadresse & Empf\xE4nger"}
                    </div>
                    <div style="font-weight: 700; color: #0f172a; font-size: 15px;">${order.customer_name || "Kunde"}</div>
                    ${!isPickup && order.street ? `<div style="font-size: 13.5px; color: #334155; margin-top: 2px;">${order.street}, ${order.zip_city || "08525 Plauen"}</div>` : ""}
                    ${order.customer_phone ? `<div style="font-size: 13px; color: #64748b; margin-top: 3px;">Telefon: <b>${order.customer_phone}</b></div>` : ""}
                  </div>
                </td>
              </tr>

              <!-- Items List -->
              <tr>
                <td style="padding: 0 24px 20px;">
                  <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #334155; letter-spacing: 0.5px; margin-bottom: 8px;">
                    Bestellte Gerichte
                  </div>
                  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f1f5f9; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                        <th style="padding: 10px 8px; text-align: left;">Gericht</th>
                        <th style="padding: 10px 8px; text-align: center;">Menge</th>
                        <th style="padding: 10px 8px; text-align: right;">Preis</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Totals Breakdown -->
              <tr>
                <td style="padding: 0 24px 24px;">
                  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
                    <tr>
                      <td style="font-size: 13.5px; color: #64748b; padding-bottom: 6px;">Zwischensumme:</td>
                      <td style="font-size: 13.5px; color: #0f172a; text-align: right; font-weight: 600; padding-bottom: 6px;">${subtotal} \u20AC</td>
                    </tr>
                    ${order.delivery_fee > 0 ? `
                    <tr>
                      <td style="font-size: 13.5px; color: #64748b; padding-bottom: 6px;">Lieferkosten:</td>
                      <td style="font-size: 13.5px; color: #0f172a; text-align: right; font-weight: 600; padding-bottom: 6px;">${deliveryFee} \u20AC</td>
                    </tr>` : `
                    <tr>
                      <td style="font-size: 13.5px; color: #64748b; padding-bottom: 6px;">Lieferung:</td>
                      <td style="font-size: 13.5px; color: #10b981; text-align: right; font-weight: 700; padding-bottom: 6px;">Kostenlos</td>
                    </tr>`}
                    <tr style="border-top: 2px solid #cbd5e1;">
                      <td style="font-size: 17px; font-weight: 900; color: #0f172a; padding-top: 10px;">Gesamtbetrag (inkl. MwSt.):</td>
                      <td style="font-size: 20px; font-weight: 900; color: #e30613; text-align: right; padding-top: 10px;">${total} \u20AC</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="font-size: 12.5px; color: #64748b; padding-top: 8px;">
                        Zahlungsart: <b>${paymentLabel}</b> (${order.payment_status === "paid" ? "Bezahlt \u2713" : "Bar bei \xDCbergabe"})
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #0f172a; padding: 24px; text-align: center; color: #94a3b8; font-size: 12.5px;">
                  <div style="font-weight: 700; color: #ffffff; font-size: 14px; margin-bottom: 6px;">
                    Pizzeria Venezia Pizza Service Plauen
                  </div>
                  <div>Inhaber: Familie Tageja \u2022 Stra\xDFberger Str. 37, 08527 Plauen</div>
                  <div style="margin-top: 4px;">Telefon: 03741 224488 / +49 157 76953457</div>
                  <div style="margin-top: 8px; color: #64748b; font-size: 11.5px;">
                    Diese E-Mail wurde automatisch zur Best\xE4tigung Ihrer Online-Bestellung generiert.
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
function emailPlugin() {
  return {
    name: "venezia-email-plugin",
    configureServer(server) {
      server.middlewares.use("/api/send-order-email", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body || "{}");
            const { order, recipientEmail, type = "placed" } = payload;
            const targetEmail = recipientEmail || order?.customer_email;
            if (!targetEmail) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "No recipient email provided" }));
              return;
            }
            if (!order || !order.order_number) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "No valid order provided" }));
              return;
            }
            const smtpConfig = await getSmtpConfig();
            const transporter = nodemailer.createTransport({
              host: smtpConfig.host,
              port: smtpConfig.port,
              secure: smtpConfig.secure,
              auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass
              },
              connectionTimeout: 1e4,
              greetingTimeout: 1e4
            });
            const htmlContent = buildOrderHtmlEmail(order, type);
            const isDelivered = type === "delivered";
            const subject = isDelivered ? `Ihre Bestellung #${order.order_number} wurde geliefert! - Venezia Pizza Service Plauen` : `Bestellbest\xE4tigung #${order.order_number} - Venezia Pizza Service Plauen`;
            const mailOptions = {
              from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
              to: targetEmail,
              subject,
              html: htmlContent
            };
            const info = await transporter.sendMail(mailOptions);
            console.log(`[SMTP] ${isDelivered ? "Delivery" : "Order"} email successfully sent to ${targetEmail} (ID: ${info.messageId})`);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: true,
              messageId: info.messageId,
              recipient: targetEmail,
              type
            }));
          } catch (err) {
            console.error("[SMTP] Error sending order email:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: false,
              error: err.message || "SMTP delivery failure"
            }));
          }
        });
      });
    }
  };
}

// server/sumupPlugin.js
import https from "https";
import fs2 from "fs";
import path2 from "path";
function loadLocalEnv2() {
  try {
    const envPath = path2.resolve(process.cwd(), ".env");
    if (fs2.existsSync(envPath)) {
      const content = fs2.readFileSync(envPath, "utf8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          const val = (match[2] || "").replace(/^["'](.*)["']$/, "$1").trim();
          if (!process.env[key] || process.env[key] === "") {
            process.env[key] = val;
          }
        }
      });
    }
  } catch (err) {
  }
}
function getSumUpCredentials() {
  loadLocalEnv2();
  const apiKey = process.env.SUMUP_API_KEY;
  const merchantCode = process.env.SUMUP_MERCHANT_CODE || "MVV82Y2M";
  const payToEmail = process.env.SUMUP_PAY_TO_EMAIL || "veneziapizza1999@gmail.com";
  const currency = process.env.SUMUP_CURRENCY || "EUR";
  return { apiKey, merchantCode, payToEmail, currency };
}
var sumupAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 6e4,
  maxSockets: 20
});
function sumupRequestOnce(method, path3, data = null) {
  const { apiKey } = getSumUpCredentials();
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: "api.sumup.com",
      port: 443,
      path: path3,
      method,
      agent: sumupAgent,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Connection": "keep-alive",
        ...postData ? { "Content-Length": Buffer.byteLength(postData) } : {}
      },
      timeout: 12e3
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            resolve({ statusCode: res.statusCode, error: parsed, data: parsed });
          }
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: body });
        }
      });
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("SumUp API connection timeout"));
    });
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}
async function sumupRequest(method, path3, data = null) {
  try {
    return await sumupRequestOnce(method, path3, data);
  } catch (err) {
    console.warn("[SumUp Plugin] Retrying request due to network notice:", err.message);
    try {
      await new Promise((r) => setTimeout(r, 400));
      return await sumupRequestOnce(method, path3, data);
    } catch (retryErr) {
      throw retryErr;
    }
  }
}
function sumupPlugin() {
  return {
    name: "venezia-sumup-plugin",
    configureServer(server) {
      server.middlewares.use("/api/sumup/merchant-info", async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        try {
          const { merchantCode, currency } = getSumUpCredentials();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            success: true,
            merchantCode,
            currency,
            companyName: "Venezia Pizza",
            city: "Plauen",
            isConfigured: true
          }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      server.middlewares.use("/api/sumup/create-checkout", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body || "{}");
            const { orderNumber, amount, customerEmail, description } = payload;
            if (!amount || Number(amount) <= 0) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Invalid or missing amount" }));
              return;
            }
            const { merchantCode, payToEmail, currency } = getSumUpCredentials();
            const refNumber = orderNumber || `VP-${Date.now().toString().slice(-6)}`;
            const checkoutReference = `VP-${refNumber}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            const checkoutPayload = {
              checkout_reference: checkoutReference,
              amount: Number(Number(amount).toFixed(2)),
              currency: currency || "EUR",
              pay_to_email: payToEmail,
              description: description || `Venezia Pizza Plauen - Bestellung #${refNumber}`,
              merchant_code: merchantCode,
              hosted_checkout: {
                enabled: true
              },
              redirect_url: payload.redirectUrl || "http://localhost:5173/?payment=success"
            };
            const result = await sumupRequest("POST", "/v0.1/checkouts", checkoutPayload);
            if (result.statusCode >= 200 && result.statusCode < 300 && result.data?.id) {
              console.log(`[SumUp API] Created checkout session ${result.data.id} for ${checkoutPayload.amount} EUR (Ref: ${checkoutReference})`);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({
                success: true,
                checkoutId: result.data.id,
                amount: result.data.amount,
                currency: result.data.currency,
                status: result.data.status,
                checkoutReference: result.data.checkout_reference,
                merchantCode: result.data.merchant_code,
                hostedCheckoutUrl: result.data.hosted_checkout_url
              }));
            } else {
              console.error("[SumUp API] Failed to create checkout:", result);
              res.statusCode = result.statusCode || 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({
                success: false,
                error: result.error?.message || result.data?.message || "SumUp checkout generation failed",
                details: result.data
              }));
            }
          } catch (err) {
            console.error("[SumUp API] Server exception:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
      server.middlewares.use("/api/sumup/checkout-status", async (req, res) => {
        const urlObj = new URL(req.url, "http://localhost");
        const checkoutId = urlObj.searchParams.get("id") || urlObj.pathname.split("/").pop();
        if (!checkoutId || checkoutId === "checkout-status") {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing checkout ID" }));
          return;
        }
        try {
          const result = await sumupRequest("GET", `/v0.1/checkouts/${checkoutId}`);
          res.statusCode = result.statusCode || 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            success: result.statusCode >= 200 && result.statusCode < 300,
            checkout: result.data
          }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }
  };
}

// vite.config.js
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);
  return {
    plugins: [react(), emailPlugin(), sumupPlugin()],
    server: {
      host: true,
      allowedHosts: "all"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic2VydmVyL2VtYWlsUGx1Z2luLmpzIiwgInNlcnZlci9zdW11cFBsdWdpbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXFZlbmV6aWFQSXp6YV9GaW5hbFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcVmVuZXppYVBJenphX0ZpbmFsXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9WZW5lemlhUEl6emFfRmluYWwvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHsgZW1haWxQbHVnaW4gfSBmcm9tICcuL3NlcnZlci9lbWFpbFBsdWdpbi5qcydcbmltcG9ydCB7IHN1bXVwUGx1Z2luIH0gZnJvbSAnLi9zZXJ2ZXIvc3VtdXBQbHVnaW4uanMnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuICBPYmplY3QuYXNzaWduKHByb2Nlc3MuZW52LCBlbnYpO1xuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW3JlYWN0KCksIGVtYWlsUGx1Z2luKCksIHN1bXVwUGx1Z2luKCldLFxuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogdHJ1ZSxcbiAgICAgIGFsbG93ZWRIb3N0czogJ2FsbCcsXG4gICAgfSxcbiAgfTtcbn0pO1xuXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXFZlbmV6aWFQSXp6YV9GaW5hbFxcXFxzZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFZlbmV6aWFQSXp6YV9GaW5hbFxcXFxzZXJ2ZXJcXFxcZW1haWxQbHVnaW4uanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1ZlbmV6aWFQSXp6YV9GaW5hbC9zZXJ2ZXIvZW1haWxQbHVnaW4uanNcIjtpbXBvcnQgbm9kZW1haWxlciBmcm9tICdub2RlbWFpbGVyJztcbmltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmZ1bmN0aW9uIGxvYWRMb2NhbEVudigpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBlbnZQYXRoID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICcuZW52Jyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnRlbnQuc3BsaXQoJ1xcbicpLmZvckVhY2gobGluZSA9PiB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gbGluZS5tYXRjaCgvXlxccyooW1xcdy4tXSspXFxzKj1cXHMqKC4qKT9cXHMqJC8pO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBjb25zdCBrZXkgPSBtYXRjaFsxXTtcbiAgICAgICAgICBjb25zdCB2YWwgPSAobWF0Y2hbMl0gfHwgJycpLnJlcGxhY2UoL15bXCInXSguKilbXCInXSQvLCAnJDEnKS50cmltKCk7XG4gICAgICAgICAgaWYgKCFwcm9jZXNzLmVudltrZXldIHx8IHByb2Nlc3MuZW52W2tleV0gPT09ICcnKSB7XG4gICAgICAgICAgICBwcm9jZXNzLmVudltrZXldID0gdmFsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBJZ25vcmUgZXJyb3JcbiAgfVxufVxuXG4vLyBSZXNvbHZlIFNNVFAgY29uZmlndXJhdGlvbiBkeW5hbWljYWxseSBmcm9tIFN1cGFiYXNlIERCIG9yIHNlcnZlciBlbnZpcm9ubWVudCAoLmVudilcbmFzeW5jIGZ1bmN0aW9uIGdldFNtdHBDb25maWcoKSB7XG4gIGxvYWRMb2NhbEVudigpO1xuICBjb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTDtcbiAgY29uc3Qgc3VwYWJhc2VLZXkgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfUFVCTElTSEFCTEVfS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZO1xuXG4gIGlmIChzdXBhYmFzZVVybCAmJiBzdXBhYmFzZUtleSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChzdXBhYmFzZVVybCwgc3VwYWJhc2VLZXkpO1xuICAgICAgY29uc3QgeyBkYXRhOiBkYkNvbmZpZyB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgICAgLmZyb20oJ3NtdHBfc2V0dGluZ3MnKVxuICAgICAgICAuc2VsZWN0KCcqJylcbiAgICAgICAgLmVxKCdpc19lbmFibGVkJywgdHJ1ZSlcbiAgICAgICAgLmxpbWl0KDEpXG4gICAgICAgIC5tYXliZVNpbmdsZSgpO1xuXG4gICAgICBpZiAoZGJDb25maWcgJiYgZGJDb25maWcuaG9zdCAmJiBkYkNvbmZpZy5hdXRoX3VzZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBob3N0OiBkYkNvbmZpZy5ob3N0LFxuICAgICAgICAgIHBvcnQ6IE51bWJlcihkYkNvbmZpZy5wb3J0KSB8fCA0NjUsXG4gICAgICAgICAgc2VjdXJlOiBkYkNvbmZpZy5zZWN1cmUgIT09IGZhbHNlLFxuICAgICAgICAgIHVzZXI6IGRiQ29uZmlnLmF1dGhfdXNlcixcbiAgICAgICAgICBwYXNzOiBkYkNvbmZpZy5hdXRoX3Bhc3N3b3JkLFxuICAgICAgICAgIGZyb21OYW1lOiBkYkNvbmZpZy5zZW5kZXJfbmFtZSB8fCAnVmVuZXppYSBQaXp6YSBTZXJ2aWNlJyxcbiAgICAgICAgICBmcm9tRW1haWw6IGRiQ29uZmlnLnNlbmRlcl9lbWFpbCB8fCBkYkNvbmZpZy5hdXRoX3VzZXJcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBGYWxsIHRocm91Z2ggdG8gc2VydmVyIGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgIH1cbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIHNlcnZlci1zaWRlIGVudmlyb25tZW50IHZhcmlhYmxlcyAoLmVudilcbiAgcmV0dXJuIHtcbiAgICBob3N0OiBwcm9jZXNzLmVudi5TTVRQX0hPU1QsXG4gICAgcG9ydDogTnVtYmVyKHByb2Nlc3MuZW52LlNNVFBfUE9SVCkgfHwgNDY1LFxuICAgIHNlY3VyZTogcHJvY2Vzcy5lbnYuU01UUF9TRUNVUkUgIT09ICdmYWxzZScsXG4gICAgdXNlcjogcHJvY2Vzcy5lbnYuU01UUF9VU0VSLFxuICAgIHBhc3M6IHByb2Nlc3MuZW52LlNNVFBfUEFTUyxcbiAgICBmcm9tTmFtZTogKHByb2Nlc3MuZW52LlNNVFBfRlJPTV9OQU1FIHx8ICdWZW5lemlhIFBpenphIFNlcnZpY2UnKS5yZXBsYWNlKC9cIi9nLCAnJyksXG4gICAgZnJvbUVtYWlsOiBwcm9jZXNzLmVudi5TTVRQX0ZST01fRU1BSUwgfHwgcHJvY2Vzcy5lbnYuU01UUF9VU0VSXG4gIH07XG59XG5cbi8vIEdlbmVyYXRlIHRoZSBiZWF1dGlmdWwgSFRNTCByZWNlaXB0IGVtYWlsXG5mdW5jdGlvbiBidWlsZE9yZGVySHRtbEVtYWlsKG9yZGVyLCB0eXBlID0gJ3BsYWNlZCcpIHtcbiAgY29uc3QgaXNEZWxpdmVyZWQgPSB0eXBlID09PSAnZGVsaXZlcmVkJztcbiAgY29uc3QgaXNQaWNrdXAgPSBvcmRlci5kZWxpdmVyeV90eXBlID09PSAncGlja3VwJztcbiAgY29uc3QgZGVsaXZlcnlUeXBlTGFiZWwgPSBpc1BpY2t1cCA/ICdTZWxic3RhYmhvbHVuZyBpbSBSZXN0YXVyYW50JyA6ICdMaWVmZXJ1bmcgYW4gQWRyZXNzZSc7XG4gIGNvbnN0IGRlbGl2ZXJ5VGltZUVzdCA9IG9yZGVyLmVzdGltYXRlZF9kZWxpdmVyeV9taW51dGVzIHx8IChpc1BpY2t1cCA/IDIwIDogMzUpO1xuICBjb25zdCBpdGVtcyA9IG9yZGVyLm9yZGVyX2l0ZW1zIHx8IFtdO1xuXG4gIGNvbnN0IGl0ZW1zSHRtbCA9IGl0ZW1zLm1hcCgoaXRlbSkgPT4ge1xuICAgIGNvbnN0IHVuaXRQcmljZSA9IE51bWJlcihpdGVtLnVuaXRfcHJpY2UgfHwgMCkudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcbiAgICBjb25zdCB0b3RhbFByaWNlID0gTnVtYmVyKGl0ZW0udG90YWxfcHJpY2UgfHwgKGl0ZW0udW5pdF9wcmljZSAqIGl0ZW0ucXVhbnRpdHkpIHx8IDApLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG4gICAgY29uc3QgdG9wcGluZ3NMaXN0ID0gQXJyYXkuaXNBcnJheShpdGVtLnRvcHBpbmdzX3NlbGVjdGVkKSA/IGl0ZW0udG9wcGluZ3Nfc2VsZWN0ZWQuam9pbignLCAnKSA6IChpdGVtLnRvcHBpbmdzX3NlbGVjdGVkIHx8ICcnKTtcblxuICAgIHJldHVybiBgXG4gICAgICA8dHIgc3R5bGU9XCJib3JkZXItYm90dG9tOiAxcHggc29saWQgI2YxZjVmOTtcIj5cbiAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMTJweCA4cHg7IHZlcnRpY2FsLWFsaWduOiB0b3A7XCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtd2VpZ2h0OiA3MDA7IGNvbG9yOiAjMGYxNzJhOyBmb250LXNpemU6IDE0LjVweDtcIj4ke2l0ZW0uaXRlbV9uYW1lIHx8ICdHZXJpY2h0J308L2Rpdj5cbiAgICAgICAgICAke2l0ZW0uc2VsZWN0ZWRfc2l6ZSA/IGA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxMi41cHg7IGNvbG9yOiAjNjQ3NDhiOyBtYXJnaW4tdG9wOiAycHg7XCI+R3JcdTAwRjZcdTAwREZlOiA8Yj4ke2l0ZW0uc2VsZWN0ZWRfc2l6ZX08L2I+PC9kaXY+YCA6ICcnfVxuICAgICAgICAgICR7aXRlbS5pc19hbWVyaWNhbiA/IGA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxMnB4OyBjb2xvcjogI2MwMjZkMzsgZm9udC13ZWlnaHQ6IDYwMDsgbWFyZ2luLXRvcDogMnB4O1wiPlx1MjYwNSBBbWVyaWNhbiBTdHlsZSBLXHUwMEU0c2VyYW5kPC9kaXY+YCA6ICcnfVxuICAgICAgICAgICR7dG9wcGluZ3NMaXN0ID8gYDxkaXYgc3R5bGU9XCJmb250LXNpemU6IDEycHg7IGNvbG9yOiAjMDU5NjY5OyBtYXJnaW4tdG9wOiAycHg7XCI+KyBFeHRyYXM6ICR7dG9wcGluZ3NMaXN0fTwvZGl2PmAgOiAnJ31cbiAgICAgICAgICAke2l0ZW0uc3BlY2lhbF9pbnN0cnVjdGlvbnMgPyBgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICNkOTc3MDY7IGZvbnQtc3R5bGU6IGl0YWxpYzsgbWFyZ2luLXRvcDogMnB4O1wiPkhpbndlaXM6IFwiJHtpdGVtLnNwZWNpYWxfaW5zdHJ1Y3Rpb25zfVwiPC9kaXY+YCA6ICcnfVxuICAgICAgICA8L3RkPlxuICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiAxMnB4IDhweDsgdmVydGljYWwtYWxpZ246IHRvcDsgdGV4dC1hbGlnbjogY2VudGVyOyBjb2xvcjogIzMzNDE1NTsgZm9udC1zaXplOiAxNHB4OyBmb250LXdlaWdodDogNjAwO1wiPlxuICAgICAgICAgICR7aXRlbS5xdWFudGl0eSB8fCAxfXhcbiAgICAgICAgPC90ZD5cbiAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMTJweCA4cHg7IHZlcnRpY2FsLWFsaWduOiB0b3A7IHRleHQtYWxpZ246IHJpZ2h0OyBjb2xvcjogIzBmMTcyYTsgZm9udC1zaXplOiAxNHB4OyBmb250LXdlaWdodDogNzAwOyB3aGl0ZS1zcGFjZTogbm93cmFwO1wiPlxuICAgICAgICAgICR7dG90YWxQcmljZX0gXHUyMEFDXG4gICAgICAgIDwvdGQ+XG4gICAgICA8L3RyPlxuICAgIGA7XG4gIH0pLmpvaW4oJycpO1xuXG4gIGNvbnN0IHN1YnRvdGFsID0gTnVtYmVyKG9yZGVyLnN1YnRvdGFsIHx8IDApLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG4gIGNvbnN0IGRlbGl2ZXJ5RmVlID0gTnVtYmVyKG9yZGVyLmRlbGl2ZXJ5X2ZlZSB8fCAwKS50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xuICBjb25zdCBkaXNjb3VudCA9IE51bWJlcihvcmRlci5kaXNjb3VudCB8fCAwKS50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xuICBjb25zdCB0aXAgPSBOdW1iZXIob3JkZXIudGlwIHx8IDApLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG4gIGNvbnN0IHRvdGFsID0gTnVtYmVyKG9yZGVyLnRvdGFsIHx8IDApLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG5cbiAgbGV0IHBheW1lbnRMYWJlbCA9ICdCYXJ6YWhsdW5nJztcbiAgaWYgKG9yZGVyLnBheW1lbnRfbWV0aG9kID09PSAncGF5cGFsJykgcGF5bWVudExhYmVsID0gJ1BheVBhbCc7XG4gIGVsc2UgaWYgKG9yZGVyLnBheW1lbnRfbWV0aG9kID09PSAnc3RyaXBlJyB8fCBvcmRlci5wYXltZW50X21ldGhvZCA9PT0gJ2NhcmQnKSBwYXltZW50TGFiZWwgPSAnS3JlZGl0a2FydGUgLyBPbmxpbmUtWmFobHVuZyc7XG5cbiAgcmV0dXJuIGBcbiAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICA8aHRtbCBsYW5nPVwiZGVcIj5cbiAgICA8aGVhZD5cbiAgICAgIDxtZXRhIGNoYXJzZXQ9XCJ1dGYtOFwiPlxuICAgICAgPHRpdGxlPiR7aXNEZWxpdmVyZWQgPyAnQmVzdGVsbHVuZyBnZWxpZWZlcnQnIDogJ0Jlc3RlbGxiZXN0XHUwMEU0dGlndW5nJ30gLSBWZW5lemlhIFBpenphIFNlcnZpY2U8L3RpdGxlPlxuICAgICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcIj5cbiAgICA8L2hlYWQ+XG4gICAgPGJvZHkgc3R5bGU9XCJtYXJnaW46IDA7IHBhZGRpbmc6IDA7IGJhY2tncm91bmQtY29sb3I6ICNmOGZhZmM7IGZvbnQtZmFtaWx5OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZjsgY29sb3I6ICMxZTI5M2I7IGxpbmUtaGVpZ2h0OiAxLjU7XCI+XG4gICAgICBcbiAgICAgIDwhLS0gQ29udGFpbmVyIC0tPlxuICAgICAgPHRhYmxlIHJvbGU9XCJwcmVzZW50YXRpb25cIiB3aWR0aD1cIjEwMCVcIiBjZWxsc3BhY2luZz1cIjBcIiBjZWxscGFkZGluZz1cIjBcIiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICNmOGZhZmM7IHBhZGRpbmc6IDI0cHggMTJweDtcIj5cbiAgICAgICAgPHRyPlxuICAgICAgICAgIDx0ZCBhbGlnbj1cImNlbnRlclwiPlxuICAgICAgICAgICAgPHRhYmxlIHJvbGU9XCJwcmVzZW50YXRpb25cIiB3aWR0aD1cIjEwMCVcIiBzdHlsZT1cIm1heC13aWR0aDogNjIwcHg7IGJhY2tncm91bmQtY29sb3I6ICNmZmZmZmY7IGJvcmRlci1yYWRpdXM6IDE4cHg7IG92ZXJmbG93OiBoaWRkZW47IGJveC1zaGFkb3c6IDAgMTBweCAzMHB4IHJnYmEoMCwgMCwgMCwgMC4wOCk7IGJvcmRlcjogMXB4IHNvbGlkICNlMmU4ZjA7XCI+XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICA8IS0tIEl0YWxpYW4gVHJpY29sb3JlIFRvcCBCYXIgLS0+XG4gICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJoZWlnaHQ6IDZweDsgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCAjMDA4YzQ1IDMzLjMlLCAjZmZmZmZmIDMzLjMlLCAjZmZmZmZmIDY2LjYlLCAjY2QyMTJhIDY2LjYlKTtcIj48L3RkPlxuICAgICAgICAgICAgICA8L3RyPlxuXG4gICAgICAgICAgICAgIDwhLS0gSGVhZGVyIC0tPlxuICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogIzBmMTcyYTsgcGFkZGluZzogMjhweCAyNHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGNvbG9yOiAjZmZmZmZmO1wiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMTNweDsgZm9udC13ZWlnaHQ6IDcwMDsgbGV0dGVyLXNwYWNpbmc6IDJweDsgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTsgY29sb3I6ICNlMzA2MTM7IG1hcmdpbi1ib3R0b206IDZweDtcIj5cbiAgICAgICAgICAgICAgICAgICAgUElaWkVSSUEgXHUyMDIyIFBBU1RBIFx1MjAyMiBCVVJHRVIgXHUyMDIyIERcdTAwRDZORVJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAwOyBmb250LXNpemU6IDI2cHg7IGZvbnQtd2VpZ2h0OiA5MDA7IGxldHRlci1zcGFjaW5nOiAtMC41cHg7IGNvbG9yOiAjZmZmZmZmO1wiPlxuICAgICAgICAgICAgICAgICAgICBWZW5lemlhIFBpenphIFNlcnZpY2VcbiAgICAgICAgICAgICAgICAgIDwvaDE+XG4gICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogNnB4IDAgMDsgZm9udC1zaXplOiAxMy41cHg7IGNvbG9yOiAjOTRhM2I4O1wiPlxuICAgICAgICAgICAgICAgICAgICBTdHJhXHUwMERGYmVyZ2VyIFN0ci4gMzcgXHUyMDIyIDA4NTI3IFBsYXVlbiBcdTIwMjIgVGVsLiAwMzc0MSAyMjQ0ODhcbiAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8L3RyPlxuXG4gICAgICAgICAgICAgIDwhLS0gT3JkZXIgU3RhdHVzIEJhbm5lciAtLT5cbiAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDI0cHggMjRweCAxOHB4OyBiYWNrZ3JvdW5kLWNvbG9yOiAke2lzRGVsaXZlcmVkID8gJyNmMGZkZjQnIDogJyNlY2ZkZjUnfTsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICR7aXNEZWxpdmVyZWQgPyAnI2JiZjdkMCcgOiAnI2QxZmFlNSd9OyB0ZXh0LWFsaWduOiBjZW50ZXI7XCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZGlzcGxheTogaW5saW5lLWJsb2NrOyBiYWNrZ3JvdW5kLWNvbG9yOiAke2lzRGVsaXZlcmVkID8gJyMxNmEzNGEnIDogJyMxMGI5ODEnfTsgY29sb3I6ICNmZmZmZmY7IGJvcmRlci1yYWRpdXM6IDUwJTsgd2lkdGg6IDQwcHg7IGhlaWdodDogNDBweDsgbGluZS1oZWlnaHQ6IDQwcHg7IGZvbnQtc2l6ZTogMjBweDsgbWFyZ2luLWJvdHRvbTogOHB4O1wiPlxuICAgICAgICAgICAgICAgICAgICAke2lzRGVsaXZlcmVkID8gJ1x1RDgzQ1x1REY1NScgOiAnXHUyNzEzJ31cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGgyIHN0eWxlPVwibWFyZ2luOiAwIDAgNnB4OyBmb250LXNpemU6IDIwcHg7IGZvbnQtd2VpZ2h0OiA4MDA7IGNvbG9yOiAke2lzRGVsaXZlcmVkID8gJyMxNDUzMmQnIDogJyMwNjVmNDYnfTtcIj5cbiAgICAgICAgICAgICAgICAgICAgJHtpc0RlbGl2ZXJlZCA/ICdJaHJlIEJlc3RlbGx1bmcgd3VyZGUgZXJmb2xncmVpY2ggZ2VsaWVmZXJ0IScgOiAnVmllbGVuIERhbmsgZlx1MDBGQ3IgSWhyZSBCZXN0ZWxsdW5nISd9XG4gICAgICAgICAgICAgICAgICA8L2gyPlxuICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDA7IGZvbnQtc2l6ZTogMTRweDsgY29sb3I6ICR7aXNEZWxpdmVyZWQgPyAnIzE2NjUzNCcgOiAnIzA0Nzg1Nyd9O1wiPlxuICAgICAgICAgICAgICAgICAgICAke2lzRGVsaXZlcmVkXG4gICAgICAgICAgICAgICAgICAgICAgPyAnSWhyZSBTcGVpc2VuIHd1cmRlbiBcdTAwRkNiZXJnZWJlbi4gV2lyIHdcdTAwRkNuc2NoZW4gSWhuZW4gZWluZW4gZ3V0ZW4gQXBwZXRpdCB1bmQgZnJldWVuIHVucyBhdWYgZGFzIG5cdTAwRTRjaHN0ZSBNYWwhJ1xuICAgICAgICAgICAgICAgICAgICAgIDogJ0locmUgQmVzdGVsbHVuZyB3dXJkZSBlcmZvbGdyZWljaCBlbXBmYW5nZW4gdW5kIHdpcmQgamV0enQgaW4gdW5zZXJlciBLXHUwMEZDY2hlIGZyaXNjaCBmXHUwMEZDciBTaWUgenViZXJlaXRldC4nfVxuICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgIDwvdHI+XG5cbiAgICAgICAgICAgICAgPCEtLSBPcmRlciBNZXRhIENhcmRzIC0tPlxuICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMjRweCAyNHB4IDEycHg7XCI+XG4gICAgICAgICAgICAgICAgICA8dGFibGUgd2lkdGg9XCIxMDAlXCIgY2VsbHNwYWNpbmc9XCIwXCIgY2VsbHBhZGRpbmc9XCIwXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAjZjhmYWZjOyBib3JkZXI6IDFweCBzb2xpZCAjZTJlOGYwOyBib3JkZXItcmFkaXVzOiAxMnB4OyBwYWRkaW5nOiAxNHB4IDE2cHg7IHdpZHRoOiA0OCU7IHZlcnRpY2FsLWFsaWduOiB0b3A7XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxMS41cHg7IGZvbnQtd2VpZ2h0OiA3MDA7IHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7IGNvbG9yOiAjNjQ3NDhiOyBsZXR0ZXItc3BhY2luZzogMC41cHg7XCI+QmVzdGVsbG51bW1lcjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMThweDsgZm9udC13ZWlnaHQ6IDgwMDsgY29sb3I6ICNlMzA2MTM7IG1hcmdpbi10b3A6IDRweDtcIj4jJHtvcmRlci5vcmRlcl9udW1iZXJ9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxMnB4OyBjb2xvcjogIzk0YTNiODsgbWFyZ2luLXRvcDogNHB4O1wiPiR7bmV3IERhdGUob3JkZXIuY3JlYXRlZF9hdCB8fCBEYXRlLm5vdygpKS50b0xvY2FsZVN0cmluZygnZGUtREUnKX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cIndpZHRoOiA0JTtcIj48L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICNmOGZhZmM7IGJvcmRlcjogMXB4IHNvbGlkICNlMmU4ZjA7IGJvcmRlci1yYWRpdXM6IDEycHg7IHBhZGRpbmc6IDE0cHggMTZweDsgd2lkdGg6IDQ4JTsgdmVydGljYWwtYWxpZ246IHRvcDtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJmb250LXNpemU6IDExLjVweDsgZm9udC13ZWlnaHQ6IDcwMDsgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTsgY29sb3I6ICM2NDc0OGI7IGxldHRlci1zcGFjaW5nOiAwLjVweDtcIj5TdGF0dXMgJiBBcnQ8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJmb250LXNpemU6IDE1cHg7IGZvbnQtd2VpZ2h0OiA4MDA7IGNvbG9yOiAjMGYxNzJhOyBtYXJnaW4tdG9wOiA0cHg7XCI+JHtpc0RlbGl2ZXJlZCA/ICdHZWxpZWZlcnQgKEFiZ2VzY2hsb3NzZW4pJyA6IGRlbGl2ZXJ5VHlwZUxhYmVsfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMTIuNXB4OyBjb2xvcjogJHtpc0RlbGl2ZXJlZCA/ICcjMTZhMzRhJyA6ICcjMTBiOTgxJ307IGZvbnQtd2VpZ2h0OiA3MDA7IG1hcmdpbi10b3A6IDRweDtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgJHtpc0RlbGl2ZXJlZCA/ICdFcmZvbGdyZWljaCB6dWdlc3RlbGx0IFx1MjcxMycgOiBgR2VzY2hcdTAwRTR0enRlIERhdWVyOiBjYS4gJHtkZWxpdmVyeVRpbWVFc3R9IE1pbi5gfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPC90cj5cblxuICAgICAgICAgICAgICA8IS0tIERlbGl2ZXJ5IEFkZHJlc3MgLyBDdXN0b21lciBJbmZvIC0tPlxuICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMCAyNHB4IDE2cHg7XCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogI2Y4ZmFmYzsgYm9yZGVyOiAxcHggc29saWQgI2UyZThmMDsgYm9yZGVyLXJhZGl1czogMTJweDsgcGFkZGluZzogMTRweCAxNnB4O1wiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxMnB4OyBmb250LXdlaWdodDogNzAwOyB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlOyBjb2xvcjogIzY0NzQ4YjsgbWFyZ2luLWJvdHRvbTogNnB4O1wiPlxuICAgICAgICAgICAgICAgICAgICAgICR7aXNQaWNrdXAgPyAnQWJob2xlci1JbmZvcm1hdGlvbmVuJyA6ICdMaWVmZXJhZHJlc3NlICYgRW1wZlx1MDBFNG5nZXInfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtd2VpZ2h0OiA3MDA7IGNvbG9yOiAjMGYxNzJhOyBmb250LXNpemU6IDE1cHg7XCI+JHtvcmRlci5jdXN0b21lcl9uYW1lIHx8ICdLdW5kZSd9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICR7IWlzUGlja3VwICYmIG9yZGVyLnN0cmVldCA/IGA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxMy41cHg7IGNvbG9yOiAjMzM0MTU1OyBtYXJnaW4tdG9wOiAycHg7XCI+JHtvcmRlci5zdHJlZXR9LCAke29yZGVyLnppcF9jaXR5IHx8ICcwODUyNSBQbGF1ZW4nfTwvZGl2PmAgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgJHtvcmRlci5jdXN0b21lcl9waG9uZSA/IGA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxM3B4OyBjb2xvcjogIzY0NzQ4YjsgbWFyZ2luLXRvcDogM3B4O1wiPlRlbGVmb246IDxiPiR7b3JkZXIuY3VzdG9tZXJfcGhvbmV9PC9iPjwvZGl2PmAgOiAnJ31cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgIDwvdHI+XG5cbiAgICAgICAgICAgICAgPCEtLSBJdGVtcyBMaXN0IC0tPlxuICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMCAyNHB4IDIwcHg7XCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1zaXplOiAxM3B4OyBmb250LXdlaWdodDogODAwOyB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlOyBjb2xvcjogIzMzNDE1NTsgbGV0dGVyLXNwYWNpbmc6IDAuNXB4OyBtYXJnaW4tYm90dG9tOiA4cHg7XCI+XG4gICAgICAgICAgICAgICAgICAgIEJlc3RlbGx0ZSBHZXJpY2h0ZVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8dGFibGUgd2lkdGg9XCIxMDAlXCIgY2VsbHNwYWNpbmc9XCIwXCIgY2VsbHBhZGRpbmc9XCIwXCIgc3R5bGU9XCJib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlOyBib3JkZXI6IDFweCBzb2xpZCAjZTJlOGYwOyBib3JkZXItcmFkaXVzOiAxMnB4OyBvdmVyZmxvdzogaGlkZGVuO1wiPlxuICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgPHRyIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogI2YxZjVmOTsgY29sb3I6ICM0NzU1Njk7IGZvbnQtc2l6ZTogMTJweDsgZm9udC13ZWlnaHQ6IDcwMDsgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cInBhZGRpbmc6IDEwcHggOHB4OyB0ZXh0LWFsaWduOiBsZWZ0O1wiPkdlcmljaHQ8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwicGFkZGluZzogMTBweCA4cHg7IHRleHQtYWxpZ246IGNlbnRlcjtcIj5NZW5nZTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJwYWRkaW5nOiAxMHB4IDhweDsgdGV4dC1hbGlnbjogcmlnaHQ7XCI+UHJlaXM8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAke2l0ZW1zSHRtbH1cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPC90cj5cblxuICAgICAgICAgICAgICA8IS0tIFRvdGFscyBCcmVha2Rvd24gLS0+XG4gICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiAwIDI0cHggMjRweDtcIj5cbiAgICAgICAgICAgICAgICAgIDx0YWJsZSB3aWR0aD1cIjEwMCVcIiBjZWxsc3BhY2luZz1cIjBcIiBjZWxscGFkZGluZz1cIjBcIiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICNmOGZhZmM7IGJvcmRlcjogMXB4IHNvbGlkICNlMmU4ZjA7IGJvcmRlci1yYWRpdXM6IDEycHg7IHBhZGRpbmc6IDE0cHggMTZweDtcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImZvbnQtc2l6ZTogMTMuNXB4OyBjb2xvcjogIzY0NzQ4YjsgcGFkZGluZy1ib3R0b206IDZweDtcIj5ad2lzY2hlbnN1bW1lOjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiZm9udC1zaXplOiAxMy41cHg7IGNvbG9yOiAjMGYxNzJhOyB0ZXh0LWFsaWduOiByaWdodDsgZm9udC13ZWlnaHQ6IDYwMDsgcGFkZGluZy1ib3R0b206IDZweDtcIj4ke3N1YnRvdGFsfSBcdTIwQUM8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAke29yZGVyLmRlbGl2ZXJ5X2ZlZSA+IDAgPyBgXG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJmb250LXNpemU6IDEzLjVweDsgY29sb3I6ICM2NDc0OGI7IHBhZGRpbmctYm90dG9tOiA2cHg7XCI+TGllZmVya29zdGVuOjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiZm9udC1zaXplOiAxMy41cHg7IGNvbG9yOiAjMGYxNzJhOyB0ZXh0LWFsaWduOiByaWdodDsgZm9udC13ZWlnaHQ6IDYwMDsgcGFkZGluZy1ib3R0b206IDZweDtcIj4ke2RlbGl2ZXJ5RmVlfSBcdTIwQUM8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8L3RyPmAgOiBgXG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJmb250LXNpemU6IDEzLjVweDsgY29sb3I6ICM2NDc0OGI7IHBhZGRpbmctYm90dG9tOiA2cHg7XCI+TGllZmVydW5nOjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiZm9udC1zaXplOiAxMy41cHg7IGNvbG9yOiAjMTBiOTgxOyB0ZXh0LWFsaWduOiByaWdodDsgZm9udC13ZWlnaHQ6IDcwMDsgcGFkZGluZy1ib3R0b206IDZweDtcIj5Lb3N0ZW5sb3M8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8L3RyPmB9XG4gICAgICAgICAgICAgICAgICAgIDx0ciBzdHlsZT1cImJvcmRlci10b3A6IDJweCBzb2xpZCAjY2JkNWUxO1wiPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImZvbnQtc2l6ZTogMTdweDsgZm9udC13ZWlnaHQ6IDkwMDsgY29sb3I6ICMwZjE3MmE7IHBhZGRpbmctdG9wOiAxMHB4O1wiPkdlc2FtdGJldHJhZyAoaW5rbC4gTXdTdC4pOjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiZm9udC1zaXplOiAyMHB4OyBmb250LXdlaWdodDogOTAwOyBjb2xvcjogI2UzMDYxMzsgdGV4dC1hbGlnbjogcmlnaHQ7IHBhZGRpbmctdG9wOiAxMHB4O1wiPiR7dG90YWx9IFx1MjBBQzwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIjJcIiBzdHlsZT1cImZvbnQtc2l6ZTogMTIuNXB4OyBjb2xvcjogIzY0NzQ4YjsgcGFkZGluZy10b3A6IDhweDtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFphaGx1bmdzYXJ0OiA8Yj4ke3BheW1lbnRMYWJlbH08L2I+ICgke29yZGVyLnBheW1lbnRfc3RhdHVzID09PSAncGFpZCcgPyAnQmV6YWhsdCBcdTI3MTMnIDogJ0JhciBiZWkgXHUwMERDYmVyZ2FiZSd9KVxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgIDwvdHI+XG5cbiAgICAgICAgICAgICAgPCEtLSBGb290ZXIgLS0+XG4gICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAjMGYxNzJhOyBwYWRkaW5nOiAyNHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGNvbG9yOiAjOTRhM2I4OyBmb250LXNpemU6IDEyLjVweDtcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJmb250LXdlaWdodDogNzAwOyBjb2xvcjogI2ZmZmZmZjsgZm9udC1zaXplOiAxNHB4OyBtYXJnaW4tYm90dG9tOiA2cHg7XCI+XG4gICAgICAgICAgICAgICAgICAgIFBpenplcmlhIFZlbmV6aWEgUGl6emEgU2VydmljZSBQbGF1ZW5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdj5JbmhhYmVyOiBGYW1pbGllIFRhZ2VqYSBcdTIwMjIgU3RyYVx1MDBERmJlcmdlciBTdHIuIDM3LCAwODUyNyBQbGF1ZW48L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJtYXJnaW4tdG9wOiA0cHg7XCI+VGVsZWZvbjogMDM3NDEgMjI0NDg4IC8gKzQ5IDE1NyA3Njk1MzQ1NzwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cIm1hcmdpbi10b3A6IDhweDsgY29sb3I6ICM2NDc0OGI7IGZvbnQtc2l6ZTogMTEuNXB4O1wiPlxuICAgICAgICAgICAgICAgICAgICBEaWVzZSBFLU1haWwgd3VyZGUgYXV0b21hdGlzY2ggenVyIEJlc3RcdTAwRTR0aWd1bmcgSWhyZXIgT25saW5lLUJlc3RlbGx1bmcgZ2VuZXJpZXJ0LlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPC90cj5cblxuICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICA8L3RkPlxuICAgICAgICA8L3RyPlxuICAgICAgPC90YWJsZT5cblxuICAgIDwvYm9keT5cbiAgICA8L2h0bWw+XG4gIGA7XG59XG5cbi8vIFZpdGUgQ29ubmVjdCBNaWRkbGV3YXJlIFBsdWdpbiAoUHVyZWx5IGhhbmRsZXMgcGxhY2VkIGFuZCBkZWxpdmVyZWQgb3JkZXIgZW1haWxzKVxuZXhwb3J0IGZ1bmN0aW9uIGVtYWlsUGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICd2ZW5lemlhLWVtYWlsLXBsdWdpbicsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9zZW5kLW9yZGVyLWVtYWlsJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNTtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBib2R5ID0gJyc7XG4gICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHsgYm9keSArPSBjaHVuazsgfSk7XG4gICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpO1xuICAgICAgICAgICAgY29uc3QgeyBvcmRlciwgcmVjaXBpZW50RW1haWwsIHR5cGUgPSAncGxhY2VkJyB9ID0gcGF5bG9hZDtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEVtYWlsID0gcmVjaXBpZW50RW1haWwgfHwgb3JkZXI/LmN1c3RvbWVyX2VtYWlsO1xuXG4gICAgICAgICAgICBpZiAoIXRhcmdldEVtYWlsKSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdObyByZWNpcGllbnQgZW1haWwgcHJvdmlkZWQnIH0pKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIW9yZGVyIHx8ICFvcmRlci5vcmRlcl9udW1iZXIpIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ05vIHZhbGlkIG9yZGVyIHByb3ZpZGVkJyB9KSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc210cENvbmZpZyA9IGF3YWl0IGdldFNtdHBDb25maWcoKTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zcG9ydGVyID0gbm9kZW1haWxlci5jcmVhdGVUcmFuc3BvcnQoe1xuICAgICAgICAgICAgICBob3N0OiBzbXRwQ29uZmlnLmhvc3QsXG4gICAgICAgICAgICAgIHBvcnQ6IHNtdHBDb25maWcucG9ydCxcbiAgICAgICAgICAgICAgc2VjdXJlOiBzbXRwQ29uZmlnLnNlY3VyZSxcbiAgICAgICAgICAgICAgYXV0aDoge1xuICAgICAgICAgICAgICAgIHVzZXI6IHNtdHBDb25maWcudXNlcixcbiAgICAgICAgICAgICAgICBwYXNzOiBzbXRwQ29uZmlnLnBhc3NcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY29ubmVjdGlvblRpbWVvdXQ6IDEwMDAwLFxuICAgICAgICAgICAgICBncmVldGluZ1RpbWVvdXQ6IDEwMDAwXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgaHRtbENvbnRlbnQgPSBidWlsZE9yZGVySHRtbEVtYWlsKG9yZGVyLCB0eXBlKTtcbiAgICAgICAgICAgIGNvbnN0IGlzRGVsaXZlcmVkID0gdHlwZSA9PT0gJ2RlbGl2ZXJlZCc7XG4gICAgICAgICAgICBjb25zdCBzdWJqZWN0ID0gaXNEZWxpdmVyZWRcbiAgICAgICAgICAgICAgPyBgSWhyZSBCZXN0ZWxsdW5nICMke29yZGVyLm9yZGVyX251bWJlcn0gd3VyZGUgZ2VsaWVmZXJ0ISAtIFZlbmV6aWEgUGl6emEgU2VydmljZSBQbGF1ZW5gXG4gICAgICAgICAgICAgIDogYEJlc3RlbGxiZXN0XHUwMEU0dGlndW5nICMke29yZGVyLm9yZGVyX251bWJlcn0gLSBWZW5lemlhIFBpenphIFNlcnZpY2UgUGxhdWVuYDtcblxuICAgICAgICAgICAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgIGZyb206IGBcIiR7c210cENvbmZpZy5mcm9tTmFtZX1cIiA8JHtzbXRwQ29uZmlnLmZyb21FbWFpbH0+YCxcbiAgICAgICAgICAgICAgdG86IHRhcmdldEVtYWlsLFxuICAgICAgICAgICAgICBzdWJqZWN0LFxuICAgICAgICAgICAgICBodG1sOiBodG1sQ29udGVudFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKG1haWxPcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbU01UUF0gJHtpc0RlbGl2ZXJlZCA/ICdEZWxpdmVyeScgOiAnT3JkZXInfSBlbWFpbCBzdWNjZXNzZnVsbHkgc2VudCB0byAke3RhcmdldEVtYWlsfSAoSUQ6ICR7aW5mby5tZXNzYWdlSWR9KWApO1xuXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgbWVzc2FnZUlkOiBpbmZvLm1lc3NhZ2VJZCxcbiAgICAgICAgICAgICAgcmVjaXBpZW50OiB0YXJnZXRFbWFpbCxcbiAgICAgICAgICAgICAgdHlwZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1NNVFBdIEVycm9yIHNlbmRpbmcgb3JkZXIgZW1haWw6JywgZXJyKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlIHx8ICdTTVRQIGRlbGl2ZXJ5IGZhaWx1cmUnXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcVmVuZXppYVBJenphX0ZpbmFsXFxcXHNlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcVmVuZXppYVBJenphX0ZpbmFsXFxcXHNlcnZlclxcXFxzdW11cFBsdWdpbi5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovVmVuZXppYVBJenphX0ZpbmFsL3NlcnZlci9zdW11cFBsdWdpbi5qc1wiOy8qKlxuICogU2VydmVyLVNpZGUgU3VtVXAgUGF5bWVudCBHYXRld2F5IEludGVncmF0aW9uIFBsdWdpbiBmb3IgVml0ZVxuICogVmVuZXppYSBQaXp6YSBTZXJ2aWNlLCBQbGF1ZW5cbiAqIFxuICogQWxsIEFQSSBjYWxscyB0byBhcGkuc3VtdXAuY29tIGFyZSBwcm9jZXNzZWQgU0VSVkVSLVNJREUuXG4gKiBTZWNyZXQga2V5cyBhcmUgbG9hZGVkIHN0cmljdGx5IGZyb20gc2VydmVyIGVudmlyb25tZW50IHZhcmlhYmxlcy5cbiAqL1xuXG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5mdW5jdGlvbiBsb2FkTG9jYWxFbnYoKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgZW52UGF0aCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnLmVudicpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKGVudlBhdGgpKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGVudlBhdGgsICd1dGY4Jyk7XG4gICAgICBjb250ZW50LnNwbGl0KCdcXG4nKS5mb3JFYWNoKGxpbmUgPT4ge1xuICAgICAgICBjb25zdCBtYXRjaCA9IGxpbmUubWF0Y2goL15cXHMqKFtcXHcuLV0rKVxccyo9XFxzKiguKik/XFxzKiQvKTtcbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0gbWF0Y2hbMV07XG4gICAgICAgICAgY29uc3QgdmFsID0gKG1hdGNoWzJdIHx8ICcnKS5yZXBsYWNlKC9eW1wiJ10oLiopW1wiJ10kLywgJyQxJykudHJpbSgpO1xuICAgICAgICAgIGlmICghcHJvY2Vzcy5lbnZba2V5XSB8fCBwcm9jZXNzLmVudltrZXldID09PSAnJykge1xuICAgICAgICAgICAgcHJvY2Vzcy5lbnZba2V5XSA9IHZhbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gSWdub3JlIGVycm9yXG4gIH1cbn1cblxuLy8gUmV0cmlldmUgcHJpdmF0ZSBzZXJ2ZXIgY3JlZGVudGlhbHMgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbmZ1bmN0aW9uIGdldFN1bVVwQ3JlZGVudGlhbHMoKSB7XG4gIGxvYWRMb2NhbEVudigpO1xuICBjb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5TVU1VUF9BUElfS0VZO1xuICBjb25zdCBtZXJjaGFudENvZGUgPSBwcm9jZXNzLmVudi5TVU1VUF9NRVJDSEFOVF9DT0RFIHx8ICdNVlY4MlkyTSc7XG4gIGNvbnN0IHBheVRvRW1haWwgPSBwcm9jZXNzLmVudi5TVU1VUF9QQVlfVE9fRU1BSUwgfHwgJ3ZlbmV6aWFwaXp6YTE5OTlAZ21haWwuY29tJztcbiAgY29uc3QgY3VycmVuY3kgPSBwcm9jZXNzLmVudi5TVU1VUF9DVVJSRU5DWSB8fCAnRVVSJztcblxuICByZXR1cm4geyBhcGlLZXksIG1lcmNoYW50Q29kZSwgcGF5VG9FbWFpbCwgY3VycmVuY3kgfTtcbn1cblxuY29uc3Qgc3VtdXBBZ2VudCA9IG5ldyBodHRwcy5BZ2VudCh7XG4gIGtlZXBBbGl2ZTogdHJ1ZSxcbiAga2VlcEFsaXZlTXNlY3M6IDYwMDAwLFxuICBtYXhTb2NrZXRzOiAyMFxufSk7XG5cbi8vIEhlbHBlciB0byBtYWtlIEhUVFBTIHJlcXVlc3RzIHRvIGFwaS5zdW11cC5jb20gd2l0aCBwZXJzaXN0ZW50IGNvbm5lY3Rpb25cbmZ1bmN0aW9uIHN1bXVwUmVxdWVzdE9uY2UobWV0aG9kLCBwYXRoLCBkYXRhID0gbnVsbCkge1xuICBjb25zdCB7IGFwaUtleSB9ID0gZ2V0U3VtVXBDcmVkZW50aWFscygpO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgcG9zdERhdGEgPSBkYXRhID8gSlNPTi5zdHJpbmdpZnkoZGF0YSkgOiBudWxsO1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIGhvc3RuYW1lOiAnYXBpLnN1bXVwLmNvbScsXG4gICAgICBwb3J0OiA0NDMsXG4gICAgICBwYXRoOiBwYXRoLFxuICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICBhZ2VudDogc3VtdXBBZ2VudCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7YXBpS2V5fWAsXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdDb25uZWN0aW9uJzogJ2tlZXAtYWxpdmUnLFxuICAgICAgICAuLi4ocG9zdERhdGEgPyB7ICdDb250ZW50LUxlbmd0aCc6IEJ1ZmZlci5ieXRlTGVuZ3RoKHBvc3REYXRhKSB9IDoge30pXG4gICAgICB9LFxuICAgICAgdGltZW91dDogMTIwMDBcbiAgICB9O1xuXG4gICAgY29uc3QgcmVxID0gaHR0cHMucmVxdWVzdChvcHRpb25zLCAocmVzKSA9PiB7XG4gICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgcmVzLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgICByZXMub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bms7IH0pO1xuICAgICAgcmVzLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gYm9keSA/IEpTT04ucGFyc2UoYm9keSkgOiB7fTtcbiAgICAgICAgICBpZiAocmVzLnN0YXR1c0NvZGUgPj0gMjAwICYmIHJlcy5zdGF0dXNDb2RlIDwgMzAwKSB7XG4gICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzQ29kZTogcmVzLnN0YXR1c0NvZGUsIGRhdGE6IHBhcnNlZCB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZSh7IHN0YXR1c0NvZGU6IHJlcy5zdGF0dXNDb2RlLCBlcnJvcjogcGFyc2VkLCBkYXRhOiBwYXJzZWQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgcmVzb2x2ZSh7IHN0YXR1c0NvZGU6IHJlcy5zdGF0dXNDb2RlLCByYXc6IGJvZHkgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVxLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAgIHJlamVjdChlcnIpO1xuICAgIH0pO1xuXG4gICAgcmVxLm9uKCd0aW1lb3V0JywgKCkgPT4ge1xuICAgICAgcmVxLmRlc3Ryb3koKTtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1N1bVVwIEFQSSBjb25uZWN0aW9uIHRpbWVvdXQnKSk7XG4gICAgfSk7XG5cbiAgICBpZiAocG9zdERhdGEpIHtcbiAgICAgIHJlcS53cml0ZShwb3N0RGF0YSk7XG4gICAgfVxuICAgIHJlcS5lbmQoKTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN1bXVwUmVxdWVzdChtZXRob2QsIHBhdGgsIGRhdGEgPSBudWxsKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IHN1bXVwUmVxdWVzdE9uY2UobWV0aG9kLCBwYXRoLCBkYXRhKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gUmV0cnkgb25jZSBvbiBzb2NrZXQgcmVzZXQgLyBuZXR3b3JrIGdsaXRjaFxuICAgIGNvbnNvbGUud2FybignW1N1bVVwIFBsdWdpbl0gUmV0cnlpbmcgcmVxdWVzdCBkdWUgdG8gbmV0d29yayBub3RpY2U6JywgZXJyLm1lc3NhZ2UpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgNDAwKSk7XG4gICAgICByZXR1cm4gYXdhaXQgc3VtdXBSZXF1ZXN0T25jZShtZXRob2QsIHBhdGgsIGRhdGEpO1xuICAgIH0gY2F0Y2ggKHJldHJ5RXJyKSB7XG4gICAgICB0aHJvdyByZXRyeUVycjtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN1bXVwUGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICd2ZW5lemlhLXN1bXVwLXBsdWdpbicsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgLy8gMS4gTWVyY2hhbnQgUHVibGljIEluZm8gKFNhZmUgdG8gc2hvdyBmcm9udGVuZDogbmFtZSwgY3VycmVuY3ksIG1lcmNoYW50IGNvZGUpXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3N1bXVwL21lcmNoYW50LWluZm8nLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdHRVQnKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDU7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHsgbWVyY2hhbnRDb2RlLCBjdXJyZW5jeSB9ID0gZ2V0U3VtVXBDcmVkZW50aWFscygpO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgbWVyY2hhbnRDb2RlLFxuICAgICAgICAgICAgY3VycmVuY3ksXG4gICAgICAgICAgICBjb21wYW55TmFtZTogJ1ZlbmV6aWEgUGl6emEnLFxuICAgICAgICAgICAgY2l0eTogJ1BsYXVlbicsXG4gICAgICAgICAgICBpc0NvbmZpZ3VyZWQ6IHRydWVcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gMi4gQ3JlYXRlIFN1bVVwIENoZWNrb3V0IFNlc3Npb25cbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvc3VtdXAvY3JlYXRlLWNoZWNrb3V0JywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNTtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBib2R5ID0gJyc7XG4gICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHsgYm9keSArPSBjaHVuazsgfSk7XG4gICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpO1xuICAgICAgICAgICAgY29uc3QgeyBvcmRlck51bWJlciwgYW1vdW50LCBjdXN0b21lckVtYWlsLCBkZXNjcmlwdGlvbiB9ID0gcGF5bG9hZDtcblxuICAgICAgICAgICAgaWYgKCFhbW91bnQgfHwgTnVtYmVyKGFtb3VudCkgPD0gMCkge1xuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW52YWxpZCBvciBtaXNzaW5nIGFtb3VudCcgfSkpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHsgbWVyY2hhbnRDb2RlLCBwYXlUb0VtYWlsLCBjdXJyZW5jeSB9ID0gZ2V0U3VtVXBDcmVkZW50aWFscygpO1xuICAgICAgICAgICAgY29uc3QgcmVmTnVtYmVyID0gb3JkZXJOdW1iZXIgfHwgYFZQLSR7RGF0ZS5ub3coKS50b1N0cmluZygpLnNsaWNlKC02KX1gO1xuICAgICAgICAgICAgY29uc3QgY2hlY2tvdXRSZWZlcmVuY2UgPSBgVlAtJHtyZWZOdW1iZXJ9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDcpLnRvVXBwZXJDYXNlKCl9YDtcblxuICAgICAgICAgICAgY29uc3QgY2hlY2tvdXRQYXlsb2FkID0ge1xuICAgICAgICAgICAgICBjaGVja291dF9yZWZlcmVuY2U6IGNoZWNrb3V0UmVmZXJlbmNlLFxuICAgICAgICAgICAgICBhbW91bnQ6IE51bWJlcihOdW1iZXIoYW1vdW50KS50b0ZpeGVkKDIpKSxcbiAgICAgICAgICAgICAgY3VycmVuY3k6IGN1cnJlbmN5IHx8ICdFVVInLFxuICAgICAgICAgICAgICBwYXlfdG9fZW1haWw6IHBheVRvRW1haWwsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB8fCBgVmVuZXppYSBQaXp6YSBQbGF1ZW4gLSBCZXN0ZWxsdW5nICMke3JlZk51bWJlcn1gLFxuICAgICAgICAgICAgICBtZXJjaGFudF9jb2RlOiBtZXJjaGFudENvZGUsXG4gICAgICAgICAgICAgIGhvc3RlZF9jaGVja291dDoge1xuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgcmVkaXJlY3RfdXJsOiBwYXlsb2FkLnJlZGlyZWN0VXJsIHx8ICdodHRwOi8vbG9jYWxob3N0OjUxNzMvP3BheW1lbnQ9c3VjY2VzcydcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHN1bXVwUmVxdWVzdCgnUE9TVCcsICcvdjAuMS9jaGVja291dHMnLCBjaGVja291dFBheWxvYWQpO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN0YXR1c0NvZGUgPj0gMjAwICYmIHJlc3VsdC5zdGF0dXNDb2RlIDwgMzAwICYmIHJlc3VsdC5kYXRhPy5pZCkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW1N1bVVwIEFQSV0gQ3JlYXRlZCBjaGVja291dCBzZXNzaW9uICR7cmVzdWx0LmRhdGEuaWR9IGZvciAke2NoZWNrb3V0UGF5bG9hZC5hbW91bnR9IEVVUiAoUmVmOiAke2NoZWNrb3V0UmVmZXJlbmNlfSlgKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgY2hlY2tvdXRJZDogcmVzdWx0LmRhdGEuaWQsXG4gICAgICAgICAgICAgICAgYW1vdW50OiByZXN1bHQuZGF0YS5hbW91bnQsXG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IHJlc3VsdC5kYXRhLmN1cnJlbmN5LFxuICAgICAgICAgICAgICAgIHN0YXR1czogcmVzdWx0LmRhdGEuc3RhdHVzLFxuICAgICAgICAgICAgICAgIGNoZWNrb3V0UmVmZXJlbmNlOiByZXN1bHQuZGF0YS5jaGVja291dF9yZWZlcmVuY2UsXG4gICAgICAgICAgICAgICAgbWVyY2hhbnRDb2RlOiByZXN1bHQuZGF0YS5tZXJjaGFudF9jb2RlLFxuICAgICAgICAgICAgICAgIGhvc3RlZENoZWNrb3V0VXJsOiByZXN1bHQuZGF0YS5ob3N0ZWRfY2hlY2tvdXRfdXJsXG4gICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tTdW1VcCBBUEldIEZhaWxlZCB0byBjcmVhdGUgY2hlY2tvdXQ6JywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSByZXN1bHQuc3RhdHVzQ29kZSB8fCA1MDA7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiByZXN1bHQuZXJyb3I/Lm1lc3NhZ2UgfHwgcmVzdWx0LmRhdGE/Lm1lc3NhZ2UgfHwgJ1N1bVVwIGNoZWNrb3V0IGdlbmVyYXRpb24gZmFpbGVkJyxcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiByZXN1bHQuZGF0YVxuICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbU3VtVXAgQVBJXSBTZXJ2ZXIgZXhjZXB0aW9uOicsIGVycik7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyAzLiBWZXJpZnkgU3VtVXAgQ2hlY2tvdXQgU3RhdHVzXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3N1bXVwL2NoZWNrb3V0LXN0YXR1cycsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHJlcS51cmwsICdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgIGNvbnN0IGNoZWNrb3V0SWQgPSB1cmxPYmouc2VhcmNoUGFyYW1zLmdldCgnaWQnKSB8fCB1cmxPYmoucGF0aG5hbWUuc3BsaXQoJy8nKS5wb3AoKTtcblxuICAgICAgICBpZiAoIWNoZWNrb3V0SWQgfHwgY2hlY2tvdXRJZCA9PT0gJ2NoZWNrb3V0LXN0YXR1cycpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01pc3NpbmcgY2hlY2tvdXQgSUQnIH0pKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHN1bXVwUmVxdWVzdCgnR0VUJywgYC92MC4xL2NoZWNrb3V0cy8ke2NoZWNrb3V0SWR9YCk7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSByZXN1bHQuc3RhdHVzQ29kZSB8fCAyMDA7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHJlc3VsdC5zdGF0dXNDb2RlID49IDIwMCAmJiByZXN1bHQuc3RhdHVzQ29kZSA8IDMwMCxcbiAgICAgICAgICAgIGNoZWNrb3V0OiByZXN1bHQuZGF0YVxuICAgICAgICAgIH0pKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVAsU0FBUyxjQUFjLGVBQWU7QUFDM1IsT0FBTyxXQUFXOzs7QUNEMFAsT0FBTyxnQkFBZ0I7QUFDblMsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBRWpCLFNBQVMsZUFBZTtBQUN0QixNQUFJO0FBQ0YsVUFBTSxVQUFVLEtBQUssUUFBUSxRQUFRLElBQUksR0FBRyxNQUFNO0FBQ2xELFFBQUksR0FBRyxXQUFXLE9BQU8sR0FBRztBQUMxQixZQUFNLFVBQVUsR0FBRyxhQUFhLFNBQVMsTUFBTTtBQUMvQyxjQUFRLE1BQU0sSUFBSSxFQUFFLFFBQVEsVUFBUTtBQUNsQyxjQUFNLFFBQVEsS0FBSyxNQUFNLCtCQUErQjtBQUN4RCxZQUFJLE9BQU87QUFDVCxnQkFBTSxNQUFNLE1BQU0sQ0FBQztBQUNuQixnQkFBTSxPQUFPLE1BQU0sQ0FBQyxLQUFLLElBQUksUUFBUSxrQkFBa0IsSUFBSSxFQUFFLEtBQUs7QUFDbEUsY0FBSSxDQUFDLFFBQVEsSUFBSSxHQUFHLEtBQUssUUFBUSxJQUFJLEdBQUcsTUFBTSxJQUFJO0FBQ2hELG9CQUFRLElBQUksR0FBRyxJQUFJO0FBQUEsVUFDckI7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0YsU0FBUyxLQUFLO0FBQUEsRUFFZDtBQUNGO0FBR0EsZUFBZSxnQkFBZ0I7QUFDN0IsZUFBYTtBQUNiLFFBQU0sY0FBYyxRQUFRLElBQUkscUJBQXFCLFFBQVEsSUFBSTtBQUNqRSxRQUFNLGNBQWMsUUFBUSxJQUFJLDBCQUEwQixRQUFR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QUFrQjtBQUNoRCxnQkFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLFNBQVMsT0FBTyxPQUFPLElBQUksUUFBUSxDQUFDLENBQUM7QUFBQSxVQUNoRTtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0gsQ0FBQztBQUdELGFBQU8sWUFBWSxJQUFJLDhCQUE4QixPQUFPLEtBQUssUUFBUTtBQUN2RSxjQUFNLFNBQVMsSUFBSSxJQUFJLElBQUksS0FBSyxrQkFBa0I7QUFDbEQsY0FBTSxhQUFhLE9BQU8sYUFBYSxJQUFJLElBQUksS0FBSyxPQUFPLFNBQVMsTUFBTSxHQUFHLEVBQUUsSUFBSTtBQUVuRixZQUFJLENBQUMsY0FBYyxlQUFlLG1CQUFtQjtBQUNuRCxjQUFJLGFBQWE7QUFDakIsY0FBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsY0FBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8sc0JBQXNCLENBQUMsQ0FBQztBQUN4RDtBQUFBLFFBQ0Y7QUFFQSxZQUFJO0FBQ0YsZ0JBQU0sU0FBUyxNQUFNLGFBQWEsT0FBTyxtQkFBbUIsVUFBVSxFQUFFO0FBQ3hFLGNBQUksYUFBYSxPQUFPLGNBQWM7QUFDdEMsY0FBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsY0FBSSxJQUFJLEtBQUssVUFBVTtBQUFBLFlBQ3JCLFNBQVMsT0FBTyxjQUFjLE9BQU8sT0FBTyxhQUFhO0FBQUEsWUFDekQsVUFBVSxPQUFPO0FBQUEsVUFDbkIsQ0FBQyxDQUFDO0FBQUEsUUFDSixTQUFTLEtBQUs7QUFDWixjQUFJLGFBQWE7QUFDakIsY0FBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsY0FBSSxJQUFJLEtBQUssVUFBVSxFQUFFLFNBQVMsT0FBTyxPQUFPLElBQUksUUFBUSxDQUFDLENBQUM7QUFBQSxRQUNoRTtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQ0Y7OztBRjFQQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFDM0MsU0FBTyxPQUFPLFFBQVEsS0FBSyxHQUFHO0FBRTlCLFNBQU87QUFBQSxJQUNMLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxHQUFHLFlBQVksQ0FBQztBQUFBLElBQy9DLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLGNBQWM7QUFBQSxJQUNoQjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJmcyIsICJwYXRoIiwgImxvYWRMb2NhbEVudiIsICJwYXRoIiwgImZzIl0KfQo=
