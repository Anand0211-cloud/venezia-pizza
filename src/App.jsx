import React, { useState, useEffect } from 'react';
import { Check, ShoppingBag, ArrowRight } from 'lucide-react';
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
import { saveActiveOrder, playOrderChime, supabase, createOrder } from './lib/supabaseClient';
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

  // Reorder items from previous orders in Account Modal
  const handleReorder = (orderItems) => {
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
                setIsOrderModalOpen(true);
              }}
            />
          </div>
        )}
      </main>

      {/* Floating Bottom Quick Cart Bar (Mobile & Desktop) */}
      {cartCount > 0 && !isCartOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1500,
          width: 'calc(100% - 40px)',
          maxWidth: '480px',
          background: '#111827',
          color: '#ffffff',
          borderRadius: '50px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          animation: 'fadeIn 0.2s ease-out'
        }}
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
        onCheckout={() => {
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

      {/* Toast Notice */}
      <div className={`toast-notice ${toastMessage ? 'show' : ''}`}>
        <Check size={18} />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
