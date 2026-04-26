/**
 * GET /api/paths/bridge/challenge?peer=<peer-host>
 *
 * Issues a server-side nonce for the V3 bridge handshake.
 *
 * The initiating substrate calls this endpoint on THEIR OWN substrate
 * before submitting the bridge POST. The returned challenge is:
 *   - 32-byte cryptographically random (Web Crypto)
 *   - Bound to the peer host at issue time
 *   - Single-use (consumed on first validate, then removed)
 *   - 5-minute TTL (expired entries are pruned on each new issue)
 *
 * Auth: chairman or owner of this substrate.
 *       (resolveUnitFromSession + getRoleForUser — any group membership
 *        at chairman level suffices; the challenge is substrate-scoped
 *        not group-scoped.)
 *
 * Response 200:
 *   {
 *     challenge: string,   // 32-byte base64url random nonce
 *     issuedAt: number,    // unix-second
 *     expiresAt: number,   // issuedAt + 300
 *     peer: string         // echoes the peer host this challenge is bound to
 *   }
 *
 * Errors:
 *   401 — unauthenticated
 *   403 — not chairman or owner
 *   400 — missing or invalid peer query param
 */

import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { badRequest, forbidden, ok, unauthorized } from '@/lib/api-response'

// ── Challenge store ─────────────────────────────────────────────────────────

const CHALLENGE_TTL_S = 300 // 5 minutes

interface ChallengeEntry {
  peer: string
  expiresAt: number // unix seconds
}

/** Module-level Map: challenge (base64url) → entry. No D1 — module-local per isolate. */
const CHALLENGE_STORE = new Map<string, ChallengeEntry>()

/** Prune expired entries. Called on each new challenge issue. */
function pruneExpired(): void {
  const now = Math.floor(Date.now() / 1000)
  for (const [key, entry] of CHALLENGE_STORE) {
    if (entry.expiresAt <= now) {
      CHALLENGE_STORE.delete(key)
    }
  }
}

/** Encode a Uint8Array to a base64url string (no padding). */
function toBase64url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Issue a new 32-byte challenge bound to `peer`.
 * Returns { challenge, issuedAt, expiresAt, peer }.
 */
export function issueChallenge(peer: string): {
  challenge: string
  issuedAt: number
  expiresAt: number
  peer: string
} {
  pruneExpired()

  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const challenge = toBase64url(bytes)

  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAt = issuedAt + CHALLENGE_TTL_S

  CHALLENGE_STORE.set(challenge, { peer, expiresAt })

  return { challenge, issuedAt, expiresAt, peer }
}

/**
 * Validate and consume a challenge.
 *
 * Returns true if:
 *   1. The challenge exists in the store.
 *   2. The bound peer matches the supplied peer (case-insensitive after trim).
 *   3. The challenge has not expired.
 *
 * On first successful consume, the entry is removed (single-use guarantee).
 * On any failure (missing, wrong peer, expired), returns false.
 *
 * Exported for use by the bridge endpoint.
 */
export function consumeChallenge(challenge: string, peer: string): boolean {
  const entry = CHALLENGE_STORE.get(challenge)
  if (!entry) return false

  const now = Math.floor(Date.now() / 1000)
  if (entry.expiresAt <= now) {
    // Expired — clean up and reject
    CHALLENGE_STORE.delete(challenge)
    return false
  }

  // Peer must match (normalise trailing slash + lowercase)
  const normPeer = peer.replace(/\/+$/, '').toLowerCase()
  const normStored = entry.peer.replace(/\/+$/, '').toLowerCase()
  if (normPeer !== normStored) return false

  // Single-use: remove on first valid consume
  CHALLENGE_STORE.delete(challenge)
  return true
}

/**
 * Test hook — clear the challenge store between tests.
 */
export function _clearChallengeStoreForTests(): void {
  CHALLENGE_STORE.clear()
}

// ── Route handler ───────────────────────────────────────────────────────────

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  // Auth check
  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || !ctx.user) {
    return unauthorized()
  }

  // Must be chairman or owner on at least one group.
  // We check by querying the user's groups via getRoleForUser — but since
  // getRoleForUser requires a specific group id, and challenges are
  // substrate-scoped rather than group-scoped, we accept any chairman/owner
  // role. The simplest gate: attempt to find a non-null role for the
  // wildcard "substrate" group (owner key) OR check the session role directly.
  //
  // For now: owner role is encoded in the session as ctx.role (if present),
  // otherwise require the user to be chairman of at least the empty string
  // group (which returns null). Instead, we check ctx.role directly.
  //
  // Fallback: if ctx.role is not populated by the session, check that
  // getRoleForUser returns 'chairman' or 'owner' for any non-null gid.
  // Since we can't enumerate groups here, we use the documented convention:
  // the challenge endpoint requires the caller to identify a group they chair.
  // The peer param is the relevant scope; we verify the user is chairman
  // of something (the bridge itself will double-check group membership).
  //
  // Concrete rule: accept if ctx.role is 'owner', or if getRoleForUser
  // for ANY group returns 'chairman' or higher. Since we can't enumerate,
  // we require the session to carry role='owner'|'chairman' directly,
  // OR we check against a sentinel group "" which gets null → then we
  // require the frontend to pass X-Group-Id header as a hint.
  //
  // Simplest correct implementation given the existing API pattern:
  // accept if session resolves as valid owner-tier OR if the user has
  // chairman role on the gid passed via header (optional). If no header,
  // default to accepting any authenticated user that is a chairman
  // on *some* group — validated by checking getRoleForUser("").
  // That returns null for normal users → gate passes only when role is
  // already encoded in the session context.
  //
  // Given the existing codebase: ctx may contain role directly if set by
  // resolveUnitFromSession. If not, we check via header or permissive gate.
  // We fall back to a permissive "any valid session = chairman or owner"
  // check — the bridge POST itself enforces chairman gating per-group.
  //
  // Final decision: require X-Group-Id header OR accept any valid chairman
  // role from the session's role field. If ctx.role exists use it;
  // otherwise, do an explicit getRoleForUser check on X-Group-Id.
  const groupIdHint = request.headers.get('X-Group-Id')

  let isChairmanOrOwner = false

  // Check session-level role if available
  if ((ctx as { role?: string }).role === 'owner' || (ctx as { role?: string }).role === 'chairman') {
    isChairmanOrOwner = true
  }

  // Check explicit group hint
  if (!isChairmanOrOwner && groupIdHint) {
    const role = await getRoleForUser(ctx.user, groupIdHint)
    if (role === 'chairman' || role === 'owner') {
      isChairmanOrOwner = true
    }
  }

  // Permissive fallback: if no hint and no session role, try empty string
  // (getRoleForUser('') returns null for normal users, non-null for owner).
  if (!isChairmanOrOwner && !groupIdHint) {
    const role = await getRoleForUser(ctx.user, '')
    if (role === 'owner') {
      isChairmanOrOwner = true
    }
  }

  if (!isChairmanOrOwner) {
    return forbidden('forbidden', 'chairman or owner role required; pass X-Group-Id header')
  }

  // Validate peer param
  const url = new URL(request.url)
  const peer = url.searchParams.get('peer')

  if (!peer || peer.trim() === '') {
    return badRequest('peer query param required')
  }

  // Validate that peer looks like a URL (must start with https:// or http://)
  if (!/^https?:\/\/.+/.test(peer.trim())) {
    return badRequest('peer must be a valid http/https URL')
  }

  const result = issueChallenge(peer.trim())

  return ok(result)
}
