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
const BUCKET = 'menu-dishes';

async function listAllStorage() {
  const { data: rootItems, error: rootErr } = await supabase.storage.from(BUCKET).list('');
  if (rootErr) {
    console.error('Error listing root:', rootErr);
    return;
  }
  console.log('Root items in bucket:', rootItems.map(i => i.name));

  for (const item of rootItems) {
    // If it's a folder (no id or has children or is folder)
    const { data: files, error: filesErr } = await supabase.storage.from(BUCKET).list(item.name);
    if (!filesErr && files) {
      console.log(`\nFolder [${item.name}]: ${files.length} items`);
      files.forEach(f => console.log(`   - ${f.name} (${f.metadata?.size || 'unknown'} bytes)`));
    }
  }
}

listAllStorage();
