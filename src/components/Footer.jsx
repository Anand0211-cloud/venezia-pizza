import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import VeneziaLogo from './VeneziaLogo';
import { restaurantInfo } from '../data/menuData';

export default function Footer({ onNavigate }) {
  const handleLink = (e, target) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(target);
    }
  };

  return (
    <footer className="footer" id="kontakt">
      <div className="footer-main">
        {/* Column 1: Brand & Socials */}
        <div className="footer-brand">
          <a href="#home" aria-label="Venezia Pizza Service" onClick={(e) => handleLink(e, 'home')}>
            <VeneziaLogo variant="light" />
          </a>
          <p>
            {restaurantInfo.tagline}
          </p>

          <div className="socials">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn"
              aria-label="Facebook"
            >
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.688 5H18V0h-3.812C10.5 0 9 1.484 9 4.315V8z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn"
              aria-label="Instagram"
            >
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Kontakt */}
        <div className="footer-column">
          <h4>Kontakt</h4>
          <div className="contact-row">
            <MapPin size={16} />
            <span>
              Martin-Luther-Straße 68<br />
              08525 Plauen
            </span>
          </div>
          <div className="contact-row">
            <Phone size={16} />
            <a href={restaurantInfo.phoneCall} style={{ color: 'inherit' }}>
              <strong>{restaurantInfo.phone}</strong>
            </a>
          </div>
          <div className="contact-row">
            <Mail size={16} />
            <a href={`mailto:${restaurantInfo.email}`} style={{ color: 'inherit' }}>
              {restaurantInfo.email}
            </a>
          </div>
        </div>

        {/* Column 3: Öffnungszeiten */}
        <div className="footer-column">
          <h4>Öffnungszeiten</h4>
          <div className="contact-row">
            <Clock size={16} />
            <div>
              <span style={{ color: '#ffffff', fontWeight: '600' }}>Montag – Freitag</span><br />
              10:30 – 14:30 Uhr<br />
              16:30 – 23:00 Uhr
            </div>
          </div>
          <div className="contact-row">
            <Clock size={16} />
            <div>
              <span style={{ color: '#ffffff', fontWeight: '600' }}>Samstag, Sonntag &amp; Feiertage</span><br />
              10:30 – 23:00 Uhr
            </div>
          </div>
        </div>

        {/* Column 4: Schnelllinks */}
        <div className="footer-column">
          <h4>Schnelllinks</h4>
          <a href="#home" onClick={(e) => handleLink(e, 'home')}>Home</a>
          <a href="#speisekarte" onClick={(e) => handleLink(e, 'speisekarte')}>Speisekarte</a>
          <a href="#angebote" onClick={(e) => handleLink(e, 'angebote')}>Angebote</a>
          <a href="#ueber-uns" onClick={(e) => handleLink(e, 'ueber-uns')}>Über uns</a>
          <a href="#kontakt" onClick={(e) => handleLink(e, 'kontakt')}>Kontakt</a>
        </div>
      </div>

      {/* Footer Bottom Strip */}
      <div className="footer-bottom">
        <div>
          © {new Date().getFullYear()} Venezia Pizza Service. Alle Rechte vorbehalten.
        </div>

        <div className="footer-tagline">
          <span>Echte Pizza. Echter Geschmack.</span>
          <div className="italy-flag" title="Authentisch Italienisch">
            <b></b>
            <b></b>
            <b></b>
          </div>
        </div>
      </div>
    </footer>
  );
}
