import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Zap, GitBranch, Cpu, Shield, TriangleAlert,
  ArrowUpRight, ArrowDownLeft, Lock, Hexagon, Waves,
  BarChart3, Radio, CircleDot,
} from 'lucide-react'
import { PrivateText } from './PrivacyShield'
import type { BestPath } from '../hooks/useLiquidityAgent'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransactionHUDProps {
  bestPath: BestPath | null
  transactions: BestPath[]
}

interface FlowNode {
  id: number
  value: number
  label: string
  trend: 'up' | 'down' | 'stable'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand    = (min: number, max: number) => Math.random() * (max - min) + min
const randInt = (min: number, max: number) => Math.floor(rand(min, max))

const statusColor: Record<BestPath['status'], string> = {
  confirmed: 'text-emerald-400',
  pending:   'text-yellow-300',
  failed:    'text-red-400',
}
const statusDot: Record<BestPath['status'], string> = {
  confirmed: 'bg-emerald-400',
  pending:   'bg-yellow-300',
  failed:    'bg-red-400',
}
const typeIcon: Record<BestPath['type'], React.ReactNode> = {
  swap:     <ArrowUpRight size={11} />,
  transfer: <ArrowDownLeft size={11} />,
  stake:    <Lock size={11} />,
  bridge:   <GitBranch size={11} />,
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const HUD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;800&display=swap');

  .hud-root * { box-sizing: border-box; }
  .hud-font-display { font-family: 'Orbitron', monospace; }
  .hud-font-mono    { font-family: 'Share Tech Mono', monospace; }

  @keyframes glow-emerald {
    0%,100% { box-shadow: 0 0 6px 1px rgba(52,211,153,0.25); border-color: rgba(52,211,153,0.35); }
    50%      { box-shadow: 0 0 18px 4px rgba(52,211,153,0.55); border-color: rgba(52,211,153,0.8); }
  }
  @keyframes glow-purple {
    0%,100% { box-shadow: 0 0 6px 1px rgba(192,132,252,0.25); border-color: rgba(192,132,252,0.35); }
    50%      { box-shadow: 0 0 18px 4px rgba(192,132,252,0.55); border-color: rgba(192,132,252,0.8); }
  }
  @keyframes glow-lemon {
    0%,100% { box-shadow: 0 0 6px 1px rgba(232,255,0,0.2); border-color: rgba(232,255,0,0.3); }
    50%      { box-shadow: 0 0 18px 4px rgba(232,255,0,0.5); border-color: rgba(232,255,0,0.75); }
  }
  @keyframes glow-cyan {
    0%,100% { box-shadow: 0 0 6px 1px rgba(34,211,238,0.2); border-color: rgba(34,211,238,0.3); }
    50%      { box-shadow: 0 0 18px 4px rgba(34,211,238,0.5); border-color: rgba(34,211,238,0.75); }
  }
  .animate-glow-emerald { animation: glow-emerald 2.8s ease-in-out infinite; }
  .animate-glow-purple  { animation: glow-purple  3.2s ease-in-out infinite; }
  .animate-glow-lemon   { animation: glow-lemon   2.5s ease-in-out infinite; }
  .animate-glow-cyan    { animation: glow-cyan    3.6s ease-in-out infinite; }

  @keyframes ticker-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .ticker-track { animation: ticker-scroll 22s linear infinite; }

  @keyframes blink-cursor { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
  .blink { animation: blink-cursor 1s step-end infinite; }

  @keyframes float-icon {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    50%      { transform: translateY(-8px) rotate(6deg); }
  }
  .float-a { animation: float-icon 4.0s ease-in-out infinite; }
  .float-b { animation: float-icon 5.5s ease-in-out infinite 0.8s; }
  .float-c { animation: float-icon 3.8s ease-in-out infinite 1.6s; }
  .float-d { animation: float-icon 6.2s ease-in-out infinite 0.4s; }

  @keyframes spin-slow { to { transform: rotate(360deg); } }
  .spin-slow { animation: spin-slow 12s linear infinite; }

  @keyframes pulse-ring {
    0%   { transform: scale(0.8); opacity: 0.8; }
    70%  { transform: scale(1.8); opacity: 0; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  .pulse-ring { animation: pulse-ring 2s ease-out infinite; }

  .glass-card {
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(18px) saturate(180%);
    -webkit-backdrop-filter: blur(18px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
  }
  .scanlines::after {
    content: '';
    position: absolute; inset: 0;
    background: repeating-linear-gradient(to bottom, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px);
    pointer-events: none; border-radius: inherit; z-index: 0;
  }
`

// ─── SVG Wireframes ────────────────────────────────────────────────────────────

const WireframeCircuit = ({ color }: { color: string }) => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" viewBox="0 0 300 180" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id={`circuit-${color}`} width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M20 0 L20 15 M20 25 L20 40 M0 20 L15 20 M25 20 L40 20" stroke={color} strokeWidth="0.6" fill="none"/>
        <circle cx="20" cy="20" r="3" fill="none" stroke={color} strokeWidth="0.6"/>
      </pattern>
    </defs>
    <rect width="300" height="180" fill={`url(#circuit-${color})`}/>
    <path d="M10 90 Q75 30 150 90 Q225 150 290 90" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4"/>
  </svg>
)

const WireframeHex = ({ color }: { color: string }) => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
    {([[60,50],[180,50],[300,50],[120,130],[240,130]] as [number,number][]).map(([cx,cy],i) => {
      const r = 35
      const pts = Array.from({ length: 6 }, (_,k) => {
        const a = (Math.PI / 3) * k - Math.PI / 6
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
      }).join(' ')
      return <polygon key={i} points={pts} fill="none" stroke={color} strokeWidth="0.7" opacity="0.6"/>
    })}
  </svg>
)

const WireframeRadar = ({ color }: { color: string }) => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
    {[20,40,60,80].map(r => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="0.6"/>)}
    {[0,45,90,135].map(deg => <line key={deg} x1="100" y1="100" x2={100+80*Math.cos((deg*Math.PI)/180)} y2={100+80*Math.sin((deg*Math.PI)/180)} stroke={color} strokeWidth="0.5"/>)}
  </svg>
)

const WireframeFlow = ({ color }: { color: string }) => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice">
    {[0,1,2,3,4].map(i => (
      <path key={i} d={`M0 ${20+i*20} C75 ${20+i*20+(i%2===0?-15:15)}, 225 ${20+i*20+(i%2===0?15:-15)}, 300 ${20+i*20}`} fill="none" stroke={color} strokeWidth={0.5+i*0.1} opacity={0.3+i*0.08}/>
    ))}
  </svg>
)

// ─── Sub-components ────────────────────────────────────────────────────────────

const CardLabel = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <div className={`hud-font-display text-[9px] font-semibold tracking-[0.25em] uppercase ${color} flex items-center gap-1.5 mb-2`}>
    <span className={`inline-block w-1 h-1 rounded-full ${color.replace('text-','bg-')} pulse-ring`}/>
    {children}
  </div>
)

const useLiveValue = (base: number, variance: number, interval = 800) => {
  const [value, setValue] = useState(base)
  useEffect(() => {
    const id = setInterval(() => setValue(base + rand(-variance, variance)), interval)
    return () => clearInterval(id)
  }, [base, variance, interval])
  return value
}

// ─── Card: Liquidity Flow ─────────────────────────────────────────────────────

const LiquidityFlowCard = ({ bestPath }: { bestPath: BestPath | null }) => {
  const tvl     = useLiveValue(48_312_440, 120_000, 1200)
  const vol24   = useLiveValue(3_821_900, 50_000, 900)
  const savings = bestPath?.savings || 12.47

  const nodes: FlowNode[] = [
    { id: 0, value: useLiveValue(72, 8, 700),  label: 'ETH/USDC', trend: 'up' },
    { id: 1, value: useLiveValue(45, 6, 850),  label: 'WBTC/ETH', trend: 'down' },
    { id: 2, value: useLiveValue(31, 4, 1100), label: 'ARB/USDC', trend: 'up' },
    { id: 3, value: useLiveValue(19, 3, 950),  label: 'OP/ETH',   trend: 'stable' },
  ]

  return (
    <motion.div
      className="glass-card animate-glow-emerald relative overflow-hidden scanlines"
      style={{ color: '#34d399' }}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <WireframeFlow color="#34d399"/>
      <div className="relative z-10 p-4">
        <CardLabel color="text-emerald-400"><Waves size={10}/> Liquidity Flow</CardLabel>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'TVL',        value: `$${(tvl/1e6).toFixed(2)}M` },
            { label: '24h VOL',    value: `$${(vol24/1e6).toFixed(2)}M` },
            { label: 'AI SAVINGS', value: `${savings}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-emerald-400/5 rounded-md p-2 border border-emerald-400/10">
              <div className="hud-font-mono text-[9px] text-emerald-400/60 mb-0.5">{label}</div>
              <motion.div key={value} className="hud-font-display text-[13px] font-semibold text-emerald-300"
                initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              >{value}</motion.div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {nodes.map(node => (
            <div key={node.id} className="flex items-center gap-2">
              <div className="hud-font-mono text-[9px] text-emerald-400/70 w-[68px] shrink-0">{node.label}</div>
              <div className="flex-1 h-1 bg-emerald-400/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full"
                  animate={{ width: `${node.value}%` }} transition={{ duration: 0.6 }}
                />
              </div>
              <div className={`hud-font-mono text-[9px] w-6 text-right ${node.trend==='up'?'text-emerald-400':node.trend==='down'?'text-red-400':'text-yellow-300'}`}>
                {node.trend==='up'?'↑':node.trend==='down'?'↓':'→'}
              </div>
              <div className="hud-font-mono text-[9px] text-emerald-300 w-7 text-right">{node.value.toFixed(0)}%</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-emerald-400/10">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
          <span className="hud-font-mono text-[9px] text-emerald-400/60">STREAMING · {new Date().toLocaleTimeString()}</span>
          <span className="hud-font-mono text-[9px] text-emerald-300 ml-auto">HEALTHY</span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Card: Transaction Feed ───────────────────────────────────────────────────

const glitchVariants = {
  hidden:  { opacity: 0, x: -6, filter: 'blur(4px)', clipPath: 'inset(0 0 100% 0)' },
  visible: { opacity: 1, x: 0,  filter: 'blur(0px)', clipPath: 'inset(0 0 0% 0)',   transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit:    { opacity: 0, x: 6,  filter: 'blur(3px)', transition: { duration: 0.15 } },
}

const TransactionFeedCard = ({ transactions }: { transactions: BestPath[] }) => (
  <motion.div
    className="glass-card animate-glow-purple relative overflow-hidden scanlines"
    style={{ color: '#c084fc' }}
    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
  >
    <WireframeCircuit color="#c084fc"/>
    <div className="relative z-10 p-4">
      <CardLabel color="text-purple-400"><Activity size={10}/> Live Transactions</CardLabel>
      <div className="space-y-1 min-h-[210px]">
        <AnimatePresence initial={false}>
          {transactions.map(tx => (
            <motion.div key={tx.id} variants={glitchVariants} initial="hidden" animate="visible" exit="exit"
              className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-purple-400/5 border border-purple-400/10 hover:bg-purple-400/10 transition-colors"
            >
              <div className="w-5 h-5 rounded bg-purple-400/15 flex items-center justify-center text-purple-300 shrink-0">
                {typeIcon[tx.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="hud-font-mono text-[9px] text-purple-300 truncate">
                    <PrivateText value={tx.hash} type="hash"/>
                  </span>
                  <span className={`text-[8px] hud-font-mono px-1 rounded ${statusColor[tx.status]}`}>
                    {tx.status.toUpperCase()}
                  </span>
                </div>
                <div className="hud-font-mono text-[8px] text-purple-400/50 truncate">
                  <PrivateText value={tx.from} type="address"/> → <PrivateText value={tx.to} type="address"/>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="hud-font-display text-[10px] text-purple-200">
                  <PrivateText value={tx.totalFee.toFixed(2)} type="amount"/>
                </div>
                <div className="hud-font-mono text-[8px] text-purple-400/60">ETH</div>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[tx.status]}`}/>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-2 flex items-center gap-2 pt-2 border-t border-purple-400/10">
        <Radio size={9} className="text-purple-400 animate-pulse"/>
        <span className="hud-font-mono text-[9px] text-purple-400/60">MEMPOOL FEED<span className="blink">_</span></span>
        <span className="hud-font-mono text-[9px] text-purple-300 ml-auto">{transactions.length} RECENT</span>
      </div>
    </div>
  </motion.div>
)

// ─── Card: Network Pulse ──────────────────────────────────────────────────────

const NetworkPulseCard = () => {
  const tps      = useLiveValue(2847, 200, 600)
  const gasPrice = useLiveValue(18.4, 2.5, 700)
  const blockNum = useRef(19_482_301)
  const [block, setBlock] = useState(19_482_301)

  useEffect(() => {
    const id = setInterval(() => { blockNum.current += 1; setBlock(blockNum.current) }, 12_000)
    return () => clearInterval(id)
  }, [])

  const bars = Array.from({ length: 28 }, () => rand(20, 100))

  return (
    <motion.div
      className="glass-card animate-glow-lemon relative overflow-hidden scanlines"
      style={{ color: '#e8ff00' }}
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
    >
      <WireframeRadar color="#e8ff00"/>
      <div className="relative z-10 p-4">
        <CardLabel color="text-yellow-300"><Cpu size={10}/> Network Pulse</CardLabel>
        <div className="flex items-end gap-[2px] h-12 mb-3">
          {bars.map((h, i) => (
            <motion.div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-yellow-300/80 to-yellow-200/30"
              style={{ height: `${h}%` }} initial={{ height: '10%' }} animate={{ height: `${h}%` }}
              transition={{ duration: 0.4, delay: i * 0.01 }}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'TPS',   value: tps.toFixed(0) },
            { label: 'GWEI',  value: gasPrice.toFixed(1) },
            { label: 'BLOCK', value: `#${block.toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="hud-font-mono text-[8px] text-yellow-300/50 mb-0.5">{label}</div>
              <motion.div key={value} className="hud-font-display text-[11px] text-yellow-200"
                initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
              >{value}</motion.div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-yellow-300/10">
          <div className="flex justify-between mb-1">
            <span className="hud-font-mono text-[8px] text-yellow-300/50">THROUGHPUT</span>
            <span className="hud-font-mono text-[8px] text-yellow-200">{(tps/4000*100).toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-yellow-300/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full"
              animate={{ width: `${(tps/4000)*100}%` }} transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Card: Security Oracle ────────────────────────────────────────────────────

const SecurityOracleCard = () => {
  const threatLevel = useLiveValue(14, 8, 2000)
  const [alerts, setAlerts] = useState([
    { id: 1, msg: 'Flashloan detected · Pool #0x4f2a', sev: 'warn' },
    { id: 2, msg: 'Anomalous slippage · ARB/USDC', sev: 'info' },
    { id: 3, msg: 'Oracle deviation +2.3%', sev: 'warn' },
  ])

  useEffect(() => {
    const msgs = [
      ['Contract call spike · 0x8c3f', 'warn'],
      ['MEV sandwich attempt', 'crit'],
      ['Price impact >5%', 'warn'],
      ['Normal activity resumed', 'info'],
      ['Reentrancy guard triggered', 'crit'],
    ]
    const id = setInterval(() => {
      const [msg, sev] = msgs[randInt(0, msgs.length)]
      setAlerts(prev => [{ id: Date.now(), msg, sev }, ...prev.slice(0, 3)])
    }, 3500)
    return () => clearInterval(id)
  }, [])

  const sevColor: Record<string, string> = {
    info: 'text-cyan-400 border-cyan-400/30',
    warn: 'text-yellow-300 border-yellow-300/30',
    crit: 'text-red-400 border-red-400/30',
  }

  return (
    <motion.div
      className="glass-card animate-glow-cyan relative overflow-hidden scanlines"
      style={{ color: '#22d3ee' }}
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
    >
      <WireframeHex color="#22d3ee"/>
      <div className="relative z-10 p-4">
        <CardLabel color="text-cyan-400"><Shield size={10}/> Security Oracle</CardLabel>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 44 44" className="spin-slow w-full h-full">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 4" opacity="0.3"/>
              <circle cx="22" cy="22" r="12" fill="none" stroke="#22d3ee" strokeWidth="0.6" opacity="0.2"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="hud-font-display text-[12px] text-cyan-300">{threatLevel.toFixed(0)}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="hud-font-mono text-[9px] text-cyan-400/60 mb-1">THREAT INDEX</div>
            <div className="h-1.5 bg-cyan-400/10 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ background: threatLevel>50?'#f87171':threatLevel>25?'#fde047':'#22d3ee' }}
                animate={{ width: `${Math.min(threatLevel,100)}%` }} transition={{ duration: 0.5 }}
              />
            </div>
            <div className="hud-font-mono text-[8px] text-cyan-400/50 mt-0.5">
              {threatLevel<25?'LOW RISK':threatLevel<50?'ELEVATED':'HIGH RISK'}
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <AnimatePresence>
            {alerts.map(a => (
              <motion.div key={a.id}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-2 px-2 py-1 rounded border hud-font-mono text-[9px] ${sevColor[a.sev]}`}
              >
                <TriangleAlert size={8} className="shrink-0"/>
                <span className="truncate">{a.msg}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Ticker Banner ────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  'ETH $3,821.44 ↑2.1%','BTC $67,340.00 ↑0.8%','ARB $1.24 ↓1.3%',
  'OP $2.87 ↑3.4%','MATIC $0.72 ↓0.5%','USDC $1.00 →0.0%',
  'WBTC $67,212.00 ↑0.7%','LINK $14.22 ↑1.9%',
]

const TickerBanner = () => (
  <motion.div className="glass-card overflow-hidden border border-white/5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
    <div className="flex overflow-hidden py-1.5 px-2">
      <div className="ticker-track flex gap-8 whitespace-nowrap">
        {[...TICKER_ITEMS,...TICKER_ITEMS].map((item, i) => (
          <span key={i} className={`hud-font-mono text-[9px] ${item.includes('↑')?'text-emerald-400':item.includes('↓')?'text-red-400':'text-gray-400'}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
)

// ─── Floating Icons ───────────────────────────────────────────────────────────

const FloatingIcons = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
    {[
      { Icon: Hexagon,   x: '5%',  y: '8%',  cls: 'float-a', color: '#34d399', size: 22, opacity: 0.15 },
      { Icon: CircleDot, x: '92%', y: '12%', cls: 'float-b', color: '#c084fc', size: 18, opacity: 0.18 },
      { Icon: Zap,       x: '88%', y: '55%', cls: 'float-c', color: '#e8ff00', size: 20, opacity: 0.15 },
      { Icon: GitBranch, x: '3%',  y: '60%', cls: 'float-d', color: '#22d3ee', size: 16, opacity: 0.18 },
      { Icon: BarChart3, x: '47%', y: '3%',  cls: 'float-a', color: '#c084fc', size: 14, opacity: 0.12 },
      { Icon: Hexagon,   x: '50%', y: '94%', cls: 'float-b', color: '#34d399', size: 16, opacity: 0.12 },
    ].map(({ Icon, x, y, cls, color, size, opacity }, i) => (
      <div key={i} className={cls} style={{ position: 'absolute', left: x, top: y, opacity }}>
        <Icon size={size} color={color}/>
      </div>
    ))}
  </div>
)

// ─── System Bar ───────────────────────────────────────────────────────────────

const SystemBar = () => {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      className="flex items-center justify-between px-4 py-2 glass-card border border-white/5"
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
        <span className="hud-font-display text-[11px] text-white/70 tracking-widest">NEXUS · FINANCIAL HUD</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hud-font-mono text-[9px] text-white/40">CHAIN: ETHEREUM</span>
        <span className="hud-font-mono text-[9px] text-white/40">NET: MAINNET</span>
        <span className="hud-font-mono text-[10px] text-emerald-400">
          {time.toLocaleTimeString()}<span className="blink">|</span>
        </span>
      </div>
    </motion.div>
  )
}

// ─── Float Drift Animation ────────────────────────────────────────────────────

const floatLeft = {
  animate: {
    y: [0, -14, 0, 10, 0],
    transition: {
      duration: 9,
      ease: 'easeInOut' as const,
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  },
}

const floatRight = {
  animate: {
    y: [0, 12, 0, -10, 0],
    transition: {
      duration: 11,
      ease: 'easeInOut' as const,
      repeat: Infinity,
      repeatType: 'loop' as const,
      delay: 1.5,
    },
  },
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const TransactionHUD = ({ bestPath, transactions }: TransactionHUDProps) => (
  <>
    <style>{HUD_STYLES}</style>
    <div className="hud-root fixed inset-0 pointer-events-none" style={{ zIndex: 10 }} aria-label="Transaction monitoring HUD">
      <FloatingIcons/>
      <div className="pointer-events-auto h-full flex flex-col gap-2 p-3">

        {/* Top bar — full width */}
        <SystemBar/>
        <TickerBanner/>

        {/* Main area: left panels | empty center | right panels */}
        <div className="flex-1 flex items-stretch gap-0 min-h-0">

          {/* ── Left column ── */}
          <motion.div
            className="flex flex-col gap-2 w-[300px] shrink-0"
            variants={floatLeft}
            animate="animate"
          >
            <LiquidityFlowCard bestPath={bestPath}/>
            <TransactionFeedCard transactions={transactions}/>
          </motion.div>

          {/* ── Empty center — 3D core shows through ── */}
          <div className="flex-1 pointer-events-none" />

          {/* ── Right column ── */}
          <motion.div
            className="flex flex-col gap-2 w-[280px] shrink-0"
            variants={floatRight}
            animate="animate"
          >
            <NetworkPulseCard/>
            <SecurityOracleCard/>
          </motion.div>
        </div>

        {/* Bottom status bar */}
        <motion.div
          className="flex items-center gap-4 px-4 py-2 glass-card border border-white/5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        >
          {[
            { label: 'PROTOCOL', val: 'UNISWAP V4',       color: 'text-purple-400' },
            { label: 'ORACLE',   val: 'CHAINLINK · LIVE', color: 'text-emerald-400' },
            { label: 'LATENCY',  val: '12ms',             color: 'text-yellow-300' },
            { label: 'NODES',    val: '2,847 ACTIVE',     color: 'text-cyan-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="hud-font-mono text-[8px] text-white/30">{label}:</span>
              <span className={`hud-font-mono text-[9px] ${color}`}>{val}</span>
            </div>
          ))}
          {bestPath && (
            <div className="flex items-center gap-1">
              <span className="hud-font-mono text-[8px] text-white/20">TX: </span>
              <span className="hud-font-mono text-[8px] text-emerald-400/50">
                <PrivateText value={bestPath.hash} type="hash"/>
              </span>
            </div>
          )}
          <div className="ml-auto hud-font-mono text-[8px] text-white/20">NEXUS HUD v2.4.1 · © 2025</div>
        </motion.div>

      </div>
    </div>
  </>
)

export default TransactionHUD
