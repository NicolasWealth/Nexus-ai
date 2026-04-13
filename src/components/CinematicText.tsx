import { useEffect, useRef, useState } from 'react'
import styles from './CinematicText.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatItem {
  value: string
  unit?: string
  label: string
  live?: boolean
  accent?: boolean
}

interface DataItem {
  key: string
  value: string
  variant?: 'default' | 'highlight' | 'danger'
}

interface TickerItem {
  text: string
}

interface CinematicTextProps {
  /** Primary hero title — renders enormous with glitch + scanline + RGB split */
  title?: string
  /** Tagline beneath the title */
  subtitle?: string
  /** Up to 4 massive stat numbers */
  stats?: StatItem[]
  /** Monospace secondary data rows */
  data?: DataItem[]
  /** Scrolling ticker items */
  ticker?: TickerItem[]
  /** Show the system status line */
  showSystemLine?: boolean
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_STATS: StatItem[] = [
  { value: '51',   unit: '%',  label: 'Fee Savings',   live: true,  accent: true  },
  { value: '0.04', unit: '%',  label: 'Slippage',      live: true,  accent: false },
  { value: '11',   unit: 'ms', label: 'Latency',       live: false, accent: false },
  { value: '2.8',  unit: 'M',  label: 'Daily Volume',  live: true,  accent: false },
]

const DEFAULT_DATA: DataItem[] = [
  { key: 'Protocol',  value: 'UNISWAP V4',       variant: 'default'   },
  { key: 'Oracle',    value: 'CHAINLINK LIVE',    variant: 'highlight' },
  { key: 'Network',   value: 'POLYGON ZKEVM',     variant: 'default'   },
  { key: 'Status',    value: 'CONFIRMED',         variant: 'highlight' },
  { key: 'Gas',       value: '0.0031 USD',        variant: 'default'   },
  { key: 'MEV Risk',  value: 'NONE DETECTED',     variant: 'default'   },
]

const DEFAULT_TICKER: TickerItem[] = [
  { text: 'NEXUS AI · AUTONOMOUS PATHFINDING' },
  { text: 'CROSS-CHAIN LIQUIDITY OPTIMIZED'   },
  { text: 'HEDERA · POLYGON · ARBITRUM'       },
  { text: 'ZK VERIFIED · PRIVACY SHIELD ACTIVE' },
  { text: 'SLIPPAGE MINIMIZED · FEES CRUSHED' },
  { text: 'AGENT v4.1 · ONLINE'               },
]

// ─── Animated Number Hook ─────────────────────────────────────────────────────
// Counts up from 0 to the target value when the element enters the viewport.

function useCountUp(target: string, duration = 1400) {
  const [display, setDisplay] = useState('0')
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const num = parseFloat(target)
    if (isNaN(num)) { setDisplay(target); return }

    const isDecimal = target.includes('.')
    const decimals  = isDecimal ? (target.split('.')[1]?.length ?? 1) : 0

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        let start: number | null = null
        const step = (ts: number) => {
          if (!start) start = ts
          const progress = Math.min((ts - start) / duration, 1)
          const eased    = 1 - Math.pow(1 - progress, 3)
          const current  = num * eased
          setDisplay(current.toFixed(decimals))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { display, ref }
}

// ─── StatCell ─────────────────────────────────────────────────────────────────

function StatCell({ value, unit, label, live = false, accent = false }: StatItem) {
  const { display, ref } = useCountUp(value)
  const valueClass = accent ? styles.statValueAccent : styles.statValue

  return (
    <div className={`${styles.statCell} ${styles.bracketWrap}`}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.15rem' }}>
        <span ref={ref} className={valueClass}>{display}</span>
        {unit && <span className={styles.statUnit}>{unit}</span>}
      </div>
      <span className={styles.statLabel}>{label}</span>
      {live && <span className={styles.statLive}>LIVE</span>}
    </div>
  )
}

// ─── DataBand ─────────────────────────────────────────────────────────────────

function DataBand({ items }: { items: DataItem[] }) {
  const variantClass = (v: DataItem['variant']) => {
    if (v === 'highlight') return styles.dataValHighlight
    if (v === 'danger')    return styles.dataValDanger
    return styles.dataVal
  }

  return (
    <div className={styles.dataBand}>
      {items.map(({ key, value, variant }) => (
        <div key={key} className={styles.dataRow}>
          <span className={styles.dataKey}>{key}</span>
          <span className={variantClass(variant)}>{value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Ticker ───────────────────────────────────────────────────────────────────

function Ticker({ items }: { items: TickerItem[] }) {
  // Duplicate the list so the animation loops invisibly
  const doubled = [...items, ...items]

  return (
    <div className={styles.ticker}>
      <div className={styles.tickerTrack}>
        {doubled.map((item, i) => (
          <span key={i} className={styles.tickerItem}>{item.text}</span>
        ))}
      </div>
    </div>
  )
}

// ─── SystemLine ───────────────────────────────────────────────────────────────

function SystemLine() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.systemLine}>
      {[
        { label: 'CHAIN',   value: 'ETHEREUM'      },
        { label: 'NET',     value: 'MAINNET'        },
        { label: 'NODES',   value: '2,847 ACTIVE'   },
        { label: 'CLOCK',   value: time             },
      ].map(({ label, value }) => (
        <div key={label} className={styles.systemLineItem}>
          {label} <span>{value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── CinematicText ────────────────────────────────────────────────────────────

export function CinematicText({
  title          = 'NEXUS AI',
  subtitle       = 'Autonomous Cross-Chain Liquidity Optimization Engine',
  stats          = DEFAULT_STATS,
  data           = DEFAULT_DATA,
  ticker         = DEFAULT_TICKER,
  showSystemLine = true,
}: CinematicTextProps) {
  return (
    <div className={styles.root}>

      {/* ── Hero title with glitch + scanline overlay ─────────────────── */}
      <div className={styles.titleWrapper}>
        {/* data-text drives the ::before / ::after pseudo-element content */}
        <h1 className={styles.title} data-text={title}>{title}</h1>

        {/* Scanline layer sits over the title as a sibling — keeps the
            ::before / ::after slots free for the glitch channel splits */}
        <div className={styles.scanlineLayer}>
          <div className={styles.scanlineBeam} />
        </div>
      </div>

      {/* ── Subtitle ──────────────────────────────────────────────────── */}
      {subtitle && (
        <p className={styles.subtitle}>{subtitle}</p>
      )}

      {/* ── Massive stats row ─────────────────────────────────────────── */}
      {stats.length > 0 && (
        <div className={styles.statsRow}>
          {stats.map((stat) => (
            <StatCell key={stat.label} {...stat} />
          ))}
        </div>
      )}

      {/* ── Secondary monospace data band ─────────────────────────────── */}
      {data.length > 0 && <DataBand items={data} />}

      {/* ── System status line ────────────────────────────────────────── */}
      {showSystemLine && <SystemLine />}

      {/* ── Ticker marquee ────────────────────────────────────────────── */}
      {ticker.length > 0 && <Ticker items={ticker} />}

    </div>
  )
}

export default CinematicText
