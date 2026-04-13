/**
 * POST /api/team — Create a team (group + agents + flows)
 *
 * Body: {
 *   teamName: string,
 *   agents: Array<{ name, task, emitsTo, model }>,
 *   brief?: string
 * }
 *
 * Creates: group + units + membership + paths in TypeDB.
 * Maps to: w.group() → w.actor() → w.flow() → w.signal()
 */
import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const { teamName, agents, brief } = (await request.json()) as {
    teamName: string
    agents: Array<{
      name: string
      task: string
      emitsTo: string
      model: string
    }>
    brief?: string
  }

  if (!teamName) {
    return new Response(JSON.stringify({ error: 'Missing team name' }), { status: 400 })
  }

  if (!agents || agents.length < 2) {
    return new Response(JSON.stringify({ error: 'A team needs at least 2 agents' }), { status: 400 })
  }

  const safeTeam = teamName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 32)
  if (!safeTeam) {
    return new Response(JSON.stringify({ error: 'Invalid team name' }), { status: 400 })
  }

  try {
    // 1. Create the group
    await write(`
      insert
        $g isa group,
          has gid "${safeTeam}",
          has name "${safeTeam}",
          has group-type "team",
          has status "active";
    `)

    // 2. Create each agent unit + membership + skill + capability
    for (const agent of agents) {
      const safeName = agent.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 32)
      const safeTask = agent.task
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 64)
      const model = agent.model || 'sonnet'
      const uid = `${safeTeam}-${safeName}`
      const skillId = `${uid}:${safeTask}`

      // Create unit
      await write(`
        insert
          $u isa unit,
            has uid "${uid}",
            has name "${safeName}",
            has unit-kind "agent",
            has model "${model}",
            has status "active",
            has tag "${safeTeam}",
            has balance 0.0,
            has reputation 0.0,
            has success-rate 0.5,
            has activity-score 0.0,
            has sample-count 0;
      `)

      // Add to group
      await write(`
        match
          $g isa group, has gid "${safeTeam}";
          $u isa unit, has uid "${uid}";
        insert
          (group: $g, member: $u) isa membership;
      `)

      // Create skill + capability
      await write(`
        insert
          $s isa skill,
            has skill-id "${skillId}",
            has name "${safeTask}",
            has tag "${safeTeam}",
            has price 0.0,
            has currency "SUI";
      `).catch(() => {}) // may exist

      await write(`
        match
          $u isa unit, has uid "${uid}";
          $s isa skill, has skill-id "${skillId}";
        insert
          (provider: $u, offered: $s) isa capability,
            has price 0.0;
      `)
    }

    // 3. Create paths (flows) between agents
    for (const agent of agents) {
      if (!agent.emitsTo) continue
      const sourceName = agent.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 32)
      const targetName = agent.emitsTo.includes(':')
        ? agent.emitsTo
            .split(':')[0]
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
        : agent.emitsTo.toLowerCase().replace(/[^a-z0-9-]/g, '')
      const sourceUid = `${safeTeam}-${sourceName}`
      const targetUid = `${safeTeam}-${targetName}`

      await write(`
        match
          $s isa unit, has uid "${sourceUid}";
          $t isa unit, has uid "${targetUid}";
        insert
          (source: $s, target: $t) isa path,
            has strength 1.0,
            has resistance 0.0,
            has traversals 0,
            has revenue 0.0;
      `).catch(() => {}) // path may already exist
    }

    // 4. Log the initial signal if brief provided
    if (brief) {
      const firstAgent = agents[0]
      const safeName = firstAgent.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 32)
      const firstUid = `${safeTeam}-${safeName}`

      await write(`
        match
          $r isa unit, has uid "${firstUid}";
        insert
          (receiver: $r) isa signal,
            has data "${brief.replace(/"/g, '\\"').slice(0, 500)}",
            has success true;
      `).catch(() => {}) // signal logging is best-effort
    }

    return new Response(
      JSON.stringify({
        ok: true,
        group: safeTeam,
        agents: agents.map((a) => `${safeTeam}-${a.name.toLowerCase().replace(/[^a-z0-9-]/g, '')}`),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('already') || message.includes('unique') || message.includes('key')) {
      return new Response(JSON.stringify({ error: `Team "${safeTeam}" already exists` }), { status: 409 })
    }
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
