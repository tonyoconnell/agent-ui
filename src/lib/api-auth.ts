/**
 * API authentication middleware
 * Validates API keys on incoming requests
 */

import { readParsed, writeSilent } from '@/lib/typedb'
import { verifyKey } from '@/lib/api-key'

export interface AuthContext {
  user: string
  permissions: string[]
  keyId: string
  isValid: boolean
}

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

  try {
    // Query TypeDB for active keys (can't join on hash, so we check all active)
    const rows = await readParsed(`
      match $k isa api-key, has api-key-id $id, has key-hash $h, has user-id $u,
        has permissions $p, has key-status "active";
      select $id, $h, $u, $p;
    `)

    for (const row of rows) {
      const isValid = await verifyKey(key, row.h)
      if (isValid) {
        // Update last-used timestamp (fire and forget)
        const now = new Date().toISOString()
        try {
          writeSilent(`
            match $k isa api-key, has api-key-id "${row.id}";
            delete $k has last-used $old;
            insert $k has last-used ${now};
          `)
        } catch {
          // Silently fail — last-used is not critical
        }

        return {
          user: row.u,
          permissions: row.p?.split(',').filter(Boolean) || [],
          keyId: row.id,
          isValid: true
        }
      }
    }

    return { user: '', permissions: [], keyId: '', isValid: false }
  } catch (error) {
    console.error('[API Auth] Error validating key:', error)
    return { user: '', permissions: [], keyId: '', isValid: false }
  }
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
