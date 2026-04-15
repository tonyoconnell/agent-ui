/**
 * GET /api/capabilities/list
 * ?as=buyer  → all public capabilities (excluding caller's own)
 * ?as=seller → caller's published capabilities (session required → 401)
 * ?tag=foo&tag=bar → AND filter
 * ?limit=N   → default 50, max 500
 * Returns: { capabilities: CapabilityItem[] } | { error: string }
 */
import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'
import { readParsed } from '@/lib/typedb'

export const prerender = false

type CapabilityItem = {
  sid: string
  name: string
  price: number
  providerUid: string
  tags: string[]
}

export const GET: APIRoute = async ({ request, url }) => {
  const as = url.searchParams.get('as') ?? 'buyer'
  const tags = url.searchParams.getAll('tag')
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 500)

  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null)
  if (as === 'seller' && !session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const callerUid = session?.user?.id ?? null

  const capRows = await readParsed(`
    match
      (provider: $p, offered: $s) isa capability, has price $price;
      $s isa skill, has skill-id $sid, has name $name;
      $p isa unit, has uid $pid;
    select $sid, $name, $price, $pid;
  `).catch(() => [] as Record<string, unknown>[])

  if (!capRows.length) {
    return Response.json({ capabilities: [] }, { headers: { 'Cache-Control': 'public, max-age=5' } })
  }

  const tagRows = await readParsed(`
    match $s isa skill, has skill-id $sid, has tag $t;
    select $sid, $t;
  `).catch(() => [] as Record<string, unknown>[])

  const tagMap = new Map<string, string[]>()
  for (const r of tagRows) {
    const sid = r.sid as string
    if (!tagMap.has(sid)) tagMap.set(sid, [])
    tagMap.get(sid)!.push(r.t as string)
  }

  let capabilities: CapabilityItem[] = capRows.map((r) => ({
    sid: r.sid as string,
    name: r.name as string,
    price: r.price as number,
    providerUid: r.pid as string,
    tags: tagMap.get(r.sid as string) ?? [],
  }))

  if (as === 'seller') {
    capabilities = capabilities.filter((c) => c.providerUid === callerUid)
  } else if (callerUid) {
    capabilities = capabilities.filter((c) => c.providerUid !== callerUid)
  }

  if (tags.length > 0) {
    capabilities = capabilities.filter((c) => tags.every((t) => c.tags.includes(t)))
  }

  return Response.json(
    { capabilities: capabilities.slice(0, limit) },
    { headers: { 'Cache-Control': 'public, max-age=5' } },
  )
}
