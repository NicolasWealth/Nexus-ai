import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'
import CyberpunkMatrixBackground from './components/CyberpunkMatrixBackground'
import TransactionHUD from './components/TransactionHUD'
import { PrivacyShieldProvider, PrivacyShield } from './components/PrivacyShield'
import { useLiquidityAgent } from './hooks/useLiquidityAgent'

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

function App() {
  const { bestPath, transactions, glitchKey, connected } = useLiquidityAgent()
  const isGlitching = glitchKey > 0

  return (
    <PrivacyShieldProvider>
      <style>{GLITCH_STYLES}</style>

      <CyberpunkMatrixBackground/>
      <TransactionHUD bestPath={bestPath} transactions={transactions}/>

      <div className="relative z-20 flex flex-col items-center min-h-screen">
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

          {/* Logo orb */}
          <motion.div
            className="relative mb-10"
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/20 to-purple-600/20 blur-2xl scale-150"/>
            <div className="relative w-28 h-28 rounded-full border border-emerald-400/20 bg-black/60 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4"/>
                <path d="M12 30 L18 18 L26 27 L32 18" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="24" cy="24" r="3" fill="#c084fc"/>
              </svg>
            </div>
          </motion.div>

          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div key={`title-${glitchKey}`} className="text-center mb-4"
              initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0.6 }} transition={{ duration: 0.15 }}
            >
              <h1
                className={`nexus-font text-5xl md:text-6xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-300 ${isGlitching ? 'glitch-active' : ''}`}
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
            className="max-w-xl text-center mb-10"
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

          {/* Privacy Shield */}
          <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <PrivacyShield/>
          </motion.div>

          {/* Live stats */}
          <motion.div
            className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          >
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
          </motion.div>

          {/* Best path card */}
          <AnimatePresence mode="wait">
            {bestPath && (
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
                  <div className="mt-3 pt-2 border-t border-white/5">
                    <span className="mono-font text-[8px] text-white/20">TX: </span>
                    <span className="mono-font text-[8px] text-emerald-400/50">{bestPath.hash}</span>
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
              { label: 'React 18',      color: 'text-cyan-400   border-cyan-400/20   bg-cyan-400/5'   },
              { label: 'TypeScript',    color: 'text-blue-400   border-blue-400/20   bg-blue-400/5'   },
              { label: 'Firebase RTDB', color: 'text-orange-400 border-orange-400/20 bg-orange-400/5' },
              { label: 'Framer Motion', color: 'text-pink-400   border-pink-400/20   bg-pink-400/5'   },
              { label: 'Tailwind CSS',  color: 'text-teal-400   border-teal-400/20   bg-teal-400/5'   },
              { label: 'tsParticles',   color: 'text-purple-400 border-purple-400/20 bg-purple-400/5' },
            ].map(({ label, color }) => (
              <span key={label} className={`mono-font text-[9px] px-3 py-1 rounded-full border tracking-widest ${color}`}>{label}</span>
            ))}
          </motion.div>
        </section>

        {/* Data stream ticker */}
        <div className="w-full border-y border-emerald-400/10 bg-black/50 backdrop-blur-sm py-2 overflow-hidden">
          <div className="stream-track flex gap-16 whitespace-nowrap">
            {[...STREAM_ITEMS, ...STREAM_ITEMS].map((item, i) => (
              <span key={i} className="mono-font text-[9px] text-emerald-400/40 tracking-[0.2em] uppercase">◈ {item}</span>
            ))}
          </div>
        </div>

        <footer className="w-full py-6 flex items-center justify-center border-t border-white/5">
          <span className="mono-font text-[9px] text-white/20 tracking-widest">
            NEXUS AI · AUTONOMOUS CROSS-CHAIN OPTIMIZER · © 2025
          </span>
        </footer>
      </div>
    </PrivacyShieldProvider>
  )
}

export default App
