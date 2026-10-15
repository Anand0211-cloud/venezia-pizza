import React, { useState } from 'react';
import { ArrowRight, SlidersHorizontal, Plus } from 'lucide-react';
import { specialOffersData } from '../data/menuData';
import { useLiveMenu } from '../data/liveMenuState';
import CustomizeItemModal from './CustomizeItemModal';

export default function SpecialOffers({ onAddToCart, onShowAllOffers }) {
  const { menuItems } = useLiveMenu();
  const [customizingOffer, setCustomizingOffer] = useState(null);

  const dbDeals = (menuItems || []).filter(item => {
    return item.category === 'deals' || item.id?.startsWith('A') || item.id?.startsWith('offer-');
  });

  const liveOffers = dbDeals.length > 0
    ? dbDeals.map(live => {
        const code = live.number || live.id;
        const unitPrice = typeof live.price === 'number'
          ? live.price
          : (live.prices?.single || 25.0);

        const imagesList = Array.isArray(live.images) && live.images.length > 0
          ? live.images
          : [live.image_url || live.image || '/images/Offer1.png'];

        return {
          ...live,
          id: live.id,
          code,
          title: live.name,
          name: live.name,
          description: live.desc || live.toppings || '',
          details: live.toppings || live.desc || '',
          toppings: live.toppings || live.desc || '',
          price: unitPrice,
          prices: live.prices || { single: unitPrice },
          formattedPrice: `${unitPrice.toFixed(2).replace('.', ',')} €`,
          image: imagesList[0],
          image_url: imagesList[0],
          images: imagesList,
          is_in_stock: live.is_in_stock !== false,
          category: 'deals'
        };
      })
    : specialOffersData.map((offer) => {
        const live = menuItems.find(
          (m) => m.id === offer.id || (m.number && m.number.toUpperCase() === offer.code.toUpperCase())
        );
        if (!live) {
          return {
            ...offer,
            name: offer.title,
            prices: { single: offer.price },
            formattedPrice: `${offer.price.toFixed(2).replace('.', ',')} €`,
            is_in_stock: true,
            toppings: offer.description || '',
            category: 'deals'
          };
        }

        const unitPrice = typeof live.price === 'number'
          ? live.price
          : (live.prices?.single || offer.price);

        const imagesList = Array.isArray(live.images) && live.images.length > 0
          ? live.images
          : [live.image_url || live.image || offer.image];

        return {
          ...offer,
          ...live,
          id: offer.id,
          code: offer.code,
          title: offer.title || live.name,
          name: offer.title || live.name,
          description: offer.description || (live.desc ? live.desc.replace(/\n\+?\s*/g, ' • ') : offer.description),
          details: offer.details || live.desc || live.toppings,
          toppings: offer.details || live.desc || live.toppings,
          price: unitPrice,
          prices: live?.prices || { single: unitPrice },
          formattedPrice: `${unitPrice.toFixed(2).replace('.', ',')} €`,
          image: imagesList[0],
          image_url: imagesList[0],
          images: imagesList,
          badge: live.badge || `Angebot ${offer.code}`,
          is_in_stock: live.is_in_stock !== false,
          category: 'deals'
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
              <div
                className="offer-image"
                onClick={() => inStock && setCustomizingOffer(offer)}
                style={{ cursor: inStock ? 'pointer' : 'default' }}
              >
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
                <p className="offer-desc">
                  {offer.description ? offer.description.replace(/\n\+?\s*/g, ' • ') : ''}
                </p>

                <div className="offer-bottom">
                  <strong>{offer.formattedPrice}</strong>
                  {inStock ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="customize-btn"
                        onClick={() => setCustomizingOffer(offer)}
                        title="Zutaten, Getränke & Wünsche anpassen"
                      >
                        <SlidersHorizontal size={13} />
                        <span>Anpassen</span>
                      </button>

                      <button
                        className="small-order"
                        onClick={() => setCustomizingOffer(offer)}
                        title="Wunschzutaten & Extras anpassen"
                      >
                        <Plus size={14} style={{ marginRight: '4px' }} />
                        Hinzufügen
                      </button>
                    </div>
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

      {/* Offer / Combo Customization Modal */}
      {customizingOffer && (
        <CustomizeItemModal
          item={customizingOffer}
          isOpen={Boolean(customizingOffer)}
          onClose={() => setCustomizingOffer(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </section>
  );
}

