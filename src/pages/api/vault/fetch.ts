/**
 * GET /api/vault/fetch — return the signed-in user's encrypted vault envelope.
 *
 * Returns ciphertext only. Decryption requires the user's vault master,
 * reachable on a fresh device via the BIP-39 recovery phrase.
 *
 * Auth: Better Auth session required.
 *
 * 200:    { blob: string, version: number, updated_at: number }
 * 401:    Unauthorized
 * 404:    { error: 'no-blob' }          — signed in but never synced
 * 503:    { error: 'D1 not available' }
 */

import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

export const GET: APIRoute = async ({ request, locals }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })
  const userId = session.user.id

  const db = await getD1(locals)
  if (!db) return json({ error: 'D1 not available' }, 503)

  try {
    const row = await db
      .prepare(`SELECT blob, version, updated_at FROM vault_blob WHERE user_id = ? LIMIT 1`)
      .bind(userId)
      .first<{ blob: string; version: number; updated_at: number }>()
    if (!row) return json({ error: 'no-blob' }, 404)
    return json(row, 200)
  } catch (err) {
    return json({ error: (err as Error).message ?? 'db read failed' }, 500)
  }
}

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  })
}
