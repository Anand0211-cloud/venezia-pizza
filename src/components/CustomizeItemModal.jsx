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

  const toppingsTotal = selectedToppings.reduce((sum, t) => {
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
    let customName = item.number ? `Nr. ${item.number} ${item.name}` : item.name;
    if (activeSize) {
      customName += ` (${activeSize.name}${activeSize.dim ? ' ' + activeSize.dim : ''})`;
    }
    if (isAmericanStyle) {
      customName += ` [American Crust]`;
    }

    const customDescParts = [];
    if (item.toppings) customDescParts.push(item.toppings);
    if (isAmericanStyle) customDescParts.push('American Style mit Käserand (Mozzarella)');
    if (selectedToppings.length > 0) {
      customDescParts.push(`Extra: ${selectedToppings.map(t => t.name).join(', ')} (+${toppingsTotal.toFixed(2).replace('.', ',')} €)`);
    }
    if (specialInstructions) {
      customDescParts.push(`Hinweis: ${specialInstructions}`);
    }

    const toppingNames = selectedToppings.map(t => typeof t === 'string' ? t : (t.name || t.id));

    const cartItem = {
      id: `${item.id}-${currentSizeKey}-${isAmericanStyle ? 'amer' : 'std'}-${selectedToppings.map(t => t.id).sort().join('-')}-${Date.now()}`,
      name: customName,
      price: finalUnitPrice,
      quantity: quantity,
      image: item.image_url || item.image,
      desc: customDescParts.join(' • '),
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
                  {item.number && (
                    <span className="custom-modal-badge-number">
                      Nr. {item.number}
                    </span>
                  )}
                  {item.badge && (
                    <span className="custom-modal-badge-pill">
                      {item.badge}
                    </span>
                  )}
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
                <span>2. Wunschzutaten &amp; Extras</span>
                <span className="custom-modal-section-tag">
                  {selectedToppings.length > 0
                    ? `${selectedToppings.length} gewählt (+${toppingsTotal.toFixed(2).replace('.', ',')} €)`
                    : `+${singleToppingCost.toFixed(2).replace('.', ',')} € je Zutat`}
                </span>
              </div>

              <div className="custom-toppings-scroll">
                {availableToppings.map((topping) => {
                  const isChecked = selectedToppings.some((t) => t.id === topping.id);
                  const cost = typeof topping.price === 'number' && topping.price > 0 ? topping.price : singleToppingCost;
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

                      <span className="custom-topping-price notranslate">
                        +{cost.toFixed(2).replace('.', ',')} €
                      </span>
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
              Auswahl: <span className="custom-footer-summary-highlight">{activeSize?.name || 'Standard'}</span>
              {activeSize?.dim ? ` (${activeSize.dim})` : ''}
              {isAmericanStyle ? ' • American Crust' : ''}
              {selectedToppings.length > 0 ? ` • +${selectedToppings.length} Extras` : ''}
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
              className="custom-submit-btn"
            >
              <ShoppingBag size={17} />
              <span className="notranslate">In den Warenkorb • {totalPrice.toFixed(2).replace('.', ',')} €</span>
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
