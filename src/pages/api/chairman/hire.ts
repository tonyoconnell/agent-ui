/**
 * POST /api/chairman/hire
 *
 * Chairman hires a new agent by role. Reads role markdown from agents/roles/<role>.md,
 * syncs to TypeDB (+ Sui if configured), optionally creates chairman membership.
 *
 * Body: { role: string, owner?: string, markdown?: string }
 * Returns: { unit: { uid, wallet, skills }, paths: [] }
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { APIRoute } from 'astro'
import { type AgentSpec, parse, syncAgentWithIdentity } from '@/engine/agent-md'
import { registerChairman } from '@/engine/chairman'
import { getNet } from '@/lib/net'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  let role: string, owner: string | undefined, customMarkdown: string | undefined

  try {
    const body = (await request.json()) as { role?: string; owner?: string; markdown?: string }
    role = body.role ?? ''
    owner = body.owner
    customMarkdown = body.markdown
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!role) {
    return Response.json({ error: 'role is required' }, { status: 400 })
  }

  let markdown: string
  if (customMarkdown) {
    markdown = customMarkdown
  } else {
    try {
      const rolePath = join(process.cwd(), 'agents', 'roles', `${role}.md`)
      markdown = await readFile(rolePath, 'utf-8')
    } catch {
      return Response.json({ dissolved: true, error: `No role template for: ${role}` }, { status: 404 })
    }
  }

  let spec: AgentSpec
  try {
    spec = await syncAgentWithIdentity(parse(markdown))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'sync failed'
    return Response.json({ error: msg }, { status: 500 })
  }

  const uid = spec.group ? `${spec.group}:${spec.name}` : spec.name
  const groupId = spec.group ?? spec.name

  // Wire recursive hire handlers onto this unit in the singleton world
  const net = await getNet()
  registerChairman(net)

  // Link owner as chairman of this agent's group
  if (owner) {
    await writeSilent(`
      match $g isa group, has gid "${groupId}";
            $u isa unit, has uid "${owner}";
      insert (group: $g, member: $u) isa membership, has role "chairman";
    `).catch(() => {})
  }

  return Response.json({
    unit: {
      uid,
      wallet: spec.wallet ?? null,
      skills: spec.skills?.map((s) => s.name) ?? [],
    },
    paths: [],
  })
}
