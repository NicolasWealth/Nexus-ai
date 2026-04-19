import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');
  .hiw-font { font-family: 'Orbitron', monospace; }
  .hiw-mono { font-family: 'Share Tech Mono', monospace; }

  @keyframes hiw-line-grow {
    from { height: 0; }
    to   { height: 100%; }
  }
  .hiw-connector { animation: hiw-line-grow 1s ease-out forwards; }

  @keyframes hiw-node-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.4); }
    50%      { box-shadow: 0 0 0 8px rgba(52,211,153,0); }
  }
  .hiw-node-pulse { animation: hiw-node-pulse 2.5s ease-out infinite; }
`

const STEPS = [
  {
    number: '01',
    title: 'Scan Liquidity Pools',
    description: 'The agent scans thousands of liquidity pools across Hedera, Polygon, Arbitrum, Solana, and Ethereum L2 in real-time, indexing depth, slippage, and fee data every block.',
    color: 'emerald',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        <path d="M11 8v6m-3-3h6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Graph Pathfinding',
    description: 'A modified Dijkstra algorithm with heuristic pruning evaluates 1,000+ candidate routes simultaneously, scoring each path via a composite cost function Φ that weighs fees, slippage, MEV risk, and speed.',
    color: 'purple',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3h4v4H3zm14 0h4v4h-4zm-7 7h4v4h-4zM3 17h4v4H3zm14 0h4v4h-4z"/>
        <path d="M7 5h10M5 7v10m14-10v10M10 12h4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Simulate & Verify',
    description: 'The optimal path is simulated on a shadow fork 3 blocks ahead. Zero-knowledge proofs verify the execution integrity without revealing transaction details. MEV-resistant encoding is applied automatically.',
    color: 'cyan',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Execute & Settle',
    description: 'The atomic swap bundle is submitted directly to the sequencer, bypassing the public mempool. Cross-chain bridge relays confirm on destination chains. Savings are credited instantly.',
    color: 'yellow',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

const colorMap: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  emerald: { text: 'text-emerald-400', border: 'border-emerald-400/30', bg: 'bg-emerald-400/10', glow: 'rgba(52,211,153,0.3)' },
  purple:  { text: 'text-purple-400',  border: 'border-purple-400/30',  bg: 'bg-purple-400/10',  glow: 'rgba(168,85,247,0.3)'  },
  cyan:    { text: 'text-cyan-400',    border: 'border-cyan-400/30',    bg: 'bg-cyan-400/10',    glow: 'rgba(34,211,238,0.3)'  },
  yellow:  { text: 'text-yellow-300',  border: 'border-yellow-300/30',  bg: 'bg-yellow-300/10',  glow: 'rgba(253,224,71,0.3)'  },
}

function Step({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const colors = colorMap[step.color]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-6 items-start group"
    >
      {/* Node + connector */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <motion.div
          animate={inView ? { scale: [0.5, 1.1, 1] } : {}}
          transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
          className={`w-12 h-12 rounded-full border ${colors.border} ${colors.bg} flex items-center justify-center ${colors.text} hiw-node-pulse transition-all duration-300 group-hover:scale-110`}
          style={inView ? { boxShadow: `0 0 20px ${colors.glow}` } : {}}
        >
          {step.icon}
        </motion.div>
        {index < STEPS.length - 1 && (
          <div className="w-px flex-1 mt-3 bg-white/10 min-h-[60px] overflow-hidden">
            {inView && (
              <motion.div
                className={`w-full bg-gradient-to-b ${step.color === 'emerald' ? 'from-emerald-400/40' : step.color === 'purple' ? 'from-purple-400/40' : step.color === 'cyan' ? 'from-cyan-400/40' : 'from-yellow-300/40'} to-transparent`}
                initial={{ height: 0 }} animate={{ height: '100%' }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.5 }}
              />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pb-10 flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className={`hiw-mono text-[10px] tracking-[0.3em] ${colors.text} opacity-60`}>{step.number}</span>
          <div className={`h-px flex-1 max-w-[40px] bg-gradient-to-r ${step.color === 'emerald' ? 'from-emerald-400/30' : step.color === 'purple' ? 'from-purple-400/30' : step.color === 'cyan' ? 'from-cyan-400/30' : 'from-yellow-300/30'} to-transparent`} />
        </div>
        <h3 className={`hiw-font text-lg font-bold ${colors.text} mb-3 tracking-wide`}>
          {step.title}
        </h3>
        <p className="hiw-mono text-[12px] text-white/40 leading-relaxed max-w-lg">
          {step.description}
        </p>
      </div>
    </motion.div>
  )
}

export default function HowItWorks() {
  const titleRef = useRef<HTMLDivElement>(null)
  const titleInView = useInView(titleRef, { once: true })

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
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-emerald-400/40" />
            <span className="hiw-mono text-[10px] text-emerald-400/60 tracking-[0.3em] uppercase">Process</span>
          </div>
          <h2 className="hiw-font text-3xl md:text-4xl font-black text-white mb-3">
            How It Works
          </h2>
          <p className="hiw-mono text-[12px] text-white/40 max-w-lg leading-relaxed">
            Four steps from fragmented liquidity to optimal execution — all automated, all verifiable.
          </p>
        </motion.div>

        {/* Steps */}
        <div>
          {STEPS.map((step, i) => (
            <Step key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </>
  )
}
