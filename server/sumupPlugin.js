/**
 * Server-Side SumUp Payment Gateway Integration Plugin for Vite
 * Venezia Pizza Service, Plauen
 * 
 * All API calls to api.sumup.com are processed SERVER-SIDE.
 * Secret keys are loaded strictly from server environment variables.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

function loadLocalEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          const val = (match[2] || '').replace(/^["'](.*)["']$/, '$1').trim();
          if (!process.env[key] || process.env[key] === '') {
            process.env[key] = val;
          }
        }
      });
    }
  } catch (err) {
    // Ignore error
  }
}

// Retrieve private server credentials from environment variables
function getSumUpCredentials() {
  loadLocalEnv();
  const apiKey = process.env.SUMUP_API_KEY;
  const merchantCode = process.env.SUMUP_MERCHANT_CODE || 'MVV82Y2M';
  const payToEmail = process.env.SUMUP_PAY_TO_EMAIL || 'veneziapizza1999@gmail.com';
  const currency = process.env.SUMUP_CURRENCY || 'EUR';

  return { apiKey, merchantCode, payToEmail, currency };
}

const sumupAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 20
});

// Helper to make HTTPS requests to api.sumup.com with persistent connection
function sumupRequestOnce(method, path, data = null) {
  const { apiKey } = getSumUpCredentials();

  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: 'api.sumup.com',
      port: 443,
      path: path,
      method: method,
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

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('SumUp API connection timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function sumupRequest(method, path, data = null) {
  try {
    return await sumupRequestOnce(method, path, data);
  } catch (err) {
    // Retry once on socket reset / network glitch
    console.warn('[SumUp Plugin] Retrying request due to network notice:', err.message);
    try {
      await new Promise(r => setTimeout(r, 400));
      return await sumupRequestOnce(method, path, data);
    } catch (retryErr) {
      throw retryErr;
    }
  }
}

export function sumupPlugin() {
  return {
    name: 'venezia-sumup-plugin',
    configureServer(server) {
      // 1. Merchant Public Info (Safe to show frontend: name, currency, merchant code)
      server.middlewares.use('/api/sumup/merchant-info', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const { merchantCode, currency } = getSumUpCredentials();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            merchantCode,
            currency,
            companyName: 'Venezia Pizza',
            city: 'Plauen',
            isConfigured: true
          }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      // 2. Create SumUp Checkout Session
      server.middlewares.use('/api/sumup/create-checkout', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const { orderNumber, amount, customerEmail, description } = payload;

            if (!amount || Number(amount) <= 0) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid or missing amount' }));
              return;
            }

            const { merchantCode, payToEmail, currency } = getSumUpCredentials();
            const refNumber = orderNumber || `VP-${Date.now().toString().slice(-6)}`;
            const checkoutReference = `VP-${refNumber}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            const checkoutPayload = {
              checkout_reference: checkoutReference,
              amount: Number(Number(amount).toFixed(2)),
              currency: currency || 'EUR',
              pay_to_email: payToEmail,
              description: description || `Venezia Pizza Plauen - Bestellung #${refNumber}`,
              merchant_code: merchantCode,
              hosted_checkout: {
                enabled: true
              },
              redirect_url: payload.redirectUrl || 'http://localhost:5173/?payment=success'
            };

            const result = await sumupRequest('POST', '/v0.1/checkouts', checkoutPayload);

            if (result.statusCode >= 200 && result.statusCode < 300 && result.data?.id) {
              console.log(`[SumUp API] Created checkout session ${result.data.id} for ${checkoutPayload.amount} EUR (Ref: ${checkoutReference})`);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
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
              console.error('[SumUp API] Failed to create checkout:', result);
              res.statusCode = result.statusCode || 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: result.error?.message || result.data?.message || 'SumUp checkout generation failed',
                details: result.data
              }));
            }
          } catch (err) {
            console.error('[SumUp API] Server exception:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });

      // 3. Verify SumUp Checkout Status
      server.middlewares.use('/api/sumup/checkout-status', async (req, res) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const checkoutId = urlObj.searchParams.get('id') || urlObj.pathname.split('/').pop();

        if (!checkoutId || checkoutId === 'checkout-status') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing checkout ID' }));
          return;
        }

        try {
          const result = await sumupRequest('GET', `/v0.1/checkouts/${checkoutId}`);
          res.statusCode = result.statusCode || 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: result.statusCode >= 200 && result.statusCode < 300,
            checkout: result.data
          }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }
  };
}
