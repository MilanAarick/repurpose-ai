import React from "react";

const Logo = ({ size = 64, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`logo-animated ${className}`}
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="r-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fcbad3" />
        <stop offset="0.5" stopColor="#9d8bae" />
        <stop offset="1" stopColor="#5f779f" />
        <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="16 16" dur="2s" repeatCount="indefinite" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.18" />
      </filter>
    </defs>
    <path
      d="M16 8h20c8 0 12 4 12 12 0 6-3 10-8 11l8 13c1 2-1 4-3 4h-8c-1 0-2-1-3-2l-7-12h-3v12c0 2-2 4-4 4h-4c-2 0-4-2-4-4V12c0-2 2-4 4-4zm12 16c4 0 6-2 6-6s-2-6-6-6h-8v12h8z"
      fill="url(#r-gradient)"
      filter="url(#shadow)"
    />
  </svg>
);

export default Logo; 