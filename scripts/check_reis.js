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

async function checkReis() {
  const { data } = await supabase.from('menu_items').select('*');
  const reisDb = data.filter(d => 
    d.category_id === 'reisgerichte' || 
    (d.name_de && d.name_de.toLowerCase().includes('reis')) ||
    (d.name && d.name.toLowerCase().includes('reis'))
  );
  console.log('Reisgerichte in DB:', reisDb.length);
  reisDb.forEach(r => console.log(`[${r.id}] #${r.number} cat:${r.category_id} name:${r.name_de || r.name} img:${r.image_url}`));
}

checkReis();
