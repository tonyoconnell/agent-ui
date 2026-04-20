/**
 * POST /api/agents/sync
 *
 * Sync agent(s) from markdown to TypeDB.
 *
 * Authentication: Bearer <api_key> (optional, required for certain operations)
 *
 * Body:
 *   { markdown: string }           - Single agent markdown
 *   { agents: { name, content }[] } - Multiple agents (world)
 *   { world: string, agents: ... }  - Named world with agents
 */

import type { APIRoute } from 'astro'
import { type AgentSpec, parse, syncAgentWithIdentity, syncWorld, toTypeDB, type WorldSpec } from '@/engine/agent-md'

export const POST: APIRoute = async ({ request }) => {
  const { requireRole } = await import('@/lib/api-auth')
  const gate = await requireRole(request, 'add_unit', { gate: 'stage-4' })
  if (!gate.ok) return gate.res
  try {
    const body = (await request.json()) as any

    // Single agent markdown
    if (body.markdown) {
      const spec = await syncAgentWithIdentity(parse(body.markdown))
      return Response.json({
        ok: true,
        agent: spec.name,
        uid: spec.group ? `${spec.group}:${spec.name}` : spec.name,
        wallet: spec.wallet || null,
        suiObjectId: spec.suiObjectId || null,
        skills: spec.skills?.map((s) => s.name) || [],
      })
    }

    // Multiple agents (world)
    if (body.agents && Array.isArray(body.agents)) {
      const worldName = body.world || 'default'
      const agents: AgentSpec[] = body.agents.map((a: { name?: string; content: string }) => {
        const spec = parse(a.content)
        spec.group = worldName
        return spec
      })

      const worldSpec: WorldSpec = {
        name: worldName,
        description: body.description,
        agents,
      }

      // Sync world structure to TypeDB first
      await syncWorld(worldSpec)

      // Then derive identity for each agent (Sui keypair + on-chain Unit)
      const results = await Promise.all(agents.map((a) => syncAgentWithIdentity(a).catch(() => a)))

      return Response.json({
        ok: true,
        world: worldName,
        agents: results.map((a) => ({
          name: a.name,
          uid: `${worldName}:${a.name}`,
          wallet: a.wallet || null,
          suiObjectId: a.suiObjectId || null,
          skills: a.skills?.map((s) => s.name) || [],
        })),
      })
    }

    return Response.json({ error: 'Invalid body. Provide markdown or agents[]' }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}

// GET: Generate TypeDB queries without executing (dry run)
export const GET: APIRoute = async ({ url }) => {
  const markdown = url.searchParams.get('markdown')
  if (!markdown) {
    return Response.json({ error: 'Provide ?markdown= query param' }, { status: 400 })
  }

  const spec = parse(decodeURIComponent(markdown))
  const queries = toTypeDB(spec)

  return Response.json({
    spec,
    queries,
  })
}
