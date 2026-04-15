/**
 * ADL cache — single source of truth for permission caches + invalidation.
 *
 * Owned by the engine layer so `syncAdl` can flush the signal + bridge
 * caches atomically without reverse-importing from `src/pages/api/**`
 * (Astro routes must not appear in engine import graphs).
 *
 * Re-exports the exact shapes that `src/pages/api/signal.ts` and
 * `src/engine/bridge.ts` already use, so the refactor is drop-in.
 */

export const CACHE_TTL = 300_000 // 5 minutes

// ── Signal-gate cache: lifecycle / network / sensitivity ───────────────────

export interface CacheEntry {
  adlStatus?: string
  permNetwork?: { allowed_hosts?: string[]; allowedHosts?: string[] }
  senderSensitivity?: string
  receiverSensitivity?: string
  timestamp: number
}

export const PERM_CACHE = new Map<string, CacheEntry>()

export function getCached(key: string): CacheEntry | undefined {
  const entry = PERM_CACHE.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    PERM_CACHE.delete(key)
    return undefined
  }
  return entry
}

export function setCached(key: string, value: Partial<CacheEntry>): void {
  PERM_CACHE.set(key, { ...value, timestamp: Date.now() })
}

/**
 * Drop every signal-gate cache key for this uid.
 * Extended from Cycle 1 (which only flushed :status + :network) to also
 * clear the sensitivity keys — that was a latent staleness bug.
 */
export function invalidatePermCache(uid: string): void {
  PERM_CACHE.delete(`${uid}:status`)
  PERM_CACHE.delete(`${uid}:network`)
  PERM_CACHE.delete(`${uid}:sensitivity`)
}

// ── Bridge-gate cache: Sui perm-network ───────────────────────────────────

export interface BridgeCacheEntry {
  allowedHosts: string[]
  expires: number
}

export const BRIDGE_PERM_CACHE = new Map<string, BridgeCacheEntry>()
export const BRIDGE_CACHE_TTL = 5 * 60 * 1000

export function invalidateBridgeCache(uid: string): void {
  BRIDGE_PERM_CACHE.delete(`${uid}:network`)
}

// ── Cross-module invalidation (the Cycle 1.5 contract) ────────────────────

/**
 * Flush every cache that references this uid across every gate.
 * Called by every ADL write path (`syncAdl`, markdown re-parse,
 * evolution loop rewrite). Closes the 5-minute staleness window.
 */
export function invalidateAdlCache(uid: string): void {
  invalidatePermCache(uid)
  invalidateBridgeCache(uid)
}

// ── Enforcement mode (kill-switch) ────────────────────────────────────────

export type EnforcementMode = 'audit' | 'enforce'

/**
 * `enforce` (default): gates block denied signals with 4xx.
 * `audit`: gates log denials via `audit()` and allow the request through.
 * Flip via env: `ADL_ENFORCEMENT_MODE=audit`.
 */
export function enforcementMode(): EnforcementMode {
  const envProc = typeof process !== 'undefined' ? process.env?.ADL_ENFORCEMENT_MODE : undefined
  const envMeta =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string> }).env?.ADL_ENFORCEMENT_MODE
      : undefined
  const mode = envProc || envMeta || 'enforce'
  return mode === 'audit' ? 'audit' : 'enforce'
}

// ── Audit sink (structured log → D1 adl_audit table via follow-up) ────────

export type AuditGate = 'lifecycle' | 'network' | 'sensitivity' | 'bridge-network' | 'bridge-error'

export type AuditDecision = 'deny' | 'allow-audit' | 'fail-closed' | 'observe'

export interface AuditRecord {
  sender: string
  receiver: string
  gate: AuditGate
  decision: AuditDecision
  mode: EnforcementMode
  reason?: string
}

/**
 * Best-effort structured log. Never throws — audit failures must never
 * block the caller. Today: console.warn with a `[adl-audit]` prefix so
 * CF worker logs can be ingested. D1 write into the `adl_audit` table
 * (migration 0011) will be wired when `/see denials` lands in Cycle 3.
 */
export function audit(rec: AuditRecord): void {
  try {
    console.warn(`[adl-audit] ${JSON.stringify({ ts: new Date().toISOString(), ...rec })}`)
  } catch {
    /* silent — audit must never fail a request */
  }
}
