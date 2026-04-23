/**
 * Resumable chat cursor — encode/decode/validate
 *
 * Format: `<sid>:<epochMs>:<seqNum>`
 * Supports 1-hour disconnect reattach, device-swap, stale rejection.
 */

export interface Cursor {
  sid: string
  epochMs: number
  seq: number
}

const CURSOR_RE = /^([^:]+):(\d+):(\d+)$/
const ONE_HOUR_MS = 3_600_000

export function encodeCursor(c: Cursor): string {
  return `${c.sid}:${c.epochMs}:${c.seq}`
}

export function decodeCursor(s: string): Cursor | null {
  const m = CURSOR_RE.exec(s)
  if (!m) return null
  const epochMs = Number(m[2])
  const seq = Number(m[3])
  if (!Number.isFinite(epochMs) || !Number.isFinite(seq)) return null
  return { sid: m[1], epochMs, seq }
}

export function nextCursor(prev: Cursor): Cursor {
  return { ...prev, epochMs: Date.now(), seq: prev.seq + 1 }
}

/**
 * Server-side staleness check.
 *
 * Returns true (reject with "cursor-stale") when:
 * - Same sid but incoming.seq < lastKnown.seq   (sequence went backwards)
 * - incoming.epochMs < lastKnown.epochMs - ONE_HOUR_MS  (> 1h gap, too stale)
 */
export function isCursorStale(incoming: Cursor, lastKnown: Cursor): boolean {
  if (incoming.sid === lastKnown.sid && incoming.seq < lastKnown.seq) {
    return true
  }
  if (incoming.epochMs < lastKnown.epochMs - ONE_HOUR_MS) {
    return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Browser-side IndexedDB persistence
// ---------------------------------------------------------------------------

const IDB_NAME = 'one-chat'
const IDB_STORE = 'cursors'
const IDB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function storeCursor(sid: string, cursor: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(cursor, sid)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadCursor(sid: string): Promise<string | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(sid)
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
}
