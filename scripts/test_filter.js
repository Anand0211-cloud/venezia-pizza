import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        const val = (match[2] || '').replace(/^["'](.*)["']$/, '$1').trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function getItemCanonicalCategory(item) {
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

  // 1. Pizzas & Calzones
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

  // 3. Pasta al Forno
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

  return 'other';
}

async function run() {
  const { data } = await supabase.from('menu_items').select('*');
  const items = data.map(dbItem => {
    const category = getItemCanonicalCategory(dbItem);
    return {
      id: dbItem.id,
      number: dbItem.number,
      name: dbItem.name_de || dbItem.name,
      category,
      raw_category: dbItem.category_id,
      image: dbItem.image_url
    };
  });

  const pastaFiltered = items.filter(item => {
    if (!item) return false;
    const cat = (item.category || '').toLowerCase();
    return cat === 'pasta';
  });

  console.log('Total items matching pasta filter:', pastaFiltered.length);
  pastaFiltered.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.id}] #${p.number} ${p.name}`);
    console.log(`   Image: ${p.image}`);
  });
}

run();
