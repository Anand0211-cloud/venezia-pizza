import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
  console.error('Missing credentials in .env');
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

// Map folder names to category IDs in database
const FOLDER_TO_CATEGORY_MAP = {
  'pizzen': ['pizzen', 'pizza'],
  'pasta': ['pasta', 'pasta-al-forno', 'gnocchi'],
  'indische': ['indisch'],
  'salate': ['salate', 'salad'],
  'reisgerichte': ['reisgerichte'],
  'burgers': ['american-food', 'burger-snacks'],
  'starters': ['beilagen'],
  'noodles': ['chinesisch']
};

async function main() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Full Category Image Migration to Supabase`);
  console.log(`Bucket: "${BUCKET_NAME}"`);
  console.log(`======================================================\n`);

  const imagesDir = path.resolve(process.cwd(), 'public', 'images');
  
  // 1. Fetch all menu items from DB
  const { data: allDbItems, error: fetchErr } = await supabase
    .from('menu_items')
    .select('id, number, category_id, name_de, image_url')
    .order('number');

  if (fetchErr) {
    console.error('Error fetching menu items:', fetchErr);
    return;
  }

  console.log(`Loaded ${allDbItems.length} menu items from database.\n`);

  // 2. Discover subdirectories in public/images
  const subdirs = fs.readdirSync(imagesDir)
    .filter(name => fs.statSync(path.join(imagesDir, name)).isDirectory());

  console.log(`Found category folders:`, subdirs.join(', '), '\n');

  let totalUploaded = 0;
  let totalLinked = 0;
  const linkSummary = [];

  for (const folderName of subdirs) {
    const folderKey = folderName.toLowerCase();
    const folderPath = path.join(imagesDir, folderName);
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    
    // Sort files naturally so Artboard 1, Artboard 2... Artboard 10 stay in order
    const files = fs.readdirSync(folderPath)
      .filter(f => validExtensions.includes(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (files.length === 0) continue;

    console.log(`\n📁 Processing [${folderName}] (${files.length} images)...`);

    // Target categories for this folder
    const targetCatIds = FOLDER_TO_CATEGORY_MAP[folderKey] || [folderKey];
    const categoryDishes = allDbItems.filter(item => 
      targetCatIds.includes(String(item.category_id).toLowerCase())
    );

    console.log(`   Matching against ${categoryDishes.length} dishes in category [${targetCatIds.join(', ')}]`);

    let index = 0;
    for (const fileName of files) {
      const filePath = path.join(folderPath, fileName);
      const fileBuffer = fs.readFileSync(filePath);
      const contentType = getMimeType(filePath);

      // Clean storage path: e.g. "Pizzen/Artboard_10.png"
      const safeFileName = fileName.replace(/\s+/g, '_');
      const storagePath = `${folderName}/${safeFileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true
        });

      if (uploadError) {
        console.warn(`   ❌ Upload error for ${storagePath}:`, uploadError.message);
        continue;
      }

      totalUploaded++;

      // Construct public CDN URL
      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      const publicUrl = publicData.publicUrl;

      // Match dish:
      let matchedDish = null;

      // Strategy A: If folder is Pizzen, extract Artboard number (e.g. "Artboard 10.png" -> Pizza #10)
      if (folderKey === 'pizzen') {
        const numMatch = fileName.match(/(\d+)/);
        if (numMatch) {
          const pizzaNum = numMatch[1];
          matchedDish = categoryDishes.find(d => String(d.number) === String(pizzaNum));
        }
      }

      // Strategy B: If file has exact dish number (e.g. "1.png", "2.png" in Burgers)
      if (!matchedDish) {
        const rawName = path.basename(fileName, path.extname(fileName)).trim();
        if (/^\d+[a-z]?$/i.test(rawName)) {
          // If in burgers: 1 -> #70, 2 -> #72, 3 -> #73
          if (folderKey === 'burgers') {
            const burgerOrder = ['70', '72', '73', '74', '75'];
            const burgerNum = burgerOrder[parseInt(rawName, 10) - 1];
            if (burgerNum) {
              matchedDish = categoryDishes.find(d => String(d.number) === burgerNum);
            }
          } else {
            matchedDish = categoryDishes.find(d => String(d.number).toLowerCase() === rawName.toLowerCase());
          }
        }
      }

      // Strategy C: Sequential matching within category if not matched by number
      if (!matchedDish && index < categoryDishes.length) {
        matchedDish = categoryDishes[index];
      }

      if (matchedDish) {
        // Update dish in Supabase database
        const { error: updateErr } = await supabase
          .from('menu_items')
          .update({ image_url: publicUrl })
          .eq('id', matchedDish.id);

        if (!updateErr) {
          totalLinked++;
          linkSummary.push({
            folder: folderName,
            file: fileName,
            dish: `#${matchedDish.number} ${matchedDish.name_de}`,
            url: publicUrl
          });
          console.log(`   ✓ [LINKED] ${fileName} ➔ #${matchedDish.number} ${matchedDish.name_de}`);
        } else {
          console.warn(`   ⚠️ DB update failed for #${matchedDish.number}:`, updateErr.message);
        }
      } else {
        console.log(`   ℹ️ [UPLOADED ONLY] ${fileName} (cloud stored, ready for manual assignment)`);
      }

      index++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 MIGRATION COMPLETE!`);
  console.log(`- Total images uploaded to Cloud Storage: ${totalUploaded}`);
  console.log(`- Dishes linked with live Cloud CDN URLs: ${totalLinked}`);
  console.log(`======================================================\n`);
}

main();
