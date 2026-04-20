/**
 * POST /api/chairman/hire
 *
 * Chairman hires a new agent by role. Reads role markdown from agents/roles/<role>.md,
 * syncs to TypeDB (+ Sui if configured), optionally creates chairman membership.
 *
 * Body: { role: string, owner?: string, markdown?: string }
 * Returns: { unit: { uid, wallet, skills }, paths: [] }
 */
import type { APIRoute } from 'astro'
import { type AgentSpec, parse, syncAgentWithIdentity } from '@/engine/agent-md'
import { registerChairman } from '@/engine/chairman'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getNet } from '@/lib/net'
import { writeSilent } from '@/lib/typedb'

const roleTemplates = import.meta.glob('../../../../agents/roles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  // Trust session for owner identity (C1.4 — never trust request-body owner)
  const ctx = await resolveUnitFromSession(request, locals)
  if (!ctx.isValid) {
    return Response.json({ error: 'Unauthorized — sign in first' }, { status: 401 })
  }
  const owner = ctx.user

  let role: string, customMarkdown: string | undefined
  try {
    const body = (await request.json()) as { role?: string; markdown?: string }
    role = body.role ?? ''
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
    const entry = Object.entries(roleTemplates).find(([path]) => path.endsWith(`/${role}.md`))
    const template = entry?.[1]
    if (!template) {
      return Response.json({ dissolved: true, error: `No role template for: ${role}` }, { status: 404 })
    }
    markdown = template
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
      insert (group: $g, member: $u) isa membership, has member-role "chairman";
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
