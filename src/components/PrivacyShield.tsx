/* eslint-disable react-refresh/only-export-components */
import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, ReactNode,
} from 'react'
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'

const PS_STYLES = `
  .ps-font { font-family: 'Share Tech Mono', monospace; }
  .ps-font-title { font-family: 'Orbitron', monospace; }
  @keyframes ps-zkp-glow {
    0%,100% { box-shadow: 0 0 4px 1px rgba(52,211,153,0.4); }
    50% { box-shadow: 0 0 8px 2px rgba(52,211,153,0.7); }
  }
  .ps-zkp-glow { animation: ps-zkp-glow 2.4s ease-in-out infinite; }
  @keyframes ps-scan-beam {
    0% { top: 0%; opacity: 0.9; } 100% { top: 100%; opacity: 0; }
  }
  .ps-scan-beam {
    position: absolute; left: 0; right: 0; height: 3px; pointer-events: none;
    animation: ps-scan-beam 1.1s linear infinite;
    background: linear-gradient(to right, transparent, rgba(52,211,153,0.55) 50%, transparent);
    filter: blur(1px);
  }
  @keyframes ps-track-on {
    0%,100% { box-shadow: 0 0 6px 1px rgba(52,211,153,0.4); }
    50% { box-shadow: 0 0 14px 4px rgba(52,211,153,0.65); }
  }
  .ps-track-on { animation: ps-track-on 2s ease-in-out infinite; }
  @keyframes ps-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
  .ps-blink { animation: ps-blink 1s step-end infinite; }
  @keyframes ps-ring-spin { to { transform: rotate(360deg); } }
  .ps-ring-spin { animation: ps-ring-spin 8s linear infinite; }
  @keyframes ps-ring-counter { to { transform: rotate(-360deg); } }
  .ps-ring-counter { animation: ps-ring-counter 5s linear infinite; }
  .ps-bracket { position: absolute; width: 10px; height: 10px; border-color: rgba(52,211,153,0.5); border-style: solid; }
  .ps-bracket-tl { top:-1px; left:-1px; border-width: 1.5px 0 0 1.5px; }
  .ps-bracket-tr { top:-1px; right:-1px; border-width: 1.5px 1.5px 0 0; }
  .ps-bracket-bl { bottom:-1px; left:-1px; border-width: 0 0 1.5px 1.5px; }
  .ps-bracket-br { bottom:-1px; right:-1px; border-width: 0 1.5px 1.5px 0; }
`

interface PrivacyContextValue {
  shielded: boolean
  mask: (value: string, type?: 'address' | 'amount' | 'hash' | 'generic') => string
  setShielded: (active: boolean) => void
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null)

export const usePrivacy = () => {
  const ctx = useContext(PrivacyContext)
  if (!ctx) throw new Error('usePrivacy must be used within PrivacyShieldProvider')
  return ctx
}

const MASKS: Record<string, (v: string) => string> = {
  address: (v) => `${v.slice(0, 4)}${'×'.repeat(8)}${v.slice(-3)}`,
  amount:  (v) => '×'.repeat(v.replace(/[^0-9.]/g, '').length || 5),
  hash:    (v) => `${v.slice(0, 6)}${'×'.repeat(10)}${v.slice(-4)}`,
  generic: (v) => '×'.repeat(Math.min(v.length, 8)),
}

interface Particle { id: number; x: number; y: number; tx: string }

export const PrivacyShieldProvider = ({ children }: { children: ReactNode }) => {
  const [shielded, setShielded] = useState(false)
  const mask = useCallback(
    (value: string, type: 'address' | 'amount' | 'hash' | 'generic' = 'generic') => {
      if (!shielded) return value
      return MASKS[type]?.(value) ?? MASKS.generic(value)
    },
    [shielded]
  )
  return (
    <PrivacyContext.Provider value={{ shielded, mask, setShielded }}>
      {children}
    </PrivacyContext.Provider>
  )
}

const ZKPBadge = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
        transition={{ duration: 0.3 }} className="ps-zkp-glow"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px 3px 6px', borderRadius: 20, border: '1px solid rgba(52,211,153,0.45)', background: 'rgba(52,211,153,0.08)' }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <circle cx="5.5" cy="5.5" r="5" stroke="#34d399" strokeWidth="1"/>
          <path d="M3 5.5L5 7.5L8 4" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="ps-font" style={{ fontSize: 9, color: '#34d399', letterSpacing: '0.18em', textTransform: 'uppercase' }}>ZKP Verified</span>
      </motion.div>
    )}
  </AnimatePresence>
)

const ShieldIcon = ({ active }: { active: boolean }) => (
  <div style={{ position: 'relative', width: 36, height: 36 }}>
    <svg className="ps-ring-spin" style={{ position: 'absolute', inset: 0 }} width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="none" stroke={active ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.08)'} strokeWidth="1" strokeDasharray="6 4"/>
    </svg>
    <svg className="ps-ring-counter" style={{ position: 'absolute', inset: 4 }} width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="none" stroke={active ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)'} strokeWidth="0.8" strokeDasharray="3 6"/>
    </svg>
    <svg style={{ position: 'absolute', inset: 8 }} width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 1L2 4.5V10C2 14.5 5.5 18.5 10 19.5C14.5 18.5 18 14.5 18 10V4.5L10 1Z" fill={active ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)'} stroke={active ? '#34d399' : 'rgba(255,255,255,0.2)'} strokeWidth="1.2"/>
      {active && <path d="M7 10L9 12L13 8" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>}
    </svg>
  </div>
)

const ScanOverlay = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}
      >
        <div className="ps-scan-beam" />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 6px #34d399' }} className="ps-blink"/>
          <span className="ps-font" style={{ fontSize: 10, color: '#34d399', letterSpacing: '0.2em' }}>ENCRYPTING SENSITIVE DATA</span>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

interface PrivacyShieldProps { onChange?: (active: boolean) => void }

export const PrivacyShield = ({ onChange }: PrivacyShieldProps) => {
  const { shielded, setShielded } = usePrivacy()
  const [active, setActive]       = useState(shielded)
  const [scanning, setScanning]   = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const particleId   = useRef(0)
  const motionX = useMotionValue(0)
  const motionY = useMotionValue(0)

  const spawnParticles = useCallback(() => {
    const burst: Particle[] = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2
      const dist  = 20 + Math.random() * 20
      return { id: ++particleId.current, x: 16, y: 16, tx: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)` }
    })
    setParticles(burst)
    setTimeout(() => setParticles([]), 700)
  }, [])

  const handleToggle = useCallback(() => {
    const next = !active
    setActive(next)
    if (next) {
      setScanning(true)
      spawnParticles()
      setTimeout(() => { setScanning(false); setShielded(true); onChange?.(true) }, 1400)
    } else {
      setShielded(false)
      onChange?.(false)
    }
  }, [active, onChange, spawnParticles, setShielded])

  useEffect(() => { setActive(shielded) }, [shielded])

  const thumbX = useSpring(active ? 22 : 2, { stiffness: 500, damping: 35 })
  useEffect(() => { thumbX.set(active ? 22 : 2) }, [active, thumbX])

  return (
    <>
      <style>{PS_STYLES}</style>
      <ScanOverlay visible={scanning} />
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', border: `1px solid ${active ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`, minWidth: 220, userSelect: 'none' }}
        onMouseMove={(e) => { const r = containerRef.current?.getBoundingClientRect(); if (!r) return; motionX.set(((e.clientX - r.left) / r.width - 0.5) * 6); motionY.set(((e.clientY - r.top) / r.height - 0.5) * 6) }}
        onMouseLeave={() => { motionX.set(0); motionY.set(0) }}
      >
        <div className="ps-bracket ps-bracket-tl"/><div className="ps-bracket ps-bracket-tr"/>
        <div className="ps-bracket ps-bracket-bl"/><div className="ps-bracket ps-bracket-br"/>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none' }}>
          {particles.map(p => (
            <span key={p.id} style={{ position: 'absolute', left: p.x, top: p.y, width: 4, height: 4, borderRadius: '50%', background: '#34d399', pointerEvents: 'none', zIndex: 20, animation: 'ps-particle 0.6s ease-out forwards', ['--tx' as string]: p.tx }}/>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldIcon active={active}/>
          <div style={{ flex: 1 }}>
            <div className="ps-font-title" style={{ fontSize: 11, fontWeight: 700, color: active ? '#34d399' : 'rgba(255,255,255,0.6)', letterSpacing: '0.12em' }}>PRIVACY SHIELD</div>
            <div className="ps-font" style={{ fontSize: 9, marginTop: 3, letterSpacing: '0.15em', color: active ? 'rgba(52,211,153,0.6)' : 'rgba(255,255,255,0.25)' }}>
              {scanning ? <>SCANNING<span className="ps-blink">_</span></> : active ? 'ACTIVE · DATA MASKED' : 'INACTIVE · DATA EXPOSED'}
            </div>
          </div>
          <motion.button
            onClick={handleToggle} whileTap={{ scale: 0.93 }}
            style={{ position: 'relative', width: 50, height: 26, borderRadius: 13, border: `1px solid ${active ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.12)'}`, background: active ? 'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(52,211,153,0.08))' : 'rgba(255,255,255,0.04)', cursor: 'pointer', outline: 'none', overflow: 'hidden', flexShrink: 0 }}
            className={active ? 'ps-track-on' : ''} role="switch" aria-checked={active}
          >
            <motion.div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', x: thumbX, background: active ? 'radial-gradient(circle at 35% 35%,#6ee7b7,#34d399)' : 'radial-gradient(circle at 35% 35%,#6b7280,#374151)', boxShadow: active ? '0 0 8px rgba(52,211,153,0.7)' : '0 1px 4px rgba(0,0,0,0.5)' }}/>
            <span className="ps-font" style={{ position: 'absolute', fontSize: 7, top: '50%', transform: 'translateY(-50%)', right: active ? 'auto' : 6, left: active ? 6 : 'auto', color: active ? 'rgba(52,211,153,0.7)' : 'rgba(255,255,255,0.2)', userSelect: 'none', pointerEvents: 'none' }}>
              {active ? 'ON' : 'OFF'}
            </span>
          </motion.button>
        </div>
        <motion.div style={{ height: 1, background: active ? 'linear-gradient(to right,transparent,rgba(52,211,153,0.3),transparent)' : 'rgba(255,255,255,0.05)' }} animate={{ opacity: active ? 1 : 0.4 }}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[{ label: 'ADDRESSES', protected: active }, { label: 'TX AMOUNTS', protected: active }, { label: 'TX HASHES', protected: active }].map(({ label, protected: on }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="ps-font" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>{label}</span>
              <motion.span key={String(on)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ps-font" style={{ fontSize: 9, letterSpacing: '0.1em', color: on ? '#34d399' : 'rgba(255,100,100,0.6)' }}>
                {on ? '✔ MASKED' : '✖ VISIBLE'}
              </motion.span>
            </div>
          ))}
        </div>
        <motion.div style={{ display: 'flex', justifyContent: 'center' }} layout>
          <ZKPBadge visible={active}/>
        </motion.div>
        <AnimatePresence>
          {scanning && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.3 }} style={{ height: '100%', background: 'linear-gradient(to right,#34d399,#a7f3d0)', borderRadius: 1 }}/>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

interface PrivateTextProps {
  value: string
  type?: 'address' | 'amount' | 'hash' | 'generic'
  className?: string
  style?: React.CSSProperties
}

export const PrivateText = ({ value, type = 'generic', className = '', style }: PrivateTextProps) => {
  const { shielded, mask } = usePrivacy()
  return (
    <motion.span
      className={className}
      animate={{ filter: shielded ? 'blur(4px)' : 'blur(0px)' }}
      transition={{ duration: 0.35 }}
      style={style}
    >
      {mask(value, type)}
    </motion.span>
  )
}

export default PrivacyShield
