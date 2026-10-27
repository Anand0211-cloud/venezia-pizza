/**
 * escposBuilder.js
 * Builds raw ESC/POS binary buffers optimized for 80mm thermal receipt printers
 * (e.g., Zjiang ZJ-8330-L, Epson, Star, POS-80 series).
 *
 * Paper width: 80mm (~48 columns in standard Font A).
 */

const COMMANDS = {
  // Initialization
  INIT: Buffer.from([0x1b, 0x40]),

  // Code Page: CP437 (USA, Standard Europe)
  SELECT_CP437: Buffer.from([0x1b, 0x74, 0x00]),
  // Code Page: WPC1252 (Western European)
  SELECT_CP1252: Buffer.from([0x1b, 0x74, 0x10]),

  // Alignment
  ALIGN_LEFT: Buffer.from([0x1b, 0x61, 0x00]),
  ALIGN_CENTER: Buffer.from([0x1b, 0x61, 0x01]),
  ALIGN_RIGHT: Buffer.from([0x1b, 0x61, 0x02]),

  // Text Styling
  BOLD_ON: Buffer.from([0x1b, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([0x1b, 0x45, 0x00]),
  UNDERLINE_ON: Buffer.from([0x1b, 0x2d, 0x01]),
  UNDERLINE_OFF: Buffer.from([0x1b, 0x2d, 0x00]),
  INVERT_ON: Buffer.from([0x1d, 0x42, 0x01]),
  INVERT_OFF: Buffer.from([0x1d, 0x42, 0x00]),

  // Sizing (GS ! n)
  SIZE_NORMAL: Buffer.from([0x1d, 0x21, 0x00]),
  SIZE_DOUBLE_HEIGHT: Buffer.from([0x1d, 0x21, 0x01]),
  SIZE_DOUBLE_WIDTH: Buffer.from([0x1d, 0x21, 0x10]),
  SIZE_DOUBLE: Buffer.from([0x1d, 0x21, 0x11]), // Double height & width
  SIZE_LARGE: Buffer.from([0x1d, 0x21, 0x22]),  // Triple size

  // Feed & Cut
  FEED_LINE: Buffer.from([0x0a]),
  FEED_3_LINES: Buffer.from([0x1b, 0x64, 0x03]),
  FEED_5_LINES: Buffer.from([0x1b, 0x64, 0x05]),
  PARTIAL_CUT: Buffer.from([0x1d, 0x56, 0x42, 0x05]), // Feed 5 lines and partial cut
  FULL_CUT: Buffer.from([0x1d, 0x56, 0x00]),

  // Cash Drawer Kick (Pulse pin 2: 25ms on, 250ms off)
  DRAWER_KICK: Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa])
};

const WIDTH_80MM = 48;
const WIDTH_58MM = 32;

/**
 * Encode string into CP437 buffer with German umlaut mapping
 */
function encodeCP437(str) {
  if (!str) return Buffer.alloc(0);
  const cleanStr = String(str);
  const bytes = [];

  for (let i = 0; i < cleanStr.length; i++) {
    const ch = cleanStr[i];
    switch (ch) {
      case 'ä': bytes.push(0x84); break;
      case 'ö': bytes.push(0x94); break;
      case 'ü': bytes.push(0x81); break;
      case 'Ä': bytes.push(0x8e); break;
      case 'Ö': bytes.push(0x99); break;
      case 'Ü': bytes.push(0x9a); break;
      case 'ß': bytes.push(0xe1); break;
      case '€':
        // CP437 Euro fallback to 'EUR' or 0xD5 if supported
        bytes.push(0x45, 0x55, 0x52); // "EUR"
        break;
      case 'é': bytes.push(0x82); break;
      case 'è': bytes.push(0x8a); break;
      case 'à': bytes.push(0x85); break;
      case '°': bytes.push(0xf8); break;
      case 'Ø': bytes.push(0xed); break;
      default: {
        const code = ch.charCodeAt(0);
        if (code >= 32 && code <= 126) {
          bytes.push(code);
        } else if (code === 10) { // \n
          bytes.push(0x0a);
        } else if (code === 13) { // \r
          bytes.push(0x0d);
        } else {
          bytes.push(0x3f); // '?' for unmapped characters
        }
        break;
      }
    }
  }

  return Buffer.from(bytes);
}

/**
 * Format two columns (left-aligned and right-aligned text) for receipt paper
 */
function formatTwoColumns(leftText, rightText, width = WIDTH_80MM) {
  const left = String(leftText || '').trim();
  const right = String(rightText || '').trim();

  // If together they fit on one line
  const spacesNeeded = width - left.length - right.length;
  if (spacesNeeded >= 1) {
    return left + ' '.repeat(spacesNeeded) + right;
  }

  // If left text is too long, wrap it
  const maxLeftLen = width - right.length - 1;
  const truncatedLeft = left.substring(0, maxLeftLen);
  const padding = width - truncatedLeft.length - right.length;
  return truncatedLeft + ' '.repeat(Math.max(1, padding)) + right;
}

/**
 * Word-wrap a string to fit the printer column width
 */
function wrapText(text, width = WIDTH_80MM, indent = '') {
  if (!text) return [];
  const words = String(text).split(/\s+/);
  const lines = [];
  let currentLine = indent;

  for (const word of words) {
    if (!word) continue;
    if ((currentLine + (currentLine === indent ? '' : ' ') + word).length <= width) {
      currentLine += (currentLine === indent ? '' : ' ') + word;
    } else {
      if (currentLine !== indent) lines.push(currentLine);
      currentLine = indent + word;
    }
  }
  if (currentLine !== indent) lines.push(currentLine);
  return lines;
}

/**
 * Format currency in German locale
 */
function formatEUR(val) {
  const num = Number(val || 0);
  return num.toFixed(2).replace('.', ',') + ' EUR';
}

/**
 * Build 80mm ESC/POS Receipt Buffer for an Order
 * @param {Object} order The complete order object
 * @param {Object} options Configuration options
 * @returns {Buffer} Raw ESC/POS bytes ready to send to printer
 */
export function buildReceiptBuffer(order, options = {}) {
  const width = options.paperWidth === 58 ? WIDTH_58MM : WIDTH_80MM;
  const openDrawer = !!options.openDrawer;
  const cutPaper = options.cutPaper !== false;
  const storeInfo = options.storeInfo || {
    name: 'VENEZIA PIZZA SERVICE',
    tagline: 'Echte Pizza. Echter Geschmack.',
    address: 'Bahnhofstraße 12',
    city: '08525 Plauen',
    phone: '03741 / 22 44 88',
    website: 'www.veneziapizzas.de'
  };

  const chunks = [];

  function add(buf) {
    chunks.push(buf);
  }

  function text(str) {
    add(encodeCP437(str));
  }

  function line(str = '') {
    add(encodeCP437(str));
    add(COMMANDS.FEED_LINE);
  }

  // 1. Initialize Printer & Set Code Page
  add(COMMANDS.INIT);
  add(COMMANDS.SELECT_CP437);

  // Optional: Kick Cash Drawer on cash order
  if (openDrawer && order.payment_method === 'cash') {
    add(COMMANDS.DRAWER_KICK);
  }

  // 2. Header (Centered, bold store name)
  add(COMMANDS.ALIGN_CENTER);
  add(COMMANDS.BOLD_ON);
  add(COMMANDS.SIZE_DOUBLE);
  line(storeInfo.name);

  add(COMMANDS.SIZE_NORMAL);
  add(COMMANDS.BOLD_OFF);
  line(storeInfo.tagline);
  line(`${storeInfo.address}, ${storeInfo.city}`);
  line(`Tel: ${storeInfo.phone}`);
  line(storeInfo.website);

  line('='.repeat(width));

  // 3. Order Badge & Date
  const isDelivery = String(order.delivery_type || '').toLowerCase() === 'delivery';
  const orderNumber = order.order_number || `VP-${String(order.id || '').slice(0, 6).toUpperCase()}`;

  add(COMMANDS.SIZE_DOUBLE);
  add(COMMANDS.BOLD_ON);
  line(`BESTELLUNG #${orderNumber}`);

  add(COMMANDS.SIZE_NORMAL);
  add(COMMANDS.BOLD_OFF);

  const orderDate = order.created_at ? new Date(order.created_at) : new Date();
  const dateStr = orderDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = orderDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  line(`Eingegangen: ${dateStr} um ${timeStr} Uhr`);

  line('-'.repeat(width));

  // 4. Delivery / Pickup High-Visibility Banner
  add(COMMANDS.BOLD_ON);
  add(COMMANDS.SIZE_DOUBLE);
  if (isDelivery) {
    line('>>> LIEFERUNG <<<');
  } else {
    line('>>> ABHOLUNG (SELBSTABHOLER) <<<');
  }
  add(COMMANDS.SIZE_NORMAL);
  add(COMMANDS.BOLD_OFF);

  const estMinutes = Number(order.estimated_delivery_minutes || (isDelivery ? 35 : 20));
  line(`Gewuenschte Zeit: ca. ${estMinutes} Minuten`);

  line('='.repeat(width));

  // 5. Customer & Delivery Address Details
  add(COMMANDS.ALIGN_LEFT);
  add(COMMANDS.BOLD_ON);
  line('KUNDENDETAILS:');
  add(COMMANDS.BOLD_OFF);

  line(`Name:    ${order.customer_name || 'Kunde'}`);

  if (order.customer_phone) {
    add(COMMANDS.BOLD_ON);
    add(COMMANDS.SIZE_DOUBLE_HEIGHT);
    line(`Tel:     ${order.customer_phone}`);
    add(COMMANDS.SIZE_NORMAL);
    add(COMMANDS.BOLD_OFF);
  }

  if (order.customer_email) {
    line(`E-Mail:  ${order.customer_email}`);
  }

  if (isDelivery) {
    line('');
    add(COMMANDS.BOLD_ON);
    line('LIEFERADRESSE:');
    add(COMMANDS.SIZE_DOUBLE_HEIGHT);
    line(`${order.street || 'Strasse fehlt'}`);
    line(`${order.zip_city || '08525 Plauen'}`);
    add(COMMANDS.SIZE_NORMAL);
    add(COMMANDS.BOLD_OFF);
  }

  // Check customer note / instructions
  if (order.note && String(order.note).trim()) {
    // Strip technical brackets if any
    const cleanNote = String(order.note)
      .replace(/\[E-Mail:[^\]]+\]/gi, '')
      .replace(/\[Zahlung:[^\]]+\]/gi, '')
      .replace(/\[TXN:[^\]]+\]/gi, '')
      .replace(/\[Mindermengenzuschlag:[^\]]+\]/gi, '')
      .trim();

    if (cleanNote) {
      line('');
      add(COMMANDS.BOLD_ON);
      line('KUNDENHINWEIS / ANMERKUNG:');
      add(COMMANDS.BOLD_OFF);
      wrapText(cleanNote, width, '  ').forEach(l => line(l));
    }
  }

  line('-'.repeat(width));

  // 6. Ordered Items Table
  add(COMMANDS.BOLD_ON);
  line(formatTwoColumns('BESTELLTE ARTIKEL', 'PREIS', width));
  line('-'.repeat(width));
  add(COMMANDS.BOLD_OFF);

  const items = Array.isArray(order.order_items) ? order.order_items : [];

  if (items.length === 0) {
    line('Keine Positionen angegeben');
  } else {
    items.forEach((it, idx) => {
      const qty = Number(it.quantity || 1);
      const name = it.item_name || it.name || 'Gericht';
      const size = it.selected_size || it.selectedSize || '';
      const price = formatEUR(it.total_price || (Number(it.unit_price || it.price || 0) * qty));

      // Main line: e.g. "1x Pizza Margherita (Ø 28cm)      8,50 EUR"
      const itemTitle = `${qty}x ${name}${size ? ` (${size})` : ''}`;

      add(COMMANDS.BOLD_ON);
      line(formatTwoColumns(itemTitle, price, width));
      add(COMMANDS.BOLD_OFF);

      // American Style Crust
      if (it.is_american || it.isAmerican) {
        line('   * American Style (Kaeserand)');
      }

      // Side dish
      const side = it.side_dish || it.sideDish || it.selectedSide;
      if (side) {
        line(`   * Beilage: ${side}`);
      }

      // Dressing
      const dressing = it.dressing || it.selectedDressing;
      if (dressing) {
        line(`   * Dressing: ${dressing}`);
      }

      // Toppings / Extras
      const toppings = Array.isArray(it.toppings_selected)
        ? it.toppings_selected
        : Array.isArray(it.selectedToppings)
        ? it.selectedToppings
        : [];

      // Filter out duplicate side/dressing from toppings
      const cleanToppings = toppings
        .map(t => typeof t === 'string' ? t.trim() : (t?.name || t?.label || String(t)))
        .filter(t => !/^beilage:\s*/i.test(t) && !/^dressing:\s*/i.test(t) && t !== '');

      if (cleanToppings.length > 0) {
        wrapText(`+ Extra: ${cleanToppings.join(', ')}`, width, '   ').forEach(l => line(l));
      }

      // Item special instructions
      const instructions = it.special_instructions || it.specialInstructions;
      if (instructions && String(instructions).trim()) {
        wrapText(`[Hinweis: ${String(instructions).trim()}]`, width, '   ').forEach(l => line(l));
      }

      // Small space between items if not last
      if (idx < items.length - 1) {
        line('');
      }
    });
  }

  line('-'.repeat(width));

  // 7. Totals & Charges Breakdown
  line(formatTwoColumns('Zwischensumme:', formatEUR(order.subtotal || 0), width));

  if (Number(order.delivery_fee) > 0) {
    line(formatTwoColumns('Lieferkosten:', formatEUR(order.delivery_fee), width));
  }

  if (Number(order.low_cart_fee) > 0) {
    line(formatTwoColumns('Mindermengenzuschlag:', formatEUR(order.low_cart_fee), width));
  }

  if (Number(order.tip) > 0) {
    line(formatTwoColumns('Trinkgeld:', formatEUR(order.tip), width));
  }

  if (Number(order.discount) > 0) {
    line(formatTwoColumns('Rabatt:', `-${formatEUR(order.discount)}`, width));
  }

  line('='.repeat(width));

  // Grand Total (Bold & Large)
  add(COMMANDS.BOLD_ON);
  add(COMMANDS.SIZE_DOUBLE);
  line(formatTwoColumns('GESAMT:', formatEUR(order.total || 0), Math.floor(width / 2)));
  add(COMMANDS.SIZE_NORMAL);
  add(COMMANDS.BOLD_OFF);

  line('='.repeat(width));

  // 8. Payment Method & Status
  const paymentMethod = String(order.payment_method || 'cash').toLowerCase();
  const paymentStatus = String(order.payment_status || '').toLowerCase();
  const isPaid = paymentStatus === 'paid' || paymentMethod === 'sumup' || paymentMethod === 'online' || paymentMethod === 'paypal';

  add(COMMANDS.ALIGN_CENTER);
  add(COMMANDS.BOLD_ON);
  if (paymentMethod === 'cash') {
    line('ZAHLUNGSART: BARZAHLUNG');
    add(COMMANDS.SIZE_DOUBLE);
    line(`>>> NOCH ZU ZAHLEN: ${formatEUR(order.total || 0)} <<<`);
    add(COMMANDS.SIZE_NORMAL);
  } else {
    line(`ZAHLUNGSART: ONLINE (${paymentMethod.toUpperCase()})`);
    add(COMMANDS.SIZE_DOUBLE);
    line('>>> BEREITS ONLINE BEZAHLT <<<');
    add(COMMANDS.SIZE_NORMAL);
  }
  add(COMMANDS.BOLD_OFF);

  line('='.repeat(width));

  // 9. Footer
  add(COMMANDS.ALIGN_CENTER);
  line('Vielen Dank fuer Ihre Bestellung!');
  line('Guten Appetit wuenscht');
  add(COMMANDS.BOLD_ON);
  line(storeInfo.name);
  add(COMMANDS.BOLD_OFF);
  line('');

  // 10. Feed & Paper Cut
  if (cutPaper) {
    add(COMMANDS.PARTIAL_CUT);
  } else {
    add(COMMANDS.FEED_5_LINES);
  }

  return Buffer.concat(chunks);
}

/**
 * Build a quick Test Receipt Buffer to verify printer connectivity and hardware
 */
export function buildTestReceiptBuffer(printerName = 'ZJ-8330-L', options = {}) {
  const width = options.paperWidth === 58 ? WIDTH_58MM : WIDTH_80MM;
  const chunks = [];

  function add(buf) { chunks.push(buf); }
  function line(str = '') { add(encodeCP437(str)); add(COMMANDS.FEED_LINE); }

  add(COMMANDS.INIT);
  add(COMMANDS.SELECT_CP437);
  add(COMMANDS.ALIGN_CENTER);

  add(COMMANDS.BOLD_ON);
  add(COMMANDS.SIZE_DOUBLE);
  line('VENEZIA PIZZA');
  line('TESTDRUCK / BON');
  add(COMMANDS.SIZE_NORMAL);
  add(COMMANDS.BOLD_OFF);

  line('='.repeat(width));
  const now = new Date();
  line(`Datum: ${now.toLocaleDateString('de-DE')} ${now.toLocaleTimeString('de-DE')}`);
  line(`Drucker: ${printerName}`);
  line(`Papierbreite: ${width === WIDTH_80MM ? '80 mm (48 Zeichen)' : '58 mm (32 Zeichen)'}`);
  line('-'.repeat(width));

  add(COMMANDS.ALIGN_LEFT);
  line('Deutsche Umlaute Test:');
  line('  ä ö ü Ä Ö Ü ß');
  line('  Größe, Döner, Käse, Soße, Menü');
  line('-'.repeat(width));

  add(COMMANDS.ALIGN_CENTER);
  add(COMMANDS.BOLD_ON);
  line('*** DRUCKER BEREIT & VERBUNDEN ***');
  add(COMMANDS.BOLD_OFF);
  line('Automatische Bon-Ausgabe aktiv');
  line('='.repeat(width));

  add(COMMANDS.PARTIAL_CUT);

  return Buffer.concat(chunks);
}
