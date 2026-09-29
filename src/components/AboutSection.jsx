import React from 'react';
import { ArrowRight } from 'lucide-react';
import { images } from '../assets/images';

export default function AboutSection({ onLearnMore }) {
  return (
    <section className="section about-section" id="ueber-uns">
      <div className="about-content">
        <div className="about-text">
          <div className="about-eyebrow">VENEZIA PIZZA SERVICE</div>
          <h2>
            Tradition <span>seit 1999</span>
          </h2>
          <p>
            Seit 1999 stehen wir in Plauen für echte italienische Küche, frische Zutaten und besten Geschmack.
            Ob Pizza, Pasta, Döner oder internationale Gerichte – bei uns genießen Sie Qualität, Vielfalt und herzlichen Service.
          </p>
          <button className="primary-btn" onClick={onLearnMore}>
            Mehr über uns <ArrowRight size={15} />
          </button>
        </div>

        <div className="about-image">
          <img
            src={images.veniceRialto}
            alt="Venedig Rialtobrücke bei Sonnenuntergang"
            loading="lazy"
          />
          <div className="about-overlay">
            <div>
              Ein Stück<br />
              Italien in<br />
              Plauen <span style={{ color: 'var(--red)' }}>♡</span>
            </div>
          </div>
          <div className="about-flag-strip">
            <b></b>
            <b></b>
            <b></b>
          </div>
        </div>
      </div>
    </section>
  );
}
