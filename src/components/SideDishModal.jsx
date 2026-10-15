import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Plus, Minus, ShoppingBag, Utensils, Salad } from 'lucide-react';
import { getSideDishType } from '../data/liveMenuState';
import './SideDishModal.css';

export const INDIAN_LAMB_SIDE_OPTIONS = [
  {
    id: 'reis',
    name: 'Reis',
    desc: 'Feiner Basmati-Duftreis',
    price: 0,
    icon: '🍚'
  },
  {
    id: 'pizzabrot',
    name: 'Pizzabrot',
    desc: 'Ofenfrisches, warmes Pizzabrot',
    price: 0,
    icon: '🥖'
  }
];

export const MEAT_GYROS_SIDE_OPTIONS = [
  {
    id: 'pommes',
    name: 'Pommes frites',
    desc: 'Goldgelb & knusprig frittiert',
    price: 0,
    icon: '🍟'
  },
  {
    id: 'bratkartoffeln',
    name: 'Bratkartoffeln',
    desc: 'Herzhaft in der Pfanne gebraten',
    price: 0,
    icon: '🥔'
  },
  {
    id: 'kartoffelsalat',
    name: 'Kartoffelsalat',
    desc: 'Hausgemachter Kartoffelsalat',
    price: 0,
    icon: '🥗'
  },
  {
    id: 'kroketten',
    name: 'Kroketten',
    desc: 'Knusprig panierte Kartoffelkroketten',
    price: 0,
    icon: '🧆'
  }
];

export const MANZO_PESCE_SIDE_OPTIONS = [
  {
    id: 'pommes',
    name: 'Pommes frites',
    desc: 'Goldgelb & knusprig frittiert',
    price: 0,
    icon: '🍟'
  },
  {
    id: 'bratkartoffeln',
    name: 'Bratkartoffeln',
    desc: 'Herzhaft in der Pfanne gebraten',
    price: 0,
    icon: '🥔'
  },
  {
    id: 'kroketten',
    name: 'Kroketten',
    desc: 'Knusprig panierte Kartoffelkroketten',
    price: 0,
    icon: '🧆'
  }
];

export default function SideDishModal({ item, isOpen, onClose, onAddToCart }) {
  const [selectedSide, setSelectedSide] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

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

  // Reset state when opening modal with a new item
  useEffect(() => {
    if (isOpen && item) {
      setSelectedSide('');
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const sideType = getSideDishType(item) || 'indian_lamb';
  const isManzoPesce = sideType === 'manzo_pesce';
  const isMeatOrGyros = sideType === 'meat_gyros';
  const hasIncludedSalad = isMeatOrGyros || isManzoPesce;

  const currentOptions = isManzoPesce
    ? MANZO_PESCE_SIDE_OPTIONS
    : isMeatOrGyros
    ? MEAT_GYROS_SIDE_OPTIONS
    : INDIAN_LAMB_SIDE_OPTIONS;

  const unitPrice = typeof item.price === 'number'
    ? item.price
    : (item.prices?.single || 0);

  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    if (!selectedSide) return;

    const chosenOption = currentOptions.find(o => o.name === selectedSide);
    const chosenSideName = chosenOption ? chosenOption.name : selectedSide;

    let itemName = item.number ? `Nr. ${item.number} ${item.name}` : item.name;

    const descParts = [];
    if (item.toppings) descParts.push(item.toppings);
    else if (item.desc) descParts.push(item.desc);

    if (hasIncludedSalad) {
      descParts.push(`Beilage: ${chosenSideName}`);
      descParts.push('Inkl. Kleiner Salat');
    } else {
      descParts.push(`Beilage: ${chosenSideName}`);
    }

    if (notes.trim()) {
      descParts.push(`Hinweis: ${notes.trim()}`);
    }

    const savedSideLabel = hasIncludedSalad
      ? `${chosenSideName} (inkl. Kleiner Salat)`
      : chosenSideName;

    const cartItem = {
      id: `${item.id}-${chosenSideName.toLowerCase().replace(/\s+/g, '_')}-${Date.now()}`,
      name: itemName,
      price: unitPrice,
      quantity: quantity,
      image: item.image_url || item.image,
      desc: descParts.join(' • '),
      side_dish: savedSideLabel,
      sideDish: savedSideLabel,
      selectedSide: savedSideLabel,
      menu_item_id: item.id || '',
      selectedSize: '',
      selected_size: '',
      isAmerican: false,
      is_american: false,
      selectedToppings: hasIncludedSalad ? [`Beilage: ${chosenSideName}`, 'Kleiner Salat'] : [`Beilage: ${chosenSideName}`],
      toppings_selected: hasIncludedSalad ? [`Beilage: ${chosenSideName}`, 'Kleiner Salat'] : [`Beilage: ${chosenSideName}`],
      specialInstructions: notes.trim(),
      special_instructions: notes.trim()
    };

    onAddToCart(cartItem);
    onClose();
  };

  const modalImages = (Array.isArray(item.images) && item.images.length > 0)
    ? item.images
    : [item.image_url || item.image || '/images/pizza1.png'];
  const currentImg = modalImages[0] || '/images/pizza1.png';

  const modalContent = (
    <div
      className="side-modal-backdrop"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div className="side-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header with image */}
        <div className="side-modal-hero">
          <img
            src={currentImg}
            alt={item.name}
            onError={(e) => { e.currentTarget.src = '/images/pizza1.png'; }}
          />
          <div className="side-modal-gradient" />

          {/* Close Button */}
          <button
            type="button"
            className="side-modal-close-btn"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={20} />
          </button>

          {/* Dish Meta on Hero */}
          <div className="side-modal-hero-content">
            <div className="side-modal-badges">
              {item.number && (
                <span className="side-modal-badge-number">
                  Nr. {item.number}
                </span>
              )}
              <span className="side-modal-badge-cat">
                {item.category === 'indisch'
                  ? '🍛 Indische Spezialität'
                  : item.category === 'lamm'
                  ? '🍖 Lamm Spezialität'
                  : item.category === 'gyros' || item.category === 'doner'
                  ? '🥙 Gyros Spezialität'
                  : item.category === 'manzo-vom-rind' || item.category === 'manzo'
                  ? '🥩 Manzo vom Rind'
                  : item.category === 'pesce-fisch' || item.category === 'pesce'
                  ? '🐟 Pesce Fisch'
                  : '🥩 Fleischgericht (Putenfleisch)'}
              </span>
            </div>
            <h3 className="side-modal-title">{item.name}</h3>
            {(item.toppings || item.desc) && (
              <p className="side-modal-subtitle">
                {item.toppings || item.desc}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="side-modal-scroll">
          {/* Automatic salad notice for meat, gyros, manzo & pesce */}
          {hasIncludedSalad && (
            <div className="side-included-salad-box">
              <div className="side-salad-badge-icon">
                <Salad size={18} color="#16a34a" />
              </div>
              <div className="side-salad-badge-content">
                <strong>Kleiner Salat inklusive</strong>
                <span>Zu jedem Gericht servieren wir automatisch einen frischen gemischten Beilagensalat (0,00 €).</span>
              </div>
            </div>
          )}

          {/* Side dish selection section */}
          <div className="side-dish-section">
            <div className="side-dish-header-row">
              <div className="side-dish-header-title">
                <Utensils size={18} color="var(--red)" />
                <h4>Beilage wählen</h4>
              </div>
              <span className="side-dish-required-badge">
                Pflichtfeld (1 wählen)
              </span>
            </div>

            <p className="side-dish-info-text">
              {isManzoPesce
                ? 'Alle Gerichte mit Pommes frites, Bratkartoffeln oder Kroketten und kleinem Salat (0,00 € Aufpreis):'
                : isMeatOrGyros
                ? 'Alle Gerichte mit Pommes frites, Bratkartoffeln, Kartoffelsalat oder Kroketten und kleinem Salat (0,00 € Aufpreis):'
                : 'Alle Gerichte mit Reis oder Pizzabrot (0,00 € Aufpreis). Bitte wählen Sie eine gewünschte Option:'}
            </p>

            <div className="side-options-list">
              {currentOptions.map((opt) => {
                const isSelected = selectedSide === opt.name;
                return (
                  <div
                    key={opt.id}
                    className={`side-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedSide(opt.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSide(opt.name);
                      }
                    }}
                  >
                    <div className="side-option-radio">
                      <div className={`side-radio-circle ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <div className="side-radio-dot" />}
                      </div>
                    </div>

                    <div className="side-option-content">
                      <div className="side-option-title-row">
                        <span className="side-option-icon">{opt.icon}</span>
                        <strong className="side-option-name">{opt.name}</strong>
                      </div>
                      <span className="side-option-desc">{opt.desc}</span>
                    </div>

                    <div className="side-option-price">
                      <span>0,00 €</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {!selectedSide && (
              <div className="side-selection-hint">
                ⚠️ Bitte wählen Sie eine der Beilagen aus, um das Gericht hinzuzufügen.
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div className="side-modal-notes-section">
            <label htmlFor="dish-side-notes" className="side-notes-label">
              Besondere Wünsche oder Anmerkung (optional):
            </label>
            <input
              id="dish-side-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. knusprige Pommes, Dressing separat etc."
              maxLength={150}
              className="side-notes-input"
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="side-modal-footer">
          <div className="side-modal-qty-control">
            <button
              type="button"
              className="side-qty-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label="Menge verringern"
            >
              <Minus size={15} />
            </button>
            <span className="side-qty-val">{quantity}</span>
            <button
              type="button"
              className="side-qty-btn"
              onClick={() => setQuantity(quantity + 1)}
              aria-label="Menge erhöhen"
            >
              <Plus size={15} />
            </button>
          </div>

          <button
            type="button"
            className={`side-modal-submit-btn ${!selectedSide ? 'disabled' : ''}`}
            onClick={handleConfirm}
            disabled={!selectedSide}
          >
            <ShoppingBag size={18} />
            <span>
              {!selectedSide
                ? 'Bitte Beilage wählen'
                : `Hinzufügen • ${totalPrice.toFixed(2).replace('.', ',')} €`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
