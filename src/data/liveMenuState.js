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

// Convert Supabase database row to frontend menu item format
export function formatMenuItemFromDb(dbItem, localMap) {
  const local = localMap.get(dbItem.id);
  const isDeal = dbItem.id?.startsWith('A') || dbItem.id?.startsWith('offer-') || dbItem.category_id === 'deals' || local?.category === 'deals';
  const category = isDeal ? 'deals' : (dbItem.category_id || local?.category || 'pizza');

  const image = dbItem.image_url || local?.image || getFallbackImage(category, dbItem.name_de || dbItem.name, dbItem.toppings_de);

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


