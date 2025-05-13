"use client";

export default function GrainBackground() {
  return (
    <div
      aria-hidden
      style={{
        pointerEvents: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        width: '100vw',
        height: '100vh',
        background: 'transparent',
        mixBlendMode: 'overlay',
        opacity: 0.18,
        animation: 'grainMove 2s linear infinite',
      }}
      className="grain-bg"
    />
  );
}

// Add the following CSS to globals.css:
//
// .grain-bg {
//   background-image: url('data:image/svg+xml;utf8,<svg width="100%25" height="100%25" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%25" height="100%25" filter="url(%23noiseFilter)"/></svg>');
//   background-size: cover;
//   animation: grainMove 2s linear infinite;
// }
//
// @keyframes grainMove {
//   0% { background-position: 0 0; }
//   100% { background-position: 100px 100px; }
// } 