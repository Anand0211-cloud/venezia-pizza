import { supabase } from './supabaseClient.js';

export const DEFAULT_CATEGORIES = [
  { id: 'pizzen', name_de: 'Pizzen', name: 'Pizzen', sub: '', title: 'Original Steinofen-Pizzen (1–49a)', icon: '🍕' },
  { id: 'deals', name_de: 'Spar-Menüs & Deals', name: 'Spar-Menüs & Deals', sub: '& Deals', title: 'Spar-Menüs & Spezial-Angebote', icon: '🔥' },
  { id: 'pasta', name_de: 'Pasta', name: 'Pasta', sub: '', title: 'Klassische Pasta Spezialitäten', icon: '🍝' },
  { id: 'gnocchi', name_de: 'Gnocchi', name: 'Gnocchi', sub: '', title: 'Gnocchi Spezialitäten', icon: '🥔' },
  { id: 'pasta-al-forno', name_de: 'Pasta al Forno', name: 'Pasta al Forno', sub: 'Überbacken', title: 'Pasta al Forno (Überbackene Nudelgerichte)', icon: '🍲' },
  { id: 'vegetarisch', name_de: 'Vegetarisch überbacken', name: 'Vegetarisch', sub: 'überbacken', title: 'Vegetarisch überbackene Spezialitäten', icon: '🥗' },
  { id: 'auflaeufe', name_de: 'Aufläufe', name: 'Aufläufe', sub: '', title: 'Feine Aufläufe aus dem Ofen', icon: '🥘' },
  { id: 'reisgerichte', name_de: 'Reisgerichte', name: 'Reisgerichte', sub: 'im Ofen überbacken', title: 'Reisgerichte im Ofen überbacken', icon: '🍚' },
  { id: 'fleischgerichte', name_de: 'Fleischgerichte', name: 'Fleischgerichte', sub: '& Schnitzel', title: 'Herzhafte Fleischgerichte & Schnitzel', icon: '🥩' },
  { id: 'gyros', name_de: 'Gyros & Döner', name: 'Gyros', sub: '', title: 'Gyros & Döner Spezialitäten', icon: '🥙' },
  { id: 'salate', name_de: 'Salate', name: 'Salate', sub: '', title: 'Frische knackige Salate', icon: '🥗' },
  { id: 'grill-menue', name_de: 'Grill Menü', name: 'Grill Menü', sub: '', title: 'Köstliche Grill-Menüs vom Rost', icon: '🍖' },
  { id: 'american-food', name_de: 'American Food', name: 'American Food', sub: '', title: 'American Food & Burger Spezialitäten', icon: '🍔' },
  { id: 'indisch', name_de: 'Indische Hauptgerichte', name: 'Indische', sub: 'Hauptgerichte', title: 'Indische Hauptgerichte & Currys', icon: '🍛' },
  { id: 'lamm', name_de: 'Lamm Spezialitäten', name: 'Lamm', sub: 'Spezialitäten', title: 'Zarte Lamm Spezialitäten', icon: '🍖' },
  { id: 'steaks', name_de: 'Steaks', name: 'Steaks', sub: '', title: 'Saftige Steaks vom Grill', icon: '🥩' },
  { id: 'mexikanisch', name_de: 'Mexikanische Gerichte', name: 'Mexikanische', sub: 'Gerichte', title: 'Mexikanische Spezialitäten', icon: '🌮' },
  { id: 'chinesisch', name_de: 'Chinesische Gerichte', name: 'Chinesische', sub: 'Gerichte', title: 'Chinesische Spezialitäten aus dem Wok', icon: '🥡' },
  { id: 'beilagen', name_de: 'Extra Beilagen', name: 'Extra Beilagen', sub: '', title: 'Extra Beilagen & Saucen', icon: '🍟' },
  { id: 'toasts', name_de: 'Toasts', name: 'Toasts', sub: '', title: 'Knusprige Toast Spezialitäten', icon: '🥪' },
  { id: 'omelette', name_de: 'Omelette', name: 'Omelette', sub: 'mit Käse überbacken', title: 'Omelette mit Käse überbacken', icon: '🍳' },
  { id: 'getraenke', name_de: 'Getränke & Desserts', name: 'Getränke', sub: '', title: 'Erfrischende Getränke & Desserts', icon: '🥤' }
];

const STORAGE_KEY = 'venezia_categories_list';
const SYSTEM_ID = '__system_categories__';

export function getStoredCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[categoryManager] Failed to read from localStorage:', e);
  }
  return DEFAULT_CATEGORIES;
}

export async function fetchCategoriesFromSupabase() {
  if (!supabase) return getStoredCategories();

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('prices')
      .eq('id', SYSTEM_ID)
      .maybeSingle();

    if (!error && data?.prices?.categories && Array.isArray(data.prices.categories)) {
      const dbCategories = data.prices.categories;
      if (dbCategories.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dbCategories));
        } catch (e) {}
        return dbCategories;
      }
    }
  } catch (err) {
    console.error('[categoryManager] Error fetching categories from Supabase:', err);
  }

  return getStoredCategories();
}

export async function saveCategoriesToSupabase(categoriesList) {
  if (!Array.isArray(categoriesList)) return false;

  // 1. Save locally immediately
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categoriesList));
  } catch (e) {}

  // 2. Dispatch events for instant local reaction across tabs
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('venezia-categories-updated', { detail: categoriesList }));
    window.dispatchEvent(new CustomEvent('venezia-menu-updated'));
  }

  // 3. Persist to Supabase if available
  if (supabase) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .upsert({
          id: SYSTEM_ID,
          name_de: SYSTEM_ID,
          category_id: null,
          prices: { categories: categoriesList }
        });

      if (error) {
        console.error('[categoryManager] Error persisting to Supabase:', error);
        return false;
      }
    } catch (err) {
      console.error('[categoryManager] Supabase upsert exception:', err);
      return false;
    }
  }

  return true;
}

export function generateCategorySlug(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `kategorie-${Date.now()}`;
}

export async function addCustomCategory({ name, sub = '', title = '', icon = '🍽️', image = '' }) {
  const current = await fetchCategoriesFromSupabase();
  const slug = generateCategorySlug(name);

  // Check if exists
  const existingIdx = current.findIndex(c => c.id === slug);
  const newCat = {
    id: slug,
    name_de: name,
    name: name,
    sub: sub || '',
    title: title || `${name} Spezialitäten`,
    icon: icon || '🍽️',
    image: image || '',
    is_custom: true
  };

  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...newCat };
  } else {
    // Append before beverages or at end
    const getraenkeIdx = current.findIndex(c => c.id === 'getraenke');
    if (getraenkeIdx >= 0) {
      updatedList = [
        ...current.slice(0, getraenkeIdx),
        newCat,
        ...current.slice(getraenkeIdx)
      ];
    } else {
      updatedList = [...current, newCat];
    }
  }

  await saveCategoriesToSupabase(updatedList);
  return newCat;
}

export async function deleteCategory(categoryId) {
  if (!categoryId) return false;
  const current = await fetchCategoriesFromSupabase();
  const filtered = current.filter(c => c.id !== categoryId);
  await saveCategoriesToSupabase(filtered);
  return true;
}

export function subscribeToCategories(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = async () => {
    const fresh = await fetchCategoriesFromSupabase();
    callback(fresh);
  };

  window.addEventListener('venezia-categories-updated', handleUpdate);
  window.addEventListener('venezia-menu-updated', handleUpdate);
  window.addEventListener('storage', handleUpdate);

  let supabaseSub = null;
  if (supabase) {
    try {
      supabaseSub = supabase
        .channel('public:__system_categories__')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'menu_items',
            filter: `id=eq.${SYSTEM_ID}`
          },
          () => {
            handleUpdate();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[categoryManager] Realtime subscription error:', err);
    }
  }

  return () => {
    window.removeEventListener('venezia-categories-updated', handleUpdate);
    window.removeEventListener('venezia-menu-updated', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
    if (supabaseSub && supabase) {
      supabase.removeChannel(supabaseSub);
    }
  };
}
