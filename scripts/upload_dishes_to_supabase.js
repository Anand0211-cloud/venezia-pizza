import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env
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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const BUCKET_NAME = 'menu-dishes';

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

export async function runMigration() {
  console.log(`--- Starting dish image upload to Supabase Bucket: ${BUCKET_NAME} ---`);

  const imagesDir = path.resolve(process.cwd(), 'public', 'images');
  if (!fs.existsSync(imagesDir)) {
    console.error('Directory public/images does not exist.');
    return;
  }

  // Fetch all existing menu items from Supabase database
  const { data: menuItems, error: menuErr } = await supabase
    .from('menu_items')
    .select('id, number, name_de, name_en, category_id, image_url');

  if (menuErr) {
    console.error('Failed to fetch menu items from database:', menuErr);
    return;
  }

  console.log(`Found ${menuItems.length} menu items in database.`);

  const allFiles = getAllFiles(imagesDir);
  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const imageFiles = allFiles.filter(f => validExtensions.includes(path.extname(f).toLowerCase()));

  console.log(`Found ${imageFiles.length} images in public/images (including subfolders).\n`);

  let uploadedCount = 0;
  let linkedCount = 0;

  for (const filePath of imageFiles) {
    const relPath = path.relative(imagesDir, filePath).replace(/\\/g, '/');
    const fileName = path.basename(filePath, path.extname(filePath)); // e.g. "1", "49a", "pizza-margherita"
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = getMimeType(filePath);

    // 1. Upload to Supabase Storage
    const storagePath = relPath;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.warn(`[UPLOAD FAILED] ${relPath}:`, uploadError.message);
      continue;
    }

    uploadedCount++;

    // 2. Construct public CDN URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Match image to dish in menu_items
    // Match priority:
    // a) Exact match on dish number (e.g. "1", "2", "49a")
    // b) Exact match on dish ID (e.g. "pizza-1", "A1")
    // c) File name inside dish name_de or name_en
    const cleanNum = fileName.replace(/^nr[-_.]?/i, '').trim().toLowerCase();
    
    let matchedDish = menuItems.find(m => String(m.number || '').toLowerCase() === cleanNum);
    if (!matchedDish) {
      matchedDish = menuItems.find(m => String(m.id || '').toLowerCase() === fileName.toLowerCase());
    }
    if (!matchedDish) {
      matchedDish = menuItems.find(m => 
        m.name_de?.toLowerCase().replace(/[^a-z0-9]/g, '').includes(fileName.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
        fileName.toLowerCase().replace(/[^a-z0-9]/g, '').includes(m.name_de?.toLowerCase().replace(/[^a-z0-9]/g, ''))
      );
    }

    if (matchedDish) {
      const { error: updateErr } = await supabase
        .from('menu_items')
        .update({ image_url: publicUrl })
        .eq('id', matchedDish.id);

      if (!updateErr) {
        linkedCount++;
        console.log(`[LINKED] ${relPath} -> Dish #${matchedDish.number} "${matchedDish.name_de}"`);
      } else {
        console.warn(`[DB UPDATE FAILED] for dish #${matchedDish.number}:`, updateErr.message);
      }
    } else {
      console.log(`[UPLOADED ONLY] ${relPath} (no automatic dish match found for filename "${fileName}")`);
    }
  }

  console.log(`\n========================================`);
  console.log(`✓ Migration Complete!`);
  console.log(`- Total images uploaded to Supabase: ${uploadedCount}`);
  console.log(`- Total dishes automatically linked: ${linkedCount}`);
  console.log(`========================================\n`);
}

// Run directly if called from command line
if (process.argv[1] && process.argv[1].endsWith('upload_dishes_to_supabase.js')) {
  runMigration().then(() => process.exit(0)).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
