import React, { useState } from 'react';
import { X, Plus, Minus, Check, ShoppingBag, Sparkles, ShieldAlert } from 'lucide-react';
import {
  standardPizzaSizes,
  calzoneSizes,
  americanCrustPrices,
  extraToppingPriceBySize,
  pizzaExtraToppingsList
} from '../data/menuData';

export default function CustomizeItemModal({ item, isOpen, onClose, onAddToCart }) {
  if (!isOpen || !item) return null;

  const customSizes = (item.prices?.custom_sizes || item.custom_sizes || []).filter(s => s && s.enabled !== false);
  const baseStandardSizes = item.calzoneSizes ? calzoneSizes : (item.sizesAvailable ? standardPizzaSizes : []);
  const standardSizeOptions = baseStandardSizes.filter(s => item.prices && item.prices[s.key] !== undefined && item.prices[s.key] !== null && item.prices[s.key] !== '');
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

  const [selectedSize, setSelectedSize] = useState(sizeOptions.length > 0 ? sizeOptions[0] : null);
  const [isAmericanStyle, setIsAmericanStyle] = useState(false);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Base price calculation
  const currentSizeKey = selectedSize?.key || 'small';
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
    if (selectedSize) {
      customName += ` (${selectedSize.name}${selectedSize.dim ? ' ' + selectedSize.dim : ''})`;
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
      image: item.image,
      desc: customDescParts.join(' • '),
      // Full customization fields for backend and AdminPanel
      menu_item_id: item.id || '',
      selectedSize: selectedSize ? `${selectedSize.name}${selectedSize.dim ? ' (' + selectedSize.dim + ')' : ''}` : '',
      selected_size: selectedSize ? `${selectedSize.name}${selectedSize.dim ? ' (' + selectedSize.dim + ')' : ''}` : '',
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 10, 10, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 2200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image & Info */}
        <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: '#222' }}>
          <img
            src={item.image}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)'
          }} />
          
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {item.number && (
                <span style={{
                  background: 'var(--red)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 7px',
                  borderRadius: '4px'
                }}>
                  Nr. {item.number}
                </span>
              )}
              {item.badge && (
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {item.badge}
                </span>
              )}
            </div>
            <h3 style={{ color: 'white', fontSize: '21px', fontWeight: '800', lineHeight: 1.2 }}>
              {item.name}
            </h3>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Ingredients/Toppings */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
              Belag &amp; Zutaten:
            </span>
            <p style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>
              {item.toppings || item.desc}
            </p>
          </div>

          {/* Size Picker */}
          {hasSizes && sizeOptions.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#111', marginBottom: '8px' }}>
                1. Größe wählen:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sizeOptions.length}, 1fr)`, gap: '8px' }}>
                {sizeOptions.map((size) => {
                  const isSelected = selectedSize?.id === size.id;
                  const price = item.prices ? item.prices[size.key] : item.price;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: `2px solid ${isSelected ? 'var(--red)' : '#e2e8f0'}`,
                        background: isSelected ? '#fff5f5' : '#ffffff',
                        textAlign: 'center',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '12.5px', fontWeight: isSelected ? '800' : '700', color: isSelected ? 'var(--red)' : '#1e293b' }}>
                        {size.name}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {size.dim}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: isSelected ? 'var(--red)' : '#0f172a', marginTop: '4px' }}>
                        {price ? price.toFixed(2).replace('.', ',') : ''} €
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* American Style Crust Option */}
          {item.supportsAmerican && (
            <div
              onClick={() => setIsAmericanStyle(!isAmericanStyle)}
              style={{
                border: `2px solid ${isAmericanStyle ? '#ea580c' : '#e2e8f0'}`,
                background: isAmericanStyle ? '#fff7ed' : '#ffffff',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: `2px solid ${isAmericanStyle ? '#ea580c' : '#cbd5e1'}`,
                  background: isAmericanStyle ? '#ea580c' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  {isAmericanStyle && <Check size={14} strokeWidth={3} />}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: isAmericanStyle ? '#9a3412' : '#1e293b' }}>
                    🍕 American Pizza Teig (Dicker Boden &amp; Mozzarella im Rand)
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Luftig-dicker Boden mit köstlicher Käsefüllung im Rand
                  </span>
                </div>
              </div>
              <span style={{ fontWeight: '800', color: '#ea580c', fontSize: '13px', whiteSpace: 'nowrap' }}>
                +{(americanCrustPrices[currentSizeKey] || 3.00).toFixed(2).replace('.', ',')} €
              </span>
            </div>
          )}

          {/* Extra Toppings (Size-based pricing) */}
          {availableToppings.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#111' }}>
                  2. Wunschzutaten &amp; Extras ({singleToppingCost.toFixed(2).replace('.', ',')} € je Zutat):
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {selectedToppings.length > 0 ? `${selectedToppings.length} gewählt` : 'Optional'}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {availableToppings.map((topping) => {
                  const isChecked = selectedToppings.some((t) => t.id === topping.id);
                  return (
                    <button
                      key={topping.id}
                      type="button"
                      onClick={() => toggleTopping(topping)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: `1.5px solid ${isChecked ? 'var(--red)' : '#e2e8f0'}`,
                        background: isChecked ? '#fff5f5' : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: `1.5px solid ${isChecked ? 'var(--red)' : '#cbd5e1'}`,
                          background: isChecked ? 'var(--red)' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span style={{ color: isChecked ? 'var(--red)' : '#334155', fontWeight: isChecked ? '700' : '500' }}>
                          {topping.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: isChecked ? 'var(--red)' : '#64748b', fontWeight: '700' }}>
                        +{(typeof topping.price === 'number' && topping.price > 0 ? topping.price : singleToppingCost).toFixed(2).replace('.', ',')} €
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special instructions */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
              Sonderwünsche / Zubereitungshinweis:
            </label>
            <input
              type="text"
              placeholder="z.B. bitte extra knusprig gebacken, ohne Zwiebeln..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Quantity Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #dcdcdc',
            borderRadius: '8px',
            background: 'white',
            overflow: 'hidden'
          }}>
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{ padding: '8px 12px', color: '#444', cursor: 'pointer' }}
              aria-label="Weniger"
            >
              <Minus size={14} />
            </button>
            <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: '800', fontSize: '14px' }}>
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              style={{ padding: '8px 12px', color: '#444', cursor: 'pointer' }}
              aria-label="Mehr"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Add to Cart Submit Button */}
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 1,
              background: 'var(--red)',
              color: 'white',
              padding: '12px 18px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(227, 6, 19, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <ShoppingBag size={16} />
            <span>In den Warenkorb • {totalPrice.toFixed(2).replace('.', ',')} €</span>
          </button>
        </div>
      </div>
    </div>
  );
}
