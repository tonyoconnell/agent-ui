/**
 * GET /api/auth/me — return the current session's user + role.
 *
 * Header component calls this after session hydrates to show a role badge.
 * Role lookup (chairman/board/ceo/operator/agent/auditor) is one extra TypeDB
 * read, so we don't fold it into the better-auth session itself — it changes
 * independently and shouldn't invalidate cookies when it flips.
 *
 * Returns:
 *   { uid, email?, wallet?, role? }      — signed in
 *   401 { error: 'unauthenticated' }     — no session
 */

import type { APIRoute } from 'astro'
import { getRoleForUser } from '@/lib/api-auth'
import { auth } from '@/lib/auth'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'unauthenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const uid = session.user.id
    let role: string | null = null
    try {
      role = await getRoleForUser(uid)
    } catch {
      // role lookup is best-effort — header degrades to no badge
    }

    const user = session.user as {
      id: string
      email?: string
      name?: string
      wallet?: string
    }

    return new Response(
      JSON.stringify({
        uid: user.id,
        email: user.email ?? null,
        name: user.name ?? null,
        wallet: user.wallet ?? null,
        role,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-store',
        },
      },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'session resolution failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
