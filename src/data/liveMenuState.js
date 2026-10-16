import { useState, useEffect } from 'react';
import { getMenuItems, subscribeToMenuItems } from '../lib/supabaseClient.js';
import { allMenuItems as localMenuItems, specialOffersData } from './menuData.js';
import { images } from '../assets/images.js';

export function getFallbackImage(cat, name = '', toppings = '') {
  const n = `${name} ${toppings}`.toLowerCase();
  if (cat === 'deals') {
    if (n.includes('familie') || n.includes('a1')) return images.offers.a1;
    if (n.includes('party') || n.includes('a2')) return images.offers.a2;
    return images.offers.a3;
  }
  if (cat === 'pizza') {
    if (n.includes('salami')) return images.pizzas.salami;
    if (n.includes('schinken') || n.includes('prosciutto')) return images.pizzas.prosciutto;
    if (n.includes('thunfisch') || n.includes('tonno')) return images.pizzas.tonno;
    if (n.includes('calzone') || n.includes('venezia') || n.includes('special')) return images.pizzas.special;
    return images.pizzas.margherita;
  }
  if (cat === 'calzone') return images.categories.calzone;
  if (cat === 'pasta') return images.dishes.pastaSpecial;
  if (cat === 'doner') return images.categories.doner;
  if (cat === 'burger-snacks') return images.dishes.burgerCrispy;
  if (cat === 'schnitzel') return images.dishes.schnitzel;
  if (cat === 'salad') return images.categories.salad;
  if (cat === 'dessert-drinks') return images.dishes.tiramisu;
  return images.heroPizza;
}

export function getItemCanonicalCategory(item) {
  if (!item) return 'pizzen';
  if (item.id?.startsWith('A') || item.id?.startsWith('offer-') || item.category_id === 'deals' || item.category === 'deals') {
    return 'deals';
  }
  if (item.prices?.frontend_category) return item.prices.frontend_category;
  if (item.frontend_category) return item.frontend_category;
  const cat = String(item.category_id || item.category || '').toLowerCase().trim();
  const name = String(item.name_de || item.name || '').toLowerCase();
  const id = String(item.id || '').toLowerCase();

  // Direct category matching if explicitly set on item
  if (cat === 'pasta') return 'pasta';
  if (cat === 'reisgerichte') return 'reisgerichte';
  if (cat === 'salate' || cat === 'salad') return 'salate';
  if (cat === 'beilagen') return 'beilagen';
  if (cat === 'chinesisch') return 'chinesisch';
  if (cat === 'indisch') return 'indisch';
  if (cat === 'manzo-vom-rind' || cat === 'manzo' || cat === 'rind') return 'manzo-vom-rind';
  if (cat === 'pesce-fisch' || cat === 'pesce' || cat === 'fisch') return 'pesce-fisch';

  // 1. Pizzas & Calzones (only pizza/calzone)
  if (
    cat === 'pizzen' ||
    cat === 'pizza' ||
    cat === 'calzone' ||
    id.startsWith('pizza-') ||
    id.startsWith('calzone-') ||
    name.startsWith('pizza ') ||
    name.startsWith('calzone ') ||
    name === 'pizza' ||
    name === 'calzone'
  ) {
    return 'pizzen';
  }

  // 2. Pasta (Includes all 9 pasta dishes)
  if (
    cat === 'pasta' ||
    (id.startsWith('pasta-') && cat !== 'pasta-al-forno') ||
    name.startsWith('spaghetti') ||
    name.startsWith('rigatoni') ||
    name.startsWith('tortellini') ||
    name.startsWith('tagliatelle') ||
    name.startsWith('penne') ||
    name.startsWith('maccheroni')
  ) {
    return 'pasta';
  }

  // 3. Pasta al Forno (Überbackene Nudelgerichte)
  if (
    cat === 'pasta-al-forno' ||
    cat === 'al-forno' ||
    name.includes('al forno') ||
    name.includes('lasagne') ||
    name.includes('cannelloni') ||
    name.includes('überbackene nudeln')
  ) {
    return 'pasta-al-forno';
  }

  // 4. Gnocchi
  if (cat === 'gnocchi' || name.includes('gnocchi')) {
    return 'gnocchi';
  }

  // 5. Reisgerichte
  if (cat === 'reisgerichte' || cat === 'reis' || name.includes('reisgericht') || name.includes('risotto')) {
    return 'reisgerichte';
  }

  // 6. Vegetarisch überbacken
  if (cat === 'vegetarisch' || cat === 'vegetarisch-ueberbacken' || name.includes('vegetarisch überbacken')) {
    return 'vegetarisch';
  }

  // 7. Aufläufe
  if (cat === 'auflaeufe' || cat === 'auflauf' || name.includes('auflauf') || name.includes('gratin')) {
    return 'auflaeufe';
  }

  // 8. Fleischgerichte & Schnitzel
  if (
    cat === 'fleischgerichte' ||
    cat === 'schnitzel' ||
    cat === 'fleisch' ||
    cat === 'fischgerichte' ||
    cat === 'fisch' ||
    id.startsWith('fisch-') ||
    name.includes('schnitzel') ||
    name.includes('cordon bleu')
  ) {
    return 'fleischgerichte';
  }

  // 9. Gyros & Döner
  if (
    cat === 'gyros' ||
    cat === 'doner' ||
    cat === 'döner' ||
    name.includes('gyros') ||
    name.includes('döner') ||
    name.includes('doner')
  ) {
    return 'gyros';
  }

  // 10. Salate
  if (cat === 'salate' || cat === 'salad' || name.includes('salat')) {
    return 'salate';
  }

  // 11. Grill Menü
  if (cat === 'grill-menue' || cat === 'grill' || name.includes('grill-teller') || name.includes('vom rost')) {
    return 'grill-menue';
  }

  // 12. American Food & Burgers
  if (
    cat === 'american-food' ||
    cat === 'burger-snacks' ||
    cat === 'burger' ||
    name.includes('burger') ||
    name.includes('chicken wings') ||
    name.includes('nuggets') ||
    name.includes('fingerfood')
  ) {
    return 'american-food';
  }

  // 13. Indische Hauptgerichte
  if (
    cat === 'indisch' ||
    cat === 'indian' ||
    name.includes('curry') ||
    name.includes('tikka') ||
    name.includes('korma') ||
    name.includes('biryani') ||
    name.includes('paneer')
  ) {
    return 'indisch';
  }

  // 14. Lamm Spezialitäten
  if (cat === 'lamm' || cat === 'lamb' || name.includes('lammfleisch') || name.includes('lamm ')) {
    return 'lamm';
  }

  // 15. Steaks
  if (cat === 'steaks' || cat === 'steak' || name.includes('rumpsteak') || name.includes('hüftsteak') || name.includes('steak')) {
    return 'steaks';
  }


  // 17. Mexikanisch
  if (
    cat === 'mexikanisch' ||
    cat === 'mexican' ||
    name.includes('tacos') ||
    name.includes('burrito') ||
    name.includes('enchilada') ||
    name.includes('fajita') ||
    name.includes('nachos') ||
    name.includes('quesadilla')
  ) {
    return 'mexikanisch';
  }

  // 18. Chinesisch
  if (
    cat === 'chinesisch' ||
    cat === 'chinese' ||
    cat === 'asia' ||
    name.includes('chop suey') ||
    name.includes('gebratene nudeln') ||
    name.includes('gebratener reis') ||
    name.includes('bami goreng') ||
    name.includes('nasi goreng') ||
    name.includes('süß-sauer')
  ) {
    return 'chinesisch';
  }

  // 19. Extra Beilagen
  if (
    cat === 'beilagen' ||
    cat === 'extra-beilagen' ||
    name.includes('pommes') ||
    name.includes('kroketten') ||
    name.includes('knoblauchbrot') ||
    name.includes('zaziki') ||
    name.includes('tzatziki') ||
    name.includes('pizzabrötchen') ||
    name.includes('sauce') ||
    name.includes('dip')
  ) {
    return 'beilagen';
  }

  // 20. Toasts
  if (cat === 'toasts' || cat === 'toast' || name.includes('toast')) {
    return 'toasts';
  }

  // 21. Omelette
  if (cat === 'omelette' || name.includes('omelett')) {
    return 'omelette';
  }

  // 22. Getränke & Desserts
  if (
    cat === 'getraenke' ||
    cat === 'drinks' ||
    cat === 'dessert-drinks' ||
    name.includes('cola') ||
    name.includes('fanta') ||
    name.includes('sprite') ||
    name.includes('wasser') ||
    name.includes('bier') ||
    name.includes('wein') ||
    name.includes('tiramisu') ||
    name.includes('dessert')
  ) {
    return 'getraenke';
  }

  return 'pizzen';
}

// Convert Supabase database row to frontend menu item format
export function formatMenuItemFromDb(dbItem, localMap) {
  const local = localMap ? localMap.get(dbItem.id) : null;
  const isDeal = dbItem.id?.startsWith('A') || dbItem.id?.startsWith('offer-') || dbItem.category_id === 'deals' || local?.category === 'deals';
  const category = isDeal ? 'deals' : getItemCanonicalCategory({ ...local, ...dbItem });

  const hasCustomImage = !!(dbItem.image_url && typeof dbItem.image_url === 'string' && dbItem.image_url.trim() !== '');

  let rawImage = dbItem.image_url || local?.image;
  if (!dbItem.image_url && (isDeal || dbItem.id === 'A1' || dbItem.id === 'A2' || dbItem.id === 'A3')) {
    if (dbItem.id === 'A1' || dbItem.number === 'A1') rawImage = images.offers.a1;
    else if (dbItem.id === 'A2' || dbItem.number === 'A2') rawImage = images.offers.a2;
    else if (dbItem.id === 'A3' || dbItem.number === 'A3') rawImage = images.offers.a3;
  }
  const image = hasCustomImage ? dbItem.image_url : (rawImage || (local?.image || getFallbackImage(category === 'pizzen' ? 'pizza' : category, dbItem.name_de || dbItem.name, dbItem.toppings_de)));

  // Use prices object from DB if it exists, otherwise fallback to local
  let prices = dbItem.prices || local?.prices || null;

  // Unit price from DB (fallback to local or single/small price)
  const unitPrice = typeof dbItem.price === 'number'
    ? dbItem.price
    : (prices?.single || prices?.small || (prices ? Object.values(prices)[0] : null) || local?.price || 9.0);

  const sizesAvailable = dbItem.sizes_available ?? local?.sizesAvailable ?? (category === 'pizza');
  const calzoneSizes = dbItem.calzone_sizes ?? local?.calzoneSizes ?? (category === 'calzone');

  // If prices object is empty or missing, construct defaults
  if (!prices || typeof prices !== 'object' || Object.keys(prices).length === 0) {
    if (sizesAvailable) {
      const base = unitPrice;
      prices = {
        small: Number(base.toFixed(2)),
        large: Number((base * 1.20).toFixed(2)),
        family: Number((base * 2.067).toFixed(2)),
        party: Number((base * 2.522).toFixed(2)),
        single: Number(base.toFixed(2))
      };
    } else if (calzoneSizes) {
      const base = unitPrice;
      prices = {
        small: Number(base.toFixed(2)),
        large: Number((base * 1.18).toFixed(2)),
        single: Number(base.toFixed(2))
      };
    } else {
      prices = { single: unitPrice };
    }
  }

  // Extract multiple images (synced from Supabase in prices.images or images column)
  let rawImages = [];
  if (Array.isArray(dbItem.prices?.images) && dbItem.prices.images.length > 0) {
    rawImages = dbItem.prices.images;
  } else if (Array.isArray(dbItem.images) && dbItem.images.length > 0) {
    rawImages = dbItem.images;
  } else if (dbItem.image_url && typeof dbItem.image_url === 'string' && dbItem.image_url.trim() !== '') {
    rawImages = [dbItem.image_url];
  } else if (image) {
    rawImages = [image];
  }
  const cleanImagesList = rawImages.filter(img => typeof img === 'string' && img.trim() !== '');

  const rawNumber = dbItem.number || local?.number || local?.code || '';
  const cleanNumber = (String(rawNumber).toLowerCase().startsWith('dish-') || String(rawNumber).toLowerCase().startsWith('offer-'))
    ? ''
    : rawNumber;

  let rawBadge = (dbItem.badge !== undefined && dbItem.badge !== null) ? dbItem.badge : (local?.badge ?? '');
  let sanitizedBadge = rawBadge;
  if (typeof sanitizedBadge === 'string' && (sanitizedBadge.toLowerCase().includes('dish-') || sanitizedBadge.toLowerCase().includes('offer-'))) {
    sanitizedBadge = sanitizedBadge.replace(/\b(dish|offer)-[a-zA-Z0-9_\-]+/gi, '').trim();
    if (!sanitizedBadge || sanitizedBadge.toLowerCase() === 'angebot' || sanitizedBadge.toLowerCase() === 'offer') {
      sanitizedBadge = isDeal ? 'Angebot' : '';
    }
  }

  return {
    id: dbItem.id,
    number: cleanNumber,
    category,
    name: dbItem.name_de || dbItem.name || local?.name || local?.title || '',
    name_en: dbItem.name_en || local?.name_en || local?.name || '',
    toppings: dbItem.toppings_de || dbItem.toppings || local?.toppings || local?.description || '',
    desc: dbItem.desc_de || dbItem.desc || local?.desc || local?.details || '',
    prices,
    price: unitPrice,
    image: cleanImagesList[0] || image,
    image_url: cleanImagesList[0] || dbItem.image_url || image,
    images: cleanImagesList.length > 0 ? cleanImagesList : (image ? [image] : []),
    has_custom_image: !!(dbItem.image_url && !dbItem.image_url.includes('Artboard_')),
    badge: sanitizedBadge,
    dietary: dbItem.dietary || local?.dietary || [],
    sizesAvailable,
    calzoneSizes,
    supportsAmerican: dbItem.supports_american ?? local?.supportsAmerican ?? false,
    allowed_toppings: dbItem.prices?.allowed_toppings !== undefined
      ? dbItem.prices.allowed_toppings
      : (Array.isArray(dbItem.allowed_toppings) ? dbItem.allowed_toppings : (local?.allowed_toppings || null)),
    is_in_stock: dbItem.is_in_stock !== false,
    stock_quantity: dbItem.stock_quantity ?? 100,
    preparation_time_minutes: dbItem.preparation_time_minutes ?? 20
  };
}

// Global BroadcastChannel for instant cross-tab updates without needing page refresh
let menuBroadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    menuBroadcastChannel = new BroadcastChannel('venezia-menu-sync');
  } catch (err) {
    // fallback to storage events
  }
}

// Global notification trigger for instant cross-component & cross-tab updates
export function notifyMenuUpdated() {
  if (typeof window !== 'undefined') {
    // 1. Current window custom event
    window.dispatchEvent(new CustomEvent('venezia-menu-updated'));

    // 2. BroadcastChannel to all open browser tabs/windows
    if (menuBroadcastChannel) {
      try {
        menuBroadcastChannel.postMessage({ type: 'menu-updated', timestamp: Date.now() });
      } catch (err) {}
    }

    // 3. LocalStorage storage event as reliable cross-tab fallback
    try {
      localStorage.setItem('venezia_menu_sync_trigger', Date.now().toString());
    } catch (err) {}
  }
}

// Clear stale caches and sanitize local overrides immediately
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('venezia_live_menu_cache');
    localStorage.removeItem('venezia_live_menu_cache_v2');

    const rawOverrides = localStorage.getItem('venezia_admin_dishes_override');
    if (rawOverrides) {
      const parsed = JSON.parse(rawOverrides);
      let changed = false;
      for (const id in parsed) {
        if (parsed[id]?.image && !parsed[id].image.startsWith('http') && !parsed[id].image.startsWith('/images/dishes/')) {
          delete parsed[id].image;
          delete parsed[id].image_url;
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem('venezia_admin_dishes_override', JSON.stringify(parsed));
      }
    }
  } catch (e) {}
}

// Initial combined fallback list from static files (used only until Supabase responds)
function getInitialLocalMenu() {
  const dealsFormatted = specialOffersData.map(d => ({
    id: d.id,
    number: d.code,
    category: 'deals',
    name: d.title,
    name_en: d.title,
    toppings: d.description,
    desc: d.details || d.description,
    price: d.price,
    prices: { single: d.price },
    image: d.image,
    badge: 'Angebot',
    dietary: [],
    sizesAvailable: false,
    calzoneSizes: false,
    supportsAmerican: false,
    is_in_stock: true,
    preparation_time_minutes: 25
  }));
  return [...dealsFormatted, ...localMenuItems];
}

// Module-level singleton store for live menu
let globalMenuItems = getInitialLocalMenu();
let globalLoading = false;
let hasInitialized = false;
let activeFetchPromise = null;
const subscribers = new Set();

function notifySubscribers() {
  const snapshot = { menuItems: [...globalMenuItems], loading: globalLoading };
  subscribers.forEach(cb => {
    try { cb(snapshot); } catch (err) {
      console.error('[LiveMenu] Error in subscriber callback:', err);
    }
  });
}

export async function fetchLiveMenuGlobal(force = false) {
  if (activeFetchPromise && !force) return activeFetchPromise;

  const currentPromise = (async () => {
    try {
      globalLoading = true;
      console.log('[LiveMenu] Fetching menu from Supabase...');
      const data = await getMenuItems();
      console.log('[LiveMenu] Supabase returned', data ? data.length : 0, 'items');

      if (data && data.length > 0) {
        const dbPizza1 = data.find(i => i.id === 'pizza-1');
        if (dbPizza1) {
          console.log('[LiveMenu] DB pizza-1 image_url:', dbPizza1.image_url);
        }

        const localMap = new Map((localMenuItems || []).filter(i => i && i.id).map(i => [i.id, i]));
        const formatted = [];
        const errors = [];

        for (const item of data) {
          try {
            formatted.push(formatMenuItemFromDb(item, localMap));
          } catch (itemErr) {
            console.error('[LiveMenu] Error formatting item', item.id, ':', itemErr);
            errors.push({ id: item.id, error: itemErr.message });
          }
        }

        if (errors.length > 0 && typeof window !== 'undefined') {
          window.__liveMenuErrors = errors;
        }

        const fmtPizza1 = formatted.find(i => i.id === 'pizza-1');
        if (fmtPizza1) {
          console.log('[LiveMenu] Formatted pizza-1 image_url:', fmtPizza1.image_url);
        }

        if (formatted.length > 0) {
          globalMenuItems = formatted;
          console.log('[LiveMenu] globalMenuItems updated with', formatted.length, 'items');
          notifySubscribers();
          return formatted;
        }
      } else {
        console.warn('[LiveMenu] Supabase returned empty/null data');
        if (typeof window !== 'undefined') {
          window.__liveMenuErrors = [{ id: 'FETCH', error: 'getMenuItems returned ' + (data === null ? 'null' : 'empty array') }];
        }
      }
    } catch (err) {
      console.error('[LiveMenu] FATAL: Could not fetch live menu from Supabase:', err);
      if (typeof window !== 'undefined') {
        window.__liveMenuErrors = [{ id: 'FATAL', error: err.message }];
      }
    } finally {
      globalLoading = false;
      if (activeFetchPromise === currentPromise) {
        activeFetchPromise = null;
      }
      notifySubscribers();
    }
    return globalMenuItems;
  })();

  activeFetchPromise = currentPromise;
  return currentPromise;
}

function initGlobalMenuListener() {
  if (hasInitialized || typeof window === 'undefined') return;
  hasInitialized = true;

  fetchLiveMenuGlobal();

  // 1. Listen to in-window updates (e.g. from AdminPanel save)
  window.addEventListener('venezia-menu-updated', () => {
    fetchLiveMenuGlobal(true);
  });

  // 2. Listen to cross-tab updates via BroadcastChannel
  if (menuBroadcastChannel) {
    menuBroadcastChannel.onmessage = (event) => {
      if (event?.data?.type === 'menu-updated') {
        fetchLiveMenuGlobal(true);
      }
    };
  }

  // 3. Listen to cross-tab updates via localStorage storage event
  window.addEventListener('storage', (event) => {
    if (event.key === 'venezia_menu_sync_trigger') {
      fetchLiveMenuGlobal(true);
    }
  });

  // 4. Subscribe once to menu_items table
  subscribeToMenuItems(() => {
    fetchLiveMenuGlobal(true);
  });
}

export function useLiveMenu() {
  const [state, setState] = useState(() => {
    initGlobalMenuListener();
    return { menuItems: [...globalMenuItems], loading: globalLoading };
  });

  useEffect(() => {
    initGlobalMenuListener();

    // If globalMenuItems already has fresh items, sync state immediately
    if (globalMenuItems && globalMenuItems.length > 0) {
      setState({ menuItems: [...globalMenuItems], loading: globalLoading });
    }

    const handler = (newState) => {
      console.log('[LiveMenu] Subscriber notified, updating component state with', newState.menuItems.length, 'items');
      setState({ menuItems: [...newState.menuItems], loading: newState.loading });
    };
    subscribers.add(handler);

    // Direct fetch guarantee: always fetch fresh from DB and update this hook's state directly
    fetchLiveMenuGlobal(true).then((items) => {
      if (items && items.length > 0) {
        console.log('[LiveMenu] Direct fetch resolved in hook, updating state with', items.length, 'items');
        setState({ menuItems: [...items], loading: false });
      }
    });

    return () => {
      subscribers.delete(handler);
    };
  }, []);

  return {
    menuItems: state.menuItems,
    loading: state.loading,
    refreshMenu: () => fetchLiveMenuGlobal(true)
  };
}

export function getSideDishType(item) {
  if (!item) return null;

  const id = String(item.id || '').toLowerCase();
  const name = String(item.name_de || item.name || item.title || '').toLowerCase();
  const num = String(item.number || '').trim();

  // Exclude "Pizza Gyros" / "Pizza Gyrosa" (No. 33) specifically - it is a pizza and must never have side dishes
  if (
    id === 'pizza-33' ||
    (num === '33' && (id.startsWith('pizza') || name.includes('pizza'))) ||
    name === 'pizza gyros' ||
    name === 'pizza gyrosa' ||
    name.startsWith('pizza gyros') ||
    name.startsWith('pizza gyrosa')
  ) {
    return null;
  }

  // Exclude Pasta & Noodle dishes (Tortellini, Spaghetti, Rigatoni, etc. - e.g. No. 58 Tortellini mit Putenfleisch)
  const canonical = getItemCanonicalCategory(item);
  const cat = String(item.category_id || item.category || '').toLowerCase().trim();
  if (
    canonical === 'pasta' ||
    canonical === 'pasta-al-forno' ||
    canonical === 'gnocchi' ||
    cat === 'pasta' ||
    cat === 'pasta-al-forno' ||
    cat === 'gnocchi' ||
    id.startsWith('pasta-') ||
    id === 'gnocchi-al-forno' ||
    num === '58' ||
    name.startsWith('tortellini') ||
    name.startsWith('spaghetti') ||
    name.startsWith('rigatoni') ||
    name.startsWith('tagliatelle') ||
    name.startsWith('penne') ||
    name.startsWith('maccheroni') ||
    name.includes('tortellini mit putenfleisch')
  ) {
    return null;
  }

  if (canonical === 'chinesisch') return null;
  if (cat === 'chinesisch' || cat === 'chinese' || cat === 'asia') return null;

  if (id.startsWith('asia-') || id.startsWith('chinesisch-')) return null;

  if (
    name.includes('gebratene nudeln') ||
    name.includes('chop suey') ||
    name.includes('bami goreng') ||
    name.includes('nasi goreng') ||
    name.includes('süß-sauer')
  ) {
    return null;
  }

  if (canonical === 'indisch' || canonical === 'lamm') return 'indian_lamb';
  if (canonical === 'fleischgerichte' || canonical === 'gyros') return 'meat_gyros';
  if (canonical === 'manzo-vom-rind' || canonical === 'pesce-fisch') return 'manzo_pesce';

  if (cat === 'indisch' || cat === 'lamm' || cat === 'indian' || cat === 'lamb') return 'indian_lamb';
  if (
    cat === 'fleischgerichte' ||
    cat === 'gyros' ||
    cat === 'schnitzel' ||
    cat === 'doner' ||
    cat === 'döner'
  ) {
    return 'meat_gyros';
  }
  if (
    cat === 'manzo-vom-rind' ||
    cat === 'manzo' ||
    cat === 'rind' ||
    cat === 'pesce-fisch' ||
    cat === 'pesce' ||
    cat === 'fisch'
  ) {
    return 'manzo_pesce';
  }

  if (
    name.includes('chicken curry') ||
    name.includes('chicken korma') ||
    name.includes('tikka masala') ||
    name.includes('palak paneer') ||
    name.includes('lammkotelett') ||
    name.includes('lamm curry') ||
    name.includes('lamm korma') ||
    name.includes('lammfleisch')
  ) {
    return 'indian_lamb';
  }

  if (
    name.includes('schnitzel') ||
    name.includes('cordon bleu') ||
    name.includes('gyros') ||
    name.includes('putenschnitzel') ||
    name.includes('putenfleisch')
  ) {
    return 'meat_gyros';
  }

  if (
    name.includes('manzo') ||
    name.includes('rindfleisch') ||
    name.includes('pesce') ||
    name.includes('lachsfilet') ||
    name.includes('zanderfilet') ||
    name.includes('calamari') ||
    name.includes('forelle') ||
    name.includes('garnelen')
  ) {
    return 'manzo_pesce';
  }

  return null;
}

export function isSideDishCategory(item) {
  if (!item) return false;

  const id = String(item.id || '').toLowerCase();
  const name = String(item.name_de || item.name || item.title || '').toLowerCase();
  const num = String(item.number || '').trim();

  // Exclude "Pizza Gyros" / "Pizza Gyrosa" (No. 33) specifically
  if (
    id === 'pizza-33' ||
    (num === '33' && (id.startsWith('pizza') || name.includes('pizza'))) ||
    name === 'pizza gyros' ||
    name === 'pizza gyrosa' ||
    name.startsWith('pizza gyros') ||
    name.startsWith('pizza gyrosa')
  ) {
    return false;
  }

  // Exclude Pasta & Noodle dishes (Tortellini, Spaghetti, Rigatoni, etc. - e.g. No. 58 Tortellini mit Putenfleisch)
  const canonical = getItemCanonicalCategory(item);
  const cat = String(item.category_id || item.category || '').toLowerCase().trim();
  if (
    canonical === 'pasta' ||
    canonical === 'pasta-al-forno' ||
    canonical === 'gnocchi' ||
    cat === 'pasta' ||
    cat === 'pasta-al-forno' ||
    cat === 'gnocchi' ||
    id.startsWith('pasta-') ||
    id === 'gnocchi-al-forno' ||
    num === '58' ||
    name.startsWith('tortellini') ||
    name.startsWith('spaghetti') ||
    name.startsWith('rigatoni') ||
    name.startsWith('tagliatelle') ||
    name.startsWith('penne') ||
    name.startsWith('maccheroni') ||
    name.includes('tortellini mit putenfleisch')
  ) {
    return false;
  }

  if (canonical === 'chinesisch') return false;
  if (cat === 'chinesisch' || cat === 'chinese' || cat === 'asia') return false;
  return !!getSideDishType(item);
}

export function isSaladCategory(item) {
  if (!item) return false;
  if (getSideDishType(item)) return false;

  const canonical = getItemCanonicalCategory(item);
  if (canonical === 'salate') return true;

  const cat = String(item.category_id || item.category || '').toLowerCase().trim();
  if (cat === 'salate' || cat === 'salad') return true;

  const id = String(item.id || '').toLowerCase();
  if (id.startsWith('salad-') || id.startsWith('salat-')) return true;

  return false;
}

export function isDealItem(item) {
  if (!item) return false;
  const cat = String(item.category_id || item.category || '').toLowerCase().trim();
  if (cat === 'deals' || cat.includes('spar') || cat.includes('angebot')) return true;

  const id = String(item.id || '').trim();
  if (id.startsWith('A') || id.startsWith('offer-')) return true;

  const code = String(item.code || '').trim();
  if (code.startsWith('A')) return true;

  const name = String(item.name || item.title || '').toLowerCase();
  if (name.includes('spar-menü') || name.includes('sparmenü') || name.includes('familienpizza angebot') || name.includes('partypizza angebot')) return true;

  const canonical = getItemCanonicalCategory(item);
  if (canonical === 'deals') return true;

  return false;
}

export function isPizzaVeneziaCustom(item) {
  if (!item) return false;
  const num = String(item.number || '').trim();
  if (num === '46') return true;

  const id = String(item.id || '').toLowerCase().trim();
  if (id === 'pizza-46' || id.startsWith('pizza-46-') || id === '46') return true;

  const name = String(item.name || item.title || '').toLowerCase();
  if (name.includes('pizza venezia') && (name.includes('wunsch') || name.includes('46') || name.includes('custom') || name.includes('selbst'))) return true;
  if (name === 'pizza venezia (wunschpizza)' || name === 'pizza venezia') return true;

  return false;
}

export function isA1Familienpizza(item) {
  if (!item) return false;
  const id = String(item.id || '').trim().toUpperCase();
  const code = String(item.code || '').trim().toUpperCase();
  const num = String(item.number || '').trim().toUpperCase();
  const name = String(item.name || item.title || '').toLowerCase().trim();

  if (id === 'A1' || id === 'OFFER-A1' || id.startsWith('A1-')) return true;
  if (code === 'A1' || num === 'A1') return true;
  if (name.includes('familienpizza') && name.includes('angebot')) return true;
  if (name.includes('familienpizza angebot') || name.includes('sparmenü a1') || name.includes('spar-menü a1')) return true;

  return false;
}

export function isA2Partypizza(item) {
  if (!item) return false;
  const id = String(item.id || '').trim().toUpperCase();
  const code = String(item.code || '').trim().toUpperCase();
  const num = String(item.number || '').trim().toUpperCase();
  const name = String(item.name || item.title || '').toLowerCase().trim();

  if (id === 'A2' || id === 'OFFER-A2' || id.startsWith('A2-')) return true;
  if (code === 'A2' || num === 'A2') return true;
  if (name.includes('partypizza') && (name.includes('angebot') || name.includes('offer') || name.includes('hit'))) return true;
  if (name.includes('party pizza') && (name.includes('angebot') || name.includes('offer') || name.includes('hit'))) return true;
  if (name.includes('partypizza angebot') || name.includes('sparmenü a2') || name.includes('spar-menü a2')) return true;

  return false;
}


