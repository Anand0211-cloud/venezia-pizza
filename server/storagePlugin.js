import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadLocalEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          const val = (match[2] || '').replace(/^["'](.*)["']$/, '$1').trim();
          if (!process.env[key] || process.env[key] === '') {
            process.env[key] = val;
          }
        }
      });
    }
  } catch (err) {
    // Ignore error
  }
}

let storageCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

export async function fetchStorageCategoryFolders() {
  loadLocalEnv();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const BUCKET = 'menu-dishes';

  if (!supabaseUrl || !serviceKey) {
    console.warn('[storagePlugin] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return {};
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // List all top-level folders in menu-dishes
  const { data: rootItems, error: rootErr } = await supabase.storage.from(BUCKET).list('', {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' }
  });

  if (rootErr) {
    console.error('[storagePlugin] Error listing bucket root:', rootErr);
    return {};
  }

  const foldersData = {};

  for (const item of rootItems) {
    // Check if it's a folder or file
    const folderName = item.name;
    const { data: files, error: filesErr } = await supabase.storage.from(BUCKET).list(folderName, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (!filesErr && files && files.length > 0) {
      // Natural sort files (e.g. Artboard 1, Artboard 2 ... Artboard 10)
      const sortedFiles = files.filter(f => f.name && !f.name.startsWith('.')).sort((a, b) => {
        const numA = (a.name.match(/\d+/) || [])[0];
        const numB = (b.name.match(/\d+/) || [])[0];
        if (numA && numB && parseInt(numA, 10) !== parseInt(numB, 10)) {
          return parseInt(numA, 10) - parseInt(numB, 10);
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });

      foldersData[folderName] = sortedFiles.map(f => {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${folderName}/${encodeURIComponent(f.name)}`;
        return {
          name: f.name,
          folder: folderName,
          publicUrl,
          size: f.metadata?.size || null
        };
      });
    }
  }

  return foldersData;
}

export function storagePlugin() {
  return {
    name: 'storage-plugin',
    configureServer(server) {
      server.middlewares.use('/api/storage/category-images', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        try {
          const now = Date.now();
          const forceRefresh = req.url && req.url.includes('refresh=true');
          if (!storageCache || forceRefresh || (now - lastCacheTime > CACHE_TTL_MS)) {
            storageCache = await fetchStorageCategoryFolders();
            lastCacheTime = now;
          }

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            bucket: 'menu-dishes',
            timestamp: new Date().toISOString(),
            folders: storageCache
          }));
        } catch (err) {
          console.error('[storagePlugin] Internal error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      // Unified upload dish handler for Vite dev server
      const handleDishUpload = async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        try {
          let body = '';
          for await (const chunk of req) {
            body += chunk;
          }
          const { fileName, fileData, dishId } = JSON.parse(body || '{}');

          if (!fileData) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'No image data provided' }));
            return;
          }

          loadLocalEnv();
          const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const BUCKET = 'menu-dishes';

          const ext = (fileName && fileName.split('.').pop().toLowerCase()) || 'jpg';
          const cleanDishId = String(dishId || 'dish').replace(/[^a-zA-Z0-9_-]/g, '_');
          const fileNameSaved = `${cleanDishId}_${Date.now()}.${ext}`;

          // 1. If service role key is available, upload directly to Supabase Storage
          if (supabaseUrl && serviceKey) {
            try {
              const supabaseAdmin = createClient(supabaseUrl, serviceKey);
              const storagePath = `dishes/${fileNameSaved}`;
              const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              const mimeType = fileData.match(/^data:(image\/\w+);base64,/)?.[1] || (ext === 'png' ? 'image/png' : 'image/jpeg');

              const { data: uploadRes, error: uploadErr } = await supabaseAdmin.storage
                .from(BUCKET)
                .upload(storagePath, buffer, {
                  contentType: mimeType,
                  upsert: true
                });

              if (!uploadErr && uploadRes) {
                const { data: pubUrlData } = supabaseAdmin.storage
                  .from(BUCKET)
                  .getPublicUrl(storagePath);

                if (pubUrlData?.publicUrl) {
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    success: true,
                    url: pubUrlData.publicUrl,
                    storage: 'supabase_storage'
                  }));
                  return;
                }
              }
            } catch (supErr) {
              console.warn('[storagePlugin] Service key upload attempt notice:', supErr.message);
            }
          }

          // 2. Local public file storage in public/images/dishes/
          const dishesDir = path.resolve(process.cwd(), 'public', 'images', 'dishes');
          if (!fs.existsSync(dishesDir)) {
            fs.mkdirSync(dishesDir, { recursive: true });
          }

          const localFilePath = path.join(dishesDir, fileNameSaved);
          const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(localFilePath, Buffer.from(base64Data, 'base64'));

          const publicLocalUrl = `/images/dishes/${fileNameSaved}`;
          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            url: publicLocalUrl,
            storage: 'local_dishes'
          }));
        } catch (err) {
          console.error('[storagePlugin] Upload dish image error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      };

      server.middlewares.use('/api/storage/upload-dish', handleDishUpload);
      server.middlewares.use('/api/upload-dish-image', handleDishUpload);
    }
  };
}
