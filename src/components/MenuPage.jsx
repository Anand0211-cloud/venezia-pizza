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
  Bike,
  Camera
} from 'lucide-react';
import {
  categoriesData,
  allMenuItems,
  standardPizzaSizes,
  calzoneSizes,
  specialOffersData,
  restaurantInfo
} from '../data/menuData';
import { useLiveMenu, formatMenuItemFromDb, getItemCanonicalCategory, isSideDishCategory, isSaladCategory, getSideDishType, isDealItem, isPizzaVeneziaCustom } from '../data/liveMenuState';
import {
  subscribeToStorageFolders,
  loadStorageFolders,
  applyCategoryStorageImages,
  DEFAULT_STORAGE_FOLDERS
} from '../lib/categoryStorageService';
import CustomizeItemModal from './CustomizeItemModal';
import SideDishModal from './SideDishModal';
import SaladDressingModal from './SaladDressingModal';
import { supabase, isSupabaseConfigured, getMenuItems, subscribeToMenuItems } from '../lib/supabaseClient.js';
import { getStoredCategories, fetchCategoriesFromSupabase, subscribeToCategories } from '../lib/categoryManager.js';

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

export default function MenuPage({ onAddToCart, onOpenCart, selectedInitialCategory = 'pizza' }) {
  const { menuItems: liveMenuItems } = useLiveMenu();
  const [directMenuItems, setDirectMenuItems] = useState(null);

  // Directly fetch fresh items from Supabase on mount and on admin save / realtime events
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
        console.error('[MenuPage] Direct fetch error:', err);
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
  const [storageFolders, setStorageFolders] = useState(() => ({ ...DEFAULT_STORAGE_FOLDERS }));

  useEffect(() => {
    const unsub = subscribeToStorageFolders((folders) => {
      if (folders) setStorageFolders(folders);
    });
    loadStorageFolders().then((folders) => {
      if (folders) setStorageFolders(folders);
    });
    return unsub;
  }, []);

  const [activeCategory, setActiveCategory] = useState(
    selectedInitialCategory === 'all' || !selectedInitialCategory ? 'pizzen' : selectedInitialCategory
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const [customizingItem, setCustomizingItem] = useState(null);
  const [sideDishModalItem, setSideDishModalItem] = useState(null);
  const [saladDressingModalItem, setSaladDressingModalItem] = useState(null);
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
        doner: 'gyros',
        salad: 'salate'
      };
      setActiveCategory(idMap[selectedInitialCategory] || selectedInitialCategory);
    }
  }, [selectedInitialCategory]);

  // Dynamic menu categories (synced 100% with Admin Panel & Supabase)
  const [cleanCategories, setCleanCategories] = useState(getStoredCategories);

  useEffect(() => {
    let mounted = true;
    fetchCategoriesFromSupabase().then((cats) => {
      if (mounted && Array.isArray(cats) && cats.length > 0) {
        setCleanCategories(cats);
      }
    });
    const unsub = subscribeToCategories((cats) => {
      if (mounted && Array.isArray(cats) && cats.length > 0) {
        setCleanCategories(cats);
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Filter items strictly matching backend / admin categorization (no accidental cross-category duplicates)
  const filteredItems = useMemo(() => {
    const matched = (menuItems || []).filter((item) => {
      if (!item) return false;
      // Category match - 100% parity with Admin Panel categories
      const itemCat = getItemCanonicalCategory(item);
      let matchesCategory = false;
      if (activeCategory === 'all') {
        matchesCategory = true;
      } else if (activeCategory === 'pizzen') {
        matchesCategory = itemCat === 'pizzen' || itemCat === 'pizza' || itemCat === 'calzone';
      } else {
        matchesCategory = itemCat === activeCategory;
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
    }).sort((a, b) => {
      const numA = parseInt(a.number, 10);
      const numB = parseInt(b.number, 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return String(a.number || '').localeCompare(String(b.number || ''), undefined, { numeric: true });
    });

    return applyCategoryStorageImages(activeCategory, matched, storageFolders);
  }, [menuItems, activeCategory, searchQuery, dietaryFilter, storageFolders]);

  // Dynamic Deals strictly synced from Supabase database menu items
  const liveDeals = useMemo(() => {
    const dbDeals = (menuItems || []).filter(item => getItemCanonicalCategory(item) === 'deals');
    if (dbDeals.length > 0) {
      return dbDeals.map((item) => {
        const code = item.number || item.id;
        const unitPrice = typeof item.price === 'number'
          ? item.price
          : (item.prices?.single || 25.0);

        const imagesList = Array.isArray(item.images) && item.images.length > 0
          ? item.images
          : [item.image_url || item.image || '/images/Offer1.png'];

        return {
          ...item,
          id: item.id,
          code,
          title: item.name,
          name: item.name,
          description: item.desc || item.toppings || '',
          details: item.toppings || item.desc || '',
          toppings: item.toppings || item.desc || '',
          price: unitPrice,
          prices: item.prices || { single: unitPrice },
          formattedPrice: `${unitPrice.toFixed(2).replace('.', ',')} €`,
          image: imagesList[0],
          image_url: imagesList[0],
          images: imagesList,
          badge: item.badge || `Angebot ${code}`,
          is_in_stock: item.is_in_stock !== false
        };
      });
    }

    // Fallback only if no deals returned from DB
    return specialOffersData.map((offer) => {
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
          toppings: offer.description || ''
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
    if (isDealItem(item) || isPizzaVeneziaCustom(item)) {
      setCustomizingItem(item);
      return;
    }
    if (isSideDishCategory(item)) {
      setSideDishModalItem(item);
      return;
    }
    if (isSaladCategory(item)) {
      setSaladDressingModalItem(item);
      return;
    }

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

  const displayCategories = useMemo(() => {
    return (cleanCategories || []).map((cat) => {
      const match = categoriesData.find((cd) => cd.id === cat.id);
      return {
        ...match,
        ...cat,
        id: cat.id,
        name: cat.name || cat.name_de || match?.name || cat.id,
        sub: match?.sub || cat.sub || '',
        title: cat.title || match?.title || cat.name || ''
      };
    });
  }, [cleanCategories]);

  const currentCategoryObj = displayCategories.find((c) => c.id === activeCategory);

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
            {displayCategories.map((cat) => {
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
                        onClick={() => setCustomizingItem(offer)}
                        title="Hinzufügen & Wunschzutaten anpassen"
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
            {(activeCategory === 'indisch' || activeCategory === 'lamm') && (
              <div
                className="section-category-sidedish-banner"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                  color: 'var(--red)',
                  border: '1.5px solid #fecdd3',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '14px',
                  fontWeight: '800',
                  marginTop: '6px',
                  marginBottom: '8px',
                  boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)'
                }}
              >
                <span>🍚</span>
                <span>Alle Gerichte mit Reis oder Pizzabrot</span>
              </div>
            )}
            {(activeCategory === 'fleischgerichte' || activeCategory === 'gyros') && (
              <div
                className="section-category-sidedish-banner"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                  color: 'var(--red)',
                  border: '1.5px solid #fecdd3',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '14px',
                  fontWeight: '800',
                  marginTop: '6px',
                  marginBottom: '8px',
                  boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)'
                }}
              >
                <span>🍟</span>
                <span>Alle Gerichte mit Pommes frites, Bratkartoffeln, Kartoffelsalat oder Kroketten und kleinem Salat.</span>
              </div>
            )}
            {(activeCategory === 'manzo-vom-rind' || activeCategory === 'pesce-fisch') && (
              <div
                className="section-category-sidedish-banner"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                  color: 'var(--red)',
                  border: '1.5px solid #fecdd3',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '14px',
                  fontWeight: '800',
                  marginTop: '6px',
                  marginBottom: '8px',
                  boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)'
                }}
              >
                <span>{activeCategory === 'pesce-fisch' ? '🐟' : '🥩'}</span>
                <span>Alle Gerichte mit Pommes frites, Bratkartoffeln oder Kroketten und kleinem Salat.</span>
              </div>
            )}
            {(activeCategory === 'salate' || activeCategory === 'salad') && (
              <div
                className="section-category-sidedish-banner"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  color: '#15803d',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '14px',
                  fontWeight: '800',
                  marginTop: '6px',
                  marginBottom: '8px',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)'
                }}
              >
                <span>🥗</span>
                <span>Mit Essig &amp; Öl, Sahne-Kräuter oder Joghurt-Dressing.</span>
              </div>
            )}
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
                  <DishCardMedia
                    item={offer}
                    isInStock={inStock}
                    cleanBadge={offer.badge || `Angebot ${offer.code}`}
                    onOpenModal={() => setCustomizingItem(offer)}
                  />
                  <div className="dish-card-body">
                    <div className="dish-title-row">
                      <h3 className="dish-name">{offer.title}</h3>
                      <span className="dish-price">{offer.formattedPrice}</span>
                    </div>
                    <p className="dish-desc" style={{ whiteSpace: 'pre-line' }}>
                      {offer.details || offer.description}
                    </p>
                    <div className="dish-card-actions">
                      {inStock ? (
                        <>
                          <button
                            type="button"
                            className="customize-btn"
                            onClick={() => setCustomizingItem(offer)}
                            title="Zutaten, Getränke & Wünsche anpassen"
                          >
                            <SlidersHorizontal size={14} />
                            <span>Anpassen</span>
                          </button>

                          <button
                            type="button"
                            className="add-cart-btn"
                            title="Hinzufügen"
                            onClick={() => setCustomizingItem(offer)}
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
                  {/* Image container with multi-image navigation support */}
                  <DishCardMedia
                    item={item}
                    isInStock={isInStock}
                    cleanBadge={cleanBadge}
                    onOpenModal={() => {
                      if (isSideDishCategory(item)) {
                        setSideDishModalItem(item);
                      } else if (isSaladCategory(item)) {
                        setSaladDressingModalItem(item);
                      } else {
                        setCustomizingItem(item);
                      }
                    }}
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

                    {/* Side dish indicator badge */}
                    {(() => {
                      const sideType = getSideDishType(item);
                      if (sideType === 'indian_lamb') {
                        return (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            marginBottom: '10px'
                          }}>
                            <span>🍚</span>
                            <span>Inkl. Reis oder Pizzabrot</span>
                          </div>
                        );
                      }
                      if (sideType === 'meat_gyros' || sideType === 'manzo_pesce') {
                        return (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            marginBottom: '10px'
                          }}>
                            <span>🍟</span>
                            <span>Inkl. Beilage nach Wahl &amp; kleiner Salat</span>
                          </div>
                        );
                      }
                      if (isSaladCategory(item)) {
                        return (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            marginBottom: '10px'
                          }}>
                            <span>🥗</span>
                            <span>Mit Essig &amp; Öl, Sahne-Kräuter oder Joghurt-Dressing</span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Card Actions */}
                    <div className="dish-card-actions">
                      {isInStock ? (
                        <>
                          <button
                            type="button"
                            className="customize-btn"
                            onClick={() => {
                              if (isSideDishCategory(item)) {
                                setSideDishModalItem(item);
                              } else if (isSaladCategory(item)) {
                                setSaladDressingModalItem(item);
                              } else {
                                setCustomizingItem(item);
                              }
                            }}
                            title={isSideDishCategory(item) ? "Beilage wählen" : isSaladCategory(item) ? "Dressing wählen" : "Zutaten, Größe, American Crust oder Extras anpassen"}
                          >
                            <SlidersHorizontal size={14} />
                            <span>Anpassen</span>
                          </button>

                          <button
                            type="button"
                            className="add-cart-btn"
                            onClick={() => {
                              if (isDealItem(item) || isPizzaVeneziaCustom(item)) {
                                setCustomizingItem(item);
                              } else if (isSideDishCategory(item)) {
                                setSideDishModalItem(item);
                              } else if (isSaladCategory(item)) {
                                setSaladDressingModalItem(item);
                              } else {
                                handleQuickAdd(item);
                              }
                            }}
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

      {/* Modal for Indian & Lamb Side Dish Selection */}
      {sideDishModalItem && (
        <SideDishModal
          item={sideDishModalItem}
          isOpen={true}
          onClose={() => setSideDishModalItem(null)}
          onAddToCart={onAddToCart}
        />
      )}

      {/* Modal for Salad Dressing Selection */}
      {saladDressingModalItem && (
        <SaladDressingModal
          item={saladDressingModalItem}
          isOpen={true}
          onClose={() => setSaladDressingModalItem(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
}
