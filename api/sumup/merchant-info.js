export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const merchantCode = process.env.SUMUP_MERCHANT_CODE || 'MVV82Y2M';
  const currency = process.env.SUMUP_CURRENCY || 'EUR';

  return res.status(200).json({
    success: true,
    merchantCode,
    currency,
    companyName: 'Venezia Pizza',
    city: 'Plauen',
    isConfigured: true
  });
}
