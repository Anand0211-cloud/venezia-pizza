const fs = require('fs');
const path = require('path');

const menuPath = path.resolve('src/data/menuData.js');
let content = fs.readFileSync(menuPath, 'utf8');

// 1. Change #50, #53, #53a category to 'pasta'
content = content.replace(/(id:\s*'pasta-rigatoni-forno'[\s\S]*?category:\s*)'pasta-al-forno'/, "$1'pasta'");
content = content.replace(/(id:\s*'pasta-lasagne'[\s\S]*?category:\s*)'pasta-al-forno'/, "$1'pasta'");
content = content.replace(/(id:\s*'pasta-cannelloni-forno'[\s\S]*?category:\s*)'pasta-al-forno'/, "$1'pasta'");

// 2. Add #54a, #54b, #54c after #54 Tagliatelle al Salmone
const pastaExtensions = `  {
    id: 'pasta-salmone',
    number: '54',
    category: 'pasta',
    name: 'Tagliatelle al Salmone',
    toppings: 'Tagliatelle, Lachsfilet-Stücke, Weißwein-Sahnesauce, Dill',
    desc: 'Bandnudeln mit saftigen Lachsstücken in einer feinen Weißwein-Dillsauce.',
    prices: { single: 10.50 },
    price: 10.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Pasta/Artboard_6.png',
    badge: 'Feinschmecker',
    dietary: ['pescetarisch']
  },
  {
    id: 'pasta-arrabbiata',
    number: '54a',
    category: 'pasta',
    name: "Penne all'Arrabbiata (Scharf)",
    toppings: 'Penne, pikante Chilisauce, Knoblauch, Tomaten, frische Kräuter',
    desc: 'Röhrennudeln in feuriger Tomatensauce mit Chili, Knoblauch und frischer Petersilie.',
    prices: { single: 8.20 },
    price: 8.20,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Pasta/Artboard_7_p.png',
    badge: 'Scharf 🔥',
    dietary: ['vegetarisch']
  },
  {
    id: 'pasta-tortellini-panna',
    number: '54b',
    category: 'pasta',
    name: 'Tortellini alla Panna',
    toppings: 'Fleischtortellini, Hinterschinken, Sahnesauce, Parmesan',
    desc: 'Mit Fleisch gefüllte Teigtaschen in cremiger Schinken-Sahnesauce mit Parmesan.',
    prices: { single: 8.90 },
    price: 8.90,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Pasta/Artboard_8_p.png',
    badge: '',
    dietary: []
  },
  {
    id: 'pasta-frutti-di-mare',
    number: '54c',
    category: 'pasta',
    name: 'Spaghetti Frutti di Mare',
    toppings: 'Spaghetti, gemischte Meeresfrüchte, Knoblauch, Tomatensugo, Weißwein',
    desc: 'Feine Spaghetti mit Meeresfrüchten, Knoblauch und Kräutern in Weißweinsauce.',
    prices: { single: 9.90 },
    price: 9.90,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Pasta/Artboard_9_p.png',
    badge: 'Meeresfrüchte',
    dietary: ['pescetarisch']
  },`;

content = content.replace(/\{\s*id:\s*'pasta-salmone'[\s\S]*?dietary:\s*\['pescetarisch'\]\s*\}/, pastaExtensions.trim());

// 3. Add #94, #95, #96, #97 after #93 Insalata Caprese
const saladExtensions = `  {
    id: 'salad-caprese',
    number: '93',
    category: 'salate',
    name: 'Insalata Caprese',
    toppings: 'Frische Tomatenscheiben, Mozzarella, Basilikum, Olivenöl, Balsamico',
    desc: 'Italienischer Vorspeisen-Klassiker mit saftigen Tomaten und echtem Mozzarella.',
    prices: { single: 7.50 },
    price: 7.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Salate/Artboard_4.png',
    badge: 'Italienisch',
    dietary: ['vegetarisch']
  },
  {
    id: 'salad-pollo',
    number: '94',
    category: 'salate',
    name: 'Insalata Pollo (Hähnchen-Salat)',
    toppings: 'Blattsalat, Hähnchenfilet, Tomaten, Gurken, Mais, Ei',
    desc: 'Knackiger Salat mit zart gebratenen Hähnchenbruststreifen, Mais und Hausdressing.',
    prices: { single: 8.90 },
    price: 8.90,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Salate/Artboard_5.png',
    badge: 'Empfehlung',
    dietary: []
  },
  {
    id: 'salad-greca',
    number: '95',
    category: 'salate',
    name: 'Insalata Greca (Griechischer Bauernsalat)',
    toppings: 'Schafskäse, Oliven, Peperoni, rote Zwiebeln, Tomaten, Gurken, Olivenöl',
    desc: 'Griechischer Bauernsalat mit original Schafskäse, schwarzen Oliven und roten Zwiebeln.',
    prices: { single: 8.50 },
    price: 8.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Salate/Artboard_6.png',
    badge: 'Klassiker',
    dietary: ['vegetarisch']
  },
  {
    id: 'salad-hawaii',
    number: '96',
    category: 'salate',
    name: 'Insalata Hawaii',
    toppings: 'Blattsalat, Hinterschinken, Ananas, Käse, Mais, Tomaten',
    desc: 'Fruchtig-frischer Salat mit saftigem Hinterschinken, Ananas und Gouda.',
    prices: { single: 8.00 },
    price: 8.00,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Salate/Artboard_7.png',
    badge: '',
    dietary: []
  },
  {
    id: 'salad-chef',
    number: '97',
    category: 'salate',
    name: 'Insalata Chef Spezial',
    toppings: 'Blattsalat, Schinken, Käse, Ei, Thunfisch, Gurken, Tomaten, Dressing nach Wahl',
    desc: 'Reichhaltiger Salatteller mit Hinterschinken, Käse, gekochtem Ei und Thunfisch.',
    prices: { single: 9.50 },
    price: 9.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Salate/Artboard_8_sl.png',
    badge: 'Chef-Tipp',
    dietary: []
  },`;

content = content.replace(/\{\s*id:\s*'salad-caprese'[\s\S]*?dietary:\s*\['vegetarisch'\]\s*\}/, saladExtensions.trim());

// 4. Add #184, #185, #186, #187 after #183 Knusprige Ente Süß-Sauer
const noodleExtensions = `  {
    id: 'asia-ente-suess-sauer',
    number: '183',
    category: 'chinesisch',
    name: 'Knusprige Ente Süß-Sauer',
    toppings: 'Knusprige Ente, Wok-Gemüse, Ananas, pikant-süße Sauce, Eierreis',
    desc: 'Kross gebackene Ente auf feinem Wok-Gemüse mit fruchtiger Süß-Sauer-Sauce und Reis.',
    prices: { single: 12.90 },
    price: 12.90,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/noodles/Artboard_3.png',
    badge: 'Kross',
    dietary: []
  },
  {
    id: 'asia-bami-goreng',
    number: '184',
    category: 'chinesisch',
    name: 'Bami Goreng Spezial (mit Krabben)',
    toppings: 'Gebratene Nudeln, Krabben, Hähnchen, Wok-Gemüse, Ei, Curry',
    desc: 'Indonesische gebratene Nudeln mit Hähnchen, Krabben, Gemüse und leichter Currynote.',
    prices: { single: 10.90 },
    price: 10.90,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/noodles/Artboard_4.png',
    badge: 'Sehr beliebt',
    dietary: []
  },
  {
    id: 'asia-gebratene-nudeln-ente',
    number: '185',
    category: 'chinesisch',
    name: 'Gebratene Nudeln mit knuspriger Ente',
    toppings: 'Knusprige Ente, Eiernudeln, Wok-Gemüse, Ei, Sojasprossen',
    desc: 'Knusprig gebackene Ente auf gebratenen Eiernudeln mit Sojasprossen und Gemüse.',
    prices: { single: 12.50 },
    price: 12.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/noodles/Artboard_5.png',
    badge: 'Empfehlung',
    dietary: []
  },
  {
    id: 'asia-nudeln-rindfleisch',
    number: '186',
    category: 'chinesisch',
    name: 'Gebratene Nudeln mit Rindfleisch',
    toppings: 'Rindfleischstreifen, Nudeln, Wok-Gemüse, Bambus, Sojasauce',
    desc: 'Zarte Rindfleischstreifen aus dem Wok mit Eiernudeln, Gemüse und feiner Sauce.',
    prices: { single: 10.90 },
    price: 10.90,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/noodles/Artboard_6.png',
    badge: '',
    dietary: []
  },
  {
    id: 'asia-gebratene-nudeln-veg',
    number: '187',
    category: 'chinesisch',
    name: 'Gebratene Nudeln Vegetarisch',
    toppings: 'Eiernudeln, Wok-Gemüse, Sojasprossen, Ei, Frühlingszwiebeln',
    desc: 'Gebratene Eiernudeln mit buntem Marktgemüse, Sojasprossen und Ei.',
    prices: { single: 8.50 },
    price: 8.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/noodles/Artboard_7.png',
    badge: 'Veggie',
    dietary: ['vegetarisch']
  },`;

content = content.replace(/\{\s*id:\s*'asia-ente-suess-sauer'[\s\S]*?dietary:\s*\[\]\s*\}/, noodleExtensions.trim());

// 5. Add #194, #195, #196, #197, #198 after #193
const starterExtensions = `  {
    id: 'beilage-zaziki',
    number: '193',
    category: 'beilagen',
    name: 'Hausgemachter Zaziki mit Brot',
    toppings: 'Griechischer Joghurt, Gurken, Knoblauch, Olivenöl, Pizzabrot',
    desc: 'Cremig gerührter Zaziki mit frischem Knoblauch, serviert mit warmem Pizzabrot.',
    prices: { single: 4.50 },
    price: 4.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Starters/Artboard_4.png',
    badge: '',
    dietary: ['vegetarisch']
  },
  {
    id: 'starter-mozzarella-sticks',
    number: '194',
    category: 'beilagen',
    name: 'Mozzarella Sticks (6 Stück)',
    toppings: '6x Mozzarella Sticks, Preiselbeer- oder Knoblauch-Dip',
    desc: 'Goldgelb panierte Mozzarellasticks mit flüssigem Käsekern, inkl. Dip.',
    prices: { single: 5.50 },
    price: 5.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Starters/Artboard_6.png',
    badge: 'Knusprig',
    dietary: ['vegetarisch']
  },
  {
    id: 'starter-chili-cheese',
    number: '195',
    category: 'beilagen',
    name: 'Chili Cheese Nuggets (6 Stück)',
    toppings: '6x Chili Cheese Nuggets, inkl. Dip nach Wahl',
    desc: 'Pikante Schmelzkäsebällchen mit feurigen Jalapeños in krosser Panade.',
    prices: { single: 5.50 },
    price: 5.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Starters/Artboard_7.png',
    badge: 'Scharf 🔥',
    dietary: ['vegetarisch']
  },
  {
    id: 'starter-onion-rings',
    number: '196',
    category: 'beilagen',
    name: 'Onion Rings (8 Stück)',
    toppings: '8x Zwiebelringe, BBQ-Sauce',
    desc: 'Knusprige Zwiebelringe im Backteig frittiert, serviert mit Barbecuesauce.',
    prices: { single: 4.90 },
    price: 4.90,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Starters/Artboard_8_S.png',
    badge: 'Snack-Hit',
    dietary: ['vegetarisch']
  },
  {
    id: 'starter-bruschetta',
    number: '197',
    category: 'beilagen',
    name: 'Bruschetta Classica (4 Stück)',
    toppings: '4x geröstetes Brot, Tomatenwürfel, Olivenöl, Knoblauch, frisches Basilikum',
    desc: 'Geröstetes Weißbrot belegt mit marinierten Tomaten, Knoblauch und Basilikum.',
    prices: { single: 5.90 },
    price: 5.90,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Starters/Artboard_9_st.png',
    badge: 'Italienisch',
    dietary: ['vegetarisch']
  },
  {
    id: 'starter-chicken-dippers',
    number: '198',
    category: 'beilagen',
    name: 'Chicken Dippers & Dip (6 Stück)',
    toppings: '6x Hähnchen-Dippers, Dip nach Wahl',
    desc: 'Zarte Hähnchenbrust-Streifen in knuspriger Panade mit Sauce nach Wahl.',
    prices: { single: 6.50 },
    price: 6.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Starters/Artboard_10_st.png',
    badge: 'Fingerfood',
    dietary: []
  },`;

content = content.replace(/\{\s*id:\s*'beilage-zaziki'[\s\S]*?dietary:\s*\['vegetarisch'\]\s*\}/, starterExtensions.trim());

fs.writeFileSync(menuPath, content, 'utf8');
console.log('Successfully updated src/data/menuData.js with all new category dishes!');
