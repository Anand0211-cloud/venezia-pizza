import { images } from '../assets/images.js';

export const categoriesData = [
  { id: 'pizzen', name: 'Pizzen', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/pizza-1_img1_1791916964409.jpg', count: '45+ Sorten' },
  { id: 'deals', name: 'Spar-Menüs', sub: '& Deals', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish_1791869896776.jpg', count: 'Sparen' },
  { id: 'pasta', name: 'Pasta', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/pasta-tortellini-panna_1791831268343.jpg', count: 'Klassiker' },
  { id: 'gnocchi', name: 'Gnocchi', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/gnocchi-napoli_1791829866131.jpg', count: 'Spezialitäten' },
  { id: 'pasta-al-forno', name: 'Pasta al Forno', sub: 'Überbacken', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish-1791732749749_1791830426020.jpg', count: 'Aus dem Ofen' },
  { id: 'vegetarisch', name: 'Vegetarisch', sub: 'überbacken', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/veg-brokkoli-auflauf_1791828927375.jpg', count: 'Frisch & Heiß' },
  { id: 'auflaeufe', name: 'Aufläufe', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/auflauf-kartoffel-hack_1791826227266.jpg', count: 'Ofenfrisch' },
  { id: 'reisgerichte', name: 'Reisgerichte', sub: 'im Ofen überbacken', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Reisgerichte/Artboard_5.png', count: 'Aus dem Ofen' },
  { id: 'fleischgerichte', name: 'Fleischgerichte', sub: '& Schnitzel', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/fisch-lachs_1791800859098.jpg', count: '15 Gerichte' },
  { id: 'gyros', name: 'Gyros', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/doner-teller_1791825846772.jpg', count: 'Gyros Spezial' },
  { id: 'salate', name: 'Salate', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/salad-venezia_1791827518432.jpg', count: 'Frisch & Knackig' },
  { id: 'grill-menue', name: 'Grill Menü', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish_img1_1791916686663.jpg', count: 'Vom Rost' },
  { id: 'american-food', name: 'American Food', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Burgers/2.png', count: 'Burger & Co.' },
  { id: 'indisch', name: 'Indische', sub: 'Hauptgerichte', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/indisch-chicken-korma_img1_1791910847111.jpg', count: 'Currys & Reis' },
  { id: 'lamm', name: 'Lamb', sub: 'Spezialitäten', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/lamm-curry_img1_1791910415589.jpg', count: 'Zartes Fleisch' },
  { id: 'steaks', name: 'Steaks', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish_img1_1791916317183.jpg', count: 'Rumpsteaks' },
  { id: 'mexikanisch', name: 'Mexikanische', sub: 'Gerichte', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/mex-tacos_1791797525289.jpg', count: 'Tacos & Burritos' },
  { id: 'chinesisch', name: 'Chinesische', sub: 'Gerichte', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/asia-gebratene-nudeln-haehnchen_1791796580855.jpg', count: 'Wok-Gerichte' },
  { id: 'beilagen', name: 'Extra Beilagen', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/starter-chicken-dippers_1791792783090.jpg', count: 'Pommes & Dips' },
  { id: 'toasts', name: 'Toasts', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/toast-hawaii_1791834149871.jpg', count: 'Hawaii & mehr' },
  { id: 'omelette', name: 'Omelette', sub: 'mit Käse überbacken', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/omelette-natur_1791794752996.jpg', count: 'Mit Käsekruste' },
  { id: 'pesce-fisch', name: 'Pesce Fisch', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish_img1_1791914829647.jpg', count: 'Fischspezialitäten' },
  { id: 'manzo-vom-rind', name: 'Manzo Vom Rind', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/dish_img1_1791916317183.jpg', count: 'Rindfleisch' },
  { id: 'getraenke', name: 'Getränke', image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/pizza-211b_1791868332409.jpg', count: 'Eiskalt' },
];

export const standardPizzaSizes = [
  { id: 'small', name: 'Klein', dim: 'Ø 26 cm', key: 'small' },
  { id: 'large', name: 'Groß', dim: 'Ø 30 cm', key: 'large' },
  { id: 'family', name: 'Familie', dim: '33 × 46 cm', key: 'family' },
  { id: 'party', name: 'Party', dim: '40 × 60 cm', key: 'party' }
];

export const calzoneSizes = [
  { id: 'small', name: 'Klein', dim: 'Ø 26 cm', key: 'small' },
  { id: 'large', name: 'Groß', dim: 'Ø 30 cm', key: 'large' }
];

export const americanCrustPrices = {
  small: 3.00,
  large: 3.50,
  family: 4.50,
  party: 5.50
};

export const extraToppingPriceBySize = {
  small: 2.50,
  large: 3.00,
  family: 4.00,
  party: 5.00
};

export const pizzaExtraToppingsList = [
  { id: 'mozzarella', name: 'Extra Mozzarella / Käse' },
  { id: 'salami', name: 'Salami' },
  { id: 'schinken', name: 'Schinken' },
  { id: 'hackfleisch', name: 'Hackfleisch' },
  { id: 'donerfleisch', name: 'Dönerfleisch' },
  { id: 'champignons', name: 'Frische Champignons' },
  { id: 'zwiebeln', name: 'Rote Zwiebeln' },
  { id: 'knoblauch', name: 'Frischer Knoblauch / Knoblauchöl' },
  { id: 'peperoni-scharf', name: 'Scharfe Peperoni / Jalapeños' },
  { id: 'oliven', name: 'Schwarze Oliven' },
  { id: 'artischocken', name: 'Artischocken' },
  { id: 'feta', name: 'Schafskäse / Feta' },
  { id: 'gorgonzola', name: 'Gorgonzola' },
  { id: 'ananas', name: 'Ananas' },
  { id: 'mais', name: 'Mais' },
  { id: 'brokkoli', name: 'Brokkoli' },
  { id: 'krabben', name: 'Krabben / Meeresfrüchte' },
  { id: 'thunfisch', name: 'Thunfisch' }
];

// Helper to get image based on item name/category
const getPizzaImage = (name, toppings) => {
  const n = (name + ' ' + toppings).toLowerCase();
  if (n.includes('salami')) return images.pizzas.salami;
  if (n.includes('schinken') || n.includes('prosciutto')) return images.pizzas.prosciutto;
  if (n.includes('thunfisch') || n.includes('tonno')) return images.pizzas.tonno;
  if (n.includes('calzone') || n.includes('venezia') || n.includes('special')) return images.pizzas.special;
  return images.pizzas.margherita;
};

export const allMenuItems = [
  // ==========================================
  // 1. STANDARD PIZZAS 1–12 (€9.00 / €10.80 / €18.60 / €22.70)
  // ==========================================
  {
    id: 'pizza-1',
    number: '1',
    category: 'pizza',
    name: 'Pizza Margherita',
    toppings: 'Tomatensauce, Mozzarella',
    desc: 'Klassische italienische Pizza mit feiner Tomatensauce und geschmolzenem Mozzarella.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/pizza-1_1791203139418.png',
    image_url: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/pizza-1_1791203139418.png',
    badge: 'Klassiker',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-2',
    number: '2',
    category: 'pizza',
    name: 'Pizza Salami',
    toppings: 'Salami, Käse, Tomatensauce',
    desc: 'Knusprig gebackener Boden belegt mit herzhafter Rindersalami.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.salami,
    badge: 'Bestseller',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-3',
    number: '3',
    category: 'pizza',
    name: 'Pizza Schinken',
    toppings: 'Schinken, Käse, Tomatensauce',
    desc: 'Belegt mit saftigem Hinterschinken auf feiner Tomatensauce.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.prosciutto,
    badge: 'Beliebt',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-4',
    number: '4',
    category: 'pizza',
    name: 'Pizza Hamburger',
    toppings: 'Hackfleisch, Käse, Tomatensauce',
    desc: 'Kräftig gewürztes Rinderhackfleisch mit herzhaftem Käse.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.special,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-5',
    number: '5',
    category: 'pizza',
    name: 'Pizza Funghi',
    toppings: 'Champignons, Käse, Tomatensauce',
    desc: 'Frische Champignons auf fruchtiger Tomatensauce und Käse.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.margherita,
    badge: '',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-6',
    number: '6',
    category: 'pizza',
    name: 'Pizza Romana',
    toppings: 'Artischocken, Käse, Tomatensauce',
    desc: 'Feine Artischockenherzen auf original italienischem Teig.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.margherita,
    badge: '',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-7',
    number: '7',
    category: 'pizza',
    name: 'Pizza Tonno',
    toppings: 'Thunfisch, Käse, Tomatensauce',
    desc: 'Zarter Thunfisch auf fruchtiger Tomatensauce und Käse.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.tonno,
    badge: 'Empfehlung',
    dietary: ['pescetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-8',
    number: '8',
    category: 'pizza',
    name: 'Pizza Spinati',
    toppings: 'Spinat, Käse, Tomatensauce',
    desc: 'Aromatischer Blattspinat mit feinem Knoblauchhauch und Käse.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.margherita,
    badge: '',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-9',
    number: '9',
    category: 'pizza',
    name: 'Pizza Gamberetti',
    toppings: 'Krabben, Käse, Tomatensauce',
    desc: 'Feine Krabben auf Tomatensauce und goldbraunem Käse.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.tonno,
    badge: '',
    dietary: ['pescetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-10',
    number: '10',
    category: 'pizza',
    name: 'Pizza Brokkoli',
    toppings: 'Brokkoli, Käse, Tomatensauce',
    desc: 'Knackige Brokkoliröschen mit feinem Käse überbacken.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.margherita,
    badge: '',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-11',
    number: '11',
    category: 'pizza',
    name: 'Pizza Caprese',
    toppings: 'Mozzarella, frische Tomaten, Basilikum, Käse',
    desc: 'Frische Tomatenscheiben und zarter Mozzarella nach italienischer Art.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.margherita,
    badge: 'Traditionell',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-12',
    number: '12',
    category: 'pizza',
    name: 'Pizza Calabrese',
    toppings: 'Zwiebeln, Knoblauch, Käse, Tomatensauce',
    desc: 'Würzige Zwiebeln und aromatischer Knoblauch.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.margherita,
    badge: '',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },

  // ==========================================
  // 2. PIZZAS 13–17 (€9.50 / €11.00 / €20.10 / €24.20)
  // ==========================================
  {
    id: 'pizza-13',
    number: '13',
    category: 'pizza',
    name: 'Pizza Monaco',
    toppings: 'Salami, Schinken, Käse, Tomatensauce',
    desc: 'Köstliche Kombination aus pikanter Salami und saftigem Schinken.',
    prices: { small: 9.50, large: 11.00, family: 20.10, party: 24.20 },
    image: images.pizzas.salami,
    badge: 'Sehr beliebt',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-14',
    number: '14',
    category: 'pizza',
    name: 'Pizza Emilia',
    toppings: 'Salami, Champignons, Käse, Tomatensauce',
    desc: 'Herzhafte Salami harmonisch abgestimmt mit frischen Champignons.',
    prices: { small: 9.50, large: 11.00, family: 20.10, party: 24.20 },
    image: images.pizzas.salami,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-15',
    number: '15',
    category: 'pizza',
    name: 'Pizza Romana II',
    toppings: 'Schinken, Champignons, Käse, Tomatensauce',
    desc: 'Zarter Schinken und frische Pilze unter goldbraunem Käse.',
    prices: { small: 9.50, large: 11.00, family: 20.10, party: 24.20 },
    image: images.pizzas.prosciutto,
    badge: 'Klassiker',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-16',
    number: '16',
    category: 'pizza',
    name: 'Pizza Marinara',
    toppings: 'Thunfisch, Zwiebeln, Käse, Tomatensauce',
    desc: 'Saftiger Thunfisch mit frischen roten Zwiebeln.',
    prices: { small: 9.50, large: 11.00, family: 20.10, party: 24.20 },
    image: images.pizzas.tonno,
    badge: 'Empfehlung',
    dietary: ['pescetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-17',
    number: '17',
    category: 'pizza',
    name: 'Pizza Zingara',
    toppings: 'Krabben, Brokkoli, Käse, Tomatensauce',
    desc: 'Feine Meereskrabben kombiniert mit frischem Brokkoli.',
    prices: { small: 9.50, large: 11.00, family: 20.10, party: 24.20 },
    image: images.pizzas.tonno,
    badge: '',
    dietary: ['pescetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },

  // ==========================================
  // 3. PIZZAS 18–28a (€9.60 / €11.30 / €20.80 / €25.20)
  // ==========================================
  {
    id: 'pizza-18',
    number: '18',
    category: 'pizza',
    name: 'Pizza Hawaii',
    toppings: 'Schinken, Ananas, Curry, Käse, Tomatensauce',
    desc: 'Süße Ananas, herzhafter Schinken und eine feine Prise Curry.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.prosciutto,
    badge: 'Beliebt',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-19',
    number: '19',
    category: 'pizza',
    name: 'Pizza Roma',
    toppings: 'Mais, Knoblauch, Zwiebeln, Peperoni, Käse',
    desc: 'Würzige Peperoni mit Mais, Zwiebeln und kräftigem Knoblauch.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.margherita,
    badge: 'Pikant',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-19a',
    number: '19a',
    category: 'pizza',
    name: 'Pizza Pikante',
    toppings: 'Gyrosfleisch, frische Champignons, Paprika, Käse',
    desc: 'Herzhaftes Gyrosfleisch mit Champignons und bunter Paprika.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.dishes.doner,
    badge: 'Chef-Tipp',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-20',
    number: '20',
    category: 'pizza',
    name: 'Pizza Cypressa',
    toppings: 'Mais, Paprika, Ananas, Käse, Tomatensauce',
    desc: 'Fruchtig-bunte Kombination aus Mais, Paprika und Ananas.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.margherita,
    badge: '',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-20a',
    number: '20a',
    category: 'pizza',
    name: 'Pizza Adriano',
    toppings: 'Putenfleisch, scharfe Peperoni, Brokkoli, Käse',
    desc: 'Zartes Putenfleisch, pikante Peperoni und Brokkoli.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.special,
    badge: 'Scharf 🔥',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-21',
    number: '21',
    category: 'pizza',
    name: 'Pizza Twingo',
    toppings: 'Salami, Schinken, Champignons, Käse',
    desc: 'Dreifacher Genuss aus Salami, Hinterschinken und Pilzen.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.salami,
    badge: 'Bestseller',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-22',
    number: '22',
    category: 'pizza',
    name: 'Pizza Capri',
    toppings: 'Salami, Schinken, Hackfleisch, Käse',
    desc: 'Kräftig belegt mit Salami, Schinken und gewürztem Rinderhackfleisch.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.salami,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-23',
    number: '23',
    category: 'pizza',
    name: 'Pizza Kurier',
    toppings: 'Salami, Champignons, Hackfleisch, Käse',
    desc: 'Salami, frische Champignons und saftiges Hackfleisch.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.salami,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-24',
    number: '24',
    category: 'pizza',
    name: 'Pizza Frühling',
    toppings: 'Schinken, Champignons, Hackfleisch, Käse',
    desc: 'Zarter Schinken, Pilze und Rinderhackfleisch unter Käse.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.prosciutto,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-25',
    number: '25',
    category: 'pizza',
    name: 'Pizza Sizilia',
    toppings: 'Schinken, Spinat, Ei, Käse, Tomatensauce',
    desc: 'Schinken und aromatischer Blattspinat verfeinert mit gekochtem Ei.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.prosciutto,
    badge: 'Traditionell',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-26',
    number: '26',
    category: 'pizza',
    name: 'Pizza Cipolla',
    toppings: 'Schinken, Zwiebel, Ei, Käse, Tomatensauce',
    desc: 'Schinken mit würzigen Zwiebeln und feinem Ei.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.prosciutto,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-27',
    number: '27',
    category: 'pizza',
    name: 'Pizza Amarica',
    toppings: 'Thunfisch, Champignons, scharfe Peperoni, Käse',
    desc: 'Thunfisch mit frischen Champignons und feurigen Peperoni.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.tonno,
    badge: 'Scharf 🔥',
    dietary: ['pescetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-28',
    number: '28',
    category: 'pizza',
    name: 'Pizza Mexicana',
    toppings: 'Mais, Paprika, Salami, Käse, Tomatensauce',
    desc: 'Knackiger Mais, bunte Paprika und pikante Salami.',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.pizzas.salami,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-28a',
    number: '28a',
    category: 'pizza',
    name: 'Pizza Diavolo',
    toppings: 'Spaghetti Bolognese, scharfe Peperoni, Käse',
    desc: 'Einzigartig: Belegt mit Spaghetti Bolognese und feurigen Peperoni!',
    prices: { small: 9.60, large: 11.30, family: 20.80, party: 25.20 },
    image: images.dishes.pastaSpecial,
    badge: 'Spezialität 🔥',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },

  // ==========================================
  // 4. PIZZAS 29–37 (€10.10 / €11.80 / €21.00 / €26.00)
  // ==========================================
  {
    id: 'pizza-29',
    number: '29',
    category: 'pizza',
    name: 'Pizza Ruschio',
    toppings: 'Salami, Schinken, Champignons, Zwiebeln, Käse',
    desc: 'Reich belegt mit Salami, Schinken, frischen Pilzen und Zwiebeln.',
    prices: { small: 10.10, large: 11.80, family: 21.00, party: 26.00 },
    image: images.pizzas.special,
    badge: 'Sehr beliebt',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-30',
    number: '30',
    category: 'pizza',
    name: 'Pizza Texas',
    toppings: 'Salami, Schinken, Champignons, Peperoni, Käse',
    desc: 'Herzhafter Western-Style mit Salami, Schinken, Pilzen und Peperoni.',
    prices: { small: 10.10, large: 11.80, family: 21.00, party: 26.00 },
    image: images.pizzas.salami,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-31',
    number: '31',
    category: 'pizza',
    name: 'Pizza Milano',
    toppings: 'Schinken, Brokkoli, Mozzarella, Käse',
    desc: 'Feiner Schinken, knackiger Brokkoli und zart schmelzender Mozzarella.',
    prices: { small: 10.10, large: 11.80, family: 21.00, party: 26.00 },
    image: images.pizzas.prosciutto,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-32',
    number: '32',
    category: 'pizza',
    name: 'Pizza Vier Jahreszeiten',
    toppings: 'Salami, Schinken, Champignons, Paprika, Käse',
    desc: 'Quattro Stagioni: 4 beliebte Zutaten in harmonischer Perfektion.',
    prices: { small: 10.10, large: 11.80, family: 21.00, party: 26.00 },
    image: images.pizzas.special,
    badge: 'Klassiker',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-33',
    number: '33',
    category: 'pizza',
    name: 'Pizza Gyrosa',
    toppings: 'Gyrospizza mit Putenfleisch, Tomaten, Zwiebeln, Paprika',
    desc: 'Herzhaftes Gyrosfleisch von der Pute mit Tomaten, Zwiebeln & Paprika.',
    prices: { small: 10.10, large: 11.80, family: 21.00, party: 26.00 },
    image: images.dishes.doner,
    badge: 'Bestseller',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-34',
    number: '34',
    category: 'pizza',
    name: 'Pizza Italia',
    toppings: 'Salami, Schinken, Champignons, Peperoni, Oliven, Käse',
    desc: 'Mediterrane Komposition mit Salami, Schinken, Pilzen, Peperoni und Oliven.',
    prices: { small: 10.10, large: 11.80, family: 21.00, party: 26.00 },
    image: images.pizzas.special,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-35',
    number: '35',
    category: 'pizza',
    name: 'Pizza Mix',
    toppings: 'Salami, Schinken, Champignons, Zwiebeln, Hackfleisch',
    desc: 'Die volle Vielfalt: 5 reichhaltige Beläge auf knusprigem Boden.',
    prices: { small: 10.10, large: 11.80, family: 21.00, party: 26.00 },
    image: images.pizzas.special,
    badge: 'Top Tipp',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-36',
    number: '36',
    category: 'pizza',
    name: 'Pizza Capricciosa',
    toppings: 'Salami, Schinken, Artischocken, Oliven, Knoblauch',
    desc: 'Italienische Spezialität mit Salami, Schinken, Artischocken, Oliven und Knoblauch.',
    prices: { small: 10.10, large: 11.80, family: 21.00, party: 26.00 },
    image: images.pizzas.special,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-37',
    number: '37',
    category: 'pizza',
    name: 'Pizza Nach Art des Hauses',
    toppings: 'Salami, Schinken, Mais, Knoblauch, Käse',
    desc: 'Die Hauskreation von Venezia mit Salami, Schinken, Mais und Knoblauch.',
    prices: { small: 10.10, large: 11.80, family: 21.00, party: 26.00 },
    image: images.pizzas.special,
    badge: 'Haus-Tipp',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },

  // ==========================================
  // 5. CALZONE 38–39a (€10.30 / €12.00)
  // ==========================================
  {
    id: 'pizza-38',
    number: '38',
    category: 'calzone',
    name: 'Calzone Classico',
    toppings: 'Salami, Schinken, Champignons, Hackfleisch, Paprika, Käse',
    desc: 'Traditionell gefüllte und zusammengeklappte Pizza, saftig im Steinofen gebacken.',
    prices: { small: 10.30, large: 12.00 },
    image: images.pizzas.special,
    badge: 'Gefüllt',
    dietary: [],
    sizesAvailable: false,
    calzoneSizes: true
  },
  {
    id: 'pizza-39',
    number: '39',
    category: 'calzone',
    name: 'Calzone Vegetarisch',
    toppings: 'Frisches Gemüse der Saison, Käse, Tomatensauce',
    desc: 'Gefüllte Calzone mit buntem, frischem Marktgemüse und geschmolzenem Käse.',
    prices: { small: 10.30, large: 12.00 },
    image: images.pizzas.special,
    badge: 'Vegetarisch',
    dietary: ['vegetarisch'],
    sizesAvailable: false,
    calzoneSizes: true
  },
  {
    id: 'pizza-39a',
    number: '39a',
    category: 'calzone',
    name: 'Calzone Döner',
    toppings: 'Dönerfleisch, Schafskäse, Tomate, Zwiebeln, Käse',
    desc: 'Herzhaft gefüllt mit saftigem Dönerfleisch, würzigem Schafskäse und Tomaten.',
    prices: { small: 10.30, large: 12.00 },
    image: images.dishes.doner,
    badge: 'Bestseller',
    dietary: [],
    sizesAvailable: false,
    calzoneSizes: true
  },

  // ==========================================
  // 6. PIZZAS 40–42 (€10.10 / €11.80 / €21.30 / €26.20)
  // ==========================================
  {
    id: 'pizza-40',
    number: '40',
    category: 'pizza',
    name: 'Pizza Frutti di Mare',
    toppings: 'Meeresfrüchte, Knoblauch, Käse, Tomatensauce',
    desc: 'Ausgewählte Meeresfrüchte mit feinem Knoblauch und Kräutern.',
    prices: { small: 10.10, large: 11.80, family: 21.30, party: 26.20 },
    image: images.pizzas.tonno,
    badge: 'Meeresfrüchte',
    dietary: ['pescetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-41',
    number: '41',
    category: 'pizza',
    name: 'Pizza Cossa',
    toppings: 'Schinken, Mozzarella, Ei, Käse, Tomatensauce',
    desc: 'Zarter Hinterschinken, weicher Mozzarella und gekochtes Ei.',
    prices: { small: 10.10, large: 11.80, family: 21.30, party: 26.20 },
    image: images.pizzas.prosciutto,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-42',
    number: '42',
    category: 'pizza',
    name: 'Pizza Quattro Formaggi',
    toppings: 'Mozzarella, Gorgonzola, Parmesan, Gouda, Tomatensauce',
    desc: 'Vier erlesene Käsesorten für den vollen mediterranen Käsegenuss.',
    prices: { small: 10.10, large: 11.80, family: 21.30, party: 26.20 },
    image: images.pizzas.margherita,
    badge: 'Käse-Genuss',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },

  // ==========================================
  // 7. PIZZAS 43–45b (€10.30 / €12.50 / €21.80 / €27.20)
  // ==========================================
  {
    id: 'pizza-43',
    number: '43',
    category: 'pizza',
    name: 'Pizza Goloso',
    toppings: 'Salami, Schinken, Champignons, Knoblauch, Curry, Käse',
    desc: 'Salami, Schinken und Champignons mit aromatischem Knoblauch & Curry.',
    prices: { small: 10.30, large: 12.50, family: 21.80, party: 27.20 },
    image: images.pizzas.special,
    badge: '',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-44',
    number: '44',
    category: 'pizza',
    name: 'Pizza Alla Rucola',
    toppings: 'Hackfleisch, Schinken, Kapern, Peperoni, Champignons, Artischocken, Sardellen',
    desc: 'Kräftig-mediterrane Spezialität mit 7 aromatischen Zutaten.',
    prices: { small: 10.30, large: 12.50, family: 21.80, party: 27.20 },
    image: images.pizzas.special,
    badge: 'Gourmet',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-45',
    number: '45',
    category: 'pizza',
    name: 'Pizza Chef',
    toppings: 'Thunfisch, Zwiebeln, Champignons, Paprika, scharfe Peperoni',
    desc: 'Die Empfehlung des Küchenchefs: Thunfisch, Pilze, Paprika & feurige Schärfe.',
    prices: { small: 10.30, large: 12.50, family: 21.80, party: 27.20 },
    image: images.pizzas.tonno,
    badge: 'Chef-Tipp 🔥',
    dietary: ['pescetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-45b',
    number: '45b',
    category: 'pizza',
    name: 'Pizza Döner',
    toppings: 'Dönerfleisch, Zwiebeln, Käse, Tomatensauce',
    desc: 'Saftiges Dönerfleisch und Zwiebeln auf goldbraun gebackenem Käse.',
    prices: { small: 10.30, large: 12.50, family: 21.80, party: 27.20 },
    image: images.dishes.doner,
    badge: 'Bestseller',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },

  // ==========================================
  // 8. PIZZA 46 VENEZIA DIY (€11.00 / €13.00 / €24.00 / €33.00)
  // ==========================================
  {
    id: 'pizza-46',
    number: '46',
    category: 'pizza',
    name: 'Pizza Venezia (Wunschpizza)',
    toppings: 'Pizza selbst zusammenstellen, bis zu 5 Wunschauflagen',
    desc: 'Stellen Sie Ihre Lieblingspizza völlig frei mit bis zu 5 beliebigen Zutaten zusammen!',
    prices: { small: 11.00, large: 13.00, family: 24.00, party: 33.00 },
    image: images.pizzas.special,
    badge: 'Wunschpizza ⭐',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },

  // ==========================================
  // 9. PIZZAS 47–49a (€10.80 / €13.00 / €22.80 / €28.20)
  // ==========================================
  {
    id: 'pizza-47',
    number: '47',
    category: 'pizza',
    name: 'Pizza Indisch',
    toppings: 'Salami, Schinken, Champignons, Zwiebeln, Knoblauch, Garam-Masala, Curry, Ei',
    desc: 'Indisch inspirierte Gewürze: Garam Masala, Curry, Salami, Schinken & Ei.',
    prices: { small: 10.80, large: 13.00, family: 22.80, party: 28.20 },
    image: images.pizzas.special,
    badge: 'Würz-Highlight',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-48',
    number: '48',
    category: 'pizza',
    name: 'Pizza Vegetarisch Spezial',
    toppings: 'Artischocken, Paprika, Zwiebeln, Champignons, Peperoni, Oliven',
    desc: 'Große bunte Gemüseauswahl mit Artischocken, Paprika, Pilzen und Oliven.',
    prices: { small: 10.80, large: 13.00, family: 22.80, party: 28.20 },
    image: images.pizzas.margherita,
    badge: 'Vegetarisch 🌱',
    dietary: ['vegetarisch'],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-49',
    number: '49',
    category: 'pizza',
    name: 'Pizza Pippo',
    toppings: 'Salami, Schinken, Champignons, Knoblauch, Zwiebeln, Curry, scharfe Peperoni',
    desc: 'Pikant-würzig mit Salami, Schinken, Pilzen, Knoblauch, Curry & Schärfe.',
    prices: { small: 10.80, large: 13.00, family: 22.80, party: 28.20 },
    image: images.pizzas.special,
    badge: 'Scharf 🔥',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },
  {
    id: 'pizza-49a',
    number: '49a',
    category: 'pizza',
    name: 'Pizza Pollo',
    toppings: 'Gebratenes Hühnerfleisch, Brokkoli, Knoblauch, Peperoni, feine Gewürze',
    desc: 'Zart gebratene Hähnchenbruststücke mit Brokkoli, Knoblauch und Peperoni.',
    prices: { small: 10.80, large: 13.00, family: 22.80, party: 28.20 },
    image: images.pizzas.special,
    badge: 'Sehr beliebt',
    dietary: [],
    sizesAvailable: true,
    supportsAmerican: true
  },

  // ==========================================
  // 10. EXTRAS (PIZZABROT / KNOBLAUCHBROT)
  // ==========================================
  {
    id: 'extra-pizzabrot',
    number: 'E1',
    category: 'calzone',
    name: 'Pizzabrot',
    toppings: 'Frisch gebackenes Pizzabrot mit Olivenöl und Kräutern',
    desc: 'Warmes, knuspriges Pizzabrot aus frischem Hefeteig mit Kräutern.',
    prices: { small: 4.80, large: 5.50 },
    image: images.pizzas.margherita,
    badge: 'Beilage',
    dietary: ['vegan'],
    sizesAvailable: false,
    calzoneSizes: true
  },
  {
    id: 'extra-knoblauchbrot',
    number: 'E2',
    category: 'calzone',
    name: 'Knoblauchbrot',
    toppings: 'Frisch gebackenes Brot mit frischem Knoblauchöl und Kräutern',
    desc: 'Knusprig im Ofen gebacken mit extra aromatischem Knoblauchöl.',
    prices: { small: 5.80, large: 6.50 },
    image: images.pizzas.margherita,
    badge: 'Beilage',
    dietary: ['vegan'],
    sizesAvailable: false,
    calzoneSizes: true
  },

  // ==========================================
  // ==========================================
  // PASTA SPEZIALITÄTEN (9 Gerichte - Artboard 1 bis 9)
  // ==========================================
  {
    id: 'pasta-rigatoni-forno',
    number: '50',
    category: 'pasta',
    name: 'Rigatoni al Forno (Überbacken)',
    toppings: 'Rinderhackfleisch-Bolognese, Sahne, Gouda & Mozzarella überbacken',
    desc: 'Röhrennudeln in reichhaltiger Rinderhackfleischsauce, mit einer goldgelben Käseschicht überbacken.',
    prices: { single: 8.90 },
    price: 8.90,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Pasta/Artboard_1.png',
    badge: 'Bestseller',
    dietary: []
  },
  {
    id: 'pasta-bolognese',
    number: '51',
    category: 'pasta',
    name: 'Spaghetti Bolognese',
    toppings: 'Spaghetti, 100% Rinderhackfleisch, Tomatensugo, Kräuter',
    desc: 'Klassische Spaghetti mit traditioneller italienischer Rinderhackfleischsauce.',
    prices: { single: 8.00 },
    price: 8.00,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Pasta/Artboard_2.png',
    badge: 'Klassiker',
    dietary: []
  },
  {
    id: 'pasta-carbonara',
    number: '52',
    category: 'pasta',
    name: 'Spaghetti Carbonara',
    toppings: 'Spaghetti, Hinterschinken, Ei-Sahnesauce, Parmesan',
    desc: 'Spaghetti in sämiger Sahnesauce mit angebratenem Schinken und Parmesan.',
    prices: { single: 8.50 },
    price: 8.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Pasta/Artboard_3.png',
    badge: '',
    dietary: []
  },
  {
    id: 'pasta-lasagne',
    number: '53',
    category: 'pasta',
    name: 'Hausgemachte Lasagne Bolognese',
    toppings: 'Nudelblätter, Rinderhackfleisch, Béchamelsauce, Käsekruste',
    desc: 'Schicht für Schicht ein Genuss: Nudelblätter, Bologneseragout, Béchamelsauce und viel Käse.',
    prices: { single: 9.20 },
    price: 9.20,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Pasta/Artboard_4.png',
    badge: 'Hausgemacht',
    dietary: []
  },
  {
    id: 'pasta-cannelloni-forno',
    number: '53a',
    category: 'pasta',
    name: 'Cannelloni al Forno',
    toppings: 'Gefüllte Nudelrollen mit Rinderhack, Tomatensauce, mit Gouda überbacken',
    desc: 'Klassische italienische Cannelloni gefüllt mit saftigem Hackfleisch und gratiniertem Käse.',
    prices: { single: 9.40 },
    price: 9.40,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Pasta/Artboard_5.png',
    badge: 'Traditionell',
    dietary: []
  },
  {
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
  },

  // ==========================================
  // GNOCCHI
  // ==========================================
  {
    id: 'gnocchi-napoli',
    number: '55',
    category: 'gnocchi',
    name: 'Gnocchi Napoli',
    toppings: 'Kartoffelklößchen, fruchtige Tomatensauce, frisches Basilikum',
    desc: 'Zarte italienische Kartoffelgnocchi in aromatischer Tomatensauce mit Kräutern.',
    prices: { single: 8.20 },
    price: 8.20,
    image: images.dishes.pastaSpecial,
    badge: 'Vegetarisch',
    dietary: ['vegetarisch']
  },
  {
    id: 'gnocchi-bolognese',
    number: '56',
    category: 'gnocchi',
    name: 'Gnocchi Bolognese',
    toppings: 'Kartoffelgnocchi, hausgemachte Rinderhackfleischsauce, Parmesan',
    desc: 'Gnocchi mit unserer herzhaften, langsam geschmorten Bolognese-Fleischsauce.',
    prices: { single: 8.90 },
    price: 8.90,
    image: images.dishes.pastaSpecial,
    badge: 'Beliebt',
    dietary: []
  },
  {
    id: 'gnocchi-gorgonzola',
    number: '57',
    category: 'gnocchi',
    name: 'Gnocchi Gorgonzola',
    toppings: 'Gnocchi, italienischer Gorgonzola-Käse, feine Sahnesauce',
    desc: 'Cremig und intensiv im Geschmack: Gnocchi in sämiger Gorgonzolasauce.',
    prices: { single: 9.20 },
    price: 9.20,
    image: images.dishes.pastaSpecial,
    badge: 'Cremig',
    dietary: ['vegetarisch']
  },
  {
    id: 'gnocchi-al-forno',
    number: '58',
    category: 'gnocchi',
    name: 'Gnocchi al Forno (Überbacken)',
    toppings: 'Gnocchi, Schinken, Tomaten-Sahnesauce, mit Käse überbacken',
    desc: 'Ofenfrisch gebacken mit Hinterschinken, feiner Tomaten-Sahnesauce und goldgelbem Gouda.',
    prices: { single: 9.50 },
    price: 9.50,
    image: images.dishes.pastaSpecial,
    badge: 'Ofenfrisch',
    dietary: []
  },

  // ==========================================
  // REISGERICHTE IM OFEN ÜBERBACKEN (3 Gerichte - 100% synchron mit Backend Admin)
  // ==========================================
  {
    id: 'reis-pollo-curry',
    number: '93',
    category: 'reisgerichte',
    name: 'Reis al Forno',
    name_de: 'Reis al Forno',
    toppings: 'mit Fleischsauce und mit Käse überbacken',
    desc: 'Würziger Reis aus dem Ofen, herzhaft mit Fleischsauce zubereitet und mit goldbraunem Käse überbacken.',
    prices: { single: 13.00 },
    price: 13.00,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Reisgerichte/Artboard_1.png',
    badge: 'Klassiker',
    dietary: []
  },
  {
    id: 'reis-bombay',
    number: '94',
    category: 'reisgerichte',
    name: 'Risotto Pescatore',
    name_de: 'Risotto Pescatore',
    toppings: 'mit Meeresfrüchten, Knoblauch und Tomatensauce',
    desc: 'Mediterranes Risotto mit feinen Meeresfrüchten, Knoblauch und pikanter Tomatensauce aus dem Ofen.',
    prices: { single: 13.00 },
    price: 13.00,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Reisgerichte/Artboard_2.png',
    badge: 'Meeresfrüchte',
    dietary: ['pescetarisch']
  },
  {
    id: 'reis-gyros-spezial',
    number: '95',
    category: 'reisgerichte',
    name: 'Risotto Milanese Reis',
    name_de: 'Risotto Milanese Reis',
    toppings: 'mit Krabben und Champignons in Tomatensauce',
    desc: 'Feines Risotto Milanese mit saftigen Krabben, frischen Champignons und pikanter Tomatensauce aus dem Ofen.',
    prices: { single: 13.00 },
    price: 13.00,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Reisgerichte/Artboard_3.png',
    badge: 'Spezialität',
    dietary: []
  },

  // ==========================================

  // ==========================================
  // VEGETARISCH ÜBERBACKEN
  // ==========================================
  {
    id: 'veg-brokkoli-auflauf',
    number: '65',
    category: 'vegetarisch',
    name: 'Brokkoli-Auflauf vegetarisch überbacken',
    toppings: 'Brokkoliröschen, Kartoffeln, Sauce Hollandaise, mit Käse überbacken',
    desc: 'Zarter Brokkoli mit Kartoffelscheiben in feiner Sauce Hollandaise und knusprigem Käse.',
    prices: { single: 8.90 },
    price: 8.90,
    image: images.categories.salad,
    badge: 'Veggie-Hit',
    dietary: ['vegetarisch']
  },
  {
    id: 'veg-blumenkohl-topf',
    number: '66',
    category: 'vegetarisch',
    name: 'Blumenkohl-Brokkoli-Topf überbacken',
    toppings: 'Frischer Blumenkohl, Brokkoli, Kartoffeln, Sahnesauce, mit Gouda überbacken',
    desc: 'Herrlich frisches Gemüse im Ofen goldgelb mit herzhaftem Käse gratiniert.',
    prices: { single: 8.90 },
    price: 8.90,
    image: images.categories.salad,
    badge: 'Vegetarisch',
    dietary: ['vegetarisch']
  },
  {
    id: 'veg-spinat-gratin',
    number: '67',
    category: 'vegetarisch',
    name: 'Spinat-Kartoffel-Gratin überbacken',
    toppings: 'Blattspinat, Kartoffelscheiben, Knoblauch, feine Sahnesauce, Käse',
    desc: 'Würziger Blattspinat und Kartoffeln mit zarter Knoblauchnote und Käsekruste.',
    prices: { single: 8.80 },
    price: 8.80,
    image: images.categories.salad,
    badge: 'Vegetarisch',
    dietary: ['vegetarisch']
  },

  // ==========================================
  // AUFLÄUFE
  // ==========================================
  {
    id: 'auflauf-kartoffel-hack',
    number: '75',
    category: 'auflaeufe',
    name: 'Kartoffel-Hackfleisch-Auflauf',
    toppings: 'Kartoffelscheiben, Rinderhackfleisch, Zwiebeln, Sahnesauce, Gouda überbacken',
    desc: 'Herzhafter Ofenauflauf mit Kartoffeln und würzigem Hackfleisch unter einer Käsekruste.',
    prices: { single: 9.50 },
    price: 9.50,
    image: images.dishes.pastaSpecial,
    badge: 'Deftig',
    dietary: []
  },
  {
    id: 'auflauf-venezia-spezial',
    number: '76',
    category: 'auflaeufe',
    name: 'Venezia Spezial-Auflauf',
    toppings: 'Hähnchenbrust, Kartoffeln, Champignons, Brokkoli, Sahnesauce, Käse',
    desc: 'Unser Haus-Auflauf mit zarter Hähnchenbrust, frischem Gemüse und reichlich Käse.',
    prices: { single: 9.90 },
    price: 9.90,
    image: images.dishes.pastaSpecial,
    badge: 'Haus-Spezialität',
    dietary: []
  },
  {
    id: 'auflauf-nudel-schinken',
    number: '77',
    category: 'auflaeufe',
    name: 'Nudel-Schinken-Auflauf',
    toppings: 'Rigatoni, Formfleisch-Schinken, frische Champignons, Sahnesauce, Käse',
    desc: 'Der klassische Nudelauflauf mit viel Schinken, Champignons und goldener Käseschicht.',
    prices: { single: 9.20 },
    price: 9.20,
    image: images.dishes.pastaSpecial,
    badge: 'Klassiker',
    dietary: []
  },

  // ==========================================
  // GYROS
  // ==========================================
  {
    id: 'gyros-teller',
    number: '60',
    category: 'gyros',
    name: 'Gyrosteller Komplett mit Beilage',
    toppings: 'Fein gewürztes Gyrosfleisch, Zaziki, Zwiebeln, Pommes Frites, gemischter Salat',
    desc: 'Traditionell gewürztes, zartes Gyrosfleisch serviert mit hausgemachtem Zaziki, knusprigen Pommes und frischem Salat.',
    prices: { single: 10.50 },
    price: 10.50,
    image: images.categories.doner,
    badge: 'Bestseller',
    dietary: []
  },
  {
    id: 'gyros-ueberbacken',
    number: '61',
    category: 'gyros',
    name: 'Gyros überbacken in Metaxasauce',
    toppings: 'Gyrosfleisch, pikante Metaxasauce, mit Käse überbacken, dazu Pommes',
    desc: 'Pfannengyros in cremiger Metaxasauce, im Ofen goldbraun mit Käse überbacken.',
    prices: { single: 11.20 },
    price: 11.20,
    image: images.categories.doner,
    badge: 'Sehr beliebt',
    dietary: []
  },
  {
    id: 'doner-teller',
    number: '62',
    category: 'gyros',
    name: 'Dönerteller Komplett mit Beilage',
    toppings: 'Drehspießfleisch, Pommes/Reis, Salat, Knoblauch- & Kräutersauce',
    desc: 'Zartes Drehspießfleisch serviert mit Pommes oder Reis, frischem Salat und Saucen.',
    prices: { single: 9.50 },
    price: 9.50,
    image: images.categories.doner,
    badge: 'Klassiker',
    dietary: []
  },
  {
    id: 'doner-durum',
    number: '63',
    category: 'gyros',
    name: 'Dürüm Döner (Wraprolle)',
    toppings: 'Fladenbrotteig, Drehspießfleisch, Salatmix, Sauce',
    desc: 'Frisch gerolltes Fladenbrot gefüllt mit saftigem Dönerfleisch und Salat.',
    prices: { single: 7.00 },
    price: 7.00,
    image: images.categories.doner,
    badge: '',
    dietary: []
  },
  {
    id: 'doner-box',
    number: '64',
    category: 'gyros',
    name: 'Dönerbox mit Pommes',
    toppings: 'Drehspießfleisch, Pommes Frites, Sauce nach Wahl',
    desc: 'Handliche Box vollgepackt mit heißem Drehspießfleisch und Pommes Frites.',
    prices: { single: 6.00 },
    price: 6.00,
    image: images.categories.doner,
    badge: 'Quick Snack',
    dietary: []
  },

  // ==========================================
  // BURGER & SNACKS
  // ==========================================
  {
    id: 'burger-double',
    number: '70',
    category: 'american-food',
    name: 'Venezia Double Cheeseburger & Pommes',
    toppings: '2x Rindfleisch-Patty, Brioche Bun, Cheddar, Bacon, Pommes',
    desc: 'Zwei 100% Rindfleisch-Patties, doppelter Cheddar, knuspriger Bacon und Pommes Frites.',
    prices: { single: 9.90 },
    price: 9.90,
    image: images.dishes.burgerCrispy,
    badge: 'Mega Burger 🍔',
    dietary: []
  },
  {
    id: 'snack-pizzabrotchen',
    number: '71',
    category: 'beilagen',
    name: '8 Stk. Gefüllte Pizzabrötchen',
    toppings: 'Gouda, Schinken/Salami, Kräuterbutter',
    desc: 'Ofenfrische Bällchen gefüllt mit Käse & Schinken/Salami inkl. Kräuterbutter.',
    prices: { single: 5.50 },
    price: 5.50,
    image: images.categories.pizza,
    badge: 'Snack-Hit',
    dietary: []
  },


  // ==========================================
  // SALATE
  // ==========================================
  {
    id: 'salad-venezia',
    number: '90',
    category: 'salate',
    name: 'Insalata Venezia (Großer Salatteller)',
    toppings: 'Blattsalat, Hähnchenstreifen, Ei, Mais, Gurken, Tomaten',
    desc: 'Große Salatschüssel mit gebratenem Hähnchenfilet, Ei und Hausdressing.',
    prices: { single: 8.90 },
    price: 8.90,
    image: images.dishes.salad,
    badge: 'Empfehlung',
    dietary: []
  },
  {
    id: 'salad-tonno',
    number: '91',
    category: 'salate',
    name: 'Insalata Tonno',
    toppings: 'Thunfisch, rote Zwiebeln, Oliven, Tomaten, Gurken',
    desc: 'Frischer Salatmix mit feinem Thunfisch, Zwiebelringen und Oliven.',
    prices: { single: 8.00 },
    price: 8.00,
    image: images.categories.salad,
    badge: '',
    dietary: ['pescetarisch']
  },
  {
    id: 'salad-mista',
    number: '92',
    category: 'salate',
    name: 'Insalata Mista (Gemischter Salat)',
    toppings: 'Knackiger Blattsalat, Gurken, Tomaten, Paprika, Mais, Hausdressing',
    desc: 'Frischer bunter Marktsalat mit knackigem Gemüse und feinem Dressing.',
    prices: { single: 6.50 },
    price: 6.50,
    image: images.categories.salad,
    badge: 'Frisch',
    dietary: ['vegetarisch']
  },
  {
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
  },

  // ==========================================
  // DESSERTS & GETRÄNKE
  // ==========================================
  {
    id: 'dessert-tiramisu',
    number: '100',
    category: 'dessert-drinks',
    name: 'Original Italienisches Tiramisu',
    toppings: 'Mascarpone, Löffelbiskuits, Espresso, Kakao',
    desc: 'Hausgemachtes italienisches Tiramisu mit Mascarpone und Kakao.',
    prices: { single: 4.50 },
    price: 4.50,
    image: images.dishes.tiramisu,
    badge: 'Hausgemacht 🍰',
    dietary: ['vegetarisch']
  },
  {
    id: 'drink-cola-1l',
    number: '110',
    category: 'getraenke',
    name: 'Coca-Cola (1,0 Liter Flasche)',
    toppings: 'Koffeinhaltiges Erfrischungsgetränk inkl. Pfand',
    desc: 'Eiskalte Coca-Cola Original Taste in der 1,0-Liter-Flasche.',
    prices: { single: 3.00 },
    price: 3.00,
    image: images.offers.a1,
    badge: 'Kalt',
    dietary: ['vegan']
  },
  {
    id: 'drink-fanta-1l',
    number: '111',
    category: 'getraenke',
    name: 'Fanta Orange (1,0 Liter Flasche)',
    toppings: 'Orangenlimonade inkl. Pfand',
    desc: 'Fruchtiger Orangengeschmack, spritzig und erfrischend.',
    prices: { single: 3.00 },
    price: 3.00,
    image: images.offers.a2,
    badge: 'Kalt',
    dietary: ['vegan']
  },
  {
    id: 'drink-sprite-1l',
    number: '112',
    category: 'getraenke',
    name: 'Sprite (1,0 Liter Flasche)',
    toppings: 'Zitronen-Limetten-Limonade inkl. Pfand',
    desc: 'Spritzig-erfrischende Zitronenlimonade in der 1,0-Liter-Flasche.',
    prices: { single: 3.00 },
    price: 3.00,
    image: images.offers.a3,
    badge: 'Kalt',
    dietary: ['vegan']
  },
  {
    id: 'drink-mezzo-1l',
    number: '113',
    category: 'getraenke',
    name: 'Mezzo Mix (1,0 Liter Flasche)',
    toppings: 'Cola küsst Orange inkl. Pfand',
    desc: 'Der beliebte Mix aus Cola und fruchtigem Orangengeschmack.',
    prices: { single: 3.00 },
    price: 3.00,
    image: images.offers.a1,
    badge: 'Kalt',
    dietary: ['vegan']
  },
  {
    id: 'drink-wasser-07l',
    number: '114',
    category: 'getraenke',
    name: 'Mineralwasser Spritzig (0,7 Liter)',
    toppings: 'Natürliches Mineralwasser mit Kohlensäure',
    desc: 'Erfrischendes Mineralwasser mit prickelnder Kohlensäure.',
    prices: { single: 2.50 },
    price: 2.50,
    image: images.offers.a2,
    badge: 'Erfrischung',
    dietary: ['vegan']
  },
  {
    id: 'drink-bier-05l',
    number: '115',
    category: 'getraenke',
    name: 'Radeberger Pilsner (0,5 Liter Flasche)',
    toppings: 'Deutsches Pilsener Bier 4,8% Vol.',
    desc: 'Feinherbes sächsisches Spitzen-Pilsner eiskalt serviert.',
    prices: { single: 2.80 },
    price: 2.80,
    image: images.offers.a3,
    badge: 'Feinherb',
    dietary: []
  },

  // ==========================================
  // GRILL MENÜ
  // ==========================================
  {
    id: 'grill-teller-venezia',
    number: '120',
    category: 'grill-menue',
    name: 'Grillteller Venezia',
    toppings: 'Gyros, Hähnchenbrust, Cevapcici, Pommes Frites, Zaziki & gemischter Salat',
    desc: 'Reichhaltiger Grillteller mit verschiedenen Fleischsorten frisch vom Rost, serviert mit Pommes und hausgemachtem Zaziki.',
    prices: { single: 14.50 },
    price: 14.50,
    image: images.dishes.schnitzel,
    badge: 'Spezialität',
    dietary: []
  },
  {
    id: 'grill-bifteki',
    number: '121',
    category: 'grill-menue',
    name: 'Bifteki mit Schafskäse gefüllt',
    toppings: 'Würzige Hacksteaks mit Feta gefüllt, Pommes Frites, Zaziki & Salat',
    desc: 'Saftig gegrilltes Hacksteak gefüllt mit feinstem griechischem Schafskäse.',
    prices: { single: 12.90 },
    price: 12.90,
    image: images.dishes.schnitzel,
    badge: 'Sehr beliebt',
    dietary: []
  },
  {
    id: 'grill-souvlaki',
    number: '122',
    category: 'grill-menue',
    name: 'Souvlaki Spieße (2 Stück)',
    toppings: '2 gegrillte Schweinefleischspieße, Kräuterbutter, Pommes, Zaziki & Salat',
    desc: 'Traditionell marinierte Fleischspieße zart über der Flamme gegrillt.',
    prices: { single: 12.50 },
    price: 12.50,
    image: images.dishes.schnitzel,
    badge: 'Griechisch',
    dietary: []
  },

  // ==========================================
  // AMERICAN FOOD
  // ==========================================
  {
    id: 'burger-crispy-chicken',
    number: '72',
    category: 'american-food',
    name: 'Crispy Chicken Burger & Pommes',
    toppings: 'Krosses Hähnchenfilet, Mayo, Salat, Tomaten, Gurken & knusprige Pommes',
    desc: 'Goldbraun gebackenes Hähnchenbrustfilet im soften Brioche-Bun mit Pommes Frites.',
    prices: { single: 8.90 },
    price: 8.90,
    image: images.dishes.burgerCrispy,
    badge: 'Knusprig',
    dietary: []
  },
  {
    id: 'burger-bbq-bacon',
    number: '73',
    category: 'american-food',
    name: 'BBQ Bacon Burger & Pommes',
    toppings: 'Rindfleisch-Patty, knuspriger Bacon, rauchige BBQ-Sauce, Röstzwiebeln, Pommes',
    desc: 'Saftiges Rinderhack mit herzhaftem Räucherspeck und würziger Barbecue-Sauce.',
    prices: { single: 9.50 },
    price: 9.50,
    image: images.dishes.burgerCrispy,
    badge: 'Smoky BBQ',
    dietary: []
  },
  {
    id: 'american-chicken-wings',
    number: '74',
    category: 'american-food',
    name: 'Buffalo Chicken Wings (8 Stk.)',
    toppings: '8 marinierte Hähnchenflügel, Barbecuesauce oder Knoblauchsauce, Pommes',
    desc: 'Kross gewürzte Chicken Wings nach US-Art serviert mit Pommes Frites.',
    prices: { single: 8.50 },
    price: 8.50,
    image: images.dishes.burgerCrispy,
    badge: 'Fingerfood',
    dietary: []
  },
  {
    id: 'american-chicken-nuggets',
    number: '75',
    category: 'american-food',
    name: 'Chicken Nuggets (8 Stk.) & Pommes',
    toppings: '8 goldbraune Hähnchen-Nuggets, Süß-Sauer Dip, Pommes Frites',
    desc: 'Zartes Hähnchenfleisch in knuspriger Panade mit Pommes.',
    prices: { single: 7.50 },
    price: 7.50,
    image: images.dishes.burgerCrispy,
    badge: 'Snack-Hit',
    dietary: []
  },

  // ==========================================
  // INDISCHE HAUPTGERICHTE
  // ==========================================
  {
    id: 'indisch-chicken-curry',
    number: '130',
    category: 'indisch',
    name: 'Chicken Curry',
    toppings: 'Zartes Hähnchenbrustfilet, aromatische Currysauce, Basmatireis',
    desc: 'Klassisches indisches Hähnchencurry schonend zubereitet mit erlesenen orientalischen Gewürzen.',
    prices: { single: 11.90 },
    price: 11.90,
    image: images.dishes.pastaSpecial,
    badge: 'Indisch',
    dietary: []
  },
  {
    id: 'indisch-chicken-korma',
    number: '131',
    category: 'indisch',
    name: 'Chicken Korma',
    toppings: 'Hähnchenfilet, milde Cashew-Sahnesauce, Mandeln, Basmatireis',
    desc: 'Mildes, cremiges Currygericht nach königlicher Mogul-Art mit feinen Nüssen und Rosinen.',
    prices: { single: 12.50 },
    price: 12.50,
    image: images.dishes.pastaSpecial,
    badge: 'Cremig & Mild',
    dietary: []
  },
  {
    id: 'indisch-chicken-tikka-masala',
    number: '132',
    category: 'indisch',
    name: 'Chicken Tikka Masala',
    toppings: 'Gegrilltes Hähnchen, Tomaten-Zwiebel-Masala, Ingwer, frischer Koriander, Basmatireis',
    desc: 'Zart marinierte Hähnchenstücke in pikanter Gewürz-Tomatensauce.',
    prices: { single: 12.50 },
    price: 12.50,
    image: images.dishes.pastaSpecial,
    badge: 'Sehr beliebt',
    dietary: []
  },
  {
    id: 'indisch-palak-paneer',
    number: '133',
    category: 'indisch',
    name: 'Palak Paneer',
    toppings: 'Hausgemachter indischer Frischkäse, cremiger Blattspinat, Gewürze, Basmatireis',
    desc: 'Traditionelles vegetarisches Gericht mit würzigem Rahmspinat und gebratenen Käsewürfeln.',
    prices: { single: 10.90 },
    price: 10.90,
    image: images.dishes.pastaSpecial,
    badge: 'Vegetarisch',
    dietary: ['vegetarisch']
  },

  // ==========================================
  // LAMM SPEZIALITÄTEN
  // ==========================================
  {
    id: 'lamm-koteletts',
    number: '140',
    category: 'lamm',
    name: 'Lammkoteletts vom Grill',
    toppings: 'Gegrillte Lammkoteletts, Kräuterbutter, Rosmarinkartoffeln, Salat',
    desc: 'Zarte Lammkoteletts auf den Punkt gegrillt mit Kräuterbutter und Beilagen.',
    prices: { single: 16.50 },
    price: 16.50,
    image: images.dishes.schnitzel,
    badge: 'Premium',
    dietary: []
  },
  {
    id: 'lamm-curry',
    number: '141',
    category: 'lamm',
    name: 'Lamm Curry',
    toppings: 'Zartes Lammfleisch, aromatische indische Currysauce, Basmatireis',
    desc: 'Saftiges Lammfleisch langsam geschmort in herzhafter Gewürz-Currysauce.',
    prices: { single: 13.90 },
    price: 13.90,
    image: images.dishes.pastaSpecial,
    badge: 'Würzig',
    dietary: []
  },
  {
    id: 'lamm-korma',
    number: '142',
    category: 'lamm',
    name: 'Lamm Korma',
    toppings: 'Zartes Lammfleisch, milde Mandel-Sahnesauce, Basmatireis',
    desc: 'Mogul-Spezialität: Lammfleisch in delikater Kokos-Mandel-Sauce.',
    prices: { single: 14.50 },
    price: 14.50,
    image: images.dishes.pastaSpecial,
    badge: 'Mild & Fein',
    dietary: []
  },

  // ==========================================
  // STEAKS
  // ==========================================
  {
    id: 'steak-kraeuterbutter',
    number: '150',
    category: 'steaks',
    name: 'Rumpsteak mit Kräuterbutter',
    toppings: '200g argentinisches Rumpsteak, hausgemachte Kräuterbutter, Pommes, Salat',
    desc: 'Auf den Punkt gegrilltes saftiges Rumpsteak serviert mit aromatischer Kräuterbutter.',
    prices: { single: 17.50 },
    price: 17.50,
    image: images.dishes.schnitzel,
    badge: 'Vom Grill',
    dietary: []
  },
  {
    id: 'steak-pfeffersauce',
    number: '151',
    category: 'steaks',
    name: 'Pfeffer-Steak',
    toppings: '200g Rumpsteak, pikante grüne Pfeffersauce, Kroketten, Salat',
    desc: 'Saftiges Steak überzogen mit einer edlen Rahmsauce aus ganzen grünen Pfefferkörnern.',
    prices: { single: 18.50 },
    price: 18.50,
    image: images.dishes.schnitzel,
    badge: 'Pikant',
    dietary: []
  },
  {
    id: 'steak-champignon',
    number: '152',
    category: 'steaks',
    name: 'Champignon-Rumpsteak',
    toppings: '200g Rumpsteak, frische Champignons in Rahmsauce, Bratkartoffeln, Salat',
    desc: 'Klassisches Rindersteak mit frischen sautierten Waldpilzen in feiner Sahnesauce.',
    prices: { single: 18.50 },
    price: 18.50,
    image: images.dishes.schnitzel,
    badge: 'Klassiker',
    dietary: []
  },

  // ==========================================
  // FLEISCHGERICHTE
  // ==========================================
  {
    id: 'fisch-lachs',
    number: '111',
    category: 'fleischgerichte',
    name: 'Schnitzel Spezial',
    toppings: 'mit Champignons, Schinken, Bolognesesauce und Käse überbacken',
    desc: 'Zartes Schnitzel mit feinen Champignons, Schinken und würziger Bolognesesauce überbacken.',
    prices: { single: 12.00 },
    price: 12.00,
    image: images.dishes.schnitzel,
    badge: 'Chef-Tipp'
  },
  {
    id: 'fisch-calamari',
    number: '113',
    category: 'fleischgerichte',
    name: 'Jägerschnitzel',
    toppings: 'mit Jägersauce',
    desc: 'Klassisches Jägerschnitzel mit herzhafter Waldpilzsauce und Pommes.',
    prices: { single: 11.50 },
    price: 11.50,
    image: images.dishes.schnitzel,
    badge: 'Mediterran'
  },
  {
    id: 'fisch-zander',
    number: '112',
    category: 'fleischgerichte',
    name: 'Schnitzel Bolognese',
    toppings: 'mit Schinken, Bolognesesauce und Käse überbacken',
    desc: 'Zartes Schnitzel mit saftigem Schinken, aromatischer Fleischsauce und Käse überbacken.',
    prices: { single: 12.00 },
    price: 12.00,
    image: images.dishes.schnitzel,
    badge: 'Fein'
  },

  // ==========================================
  // MEXIKANISCHE GERICHTE
  // ==========================================
  {
    id: 'mex-tacos',
    number: '170',
    category: 'mexikanisch',
    name: 'Tacos con Carne (3 Stück)',
    toppings: '3 Maistortillas, Rinderhackfleisch, Cheddarkäse, Jalapeños, Salsa & Sauerrahm',
    desc: 'Knusprige Maisschalen herzhaft gefüllt nach mexikanischem Originalrezept.',
    prices: { single: 9.90 },
    price: 9.90,
    image: images.categories.salad,
    badge: 'Mexikanisch',
    dietary: []
  },
  {
    id: 'mex-burrito-pollo',
    number: '171',
    category: 'mexikanisch',
    name: 'Burrito Pollo',
    toppings: 'Große Weizentortilla, mariniertes Hähnchen, Bohnen, Reis, mit Käse überbacken',
    desc: 'Gerollte Tortilla reich gefüllt mit würzigem Fleisch und Bohnen, im Ofen goldbraun mit Käse überbacken.',
    prices: { single: 10.50 },
    price: 10.50,
    image: images.categories.salad,
    badge: 'Überbacken',
    dietary: []
  },
  {
    id: 'mex-enchiladas',
    number: '172',
    category: 'mexikanisch',
    name: 'Enchiladas Verduras',
    toppings: '2 gefüllte Tortillas, buntes mexikanisches Gemüse, Salsa, Käse überbacken',
    desc: 'Ofenüberbackene vegetarische Enchiladas in fruchtig-würziger Tomatensauce.',
    prices: { single: 9.50 },
    price: 9.50,
    image: images.categories.salad,
    badge: 'Vegetarisch',
    dietary: ['vegetarisch']
  },
  {
    id: 'mex-nachos',
    number: '173',
    category: 'mexikanisch',
    name: 'Nachos Grande überbacken',
    toppings: 'Knusprige Tortilla-Chips, Gouda & Cheddar, Jalapeños, Guacamole & Salsa',
    desc: 'Heiß servierte Tortilla-Chips mit reichlich geschmolzenem Käse und Dips.',
    prices: { single: 6.90 },
    price: 6.90,
    image: images.categories.salad,
    badge: 'Snack',
    dietary: ['vegetarisch']
  },

  // ==========================================
  // CHINESISCHE GERICHTE (7 Nudel-Spezialitäten)
  // ==========================================
  {
    id: 'asia-gebratene-nudeln-haehnchen',
    number: '180',
    category: 'chinesisch',
    name: 'Gebratene Nudeln mit Hähnchen',
    toppings: 'Eiernudeln, zarte Hähnchenbrust, Sojasprossen, Gemüse, Sojasauce',
    desc: 'Traditionell im Wok geschwenkte Nudeln mit feinem Knackgemüse und Hähnchen.',
    prices: { single: 9.50 },
    price: 9.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/noodles/Artboard_1.png',
    badge: 'Wok-Hit',
    dietary: []
  },
  {
    id: 'asia-chop-suey',
    number: '182',
    category: 'chinesisch',
    name: 'Hähnchen Chop Suey',
    toppings: 'Hähnchenbrust, Bambus, Paprika, Morcheln, dunkle Woksauce, Basmatireis',
    desc: 'Knackig frisches Pfannengemüse mit Hähnchen in aromatischer Sojasauce.',
    prices: { single: 10.50 },
    price: 10.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/noodles/Artboard_2.png',
    badge: 'Aus dem Wok',
    dietary: []
  },
  {
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
  },

  // ==========================================
  // EXTRA BEILAGEN
  // ==========================================
  {
    id: 'beilage-pommes',
    number: '190',
    category: 'beilagen',
    name: 'Große Portion Pommes Frites',
    toppings: 'Knusprig goldgelbe Pommes mit Ketchup oder Mayonnaise',
    desc: 'Extragroße Portion krosse Pommes Frites.',
    prices: { single: 3.50 },
    price: 3.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Starters/Artboard_1.png',
    badge: 'Knusprig',
    dietary: ['vegetarisch']
  },
  {
    id: 'beilage-kroketten',
    number: '191',
    category: 'beilagen',
    name: 'Portion Kroketten (8 Stk.)',
    toppings: '8 goldbraun panierte Kartoffelkroketten',
    desc: 'Feine Kartoffelkroketten außen knusprig, innen cremig.',
    prices: { single: 3.50 },
    price: 3.50,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Starters/Artboard_2.png',
    badge: '',
    dietary: ['vegetarisch']
  },
  {
    id: 'beilage-knoblauchbrot',
    number: '192',
    category: 'beilagen',
    name: 'Knoblauchbrot (4 Scheiben)',
    toppings: 'Geröstetes Baguette, frische Knoblauch-Kräuterbutter',
    desc: 'Ofenfrisch geröstetes Brot mit aromatischer Kräuter-Knoblauchbutter.',
    prices: { single: 3.00 },
    price: 3.00,
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/Starters/Artboard_3.png',
    badge: 'Ofenfrisch',
    dietary: ['vegetarisch']
  },
  {
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
  },

  // ==========================================
  // TOASTS
  // ==========================================
  {
    id: 'toast-hawaii',
    number: '200',
    category: 'toasts',
    name: 'Toast Hawaii',
    toppings: 'Toastbrot, Formfleisch-Schinken, Ananas, mit feinem Gouda überbacken',
    desc: 'Der legendäre Klassiker: Toast belegt mit Schinken und Ananas, saftig mit Käse überbacken.',
    prices: { single: 6.50 },
    price: 6.50,
    image: images.categories.pizza,
    badge: 'Klassiker',
    dietary: []
  },
  {
    id: 'toast-american',
    number: '201',
    category: 'toasts',
    name: 'Toast American',
    toppings: 'Toastbrot, Salami, Schinken, Zwiebeln, würziger Käse überbacken',
    desc: 'Herzhafter Ofentoast reich belegt mit Salami, Schinken und geschmolzenem Käse.',
    prices: { single: 6.90 },
    price: 6.90,
    image: images.categories.pizza,
    badge: 'Herzhaft',
    dietary: []
  },
  {
    id: 'toast-schnitzel',
    number: '202',
    category: 'toasts',
    name: 'Schnitzel-Toast Spezial',
    toppings: 'Toastbrot, kleines paniertes Schweineschnitzel, Sauce Hollandaise, Käse überbacken',
    desc: 'Deftiger Toast belegt mit einem zarten Schnitzel und goldener Sauce Hollandaise.',
    prices: { single: 7.50 },
    price: 7.50,
    image: images.dishes.schnitzel,
    badge: 'Empfehlung',
    dietary: []
  },

  // ==========================================
  // OMELETTE MIT KÄSE ÜBERBACKEN
  // ==========================================
  {
    id: 'omelette-natur',
    number: '210',
    category: 'omelette',
    name: 'Omelette Natur mit Käse überbacken',
    toppings: '3 frische Eier, Kräuter, mit feinem Gouda überbacken, dazu Pommes & Salat',
    desc: 'Fluffiges Pfannenomelette aus frischen Eiern, im Ofen mit goldbraunem Käse überbacken.',
    prices: { single: 7.50 },
    price: 7.50,
    image: images.categories.salad,
    badge: 'Vegetarisch',
    dietary: ['vegetarisch']
  },
  {
    id: 'omelette-schinken-pilze',
    number: '211',
    category: 'omelette',
    name: 'Omelette Schinken & Champignons überbacken',
    toppings: '3 Eier, Formfleisch-Schinken, frische Champignons, mit Käse überbacken, Pommes',
    desc: 'Herzhaftes Omelette mit saftigem Schinken und Waldpilzen unter einer Käsekruste.',
    prices: { single: 8.50 },
    price: 8.50,
    image: images.categories.salad,
    badge: 'Sehr beliebt',
    dietary: []
  },
  {
    id: 'omelette-krabben',
    number: '212',
    category: 'omelette',
    name: 'Omelette Krabben überbacken',
    toppings: '3 Eier, feine Krabben, Knoblauch, Zwiebeln, mit Käse überbacken, Pommes',
    desc: 'Mediterranes Eier-Omelette gefüllt mit zarten Meereskrabben und Käse überbacken.',
    prices: { single: 9.50 },
    price: 9.50,
    image: images.categories.salad,
    badge: 'Spezialität',
    dietary: ['pescetarisch']
  }
];

export const specialOffersData = [
  {
    id: 'A1',
    code: 'A1',
    title: 'Familienpizza Angebot',
    description: 'bis 5 Zutaten • 1 gemischter Salat • 1 Ltr. Cola gratis',
    price: 25.00,
    formattedPrice: '25,00 €',
    image: images.offers.a1,
    details: 'Große Familienpizza (ca. 46x33 cm) belegt mit bis zu 5 Wunschzutaten, dazu ein frischer gemischter Salat und 1 Liter Coca-Cola gratis.'
  },
  {
    id: 'A2',
    code: 'A2',
    title: 'Partypizza Angebot',
    description: 'bis 5 Zutaten • 1 gemischter Salat • 1 Ltr. Cola gratis',
    price: 30.00,
    formattedPrice: '30,00 €',
    image: images.offers.a2,
    details: 'Riesige Partypizza (ca. 60x40 cm) belegt mit bis zu 5 Wunschzutaten, dazu ein großer gemischter Salat und 1 Liter Coca-Cola gratis.'
  },
  {
    id: 'A3',
    code: 'A3',
    title: 'Pizza + Nudelgericht Kombo',
    description: '1 kleine Pizza (26 cm) • 1 Nudelgericht • 1 Ltr. Cola gratis',
    price: 15.00,
    formattedPrice: '15,00 €',
    image: images.offers.a3,
    details: 'Perfekte Kombination: 1 kleine Pizza (Ø 26 cm) mit bis zu 2 Zutaten nach Wahl, plus 1 italienisches Nudelgericht nach Wahl und 1 Liter Coca-Cola gratis.'
  }
];

export const popularPizzasData = [
  {
    id: 'pizza-1',
    number: '1',
    name: 'Pizza Margherita',
    ingredients: 'Tomatensauce, Mozzarella',
    price: 9.00,
    formattedPrice: 'ab 9,00 €',
    image: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/pizza-1_1791203139418.png',
    image_url: 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/pizza-1_1791203139418.png',
    badge: 'Klassiker'
  },
  {
    id: 'pizza-2',
    number: '2',
    name: 'Pizza Salami',
    ingredients: 'Salami, Käse, Tomatensauce',
    price: 9.00,
    formattedPrice: 'ab 9,00 €',
    image: images.pizzas.pizza2,
    badge: 'Bestseller'
  },
  {
    id: 'pizza-3',
    number: '3',
    name: 'Pizza Schinken',
    ingredients: 'Schinken, Käse, Tomatensauce',
    price: 9.00,
    formattedPrice: 'ab 9,00 €',
    image: images.pizzas.pizza3,
    badge: 'Beliebt'
  },
  {
    id: 'pizza-7',
    number: '7',
    name: 'Pizza Tonno',
    ingredients: 'Thunfisch, Käse, Tomatensauce',
    price: 9.00,
    formattedPrice: 'ab 9,00 €',
    image: images.pizzas.pizza4,
    badge: 'Empfehlung'
  }
];

export const restaurantInfo = {
  name: 'Venezia Pizza Service',
  tagline: 'Stolz in Plauen seit 1999\n25+ Jahre Pizza & kulinarische Tradition',
  phone: '03741 522860',
  phoneCall: 'tel:03741522860',
  phoneSecondary: '03741 522861',
  phoneSecondaryCall: 'tel:03741522861',
  mobile: '0160 1177240',
  mobileCall: 'tel:01601177240',
  allPhones: [
    { type: 'telephone', label: 'Telefon', number: '03741 522860', call: 'tel:03741522860' },
    { type: 'telephone', label: 'Telefon', number: '03741 522861', call: 'tel:03741522861' },
    { type: 'mobile', label: 'Mobil', number: '0160 1177240', call: 'tel:01601177240' }
  ],
  address: 'Martin-Luther-Straße 68, 08525 Plauen',
  email: 'info@veneziapizzas.de',
  hours: {
    weekdays: '10:30 – 14:30 Uhr & 16:30 – 23:00 Uhr',
    weekend: '10:30 – 23:00 Uhr'
  },
  deliveryInfo: {
    minOrder: '12,00 € (Lieferung)',
    deliveryTime: 'ca. 30–45 Min.'
  },
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=100059933894217&mibextid=wwXIfr&rdid=IcSnReX9PW6bdAqq&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19TDhNZ6CN%2F%3Fmibextid%3DwwXIfr',
    instagram: 'https://instagram.com'
  },
  since: '1999'
};
