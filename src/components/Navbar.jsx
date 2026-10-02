import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Phone, Smartphone, ShoppingBag, Menu, X, Search, Plus, Check, ArrowRight, Sliders, User } from 'lucide-react';
import VeneziaLogo from './VeneziaLogo';
import { restaurantInfo, allMenuItems } from '../data/menuData';
import { useLiveMenu } from '../data/liveMenuState';
import { getCurrentCustomerUser, subscribeToCustomerAuth } from '../lib/supabaseClient';

export default function Navbar({
  cartCount = 0,
  cartTotal = 0,
  onOpenCart,
  onOpenOrderModal,
  onOpenAccount,
  onAddToCart,
  activeSection = 'home',
  onNavigate
}) {
  const { menuItems } = useLiveMenu();
  const [customerUser, setCustomerUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [addedItemId, setAddedItemId] = useState(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    async function loadUser() {
      const u = await getCurrentCustomerUser();
      setCustomerUser(u);
    }
    loadUser();
    const unsub = subscribeToCustomerAuth((u) => setCustomerUser(u));
    return () => unsub();
  }, []);

  const navLinks = [
    { label: 'Speisekarte', href: '#speisekarte', id: 'speisekarte' },
    { label: 'Angebote', href: '#angebote', id: 'angebote' },
    { label: 'Kontakt', href: '#kontakt', id: 'kontakt' }
  ];

  // Lock background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        (!mobileSearchRef.current || !mobileSearchRef.current.contains(event.target))
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter dishes based on search query
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return menuItems
      .filter((item) => {
        const matchName = item.name?.toLowerCase().includes(q) || item.name_en?.toLowerCase().includes(q);
        const matchToppings = item.toppings?.toLowerCase().includes(q);
        const matchNumber = item.number?.toLowerCase() === q;
        const matchCategory = item.category?.toLowerCase().includes(q);
        const matchDesc = item.desc?.toLowerCase().includes(q);
        return matchName || matchToppings || matchNumber || matchCategory || matchDesc;
      })
      .slice(0, 6);
  }, [searchQuery, menuItems]);

  const handleLinkClick = (e, link) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(link.id);
    }
    setMobileMenuOpen(false);
    setIsSearchOpen(false);
  };

  const handleQuickAdd = (e, item) => {
    e.stopPropagation();
    if (onAddToCart) {
      const price = typeof item.prices === 'object'
        ? (item.prices.large || item.prices.small || Object.values(item.prices)[0])
        : (item.price || 9.00);

      onAddToCart({
        id: item.id,
        name: item.name,
        price: price,
        image: item.image,
        desc: item.toppings || item.desc || ''
      });

      setAddedItemId(item.id);
      setTimeout(() => setAddedItemId(null), 1200);
    }
  };

  const handleSelectResult = (item) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate('speisekarte');
    }
  };

  const getItemPrice = (item) => {
    if (typeof item.prices === 'object') {
      const min = Math.min(...Object.values(item.prices));
      return `ab ${min.toFixed(2).replace('.', ',')} €`;
    }
    if (item.price) {
      return `${item.price.toFixed(2).replace('.', ',')} €`;
    }
    return '';
  };

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="nav-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          onTouchMove={(e) => e.preventDefault()}
          aria-hidden="true"
        />
      )}
      <header className={`navbar ${mobileMenuOpen ? 'menu-open' : ''}`}>
      <div className="nav-inner">
        {/* Left: Brand Logo & Status */}
        <div className="nav-brand-group">
          <a
            href="#home"
            className="logo-wrap"
            aria-label="Venezia Pizza Service Startseite"
            onClick={(e) => handleLinkClick(e, { id: 'home' })}
          >
            <VeneziaLogo variant="navbar" height={50} />
          </a>

          <div className="nav-status-badge">
            <span className="status-dot" />
            <span className="status-label">Geöffnet</span>
            <span className="status-sep">•</span>
            <span className="status-delivery">30–45 Min.</span>
          </div>
        </div>

        {/* Center: Navigation Links & Search Bar */}
        <div className="nav-center-group">
          <nav className="desktop-nav" aria-label="Hauptnavigation">
            <ul className="nav-link-list">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <li key={link.id}>
                    <a
                      href={link.href}
                      className={`nav-link-item ${isActive ? 'active' : ''}`}
                      onClick={(e) => handleLinkClick(e, link)}
                    >
                      <span>{link.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Search Bar for Dishes */}
          <div className="nav-search-wrapper" ref={searchRef}>
            <div className={`nav-search-box ${isSearchOpen && searchQuery ? 'focused' : ''}`}>
              <Search size={15} className="nav-search-icon" />
              <input
                type="text"
                placeholder="Gericht suchen..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onNavigate) {
                    setIsSearchOpen(false);
                    onNavigate('speisekarte');
                  }
                }}
                className="nav-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="nav-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Suche leeren"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim().length >= 2 && (
              <div className="nav-search-dropdown">
                {searchResults.length > 0 ? (
                  <>
                    <div className="search-dropdown-header">
                      <span>{searchResults.length} Treffer gefunden</span>
                    </div>
                    <ul className="search-results-list">
                      {searchResults.map((item) => (
                        <li
                          key={item.id}
                          className="search-result-row"
                          onClick={() => handleSelectResult(item)}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="search-result-thumb"
                          />
                          <div className="search-result-info">
                            <div className="search-result-title">
                              {item.number && <span className="dish-num">#{item.number}</span>}
                              <span>{item.name}</span>
                            </div>
                            <span className="search-result-sub">
                              {item.toppings || item.desc || item.category}
                            </span>
                          </div>
                          <div className="search-result-action">
                            <span className="search-result-price">{getItemPrice(item)}</span>
                            <button
                              className={`search-add-btn ${addedItemId === item.id ? 'added' : ''}`}
                              onClick={(e) => handleQuickAdd(e, item)}
                              title="In den Warenkorb"
                            >
                              {addedItemId === item.id ? <Check size={14} /> : <Plus size={14} />}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div
                      className="search-dropdown-footer"
                      onClick={() => {
                        setIsSearchOpen(false);
                        if (onNavigate) onNavigate('speisekarte');
                      }}
                    >
                      <span>In der Speisekarte öffnen</span>
                      <ArrowRight size={13} />
                    </div>
                  </>
                ) : (
                  <div className="search-no-results">
                    <span>Keine Gerichte für "{searchQuery}" gefunden.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Phone, Cart & Order CTA */}
        <div className="nav-right">
          {/* Direct Phone Order Link */}
          <a
            href={restaurantInfo.phoneCall}
            className="nav-phone-link"
            title="Jetzt anrufen und bestellen"
          >
            <Phone size={15} className="phone-icon" />
            <div className="phone-info">
              <span className="phone-sub">Bestell-Hotline</span>
              <span className="phone-num">{restaurantInfo.phone}</span>
            </div>
          </a>

          {/* Cart Button */}
          <button
            className={`nav-cart-btn ${cartCount > 0 ? 'has-items' : ''}`}
            aria-label={`Warenkorb (${cartCount} Artikel)`}
            onClick={onOpenCart}
          >
            <div className="cart-icon-wrap">
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="nav-cart-badge">{cartCount}</span>
              )}
            </div>
            {cartTotal > 0 && (
              <span className="nav-cart-total">{cartTotal.toFixed(2).replace('.', ',')} €</span>
            )}
          </button>


          {/* Account Button (Replaces Order Online button) */}
          <button
            className="nav-account-btn"
            title="Mein Kundenkonto (Bestellverlauf & Profil)"
            onClick={() => {
              if (onOpenAccount) onOpenAccount();
            }}
            style={{
              background: customerUser ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#ffffff',
              color: customerUser ? '#ffffff' : '#0f172a',
              border: customerUser ? '1px solid #334155' : '1.5px solid #e2e8f0',
              borderRadius: '999px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease'
            }}
          >
            <div className="nav-account-avatar" style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: customerUser ? 'var(--red)' : '#f1f5f9',
              color: customerUser ? '#ffffff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={13} />
            </div>
            <span className="nav-account-label">{customerUser ? (customerUser.full_name?.split(' ')[0] || 'Konto') : 'Account'}</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="nav-mobile-drawer">
          {/* Mobile Search Bar */}
          <div className="mobile-search-wrapper" ref={mobileSearchRef}>
            <div className="nav-search-box mobile-search-box">
              <Search size={15} className="nav-search-icon" />
              <input
                type="text"
                placeholder="Gericht suchen..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="nav-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="nav-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Mobile search results preview */}
            {isSearchOpen && searchQuery.trim().length >= 2 && searchResults.length > 0 && (
              <ul className="search-results-list mobile-results-list">
                {searchResults.map((item) => (
                  <li
                    key={item.id}
                    className="search-result-row"
                    onClick={() => handleSelectResult(item)}
                  >
                    <img src={item.image} alt={item.name} className="search-result-thumb" />
                    <div className="search-result-info">
                      <div className="search-result-title">
                        {item.number && <span className="dish-num">#{item.number}</span>}
                        <span>{item.name}</span>
                      </div>
                      <span className="search-result-sub">
                        {item.toppings || item.desc || item.category}
                      </span>
                    </div>
                    <div className="search-result-action">
                      <span className="search-result-price">{getItemPrice(item)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mobile-links-group">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  <span className="mobile-link-text">{link.label}</span>
                </a>
              );
            })}

          </div>

          <div className="mobile-drawer-footer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <a href={restaurantInfo.phoneCall} className="mobile-phone-cta" style={{ fontSize: '12px', padding: '10px 8px' }}>
                  <Phone size={14} />
                  <span>{restaurantInfo.phone}</span>
                </a>
                <a href={restaurantInfo.phoneSecondaryCall} className="mobile-phone-cta" style={{ fontSize: '12px', padding: '10px 8px' }}>
                  <Phone size={14} />
                  <span>{restaurantInfo.phoneSecondary}</span>
                </a>
              </div>
              <a href={restaurantInfo.mobileCall} className="mobile-phone-cta" style={{ background: '#16a34a', color: '#ffffff' }}>
                <Smartphone size={15} />
                <span>Mobil: {restaurantInfo.mobile}</span>
              </a>
            </div>
            <button
              className="mobile-account-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAccount) onOpenAccount();
              }}
              style={{
                width: '100%',
                background: 'var(--red)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <User size={18} />
              <span>{customerUser ? `Mein Konto (${customerUser.full_name?.split(' ')[0] || customerUser.email})` : 'Account & Bestellungen'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
    </>
  );
}
