import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Plus, Minus, ShoppingBag, Salad } from 'lucide-react';
import './SideDishModal.css';

export const SALAD_DRESSING_OPTIONS = [
  {
    id: 'essig_oel',
    name: 'Essig & Öl',
    desc: 'Klassisches Essig & Öl Dressing (Vinegar & Oil)',
    price: 0,
    icon: '🫒'
  },
  {
    id: 'sahne_kraeuter',
    name: 'Sahne-Kräuter',
    desc: 'Cremiges Kräuterdressing (Creamy Herb Dressing)',
    price: 0,
    icon: '🌿'
  },
  {
    id: 'joghurt_dressing',
    name: 'Joghurt-Dressing',
    desc: 'Frisches Joghurt-Dressing (Yogurt Dressing)',
    price: 0,
    icon: '🥣'
  }
];

export default function SaladDressingModal({ item, isOpen, onClose, onAddToCart }) {
  const [selectedDressing, setSelectedDressing] = useState('');
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
      setSelectedDressing('');
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const unitPrice = typeof item.price === 'number'
    ? item.price
    : (item.prices?.single || 0);

  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    if (!selectedDressing) return;

    const chosenOption = SALAD_DRESSING_OPTIONS.find(o => o.name === selectedDressing);
    const chosenDressingName = chosenOption ? chosenOption.name : selectedDressing;

    let itemName = item.number ? `Nr. ${item.number} ${item.name}` : item.name;

    const descParts = [];
    if (item.toppings) descParts.push(item.toppings);
    else if (item.desc) descParts.push(item.desc);

    descParts.push(`Dressing: ${chosenDressingName}`);

    if (notes.trim()) {
      descParts.push(`Hinweis: ${notes.trim()}`);
    }

    const dressingLabel = `Dressing: ${chosenDressingName}`;

    const cartItem = {
      id: `${item.id}-dressing-${chosenDressingName.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${Date.now()}`,
      name: itemName,
      price: unitPrice,
      quantity: quantity,
      image: item.image_url || item.image,
      desc: descParts.join(' • '),
      dressing: chosenDressingName,
      selectedDressing: chosenDressingName,
      side_dish: dressingLabel,
      sideDish: dressingLabel,
      selectedSide: dressingLabel,
      menu_item_id: item.id || '',
      selectedSize: '',
      selected_size: '',
      isAmerican: false,
      is_american: false,
      selectedToppings: [`Dressing: ${chosenDressingName}`],
      toppings_selected: [`Dressing: ${chosenDressingName}`],
      specialInstructions: notes.trim(),
      special_instructions: notes.trim()
    };

    onAddToCart(cartItem);
    onClose();
  };

  const modalImages = (Array.isArray(item.images) && item.images.length > 0)
    ? item.images
    : [item.image_url || item.image || 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/salad-venezia_1791827518432.jpg'];
  const currentImg = modalImages[0] || 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/salad-venezia_1791827518432.jpg';

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
            onError={(e) => {
              e.currentTarget.src = 'https://myubzgnheofvuwyehnox.supabase.co/storage/v1/object/public/menu-dishes/dishes/salad-venezia_1791827518432.jpg';
            }}
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
                🥗 Knackiger Salat
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
          {/* Dressing selection section */}
          <div className="side-dish-section">
            <div className="side-dish-header-row">
              <div className="side-dish-header-title">
                <Salad size={18} color="#16a34a" />
                <h4>Dressing wählen</h4>
              </div>
              <span className="side-dish-required-badge">
                Pflichtfeld (1 wählen)
              </span>
            </div>

            <p className="side-dish-info-text">
              Mit Essig &amp; Öl, Sahne-Kräuter oder Joghurt-Dressing (0,00 € Aufpreis):
            </p>

            <div className="side-options-list">
              {SALAD_DRESSING_OPTIONS.map((opt) => {
                const isSelected = selectedDressing === opt.name;
                return (
                  <div
                    key={opt.id}
                    className={`side-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDressing(opt.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedDressing(opt.name);
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

            {!selectedDressing && (
              <div className="side-selection-hint">
                ⚠️ Bitte wählen Sie ein Dressing aus, um den Salat hinzuzufügen.
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div className="side-modal-notes-section">
            <label htmlFor="salad-dressing-notes" className="side-notes-label">
              Besondere Wünsche oder Anmerkung (optional):
            </label>
            <input
              id="salad-dressing-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Dressing separat verpacken, ohne Zwiebeln etc."
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
            className={`side-modal-submit-btn ${!selectedDressing ? 'disabled' : ''}`}
            onClick={handleConfirm}
            disabled={!selectedDressing}
          >
            <ShoppingBag size={18} />
            <span>
              {!selectedDressing
                ? 'Bitte Dressing wählen'
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
