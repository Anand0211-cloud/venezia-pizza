import { images } from '../assets/images';

export const categoriesData = [
  { id: 'all', name: 'Alle Gerichte', image: images.categories.all, count: '70+ Spezialitäten' },
  { id: 'pizza', name: 'Pizzen (1–49a)', image: images.categories.pizza, count: '45+ Sorten' },
  { id: 'calzone', name: 'Calzone & Pizzabrot', image: images.categories.calzone, count: '5 Variationen' },
  { id: 'pasta', name: 'Pasta & Al Forno', image: images.dishes.pastaSpecial, count: '18 Gerichte' },
  { id: 'doner', name: 'Döner & Fleisch', image: images.categories.doner, count: '12 Spezialitäten' },
  { id: 'burger-snacks', name: 'Burger & Snacks', image: images.dishes.burgerCrispy, count: '14 Leckereien' },
  { id: 'schnitzel', name: 'Schnitzel Spezial', image: images.dishes.schnitzel, count: '8 Variationen' },
  { id: 'salad', name: 'Frische Salate', image: images.categories.salad, count: '10 Salate' },
  { id: 'dessert-drinks', name: 'Desserts & Getränke', image: images.dishes.tiramisu, count: '12 Erfrischungen' },
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
    toppings: 'Käse, Tomatensauce, Oregano',
    desc: 'Klassische italienische Pizza mit feiner Tomatensauce und geschmolzenem Käse.',
    prices: { small: 9.00, large: 10.80, family: 18.60, party: 22.70 },
    image: images.pizzas.margherita,
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
  // PASTA & AL FORNO
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
    image: images.dishes.pastaSpecial,
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
    image: images.categories.pasta,
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
    image: images.categories.pasta,
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
    image: images.dishes.pastaSpecial,
    badge: 'Hausgemacht',
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
    image: images.categories.pasta,
    badge: 'Feinschmecker',
    dietary: ['pescetarisch']
  },

  // ==========================================
  // DÖNER & FLEISCH
  // ==========================================
  {
    id: 'doner-teller',
    number: '60',
    category: 'doner',
    name: 'Dönerteller Komplett mit Beilage',
    toppings: 'Drehspießfleisch, Pommes/Reis, Salat, Knoblauch- & Kräutersauce',
    desc: 'Zartes Drehspießfleisch serviert mit Pommes oder Reis, frischem Salat und Saucen.',
    prices: { single: 9.50 },
    price: 9.50,
    image: images.dishes.doner,
    badge: 'Bestseller',
    dietary: []
  },
  {
    id: 'doner-durum',
    number: '61',
    category: 'doner',
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
    number: '62',
    category: 'doner',
    name: 'Dönerbox mit Pommes',
    toppings: 'Drehspießfleisch, Pommes Frites, Sauce nach Wahl',
    desc: 'Handliche Box vollgepackt mit heißem Drehspießfleisch und Pommes Frites.',
    prices: { single: 6.00 },
    price: 6.00,
    image: images.dishes.doner,
    badge: 'Quick Snack',
    dietary: []
  },

  // ==========================================
  // BURGER & SNACKS
  // ==========================================
  {
    id: 'burger-double',
    number: '70',
    category: 'burger-snacks',
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
    category: 'burger-snacks',
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
  // SCHNITZEL
  // ==========================================
  {
    id: 'schnitzel-wiener',
    number: '80',
    category: 'schnitzel',
    name: 'Schnitzel Wiener Art',
    toppings: 'Paniertes Schweineschnitzel, Zitronenspalte, Pommes, Salat',
    desc: 'Zwei kross panierte Schweineschnitzel serviert mit Pommes und Salat.',
    prices: { single: 9.50 },
    price: 9.50,
    image: images.dishes.schnitzel,
    badge: 'Klassiker',
    dietary: []
  },
  {
    id: 'schnitzel-jaeger',
    number: '81',
    category: 'schnitzel',
    name: 'Jägerschnitzel mit Champignon-Rahm',
    toppings: 'Schweineschnitzel, Waldpilz-Rahmsauce, Pommes, Salat',
    desc: 'Krosse Schnitzel übergossen mit cremiger Champignon-Rahmsauce und Pommes.',
    prices: { single: 10.50 },
    price: 10.50,
    image: images.dishes.schnitzel,
    badge: 'Sehr beliebt',
    dietary: []
  },

  // ==========================================
  // SALATE
  // ==========================================
  {
    id: 'salad-venezia',
    number: '90',
    category: 'salad',
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
    category: 'salad',
    name: 'Insalata Tonno',
    toppings: 'Thunfisch, rote Zwiebeln, Oliven, Tomaten, Gurken',
    desc: 'Frischer Salatmix mit feinem Thunfisch, Zwiebelringen und Oliven.',
    prices: { single: 8.00 },
    price: 8.00,
    image: images.categories.salad,
    badge: '',
    dietary: ['pescetarisch']
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
    category: 'dessert-drinks',
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
    category: 'dessert-drinks',
    name: 'Fanta Orange (1,0 Liter Flasche)',
    toppings: 'Orangenlimonade inkl. Pfand',
    desc: 'Fruchtiger Orangengeschmack, spritzig und erfrischend.',
    prices: { single: 3.00 },
    price: 3.00,
    image: images.offers.a2,
    badge: 'Kalt',
    dietary: ['vegan']
  }
];

export const specialOffersData = [
  {
    id: 'A1',
    code: 'A1',
    title: 'Familienpizza Angebot',
    description: 'bis 5 Zutaten\n+ 1 gemischter Salat\n+ 1 Ltr. Cola – gratis',
    price: 25.00,
    formattedPrice: '25,00 €',
    image: images.offers.a1,
    details: 'Große Familienpizza (ca. 46x33 cm) belegt mit bis zu 5 Wunschzutaten, dazu ein frischer gemischter Salat und 1 Liter Coca-Cola gratis.'
  },
  {
    id: 'A2',
    code: 'A2',
    title: 'Partypizza Angebot',
    description: 'bis 5 Zutaten\n+ 1 gemischter Salat\n+ 1 Ltr. Cola – gratis',
    price: 30.00,
    formattedPrice: '30,00 €',
    image: images.offers.a2,
    details: 'Riesige Partypizza (ca. 60x40 cm) belegt mit bis zu 5 Wunschzutaten, dazu ein großer gemischter Salat und 1 Liter Coca-Cola gratis.'
  },
  {
    id: 'A3',
    code: 'A3',
    title: 'Pizza + Nudelgericht Kombo',
    description: '1 kleine Pizza (26 cm, bis 2 Zutaten)\n+ 1 Nudelgericht nach Wahl\n+ 1 Ltr. Cola – gratis',
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
    ingredients: 'Tomatensauce, Käse, Oregano',
    price: 9.00,
    formattedPrice: 'ab 9,00 €',
    image: images.pizzas.pizza1,
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
  tagline: 'Italienische & Internationale Küche. Heiß geliefert, frisch genießen.',
  phone: '03741 719 39 69',
  phoneCall: 'tel:037417193969',
  address: 'Martin-Luther-Straße 68, 08525 Plauen',
  email: 'info@venezia-pizza-plauen.de',
  hours: {
    weekdays: '10:30 – 14:30 Uhr & 16:30 – 23:00 Uhr',
    weekend: '10:30 – 23:00 Uhr'
  },
  deliveryInfo: {
    minOrder: '15,00 € (Lieferung)',
    deliveryTime: 'ca. 30–45 Min.'
  },
  since: '1999'
};
