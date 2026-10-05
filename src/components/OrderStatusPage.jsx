import React, { useState, useEffect } from 'react';
import {
  Clock,
  Flame,
  Truck,
  PackageCheck,
  CheckCircle2,
  Copy,
  Printer,
  ArrowLeft,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Store
} from 'lucide-react';
import { getActiveOrder, subscribeToOrders, supabase } from '../lib/supabaseClient';

export default function OrderStatusPage({
  initialOrder = null,
  onNavigateHome,
  onNavigateAccount,
  onOpenOrderModal
}) {
  const [order, setOrder] = useState(initialOrder || getActiveOrder());
  const [isCopied, setIsCopied] = useState(false);

  // Sync with initialOrder prop if changed
  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
    } else {
      const active = getActiveOrder();
      setOrder(active);
    }
  }, [initialOrder]);

  // Subscribe to live status updates directly from Supabase Database
  useEffect(() => {
    if (!order?.id && !order?.order_number) return;

    // Direct Supabase Polling every 3.5s for cross-device sync
    const pollInterval = setInterval(async () => {
      if (!supabase) return;
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(order.id));
        let query = supabase.from('orders').select('*, order_items(*)');
        if (isUuid) {
          query = query.eq('id', order.id);
        } else {
          query = query.eq('order_number', order.order_number || order.id);
        }
        const { data, error } = await query.single();
        if (!error && data) {
          setOrder(prev => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.warn('OrderStatusPage polling notice:', e);
      }
    }, 3500);

    // Supabase Realtime Listener
    const unsub = subscribeToOrders((payload) => {
      if (!payload?.new) return;
      const targetId = order?.id;
      const targetNum = order?.order_number;
      const matches = (targetId && String(payload.new.id) === String(targetId)) ||
                      (targetNum && (payload.new.order_number === targetNum || String(payload.new.order_number) === String(targetNum))) ||
                      (targetId && payload.new.order_number === targetId);
      if (matches) {
        setOrder(prev => {
          if (!prev) return payload.new;
          const validStatuses = ['new', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
          const updatedStatus = (typeof payload.new.status === 'string' && validStatuses.includes(payload.new.status))
            ? payload.new.status
            : prev.status;
          return {
            ...prev,
            ...payload.new,
            status: updatedStatus,
            order_items: (payload.new.order_items && payload.new.order_items.length > 0) ? payload.new.order_items : prev.order_items
          };
        });
      }
    });

    return () => {
      clearInterval(pollInterval);
      unsub();
    };
  }, [order?.id, order?.order_number]);

  const handleCopyNumber = () => {
    if (!order?.order_number) return;
    navigator.clipboard.writeText(order.order_number);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusStepIndex = (status) => {
    switch (status) {
      case 'new': return 1;
      case 'preparing': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  const currentStep = getStatusStepIndex(order?.status || 'new');

  return (
    <div className="order-status-page" style={{
      minHeight: '100vh',
      background: '#f8fafc',
      paddingBottom: '80px'
    }}>
      {/* Italian Ribbon Accent */}
      <div style={{
        height: '5px',
        width: '100%',
        background: 'linear-gradient(to right, #008c45 33.3%, #ffffff 33.3%, #ffffff 66.6%, #cd212a 66.6%)'
      }} />

      {/* Page Header Bar */}
      <div style={{
        background: '#0f172a',
        color: '#ffffff',
        padding: '24px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onNavigateHome}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Zurück zur Startseite</span>
            </button>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>
              Live-Bestellstatus
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {onNavigateAccount && (
              <button
                type="button"
                onClick={onNavigateAccount}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <User size={15} color="var(--red)" />
                <span>Mein Kundenkonto</span>
              </button>
            )}

            {order && (
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} />
                <span>Beleg drucken</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div style={{ maxWidth: '900px', margin: '32px auto 0', padding: '0 16px' }}>
        {!order ? (
          /* Empty State */
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '60px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#fff1f2',
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <ShoppingBag size={36} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Keine aktive Bestellung gefunden
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 24px' }}>
              Sie haben derzeit keine offene Bestellung. Sie können frühere Bestellungen in Ihrem Kundenkonto ansehen oder direkt frisch aus dem Steinofen bestellen!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onNavigateHome}
                style={{
                  background: 'var(--red)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Zur Speisekarte
              </button>
              {onNavigateAccount && (
                <button
                  type="button"
                  onClick={onNavigateAccount}
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Zu Mein Konto
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Active Order Status View */
          <div>
            {/* Top Confirmation & Order Number Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: order.status === 'delivered' ? '#dcfce7' : '#fff1f2',
                  color: order.status === 'delivered' ? '#16a34a' : 'var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                  {order.status === 'delivered' ? <CheckCircle2 size={30} /> : <Flame size={30} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      Bestellnummer
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      style={{
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Copy size={11} />
                      <span>{isCopied ? 'Kopiert!' : 'Kopieren'}</span>
                    </button>
                  </div>
                  <h2 style={{ margin: '2px 0 0', fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
                    #{order.order_number}
                  </h2>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block',
                  background: order.status === 'delivered' ? '#dcfce7' : '#fee2e2',
                  color: order.status === 'delivered' ? '#15803d' : '#991b1b',
                  fontSize: '12px',
                  fontWeight: '800',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  textTransform: 'uppercase'
                }}>
                  {order.status === 'new' && '1. Eingegangen'}
                  {order.status === 'preparing' && '2. Im Steinofen'}
                  {order.status === 'out_for_delivery' && (order.delivery_type === 'pickup' ? '3. Bereit zur Abholung' : '3. Auf dem Weg')}
                  {order.status === 'delivered' && (order.delivery_type === 'pickup' ? '4. Abgeholt' : '4. Zugestellt')}
                  {order.status === 'cancelled' && 'Storniert'}
                </span>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Live synchronisiert mit Supabase
                </div>
              </div>
            </div>

            {/* 4-Step Interactive Visual Flow Stepper Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: order.status === 'delivered' ? '#16a34a' : '#e11d48',
                  animation: 'pulse 1.5s infinite'
                }} />
                <span>Aktueller Status:</span>
              </div>

              {/* 4-Step Interactive Visual Flow with Dotted/Solid Connectors */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0px',
                position: 'relative',
                marginTop: '12px'
              }}>
                {[
                  { stepNum: 1, title: 'Eingegangen', sub: 'Bestätigt', color: '#0f172a', nextColor: '#d97706', Icon: CheckCircle2 },
                  { stepNum: 2, title: 'Im Steinofen', sub: 'Frisch belegt & gebacken', color: '#d97706', nextColor: '#0284c7', Icon: Flame },
                  {
                    stepNum: 3,
                    title: order.delivery_type === 'pickup' ? 'Bereit zur Abholung' : 'Auf dem Weg',
                    sub: order.delivery_type === 'pickup' ? 'Ready to Collect' : 'Mit Venezia-Kurier',
                    color: '#0284c7',
                    nextColor: '#16a34a',
                    Icon: order.delivery_type === 'pickup' ? Store : Truck
                  },
                  {
                    stepNum: 4,
                    title: order.delivery_type === 'pickup' ? 'Abgeholt' : 'Zugestellt',
                    sub: order.delivery_type === 'pickup' ? 'Picked Up' : 'Guten Appetit!',
                    color: '#16a34a',
                    nextColor: '#16a34a',
                    Icon: PackageCheck
                  }
                ].map((s, idx) => {
                  const isPassed = currentStep > s.stepNum;
                  const isCurrent = currentStep === s.stepNum;
                  const isUpcoming = currentStep < s.stepNum;

                  // Connector line to the next step
                  // If status updated/passed: solid line
                  // If current status waiting to update to next: dotted line
                  // If upcoming: neutral grey line
                  const lineStyle = isPassed
                    ? { borderTop: `3px solid ${s.color}` }
                    : isCurrent
                      ? { borderTop: `3px dotted ${s.nextColor}` }
                      : { borderTop: '2px solid #e2e8f0' };

                  // Circle size: current is 50px, past & upcoming are 30% decreased (35px)
                  const circleDiameter = isCurrent ? 50 : 35;
                  const iconDiameter = isCurrent ? 24 : 17;

                  return (
                    <div key={s.stepNum} style={{ position: 'relative', textAlign: 'center', padding: '0 4px' }}>
                      {/* Connecting Line to next step */}
                      {idx < 3 && (
                        <div style={{
                          position: 'absolute',
                          top: '27px',
                          left: '50%',
                          width: '100%',
                          height: '0',
                          zIndex: 1,
                          transition: 'all 0.3s ease',
                          ...lineStyle
                        }} />
                      )}

                      {/* Step Circle Wrapper with fixed height to vertically align centers */}
                      <div style={{
                        height: '54px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          width: `${circleDiameter}px`,
                          height: `${circleDiameter}px`,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          zIndex: 2,
                          background: isUpcoming ? '#e2e8f0' : s.color,
                          color: isUpcoming ? '#94a3b8' : '#ffffff',
                          opacity: 1, // 100% solid opaque so line behind icon is completely hidden
                          boxShadow: isCurrent ? `0 0 0 6px ${s.color}33` : '0 2px 6px rgba(0,0,0,0.08)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                          <s.Icon size={iconDiameter} />
                        </div>
                      </div>

                      {/* Step Title */}
                      <div style={{
                        fontSize: isCurrent ? '13.5px' : '12px',
                        fontWeight: isCurrent ? '800' : '600',
                        color: isUpcoming ? '#94a3b8' : (isPassed ? '#475569' : '#0f172a'),
                        lineHeight: '1.2'
                      }}>
                        {s.title}
                      </div>

                      {/* Step Subtitle */}
                      <div style={{
                        fontSize: '11px',
                        color: isUpcoming ? '#cbd5e1' : (isCurrent ? s.color : '#94a3b8'),
                        fontWeight: isCurrent ? '700' : '400',
                        marginTop: '2px'
                      }}>
                        {s.sub}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Estimated Arrival Box */}
              <div style={{
                marginTop: '24px',
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '16px 20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={20} color="var(--red)" />
                  <div>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                      Geschätzte Ankunftszeit:
                    </span>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a' }}>
                      {order.status === 'delivered'
                        ? 'Bestellung erfolgreich übergeben'
                        : `in ca. ${order.estimated_delivery_minutes || 35} Minuten`}
                    </strong>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Lieferart: <strong>{order.delivery_type === 'pickup' ? 'Selbstabholung' : 'Lieferdienst'}</strong>
                </div>
              </div>
            </div>

            {/* Two Column Layout: Order Items Breakdown & Delivery Details */}
            <div className="order-status-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
              {/* Left Column: Ordered Items */}
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
                  Bestellte Gerichte ({(order.order_items || []).length})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {(order.order_items || []).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #f1f5f9',
                        background: '#f8fafc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>
                          <span style={{ color: 'var(--red)', marginRight: '6px' }}>{item.quantity}x</span>
                          {item.item_name}
                          {item.selected_size && (
                            <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', marginLeft: '6px' }}>
                              ({item.selected_size})
                            </span>
                          )}
                        </div>
                        {Array.isArray(item.toppings_selected) && item.toppings_selected.length > 0 && (
                          <div style={{ fontSize: '11.5px', color: '#0284c7', marginTop: '3px', fontWeight: '600' }}>
                            + {item.toppings_selected.map(t => typeof t === 'string' ? t : (t?.name || t?.id || String(t))).join(', ')}
                          </div>
                        )}
                        {item.special_instructions && (
                          <div style={{ fontSize: '11.5px', color: '#d97706', marginTop: '3px', fontStyle: 'italic' }}>
                            Hinweis: {item.special_instructions}
                          </div>
                        )}
                      </div>

                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                        {Number(item.total_price || item.unit_price * item.quantity || 0).toFixed(2).replace('.', ',')} €
                      </strong>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                    <span>Zwischensumme</span>
                    <span>{Number(order.subtotal || 0).toFixed(2).replace('.', ',')} €</span>
                  </div>
                  {order.delivery_type === 'delivery' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                      <span>Lieferkosten</span>
                      <span style={{ color: Number(order.delivery_fee || 0) > 0 ? '#0f172a' : '#16a34a', fontWeight: '700' }}>
                        {Number(order.delivery_fee || 0) > 0 ? `${Number(order.delivery_fee).toFixed(2).replace('.', ',')} €` : '0,00 € (Kostenlos)'}
                      </span>
                    </div>
                  )}
                  {Number(order.low_cart_fee || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#1e40af', marginBottom: '6px', fontWeight: '600' }}>
                      <span>Mindermengenzuschlag (Low Cart Fee)</span>
                      <span>+{Number(order.low_cart_fee).toFixed(2).replace('.', ',')} €</span>
                    </div>
                  )}
                  {Number(order.tip || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                      <span>Fahrertrinkgeld</span>
                      <span>{Number(order.tip || 0).toFixed(2).replace('.', ',')} €</span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '17px',
                    fontWeight: '900',
                    color: '#0f172a',
                    borderTop: '2px solid #0f172a',
                    paddingTop: '10px',
                    marginTop: '8px'
                  }}>
                    <span>Gesamtbetrag</span>
                    <span style={{ color: 'var(--red)' }}>
                      {Number(order.total || 0).toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Delivery Address & Customer Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {order.delivery_type === 'pickup' ? <Store size={17} color="var(--red)" /> : <MapPin size={17} color="var(--red)" />}
                    <span>{order.delivery_type === 'pickup' ? 'Abhol-Informationen' : 'Lieferanschrift'}</span>
                  </h3>

                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>
                      {order.customer_name}
                    </strong>
                    <div>{order.street || 'Bahnhofstraße 14 (Restaurant)'}</div>
                    <div>{order.zip_city || '08525 Plauen'}</div>
                    {order.customer_phone && (
                      <div style={{ marginTop: '8px', color: '#64748b' }}>
                        Tel: {order.customer_phone}
                      </div>
                    )}
                  </div>

                  {order.note && (
                    <div style={{
                      marginTop: '14px',
                      background: '#fffbeb',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #fef3c7',
                      fontSize: '12px',
                      color: '#92400e'
                    }}>
                      <strong>Kundenhinweis:</strong> {order.note}
                    </div>
                  )}
                </div>

                <div style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>
                    Möchten Sie diese Bestellung als Popup-Fenster öffnen?
                  </p>
                  {onOpenOrderModal && (
                    <button
                      type="button"
                      onClick={() => onOpenOrderModal(order)}
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 18px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Als Popup-Tracking öffnen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
