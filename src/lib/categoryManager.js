import { supabase } from './supabaseClient.js';

export const DEFAULT_CATEGORIES = [
  { id: 'pizzen', name_de: 'Pizzen', name: 'Pizzen', sub: '', title: 'Original Steinofen-Pizzen (1–49a)', icon: '🍕', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/pizza-1_img1_1791916964409.jpg' },
  { id: 'deals', name_de: 'Spar-Menüs & Deals', name: 'Spar-Menüs & Deals', sub: '& Deals', title: 'Spar-Menüs & Spezial-Angebote', icon: '🔥', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish_1791869896776.jpg' },
  { id: 'pasta', name_de: 'Pasta', name: 'Pasta', sub: '', title: 'Klassische Pasta Spezialitäten', icon: '🍝', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/pasta-tortellini-panna_1791831268343.jpg' },
  { id: 'gnocchi', name_de: 'Gnocchi', name: 'Gnocchi', sub: '', title: 'Gnocchi Spezialitäten', icon: '🥔', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/gnocchi-napoli_1791829866131.jpg' },
  { id: 'pasta-al-forno', name_de: 'Pasta al Forno', name: 'Pasta al Forno', sub: 'Überbackene Teigwaren', title: 'Pasta al Forno (Überbackene Teigwaren)', icon: '🍲', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish-1791732749749_1791830426020.jpg' },
  { id: 'vegetarisch', name_de: 'Vegetarisch überbacken', name: 'Vegetarisch', sub: 'überbacken', title: 'Vegetarisch überbackene Spezialitäten', icon: '🥗', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/veg-brokkoli-auflauf_1791828927375.jpg' },
  { id: 'auflaeufe', name_de: 'Aufläufe', name: 'Aufläufe', sub: 'alle mit Käse überbacken', title: 'Feine Aufläufe alle mit Käse überbacken', icon: '🥘', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/auflauf-kartoffel-hack_1791826227266.jpg' },
  { id: 'reisgerichte', name_de: 'Reisgerichte', name: 'Reisgerichte', sub: 'im Ofen überbacken', title: 'Reisgerichte im Ofen überbacken', icon: '🍚', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Reisgerichte/Artboard_5.png' },
  { id: 'fleischgerichte', name_de: 'Fleischgerichte (Putenfleisch)', name: 'Fleischgerichte', sub: '(Putenfleisch)', title: 'Fleischgerichte (Putenfleisch)', icon: '🥩', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/fisch-lachs_1791800859098.jpg' },
  { id: 'gyros', name_de: 'Gyros', name: 'Gyros', sub: '& Döner', title: 'Gyros Spezialitäten', icon: '🥙', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/doner-teller_1791825846772.jpg' },
  { id: 'salate', name_de: 'Salate', name: 'Salate', sub: '', title: 'Frische knackige Salate', icon: '🥗', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/salad-venezia_1791827518432.jpg' },
  { id: 'grill-menue', name_de: 'Grill Menü', name: 'Grill Menü', sub: 'mit Curry Sauce', title: 'Grill Menü mit Curry Sauce', icon: '🍖', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish_img1_1791916686663.jpg' },
  { id: 'american-food', name_de: 'American Food', name: 'American Food', sub: '', title: 'American Food & Burger Spezialitäten', icon: '🍔', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Burgers/2.png' },
  { id: 'indisch', name_de: 'Indische Hauptgerichte', name: 'Indische', sub: 'Hauptgerichte', title: 'Indische Hauptgerichte & Currys', icon: '🍛', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/indisch-chicken-korma_img1_1791910847111.jpg' },
  { id: 'lamm', name_de: 'Lamm Spezialitäten', name: 'Lamm', sub: 'Spezialitäten', title: 'Zarte Lamm Spezialitäten', icon: '🍖', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/lamm-curry_img1_1791910415589.jpg' },
  { id: 'steaks', name_de: 'Steaks', name: 'Steaks', sub: '', title: 'Saftige Steaks vom Grill', icon: '🥩', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish_img1_1791916317183.jpg' },
  { id: 'mexikanisch', name_de: 'Mexikanische Gerichte', name: 'Mexikanische', sub: 'Gerichte', title: 'Mexikanische Spezialitäten', icon: '🌮', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/mex-tacos_1791797525289.jpg' },
  { id: 'chinesisch', name_de: 'Chinesische Gerichte', name: 'Chinesische', sub: 'Gerichte', title: 'Chinesische Spezialitäten aus dem Wok', icon: '🥡', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/asia-gebratene-nudeln-haehnchen_1791796580855.jpg' },
  { id: 'beilagen', name_de: 'Extra Beilagen', name: 'Extra Beilagen', sub: '', title: 'Extra Beilagen & Saucen', icon: '🍟', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/starter-chicken-dippers_1791792783090.jpg' },
  { id: 'toasts', name_de: 'Toasts', name: 'Toasts', sub: 'Alle mit Salat', title: 'Toasts - Alle mit Salat', icon: '🥪', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/toast-hawaii_1791834149871.jpg' },
  { id: 'omelette', name_de: 'Omelette', name: 'Omelette', sub: 'mit Käse überbacken', title: 'Omelette mit Käse überbacken', icon: '🍳', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/omelette-natur_1791794752996.jpg' },
  { id: 'pesce-fisch', name_de: 'Pesce Fisch', name: 'Pesce Fisch', sub: '', title: 'Pesce Fisch Spezialitäten', icon: '🐟', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish_img1_1791914829647.jpg' },
  { id: 'manzo-vom-rind', name_de: 'Manzo Vom Rind', name: 'Manzo Vom Rind', sub: '', title: 'Manzo Vom Rind Spezialitäten', icon: '🥩', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish_img1_1791916317183.jpg' },
  { id: 'getraenke', name_de: 'Getränke & Desserts', name: 'Getränke', sub: 'Kein Rabatt!', title: 'Erfrischende Getränke (Kein Rabatt!)', icon: '🥤', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/pizza-211b_1791868332409.jpg' }
];

export const CATEGORY_OVERRIDES = {
  'toasts': {
    name: 'Toasts',
    sub: 'Alle mit Salat',
    title: 'Toasts - Alle mit Salat'
  },
  'grill-menue': {
    name: 'Grill Menü',
    sub: 'mit Curry Sauce',
    title: 'Grill Menü mit Curry Sauce'
  },
  'getraenke': {
    name: 'Getränke',
    sub: 'Kein Rabatt!',
    title: 'Erfrischende Getränke (Kein Rabatt!)'
  },
  'auflaeufe': {
    name: 'Aufläufe',
    sub: 'alle mit Käse überbacken',
    title: 'Feine Aufläufe alle mit Käse überbacken'
  },
  'pasta-al-forno': {
    name: 'Pasta al Forno',
    sub: 'Überbackene Teigwaren',
    title: 'Pasta al Forno (Überbackene Teigwaren)'
  }
};

export function applyCategoryOverrides(categories) {
  if (!Array.isArray(categories)) return categories;
  return categories.map((cat) => {
    const override = CATEGORY_OVERRIDES[cat.id];
    if (override) {
      return {
        ...cat,
        ...override,
        sub: override.sub !== undefined ? override.sub : cat.sub,
        title: override.title !== undefined ? override.title : cat.title
      };
    }
    return cat;
  });
}

const STORAGE_KEY = 'venezia_categories_list';
const SYSTEM_ID = '__system_categories__';

export function getStoredCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return applyCategoryOverrides(parsed);
      }
    }
  } catch (e) {
    console.warn('[categoryManager] Failed to read from localStorage:', e);
  }
  return applyCategoryOverrides(DEFAULT_CATEGORIES);
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
        const enriched = applyCategoryOverrides(dbCategories);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
        } catch (e) {}
        return enriched;
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
