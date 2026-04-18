/**
 * POST /api/agents/:id/authorize — delegation = pheromone.
 * Seeds path from caller to agent with strength 0.5; optional scope (private|group|public).
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { readParsed, write, writeSilent } from '@/lib/typedb'

export const prerender = false

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

export const POST: APIRoute = async ({ request, params }) => {
  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agentId = params.id
  if (!agentId) {
    return Response.json({ error: 'Missing agent id' }, { status: 400 })
  }

  let body: { scope?: string; strength?: number } = {}
  try {
    body = await request.json()
  } catch {
    // empty body — use defaults
  }

  const strength = typeof body.strength === 'number' ? body.strength : 0.5
  const scope = body.scope as 'private' | 'group' | 'public' | undefined

  if (scope !== undefined && !['private', 'group', 'public'].includes(scope)) {
    return Response.json({ error: 'scope must be private, group, or public' }, { status: 400 })
  }

  // Verify agent exists
  const agentRows = await readParsed(`match $a isa unit, has uid "${esc(agentId)}"; select $a;`).catch(() => [])

  if (agentRows.length === 0) {
    return Response.json({ error: `Agent "${agentId}" not found` }, { status: 404 })
  }

  try {
    // Idempotent path seed: increment existing strength or insert new path
    const scopeAttr = scope ? `, has scope "${esc(scope)}"` : ''

    try {
      await write(
        `match $from isa unit, has uid "${esc(ctx.user)}"; ` +
          `$to isa unit, has uid "${esc(agentId)}"; ` +
          `$e (source: $from, target: $to) isa path, has strength $s; ` +
          `delete $s of $e; ` +
          `insert $e has strength ($s + ${strength});`,
      )
    } catch {
      // Path doesn't exist yet — insert fresh
      await write(
        `match $from isa unit, has uid "${esc(ctx.user)}"; ` +
          `$to isa unit, has uid "${esc(agentId)}"; ` +
          `insert (source: $from, target: $to) isa path, ` +
          `has strength ${strength}, has resistance 0.0, has traversals 0, has revenue 0.0${scopeAttr};`,
      )
    }

    // If scope provided, update it on an existing path (best-effort)
    if (scope) {
      write(
        `match $from isa unit, has uid "${esc(ctx.user)}"; ` +
          `$to isa unit, has uid "${esc(agentId)}"; ` +
          `$e (source: $from, target: $to) isa path, has scope $old; ` +
          `delete $old of $e; ` +
          `insert $e has scope "${esc(scope)}";`,
      ).catch(() =>
        writeSilent(
          `match $from isa unit, has uid "${esc(ctx.user)}"; ` +
            `$to isa unit, has uid "${esc(agentId)}"; ` +
            `$e (source: $from, target: $to) isa path; ` +
            `insert $e has scope "${esc(scope)}";`,
        ),
      )
    }

    return Response.json({
      ok: true,
      from: ctx.user,
      to: agentId,
      strength,
      scope: scope ?? null,
    })
  } catch (err) {
    console.error('[authorize] failed:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
