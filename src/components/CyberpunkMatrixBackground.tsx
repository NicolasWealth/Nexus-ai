import { useCallback, useEffect, useRef, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';
import type { Container } from '@tsparticles/engine';

// ─── Inline CSS ───────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes pulse-grid {
    0%, 100% { opacity: 0.07; transform: scale(1) rotate(0deg); }
    50%       { opacity: 0.14; transform: scale(1.04) rotate(0.4deg); }
  }
  @keyframes drift-hex {
    0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.05; }
    33%  { transform: translate(12px, -8px) rotate(60deg); opacity: 0.12; }
    66%  { transform: translate(-8px, 14px) rotate(120deg); opacity: 0.06; }
    100% { transform: translate(0, 0) rotate(180deg); opacity: 0.05; }
  }
  @keyframes scan-line {
    0%   { top: -4px; }
    100% { top: 100%; }
  }
  .cbg-root {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    background: #000;
  }
  .cbg-grid {
    position: absolute;
    inset: -10%;
    width: 120%;
    height: 120%;
    animation: pulse-grid 6s ease-in-out infinite;
    pointer-events: none;
  }
  .cbg-hex {
    position: absolute;
    animation: drift-hex 18s ease-in-out infinite;
    pointer-events: none;
  }
  .cbg-scanline {
    position: absolute;
    left: 0; right: 0;
    height: 2px;
    background: linear-gradient(
      to bottom,
      transparent,
      rgba(0, 255, 128, 0.08),
      transparent
    );
    animation: scan-line 8s linear infinite;
    pointer-events: none;
    z-index: 1;
  }
  .cbg-particles {
    position: absolute;
    inset: 0;
    z-index: 2;
  }
  .cbg-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 40%,
      rgba(0, 0, 0, 0.7) 100%
    );
    z-index: 3;
    pointer-events: none;
  }
`;

// ─── SVG Wireframe ─────────────────────────────────────────────────────────────
const WireframeLayer = () => (
  <svg
    className="cbg-grid"
    viewBox="0 0 1200 900"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern id="micro-grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00ff88" strokeWidth="0.3" opacity="0.4" />
      </pattern>
      <pattern id="macro-grid" width="200" height="200" patternUnits="userSpaceOnUse">
        <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#00ff88" strokeWidth="0.8" opacity="0.6" />
      </pattern>
      <radialGradient id="grid-fade" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity="1" />
        <stop offset="70%" stopColor="white" stopOpacity="0.4" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <mask id="grid-mask">
        <rect width="100%" height="100%" fill="url(#grid-fade)" />
      </mask>
    </defs>

    {/* Micro grid */}
    <rect width="100%" height="100%" fill="url(#micro-grid)" mask="url(#grid-mask)" opacity="0.5" />
    {/* Macro grid */}
    <rect width="100%" height="100%" fill="url(#macro-grid)" mask="url(#grid-mask)" opacity="0.7" />

    {/* Corner accent brackets */}
    {[
      [60, 60, 1, 1],
      [1140, 60, -1, 1],
      [60, 840, 1, -1],
      [1140, 840, -1, -1],
    ].map(([x, y, sx, sy], i) => (
      <g key={i} transform={`translate(${x}, ${y}) scale(${sx}, ${sy})`} opacity="0.35">
        <line x1="0" y1="0" x2="60" y2="0" stroke="#00ff88" strokeWidth="1.5" />
        <line x1="0" y1="0" x2="0" y2="60" stroke="#00ff88" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="3" fill="#00ff88" />
      </g>
    ))}

    {/* Diagonal accent lines */}
    <line x1="0" y1="450" x2="300" y2="150" stroke="#c084fc" strokeWidth="0.6" opacity="0.2" />
    <line x1="1200" y1="450" x2="900" y2="150" stroke="#c084fc" strokeWidth="0.6" opacity="0.2" />
    <line x1="0" y1="450" x2="300" y2="750" stroke="#c084fc" strokeWidth="0.6" opacity="0.2" />
    <line x1="1200" y1="450" x2="900" y2="750" stroke="#c084fc" strokeWidth="0.6" opacity="0.2" />

    {/* Central crosshair */}
    <g opacity="0.18">
      <line x1="590" y1="390" x2="610" y2="390" stroke="#00ff88" strokeWidth="1" />
      <line x1="590" y1="510" x2="610" y2="510" stroke="#00ff88" strokeWidth="1" />
      <line x1="540" y1="440" x2="540" y2="460" stroke="#00ff88" strokeWidth="1" />
      <line x1="660" y1="440" x2="660" y2="460" stroke="#00ff88" strokeWidth="1" />
      <circle cx="600" cy="450" r="50" fill="none" stroke="#00ff88" strokeWidth="0.8" strokeDasharray="8 4" />
      <circle cx="600" cy="450" r="90" fill="none" stroke="#c084fc" strokeWidth="0.5" strokeDasharray="4 8" />
    </g>

    {/* Floating hexagons */}
    {[
      { cx: 200, cy: 200, r: 60, color: '#00ff88', delay: '0s' },
      { cx: 1000, cy: 150, r: 45, color: '#c084fc', delay: '3s' },
      { cx: 150, cy: 700, r: 70, color: '#c084fc', delay: '6s' },
      { cx: 1050, cy: 720, r: 55, color: '#e8ff00', delay: '9s' },
      { cx: 600, cy: 100, r: 40, color: '#00ff88', delay: '12s' },
    ].map(({ cx, cy, r, color, delay }, i) => {
      const pts = Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 3) * k - Math.PI / 6;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(' ');
      return (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          className="cbg-hex"
          style={{ animationDelay: delay, transformOrigin: `${cx}px ${cy}px` }}
          opacity="0.15"
        />
      );
    })}

    {/* Data-stream tick marks along edges */}
    {Array.from({ length: 24 }, (_, i) => (
      <line
        key={`top-${i}`}
        x1={50 * i}
        y1="0"
        x2={50 * i}
        y2={i % 4 === 0 ? 14 : 7}
        stroke="#00ff88"
        strokeWidth="0.8"
        opacity="0.25"
      />
    ))}
    {Array.from({ length: 24 }, (_, i) => (
      <line
        key={`bot-${i}`}
        x1={50 * i}
        y1="900"
        x2={50 * i}
        y2={i % 4 === 0 ? 886 : 893}
        stroke="#00ff88"
        strokeWidth="0.8"
        opacity="0.25"
      />
    ))}
  </svg>
);

// ─── Particle config helpers ───────────────────────────────────────────────────
const RAIN_CONFIG = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  detectRetina: true,
  particles: {
    number: { value: 120, density: { enable: true, area: 1000 } },
    color: {
      value: ['#00ff88', '#00cc66', '#00ffaa', '#007744'],
    },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.1, max: 0.8 },
      animation: { enable: true, speed: 1.5, minimumValue: 0.05, sync: false },
    },
    size: {
      value: { min: 1, max: 2.5 },
    },
    move: {
      enable: true,
      direction: 'bottom' as const,
      speed: { min: 0.8, max: 3.5 },
      straight: true,
      outModes: { default: 'out' as const },
      random: true,
    },
    twinkle: {
      particles: { enable: true, frequency: 0.05, opacity: 1 },
    },
  },
  interactivity: {
    events: {
      onHover: { enable: false },
      onClick: { enable: false },
    },
  },
};

const WEB_CONFIG = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  detectRetina: true,
  particles: {
    number: { value: 55, density: { enable: true, area: 900 } },
    color: {
      value: ['#c084fc', '#a855f7', '#e8ff00', '#d4ff00', '#bf00ff'],
    },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.3, max: 0.85 },
      animation: { enable: true, speed: 0.8, minimumValue: 0.1, sync: false },
    },
    size: {
      value: { min: 1.5, max: 3.5 },
    },
    links: {
      enable: true,
      distance: 130,
      color: { value: ['#c084fc', '#e8ff00'] },
      opacity: 0.35,
      width: 0.8,
      triangles: { enable: false },
    },
    move: {
      enable: true,
      speed: { min: 0.3, max: 1.2 },
      direction: 'none' as const,
      random: true,
      straight: false,
      outModes: { default: 'bounce' as const },
    },
  },
  interactivity: {
    detectsOn: 'canvas' as const,
    events: {
      onHover: {
        enable: true,
        mode: 'grab',
      },
      onClick: { enable: false },
    },
    modes: {
      grab: { distance: 160, links: { opacity: 0.7 } },
    },
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────
export const CyberpunkMatrixBackground = () => {
  const [init, setInit] = useState(false);
  const rainRef = useRef<Container | null>(null);
  const webRef = useRef<Container | null>(null);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const onRainLoaded = useCallback(async (container?: Container) => {
    if (container) rainRef.current = container;
  }, []);

  const onWebLoaded = useCallback(async (container?: Container) => {
    if (container) webRef.current = container;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      rainRef.current?.destroy();
      webRef.current?.destroy();
    };
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="cbg-root" aria-hidden="true">

        {/* Layer 0: SVG geometric wireframe */}
        <WireframeLayer />

        {/* Horizontal scan line sweep */}
        <div className="cbg-scanline" />

        {/* Layer 1: Slow digital rain (emerald green, vertical) */}
        {init && (
          <div className="cbg-particles">
            <Particles
              id="rain-particles"
              particlesLoaded={onRainLoaded}
              options={RAIN_CONFIG}
              style={{ position: 'absolute', inset: 0 }}
            />
          </div>
        )}

        {/* Layer 2: Chaotic web connections (purple + lemon) */}
        {init && (
          <div className="cbg-particles">
            <Particles
              id="web-particles"
              particlesLoaded={onWebLoaded}
              options={WEB_CONFIG}
              style={{ position: 'absolute', inset: 0 }}
            />
          </div>
        )}

        {/* Radial vignette overlay */}
        <div className="cbg-vignette" />
      </div>
    </>
  );
};

export default CyberpunkMatrixBackground;
