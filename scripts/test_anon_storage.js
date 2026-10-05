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

const anonClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const BUCKET = 'menu-dishes';

async function testAnonList() {
  console.log('Testing with ANON key:');
  const { data: root, error: rootErr } = await anonClient.storage.from(BUCKET).list('');
  if (rootErr) {
    console.error('Anon root list error:', rootErr);
  } else {
    console.log('Anon root list success:', root.map(i => i.name));
  }

  const { data: reis, error: reisErr } = await anonClient.storage.from(BUCKET).list('Reisgerichte');
  if (reisErr) {
    console.error('Anon Reisgerichte list error:', reisErr);
  } else {
    console.log('Anon Reisgerichte list success:', reis.map(i => i.name));
  }
}

testAnonList();
