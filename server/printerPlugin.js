/**
 * printerPlugin.js
 * Vite middleware plugin providing /api/printer/* endpoints
 * directly through the Vite dev server.
 */

import {
  getPrinterSystemStatus,
  printOrderReceipt,
  printHardwareTest,
  saveConfig,
  retryPrintJob,
  loadLedger
} from './printer/printQueue.js';
import { listPrinters, clearPrinterJobs } from './printer/windowsSpooler.js';

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data.trim() ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export function printerPlugin() {
  return {
    name: 'venezia-thermal-printer-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;
        const method = req.method;

        if (!pathname.startsWith('/api/printer')) {
          return next();
        }

        try {
          if (pathname === '/api/printer/status' && method === 'GET') {
            const status = await getPrinterSystemStatus();
            return sendJson(res, 200, { success: true, ...status });
          }

          if (pathname === '/api/printer/printers' && method === 'GET') {
            const printers = await listPrinters();
            return sendJson(res, 200, { success: true, printers });
          }

          if (pathname === '/api/printer/print' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.order) {
              return sendJson(res, 400, { success: false, error: 'Missing order data' });
            }
            const result = await printOrderReceipt(body.order, {
              force: !!body.force,
              copies: body.copies
            });
            return sendJson(res, 200, result);
          }

          if (pathname === '/api/printer/test' && method === 'POST') {
            const body = await parseBody(req);
            const result = await printHardwareTest(body);
            return sendJson(res, 200, result);
          }

          if (pathname === '/api/printer/config' && method === 'POST') {
            const body = await parseBody(req);
            const updated = saveConfig(body);
            return sendJson(res, 200, { success: true, config: updated });
          }

          if (pathname === '/api/printer/jobs' && method === 'GET') {
            const ledger = loadLedger();
            const limit = parseInt(url.searchParams.get('limit') || '30', 10);
            return sendJson(res, 200, { success: true, jobs: ledger.slice(0, limit) });
          }

          if (pathname === '/api/printer/retry' && method === 'POST') {
            const body = await parseBody(req);
            const result = await retryPrintJob(body.jobId);
            return sendJson(res, 200, result);
          }

          if (pathname === '/api/printer/clearjobs' && method === 'POST') {
            const body = await parseBody(req);
            const ok = await clearPrinterJobs(body.printerName);
            return sendJson(res, 200, { success: ok });
          }

          return sendJson(res, 404, { success: false, error: 'Printer endpoint not found' });
        } catch (err) {
          console.error('[PrinterPlugin] Error handling request:', err);
          return sendJson(res, 500, { success: false, error: err.message || 'Server error' });
        }
      });
    }
  };
}
