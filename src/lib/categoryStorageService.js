const BASE_STORAGE_URL = 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes';

export const DEFAULT_STORAGE_FOLDERS = {
  Pasta: [
    { name: 'Artboard_1.png', publicUrl: `${BASE_STORAGE_URL}/Pasta/Artboard_1.png` },
    { name: 'Artboard_2.png', publicUrl: `${BASE_STORAGE_URL}/Pasta/Artboard_2.png` },
    { name: 'Artboard_3.png', publicUrl: `${BASE_STORAGE_URL}/Pasta/Artboard_3.png` },
    { name: 'Artboard_4.png', publicUrl: `${BASE_STORAGE_URL}/Pasta/Artboard_4.png` },
    { name: 'Artboard_5.png', publicUrl: `${BASE_STORAGE_URL}/Pasta/Artboard_5.png` },
    { name: 'Artboard_6.png', publicUrl: `${BASE_STORAGE_URL}/Pasta/Artboard_6.png` },
    { name: 'Artboard_7_p.png', publicUrl: `${BASE_STORAGE_URL}/Pasta/Artboard_7_p.png` },
    { name: 'Artboard_8_p.png', publicUrl: `${BASE_STORAGE_URL}/Pasta/Artboard_8_p.png` },
    { name: 'Artboard_9_p.png', publicUrl: `${BASE_STORAGE_URL}/Pasta/Artboard_9_p.png` }
  ],
  Reisgerichte: [
    { name: 'Artboard_1.png', publicUrl: `${BASE_STORAGE_URL}/Reisgerichte/Artboard_1.png` },
    { name: 'Artboard_2.png', publicUrl: `${BASE_STORAGE_URL}/Reisgerichte/Artboard_2.png` },
    { name: 'Artboard_3.png', publicUrl: `${BASE_STORAGE_URL}/Reisgerichte/Artboard_3.png` },
    { name: 'Artboard_4.png', publicUrl: `${BASE_STORAGE_URL}/Reisgerichte/Artboard_4.png` },
    { name: 'Artboard_5.png', publicUrl: `${BASE_STORAGE_URL}/Reisgerichte/Artboard_5.png` },
    { name: 'Artboard_6.png', publicUrl: `${BASE_STORAGE_URL}/Reisgerichte/Artboard_6.png` },
    { name: 'Artboard_7.png', publicUrl: `${BASE_STORAGE_URL}/Reisgerichte/Artboard_7.png` }
  ],
  Salate: [
    { name: 'Artboard_1.png', publicUrl: `${BASE_STORAGE_URL}/Salate/Artboard_1.png` },
    { name: 'Artboard_2.png', publicUrl: `${BASE_STORAGE_URL}/Salate/Artboard_2.png` },
    { name: 'Artboard_3.png', publicUrl: `${BASE_STORAGE_URL}/Salate/Artboard_3.png` },
    { name: 'Artboard_4.png', publicUrl: `${BASE_STORAGE_URL}/Salate/Artboard_4.png` },
    { name: 'Artboard_5.png', publicUrl: `${BASE_STORAGE_URL}/Salate/Artboard_5.png` },
    { name: 'Artboard_6.png', publicUrl: `${BASE_STORAGE_URL}/Salate/Artboard_6.png` },
    { name: 'Artboard_7.png', publicUrl: `${BASE_STORAGE_URL}/Salate/Artboard_7.png` },
    { name: 'Artboard_8_sl.png', publicUrl: `${BASE_STORAGE_URL}/Salate/Artboard_8_sl.png` }
  ],
  Starters: [
    { name: 'Artboard_1.png', publicUrl: `${BASE_STORAGE_URL}/Starters/Artboard_1.png` },
    { name: 'Artboard_2.png', publicUrl: `${BASE_STORAGE_URL}/Starters/Artboard_2.png` },
    { name: 'Artboard_3.png', publicUrl: `${BASE_STORAGE_URL}/Starters/Artboard_3.png` },
    { name: 'Artboard_4.png', publicUrl: `${BASE_STORAGE_URL}/Starters/Artboard_4.png` },
    { name: 'Artboard_5.png', publicUrl: `${BASE_STORAGE_URL}/Starters/Artboard_5.png` },
    { name: 'Artboard_6.png', publicUrl: `${BASE_STORAGE_URL}/Starters/Artboard_6.png` },
    { name: 'Artboard_7.png', publicUrl: `${BASE_STORAGE_URL}/Starters/Artboard_7.png` },
    { name: 'Artboard_8_S.png', publicUrl: `${BASE_STORAGE_URL}/Starters/Artboard_8_S.png` },
    { name: 'Artboard_9_st.png', publicUrl: `${BASE_STORAGE_URL}/Starters/Artboard_9_st.png` },
    { name: 'Artboard_10_st.png', publicUrl: `${BASE_STORAGE_URL}/Starters/Artboard_10_st.png` }
  ],
  noodles: [
    { name: 'Artboard_1.png', publicUrl: `${BASE_STORAGE_URL}/noodles/Artboard_1.png` },
    { name: 'Artboard_2.png', publicUrl: `${BASE_STORAGE_URL}/noodles/Artboard_2.png` },
    { name: 'Artboard_3.png', publicUrl: `${BASE_STORAGE_URL}/noodles/Artboard_3.png` },
    { name: 'Artboard_4.png', publicUrl: `${BASE_STORAGE_URL}/noodles/Artboard_4.png` },
    { name: 'Artboard_5.png', publicUrl: `${BASE_STORAGE_URL}/noodles/Artboard_5.png` },
    { name: 'Artboard_6.png', publicUrl: `${BASE_STORAGE_URL}/noodles/Artboard_6.png` },
    { name: 'Artboard_7.png', publicUrl: `${BASE_STORAGE_URL}/noodles/Artboard_7.png` }
  ],
  Burgers: [
    { name: '1.png', publicUrl: `${BASE_STORAGE_URL}/Burgers/1.png` },
    { name: '2.png', publicUrl: `${BASE_STORAGE_URL}/Burgers/2.png` },
    { name: '3.png', publicUrl: `${BASE_STORAGE_URL}/Burgers/3.png` }
  ],
  Indische: [
    { name: 'Artboard_1.png', publicUrl: `${BASE_STORAGE_URL}/Indische/Artboard_1.png` },
    { name: 'Artboard_2.png', publicUrl: `${BASE_STORAGE_URL}/Indische/Artboard_2.png` }
  ]
};

let cachedFolders = { ...DEFAULT_STORAGE_FOLDERS };
let fetchPromise = null;
const subscribers = new Set();

export function notifyStorageUpdated() {
  subscribers.forEach(cb => {
    try { cb(cachedFolders); } catch (e) { console.error(e); }
  });
}

export function subscribeToStorageFolders(callback) {
  subscribers.add(callback);
  if (cachedFolders) {
    callback(cachedFolders);
  }
  return () => subscribers.delete(callback);
}

/**
 * Fetch all category folders dynamically from Supabase Storage
 */
export async function loadStorageFolders(forceRefresh = false) {
  if (cachedFolders && !forceRefresh) return cachedFolders;
  if (fetchPromise && !forceRefresh) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const url = forceRefresh ? '/api/storage/category-images?refresh=true' : '/api/storage/category-images';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.folders) {
        cachedFolders = data.folders;
        notifyStorageUpdated();
        return cachedFolders;
      }
    } catch (err) {
      console.warn('[categoryStorageService] Failed to load from /api/storage/category-images:', err.message);
    } finally {
      fetchPromise = null;
    }
    return cachedFolders || {};
  })();

  return fetchPromise;
}

// Kick off initial background load in browser
if (typeof window !== 'undefined') {
  loadStorageFolders();
}

/**
 * Dynamically resolves which Supabase Storage folder corresponds to a category key/name
 */
export function resolveStorageFolder(categoryKey, availableFolders = null) {
  if (!categoryKey) return null;
  const folders = availableFolders || cachedFolders || {};
  const folderNames = Object.keys(folders);
  if (folderNames.length === 0) return null;

  const key = String(categoryKey).toLowerCase().trim();

  // 1. Exact case-insensitive match
  for (const fn of folderNames) {
    if (fn.toLowerCase() === key) return fn;
  }

  // 2. Known alias mappings
  const aliasMap = {
    'pizza': 'Pizzen',
    'pizzen': 'Pizzen',
    'pasta': 'Pasta',
    'reisgerichte': 'Reisgerichte',
    'reis': 'Reisgerichte',
    'salate': 'Salate',
    'salad': 'Salate',
    'starters': 'Starters',
    'beilagen': 'Starters',
    'extra-beilagen': 'Starters',
    'noodles': 'noodles',
    'chinesisch': 'noodles',
    'burgers': 'Burgers',
    'burger': 'Burgers',
    'american-food': 'Burgers',
    'burger-snacks': 'Burgers',
    'indische': 'Indische',
    'indisch': 'Indische',
    'gnocchi': 'Gnocchi',
    'pasta-al-forno': 'Pasta'
  };

  const aliasTarget = aliasMap[key];
  if (aliasTarget) {
    for (const fn of folderNames) {
      if (fn.toLowerCase() === aliasTarget.toLowerCase()) return fn;
    }
  }

  // 3. Dynamic containment / substring match for future category folders
  for (const fn of folderNames) {
    const fnLow = fn.toLowerCase();
    if (fnLow.includes(key) || key.includes(fnLow)) return fn;
  }

  return null;
}

/**
 * Get all image URLs for a specific category folder from Supabase Storage
 */
export function getCategoryStorageImages(categoryKey, availableFolders = null) {
  const folders = availableFolders || cachedFolders || {};
  const matchedFolder = resolveStorageFolder(categoryKey, folders);
  if (!matchedFolder || !folders[matchedFolder]) return [];
  return folders[matchedFolder].map(f => f.publicUrl);
}

/**
 * Assigns category folder images strictly to the matching items
 * Enforces rule: "Do not mix images between categories"
 * and "Fetch all available images from the corresponding folder (none skipped)"
 */
export function applyCategoryStorageImages(categoryKey, items, availableFolders = null) {
  if (!categoryKey) return items || [];
  const folders = availableFolders || cachedFolders || {};
  const matchedFolder = resolveStorageFolder(categoryKey, folders);

  if (!matchedFolder || !folders[matchedFolder] || folders[matchedFolder].length === 0) {
    // If no Supabase Storage folder exists for this category,
    // ensure we do NOT show random images from other categories
    return (items || []).map(item => {
      if (item.image_url && typeof item.image_url === 'string' && item.image_url.trim() !== '') {
        return {
          ...item,
          image: item.image_url,
          image_url: item.image_url,
          has_custom_image: true
        };
      }
      const img = (item.image || '').toLowerCase();
      // Remove cross-category leaks
      if (img.includes('doner') || img.includes('hero_pizza') || img.includes('cat_calzone')) {
        return { ...item, image: null };
      }
      return item;
    });
  }

  const folderFiles = folders[matchedFolder];
  const folderUrls = folderFiles.map(f => f.publicUrl);
  const folderPrefix = `/menu-dishes/${encodeURIComponent(matchedFolder)}/`.toLowerCase();
  const folderRawPrefix = `/menu-dishes/${matchedFolder}/`.toLowerCase();

  const currentItems = Array.isArray(items) ? [...items] : [];

  // Map existing items to folder images
  const mappedItems = currentItems.map((item, index) => {
    // 1. If dish has an explicit custom image_url from Supabase or admin upload, always preserve it!
    const customUrl = item.image_url || (item.has_custom_image ? item.image : null);
    if (customUrl && typeof customUrl === 'string' && customUrl.trim() !== '') {
      return {
        ...item,
        image: customUrl,
        image_url: customUrl,
        has_custom_image: true
      };
    }

    const currentImg = (item.image || '').toLowerCase();
    const belongsToThisFolder = currentImg.includes(folderPrefix) || currentImg.includes(folderRawPrefix);

    let assignedImage = null;
    if (belongsToThisFolder && !currentImg.includes('doner') && !currentImg.includes('hero_pizza')) {
      assignedImage = item.image;
    } else {
      // Assign strictly from this folder's list by index
      assignedImage = folderUrls[index % folderUrls.length];
    }

    return {
      ...item,
      image: assignedImage
    };
  });

  // If the storage folder has MORE images than items currently loaded,
  // create dish cards for the remaining images so that NO VALID IMAGE IS SKIPPED!
  if (folderFiles.length > mappedItems.length) {
    for (let i = mappedItems.length; i < folderFiles.length; i++) {
      const file = folderFiles[i];
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      mappedItems.push({
        id: `${categoryKey}-extra-${i + 1}`,
        number: `${i + 1}`,
        category: categoryKey,
        name: cleanName.includes('Artboard') ? `${matchedFolder} Spezial ${i + 1}` : cleanName,
        name_en: cleanName.includes('Artboard') ? `${matchedFolder} Special ${i + 1}` : cleanName,
        desc: 'Frisch im Steinofen oder Wok zubereitetes Gericht nach Art des Hauses.',
        toppings: 'Feinste aromatische Zutaten & Gewürze',
        price: mappedItems[0]?.price || 9.50,
        prices: { single: mappedItems[0]?.price || 9.50 },
        image: file.publicUrl,
        is_in_stock: true,
        dietary: []
      });
    }
  }

  return mappedItems;
}

