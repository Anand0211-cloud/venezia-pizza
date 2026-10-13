import React, { useState, useEffect } from 'react';
import { ChevronRight, Instagram, Facebook, Twitter } from 'lucide-react';
import { images } from '../assets/images';

const SLIDE_INTERVAL = 5000; // switch food every 5s

export default function Hero({ onOrderClick, onMenuClick, onAddToCart }) {
  const [showBurger, setShowBurger] = useState(false);
  const [foodExiting, setFoodExiting] = useState(false);
  const [burgerKey, setBurgerKey] = useState(0); // force re-trigger animation

  useEffect(() => {
    const cycle = setInterval(() => {
      setFoodExiting(true);
      setTimeout(() => {
        setShowBurger(prev => {
          if (!prev) setBurgerKey(k => k + 1); // fresh anim key each time burger shows
          return !prev;
        });
        setFoodExiting(false);
      }, 450);
    }, SLIDE_INTERVAL);
    return () => clearInterval(cycle);
  }, []);

  return (
    <section className="hero-custom" id="home">
      {/* Ambient bg */}
      <div className="hero-bg-curve-left" />
      <div className="hero-bg-curve-right" />

      {/* Lettuce decorations */}
      <img src={images.greenLettuce} alt="Frischer Salat" className="lettuce-decor lettuce-left" />
      <img src={images.greenLettuce} alt="Frischer Salat" className="lettuce-decor lettuce-right" />

      <div className="hero-custom-container">

        {/* ── LEFT: static text ── */}
        <div className="hero-custom-left">
          <h1 className="hero-custom-title">
            Lust auf etwas Leckeres?<br />
            <span className="pizza-word-gradient">LASS VENEZIA ES SERVIEREN.</span>
          </h1>

          <p className="hero-custom-desc">
            Our heart is made of pizza, and our mission is to share our funny pizza quote love with everyone.
          </p>

          <div className="hero-custom-action-row desktop-only-action">
            <button className="hero-order-pill-btn" onClick={onOrderClick}>
              <span>ORDER NOW</span>
              <div className="btn-arrow-circle">
                <ChevronRight size={16} />
              </div>
            </button>
          </div>
        </div>{/* end hero-custom-left */}

        {/* ── RIGHT: only this area swaps ── */}
        <div className="hero-custom-right">

          {/* Orange Arch */}
          <div className="hero-orange-arch">
            <div className="hero-social-sidebar">
              <span className="follow-text">Follow Us</span>
              <div className="follow-line" />
              <div className="social-icon-bubbles">
                <a href="https://www.facebook.com/profile.php?id=100059933894217&mibextid=wwXIfr&rdid=IcSnReX9PW6bdAqq&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19TDhNZ6CN%2F%3Fmibextid%3DwwXIfr" target="_blank" rel="noopener noreferrer" className="social-bubble" aria-label="Facebook">
                  <Facebook size={12} fill="currentColor" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-bubble" aria-label="Instagram">
                  <Instagram size={12} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-bubble" aria-label="Twitter">
                  <Twitter size={12} fill="currentColor" />
                </a>
              </div>
            </div>
          </div>

          {/* Food showcase container */}
          <div className="hero-variety-pizza-wrap">

            {/* ─ PIZZA (shown when !showBurger) ─ */}
            <div className={`hero-food-slot ${!showBurger && !foodExiting ? 'food-visible' : 'food-hidden'}`}>
              <img
                src={images.varietyPizzaHero}
                alt="Gourmet Pizza"
                className="hero-variety-pizza-img"
              />
            </div>

            {/* ─ BURGER ─ */}
            <div className={`hero-food-slot ${showBurger && !foodExiting ? 'food-visible' : 'food-hidden'}`}>
              <img
                key={burgerKey}
                src={images.burgerAssembled}
                alt="Crispy Burger"
                className="hero-burger-assembled-img"
              />
            </div>

          </div>{/* end pizza-wrap */}
        </div>{/* end hero-right */}

        {/* ── MOBILE: ORDER NOW BUTTON BELOW FOOD SHOWCASE ── */}
        <div className="hero-custom-action-row mobile-only-action">
          <button className="hero-order-pill-btn" onClick={onOrderClick}>
            <span>ORDER NOW</span>
            <div className="btn-arrow-circle">
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      </div>{/* end container */}
    </section>
  );
}
