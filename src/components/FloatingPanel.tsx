import {
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FloatingPanelProps {
  children: ReactNode

  /** Max tilt angle in degrees on each axis. Default: 10 */
  maxTilt?: number

  /** Float travel distance in px (panel drifts ±this value). Default: 10 */
  floatRange?: number

  /** Float cycle duration in seconds. Default: 4 */
  floatDuration?: number

  /** Backdrop blur in px. Default: 20 */
  blur?: number

  /** Border opacity 0–1. Default: 0.1 */
  borderOpacity?: number

  /** Background fill opacity 0–1. Default: 0.08 */
  bgOpacity?: number

  /** Spring stiffness for the tilt response. Default: 160 */
  stiffness?: number

  /** Spring damping for the tilt response. Default: 20 */
  damping?: number

  /** Extra class names applied to the outer wrapper */
  className?: string

  /** Inline styles applied to the outer wrapper */
  style?: CSSProperties
}

// ─── Spring config ────────────────────────────────────────────────────────────

const makeSpring = (stiffness: number, damping: number) => ({
  stiffness,
  damping,
  mass: 0.8,
})

// ─── Component ────────────────────────────────────────────────────────────────

export function FloatingPanel({
  children,
  maxTilt       = 10,
  floatRange    = 10,
  floatDuration = 4,
  blur          = 20,
  borderOpacity = 0.1,
  bgOpacity     = 0.08,
  stiffness     = 160,
  damping       = 20,
  className     = '',
  style,
}: FloatingPanelProps) {

  const panelRef = useRef<HTMLDivElement>(null)

  // Raw motion values track the normalised cursor position (-1 … +1)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  // Springs smooth the raw values so the tilt eases in and snaps back
  const springConfig = makeSpring(stiffness, damping)
  const springX = useSpring(rawX, springConfig)
  const springY = useSpring(rawY, springConfig)

  // Map the smoothed -1…+1 range to the desired degree range
  const rotateY = useTransform(springX, [-1, 1], [-maxTilt, maxTilt])
  const rotateX = useTransform(springY, [-1, 1], [maxTilt, -maxTilt])

  // Glare position follows the cursor as a percentage of panel dimensions
  const glareX = useTransform(springX, [-1, 1], ['0%', '100%'])
  const glareY = useTransform(springY, [-1, 1], ['0%', '100%'])

  // ── Mouse handlers ──────────────────────────────────────────────────────────

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const panel = panelRef.current
      if (!panel) return

      const rect   = panel.getBoundingClientRect()
      const cx     = rect.left + rect.width  / 2
      const cy     = rect.top  + rect.height / 2

      // Normalise: 0 at centre, ±1 at edges
      rawX.set((e.clientX - cx) / (rect.width  / 2))
      rawY.set((e.clientY - cy) / (rect.height / 2))
    },
    [rawX, rawY]
  )

  const handleMouseLeave = useCallback(() => {
    // Snap back to flat on leave
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  // ── Derived CSS values ──────────────────────────────────────────────────────

  const glassBackground = `rgba(255, 255, 255, ${bgOpacity})`
  const glassBorder     = `1px solid rgba(255, 255, 255, ${borderOpacity})`
  const glassBlur       = `blur(${blur}px)`

  return (
    // Outer wrapper — owns the float animation and preserves 3D for children
    <motion.div
      className={className}
      style={{
        display:       'inline-block',
        perspective:   '1200px',
        transformStyle: 'preserve-3d',
        ...style,
      }}
      // Float animation: drifts the whole assembly up and down
      animate={{ y: [0, -floatRange, 0] }}
      transition={{
        duration: floatDuration,
        repeat:   Infinity,
        ease:     'easeInOut',
      }}
    >
      {/* Inner panel — owns the 3D tilt and glassmorphic surface */}
      <motion.div
        ref={panelRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',

          // Glassmorphic surface
          background:    glassBackground,
          backdropFilter: glassBlur,
          WebkitBackdropFilter: glassBlur,
          border:        glassBorder,
          borderRadius:  '16px',

          // Layer the glare on top of content via a pseudo-positioned child
          position: 'relative',
          overflow: 'hidden',

          // Smooth enter
          willChange: 'transform',
        }}
      >
        {/* Glare highlight — a radial gradient that tracks the cursor */}
        <motion.div
          aria-hidden
          style={{
            position:      'absolute',
            inset:         0,
            borderRadius:  'inherit',
            pointerEvents: 'none',
            zIndex:        1,
            background:    useTransform(
              [glareX, glareY],
              ([x, y]: string[]) =>
                `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.12) 0%, transparent 65%)`
            ),
          }}
        />

        {/* Edge rim light — a thin inset shadow that shifts with tilt */}
        <motion.div
          aria-hidden
          style={{
            position:      'absolute',
            inset:         0,
            borderRadius:  'inherit',
            pointerEvents: 'none',
            zIndex:        2,
            boxShadow:     useTransform(
              [springX, springY],
              ([x, y]: number[]) => [
                `inset ${x * -6}px ${y * -6}px 18px rgba(255,255,255,0.04)`,
                `${x * 8}px ${y * 8}px 32px rgba(0,0,0,0.25)`,
                `0 16px 48px rgba(0,0,0,0.18)`,
              ].join(', ')
            ),
          }}
        />

        {/* Consumer content — sits above the glare and rim layers */}
        <div style={{ position: 'relative', zIndex: 3 }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default FloatingPanel
