/**
 * POST /api/buy/hire — Open a chat with a provider + create a guest membership.
 *
 * Body: { providerUid: string, skillId: string, initialMessage?: string }
 * Returns: { ok: true, groupId, chatUrl } | { error: string }
 */
import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'
import { readParsed, writeSilent } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  // Auth guard
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const buyerUid = session.user.id

  // Parse body
  let providerUid: string, skillId: string, initialMessage: string | undefined
  try {
    const body = (await request.json()) as { providerUid?: string; skillId?: string; initialMessage?: string }
    providerUid = body.providerUid ?? ''
    skillId = body.skillId ?? ''
    initialMessage = body.initialMessage
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!providerUid || !skillId) {
    return Response.json({ error: 'providerUid and skillId are required' }, { status: 400 })
  }

  // Verify provider + skill capability exists
  try {
    const rows = await readParsed(`
      match
        $u isa unit, has uid "${providerUid}";
        $s isa skill, has skill-id "${skillId}";
        (provider: $u, offered: $s) isa capability;
      select $u;
    `)
    if (rows.length === 0) {
      return Response.json({ dissolved: true, error: `no capability ${skillId} on ${providerUid}` }, { status: 404 })
    }
  } catch {
    return Response.json({ error: 'capability lookup failed' }, { status: 500 })
  }

  // Resolve or create chat group
  const groupId = `hire:${buyerUid}:${providerUid}:${Date.now()}`

  try {
    writeSilent(`insert $g isa group, has group-id "${groupId}", has name "hire:${providerUid}", has tag "hire";`)
    writeSilent(
      `match $g isa group, has group-id "${groupId}"; $b isa unit, has uid "${buyerUid}"; insert (member: $b, group: $g) isa membership, has role "buyer";`,
    )
    writeSilent(
      `match $g isa group, has group-id "${groupId}"; $p isa unit, has uid "${providerUid}"; insert (member: $p, group: $g) isa membership, has role "provider";`,
    )
  } catch {
    return Response.json({ error: 'group creation failed' }, { status: 500 })
  }

  // Emit initial signal if message provided
  if (initialMessage) {
    const origin = new URL(request.url).origin
    fetch(`${origin}/api/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify({
        receiver: providerUid,
        data: { tags: ['hire', 'initial'], content: initialMessage, groupId },
      }),
    }).catch(() => {})
  }

  return Response.json({ ok: true, groupId, chatUrl: `/app/${groupId}` })
}
