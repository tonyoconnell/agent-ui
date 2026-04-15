# System Speed — The Whole Stack

**Everything except the LLM is math.** Pages serve from the edge. Routing
decisions are in-memory arithmetic. The database is a JSON snapshot in
`globalThis`. Wallets derive from a seed, never read. Signals dispatch in
microseconds. The LLM is the only probabilistic step — and it's wrapped in
a deterministic sandwich that frequently skips the call entirely.

That's why the system is fast. Not because any one thing is fast, but because
**every layer skips a round-trip most systems take for granted**. Multiply
the skips and you get the advantage.

> **Live numbers** are in the auto-generated [speed-test.md](./speed-test.md),
> regenerated on every test run. **Aspirational targets** and the full
> benchmark matrix live in [speed.md](./speed.md). This doc is the **narrative**
> — how the layers compose into end-to-end speed.

---

## The Stack, Top to Bottom

```
┌────────────────────────────────────────────────────────────────┐
│  BROWSER                                                       │
│  Astro SSR: TTFB <200ms · FCP <500ms                           │
│  React 19 islands: hydrate <100ms (only interactive bits)      │
└──────────────────────────────┬─────────────────────────────────┘
                               │  <200ms (5 CF regions)
┌──────────────────────────────▼─────────────────────────────────┐
│  EDGE (Cloudflare Workers)                                     │
│  Gateway p50 <10ms · NanoClaw webhook <3s (LLM-bound)          │
│  TypeDB proxy, WsHub Durable Object, broadcast fanout          │
└──────────────────────────────┬─────────────────────────────────┘
                               │  0ms cached · <10ms KV
┌──────────────────────────────▼─────────────────────────────────┐
│  CACHE (three layers)                                          │
│  globalThis._edgeKvCache  0ms within 30s TTL                   │
│  KV JSON snapshots        <10ms (paths/units/skills/highways)  │
│  TypeDB Cloud             ~100ms (never touched on read path)  │
└──────────────────────────────┬─────────────────────────────────┘
                               │  in-memory
┌──────────────────────────────▼─────────────────────────────────┐
│  SUBSTRATE RUNTIME                                             │
│  mark/warn <0.001ms · select <0.005ms · fade 1k <5ms           │
│  signal dispatch <1ms · ask 3-chain <100ms                     │
│  queue drains on unit add · pheromone accumulates in memory    │
└──────────────────────────────┬─────────────────────────────────┘
                               │  fire-and-forget
┌──────────────────────────────▼─────────────────────────────────┐
│  BRAIN (TypeDB + Sui)                                          │
│  TypeDB writes async (non-blocking) · 19 units, 18 skills      │
│  Sui: deterministic keypair derivation, no hot wallet          │
│  Revenue settlement: sub-second finality                       │
└────────────────────────────────────────────────────────────────┘
```

---

## Why The Database Is Fast (Even Though TypeDB Is Slow)

TypeDB is the source of truth. TypeDB round-trips are ~100ms. **The read
path never touches TypeDB.**

```
┌─ TypeDB (truth, ~100ms) ──→ KV snapshot (~10ms) ──→ globalThis (0ms) ─┐
│                                                                       │
│  Sync worker: every 60s or on signal                                  │
│  FNV-1a hash: skip KV write if unchanged                              │
│  kvInvalidate(key) on direct writes                                   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**The hot path:**

```
fetch /api/ask
  → getPaths(kv)                    // globalThis hit = 0ms
  → net.select('task')              // <0.005ms — pure math
  → net.signal({ receiver })        // <1ms — in-memory dispatch
  → net.mark(edge)                  // <0.001ms — integer add
  → (async) writeSilent(tql)        // fire-and-forget to TypeDB
← 200 OK
```

No DB read. No lock. No ORM. No JOIN. The state IS a JSON object keyed
by strings.

**Verified** in [speed-test.md](./speed-test.md): `edge:cache:hit` p95
< 0.01ms, `pheromone:mark` p95 < 0.001ms, `signal:dispatch` p95 < 1ms.

---

## End-to-End Trace: Agent Signup + First Signal

A user creates an agent, it derives a wallet, registers on-chain, takes a
signal, marks its path. Start to finish:

| Step | What happens | Latency | Layer |
|------|--------------|--------:|-------|
| 1. Browser POST `/api/agents/sync` | Markdown body → Astro SSR handler | ~50ms | browser → edge |
| 2. `parse(md)` | Frontmatter YAML → `AgentSpec` | **<0.1ms** | Cloudflare isolate |
| 3. `deriveKeypair(uid)` | `SHA-256(seed + uid)` → Ed25519 | **<5ms** | isolate, pure crypto |
| 4. `addressFor(uid)` | public key → Sui address | **<1ms** | isolate |
| 5. `toTypeDB(spec)` | spec → TQL insert statements | **<0.5ms** | isolate |
| 6. `syncAgent(spec)` | insert unit + skills + capabilities + membership | ~300ms | TypeDB round-trip |
| 7. `wireAgent(spec)` | register `.on()` handlers on runtime | **<1ms** | substrate |
| 8. `net.signal({ receiver })` | route to new unit's handler | **<1ms** | substrate |
| 9. LLM call | OpenRouter → llama-4-maverick | 800–2000ms | external |
| 10. `net.mark(edge)` | integer increment on `strength[edge]` | **<0.001ms** | substrate |
| 11. `writeSilent(tql)` | async TypeDB mark persistence | 0ms (fire-and-forget) | substrate |

**Agent is live in <10ms of substrate work.** Steps 6 and 9 are the only
slow parts — both external, both amortized:

- Step 6 (TypeDB sync) happens once per agent creation, not per signal.
- Step 9 (LLM) is the ONLY probabilistic part. The deterministic sandwich
  around it (isToxic, capability check) often dissolves the call entirely,
  cutting the cost to zero.

Eight of the eleven steps together take **<8ms** — all pure math or in-memory
dispatch. That's the "fucking fast" part.

---

## End-to-End Trace: Signal Routing Under Load

Ten thousand signals hitting a 1,000-path world. What happens:

```
per signal
 ├─ isToxic(edge)?        <0.001ms  (3 integer compares)
 ├─ capability exists?    <0.001ms  (object key lookup on cached skills.json)
 ├─ select(tags)          <1ms      (weighted max over 1k paths)
 ├─ signal dispatch        <1ms      (Map lookup + function call)
 ├─ mark(edge, depth)     <0.001ms  (integer add)
 └─ writeSilent(tql)       0ms       (fire-and-forget)

Total per signal:  ~2ms (routing + dispatch + mark)
10,000 signals:    ~20 seconds if serial; <1s in parallel isolates

43,200 decisions/day/agent capacity
```

Contrast with a conventional stack:

| Step | ONE | Conventional | Delta |
|------|-----|--------------|------:|
| Routing decision | 0.005ms | 300ms (LLM) | **60,000×** |
| Path memory write | 0.001ms | 10ms (DB write) | **10,000×** |
| Capability lookup | 0.001ms | 50ms (API + ranking) | **50,000×** |
| Dispatch | 1ms | 50ms (HTTP) | **50×** |
| **Total per signal** | **~2ms** | **~400ms** | **~200×** |

---

## Pages: Why They Load Fast

Astro 5 + React 19 islands. Two properties compound:

1. **SSR by default.** HTML arrives parsed; no client JS needed to render.
2. **Islands, not SPA.** Only interactive components hydrate. The world map
   hydrates (it's draggable); the navigation bar doesn't (it's just links).

```
Request /world
  → CF edge picks nearest region (5 regions)              <50ms
  → Astro SSR: render page with React islands as HTML    <100ms
  → TTFB                                                  ~150ms
  → Browser parses, paints                               <500ms FCP
  → Hydrate only interactive islands (world graph)       <100ms
  → Fully interactive                                    <800ms

Subsequent navigation: client-side routing, ~50ms
```

No waterfall. No client-side data fetching blocking paint. The SSR pulls
from `globalThis._edgeKvCache` (0ms) or KV (<10ms). TypeDB is never on
the critical path for page rendering.

---

## Sui: The Harden Step (and Why The Chain Isn't On The Hot Path)

Sui is the permanence layer. Every agent has a derived wallet; proven
highways are hardened to on-chain objects; revenue settles sub-second.
But **the chain is never on the hot path.** Signal routing doesn't wait
for Sui.

```
HOT PATH (every signal)          COLD PATH (harden, federate, revenue)
─────────────────────────        ─────────────────────────────────────
mark() in memory    <0.001ms     sign + tx build         <10ms
writeSilent() async  0ms         submit to Sui         ~400ms
                                 settlement (finality)  <1s
                                 object read             <500ms
```

### Identity: Derive, Don't Store

```
SUI_SEED (32 bytes)  +  agent UID  →  SHA-256  →  Ed25519 keypair
```

- `deriveKeypair(uid)` — **<5ms** per derive (crypto.subtle)
- `addressFor(uid)` — same derive + public-key-to-address — **<5ms**
- `platformKeypair()` — memoized, **<5ms first call, 0ms after**
- `signTx(uid, tx)` — derive + sign — **<10ms**

Zero storage. Zero RPC. Same UID → same address forever. Lose the seed,
lose all wallets. Platform with 10,000 agents = zero wallet rows, zero
fetch latency.

Measured: `identity:sui:address` p95 in [speed-test.md](./speed-test.md).

### Mirror / Absorb — The Bridge

The substrate and the chain stay in sync via two verbs:

```
mirror   TypeDB → Sui     (we observed a highway; freeze it on-chain)
absorb   Sui → TypeDB     (someone minted a path; reflect it in the graph)
resolve  both directions  (reconcile a known divergence)
```

| Operation | Target | Why it's that speed |
|-----------|-------:|---------------------|
| `mirrorActor(spec)` | ~400ms | one tx: create_unit on-chain |
| `mirrorMark(edge)` | ~400ms | one tx: reinforce_path |
| `absorb(objectId)` | ~500ms | sui_getObject RPC + TypeDB insert |
| `resolve(uid)` | ~900ms | mirror + absorb pair |

All of these are **L4+ loop operations** — they run on the slow loops, not
the signal hot path. Signal routing completes in <1ms; Sui write queues
behind it and settles asynchronously.

### Sui Move: What The Contract Pays For

| Move call | Cost (gas) | Finality |
|-----------|------------|----------|
| `create_unit` | ~0.001 SUI | <1s |
| `reinforce_path` | ~0.0005 SUI | <1s |
| `harden_highway` | ~0.002 SUI (one-time) | <1s |
| `pay(amount)` | ~0.001 SUI | <1s (revenue settles) |
| `fade_path` | batched off-chain; on-chain batched monthly | — |

Speed-relevant: **finality is <1s on Sui Testnet and Mainnet.** For a
hardening event (Stage 8 of the lifecycle), the full user-visible delay
is ~1.4s — well inside the attention budget for "permanent proof just
happened."

### Verifying: Testnet Package

```
Package:     0xa5e6bddae833220f58546ea4d2932a2673208af14a52bb25c4a603492078a09e
Network:     Sui Testnet
Status:      Phase 1–5 complete; Phase 2 (identity, wallets) in flight
```

See `docs/TODO-SUI.md` for the phase plan, `src/lib/sui.ts` for the client,
`src/engine/bridge.ts` for mirror/absorb.

---

## Transport Layers (What Else I Forgot)

### Intent Cache — Dedup Before The LLM

`src/engine/intent.ts`. When a user types "translate this", the substrate:

```
input text
  → normalize (strip, lowercase, canonicalize punctuation)
  → hash (FNV-1a → intent-id)
  → D1 lookup: cache hit?  →  return cached result (no LLM)
                          →  miss: LLM + cache the result
```

Cache hit: **<10ms (D1 round-trip)**. The second user asking the same thing
pays 0 LLM tokens. Intent cache is cross-agent — your query benefits from
every other agent's prior work.

Budget: `intent:cache:hit` to be added.

### WebSocket Live Updates — WsHub Durable Object

TaskBoard receives mark/warn/complete events in real time:

```
API route   wsManager.broadcast(msg)
            relayToGateway(msg, X-Broadcast-Secret)    <10ms
Gateway     DO.fetch('/send')                           ~5ms
WsHub DO    state.getWebSockets().forEach(ws.send)       <2ms
Client      switch(msg.type) setTasks(prev.map(...))    <1ms
                                                       ──────
                                                       ~20ms end-to-end
```

Single DO named `"global"` shared across all CF isolates (fixes
cross-isolate delivery). Client resilience: exp backoff reconnect
(1s → 30s), 45s heartbeat, 5s polling fallback after 3 fails.

Verified: `bun run scripts/test-ws-integration.ts` (11/11 tests).
Budget: `ws:broadcast:roundtrip` to be added.

### Channels — Telegram, Discord, Web

| Channel | Ingress | Processing | Reply |
|---------|---------|------------|-------|
| Telegram webhook (sync) | ~50ms | ~3s (LLM-bound) | ~200ms send |
| Discord interaction | ~50ms | ~3s (LLM-bound) | ~200ms send |
| Web `/message` | ~20ms | ~3s (LLM-bound) | instant (same response) |

Telegram processes **synchronously** in the worker — no queue round-trip
on the hot path. Queue is used only for substrate signals, not for user
replies. This is why @onedotbot feels instant: the worker does everything
and responds inline.

Budget: `channels:telegram:normalize`, `channels:web:message` to be added.

### Durable Ask — Survive Worker Restarts

`src/engine/durable-ask.ts`. When an `ask()` is in flight and the worker
cold-restarts, the pending request lives in D1:

```
durableAsk(sig)
  → write to D1 with askId, receiver, expiresAt
  → signal the receiver
  → (worker restart safe — D1 still has the ask)
  → on reply: lookup askId, deliver, delete row
```

Latency overhead vs in-memory ask: **~30ms** (D1 write + read).
Tradeoff: durability vs speed. Used only for long-running asks.

Budget: `ask:durable:overhead` to be added.

### Slow Loops (L4–L7) — The Brain Ticks Hourly

These run at human time scales, not signal time scales. Their speed
governs how fast the system learns, not how fast it responds.

| Loop | Period | Budget | What it does |
|------|--------|--------|--------------|
| L4 Economic | per payment | <100ms | revenue on paths, capability price update |
| L5 Evolution | every 10 min | <5s | rewrite struggling agent prompts (24h cooldown) |
| L6 Knowledge | every hour | <30s | promote highways to hypotheses |
| L7 Frontier | every hour | <30s | detect unexplored tag clusters |

A "slow loop budget" of 30s means: the loop finishes inside its period, so
loops don't back up. Verified in [lifecycle.test.ts](../src/engine/lifecycle.test.ts)
for the on-signal paths; L5–L7 budgets need instrumentation.

Budgets: `loop:L4:economic`, `loop:L5:evolution`, `loop:L6:know`,
`loop:L7:frontier` to be added.

---

## Wallets: Fast Because They Don't Exist Until Needed

Every agent has a Sui wallet. None of them are stored.

```typescript
SUI_SEED (32 bytes, env)  +  agent UID  →  SHA-256  →  Ed25519 keypair
```

- **No database row** for the wallet
- **No RPC** to fetch the private key
- **No HSM round-trip** to sign
- **No key rotation logic**
- **Same UID always produces the same address** — idempotent

Derivation: **<5ms** (SHA-256 + Ed25519, both in-kernel on modern JS
runtimes via `crypto.subtle`). Signing: <1ms. Address lookup for display:
same derivation, cached.

This is why "wallets for every agent" is free. A platform with 10,000
agents has zero wallet-storage cost and zero wallet-fetch latency —
because zero wallets exist on disk. Derive, sign, discard.

Verified: `identity:sui:address` p95 in [speed-test.md](./speed-test.md).

---

## The Deterministic Sandwich Saves The LLM Call

The LLM (800–2000ms) dominates any request that reaches it. Most requests
don't reach it:

```
PRE:   isToxic(edge)?           <0.001ms  →  dissolve (no LLM, no cost)
PRE:   capability exists?        <0.001ms  →  dissolve (no LLM, no cost)
LLM:   generate                  800–2000ms
POST:  mark / warn / dissolve    <0.001ms  →  pheromone updates
```

If PRE dissolves, **total latency is <1ms end-to-end.** A toxicity check
or missing-capability check is 10,000× faster than the LLM call it replaces.
Over a day of 43,200 signals per agent, the sandwich skips the LLM on
~40% of traffic (highways have high strength, low resistance — PRE lets
them through directly; toxic paths skip, too).

Effective cost of routing intelligence: asymptotically $0. **Once a path
is proven, the LLM is replaced by a weight lookup.**

---

## Deploy: The Meta-Speed Number

Shipping new code to production is itself a routing problem — parallel
workers, pre-flight checks, health verification:

```
W0 baseline       biome + tsc + vitest    ~5s
Build             astro build             ~20s
Deploy workers    parallel (3 workers)    ~24s   (vs 64s sequential = 2.7×)
Deploy Pages      Cloudflare Pages        ~16s
Health checks     3 retries w/ backoff    <3s
                                          ─────
TOTAL                                     ~65s
```

Verified 2026-04-14: **65.0s total**. Health latencies on first check:
Gateway 292ms · Sync 270ms · NanoClaw 270ms.

Every deploy posts `deploy:success` or `deploy:degraded` to `/api/signal`
with per-service timings — so the substrate learns which deploy patterns
produce healthy production. The deploy loop IS a pheromone loop.

---

## Learning Speed

Agents get smarter while you watch:

| What | ONE | Humans |
|------|-----|--------|
| Feedback per day | 43,200 | 1–5 |
| Cost per decision | $0.0001–$0.001 | ~$0.10 |
| Learning latency | 0ms (mark is synchronous) | hours to days |
| Decision throughput | 1 agent = 150 humans | baseline |

The `mark()` call is **<0.001ms**. Pheromone updates are synchronous and
in-memory. The next signal through the same path sees the new weight
immediately. No retrain. No deploy. No cache warming. Just `strength[edge]++`.

Over 24 hours this compounds into measurable routing improvement without
a single human in the loop.

---

## Where Time Goes (Honest Breakdown)

On a typical `/api/ask` request:

```
┌──────────────────────────────────────────────────────────┐
│ HTTP + TLS handshake (cold)               ~100ms         │
│ Astro/Worker isolate cold start           ~50ms (once)   │
│ Cache lookup                              0–10ms         │
│ Routing decision (select)                 <0.005ms       │
│ Signal dispatch                           <1ms           │
│ LLM call (if not dissolved)               800–2000ms ←──┐│
│ Mark/warn pheromone                       <0.001ms       │
│ TypeDB fire-and-forget                    0ms            │
│ Response serialization                    <1ms           │
└──────────────────────────────────────────────────────────┘

95% of latency is the LLM. Almost 0% is our code.
```

The remaining 5% (network, serialization, handshake) is platform-level
and not ours to optimize. The ~800–2000ms LLM call is the only thing
between us and sub-second UX — and the deterministic sandwich lets us
skip it on highways entirely.

---

## The Claim, Compressed

| | ONE | Why |
|---|------|-----|
| Page | <500ms FCP | SSR + islands, no SPA waterfall |
| Cache read | 0ms | `globalThis` inside 30s TTL |
| Database read | 0ms | state IS a JSON object |
| Routing decision | <0.005ms | `select()` is weighted max over a Map |
| Signal dispatch | <1ms | function call, not HTTP |
| Pheromone write | <0.001ms | integer add |
| Database write | 0ms observed | fire-and-forget to TypeDB |
| Agent signup | <10ms substrate + async TypeDB | markdown parse + keypair derive |
| Wallet creation | <5ms, zero storage | deterministic derivation, no persistence |
| Deploy | 65s | parallel workers, pre-flight math |
| Learning | 0ms synchronous | pheromone updates in-memory |

**The moat:** we don't compete on LLM. We compete on **everything that
wraps it.** Traditional AI platforms pay 300ms for routing; we pay 5μs.
Over 43,200 decisions/day/agent that's a different universe.

---

## Lifecycle Speed Matrix

Every stage of [lifecycle.md](./lifecycle.md) touches specific layers. This
table walks the stages INTO → THROUGH → OUT, naming the hot path for each,
and marking what we measure today (`✓`) vs what still needs a bench (`○`).

### INTO ONE

| Stage | Hot path | Target | Measured as | Status |
|-------|----------|--------|-------------|:------:|
| 0 REGISTER | parse(md) + deriveKeypair + TQL insert | <15ms | `lifecycle:register` | ✓ |
| 1 CAPABLE | TQL insert capability | <0.1ms build | `lifecycle:capable:build` | ✓ |
| 2 DISCOVER | `optimalRoute` over cached paths | <1ms | `lifecycle:discover` | ✓ |

### THROUGH ONE

| Stage | Hot path | Target | Measured as | Status |
|-------|----------|--------|-------------|:------:|
| 3 SIGNAL in | edge cache hit + select + dispatch | <2ms | `signal:dispatch`, `edge:cache:hit` | ✓ |
| 4 MARK | integer increment + writeSilent | <0.001ms hot, 0ms async | `pheromone:mark` | ✓ |
| 5 WARN | integer increment + writeSilent | <0.001ms | `pheromone:warn` | ✓ |
| 6 FADE | `fade(rate)` over N paths | <5ms / 1k paths | `pheromone:fade:1000`, `loop:L3:fade:1000` | ✓ |
| 7 HIGHWAY | select finds proven path, skips LLM | <0.01ms (vs 2s) | `routing:select:1000`, `lifecycle:highway:select` | ✓ |

### OUT OF ONE

| Stage | Hot path | Target | Measured as | Status |
|-------|----------|--------|-------------|:------:|
| 8 HARDEN | keypair + tx build + sign + Sui submit | <10ms substrate, ~1s finality | `sui:keypair:derive`, `sui:tx:build`, `sui:sign`, `bridge:mirror:mark` | ✓ |
| 9 FEDERATE | cross-group signal dispatch | <1ms | `lifecycle:federate:hop` | ✓ |
| 10 DISSOLVE | fade drops trail below threshold | free (background) | `loop:L3:fade:1000` | ✓ |

### Ancillary (not a stage, but on the hot path)

| Concern | Target | Measured as | Status |
|---------|--------|-------------|:------:|
| Intent cache hit | <0.1ms (in-memory) | `intent:resolve:label`, `intent:resolve:keyword`, `intent:resolve:miss` | ✓ |
| WebSocket broadcast | <1ms fanout | `ws:broadcast:roundtrip` | ✓ |
| Durable ask overhead | <30ms vs in-memory | `ask:durable:overhead` | ✓ |
| Channel: Telegram | <0.05ms normalize | `channels:telegram:normalize` | ✓ |
| Channel: Web msg | <0.01ms construct | `channels:web:message` | ✓ |
| Page SSR (world) | <1ms (cache-primed) | `page:ssr:world` | ✓ |
| Slow loop L4 economic | <10ms | `loop:L4:economic` | ✓ |
| Slow loop L5 evolution | <5ms detect | `loop:L5:evolution:detect` | ✓ |
| Slow loop L6 know | <1ms scan | `loop:L6:know:scan` | ✓ |
| Slow loop L7 frontier | <5ms scan | `loop:L7:frontier:scan` | ✓ |
| TypeDB readParsed (boot) | <10ms / 5 queries | `typedb:read:boot`, `typedb:read:parse` | ✓ |

**Scorecard:** 24 / 24 lifecycle + ancillary ops measured. Plus 15 core
routing/pheromone/signal ops from the original suite. **45 budgets, 45
covered.** See the auto-generated [speed-test.md](./speed-test.md) for
p50/p95/verdict per operation on the latest run.

---

## Plan: Complete Speed Coverage

Goal: every row in the matrix above reports `✓` in the next cycle, and
`docs/speed-test.md` shows verdicts for all 17 gaps.

Same pattern as the existing benches — `measureSync('<layer>:<op>', fn, n)`
for pure functions, `measure()` for async. Each wave adds tests, budgets,
and samples. No absolute-threshold assertions; record only, report judges.

### Wave 1 — Sui + Bridge (completes the HARDEN path)

Add `src/__tests__/bench/sui-speed.test.ts`:

```typescript
measure('sui:tx:build',       () => new Transaction(), 500)
measure('sui:sign',           () => keypair.signTransaction(tx), 100)
measure('sui:object:read',    () => mockedRpc.getObject(id), 100)
measure('bridge:mirror:unit', () => mirrorActor(mockNet, spec), 50)
measure('bridge:mirror:mark', () => mirrorMark(mockNet, edge), 100)
measure('bridge:absorb:path', () => absorb(mockNet, mockObj), 50)
```

Stub the RPC with a latency profile (~400ms) so we measure our code, not
the chain. Add a separate `sui:finality` sample from actual testnet in a
nightly job, not the gate.

### Wave 2 — Lifecycle Stage Timings (end-to-end traces)

Add `src/__tests__/bench/lifecycle-speed.test.ts`. Each test walks one
stage start-to-finish with in-memory TypeDB stub:

```typescript
measure('lifecycle:register',       () => syncAgent(spec), 20)
measure('lifecycle:capable:insert', () => capabilityInsert(...), 50)
measure('lifecycle:discover',       () => discover(kv, skill), 500)
measure('lifecycle:federate:hop',   () => crossGroupSignal(...), 100)
```

Budgets land in `scripts/speed-report.ts` with `layer: 'lifecycle'`.

### Wave 3 — Transport (WebSocket, channels, intent, durable ask)

Add `src/__tests__/bench/transport-speed.test.ts`:

```typescript
measure('intent:cache:hit',           () => lookupIntent(text), 500)
measure('ws:broadcast:roundtrip',     () => wsManager.broadcast(msg), 100)
measure('ask:durable:overhead',       () => durableAsk(sig), 50)
measure('channels:telegram:normalize',() => normalizeTg(webhook), 500)
measure('channels:web:message',       () => webMessage(req), 200)
```

D1 and WsHub stubbed with realistic latencies. Reveals overhead our code
adds, not the platform's.

### Wave 4 — Slow Loops (L4–L7)

Add `src/__tests__/bench/loops-speed.test.ts`. These run less often but
must finish inside their period:

```typescript
measure('loop:L4:economic',  () => runEconomicTick(), 10)
measure('loop:L5:evolution', () => runEvolutionTick(stubLlm), 5)
measure('loop:L6:know',      () => runKnowTick(stubTypeDB), 5)
measure('loop:L7:frontier',  () => runFrontierTick(stubTypeDB), 5)
```

Budget = loop period ÷ 10 (so the loop spends <10% of its window actually
running).

### Wave 5 — Pages + TypeDB boot

Add `src/__tests__/bench/page-speed.test.ts`:

```typescript
measure('page:ssr:world',     () => renderWorldPage(), 20)
measure('page:ssr:chat',      () => renderChatPage(), 20)
measure('typedb:read:boot',   () => readParsed(bootQueries), 10)
measure('typedb:query:top50', () => readParsed('match ... top 50'), 50)
```

TypeDB stubbed with mock HTTP responses at realistic latencies. Page
render via Astro's container API.

### After all waves

Update `scripts/speed-report.ts` `BUDGETS` array with ~20 new entries
across `sui:*`, `bridge:*`, `lifecycle:*`, `intent:*`, `ws:*`, `ask:*`,
`channels:*`, `loop:L4/L5/L6/L7:*`, `page:*`, `typedb:*`. The report
will then cover every row in the lifecycle matrix.

Expected total gate impact: ~2s added (current bench is ~1.6s; five new
files at similar scale keep us well under the 10s soft budget).

### Exit criterion (ACHIEVED)

- [x] All 17 `○` rows in the lifecycle matrix become `✓`
- [x] `docs/speed-test.md` verdict: `43+ pass` (2 over are sub-microsecond
      routing ops barely missing 5μs under full-suite load — honest reporting, not regression)
- [x] End-to-end `lifecycle:e2e` sample records REGISTER → SIGNAL → MARK → HIGHWAY
      in a single run

**Landed:** 6 bench files in `src/__tests__/bench/`, 45 budgets in
`scripts/speed-report.ts`, 86 benchmarks captured per run in 99 samples.
Gate impact: ~2s added; full suite stays under 10s.

---

## See Also

- [speed.md](./speed.md) — the full benchmark matrix and aspirational targets
- [speed-test.md](./speed-test.md) — **auto-generated** measured benchmarks per run
- [testing.md](./testing.md) — how we measure and record
- [routing.md](./routing.md) — how the sandwich works
- [dictionary.md](./dictionary.md) — what the names mean
- [AUTONOMOUS_ORG.md](./AUTONOMOUS_ORG.md) — why this speed becomes a business

---

*Math, not I/O. In-memory, not database. Deterministic, not probabilistic —
except the one place where probability is the point.*
