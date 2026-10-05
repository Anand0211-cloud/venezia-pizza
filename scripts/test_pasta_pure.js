import fs from 'fs';

const content = fs.readFileSync('src/data/menuData.js', 'utf8');

// Find all items with category: 'pasta'
const pastaBlocks = content.split(/{\s*id:\s*['"]pasta-/).slice(1);

console.log('Pasta items count found in menuData.js:', pastaBlocks.length);
pastaBlocks.forEach((block, idx) => {
  const number = (block.match(/number:\s*['"]([^'"]+)['"]/) || [])[1];
  const name = (block.match(/name:\s*['"]([^'"]+)['"]/) || [])[1];
  const image = (block.match(/image:\s*['"]([^'"]+)['"]/) || [])[1];
  console.log(`${idx + 1}. #${number} ${name}`);
  console.log(`   Image: ${image}`);
});
