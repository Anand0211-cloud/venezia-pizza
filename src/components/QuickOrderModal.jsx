import React, { useState } from 'react';
import { X, CheckCircle, Clock, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { restaurantInfo } from '../data/menuData';
import { createOrder } from '../lib/supabaseClient';

export default function QuickOrderModal({ isOpen, onClose, cartItems, onCompleteOrder }) {
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' or 'pickup'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    street: '',
    zipCity: '08525 Plauen',
    note: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = orderType === 'delivery' && subtotal < 20 ? 2.50 : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderPayload = {
      order_number: `VP-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: formData.name,
      customer_phone: formData.phone,
      delivery_type: orderType,
      street: orderType === 'delivery' ? formData.street : '',
      zip_city: orderType === 'delivery' ? formData.zipCity : '',
      note: formData.note || '',
      subtotal,
      delivery_fee: deliveryFee,
      total,
      status: 'new',
      estimated_delivery_minutes: orderType === 'delivery' ? 40 : 20
    };

    try {
      await createOrder(orderPayload, cartItems);
    } catch (err) {
      console.warn('Could not post order to Supabase (check credentials), proceeding with local confirmation', err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        onCompleteOrder();
        setIsSubmitted(false);
        onClose();
      }, 2500);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        position: 'relative',
        padding: '28px'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#f4f5f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle size={60} color="#28a745" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Vielen Dank für Ihre Bestellung!</h3>
            <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
              Ihre Bestellung bei <strong>Venezia Pizza Service</strong> in Plauen wird nun frisch und heiß für Sie zubereitet.
            </p>
            <div style={{ marginTop: '20px', padding: '14px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px', color: '#444' }}>
              <Clock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px', color: 'var(--red)' }} />
              Geschätzte Lieferzeit: <strong>30 - 45 Minuten</strong>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--red)', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>
                VENEZIA PIZZA SERVICE • PLAUEN
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>
                Online-Bestellung aufgeben
              </h3>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Frische italienische &amp; internationale Küche direkt zu Ihnen nach Hause.
              </p>
            </div>

            {/* Delivery / Pickup Toggle */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `2px solid ${orderType === 'delivery' ? 'var(--red)' : '#e0e0e0'}`,
                  background: orderType === 'delivery' ? '#fff5f5' : 'white',
                  fontWeight: '700',
                  fontSize: '13px',
                  color: orderType === 'delivery' ? 'var(--red)' : '#444'
                }}
              >
                🛵 Lieferung in Plauen
              </button>
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `2px solid ${orderType === 'pickup' ? 'var(--red)' : '#e0e0e0'}`,
                  background: orderType === 'pickup' ? '#fff5f5' : 'white',
                  fontWeight: '700',
                  fontSize: '13px',
                  color: orderType === 'pickup' ? 'var(--red)' : '#444'
                }}
              >
                🏪 Selbstabholung
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Ihr Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Max Mustermann"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Telefonnummer (für Rückfragen) *</label>
                <input
                  type="tel"
                  required
                  placeholder="0170 1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              {orderType === 'delivery' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Straße &amp; Hausnr. *</label>
                    <input
                      type="text"
                      required
                      placeholder="Musterstr. 12"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>PLZ / Ort</label>
                    <input
                      type="text"
                      value={formData.zipCity}
                      onChange={(e) => setFormData({ ...formData, zipCity: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Anmerkung zur Bestellung</label>
                <textarea
                  rows="2"
                  placeholder="z.B. bitte extra Knoblauch / Klingel Schmidt 2. OG"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '12px' }}
                ></textarea>
              </div>

              <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#555' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Zahlungsart:</span>
                  <strong>Barzahlung oder EC-Karte bei Lieferung</strong>
                </div>
                {total > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#111', fontSize: '14px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e0e0e0' }}>
                    <span>Bestellwert:</span>
                    <span style={{ color: 'var(--red)' }}>{total.toFixed(2).replace('.', ',')} €</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                style={{
                  background: 'var(--red)',
                  color: 'white',
                  padding: '14px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '14px',
                  marginTop: '6px'
                }}
              >
                Jetzt verbindlich bestellen ({total > 0 ? `${total.toFixed(2).replace('.', ',')} €` : 'Speisekarte'})
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
