import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BestPath } from '../hooks/useLiquidityAgent'
import { Activity, ChevronDown, ChevronUp, Zap } from 'lucide-react'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Share+Tech+Mono&display=swap');
  .mhud-font { font-family: 'Orbitron', monospace; }
  .mhud-mono { font-family: 'Share Tech Mono', monospace; }

  @keyframes mhud-slide-in {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  .mhud-slide-in { animation: mhud-slide-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }

  @keyframes mhud-pulse-dot {
    0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.6); }
    50%      { box-shadow: 0 0 0 4px rgba(52,211,153,0); }
  }
  .mhud-dot { animation: mhud-pulse-dot 1.8s ease-out infinite; }
`

const statusColor: Record<BestPath['status'], string> = {
  confirmed: 'text-emerald-400',
  pending:   'text-yellow-300',
  failed:    'text-red-400',
}

interface MobileHUDProps {
  bestPath: BestPath | null
  transactions: BestPath[]
}

export default function MobileHUD({ bestPath, transactions }: MobileHUDProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <style>{STYLES}</style>

      {/* Fixed bottom panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 mhud-slide-in"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* Collapsed header — always visible */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full px-4 py-3 flex items-center justify-between border-t border-emerald-400/20 bg-black/80"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mhud-dot" />
            <span className="mhud-font text-[10px] font-bold text-emerald-400 tracking-widest">NEXUS AI · LIVE</span>
          </div>

          <div className="flex items-center gap-4">
            {bestPath && (
              <div className="flex items-center gap-2">
                <Zap size={10} className="text-yellow-300" />
                <span className="mhud-mono text-[10px] text-yellow-300">{bestPath.savings}% saved</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-white/40">
              <Activity size={12} />
              <span className="mhud-mono text-[10px]">{transactions.length}</span>
            </div>
            {expanded ? <ChevronDown size={14} className="text-white/40" /> : <ChevronUp size={14} className="text-white/40" />}
          </div>
        </button>

        {/* Expanded panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden bg-black/90 border-t border-white/5"
            >
              <div className="p-4 max-h-[50vh] overflow-y-auto">

                {/* Best path summary */}
                {bestPath && (
                  <div className="mb-4 p-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5">
                    <div className="mhud-mono text-[9px] text-emerald-400/60 mb-2 tracking-widest">LATEST OPTIMAL PATH</div>
                    <div className="flex items-center gap-1 flex-wrap mb-2">
                      {bestPath.route.map((hop, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="mhud-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20 text-emerald-300">{hop.chain}</span>
                          {i < bestPath.route.length - 1 && <span className="text-emerald-400/40 text-[8px]">→</span>}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <div className="mhud-mono text-[8px] text-white/25">FEE</div>
                        <div className="mhud-mono text-[11px] text-yellow-300">${bestPath.totalFee.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="mhud-mono text-[8px] text-white/25">SAVINGS</div>
                        <div className="mhud-mono text-[11px] text-emerald-400">{bestPath.savings}%</div>
                      </div>
                      <div>
                        <div className="mhud-mono text-[8px] text-white/25">TYPE</div>
                        <div className="mhud-mono text-[11px] text-purple-400">{bestPath.type.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent transactions */}
                <div className="mhud-mono text-[9px] text-white/25 mb-2 tracking-widest">RECENT TRANSACTIONS</div>
                <div className="space-y-2">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center gap-2 py-1.5 px-2 rounded border border-white/5 bg-white/[0.02]">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tx.status === 'confirmed' ? 'bg-emerald-400' : tx.status === 'pending' ? 'bg-yellow-300' : 'bg-red-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="mhud-mono text-[9px] text-white/60 truncate">{tx.hash}</div>
                        <div className="mhud-mono text-[8px] text-white/25">{tx.type} · {tx.route.length} hops</div>
                      </div>
                      <span className={`mhud-mono text-[9px] ${statusColor[tx.status]}`}>
                        ${tx.totalFee.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
