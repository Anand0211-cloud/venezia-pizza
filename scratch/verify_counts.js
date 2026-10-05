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

async function check() {
  const { data } = await client.from('menu_items').select('id, number, category_id, name_de, image_url');

  const categories = ['pasta', 'salate', 'reisgerichte', 'chinesisch', 'beilagen'];
  for (const cat of categories) {
    const list = (data || []).filter(d => d.category_id === cat);
    console.log(`\n=== Category [${cat}]: ${list.length} dishes ===`);
    list.forEach(d => console.log(`   #${d.number} ${d.name_de} -> ${d.image_url?.split('/').pop()}`));
  }
}

check();
