import React, { useState, useEffect } from 'react';
import { ChevronRight, Star, Minus, Plus, Instagram, Facebook, Twitter } from 'lucide-react';
import { images } from '../assets/images';

const SLIDE_INTERVAL = 5000; // switch food every 5s

export default function Hero({ onAddToCart, onOrderClick, onMenuClick }) {
  const [qty, setQty] = useState(1);
  const [showBurger, setShowBurger] = useState(false);
  const [foodExiting, setFoodExiting] = useState(false);
  const [burgerKey, setBurgerKey] = useState(0); // force re-trigger animation

  const currentFood = showBurger
    ? { label: 'Crispy Burger', price: '$9.49', id: 'b1', addPrice: 9.49, thumb: images.burgerAssembled, desc: 'Crispy chicken, lettuce, tomato, cheese & onions' }
    : { label: 'Mexican Pizza', price: '$8.99', id: '16', addPrice: 8.99, thumb: images.varietyPizzaHero, desc: 'Scharfe Salami, Peperoni, Mais, frische Tomaten & Gouda Käse' };

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

  const handleAddItem = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart({
        id: currentFood.id,
        name: currentFood.label,
        price: currentFood.addPrice,
        quantity: qty,
        image: currentFood.thumb,
        desc: currentFood.desc,
      });
    }
  };

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
            Everything is better
            with <span className="pizza-word-gradient">VENEZIA PIZZA</span>
          </h1>

          <p className="hero-custom-desc">
            Our heart is made of pizza, and our mission is to share our funny pizza quote love with everyone.
          </p>

          <div className="hero-custom-action-row">
            <button className="hero-order-pill-btn" onClick={onOrderClick}>
              <span>ORDER NOW</span>
              <div className="btn-arrow-circle">
                <ChevronRight size={16} />
              </div>
            </button>

            <button className="hero-learn-more-btn" onClick={onMenuClick}>
              <span>Learn More</span>
              <div className="learn-arrow-circle">
                <ChevronRight size={15} />
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
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-bubble" aria-label="Facebook">
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

            {/* Floating Card 1: food info */}
            <div
              className="floating-order-card"
              onClick={handleAddItem}
              title={`${currentFood.label} zum Warenkorb hinzufügen`}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={currentFood.thumb}
                alt={`${currentFood.label} Thumbnail`}
                className="floating-pizza-thumb"
              />
              <div className="floating-card-body">
                <div className="floating-card-title">{currentFood.label}</div>
                <div className="floating-stars">
                  <Star size={11} fill="#f59e0b" color="#f59e0b" />
                  <Star size={11} fill="#f59e0b" color="#f59e0b" />
                  <Star size={11} fill="#f59e0b" color="#f59e0b" />
                  <Star size={11} fill="#f59e0b" color="#f59e0b" />
                  <Star size={11} color="#cbd5e1" />
                </div>
                <div className="floating-price-row">
                  <span className="card-price">{currentFood.price}</span>
                  <div className="card-qty-selector">
                    <button onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)); }} className="qty-btn" aria-label="Weniger">
                      <Minus size={10} />
                    </button>
                    <span className="qty-num">{qty}</span>
                    <button onClick={(e) => { e.stopPropagation(); setQty(qty + 1); }} className="qty-btn" aria-label="Mehr">
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card 2: foodies */}
            <div className="floating-foodies-card">
              <span className="foodies-label">Our Foodies</span>
              <div className="foodies-avatars-row">
                <div className="avatar-group">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Customer 1" className="avatar-img" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Customer 2" className="avatar-img" />
                  <img src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80" alt="Customer 3" className="avatar-img" />
                  <div className="avatar-count-badge">20k+</div>
                </div>
              </div>
            </div>

          </div>{/* end pizza-wrap */}
        </div>{/* end hero-right */}
      </div>{/* end container */}
    </section>
  );
}

