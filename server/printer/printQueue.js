/**
 * printQueue.js
 * Manages configuration, persistent print ledger, duplicate prevention,
 * job history, retries, and printer connection health.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { buildReceiptBuffer, buildTestReceiptBuffer } from './escposBuilder.js';
import {
  listPrinters,
  autoDetectThermalPrinter,
  getPrinterStatus,
  printRawBuffer,
  clearPrinterJobs
} from './windowsSpooler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const CONFIG_FILE = path.join(DATA_DIR, 'printer_config.json');
const LEDGER_FILE = path.join(DATA_DIR, 'printed_orders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Configuration
const DEFAULT_CONFIG = {
  printerName: '',
  paperWidth: 80,
  autoPrint: true,
  cutPaper: true,
  openDrawer: false,
  copies: 1,
  authToken: ''
};

/**
 * Load or initialize configuration
 */
export function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[PrintQueue] Error reading config file:', err.message);
  }

  // Create default token if none
  const defaultConf = {
    ...DEFAULT_CONFIG,
    authToken: crypto.randomBytes(16).toString('hex')
  };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConf, null, 2), 'utf8');
  } catch (_) {}
  return defaultConf;
}

/**
 * Save configuration to disk
 */
export function saveConfig(newConfig) {
  try {
    let existing = DEFAULT_CONFIG;
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        existing = { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
      } catch (_) {}
    }
    const merged = { ...existing, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
  } catch (err) {
    console.error('[PrintQueue] Failed to save config:', err.message);
    return newConfig;
  }
}

/**
 * Load printed orders ledger
 * Map of orderKey -> { orderId, orderNumber, status, printedAt, attempts, error }
 */
export function loadLedger() {
  try {
    if (fs.existsSync(LEDGER_FILE)) {
      const raw = fs.readFileSync(LEDGER_FILE, 'utf8');
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.warn('[PrintQueue] Error reading ledger file:', err.message);
  }
  return [];
}

/**
 * Save ledger to disk (keep last 500 jobs)
 */
export function saveLedger(ledger) {
  try {
    const trimmed = (Array.isArray(ledger) ? ledger : []).slice(0, 500);
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch (err) {
    console.error('[PrintQueue] Failed to save ledger:', err);
  }
}

/**
 * Check if an order has already been successfully printed
 */
export function isOrderAlreadyPrinted(orderId, orderNumber) {
  const ledger = loadLedger();
  const idStr = String(orderId || '');
  const numStr = String(orderNumber || '');

  return ledger.some(job => {
    if (job.status !== 'printed') return false;
    const matchesId = idStr && String(job.orderId) === idStr;
    const matchesNum = numStr && String(job.orderNumber) === numStr;
    return matchesId || matchesNum;
  });
}

/**
 * Get current printer status and configuration summary
 */
export async function getPrinterSystemStatus() {
  const config = loadConfig();
  const allPrinters = await listPrinters();

  // If no printerName configured yet, attempt auto-detect
  let activePrinterName = config.printerName;
  if (!activePrinterName) {
    const detected = await autoDetectThermalPrinter();
    if (detected) {
      activePrinterName = detected.name;
      saveConfig({ printerName: activePrinterName });
    }
  }

  const printerDetail = activePrinterName ? await getPrinterStatus(activePrinterName) : { found: false };
  const ledger = loadLedger();
  const recentJobs = ledger.slice(0, 10);

  return {
    online: true,
    activePrinterName: activePrinterName || 'Not configured',
    isPrinterFound: !!printerDetail?.found,
    printerDetail,
    availablePrinters: allPrinters,
    config: {
      autoPrint: config.autoPrint,
      paperWidth: config.paperWidth,
      cutPaper: config.cutPaper,
      openDrawer: config.openDrawer,
      copies: config.copies
    },
    totalJobsRecorded: ledger.length,
    recentJobs
  };
}

/**
 * Print an order receipt
 * @param {Object} order The order to print
 * @param {Object} opts { force: boolean, copies: number }
 */
export async function printOrderReceipt(order, opts = {}) {
  if (!order) {
    throw new Error('No order data provided for printing');
  }

  const orderId = order.id || null;
  const orderNumber = order.order_number || `VP-${String(orderId || '').slice(0, 6)}`;
  const config = loadConfig();
  const force = !!opts.force;

  // 1. Duplicate check (unless force is requested)
  if (!force && isOrderAlreadyPrinted(orderId, orderNumber)) {
    console.log(`[PrintQueue] Order #${orderNumber} is already printed. Skipping duplicate.`);
    return {
      success: true,
      printed: false,
      reason: 'already_printed',
      orderNumber,
      orderId
    };
  }

  // 2. Resolve active printer
  let targetPrinter = config.printerName;
  if (!targetPrinter) {
    const detected = await autoDetectThermalPrinter();
    if (detected) {
      targetPrinter = detected.name;
      saveConfig({ printerName: targetPrinter });
    } else {
      throw new Error('No thermal printer selected or detected on Windows. Please configure in Admin Settings.');
    }
  }

  // 3. Build ESC/POS 80mm buffer
  const buffer = buildReceiptBuffer(order, {
    paperWidth: config.paperWidth,
    cutPaper: config.cutPaper,
    openDrawer: config.openDrawer
  });

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const ledger = loadLedger();

  // Create job entry
  const jobEntry = {
    jobId,
    orderId,
    orderNumber,
    customerName: order.customer_name || 'Kunde',
    deliveryType: order.delivery_type || 'delivery',
    total: order.total || 0,
    printerName: targetPrinter,
    status: 'in_progress',
    createdAt: now,
    attempts: 1,
    error: null,
    order: {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      street: order.street,
      zip_city: order.zip_city,
      delivery_type: order.delivery_type,
      total: order.total,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      created_at: order.created_at,
      order_items: order.order_items || []
    }
  };

  try {
    const copies = opts.copies || config.copies || 1;
    for (let c = 0; c < copies; c++) {
      await printRawBuffer(targetPrinter, buffer, `Receipt #${orderNumber}`);
    }

    jobEntry.status = 'printed';
    jobEntry.printedAt = new Date().toISOString();
    ledger.unshift(jobEntry);
    saveLedger(ledger);

    console.log(`[PrintQueue] Successfully printed receipt for Order #${orderNumber} on "${targetPrinter}".`);
    return {
      success: true,
      printed: true,
      jobId,
      orderNumber,
      printerName: targetPrinter,
      copies
    };
  } catch (err) {
    jobEntry.status = 'failed';
    jobEntry.error = err.message || 'Printing failed';
    ledger.unshift(jobEntry);
    saveLedger(ledger);

    console.error(`[PrintQueue] Print failed for Order #${orderNumber}:`, err.message);
    throw new Error(`Print failed on "${targetPrinter}": ${err.message}`);
  }
}

/**
 * Print a hardware test receipt
 */
export async function printHardwareTest(opts = {}) {
  const config = loadConfig();
  let targetPrinter = opts.printerName || config.printerName;

  if (!targetPrinter) {
    const detected = await autoDetectThermalPrinter();
    if (detected) {
      targetPrinter = detected.name;
    } else {
      throw new Error('No thermal printer selected or detected on Windows.');
    }
  }

  const buffer = buildTestReceiptBuffer(targetPrinter, {
    paperWidth: config.paperWidth
  });

  const res = await printRawBuffer(targetPrinter, buffer, 'Venezia Test Print');
  return {
    success: true,
    printerName: targetPrinter,
    bytesSent: res.bytesSent
  };
}

/**
 * Retry a previously failed print job
 */
export async function retryPrintJob(jobId) {
  const ledger = loadLedger();
  const job = ledger.find(j => j.jobId === jobId);

  if (!job) {
    throw new Error(`Job '${jobId}' not found in ledger`);
  }

  if (!job.order) {
    throw new Error(`No order payload saved for job '${jobId}' to retry`);
  }

  return await printOrderReceipt(job.order, { force: true });
}
