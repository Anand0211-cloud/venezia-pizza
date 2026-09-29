/**
 * Order Confirmation & Delivery Notification Email Client Service
 * Dispatches order receipt requests to the secure server-side SMTP backend.
 * Credentials remain completely hidden on the server and are NEVER exposed in the frontend.
 */

function extractCustomerEmail(order) {
  if (!order) return null;
  let email = order.customer_email;
  if (!email && order.note) {
    const emailMatch = order.note.match(/\[E-Mail:\s*([^\]]+)\]/i);
    if (emailMatch && emailMatch[1]) {
      email = emailMatch[1].trim();
    }
  }
  return (email && email.includes('@')) ? email.trim() : null;
}

export async function sendOrderConfirmationEmail(order) {
  if (!order) return { success: false, reason: 'missing_order' };

  const customerEmail = extractCustomerEmail(order);
  if (!customerEmail) {
    return { success: false, reason: 'no_email' };
  }

  try {
    const response = await fetch('/api/send-order-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order,
        recipientEmail: customerEmail,
        type: 'placed'
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log(`[EmailService] Order placed confirmation sent to ${customerEmail} (ID: ${result.messageId})`);
    } else {
      console.warn('[EmailService] Order placed email notice:', result.error);
    }
    return result;
  } catch (err) {
    console.warn('[EmailService] Order email notice (safe ignore):', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendOrderDeliveredEmail(order) {
  if (!order) return { success: false, reason: 'missing_order' };

  const customerEmail = extractCustomerEmail(order);
  if (!customerEmail) {
    return { success: false, reason: 'no_email' };
  }

  try {
    const response = await fetch('/api/send-order-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order,
        recipientEmail: customerEmail,
        type: 'delivered'
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log(`[EmailService] Order delivered notification sent to ${customerEmail} (ID: ${result.messageId})`);
    } else {
      console.warn('[EmailService] Delivered email notice:', result.error);
    }
    return result;
  } catch (err) {
    console.warn('[EmailService] Delivered email notice (safe ignore):', err.message);
    return { success: false, error: err.message };
  }
}
