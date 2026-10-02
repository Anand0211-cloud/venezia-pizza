import React, { useState, useMemo, useEffect, useRef } from 'react';

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
  ChevronLeft,
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
    selectedInitialCategory === 'all' || !selectedInitialCategory ? 'pizzen' : selectedInitialCategory
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({}); // { [itemId]: sizeKey }

  // Horizontal scroll state & refs for categories tab slider line
  const tabsListRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbRatio, setThumbRatio] = useState(0.18);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateTabScrollState = () => {
    const el = tabsListRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 1) {
      setScrollProgress(Math.max(0, Math.min(1, scrollLeft / maxScroll)));
      setThumbRatio(Math.max(0.1, Math.min(1, clientWidth / scrollWidth)));
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    } else {
      setScrollProgress(0);
      setThumbRatio(1);
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  };

  useEffect(() => {
    updateTabScrollState();
    const handleResize = () => updateTabScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Center active category tab in view whenever it changes
  useEffect(() => {
    if (tabsListRef.current) {
      const activeBtn = tabsListRef.current.querySelector('.pizzahut-tab-btn.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
    }
  }, [activeCategory]);

  const handleScrollBy = (amount) => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleTrackClick = (e) => {
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const el = tabsListRef.current;
    if (el) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      el.scrollTo({ left: clickRatio * maxScroll, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (catId, event) => {
    setActiveCategory(catId);
    if (event?.currentTarget) {
      event.currentTarget.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  };

  // Sync active category if changed externally
  useEffect(() => {
    if (selectedInitialCategory && selectedInitialCategory !== 'all') {
      // Map legacy category IDs if needed
      const idMap = {
        pizza: 'pizzen',
        schnitzel: 'fleischgerichte',
        doner: 'gyros',
        salad: 'salate'
      };
      setActiveCategory(idMap[selectedInitialCategory] || selectedInitialCategory);
    }
  }, [selectedInitialCategory]);

  // Updated 22 menu categories
  const cleanCategories = [
    { id: 'pizzen', name: 'Pizzen', title: 'Original Steinofen-Pizzen (1–49a)' },
    { id: 'pasta', name: 'Pasta', title: 'Klassische Pasta Spezialitäten' },
    { id: 'gnocchi', name: 'Gnocchi', title: 'Gnocchi Spezialitäten' },
    { id: 'pasta-al-forno', name: 'Pasta al Forno', title: 'Pasta al Forno (Überbackene Nudelgerichte)' },
    { id: 'vegetarisch', name: 'Vegetarisch', sub: 'überbacken', title: 'Vegetarisch überbackene Spezialitäten' },
    { id: 'auflaeufe', name: 'Aufläufe', title: 'Feine Aufläufe aus dem Ofen' },
    { id: 'reisgerichte', name: 'Reisgerichte', sub: 'im Ofen überbacken', title: 'Reisgerichte im Ofen überbacken' },
    { id: 'fleischgerichte', name: 'Fleischgerichte', title: 'Herzhafte Fleischgerichte & Schnitzel' },
    { id: 'gyros', name: 'Gyros', title: 'Gyros & Döner Spezialitäten' },
    { id: 'salate', name: 'Salate', title: 'Frische knackige Salate' },
    { id: 'grill-menue', name: 'Grill Menü', title: 'Köstliche Grill-Menüs vom Rost' },
    { id: 'american-food', name: 'American Food', title: 'American Food & Burger Spezialitäten' },
    { id: 'indisch', name: 'Indische', sub: 'Hauptgerichte', title: 'Indische Hauptgerichte & Currys' },
    { id: 'lamm', name: 'Lamm', sub: 'Spezialitäten', title: 'Zarte Lamm Spezialitäten' },
    { id: 'steaks', name: 'Steaks', title: 'Saftige Steaks vom Grill' },
    { id: 'fischgerichte', name: 'Fischgerichte', title: 'Köstliche Fischgerichte & Meeresfrüchte' },
    { id: 'mexikanisch', name: 'Mexikanische', sub: 'Gerichte', title: 'Mexikanische Spezialitäten' },
    { id: 'chinesisch', name: 'Chinesische', sub: 'Gerichte', title: 'Chinesische Spezialitäten aus dem Wok' },
    { id: 'beilagen', name: 'Extra Beilagen', title: 'Extra Beilagen & Saucen' },
    { id: 'toasts', name: 'Toasts', title: 'Knusprige Toast Spezialitäten' },
    { id: 'omelette', name: 'Omelette', sub: 'mit Käse überbacken', title: 'Omelette mit Käse überbacken' },
    { id: 'getraenke', name: 'Getränke', title: 'Erfrischende Getränke' },
  ];

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category match
      let matchesCategory = false;
      const cat = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();

      if (activeCategory === 'pizzen') {
        matchesCategory = cat === 'pizzen' || cat === 'pizza' || cat === 'calzone';
      } else if (activeCategory === 'pasta') {
        matchesCategory = cat === 'pasta' && !cat.includes('forno') && !name.includes('forno') && !name.includes('lasagne');
      } else if (activeCategory === 'gnocchi') {
        matchesCategory = cat === 'gnocchi' || name.includes('gnocchi');
      } else if (activeCategory === 'reisgerichte') {
        matchesCategory = cat === 'reisgerichte' || cat === 'reis' || name.includes('reis') || name.includes('risotto');
      } else if (activeCategory === 'pasta-al-forno') {
        matchesCategory = cat === 'pasta-al-forno' || cat === 'al-forno' || name.includes('al forno') || name.includes('lasagne') || name.includes('cannelloni');
      } else if (activeCategory === 'vegetarisch') {
        matchesCategory = cat === 'vegetarisch' || cat === 'vegetarisch-ueberbacken';
      } else if (activeCategory === 'auflaeufe') {
        matchesCategory = cat === 'auflaeufe' || cat === 'auflauf' || name.includes('auflauf') || name.includes('gratin');
      } else if (activeCategory === 'fleischgerichte') {
        matchesCategory = cat === 'fleischgerichte' || cat === 'schnitzel' || cat === 'fleisch';
      } else if (activeCategory === 'gyros') {
        matchesCategory = cat === 'gyros' || cat === 'doner' || name.includes('gyros') || name.includes('döner');
      } else if (activeCategory === 'salate') {
        matchesCategory = cat === 'salate' || cat === 'salad';
      } else if (activeCategory === 'grill-menue') {
        matchesCategory = cat === 'grill-menue' || cat === 'grill' || name.includes('grill');
      } else if (activeCategory === 'american-food') {
        matchesCategory = cat === 'american-food' || cat === 'burger-snacks' || cat === 'burger' || name.includes('burger') || name.includes('wings') || name.includes('nuggets');
      } else if (activeCategory === 'indisch') {
        matchesCategory = cat === 'indisch' || cat === 'indian' || name.includes('curry') || name.includes('tikka') || name.includes('korma') || name.includes('paneer');
      } else if (activeCategory === 'lamm') {
        matchesCategory = cat === 'lamm' || cat === 'lamb' || name.includes('lamm');
      } else if (activeCategory === 'steaks') {
        matchesCategory = cat === 'steaks' || cat === 'steak' || name.includes('steak');
      } else if (activeCategory === 'fischgerichte') {
        matchesCategory = cat === 'fischgerichte' || cat === 'fisch' || name.includes('lachs') || name.includes('calamari') || name.includes('zander');
      } else if (activeCategory === 'mexikanisch') {
        matchesCategory = cat === 'mexikanisch' || cat === 'mexican' || name.includes('tacos') || name.includes('burrito') || name.includes('enchilada') || name.includes('nachos');
      } else if (activeCategory === 'chinesisch') {
        matchesCategory = cat === 'chinesisch' || cat === 'chinese' || cat === 'asia' || name.includes('chop suey') || name.includes('gebratene nudeln') || name.includes('gebratener reis') || name.includes('süß-sauer');
      } else if (activeCategory === 'beilagen') {
        matchesCategory = cat === 'beilagen' || cat === 'extra-beilagen' || name.includes('pommes') || name.includes('kroketten') || name.includes('knoblauchbrot') || name.includes('zaziki') || name.includes('pizzabrötchen');
      } else if (activeCategory === 'toasts') {
        matchesCategory = cat === 'toasts' || cat === 'toast' || name.includes('toast');
      } else if (activeCategory === 'omelette') {
        matchesCategory = cat === 'omelette' || name.includes('omelett');
      } else if (activeCategory === 'getraenke') {
        matchesCategory = cat === 'getraenke' || cat === 'drinks' || cat === 'dessert-drinks';
      } else if (activeCategory === 'all') {
        matchesCategory = true;
      } else {
        matchesCategory = cat === activeCategory;
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

      // Dietary filter (veg / non-veg / all)
      let matchesDietary = true;
      const isVeg = item.dietary?.includes('vegetarisch') || item.dietary?.includes('vegan');
      if (dietaryFilter === 'veg') {
        matchesDietary = isVeg;
      } else if (dietaryFilter === 'non-veg') {
        matchesDietary = !isVeg;
      }

      return matchesCategory && matchesSearch && matchesDietary;
    });
  }, [menuItems, activeCategory, searchQuery, dietaryFilter]);

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
      {/* Menu Tabs Switch Bar with Domino's style Veg & Non-Veg Filters on Top */}
      <div className="pizzahut-tabs-container">
        {/* Top Filter Bar: Veg Only & Non Veg Only */}
        <div className="menu-dietary-strip">
          <div className="menu-dietary-inner">
            <button
              type="button"
              className={`dietary-filter-pill veg-pill ${dietaryFilter === 'veg' ? 'active' : ''}`}
              onClick={() => setDietaryFilter((prev) => (prev === 'veg' ? 'all' : 'veg'))}
              aria-pressed={dietaryFilter === 'veg'}
            >
              <span className="dietary-icon veg-icon">
                <span className="veg-dot" />
              </span>
              <span className="dietary-text">Veg Only</span>
            </button>

            <button
              type="button"
              className={`dietary-filter-pill nonveg-pill ${dietaryFilter === 'non-veg' ? 'active' : ''}`}
              onClick={() => setDietaryFilter((prev) => (prev === 'non-veg' ? 'all' : 'non-veg'))}
              aria-pressed={dietaryFilter === 'non-veg'}
            >
              <span className="dietary-icon nonveg-icon">
                <span className="nonveg-triangle" />
              </span>
              <span className="dietary-text">Non Veg Only</span>
            </button>
          </div>
        </div>

        {/* Categories Tab Slider */}
        <div className={`pizzahut-tabs-inner ${canScrollLeft ? 'has-overflow-left' : ''} ${canScrollRight ? 'has-overflow-right' : ''}`}>
          <div
            className="pizzahut-tabs-list"
            ref={tabsListRef}
            onScroll={updateTabScrollState}
            id="categories-tab-list"
          >
            {cleanCategories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`pizzahut-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={(e) => handleCategoryClick(cat.id, e)}
                >
                  {/* Left: full pizza circle watermark */}
                  <span
                    className="tab-sketch-left"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: TAB_SKETCH_LEFT }}
                  />
                  <span className="pizzahut-tab-text">
                    <span className="pizzahut-tab-main">{cat.name}</span>
                    {cat.sub && <span className="pizzahut-tab-sub">{cat.sub}</span>}
                  </span>
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
        </div>

        {/* Interactive Slider Line under Categories */}
        <div className="menu-tabs-slider-bar-wrap">
          <div
            className="menu-tabs-slider-track"
            onClick={handleTrackClick}
            title="Klicken oder ziehen für weitere Kategorien"
            role="scrollbar"
            aria-controls="categories-tab-list"
          >
            <div
              className="menu-tabs-slider-thumb"
              style={{
                width: `${Math.max(10, thumbRatio * 100)}%`,
                left: `${scrollProgress * (1 - Math.max(0.10, thumbRatio)) * 100}%`
              }}
            />
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
                setDietaryFilter('all');
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
      {customizingItem && (
        <CustomizeItemModal
          item={customizingItem}
          isOpen={true}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
}
