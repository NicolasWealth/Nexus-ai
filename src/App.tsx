import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import './App.css'
import CyberpunkMatrixBackground from './components/CyberpunkMatrixBackground'
import TransactionHUD from './components/TransactionHUD'
import { PrivacyShieldProvider, PrivacyShield } from './components/PrivacyShield'
import { useLiquidityAgent } from './hooks/useLiquidityAgent'
import NexusCore3D from './components/NexusCore3D'
import HowItWorks from './components/HowItWorks'
import SupportedChains from './components/SupportedChains'
import MobileHUD from './components/MobileHUD'

const GLITCH_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');

  @keyframes glitch-skew {
    0%   { transform: skew(0deg); }
    20%  { transform: skew(-2deg, 0.5deg); }
    40%  { transform: skew(1.5deg, -0.5deg); }
    60%  { transform: skew(-1deg); }
    80%  { transform: skew(2deg, 1deg); }
    100% { transform: skew(0deg); }
  }
  @keyframes glitch-before {
    0%   { clip-path: inset(0 0 95% 0); transform: translate(-3px,0); opacity: 0.8; }
    25%  { clip-path: inset(25% 0 55% 0); transform: translate(3px,0); opacity: 0.9; }
    50%  { clip-path: inset(55% 0 20% 0); transform: translate(-2px,1px); opacity: 0.7; }
    75%  { clip-path: inset(80% 0 5% 0); transform: translate(2px,-1px); opacity: 0.8; }
    100% { clip-path: inset(0 0 100% 0); transform: translate(0); opacity: 0; }
  }
  @keyframes glitch-after {
    0%   { clip-path: inset(90% 0 2% 0); transform: translate(3px,0); opacity: 0.7; }
    30%  { clip-path: inset(40% 0 45% 0); transform: translate(-3px,0); opacity: 0.9; }
    60%  { clip-path: inset(10% 0 75% 0); transform: translate(2px,-1px); opacity: 0.6; }
    100% { clip-path: inset(100% 0 0% 0); transform: translate(0); opacity: 0; }
  }
  @keyframes rgb-shift {
    0%   { text-shadow: -2px 0 #ff003c, 2px 0 #00ffff; }
    25%  { text-shadow: 2px 0 #ff003c, -2px 0 #00ffff; }
    50%  { text-shadow: -1px 0 #ff003c, 1px 2px #00ffff; }
    75%  { text-shadow: 1px 0 #ff003c, -1px -2px #00ffff; }
    100% { text-shadow: -2px 0 #ff003c, 2px 0 #00ffff; }
  }
  @keyframes scanline-sweep { 0%{top:0%;} 100%{top:100%;} }
  @keyframes stream-scroll  { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }
  @keyframes badge-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.5); }
    50%      { box-shadow: 0 0 0 6px rgba(52,211,153,0); }
  }
  @keyframes conn-blink { 0%,49%{opacity:1;} 50%,100%{opacity:0.3;} }
  @keyframes float-up { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);} }
  @keyframes border-flow {
    0%   { border-color: rgba(52,211,153,0.6); box-shadow: 0 0 20px rgba(52,211,153,0.2); }
    50%  { border-color: rgba(192,132,252,0.6); box-shadow: 0 0 20px rgba(192,132,252,0.2); }
    100% { border-color: rgba(52,211,153,0.6); box-shadow: 0 0 20px rgba(52,211,153,0.2); }
  }
  @keyframes cta-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .glitch-active { animation: glitch-skew 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards; position: relative; }
  .glitch-active::before,.glitch-active::after { content: attr(data-text); position: absolute; inset: 0; color: #34d399; font: inherit; letter-spacing: inherit; }
  .glitch-active::before { color: #ff003c; animation: glitch-before 0.4s steps(1) forwards; }
  .glitch-active::after  { color: #00ffff; animation: glitch-after 0.4s steps(1) forwards; }
  .glitch-text-active { animation: rgb-shift 0.4s steps(2) forwards; }
  .nexus-font  { font-family: 'Orbitron', monospace; }
  .mono-font   { font-family: 'Share Tech Mono', monospace; }
  .hero-scanline { position:absolute; left:0; right:0; height:2px; background:linear-gradient(to right,transparent,rgba(52,211,153,0.15),transparent); pointer-events:none; animation:scanline-sweep 4s linear infinite; z-index:10; }
  .stream-track { animation: stream-scroll 18s linear infinite; }
  .badge-pulse  { animation: badge-pulse 2s ease-out infinite; }
  .conn-active  { background: #34d399; animation: badge-pulse 1.5s ease-out infinite; }
  .conn-inactive { background: #6b7280; animation: conn-blink 1.5s step-end infinite; }
  .float-anim { animation: float-up 3s ease-in-out infinite; }
  .border-flow-anim { animation: border-flow 4s ease-in-out infinite; }

  .cta-primary {
    background: linear-gradient(90deg, #34d399, #a855f7, #34d399);
    background-size: 200% auto;
    animation: cta-shimmer 3s linear infinite;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .cta-primary:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 32px rgba(52,211,153,0.35);
  }
  .cta-primary:active { transform: translateY(0) scale(0.99); }

  .cta-secondary {
    transition: all 0.2s ease;
    border: 1px solid rgba(255,255,255,0.15);
  }
  .cta-secondary:hover {
    border-color: rgba(52,211,153,0.5);
    background: rgba(52,211,153,0.08);
    transform: translateY(-2px);
  }
  .cta-secondary:active { transform: translateY(0); }

  .tech-badge {
    transition: all 0.2s ease;
    cursor: default;
  }
  .tech-badge:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  .hash-copy {
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .hash-copy:hover { opacity: 0.7; }
  .hash-copy:active { transform: scale(0.97); }

  /* Mobile HUD visibility */
  @media (max-width: 900px) {
    .desktop-hud { display: none !important; }
  }
  @media (min-width: 901px) {
    .mobile-hud { display: none !important; }
  }
`

const STREAM_ITEMS = [
  'NEXUS-AI · AUTONOMOUS PATHFINDING',
  'CROSS-CHAIN LIQUIDITY · OPTIMIZED',
  'HEDERA · POLYGON · ARBITRUM · SOLANA',
  'SLIPPAGE MINIMIZED · FEES CRUSHED',
  'ZK VERIFIED · PRIVACY SHIELD ACTIVE',
  'AGENT v4.1 · ONLINE',
]

const AnimatedCount = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    let frame: number
    let start: number | null = null
    const from = display
    const to   = value
    const dur  = 400
    const step = (ts: number) => {
      if (!start) start = ts
      const prog = Math.min((ts - start) / dur, 1)
      setDisplay(Math.round(from + (to - from) * prog))
      if (prog < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return <>{display.toLocaleString()}</>
}

// Skeleton loader for stats
const StatSkeleton = () => (
  <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-lg border border-white/[0.08] bg-black/40">
    <div className="w-12 h-2 bg-white/10 rounded animate-pulse mb-1" />
    <div className="w-16 h-6 bg-white/10 rounded animate-pulse" />
  </div>
)

// Copy to clipboard helper
const useCopy = () => {
  const [copied, setCopied] = useState(false)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return { copied, copy }
}

// Scroll reveal wrapper
const RevealSection = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function App() {
  const { bestPath, transactions, glitchKey, connected } = useLiquidityAgent()
  const isGlitching = glitchKey > 0
  const { copied, copy } = useCopy()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Simulate initial load
    const t = setTimeout(() => setIsLoaded(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PrivacyShieldProvider>
      <style>{GLITCH_STYLES}</style>

      <CyberpunkMatrixBackground/>

      {/* Desktop HUD */}
      <div className="desktop-hud">
        <TransactionHUD bestPath={bestPath} transactions={transactions}/>
      </div>

      {/* Mobile HUD */}
      <div className="mobile-hud">
        <MobileHUD bestPath={bestPath} transactions={transactions} />
      </div>

      {/* 3D Core */}
      <div
        className="absolute left-1/2 top-[10vh] -translate-x-1/2"
        style={{ width: 'min(40vw, 420px)', height: 'min(40vw, 420px)', zIndex: 9, pointerEvents: 'none' }}
      >
        <NexusCore3D width="100%" height="100%" />
      </div>

      <div className="relative z-20 flex flex-col items-center min-h-screen">

        {/* ── HERO SECTION ── */}
        <section className="relative flex flex-col items-center justify-center min-h-screen w-full px-6 overflow-hidden">
          <div className="hero-scanline"/>

          {/* Connection badge */}
          <motion.div
            className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <span className={`w-2 h-2 rounded-full ${connected ? 'conn-active' : 'conn-inactive'}`}/>
            <span className="mono-font text-[10px] tracking-[0.2em] text-white/50">
              FIREBASE {connected ? 'CONNECTED · LIVE STREAM' : 'CONNECTING…'}
            </span>
          </motion.div>

          {/* Spacer for 3D globe */}
          <div style={{ height: 'min(32vw, 340px)' }} />

          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div key={`title-${glitchKey}`} className="text-center mb-4"
              initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0.6 }} transition={{ duration: 0.15 }}
            >
              <h1
                className={`nexus-font text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-300 ${isGlitching ? 'glitch-active' : ''}`}
                data-text="NEXUS AI"
              >
                NEXUS AI
              </h1>
              <p className={`mono-font text-[11px] tracking-[0.35em] text-emerald-400/70 uppercase ${isGlitching ? 'glitch-text-active' : ''}`}>
                Autonomous Liquidity Optimization Engine
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Description */}
          <motion.div
            className="max-w-xl text-center mb-8"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p className="mono-font text-[12px] text-white/40 leading-relaxed">
              <span className="text-red-400/80">Fragmented liquidity</span> and{' '}
              <span className="text-red-400/80">high cross-border fees</span> cost billions per year.
              Nexus AI deploys an autonomous agent that runs real-time graph pathfinding across{' '}
              <span className="text-emerald-400">Hedera · Polygon · Arbitrum · Solana</span>{' '}
              to find the optimal route — minimizing slippage, gas, and latency on every swap.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 mb-8"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          >
            <button
              className="cta-primary nexus-font text-[11px] font-bold tracking-[0.2em] text-black px-8 py-3 rounded-lg uppercase"
              onClick={() => window.open('https://github.com', '_blank')}
            >
              View on GitHub
            </button>
            <button
              className="cta-secondary nexus-font text-[11px] font-bold tracking-[0.2em] text-white/70 px-8 py-3 rounded-lg uppercase bg-black/40 backdrop-blur-sm"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How It Works ↓
            </button>
          </motion.div>

          {/* Privacy Shield */}
          <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
            <PrivacyShield/>
          </motion.div>

          {/* Live stats */}
          <motion.div
            className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          >
            {!isLoaded ? (
              <>
                <StatSkeleton /><StatSkeleton /><StatSkeleton />
              </>
            ) : (
              <>
                {[
                  { label: 'ROUTES FOUND', value: <AnimatedCount value={transactions.length}/>, color: 'text-emerald-400' },
                  { label: 'AVG SAVINGS',  value: bestPath ? `${bestPath.savings}%` : '—',              color: 'text-purple-400' },
                  { label: 'AVG FEE',      value: bestPath ? `$${bestPath.totalFee.toFixed(3)}` : '—',  color: 'text-yellow-300' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1 px-3 py-3 rounded-lg border border-white/[0.08] bg-black/40 backdrop-blur-sm">
                    <span className="mono-font text-[8px] text-white/30 tracking-widest">{label}</span>
                    <span className={`nexus-font text-lg font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </>
            )}
          </motion.div>

          {/* Best path card */}
          <AnimatePresence mode="wait">
            {bestPath ? (
              <motion.div
                key={`path-${bestPath.id}`}
                className="w-full max-w-lg mb-10"
                initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="rounded-xl border border-emerald-400/20 bg-black/60 backdrop-blur-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="mono-font text-[9px] tracking-[0.2em] text-emerald-400/60">OPTIMAL PATH FOUND</span>
                    <span className="badge-pulse inline-block w-2 h-2 rounded-full bg-emerald-400"/>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap mb-3">
                    {bestPath.route.map((hop, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="mono-font text-[9px] px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20 text-emerald-300">{hop.chain}</span>
                        {i < bestPath.route.length - 1 && <span className="text-emerald-400/40 text-[10px]">→</span>}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label:'TYPE',    val: bestPath.type.toUpperCase(),        c:'text-purple-300'  },
                      { label:'STATUS',  val: bestPath.status.toUpperCase(),      c:'text-emerald-300' },
                      { label:'FEE',     val: `$${bestPath.totalFee.toFixed(3)}`, c:'text-yellow-300'  },
                      { label:'SAVINGS', val: `${bestPath.savings}%`,             c:'text-emerald-400' },
                    ].map(({ label, val, c }) => (
                      <div key={label} className="text-center">
                        <div className="mono-font text-[7px] text-white/25 mb-0.5 tracking-widest">{label}</div>
                        <div className={`mono-font text-[10px] font-semibold ${c}`}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-2">
                    <span className="mono-font text-[8px] text-white/20">TX: </span>
                    <span
                      className="hash-copy mono-font text-[8px] text-emerald-400/50 flex-1 truncate"
                      onClick={() => copy(bestPath.hash)}
                      title="Click to copy"
                    >
                      {bestPath.hash}
                    </span>
                    <AnimatePresence>
                      {copied && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className="mono-font text-[8px] text-emerald-400"
                        >
                          Copied!
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Loading skeleton for best path card
              <motion.div
                className="w-full max-w-lg mb-10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              >
                <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-32 h-2 bg-white/10 rounded animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-white/10 animate-pulse" />
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[1,2,3].map(i => <div key={i} className="w-16 h-5 bg-white/10 rounded animate-pulse" />)}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1,2,3,4].map(i => <div key={i} className="h-8 bg-white/10 rounded animate-pulse" />)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tech stack badges */}
          <motion.div
            className="flex flex-wrap gap-2 justify-center mb-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          >
            {[
              { label: 'React 18',      color: 'text-cyan-400   border-cyan-400/20   bg-cyan-400/5',   href: 'https://react.dev' },
              { label: 'TypeScript',    color: 'text-blue-400   border-blue-400/20   bg-blue-400/5',   href: 'https://www.typescriptlang.org' },
              { label: 'Firebase RTDB', color: 'text-orange-400 border-orange-400/20 bg-orange-400/5', href: 'https://firebase.google.com' },
              { label: 'Framer Motion', color: 'text-pink-400   border-pink-400/20   bg-pink-400/5',   href: 'https://www.framer.com/motion' },
              { label: 'Tailwind CSS',  color: 'text-teal-400   border-teal-400/20   bg-teal-400/5',   href: 'https://tailwindcss.com' },
              { label: 'tsParticles',   color: 'text-purple-400 border-purple-400/20 bg-purple-400/5', href: 'https://particles.js.org' },
            ].map(({ label, color, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`tech-badge mono-font text-[9px] px-3 py-1 rounded-full border tracking-widest ${color}`}
              >
                {label}
              </a>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="flex flex-col items-center gap-2 mt-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          >
            <span className="mono-font text-[9px] text-white/20 tracking-widest">SCROLL TO EXPLORE</span>
            <motion.div
              className="w-px h-8 bg-gradient-to-b from-emerald-400/40 to-transparent"
              animate={{ scaleY: [1, 0.5, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </section>

        {/* ── HOW IT WORKS SECTION ── */}
        <section id="how-it-works" className="w-full px-6 py-20 max-w-4xl mx-auto">
          <RevealSection>
            <HowItWorks />
          </RevealSection>
        </section>

        {/* ── SUPPORTED CHAINS SECTION ── */}
        <section className="w-full px-6 py-16 max-w-4xl mx-auto">
          <RevealSection delay={0.1}>
            <SupportedChains />
          </RevealSection>
        </section>

        {/* ── FINAL CTA SECTION ── */}
        <RevealSection className="w-full">
          <section className="w-full px-6 py-20 flex flex-col items-center text-center">
            <div className="max-w-xl">
              <motion.h2
                className="nexus-font text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-purple-400 mb-4"
              >
                Ready to Optimize?
              </motion.h2>
              <p className="mono-font text-[12px] text-white/40 mb-8 leading-relaxed">
                Join thousands of traders using Nexus AI to find the best routes across every major chain — automatically, 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  className="cta-primary nexus-font text-[11px] font-bold tracking-[0.2em] text-black px-10 py-3.5 rounded-lg uppercase"
                  onClick={() => window.open('https://github.com', '_blank')}
                >
                  Launch App
                </button>
                <button
                  className="cta-secondary nexus-font text-[11px] font-bold tracking-[0.2em] text-white/70 px-10 py-3.5 rounded-lg uppercase bg-black/40 backdrop-blur-sm"
                  onClick={() => window.open('https://github.com', '_blank')}
                >
                  Read Docs
                </button>
              </div>
            </div>
          </section>
        </RevealSection>

        {/* Data stream ticker */}
        <div className="w-full border-y border-emerald-400/10 bg-black/50 backdrop-blur-sm py-2 overflow-hidden">
          <div className="stream-track flex gap-16 whitespace-nowrap">
            {[...STREAM_ITEMS, ...STREAM_ITEMS].map((item, i) => (
              <span key={i} className="mono-font text-[9px] text-emerald-400/40 tracking-[0.2em] uppercase">◈ {item}</span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full py-8 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="nexus-font text-sm text-emerald-400 font-bold">NEXUS AI</span>
              <span className="mono-font text-[9px] text-white/20 tracking-widest">v4.1.0</span>
            </div>
            <div className="flex gap-6">
              {[
                { label: 'GitHub',       href: 'https://github.com' },
                { label: 'Docs',         href: '#' },
                { label: 'Twitter',      href: '#' },
                { label: 'Discord',      href: '#' },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono-font text-[10px] text-white/30 hover:text-emerald-400 transition-colors tracking-widest uppercase"
                >
                  {label}
                </a>
              ))}
            </div>
            <span className="mono-font text-[9px] text-white/20 tracking-widest">
              © 2025 NEXUS AI
            </span>
          </div>
        </footer>
      </div>
    </PrivacyShieldProvider>
  )
}

export default App
