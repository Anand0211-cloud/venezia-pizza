import React, { useState, useEffect } from 'react';
import {
  X,
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
  getOrderCustomerEmail
} from '../lib/supabaseClient';

export default function AccountModal({
  isOpen,
  onClose,
  onReorder,
  onTrackOrder,
  onNavigatePage,
  onNavigateStatus
}) {
  const [user, setUser] = useState(null);
  const [accountSubTab, setAccountSubTab] = useState('orders'); // 'orders', 'profile', 'security'

  // Mobile Phone OTP Authentication state
  const [phoneStep, setPhoneStep] = useState('phone'); // 'phone' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    street: '',
    zip_city: ''
  });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Settings Email state
  const [settingsEmail, setSettingsEmail] = useState('');

  // Order history state
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());

  // Cooldown timer for SMS resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Load current user on open & subscribe
  useEffect(() => {
    async function initUser() {
      const u = await getCurrentCustomerUser();
      setUser(prev => {
        if (!prev && !u) return prev;
        if (prev && u && prev.id === u.id && prev.email === u.email) return prev;
        return u;
      });
      if (u) {
        setProfileForm({
          full_name: u.full_name || '',
          phone: u.phone || '',
          street: u.street || '',
          zip_city: u.zip_city || '08525 Plauen'
        });
        if (u.email) setSettingsEmail(u.email);
      }
    }
    if (isOpen) {
      initUser();
    }

    const unsubAuth = subscribeToCustomerAuth((updated) => {
      setUser(prev => {
        if (!prev && !updated) return prev;
        if (prev && updated && prev.id === updated.id && prev.email === updated.email) return prev;
        return updated;
      });
      if (updated) {
        setProfileForm({
          full_name: updated.full_name || '',
          phone: updated.phone || '',
          street: updated.street || '',
          zip_city: updated.zip_city || '08525 Plauen'
        });
        if (updated.email) setSettingsEmail(updated.email);
      } else {
        setOrders([]);
      }
    });

    return () => {
      unsubAuth();
    };
  }, [isOpen]);

  // Subscribe to realtime orders updates so status changes in kitchen update customer view instantaneously
  useEffect(() => {
    if (!isOpen || (!user?.email && !user?.phone)) {
      if (!user?.email && !user?.phone) setOrders([]);
      return;
    }

    const userEmail = (user?.email || '').toLowerCase().trim();
    const userPhone = user?.phone || '';
    loadOrderHistory(userEmail, userPhone);

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
      if (payload) {
        const updated = payload.new || payload;
        const targetId = updated.order_number || updated.orderId || updated.id;
        const targetStatus = updated.status;
        if (targetId && targetStatus) {
          updateOrderInList(targetId, targetStatus, updated);
        }
      }
    });

    const handleStorage = (e) => {
      if (e.key === 'venezia_active_order') {
        const act = getActiveOrder();
        if (act) {
          const ordEmail = getOrderCustomerEmail(act);
          const ordPhone = act.customer_phone || act.phone || '';
          const matchEmail = ordEmail && userEmail && ordEmail === userEmail;
          const matchPhone = userPhone && ordPhone && ordPhone.replace(/\D/g, '').endsWith(userPhone.replace(/\D/g, '').slice(-7));
          if (matchEmail || matchPhone) {
            updateOrderInList(act.order_number || act.id, act.status, act);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    const pollInterval = setInterval(() => {
      const act = getActiveOrder();
      if (act) {
        const ordEmail = getOrderCustomerEmail(act);
        const ordPhone = act.customer_phone || act.phone || '';
        const matchEmail = ordEmail && userEmail && ordEmail === userEmail;
        const matchPhone = userPhone && ordPhone && ordPhone.replace(/\D/g, '').endsWith(userPhone.replace(/\D/g, '').slice(-7));
        if (matchEmail || matchPhone) {
          updateOrderInList(act.order_number || act.id, act.status, act);
        }
      }
    }, 4000);

    return () => {
      unsubOrders();
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, [isOpen, user?.email, user?.phone]);

  const loadOrderHistory = async (email, phone, showSpinner = true) => {
    if (showSpinner) setIsLoadingOrders(true);
    try {
      const list = await getCustomerOrderHistory(email, phone);
      const active = getActiveOrder();
      let combinedList = list ? [...list] : [];
      if (active) {
        const ordEmail = getOrderCustomerEmail(active);
        const ordPhone = active.customer_phone || active.phone || '';
        const userEmail = (email || '').toLowerCase().trim();
        const userPhone = (phone || '').replace(/\D/g, '');
        const isMatch = (userEmail && ordEmail && ordEmail === userEmail) ||
                        (userPhone && ordPhone && ordPhone.replace(/\D/g, '').endsWith(userPhone.slice(-7)));
        if (isMatch) {
          if (!combinedList.some(o => String(o.id) === String(active.id) || o.order_number === active.order_number)) {
            combinedList.unshift(active);
          }
        }
      }
      setOrders(combinedList);
      // Auto expand the latest order
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

  // Mobile OTP Request Handler (Step 1)
  const handleSendPhoneOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPhoneError('');
    setPhoneSuccess('');
    if (!phoneNumber || phoneNumber.trim().length < 6) {
      setPhoneError('Bitte gib deine Handynummer ein (z.B. +49 170 1234567 oder 0170 1234567).');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await sendCustomerPhoneOtp(phoneNumber);
      if (res.success) {
        setPhoneStep('otp');
        setPhoneSuccess(res.message || `Ein 6-stelliger Bestätigungscode wurde per SMS an ${res.phone || phoneNumber} gesendet.`);
        setResendCooldown(30);
      } else {
        setPhoneError(res.error || 'Fehler beim Senden des SMS-Codes.');
      }
    } catch (err) {
      setPhoneError(err.message || 'SMS-Code konnte nicht gesendet werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mobile OTP Verify Handler (Step 2)
  const handleVerifyPhoneOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPhoneError('');
    const clean = (otpCode || '').trim();
    if (!clean || clean.length < 6) {
      setPhoneError('Bitte gib den vollständigen 6-stelligen SMS-Code ein.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyCustomerPhoneOtp({ phone: phoneNumber, token: clean });
      if (res.success && res.user) {
        setUser(res.user);
        setProfileForm({
          full_name: res.user.full_name || '',
          phone: res.user.phone || phoneNumber,
          street: res.user.street || '',
          zip_city: res.user.zip_city || '08525 Plauen'
        });
        setAccountSubTab('orders');
        loadOrderHistory(res.user.email, res.user.phone);
        setPhoneStep('phone');
        setOtpCode('');
        setPhoneSuccess('');
      } else {
        setPhoneError(res.error || 'Ungültiger Bestätigungscode. Bitte prüfe die 6 Ziffern.');
      }
    } catch (err) {
      setPhoneError(err.message || 'Verifizierung fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP Code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setPhoneError('');
    setIsSubmitting(true);
    try {
      const res = await sendCustomerPhoneOtp(phoneNumber);
      if (res.success) {
        setPhoneSuccess(`Neuer SMS-Code gesendet an ${res.phone || phoneNumber}.`);
        setResendCooldown(30);
      } else {
        setPhoneError(res.error || 'Fehler beim erneuten Senden.');
      }
    } catch (err) {
      setPhoneError(err.message || 'Konnte nicht gesendet werden.');
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

  // Helper for status badge display
  const getStatusBadge = (status, deliveryType) => {
    const isPickup = deliveryType === 'pickup';
    switch (status) {
      case 'new':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fde68a',
          label: 'Eingegangen (Received)',
          icon: <Clock size={13} />
        };
      case 'preparing':
        return {
          bg: '#ffedd5',
          color: '#c2410c',
          border: '#fed7aa',
          label: 'In der Küche (In the kitchen)',
          icon: <Flame size={13} />
        };
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
        return {
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fecaca',
          label: 'Storniert (Cancelled)',
          icon: <AlertCircle size={13} />
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#e2e8f0',
          label: 'In Bearbeitung',
          icon: <Clock size={13} />
        };
    }
  };

  const getStatusButtonIcon = (status, deliveryType) => {
    const s = (status || '').toLowerCase();
    const isPickup = deliveryType === 'pickup';
    switch (s) {
      case 'delivered':
        return <CheckCircle2 size={14} color="#22c55e" />;
      case 'out_for_delivery':
        return isPickup ? <Store size={14} color="#38bdf8" /> : <Truck size={14} color="#38bdf8" />;
      case 'preparing':
        return <Flame size={14} color="#f97316" />;
      case 'new':
        return <Clock size={14} color="#fbbf24" />;
      case 'cancelled':
        return <AlertCircle size={14} color="#ef4444" />;
      default:
        return <Clock size={14} color="#94a3b8" />;
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

  if (!isOpen) return null;

  return (
    <div className="account-modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 2600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div className="account-modal-card" style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: user ? '720px' : '520px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'modalSlideUp 0.25s ease-out'
      }}>
        {/* Italian Ribbon Top Accent */}
        <div style={{
          height: '5px',
          width: '100%',
          background: 'linear-gradient(to right, #008c45 33.3%, #ffffff 33.3%, #ffffff 66.6%, #cd212a 66.6%)'
        }} />

        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#fff1f2',
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                {user ? 'Mein Kundenkonto' : 'Venezia Kundenkonto'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                {user
                  ? `${user.full_name || user.email} • Bestellungen & Profil`
                  : 'Anmelden für schnellere Bestellungen & Bestellverlauf'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onNavigatePage && (
              <button
                type="button"
                onClick={onNavigatePage}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Als eigene Seite öffnen"
              >
                <span>Ganze Seite</span>
                <ArrowRight size={13} />
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Schließen"
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '22px 24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* ============================================================== */}
          {/* VIEW A: NOT LOGGED IN (LOGIN / REGISTER / FORGOT PASSWORD) */}
          {/* ============================================================== */}
          {!user ? (
            <div>


              {/* MOBILE PHONE OTP AUTHENTICATION */}
              {phoneStep === 'phone' ? (
                <form onSubmit={handleSendPhoneOtp}>
                  {/* Header Banner */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '8px 12px 0'
                  }}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.12), rgba(225, 29, 72, 0.22))',
                      color: 'var(--red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      boxShadow: '0 4px 14px rgba(225, 29, 72, 0.15)'
                    }}>
                      <Phone size={26} />
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                      Kunden-Login &amp; Registrierung
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.45' }}>
                      Melde dich sekundenschnell mit deiner Handynummer an. Du erhältst einen sicheren 6-stelligen SMS-Code – kein Passwort nötig!
                    </p>
                  </div>

                  {phoneError && (
                    <div style={{
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertCircle size={16} />
                      <span>{phoneError}</span>
                    </div>
                  )}

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Mobilfunknummer *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                      <input
                        type="tel"
                        id="customer-phone-modal-input"
                        autoFocus
                        required
                        placeholder="z.B. 0170 1234567 oder +49 170 1234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 38px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14.5px',
                          fontWeight: '600',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <span style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
                      💡 Für Deutschland (01...) oder international mit Landesvorwahl (+49..., +91...).
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
                      padding: '13px',
                      fontSize: '14px',
                      fontWeight: '800',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSubmitting ? 'SMS-Code wird angefordert...' : 'SMS-Code anfordern'}
                    <ArrowRight size={16} />
                  </button>

                  <div style={{
                    marginTop: '18px',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11.5px',
                    color: '#64748b'
                  }}>
                    <ShieldCheck size={16} color="#16a34a" />
                    <span>Schnell, sicher &amp; passwortlos. Exklusiv für Venezia Pizza Plauen.</span>
                  </div>
                </form>
              ) : (
                /* STEP 2: ENTER 6-DIGIT OTP */
                <form onSubmit={handleVerifyPhoneOtp}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '18px',
                    padding: '6px 12px 0'
                  }}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <ShieldCheck size={28} />
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                      SMS-Code bestätigen
                    </h3>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: '1.45' }}>
                      Wir haben einen 6-stelligen Bestätigungscode per SMS an <strong style={{ color: '#0f172a' }}>{phoneNumber}</strong> gesendet.
                    </p>
                  </div>

                  {phoneSuccess && (
                    <div style={{
                      background: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '14px'
                    }}>
                      ✓ {phoneSuccess}
                    </div>
                  )}

                  {phoneError && (
                    <div style={{
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertCircle size={16} />
                      <span>{phoneError}</span>
                    </div>
                  )}

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px', textAlign: 'center' }}>
                      6-stelliger Bestätigungscode *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      required
                      maxLength={6}
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(val);
                        if (val.length === 6) {
                          verifyCustomerPhoneOtp({ phone: phoneNumber, token: val }).then(res => {
                            if (res.success && res.user) {
                              setUser(res.user);
                              setProfileForm({
                                full_name: res.user.full_name || '',
                                phone: res.user.phone || phoneNumber,
                                street: res.user.street || '',
                                zip_city: res.user.zip_city || '08525 Plauen'
                              });
                              setAccountSubTab('orders');
                              loadOrderHistory(res.user.email, res.user.phone);
                              setPhoneStep('phone');
                              setOtpCode('');
                              setPhoneSuccess('');
                            } else if (res.error) {
                              setPhoneError(res.error);
                            }
                          });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid var(--red)',
                        fontSize: '24px',
                        fontWeight: '900',
                        textAlign: 'center',
                        letterSpacing: '8px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#fff8f9'
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
                      marginBottom: '12px'
                    }}
                  >
                    {isSubmitting ? 'Wird geprüft...' : 'Code bestätigen & Anmelden'}
                    <CheckCircle2 size={16} />
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep('phone');
                        setPhoneError('');
                        setPhoneSuccess('');
                        setOtpCode('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '4px 0'
                      }}
                    >
                      ← Andere Handynummer
                    </button>

                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || isSubmitting}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? '#94a3b8' : 'var(--red)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        padding: '4px 0'
                      }}
                    >
                      {resendCooldown > 0 ? `Code erneut senden (${resendCooldown}s)` : 'SMS-Code erneut senden'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ============================================================== */
            /* VIEW B: AUTHENTICATED CUSTOMER DASHBOARD (ORDERS & PROFILE)   */
            /* ============================================================== */
            <div>
              {/* User Profile Card Header */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'var(--red)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '17px',
                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.4)'
                  }}>
                    {(user.full_name || user.phone || user.email || 'K').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
                        {user.full_name || 'Venezia Stammkunde'}
                      </h4>
                      <span style={{
                        background: 'rgba(22, 163, 74, 0.25)',
                        color: '#4ade80',
                        fontSize: '10.5px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px solid rgba(74, 222, 128, 0.3)'
                      }}>
                        ✓ Per SMS verifiziert
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                      {user.phone ? `📱 ${user.phone}` : ''} {user.email ? `• ${user.email}` : ''}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <LogOut size={14} />
                  <span>Abmelden</span>
                </button>
              </div>

              {/* Subtabs: Orders vs Profile */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '18px',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setAccountSubTab('orders')}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: accountSubTab === 'orders' ? '3px solid var(--red)' : '3px solid transparent',
                    background: 'transparent',
                    color: accountSubTab === 'orders' ? 'var(--red)' : '#64748b',
                    fontWeight: accountSubTab === 'orders' ? '800' : '600',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <ShoppingBag size={16} />
                  <span>Orders</span>
                  <span style={{
                    background: accountSubTab === 'orders' ? 'var(--red)' : '#e2e8f0',
                    color: accountSubTab === 'orders' ? '#ffffff' : '#475569',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: '10px'
                  }}>
                    {orders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountSubTab('profile')}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: accountSubTab === 'profile' ? '3px solid var(--red)' : '3px solid transparent',
                    background: 'transparent',
                    color: accountSubTab === 'profile' ? 'var(--red)' : '#64748b',
                    fontWeight: accountSubTab === 'profile' ? '800' : '600',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MapPin size={16} />
                  <span>Lieferadresse &amp; Daten</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountSubTab('security')}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: accountSubTab === 'security' ? '3px solid var(--red)' : '3px solid transparent',
                    background: 'transparent',
                    color: accountSubTab === 'security' ? 'var(--red)' : '#64748b',
                    fontWeight: accountSubTab === 'security' ? '800' : '600',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Sicherheit &amp; Mobilnummer</span>
                </button>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SUBTAB 1: ORDER HISTORY & DETAILS */}
              {/* ------------------------------------------------------------- */}
              {accountSubTab === 'orders' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                      Bisherige Bestellungen
                    </span>
                    <button
                      type="button"
                      onClick={() => loadOrderHistory(user.email, user.phone)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '11.5px',
                        color: '#475569',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <RefreshCw size={12} className={isLoadingOrders ? 'spin' : ''} />
                      <span>Aktualisieren</span>
                    </button>
                  </div>

                  {isLoadingOrders ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                      <div className="spin" style={{ display: 'inline-block', marginBottom: '8px' }}>
                        <RefreshCw size={24} color="var(--red)" />
                      </div>
                      <p style={{ margin: 0, fontSize: '13px' }}>Bestellungen werden geladen...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: '#f8fafc',
                      borderRadius: '16px',
                      border: '1px dashed #cbd5e1'
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#fee2e2',
                        color: 'var(--red)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px'
                      }}>
                        <ShoppingBag size={26} />
                      </div>
                      <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                        Noch keine Bestellungen aufgegeben
                      </h4>
                      <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#64748b' }}>
                        Ihre künftigen Bestellungen, Rechnungen und der Live-Zubereitungsstatus werden hier gespeichert.
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        style={{
                          background: 'var(--red)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 18px',
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Jetzt Pizza bestellen
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                              boxShadow: isActive ? '0 4px 16px rgba(245, 158, 11, 0.12)' : '0 2px 6px rgba(0,0,0,0.03)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {/* Order Summary Header */}
                            <div style={{
                              padding: '14px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '10px',
                              background: isActive ? '#fffbeb' : '#ffffff'
                            }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {/* Red blinking dot ONLY for active orders, NOT delivered */}
                                  {isActive && (
                                    <span
                                      style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#e11d48',
                                        display: 'inline-block',
                                        animation: 'pulse 1.2s infinite',
                                        flexShrink: 0
                                      }}
                                      title="Laufende aktive Bestellung"
                                    />
                                  )}
                                  <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>
                                    #{ord.order_number}
                                  </strong>
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                                  {formatDate(ord.created_at)} • {ord.delivery_type === 'pickup' ? 'Abholung im Restaurant' : (ord.street || 'Lieferung')}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {/* Status written on the right side */}
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: badge.bg,
                                  color: badge.color,
                                  border: `1px solid ${badge.border}`,
                                  borderRadius: '20px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: '800'
                                }}>
                                  {badge.icon}
                                  <span>{badge.label}</span>
                                </span>

                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '14.5px', fontWeight: '900', color: 'var(--red)' }}>
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
                                    padding: '7px',
                                    cursor: 'pointer',
                                    color: '#475569',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Details anzeigen"
                                >
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </div>
                            </div>

                            {/* Expandable Order Details & Items */}
                            {isExpanded && (
                              <div style={{
                                padding: '14px 16px',
                                borderTop: '1px solid #f1f5f9',
                                background: '#f8fafc'
                              }}>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '10px' }}>
                                  Bestellte Gerichte &amp; Zutaten:
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                                  {(ord.order_items || []).map((item, idx) => (
                                    <div
                                      key={item.id || idx}
                                      style={{
                                        background: '#ffffff',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start'
                                      }}
                                    >
                                      <div>
                                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                                          <span style={{ color: 'var(--red)', marginRight: '6px' }}>{item.quantity}x</span>
                                          {item.item_name}
                                          {item.selected_size && (
                                            <span style={{ color: '#64748b', fontSize: '11.5px', fontWeight: '600', marginLeft: '6px' }}>
                                              ({item.selected_size})
                                            </span>
                                          )}
                                        </div>
                                        {Array.isArray(item.toppings_selected) && item.toppings_selected.length > 0 && (
                                          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px', fontWeight: '600' }}>
                                            + {item.toppings_selected.map(t => typeof t === 'string' ? t : (t?.name || t?.id || String(t))).join(', ')}
                                          </div>
                                        )}
                                        {item.special_instructions && (
                                          <div style={{ fontSize: '11px', color: '#d97706', marginTop: '2px', fontStyle: 'italic' }}>
                                            Hinweis: {item.special_instructions}
                                          </div>
                                        )}
                                      </div>

                                      <span style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                                        {Number(item.total_price || item.unit_price * item.quantity || 0).toFixed(2).replace('.', ',')} €
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Order Action Buttons */}
                                <div style={{
                                  display: 'flex',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                  borderTop: '1px dashed #cbd5e1',
                                  paddingTop: '12px'
                                }}>
                                  {onNavigateStatus && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onNavigateStatus(ord);
                                        onClose();
                                      }}
                                      style={{
                                        flex: 1,
                                        minWidth: '150px',
                                        background: '#0f172a',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px 14px',
                                        fontSize: '12.5px',
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
                                      onClick={() => {
                                        onReorder(ord.order_items || []);
                                        onClose();
                                      }}
                                      style={{
                                        flex: 1,
                                        minWidth: '120px',
                                        background: 'var(--red)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '9px 12px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '5px'
                                      }}
                                    >
                                      <RotateCcw size={13} />
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
              {/* SUBTAB 2: SAVED DELIVERY ADDRESS & PROFILE */}
              {/* ------------------------------------------------------------- */}
              {accountSubTab === 'profile' && (
                <form onSubmit={handleSaveProfile}>
                  {profileSaveSuccess && (
                    <div style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <CheckCircle2 size={16} />
                      <span>Ihre Profildaten wurden erfolgreich aktualisiert!</span>
                    </div>
                  )}

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
                        outline: 'none',
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
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div className="account-form-row" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                        Standard-Straße &amp; Hausnummer
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
                          outline: 'none',
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
                          outline: 'none',
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
                      padding: '11px 20px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {isSubmitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
                  </button>
                </form>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUBTAB 3: PASSWORD & SECURITY (CHANGE PASSWORD)               */}
              {/* ------------------------------------------------------------- */}
              {accountSubTab === 'security' && (
                <div style={{ maxWidth: '540px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <ShieldCheck size={22} color="var(--red)" />
                    <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                      Sicherheit &amp; Mobilfunk-Login
                    </h4>
                  </div>
                  <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                    Ihr Venezia Pizza Kundenkonto ist modern und passwortlos geschützt. Sie melden sich bei jeder Anmeldung sicher per SMS-Code (OTP) an.
                  </p>

                  <div style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    marginBottom: '18px'
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
                    marginBottom: '20px'
                  }}>
                    <h5 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '800', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🔒</span> Warum kein Passwort?
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#1e3a8a', lineHeight: '1.6' }}>
                      <li><strong>Kein vergessenes Passwort:</strong> Sie müssen sich kein Passwort merken.</li>
                      <li><strong>Maximaler Schutz:</strong> Jede Anmeldung erfordert einen echten, zeitlich begrenzten 6-stelligen SMS-Sicherheitscode.</li>
                      <li><strong>Schnellere Bestellung:</strong> Bei zukünftigen Bestellungen einfach Mobilnummer eingeben und sofort loslegen.</li>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
