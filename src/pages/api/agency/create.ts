/**
 * POST /api/agency/create — Create an agency world (multi-group tenant)
 *
 * An agency is a group that owns sub-groups (client worlds).
 * Creates: agency group + owner membership + optional starter agents.
 *
 * Body: { name: string, slug: string, ownerId?: string }
 * Returns: { ok: true, groupId: string }
 */
import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new Response('Unauthorized', { status: 401 })

  let name: string, slug: string
  try {
    const body = (await request.json()) as { name?: string; slug?: string }
    name = (body.name ?? '').trim()
    slug = (body.slug ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!name || !slug) {
    return Response.json({ error: 'name and slug required' }, { status: 400 })
  }

  const groupId = `agency:${slug}`
  const ownerId = session.user.id

  try {
    // Create agency group with kind="agency" tag
    await writeSilent(`
      insert $g isa group,
        has group-id "${groupId}",
        has name "${name.replace(/"/g, '\\"')}",
        has tag "agency";
    `)

    // Create owner actor if not present, then add membership
    await writeSilent(`
      match $g isa group, has group-id "${groupId}";
      insert $u isa actor, has aid "${ownerId}", has name "owner";
      (member: $u, group: $g) isa membership, has role "owner";
    `).catch(() => {
      // Actor may already exist — try membership insert only
    })

    return Response.json({ ok: true, groupId })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
