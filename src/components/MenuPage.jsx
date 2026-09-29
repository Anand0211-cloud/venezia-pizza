import React, { useState, useMemo } from 'react';

// Shared pizza slice SVG — uses currentColor so color can be customized via CSS
const PIZZA_SLICE_SVG = `<svg viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 6 L6 108 Q60 124 114 108 Z" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M6 108 Q60 124 114 108" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M14 100 Q60 114 106 100" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  <!-- Solid whole circles (pepperoni) -->
  <circle cx="60" cy="42" r="7" fill="currentColor" fill-opacity="0.95"/>
  <circle cx="76" cy="85" r="5" fill="currentColor" fill-opacity="0.9"/>
  <!-- Hollow circles (jalapeños) -->
  <circle cx="38" cy="68" r="6" stroke="currentColor" stroke-width="3.2" fill="none"/>
  <circle cx="82" cy="64" r="5.5" stroke="currentColor" stroke-width="3" fill="none"/>
  <circle cx="46" cy="87" r="4.5" stroke="currentColor" stroke-width="2.8" fill="none"/>
</svg>`;

const TAB_SKETCH_LEFT = PIZZA_SLICE_SVG;
const TAB_SKETCH_RIGHT = PIZZA_SLICE_SVG;


import {
  Search,
  Filter,
  Flame,
  Leaf,
  Plus,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  Info,
  Check,
  ChevronRight,
  Utensils,
  Clock,
  Bike
} from 'lucide-react';
import {
  categoriesData,
  allMenuItems,
  standardPizzaSizes,
  calzoneSizes,
  specialOffersData,
  restaurantInfo
} from '../data/menuData';
import { useLiveMenu } from '../data/liveMenuState';
import CustomizeItemModal from './CustomizeItemModal';

export default function MenuPage({ onAddToCart, onOpenCart, selectedInitialCategory = 'pizza' }) {
  const { menuItems } = useLiveMenu();
  const [activeCategory, setActiveCategory] = useState(
    selectedInitialCategory === 'all' ? 'pizza' : (selectedInitialCategory || 'pizza')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({}); // { [itemId]: sizeKey }

  // Pizza Hut style tabs mapping
  const cleanCategories = [
    { id: 'deals', name: 'Deals', title: 'Spar-Angebote & Kombi-Menüs' },
    { id: 'pizza', name: 'Pizzas', title: 'Original Steinofen-Pizzen (1–49a)' },
    { id: 'calzone', name: 'Melts', title: 'Melts, Calzone & Pizzabrot' },
    { id: 'burger-snacks', name: 'Sides', title: 'Sides, Snacks & Burger' },
    { id: 'pasta', name: 'Pastas', title: 'Pasta & Al Forno Spezialitäten' },
    { id: 'doner', name: 'Döner', title: 'Döner & Fleischgerichte' },
    { id: 'schnitzel', name: 'Schnitzel', title: 'Schnitzel Variationen' },
    { id: 'salad', name: 'Salads', title: 'Frische knackige Salate' },
    { id: 'desserts', name: 'Desserts', title: 'Desserts & Süßspeisen' },
  ];

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category match
      let matchesCategory = true;
      if (activeCategory === 'deals') {
        matchesCategory = false; // rendered separately
      } else if (activeCategory === 'pizza') {
        matchesCategory = item.category === 'pizza';
      } else if (activeCategory === 'calzone') {
        matchesCategory = item.category === 'calzone';
      } else if (activeCategory === 'burger-snacks') {
        matchesCategory = item.category === 'burger-snacks' || item.category === 'burger' || item.category === 'snacks';
      } else if (activeCategory === 'pasta') {
        matchesCategory = item.category === 'pasta';
      } else if (activeCategory === 'doner') {
        matchesCategory = item.category === 'doner';
      } else if (activeCategory === 'schnitzel') {
        matchesCategory = item.category === 'schnitzel';
      } else if (activeCategory === 'salad') {
        matchesCategory = item.category === 'salad';
      } else if (activeCategory === 'desserts') {
        const itemName = (item.name || '').toLowerCase();
        const isDrink = item.category === 'dessert-drinks' && (
          itemName.includes('cola') ||
          itemName.includes('fanta') ||
          itemName.includes('sprite') ||
          itemName.includes('bier') ||
          itemName.includes('wasser') ||
          itemName.includes('wein') ||
          itemName.includes('red bull') ||
          itemName.includes('spezi') ||
          itemName.includes('mezzo')
        );
        matchesCategory = item.category === 'dessert-drinks' && !isDrink;
      } else if (activeCategory === 'drinks') {
        const itemName = (item.name || '').toLowerCase();
        const isDrink = item.category === 'dessert-drinks' && (
          itemName.includes('cola') ||
          itemName.includes('fanta') ||
          itemName.includes('sprite') ||
          itemName.includes('bier') ||
          itemName.includes('wasser') ||
          itemName.includes('wein') ||
          itemName.includes('red bull') ||
          itemName.includes('spezi') ||
          itemName.includes('mezzo')
        );
        matchesCategory = isDrink;
      } else if (activeCategory === 'all') {
        matchesCategory = true;
      } else {
        matchesCategory = item.category === activeCategory;
      }

      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.name_en || '').toLowerCase().includes(q) ||
        (item.number && item.number.toLowerCase().includes(q)) ||
        item.desc?.toLowerCase().includes(q) ||
        item.toppings?.toLowerCase().includes(q);

      // Vegetarian toggle filter
      let matchesDietary = true;
      if (isVegOnly) {
        matchesDietary = item.dietary?.includes('vegetarisch') || item.dietary?.includes('vegan');
      }

      return matchesCategory && matchesSearch && matchesDietary;
    });
  }, [menuItems, activeCategory, searchQuery, isVegOnly]);

  // Dynamic Deals linked to live menu items
  const liveDeals = useMemo(() => {
    return specialOffersData.map((offer) => {
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
        details: live.desc || live.toppings || offer.details,
        price: unitPrice,
        formattedPrice: `${unitPrice.toFixed(2).replace('.', ',')} €`,
        image: live.image || offer.image,
        badge: live.badge || `Angebot ${offer.code}`,
        is_in_stock: live.is_in_stock !== false
      };
    });
  }, [menuItems]);

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

  // Handle direct quick-add (e.g. standard size or selected size)
  const handleQuickAdd = (item) => {
    const sizeOptions = getItemSizeOptions(item);
    const hasSizes = sizeOptions.length > 0;
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
    setSelectedSizes((prev) => ({
      ...prev,
      [itemId]: sizeKey
    }));
  };

  const currentCategoryObj = cleanCategories.find((c) => c.id === activeCategory);

  return (
    <div className="menu-page-container" id="speisekarte">
      {/* Pizza Hut Style Menu Tabs Switch Bar */}
      <div className="pizzahut-tabs-container">
        <div className="pizzahut-tabs-inner">
          <div className="pizzahut-tabs-list">
            {cleanCategories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`pizzahut-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {/* Left: full pizza circle watermark */}
                  <span
                    className="tab-sketch-left"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: TAB_SKETCH_LEFT }}
                  />
                  <span className="pizzahut-tab-text">{cat.name}</span>
                  {/* Right: pizza slice watermark */}
                  <span
                    className="tab-sketch-right"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: TAB_SKETCH_RIGHT }}
                  />
                </button>
              );
            })}
          </div>

          <div className="pizzahut-tabs-right">
            <label className="veg-toggle-label" onClick={() => setIsVegOnly((prev) => !prev)}>
              <span className="veg-indicator-icon">
                <span className="veg-indicator-dot" />
              </span>
              <span>Vegetarian</span>
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={isVegOnly}
              className={`switch-control ${isVegOnly ? 'active' : ''}`}
              onClick={() => setIsVegOnly((prev) => !prev)}
              aria-label="Vegetarisch filtern"
            >
              <span className="switch-thumb" />
            </button>
          </div>
        </div>
      </div>

      {/* Clean Search Controls Section */}
      <section className="menu-controls-section">
        <div className="menu-controls-wrapper">
          <div className="menu-search-box">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Gericht, Zutat oder Nummer suchen (z.B. Margherita, Nr. 18, Salami, Döner, Pasta)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Suche löschen"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Special Offer Highlight Banner - Only shown on Deals tab */}
      {activeCategory === 'deals' && (
        <section className="menu-offers-highlight">
          <div className="offers-banner-inner">
            <div className="offers-banner-text">
              <span className="deal-badge">ANGEBOTE &amp; KOMBI-MENÜS</span>
              <h3>Familien- &amp; Party-Pizzen mit Gratis 1L Cola &amp; gemischtem Salat!</h3>
              <p>Sparen Sie bares Geld mit unseren beliebten Spar-Menüs A1, A2 und A3.</p>
            </div>
            <div className="offers-mini-cards">
              {liveDeals.map((offer) => {
                const inStock = offer.is_in_stock !== false;
                return (
                  <div key={offer.id} className="mini-offer-card" style={{ opacity: inStock ? 1 : 0.6 }}>
                    <div className="mini-offer-code">{offer.code}</div>
                    <div className="mini-offer-info">
                      <strong>{offer.title}</strong>
                      <span>{offer.formattedPrice}</span>
                    </div>
                    {inStock ? (
                      <button
                        className="mini-offer-add-btn"
                        onClick={() => onAddToCart({
                          id: offer.id,
                          name: `${offer.code} - ${offer.title}`,
                          price: offer.price,
                          quantity: 1,
                          image: offer.image,
                          desc: offer.description.replace(/\n/g, ', ')
                        })}
                        title="Angebot in den Warenkorb"
                      >
                        <Plus size={15} />
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>Ausverk.</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}



      {/* Menu Dishes Grid */}
      <section className="menu-items-section">
        <div className="menu-items-header">
          <div>
            <h2 className="section-category-title">
              {currentCategoryObj?.title || currentCategoryObj?.name || 'Speisekarte'}
            </h2>
            <p className="section-category-count">
              {activeCategory === 'deals'
                ? `${liveDeals.length} Spar-Angebote verfügbar`
                : `${filteredItems.length} ${filteredItems.length === 1 ? 'Gericht gefunden' : 'Gerichte verfügbar'}`}
            </p>
          </div>

          {searchQuery && (
            <div className="search-active-pill">
              Suchergebnis für „<strong>{searchQuery}</strong>“
              <button onClick={() => setSearchQuery('')}>Filter aufheben</button>
            </div>
          )}
        </div>

        {activeCategory === 'deals' ? (
          <div className="dishes-grid">
            {liveDeals.map((offer) => {
              const inStock = offer.is_in_stock !== false;
              return (
                <div key={offer.id} className="dish-card" style={{ opacity: inStock ? 1 : 0.65 }}>
                  <div className="dish-card-media">
                    <img src={offer.image} alt={offer.title} loading="lazy" />
                    <span className="dish-badge" style={{ background: 'var(--red)', fontWeight: '900' }}>
                      {offer.badge || `Angebot ${offer.code}`}
                    </span>
                    {!inStock && (
                      <span className="dish-badge" style={{ background: '#334155', color: '#ffffff', right: '10px', left: 'auto' }}>
                        Ausverkauft
                      </span>
                    )}
                  </div>
                  <div className="dish-card-body">
                    <div className="dish-title-row">
                      <h3 className="dish-name">{offer.title}</h3>
                      <span className="dish-price">{offer.formattedPrice}</span>
                    </div>
                    <p className="dish-desc" style={{ whiteSpace: 'pre-line' }}>
                      {offer.details || offer.description}
                    </p>
                    <div className="dish-card-footer" style={{ marginTop: 'auto', paddingTop: '12px' }}>
                      {inStock ? (
                        <button
                          className="add-to-cart-btn"
                          onClick={() => onAddToCart({
                            id: offer.id,
                            name: `${offer.code} - ${offer.title}`,
                            price: offer.price,
                            quantity: 1,
                            image: offer.image,
                            desc: offer.description.replace(/\n/g, ', ')
                          })}
                        >
                          <Plus size={16} />
                          <span>In den Warenkorb</span>
                        </button>
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
        ) : filteredItems.length === 0 ? (
          <div className="empty-menu-state">
            <Utensils size={48} color="#ccc" />
            <h3>Keine Gerichte gefunden</h3>
            <p>Bitte versuchen Sie einen anderen Suchbegriff oder wählen Sie eine andere Kategorie.</p>
            <button
              className="reset-filter-btn"
              onClick={() => {
                setActiveCategory('pizza');
                setSearchQuery('');
                setIsVegOnly(false);
              }}
            >
              Alle Pizzen anzeigen
            </button>
          </div>
        ) : (
          <div className="dishes-grid">
            {filteredItems.map((item) => {
              const sizeOptions = getItemSizeOptions(item);
              const hasSizes = sizeOptions.length > 0;
              const currentSizeKey = selectedSizes[item.id] || (sizeOptions.length > 0 ? sizeOptions[0].key : 'single');

              const currentPrice = getItemCurrentPrice(item, currentSizeKey);

              // Clean badge text (remove emojis)
              const cleanBadge = item.badge?.replace(/[🔥⭐🌱🍔🍰]/g, '').trim();

              const isInStock = item.is_in_stock !== false;

              return (
                <div key={item.id} className="dish-card" style={{ opacity: isInStock ? 1 : 0.65 }}>
                  {/* Image container */}
                  <div className="dish-card-media">
                    <img src={item.image} alt={item.name} loading="lazy" />

                    {item.number && (
                      <span className="dish-badge" style={{ background: 'var(--red)', fontWeight: '900' }}>
                        Nr. {item.number}
                      </span>
                    )}

                    {!isInStock && (
                      <span className="dish-badge" style={{ background: '#334155', color: '#ffffff', fontWeight: '800', right: '10px', left: 'auto' }}>
                        Ausverkauft
                      </span>
                    )}

                    {cleanBadge && isInStock && (
                      <span className={`dish-badge ${item.badge?.includes('Scharf') ? 'spicy' : ''}`} style={{ left: item.number ? '70px' : '10px' }}>
                        {cleanBadge}
                      </span>
                    )}

                    {item.dietary?.includes('vegetarisch') && (
                      <span className="diet-pill veg" title="Vegetarisch">
                        Vegetarisch
                      </span>
                    )}
                  </div>

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

                    {/* Size Selector for Pizzas / Calzones */}
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

                    {/* Card Actions */}
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
                            title="Direkt in den Warenkorb"
                          >
                            <Plus size={16} />
                            <span>In den Warenkorb</span>
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
        )}
      </section>

      {/* Catering / Party Promo Bar */}
      <section className="menu-party-callout">
        <div className="party-callout-card">
          <div className="party-callout-text">
            <span className="party-tag">FÜR FESTE &amp; FIRMEN</span>
            <h3>Große Partys, Geburtstage oder Firmenevents in Plauen?</h3>
            <p>
              Wir liefern ofenfrische Partypizzen (40×60 cm), Familienpizzen (33×46 cm), große Pastableche und reichhaltige Salatplatten pünktlich zu Ihrer Feier!
            </p>
          </div>
          <a
            href={restaurantInfo.phoneCall}
            className="party-call-btn"
          >
            Jetzt anrufen: {restaurantInfo.phone}
          </a>
        </div>
      </section>

      {/* Modal for Item Customization */}
      <CustomizeItemModal
        item={customizingItem}
        isOpen={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}
