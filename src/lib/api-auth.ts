/**
 * API authentication middleware
 * Validates API keys on incoming requests.
 *
 * Security layers (Cycles 2 + 4):
 *   - Scope: keys carry scope-group + scope-skill; mismatch → 403 + security event
 *   - TTL: expires-at enforced on every verify; expired keys → 403
 *   - Events: every failure emits a SecurityEvent (hypothesis in TypeDB)
 *   - Pheromone: every adversarial failure calls warn(0.3) on caller→auth-boundary
 *   - Revocation: invalidateKeyCache(keyId) uses secondary map for reliable eviction
 */

import { verifyKey } from '@/lib/api-key'
import { getNet } from '@/lib/net'
import { emitSecurityEvent } from '@/lib/security-signals'
import { readParsed, writeSilent } from '@/lib/typedb'

export interface AuthContext {
  user: string
  permissions: string[]
  keyId: string
  isValid: boolean
  scopeGroups?: string[]
  scopeSkills?: string[]
}

// In-process cache: plaintext bearer → verified identity (5-min TTL).
// Avoids O(n) PBKDF2 verification on every request after first auth.
const KEY_CACHE = new Map<
  string,
  { user: string; permissions: string[]; keyId: string; expires: number; scopeGroups: string[]; scopeSkills: string[] }
>()
const CACHE_TTL_MS = 5 * 60 * 1000

// Secondary map: DB keyId → plaintext bearer.
// Required so invalidateKeyCache(keyId) can locate and evict the right cache entry.
// Without this, the revoke handler only has the DB ID; the cache is keyed by plaintext.
const KEYID_TO_BEARER = new Map<string, string>()

/** Fire-and-forget warn on the caller's auth-boundary edge. Never throws. */
function warnAuthBoundary(caller: string): void {
  void getNet()
    .then((n) => n.warn(`${caller}→auth-boundary`, 0.3))
    .catch(() => {})
}

/**
 * Extract and validate API key from Authorization header.
 * Format: "Bearer api_xxx_yyy"
 *
 * @param context - Optional scope context for per-call scope enforcement
 */
export async function validateApiKey(
  request: Request,
  context?: { group?: string; skill?: string },
): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    emitSecurityEvent({ kind: 'auth-fail', caller: 'unknown', reason: 'missing-header' })
    warnAuthBoundary('unknown')
    return { user: '', permissions: [], keyId: '', isValid: false }
  }

  const key = authHeader.slice(7) // Remove "Bearer "

  // Fast path: cache hit — re-check scope against current context (scope may differ per call)
  const cached = KEY_CACHE.get(key)
  if (cached && cached.expires > Date.now()) {
    if (context?.group && cached.scopeGroups.length > 0 && !cached.scopeGroups.includes(context.group)) {
      emitSecurityEvent({ kind: 'auth-fail', caller: cached.keyId, reason: 'scope-group-mismatch' })
      warnAuthBoundary(cached.keyId)
      return { user: '', permissions: [], keyId: '', isValid: false }
    }
    if (context?.skill && cached.scopeSkills.length > 0 && !cached.scopeSkills.includes(context.skill)) {
      emitSecurityEvent({ kind: 'auth-fail', caller: cached.keyId, reason: 'scope-skill-mismatch' })
      warnAuthBoundary(cached.keyId)
      return { user: '', permissions: [], keyId: '', isValid: false }
    }
    return {
      user: cached.user,
      permissions: cached.permissions,
      keyId: cached.keyId,
      isValid: true,
      scopeGroups: cached.scopeGroups,
      scopeSkills: cached.scopeSkills,
    }
  }

  try {
    // Slow path: fetch all active keys, verify each with PBKDF2
    const rows = await readParsed(`
      match $k isa api-key, has api-key-id $id, has key-hash $h, has user-id $u,
        has permissions $p, has key-status "active";
      optional { $k has expires-at $exp; }
      optional { $k has scope-group $sg; }
      optional { $k has scope-skill $ss; }
      select $id, $h, $u, $p, $exp, $sg, $ss;
    `)

    for (const row of rows) {
      const isValid = await verifyKey(key, row.h as string)
      if (isValid) {
        // TTL check
        if (row.exp !== undefined && row.exp !== null) {
          const expiresAt = new Date(row.exp as string).getTime()
          if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) continue
        }

        const scopeGroups =
          row.sg !== undefined && row.sg !== null
            ? Array.isArray(row.sg)
              ? (row.sg as string[]).filter(Boolean)
              : [row.sg as string].filter(Boolean)
            : []
        const scopeSkills =
          row.ss !== undefined && row.ss !== null
            ? Array.isArray(row.ss)
              ? (row.ss as string[]).filter(Boolean)
              : [row.ss as string].filter(Boolean)
            : []

        // Scope-group check
        if (context?.group && scopeGroups.length > 0 && !scopeGroups.includes(context.group)) continue
        // Scope-skill check
        if (context?.skill && scopeSkills.length > 0 && !scopeSkills.includes(context.skill)) continue

        const user = row.u as string
        const permissions = (row.p as string | undefined)?.split(',').filter(Boolean) || []
        const keyId = row.id as string
        const nowMs = Date.now()

        // Cache — secondary map lets invalidateKeyCache(keyId) find and evict the right entry
        KEY_CACHE.set(key, { user, permissions, keyId, expires: nowMs + CACHE_TTL_MS, scopeGroups, scopeSkills })
        KEYID_TO_BEARER.set(keyId, key)

        // Update last-used (fire-and-forget; best-effort)
        const nowTs = new Date(nowMs).toISOString().replace('Z', '')
        writeSilent(`
          match $k isa api-key, has api-key-id "${keyId}", has last-used $old;
          delete $old of $k;
        `)
        writeSilent(`
          match $k isa api-key, has api-key-id "${keyId}";
          insert $k has last-used ${nowTs};
        `)

        return { user, permissions, keyId, isValid: true, scopeGroups, scopeSkills }
      }
    }

    emitSecurityEvent({ kind: 'auth-fail', caller: 'unknown', reason: 'invalid-key' })
    warnAuthBoundary('unknown')
    return { user: '', permissions: [], keyId: '', isValid: false }
  } catch (error) {
    console.error('[API Auth] Error validating key:', error)
    return { user: '', permissions: [], keyId: '', isValid: false }
  }
}

/**
 * Invalidate a key from the in-process cache by its DB keyId.
 * Uses the KEYID_TO_BEARER secondary map to find and evict the correct entry.
 * Cross-worker protection relies on WsHub broadcast (see api-keys.ts revoke handler).
 */
export function invalidateKeyCache(keyId: string): void {
  const bearer = KEYID_TO_BEARER.get(keyId)
  if (bearer) {
    KEY_CACHE.delete(bearer)
    KEYID_TO_BEARER.delete(keyId)
  }
}

/**
 * Check if user has required permission.
 * Also enforces scope: if scopeGroups is non-empty and required doesn't match any entry, returns false.
 */
export function hasPermission(auth: AuthContext, required: string, group?: string): boolean {
  if (!auth.isValid) return false
  if (!auth.permissions.includes(required)) return false
  if (group && auth.scopeGroups && auth.scopeGroups.length > 0 && !auth.scopeGroups.includes(group)) return false
  return true
}

/**
 * Require API authentication
 */
export function requireAuth(auth: AuthContext, required?: string) {
  if (!auth.isValid) {
    throw new Error('Unauthorized: Invalid API key')
  }
  if (required && !hasPermission(auth, required)) {
    throw new Error(`Forbidden: Missing permission '${required}'`)
  }
}
