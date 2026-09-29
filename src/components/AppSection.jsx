import React from 'react';
import { images } from '../assets/images';

export default function AppSection() {
  return (
    <section className="app-section">
      <div className="app-content">
        <div className="app-text">
          <h2>Jetzt noch einfacher bestellen!</h2>
          <p>Mit unserer App – schnell, bequem und immer aktuell.</p>

          <div className="app-buttons">
            {/* Apple App Store */}
            <a
              href="#app-store"
              className="store-button"
              onClick={(e) => { e.preventDefault(); alert('Die iOS App steht in Kürze im Apple App Store zum Download bereit!'); }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.84.94-2.92-1 .04-2.22.67-2.91 1.48-.56.65-1.05 1.74-.92 2.8 1.12.09 2.26-.59 2.89-1.36z"/>
              </svg>
              <div>
                <small>Laden im</small>
                <strong>App Store</strong>
              </div>
            </a>

            {/* Google Play Store */}
            <a
              href="#google-play"
              className="store-button"
              onClick={(e) => { e.preventDefault(); alert('Die Android App steht in Kürze im Google Play Store bereit!'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186c-.37-.306-.61-.775-.61-1.316V3.13c0-.54.24-1.01.61-1.316zM15.207 13.414l2.793 2.793-13.44 7.64 10.647-10.433zm0-2.828L4.56 0.153l13.44 7.64-2.793 2.793zm1.414 1.414l3.86-2.193c.89-.505.89-1.33 0-1.836l-3.86-2.193-2.02 2.02 2.02 2.02 2.02 2.02z"/>
              </svg>
              <div>
                <small>JETZT BEI</small>
                <strong>Google Play</strong>
              </div>
            </a>
          </div>
        </div>

        {/* Dynamic App Screens */}
        <div className="phones-wrapper">
          {/* Phone 1: App Menu Screen */}
          <div className="phone-mockup phone-one">
            <div className="phone-mockup-inner">
              <div className="phone-mockup-header">
                <div className="phone-mockup-notch"></div>
              </div>
              <div className="phone-mockup-screen">
                <div className="phone-mockup-logo">Venezia Pizza</div>
                <div className="phone-mockup-item">
                  <img src={images.pizzas.margherita} alt="Margherita" />
                  <div>
                    <div className="phone-mockup-item-text">Pizza Margherita</div>
                    <div className="phone-mockup-item-price">6,50 €</div>
                  </div>
                </div>
                <div className="phone-mockup-item">
                  <img src={images.pizzas.salami} alt="Salami" />
                  <div>
                    <div className="phone-mockup-item-text">Pizza Salami</div>
                    <div className="phone-mockup-item-price">7,50 €</div>
                  </div>
                </div>
                <div className="phone-mockup-item">
                  <img src={images.categories.pasta} alt="Pasta" />
                  <div>
                    <div className="phone-mockup-item-text">Pasta Bolognese</div>
                    <div className="phone-mockup-item-price">8,00 €</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phone 2: App Pizza View */}
          <div className="phone-mockup phone-two">
            <div className="phone-mockup-inner">
              <div className="phone-mockup-header">
                <div className="phone-mockup-notch"></div>
              </div>
              <div className="phone-mockup-screen" style={{ background: '#f8f8f8', textAlign: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#111' }}>Deine Bestellung</div>
                <img
                  src={images.heroPizza}
                  alt="Pizza"
                  style={{ width: '85px', height: '85px', borderRadius: '50%', margin: '4px auto' }}
                />
                <div style={{ fontSize: '8px', fontWeight: '700' }}>Familienpizza</div>
                <div style={{ fontSize: '8px', color: 'var(--red)', fontWeight: '800' }}>25,00 €</div>
                <div style={{ background: 'var(--red)', color: 'white', borderRadius: '4px', padding: '3px', fontSize: '7.5px', fontWeight: '700', marginTop: '4px' }}>
                  Bestellen
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
