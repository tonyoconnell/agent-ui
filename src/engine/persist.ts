/**
 * ONE — The world
 *
 * Colony + TypeDB persistence + knowledge.
 * One layer. No wrapping.
 */

import { parseAnswers, read, readParsed, writeSilent } from '@/lib/typedb'
import { relayToGateway, wsManager } from '@/lib/ws-server'
import { mirrorActor, mirrorMark, mirrorWarn, settleEscrow } from './bridge'
import { type DocKey, ingestDocs, loadContext } from './context'
import { world as createWorld, type Signal, type World } from './world'

export type Insight = { pattern: string; confidence: number }

export type MemoryCard = {
  actor: { uid: string; kind: string; firstSeen: number }
  hypotheses: Insight[]
  highways: { from: string; to: string; strength: number }[]
  signals: { data: string; success: boolean }[]
  groups: string[]
  capabilities: { skillId: string; name: string; price: number }[]
  frontier: string[]
}

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
  recall: (match?: string | { subject?: string; at?: string }) => Promise<Insight[]>
  reveal: (uid: string) => Promise<MemoryCard>
  forget: (uid: string) => Promise<void>
  frontier: (uid: string) => Promise<string[]>
  taskBlockers: (taskId: string) => Promise<{ id: string; name: string }[]>
  span: () => Promise<number>
  context: (keys: (DocKey | string)[]) => string
  capable: (unitId: string, skillId: string, price?: number) => Promise<void>
  canDeclareCapability: (uid: string) => Promise<boolean>
  canBeDiscovered: (uid: string) => Promise<boolean>
  selfCheckoff: (taskId: string) => Promise<void>
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
    // Broadcast pheromone change to connected TaskBoard clients (task edges only)
    const taskMatch = to.trim().match(/^builder:(.+)$/)
    if (taskMatch?.[1]) {
      const markMsg = { type: 'mark' as const, taskId: taskMatch[1], strength: net.sense(edge), timestamp: Date.now() }
      wsManager.broadcast(markMsg)
      relayToGateway(markMsg) // reach production WS clients via Gateway
    }
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
    // Broadcast pheromone change to connected TaskBoard clients (task edges only)
    const taskMatch = to.trim().match(/^builder:(.+)$/)
    if (taskMatch?.[1]) {
      const warnMsg = {
        type: 'warn' as const,
        taskId: taskMatch[1],
        resistance: net.danger(edge),
        timestamp: Date.now(),
      }
      wsManager.broadcast(warnMsg)
      relayToGateway(warnMsg) // reach production WS clients via Gateway
    }
    writeSilent(`
      match $from isa unit, has uid "${from.trim()}"; $to isa unit, has uid "${to.trim()}";
      $e (source: $from, target: $to) isa path, has resistance $a;
      delete $a of $e; insert $e has resistance ($a + ${strength});
    `)
    // Mirror to Sui (fire-and-forget)
    mirrorWarn(from.trim(), to.trim(), strength).catch(() => {})
  }

  const settle = (
    edge: string,
    opts: { escrowObjectId: string; claimantUid: string; posterUid: string; success?: boolean },
  ) => {
    if (opts.success !== false) {
      mark(edge)
    } else {
      warn(edge)
    }
    settleEscrow(opts.escrowObjectId, opts.claimantUid, opts.posterUid, opts.success !== false)
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

  // E7: frontier — world tags minus tags the actor has touched via paths
  const frontier = async (uid: string): Promise<string[]> => {
    const safeUid = escapeStr(uid)
    const [worldTagRows, actorTagRows] = await Promise.all([
      readParsed(`match $sk isa skill, has tag $t; select $t;`).catch(() => [] as Record<string, unknown>[]),
      readParsed(
        `match $u isa unit, has uid "${safeUid}"; (source: $u, target: $to) isa path; $to has tag $t; select $t;`,
      ).catch(() => [] as Record<string, unknown>[]),
    ])
    const worldTags = new Set(worldTagRows.map((r) => r.t as string))
    const actorTags = new Set(actorTagRows.map((r) => r.t as string))
    return [...worldTags].filter((t) => !actorTags.has(t))
  }

  // E5: reveal — full memory card for a uid across all 6 dimensions
  const reveal = async (uid: string): Promise<MemoryCard> => {
    const safeUid = escapeStr(uid)
    const [unitRows, hypoRows, signalRows, pathRows, groupRows, capRows, frontierTags] = await Promise.all([
      readParsed(`match $u isa unit, has uid "${safeUid}", has unit-kind $k; select $k;`).catch(
        () => [] as Record<string, unknown>[],
      ),
      readParsed(
        `match $h isa hypothesis, has statement $s, has observations-count $n, has hypothesis-status $st;
         $s contains "${safeUid}"; { $st = "confirmed"; } or { $st = "testing"; }; select $s, $n, $st;`,
      ).catch(() => [] as Record<string, unknown>[]),
      readParsed(
        `match $u isa unit, has uid "${safeUid}";
         (sender: $u) isa signal, has data $d, has success $ok; select $d, $ok; limit 200;`,
      ).catch(() => [] as Record<string, unknown>[]),
      readParsed(
        `match $u isa unit, has uid "${safeUid}";
         (source: $u, target: $to) isa path, has strength $s; $to has uid $tid;
         select $tid, $s; sort $s desc; limit 20;`,
      ).catch(() => [] as Record<string, unknown>[]),
      readParsed(
        `match $u isa unit, has uid "${safeUid}";
         (member: $u, group: $g) isa membership; $g has name $gn; select $gn;`,
      ).catch(() => [] as Record<string, unknown>[]),
      readParsed(
        `match $u isa unit, has uid "${safeUid}";
         (provider: $u, offered: $sk) isa capability, has price $p;
         $sk has skill-id $sid, has name $sn; select $sid, $sn, $p;`,
      ).catch(() => [] as Record<string, unknown>[]),
      frontier(uid),
    ])
    return {
      actor: { uid, kind: (unitRows[0]?.k as string) ?? 'unknown', firstSeen: 0 },
      hypotheses: hypoRows.map((r) => ({
        pattern: r.s as string,
        confidence: r.st === 'confirmed' ? 0.9 : 0.5,
      })),
      highways: pathRows.map((r) => ({ from: uid, to: r.tid as string, strength: r.s as number })),
      signals: signalRows.map((r) => ({ data: r.d as string, success: r.ok as boolean })),
      groups: groupRows.map((r) => r.gn as string),
      capabilities: capRows.map((r) => ({
        skillId: r.sid as string,
        name: r.sn as string,
        price: r.p as number,
      })),
      frontier: frontierTags,
    }
  }

  // E6: forget — GDPR erasure: delete all TypeDB records for uid, remove from runtime
  const forget = async (uid: string): Promise<void> => {
    const safeUid = escapeStr(uid)
    // Delete relations first (TypeDB requires entity role-players to be removed before entity delete)
    await Promise.allSettled([
      writeSilent(`match $u isa unit, has uid "${safeUid}"; $sig (sender: $u) isa signal; delete $sig isa signal;`),
      writeSilent(`match $u isa unit, has uid "${safeUid}"; $p (source: $u) isa path; delete $p isa path;`),
      writeSilent(`match $u isa unit, has uid "${safeUid}"; $p (target: $u) isa path; delete $p isa path;`),
      writeSilent(`match $u isa unit, has uid "${safeUid}"; $m (member: $u) isa membership; delete $m isa membership;`),
      writeSilent(
        `match $u isa unit, has uid "${safeUid}"; $cap (provider: $u) isa capability; delete $cap isa capability;`,
      ),
    ])
    await writeSilent(`match $u isa unit, has uid "${safeUid}"; delete $u isa unit;`).catch(() => {})
    // In-memory: remove unit from runtime (orphaned paths decay via L3 fade)
    if (net.has(uid)) net.remove(uid)
  }

  const recall = async (match?: string | { subject?: string; at?: string }): Promise<Insight[]> => {
    // Parse match argument — supports legacy string or new { subject?, at? } object
    const matchStr = typeof match === 'string' ? match : match?.subject
    const atDate = typeof match === 'object' ? match?.at : undefined
    const safeMatch = matchStr ? escapeStr(matchStr) : undefined

    // E9: bi-temporal filter — only hypotheses valid at the given point in time
    const temporalClause = atDate
      ? `$h has valid-from $vf, has valid-until $vu; $vf <= ${atDate}T00:00:00; $vu > ${atDate}T00:00:00;`
      : ''
    const containsClause = safeMatch ? `$s contains "${safeMatch}";` : ''

    // E10: query with source (new records) and without (legacy) — apply asserted confidence cap
    const confirmedWithSrc = readParsed(
      `match $h isa hypothesis, has statement $s, has p-value $p, has hypothesis-status $st, has source $src;
       ${containsClause} { $st = "confirmed"; } or { $st = "testing"; }; ${temporalClause} select $s, $p, $src;`,
    ).catch(() => [] as Record<string, unknown>[])

    const confirmedNoSrc = readParsed(
      `match $h isa hypothesis, has statement $s, has p-value $p, has hypothesis-status $st;
       not { $h has source $anySrc; }; ${containsClause} { $st = "confirmed"; } or { $st = "testing"; };
       ${temporalClause} select $s, $p;`,
    ).catch(() => [] as Record<string, unknown>[])

    const pendingQ = safeMatch
      ? readParsed(
          `match $h isa hypothesis, has statement $s, has p-value $p, has hypothesis-status "pending";
           $s contains "${safeMatch}"; ${temporalClause} select $s, $p;`,
        ).catch(() => [] as Record<string, unknown>[])
      : Promise.resolve([] as Record<string, unknown>[])

    // E11: scope filter — exclude private signals from failed-attempts surfacing
    const failedQ = safeMatch
      ? readParsed(
          `match $sig isa signal, has data $d, has success false;
           $d contains "${safeMatch}"; not { $sig has scope "private"; }; select $d;`,
        ).catch(() => [] as Record<string, unknown>[])
      : Promise.resolve([] as Record<string, unknown>[])

    const [withSrcRows, noSrcRows, pendingRows, failedRows] = await Promise.all([
      confirmedWithSrc,
      confirmedNoSrc,
      pendingQ,
      failedQ,
    ])

    // E10: asserted hypotheses capped at 0.30 confidence; withSrc takes priority over noSrc (deduped by pattern)
    const confirmedMap = new Map<string, Insight>()
    for (const r of withSrcRows) {
      const raw = 1 - (r.p as number)
      const cap = r.src === 'asserted' ? 0.3 : 1
      confirmedMap.set(r.s as string, { pattern: r.s as string, confidence: Math.min(raw, cap) })
    }
    for (const r of noSrcRows) {
      const pattern = r.s as string
      if (!confirmedMap.has(pattern)) confirmedMap.set(pattern, { pattern, confidence: 1 - (r.p as number) })
    }
    const confirmed = [...confirmedMap.values()]
    const pending = pendingRows.map((r) => ({ pattern: r.s as string, confidence: 1 - (r.p as number) }))
    const failed = failedRows.map((r) => ({
      pattern: `failed: ${typeof r.d === 'string' ? r.d : JSON.stringify(r.d)}`,
      confidence: 0.3,
    }))

    const seen = new Set(confirmed.map((i) => i.pattern))
    return [...confirmed, ...pending.filter((i) => !seen.has(i.pattern)), ...failed.filter((i) => !seen.has(i.pattern))]
  }

  // taskBlockers: query what tasks are blocked by the given task
  const taskBlockers = async (taskId: string): Promise<{ id: string; name: string }[]> => {
    const query = `
      match $t1 isa task, has task-id "${taskId}";
      (blocker: $t1, blocked: $t2) isa blocks;
      $t2 has task-id $id, has name $name;
      select $id, $name;
    `
    const rows = await readParsed(query).catch(() => [] as Record<string, unknown>[])
    return rows.map((r) => ({ id: r.id as string, name: r.name as string }))
  }

  // span: ingest docs to TypeDB as confirmed hypotheses
  const span = async (): Promise<number> => ingestDocs()

  // context: load docs as merged markdown for agent prompts
  const context = (keys: (DocKey | string)[]): string => loadContext(keys)

  // ── The sandwich: TypeDB validates before and after LLM ─────────────

  // Delegates to the exported standalone isToxic for O(1) in-memory check.
  const checkToxic = (edge: string) => isToxic(edge, net.strength, net.resistance)

  const signal = (s: Signal, from = 'entry') => {
    const t0 = performance.now()
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

    // Execute signal and log to TypeDB
    net.signal(s, from)

    // Log signal for observability: sender, receiver, data, success, latency, timestamp
    const latency = performance.now() - t0
    const timestamp = new Date().toISOString()
    const dataStr = JSON.stringify(s.data || {})
      .slice(0, 500)
      .replace(/"/g, "'")

    // Schema: signal relates sender/receiver (roles) and owns
    // data, amount, success, latency, ts. We can't set role players
    // via `has sender` — they bind through the relation declaration.
    // This log is best-effort; missing sender/receiver units just dissolve.
    const uidFrom = from.includes(':') ? from.split(':')[0] : from
    const uidTo = s.receiver.includes(':') ? s.receiver.split(':')[0] : s.receiver
    writeSilent(`
      match
        $from isa unit, has uid "${uidFrom}";
        $to isa unit, has uid "${uidTo}";
      insert (sender: $from, receiver: $to) isa signal,
        has data "${dataStr}",
        has amount 0.0,
        has success true,
        has latency ${latency.toFixed(2)},
        has ts ${timestamp.replace('Z', '')};
    `).catch(() => {}) // Best-effort logging
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

  // ── Capability + lifecycle gates ────────────────────────────────────────

  // capable: declare that a unit can perform a skill (creates capability relation)
  // GATE: REGISTER → CAPABLE requires unit_exists (status "active")
  const capable = async (unitId: string, skillId: string, price = 0) => {
    // Pre-gate: verify unit exists with status "active" before declaring capability
    if (!(await canDeclareCapability(unitId))) {
      return // Dissolve: unit doesn't exist or not active, silently fail
    }
    writeSilent(`
      match $u isa unit, has uid "${unitId}"; $s isa skill, has skill-id "${skillId}";
      not { (provider: $u, offered: $s) isa capability; };
      insert (provider: $u, offered: $s) isa capability, has price ${price};
    `).catch(() => {})
  }

  // canDeclareCapability: gate — unit must exist with status "active"
  const canDeclareCapability = async (uid: string): Promise<boolean> => {
    const rows = await readParsed(`
      match $u isa unit, has uid "${uid}", has status "active"; select $u;
    `).catch(() => [])
    return rows.length > 0
  }

  // canBeDiscovered: gate — unit must have at least one capability relation
  const canBeDiscovered = async (uid: string): Promise<boolean> => {
    const rows = await readParsed(`
      match $u isa unit, has uid "${uid}"; (provider: $u, offered: $s) isa capability; select $s;
    `).catch(() => [])
    return rows.length > 0
  }

  // selfCheckoff: mark task done, unblock dependents, promote to knowledge
  const selfCheckoff = async (taskId: string) => {
    // Mark task done in TypeDB
    await writeSilent(`
      match $t isa task, has task-id "${taskId}";
      delete has done of $t;
      insert $t has done true;
    `).catch(() => {})
    // Update task-status
    await writeSilent(`
      match $t isa task, has task-id "${taskId}", has task-status $s;
      delete $s of $t;
      insert $t has task-status "done";
    `).catch(() => {})
    // Unblock dependents: find tasks blocked by this one
    const blocked = await readParsed(`
      match (blocker: $b, blocked: $t) isa blocks;
      $b isa task, has task-id "${taskId}";
      $t has task-id $tid;
      select $tid;
    `).catch(() => [])
    for (const row of blocked) {
      const tid = row.tid as string
      // Check if all blockers of this dependent are now done
      const stillBlocked = await readParsed(`
        match (blocker: $b, blocked: $t) isa blocks;
        $t isa task, has task-id "${tid}";
        $b has done false;
        select $b;
      `).catch(() => [])
      if (stillBlocked.length === 0) {
        await writeSilent(`
          match $t isa task, has task-id "${tid}", has task-status $s;
          delete $s of $t;
          insert $t has task-status "open";
        `).catch(() => {})
      }
    }
    // Mark the completion path
    mark(`builder→${taskId}`, 1)
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
    settle,
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
    reveal,
    forget,
    frontier,
    taskBlockers,
    span,
    context,
    capable,
    canDeclareCapability,
    canBeDiscovered,
    selfCheckoff,
    subscribe,
    tasksFor,
    sync,
    load,
  }
}
