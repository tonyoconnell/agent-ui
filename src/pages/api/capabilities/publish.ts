/**
 * POST /api/capabilities/publish — Publish a capability (skill + price + mode + visibility)
 *
 * Body: { skillId, name, price, mode?, visibility?, tags?, rubricThresholds? }
 *
 * 1. Insert skill if not exists (match→insert with price update, catch→full insert).
 * 2. Insert capability relation (provider unit → offered skill) with price.
 * mode, visibility, rubricThresholds stored as tags on the skill (schema has no dedicated attrs).
 */
import type { APIRoute } from 'astro'
import { requireAuth, validateApiKey } from '@/lib/api-auth'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const auth = await validateApiKey(request)
  try {
    requireAuth(auth)
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Governance: operator+ required to list capabilities in marketplace
  const { getRoleForUser } = await import('@/lib/api-auth')
  const { roleCheck } = await import('@/lib/role-check')
  const role = await getRoleForUser(auth.user)
  if (!roleCheck(role ?? 'agent', 'add_unit')) {
    return new Response(JSON.stringify({ error: 'Forbidden: operator+ role required to publish capabilities' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = (await request.json()) as {
    skillId?: unknown
    name?: unknown
    price?: unknown
    mode?: string
    visibility?: string
    scope?: string
    tags?: unknown
    rubricThresholds?: { fit?: number; form?: number; truth?: number; taste?: number }
  }
  const { skillId, name, price, mode, visibility, tags, rubricThresholds } = body
  const scope = (body.scope as string) ?? 'group'

  if (typeof skillId !== 'string' || !/^[a-zA-Z0-9:_-]+$/.test(skillId))
    return new Response(JSON.stringify({ error: 'skillId must be a non-empty alphanumeric string' }), { status: 400 })
  if (typeof name !== 'string' || !name.trim())
    return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 })
  if (typeof price !== 'number' || price < 0)
    return new Response(JSON.stringify({ error: 'price must be a non-negative number' }), { status: 400 })

  // Build extra tags from mode, visibility, rubricThresholds
  const extraTags: string[] = []
  if (mode) extraTags.push(`mode:${mode}`)
  if (visibility) extraTags.push(`visibility:${visibility}`)
  if (rubricThresholds)
    for (const [dim, val] of Object.entries(rubricThresholds))
      if (typeof val === 'number') extraTags.push(`rubric:${dim}:${val}`)

  const allTags = [
    ...(Array.isArray(tags) ? (tags as string[]).filter((t) => typeof t === 'string') : []),
    ...extraTags,
  ]
  const q = (s: string) => s.replace(/"/g, '\\"')
  const tagLines = allTags.map((t) => `has tag "${q(t)}"`).join(', ')
  const tagClause = tagLines ? `, ${tagLines}` : ''

  const providerUid = (auth as { uid?: string })?.uid ?? 'unknown'

  try {
    // Upsert skill: try updating price on existing skill, fall back to full insert
    await writeSilent(`
      match $s isa skill, has skill-id "${q(skillId)}";
      insert $s has price ${price};
    `).then(undefined, () =>
      writeSilent(`
        insert $s isa skill,
          has skill-id "${q(skillId)}",
          has name "${q(name)}",
          has price ${price}${tagClause};
      `),
    )

    // Insert capability relation: provider unit → offered skill
    await writeSilent(`
      match
        $u isa unit, has uid "${q(providerUid)}";
        $s isa skill, has skill-id "${q(skillId)}";
      insert (provider: $u, offered: $s) isa capability, has price ${price};
    `)

    return new Response(JSON.stringify({ ok: true, sid: skillId, scope }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
