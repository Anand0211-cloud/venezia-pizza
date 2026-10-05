import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { fileName, fileData, dishId } = req.body || {};

    if (!fileData) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BUCKET = 'menu-dishes';

    const ext = (fileName && fileName.split('.').pop().toLowerCase()) || 'jpg';
    const cleanDishId = String(dishId || 'dish').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileNameSaved = `dishes/${cleanDishId}_${Date.now()}.${ext}`;

    // 1. If service role key is configured, upload to Supabase Storage bucket
    if (supabaseUrl && serviceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);
        const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const mimeType = fileData.match(/^data:(image\/\w+);base64,/)?.[1] || (ext === 'png' ? 'image/png' : 'image/jpeg');

        const { data: uploadRes, error: uploadErr } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(fileNameSaved, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadErr && uploadRes) {
          const { data: pubUrlData } = supabaseAdmin.storage
            .from(BUCKET)
            .getPublicUrl(fileNameSaved);

          if (pubUrlData?.publicUrl) {
            return res.status(200).json({
              success: true,
              url: pubUrlData.publicUrl,
              storage: 'supabase_storage'
            });
          }
        }
      } catch (err) {
        console.warn('Storage upload notice:', err.message);
      }
    }

    // 2. Return the optimized data URL so it can be saved in Supabase Postgres menu_items table
    return res.status(200).json({
      success: true,
      url: fileData,
      storage: 'database_payload'
    });
  } catch (err) {
    console.error('Upload dish image error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
