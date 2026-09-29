import React from 'react';
import { ArrowRight } from 'lucide-react';
import { specialOffersData } from '../data/menuData';
import { useLiveMenu } from '../data/liveMenuState';

export default function SpecialOffers({ onAddToCart, onShowAllOffers }) {
  const { menuItems } = useLiveMenu();

  const liveOffers = specialOffersData.map((offer) => {
    const live = menuItems.find(
      (m) => m.id === offer.id || (m.number && m.number.toUpperCase() === offer.code.toUpperCase())
    );
    if (!live) return offer;

    const unitPrice = typeof live.price === 'number'
      ? live.price
      : (live.prices?.single || offer.price);

    return {
      ...offer,
      title: live.name || offer.title,
      description: live.toppings || live.desc || offer.description,
      price: unitPrice,
      formattedPrice: `${unitPrice.toFixed(2).replace('.', ',')} €`,
      image: live.image || offer.image,
      is_in_stock: live.is_in_stock !== false
    };
  });

  return (
    <section className="section" id="angebote">
      <div className="section-heading">
        <div>
          <h2>
            Unsere <span>Angebote</span>
          </h2>
          <p>Leckere Vielfalt zu besten Preisen – für jeden Geschmack das Richtige.</p>
        </div>
        <button
          className="section-link"
          onClick={onShowAllOffers}
          aria-label="Alle Angebote ansehen"
        >
          Alle Angebote ansehen <ArrowRight size={14} />
        </button>
      </div>

      <div className="offers-grid">
        {liveOffers.map((offer) => {
          const inStock = offer.is_in_stock !== false;
          return (
            <article className="offer-card" key={offer.id} style={{ opacity: inStock ? 1 : 0.65 }}>
              <div className="offer-image">
                <span className="offer-badge">{offer.code}</span>
                <img src={offer.image} alt={offer.title} loading="lazy" />
                {!inStock && (
                  <span
                    className="offer-badge"
                    style={{ background: '#334155', color: '#ffffff', right: '10px', left: 'auto' }}
                  >
                    Ausverkauft
                  </span>
                )}
              </div>

              <div className="offer-body">
                <h3>{offer.title}</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{offer.description}</p>

                <div className="offer-bottom">
                  <strong>{offer.formattedPrice}</strong>
                  {inStock ? (
                    <button
                      className="small-order"
                      onClick={() =>
                        onAddToCart({
                          id: offer.id,
                          name: `${offer.code} - ${offer.title}`,
                          price: offer.price,
                          image: offer.image,
                          desc: offer.title
                        })
                      }
                    >
                      Jetzt bestellen
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>
                      Nicht vorrätig
                    </span>
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

