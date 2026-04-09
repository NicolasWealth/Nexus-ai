import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getDatabase,
  ref,
  push,
  query,
  orderByChild,
  limitToLast,
  onChildAdded,
  off,
  serverTimestamp,
  type DataSnapshot,
} from 'firebase/database'
import { app } from '../services/firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RouteHop {
  chain: string
  protocol: string
  fee: number
  speed: string
}

export interface BestPath {
  id: string
  hash: string
  from: string
  to: string
  route: RouteHop[]
  totalFee: number
  savings: number
  status: 'confirmed' | 'pending' | 'failed'
  type: 'swap' | 'transfer' | 'stake' | 'bridge'
  createdAt?: number | object
}

/** Raw shape stored in /global_stream — id is the Firebase push key. */
interface StreamRecord extends Omit<BestPath, 'id'> {
  createdAt: number | object
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GLOBAL_STREAM_PATH = 'global_stream'
const MAX_TRANSACTIONS   = 10
const AGENT_INTERVAL_MS  = 5_000

const CHAINS    = ['Hedera', 'Solana', 'Ethereum L2', 'Polygon', 'Arbitrum', 'Optimism']
const PROTOCOLS = ['Uniswap V4', 'Curve Finance', 'Balancer', 'AAVE', 'deBridge', 'Stargate']
const TYPES: BestPath['type'][] = ['swap', 'transfer', 'stake', 'bridge']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hex   = () => Math.random().toString(16).slice(2, 10).toUpperCase()
const addr  = () => `0x${hex().slice(0, 6)}...${hex().slice(0, 4)}`
const pick  = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const rnd   = (min: number, max: number) => Math.random() * (max - min) + min

/** Build a simulated agent path — no Firebase dependency. */
const buildPath = (): Omit<BestPath, 'id'> => {
  const hopCount    = Math.floor(rnd(2, 5))
  const chainSample = [...CHAINS].sort(() => 0.5 - Math.random()).slice(0, hopCount)

  const route: RouteHop[] = chainSample.map(chain => ({
    chain,
    protocol: pick(PROTOCOLS),
    fee:      parseFloat(rnd(0.0001, 0.05).toFixed(4)),
    speed:    `${Math.floor(rnd(80, 400))}ms`,
  }))

  const totalFee = parseFloat(route.reduce((s, h) => s + h.fee, 0).toFixed(4))
  const savings  = Math.floor(rnd(8, 52))

  return {
    hash:      `0x${hex()}${hex().slice(0, 4)}`,
    from:      addr(),
    to:        addr(),
    route,
    totalFee,
    savings,
    status:    'confirmed',
    type:      pick(TYPES),
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseLiquidityAgentReturn {
  /** The most recently computed optimal path. */
  bestPath:   BestPath | null
  /** Last 10 transactions from Firebase /global_stream, newest first. */
  transactions: BestPath[]
  /** Increments whenever a new transaction arrives from Firebase.
   *  Bind this as a React key on any element to trigger a re-mount glitch. */
  glitchKey:  number
  /** Whether the Firebase listener is connected. */
  connected:  boolean
}

export const useLiquidityAgent = (): UseLiquidityAgentReturn => {
  const [bestPath,      setBestPath]      = useState<BestPath | null>(null)
  const [transactions,  setTransactions]  = useState<BestPath[]>([])
  const [glitchKey,     setGlitchKey]     = useState(0)
  const [connected,     setConnected]     = useState(false)

  // Track IDs already in state to prevent duplicates on re-mount
  const seenIds = useRef<Set<string>>(new Set())
  // Skip echoing back transactions that this tab just wrote
  const localIds = useRef<Set<string>>(new Set())

  // ── Firebase stream reference ──────────────────────────────────────────────
  const db = app ? getDatabase(app) : null

  // ── Real-time listener ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!db) {
      if (connected) setConnected(false)
      return
    }

    // Query: ordered by createdAt, newest 10 only
    const streamRef = query(
      ref(db, GLOBAL_STREAM_PATH),
      orderByChild('createdAt'),
      limitToLast(MAX_TRANSACTIONS),
    )

    const handleChildAdded = (snap: DataSnapshot) => {
      const key = snap.key
      if (!key) return
      if (seenIds.current.has(key)) return

      seenIds.current.add(key)
      setConnected(true)

      const record = snap.val() as StreamRecord
      const path: BestPath = { ...record, id: key }

      setTransactions(prev => {
        // Prepend newest, cap at MAX_TRANSACTIONS, newest first
        const updated = [path, ...prev].slice(0, MAX_TRANSACTIONS)
        return updated
      })

      // Only fire the glitch animation for transactions from OTHER clients.
      // Transactions written by THIS tab are in localIds.
      if (!localIds.current.has(key)) {
        setGlitchKey(k => k + 1)
      } else {
        localIds.current.delete(key)
      }
    }

    onChildAdded(streamRef, handleChildAdded)

    return () => {
      off(streamRef, 'child_added', handleChildAdded)
    }
  }, [db])

  // ── Agent loop: generate path → write to Firebase ─────────────────────────
  const runAgent = useCallback(async () => {
    const pathData = buildPath()

    if (!db) {
      // Simulation mode: work entirely in local state
      const localPath: BestPath = { ...pathData, id: crypto.randomUUID() }
      setBestPath(localPath)
      setTransactions(prev => [localPath, ...prev].slice(0, MAX_TRANSACTIONS))
      setGlitchKey(k => k + 1)
      return
    }

    const record: StreamRecord = {
      ...pathData,
      createdAt: serverTimestamp(),
    }

    try {
      const newRef = await push(ref(db, GLOBAL_STREAM_PATH), record)
      const key    = newRef.key

      if (!key) return

      // Mark as local so the listener skips the glitch for this tab's own write
      localIds.current.add(key)

      const localPath: BestPath = { ...pathData, id: key }
      setBestPath(localPath)
      // The listener will add it to `transactions` — no double-add needed
    } catch (err) {
      console.error('[useLiquidityAgent] Failed to write to Firebase:', err)

      // Fallback: keep UI alive even if write fails
      const fallbackPath: BestPath = { ...pathData, id: crypto.randomUUID() }
      setBestPath(fallbackPath)
      setTransactions(prev => [fallbackPath, ...prev].slice(0, MAX_TRANSACTIONS))
      setGlitchKey(k => k + 1)
    }
  }, [db])

  useEffect(() => {
    const startAgent = () => runAgent()
    startAgent()
    const interval = setInterval(runAgent, AGENT_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [runAgent])

  return { bestPath, transactions, glitchKey, connected }
}
