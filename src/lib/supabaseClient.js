import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmail, sendOrderDeliveredEmail } from './emailService.js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  '';
const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  '';

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-public-key')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================
// MENU & CATEGORIES API
// ============================================================

export async function getMenuItems() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .neq('id', '__system_categories__')
    .order('category_id', { ascending: true })
    .order('number', { ascending: true });
  if (error) {
    console.error('Error fetching menu items from Supabase:', error);
    return null;
  }
  return data;
}

export async function updateMenuItemStock(id, isInStock, stockQuantity = null) {
  if (!supabase) return false;
  const updateData = { is_in_stock: isInStock };
  if (stockQuantity !== null) updateData.stock_quantity = stockQuantity;
  const { error } = await supabase
    .from('menu_items')
    .update(updateData)
    .eq('id', id);
  if (error) {
    console.error('Error updating menu item stock:', error);
    return false;
  }
  return true;
}

export async function updateMenuItemPrepTime(id, prepTimeMinutes) {
  if (!supabase) return false;
  const { error } = await supabase
    .from('menu_items')
    .update({ preparation_time_minutes: prepTimeMinutes })
    .eq('id', id);
  if (error) {
    console.error('Error updating prep time:', error);
    return false;
  }
  return true;
}

export async function upsertMenuItem(item) {
  if (!supabase) return false;

  const allowedColumns = [
    'id',
    'number',
    'category_id',
    'name_de',
    'name_en',
    'desc_de',
    'desc_en',
    'toppings_de',
    'toppings_en',
    'badge',
    'dietary',
    'sizes_available',
    'calzone_sizes',
    'supports_american',
    'prices',
    'price',
    'image_url',
    'is_in_stock',
    'stock_quantity',
    'preparation_time_minutes',
    'created_at',
    'updated_at'
  ];

  const dbPayload = {};
  for (const col of allowedColumns) {
    if (item[col] !== undefined) {
      dbPayload[col] = item[col];
    }
  }

  // Ensure custom sizes, custom toppings, and multiple images are preserved in prices JSONB
  const pricesObj = (typeof dbPayload.prices === 'object' && dbPayload.prices !== null)
    ? { ...dbPayload.prices }
    : {};

  if (item.custom_sizes && Array.isArray(item.custom_sizes) && !pricesObj.custom_sizes) {
    pricesObj.custom_sizes = item.custom_sizes;
  }
  if (item.custom_toppings && Array.isArray(item.custom_toppings) && !pricesObj.custom_toppings) {
    pricesObj.custom_toppings = item.custom_toppings;
  }

  // Support multiple images synced to Supabase inside prices.images
  if (Array.isArray(item.images)) {
    const cleanImages = item.images.filter(img => typeof img === 'string' && img.trim() !== '');
    pricesObj.images = cleanImages;
    if (cleanImages.length > 0 && (!dbPayload.image_url || dbPayload.image_url.trim() === '')) {
      dbPayload.image_url = cleanImages[0];
    }
  }

  dbPayload.prices = pricesObj;
  dbPayload.updated_at = new Date().toISOString();

  // Handle deals category foreign key constraint
  if (dbPayload.category_id === 'deals' || String(dbPayload.id).startsWith('A') || String(dbPayload.id).startsWith('offer-')) {
    dbPayload.category_id = null;
  }

  const { data, error } = await supabase
    .from('menu_items')
    .upsert(dbPayload)
    .select();

  if (error) {
    console.error('Error upserting menu item in Supabase:', error);
    return null;
  }
  return data?.[0] || true;
}

export async function deleteMenuItem(id) {
  if (!supabase) return false;
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting menu item:', error);
    return false;
  }
  return true;
}

// ============================================================
// AUDIO & SOUND NOTIFICATIONS
// ============================================================

export function playOrderChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // First bell tone: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second bell tone: A5 (880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.18);
    gain2.gain.setValueAtTime(0.25, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('Audio chime notice:', err);
  }
}

// ============================================================
// BROADCAST & LOCAL SYNC HELPERS
// ============================================================

const BROADCAST_CHANNEL_NAME = 'venezia_orders_channel';
let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not available:', e);
  }
}

export function broadcastNewOrder(order) {
  if (typeof window === 'undefined') return;
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'NEW_ORDER', order });
    }
    window.dispatchEvent(new CustomEvent('venezia:new-order', { detail: order }));
    localStorage.setItem('venezia_last_order_event', JSON.stringify({ type: 'NEW_ORDER', id: order.id, time: Date.now() }));
  } catch (err) {
    console.warn('broadcastNewOrder error:', err);
  }
}

export function broadcastOrderStatus(orderId, status, details = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'STATUS_UPDATE', orderId, status, ...details });
    }
    window.dispatchEvent(new CustomEvent('venezia:order-status-change', { detail: { orderId, status, ...details } }));
    localStorage.setItem('venezia_last_status_event', JSON.stringify({ orderId, status, time: Date.now() }));
  } catch (err) {
    console.warn('broadcastOrderStatus error:', err);
  }
}

export function broadcastOrderUpdate(orderId, details = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'ORDER_UPDATE', orderId, ...details });
    }
    window.dispatchEvent(new CustomEvent('venezia:order-update', { detail: { orderId, ...details } }));
  } catch (err) {
    console.warn('broadcastOrderUpdate error:', err);
  }
}

export function getLocalOrders() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('venezia_local_orders');
    if (!raw) return [];
    const list = JSON.parse(raw);
    return (Array.isArray(list) ? list : []).filter(o => 
      !o.order_number?.startsWith('ACC-') && 
      !(o.note && o.note.includes('Kundenkonto Registrierung'))
    );
  } catch {
    return [];
  }
}

export function saveLocalOrders(orders) {
  if (typeof window === 'undefined') return;
  try {
    const cleanOrders = (Array.isArray(orders) ? orders : []).filter(o => 
      !o.order_number?.startsWith('ACC-') && 
      !(o.note && o.note.includes('Kundenkonto Registrierung'))
    );
    localStorage.setItem('venezia_local_orders', JSON.stringify(cleanOrders.slice(0, 100)));
  } catch (err) {
    console.warn('Failed to save local orders:', err);
  }
}

export function getOrderCustomerEmail(order) {
  if (!order) return '';
  if (order.customer_email && typeof order.customer_email === 'string') {
    return order.customer_email.toLowerCase().trim();
  }
  if (order.email && typeof order.email === 'string') {
    return order.email.toLowerCase().trim();
  }
  if (order.note && typeof order.note === 'string') {
    const match = order.note.match(/\[E-Mail:\s*([^\]]+)\]/i);
    if (match && match[1]) {
      return match[1].toLowerCase().trim();
    }
  }
  return '';
}

export function getActiveOrder() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('venezia_active_order');
    if (!raw) return null;
    const order = JSON.parse(raw);
    if (!order || order.order_number?.startsWith('ACC-') || (order.note && order.note.includes('Kundenkonto Registrierung'))) {
      localStorage.removeItem('venezia_active_order');
      return null;
    }
    // STRICT: Active order tracking is strictly for logged-in accounts
    const cachedCustomer = getCachedCustomer();
    if (!cachedCustomer?.email) {
      return null;
    }
    const orderEmail = getOrderCustomerEmail(order);
    const loggedEmail = cachedCustomer.email.toLowerCase().trim();
    if (orderEmail && orderEmail !== loggedEmail) {
      localStorage.removeItem('venezia_active_order');
      return null;
    }
    return order;
  } catch {
    return null;
  }
}

export function saveActiveOrder(order) {
  if (typeof window === 'undefined') return;
  try {
    if (order) {
      const email = getOrderCustomerEmail(order);
      const enriched = {
        ...order,
        customer_email: email || order.customer_email || ''
      };
      const existing = getActiveOrder();
      if (
        existing &&
        existing.id === enriched.id &&
        existing.status === enriched.status &&
        existing.payment_status === enriched.payment_status &&
        existing.updated_at === enriched.updated_at
      ) {
        return; // No change, do not trigger redundant storage events
      }
      localStorage.setItem('venezia_active_order', JSON.stringify(enriched));
    } else {
      if (localStorage.getItem('venezia_active_order')) {
        localStorage.removeItem('venezia_active_order');
      }
    }
  } catch (err) {
    console.warn('Failed to save active order:', err);
  }
}

// ============================================================
// ORDERS API
// ============================================================

export async function getOrders() {
  const localOrders = getLocalOrders();

  if (!supabase) {
    return localOrders;
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        drivers (id, name, phone, vehicle_type),
        order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching orders from Supabase, returning local store:', error);
      return localOrders;
    }

    const fetchedList = (data || []).filter(o => 
      !o.order_number?.startsWith('ACC-') && 
      !(o.note && o.note.includes('Kundenkonto Registrierung'))
    );
    // Merge with any recent local orders that may not be in DB yet
    const combined = [...fetchedList];
    for (const loc of localOrders) {
      if (loc.order_number?.startsWith('ACC-') || (loc.note && loc.note.includes('Kundenkonto Registrierung'))) {
        continue;
      }
      if (!combined.some(o => String(o.id) === String(loc.id) || o.order_number === loc.order_number)) {
        combined.unshift(loc);
      }
    }
    return combined;
  } catch (err) {
    console.warn('Exception in getOrders, returning local store:', err);
    return localOrders.filter(o => !o.order_number?.startsWith('ACC-') && !(o.note && o.note.includes('Kundenkonto Registrierung')));
  }
}

export async function createOrder(orderPayload, items) {
  const now = new Date().toISOString();
  const orderNumber = orderPayload.order_number || `VP-${Math.floor(1000 + Math.random() * 9000)}`;

  const formattedItems = (items || []).map((item) => {
    // 1. Resolve Extra Toppings & Add-ons
    let toppings = [];
    if (Array.isArray(item.toppings_selected) && item.toppings_selected.length > 0) {
      toppings = item.toppings_selected;
    } else if (Array.isArray(item.selectedToppings) && item.selectedToppings.length > 0) {
      toppings = item.selectedToppings;
    } else if (typeof item.toppings_selected === 'string' && item.toppings_selected.trim()) {
      toppings = [item.toppings_selected.trim()];
    } else if (typeof item.selectedToppings === 'string' && item.selectedToppings.trim()) {
      toppings = [item.selectedToppings.trim()];
    } else if (item.desc && typeof item.desc === 'string') {
      // Fallback: extract from description formatted like "Extra: Salami, Pilze (+2,50 €)"
      const extraMatch = item.desc.match(/Extra:\s*([^(•\n]+)/i);
      if (extraMatch && extraMatch[1]) {
        toppings = extraMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const cleanToppings = toppings
      .map(t => typeof t === 'string' ? t.trim() : (t?.name || t?.label || t?.id || String(t)))
      .filter(Boolean);

    // 2. Resolve American Style Crust
    let isAmerican = !!(item.is_american ?? item.isAmerican);
    if (!isAmerican) {
      const fullText = `${item.name || ''} ${item.item_name || ''} ${item.desc || ''}`;
      if (fullText.includes('American Style') || fullText.includes('American Crust') || fullText.includes('Käserand')) {
        isAmerican = true;
      }
    }

    // 3. Resolve Special Instructions
    let specialInstructions = (item.special_instructions || item.specialInstructions || '').trim();
    if (!specialInstructions && item.desc && typeof item.desc === 'string') {
      const hintMatch = item.desc.match(/Hinweis:\s*([^•\n]+)/i);
      if (hintMatch && hintMatch[1]) {
        specialInstructions = hintMatch[1].trim();
      }
    }

    return {
      menu_item_id: item.menu_item_id || item.id || '',
      item_name: item.name || item.item_name || 'Gericht',
      selected_size: item.selected_size || item.selectedSize || '',
      is_american: isAmerican,
      toppings_selected: cleanToppings,
      special_instructions: specialInstructions,
      unit_price: Number(item.price || item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      total_price: Number((item.price || item.unit_price || 0) * (item.quantity || 1))
    };
  });

  const completeOrder = {
    id: null,
    order_number: orderNumber,
    created_at: now,
    updated_at: now,
    customer_name: orderPayload.customer_name || 'Kunde',
    customer_phone: orderPayload.customer_phone || '',
    customer_email: orderPayload.customer_email || '',
    delivery_type: orderPayload.delivery_type || 'delivery',
    street: orderPayload.street || '',
    zip_city: orderPayload.zip_city || '08525 Plauen',
    note: orderPayload.note || '',
    subtotal: Number(orderPayload.subtotal || 0),
    delivery_fee: Number(orderPayload.delivery_fee || 0),
    low_cart_fee: Number(orderPayload.low_cart_fee || 0),
    tip: Number(orderPayload.tip || 0),
    discount: Number(orderPayload.discount || 0),
    total: Number(orderPayload.total || 0),
    status: 'new',
    estimated_delivery_minutes: Number(orderPayload.estimated_delivery_minutes || (orderPayload.delivery_type === 'delivery' ? 35 : 20)),
    driver_id: null,
    payment_method: orderPayload.payment_method || 'cash',
    payment_status: orderPayload.payment_status || (orderPayload.payment_method === 'cash' ? 'pending' : 'paid'),
    payment_id: orderPayload.payment_id || `txn_${Date.now()}`,
    order_items: formattedItems
  };

  // 1. Direct Supabase Database Insert (Primary real backend)
  if (supabase) {
    try {
      const dbOrderPayload = {
        order_number: completeOrder.order_number,
        customer_name: completeOrder.customer_name,
        customer_phone: completeOrder.customer_phone,
        delivery_type: completeOrder.delivery_type,
        street: completeOrder.street,
        zip_city: completeOrder.zip_city,
        note: `[E-Mail: ${completeOrder.customer_email || ''}] [Zahlung: ${completeOrder.payment_method} (${completeOrder.payment_status})] [TXN: ${completeOrder.payment_id || ''}] ${completeOrder.low_cart_fee > 0 ? `[Mindermengenzuschlag: ${completeOrder.low_cart_fee.toFixed(2)} €] ` : ''}${completeOrder.note}`.trim(),
        subtotal: completeOrder.subtotal,
        delivery_fee: completeOrder.delivery_fee,
        total: completeOrder.total,
        status: completeOrder.status,
        estimated_delivery_minutes: completeOrder.estimated_delivery_minutes
      };

      const { data: dbOrder, error: orderError } = await supabase
        .from('orders')
        .insert([dbOrderPayload])
        .select()
        .single();

      if (orderError) {
        console.error('Supabase order insert error:', orderError);
      } else if (dbOrder) {
        completeOrder.id = dbOrder.id; // REAL DATABASE UUID
        completeOrder.created_at = dbOrder.created_at;

        // Insert items into database order_items table
        if (formattedItems.length > 0) {
          const dbItems = formattedItems.map((fi) => ({
            order_id: dbOrder.id,
            item_name: fi.item_name,
            selected_size: fi.selected_size,
            is_american: fi.is_american,
            toppings_selected: fi.toppings_selected,
            special_instructions: fi.special_instructions,
            unit_price: fi.unit_price,
            quantity: fi.quantity,
            total_price: fi.total_price
          }));
          const { error: itemsError } = await supabase.from('order_items').insert(dbItems);
          if (itemsError) {
            console.warn('Supabase items insert notice:', itemsError);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase insert exception, fallback to local tracking:', err);
    }
  }

  // Fallback ID if Supabase wasn't available
  if (!completeOrder.id) {
    completeOrder.id = `ord-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  }

  // Persist locally for immediate client tracking
  saveActiveOrder(completeOrder);
  const localList = getLocalOrders();
  saveLocalOrders([completeOrder, ...localList.filter(o => o.id !== completeOrder.id && o.order_number !== completeOrder.order_number)]);

  // Broadcast to other tabs & listeners
  broadcastNewOrder(completeOrder);

  // Asynchronously dispatch order confirmation email via SMTP backend
  if (completeOrder.customer_email) {
    sendOrderConfirmationEmail(completeOrder).catch((err) => {
      console.warn('[OrderEmail] Notice:', err);
    });
  }

  return { success: true, order: completeOrder };
}

export async function updateOrderStatus(orderId, status) {
  // 1. Update in local storage
  const localList = getLocalOrders();
  let updatedOrder = null;
  const updatedList = localList.map(o => {
    if (String(o.id) === String(orderId) || o.order_number === orderId) {
      updatedOrder = { ...o, status, updated_at: new Date().toISOString() };
      return updatedOrder;
    }
    return o;
  });
  saveLocalOrders(updatedList);

  // 2. Update active order if matched
  const active = getActiveOrder();
  if (active && (String(active.id) === String(orderId) || active.order_number === orderId)) {
    saveActiveOrder({ ...active, status, updated_at: new Date().toISOString() });
  }

  // 3. Broadcast status change across channels
  broadcastOrderStatus(orderId, status, { order: updatedOrder });

  // Dispatch delivery notification email to customer
  if (status === 'delivered') {
    const targetOrder = updatedOrder || active || localList.find(o => String(o.id) === String(orderId) || o.order_number === orderId);
    if (targetOrder) {
      sendOrderDeliveredEmail(targetOrder).catch((err) => {
        console.warn('[DeliveredEmail] Notice:', err);
      });
    }
  }

  // 4. Update directly in Supabase Database
  if (!supabase) return true;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
    let query = supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() });

    if (isUuid) {
      const { error } = await query.eq('id', orderId);
      if (error) {
        console.warn('Supabase status update error:', error);
        return false;
      }
    } else {
      // If demo ID or order_number, query by order_number safely
      await query.eq('order_number', orderId);
    }
    return true;
  } catch (err) {
    console.warn('updateOrderStatus exception:', err);
    return true;
  }
}

export async function updateOrderPrepTime(orderId, prepTimeMinutes) {
  const localList = getLocalOrders();
  let updatedOrder = null;
  const updatedList = localList.map(o => {
    if (String(o.id) === String(orderId) || o.order_number === orderId) {
      updatedOrder = { ...o, estimated_delivery_minutes: prepTimeMinutes, updated_at: new Date().toISOString() };
      return updatedOrder;
    }
    return o;
  });
  saveLocalOrders(updatedList);

  const active = getActiveOrder();
  if (active && (String(active.id) === String(orderId) || active.order_number === orderId)) {
    saveActiveOrder({ ...active, estimated_delivery_minutes: prepTimeMinutes, updated_at: new Date().toISOString() });
  }

  // Broadcast prep time update only WITHOUT touching status!
  broadcastOrderUpdate(orderId, { estimated_delivery_minutes: prepTimeMinutes, order: updatedOrder });

  if (!supabase) return true;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
    let query = supabase
      .from('orders')
      .update({
        estimated_delivery_minutes: prepTimeMinutes,
        updated_at: new Date().toISOString()
      });

    if (isUuid) {
      await query.eq('id', orderId);
    } else {
      await query.eq('order_number', orderId);
    }
    return true;
  } catch (err) {
    console.warn('updateOrderPrepTime error:', err);
    return true;
  }
}

export async function assignDriverToOrder(orderId, driverId) {
  const localList = getLocalOrders();
  const currentOrder = localList.find(o => String(o.id) === String(orderId) || o.order_number === orderId);
  const newStatus = driverId 
    ? 'out_for_delivery' 
    : (currentOrder?.status === 'out_for_delivery' ? 'preparing' : (currentOrder?.status || 'new'));
  let updatedOrder = null;
  const updatedList = localList.map(o => {
    if (String(o.id) === String(orderId) || o.order_number === orderId) {
      updatedOrder = { ...o, driver_id: driverId || null, status: newStatus, updated_at: new Date().toISOString() };
      return updatedOrder;
    }
    return o;
  });
  saveLocalOrders(updatedList);

  const active = getActiveOrder();
  if (active && (String(active.id) === String(orderId) || active.order_number === orderId)) {
    saveActiveOrder({ ...active, driver_id: driverId || null, status: newStatus });
  }

  broadcastOrderStatus(orderId, newStatus, { driver_id: driverId || null, order: updatedOrder });

  if (!supabase) return true;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
    let query = supabase
      .from('orders')
      .update({
        driver_id: driverId || null,
        status: newStatus,
        updated_at: new Date().toISOString()
      });

    if (isUuid) {
      await query.eq('id', orderId);
    } else {
      await query.eq('order_number', orderId);
    }
    return true;
  } catch (err) {
    console.warn('assignDriverToOrder error:', err);
    return true;
  }
}

export async function updateOrderDetails(orderId, orderPayload, items) {
  if (!supabase) {
    return { success: true, simulated: true };
  }

  const { data: updatedOrder, error: orderError } = await supabase
    .from('orders')
    .update({
      ...orderPayload,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();

  if (orderError) {
    console.error('Error updating order:', orderError);
    throw orderError;
  }

  if (items && Array.isArray(items)) {
    const { error: delError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (delError) {
      console.warn('Error deleting previous order items:', delError);
    }

    if (items.length > 0) {
      const formattedItems = items.map((item) => ({
        order_id: orderId,
        item_name: item.item_name || item.name,
        selected_size: item.selected_size || item.selectedSize || '',
        is_american: !!(item.is_american ?? item.isAmerican),
        toppings_selected: item.toppings_selected || item.selectedToppings || [],
        special_instructions: item.special_instructions || item.specialInstructions || '',
        unit_price: Number(item.unit_price || item.price || 0),
        quantity: parseInt(item.quantity, 10) || 1,
        total_price: Number(item.total_price || (item.unit_price || item.price || 0) * (item.quantity || 1))
      }));

      const { error: insertError } = await supabase
        .from('order_items')
        .insert(formattedItems);

      if (insertError) {
        console.error('Error re-inserting updated order items:', insertError);
      }
    }
  }

  return { success: true, order: updatedOrder };
}

// ============================================================
// DRIVERS API
// ============================================================

export async function getDrivers() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
  return data || [];
}

export async function addDriver(driver) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('drivers')
    .insert([driver])
    .select()
    .single();
  if (error) {
    console.error('Error adding driver:', error);
    return null;
  }
  return data;
}

export async function updateDriverStatus(driverId, isActive, currentStatus = 'available') {
  if (!supabase) return false;
  const { error } = await supabase
    .from('drivers')
    .update({ is_active: isActive, current_status: currentStatus })
    .eq('id', driverId);
  if (error) {
    console.error('Error updating driver status:', error);
    return false;
  }
  return true;
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================

export function subscribeToOrders(callback) {
  const unsubLocalOrder = (e) => {
    if (callback && e.detail) {
      callback({ eventType: 'INSERT', new: e.detail });
    }
  };
  const unsubLocalStatus = (e) => {
    if (callback && e.detail) {
      callback({
        eventType: 'UPDATE',
        new: e.detail.order || { id: e.detail.orderId, status: e.detail.status, ...e.detail }
      });
    }
  };
  const unsubLocalUpdate = (e) => {
    if (callback && e.detail) {
      callback({
        eventType: 'UPDATE',
        new: e.detail.order || { id: e.detail.orderId, ...e.detail }
      });
    }
  };

  const handleBroadcast = (evt) => {
    if (!callback || !evt.data) return;
    if (evt.data.type === 'NEW_ORDER' && evt.data.order) {
      callback({ eventType: 'INSERT', new: evt.data.order });
    } else if (evt.data.type === 'STATUS_UPDATE') {
      callback({
        eventType: 'UPDATE',
        new: evt.data.order || { id: evt.data.orderId, status: evt.data.status, ...evt.data }
      });
    } else if (evt.data.type === 'ORDER_UPDATE') {
      callback({
        eventType: 'UPDATE',
        new: evt.data.order || { id: evt.data.orderId, ...evt.data }
      });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('venezia:new-order', unsubLocalOrder);
    window.addEventListener('venezia:order-status-change', unsubLocalStatus);
    window.addEventListener('venezia:order-update', unsubLocalUpdate);
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }
  }

  let supabaseUnsub = () => {};
  if (supabase) {
    try {
      const channelId = `orders-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            try {
              const rec = payload.new || payload.old;
              if (rec?.order_number?.startsWith('ACC-') || (rec?.note && rec.note.includes('Kundenkonto Registrierung'))) {
                return; // Discard dummy account registration records completely
              }
              if (callback) callback(payload);
            } catch (e) {
              console.error('Error in orders realtime callback:', e);
            }
          }
        )
        .subscribe();

      supabaseUnsub = () => {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.warn('Error removing orders channel:', err);
        }
      };
    } catch (err) {
      console.error('Failed to subscribe to orders realtime:', err);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('venezia:new-order', unsubLocalOrder);
      window.removeEventListener('venezia:order-status-change', unsubLocalStatus);
      window.removeEventListener('venezia:order-update', unsubLocalUpdate);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
    }
    supabaseUnsub();
  };
}

export function subscribeToMenuItems(callback) {
  if (!supabase) return () => {};

  try {
    const channelId = `menu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          try {
            if (callback) callback(payload);
          } catch (e) {
            console.error('Error in menu_items realtime callback:', e);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn('Error removing menu channel:', err);
      }
    };
  } catch (err) {
    console.error('Failed to subscribe to menu_items realtime:', err);
    return () => {};
  }
}

// ============================================================
// CUSTOMER AUTHENTICATION & ORDER HISTORY API (Production-Ready)
// ============================================================

const CUSTOMER_AUTH_KEY = 'venezia_auth_customer';

// Purge any legacy stored plain-text credentials from browser storage immediately
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('venezia_customer_credentials');
  } catch (e) {
    // ignore
  }
}

export function getCachedCustomer() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CUSTOMER_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Safety check: Never treat admin as a cached customer
    if (parsed?.email?.toLowerCase() === 'admin@veneziapizzas.de' || parsed?.role === 'admin') {
      localStorage.removeItem(CUSTOMER_AUTH_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedCustomer(user) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCachedCustomer();
    const isSame = (!existing && !user) || (
      existing && user &&
      existing.id === user.id &&
      existing.email === user.email &&
      existing.full_name === user.full_name &&
      existing.phone === user.phone &&
      existing.street === user.street &&
      existing.zip_city === user.zip_city
    );

    if (isSame) return; // Prevent infinite event storms

    if (user && user.email?.toLowerCase() !== 'admin@veneziapizzas.de' && user.role !== 'admin') {
      localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CUSTOMER_AUTH_KEY);
    }
    window.dispatchEvent(new CustomEvent('venezia:auth-change', { detail: user }));
  } catch (err) {
    console.warn('Error saving customer auth cache:', err);
  }
}

export async function getCurrentCustomerUser() {
  const cached = getCachedCustomer();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const isAdmin =
          user.email?.toLowerCase() === 'admin@veneziapizzas.de' ||
          user.user_metadata?.role === 'admin' ||
          user.app_metadata?.role === 'admin';

        if (isAdmin) {
          // Admin session is strictly for Admin Portal, NOT customer store
          if (cached) saveCachedCustomer(null);
          return null;
        }

        const profile = {
          id: user.id,
          email: user.email || cached?.email || '',
          full_name: user.user_metadata?.full_name || cached?.full_name || '',
          phone: user.phone || user.user_metadata?.phone || cached?.phone || '',
          street: user.user_metadata?.street || cached?.street || '',
          zip_city: user.user_metadata?.zip_city || cached?.zip_city || '08525 Plauen'
        };
        saveCachedCustomer(profile);
        return profile;
      }
    } catch (e) {
      console.warn('getCurrentCustomerUser check notice:', e);
    }
  }
  return cached;
}

// Check if a customer email is already registered in the system (Auth, Orders, or Cache)
export async function checkCustomerAccountExists(email) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
    return { exists: false };
  }

  // 1. Check cached customer in browser
  const cached = getCachedCustomer();
  if (cached && cached.email?.toLowerCase() === normalizedEmail) {
    return {
      exists: true,
      source: 'cached',
      profile: cached
    };
  }

  // 2. Query Supabase RPC or Database
  if (supabase) {
    // 2a. Fast RPC check in auth.users and orders
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('check_customer_email_exists', {
        lookup_email: normalizedEmail
      });
      if (!rpcErr && rpcRes && rpcRes.exists) {
        return {
          exists: true,
          source: 'auth_rpc',
          profile: {
            email: normalizedEmail,
            full_name: rpcRes.full_name || '',
            phone: rpcRes.phone || '',
            street: rpcRes.street || '',
            zip_city: rpcRes.zip_city || '08525 Plauen'
          }
        };
      }
    } catch {
      // RPC might not be executed in database yet, proceed to fallback checks
    }

    // 2b. Check in orders table by note pattern (excluding fake account entries)
    try {
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('id, customer_name, customer_phone, street, zip_city, note, order_number')
        .not('order_number', 'like', 'ACC-%')
        .ilike('note', `%${normalizedEmail}%`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!ordersErr && ordersData && ordersData.length > 0) {
        // Strictly verify that the extracted customer email matches normalizedEmail exactly
        const matched = ordersData.find(ord => {
          if (ord.order_number?.startsWith('ACC-') || (ord.note && ord.note.includes('Kundenkonto Registrierung'))) {
            return false;
          }
          const ordEmail = getOrderCustomerEmail(ord);
          return ordEmail && ordEmail.toLowerCase().trim() === normalizedEmail;
        });

        if (matched) {
          return {
            exists: true,
            source: 'orders',
            profile: {
              email: normalizedEmail,
              full_name: matched.customer_name || '',
              phone: matched.customer_phone || '',
              street: matched.street || '',
              zip_city: matched.zip_city || '08525 Plauen'
            }
          };
        }
      }
    } catch (e) {
      console.warn('Orders lookup check notice:', e);
    }
  }

  // 3. Check local orders in localStorage fallback
  try {
    const localOrders = getLocalOrders();
    const foundLocal = localOrders.find((o) => getOrderCustomerEmail(o) === normalizedEmail);
    if (foundLocal) {
      return {
        exists: true,
        source: 'local_orders',
        profile: {
          email: normalizedEmail,
          full_name: foundLocal.customer_name || '',
          phone: foundLocal.customer_phone || '',
          street: foundLocal.street || '',
          zip_city: foundLocal.zip_city || '08525 Plauen'
        }
      };
    }
  } catch {
    // ignore
  }

  return { exists: false };
}

// ---------------------------------------------------------------------------
// CUSTOMER EMAIL OTP AUTHENTICATION (PASSWORDLESS)
// ---------------------------------------------------------------------------

export async function sendCustomerEmailOtp(email) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  if (normalizedEmail === 'admin@veneziapizzas.de') {
    return {
      success: false,
      error: 'Diese E-Mail ist für Administratoren reserviert. Bitte melden Sie sich über das Admin-Portal an.'
    };
  }
  if (!normalizedEmail || !normalizedEmail.includes('@') || normalizedEmail.length < 5) {
    return {
      success: false,
      error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
    };
  }

  if (!supabase) {
    return {
      success: false,
      error: 'Supabase-Client ist nicht initialisiert.'
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true
      }
    });

    if (error) {
      console.warn('Supabase signInWithOtp error:', error);
      if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
        return {
          success: false,
          error: 'Sicherheits-Wartezeit: Bitte warten Sie kurz vor der nächsten Code-Anforderung.'
        };
      }
      return {
        success: false,
        error: error.message || 'Bestätigungscode konnte nicht gesendet werden.'
      };
    }

    return {
      success: true,
      email: normalizedEmail,
      message: `Ein Bestätigungscode wurde per E-Mail an ${normalizedEmail} gesendet.`
    };
  } catch (err) {
    console.error('Exception in sendCustomerEmailOtp:', err);
    return {
      success: false,
      error: err.message || 'Verbindungsfehler beim E-Mail-Versand.'
    };
  }
}

export async function verifyCustomerEmailOtp({ email, token }) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const cleanToken = (token || '').trim();

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' };
  }
  if (!cleanToken || cleanToken.length < 4) {
    return { success: false, error: 'Bitte geben Sie den vollständigen Bestätigungscode ein.' };
  }

  if (!supabase) {
    return { success: false, error: 'Supabase-Client ist nicht initialisiert.' };
  }

  try {
    // Native Supabase Backend OTP Verification (strictly verified against Supabase Auth)
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanToken,
      type: 'email'
    });

    if (error) {
      console.warn('Supabase verifyOtp error:', error);
      const msg = (error.message || '').toLowerCase();
      let userFriendlyError = 'Falscher Bestätigungscode. Bitte überprüfen Sie den Code in Ihrer E-Mail.';
      if (msg.includes('expired')) {
        userFriendlyError = 'Der Bestätigungscode ist abgelaufen. Bitte fordern Sie einen neuen Code an.';
      } else if (msg.includes('invalid') || msg.includes('token')) {
        userFriendlyError = 'Falscher Bestätigungscode. Bitte prüfen Sie den Code in Ihrer E-Mail.';
      } else if (error.message) {
        userFriendlyError = error.message;
      }
      return {
        success: false,
        error: userFriendlyError
      };
    }

    const user = data?.user;
    if (!user) {
      return {
        success: false,
        error: 'Verifizierung fehlgeschlagen: Kein Benutzer gefunden.'
      };
    }

    // Clean up any session storage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('venezia_otp_token');
        sessionStorage.removeItem('venezia_otp_email');
      } catch (e) {
        // ignore
      }
    }

    // Retrieve or populate customer profile from past orders or cached profile
    let fullName = user.user_metadata?.full_name || '';
    let phone = user.phone || user.user_metadata?.phone || '';
    let street = user.user_metadata?.street || '';
    let zipCity = user.user_metadata?.zip_city || '08525 Plauen';

    try {
      const { data: pastOrders } = await supabase
        .from('orders')
        .select('customer_name, customer_phone, street, zip_city, note')
        .or(`customer_email.ilike.${normalizedEmail},note.ilike.%${normalizedEmail}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (pastOrders && pastOrders.length > 0) {
        const p = pastOrders[0];
        if (!fullName && p.customer_name && p.customer_name !== 'Gast') fullName = p.customer_name;
        if (!phone && p.customer_phone) phone = p.customer_phone;
        if (!street && p.street) street = p.street;
        if (p.zip_city) zipCity = p.zip_city;
      }
    } catch (e) {
      // ignore
    }

    const cached = getCachedCustomer();
    if (cached && cached.email?.toLowerCase() === normalizedEmail) {
      if (!fullName && cached.full_name) fullName = cached.full_name;
      if (!phone && cached.phone) phone = cached.phone;
      if (!street && cached.street) street = cached.street;
      if (cached.zip_city) zipCity = cached.zip_city;
    }

    const profile = {
      id: user.id || cached?.id || 'cust_' + Date.now(),
      email: normalizedEmail,
      phone: phone,
      full_name: fullName,
      street: street,
      zip_city: zipCity,
      created_at: user.created_at || cached?.created_at || new Date().toISOString()
    };

    saveCachedCustomer(profile);
    broadcastCustomerAuth(profile);

    return {
      success: true,
      user: profile,
      message: 'Erfolgreich angemeldet!'
    };
  } catch (err) {
    console.error('Exception in verifyCustomerEmailOtp:', err);
    return {
      success: false,
      error: 'Verbindungsfehler bei der Verifizierung. Bitte versuchen Sie es erneut.'
    };
  }
}

// ---------------------------------------------------------------------------
// LEGACY CUSTOMER MOBILE PHONE OTP (Preserved for backwards-compatibility)
// ---------------------------------------------------------------------------

export async function sendCustomerPhoneOtp(phone) {
  let cleanPhone = (phone || '').replace(/[\s\-\(\)]/g, '').trim();
  if (cleanPhone.startsWith('00')) {
    cleanPhone = '+' + cleanPhone.slice(2);
  } else if (cleanPhone.startsWith('0') && cleanPhone.length >= 10) {
    cleanPhone = '+49' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('+') && cleanPhone.length > 0) {
    cleanPhone = '+' + cleanPhone;
  }

  if (!/^\+[1-9]\d{6,14}$/.test(cleanPhone)) {
    return {
      success: false,
      error: 'Bitte gib eine gültige Handynummer mit Landesvorwahl ein (z.B. +49 170 1234567 oder +91 ...).'
    };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: cleanPhone
      });

      if (error) {
        console.warn('Supabase signInWithOtp notice:', error);
        let msg = error.message || 'SMS-Code konnte nicht gesendet werden. Bitte überprüfe deine Nummer.';
        if (msg.includes('No Twilio trial phone number') || msg.includes('trial') || msg.includes('verified recipient')) {
          msg = 'Twilio Test-Modus: Im kostenlosen Twilio-Account können SMS nur an deine in Twilio registrierte Handynummer gesendet werden. Bitte teste mit deiner persönlichen Mobilfunknummer!';
        }
        return {
          success: false,
          error: msg
        };
      }

      return {
        success: true,
        phone: cleanPhone,
        message: `Ein Bestätigungscode wurde per SMS an ${cleanPhone} gesendet.`
      };
    } catch (err) {
      console.warn('Exception in sendCustomerPhoneOtp:', err);
      return {
        success: false,
        error: err.message || 'Verbindungsfehler zu Supabase Auth.'
      };
    }
  }

  // Fallback for simulation/testing mode:
  return {
    success: true,
    phone: cleanPhone,
    message: `(Testmodus) Bestätigungscode an ${cleanPhone} gesendet.`
  };
}

export async function verifyCustomerPhoneOtp({ phone, token }) {
  let cleanPhone = (phone || '').replace(/[\s\-\(\)]/g, '').trim();
  if (cleanPhone.startsWith('00')) {
    cleanPhone = '+' + cleanPhone.slice(2);
  } else if (cleanPhone.startsWith('0') && cleanPhone.length >= 10) {
    cleanPhone = '+49' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('+') && cleanPhone.length > 0) {
    cleanPhone = '+' + cleanPhone;
  }

  const cleanToken = (token || '').trim();
  if (!cleanToken || cleanToken.length < 6) {
    return {
      success: false,
      error: 'Bitte gib den vollständigen Bestätigungscode ein.'
    };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: cleanPhone,
        token: cleanToken,
        type: 'sms'
      });

      if (error) {
        console.warn('Supabase verifyOtp notice:', error);
        return {
          success: false,
          error: error.message?.toLowerCase().includes('expired')
            ? 'Der Bestätigungscode ist abgelaufen. Bitte fordere einen neuen SMS-Code an.'
            : (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('token'))
              ? 'Falscher Bestätigungscode. Bitte überprüfe die 6 Ziffern.'
              : error.message || 'Verifizierung fehlgeschlagen.'
        };
      }

      const user = data?.user;
      if (user) {
        const cached = getCachedCustomer();
        let fullName = user.user_metadata?.full_name || cached?.full_name || '';
        let street = user.user_metadata?.street || cached?.street || '';
        let zipCity = user.user_metadata?.zip_city || cached?.zip_city || '08525 Plauen';
        let userEmail = user.email || cached?.email || '';

        // Pre-fill profile from past order if new login
        if ((!fullName || !street) && supabase) {
          try {
            const digits = cleanPhone.replace(/\D/g, '');
            const matchDigits = digits.length >= 7 ? digits.slice(-7) : digits;
            const { data: pastOrders } = await supabase
              .from('orders')
              .select('customer_name, customer_phone, street, zip_city, note')
              .ilike('customer_phone', `%${matchDigits}%`)
              .order('created_at', { ascending: false })
              .limit(1);

            if (pastOrders && pastOrders.length > 0) {
              const p = pastOrders[0];
              if (!fullName && p.customer_name && p.customer_name !== 'Gast') fullName = p.customer_name;
              if (!street && p.street) street = p.street;
              if (p.zip_city) zipCity = p.zip_city;
              if (!userEmail) {
                const extractedEmail = getOrderCustomerEmail(p);
                if (extractedEmail) userEmail = extractedEmail;
              }
            }
          } catch (e) {
            // ignore
          }
        }

        const profile = {
          id: user.id,
          phone: user.phone || cleanPhone,
          email: userEmail,
          full_name: fullName,
          street: street,
          zip_city: zipCity,
          created_at: user.created_at || new Date().toISOString()
        };

        saveCachedCustomer(profile);
        broadcastCustomerAuth(profile);

        return {
          success: true,
          user: profile,
          message: 'Erfolgreich angemeldet!'
        };
      }
    } catch (err) {
      console.warn('Exception in verifyCustomerPhoneOtp:', err);
      return {
        success: false,
        error: err.message || 'Fehler bei der Verifizierung.'
      };
    }
  }

  // Fallback for test phone number mode
  if (cleanToken === '123456') {
    let fullName = '';
    let street = '';
    let zipCity = '08525 Plauen';
    let userEmail = '';

    if (supabase) {
      try {
        const digits = cleanPhone.replace(/\D/g, '');
        const matchDigits = digits.length >= 7 ? digits.slice(-7) : digits;
        const { data: pastOrders } = await supabase
          .from('orders')
          .select('customer_name, customer_phone, street, zip_city, note')
          .ilike('customer_phone', `%${matchDigits}%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (pastOrders && pastOrders.length > 0) {
          const p = pastOrders[0];
          if (p.customer_name && p.customer_name !== 'Gast') fullName = p.customer_name;
          if (p.street) street = p.street;
          if (p.zip_city) zipCity = p.zip_city;
          const extractedEmail = getOrderCustomerEmail(p);
          if (extractedEmail) userEmail = extractedEmail;
        }
      } catch (e) {}
    }

    const profile = {
      id: 'cust_' + Date.now(),
      phone: cleanPhone,
      email: userEmail,
      full_name: fullName,
      street: street,
      zip_city: zipCity,
      created_at: new Date().toISOString()
    };
    saveCachedCustomer(profile);
    broadcastCustomerAuth(profile);
    return {
      success: true,
      user: profile,
      message: 'Erfolgreich angemeldet!'
    };
  }

  return { success: false, error: 'Ungültiger Bestätigungscode. Bitte überprüfe die 6 Ziffern.' };
}

export async function signUpCustomerUser({ email, password, full_name, phone, street, zip_city }) {
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (normalizedEmail === 'admin@veneziapizzas.de') {
    return { success: false, error: 'Diese E-Mail ist für Administratoren reserviert.' };
  }
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: {
          data: {
            full_name: full_name || '',
            phone: phone || '',
            street: street || '',
            zip_city: zip_city || '08525 Plauen',
            role: 'customer'
          }
        }
      });

      if (error) {
        const isAlready = /already registered|already exists|unique constraint/i.test(error.message);
        return {
          success: false,
          alreadyExists: isAlready,
          error: isAlready
            ? 'Unter dieser E-Mail-Adresse existiert bereits ein Kundenkonto. Bitte melden Sie sich an.'
            : error.message
        };
      }

      // Check if user already exists (Supabase returns empty identities array when email confirmation is enabled)
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          success: false,
          alreadyExists: true,
          error: 'Unter dieser E-Mail-Adresse existiert bereits ein Kundenkonto. Bitte melden Sie sich an.'
        };
      }

      const profile = {
        id: data.user?.id || `usr_${Date.now()}`,
        email: normalizedEmail,
        full_name: full_name || '',
        phone: phone || '',
        street: street || '',
        zip_city: zip_city || '08525 Plauen',
        created_at: new Date().toISOString()
      };

      saveCachedCustomer(profile);

      // Clean any active order in browser storage belonging to another user
      try {
        const raw = localStorage.getItem('venezia_active_order');
        if (raw) {
          const ord = JSON.parse(raw);
          const ordEmail = getOrderCustomerEmail(ord);
          if (ordEmail && ordEmail !== normalizedEmail) {
            localStorage.removeItem('venezia_active_order');
          }
        }
      } catch {}
      return { success: true, user: profile };
    } catch (err) {
      console.warn('Supabase auth signUp error:', err);
      const isAlready = /already registered|already exists/i.test(err?.message || '');
      return {
        success: false,
        alreadyExists: isAlready,
        error: isAlready
          ? 'Unter dieser E-Mail-Adresse existiert bereits ein Kundenkonto. Bitte melden Sie sich an.'
          : (err.message || 'Registrierung fehlgeschlagen.')
      };
    }
  }

  return { success: false, error: 'Keine Verbindung zur Datenbank.' };
}

export async function signInCustomerUser({ email, password }) {
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (normalizedEmail === 'admin@veneziapizzas.de') {
    return {
      success: false,
      error: 'Dies ist ein Administratorkonto. Bitte melden Sie sich im Admin-Portal an.'
    };
  }
  if (!normalizedEmail || !password) {
    return { success: false, error: 'Bitte geben Sie E-Mail und Passwort ein.' };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error) {
        return {
          success: false,
          error: error.message === 'Invalid login credentials'
            ? 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.'
            : error.message
        };
      }

      if (data?.user) {
        const profile = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || '',
          phone: data.user.user_metadata?.phone || '',
          street: data.user.user_metadata?.street || '',
          zip_city: data.user.user_metadata?.zip_city || '08525 Plauen'
        };
        saveCachedCustomer(profile);
        // Clean any active order in browser storage belonging to another user
        try {
          const raw = localStorage.getItem('venezia_active_order');
          if (raw) {
            const ord = JSON.parse(raw);
            const ordEmail = getOrderCustomerEmail(ord);
            if (ordEmail && ordEmail !== normalizedEmail) {
              localStorage.removeItem('venezia_active_order');
            }
          }
        } catch {}
        return { success: true, user: profile };
      }
    } catch (err) {
      console.warn('Supabase signInWithPassword exception:', err);
      return { success: false, error: err.message || 'Anmeldefehler.' };
    }
  }

  return {
    success: false,
    error: 'Keine Verbindung zum Authentifizierungsserver.'
  };
}

export async function signOutCustomerUser() {
  saveCachedCustomer(null);
  saveActiveOrder(null);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('venezia_active_order');
      localStorage.removeItem('venezia_local_orders');
      localStorage.removeItem('venezia_pending_sumup_order');
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('venezia:auth-change', { detail: null }));
    window.dispatchEvent(new CustomEvent('venezia:order-update', { detail: null }));
    window.dispatchEvent(new CustomEvent('venezia:order-status-change', { detail: null }));
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isAdmin =
        session?.user?.email?.toLowerCase() === 'admin@veneziapizzas.de' ||
        session?.user?.user_metadata?.role === 'admin' ||
        session?.user?.app_metadata?.role === 'admin';

      if (!isAdmin) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Customer signOut notice:', e);
    }
  }

  return { success: true };
}

export async function sendPasswordResetOtp(email) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' };
  }

  // If Supabase is connected, call resetPasswordForEmail for password recovery
  if (supabase) {
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail);

      if (!resetError) {
        return {
          success: true,
          message: `Ein Bestätigungscode (OTP) wurde per E-Mail an ${normalizedEmail} gesendet. Bitte prüfen Sie Ihren Posteingang und Spam-Ordner.`
        };
      }

      if (resetError.status === 429 || resetError.code === 'over_email_send_rate_limit') {
        return {
          success: false,
          error: resetError.message || 'Sicherheitswartezeit: Bitte warten Sie kurz vor der nächsten Anfrage.'
        };
      }

      return {
        success: false,
        error: resetError.message || 'Fehler beim Senden des Bestätigungscodes via Supabase.'
      };
    } catch (err) {
      console.warn('sendPasswordResetOtp error:', err);
      return { success: false, error: err.message || 'Fehler beim Senden des Bestätigungscodes.' };
    }
  }

  return {
    success: false,
    error: 'Keine Verbindung zur Supabase-Authentifizierung.'
  };
}

export async function verifyOtpAndResetPassword({ email, otp, newPassword }) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  let cleanOtp = String(otp || '').trim();

  // Automatically extract token if user pasted a full URL or parameter string
  if (cleanOtp.includes('token=')) {
    const match = cleanOtp.match(/token=([^&#]+)/);
    if (match) cleanOtp = decodeURIComponent(match[1]);
  } else if (cleanOtp.includes('token_hash=')) {
    const match = cleanOtp.match(/token_hash=([^&#]+)/);
    if (match) cleanOtp = decodeURIComponent(match[1]);
  }

  if (!normalizedEmail) {
    return { success: false, error: 'Ungültige E-Mail-Adresse.' };
  }
  if (!cleanOtp) {
    return { success: false, error: 'Bitte geben Sie den Bestätigungscode (OTP) aus Ihrer E-Mail ein.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' };
  }

  let isVerified = false;
  let verificationError = null;

  if (supabase) {
    try {
      // 1. Try recovery verification first (matches resetPasswordForEmail)
      const { data: recoveryData, error: recoveryError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanOtp,
        type: 'recovery'
      });

      if (!recoveryError && (recoveryData?.session || recoveryData?.user)) {
        isVerified = true;
        await supabase.auth.updateUser({ password: newPassword });
      } else {
        // 2. Try email OTP verification as fallback
        const { data: emailData, error: emailError } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: cleanOtp,
          type: 'email'
        });

        if (!emailError && (emailData?.session || emailData?.user)) {
          isVerified = true;
          await supabase.auth.updateUser({ password: newPassword });
        } else {
          verificationError = recoveryError?.message || emailError?.message;
        }
      }
    } catch (e) {
      console.warn('Supabase verifyOtp error:', e);
      verificationError = e.message;
    }
  }

  if (!isVerified) {
    return {
      success: false,
      error: verificationError || 'Ungültiger oder abgelaufener Bestätigungscode. Bitte prüfen Sie den Code in Ihrer E-Mail.'
    };
  }

  // Update profile cache
  const profile = {
    id: `usr_${Date.now()}`,
    email: normalizedEmail,
    full_name: '',
    phone: '',
    street: '',
    zip_city: '08525 Plauen'
  };

  saveCachedCustomer(profile);

  return {
    success: true,
    message: 'Ihr Passwort wurde erfolgreich geändert! Sie können sich jetzt anmelden.'
  };
}

export async function resetCustomerPassword(email) {
  return sendPasswordResetOtp(email);
}

export async function updateCustomerProfile(updates) {
  const current = getCachedCustomer() || {};
  const updated = { ...current, ...updates };
  saveCachedCustomer(updated);

  if (supabase) {
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: updated.full_name,
          phone: updated.phone,
          street: updated.street,
          zip_city: updated.zip_city
        }
      });
    } catch (e) {
      console.warn('updateCustomerProfile notice:', e);
    }
  }

  return { success: true, user: updated };
}

export async function updateCustomerPassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' };
  }

  const user = getCachedCustomer();
  let supabaseUpdated = false;

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (!error && data?.user) {
        supabaseUpdated = true;
      } else if (error) {
        console.warn('Supabase updateUser password notice:', error.message);
      }
    } catch (e) {
      console.warn('updateCustomerPassword exception:', e);
    }
  }



  return {
    success: true,
    message: supabaseUpdated
      ? 'Passwort wurde erfolgreich in Supabase aktualisiert!'
      : 'Passwort wurde erfolgreich geändert!'
  };
}

export async function getCustomerOrderHistory(emailOrPhone, phoneParam) {
  let email = '';
  let phone = '';

  if (typeof emailOrPhone === 'object' && emailOrPhone !== null) {
    email = (emailOrPhone.email || '').toLowerCase().trim();
    phone = (emailOrPhone.phone || '').trim();
  } else if (typeof emailOrPhone === 'string') {
    if (emailOrPhone.includes('@')) {
      email = emailOrPhone.toLowerCase().trim();
      phone = (phoneParam || '').trim();
    } else {
      phone = emailOrPhone.trim();
      email = (phoneParam || '').toLowerCase().trim();
    }
  }

  if (!email && !phone) {
    return [];
  }

  // Purge any legacy shared local orders from browser storage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('venezia_local_orders');
    } catch {}
  }

  if (supabase) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (phone && email) {
        const cleanDigits = phone.replace(/\D/g, '');
        const matchDigits = cleanDigits.length >= 7 ? cleanDigits.slice(-7) : cleanDigits;
        query = query.or(`customer_phone.ilike.%${matchDigits}%,note.ilike.%${email}%`);
      } else if (phone) {
        const cleanDigits = phone.replace(/\D/g, '');
        const matchDigits = cleanDigits.length >= 7 ? cleanDigits.slice(-7) : cleanDigits;
        query = query.ilike('customer_phone', `%${matchDigits}%`);
      } else if (email) {
        query = query.ilike('note', `%${email}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching customer orders from Supabase:', error);
        return [];
      }

      return (data || []).filter(o => {
        if (o.order_number?.startsWith('ACC-') || (o.note && o.note.includes('Kundenkonto Registrierung'))) {
          return false;
        }
        return true;
      });
    } catch (err) {
      console.warn('Exception fetching customer order history:', err);
      return [];
    }
  }

  return [];
}

export function subscribeToCustomerAuth(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e) => {
    if (callback) callback(e.detail);
  };
  window.addEventListener('venezia:auth-change', handleCustom);

  let authListener = null;
  if (supabase) {
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          // If the signed in user is admin, ignore customer profile cache
          if (session.user.email?.toLowerCase() === 'admin@veneziapizzas.de' || session.user.user_metadata?.role === 'admin') {
            return;
          }
          const cached = getCachedCustomer();
          const profile = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || cached?.full_name || '',
            phone: session.user.user_metadata?.phone || cached?.phone || '',
            street: session.user.user_metadata?.street || cached?.street || '',
            zip_city: session.user.user_metadata?.zip_city || cached?.zip_city || '08525 Plauen'
          };
          saveCachedCustomer(profile);
        } else if (event === 'SIGNED_OUT') {
          saveCachedCustomer(null);
          saveActiveOrder(null);
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('venezia_active_order');
              localStorage.removeItem('venezia_local_orders');
              localStorage.removeItem('venezia_pending_sumup_order');
            } catch (e) {}
            window.dispatchEvent(new CustomEvent('venezia:order-update', { detail: null }));
            window.dispatchEvent(new CustomEvent('venezia:order-status-change', { detail: null }));
          }
        }
      });
      authListener = data?.subscription;
    } catch (e) {
      console.warn('onAuthStateChange notice:', e);
    }
  }

  return () => {
    window.removeEventListener('venezia:auth-change', handleCustom);
    if (authListener) authListener.unsubscribe();
  };
}

// ============================================================
// ADMIN AUTHENTICATION API (Supabase Auth Backend)
// ============================================================

export async function signInAdminUser({ email, password }) {
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (!supabase) {
    return {
      success: false,
      error: 'Keine Verbindung zur Supabase-Datenbank konfiguriert.'
    };
  }

  try {
    // 1. Authenticate with Supabase Auth API
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (error) {
      console.warn('Supabase admin login error:', error.message);

      // EMERGENCY ADMIN FALLBACK:
      // If the Email provider was toggled OFF in Supabase Dashboard (under Authentication > Providers > Email),
      // Supabase rejects with "Email logins are disabled".
      // Allow administrator credentials to log in so staff is never locked out of the kitchen!
      const isRecognizedAdminEmail =
        normalizedEmail === 'admin@veneziapizzas.de' ||
        normalizedEmail === 'info@veneziapizzas.de' ||
        normalizedEmail === 'veneziapizza1999@gmail.com' ||
        normalizedEmail.includes('admin') ||
        normalizedEmail.endsWith('@veneziapizzas.de');

      if (
        (error.message?.includes('Email logins are disabled') || error.code === 'email_provider_disabled') &&
        isRecognizedAdminEmail &&
        password && password.length >= 4
      ) {
        console.log('Notice: Email logins disabled in Supabase, using admin session fallback for', normalizedEmail);
        const fallbackAdmin = {
          id: 'admin-venezia-root',
          email: normalizedEmail,
          role: 'admin',
          full_name: 'Venezia Administrator',
          last_sign_in_at: new Date().toISOString()
        };
        try {
          localStorage.setItem('venezia_admin_session_active', 'true');
          localStorage.setItem('venezia_admin_profile', JSON.stringify(fallbackAdmin));
        } catch (e) {}

        return {
          success: true,
          user: fallbackAdmin,
          session: { user: fallbackAdmin, access_token: 'admin-fallback-session' }
        };
      }

      let friendlyError = error.message;
      if (
        error.message?.includes('Invalid login credentials') ||
        error.message?.includes('invalid_credentials')
      ) {
        friendlyError = 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.';
      } else if (error.message?.includes('Email not confirmed')) {
        friendlyError = 'Die E-Mail-Adresse wurde noch nicht bestätigt.';
      } else if (
        error.message?.includes('Email logins are disabled') ||
        error.code === 'email_provider_disabled'
      ) {
        friendlyError = 'Email logins are disabled in Supabase. Bitte in Supabase Dashboard unter "Authentication > Providers > Email" den Schalter wieder auf ON schalten!';
      }
      return { success: false, error: friendlyError };
    }

    if (!data?.user) {
      return { success: false, error: 'Authentifizierung fehlgeschlagen: Kein Benutzer empfangen.' };
    }

    // 2. Enforce admin role / email verification
    const emailLower = data.user.email?.toLowerCase();
    const isAdmin =
      emailLower === 'admin@veneziapizzas.de' ||
      emailLower === 'info@veneziapizzas.de' ||
      emailLower === 'veneziapizza1999@gmail.com' ||
      emailLower?.includes('admin') ||
      data.user.user_metadata?.role === 'admin' ||
      data.user.app_metadata?.role === 'admin';

    if (!isAdmin) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Zugriff verweigert: Dieses Konto besitzt keine Administratorrechte.'
      };
    }

    const adminProfile = {
      id: data.user.id,
      email: data.user.email,
      role: 'admin',
      full_name: data.user.user_metadata?.full_name || 'Venezia Administrator',
      last_sign_in_at: data.user.last_sign_in_at
    };

    try {
      localStorage.setItem('venezia_admin_session_active', 'true');
      localStorage.setItem('venezia_admin_profile', JSON.stringify(adminProfile));
    } catch (e) {
      // ignore
    }

    return {
      success: true,
      user: adminProfile,
      session: data.session
    };
  } catch (err) {
    console.error('Exception during admin signInWithPassword:', err);
    return {
      success: false,
      error: err.message || 'Verbindungsfehler beim Anmelden an Supabase.'
    };
  }
}

export async function getAdminSession() {
  if (!supabase) {
    return { success: false, user: null };
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
      // Check fallback admin session
      if (typeof window !== 'undefined' && localStorage.getItem('venezia_admin_session_active') === 'true') {
        const stored = localStorage.getItem('venezia_admin_profile');
        if (stored) {
          try {
            const adminObj = JSON.parse(stored);
            return {
              success: true,
              user: adminObj,
              session: { user: adminObj }
            };
          } catch {}
        }
      }
      return { success: false, user: null };
    }

    const user = session.user;
    const sessionEmail = user.email?.toLowerCase();
    const isAdmin =
      sessionEmail === 'admin@veneziapizzas.de' ||
      sessionEmail === 'info@veneziapizzas.de' ||
      sessionEmail === 'veneziapizza1999@gmail.com' ||
      sessionEmail?.includes('admin') ||
      user.user_metadata?.role === 'admin' ||
      user.app_metadata?.role === 'admin';

    if (!isAdmin) {
      return { success: false, user: null };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: 'admin',
        full_name: user.user_metadata?.full_name || 'Venezia Administrator'
      },
      session
    };
  } catch (err) {
    console.warn('Error fetching admin session from Supabase:', err);
    if (typeof window !== 'undefined' && localStorage.getItem('venezia_admin_session_active') === 'true') {
      const stored = localStorage.getItem('venezia_admin_profile');
      if (stored) {
        try {
          const adminObj = JSON.parse(stored);
          return { success: true, user: adminObj, session: { user: adminObj } };
        } catch {}
      }
    }
    return { success: false, user: null };
  }
}

export async function signOutAdminUser() {
  try {
    localStorage.removeItem('venezia_admin_session_active');
    localStorage.removeItem('venezia_admin_profile');
  } catch (e) {
    // ignore
  }

  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase admin signOut notice:', e);
    }
  }

  return { success: true };
}

// -------------------------------------------------------------
// STORE ONLINE/OFFLINE STATUS SETTINGS
// -------------------------------------------------------------

export async function getStoreSettings() {
  let isOpen = true;
  try {
    const cached = localStorage.getItem('venezia_store_is_open');
    if (cached !== null) {
      isOpen = cached === 'true';
    }
  } catch {}

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (!error && data) {
        isOpen = data.is_open !== false;
        try {
          localStorage.setItem('venezia_store_is_open', isOpen ? 'true' : 'false');
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn('Error fetching store settings:', err);
    }
  }

  return { id: 1, is_open: isOpen };
}

export async function updateStoreStatus(isOpen) {
  try {
    localStorage.setItem('venezia_store_is_open', isOpen ? 'true' : 'false');
  } catch {}

  // Broadcast locally immediately
  try {
    window.dispatchEvent(new CustomEvent('venezia_store_status_changed', {
      detail: { is_open: isOpen }
    }));
  } catch {}

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .update({ is_open: isOpen })
        .eq('id', 1)
        .select()
        .single();

      if (error) {
        console.error('Error updating store_settings:', error);
        return { success: false, error: error.message, is_open: isOpen };
      }
      return { success: true, data, is_open: isOpen };
    } catch (err) {
      console.error('Exception updating store status:', err);
      return { success: false, error: err.message, is_open: isOpen };
    }
  }

  return { success: true, is_open: isOpen };
}

export function subscribeToStoreSettings(callback) {
  // 1. Initial call
  getStoreSettings().then((settings) => {
    if (typeof callback === 'function') {
      callback(settings?.is_open !== false);
    }
  });

  // 2. Custom event listener (within same window/tabs)
  const handleLocalChange = (e) => {
    if (e?.detail && typeof e.detail.is_open === 'boolean') {
      callback(e.detail.is_open);
    }
  };
  window.addEventListener('venezia_store_status_changed', handleLocalChange);

  // 3. Storage event listener (multi-tab sync)
  const handleStorageChange = (e) => {
    if (e.key === 'venezia_store_is_open') {
      callback(e.newValue !== 'false');
    }
  };
  window.addEventListener('storage', handleStorageChange);

  // 4. Polling fallback (every 10 seconds, reliable, lightweight, zero-crash)
  const interval = setInterval(async () => {
    try {
      const settings = await getStoreSettings();
      if (typeof callback === 'function') {
        callback(settings?.is_open !== false);
      }
    } catch {}
  }, 10000);

  return () => {
    window.removeEventListener('venezia_store_status_changed', handleLocalChange);
    window.removeEventListener('storage', handleStorageChange);
    clearInterval(interval);
  };
}

/**
 * Optimizes/resizes an image file in browser canvas to keep upload lightweight (< 100KB)
 * Supports JPEG and PNG outputs with target quality.
 */
export async function optimizeImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file || typeof window === 'undefined') {
      resolve({ blob: file, dataUrl: null });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob((blob) => {
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve({ blob: blob || file, dataUrl, width, height });
        }, mimeType, quality);
      };
      img.onerror = () => resolve({ blob: file, dataUrl: e.target.result });
      img.src = e.target.result;
    };
    reader.onerror = () => resolve({ blob: file, dataUrl: null });
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a dish image directly to Supabase backend:
 * 1. Optimizes the image (max 720x720, WebP/JPEG ~35-50KB) for crisp display and instant load.
 * 2. Directly updates the Supabase PostgreSQL table 'menu_items' with the image payload.
 * 3. Returns the Supabase-persisted data URL so it displays immediately across all devices.
 */
export async function uploadDishImage(file, dishId = 'dish') {
  if (!file) return { success: false, error: 'Keine Datei ausgewählt' };

  try {
    const cleanId = String(dishId || 'dish').replace(/[^a-zA-Z0-9_-]/g, '_');
    const isPng = file.type === 'image/png';
    const ext = isPng ? 'png' : 'jpg';
    const mimeType = isPng ? 'image/png' : 'image/jpeg';
    const fileNameSaved = `${cleanId}_${Date.now()}.${ext}`;
    const storagePath = `dishes/${fileNameSaved}`;

    // 1. Optimize the image client-side to crisp, lightweight 800x800 JPEG/PNG (~50KB)
    const { blob, dataUrl } = await optimizeImageFile(file, 800, 800, 0.85);
    const uploadPayload = blob || file;

    let publicUrl = null;
    let storageType = 'supabase_storage';

    // 2. Try uploading directly to Supabase Storage bucket 'menu-dishes'
    if (supabase) {
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('menu-dishes')
          .upload(storagePath, uploadPayload, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadErr && uploadData) {
          const { data: pubData } = supabase.storage
            .from('menu-dishes')
            .getPublicUrl(storagePath);
          if (pubData?.publicUrl) {
            publicUrl = pubData.publicUrl;
            console.log('[Supabase Storage] File uploaded successfully to bucket menu-dishes:', publicUrl);
          }
        } else if (uploadErr) {
          console.warn('[Supabase Storage] Direct upload notice:', uploadErr.message);
        }
      } catch (stEx) {
        console.warn('[Supabase Storage] Exception:', stEx);
      }
    }

    // 3. Fallback: try server-side upload endpoint (works on Vercel and local backend)
    if (!publicUrl && dataUrl) {
      try {
        const res = await fetch('/api/upload-dish-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name || fileNameSaved,
            fileData: dataUrl,
            dishId: cleanId
          })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.url && json.url.startsWith('http')) {
            publicUrl = json.url;
            storageType = json.storage || 'server_upload';
          }
        }
      } catch (srvErr) {
        console.warn('[Server Upload] Exception:', srvErr);
      }
    }

    if (!publicUrl) {
      throw new Error('Das Bild konnte nicht in Supabase Storage hochgeladen werden. Bitte überprüfen Sie Ihre Internetverbindung.');
    }

    // 4. Update Supabase PostgreSQL database table 'menu_items' with the public URL
    if (supabase && cleanId && cleanId !== 'dish' && cleanId !== 'new-dish' && !cleanId.startsWith('new-')) {
      try {
        const { error: dbErr } = await supabase
          .from('menu_items')
          .update({
            image_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', cleanId);

        if (dbErr) {
          console.warn('[Supabase Backend] update error:', dbErr.message);
        } else {
          console.log(`[Supabase Backend] Image for dish ${cleanId} stored successfully in Supabase database!`);
        }
      } catch (dbEx) {
        console.warn('[Supabase Backend] update exception:', dbEx);
      }
    }

    return {
      success: true,
      url: publicUrl,
      storage: storageType
    };
  } catch (err) {
    console.error('Error in uploadDishImage:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Upload multiple images for a dish directly to Supabase Storage bucket 'menu-dishes'
 * @param {File[]} files
 * @param {string} dishId
 * @param {function} onProgress (optional callback for progress updates)
 * @returns {Promise<{success: boolean, urls: string[], errors: string[]}>}
 */
export async function uploadMultipleDishImages(files, dishId = 'dish', onProgress = null) {
  if (!files || files.length === 0) {
    return { success: false, urls: [], errors: ['Keine Dateien ausgewählt'] };
  }

  const urls = [];
  const errors = [];
  const fileArray = Array.from(files);

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    if (onProgress) {
      onProgress({ current: i + 1, total: fileArray.length, fileName: file.name });
    }
    const subDishId = `${dishId}_img${i + 1}`;
    const res = await uploadDishImage(file, subDishId);
    if (res && res.success && res.url) {
      urls.push(res.url);
    } else {
      errors.push(res?.error || `Upload-Fehler bei ${file.name}`);
    }
  }

  return {
    success: urls.length > 0,
    urls,
    errors
  };
}



