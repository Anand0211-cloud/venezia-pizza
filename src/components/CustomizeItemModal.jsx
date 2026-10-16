import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, Check, ShoppingBag, Sparkles, ShieldAlert, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import {
  standardPizzaSizes,
  calzoneSizes,
  americanCrustPrices,
  extraToppingPriceBySize,
  pizzaExtraToppingsList
} from '../data/menuData';
import { isSideDishCategory, getSideDishType, isDealItem, isPizzaVeneziaCustom, isA1Familienpizza, isA2Partypizza, getItemCanonicalCategory } from '../data/liveMenuState';
import './CustomizeItemModal.css';

export default function CustomizeItemModal({ item, isOpen, onClose, onAddToCart }) {
  const customSizes = (item?.prices?.custom_sizes || item?.custom_sizes || []).filter(s => s && s.enabled !== false);
  const baseStandardSizes = item?.calzoneSizes ? calzoneSizes : (item?.sizesAvailable ? standardPizzaSizes : []);
  const standardSizeOptions = baseStandardSizes.filter(s => item?.prices && item.prices[s.key] !== undefined && item.prices[s.key] !== null && item.prices[s.key] !== '');
  const sizeOptions = [
    ...standardSizeOptions,
    ...customSizes.map(cs => ({
      id: cs.key || cs.id,
      key: cs.key || cs.id,
      name: cs.name,
      dim: cs.dim || cs.dimension || '',
      price: Number(cs.price)
    }))
  ];
  const hasSizes = sizeOptions.length > 0;

  const [selectedSize, setSelectedSize] = useState(null);
  const [isAmericanStyle, setIsAmericanStyle] = useState(false);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [sideDish, setSideDish] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Synchronize state when opening modal with a specific item
  useEffect(() => {
    if (isOpen && item) {
      setSelectedSize(sizeOptions.length > 0 ? sizeOptions[0] : null);
      setIsAmericanStyle(false);
      setSelectedToppings([]);
      setSideDish('');
      setQuantity(1);
      setSpecialInstructions('');
      setActiveImageIdx(0);
    }
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const activeSize = selectedSize || (sizeOptions.length > 0 ? sizeOptions[0] : null);
  const currentSizeKey = activeSize?.key || 'small';
  const customSizeMatch = customSizes.find(cs => (cs.key || cs.id) === currentSizeKey);
  let basePrice = customSizeMatch
    ? Number(customSizeMatch.price)
    : (item.prices ? (item.prices[currentSizeKey] || item.prices.single || 0) : (item.price || 0));

  // American crust upgrade cost
  const americanCost = (isAmericanStyle && item.supportsAmerican) ? (americanCrustPrices[currentSizeKey] || 3.00) : 0;

  // Extra toppings cost according to size
  const singleToppingCost = extraToppingPriceBySize[currentSizeKey] || 2.50;

  // Retrieve any custom toppings registered globally or on this dish
  let registeredCustomToppings = [];
  try {
    const saved = localStorage.getItem('venezia_custom_toppings');
    if (saved) registeredCustomToppings = JSON.parse(saved);
  } catch (e) {}
  if (Array.isArray(item.custom_toppings)) {
    registeredCustomToppings = [...registeredCustomToppings, ...item.custom_toppings];
  }
  if (Array.isArray(item.prices?.custom_toppings)) {
    registeredCustomToppings = [...registeredCustomToppings, ...item.prices.custom_toppings];
  }

  // Deduplicate pool
  const fullToppingsPool = [...pizzaExtraToppingsList];
  registeredCustomToppings.forEach(ct => {
    if (!fullToppingsPool.some(t => t.id === ct.id)) {
      fullToppingsPool.push(ct);
    }
  });

  const allowedList = Array.isArray(item.allowed_toppings)
    ? item.allowed_toppings
    : (item.prices?.allowed_toppings || null);

  const availableToppings = allowedList !== null
    ? fullToppingsPool.filter(t => allowedList.includes(t.id) || registeredCustomToppings.some(ct => ct.id === t.id && allowedList.includes(ct.id)))
    : fullToppingsPool;

  const isDeal = isDealItem(item);
  const isCustomPizza = isPizzaVeneziaCustom(item);
  const has5FreeToppings = isDeal || isCustomPizza;
  const isA1 = isA1Familienpizza(item);
  const isA2 = isA2Partypizza(item);

  const canonicalCategory = getItemCanonicalCategory(item);
  const rawCat = String(item?.category_id || item?.category || item?.prices?.frontend_category || item?.frontend_category || '').toLowerCase().trim();
  const isPasta = canonicalCategory === 'pasta' || rawCat === 'pasta';

  // Extra toppings cost calculation
  // For Pizza Nr. 46 (Pizza Venezia): first 5 ingredients free in all sizes; starting from 6th: Small €2.50, Large €3.00, Family €4.00, Party €5.00
  // For A1 "Familienpizza Angebot": first 5 ingredients free, starting from 6th charge €4.00 per additional ingredient
  // For A2 "Partypizza Angebot": first 5 ingredients free, starting from 6th charge €5.00 per additional ingredient
  // For other deals: up to 5 ingredients free, starting from 6th charge €2.50 per additional ingredient
  let dealExtraPrice = 2.50;
  if (isCustomPizza) {
    const sizeNorm = String(currentSizeKey || '').toLowerCase();
    if (sizeNorm.includes('party')) {
      dealExtraPrice = 5.00;
    } else if (sizeNorm.includes('famil') || sizeNorm.includes('33')) {
      dealExtraPrice = 4.00;
    } else if (sizeNorm.includes('larg') || sizeNorm.includes('gro') || sizeNorm.includes('30')) {
      dealExtraPrice = 3.00;
    } else if (sizeNorm.includes('small') || sizeNorm.includes('klein') || sizeNorm.includes('26')) {
      dealExtraPrice = 2.50;
    } else {
      dealExtraPrice = extraToppingPriceBySize[currentSizeKey] || 2.50;
    }
  } else if (isA2) {
    dealExtraPrice = 5.00;
  } else if (isA1) {
    dealExtraPrice = 4.00;
  }
  const dealExtraPriceFormatted = dealExtraPrice.toFixed(2).replace('.', ',');

  const dealExtraCount = Math.max(0, selectedToppings.length - 5);
  const toppingsTotal = has5FreeToppings
    ? dealExtraCount * dealExtraPrice
    : selectedToppings.reduce((sum, t) => {
        const cost = (typeof t.price === 'number' && t.price > 0) ? t.price : singleToppingCost;
        return sum + cost;
      }, 0);

  const finalUnitPrice = basePrice + americanCost + toppingsTotal;
  const totalPrice = finalUnitPrice * quantity;

  const toggleTopping = (topping) => {
    if (selectedToppings.some((t) => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const handleConfirm = () => {
    if (isSideDishCategory(item) && !sideDish) {
      alert('Bitte wählen Sie eine Beilage aus.');
      return;
    }

    const sideType = getSideDishType(item);
    const isMeatOrGyros = sideType === 'meat_gyros';
    const isManzoPesce = sideType === 'manzo_pesce';
    const hasIncludedSalad = isMeatOrGyros || isManzoPesce;

    let customName = item.number ? `Nr. ${item.number} ${item.name}` : item.name;
    if (activeSize && !isSideDishCategory(item)) {
      customName += ` (${activeSize.name}${activeSize.dim ? ' ' + activeSize.dim : ''})`;
    }
    if (isAmericanStyle) {
      customName += ` [American Crust]`;
    }

    const customDescParts = [];
    if (item.toppings) customDescParts.push(item.toppings);
    else if (item.desc) customDescParts.push(item.desc);
    if (sideDish) {
      customDescParts.push(`Beilage: ${sideDish}`);
      if (hasIncludedSalad) {
        customDescParts.push('Inkl. Kleiner Salat');
      }
    }
    if (isAmericanStyle) customDescParts.push('American Style mit Käserand (Mozzarella)');
    if (selectedToppings.length > 0) {
      if (has5FreeToppings) {
        const freeToppings = selectedToppings.slice(0, 5);
        const extraToppings = selectedToppings.slice(5);
        if (extraToppings.length > 0) {
          customDescParts.push(`5 Zutaten gratis: ${freeToppings.map(t => t.name).join(', ')}`);
          customDescParts.push(`Zusatz-Extras (+${toppingsTotal.toFixed(2).replace('.', ',')} €): ${extraToppings.map(t => t.name).join(', ')}`);
        } else {
          customDescParts.push(`Wunschzutaten (${freeToppings.length}/5 gratis): ${freeToppings.map(t => t.name).join(', ')}`);
        }
      } else {
        customDescParts.push(`Extra: ${selectedToppings.map(t => t.name).join(', ')} (+${toppingsTotal.toFixed(2).replace('.', ',')} €)`);
      }
    }

    if (specialInstructions) {
      customDescParts.push(`Hinweis: ${specialInstructions}`);
    }

    const toppingNames = selectedToppings.map((t, idx) => {
      const name = typeof t === 'string' ? t : (t.name || t.id);
      if (has5FreeToppings) {
        return idx < 5 ? `${name} (gratis)` : `${name} (+${dealExtraPriceFormatted} €)`;
      }
      return name;
    });
    if (sideDish && !toppingNames.some(t => String(t).startsWith('Beilage:'))) {
      toppingNames.unshift(`Beilage: ${sideDish}`);
    }
    if (hasIncludedSalad && !toppingNames.includes('Kleiner Salat')) {
      toppingNames.push('Kleiner Salat');
    }

    const savedSideLabel = sideDish
      ? (hasIncludedSalad ? `${sideDish} (inkl. Kleiner Salat)` : sideDish)
      : '';

    const cartItem = {
      id: `${item.id}-${sideDish ? sideDish.toLowerCase() : currentSizeKey}-${isAmericanStyle ? 'amer' : 'std'}-${selectedToppings.map(t => t.id).sort().join('-')}-${Date.now()}`,
      name: customName,
      price: finalUnitPrice,
      quantity: quantity,
      image: item.image_url || item.image,
      desc: customDescParts.join(' • '),
      side_dish: savedSideLabel,
      sideDish: savedSideLabel,
      selectedSide: savedSideLabel,
      menu_item_id: item.id || '',
      selectedSize: activeSize ? `${activeSize.name}${activeSize.dim ? ' (' + activeSize.dim + ')' : ''}` : '',
      selected_size: activeSize ? `${activeSize.name}${activeSize.dim ? ' (' + activeSize.dim + ')' : ''}` : '',
      isAmerican: isAmericanStyle,
      is_american: isAmericanStyle,
      selectedToppings: toppingNames,
      toppings_selected: toppingNames,
      specialInstructions: (specialInstructions || '').trim(),
      special_instructions: (specialInstructions || '').trim()
    };

    onAddToCart(cartItem);
    onClose();
  };

  const modalContent = (
    <div
      className="custom-modal-backdrop"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div className="custom-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Hero Image (Domino's/Reference Style) with Multi-Image Carousel */}
        {(() => {
          const modalImages = (Array.isArray(item.images) && item.images.length > 0)
            ? item.images
            : [item.image_url || item.image || '/images/pizza1.png'];
          const currentImg = modalImages[activeImageIdx] || modalImages[0] || '/images/pizza1.png';

          return (
            <div className="custom-modal-hero">
              <img
                src={currentImg}
                alt={item.name}
                onError={(e) => { e.currentTarget.src = '/images/pizza1.png'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.25s ease' }}
              />
              <div className="custom-modal-gradient" />

              {/* Multi-Image Controls */}
              {modalImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx(prev => (prev === 0 ? modalImages.length - 1 : prev - 1));
                    }}
                    aria-label="Vorheriges Bild"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '42%',
                      transform: 'translateY(-50%)',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      backdropFilter: 'blur(3px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx(prev => (prev === modalImages.length - 1 ? 0 : prev + 1));
                    }}
                    aria-label="Nächstes Bild"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '42%',
                      transform: 'translateY(-50%)',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      backdropFilter: 'blur(3px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Multi-Photo Counter Badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 9px',
                      borderRadius: '8px',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <Camera size={13} /> {activeImageIdx + 1} / {modalImages.length}
                  </span>

                  {/* Thumbnail Row Indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '16px',
                      display: 'flex',
                      gap: '6px',
                      zIndex: 10,
                      background: 'rgba(15, 23, 42, 0.65)',
                      padding: '4px 8px',
                      borderRadius: '10px',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {modalImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx(idx);
                        }}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: idx === activeImageIdx ? '2px solid #e11d48' : '1px solid rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          opacity: idx === activeImageIdx ? 1 : 0.65,
                          transition: 'all 0.18s ease'
                        }}
                      >
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Circular Close Button */}
              <button
                onClick={onClose}
                aria-label="Schließen"
                className="custom-modal-close-btn"
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              {/* Overlaid Title & Info */}
              <div className="custom-modal-hero-content">
                <div className="custom-modal-badges">
                  {item.dietary?.includes('vegetarisch') && (
                    <span className="custom-modal-badge-veg" title="Vegetarisch">
                      <span className="custom-modal-badge-veg-dot" />
                    </span>
                  )}
                  {item.number && !String(item.number).toLowerCase().startsWith('dish-') && !String(item.number).toLowerCase().startsWith('offer-') && (
                    <span className="custom-modal-badge-number">
                      {String(item.number).toUpperCase().startsWith('A') ? item.number : `Nr. ${item.number}`}
                    </span>
                  )}
                  {(() => {
                    let b = item.badge || '';
                    if (b.includes('dish-') || b.includes('offer-')) {
                      b = b.replace(/\b(dish|offer)-[a-zA-Z0-9_\-]+/gi, '').trim();
                      if (!b || b.toLowerCase() === 'angebot' || b.toLowerCase() === 'offer') {
                        b = isDeal ? 'Angebot' : '';
                      }
                    }
                    if (!b) return null;
                    return (
                      <span className="custom-modal-badge-pill">
                        {b}
                      </span>
                    );
                  })()}
                </div>

                <h3 className="custom-modal-title">{item.name}</h3>

                {(item.toppings || item.desc) && (
                  <p className="custom-modal-subtitle">
                    {item.toppings || item.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Scrollable Content */}
        <div className="custom-modal-scroll">
          {/* Size Picker (4 Cards as previously used) */}
          {hasSizes && sizeOptions.length > 0 && (
            <div>
              <div className="custom-modal-section-title">
                <span>1. Größe wählen:</span>
                <span className="custom-modal-section-tag">Pflichtfeld</span>
              </div>

              <div className="custom-size-grid">
                {sizeOptions.map((size) => {
                  const isSelected = (activeSize?.id === size.id) || (activeSize?.key === size.key);
                  const price = item.prices ? item.prices[size.key] : item.price;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`custom-size-card ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="custom-size-card-name">
                        {size.name}
                      </span>
                      {size.dim && (
                        <span className="custom-size-card-dim">
                          {size.dim}
                        </span>
                      )}
                      <span className="custom-size-card-price notranslate">
                        {price ? `${price.toFixed(2).replace('.', ',')} €` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Side Dish Picker for Indian, Lamb, Meat & Gyros */}
          {isSideDishCategory(item) && (
            <div style={{ marginBottom: '16px' }}>
              <div className="custom-modal-section-title">
                <span>Beilage wählen (Alle Optionen 0,00 €)</span>
                <span className="custom-modal-section-tag" style={{ background: '#fee2e2', color: '#dc2626' }}>Pflichtfeld</span>
              </div>

              {(getSideDishType(item) === 'meat_gyros' || getSideDishType(item) === 'manzo_pesce') && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  marginTop: '6px',
                  marginBottom: '10px',
                  fontSize: '12px',
                  color: '#15803d',
                  fontWeight: '700'
                }}>
                  <span>🥗</span>
                  <span>Kleiner Salat wird zu jedem Gericht automatisch serviert (inklusive).</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {(getSideDishType(item) === 'manzo_pesce'
                  ? [
                      { id: 'pommes', name: 'Pommes frites', icon: '🍟', desc: 'Goldgelb & knusprig frittiert' },
                      { id: 'bratkartoffeln', name: 'Bratkartoffeln', icon: '🥔', desc: 'Herzhaft gebraten' },
                      { id: 'kroketten', name: 'Kroketten', icon: '🧆', desc: 'Knusprig panierte Kartoffelkroketten' }
                    ]
                  : getSideDishType(item) === 'meat_gyros'
                  ? [
                      { id: 'pommes', name: 'Pommes frites', icon: '🍟', desc: 'Goldgelb & knusprig frittiert' },
                      { id: 'bratkartoffeln', name: 'Bratkartoffeln', icon: '🥔', desc: 'Herzhaft gebraten' },
                      { id: 'kartoffelsalat', name: 'Kartoffelsalat', icon: '🥗', desc: 'Hausgemachter Kartoffelsalat' },
                      { id: 'kroketten', name: 'Kroketten', icon: '🧆', desc: 'Knusprig panierte Kartoffelkroketten' }
                    ]
                  : [
                      { id: 'reis', name: 'Reis', icon: '🍚', desc: 'Feiner Basmati-Duftreis' },
                      { id: 'pizzabrot', name: 'Pizzabrot', icon: '🥖', desc: 'Ofenfrisches Pizzabrot' }
                    ]
                ).map((opt) => {
                  const isSel = sideDish === opt.name;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSideDish(opt.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSel ? '2px solid var(--red)' : '1.5px solid #e2e8f0',
                        background: isSel ? '#fff1f2' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSel ? '2px solid var(--red)' : '2px solid #94a3b8',
                          background: isSel ? 'var(--red)' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSel && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: isSel ? 'var(--red)' : '#0f172a' }}>
                            {opt.icon} {opt.name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>{opt.desc}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a', background: '#dcfce7', padding: '2px 7px', borderRadius: '6px' }}>
                        0,00 €
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* American Style Crust Option */}
          {item.supportsAmerican && (
            <div>
              <div className="custom-modal-section-title">
                <span>Teig &amp; Rand Upgrade</span>
                <span className="custom-modal-section-tag">Optional</span>
              </div>

              <div
                onClick={() => setIsAmericanStyle(!isAmericanStyle)}
                className={`custom-crust-card ${isAmericanStyle ? 'selected' : ''}`}
              >
                <div className="custom-crust-left">
                  <div className="custom-checkbox-box">
                    {isAmericanStyle && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <strong className="custom-crust-title">
                      🍕 American Pizza Teig (Käserand)
                    </strong>
                    <span className="custom-crust-desc">
                      Luftig-dicker Boden mit köstlicher Mozzarella-Füllung im Rand
                    </span>
                  </div>
                </div>

                <span className="custom-crust-price notranslate">
                  +{(americanCrustPrices[currentSizeKey] || 3.00).toFixed(2).replace('.', ',')} €
                </span>
              </div>
            </div>
          )}

          {/* Extra Toppings (Reference Image 4: Clean Full-Width Checkbox Rows) */}
          {availableToppings.length > 0 && (
            <div>
              <div className="custom-modal-section-title">
                <span>{has5FreeToppings ? (hasSizes ? '2. Wunschzutaten & Extras' : 'Wunschzutaten & Extras') : (hasSizes ? '2. Wunschzutaten & Extras' : 'Wunschzutaten & Extras')}</span>
                {(!isPasta || selectedToppings.length > 0) && (
                  <span
                    className="custom-modal-section-tag"
                    style={has5FreeToppings ? {
                      background: selectedToppings.length > 5 ? '#fef2f2' : '#f0fdf4',
                      color: selectedToppings.length > 5 ? '#dc2626' : '#15803d',
                      border: `1px solid ${selectedToppings.length > 5 ? '#fecaca' : '#bbf7d0'}`
                    } : {}}
                  >
                    {has5FreeToppings ? (
                      selectedToppings.length === 0
                        ? 'Bis zu 5 Zutaten gratis inklusive!'
                        : selectedToppings.length <= 5
                        ? `${selectedToppings.length}/5 gratis gewählt (0,00 €)`
                        : `5 gratis + ${selectedToppings.length - 5} extra (+${toppingsTotal.toFixed(2).replace('.', ',')} €)`
                    ) : (
                      selectedToppings.length > 0
                        ? `${selectedToppings.length} gewählt (+${toppingsTotal.toFixed(2).replace('.', ',')} €)`
                        : `+${singleToppingCost.toFixed(2).replace('.', ',')} € je Zutat`
                    )}
                  </span>
                )}
              </div>

              {/* Informative Deal & Custom Pizza Banner */}
              {has5FreeToppings && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginTop: '6px',
                  marginBottom: '12px',
                  fontSize: '12.5px',
                  color: '#15803d',
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{isCustomPizza ? '🍕' : '🎁'}</span>
                  <div>
                    <strong style={{ color: '#166534', display: 'block', fontSize: '13px', marginBottom: '2px' }}>
                      {isCustomPizza ? 'Wunschpizza Nr. 46: Bis zu 5 Wunschzutaten kostenlos!' : 'Spar-Menü Vorteil: Bis zu 5 Wunschzutaten kostenlos!'}
                    </strong>
                    <span>
                      {selectedToppings.length < 5
                        ? `Sie haben ${selectedToppings.length} von 5 kostenlosen Zutaten gewählt (noch ${5 - selectedToppings.length} gratis). Ab der 6. Zutat: ${dealExtraPriceFormatted} € je Zutat.`
                        : selectedToppings.length === 5
                        ? `Alle 5 kostenlosen Zutaten ausgewählt. Jede weitere Zutat kostet ${dealExtraPriceFormatted} € Aufpreis.`
                        : `5 Zutaten gratis + ${selectedToppings.length - 5} zusätzliche Zutat(en) für je ${dealExtraPriceFormatted} € (+${toppingsTotal.toFixed(2).replace('.', ',')} €).`}
                    </span>
                  </div>
                </div>
              )}

              <div className="custom-toppings-scroll">
                {availableToppings.map((topping) => {
                  const isChecked = selectedToppings.some((t) => t.id === topping.id);
                  const selectedIdx = selectedToppings.findIndex((t) => t.id === topping.id);
                  const standardCost = typeof topping.price === 'number' && topping.price > 0 ? topping.price : singleToppingCost;

                  return (
                    <button
                      key={topping.id}
                      type="button"
                      onClick={() => toggleTopping(topping)}
                      className={`custom-topping-item ${isChecked ? 'selected' : ''}`}
                    >
                      <div className="custom-topping-left">
                        <div className="custom-checkbox-box">
                          {isChecked && <Check size={13} strokeWidth={3} />}
                        </div>
                        <span className="custom-topping-name">{topping.name}</span>
                      </div>

                      {has5FreeToppings ? (
                        isChecked ? (
                          selectedIdx < 5 ? (
                            <span style={{
                              fontSize: '11.5px',
                              fontWeight: '800',
                              color: '#15803d',
                              background: '#dcfce7',
                              border: '1px solid #86efac',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap'
                            }}>
                              Gratis (0,00 €)
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11.5px',
                              fontWeight: '800',
                              color: '#dc2626',
                              background: '#fee2e2',
                              border: '1px solid #fecaca',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap'
                            }}>
                              +{dealExtraPriceFormatted} € (Aufpreis)
                            </span>
                          )
                        ) : (
                          selectedToppings.length < 5 ? (
                            <span style={{
                              fontSize: '11.5px',
                              fontWeight: '700',
                              color: '#15803d',
                              background: '#f0fdf4',
                              border: '1px solid #dcfce7',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap'
                            }}>
                              Inklusive (0,00 €)
                            </span>
                          ) : (
                            <span className="custom-topping-price notranslate" style={{ color: '#dc2626', fontWeight: '800' }}>
                              +{dealExtraPriceFormatted} €
                            </span>
                          )
                        )
                      ) : (
                        <span className="custom-topping-price notranslate">
                          +{standardCost.toFixed(2).replace('.', ',')} €
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions (Reference Image 3 & 4) */}
        <div className="custom-modal-footer">
          {/* Summary line */}
          <div className="custom-footer-summary">
            <span className="custom-footer-summary-text">
              Auswahl: <span className="custom-footer-summary-highlight">{isDeal ? (item.title || item.name) : (activeSize?.name || 'Standard')}</span>
              {activeSize?.dim && !isDeal ? ` (${activeSize.dim})` : ''}
              {isAmericanStyle ? ' • American Crust' : ''}
              {isDeal ? (
                selectedToppings.length > 0 ? (
                  selectedToppings.length <= 5
                    ? ` • ${selectedToppings.length} Zutaten (gratis)`
                    : ` • 5 gratis + ${selectedToppings.length - 5} extra (+${toppingsTotal.toFixed(2).replace('.', ',')} €)`
                ) : ''
              ) : (
                selectedToppings.length > 0 ? ` • +${selectedToppings.length} Extras` : ''
              )}
            </span>
            <span className="custom-footer-summary-price notranslate">
              {finalUnitPrice.toFixed(2).replace('.', ',')} € / Stk.
            </span>
          </div>

          {/* Action Row: Quantity + Submit Button */}
          <div className="custom-footer-actions-row">
            <div className="custom-qty-pill">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="custom-qty-btn"
                aria-label="Menge reduzieren"
              >
                <Minus size={15} strokeWidth={2.5} />
              </button>
              <span className="custom-qty-value">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="custom-qty-btn"
                aria-label="Menge erhöhen"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSideDishCategory(item) && !sideDish}
              className={`custom-submit-btn ${isSideDishCategory(item) && !sideDish ? 'disabled' : ''}`}
              style={isSideDishCategory(item) && !sideDish ? { background: '#cbd5e1', cursor: 'not-allowed' } : {}}
            >
              <ShoppingBag size={17} />
              <span className="notranslate">
                {isSideDishCategory(item) && !sideDish
                  ? 'Bitte Beilage wählen'
                  : `In den Warenkorb • ${totalPrice.toFixed(2).replace('.', ',')} €`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
