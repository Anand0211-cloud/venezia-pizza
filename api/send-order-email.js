import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    const { order, recipientEmail, type = 'placed' } = payload;
    const targetEmail = recipientEmail || order?.customer_email;

    if (!targetEmail) {
      return res.status(400).json({ error: 'No recipient email provided' });
    }

    if (!order || !order.order_number) {
      return res.status(400).json({ error: 'No valid order provided' });
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE !== 'false';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromName = (process.env.SMTP_FROM_NAME || 'Venezia Pizza Service').replace(/"/g, '');
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    if (!host || !user || !pass) {
      return res.status(500).json({ error: 'SMTP server credentials are not fully configured in environment variables.' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000
    });

    const isDelivered = type === 'delivered';
    const subject = isDelivered
      ? `Ihre Bestellung #${order.order_number} wurde geliefert! - Venezia Pizza Service Plauen`
      : `Bestellbestätigung #${order.order_number} - Venezia Pizza Service Plauen`;

    const items = order.order_items || [];
    const itemsHtml = items.map(item => `
      <li style="margin-bottom: 6px;">
        <strong>${item.quantity}x ${item.item_name || item.name}</strong> 
        ${item.selected_size ? `(${item.selected_size})` : ''}
        ${item.dressing ? `<span style="color: #15803d; font-weight: 700;">[Dressing: ${item.dressing}]</span>` : item.side_dish ? `<span style="color: #e11d48; font-weight: 700;">[Beilage: ${item.side_dish}]</span>` : ''} - 
        ${Number(item.total_price || (item.unit_price * item.quantity) || 0).toFixed(2).replace('.', ',')} €
      </li>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #e30613; margin-top: 0;">🍕 Venezia Pizza Service Plauen</h2>
        <h3>${isDelivered ? 'Ihre Bestellung wurde erfolgreich geliefert!' : 'Vielen Dank für Ihre Bestellung!'}</h3>
        <p>Bestellnummer: <strong>#${order.order_number}</strong></p>
        <p>Lieferart: <strong>${order.delivery_type === 'pickup' ? 'Selbstabholung im Restaurant' : 'Lieferung an Adresse'}</strong></p>
        ${order.street ? `<p>Adresse: ${order.street}, ${order.zip_city || ''}</p>` : ''}
        
        <h4 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Bestellte Gerichte:</h4>
        <ul style="padding-left: 20px;">
          ${itemsHtml || '<li>Pizza & Spezialitäten</li>'}
        </ul>

        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-top: 16px;">
          ${order.delivery_type === 'delivery' ? (Number(order.delivery_fee || 0) > 0 ? `<p style="margin: 4px 0;">Liefergebühr: ${Number(order.delivery_fee).toFixed(2).replace('.', ',')} €</p>` : `<p style="margin: 4px 0; color: #16a34a;">Lieferung: Kostenlos (0,00 €)</p>`) : ''}
          ${Number(order.low_cart_fee || 0) > 0 ? `<p style="margin: 4px 0; color: #1e40af;">Mindermengenzuschlag (Low Cart Fee): +${Number(order.low_cart_fee).toFixed(2).replace('.', ',')} €</p>` : ''}
          <p style="margin: 4px 0; font-size: 16px; font-weight: bold; color: #0f172a;">
            Gesamtbetrag: ${Number(order.total || 0).toFixed(2).replace('.', ',')} €
          </p>
          <p style="margin: 4px 0; font-size: 12px; color: #64748b;">
            Zahlung: ${order.payment_method === 'cash' ? 'Barzahlung bei Lieferung/Abholung' : 'Online-Zahlung via SumUp'}
          </p>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;">
        <small style="color: #64748b; display: block; text-align: center;">
          Venezia Pizza Service • Martin-Luther-Straße 68, 08525 Plauen • Tel. 03741 719 39 69
        </small>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: targetEmail,
      subject,
      html
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      recipient: targetEmail
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
