import { useCallback, useEffect, useRef, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadFull } from 'tsparticles'
import type { Container } from '@tsparticles/engine'

const STYLES = `
  @keyframes pulse-grid {
    0%, 100% { opacity: 0.07; }
    50%       { opacity: 0.14; }
  }
  @keyframes scan-line {
    0%   { top: -4px; }
    100% { top: 100%; }
  }
  .cbg-root {
    position: fixed; inset: 0; z-index: 0; overflow: hidden; background: #000;
  }
  .cbg-grid {
    position: absolute; inset: -10%; width: 120%; height: 120%;
    animation: pulse-grid 6s ease-in-out infinite; pointer-events: none;
  }
  .cbg-scanline {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(to bottom, transparent, rgba(0,255,128,0.08), transparent);
    animation: scan-line 8s linear infinite; pointer-events: none; z-index: 1;
  }
  .cbg-particles { position: absolute; inset: 0; z-index: 2; }
  .cbg-vignette {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%);
    z-index: 3; pointer-events: none;
  }
`

const WireframeLayer = () => (
  <svg className="cbg-grid" viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
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
    <rect width="100%" height="100%" fill="url(#micro-grid)" mask="url(#grid-mask)" opacity="0.5" />
    <rect width="100%" height="100%" fill="url(#macro-grid)" mask="url(#grid-mask)" opacity="0.7" />
    {([[60,60,1,1],[1140,60,-1,1],[60,840,1,-1],[1140,840,-1,-1]] as [number,number,number,number][]).map(([x,y,sx,sy],i) => (
      <g key={i} transform={`translate(${x},${y}) scale(${sx},${sy})`} opacity="0.35">
        <line x1="0" y1="0" x2="60" y2="0" stroke="#00ff88" strokeWidth="1.5"/>
        <line x1="0" y1="0" x2="0" y2="60" stroke="#00ff88" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="3" fill="#00ff88"/>
      </g>
    ))}
    <g opacity="0.18">
      <line x1="590" y1="390" x2="610" y2="390" stroke="#00ff88" strokeWidth="1"/>
      <line x1="590" y1="510" x2="610" y2="510" stroke="#00ff88" strokeWidth="1"/>
      <circle cx="600" cy="450" r="50" fill="none" stroke="#00ff88" strokeWidth="0.8" strokeDasharray="8 4"/>
      <circle cx="600" cy="450" r="90" fill="none" stroke="#c084fc" strokeWidth="0.5" strokeDasharray="4 8"/>
    </g>
  </svg>
)

const RAIN_CONFIG = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  detectRetina: true,
  particles: {
    number: { value: 120, density: { enable: true, area: 1000 } },
    color: { value: ['#00ff88','#00cc66','#00ffaa','#007744'] },
    shape: { type: 'circle' },
    opacity: { value: { min: 0.1, max: 0.8 }, animation: { enable: true, speed: 1.5, minimumValue: 0.05, sync: false } },
    size: { value: { min: 1, max: 2.5 } },
    move: { enable: true, direction: 'bottom' as const, speed: { min: 0.8, max: 3.5 }, straight: true, outModes: { default: 'out' as const }, random: true },
    twinkle: { particles: { enable: true, frequency: 0.05, opacity: 1 } },
  },
  interactivity: { events: { onHover: { enable: false }, onClick: { enable: false } } },
}

const WEB_CONFIG = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  detectRetina: true,
  particles: {
    number: { value: 55, density: { enable: true, area: 900 } },
    color: { value: ['#c084fc','#a855f7','#e8ff00','#d4ff00','#bf00ff'] },
    shape: { type: 'circle' },
    opacity: { value: { min: 0.3, max: 0.85 }, animation: { enable: true, speed: 0.8, minimumValue: 0.1, sync: false } },
    size: { value: { min: 1.5, max: 3.5 } },
    links: { enable: true, distance: 130, color: { value: ['#c084fc','#e8ff00'] }, opacity: 0.35, width: 0.8 },
    move: { enable: true, speed: { min: 0.3, max: 1.2 }, direction: 'none' as const, random: true, straight: false, outModes: { default: 'bounce' as const } },
  },
  interactivity: {
    detectsOn: 'canvas' as const,
    events: { onHover: { enable: true, mode: 'grab' }, onClick: { enable: false } },
    modes: { grab: { distance: 160, links: { opacity: 0.7 } } },
  },
}

export const CyberpunkMatrixBackground = () => {
  const [init, setInit] = useState(false)
  const rainRef = useRef<Container | null>(null)
  const webRef  = useRef<Container | null>(null)

  useEffect(() => {
    initParticlesEngine(async (engine) => { await loadFull(engine) }).then(() => setInit(true))
  }, [])

  const onRainLoaded = useCallback(async (container?: Container) => { if (container) rainRef.current = container }, [])
  const onWebLoaded  = useCallback(async (container?: Container) => { if (container) webRef.current = container }, [])

  useEffect(() => () => { rainRef.current?.destroy(); webRef.current?.destroy() }, [])

  return (
    <>
      <style>{STYLES}</style>
      <div className="cbg-root" aria-hidden="true">
        <WireframeLayer />
        <div className="cbg-scanline" />
        {init && (
          <div className="cbg-particles">
            <Particles id="rain-particles" particlesLoaded={onRainLoaded} options={RAIN_CONFIG} style={{ position: 'absolute', inset: 0 }} />
          </div>
        )}
        {init && (
          <div className="cbg-particles">
            <Particles id="web-particles" particlesLoaded={onWebLoaded} options={WEB_CONFIG} style={{ position: 'absolute', inset: 0 }} />
          </div>
        )}
        <div className="cbg-vignette" />
      </div>
    </>
  )
}

export default CyberpunkMatrixBackground
