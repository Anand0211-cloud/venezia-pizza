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
const LOCAL_DIR = path.resolve(process.cwd(), 'public/images/Home_Category');

async function uploadHomeCategories() {
  const files = fs.readdirSync(LOCAL_DIR);
  console.log('Uploading files to Supabase Storage menu-dishes/Home_Category:');
  for (const file of files) {
    const filePath = path.join(LOCAL_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `Home_Category/${file}`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });
    if (error) {
      console.error(`Error uploading ${file}:`, error.message);
    } else {
      const url = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
      console.log(`Uploaded [${file}] -> ${url}`);
    }
  }
}

uploadHomeCategories();
