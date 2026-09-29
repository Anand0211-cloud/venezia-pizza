import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  LogOut,
  ShieldCheck,
  AlertCircle,
  Truck,
  Flame,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Printer,
  KeyRound,
  Store
} from 'lucide-react';
import {
  getCurrentCustomerUser,
  signUpCustomerUser,
  signInCustomerUser,
  signOutCustomerUser,
  resetCustomerPassword,
  sendPasswordResetOtp,
  verifyOtpAndResetPassword,
  updateCustomerProfile,
  getCustomerOrderHistory,
  subscribeToCustomerAuth,
  subscribeToOrders,
  getActiveOrder,
  getOrderCustomerEmail
} from '../lib/supabaseClient';

export default function AccountPage({
  onNavigateHome,
  onNavigateStatus,
  onReorder,
  onTrackOrder
}) {
  const [user, setUser] = useState(null);
  const [authTab, setAuthTab] = useState('login'); // 'login', 'register', 'forgot'
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'tracking', 'security', 'profile'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regStreet, setRegStreet] = useState('');
  const [regZipCity, setRegZipCity] = useState('08525 Plauen');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');

  // Forgot password state (OTP flow)
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'verify' | 'success'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Settings OTP password change state (Strict 2-step flow: Ask email -> Send OTP -> Enter OTP + new password)
  const [settingsPasswordStep, setSettingsPasswordStep] = useState('request'); // 'request' | 'verify'
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsOtp, setSettingsOtp] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [showSettingsNewPassword, setShowSettingsNewPassword] = useState(false);
  const [settingsPasswordSuccess, setSettingsPasswordSuccess] = useState('');
  const [settingsPasswordError, setSettingsPasswordError] = useState('');

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    street: '',
    zip_city: ''
  });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Order history state
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());

  // Active order state
  const [activeOrder, setActiveOrder] = useState(null);

  // Initialize customer user
  useEffect(() => {
    async function init() {
      const u = await getCurrentCustomerUser();
      setUser(u);
      if (u) {
        setProfileForm({
          full_name: u.full_name || '',
          phone: u.phone || '',
          street: u.street || '',
          zip_city: u.zip_city || '08525 Plauen'
        });
        setSettingsEmail(u.email || '');
        const act = getActiveOrder();
        if (act && u.email) {
          const ordEmail = getOrderCustomerEmail(act);
          if (ordEmail && ordEmail === u.email.toLowerCase().trim()) {
            setActiveOrder(act);
          } else {
            setActiveOrder(null);
          }
        } else {
          setActiveOrder(null);
        }
      } else {
        setActiveOrder(null);
      }
    }
    init();

    const unsubAuth = subscribeToCustomerAuth((u) => {
      setUser(u);
      if (u) {
        setProfileForm({
          full_name: u.full_name || '',
          phone: u.phone || '',
          street: u.street || '',
          zip_city: u.zip_city || '08525 Plauen'
        });
        setSettingsEmail(u.email || '');
        loadOrderHistory(u.email, u.phone);
      } else {
        setOrders([]);
      }
    });

    // Helper to immediately update order status in state
    const updateOrderInList = (orderId, newStatus, extra = {}) => {
      if (!orderId) return;
      const cleanTarget = String(orderId).replace('#', '').trim().toLowerCase();
      setOrders(prev => prev.map(ord => {
        const idMatch = ord.id && String(ord.id).toLowerCase() === cleanTarget;
        const numMatch = ord.order_number && String(ord.order_number).replace('#', '').trim().toLowerCase() === cleanTarget;
        if (idMatch || numMatch) {
          return {
            ...ord,
            status: newStatus || ord.status,
            ...extra,
            updated_at: new Date().toISOString()
          };
        }
        return ord;
      }));
    };

    const unsubOrders = subscribeToOrders((payload) => {
      const act = getActiveOrder();
      setActiveOrder(act);

      // 1. Immediately update matching order status in state
      if (payload) {
        const updated = payload.new || payload;
        const targetId = updated.order_number || updated.orderId || updated.id;
        const targetStatus = updated.status;
        if (targetId && targetStatus) {
          updateOrderInList(targetId, targetStatus, updated);
        }
      }

      // 2. Also refresh full list from server
      const cur = getCurrentCustomerUser();
      if (cur?.email) {
        loadOrderHistory(cur.email, cur.phone, false);
      } else if (act) {
        updateOrderInList(act.order_number || act.id, act.status, act);
      }
    });

    // Directly listen to custom event for instantaneous status update (0ms sync)
    const handleStatusEvent = (e) => {
      const detail = e.detail;
      if (!detail) return;
      const targetId = detail.orderId || detail.id || (detail.order && (detail.order.order_number || detail.order.id));
      const targetStatus = detail.status || (detail.order && detail.order.status);
      if (targetId && targetStatus) {
        updateOrderInList(targetId, targetStatus, detail.order || {});
      }
      const act = getActiveOrder();
      if (act && user?.email) {
        const ordEmail = getOrderCustomerEmail(act);
        if (ordEmail && ordEmail === user.email.toLowerCase().trim()) {
          setActiveOrder(act);
        }
      }
    };
    window.addEventListener('venezia:order-status-change', handleStatusEvent);

    // Listen to storage events (multi-tab sync)
    const handleStorage = (e) => {
      if (e.key === 'venezia_active_order' || e.key === 'venezia_last_status_event') {
        const act = getActiveOrder();
        if (act && user?.email) {
          const ordEmail = getOrderCustomerEmail(act);
          if (ordEmail && ordEmail === user.email.toLowerCase().trim()) {
            setActiveOrder(act);
            updateOrderInList(act.order_number || act.id, act.status, act);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Periodic sync interval every 3 seconds to guarantee 100% sync
    const pollInterval = setInterval(() => {
      const act = getActiveOrder();
      if (act && user?.email) {
        const ordEmail = getOrderCustomerEmail(act);
        if (ordEmail && ordEmail === user.email.toLowerCase().trim()) {
          setActiveOrder(act);
          updateOrderInList(act.order_number || act.id, act.status, act);
        }
      }
    }, 3000);

    return () => {
      unsubAuth();
      unsubOrders();
      window.removeEventListener('venezia:order-status-change', handleStatusEvent);
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, [user]);

  const loadOrderHistory = async (email, phone, showSpinner = true) => {
    if (showSpinner) setIsLoadingOrders(true);
    try {
      const list = await getCustomerOrderHistory(email);
      const active = getActiveOrder();
      let combinedList = list ? [...list] : [];
      if (active && email) {
        const ordEmail = getOrderCustomerEmail(active);
        const userEmail = email.toLowerCase().trim();
        if (ordEmail && ordEmail === userEmail) {
          if (!combinedList.some(o => String(o.id) === String(active.id) || o.order_number === active.order_number)) {
            combinedList.unshift(active);
          }
        }
      }
      setOrders(combinedList);
      if (combinedList.length > 0) {
        setExpandedOrderIds(new Set([combinedList[0].id || combinedList[0].order_number]));
      }
    } catch (err) {
      console.warn('Error loading customer order history:', err);
    } finally {
      if (showSpinner) setIsLoadingOrders(false);
    }
  };

  const toggleOrderAccordion = (id) => {
    setExpandedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      const res = await signInCustomerUser({
        email: loginEmail,
        password: loginPassword
      });
      if (res.success && res.user) {
        setUser(res.user);
        setActiveTab('orders');
        loadOrderHistory(res.user.email, res.user.phone);
      } else {
        setLoginError(res.error || 'Ungültige Anmeldedaten.');
      }
    } catch (err) {
      setLoginError(err.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (regPassword.length < 6) {
      setRegError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await signUpCustomerUser({
        email: regEmail,
        password: regPassword,
        full_name: regName,
        phone: regPhone,
        street: regStreet,
        zip_city: regZipCity
      });
      if (res.success && res.user) {
        setUser(res.user);
        setActiveTab('orders');
        loadOrderHistory(res.user.email, res.user.phone);
      } else {
        setRegError(res.error || 'Registrierung fehlgeschlagen.');
      }
    } catch (err) {
      setRegError(err.message || 'Registrierung fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot password OTP request handler (Step 1)
  const handleRequestOtp = async (overrideEmail = null) => {
    const emailToUse = (typeof overrideEmail === 'string' && overrideEmail) ? overrideEmail : forgotEmail;
    setForgotError('');
    setIsSubmitting(true);
    try {
      const res = await sendPasswordResetOtp(emailToUse);
      if (res.success) {
        setForgotEmail(emailToUse);
        setForgotStep('verify');
      } else {
        setForgotError(res.error || 'Fehler beim Senden des Bestätigungscodes.');
      }
    } catch (err) {
      setForgotError(err.message || 'Fehler beim Senden des Bestätigungscodes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Settings OTP request handler (Step 1: Ask email first, then send OTP via Supabase email)
  const handleRequestSettingsOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const targetEmail = (settingsEmail || user?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      setSettingsPasswordError('Bitte geben Sie Ihre registrierte E-Mail-Adresse ein.');
      return;
    }
    setSettingsPasswordError('');
    setSettingsPasswordSuccess('');
    setIsSubmitting(true);
    try {
      const res = await sendPasswordResetOtp(targetEmail);
      if (res.success) {
        setSettingsPasswordStep('verify');
      } else {
        setSettingsPasswordError(res.error || 'Fehler beim Senden des Bestätigungscodes.');
      }
    } catch (err) {
      setSettingsPasswordError(err.message || 'Fehler beim Senden des Bestätigungscodes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Settings OTP verify & reset handler (Step 2: User adds OTP + sets new password)
  const handleVerifySettingsOtpAndChangePassword = async (e) => {
    e.preventDefault();
    setSettingsPasswordError('');
    setSettingsPasswordSuccess('');

    const targetEmail = (settingsEmail || user?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      setSettingsPasswordError('Keine E-Mail-Adresse gefunden.');
      return;
    }
    if (!settingsOtp.trim() || settingsOtp.trim().length < 6) {
      setSettingsPasswordError('Bitte geben Sie den 6-stelligen Bestätigungscode ein.');
      return;
    }
    if (settingsNewPassword.length < 6) {
      setSettingsPasswordError('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (settingsNewPassword !== settingsConfirmPassword) {
      setSettingsPasswordError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtpAndResetPassword({
        email: targetEmail,
        otp: settingsOtp.trim(),
        newPassword: settingsNewPassword
      });
      if (res.success) {
        setSettingsPasswordSuccess('Passwort erfolgreich per Bestätigungscode (OTP) geändert!');
        setSettingsPasswordStep('request');
        setSettingsOtp('');
        setSettingsNewPassword('');
        setSettingsConfirmPassword('');
        setTimeout(() => setSettingsPasswordSuccess(''), 5000);
      } else {
        setSettingsPasswordError(res.error || 'Fehler beim Ändern des Passworts.');
      }
    } catch (err) {
      setSettingsPasswordError(err.message || 'Fehler beim Ändern des Passworts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot password OTP verify & change handler (Step 2)
  const handleVerifyOtpAndChangePassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotOtp.trim() || forgotOtp.trim().length < 6) {
      setForgotError('Bitte geben Sie den 6-stelligen Bestätigungscode ein.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtpAndResetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword
      });
      if (res.success) {
        setForgotStep('success');
      } else {
        setForgotError(res.error || 'Fehler beim Ändern des Passworts.');
      }
    } catch (err) {
      setForgotError(err.message || 'Fehler beim Ändern des Passworts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save profile updates
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await updateCustomerProfile(profileForm);
      if (res.success) {
        setUser(res.user);
        setProfileSaveSuccess(true);
        setTimeout(() => setProfileSaveSuccess(false), 2500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await signOutCustomerUser();
    setUser(null);
    setOrders([]);
    setAuthTab('login');
  };

  const getStatusBadge = (status, deliveryType) => {
    const isPickup = deliveryType === 'pickup';
    switch (status) {
      case 'new':
        return { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'Eingegangen (Received)', icon: <Clock size={13} /> };
      case 'preparing':
        return { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa', label: 'In der Küche (In the kitchen)', icon: <Flame size={13} /> };
      case 'out_for_delivery':
        return {
          bg: '#e0f2fe',
          color: '#0369a1',
          border: '#bae6fd',
          label: isPickup ? 'Bereit zur Abholung (Ready to Collect)' : 'Auf dem Weg (On the way)',
          icon: isPickup ? <Store size={13} /> : <Truck size={13} />
        };
      case 'delivered':
        return {
          bg: '#dcfce7',
          color: '#15803d',
          border: '#bbf7d0',
          label: isPickup ? 'Abgeholt (Picked Up)' : 'Zugestellt (Delivered)',
          icon: <CheckCircle2 size={13} />
        };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', label: 'Storniert (Cancelled)', icon: <AlertCircle size={13} /> };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: 'In Bearbeitung', icon: <Clock size={13} /> };
    }
  };

  const getStatusButtonIcon = (status, deliveryType) => {
    const s = (status || '').toLowerCase();
    const isPickup = deliveryType === 'pickup';
    switch (s) {
      case 'delivered':
        return <CheckCircle2 size={15} color="#22c55e" />;
      case 'out_for_delivery':
        return isPickup ? <Store size={15} color="#38bdf8" /> : <Truck size={15} color="#38bdf8" />;
      case 'preparing':
        return <Flame size={15} color="#f97316" />;
      case 'new':
        return <Clock size={15} color="#fbbf24" />;
      case 'cancelled':
        return <AlertCircle size={15} color="#ef4444" />;
      default:
        return <Clock size={15} color="#94a3b8" />;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' Uhr';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="account-page" style={{
      minHeight: '100vh',
      background: '#f8fafc',
      paddingBottom: '80px'
    }}>
      {/* Italian Ribbon Top Bar */}
      <div style={{
        height: '5px',
        width: '100%',
        background: 'linear-gradient(to right, #008c45 33.3%, #ffffff 33.3%, #ffffff 66.6%, #cd212a 66.6%)'
      }} />

      {/* Header Bar */}
      <div style={{
        background: '#0f172a',
        color: '#ffffff',
        padding: '24px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          maxWidth: '960px',
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
              {user ? 'Kundenkonto & Bestellungen' : 'Venezia Kunden-Portal'}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '960px', margin: '32px auto 0', padding: '0 16px' }}>
        {/* ================================================================ */}
        {/* VIEW A: NOT LOGGED IN                                            */}
        {/* ================================================================ */}
        {!user ? (
          <div style={{
            maxWidth: '520px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '32px 28px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Header info */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#fff1f2',
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <User size={28} />
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                Willkommen bei Venezia
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Melden Sie sich an, um Ihre früheren Bestellungen einzusehen oder Ihr Passwort zu verwalten.
              </p>
            </div>

            {/* Segmented Auth Selector */}
            {authTab !== 'forgot' && (
              <div style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setLoginError(''); }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: authTab === 'login' ? '#ffffff' : 'transparent',
                    color: authTab === 'login' ? '#0f172a' : '#64748b',
                    fontWeight: authTab === 'login' ? '800' : '600',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: authTab === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  Anmelden
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setRegError(''); }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: authTab === 'register' ? '#ffffff' : 'transparent',
                    color: authTab === 'register' ? '#0f172a' : '#64748b',
                    fontWeight: authTab === 'register' ? '800' : '600',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: authTab === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  Neues Konto
                </button>
              </div>
            )}

            {/* LOGIN FORM */}
            {authTab === 'login' && (
              <form onSubmit={handleLogin}>
                {loginError && (
                  <div style={{
                    background: '#fee2e2',
                    color: '#b91c1c',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} />
                    <span>{loginError}</span>
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    E-Mail-Adresse *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="email"
                      required
                      placeholder="ihre.email@beispiel.de"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                      Passwort *
                    </label>
                    <button
                      type="button"
                      onClick={() => { setAuthTab('forgot'); setForgotEmail(loginEmail); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--red)',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 38px 11px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '11px',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    background: 'var(--red)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)'
                  }}
                >
                  {isSubmitting ? 'Wird angemeldet...' : 'Jetzt Anmelden'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {authTab === 'register' && (
              <form onSubmit={handleRegister}>
                {regError && (
                  <div style={{
                    background: '#fee2e2',
                    color: '#b91c1c',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>
                    {regError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Vor- &amp; Nachname *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Maximilian Müller"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Telefonnummer *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0171 1234567"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ihre.email@beispiel.de"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Passwort (min. 6 Zeichen) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Sicheres Passwort"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Straße &amp; Hausnummer
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. Bahnhofstr. 12"
                      value={regStreet}
                      onChange={(e) => setRegStreet(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      PLZ &amp; Stadt
                    </label>
                    <input
                      type="text"
                      value={regZipCity}
                      onChange={(e) => setRegZipCity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    background: 'var(--red)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)'
                  }}
                >
                  {isSubmitting ? 'Konto wird eingerichtet...' : 'Konto erstellen & Anmelden'}
                  <CheckCircle2 size={16} />
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD WITH OTP FORM */}
            {authTab === 'forgot' && (
              <div>
                {forgotStep === 'request' && (
                  <form onSubmit={handleRequestOtp}>
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                        Passwort vergessen?
                      </h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                        Geben Sie Ihre registrierte E-Mail-Adresse ein. Wir senden Ihnen einen 6-stelligen Bestätigungscode (OTP), um Ihr Passwort sicher zurückzusetzen.
                      </p>
                    </div>

                    {forgotError && (
                      <div style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        marginBottom: '14px'
                      }}>
                        {forgotError}
                      </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                        E-Mail-Adresse *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="ihre.email@beispiel.de"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13.5px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        background: 'var(--red)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '13px',
                        fontSize: '14px',
                        fontWeight: '800',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        marginBottom: '12px'
                      }}
                    >
                      {isSubmitting ? 'Code wird gesendet...' : 'Bestätigungscode anfordern (Send OTP)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setAuthTab('login'); setForgotError(''); }}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        color: '#64748b',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '11px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      ← Zurück zur Anmeldung
                    </button>
                  </form>
                )}

                {forgotStep === 'verify' && (
                  <form onSubmit={handleVerifyOtpAndChangePassword}>
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                        Code eingeben &amp; Neues Passwort festlegen
                      </h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                        Bestätigungscode an <strong>{forgotEmail}</strong> gesendet.
                      </p>
                    </div>

                    <div style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1e40af',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      fontSize: '12.5px',
                      marginBottom: '14px',
                      lineHeight: '1.4'
                    }}>
                      ✉️ Ein 6-stelliger Bestätigungscode (OTP) wurde per E-Mail an <strong>{forgotEmail}</strong> gesendet. Bitte prüfen Sie Ihren Posteingang und Spam-Ordner und geben Sie den Code unten ein.
                    </div>

                    {forgotError && (
                      <div style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        marginBottom: '14px'
                      }}>
                        {forgotError}
                      </div>
                    )}

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                        Bestätigungscode (OTP aus E-Mail) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Code aus der E-Mail einfügen"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.trim())}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14.5px',
                          fontWeight: '700',
                          letterSpacing: '1px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                        Neues Passwort (mind. 6 Zeichen) *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showForgotNewPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '11px 36px 11px 12px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '13.5px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                          style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                        Neues Passwort bestätigen *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showForgotConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '11px 36px 11px 12px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '13.5px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                          style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          {showForgotConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        background: 'var(--red)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '13px',
                        fontSize: '14px',
                        fontWeight: '800',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        marginBottom: '10px'
                      }}
                    >
                      {isSubmitting ? 'Wird gespeichert...' : 'Passwort ändern & speichern'}
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={isSubmitting}
                        style={{
                          flex: 1,
                          background: '#f8fafc',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          padding: '10px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Code erneut senden
                      </button>
                      <button
                        type="button"
                        onClick={() => { setForgotStep('request'); setForgotError(''); }}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          color: '#64748b',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '10px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Andere E-Mail
                      </button>
                    </div>
                  </form>
                )}

                {forgotStep === 'success' && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <CheckCircle2 size={34} />
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                      Passwort erfolgreich geändert!
                    </h4>
                    <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>
                      Ihr neues Passwort ist ab sofort aktiv. Sie können sich jetzt direkt anmelden.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail(forgotEmail);
                        setAuthTab('login');
                        setForgotStep('request');
                        setForgotError('');
                        setForgotOtp('');
                        setForgotNewPassword('');
                        setForgotConfirmPassword('');
                      }}
                      style={{
                        width: '100%',
                        background: 'var(--red)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '13px',
                        fontSize: '14px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      Jetzt mit neuem Passwort anmelden
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ================================================================ */
          /* VIEW B: LOGGED IN CUSTOMER DASHBOARD                            */
          /* ================================================================ */
          <div>
            {/* Top Customer Hero Card */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '24px 28px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              marginBottom: '24px',
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
                  borderRadius: '50%',
                  background: 'var(--red)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  fontSize: '20px',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)'
                }}>
                  {(user.full_name || user.email || 'K').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>
                      {user.full_name || 'Venezia Stammkunde'}
                    </h2>
                    <span style={{
                      background: 'rgba(22, 163, 74, 0.25)',
                      color: '#4ade80',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      border: '1px solid rgba(74, 222, 128, 0.3)'
                    }}>
                      ✓ Verifiziert
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                    {user.email} {user.phone ? `• ${user.phone}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '10px',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <LogOut size={15} />
                  <span>Abmelden</span>
                </button>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div style={{
              display: 'flex',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '6px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '24px',
              overflowX: 'auto',
              gap: '6px'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '11px 16px',
                  border: 'none',
                  borderRadius: '10px',
                  background: activeTab === 'orders' ? 'var(--red)' : 'transparent',
                  color: activeTab === 'orders' ? '#ffffff' : '#475569',
                  fontWeight: activeTab === 'orders' ? '800' : '600',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShoppingBag size={16} />
                <span>Orders ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '11px 16px',
                  border: 'none',
                  borderRadius: '10px',
                  background: activeTab === 'security' ? 'var(--red)' : 'transparent',
                  color: activeTab === 'security' ? '#ffffff' : '#475569',
                  fontWeight: activeTab === 'security' ? '800' : '600',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <KeyRound size={16} />
                <span>Passwort &amp; Sicherheit</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '11px 16px',
                  border: 'none',
                  borderRadius: '10px',
                  background: activeTab === 'profile' ? 'var(--red)' : 'transparent',
                  color: activeTab === 'profile' ? '#ffffff' : '#475569',
                  fontWeight: activeTab === 'profile' ? '800' : '600',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <MapPin size={16} />
                <span>Lieferadresse &amp; Profil</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* TAB 1: ORDER HISTORY & PREVIOUS ORDERS                       */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'orders' && (
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                      Alle bisherigen Bestellungen
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                      Klicken Sie auf ein Gericht, um Rezeptur, Zutaten und Notizen einzusehen.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadOrderHistory(user.email, user.phone)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      color: '#475569',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCw size={13} className={isLoadingOrders ? 'spin' : ''} />
                    <span>Aktualisieren</span>
                  </button>
                </div>

                {isLoadingOrders ? (
                  <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
                    <div className="spin" style={{ display: 'inline-block', marginBottom: '8px' }}>
                      <RefreshCw size={26} color="var(--red)" />
                    </div>
                    <p style={{ margin: 0, fontSize: '14px' }}>Bestellungen werden geladen...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '50px 20px',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px dashed #cbd5e1'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#fee2e2',
                      color: 'var(--red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px'
                    }}>
                      <ShoppingBag size={28} />
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                      Noch keine Bestellungen aufgegeben
                    </h4>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                      Sobald Sie eine Bestellung aufgeben, wird sie hier dauerhaft gespeichert.
                    </p>
                    <button
                      type="button"
                      onClick={onNavigateHome}
                      style={{
                        background: 'var(--red)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '11px 22px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Jetzt Pizza bestellen
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {orders.map((ord) => {
                      const orderKey = ord.id || ord.order_number;
                      const isExpanded = expandedOrderIds.has(orderKey);
                      const badge = getStatusBadge(ord.status, ord.delivery_type);
                      const isActive = ord.status === 'new' || ord.status === 'preparing' || ord.status === 'out_for_delivery';

                      return (
                        <div
                          key={orderKey}
                          style={{
                            background: '#ffffff',
                            border: isActive ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            boxShadow: isActive ? '0 4px 16px rgba(245, 158, 11, 0.12)' : '0 2px 6px rgba(0,0,0,0.03)'
                          }}
                        >
                          {/* Order Summary Header */}
                          <div style={{
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                            background: isActive ? '#fffbeb' : '#ffffff'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Red blinking dot ONLY for active orders, NOT delivered */}
                                {isActive && (
                                  <span
                                    style={{
                                      width: '9px',
                                      height: '9px',
                                      borderRadius: '50%',
                                      background: '#e11d48',
                                      display: 'inline-block',
                                      animation: 'pulse 1.2s infinite',
                                      flexShrink: 0
                                    }}
                                    title="Laufende aktive Bestellung"
                                  />
                                )}
                                <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                                  #{ord.order_number}
                                </strong>
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                                {formatDate(ord.created_at)} • {ord.delivery_type === 'pickup' ? 'Selbstabholung' : (ord.street || 'Lieferung')}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {/* Status written on the right side */}
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                                borderRadius: '20px',
                                padding: '4px 10px',
                                fontSize: '11.5px',
                                fontWeight: '800'
                              }}>
                                {badge.icon}
                                <span>{badge.label}</span>
                              </span>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '15.5px', fontWeight: '900', color: 'var(--red)' }}>
                                  {Number(ord.total || 0).toFixed(2).replace('.', ',')} €
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  {(ord.order_items || []).length} {ord.order_items?.length === 1 ? 'Gericht' : 'Gerichte'}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleOrderAccordion(orderKey)}
                                style={{
                                  background: '#f1f5f9',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  cursor: 'pointer',
                                  color: '#475569',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Details anzeigen"
                              >
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </div>
                          </div>

                          {/* Accordion Content */}
                          {isExpanded && (
                            <div style={{
                              padding: '16px 20px',
                              borderTop: '1px solid #f1f5f9',
                              background: '#f8fafc'
                            }}>
                              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '10px' }}>
                                Bestellte Gerichte &amp; Zutaten:
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                {(ord.order_items || []).map((item, idx) => (
                                  <div
                                    key={item.id || idx}
                                    style={{
                                      background: '#ffffff',
                                      padding: '11px 14px',
                                      borderRadius: '10px',
                                      border: '1px solid #e2e8f0',
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

                                    <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                                      {Number(item.total_price || item.unit_price * item.quantity || 0).toFixed(2).replace('.', ',')} €
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Action Buttons */}
                              <div style={{
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap',
                                borderTop: '1px dashed #cbd5e1',
                                paddingTop: '14px'
                              }}>
                                {onNavigateStatus && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateStatus(ord)}
                                    style={{
                                      flex: 1,
                                      minWidth: '120px',
                                      background: '#0f172a',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '10px',
                                      padding: '11px 16px',
                                      fontSize: '13px',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px'
                                    }}
                                    title="Bestellstatus anzeigen"
                                  >
                                    {getStatusButtonIcon(ord.status, ord.delivery_type)}
                                    <span>Status</span>
                                  </button>
                                )}

                                {onReorder && (
                                  <button
                                    type="button"
                                    onClick={() => onReorder(ord.order_items || [])}
                                    style={{
                                      flex: 1,
                                      background: 'var(--red)',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '10px',
                                      padding: '10px 16px',
                                      fontSize: '13px',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    <RotateCcw size={15} />
                                    <span>Erneut bestellen</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}



            {/* ------------------------------------------------------------- */}
            {/* TAB 3: PASSWORD & SECURITY (2-STEP SUPABASE EMAIL OTP)         */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'security' && (
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0',
                maxWidth: '640px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <ShieldCheck size={22} color="var(--red)" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                    Passwort per E-Mail Bestätigungscode (OTP) ändern
                  </h3>
                </div>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
                  Zur Sicherheit wird bei jeder Passwortänderung ein 6-stelliger Bestätigungscode an Ihre registrierte E-Mail gesendet.
                </p>

                {settingsPasswordSuccess && (
                  <div style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle2 size={18} />
                    <span>{settingsPasswordSuccess}</span>
                  </div>
                )}

                {settingsPasswordError && (
                  <div style={{
                    background: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={18} />
                    <span>{settingsPasswordError}</span>
                  </div>
                )}

                {settingsPasswordStep === 'request' ? (
                  /* STEP 1: Ask their email first, then click "Send OTP" */
                  <form onSubmit={handleRequestSettingsOtp} style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    maxWidth: '480px'
                  }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Registrierte E-Mail-Adresse *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input
                          type="email"
                          required
                          placeholder="Ihre registrierte E-Mail"
                          value={settingsEmail}
                          onChange={(e) => setSettingsEmail(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 38px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '13.5px',
                            outline: 'none',
                            background: '#ffffff',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                        An diese Adresse sendet Supabase den 6-stelligen Bestätigungscode.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        background: 'var(--red)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 18px',
                        fontSize: '13.5px',
                        fontWeight: '800',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Mail size={16} />
                      <span>{isSubmitting ? 'Code wird gesendet...' : 'Code per E-Mail senden (Send OTP)'}</span>
                    </button>
                  </form>
                ) : (
                  /* STEP 2: User adds OTP from email + sets new password */
                  <form onSubmit={handleVerifySettingsOtpAndChangePassword} style={{
                    background: '#f8fafc',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '20px',
                    maxWidth: '480px'
                  }}>
                    <div style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1e40af',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      marginBottom: '16px',
                      lineHeight: '1.45'
                    }}>
                      ✉️ Ein Bestätigungscode (OTP) wurde per E-Mail an <strong>{settingsEmail}</strong> gesendet. Bitte kopieren Sie den Code aus Ihrer E-Mail und fügen Sie ihn unten ein.
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                        Bestätigungscode (OTP aus E-Mail) *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <ShieldCheck size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input
                          type="text"
                          required
                          placeholder="Code aus der E-Mail einfügen"
                          value={settingsOtp}
                          onChange={(e) => setSettingsOtp(e.target.value.trim())}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 38px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '15px',
                            letterSpacing: '1px',
                            fontWeight: '700',
                            fontFamily: 'monospace',
                            outline: 'none',
                            background: '#ffffff',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                        Neues Passwort (min. 6 Zeichen) *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input
                          type={showSettingsNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Neues, sicheres Passwort"
                          value={settingsNewPassword}
                          onChange={(e) => setSettingsNewPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 38px 10px 38px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '13.5px',
                            outline: 'none',
                            background: '#ffffff',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsNewPassword(!showSettingsNewPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '10px',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer'
                          }}
                        >
                          {showSettingsNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                        Neues Passwort bestätigen *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input
                          type={showSettingsNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Passwort wiederholen"
                          value={settingsConfirmPassword}
                          onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 38px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '13.5px',
                            outline: 'none',
                            background: '#ffffff',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          width: '100%',
                          background: 'var(--red)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          fontSize: '13.5px',
                          fontWeight: '800',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <KeyRound size={16} />
                        <span>{isSubmitting ? 'Wird geprüft & gespeichert...' : 'Passwort mit OTP ändern'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsPasswordStep('request');
                          setSettingsOtp('');
                          setSettingsNewPassword('');
                          setSettingsConfirmPassword('');
                          setSettingsPasswordError('');
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #cbd5e1',
                          color: '#64748b',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '12.5px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: SAVED DELIVERY ADDRESS & PROFILE                       */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'profile' && (
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0',
                maxWidth: '640px'
              }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  Standard-Lieferadresse &amp; Kontaktdaten
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
                  Diese Daten werden automatisch im Checkout vorausgefüllt.
                </p>

                {profileSaveSuccess && (
                  <div style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <CheckCircle2 size={16} />
                    <span>Profildaten wurden erfolgreich aktualisiert!</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Vor- &amp; Nachname
                    </label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Telefonnummer (für Kurier &amp; Rückfragen)
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                        Straße &amp; Hausnummer
                      </label>
                      <input
                        type="text"
                        value={profileForm.street}
                        onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                        PLZ &amp; Stadt
                      </label>
                      <input
                        type="text"
                        value={profileForm.zip_city}
                        onChange={(e) => setProfileForm({ ...profileForm, zip_city: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: 'var(--red)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px 22px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {isSubmitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
