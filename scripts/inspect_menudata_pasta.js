import fs from 'fs';

const content = fs.readFileSync('src/data/menuData.js', 'utf8');
const pastaMatches = content.match(/category:\s*['"]pasta['"]/g);
console.log('Matches for category: "pasta" in menuData.js:', pastaMatches ? pastaMatches.length : 0);

const idMatches = content.match(/id:\s*['"]pasta-[^'"]+['"]/g);
console.log('Matches for id: "pasta-..." in menuData.js:', idMatches ? idMatches.length : 0);
if (idMatches) {
  idMatches.forEach(id => console.log(id));
}
