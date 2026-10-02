import React, { useState } from 'react';
import { Phone, Users, Clock, ArrowRight, Sparkles, Check, Flame } from 'lucide-react';
import { images } from '../assets/images';
import { restaurantInfo } from '../data/menuData';

export default function PartyCateringSection({ onInquiryClick }) {
  const [activeTab, setActiveTab] = useState('pizza');

  const tabContent = {
    pizza: {
      title: 'Partypizza (60 × 40 cm)',
      desc: 'Belegt mit bis zu 5 Wunschzutaten nach Wahl – perfekt für 8–12 Personen.',
      img: images.offers.a2,
      tag: 'Bestseller für Feiern',
      price: 'ab 30,00 €',
      badge: 'Ideal für 8–12 Personen'
    },
    pasta: {
      title: 'Große Pastableche (Al Forno)',
      desc: 'Rigatoni, Spaghetti oder Lasagne mit Bolognese- oder Schinken-Sahnesauce goldgelb überbacken.',
      img: images.dishes.pastaSpecial,
      tag: 'Ofenfrisch & Heiß',
      price: 'ab 28,00 €',
      badge: 'Für ca. 6–10 Personen'
    },
    salad: {
      title: 'Frische Salatplatten',
      desc: 'Knackiger gemischter Salat oder Bauernsalat mit Feta, Oliven und hausgemachtem Dressing.',
      img: images.categories.salad,
      tag: 'Knackig & Frisch',
      price: 'ab 18,00 €',
      badge: 'Frische Beilage'
    }
  };

  const current = tabContent[activeTab];

  return (
    <section className="catering-section" id="catering">
      <div className="catering-card-container">
        {/* Left Column: Clear & Spacious Content */}
        <div className="catering-info-side">
          <div className="catering-badge">
            <Sparkles size={13} />
            <span>FÜR GEBURTSTAGE, FEIERN &amp; FIRMENEVENTS</span>
          </div>

          <h2 className="catering-heading">
            Party- &amp; <span>Firmenservice</span> in Plauen
          </h2>



          {/* Clean Segmented Tabs */}
          <div className="catering-pill-tabs">
            <button
              className={`catering-pill-btn ${activeTab === 'pizza' ? 'active' : ''}`}
              onClick={() => setActiveTab('pizza')}
            >
              Partypizzen
            </button>
            <button
              className={`catering-pill-btn ${activeTab === 'pasta' ? 'active' : ''}`}
              onClick={() => setActiveTab('pasta')}
            >
              Nudelbleche
            </button>
            <button
              className={`catering-pill-btn ${activeTab === 'salad' ? 'active' : ''}`}
              onClick={() => setActiveTab('salad')}
            >
              Salatplatten
            </button>
          </div>

          {/* Active Tab Details Card */}
          <div className="catering-detail-box">
            <div className="catering-detail-header">
              <strong className="detail-title">{current.title}</strong>
              <span className="detail-price">{current.price}</span>
            </div>
            <p className="detail-desc">{current.desc}</p>
          </div>

          {/* Key Value Points */}
          <div className="catering-feature-row">
            <div className="catering-feature-item">
              <Check size={14} className="check-icon" />
              <span>Wunschtermin Express</span>
            </div>
            <div className="catering-feature-item">
              <Check size={14} className="check-icon" />
              <span>Warmhalteboxen inklusive</span>
            </div>
            <div className="catering-feature-item">
              <Check size={14} className="check-icon" />
              <span>5 bis 100+ Personen</span>
            </div>
          </div>


          {/* Clean Actions */}
          <div className="catering-action-group">
            <button className="primary-btn catering-inquiry-btn" onClick={onInquiryClick}>
              <span>Jetzt Party anfragen</span>
              <ArrowRight size={15} />
            </button>
            <a href={restaurantInfo.phoneCall} className="secondary-btn catering-phone-btn">
              <Phone size={15} />
              <span>{restaurantInfo.phone}</span>
            </a>
          </div>
        </div>

        {/* Right Column: Clean & Uncluttered Food Showcase */}
        <div className="catering-visual-side">
          <div className="catering-photo-frame">
            <img
              src={current.img}
              alt={current.title}
              className="catering-photo-img"
            />
            <div className="photo-gradient-overlay" />

            {/* Integrated Sleek Floating Badge inside Photo */}
            <div className="photo-info-pill">
              <div className="pill-dot" />
              <span>{current.badge} • Pünktlich &amp; heiß geliefert</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
