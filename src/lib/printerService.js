/**
 * printerService.js (Frontend Client)
 * Connects the Admin Dashboard to the local Zjiang ZJ-8330-L Thermal Printer service.
 * Supports both standalone daemon (http://127.0.0.1:9090) and Vite middleware (/api/printer).
 */

const STANDALONE_URL = 'http://127.0.0.1:9090';
const BACKEND_URL = '/api/printer';

// Cache active service URL once discovered
let detectedServiceUrl = null;

async function requestPrinterApi(endpoint, options = {}) {
  const urlsToTry = detectedServiceUrl
    ? [detectedServiceUrl, detectedServiceUrl === STANDALONE_URL ? BACKEND_URL : STANDALONE_URL]
    : [STANDALONE_URL, BACKEND_URL];

  let lastError = null;

  for (const baseUrl of urlsToTry) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 6000);

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        detectedServiceUrl = baseUrl;
        return await res.json();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Printer service not reachable');
}

/**
 * Get system printer status and configuration
 */
export async function getPrinterStatus() {
  try {
    const data = await requestPrinterApi('/status', { method: 'GET', timeout: 3500 });
    return {
      connected: true,
      serviceOnline: true,
      ...data
    };
  } catch (err) {
    return {
      connected: false,
      serviceOnline: false,
      error: err.message
    };
  }
}

/**
 * List all Windows installed printers
 */
export async function getPrintersList() {
  try {
    const data = await requestPrinterApi('/printers', { method: 'GET' });
    return data.printers || [];
  } catch (err) {
    console.warn('[PrinterClient] Failed to list printers:', err.message);
    return [];
  }
}

/**
 * Send an order to the thermal printer
 * @param {Object} order Complete order payload with items
 * @param {Object} options { force: boolean, copies: number }
 */
export async function printOrderThermal(order, options = {}) {
  if (!order) throw new Error('Order is required for printing');

  return await requestPrinterApi('/print', {
    method: 'POST',
    body: JSON.stringify({
      order,
      force: !!options.force,
      copies: options.copies
    }),
    timeout: 10000
  });
}

/**
 * Print a hardware test receipt
 */
export async function printTestReceipt(printerName) {
  return await requestPrinterApi('/test', {
    method: 'POST',
    body: JSON.stringify({ printerName }),
    timeout: 10000
  });
}

/**
 * Update thermal printer settings
 */
export async function updatePrinterSettings(config) {
  return await requestPrinterApi('/config', {
    method: 'POST',
    body: JSON.stringify(config)
  });
}

/**
 * Get recent print jobs from ledger
 */
export async function getPrintJobs(limit = 20) {
  try {
    const data = await requestPrinterApi(`/jobs?limit=${limit}`, { method: 'GET' });
    return data.jobs || [];
  } catch (err) {
    console.warn('[PrinterClient] Failed to fetch print jobs:', err.message);
    return [];
  }
}

/**
 * Retry a failed print job
 */
export async function retryPrintJob(jobId) {
  return await requestPrinterApi('/retry', {
    method: 'POST',
    body: JSON.stringify({ jobId })
  });
}

/**
 * Clear print queue
 */
export async function clearPrinterQueue(printerName) {
  return await requestPrinterApi('/clearjobs', {
    method: 'POST',
    body: JSON.stringify({ printerName })
  });
}
