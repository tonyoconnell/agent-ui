import type { APIRoute } from 'astro'
import { deriveHumanUid } from '@/lib/api-auth'
import { auth } from '@/lib/auth'
import { escapeTqlString, write } from '@/lib/typedb'

// Better Auth caches the full session (including user name/email) in a signed
// cookie named `better-auth.session_data` (HTTP dev) or
// `__Secure-better-auth.session_data` (HTTPS prod). After we update the user
// in TypeDB, we must clear this cache so the next SSR render does a fresh
// TypeDB lookup instead of serving the stale encrypted payload.
function clearSessionCacheHeaders(): Headers {
  const h = new Headers({ 'Content-Type': 'application/json' })
  const base = 'Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
  h.append('Set-Cookie', `better-auth.session_data=; ${base}`)
  h.append('Set-Cookie', `__Secure-better-auth.session_data=; ${base}; Secure`)
  return h
}

export const GET: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new Response('Unauthorized', { status: 401 })

  return new Response(
    JSON.stringify({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
      createdAt: session.user.createdAt,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

export const PATCH: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new Response('Unauthorized', { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  if (!body || typeof body !== 'object') return new Response('Bad request', { status: 400 })
  const b = body as Record<string, unknown>

  // ── Name update ──────────────────────────────────────────────────────────
  if ('name' in b) {
    const name = typeof b.name === 'string' ? b.name.trim() : null
    if (!name || name.length < 1 || name.length > 100) {
      return new Response('Name must be 1–100 characters', { status: 400 })
    }

    // 1. Update Better Auth's auth-user entity in TypeDB (authoritative for auth)
    await auth.api.updateUser({ body: { name }, headers: request.headers })

    // 2. Sync the substrate unit entity so routing/signals see the new name
    const uid = deriveHumanUid(session.user)
    const u = escapeTqlString(uid)
    const n = escapeTqlString(name)
    try {
      await write(`match $u isa unit, has uid "${u}"; $u has name $old; delete $old of $u;`)
      await write(`match $u isa unit, has uid "${u}"; insert $u has name "${n}";`)
    } catch {
      // auth-user is already updated (authoritative); unit.name syncs on next auth call
    }

    // 3. Clear session cache so the next SSR page load reads fresh data
    return new Response(JSON.stringify({ ok: true }), { headers: clearSessionCacheHeaders() })
  }

  // ── Email update ─────────────────────────────────────────────────────────
  if ('email' in b) {
    const newEmail = typeof b.email === 'string' ? b.email.trim().toLowerCase() : null
    if (!newEmail?.includes('@')) {
      return new Response('Invalid email address', { status: 400 })
    }
    if (newEmail === session.user.email) {
      return new Response('That is already your email address', { status: 400 })
    }

    // Better Auth updates auth-user.auth-email in TypeDB.
    // The substrate unit uid (derived from signup email) stays fixed so existing
    // paths and signals are not orphaned by an address change.
    try {
      await auth.api.changeEmail({
        body: { newEmail, callbackURL: '/account' },
        headers: request.headers,
      })
      return new Response(JSON.stringify({ ok: true }), { headers: clearSessionCacheHeaders() })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err ? String((err as any).message) : 'Failed to change email'
      const isVerificationRequired = msg.toLowerCase().includes('verification') || msg.toLowerCase().includes('email')
      return new Response(
        JSON.stringify({
          ok: false,
          error: isVerificationRequired
            ? 'Email verification is required to change a verified address. Contact support.'
            : msg,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }

  return new Response('Nothing to update', { status: 400 })
}
