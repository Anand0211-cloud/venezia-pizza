import { useState, useEffect } from 'react';
import { getMenuItems, subscribeToMenuItems } from '../lib/supabaseClient';
import { allMenuItems as localMenuItems, specialOffersData } from './menuData';
import { images } from '../assets/images';

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

  // 2. Pasta al Forno (Überbackene Nudelgerichte)
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

  // 3. Gnocchi
  if (cat === 'gnocchi' || name.includes('gnocchi')) {
    return 'gnocchi';
  }

  // 4. Classic Pasta
  if (
    cat === 'pasta' ||
    id.startsWith('pasta-') ||
    name.startsWith('spaghetti') ||
    name.startsWith('rigatoni') ||
    name.startsWith('tortellini') ||
    name.startsWith('tagliatelle') ||
    name.startsWith('penne') ||
    name.startsWith('maccheroni')
  ) {
    return 'pasta';
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

  // 16. Fischgerichte
  if (
    cat === 'fischgerichte' ||
    cat === 'fisch' ||
    name.includes('lachs') ||
    name.includes('calamari') ||
    name.includes('zander') ||
    name.includes('forelle') ||
    name.includes('garnelen')
  ) {
    return 'fischgerichte';
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

  const image = dbItem.image_url || local?.image || getFallbackImage(category === 'pizzen' ? 'pizza' : category, dbItem.name_de || dbItem.name, dbItem.toppings_de);

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

  return {
    id: dbItem.id,
    number: dbItem.number || local?.number || local?.code || '',
    category,
    name: dbItem.name_de || dbItem.name || local?.name || local?.title || '',
    name_en: dbItem.name_en || local?.name_en || local?.name || '',
    toppings: dbItem.toppings_de || dbItem.toppings || local?.toppings || local?.description || '',
    desc: dbItem.desc_de || dbItem.desc || local?.desc || local?.details || '',
    prices,
    price: unitPrice,
    image,
    badge: (dbItem.badge !== undefined && dbItem.badge !== null) ? dbItem.badge : (local?.badge ?? ''),
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

// Global notification trigger for instant cross-component updates
export function notifyMenuUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('venezia-menu-updated'));
  }
}

// Initial combined fallback list
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
  subscribers.forEach(cb => cb({ menuItems: globalMenuItems, loading: globalLoading }));
}

async function fetchLiveMenuGlobal() {
  if (activeFetchPromise) return activeFetchPromise;
  activeFetchPromise = (async () => {
    try {
      const data = await getMenuItems();
      if (data && data.length > 0) {
        const fullLocalList = getInitialLocalMenu();
        const localMap = new Map(fullLocalList.map(i => [i.id, i]));
        const formatted = data.map(item => formatMenuItemFromDb(item, localMap));
        globalMenuItems = formatted;
      }
    } catch (err) {
      console.warn('Could not fetch live menu from Supabase, using local fallback:', err);
    } finally {
      globalLoading = false;
      activeFetchPromise = null;
      notifySubscribers();
    }
  })();
  return activeFetchPromise;
}

function initGlobalMenuListener() {
  if (hasInitialized || typeof window === 'undefined') return;
  hasInitialized = true;

  fetchLiveMenuGlobal();

  // Listen to in-window updates (e.g. from AdminPanel save)
  window.addEventListener('venezia-menu-updated', () => {
    fetchLiveMenuGlobal();
  });

  // Subscribe once to menu_items table
  subscribeToMenuItems(() => {
    fetchLiveMenuGlobal();
  });
}

export function useLiveMenu() {
  const [state, setState] = useState(() => {
    initGlobalMenuListener();
    return { menuItems: globalMenuItems, loading: globalLoading };
  });

  useEffect(() => {
    initGlobalMenuListener();
    const handler = (newState) => setState(newState);
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, []);

  return { menuItems: state.menuItems, loading: state.loading, refreshMenu: fetchLiveMenuGlobal };
}


