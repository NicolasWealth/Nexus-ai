import { initializeApp, getApps, getApp } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  off,
  serverTimestamp,
} from 'firebase/database'
import type { DatabaseReference, DataSnapshot, Database } from 'firebase/database'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k)

let app: FirebaseApp | null = null
let db: Database | null = null

if (missing.length === 0) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    db = getDatabase(app)
  } catch (err) {
    console.error('[firebase] Init failed:', err)
  }
} else {
  console.warn(`[firebase] Simulation mode. Missing: ${missing.join(', ')}`)
}

export interface RouteHop {
  protocol: string
  poolAddress: string
  tokenIn: string
  tokenOut: string
  fee: number
}

export interface TransactionRecord {
  id?: string
  txHash: string
  walletAddress: string
  amountIn: string
  amountOut: string
  tokenIn: string
  tokenOut: string
  route: RouteHop[]
  aiScore: number
  gasCostUsd: number
  slippageTolerance: number
  status: 'pending' | 'confirmed' | 'failed'
  createdAt: number | object
}

export type TransactionCallback = (tx: TransactionRecord) => void
export type Unsubscribe = () => void

const txRef = (): DatabaseReference | null => {
  if (!db) return null
  return ref(db, 'transactions')
}

export async function saveTransaction(
  payload: Omit<TransactionRecord, 'id' | 'createdAt'>
): Promise<string | null> {
  if (!db) {
    return 'sim-' + Math.random().toString(36).slice(2, 9)
  }
  const record = { ...payload, createdAt: serverTimestamp() }
  const listRef = txRef()
  if (!listRef) throw new Error('DB not initialized')
  const newRef = await push(listRef, record)
  return newRef.key
}

export function subscribeToTransactions(callback: TransactionCallback): Unsubscribe {
  const listRef = txRef()
  if (!listRef) return () => {}

  const handler = (snapshot: DataSnapshot): void => {
    if (!snapshot.exists()) return
    const tx = snapshot.val() as Omit<TransactionRecord, 'id'> & { createdAt: number }
    callback({ ...tx, id: snapshot.key ?? undefined })
  }

  onChildAdded(listRef, handler)
  return () => off(listRef, 'child_added', handler)
}

export { app, db }
