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

async function uploadOffers() {
  const offers = ['Offer1.png', 'Offer2.png', 'offer3.png'];
  for (const f of offers) {
    const localPath = path.resolve('public/images', f);
    if (fs.existsSync(localPath)) {
      const buf = fs.readFileSync(localPath);
      const storagePath = `Offers/${f}`;
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
        contentType: 'image/png',
        upsert: true
      });
      if (error) console.error(`Error uploading ${f}:`, error.message);
      else {
        const url = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
        console.log(`Uploaded [${f}] -> ${url}`);
      }
    }
  }
}

uploadOffers();
