// Supabase Edge Function: send-order-email
// Deploy with: supabase functions deploy send-order-email
// Set secrets in Supabase:
// supabase secrets set SMTP_HOST=... SMTP_PORT=465 SMTP_USER=... SMTP_PASS=...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order, recipientEmail } = await req.json();
    const targetEmail = recipientEmail || order?.customer_email;

    if (!targetEmail || !order) {
      return new Response(
        JSON.stringify({ error: "Missing order or recipient email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const host = Deno.env.get("SMTP_HOST");
    const port = Number(Deno.env.get("SMTP_PORT")) || 465;
    const user = Deno.env.get("SMTP_USER");
    const pass = Deno.env.get("SMTP_PASS");
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "Venezia Pizza Service";
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || user;

    if (!host || !user || !pass) {
      return new Response(
        JSON.stringify({ error: "SMTP configuration is incomplete in Supabase secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: targetEmail,
      subject: `Bestellbestätigung #${order.order_number} - Venezia Pizza Service Plauen`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #e30613;">🍕 Vielen Dank für Ihre Bestellung bei Venezia Pizza!</h2>
          <p>Bestellnummer: <b>#${order.order_number}</b></p>
          <p>Gesamtbetrag: <b>${Number(order.total || 0).toFixed(2).replace('.', ',')} €</b></p>
          <p>Lieferart: <b>${order.delivery_type === 'pickup' ? 'Selbstabholung' : 'Lieferung'}</b></p>
          <p>Ihre Speisen werden jetzt frisch zubereitet.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <small style="color: #64748b;">Venezia Pizza Service • Straßberger Str. 37, 08527 Plauen • Tel. 03741 224488</small>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
