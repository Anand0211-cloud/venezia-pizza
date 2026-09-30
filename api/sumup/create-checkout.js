import https from 'https';

const sumupAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 20
});

function sumupRequestOnce(method, path, data, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'api.sumup.com',
      port: 443,
      path,
      method,
      agent: sumupAgent,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      },
      timeout: 12000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('SumUp connection timeout'));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

async function sumupRequest(method, path, data, apiKey) {
  try {
    return await sumupRequestOnce(method, path, data, apiKey);
  } catch (err) {
    try {
      await new Promise(r => setTimeout(r, 400));
      return await sumupRequestOnce(method, path, data, apiKey);
    } catch (retryErr) {
      throw retryErr;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    const { orderNumber, amount, description, redirectUrl } = payload;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    const apiKey = process.env.SUMUP_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SUMUP_API_KEY environment variable is not configured.' });
    }
    const merchantCode = process.env.SUMUP_MERCHANT_CODE || 'MVV82Y2M';
    const payToEmail = process.env.SUMUP_PAY_TO_EMAIL;
    const currency = process.env.SUMUP_CURRENCY || 'EUR';

    const refNumber = orderNumber || `VP-${Date.now().toString().slice(-6)}`;
    const checkoutReference = `VP-${refNumber}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Get origin host from headers for dynamic redirectUrl fallback
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'veneziapizzas.de';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const defaultRedirect = `${proto}://${host}/?payment=sumup_complete&order_number=${refNumber}`;

    const checkoutPayload = {
      checkout_reference: checkoutReference,
      amount: Number(Number(amount).toFixed(2)),
      currency: currency || 'EUR',
      pay_to_email: payToEmail,
      description: description || `Venezia Pizza Plauen - #${refNumber}`,
      merchant_code: merchantCode,
      hosted_checkout: {
        enabled: true
      },
      redirect_url: redirectUrl || defaultRedirect
    };

    const result = await sumupRequest('POST', '/v0.1/checkouts', checkoutPayload, apiKey);

    if (result.statusCode >= 200 && result.statusCode < 300 && result.data?.id) {
      return res.status(200).json({
        success: true,
        checkoutId: result.data.id,
        amount: result.data.amount,
        currency: result.data.currency,
        status: result.data.status,
        checkoutReference: result.data.checkout_reference,
        merchantCode: result.data.merchant_code,
        hostedCheckoutUrl: result.data.hosted_checkout_url
      });
    } else {
      return res.status(result.statusCode || 500).json({
        success: false,
        error: result.data?.message || 'SumUp checkout generation failed',
        details: result.data
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
