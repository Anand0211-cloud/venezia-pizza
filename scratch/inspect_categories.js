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

const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: categories } = await client.from('categories').select('*').order('sort_order');
  console.log('Categories:', categories?.map(c => ({ id: c.id, name: c.name_de })));

  const { data: items } = await client.from('menu_items').select('id, number, category_id, name_de').order('number');
  
  const byCat = {};
  for (const item of items || []) {
    const cat = item.category_id || 'no-cat';
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push({ id: item.id, num: item.number, name: item.name_de });
  }

  for (const [cat, list] of Object.entries(byCat)) {
    console.log(`\n=== Category [${cat}] (${list.length} dishes) ===`);
    list.forEach(d => console.log(`   #${d.num} (${d.id}): ${d.name}`));
  }
}

main();
