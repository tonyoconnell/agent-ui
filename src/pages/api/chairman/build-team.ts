/**
 * POST /api/chairman/build-team
 *
 * Signal the CEO to fan out 3 hire signals (cto, cmo, cfo) in parallel.
 * Uses the in-memory world directly — does not go through TypeDB LLM routing.
 *
 * Returns: { ok: true, building: string[] }
 */
import type { APIRoute } from 'astro'
import { parse, syncAgentWithIdentity } from '@/engine/agent-md'

const roleTemplates = import.meta.glob('../../../../agents/roles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

import { registerChairman } from '@/engine/chairman'
import { getNet } from '@/lib/net'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const net = await getNet()

  // Ensure chairman handlers are wired (idempotent)
  registerChairman(net)

  // Check CEO exists in TypeDB — sync if not already live
  const markdown = Object.entries(roleTemplates).find(([p]) => p.endsWith('/ceo.md'))?.[1] ?? null
  if (markdown && !net.has('ceo')) {
    await syncAgentWithIdentity(parse(markdown))
  }

  // Parse optional roles from request body
  let roles: string[] = ['cto', 'cmo', 'cfo']
  try {
    const body = (await request.json().catch(() => ({}))) as { roles?: string[] }
    if (Array.isArray(body.roles) && body.roles.length > 0) {
      roles = body.roles.filter((r): r is string => typeof r === 'string' && r.length > 0)
    }
  } catch {
    // body optional — fall back to defaults
  }

  // Fan out via ask so the response reflects actual signal output
  const outcome = await net.ask({ receiver: 'ceo:build-team', data: { roles } })
  const building = (outcome.result as { building?: string[] })?.building ?? roles

  return Response.json({ ok: true, building })
}
