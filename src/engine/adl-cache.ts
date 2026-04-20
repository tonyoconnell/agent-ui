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

// ── LLM-gate cache: perm-env access list ──────────────────────────────────

export interface LlmCacheEntry {
  access: string[]
  expires: number
}

export const LLM_ENV_CACHE = new Map<string, LlmCacheEntry>()
export const LLM_ENV_TTL = 5 * 60 * 1000

export function invalidateLlmCache(uid: string): void {
  LLM_ENV_CACHE.delete(`${uid}:env`)
}

// ── API-gate cache: perm-network allowed hosts (keyed per-hostname) ───────

export interface ApiCacheEntry {
  allowedHosts: string[]
  expires: number
}

export const API_PERM_CACHE = new Map<string, ApiCacheEntry>()
export const API_PERM_TTL = 5 * 60 * 1000

/**
 * API cache keys are `${uid}:${hostname}`, so flush every entry whose
 * key starts with this uid.
 */
export function invalidateApiCache(uid: string): void {
  const prefix = `${uid}:`
  for (const key of API_PERM_CACHE.keys()) {
    if (key.startsWith(prefix)) API_PERM_CACHE.delete(key)
  }
}

// ── Schema-gate cache: skill input-schema (keyed per-skill) ───────────────

export interface SchemaCacheEntry {
  schema: Record<string, unknown> | null
  expires: number
}

export const SKILL_SCHEMA_CACHE = new Map<string, SchemaCacheEntry>()
export const SKILL_SCHEMA_TTL = 5 * 60 * 1000

/**
 * Schema cache keys are `${uid}:${skill}`, so flush every entry whose
 * key starts with this uid.
 */
export function invalidateSchemaCache(uid: string): void {
  const prefix = `${uid}:`
  for (const key of SKILL_SCHEMA_CACHE.keys()) {
    if (key.startsWith(prefix)) SKILL_SCHEMA_CACHE.delete(key)
  }
}

// ── Cross-module invalidation (the Cycle 1.5 contract) ────────────────────

/**
 * Flush every cache that references this uid across every gate.
 * Called by every ADL write path (`syncAdl`, markdown re-parse,
 * evolution loop rewrite). Closes the 5-minute staleness window.
 *
 * Cycle 1.6: extended to cover llm.ts, api.ts, persist.ts PEP-4 caches
 * which previously owned their own maps and were missed by syncAdl.
 */
export function invalidateAdlCache(uid: string): void {
  invalidatePermCache(uid)
  invalidateBridgeCache(uid)
  invalidateLlmCache(uid)
  invalidateApiCache(uid)
  invalidateSchemaCache(uid)
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

export type AuditGate =
  | 'lifecycle'
  | 'network'
  | 'sensitivity'
  | 'schema'
  | 'bridge-network'
  | 'bridge-error'
  | `stage-${string}`

export type AuditDecision = 'deny' | 'allow-audit' | 'fail-closed' | 'observe' | 'would-deny'

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
 * block the caller.
 *
 * Two sinks:
 *  1. `console.warn` with `[adl-audit]` prefix (stdout → CF worker logs)
 *  2. In-memory ring buffer drained to D1 `adl_audit` (migration 0011)
 *     by `flushAuditBuffer(db)`. The engine cannot bind D1 directly, so
 *     Astro routes that own D1 bindings flush on request end.
 */
export function audit(rec: AuditRecord): void {
  const stamped: StampedAuditRecord = { ts: new Date().toISOString(), ...rec }
  try {
    console.warn(`[adl-audit] ${JSON.stringify(stamped)}`)
  } catch {
    /* silent — audit must never fail a request */
  }
  try {
    if (AUDIT_BUFFER.length >= AUDIT_BUFFER_MAX) {
      AUDIT_BUFFER.shift()
      // Backpressure signal: the ring buffer is evicting records before a
      // flusher drained them, which means audits are being lost to D1.
      // Most likely causes: D1 binding absent, `/api/signal` not being hit,
      // or a hot-loop gate saturating in <1 flush window. Emit once per
      // BACKPRESSURE_WINDOW_MS so we don't spam logs at the same rate we're
      // losing records.
      AUDIT_DROPPED++
      const now = Date.now()
      if (now - LAST_BACKPRESSURE_WARN > BACKPRESSURE_WINDOW_MS) {
        LAST_BACKPRESSURE_WARN = now
        try {
          console.warn(
            `[adl-audit] BACKPRESSURE: ring buffer full at ${AUDIT_BUFFER_MAX}, dropped=${AUDIT_DROPPED} — flushAuditBuffer(db) not keeping up`,
          )
        } catch {
          /* warning is best-effort */
        }
      }
    }
    AUDIT_BUFFER.push(stamped)
  } catch {
    /* ring buffer is best-effort */
  }
  try {
    AUDIT_PHEROMONE_HOOK?.(stamped)
  } catch {
    /* pheromone hook must never fail a request */
  }
}

// ── Pheromone feedback — the last loop closes (Cycle 4) ───────────────────
//
// Every deny becomes a `warn()` on the sender→receiver edge. The substrate
// learns to route away from paths that keep tripping ADL gates — no
// explicit firewall logic needed downstream. ADL stops being a side-car
// and becomes part of pheromone math.
//
// Weight mapping stays inside the 4-outcome algebra from dictionary.md:
//   deny         → warn(1.0)   full failure — caller was blocked
//   fail-closed  → warn(1.0)   infra failure forced denial
//   allow-audit  → warn(0.3)   mild — enforcement is off but call is suspect
//   observe      → 0.0         neutral observation, no deposit

export type AuditPheromoneHook = (rec: StampedAuditRecord) => void
let AUDIT_PHEROMONE_HOOK: AuditPheromoneHook | null = null

/** Register the substrate's warn() as the pheromone sink. Call once at boot. */
export function setAuditPheromone(hook: AuditPheromoneHook | null): void {
  AUDIT_PHEROMONE_HOOK = hook
}

/** Weight for a given audit decision — exported so callers can reuse the algebra. */
export function pheromoneWeight(decision: AuditDecision): number {
  switch (decision) {
    case 'deny':
      return 1.0
    case 'fail-closed':
      return 1.0
    case 'allow-audit':
      return 0.3
    case 'observe':
      return 0
  }
}

// ── Audit ring buffer → D1 flush path (Cycle 3 observability) ─────────────

export interface StampedAuditRecord extends AuditRecord {
  ts: string
}

/**
 * Cap the in-memory buffer to protect the isolate. At 1000 records × ~200b
 * that's ~200KB steady-state; saturating means something is emitting audits
 * in a hot loop and the oldest entries can safely age out.
 */
export const AUDIT_BUFFER_MAX = 1000
export const AUDIT_BUFFER: StampedAuditRecord[] = []

// Backpressure counter — incremented every time an audit record is dropped
// because the ring buffer hit AUDIT_BUFFER_MAX before a flusher ran. Exposed
// via auditStats() for /api/adl/denials.
export let AUDIT_DROPPED = 0
const BACKPRESSURE_WINDOW_MS = 60_000
let LAST_BACKPRESSURE_WARN = 0

/** Inspect and reset the drop counter. Returns {dropped, bufferSize}. */
export function auditStats(): { dropped: number; bufferSize: number } {
  return { dropped: AUDIT_DROPPED, bufferSize: AUDIT_BUFFER.length }
}

/** Reset counters — test hygiene only. */
export function resetAuditStats(): void {
  AUDIT_DROPPED = 0
  LAST_BACKPRESSURE_WARN = 0
}

/** Atomically drain the buffer. Returns what was captured; buffer becomes empty. */
export function drainAuditBuffer(): StampedAuditRecord[] {
  if (AUDIT_BUFFER.length === 0) return []
  const snapshot = AUDIT_BUFFER.splice(0, AUDIT_BUFFER.length)
  return snapshot
}

/**
 * Persist the buffer to D1 `adl_audit`. Fire-and-forget: callers never
 * await its success. On any failure, records are dropped (console.warn
 * remains as the durable log). Safe to call with no D1 binding — no-op.
 */
export async function flushAuditBuffer(
  db?: { prepare: (sql: string) => { bind: (...args: unknown[]) => { run: () => Promise<unknown> } } } | null,
): Promise<number> {
  if (!db) return 0
  const batch = drainAuditBuffer()
  if (batch.length === 0) return 0
  let written = 0
  for (const r of batch) {
    try {
      await db
        .prepare(
          `INSERT INTO adl_audit (ts, sender, receiver, gate, decision, mode, reason) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(r.ts, r.sender, r.receiver, r.gate, r.decision, r.mode, r.reason ?? null)
        .run()
      written++
    } catch {
      /* individual insert failures don't block the batch */
    }
  }
  return written
}
