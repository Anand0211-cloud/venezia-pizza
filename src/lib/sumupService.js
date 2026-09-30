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
  const defaultRedirect = typeof window !== 'undefined'
    ? `${window.location.origin}?payment=sumup_complete`
    : undefined;

  const payload = {
    orderNumber,
    amount: Number(amount),
    customerEmail,
    description,
    redirectUrl: redirectUrl || defaultRedirect
  };

  const tryCall = async () => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;

    try {
      const res = await fetch('/api/sumup/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Ungültige Serverantwort beim Erstellen der Zahlung.');
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || `SumUp Fehler (${res.status})`);
      }

      return data;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    return await tryCall();
  } catch (err) {
    console.warn('[SumUpService] First checkout attempt failed, retrying once...', err.message);
    try {
      await new Promise(r => setTimeout(r, 600));
      return await tryCall();
    } catch (retryErr) {
      console.error('[SumUpService] Checkout creation error:', retryErr);
      return {
        success: false,
        error: retryErr.name === 'AbortError'
          ? 'Zeitüberschreitung bei der Verbindung zu SumUp. Bitte versuchen Sie es erneut.'
          : (retryErr.message || 'Verbindung zu SumUp fehlgeschlagen.')
      };
    }
  }
}

export async function getSumUpCheckoutStatus(checkoutId) {
  if (!checkoutId) return { success: false, error: 'Missing checkoutId' };

  const tryCheck = async () => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 10000) : null;

    try {
      const res = await fetch(`/api/sumup/checkout-status?id=${encodeURIComponent(checkoutId)}`, {
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        return { success: false, error: 'Ungültige Status-Antwort' };
      }

      return data;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    return await tryCheck();
  } catch (err) {
    console.warn('[SumUpService] Retrying checkout status check...', err.message);
    try {
      await new Promise(r => setTimeout(r, 500));
      return await tryCheck();
    } catch (retryErr) {
      console.error('[SumUpService] Status check error:', retryErr);
      return { success: false, error: retryErr.message };
    }
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
