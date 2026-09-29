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

-- 9b. SMTP Email Configuration Table (Private to backend & admin)
CREATE TABLE IF NOT EXISTS smtp_settings (
  id INT PRIMARY KEY DEFAULT 1,
  host TEXT NOT NULL DEFAULT 'smtp.stackmail.com',
  port INT NOT NULL DEFAULT 465,
  secure BOOLEAN NOT NULL DEFAULT true,
  sender_email TEXT NOT NULL DEFAULT 'info@veneziapizzas.de',
  sender_name TEXT NOT NULL DEFAULT 'Venezia Pizza Service',
  auth_user TEXT NOT NULL DEFAULT 'info@veneziapizzas.de',
  auth_password TEXT NOT NULL DEFAULT '',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9c. SumUp Payment Configuration & Transactions Table
CREATE TABLE IF NOT EXISTS sumup_settings (
  id INT PRIMARY KEY DEFAULT 1,
  merchant_code TEXT NOT NULL DEFAULT 'MVV82Y2M',
  pay_to_email TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'EUR',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  payment_gateway TEXT NOT NULL DEFAULT 'sumup', -- 'sumup', 'sumup_terminal', 'cash', 'paypal'
  payment_type TEXT DEFAULT 'online_card', -- 'online_card', 'terminal_delivery', 'cash', 'paypal'
  transaction_reference TEXT,
  sumup_checkout_id TEXT,
  amount NUMERIC(8,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  raw_response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Indexes for fast real-time queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_menu_items_cat ON menu_items(category_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_checkout ON payment_transactions(sumup_checkout_id);

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

-- 13. Customer Account Email Verification RPC (Security Definer)
CREATE OR REPLACE FUNCTION check_customer_email_exists(lookup_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_found boolean := false;
  v_name text := '';
  v_phone text := '';
  v_street text := '';
  v_zip_city text := '';
BEGIN
  -- 1. Check in auth.users
  SELECT 
    true,
    COALESCE(raw_user_meta_data->>'full_name', ''),
    COALESCE(raw_user_meta_data->>'phone', ''),
    COALESCE(raw_user_meta_data->>'street', ''),
    COALESCE(raw_user_meta_data->>'zip_city', '')
  INTO v_found, v_name, v_phone, v_street, v_zip_city
  FROM auth.users
  WHERE lower(email) = lower(trim(lookup_email))
  LIMIT 1;

  IF v_found THEN
    RETURN jsonb_build_object(
      'exists', true,
      'full_name', v_name,
      'phone', v_phone,
      'street', v_street,
      'zip_city', v_zip_city
    );
  END IF;

  -- 2. Check in orders table (note pattern [E-Mail: ...])
  SELECT 
    true,
    COALESCE(customer_name, ''),
    COALESCE(customer_phone, ''),
    COALESCE(street, ''),
    COALESCE(zip_city, '')
  INTO v_found, v_name, v_phone, v_street, v_zip_city
  FROM orders
  WHERE note ILIKE '%' || lower(trim(lookup_email)) || '%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_found THEN
    RETURN jsonb_build_object(
      'exists', true,
      'full_name', v_name,
      'phone', v_phone,
      'street', v_street,
      'zip_city', v_zip_city
    );
  END IF;

  RETURN jsonb_build_object('exists', false);
END;
$$;

GRANT EXECUTE ON FUNCTION check_customer_email_exists(text) TO anon, authenticated;

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
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('all', 'Alle Gerichte', 'All Dishes', '70+ Spezialitäten', 1) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('pizza', 'Pizzen (1–49a)', 'Pizzas (1–49a)', '45+ Sorten', 2) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('calzone', 'Calzone & Pizzabrot', 'Calzone & Pizza Bread', '5 Variationen', 3) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('pasta', 'Pasta & Al Forno', 'Pasta & Al Forno', '18 Gerichte', 4) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('doner', 'Döner & Fleisch', 'Döner & Meat Specialties', '12 Spezialitäten', 5) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('burger-snacks', 'Burger & Snacks', 'Burgers & Snacks', '14 Leckereien', 6) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('schnitzel', 'Schnitzel Spezial', 'Schnitzel Specials', '8 Variationen', 7) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('salad', 'Frische Salate', 'Fresh Salads', '10 Salate', 8) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;
INSERT INTO categories (id, name_de, name_en, count_badge, sort_order) VALUES ('dessert-drinks', 'Desserts & Getränke', 'Desserts & Drinks', '12 Erfrischungen', 9) ON CONFLICT (id) DO UPDATE SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en;

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

-- Menu Items (74 dishes)
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
  'pasta-rigatoni-forno',
  '50',
  'pasta',
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
  'pasta-lasagne',
  '53',
  'pasta',
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
  'doner-teller',
  '60',
  'doner',
  'Dönerteller Komplett mit Beilage',
  'Dönerteller Komplett mit Beilage',
  'Zartes Drehspießfleisch serviert mit Pommes oder Reis, frischem Salat und Saucen.',
  'Zartes Drehspießfleisch serviert mit Pommes oder Reis, frischem Salat und Saucen.',
  'Drehspießfleisch, Pommes/Reis, Salat, Knoblauch- & Kräutersauce',
  'Drehspießfleisch, Pommes/Reis, Salat, Knoblauch- & Kräutersauce',
  'Bestseller',
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
  '61',
  'doner',
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
  '62',
  'doner',
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
  'burger-snacks',
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
  'burger-snacks',
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
  'schnitzel',
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
  'schnitzel',
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
  'salad-venezia',
  '90',
  'salad',
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
  'salad',
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
  'dessert-drinks',
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
  'dessert-drinks',
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
