// vault/storage.ts — IndexedDB wrapper. 3 stores: meta (singleton), wallets (by-chain index), audit (by-at index, append-only).

import type { AuditEvent, VaultMeta, VaultWallet } from './types'
import { VaultError } from './types'

// ===== CONFIG =====
export const DB_NAME = 'one-vault'
export const DB_VERSION = 1

export const STORE_META = 'meta'
export const STORE_WALLETS = 'wallets'
export const STORE_AUDIT = 'audit'

const INDEX_WALLETS_BY_CHAIN = 'by-chain'
const INDEX_AUDIT_BY_AT = 'by-at'

// Single module-scoped promise — reused across calls so version upgrades
// don't fight each other and the same connection is shared app-wide.
let dbPromise: Promise<IDBDatabase> | null = null

// ===== AVAILABILITY =====
export function isStorageAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && typeof IDBKeyRange !== 'undefined'
  } catch {
    return false
  }
}

// ===== OPEN / CLOSE =====
export function openVaultDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  if (!isStorageAvailable()) {
    return Promise.reject(new VaultError('IndexedDB unavailable in this context', 'storage-error'))
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    let req: IDBOpenDBRequest
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION)
    } catch (e) {
      reject(new VaultError(`Failed to open vault db: ${String(e)}`, 'storage-error'))
      return
    }

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_WALLETS)) {
        const wallets = db.createObjectStore(STORE_WALLETS, { keyPath: 'id' })
        wallets.createIndex(INDEX_WALLETS_BY_CHAIN, 'chain', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_AUDIT)) {
        const audit = db.createObjectStore(STORE_AUDIT, { keyPath: 'id', autoIncrement: true })
        audit.createIndex(INDEX_AUDIT_BY_AT, 'at', { unique: false })
      }
    }

    req.onsuccess = () => {
      const db = req.result
      // If connection is closed externally, drop cache so next call re-opens.
      db.onclose = () => {
        if (dbPromise) dbPromise = null
      }
      db.onversionchange = () => {
        db.close()
        if (dbPromise) dbPromise = null
      }
      resolve(db)
    }

    req.onerror = () => {
      dbPromise = null
      reject(new VaultError(`Failed to open vault db: ${req.error?.message ?? 'unknown'}`, 'storage-error'))
    }

    req.onblocked = () => {
      dbPromise = null
      reject(new VaultError('Vault db open blocked by another connection', 'storage-error'))
    }
  }).catch((e) => {
    dbPromise = null
    throw e
  })

  return dbPromise
}

export function closeVaultDb(): void {
  const p = dbPromise
  dbPromise = null
  if (!p) return
  p.then((db) => {
    try {
      db.close()
    } catch {
      // ignore — already closed
    }
  }).catch(() => {
    // swallow — nothing to close
  })
}

export function deleteVaultDb(): Promise<void> {
  closeVaultDb()
  if (!isStorageAvailable()) {
    return Promise.reject(new VaultError('IndexedDB unavailable in this context', 'storage-error'))
  }
  return new Promise<void>((resolve, reject) => {
    let req: IDBOpenDBRequest
    try {
      req = indexedDB.deleteDatabase(DB_NAME)
    } catch (e) {
      reject(new VaultError(`Failed to delete vault db: ${String(e)}`, 'storage-error'))
      return
    }
    req.onsuccess = () => resolve()
    req.onerror = () => reject(new VaultError(`Failed to delete vault db: ${req.error?.message ?? 'unknown'}`, 'storage-error'))
    req.onblocked = () => reject(new VaultError('Vault db delete blocked by another connection', 'storage-error'))
  })
}

// ===== internal helpers =====
async function tx(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openVaultDb()
  try {
    return db.transaction(storeName, mode).objectStore(storeName)
  } catch (e) {
    throw new VaultError(`Failed to open transaction on ${storeName}: ${String(e)}`, 'storage-error')
  }
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(new VaultError(req.error?.message ?? 'IndexedDB request failed', 'storage-error'))
  })
}

function txDone(t: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    t.oncomplete = () => resolve()
    t.onerror = () => reject(new VaultError(t.error?.message ?? 'IndexedDB transaction failed', 'storage-error'))
    t.onabort = () => reject(new VaultError(t.error?.message ?? 'IndexedDB transaction aborted', 'storage-error'))
  })
}

// ===== META =====
export async function getMeta(): Promise<VaultMeta | null> {
  const store = await tx(STORE_META, 'readonly')
  const result = await request<VaultMeta | undefined>(store.get('singleton'))
  return result ?? null
}

export async function putMeta(meta: VaultMeta): Promise<void> {
  const store = await tx(STORE_META, 'readwrite')
  await request(store.put(meta))
  await txDone(store.transaction)
}

// ===== WALLETS =====
export async function getWallet(id: string): Promise<VaultWallet | null> {
  const store = await tx(STORE_WALLETS, 'readonly')
  const result = await request<VaultWallet | undefined>(store.get(id))
  return result ?? null
}

export async function listWallets(): Promise<VaultWallet[]> {
  const store = await tx(STORE_WALLETS, 'readonly')
  return request<VaultWallet[]>(store.getAll())
}

export async function listWalletsByChain(chain: string): Promise<VaultWallet[]> {
  const store = await tx(STORE_WALLETS, 'readonly')
  const index = store.index(INDEX_WALLETS_BY_CHAIN)
  return request<VaultWallet[]>(index.getAll(chain))
}

export async function putWallet(w: VaultWallet): Promise<void> {
  const store = await tx(STORE_WALLETS, 'readwrite')
  await request(store.put(w))
  await txDone(store.transaction)
}

export async function deleteWallet(id: string): Promise<void> {
  const store = await tx(STORE_WALLETS, 'readwrite')
  await request(store.delete(id))
  await txDone(store.transaction)
}

export async function clearWallets(): Promise<void> {
  const store = await tx(STORE_WALLETS, 'readwrite')
  await request(store.clear())
  await txDone(store.transaction)
}

// ===== AUDIT =====
export async function appendAudit(event: Omit<AuditEvent, 'id'>): Promise<number> {
  const store = await tx(STORE_AUDIT, 'readwrite')
  const record: Omit<AuditEvent, 'id'> = { ...event, at: event.at ?? Date.now() }
  const key = await request<IDBValidKey>(store.add(record as AuditEvent))
  await txDone(store.transaction)
  if (typeof key !== 'number') {
    throw new VaultError('Audit event returned non-numeric key', 'storage-error')
  }
  return key
}

export async function recentAudit(limit = 100): Promise<AuditEvent[]> {
  const store = await tx(STORE_AUDIT, 'readonly')
  const index = store.index(INDEX_AUDIT_BY_AT)
  const range = IDBKeyRange.upperBound(Date.now())
  const out: AuditEvent[] = []
  return new Promise<AuditEvent[]>((resolve, reject) => {
    const req = index.openCursor(range, 'prev')
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor || out.length >= limit) {
        resolve(out)
        return
      }
      out.push(cursor.value as AuditEvent)
      cursor.continue()
    }
    req.onerror = () => reject(new VaultError(req.error?.message ?? 'Audit cursor failed', 'storage-error'))
  })
}

export async function pruneAudit(olderThanMs: number): Promise<number> {
  const store = await tx(STORE_AUDIT, 'readwrite')
  const index = store.index(INDEX_AUDIT_BY_AT)
  const range = IDBKeyRange.upperBound(olderThanMs, true)
  let deleted = 0
  await new Promise<void>((resolve, reject) => {
    const req = index.openCursor(range)
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) {
        resolve()
        return
      }
      cursor.delete()
      deleted++
      cursor.continue()
    }
    req.onerror = () => reject(new VaultError(req.error?.message ?? 'Audit prune cursor failed', 'storage-error'))
  })
  await txDone(store.transaction)
  return deleted
}
