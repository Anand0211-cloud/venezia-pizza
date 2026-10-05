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

async function check() {
  const { data, error } = await supabase.from('menu_items').select('*');
  if (error) {
    console.error(error);
    return;
  }
  console.log('Total items in DB:', data.length);
  const pastaDb = data.filter(d => d.category_id === 'pasta' || (d.category_id && d.category_id.includes('pasta')));
  console.log('Items with category_id starting with or equal to pasta:', pastaDb.length);
  pastaDb.forEach(p => {
    console.log(`[${p.id}] #${p.number} category_id: ${p.category_id}, name: ${p.name_de || p.name}`);
  });

  const allWithPastaInName = data.filter(d => {
    const n = (d.name_de || d.name || '').toLowerCase();
    const id = (d.id || '').toLowerCase();
    return n.includes('spaghetti') || n.includes('rigatoni') || n.includes('tortellini') || n.includes('tagliatelle') || n.includes('penne') || id.startsWith('pasta-');
  });
  console.log('\nAll items with pasta in name/id:', allWithPastaInName.length);
  allWithPastaInName.forEach(p => {
    console.log(`[${p.id}] #${p.number} category_id: ${p.category_id}, name: ${p.name_de || p.name}`);
  });
}

check();
