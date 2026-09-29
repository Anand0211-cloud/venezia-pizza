const fs = require('fs');

let code = fs.readFileSync('src/data/menuData.js', 'utf8');
code = code.replace(/import\s+.*?;/g, 'const images = { categories:{}, dishes:{}, pizzas:{}, offers:{} };');
code = code.replace(/export\s+const\s+/g, 'const ');
code += '\nmodule.exports = { categoriesData, allMenuItems, pizzaExtraToppingsList, standardPizzaSizes, calzoneSizes, americanCrustPrices, extraToppingPriceBySize };';

const tempFile = 'temp_menu_parse.cjs';
fs.writeFileSync(tempFile, code);
const data = require('./' + tempFile);
fs.unlinkSync(tempFile);

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

let sql = `-- ======================================================================
-- VENEZIA PIZZA SERVICE - SUPABASE BACKEND SCHEMA & SEED DATA
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ======================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running (clean slate)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS extra_toppings CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;

-- 3. Categories Table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name_de TEXT NOT NULL,
  name_en TEXT,
  count_badge TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0
);

-- 4. Extra Toppings / Customization Options
CREATE TABLE extra_toppings (
  id TEXT PRIMARY KEY,
  name_de TEXT NOT NULL,
  name_en TEXT,
  price_small NUMERIC(6,2) DEFAULT 2.50,
  price_large NUMERIC(6,2) DEFAULT 3.00,
  price_family NUMERIC(6,2) DEFAULT 4.00,
  price_party NUMERIC(6,2) DEFAULT 5.00,
  is_in_stock BOOLEAN DEFAULT true
);

-- 5. Drivers Table
CREATE TABLE drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle_type TEXT DEFAULT 'Auto', -- 'Auto', 'Roller', 'Fahrrad'
  is_active BOOLEAN DEFAULT true,
  current_status TEXT DEFAULT 'available', -- 'available', 'delivering', 'offline'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Menu Items Table
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  number TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name_de TEXT NOT NULL,
  name_en TEXT,
  desc_de TEXT,
  desc_en TEXT,
  toppings_de TEXT,
  toppings_en TEXT,
  badge TEXT,
  dietary TEXT[] DEFAULT '{}',
  sizes_available BOOLEAN DEFAULT false,
  calzone_sizes BOOLEAN DEFAULT false,
  supports_american BOOLEAN DEFAULT false,
  prices JSONB DEFAULT '{}'::jsonb,
  price NUMERIC(6,2) DEFAULT NULL,
  image_url TEXT,
  is_in_stock BOOLEAN DEFAULT true,
  stock_quantity INT DEFAULT 100,
  preparation_time_minutes INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Orders Table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'delivery', -- 'delivery' or 'pickup'
  street TEXT,
  zip_city TEXT DEFAULT '08525 Plauen',
  note TEXT,
  subtotal NUMERIC(8,2) NOT NULL DEFAULT 0.00,
  delivery_fee NUMERIC(8,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(8,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
  estimated_delivery_minutes INT DEFAULT 35,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Order Items Table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT,
  item_name TEXT NOT NULL,
  selected_size TEXT,
  is_american BOOLEAN DEFAULT false,
  toppings_selected JSONB DEFAULT '[]'::jsonb,
  special_instructions TEXT,
  unit_price NUMERIC(8,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_price NUMERIC(8,2) NOT NULL
);

-- 9. Store Settings Table
CREATE TABLE store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  is_open BOOLEAN DEFAULT true,
  default_prep_time_minutes INT DEFAULT 35,
  minimum_order_value NUMERIC(6,2) DEFAULT 15.00,
  free_delivery_threshold NUMERIC(6,2) DEFAULT 20.00,
  delivery_fee NUMERIC(6,2) DEFAULT 2.50
);

-- 10. Indexes for fast real-time queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_menu_items_cat ON menu_items(category_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 11. Row Level Security (RLS) Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to menu & settings
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read toppings" ON extra_toppings FOR SELECT USING (true);
CREATE POLICY "Public read drivers" ON drivers FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public read store_settings" ON store_settings FOR SELECT USING (true);

-- Allow public / anon ordering
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read order_items" ON order_items FOR SELECT USING (true);

-- Allow admin operations (with anon / authenticated key)
CREATE POLICY "Admin manage menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage drivers" ON drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage toppings" ON extra_toppings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);

-- 12. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;

-- ======================================================================
-- SEED DATA INSERTION
-- ======================================================================

-- Store Settings
INSERT INTO store_settings (id, is_open, default_prep_time_minutes, minimum_order_value, free_delivery_threshold, delivery_fee)
VALUES (1, true, 35, 15.00, 20.00, 2.50)
ON CONFLICT (id) DO NOTHING;

-- Initial Drivers
INSERT INTO drivers (name, phone, vehicle_type, is_active, current_status) VALUES
('Marco Bianchi', '+49 170 1234567', 'Auto', true, 'available'),
('Luigi Rossi', '+49 171 2345678', 'Roller', true, 'available'),
('Stefan Wagner', '+49 172 3456789', 'Auto', true, 'available');

-- Categories
`;

const catTranslations = {
  all: { de: 'Alle Gerichte', en: 'All Dishes' },
  pizza: { de: 'Pizzen (1–49a)', en: 'Pizzas (1–49a)' },
  calzone: { de: 'Calzone & Pizzabrot', en: 'Calzone & Pizza Bread' },
  pasta: { de: 'Pasta & Al Forno', en: 'Pasta & Al Forno' },
  doner: { de: 'Döner & Fleisch', en: 'Döner & Meat Specialties' },
  'burger-snacks': { de: 'Burger & Snacks', en: 'Burgers & Snacks' },
  schnitzel: { de: 'Schnitzel Spezial', en: 'Schnitzel Specials' },
  salad: { de: 'Frische Salate', en: 'Fresh Salads' },
  'dessert-drinks': { de: 'Desserts & Getränke', en: 'Desserts & Drinks' }
};

data.categoriesData.forEach((c, index) => {
  const trans = catTranslations[c.id] || { de: c.name, en: c.name };
  sql += `INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES (${escapeSql(c.id)}, ${escapeSql(trans.de)}, ${escapeSql(trans.en)}, ${escapeSql(c.count)}, ${index + 1}) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;\n`;
});

sql += `\n-- Extra Toppings\n`;
const toppingTranslations = {
  'mozzarella': 'Extra Mozzarella / Cheese',
  'salami': 'Salami',
  'schinken': 'Ham',
  'hackfleisch': 'Ground beef',
  'donerfleisch': 'Döner meat',
  'champignons': 'Fresh mushrooms',
  'zwiebeln': 'Red onions',
  'knoblauch': 'Fresh garlic / Garlic oil',
  'peperoni-scharf': 'Hot peppers / Jalapeños',
  'oliven': 'Black olives',
  'artischocken': 'Artichokes',
  'feta': 'Feta cheese',
  'gorgonzola': 'Gorgonzola cheese',
  'ananas': 'Pineapple',
  'mais': 'Sweet corn',
  'brokkoli': 'Broccoli',
  'krabben': 'Shrimp / Seafood',
  'thunfisch': 'Tuna'
};

data.pizzaExtraToppingsList.forEach((t) => {
  const en = toppingTranslations[t.id] || t.name;
  sql += `INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES (${escapeSql(t.id)}, ${escapeSql(t.name)}, ${escapeSql(en)}, 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;\n`;
});

sql += `\n-- Menu Items (${data.allMenuItems.length} dishes)\n`;

data.allMenuItems.forEach((item) => {
  const dietaryArr = item.dietary && item.dietary.length > 0 ? "ARRAY[" + item.dietary.map(d => escapeSql(d)).join(',') + "]" : "'{}'";
  const pricesJson = item.prices ? escapeSql(JSON.stringify(item.prices)) : "'{}'::jsonb";
  const singlePrice = item.price || (item.prices && item.prices.single) || (item.prices && item.prices.small) || 0;

  // Bilingual translation approximation
  let nameEn = item.name;
  let descEn = item.desc || '';
  let toppingsEn = item.toppings || '';

  sql += `INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  ${escapeSql(item.id)},
  ${escapeSql(item.number || '')},
  ${escapeSql(item.category)},
  ${escapeSql(item.name)},
  ${escapeSql(nameEn)},
  ${escapeSql(item.desc || '')},
  ${escapeSql(descEn)},
  ${escapeSql(item.toppings || '')},
  ${escapeSql(toppingsEn)},
  ${escapeSql(item.badge || '')},
  ${dietaryArr},
  ${item.sizesAvailable ? 'true' : 'false'},
  ${item.calzoneSizes ? 'true' : 'false'},
  ${item.supportsAmerican ? 'true' : 'false'},
  ${pricesJson},
  ${singlePrice},
  true,
  100,
  20
) ON CONFLICT (id) DO UPDATE SET
  name_de = EXCLUDED.name_de,
  category_id = EXCLUDED.category_id,
  prices = EXCLUDED.prices,
  price = EXCLUDED.price,
  sizes_available = EXCLUDED.sizes_available,
  calzone_sizes = EXCLUDED.calzone_sizes,
  supports_american = EXCLUDED.supports_american;\n`;
});

fs.writeFileSync('supabase_schema.sql', sql);
console.log('Successfully generated supabase_schema.sql with', data.allMenuItems.length, 'menu items!');
