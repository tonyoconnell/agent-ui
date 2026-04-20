import { encryptForGroup } from '@/lib/kek'
import { emitSecurityEvent } from '@/lib/security-signals'
import { parseAnswers, read, readParsed, writeSilent } from '@/lib/typedb'
import { relayToGateway, wsManager } from '@/lib/ws-server'
import { audit, enforcementMode, SKILL_SCHEMA_CACHE, SKILL_SCHEMA_TTL } from './adl-cache'
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

// ── PEP support: nonce dedup + lifecycle cache ───────────────────────────────

// Nonce dedup (PEP-2): 5-min TTL window. Kills replay in O(1) — no TypeDB read.
const NONCE_TTL_MS = 5 * 60 * 1000
const NONCE_SEEN = new Map<string, number>() // nonce → expiresMs

function checkNonce(nonce: string): 'ok' | 'replay' {
  const now = Date.now()
  for (const [n, exp] of NONCE_SEEN) {
    if (exp < now) NONCE_SEEN.delete(n) // prune stale entries
  }
  if (NONCE_SEEN.has(nonce)) return 'replay'
  NONCE_SEEN.set(nonce, now + NONCE_TTL_MS)
  return 'ok'
}

// ADL lifecycle cache (PEP-3.5): avoid TypeDB read on every ask()
const LIFECYCLE_TTL_MS = 5 * 60 * 1000
const LIFECYCLE_CACHE = new Map<string, { status?: string; sunsetAt?: number; expires: number }>()

// ADL schema cache (PEP-4): shared from adl-cache.ts (Cycle 1.6 consolidation).
// Invalidated by `invalidateAdlCache(uid)` on every ADL write path.

/** Minimal inline JSON Schema validator — no external deps. Handles type + required only. */
function validateJsonSchema(data: unknown, schema: Record<string, unknown>): boolean {
  if (schema.type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) return false
  if (schema.type === 'string' && typeof data !== 'string') return false
  if (schema.type === 'number' && typeof data !== 'number') return false
  if (schema.type === 'array' && !Array.isArray(data)) return false
  if (schema.type === 'boolean' && typeof data !== 'boolean') return false
  if (schema.required && Array.isArray(schema.required) && typeof data === 'object' && data !== null) {
    for (const field of schema.required as string[]) {
      if (!(field in (data as Record<string, unknown>))) return false
    }
  }
  return true
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
  recall: (
    match?: string | { subject?: string; at?: string; federated?: boolean },
    limit?: number,
  ) => Promise<Insight[]>
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
  dissolve: (
    uid: string,
    opts?: { reason?: string },
  ) => Promise<{ uid: string; dissolvedAt: string; drainedSignals: number; pathsTouched: number }>
  hasPathRelationship: (uid: string, from: string, to: string) => Promise<boolean>
  sync: () => Promise<void>
  load: () => Promise<void>
  settle: (
    edge: string,
    opts: {
      escrowObjectId: string
      claimantUid: string
      posterUid: string
      /** Rubric scores — if provided, gate release on all dims ≥ threshold (default 0.65) */
      rubric?: { fit: number; form: number; truth: number; taste: number }
      /** Per-dimension threshold; defaults to 0.65 per rubrics.md */
      threshold?: number
      /** Override: skip rubric gate, pass true/false directly (legacy path) */
      success?: boolean
      /** Escrow amount in base units; used to compute the 2% fee audit signal */
      escrowAmount?: number
    },
  ) => void
}

export const world = (): PersistentWorld => {
  const net = createWorld()

  // ── TypeDB-synced pheromone ────────────────────────────────────────────

  const mark = (edge: string, strength = 1, opts?: { scope?: string }) => {
    const scopedEdge = opts?.scope ? `${opts.scope}:${edge}` : edge
    net.mark(scopedEdge, strength)
    const [from, to] = edge.split('→')
    if (!from || !to) return
    // Broadcast pheromone change to connected TaskBoard clients (task edges only)
    const taskMatch = to.trim().match(/^builder:(.+)$/)
    if (taskMatch?.[1]) {
      const markMsg = { type: 'mark' as const, tid: taskMatch[1], strength: net.sense(edge) }
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
    // L4 revenue feedback: emit signal for marketplace routing updates
    if (strength > 0) {
      net.signal(
        {
          receiver: 'loop:metrics',
          data: {
            tags: ['revenue:updated', 'L4'],
            content: { edge, strength, traversals: net.sense(edge) / strength || 1 },
          },
        },
        'persist',
      )
    }
  }

  const warn = (edge: string, strength = 1, opts?: { scope?: string }) => {
    const scopedEdge = opts?.scope ? `${opts.scope}:${edge}` : edge
    net.warn(scopedEdge, strength)
    const [from, to] = edge.split('→')
    if (!from || !to) return
    // Broadcast pheromone change to connected TaskBoard clients (task edges only)
    const taskMatch = to.trim().match(/^builder:(.+)$/)
    if (taskMatch?.[1]) {
      const warnMsg = { type: 'warn' as const, tid: taskMatch[1], resistance: net.danger(edge) }
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
    opts: {
      escrowObjectId: string
      claimantUid: string
      posterUid: string
      rubric?: { fit: number; form: number; truth: number; taste: number }
      threshold?: number
      success?: boolean
      escrowAmount?: number
    },
  ) => {
    // Rubric-gated release: all dims must meet threshold (default 0.65 per rubrics.md).
    // If rubric is provided it takes precedence over the bare `success` boolean.
    const gate = opts.threshold ?? 0.65
    const passed =
      opts.rubric !== undefined
        ? opts.rubric.fit >= gate && opts.rubric.form >= gate && opts.rubric.truth >= gate && opts.rubric.taste >= gate
        : opts.success !== false

    if (passed) {
      mark(edge)
    } else {
      warn(edge)
    }
    // Fire-and-forget — Sui settle on-chain
    settleEscrow(opts.escrowObjectId, opts.claimantUid, opts.posterUid, passed)
    // Fee audit trail: emit to treasury:one on successful release only.
    // On-chain skim happens in Move; this is the off-chain TypeDB-queryable record
    // per marketplace-schema.md. No-op when escrowAmount is not provided.
    if (passed) {
      const feeAmount = opts.escrowAmount ? Math.floor(opts.escrowAmount * 0.02) : undefined
      if (feeAmount && feeAmount > 0) {
        net.signal(
          {
            receiver: 'treasury:one',
            data: { kind: 'fee', amount: feeAmount, edge, tx_hash: opts.escrowObjectId },
          },
          opts.claimantUid,
        )
      }
    }
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
    // Two narrower queries instead of one joined query — the joined form
    // (strength AND resistance in one match) times out against production
    // TypeDB when the path table is large. Strength alone is fast; resistance
    // is fetched separately and defaults to 0 when absent.
    const strengthAnswers = await read(`
      match $e (source: $from, target: $to) isa path, has strength $s;
      $from has uid $fid; $to has uid $tid; select $fid, $tid, $s;
    `).catch(() => '[]')
    for (const row of parseAnswers(strengthAnswers as unknown[])) {
      const s = row.s as number
      if (typeof s === 'number' && s > 0) {
        net.strength[`${row.fid}→${row.tid}`] = s
      }
    }

    const resistanceAnswers = await read(`
      match $e (source: $from, target: $to) isa path, has resistance $a;
      $from has uid $fid; $to has uid $tid; select $fid, $tid, $a;
    `).catch(() => '[]')
    for (const row of parseAnswers(resistanceAnswers as unknown[])) {
      const a = row.a as number
      if (typeof a === 'number' && a > 0) {
        net.resistance[`${row.fid}→${row.tid}`] = a
      }
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

  const hasPathRelationship = async (uid: string, from: string, to: string): Promise<boolean> => {
    const safeUid = uid.replace(/[^a-zA-Z0-9_:.-]/g, '')
    const safeFrom = from.replace(/[^a-zA-Z0-9_:.-]/g, '')
    const safeTo = to.replace(/[^a-zA-Z0-9_:.-]/g, '')
    try {
      const rows = await readParsed(
        `match $u isa unit, has uid "${safeUid}";
         $s isa unit, has uid "${safeFrom}";
         $t isa unit, has uid "${safeTo}";
         { (sender: $u, receiver: $t) isa signal; } or
         { (sender: $s, receiver: $u) isa signal; };
         select $u; limit 1;`,
      )
      return rows.length > 0
    } catch {
      return false
    }
  }

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
    const strong = net.highways(100).filter((h) => h.strength >= 50)
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
    // GDPR audit: emit signal before cascade delete for compliance logging
    net.signal({
      receiver: 'audit:memory:deleted',
      data: {
        uid,
        timestamp: new Date().toISOString(),
        scope: 'private',
        tags: ['audit', 'memory', 'gdpr'],
      },
    })
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
    // Cascade personal group
    const escPGid = `group:${safeUid}`.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    writeSilent(`match $g isa group, has gid "${escPGid}"; $m (group: $g) isa membership; delete $m isa membership;`)
    writeSilent(`match $g isa group, has gid "${escPGid}"; delete $g isa group;`)
    // In-memory: remove unit from runtime (orphaned paths decay via L3 fade)
    if (net.has(uid)) net.remove(uid)
  }

  const recall = async (
    match?: string | { subject?: string; at?: string; federated?: boolean },
    limit: number = 100,
  ): Promise<Insight[]> => {
    // Parse match argument — supports legacy string or new { subject?, at?, federated? } object
    const matchStr = typeof match === 'string' ? match : match?.subject
    const atDate = typeof match === 'object' ? match?.at : undefined
    const isFederated = typeof match === 'object' ? match?.federated : false
    const safeMatch = matchStr ? escapeStr(matchStr) : undefined

    // E9: bi-temporal filter — only hypotheses valid at the given point in time
    const temporalClause = atDate
      ? `$h has valid-from $vf, has valid-until $vu; $vf <= ${atDate}T00:00:00; $vu > ${atDate}T00:00:00;`
      : ''
    const containsClause = safeMatch ? `$s contains "${safeMatch}";` : ''

    // E9.5: federated scope filter — only public and group-scoped signals visible to other worlds
    const scopeClause = isFederated ? `{ $h has scope "public"; } or { $h has scope "group"; };` : ''

    // E10: query with source (new records) and without (legacy) — apply asserted confidence cap
    const confirmedWithSrc = readParsed(
      `match $h isa hypothesis, has statement $s, has p-value $p, has hypothesis-status $st, has source $src;
       ${containsClause} { $st = "confirmed"; } or { $st = "testing"; }; ${temporalClause} ${scopeClause} select $s, $p, $src;`,
    ).catch(() => [] as Record<string, unknown>[])

    const confirmedNoSrc = readParsed(
      `match $h isa hypothesis, has statement $s, has p-value $p, has hypothesis-status $st;
       not { $h has source $anySrc; }; ${containsClause} { $st = "confirmed"; } or { $st = "testing"; };
       ${temporalClause} ${scopeClause} select $s, $p;`,
    ).catch(() => [] as Record<string, unknown>[])

    const pendingQ = safeMatch
      ? readParsed(
          `match $h isa hypothesis, has statement $s, has p-value $p, has hypothesis-status "pending";
           $s contains "${safeMatch}"; ${temporalClause} ${scopeClause} select $s, $p;`,
        ).catch(() => [] as Record<string, unknown>[])
      : Promise.resolve([] as Record<string, unknown>[])

    // E11: scope filter — exclude private signals from failed-attempts surfacing; federated filter applies here too
    const failedQ = safeMatch
      ? readParsed(
          `match $sig isa signal, has data $d, has success false;
           $d contains "${safeMatch}"; not { $sig has scope "private"; }; ${scopeClause} select $d;`,
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
    const results = [
      ...confirmed,
      ...pending.filter((i) => !seen.has(i.pattern)),
      ...failed.filter((i) => !seen.has(i.pattern)),
    ]
    return results.slice(0, limit)
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

  /**
   * PEP for fire-and-forget signals.
   *
   * PEP-1  toxic → dissolve + emitSecurityEvent + net.warn(caller→auth-boundary, 0.3)
   * PEP-2  nonce → replay dissolve + emitSecurityEvent + net.warn
   * PEP-4/5 budget + rate-limit stubs (pass-through, enforced in future cycle)
   * PEP-6  deliver + log (encrypt private-scope data before TypeDB write)
   */
  const signal = async (s: Signal, from = 'entry') => {
    const t0 = performance.now()
    const edge = `${from}→${s.receiver}`

    // PEP-1: toxic check — dissolve + audit hypothesis + pheromone warn
    if (checkToxic(edge)) {
      emitSecurityEvent({ kind: 'toxic', edge })
      net.warn(`${from}→auth-boundary`, 0.3)
      console.log(`[TOXIC] blocked: ${edge}`)
      return
    }

    // PEP-2: nonce dedup — kills replay in O(1), no TypeDB read
    const nonce = (s.data as Record<string, unknown>)?.nonce as string | undefined
    if (nonce && checkNonce(nonce) === 'replay') {
      emitSecurityEvent({ kind: 'replay', edge, nonce })
      net.warn(`${from}→auth-boundary`, 0.3)
      return
    }

    // PEP-4/5: budget + rate-limit stubs (pass-through — enforced in future cycle)

    // PEP-6: deliver
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

    // Log to TypeDB — encrypt private-scope data before write
    const latency = performance.now() - t0
    const timestamp = new Date().toISOString()
    const uidFrom = from.includes(':') ? from.split(':')[0] : from
    const scope = (s.data as Record<string, unknown>)?.scope as string | undefined
    let dataStr: string
    if (scope === 'private') {
      const gid = (s.data as Record<string, unknown>)?.group as string | undefined
      const plain = JSON.stringify(s.data || {}).slice(0, 500)
      const enc = gid ? await encryptForGroup(gid, plain).catch(() => null) : null
      dataStr = enc ? `[enc:${enc.slice(0, 60)}]` : plain.replace(/"/g, "'")
    } else {
      dataStr = JSON.stringify(s.data || {})
        .slice(0, 500)
        .replace(/"/g, "'")
    }
    writeSilent(`
      match
        $from isa unit, has uid "${uidFrom}";
        $to isa unit, has uid "${uid}";
      insert (sender: $from, receiver: $to) isa signal,
        has data "${dataStr}",
        has amount 0.0,
        has success true,
        has latency ${latency.toFixed(2)},
        has ts ${timestamp.replace('Z', '')};
    `).catch(() => {})
  }

  /**
   * PEP for ask() — signal + wait. Full 6-step check before LLM fires.
   *
   * PEP-1  toxic → dissolve + emitSecurityEvent + net.warn(caller→auth-boundary, 0.3)
   * PEP-2  nonce → replay dissolve + emitSecurityEvent + net.warn
   * PEP-3  capability exists? → emitSecurityEvent(capability-missing) → dissolve
   * PEP-3.5 ADL lifecycle gate → retired/deprecated/sunset → dissolve (5-min cache)
   * PEP-4/5 budget + rate-limit stubs (pass-through)
   * PEP-6  deliver
   */
  const ask = async (s: Signal, from = 'entry', timeout?: number) => {
    const edge = `${from}→${s.receiver}`

    // PEP-1: toxic check
    if (checkToxic(edge)) {
      emitSecurityEvent({ kind: 'toxic', edge })
      net.warn(`${from}→auth-boundary`, 0.3)
      console.log(`[TOXIC] blocked: ${edge}`)
      return { dissolved: true }
    }

    // PEP-2: nonce dedup
    const nonce = (s.data as Record<string, unknown>)?.nonce as string | undefined
    if (nonce && checkNonce(nonce) === 'replay') {
      emitSecurityEvent({ kind: 'replay', edge, nonce })
      net.warn(`${from}→auth-boundary`, 0.3)
      return { dissolved: true }
    }

    // PEP-3: capability check — skip if the unit has the task handler
    // registered in-memory. The handler IS the capability; a runtime route
    // like `ceo:route` or `marketing-cmo:respond` is wired via chairman-chain
    // and won't have a corresponding TypeDB skill entry. Only check TypeDB
    // for externally-declared capabilities where no handler is wired.
    const uid = s.receiver.includes(':') ? s.receiver.split(':')[0] : s.receiver
    const skill = s.receiver.includes(':') ? s.receiver.split(':')[1] : null
    if (skill) {
      const localUnit = net.get(uid)
      const hasLocalHandler = localUnit?.has(skill) || localUnit?.has('default')
      if (!hasLocalHandler) {
        const ok = await readParsed(
          `match $u isa unit, has uid "${uid}"; $sk isa skill, has skill-id "${skill}";
           (provider: $u, offered: $sk) isa capability; select $u;`,
        ).catch(() => [])
        if (!ok.length) {
          emitSecurityEvent({ kind: 'capability-missing', receiver: uid })
          return { dissolved: true }
        }
      }
    }

    // PEP-3.5: lifecycle gate — skip retired/deprecated/past-sunset units (5-min cache)
    const lcCached = LIFECYCLE_CACHE.get(uid)
    const lcNow = Date.now()
    let lcStatus: string | undefined
    let lcSunsetAt: number | undefined
    if (lcCached && lcCached.expires > lcNow) {
      lcStatus = lcCached.status
      lcSunsetAt = lcCached.sunsetAt
    } else {
      const lcRows = await readParsed(`
        match $u isa unit, has uid "${escapeStr(uid)}";
        optional { $u has adl-status $st; }
        optional { $u has sunset-at $sun; }
        select $st, $sun;
      `).catch(() => [])
      lcStatus = lcRows[0]?.st as string | undefined
      lcSunsetAt = lcRows[0]?.sun ? new Date(lcRows[0].sun as string).getTime() : undefined
      LIFECYCLE_CACHE.set(uid, { status: lcStatus, sunsetAt: lcSunsetAt, expires: lcNow + LIFECYCLE_TTL_MS })
    }
    if (lcStatus === 'retired' || lcStatus === 'deprecated') {
      const mode = enforcementMode()
      audit({
        sender: from,
        receiver: uid,
        gate: 'lifecycle',
        decision: mode === 'audit' ? 'allow-audit' : 'deny',
        mode,
        reason: `adl-status=${lcStatus}`,
      })
      if (mode === 'enforce') {
        emitSecurityEvent({ kind: 'auth-fail', caller: from, reason: 'lifecycle-blocked' })
        net.warn(edge, 0.5)
        return { dissolved: true }
      }
    }
    if (lcSunsetAt && Date.now() > lcSunsetAt) {
      const mode = enforcementMode()
      audit({
        sender: from,
        receiver: uid,
        gate: 'lifecycle',
        decision: mode === 'audit' ? 'allow-audit' : 'deny',
        mode,
        reason: `sunset-at ${new Date(lcSunsetAt).toISOString()} passed`,
      })
      if (mode === 'enforce') {
        emitSecurityEvent({ kind: 'auth-fail', caller: from, reason: 'lifecycle-blocked' })
        net.warn(edge, 0.5)
        return { dissolved: true }
      }
    }

    // PEP-4: skill schema validation — validate data against input-schema if declared (fail-open)
    if (skill) {
      const schemaKey = `${uid}:${skill}`
      const schemaCached = SKILL_SCHEMA_CACHE.get(schemaKey)
      const schemaTs = Date.now()
      let inputSchema: Record<string, unknown> | null = null
      if (schemaCached && schemaCached.expires > schemaTs) {
        inputSchema = schemaCached.schema
      } else {
        const schemaRows = await readParsed(`
          match $u isa unit, has uid "${escapeStr(uid)}"; $sk isa skill, has skill-id "${escapeStr(skill)}";
          (provider: $u, offered: $sk) isa capability; $sk has input-schema $is;
          select $is;
        `).catch(() => [])
        try {
          inputSchema = schemaRows.length ? (JSON.parse(schemaRows[0].is as string) as Record<string, unknown>) : null
        } catch {
          inputSchema = null // malformed → fail open
        }
        SKILL_SCHEMA_CACHE.set(schemaKey, { schema: inputSchema, expires: schemaTs + SKILL_SCHEMA_TTL })
      }
      if (inputSchema && !validateJsonSchema(s.data, inputSchema)) {
        const mode = enforcementMode()
        audit({
          sender: from,
          receiver: s.receiver,
          gate: 'schema',
          decision: mode === 'audit' ? 'allow-audit' : 'deny',
          mode,
          reason: `skill ${skill} input-schema validation failed`,
        })
        if (mode === 'enforce') return { dissolved: true }
      }
    }
    // PEP-5: budget + rate-limit stubs (pass-through)

    // PEP-6: deliver
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

  // dissolve: graceful exit — drains pending signals, marks status "dissolved" in TypeDB,
  // emits final dissolve signal on all paths touching this unit, does NOT delete records.
  // L3 fade handles trail decay naturally. Use forget() for GDPR erasure.
  const dissolve = async (
    uid: string,
    opts?: { reason?: string },
  ): Promise<{ uid: string; dissolvedAt: string; drainedSignals: number; pathsTouched: number }> => {
    const dissolvedAt = new Date().toISOString()
    const safeUid = escapeStr(uid)

    // 1. Drain any pending signals addressed to this unit from the queue
    let drainedSignals = 0
    let i = net.queue.length
    while (i--) {
      const qUid = net.queue[i].receiver.includes(':') ? net.queue[i].receiver.split(':')[0] : net.queue[i].receiver
      if (qUid === uid) {
        net.queue.splice(i, 1)
        drainedSignals++
      }
    }

    // 2. Mark status "dissolved" + dissolved-at timestamp in TypeDB
    const ts = dissolvedAt.replace('Z', '')
    writeSilent(`
      match $u isa unit, has uid "${safeUid}", has status $s;
      delete $s of $u;
      insert $u has status "dissolved", has dissolved-at ${ts};
    `).catch(() => {})
    // Handle units that may not yet have a status attribute
    writeSilent(`
      match $u isa unit, has uid "${safeUid}";
      not { $u has status $s; };
      insert $u has status "dissolved", has dissolved-at ${ts};
    `).catch(() => {})

    // 3. Find all paths touching this unit and emit a final dissolve signal on each
    const touchingEdges = Object.keys({ ...net.strength, ...net.resistance }).filter((e) => {
      const [from, to] = e.split('→')
      const fromId = from?.split(':')[0]
      const toId = to?.split(':')[0]
      return fromId === uid || toId === uid
    })
    for (const edge of touchingEdges) {
      const [from, to] = edge.split('→')
      const peer = from?.split(':')[0] === uid ? to?.split(':')[0] : from?.split(':')[0]
      if (peer && net.has(peer)) {
        net.signal(
          {
            receiver: peer,
            data: { kind: 'dissolve', uid, reason: opts?.reason ?? 'graceful-exit', marks: false },
          },
          uid,
        )
      }
    }
    const pathsTouched = touchingEdges.length

    // 4. Do NOT remove from in-memory world — L3 fade handles trail decay naturally
    // 5. Do NOT delete TypeDB records — forget() does that

    return { uid, dissolvedAt, drainedSignals, pathsTouched }
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
    dissolve,
    hasPathRelationship,
    sync,
    load,
  }
}
