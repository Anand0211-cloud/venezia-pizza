import React from 'react';

export default function VeneziaLogo({ variant = 'dark', height, className = '' }) {
  const isNavbar = variant === 'dark' || variant === 'navbar';
  const logoSrc = isNavbar ? '/logo_Navbar.png' : '/logo_footer.png';
  const defaultHeight = isNavbar ? 50 : 58;
  const currentHeight = height || defaultHeight;

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
          height: `${currentHeight}px`,
          width: 'auto',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}
