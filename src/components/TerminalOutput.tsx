import { useEffect, useRef, useState, useCallback } from 'react'

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'system' | 'data' | 'exec'

interface LogEntry {
  id: number
  text: string
  level: LogLevel
  prefix: string
  timestamp: string
  typed: string
  done: boolean
}

interface TerminalOutputProps {
  typingSpeed?: number
  lineDelay?: number
  script?: Array<{ text: string; level?: LogLevel }>
}

const DEFAULT_SCRIPT: Array<{ text: string; level: LogLevel }> = [
  { text: 'NEXUS-AI v4.1.0 initialising runtime environment...', level: 'system' },
  { text: 'Loading cryptographic modules → SHA-3 / ECDSA / AES-256-GCM', level: 'info' },
  { text: 'Establishing secure WebSocket to Hedera Hashgraph mainnet...', level: 'info' },
  { text: 'Connection ACK received. Latency: 11 ms', level: 'success' },
  { text: 'Scanning liquidity pools on Hedera HTS — depth window: 48h', level: 'exec' },
  { text: 'Pool 0x4f2a9c → ETH/USDC  TVL: $12.4M  slippage: 0.07%', level: 'data' },
  { text: 'Pool 0x8b31de → WBTC/ETH  TVL: $8.1M   slippage: 0.12%', level: 'data' },
  { text: 'Pool 0x2e90fa → ARB/USDC  TVL: $4.7M   slippage: 0.19%', level: 'data' },
  { text: 'Running graph-search across 7 chains — Dijkstra + heuristic prune', level: 'exec' },
  { text: 'Evaluating 1,204 candidate paths... scoring via cost function Φ', level: 'info' },
  { text: 'WARNING: High MEV activity detected on Ethereum L1 — rerouting', level: 'warn' },
  { text: 'Optimal path found → Polygon zkEVM L2 [score: 0.983 / 1.000]', level: 'success' },
  { text: 'Route: USDC → MATIC → WETH → ARB  via Uniswap V4 + Curve', level: 'data' },
  { text: 'Projected gas cost: $0.0031  |  Projected slippage: 0.04%', level: 'data' },
  { text: 'Constructing calldata for cross-chain atomic swap bundle...', level: 'exec' },
  { text: 'Simulating execution on shadow fork — 3 blocks ahead', level: 'info' },
  { text: 'Simulation PASSED. No revert conditions detected', level: 'success' },
  { text: 'Submitting transaction bundle to Polygon zkEVM sequencer...', level: 'exec' },
  { text: 'TxHash: 0x9f3c...d8a2  |  Nonce: 4401  |  Priority fee: 1.2 gwei', level: 'data' },
  { text: 'Block 19_482_341 — transaction included ✓', level: 'success' },
  { text: 'Cross-chain bridge relay confirmed on Arbitrum One', level: 'success' },
  { text: 'Final settlement: 1,847.22 ARB credited to 0x7a4f...c391', level: 'success' },
  { text: 'Cycle complete. Agent returns to idle watch mode.', level: 'system' },
]

const LEVEL_CFG: Record<LogLevel, { prefix: string; color: string; dim: string }> = {
  system:  { prefix: '◈ SYS', color: '#e8ff00', dim: 'rgba(232,255,0,0.45)'   },
  info:    { prefix: '◆ INF', color: '#22d3ee', dim: 'rgba(34,211,238,0.45)'  },
  success: { prefix: '✔ OK ', color: '#34d399', dim: 'rgba(52,211,153,0.45)'  },
  warn:    { prefix: '▲ WRN', color: '#fb923c', dim: 'rgba(251,146,60,0.45)'  },
  error:   { prefix: '✖ ERR', color: '#f87171', dim: 'rgba(248,113,113,0.45)' },
  data:    { prefix: '· DAT', color: '#a78bfa', dim: 'rgba(167,139,250,0.45)' },
  exec:    { prefix: '» EXE', color: '#c084fc', dim: 'rgba(192,132,252,0.45)' },
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');
  .tm-root { font-family: 'JetBrains Mono', monospace; position: relative; }
  .tm-line-text { text-shadow: 0 0 8px currentColor; }
  @keyframes tm-blink { 0%,49%{opacity:1;} 50%,100%{opacity:0;} }
  .tm-cursor { display:inline-block; width:0.55em; height:1.1em; vertical-align:text-bottom; margin-left:1px; animation:tm-blink 1.05s step-end infinite; }
  @keyframes tm-scan { 0%{transform:translateY(-100%);} 100%{transform:translateY(100vh);} }
  .tm-scanline { position:absolute; left:0; right:0; height:3px; background:linear-gradient(to bottom,transparent,rgba(0,255,128,0.06),transparent); pointer-events:none; animation:tm-scan 6s linear infinite; z-index:10; }
  .tm-vignette { position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.65) 100%); border-radius:inherit; z-index:5; }
  .tm-bg-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(0,255,128,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,128,0.025) 1px,transparent 1px); background-size:28px 28px; border-radius:inherit; pointer-events:none; }
  .tm-corner { position:absolute; width:16px; height:16px; border-color:rgba(52,211,153,0.5); border-style:solid; }
  .tm-corner-tl { top:-1px; left:-1px; border-width:1.5px 0 0 1.5px; border-radius:4px 0 0 0; }
  .tm-corner-tr { top:-1px; right:-1px; border-width:1.5px 1.5px 0 0; border-radius:0 4px 0 0; }
  .tm-corner-bl { bottom:-1px; left:-1px; border-width:0 0 1.5px 1.5px; border-radius:0 0 0 4px; }
  .tm-corner-br { bottom:-1px; right:-1px; border-width:0 1.5px 1.5px 0; border-radius:0 0 4px 0; }
  @keyframes tm-bar-pulse { 0%,100%{opacity:0.7;} 50%{opacity:1;} }
  .tm-bar-fill { animation:tm-bar-pulse 1.8s ease-in-out infinite; transition:width 0.4s ease; }
  @keyframes tm-line-in { from{opacity:0;transform:translateX(-4px);} to{opacity:1;transform:translateX(0);} }
  .tm-line { animation:tm-line-in 0.12s ease-out forwards; }
  .tm-header-glow { text-shadow:0 0 10px rgba(52,211,153,0.9),0 0 30px rgba(52,211,153,0.4); }
  .tm-scroll::-webkit-scrollbar{width:4px;} .tm-scroll::-webkit-scrollbar-track{background:rgba(255,255,255,0.03);} .tm-scroll::-webkit-scrollbar-thumb{background:rgba(52,211,153,0.25);border-radius:2px;}
  @keyframes tm-dot { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.7);} 50%{box-shadow:0 0 0 4px rgba(52,211,153,0);} }
  .tm-status-dot { animation:tm-dot 1.4s ease-out infinite; }
`

const ts = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`
}

export const TerminalOutput = ({
  typingSpeed = 38,
  lineDelay   = 420,
  script,
}: TerminalOutputProps) => {
  const lines = (script as Array<{ text: string; level: LogLevel }>) ?? DEFAULT_SCRIPT

  const [log,         setLog]         = useState<LogEntry[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [charIndex,   setCharIndex]   = useState(0)
  const [running,     setRunning]     = useState(false)
  const [complete,    setComplete]    = useState(false)
  const [progress,    setProgress]    = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const lineTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const charTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const scrollBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [])

  // Start new line entry
  useEffect(() => {
    if (!running || complete || currentLine >= lines.length || charIndex !== 0) return
    const src = lines[currentLine]
    const cfg = LEVEL_CFG[src.level ?? 'info']
    const entry: LogEntry = { id: Date.now() + currentLine, text: src.text, level: src.level ?? 'info', prefix: cfg.prefix, timestamp: ts(), typed: '', done: false }
    setTimeout(() => setLog(prev => [...prev, entry]), 0)
  }, [running, complete, currentLine, charIndex, lines])

  // Handle completion
  useEffect(() => {
    if (currentLine >= lines.length && running) {
      setTimeout(() => { setComplete(true); setRunning(false) }, 0)
    }
  }, [currentLine, lines.length, running])

  // Type characters
  useEffect(() => {
    if (!running || complete || currentLine >= lines.length) return
    if (charIndex === 0 && log.length <= currentLine) return
    const src = lines[currentLine]
    const msPerChar = 1000 / typingSpeed

    if (charIndex < src.text.length) {
      charTimer.current = setInterval(() => {
        setCharIndex(ci => {
          const next = ci + 1
          setLog(prev => {
            const copy = [...prev]
            if (!copy.length) return prev
            copy[copy.length - 1] = { ...copy[copy.length - 1], typed: src.text.slice(0, next), done: next >= src.text.length }
            return copy
          })
          scrollBottom()
          if (next >= src.text.length) clearInterval(charTimer.current!)
          return next
        })
      }, msPerChar)
      return () => clearInterval(charTimer.current!)
    }

    lineTimer.current = setTimeout(() => {
      setCurrentLine(cl => cl + 1)
      setCharIndex(0)
      setProgress(((currentLine + 1) / lines.length) * 100)
    }, lineDelay)
    return () => clearTimeout(lineTimer.current!)
  }, [running, complete, currentLine, charIndex, lines, typingSpeed, lineDelay, scrollBottom, log.length])

  const startTerminal = () => {
    setLog([]); setCurrentLine(0); setCharIndex(0)
    setProgress(0); setComplete(false); setRunning(true)
  }

  const isActive = running && !complete

  return (
    <>
      <style>{STYLES}</style>
      <div className="tm-root" style={{ width: '100%', maxWidth: 760, borderRadius: 12, background: 'linear-gradient(145deg,#050a07,#030806 40%,#060309)', border: '1px solid rgba(52,211,153,0.18)', boxShadow: '0 4px 40px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
        <div className="tm-bg-grid"/><div className="tm-scanline"/><div className="tm-vignette"/>
        <div className="tm-corner tm-corner-tl"/><div className="tm-corner tm-corner-tr"/>
        <div className="tm-corner tm-corner-bl"/><div className="tm-corner tm-corner-br"/>

        {/* Title bar */}
        <div style={{ position: 'relative', zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(52,211,153,0.1)', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['#f87171','#fbbf24','#34d399'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }}/>)}
            <span style={{ marginLeft: 8, fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'rgba(52,211,153,0.6)', letterSpacing: '0.15em' }}>NEXUS-AI · AGENT RUNTIME</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={isActive ? 'tm-status-dot' : ''} style={{ width: 7, height: 7, borderRadius: '50%', background: complete ? '#34d399' : isActive ? '#34d399' : 'rgba(255,255,255,0.15)' }}/>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(52,211,153,0.45)', letterSpacing: '0.1em' }}>{complete ? 'COMPLETE' : isActive ? 'RUNNING' : 'IDLE'}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', position: 'relative', zIndex: 6 }}>
          <div className="tm-bar-fill" style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(to right,#34d399,#c084fc)' }}/>
        </div>

        {/* Header */}
        <div style={{ position: 'relative', zIndex: 6, padding: '18px 20px 10px', borderBottom: '1px solid rgba(52,211,153,0.07)' }}>
          <div className="tm-header-glow" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: '#34d399', letterSpacing: '0.04em' }}>NEXUS-AI AGENT</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(52,211,153,0.4)', letterSpacing: '0.2em', marginTop: 2 }}>CROSS-CHAIN LIQUIDITY OPTIMIZER · LOG STREAM</div>
        </div>

        {/* Log body */}
        <div ref={scrollRef} className="tm-scroll" style={{ position: 'relative', zIndex: 6, height: 340, overflowY: 'auto', padding: '12px 0' }}>
          {!log.length && !running && (
            <div style={{ padding: '20px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Awaiting initialisation...</div>
          )}
          {log.map((entry, idx) => {
            const cfg    = LEVEL_CFG[entry.level]
            const isLast = idx === log.length - 1
            return (
              <div key={entry.id} className="tm-line" style={{ display: 'flex', alignItems: 'baseline', padding: '2.5px 20px', background: isLast && !entry.done ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.18)', marginRight: 10, letterSpacing: '0.05em', flexShrink: 0, userSelect: 'none' }}>{entry.timestamp}</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, fontWeight: 700, color: cfg.dim, marginRight: 10, letterSpacing: '0.08em', flexShrink: 0, userSelect: 'none' }}>{entry.prefix}</span>
                <span className="tm-line-text" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: cfg.color, lineHeight: 1.6, wordBreak: 'break-all' }}>
                  {entry.typed}
                  {isLast && !entry.done && <span className="tm-cursor" style={{ background: cfg.color }}/>}
                </span>
              </div>
            )
          })}
          {complete && (
            <div style={{ padding: '2.5px 20px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'rgba(52,211,153,0.5)' }}>agent@nexus:~$</span>
              <span className="tm-cursor" style={{ background: '#34d399' }}/>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderTop: '1px solid rgba(52,211,153,0.08)', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ label:'CHAIN',val:'POLYGON'},{label:'BLOCK',val:'19,482,341'},{label:'GAS',val:'1.2 GWEI'}].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.15em' }}>{label}:</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(52,211,153,0.7)' }}>{val}</span>
              </div>
            ))}
          </div>
          <button
            onClick={startTerminal} disabled={isActive}
            style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: isActive ? 'rgba(52,211,153,0.3)' : '#34d399', background: isActive ? 'rgba(52,211,153,0.04)' : 'rgba(52,211,153,0.08)', border: `1px solid ${isActive ? 'rgba(52,211,153,0.1)' : 'rgba(52,211,153,0.3)'}`, borderRadius: 5, padding: '5px 14px', cursor: isActive ? 'not-allowed' : 'pointer', outline: 'none' }}
          >
            {complete ? '▶ REPLAY' : isActive ? '● RUNNING' : '▶ RUN'}
          </button>
        </div>
      </div>
    </>
  )
}

export default TerminalOutput
