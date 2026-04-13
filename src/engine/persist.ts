/**
 * ONE — The world
 *
 * Colony + TypeDB persistence + knowledge.
 * One layer. No wrapping.
 */

import { parseAnswers, read, readParsed, writeSilent } from '@/lib/typedb'
import { mirrorActor, mirrorMark, mirrorWarn } from './bridge'
import { type DocKey, ingestDocs, loadContext } from './context'
import { world as createWorld, type Signal, type World } from './world'

export type Insight = { pattern: string; confidence: number }

const escapeStr = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

// Standalone export so state.ts and other callers can use it without a world instance.
// O(1) — reads from in-memory maps only. Never touches TypeDB.
// Cold-start protection: requires enough samples before blocking.
export const isToxic = (
  edge: string,
  strength: Record<string, number>,
  resistance: Record<string, number>,
): boolean => {
  const s = strength[edge] || 0
  const r = resistance[edge] || 0
  return r >= 10 && r > s * 2 && r + s > 5
}

export type TaskMatch = {
  id: string
  name: string
  priority: number
  tags: string[]
  overlap: number
  strength: number
}

export interface PersistentWorld extends World {
  actor: (id: string, kind?: string, opts?: { group?: string }) => ReturnType<World['add']>
  group: (id: string, type?: string, opts?: { parent?: string }) => void
  thing: (id: string, opts?: { price?: number; tags?: string[]; description?: string }) => void
  flow: (from: string, to: string) => { strengthen: (n?: number) => void; resist: (n?: number) => void }
  path: (from: string, to: string) => { strengthen: (n?: number) => void; resist: (n?: number) => void }
  open: (n?: number) => { from: string; to: string; strength: number }[]
  blocked: () => { from: string; to: string }[]
  toxic: () => { path: string; strength: number; resistance: number }[]
  best: (type: string) => string | null
  proven: () => { id: string; strength: number }[]
  confidence: (type: string) => number
  know: () => Promise<Insight[]>
  recall: (match?: string) => Promise<Insight[]>
  span: () => Promise<number>
  context: (keys: (DocKey | string)[]) => string
  subscribe: (unitId: string, tags: string[]) => void
  tasksFor: (unitId: string) => Promise<TaskMatch[]>
  sync: () => Promise<void>
  load: () => Promise<void>
}

export const world = (): PersistentWorld => {
  const net = createWorld()

  // ── TypeDB-synced pheromone ────────────────────────────────────────────

  const mark = (edge: string, strength = 1) => {
    net.mark(edge, strength)
    const [from, to] = edge.split('→')
    if (!from || !to) return
    writeSilent(`
      match $from isa unit, has uid "${from.trim()}"; $to isa unit, has uid "${to.trim()}";
      $e (source: $from, target: $to) isa path, has strength $s, has traversals $t;
      delete $s of $e; delete $t of $e;
      insert $e has strength ($s + ${strength}), has traversals ($t + 1);
    `)
    // Mirror to Sui (fire-and-forget)
    mirrorMark(from.trim(), to.trim(), strength).catch(() => {})
  }

  const warn = (edge: string, strength = 1) => {
    net.warn(edge, strength)
    const [from, to] = edge.split('→')
    if (!from || !to) return
    writeSilent(`
      match $from isa unit, has uid "${from.trim()}"; $to isa unit, has uid "${to.trim()}";
      $e (source: $from, target: $to) isa path, has resistance $a;
      delete $a of $e; insert $e has resistance ($a + ${strength});
    `)
    // Mirror to Sui (fire-and-forget)
    mirrorWarn(from.trim(), to.trim(), strength).catch(() => {})
  }

  const fade = (rate = 0.1) => {
    net.fade(rate)
    writeSilent(`
      match $e isa path, has strength $s, has resistance $a;
      delete $s of $e; delete $a of $e;
      insert $e has strength ($s * ${1 - rate}), has resistance ($a * ${1 - rate * 2});
    `)
  }

  const enqueue = (s: Signal) => {
    net.enqueue(s)
    const uid = s.receiver.includes(':') ? s.receiver.split(':')[0] : s.receiver
    const data = s.data ? JSON.stringify(s.data).replace(/"/g, '\\"') : ''
    writeSilent(`
      match $from isa unit, has uid "loop"; $to isa unit, has uid "${uid}";
      insert (sender: $from, receiver: $to) isa signal,
        has data "${data}", has amount 0.0, has success false,
        has ts ${new Date().toISOString().replace('Z', '')};
    `)
  }

  // ── Hydration ─────────────────────────────────────────────────────────

  const load = async () => {
    const answers = await read(`
      match $e (source: $from, target: $to) isa path, has strength $s, has resistance $a;
      $from has uid $fid; $to has uid $tid; select $fid, $tid, $s, $a;
    `)
    for (const row of parseAnswers(answers)) {
      net.strength[`${row.fid}→${row.tid}`] = row.s as number
      if ((row.a as number) > 0) net.resistance[`${row.fid}→${row.tid}`] = row.a as number
    }
    const pending = await read(`
      match (sender: $f, receiver: $to) isa signal, has success false, has data $d;
      $to has uid $tid; select $tid, $d;
    `).catch(() => '[]')
    for (const row of parseAnswers(pending as unknown[])) {
      net.enqueue({ receiver: row.tid as string, data: row.d })
    }
  }

  const sync = async () => {
    for (const [edge, str] of Object.entries(net.strength)) {
      const [from, to] = edge.split('→')
      if (!from || !to) continue
      writeSilent(`
        match $from isa unit, has uid "${from.trim()}"; $to isa unit, has uid "${to.trim()}";
        not { (source: $from, target: $to) isa path; };
        insert (source: $from, target: $to) isa path,
          has strength ${str}, has resistance ${net.resistance[edge] || 0}, has traversals 0, has revenue 0.0;
      `)
    }
  }

  // ── World layer ───────────────────────────────────────────────────────

  const actor = (id: string, kind = 'agent', opts?: { group?: string }) => {
    if (!id) return net.add(id)
    const uid = opts?.group ? `${opts.group}/${id}` : id
    writeSilent(`
      insert $u isa unit, has uid "${uid}", has name "${id}", has unit-kind "${kind}", has status "active",
        has success-rate 0.5, has activity-score 0.0, has sample-count 0,
        has reputation 0.0, has balance 0.0, has generation 0;
    `).catch(() => {})
    // Mirror to Sui (fire-and-forget)
    mirrorActor(uid, id).catch(() => {})
    return net.add(uid)
  }

  const group = (id: string, type = 'team', opts?: { parent?: string }) => {
    writeSilent(`
      insert $g isa group, has gid "${id}", has name "${id}",
        has group-type "${type}", has status "active";
    `).catch(() => {})
    if (opts?.parent) {
      writeSilent(`
        match $p isa group, has gid "${opts.parent}"; $c isa group, has gid "${id}";
        insert (parent: $p, child: $c) isa hierarchy;
      `).catch(() => {})
    }
  }

  const thing = (id: string, opts?: { price?: number; tags?: string[]; description?: string }) => {
    const tagStr = opts?.tags?.map((t) => `has tag "${t}"`).join(', ') || ''
    writeSilent(`
      insert $s isa skill, has skill-id "${id}", has name "${id}",
        has price ${opts?.price || 0}${opts?.description ? `, has description "${escapeStr(opts.description)}"` : ''}${tagStr ? `, ${tagStr}` : ''};
    `).catch(() => {})
  }

  const flow = (from: string, to: string) => ({
    strengthen: (n = 1) => mark(`${from}→${to}`, n),
    resist: (n = 1) => warn(`${from}→${to}`, n),
  })

  const path = flow

  const open = (n = 10) =>
    net.highways(n).map((h) => {
      const [from, to] = h.path.split('→')
      return { from, to, strength: h.strength }
    })

  const blocked = () =>
    Object.entries(net.resistance)
      .filter(([e, a]) => a > (net.strength[e] || 0))
      .map(([e]) => {
        const [from, to] = e.split('→')
        return { from, to }
      })

  // toxic: all paths currently meeting the isToxic threshold — useful for UI
  const toxic = () =>
    Object.keys({ ...net.strength, ...net.resistance })
      .filter((e) => checkToxic(e))
      .map((e) => ({ path: e, strength: net.strength[e] || 0, resistance: net.resistance[e] || 0 }))

  // best: highest net strength targeting this type
  const best = (type: string): string | null => {
    let bestId: string | null = null
    let bestNet = 0
    for (const [edge, s] of Object.entries(net.strength)) {
      const target = edge.split('→')[1]?.split(':')[0]
      if (target !== type) continue
      const n = s - (net.resistance[edge] || 0)
      if (n > bestNet) {
        bestId = target
        bestNet = n
      }
    }
    return bestId
  }

  // proven: actors with aggregate strength >= 20
  const proven = (): { id: string; strength: number }[] => {
    const totals = new Map<string, number>()
    for (const [edge, s] of Object.entries(net.strength)) {
      const target = edge.split('→')[1]?.split(':')[0]
      if (target) totals.set(target, (totals.get(target) || 0) + s)
    }
    return [...totals.entries()]
      .filter(([, s]) => s >= 20)
      .sort(([, a], [, b]) => b - a)
      .map(([id, strength]) => ({ id, strength }))
  }

  // confidence: strength / (strength + resistance) for edges targeting this type
  const confidence = (type: string): number => {
    let totalS = 0,
      totalR = 0
    for (const [edge, s] of Object.entries(net.strength)) {
      const target = edge.split('→')[1]?.split(':')[0]
      if (target !== type) continue
      totalS += s
      totalR += net.resistance[edge] || 0
    }
    const total = totalS + totalR
    return total > 0 ? totalS / total : 0
  }

  const know = async (): Promise<Insight[]> => {
    const strong = net.highways(100).filter((h) => h.strength >= 20)
    writeSilent(`
      match $p isa path, has strength $s, has fade-rate $fr; $s >= 50.0; $fr > 0.01;
      delete $fr of $p; insert $p has fade-rate 0.01;
    `).catch(() => {})
    return strong.map((h) => ({ pattern: h.path, confidence: Math.min(1, h.strength / 50) }))
  }

  const recall = async (match?: string): Promise<Insight[]> => {
    // Query confirmed/testing hypotheses (engine-generated knowledge)
    const confirmedQ = match
      ? `match $h isa hypothesis, has statement $s, has p-value $p, has hypothesis-status $st; $s contains "${match}"; { $st = "confirmed"; } or { $st = "testing"; }; select $s, $p;`
      : `match $h isa hypothesis, has statement $s, has p-value $p, has hypothesis-status $st; { $st = "confirmed"; } or { $st = "testing"; }; select $s, $p;`

    // Also query pending hypotheses (promoted domain knowledge from JSONL corpus)
    const pendingQ = match
      ? `match $h isa hypothesis, has statement $s, has p-value $p, has hypothesis-status "pending"; $s contains "${match}"; select $s, $p;`
      : `match $h isa hypothesis, has statement $s, has p-value $p, has hypothesis-status "pending"; select $s, $p;`

    const [confirmedRows, pendingRows] = await Promise.all([
      readParsed(confirmedQ).catch(() => [] as Record<string, unknown>[]),
      match
        ? readParsed(pendingQ).catch(() => [] as Record<string, unknown>[])
        : Promise.resolve([] as Record<string, unknown>[]),
    ])

    // Confirmed/testing get full confidence boost; pending start at 0.5 (p-value 0.5 → confidence 0.5)
    const confirmed = confirmedRows.map((r) => ({ pattern: r.s as string, confidence: 1 - (r.p as number) }))
    const pending = pendingRows.map((r) => ({ pattern: r.s as string, confidence: 1 - (r.p as number) }))

    // Merge: confirmed first, then pending (deduped by pattern)
    const seen = new Set(confirmed.map((i) => i.pattern))
    const merged = [...confirmed, ...pending.filter((i) => !seen.has(i.pattern))]
    return merged
  }

  // span: ingest docs to TypeDB as confirmed hypotheses
  const span = async (): Promise<number> => ingestDocs()

  // context: load docs as merged markdown for agent prompts
  const context = (keys: (DocKey | string)[]): string => loadContext(keys)

  // ── The sandwich: TypeDB validates before and after LLM ─────────────

  // Delegates to the exported standalone isToxic for O(1) in-memory check.
  const checkToxic = (edge: string) => isToxic(edge, net.strength, net.resistance)

  const signal = (s: Signal, from = 'entry') => {
    const edge = `${from}→${s.receiver}`
    if (checkToxic(edge)) {
      console.log(`[TOXIC] blocked: ${edge}`)
      return
    }
    const uid = s.receiver.includes(':') ? s.receiver.split(':')[0] : s.receiver
    if (net.has(uid)) {
      writeSilent(`
        match $u isa unit, has uid "${uid}", has sample-count $sc;
        delete $sc of $u; insert $u has sample-count ($sc + 1);
      `)
      writeSilent(`
        match $u isa unit, has uid "${uid}";
        not { $u has sample-count; };
        insert $u has sample-count 1;
      `)
    }
    net.signal(s, from)
  }

  const ask = async (s: Signal, from = 'entry', timeout?: number) => {
    const edge = `${from}→${s.receiver}`
    if (checkToxic(edge)) {
      console.log(`[TOXIC] blocked: ${edge}`)
      return { dissolved: true }
    }
    // Pre-check: capability exists? (TypeDB)
    const uid = s.receiver.includes(':') ? s.receiver.split(':')[0] : s.receiver
    const skill = s.receiver.includes(':') ? s.receiver.split(':')[1] : null
    if (skill) {
      const ok = await readParsed(
        `match $u isa unit, has uid "${uid}"; $sk isa skill, has skill-id "${skill}";
         (provider: $u, offered: $sk) isa capability; select $u;`,
      ).catch(() => [])
      if (!ok.length) return { dissolved: true }
    }
    const outcome = await net.ask(s, from, timeout)
    if (!outcome.dissolved) {
      writeSilent(`
        match $u isa unit, has uid "${uid}", has sample-count $sc;
        delete $sc of $u; insert $u has sample-count ($sc + 1);
      `)
      writeSilent(`
        match $u isa unit, has uid "${uid}";
        not { $u has sample-count; };
        insert $u has sample-count 1;
      `)
    }
    return outcome
  }

  // ── Tag subscription ───────────────────────────────────────────────────

  // subscribe: add tags to a unit so it receives matching tasks
  const subscribe = (unitId: string, tags: string[]) => {
    for (const tag of tags) {
      writeSilent(`
        match $u isa unit, has uid "${unitId}";
        insert $u has tag "${escapeStr(tag)}";
      `).catch(() => {})
    }
  }

  // tasksFor: find open tasks matching a unit's tags, ranked by overlap × pheromone
  const tasksFor = async (unitId: string): Promise<TaskMatch[]> => {
    // Get unit's tags
    const unitTags = await readParsed(`
      match $u isa unit, has uid "${unitId}", has tag $tag;
      select $tag;
    `).catch(() => [])
    const tags = unitTags.map((r) => r.tag as string)
    if (!tags.length) return []

    // Find open tasks sharing at least one tag
    const tagFilter = tags.map((t) => `"${t}"`).join(', ')
    const rows = await readParsed(`
      match $t isa task, has task-id $id, has name $name, has done false,
        has priority-score $p, has task-status "open", has tag $tag;
      $tag in [${tagFilter}];
      select $id, $name, $p, $tag;
    `).catch(() => [])

    // Group by task, count tag overlap
    const taskMap = new Map<string, { name: string; priority: number; tags: string[]; overlap: number }>()
    for (const r of rows) {
      const id = r.id as string
      const entry = taskMap.get(id) || { name: r.name as string, priority: r.p as number, tags: [], overlap: 0 }
      entry.tags.push(r.tag as string)
      entry.overlap++
      taskMap.set(id, entry)
    }

    // Score: overlap × priority + pheromone strength
    return [...taskMap.entries()]
      .map(([id, t]) => {
        const edge = `${unitId}→builder:${id}`
        const strength = net.sense(edge)
        return { id, name: t.name, priority: t.priority, tags: t.tags, overlap: t.overlap, strength }
      })
      .sort((a, b) => b.overlap * b.priority + b.strength - (a.overlap * a.priority + a.strength))
  }

  return {
    ...net,
    mark,
    warn,
    fade,
    enqueue,
    signal,
    ask,
    actor,
    group,
    thing,
    flow,
    path,
    open,
    blocked,
    toxic,
    best,
    proven,
    confidence,
    know,
    recall,
    span,
    context,
    subscribe,
    tasksFor,
    sync,
    load,
  }
}
