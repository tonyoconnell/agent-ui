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

import { getKeyPrefix, verifyKey } from '@/lib/api-key'
import { auth } from '@/lib/auth'
import { ensureHumanUnit } from '@/lib/human-unit'

// Re-export for backward compatibility
export { ensureHumanUnit }

import { getD1, getEnv } from '@/lib/cf-env'
import { getNet } from '@/lib/net'
import { roleCheck } from '@/lib/role-check'
import { emitSecurityEvent } from '@/lib/security-signals'
import { resolveTier, type Tier } from '@/lib/tier-limits'
import { readParsed, writeSilent } from '@/lib/typedb'

export interface AuthContext {
  user: string
  permissions: string[]
  keyId: string
  isValid: boolean
  role?: string
  scopeGroups?: string[]
  scopeSkills?: string[]
  realUser?: string // originating human identity when acting as another unit
  actAs?: string // explicit act-as request (validated, identity swapped)
  ownerOf?: string[] // agents this user has chairman membership in
  tier?: Tier // Platform BaaS tier (free|builder|scale|world|enterprise). Populated when locals is passed.
  personalGid?: string // personal group: "group:{uid}" — auto-created on sign-up
  suggestedJoins?: string[] // public groups to surface on sign-up; TQL-driven, fallback ["one"]
}

// In-process cache: plaintext bearer → verified identity (5-min TTL).
// Avoids O(n) PBKDF2 verification on every request after first auth.
const KEY_CACHE = new Map<
  string,
  {
    user: string
    permissions: string[]
    keyId: string
    expires: number
    role?: string
    scopeGroups: string[]
    scopeSkills: string[]
    tier?: Tier
  }
>()
const CACHE_TTL_MS = 5 * 60 * 1000

// Secondary map: DB keyId → plaintext bearer.
// Required so invalidateKeyCache(keyId) can locate and evict the right cache entry.
// Without this, the revoke handler only has the DB ID; the cache is keyed by plaintext.
const KEYID_TO_BEARER = new Map<string, string>()

/**
 * KV-based per-group per-day rate limiting.
 * Returns false if the group has exceeded 1000 requests today.
 * Fail-open: returns true on any error or if KV is unavailable.
 */
async function checkGroupQuota(group: string, locals: App.Locals | undefined): Promise<boolean> {
  try {
    const env = await getEnv(locals)
    const kv = env?.KV as KVNamespace | undefined
    if (!kv) return true
    const key = `quota:${group}:${new Date().toISOString().slice(0, 10)}`
    const raw = await kv.get(key)
    const count = raw ? parseInt(raw, 10) : 0
    if (count >= 1000) return false
    await kv.put(key, String(count + 1), { expirationTtl: 86400 })
    return true
  } catch {
    return true
  }
}

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
 * @param locals  - Optional Astro locals (for D1 tier lookup). If provided,
 *                  AuthContext.tier will be populated from `developer_tiers`.
 */
export async function validateApiKey(
  request: Request,
  context?: { group?: string; skill?: string },
  locals?: App.Locals,
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
    // Tier: populate on first caller to supply locals, then cache for the TTL.
    let tier = cached.tier
    if (tier === undefined && locals !== undefined) {
      const db = await getD1(locals)
      tier = await resolveTier(cached.user, db)
      cached.tier = tier
    }
    return {
      user: cached.user,
      permissions: cached.permissions,
      keyId: cached.keyId,
      isValid: true,
      role: cached.role,
      scopeGroups: cached.scopeGroups,
      scopeSkills: cached.scopeSkills,
      tier,
    }
  }

  try {
    // Slow path: narrow by key-prefix first (O(1) index → 1-2 PBKDF2 calls max)
    const prefix = getKeyPrefix(key)
    const rows = await readParsed(`
      match $k isa api-key, has api-key-id $id, has key-hash $h, has user-id $u,
        has permissions $p, has key-status "active", has key-prefix "${prefix}";
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

        // Owner-tier rotation check (Gap 4 §4.s3): if this bearer hash is
        // also tracked in D1 owner_key (i.e. it's an owner-PRF-derived key),
        // enforce that table's expires_at. Lets force-revoke on the
        // /api/auth/owner-key-versions DELETE path take effect on next call.
        // No-ops for non-owner keys (random api_xxx bearers won't have a
        // row in owner_key, so the lookup returns null and we proceed).
        if (locals !== undefined) {
          const db = await getD1(locals)
          if (db) {
            const expired = await db
              .prepare(
                `SELECT expires_at FROM owner_key WHERE key_hash = ? AND expires_at IS NOT NULL AND expires_at <= unixepoch()`,
              )
              .bind(row.h as string)
              .first<{ expires_at: number }>()
              .catch(() => null)
            if (expired) {
              emitSecurityEvent({ kind: 'auth-fail', caller: row.id as string, reason: 'owner-key-revoked' })
              continue
            }
          }
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
        // Role lookup: one extra TypeDB query per cache miss (~5 min per key), acceptable cost
        const role = await getRoleForUser(user).catch(() => undefined)

        // Tier lookup (optional — only when locals is available for D1 access).
        // Missing / unreachable D1 → 'free'. Cached alongside role for the TTL.
        let tier: Tier | undefined
        if (locals !== undefined) {
          const db = await getD1(locals)
          tier = await resolveTier(user, db)
        }

        KEY_CACHE.set(key, {
          user,
          permissions,
          keyId,
          expires: nowMs + CACHE_TTL_MS,
          role,
          scopeGroups,
          scopeSkills,
          tier,
        })
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

        return { user, permissions, keyId, isValid: true, role, scopeGroups, scopeSkills, tier }
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
 * Look up governance role for a user uid from membership relation.
 * Called separately from validateApiKey to keep auth at 1 TypeDB query.
 */
const ROLE_RANK: Record<string, number> = {
  owner: 7, // substrate apex (singleton); see owner.md
  chairman: 6,
  ceo: 5,
  board: 4,
  operator: 3,
  auditor: 2,
  agent: 1,
}

function bestRole(roles: string[]): string | undefined {
  return roles.filter((r) => r in ROLE_RANK).sort((a, b) => (ROLE_RANK[b] ?? 0) - (ROLE_RANK[a] ?? 0))[0]
}

export async function getRoleForUser(uid: string, gid?: string): Promise<string | undefined> {
  const safeUid = uid.replace(/[^a-zA-Z0-9_:.-]/g, '')
  const safeGid = gid ? gid.replace(/[^a-zA-Z0-9_:.-]/g, '') : ''
  const groupFilter = gid ? `$g isa group, has gid "${safeGid}";` : ''
  try {
    const rows = await readParsed(
      `match $u isa unit, has uid "${safeUid}";
       ${groupFilter}
       (member: $u, group: $g) isa membership, has member-role $r;
       select $r; limit 1;`,
    )
    const direct = rows[0]?.r as string | undefined
    if (direct) return direct

    if (!gid) return undefined
    const ancestorRows = await readParsed(
      `match $u isa unit, has uid "${safeUid}";
       $child isa group, has gid "${safeGid}";
       let $ancestor in ancestors-of($child);
       (member: $u, group: $ancestor) isa membership, has member-role $r;
       select $r;`,
    )
    return bestRole(ancestorRows.map((row) => row.r as string))
  } catch {
    return undefined
  }
}

export async function getGroupsForUser(
  uid: string,
  roles?: string[],
): Promise<Array<{ gid: string; name: string; role: string }>> {
  const safeUid = uid.replace(/[^a-zA-Z0-9_:.-]/g, '')
  try {
    const rows = await readParsed(`
      match $u isa unit, has uid "${safeUid}";
      (member: $u, group: $g) isa membership, has member-role $r;
      $g has gid $gid, has name $gname;
      select $gid, $gname, $r;
    `)
    return rows
      .filter((r) => !roles || roles.includes(r.r as string))
      .map((r) => ({ gid: r.gid as string, name: r.gname as string, role: r.r as string }))
  } catch {
    return []
  }
}

// Session cache: cookie-header value → verified identity (5-min TTL).
// Keyed by the raw Cookie header so cookie rotation naturally invalidates.
const SESSION_CACHE = new Map<string, { ctx: AuthContext; expires: number }>()

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/** Derive a substrate uid from a BetterAuth user. Stable across sessions. */
export function deriveHumanUid(user: { id: string; email?: string | null }): string {
  const basis = user.email || user.id
  const slug = basis
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `human:${slug || user.id}`
}

async function resolveSuiSession(token: string, locals?: App.Locals): Promise<AuthContext> {
  const INVALID: AuthContext = { user: '', permissions: [], keyId: '', isValid: false }
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) {
    emitSecurityEvent({ kind: 'auth-fail', caller: 'unknown', reason: 'sui-session-invalid-format' })
    warnAuthBoundary('unknown')
    return INVALID
  }

  const env =
    (locals as { runtime?: { env?: Record<string, string> } } | undefined)?.runtime?.env ??
    (process.env as Record<string, string>)
  const secret = env.SUI_SESSION_SECRET ?? env.WALLET_NONCE_SECRET
  if (!secret) {
    emitSecurityEvent({ kind: 'auth-fail', caller: 'unknown', reason: 'sui-session-no-secret' })
    warnAuthBoundary('unknown')
    return INVALID
  }

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const expectedBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64)))
    const expected = btoa(String.fromCharCode(...expectedBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    if (expected !== sig) {
      emitSecurityEvent({ kind: 'auth-fail', caller: 'unknown', reason: 'sui-session-sig-mismatch' })
      warnAuthBoundary('unknown')
      return INVALID
    }

    const pad = payloadB64.length % 4 ? 4 - (payloadB64.length % 4) : 0
    const b64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { u: string; e: number }

    if (payload.e < Date.now()) {
      emitSecurityEvent({ kind: 'auth-fail', caller: 'unknown', reason: 'sui-session-expired' })
      warnAuthBoundary('unknown')
      return INVALID
    }

    const uid = payload.u
    const role = await getRoleForUser(uid).catch(() => undefined)
    let tier: Tier | undefined
    if (locals !== undefined) {
      const db = await getD1(locals)
      tier = await resolveTier(uid, db)
    }
    return {
      user: uid,
      permissions: ['read', 'write'],
      keyId: `sess:sui:${uid}`,
      isValid: true,
      role,
      scopeGroups: [],
      scopeSkills: [],
      tier,
      personalGid: `group:${uid}`,
    }
  } catch {
    emitSecurityEvent({ kind: 'auth-fail', caller: 'unknown', reason: 'sui-session-exception' })
    warnAuthBoundary('unknown')
    return INVALID
  }
}

/**
 * Unified identity resolver.
 *
 * Two front doors, one contract:
 *   - Authorization: Bearer — substrate api-key via validateApiKey (agents, CLI)
 *   - Cookie — BetterAuth session via auth.api.getSession (humans in browser)
 *
 * Result shape matches AuthContext so gated routes stay uniform.
 * Cache: 5-min TTL, keyed by cookie header (bearer path already has KEY_CACHE).
 */
export async function resolveUnitFromSession(request: Request, locals?: App.Locals): Promise<AuthContext> {
  // Front door 1: Bearer (agents, CLI, BetterAuth bearer plugin)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const bearer = await validateApiKey(request, undefined, locals)
    if (bearer.isValid) return bearer
  }

  // Front door 2: Sui session cookie (parallel to BetterAuth, for SIWS)
  const cookie = request.headers.get('Cookie') || ''
  if (!cookie) {
    return { user: '', permissions: [], keyId: '', isValid: false }
  }

  const suiSessionMatch = cookie.match(/(?:^|;\s*)one\.sui\.session=([^;]+)/)
  if (suiSessionMatch) {
    const suiCtx = await resolveSuiSession(suiSessionMatch[1], locals)
    if (suiCtx.isValid) return suiCtx
  }

  // Front door 3: BetterAuth session cookie

  const cached = SESSION_CACHE.get(cookie)
  if (cached && cached.expires > Date.now()) return cached.ctx

  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null
  try {
    session = await auth.api.getSession({ headers: request.headers })
  } catch {
    /* fail-closed */
  }
  if (!session?.user) {
    emitSecurityEvent({ kind: 'auth-fail', caller: 'unknown', reason: 'betterauth-no-session' })
    warnAuthBoundary('unknown')
    return { user: '', permissions: [], keyId: '', isValid: false }
  }

  const uid = deriveHumanUid(session.user)
  await ensureHumanUnit(uid, session.user)
  const role = await getRoleForUser(uid)

  // Tier (opportunistic): populated when the caller supplies locals for D1 access.
  // Missing D1 (dev mode, tests) → 'free'. See tier-limits.ts § resolveTier.
  let tier: Tier | undefined
  if (locals !== undefined) {
    const db = await getD1(locals)
    tier = await resolveTier(uid, db)
  }

  // Act-as: cookie session can act as owned agents if chairman in g:owns:<target>
  const actAsParam = new URL(request.url).searchParams.get('actAs')
  const actAsHeader = request.headers.get('X-Act-As')
  const actAsTarget = actAsParam || actAsHeader

  if (actAsTarget) {
    const ownershipGroup = `g:owns:${actAsTarget}`
    const membershipRows = await readParsed(`
      match
        $u isa unit, has uid "${esc(uid)}";
        $g isa group, has gid "${esc(ownershipGroup)}";
        (member: $u, group: $g) isa membership, has member-role $r;
        select $r;
    `).catch(() => [])
    const isChairman = (membershipRows as Array<{ r: string }>).some((row) => row.r === 'chairman')

    if (!isChairman) {
      emitSecurityEvent({ kind: 'auth-fail', caller: uid, reason: 'act-as-unauthorized' })
      warnAuthBoundary(uid)
      return { user: '', permissions: [], keyId: '', isValid: false }
    }

    const actAsRole = await getRoleForUser(actAsTarget).catch(() => undefined)
    // Tier follows the real user (billing stays with the session holder, not the target).
    // actAs context is not cached — always fresh (prevents stale ownership after revoke)
    return {
      user: actAsTarget,
      permissions: ['read', 'write'],
      keyId: `sess:${session.session.id}`,
      isValid: true,
      role: actAsRole,
      scopeGroups: [ownershipGroup],
      scopeSkills: [],
      realUser: uid,
      actAs: actAsTarget,
      tier,
    }
  }

  const suggestedJoins = await readParsed(`
    match $g isa group, has gid $gid, has name $n, has visibility "public";
    not { $g has group-type "personal"; };
    select $gid, $n; limit 5;
  `)
    .then((rows) => rows.map((r) => String(r.gid)))
    .catch(() => ['one'])
    .then((gs) => (gs.length > 0 ? gs : ['one']))

  const ctx: AuthContext = {
    user: uid,
    permissions: ['read', 'write'],
    keyId: `sess:${session.session.id}`,
    isValid: true,
    role,
    scopeGroups: [],
    scopeSkills: [],
    tier,
    personalGid: `group:${uid}`,
    suggestedJoins,
  }
  SESSION_CACHE.set(cookie, { ctx, expires: Date.now() + CACHE_TTL_MS })
  return ctx
}

/**
 * Require API authentication
 */
export function requireAuth(ctx: AuthContext, required?: string) {
  if (!ctx.isValid) {
    throw new Error('Unauthorized: Invalid API key')
  }
  if (required && !hasPermission(ctx, required)) {
    throw new Error(`Forbidden: Missing permission '${required}'`)
  }
}

// Gate helper — single function for all role-gated routes
// Uses ADL_ENFORCEMENT_MODE (audit|enforce) from @/engine/adl-cache
// In audit mode: logs would-deny, returns ok:true (caller proceeds)
// In enforce mode: returns ok:false with 403 Response
export async function requireRole(
  request: Request,
  action: string,
  context?: { uid?: string; gate?: string; group?: string },
  locals?: App.Locals,
): Promise<{ ok: true; auth: AuthContext; role: string } | { ok: false; res: Response }> {
  // Lazy import to avoid circular deps (adl-cache → persist → api-auth)
  const { enforcementMode, audit } = await import('@/engine/adl-cache')
  const mode = enforcementMode()

  const auth = await validateApiKey(request)
  const role = auth.role ?? 'agent'
  const gate = (context?.gate ?? `role:${action}`) as import('@/engine/adl-cache').AuditGate

  // Not authenticated at all
  if (!auth.isValid) {
    audit({
      sender: 'anonymous',
      receiver: context?.uid ?? 'unknown',
      gate,
      decision: mode === 'enforce' ? 'deny' : 'would-deny',
      mode,
      reason: 'no bearer token',
    })
    if (mode === 'enforce') {
      return {
        ok: false,
        res: Response.json({ error: 'bearer token required', gate, required: action }, { status: 401 }),
      }
    }
    return { ok: true, auth, role }
  }

  const allowed = roleCheck(role, action as any)
  if (!allowed) {
    audit({
      sender: auth.user,
      receiver: context?.uid ?? 'unknown',
      gate,
      decision: mode === 'enforce' ? 'deny' : 'would-deny',
      mode,
      reason: `role ${role} cannot ${action}`,
    })
    if (mode === 'enforce') {
      return {
        ok: false,
        res: Response.json({ error: 'insufficient role', gate, required: action, have: role }, { status: 403 }),
      }
    }
  }

  // Per-group per-day quota check
  if (context?.group && locals) {
    const withinQuota = await checkGroupQuota(context.group, locals)
    if (!withinQuota) {
      writeSilent(`
        insert $s isa signal,
          has receiver "api:rate-limit:hit",
          has data "{"group":"${context.group.replace(/"/g, '\\"')}"}";
      `)
      return {
        ok: false,
        res: Response.json(
          { error: 'rate limit exceeded', group: context.group, retryAfter: 86400 },
          { status: 429, headers: { 'Retry-After': '86400' } },
        ),
      }
    }
  }

  return { ok: true, auth, role }
}
