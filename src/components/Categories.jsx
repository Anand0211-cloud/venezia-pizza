import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { categoriesData } from '../data/menuData';

export default function Categories({ selectedCategory, onSelectCategory }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
      
      const pageIndex = Math.round(scrollLeft / clientWidth);
      setCurrentPage(pageIndex);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollability, 350);
    }
  };

  const scrollToPage = (pageIndex) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      scrollRef.current.scrollTo({ left: pageIndex * clientWidth, behavior: 'smooth' });
      setTimeout(checkScrollability, 350);
    }
  };

  return (
    <section className="categories-slider-section" aria-label="Kategorien Übersicht">
      <div className="categories-slider-wrapper">
        {/* Section Header */}
        <div className="categories-header-row">
          <div>
            <span className="categories-eyebrow">
              <Sparkles size={13} color="var(--red)" />
              FRISCH AUS UNSERER KÜCHE
            </span>
            <h2 className="categories-title">Kategorien &amp; Spezialitäten</h2>
          </div>

          {/* Slider Controls & Page Dots */}
          <div className="slider-nav-arrows">
            <div className="slider-dots">
              <button
                className={`slider-dot ${currentPage === 0 ? 'active' : ''}`}
                onClick={() => scrollToPage(0)}
                aria-label="Seite 1 (5 Kategorien)"
              />
              <button
                className={`slider-dot ${currentPage === 1 ? 'active' : ''}`}
                onClick={() => scrollToPage(1)}
                aria-label="Seite 2 (4 Kategorien)"
              />
            </div>

            <button
              className={`slider-arrow-btn ${!canScrollLeft ? 'disabled' : ''}`}
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Vorherige 5 Kategorien"
              title="Vorherige anzeigen"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className={`slider-arrow-btn ${!canScrollRight ? 'disabled' : ''}`}
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Nächste 5 Kategorien"
              title="Nächste anzeigen"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* 5-Images-in-one-go Horizontal Track */}
        <div
          className="categories-scroll-track"
          ref={scrollRef}
          onScroll={checkScrollability}
        >
          {categoriesData.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                className={`category-oval-card ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
                title={`${cat.name} auswählen`}
              >
                {/* Large Oval Image Frame */}
                <div className="category-oval-frame">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="category-oval-img"
                    loading="lazy"
                  />
                  <div className="oval-glass-overlay" />
                </div>

                {/* Category Info */}
                <div className="category-oval-info">
                  <strong className="category-oval-name">{cat.name}</strong>
                  {cat.count && <span className="category-oval-count">{cat.count}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
