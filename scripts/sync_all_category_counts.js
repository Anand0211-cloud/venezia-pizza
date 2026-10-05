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
  return supabase.storage.from(BUCKET).getPublicUrl(`${folder}/${safeFile}`).data.publicUrl;
}

async function syncAll() {
  console.log('--- Syncing All Category Dishes to Match Folder Image Counts ---\n');

  // ========================================================
  // 1. PASTA (9 images -> 9 dishes)
  // ========================================================
  const pastaDishes = [
    {
      id: 'pasta-rigatoni-forno',
      number: '50',
      category_id: 'pasta',
      name_de: 'Rigatoni al Forno (Überbacken)',
      name_en: 'Baked Rigatoni al Forno',
      desc_de: 'Röhrennudeln in reichhaltiger Rinderhackfleischsauce, mit einer goldgelben Käseschicht überbacken.',
      toppings_de: 'Rinderhackfleisch-Bolognese, Sahne, Gouda & Mozzarella überbacken',
      price: 8.90,
      image_url: getUrl('Pasta', 'Artboard 1.png'),
      is_in_stock: true
    },
    {
      id: 'pasta-bolognese',
      number: '51',
      category_id: 'pasta',
      name_de: 'Spaghetti Bolognese',
      name_en: 'Spaghetti Bolognese',
      desc_de: 'Klassische Spaghetti mit traditioneller italienischer Rinderhackfleischsauce.',
      toppings_de: 'Spaghetti, 100% Rinderhackfleisch, Tomatensugo, Kräuter',
      price: 8.00,
      image_url: getUrl('Pasta', 'Artboard 2.png'),
      is_in_stock: true
    },
    {
      id: 'pasta-carbonara',
      number: '52',
      category_id: 'pasta',
      name_de: 'Spaghetti Carbonara',
      name_en: 'Spaghetti Carbonara',
      desc_de: 'Spaghetti in sämiger Sahnesauce mit angebratenem Schinken und Parmesan.',
      toppings_de: 'Spaghetti, Hinterschinken, Ei-Sahnesauce, Parmesan',
      price: 8.50,
      image_url: getUrl('Pasta', 'Artboard 3.png'),
      is_in_stock: true
    },
    {
      id: 'pasta-lasagne',
      number: '53',
      category_id: 'pasta',
      name_de: 'Hausgemachte Lasagne Bolognese',
      name_en: 'Homemade Lasagna Bolognese',
      desc_de: 'Schicht für Schicht ein Genuss: Nudelblätter, Bologneseragout, Béchamelsauce und viel Käse.',
      toppings_de: 'Nudelblätter, Rinderhackfleisch, Béchamelsauce, Käsekruste',
      price: 9.20,
      image_url: getUrl('Pasta', 'Artboard 4.png'),
      is_in_stock: true
    },
    {
      id: 'pasta-cannelloni-forno',
      number: '53a',
      category_id: 'pasta',
      name_de: 'Cannelloni al Forno',
      name_en: 'Cannelloni al Forno',
      desc_de: 'Klassische italienische Cannelloni gefüllt mit saftigem Hackfleisch und gratiniertem Käse.',
      toppings_de: 'Gefüllte Nudelrollen mit Rinderhack, Tomatensauce, mit Gouda überbacken',
      price: 9.40,
      image_url: getUrl('Pasta', 'Artboard 5.png'),
      is_in_stock: true
    },
    {
      id: 'pasta-salmone',
      number: '54',
      category_id: 'pasta',
      name_de: 'Tagliatelle al Salmone',
      name_en: 'Salmon Tagliatelle',
      desc_de: 'Bandnudeln mit saftigen Lachsstücken in einer feinen Weißwein-Dillsauce.',
      toppings_de: 'Tagliatelle, Lachsfilet-Stücke, Weißwein-Sahnesauce, Dill',
      price: 10.50,
      image_url: getUrl('Pasta', 'Artboard 6.png'),
      is_in_stock: true
    },
    {
      id: 'pasta-arrabbiata',
      number: '54a',
      category_id: 'pasta',
      name_de: 'Penne all\'Arrabbiata (Scharf)',
      name_en: 'Spicy Penne all\'Arrabbiata',
      desc_de: 'Röhrennudeln in feuriger Tomatensauce mit Chili, Knoblauch und frischer Petersilie.',
      toppings_de: 'Penne, pikante Chilisauce, Knoblauch, Tomaten, frische Kräuter',
      price: 8.20,
      image_url: getUrl('Pasta', 'Artboard 7 p.png'),
      is_in_stock: true
    },
    {
      id: 'pasta-tortellini-panna',
      number: '54b',
      category_id: 'pasta',
      name_de: 'Tortellini alla Panna',
      name_en: 'Tortellini alla Panna',
      desc_de: 'Mit Fleisch gefüllte Teigtaschen in cremiger Schinken-Sahnesauce mit Parmesan.',
      toppings_de: 'Fleischtortellini, Hinterschinken, Sahnesauce, Parmesan',
      price: 8.90,
      image_url: getUrl('Pasta', 'Artboard 8 p.png'),
      is_in_stock: true
    },
    {
      id: 'pasta-frutti-di-mare',
      number: '54c',
      category_id: 'pasta',
      name_de: 'Spaghetti Frutti di Mare',
      name_en: 'Seafood Spaghetti',
      desc_de: 'Feine Spaghetti mit Meeresfrüchten, Knoblauch und Kräutern in Weißweinsauce.',
      toppings_de: 'Spaghetti, gemischte Meeresfrüchte, Knoblauch, Tomatensugo, Weißwein',
      price: 9.90,
      image_url: getUrl('Pasta', 'Artboard 9 p.png'),
      is_in_stock: true
    }
  ];

  await supabase.from('menu_items').upsert(pastaDishes, { onConflict: 'id' });
  console.log(`✓ Synchronized Pasta: 9 dishes linked to 9 images`);

  // ========================================================
  // 2. SALATE (8 images -> 8 dishes)
  // ========================================================
  const salateDishes = [
    {
      id: 'salad-venezia',
      number: '90',
      category_id: 'salate',
      name_de: 'Insalata Venezia (Großer Salatteller)',
      name_en: 'Insalata Venezia Large Salad',
      price: 8.90,
      image_url: getUrl('Salate', 'Artboard 1.png'),
      is_in_stock: true
    },
    {
      id: 'salad-tonno',
      number: '91',
      category_id: 'salate',
      name_de: 'Insalata Tonno',
      name_en: 'Tuna Salad',
      price: 8.00,
      image_url: getUrl('Salate', 'Artboard 2.png'),
      is_in_stock: true
    },
    {
      id: 'salad-mista',
      number: '92',
      category_id: 'salate',
      name_de: 'Insalata Mista (Gemischter Salat)',
      name_en: 'Mixed Salad',
      price: 6.50,
      image_url: getUrl('Salate', 'Artboard 3.png'),
      is_in_stock: true
    },
    {
      id: 'salad-caprese',
      number: '93',
      category_id: 'salate',
      name_de: 'Insalata Caprese',
      name_en: 'Caprese Salad',
      price: 7.50,
      image_url: getUrl('Salate', 'Artboard 4.png'),
      is_in_stock: true
    },
    {
      id: 'salad-pollo',
      number: '94',
      category_id: 'salate',
      name_de: 'Insalata Pollo (Hähnchen-Salat)',
      name_en: 'Chicken Salad',
      desc_de: 'Knackiger Salat mit zart gebratenen Hähnchenbruststreifen, Mais und Hausdressing.',
      toppings_de: 'Blattsalat, Hähnchenfilet, Tomaten, Gurken, Mais, Ei',
      price: 8.90,
      image_url: getUrl('Salate', 'Artboard 5.png'),
      is_in_stock: true
    },
    {
      id: 'salad-greca',
      number: '95',
      category_id: 'salate',
      name_de: 'Insalata Greca (Griechischer Bauernsalat)',
      name_en: 'Greek Salad',
      desc_de: 'Griechischer Bauernsalat mit original Schafskäse, schwarzen Oliven und roten Zwiebeln.',
      toppings_de: 'Schafskäse, Oliven, Peperoni, rote Zwiebeln, Tomaten, Gurken, Olivenöl',
      price: 8.50,
      image_url: getUrl('Salate', 'Artboard 6.png'),
      is_in_stock: true
    },
    {
      id: 'salad-hawaii',
      number: '96',
      category_id: 'salate',
      name_de: 'Insalata Hawaii',
      name_en: 'Hawaii Salad',
      desc_de: 'Fruchtig-frischer Salat mit saftigem Hinterschinken, Ananas und Gouda.',
      toppings_de: 'Blattsalat, Hinterschinken, Ananas, Käse, Mais, Tomaten',
      price: 8.00,
      image_url: getUrl('Salate', 'Artboard 7.png'),
      is_in_stock: true
    },
    {
      id: 'salad-chef',
      number: '97',
      category_id: 'salate',
      name_de: 'Insalata Chef Spezial',
      name_en: 'Chef Special Salad',
      desc_de: 'Reichhaltiger Salatteller mit Hinterschinken, Käse, gekochtem Ei und Thunfisch.',
      toppings_de: 'Blattsalat, Schinken, Käse, Ei, Thunfisch, Gurken, Tomaten, Dressing nach Wahl',
      price: 9.50,
      image_url: getUrl('Salate', 'Artboard 8 sl.png'),
      is_in_stock: true
    }
  ];

  await supabase.from('menu_items').upsert(salateDishes, { onConflict: 'id' });
  console.log(`✓ Synchronized Salate: 8 dishes linked to 8 images`);

  // ========================================================
  // 3. NOODLES / CHINESISCH (7 images -> 7 dishes)
  // ========================================================
  const noodlesDishes = [
    {
      id: 'asia-gebratene-nudeln-haehnchen',
      number: '180',
      category_id: 'chinesisch',
      name_de: 'Gebratene Nudeln mit Hähnchen',
      name_en: 'Fried Noodles with Chicken',
      price: 9.50,
      image_url: getUrl('noodles', 'Artboard 1.png'),
      is_in_stock: true
    },
    {
      id: 'asia-chop-suey',
      number: '182',
      category_id: 'chinesisch',
      name_de: 'Hähnchen Chop Suey',
      name_en: 'Chicken Chop Suey',
      price: 10.50,
      image_url: getUrl('noodles', 'Artboard 2.png'),
      is_in_stock: true
    },
    {
      id: 'asia-ente-suess-sauer',
      number: '183',
      category_id: 'chinesisch',
      name_de: 'Knusprige Ente Süß-Sauer',
      name_en: 'Crispy Duck Sweet & Sour',
      price: 12.90,
      image_url: getUrl('noodles', 'Artboard 3.png'),
      is_in_stock: true
    },
    {
      id: 'asia-bami-goreng',
      number: '184',
      category_id: 'chinesisch',
      name_de: 'Bami Goreng Spezial (mit Krabben)',
      name_en: 'Bami Goreng Special',
      desc_de: 'Indonesische gebratene Nudeln mit Hähnchen, Krabben, Gemüse und leichter Currynote.',
      toppings_de: 'Gebratene Nudeln, Krabben, Hähnchen, Wok-Gemüse, Ei, Curry',
      price: 10.90,
      image_url: getUrl('noodles', 'Artboard 4.png'),
      is_in_stock: true
    },
    {
      id: 'asia-gebratene-nudeln-ente',
      number: '185',
      category_id: 'chinesisch',
      name_de: 'Gebratene Nudeln mit knuspriger Ente',
      name_en: 'Fried Noodles with Crispy Duck',
      desc_de: 'Knusprig gebackene Ente auf gebratenen Eiernudeln mit Sojasprossen und Gemüse.',
      toppings_de: 'Knusprige Ente, Eiernudeln, Wok-Gemüse, Ei, Sojasprossen',
      price: 12.50,
      image_url: getUrl('noodles', 'Artboard 5.png'),
      is_in_stock: true
    },
    {
      id: 'asia-nudeln-rindfleisch',
      number: '186',
      category_id: 'chinesisch',
      name_de: 'Gebratene Nudeln mit Rindfleisch',
      name_en: 'Fried Noodles with Beef',
      desc_de: 'Zarte Rindfleischstreifen aus dem Wok mit Eiernudeln, Gemüse und feiner Sauce.',
      toppings_de: 'Rindfleischstreifen, Nudeln, Wok-Gemüse, Bambus, Sojasauce',
      price: 10.90,
      image_url: getUrl('noodles', 'Artboard 6.png'),
      is_in_stock: true
    },
    {
      id: 'asia-gebratene-nudeln-veg',
      number: '187',
      category_id: 'chinesisch',
      name_de: 'Gebratene Nudeln Vegetarisch',
      name_en: 'Vegetarian Fried Noodles',
      desc_de: 'Gebratene Eiernudeln mit buntem Marktgemüse, Sojasprossen und Ei.',
      toppings_de: 'Eiernudeln, Wok-Gemüse, Sojasprossen, Ei, Frühlingszwiebeln',
      price: 8.50,
      image_url: getUrl('noodles', 'Artboard 7.png'),
      is_in_stock: true
    }
  ];

  await supabase.from('menu_items').upsert(noodlesDishes, { onConflict: 'id' });
  console.log(`✓ Synchronized Noodles: 7 dishes linked to 7 images`);

  // ========================================================
  // 4. STARTERS / BEILAGEN (10 images -> 10 dishes)
  // ========================================================
  const startersDishes = [
    {
      id: 'beilage-pommes',
      number: '190',
      category_id: 'beilagen',
      name_de: 'Große Portion Pommes Frites',
      name_en: 'Large French Fries',
      price: 4.50,
      image_url: getUrl('Starters', 'Artboard 1.png'),
      is_in_stock: true
    },
    {
      id: 'beilage-kroketten',
      number: '191',
      category_id: 'beilagen',
      name_de: 'Portion Kroketten (8 Stk.)',
      name_en: 'Potato Croquettes',
      price: 4.50,
      image_url: getUrl('Starters', 'Artboard 2.png'),
      is_in_stock: true
    },
    {
      id: 'beilage-knoblauchbrot',
      number: '192',
      category_id: 'beilagen',
      name_de: 'Knoblauchbrot (4 Scheiben)',
      name_en: 'Garlic Bread (4 slices)',
      price: 4.80,
      image_url: getUrl('Starters', 'Artboard 3.png'),
      is_in_stock: true
    },
    {
      id: 'beilage-zaziki',
      number: '193',
      category_id: 'beilagen',
      name_de: 'Hausgemachter Zaziki mit Brot',
      name_en: 'Homemade Tzatziki with bread',
      price: 4.50,
      image_url: getUrl('Starters', 'Artboard 4.png'),
      is_in_stock: true
    },
    {
      id: 'snack-pizzabrotchen',
      number: '71',
      category_id: 'beilagen',
      name_de: '8 Stk. Gefüllte Pizzabrötchen',
      name_en: 'Stuffed Pizza Buns (8 pcs)',
      price: 5.50,
      image_url: getUrl('Starters', 'Artboard 5.png'),
      is_in_stock: true
    },
    {
      id: 'starter-mozzarella-sticks',
      number: '194',
      category_id: 'beilagen',
      name_de: 'Mozzarella Sticks (6 Stück)',
      name_en: 'Mozzarella Sticks (6 pcs)',
      desc_de: 'Goldgelb panierte Mozzarellasticks mit flüssigem Käsekern, inkl. Dip.',
      toppings_de: '6x Mozzarella Sticks, Preiselbeer- oder Knoblauch-Dip',
      price: 5.50,
      image_url: getUrl('Starters', 'Artboard 6.png'),
      is_in_stock: true
    },
    {
      id: 'starter-chili-cheese',
      number: '195',
      category_id: 'beilagen',
      name_de: 'Chili Cheese Nuggets (6 Stück)',
      name_en: 'Chili Cheese Nuggets (6 pcs)',
      desc_de: 'Pikante Schmelzkäsebällchen mit feurigen Jalapeños in krosser Panade.',
      toppings_de: '6x Chili Cheese Nuggets, inkl. Dip nach Wahl',
      price: 5.50,
      image_url: getUrl('Starters', 'Artboard 7.png'),
      is_in_stock: true
    },
    {
      id: 'starter-onion-rings',
      number: '196',
      category_id: 'beilagen',
      name_de: 'Onion Rings (8 Stück)',
      name_en: 'Crispy Onion Rings (8 pcs)',
      desc_de: 'Knusprige Zwiebelringe im Backteig frittiert, serviert mit Barbecuesauce.',
      toppings_de: '8x Zwiebelringe, BBQ-Sauce',
      price: 4.90,
      image_url: getUrl('Starters', 'Artboard 8 S.png'),
      is_in_stock: true
    },
    {
      id: 'starter-bruschetta',
      number: '197',
      category_id: 'beilagen',
      name_de: 'Bruschetta Classica (4 Stück)',
      name_en: 'Classic Bruschetta (4 pcs)',
      desc_de: 'Geröstetes Weißbrot belegt mit marinierten Tomaten, Knoblauch und Basilikum.',
      toppings_de: '4x geröstetes Brot, Tomatenwürfel, Olivenöl, Knoblauch, frisches Basilikum',
      price: 5.90,
      image_url: getUrl('Starters', 'Artboard 9 st.png'),
      is_in_stock: true
    },
    {
      id: 'starter-chicken-dippers',
      number: '198',
      category_id: 'beilagen',
      name_de: 'Chicken Dippers & Dip (6 Stück)',
      name_en: 'Chicken Dippers (6 pcs)',
      desc_de: 'Zarte Hähnchenbrust-Streifen in knuspriger Panade mit Sauce nach Wahl.',
      toppings_de: '6x Hähnchen-Dippers, Dip nach Wahl',
      price: 6.50,
      image_url: getUrl('Starters', 'Artboard 10 st.png'),
      is_in_stock: true
    }
  ];

  await supabase.from('menu_items').upsert(startersDishes, { onConflict: 'id' });
  console.log(`✓ Synchronized Starters: 10 dishes linked to 10 images`);

  console.log('\nAll categories synchronized successfully!');
}

syncAll();
