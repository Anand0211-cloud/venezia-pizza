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

async function testStorageList(keyName, keyVal) {
  const url = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/list/menu-dishes`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': keyVal,
      'Authorization': `Bearer ${keyVal}`
    },
    body: JSON.stringify({
      prefix: 'Reisgerichte',
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    })
  });
  console.log(`Key [${keyName}] status:`, res.status, await res.text());
}

async function run() {
  await testStorageList('ANON', process.env.VITE_SUPABASE_ANON_KEY);
  await testStorageList('SERVICE_ROLE', process.env.SUPABASE_SERVICE_ROLE_KEY);
}

run();
