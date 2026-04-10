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

interface StreamRecord extends Omit<BestPath, 'id'> {
  createdAt: number | object
}

const GLOBAL_STREAM_PATH = 'global_stream'
const MAX_TRANSACTIONS   = 10
const AGENT_INTERVAL_MS  = 5_000

const CHAINS    = ['Hedera', 'Solana', 'Ethereum L2', 'Polygon', 'Arbitrum', 'Optimism']
const PROTOCOLS = ['Uniswap V4', 'Curve Finance', 'Balancer', 'AAVE', 'deBridge', 'Stargate']
const TYPES: BestPath['type'][] = ['swap', 'transfer', 'stake', 'bridge']

const hex  = () => Math.random().toString(16).slice(2, 10).toUpperCase()
const addr = () => `0x${hex().slice(0, 6)}...${hex().slice(0, 4)}`
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const rnd  = (min: number, max: number) => Math.random() * (max - min) + min

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
    hash:   `0x${hex()}${hex().slice(0, 4)}`,
    from:   addr(),
    to:     addr(),
    route,
    totalFee,
    savings,
    status: 'confirmed',
    type:   pick(TYPES),
  }
}

interface UseLiquidityAgentReturn {
  bestPath:     BestPath | null
  transactions: BestPath[]
  glitchKey:    number
  connected:    boolean
}

export const useLiquidityAgent = (): UseLiquidityAgentReturn => {
  const [bestPath,     setBestPath]     = useState<BestPath | null>(null)
  const [transactions, setTransactions] = useState<BestPath[]>([])
  const [glitchKey,    setGlitchKey]    = useState(0)
  const [connected,    setConnected]    = useState(false)

  const seenIds  = useRef<Set<string>>(new Set())
  const localIds = useRef<Set<string>>(new Set())

  const db = app ? getDatabase(app) : null

  useEffect(() => {
    if (!db) return

    const streamRef = query(
      ref(db, GLOBAL_STREAM_PATH),
      orderByChild('createdAt'),
      limitToLast(MAX_TRANSACTIONS),
    )

    const handleChildAdded = (snap: DataSnapshot) => {
      const key = snap.key
      if (!key || seenIds.current.has(key)) return
      seenIds.current.add(key)
      setConnected(true)

      const record = snap.val() as StreamRecord
      const path: BestPath = { ...record, id: key }

      setTransactions(prev => [path, ...prev].slice(0, MAX_TRANSACTIONS))

      if (!localIds.current.has(key)) {
        setGlitchKey(k => k + 1)
      } else {
        localIds.current.delete(key)
      }
    }

    onChildAdded(streamRef, handleChildAdded)
    return () => { off(streamRef, 'child_added', handleChildAdded) }
  }, [db])

  const runAgent = useCallback(async () => {
    const pathData = buildPath()

    if (!db) {
      const localPath: BestPath = { ...pathData, id: crypto.randomUUID() }
      setBestPath(localPath)
      setTransactions(prev => [localPath, ...prev].slice(0, MAX_TRANSACTIONS))
      setGlitchKey(k => k + 1)
      return
    }

    const record: StreamRecord = { ...pathData, createdAt: serverTimestamp() }
    try {
      const newRef = await push(ref(db, GLOBAL_STREAM_PATH), record)
      const key    = newRef.key
      if (!key) return
      localIds.current.add(key)
      const localPath: BestPath = { ...pathData, id: key }
      setBestPath(localPath)
    } catch (err) {
      console.error('[useLiquidityAgent] Firebase write failed:', err)
      const fallbackPath: BestPath = { ...pathData, id: crypto.randomUUID() }
      setBestPath(fallbackPath)
      setTransactions(prev => [fallbackPath, ...prev].slice(0, MAX_TRANSACTIONS))
      setGlitchKey(k => k + 1)
    }
  }, [db])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runAgent()
    const id = setInterval(runAgent, AGENT_INTERVAL_MS)
    return () => clearInterval(id)
  }, [runAgent])

  return { bestPath, transactions, glitchKey, connected }
}
