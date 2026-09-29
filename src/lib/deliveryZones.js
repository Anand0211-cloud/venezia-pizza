/**
 * Venezia Pizza Service - Delivery Zones & Fee Configuration
 *
 * Central configuration for postcode-based delivery fee calculations and minimum order values.
 */

export const MIN_ORDER_DELIVERY = 15.00; // €15.00 minimum order value for delivery

export const DELIVERY_ZONES_CONFIG = [
  {
    id: 'zone_1',
    name: 'Zone 1 (Plauen & Neundorf)',
    fee: 15.00,
    minOrder: 15.00,
    postcodes: ['08525', '08523', '08527'],
    entries: [
      { plz: '08525', areas: ['Plauen', 'Kauschwitz', 'Zwochwitz'] },
      { plz: '08523', areas: ['Plauen'] },
      { plz: '08527', areas: ['Plauen-Neundorf', 'Neundorf'], isNeundorfOnly: true }
    ]
  },
  {
    id: 'zone_2',
    name: 'Zone 2 (Umland Plauen)',
    fee: 30.00,
    minOrder: 15.00,
    postcodes: ['08541', '08547', '08548', '08539', '08527'],
    entries: [
      { plz: '08541', areas: ['Neuensalz', 'Theuma', 'Möschwitz', 'Großfriesen'] },
      { plz: '08547', areas: ['Jößnitz'] },
      { plz: '08548', areas: ['Syrau'] },
      { plz: '08539', areas: ['Mehltheuer'] },
      { plz: '08527', areas: ['Tiergarten', 'Straßberg', 'Meßbach', 'Stöckigt', 'Oberlosa', 'Unterlosa'] }
    ]
  },
  {
    id: 'zone_3',
    name: 'Zone 3 (Jocketa / Pöhl)',
    fee: 35.00,
    minOrder: 15.00,
    postcodes: ['08543'],
    entries: [
      { plz: '08543', areas: ['Jocketa', 'Pöhl'] }
    ]
  },
  {
    id: 'zone_4',
    name: 'Zone 4 (Vogtland Umland)',
    fee: 45.00,
    minOrder: 15.00,
    postcodes: ['08606', '07952', '07985', '07919', '08538'],
    entries: [
      { plz: '08606', areas: ['Oelsnitz'] },
      { plz: '07952', areas: ['Pausa'] },
      { plz: '07985', areas: ['Elsterberg'] },
      { plz: '07919', areas: ['Mühltroff'] },
      { plz: '08538', areas: ['Weischlitz'] }
    ]
  }
];

export const ALL_SUPPORTED_AREAS = [
  { plz: '08525', city: 'Plauen', fee: 15.00, zone: 'Zone 1' },
  { plz: '08525', city: 'Kauschwitz', fee: 15.00, zone: 'Zone 1' },
  { plz: '08525', city: 'Zwochwitz', fee: 15.00, zone: 'Zone 1' },
  { plz: '08523', city: 'Plauen', fee: 15.00, zone: 'Zone 1' },
  { plz: '08527', city: 'Plauen-Neundorf', fee: 15.00, zone: 'Zone 1' },
  { plz: '08541', city: 'Neuensalz', fee: 30.00, zone: 'Zone 2' },
  { plz: '08547', city: 'Jößnitz', fee: 30.00, zone: 'Zone 2' },
  { plz: '08548', city: 'Syrau', fee: 30.00, zone: 'Zone 2' },
  { plz: '08539', city: 'Mehltheuer', fee: 30.00, zone: 'Zone 2' },
  { plz: '08527', city: 'Tiergarten', fee: 30.00, zone: 'Zone 2' },
  { plz: '08527', city: 'Straßberg', fee: 30.00, zone: 'Zone 2' },
  { plz: '08527', city: 'Meßbach', fee: 30.00, zone: 'Zone 2' },
  { plz: '08527', city: 'Stöckigt', fee: 30.00, zone: 'Zone 2' },
  { plz: '08541', city: 'Theuma', fee: 30.00, zone: 'Zone 2' },
  { plz: '08541', city: 'Möschwitz', fee: 30.00, zone: 'Zone 2' },
  { plz: '08527', city: 'Oberlosa', fee: 30.00, zone: 'Zone 2' },
  { plz: '08527', city: 'Unterlosa', fee: 30.00, zone: 'Zone 2' },
  { plz: '08541', city: 'Großfriesen', fee: 30.00, zone: 'Zone 2' },
  { plz: '08543', city: 'Jocketa, Pöhl', fee: 35.00, zone: 'Zone 3' },
  { plz: '08606', city: 'Oelsnitz', fee: 45.00, zone: 'Zone 4' },
  { plz: '07952', city: 'Pausa', fee: 45.00, zone: 'Zone 4' },
  { plz: '07985', city: 'Elsterberg', fee: 45.00, zone: 'Zone 4' },
  { plz: '07919', city: 'Mühltroff', fee: 45.00, zone: 'Zone 4' },
  { plz: '08538', city: 'Weischlitz', fee: 45.00, zone: 'Zone 4' }
];

/**
 * Normalizes a German postcode: removes spaces/non-digits, ensures 5 digits.
 */
export function normalizePostcode(raw) {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '').trim().slice(0, 5);
}

/**
 * Normalizes city/street string for case-insensitive and umlaut-tolerant matching.
 */
export function normalizeCityString(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Detects the delivery zone and fee for a given postcode and city/address.
 * Handles the special case where 08527 Plauen-Neundorf is €15.00, while
 * other 08527 areas (Tiergarten, Straßberg, Meßbach, Stöckigt, Oberlosa, Unterlosa) are €30.00.
 *
 * @param {string} rawPlz - 5-digit postcode (e.g. '08525')
 * @param {string} rawCity - City or area name (e.g. 'Plauen' or 'Plauen-Neundorf')
 * @returns {object} { isDeliverable, fee, minOrder, zoneId, zoneName, areaName, error }
 */
export function getDeliveryZone(rawPlz, rawCity = '') {
  const plz = normalizePostcode(rawPlz);
  const normCity = normalizeCityString(rawCity);

  // If postcode is incomplete or missing
  if (!plz || plz.length < 5) {
    return {
      isDeliverable: false,
      fee: 0,
      minOrder: MIN_ORDER_DELIVERY,
      zoneId: null,
      zoneName: null,
      areaName: null,
      error: 'Bitte geben Sie eine gültige 5-stellige Postleitzahl ein.'
    };
  }

  // --- SPECIAL CASE: 08527 ---
  // If city/address explicitly mentions "Neundorf" or "Plauen-Neundorf", it is Zone 1 (€15.00).
  // Otherwise, all other 08527 areas (Tiergarten, Straßberg, Meßbach, etc.) belong to Zone 2 (€30.00).
  if (plz === '08527') {
    if (normCity.includes('neundorf')) {
      return {
        isDeliverable: true,
        fee: 15.00,
        minOrder: 15.00,
        zoneId: 'zone_1',
        zoneName: 'Zone 1 (Plauen-Neundorf)',
        areaName: 'Plauen-Neundorf',
        error: null
      };
    }

    // Identify specific Zone 2 area if matched
    let areaName = 'Tiergarten / Straßberg / Stöckigt (08527)';
    if (normCity.includes('tiergarten')) areaName = 'Tiergarten';
    else if (normCity.includes('strass') || normCity.includes('strassberg')) areaName = 'Straßberg';
    else if (normCity.includes('messbach')) areaName = 'Meßbach';
    else if (normCity.includes('stoeckigt') || normCity.includes('stockigt')) areaName = 'Stöckigt';
    else if (normCity.includes('oberlosa')) areaName = 'Oberlosa';
    else if (normCity.includes('unterlosa')) areaName = 'Unterlosa';

    return {
      isDeliverable: true,
      fee: 30.00,
      minOrder: 15.00,
      zoneId: 'zone_2',
      zoneName: 'Zone 2 (Umland Plauen)',
      areaName: areaName,
      error: null
    };
  }

  // --- ZONE 1: €15.00 ---
  // 08525 Plauen, Kauschwitz, Zwochwitz; 08523 Plauen
  if (plz === '08525' || plz === '08523') {
    let areaName = 'Plauen';
    if (normCity.includes('kauschwitz')) areaName = 'Kauschwitz';
    else if (normCity.includes('zwochwitz')) areaName = 'Zwochwitz';

    return {
      isDeliverable: true,
      fee: 15.00,
      minOrder: 15.00,
      zoneId: 'zone_1',
      zoneName: 'Zone 1 (Plauen)',
      areaName: `${areaName} (${plz})`,
      error: null
    };
  }

  // --- ZONE 2: €30.00 ---
  // 08541 Neuensalz, Theuma, Möschwitz, Großfriesen
  // 08547 Jößnitz, 08548 Syrau, 08539 Mehltheuer
  if (plz === '08541' || plz === '08547' || plz === '08548' || plz === '08539') {
    let areaName = 'Umland Plauen';
    if (plz === '08541') {
      if (normCity.includes('neuensalz')) areaName = 'Neuensalz';
      else if (normCity.includes('theuma')) areaName = 'Theuma';
      else if (normCity.includes('moeschwitz') || normCity.includes('moschwitz')) areaName = 'Möschwitz';
      else if (normCity.includes('grossfriesen') || normCity.includes('gross')) areaName = 'Großfriesen';
      else areaName = 'Neuensalz / Theuma / Möschwitz';
    } else if (plz === '08547') {
      areaName = 'Jößnitz';
    } else if (plz === '08548') {
      areaName = 'Syrau';
    } else if (plz === '08539') {
      areaName = 'Mehltheuer';
    }

    return {
      isDeliverable: true,
      fee: 30.00,
      minOrder: 15.00,
      zoneId: 'zone_2',
      zoneName: 'Zone 2 (Umland Plauen)',
      areaName: `${areaName} (${plz})`,
      error: null
    };
  }

  // --- ZONE 3: €35.00 ---
  // 08543 Jocketa, Pöhl
  if (plz === '08543') {
    let areaName = 'Jocketa, Pöhl';
    if (normCity.includes('jocketa')) areaName = 'Jocketa';
    else if (normCity.includes('poehl') || normCity.includes('pohl')) areaName = 'Pöhl';

    return {
      isDeliverable: true,
      fee: 35.00,
      minOrder: 15.00,
      zoneId: 'zone_3',
      zoneName: 'Zone 3 (Jocketa / Pöhl)',
      areaName: `${areaName} (${plz})`,
      error: null
    };
  }

  // --- ZONE 4: €45.00 ---
  // 08606 Oelsnitz, 07952 Pausa, 07985 Elsterberg, 07919 Mühltroff, 08538 Weischlitz
  if (['08606', '07952', '07985', '07919', '08538'].includes(plz)) {
    let areaName = 'Vogtland';
    if (plz === '08606') areaName = 'Oelsnitz';
    else if (plz === '07952') areaName = 'Pausa';
    else if (plz === '07985') areaName = 'Elsterberg';
    else if (plz === '07919') areaName = 'Mühltroff';
    else if (plz === '08538') areaName = 'Weischlitz';

    return {
      isDeliverable: true,
      fee: 45.00,
      minOrder: 15.00,
      zoneId: 'zone_4',
      zoneName: 'Zone 4 (Erweitertes Umland)',
      areaName: `${areaName} (${plz})`,
      error: null
    };
  }

  // --- UNSUPPORTED POSTCODE ---
  return {
    isDeliverable: false,
    fee: 0,
    minOrder: MIN_ORDER_DELIVERY,
    zoneId: null,
    zoneName: null,
    areaName: null,
    error: 'Leider liefern wir nicht in diese Region.'
  };
}
