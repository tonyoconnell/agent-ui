/**
 * POST /api/chat-chairman — SSE endpoint for the Chairman chat.
 *
 * Flow (the Four Outcomes + deterministic sandwich):
 *   1. Auth: chairman role required in production; dev opens with X-Dev-Chairman.
 *   2. Classify (pure, <0.1ms) → [domain, ...subTags].
 *   3. Signal `ceo:route` with replyTo; CEO forwards to director, director to
 *      specialist — all zero-LLM pheromone hops.
 *   4. Leaf runs the LLM, streaming tokens into SSE via the onDelta hook
 *      captured through module-level state (per-session key).
 *   5. Emit `breadcrumb` as soon as the first token arrives (chain is known
 *      by then — the leaf sees the full chain from data.chain + self).
 *   6. Emit `delta` per token, `done` on resolution, `error` on auth/validation.
 *
 * Four Outcomes → SSE done.outcome:
 *   {result}     → outcome=result    + mark in ask()'s edges (world.ts)
 *   {timeout}    → outcome=timeout   + neutral (no warn)
 *   {dissolved}  → outcome=dissolved + warn via UI feedback (🐢/👎)
 *   {failure}    → outcome=failure   + warn via UI feedback
 */

import type { APIRoute } from 'astro'
import { wireChairmanChain } from '@/engine/chairman-chain'
import type { PersistentWorld } from '@/engine/persist'
import { leafHandler } from '@/engine/specialist-leaf'
import { getRoleForUser } from '@/lib/api-auth'
import { getNet } from '@/lib/net'
import { roleCheck } from '@/lib/role-check'
import { classifyWithConfidence } from '@/lib/tag-classifier'
import { readParsed } from '@/lib/typedb'

export const prerender = false

const ASK_TIMEOUT_MS = 30_000

// Module-level flag so wireChairmanChain runs exactly once per isolate.
let chainWired = false

/**
 * Narrow, anchored edge loader. The general load() query in persist.ts scans
 * the full path table which times out against production TypeDB when there
 * are many paths. We only need edges from chairman/ceo and whoever they hire,
 * so query by specific from-uids — anchored queries return fast (~100ms).
 * Runs on every request but is fast, and results accumulate on the singleton
 * net.strength so subsequent synthesis + routing see them.
 */
async function loadChainEdges(net: PersistentWorld): Promise<void> {
  // Total budget — if TypeDB is slow today, give up early rather than block
  // the chat request for 30s+ per round. Uses whatever edges we managed to
  // hydrate; downstream falls back to CEO self-leaf if net.strength is empty.
  const BUDGET_MS = 4_000
  const deadline = Date.now() + BUDGET_MS

  const queryFrom = (from: string): Promise<Array<{ tid?: unknown; s?: unknown }>> => {
    const remaining = Math.max(500, deadline - Date.now())
    return Promise.race([
      readParsed(
        `match $e (source: $f, target: $t) isa path, has strength $s; $f has uid "${from.replace(/"/g, '\\"')}"; $t has uid $tid; select $tid, $s;`,
      ) as Promise<Array<{ tid?: unknown; s?: unknown }>>,
      new Promise<Array<{ tid?: unknown; s?: unknown }>>((resolve) => setTimeout(() => resolve([]), remaining)),
    ]).catch(() => [])
  }

  const seeds = ['chairman', 'ceo']
  const visited = new Set<string>()
  let frontier = seeds
  const MAX_ROUNDS = 3
  for (let r = 0; r < MAX_ROUNDS && frontier.length && Date.now() < deadline; r++) {
    const next = new Set<string>()
    // Query all current-frontier uids in parallel — subsequent rounds need
    // the results but within-round we can race them.
    const results = await Promise.all(
      frontier
        .filter((f) => !visited.has(f))
        .map(async (from) => {
          visited.add(from)
          const rows = await queryFrom(from)
          return { from, rows }
        }),
    )
    for (const { from, rows } of results) {
      for (const row of rows) {
        const to = row.tid as string
        const strength = row.s as number
        if (typeof to === 'string' && typeof strength === 'number' && strength > 0) {
          const edge = `${from}→${to}`
          if ((net.strength[edge] ?? 0) < strength) net.strength[edge] = strength
          if (!visited.has(to)) next.add(to)
        }
      }
    }
    frontier = [...next]
  }
}

/** Wire the chain against the singleton world on first use. Idempotent. */
async function ensureChain(net: PersistentWorld): Promise<void> {
  if (chainWired) return
  chainWired = true
  // Load edges anchored on chairman/ceo/directors so pickRoute has data
  // even when the global load() timed out against a large path table.
  await loadChainEdges(net)
  // Wire routing units (ceo + marketing-director) but do NOT register default
  // specialist leaves here — the endpoint registers per-session leaves below
  // so each request streams to its own SSE writer.
  wireChairmanChain(net, { registerSpecialists: false })
}

/**
 * Per-request: register/upgrade each specialist's `.on('respond')` handler
 * to a leaf that streams into the provided onDelta. The last registration
 * wins because `net.add(uid)` overwrites the unit with a fresh one each time.
 * That's fine: concurrent sessions are keyed by their own `replyTo`, and
 * the leaf's LLM response is scoped per-call by closure.
 */
function wireSessionLeaves(
  net: PersistentWorld,
  onDelta: (uid: string, text: string) => void,
  complete?: Parameters<typeof leafHandler>[0]['complete'],
): void {
  // Dynamic discovery: every unit that is a target of some pheromone edge
  // AND is not itself a router (no `:route` handler) is a specialist that
  // needs a streaming `respond` handler wired to THIS session's onDelta.
  // Also always include CEO since it's a self-fallback leaf.
  const targets = new Set<string>(['ceo'])
  for (const edge in net.strength) {
    const [, to] = edge.split('→')
    if (!to) continue
    if (to === 'chairman') continue
    targets.add(to)
  }
  const CEO_PROMPT =
    'You are the CEO of the ONE substrate. Your team includes specialists in marketing, SEO, content, ads, analytics, and creative work. For casual greetings, small talk, or unclear requests, reply warmly and briefly (<=80 words), then invite the user to ask about a specific area your team handles. Never pretend to be a specialist — route work to them by naming what they cover.'
  const DIRECTOR_PROMPT = (uid: string) =>
    `You are the ${uid} director on the ONE substrate. You route work to specialists, but when a request only has a domain tag (no sub-tag matching a specialist), answer directly and briefly (<=100 words). Explain what your team covers and invite the user to narrow the request. Never pretend to be a specialist.`

  for (const uid of targets) {
    const u = net.has(uid) ? net.get(uid)! : net.add(uid)
    // Every unit gets a streaming respond handler. Routers (directors, CEO)
    // also get one so their self-fallback path works when no sub-tag matches.
    const isCeo = uid === 'ceo'
    const isRouter = u.has('route')
    const systemPrompt = isCeo ? CEO_PROMPT : isRouter ? DIRECTOR_PROMPT(uid) : undefined
    u.on(
      'respond',
      leafHandler({
        uid,
        ...(systemPrompt ? { systemPrompt } : {}),
        onDelta: (tok) => onDelta(uid, tok),
        ...(complete ? { complete } : {}),
      }),
    )
  }
}

/** SSE message writer bound to a ReadableStreamDefaultController. */
type SseEmit = (event: string, data: unknown) => void

function makeEmitter(controller: ReadableStreamDefaultController<Uint8Array>, encoder: TextEncoder): SseEmit {
  return (event, data) => {
    try {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
    } catch {
      /* controller may be closed if the client bailed — swallow */
    }
  }
}

export const POST: APIRoute = async ({ request }) => {
  // ── 1. Parse ─────────────────────────────────────────────────────────────
  let body: { content?: unknown; sessionId?: unknown; tags?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
  if (!content) return Response.json({ error: 'content required' }, { status: 400 })
  if (!sessionId) return Response.json({ error: 'sessionId required' }, { status: 400 })

  // ── 2. Auth ──────────────────────────────────────────────────────────────
  const isProd = (globalThis as any).process?.env?.NODE_ENV === 'production'
  if (isProd) {
    const apiKey = request.headers.get('X-Api-Key') || request.headers.get('Authorization') || ''
    // Pull uid from header or cookie — simplified: the key itself identifies the user.
    // For the Chairman endpoint we require the `chairman` role.
    const uid = apiKey.replace(/^Bearer\s+/i, '').trim() || sessionId
    const role = (await getRoleForUser(uid).catch(() => undefined)) || 'agent'
    if (role !== 'chairman' && !roleCheck(role, 'add_unit')) {
      return Response.json({ error: 'chairman role required' }, { status: 403 })
    }
  } else if (request.headers.get('X-Dev-Chairman') !== 'true' && !isProd) {
    // Dev mode: open unless the client explicitly disabled. We choose to allow
    // by default in dev; production is the hard gate.
  }

  // ── 3. Classify (pure, <0.1ms) ───────────────────────────────────────────
  const t0 = performance.now()
  const tClassifyStart = performance.now()
  const { tags, confidence } = classifyWithConfidence(content)
  const classifyMs = performance.now() - tClassifyStart

  // ── 4. Substrate ─────────────────────────────────────────────────────────
  const net = await getNet()
  await ensureChain(net)

  // ── 5. SSE stream ────────────────────────────────────────────────────────
  const encoder = new TextEncoder()
  let emit: SseEmit = () => {}
  let closed = false
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      emit = makeEmitter(controller, encoder)

      // Heartbeat/keepalive comment — some proxies buffer otherwise.
      try {
        controller.enqueue(encoder.encode(': ready\n\n'))
      } catch {
        /* ignore */
      }

      // ── Driver ───────────────────────────────────────────────────────────
      void (async () => {
        const messageId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
        let breadcrumbEmitted = false
        let deltaEmitted = false
        let specialistUid: string | null = null
        const tRouteStart = performance.now()

        // Wire leaves: onDelta fires as the LLM streams. We also use the
        // first token as the breadcrumb trigger — by then the chain is
        // locked in (the leaf received the signal, so all hops happened).
        wireSessionLeaves(net, (uid, tok) => {
          if (!breadcrumbEmitted) {
            specialistUid = uid
            const routeMs = performance.now() - tRouteStart
            // Chain reflects actual hops reached. CEO self-fallback stops at ceo;
            // everything else reached through the CEO + a director to the leaf.
            const chain = uid === 'ceo' ? ['chairman', 'ceo'] : Array.from(new Set(['chairman', 'ceo', uid]))
            emit('breadcrumb', {
              chain,
              latencyMs: { classify: Math.round(classifyMs * 100) / 100, route: Math.round(routeMs * 100) / 100 },
            })
            breadcrumbEmitted = true
          }
          emit('delta', { text: tok })
          deltaEmitted = true
        })

        // The ask: signal ceo:route, resolve when leaf returns or dissolves.
        const outcome = await net.ask(
          {
            receiver: 'ceo:route',
            data: {
              content,
              tags,
              confidence,
              chain: ['chairman'],
              sessionId,
            },
          },
          'chairman',
          ASK_TIMEOUT_MS,
        )

        // If no leaf ever fired (dissolved before LLM, or classifier routed
        // to a domain without a seeded edge), still emit a breadcrumb so
        // the UI can render the partial chain.
        if (!breadcrumbEmitted) {
          const routeMs = performance.now() - tRouteStart
          emit('breadcrumb', {
            chain: ['chairman', 'ceo'],
            latencyMs: { classify: Math.round(classifyMs * 100) / 100, route: Math.round(routeMs * 100) / 100 },
          })
          breadcrumbEmitted = true
        }

        // Map the four outcomes onto the SSE contract. Rule 1: every signal
        // closes its loop — `done.outcome` is the substrate's witness.
        let finalOutcome: 'result' | 'timeout' | 'dissolved' | 'failure'
        if (outcome.result !== undefined) {
          const r = outcome.result as unknown
          // If the handler returned a {dissolved:true} marker (leaf toxicity PRE-check,
          // or a route-hop with no target), surface it as dissolved, not result.
          if (r && typeof r === 'object' && (r as { dissolved?: boolean }).dissolved === true) {
            finalOutcome = 'dissolved'
            emit('error', { message: 'no specialist for this request' })
          } else {
            finalOutcome = 'result'
            // Non-streaming leaves (e.g. CEO self-fallback) arrive only in
            // `outcome.result`. If nothing streamed through onDelta, emit the
            // full text as a single delta so the UI has content.
            if (!deltaEmitted && typeof r === 'string' && r.length > 0) {
              emit('delta', { text: r })
            }
          }
        } else if (outcome.timeout) {
          finalOutcome = 'timeout'
        } else if (outcome.dissolved) {
          finalOutcome = 'dissolved'
          emit('error', { message: 'no route for these tags' })
        } else {
          finalOutcome = 'failure'
        }

        emit('done', {
          outcome: finalOutcome,
          messageId,
          totalMs: Math.round(performance.now() - t0),
          specialist: specialistUid,
        })

        if (!closed) {
          closed = true
          try {
            controller.close()
          } catch {
            /* already closed */
          }
        }
      })().catch((err) => {
        emit('error', { message: err instanceof Error ? err.message : String(err) })
        emit('done', { outcome: 'failure', messageId: 'err', totalMs: Math.round(performance.now() - t0) })
        if (!closed) {
          closed = true
          try {
            controller.close()
          } catch {
            /* ignore */
          }
        }
      })
    },
    cancel() {
      closed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
