-- ======================================================================
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
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('pizzen', 'Pizzen', 'Pizzen', '45+ Sorten', 1) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('pasta', 'Pasta & Al Forno', 'Pasta & Al Forno', 'Klassiker', 2) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('gnocchi', 'Gnocchi', 'Gnocchi', 'Spezialitäten', 3) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('pasta-al-forno', 'Pasta al Forno', 'Pasta al Forno', 'Überbacken', 4) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('vegetarisch', 'Vegetarisch', 'Vegetarisch', 'Frisch & Heiß', 5) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('auflaeufe', 'Aufläufe', 'Aufläufe', 'Ofenfrisch', 6) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('reisgerichte', 'Reisgerichte', 'Reisgerichte', 'Aus dem Ofen', 7) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('fleischgerichte', 'Fleischgerichte', 'Fleischgerichte', 'Spezialitäten', 8) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('gyros', 'Gyros', 'Gyros', 'Gyros Spezial', 9) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('salate', 'Salate', 'Salate', 'Frisch & Knackig', 10) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('grill-menue', 'Grill Menü', 'Grill Menü', 'Vom Rost', 11) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('american-food', 'American Food', 'American Food', 'Burger & Co.', 12) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('indisch', 'Indische', 'Indische', 'Currys & Reis', 13) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('lamm', 'Lamm', 'Lamm', 'Zartes Fleisch', 14) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('steaks', 'Steaks', 'Steaks', 'Rumpsteaks', 15) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('fischgerichte', 'Fischgerichte', 'Fischgerichte', 'Lachs & Calamari', 16) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('mexikanisch', 'Mexikanische', 'Mexikanische', 'Tacos & Burritos', 17) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('chinesisch', 'Chinesische', 'Chinesische', 'Wok-Gerichte', 18) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('beilagen', 'Extra Beilagen', 'Extra Beilagen', 'Pommes & Dips', 19) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('toasts', 'Toasts', 'Toasts', 'Hawaii & mehr', 20) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('omelette', 'Omelette', 'Omelette', 'Mit Käsekruste', 21) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('getraenke', 'Getränke', 'Getränke', 'Eiskalt', 22) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;

-- Extra Toppings
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('mozzarella', 'Extra Mozzarella / Käse', 'Extra Mozzarella / Cheese', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('salami', 'Salami', 'Salami', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('schinken', 'Schinken', 'Ham', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('hackfleisch', 'Hackfleisch', 'Ground beef', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('donerfleisch', 'Dönerfleisch', 'Döner meat', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('champignons', 'Frische Champignons', 'Fresh mushrooms', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('zwiebeln', 'Rote Zwiebeln', 'Red onions', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('knoblauch', 'Frischer Knoblauch / Knoblauchöl', 'Fresh garlic / Garlic oil', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('peperoni-scharf', 'Scharfe Peperoni / Jalapeños', 'Hot peppers / Jalapeños', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('oliven', 'Schwarze Oliven', 'Black olives', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('artischocken', 'Artischocken', 'Artichokes', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('feta', 'Schafskäse / Feta', 'Feta cheese', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('gorgonzola', 'Gorgonzola', 'Gorgonzola cheese', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('ananas', 'Ananas', 'Pineapple', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('mais', 'Mais', 'Sweet corn', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('brokkoli', 'Brokkoli', 'Broccoli', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('krabben', 'Krabben / Meeresfrüchte', 'Shrimp / Seafood', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO extra_toppings (id, name_de, name_en, price_small, price_large, price_family, price_party, is_in_stock) VALUES ('thunfisch', 'Thunfisch', 'Tuna', 2.50, 3.00, 4.00, 5.00, true) ON CONFLICT (id) DO NOTHING;

-- Menu Items (136 dishes)
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-1',
  '1',
  'pizza',
  'Pizza Margherita',
  'Pizza Margherita',
  'Klassische italienische Pizza mit feiner Tomatensauce und geschmolzenem Käse.',
  'Klassische italienische Pizza mit feiner Tomatensauce und geschmolzenem Käse.',
  'Käse, Tomatensauce, Oregano',
  'Käse, Tomatensauce, Oregano',
  'Klassiker',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-2',
  '2',
  'pizza',
  'Pizza Salami',
  'Pizza Salami',
  'Knusprig gebackener Boden belegt mit herzhafter Rindersalami.',
  'Knusprig gebackener Boden belegt mit herzhafter Rindersalami.',
  'Salami, Käse, Tomatensauce',
  'Salami, Käse, Tomatensauce',
  'Bestseller',
  '{}',
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-3',
  '3',
  'pizza',
  'Pizza Schinken',
  'Pizza Schinken',
  'Belegt mit saftigem Hinterschinken auf feiner Tomatensauce.',
  'Belegt mit saftigem Hinterschinken auf feiner Tomatensauce.',
  'Schinken, Käse, Tomatensauce',
  'Schinken, Käse, Tomatensauce',
  'Beliebt',
  '{}',
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-4',
  '4',
  'pizza',
  'Pizza Hamburger',
  'Pizza Hamburger',
  'Kräftig gewürztes Rinderhackfleisch mit herzhaftem Käse.',
  'Kräftig gewürztes Rinderhackfleisch mit herzhaftem Käse.',
  'Hackfleisch, Käse, Tomatensauce',
  'Hackfleisch, Käse, Tomatensauce',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-5',
  '5',
  'pizza',
  'Pizza Funghi',
  'Pizza Funghi',
  'Frische Champignons auf fruchtiger Tomatensauce und Käse.',
  'Frische Champignons auf fruchtiger Tomatensauce und Käse.',
  'Champignons, Käse, Tomatensauce',
  'Champignons, Käse, Tomatensauce',
  '',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-6',
  '6',
  'pizza',
  'Pizza Romana',
  'Pizza Romana',
  'Feine Artischockenherzen auf original italienischem Teig.',
  'Feine Artischockenherzen auf original italienischem Teig.',
  'Artischocken, Käse, Tomatensauce',
  'Artischocken, Käse, Tomatensauce',
  '',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-7',
  '7',
  'pizza',
  'Pizza Tonno',
  'Pizza Tonno',
  'Zarter Thunfisch auf fruchtiger Tomatensauce und Käse.',
  'Zarter Thunfisch auf fruchtiger Tomatensauce und Käse.',
  'Thunfisch, Käse, Tomatensauce',
  'Thunfisch, Käse, Tomatensauce',
  'Empfehlung',
  ARRAY['pescetarisch'],
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-8',
  '8',
  'pizza',
  'Pizza Spinati',
  'Pizza Spinati',
  'Aromatischer Blattspinat mit feinem Knoblauchhauch und Käse.',
  'Aromatischer Blattspinat mit feinem Knoblauchhauch und Käse.',
  'Spinat, Käse, Tomatensauce',
  'Spinat, Käse, Tomatensauce',
  '',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-9',
  '9',
  'pizza',
  'Pizza Gamberetti',
  'Pizza Gamberetti',
  'Feine Krabben auf Tomatensauce und goldbraunem Käse.',
  'Feine Krabben auf Tomatensauce und goldbraunem Käse.',
  'Krabben, Käse, Tomatensauce',
  'Krabben, Käse, Tomatensauce',
  '',
  ARRAY['pescetarisch'],
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-10',
  '10',
  'pizza',
  'Pizza Brokkoli',
  'Pizza Brokkoli',
  'Knackige Brokkoliröschen mit feinem Käse überbacken.',
  'Knackige Brokkoliröschen mit feinem Käse überbacken.',
  'Brokkoli, Käse, Tomatensauce',
  'Brokkoli, Käse, Tomatensauce',
  '',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-11',
  '11',
  'pizza',
  'Pizza Caprese',
  'Pizza Caprese',
  'Frische Tomatenscheiben und zarter Mozzarella nach italienischer Art.',
  'Frische Tomatenscheiben und zarter Mozzarella nach italienischer Art.',
  'Mozzarella, frische Tomaten, Basilikum, Käse',
  'Mozzarella, frische Tomaten, Basilikum, Käse',
  'Traditionell',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-12',
  '12',
  'pizza',
  'Pizza Calabrese',
  'Pizza Calabrese',
  'Würzige Zwiebeln und aromatischer Knoblauch.',
  'Würzige Zwiebeln und aromatischer Knoblauch.',
  'Zwiebeln, Knoblauch, Käse, Tomatensauce',
  'Zwiebeln, Knoblauch, Käse, Tomatensauce',
  '',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":9,"large":10.8,"family":18.6,"party":22.7}',
  9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-13',
  '13',
  'pizza',
  'Pizza Monaco',
  'Pizza Monaco',
  'Köstliche Kombination aus pikanter Salami und saftigem Schinken.',
  'Köstliche Kombination aus pikanter Salami und saftigem Schinken.',
  'Salami, Schinken, Käse, Tomatensauce',
  'Salami, Schinken, Käse, Tomatensauce',
  'Sehr beliebt',
  '{}',
  true,
  false,
  true,
  '{"small":9.5,"large":11,"family":20.1,"party":24.2}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-14',
  '14',
  'pizza',
  'Pizza Emilia',
  'Pizza Emilia',
  'Herzhafte Salami harmonisch abgestimmt mit frischen Champignons.',
  'Herzhafte Salami harmonisch abgestimmt mit frischen Champignons.',
  'Salami, Champignons, Käse, Tomatensauce',
  'Salami, Champignons, Käse, Tomatensauce',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":9.5,"large":11,"family":20.1,"party":24.2}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-15',
  '15',
  'pizza',
  'Pizza Romana II',
  'Pizza Romana II',
  'Zarter Schinken und frische Pilze unter goldbraunem Käse.',
  'Zarter Schinken und frische Pilze unter goldbraunem Käse.',
  'Schinken, Champignons, Käse, Tomatensauce',
  'Schinken, Champignons, Käse, Tomatensauce',
  'Klassiker',
  '{}',
  true,
  false,
  true,
  '{"small":9.5,"large":11,"family":20.1,"party":24.2}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-16',
  '16',
  'pizza',
  'Pizza Marinara',
  'Pizza Marinara',
  'Saftiger Thunfisch mit frischen roten Zwiebeln.',
  'Saftiger Thunfisch mit frischen roten Zwiebeln.',
  'Thunfisch, Zwiebeln, Käse, Tomatensauce',
  'Thunfisch, Zwiebeln, Käse, Tomatensauce',
  'Empfehlung',
  ARRAY['pescetarisch'],
  true,
  false,
  true,
  '{"small":9.5,"large":11,"family":20.1,"party":24.2}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-17',
  '17',
  'pizza',
  'Pizza Zingara',
  'Pizza Zingara',
  'Feine Meereskrabben kombiniert mit frischem Brokkoli.',
  'Feine Meereskrabben kombiniert mit frischem Brokkoli.',
  'Krabben, Brokkoli, Käse, Tomatensauce',
  'Krabben, Brokkoli, Käse, Tomatensauce',
  '',
  ARRAY['pescetarisch'],
  true,
  false,
  true,
  '{"small":9.5,"large":11,"family":20.1,"party":24.2}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-18',
  '18',
  'pizza',
  'Pizza Hawaii',
  'Pizza Hawaii',
  'Süße Ananas, herzhafter Schinken und eine feine Prise Curry.',
  'Süße Ananas, herzhafter Schinken und eine feine Prise Curry.',
  'Schinken, Ananas, Curry, Käse, Tomatensauce',
  'Schinken, Ananas, Curry, Käse, Tomatensauce',
  'Beliebt',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-19',
  '19',
  'pizza',
  'Pizza Roma',
  'Pizza Roma',
  'Würzige Peperoni mit Mais, Zwiebeln und kräftigem Knoblauch.',
  'Würzige Peperoni mit Mais, Zwiebeln und kräftigem Knoblauch.',
  'Mais, Knoblauch, Zwiebeln, Peperoni, Käse',
  'Mais, Knoblauch, Zwiebeln, Peperoni, Käse',
  'Pikant',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-19a',
  '19a',
  'pizza',
  'Pizza Pikante',
  'Pizza Pikante',
  'Herzhaftes Gyrosfleisch mit Champignons und bunter Paprika.',
  'Herzhaftes Gyrosfleisch mit Champignons und bunter Paprika.',
  'Gyrosfleisch, frische Champignons, Paprika, Käse',
  'Gyrosfleisch, frische Champignons, Paprika, Käse',
  'Chef-Tipp',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-20',
  '20',
  'pizza',
  'Pizza Cypressa',
  'Pizza Cypressa',
  'Fruchtig-bunte Kombination aus Mais, Paprika und Ananas.',
  'Fruchtig-bunte Kombination aus Mais, Paprika und Ananas.',
  'Mais, Paprika, Ananas, Käse, Tomatensauce',
  'Mais, Paprika, Ananas, Käse, Tomatensauce',
  '',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-20a',
  '20a',
  'pizza',
  'Pizza Adriano',
  'Pizza Adriano',
  'Zartes Putenfleisch, pikante Peperoni und Brokkoli.',
  'Zartes Putenfleisch, pikante Peperoni und Brokkoli.',
  'Putenfleisch, scharfe Peperoni, Brokkoli, Käse',
  'Putenfleisch, scharfe Peperoni, Brokkoli, Käse',
  'Scharf 🔥',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-21',
  '21',
  'pizza',
  'Pizza Twingo',
  'Pizza Twingo',
  'Dreifacher Genuss aus Salami, Hinterschinken und Pilzen.',
  'Dreifacher Genuss aus Salami, Hinterschinken und Pilzen.',
  'Salami, Schinken, Champignons, Käse',
  'Salami, Schinken, Champignons, Käse',
  'Bestseller',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-22',
  '22',
  'pizza',
  'Pizza Capri',
  'Pizza Capri',
  'Kräftig belegt mit Salami, Schinken und gewürztem Rinderhackfleisch.',
  'Kräftig belegt mit Salami, Schinken und gewürztem Rinderhackfleisch.',
  'Salami, Schinken, Hackfleisch, Käse',
  'Salami, Schinken, Hackfleisch, Käse',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-23',
  '23',
  'pizza',
  'Pizza Kurier',
  'Pizza Kurier',
  'Salami, frische Champignons und saftiges Hackfleisch.',
  'Salami, frische Champignons und saftiges Hackfleisch.',
  'Salami, Champignons, Hackfleisch, Käse',
  'Salami, Champignons, Hackfleisch, Käse',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-24',
  '24',
  'pizza',
  'Pizza Frühling',
  'Pizza Frühling',
  'Zarter Schinken, Pilze und Rinderhackfleisch unter Käse.',
  'Zarter Schinken, Pilze und Rinderhackfleisch unter Käse.',
  'Schinken, Champignons, Hackfleisch, Käse',
  'Schinken, Champignons, Hackfleisch, Käse',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-25',
  '25',
  'pizza',
  'Pizza Sizilia',
  'Pizza Sizilia',
  'Schinken und aromatischer Blattspinat verfeinert mit gekochtem Ei.',
  'Schinken und aromatischer Blattspinat verfeinert mit gekochtem Ei.',
  'Schinken, Spinat, Ei, Käse, Tomatensauce',
  'Schinken, Spinat, Ei, Käse, Tomatensauce',
  'Traditionell',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-26',
  '26',
  'pizza',
  'Pizza Cipolla',
  'Pizza Cipolla',
  'Schinken mit würzigen Zwiebeln und feinem Ei.',
  'Schinken mit würzigen Zwiebeln und feinem Ei.',
  'Schinken, Zwiebel, Ei, Käse, Tomatensauce',
  'Schinken, Zwiebel, Ei, Käse, Tomatensauce',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-27',
  '27',
  'pizza',
  'Pizza Amarica',
  'Pizza Amarica',
  'Thunfisch mit frischen Champignons und feurigen Peperoni.',
  'Thunfisch mit frischen Champignons und feurigen Peperoni.',
  'Thunfisch, Champignons, scharfe Peperoni, Käse',
  'Thunfisch, Champignons, scharfe Peperoni, Käse',
  'Scharf 🔥',
  ARRAY['pescetarisch'],
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-28',
  '28',
  'pizza',
  'Pizza Mexicana',
  'Pizza Mexicana',
  'Knackiger Mais, bunte Paprika und pikante Salami.',
  'Knackiger Mais, bunte Paprika und pikante Salami.',
  'Mais, Paprika, Salami, Käse, Tomatensauce',
  'Mais, Paprika, Salami, Käse, Tomatensauce',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-28a',
  '28a',
  'pizza',
  'Pizza Diavolo',
  'Pizza Diavolo',
  'Einzigartig: Belegt mit Spaghetti Bolognese und feurigen Peperoni!',
  'Einzigartig: Belegt mit Spaghetti Bolognese und feurigen Peperoni!',
  'Spaghetti Bolognese, scharfe Peperoni, Käse',
  'Spaghetti Bolognese, scharfe Peperoni, Käse',
  'Spezialität 🔥',
  '{}',
  true,
  false,
  true,
  '{"small":9.6,"large":11.3,"family":20.8,"party":25.2}',
  9.6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-29',
  '29',
  'pizza',
  'Pizza Ruschio',
  'Pizza Ruschio',
  'Reich belegt mit Salami, Schinken, frischen Pilzen und Zwiebeln.',
  'Reich belegt mit Salami, Schinken, frischen Pilzen und Zwiebeln.',
  'Salami, Schinken, Champignons, Zwiebeln, Käse',
  'Salami, Schinken, Champignons, Zwiebeln, Käse',
  'Sehr beliebt',
  '{}',
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21,"party":26}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-30',
  '30',
  'pizza',
  'Pizza Texas',
  'Pizza Texas',
  'Herzhafter Western-Style mit Salami, Schinken, Pilzen und Peperoni.',
  'Herzhafter Western-Style mit Salami, Schinken, Pilzen und Peperoni.',
  'Salami, Schinken, Champignons, Peperoni, Käse',
  'Salami, Schinken, Champignons, Peperoni, Käse',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21,"party":26}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-31',
  '31',
  'pizza',
  'Pizza Milano',
  'Pizza Milano',
  'Feiner Schinken, knackiger Brokkoli und zart schmelzender Mozzarella.',
  'Feiner Schinken, knackiger Brokkoli und zart schmelzender Mozzarella.',
  'Schinken, Brokkoli, Mozzarella, Käse',
  'Schinken, Brokkoli, Mozzarella, Käse',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21,"party":26}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-32',
  '32',
  'pizza',
  'Pizza Vier Jahreszeiten',
  'Pizza Vier Jahreszeiten',
  'Quattro Stagioni: 4 beliebte Zutaten in harmonischer Perfektion.',
  'Quattro Stagioni: 4 beliebte Zutaten in harmonischer Perfektion.',
  'Salami, Schinken, Champignons, Paprika, Käse',
  'Salami, Schinken, Champignons, Paprika, Käse',
  'Klassiker',
  '{}',
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21,"party":26}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-33',
  '33',
  'pizza',
  'Pizza Gyrosa',
  'Pizza Gyrosa',
  'Herzhaftes Gyrosfleisch von der Pute mit Tomaten, Zwiebeln & Paprika.',
  'Herzhaftes Gyrosfleisch von der Pute mit Tomaten, Zwiebeln & Paprika.',
  'Gyrospizza mit Putenfleisch, Tomaten, Zwiebeln, Paprika',
  'Gyrospizza mit Putenfleisch, Tomaten, Zwiebeln, Paprika',
  'Bestseller',
  '{}',
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21,"party":26}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-34',
  '34',
  'pizza',
  'Pizza Italia',
  'Pizza Italia',
  'Mediterrane Komposition mit Salami, Schinken, Pilzen, Peperoni und Oliven.',
  'Mediterrane Komposition mit Salami, Schinken, Pilzen, Peperoni und Oliven.',
  'Salami, Schinken, Champignons, Peperoni, Oliven, Käse',
  'Salami, Schinken, Champignons, Peperoni, Oliven, Käse',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21,"party":26}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-35',
  '35',
  'pizza',
  'Pizza Mix',
  'Pizza Mix',
  'Die volle Vielfalt: 5 reichhaltige Beläge auf knusprigem Boden.',
  'Die volle Vielfalt: 5 reichhaltige Beläge auf knusprigem Boden.',
  'Salami, Schinken, Champignons, Zwiebeln, Hackfleisch',
  'Salami, Schinken, Champignons, Zwiebeln, Hackfleisch',
  'Top Tipp',
  '{}',
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21,"party":26}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-36',
  '36',
  'pizza',
  'Pizza Capricciosa',
  'Pizza Capricciosa',
  'Italienische Spezialität mit Salami, Schinken, Artischocken, Oliven und Knoblauch.',
  'Italienische Spezialität mit Salami, Schinken, Artischocken, Oliven und Knoblauch.',
  'Salami, Schinken, Artischocken, Oliven, Knoblauch',
  'Salami, Schinken, Artischocken, Oliven, Knoblauch',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21,"party":26}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-37',
  '37',
  'pizza',
  'Pizza Nach Art des Hauses',
  'Pizza Nach Art des Hauses',
  'Die Hauskreation von Venezia mit Salami, Schinken, Mais und Knoblauch.',
  'Die Hauskreation von Venezia mit Salami, Schinken, Mais und Knoblauch.',
  'Salami, Schinken, Mais, Knoblauch, Käse',
  'Salami, Schinken, Mais, Knoblauch, Käse',
  'Haus-Tipp',
  '{}',
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21,"party":26}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-38',
  '38',
  'calzone',
  'Calzone Classico',
  'Calzone Classico',
  'Traditionell gefüllte und zusammengeklappte Pizza, saftig im Steinofen gebacken.',
  'Traditionell gefüllte und zusammengeklappte Pizza, saftig im Steinofen gebacken.',
  'Salami, Schinken, Champignons, Hackfleisch, Paprika, Käse',
  'Salami, Schinken, Champignons, Hackfleisch, Paprika, Käse',
  'Gefüllt',
  '{}',
  false,
  true,
  false,
  '{"small":10.3,"large":12}',
  10.3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-39',
  '39',
  'calzone',
  'Calzone Vegetarisch',
  'Calzone Vegetarisch',
  'Gefüllte Calzone mit buntem, frischem Marktgemüse und geschmolzenem Käse.',
  'Gefüllte Calzone mit buntem, frischem Marktgemüse und geschmolzenem Käse.',
  'Frisches Gemüse der Saison, Käse, Tomatensauce',
  'Frisches Gemüse der Saison, Käse, Tomatensauce',
  'Vegetarisch',
  ARRAY['vegetarisch'],
  false,
  true,
  false,
  '{"small":10.3,"large":12}',
  10.3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-39a',
  '39a',
  'calzone',
  'Calzone Döner',
  'Calzone Döner',
  'Herzhaft gefüllt mit saftigem Dönerfleisch, würzigem Schafskäse und Tomaten.',
  'Herzhaft gefüllt mit saftigem Dönerfleisch, würzigem Schafskäse und Tomaten.',
  'Dönerfleisch, Schafskäse, Tomate, Zwiebeln, Käse',
  'Dönerfleisch, Schafskäse, Tomate, Zwiebeln, Käse',
  'Bestseller',
  '{}',
  false,
  true,
  false,
  '{"small":10.3,"large":12}',
  10.3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-40',
  '40',
  'pizza',
  'Pizza Frutti di Mare',
  'Pizza Frutti di Mare',
  'Ausgewählte Meeresfrüchte mit feinem Knoblauch und Kräutern.',
  'Ausgewählte Meeresfrüchte mit feinem Knoblauch und Kräutern.',
  'Meeresfrüchte, Knoblauch, Käse, Tomatensauce',
  'Meeresfrüchte, Knoblauch, Käse, Tomatensauce',
  'Meeresfrüchte',
  ARRAY['pescetarisch'],
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21.3,"party":26.2}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-41',
  '41',
  'pizza',
  'Pizza Cossa',
  'Pizza Cossa',
  'Zarter Hinterschinken, weicher Mozzarella und gekochtes Ei.',
  'Zarter Hinterschinken, weicher Mozzarella und gekochtes Ei.',
  'Schinken, Mozzarella, Ei, Käse, Tomatensauce',
  'Schinken, Mozzarella, Ei, Käse, Tomatensauce',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21.3,"party":26.2}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-42',
  '42',
  'pizza',
  'Pizza Quattro Formaggi',
  'Pizza Quattro Formaggi',
  'Vier erlesene Käsesorten für den vollen mediterranen Käsegenuss.',
  'Vier erlesene Käsesorten für den vollen mediterranen Käsegenuss.',
  'Mozzarella, Gorgonzola, Parmesan, Gouda, Tomatensauce',
  'Mozzarella, Gorgonzola, Parmesan, Gouda, Tomatensauce',
  'Käse-Genuss',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":10.1,"large":11.8,"family":21.3,"party":26.2}',
  10.1,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-43',
  '43',
  'pizza',
  'Pizza Goloso',
  'Pizza Goloso',
  'Salami, Schinken und Champignons mit aromatischem Knoblauch & Curry.',
  'Salami, Schinken und Champignons mit aromatischem Knoblauch & Curry.',
  'Salami, Schinken, Champignons, Knoblauch, Curry, Käse',
  'Salami, Schinken, Champignons, Knoblauch, Curry, Käse',
  '',
  '{}',
  true,
  false,
  true,
  '{"small":10.3,"large":12.5,"family":21.8,"party":27.2}',
  10.3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-44',
  '44',
  'pizza',
  'Pizza Alla Rucola',
  'Pizza Alla Rucola',
  'Kräftig-mediterrane Spezialität mit 7 aromatischen Zutaten.',
  'Kräftig-mediterrane Spezialität mit 7 aromatischen Zutaten.',
  'Hackfleisch, Schinken, Kapern, Peperoni, Champignons, Artischocken, Sardellen',
  'Hackfleisch, Schinken, Kapern, Peperoni, Champignons, Artischocken, Sardellen',
  'Gourmet',
  '{}',
  true,
  false,
  true,
  '{"small":10.3,"large":12.5,"family":21.8,"party":27.2}',
  10.3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-45',
  '45',
  'pizza',
  'Pizza Chef',
  'Pizza Chef',
  'Die Empfehlung des Küchenchefs: Thunfisch, Pilze, Paprika & feurige Schärfe.',
  'Die Empfehlung des Küchenchefs: Thunfisch, Pilze, Paprika & feurige Schärfe.',
  'Thunfisch, Zwiebeln, Champignons, Paprika, scharfe Peperoni',
  'Thunfisch, Zwiebeln, Champignons, Paprika, scharfe Peperoni',
  'Chef-Tipp 🔥',
  ARRAY['pescetarisch'],
  true,
  false,
  true,
  '{"small":10.3,"large":12.5,"family":21.8,"party":27.2}',
  10.3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-45b',
  '45b',
  'pizza',
  'Pizza Döner',
  'Pizza Döner',
  'Saftiges Dönerfleisch und Zwiebeln auf goldbraun gebackenem Käse.',
  'Saftiges Dönerfleisch und Zwiebeln auf goldbraun gebackenem Käse.',
  'Dönerfleisch, Zwiebeln, Käse, Tomatensauce',
  'Dönerfleisch, Zwiebeln, Käse, Tomatensauce',
  'Bestseller',
  '{}',
  true,
  false,
  true,
  '{"small":10.3,"large":12.5,"family":21.8,"party":27.2}',
  10.3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-46',
  '46',
  'pizza',
  'Pizza Venezia (Wunschpizza)',
  'Pizza Venezia (Wunschpizza)',
  'Stellen Sie Ihre Lieblingspizza völlig frei mit bis zu 5 beliebigen Zutaten zusammen!',
  'Stellen Sie Ihre Lieblingspizza völlig frei mit bis zu 5 beliebigen Zutaten zusammen!',
  'Pizza selbst zusammenstellen, bis zu 5 Wunschauflagen',
  'Pizza selbst zusammenstellen, bis zu 5 Wunschauflagen',
  'Wunschpizza ⭐',
  '{}',
  true,
  false,
  true,
  '{"small":11,"large":13,"family":24,"party":33}',
  11,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-47',
  '47',
  'pizza',
  'Pizza Indisch',
  'Pizza Indisch',
  'Indisch inspirierte Gewürze: Garam Masala, Curry, Salami, Schinken & Ei.',
  'Indisch inspirierte Gewürze: Garam Masala, Curry, Salami, Schinken & Ei.',
  'Salami, Schinken, Champignons, Zwiebeln, Knoblauch, Garam-Masala, Curry, Ei',
  'Salami, Schinken, Champignons, Zwiebeln, Knoblauch, Garam-Masala, Curry, Ei',
  'Würz-Highlight',
  '{}',
  true,
  false,
  true,
  '{"small":10.8,"large":13,"family":22.8,"party":28.2}',
  10.8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-48',
  '48',
  'pizza',
  'Pizza Vegetarisch Spezial',
  'Pizza Vegetarisch Spezial',
  'Große bunte Gemüseauswahl mit Artischocken, Paprika, Pilzen und Oliven.',
  'Große bunte Gemüseauswahl mit Artischocken, Paprika, Pilzen und Oliven.',
  'Artischocken, Paprika, Zwiebeln, Champignons, Peperoni, Oliven',
  'Artischocken, Paprika, Zwiebeln, Champignons, Peperoni, Oliven',
  'Vegetarisch 🌱',
  ARRAY['vegetarisch'],
  true,
  false,
  true,
  '{"small":10.8,"large":13,"family":22.8,"party":28.2}',
  10.8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-49',
  '49',
  'pizza',
  'Pizza Pippo',
  'Pizza Pippo',
  'Pikant-würzig mit Salami, Schinken, Pilzen, Knoblauch, Curry & Schärfe.',
  'Pikant-würzig mit Salami, Schinken, Pilzen, Knoblauch, Curry & Schärfe.',
  'Salami, Schinken, Champignons, Knoblauch, Zwiebeln, Curry, scharfe Peperoni',
  'Salami, Schinken, Champignons, Knoblauch, Zwiebeln, Curry, scharfe Peperoni',
  'Scharf 🔥',
  '{}',
  true,
  false,
  true,
  '{"small":10.8,"large":13,"family":22.8,"party":28.2}',
  10.8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pizza-49a',
  '49a',
  'pizza',
  'Pizza Pollo',
  'Pizza Pollo',
  'Zart gebratene Hähnchenbruststücke mit Brokkoli, Knoblauch und Peperoni.',
  'Zart gebratene Hähnchenbruststücke mit Brokkoli, Knoblauch und Peperoni.',
  'Gebratenes Hühnerfleisch, Brokkoli, Knoblauch, Peperoni, feine Gewürze',
  'Gebratenes Hühnerfleisch, Brokkoli, Knoblauch, Peperoni, feine Gewürze',
  'Sehr beliebt',
  '{}',
  true,
  false,
  true,
  '{"small":10.8,"large":13,"family":22.8,"party":28.2}',
  10.8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'extra-pizzabrot',
  'E1',
  'calzone',
  'Pizzabrot',
  'Pizzabrot',
  'Warmes, knuspriges Pizzabrot aus frischem Hefeteig mit Kräutern.',
  'Warmes, knuspriges Pizzabrot aus frischem Hefeteig mit Kräutern.',
  'Frisch gebackenes Pizzabrot mit Olivenöl und Kräutern',
  'Frisch gebackenes Pizzabrot mit Olivenöl und Kräutern',
  'Beilage',
  ARRAY['vegan'],
  false,
  true,
  false,
  '{"small":4.8,"large":5.5}',
  4.8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'extra-knoblauchbrot',
  'E2',
  'calzone',
  'Knoblauchbrot',
  'Knoblauchbrot',
  'Knusprig im Ofen gebacken mit extra aromatischem Knoblauchöl.',
  'Knusprig im Ofen gebacken mit extra aromatischem Knoblauchöl.',
  'Frisch gebackenes Brot mit frischem Knoblauchöl und Kräutern',
  'Frisch gebackenes Brot mit frischem Knoblauchöl und Kräutern',
  'Beilage',
  ARRAY['vegan'],
  false,
  true,
  false,
  '{"small":5.8,"large":6.5}',
  5.8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pasta-bolognese',
  '51',
  'pasta',
  'Spaghetti Bolognese',
  'Spaghetti Bolognese',
  'Klassische Spaghetti mit traditioneller italienischer Rinderhackfleischsauce.',
  'Klassische Spaghetti mit traditioneller italienischer Rinderhackfleischsauce.',
  'Spaghetti, 100% Rinderhackfleisch, Tomatensugo, Kräuter',
  'Spaghetti, 100% Rinderhackfleisch, Tomatensugo, Kräuter',
  'Klassiker',
  '{}',
  false,
  false,
  false,
  '{"single":8}',
  8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pasta-carbonara',
  '52',
  'pasta',
  'Spaghetti Carbonara',
  'Spaghetti Carbonara',
  'Spaghetti in sämiger Sahnesauce mit angebratenem Schinken und Parmesan.',
  'Spaghetti in sämiger Sahnesauce mit angebratenem Schinken und Parmesan.',
  'Spaghetti, Hinterschinken, Ei-Sahnesauce, Parmesan',
  'Spaghetti, Hinterschinken, Ei-Sahnesauce, Parmesan',
  '',
  '{}',
  false,
  false,
  false,
  '{"single":8.5}',
  8.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pasta-salmone',
  '54',
  'pasta',
  'Tagliatelle al Salmone',
  'Tagliatelle al Salmone',
  'Bandnudeln mit saftigen Lachsstücken in einer feinen Weißwein-Dillsauce.',
  'Bandnudeln mit saftigen Lachsstücken in einer feinen Weißwein-Dillsauce.',
  'Tagliatelle, Lachsfilet-Stücke, Weißwein-Sahnesauce, Dill',
  'Tagliatelle, Lachsfilet-Stücke, Weißwein-Sahnesauce, Dill',
  'Feinschmecker',
  ARRAY['pescetarisch'],
  false,
  false,
  false,
  '{"single":10.5}',
  10.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'gnocchi-napoli',
  '55',
  'gnocchi',
  'Gnocchi Napoli',
  'Gnocchi Napoli',
  'Zarte italienische Kartoffelgnocchi in aromatischer Tomatensauce mit Kräutern.',
  'Zarte italienische Kartoffelgnocchi in aromatischer Tomatensauce mit Kräutern.',
  'Kartoffelklößchen, fruchtige Tomatensauce, frisches Basilikum',
  'Kartoffelklößchen, fruchtige Tomatensauce, frisches Basilikum',
  'Vegetarisch',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":8.2}',
  8.2,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'gnocchi-bolognese',
  '56',
  'gnocchi',
  'Gnocchi Bolognese',
  'Gnocchi Bolognese',
  'Gnocchi mit unserer herzhaften, langsam geschmorten Bolognese-Fleischsauce.',
  'Gnocchi mit unserer herzhaften, langsam geschmorten Bolognese-Fleischsauce.',
  'Kartoffelgnocchi, hausgemachte Rinderhackfleischsauce, Parmesan',
  'Kartoffelgnocchi, hausgemachte Rinderhackfleischsauce, Parmesan',
  'Beliebt',
  '{}',
  false,
  false,
  false,
  '{"single":8.9}',
  8.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'gnocchi-gorgonzola',
  '57',
  'gnocchi',
  'Gnocchi Gorgonzola',
  'Gnocchi Gorgonzola',
  'Cremig und intensiv im Geschmack: Gnocchi in sämiger Gorgonzolasauce.',
  'Cremig und intensiv im Geschmack: Gnocchi in sämiger Gorgonzolasauce.',
  'Gnocchi, italienischer Gorgonzola-Käse, feine Sahnesauce',
  'Gnocchi, italienischer Gorgonzola-Käse, feine Sahnesauce',
  'Cremig',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":9.2}',
  9.2,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'gnocchi-al-forno',
  '58',
  'gnocchi',
  'Gnocchi al Forno (Überbacken)',
  'Gnocchi al Forno (Überbacken)',
  'Ofenfrisch gebacken mit Hinterschinken, feiner Tomaten-Sahnesauce und goldgelbem Gouda.',
  'Ofenfrisch gebacken mit Hinterschinken, feiner Tomaten-Sahnesauce und goldgelbem Gouda.',
  'Gnocchi, Schinken, Tomaten-Sahnesauce, mit Käse überbacken',
  'Gnocchi, Schinken, Tomaten-Sahnesauce, mit Käse überbacken',
  'Ofenfrisch',
  '{}',
  false,
  false,
  false,
  '{"single":9.5}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'reis-venezia',
  '59',
  'reisgerichte',
  'Reispfanne Venezia',
  'Reispfanne Venezia',
  'Würziger Reis mit gebratenem Hähnchenbrustfilet und Gemüse, im Ofen heiß mit Käse überbacken.',
  'Würziger Reis mit gebratenem Hähnchenbrustfilet und Gemüse, im Ofen heiß mit Käse überbacken.',
  'Hähnchenbruststreifen, frische Champignons, Erbsen, Sahnesauce, Käse',
  'Hähnchenbruststreifen, frische Champignons, Erbsen, Sahnesauce, Käse',
  'Spezialität',
  '{}',
  false,
  false,
  false,
  '{"single":9.5}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'reis-frutti-di-mare',
  '59a',
  'reisgerichte',
  'Risotto Frutti di Mare',
  'Risotto Frutti di Mare',
  'Mediterranes Reisgericht mit Meeresfrüchten, leichter Knoblauchnote und heißem Käse.',
  'Mediterranes Reisgericht mit Meeresfrüchten, leichter Knoblauchnote und heißem Käse.',
  'Meeresfrüchte, Knoblauch, feine Tomatensauce, mit Käse überbacken',
  'Meeresfrüchte, Knoblauch, feine Tomatensauce, mit Käse überbacken',
  'Meeresfrüchte',
  ARRAY['pescetarisch'],
  false,
  false,
  false,
  '{"single":10.2}',
  10.2,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'reis-vegetarisch',
  '59b',
  'reisgerichte',
  'Reispfanne Vegetarisch überbacken',
  'Reispfanne Vegetarisch überbacken',
  'Reisgericht mit buntem Marktgemüse und einer goldbraunen Käseschicht aus dem Ofen.',
  'Reisgericht mit buntem Marktgemüse und einer goldbraunen Käseschicht aus dem Ofen.',
  'Reis, Brokkoli, Champignons, Paprika, Mais, feine Sauce, Gouda',
  'Reis, Brokkoli, Champignons, Paprika, Mais, feine Sauce, Gouda',
  'Veggie',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":8.8}',
  8.8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pasta-rigatoni-forno',
  '50',
  'pasta-al-forno',
  'Rigatoni al Forno (Überbacken)',
  'Rigatoni al Forno (Überbacken)',
  'Röhrennudeln in reichhaltiger Rinderhackfleischsauce, mit einer goldgelben Käseschicht überbacken.',
  'Röhrennudeln in reichhaltiger Rinderhackfleischsauce, mit einer goldgelben Käseschicht überbacken.',
  'Rinderhackfleisch-Bolognese, Sahne, Gouda & Mozzarella überbacken',
  'Rinderhackfleisch-Bolognese, Sahne, Gouda & Mozzarella überbacken',
  'Bestseller',
  '{}',
  false,
  false,
  false,
  '{"single":8.9}',
  8.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pasta-lasagne',
  '53',
  'pasta-al-forno',
  'Hausgemachte Lasagne Bolognese',
  'Hausgemachte Lasagne Bolognese',
  'Schicht für Schicht ein Genuss: Nudelblätter, Bologneseragout, Béchamelsauce und viel Käse.',
  'Schicht für Schicht ein Genuss: Nudelblätter, Bologneseragout, Béchamelsauce und viel Käse.',
  'Nudelblätter, Rinderhackfleisch, Béchamelsauce, Käsekruste',
  'Nudelblätter, Rinderhackfleisch, Béchamelsauce, Käsekruste',
  'Hausgemacht',
  '{}',
  false,
  false,
  false,
  '{"single":9.2}',
  9.2,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'pasta-cannelloni-forno',
  '53a',
  'pasta-al-forno',
  'Cannelloni al Forno',
  'Cannelloni al Forno',
  'Klassische italienische Cannelloni gefüllt mit saftigem Hackfleisch und gratiniertem Käse.',
  'Klassische italienische Cannelloni gefüllt mit saftigem Hackfleisch und gratiniertem Käse.',
  'Gefüllte Nudelrollen mit Rinderhack, Tomatensauce, mit Gouda überbacken',
  'Gefüllte Nudelrollen mit Rinderhack, Tomatensauce, mit Gouda überbacken',
  'Traditionell',
  '{}',
  false,
  false,
  false,
  '{"single":9.4}',
  9.4,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'veg-brokkoli-auflauf',
  '65',
  'vegetarisch',
  'Brokkoli-Auflauf vegetarisch überbacken',
  'Brokkoli-Auflauf vegetarisch überbacken',
  'Zarter Brokkoli mit Kartoffelscheiben in feiner Sauce Hollandaise und knusprigem Käse.',
  'Zarter Brokkoli mit Kartoffelscheiben in feiner Sauce Hollandaise und knusprigem Käse.',
  'Brokkoliröschen, Kartoffeln, Sauce Hollandaise, mit Käse überbacken',
  'Brokkoliröschen, Kartoffeln, Sauce Hollandaise, mit Käse überbacken',
  'Veggie-Hit',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":8.9}',
  8.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'veg-blumenkohl-topf',
  '66',
  'vegetarisch',
  'Blumenkohl-Brokkoli-Topf überbacken',
  'Blumenkohl-Brokkoli-Topf überbacken',
  'Herrlich frisches Gemüse im Ofen goldgelb mit herzhaftem Käse gratiniert.',
  'Herrlich frisches Gemüse im Ofen goldgelb mit herzhaftem Käse gratiniert.',
  'Frischer Blumenkohl, Brokkoli, Kartoffeln, Sahnesauce, mit Gouda überbacken',
  'Frischer Blumenkohl, Brokkoli, Kartoffeln, Sahnesauce, mit Gouda überbacken',
  'Vegetarisch',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":8.9}',
  8.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'veg-spinat-gratin',
  '67',
  'vegetarisch',
  'Spinat-Kartoffel-Gratin überbacken',
  'Spinat-Kartoffel-Gratin überbacken',
  'Würziger Blattspinat und Kartoffeln mit zarter Knoblauchnote und Käsekruste.',
  'Würziger Blattspinat und Kartoffeln mit zarter Knoblauchnote und Käsekruste.',
  'Blattspinat, Kartoffelscheiben, Knoblauch, feine Sahnesauce, Käse',
  'Blattspinat, Kartoffelscheiben, Knoblauch, feine Sahnesauce, Käse',
  'Vegetarisch',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":8.8}',
  8.8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'auflauf-kartoffel-hack',
  '75',
  'auflaeufe',
  'Kartoffel-Hackfleisch-Auflauf',
  'Kartoffel-Hackfleisch-Auflauf',
  'Herzhafter Ofenauflauf mit Kartoffeln und würzigem Hackfleisch unter einer Käsekruste.',
  'Herzhafter Ofenauflauf mit Kartoffeln und würzigem Hackfleisch unter einer Käsekruste.',
  'Kartoffelscheiben, Rinderhackfleisch, Zwiebeln, Sahnesauce, Gouda überbacken',
  'Kartoffelscheiben, Rinderhackfleisch, Zwiebeln, Sahnesauce, Gouda überbacken',
  'Deftig',
  '{}',
  false,
  false,
  false,
  '{"single":9.5}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'auflauf-venezia-spezial',
  '76',
  'auflaeufe',
  'Venezia Spezial-Auflauf',
  'Venezia Spezial-Auflauf',
  'Unser Haus-Auflauf mit zarter Hähnchenbrust, frischem Gemüse und reichlich Käse.',
  'Unser Haus-Auflauf mit zarter Hähnchenbrust, frischem Gemüse und reichlich Käse.',
  'Hähnchenbrust, Kartoffeln, Champignons, Brokkoli, Sahnesauce, Käse',
  'Hähnchenbrust, Kartoffeln, Champignons, Brokkoli, Sahnesauce, Käse',
  'Haus-Spezialität',
  '{}',
  false,
  false,
  false,
  '{"single":9.9}',
  9.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'auflauf-nudel-schinken',
  '77',
  'auflaeufe',
  'Nudel-Schinken-Auflauf',
  'Nudel-Schinken-Auflauf',
  'Der klassische Nudelauflauf mit viel Schinken, Champignons und goldener Käseschicht.',
  'Der klassische Nudelauflauf mit viel Schinken, Champignons und goldener Käseschicht.',
  'Rigatoni, Formfleisch-Schinken, frische Champignons, Sahnesauce, Käse',
  'Rigatoni, Formfleisch-Schinken, frische Champignons, Sahnesauce, Käse',
  'Klassiker',
  '{}',
  false,
  false,
  false,
  '{"single":9.2}',
  9.2,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'gyros-teller',
  '60',
  'gyros',
  'Gyrosteller Komplett mit Beilage',
  'Gyrosteller Komplett mit Beilage',
  'Traditionell gewürztes, zartes Gyrosfleisch serviert mit hausgemachtem Zaziki, knusprigen Pommes und frischem Salat.',
  'Traditionell gewürztes, zartes Gyrosfleisch serviert mit hausgemachtem Zaziki, knusprigen Pommes und frischem Salat.',
  'Fein gewürztes Gyrosfleisch, Zaziki, Zwiebeln, Pommes Frites, gemischter Salat',
  'Fein gewürztes Gyrosfleisch, Zaziki, Zwiebeln, Pommes Frites, gemischter Salat',
  'Bestseller',
  '{}',
  false,
  false,
  false,
  '{"single":10.5}',
  10.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'gyros-ueberbacken',
  '61',
  'gyros',
  'Gyros überbacken in Metaxasauce',
  'Gyros überbacken in Metaxasauce',
  'Pfannengyros in cremiger Metaxasauce, im Ofen goldbraun mit Käse überbacken.',
  'Pfannengyros in cremiger Metaxasauce, im Ofen goldbraun mit Käse überbacken.',
  'Gyrosfleisch, pikante Metaxasauce, mit Käse überbacken, dazu Pommes',
  'Gyrosfleisch, pikante Metaxasauce, mit Käse überbacken, dazu Pommes',
  'Sehr beliebt',
  '{}',
  false,
  false,
  false,
  '{"single":11.2}',
  11.2,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'doner-teller',
  '62',
  'gyros',
  'Dönerteller Komplett mit Beilage',
  'Dönerteller Komplett mit Beilage',
  'Zartes Drehspießfleisch serviert mit Pommes oder Reis, frischem Salat und Saucen.',
  'Zartes Drehspießfleisch serviert mit Pommes oder Reis, frischem Salat und Saucen.',
  'Drehspießfleisch, Pommes/Reis, Salat, Knoblauch- & Kräutersauce',
  'Drehspießfleisch, Pommes/Reis, Salat, Knoblauch- & Kräutersauce',
  'Klassiker',
  '{}',
  false,
  false,
  false,
  '{"single":9.5}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'doner-durum',
  '63',
  'gyros',
  'Dürüm Döner (Wraprolle)',
  'Dürüm Döner (Wraprolle)',
  'Frisch gerolltes Fladenbrot gefüllt mit saftigem Dönerfleisch und Salat.',
  'Frisch gerolltes Fladenbrot gefüllt mit saftigem Dönerfleisch und Salat.',
  'Fladenbrotteig, Drehspießfleisch, Salatmix, Sauce',
  'Fladenbrotteig, Drehspießfleisch, Salatmix, Sauce',
  '',
  '{}',
  false,
  false,
  false,
  '{"single":7}',
  7,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'doner-box',
  '64',
  'gyros',
  'Dönerbox mit Pommes',
  'Dönerbox mit Pommes',
  'Handliche Box vollgepackt mit heißem Drehspießfleisch und Pommes Frites.',
  'Handliche Box vollgepackt mit heißem Drehspießfleisch und Pommes Frites.',
  'Drehspießfleisch, Pommes Frites, Sauce nach Wahl',
  'Drehspießfleisch, Pommes Frites, Sauce nach Wahl',
  'Quick Snack',
  '{}',
  false,
  false,
  false,
  '{"single":6}',
  6,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'burger-double',
  '70',
  'american-food',
  'Venezia Double Cheeseburger & Pommes',
  'Venezia Double Cheeseburger & Pommes',
  'Zwei 100% Rindfleisch-Patties, doppelter Cheddar, knuspriger Bacon und Pommes Frites.',
  'Zwei 100% Rindfleisch-Patties, doppelter Cheddar, knuspriger Bacon und Pommes Frites.',
  '2x Rindfleisch-Patty, Brioche Bun, Cheddar, Bacon, Pommes',
  '2x Rindfleisch-Patty, Brioche Bun, Cheddar, Bacon, Pommes',
  'Mega Burger 🍔',
  '{}',
  false,
  false,
  false,
  '{"single":9.9}',
  9.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'snack-pizzabrotchen',
  '71',
  'beilagen',
  '8 Stk. Gefüllte Pizzabrötchen',
  '8 Stk. Gefüllte Pizzabrötchen',
  'Ofenfrische Bällchen gefüllt mit Käse & Schinken/Salami inkl. Kräuterbutter.',
  'Ofenfrische Bällchen gefüllt mit Käse & Schinken/Salami inkl. Kräuterbutter.',
  'Gouda, Schinken/Salami, Kräuterbutter',
  'Gouda, Schinken/Salami, Kräuterbutter',
  'Snack-Hit',
  '{}',
  false,
  false,
  false,
  '{"single":5.5}',
  5.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'schnitzel-wiener',
  '80',
  'fleischgerichte',
  'Schnitzel Wiener Art',
  'Schnitzel Wiener Art',
  'Zwei kross panierte Schweineschnitzel serviert mit Pommes und Salat.',
  'Zwei kross panierte Schweineschnitzel serviert mit Pommes und Salat.',
  'Paniertes Schweineschnitzel, Zitronenspalte, Pommes, Salat',
  'Paniertes Schweineschnitzel, Zitronenspalte, Pommes, Salat',
  'Klassiker',
  '{}',
  false,
  false,
  false,
  '{"single":9.5}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'schnitzel-jaeger',
  '81',
  'fleischgerichte',
  'Jägerschnitzel mit Champignon-Rahm',
  'Jägerschnitzel mit Champignon-Rahm',
  'Krosse Schnitzel übergossen mit cremiger Champignon-Rahmsauce und Pommes.',
  'Krosse Schnitzel übergossen mit cremiger Champignon-Rahmsauce und Pommes.',
  'Schweineschnitzel, Waldpilz-Rahmsauce, Pommes, Salat',
  'Schweineschnitzel, Waldpilz-Rahmsauce, Pommes, Salat',
  'Sehr beliebt',
  '{}',
  false,
  false,
  false,
  '{"single":10.5}',
  10.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'schnitzel-zigeuner',
  '82',
  'fleischgerichte',
  'Zigeunerschnitzel (Pikant)',
  'Zigeunerschnitzel (Pikant)',
  'Kross paniertes Schnitzel in feurig-fruchtiger Zigeunersauce mit Pommes Frites.',
  'Kross paniertes Schnitzel in feurig-fruchtiger Zigeunersauce mit Pommes Frites.',
  'Schweineschnitzel, pikante Paprika-Zwiebel-Sauce, Pommes, Salat',
  'Schweineschnitzel, pikante Paprika-Zwiebel-Sauce, Pommes, Salat',
  'Pikant',
  '{}',
  false,
  false,
  false,
  '{"single":10.5}',
  10.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'fleisch-haehnchenbrust',
  '83',
  'fleischgerichte',
  'Hähnchenbrustfilet vom Grill',
  'Hähnchenbrustfilet vom Grill',
  'Zart mariniertes Hähnchenbrustfilet auf den Punkt gegrillt mit Kräuterbutter.',
  'Zart mariniertes Hähnchenbrustfilet auf den Punkt gegrillt mit Kräuterbutter.',
  'Gegrillte Hähnchenbrust, Kräuterbutter, Pommes Frites, Salat',
  'Gegrillte Hähnchenbrust, Kräuterbutter, Pommes Frites, Salat',
  'Vom Grill',
  '{}',
  false,
  false,
  false,
  '{"single":10.9}',
  10.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'salad-venezia',
  '90',
  'salate',
  'Insalata Venezia (Großer Salatteller)',
  'Insalata Venezia (Großer Salatteller)',
  'Große Salatschüssel mit gebratenem Hähnchenfilet, Ei und Hausdressing.',
  'Große Salatschüssel mit gebratenem Hähnchenfilet, Ei und Hausdressing.',
  'Blattsalat, Hähnchenstreifen, Ei, Mais, Gurken, Tomaten',
  'Blattsalat, Hähnchenstreifen, Ei, Mais, Gurken, Tomaten',
  'Empfehlung',
  '{}',
  false,
  false,
  false,
  '{"single":8.9}',
  8.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'salad-tonno',
  '91',
  'salate',
  'Insalata Tonno',
  'Insalata Tonno',
  'Frischer Salatmix mit feinem Thunfisch, Zwiebelringen und Oliven.',
  'Frischer Salatmix mit feinem Thunfisch, Zwiebelringen und Oliven.',
  'Thunfisch, rote Zwiebeln, Oliven, Tomaten, Gurken',
  'Thunfisch, rote Zwiebeln, Oliven, Tomaten, Gurken',
  '',
  ARRAY['pescetarisch'],
  false,
  false,
  false,
  '{"single":8}',
  8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'salad-mista',
  '92',
  'salate',
  'Insalata Mista (Gemischter Salat)',
  'Insalata Mista (Gemischter Salat)',
  'Frischer bunter Marktsalat mit knackigem Gemüse und feinem Dressing.',
  'Frischer bunter Marktsalat mit knackigem Gemüse und feinem Dressing.',
  'Knackiger Blattsalat, Gurken, Tomaten, Paprika, Mais, Hausdressing',
  'Knackiger Blattsalat, Gurken, Tomaten, Paprika, Mais, Hausdressing',
  'Frisch',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":6.5}',
  6.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'salad-caprese',
  '93',
  'salate',
  'Insalata Caprese',
  'Insalata Caprese',
  'Italienischer Vorspeisen-Klassiker mit saftigen Tomaten und echtem Mozzarella.',
  'Italienischer Vorspeisen-Klassiker mit saftigen Tomaten und echtem Mozzarella.',
  'Frische Tomatenscheiben, Mozzarella, Basilikum, Olivenöl, Balsamico',
  'Frische Tomatenscheiben, Mozzarella, Basilikum, Olivenöl, Balsamico',
  'Italienisch',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":7.5}',
  7.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'dessert-tiramisu',
  '100',
  'dessert-drinks',
  'Original Italienisches Tiramisu',
  'Original Italienisches Tiramisu',
  'Hausgemachtes italienisches Tiramisu mit Mascarpone und Kakao.',
  'Hausgemachtes italienisches Tiramisu mit Mascarpone und Kakao.',
  'Mascarpone, Löffelbiskuits, Espresso, Kakao',
  'Mascarpone, Löffelbiskuits, Espresso, Kakao',
  'Hausgemacht 🍰',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":4.5}',
  4.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'drink-cola-1l',
  '110',
  'getraenke',
  'Coca-Cola (1,0 Liter Flasche)',
  'Coca-Cola (1,0 Liter Flasche)',
  'Eiskalte Coca-Cola Original Taste in der 1,0-Liter-Flasche.',
  'Eiskalte Coca-Cola Original Taste in der 1,0-Liter-Flasche.',
  'Koffeinhaltiges Erfrischungsgetränk inkl. Pfand',
  'Koffeinhaltiges Erfrischungsgetränk inkl. Pfand',
  'Kalt',
  ARRAY['vegan'],
  false,
  false,
  false,
  '{"single":3}',
  3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'drink-fanta-1l',
  '111',
  'getraenke',
  'Fanta Orange (1,0 Liter Flasche)',
  'Fanta Orange (1,0 Liter Flasche)',
  'Fruchtiger Orangengeschmack, spritzig und erfrischend.',
  'Fruchtiger Orangengeschmack, spritzig und erfrischend.',
  'Orangenlimonade inkl. Pfand',
  'Orangenlimonade inkl. Pfand',
  'Kalt',
  ARRAY['vegan'],
  false,
  false,
  false,
  '{"single":3}',
  3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'drink-sprite-1l',
  '112',
  'getraenke',
  'Sprite (1,0 Liter Flasche)',
  'Sprite (1,0 Liter Flasche)',
  'Spritzig-erfrischende Zitronenlimonade in der 1,0-Liter-Flasche.',
  'Spritzig-erfrischende Zitronenlimonade in der 1,0-Liter-Flasche.',
  'Zitronen-Limetten-Limonade inkl. Pfand',
  'Zitronen-Limetten-Limonade inkl. Pfand',
  'Kalt',
  ARRAY['vegan'],
  false,
  false,
  false,
  '{"single":3}',
  3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'drink-mezzo-1l',
  '113',
  'getraenke',
  'Mezzo Mix (1,0 Liter Flasche)',
  'Mezzo Mix (1,0 Liter Flasche)',
  'Der beliebte Mix aus Cola und fruchtigem Orangengeschmack.',
  'Der beliebte Mix aus Cola und fruchtigem Orangengeschmack.',
  'Cola küsst Orange inkl. Pfand',
  'Cola küsst Orange inkl. Pfand',
  'Kalt',
  ARRAY['vegan'],
  false,
  false,
  false,
  '{"single":3}',
  3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'drink-wasser-07l',
  '114',
  'getraenke',
  'Mineralwasser Spritzig (0,7 Liter)',
  'Mineralwasser Spritzig (0,7 Liter)',
  'Erfrischendes Mineralwasser mit prickelnder Kohlensäure.',
  'Erfrischendes Mineralwasser mit prickelnder Kohlensäure.',
  'Natürliches Mineralwasser mit Kohlensäure',
  'Natürliches Mineralwasser mit Kohlensäure',
  'Erfrischung',
  ARRAY['vegan'],
  false,
  false,
  false,
  '{"single":2.5}',
  2.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'drink-bier-05l',
  '115',
  'getraenke',
  'Radeberger Pilsner (0,5 Liter Flasche)',
  'Radeberger Pilsner (0,5 Liter Flasche)',
  'Feinherbes sächsisches Spitzen-Pilsner eiskalt serviert.',
  'Feinherbes sächsisches Spitzen-Pilsner eiskalt serviert.',
  'Deutsches Pilsener Bier 4,8% Vol.',
  'Deutsches Pilsener Bier 4,8% Vol.',
  'Feinherb',
  '{}',
  false,
  false,
  false,
  '{"single":2.8}',
  2.8,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'grill-teller-venezia',
  '120',
  'grill-menue',
  'Grillteller Venezia',
  'Grillteller Venezia',
  'Reichhaltiger Grillteller mit verschiedenen Fleischsorten frisch vom Rost, serviert mit Pommes und hausgemachtem Zaziki.',
  'Reichhaltiger Grillteller mit verschiedenen Fleischsorten frisch vom Rost, serviert mit Pommes und hausgemachtem Zaziki.',
  'Gyros, Hähnchenbrust, Cevapcici, Pommes Frites, Zaziki & gemischter Salat',
  'Gyros, Hähnchenbrust, Cevapcici, Pommes Frites, Zaziki & gemischter Salat',
  'Spezialität',
  '{}',
  false,
  false,
  false,
  '{"single":14.5}',
  14.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'grill-bifteki',
  '121',
  'grill-menue',
  'Bifteki mit Schafskäse gefüllt',
  'Bifteki mit Schafskäse gefüllt',
  'Saftig gegrilltes Hacksteak gefüllt mit feinstem griechischem Schafskäse.',
  'Saftig gegrilltes Hacksteak gefüllt mit feinstem griechischem Schafskäse.',
  'Würzige Hacksteaks mit Feta gefüllt, Pommes Frites, Zaziki & Salat',
  'Würzige Hacksteaks mit Feta gefüllt, Pommes Frites, Zaziki & Salat',
  'Sehr beliebt',
  '{}',
  false,
  false,
  false,
  '{"single":12.9}',
  12.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'grill-souvlaki',
  '122',
  'grill-menue',
  'Souvlaki Spieße (2 Stück)',
  'Souvlaki Spieße (2 Stück)',
  'Traditionell marinierte Fleischspieße zart über der Flamme gegrillt.',
  'Traditionell marinierte Fleischspieße zart über der Flamme gegrillt.',
  '2 gegrillte Schweinefleischspieße, Kräuterbutter, Pommes, Zaziki & Salat',
  '2 gegrillte Schweinefleischspieße, Kräuterbutter, Pommes, Zaziki & Salat',
  'Griechisch',
  '{}',
  false,
  false,
  false,
  '{"single":12.5}',
  12.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'burger-crispy-chicken',
  '72',
  'american-food',
  'Crispy Chicken Burger & Pommes',
  'Crispy Chicken Burger & Pommes',
  'Goldbraun gebackenes Hähnchenbrustfilet im soften Brioche-Bun mit Pommes Frites.',
  'Goldbraun gebackenes Hähnchenbrustfilet im soften Brioche-Bun mit Pommes Frites.',
  'Krosses Hähnchenfilet, Mayo, Salat, Tomaten, Gurken & knusprige Pommes',
  'Krosses Hähnchenfilet, Mayo, Salat, Tomaten, Gurken & knusprige Pommes',
  'Knusprig',
  '{}',
  false,
  false,
  false,
  '{"single":8.9}',
  8.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'burger-bbq-bacon',
  '73',
  'american-food',
  'BBQ Bacon Burger & Pommes',
  'BBQ Bacon Burger & Pommes',
  'Saftiges Rinderhack mit herzhaftem Räucherspeck und würziger Barbecue-Sauce.',
  'Saftiges Rinderhack mit herzhaftem Räucherspeck und würziger Barbecue-Sauce.',
  'Rindfleisch-Patty, knuspriger Bacon, rauchige BBQ-Sauce, Röstzwiebeln, Pommes',
  'Rindfleisch-Patty, knuspriger Bacon, rauchige BBQ-Sauce, Röstzwiebeln, Pommes',
  'Smoky BBQ',
  '{}',
  false,
  false,
  false,
  '{"single":9.5}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'american-chicken-wings',
  '74',
  'american-food',
  'Buffalo Chicken Wings (8 Stk.)',
  'Buffalo Chicken Wings (8 Stk.)',
  'Kross gewürzte Chicken Wings nach US-Art serviert mit Pommes Frites.',
  'Kross gewürzte Chicken Wings nach US-Art serviert mit Pommes Frites.',
  '8 marinierte Hähnchenflügel, Barbecuesauce oder Knoblauchsauce, Pommes',
  '8 marinierte Hähnchenflügel, Barbecuesauce oder Knoblauchsauce, Pommes',
  'Fingerfood',
  '{}',
  false,
  false,
  false,
  '{"single":8.5}',
  8.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'american-chicken-nuggets',
  '75',
  'american-food',
  'Chicken Nuggets (8 Stk.) & Pommes',
  'Chicken Nuggets (8 Stk.) & Pommes',
  'Zartes Hähnchenfleisch in knuspriger Panade mit Pommes.',
  'Zartes Hähnchenfleisch in knuspriger Panade mit Pommes.',
  '8 goldbraune Hähnchen-Nuggets, Süß-Sauer Dip, Pommes Frites',
  '8 goldbraune Hähnchen-Nuggets, Süß-Sauer Dip, Pommes Frites',
  'Snack-Hit',
  '{}',
  false,
  false,
  false,
  '{"single":7.5}',
  7.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'indisch-chicken-curry',
  '130',
  'indisch',
  'Chicken Curry',
  'Chicken Curry',
  'Klassisches indisches Hähnchencurry schonend zubereitet mit erlesenen orientalischen Gewürzen.',
  'Klassisches indisches Hähnchencurry schonend zubereitet mit erlesenen orientalischen Gewürzen.',
  'Zartes Hähnchenbrustfilet, aromatische Currysauce, Basmatireis',
  'Zartes Hähnchenbrustfilet, aromatische Currysauce, Basmatireis',
  'Indisch',
  '{}',
  false,
  false,
  false,
  '{"single":11.9}',
  11.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'indisch-chicken-korma',
  '131',
  'indisch',
  'Chicken Korma',
  'Chicken Korma',
  'Mildes, cremiges Currygericht nach königlicher Mogul-Art mit feinen Nüssen und Rosinen.',
  'Mildes, cremiges Currygericht nach königlicher Mogul-Art mit feinen Nüssen und Rosinen.',
  'Hähnchenfilet, milde Cashew-Sahnesauce, Mandeln, Basmatireis',
  'Hähnchenfilet, milde Cashew-Sahnesauce, Mandeln, Basmatireis',
  'Cremig & Mild',
  '{}',
  false,
  false,
  false,
  '{"single":12.5}',
  12.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'indisch-chicken-tikka-masala',
  '132',
  'indisch',
  'Chicken Tikka Masala',
  'Chicken Tikka Masala',
  'Zart marinierte Hähnchenstücke in pikanter Gewürz-Tomatensauce.',
  'Zart marinierte Hähnchenstücke in pikanter Gewürz-Tomatensauce.',
  'Gegrilltes Hähnchen, Tomaten-Zwiebel-Masala, Ingwer, frischer Koriander, Basmatireis',
  'Gegrilltes Hähnchen, Tomaten-Zwiebel-Masala, Ingwer, frischer Koriander, Basmatireis',
  'Sehr beliebt',
  '{}',
  false,
  false,
  false,
  '{"single":12.5}',
  12.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'indisch-palak-paneer',
  '133',
  'indisch',
  'Palak Paneer',
  'Palak Paneer',
  'Traditionelles vegetarisches Gericht mit würzigem Rahmspinat und gebratenen Käsewürfeln.',
  'Traditionelles vegetarisches Gericht mit würzigem Rahmspinat und gebratenen Käsewürfeln.',
  'Hausgemachter indischer Frischkäse, cremiger Blattspinat, Gewürze, Basmatireis',
  'Hausgemachter indischer Frischkäse, cremiger Blattspinat, Gewürze, Basmatireis',
  'Vegetarisch',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":10.9}',
  10.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'lamm-koteletts',
  '140',
  'lamm',
  'Lammkoteletts vom Grill',
  'Lammkoteletts vom Grill',
  'Zarte Lammkoteletts auf den Punkt gegrillt mit Kräuterbutter und Beilagen.',
  'Zarte Lammkoteletts auf den Punkt gegrillt mit Kräuterbutter und Beilagen.',
  'Gegrillte Lammkoteletts, Kräuterbutter, Rosmarinkartoffeln, Salat',
  'Gegrillte Lammkoteletts, Kräuterbutter, Rosmarinkartoffeln, Salat',
  'Premium',
  '{}',
  false,
  false,
  false,
  '{"single":16.5}',
  16.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'lamm-curry',
  '141',
  'lamm',
  'Lamm Curry',
  'Lamm Curry',
  'Saftiges Lammfleisch langsam geschmort in herzhafter Gewürz-Currysauce.',
  'Saftiges Lammfleisch langsam geschmort in herzhafter Gewürz-Currysauce.',
  'Zartes Lammfleisch, aromatische indische Currysauce, Basmatireis',
  'Zartes Lammfleisch, aromatische indische Currysauce, Basmatireis',
  'Würzig',
  '{}',
  false,
  false,
  false,
  '{"single":13.9}',
  13.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'lamm-korma',
  '142',
  'lamm',
  'Lamm Korma',
  'Lamm Korma',
  'Mogul-Spezialität: Lammfleisch in delikater Kokos-Mandel-Sauce.',
  'Mogul-Spezialität: Lammfleisch in delikater Kokos-Mandel-Sauce.',
  'Zartes Lammfleisch, milde Mandel-Sahnesauce, Basmatireis',
  'Zartes Lammfleisch, milde Mandel-Sahnesauce, Basmatireis',
  'Mild & Fein',
  '{}',
  false,
  false,
  false,
  '{"single":14.5}',
  14.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'steak-kraeuterbutter',
  '150',
  'steaks',
  'Rumpsteak mit Kräuterbutter',
  'Rumpsteak mit Kräuterbutter',
  'Auf den Punkt gegrilltes saftiges Rumpsteak serviert mit aromatischer Kräuterbutter.',
  'Auf den Punkt gegrilltes saftiges Rumpsteak serviert mit aromatischer Kräuterbutter.',
  '200g argentinisches Rumpsteak, hausgemachte Kräuterbutter, Pommes, Salat',
  '200g argentinisches Rumpsteak, hausgemachte Kräuterbutter, Pommes, Salat',
  'Vom Grill',
  '{}',
  false,
  false,
  false,
  '{"single":17.5}',
  17.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'steak-pfeffersauce',
  '151',
  'steaks',
  'Pfeffer-Steak',
  'Pfeffer-Steak',
  'Saftiges Steak überzogen mit einer edlen Rahmsauce aus ganzen grünen Pfefferkörnern.',
  'Saftiges Steak überzogen mit einer edlen Rahmsauce aus ganzen grünen Pfefferkörnern.',
  '200g Rumpsteak, pikante grüne Pfeffersauce, Kroketten, Salat',
  '200g Rumpsteak, pikante grüne Pfeffersauce, Kroketten, Salat',
  'Pikant',
  '{}',
  false,
  false,
  false,
  '{"single":18.5}',
  18.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'steak-champignon',
  '152',
  'steaks',
  'Champignon-Rumpsteak',
  'Champignon-Rumpsteak',
  'Klassisches Rindersteak mit frischen sautierten Waldpilzen in feiner Sahnesauce.',
  'Klassisches Rindersteak mit frischen sautierten Waldpilzen in feiner Sahnesauce.',
  '200g Rumpsteak, frische Champignons in Rahmsauce, Bratkartoffeln, Salat',
  '200g Rumpsteak, frische Champignons in Rahmsauce, Bratkartoffeln, Salat',
  'Klassiker',
  '{}',
  false,
  false,
  false,
  '{"single":18.5}',
  18.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'fisch-lachs',
  '160',
  'fischgerichte',
  'Gegrilltes Lachsfilet',
  'Gegrilltes Lachsfilet',
  'Frisch gegrilltes Lachsfilet auf zarten Nudeln in feiner Zitronen-Dillsauce.',
  'Frisch gegrilltes Lachsfilet auf zarten Nudeln in feiner Zitronen-Dillsauce.',
  'Lachsfilet, feine Dillsauce, Bandnudeln, Salatbeilage',
  'Lachsfilet, feine Dillsauce, Bandnudeln, Salatbeilage',
  'Fisch-Hit',
  ARRAY['pescetarisch'],
  false,
  false,
  false,
  '{"single":14.9}',
  14.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'fisch-calamari',
  '161',
  'fischgerichte',
  'Calamari Fritti',
  'Calamari Fritti',
  'Kross frittierte Calamariringe mit frischer Zitrone und Knoblauchdip.',
  'Kross frittierte Calamariringe mit frischer Zitrone und Knoblauchdip.',
  'Knusprig panierte Tintenfischringe, hausgemachte Knoblauchsauce, Pommes, Salat',
  'Knusprig panierte Tintenfischringe, hausgemachte Knoblauchsauce, Pommes, Salat',
  'Mediterran',
  ARRAY['pescetarisch'],
  false,
  false,
  false,
  '{"single":11.5}',
  11.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'fisch-zander',
  '162',
  'fischgerichte',
  'Zanderfilet gebraten',
  'Zanderfilet gebraten',
  'Zartes Zanderfilet auf der Haut kross gebraten mit Kräuterkartoffeln.',
  'Zartes Zanderfilet auf der Haut kross gebraten mit Kräuterkartoffeln.',
  'Gebratenes Zanderfilet, Remouladensauce, Petersilienkartoffeln, Salat',
  'Gebratenes Zanderfilet, Remouladensauce, Petersilienkartoffeln, Salat',
  'Fein',
  ARRAY['pescetarisch'],
  false,
  false,
  false,
  '{"single":13.9}',
  13.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'mex-tacos',
  '170',
  'mexikanisch',
  'Tacos con Carne (3 Stück)',
  'Tacos con Carne (3 Stück)',
  'Knusprige Maisschalen herzhaft gefüllt nach mexikanischem Originalrezept.',
  'Knusprige Maisschalen herzhaft gefüllt nach mexikanischem Originalrezept.',
  '3 Maistortillas, Rinderhackfleisch, Cheddarkäse, Jalapeños, Salsa & Sauerrahm',
  '3 Maistortillas, Rinderhackfleisch, Cheddarkäse, Jalapeños, Salsa & Sauerrahm',
  'Mexikanisch',
  '{}',
  false,
  false,
  false,
  '{"single":9.9}',
  9.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'mex-burrito-pollo',
  '171',
  'mexikanisch',
  'Burrito Pollo',
  'Burrito Pollo',
  'Gerollte Tortilla reich gefüllt mit würzigem Fleisch und Bohnen, im Ofen goldbraun mit Käse überbacken.',
  'Gerollte Tortilla reich gefüllt mit würzigem Fleisch und Bohnen, im Ofen goldbraun mit Käse überbacken.',
  'Große Weizentortilla, mariniertes Hähnchen, Bohnen, Reis, mit Käse überbacken',
  'Große Weizentortilla, mariniertes Hähnchen, Bohnen, Reis, mit Käse überbacken',
  'Überbacken',
  '{}',
  false,
  false,
  false,
  '{"single":10.5}',
  10.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'mex-enchiladas',
  '172',
  'mexikanisch',
  'Enchiladas Verduras',
  'Enchiladas Verduras',
  'Ofenüberbackene vegetarische Enchiladas in fruchtig-würziger Tomatensauce.',
  'Ofenüberbackene vegetarische Enchiladas in fruchtig-würziger Tomatensauce.',
  '2 gefüllte Tortillas, buntes mexikanisches Gemüse, Salsa, Käse überbacken',
  '2 gefüllte Tortillas, buntes mexikanisches Gemüse, Salsa, Käse überbacken',
  'Vegetarisch',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":9.5}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'mex-nachos',
  '173',
  'mexikanisch',
  'Nachos Grande überbacken',
  'Nachos Grande überbacken',
  'Heiß servierte Tortilla-Chips mit reichlich geschmolzenem Käse und Dips.',
  'Heiß servierte Tortilla-Chips mit reichlich geschmolzenem Käse und Dips.',
  'Knusprige Tortilla-Chips, Gouda & Cheddar, Jalapeños, Guacamole & Salsa',
  'Knusprige Tortilla-Chips, Gouda & Cheddar, Jalapeños, Guacamole & Salsa',
  'Snack',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":6.9}',
  6.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'asia-gebratene-nudeln-haehnchen',
  '180',
  'chinesisch',
  'Gebratene Nudeln mit Hähnchen',
  'Gebratene Nudeln mit Hähnchen',
  'Traditionell im Wok geschwenkte Nudeln mit feinem Knackgemüse und Hähnchen.',
  'Traditionell im Wok geschwenkte Nudeln mit feinem Knackgemüse und Hähnchen.',
  'Eiernudeln, zarte Hähnchenbrust, Sojasprossen, Gemüse, Sojasauce',
  'Eiernudeln, zarte Hähnchenbrust, Sojasprossen, Gemüse, Sojasauce',
  'Wok-Hit',
  '{}',
  false,
  false,
  false,
  '{"single":9.5}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'asia-gebratener-reis-haehnchen',
  '181',
  'chinesisch',
  'Gebratener Eierreis mit Hähnchen',
  'Gebratener Eierreis mit Hähnchen',
  'Klassischer gebratener Reis im Wok zubereitet mit saftigem Hähnchen.',
  'Klassischer gebratener Reis im Wok zubereitet mit saftigem Hähnchen.',
  'Duftreis, gebratenes Ei, Hähnchenfilet, Erbsen, Karotten, Röstzwiebeln',
  'Duftreis, gebratenes Ei, Hähnchenfilet, Erbsen, Karotten, Röstzwiebeln',
  'Klassiker',
  '{}',
  false,
  false,
  false,
  '{"single":9.5}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'asia-chop-suey',
  '182',
  'chinesisch',
  'Hähnchen Chop Suey',
  'Hähnchen Chop Suey',
  'Knackig frisches Pfannengemüse mit Hähnchen in aromatischer Sojasauce.',
  'Knackig frisches Pfannengemüse mit Hähnchen in aromatischer Sojasauce.',
  'Hähnchenbrust, Bambus, Paprika, Morcheln, dunkle Woksauce, Basmatireis',
  'Hähnchenbrust, Bambus, Paprika, Morcheln, dunkle Woksauce, Basmatireis',
  'Aus dem Wok',
  '{}',
  false,
  false,
  false,
  '{"single":10.5}',
  10.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'asia-ente-suess-sauer',
  '183',
  'chinesisch',
  'Knusprige Ente Süß-Sauer',
  'Knusprige Ente Süß-Sauer',
  'Knusprig tranchierte Entenbrust serviert mit fruchtiger Süß-Sauer-Sauce und Reis.',
  'Knusprig tranchierte Entenbrust serviert mit fruchtiger Süß-Sauer-Sauce und Reis.',
  'Kross gebackene Ente, Ananas, Paprika, hausgemachte Süß-Sauer-Sauce, Basmatireis',
  'Kross gebackene Ente, Ananas, Paprika, hausgemachte Süß-Sauer-Sauce, Basmatireis',
  'Knusprig',
  '{}',
  false,
  false,
  false,
  '{"single":13.5}',
  13.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'beilage-pommes',
  '190',
  'beilagen',
  'Große Portion Pommes Frites',
  'Große Portion Pommes Frites',
  'Extragroße Portion krosse Pommes Frites.',
  'Extragroße Portion krosse Pommes Frites.',
  'Knusprig goldgelbe Pommes mit Ketchup oder Mayonnaise',
  'Knusprig goldgelbe Pommes mit Ketchup oder Mayonnaise',
  'Knusprig',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":3.5}',
  3.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'beilage-kroketten',
  '191',
  'beilagen',
  'Portion Kroketten (8 Stk.)',
  'Portion Kroketten (8 Stk.)',
  'Feine Kartoffelkroketten außen knusprig, innen cremig.',
  'Feine Kartoffelkroketten außen knusprig, innen cremig.',
  '8 goldbraun panierte Kartoffelkroketten',
  '8 goldbraun panierte Kartoffelkroketten',
  '',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":3.5}',
  3.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'beilage-knoblauchbrot',
  '192',
  'beilagen',
  'Knoblauchbrot (4 Scheiben)',
  'Knoblauchbrot (4 Scheiben)',
  'Ofenfrisch geröstetes Brot mit aromatischer Kräuter-Knoblauchbutter.',
  'Ofenfrisch geröstetes Brot mit aromatischer Kräuter-Knoblauchbutter.',
  'Geröstetes Baguette, frische Knoblauch-Kräuterbutter',
  'Geröstetes Baguette, frische Knoblauch-Kräuterbutter',
  'Ofenfrisch',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":3}',
  3,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'beilage-zaziki',
  '193',
  'beilagen',
  'Hausgemachter Zaziki',
  'Hausgemachter Zaziki',
  'Cremiger, frischer Zaziki nach traditionellem Hausrezept.',
  'Cremiger, frischer Zaziki nach traditionellem Hausrezept.',
  'Griechischer Joghurt, Gurken, feiner Knoblauch, Olivenöl',
  'Griechischer Joghurt, Gurken, feiner Knoblauch, Olivenöl',
  'Hausgemacht',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":3.5}',
  3.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'toast-hawaii',
  '200',
  'toasts',
  'Toast Hawaii',
  'Toast Hawaii',
  'Der legendäre Klassiker: Toast belegt mit Schinken und Ananas, saftig mit Käse überbacken.',
  'Der legendäre Klassiker: Toast belegt mit Schinken und Ananas, saftig mit Käse überbacken.',
  'Toastbrot, Formfleisch-Schinken, Ananas, mit feinem Gouda überbacken',
  'Toastbrot, Formfleisch-Schinken, Ananas, mit feinem Gouda überbacken',
  'Klassiker',
  '{}',
  false,
  false,
  false,
  '{"single":6.5}',
  6.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'toast-american',
  '201',
  'toasts',
  'Toast American',
  'Toast American',
  'Herzhafter Ofentoast reich belegt mit Salami, Schinken und geschmolzenem Käse.',
  'Herzhafter Ofentoast reich belegt mit Salami, Schinken und geschmolzenem Käse.',
  'Toastbrot, Salami, Schinken, Zwiebeln, würziger Käse überbacken',
  'Toastbrot, Salami, Schinken, Zwiebeln, würziger Käse überbacken',
  'Herzhaft',
  '{}',
  false,
  false,
  false,
  '{"single":6.9}',
  6.9,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'toast-schnitzel',
  '202',
  'toasts',
  'Schnitzel-Toast Spezial',
  'Schnitzel-Toast Spezial',
  'Deftiger Toast belegt mit einem zarten Schnitzel und goldener Sauce Hollandaise.',
  'Deftiger Toast belegt mit einem zarten Schnitzel und goldener Sauce Hollandaise.',
  'Toastbrot, kleines paniertes Schweineschnitzel, Sauce Hollandaise, Käse überbacken',
  'Toastbrot, kleines paniertes Schweineschnitzel, Sauce Hollandaise, Käse überbacken',
  'Empfehlung',
  '{}',
  false,
  false,
  false,
  '{"single":7.5}',
  7.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'omelette-natur',
  '210',
  'omelette',
  'Omelette Natur mit Käse überbacken',
  'Omelette Natur mit Käse überbacken',
  'Fluffiges Pfannenomelette aus frischen Eiern, im Ofen mit goldbraunem Käse überbacken.',
  'Fluffiges Pfannenomelette aus frischen Eiern, im Ofen mit goldbraunem Käse überbacken.',
  '3 frische Eier, Kräuter, mit feinem Gouda überbacken, dazu Pommes & Salat',
  '3 frische Eier, Kräuter, mit feinem Gouda überbacken, dazu Pommes & Salat',
  'Vegetarisch',
  ARRAY['vegetarisch'],
  false,
  false,
  false,
  '{"single":7.5}',
  7.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'omelette-schinken-pilze',
  '211',
  'omelette',
  'Omelette Schinken & Champignons überbacken',
  'Omelette Schinken & Champignons überbacken',
  'Herzhaftes Omelette mit saftigem Schinken und Waldpilzen unter einer Käsekruste.',
  'Herzhaftes Omelette mit saftigem Schinken und Waldpilzen unter einer Käsekruste.',
  '3 Eier, Formfleisch-Schinken, frische Champignons, mit Käse überbacken, Pommes',
  '3 Eier, Formfleisch-Schinken, frische Champignons, mit Käse überbacken, Pommes',
  'Sehr beliebt',
  '{}',
  false,
  false,
  false,
  '{"single":8.5}',
  8.5,
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
  supports_american = EXCLUDED.supports_american;
INSERT INTO menu_items (
  id, number, category_id, name_de, name_en, desc_de, desc_en, toppings_de, toppings_en, badge,
  dietary, sizes_available, calzone_sizes, supports_american, prices, price, is_in_stock, stock_quantity, preparation_time_minutes
) VALUES (
  'omelette-krabben',
  '212',
  'omelette',
  'Omelette Krabben überbacken',
  'Omelette Krabben überbacken',
  'Mediterranes Eier-Omelette gefüllt mit zarten Meereskrabben und Käse überbacken.',
  'Mediterranes Eier-Omelette gefüllt mit zarten Meereskrabben und Käse überbacken.',
  '3 Eier, feine Krabben, Knoblauch, Zwiebeln, mit Käse überbacken, Pommes',
  '3 Eier, feine Krabben, Knoblauch, Zwiebeln, mit Käse überbacken, Pommes',
  'Spezialität',
  ARRAY['pescetarisch'],
  false,
  false,
  false,
  '{"single":9.5}',
  9.5,
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
  supports_american = EXCLUDED.supports_american;
