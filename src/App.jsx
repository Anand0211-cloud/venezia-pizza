import React, { useState, useEffect } from 'react';
import { Check, ShoppingBag, ArrowRight, Clock, UtensilsCrossed } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import SpecialOffers from './components/SpecialOffers';
import PopularPizzas from './components/PopularPizzas';
import MenuPage from './components/MenuPage';
import WhyUs from './components/WhyUs';
import AboutSection from './components/AboutSection';
import PartyCateringSection from './components/PartyCateringSection';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import ActiveOrderBanner from './components/ActiveOrderBanner';
import AccountModal from './components/AccountModal';
import AccountPage from './components/AccountPage';
import OrderStatusPage from './components/OrderStatusPage';
import AdminPanel from './components/AdminPanel';
import { saveActiveOrder, playOrderChime, supabase, createOrder, subscribeToStoreSettings } from './lib/supabaseClient';
import { sendOrderConfirmationEmail } from './lib/emailService';
import { getSumUpCheckoutStatus } from './lib/sumupService';

export default function App() {
  const resolveViewFromUrl = () => {
    if (typeof window === 'undefined') return 'home';
    const hash = (window.location.hash || '').toLowerCase();
    const pathname = (window.location.pathname || '').toLowerCase();
    const search = (window.location.search || '').toLowerCase();

    if (
      hash === '#admin' ||
      hash === '#/admin' ||
      pathname === '/admin' ||
      search.includes('admin')
    ) {
      return 'admin';
    }
    if (hash === '#speisekarte' || hash === '#/speisekarte' || pathname === '/speisekarte') {
      return 'speisekarte';
    }
    if (hash === '#konto' || hash === '#account' || pathname === '/account' || pathname === '/konto') {
      return 'account';
    }
    if (hash === '#status' || pathname === '/status') {
      return 'status';
    }
    return 'home';
  };

  const [currentView, setCurrentView] = useState(resolveViewFromUrl);

  // Listen for browser back/forward and URL hash changes (e.g. entering #admin or clicking link)
  useEffect(() => {
    const handleUrlChange = () => {
      const nextView = resolveViewFromUrl();
      setCurrentView(nextView);
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('venezia_cart_items');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Persist cart to localStorage so removals and additions are preserved
  useEffect(() => {
    try {
      localStorage.setItem('venezia_cart_items', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isClosedModalOpen, setIsClosedModalOpen] = useState(false);

  // Subscribe to live store open/closed settings from database
  useEffect(() => {
    const unsub = subscribeToStoreSettings((open) => {
      setIsStoreOpen(open);
    });
    return () => unsub();
  }, []);

  // Reorder items from previous orders in Account Modal
  const handleReorder = (orderItems) => {
    if (!isStoreOpen) {
      setIsClosedModalOpen(true);
      return;
    }
    if (!orderItems || orderItems.length === 0) return;
    const newCartItems = orderItems.map((item, idx) => ({
      id: `reorder-${Date.now()}-${idx}`,
      name: item.item_name,
      price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      selectedSize: item.selected_size,
      isAmerican: item.is_american,
      selectedToppings: item.toppings_selected,
      specialInstructions: item.special_instructions
    }));
    setCartItems(prev => [...prev, ...newCartItems]);
    setIsCartOpen(true);
    showToast(`${newCartItems.length} ${newCartItems.length === 1 ? 'Gericht' : 'Gerichte'} zum Warenkorb hinzugefügt!`);
  };

  // Track an active order directly from Account Modal
  const handleTrackFromAccount = (order) => {
    setTrackingOrder(order);
    setIsOrderModalOpen(true);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Show Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  // Handle return redirect from SumUp Online payment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const isSumupReturn = urlParams.get('payment') === 'sumup_complete' || urlParams.has('smp-status');
    const returnedOrderNumber = urlParams.get('order_number');
    const smpStatus = (urlParams.get('smp-status') || '').toUpperCase();

    if (!isSumupReturn) return;

    async function completeSumupOrder() {
      try {
        const pendingRaw = localStorage.getItem('venezia_pending_sumup_order');
        let orderPayload = null;
        let cart = [];
        let checkoutId = null;

        if (pendingRaw) {
          try {
            const parsed = JSON.parse(pendingRaw);
            orderPayload = parsed.orderPayload || parsed.order;
            cart = parsed.cartItems || [];
            checkoutId = parsed.checkoutId;
          } catch (e) {
            console.error('Failed to parse pending sumup order:', e);
          }
        }

        if (!checkoutId) {
          localStorage.removeItem('venezia_pending_sumup_order');
          return;
        }

        // STRICT PAYMENT VERIFICATION:
        // An order is ONLY placed if SumUp explicitly confirms the status as 'PAID'
        // or a successful transaction exists in the checkout object.
        let isPaymentSuccessful = false;
        try {
          const statusRes = await getSumUpCheckoutStatus(checkoutId);
          const checkoutData = statusRes?.checkout;
          const status = (checkoutData?.status || '').toUpperCase();
          const hasSuccessfulTxn = Array.isArray(checkoutData?.transactions) &&
            checkoutData.transactions.some(t => {
              const txStatus = (t.status || '').toUpperCase();
              return txStatus === 'SUCCESSFUL' || txStatus === 'PAID';
            });

          if (status === 'PAID' || hasSuccessfulTxn) {
            isPaymentSuccessful = true;
          } else {
            console.warn('[SumUp Verification] Payment not completed. Checkout status:', status, checkoutData);
          }
        } catch (chkErr) {
          console.error('[SumUp Verification] Status check error:', chkErr);
        }

        if (!isPaymentSuccessful) {
          alert('Die SumUp-Zahlung wurde nicht abgeschlossen oder abgebrochen. Ihre Bestellung wurde NICHT aufgegeben und Ihr Konto wurde nicht belastet.');
          localStorage.removeItem('venezia_pending_sumup_order');
          return;
        }

        if (orderPayload) {
          const finalizedPayload = {
            ...orderPayload,
            order_number: returnedOrderNumber || orderPayload.order_number,
            payment_method: 'sumup',
            payment_status: 'paid',
            status: 'confirmed',
            payment_id: checkoutId || orderPayload.payment_id || `SUMUP-${Date.now()}`
          };

          // Create the real order in Supabase & active storage
          const result = await createOrder(finalizedPayload, cart);
          const savedOrder = result?.order || finalizedPayload;

          saveActiveOrder(savedOrder);
          setTrackingOrder(savedOrder);
          setIsOrderModalOpen(true);

          try {
            playOrderChime();
          } catch {
            // ignore
          }

          // Clear cart and pending order
          setCartItems([]);
          localStorage.removeItem('venezia_cart_items');
          localStorage.removeItem('venezia_pending_sumup_order');

          showToast('Zahlung erfolgreich autorisiert! Ihre Bestellung wird zubereitet.');
        }
      } catch (err) {
        console.error('Error completing SumUp payment redirect:', err);
      } finally {
        // Clean URL cleanly without reloading the page
        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    }

    completeSumupOrder();
  }, []);


  // Add Item to Cart
  const handleAddToCart = (item) => {
    if (!isStoreOpen) {
      setIsClosedModalOpen(true);
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
    showToast(`"${item.name}" wurde zum Warenkorb hinzugefügt!`);
  };

  // Update Quantity
  const handleUpdateQty = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  // Remove Item
  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear Cart after completed order
  const handleOrderCompleted = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('venezia_cart_items');
    } catch {
      // ignore
    }
    showToast('Bestellung erfolgreich übermittelt!');
  };

  // Handle navigation
  const handleNavigate = (sectionId, payload = null) => {
    if (sectionId === 'admin') {
      window.location.hash = 'admin';
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'speisekarte') {
      window.location.hash = 'speisekarte';
      setCurrentView('speisekarte');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'account' || sectionId === 'konto') {
      window.location.hash = 'konto';
      setCurrentView('account');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'status' || sectionId === 'tracking') {
      if (payload) setTrackingOrder(payload);
      window.location.hash = 'status';
      setCurrentView('status');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentView !== 'home') {
      window.location.hash = '';
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
      return;
    }

    // On home view:
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If in admin view, render dedicated Admin Portal
  if (currentView === 'admin') {
    return (
      <AdminPanel onBackToStore={() => {
        window.location.hash = '';
        setCurrentView('home');
      }} />
    );
  }

  return (
    <div className="app-layout">
      {/* Sticky Header Navigation */}
      <Navbar
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrderModal={() => {
          setTrackingOrder(null);
          setIsOrderModalOpen(true);
        }}
        onOpenAccount={() => handleNavigate('account')}
        onAddToCart={handleAddToCart}
        activeSection={currentView === 'speisekarte' ? 'speisekarte' : 'home'}
        onNavigate={handleNavigate}
      />

      {/* Top Notification Strip when Online Ordering is Closed */}
      {!isStoreOpen && (
        <div className="store-closed-notification-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: '#fca5a5',
              boxShadow: '0 0 6px #fca5a5'
            }} />
            <span>Wir haben derzeit geschlossen – Online-Bestellungen sind zurzeit pausiert.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentView('speisekarte');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              background: '#ffffff',
              color: '#991b1b',
              border: 'none',
              borderRadius: '20px',
              padding: '4px 14px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Speisekarte ansehen
          </button>
        </div>
      )}

      <main>
        {currentView === 'speisekarte' ? (
          /* Dedicated Full Menu Page View */
          <div>
            <MenuPage
              onAddToCart={handleAddToCart}
              onOpenCart={() => setIsCartOpen(true)}
              selectedInitialCategory={selectedCategory}
            />
          </div>
        ) : currentView === 'account' ? (
          /* Dedicated Full Customer Account Page */
          <AccountPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateStatus={(ord) => handleNavigate('status', ord)}
            onReorder={handleReorder}
            onTrackOrder={(ord) => {
              setTrackingOrder(ord);
              setIsOrderModalOpen(true);
            }}
          />
        ) : currentView === 'status' ? (
          /* Dedicated Full Order Status Tracking Page */
          <OrderStatusPage
            initialOrder={trackingOrder}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateAccount={() => handleNavigate('account')}
            onOpenOrderModal={(ord) => {
              setTrackingOrder(ord);
              setIsOrderModalOpen(true);
            }}
          />
        ) : (
          /* Home View with all sections + embedded full menu section */
          <div>
            {/* Hero Section */}
            <Hero
              onAddToCart={handleAddToCart}
              onOrderClick={() => {
                if (!isStoreOpen) {
                  setIsClosedModalOpen(true);
                  return;
                }
                const el = document.getElementById('angebote');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onMenuClick={() => {
                setCurrentView('speisekarte');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Category Round Carousel Bar */}
            <Categories
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                setCurrentView('speisekarte');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Special Offers Section */}
            <SpecialOffers
              onAddToCart={handleAddToCart}
              onShowAllOffers={() => {
                setSelectedCategory('all');
                setCurrentView('speisekarte');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Popular Pizzas Section */}
            <PopularPizzas
              onAddToCart={handleAddToCart}
              onShowAllMenu={() => {
                setSelectedCategory('pizza');
                setCurrentView('speisekarte');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Why Venezia Section */}
            <WhyUs />

            {/* Tradition / About Section */}
            <AboutSection
              onLearnMore={() => {
                const el = document.getElementById('kontakt');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Party- & Firmenservice Catering Banner */}
            <PartyCateringSection
              onInquiryClick={() => {
                if (!isStoreOpen) {
                  setIsClosedModalOpen(true);
                  return;
                }
                setIsOrderModalOpen(true);
              }}
            />
          </div>
        )}
      </main>

      {/* Floating Bottom Quick Cart Bar (Mobile & Desktop) */}
      {cartCount > 0 && !isCartOpen && (
        <div
          className="floating-bottom-cart-bar"
          onClick={() => setIsCartOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'var(--red)',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '13px'
            }}>
              {cartCount}
            </div>
            <span style={{ fontSize: '13.5px', fontWeight: '600' }}>Warenkorb ansehen</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: '#ffffff', fontSize: '15px' }}>
              {cartTotal.toFixed(2).replace('.', ',')} €
            </strong>
            <ArrowRight size={16} color="var(--red)" />
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        isStoreOpen={isStoreOpen}
        onCheckout={() => {
          if (!isStoreOpen) {
            setIsClosedModalOpen(true);
            return;
          }
          setIsCartOpen(false);
          setTrackingOrder(null);
          setIsOrderModalOpen(true);
        }}
      />

      {/* Floating Active Order Tracker Banner for Customer */}
      <ActiveOrderBanner
        onOpenTracker={(order) => {
          setTrackingOrder(order);
          setIsOrderModalOpen(true);
        }}
      />

      {/* Complete Checkout, Payment & Live Order Tracking Modal */}
      <CheckoutModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setTrackingOrder(null);
        }}
        cartItems={cartItems}
        onCompleteOrder={handleOrderCompleted}
        initialActiveOrder={trackingOrder}
        isStoreOpen={isStoreOpen}
        onNavigateStatus={(order) => {
          setIsOrderModalOpen(false);
          handleNavigate('status', order);
        }}
        onNavigateAccount={() => {
          setIsOrderModalOpen(false);
          handleNavigate('account');
        }}
      />

      {/* Customer Account & Order History Portal Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onReorder={handleReorder}
        onTrackOrder={handleTrackFromAccount}
        onNavigatePage={() => {
          setIsAccountModalOpen(false);
          handleNavigate('account');
        }}
        onNavigateStatus={(order) => {
          setIsAccountModalOpen(false);
          handleNavigate('status', order);
        }}
      />

      {/* Store Closed Informative Popup Modal */}
      {isClosedModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3500,
            padding: '20px'
          }}
          onClick={() => setIsClosedModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              padding: '36px 28px 28px 28px',
              position: 'relative',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsClosedModalOpen(false)}
              aria-label="Schließen"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '16px',
                fontWeight: '700'
              }}
            >
              ✕
            </button>

            {/* Glowing Icon */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#fef2f2',
              border: '2px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              color: '#dc2626',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.15)'
            }}>
              <Clock size={36} />
            </div>

            <h3 style={{
              fontSize: '22px',
              fontWeight: '900',
              color: '#0f172a',
              margin: '0 0 8px 0',
              letterSpacing: '-0.3px'
            }}>
              Wir haben derzeit geschlossen
            </h3>

            <div style={{
              display: 'inline-block',
              background: '#fee2e2',
              color: '#991b1b',
              fontSize: '12px',
              fontWeight: '800',
              padding: '4px 12px',
              borderRadius: '20px',
              marginBottom: '16px'
            }}>
              Online-Bestellungen sind zurzeit pausiert
            </div>

            <p style={{
              fontSize: '14px',
              color: '#475569',
              lineHeight: '1.6',
              margin: '0 0 20px 0'
            }}>
              Liebe Gäste, unser Restaurant nimmt im Moment keine Bestellungen entgegen.
              Sie können sich jedoch sehr gerne in Ruhe unsere Speisekarte mit allen Spezialitäten und Preisen ansehen!
            </p>

            {/* Opening Hours Box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '14px 16px',
              textAlign: 'left',
              marginBottom: '24px',
              fontSize: '12.5px',
              color: '#334155',
              lineHeight: '1.55'
            }}>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--red)" />
                <span>Unsere regulären Öffnungszeiten:</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Montag – Freitag:</span>
                <strong>10:30 – 14:30 &amp; 16:30 – 23:00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Samstag, Sonntag &amp; Feiertage:</span>
                <strong>10:30 – 23:00</strong>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsClosedModalOpen(false);
                  setCurrentView('speisekarte');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  background: 'var(--red)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '13px 20px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <UtensilsCrossed size={17} />
                <span>Speisekarte ansehen</span>
              </button>

              <button
                type="button"
                onClick={() => setIsClosedModalOpen(false)}
                style={{
                  background: 'transparent',
                  color: '#64748b',
                  border: 'none',
                  padding: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      <div className={`toast-notice ${toastMessage ? 'show' : ''}`}>
        <Check size={18} />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
