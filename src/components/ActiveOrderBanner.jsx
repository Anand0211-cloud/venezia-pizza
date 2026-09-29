import React, { useState, useEffect } from 'react';
import { Clock, Flame, Truck, CheckCircle2, ChevronRight, X, Store } from 'lucide-react';
import {
  getActiveOrder,
  saveActiveOrder,
  subscribeToOrders,
  supabase,
  getCachedCustomer,
  getOrderCustomerEmail,
  subscribeToCustomerAuth
} from '../lib/supabaseClient';

export default function ActiveOrderBanner({ onOpenTracker }) {
  const [customerUser, setCustomerUser] = useState(() => getCachedCustomer());
  const [activeOrder, setActiveOrder] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const isBannerDismissed = (orderNum) => {
    if (!orderNum) return false;
    try {
      return sessionStorage.getItem(`venezia_banner_dismissed_${orderNum}`) === '1';
    } catch {
      return false;
    }
  };

  const getVerifiedActiveOrder = (explicitCustomer = null) => {
    // STRICT RULE: Active order tracking is strictly for logged-in accounts!
    const customer = explicitCustomer !== null ? explicitCustomer : (customerUser || getCachedCustomer());
    if (!customer?.email) return null;

    const current = getActiveOrder();
    if (!current) return null;

    if (isBannerDismissed(current.order_number)) return null;

    const ordEmail = getOrderCustomerEmail(current);
    if (ordEmail && ordEmail !== customer.email.toLowerCase().trim()) {
      return null;
    }
    return current;
  };

  useEffect(() => {
    // 1. Initial check: strictly require customer account
    const currentCustomer = getCachedCustomer();
    setCustomerUser(currentCustomer);

    if (!currentCustomer?.email) {
      setActiveOrder(null);
    } else {
      const current = getVerifiedActiveOrder(currentCustomer);
      if (current && (current.status === 'new' || current.status === 'preparing' || current.status === 'out_for_delivery' || current.status === 'delivered')) {
        setActiveOrder(current);
      } else {
        setActiveOrder(null);
      }
    }

    // 2. Direct Supabase Database polling every 4s for true multi-device synchronization (only if customer logged in)
    const pollInterval = setInterval(async () => {
      const activeCustomer = getCachedCustomer();
      if (!activeCustomer?.email) {
        setActiveOrder(null);
        return;
      }

      const stored = getVerifiedActiveOrder(activeCustomer);
      if (!stored?.id && !stored?.order_number) {
        setActiveOrder(null);
        return;
      }
      if (!supabase) return;
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(stored.id));
        let query = supabase.from('orders').select('*');
        if (isUuid) {
          query = query.eq('id', stored.id);
        } else {
          query = query.eq('order_number', stored.order_number);
        }
        const { data, error } = await query.single();
        if (!error && data) {
          const merged = { ...(stored || {}), ...data };
          const verified = getVerifiedActiveOrder(activeCustomer);
          if (verified) {
            setActiveOrder(prev => ({ ...(prev || stored), ...data }));
            saveActiveOrder(merged);
          } else {
            setActiveOrder(null);
          }
        }
      } catch (e) {
        // poll catch
      }
    }, 4000);

    // 3. Subscribe to live status changes via Realtime & events
    const unsubOrders = subscribeToOrders((payload) => {
      if (!payload) return;
      const updated = payload.new || payload;
      if (updated) {
        const activeCustomer = getCachedCustomer();
        if (!activeCustomer?.email) {
          setActiveOrder(null);
          return;
        }
        const stored = getVerifiedActiveOrder(activeCustomer);
        if (stored && (String(stored.id) === String(updated.id) || stored.order_number === updated.order_number || String(stored.order_number) === String(updated.order_number))) {
          const validStatuses = ['new', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
          const updatedStatus = (typeof updated.status === 'string' && validStatuses.includes(updated.status))
            ? updated.status
            : (stored.status || 'new');
          const merged = { ...(stored || {}), ...updated, status: updatedStatus };
          setActiveOrder(merged);
          saveActiveOrder(merged);
          setIsDismissed(false);
        }
      }
    });

    // 4. Subscribe to Customer Auth state changes (instant hide on logout, instant show on login)
    const unsubAuth = subscribeToCustomerAuth((user) => {
      setCustomerUser(user);
      if (!user?.email) {
        setActiveOrder(null);
      } else {
        const fresh = getVerifiedActiveOrder(user);
        setActiveOrder(fresh);
      }
    });

    // 5. Listen to storage events for cross-tab synchronization
    const handleStorage = (e) => {
      if (e.key === 'venezia_active_order' || e.key === 'venezia_auth_customer') {
        const activeCustomer = getCachedCustomer();
        setCustomerUser(activeCustomer);
        const fresh = getVerifiedActiveOrder(activeCustomer);
        setActiveOrder(fresh);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(pollInterval);
      unsubOrders();
      unsubAuth();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Strict guard: NEVER show the banner to logged-out users or if dismissed
  if (!customerUser?.email || !activeOrder || isDismissed || isBannerDismissed(activeOrder.order_number)) {
    return null;
  }

  const isDelivered = activeOrder.status === 'delivered';

  const getStatusConfig = (status, deliveryType) => {
    const isPickup = deliveryType === 'pickup';
    switch (status) {
      case 'new':
        return {
          icon: <Clock size={16} color="#ffffff" />,
          title: 'Bestellung eingegangen',
          bg: '#1e293b'
        };
      case 'preparing':
        return {
          icon: <Flame size={16} color="#ffffff" />,
          title: 'In der Küche',
          bg: '#d97706'
        };
      case 'out_for_delivery':
        return {
          icon: isPickup ? <Store size={16} color="#ffffff" /> : <Truck size={16} color="#ffffff" />,
          title: isPickup ? 'Bereit zur Abholung' : 'Auf dem Weg',
          bg: '#0284c7'
        };
      case 'delivered':
        return {
          icon: <CheckCircle2 size={16} color="#ffffff" />,
          title: isPickup ? 'Abgeholt' : 'Zugestellt',
          bg: '#16a34a'
        };
      default:
        return {
          icon: <Clock size={16} color="#ffffff" />,
          title: 'In Bearbeitung',
          bg: '#1e293b'
        };
    }
  };

  const config = getStatusConfig(activeOrder.status, activeOrder.delivery_type);

  return (
    <div
      className="active-order-banner"
      onClick={() => onOpenTracker && onOpenTracker(activeOrder)}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1600,
        maxWidth: 'calc(100% - 32px)',
        width: 'max-content',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 16px 40px -8px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        cursor: 'pointer',
        animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
      title="Klicken, um den Bestellstatus im Popup zu öffnen"
    >
      {/* Top micro progress bar */}
      <div style={{
        height: '3px',
        width: '100%',
        background: config.bg,
        transition: 'all 0.5s ease'
      }} />

      <div style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        whiteSpace: 'nowrap'
      }}>
        {/* Status Icon Disc */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: config.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 3px 8px ${config.bg}40`
        }}>
          {config.icon}
        </div>

        {/* Single Line Text: Order Number + Status Only */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          minWidth: 0,
          flex: 1
        }}>
          {/* Blinking red dot for active order (not delivered) */}
          {!isDelivered && (
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#e11d48',
              display: 'inline-block',
              animation: 'pulse 1.2s infinite',
              flexShrink: 0
            }} />
          )}

          <span style={{
            fontSize: '13px',
            fontWeight: '800',
            color: '#0f172a',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            letterSpacing: '0.2px'
          }}>
            #{activeOrder.order_number}
          </span>

          <span style={{ color: '#94a3b8', flexShrink: 0, fontWeight: '700' }}>•</span>

          <span style={{
            fontSize: '13px',
            fontWeight: '700',
            color: config.bg,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {config.title}
          </span>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '4px' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}>
            <ChevronRight size={14} />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
              try {
                if (activeOrder?.order_number) {
                  sessionStorage.setItem(`venezia_banner_dismissed_${activeOrder.order_number}`, '1');
                }
                if (activeOrder?.status === 'delivered' || activeOrder?.status === 'cancelled') {
                  saveActiveOrder(null);
                }
              } catch (err) {}
            }}
            style={{
              color: '#94a3b8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Ausblenden"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
