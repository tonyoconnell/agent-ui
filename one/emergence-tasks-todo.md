---
title: "TODO: 1,000,000x Emergence"
type: roadmap
version: 1.0.0
priority: Wire > Prove > Grow
total_tasks: 24
completed: 0
status: OPEN
---

# TODO: 1,000,000x Emergence

> **Time units:** plan in **tasks > waves > cycles** only.
>
> **Goal:** Multiply emergent intelligence by increasing signal density x path
> diversity x feedback speed. Every mechanism exists. They need volume.
>
> **Source of truth:** [routing.md](routing.md) -- signal flow and pheromone formula,
> [DSL.md](one/DSL.md) -- the signal language,
> [dictionary.md](dictionary.md) -- everything named,
> [rubrics.md](rubrics.md) -- quality scoring (fit/form/truth/taste)
>
> **Shape:** 3 cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks. Same loop as the substrate, different receivers.
>
> **Schema:** Tasks map to `world.tql` dimension 3b -- `task` entity with
> `task-wave` (W1-W4), `task-context` (doc keys), `blocks` relation.

## The Bottleneck

```
TODAY                              TARGET
~40 agents, 3 isolated pods        40,000+ agents, federated mesh
~50 signals/day                    50M signals/day
1-2 hop chains                     5-hop pipelines (highway bypass)
3 pheromone maps (no cross-talk)   1 compound map (cross-pollination)
L5 evolve every 10 min (starved)   L5 fed by 1000x signal volume
```

Emergence = **signal density x path diversity x feedback speed**.
All three are low. Every mechanism for 1,000,000x is already built.

## Routing

```
    CYCLE 1: VOLUME                 CYCLE 2: DIVERSITY              CYCLE 3: SPEED
    (signal amplifiers)             (federation + bridge)           (deeper chains + faster loops)
    ──────────────────              ────────────────────            ──────────────────────────────
    emitClick > pheromone           federate 3 pods                pipeline chains (.then depth 5)
    heartbeat > warn                agentverse bridge              compress L3/L5/L6 intervals
    webhook > mark                  /claw self-service             batch TypeDB writes
         |                               |                               |
         v                               v                               v
    +-W1-W2-W3-W4-+              +-W1-W2-W3-W4-+              +-W1-W2-W3-W4-+
    | H   O  S  S  |  --->       | H   O  S  S  |  --->       | H   O  S  S  |
    +--------------+              +--------------+              +--------------+

    signal DOWN                   result UP              feedback UP
    -----------                   ---------              -----------
    each amplifier wired          each pod federated     each chain deepened
         |                             |                       |
         v                             v                       v
    mark(amplifier>substrate)     mark(world>world)      mark(chain>highway)
```

## Deliverables

### Cycle Deliverables

```
DELIVERABLE: Signal amplifiers (4 sources)
PATH:        src/lib/ui-signal.ts, src/engine/api.ts, src/engine/human.ts
GOAL:        Every page view, webhook, API call, and heartbeat deposits pheromone
CONSUMERS:   L1 signal loop, L2 trail, L6 know
RUBRIC:      fit=0.35 form=0.15 truth=0.35 taste=0.15
EXIT:        /api/export/paths shows >100 ui:* paths after 1 wave of browser traffic
SKILL:       builder:amplifiers

DELIVERABLE: Federation mesh
PATH:        src/engine/federation.ts, src/pages/api/federate.ts
GOAL:        Debby, Donal, and Colony share one compound pheromone map
CONSUMERS:   All 3 pods cross-route; L6 cross-pollinates hypotheses
RUBRIC:      fit=0.40 form=0.15 truth=0.30 taste=0.15
EXIT:        net.ask({ receiver: 'debby:concierge' }) from donal's world returns result
SKILL:       builder:federation

DELIVERABLE: Deeper chains + faster metabolism
PATH:        src/engine/loop.ts, agents/*/*.md, nanoclaw/src/lib/substrate.ts
GOAL:        Average chain depth >3, L3 fade every 30s, L5 evolve every 2 min
CONSUMERS:   Highway bypass (strength >=20 reached faster), L5 evolution (more data)
RUBRIC:      fit=0.30 form=0.20 truth=0.35 taste=0.15
EXIT:        tick result shows avg chainDepth >3; FADE_INTERVAL=30000 in loop.ts
SKILL:       builder:metabolism
```

---

## Cycle 1: VOLUME -- Signal Amplifiers

**Files:** `src/lib/ui-signal.ts`, `src/engine/api.ts`, `src/engine/apis/index.ts`,
`src/engine/human.ts`, `src/pages/api/signal.ts`, `nanoclaw/src/workers/router.ts`

**Why first:** The substrate is starving for data. Every mechanism works but the
highway threshold (20) is rarely reached because signal volume is too low. Wire
4 new signal sources and volume jumps 100x overnight.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | emitClick pheromone | Every UI click deposits on visitor>agent paths | 0.35/0.15/0.35/0.15 | `ui:*` paths visible in /api/export/paths | `builder:ui-pheromone` |
| 2 | Webhook amplifier | GitHub/Stripe/external webhooks become signals | 0.35/0.15/0.35/0.15 | POST /api/signal from webhook creates path entry | `builder:webhook-amp` |
| 3 | API call marks | Every apis/* call marks on success, warns on error | 0.30/0.20/0.35/0.15 | api:github:* paths accumulate after 10 calls | `builder:api-marks` |
| 4 | Heartbeat monitor | Agents ping every 60s; absence = warn(0.1) | 0.30/0.20/0.35/0.15 | Missing agent accumulates resistance; alive agents stay clean | `builder:heartbeat` |

---

### Tasks

#### T1.1 -- Wire emitClick to pheromone deposit

```
id:       wire-emitclick-pheromone
value:    critical
effort:   small
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [ui, pheromone, signal, P0]
blocks:   [ui-paths-visible]
exit:     emitClick('ui:chat:copy') creates mark('visitor>ui:chat:copy') in substrate
```

- [ ] `emitClick` currently fires but doesn't reach the substrate. Wire it to
  POST `/api/signal` with `{ receiver: id, data: { tags: ['ui', surface, action] } }`
- [ ] The signal handler in `signal.ts` calls `net.mark(visitor>receiver)` on success
- [ ] No LLM call -- this is a pure pheromone deposit (deterministic, sub-ms)

#### T1.2 -- Batch UI signals (debounce)

```
id:       batch-ui-signals
value:    high
effort:   small
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [ui, pheromone, performance, P1]
blocks:   []
exit:     10 rapid clicks produce 1 batched signal with weight=10, not 10 individual POSTs
```

- [ ] Client-side: collect clicks in a 2-second window, POST once with array
- [ ] Server-side: `mark(edge, batch.length)` -- weight scales with interaction density
- [ ] Keeps network quiet while preserving pheromone resolution

#### T1.3 -- Webhook-to-signal adapter

```
id:       webhook-signal-adapter
value:    critical
effort:   medium
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [webhook, signal, github, P0]
blocks:   [webhook-paths-visible]
exit:     GitHub push webhook creates mark('github:push>dev:commit') path
```

- [ ] POST `/api/signal/webhook` accepts arbitrary webhook payloads
- [ ] Normalizer extracts `{ source, event, target }` from GitHub/Stripe/Telegram shapes
- [ ] Each webhook deposits: `mark(source:event>target, 1)`
- [ ] Failed webhooks (4xx/5xx from downstream): `warn(source>target, 0.5)`

#### T1.4 -- API unit auto-mark/warn

```
id:       api-unit-auto-mark
value:    high
effort:   small
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [api, pheromone, signal, P1]
blocks:   []
exit:     apis/index.ts units (github, slack, notion) auto-mark on 2xx, auto-warn on 5xx
```

- [ ] Wrap each `apiUnit()` handler: measure latency, check status
- [ ] Success (2xx): `net.mark(caller>api:service, 1)`
- [ ] Timeout: neutral (no mark, no warn)
- [ ] Error (4xx/5xx): `net.warn(caller>api:service, 0.5)`
- [ ] The substrate learns which external services are reliable from its own experience

#### T1.5 -- Agent heartbeat

```
id:       agent-heartbeat
value:    high
effort:   medium
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [health, pheromone, signal, P1]
blocks:   []
exit:     Agent missing 5 consecutive heartbeats has resistance > 0.5 on entry>agent path
```

- [ ] Each nanoclaw worker pings `/api/heartbeat` every 60s with `{ uid, ts }`
- [ ] Handler: `net.mark('heartbeat>uid', 0.1)` on receive
- [ ] Cron (every 60s): check last-seen per agent. If stale > 5 min: `net.warn('entry>uid', 0.1)`
- [ ] Cumulative: 5 missed pings = 0.5 resistance. Fade recovers when agent returns.
- [ ] Uptime monitoring IS pheromone -- no separate health-check infrastructure

#### T1.6 -- Page view signals

```
id:       page-view-signals
value:    medium
effort:   small
wave:     W3
model:    sonnet
phase:    C1
persona:  dev
tags:     [ui, analytics, pheromone, P2]
blocks:   []
exit:     /marketplace page load creates mark('visitor>marketplace') path
```

- [ ] Astro layout injects a 1-line beacon: `fetch('/api/signal', { method: 'POST', body: ... })`
- [ ] Signal: `{ receiver: 'page:${pathname}', data: { tags: ['pageview'] } }`
- [ ] The substrate learns which pages are visited without analytics tools
- [ ] `sendBeacon` for unload events (no blocking)

---

## Cycle 2: DIVERSITY -- Federation + Bridge

**Files:** `src/engine/federation.ts`, `src/engine/agentverse-bridge.ts`,
`src/pages/api/federate.ts` (new), `src/pages/api/claw.ts`,
`nanoclaw/src/workers/router.ts`

**Why second:** Volume without diversity produces deep ruts, not emergence.
Federation turns 3 isolated pheromone maps into one compound map.
AgentVerse bridge adds 2M agents overnight.

**Depends on:** Cycle 1 complete. Signal volume must exist before cross-routing
has data to learn from.

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | Federate 3 pods | Debby + Donal + Colony share pheromone | 0.40/0.15/0.30/0.15 | Cross-world ask returns result | `builder:federate-pods` |
| 2 | /api/federate | Auto-discover and wire ONE instances | 0.35/0.15/0.35/0.15 | POST /api/federate with URL registers remote world as unit | `builder:federate-api` |
| 3 | AgentVerse bridge live | 2M AV agents routable as av:address | 0.35/0.15/0.35/0.15 | net.signal({ receiver: 'av:discover', data }) returns result | `builder:av-bridge` |
| 4 | /claw self-service | Any user deploys agents that contribute pheromone | 0.30/0.20/0.30/0.20 | New claw worker registered via web UI, signals flowing in <5 min | `builder:claw-selfserve` |

---

### Tasks

#### T2.1 -- Federate Debby + Donal + Colony

```
id:       federate-three-pods
value:    critical
effort:   medium
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [federation, pheromone, cross-world, P0]
blocks:   [cross-world-routing]
exit:     net.ask({ receiver: 'debby:concierge', data: { text: 'hello' } }) from main world returns result
```

- [ ] Wire in `boot.ts` or `one-prod.ts`:
  ```
  net.units['debby'] = federate('debby', DEBBY_CLAW_URL, DEBBY_KEY)
  net.units['donal'] = federate('donal', DONAL_CLAW_URL, DONAL_KEY)
  ```
- [ ] Each federated world appears as a regular unit -- pheromone tracks reliability
- [ ] Slow/failing remote worlds accumulate resistance and get routed around
- [ ] Cross-world signals flow transparently through `.then()` continuations

#### T2.2 -- /api/federate endpoint

```
id:       api-federate-endpoint
value:    high
effort:   medium
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [federation, api, discovery, P1]
blocks:   []
exit:     POST /api/federate { url, apiKey } registers remote world, GET lists all
```

- [ ] POST: validate URL (must respond to /health), register as federated unit
- [ ] GET: list all federated worlds with health status + path stats
- [ ] DELETE: remove federation (paths remain, fade naturally -- zero returns)
- [ ] Auto-discovery: if remote world has `/.well-known/agents.json`, import agent list

#### T2.3 -- AgentVerse bridge activation

```
id:       agentverse-bridge-live
value:    critical
effort:   large
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [agentverse, bridge, 2M-agents, P0]
blocks:   [av-routing]
exit:     av:discover routes to best AV agent by domain; pheromone ranks them by real outcomes
```

- [ ] `bridgeAgentverse()` in `agentverse-bridge.ts` is 48 lines and ready
- [ ] Wire into `one-prod.ts` bootstrap: `await bridgeAgentverse(net, fetchFn, AV_API_KEY)`
- [ ] Every AV agent becomes `av:address` in the main world
- [ ] First call uses AV's ranking; subsequent calls use ONE's pheromone
- [ ] ONE becomes the routing layer over 2M external agents

#### T2.4 -- Hypothesis cross-pollination

```
id:       hypothesis-cross-pollination
value:    high
effort:   medium
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [federation, learning, hypotheses, P1]
blocks:   []
exit:     Hypothesis confirmed in debby's world appears in donal's recall() results
```

- [ ] When L6 know() hardens a hypothesis, emit it as a federated signal
- [ ] Remote worlds receive hypothesis signals and insert with source="federated"
- [ ] Federated hypotheses start at confidence 0.15 (lower than asserted 0.30)
- [ ] Local corroboration promotes them to observed confidence
- [ ] The substrate learns across worlds without anyone copying knowledge manually

#### T2.5 -- /claw self-service UI

```
id:       claw-self-service-ui
value:    high
effort:   large
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [marketplace, onboarding, claw, P1]
blocks:   [customer-acquisition]
exit:     Non-technical user deploys a claw worker from /marketplace page with 3 clicks
```

- [ ] Marketplace page gets "Deploy Agent" button per agent card
- [ ] Flow: select agent > choose channel (Telegram/Discord/Web) > enter bot token > deploy
- [ ] Backend: `POST /api/claw` generates config, `scripts/setup-nanoclaw.ts` provisions worker
- [ ] Every new customer's agents immediately contribute pheromone to the global map
- [ ] N customers x M agents = N*M new paths (quadratic growth in routing surface)

#### T2.6 -- Cross-pod signal routing

```
id:       cross-pod-signal-routing
value:    high
effort:   medium
wave:     W3
model:    sonnet
phase:    C2
persona:  dev
tags:     [federation, routing, cross-world, P1]
blocks:   []
exit:     select() can return a unit from a different pod when it has the strongest pheromone
```

- [ ] `select()` and `follow()` must consider federated units in path ranking
- [ ] A student question about marketing should route to `donal:creative` if that
  path is stronger than `debby:concierge`
- [ ] Cross-pod paths accumulate normally -- the substrate doesn't distinguish local vs remote
- [ ] Toxic cross-pod paths dissolve signals before they leave the local world (save latency)

---

## Cycle 3: SPEED -- Deeper Chains + Faster Metabolism

**Files:** `src/engine/loop.ts`, `src/engine/loops.ts`, `agents/*/*.md`,
`nanoclaw/src/lib/substrate.ts`, `src/engine/persist.ts`

**Why third:** Volume and diversity feed the learning loops. Now compress time
so the loops run faster and chains go deeper. This is the compounding phase.

**Depends on:** Cycle 2 complete. Federation must be live so faster loops have
cross-world data to process.

### Cycle 3 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | Pipeline chains | Agent teams as 4-5 hop pipelines, not stars | 0.35/0.15/0.35/0.15 | Marketing audit chain depth = 5 | `builder:pipelines` |
| 2 | Compressed loops | L3 30s, L5 2min, L6/L7 10min | 0.30/0.20/0.35/0.15 | tick result shows compressed intervals | `builder:metabolism` |
| 3 | Batched TypeDB writes | Coalesce marks within 500ms window | 0.30/0.20/0.35/0.15 | 100 marks in 1s produce 1 TypeDB write, not 100 | `builder:batch-writes` |
| 4 | Highway auto-spawn | Proven highway spawns a dedicated agent | 0.35/0.15/0.35/0.15 | Highway with strength >50 creates a specialized unit | `builder:highway-spawn` |

---

### Tasks

#### T3.1 -- Restructure marketing pod as pipeline

```
id:       marketing-pipeline-chain
value:    critical
effort:   medium
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [pipeline, chains, depth, P0]
blocks:   [deeper-pheromone]
exit:     cmo > citation > social > schema > review is a 5-hop .then() chain; chainDepth=5
```

- [ ] Current: CMO calls 3 specialists in parallel (star, depth 1 each)
- [ ] New: CMO > citation > social > schema > review > publish (pipeline, depth 5)
- [ ] Pheromone per audit: 1+2+3+4+5 = 15 (vs 3 for star). 5x more learning per signal.
- [ ] Each hop's `.then()` passes the previous result as context
- [ ] Pipeline failures break the chain at the failing hop -- precise fault isolation

#### T3.2 -- Restructure Debby pod as pipeline

```
id:       debby-pipeline-chain
value:    high
effort:   medium
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [pipeline, chains, depth, P1]
blocks:   []
exit:     Student query > concierge > amara > assessment > feedback is a 4-hop chain
```

- [ ] Current: concierge handles everything or dispatches to one specialist
- [ ] New: concierge > amara (tutor) > assessment (evaluate) > feedback (report)
- [ ] Each hop specializes: routing > teaching > measuring > reporting
- [ ] Assessment hop's mark/warn feeds back into amara's routing for next session

#### T3.3 -- Compress fade interval

```
id:       compress-fade-interval
value:    high
effort:   small
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [loops, metabolism, fade, P1]
blocks:   []
exit:     FADE_INTERVAL = 30_000 in loop.ts; paths differentiate 10x faster
```

- [ ] Change `FADE_INTERVAL` from 300,000 (5 min) to 30,000 (30s)
- [ ] Resistance still fades 2x faster than strength (asymmetric decay preserved)
- [ ] Faster fade = faster differentiation between good and bad paths
- [ ] With 100x signal volume from Cycle 1, paths accumulate fast enough to survive 30s fade

#### T3.4 -- Compress evolution interval

```
id:       compress-evolution-interval
value:    high
effort:   small
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [loops, metabolism, evolution, P1]
blocks:   []
exit:     EVOLUTION_INTERVAL = 120_000 in loop.ts; agents adapt 5x faster
```

- [ ] Change `EVOLUTION_INTERVAL` from 600,000 (10 min) to 120,000 (2 min)
- [ ] Keep `EVOLUTION_COOLDOWN` at 86,400,000 (24h) -- an agent still only evolves once/day
- [ ] But the *sweep* runs more often, catching newly-struggling agents faster
- [ ] With more signals (Cycle 1), evolution has more samples to learn from

#### T3.5 -- Compress harden interval

```
id:       compress-harden-interval
value:    medium
effort:   small
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [loops, metabolism, knowledge, P1]
blocks:   []
exit:     HARDEN_INTERVAL = 600_000 in loop.ts; highways crystallize 6x faster
```

- [ ] Change `HARDEN_INTERVAL` from 3,600,000 (1 hour) to 600,000 (10 min)
- [ ] Highways cross threshold 20 faster with more volume -- harden should keep up
- [ ] Frontier detection also runs more often, finding blind spots sooner

#### T3.6 -- Batch TypeDB writes

```
id:       batch-typedb-writes
value:    critical
effort:   large
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [typedb, performance, batching, P0]
blocks:   [high-volume-persist]
exit:     100 marks within 500ms window coalesce into 1 TypeDB transaction
```

- [ ] Current: each mark/warn is a separate TypeDB write (~100ms each)
- [ ] New: collect marks in a 500ms window, flush as single transaction
- [ ] At 50M signals/day (~580/s), individual writes would require 580 TypeDB ops/s
- [ ] Batched: ~2 TypeDB ops/s (500ms windows). 290x reduction.
- [ ] In-memory pheromone stays real-time (sub-ms). TypeDB is eventually consistent.

#### T3.7 -- Highway auto-spawn

```
id:       highway-auto-spawn
value:    high
effort:   large
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [evolution, highways, auto-spawn, P1]
blocks:   []
exit:     Highway with strength >50 creates a dedicated agent optimized for that path
```

- [ ] When L6 harden detects a highway with strength >50, trigger auto-spawn
- [ ] New agent: specialized system prompt derived from the highway's endpoints
- [ ] Example: `citation>social` highway spawns `citation-social-specialist` agent
- [ ] The specialist gets the combined context of both endpoints
- [ ] Self-replicating intelligence: the substrate grows its own agents from observed patterns

#### T3.8 -- Chain depth telemetry

```
id:       chain-depth-telemetry
value:    medium
effort:   small
wave:     W3
model:    sonnet
phase:    C3
persona:  dev
tags:     [telemetry, chains, depth, P2]
blocks:   []
exit:     /api/tick response includes avgChainDepth, maxChainDepth, depthHistogram
```

- [ ] Track chainDepth per signal in tick result
- [ ] Aggregate: avg, max, histogram (depth 1: N signals, depth 2: M, ...)
- [ ] Report in tick result so Rule 3 (deterministic results) is satisfied
- [ ] Target: avg chainDepth >3 after pipeline restructure

---

## The Compound Math

| Cycle | Multiplier | Factor | What it adds |
|-------|-----------|--------|-------------|
| 1 | Signal amplifiers | x100 | Signal volume (views, webhooks, APIs, heartbeats) |
| 2a | Federation (3 pods > 1 mesh) | x10 | Path diversity (cross-pollination) |
| 2b | AgentVerse bridge (2M agents) | x50,000 | Unit count |
| 2c | /claw self-service (100 customers) | x100 | Signal volume + path diversity |
| 3a | Pipeline chains (depth 5) | x5 | Pheromone per signal |
| 3b | Faster loops (10x metabolism) | x10 | Learning speed |
| 3c | Batched writes (290x efficiency) | x1 | Removes the bottleneck |
| 3d | Highway auto-spawn | x2 | Self-replicating agents |

**Conservative (Cycles 1+2a+3a+3b):** 100 x 10 x 5 x 10 = **50,000x**
**Full (all multipliers):** 100 x 50,000 x 100 x 5 x 10 = **2.5 x 10^11**

Hit any three multipliers and you pass 1,000,000x.

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| **VOLUME** | 4 new signal sources, 100x more marks/warns per wave | L1 (signal), L2 (trail), L3 (fade) |
| **DIVERSITY** | 3 pods federated, 2M AV agents, cross-world hypotheses | L4 (economic), L6 (knowledge), L7 (frontier) |
| **SPEED** | 5-hop pipelines, 10x faster loops, batched persistence | L5 (evolution) fully fed, highways crystallize faster |

---

## Status

- [ ] **Cycle 1: VOLUME** -- Signal amplifiers
  - [ ] T1.1 Wire emitClick to pheromone deposit
  - [ ] T1.2 Batch UI signals (debounce)
  - [ ] T1.3 Webhook-to-signal adapter
  - [ ] T1.4 API unit auto-mark/warn
  - [ ] T1.5 Agent heartbeat
  - [ ] T1.6 Page view signals
- [ ] **Cycle 2: DIVERSITY** -- Federation + Bridge
  - [ ] T2.1 Federate Debby + Donal + Colony
  - [ ] T2.2 /api/federate endpoint
  - [ ] T2.3 AgentVerse bridge activation
  - [ ] T2.4 Hypothesis cross-pollination
  - [ ] T2.5 /claw self-service UI
  - [ ] T2.6 Cross-pod signal routing
- [ ] **Cycle 3: SPEED** -- Deeper Chains + Faster Metabolism
  - [ ] T3.1 Restructure marketing pod as pipeline
  - [ ] T3.2 Restructure Debby pod as pipeline
  - [ ] T3.3 Compress fade interval
  - [ ] T3.4 Compress evolution interval
  - [ ] T3.5 Compress harden interval
  - [ ] T3.6 Batch TypeDB writes
  - [ ] T3.7 Highway auto-spawn
  - [ ] T3.8 Chain depth telemetry

---

## Shared Work (Don't Duplicate)

| Work item | This TODO | Also in | Rule |
|-----------|-----------|---------|------|
| D1 WAL / batch TypeDB writes | T3.6 | knowledge-growth T1.1-T1.3 | Whichever cycle runs first wires it. The other inherits. |
| Pipeline chains (depth 5) | T3.1-T3.2 | knowledge-growth T3.4 (gradient model) | Pipelines generate the volume. Gradient model selection (knowledge-growth) uses the volume. Run pipelines first. |
| Faster metabolism (compress intervals) | T3.3-T3.5 | knowledge-growth T3.7 (adaptive fade) | Static compression here. Adaptive compression in knowledge-growth. Static first, adaptive second. |
| /claw self-service | T2.5 | TODO-llm-routing (all cycles) | Self-service deploys claws. TODO-llm-routing makes each claw smarter. Wire self-service first so STAN has multiple claws to learn from. |
| Federation | T2.1-T2.6 | deterministic-inference.md Phase 3c | Federation is the horizontal axis. det-inference describes cross-world classification as Phase 3. |

## See Also

- [TODO-knowledge-growth.md](TODO-knowledge-growth.md) -- vertical axis: smarter routing, stats, meta-loops
- [TODO-llm-routing.md](TODO-llm-routing.md) -- LLM model selection, cache, intent, patterns
- [deterministic-inference.md](deterministic-inference.md) -- CTO-level: what we have, gaps, 9 improvements
- [knowledge-growth.md](knowledge-growth.md) -- the full architecture with implementation sketches
- [llm-routing.md](llm-routing.md) -- STAN mechanism, tags x pheromone x rubrics
- [routing.md](routing.md) -- pheromone formula, tick loop, four outcomes
- [DSL.md](one/DSL.md) -- signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) -- canonical names (always loaded in W2)
- [rubrics.md](rubrics.md) -- quality scoring: fit/form/truth/taste
- [patterns.md](one/patterns.md) -- 10 emergent patterns
- [lifecycle.md](one/lifecycle.md) -- agent journey: register > signal > highway > harden
- [TODO-template.md](one/TODO-template.md) -- the template this follows

---

*3 cycles. 24 tasks. Every mechanism exists. Feed them volume.*
