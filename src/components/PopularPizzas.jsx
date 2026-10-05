import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, PackageX } from 'lucide-react';
import { popularPizzasData } from '../data/menuData';
import { useLiveMenu, formatMenuItemFromDb } from '../data/liveMenuState';
import { getMenuItems, subscribeToMenuItems } from '../lib/supabaseClient.js';

export default function PopularPizzas({ onAddToCart, onShowAllMenu }) {
  const { menuItems: liveMenuItems } = useLiveMenu();
  const [directMenuItems, setDirectMenuItems] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchDirect = async () => {
      try {
        const data = await getMenuItems();
        if (data && data.length > 0 && mounted) {
          const localMap = new Map((popularPizzasData || []).filter(i => i && i.id).map((i) => [i.id, i]));
          const formatted = data.map((item) => formatMenuItemFromDb(item, localMap));
          setDirectMenuItems(formatted);
        }
      } catch (err) {
        console.error('[PopularPizzas] Direct fetch error:', err);
      }
    };

    fetchDirect();

    const handleUpdate = () => fetchDirect();
    window.addEventListener('venezia-menu-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    const unsubRealtime = subscribeToMenuItems(() => {
      fetchDirect();
    });

    return () => {
      mounted = false;
      window.removeEventListener('venezia-menu-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      if (unsubRealtime) unsubRealtime();
    };
  }, []);

  const rawMenuItems = directMenuItems || liveMenuItems;
  const menuItems = (rawMenuItems || []).map(item => {
    try {
      const overrides = JSON.parse(localStorage.getItem('venezia_admin_dishes_override') || '{}');
      if (overrides && overrides[item.id]) {
        return { ...item, ...overrides[item.id], has_custom_image: true };
      }
    } catch (e) {}
    return item;
  });

  const livePizzas = popularPizzasData.map(p => {
    const live = menuItems.find(m => m.id === p.id || (m.number && String(m.number).trim() === String(p.number || p.id.replace('pizza-', '')).trim()));
    if (!live) return p;

    const unitPrice = typeof live.price === 'number'
      ? live.price
      : (live.prices?.small || live.prices?.single || p.price || 9.0);

    const numPrice = Number(unitPrice) || 9.0;

    const resolvedImage = live.image_url || live.image || p.image;

    return {
      ...p,
      name: live.name || p.name,
      ingredients: live.toppings || live.desc || p.ingredients,
      price: numPrice,
      formattedPrice: `ab ${numPrice.toFixed(2).replace('.', ',')} €`,
      image: resolvedImage,
      image_url: resolvedImage,
      badge: live.badge !== undefined ? live.badge : p.badge,
      is_in_stock: live.is_in_stock !== false
    };
  });

  return (
    <section className="section popular" id="speisekarte">
      <div className="section-heading">
        <div>
          <h2>
            Unsere <span>beliebten Pizzen</span>
          </h2>
          <p>Klassiker, die immer schmecken.</p>
        </div>
        <button
          className="section-link"
          onClick={onShowAllMenu}
          aria-label="Zur gesamten Speisekarte"
        >
          Zur gesamten Speisekarte <ArrowRight size={14} />
        </button>
      </div>

      <div className="pizza-grid">
        {livePizzas.map((pizza) => {
          const inStock = pizza.is_in_stock !== false;
          return (
            <article className="pizza-card" key={pizza.id} style={{ opacity: inStock ? 1 : 0.65 }}>
              <div className="pizza-image">
                <img 
                  src={pizza.image_url || pizza.image} 
                  alt={pizza.name} 
                  onError={(e) => { 
                    e.currentTarget.onerror = null;
                    if (pizza.image && e.currentTarget.src !== pizza.image) {
                      e.currentTarget.src = pizza.image; 
                    }
                  }} 
                />
                {pizza.badge && inStock && <span className="pizza-badge">{pizza.badge}</span>}
                {!inStock && (
                  <span className="pizza-badge" style={{ background: '#334155', color: '#ffffff' }}>
                    Ausverkauft
                  </span>
                )}
              </div>

              <div className="pizza-info">
                <h3>{pizza.name}</h3>
                <p>{pizza.ingredients}</p>

                <div className="pizza-bottom">
                  <strong>{pizza.formattedPrice}</strong>
                  {inStock ? (
                    <button
                      className="plus-button"
                      aria-label={`${pizza.name} hinzufügen`}
                      onClick={() => onAddToCart({
                        id: pizza.id,
                        name: pizza.name,
                        price: pizza.price,
                        image: pizza.image,
                        desc: pizza.ingredients
                      })}
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Nicht vorrätig</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
