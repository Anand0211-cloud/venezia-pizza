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

function getUrl(folder, file) {
  const safeFile = file.replace(/\s+/g, '_');
  return `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${folder}/${safeFile}`;
}

async function syncDb() {
  console.log('Syncing database items with verified Supabase Storage URLs...');

  // 1. REISGERICHTE (All 7 dishes matching 7 images in Reisgerichte folder)
  const reisUpdates = [
    { id: 'reis-venezia', number: '59', category_id: 'reisgerichte', image_url: getUrl('Reisgerichte', 'Artboard 1.png') },
    { id: 'reis-frutti-di-mare', number: '59a', category_id: 'reisgerichte', image_url: getUrl('Reisgerichte', 'Artboard 2.png') },
    { id: 'reis-vegetarisch', number: '59b', category_id: 'reisgerichte', image_url: getUrl('Reisgerichte', 'Artboard 3.png') },
    { id: 'asia-gebratener-reis-haehnchen', number: '181', category_id: 'reisgerichte', image_url: getUrl('Reisgerichte', 'Artboard 4.png') },
    { id: 'reis-pollo-curry', number: '59c', category_id: 'reisgerichte', image_url: getUrl('Reisgerichte', 'Artboard 5.png') },
    { id: 'reis-bombay', number: '59d', category_id: 'reisgerichte', image_url: getUrl('Reisgerichte', 'Artboard 6.png') },
    { id: 'reis-gyros-spezial', number: '59e', category_id: 'reisgerichte', image_url: getUrl('Reisgerichte', 'Artboard 7.png') }
  ];

  for (const item of reisUpdates) {
    const { error } = await supabase.from('menu_items').update({
      category_id: item.category_id,
      image_url: item.image_url
    }).eq('id', item.id);
    if (error) console.error(`Error updating ${item.id}:`, error.message);
  }

  // 2. CHINESISCH (All 7 noodle dishes matching 7 images in noodles folder)
  const noodleUpdates = [
    { id: 'asia-gebratene-nudeln-haehnchen', number: '180', category_id: 'chinesisch', image_url: getUrl('noodles', 'Artboard 1.png') },
    { id: 'asia-chop-suey', number: '182', category_id: 'chinesisch', image_url: getUrl('noodles', 'Artboard 2.png') },
    { id: 'asia-ente-suess-sauer', number: '183', category_id: 'chinesisch', image_url: getUrl('noodles', 'Artboard 3.png') },
    { id: 'asia-bami-goreng', number: '184', category_id: 'chinesisch', image_url: getUrl('noodles', 'Artboard 4.png') },
    { id: 'asia-gebratene-nudeln-ente', number: '185', category_id: 'chinesisch', image_url: getUrl('noodles', 'Artboard 5.png') },
    { id: 'asia-nudeln-rindfleisch', number: '186', category_id: 'chinesisch', image_url: getUrl('noodles', 'Artboard 6.png') },
    { id: 'asia-gebratene-nudeln-veg', number: '187', category_id: 'chinesisch', image_url: getUrl('noodles', 'Artboard 7.png') }
  ];

  for (const item of noodleUpdates) {
    const { error } = await supabase.from('menu_items').update({
      category_id: item.category_id,
      image_url: item.image_url
    }).eq('id', item.id);
    if (error) console.error(`Error updating ${item.id}:`, error.message);
  }

  console.log('Database sync complete!');
}

syncDb();
