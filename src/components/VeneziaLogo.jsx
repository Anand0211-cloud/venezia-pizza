import React from 'react';

export default function VeneziaLogo({ variant = 'dark' }) {
  const isDark = variant === 'dark'; // dark logo for light background
  const primaryColor = isDark ? '#1a1a1a' : '#ffffff';
  const subtitleColor = isDark ? '#666666' : '#cccccc';

  return (
    <div className="venezia-logo-container" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <svg width="150" height="54" viewBox="0 0 220 78" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Gondola & Rialto Bridge Silhouette */}
        <g opacity={isDark ? "0.9" : "0.95"}>
          {/* Subtle bridge arch outline */}
          <path
            d="M 25 36 C 55 12, 165 12, 195 36"
            stroke={isDark ? "#b8860b" : "#e5c07b"}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 45 36 C 70 20, 150 20, 175 36"
            stroke={isDark ? "#c99738" : "#f3d998"}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Rialto architectural towers and arch details */}
          <path
            d="M 75 32 L 75 22 L 85 18 L 95 22 L 95 32 Z M 125 32 L 125 22 L 135 18 L 145 22 L 145 32 Z M 95 24 L 125 24 L 125 32 L 95 32 Z"
            fill={isDark ? "#8b6914" : "#e0b85c"}
            opacity="0.65"
          />
          {/* Traditional Venetian Gondola silhouette */}
          <path
            d="M 60 35 C 75 38, 145 38, 160 35 C 166 33, 170 31, 174 27 C 172 35, 155 40, 110 40 C 65 40, 48 35, 46 27 C 50 31, 54 33, 60 35 Z"
            fill={isDark ? "#2c2c2c" : "#ffffff"}
          />
          {/* Gondola prow (ferro) */}
          <path
            d="M 46 27 C 44 23, 40 21, 38 18 L 40 18 C 43 20, 46 23, 47 26 Z"
            fill="#e30613"
          />
        </g>

        {/* Brand Name "VENEZIA" */}
        <text
          x="110"
          y="58"
          textAnchor="middle"
          fill={primaryColor}
          fontFamily="'Inter', 'Playfair Display', Georgia, serif"
          fontWeight="800"
          fontSize="24"
          letterSpacing="2.5"
        >
          VENEZIA
        </text>

        {/* Subtitle "PIZZA SERVICE" */}
        <text
          x="110"
          y="70"
          textAnchor="middle"
          fill={subtitleColor}
          fontFamily="'Inter', sans-serif"
          fontWeight="700"
          fontSize="8.5"
          letterSpacing="4"
        >
          PIZZA SERVICE
        </text>

        {/* Italian Tricolor Flag line */}
        <rect x="75" y="74" width="23" height="2.5" rx="1" fill="#008c45" />
        <rect x="98.5" y="74" width="23" height="2.5" rx="1" fill="#ffffff" stroke={isDark ? "#e0e0e0" : "none"} strokeWidth="0.5" />
        <rect x="122" y="74" width="23" height="2.5" rx="1" fill="#e30613" />
      </svg>
    </div>
  );
}
