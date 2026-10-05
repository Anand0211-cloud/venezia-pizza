async function test() {
  try {
    const res = await fetch('http://localhost:5173/api/storage/category-images');
    const data = await res.json();
    console.log('API Status:', res.status, 'Success:', data.success);
    console.log('Folders discovered from Supabase Storage:');
    for (const [folder, files] of Object.entries(data.folders)) {
      console.log(`  Folder [${folder}]: ${files.length} images`);
      console.log(`    Sample URL: ${files[0].publicUrl}`);
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}
test();
