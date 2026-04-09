import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  off,
  serverTimestamp,
} from 'firebase/database';
import type {
  DatabaseReference,
  DataSnapshot,
  Database
} from 'firebase/database';

// ─── Config ───────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check for missing keys but don't throw, just warn.
const REQUIRED_KEYS = Object.keys(firebaseConfig) as (keyof typeof firebaseConfig)[];
const missing = REQUIRED_KEYS.filter((k) => !firebaseConfig[k]);

let app: FirebaseApp | null = null;
let db: Database | null = null;

if (missing.length === 0) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (err) {
    console.error('[firebase] Initialization failed:', err);
  }
} else {
  console.warn(
    `[firebase] Missing environment variables. Simulation mode enabled. Missing: ${missing.map((k) => `VITE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`).join(', ')}`
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single hop inside an AI-optimized route. */
export interface RouteHop {
  protocol: string;       // e.g. "Uniswap V4", "Curve"
  poolAddress: string;    // checksummed ERC-20 pool address
  tokenIn: string;        // token symbol or address
  tokenOut: string;       // token symbol or address
  fee: number;            // basis points, e.g. 30 = 0.3 %
}

/** Payload written to and read from /transactions. */
export interface TransactionRecord {
  id?: string;             // assigned by Firebase after push
  txHash: string;          // on-chain transaction hash
  walletAddress: string;   // sender wallet (checksummed)
  amountIn: string;        // raw string to preserve precision
  amountOut: string;
  tokenIn: string;
  tokenOut: string;
  route: RouteHop[];
  aiScore: number;         // optimizer confidence score 0–1
  gasCostUsd: number;
  slippageTolerance: number; // e.g. 0.005 = 0.5 %
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: number | object; // unix ms or serverTimestamp sentinel
}

/** Callback signature used by subscribeToTransactions. */
export type TransactionCallback = (tx: TransactionRecord) => void;

/** Return value of subscribeToTransactions — call it to stop listening. */
export type Unsubscribe = () => void;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a typed DatabaseReference for the transactions collection. */
const txRef = (): DatabaseReference | null => {
  if (!db) return null;
  return ref(db, 'transactions');
};

// ─── saveTransaction ──────────────────────────────────────────────────────────

/**
 * Pushes one AI-optimized route record to /transactions.
 */
export async function saveTransaction(
  payload: Omit<TransactionRecord, 'id' | 'createdAt'>
): Promise<string | null> {
  if (!db) {
    console.debug('[firebase] Simulation mode: Record not saved to database.');
    return 'sim-id-' + Math.random().toString(36).slice(2, 9);
  }

  const record: Omit<TransactionRecord, 'id'> = {
    ...payload,
    createdAt: serverTimestamp(),
  };

  try {
    const listRef = txRef();
    if (!listRef) throw new Error('Database not initialized');
    
    const newRef = await push(listRef, record);
    if (!newRef.key) {
      throw new Error('Firebase push succeeded but returned no key.');
    }
    return newRef.key;
  } catch (err) {
    throw new Error(
      `[firebase.saveTransaction] Failed to write record: ${(err as Error).message}`
    );
  }
}

// ─── subscribeToTransactions ──────────────────────────────────────────────────

/**
 * Attaches a listener to /transactions.
 */
export function subscribeToTransactions(
  callback: TransactionCallback
): Unsubscribe {
  const listRef = txRef();
  if (!listRef) {
    console.debug('[firebase] Simulation mode: subscription ignored.');
    return () => {};
  }

  const handler = (snapshot: DataSnapshot): void => {
    if (!snapshot.exists()) return;

    // When reading from DB, createdAt is guaranteed to be a number (serverTimestamp is resolved).
    const tx = snapshot.val() as Omit<TransactionRecord, 'id'> & { createdAt: number };
    callback({ ...tx, id: snapshot.key ?? undefined });
  };

  onChildAdded(listRef, handler);

  return () => off(listRef, 'child_added', handler);
}

// ─── Named exports ────────────────────────────────────────────────────────────
export { app, db };
