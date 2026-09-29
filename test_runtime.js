import { getOrders } from './src/lib/supabaseClient.js';
const orders = await getOrders();
console.log('Order 0:', JSON.stringify(orders[0], null, 2));
