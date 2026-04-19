import { useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'

const CARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
  .ic-root { font-family: 'Syne', sans-serif; }
  .ic-mono { font-family: 'DM Mono', monospace; }
  @keyframes border-cycle {
    0%,100% { border-color:rgba(52,211,153,0.65); box-shadow:0 0 20px 2px rgba(52,211,153,0.2); }
    50%      { border-color:rgba(192,132,252,0.65); box-shadow:0 0 20px 2px rgba(192,132,252,0.2); }
  }
  .ic-border-cycle { animation: border-cycle 5s ease-in-out infinite; }
  .ic-corner { position:absolute; width:14px; height:14px; pointer-events:none; }
  .ic-corner-tl { top:-1px; left:-1px; border-top:1.5px solid; border-left:1.5px solid; border-radius:6px 0 0 0; }
  .ic-corner-tr { top:-1px; right:-1px; border-top:1.5px solid; border-right:1.5px solid; border-radius:0 6px 0 0; }
  .ic-corner-bl { bottom:-1px; left:-1px; border-bottom:1.5px solid; border-left:1.5px solid; border-radius:0 0 0 6px; }
  .ic-corner-br { bottom:-1px; right:-1px; border-bottom:1.5px solid; border-right:1.5px solid; border-radius:0 0 6px 0; }
  @keyframes corner-cycle { 0%,100%{border-color:rgba(52,211,153,0.9);} 50%{border-color:rgba(192,132,252,0.9);} }
  .ic-corner { animation: corner-cycle 5s ease-in-out infinite; }
  .ic-noise { position:absolute; inset:0; border-radius:inherit; opacity:0.028; pointer-events:none; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); background-size:128px; }
  @keyframes scan { 0%{top:-4px;opacity:0.6;} 90%{opacity:0.6;} 100%{top:100%;opacity:0;} }
  .ic-scanline { position:absolute; left:0; right:0; height:1px; background:linear-gradient(to right,transparent,rgba(255,255,255,0.07),transparent); animation:scan 7s linear infinite; pointer-events:none; z-index:2; }
  .ic-grid { position:absolute; inset:0; border-radius:inherit; pointer-events:none; opacity:0.04; background-image:linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px); background-size:32px 32px; }
  @keyframes tag-blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .ic-blink { animation:tag-blink 1.2s step-end infinite; }
  .ic-wrapper { perspective: 900px; }
`

interface InteractiveCardProps {
  children?: ReactNode
  width?: number
  height?: number
  maxTilt?: number
}

const SPRING = { stiffness: 280, damping: 28, mass: 0.6 }

const GlareLayer = ({ glareX, glareY, glareOpacity }: { glareX: MotionValue<string>; glareY: MotionValue<string>; glareOpacity: MotionValue<number> }) => (
  <motion.div aria-hidden style={{
    position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 4,
    opacity: glareOpacity,
    background: useTransform(
      [glareX, glareY] as MotionValue[],
      ([x, y]: string[]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)`
    ),
  }}/>
)

const DefaultContent = () => (
  <div className="ic-root relative z-10 flex flex-col h-full p-6 select-none">
    <div className="flex items-start justify-between mb-6">
      <div>
        <p className="ic-mono text-[9px] tracking-[0.22em] text-emerald-400/70 uppercase mb-1">NEXUS · PROTOCOL</p>
        <h2 className="text-white text-[22px] font-bold leading-tight tracking-tight">Liquidity<br/>Command</h2>
      </div>
      <div className="relative w-10 h-10 mt-0.5">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 to-purple-500/30 blur-sm"/>
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-emerald-300/20 to-purple-400/20 border border-white/10"/>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 mb-5">
      {[{ label:'TVL',value:'$48.3M',color:'text-emerald-300'},{ label:'APY',value:'12.47%',color:'text-purple-300'},{ label:'VOL',value:'$3.82M',color:'text-emerald-300'},{ label:'TXS',value:'2,847',color:'text-purple-300'}].map(({ label, value, color }) => (
        <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2.5">
          <p className="ic-mono text-[8px] tracking-widest text-white/35 uppercase mb-0.5">{label}</p>
          <p className={`ic-mono text-[15px] font-medium ${color}`}>{value}</p>
        </div>
      ))}
    </div>
    <div className="mb-5">
      <div className="flex justify-between mb-1.5">
        <span className="ic-mono text-[8px] tracking-widest text-white/35 uppercase">Utilisation</span>
        <span className="ic-mono text-[9px] text-white/50">73.4%</span>
      </div>
      <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(to right,#34d399,#a855f7)', width: '73.4%' }}
          initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 0.9 }}
        />
      </div>
    </div>
    <div className="mt-auto flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
        <span className="ic-mono text-[8px] tracking-widest text-white/40 uppercase">Live<span className="ic-blink">_</span></span>
      </div>
      <span className="ic-mono text-[8px] text-white/25">v2.4.1 · MAINNET</span>
    </div>
  </div>
)

export const InteractiveCard = ({ children, width = 320, height = 420, maxTilt = 14 }: InteractiveCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const rawRotateX = useMotionValue(0)
  const rawRotateY = useMotionValue(0)
  const rotateX    = useSpring(rawRotateX, SPRING)
  const rotateY    = useSpring(rawRotateY, SPRING)

  const rawGlareX = useMotionValue('50%')
  const rawGlareY = useMotionValue('50%')
  const glareX    = useSpring(rawGlareX, { stiffness: 400, damping: 35 })
  const glareY    = useSpring(rawGlareY, { stiffness: 400, damping: 35 })

  const rawGlareOpacity = useMotionValue(0)
  const glareOpacity    = useSpring(rawGlareOpacity, { stiffness: 300, damping: 30 })

  const z     = useSpring(useMotionValue(0), SPRING)
  const scale = useSpring(isHovered ? 1.025 : 1, SPRING)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top  + rect.height / 2
    const nx = (e.clientX - cx) / (rect.width / 2)
    const ny = (e.clientY - cy) / (rect.height / 2)
    rawRotateY.set(nx * maxTilt)
    rawRotateX.set(-ny * maxTilt)
    rawGlareX.set(`${((e.clientX - rect.left) / rect.width) * 100}%`)
    rawGlareY.set(`${((e.clientY - rect.top) / rect.height) * 100}%`)
  }, [maxTilt, rawRotateX, rawRotateY, rawGlareX, rawGlareY])

  const handleMouseEnter = useCallback(() => { setIsHovered(true); rawGlareOpacity.set(1); z.set(30) }, [rawGlareOpacity, z])
  const handleMouseLeave = useCallback(() => { setIsHovered(false); rawRotateX.set(0); rawRotateY.set(0); rawGlareOpacity.set(0); z.set(0) }, [rawRotateX, rawRotateY, rawGlareOpacity, z])

  return (
    <>
      <style>{CARD_STYLES}</style>
      <div className="ic-wrapper inline-flex items-center justify-center" style={{ width, height }}>
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ width, height, rotateX, rotateY, scale, z, transformStyle: 'preserve-3d', borderRadius: 16, position: 'relative', cursor: 'pointer', background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid' }}
          className="ic-border-cycle"
          initial={{ opacity: 0, y: 24, rotateX: -6 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="ic-corner ic-corner-tl"/><div className="ic-corner ic-corner-tr"/>
          <div className="ic-corner ic-corner-bl"/><div className="ic-corner ic-corner-br"/>
          <div className="ic-grid"/><div className="ic-noise"/><div className="ic-scanline"/>
          <GlareLayer
            glareX={glareX as any}
            glareY={glareY as any}
            glareOpacity={glareOpacity as any}
          />
          {children ?? <DefaultContent/>}
        </motion.div>
      </div>
    </>
  )
}

export default InteractiveCard
