import React from 'react';
import { ArrowRight, Plus, PackageX } from 'lucide-react';
import { popularPizzasData } from '../data/menuData';
import { useLiveMenu } from '../data/liveMenuState';

export default function PopularPizzas({ onAddToCart, onShowAllMenu }) {
  const { menuItems } = useLiveMenu();

  const livePizzas = popularPizzasData.map(p => {
    const live = menuItems.find(m => m.id === p.id || (m.number && m.number === p.id.replace('pizza-', '')));
    if (!live) return p;

    const unitPrice = typeof live.price === 'number'
      ? live.price
      : (live.prices?.small || live.prices?.single || p.price || 9.0);

    const numPrice = Number(unitPrice) || 9.0;

    return {
      ...p,
      name: live.name || p.name,
      ingredients: live.toppings || live.desc || p.ingredients,
      price: numPrice,
      formattedPrice: `ab ${numPrice.toFixed(2).replace('.', ',')} €`,
      image: live.image || p.image,
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
                <img src={pizza.image} alt={pizza.name} loading="lazy" />
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
