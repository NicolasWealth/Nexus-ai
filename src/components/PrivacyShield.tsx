import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'

// ─── Styles ───────────────────────────────────────────────────────────────────

const PS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@500;700;900&display=swap');

  .ps-font       { font-family: 'Share Tech Mono', monospace; }
  .ps-font-title { font-family: 'Orbitron', monospace; }

  /* ── ZKP badge glow ── */
  @keyframes ps-zkp-glow {
    0%,100% {
      box-shadow: 0 0 4px 1px rgba(52,211,153,0.4),
                  0 0 12px 2px rgba(52,211,153,0.15);
    }
    50% {
      box-shadow: 0 0 8px 2px rgba(52,211,153,0.7),
                  0 0 24px 6px rgba(52,211,153,0.25);
    }
  }
  .ps-zkp-glow { animation: ps-zkp-glow 2.4s ease-in-out infinite; }

  /* ── Scanning beam ── */
  @keyframes ps-scan-beam {
    0%   { top: 0%; opacity: 0.9; }
    90%  { opacity: 0.9; }
    100% { top: 100%; opacity: 0; }
  }
  .ps-scan-beam {
    position: absolute;
    left: 0; right: 0;
    height: 3px;
    pointer-events: none;
    animation: ps-scan-beam 1.1s linear infinite;
    background: linear-gradient(
      to right,
      transparent 0%,
      rgba(52,211,153,0.05) 10%,
      rgba(52,211,153,0.55) 40%,
      rgba(52,211,153,0.85) 50%,
      rgba(52,211,153,0.55) 60%,
      rgba(52,211,153,0.05) 90%,
      transparent 100%
    );
    filter: blur(1px);
  }

  /* Trailing glow under beam */
  @keyframes ps-scan-trail {
    0%   { top: 0%; opacity: 0.4; height: 0%; }
    50%  { opacity: 0.15; }
    100% { top: 0%; height: 100%; opacity: 0; }
  }
  .ps-scan-trail {
    position: absolute;
    left: 0; right: 0; top: 0;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(52,211,153,0.06),
      transparent
    );
    animation: ps-scan-trail 1.1s linear infinite;
  }

  /* ── Toggle track pulse ── */
  @keyframes ps-track-on {
    0%,100% { box-shadow: 0 0 6px 1px rgba(52,211,153,0.4); }
    50%      { box-shadow: 0 0 14px 4px rgba(52,211,153,0.65); }
  }
  .ps-track-on { animation: ps-track-on 2s ease-in-out infinite; }

  /* ── Obfuscate blur transition ── */
  .ps-obfuscate {
    filter: blur(5px);
    user-select: none;
    transition: filter 0.35s ease;
  }
  .ps-reveal {
    filter: blur(0px);
    transition: filter 0.35s ease;
  }

  /* ── Shield icon ring ── */
  @keyframes ps-ring-spin {
    to { transform: rotate(360deg); }
  }
  .ps-ring-spin { animation: ps-ring-spin 8s linear infinite; }

  @keyframes ps-ring-counter {
    to { transform: rotate(-360deg); }
  }
  .ps-ring-counter { animation: ps-ring-counter 5s linear infinite; }

  /* ── Flicker on activate ── */
  @keyframes ps-flicker {
    0%   { opacity: 1; }
    8%   { opacity: 0.4; }
    12%  { opacity: 1; }
    20%  { opacity: 0.6; }
    24%  { opacity: 1; }
    100% { opacity: 1; }
  }
  .ps-flicker { animation: ps-flicker 0.5s ease-out forwards; }

  /* ── Status text blink ── */
  @keyframes ps-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0; }
  }
  .ps-blink { animation: ps-blink 1s step-end infinite; }

  /* ── Particle burst keyframes (inline style handles position) ── */
  @keyframes ps-particle {
    0%   { transform: translate(0,0) scale(1); opacity: 0.9; }
    100% { transform: var(--tx, translate(20px,-20px)) scale(0); opacity: 0; }
  }
  .ps-particle {
    animation: ps-particle 0.6s ease-out forwards;
  }

  /* ── Corner brackets ── */
  .ps-bracket {
    position: absolute;
    width: 10px; height: 10px;
    border-color: rgba(52,211,153,0.5);
    border-style: solid;
  }
  .ps-bracket-tl { top:-1px; left:-1px;  border-width: 1.5px 0 0 1.5px; }
  .ps-bracket-tr { top:-1px; right:-1px; border-width: 1.5px 1.5px 0 0; }
  .ps-bracket-bl { bottom:-1px; left:-1px;  border-width: 0 0 1.5px 1.5px; }
  .ps-bracket-br { bottom:-1px; right:-1px; border-width: 0 1.5px 1.5px 0; }
`

// ─── Context ──────────────────────────────────────────────────────────────────

interface PrivacyContextValue {
  shielded: boolean
  mask: (value: string, type?: 'address' | 'amount' | 'hash' | 'generic') => string
  setShielded: (active: boolean) => void
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null)

export const usePrivacy = () => {
  const context = useContext(PrivacyContext)
  if (!context) throw new Error('usePrivacy must be used within PrivacyShieldProvider')
  return context
}

// ─── Mask helpers ─────────────────────────────────────────────────────────────

const MASKS: Record<string, (v: string) => string> = {
  address: (v) => `${v.slice(0, 4)}${'×'.repeat(8)}${v.slice(-3)}`,
  amount:  (v) => '×'.repeat(v.replace(/[^0-9.]/g, '').length || 5),
  hash:    (v) => `${v.slice(0, 6)}${'×'.repeat(10)}${v.slice(-4)}`,
  generic: (v) => '×'.repeat(Math.min(v.length, 8)),
}

// ─── Particle burst (purely decorative) ──────────────────────────────────────

interface Particle { id: number; x: number; y: number; tx: string }

const ParticleBurst = ({ particles }: { particles: Particle[] }) => (
  <>
    {particles.map((p) => (
      <span
        key={p.id}
        className="ps-particle"
        style={{
          position: 'absolute',
          left: p.x,
          top: p.y,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#34d399',
          pointerEvents: 'none',
          zIndex: 20,
          '--tx': p.tx,
        } as React.CSSProperties}
      />
    ))}
  </>
)

// ─── ZKP Badge ────────────────────────────────────────────────────────────────

const ZKPBadge = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7, y: 4 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="ps-zkp-glow"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 9px 3px 6px',
          borderRadius: 20,
          border: '1px solid rgba(52,211,153,0.45)',
          background: 'rgba(52,211,153,0.08)',
        }}
      >
        {/* Verified checkmark */}
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <circle cx="5.5" cy="5.5" r="5" stroke="#34d399" strokeWidth="1" />
          <path d="M3 5.5L5 7.5L8 4" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          className="ps-font"
          style={{ fontSize: 9, color: '#34d399', letterSpacing: '0.18em', textTransform: 'uppercase' }}
        >
          ZKP Verified
        </span>
      </motion.div>
    )}
  </AnimatePresence>
)

// ─── Shield SVG icon ──────────────────────────────────────────────────────────

const ShieldIcon = ({ active }: { active: boolean }) => (
  <div style={{ position: 'relative', width: 36, height: 36 }}>
    {/* Outer spinning ring */}
    <svg
      className="ps-ring-spin"
      style={{ position: 'absolute', inset: 0 }}
      width="36" height="36" viewBox="0 0 36 36"
    >
      <circle
        cx="18" cy="18" r="16"
        fill="none"
        stroke={active ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.08)'}
        strokeWidth="1"
        strokeDasharray="6 4"
      />
    </svg>
    {/* Inner counter ring */}
    <svg
      className="ps-ring-counter"
      style={{ position: 'absolute', inset: 4 }}
      width="28" height="28" viewBox="0 0 28 28"
    >
      <circle
        cx="14" cy="14" r="12"
        fill="none"
        stroke={active ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)'}
        strokeWidth="0.8"
        strokeDasharray="3 6"
      />
    </svg>
    {/* Shield body */}
    <svg
      style={{ position: 'absolute', inset: 8 }}
      width="20" height="20" viewBox="0 0 20 20" fill="none"
    >
      <path
        d="M10 1L2 4.5V10C2 14.5 5.5 18.5 10 19.5C14.5 18.5 18 14.5 18 10V4.5L10 1Z"
        fill={active ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)'}
        stroke={active ? '#34d399' : 'rgba(255,255,255,0.2)'}
        strokeWidth="1.2"
      />
      {active && (
        <path
          d="M7 10L9 12L13 8"
          stroke="#34d399"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {!active && (
        <circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.15)" />
      )}
    </svg>
  </div>
)

// ─── Toggle switch ────────────────────────────────────────────────────────────

interface ToggleProps {
  active: boolean
  scanning: boolean
  onToggle: () => void
}

const ToggleSwitch = ({ active, scanning, onToggle }: ToggleProps) => {
  const thumbX = useSpring(active ? 22 : 2, { stiffness: 500, damping: 35 })

  useEffect(() => {
    thumbX.set(active ? 22 : 2)
  }, [active, thumbX])

  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.93 }}
      style={{
        position: 'relative',
        width: 50,
        height: 26,
        borderRadius: 13,
        border: `1px solid ${active ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.12)'}`,
        background: active
          ? 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.08))'
          : 'rgba(255,255,255,0.04)',
        cursor: 'pointer',
        outline: 'none',
        flexShrink: 0,
        overflow: 'hidden',
      }}
      className={active ? 'ps-track-on' : ''}
      aria-label={active ? 'Disable privacy shield' : 'Enable privacy shield'}
      aria-checked={active}
      role="switch"
    >
      {/* Track fill */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: 'rgba(52,211,153,0.12)',
          originX: 0,
        }}
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Thumb */}
      <motion.div
        style={{
          position: 'absolute',
          top: 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          x: thumbX,
          background: active
            ? 'radial-gradient(circle at 35% 35%, #6ee7b7, #34d399)'
            : 'radial-gradient(circle at 35% 35%, #6b7280, #374151)',
          boxShadow: active
            ? '0 0 8px rgba(52,211,153,0.7), 0 1px 4px rgba(0,0,0,0.4)'
            : '0 1px 4px rgba(0,0,0,0.5)',
        }}
      >
        {/* Scanning pulse on thumb */}
        {scanning && (
          <motion.div
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: '50%',
              border: '1.5px solid rgba(52,211,153,0.6)',
            }}
            animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* ON / OFF text */}
      <span
        className="ps-font"
        style={{
          position: 'absolute',
          fontSize: 7,
          letterSpacing: '0.05em',
          top: '50%',
          transform: 'translateY(-50%)',
          right: active ? 'auto' : 6,
          left: active ? 6 : 'auto',
          color: active ? 'rgba(52,211,153,0.7)' : 'rgba(255,255,255,0.2)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {active ? 'ON' : 'OFF'}
      </span>
    </motion.button>
  )
}

// ─── Scanning overlay ─────────────────────────────────────────────────────────

const ScanOverlay = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 50,
          overflow: 'hidden',
        }}
      >
        <div className="ps-scan-trail" />
        <div className="ps-scan-beam" />

        {/* Grid overlay during scan */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(52,211,153,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52,211,153,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }} />

        {/* Corner lock indicators */}
        {[
          { top: 16, left: 16 },
          { top: 16, right: 16 },
          { bottom: 16, left: 16 },
          { bottom: 16, right: 16 },
        ].map((pos, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0.6], scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{
              position: 'fixed',
              width: 20, height: 20,
              borderColor: 'rgba(52,211,153,0.6)',
              borderStyle: 'solid',
              ...pos,
              borderWidth: pos.top !== undefined && pos.left !== undefined ? '2px 0 0 2px'
                         : pos.top !== undefined ? '2px 2px 0 0'
                         : pos.left !== undefined ? '0 0 2px 2px'
                         : '0 2px 2px 0',
            }}
          />
        ))}

        {/* Scanning status text */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 6,
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#34d399',
              display: 'inline-block',
              boxShadow: '0 0 6px #34d399',
            }}
            className="ps-blink"
          />
          <span className="ps-font" style={{ fontSize: 10, color: '#34d399', letterSpacing: '0.2em' }}>
            ENCRYPTING SENSITIVE DATA
          </span>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

// ─── Provider ─────────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

interface PrivacyShieldProps {
  /** Called whenever the shield state changes */
  onChange?: (active: boolean) => void
}

export const PrivacyShield = ({ onChange }: PrivacyShieldProps) => {
  const { shielded, setShielded } = usePrivacy()
  const [active, setActive]     = useState(shielded)
  const [scanning, setScanning] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [justActivated, setJustActivated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const particleId   = useRef(0)

  const spawnParticles = useCallback(() => {
    const burst: Particle[] = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2
      const dist  = 20 + Math.random() * 20
      return {
        id: ++particleId.current,
        x:  16,
        y:  16,
        tx: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`,
      }
    })
    setParticles(burst)
    setTimeout(() => setParticles([]), 700)
  }, [])

  const handleToggle = useCallback(() => {
    const next = !active

    if (next) {
      // Activate: scan then lock
      setScanning(true)
      setJustActivated(true)
      spawnParticles()
      setTimeout(() => {
        setScanning(false)
        setShielded(true)
        onChange?.(true)
      }, 1400)
      setTimeout(() => setJustActivated(false), 600)
    } else {
      // Deactivate immediately
      setShielded(false)
      onChange?.(false)
    }
  }, [active, onChange, spawnParticles, setShielded])

  // Sync internal → external shielded state on mount
  useEffect(() => {
    setActive(shielded)
  }, [shielded])

  const motionX = useMotionValue(0)
  const motionY = useMotionValue(0)

  return (
    <>
      <style>{PS_STYLES}</style>

      {/* Full-screen scan overlay */}
      <ScanOverlay visible={scanning} />

      {/* Widget */}
      <motion.div
        ref={containerRef}
        className={justActivated ? 'ps-flicker' : ''}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          display: 'inline-flex',
          flexDirection: 'column',
          gap: 10,
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${active ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: active
            ? '0 0 0 1px rgba(52,211,153,0.1), 0 4px 24px rgba(52,211,153,0.1)'
            : '0 4px 24px rgba(0,0,0,0.4)',
          minWidth: 220,
          transition: 'border-color 0.4s, box-shadow 0.4s',
          userSelect: 'none',
        }}
        onMouseMove={(e) => {
          const r = containerRef.current?.getBoundingClientRect()
          if (!r) return
          motionX.set(((e.clientX - r.left) / r.width - 0.5) * 6)
          motionY.set(((e.clientY - r.top) / r.height - 0.5) * 6)
        }}
        onMouseLeave={() => { motionX.set(0); motionY.set(0) }}
      >
        {/* Corner brackets */}
        <div className="ps-bracket ps-bracket-tl" />
        <div className="ps-bracket ps-bracket-tr" />
        <div className="ps-bracket ps-bracket-bl" />
        <div className="ps-bracket ps-bracket-br" />

        {/* Particle burst container */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none' }}>
          <ParticleBurst particles={particles} />
        </div>

        {/* Top row: shield icon + label + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldIcon active={active} />

          <div style={{ flex: 1 }}>
            <div
              className="ps-font-title"
              style={{ fontSize: 11, fontWeight: 700, color: active ? '#34d399' : 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', lineHeight: 1 }}
            >
              PRIVACY SHIELD
            </div>
            <motion.div
              key={active ? 'on' : scanning ? 'scan' : 'off'}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="ps-font"
              style={{ fontSize: 9, marginTop: 3, letterSpacing: '0.15em', color: active ? 'rgba(52,211,153,0.6)' : 'rgba(255,255,255,0.25)' }}
            >
              {scanning ? (
                <>SCANNING<span className="ps-blink">_</span></>
              ) : active ? (
                'ACTIVE · DATA MASKED'
              ) : (
                'INACTIVE · DATA EXPOSED'
              )}
            </motion.div>
          </div>

          <ToggleSwitch active={active} scanning={scanning} onToggle={handleToggle} />
        </div>

        {/* Divider */}
        <motion.div
          style={{
            height: 1,
            background: active
              ? 'linear-gradient(to right, transparent, rgba(52,211,153,0.3), transparent)'
              : 'rgba(255,255,255,0.05)',
          }}
          animate={{ opacity: active ? 1 : 0.4 }}
        />

        {/* Status rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { label: 'ADDRESSES', protected: active },
            { label: 'TX AMOUNTS', protected: active },
            { label: 'TX HASHES',  protected: active },
          ].map(({ label, protected: on }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="ps-font" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>
                {label}
              </span>
              <motion.span
                key={String(on)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ps-font"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  color: on ? '#34d399' : 'rgba(255,100,100,0.6)',
                }}
              >
                {on ? '✔ MASKED' : '✖ VISIBLE'}
              </motion.span>
            </div>
          ))}
        </div>

        {/* ZKP Badge — appears when active */}
        <motion.div
          style={{ display: 'flex', justifyContent: 'center' }}
          layout
        >
          <ZKPBadge visible={active} />
        </motion.div>

        {/* Scan progress bar (shows during scanning) */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.3, ease: 'easeInOut' }}
                  style={{ height: '100%', background: 'linear-gradient(to right, #34d399, #a7f3d0)', borderRadius: 1 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span className="ps-font" style={{ fontSize: 8, color: 'rgba(52,211,153,0.45)', letterSpacing: '0.1em' }}>
                  INITIALISING ZK PROOF
                </span>
                <span className="ps-font ps-blink" style={{ fontSize: 8, color: 'rgba(52,211,153,0.45)' }}>
                  ENCRYPTING
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

// ─── Obfuscated text helper component ────────────────────────────────────────

interface PrivateTextProps {
  value: string
  type?: 'address' | 'amount' | 'hash' | 'generic'
  className?: string
  style?: React.CSSProperties
}

/**
 * Drop-in wrapper for any sensitive value in TransactionHUD.
 * Automatically blurs and masks when the shield is active.
 *
 * Usage:
 *   <PrivateText value={tx.from} type="address" />
 *   <PrivateText value={tx.amount} type="amount" />
 */
export const PrivateText = ({ value, type = 'generic', className = '', style }: PrivateTextProps) => {
  const { shielded, mask } = usePrivacy()

  return (
    <motion.span
      className={`${shielded ? 'ps-obfuscate' : 'ps-reveal'} ${className}`}
      animate={{ filter: shielded ? 'blur(4px)' : 'blur(0px)' }}
      transition={{ duration: 0.35 }}
      style={style}
    >
      {mask(value, type)}
    </motion.span>
  )
}

export default PrivacyShield
