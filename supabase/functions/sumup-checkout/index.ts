// Supabase Edge Function: sumup-checkout
// Deploy with: supabase functions deploy sumup-checkout
// Set secrets in Supabase:
// supabase secrets set SUMUP_API_KEY=... SUMUP_MERCHANT_CODE=MVV82Y2M SUMUP_PAY_TO_EMAIL=...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("SUMUP_API_KEY");
  const merchantCode = Deno.env.get("SUMUP_MERCHANT_CODE") || "MVV82Y2M";
  const payToEmail = Deno.env.get("SUMUP_PAY_TO_EMAIL");

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "SUMUP_API_KEY secret is not set in Supabase" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "create";

    if (action === "merchant-info") {
      return new Response(
        JSON.stringify({
          success: true,
          merchantCode,
          currency: "EUR",
          companyName: "Venezia Pizza",
          city: "Plauen"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "status") {
      const checkoutId = url.searchParams.get("id");
      if (!checkoutId) {
        return new Response(
          JSON.stringify({ error: "Missing checkout id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: res.ok, checkout: data }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Default action: Create Checkout
    const { orderNumber, amount, customerEmail, description } = await req.json();

    if (!amount || Number(amount) <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const refNumber = orderNumber || `VP-${Date.now().toString().slice(-6)}`;
    const checkoutReference = `VP-${refNumber}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const sumupRes = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        checkout_reference: checkoutReference,
        amount: Number(Number(amount).toFixed(2)),
        currency: "EUR",
        pay_to_email: payToEmail,
        description: description || `Venezia Pizza Plauen - #${refNumber}`,
        merchant_code: merchantCode
      })
    });

    const sumupData = await sumupRes.json();

    return new Response(
      JSON.stringify({
        success: sumupRes.ok,
        checkoutId: sumupData.id,
        amount: sumupData.amount,
        currency: sumupData.currency,
        status: sumupData.status,
        checkoutReference: sumupData.checkout_reference,
        merchantCode: sumupData.merchant_code
      }),
      { status: sumupRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
