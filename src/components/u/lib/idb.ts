// idb.ts — IndexedDB wrapper for WalletRecord (wallet-v2).
// Single store: "wallet" keyed by WALLET_KEY = "wallet".
// Separate DB from vault/storage.ts (one-vault) — this uses "one-wallet".
// Implements the contract in interfaces/wallet/idb.d.ts.

import type { WalletRecord, Wrapping } from "../../../../interfaces/types-wallet"

// ===== CONFIG =====

export const WALLET_KEY = "wallet" as const

const IDB_DB_NAME = "one-wallet"
const IDB_DB_VERSION = 1
const IDB_STORE = "wallet"

// Single module-scoped promise — reused across calls.
let dbPromise: Promise<IDBDatabase> | null = null

// ===== OPEN / CLOSE =====

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable in this context"))
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    let req: IDBOpenDBRequest
    try {
      req = indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION)
    } catch (e) {
      reject(new Error(`Failed to open wallet db: ${String(e)}`))
      return
    }

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" })
      }
    }

    req.onsuccess = () => {
      const db = req.result
      db.onclose = () => { dbPromise = null }
      db.onversionchange = () => { db.close(); dbPromise = null }
      resolve(db)
    }

    req.onerror = () => {
      dbPromise = null
      reject(new Error(`Failed to open wallet db: ${req.error?.message ?? "unknown"}`))
    }

    req.onblocked = () => {
      dbPromise = null
      reject(new Error("Wallet db open blocked by another connection"))
    }
  }).catch((e) => {
    dbPromise = null
    throw e
  })

  return dbPromise
}

// ===== HELPERS =====

async function storeTx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openDb()
  return db.transaction(IDB_STORE, mode).objectStore(IDB_STORE)
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(new Error(r.error?.message ?? "IndexedDB request failed"))
  })
}

function txDone(t: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    t.oncomplete = () => resolve()
    t.onerror = () => reject(new Error(t.error?.message ?? "IndexedDB transaction failed"))
    t.onabort = () => reject(new Error(t.error?.message ?? "IndexedDB transaction aborted"))
  })
}

// Internal record shape: WalletRecord + stable "id" key for IDB keyPath.
type StoredRecord = WalletRecord & { id: typeof WALLET_KEY }

// ===== PUBLIC API =====

/** Get the current WalletRecord (returns null if not initialized). */
export async function getWallet(): Promise<WalletRecord | null> {
  const store = await storeTx("readonly")
  const result = await req<StoredRecord | undefined>(store.get(WALLET_KEY))
  if (!result) return null
  const { id: _id, ...record } = result
  return record as WalletRecord
}

/** Write a complete WalletRecord. */
export async function putWallet(record: WalletRecord): Promise<void> {
  const store = await storeTx("readwrite")
  const stored: StoredRecord = { id: WALLET_KEY, ...record }
  await req(store.put(stored))
  await txDone(store.transaction)
}

/** Add a wrapping to the existing record (add-only, never rewrites other fields). */
export async function addWrapping(wrapping: Wrapping): Promise<void> {
  const store = await storeTx("readwrite")
  const existing = await req<StoredRecord | undefined>(store.get(WALLET_KEY))
  if (!existing) throw new Error("No wallet record found — cannot add wrapping")
  const updated: StoredRecord = {
    ...existing,
    wrappings: [...existing.wrappings, wrapping],
  }
  await req(store.put(updated))
  await txDone(store.transaction)
}

/** Remove a wrapping by credId (for passkey revoke). */
export async function removeWrapping(credId: ArrayBuffer): Promise<void> {
  const store = await storeTx("readwrite")
  const existing = await req<StoredRecord | undefined>(store.get(WALLET_KEY))
  if (!existing) throw new Error("No wallet record found — cannot remove wrapping")
  const updated: StoredRecord = {
    ...existing,
    wrappings: existing.wrappings.filter((w) => {
      if (w.type !== "passkey-prf") return true
      return !buffersEqual(w.credId, credId)
    }),
  }
  await req(store.put(updated))
  await txDone(store.transaction)
}

/** Wipe the plaintextSeed field (called after State 2 seed export). */
export async function wipePlaintextSeed(): Promise<void> {
  const store = await storeTx("readwrite")
  const existing = await req<StoredRecord | undefined>(store.get(WALLET_KEY))
  if (!existing) throw new Error("No wallet record found — cannot wipe plaintextSeed")
  const updated: StoredRecord = { ...existing, plaintextSeed: null }
  await req(store.put(updated))
  await txDone(store.transaction)
}

/** Clear all wallet data (GDPR / "I want to start over"). */
export async function clearWallet(): Promise<void> {
  const store = await storeTx("readwrite")
  await req(store.clear())
  await txDone(store.transaction)
}

// ===== PRIVATE HELPERS =====

function buffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false
  const va = new Uint8Array(a)
  const vb = new Uint8Array(b)
  for (let i = 0; i < va.length; i++) {
    if (va[i] !== vb[i]) return false
  }
  return true
}
