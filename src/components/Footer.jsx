import React from 'react';
import { MapPin, Phone, Smartphone, Mail, Clock, ArrowUpRight, ChevronRight } from 'lucide-react';
import VeneziaLogo from './VeneziaLogo';
import { restaurantInfo } from '../data/menuData';
import './Footer.css';

export default function Footer({ onNavigate }) {
  const handleLink = (e, target) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(target);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" id="kontakt">
      <div className="footer-main">
        {/* Column 1: Brand, Tagline, Highlights & Socials */}
        <div className="footer-brand">
          <a
            href="#home"
            className="footer-logo-link"
            aria-label="Venezia Pizza Service - Startseite"
            onClick={(e) => handleLink(e, 'home')}
          >
            <VeneziaLogo variant="footer" height={58} />
          </a>

          <p className="footer-tagline-text">
            <span>Stolz in Plauen seit 1999</span>
            <span className="footer-tagline-sub">25+ Jahre Pizza &amp; kulinarische Tradition</span>
          </p>

          <div className="footer-highlights">
            <span className="footer-highlight-badge">Steinofen-Frische</span>
            <span className="footer-highlight-badge">30–45 Min. Lieferung</span>
            <span className="footer-highlight-badge">Abholung &amp; Bringdienst</span>
          </div>

          <div className="footer-socials-wrap">
            <span className="footer-socials-label">Folge uns</span>
            <div className="socials">
              <a
                href={restaurantInfo.social?.facebook || "https://www.facebook.com/profile.php?id=100059933894217&mibextid=wwXIfr&rdid=IcSnReX9PW6bdAqq&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19TDhNZ6CN%2F%3Fmibextid%3DwwXIfr"}
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn"
                aria-label="Besuche uns auf Facebook"
              >
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.688 5H18V0h-3.812C10.5 0 9 1.484 9 4.315V8z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn"
                aria-label="Besuche uns auf Instagram"
              >
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Column 2: Kontakt & Direktanruf */}
        <div className="footer-column footer-contact-col">
          <h4 className="footer-column-title">
            <span className="title-bullet"></span> Kontakt &amp; Anfahrt
          </h4>

          <div className="footer-cards-stack">
            {/* Telephone Card */}
            <div className="footer-contact-card footer-phone-card" style={{ cursor: 'default' }}>
              <div className="contact-card-icon">
                <Phone size={17} />
              </div>
              <div className="contact-card-body">
                <div className="contact-card-label">Telefonische Bestellung</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                  <a
                    href="tel:03741522860"
                    style={{ color: '#ffffff', fontWeight: '700', fontSize: '13.5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                    aria-label="Telefon 03741 522860 anrufen"
                  >
                    <span>03741 522860</span>
                    <span style={{ fontSize: '10px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.2)', padding: '1px 6px', borderRadius: '10px' }}>Tel 1</span>
                  </a>
                  <a
                    href="tel:03741522861"
                    style={{ color: '#ffffff', fontWeight: '700', fontSize: '13.5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                    aria-label="Telefon 03741 522861 anrufen"
                  >
                    <span>03741 522861</span>
                    <span style={{ fontSize: '10px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.2)', padding: '1px 6px', borderRadius: '10px' }}>Tel 2</span>
                  </a>
                  <a
                    href="tel:03741522862"
                    style={{ color: '#ffffff', fontWeight: '700', fontSize: '13.5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                    aria-label="Fax 03741 522862"
                  >
                    <span>03741 522862</span>
                    <span style={{ fontSize: '10px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.2)', padding: '1px 6px', borderRadius: '10px' }}>Fax</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Mobile Card */}
            <a
              href="tel:01601177240"
              className="footer-contact-card"
              aria-label="Mobil anrufen: 0160 1177240"
            >
              <div className="contact-card-icon">
                <Smartphone size={17} />
              </div>
              <div className="contact-card-body">
                <div className="contact-card-label">Mobiltelefon</div>
                <div className="contact-card-main">0160 1177240</div>
                <div className="contact-card-sub" style={{ color: '#94a3b8' }}>Direkt anrufen</div>
              </div>
              <ChevronRight size={16} className="contact-card-arrow" />
            </a>

            {/* Address Card */}
            <a
              href="https://maps.google.com/?q=Martin-Luther-Stra%C3%9Fe+68+08525+Plauen"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-contact-card"
              aria-label="Standort auf Google Maps öffnen"
            >
              <div className="contact-card-icon">
                <MapPin size={17} />
              </div>
              <div className="contact-card-body">
                <div className="contact-card-label">Adresse &amp; Abholung</div>
                <div className="contact-card-main">
                  Martin-Luther-Straße 68<br />
                  <span className="contact-zip">08525 Plauen</span>
                </div>
              </div>
              <ArrowUpRight size={15} className="contact-card-arrow" />
            </a>

            {/* Email Card */}
            <a
              href={`mailto:${restaurantInfo.email}`}
              className="footer-contact-card"
              aria-label={`E-Mail senden an ${restaurantInfo.email}`}
            >
              <div className="contact-card-icon">
                <Mail size={17} />
              </div>
              <div className="contact-card-body">
                <div className="contact-card-label">E-Mail Kontakt</div>
                <div className="contact-card-main email-text">{restaurantInfo.email}</div>
              </div>
            </a>
          </div>
        </div>

        {/* Column 3: Öffnungszeiten */}
        <div className="footer-column footer-hours-col">
          <h4 className="footer-column-title">
            <span className="title-bullet"></span> Öffnungszeiten
          </h4>

          <div className="footer-hours-box notranslate" translate="no">
            <div className="hours-row">
              <div className="hours-head">
                <Clock size={15} className="hours-icon" />
                <span className="hours-day">Montag – Freitag</span>
              </div>
              <div className="hours-times">
                <span className="time-pill">10:30 – 14:30 Uhr</span>
                <span className="time-pill">16:30 – 23:00 Uhr</span>
              </div>
            </div>

            <div className="hours-divider"></div>

            <div className="hours-row">
              <div className="hours-head">
                <Clock size={15} className="hours-icon" />
                <span className="hours-day">Samstag, Sonntag &amp; Feiertage</span>
              </div>
              <div className="hours-times">
                <span className="time-pill highlight-pill">10:30 – 23:00 Uhr</span>
                <span className="hours-note">Durchgehend geöffnet</span>
              </div>
            </div>

            <div className="hours-footer-badge">
              <span className="pulse-indicator"></span>
              <span>Warme Küche &amp; Lieferung bis 23:00 Uhr</span>
            </div>
          </div>
        </div>

        {/* Column 4: Schnelllinks */}
        <div className="footer-column footer-links-col">
          <h4 className="footer-column-title">
            <span className="title-bullet"></span> Schnelllinks
          </h4>
          <nav className="footer-links-nav" aria-label="Schnelllinks">
            <a href="#home" className="footer-nav-link" onClick={(e) => handleLink(e, 'home')}>
              <span>Home</span>
              <ChevronRight size={14} className="nav-link-icon" />
            </a>
            <a href="#speisekarte" className="footer-nav-link" onClick={(e) => handleLink(e, 'speisekarte')}>
              <span>Speisekarte</span>
              <ChevronRight size={14} className="nav-link-icon" />
            </a>
            <a href="#angebote" className="footer-nav-link" onClick={(e) => handleLink(e, 'angebote')}>
              <span>Angebote</span>
              <ChevronRight size={14} className="nav-link-icon" />
            </a>
            <a href="#catering" className="footer-nav-link" onClick={(e) => handleLink(e, 'catering')}>
              <span>Party-Service</span>
              <ChevronRight size={14} className="nav-link-icon" />
            </a>
          </nav>
        </div>
      </div>

      {/* Footer Bottom Strip */}
      <div className="footer-bottom">
        <div className="footer-bottom-copy">
          <div>© {currentYear} Venezia Pizza Service. Alle Rechte vorbehalten.</div>
          <div className="footer-developer-credit">
            Designed and Developed by{' '}
            <a
              href="https://www.intelloft.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="developer-credit-link"
            >
              Intelloft
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
