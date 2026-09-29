import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import { MIN_ORDER_DELIVERY } from '../lib/deliveryZones';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQty, onRemoveItem, onCheckout, isStoreOpen = true }) {
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isBelowMinOrder = subtotal < MIN_ORDER_DELIVERY;

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <aside className={`cart-drawer ${isOpen ? 'open' : ''}`} aria-label="Warenkorb">
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="var(--red)" />
            <h3>Dein Warenkorb ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</h3>
          </div>
          <button className="cart-close-btn" onClick={onClose} aria-label="Schließen">
            <X size={18} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            textAlign: 'center',
            color: '#888'
          }}>
            <ShoppingBag size={48} strokeWidth={1.2} style={{ marginBottom: '16px', opacity: 0.4 }} />
            <p style={{ fontWeight: '600', color: '#333', marginBottom: '6px' }}>Dein Warenkorb ist noch leer</p>
            <p style={{ fontSize: '12px' }}>Wähle aus unseren Angeboten oder der Speisekarte leckere Gerichte aus.</p>
          </div>
        ) : (
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.name}</div>
                  {item.desc && <div className="cart-item-desc">{item.desc}</div>}
                  <div className="cart-item-price">{(item.price * item.quantity).toFixed(2).replace('.', ',')} €</div>

                  <div className="cart-item-qty">
                    <button
                      className="qty-btn"
                      onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                      aria-label="Menge verringern"
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '18px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      aria-label="Menge erhöhen"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      style={{ marginLeft: 'auto', color: '#999', padding: '4px' }}
                      onClick={() => onRemoveItem(item.id)}
                      aria-label="Entfernen"
                      title="Entfernen"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="cart-footer">
            {/* Show minimum order notice ONLY if order is below €15.00 */}
            {isBelowMinOrder && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11.5px',
                color: '#92400e',
                fontWeight: '600',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={15} color="#d97706" style={{ flexShrink: 0 }} />
                <span>
                  Mindestbestellwert für Lieferung: <strong>15,00 €</strong> (noch {(MIN_ORDER_DELIVERY - subtotal).toFixed(2).replace('.', ',')} € • Abholung ohne Mindestwert möglich)
                </span>
              </div>
            )}

            <div className="cart-summary-row">
              <span>Warenwert</span>
              <span style={{ fontWeight: '700' }}>{subtotal.toFixed(2).replace('.', ',')} €</span>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 10px 0' }}>
              * Genaue Liefergebühr wird an der Kasse nach Ihrer Postleitzahl berechnet.
            </div>

            <div className="cart-total-row">
              <span>Zwischensumme</span>
              <span>{subtotal.toFixed(2).replace('.', ',')} €</span>
            </div>

            {!isStoreOpen && (
              <div style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#991b1b',
                fontWeight: '700',
                margin: '12px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>Unser Restaurant hat zurzeit geschlossen. Online-Bestellungen sind pausiert.</span>
              </div>
            )}

            <button
              className="checkout-btn"
              onClick={onCheckout}
              style={{
                background: !isStoreOpen ? '#94a3b8' : 'var(--red)',
                cursor: 'pointer'
              }}
            >
              {!isStoreOpen ? 'Geschlossen • Speisekarte ansehen' : 'Zur Kasse gehen'} <ArrowRight size={17} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
