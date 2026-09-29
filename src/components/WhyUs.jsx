import React from 'react';
import { Bike, Leaf, ChefHat, Heart } from 'lucide-react';

export default function WhyUs() {
  const features = [
    {
      icon: <Bike size={28} strokeWidth={1.8} />,
      title: 'Schnelle Lieferung',
      subtitle: 'Heiß und pünktlich'
    },
    {
      icon: <Leaf size={28} strokeWidth={1.8} />,
      title: 'Frische Zutaten',
      subtitle: 'Beste Qualität'
    },
    {
      icon: <ChefHat size={28} strokeWidth={1.8} />,
      title: 'Vielfältige Auswahl',
      subtitle: 'Italienisch & International'
    },
    {
      icon: <Heart size={28} strokeWidth={1.8} />,
      title: 'Zufriedene Kunden',
      subtitle: 'Seit 1999 in Plauen'
    }
  ];

  return (
    <section className="why-section">
      <div className="why-heading">
        <h2>
          Warum <span>Venezia?</span>
        </h2>
        <p>Mehr als nur Pizza – ein Stück Italien in Plauen.</p>
      </div>

      <div className="why-grid">
        {features.map((item, idx) => (
          <div className="why-card" key={idx}>
            <div className="why-icon">{item.icon}</div>
            <strong>{item.title}</strong>
            <span>{item.subtitle}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
