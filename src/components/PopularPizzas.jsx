import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, SlidersHorizontal, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { popularPizzasData, standardPizzaSizes, calzoneSizes, allMenuItems } from '../data/menuData';
import { useLiveMenu, formatMenuItemFromDb } from '../data/liveMenuState';
import { getMenuItems, subscribeToMenuItems } from '../lib/supabaseClient.js';
import CustomizeItemModal from './CustomizeItemModal';

function DishCardMedia({ item, isInStock = true, cleanBadge = '', onOpenModal = null }) {
  const images = (Array.isArray(item.images) && item.images.length > 0)
    ? item.images
    : [item.image_url || item.image || ''];
  const [currentIdx, setCurrentIdx] = useState(0);

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="dish-card-media"
      onClick={onOpenModal || undefined}
      style={{ position: 'relative', cursor: onOpenModal ? 'pointer' : 'default', overflow: 'hidden' }}
    >
      <img
        src={images[currentIdx] || images[0] || ''}
        alt={item.name}
        onError={(e) => {
          e.currentTarget.onerror = null;
          if (item.image && e.currentTarget.src !== item.image) {
            e.currentTarget.src = item.image;
          }
        }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.25s ease' }}
      />

      {/* Multiple images controls */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevImage}
            aria-label="Vorheriges Bild"
            title="Vorheriges Foto"
            style={{
              position: 'absolute',
              left: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.78)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(3px)'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={nextImage}
            aria-label="Nächstes Bild"
            title="Nächstes Foto"
            style={{
              position: 'absolute',
              right: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.78)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(3px)'
            }}
          >
            <ChevronRight size={16} />
          </button>

          {/* Dots Indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '4px',
              zIndex: 4,
              background: 'rgba(15, 23, 42, 0.65)',
              padding: '3px 8px',
              borderRadius: '12px',
              backdropFilter: 'blur(3px)'
            }}
          >
            {images.map((_, i) => (
              <span
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIdx(i);
                }}
                style={{
                  width: i === currentIdx ? '12px' : '5px',
                  height: '5px',
                  borderRadius: '3px',
                  background: i === currentIdx ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>

          {/* Multi-Photo Counter Badge */}
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(15, 23, 42, 0.78)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '800',
              padding: '2px 7px',
              borderRadius: '6px',
              zIndex: 4,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(3px)'
            }}
          >
            <Camera size={11} /> {currentIdx + 1}/{images.length}
          </span>
        </>
      )}

      {item.number && (
        <span className="dish-badge" style={{ background: 'var(--red)', fontWeight: '900', zIndex: 3 }}>
          Nr. {item.number}
        </span>
      )}

      {!isInStock && (
        <span className="dish-badge" style={{ background: '#334155', color: '#ffffff', fontWeight: '800', right: '10px', left: 'auto', zIndex: 3 }}>
          Ausverkauft
        </span>
      )}

      {cleanBadge && isInStock && (
        <span className={`dish-badge ${item.badge?.includes('Scharf') ? 'spicy' : ''}`} style={{ left: item.number ? '70px' : '10px', zIndex: 3 }}>
          {cleanBadge}
        </span>
      )}

      {item.dietary?.includes('vegetarisch') && (
        <span className="diet-pill veg" title="Vegetarisch" style={{ zIndex: 3 }}>
          Vegetarisch
        </span>
      )}
    </div>
  );
}

export default function PopularPizzas({ onAddToCart, onShowAllMenu }) {
  const { menuItems: liveMenuItems } = useLiveMenu();
  const [directMenuItems, setDirectMenuItems] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [customizingItem, setCustomizingItem] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchDirect = async () => {
      try {
        const data = await getMenuItems();
        if (data && data.length > 0 && mounted) {
          const localMap = new Map((allMenuItems || []).filter(i => i && i.id).map((i) => [i.id, i]));
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
  const menuItems = rawMenuItems || [];

  const matchedPizzas = popularPizzasData
    .map(p => {
      const live = menuItems.find(m => m.id === p.id || (m.number && String(m.number).trim() === String(p.number || p.id.replace('pizza-', '')).trim()));
      const fallbackFromAll = (allMenuItems || []).find(m => m.id === p.id || (m.number && String(m.number).trim() === String(p.number || p.id.replace('pizza-', '')).trim()));
      const source = live || fallbackFromAll || p;
      if (!source) return null;

      const imagesList = Array.isArray(source.images) && source.images.length > 0
        ? source.images
        : (Array.isArray(live?.images) && live.images.length > 0 ? live.images : [source.image_url || source.image || p.image || '']);

      const defaultPrices = source.prices || { small: 9.00, large: 10.80, family: 18.60, party: 22.70 };

      return {
        ...p,
        ...fallbackFromAll,
        ...source,
        id: source.id || p.id,
        number: source.number || p.number,
        name: source.name || p.name,
        toppings: source.toppings || source.desc || p.ingredients,
        desc: source.desc || source.toppings || p.ingredients,
        prices: defaultPrices,
        price: Number(defaultPrices.small || defaultPrices.single || source.price || 9.0),
        sizesAvailable: source.sizesAvailable !== undefined ? source.sizesAvailable : true,
        calzoneSizes: source.calzoneSizes || false,
        supportsAmerican: source.supportsAmerican !== undefined ? source.supportsAmerican : true,
        image: imagesList[0],
        image_url: imagesList[0],
        images: imagesList,
        badge: source.badge !== undefined ? source.badge : p.badge,
        is_in_stock: source.is_in_stock !== false
      };
    })
    .filter(Boolean);

  // If none matched, fallback to first 4 pizzas from menuItems
  const livePizzas = matchedPizzas.length > 0
    ? matchedPizzas
    : (menuItems || []).filter(m => m.category === 'pizzen' || m.category === 'pizza').slice(0, 4).map(live => {
        const imagesList = Array.isArray(live.images) && live.images.length > 0 ? live.images : [live.image_url || live.image || ''];
        const defaultPrices = live.prices || { small: 9.00, large: 10.80, family: 18.60, party: 22.70 };
        return {
          ...live,
          id: live.id,
          number: live.number,
          name: live.name,
          toppings: live.toppings || live.desc,
          desc: live.desc || live.toppings,
          prices: defaultPrices,
          price: Number(defaultPrices.small || defaultPrices.single || live.price || 9.0),
          sizesAvailable: live.sizesAvailable !== undefined ? live.sizesAvailable : true,
          supportsAmerican: live.supportsAmerican !== undefined ? live.supportsAmerican : true,
          image: imagesList[0],
          image_url: imagesList[0],
          images: imagesList,
          badge: live.badge || '',
          is_in_stock: live.is_in_stock !== false
        };
      });

  // Helper to extract all portion sizes (standard + custom portions added by admin)
  const getItemSizeOptions = (item) => {
    if (!item) return [];
    const customSizes = (item.prices?.custom_sizes || item.custom_sizes || []).filter(s => s && s.enabled !== false);
    const baseStandardSizes = item.calzoneSizes ? calzoneSizes : (item.sizesAvailable ? standardPizzaSizes : []);
    const standardSizeOptions = baseStandardSizes.filter(s => item.prices && item.prices[s.key] !== undefined && item.prices[s.key] !== null && item.prices[s.key] !== '');
    return [
      ...standardSizeOptions,
      ...customSizes.map(cs => ({
        id: cs.key || cs.id,
        key: cs.key || cs.id,
        name: cs.name,
        dim: cs.dim || cs.dimension || '',
        price: Number(cs.price)
      }))
    ];
  };

  const getItemCurrentPrice = (item, sizeKey) => {
    if (!item) return 0;
    const customSizes = (item.prices?.custom_sizes || item.custom_sizes || []).filter(s => s && s.enabled !== false);
    const customMatch = customSizes.find(cs => (cs.key || cs.id) === sizeKey);
    if (customMatch) return Number(customMatch.price);
    return item.prices ? (item.prices[sizeKey] || item.prices.single || item.price) : item.price;
  };

  // Handle direct quick-add with selected size
  const handleQuickAdd = (item) => {
    const sizeOptions = getItemSizeOptions(item);
    const sizeKey = selectedSizes[item.id] || (sizeOptions.length > 0 ? sizeOptions[0].key : 'single');
    const sizeObj = sizeOptions.find((s) => s.key === sizeKey);

    const unitPrice = getItemCurrentPrice(item, sizeKey);
    let itemName = item.number ? `Nr. ${item.number} ${item.name}` : item.name;
    if (sizeObj) {
      itemName += ` (${sizeObj.name}${sizeObj.dim ? ' ' + sizeObj.dim : ''})`;
    }

    const cartItem = {
      id: `${item.id}-${sizeKey}-${Date.now()}`,
      name: itemName,
      price: unitPrice,
      quantity: 1,
      image: item.image,
      desc: item.toppings || item.desc
    };

    onAddToCart(cartItem);
  };

  const handleSizeChange = (itemId, sizeKey) => {
    setSelectedSizes(prev => ({ ...prev, [itemId]: sizeKey }));
  };

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

      <div className="dishes-grid">
        {livePizzas.map((item) => {
          const sizeOptions = getItemSizeOptions(item);
          const hasSizes = sizeOptions.length > 0;
          const currentSizeKey = selectedSizes[item.id] || (sizeOptions.length > 0 ? sizeOptions[0].key : 'single');

          const currentPrice = getItemCurrentPrice(item, currentSizeKey);
          const cleanBadge = item.badge?.replace(/[🔥⭐🌱🍔🍰]/g, '').trim();
          const isInStock = item.is_in_stock !== false;

          return (
            <div key={item.id} className="dish-card" style={{ opacity: isInStock ? 1 : 0.65 }}>
              {/* Image container with multi-image navigation support */}
              <DishCardMedia
                item={item}
                isInStock={isInStock}
                cleanBadge={cleanBadge}
                onOpenModal={() => setCustomizingItem(item)}
              />

              {/* Body Content */}
              <div className="dish-card-body">
                <div className="dish-title-row">
                  <h3 className="dish-name">{item.name}</h3>
                  <span className="dish-price">
                    {currentPrice ? `${currentPrice.toFixed(2).replace('.', ',')} €` : ''}
                  </span>
                </div>

                <p className="dish-desc">
                  <strong>Belag: </strong>{item.toppings || item.desc}
                </p>

                {/* Size Selector */}
                {hasSizes && sizeOptions.length > 0 && (
                  <div className="pizza-size-pills">
                    <span className="size-label">Größe:</span>
                    <div className="size-buttons-group">
                      {sizeOptions.map((size) => {
                        const isSizeSelected = currentSizeKey === size.key;
                        const sizePrice = size.price !== undefined && size.price !== null ? size.price : (item.prices ? item.prices[size.key] : null);
                        return (
                          <button
                            key={size.id}
                            type="button"
                            disabled={!isInStock}
                            className={`size-btn ${isSizeSelected ? 'selected' : ''}`}
                            onClick={() => handleSizeChange(item.id, size.key)}
                            title={`${size.name}${size.dim ? ' (' + size.dim + ')' : ''} - ${sizePrice ? Number(sizePrice).toFixed(2).replace('.', ',') + ' €' : ''}`}
                          >
                            {size.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Card Actions: Customize + Add to Cart */}
                <div className="dish-card-actions">
                  {isInStock ? (
                    <>
                      <button
                        type="button"
                        className="customize-btn"
                        onClick={() => setCustomizingItem(item)}
                        title="Zutaten, Größe, American Crust oder Extras anpassen"
                      >
                        <SlidersHorizontal size={14} />
                        <span>Anpassen</span>
                      </button>

                      <button
                        type="button"
                        className="add-cart-btn"
                        onClick={() => handleQuickAdd(item)}
                        title="Hinzufügen"
                      >
                        <Plus size={16} />
                        <span>Hinzufügen</span>
                      </button>
                    </>
                  ) : (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        background: '#f1f5f9',
                        color: '#64748b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'not-allowed',
                        textAlign: 'center'
                      }}
                    >
                      Derzeit nicht verfügbar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Item Customization */}
      {customizingItem && (
        <CustomizeItemModal
          item={customizingItem}
          isOpen={true}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </section>
  );
}
