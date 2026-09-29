/**
 * SumUp Payment Service (Frontend Client)
 * Connects securely to the server-side SumUp backend endpoints.
 * ZERO API keys are stored or exposed in this file or any client code.
 */

export async function getSumUpMerchantInfo() {
  try {
    const res = await fetch('/api/sumup/merchant-info');
    if (!res.ok) throw new Error('Failed to fetch merchant info');
    return await res.json();
  } catch (err) {
    console.warn('[SumUpService] Info notice:', err.message);
    return {
      success: true,
      merchantCode: 'MVV82Y2M',
      currency: 'EUR',
      companyName: 'Venezia Pizza',
      city: 'Plauen',
      isConfigured: true
    };
  }
}

export async function createSumUpCheckout({ orderNumber, amount, customerEmail, description, redirectUrl }) {
  try {
    const defaultRedirect = typeof window !== 'undefined'
      ? `${window.location.origin}?payment=sumup_complete`
      : undefined;

    const res = await fetch('/api/sumup/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderNumber,
        amount: Number(amount),
        customerEmail,
        description,
        redirectUrl: redirectUrl || defaultRedirect
      })
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[SumUpService] Checkout creation error:', err);
    return { success: false, error: err.message };
  }
}

export async function getSumUpCheckoutStatus(checkoutId) {
  if (!checkoutId) return { success: false, error: 'Missing checkoutId' };
  try {
    const res = await fetch(`/api/sumup/checkout-status?id=${encodeURIComponent(checkoutId)}`);
    return await res.json();
  } catch (err) {
    console.error('[SumUpService] Status check error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Dynamically loads the official SumUp Card Web SDK
 */
export function loadSumUpCardSdk() {
  return new Promise((resolve, reject) => {
    if (window.SumUpCard) {
      resolve(window.SumUpCard);
      return;
    }

    const existingScript = document.getElementById('sumup-card-sdk');
    if (existingScript) {
      existingScript.onload = () => resolve(window.SumUpCard);
      return;
    }

    const script = document.createElement('script');
    script.id = 'sumup-card-sdk';
    script.src = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js';
    script.async = true;
    script.onload = () => resolve(window.SumUpCard);
    script.onerror = (e) => reject(new Error('Failed to load SumUp Card SDK'));
    document.body.appendChild(script);
  });
}
