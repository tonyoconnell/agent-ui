import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

export const GET: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals)
  if (!auth.isValid) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = await getD1(locals)
  if (!db) return Response.json({ domains: [] })

  const rows = await db
    .prepare(
      'SELECT id, hostname, cf_hostname_id, ssl_status, active, created_at FROM developer_domains WHERE key_id = ? AND active = 1 ORDER BY created_at DESC',
    )
    .bind(auth.keyId)
    .all<{
      id: string
      hostname: string
      cf_hostname_id: string | null
      ssl_status: string
      active: number
      created_at: number
    }>()

  return Response.json({ domains: rows?.results ?? [] })
}
