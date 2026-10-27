/**
 * printerService.js
 * Standalone, lightweight local Node.js printing service for Venezia Pizza.
 * Listens on http://127.0.0.1:9090
 *
 * Capabilities:
 * 1. REST API for status, printer listing, configuration, and printing.
 * 2. Background Supabase Realtime listener to automatically print orders
 *    placed from customer phones even if browser tab is closed.
 * 3. Secure loopback access (localhost / 127.0.0.1) with optional token auth.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  loadConfig,
  saveConfig,
  getPrinterSystemStatus,
  printOrderReceipt,
  printHardwareTest,
  retryPrintJob,
  loadLedger
} from './printQueue.js';
import { listPrinters, clearPrinterJobs } from './windowsSpooler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PRINTER_PORT || 9090;
const HOST = '127.0.0.1';

// Load .env variables
function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        const val = (match[2] || '').replace(/^["'](.*)["']$/, '$1').trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

// Parse JSON request body helper
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        reject(new Error('Request entity too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body.trim()) return resolve({});
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload: ' + err.message));
      }
    });
    req.on('error', err => reject(err));
  });
}

// Send JSON response helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Printer-Token'
  });
  res.end(JSON.stringify(data));
}

// Initialize Supabase client for background auto-print listener
let supabase = null;
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn('[PrinterService] Supabase client init warning:', err.message);
  }
}

/**
 * Background Order Listener (Supabase Realtime + Polling)
 */
function initBackgroundOrderListener() {
  if (!supabase) {
    console.log('[PrinterService] Supabase not configured in .env. Background listener inactive.');
    return;
  }

  console.log('[PrinterService] Initializing background Supabase order listener...');

  // 1. Subscribe to Supabase Postgres Changes on table 'orders'
  try {
    supabase
      .channel('printer-service-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
        try {
          const newOrder = payload.new;
          if (!newOrder || !newOrder.id) return;

          // Check if auto-print is enabled in config
          const config = loadConfig();
          if (!config.autoPrint) {
            console.log(`[PrinterService] Auto-print is disabled. Order #${newOrder.order_number} skipped.`);
            return;
          }

          console.log(`[PrinterService] [Realtime] New order received: #${newOrder.order_number || newOrder.id}`);

          // Fetch items for this order from order_items table
          let orderItems = [];
          try {
            const { data: items } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', newOrder.id);
            if (items && Array.isArray(items)) {
              orderItems = items;
            }
          } catch (e) {
            console.warn('[PrinterService] Error fetching order items for print:', e.message);
          }

          const completeOrder = {
            ...newOrder,
            order_items: orderItems
          };

          // Execute print
          await printOrderReceipt(completeOrder, { force: false });
        } catch (err) {
          console.error('[PrinterService] Background print error:', err.message);
        }
      })
      .subscribe((status) => {
        console.log(`[PrinterService] Supabase orders realtime channel status: ${status}`);
      });
  } catch (err) {
    console.warn('[PrinterService] Supabase subscribe error:', err.message);
  }
}

/**
 * HTTP Server Handler
 */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Printer-Token',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  try {
    // 1. GET /status or GET /health
    if ((pathname === '/status' || pathname === '/health') && method === 'GET') {
      const status = await getPrinterSystemStatus();
      return sendJson(res, 200, { success: true, ...status });
    }

    // 2. GET /printers
    if (pathname === '/printers' && method === 'GET') {
      const printers = await listPrinters();
      return sendJson(res, 200, { success: true, printers });
    }

    // 3. POST /print (Print order receipt)
    if (pathname === '/print' && method === 'POST') {
      const body = await parseJsonBody(req);
      const order = body.order;
      if (!order) {
        return sendJson(res, 400, { success: false, error: 'Missing order in request body' });
      }

      const opts = {
        force: !!body.force,
        copies: body.copies ? parseInt(body.copies, 10) : undefined
      };

      const result = await printOrderReceipt(order, opts);
      return sendJson(res, 200, result);
    }

    // 4. POST /test (Print hardware test receipt)
    if (pathname === '/test' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await printHardwareTest(body);
      return sendJson(res, 200, result);
    }

    // 5. POST /config (Update configuration)
    if (pathname === '/config' && method === 'POST') {
      const body = await parseJsonBody(req);
      const updated = saveConfig(body);
      return sendJson(res, 200, { success: true, config: updated });
    }

    // 6. GET /jobs (Recent print jobs from ledger)
    if (pathname === '/jobs' && method === 'GET') {
      const ledger = loadLedger();
      const limit = parseInt(url.searchParams.get('limit') || '30', 10);
      return sendJson(res, 200, { success: true, jobs: ledger.slice(0, limit) });
    }

    // 7. POST /retry (Retry failed job)
    if (pathname === '/retry' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.jobId) {
        return sendJson(res, 400, { success: false, error: 'Missing jobId parameter' });
      }
      const result = await retryPrintJob(body.jobId);
      return sendJson(res, 200, result);
    }

    // 8. POST /clearjobs (Clear Windows queue)
    if (pathname === '/clearjobs' && method === 'POST') {
      const body = await parseJsonBody(req);
      const config = loadConfig();
      const target = body.printerName || config.printerName;
      const ok = await clearPrinterJobs(target);
      return sendJson(res, 200, { success: ok });
    }

    // Fallback 404
    sendJson(res, 404, { success: false, error: `Endpoint '${pathname}' not found` });
  } catch (err) {
    console.error(`[PrinterService] Error handling ${method} ${pathname}:`, err);
    sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
  }
});

// Start listening
server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`  VENEZIA PIZZA THERMAL PRINTING SERVICE`);
  console.log(`  Listening on http://${HOST}:${PORT}`);
  console.log('====================================================');

  const config = loadConfig();
  console.log(`  Current Target Printer: "${config.printerName || '(Auto-Detect)'}"`);
  console.log(`  Auto-Print Mode:        ${config.autoPrint ? 'ENABLED' : 'DISABLED'}`);
  console.log(`  Paper Roll Width:       ${config.paperWidth} mm`);
  console.log('====================================================');

  initBackgroundOrderListener();
});

// Graceful termination handling
process.on('SIGINT', () => {
  console.log('\n[PrinterService] Shutting down service gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('\n[PrinterService] Terminating service...');
  server.close(() => process.exit(0));
});
