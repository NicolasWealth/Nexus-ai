import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');
  .sc-font { font-family: 'Orbitron', monospace; }
  .sc-mono { font-family: 'Share Tech Mono', monospace; }

  @keyframes sc-card-hover {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-4px); }
  }

  .sc-chain-card {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: default;
  }
  .sc-chain-card:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: var(--chain-color) !important;
    box-shadow: 0 8px 32px var(--chain-glow);
  }
  .sc-chain-card:hover .sc-chain-icon {
    transform: scale(1.1) rotate(5deg);
  }
  .sc-chain-icon {
    transition: transform 0.3s ease;
  }

  @keyframes sc-stat-count {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sc-stat-animate {
    animation: sc-stat-count 0.5s ease-out forwards;
  }
`

const CHAINS = [
  {
    name: 'Hedera',
    symbol: 'HBAR',
    color: '#00b0ef',
    glow: 'rgba(0,176,239,0.2)',
    avgFee: '$0.001',
    tps: '10,000+',
    status: 'ACTIVE',
    description: 'Enterprise-grade hashgraph with sub-second finality',
    icon: (color: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill={`${color}22`} stroke={color} strokeWidth="1"/>
        <text x="16" y="21" textAnchor="middle" fill={color} fontSize="14" fontWeight="bold" fontFamily="monospace">ℏ</text>
      </svg>
    ),
  },
  {
    name: 'Polygon',
    symbol: 'MATIC',
    color: '#8247e5',
    glow: 'rgba(130,71,229,0.2)',
    avgFee: '$0.003',
    tps: '7,200',
    status: 'ACTIVE',
    description: 'Ethereum L2 with ZK-rollup security guarantees',
    icon: (color: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill={`${color}22`} stroke={color} strokeWidth="1"/>
        <polygon points="16,6 26,12 26,20 16,26 6,20 6,12" fill="none" stroke={color} strokeWidth="1.5"/>
        <polygon points="16,10 22,14 22,18 16,22 10,18 10,14" fill={color} opacity="0.4"/>
      </svg>
    ),
  },
  {
    name: 'Arbitrum',
    symbol: 'ARB',
    color: '#12aaff',
    glow: 'rgba(18,170,255,0.2)',
    avgFee: '$0.005',
    tps: '4,500',
    status: 'ACTIVE',
    description: 'Optimistic rollup with 7-day challenge window',
    icon: (color: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill={`${color}22`} stroke={color} strokeWidth="1"/>
        <path d="M16 6L26 22H6L16 6Z" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M12 18L16 10L20 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    color: '#9945ff',
    glow: 'rgba(153,69,255,0.2)',
    avgFee: '$0.0001',
    tps: '65,000',
    status: 'ACTIVE',
    description: 'High-throughput PoH consensus with parallel execution',
    icon: (color: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill={`${color}22`} stroke={color} strokeWidth="1"/>
        <path d="M8 10h12l4 3H12L8 10zm0 5h12l4 3H12L8 15zm0 5h12l4 3H12L8 20z" fill={color} opacity="0.8"/>
      </svg>
    ),
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    color: '#627eea',
    glow: 'rgba(98,126,234,0.2)',
    avgFee: '$2.40',
    tps: '30',
    status: 'L1',
    description: 'Base settlement layer for cross-chain bridges',
    icon: (color: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill={`${color}22`} stroke={color} strokeWidth="1"/>
        <path d="M16 6L10 16L16 19L22 16L16 6Z" fill={color} opacity="0.6"/>
        <path d="M10 17.5L16 21L22 17.5L16 26L10 17.5Z" fill={color} opacity="0.9"/>
      </svg>
    ),
  },
  {
    name: 'Optimism',
    symbol: 'OP',
    color: '#ff0420',
    glow: 'rgba(255,4,32,0.15)',
    avgFee: '$0.007',
    tps: '2,000',
    status: 'ACTIVE',
    description: 'EVM-equivalent L2 with superchain vision',
    icon: (color: string) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill={`${color}22`} stroke={color} strokeWidth="1"/>
        <circle cx="16" cy="16" r="7" fill="none" stroke={color} strokeWidth="1.5"/>
        <circle cx="16" cy="16" r="3" fill={color} opacity="0.7"/>
      </svg>
    ),
  },
]

const GLOBAL_STATS = [
  { label: 'Total Chains',    value: '6',       suffix: '' },
  { label: 'Avg Route Time',  value: '380',     suffix: 'ms' },
  { label: 'Daily Volume',    value: '$48M+',   suffix: '' },
  { label: 'Uptime',          value: '99.9',    suffix: '%' },
]

function ChainCard({ chain, index }: { chain: typeof CHAINS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="sc-chain-card rounded-xl border border-white/8 bg-black/50 backdrop-blur-sm p-4 relative overflow-hidden"
      style={{ '--chain-color': chain.color, '--chain-glow': chain.glow } as React.CSSProperties}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 30%, ${chain.glow}, transparent 70%)` }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="sc-chain-icon">
            {chain.icon(chain.color)}
          </div>
          <span
            className="sc-mono text-[8px] px-2 py-0.5 rounded-full border tracking-widest"
            style={{ color: chain.color, borderColor: `${chain.color}40`, background: `${chain.color}15` }}
          >
            {chain.status}
          </span>
        </div>

        <div className="mb-2">
          <div className="sc-font text-sm font-bold text-white mb-0.5">{chain.name}</div>
          <div className="sc-mono text-[9px] tracking-widest" style={{ color: chain.color }}>{chain.symbol}</div>
        </div>

        <p className="sc-mono text-[10px] text-white/35 leading-relaxed mb-3">{chain.description}</p>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
          <div>
            <div className="sc-mono text-[8px] text-white/25 mb-0.5">AVG FEE</div>
            <div className="sc-mono text-[11px] font-semibold" style={{ color: chain.color }}>{chain.avgFee}</div>
          </div>
          <div>
            <div className="sc-mono text-[8px] text-white/25 mb-0.5">MAX TPS</div>
            <div className="sc-mono text-[11px] font-semibold text-white/70">{chain.tps}</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function SupportedChains() {
  const titleRef = useRef<HTMLDivElement>(null)
  const titleInView = useInView(titleRef, { once: true })
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true })

  return (
    <>
      <style>{STYLES}</style>
      <div>
        {/* Section header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 20 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-purple-400/40" />
            <span className="sc-mono text-[10px] text-purple-400/60 tracking-[0.3em] uppercase">Networks</span>
          </div>
          <h2 className="sc-font text-3xl md:text-4xl font-black text-white mb-3">
            Supported Chains
          </h2>
          <p className="sc-mono text-[12px] text-white/40 max-w-lg leading-relaxed">
            Nexus AI routes across every major network, always finding the lowest-cost path regardless of source or destination chain.
          </p>
        </motion.div>

        {/* Global stats bar */}
        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 16 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 p-4 rounded-xl border border-white/8 bg-black/40 backdrop-blur-sm"
        >
          {GLOBAL_STATS.map(({ label, value, suffix }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0 }}
              animate={statsInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="text-center"
            >
              <div className="sc-mono text-[8px] text-white/30 mb-1 tracking-widest uppercase">{label}</div>
              <div className="sc-font text-xl font-bold text-emerald-400">
                {value}<span className="text-sm text-emerald-400/60">{suffix}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Chain grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHAINS.map((chain, i) => (
            <ChainCard key={chain.name} chain={chain} index={i} />
          ))}
        </div>
      </div>
    </>
  )
}
