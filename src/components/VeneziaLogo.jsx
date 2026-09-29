import React from 'react';

export default function VeneziaLogo({ variant = 'dark', height = 46, className = '' }) {
  const isDark = variant === 'dark';
  const logoSrc = isDark ? '/logo-header.png' : '/logo-light.png';

  return (
    <div
      className={`venezia-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
    >
      <img
        src={logoSrc}
        alt="Venezia Pizza Service Plauen"
        style={{
          height: `${height}px`,
          width: 'auto',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/venezia logo another concept-01.png';
        }}
      />
    </div>
  );
}
