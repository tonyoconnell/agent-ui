/**
 * POST /api/seed/marketing — Seed the marketing team
 *
 * Creates: 1 world (group), 8 agents, 12 skills, 8 capabilities, 13 paths
 * Idempotent: checks for existing marketing group before inserting.
 */
import type { APIRoute } from 'astro'
import { readParsed, write } from '@/lib/typedb'

const MARKETING_UNITS = [
  { uid: 'marketing:director', name: 'director', tags: ['marketing', 'strategy', 'routing'] },
  { uid: 'marketing:creative', name: 'creative', tags: ['marketing', 'creative', 'copy'] },
  { uid: 'marketing:media-buyer', name: 'media-buyer', tags: ['marketing', 'ads', 'media'] },
  { uid: 'marketing:seo', name: 'seo', tags: ['marketing', 'seo', 'organic'] },
  { uid: 'marketing:content', name: 'content', tags: ['marketing', 'content', 'blog'] },
  { uid: 'marketing:social', name: 'social', tags: ['marketing', 'social', 'community'] },
  { uid: 'marketing:analyst', name: 'analyst', tags: ['marketing', 'analytics', 'metrics'] },
  { uid: 'marketing:ads', name: 'ads', tags: ['marketing', 'ads', 'campaigns'] },
]

const SKILLS = [
  { id: 'marketing:strategize', name: 'strategize', price: 0.05, provider: 'marketing:director' },
  { id: 'marketing:allocate', name: 'allocate', price: 0.02, provider: 'marketing:director' },
  { id: 'marketing:copy', name: 'copy', price: 0.02, provider: 'marketing:creative' },
  { id: 'marketing:concept', name: 'concept', price: 0.03, provider: 'marketing:creative' },
  { id: 'marketing:plan', name: 'plan', price: 0.03, provider: 'marketing:media-buyer' },
  { id: 'marketing:launch', name: 'launch', price: 0.02, provider: 'marketing:media-buyer' },
  { id: 'marketing:optimize', name: 'optimize', price: 0.02, provider: 'marketing:media-buyer' },
  { id: 'marketing:keywords', name: 'keywords', price: 0.02, provider: 'marketing:seo' },
  { id: 'marketing:blog', name: 'blog', price: 0.03, provider: 'marketing:content' },
  { id: 'marketing:post', name: 'post', price: 0.01, provider: 'marketing:social' },
  { id: 'marketing:report', name: 'report', price: 0.02, provider: 'marketing:analyst' },
  { id: 'marketing:setup', name: 'setup', price: 0.02, provider: 'marketing:ads' },
]

const COLLAB_PATHS = [
  ['marketing:creative', 'marketing:media-buyer'],
  ['marketing:media-buyer', 'marketing:creative'],
  ['marketing:seo', 'marketing:content'],
  ['marketing:content', 'marketing:social'],
  ['marketing:media-buyer', 'marketing:ads'],
  ['marketing:ads', 'marketing:analyst'],
  ['marketing:analyst', 'marketing:director'],
]

export const POST: APIRoute = async () => {
  const results: string[] = []

  // Check if marketing group exists
  const existing = await readParsed(`
    match $g isa group, has gid "marketing"; select $g;
  `).catch(() => [])

  if (existing.length > 0) {
    return Response.json({
      seeded: false,
      message: 'Marketing team already exists.',
    })
  }

  // Create marketing world (group)
  await write(`
    insert $g isa group,
      has gid "marketing",
      has name "Marketing Team",
      has purpose "AI marketing department using weight-based routing",
      has group-type "world",
      has status "active";
  `).catch((e) => results.push(`Group error: ${e.message}`))
  results.push('Marketing group created')

  // Create units
  for (const u of MARKETING_UNITS) {
    const tagStr = u.tags.map((t) => `has tag "${t}"`).join(', ')
    await write(`
      insert $u isa unit,
        has uid "${u.uid}",
        has name "${u.name}",
        has unit-kind "agent",
        has model "claude-sonnet-4-20250514",
        has status "active",
        has success-rate 0.5,
        has activity-score 0.0,
        has sample-count 0,
        has reputation 0.0,
        has balance 0.0,
        has generation 0,
        ${tagStr};
    `).catch((e) => results.push(`Unit ${u.uid} error: ${e.message}`))
  }
  results.push(`${MARKETING_UNITS.length} units created`)

  // Create memberships
  for (const u of MARKETING_UNITS) {
    await write(`
      match $g isa group, has gid "marketing"; $u isa unit, has uid "${u.uid}";
      insert (group: $g, member: $u) isa membership;
    `).catch(() => {})
  }
  results.push('Memberships created')

  // Create skills and capabilities
  for (const s of SKILLS) {
    await write(`
      insert $s isa skill,
        has skill-id "${s.id}",
        has name "${s.name}",
        has price ${s.price};
    `).catch(() => {})

    await write(`
      match $u isa unit, has uid "${s.provider}";
            $s isa skill, has skill-id "${s.id}";
      insert (provider: $u, offered: $s) isa capability, has price ${s.price};
    `).catch(() => {})
  }
  results.push(`${SKILLS.length} skills + capabilities created`)

  // Create director paths to all others
  const director = 'marketing:director'
  for (const u of MARKETING_UNITS) {
    if (u.uid !== director) {
      await write(`
        match $from isa unit, has uid "${director}"; $to isa unit, has uid "${u.uid}";
        insert (source: $from, target: $to) isa path,
          has strength 1.0, has resistance 0.0, has traversals 0, has revenue 0.0;
      `).catch(() => {})
    }
  }
  results.push('Director paths created')

  // Create collaboration paths
  for (const [from, to] of COLLAB_PATHS) {
    await write(`
      match $from isa unit, has uid "${from}"; $to isa unit, has uid "${to}";
      insert (source: $from, target: $to) isa path,
        has strength 1.0, has resistance 0.0, has traversals 0, has revenue 0.0;
    `).catch(() => {})
  }
  results.push(`${COLLAB_PATHS.length} collaboration paths created`)

  // Verify
  const units = await readParsed('match $u isa unit, has tag "marketing", has uid $uid; select $uid;').catch(() => [])
  const paths = await readParsed(`
    match $e (source: $s, target: $t) isa path;
          $s has uid $sid; $t has uid $tid;
          $sid contains "marketing";
    select $sid, $tid; limit 20;
  `).catch(() => [])

  return Response.json({
    seeded: true,
    created: results,
    stats: {
      units: units.length,
      paths: paths.length,
    },
    timestamp: new Date().toISOString(),
  })
}

export const GET: APIRoute = async () => {
  const units = await readParsed(`
    match $u isa unit, has tag "marketing", has uid $uid, has name $n;
    select $uid, $n;
  `).catch(() => [])

  const paths = await readParsed(`
    match $e (source: $s, target: $t) isa path, has strength $str;
          $s has uid $sid; $t has uid $tid;
          $sid contains "marketing";
    select $sid, $tid, $str;
  `).catch(() => [])

  const skills = await readParsed(`
    match $s isa skill, has skill-id $id, has name $n, has price $p;
          $id contains "marketing";
    select $id, $n, $p;
  `).catch(() => [])

  return Response.json({
    ok: true,
    marketing: {
      units: units.length,
      paths: paths.length,
      skills: skills.length,
    },
    data: { units, paths, skills },
  })
}
