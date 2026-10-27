import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Globe,
  Search,
  Check,
  X,
  User,
  Phone,
  MapPin,
  Sparkles,
  RefreshCw,
  Power,
  PackageCheck,
  PackageX,
  UtensilsCrossed,
  Layers,
  ArrowLeft,
  Sliders,
  DollarSign,
  Image as ImageIcon,
  Upload,
  Eye,
  CheckSquare,
  Square,
  CreditCard,
  Printer,
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  Flame,
  Leaf,
  Tag,
  ChevronDown,
  RotateCcw,
  Info,
  Sun,
  Moon,
  BellRing,
  LogOut,
  Mail,
  Star,
  Camera,
  FolderPlus
} from 'lucide-react';
import {
  getStoredCategories,
  fetchCategoriesFromSupabase,
  addCustomCategory,
  deleteCategory,
  subscribeToCategories
} from '../lib/categoryManager';
import {
  isSupabaseConfigured,
  supabase,
  getOrders,
  updateOrderStatus,
  updateOrderPrepTime,
  assignDriverToOrder,
  getDrivers,
  addDriver,
  updateDriverStatus,
  getMenuItems,
  updateMenuItemStock,
  updateMenuItemPrepTime,
  upsertMenuItem,
  deleteMenuItem,
  subscribeToOrders,
  subscribeToMenuItems,
  updateOrderDetails,
  playOrderChime,
  getAdminSession,
  signOutAdminUser,
  getStoreSettings,
  updateStoreStatus,
  subscribeToStoreSettings,
  uploadDishImage,
  uploadMultipleDishImages,
  deleteOrder,
  clearAllOrders,
  isValidOrderRecord
} from '../lib/supabaseClient';
import AdminLogin from './AdminLogin';
import ThermalPrinterModal from './ThermalPrinterModal';
import { getPrinterStatus, printOrderThermal } from '../lib/printerService';
import {
  allMenuItems as defaultMenuItems,
  specialOffersData,
  categoriesData,
  standardPizzaSizes,
  calzoneSizes,
  pizzaExtraToppingsList
} from '../data/menuData';
import { notifyMenuUpdated, getItemCanonicalCategory } from '../data/liveMenuState';
import { getDeliveryZone, DELIVERY_ZONES_CONFIG, ALL_SUPPORTED_AREAS } from '../lib/deliveryZones';

// Category emoji mapping for UI
const CATEGORY_EMOJIS = {
  all: '🍽️',
  pizzen: '🍕',
  pizza: '🍕',
  calzone: '🥟',
  pasta: '🍝',
  gnocchi: '🥔',
  'pasta-al-forno': '🍲',
  vegetarisch: '🌱',
  auflaeufe: '🫕',
  reisgerichte: '🍚',
  fleischgerichte: '🥩',
  schnitzel: '🥩',
  gyros: '🥙',
  doner: '🥙',
  salate: '🥗',
  salad: '🥗',
  'grill-menue': '🔥',
  'american-food': '🍔',
  'burger-snacks': '🍔',
  indisch: '🍛',
  lamm: '🍖',
  steaks: '🥩',
  mexikanisch: '🌮',
  chinesisch: '🥡',
  beilagen: '🍟',
  toasts: '🥪',
  omelette: '🍳',
  getraenke: '🥤',
  'dessert-drinks': '🥤',
  deals: '🏷️'
};

// Frontend categories with clean German names (mirroring store)
const FRONTEND_CATEGORIES = [
  { id: 'all', name_de: 'Alle Gerichte', name_en: 'All Dishes' },
  { id: 'pizzen', name_de: 'Pizzen', name_en: 'Pizzas' },
  { id: 'deals', name_de: 'Spar-Menüs & Deals', name_en: 'Deals & Offers' },
  { id: 'pasta', name_de: 'Pasta', name_en: 'Pasta' },
  { id: 'gnocchi', name_de: 'Gnocchi', name_en: 'Gnocchi' },
  { id: 'pasta-al-forno', name_de: 'Pasta al Forno', name_en: 'Pasta al Forno' },
  { id: 'vegetarisch', name_de: 'Vegetarisch überbacken', name_en: 'Vegetarian Baked Dishes' },
  { id: 'auflaeufe', name_de: 'Aufläufe', name_en: 'Casseroles' },
  { id: 'reisgerichte', name_de: 'Reisgerichte im Ofen überbacken', name_en: 'Baked Rice Dishes' },
  { id: 'fleischgerichte', name_de: 'Fleischgerichte', name_en: 'Meat Dishes' },
  { id: 'gyros', name_de: 'Gyros & Döner', name_en: 'Gyros & Döner' },
  { id: 'salate', name_de: 'Salate', name_en: 'Salads' },
  { id: 'grill-menue', name_de: 'Grill Menü', name_en: 'Grill Menu' },
  { id: 'american-food', name_de: 'American Food', name_en: 'American Food & Burgers' },
  { id: 'indisch', name_de: 'Indische Hauptgerichte', name_en: 'Indian Main Dishes' },
  { id: 'lamm', name_de: 'Lamm Spezialitäten', name_en: 'Lamb Specialties' },
  { id: 'steaks', name_de: 'Steaks', name_en: 'Steaks' },
  { id: 'mexikanisch', name_de: 'Mexikanische Gerichte', name_en: 'Mexican Dishes' },
  { id: 'chinesisch', name_de: 'Chinesische Gerichte', name_en: 'Chinese Dishes' },
  { id: 'beilagen', name_de: 'Extra Beilagen', name_en: 'Side Dishes' },
  { id: 'toasts', name_de: 'Toasts', name_en: 'Toasts' },
  { id: 'omelette', name_de: 'Omelette mit Käse überbacken', name_en: 'Baked Cheese Omelette' },
  { id: 'getraenke', name_de: 'Getränke & Desserts', name_en: 'Beverages & Desserts' }
];

// Preset images available in public/images
const PRESET_IMAGES = [
  { label: 'Pizza Margherita', category: 'pizza', url: '/images/pizza1.png' },
  { label: 'Pizza Salami', category: 'pizza', url: '/images/pizza2.png' },
  { label: 'Pizza Schinken', category: 'pizza', url: '/images/pizza3.png' },
  { label: 'Pizza Tonno', category: 'pizza', url: '/images/pizza4.png' },
  { label: 'Pizza Special', category: 'pizza', url: '/images/pizza5.png' },
  { label: 'Hero Steinofen Pizza', category: 'pizza', url: '/images/hero_pizza.jpg' },
  { label: 'Calzone & Melts', category: 'calzone', url: '/images/cat_calzone.jpg' },
  { label: 'Pasta Speciale', category: 'pasta', url: '/images/pasta_special.jpg' },
  { label: 'Crispy Burger', category: 'burger-snacks', url: '/images/burger_crispy.jpg' },
  { label: 'Döner Fleisch Spezial', category: 'doner', url: '/images/cat_doner.jpg' },
  { label: 'Wiener Schnitzel', category: 'schnitzel', url: '/images/cat_schnitzel.jpg' },
  { label: 'Frischer Gartensalat', category: 'salad', url: '/images/cat_salad.jpg' },
  { label: 'Hausgemachtes Tiramisu', category: 'dessert-drinks', url: '/images/tiramisu_dessert.jpg' },
  { label: 'Spar-Menü A1', category: 'deals', url: '/images/Offer1.png' },
  { label: 'Spar-Menü A2', category: 'deals', url: '/images/Offer2.png' },
  { label: 'Spar-Menü A3', category: 'deals', url: '/images/offer3.png' }
];

// Bilingual Size Names
const SIZE_NAMES = {
  small: { de: 'Klein', en: 'Small' },
  large: { de: 'Groß', en: 'Large' },
  family: { de: 'Familie', en: 'Family' },
  party: { de: 'Party', en: 'Party' }
};

// Bilingual Extra Toppings
const EXTRA_TOPPINGS_TRANSLATIONS = {
  mozzarella: { de: 'Extra Mozzarella / Käse', en: 'Extra Mozzarella / Cheese' },
  salami: { de: 'Salami', en: 'Salami' },
  schinken: { de: 'Schinken', en: 'Ham' },
  hackfleisch: { de: 'Hackfleisch', en: 'Minced Meat' },
  donerfleisch: { de: 'Dönerfleisch', en: 'Döner Meat' },
  champignons: { de: 'Frische Champignons', en: 'Fresh Mushrooms' },
  zwiebeln: { de: 'Rote Zwiebeln', en: 'Red Onions' },
  knoblauch: { de: 'Frischer Knoblauch / Knoblauchöl', en: 'Fresh Garlic / Garlic Oil' },
  'peperoni-scharf': { de: 'Scharfe Peperoni / Jalapeños', en: 'Hot Peppers / Jalapeños' },
  oliven: { de: 'Schwarze Oliven', en: 'Black Olives' },
  artischocken: { de: 'Artischocken', en: 'Artichokes' },
  feta: { de: 'Schafskäse / Feta', en: 'Feta Cheese' },
  gorgonzola: { de: 'Gorgonzola', en: 'Gorgonzola' },
  ananas: { de: 'Ananas', en: 'Pineapple' },
  mais: { de: 'Mais', en: 'Corn' },
  brokkoli: { de: 'Brokkoli', en: 'Broccoli' },
  krabben: { de: 'Krabben / Meeresfrüchte', en: 'Shrimp / Seafood' },
  thunfisch: { de: 'Thunfisch', en: 'Tuna' }
};

// Bilingual Quick Ingredients
const COMMON_QUICK_INGREDIENTS = [
  { de: 'Tomatensauce', en: 'Tomato sauce' },
  { de: 'Mozzarella', en: 'Mozzarella' },
  { de: 'Gouda', en: 'Gouda' },
  { de: 'Hinterschinken', en: 'Ham' },
  { de: 'Salami', en: 'Salami' },
  { de: 'Champignons', en: 'Mushrooms' },
  { de: 'Peperoni', en: 'Hot peppers' },
  { de: 'Knoblauch', en: 'Garlic' },
  { de: 'Basilikum', en: 'Basil' },
  { de: 'Zwiebeln', en: 'Onions' },
  { de: 'Schwarze Oliven', en: 'Black olives' },
  { de: 'Gorgonzola', en: 'Gorgonzola' },
  { de: 'Thunfisch', en: 'Tuna' },
  { de: 'Paprika', en: 'Bell peppers' },
  { de: 'Ananas', en: 'Pineapple' },
  { de: 'Blattspinat', en: 'Leaf spinach' },
  { de: 'Knuspriger Bacon', en: 'Crispy bacon' },
  { de: 'Rinder-Sucuk', en: 'Beef sucuk' },
  { de: 'Oregano', en: 'Oregano' }
];

// Preset Filter Categories
const PRESET_CATEGORIES = [
  { id: 'all', label_de: 'Alle', label_en: 'All' },
  { id: 'pizza', label_de: '🍕 Pizza', label_en: '🍕 Pizza' },
  { id: 'calzone', label_de: '🌯 Calzone', label_en: '🌯 Calzone' },
  { id: 'burger-snacks', label_de: '🍔 Burger', label_en: '🍔 Burger' },
  { id: 'pasta', label_de: '🍝 Pasta', label_en: '🍝 Pasta' },
  { id: 'salad', label_de: '🥗 Salat', label_en: '🥗 Salad' },
  { id: 'dessert-drinks', label_de: '🍰 Dessert', label_en: '🍰 Dessert' },
  { id: 'deals', label_de: '🏷️ Deals', label_en: '🏷️ Deals' }
];

// Badge Options
const BADGE_OPTIONS = [
  { val: '', label_de: 'Kein Badge', label_en: 'No Badge' },
  { val: 'Bestseller', label_de: 'Bestseller 🔥', label_en: 'Bestseller 🔥' },
  { val: 'Beliebt', label_de: 'Beliebt ⭐', label_en: 'Popular ⭐' },
  { val: 'Empfehlung', label_de: 'Empfehlung 👨‍🍳', label_en: 'Chef’s Pick 👨‍🍳' },
  { val: 'Klassiker', label_de: 'Klassiker 🍕', label_en: 'Classic 🍕' },
  { val: 'Neu', label_de: 'Neu ✨', label_en: 'New ✨' },
  { val: 'Top-Sparer', label_de: 'Top-Sparer 💰', label_en: 'Top Deal 💰' },
  { val: 'Party-Hit', label_de: 'Party-Hit 🎉', label_en: 'Party Hit 🎉' }
];

// Dietary Options
const DIETARY_OPTIONS = [
  { id: 'vegetarisch', label_de: 'Vegetarisch 🌱', label_en: 'Vegetarian 🌱', activeBg: '#064e3b', activeBorder: '#10b981', activeColor: '#34d399' },
  { id: 'vegan', label_de: 'Vegan 🌿', label_en: 'Vegan 🌿', activeBg: '#065f46', activeBorder: '#059669', activeColor: '#6ee7b7' },
  { id: 'scharf', label_de: 'Scharf 🔥', label_en: 'Spicy 🔥', activeBg: '#7f1d1d', activeBorder: '#ef4444', activeColor: '#fca5a5' },
  { id: 'halal', label_de: 'Halal ☪️', label_en: 'Halal ☪️', activeBg: '#1e3a8a', activeBorder: '#3b82f6', activeColor: '#93c5fd' }
];

// Bilingual translations dictionary
const translations = {
  de: {
    adminTitle: 'Venezia Admin Portal',
    headerSubtitle: 'Plauen • Speisekarte & Bestellungs-Management',
    liveBadge: 'LIVE SUPABASE',
    offlineBadge: 'DEMO MODUS (Lokale Daten)',
    reloadData: 'Daten neu laden',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    tabs: {
      orders: 'Bestellungen',
      menu: 'Speisekarte',
      drivers: 'Fahrer',
      addItem: 'Neues Gericht',
      settings: 'Einstellungen'
    },
    metrics: {
      activeOrders: 'Aktive Aufträge',
      deliveredHistory: 'Historie (Geliefert)',
      totalRevenue: 'Gesamtumsatz',
      gatewayReady: 'Stripe & PayPal Bereit'
    },
    orders: {
      title: 'Bestellungen & Bestellhistorie',
      subtitle: 'Echtzeit-Übersicht aller Kundenbestellungen, Historie, Fahrerzuweisung & Zahlungs-Gateway',
      historyTitle: 'Bestellhistorie',
      activeOrders: 'Aktive Aufträge',
      orderHistory: 'Bestellhistorie',
      allOrders: 'Alle Bestellungen',
      filterAll: 'Alle Status',
      filterNew: 'Neu',
      filterPreparing: 'In Zubereitung',
      filterDelivery: 'In Zustellung',
      filterDelivered: 'Geliefert / Abgeschlossen',
      filterCancelled: 'Storniert',
      customer: 'Kunde',
      address: 'Lieferadresse',
      orderType: 'Art',
      delivery: 'Lieferung',
      pickup: 'Selbstabholung',
      items: 'Bestellte Gerichte',
      prepTime: 'Zubereitungszeit',
      assignedDriver: 'Fahrer',
      noDriver: 'Kein Fahrer zugewiesen',
      assignDriverBtn: 'Fahrer zuweisen',
      statusChange: 'Status ändern',
      total: 'Gesamtbetrag',
      note: 'Hinweis',
      mins: 'Min.',
      viewDetails: 'Details ansehen',
      paymentGateway: 'Zahlungs-Gateway',
      paymentStatus: 'Zahlungsstatus',
      paymentMethod: 'Zahlungsart',
      testGateway: 'Gateway testen',
      paid: 'Bezahlt',
      pending: 'Ausstehend',
      refunded: 'Rückerstattet',
      noOrders: 'Keine Bestellungen in dieser Ansicht vorhanden.',
      searchPlaceholder: 'Bestell-Nr., Name, Telefon, Straße suchen...',
      resetSearch: 'Suche zurücksetzen',
      statusNew: 'NEU',
      statusPreparing: 'IN ZUBEREITUNG',
      statusDelivery: 'IN ZUSTELLUNG',
      statusDelivered: 'GELIEFERT',
      statusCancelled: 'STORNIERT',
      cash: 'Bar',
      clockSuffix: 'Uhr',
      viewDetailsGateway: 'Details ansehen & Gateway-Test',
      restore: 'Wiederherstellen',
      cancel: 'Stornieren',
      modalOrder: 'Bestellung #',
      received: 'Eingegangen:',
      print: 'Drucken',
      customerAddress: 'Kunden- & Zustelladresse',
      pickupInStore: '🏪 Selbstabholung im Restaurant',
      itemsInDetail: 'Bestellte Gerichte im Detail',
      americanCheeseCrust: '🧀 American Käserand',
      extrasLabel: 'Extras:',
      specialWish: 'Wunsch:',
      subtotal: 'Zwischensumme:',
      deliveryFee: 'Lieferkosten:',
      totalInvoice: 'Gesamtrechnungsbetrag:',
      testReady: 'TESTBEREIT',
      stripeSimulate: '💳 Stripe Zahlung simulieren (Als Bezahlt buchen)',
      paypalSimulate: '🅿️ PayPal Zahlung simulieren (Capture Success)',
      cashSimulate: '💵 Barzahlung als erhalten verbuchen',
      refundSimulate: '↩️ Rückerstattung simulieren (Refunded)',
      kitchenTitle: 'Küche & Zubereitung',
      txId: 'Gateway-Transaktions-ID:',
      simActions: 'Gateway-Simulation & Testaktionen:',
      editOrder: 'Bestellung bearbeiten',
      cancelEdit: 'Bearbeitung abbrechen',
      saveOrder: 'Änderungen speichern',
      savingOrder: 'Wird gespeichert...',
      customerName: 'Kundenname',
      customerPhoneLabel: 'Telefonnummer',
      orderTypeLabel: 'Bestellart',
      streetLabel: 'Straße & Hausnr.',
      zipCityLabel: 'PLZ & Ort',
      deliveryFeeLabel: 'Liefergebühr (€)',
      noteLabel: 'Kundenhinweis',
      addDishToOrder: 'Gericht zur Bestellung hinzufügen',
      selectDishPrompt: '-- Gericht aus Speisekarte wählen --',
      portionLabel: 'Portion / Größe',
      qtyLabel: 'Menge',
      addDishBtn: 'Hinzufügen',
      removeItemBtn: 'Entfernen',
      orderUpdatedSuccess: 'Bestellung erfolgreich aktualisiert!',
      orderUpdateError: 'Fehler beim Speichern der Bestellung!',
      emptyOrderWarn: 'Eine Bestellung muss mindestens 1 Gericht enthalten!',
      selectDishFirstWarn: 'Bitte wählen Sie zuerst ein Gericht aus!'
    },
    menu: {
      title: 'Speisekarte & Lagerbestand',
      subtitle: 'Echtzeit-Verwaltung aller Gerichte, Preise, Größen und Verfügbarkeiten',
      searchPlaceholder: 'Gericht suchen (Name, Nr. oder Zutat)...',
      allCategories: 'Alle Kategorien',
      inStock: 'Auf Lager',
      outOfStock: 'Ausverkauft',
      stockStatus: 'Verfügbarkeit',
      prepTimeLabel: 'Zubereitungszeit',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      addNewItem: 'Neues Gericht anlegen',
      confirmDelete: 'Möchten Sie dieses Gericht wirklich löschen?',
      sizes4: '4 Größen',
      sizes2: '2 Größen',
      americanCrust: 'American Crust',
      vegetarian: 'Vegetarisch 🌱',
      vegan: 'Vegan 🌿',
      spicy: 'Scharf 🔥',
      unitPriceLabel: 'Einzelpreis:'
    },
    form: {
      addNewTitle: 'Neues Gericht zur Speisekarte hinzufügen',
      editTitle: 'Gericht bearbeiten',
      imageSection: 'Gerichtsfoto & Bildauswahl',
      imagePresetHint: 'Wählen Sie ein Standardbild oder laden Sie ein eigenes Bild hoch / URL einfügen:',
      imageUrlPlaceholder: 'Bild-URL einfügen (z. B. /images/pizza1.png oder https://...)',
      uploadBtn: 'Eigenes Bild hochladen',
      number: 'Gericht-Nr. (z. B. 1, 49a)',
      category: 'Kategorie',
      name: 'Gericht-Name',
      desc: 'Beschreibung (optional)',
      toppings: 'Zutaten / Belag',
      unitPrice: 'Einzelpreis (€)',
      singlePriceDesc: 'Standard-Verkaufspreis für Gerichte ohne unterschiedliche Portionsgrößen.',
      sizePricingTitle: 'Größen & Preise',
      sizePricingSubtitle: 'Häkchen setzen für Größen, die im Menü angezeigt werden sollen, und individuellen Preis eintragen:',
      doughOptionTitle: 'Teig- & Boden-Option',
      supportsAmerican: 'American Crust (Käserand) für dieses Gericht anbieten',
      switchToSingle: 'Zu Einzelpreis wechseln (keine Größen)',
      switchToSizes: '+ Verschiedene Größen anbieten (Klein, Groß...)',
      availableAddons: 'Erlaubte Extra-Zutaten (Zusatzbeläge)',
      badge: 'Hervorhebung / Badge',
      badgeNone: 'Kein Badge',
      dietary: 'Ernährungsweise & Kennzeichnung',
      dietaryVegetarian: 'Vegetarisch',
      dietaryVegan: 'Vegan',
      dietaryPescetarian: 'Pescetarisch',
      dietaryHalal: 'Halal',
      dietarySpicy: 'Scharf',
      prepTime: 'Zubereitungszeit (Minuten)',
      initialStock: 'Bestand',
      saveBtn: 'Speichern & Veröffentlichen',
      cancelBtn: 'Abbrechen',
      successSave: 'Gericht erfolgreich in Supabase gespeichert!',
      backToMenu: 'Zurück zur Speisekarte',
      dishLive: 'Gericht ist Live im Shop',
      dishSoldOut: 'Ausverkauft',
      createNewDish: 'Neues Gericht anlegen',
      saveChanges: 'Änderungen speichern',
      switchToNewDish: 'Zu neuem Gericht wechseln',
      editHeroNote: 'Änderungen an Zutaten, Portionsgrößen, Preisen oder Fotos werden sofort im Shop live geschaltet.',
      addHeroSubtitle: 'Konfigurieren Sie Speisenkategorie, Portionsgrößen, individuelle Preise, Fotoauswahl und zulässige Zusatzbeläge.',
      section1Title: '1. Grundinformationen & Text',
      section1Subtitle: 'Nummer, Kategorie, Name und Zutatenliste für die Speisekarte',
      namePlaceholder: 'z. B. Pizza Diavolo',
      toppingsHint: 'Kommagetrennt (erscheint direkt unter dem Titel)',
      toppingsPlaceholder: 'z. B. Tomatensauce, Mozzarella, Salami, Peperoni...',
      quickAddHeading: 'SCHNELL-ZUTATEN PER KLICK HINZUFÜGEN:',
      descPlaceholder: 'Besondere Zubereitung oder Serviervorschlag...',
      section2Title: '2. Portionsgrößen & Preise',
      section2SubtitleSizes: 'Konfigurieren Sie Preise für Normal, Groß, Familie & Party',
      section2SubtitleSingle: 'Ein fester Verkaufspreis für dieses Gericht',
      tabPortionSizes: 'Portionsgrößen',
      tabSinglePrice: 'Einheitspreis',
      sizeActive: 'Aktiv im Menü',
      sizeHidden: 'Ausgeblendet',
      sellingPrice: 'Verkaufspreis:',
      singlePriceCardTitle: 'Einheitlicher Verkaufspreis',
      singlePriceCardSubtitle: 'Gilt für alle Bestellungen dieses Gerichts',
      americanCrustTitle: '🧀 American Crust (Käserand) für dieses Gericht anbieten',
      americanCrustDesc: 'Ermöglicht Kunden im Bestellfenster den Käserand mit Gouda (+3,00 € bis +5,50 € je nach Größe) als Upgrade dazu zu wählen.',
      section3Title: '3. Produktbild & Fotovorlagen',
      section3Subtitle: 'Wählen Sie aus hochauflösenden Vorlagen oder laden Sie ein eigenes Foto hoch',
      enterImageUrl: 'BILD-URL EINGEBEN:',
      uploadFromComputer: 'Eigenes Bild vom Computer auswählen',
      presetsHeading: 'FOTO-VORLAGEN (Klick zum Auswählen):',
      section4Title: '4. Merkmale, Badges & Zubereitung',
      section4Subtitle: 'Hervorhebungen, Ernährungs-Filter, Zubereitungszeit und Lagerbestand',
      badgeLabel: 'Hervorhebung / Badge auf der Karte:',
      dietaryLabel: 'Ernährungs-Filter (Kunden-Filter im Shop):',
      prepTimeUpper: 'ZUBEREITUNGSZEIT:',
      stockUpper: 'LAGERBESTAND / VERFÜGBARKEIT:',
      stockAvailable: 'Sofort lieferbar (Auf Lager)',
      stockSoldOut: 'Derzeit ausverkauft',
      section5Title: '5. Erlaubte Extra-Zutaten (Zusatzbeläge)',
      section5Subtitle: 'Extras für Kunden im Warenkorb wählbar',
      enableAll: 'Alle aktivieren',
      deselectAll: 'Alle abwählen',
      removeAllExtras: 'Alle Extras entfernen',
      clearAllCustomExtras: 'Eigene Extras bereinigen',
      noExtrasBadge: 'Keine Zusatzbeläge: Für dieses Gericht werden im Bestellfenster keine Extras angezeigt.',
      searchExtraTopping: 'Extra-Zutat suchen...',
      saveChangesFor: 'Änderungen für "{name}" speichern',
      livePreviewTitle: 'Live-Vorschau Speisekarte',
      customerView: 'Kundenansicht',
      liveInStock: 'Sofort lieferbar',
      previewChooseSize: 'GRÖSSE WÄHLEN (Hier anklicken zum Testen):',
      addToCartSim: 'In den Warenkorb',
      notAvailableSim: 'Derzeit nicht lieferbar',
      summaryTitle: 'Zusammenfassung',
      summaryCategory: 'Kategorie:',
      summaryPricing: 'Preismodell:',
      summarySizesConfigured: 'Größen konfiguriert',
      summaryFixedPrice: 'Fester Einzelpreis',
      summaryAmericanCrust: 'American Crust:',
      summaryAmericanEnabled: 'Aktiviert (+ Aufpreis)',
      summaryAmericanNo: 'Nein',
      summaryStatus: 'Status:',
      summaryLiveOnMenu: 'Live im Menü',
      summarySoldOut: 'Ausverkauft',
      customSizesTitle: 'Eigene Portionsgrößen anlegen',
      customSizesSubtitle: 'Fügen Sie beliebige eigene Größen hinzu (z.B. XXL 45cm, 0.5L Flasche, 6er Box)',
      addCustomSizeBtn: '+ Eigene Portionsgröße hinzufügen',
      portionNamePlaceholder: 'z.B. XXL, 0.5L, 6 Stück',
      portionDimPlaceholder: 'z.B. Ø 45 cm, Flasche, Portion',
      portionPrice: 'Preis (€)',
      portionActive: 'Aktiv',
      removePortion: 'Löschen',
      noCustomSizes: 'Noch keine benutzerdefinierten Portionsgrößen angelegt.',
      customToppingsTitle: 'Eigene Extra-Zutaten anlegen',
      addCustomToppingBtn: '+ Neue Extra-Zutat anlegen',
      newToppingNameLabel: 'Name der Extra-Zutat',
      newToppingPriceLabel: 'Aufpreis (€)',
      createToppingBtn: 'Zutat anlegen & zuweisen',
      customBadge: 'EIGEN'
    },
    drivers: {
      title: 'Fahrer & Zustellflotte',
      subtitle: 'Lieferfahrer verwalten und Verfügbarkeit überwachen',
      addNewDriver: 'Neuen Fahrer anlegen',
      name: 'Name des Fahrers',
      phone: 'Telefonnummer',
      vehicle: 'Fahrzeugtyp',
      vehicleCar: 'Auto',
      vehicleScooter: 'Roller / Moped',
      vehicleBike: 'E-Bike / Fahrrad',
      status: 'Status',
      statusAvailable: 'Verfügbar',
      statusDelivering: 'Unterwegs',
      statusOffline: 'Offline',
      addBtn: 'Fahrer hinzufügen',
      noDrivers: 'Keine Fahrer hinterlegt.'
    },
    backToStore: 'Zurück zum Shop'
  },
  en: {
    adminTitle: 'Venezia Admin Portal',
    headerSubtitle: 'Plauen • Menu & Order Management',
    liveBadge: 'LIVE SUPABASE',
    offlineBadge: 'DEMO MODE (Local Data)',
    reloadData: 'Reload data',
    themeLight: 'Light',
    themeDark: 'Dark',
    tabs: {
      orders: 'Orders',
      menu: 'Menu & Dishes',
      drivers: 'Drivers',
      addItem: 'Add Dish',
      settings: 'Settings'
    },
    metrics: {
      activeOrders: 'Active Orders',
      deliveredHistory: 'History (Delivered)',
      totalRevenue: 'Total Revenue',
      gatewayReady: 'Stripe & PayPal Ready'
    },
    orders: {
      title: 'Orders & Order History',
      subtitle: 'Real-time overview of customer orders, history, driver dispatch & payment gateway',
      historyTitle: 'Order History',
      activeOrders: 'Active Orders',
      orderHistory: 'Order History',
      allOrders: 'All Orders',
      filterAll: 'All Statuses',
      filterNew: 'New',
      filterPreparing: 'Preparing',
      filterDelivery: 'Out for Delivery',
      filterDelivered: 'Delivered / Completed',
      filterCancelled: 'Cancelled',
      customer: 'Customer',
      address: 'Delivery Address',
      orderType: 'Type',
      delivery: 'Delivery',
      pickup: 'Pickup',
      items: 'Ordered Items',
      prepTime: 'Prep Time',
      assignedDriver: 'Driver',
      noDriver: 'No driver assigned',
      assignDriverBtn: 'Assign Driver',
      statusChange: 'Change Status',
      total: 'Total',
      note: 'Note',
      mins: 'min',
      viewDetails: 'View Details',
      paymentGateway: 'Payment Gateway',
      paymentStatus: 'Payment Status',
      paymentMethod: 'Payment Method',
      testGateway: 'Test Gateway',
      paid: 'Paid',
      pending: 'Pending',
      refunded: 'Refunded',
      noOrders: 'No orders found in this view.',
      searchPlaceholder: 'Search order no., name, phone, street...',
      resetSearch: 'Reset search',
      statusNew: 'NEW',
      statusPreparing: 'PREPARING',
      statusDelivery: 'OUT FOR DELIVERY',
      statusDelivered: 'DELIVERED',
      statusCancelled: 'CANCELLED',
      cash: 'Cash',
      clockSuffix: '',
      viewDetailsGateway: 'View Details & Gateway Test',
      restore: 'Restore',
      cancel: 'Cancel',
      modalOrder: 'Order #',
      received: 'Received:',
      print: 'Print',
      customerAddress: 'Customer & Delivery Address',
      pickupInStore: '🏪 Customer Pickup at Restaurant',
      itemsInDetail: 'Ordered Items in Detail',
      americanCheeseCrust: '🧀 American Cheese Crust',
      extrasLabel: 'Extras:',
      specialWish: 'Special Request:',
      subtotal: 'Subtotal:',
      deliveryFee: 'Delivery Fee:',
      totalInvoice: 'Total Invoice Amount:',
      testReady: 'READY TO TEST',
      stripeSimulate: '💳 Simulate Stripe Payment (Mark as Paid)',
      paypalSimulate: '🅿️ Simulate PayPal Payment (Capture Success)',
      cashSimulate: '💵 Mark Cash Payment as Received',
      refundSimulate: '↩️ Simulate Refund (Refunded)',
      kitchenTitle: 'Kitchen & Preparation',
      txId: 'Gateway Transaction ID:',
      simActions: 'Gateway Simulation & Test Actions:',
      editOrder: 'Edit Order',
      cancelEdit: 'Cancel Edit',
      saveOrder: 'Save Changes',
      savingOrder: 'Saving...',
      customerName: 'Customer Name',
      customerPhoneLabel: 'Phone Number',
      orderTypeLabel: 'Order Type',
      streetLabel: 'Street & House No.',
      zipCityLabel: 'ZIP & City',
      deliveryFeeLabel: 'Delivery Fee (€)',
      noteLabel: 'Customer Note',
      addDishToOrder: 'Add Dish to Order',
      selectDishPrompt: '-- Select dish from menu --',
      portionLabel: 'Portion / Size',
      qtyLabel: 'Quantity',
      addDishBtn: 'Add to Order',
      removeItemBtn: 'Remove',
      orderUpdatedSuccess: 'Order updated successfully!',
      orderUpdateError: 'Error updating order!',
      emptyOrderWarn: 'An order must contain at least 1 item!',
      selectDishFirstWarn: 'Please select a dish first!'
    },
    menu: {
      title: 'Menu & Stock Management',
      subtitle: 'Real-time control over all dishes, prices, sizes and stock availability',
      searchPlaceholder: 'Search dishes (Name, No. or ingredient)...',
      allCategories: 'All Categories',
      inStock: 'In Stock',
      outOfStock: 'Sold Out',
      stockStatus: 'Availability',
      prepTimeLabel: 'Prep Time',
      edit: 'Edit',
      delete: 'Delete',
      addNewItem: 'Add New Dish',
      confirmDelete: 'Are you sure you want to delete this dish?',
      sizes4: '4 Sizes',
      sizes2: '2 Sizes',
      americanCrust: 'American Crust',
      vegetarian: 'Vegetarian 🌱',
      vegan: 'Vegan 🌿',
      spicy: 'Spicy 🔥',
      unitPriceLabel: 'Unit Price:'
    },
    form: {
      addNewTitle: 'Add New Dish to Menu',
      editTitle: 'Edit Dish',
      imageSection: 'Dish Photo & Image Selection',
      imagePresetHint: 'Choose a preset photo or upload/enter a custom image URL:',
      imageUrlPlaceholder: 'Image URL (e.g. /images/pizza1.png or https://...)',
      uploadBtn: 'Upload Custom Photo',
      number: 'Dish No. (e.g. 1, 49a)',
      category: 'Category',
      name: 'Dish Name',
      desc: 'Description (optional)',
      toppings: 'Ingredients / Toppings',
      unitPrice: 'Unit Price (€)',
      singlePriceDesc: 'Standard selling price for dishes with a single portion.',
      sizePricingTitle: 'Sizes & Custom Pricing',
      sizePricingSubtitle: 'Check the sizes to display on the menu and enter custom prices for each:',
      doughOptionTitle: 'Dough & Crust Option',
      supportsAmerican: 'Allow American Cheese Stuffed Crust',
      switchToSingle: 'Switch to Single Price (no sizes)',
      switchToSizes: '+ Enable Portion Sizes (Small, Large...)',
      availableAddons: 'Allowed Extra Toppings / Add-ons',
      badge: 'Badge / Highlight',
      badgeNone: 'No Badge',
      dietary: 'Dietary & Highlights',
      dietaryVegetarian: 'Vegetarian',
      dietaryVegan: 'Vegan',
      dietaryPescetarian: 'Pescetarian',
      dietaryHalal: 'Halal',
      dietarySpicy: 'Spicy',
      prepTime: 'Preparation Time (minutes)',
      initialStock: 'Stock Status',
      saveBtn: 'Save & Publish',
      cancelBtn: 'Cancel',
      successSave: 'Dish successfully saved to Supabase!',
      backToMenu: 'Back to Menu',
      dishLive: 'Dish is Live',
      dishSoldOut: 'Out of Stock',
      createNewDish: 'Create New Dish',
      saveChanges: 'Save Changes',
      switchToNewDish: 'Switch to Add New Dish',
      editHeroNote: 'Changes to ingredients, portion sizes, prices or photos go live in the shop immediately.',
      addHeroSubtitle: 'Configure dish category, portion sizes, individual prices, photo selection and allowed extra toppings.',
      section1Title: '1. Basic Information & Content',
      section1Subtitle: 'Number, category, name and ingredients list for the menu',
      namePlaceholder: 'e.g. Pizza Diavolo',
      toppingsHint: 'Comma-separated (appears directly below title)',
      toppingsPlaceholder: 'e.g. Tomato sauce, mozzarella, salami, hot peppers...',
      quickAddHeading: 'QUICK-ADD INGREDIENTS BY CLICK:',
      descPlaceholder: 'Special preparation or serving suggestion...',
      section2Title: '2. Portion Sizes & Pricing',
      section2SubtitleSizes: 'Configure prices for Small, Large, Family & Party',
      section2SubtitleSingle: 'A fixed selling price for this dish',
      tabPortionSizes: 'Portion Sizes',
      tabSinglePrice: 'Single Price',
      sizeActive: 'Active on Menu',
      sizeHidden: 'Hidden',
      sellingPrice: 'Selling Price:',
      singlePriceCardTitle: 'Single Selling Price',
      singlePriceCardSubtitle: 'Applies to all orders of this dish',
      americanCrustTitle: '🧀 Offer American Crust (Cheese Stuffed Crust) for this dish',
      americanCrustDesc: 'Allows customers to choose Gouda cheese stuffed crust (+€3.00 to +€5.50 depending on size) as an upgrade.',
      section3Title: '3. Product Photo & Image Presets',
      section3Subtitle: 'Choose from high-resolution presets or upload a custom photo',
      enterImageUrl: 'ENTER IMAGE URL:',
      uploadFromComputer: 'Upload custom image from computer',
      presetsHeading: 'PHOTO PRESETS (Click to select):',
      section4Title: '4. Highlights, Badges & Preparation',
      section4Subtitle: 'Highlights, dietary filters, prep time and stock status',
      badgeLabel: 'Highlight / Badge on Menu Card:',
      dietaryLabel: 'Dietary Filter (Customer filter in shop):',
      prepTimeUpper: 'PREPARATION TIME:',
      stockUpper: 'STOCK / AVAILABILITY:',
      stockAvailable: 'In Stock (Available)',
      stockSoldOut: 'Currently Sold Out',
      section5Title: '5. Allowed Extra Toppings / Add-ons',
      section5Subtitle: 'extras selectable by customers in cart',
      enableAll: 'Enable All',
      deselectAll: 'Deselect All',
      removeAllExtras: 'Remove All Extras',
      clearAllCustomExtras: 'Clear Custom Extras',
      noExtrasBadge: 'No extra toppings: Customers will see no extras for this dish in the modal.',
      searchExtraTopping: 'Search extra topping...',
      saveChangesFor: 'Save Changes for "{name}"',
      livePreviewTitle: 'Live Menu Preview',
      customerView: 'Customer View',
      liveInStock: 'In Stock',
      previewChooseSize: 'CHOOSE SIZE (Click here to test):',
      addToCartSim: 'Add to Cart',
      notAvailableSim: 'Currently Unavailable',
      summaryTitle: 'Summary',
      summaryCategory: 'Category:',
      summaryPricing: 'Pricing Model:',
      summarySizesConfigured: 'sizes configured',
      summaryFixedPrice: 'Fixed single price',
      summaryAmericanCrust: 'American Crust:',
      summaryAmericanEnabled: 'Enabled (+ extra charge)',
      summaryAmericanNo: 'No',
      summaryStatus: 'Status:',
      summaryLiveOnMenu: 'Live on Menu',
      summarySoldOut: 'Sold Out',
      customSizesTitle: 'Custom Portion Sizes',
      customSizesSubtitle: 'Add any custom portion sizes (e.g. XXL 45cm, 0.5L Bottle, 6-Pack)',
      addCustomSizeBtn: '+ Add Custom Portion Size',
      portionNamePlaceholder: 'e.g. XXL, 0.5L, 6-Pack',
      portionDimPlaceholder: 'e.g. Ø 45 cm, Bottle, Portion',
      portionPrice: 'Price (€)',
      portionActive: 'Active',
      removePortion: 'Delete',
      noCustomSizes: 'No custom portion sizes added yet.',
      customToppingsTitle: 'Custom Extra Ingredients',
      addCustomToppingBtn: '+ Add Custom Extra Ingredient',
      newToppingNameLabel: 'Extra Ingredient Name',
      newToppingPriceLabel: 'Extra Price (€)',
      createToppingBtn: 'Create & Assign Ingredient',
      customBadge: 'CUSTOM'
    },
    drivers: {
      title: 'Drivers & Fleet Management',
      subtitle: 'Manage delivery drivers and monitor availability',
      addNewDriver: 'Add New Driver',
      name: 'Driver Name',
      phone: 'Phone Number',
      vehicle: 'Vehicle Type',
      vehicleCar: 'Car',
      vehicleScooter: 'Scooter / Moped',
      vehicleBike: 'E-Bike / Bicycle',
      status: 'Status',
      statusAvailable: 'Available',
      statusDelivering: 'On Delivery',
      statusOffline: 'Offline',
      addBtn: 'Add Driver',
      noDrivers: 'No drivers added yet.'
    },
    backToStore: 'Back to Store'
  }
};

// Rich Demo Orders for immediate testing of Order History & Payment Gateway
const DEMO_ORDERS = [
  {
    id: 'ord-1001',
    order_number: 'VP-8492',
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    customer_name: 'Maximilian Müller',
    customer_phone: '+49 171 8923412',
    delivery_type: 'delivery',
    street: 'Bahnhofstraße 14',
    zip_city: '08525 Plauen',
    note: 'Bitte bei Müller im 2. OG klingeln.',
    subtotal: 28.50,
    delivery_fee: 2.50,
    total: 31.00,
    status: 'new',
    estimated_delivery_minutes: 35,
    driver_id: null,
    payment_method: 'stripe',
    payment_status: 'paid',
    payment_id: 'ch_3P9x24Lkd81zKla901',
    order_items: [
      {
        item_name: 'Pizza Salami',
        selected_size: 'Groß (Ø 30 cm)',
        is_american: true,
        toppings_selected: ['Extra Käse', 'Knoblauch'],
        special_instructions: 'Bitte gut kross backen',
        quantity: 1,
        unit_price: 13.50,
        total_price: 13.50
      },
      {
        item_name: 'Pasta Carbonara',
        selected_size: 'Portion',
        is_american: false,
        toppings_selected: ['Parmesan extra'],
        special_instructions: '',
        quantity: 1,
        unit_price: 9.50,
        total_price: 9.50
      },
      {
        item_name: 'Tiramisu Hausgemacht',
        selected_size: 'Portion',
        is_american: false,
        toppings_selected: [],
        special_instructions: '',
        quantity: 1,
        unit_price: 5.50,
        total_price: 5.50
      }
    ]
  },
  {
    id: 'ord-1002',
    order_number: 'VP-7821',
    created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    customer_name: 'Laura Schmidt',
    customer_phone: '+49 176 4321987',
    delivery_type: 'pickup',
    street: '',
    zip_city: '',
    note: 'Abholung ca. 14:45 Uhr am Tresen',
    subtotal: 18.00,
    delivery_fee: 0.00,
    total: 18.00,
    status: 'preparing',
    estimated_delivery_minutes: 20,
    driver_id: null,
    payment_method: 'paypal',
    payment_status: 'paid',
    payment_id: 'PAYID-M4589210-9831',
    order_items: [
      {
        item_name: 'Pizza Margherita',
        selected_size: 'Familie (33 × 46 cm)',
        is_american: false,
        toppings_selected: ['Basilikum', 'Frische Tomaten'],
        special_instructions: '',
        quantity: 1,
        unit_price: 18.00,
        total_price: 18.00
      }
    ]
  },
  {
    id: 'ord-1003',
    order_number: 'VP-6510',
    created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    customer_name: 'Thomas Weber',
    customer_phone: '+49 172 9012345',
    delivery_type: 'delivery',
    street: 'Dittesstraße 7',
    zip_city: '08523 Plauen',
    note: 'Hinterer Hauseingang',
    subtotal: 24.50,
    delivery_fee: 2.50,
    total: 27.00,
    status: 'out_for_delivery',
    estimated_delivery_minutes: 40,
    driver_id: '1',
    payment_method: 'cash',
    payment_status: 'pending',
    payment_id: 'CASH-PLAUEN-08523',
    order_items: [
      {
        item_name: 'Pizza Venezia Spezial',
        selected_size: 'Groß (Ø 30 cm)',
        is_american: false,
        toppings_selected: ['Peperoni'],
        special_instructions: 'Scharfe Peperoni bitte',
        quantity: 1,
        unit_price: 12.50,
        total_price: 12.50
      },
      {
        item_name: 'Gemischter Salat',
        selected_size: 'Groß',
        is_american: false,
        toppings_selected: ['Joghurt-Dressing'],
        special_instructions: '',
        quantity: 1,
        unit_price: 7.50,
        total_price: 7.50
      },
      {
        item_name: 'Coca Cola 1,0l',
        selected_size: '1.0L',
        is_american: false,
        toppings_selected: [],
        special_instructions: '',
        quantity: 1,
        unit_price: 4.50,
        total_price: 4.50
      }
    ]
  },
  {
    id: 'ord-1004',
    order_number: 'VP-5402',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    customer_name: 'Sarah Becker',
    customer_phone: '+49 173 5556677',
    delivery_type: 'delivery',
    street: 'Neundorfer Str. 42',
    zip_city: '08523 Plauen',
    note: 'Vorderhaus 3. Stock',
    subtotal: 34.00,
    delivery_fee: 2.50,
    total: 36.50,
    status: 'delivered',
    estimated_delivery_minutes: 35,
    driver_id: '2',
    payment_method: 'stripe',
    payment_status: 'paid',
    payment_id: 'ch_3P8v19Lkd72zPla882',
    order_items: [
      {
        item_name: 'Spar-Angebot A1: 2x Pizza 30cm',
        selected_size: 'Menü-Angebot',
        is_american: false,
        toppings_selected: ['Salami', 'Schinken'],
        special_instructions: '',
        quantity: 1,
        unit_price: 24.50,
        total_price: 24.50
      },
      {
        item_name: 'Chicken Wings (8 Stk.)',
        selected_size: '8 Stück',
        is_american: false,
        toppings_selected: ['BBQ Dip'],
        special_instructions: '',
        quantity: 1,
        unit_price: 9.50,
        total_price: 9.50
      }
    ]
  },
  {
    id: 'ord-1005',
    order_number: 'VP-4390',
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    customer_name: 'Felix Hofmann',
    customer_phone: '+49 174 1122334',
    delivery_type: 'pickup',
    street: '',
    zip_city: '',
    note: '',
    subtotal: 14.50,
    delivery_fee: 0.00,
    total: 14.50,
    status: 'delivered',
    estimated_delivery_minutes: 20,
    driver_id: null,
    payment_method: 'paypal',
    payment_status: 'paid',
    payment_id: 'PAYID-M391024-8712',
    order_items: [
      {
        item_name: 'Calzone Classico',
        selected_size: 'Groß',
        is_american: false,
        toppings_selected: ['Pilze', 'Schinken'],
        special_instructions: '',
        quantity: 1,
        unit_price: 11.50,
        total_price: 11.50
      },
      {
        item_name: 'Fanta 0,33l',
        selected_size: '0.33L',
        is_american: false,
        toppings_selected: [],
        special_instructions: '',
        quantity: 1,
        unit_price: 3.00,
        total_price: 3.00
      }
    ]
  }
];

// Helper to normalize items from DB or local
const normalizeItem = (i) => {
  const cat = getItemCanonicalCategory(i);
  const unitPrice = typeof i.price === 'number'
    ? i.price
    : (i.prices?.single || i.prices?.small || 9.00);
  const allowedToppings = Array.isArray(i.prices?.allowed_toppings)
    ? i.prices.allowed_toppings
    : (Array.isArray(i.allowed_toppings) ? i.allowed_toppings : null);

  const isCalzone = cat === 'calzone' || (i.name && i.name.toLowerCase().includes('calzone'));
  const isPizza = cat === 'pizzen' || cat === 'pizza' || isCalzone;

  const rawImages = Array.isArray(i.prices?.images) && i.prices.images.length > 0
    ? i.prices.images
    : (Array.isArray(i.images) && i.images.length > 0 ? i.images : (i.image_url ? [i.image_url] : []));
  const cleanImagesList = rawImages.filter(img => typeof img === 'string' && img.trim() !== '');

  return {
    ...i,
    category_id: cat,
    category: cat,
    price: unitPrice,
    images: cleanImagesList.length > 0 ? cleanImagesList : (i.image_url ? [i.image_url] : []),
    image_url: cleanImagesList[0] || i.image_url || '',
    sizes_available: i.sizes_available ?? i.sizesAvailable ?? isPizza,
    calzone_sizes: i.calzone_sizes ?? i.calzoneSizes ?? isCalzone,
    supports_american: !!(i.supports_american ?? i.supportsAmerican),
    dietary: Array.isArray(i.dietary) ? i.dietary : [],
    allowed_toppings: allowedToppings
  };
};

const getInitialAdminMenu = () => {
  try {
    const fallbackList = [
      ...specialOffersData.map(d => ({
        id: d.id,
        number: d.code,
        category_id: 'deals',
        category: 'deals',
        name_de: d.title,
        name_en: d.title,
        desc_de: d.description,
        desc_en: d.description,
        toppings_de: d.details || d.description,
        toppings_en: d.details || d.description,
        price: d.price,
        prices: { single: d.price },
        image_url: d.image,
        badge: 'Top-Sparer',
        dietary: [],
        sizes_available: false,
        calzone_sizes: false,
        supports_american: false,
        is_in_stock: true,
        preparation_time_minutes: 25
      })),
      ...defaultMenuItems.map(i => ({
        id: i.id,
        number: i.number,
        category_id: i.category,
        category: i.category,
        name_de: i.name,
        name_en: i.name,
        desc_de: i.desc,
        desc_en: i.desc,
        toppings_de: i.toppings,
        toppings_en: i.toppings,
        prices: i.prices,
        price: typeof i.price === 'number' ? i.price : (i.prices?.single || i.prices?.small || 9.00),
        image_url: i.image || '/images/pizza1.png',
        sizes_available: !!i.sizesAvailable,
        calzone_sizes: !!i.calzoneSizes,
        supports_american: !!i.supportsAmerican,
        badge: i.badge || '',
        dietary: i.dietary || [],
        is_in_stock: true,
        preparation_time_minutes: 20
      }))
    ];
    return fallbackList.map(normalizeItem);
  } catch {
    return [];
  }
};

export default function AdminPanel({ onBackToStore }) {
  const [lang, setLang] = useState('de'); // 'de' or 'en'
  const t = translations[lang];

  // Supabase Admin Authentication State
  const [adminUser, setAdminUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;
    async function checkAuth() {
      try {
        const res = await getAdminSession();
        if (active) {
          if (res.success && res.user) {
            setAdminUser(res.user);
          } else {
            setAdminUser(null);
          }
          setIsCheckingAuth(false);
        }
      } catch (err) {
        if (active) {
          setAdminUser(null);
          setIsCheckingAuth(false);
        }
      }
    }
    checkAuth();
    return () => {
      active = false;
    };
  }, []);

  // Admin Theme state ('light' or 'dark') with localStorage persistence
  const [adminTheme, setAdminTheme] = useState(() => {
    try {
      return localStorage.getItem('venezia_admin_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const handleThemeChange = (newTheme) => {
    setAdminTheme(newTheme);
    try {
      localStorage.setItem('venezia_admin_theme', newTheme);
    } catch (e) {
      // Ignore localStorage write error
    }
  };

  const isLight = adminTheme === 'light';

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu', 'drivers', 'addItem'
  const isConnected = isSupabaseConfigured();

  // Data states
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState(getInitialAdminMenu);
  const recentLocalUpdatesRef = useRef(new Map());
  const [drivers, setDrivers] = useState([
    { id: '1', name: 'Marco Bianchi', phone: '+49 170 1234567', vehicle_type: 'Auto', current_status: 'available', is_active: true },
    { id: '2', name: 'Luigi Rossi', phone: '+49 171 2345678', vehicle_type: 'Roller', current_status: 'available', is_active: true },
    { id: '3', name: 'Stefan Wagner', phone: '+49 172 3456789', vehicle_type: 'Auto', current_status: 'available', is_active: true }
  ]);
  const [loading, setLoading] = useState(true);
  const [ordersTab, setOrdersTab] = useState('active'); // 'active', 'history', 'all'
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const adminCatTrackRef = useRef(null);
  const [canScrollCatLeft, setCanScrollCatLeft] = useState(false);
  const [canScrollCatRight, setCanScrollCatRight] = useState(true);

  const checkAdminCatScroll = () => {
    if (adminCatTrackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = adminCatTrackRef.current;
      setCanScrollCatLeft(scrollLeft > 6);
      setCanScrollCatRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  };

  const scrollAdminCat = (direction) => {
    if (adminCatTrackRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      adminCatTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkAdminCatScroll, 320);
    }
  };

  // Store Online/Offline Open Status State
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isUpdatingStoreStatus, setIsUpdatingStoreStatus] = useState(false);
  const [storeStatusNotice, setStoreStatusNotice] = useState('');

  // Subscribe to live store status
  useEffect(() => {
    const unsub = subscribeToStoreSettings((open) => {
      setIsStoreOpen(open);
    });
    return () => unsub();
  }, []);

  const handleToggleStoreStatus = async () => {
    const nextStatus = !isStoreOpen;
    setIsUpdatingStoreStatus(true);
    try {
      const res = await updateStoreStatus(nextStatus);
      if (res && res.success) {
        setIsStoreOpen(nextStatus);
        setStoreStatusNotice(
          nextStatus
            ? '✓ Online-Bestellungen AKTIV: Kunden können normal bestellen.'
            : '⏸ Online-Bestellungen PAUSIERT: Kunden sehen den Hinweis "Geschlossen" und können nur die Speisekarte ansehen.'
        );
        setTimeout(() => setStoreStatusNotice(''), 6000);
      } else {
        alert('Fehler beim Aktualisieren des Shop-Status: ' + (res?.error || 'Unbekannt'));
      }
    } catch (err) {
      alert('Fehler beim Aktualisieren: ' + (err.message || 'Netzwerkfehler'));
    } finally {
      setIsUpdatingStoreStatus(false);
    }
  };

  // Default size pricing configurations
  const DEFAULT_SIZES_CONFIG = {
    small: { enabled: true, price: '9.00', name: 'Klein', dim: 'Ø 26 cm' },
    large: { enabled: true, price: '11.00', name: 'Groß', dim: 'Ø 30 cm' },
    family: { enabled: true, price: '18.50', name: 'Familie', dim: '33 × 46 cm' },
    party: { enabled: true, price: '22.50', name: 'Party', dim: '40 × 60 cm' }
  };

  // Dynamic categories state synced with Supabase & categoryManager
  const [categoriesList, setCategoriesList] = useState(getStoredCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSub, setNewCatSub] = useState('');
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍽️');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchCategoriesFromSupabase().then((cats) => {
      if (mounted && Array.isArray(cats) && cats.length > 0) {
        setCategoriesList(cats);
      }
    });
    const unsub = subscribeToCategories((cats) => {
      if (mounted && Array.isArray(cats) && cats.length > 0) {
        setCategoriesList(cats);
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const activeFrontendCategories = React.useMemo(() => {
    return [
      { id: 'all', name_de: 'Alle Gerichte', name_en: 'All Dishes', icon: '📋' },
      ...categoriesList.map(c => ({
        id: c.id,
        name_de: c.name_de || c.name,
        name_en: c.name_en || c.name_de || c.name,
        icon: c.icon || CATEGORY_EMOJIS[c.id] || '🍽️',
        sub: c.sub || '',
        title: c.title || `${c.name_de || c.name} Spezialitäten`,
        is_custom: !!c.is_custom
      }))
    ];
  }, [categoriesList]);

  // Form states for Add / Edit dish
  const [editingItem, setEditingItem] = useState(null);
  const [dishForm, setDishForm] = useState({
    id: '',
    number: '',
    category_id: 'pizza',
    name: '',
    desc: '',
    toppings: '',
    image_url: '',
    images: [],
    price: 9.00,
    has_sizes: true,
    sizes_config: { ...DEFAULT_SIZES_CONFIG },
    custom_sizes: [],
    supports_american: false,
    badge: '',
    dietary: [],
    allowed_toppings: pizzaExtraToppingsList.map(t => t.id),
    custom_toppings: [],
    preparation_time_minutes: 20,
    is_in_stock: true
  });

  const [isUploadingDishImage, setIsUploadingDishImage] = useState(false);
  const [previewSizeKey, setPreviewSizeKey] = useState('small');
  const [presetFilterCategory, setPresetFilterCategory] = useState('all');
  const [toppingsFilterQuery, setToppingsFilterQuery] = useState('');

  // Custom Extra Toppings Registry
  const [customToppingsList, setCustomToppingsList] = useState(() => {
    try {
      const saved = localStorage.getItem('venezia_custom_toppings');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [deletedCustomToppingIds, setDeletedCustomToppingIds] = useState(() => {
    try {
      const saved = localStorage.getItem('venezia_deleted_custom_toppings');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });
  const [showAddCustomToppingModal, setShowAddCustomToppingModal] = useState(false);
  const [newToppingName, setNewToppingName] = useState('');
  const [newToppingPrice, setNewToppingPrice] = useState('2.50');

  // Order Editing States
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editOrderForm, setEditOrderForm] = useState(null);
  const [addDishToOrderSelect, setAddDishToOrderSelect] = useState('');
  const [addDishToOrderSize, setAddDishToOrderSize] = useState('');
  const [addDishToOrderQty, setAddDishToOrderQty] = useState(1);

  // Thermal Printer Integration States (Zjiang ZJ-8330-L)
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [printerStatus, setPrinterStatus] = useState(null);
  const [printingOrderId, setPrintingOrderId] = useState(null);
  const [printedOrderIds, setPrintedOrderIds] = useState(new Set());

  const handleAddQuickTopping = (toppingName) => {
    setDishForm(prev => {
      const current = (prev.toppings || '').trim();
      if (!current) return { ...prev, toppings: toppingName };
      const list = current.split(',').map(s => s.trim().toLowerCase());
      if (list.includes(toppingName.toLowerCase())) return prev;
      return { ...prev, toppings: `${current}, ${toppingName}` };
    });
  };

  const handleAddCustomExtraTopping = (name, price) => {
    if (!name || !name.trim()) return;
    const newId = 'custom_top_' + Date.now();
    const newTopping = {
      id: newId,
      name: name.trim(),
      price: Number(price) || 2.50
    };
    const updated = [...customToppingsList, newTopping];
    setCustomToppingsList(updated);
    try {
      localStorage.setItem('venezia_custom_toppings', JSON.stringify(updated));
    } catch (e) {}

    // Auto-select for current dish
    setDishForm(prev => ({
      ...prev,
      allowed_toppings: [...(prev.allowed_toppings || []), newId],
      custom_toppings: [...(prev.custom_toppings || []), newTopping]
    }));

    setNewToppingName('');
    setNewToppingPrice('2.50');
    setShowAddCustomToppingModal(false);
    showToast(lang === 'de' ? `Extra-Zutat "${name}" angelegt!` : `Extra topping "${name}" added!`, 'success');
  };

  const handleDeleteCustomTopping = async (toppingId) => {
    // 1. Immediately record in deleted set so allToppingsCatalog excludes it instantly
    setDeletedCustomToppingIds(prev => {
      const updated = new Set(prev);
      updated.add(toppingId);
      try {
        localStorage.setItem('venezia_deleted_custom_toppings', JSON.stringify(Array.from(updated)));
      } catch (e) {}
      return updated;
    });

    // 2. Remove from dishForm
    setDishForm(prev => ({
      ...prev,
      allowed_toppings: (prev.allowed_toppings || []).filter(id => id !== toppingId),
      custom_toppings: (prev.custom_toppings || []).filter(ct => ct.id !== toppingId)
    }));

    // 3. Remove from customToppingsList & localStorage
    setCustomToppingsList(prev => {
      const updated = prev.filter(ct => ct.id !== toppingId);
      try {
        localStorage.setItem('venezia_custom_toppings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 4. Remove from editingItem so re-renders cannot restore it
    setEditingItem(prev => {
      if (!prev) return prev;
      const curPrices = prev.prices || {};
      return {
        ...prev,
        custom_toppings: (prev.custom_toppings || []).filter(ct => ct.id !== toppingId),
        allowed_toppings: (prev.allowed_toppings || []).filter(id => id !== toppingId),
        prices: {
          ...curPrices,
          custom_toppings: (curPrices.custom_toppings || []).filter(ct => ct.id !== toppingId),
          allowed_toppings: (curPrices.allowed_toppings || []).filter(id => id !== toppingId)
        }
      };
    });

    // 5. Remove from menuItems state
    setMenuItems(prev => prev.map(item => {
      const hasCustom = item.custom_toppings?.some(ct => ct.id === toppingId) || item.prices?.custom_toppings?.some(ct => ct.id === toppingId);
      const hasAllowed = item.allowed_toppings?.includes(toppingId) || item.prices?.allowed_toppings?.includes(toppingId);
      if (!hasCustom && !hasAllowed) return item;

      const cleanCustom = (item.custom_toppings || item.prices?.custom_toppings || []).filter(ct => ct.id !== toppingId);
      const cleanAllowed = (item.allowed_toppings || item.prices?.allowed_toppings || []).filter(id => id !== toppingId);
      return {
        ...item,
        custom_toppings: cleanCustom,
        allowed_toppings: cleanAllowed,
        prices: {
          ...(item.prices || {}),
          custom_toppings: cleanCustom,
          allowed_toppings: cleanAllowed
        }
      };
    }));

    // 6. Delete from Supabase in background
    if (isConnected) {
      try {
        const dishesToUpdate = menuItems.filter(item =>
          item.prices?.custom_toppings?.some(ct => ct.id === toppingId) ||
          item.prices?.allowed_toppings?.includes(toppingId)
        );
        for (const d of dishesToUpdate) {
          const cleanCustom = (d.prices?.custom_toppings || []).filter(ct => ct.id !== toppingId);
          const cleanAllowed = (d.prices?.allowed_toppings || []).filter(id => id !== toppingId);
          await supabase
            .from('menu_items')
            .update({
              prices: {
                ...(d.prices || {}),
                custom_toppings: cleanCustom,
                allowed_toppings: cleanAllowed
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', d.id);
        }
      } catch (err) {
        console.warn('Error purging custom topping from Supabase:', err);
      }
    }

    notifyMenuUpdated();
    showToast(lang === 'de' ? 'Extra-Zutat dauerhaft gelöscht' : 'Extra topping permanently deleted', 'info');
  };

  const handleClearAllCustomToppings = () => {
    if (!window.confirm(lang === 'de' ? 'Möchten Sie wirklich alle erstellten Extra-Zutaten löschen?' : 'Are you sure you want to delete all custom extra ingredients?')) return;
    const allCustomIds = customToppingsList.map(ct => ct.id);
    setDeletedCustomToppingIds(prev => {
      const next = new Set([...prev, ...allCustomIds]);
      try {
        localStorage.setItem('venezia_deleted_custom_toppings', JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
    setCustomToppingsList([]);
    try {
      localStorage.removeItem('venezia_custom_toppings');
    } catch (e) {}
    setDishForm(prev => ({
      ...prev,
      allowed_toppings: (prev.allowed_toppings || []).filter(id => !allCustomIds.includes(id)),
      custom_toppings: []
    }));
    notifyMenuUpdated();
    showToast(lang === 'de' ? 'Alle eigenen Extra-Zutaten gelöscht' : 'All custom extras deleted', 'success');
  };

  // Custom Portion Sizes Helpers
  const handleAddCustomSize = () => {
    setDishForm(prev => ({
      ...prev,
      custom_sizes: [
        ...(prev.custom_sizes || []),
        {
          id: `cs_${Date.now()}`,
          name: '',
          dim: '',
          price: '10.00',
          enabled: true
        }
      ]
    }));
  };

  const handleUpdateCustomSize = (index, field, value) => {
    setDishForm(prev => {
      const updated = [...(prev.custom_sizes || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, custom_sizes: updated };
    });
  };

  const handleRemoveCustomSize = (index) => {
    setDishForm(prev => {
      const updated = [...(prev.custom_sizes || [])];
      updated.splice(index, 1);
      return { ...prev, custom_sizes: updated };
    });
  };

  // Order Editing Helpers
  const handleStartEditOrder = (order) => {
    const items = (order.order_items || []).map(it => ({
      ...it,
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || (Number(it.total_price) / (Number(it.quantity) || 1)) || 0,
      total_price: Number(it.total_price) || (Number(it.unit_price) * (Number(it.quantity) || 1)) || 0
    }));

    setEditOrderForm({
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      delivery_type: order.delivery_type || 'delivery',
      street: order.street || '',
      zip_city: order.zip_city || '',
      note: order.note || '',
      delivery_fee: order.delivery_fee !== undefined ? order.delivery_fee : (getDeliveryZone(order.zip_city)?.fee || 0.00),
      order_items: items
    });
    setAddDishToOrderSelect('');
    setAddDishToOrderSize('');
    setAddDishToOrderQty(1);
    setIsEditingOrder(true);
  };

  const handleCancelEditOrder = () => {
    setIsEditingOrder(false);
    setEditOrderForm(null);
  };

  const handleOrderFieldChange = (field, value) => {
    setEditOrderForm(prev => prev ? ({ ...prev, [field]: value }) : prev);
  };

  const handleOrderItemQtyChange = (index, delta) => {
    setEditOrderForm(prev => {
      if (!prev || !prev.order_items) return prev;
      const updated = [...prev.order_items];
      const it = updated[index];
      if (!it) return prev;
      const newQty = Math.max(1, (Number(it.quantity) || 1) + delta);
      const uPrice = Number(it.unit_price) || 0;
      updated[index] = {
        ...it,
        quantity: newQty,
        total_price: Number((uPrice * newQty).toFixed(2))
      };
      return { ...prev, order_items: updated };
    });
  };

  const handleRemoveOrderItem = (index) => {
    setEditOrderForm(prev => {
      if (!prev || !prev.order_items) return prev;
      const updated = [...prev.order_items];
      updated.splice(index, 1);
      return { ...prev, order_items: updated };
    });
  };

  const handleAddDishToOrder = () => {
    if (!addDishToOrderSelect) {
      showToast(t.orders.selectDishFirstWarn, 'error');
      return;
    }
    const item = menuItems.find(m => String(m.id) === String(addDishToOrderSelect));
    if (!item) return;

    let sizeLabel = addDishToOrderSize || '';
    let unitPrice = typeof item.price === 'number' ? item.price : 9.00;

    const customSizes = Array.isArray(item.custom_sizes)
      ? item.custom_sizes
      : (Array.isArray(item.prices?.custom_sizes) ? item.prices.custom_sizes : []);

    if (addDishToOrderSize) {
      if (item.prices && item.prices[addDishToOrderSize] !== undefined) {
        unitPrice = Number(item.prices[addDishToOrderSize]);
      } else {
        const foundCs = customSizes.find(cs => cs.id === addDishToOrderSize || cs.name === addDishToOrderSize);
        if (foundCs) {
          unitPrice = Number(foundCs.price) || unitPrice;
          sizeLabel = foundCs.name;
        }
      }
    } else {
      if (item.prices?.small) {
        unitPrice = item.prices.small;
        sizeLabel = 'Klein (Ø 26cm)';
      } else if (customSizes.length > 0) {
        unitPrice = Number(customSizes[0].price) || unitPrice;
        sizeLabel = customSizes[0].name;
      }
    }

    const qty = Math.max(1, parseInt(addDishToOrderQty, 10) || 1);
    const newItem = {
      id: `oi_${Date.now()}`,
      order_id: selectedOrder?.id,
      item_name: item.name_de || item.name,
      selected_size: sizeLabel,
      is_american: false,
      toppings_selected: [],
      special_instructions: '',
      unit_price: unitPrice,
      quantity: qty,
      total_price: Number((unitPrice * qty).toFixed(2))
    };

    setEditOrderForm(prev => ({
      ...prev,
      order_items: [...(prev.order_items || []), newItem]
    }));

    setAddDishToOrderSelect('');
    setAddDishToOrderSize('');
    setAddDishToOrderQty(1);
    showToast(lang === 'de' ? `"${item.name_de || item.name}" hinzugefügt!` : `"${item.name_en || item.name}" added to order!`, 'success');
  };

  const handleSaveEditedOrder = async () => {
    if (!editOrderForm) return;
    if (!editOrderForm.order_items || editOrderForm.order_items.length === 0) {
      showToast(t.orders.emptyOrderWarn, 'error');
      return;
    }

    const subtotal = editOrderForm.order_items.reduce((sum, it) => {
      const uPrice = Number(it.unit_price) || 0;
      const qty = Number(it.quantity) || 1;
      return sum + (uPrice * qty);
    }, 0);

    const deliveryFee = editOrderForm.delivery_type === 'delivery'
      ? (Number(editOrderForm.delivery_fee) !== undefined && !isNaN(Number(editOrderForm.delivery_fee)) ? Number(editOrderForm.delivery_fee) : 0.00)
      : 0;

    const total = Number((subtotal + deliveryFee).toFixed(2));

    const orderPayload = {
      customer_name: editOrderForm.customer_name,
      customer_phone: editOrderForm.customer_phone,
      delivery_type: editOrderForm.delivery_type,
      street: editOrderForm.street,
      zip_city: editOrderForm.zip_city,
      note: editOrderForm.note,
      subtotal: Number(subtotal.toFixed(2)),
      delivery_fee: Number(deliveryFee.toFixed(2)),
      total
    };

    try {
      const res = await updateOrderDetails(selectedOrder.id, orderPayload, editOrderForm.order_items);
      if (res) {
        const updatedOrder = {
          ...selectedOrder,
          ...orderPayload,
          order_items: editOrderForm.order_items
        };

        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updatedOrder } : o));
        setSelectedOrder(updatedOrder);
        setIsEditingOrder(false);
        setEditOrderForm(null);
        showToast(t.orders.orderUpdatedSuccess, 'success');
      } else {
        showToast(t.orders.orderUpdateError, 'error');
      }
    } catch (err) {
      console.error('Error saving order details:', err);
      showToast(t.orders.orderUpdateError, 'error');
    }
  };

  const resetDishForm = () => {
    setEditingItem(null);
    setPreviewSizeKey('small');
    setDishForm({
      id: '',
      number: '',
      category_id: 'pizza',
      name: '',
      desc: '',
      toppings: '',
      image_url: '/images/pizza1.png',
      images: ['/images/pizza1.png'],
      price: 9.00,
      has_sizes: true,
      sizes_config: { ...DEFAULT_SIZES_CONFIG },
      custom_sizes: [],
      supports_american: false,
      badge: '',
      dietary: [],
      allowed_toppings: pizzaExtraToppingsList.map(t => t.id),
      custom_toppings: [],
      preparation_time_minutes: 20,
      is_in_stock: true
    });
  };

  const handleToggleSize = (sizeKey) => {
    setDishForm(prev => {
      const currentConfig = prev.sizes_config || DEFAULT_SIZES_CONFIG;
      const targetSize = currentConfig[sizeKey] || {};
      return {
        ...prev,
        sizes_config: {
          ...currentConfig,
          [sizeKey]: {
            ...targetSize,
            enabled: !targetSize.enabled
          }
        }
      };
    });
  };

  const handleSizePriceChange = (sizeKey, newPrice) => {
    setDishForm(prev => {
      const currentConfig = prev.sizes_config || DEFAULT_SIZES_CONFIG;
      const targetSize = currentConfig[sizeKey] || {};
      return {
        ...prev,
        sizes_config: {
          ...currentConfig,
          [sizeKey]: {
            ...targetSize,
            price: newPrice
          }
        }
      };
    });
  };

  const handleCategoryChange = (newCatId) => {
    setDishForm(prev => {
      const isPizza = newCatId === 'pizzen' || newCatId === 'pizza';
      const isCalzone = newCatId === 'calzone';
      let updatedSizes = { ...(prev.sizes_config || DEFAULT_SIZES_CONFIG) };

      if (isCalzone) {
        updatedSizes = {
          ...updatedSizes,
          small: { ...updatedSizes.small, enabled: true },
          large: { ...updatedSizes.large, enabled: true },
          family: { ...updatedSizes.family, enabled: false },
          party: { ...updatedSizes.party, enabled: false }
        };
      } else if (isPizza) {
        updatedSizes = {
          ...updatedSizes,
          small: { ...updatedSizes.small, enabled: true },
          large: { ...updatedSizes.large, enabled: true },
          family: { ...updatedSizes.family, enabled: true },
          party: { ...updatedSizes.party, enabled: true }
        };
      }

      return {
        ...prev,
        category_id: newCatId,
        has_sizes: (isPizza || isCalzone) ? true : prev.has_sizes,
        sizes_config: updatedSizes
      };
    });
  };

  const handleToggleAllowedTopping = (toppingId) => {
    setDishForm(prev => {
      const current = prev.allowed_toppings || [];
      const isSelected = current.includes(toppingId);
      const updated = isSelected
        ? current.filter(id => id !== toppingId)
        : [...current, toppingId];
      return { ...prev, allowed_toppings: updated };
    });
  };

  const handleToggleDietary = (dietId) => {
    setDishForm(prev => {
      const current = prev.dietary || [];
      const isSelected = current.includes(dietId);
      const updated = isSelected
        ? current.filter(id => id !== dietId)
        : [...current, dietId];
      return { ...prev, dietary: updated };
    });
  };

  // Driver form
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    vehicle_type: 'Auto'
  });

  // Toast Notification System
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    // Strip any leading unicode checkmarks or crosses to prevent duplicate icons
    const cleanMsg = typeof msg === 'string' ? msg.replace(/^[✓✕✔✗xX]\s*/, '') : msg;
    setToast({ message: cleanMsg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdminLogout = async () => {
    await signOutAdminUser();
    setAdminUser(null);
    showToast(lang === 'de' ? 'Erfolgreich abgemeldet.' : 'Signed out successfully.', 'info');
  };

  // Helper to resolve dish image
  const getDishImage = (item) => {
    if (item.image_url) return item.image_url;
    if (item.image) return item.image;
    if (item.category_id === 'deals' || item.category === 'deals' || item.id?.startsWith('A')) {
      if (item.id === 'A1') return '/images/Offer1.png';
      if (item.id === 'A2') return '/images/Offer2.png';
      return '/images/offer3.png';
    }
    if (item.category_id === 'pasta') return '/images/pasta_special.jpg';
    if (item.category_id === 'calzone') return '/images/cat_calzone.jpg';
    if (item.category_id === 'burger-snacks' || item.category_id === 'burger') return '/images/burger_crispy.jpg';
    if (item.category_id === 'schnitzel') return '/images/cat_schnitzel.jpg';
    if (item.category_id === 'salad') return '/images/cat_salad.jpg';
    if (item.category_id === 'doner') return '/images/cat_doner.jpg';
    if (item.category_id === 'dessert-drinks') return '/images/tiramisu_dessert.jpg';
    return '/images/pizza1.png';
  };

  // 1. Initial Load
  const loadData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    const fallbackList = getInitialAdminMenu();

    try {
      if (isConnected) {
        let fetchedOrders = null;
        let fetchedMenu = null;
        let fetchedDrivers = null;

        try {
          const results = await Promise.allSettled([
            getOrders(),
            getMenuItems(),
            getDrivers()
          ]);
          if (results[0].status === 'fulfilled') fetchedOrders = results[0].value;
          if (results[1].status === 'fulfilled') fetchedMenu = results[1].value;
          if (results[2].status === 'fulfilled') fetchedDrivers = results[2].value;
        } catch (e) {
          console.warn('Promise.allSettled notice:', e);
        }

        if (fetchedOrders) {
          const cleanOrders = fetchedOrders.filter(isValidOrderRecord);
          setOrders(cleanOrders);
        } else {
          setOrders([]);
        }

        if (fetchedMenu && fetchedMenu.length > 0) {
          setMenuItems(fetchedMenu.map(normalizeItem));
        } else {
          setMenuItems(fallbackList);
        }

        if (fetchedDrivers && fetchedDrivers.length > 0) {
          setDrivers(fetchedDrivers);
        }
      } else {
        const localOrders = await getOrders();
        const cleanLocal = (localOrders || []).filter(isValidOrderRecord);
        setOrders(cleanLocal);
        setMenuItems(fallbackList);
      }
    } catch (err) {
      console.warn('loadData exception handled safely:', err);
      setMenuItems(fallbackList);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminUser) return;
    loadData(true);

    // Periodic Supabase Database polling every 5 seconds (ensures cross-device / cross-browser sync works seamlessly!)
    const syncInterval = setInterval(() => {
      loadData(false);
    }, 5000);

    // Unconditionally subscribe to orders for live real-time sync (Supabase + cross-tab/local)
    const unsubOrders = subscribeToOrders((payload) => {
      if (!payload) return;
      const rec = payload.new || payload.old;
      if (!isValidOrderRecord(rec)) {
        if (payload.new && !isValidOrderRecord(payload.new)) {
          setOrders(prev => prev.filter(o => String(o.id) !== String(payload.new.id) && o.order_number !== payload.new.order_number));
          setSelectedOrder(prev => (prev && (String(prev.id) === String(payload.new.id) || prev.order_number === payload.new.order_number)) ? null : prev);
        }
        return; // Discard dummy account registration and deleted records completely
      }
      if (payload.eventType === 'DELETE' && payload.old) {
        setOrders(prev => prev.filter(o => String(o.id) !== String(payload.old.id) && o.order_number !== payload.old.order_number));
        setSelectedOrder(prev => (prev && (String(prev.id) === String(payload.old.id) || prev.order_number === payload.old.order_number)) ? null : prev);
        return;
      }
      if (payload.eventType === 'UPDATE' && payload.new) {
        setOrders(prev => prev.map(o => {
          if (String(o.id) === String(payload.new.id) || o.order_number === payload.new.order_number) {
            const validStatuses = ['new', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
            const updatedStatus = (typeof payload.new.status === 'string' && validStatuses.includes(payload.new.status))
              ? payload.new.status
              : o.status;
            return {
              ...o,
              ...payload.new,
              status: updatedStatus,
              order_items: (payload.new.order_items && payload.new.order_items.length > 0) ? payload.new.order_items : (o.order_items || [])
            };
          }
          return o;
        }));
        setSelectedOrder(prev => {
          if (!prev) return prev;
          if (String(prev.id) === String(payload.new.id) || prev.order_number === payload.new.order_number) {
            const validStatuses = ['new', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
            const updatedStatus = (typeof payload.new.status === 'string' && validStatuses.includes(payload.new.status))
              ? payload.new.status
              : prev.status;
            return {
              ...prev,
              ...payload.new,
              status: updatedStatus,
              order_items: (payload.new.order_items && payload.new.order_items.length > 0) ? payload.new.order_items : (prev.order_items || [])
            };
          }
          return prev;
        });
      } else if (payload.eventType === 'INSERT' && payload.new) {
        playOrderChime();
        setNewOrderAlert({ order: payload.new, time: Date.now() });
        setOrders(prev => {
          if (prev.some(o => String(o.id) === String(payload.new.id) || o.order_number === payload.new.order_number)) {
            return prev.map(o => (String(o.id) === String(payload.new.id) || o.order_number === payload.new.order_number) ? { ...o, ...payload.new } : o);
          }
          return [payload.new, ...prev];
        });
        showToast(lang === 'de'
          ? `🔔 Neue Bestellung: #${payload.new.order_number} (${payload.new.customer_name})`
          : `🔔 New Order: #${payload.new.order_number} (${payload.new.customer_name})`, 'success');

        // Automatic Thermal Receipt Printing Trigger (Zjiang ZJ-8330-L)
        const incomingOrder = payload.new;
        setTimeout(async () => {
          try {
            let orderToPrint = incomingOrder;
            if (!orderToPrint.order_items || orderToPrint.order_items.length === 0) {
              if (supabase) {
                const { data: dbItems } = await supabase.from('order_items').select('*').eq('order_id', incomingOrder.id);
                if (dbItems && dbItems.length > 0) {
                  orderToPrint = { ...incomingOrder, order_items: dbItems };
                }
              }
            }
            const printRes = await printOrderThermal(orderToPrint, { force: false });
            if (printRes && printRes.printed) {
              setPrintedOrderIds(prev => new Set([...prev, incomingOrder.id, incomingOrder.order_number]));
              showToast(lang === 'de'
                ? `🖨️ Bon für #${incomingOrder.order_number} automatisch gedruckt!`
                : `🖨️ Receipt for #${incomingOrder.order_number} automatically printed!`, 'success');
            }
          } catch (pErr) {
            console.warn('[AutoPrint] Notice:', pErr.message);
          }
        }, 600);
      } else {
        loadData(false);
      }
    });

    if (isConnected) {
      const unsubMenu = subscribeToMenuItems((payload) => {
        if (!payload) return;
        if (payload.eventType === 'UPDATE' && payload.new) {
          // If this item was edited locally in the last 2.5 seconds, ignore the realtime echo to prevent stale overwrites
          const lastLocalEdit = recentLocalUpdatesRef.current.get(String(payload.new.id)) || 0;
          if (Date.now() - lastLocalEdit < 2500) {
            return;
          }
          setMenuItems(prev => prev.map(item =>
            String(item.id) === String(payload.new.id)
              ? normalizeItem({ ...item, ...payload.new })
              : item
          ));
        } else if (payload.eventType === 'INSERT' && payload.new) {
          setMenuItems(prev => {
            if (prev.some(i => String(i.id) === String(payload.new.id))) return prev;
            return [...prev, normalizeItem(payload.new)];
          });
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setMenuItems(prev => prev.filter(i => String(i.id) !== String(payload.old.id)));
        }
      });
      return () => {
        clearInterval(syncInterval);
        unsubOrders();
        unsubMenu();
      };
    }

    return () => {
      clearInterval(syncInterval);
      unsubOrders();
    };
  }, [adminUser]);

  // Order Actions
  const handleStatusChange = async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => (String(o.id) === String(orderId) || o.order_number === orderId) ? { ...o, status: newStatus } : o));
    if (selectedOrder && (String(selectedOrder.id) === String(orderId) || selectedOrder.order_number === orderId)) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
    if (isConnected) {
      try {
        await updateOrderStatus(orderId, newStatus);
      } catch (err) {
        console.warn('Status update exception caught:', err);
      }
    }
    const statusMap = {
      new: t.orders.statusNew,
      preparing: t.orders.statusPreparing,
      out_for_delivery: t.orders.statusDelivery,
      delivered: t.orders.statusDelivered,
      cancelled: t.orders.statusCancelled
    };
    showToast(`${t.orders.statusChange}: ${statusMap[newStatus] || newStatus.toUpperCase()}`);
  };

  const handlePrepTimeChange = async (orderId, newMins) => {
    setOrders(prev => prev.map(o => (String(o.id) === String(orderId) || o.order_number === orderId) ? { ...o, estimated_delivery_minutes: newMins } : o));
    if (selectedOrder && (String(selectedOrder.id) === String(orderId) || selectedOrder.order_number === orderId)) {
      setSelectedOrder(prev => ({ ...prev, estimated_delivery_minutes: newMins }));
    }
    try {
      await updateOrderPrepTime(orderId, newMins);
    } catch (err) {
      console.warn('handlePrepTimeChange error:', err);
    }
    showToast(`${t.orders.prepTime}: ${newMins} ${t.orders.mins}`);
  };

  const handleAssignDriver = async (orderId, driverId) => {
    setOrders(prev => prev.map(o => (String(o.id) === String(orderId) || o.order_number === orderId) ? { ...o, driver_id: driverId, status: driverId ? 'out_for_delivery' : o.status } : o));
    if (selectedOrder && (String(selectedOrder.id) === String(orderId) || selectedOrder.order_number === orderId)) {
      setSelectedOrder(prev => ({ ...prev, driver_id: driverId, status: driverId ? 'out_for_delivery' : prev.status }));
    }
    try {
      await assignDriverToOrder(orderId, driverId);
    } catch (err) {
      console.warn('handleAssignDriver error:', err);
    }
    showToast(lang === 'de' ? `${t.orders.assignedDriver} aktualisiert` : `${t.orders.assignedDriver} updated`);
  };

  // Delete Individual Order
  const handleDeleteOrder = async (orderId, orderNum) => {
    const confirmMsg = lang === 'de'
      ? `Bestellung #${orderNum || orderId} wirklich endgültig löschen?`
      : `Are you sure you want to permanently delete order #${orderNum || orderId}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setOrders(prev => prev.filter(o => String(o.id) !== String(orderId) && o.order_number !== orderId));
      if (selectedOrder && (String(selectedOrder.id) === String(orderId) || selectedOrder.order_number === orderId)) {
        setSelectedOrder(null);
      }
      await deleteOrder(orderId);
      showToast(lang === 'de' ? `Bestellung #${orderNum || orderId} gelöscht` : `Order #${orderNum || orderId} deleted`, 'success');
    } catch (err) {
      console.error('Delete order failed:', err);
      showToast(lang === 'de' ? 'Fehler beim Löschen der Bestellung' : 'Failed to delete order', 'error');
    }
  };

  // Clear Entire Order History / All Test Orders
  const handleClearOrderHistory = async () => {
    const confirmMsg = lang === 'de'
      ? 'Möchten Sie die gesamte Bestellhistorie wirklich löschen? Alle Testbestellungen werden bereinigt, um von vorne zu beginnen.'
      : 'Are you sure you want to delete all order history? All test orders will be cleaned to start from fresh.';
    if (!window.confirm(confirmMsg)) return;

    try {
      setOrders([]);
      setSelectedOrder(null);
      await clearAllOrders();
      showToast(lang === 'de' ? 'Bestellhistorie erfolgreich bereinigt!' : 'Order history cleared successfully!', 'success');
    } catch (err) {
      console.error('Clear order history failed:', err);
      showToast(lang === 'de' ? 'Fehler beim Bereinigen der Bestellhistorie' : 'Failed to clear order history', 'error');
    }
  };

  // Payment Status & Gateway Test Simulation
  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus, newPaymentMethod, newPaymentId = null) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          payment_status: newPaymentStatus,
          payment_method: newPaymentMethod || o.payment_method || 'stripe',
          payment_id: newPaymentId || o.payment_id || `txn_${Date.now()}`
        };
      }
      return o;
    }));

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({
        ...prev,
        payment_status: newPaymentStatus,
        payment_method: newPaymentMethod || prev.payment_method || 'stripe',
        payment_id: newPaymentId || prev.payment_id || `txn_${Date.now()}`
      }));
    }

    showToast(lang === 'de' ? `Zahlung aktualisiert: ${newPaymentStatus.toUpperCase()}` : `Payment updated: ${newPaymentStatus.toUpperCase()}`);
  };

  // Thermal Printer Status & Manual/Automatic Print Execution (Zjiang ZJ-8330-L)
  const checkPrinterStatus = async () => {
    try {
      const res = await getPrinterStatus();
      setPrinterStatus(res);
    } catch (_) {}
  };

  useEffect(() => {
    checkPrinterStatus();
    const pInterval = setInterval(checkPrinterStatus, 8000);
    return () => clearInterval(pInterval);
  }, []);

  const handlePrintThermalReceipt = async (order, force = true) => {
    if (!order) return;
    const orderKey = order.id || order.order_number;
    setPrintingOrderId(orderKey);
    try {
      showToast(lang === 'de'
        ? `🖨️ Bon für #${order.order_number || order.id} wird gesendet...`
        : `🖨️ Sending receipt #${order.order_number || order.id} to thermal printer...`, 'info');

      // Ensure full order items are loaded
      let completeOrder = order;
      if (!completeOrder.order_items || completeOrder.order_items.length === 0) {
        if (supabase) {
          try {
            const { data: dbItems } = await supabase.from('order_items').select('*').eq('order_id', order.id);
            if (dbItems && dbItems.length > 0) {
              completeOrder = { ...order, order_items: dbItems };
            }
          } catch (_) {}
        }
      }

      const res = await printOrderThermal(completeOrder, { force });
      if (res && (res.success || res.printed)) {
        setPrintedOrderIds(prev => new Set([...prev, order.id, order.order_number]));
        showToast(lang === 'de'
          ? `✓ Bon für #${order.order_number || order.id} erfolgreich gedruckt!`
          : `✓ Receipt for #${order.order_number || order.id} printed!`, 'success');
      } else if (res && res.reason === 'already_printed') {
        showToast(lang === 'de'
          ? `Bestellung #${order.order_number} wurde bereits gedruckt.`
          : `Order #${order.order_number} already printed.`, 'info');
      } else {
        throw new Error(res?.error || 'Druck fehlgeschlagen');
      }
    } catch (err) {
      console.error('Thermal print error:', err);
      showToast(`⚠️ Druckerfehler: ${err.message}`, 'error');
    } finally {
      setPrintingOrderId(null);
    }
  };

  // Menu Stock Toggle - Instant Zero Delay Live Update
  const handleToggleStock = (itemId, currentVal) => {
    const newVal = !currentVal;
    recentLocalUpdatesRef.current.set(String(itemId), Date.now());

    setMenuItems(prev => prev.map(item => String(item.id) === String(itemId) ? { ...item, is_in_stock: newVal } : item));
    notifyMenuUpdated();
    showToast(
      newVal
        ? (lang === 'de' ? 'Auf Lager gesetzt' : 'Marked In Stock')
        : (lang === 'de' ? 'Als Ausverkauft markiert' : 'Marked Out of Stock'),
      newVal ? 'success' : 'error'
    );
    if (isConnected) {
      updateMenuItemStock(itemId, newVal).catch(err => console.error('Error updating stock in Supabase:', err));
    }
  };

  // Menu Prep Time Change - Instant Zero Delay Live Update
  const handleItemPrepTimeChange = (itemId, newTime) => {
    const validTime = Math.max(5, parseInt(newTime, 10) || 20);
    recentLocalUpdatesRef.current.set(String(itemId), Date.now());

    setMenuItems(prev => prev.map(item =>
      String(item.id) === String(itemId)
        ? { ...item, preparation_time_minutes: validTime }
        : item
    ));

    notifyMenuUpdated();
    showToast(lang === 'de' ? `Zubereitungszeit: ${validTime} Min.` : `Prep time: ${validTime} min.`, 'info');

    if (isConnected) {
      updateMenuItemPrepTime(itemId, validTime).catch(err => console.error('Error updating prep time in Supabase:', err));
    }
  };

  // Open Edit Item Form
  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    const unitPrice = typeof item.price === 'number'
      ? item.price
      : (item.prices?.single || item.prices?.small || 9.00);

    const categoryId = getItemCanonicalCategory(item);
    const isCalzone = categoryId === 'calzone' || !!(item.calzone_sizes ?? item.calzoneSizes);
    const isPizza = categoryId === 'pizzen' || categoryId === 'pizza' || !!(item.sizes_available ?? item.sizesAvailable);
    const hasSizes = !!(item.prices && (item.prices.small !== undefined || item.prices.large !== undefined)) || isPizza || isCalzone;

    // Build sizes_config with exact prices from item.prices or unitPrice
    const smallPrice = item.prices?.small !== undefined ? item.prices.small : unitPrice;
    const largePrice = item.prices?.large !== undefined ? item.prices.large : Number((unitPrice * (isCalzone ? 1.18 : 1.20)).toFixed(2));
    const familyPrice = item.prices?.family !== undefined ? item.prices.family : Number((unitPrice * 2.067).toFixed(2));
    const partyPrice = item.prices?.party !== undefined ? item.prices.party : Number((unitPrice * 2.522).toFixed(2));

    const smallEnabled = item.prices ? (item.prices.small !== undefined && item.prices.small !== null) : (isPizza || isCalzone);
    const largeEnabled = item.prices ? (item.prices.large !== undefined && item.prices.large !== null) : (isPizza || isCalzone);
    const familyEnabled = item.prices ? (item.prices.family !== undefined && item.prices.family !== null) : (isPizza && !isCalzone);
    const partyEnabled = item.prices ? (item.prices.party !== undefined && item.prices.party !== null) : (isPizza && !isCalzone);

    const sizes_config = {
      small: {
        enabled: smallEnabled,
        price: smallPrice !== undefined && smallPrice !== null ? String(smallPrice) : '9.00',
        name: 'Klein',
        dim: 'Ø 26 cm'
      },
      large: {
        enabled: largeEnabled,
        price: largePrice !== undefined && largePrice !== null ? String(largePrice) : '11.00',
        name: 'Groß',
        dim: 'Ø 30 cm'
      },
      family: {
        enabled: isCalzone ? false : familyEnabled,
        price: familyPrice !== undefined && familyPrice !== null ? String(familyPrice) : '18.50',
        name: 'Familie',
        dim: '33 × 46 cm'
      },
      party: {
        enabled: isCalzone ? false : partyEnabled,
        price: partyPrice !== undefined && partyPrice !== null ? String(partyPrice) : '22.50',
        name: 'Party',
        dim: '40 × 60 cm'
      }
    };

    setDishForm({
      id: item.id,
      number: item.number || '',
      category_id: categoryId,
      name: item.name_de || item.name || '',
      desc: item.desc_de || item.desc || '',
      toppings: item.toppings_de || item.toppings || '',
      image_url: (item.image_url && (item.image_url.startsWith('http') || item.image_url.startsWith('/images/dishes/'))) ? item.image_url : (item.images?.[0] || ''),
      images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []),
      price: unitPrice,
      has_sizes: hasSizes,
      sizes_config,
      custom_sizes: Array.isArray(item.custom_sizes)
        ? item.custom_sizes
        : (Array.isArray(item.prices?.custom_sizes) ? item.prices.custom_sizes : []),
      supports_american: !!(item.supports_american ?? item.supportsAmerican),
      badge: item.badge || '',
      dietary: Array.isArray(item.dietary) ? item.dietary : [],
      allowed_toppings: Array.isArray(item.allowed_toppings)
        ? item.allowed_toppings
        : (Array.isArray(item.prices?.allowed_toppings)
            ? item.prices.allowed_toppings
            : pizzaExtraToppingsList.map(t => t.id)),
      custom_toppings: Array.isArray(item.custom_toppings)
        ? item.custom_toppings
        : (Array.isArray(item.prices?.custom_toppings) ? item.prices.custom_toppings : []),
      preparation_time_minutes: item.preparation_time_minutes || 20,
      is_in_stock: item.is_in_stock !== false
    });
    setActiveTab('addItem');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Set an image from the list as the primary cover image
  const handleSetPrimaryImage = (imgUrl) => {
    setDishForm(prev => {
      const curList = Array.isArray(prev.images) ? [...prev.images] : [];
      const rest = curList.filter(u => u !== imgUrl);
      const reordered = [imgUrl, ...rest];
      return {
        ...prev,
        image_url: imgUrl,
        images: reordered
      };
    });
    showToast(lang === 'de' ? 'Als Hauptbild gesetzt' : 'Set as primary photo', 'info');
  };

  // Remove a photo from the dish images list
  const handleRemoveImage = (imgUrlToRemove) => {
    setDishForm(prev => {
      const curList = Array.isArray(prev.images) ? [...prev.images] : [];
      const updated = curList.filter(u => u !== imgUrlToRemove);
      return {
        ...prev,
        image_url: prev.image_url === imgUrlToRemove ? (updated[0] || '') : prev.image_url,
        images: updated
      };
    });
  };

  // Handle Multiple or Single Image File Upload (Uploads directly to Supabase Storage only & syncs live)
  const handleMultipleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingDishImage(true);
    showToast(
      lang === 'de'
        ? `${files.length} ${files.length === 1 ? 'Bild wird' : 'Bilder werden'} in Supabase Storage hochgeladen...`
        : `Uploading ${files.length} photo(s) to Supabase Storage...`,
      'info'
    );

    try {
      // 1. Determine accurate dish ID even if editingItem is null or user entered by number/name
      let dishIdentifier = editingItem?.id || dishForm.id;
      if (!dishIdentifier || dishIdentifier === 'dish' || dishIdentifier.startsWith('new-')) {
        const num = String(dishForm.number || '').trim();
        const cat = String(dishForm.category_id || '').toLowerCase();
        if (num) {
          const match = menuItems.find(m => String(m.number).trim() === num && (cat ? String(m.category_id || m.category).toLowerCase().includes(cat) : true));
          if (match) {
            dishIdentifier = match.id;
          } else if (num === '1') {
            dishIdentifier = 'pizza-1';
          } else if (cat.includes('pizza') || cat === 'pizzen') {
            dishIdentifier = `pizza-${num}`;
          } else if (cat === 'deals') {
            dishIdentifier = num.startsWith('A') ? num : `A${num}`;
          }
        }
        if (!dishIdentifier && dishForm.name) {
          const nameMatch = menuItems.find(m => (m.name_de || m.name || '').toLowerCase() === dishForm.name.toLowerCase());
          if (nameMatch) dishIdentifier = nameMatch.id;
        }
      }

      const res = await uploadMultipleDishImages(files, dishIdentifier || 'dish');

      if (res && res.success && res.urls && res.urls.length > 0) {
        const newUrls = res.urls;
        const currentList = Array.isArray(dishForm.images) ? [...dishForm.images] : (dishForm.image_url ? [dishForm.image_url] : []);
        // Combine without duplicates
        const combined = Array.from(new Set([...currentList, ...newUrls]));
        const primaryImage = combined[0] || newUrls[0] || '';

        setDishForm(prev => ({
          ...prev,
          image_url: primaryImage,
          images: combined,
          id: dishIdentifier || prev.id
        }));

        // Directly persist to Supabase PostgreSQL database if we have a concrete dish ID
        if (isConnected && dishIdentifier && dishIdentifier !== 'dish' && !dishIdentifier.startsWith('new-')) {
          try {
            const currentItem = menuItems.find(m => m.id === dishIdentifier);
            const currentPrices = (currentItem?.prices && typeof currentItem.prices === 'object') ? { ...currentItem.prices } : {};
            await supabase
              .from('menu_items')
              .update({
                image_url: primaryImage,
                prices: { ...currentPrices, images: combined },
                updated_at: new Date().toISOString()
              })
              .eq('id', dishIdentifier);
            console.log(`[AdminPanel] Explicitly saved multiple images for ${dishIdentifier} to Supabase!`);
          } catch (upErr) {
            console.warn('[AdminPanel] Immediate save error:', upErr);
          }
        }

        // Immediately reflect in AdminPanel menuItems list
        if (dishIdentifier && dishIdentifier !== 'dish') {
          setMenuItems(prev => prev.map(item => (
            item.id === dishIdentifier
              ? { ...item, image_url: primaryImage, image: primaryImage, images: combined, has_custom_image: true }
              : item
          )));
          if (editingItem) {
            setEditingItem(prev => ({ ...prev, image_url: primaryImage, image: primaryImage, images: combined, has_custom_image: true }));
          }
        }

        // Trigger instant global sync across customer frontend
        notifyMenuUpdated();

        showToast(
          lang === 'de'
            ? `${newUrls.length} ${newUrls.length === 1 ? 'Bild' : 'Bilder'} erfolgreich in Supabase Storage hochgeladen & gespeichert!`
            : `${newUrls.length} image(s) saved to Supabase Storage!`,
          'success'
        );
      } else {
        showToast(res?.errors?.join(', ') || 'Fehler beim Hochladen', 'error');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Upload-Fehler: ' + (err?.message || 'Unbekannt'), 'error');
    } finally {
      setIsUploadingDishImage(false);
      try {
        if (e.target) e.target.value = '';
      } catch (err) {}
    }
  };

  const handleImageFileUpload = handleMultipleImageUpload;

  // Save Dish (Add or Edit)
  const handleSaveDish = async (e) => {
    e.preventDefault();
    // Resolve dish ID robustly so existing dishes (like Nr. 1 Margherita) are always updated
    let id = editingItem ? editingItem.id : dishForm.id;
    if (!id || id === 'dish' || id.startsWith('new-')) {
      const num = String(dishForm.number || '').trim();
      const cat = String(dishForm.category_id || '').toLowerCase();
      if (num) {
        const match = menuItems.find(m => String(m.number).trim() === num && (cat ? String(m.category_id || m.category).toLowerCase().includes(cat) : true));
        if (match) id = match.id;
        else if (num === '1') id = 'pizza-1';
        else if (cat.includes('pizza') || cat === 'pizzen') id = `pizza-${num}`;
        else if (cat === 'deals') id = num.startsWith('A') ? num : `A${num}`;
      }
      if (!id && dishForm.name) {
        const nameMatch = menuItems.find(m => (m.name_de || m.name || '').toLowerCase() === dishForm.name.toLowerCase());
        if (nameMatch) id = nameMatch.id;
      }
    }
    if (!id) {
      id = `dish-${Date.now()}`;
    }
    const numPrice = parseFloat(dishForm.price) || 9.00;

    let prices = {};
    let firstEnabledPrice = null;
    let anySizeEnabled = false;

    if (dishForm.has_sizes) {
      const isCalzone = dishForm.category_id === 'calzone';
      const sizeKeys = isCalzone ? ['small', 'large'] : ['small', 'large', 'family', 'party'];

      sizeKeys.forEach(key => {
        const conf = dishForm.sizes_config?.[key];
        if (conf && conf.enabled) {
          anySizeEnabled = true;
          const p = parseFloat(conf.price);
          if (!isNaN(p) && p > 0) {
            prices[key] = Number(p.toFixed(2));
            if (firstEnabledPrice === null) {
              firstEnabledPrice = prices[key];
            }
          }
        }
      });

      if (firstEnabledPrice !== null) {
        prices.single = firstEnabledPrice;
      } else {
        prices = { single: numPrice };
        firstEnabledPrice = numPrice;
      }
    } else {
      prices = { single: numPrice };
      firstEnabledPrice = numPrice;
    }

    const customSizes = Array.isArray(dishForm.custom_sizes) ? dishForm.custom_sizes : [];
    const customToppings = Array.isArray(dishForm.custom_toppings) ? dishForm.custom_toppings : [];

    prices.allowed_toppings = Array.isArray(dishForm.allowed_toppings)
      ? dishForm.allowed_toppings
      : pizzaExtraToppingsList.map(t => t.id);
    prices.custom_sizes = customSizes;
    prices.custom_toppings = (!dishForm.allowed_toppings || dishForm.allowed_toppings.length === 0)
      ? []
      : customToppings.filter(ct => (dishForm.allowed_toppings || []).includes(ct.id));

    const cleanImages = Array.isArray(dishForm.images) && dishForm.images.length > 0
      ? dishForm.images.filter(Boolean)
      : (dishForm.image_url ? [dishForm.image_url] : []);
    const primaryImg = cleanImages[0] || dishForm.image_url || '';
    prices.images = cleanImages;

    const finalBasePrice = firstEnabledPrice !== null ? firstEnabledPrice : numPrice;
    const canonicalCat = getItemCanonicalCategory({ ...dishForm, id });
    const isCalzone = canonicalCat === 'calzone' || dishForm.category_id === 'calzone';
    const isDeal = canonicalCat === 'deals' || dishForm.category_id === 'deals' || id.startsWith('A') || id.startsWith('offer-');

    // Safe DB category_id mapping to respect foreign key constraint on categories(id) in Supabase
    const dbCategoryId = isDeal ? null : (
      dishForm.category_id === 'pizzen' ? 'pizza' :
      dishForm.category_id === 'gyros' ? 'doner' :
      dishForm.category_id === 'salate' ? 'salad' :
      dishForm.category_id === 'american-food' ? 'burger-snacks' :
      dishForm.category_id === 'getraenke' ? 'dessert-drinks' :
      dishForm.category_id === 'fleischgerichte' ? 'fleischgerichte' :
      (['pizza', 'calzone', 'pasta', 'doner', 'burger-snacks', 'salad', 'dessert-drinks', 'fleischgerichte', 'reisgerichte', 'indisch', 'lamm', 'steaks', 'mexikanisch', 'chinesisch', 'beilagen', 'toasts', 'omelette', 'auflaeufe', 'vegetarisch', 'grill-menue'].includes(dishForm.category_id)
        ? dishForm.category_id
        : (['pasta-al-forno', 'gnocchi'].includes(dishForm.category_id) ? 'pasta' : null))
    );

    prices.frontend_category = dishForm.category_id;

    const payload = {
      id,
      number: dishForm.number,
      category_id: dbCategoryId,
      name_de: dishForm.name,
      name_en: dishForm.name,
      desc_de: dishForm.desc,
      desc_en: dishForm.desc,
      toppings_de: dishForm.toppings,
      toppings_en: dishForm.toppings,
      image_url: primaryImg,
      badge: dishForm.badge,
      dietary: dishForm.dietary || [],
      sizes_available: dishForm.has_sizes && !isCalzone && anySizeEnabled,
      calzone_sizes: dishForm.has_sizes && isCalzone && anySizeEnabled,
      supports_american: !!dishForm.supports_american,
      prices,
      price: finalBasePrice,
      is_in_stock: dishForm.is_in_stock,
      preparation_time_minutes: parseInt(dishForm.preparation_time_minutes, 10) || 20
    };

    if (isConnected) {
      try {
        const res = await upsertMenuItem(payload);
        if (!res) {
          showToast(lang === 'de' ? 'Fehler beim Speichern in Supabase!' : 'Error saving to Supabase!', 'error');
          return;
        }
      } catch (err) {
        console.error('Supabase save error:', err);
        showToast(lang === 'de' ? `Fehler beim Speichern: ${err?.message || 'Verbindung fehlgeschlagen'}` : `Save error: ${err?.message || 'Connection failed'}`, 'error');
        return;
      }
    }

    const displayCategory = dishForm.category_id;
    const formattedItem = {
      ...payload,
      image: primaryImg,
      image_url: primaryImg,
      images: cleanImages,
      has_custom_image: true,
      category: displayCategory,
      category_id: displayCategory,
      frontend_category: displayCategory,
      allowed_toppings: prices.allowed_toppings,
      custom_sizes: customSizes,
      custom_toppings: customToppings
    };

    setMenuItems(prev => {
      const exists = prev.find(i => i.id === id);
      if (exists) {
        return prev.map(i => i.id === id ? { ...i, ...formattedItem } : i);
      }
      return [formattedItem, ...prev];
    });

    try {
      const savedOverrides = JSON.parse(localStorage.getItem('venezia_admin_dishes_override') || '{}');
      const effectiveImg = primaryImg || editingItem?.image_url || savedOverrides[id]?.image_url || '';
      savedOverrides[id] = {
        image: effectiveImg,
        image_url: effectiveImg,
        images: cleanImages,
        name: dishForm.name,
        name_de: dishForm.name,
        toppings: dishForm.toppings,
        toppings_de: dishForm.toppings,
        desc: dishForm.desc,
        desc_de: dishForm.desc,
        price: finalBasePrice,
        prices: prices,
        badge: dishForm.badge
      };
      localStorage.setItem('venezia_admin_dishes_override', JSON.stringify(savedOverrides));
    } catch (e) {}

    notifyMenuUpdated();
    // Stay on edit screen - do NOT redirect to menu
    setEditingItem(formattedItem);
    setDishForm(prev => ({
      ...prev,
      id: formattedItem.id,
      number: formattedItem.number || '',
      category_id: displayCategory,
      name: formattedItem.name_de || formattedItem.name || '',
      desc: formattedItem.desc_de || formattedItem.desc || '',
      toppings: formattedItem.toppings_de || formattedItem.toppings || '',
      image_url: formattedItem.image_url,
      price: formattedItem.price,
      badge: formattedItem.badge || '',
      dietary: formattedItem.dietary || [],
      allowed_toppings: formattedItem.allowed_toppings || [],
      custom_sizes: customSizes,
      custom_toppings: customToppings,
      preparation_time_minutes: formattedItem.preparation_time_minutes,
      is_in_stock: formattedItem.is_in_stock
    }));

    showToast(lang === 'de' ? 'Gericht erfolgreich aktualisiert!' : 'Dish updated successfully!', 'success');
  };

  // Delete Dish
  const handleDeleteDish = async (id) => {
    if (!window.confirm(t.menu.confirmDelete)) return;
    setMenuItems(prev => prev.filter(i => String(i.id) !== String(id)));
    if (isConnected) {
      await deleteMenuItem(id);
    }
    notifyMenuUpdated();
    showToast(lang === 'de' ? 'Gericht gelöscht' : 'Dish deleted', 'error');
  };

  // Add / Create Category
  const handleCreateCategory = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newCatName.trim()) {
      showToast(lang === 'de' ? 'Bitte geben Sie einen Kategorienamen ein' : 'Please enter a category name', 'error');
      return;
    }
    setIsSavingCategory(true);
    try {
      const created = await addCustomCategory({
        name: newCatName.trim(),
        sub: newCatSub.trim(),
        title: newCatTitle.trim() || `${newCatName.trim()} Spezialitäten`,
        icon: newCatIcon || '🍽️'
      });
      const fresh = await fetchCategoriesFromSupabase();
      setCategoriesList(fresh);
      setNewCatName('');
      setNewCatSub('');
      setNewCatTitle('');
      setNewCatIcon('🍽️');
      showToast(lang === 'de' ? `Kategorie „${created.name}“ erfolgreich erstellt!` : `Category "${created.name}" created successfully!`, 'success');
    } catch (err) {
      console.error('Error creating category:', err);
      showToast(lang === 'de' ? 'Fehler beim Erstellen der Kategorie' : 'Error creating category', 'error');
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId) => {
    const catObj = categoriesList.find(c => c.id === catId);
    const catName = catObj ? (catObj.name_de || catObj.name) : catId;
    const dishCount = getCatCount(catId);

    const confirmMsg = lang === 'de'
      ? `Möchten Sie die Kategorie „${catName}“ wirklich löschen? (${dishCount} Gerichte zugeordnet)`
      : `Are you sure you want to delete category "${catName}"? (${dishCount} dishes assigned)`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteCategory(catId);
      const fresh = await fetchCategoriesFromSupabase();
      setCategoriesList(fresh);
      if (selectedCategoryTab === catId) {
        setSelectedCategoryTab('all');
      }
      showToast(lang === 'de' ? `Kategorie „${catName}“ gelöscht!` : `Category "${catName}" deleted!`, 'error');
    } catch (err) {
      console.error('Error deleting category:', err);
      showToast(lang === 'de' ? 'Fehler beim Löschen' : 'Delete failed', 'error');
    }
  };

  // Add Driver
  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!newDriver.name) return;
    const driverObj = {
      id: `driver-${Date.now()}`,
      name: newDriver.name,
      phone: newDriver.phone,
      vehicle_type: newDriver.vehicle_type,
      current_status: 'available',
      is_active: true
    };

    if (isConnected) {
      await addDriver(driverObj);
    }
    setDrivers(prev => [...prev, driverObj]);
    setNewDriver({ name: '', phone: '', vehicle_type: 'Auto' });
    showToast(lang === 'de' ? 'Fahrer hinzugefügt!' : 'Driver added!');
  };

  // Filtered lists
  const filteredOrders = orders.filter(o => {
    // 1. Tab filter: active orders vs history vs all
    if (ordersTab === 'active') {
      const isActive = o.status === 'new' || o.status === 'preparing' || o.status === 'out_for_delivery';
      if (!isActive) return false;
    } else if (ordersTab === 'history') {
      const isHistory = o.status === 'delivered' || o.status === 'cancelled';
      if (!isHistory) return false;
    }

    // 2. Status pill filter
    if (orderFilter !== 'all') {
      if (o.status !== orderFilter) return false;
    }

    // 3. Search query
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchNum = (o.order_number || o.id || '').toLowerCase().includes(q);
      const matchName = (o.customer_name || '').toLowerCase().includes(q);
      const matchPhone = (o.customer_phone || '').toLowerCase().includes(q);
      const matchStreet = (o.street || '').toLowerCase().includes(q);
      const matchNote = (o.note || '').toLowerCase().includes(q);
      const matchPayment = (o.payment_method || '').toLowerCase().includes(q) || (o.payment_id || '').toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone && !matchStreet && !matchNote && !matchPayment) return false;
    }

    return true;
  });

  const filteredMenuItems = menuItems.filter(item => {
    const itemCat = getItemCanonicalCategory(item);
    const matchesCat = selectedCategoryTab === 'all' || itemCat === selectedCategoryTab;
    const matchesSearch =
      (item.name_de || item.name || '').toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.name_en || '').toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.number || '').toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.toppings_de || item.toppings || '').toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate items per category count
  const getCatCount = (catId) => {
    if (catId === 'all') return menuItems.length;
    return menuItems.filter(item => getItemCanonicalCategory(item) === catId).length;
  };

  // 1. Loading state while verifying Supabase session
  if (isCheckingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#0f172a',
          gap: '16px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        {/* Top Italian Ribbon */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: 'linear-gradient(to right, #008c45 33.3%, #ffffff 33.3%, #ffffff 66.6%, #cd212a 66.6%)'
          }}
        />
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#fff1f2',
            color: '#e30613',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(227, 6, 19, 0.15)'
          }}
        >
          <RefreshCw size={26} className="spin" color="#e30613" />
        </div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#334155' }}>
          Venezia Admin-Portal • Authentifizierung wird überprüft...
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: render secure Supabase Admin Login
  if (!adminUser) {
    return (
      <AdminLogin
        onLoginSuccess={(user) => {
          setAdminUser(user);
          showToast(lang === 'de' ? 'Willkommen im Admin Portal!' : 'Welcome to the Admin Portal!', 'success');
        }}
        onBackToStore={onBackToStore}
      />
    );
  }

  return (
    <div
      className={`admin-portal theme-${adminTheme}`}
      style={{
        minHeight: '100vh',
        background: isLight ? '#ffffff' : 'radial-gradient(ellipse at top left, #0e1726 0%, #070b14 60%, #05080e 100%)',
        color: isLight ? '#0f172a' : '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <style>{`
        /* ========================================================= */
        /* VENEZIA ADMIN PORTAL THEME SYSTEM                         */
        /* ========================================================= */

        .admin-portal {
          min-height: 100vh;
          transition: background 0.2s ease, color 0.2s ease;
        }

        /* --------------------------------------------------------- */
        /* 1. LIGHT MODE: Pure White Backdrop & Frosted Glassmorphism*/
        /* --------------------------------------------------------- */
        .admin-portal.theme-light {
          background-color: #ffffff !important;
          background-image: none !important;
          color: #0f172a !important;
        }

        /* Header: Frosted Glass */
        .admin-portal.theme-light header {
          background: rgba(255, 255, 255, 0.94) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-bottom: 1px solid #e2e8f0 !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04) !important;
        }
        .admin-portal.theme-light header h1 {
          color: #0f172a !important;
        }
        .admin-portal.theme-light header p {
          color: #64748b !important;
        }

        /* Navigation: Crisp White Glass */
        .admin-portal.theme-light nav {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .admin-portal.theme-light nav button {
          color: #475569 !important;
          font-weight: 600 !important;
        }
        .admin-portal.theme-light nav button:hover {
          color: #0f172a !important;
          background: rgba(0, 0, 0, 0.03) !important;
        }
        .admin-portal.theme-light nav button.nav-active {
          color: #e11d48 !important;
          font-weight: 800 !important;
          border-bottom: 3px solid #e11d48 !important;
        }
        .admin-portal.theme-light nav button.nav-active span:not(.nav-badge) {
          color: #e11d48 !important;
        }
        .admin-portal.theme-light nav button.nav-active .nav-badge {
          background: #e11d48 !important;
          color: #ffffff !important;
        }
        .admin-portal.theme-light nav button:not(.nav-active) .nav-badge {
          background: #f1f5f9 !important;
          color: #475569 !important;
          border: 1px solid #cbd5e1 !important;
        }

        /* High-End Frosted Glass Cards (No Skyblue Tints) */
        .admin-portal.theme-light .admin-card,
        .admin-portal.theme-light div[style*="#131b2e"],
        .admin-portal.theme-light div[style*="19, 27, 46"] {
          background: rgba(255, 255, 255, 0.88) !important;
          backdrop-filter: blur(20px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
          border: 1px solid rgba(226, 232, 240, 0.95) !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 1) !important;
          color: #0f172a !important;
        }

        /* Sub-cards and nested containers */
        .admin-portal.theme-light .admin-sub-card,
        .admin-portal.theme-light div[style*="#0b0f19"],
        .admin-portal.theme-light div[style*="11, 15, 25"] {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          color: #0f172a !important;
        }

        /* Secondary containers (Replacing #1e293b) */
        .admin-portal.theme-light div[style*="#1e293b"]:not(button):not([style*="background: #e11d48"]):not([style*="background: rgb(225, 29, 72)"]):not([style*="background: #0284c7"]):not([style*="background: rgb(2, 132, 199)"]),
        .admin-portal.theme-light div[style*="30, 41, 59"]:not(button):not([style*="background: #e11d48"]):not([style*="background: rgb(225, 29, 72)"]):not([style*="background: #0284c7"]):not([style*="background: rgb(2, 132, 199)"]) {
          background: #f1f5f9 !important;
          border: 1px solid #e2e8f0 !important;
          color: #1e293b !important;
        }

        /* Inputs, Selects, Textareas: Clean White with Slate Border */
        .admin-portal.theme-light input:not([type="checkbox"]):not([type="radio"]),
        .admin-portal.theme-light select,
        .admin-portal.theme-light textarea {
          background: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
        }
        .admin-portal.theme-light input::placeholder,
        .admin-portal.theme-light textarea::placeholder {
          color: #94a3b8 !important;
        }
        .admin-portal.theme-light input:focus,
        .admin-portal.theme-light select:focus,
        .admin-portal.theme-light textarea:focus {
          border-color: #0f172a !important;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08) !important;
          outline: none !important;
        }

        /* ALL HEADINGS AND TITLES: Ultra-Crisp Slate 900 */
        .admin-portal.theme-light h1,
        .admin-portal.theme-light h2,
        .admin-portal.theme-light h3,
        .admin-portal.theme-light h4,
        .admin-portal.theme-light h5,
        .admin-portal.theme-light h6 {
          color: #0f172a !important;
        }

        .admin-portal.theme-light p {
          color: #475569 !important;
        }

        .admin-portal.theme-light label {
          color: #0f172a !important;
          font-weight: 600 !important;
        }

        /* Text colors inside light portal */
        .admin-portal.theme-light span[style*="color: rgb(248, 250, 252)"],
        .admin-portal.theme-light span[style*="color: #f8fafc"],
        .admin-portal.theme-light strong[style*="color: rgb(248, 250, 252)"],
        .admin-portal.theme-light strong[style*="color: #f8fafc"] {
          color: #0f172a !important;
        }

        /* Secondary text */
        .admin-portal.theme-light span[style*="#cbd5e1"],
        .admin-portal.theme-light span[style*="203, 213, 225"],
        .admin-portal.theme-light div[style*="#cbd5e1"],
        .admin-portal.theme-light div[style*="203, 213, 225"] {
          color: #334155 !important;
        }

        .admin-portal.theme-light span[style*="#94a3b8"],
        .admin-portal.theme-light span[style*="148, 163, 184"],
        .admin-portal.theme-light p[style*="#94a3b8"],
        .admin-portal.theme-light p[style*="148, 163, 184"] {
          color: #475569 !important;
        }

        /* High-contrast colors in light mode */
        .admin-portal.theme-light strong[style*="#4ade80"],
        .admin-portal.theme-light span[style*="#4ade80"],
        .admin-portal.theme-light strong[style*="74, 222, 128"],
        .admin-portal.theme-light span[style*="74, 222, 128"] {
          color: #16a34a !important;
        }

        .admin-portal.theme-light a[style*="#38bdf8"],
        .admin-portal.theme-light a[style*="56, 189, 248"] {
          color: #0284c7 !important;
        }

        /* Category badge and text pill styling */
        .admin-portal.theme-light .dish-category-badge {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          border: 1px solid #93c5fd !important;
          font-weight: 800 !important;
        }

        /* Secondary neutral buttons in Light Mode */
        .admin-portal.theme-light button[style*="background: #1e293b"],
        .admin-portal.theme-light button[style*="background:#1e293b"] {
          background: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
        }

        /* PRESERVE WHITE TEXT ONLY ON BUTTONS WITH SOLID COLOR BACKGROUNDS */
        .admin-portal.theme-light button[style*="background: #e11d48"],
        .admin-portal.theme-light button[style*="background:#e11d48"],
        .admin-portal.theme-light button[style*="background: rgb(225, 29, 72)"],
        .admin-portal.theme-light button[style*="background: #0284c7"],
        .admin-portal.theme-light button[style*="background:#0284c7"],
        .admin-portal.theme-light button[style*="background: rgb(2, 132, 199)"],
        .admin-portal.theme-light button[style*="background: #10b981"],
        .admin-portal.theme-light button[style*="background:#10b981"],
        .admin-portal.theme-light button[style*="background: rgb(16, 185, 129)"],
        .admin-portal.theme-light button[style*="background: #ef4444"],
        .admin-portal.theme-light button[style*="background:#ef4444"],
        .admin-portal.theme-light button[style*="background: #065f46"],
        .admin-portal.theme-light button[style*="background:#065f46"],
        .admin-portal.theme-light button[style*="background: #dc2626"],
        .admin-portal.theme-light button[style*="background:#dc2626"],
        .admin-portal.theme-light button[style*="background: #0f172a"],
        .admin-portal.theme-light button[style*="background:#0f172a"],
        .admin-portal.theme-light button[style*="background: rgb(15, 23, 42)"] {
          color: #ffffff !important;
        }

        .admin-portal.theme-light button[style*="background: #0284c7"],
        .admin-portal.theme-light button[style*="background:#0284c7"],
        .admin-portal.theme-light button[style*="background: rgb(2, 132, 199)"] {
          background: #0284c7 !important;
          color: #ffffff !important;
        }

        .admin-portal.theme-light button[style*="background: #0f172a"],
        .admin-portal.theme-light button[style*="background:#0f172a"],
        .admin-portal.theme-light button[style*="background: rgb(15, 23, 42)"] {
          background: #0f172a !important;
          color: #ffffff !important;
        }

        .admin-portal.theme-light button[style*="background: #e11d48"] *,
        .admin-portal.theme-light button[style*="background:#e11d48"] *,
        .admin-portal.theme-light button[style*="background: #0284c7"] *,
        .admin-portal.theme-light button[style*="background:#0284c7"] *,
        .admin-portal.theme-light button[style*="background: #10b981"] *,
        .admin-portal.theme-light button[style*="background:#10b981"] *,
        .admin-portal.theme-light button[style*="background: #0f172a"] * {
          color: #ffffff !important;
        }

        /* --------------------------------------------------------- */
        /* 2. DARK MODE: Refined Glassmorphism Cards                 */
        /* --------------------------------------------------------- */
        .admin-portal.theme-dark {
          background-color: #0b0f19 !important;
          background-image: radial-gradient(ellipse at top left, #0e1726 0%, #070b14 60%, #05080e 100%) !important;
          background-attachment: fixed !important;
          color: #f8fafc !important;
        }

        .admin-portal.theme-dark header {
          background: rgba(19, 27, 46, 0.88) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-bottom: 1px solid rgba(56, 189, 248, 0.12) !important;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4) !important;
        }

        .admin-portal.theme-dark nav {
          background: rgba(19, 27, 46, 0.82) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border-bottom: 1px solid rgba(56, 189, 248, 0.12) !important;
        }

        .admin-portal.theme-dark div[style*="#131b2e"],
        .admin-portal.theme-dark div[style*="19, 27, 46"],
        .admin-portal.theme-dark .admin-card {
          background: rgba(19, 27, 46, 0.82) !important;
          backdrop-filter: blur(14px) !important;
          -webkit-backdrop-filter: blur(14px) !important;
          border-color: rgba(56, 189, 248, 0.12) !important;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.45) !important;
        }

        .admin-portal.theme-dark div[style*="#0b0f19"],
        .admin-portal.theme-dark div[style*="11, 15, 25"],
        .admin-portal.theme-dark .admin-sub-card {
          background: rgba(11, 15, 25, 0.82) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          border-color: rgba(51, 65, 85, 0.5) !important;
        }

        .admin-portal.theme-dark input:not([type="checkbox"]):not([type="radio"]),
        .admin-portal.theme-dark select,
        .admin-portal.theme-dark textarea {
          background: rgba(11, 15, 25, 0.85) !important;
          color: #f8fafc !important;
          border-color: #334155 !important;
        }
        .admin-portal.theme-dark input:focus,
        .admin-portal.theme-dark select:focus,
        .admin-portal.theme-dark textarea:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15) !important;
          outline: none !important;
        }

        /* --------------------------------------------------------- */
        /* 3. MOBILE & TABLET RESPONSIVENESS SYSTEM                  */
        /* --------------------------------------------------------- */
        .admin-portal {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .admin-portal *, .admin-portal *::before, .admin-portal *::after {
          box-sizing: border-box !important;
        }
        .admin-main-content {
          box-sizing: border-box !important;
          width: 100% !important;
        }

        @media (max-width: 1024px) {
          .admin-studio-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .admin-studio-preview-col {
            position: static !important;
            top: auto !important;
            order: 2 !important;
            width: 100% !important;
          }
        }

        /* Desktop & Mobile visibility utilities */
        .back-btn-text-mobile {
          display: none;
        }
        .back-btn-text-full {
          display: inline;
        }
        .admin-theme-toggle-desktop {
          display: flex;
        }
        .admin-theme-toggle-mobile {
          display: none !important;
        }
        .logout-text-desktop {
          display: inline;
        }
        .back-btn-text-mobile {
          display: none;
        }
        .back-btn-text-full {
          display: inline;
        }
        .theme-text-desktop {
          display: inline;
        }
        .switcher-label-mobile {
          display: none;
        }
        .switcher-label-desktop {
          display: inline;
        }
        .admin-live-badge-desktop {
          display: inline-flex;
        }
        .admin-live-dot-mobile {
          display: none !important;
        }
        .admin-header-desktop {
          display: flex !important;
          padding: 16px 48px !important;
        }
        .admin-header-mobile {
          display: none !important;
        }
        .admin-main-nav {
          padding: 0 48px !important;
        }
        .admin-main-content {
          padding: 24px 48px !important;
        }

        @media (max-width: 1200px) and (min-width: 769px) {
          .admin-header-desktop {
            padding: 16px 32px !important;
          }
          .admin-main-nav {
            padding: 0 32px !important;
          }
          .admin-main-content {
            padding: 22px 32px !important;
          }
        }

        @media (max-width: 768px) {
          .admin-header-desktop {
            display: none !important;
          }
          .admin-header-mobile {
            display: flex !important;
          }
          .admin-top-header {
            padding: 12px 16px !important;
            gap: 10px !important;
          }
          .admin-header-line-1 {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid rgba(148, 163, 184, 0.18) !important;
          }
          .admin-header-line-1 h1 {
            font-size: 15px !important;
          }
          .admin-header-logout-btn {
            padding: 6px 12px !important;
            font-size: 12px !important;
            gap: 6px !important;
          }
          .admin-header-line-2 {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            gap: 10px !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid rgba(148, 163, 184, 0.15) !important;
          }
          .back-btn-text-full {
            display: none !important;
          }
          .back-btn-text-mobile {
            display: inline !important;
          }
          .admin-header-back-btn {
            padding: 6px 12px !important;
            font-size: 12px !important;
            gap: 6px !important;
          }
          .admin-header-tools {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }
          .theme-text-desktop {
            display: none !important;
          }
          .admin-header-line-3 {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            gap: 10px !important;
            padding-top: 2px !important;
          }
          .admin-shop-status-pill {
            padding: 5px 10px !important;
            max-width: none !important;
            gap: 8px !important;
          }
          .admin-shop-status-pill span:first-of-type {
            font-size: 10.5px !important;
          }
          .admin-email-text {
            max-width: 95px !important;
            font-size: 11px !important;
          }
          .admin-user-badge {
            padding: 5px 10px !important;
            gap: 6px !important;
          }
          .admin-main-nav {
            padding: 0 10px !important;
            gap: 4px !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .admin-main-nav button {
            padding: 10px 10px !important;
            font-size: 12.5px !important;
            flex: 1 1 auto !important;
            justify-content: center !important;
          }
          .admin-main-content {
            padding: 12px 10px !important;
          }
          .admin-order-alert-banner {
            padding: 12px 14px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .admin-order-alert-banner button {
            width: 100% !important;
            justify-content: center !important;
          }
          .admin-orders-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .switcher-label-desktop {
            display: none !important;
          }
          .switcher-label-mobile {
            display: inline !important;
            font-weight: 800 !important;
          }
          .admin-order-view-switcher {
            width: 100% !important;
            display: flex !important;
            padding: 3px !important;
            gap: 3px !important;
          }
          .admin-order-view-switcher button {
            flex: 1 1 0 !important;
            min-width: 0 !important;
            padding: 7px 4px !important;
            font-size: 11px !important;
            justify-content: center !important;
            gap: 3px !important;
            white-space: nowrap !important;
          }
          .admin-order-view-switcher .switcher-icon {
            width: 13px !important;
            height: 13px !important;
            flex-shrink: 0 !important;
          }
          .admin-order-view-switcher .switcher-badge {
            flex-shrink: 0 !important;
            padding: 1px 4px !important;
            font-size: 10px !important;
            min-width: 16px !important;
            text-align: center !important;
          }
          .admin-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 14px !important;
          }
          .admin-metrics-grid > div {
            padding: 11px 12px !important;
          }
          .admin-metrics-grid > div > div {
            font-size: 18px !important;
          }
          .admin-orders-filters-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 10px 12px !important;
            gap: 10px !important;
            margin-bottom: 14px !important;
          }
          .admin-orders-search-wrap {
            max-width: 100% !important;
            width: 100% !important;
            flex: 1 1 100% !important;
          }
          .admin-orders-status-pills {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            width: 100% !important;
            padding-bottom: 4px !important;
            -webkit-overflow-scrolling: touch;
            gap: 5px !important;
          }
          .admin-orders-status-pills button {
            flex-shrink: 0 !important;
            white-space: nowrap !important;
            padding: 5px 10px !important;
            font-size: 11.5px !important;
          }
          .admin-orders-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .admin-order-card {
            padding: 14px 12px !important;
          }
          .admin-order-modal-overlay {
            padding: 8px !important;
            align-items: flex-end !important;
          }
          .admin-order-modal-card {
            max-height: 94vh !important;
            border-radius: 14px 14px 0 0 !important;
            width: 100% !important;
          }
          .admin-order-modal-header {
            padding: 12px 14px !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .admin-order-modal-body {
            grid-template-columns: 1fr !important;
            padding: 14px 12px !important;
            gap: 16px !important;
          }
          .admin-modal-edit-grid-2col {
            grid-template-columns: 1fr !important;
          }
          .admin-modal-edit-grid-3col {
            grid-template-columns: 1fr !important;
          }
          .admin-menu-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            margin-bottom: 14px !important;
          }
          .admin-menu-header button {
            width: 100% !important;
            justify-content: center !important;
            padding: 11px 16px !important;
          }
          .admin-menu-search-bar {
            padding: 10px 12px !important;
            margin-bottom: 14px !important;
          }
          .admin-menu-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .admin-menu-card {
            padding: 14px 12px !important;
          }
          .admin-studio-top-bar {
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          .admin-studio-hero-banner {
            padding: 14px 16px !important;
          }
          .admin-studio-card {
            padding: 16px 14px !important;
            border-radius: 14px !important;
          }
          .admin-studio-sizes-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-studio-toppings-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
          }
          .admin-studio-bottom-bar {
            flex-direction: column !important;
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          .admin-studio-bottom-bar button {
            width: 100% !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 480px) {
          .admin-top-header {
            padding: 10px 12px !important;
            gap: 9px !important;
          }
          .admin-header-line-1 {
            padding-bottom: 7px !important;
          }
          .admin-header-line-1 h1 {
            font-size: 14.5px !important;
          }
          .admin-header-logout-btn {
            padding: 5px 10px !important;
            font-size: 11.5px !important;
          }
          .admin-header-line-2 {
            padding-bottom: 7px !important;
          }
          .admin-header-back-btn {
            padding: 5px 10px !important;
            font-size: 11.5px !important;
          }
          .admin-header-tools {
            gap: 6px !important;
          }
          .admin-shop-status-pill {
            padding: 4px 8px !important;
            gap: 6px !important;
          }
          .admin-shop-status-pill span:first-of-type {
            font-size: 10.5px !important;
          }
          .admin-email-text {
            max-width: 80px !important;
            font-size: 10.5px !important;
          }
          .admin-user-badge {
            padding: 4px 8px !important;
          }
          .admin-main-nav button {
            padding: 9px 8px !important;
            font-size: 12px !important;
            gap: 5px !important;
          }
          .admin-main-content {
            padding: 10px 6px !important;
          }
          .admin-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .admin-metrics-grid > div {
            padding: 9px 10px !important;
          }
          .admin-metrics-grid > div > span {
            font-size: 10.5px !important;
          }
          .admin-metrics-grid > div > div {
            font-size: 16px !important;
          }
          .admin-order-card {
            padding: 12px 10px !important;
            gap: 10px !important;
          }
          .admin-studio-grid-1-2 {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .admin-studio-prep-stock-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .admin-studio-toppings-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-studio-presets-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
          }
          .admin-studio-custom-topping-inputs {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* 1. Top Admin Header - Desktop View (exact original as before) */}
      <header
        className="admin-header-desktop"
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
          padding: '16px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBackToStore}
            style={{
              background: isLight ? '#0f172a' : '#1e293b',
              color: '#ffffff',
              border: isLight ? 'none' : '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: isLight ? '0 2px 6px rgba(15, 23, 42, 0.15)' : 'none'
            }}
          >
            <ArrowLeft size={16} color="#ffffff" />
            <span style={{ color: '#ffffff', fontWeight: '700' }}>{t.backToStore}</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '19px', fontWeight: '800', margin: 0, letterSpacing: '-0.3px', color: isLight ? '#0f172a' : '#ffffff' }}>
                {t.adminTitle}
              </h1>
              <span style={{
                background: isConnected ? '#10b981' : '#f59e0b',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '12px',
                letterSpacing: '0.5px'
              }}>
                {isConnected ? t.liveBadge : t.offlineBadge}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8' }}>
              {t.headerSubtitle}
            </p>
          </div>
        </div>

        {/* Right side controls: Theme Switcher, Refresh & Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={loadData}
            title={t.reloadData}
            style={{
              background: isLight ? '#ffffff' : '#1e293b',
              color: isLight ? '#0f172a' : '#cbd5e1',
              border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: isLight ? '0 1px 3px rgba(0, 0, 0, 0.04)' : 'none'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>

          {/* Theme Toggle Light / Dark */}
          <div style={{
            background: isLight ? '#f1f5f9' : '#0b0f19',
            padding: '3px',
            borderRadius: '10px',
            display: 'flex',
            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155'
          }}>
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              title={t.themeLight}
              style={{
                background: adminTheme === 'light' ? (isLight ? '#0f172a' : '#0284c7') : 'transparent',
                color: adminTheme === 'light' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
                border: 'none',
                borderRadius: '7px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                boxShadow: adminTheme === 'light' ? '0 2px 6px rgba(0, 0, 0, 0.2)' : 'none'
              }}
            >
              <Sun size={13} />
              {t.themeLight}
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              title={t.themeDark}
              style={{
                background: adminTheme === 'dark' ? '#1e293b' : 'transparent',
                color: adminTheme === 'dark' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
                border: 'none',
                borderRadius: '7px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                boxShadow: adminTheme === 'dark' ? '0 2px 6px rgba(0, 0, 0, 0.4)' : 'none'
              }}
            >
              <Moon size={13} />
              {t.themeDark}
            </button>
          </div>

          {/* Thermal Printer Status Button (Zjiang ZJ-8330-L) */}
          <button
            type="button"
            onClick={() => setIsPrinterModalOpen(true)}
            title={lang === 'de' ? 'Zjiang ZJ-8330-L Thermodrucker verwalten & Testdruck' : 'Manage ZJ-8330-L thermal printer & test print'}
            style={{
              background: printerStatus?.isPrinterFound
                ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)')
                : (isLight ? '#fff1f2' : 'rgba(225, 29, 72, 0.15)'),
              border: printerStatus?.isPrinterFound
                ? (isLight ? '1.5px solid #86efac' : '1.5px solid rgba(16, 185, 129, 0.4)')
                : (isLight ? '1.5px solid #fecaca' : '1.5px solid rgba(225, 29, 72, 0.4)'),
              color: printerStatus?.isPrinterFound
                ? (isLight ? '#15803d' : '#4ade80')
                : (isLight ? '#be123c' : '#fb7185'),
              borderRadius: '10px',
              padding: '6px 13px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s ease'
            }}
          >
            <Printer size={15} />
            <span>
              {printerStatus?.isPrinterFound
                ? (printerStatus?.config?.autoPrint !== false ? 'Drucker: Auto-Bon AN' : 'Drucker: Bereit')
                : 'Drucker: Getrennt'}
            </span>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: printerStatus?.isPrinterFound ? '#10b981' : '#e11d48',
              boxShadow: printerStatus?.isPrinterFound ? '0 0 6px #10b981' : '0 0 6px #e11d48'
            }} />
          </button>

          {/* Shop Online / Offline Toggle Control */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: isStoreOpen
              ? (isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)')
              : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)'),
            border: isStoreOpen
              ? (isLight ? '1.5px solid #86efac' : '1.5px solid rgba(34, 197, 94, 0.4)')
              : (isLight ? '1.5px solid #fca5a5' : '1.5px solid rgba(239, 68, 68, 0.4)'),
            borderRadius: '10px',
            padding: '5px 12px',
            boxShadow: isStoreOpen ? '0 2px 8px rgba(34, 197, 94, 0.15)' : '0 2px 8px rgba(239, 68, 68, 0.15)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: isStoreOpen ? '#16a34a' : '#ef4444',
              boxShadow: isStoreOpen ? '0 0 8px #22c55e' : '0 0 8px #ef4444'
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: isStoreOpen ? (isLight ? '#15803d' : '#4ade80') : (isLight ? '#b91c1c' : '#f87171'),
                letterSpacing: '0.3px'
              }}>
                {isStoreOpen ? 'SHOP GEÖFFNET' : 'SHOP GESCHLOSSEN'}
              </span>
              <span style={{ fontSize: '9.5px', color: isLight ? '#64748b' : '#94a3b8' }}>
                {isStoreOpen ? 'Bestellungen aktiv' : 'Nur Speisekarte'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleStoreStatus}
              disabled={isUpdatingStoreStatus}
              title={isStoreOpen ? 'Klicken, um Shop zu schließen (Pausieren)' : 'Klicken, um Shop zu öffnen'}
              style={{
                position: 'relative',
                width: '42px',
                height: '22px',
                borderRadius: '11px',
                background: isStoreOpen ? '#16a34a' : '#94a3b8',
                border: 'none',
                cursor: isUpdatingStoreStatus ? 'wait' : 'pointer',
                transition: 'background 0.2s ease',
                padding: '2px',
                marginLeft: '4px',
                opacity: isUpdatingStoreStatus ? 0.6 : 1
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                transform: isStoreOpen ? 'translateX(20px)' : 'translateX(0px)',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </button>
          </div>

          {/* Language Toggle DE / EN */}
          <div style={{
            background: isLight ? '#f1f5f9' : '#0b0f19',
            padding: '3px',
            borderRadius: '10px',
            display: 'flex',
            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155'
          }}>
            <button
              onClick={() => setLang('de')}
              style={{
                background: lang === 'de' ? '#e11d48' : 'transparent',
                color: lang === 'de' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
                border: 'none',
                borderRadius: '7px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              DE
            </button>
            <button
              onClick={() => setLang('en')}
              style={{
                background: lang === 'en' ? '#e11d48' : 'transparent',
                color: lang === 'en' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
                border: 'none',
                borderRadius: '7px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              EN
            </button>
          </div>

          {/* Admin User Profile & Sign Out Button */}
          {adminUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
              <div
                style={{
                  background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.8)',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isLight ? '#334155' : '#94a3b8'
                }}
                title={adminUser.email}
              >
                <User size={13} color="#e11d48" />
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {adminUser.email}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAdminLogout}
                title={lang === 'de' ? 'Abmelden' : 'Sign out'}
                style={{
                  background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
                  border: isLight ? '1px solid #fca5a5' : '1px solid rgba(239, 68, 68, 0.35)',
                  color: isLight ? '#dc2626' : '#f87171',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isLight ? '#fecaca' : 'rgba(239, 68, 68, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)';
                }}
              >
                <LogOut size={13} />
                <span>{lang === 'de' ? 'Abmelden' : 'Logout'}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Top Admin Header - Mobile View (3-Tier Dedicated Layout) */}
      <header
        className="admin-header-mobile admin-top-header"
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.96)' : '#131b2e',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
          padding: '14px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '11px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.04)' : '0 4px 16px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* LINE 1: Venezia Admin Portal Title (Left) + Logout Button (Right) */}
        <div
          className="admin-header-line-1"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '14px',
            paddingBottom: '9px',
            borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* Brand Heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontSize: '17px',
              fontWeight: '900',
              margin: 0,
              letterSpacing: '-0.3px',
              color: isLight ? '#0f172a' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '9px'
            }}>
              <span>Venezia Admin Portal</span>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isConnected ? '#10b981' : '#f59e0b',
                  boxShadow: isConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
                  display: 'inline-block',
                  marginLeft: '2px'
                }}
                title={isConnected ? 'Online (Supabase)' : 'Offline'}
              />
            </h1>
          </div>

          {/* Logout Button (Moved to top right side as requested) */}
          {adminUser && (
            <button
              type="button"
              className="admin-header-logout-btn"
              onClick={handleAdminLogout}
              title={lang === 'de' ? 'Abmelden' : 'Sign out'}
              style={{
                background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
                border: isLight ? '1px solid #fca5a5' : '1px solid rgba(239, 68, 68, 0.35)',
                color: isLight ? '#dc2626' : '#f87171',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <LogOut size={14} />
              <span>{lang === 'de' ? 'Abmelden' : 'Logout'}</span>
            </button>
          )}
        </div>

        {/* LINE 2: Back to Shop (Left) + Rest of Utility Buttons (Right) */}
        <div
          className="admin-header-line-2"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '12px',
            paddingBottom: '9px',
            borderBottom: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* Back to Shop */}
          <button
            onClick={onBackToStore}
            className="admin-header-back-btn"
            style={{
              background: isLight ? '#0f172a' : '#1e293b',
              color: '#ffffff',
              border: isLight ? 'none' : '1px solid #334155',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12.5px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              boxShadow: isLight ? '0 2px 6px rgba(15, 23, 42, 0.12)' : 'none',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={15} color="#ffffff" />
            <span className="back-btn-text-full">{t.backToStore}</span>
            <span className="back-btn-text-mobile">Zum Shop</span>
          </button>

          {/* Quick Utility Cluster: Theme Toggle, Language Toggle (Refresh removed as requested) */}
          <div className="admin-header-tools" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Theme Toggle */}
            <div style={{
              background: isLight ? '#f1f5f9' : '#0b0f19',
              padding: '3px',
              borderRadius: '8px',
              display: 'flex',
              gap: '2px',
              border: isLight ? '1px solid #cbd5e1' : '1px solid #334155'
            }}>
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                title={t.themeLight}
                style={{
                  background: adminTheme === 'light' ? (isLight ? '#0f172a' : '#0284c7') : 'transparent',
                  color: adminTheme === 'light' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Sun size={13} />
                <span className="theme-text-desktop">{t.themeLight}</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                title={t.themeDark}
                style={{
                  background: adminTheme === 'dark' ? '#1e293b' : 'transparent',
                  color: adminTheme === 'dark' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Moon size={13} />
                <span className="theme-text-desktop">{t.themeDark}</span>
              </button>
            </div>

            {/* Language Toggle DE / EN */}
            <div style={{
              background: isLight ? '#f1f5f9' : '#0b0f19',
              padding: '3px',
              borderRadius: '8px',
              display: 'flex',
              gap: '2px',
              border: isLight ? '1px solid #cbd5e1' : '1px solid #334155'
            }}>
              <button
                onClick={() => setLang('de')}
                style={{
                  background: lang === 'de' ? '#e11d48' : 'transparent',
                  color: lang === 'de' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                DE
              </button>
              <button
                onClick={() => setLang('en')}
                style={{
                  background: lang === 'en' ? '#e11d48' : 'transparent',
                  color: lang === 'en' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                EN
              </button>
            </div>

            {/* Mobile Thermal Printer Button */}
            <button
              type="button"
              onClick={() => setIsPrinterModalOpen(true)}
              title="ZJ-8330-L Drucker"
              style={{
                background: printerStatus?.isPrinterFound
                  ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)')
                  : (isLight ? '#fff1f2' : 'rgba(225, 29, 72, 0.15)'),
                border: printerStatus?.isPrinterFound
                  ? (isLight ? '1px solid #86efac' : '1px solid rgba(16, 185, 129, 0.4)')
                  : (isLight ? '1px solid #fecaca' : '1px solid rgba(225, 29, 72, 0.4)'),
                color: printerStatus?.isPrinterFound ? '#10b981' : '#e11d48',
                borderRadius: '8px',
                padding: '6px 9px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Printer size={14} />
            </button>
          </div>
        </div>

        {/* LINE 3: Store Operations (Shop Open/Closed Toggle + Logged-in Staff) */}
        <div
          className="admin-header-line-3"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '12px',
            paddingTop: '2px'
          }}
        >
          {/* Shop Online / Offline Toggle Control */}
          <div
            className="admin-shop-status-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: isStoreOpen
                ? (isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)')
                : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)'),
              border: isStoreOpen
                ? (isLight ? '1.5px solid #86efac' : '1.5px solid rgba(34, 197, 94, 0.4)')
                : (isLight ? '1.5px solid #fca5a5' : '1.5px solid rgba(239, 68, 68, 0.4)'),
              borderRadius: '8px',
              padding: '6px 12px',
              boxShadow: isStoreOpen ? '0 1px 6px rgba(34, 197, 94, 0.12)' : '0 1px 6px rgba(239, 68, 68, 0.12)',
              transition: 'all 0.2s ease',
              flex: '1 1 auto',
              maxWidth: '280px'
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isStoreOpen ? '#16a34a' : '#ef4444',
              boxShadow: isStoreOpen ? '0 0 6px #22c55e' : '0 0 6px #ef4444',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              color: isStoreOpen ? (isLight ? '#15803d' : '#4ade80') : (isLight ? '#b91c1c' : '#f87171'),
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {isStoreOpen ? 'SHOP GEÖFFNET' : 'SHOP GESCHLOSSEN'}
            </span>

            <button
              type="button"
              onClick={handleToggleStoreStatus}
              disabled={isUpdatingStoreStatus}
              title={isStoreOpen ? 'Klicken, um Shop zu schließen' : 'Klicken, um Shop zu öffnen'}
              style={{
                position: 'relative',
                width: '38px',
                height: '20px',
                borderRadius: '10px',
                background: isStoreOpen ? '#16a34a' : '#94a3b8',
                border: 'none',
                cursor: isUpdatingStoreStatus ? 'wait' : 'pointer',
                transition: 'background 0.2s ease',
                padding: '2px',
                flexShrink: 0,
                opacity: isUpdatingStoreStatus ? 0.6 : 1,
                marginLeft: '4px'
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                transform: isStoreOpen ? 'translateX(18px)' : 'translateX(0px)',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </button>
          </div>

          {/* Admin User Badge */}
          {adminUser && (
            <div
              className="admin-user-badge"
              style={{
                background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.8)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                fontWeight: '600',
                color: isLight ? '#334155' : '#94a3b8',
                flexShrink: 0
              }}
              title={adminUser.email}
            >
              <User size={14} color="#e11d48" />
              <span className="admin-email-text" style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {adminUser.email}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav
        className="admin-main-nav"
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.95)' : '#131b2e',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
          padding: '0 48px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto'
        }}
      >
        {[
          {
            key: 'orders',
            label: t.tabs.orders,
            icon: ShoppingBag,
            count: orders.filter(o => o.status === 'new' || o.status === 'preparing' || o.status === 'out_for_delivery').length > 0
              ? orders.filter(o => o.status === 'new' || o.status === 'preparing' || o.status === 'out_for_delivery').length
              : (orders.length > 0 ? orders.length : undefined)
          },
          {
            key: 'menu',
            label: t.tabs.menu,
            icon: UtensilsCrossed,
            count: menuItems.length > 0 ? menuItems.length : undefined
          }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key || (tab.key === 'menu' && activeTab === 'addItem');
          const buttonKey = `tab-${tab.key}`;

          return (
            <button
              key={buttonKey}
              className={isActive ? 'nav-active' : ''}
              onClick={() => {
                if (tab.key === 'menu' && activeTab === 'addItem') {
                  setEditingItem(null);
                }
                setActiveTab(tab.key);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid #e11d48' : '3px solid transparent',
                color: isActive ? '#e11d48' : (isLight ? '#475569' : '#94a3b8'),
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: isActive ? '800' : '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Icon size={16} color={isActive ? '#e11d48' : (isLight ? '#64748b' : '#94a3b8')} />
              </span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="nav-badge" style={{
                  background: isActive ? '#e11d48' : (isLight ? '#f1f5f9' : '#1e293b'),
                  color: isActive ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
                  border: isActive ? 'none' : (isLight ? '1px solid #cbd5e1' : 'none'),
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '1px 7px',
                  borderRadius: '10px'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Container */}
      <main className="admin-main-content" style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 48px' }}>

        {/* Store Status Change Notification Banner */}
        {storeStatusNotice && (
          <div style={{
            background: isStoreOpen ? '#15803d' : '#991b1b',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <span>{storeStatusNotice}</span>
            <button
              type="button"
              onClick={() => setStoreStatusNotice('')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer',
                fontWeight: '800'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Live Audio-Visual New Order Alert Banner */}
        {newOrderAlert && (
          <div className="admin-order-alert-banner" style={{
            background: 'linear-gradient(135deg, #e11d48, #be123c)',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '14px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 8px 30px rgba(225, 29, 72, 0.4)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite'
              }}>
                <BellRing size={22} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontWeight: '900', fontSize: '15px' }}>
                  🔔 Neue Online-Bestellung #{newOrderAlert.order.order_number} eingegangen!
                </div>
                <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                  <strong>{newOrderAlert.order.customer_name}</strong> • {newOrderAlert.order.customer_phone || 'Keine Tel.'} • {Number(newOrderAlert.order.total).toFixed(2).replace('.', ',')} € • {newOrderAlert.order.delivery_type === 'delivery' ? '🛵 Lieferung' : '🏪 Selbstabholung'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(newOrderAlert.order);
                  setActiveTab('orders');
                  setOrdersTab('active');
                  setNewOrderAlert(null);
                }}
                style={{
                  background: '#ffffff',
                  color: '#e11d48',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                Bestellung jetzt öffnen
              </button>
              <button
                type="button"
                onClick={() => setNewOrderAlert(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                title="Ausblenden"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 1: ORDERS & ORDER HISTORY (WITH PAYMENT GATEWAY INTEGRATION) */}
        {/* ================================================================== */}
        {activeTab === 'orders' && (
          <div>
            {/* Header: Title & Sub-tabs (Active vs History vs All) */}
            <div className="admin-orders-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: isLight ? '#0f172a' : '#ffffff' }}>{t.orders.title}</h2>
                <p style={{ fontSize: '13px', color: isLight ? '#475569' : '#94a3b8', margin: '4px 0 0' }}>{t.orders.subtitle}</p>
              </div>

              {/* Main View Switcher: Aktive Aufträge vs Bestellhistorie vs Alle */}
              <div className="admin-order-view-switcher" style={{
                background: isLight ? '#f1f5f9' : '#131b2e',
                padding: '4px',
                borderRadius: '10px',
                display: 'flex',
                gap: '4px',
                border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b',
                boxShadow: isLight ? '0 1px 3px rgba(0, 0, 0, 0.04)' : 'none'
              }}>
                <button
                  type="button"
                  onClick={() => { setOrdersTab('active'); setOrderFilter('all'); }}
                  style={{
                    background: ordersTab === 'active' ? '#e11d48' : 'transparent',
                    color: ordersTab === 'active' ? '#ffffff' : (isLight ? '#334155' : '#94a3b8'),
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: ordersTab === 'active' ? '0 2px 8px rgba(225, 29, 72, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShoppingBag size={14} className="switcher-icon" />
                  <span className="switcher-label-desktop">{t.orders.activeOrders}</span>
                  <span className="switcher-label-mobile">{lang === 'de' ? 'Aktiv' : 'Active'}</span>
                  <span
                    className="switcher-badge"
                    style={{
                      background: ordersTab === 'active' ? 'rgba(255,255,255,0.25)' : (isLight ? '#ffffff' : '#1e293b'),
                      color: ordersTab === 'active' ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                      border: ordersTab === 'active' ? 'none' : (isLight ? '1px solid #cbd5e1' : 'none'),
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      marginLeft: '2px',
                      flexShrink: 0
                    }}
                  >
                    {orders.filter(o => o.status === 'new' || o.status === 'preparing' || o.status === 'out_for_delivery').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setOrdersTab('history'); setOrderFilter('all'); }}
                  style={{
                    background: ordersTab === 'history' ? '#0284c7' : 'transparent',
                    color: ordersTab === 'history' ? '#ffffff' : (isLight ? '#334155' : '#94a3b8'),
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: ordersTab === 'history' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <History size={14} className="switcher-icon" />
                  <span className="switcher-label-desktop">{t.orders.orderHistory}</span>
                  <span className="switcher-label-mobile">{lang === 'de' ? 'Historie' : 'History'}</span>
                  <span
                    className="switcher-badge"
                    style={{
                      background: ordersTab === 'history' ? 'rgba(255,255,255,0.25)' : (isLight ? '#ffffff' : '#1e293b'),
                      color: ordersTab === 'history' ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                      border: ordersTab === 'history' ? 'none' : (isLight ? '1px solid #cbd5e1' : 'none'),
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      marginLeft: '2px',
                      flexShrink: 0
                    }}
                  >
                    {orders.filter(o => o.status === 'delivered' || o.status === 'cancelled').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setOrdersTab('all'); setOrderFilter('all'); }}
                  style={{
                    background: ordersTab === 'all' ? (isLight ? '#0f172a' : '#334155') : 'transparent',
                    color: ordersTab === 'all' ? '#ffffff' : (isLight ? '#334155' : '#94a3b8'),
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: ordersTab === 'all' ? '0 2px 8px rgba(15, 23, 42, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Receipt size={14} className="switcher-icon" />
                  <span className="switcher-label-desktop">{t.orders.allOrders}</span>
                  <span className="switcher-label-mobile">{lang === 'de' ? 'Alle' : 'All'}</span>
                  <span
                    className="switcher-badge"
                    style={{
                      background: ordersTab === 'all' ? 'rgba(255,255,255,0.25)' : (isLight ? '#ffffff' : '#1e293b'),
                      color: ordersTab === 'all' ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                      border: ordersTab === 'all' ? 'none' : (isLight ? '1px solid #cbd5e1' : 'none'),
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      marginLeft: '2px',
                      flexShrink: 0
                    }}
                  >
                    {orders.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Metrics & Gateway Status Bar */}
            <div className="admin-metrics-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#131b2e',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isLight ? '1px solid rgba(226, 232, 240, 0.95)' : '1px solid #1e293b',
                boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.03)' : '0 8px 24px rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px'
              }}>
                <span style={{ fontSize: '11.5px', color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>{t.metrics.activeOrders}</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: isLight ? '#0f172a' : '#f8fafc', marginTop: '4px' }}>
                  {orders.filter(o => o.status === 'new' || o.status === 'preparing' || o.status === 'out_for_delivery').length}
                </div>
              </div>

              <div style={{
                background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#131b2e',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isLight ? '1px solid rgba(226, 232, 240, 0.95)' : '1px solid #1e293b',
                boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.03)' : '0 8px 24px rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px'
              }}>
                <span style={{ fontSize: '11.5px', color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>{t.metrics.deliveredHistory}</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                  {orders.filter(o => o.status === 'delivered').length}
                </div>
              </div>

              <div style={{
                background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#131b2e',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isLight ? '1px solid rgba(226, 232, 240, 0.95)' : '1px solid #1e293b',
                boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.03)' : '0 8px 24px rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px'
              }}>
                <span style={{ fontSize: '11.5px', color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>{t.metrics.totalRevenue}</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
                  {orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0).toFixed(2).replace('.', ',')} €
                </div>
              </div>

              <div style={{
                background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: isLight ? '0 4px 16px rgba(16, 185, 129, 0.05)' : '0 8px 24px rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span style={{ fontSize: '11.5px', color: isLight ? '#059669' : '#34d399', fontWeight: '800', textTransform: 'uppercase' }}>Payment Gateway</span>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: isLight ? '#065f46' : '#f8fafc', marginTop: '4px' }}>
                  {t.metrics.gatewayReady}
                </div>
              </div>
            </div>

            {/* Search & Status Pill Filters Bar */}
            <div className="admin-orders-filters-bar" style={{
              background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#131b2e',
              border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.02)' : 'none'
            }}>
              {/* Search Field */}
              <div className="admin-orders-search-wrap" style={{ position: 'relative', flex: '1 1 260px', maxWidth: '420px' }}>
                <Search size={15} color={isLight ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="text"
                  placeholder={t.orders.searchPlaceholder}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: isLight ? '#ffffff' : '#0b0f19',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '8px 12px 8px 34px',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: '12.5px'
                  }}
                />
              </div>

              {/* Status Pills */}
              <div className="admin-orders-status-pills" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: t.orders.filterAll },
                  { id: 'new', label: t.orders.filterNew },
                  { id: 'preparing', label: t.orders.filterPreparing },
                  { id: 'out_for_delivery', label: t.orders.filterDelivery },
                  { id: 'delivered', label: t.orders.filterDelivered },
                  { id: 'cancelled', label: t.orders.filterCancelled }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setOrderFilter(filter.id)}
                    style={{
                      background: orderFilter === filter.id ? '#e11d48' : (isLight ? '#ffffff' : '#0b0f19'),
                      color: orderFilter === filter.id ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                      border: `1px solid ${orderFilter === filter.id ? '#e11d48' : (isLight ? '#cbd5e1' : '#1e293b')}`,
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: orderFilter === filter.id ? '0 2px 8px rgba(225, 29, 72, 0.3)' : (isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none')
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div style={{
                background: '#131b2e',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                border: '1px dashed #334155',
                color: '#94a3b8'
              }}>
                <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p style={{ fontSize: '15px', fontWeight: '600' }}>{t.orders.noOrders}</p>
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    style={{ marginTop: '10px', background: '#1e293b', border: '1px solid #334155', color: '#ffffff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    {t.orders.resetSearch}
                  </button>
                )}
              </div>
            ) : (
              <div className="admin-orders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
                {filteredOrders.map(order => {
                  const isNew = order.status === 'new';
                  const isPrep = order.status === 'preparing';
                  const isDeliv = order.status === 'out_for_delivery';
                  const isDone = order.status === 'delivered';
                  const isCancelled = order.status === 'cancelled';

                  const payMethod = order.payment_method || 'stripe';
                  const isPaid = order.payment_status === 'paid';
                  const isRefunded = order.payment_status === 'refunded';

                  const isPickup = order.delivery_type === 'pickup';
                  const orderStatusDisplay = order.status === 'delivered'
                    ? (isPickup ? 'Abgeholt (Picked Up)' : t.orders.statusDelivered)
                    : order.status === 'new'
                    ? t.orders.statusNew
                    : order.status === 'preparing'
                    ? t.orders.statusPreparing
                    : order.status === 'out_for_delivery'
                    ? (isPickup ? 'Bereit zur Abholung (Ready to Collect)' : t.orders.statusDelivery)
                    : order.status === 'cancelled'
                    ? t.orders.statusCancelled
                    : order.status.toUpperCase();

                  return (
                    <div
                      key={order.id}
                      className="admin-order-card"
                      style={{
                        background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
                        borderRadius: '12px',
                        border: isNew ? '2px solid #e11d48' : isDone ? (isLight ? '1.5px solid #10b981' : '1px solid #065f46') : (isLight ? '1px solid #e2e8f0' : '1px solid #1e293b'),
                        boxShadow: isNew ? '0 0 20px rgba(225, 29, 72, 0.2)' : (isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : 'none'),
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        opacity: isCancelled ? 0.65 : 1,
                        color: isLight ? '#0f172a' : '#f8fafc'
                      }}
                    >
                      {/* Top Bar: Order ID, Time, Status & Delivery Type */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '800', fontSize: '16px', color: isLight ? '#0f172a' : '#f8fafc' }}>
                              #{order.order_number || order.id.slice(0, 8)}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: isNew ? '#e11d48' : isPrep ? '#f59e0b' : isDeliv ? '#0284c7' : isDone ? '#10b981' : '#64748b',
                              color: '#ffffff'
                            }}>
                              {orderStatusDisplay}
                            </span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: isLight ? '#475569' : '#94a3b8' }}>
                            {new Date(order.created_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US')} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {t.orders.clockSuffix}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: '700',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: order.delivery_type === 'delivery' ? '#0284c7' : '#059669',
                            color: '#ffffff'
                          }}>
                            {order.delivery_type === 'delivery' ? t.orders.delivery : t.orders.pickup}
                          </span>

                          {/* Payment Badge */}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            background: isPaid ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)') : isRefunded ? (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)') : (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)'),
                            color: isPaid ? (isLight ? '#047857' : '#34d399') : isRefunded ? (isLight ? '#b91c1c' : '#f87171') : (isLight ? '#b45309' : '#fbbf24'),
                            border: `1px solid ${isPaid ? (isLight ? '#a7f3d0' : '#059669') : isRefunded ? (isLight ? '#fecaca' : '#b91c1c') : (isLight ? '#fde68a' : '#d97706')}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CreditCard size={11} />
                            {(payMethod === 'sumup' || payMethod === 'credit_card') ? 'SumUp Online' : (payMethod === 'sumup_terminal' || payMethod === 'ec_card') ? 'SumUp Terminal' : payMethod === 'paypal' ? 'PayPal' : t.orders.cash}: {isPaid ? t.orders.paid : isRefunded ? t.orders.refunded : t.orders.pending}
                          </span>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div style={{ background: isLight ? '#f8fafc' : '#0b0f19', border: isLight ? '1px solid #e2e8f0' : 'none', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                        <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', color: isLight ? '#0f172a' : '#f8fafc' }}>
                          <User size={14} color="#e11d48" /> {order.customer_name}
                        </div>
                        <div style={{ color: isLight ? '#475569' : '#cbd5e1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} color={isLight ? '#64748b' : '#94a3b8'} />
                          <a href={`tel:${order.customer_phone}`} style={{ color: isLight ? '#0284c7' : '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
                            {order.customer_phone}
                          </a>
                        </div>
                        {order.delivery_type === 'delivery' && (
                          <div style={{ color: isLight ? '#475569' : '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <MapPin size={14} color={isLight ? '#64748b' : '#94a3b8'} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>{order.street || 'Plauen'}, {order.zip_city || '08525 Plauen'}</span>
                          </div>
                        )}
                        {order.note && (
                          <div style={{ marginTop: '6px', padding: '6px 8px', background: isLight ? '#fffbeb' : '#1e293b', border: isLight ? '1px solid #fde68a' : 'none', borderRadius: '6px', fontSize: '12px', color: isLight ? '#b45309' : '#fde047' }}>
                            {order.note}
                          </div>
                        )}
                      </div>

                      {/* Items Summary */}
                      <div style={{ borderTop: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', paddingTop: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: isLight ? '#475569' : '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                          {t.orders.items} ({(order.order_items || []).length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(order.order_items || []).map((item, idx) => {
                            const rawToppings = Array.isArray(item.toppings_selected) && item.toppings_selected.length > 0
                              ? item.toppings_selected
                              : Array.isArray(item.selectedToppings) && item.selectedToppings.length > 0
                              ? item.selectedToppings
                              : typeof item.toppings_selected === 'string' && item.toppings_selected
                              ? [item.toppings_selected]
                              : [];

                            let sideDishVal = item.side_dish || item.sideDish || item.selectedSide || null;
                            let dressingVal = item.dressing || item.selectedDressing || null;
                            const pureExtras = [];

                            rawToppings.forEach(top => {
                              const str = typeof top === 'string' ? top : (top?.name || top?.id || String(top));
                              if (/^beilage:\s*/i.test(str)) {
                                if (!sideDishVal) sideDishVal = str.replace(/^beilage:\s*/i, '').trim();
                              } else if (/^dressing:\s*/i.test(str)) {
                                if (!dressingVal) dressingVal = str.replace(/^dressing:\s*/i, '').trim();
                              } else {
                                pureExtras.push(str);
                              }
                            });

                            return (
                              <div
                                key={idx}
                                style={{
                                  padding: '6px 8px',
                                  background: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.4)',
                                  borderRadius: '7px',
                                  border: isLight ? '1px solid #f1f5f9' : '1px solid rgba(51, 65, 85, 0.3)'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: isLight ? '#0f172a' : '#f8fafc' }}>
                                  <span>
                                    <strong style={{ color: '#e11d48' }}>{item.quantity}x</strong> {item.item_name}
                                    {item.selected_size && (
                                      <span style={{ color: isLight ? '#0284c7' : '#38bdf8', fontSize: '11.5px', marginLeft: '4px', fontWeight: '700' }}>
                                        ({item.selected_size})
                                      </span>
                                    )}
                                    {sideDishVal && (
                                      <span style={{
                                        marginLeft: '6px',
                                        background: isLight ? '#fff1f2' : 'rgba(225, 29, 72, 0.2)',
                                        color: '#e11d48',
                                        border: isLight ? '1px solid #fecdd3' : '1px solid rgba(225, 29, 72, 0.4)',
                                        borderRadius: '4px',
                                        padding: '1px 5px',
                                        fontSize: '10.5px',
                                        fontWeight: '800'
                                      }}>
                                        🍟 Beilage: {sideDishVal}
                                      </span>
                                    )}
                                    {dressingVal && (
                                      <span style={{
                                        marginLeft: '6px',
                                        background: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.2)',
                                        color: isLight ? '#15803d' : '#4ade80',
                                        border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(34, 197, 94, 0.4)',
                                        borderRadius: '4px',
                                        padding: '1px 5px',
                                        fontSize: '10.5px',
                                        fontWeight: '800'
                                      }}>
                                        🥗 Dressing: {dressingVal}
                                      </span>
                                    )}
                                    {item.is_american && (
                                      <span style={{
                                        marginLeft: '6px',
                                        background: '#fef3c7',
                                        color: '#92400e',
                                        border: '1px solid #fde68a',
                                        borderRadius: '4px',
                                        padding: '1px 5px',
                                        fontSize: '10px',
                                        fontWeight: '800'
                                      }}>
                                        American Crust
                                      </span>
                                    )}
                                  </span>
                                  <span style={{ fontWeight: '700' }}>
                                    {(Number(item.total_price) || (Number(item.unit_price) * item.quantity) || 0).toFixed(2).replace('.', ',')} €
                                  </span>
                                </div>

                                {/* Extra Toppings & Add-ons Badges in Order Card */}
                                {pureExtras.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: isLight ? '#b45309' : '#fde047' }}>
                                      + Extras:
                                    </span>
                                    {pureExtras.map((extraName, tIdx) => {
                                      const isGratis = extraName.includes('(gratis)');
                                      return (
                                        <span
                                          key={tIdx}
                                          style={{
                                            background: isGratis
                                              ? (isLight ? '#dcfce7' : 'rgba(22, 163, 74, 0.25)')
                                              : (isLight ? '#fffbeb' : 'rgba(217, 119, 6, 0.25)'),
                                            color: isGratis
                                              ? (isLight ? '#15803d' : '#86efac')
                                              : (isLight ? '#92400e' : '#fde68a'),
                                            border: isGratis
                                              ? (isLight ? '1px solid #86efac' : '1px solid rgba(34, 197, 94, 0.4)')
                                              : (isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.4)'),
                                            borderRadius: '4px',
                                            padding: '1px 6px',
                                            fontSize: '10.5px',
                                            fontWeight: '700'
                                          }}
                                        >
                                          +{extraName}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Special Instructions in Order Card */}
                                {item.special_instructions && (
                                  <div style={{ fontSize: '11px', color: '#b45309', fontStyle: 'italic', marginTop: '3px' }}>
                                    💬 "{item.special_instructions}"
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: isLight ? '1px dashed #cbd5e1' : '1px dashed #334155', fontWeight: '800', fontSize: '15px' }}>
                          <span style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>{t.orders.total}</span>
                          <span style={{ color: isLight ? '#16a34a' : '#4ade80' }}>{(Number(order.total) || 0).toFixed(2).replace('.', ',')} €</span>
                        </div>
                      </div>

                      {/* Quick Controls: Prep Time & Driver Assignment */}
                      <div style={{ background: isLight ? '#f8fafc' : '#0b0f19', border: isLight ? '1px solid #e2e8f0' : 'none', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Prep Time */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: isLight ? '#334155' : '#cbd5e1', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} color="#f59e0b" /> {t.orders.prepTime}:
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[20, 30, 45, 60].map(mins => (
                              <button
                                key={mins}
                                onClick={() => handlePrepTimeChange(order.id, mins)}
                                style={{
                                  background: order.estimated_delivery_minutes === mins ? '#f59e0b' : (isLight ? '#ffffff' : '#1e293b'),
                                  color: order.estimated_delivery_minutes === mins ? '#000000' : (isLight ? '#0f172a' : '#ffffff'),
                                  border: `1px solid ${order.estimated_delivery_minutes === mins ? '#f59e0b' : (isLight ? '#cbd5e1' : '#334155')}`,
                                  borderRadius: '6px',
                                  padding: '3px 7px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Detail Button & Status Advancement */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {/* View Full Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            style={{
                              flex: 1,
                              background: isLight ? '#0284c7' : '#1e293b',
                              color: '#ffffff',
                              border: isLight ? 'none' : '1px solid #0284c7',
                              borderRadius: '8px',
                              padding: '9px 12px',
                              fontSize: '12.5px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: isLight ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Eye size={15} color={isLight ? '#ffffff' : '#38bdf8'} />
                            <span style={{ color: isLight ? '#ffffff' : '#38bdf8', fontWeight: '800' }}>{t.orders.viewDetailsGateway}</span>
                          </button>

                          {/* Print Thermal Receipt Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintThermalReceipt(order, true);
                            }}
                            disabled={printingOrderId === (order.id || order.order_number)}
                            title={lang === 'de' ? 'Bon auf ZJ-8330-L Thermodrucker drucken' : 'Print receipt on thermal printer'}
                            style={{
                              background: printedOrderIds.has(order.id) || printedOrderIds.has(order.order_number)
                                ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)')
                                : (isLight ? '#f8fafc' : '#131b2e'),
                              color: printedOrderIds.has(order.id) || printedOrderIds.has(order.order_number)
                                ? '#10b981'
                                : (isLight ? '#0f172a' : '#cbd5e1'),
                              border: printedOrderIds.has(order.id) || printedOrderIds.has(order.order_number)
                                ? '1px solid #10b981'
                                : (isLight ? '1px solid #cbd5e1' : '1px solid #334155'),
                              borderRadius: '8px',
                              padding: '9px 13px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              flexShrink: 0
                            }}
                          >
                            <Printer size={15} color={printedOrderIds.has(order.id) || printedOrderIds.has(order.order_number) ? '#10b981' : '#e11d48'} />
                            <span>
                              {printingOrderId === (order.id || order.order_number)
                                ? (lang === 'de' ? 'Druckt...' : 'Printing...')
                                : (printedOrderIds.has(order.id) || printedOrderIds.has(order.order_number)
                                    ? (lang === 'de' ? 'Gedruckt ✓' : 'Printed ✓')
                                    : (lang === 'de' ? 'Bon' : 'Receipt'))}
                            </span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {order.status === 'new' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'preparing')}
                              style={{
                                flex: 1,
                                background: '#f59e0b',
                                color: '#000000',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              ▶ {t.orders.filterPreparing}
                            </button>
                          )}

                          {order.status === 'preparing' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'out_for_delivery')}
                              style={{
                                flex: 1,
                                background: '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              ▶ {order.delivery_type === 'pickup' ? 'Bereit zur Abholung' : t.orders.filterDelivery}
                            </button>
                          )}

                          {order.status === 'out_for_delivery' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'delivered')}
                              style={{
                                flex: 1,
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <CheckCircle2 size={14} />
                              {order.delivery_type === 'pickup' ? 'Abgeholt (Picked Up)' : t.orders.filterDelivered}
                            </button>
                          )}

                          {order.status === 'delivered' && (
                            <div style={{
                              flex: 1,
                              background: isLight ? '#dcfce7' : 'rgba(22, 163, 74, 0.2)',
                              color: isLight ? '#15803d' : '#4ade80',
                              border: '1px solid rgba(22, 163, 74, 0.3)',
                              borderRadius: '8px',
                              padding: '7px 10px',
                              fontWeight: '700',
                              fontSize: '12px',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}>
                              <CheckCircle2 size={14} />
                              {order.delivery_type === 'pickup' ? 'Abgeholt' : t.orders.statusDelivered}
                            </div>
                          )}

                          {order.status === 'cancelled' && (
                            <div style={{
                              flex: 1,
                              background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
                              color: isLight ? '#b91c1c' : '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '8px',
                              padding: '7px 10px',
                              fontWeight: '700',
                              fontSize: '12px',
                              textAlign: 'center'
                            }}>
                              ✕ {t.orders.statusCancelled}
                            </div>
                          )}
                        </div>

                        {/* CANCEL ORDER BUTTON: ONLY for Active Orders tab */}
                        {ordersTab === 'active' && ['new', 'preparing', 'out_for_delivery'].includes(order.status) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(lang === 'de'
                                ? `Möchten Sie die Bestellung #${order.order_number} wirklich stornieren?`
                                : `Are you sure you want to cancel order #${order.order_number}?`)) {
                                handleStatusChange(order.id, 'cancelled');
                              }
                            }}
                            style={{
                              background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              borderRadius: '8px',
                              padding: '7px 10px',
                              fontWeight: '700',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                            title={lang === 'de' ? 'Aktive Bestellung stornieren' : 'Cancel active order'}
                          >
                            <X size={13} />
                            <span>{lang === 'de' ? 'Bestellung stornieren' : 'Cancel Order'}</span>
                          </button>
                        )}

                        {/* DELETE ORDER BUTTON (for removing individual orders / history) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrder(order.id, order.order_number);
                          }}
                          style={{
                            background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.08)',
                            color: '#dc2626',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontWeight: '600',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.08)'}
                          title={lang === 'de' ? 'Bestellung endgültig löschen' : 'Delete order permanently'}
                        >
                          <Trash2 size={12} />
                          <span>{lang === 'de' ? 'Löschen' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ================================================================ */}
            {/* ORDER DETAILS MODAL (FULL BREAKDOWN & PAYMENT GATEWAY TEST) */}
            {/* ================================================================ */}
            {selectedOrder && (
              <div
                className="admin-order-modal-overlay"
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(6px)',
                  zIndex: 1200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px'
                }}
              >
                <div
                  className="admin-card admin-order-modal-card"
                  style={{
                    background: isLight ? '#ffffff' : '#131b2e',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '920px',
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    boxShadow: isLight ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    color: isLight ? '#0f172a' : '#f8fafc'
                  }}
                >
                  {/* Modal Header */}
                  <div
                    className="admin-order-modal-header"
                    style={{
                      padding: '20px 24px',
                      borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'sticky',
                      top: 0,
                      background: isLight ? '#ffffff' : '#131b2e',
                      zIndex: 10
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        background: '#e11d48',
                        color: '#ffffff',
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800'
                      }}>
                        <Receipt size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: isLight ? '#0f172a' : '#ffffff' }}>
                            {t.orders.modalOrder}{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
                          </h3>
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: selectedOrder.status === 'new' ? '#e11d48' : selectedOrder.status === 'preparing' ? '#f59e0b' : selectedOrder.status === 'out_for_delivery' ? '#0284c7' : '#10b981',
                            color: '#ffffff'
                          }}>
                            {selectedOrder.status === 'delivered'
                              ? (selectedOrder.delivery_type === 'pickup' ? 'Abgeholt (Picked Up)' : t.orders.statusDelivered)
                              : selectedOrder.status === 'new'
                              ? t.orders.statusNew
                              : selectedOrder.status === 'preparing'
                              ? t.orders.statusPreparing
                              : selectedOrder.status === 'out_for_delivery'
                              ? (selectedOrder.delivery_type === 'pickup' ? 'Bereit zur Abholung (Ready to Collect)' : t.orders.statusDelivery)
                              : selectedOrder.status === 'cancelled'
                              ? t.orders.statusCancelled
                              : selectedOrder.status.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: isLight ? '#475569' : '#94a3b8' }}>
                          {t.orders.received} {new Date(selectedOrder.created_at).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US')}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingOrder) {
                            handleCancelEditOrder();
                          } else {
                            handleStartEditOrder(selectedOrder);
                          }
                        }}
                        style={{
                          background: isEditingOrder ? '#ef4444' : (isLight ? '#ffffff' : '#1e293b'),
                          color: isEditingOrder ? '#ffffff' : (isLight ? '#0f172a' : '#ffffff'),
                          border: `1px solid ${isEditingOrder ? '#dc2626' : (isLight ? '#cbd5e1' : '#334155')}`,
                          borderRadius: '8px',
                          padding: '7px 12px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Edit3 size={15} />
                        <span>{isEditingOrder ? t.orders.cancelEdit : t.orders.editOrder}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          if (e.shiftKey) {
                            window.print();
                          } else {
                            handlePrintThermalReceipt(selectedOrder, true);
                          }
                        }}
                        disabled={printingOrderId === (selectedOrder.id || selectedOrder.order_number)}
                        style={{
                          background: '#e11d48',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '7px 14px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(225, 29, 72, 0.3)'
                        }}
                        title={lang === 'de' ? 'Bon direkt auf ZJ-8330-L drucken (Shift-Klick für Browser-Druck)' : 'Print receipt on thermal printer (Shift-click for browser print)'}
                      >
                        <Printer size={15} />
                        <span>
                          {printingOrderId === (selectedOrder.id || selectedOrder.order_number)
                            ? (lang === 'de' ? 'Druckt...' : 'Printing...')
                            : (lang === 'de' ? 'Bon drucken' : 'Print Receipt')}
                        </span>
                      </button>

                      {/* Modal Delete Order Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.order_number)}
                        style={{
                          background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.12)',
                          color: '#dc2626',
                          border: isLight ? '1px solid #fecaca' : '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          padding: '7px 12px',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title={lang === 'de' ? 'Bestellung löschen' : 'Delete Order'}
                      >
                        <Trash2 size={14} />
                        <span>{lang === 'de' ? 'Löschen' : 'Delete'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsEditingOrder(false);
                          setEditOrderForm(null);
                          setSelectedOrder(null);
                        }}
                        style={{
                          background: isLight ? '#f1f5f9' : '#1e293b',
                          color: isLight ? '#0f172a' : '#ffffff',
                          border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                          borderRadius: '8px',
                          width: '34px',
                          height: '34px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Modal Body: 2 Columns */}
                  <div
                    className="admin-order-modal-body"
                    style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}
                  >
                    {/* LEFT COLUMN: Customer & Itemized Breakdown */}
                    {isEditingOrder && editOrderForm ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Customer Details Edit Box */}
                        <div style={{ background: '#0b0f19', padding: '18px', borderRadius: '12px', border: '1.5px solid #0284c7' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Edit3 size={15} /> {t.orders.editOrder}
                            </div>
                            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                              {lang === 'de' ? 'Bearbeitungsmodus' : 'Editing Mode'}
                            </span>
                          </div>

                          <div className="admin-modal-edit-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>
                                {t.orders.customerName}
                              </label>
                              <input
                                type="text"
                                value={editOrderForm.customer_name}
                                onChange={(e) => handleOrderFieldChange('customer_name', e.target.value)}
                                style={{ width: '100%', background: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', color: '#ffffff', fontSize: '13px' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>
                                {t.orders.customerPhoneLabel}
                              </label>
                              <input
                                type="text"
                                value={editOrderForm.customer_phone}
                                onChange={(e) => handleOrderFieldChange('customer_phone', e.target.value)}
                                style={{ width: '100%', background: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', color: '#ffffff', fontSize: '13px' }}
                              />
                            </div>
                          </div>

                          {/* Delivery Type Toggle */}
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px' }}>
                              {t.orders.orderTypeLabel}
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleOrderFieldChange('delivery_type', 'delivery')}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: `1.5px solid ${editOrderForm.delivery_type === 'delivery' ? '#0284c7' : '#334155'}`,
                                  background: editOrderForm.delivery_type === 'delivery' ? '#0284c7' : '#131b2e',
                                  color: '#ffffff',
                                  fontSize: '12.5px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                🚗 {t.orders.delivery}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOrderFieldChange('delivery_type', 'pickup')}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: `1.5px solid ${editOrderForm.delivery_type === 'pickup' ? '#10b981' : '#334155'}`,
                                  background: editOrderForm.delivery_type === 'pickup' ? '#10b981' : '#131b2e',
                                  color: '#ffffff',
                                  fontSize: '12.5px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                🏪 {t.orders.pickup}
                              </button>
                            </div>
                          </div>

                          {/* Address fields if delivery */}
                          {editOrderForm.delivery_type === 'delivery' && (
                            <div className="admin-modal-edit-grid-3col" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '10px', marginBottom: '12px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>
                                  {t.orders.streetLabel}
                                </label>
                                <input
                                  type="text"
                                  value={editOrderForm.street}
                                  onChange={(e) => handleOrderFieldChange('street', e.target.value)}
                                  style={{ width: '100%', background: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', color: '#ffffff', fontSize: '13px' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>
                                  {t.orders.zipCityLabel}
                                </label>
                                <input
                                  type="text"
                                  value={editOrderForm.zip_city}
                                  onChange={(e) => handleOrderFieldChange('zip_city', e.target.value)}
                                  style={{ width: '100%', background: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', color: '#ffffff', fontSize: '13px' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>
                                  {t.orders.deliveryFeeLabel}
                                </label>
                                <input
                                  type="number"
                                  step="0.50"
                                  min="0"
                                  value={editOrderForm.delivery_fee}
                                  onChange={(e) => handleOrderFieldChange('delivery_fee', e.target.value)}
                                  style={{ width: '100%', background: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', color: '#4ade80', fontSize: '13px', fontWeight: '700' }}
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>
                              {t.orders.noteLabel}
                            </label>
                            <input
                              type="text"
                              value={editOrderForm.note}
                              onChange={(e) => handleOrderFieldChange('note', e.target.value)}
                              placeholder="z.B. Bitte bei Müller klingeln..."
                              style={{ width: '100%', background: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', color: '#ffffff', fontSize: '13px' }}
                            />
                          </div>
                        </div>

                        {/* Order Items Editor */}
                        <div style={{ background: '#0b0f19', padding: '18px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
                            {t.orders.itemsInDetail} ({(editOrderForm.order_items || []).length})
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(editOrderForm.order_items || []).map((item, idx) => {
                              const rawToppings = Array.isArray(item.toppings_selected) && item.toppings_selected.length > 0
                                ? item.toppings_selected
                                : Array.isArray(item.selectedToppings) && item.selectedToppings.length > 0
                                ? item.selectedToppings
                                : typeof item.toppings_selected === 'string' && item.toppings_selected
                                ? [item.toppings_selected]
                                : [];

                              let sideDishVal = item.side_dish || item.sideDish || item.selectedSide || null;
                              let dressingVal = item.dressing || item.selectedDressing || null;
                              const pureExtras = [];

                              rawToppings.forEach(top => {
                                const str = typeof top === 'string' ? top : (top?.name || top?.id || String(top));
                                if (/^beilage:\s*/i.test(str)) {
                                  if (!sideDishVal) sideDishVal = str.replace(/^beilage:\s*/i, '').trim();
                                } else if (/^dressing:\s*/i.test(str)) {
                                  if (!dressingVal) dressingVal = str.replace(/^dressing:\s*/i, '').trim();
                                } else {
                                  pureExtras.push(str);
                                }
                              });

                              return (
                              <div key={idx} style={{
                                background: '#131b2e',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>{item.item_name}</span>
                                    {item.selected_size && (
                                      <span style={{
                                        background: '#0b0f19',
                                        color: '#38bdf8',
                                        border: '1px solid #0284c7',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                      }}>
                                        {item.selected_size}
                                      </span>
                                    )}
                                    {sideDishVal && (
                                      <span style={{
                                        background: 'rgba(225, 29, 72, 0.2)',
                                        color: '#fb7185',
                                        border: '1px solid rgba(225, 29, 72, 0.4)',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10.5px',
                                        fontWeight: '800'
                                      }}>
                                        🍟 Beilage: {sideDishVal}
                                      </span>
                                    )}
                                    {dressingVal && (
                                      <span style={{
                                        background: 'rgba(22, 163, 74, 0.2)',
                                        color: '#4ade80',
                                        border: '1px solid rgba(34, 197, 94, 0.4)',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10.5px',
                                        fontWeight: '800'
                                      }}>
                                        🥗 Dressing: {dressingVal}
                                      </span>
                                    )}
                                  </div>
                                  {pureExtras.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                      {pureExtras.map((extraName, tIdx) => {
                                        const isGratis = extraName.includes('(gratis)');
                                        return (
                                          <span
                                            key={tIdx}
                                            style={{
                                              background: isGratis ? 'rgba(22, 163, 74, 0.2)' : '#1e293b',
                                              color: isGratis ? '#86efac' : '#fde68a',
                                              fontSize: '10.5px',
                                              padding: '1px 5px',
                                              borderRadius: '4px',
                                              border: isGratis ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid #334155'
                                            }}
                                          >
                                            +{extraName}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                                    {(Number(item.unit_price) || 0).toFixed(2).replace('.', ',')} € / {lang === 'de' ? 'Stück' : 'unit'}
                                  </div>
                                </div>

                                {/* Qty Stepper */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOrderItemQtyChange(idx, -1)}
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '6px',
                                      background: '#1e293b',
                                      color: '#ffffff',
                                      border: '1px solid #334155',
                                      cursor: 'pointer',
                                      fontWeight: '800',
                                      fontSize: '14px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    -
                                  </button>
                                  <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '800', fontSize: '14px', color: '#ffffff' }}>
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOrderItemQtyChange(idx, 1)}
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '6px',
                                      background: '#1e293b',
                                      color: '#ffffff',
                                      border: '1px solid #334155',
                                      cursor: 'pointer',
                                      fontWeight: '800',
                                      fontSize: '14px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Line Total */}
                                <div style={{ minWidth: '70px', textAlign: 'right', fontWeight: '800', fontSize: '14px', color: '#4ade80' }}>
                                  {(Number(item.total_price) || (Number(item.unit_price) * item.quantity) || 0).toFixed(2).replace('.', ',')} €
                                </div>

                                {/* Remove Item Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOrderItem(idx)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title={t.orders.removeItemBtn}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          })}

                            {(!editOrderForm.order_items || editOrderForm.order_items.length === 0) && (
                              <div style={{ textAlign: 'center', padding: '16px', color: '#f87171', fontSize: '12.5px' }}>
                                {t.orders.emptyOrderWarn}
                              </div>
                            )}
                          </div>

                          {/* Add Dish to Order Box */}
                          <div style={{
                            marginTop: '16px',
                            padding: '14px',
                            background: '#131b2e',
                            borderRadius: '10px',
                            border: '1px dashed #334155'
                          }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Plus size={14} /> {t.orders.addDishToOrder}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 0.6fr auto', gap: '8px', alignItems: 'center' }}>
                              {/* Dish Select */}
                              <select
                                value={addDishToOrderSelect}
                                onChange={(e) => {
                                  setAddDishToOrderSelect(e.target.value);
                                  setAddDishToOrderSize('');
                                }}
                                style={{
                                  background: '#0b0f19',
                                  border: '1px solid #334155',
                                  borderRadius: '8px',
                                  padding: '8px 10px',
                                  color: '#ffffff',
                                  fontSize: '12.5px'
                                }}
                              >
                                <option value="">{t.orders.selectDishPrompt}</option>
                                {menuItems.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.number ? `${m.number}. ` : ''}{m.name_de || m.name} ({typeof m.price === 'number' ? `${m.price.toFixed(2)} €` : 'ab 9,00 €'})
                                  </option>
                                ))}
                              </select>

                              {/* Size Select (if dish selected) */}
                              <select
                                value={addDishToOrderSize}
                                onChange={(e) => setAddDishToOrderSize(e.target.value)}
                                disabled={!addDishToOrderSelect}
                                style={{
                                  background: '#0b0f19',
                                  border: '1px solid #334155',
                                  borderRadius: '8px',
                                  padding: '8px 10px',
                                  color: '#ffffff',
                                  fontSize: '12.5px',
                                  opacity: addDishToOrderSelect ? 1 : 0.5
                                }}
                              >
                                <option value="">{t.orders.portionLabel} (Standard)</option>
                                {(() => {
                                  const sel = menuItems.find(m => String(m.id) === String(addDishToOrderSelect));
                                  if (!sel) return null;
                                  const opts = [];
                                  if (sel.prices?.small) opts.push(<option key="small" value="small">Klein - {Number(sel.prices.small).toFixed(2)} €</option>);
                                  if (sel.prices?.large) opts.push(<option key="large" value="large">Groß - {Number(sel.prices.large).toFixed(2)} €</option>);
                                  if (sel.prices?.family) opts.push(<option key="family" value="family">Familie - {Number(sel.prices.family).toFixed(2)} €</option>);
                                  if (sel.prices?.party) opts.push(<option key="party" value="party">Party - {Number(sel.prices.party).toFixed(2)} €</option>);

                                  const csList = Array.isArray(sel.custom_sizes)
                                    ? sel.custom_sizes
                                    : (Array.isArray(sel.prices?.custom_sizes) ? sel.prices.custom_sizes : []);
                                  csList.forEach(cs => {
                                    if (cs.enabled) {
                                      opts.push(<option key={cs.id} value={cs.id}>{cs.name} {cs.dim ? `(${cs.dim})` : ''} - {Number(cs.price || 0).toFixed(2)} €</option>);
                                    }
                                  });
                                  return opts;
                                })()}
                              </select>

                              {/* Qty Input */}
                              <input
                                type="number"
                                min="1"
                                value={addDishToOrderQty}
                                onChange={(e) => setAddDishToOrderQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                style={{
                                  width: '55px',
                                  background: '#0b0f19',
                                  border: '1px solid #334155',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  color: '#ffffff',
                                  fontSize: '13px',
                                  textAlign: 'center'
                                }}
                              />

                              {/* Add Button */}
                              <button
                                type="button"
                                onClick={handleAddDishToOrder}
                                style={{
                                  background: '#0284c7',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '8px 14px',
                                  fontSize: '12.5px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Plus size={14} /> {t.orders.addDishBtn}
                              </button>
                            </div>
                          </div>

                          {/* Financial Totals Live Recalculation */}
                          {(() => {
                            const subtotal = (editOrderForm.order_items || []).reduce((sum, it) => sum + ((Number(it.unit_price) || 0) * (Number(it.quantity) || 1)), 0);
                            const deliveryFee = editOrderForm.delivery_type === 'delivery' ? (Number(editOrderForm.delivery_fee) || 0.00) : 0;
                            const total = subtotal + deliveryFee;
                            return (
                              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #334155', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                  <span>{t.orders.subtotal}</span>
                                  <span>{subtotal.toFixed(2).replace('.', ',')} €</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                  <span>{t.orders.deliveryFee}</span>
                                  <span>{deliveryFee.toFixed(2).replace('.', ',')} €</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontWeight: '800', fontSize: '16px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #1e293b' }}>
                                  <span>{t.orders.totalInvoice}</span>
                                  <span style={{ color: '#4ade80' }}>{total.toFixed(2).replace('.', ',')} €</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Save Changes & Cancel Buttons */}
                          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                            <button
                              type="button"
                              onClick={handleSaveEditedOrder}
                              style={{
                                flex: 1,
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '11px 16px',
                                fontSize: '13.5px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              <Check size={16} /> {t.orders.saveOrder}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditOrder}
                              style={{
                                background: '#1e293b',
                                color: '#94a3b8',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '11px 16px',
                                fontSize: '13.5px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {t.orders.cancelEdit}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Customer Details Box */}
                        <div style={{ background: isLight ? '#f8fafc' : '#0b0f19', padding: '16px', borderRadius: '12px', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b' }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: isLight ? '#475569' : '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
                            {t.orders.customerAddress}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px' }}>
                            <div style={{ fontWeight: '700', color: isLight ? '#0f172a' : '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <User size={15} color="#e11d48" /> {selectedOrder.customer_name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Phone size={15} color={isLight ? '#0284c7' : '#38bdf8'} />
                              <a href={`tel:${selectedOrder.customer_phone}`} style={{ color: isLight ? '#0284c7' : '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
                                {selectedOrder.customer_phone}
                              </a>
                            </div>
                            {selectedOrder.delivery_type === 'delivery' ? (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: isLight ? '#475569' : '#cbd5e1' }}>
                                <MapPin size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>{selectedOrder.street || 'Bahnhofstraße 14'}, {selectedOrder.zip_city || '08525 Plauen'}</span>
                              </div>
                            ) : (
                              <div style={{ color: isLight ? '#15803d' : '#34d399', fontWeight: '700' }}>
                                {t.orders.pickupInStore}
                              </div>
                            )}
                            {selectedOrder.note && (
                              <div style={{ marginTop: '8px', background: isLight ? '#fffbeb' : '#1e293b', border: isLight ? '1px solid #fde68a' : 'none', padding: '8px 12px', borderRadius: '8px', color: isLight ? '#b45309' : '#fde047', fontSize: '12.5px' }}>
                                <strong>{t.orders.note}:</strong> {selectedOrder.note}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Itemized Order Breakdown */}
                        <div style={{ background: isLight ? '#f8fafc' : '#0b0f19', padding: '16px', borderRadius: '12px', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b' }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: isLight ? '#475569' : '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
                            {t.orders.itemsInDetail}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(selectedOrder.order_items || []).map((item, idx) => {
                              const rawToppings = Array.isArray(item.toppings_selected) && item.toppings_selected.length > 0
                                ? item.toppings_selected
                                : Array.isArray(item.selectedToppings) && item.selectedToppings.length > 0
                                ? item.selectedToppings
                                : typeof item.toppings_selected === 'string' && item.toppings_selected
                                ? [item.toppings_selected]
                                : [];

                              let sideDishVal = item.side_dish || item.sideDish || item.selectedSide || null;
                              let dressingVal = item.dressing || item.selectedDressing || null;
                              const pureExtras = [];

                              rawToppings.forEach(top => {
                                const str = typeof top === 'string' ? top : (top?.name || top?.id || String(top));
                                if (/^beilage:\s*/i.test(str)) {
                                  if (!sideDishVal) sideDishVal = str.replace(/^beilage:\s*/i, '').trim();
                                } else if (/^dressing:\s*/i.test(str)) {
                                  if (!dressingVal) dressingVal = str.replace(/^dressing:\s*/i, '').trim();
                                } else {
                                  pureExtras.push(str);
                                }
                              });

                              return (
                              <div key={idx} style={{
                                background: isLight ? '#ffffff' : '#131b2e',
                                padding: '12px',
                                borderRadius: '8px',
                                border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                    <span style={{ fontWeight: '800', fontSize: '14px', color: isLight ? '#0f172a' : '#f8fafc' }}>
                                      <strong style={{ color: '#e11d48' }}>{item.quantity}x</strong> {item.item_name}
                                    </span>
                                    {item.selected_size && (
                                      <span style={{
                                        background: isLight ? '#f1f5f9' : '#0b0f19',
                                        color: isLight ? '#0284c7' : '#38bdf8',
                                        border: isLight ? '1px solid #cbd5e1' : '1px solid #0284c7',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                      }}>
                                        {item.selected_size}
                                      </span>
                                    )}
                                    {sideDishVal && (
                                      <span style={{
                                        background: isLight ? '#fff1f2' : 'rgba(225, 29, 72, 0.2)',
                                        color: '#e11d48',
                                        border: isLight ? '1px solid #fecdd3' : '1px solid rgba(225, 29, 72, 0.4)',
                                        padding: '2px 7px',
                                        borderRadius: '4px',
                                        fontSize: '11.5px',
                                        fontWeight: '800'
                                      }}>
                                        🍟 Beilage: {sideDishVal}
                                      </span>
                                    )}
                                    {dressingVal && (
                                      <span style={{
                                        background: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.2)',
                                        color: isLight ? '#15803d' : '#4ade80',
                                        border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(34, 197, 94, 0.4)',
                                        padding: '2px 7px',
                                        borderRadius: '4px',
                                        fontSize: '11.5px',
                                        fontWeight: '800'
                                      }}>
                                        🥗 Dressing: {dressingVal}
                                      </span>
                                    )}
                                    {item.is_american && (
                                      <span style={{
                                        background: isLight ? '#fef9c3' : 'rgba(253, 224, 71, 0.15)',
                                        color: isLight ? '#854d0e' : '#fde047',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                      }}>
                                        {t.orders.americanCheeseCrust}
                                      </span>
                                    )}
                                  </div>

                                  <span style={{ fontWeight: '800', fontSize: '14px', color: isLight ? '#16a34a' : '#4ade80' }}>
                                    {(Number(item.total_price) || (Number(item.unit_price) * item.quantity) || 0).toFixed(2).replace('.', ',')} €
                                  </span>
                                </div>

                                {/* Selected Extra Toppings & Add-ons */}
                                {pureExtras.length > 0 && (
                                  <div style={{
                                    fontSize: '12px',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: '5px',
                                    marginTop: '5px',
                                    background: isLight ? '#fffbeb' : 'rgba(217, 119, 6, 0.15)',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: isLight ? '1px solid #fde68a' : '1px solid rgba(217, 119, 6, 0.3)'
                                  }}>
                                    <span style={{ fontWeight: '800', color: isLight ? '#92400e' : '#fde68a', fontSize: '11.5px' }}>
                                      {t.orders.extrasLabel}:
                                    </span>
                                    {pureExtras.map((extraName, tIdx) => {
                                      const isGratis = extraName.includes('(gratis)');
                                      return (
                                        <span
                                          key={tIdx}
                                          style={{
                                            background: isGratis
                                              ? (isLight ? '#dcfce7' : 'rgba(22, 163, 74, 0.25)')
                                              : (isLight ? '#fef3c7' : '#1e293b'),
                                            color: isGratis
                                              ? (isLight ? '#15803d' : '#86efac')
                                              : (isLight ? '#92400e' : '#fde68a'),
                                            border: isGratis
                                              ? (isLight ? '1.5px solid #86efac' : '1px solid rgba(34, 197, 94, 0.5)')
                                              : (isLight ? '1.5px solid #f59e0b' : '1px solid #d97706'),
                                            padding: '2px 8px',
                                            borderRadius: '5px',
                                            fontWeight: '800',
                                            fontSize: '11.5px'
                                          }}
                                        >
                                          +{extraName}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}

                                {item.special_instructions && (
                                  <div style={{ fontSize: '12px', color: isLight ? '#b45309' : '#fde047', fontStyle: 'italic' }}>
                                    {t.orders.specialWish} "{item.special_instructions}"
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          </div>

                          {/* Financial Totals */}
                          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: isLight ? '1px dashed #cbd5e1' : '1px dashed #334155', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8' }}>
                              <span>{t.orders.subtotal}</span>
                              <span style={{ fontWeight: '600' }}>{(Number(selectedOrder.subtotal) || (Number(selectedOrder.total) - Number(selectedOrder.delivery_fee || 0))).toFixed(2).replace('.', ',')} €</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8' }}>
                              <span>{t.orders.deliveryFee}</span>
                              <span style={{ fontWeight: '600' }}>{(Number(selectedOrder.delivery_fee) || 0).toFixed(2).replace('.', ',')} €</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#0f172a' : '#ffffff', fontWeight: '800', fontSize: '16px', marginTop: '6px', paddingTop: '6px', borderTop: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b' }}>
                              <span>{t.orders.totalInvoice}</span>
                              <span style={{ color: isLight ? '#16a34a' : '#4ade80' }}>{(Number(selectedOrder.total) || 0).toFixed(2).replace('.', ',')} €</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RIGHT COLUMN: Payment Gateway Panel & Kitchen Management */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Payment Gateway Panel */}
                      <div style={{
                        background: isLight ? '#f8fafc' : '#0b0f19',
                        padding: '18px',
                        borderRadius: '12px',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                        boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 4px 20px rgba(0,0,0,0.3)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={18} color="#0284c7" />
                            <span style={{ fontSize: '13.5px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff' }}>
                              Payment Gateway Integration
                            </span>
                          </div>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '800',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: isLight ? '#ecfdf5' : '#065f46',
                            color: isLight ? '#047857' : '#34d399',
                            border: isLight ? '1px solid #a7f3d0' : 'none'
                          }}>
                            {t.orders.testReady}
                          </span>
                        </div>

                        {/* Current Payment Status Details */}
                        <div style={{
                          background: isLight ? '#ffffff' : '#131b2e',
                          padding: '14px',
                          borderRadius: '8px',
                          border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          fontSize: '13px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>{t.orders.paymentMethod}:</span>
                            <strong style={{ color: isLight ? '#0f172a' : '#f8fafc', textTransform: 'capitalize' }}>
                              {(selectedOrder.payment_method === 'sumup' || selectedOrder.payment_method === 'credit_card' || selectedOrder.payment_method === 'stripe')
                                ? (lang === 'de' ? 'SumUp Online (Kreditkarte/Apple Pay)' : 'SumUp Online (Card/Apple Pay)')
                                : (selectedOrder.payment_method === 'sumup_terminal' || selectedOrder.payment_method === 'ec_card')
                                ? (lang === 'de' ? 'SumUp Kartenterminal an Haustür' : 'SumUp Card Terminal at Door')
                                : selectedOrder.payment_method === 'paypal'
                                ? 'PayPal Express'
                                : (lang === 'de' ? 'Barzahlung bei Zustellung (COD)' : 'Cash upon Delivery (COD)')}
                            </strong>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>{t.orders.paymentStatus}:</span>
                            <span style={{
                              fontWeight: '800',
                              fontSize: '11.5px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: selectedOrder.payment_status === 'paid' ? (isLight ? '#dcfce7' : '#065f46') : selectedOrder.payment_status === 'refunded' ? (isLight ? '#fee2e2' : '#7f1d1d') : (isLight ? '#fef3c7' : '#854d0e'),
                              color: selectedOrder.payment_status === 'paid' ? (isLight ? '#15803d' : '#34d399') : selectedOrder.payment_status === 'refunded' ? (isLight ? '#dc2626' : '#f87171') : (isLight ? '#b45309' : '#fde047'),
                              border: isLight ? (selectedOrder.payment_status === 'paid' ? '1px solid #86efac' : selectedOrder.payment_status === 'refunded' ? '1px solid #fca5a5' : '1px solid #fde68a') : 'none'
                            }}>
                              {selectedOrder.payment_status === 'paid'
                                ? (lang === 'de' ? 'BEZAHLT (SUCCESS)' : 'PAID (SUCCESS)')
                                : selectedOrder.payment_status === 'refunded'
                                ? (lang === 'de' ? 'RÜCKERSTATTET' : 'REFUNDED')
                                : (lang === 'de' ? 'AUSSTEHEND' : 'PENDING')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>{t.orders.txId}</span>
                            <code style={{
                              color: isLight ? '#0369a1' : '#38bdf8',
                              fontSize: '11px',
                              background: isLight ? '#eff6ff' : '#0b0f19',
                              border: isLight ? '1px solid #bfdbfe' : 'none',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '700'
                            }}>
                              {selectedOrder.payment_id || `txn_${selectedOrder.id.slice(0, 10)}`}
                            </code>
                          </div>
                        </div>
                      </div>

                      {/* Kitchen & Order Preparation Management */}
                      <div style={{
                        background: isLight ? '#f8fafc' : '#0b0f19',
                        padding: '18px',
                        borderRadius: '12px',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                        boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : 'none'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: isLight ? '#475569' : '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
                          {t.orders.kitchenTitle}
                        </div>

                        {/* Status Change Buttons */}
                        {selectedOrder.status === 'delivered' ? (
                          <div style={{
                            background: isLight ? '#dcfce7' : 'rgba(22, 163, 74, 0.2)',
                            color: isLight ? '#15803d' : '#4ade80',
                            border: '1px solid rgba(22, 163, 74, 0.4)',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            fontWeight: '800',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '14px'
                          }}>
                            <CheckCircle2 size={18} />
                            <span>{t.orders.statusDelivered} • {lang === 'de' ? 'Bestellung erfolgreich abgeschlossen' : 'Order completed'}</span>
                          </div>
                        ) : selectedOrder.status === 'cancelled' ? (
                          <div style={{
                            background: isLight ? '#fee2e2' : 'rgba(225, 29, 72, 0.2)',
                            color: isLight ? '#b91c1c' : '#f87171',
                            border: '1px solid rgba(225, 29, 72, 0.4)',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            fontWeight: '800',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '14px'
                          }}>
                            <AlertCircle size={18} />
                            <span>{t.orders.statusCancelled} • {lang === 'de' ? 'Bestellung wurde storniert' : 'Order cancelled'}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}
                              style={{
                                background: selectedOrder.status === 'preparing' ? '#f59e0b' : '#1e293b',
                                color: selectedOrder.status === 'preparing' ? '#000000' : '#ffffff',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                padding: '10px 8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                            >
                              🔥 {t.orders.filterPreparing}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(selectedOrder.id, 'out_for_delivery')}
                              style={{
                                background: selectedOrder.status === 'out_for_delivery' ? '#0284c7' : '#1e293b',
                                color: '#ffffff',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                padding: '10px 8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                            >
                              {selectedOrder.delivery_type === 'pickup' ? '🛍️ Bereit zur Abholung' : `🛵 ${t.orders.filterDelivery}`}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: '1px solid #059669',
                                borderRadius: '6px',
                                padding: '10px 8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                gridColumn: 'span 2'
                              }}
                            >
                              ✓ {selectedOrder.delivery_type === 'pickup' ? 'Abgeholt (Picked Up)' : t.orders.filterDelivered}
                            </button>
                            {ordersTab === 'active' && ['new', 'preparing', 'out_for_delivery'].includes(selectedOrder.status) && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(lang === 'de'
                                    ? `Möchten Sie die Bestellung #${selectedOrder.order_number} wirklich stornieren?`
                                    : `Are you sure you want to cancel order #${selectedOrder.order_number}?`)) {
                                    handleStatusChange(selectedOrder.id, 'cancelled');
                                  }
                                }}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  border: '1px solid #ef4444',
                                  borderRadius: '6px',
                                  padding: '10px 8px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  gridColumn: 'span 2',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <X size={14} />
                                <span>{lang === 'de' ? 'Aktive Bestellung stornieren' : 'Cancel Active Order'}</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Prep time buttons */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                            {t.orders.prepTime}:
                          </label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[15, 20, 30, 45, 60].map(mins => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => handlePrepTimeChange(selectedOrder.id, mins)}
                                style={{
                                  flex: 1,
                                  background: selectedOrder.estimated_delivery_minutes === mins ? '#f59e0b' : '#1e293b',
                                  color: selectedOrder.estimated_delivery_minutes === mins ? '#000000' : '#ffffff',
                                  border: '1px solid #334155',
                                  borderRadius: '6px',
                                  padding: '6px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: MENU & STOCK MANAGEMENT (CATEGORIZED LIKE FRONTEND) */}
        {/* ================================================================== */}
        {activeTab === 'menu' && (
          <div>
            {/* Header & Add Button */}
            <div className="admin-menu-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: isLight ? '#0f172a' : '#ffffff' }}>{t.menu.title}</h2>
                <p style={{ fontSize: '13px', color: isLight ? '#475569' : '#94a3b8', margin: '4px 0 0' }}>{t.menu.subtitle}</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  style={{
                    background: isLight ? '#f1f5f9' : '#1e293b',
                    color: isLight ? '#0f172a' : '#f8fafc',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FolderPlus size={16} color="#e11d48" />
                  {lang === 'de' ? 'Kategorien verwalten / neu' : 'Manage / Add Categories'}
                </button>

                <button
                  onClick={() => {
                    resetDishForm();
                    setActiveTab('addItem');
                  }}
                  style={{
                    background: '#e11d48',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)'
                  }}
                >
                  <Plus size={16} />
                  {t.menu.addNewItem}
                </button>
              </div>
            </div>

            {/* Category Navigation Bar (Horizontal Scroll with Arrow Nav & Clean Badges) */}
            <div className="admin-cat-nav-wrapper" style={{ position: 'relative', marginBottom: '18px' }}>
              {/* Left Scroll Button */}
              {canScrollCatLeft && (
                <button
                  type="button"
                  onClick={() => scrollAdminCat('left')}
                  aria-label="Kategorien nach links scrollen"
                  title="Nach links scrollen"
                  style={{
                    position: 'absolute',
                    left: '-10px',
                    top: '50%',
                    transform: 'translateY(-65%)',
                    zIndex: 10,
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: isLight ? '#ffffff' : '#1e293b',
                    color: isLight ? '#0f172a' : '#ffffff',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
              )}

              {/* Right Scroll Button */}
              {canScrollCatRight && (
                <button
                  type="button"
                  onClick={() => scrollAdminCat('right')}
                  aria-label="Kategorien nach rechts scrollen"
                  title="Nach rechts scrollen"
                  style={{
                    position: 'absolute',
                    right: '-10px',
                    top: '50%',
                    transform: 'translateY(-65%)',
                    zIndex: 10,
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: isLight ? '#ffffff' : '#1e293b',
                    color: isLight ? '#0f172a' : '#ffffff',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              )}

              <div
                ref={adminCatTrackRef}
                onScroll={checkAdminCatScroll}
                className="admin-category-scroll-bar"
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  padding: '6px 4px 14px 4px',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {activeFrontendCategories.map(cat => {
                  const isSelected = selectedCategoryTab === cat.id;
                  const count = getCatCount(cat.id);
                  const emoji = cat.icon || CATEGORY_EMOJIS[cat.id] || '🍽️';
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className="admin-cat-pill"
                      onClick={(e) => {
                        setSelectedCategoryTab(cat.id);
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      }}
                      style={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        padding: '9px 18px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: isSelected ? '700' : '600',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.18s ease',
                        background: isSelected ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' : (isLight ? '#ffffff' : '#131b2e'),
                        color: isSelected ? '#ffffff' : (isLight ? '#1e293b' : '#cbd5e1'),
                        border: isSelected ? '1px solid #e11d48' : (isLight ? '1px solid #e2e8f0' : '1px solid #1e293b'),
                        boxShadow: isSelected ? '0 4px 14px rgba(225, 29, 72, 0.35)' : (isLight ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none')
                      }}
                    >
                      <span style={{ fontSize: '15px', lineHeight: 1 }}>{emoji}</span>
                      <span>{lang === 'de' ? cat.name_de : (cat.name_en || cat.name_de)}</span>
                      <span
                        className="admin-cat-pill-badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '22px',
                          height: '20px',
                          padding: '0 6px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: '800',
                          lineHeight: 1,
                          flexShrink: 0,
                          background: isSelected ? 'rgba(255, 255, 255, 0.25)' : (isLight ? '#f1f5f9' : '#1e293b'),
                          color: isSelected ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                          border: isSelected ? 'none' : (isLight ? '1px solid #e2e8f0' : '1px solid #334155')
                        }}
                      >
                        {count}
                      </span>
                      {isSelected && cat.id !== 'all' && (
                        <span
                          role="button"
                          title={`${cat.name_de || cat.name} löschen`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat.id);
                          }}
                          style={{
                            marginLeft: '2px',
                            padding: '3px 5px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.28)',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="admin-menu-search-bar" style={{
              background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#131b2e',
              padding: '12px 16px',
              borderRadius: '10px',
              display: 'flex',
              gap: '12px',
              marginBottom: '20px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
              boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.02)' : 'none'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} color={isLight ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  placeholder={t.menu.searchPlaceholder}
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: isLight ? '#ffffff' : '#0b0f19',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '8px 12px 8px 36px',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Menu Items Cards Grid */}
            <div className="admin-menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
              {filteredMenuItems.map(item => {
                const inStock = item.is_in_stock !== false;
                const imgSrc = getDishImage(item);
                const itemCatId = getItemCanonicalCategory(item);
                const itemCatObj = activeFrontendCategories.find(c => c.id === itemCatId);
                const itemCatName = itemCatObj ? (lang === 'de' ? itemCatObj.name_de : (itemCatObj.name_en || itemCatObj.name_de)) : itemCatId;

                return (
                  <div
                    key={item.id}
                    className="admin-menu-card"
                    style={{
                      background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
                      borderRadius: '12px',
                      border: isLight ? '1px solid #e2e8f0' : `1px solid ${inStock ? '#1e293b' : '#7f1d1d'}`,
                      boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.03)' : 'none',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      opacity: inStock ? 1 : 0.7,
                      transition: 'all 0.2s ease',
                      color: isLight ? '#0f172a' : '#f8fafc'
                    }}
                  >
                    {/* Top Row: Thumbnail, Number, Name, Category */}
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{
                        position: 'relative',
                        width: '68px',
                        height: '68px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: isLight ? '#f1f5f9' : '#0b0f19',
                        flexShrink: 0,
                        border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b'
                      }}>
                        <img
                          src={imgSrc}
                          alt={item.name_de || item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {item.number && (
                          <span style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '2px',
                            background: '#e11d48',
                            color: '#ffffff',
                            fontWeight: '900',
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            #{item.number}
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: isLight ? '#0f172a' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name_de || item.name}
                          </h3>
                          {item.badge && (
                            <span style={{
                              background: '#f59e0b',
                              color: '#000000',
                              fontSize: '10px',
                              fontWeight: '800',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              flexShrink: 0
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: '12px', color: isLight ? '#475569' : '#94a3b8', margin: '4px 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.toppings_de || item.toppings || item.desc_de || item.desc || ''}
                        </p>

                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span className="dish-category-badge" style={{
                            background: isLight ? '#eff6ff' : '#0b0f19',
                            color: isLight ? '#1d4ed8' : '#38bdf8',
                            border: isLight ? '1px solid #93c5fd' : 'none',
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '2px 8px',
                            borderRadius: '5px',
                            letterSpacing: '0.3px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}>
                            {itemCatName}
                          </span>
                          {(item.sizes_available || item.sizesAvailable) && (
                            <span style={{ background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)', color: isLight ? '#0369a1' : '#38bdf8', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                              {t.menu.sizes4}
                            </span>
                          )}
                          {(item.calzone_sizes || item.calzoneSizes) && (
                            <span style={{ background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)', color: isLight ? '#0369a1' : '#38bdf8', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                              {t.menu.sizes2}
                            </span>
                          )}
                          {item.supports_american && (
                            <span style={{ background: isLight ? '#fef9c3' : 'rgba(253, 224, 71, 0.15)', color: isLight ? '#854d0e' : '#fde047', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                              {t.menu.americanCrust}
                            </span>
                          )}
                          {item.dietary?.includes('vegetarisch') && (
                            <span style={{ background: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)', color: isLight ? '#15803d' : '#34d399', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                              {t.menu.vegetarian}
                            </span>
                          )}
                          {item.dietary?.includes('vegan') && (
                            <span style={{ background: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.25)', color: isLight ? '#166534' : '#10b981', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                              {t.menu.vegan}
                            </span>
                          )}
                          {item.dietary?.includes('scharf') && (
                            <span style={{ background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)', color: isLight ? '#b91c1c' : '#f87171', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                              {t.menu.spicy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price Display */}
                    <div style={{
                      background: isLight ? '#f8fafc' : '#0b0f19',
                      border: isLight ? '1px solid #e2e8f0' : 'none',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <span style={{ color: isLight ? '#0f172a' : '#cbd5e1' }}>{t.menu.unitPriceLabel} <strong style={{ color: isLight ? '#16a34a' : '#4ade80', fontSize: '13.5px', fontWeight: '800' }}>{(Number(item.price || item.prices?.single || item.prices?.small || 0)).toFixed(2).replace('.', ',')} €</strong></span>

                      {/* Prep time inline adjuster */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                        <Clock size={13} color="#f59e0b" />
                        <span style={{ color: isLight ? '#334155' : '#cbd5e1', fontSize: '11.5px', fontWeight: '600' }}>
                          {item.preparation_time_minutes || 20}m
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const curr = Number(item.preparation_time_minutes) || 20;
                            handleItemPrepTimeChange(item.id, Math.max(5, curr - 5));
                          }}
                          title={lang === 'de' ? '-5 Min.' : '-5 min.'}
                          style={{ background: isLight ? '#ffffff' : '#1e293b', color: isLight ? '#0f172a' : '#cbd5e1', border: isLight ? '1px solid #cbd5e1' : 'none', borderRadius: '4px', width: '18px', height: '18px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const curr = Number(item.preparation_time_minutes) || 20;
                            handleItemPrepTimeChange(item.id, curr + 5);
                          }}
                          title={lang === 'de' ? '+5 Min.' : '+5 min.'}
                          style={{ background: isLight ? '#ffffff' : '#1e293b', color: isLight ? '#0f172a' : '#cbd5e1', border: isLight ? '1px solid #cbd5e1' : 'none', borderRadius: '4px', width: '18px', height: '18px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Footer Actions: Instant Stock Toggle + Edit / Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: 'auto', paddingTop: '4px' }}>
                      {/* Stock Switcher */}
                      <button
                        onClick={() => handleToggleStock(item.id, inStock)}
                        style={{
                          flex: 1,
                          background: inStock ? (isLight ? '#ecfdf5' : '#065f46') : (isLight ? '#fef2f2' : '#7f1d1d'),
                          color: inStock ? (isLight ? '#047857' : '#34d399') : (isLight ? '#b91c1c' : '#f87171'),
                          border: `1px solid ${inStock ? (isLight ? '#a7f3d0' : '#059669') : (isLight ? '#fecaca' : '#b91c1c')}`,
                          borderRadius: '8px',
                          padding: '7px 12px',
                          fontSize: '12.5px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {inStock ? <PackageCheck size={15} /> : <PackageX size={15} />}
                        <span>{inStock ? t.menu.inStock : t.menu.outOfStock}</span>
                      </button>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          title={t.menu.edit}
                          style={{
                            background: isLight ? '#ffffff' : '#1e293b',
                            color: isLight ? '#0f172a' : '#cbd5e1',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                            borderRadius: '8px',
                            padding: '7px 12px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={14} />
                          <span>{t.menu.edit}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteDish(item.id)}
                          title={t.menu.delete}
                          style={{
                            background: isLight ? '#ffffff' : '#1e293b',
                            color: isLight ? '#dc2626' : '#f87171',
                            border: isLight ? '1px solid #fca5a5' : '1px solid #334155',
                            borderRadius: '8px',
                            padding: '7px 10px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: ADD / EDIT DISH FORM (WITH IMAGE PICKER & EXACT ADD-ONS) */}
        {/* ================================================================== */}
        {/* ================================================================== */}
        {/* TAB 3: ADD / EDIT DISH FORM (MODERN REDESIGNED STUDIO UI) */}
        {/* ================================================================== */}
        {activeTab === 'addItem' && (() => {
          const isEditing = !!editingItem;
          const isCalzone = dishForm.category_id === 'calzone';
          const isDeal = dishForm.category_id === 'deals' || dishForm.id?.startsWith('A') || dishForm.id?.startsWith('offer-');

          const currentCatObj = activeFrontendCategories.find(c => c.id === dishForm.category_id) || { name_de: 'Pizzen', name_en: 'Pizzas' };
          const categoryTitle = lang === 'de' ? currentCatObj.name_de : (currentCatObj.name_en || currentCatObj.name_de);

          const sizeDefinitions = isCalzone ? calzoneSizes : standardPizzaSizes;
          const standardEnabledSizes = dishForm.has_sizes
            ? sizeDefinitions.filter(s => dishForm.sizes_config?.[s.key]?.enabled).map(s => ({
                key: s.key,
                name: SIZE_NAMES[s.key]?.[lang] || s.name,
                dim: s.dim,
                price: dishForm.sizes_config?.[s.key]?.price || '9.00',
                isCustom: false
              }))
            : [];

          const customEnabledSizes = (dishForm.custom_sizes || []).filter(cs => cs.enabled !== false && cs.name).map(cs => ({
            key: cs.id,
            name: cs.name,
            dim: cs.dim || '',
            price: cs.price || '9.00',
            isCustom: true
          }));

          const allPreviewSizes = [...standardEnabledSizes, ...customEnabledSizes];

          const activePreviewSizeObj = allPreviewSizes.find(s => s.key === previewSizeKey) || allPreviewSizes[0];
          const effectivePreviewSizeKey = activePreviewSizeObj?.key || 'small';

          const previewUnitPrice = activePreviewSizeObj
            ? (Number(activePreviewSizeObj.price || 9.00).toFixed(2).replace('.', ','))
            : (Number(dishForm.price || 9.00).toFixed(2).replace('.', ','));

          const filteredPresets = presetFilterCategory === 'all'
            ? PRESET_IMAGES
            : PRESET_IMAGES.filter(p => p.category === presetFilterCategory || (presetFilterCategory === 'pizza' && !p.category));

          const combinedCustomMap = new Map();
          (customToppingsList || []).forEach(ct => {
            if (ct?.id && !deletedCustomToppingIds.has(ct.id)) combinedCustomMap.set(ct.id, ct);
          });
          (dishForm.custom_toppings || []).forEach(ct => {
            if (ct?.id && !deletedCustomToppingIds.has(ct.id)) combinedCustomMap.set(ct.id, ct);
          });
          (editingItem?.custom_toppings || []).forEach(ct => {
            if (ct?.id && !deletedCustomToppingIds.has(ct.id)) combinedCustomMap.set(ct.id, ct);
          });
          (editingItem?.prices?.custom_toppings || []).forEach(ct => {
            if (ct?.id && !deletedCustomToppingIds.has(ct.id)) combinedCustomMap.set(ct.id, ct);
          });

          const allToppingsCatalog = [
            ...pizzaExtraToppingsList,
            ...Array.from(combinedCustomMap.values()).map(ct => ({
              id: ct.id,
              name: ct.name,
              price: ct.price,
              isCustom: true
            }))
          ];

          const filteredExtraToppings = toppingsFilterQuery.trim()
            ? allToppingsCatalog.filter(t => {
                const localizedName = EXTRA_TOPPINGS_TRANSLATIONS[t.id]?.[lang] || t.name;
                return t.name.toLowerCase().includes(toppingsFilterQuery.toLowerCase()) ||
                       localizedName.toLowerCase().includes(toppingsFilterQuery.toLowerCase());
              })
            : allToppingsCatalog;

          return (
            <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* TOP HEADER / ACTION BAR */}
              <div
                className="admin-studio-top-bar"
                style={{
                  background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
                  borderRadius: '16px',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                  padding: '16px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.04)' : '0 4px 20px rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(16px)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {/* Fixed Single-Icon Back Button */}
                  <button
                    type="button"
                    onClick={() => { setEditingItem(null); setActiveTab('menu'); }}
                    style={{
                      background: isLight ? '#0f172a' : '#1e293b',
                      color: '#ffffff',
                      border: isLight ? 'none' : '1px solid #0284c7',
                      borderRadius: '10px',
                      padding: '9px 16px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: isLight ? '0 2px 8px rgba(15, 23, 42, 0.15)' : '0 2px 8px rgba(2, 132, 199, 0.2)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = '#ffffff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isLight ? '#0f172a' : '#1e293b'; e.currentTarget.style.color = '#ffffff'; }}
                  >
                    <ArrowLeft size={16} color="#ffffff" />
                    <span style={{ color: '#ffffff', fontWeight: '800' }}>{t.form.backToMenu}</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isLight ? '#64748b' : '#94a3b8', fontSize: '13px', fontWeight: '500', flexWrap: 'wrap' }}>
                    <span style={{ color: isLight ? '#475569' : '#64748b' }}>{t.tabs.menu}</span>
                    <span>/</span>
                    <span style={{ color: isLight ? '#334155' : '#cbd5e1' }}>{categoryTitle}</span>
                    <span>/</span>
                    <span style={{ color: isLight ? '#0f172a' : '#ffffff', fontWeight: '800' }}>
                      {dishForm.name ? dishForm.name : (isEditing ? t.form.editTitle : t.form.createNewDish)}
                    </span>
                  </div>
                </div>

                {/* Right Top Status & Quick Save */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {isEditing ? (
                    <span style={{
                      background: dishForm.is_in_stock ? (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)') : (isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)'),
                      color: dishForm.is_in_stock ? (isLight ? '#15803d' : '#34d399') : (isLight ? '#dc2626' : '#f87171'),
                      border: `1px solid ${dishForm.is_in_stock ? (isLight ? '#86efac' : '#059669') : (isLight ? '#fca5a5' : '#b91c1c')}`,
                      borderRadius: '20px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dishForm.is_in_stock ? '#10b981' : '#ef4444' }} />
                      {dishForm.is_in_stock ? t.form.dishLive : t.form.dishSoldOut}
                    </span>
                  ) : (
                    <span style={{
                      background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)',
                      color: isLight ? '#0284c7' : '#38bdf8',
                      border: `1px solid ${isLight ? '#bae6fd' : '#0284c7'}`,
                      borderRadius: '20px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Sparkles size={13} />
                      {t.form.createNewDish}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => { setEditingItem(null); setActiveTab('menu'); }}
                    style={{
                      background: isLight ? '#ffffff' : '#1e293b',
                      color: isLight ? '#475569' : '#cbd5e1',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                      borderRadius: '10px',
                      padding: '9px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {t.form.cancelBtn}
                  </button>

                  <button
                    type="submit"
                    form="dish-editor-form"
                    style={{
                      background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 20px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)'
                    }}
                  >
                    <Check size={16} strokeWidth={3} />
                    <span>{isEditing ? t.form.saveChanges : t.form.saveBtn}</span>
                  </button>
                </div>
              </div>

              {/* EDITING HERO BANNER */}
              {isEditing ? (
                <div
                  className="admin-studio-hero-banner"
                  style={{
                    background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    flexWrap: 'wrap',
                    boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #e11d48',
                      flexShrink: 0,
                      background: isLight ? '#f1f5f9' : '#0b0f19'
                    }}>
                      <img
                        src={dishForm.image_url || '/images/pizza1.png'}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: '#e11d48',
                          color: '#ffffff',
                          fontWeight: '900',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {dishForm.number ? `#${dishForm.number}` : (lang === 'de' ? 'Nr. -' : 'No. -')}
                        </span>
                        <h2 style={{ fontSize: '19px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff', margin: 0 }}>
                          {dishForm.name || (lang === 'de' ? editingItem.name_de : editingItem.name_en) || editingItem.name}
                        </h2>
                        <span className="dish-category-badge" style={{
                          background: isLight ? '#eff6ff' : '#0b0f19',
                          color: isLight ? '#1d4ed8' : '#38bdf8',
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: isLight ? '1px solid #93c5fd' : '1px solid #1e293b'
                        }}>
                          {categoryTitle}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: isLight ? '#64748b' : '#94a3b8', margin: '4px 0 0' }}>
                        ID: <code style={{ color: isLight ? '#0284c7' : '#38bdf8' }}>{editingItem.id}</code> • {t.form.editHeroNote}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => resetDishForm()}
                    style={{
                      background: isLight ? '#ffffff' : '#1e293b',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid #475569',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} />
                    <span>{t.form.switchToNewDish}</span>
                  </button>
                </div>
              ) : (
                <div
                  className="admin-studio-hero-banner"
                  style={{
                    background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'linear-gradient(135deg, rgba(19, 27, 46, 0.9) 0%, rgba(11, 15, 25, 0.95) 100%)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                    boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : 'none',
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff', margin: 0 }}>
                      {t.form.addNewTitle}
                    </h2>
                    <p style={{ fontSize: '13px', color: isLight ? '#64748b' : '#94a3b8', margin: '4px 0 0' }}>
                      {t.form.addHeroSubtitle}
                    </p>
                  </div>
                </div>
              )}

              {/* TWO COLUMN STUDIO WORKSPACE */}
              <div
                className="admin-studio-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.45fr) minmax(350px, 420px)',
                  gap: '24px',
                  alignItems: 'start'
                }}
              >
                {/* ============================================================ */}
                {/* LEFT COLUMN: THE DISH CONFIGURATION FORM                     */}
                {/* ============================================================ */}
                <form
                  id="dish-editor-form"
                  onSubmit={handleSaveDish}
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  {/* CARD 1: BASIC INFORMATION */}
                  <div
                    className="admin-studio-card"
                    style={{
                      background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
                      borderRadius: '16px',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      padding: '24px',
                      boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : '0 4px 15px rgba(0, 0, 0, 0.15)',
                      backdropFilter: 'blur(16px)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(225, 29, 72, 0.15)',
                        color: '#f43f5e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Tag size={16} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff', margin: 0 }}>
                          {t.form.section1Title}
                        </h3>
                        <p style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8', margin: '2px 0 0' }}>
                          {t.form.section1Subtitle}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Number & Category */}
                      <div className="admin-studio-grid-1-2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: isLight ? '#0f172a' : '#cbd5e1' }}>
                            {t.form.number}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#e11d48', fontWeight: '900', fontSize: '13px' }}>
                              #
                            </span>
                            <input
                              type="text"
                              placeholder="1, 49a, A1..."
                              value={dishForm.number}
                              onChange={(e) => setDishForm({ ...dishForm, number: e.target.value })}
                              style={{
                                width: '100%',
                                background: isLight ? '#ffffff' : '#0b0f19',
                                border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                                borderRadius: '10px',
                                padding: '10px 12px 10px 28px',
                                color: isLight ? '#0f172a' : '#ffffff',
                                fontSize: '14px',
                                fontWeight: '700'
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: isLight ? '#0f172a' : '#cbd5e1' }}>
                            {t.form.category} *
                          </label>
                          <select
                            value={dishForm.category_id}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            style={{
                              width: '100%',
                              background: isLight ? '#ffffff' : '#0b0f19',
                              border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                              borderRadius: '10px',
                              padding: '10px 14px',
                              color: isLight ? '#0f172a' : '#ffffff',
                              fontSize: '13.5px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            {activeFrontendCategories.filter(c => c.id !== 'all').map(c => (
                              <option key={c.id} value={c.id}>
                                {c.icon || CATEGORY_EMOJIS[c.id] || '🍽️'} {lang === 'de' ? c.name_de : (c.name_en || c.name_de)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Name */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: isLight ? '#0f172a' : '#cbd5e1' }}>
                          {t.form.name} *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t.form.namePlaceholder}
                          value={dishForm.name}
                          onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                          style={{
                            width: '100%',
                            background: isLight ? '#ffffff' : '#0b0f19',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                            borderRadius: '10px',
                            padding: '11px 14px',
                            color: isLight ? '#0f172a' : '#ffffff',
                            fontSize: '15px',
                            fontWeight: '700'
                          }}
                        />
                      </div>

                      {/* Ingredients / Toppings */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12.5px', fontWeight: '700', color: isLight ? '#0f172a' : '#cbd5e1' }}>
                            {t.form.toppings}
                          </label>
                          <span style={{ fontSize: '11.5px', color: isLight ? '#64748b' : '#94a3b8' }}>
                            {t.form.toppingsHint}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder={t.form.toppingsPlaceholder}
                          value={dishForm.toppings}
                          onChange={(e) => setDishForm({ ...dishForm, toppings: e.target.value })}
                          style={{
                            width: '100%',
                            background: isLight ? '#ffffff' : '#0b0f19',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            color: isLight ? '#0f172a' : '#ffffff',
                            fontSize: '13.5px'
                          }}
                        />

                        {/* Quick-Add Ingredient Pills */}
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '11px', color: isLight ? '#475569' : '#64748b', fontWeight: '700', marginBottom: '6px' }}>
                            {t.form.quickAddHeading}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {COMMON_QUICK_INGREDIENTS.map(item => {
                              const ingName = lang === 'de' ? item.de : item.en;
                              const alreadyAdded = (dishForm.toppings || '').toLowerCase().includes(ingName.toLowerCase()) ||
                                                   (dishForm.toppings || '').toLowerCase().includes(item.de.toLowerCase());
                              return (
                                <button
                                  key={item.de}
                                  type="button"
                                  onClick={() => handleAddQuickTopping(ingName)}
                                  style={{
                                    background: alreadyAdded ? (isLight ? '#dcfce7' : '#064e3b') : (isLight ? '#f8fafc' : '#0b0f19'),
                                    color: alreadyAdded ? '#15803d' : (isLight ? '#334155' : '#94a3b8'),
                                    border: `1px solid ${alreadyAdded ? (isLight ? '#86efac' : '#10b981') : (isLight ? '#cbd5e1' : '#1e293b')}`,
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {alreadyAdded ? <Check size={11} strokeWidth={3} /> : <Plus size={11} />}
                                  <span>{ingName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: isLight ? '#0f172a' : '#cbd5e1' }}>
                          {t.form.desc}
                        </label>
                        <textarea
                          rows={2}
                          placeholder={t.form.descPlaceholder}
                          value={dishForm.desc}
                          onChange={(e) => setDishForm({ ...dishForm, desc: e.target.value })}
                          style={{
                            width: '100%',
                            background: isLight ? '#ffffff' : '#0b0f19',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            color: isLight ? '#0f172a' : '#ffffff',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: SIZES & PRICING */}
                  <div
                    className="admin-studio-card"
                    style={{
                      background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
                      borderRadius: '16px',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      padding: '24px',
                      boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : '0 4px 15px rgba(0, 0, 0, 0.15)',
                      backdropFilter: 'blur(16px)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff', margin: 0 }}>
                            {t.form.section2Title}
                          </h3>
                          <p style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8', margin: '2px 0 0' }}>
                            {dishForm.has_sizes ? t.form.section2SubtitleSizes : t.form.section2SubtitleSingle}
                          </p>
                        </div>
                      </div>

                      {/* Segmented Switch */}
                      <div style={{
                        display: 'flex',
                        background: isLight ? '#f1f5f9' : '#0b0f19',
                        padding: '4px',
                        borderRadius: '10px',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b'
                      }}>
                        <button
                          type="button"
                          onClick={() => setDishForm(prev => ({ ...prev, has_sizes: true }))}
                          style={{
                            background: dishForm.has_sizes ? '#e11d48' : 'transparent',
                            color: dishForm.has_sizes ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {t.form.tabPortionSizes}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDishForm(prev => ({ ...prev, has_sizes: false }))}
                          style={{
                            background: !dishForm.has_sizes ? '#e11d48' : 'transparent',
                            color: !dishForm.has_sizes ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {t.form.tabSinglePrice}
                        </button>
                      </div>
                    </div>

                    {dishForm.has_sizes ? (
                      <div className="admin-studio-sizes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                        {sizeDefinitions.map(s => {
                          const conf = dishForm.sizes_config?.[s.key] || { enabled: true, price: '9.00' };
                          const isEnabled = !!conf.enabled;
                          const localizedSizeName = SIZE_NAMES[s.key]?.[lang] || s.name;
                          return (
                            <div
                              key={s.key}
                              style={{
                                background: isEnabled ? (isLight ? '#ffffff' : '#0f172a') : (isLight ? '#f8fafc' : '#070b13'),
                                border: `1.5px solid ${isEnabled ? '#0284c7' : (isLight ? '#e2e8f0' : '#1e293b')}`,
                                borderRadius: '12px',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                opacity: isEnabled ? 1 : 0.55,
                                transition: 'all 0.2s ease',
                                boxShadow: isEnabled ? (isLight ? '0 2px 8px rgba(2, 132, 199, 0.08)' : '0 4px 12px rgba(2, 132, 199, 0.1)') : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => handleToggleSize(s.key)}
                                    style={{ width: '18px', height: '18px', accentColor: '#e11d48', cursor: 'pointer' }}
                                  />
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: isEnabled ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#94a3b8' : '#94a3b8') }}>
                                      {localizedSizeName}
                                    </div>
                                    <div style={{ fontSize: '11px', color: isLight ? '#0284c7' : '#38bdf8', fontWeight: '600' }}>
                                      {s.dim}
                                    </div>
                                  </div>
                                </label>

                                <span style={{
                                  background: isEnabled ? (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)') : (isLight ? '#f1f5f9' : '#1e293b'),
                                  color: isEnabled ? '#15803d' : (isLight ? '#64748b' : '#64748b'),
                                  fontSize: '10.5px',
                                  fontWeight: '800',
                                  padding: '2px 8px',
                                  borderRadius: '12px'
                                }}>
                                  {isEnabled ? t.form.sizeActive : t.form.sizeHidden}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: isLight ? '1px solid #f1f5f9' : '1px solid #1e293b', paddingTop: '10px' }}>
                                <span style={{ fontSize: '12px', color: isLight ? '#475569' : '#94a3b8', fontWeight: '600' }}>
                                  {t.form.sellingPrice}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="number"
                                    step="0.10"
                                    min="0"
                                    disabled={!isEnabled}
                                    value={conf.price || ''}
                                    onChange={(e) => handleSizePriceChange(s.key, e.target.value)}
                                    placeholder="0.00"
                                    style={{
                                      width: '95px',
                                      background: isEnabled ? (isLight ? '#ffffff' : '#0b0f19') : (isLight ? '#f1f5f9' : '#1e293b'),
                                      border: `1px solid ${isEnabled ? (isLight ? '#cbd5e1' : '#334155') : (isLight ? '#e2e8f0' : '#1e293b')}`,
                                      borderRadius: '8px',
                                      padding: '8px 10px',
                                      color: isEnabled ? (isLight ? '#16a34a' : '#4ade80') : (isLight ? '#94a3b8' : '#64748b'),
                                      fontSize: '15px',
                                      fontWeight: '800',
                                      textAlign: 'right'
                                    }}
                                  />
                                  <span style={{ fontSize: '14px', fontWeight: '800', color: isEnabled ? (isLight ? '#0f172a' : '#cbd5e1') : (isLight ? '#94a3b8' : '#475569') }}>
                                    €
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{
                        background: isLight ? '#f8fafc' : '#0b0f19',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        maxWidth: '380px'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: isLight ? '#0f172a' : '#ffffff' }}>
                            {t.form.singlePriceCardTitle}
                          </div>
                          <div style={{ fontSize: '11.5px', color: isLight ? '#64748b' : '#94a3b8' }}>
                            {t.form.singlePriceCardSubtitle}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            step="0.10"
                            min="0"
                            required
                            value={dishForm.price}
                            onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                            style={{
                              width: '100px',
                              background: isLight ? '#ffffff' : '#131b2e',
                              border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              color: isLight ? '#16a34a' : '#4ade80',
                              fontSize: '18px',
                              fontWeight: '900',
                              textAlign: 'right'
                            }}
                          />
                          <span style={{ fontSize: '17px', fontWeight: '900', color: isLight ? '#0f172a' : '#ffffff' }}>€</span>
                        </div>
                      </div>
                    )}

                    {/* CUSTOM PORTION SIZES SECTION */}
                    <div style={{
                      marginTop: '20px',
                      background: isLight ? '#f8fafc' : '#0b0f19',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Layers size={15} color="#0284c7" />
                            <span>{t.form.customSizesTitle}</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                            {t.form.customSizesSubtitle}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddCustomSize}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Plus size={14} />
                          <span>{t.form.addCustomSizeBtn}</span>
                        </button>
                      </div>

                      {/* Custom Sizes List */}
                      {Array.isArray(dishForm.custom_sizes) && dishForm.custom_sizes.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {dishForm.custom_sizes.map((cs, idx) => (
                            <div
                              key={cs.id || idx}
                              className="admin-studio-custom-size-row"
                              style={{
                                background: isLight ? '#ffffff' : '#131b2e',
                                border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                display: 'grid',
                                gridTemplateColumns: '1.4fr 1.4fr 1fr auto auto',
                                gap: '8px',
                                alignItems: 'center'
                              }}
                            >
                              <input
                                type="text"
                                placeholder={t.form.portionNamePlaceholder}
                                value={cs.name || ''}
                                onChange={(e) => handleUpdateCustomSize(idx, 'name', e.target.value)}
                                style={{
                                  background: isLight ? '#f8fafc' : '#0b0f19',
                                  border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                                  borderRadius: '6px',
                                  padding: '7px 10px',
                                  color: isLight ? '#0f172a' : '#ffffff',
                                  fontSize: '12.5px',
                                  fontWeight: '700'
                                }}
                              />

                              <input
                                type="text"
                                placeholder={t.form.portionDimPlaceholder}
                                value={cs.dim || ''}
                                onChange={(e) => handleUpdateCustomSize(idx, 'dim', e.target.value)}
                                style={{
                                  background: isLight ? '#f8fafc' : '#0b0f19',
                                  border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                                  borderRadius: '6px',
                                  padding: '7px 10px',
                                  color: isLight ? '#0284c7' : '#38bdf8',
                                  fontSize: '12px'
                                }}
                              />

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  step="0.10"
                                  min="0"
                                  placeholder="0.00"
                                  value={cs.price || ''}
                                  onChange={(e) => handleUpdateCustomSize(idx, 'price', e.target.value)}
                                  style={{
                                    width: '100%',
                                    background: isLight ? '#f8fafc' : '#0b0f19',
                                    border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                                    borderRadius: '6px',
                                    padding: '7px 8px',
                                    color: isLight ? '#16a34a' : '#4ade80',
                                    fontSize: '13px',
                                    fontWeight: '800',
                                    textAlign: 'right'
                                  }}
                                />
                                <span style={{ color: isLight ? '#0f172a' : '#ffffff', fontWeight: '800', fontSize: '13px' }}>€</span>
                              </div>

                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', color: cs.enabled !== false ? (isLight ? '#15803d' : '#34d399') : (isLight ? '#94a3b8' : '#64748b'), fontWeight: '700', userSelect: 'none' }}>
                                <input
                                  type="checkbox"
                                  checked={cs.enabled !== false}
                                  onChange={(e) => handleUpdateCustomSize(idx, 'enabled', e.target.checked)}
                                  style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <span>{t.form.portionActive}</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveCustomSize(idx)}
                                style={{
                                  background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
                                  color: isLight ? '#dc2626' : '#f87171',
                                  border: isLight ? '1px solid #fca5a5' : '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '6px',
                                  padding: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title={t.form.removePortion}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '14px', color: isLight ? '#64748b' : '#64748b', fontSize: '12px' }}>
                          {t.form.noCustomSizes}
                        </div>
                      )}
                    </div>

                    {/* American Crust / Cheese Crust Option */}
                    <div style={{
                      marginTop: '16px',
                      background: isLight ? '#fefce8' : 'rgba(234, 179, 8, 0.08)',
                      border: isLight ? '1px solid #fef08a' : '1px solid rgba(234, 179, 8, 0.3)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px'
                    }}>
                      <input
                        type="checkbox"
                        id="american-crust-opt"
                        checked={dishForm.supports_american}
                        onChange={(e) => setDishForm({ ...dishForm, supports_american: e.target.checked })}
                        style={{ width: '20px', height: '20px', accentColor: '#eab308', marginTop: '3px', cursor: 'pointer' }}
                      />
                      <label htmlFor="american-crust-opt" style={{ cursor: 'pointer', flex: 1 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: isLight ? '#854d0e' : '#fef08a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{t.form.americanCrustTitle}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: isLight ? '#713f12' : '#cbd5e1', margin: '4px 0 0', lineHeight: 1.4 }}>
                          {t.form.americanCrustDesc}
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* CARD 3: IMAGE PICKER & PRESETS */}
                  <div
                    className="admin-studio-card"
                    style={{
                      background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
                      borderRadius: '16px',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      padding: '24px',
                      boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : '0 4px 15px rgba(0, 0, 0, 0.15)',
                      backdropFilter: 'blur(16px)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)',
                        color: isLight ? '#0284c7' : '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ImageIcon size={16} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff', margin: 0 }}>
                          {t.form.section3Title}
                        </h3>
                        <p style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8', margin: '2px 0 0' }}>
                          {t.form.section3Subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Multi-Image Gallery & Supabase Storage Management Studio */}
                    <div style={{
                      background: isLight ? '#f8fafc' : '#0b0f19',
                      padding: '16px',
                      borderRadius: '14px',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      {/* Top Bar: Multi-File Upload Button + Supabase badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <label style={{
                            background: isUploadingDishImage ? (isLight ? '#f1f5f9' : '#1e293b') : '#e11d48',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 18px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: isUploadingDishImage ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
                            transition: 'all 0.2s ease',
                            opacity: isUploadingDishImage ? 0.75 : 1
                          }}>
                            {isUploadingDishImage ? (
                              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Camera size={16} />
                            )}
                            <span>
                              {isUploadingDishImage
                                ? (lang === 'de' ? 'Upload in Supabase Storage läuft...' : 'Uploading to Supabase Storage...')
                                : (lang === 'de' ? 'Mehrere Bilder hochladen (Supabase)' : 'Upload Multiple Photos (Supabase)')}
                            </span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              disabled={isUploadingDishImage}
                              style={{ display: 'none' }}
                              onChange={handleMultipleImageUpload}
                            />
                          </label>

                          <span style={{ fontSize: '11.5px', color: isLight ? '#64748b' : '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                            {lang === 'de' ? 'Direkt in Supabase Storage ("menu-dishes")' : 'Direct Supabase Storage ("menu-dishes")'}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          background: isLight ? '#e2e8f0' : '#1e293b',
                          color: isLight ? '#334155' : '#cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '20px'
                        }}>
                          {Array.isArray(dishForm.images) && dishForm.images.length > 0 
                            ? `${dishForm.images.length} ${dishForm.images.length === 1 ? 'Bild aktiv' : 'Bilder aktiv'}` 
                            : (dishForm.image_url ? '1 Bild aktiv' : 'Kein Bild')}
                        </span>
                      </div>

                      {/* Image Gallery Cards Strip / Grid */}
                      {(() => {
                        const allImgs = Array.isArray(dishForm.images) && dishForm.images.length > 0
                          ? dishForm.images
                          : (dishForm.image_url ? [dishForm.image_url] : []);

                        if (allImgs.length === 0) {
                          return (
                            <div style={{
                              padding: '24px',
                              textAlign: 'center',
                              borderRadius: '10px',
                              border: isLight ? '1px dashed #cbd5e1' : '1px dashed #334155',
                              color: isLight ? '#64748b' : '#94a3b8',
                              fontSize: '12.5px'
                            }}>
                              {lang === 'de' 
                                ? 'Noch keine Bilder hinterlegt. Klicken Sie oben auf "Mehrere Bilder hochladen" oder wählen Sie unten Presets aus.'
                                : 'No photos added yet. Click "Upload Multiple Photos" above or choose presets below.'}
                            </div>
                          );
                        }

                        return (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                            gap: '12px'
                          }}>
                            {allImgs.map((imgUrl, idx) => {
                              const isPrimary = idx === 0 || imgUrl === dishForm.image_url;
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    position: 'relative',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    background: isLight ? '#ffffff' : '#131b2e',
                                    border: isPrimary ? '2.5px solid #f59e0b' : (isLight ? '1px solid #e2e8f0' : '1px solid #334155'),
                                    boxShadow: isPrimary ? '0 0 10px rgba(245, 158, 11, 0.35)' : 'none',
                                    display: 'flex',
                                    flexDirection: 'column'
                                  }}
                                >
                                  {/* Thumbnail */}
                                  <div style={{ height: '90px', width: '100%', position: 'relative', background: '#000000' }}>
                                    <img
                                      src={imgUrl}
                                      alt={`Dish ${idx + 1}`}
                                      onError={(e) => { e.target.src = '/images/pizza1.png'; }}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {isPrimary ? (
                                      <span style={{
                                        position: 'absolute',
                                        top: '4px',
                                        left: '4px',
                                        background: '#f59e0b',
                                        color: '#000000',
                                        fontSize: '9.5px',
                                        fontWeight: '800',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                      }}>
                                        <Star size={10} fill="#000000" />
                                        {lang === 'de' ? 'Hauptbild' : 'Cover'}
                                      </span>
                                    ) : (
                                      <span style={{
                                        position: 'absolute',
                                        top: '4px',
                                        left: '4px',
                                        background: 'rgba(0,0,0,0.7)',
                                        color: '#ffffff',
                                        fontSize: '9.5px',
                                        fontWeight: '700',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                      }}>
                                        #{idx + 1}
                                      </span>
                                    )}
                                  </div>

                                  {/* Controls Footer */}
                                  <div style={{
                                    padding: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: isLight ? '#f8fafc' : '#0b0f19',
                                    borderTop: isLight ? '1px solid #f1f5f9' : '1px solid #1e293b'
                                  }}>
                                    {!isPrimary ? (
                                      <button
                                        type="button"
                                        title={lang === 'de' ? 'Als Hauptbild setzen' : 'Set as cover photo'}
                                        onClick={() => handleSetPrimaryImage(imgUrl)}
                                        style={{
                                          background: 'none',
                                          border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                                          borderRadius: '6px',
                                          padding: '3px 6px',
                                          fontSize: '10px',
                                          fontWeight: '700',
                                          color: isLight ? '#334155' : '#cbd5e1',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                      >
                                        <Star size={10} />
                                        {lang === 'de' ? 'Haupt' : 'Cover'}
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#f59e0b' }}>
                                        ✓ {lang === 'de' ? 'Aktiv' : 'Active'}
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      title={lang === 'de' ? 'Foto entfernen' : 'Remove photo'}
                                      onClick={() => handleRemoveImage(imgUrl)}
                                      style={{
                                        background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '4px 6px',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* Manual Image URL Input for custom or external links */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: isLight ? '#64748b' : '#94a3b8' }}>
                          {lang === 'de' ? 'Bild-URL manuell eingeben oder bearbeiten:' : 'Manual image URL:'}
                        </label>
                        <input
                          type="text"
                          placeholder="/images/pizza1.png oder https://..."
                          value={dishForm.image_url || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const cur = Array.isArray(dishForm.images) ? [...dishForm.images] : [];
                            if (val && !cur.includes(val)) {
                              setDishForm({ ...dishForm, image_url: val, images: [val, ...cur] });
                            } else {
                              setDishForm({ ...dishForm, image_url: val });
                            }
                          }}
                          style={{
                            width: '100%',
                            background: isLight ? '#ffffff' : '#131b2e',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: isLight ? '#0f172a' : '#ffffff',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    </div>

                    {/* Presets Gallery with Category Tabs */}
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff' }}>
                          {t.form.presetsHeading}
                        </div>
                        {/* Preset Category Pills */}
                        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                          {PRESET_CATEGORIES.map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setPresetFilterCategory(cat.id)}
                              style={{
                                background: presetFilterCategory === cat.id ? '#e11d48' : (isLight ? '#ffffff' : '#0b0f19'),
                                color: presetFilterCategory === cat.id ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                                border: `1px solid ${presetFilterCategory === cat.id ? '#e11d48' : (isLight ? '#cbd5e1' : '#1e293b')}`,
                                borderRadius: '6px',
                                padding: '3px 8px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {cat['label_' + lang] || cat.label_de}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div
                        className="admin-studio-presets-grid"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
                          gap: '10px',
                          maxHeight: '220px',
                          overflowY: 'auto',
                          padding: '4px'
                        }}
                      >
                        {filteredPresets.map((preset, idx) => {
                          const currentImgs = Array.isArray(dishForm.images) && dishForm.images.length > 0
                            ? dishForm.images
                            : (dishForm.image_url ? [dishForm.image_url] : []);
                          const isSelected = currentImgs.includes(preset.url);
                          const isPrimary = isSelected && (dishForm.image_url === preset.url || currentImgs[0] === preset.url);

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                const cur = Array.isArray(dishForm.images) && dishForm.images.length > 0
                                  ? [...dishForm.images]
                                  : (dishForm.image_url ? [dishForm.image_url] : []);
                                if (cur.includes(preset.url)) {
                                  handleSetPrimaryImage(preset.url);
                                } else {
                                  const updated = [preset.url, ...cur];
                                  setDishForm({ ...dishForm, image_url: preset.url, images: updated });
                                }
                              }}
                              style={{
                                background: isLight ? '#ffffff' : '#0b0f19',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: isPrimary
                                  ? '2.5px solid #f59e0b'
                                  : (isSelected ? '2.5px solid #e11d48' : (isLight ? '1px solid #e2e8f0' : '1px solid #1e293b')),
                                boxShadow: isPrimary
                                  ? '0 0 10px rgba(245, 158, 11, 0.4)'
                                  : (isSelected ? '0 0 10px rgba(225, 29, 72, 0.4)' : (isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none')),
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ height: '70px', position: 'relative' }}>
                                <img
                                  src={preset.url}
                                  alt={preset.label}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                {isPrimary ? (
                                  <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: '#f59e0b',
                                    color: '#000000',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <Star size={10} fill="#000000" />
                                  </div>
                                ) : isSelected ? (
                                  <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: '#e11d48',
                                    color: '#ffffff',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <Check size={11} strokeWidth={3} />
                                  </div>
                                ) : null}
                              </div>
                              <div style={{
                                padding: '4px 6px',
                                fontSize: '10.5px',
                                fontWeight: '700',
                                color: isSelected ? '#e11d48' : (isLight ? '#334155' : '#94a3b8'),
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {preset.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: DIETARY, BADGES, PREP TIME & STOCK */}
                  <div
                    className="admin-studio-card"
                    style={{
                      background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
                      borderRadius: '16px',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      padding: '24px',
                      boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : '0 4px 15px rgba(0, 0, 0, 0.15)',
                      backdropFilter: 'blur(16px)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)',
                        color: isLight ? '#d97706' : '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff', margin: 0 }}>
                          {t.form.section4Title}
                        </h3>
                        <p style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8', margin: '2px 0 0' }}>
                          {t.form.section4Subtitle}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* Badges / Highlights */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '8px', color: isLight ? '#0f172a' : '#cbd5e1' }}>
                          {t.form.badgeLabel}
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {BADGE_OPTIONS.map(badgeOpt => {
                            const isSelected = dishForm.badge === badgeOpt.val;
                            return (
                              <button
                                key={badgeOpt.val}
                                type="button"
                                onClick={() => setDishForm({ ...dishForm, badge: badgeOpt.val })}
                                style={{
                                  background: isSelected ? '#f59e0b' : (isLight ? '#f8fafc' : '#0b0f19'),
                                  color: isSelected ? '#000000' : (isLight ? '#334155' : '#94a3b8'),
                                  border: `1.5px solid ${isSelected ? '#f59e0b' : (isLight ? '#cbd5e1' : '#1e293b')}`,
                                  borderRadius: '8px',
                                  padding: '7px 12px',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {badgeOpt['label_' + lang] || badgeOpt.label_de}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dietary Tags */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '8px', color: isLight ? '#0f172a' : '#cbd5e1' }}>
                          {t.form.dietaryLabel}
                        </label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {DIETARY_OPTIONS.map(d => {
                            const isSelected = (dishForm.dietary || []).includes(d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => handleToggleDietary(d.id)}
                                style={{
                                  background: isSelected ? d.activeBg : (isLight ? '#f8fafc' : '#0b0f19'),
                                  border: `1.5px solid ${isSelected ? d.activeBorder : (isLight ? '#cbd5e1' : '#1e293b')}`,
                                  color: isSelected ? d.activeColor : (isLight ? '#334155' : '#94a3b8'),
                                  borderRadius: '10px',
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  fontWeight: isSelected ? '800' : '600',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                                <span>{d['label_' + lang] || d.label_de}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Prep Time & Stock status */}
                      <div
                        className="admin-studio-prep-stock-grid"
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
                      >
                        {/* Prep Time Stepper */}
                        <div style={{ background: isLight ? '#f8fafc' : '#0b0f19', padding: '14px', borderRadius: '12px', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isLight ? '#475569' : '#94a3b8', marginBottom: '8px' }}>
                            {t.form.prepTimeUpper}
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const curr = Number(dishForm.preparation_time_minutes) || 20;
                                setDishForm({ ...dishForm, preparation_time_minutes: Math.max(5, curr - 5) });
                              }}
                              style={{
                                width: '36px',
                                height: '36px',
                                background: isLight ? '#ffffff' : '#1e293b',
                                color: isLight ? '#0f172a' : '#ffffff',
                                border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              -
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={16} color="#d97706" />
                              <span style={{ fontSize: '17px', fontWeight: '900', color: isLight ? '#0f172a' : '#ffffff' }}>
                                {dishForm.preparation_time_minutes || 20}
                              </span>
                              <span style={{ fontSize: '13px', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
                                {t.orders.mins}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const curr = Number(dishForm.preparation_time_minutes) || 20;
                                setDishForm({ ...dishForm, preparation_time_minutes: curr + 5 });
                              }}
                              style={{
                                width: '36px',
                                height: '36px',
                                background: isLight ? '#ffffff' : '#1e293b',
                                color: isLight ? '#0f172a' : '#ffffff',
                                border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Stock Status Switch */}
                        <div style={{ background: isLight ? '#f8fafc' : '#0b0f19', padding: '14px', borderRadius: '12px', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isLight ? '#475569' : '#94a3b8', marginBottom: '8px' }}>
                            {t.form.stockUpper}
                          </label>
                          <button
                            type="button"
                            onClick={() => setDishForm({ ...dishForm, is_in_stock: !dishForm.is_in_stock })}
                            style={{
                              width: '100%',
                              height: '36px',
                              background: dishForm.is_in_stock ? (isLight ? '#059669' : '#065f46') : (isLight ? '#dc2626' : '#7f1d1d'),
                              color: '#ffffff',
                              border: `1px solid ${dishForm.is_in_stock ? (isLight ? '#047857' : '#059669') : (isLight ? '#b91c1c' : '#b91c1c')}`,
                              borderRadius: '8px',
                              fontSize: '12.5px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'all 0.15s ease',
                              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                            }}
                          >
                            {dishForm.is_in_stock ? <PackageCheck size={16} /> : <PackageX size={16} />}
                            <span>{dishForm.is_in_stock ? t.form.stockAvailable : t.form.stockSoldOut}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: ALLOWED ADD-ONS / TOPPINGS */}
                  <div
                    className="admin-studio-card"
                    style={{
                      background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
                      borderRadius: '16px',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      padding: '24px',
                      boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : '0 4px 15px rgba(0, 0, 0, 0.15)',
                      backdropFilter: 'blur(16px)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isLight ? '#f3e8ff' : 'rgba(168, 85, 247, 0.15)',
                          color: isLight ? '#9333ea' : '#c084fc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Layers size={16} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff', margin: 0 }}>
                            {t.form.section5Title}
                          </h3>
                          <p style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8', margin: '2px 0 0' }}>
                            {(dishForm.allowed_toppings || []).filter(id => allToppingsCatalog.some(t => t.id === id)).length} / {allToppingsCatalog.length} {t.form.section5Subtitle}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddCustomToppingModal(prev => !prev)}
                          style={{
                            background: '#8b5cf6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Plus size={13} />
                          <span>{t.form.addCustomToppingBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDishForm(prev => ({ ...prev, allowed_toppings: allToppingsCatalog.map(t => t.id) }))}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '7px 14px',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: isLight ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ color: '#ffffff', fontWeight: '800' }}>{t.form.enableAll}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDishForm(prev => ({ ...prev, allowed_toppings: [] }))}
                          style={{
                            background: isLight ? '#f1f5f9' : '#1e293b',
                            color: isLight ? '#0f172a' : '#94a3b8',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                            borderRadius: '8px',
                            padding: '7px 14px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ color: isLight ? '#0f172a' : '#94a3b8', fontWeight: '700' }}>{t.form.deselectAll}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDishForm(prev => ({ ...prev, allowed_toppings: [], custom_toppings: [] }));
                            showToast(lang === 'de' ? 'Alle Zusatzbeläge für dieses Gericht entfernt!' : 'All extra toppings removed from this dish!', 'success');
                          }}
                          style={{
                            background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
                            color: isLight ? '#b91c1c' : '#f87171',
                            border: isLight ? '1px solid #fecaca' : '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '7px 14px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{t.form.removeAllExtras}</span>
                        </button>
                        {customToppingsList.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllCustomToppings}
                            style={{
                              background: 'transparent',
                              color: isLight ? '#94a3b8' : '#64748b',
                              border: isLight ? '1px dashed #cbd5e1' : '1px dashed #334155',
                              borderRadius: '8px',
                              padding: '7px 12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={lang === 'de' ? 'Löscht alle selbst erstellten Extra-Zutaten aus der Liste' : 'Deletes all custom created extra toppings from list'}
                          >
                            <span>{t.form.clearAllCustomExtras}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Creator for Custom Extra Ingredient */}
                    {showAddCustomToppingModal && (
                      <div style={{
                        marginBottom: '14px',
                        background: isLight ? '#f5f3ff' : '#0b0f19',
                        border: '1.5px solid #8b5cf6',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{t.form.customToppingsTitle}</span>
                          <button
                            type="button"
                            onClick={() => setShowAddCustomToppingModal(false)}
                            style={{ background: 'transparent', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
                          >
                            ✕
                          </button>
                        </div>

                        <div
                          className="admin-studio-custom-topping-inputs"
                          style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', alignItems: 'center' }}
                        >
                          <input
                            type="text"
                            placeholder={t.form.newToppingNameLabel}
                            value={newToppingName}
                            onChange={(e) => setNewToppingName(e.target.value)}
                            style={{ width: '100%', background: isLight ? '#ffffff' : '#131b2e', border: isLight ? '1px solid #cbd5e1' : '1px solid #334155', borderRadius: '8px', padding: '8px 10px', color: isLight ? '#0f172a' : '#ffffff', fontSize: '12.5px' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              step="0.10"
                              min="0"
                              placeholder="2.50"
                              value={newToppingPrice}
                              onChange={(e) => setNewToppingPrice(e.target.value)}
                              style={{ width: '100%', background: isLight ? '#ffffff' : '#131b2e', border: isLight ? '1px solid #cbd5e1' : '1px solid #334155', borderRadius: '8px', padding: '8px 10px', color: isLight ? '#16a34a' : '#4ade80', fontSize: '13px', fontWeight: '800', textAlign: 'right' }}
                            />
                            <span style={{ color: isLight ? '#0f172a' : '#ffffff', fontWeight: '800' }}>€</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddCustomExtraTopping(newToppingName, newToppingPrice)}
                            style={{
                              background: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 14px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {t.form.createToppingBtn}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Filter for extras */}
                    <div style={{ marginBottom: '12px' }}>
                      <input
                        type="text"
                        placeholder={t.form.searchExtraTopping}
                        value={toppingsFilterQuery}
                        onChange={(e) => setToppingsFilterQuery(e.target.value)}
                        style={{
                          width: '100%',
                          background: isLight ? '#ffffff' : '#0b0f19',
                          border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: isLight ? '#0f172a' : '#ffffff',
                          fontSize: '12.5px'
                        }}
                      />
                    </div>

                    {/* Info Notice when 0 extras are allowed */}
                    {(dishForm.allowed_toppings || []).length === 0 && (
                      <div style={{
                        background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)',
                        border: isLight ? '1.5px solid #86efac' : '1.5px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '12px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        color: isLight ? '#15803d' : '#4ade80',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Check size={16} strokeWidth={2.5} />
                        <span>{t.form.noExtrasBadge}</span>
                      </div>
                    )}

                    <div
                      className="admin-studio-toppings-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '8px',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        padding: '2px'
                      }}
                    >
                      {filteredExtraToppings.map(topping => {
                        const isAllowed = (dishForm.allowed_toppings || []).includes(topping.id);
                        const localizedToppingName = EXTRA_TOPPINGS_TRANSLATIONS[topping.id]?.[lang] || topping.name;
                        const isCustom = topping.isCustom || customToppingsList.some(ct => ct.id === topping.id);
                        const customPrice = topping.price ? `+${Number(topping.price).toFixed(2).replace('.', ',')} €` : null;
                        return (
                          <div
                            key={topping.id}
                            onClick={() => handleToggleAllowedTopping(topping.id)}
                            style={{
                              background: isAllowed ? (isLight ? '#dcfce7' : '#064e3b') : (isLight ? '#ffffff' : '#0b0f19'),
                              border: isAllowed ? (isLight ? '1.5px solid #16a34a' : '1.5px solid #10b981') : (isCustom ? '1px dashed #8b5cf6' : (isLight ? '1px solid #e2e8f0' : '1px solid #1e293b')),
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: isAllowed ? '700' : '500',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              color: isAllowed ? (isLight ? '#14532d' : '#ffffff') : (isLight ? '#334155' : '#64748b'),
                              cursor: 'pointer',
                              opacity: isAllowed ? 1 : 0.65,
                              transition: 'all 0.15s ease',
                              userSelect: 'none',
                              boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                              <span>{localizedToppingName}</span>
                              {isCustom && (
                                <span style={{ fontSize: '9.5px', background: '#8b5cf6', color: '#ffffff', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>
                                  {t.form.customBadge} {customPrice}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isCustom && (
                                <button
                                  type="button"
                                  title={lang === 'de' ? 'Diese Extra-Zutat löschen' : 'Delete this extra'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomTopping(topping.id);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: isLight ? '#ef4444' : '#f87171',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                              {isAllowed ? (
                                <div style={{
                                  background: '#10b981',
                                  color: '#ffffff',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <Check size={11} strokeWidth={3} />
                                </div>
                              ) : (
                                <div style={{
                                  border: isLight ? '1.5px solid #cbd5e1' : '1.5px solid #475569',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  flexShrink: 0
                                }} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* BOTTOM SUBMIT BUTTONS */}
                  <div
                    className="admin-studio-bottom-bar"
                    style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '16px 20px',
                      background: isLight ? 'rgba(255, 255, 255, 0.95)' : '#131b2e',
                      borderRadius: '16px',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : 'none',
                      backdropFilter: 'blur(16px)'
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '14px',
                        fontSize: '15px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 20px rgba(225, 29, 72, 0.4)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Check size={18} strokeWidth={3} />
                      <span>
                        {isEditing
                          ? t.form.saveChangesFor.replace('{name}', dishForm.name || (lang === 'de' ? editingItem.name_de : editingItem.name_en) || editingItem.name)
                          : t.form.saveBtn}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setEditingItem(null); setActiveTab('menu'); }}
                      style={{
                        background: isLight ? '#ffffff' : '#1e293b',
                        color: isLight ? '#0f172a' : '#cbd5e1',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                        borderRadius: '10px',
                        padding: '14px 24px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {t.form.cancelBtn}
                    </button>
                  </div>
                </form>

                {/* ============================================================ */}
                {/* RIGHT COLUMN: STICKY LIVE MENU CARD PREVIEW                   */}
                {/* ============================================================ */}
                <div
                  className="admin-studio-preview-col"
                  style={{
                    position: 'sticky',
                    top: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  {/* Preview Container Header */}
                  <div style={{
                    background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
                    borderRadius: '16px',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : 'none',
                    backdropFilter: 'blur(16px)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Eye size={16} color={isLight ? '#0284c7' : '#38bdf8'} />
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff' }}>
                        {t.form.livePreviewTitle}
                      </span>
                    </div>
                    <span style={{
                      background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)',
                      color: isLight ? '#0284c7' : '#38bdf8',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {t.form.customerView}
                    </span>
                  </div>

                  {/* Customer Card Preview (Faithful Front-End Replication) */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: isLight ? '0 10px 25px rgba(0, 0, 0, 0.08)' : '0 12px 30px rgba(0, 0, 0, 0.35)',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Image Header with Badges */}
                    <div style={{ position: 'relative', height: '190px', width: '100%', background: '#0f172a', overflow: 'hidden' }}>
                      <img
                        src={dishForm.image_url || '/images/pizza1.png'}
                        alt={dishForm.name || (lang === 'de' ? 'Gericht Vorschau' : 'Dish Preview')}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} />

                      {/* Dish Number Badge */}
                      {dishForm.number && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: '#e11d48',
                          color: '#ffffff',
                          fontWeight: '900',
                          fontSize: '12px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}>
                          #{dishForm.number}
                        </div>
                      )}

                      {/* Custom Badge or Highlights */}
                      {dishForm.badge && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: '#f59e0b',
                          color: '#000000',
                          fontWeight: '800',
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}>
                          {BADGE_OPTIONS.find(b => b.val === dishForm.badge)?.[`label_${lang}`] || dishForm.badge}
                        </div>
                      )}

                      {/* Prep Time Badge */}
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '12px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#f8fafc',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Clock size={12} color="#f59e0b" />
                        <span>{dishForm.preparation_time_minutes || 20} {t.orders.mins}</span>
                      </div>

                      {/* Stock Status Pill */}
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '12px',
                        background: dishForm.is_in_stock ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {dishForm.is_in_stock ? t.form.liveInStock : t.form.dishSoldOut}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Category & Dietary Tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="dish-category-badge" style={{
                          background: isLight ? '#eff6ff' : '#1e293b',
                          color: isLight ? '#1d4ed8' : '#cbd5e1',
                          border: isLight ? '1px solid #93c5fd' : '1px solid #334155',
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px'
                        }}>
                          {categoryTitle}
                        </span>
                        {dishForm.dietary?.includes('vegetarisch') && (
                          <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                            {t.menu.vegetarian}
                          </span>
                        )}
                        {dishForm.dietary?.includes('vegan') && (
                          <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                            {t.menu.vegan}
                          </span>
                        )}
                        {dishForm.dietary?.includes('scharf') && (
                          <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                            {t.menu.spicy}
                          </span>
                        )}
                        {dishForm.dietary?.includes('halal') && (
                          <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                            ☪️ Halal
                          </span>
                        )}
                        {dishForm.supports_american && (
                          <span style={{ background: '#fef9c3', color: '#854d0e', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                            🧀 {t.menu.americanCrust}
                          </span>
                        )}
                      </div>

                      {/* Title & Price Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                          {dishForm.name || (lang === 'de' ? 'Gerichtsname' : 'Dish Name')}
                        </h4>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#e11d48', whiteSpace: 'nowrap' }}>
                          {previewUnitPrice} €
                        </div>
                      </div>

                      {/* Ingredients & Description */}
                      <p style={{
                        fontSize: '12.5px',
                        color: '#64748b',
                        margin: 0,
                        lineHeight: 1.4,
                        minHeight: '34px'
                      }}>
                        {dishForm.toppings || dishForm.desc || (lang === 'de' ? 'Zutatenliste wird hier dargestellt...' : 'Ingredients list will appear here...')}
                      </p>

                      {/* Interactive Size Selector Preview */}
                      {allPreviewSizes.length > 0 && (
                        <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>
                            {t.form.previewChooseSize}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(allPreviewSizes.length, 4)}, 1fr)`, gap: '6px' }}>
                            {allPreviewSizes.map(s => {
                              const isSelected = effectivePreviewSizeKey === s.key;
                              return (
                                <button
                                  key={s.key}
                                  type="button"
                                  onClick={() => setPreviewSizeKey(s.key)}
                                  style={{
                                    background: isSelected ? '#e11d48' : '#f8fafc',
                                    color: isSelected ? '#ffffff' : '#334155',
                                    border: `1.5px solid ${isSelected ? '#e11d48' : '#e2e8f0'}`,
                                    borderRadius: '8px',
                                    padding: '6px 4px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div>{s.name}</div>
                                  {s.dim && <div style={{ fontSize: '9.5px', opacity: isSelected ? 0.9 : 0.7 }}>{s.dim}</div>}
                                  <div style={{ fontSize: '11px', fontWeight: '800', marginTop: '2px' }}>
                                    {Number(s.price).toFixed(2).replace('.', ',')} €
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Simulated Add to Cart Button */}
                      <div style={{ marginTop: '6px' }}>
                        <div style={{
                          background: dishForm.is_in_stock ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' : '#e2e8f0',
                          color: dishForm.is_in_stock ? '#ffffff' : '#94a3b8',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontWeight: '800',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'default',
                          boxShadow: dishForm.is_in_stock ? '0 4px 12px rgba(225, 29, 72, 0.25)' : 'none'
                        }}>
                          <Plus size={15} strokeWidth={3} />
                          <span>{dishForm.is_in_stock ? t.form.addToCartSim : t.form.notAvailableSim}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Details Card */}
                  <div style={{
                    background: isLight ? 'rgba(255, 255, 255, 0.92)' : '#131b2e',
                    borderRadius: '14px',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '12px',
                    boxShadow: isLight ? '0 4px 16px rgba(0, 0, 0, 0.04)' : 'none',
                    backdropFilter: 'blur(16px)'
                  }}>
                    <div style={{ fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff', marginBottom: '2px' }}>
                      {t.form.summaryTitle}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8' }}>
                      <span>{t.form.summaryCategory}</span>
                      <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>{categoryTitle}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8' }}>
                      <span>{t.form.summaryPricing}</span>
                      <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>{allPreviewSizes.length > 0 ? `${allPreviewSizes.length} ${t.form.summarySizesConfigured}` : t.form.summaryFixedPrice}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8' }}>
                      <span>{t.form.summaryAmericanCrust}</span>
                      <strong style={{ color: dishForm.supports_american ? (isLight ? '#854d0e' : '#fde047') : (isLight ? '#64748b' : '#94a3b8') }}>{dishForm.supports_american ? t.form.summaryAmericanEnabled : t.form.summaryAmericanNo}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#475569' : '#94a3b8' }}>
                      <span>{t.form.summaryStatus}</span>
                      <strong style={{ color: dishForm.is_in_stock ? (isLight ? '#16a34a' : '#4ade80') : (isLight ? '#dc2626' : '#f87171') }}>{dishForm.is_in_stock ? t.form.summaryLiveOnMenu : t.form.summarySoldOut}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      {/* Category Management Modal (Add & Delete Any Category) */}
      {isCategoryModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsCategoryModalOpen(false)}
        >
          <div
            style={{
              background: isLight ? '#ffffff' : '#0f172a',
              color: isLight ? '#0f172a' : '#f8fafc',
              borderRadius: '16px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                    {lang === 'de' ? 'Kategorien verwalten & neu anlegen' : 'Manage & Create Categories'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: isLight ? '#64748b' : '#94a3b8' }}>
                    {lang === 'de' ? 'Neue Speisekarten-Kategorien hinzufügen oder bestehende löschen' : 'Add new menu categories or delete existing ones'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form: Neue Kategorie erstellen */}
            <form onSubmit={handleCreateCategory} style={{ background: isLight ? '#f8fafc' : '#1e293b', padding: '18px', borderRadius: '12px', border: isLight ? '1px solid #e2e8f0' : '1px solid #334155', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14.5px', fontWeight: '700', color: isLight ? '#0f172a' : '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} color="#e11d48" />
                {lang === 'de' ? 'Neue Kategorie anlegen' : 'Create New Category'}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: isLight ? '#475569' : '#cbd5e1' }}>
                    {lang === 'de' ? 'Kategoriename *' : 'Category Name *'}
                  </label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="z.B. Burger & Fingerfood"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid #475569',
                      background: isLight ? '#ffffff' : '#0f172a',
                      color: isLight ? '#0f172a' : '#ffffff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: isLight ? '#475569' : '#cbd5e1' }}>
                    {lang === 'de' ? 'Untertitel (optional)' : 'Subtitle (optional)'}
                  </label>
                  <input
                    type="text"
                    value={newCatSub}
                    onChange={(e) => setNewCatSub(e.target.value)}
                    placeholder="z.B. Frisch & Knusprig"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid #475569',
                      background: isLight ? '#ffffff' : '#0f172a',
                      color: isLight ? '#0f172a' : '#ffffff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: isLight ? '#475569' : '#cbd5e1' }}>
                    {lang === 'de' ? 'Titel auf Speisekarte (optional)' : 'Title on Menu (optional)'}
                  </label>
                  <input
                    type="text"
                    value={newCatTitle}
                    onChange={(e) => setNewCatTitle(e.target.value)}
                    placeholder="z.B. Herzhafte Burger Spezialitäten"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid #475569',
                      background: isLight ? '#ffffff' : '#0f172a',
                      color: isLight ? '#0f172a' : '#ffffff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Emoji Selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: isLight ? '#475569' : '#cbd5e1' }}>
                  {lang === 'de' ? 'Symbol / Emoji wählen' : 'Choose Symbol / Emoji'}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  {['🍕', '🍔', '🍝', '🥩', '🥗', '🌮', '🍣', '🍛', '🍗', '🥪', '🍟', '🍹', '🍰', '🥙', '🥔', '🍲', '🍳', '🥤', '🏷️', '🍽️'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewCatIcon(em)}
                      style={{
                        width: '36px',
                        height: '36px',
                        fontSize: '18px',
                        borderRadius: '8px',
                        border: newCatIcon === em ? '2px solid #e11d48' : (isLight ? '1px solid #cbd5e1' : '1px solid #475569'),
                        background: newCatIcon === em ? 'rgba(225, 29, 72, 0.15)' : (isLight ? '#ffffff' : '#0f172a'),
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingCategory}
                style={{
                  background: '#e11d48',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isSavingCategory ? 'not-allowed' : 'pointer',
                  opacity: isSavingCategory ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)'
                }}
              >
                <Plus size={16} />
                {isSavingCategory ? (lang === 'de' ? 'Wird gespeichert...' : 'Saving...') : (lang === 'de' ? 'Kategorie erstellen' : 'Create Category')}
              </button>
            </form>

            {/* List: Bestehende Kategorien */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '14.5px', fontWeight: '700', color: isLight ? '#0f172a' : '#ffffff' }}>
                {lang === 'de' ? `Bestehende Kategorien (${categoriesList.length})` : `Existing Categories (${categoriesList.length})`}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                {categoriesList.map((cat) => {
                  const count = getCatCount(cat.id);
                  const emoji = cat.icon || CATEGORY_EMOJIS[cat.id] || '🍽️';
                  return (
                    <div
                      key={cat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isLight ? '#ffffff' : '#1e293b',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                        boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ fontSize: '20px', lineHeight: 1 }}>{emoji}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cat.name_de || cat.name}
                          </div>
                          <div style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8' }}>
                            {count} {count === 1 ? 'Gericht' : 'Gerichte'} {cat.is_custom && '• Eigene Kategorie'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        title={`${cat.name_de || cat.name} löschen`}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ef4444';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'error' ? '#7f1d1d' : (toast.type === 'info' ? '#1e293b' : '#065f46'),
          color: '#ffffff',
          border: `1px solid ${toast.type === 'error' ? '#b91c1c' : (toast.type === 'info' ? '#334155' : '#059669')}`,
          borderRadius: '8px',
          padding: '12px 18px',
          fontSize: '13.5px',
          fontWeight: '700',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toast.type === 'error' ? (
            <X size={18} color="#f87171" />
          ) : toast.type === 'info' ? (
            <Clock size={18} color="#f59e0b" />
          ) : (
            <Check size={18} color="#34d399" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Thermal Printer Management Modal (Zjiang ZJ-8330-L) */}
      <ThermalPrinterModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        isLight={isLight}
        lang={lang}
        onToast={showToast}
      />
    </div>
  );
}
