import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  Banknote,
  Truck,
  Store,
  ArrowRight,
  ArrowLeft,
  Copy,
  Printer,
  Flame,
  PackageCheck,
  Lock,
  Gift,
  Percent,
  Check,
  Smartphone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  User,
  UserCheck,
  LogIn,
  Eye,
  EyeOff,
  ShoppingBag,
  KeyRound
} from 'lucide-react';
import { restaurantInfo } from '../data/menuData';
import {
  createOrder,
  playOrderChime,
  getActiveOrder,
  saveActiveOrder,
  subscribeToOrders,
  updateOrderStatus,
  getCurrentCustomerUser,
  sendCustomerPhoneOtp,
  verifyCustomerPhoneOtp,
  subscribeToCustomerAuth,
  supabase
} from '../lib/supabaseClient';
import { createSumUpCheckout } from '../lib/sumupService';
import {
  MIN_ORDER_DELIVERY,
  DELIVERY_ZONES_CONFIG,
  ALL_SUPPORTED_AREAS,
  normalizePostcode,
  getDeliveryZone
} from '../lib/deliveryZones';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onCompleteOrder,
  initialActiveOrder = null,
  isStoreOpen = true,
  onNavigateStatus,
  onNavigateAccount
}) {
  const [step, setStep] = useState(1); // 1: Delivery details, 2: Payment & Review, 3: Live Order Tracking
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' or 'pickup'
  const [deliveryTiming, setDeliveryTiming] = useState('asap'); // 'asap' or 'scheduled'
  const [scheduledTime, setScheduledTime] = useState('19:30');

  // Customer Form Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    houseNr: '',
    floorApartment: '',
    plz: '08525',
    city: 'Plauen',
    zipCity: '08525 Plauen',
    note: ''
  });

  // Customer Auth & Mobile Phone OTP State on Checkout
  const [customerUser, setCustomerUser] = useState(null);
  const [checkoutPhoneStep, setCheckoutPhoneStep] = useState('phone'); // 'phone' | 'otp'
  const [checkoutOtpCode, setCheckoutOtpCode] = useState('');
  const [checkoutOtpError, setCheckoutOtpError] = useState('');
  const [checkoutOtpSuccess, setCheckoutOtpSuccess] = useState('');
  const [checkoutResendCooldown, setCheckoutResendCooldown] = useState(0);
  const [isSendingCheckoutOtp, setIsSendingCheckoutOtp] = useState(false);

  // Resend SMS cooldown timer
  useEffect(() => {
    if (checkoutResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setCheckoutResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [checkoutResendCooldown]);

  // Payment Selection (Strictly 2 Production Options: SumUp & COD)
  const [paymentMethod, setPaymentMethod] = useState('sumup'); // 'sumup' or 'cash'
  const [cashOption, setCashOption] = useState('exact'); // 'exact', 'change_50', 'change_100'

  // Driver Tip & Voucher Code
  const [tipAmount, setTipAmount] = useState(2.00); // 0, 1.50, 2.00, 3.50, custom
  const [customTip, setCustomTip] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null); // { code, discountPercent, discountAmount }
  const [voucherError, setVoucherError] = useState('');

  // Processing & Confirmation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('Sichere Verbindung aufbauen...');
  const [confirmedOrder, setConfirmedOrder] = useState(initialActiveOrder);
  const [isCopied, setIsCopied] = useState(false);
  const [showItemsAccordion, setShowItemsAccordion] = useState(false);

  // Helper to parse existing stored zip_city into { plz, city }
  const parseZipCity = (raw) => {
    if (!raw) return { plz: '08525', city: 'Plauen' };
    const match = String(raw).trim().match(/^(\d{5})\s*(.*)$/);
    if (match) {
      return { plz: match[1], city: match[2].trim() || 'Plauen' };
    }
    return { plz: '08525', city: raw.trim() || 'Plauen' };
  };

  // Initialize and listen to customer auth state & prefill
  useEffect(() => {
    async function loadCustomer() {
      const u = await getCurrentCustomerUser();
      setCustomerUser(u);
      if (u) {
        const { plz, city } = parseZipCity(u.zip_city);
        setFormData(prev => ({
          ...prev,
          name: u.full_name || prev.name || '',
          phone: u.phone || prev.phone || '',
          email: u.email || '',
          street: u.street || prev.street || '',
          plz: plz || prev.plz || '08525',
          city: city || prev.city || 'Plauen',
          zipCity: u.zip_city || prev.zipCity || '08525 Plauen'
        }));
      }
    }
    if (isOpen) {
      loadCustomer();
    }
    const unsub = subscribeToCustomerAuth((u) => {
      setCustomerUser(u);
      if (u) {
        const { plz, city } = parseZipCity(u.zip_city);
        setFormData(prev => ({
          ...prev,
          name: u.full_name || prev.name || '',
          phone: u.phone || prev.phone || '',
          email: u.email || '',
          street: u.street || prev.street || '',
          plz: plz || prev.plz || '08525',
          city: city || prev.city || 'Plauen',
          zipCity: u.zip_city || prev.zipCity || '08525 Plauen'
        }));
      } else {
        setFormData({
          name: '',
          phone: '',
          email: '',
          street: '',
          houseNr: '',
          floorApartment: '',
          plz: '08525',
          city: 'Plauen',
          zipCity: '08525 Plauen',
          note: ''
        });
      }
    });
    return () => unsub();
  }, [isOpen]);

  // Manage opening modal for checking out a new order vs tracking an existing order
  useEffect(() => {
    if (!isOpen) {
      // When modal is closed, reset state so future checkouts start fresh at Step 1
      setConfirmedOrder(null);
      setStep(1);
      setIsProcessing(false);
      return;
    }

    if (initialActiveOrder) {
      // Explicitly opened to track a specific order (from banner or account)
      setConfirmedOrder(initialActiveOrder);
      setStep(3);
    } else {
      // User is checking out or placing a new order: ALWAYS start at Step 1
      setConfirmedOrder(null);
      setStep(1);
    }
  }, [isOpen, initialActiveOrder]);


  // Subscribe to live status changes directly from Supabase Database
  useEffect(() => {
    if (!confirmedOrder?.id && !confirmedOrder?.order_number) return;

    // Periodic Supabase Database polling every 3.5s (Guarantees multi-device / different browser sync!)
    const pollInterval = setInterval(async () => {
      if (!supabase) return;
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(confirmedOrder.id));
        let query = supabase.from('orders').select('*, order_items(*)');
        if (isUuid) {
          query = query.eq('id', confirmedOrder.id);
        } else {
          query = query.eq('order_number', confirmedOrder.order_number);
        }
        const { data, error } = await query.single();
        if (!error && data) {
          setConfirmedOrder(prev => ({
            ...prev,
            ...data,
            order_items: (data.order_items && data.order_items.length > 0) ? data.order_items : (prev?.order_items || [])
          }));
          saveActiveOrder({
            ...confirmedOrder,
            ...data,
            order_items: (data.order_items && data.order_items.length > 0) ? data.order_items : (confirmedOrder?.order_items || [])
          });
        }
      } catch (e) {
        // poll catch
      }
    }, 3500);

    const unsub = subscribeToOrders((payload) => {
      if (!payload) return;
      const updated = payload.new || payload;
      if (updated && (String(updated.id) === String(confirmedOrder.id) || updated.order_number === confirmedOrder.order_number || String(updated.order_number) === String(confirmedOrder.order_number))) {
        const validStatuses = ['new', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
        const updatedStatus = (typeof updated.status === 'string' && validStatuses.includes(updated.status))
          ? updated.status
          : (confirmedOrder.status || 'new');
        setConfirmedOrder(prev => ({
          ...prev,
          ...updated,
          status: updatedStatus,
          order_items: (updated.order_items && updated.order_items.length > 0) ? updated.order_items : (prev?.order_items || [])
        }));
        saveActiveOrder({
          ...confirmedOrder,
          ...updated,
          status: updatedStatus,
          order_items: (updated.order_items && updated.order_items.length > 0) ? updated.order_items : (confirmedOrder?.order_items || [])
        });
      }
    });

    return () => {
      clearInterval(pollInterval);
      unsub();
    };
  }, [confirmedOrder?.id, confirmedOrder?.order_number]);

  // Strict email format validation regex (waits until full email e.g. name@domain.com is entered)
  const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

  // Send SMS OTP for unauthenticated customer at checkout
  const handleSendCheckoutOtp = async () => {
    setCheckoutOtpError('');
    setCheckoutOtpSuccess('');
    const rawPhone = (formData.phone || '').trim();
    if (!rawPhone) {
      alert('Bitte geben Sie Ihre Mobilfunknummer ein.');
      return;
    }
    setIsSendingCheckoutOtp(true);
    try {
      const res = await sendCustomerPhoneOtp(rawPhone);
      if (res.success) {
        setCheckoutPhoneStep('otp');
        setCheckoutOtpSuccess(`SMS-Code an ${res.phone || rawPhone} gesendet!`);
        setCheckoutResendCooldown(30);
      } else {
        setCheckoutOtpError(res.error || 'Fehler beim Senden des SMS-Codes.');
        setCheckoutPhoneStep('otp');
      }
    } catch (err) {
      setCheckoutOtpError(err.message || 'Fehler beim Senden des SMS-Codes.');
      setCheckoutPhoneStep('otp');
    } finally {
      setIsSendingCheckoutOtp(false);
    }
  };

  // Verify SMS OTP for customer at checkout and log them in
  const handleVerifyCheckoutOtp = async () => {
    setCheckoutOtpError('');
    if (!checkoutOtpCode.trim() || checkoutOtpCode.trim().length < 6) {
      setCheckoutOtpError('Bitte geben Sie den 6-stelligen SMS-Code ein.');
      return;
    }
    setIsSendingCheckoutOtp(true);
    try {
      const res = await verifyCustomerPhoneOtp({
        phone: formData.phone.trim(),
        token: checkoutOtpCode.trim()
      });
      if (res.success && res.user) {
        setCustomerUser(res.user);
        setCheckoutPhoneStep('phone');
        setCheckoutOtpCode('');
        setFormData(prev => ({
          ...prev,
          name: prev.name || res.user.full_name || '',
          phone: res.user.phone || prev.phone,
          street: prev.street || res.user.street || ''
        }));
        // Proceed directly to step 2 (payment)!
        setStep(2);
      } else {
        setCheckoutOtpError(res.error || 'Ungültiger oder abgelaufener SMS-Code.');
      }
    } catch (err) {
      setCheckoutOtpError(err.message || 'Ungültiger oder abgelaufener SMS-Code.');
    } finally {
      setIsSendingCheckoutOtp(false);
    }
  };

  const handleCheckoutOtpInputChange = (raw) => {
    const val = raw.replace(/\D/g, '').slice(0, 6);
    setCheckoutOtpCode(val);
    if (val.length === 6) {
      setTimeout(() => {
        verifyCustomerPhoneOtp({
          phone: formData.phone.trim(),
          token: val
        }).then(res => {
          if (res.success && res.user) {
            setCustomerUser(res.user);
            setCheckoutPhoneStep('phone');
            setCheckoutOtpCode('');
            setFormData(prev => ({
              ...prev,
              name: prev.name || res.user.full_name || '',
              phone: res.user.phone || prev.phone,
              street: prev.street || res.user.street || ''
            }));
            setStep(2);
          } else {
            setCheckoutOtpError(res.error || 'Ungültiger oder abgelaufener SMS-Code.');
          }
        });
      }, 100);
    }
  };

  const handleResendCheckoutOtp = async () => {
    if (checkoutResendCooldown > 0 || isSendingCheckoutOtp) return;
    await handleSendCheckoutOtp();
  };

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const pickupDiscount = 0; // No discount on pickup
  const voucherDiscount = appliedVoucher
    ? appliedVoucher.discountAmount || (subtotal * (appliedVoucher.discountPercent / 100))
    : 0;
  const totalDiscount = voucherDiscount;
  const effectiveSubtotal = Math.max(0, subtotal - totalDiscount);

  // Postcode-based Delivery Zone & Fee Detection
  const deliveryZone = orderType === 'delivery'
    ? getDeliveryZone(formData.plz, formData.city || formData.street)
    : null;
  const deliveryFee = orderType === 'pickup'
    ? 0
    : (deliveryZone?.isDeliverable ? deliveryZone.fee : 0);
  const effectiveTip = orderType === 'pickup' ? 0 : (Number(customTip !== '' ? customTip : tipAmount) || 0);
  const finalTotal = effectiveSubtotal + deliveryFee + effectiveTip;

  // Minimum basket/order value: €15.00 for delivery (Pickup has no minimum)
  const isBelowMinOrder = orderType === 'delivery' && effectiveSubtotal < MIN_ORDER_DELIVERY;

  // Handle Voucher Redemption
  const handleApplyVoucher = (e) => {
    e.preventDefault();
    setVoucherError('');
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'VENEZIA10') {
      setAppliedVoucher({ code, discountPercent: 10, label: '10% Willkommens-Rabatt' });
    } else if (code === 'WELCOME' || code === 'HALLO') {
      setAppliedVoucher({ code, discountAmount: 3.00, label: '3,00 € Neukunden-Gutschein' });
    } else if (code === 'PIZZA5') {
      if (subtotal < 25) {
        setVoucherError('Gilt erst ab 25,00 € Mindestbestellwert');
        return;
      }
      setAppliedVoucher({ code, discountAmount: 5.00, label: '5,00 € Aktions-Rabatt' });
    } else {
      setVoucherError('Ungültiger Gutscheincode. Versuche "VENEZIA10"!');
    }
  };



  // Quick Login in Checkout
  const handleQuickLogin = async (e) => {
    e.preventDefault();
    setQuickLoginError('');
    if (!quickLoginEmail || !quickLoginPassword) {
      setQuickLoginError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    const res = await signInCustomerUser({ email: quickLoginEmail, password: quickLoginPassword });
    if (res.success && res.user) {
      setCustomerUser(res.user);
      setShowQuickLogin(false);
      setFormData(prev => ({
        ...prev,
        name: res.user.full_name || prev.name,
        phone: res.user.phone || prev.phone,
        email: res.user.email || prev.email,
        street: res.user.street || prev.street,
        zipCity: res.user.zip_city || prev.zipCity
      }));
    } else {
      setQuickLoginError(res.error || 'Ungültige Anmeldedaten.');
    }
  };

  // Inline Login for recognized existing customer
  const handleInlineExistingLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setExistingLoginError('');
    const targetEmail = (formData.email || '').trim().toLowerCase();
    if (!targetEmail) {
      setExistingLoginError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }
    if (!existingPassword) {
      setExistingLoginError('Bitte geben Sie Ihr Passwort ein.');
      const pwdEl = document.getElementById('checkout-existing-password-input');
      if (pwdEl) pwdEl.focus();
      return;
    }
    setIsInlineLoggingIn(true);
    try {
      const res = await signInCustomerUser({
        email: targetEmail,
        password: existingPassword
      });
      if (res.success && res.user) {
        setCustomerUser(res.user);
        setExistingAccount(null);
        setExistingPassword('');
        setFormData(prev => {
          const zipParsed = res.user.street ? parseZipCity(res.user.zip_city) : { plz: prev.plz, city: prev.city };
          return {
            ...prev,
            name: res.user.full_name || prev.name,
            phone: res.user.phone || prev.phone,
            street: res.user.street || prev.street,
            plz: zipParsed.plz || prev.plz,
            city: zipParsed.city || prev.city,
            zipCity: res.user.zip_city || prev.zipCity
          };
        });
      } else {
        setExistingLoginError(res.error || 'Ungültiges Passwort. Bitte überprüfen Sie Ihre Eingabe.');
      }
    } catch (err) {
      setExistingLoginError(err.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setIsInlineLoggingIn(false);
    }
  };

  const handleOpenResetMode = async (overrideEmail = null) => {
    const rawTarget = overrideEmail || formData.email || quickLoginEmail || '';
    const targetEmail = rawTarget.trim().toLowerCase();
    setResetEmail(targetEmail);
    setIsResetMode(true);
    setResetError('');
    setResetOtp('');
    setResetNewPassword('');
    setResetConfirmPassword('');

    if (targetEmail && EMAIL_FORMAT_REGEX.test(targetEmail)) {
      await handleSendResetOtp(targetEmail);
    } else {
      setResetNotice('Bitte geben Sie Ihre registrierte E-Mail-Adresse ein und fordern Sie einen Bestätigungscode (OTP) an.');
    }
  };

  const handleSendResetOtp = async (targetEmail = null) => {
    const emailToSend = (targetEmail || resetEmail || formData.email || quickLoginEmail || '').trim().toLowerCase();
    if (!emailToSend || !EMAIL_FORMAT_REGEX.test(emailToSend)) {
      setResetError('Bitte geben Sie eine vollständige, gültige E-Mail-Adresse ein.');
      return;
    }
    setResetEmail(emailToSend);
    setIsResetSubmitting(true);
    setResetError('');
    try {
      const res = await sendPasswordResetOtp(emailToSend);
      if (res.success) {
        setResetNotice(`✓ Bestätigungscode (OTP) wurde an ${emailToSend} gesendet! Bitte prüfen Sie Ihren Posteingang und Spam-Ordner.`);
      } else {
        setResetError(res.error || 'Fehler beim Senden des Bestätigungscodes.');
      }
    } catch (err) {
      setResetError(err.message || 'Fehler beim Senden des Bestätigungscodes.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleVerifyOtpAndReset = async (e) => {
    if (e) e.preventDefault();
    setResetError('');

    const targetEmail = (resetEmail || formData.email || quickLoginEmail || '').trim().toLowerCase();
    const cleanOtp = (resetOtp || '').trim();

    if (!targetEmail || !EMAIL_FORMAT_REGEX.test(targetEmail)) {
      setResetError('Bitte geben Sie eine gültige E-Mail-Adresse an.');
      return;
    }
    if (!cleanOtp || cleanOtp.length < 6) {
      setResetError('Bitte geben Sie den 6-stelligen Bestätigungscode (OTP) aus Ihrer E-Mail ein.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Die eingegebenen Passwörter stimmen nicht überein.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await verifyOtpAndResetPassword({
        email: targetEmail,
        otp: cleanOtp,
        newPassword: resetNewPassword
      });

      if (res.success) {
        // Automatically sign in the user
        const loginRes = await signInCustomerUser({
          email: targetEmail,
          password: resetNewPassword
        });

        if (loginRes.success && loginRes.user) {
          setCustomerUser(loginRes.user);
          setFormData(prev => {
            const zipParsed = loginRes.user.street ? parseZipCity(loginRes.user.zip_city) : { plz: prev.plz, city: prev.city };
            return {
              ...prev,
              email: loginRes.user.email || prev.email,
              name: loginRes.user.full_name || prev.name,
              phone: loginRes.user.phone || prev.phone,
              street: loginRes.user.street || prev.street,
              plz: zipParsed.plz || prev.plz,
              city: zipParsed.city || prev.city,
              zipCity: loginRes.user.zip_city || prev.zipCity
            };
          });
        } else {
          setCustomerUser({ email: targetEmail });
        }

        setIsResetMode(false);
        setExistingAccount(null);
        setExistingPassword('');
        setExistingLoginError('');
        setResetOtp('');
        setResetNewPassword('');
        setResetConfirmPassword('');
        setShowQuickLogin(false);
        setResetNotice('🎉 Passwort erfolgreich geändert! Sie sind jetzt angemeldet.');
        setTimeout(() => setResetNotice(''), 6000);
      } else {
        setResetError(res.error || 'Ungültiger oder abgelaufener Bestätigungscode. Bitte prüfen Sie den Code in Ihrer E-Mail.');
      }
    } catch (err) {
      setResetError(err.message || 'Fehler beim Ändern des Passworts.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleQuickReset = (overrideEmail = null) => {
    handleOpenResetMode(overrideEmail);
  };

  const renderPasswordResetBox = () => (
    <div style={{
      background: '#f8fafc',
      border: '2px solid #0284c7',
      borderRadius: '14px',
      padding: '16px 18px',
      marginTop: '10px',
      marginBottom: '16px',
      boxShadow: '0 4px 16px rgba(2, 132, 199, 0.12)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '13.5px', color: '#0369a1' }}>
          <KeyRound size={18} color="#0284c7" />
          <span>Passwort mit Bestätigungscode (OTP) zurücksetzen</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsResetMode(false);
            setResetError('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '11.5px',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          ✕ Abbrechen
        </button>
      </div>

      {resetNotice && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: '1.4',
          marginBottom: '12px'
        }}>
          {resetNotice}
        </div>
      )}

      {resetError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: '1.4',
          marginBottom: '12px'
        }}>
          ⚠️ {resetError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px' }}>
            E-Mail-Adresse
          </label>
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="ihre.email@example.de"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: '#ffffff',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1' }}>
              6-stelliger Bestätigungscode (OTP) *
            </label>
            <button
              type="button"
              onClick={() => handleSendResetOtp(resetEmail)}
              disabled={isResetSubmitting}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              {isResetSubmitting ? 'Wird gesendet...' : 'Neuen Code anfordern'}
            </button>
          </div>
          <input
            type="text"
            maxLength={30}
            value={resetOtp}
            onChange={(e) => setResetOtp(e.target.value.trim())}
            placeholder="z. B. 123456"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '2px solid #0284c7',
              fontSize: '15px',
              fontWeight: '700',
              letterSpacing: '2px',
              background: '#ffffff',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
            Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein (auch im Spam-Ordner nachsehen).
          </div>
        </div>

        <div className="checkout-form-row checkout-reset-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px' }}>
              Neues Passwort (min. 6 Zeichen) *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showResetNewPassword ? 'text' : 'password'}
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="Neues Passwort"
                style={{
                  width: '100%',
                  padding: '9px 34px 9px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '9px',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                {showResetNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px' }}>
              Passwort wiederholen *
            </label>
            <input
              type={showResetNewPassword ? 'text' : 'password'}
              value={resetConfirmPassword}
              onChange={(e) => setResetConfirmPassword(e.target.value)}
              placeholder="Wiederholen"
              style={{
                width: '100%',
                padding: '9px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                background: '#ffffff',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={handleVerifyOtpAndReset}
            disabled={isResetSubmitting}
            style={{
              flex: '1',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '11px 16px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: isResetSubmitting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
            }}
          >
            <Lock size={15} />
            <span>{isResetSubmitting ? 'Wird gespeichert...' : 'Passwort speichern & Anmelden'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsResetMode(false);
              setResetError('');
            }}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '11px 16px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Zurück
          </button>
        </div>
      </div>
    </div>
  );

  // Step 1 Validation & Proceed to Payment (Phone OTP verified if not logged in)
  const handleProceedToPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isStoreOpen) {
      alert('Unser Restaurant hat zurzeit geschlossen. Online-Bestellungen sind pausiert.');
      return;
    }
    if (!formData.name.trim()) {
      alert('Bitte geben Sie Ihren Vor- und Nachnamen an.');
      return;
    }
    if (!formData.phone.trim()) {
      alert('Bitte geben Sie Ihre Mobilfunknummer an.');
      return;
    }
    if (orderType === 'delivery') {
      if (!formData.street.trim()) {
        alert('Bitte geben Sie eine Lieferadresse (Straße und Hausnummer) an.');
        return;
      }
      if (!formData.plz || formData.plz.length !== 5) {
        alert('Bitte geben Sie eine gültige 5-stellige Postleitzahl ein.');
        return;
      }
      if (!deliveryZone?.isDeliverable) {
        alert(deliveryZone?.error || 'Leider liefern wir nicht in diese Region. Bitte wählen Sie Selbstabholung oder eine gültige Lieferadresse.');
        return;
      }
      if (isBelowMinOrder) {
        alert(`Der Mindestbestellwert für Lieferung beträgt ${MIN_ORDER_DELIVERY.toFixed(2).replace('.', ',')} €. Bitte wählen Sie Selbstabholung oder fügen Sie weitere Artikel hinzu.`);
        return;
      }
    }

    // CASE 1: If user is ALREADY logged in -> DO NOT ask for OTP -> Proceed directly to payment!
    if (customerUser) {
      setStep(2);
      return;
    }

    // CASE 2: User is NOT yet logged in -> Send OTP and prompt verification inline
    if (checkoutPhoneStep !== 'otp') {
      await handleSendCheckoutOtp();
      return;
    } else {
      if (!checkoutOtpCode || checkoutOtpCode.trim().length < 6) {
        setCheckoutOtpError('Bitte geben Sie den 6-stelligen SMS-Code ein.');
        return;
      }
      await handleVerifyCheckoutOtp();
    }
  };

  // Place Order Action (Production: Real SumUp Redirection or COD)
  const handlePlaceOrder = async () => {
    if (!isStoreOpen) {
      alert('Unser Restaurant hat zurzeit geschlossen. Online-Bestellungen sind pausiert.');
      setIsProcessing(false);
      return;
    }
    setIsProcessing(true);
    setProcessingStatusText('Bestelldaten werden vorbereitet...');

    const effectiveEmail = (customerUser?.email || (formData.phone ? `${formData.phone.replace(/\D/g, '')}@customer.venezia.internal` : 'kunde@veneziapizzas.de')).toLowerCase().trim();
    const orderNumber = `VP-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullStreet = orderType === 'delivery'
      ? `${formData.street} ${formData.houseNr} ${formData.floorApartment ? `(${formData.floorApartment})` : ''}`.trim()
      : 'Selbstabholung im Restaurant';
    const finalZipCity = orderType === 'delivery'
      ? `${formData.plz} ${formData.city}`.trim()
      : '08525 Plauen (Restaurant)';

    const orderPayload = {
      order_number: orderNumber,
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_email: effectiveEmail,
      delivery_type: orderType,
      street: fullStreet,
      zip_city: finalZipCity,
      note: [
        deliveryTiming === 'scheduled' ? `Wunschuhrzeit: ${scheduledTime} Uhr` : 'Sofortige Zubereitung',
        paymentMethod === 'cash'
          ? (cashOption !== 'exact'
              ? `Barzahlung bei Lieferung (Wechselgeld auf ${cashOption === 'change_50' ? '50€' : '100€'})`
              : 'Barzahlung bei Lieferung (Passend in bar)')
          : 'Online-Zahlung via SumUp (Kreditkarte, Apple Pay, Girocard)',
        formData.note ? `Kundennotiz: ${formData.note}` : ''
      ].filter(Boolean).join(' • '),
      subtotal: subtotal,
      discount: totalDiscount,
      delivery_fee: deliveryFee,
      tip: effectiveTip,
      total: finalTotal,
      status: 'new',
      estimated_delivery_minutes: orderType === 'delivery' ? 35 : 20,
      payment_method: paymentMethod, // 'sumup' or 'cash'
      payment_status: 'pending',
      payment_id: paymentMethod === 'cash' ? `CASH-${Date.now()}` : `SUMUP_INIT`
    };

    // Note: Account creation was already performed in Step 1 (handleProceedToPayment).
    // Do NOT repeat auth or create any orders before payment is completed!

    // 1. SUMUP ONLINE PAYMENT: Redirect to official SumUp 3D-Secure payment page
    if (paymentMethod === 'sumup') {
      setProcessingStatusText('Sichere SumUp Zahlungsseite wird vorbereitet (Merchant: MVV82Y2M)...');

      try {
        const redirectUrl = `${window.location.origin}?payment=sumup_complete&order_number=${orderNumber}`;

        const sumupRes = await createSumUpCheckout({
          orderNumber,
          amount: finalTotal,
          customerEmail: effectiveEmail,
          description: `Venezia Pizza Plauen - #${orderNumber}`,
          redirectUrl
        });

        if (sumupRes?.hostedCheckoutUrl) {
          // Persist pending order payload to localStorage ONLY.
          // DO NOT create order in DB or active tracking yet!
          // It will ONLY be created upon returning with verified payment.
          localStorage.setItem('venezia_pending_sumup_order', JSON.stringify({
            orderPayload: {
              ...orderPayload,
              payment_id: sumupRes.checkoutId || `SUMUP-${Date.now()}`
            },
            cartItems,
            checkoutId: sumupRes.checkoutId
          }));

          setProcessingStatusText('Weiterleitung zur offiziellen SumUp Zahlungsseite...');
          window.location.href = sumupRes.hostedCheckoutUrl;
          return;
        } else {
          throw new Error(sumupRes?.error || 'SumUp Zahlungs-URL konnte nicht geladen werden.');
        }
      } catch (sumupErr) {
        console.error('[SumUp] Payment error:', sumupErr);
        alert('SumUp Zahlungsfehler: ' + sumupErr.message + '\n\nBitte versuchen Sie es erneut oder wählen Sie Barzahlung bei Lieferung.');
        setIsProcessing(false);
        return;
      }
    }

    // 2. CASH ON DELIVERY (COD): Immediate local and database confirmation
    setProcessingStatusText('Bestellung wird an die Backstation übermittelt...');
    setTimeout(async () => {
      try {
        const result = await createOrder(orderPayload, cartItems);
        const saved = result?.order || orderPayload;
        setConfirmedOrder(saved);
        playOrderChime();
        onCompleteOrder();
      } catch (err) {
        console.warn('Order submission fallback to local state:', err);
        setConfirmedOrder(orderPayload);
        playOrderChime();
        onCompleteOrder();
      } finally {
        setIsProcessing(false);
        setStep(3);
      }
    }, 800);
  };

  // Copy Order Number
  const handleCopyOrderNumber = () => {
    if (!confirmedOrder?.order_number) return;
    navigator.clipboard.writeText(confirmedOrder.order_number);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };


  // Print Order Receipt
  const handlePrint = () => {
    window.print();
  };

  // Map order status to progress stepper index
  const getStatusStepIndex = (status) => {
    switch (status) {
      case 'new': return 1;
      case 'preparing': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // CRITICAL: Do NOT render anything when modal is closed!
  if (!isOpen) return null;

  const currentStatusIndex = getStatusStepIndex(confirmedOrder?.status || 'new');

  return (
    <div
      className="checkout-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div className="checkout-modal-card" style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: step === 3 ? '680px' : '620px',
        maxHeight: '94vh',
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
          padding: '18px 24px 14px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(227, 6, 19, 0.08)',
                color: 'var(--red)',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '1px',
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}>
                Venezia Pizzeria Plauen
              </span>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>•</span>
              <span key={`step-sub-${step}`} style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>
                {step === 1 ? 'Schritt 1: Lieferadresse' : step === 2 ? 'Schritt 2: Sichere Bezahlung' : 'Schritt 3: Live-Bestellstatus'}
              </span>
            </div>
            <h2 key={`step-title-${step}`} style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 0', color: '#0f172a' }}>
              {step === 1 ? 'Lieferung & Kontaktdaten' : step === 2 ? 'Zahlungsart & Bestellprüfung' : 'Bestellbestätigung & Live-Verfolgung'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: step >= 1 ? 'var(--red)' : '#94a3b8',
            fontWeight: step === 1 ? '800' : '600'
          }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: step > 1 ? '#16a34a' : (step === 1 ? 'var(--red)' : '#e2e8f0'),
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '800'
            }}>
              {step > 1 ? <Check size={12} strokeWidth={3} /> : '1'}
            </div>
            <span>1. Adresse</span>
          </div>

          <div style={{ height: '2px', flex: 1, margin: '0 12px', background: step >= 2 ? 'var(--red)' : '#e2e8f0' }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: step >= 2 ? 'var(--red)' : '#94a3b8',
            fontWeight: step === 2 ? '800' : '600'
          }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: step > 2 ? '#16a34a' : (step === 2 ? 'var(--red)' : '#e2e8f0'),
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '800'
            }}>
              {step > 2 ? <Check size={12} strokeWidth={3} /> : '2'}
            </div>
            <span>2. Zahlung</span>
          </div>

          <div style={{ height: '2px', flex: 1, margin: '0 12px', background: step >= 3 ? '#16a34a' : '#e2e8f0' }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: step === 3 ? '#16a34a' : '#94a3b8',
            fontWeight: step === 3 ? '800' : '600'
          }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: step === 3 ? '#16a34a' : '#e2e8f0',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '800'
            }}>
              3
            </div>
            <span>3. Status</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

          {/* ========================================================= */}
          {/* STEP 1: DELIVERY & CONTACT FORM                           */}
          {/* ========================================================= */}
          {step === 1 && (
            <form key="checkout-step-1" onSubmit={handleProceedToPayment}>
              {/* Authenticated Customer Banner vs Quick Login */}
              {customerUser ? (
                <div style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px'
                }}>
                  <CheckCircle2 size={16} />
                  <span>
                    Angemeldet als <strong>{customerUser.full_name || customerUser.email}</strong> • Ihre Daten wurden automatisch übernommen.
                  </span>
                </div>
              ) : null}

              {/* Delivery vs Pickup Choice */}
              <div className="checkout-order-type-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: `2px solid ${orderType === 'delivery' ? 'var(--red)' : '#e2e8f0'}`,
                    background: orderType === 'delivery' ? '#fff5f5' : '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Truck size={18} color={orderType === 'delivery' ? 'var(--red)' : '#64748b'} />
                    <span style={{
                      fontWeight: '800',
                      fontSize: '14px',
                      color: orderType === 'delivery' ? 'var(--red)' : '#0f172a'
                    }}>
                      Lieferung
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                    Direkt zu Ihnen nach Hause • ca. 30–45 Min
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: `2px solid ${orderType === 'pickup' ? 'var(--red)' : '#e2e8f0'}`,
                    background: orderType === 'pickup' ? '#fff5f5' : '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Store size={18} color={orderType === 'pickup' ? 'var(--red)' : '#64748b'} />
                    <span style={{
                      fontWeight: '800',
                      fontSize: '14px',
                      color: orderType === 'pickup' ? 'var(--red)' : '#0f172a'
                    }}>
                      Selbstabholung
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                    Bahnhofstr. 14, Plauen • ca. 15–20 Min
                  </div>
                </button>
              </div>

              {/* Delivery Address (only if delivery chosen) */}
              {orderType === 'delivery' && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                    Lieferadresse in Plauen
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                        Straße &amp; Hausnummer *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="z.B. Bahnhofstraße 14"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          outline: 'none',
                          background: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                          PLZ *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          placeholder="08525"
                          value={formData.plz}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                            setFormData(prev => ({
                              ...prev,
                              plz: val,
                              zipCity: `${val} ${prev.city}`.trim()
                            }));
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 8px',
                            borderRadius: '8px',
                            border: `1.5px solid ${deliveryZone?.isDeliverable ? '#16a34a' : (!formData.plz || formData.plz.length < 5 ? '#cbd5e1' : 'var(--red)')}`,
                            fontSize: '13px',
                            fontWeight: '700',
                            textAlign: 'center',
                            outline: 'none',
                            background: '#ffffff',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                          Ort / Stadtteil *
                        </label>
                        <input
                          type="text"
                          required
                          list="supported-areas-list"
                          placeholder="z.B. Plauen"
                          value={formData.city}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              city: val,
                              zipCity: `${prev.plz} ${val}`.trim()
                            }));
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            outline: 'none',
                            background: '#ffffff',
                            boxSizing: 'border-box'
                          }}
                        />
                        <datalist id="supported-areas-list">
                          {ALL_SUPPORTED_AREAS.map((a, i) => (
                            <option key={i} value={a.city}>{a.plz} {a.city} ({a.fee.toFixed(2).replace('.', ',')} €)</option>
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Postcode Delivery Status Feedback */}
                  {formData.plz && formData.plz.length === 5 && (
                    deliveryZone?.isDeliverable ? (
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '9px 12px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#166534'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                          <CheckCircle2 size={16} color="#16a34a" />
                          <span>Liefergebiet: {deliveryZone.areaName}</span>
                        </div>
                        <span style={{ fontWeight: '800', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
                          Liefergebühr: {deliveryFee.toFixed(2).replace('.', ',')} €
                        </span>
                      </div>
                    ) : (
                      <div style={{
                        background: '#fef2f2',
                        border: '1.5px solid #fecaca',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertCircle size={16} color="var(--red)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '12.5px', color: '#991b1b', fontWeight: '700' }}>
                            Leider liefern wir nicht in diese Region.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOrderType('pickup')}
                          style={{
                            background: 'var(--red)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          Auf Selbstabholung umschalten (0,00 €)
                        </button>
                      </div>
                    )
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      Etage / Wohnung / Klingelname (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. 2. OG links, bitte bei Fam. Müller klingeln"
                      value={formData.floorApartment}
                      onChange={(e) => setFormData({ ...formData, floorApartment: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                  Persönliche Kontaktdaten
                </h4>

                <div className="checkout-form-row checkout-contact-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      Vor- und Nachname *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="z.B. Maximilian Müller"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>
                        Mobilfunknummer *
                      </label>
                      {customerUser ? (
                        <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '800', background: '#dcfce7', padding: '1px 7px', borderRadius: '999px' }}>
                          ✓ Verifiziert
                        </span>
                      ) : null}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        required
                        readOnly={!!customerUser}
                        placeholder="0171 1234567 oder +49..."
                        value={customerUser ? (customerUser.phone || formData.phone) : formData.phone}
                        onChange={(e) => !customerUser && setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          fontWeight: customerUser ? '700' : '500',
                          outline: 'none',
                          background: customerUser ? '#f1f5f9' : '#ffffff',
                          color: customerUser ? '#334155' : '#0f172a',
                          cursor: customerUser ? 'not-allowed' : 'text',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {customerUser && (
                  <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <CheckCircle2 size={14} color="#16a34a" />
                    <span>Angemeldet als Stammkunde: {customerUser.full_name || customerUser.phone}</span>
                  </div>
                )}

                {/* Inline OTP Verification Card (ONLY shown when user is NOT logged in and OTP is requested) */}
                {!customerUser && checkoutPhoneStep === 'otp' && (
                  <div style={{
                    background: '#fff1f2',
                    border: '2px solid var(--red)',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    marginTop: '12px',
                    marginBottom: '16px',
                    boxShadow: '0 4px 16px rgba(225, 29, 72, 0.12)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '13.5px', color: '#9f1239' }}>
                        <ShieldCheck size={18} color="var(--red)" />
                        <span>SMS-Code bestätigen</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#9f1239', fontWeight: '700' }}>
                        Einmal-Login
                      </span>
                    </div>

                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#475569', lineHeight: '1.45' }}>
                      Wir haben einen 6-stelligen Bestätigungscode per SMS an <strong>{formData.phone}</strong> gesendet.
                    </p>

                    {checkoutOtpError && (
                      <div style={{
                        color: '#dc2626',
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertCircle size={15} />
                        <span>{checkoutOtpError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        placeholder="••••••"
                        value={checkoutOtpCode}
                        onChange={(e) => handleCheckoutOtpInputChange(e.target.value)}
                        style={{
                          flex: '1 1 140px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '2px solid var(--red)',
                          fontSize: '18px',
                          fontWeight: '900',
                          letterSpacing: '6px',
                          textAlign: 'center',
                          outline: 'none',
                          background: '#ffffff',
                          fontFamily: 'monospace',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCheckoutOtp}
                        disabled={isSendingCheckoutOtp || checkoutOtpCode.length < 6}
                        style={{
                          background: 'var(--red)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '11px 18px',
                          fontSize: '13px',
                          fontWeight: '800',
                          cursor: (isSendingCheckoutOtp || checkoutOtpCode.length < 6) ? 'not-allowed' : 'pointer',
                          opacity: (isSendingCheckoutOtp || checkoutOtpCode.length < 6) ? 0.6 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>{isSendingCheckoutOtp ? 'Wird geprüft...' : 'Bestätigen & Weiter'}</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontSize: '11.5px' }}>
                      <button
                        type="button"
                        onClick={handleResendCheckoutOtp}
                        disabled={checkoutResendCooldown > 0 || isSendingCheckoutOtp}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: checkoutResendCooldown > 0 ? '#94a3b8' : 'var(--red)',
                          fontWeight: '700',
                          cursor: checkoutResendCooldown > 0 ? 'not-allowed' : 'pointer',
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        {checkoutResendCooldown > 0 ? `Code erneut senden (${checkoutResendCooldown}s)` : 'SMS erneut senden'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutPhoneStep('phone');
                          setCheckoutOtpCode('');
                          setCheckoutOtpError('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        Nummer ändern
                      </button>
                    </div>
                  </div>
                )}
              </div>



              {/* Order Note */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Hinweis an die Küche / den Fahrer (optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="z.B. bitte extra knusprig backen / bitte nicht klingeln, Baby schläft"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    outline: 'none',
                    resize: 'none',
                    background: '#ffffff'
                  }}
                />
              </div>

              {/* Minimum Order Warning Box (ONLY displayed if order is below €15.00 for delivery) */}
              {isBelowMinOrder && (
                <div style={{
                  background: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '12.5px', color: '#92400e', fontWeight: '600' }}>
                      Mindestbestellwert für Lieferung ist <strong>15,00 €</strong> (noch <strong>{(MIN_ORDER_DELIVERY - effectiveSubtotal).toFixed(2).replace('.', ',')} €</strong>)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #d97706',
                      color: '#b45309',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Auf Selbstabholung wechseln (Kein Mindestwert)
                  </button>
                </div>
              )}

              {/* Quick Summary Pill & Proceed */}
              <div className="checkout-summary-pill" style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Gerichte im Warenkorb
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                    {finalTotal.toFixed(2).replace('.', ',')} €
                    {orderType === 'delivery' && deliveryFee > 0 && (
                      <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#0284c7', marginLeft: '6px' }}>
                        (inkl. {deliveryFee.toFixed(2).replace('.', ',')} € Lieferung)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={orderType === 'delivery' && (!deliveryZone?.isDeliverable || isBelowMinOrder)}
                  style={{
                    background: (orderType === 'delivery' && (!deliveryZone?.isDeliverable || isBelowMinOrder))
                      ? '#94a3b8'
                      : 'var(--red)',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: (orderType === 'delivery' && (!deliveryZone?.isDeliverable || isBelowMinOrder))
                      ? 'none'
                      : '0 4px 12px rgba(227, 6, 19, 0.3)',
                    cursor: (orderType === 'delivery' && (!deliveryZone?.isDeliverable || isBelowMinOrder))
                      ? 'not-allowed'
                      : 'pointer',
                    transition: 'all 0.15s ease',
                    border: 'none',
                    opacity: (orderType === 'delivery' && (!deliveryZone?.isDeliverable || isBelowMinOrder)) ? 0.75 : 1
                  }}
                >
                  <span>
                    {orderType === 'delivery' && !deliveryZone?.isDeliverable
                      ? 'Lieferung nicht möglich'
                      : (orderType === 'delivery' && isBelowMinOrder
                          ? 'Mindestbestellwert 15,00 €'
                          : 'Weiter zur Zahlung')}
                  </span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* STEP 2: PAYMENT & REVIEW                                 */}
          {/* ========================================================= */}
          {step === 2 && (
            <div key="checkout-step-2">
              {/* Back to Step 1 Button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#64748b',
                  marginBottom: '16px',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={15} />
                <span>Zurück zur Adressangabe</span>
              </button>

              {/* Payment Methods Grid */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                  Wählen Sie Ihre gewünschte Zahlungsart
                </h4>

                <div className="checkout-payment-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                  {/* Option 1: SumUp Online Payment */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('sumup')}
                    style={{
                      padding: '16px 14px',
                      borderRadius: '14px',
                      border: `2px solid ${paymentMethod === 'sumup' ? '#002B49' : '#e2e8f0'}`,
                      background: paymentMethod === 'sumup' ? '#f0f7ff' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      position: 'relative',
                      textAlign: 'left',
                      boxShadow: paymentMethod === 'sumup' ? '0 4px 14px rgba(0, 43, 73, 0.12)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: paymentMethod === 'sumup' ? '#002B49' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CreditCard size={22} color={paymentMethod === 'sumup' ? '#ffffff' : '#64748b'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: paymentMethod === 'sumup' ? '#002B49' : '#1e293b' }}>
                        SumUp Online-Zahlung
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Kreditkarte, Girocard, Apple Pay, Google Pay
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Cash on Delivery (COD) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    style={{
                      padding: '16px 14px',
                      borderRadius: '14px',
                      border: `2px solid ${paymentMethod === 'cash' ? '#16a34a' : '#e2e8f0'}`,
                      background: paymentMethod === 'cash' ? '#f0fdf4' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: paymentMethod === 'cash' ? '0 4px 14px rgba(22, 163, 74, 0.12)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: paymentMethod === 'cash' ? '#16a34a' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Banknote size={22} color={paymentMethod === 'cash' ? '#ffffff' : '#64748b'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: paymentMethod === 'cash' ? '#166534' : '#1e293b' }}>
                        Barzahlung bei Lieferung (COD)
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Bargeld direkt beim Fahrer an der Haustür
                      </div>
                    </div>
                  </button>
                </div>

                {/* Sub-form: SumUp Online Payment Explanatory Box */}
                {paymentMethod === 'sumup' && (
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '14px',
                    padding: '18px',
                    border: '1.5px solid #cbd5e1',
                    marginBottom: '18px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: '#002B49',
                          color: '#ffffff',
                          fontWeight: '900',
                          fontSize: '11.5px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.6px'
                        }}>
                          sumup
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                          Offizielle SumUp 3D-Secure Zahlungsseite
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={12} color="#16a34a" /> 256-Bit SSL
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {['💳 Visa', '💳 Mastercard', '💳 Maestro', '🏦 Girocard', '🍏 Apple Pay', '📱 Google Pay'].map((badge) => (
                        <span key={badge} style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#334155'
                        }}>
                          {badge}
                        </span>
                      ))}
                    </div>

                    <div style={{
                      background: '#eff6ff',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      border: '1px solid #bfdbfe',
                      fontSize: '12.5px',
                      color: '#1e40af',
                      lineHeight: '1.5'
                    }}>
                      <strong>Sichere Online-Zahlung:</strong><br />
                      Beim Klick auf <strong>„🔒 Mit SumUp sicher bezahlen“</strong> werden Sie direkt zur offiziellen, geschützten SumUp-Zahlungsseite weitergeleitet. Dort autorisieren Sie die Zahlung sicher per <strong>3D-Secure (SMS-TAN, Visa Secure, Banking-App)</strong>. Der Betrag wird über SumUp autorisiert und Ihrer Bestellung zugeordnet.
                    </div>

                    <div style={{
                      marginTop: '10px',
                      fontSize: '11px',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <ShieldCheck size={14} color="#059669" />
                      <span>Händler: Venezia Pizza Plauen • Händler-Code: MVV82Y2M • PCI-DSS zertifiziert</span>
                    </div>
                  </div>
                )}

                {/* Sub-form: Cash on delivery option details */}
                {paymentMethod === 'cash' && (
                  <div style={{
                    background: '#f0fdf4',
                    borderRadius: '14px',
                    padding: '16px',
                    border: '1.5px solid #bbf7d0',
                    marginBottom: '18px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Banknote size={18} color="#16a34a" />
                      Barzahlung bei Erhalt der Pizza
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: '#14532d', lineHeight: '1.5' }}>
                      Sie bezahlen den Betrag bequem in bar bei unserem Fahrer an der Wohnungstür.
                    </p>

                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '6px' }}>
                      Benötigen Sie Wechselgeld?
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setCashOption('exact')}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: `1.5px solid ${cashOption === 'exact' ? '#16a34a' : '#cbd5e1'}`,
                          background: cashOption === 'exact' ? '#16a34a' : '#ffffff',
                          color: cashOption === 'exact' ? '#ffffff' : '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        Passend in bar
                      </button>

                      <button
                        type="button"
                        onClick={() => setCashOption('change_50')}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: `1.5px solid ${cashOption === 'change_50' ? '#16a34a' : '#cbd5e1'}`,
                          background: cashOption === 'change_50' ? '#16a34a' : '#ffffff',
                          color: cashOption === 'change_50' ? '#ffffff' : '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        Wechselgeld für 50 €
                      </button>

                      <button
                        type="button"
                        onClick={() => setCashOption('change_100')}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: `1.5px solid ${cashOption === 'change_100' ? '#16a34a' : '#cbd5e1'}`,
                          background: cashOption === 'change_100' ? '#16a34a' : '#ffffff',
                          color: cashOption === 'change_100' ? '#ffffff' : '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        Wechselgeld für 100 €
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Driver Tip Selection - Only for Delivery orders */}
              {orderType === 'delivery' && (
                <div style={{
                  background: '#fffbeb',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid #fef3c7',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Gift size={16} color="#d97706" />
                      <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#92400e' }}>
                        Trinkgeld für den Venezia-Fahrer
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#b45309' }}>100% für den Fahrer</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[0, 1.50, 2.00, 3.50].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => { setTipAmount(amount); setCustomTip(''); }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: `1.5px solid ${tipAmount === amount && customTip === '' ? '#d97706' : '#fde68a'}`,
                          background: tipAmount === amount && customTip === '' ? '#d97706' : '#ffffff',
                          color: tipAmount === amount && customTip === '' ? '#ffffff' : '#78350f',
                          cursor: 'pointer'
                        }}
                      >
                        {amount === 0 ? 'Kein Trinkgeld' : `${amount.toFixed(2).replace('.', ',')} €`}
                        {amount === 2.00 && ' ⭐'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Voucher Code */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Gutscheincode (z.B. VENEZIA10)"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px',
                      textTransform: 'uppercase'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Einlösen
                  </button>
                </div>
                {appliedVoucher && (
                  <div style={{ color: '#16a34a', fontSize: '11.5px', fontWeight: '700', marginTop: '4px' }}>
                    ✓ {appliedVoucher.label} erfolgreich aktiviert!
                  </div>
                )}
                {voucherError && (
                  <div style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px' }}>
                    {voucherError}
                  </div>
                )}
              </div>

              {/* Ordered Items Accordion Toggle */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowItemsAccordion(!showItemsAccordion)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <span>Bestellübersicht ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} Gerichte ansehen)</span>
                  {showItemsAccordion ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showItemsAccordion && (
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {cartItems.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                        <div>
                          <span style={{ fontWeight: '700', marginRight: '6px' }}>{item.quantity}x</span>
                          <span>{item.name}</span>
                          {item.desc && <div style={{ fontSize: '11px', color: '#64748b' }}>{item.desc}</div>}
                        </div>
                        <span style={{ fontWeight: '700', color: '#0f172a' }}>
                          {(item.price * item.quantity).toFixed(2).replace('.', ',')} €
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Calculation Summary Card */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                  <span>Zwischensumme:</span>
                  <span>{subtotal.toFixed(2).replace('.', ',')} €</span>
                </div>

                {voucherDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', marginBottom: '6px' }}>
                    <span>Gutschein-Rabatt ({appliedVoucher?.code}):</span>
                    <span>-{voucherDiscount.toFixed(2).replace('.', ',')} €</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                  <span>Lieferkosten ({orderType === 'delivery' ? (deliveryZone?.areaName || `PLZ ${formData.plz}`) : 'Selbstabholung'}):</span>
                  <span style={{ fontWeight: '700', color: deliveryFee > 0 ? '#0f172a' : '#16a34a' }}>
                    {deliveryFee === 0 ? '0,00 € (Selbstabholung)' : `${deliveryFee.toFixed(2).replace('.', ',')} €`}
                  </span>
                </div>

                {orderType === 'delivery' && effectiveTip > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#d97706', marginBottom: '6px' }}>
                    <span>Trinkgeld für den Fahrer:</span>
                    <span>+{effectiveTip.toFixed(2).replace('.', ',')} €</span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '2px solid #e2e8f0',
                  fontSize: '17px',
                  fontWeight: '900',
                  color: '#0f172a'
                }}>
                  <span>Gesamtbetrag (inkl. MwSt.):</span>
                  <span style={{ color: 'var(--red)', fontSize: '20px' }}>
                    {finalTotal.toFixed(2).replace('.', ',')} €
                  </span>
                </div>
              </div>

              {/* Big Checkout CTA Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  background: paymentMethod === 'sumup' ? '#002B49' : 'var(--red)',
                  color: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: paymentMethod === 'sumup' ? '0 6px 20px rgba(0, 43, 73, 0.35)' : '0 6px 20px rgba(227, 6, 19, 0.35)',
                  cursor: isProcessing ? 'wait' : 'pointer',
                  opacity: isProcessing ? 0.8 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                <Lock size={18} />
                <span>
                  {paymentMethod === 'sumup'
                    ? `🔒 Mit SumUp sicher bezahlen • ${finalTotal.toFixed(2).replace('.', ',')} €`
                    : `Bestellung aufgeben (Barzahlung) • ${finalTotal.toFixed(2).replace('.', ',')} €`}
                </span>
              </button>

              <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
                Mit dem Absenden der Bestellung stimmen Sie unseren AGB &amp; Widerrufsbelehrungen zu.
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: LIVE ORDER TRACKING & CONFIRMATION               */}
          {/* ========================================================= */}
          {step === 3 && confirmedOrder && (
            <div key="checkout-step-3">
              {/* Celebration Header */}
              <div style={{
                textAlign: 'center',
                padding: '10px 0 20px',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 10px 20px rgba(22, 163, 74, 0.2)'
                }}>
                  <CheckCircle2 size={38} />
                </div>

                <span style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px'
                }}>
                  Bestellnummer: <strong style={{ color: '#0f172a' }}>{confirmedOrder.order_number}</strong>
                  <button
                    type="button"
                    onClick={handleCopyOrderNumber}
                    title="Bestellnummer kopieren"
                    style={{ color: '#64748b', cursor: 'pointer', padding: '2px' }}
                  >
                    {isCopied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  </button>
                </span>

                <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '4px 0 6px' }}>
                  Vielen Dank für Ihre Bestellung!
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto' }}>
                  Ihre Speisen werden nun in unserer Pizzeria in Plauen frisch zubereitet. Verfolgen Sie den Fortschritt hier live:
                </p>
              </div>

              {/* LIVE STEPPER PROGRESS BAR */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                marginBottom: '22px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: confirmedOrder.status === 'delivered' ? '#16a34a' : '#e11d48',
                      animation: 'pulse 1.5s infinite'
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                      Aktueller Status:
                    </span>
                  </div>

                  <span style={{
                    background: currentStatusIndex === 4 ? '#dcfce7' : '#fee2e2',
                    color: currentStatusIndex === 4 ? '#166534' : '#991b1b',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {confirmedOrder.status === 'new' && '1. Eingegangen'}
                    {confirmedOrder.status === 'preparing' && '2. Im Steinofen'}
                    {confirmedOrder.status === 'out_for_delivery' && ((confirmedOrder.delivery_type === 'pickup' || orderType === 'pickup') ? '3. Bereit zur Abholung' : '3. Auf dem Weg')}
                    {confirmedOrder.status === 'delivered' && ((confirmedOrder.delivery_type === 'pickup' || orderType === 'pickup') ? '4. Abgeholt' : '4. Zugestellt')}
                  </span>
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
                    { stepNum: 2, title: 'Im Steinofen', sub: 'Frisch belegt', color: '#d97706', nextColor: '#0284c7', Icon: Flame },
                    {
                      stepNum: 3,
                      title: (confirmedOrder.delivery_type === 'pickup' || orderType === 'pickup') ? 'Bereit zur Abholung' : 'Auf dem Weg',
                      sub: (confirmedOrder.delivery_type === 'pickup' || orderType === 'pickup') ? 'Ready to Collect' : 'Lieferung',
                      color: '#0284c7',
                      nextColor: '#16a34a',
                      Icon: (confirmedOrder.delivery_type === 'pickup' || orderType === 'pickup') ? Store : Truck
                    },
                    {
                      stepNum: 4,
                      title: (confirmedOrder.delivery_type === 'pickup' || orderType === 'pickup') ? 'Abgeholt' : 'Zugestellt',
                      sub: (confirmedOrder.delivery_type === 'pickup' || orderType === 'pickup') ? 'Picked Up' : 'Guten Appetit!',
                      color: '#16a34a',
                      nextColor: '#16a34a',
                      Icon: PackageCheck
                    }
                  ].map((s, idx) => {
                    const isPassed = currentStatusIndex > s.stepNum;
                    const isCurrent = currentStatusIndex === s.stepNum;
                    const isUpcoming = currentStatusIndex < s.stepNum;

                    // Connector line to the next step
                    // If status updated/passed: solid line
                    // If current status waiting to update to next: dotted line
                    // If upcoming: neutral grey line
                    const lineStyle = isPassed
                      ? { borderTop: `3px solid ${s.color}` }
                      : isCurrent
                        ? { borderTop: `3px dotted ${s.nextColor}` }
                        : { borderTop: '2px solid #e2e8f0' };

                    // Circle size: current is 44px, past & upcoming are 30% decreased (32px)
                    const circleDiameter = isCurrent ? 44 : 32;
                    const iconDiameter = isCurrent ? 20 : 15;

                    return (
                      <div key={s.stepNum} style={{ position: 'relative', textAlign: 'center', padding: '0 4px' }}>
                        {/* Connecting Line to next step */}
                        {idx < 3 && (
                          <div style={{
                            position: 'absolute',
                            top: '24px',
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
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '6px'
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
                            boxShadow: isCurrent ? `0 0 0 5px ${s.color}33` : '0 2px 6px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}>
                            <s.Icon size={iconDiameter} />
                          </div>
                        </div>

                        {/* Step Title */}
                        <div style={{
                          fontSize: isCurrent ? '12px' : '11px',
                          fontWeight: isCurrent ? '800' : '600',
                          color: isUpcoming ? '#94a3b8' : (isPassed ? '#475569' : '#0f172a'),
                          lineHeight: '1.2'
                        }}>
                          {s.title}
                        </div>

                        {/* Step Subtitle */}
                        <div style={{
                          fontSize: '10px',
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

                {/* Estimated Delivery Time Box */}
                <div style={{
                  marginTop: '16px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} color="var(--red)" />
                    <span style={{ fontSize: '12.5px', color: '#334155' }}>
                      Geschätzte Ankunft:
                    </span>
                  </div>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                    {confirmedOrder.status === 'delivered'
                      ? 'Bestellung übergeben'
                      : `in ca. ${confirmedOrder.estimated_delivery_minutes || 35} Minuten`}
                  </strong>
                </div>

              </div>

              {/* Order Details & Summary Card */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '20px',
                background: '#ffffff'
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                  Bestellübersicht &amp; Rechnungsdaten
                </h4>

                <div className="checkout-tracking-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#475569', marginBottom: '14px' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Empfänger:</span><br />
                    <strong style={{ color: '#0f172a' }}>{confirmedOrder.customer_name}</strong><br />
                    {confirmedOrder.customer_phone}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>{confirmedOrder.delivery_type === 'delivery' ? 'Lieferadresse:' : 'Abholadresse:'}</span><br />
                    <strong style={{ color: '#0f172a' }}>{confirmedOrder.street}</strong><br />
                    {confirmedOrder.zip_city}
                  </div>
                </div>

                <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Zahlungsart:</span>
                    <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>
                      {confirmedOrder.payment_method === 'sumup' && (
                        <span>💳 SumUp Online {confirmedOrder.payment_id ? `(ID: ${confirmedOrder.payment_id.slice(0, 12)})` : '(Bezahlt)'}</span>
                      )}
                      {confirmedOrder.payment_method === 'cash' && '💶 Barzahlung bei Lieferung (Bargeld)'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Gesamtbetrag:</span>
                    <strong style={{ color: 'var(--red)', fontSize: '13.5px' }}>
                      {Number(confirmedOrder.total).toFixed(2).replace('.', ',')} €
                    </strong>
                  </div>
                </div>

                {/* Items List */}
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(confirmedOrder.order_items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <div>
                        <strong>{item.quantity}x</strong> {item.item_name}
                        {item.selected_size && <span style={{ color: '#64748b', marginLeft: '4px' }}>({item.selected_size})</span>}
                        {Array.isArray(item.toppings_selected) && item.toppings_selected.length > 0 ? (
                          <div style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: '600', marginTop: '2px' }}>
                            + {item.toppings_selected.map(t => typeof t === 'string' ? t : (t?.name || t?.id || String(t))).join(', ')}
                          </div>
                        ) : typeof item.toppings_selected === 'string' && item.toppings_selected ? (
                          <div style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: '600', marginTop: '2px' }}>
                            + {item.toppings_selected}
                          </div>
                        ) : null}
                      </div>
                      <span style={{ fontWeight: '700' }}>
                        {Number(item.total_price || item.unit_price * item.quantity).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Account Status Confirmation (Already Active & Logged In) */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span style={{ fontSize: '13px', color: '#166534', fontWeight: '700' }}>
                    Kundenkonto aktiv &amp; angemeldet: <strong>{customerUser?.full_name || formData.name || customerUser?.email || formData.email}</strong>
                  </span>
                </div>
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 9px',
                  borderRadius: '12px'
                }}>
                  ✓ Automatisch eingeloggt
                </span>
              </div>

              {/* Action Buttons: Print, Call, Done */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={16} />
                  <span>Quittung drucken</span>
                </button>

                <a
                  href={`tel:${restaurantInfo.phone.replace(/\s+/g, '')}`}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={16} color="var(--red)" />
                  <span>Pizzeria anrufen</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrder(null);
                    setStep(1);
                    if (cartItems.length === 0) {
                      onClose();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'var(--red)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
                    marginTop: '2px'
                  }}
                >
                  <ShoppingBag size={16} />
                  <span>{cartItems.length > 0 ? 'Zur Kasse (Neues Gericht bestellen)' : 'Neue Bestellung aufgeben'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    marginTop: '2px'
                  }}
                >
                  Zurück zum Restaurant (Bestellung bleibt im Banner aktiv)
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Processing Loading Overlay */}
        {isProcessing && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 10
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '4px solid #f1f5f9',
              borderTopColor: 'var(--red)',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '18px'
            }} />
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              Bestellung wird verarbeitet
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              {processingStatusText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
