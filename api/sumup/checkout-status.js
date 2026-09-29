import https from 'https';

export default async function handler(req, res) {
  const checkoutId = req.query.id;
  if (!checkoutId) {
    return res.status(400).json({ error: 'Missing checkout ID' });
  }

  const apiKey = process.env.SUMUP_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'SUMUP_API_KEY environment variable is not configured.' });
  }

  try {
    const options = {
      hostname: 'api.sumup.com',
      port: 443,
      path: `/v0.1/checkouts/${encodeURIComponent(checkoutId)}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const statusReq = https.request(options, (statusRes) => {
      let body = '';
      statusRes.setEncoding('utf8');
      statusRes.on('data', chunk => { body += chunk; });
      statusRes.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          return res.status(statusRes.statusCode || 200).json({
            success: statusRes.statusCode >= 200 && statusRes.statusCode < 300,
            checkout: parsed
          });
        } catch (e) {
          return res.status(statusRes.statusCode || 200).json({ raw: body });
        }
      });
    });

    statusReq.on('error', err => {
      return res.status(500).json({ success: false, error: err.message });
    });

    statusReq.end();
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
