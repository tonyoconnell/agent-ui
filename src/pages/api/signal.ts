/**
 * POST /api/signal — Route a signal through the substrate
 *
 * Body: { sender: string, receiver: string, data?: string, amount?: number, task?: string }
 *
 * Full loop:
 *   1. Write signal to TypeDB
 *   2. suggest_route() → best agent for task
 *   3. Execute agent (if LLM-backed: model + system-prompt)
 *   4. Write result signal
 *   5. mark() on success / warn() on failure
 */
import type { APIRoute } from 'astro'
import { markOutcome, type RouteChoice } from '@/engine/llm-router'
import { getNet } from '@/lib/net'
// @/lib/sui is imported lazily inside the Sui-mirror try block so that a Sui
// SDK breakage (e.g. v1→v2 rename) cannot take down /api/signal and, with it,
// every page that routes UI clicks through this endpoint.
import { readParsed, write, writeSilent } from '@/lib/typedb'

/** Validate UID format (alphanumeric, hyphens, colons only) */
function validateUid(uid: string): boolean {
  return /^[a-zA-Z0-9:_-]+$/.test(uid) && uid.length > 0 && uid.length <= 255
}

/** Escape TQL string values */
function escapeTqlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION CACHE (in-process, 5-min TTL)
// Reduces TypeDB reads on every signal from 3 to 0 on cache hits
// ═══════════════════════════════════════════════════════════════════════════

// Cycle 1.5: centralized in `src/engine/adl-cache.ts` so `syncAdl`
// can invalidate without reverse-importing from Astro pages.
import {
  audit,
  type CacheEntry,
  enforcementMode,
  flushAuditBuffer,
  getCached,
  invalidatePermCache,
  setCached,
} from '@/engine/adl-cache'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { checkRateCeiling, getUsage, recordCall } from '@/lib/metering'
import { ownerBypass } from '@/lib/role-check'
import { checkApiCallLimit, tierLimitResponse } from '@/lib/tier-limits'
import { isWarm } from '@/lib/ui-prefetch'

/**
 * Helper for owner-bypass gate handling (Gap 2). Call inside a gate's
 * failure branch BEFORE the existing audit() + deny return. Returns:
 *   - undefined  → caller is not owner, fall through to normal gate logic
 *   - Response (503) → owner audit emit failed in 'enforce' mode; caller
 *                       must return this response (no bypass without a record)
 *   - Response (200) → sentinel — caller should treat as bypass (skip gate)
 *
 * The actual bypass-allow path returns no Response from the helper; signal.ts
 * pattern is: if ownerBypassResp returns a Response, return it; if it returns
 * 'bypass', skip the gate; otherwise (not-owner) fall through.
 */
async function maybeOwnerBypass(
  auth: { role?: string; user?: string } | null | undefined,
  receiver: string,
  action: 'scope-bypass' | 'network-bypass' | 'sensitivity-bypass',
  gate: 'scope' | 'network' | 'sensitivity',
  payload: unknown,
): Promise<'bypass' | 'not-owner' | Response> {
  const decision = await ownerBypass(auth, { receiver, action, gate, payload })
  if (decision === 'enforce-block') {
    return new Response(
      JSON.stringify({
        error: 'owner audit emit failed in enforce mode',
        code: 'OWNER_AUDIT_REQUIRED',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }
  return decision
}

// 5-min cache for sender|receiver group-share resolution.
const SCOPE_CACHE = new Map<string, { shares: boolean; expires: number }>()

export const POST: APIRoute = async ({ request, locals }) => {
  // Cycle 3: drain the in-engine audit ring buffer into D1. Fire-and-forget —
  // callers never wait on observability. Prior requests' audits (from bridge,
  // llm, api, persist gates) become durable here since those modules can't
  // bind D1 themselves.
  const db = await getD1(locals)
  if (db) void flushAuditBuffer(db).catch(() => 0)

  // Parse body defensively. A malformed body (unescaped control char, truncated
  // keepalive payload, non-JSON mime) used to throw an uncaught SyntaxError that
  // Astro surfaced as a 500, crashing the UI feedback loop. Return a clean 400
  // instead so the chairman chat's 👍/👎/🐢 buttons degrade gracefully.
  let body: {
    sender?: string
    receiver?: string
    data?: unknown
    task?: string
    amount?: number
    scope?: 'private' | 'group' | 'public'
  }
  try {
    body = (await request.json()) as typeof body
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Invalid JSON body',
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    )
  }
  const { sender, receiver: receiverRaw, data: dataRaw, amount = 0, task, scope } = body
  let receiver = receiverRaw
  // Coerce `data` to string — callers occasionally send objects (e.g. when a
  // UI helper forgets to JSON.stringify), and `escapeTqlString` would blow up
  // with `str.replace is not a function`. Accept string verbatim, serialize
  // anything else, ignore nullish.
  const data: string | undefined =
    typeof dataRaw === 'string'
      ? dataRaw
      : dataRaw == null
        ? undefined
        : (() => {
            try {
              return JSON.stringify(dataRaw)
            } catch {
              return undefined
            }
          })()

  if (!sender || !receiver) {
    return new Response(JSON.stringify({ error: 'Missing sender or receiver' }), { status: 400 })
  }

  // Validate UIDs to prevent TQL injection
  if (!validateUid(sender)) {
    return new Response(JSON.stringify({ error: 'Invalid sender format' }), { status: 400 })
  }
  if (!validateUid(receiver)) {
    return new Response(JSON.stringify({ error: 'Invalid receiver format' }), { status: 400 })
  }
  if (task && !validateUid(task)) {
    return new Response(JSON.stringify({ error: 'Invalid task format' }), { status: 400 })
  }

  // Validate amount
  if (typeof amount !== 'number' || amount < 0 || amount > 1_000_000) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 })
  }

  // ── TAG RECEIVER ROUTING (Stage 12: Subscribe — Cycle 2) ────────────────────
  // Resolve tag:X receivers to the best public subscriber before metering.
  // Aborted tag signals (no subscriber) never consume API quota or ADL checks.
  if (receiver.startsWith('tag:')) {
    const { resolveTagReceiver } = await import('@/lib/subscribe-routing')
    const resolvedUid = await resolveTagReceiver(receiver.slice(4), db)
    if (!resolvedUid) {
      return new Response(JSON.stringify({ dissolved: true, reason: 'no-subscriber', tag: receiver }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    receiver = resolvedUid
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BAAS METERING (Platform tier gate — Cycle 1 T-B1-04)
  //
  // Run BEFORE ADL gates so a rate-limited caller never touches the ADL
  // permission cache or TypeDB. Anonymous callers fall through — they get
  // rate-limited by the Cloudflare frontdoor, not here.
  // ═══════════════════════════════════════════════════════════════════════════
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (auth?.isValid) {
    // OWNER HARD CEILING (Gap 5) — runs BEFORE tier check + role bypass.
    // Applies to every key including owner; prevents owner self-DOS even
    // when tier=enterprise has unlimited soft quota and the owner role
    // bypasses scope/network/sensitivity gates.
    const ceiling = checkRateCeiling(auth.keyId)
    if (!ceiling.ok) {
      void import('@/lib/security-signals')
        .then((m) => m.emitSecurityEvent({ kind: 'rate-limit', edge: `${auth.keyId}→hard-ceiling:${ceiling.reason}` }))
        .catch(() => {})
      return new Response(
        JSON.stringify({
          error: 'Rate ceiling exceeded',
          code: 'OWNER_HARD_CEILING_EXCEEDED',
          reason: ceiling.reason,
          count: ceiling.count,
          limit: ceiling.limit,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': String(ceiling.retryAfter) },
        },
      )
    }

    const tier = auth.tier ?? 'free'
    const usage = await getUsage(db, auth.keyId)
    const gate = checkApiCallLimit(tier, usage)
    if (!gate.ok) {
      // Warn the caller's boundary once so pheromone learns which keys hit the wall.
      void import('@/lib/security-signals')
        .then((m) => m.emitSecurityEvent({ kind: 'rate-limit', edge: `${auth.keyId}→tier-${tier}` }))
        .catch(() => {})
      return tierLimitResponse(gate)
    }
    // Fire-and-forget: record this call in D1. Never blocks the request.
    void recordCall(db, auth.keyId)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADL PERMISSION CHECKS (Deterministic Sandwich: PRE-checks)
  // ═══════════════════════════════════════════════════════════════════════════

  // Stage 1 — Lifecycle gate: reject if receiver is retired or deprecated
  const statusCacheKey = `${receiver}:status`
  const cachedStatusEntry = getCached(statusCacheKey) as CacheEntry | undefined
  let adlStatus: string | undefined

  if (cachedStatusEntry?.adlStatus) {
    adlStatus = cachedStatusEntry.adlStatus
  } else if (!isWarm(receiver)) {
    const receiverStatusRows = await readParsed(`
      match $u isa unit, has uid "${receiver}", has adl-status $st;
      select $st;
    `).catch(() => [])

    if (receiverStatusRows.length > 0) {
      adlStatus = receiverStatusRows[0].st as string
      setCached(statusCacheKey, { adlStatus })
    }
  }

  if (adlStatus && (adlStatus === 'retired' || adlStatus === 'deprecated')) {
    const mode = enforcementMode()
    audit({
      sender,
      receiver,
      gate: 'lifecycle',
      decision: mode === 'audit' ? 'allow-audit' : 'deny',
      mode,
      reason: `receiver adl-status=${adlStatus}`,
    })
    if (mode === 'enforce') {
      return new Response(
        JSON.stringify({ error: 'Unit is retired or deprecated', code: 'UNIT_INACTIVE', adlStatus }),
        { status: 410 },
      )
    }
    // audit mode: fall through
  }

  // Stage 2 — Network permission gate: if receiver has perm-network.allowedHosts, verify sender is in list
  const networkCacheKey = `${receiver}:network`
  const cachedNetworkEntry = getCached(networkCacheKey) as CacheEntry | undefined
  let allowedHosts: string[] = []

  if (cachedNetworkEntry?.permNetwork?.allowedHosts) {
    allowedHosts = cachedNetworkEntry.permNetwork.allowedHosts
  } else if (!cachedNetworkEntry && !isWarm(receiver)) {
    const permNetworkRows = await readParsed(`
      match $u isa unit, has uid "${receiver}", has perm-network $pn;
      select $pn;
    `).catch(() => [])

    if (permNetworkRows.length > 0) {
      try {
        const permNet = JSON.parse(permNetworkRows[0].pn as string)
        allowedHosts = permNet.allowed_hosts || permNet.allowedHosts || []
        setCached(networkCacheKey, { permNetwork: { allowedHosts } })
      } catch (_e) {
        // JSON parse error — ignore, continue (malformed perm-network)
      }
    }
  }

  if (Array.isArray(allowedHosts) && allowedHosts.length > 0) {
    const senderAllowed = allowedHosts.includes(sender) || allowedHosts.includes('*')
    if (!senderAllowed) {
      // OWNER BYPASS (Gap 2 — owner-todo task 2.r2): if caller is owner,
      // emit owner_audit row and skip the gate. Audit emit before bypass.
      const ob = await maybeOwnerBypass(auth, receiver, 'network-bypass', 'network', {
        sender,
        receiver,
        allowedHosts,
      })
      if (ob instanceof Response) return ob
      if (ob !== 'bypass') {
        const mode = enforcementMode()
        audit({
          sender,
          receiver,
          gate: 'network',
          decision: mode === 'audit' ? 'allow-audit' : 'deny',
          mode,
          reason: `sender not in allowedHosts=${JSON.stringify(allowedHosts)}`,
        })
        if (mode === 'enforce') {
          return new Response(
            JSON.stringify({
              error: 'Sender not in receiver allowedHosts',
              code: 'PERMISSION_DENIED',
              sender,
            }),
            { status: 403 },
          )
        }
        // audit mode: fall through
      }
    }
  }

  // Stage 3 — Sensitivity mismatch (soft, non-blocking): tag signal if sender is restricted and receiver is lower
  // This creates an audit trail without blocking the signal
  const senderSensCacheKey = `${sender}:sensitivity`
  const receiverSensCacheKey = `${receiver}:sensitivity`
  const sensitivityRank = { public: 0, internal: 1, confidential: 2, restricted: 3 }

  let senderSensitivity: string = 'internal'
  let receiverSensitivity: string = 'internal'

  const cachedSenderSens = getCached(senderSensCacheKey) as CacheEntry | undefined
  const cachedReceiverSens = getCached(receiverSensCacheKey) as CacheEntry | undefined

  if (cachedSenderSens?.senderSensitivity) {
    senderSensitivity = cachedSenderSens.senderSensitivity
  } else {
    const senderSensitivityRows = await readParsed(`
      match $u isa unit, has uid "${sender}", has data-sensitivity $ds;
      select $ds;
    `).catch(() => [])

    if (senderSensitivityRows.length > 0) {
      senderSensitivity = senderSensitivityRows[0].ds as string
      setCached(senderSensCacheKey, { senderSensitivity })
    }
  }

  if (cachedReceiverSens?.receiverSensitivity) {
    receiverSensitivity = cachedReceiverSens.receiverSensitivity
  } else {
    const receiverSensitivityRows = await readParsed(`
      match $u isa unit, has uid "${receiver}", has data-sensitivity $ds;
      select $ds;
    `).catch(() => [])

    if (receiverSensitivityRows.length > 0) {
      receiverSensitivity = receiverSensitivityRows[0].ds as string
      setCached(receiverSensCacheKey, { receiverSensitivity })
    }
  }

  if (
    sensitivityRank[senderSensitivity as keyof typeof sensitivityRank] >
    sensitivityRank[receiverSensitivity as keyof typeof sensitivityRank]
  ) {
    // OWNER BYPASS (Gap 2 — owner-todo task 2.r2): owner can route across
    // sensitivity tiers; audit row goes to owner_audit before bypass.
    const ob = await maybeOwnerBypass(auth, receiver, 'sensitivity-bypass', 'sensitivity', {
      sender,
      receiver,
      senderSensitivity,
      receiverSensitivity,
    })
    if (ob instanceof Response) return ob
    if (ob !== 'bypass') {
      const sensMode = enforcementMode()
      audit({
        sender,
        receiver,
        gate: 'sensitivity',
        decision: sensMode === 'enforce' ? 'deny' : 'observe',
        mode: sensMode,
        reason: `sender=${senderSensitivity} > receiver=${receiverSensitivity}`,
      })
      if (sensMode === 'enforce') {
        return new Response(
          JSON.stringify({ dissolved: true, reason: `sensitivity:${senderSensitivity}>${receiverSensitivity}` }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    }
  }

  // Scope enforcement (Cycle 3): only fires when caller is authenticated.
  // Unauthed callers skip (preserves fail-open legacy behavior).
  // Reuses `auth` already resolved at the metering gate (avoids a second lookup).
  try {
    if (auth?.isValid) {
      const ctx = auth
      if (ctx.isValid) {
        const effectiveScope = scope ?? 'group'
        if (effectiveScope === 'private' && sender !== receiver) {
          // OWNER BYPASS (Gap 2 — owner-todo task 2.r2): owner can cross
          // private scope; audit row goes to owner_audit before bypass.
          const ob = await maybeOwnerBypass(auth, receiver, 'scope-bypass', 'scope', {
            sender,
            receiver,
            scope: 'private',
          })
          if (ob instanceof Response) return ob
          if (ob !== 'bypass') {
            return new Response(JSON.stringify({ dissolved: true, reason: 'scope-private-violation' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            })
          }
        }
        if (effectiveScope === 'group') {
          const cacheKey = [sender, receiver].sort().join('|')
          const cached = SCOPE_CACHE.get(cacheKey)
          let sharesGroup: boolean
          if (cached && cached.expires > Date.now()) {
            sharesGroup = cached.shares
          } else {
            const safeSender = sender.replace(/[^a-zA-Z0-9_:.-]/g, '')
            const safeReceiver = receiver.replace(/[^a-zA-Z0-9_:.-]/g, '')
            const rows = await readParsed(
              `match
                $a isa unit, has uid "${safeSender}";
                $b isa unit, has uid "${safeReceiver}";
                (member: $a, group: $g) isa membership;
                (member: $b, group: $g) isa membership;
                select $g; limit 1;`,
            ).catch(() => [])
            sharesGroup = rows.length > 0
            SCOPE_CACHE.set(cacheKey, { shares: sharesGroup, expires: Date.now() + 5 * 60 * 1000 })
          }
          // Hierarchy fallback: sibling sub-groups under same parent world share scope
          if (!sharesGroup) {
            const sorted = [sender, receiver].sort().join('|')
            const hierKey = `hier:${sorted}`
            const hierCached = SCOPE_CACHE.get(hierKey)
            if (hierCached && hierCached.expires > Date.now()) {
              sharesGroup = hierCached.shares
            } else {
              const safeSender = sender.replace(/[^a-zA-Z0-9_:.-]/g, '')
              const safeReceiver = receiver.replace(/[^a-zA-Z0-9_:.-]/g, '')
              const hierRows = await readParsed(`
                match $a isa unit, has uid "${safeSender}";
                      $b isa unit, has uid "${safeReceiver}";
                      (member: $a, group: $ga) isa membership;
                      (member: $b, group: $gb) isa membership;
                      (parent: $root, child: $ga) isa hierarchy;
                      (parent: $root, child: $gb) isa hierarchy;
                select $root; limit 1;
              `).catch(() => [])
              sharesGroup = hierRows.length > 0
              SCOPE_CACHE.set(hierKey, { shares: sharesGroup, expires: Date.now() + 5 * 60 * 1000 })
            }
          }
          // Self-signals always allowed regardless of group
          if (!sharesGroup && sender !== receiver) {
            // OWNER BYPASS (Gap 2 — owner-todo task 2.r2): owner can cross
            // group scope; audit row goes to owner_audit before bypass.
            const ob = await maybeOwnerBypass(auth, receiver, 'scope-bypass', 'scope', {
              sender,
              receiver,
              scope: 'group',
              sharesGroup: false,
            })
            if (ob instanceof Response) return ob
            if (ob !== 'bypass') {
              return new Response(JSON.stringify({ dissolved: true, reason: 'scope-group-violation' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              })
            }
          }
        }
        // 'public' — no check
      }
    }
  } catch {
    /* scope enforcement is best-effort; fail-open on errors */
  }

  const dataStr = data ? escapeTqlString(data).slice(0, 10000) : ''
  const now = new Date().toISOString().replace('Z', '')
  const start = Date.now()

  try {
    // 1. Record the inbound signal
    await write(`
      match
        $from isa unit, has uid "${sender}";
        $to isa unit, has uid "${receiver}";
      insert
        (sender: $from, receiver: $to) isa signal,
          has data "${dataStr}",
          has amount ${amount},
          has success true,
          has ts ${now};
    `)

    // 2. If task specified, ask TypeDB for best route
    let routed: string | null = null
    let result: string | null = null

    if (task) {
      const escapedTask = escapeTqlString(task)
      const routes = await readParsed(`
        match
          $from isa unit, has uid "${receiver}";
          $sk isa skill, has name $sn; $sn contains "${escapedTask}";
          (source: $from, target: $to) isa path, has strength $s;
          (provider: $to, offered: $sk) isa capability;
          $to has uid $id; $s >= 5.0;
        sort $s desc; limit 1;
        select $id, $s;
      `).catch(() => [])

      if (routes.length > 0) {
        routed = routes[0].id as string
      }
    }

    // 3. Execute agent if it has model + system-prompt
    const target = routed || receiver
    const agentInfo = await readParsed(`
      match $u isa unit, has uid "${target}", has model $m, has system-prompt $sp;
      select $m, $sp;
    `).catch(() => [])

    if (agentInfo.length > 0) {
      const model = agentInfo[0].m as string
      const systemPrompt = agentInfo[0].sp as string
      const prompt = data || 'No input provided'

      // All models route through OpenRouter (OpenAI-compatible API)
      const apiKey = import.meta.env.OPENROUTER_API_KEY || ''

      // Map agent model names to OpenRouter model IDs
      const orModel = model.includes('/')
        ? model // already namespaced
        : 'meta-llama/llama-4-maverick' // default: 1M ctx, $0.15/M tokens, leading open model

      if (apiKey) {
        const tModel = Date.now()
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://one.ie',
              'X-Title': 'ONE Substrate',
            },
            body: JSON.stringify({
              model: orModel,
              max_tokens: 4096,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
              ],
            }),
          })
          if (!res.ok) {
            console.error('OpenRouter error:', res.status, await res.text().then((t) => t.slice(0, 300)))
            result = null
          } else {
            const d = (await res.json()) as { choices: Array<{ message: { content: string } }> }
            result = d.choices?.[0]?.message?.content || null
          }
        } catch (err) {
          console.error('OpenRouter fetch failed:', err instanceof Error ? err.message : err)
          result = null
        }

        // Accumulate pheromone on the tag→model edge. Authorial model choice
        // is preserved (no routing override); only the outcome is learned.
        try {
          const net = await getNet()
          const tag = task || 'default'
          const choice: RouteChoice = {
            model: { id: orModel, costPerMToken: 0 },
            reason: 'pheromone',
            edge: `${tag}→${orModel}`,
            estimatedCost: 0,
          }
          markOutcome(net, choice, {
            response: result ?? undefined,
            failure: result === null ? true : undefined,
            quality: result ? (result.length > 40 ? 0.7 : 0.4) : 0,
            latencyMs: Date.now() - tModel,
          })
        } catch {
          // getNet() not available or write races — pheromone mark is fire-and-forget
        }
      }
    }

    const latency = Date.now() - start
    const success = result !== null

    // 4. Write result signal if we got one
    if (result && routed) {
      const resultNow = new Date().toISOString().replace('Z', '')
      const resultStr = escapeTqlString(result.slice(0, 10000))
      writeSilent(`
        match
          $from isa unit, has uid "${routed}";
          $to isa unit, has uid "${sender}";
        insert
          (sender: $from, receiver: $to) isa signal,
            has data "${resultStr}",
            has amount 0,
            has success true,
            has latency ${latency}.0,
            has ts ${resultNow};
      `)
    }

    // 5. Strengthen or warn the path
    if (success) {
      // mark() — strengthen path
      await write(`
        match
          $from isa unit, has uid "${sender}";
          $to isa unit, has uid "${receiver}";
          $e (source: $from, target: $to) isa path,
            has strength $s, has traversals $t, has revenue $r;
        delete $s of $e; delete $t of $e; delete $r of $e;
        insert
          $e has strength ($s + 1.0),
            has traversals ($t + 1),
            has revenue ($r + ${amount});
      `).catch(() => {
        return write(`
          match
            $from isa unit, has uid "${sender}";
            $to isa unit, has uid "${receiver}";
          insert
            (source: $from, target: $to) isa path,
              has strength 1.0, has resistance 0.0,
              has traversals 1, has revenue ${amount};
        `)
      })
    } else {
      // warn() — add resistance
      writeSilent(`
        match
          $from isa unit, has uid "${sender}";
          $to isa unit, has uid "${receiver}";
          $e (source: $from, target: $to) isa path, has resistance $r;
        delete $r of $e;
        insert $e has resistance ($r + 1.0);
      `)
    }

    // 6. Push path changes to KV (fire and forget — keeps edge routing fresh)
    // Targeted sync: only paths.json. Group-scoped if data.group present.
    // SLA: KV reflects mark/warn ≤2s p99.
    const syncUrl = import.meta.env.SYNC_WORKER_URL || 'https://one-sync.oneie.workers.dev'
    const signalGroup = (dataRaw as { group?: string } | null)?.group
    const syncQs = signalGroup ? `keys=paths&group=${encodeURIComponent(signalGroup)}` : 'keys=paths'
    fetch(`${syncUrl}/sync?${syncQs}`, { method: 'POST' }).catch(() => {})

    // 7. Mirror to Sui (if configured — fire and forget)
    let suiDigest: string | null = null
    try {
      const { resolveUnit, send: suiSend } = await import('@/lib/sui')
      const senderUnit = await resolveUnit(sender)
      const receiverUnit = await resolveUnit(target)
      if (senderUnit?.wallet && receiverUnit?.wallet) {
        const enc = new TextEncoder()
        const payload = data ? enc.encode(data.slice(0, 1000)) : new Uint8Array()
        const { digest } = await suiSend(
          sender,
          senderUnit.objectId,
          receiverUnit.objectId,
          receiverUnit.wallet,
          task || 'default',
          payload,
          amount,
        )
        suiDigest = digest
      }
    } catch {
      // Sui not configured, SDK broken, or tx failed — TypeDB signal still recorded
    }

    // Invalidate receiver's permission cache so next signal picks up any changes
    invalidatePermCache(receiver)

    return new Response(
      JSON.stringify({
        ok: true,
        routed,
        result: result?.slice(0, 500),
        latency,
        success,
        sui: suiDigest,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
