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
  sendCustomerPhoneOtp,
  verifyCustomerPhoneOtp,
  signOutCustomerUser,
  updateCustomerProfile,
  getCustomerOrderHistory,
  subscribeToCustomerAuth,
  subscribeToOrders,
  getActiveOrder,
  getOrderCustomerEmail,
  getCachedCustomer
} from '../lib/supabaseClient';

export default function AccountPage({
  onNavigateHome,
  onNavigateStatus,
  onReorder,
  onTrackOrder
}) {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'tracking', 'security', 'profile'

  // Phone OTP Auth state
  const [phoneStep, setPhoneStep] = useState('phone'); // 'phone' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Cooldown timer for SMS resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Initialize customer user (mount once)
  useEffect(() => {
    async function init() {
      const u = await getCurrentCustomerUser();
      setUser(prev => {
        if (!prev && !u) return prev;
        if (prev && u && prev.id === u.id && prev.phone === u.phone) return prev;
        return u;
      });
      if (u) {
        setProfileForm({
          full_name: u.full_name || '',
          phone: u.phone || '',
          street: u.street || '',
          zip_city: u.zip_city || '08525 Plauen'
        });
      }
    }
    init();

    const unsubAuth = subscribeToCustomerAuth((updated) => {
      setUser(prev => {
        if (!prev && !updated) return prev;
        if (prev && updated && prev.id === updated.id && prev.phone === updated.phone) return prev;
        return updated;
      });
      if (updated) {
        setProfileForm({
          full_name: updated.full_name || '',
          phone: updated.phone || '',
          street: updated.street || '',
          zip_city: updated.zip_city || '08525 Plauen'
        });
      } else {
        setOrders([]);
        setActiveOrder(null);
      }
    });

    return () => {
      unsubAuth();
    };
  }, []);

  // Order history and status tracking (phone or email)
  useEffect(() => {
    if (!user?.email && !user?.phone) {
      setOrders([]);
      setActiveOrder(null);
      return;
    }

    const userIdentifier = (user.phone || user.email || '').trim();

    // Check active order for current user
    const act = getActiveOrder();
    if (act) {
      const ordEmail = getOrderCustomerEmail(act);
      const ordPhone = act.customer_phone || act.phone || '';
      const phoneMatch = user.phone && ordPhone && ordPhone.replace(/\D/g, '').includes(user.phone.replace(/\D/g, '').slice(-7));
      const emailMatch = user.email && ordEmail && ordEmail.toLowerCase().trim() === user.email.toLowerCase().trim();
      if (phoneMatch || emailMatch) {
        setActiveOrder(act);
      } else {
        setActiveOrder(null);
      }
    } else {
      setActiveOrder(null);
    }

    loadOrderHistory(userIdentifier, user.phone);

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

    // Realtime postgres changes listener
    const unsubOrders = subscribeToOrders((payload) => {
      const currentAct = getActiveOrder();
      if (currentAct) {
        setActiveOrder(currentAct);
      }

      if (payload) {
        const updated = payload.new || payload;
        const targetId = updated.order_number || updated.orderId || updated.id;
        const targetStatus = updated.status;
        if (targetId && targetStatus) {
          updateOrderInList(targetId, targetStatus, updated);
        }
      }

      // Also refresh full list from server
      const cached = getCachedCustomer();
      if (cached?.phone || cached?.email) {
        loadOrderHistory(cached.phone || cached.email, cached.phone, false);
      }
    });

    // Listen to storage events (multi-tab sync)
    const handleStorage = (e) => {
      if (e.key === 'venezia_active_order' || e.key === 'venezia_last_status_event') {
        const currentAct = getActiveOrder();
        if (currentAct) {
          setActiveOrder(currentAct);
          updateOrderInList(currentAct.order_number || currentAct.id, currentAct.status, currentAct);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Periodic sync interval every 4 seconds to guarantee sync
    const pollInterval = setInterval(() => {
      const currentAct = getActiveOrder();
      if (currentAct) {
        setActiveOrder(currentAct);
        updateOrderInList(currentAct.order_number || currentAct.id, currentAct.status, currentAct);
      }
    }, 4000);

    return () => {
      unsubOrders();
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, [user?.email, user?.phone]);

  const loadOrderHistory = async (identifier, phone, showSpinner = true) => {
    if (showSpinner) setIsLoadingOrders(true);
    try {
      const list = await getCustomerOrderHistory(identifier, phone);
      const active = getActiveOrder();
      let combinedList = list ? [...list] : [];
      if (active && (identifier || phone)) {
        const ordPhone = active.customer_phone || active.phone || '';
        const ordEmail = getOrderCustomerEmail(active);
        const match = (phone && ordPhone && ordPhone.replace(/\D/g, '').includes(phone.replace(/\D/g, '').slice(-7))) ||
                      (identifier && ordEmail && ordEmail.toLowerCase().trim() === identifier.toLowerCase().trim());
        if (match) {
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

  // Send SMS OTP
  const handleSendPhoneOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPhoneError('');
    setPhoneSuccess('');
    if (!phoneNumber.trim()) {
      setPhoneError('Bitte geben Sie Ihre Mobilfunknummer ein.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await sendCustomerPhoneOtp(phoneNumber.trim());
      if (res.success) {
        setPhoneStep('otp');
        setPhoneSuccess(`SMS-Code an ${res.phone || phoneNumber} gesendet!`);
        setResendCooldown(30);
      } else {
        setPhoneError(res.error || 'Fehler beim Senden des SMS-Codes.');
      }
    } catch (err) {
      setPhoneError(err.message || 'Fehler beim Senden des SMS-Codes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify SMS OTP
  const handleVerifyPhoneOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPhoneError('');
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setPhoneError('Bitte geben Sie den 6-stelligen SMS-Code ein.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyCustomerPhoneOtp({
        phone: phoneNumber.trim(),
        token: otpCode.trim()
      });
      if (res.success && res.user) {
        setUser(res.user);
        setActiveTab('orders');
        loadOrderHistory(res.user.phone || res.user.email, res.user.phone);
      } else {
        setPhoneError(res.error || 'Ungültiger oder abgelaufener SMS-Code.');
      }
    } catch (err) {
      setPhoneError(err.message || 'Ungültiger oder abgelaufener SMS-Code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend SMS code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    await handleSendPhoneOtp();
  };

  // Logout handler
  const handleLogout = async () => {
    await signOutCustomerUser();
    setUser(null);
    setOrders([]);
    setActiveOrder(null);
    setPhoneStep('phone');
    setOtpCode('');
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
          /* ================================================================ */
          /* VIEW A: MOBILE PHONE OTP LOGIN & VERIFICATION (PASSWORDLESS)    */
          /* ================================================================ */
          <div style={{
            maxWidth: '460px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '36px 30px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Header info */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fff1f2',
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.15)'
              }}>
                <Phone size={30} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
                Kunden-Login
              </h2>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>
                {phoneStep === 'phone'
                  ? 'Geben Sie Ihre Handynummer ein. Sie erhalten sofort einen sicheren Einmal-Code per SMS.'
                  : `Geben Sie den 6-stelligen Code ein, den wir per SMS an ${phoneNumber} gesendet haben.`}
              </p>
            </div>

            {/* Error Message */}
            {phoneError && (
              <div style={{
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{phoneError}</span>
              </div>
            )}

            {/* Success Message */}
            {phoneSuccess && (
              <div style={{
                background: '#dcfce7',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>{phoneSuccess}</span>
              </div>
            )}

            {phoneStep === 'phone' ? (
              /* STEP 1: PHONE NUMBER INPUT */
              <form onSubmit={handleSendPhoneOtp}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    Mobilfunknummer *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                    <input
                      type="tel"
                      required
                      autoFocus
                      placeholder="z.B. 0170 1234567 oder +49..."
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '13px 14px 13px 44px',
                        borderRadius: '12px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '15px',
                        fontWeight: '600',
                        outline: 'none',
                        background: '#f8fafc',
                        boxSizing: 'border-box',
                        letterSpacing: '0.3px',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--red)'}
                      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                    💡 Sie erhalten einen 6-stelligen SMS-Code. Kein Passwort nötig!
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
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                    transition: 'opacity 0.2s'
                  }}
                >
                  <Phone size={17} />
                  <span>{isSubmitting ? 'SMS-Code wird gesendet...' : 'SMS-Code anfordern'}</span>
                </button>

                <div style={{
                  marginTop: '22px',
                  padding: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#64748b',
                  lineHeight: '1.5'
                }}>
                  🔒 <strong>100% Sicher &amp; Passwortlos:</strong> Ihre Handynummer ist Ihr persönlicher Login. Frühere Bestellungen werden automatisch verknüpft.
                </div>
              </form>
            ) : (
              /* STEP 2: 6-DIGIT OTP VERIFICATION */
              <form onSubmit={handleVerifyPhoneOtp}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                    6-stelliger SMS-Code *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={20} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(val);
                        if (val.length === 6) {
                          setTimeout(() => {
                            verifyCustomerPhoneOtp({
                              phone: phoneNumber.trim(),
                              token: val
                            }).then(res => {
                              if (res.success && res.user) {
                                setUser(res.user);
                                setActiveTab('orders');
                                loadOrderHistory(res.user.phone || res.user.email, res.user.phone);
                              } else {
                                setPhoneError(res.error || 'Ungültiger SMS-Code.');
                              }
                            });
                          }, 100);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '13px 14px 13px 44px',
                        borderRadius: '12px',
                        border: '2px solid var(--red)',
                        fontSize: '20px',
                        fontWeight: '900',
                        letterSpacing: '8px',
                        textAlign: 'center',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', display: 'block', textAlign: 'center' }}>
                    SMS-Code aus Ihrer Nachrichten-App eingeben
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length < 6}
                  style={{
                    width: '100%',
                    background: 'var(--red)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: (isSubmitting || otpCode.length < 6) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                    opacity: (isSubmitting || otpCode.length < 6) ? 0.6 : 1,
                    marginBottom: '14px'
                  }}
                >
                  <CheckCircle2 size={17} />
                  <span>{isSubmitting ? 'Wird überprüft...' : 'Code bestätigen & anmelden'}</span>
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isSubmitting}
                    style={{
                      flex: 1,
                      background: '#f8fafc',
                      color: resendCooldown > 0 ? '#94a3b8' : '#0f172a',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {resendCooldown > 0 ? `Code erneut senden (${resendCooldown}s)` : 'SMS erneut senden'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep('phone');
                      setOtpCode('');
                      setPhoneError('');
                      setPhoneSuccess('');
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      color: '#64748b',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Nummer ändern
                  </button>
                </div>
              </form>
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
                    📱 {user.phone || user.user_metadata?.phone || 'Mobilfunknummer'} {user.email && !user.email.includes('@customer.venezia.internal') ? `• ${user.email}` : ''}
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
                <ShieldCheck size={16} />
                <span>Sicherheit &amp; Mobilfunk</span>
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
                    Sicherheit &amp; Mobilfunk-Login
                  </h3>
                </div>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                  Ihr Venezia Pizza Kundenkonto ist modern und passwortlos geschützt. Sie melden sich bei jeder Anmeldung sicher per SMS-Code (OTP) an.
                </p>

                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Verifizierte Rufnummer
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📱</span>
                        <span>{user?.phone || user?.user_metadata?.phone || 'Nicht hinterlegt'}</span>
                      </div>
                    </div>
                    <span style={{
                      background: '#dcfce7',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ✓ Per SMS verifiziert
                    </span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                    Bestellungen und Status-Updates werden direkt mit dieser Mobilfunknummer verknüpft. Kein Passwort nötig — Ihr Telefon ist Ihr Schlüssel.
                  </p>
                </div>

                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '22px'
                }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '800', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔒</span> Warum kein Passwort?
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#1e3a8a', lineHeight: '1.6' }}>
                    <li><strong>Kein vergessenes Passwort:</strong> Sie müssen sich nie wieder ein Passwort merken.</li>
                    <li><strong>Maximaler Schutz:</strong> Jede Anmeldung erfordert einen echten, zeitlich begrenzten 6-stelligen SMS-Sicherheitscode.</li>
                    <li><strong>Schnellere Bestellung:</strong> Bei zukünftigen Bestellungen einfach Handynummer eingeben und sofort loslegen.</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      background: '#ffffff',
                      color: '#b91c1c',
                      border: '1.5px solid #fecaca',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <LogOut size={15} />
                    <span>Aus diesem Konto abmelden</span>
                  </button>
                </div>
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

                  <div className="account-form-row" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', marginBottom: '20px' }}>
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
