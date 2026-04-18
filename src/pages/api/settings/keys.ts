import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'
import { getD1 } from '@/lib/cf-env'
import { encryptSecret } from '@/lib/crypto/key-wrap'

export const prerender = false

export const GET: APIRoute = async ({ request, locals }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new Response('Unauthorized', { status: 401 })

  const db = await getD1(locals)
  if (!db) return new Response('DB unavailable', { status: 500 })

  try {
    const { results } = await db
      .prepare('SELECT id, key_label, created_at FROM user_secrets WHERE user_id = ? ORDER BY created_at DESC')
      .bind(session.user.id)
      .all()
    return Response.json(results ?? [])
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new Response('Unauthorized', { status: 401 })

  const db = await getD1(locals)
  if (!db) return new Response('DB unavailable', { status: 500 })

  let label: string, value: string
  try {
    const body = (await request.json()) as { label?: string; value?: string }
    label = body.label ?? ''
    value = body.value ?? ''
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!label || !value) return Response.json({ error: 'label and value required' }, { status: 400 })

  try {
    const sessionToken = request.headers.get('cookie') ?? ''
    const { iv, ciphertext } = await encryptSecret(value, sessionToken, session.user.id)
    await db
      .prepare(
        'INSERT INTO user_secrets (user_id, key_label, iv, ciphertext) VALUES (?,?,?,?) ' +
          'ON CONFLICT(user_id, key_label) DO UPDATE SET iv=excluded.iv, ciphertext=excluded.ciphertext, updated_at=unixepoch()',
      )
      .bind(session.user.id, label, iv, ciphertext)
      .run()
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ request, locals }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new Response('Unauthorized', { status: 401 })

  const db = await getD1(locals)
  if (!db) return new Response('DB unavailable', { status: 500 })

  const label = new URL(request.url).searchParams.get('label')
  if (!label) return Response.json({ error: 'label query param required' }, { status: 400 })

  try {
    await db.prepare('DELETE FROM user_secrets WHERE user_id = ? AND key_label = ?').bind(session.user.id, label).run()
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
