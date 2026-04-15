/**
 * API authentication middleware
 * Validates API keys on incoming requests
 */

import { verifyKey } from '@/lib/api-key'
import { readParsed, writeSilent } from '@/lib/typedb'

export interface AuthContext {
  user: string
  permissions: string[]
  keyId: string
  isValid: boolean
}

// In-process cache: plaintext key → verified identity (5-min TTL)
// Avoids O(n) PBKDF2 verification on every request after first auth.
// Revoked keys expire naturally within the TTL window.
const KEY_CACHE = new Map<string, { user: string; permissions: string[]; keyId: string; expires: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Extract and validate API key from Authorization header
 * Format: "Bearer api_xxx_yyy"
 */
export async function validateApiKey(request: Request): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: '', permissions: [], keyId: '', isValid: false }
  }

  const key = authHeader.slice(7) // Remove "Bearer "

  // Fast path: cache hit
  const cached = KEY_CACHE.get(key)
  if (cached && cached.expires > Date.now()) {
    return { user: cached.user, permissions: cached.permissions, keyId: cached.keyId, isValid: true }
  }

  try {
    // Slow path: fetch all active keys, verify each with PBKDF2
    const rows = await readParsed(`
      match $k isa api-key, has api-key-id $id, has key-hash $h, has user-id $u,
        has permissions $p, has key-status "active";
      select $id, $h, $u, $p;
    `)

    for (const row of rows) {
      const isValid = await verifyKey(key, row.h as string)
      if (isValid) {
        const user = row.u as string
        const permissions = (row.p as string | undefined)?.split(',').filter(Boolean) || []
        const keyId = row.id as string
        const nowMs = Date.now()

        // Cache the result
        KEY_CACHE.set(key, { user, permissions, keyId, expires: nowMs + CACHE_TTL_MS })

        // Update last-used: delete old value first (separate query — safe if attr absent),
        // then insert new value (always runs regardless of prior state).
        // last-used is datetime in TypeDB — use ISO format, strip trailing Z.
        const nowTs = new Date(nowMs).toISOString().replace('Z', '')
        writeSilent(`
          match $k isa api-key, has api-key-id "${keyId}", has last-used $old;
          delete $old of $k;
        `)
        writeSilent(`
          match $k isa api-key, has api-key-id "${keyId}";
          insert $k has last-used ${nowTs};
        `)

        return { user, permissions, keyId, isValid: true }
      }
    }

    return { user: '', permissions: [], keyId: '', isValid: false }
  } catch (error) {
    console.error('[API Auth] Error validating key:', error)
    return { user: '', permissions: [], keyId: '', isValid: false }
  }
}

/**
 * Invalidate a specific key from the in-process cache.
 * Call after revoking a key so it stops working immediately.
 */
export function invalidateKeyCache(plaintext: string): void {
  KEY_CACHE.delete(plaintext)
}

/**
 * Check if user has required permission
 */
export function hasPermission(auth: AuthContext, required: string): boolean {
  return auth.isValid && auth.permissions.includes(required)
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
