/**
 * POST /api/chairman/build-team
 *
 * Signal the CEO to fan out 3 hire signals (cto, cmo, cfo) in parallel.
 * Uses the in-memory world directly — does not go through TypeDB LLM routing.
 *
 * Returns: { ok: true, building: string[] }
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { APIRoute } from 'astro'
import { parse, syncAgentWithIdentity } from '@/engine/agent-md'
import { registerChairman } from '@/engine/chairman'
import { getNet } from '@/lib/net'

export const prerender = false

export const POST: APIRoute = async () => {
  const net = await getNet()

  // Ensure chairman handlers are wired (idempotent)
  registerChairman(net)

  // Check CEO exists in TypeDB — sync if not already live
  const ceoPath = join(process.cwd(), 'agents', 'roles', 'ceo.md')
  const markdown = await readFile(ceoPath, 'utf-8').catch(() => null)
  if (markdown && !net.has('ceo')) {
    await syncAgentWithIdentity(parse(markdown))
  }

  // Fan out via in-memory signal routing
  net.signal({ receiver: 'ceo:build-team', data: {} })

  return Response.json({ ok: true, building: ['cto', 'cmo', 'cfo'] })
}
