/**
 * CHAIRMAN-CHAIN — Zero-LLM routing units for Chairman→CEO→Director→Specialist.
 *
 * The human (chairman) signals `ceo:route`. The CEO deterministically routes to
 * a director via `follow(domainTag)`, the director routes to a specialist via
 * `follow(subTag)`. Only the leaf specialist uses an LLM. Routing hops are
 * sub-millisecond — they read pheromone, not prompts.
 *
 * Seed pattern: `mark('<tag>→<target-uid>', 0.5)` so `follow(tag)` has data.
 * Closed loop: missing route returns `{ dissolved: true }` — callers can warn.
 * Zero returns: no throws on missing handler; silence is valid.
 */

import {
  type CeoClassifyResult,
  type CeoDirectorCandidate,
  getActiveClassifier,
  hasClassifierOverride,
} from './ceo-classifier'
import type { PersistentWorld } from './persist'
import { type LeafOptions, leafHandler } from './specialist-leaf'
import type { Emit, Unit, World } from './world'

export type ChainData = {
  content: string
  tags: string[]
  chain?: string[]
  sessionId?: string
  replyTo?: string
  /** Deterministic classifier confidence (0..1). < 0.4 triggers CEO LLM fallback. */
  confidence?: number
  /** Set to false to disable LLM fallback per-signal (e.g. tests, health checks). */
  llmFallback?: boolean
  /** Signal scope — defense-in-depth to match /api/signal ingress enforcement. */
  scope?: 'private' | 'group' | 'public'
  [k: string]: unknown
}

export type RouteCtx = { from: string; self: string }
export type Dissolved = { dissolved: true }

export type Specialist = { uid: string; tags: string[] }

type Net = World | PersistentWorld

const SEED_STRENGTH = 0.5
// Directors must outweigh specialists on their own domain tag. Synthesis
// creates `<domain>→<specialist>` edges for every specialist whose uid starts
// with the domain (e.g., `marketing-seo-specialist`), so without a strength
// boost the CEO's pickRoute would tie and sometimes bypass the director.
const DIRECTOR_STRENGTH = 1.0
const CEO_FALLBACK_CONFIDENCE_THRESHOLD = 0.4
const CEO_FALLBACK_MARK_STRENGTH = 0.5

// TypeDB stores paths as unit→unit relations (no tag attribute in one.tql).
// But pickRoute scans for <tag>→<to> synthetic edges. Bridge the two: for
// every loaded unit→unit edge `from→to`, derive routing tags from the TO
// unit's uid segments and synthesize `<segment>→<to>` edges in-memory.
//
// Example: after load() populates `ceo→marketing-cmo` (strength 0.8), this
// synthesizes `marketing→marketing-cmo` and `cmo→marketing-cmo` at 0.8 so
// `pickRoute('marketing')` returns `marketing-cmo` deterministically.
//
// Idempotent: never overrides a stronger existing value, never creates
// same-segment edges (like `marketing-cmo→marketing-cmo`). Persists nothing;
// the synthesis runs every boot off the hierarchy ground truth.
export const synthesizeTagEdgesFromUids = (net: Net): number => {
  let added = 0
  const seeds = Object.entries(net.strength).filter(([e]) => {
    const parts = e.split('→')
    return parts.length === 2 && !!parts[0] && !!parts[1]
  })
  for (const [edge, strength] of seeds) {
    const [from, to] = edge.split('→')
    if (!to.includes('-')) continue
    // Skip segments the SOURCE already owns — prevents the `marketing→<every
    // marketing-* specialist>` spam that happens when a director's outgoing
    // edges get synthesized on each specialist's shared prefix. If source is
    // `marketing-cmo` and target is `marketing-forum`, the shared 'marketing'
    // segment is the director's own domain — don't dilute it with specialist
    // ties.
    const sourceSegments = new Set(from.split('-'))
    const segments = to.split('-')
    for (const seg of segments) {
      if (!seg || seg === to) continue
      if (sourceSegments.has(seg)) continue
      const synthetic = `${seg}→${to}`
      if (synthetic === edge) continue
      if ((net.strength[synthetic] ?? 0) < strength) {
        net.strength[synthetic] = strength
        added++
      }
    }
  }
  return added
}

// pickRoute: scan strength for `<tag>→<to>` edges, return full <to> (unit uid).
// We can't use world.follow() directly because it strips `:` suffixes from the
// TO side — specialist uids like `marketing:seo` would collapse to `marketing`.
// This walks pheromone edges anchored on the tag prefix only.
//
// `exclude` lets callers filter out self + chain members at scan time, so the
// NEXT-best candidate wins when the top pick is the caller itself. Without
// this, `marketing-cmo` handling a `marketing` tag would return `marketing-cmo`
// (self, 0.8) and callers would give up on the tag instead of falling through
// to a 0.5 specialist.
export const pickRoute = (net: Net, tag: string, exclude: ReadonlySet<string> = new Set()): string | null => {
  const prefix = `${tag}→`
  let bestTo: string | null = null
  let bestNet = 0
  for (const edge in net.strength) {
    if (!edge.startsWith(prefix)) continue
    const to = edge.slice(prefix.length)
    if (exclude.has(to)) continue
    const s = net.strength[edge] || 0
    const r = net.resistance[edge] || 0
    const n = s - r
    if (n > bestNet) {
      bestNet = n
      bestTo = to
    }
  }
  if (bestTo) return bestTo
  // Exploration fallback: pick any edge for this tag (probabilistic).
  const candidates: [string, number][] = []
  for (const edge in net.strength) {
    if (!edge.startsWith(prefix)) continue
    const to = edge.slice(prefix.length)
    if (exclude.has(to)) continue
    const s = net.strength[edge] || 0
    const r = net.resistance[edge] || 0
    const w = 1 + Math.max(0, s - r) * 0.6
    candidates.push([to, w])
  }
  if (!candidates.length) return null
  const total = candidates.reduce((sum, [, w]) => sum + w, 0)
  let rnd = Math.random() * total
  for (const [to, w] of candidates) {
    rnd -= w
    if (rnd <= 0) return to
  }
  return candidates[0][0]
}

// Walk tags in order; skip self-loops and tags that pin us here. First hit wins.
const firstRoute = (net: Net, tags: string[], uid: string, chain: string[]): string | null => {
  const exclude = new Set<string>([uid, ...chain])
  for (const tag of tags.length ? tags : ['general']) {
    const t = pickRoute(net, tag, exclude)
    if (t) return t
  }
  return null
}

/** Exported for test-only use (scope-guard unit tests). Do not call from production code — use createDirector instead. */
export const makeRouteHandler =
  (net: Net, uid: string, suffix: ':route' | ':respond') => (data: unknown, send: Emit, _ctx: RouteCtx) => {
    const d = (data ?? {}) as ChainData & { replyTo?: string }
    const tags = Array.isArray(d.tags) ? d.tags : []
    const chain = d.chain ?? ['chairman']
    const target = firstRoute(net, tags, uid, chain)
    const replyTo = d.replyTo
    delete d.replyTo // stop world.ts from auto-replying after this hop
    const nextChain = [...chain, uid]

    if (!target) {
      // Self-fallback: director answers directly when no sub-tag specialist
      // matches. A signal with just a domain tag like ['marketing'] would
      // otherwise dissolve at the director (specialists are tagged by sub-tag,
      // not domain). Director-as-leaf is better UX than cascading dissolve.
      send({ receiver: `${uid}:respond`, data: { ...d, chain: nextChain, ...(replyTo && { replyTo }) } })
      return undefined
    }

    // Scope defense-in-depth: if caller asked for group-scoped routing,
    // reject targets whose uid-prefix (`<group>:<name>`) doesn't match the caller's prefix.
    // Self-signals (target === uid) always allowed.
    if (d.scope && d.scope !== 'public' && target !== uid) {
      const callerPrefix = uid.includes(':') ? uid.split(':')[0] : ''
      const targetPrefix = target.includes(':') ? target.split(':')[0] : ''
      if (callerPrefix && callerPrefix !== targetPrefix) {
        return { dissolved: true } as Dissolved
      }
    }

    send({ receiver: `${target}${suffix}`, data: { ...d, chain: nextChain, ...(replyTo && { replyTo }) } })
    return undefined
  }

// listDirectors: any registered unit with a `route` handler (director), except
// the CEO itself. Used to feed the LLM classifier the universe of valid targets.
// Examples from a director's own seeded edges give the LLM a hint about domain.
const listDirectors = (net: Net, ceoUid: string): CeoDirectorCandidate[] => {
  const out: CeoDirectorCandidate[] = []
  for (const uid of net.list()) {
    if (uid === ceoUid) continue
    const u = net.get(uid)
    if (!u?.has('route')) continue
    // Infer domain: scan for any `<tag>→<uid>` edge where <tag> !== uid;
    // first hit is the director's primary domain. Falls back to uid prefix.
    let domain = uid.split('-')[0]
    const examples: string[] = []
    for (const edge in net.strength) {
      const parts = edge.split('→')
      if (parts.length !== 2 || parts[1] !== uid) continue
      const tag = parts[0]
      if (tag === uid) continue
      if (!examples.includes(tag)) examples.push(tag)
      if (examples.length === 1) domain = tag
      if (examples.length >= 4) break
    }
    out.push(examples.length ? { uid, domain, examples } : { uid, domain })
  }
  return out
}

const shouldFallbackToLlm = (d: ChainData): boolean => {
  if (d.llmFallback === false) return false
  const conf = typeof d.confidence === 'number' ? d.confidence : 1
  if (conf >= CEO_FALLBACK_CONFIDENCE_THRESHOLD) return false
  // Test override short-circuits env check — mocks don't need real credentials.
  if (hasClassifierOverride()) return true
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  return !!env?.OPENROUTER_API_KEY
}

// CEO route handler with three-tier routing:
//   1. Hot path: pheromone `firstRoute` picks a known director. Zero LLM.
//   2. Warm path: low-confidence + no route + classifier available → one LLM
//      call to pick a director. Marks `<tag>→<director>` so subsequent same-tag
//      signals skip the LLM. Classified tag is prepended to forwarded tags so
//      the director routes on it via its own seeds.
//   3. Cold path: still no target → CEO self-leaf (replies directly).
// Safe because directors self-leaf too when their subtags miss.
const makeCeoRouteHandler =
  (net: Net, uid: string) =>
  async (data: unknown, send: Emit, _ctx: RouteCtx): Promise<unknown> => {
    const d = (data ?? {}) as ChainData & { replyTo?: string }
    const tags = Array.isArray(d.tags) ? d.tags : []
    const chain = d.chain ?? ['chairman']

    let target = firstRoute(net, tags, uid, chain)
    let classified: CeoClassifyResult | null = null

    if (!target && shouldFallbackToLlm(d)) {
      const candidates = listDirectors(net, uid)
      if (candidates.length) {
        classified = await getActiveClassifier()({
          content: typeof d.content === 'string' ? d.content : '',
          availableDirectors: candidates,
        })
        const validUids = new Set(candidates.map((c) => c.uid))
        if (
          classified &&
          classified.directorUid !== uid &&
          !chain.includes(classified.directorUid) &&
          validUids.has(classified.directorUid)
        ) {
          net.mark(`${classified.tag}→${classified.directorUid}`, CEO_FALLBACK_MARK_STRENGTH)
          target = classified.directorUid
        } else {
          classified = null
        }
      }
    }

    const replyTo = d.replyTo
    delete d.replyTo
    const nextChain = [...chain, uid]

    if (!target) {
      send({ receiver: `${uid}:respond`, data: { ...d, chain: nextChain, ...(replyTo && { replyTo }) } })
      return undefined
    }

    if (d.scope && d.scope !== 'public' && target !== uid) {
      const callerPrefix = uid.includes(':') ? uid.split(':')[0] : ''
      const targetPrefix = target.includes(':') ? target.split(':')[0] : ''
      if (callerPrefix && callerPrefix !== targetPrefix) {
        return { dissolved: true } as Dissolved
      }
    }

    const forwardedTags = classified ? [classified.tag, ...tags.filter((t) => t !== classified?.tag)] : tags
    send({
      receiver: `${target}:route`,
      data: { ...d, tags: forwardedTags, chain: nextChain, ...(replyTo && { replyTo }) },
    })
    return undefined
  }

// Direct strength write — bypasses PersistentWorld.mark() which triggers a
// TypeDB writeSilent + mirrorMark (Sui permission check via canCallSui +
// 8s TypeDB timeout per call). Seeding runs ~20-30 times per wire; routing
// through mark() would queue that many bridge checks and block the chat for
// 100+ seconds. Seeds are routing hints, not economic events — they should
// not persist to Sui.
const seedWrite = (net: Net, edge: string, strength: number): void => {
  const current = net.strength[edge] ?? 0
  if (current >= strength) return
  net.strength[edge] = strength
}

export const seedDirectorTeam = (net: Net, directorUid: string, specialists: Specialist[]): void => {
  for (const sp of specialists) {
    for (const tag of sp.tags) {
      seedWrite(net, `${tag}→${sp.uid}`, SEED_STRENGTH)
    }
    seedWrite(net, `${directorUid}→${sp.uid}`, SEED_STRENGTH)
  }
}

export const createDirector = (net: Net, uid: string, domainTag: string, specialists: Specialist[]): Unit => {
  const u = net.has(uid) ? net.get(uid)! : net.add(uid)
  seedDirectorTeam(net, uid, specialists)
  // Director wins the domain tag at 2x specialist strength so synthesis-derived
  // `<domain>→<specialist>` edges (from uid prefix matching) don't tie.
  seedWrite(net, `${domainTag}→${uid}`, DIRECTOR_STRENGTH)
  u.on('route', makeRouteHandler(net, uid, ':respond'))
  return u
}

export type ChainWiring = {
  ceo: Unit
  directors: Unit[]
  specialists: Unit[]
  registered: string[]
  skipped: string[]
}

export type LeafFactory = (uid: string) => (data: unknown, send: Emit, ctx: RouteCtx) => unknown

export type WireChainOptions = {
  /** Optional leaf-handler overrides (e.g. streaming callback, mock LLM). Applied to every auto-registered specialist. */
  leaf?: Omit<LeafOptions, 'uid'>
  /** Optional CEO leaf overrides (e.g. different model, custom system prompt, streaming callback). Uid is always 'ceo'. */
  ceoLeaf?: Omit<LeafOptions, 'uid'>
  /** If false, skip auto-registering specialist `.on('respond')` handlers from seeded edges. Default: true. */
  registerSpecialists?: boolean
  /** Override the seed set entirely. */
  specialists?: Specialist[]
  /** Default marketing director uid. Production uses 'marketing-cmo' to match
   * `scripts/seed-chairman-chain.ts`; tests/dev default to 'marketing-director'. */
  directorUid?: string
  /** Domain tag the director owns. Defaults to 'marketing'. */
  directorDomainTag?: string
}

// Fallback seed kept for the zero-seed case (fresh world, no TypeDB). Production
// worlds get their real specialists from scripts/seed-chairman-chain.ts which
// produces different uids; wireChairmanChain auto-registers from those edges.
export const DEFAULT_MARKETING_TEAM: Specialist[] = [
  { uid: 'marketing-creative', tags: ['creative', 'copy'] },
  { uid: 'marketing-seo', tags: ['seo', 'ranking'] },
  { uid: 'marketing-content', tags: ['content', 'social'] },
  { uid: 'marketing-ads', tags: ['ads', 'analytics'] },
  { uid: 'marketing-citation', tags: ['citation', 'outreach'] },
]

// Production seed matching scripts/seed-chairman-chain.ts output. Used when
// the endpoint wants breadcrumbs to show the real business director name
// (`marketing-cmo`) and specialist names regardless of TypeDB availability.
// Specialists do NOT claim the 'marketing' domain tag — the director owns it
// (at DIRECTOR_STRENGTH). Each specialist only claims sub-tags so `pickRoute`
// returns the director for 'marketing' and a specialist for subdomain tags.
export const PRODUCTION_MARKETING_TEAM: Specialist[] = [
  { uid: 'marketing-seo-specialist', tags: ['seo', 'ranking', 'search'] },
  { uid: 'marketing-content-writer', tags: ['content', 'writing', 'blog', 'article'] },
  { uid: 'marketing-ads-manager', tags: ['ads', 'ppc', 'campaign', 'paid'] },
  { uid: 'marketing-creative', tags: ['creative', 'copy', 'brand', 'headline'] },
  { uid: 'marketing-analyst', tags: ['analytics', 'data', 'conversion', 'funnel'] },
  { uid: 'marketing-social-media', tags: ['social', 'twitter', 'linkedin', 'instagram'] },
  { uid: 'marketing-media-buyer', tags: ['media', 'buying'] },
  { uid: 'marketing-outreach', tags: ['outreach', 'prospect', 'cold-email'] },
  { uid: 'marketing-citation', tags: ['citation', 'local-seo', 'listings'] },
  { uid: 'marketing-forum', tags: ['forum', 'community'] },
  { uid: 'marketing-ai-ranking', tags: ['ai-ranking', 'llm-seo'] },
  { uid: 'marketing-schema', tags: ['schema', 'structured-data'] },
  { uid: 'marketing-niche-dir', tags: ['directory', 'niche'] },
  { uid: 'marketing-monthly', tags: ['report', 'monthly', 'reporting'] },
  { uid: 'marketing-quick', tags: ['quick-audit'] },
  { uid: 'marketing-full', tags: ['full-audit', 'comprehensive'] },
]

// Two-pass: pass 1 learns which tags route TO any director; pass 2 finds leaf
// targets under `director→leaf` or under `<director-tag>→leaf` edges.
const discoverLeafTargets = (net: Net, directorUids: string[]): Set<string> => {
  const directors = new Set(directorUids)
  const directorTags = new Set<string>()
  const targets = new Set<string>()
  for (const edge in net.strength) {
    const [from, to] = edge.split('→')
    if (from && to && directors.has(to)) directorTags.add(from.split(':')[0])
  }
  for (const edge in net.strength) {
    const [from, to] = edge.split('→')
    if (!from || !to) continue
    const target = to.split(':')[0]
    if (directors.has(target)) continue
    const fromHead = from.split(':')[0]
    if (directors.has(from) || (directorTags.has(fromHead) && target !== fromHead)) targets.add(target)
  }
  return targets
}

export const registerLeavesFromEdges = (
  net: Net,
  directorUids: string[],
  leafFactory?: LeafFactory,
  opts: { leaf?: Omit<LeafOptions, 'uid'> } = {},
): { registered: string[]; skipped: string[] } => {
  const factory: LeafFactory = leafFactory ?? ((uid) => leafHandler({ uid, ...(opts.leaf ?? {}) }))
  const targets = discoverLeafTargets(net, directorUids)
  const registered: string[] = []
  const skipped: string[] = []
  for (const uid of targets) {
    const u = net.has(uid) ? net.get(uid)! : net.add(uid)
    if (u.has('respond')) {
      skipped.push(uid)
      continue
    }
    u.on('respond', factory(uid))
    registered.push(uid)
  }
  return { registered, skipped }
}

// discoverDirectorsFromEdges: every unit targeted by an edge from 'ceo' in
// the loaded pheromone graph is a director that needs a `route` handler at
// runtime. The hardcoded 'marketing-director' only matches the dev default;
// production's seeded `ceo→marketing-cmo` edge names a director that has no
// registered handler until this walk discovers it.
const discoverDirectorsFromEdges = (net: Net): string[] => {
  const out = new Set<string>()
  for (const edge in net.strength) {
    const [from, to] = edge.split('→')
    if (from === 'ceo' && to && to !== 'ceo' && to !== 'chairman') out.add(to)
  }
  return [...out]
}

export const wireChairmanChain = (net: Net, opts: WireChainOptions = {}): ChainWiring => {
  // Bridge TypeDB schema (unit→unit paths) to runtime routing (<tag>→<to>).
  // Must run before the CEO/director handlers fire, so pickRoute sees the
  // synthesized edges immediately. See synthesizeTagEdgesFromUids JSDoc.
  synthesizeTagEdgesFromUids(net)

  // Directors must exist before the CEO handler queries `net.list()` — but
  // registerability is idempotent, and the handler closures over `net` so
  // listDirectors() is evaluated at call time, not wire time. Order-safe.
  const seed = opts.specialists ?? DEFAULT_MARKETING_TEAM
  const directorUid = opts.directorUid ?? 'marketing-director'
  const directorDomainTag = opts.directorDomainTag ?? 'marketing'
  const marketingDirector = createDirector(net, directorUid, directorDomainTag, seed)

  // Discover additional directors from loaded pheromone (e.g. marketing-cmo).
  // Each gets a `route` handler so `ceo:route → <director>:route` resolves.
  // Their outgoing edges (director→specialist) already exist from the seed;
  // registerLeavesFromEdges below will wire respond handlers for the leaves.
  const discoveredDirectors: Unit[] = []
  for (const uid of discoverDirectorsFromEdges(net)) {
    if (uid === marketingDirector.id) continue
    const u = net.has(uid) ? net.get(uid)! : net.add(uid)
    if (!u.has('route')) u.on('route', makeRouteHandler(net, uid, ':respond'))
    discoveredDirectors.push(u)
  }

  const ceo = net.has('ceo') ? net.get('ceo')! : net.add('ceo')
  if (!ceo.has('route')) ceo.on('route', makeCeoRouteHandler(net, 'ceo'))
  if (!ceo.has('respond')) {
    ceo.on(
      'respond',
      leafHandler({
        uid: 'ceo',
        systemPrompt:
          'You are the CEO of the ONE substrate. Your team includes specialists in marketing, SEO, content, ads, analytics, and creative work. For casual greetings, small talk, or unclear requests, reply warmly and briefly (<=80 words), then invite the user to ask about a specific area your team handles. Never pretend to be a specialist — route work to them by naming what they cover.',
        ...opts.ceoLeaf,
      }),
    )
  }

  let registered: string[] = []
  let skipped: string[] = []
  const specialists: Unit[] = []
  if (opts.registerSpecialists !== false) {
    const directorUids = [marketingDirector.id]
    // Scan edges from every known director (CEO and chairman excluded). This
    // keeps the leaf set in sync with whatever the seed script produced.
    for (const uid of net.list()) {
      if (uid === 'ceo' || uid === 'chairman') continue
      const u = net.get(uid)
      if (u?.has('route') && !directorUids.includes(uid)) directorUids.push(uid)
    }
    const result = registerLeavesFromEdges(net, directorUids, undefined, { leaf: opts.leaf })
    registered = result.registered
    skipped = result.skipped
    for (const uid of [...registered, ...skipped]) {
      const u = net.get(uid)
      if (u) specialists.push(u)
    }
  }

  return { ceo, directors: [marketingDirector, ...discoveredDirectors], specialists, registered, skipped }
}
