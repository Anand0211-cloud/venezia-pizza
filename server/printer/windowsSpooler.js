/**
 * windowsSpooler.js
 * Interacts with the Windows Print Spooler using Win32 API via PowerShell helper.
 * Sends raw ESC/POS binary buffers directly to Windows USB/network printer queues.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_PATH = path.resolve(__dirname, 'rawPrinter.ps1');
const SPOOL_DIR = path.resolve(__dirname, '../../data/spool');

// Ensure spool directory exists
if (!fs.existsSync(SPOOL_DIR)) {
  fs.mkdirSync(SPOOL_DIR, { recursive: true });
}

/**
 * Execute PowerShell command with JSON output
 */
function runPs(args) {
  return new Promise((resolve, reject) => {
    const fullArgs = [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      SCRIPT_PATH,
      ...args
    ];

    const child = spawn('powershell.exe', fullArgs, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('close', code => {
      if (code !== 0 && !stdout.trim()) {
        return reject(new Error(`PowerShell exited with code ${code}: ${stderr || 'Unknown error'}`));
      }
      try {
        const cleanOut = stdout.trim();
        if (!cleanOut) {
          return resolve(null);
        }
        const data = JSON.parse(cleanOut);
        resolve(data);
      } catch (err) {
        // If not JSON, return text or error
        if (stdout.includes('"success":') || stdout.includes('"found":')) {
          // Attempt to extract JSON from stdout
          const match = stdout.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (match) {
            try { return resolve(JSON.parse(match[0])); } catch (_) {}
          }
        }
        reject(new Error(`Failed to parse PowerShell JSON output: ${stdout || stderr}`));
      }
    });

    child.on('error', err => {
      reject(err);
    });
  });
}

/**
 * Get all installed Windows printers
 */
export async function listPrinters() {
  try {
    const result = await runPs(['-Action', 'list']);
    const list = Array.isArray(result) ? result : (result ? [result] : []);
    return list.map(p => ({
      name: p.Name || '',
      driver: p.DriverName || '',
      port: p.PortName || '',
      status: p.PrinterStatus === 0 ? 'Ready' : `Status (${p.PrinterStatus})`,
      isShared: !!p.Shared,
      shareName: p.ShareName || ''
    }));
  } catch (err) {
    console.warn('[WindowsSpooler] Error listing printers:', err.message);
    return [];
  }
}

/**
 * Auto-detect the best matching thermal printer on this Windows system
 */
export async function autoDetectThermalPrinter() {
  const printers = await listPrinters();
  if (printers.length === 0) return null;

  // Specific priority matching
  const exactPatterns = [/ZJ-8330/i, /ZJ-8330-L/i, /ZJiang/i, /ZJ-/i, /POS-80/i, /POS80/i, /Thermal/i, /Receipt/i];
  for (const pattern of exactPatterns) {
    const found = printers.find(p => pattern.test(p.name) || pattern.test(p.driver));
    if (found) return found;
  }

  // Fallback pattern: Generic / Text Only
  const generic = printers.find(p => /Generic\s*\/\s*Text/i.test(p.name) || /Generic\s*\/\s*Text/i.test(p.driver));
  if (generic) return generic;

  // Fallback to first printer on USB port
  const usbPrinter = printers.find(p => /^USB/i.test(p.port));
  if (usbPrinter) return usbPrinter;

  return printers[0] || null;
}

/**
 * Get status of a specific printer
 */
export async function getPrinterStatus(printerName) {
  if (!printerName) return { found: false, error: 'No printer name provided' };
  try {
    const res = await runPs(['-Action', 'status', '-PrinterName', printerName]);
    return res || { found: false };
  } catch (err) {
    return { found: false, error: err.message };
  }
}

/**
 * Send raw binary ESC/POS buffer directly to Windows printer queue
 */
export async function printRawBuffer(printerName, buffer, docName = 'Venezia Order Receipt') {
  if (!printerName) {
    throw new Error('Printer name is required for printing');
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Print buffer is empty');
  }

  // Write buffer to temporary file in spool directory
  const tempFileName = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.bin`;
  const tempFilePath = path.join(SPOOL_DIR, tempFileName);

  try {
    fs.writeFileSync(tempFilePath, buffer);

    const res = await runPs([
      '-Action', 'print',
      '-PrinterName', printerName,
      '-FilePath', tempFilePath,
      '-DocName', docName
    ]);

    if (!res || !res.success) {
      throw new Error(res?.error || 'Windows print spooler returned failure');
    }

    return {
      success: true,
      bytesSent: res.bytesSent || buffer.length,
      printerName,
      docName
    };
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (_) {}
  }
}

/**
 * Clear print jobs for a specific printer queue
 */
export async function clearPrinterJobs(printerName) {
  if (!printerName) return false;
  try {
    const res = await runPs(['-Action', 'clearjobs', '-PrinterName', printerName]);
    return !!res?.success;
  } catch (err) {
    console.warn('[WindowsSpooler] Error clearing jobs:', err.message);
    return false;
  }
}
