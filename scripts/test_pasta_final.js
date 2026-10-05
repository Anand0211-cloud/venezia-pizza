import { allMenuItems } from '../src/data/menuData.js';
import { applyCategoryStorageImages, DEFAULT_STORAGE_FOLDERS } from '../src/lib/categoryStorageService.js';

const pastaItems = allMenuItems.filter(item => {
  if (!item) return false;
  const cat = (item.category || '').toLowerCase();
  return cat === 'pasta';
}).sort((a, b) => {
  const numA = parseInt(a.number, 10);
  const numB = parseInt(b.number, 10);
  if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
  return String(a.number || '').localeCompare(String(b.number || ''), undefined, { numeric: true });
});

const finalPasta = applyCategoryStorageImages('pasta', pastaItems, DEFAULT_STORAGE_FOLDERS);

console.log('Total Pasta items displayed:', finalPasta.length);
finalPasta.forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.id}] #${p.number} ${p.name}`);
  console.log(`   Image URL: ${p.image}`);
});
