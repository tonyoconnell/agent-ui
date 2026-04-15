# Speed Page

Build spec for `/speed` — **ride a signal through the world**. Not a dashboard.
Not a pitch deck. A guided journey where the visitor watches one real signal
travel from click → edge → substrate → LLM → mark → highway → Sui, with every
stop a tutorial on one locked dictionary word.

> One Astro page. One signal. Seven stops. You arrive at the end knowing how
> ONE works — because you just saw a signal do it, in under three seconds,
> with timings you can verify by running the same curl yourself.

The companion execution plan is `docs/TODO-speed-page.md` (created separately,
run via `/do` — Haiku W1 recon, Opus W2 decide, Sonnet W3 edit + W4 verify).

---

## The Pitch in One Sentence

**"Watch a signal cross the world, then watch the feedback come back."**

Every other speed page on the internet shows charts. Ours shows the same event
the charts are *summarizing*, frame by frame — including the **return trip**,
where `mark()` travels back along the path, the edge strengthens, and the
seven loops fire at their own cadences. Forward is speed. The return trip is
**learning**. A page about speed that hides the feedback lies about the moat.

---

## Source of Truth

| Doc | What it locks |
|-----|---------------|
| `docs/speed.md` | Every stage budget. If a stop says "<5ms", it's in speed.md. |
| `docs/dictionary.md` | Every label on screen is a canonical word. No synonyms. |
| `docs/routing.md` | The sandwich (ADL → toxic → capable → LLM → mark/warn) |
| `docs/lifecycle.md` | The ordering of stages: register → signal → highway → harden |
| `docs/one-ontology.md` | Only the 6 locked dimensions appear as labels |
| `docs/metaphors.md` | `?skin=ant|team|signal` switches labels, not mechanics |
| `.claude/rules/astro.md`, `react.md`, `ui.md` | Code rules |

If a stop on the journey displays a number not in `speed.md` or a word not in
`dictionary.md`, **the stop is wrong before the data is**. W4 rejects.

---

## Three Visitors, One Journey

```
BUILDER takes the tour.           CEO takes the tour.             SKEPTIC takes the tour.
Wants: "how do I build this?"     Wants: "what does it cost?"     Wants: "prove the numbers."
At each stop sees: code snippet   At each stop sees: cost+time    At each stop sees: live ms
Copies: the curl per stop         Skips: to stop 4 (cost panel)   Clicks: "run this yourself"
Leaves with: a working signal     Leaves with: a slide            Leaves with: a repo link + test
```

The journey is linear for the first-time visitor, but **every stop is a direct
URL** (`?step=3`). A skeptic who wants to jump straight to "prove it" can.

---

## The Journey: Forward Pass + Return Trip

Every stop = one full-viewport section. The journey has two halves:
**Outbound** (stops 0–4, signal flies forward) and **Return** (stops 5–8,
feedback travels back). The persistent strip shows both directions.

```
OUTBOUND →                                           ← RETURN
[●━━━━○━━━━○━━━━○━━━━○]──────[○━━━━○━━━━○━━━━○]
 click  edge  route  sand   LLM  mark  high  loops  harden
 0     1     2      3      4    5     6     7      8

  ↓ one signal going forward ↓       ↑ feedback coming back ↑
  ↓ (the "fast" half)         ↓       ↑ (the "learning" half) ↑
```

The dashed line in the middle is the LLM — physics, slow, honest. Everything
to the left of it is arithmetic (µs to ms). Everything to the right is the
substrate remembering, propagating, and compounding across loops L1–L7.

### Stop 0 — Welcome: the click

```
What you see:  A single button. "Send a signal."
What happens:  The visitor clicks. emitClick('ui:speed:start').
What you learn: Every action in ONE starts as a signal. Here's the primitive.
Vocabulary:    signal, receiver, emit
Live number:   <0.1ms — time from click to signal in-memory
Code shown:    net.signal({ receiver: 'demo:route' })
Copy button:   copies the 3-line TS to clipboard
```

### Stop 1 — The edge (Cloudflare)

```
What you see:  Globe with 5 CF regions pulsing. Your region highlights.
What happens:  Signal lands at the nearest edge in <10ms.
What you learn: Edge is where ONE lives. No origin round-trip.
Vocabulary:    edge, gateway, KV cache
Live number:   gateway.one.ie → your pop, measured this page-load
Code shown:    curl -w "%{time_starttransfer}" https://api.one.ie/health
Copy button:   copies the curl, shows its output live
```

### Stop 2 — Route: the formula

```
What you see:  The formula, animated.
               weight = 1 + max(0, strength - resistance) × sensitivity
               With sliders the visitor can drag to watch `select()` pick differently.
What happens:  select() evaluates 1,000 paths in <0.015ms.
What you learn: Routing is math. Not ML. Not a coordinator. Just arithmetic.
Vocabulary:    strength, resistance, select, follow, weight, sensitivity
Live number:   1,000-path select() benchmark from routing.test.ts, run in-browser
Code shown:    const next = net.select()
Copy button:   copies a 10-line self-contained TS demo
```

### Stop 3 — The sandwich

```
What you see:  5-layer vertical stack. Signal drops through each layer.
               ┌─ ADL gate (permission) ─── cache hit, <1ms ─┐
               ├─ isToxic? ──────────────── 3 compares, <0.001ms ─┤
               ├─ capability? ───────────── 1 lookup, <1ms ─┤
               ├─ LLM ─────────────────────── 1,500ms (physics) ─┤
               └─ mark / warn ───────────── <0.001ms ──────────┘
What happens:  Your signal drops through. Each layer lights green or red.
What you learn: 4 of 5 layers are deterministic and free. The LLM is the only cost.
Vocabulary:    sandwich, ADL, toxic, capability, mark, warn
Live number:   current deployment's p50 per layer, from /api/tick
Code shown:    the 5-line sandwich pseudocode from routing.md
Copy button:   copies the outcome types block (result|timeout|dissolved|failure)
```

### Stop 4 — LLM: the slow part (honest)

```
What you see:  A big honest red bar. "This takes 1,500ms. We can't speed it up."
What happens:  The LLM runs. The page doesn't hide how long it takes.
What you learn: Everyone's LLM is slow. Ours is the same speed. The difference is
                everything around it.
Vocabulary:    LLM, task, generation
Live number:   actual OpenRouter round-trip for this demo signal
Code shown:    llm.ts adapter snippet
Cost shown:    $0.0001-$0.001 per call
```

### Stop 5 — Mark: feedback starts its return trip

```
What you see:  The LLM just returned a result. A pulse of light separates from
               the signal and travels BACKWARDS along the path it came in on.
               As it passes each edge, the edge brightens. The strength counter
               on that edge ticks up in real time.
What happens:  net.mark(edge, chainDepth) fires for every edge in the chain.
               In-memory. <0.001ms per edge. Chain depth scales the reward —
               deeper successful chains deposit more pheromone.
What you learn: ONE doesn't train. It doesn't fine-tune. It deposits math on an
                edge. The edge remembers. That's the entire learning mechanism.
Vocabulary:    mark, warn, chain depth, outcome, closed loop, pheromone
Live number:   strength before → after, per edge, for the specific chain you
               just traveled. Shown as +0.2, +0.4, +0.6, +0.8, +1.0 depending
               on depth.
Code shown:    the 4-outcome block from engine.md rule 1

                 if (result)        net.mark(edge, chainDepth)
                 else if (timeout)  /* neutral — agent blameless */
                 else if (dissolved) net.warn(edge, 0.5)
                 else               net.warn(edge, 1)

Side note:     If this signal had failed, you'd watch a red pulse travel
               back instead. Visitors can click "simulate failure" to see
               warn() in action — same return path, opposite polarity.
```

### Stop 6 — The Seven Loops (the heartbeat panel)

This is the page's centerpiece. A **persistent side panel** from this stop
forward shows the substrate's metabolism: seven stacked rows, one per loop,
each pulsing at its own cadence. The visitor's own `mark()` from stop 5 is
visible rippling through each loop at its appropriate speed.

```
 Loop          Cadence         What it does                    Your mark visible in…
─────────────────────────────────────────────────────────────────────────────────────
 L1 SIGNAL     per signal      route · ask · outcome           <1ms — already happened
 L2 TRAIL      per outcome     strength/resistance updates     just now (stop 5)
 L3 FADE       every 5 min     asymmetric decay (resist 2×)    next tick — wait and see
 L4 ECONOMIC   per payment     revenue accrues on paths        on next capability sale
 L5 EVOLUTION  every 10 min    rewrite failing prompts         only if success-rate<0.5
 L6 KNOWLEDGE  every hour      promote highways → hypotheses   next hour tick
 L7 FRONTIER   every hour      detect unexplored tag clusters  next hour tick
```

```
What you see:  Seven rows stacked vertically. Each row has a dot that slides
               left→right, representing time since that loop last fired. When
               a loop fires, the row flashes and the dot jumps to the left.
               Your specific mark() from stop 5 is highlighted as it enters
               each loop's window.

What happens:  The page subscribes to ws events for every loop tick. L1 events
               flood in (one per signal). L3 events come every 5min. L7 events
               come hourly — so the page shows "L7 next fires in 47min" with a
               countdown the visitor can watch.

What you learn: ONE is not one loop. It's seven, each at its own timescale.
                Fast loops (L1-L3) live in memory — µs to ms. Slow loops
                (L4-L7) live in TypeDB + Sui — seconds to hours. Your signal
                already moved through L1+L2 in <1ms. L3 will find it in 5min.
                By the time L6 runs, if your path repeats, it becomes a
                hypothesis. If you watched for 24 hours, every loop would
                touch your signal's path at least once.

Vocabulary:    loop, tick, decay, hypothesis, frontier, evolution, know
Live numbers:  - L1 tick count this session (should rise as you scroll)
               - L3 lastAtMs / nextAtMs from /api/tick
               - L6 know() count from last hour (highways promoted)
               - L7 frontier tag clusters currently open
Code shown:    src/engine/loop.ts excerpt — the 7-branch switch
Interaction:   "Fast-forward time" button — `?speed=50` compresses 1h → 72s
               so CEOs can see L6/L7 fire before they close the tab
```

### Stop 7 — Highway: what emerges after 50 return trips

```
What you see:  A time-lapse. Same path, traveled 50 times. Each traversal
               deposits a mark() on the return trip (stop 5 replayed 50×).
               Watch the line grow thick and gold. At around step 50 — when
               strength breaks past the highway threshold — the edge changes
               color and the L6 loop row flashes: "highway hardened into
               hypothesis". Future signals will `follow()` instead of
               `select()`.
What happens: - Traversals 1-10:   thin line, strength ~2-8
              - Traversals 11-30:  thickening, strength ~10-20
              - Traversals 31-50:  gold, strength >20, flagged as highway
              - Traversal 51:      follow() picks this path deterministically
                                   skipping select() randomness entirely
               Speedup on the proven path: ~17× (from speed.md §Hyperliquid).
What you learn: Highways are auto-cached behavior. Nobody wrote them. Nobody
                trained them. The feedback from 50 mark()s did. This is the
                compounding moat.
Vocabulary:    highway, follow, depth, cached, hardened
Live number:   top 5 real highways from /api/export/highways, with strength
               and chain depth per highway
Code shown:    curl /api/export/highways → JSON (same one from earlier stops)
```

### Stop 8 — Harden: Sui proof

```
What you see:  A Sui transaction going to chain. A hash appears.
What happens:  Highway is written on-chain. Immutable. Other agents can license.
What you learn: Highways harden into tradable IP. One agent's knowledge becomes another's.
Vocabulary:    harden, highway, Sui
Live number:   most recent on-chain highway tx (from testnet digest log)
Code shown:    the 4.25s set_fee_bps example from speed.md
```

### Outro — "Now run it yourself"

```
What you see:  Three copy-paste commands, one final receipt:
               ┌─ bun vitest run routing.test.ts   → 54/54 in <200ms ──┐
               ├─ curl api.one.ie/health           → 292ms p50 ─────┤
               └─ curl .../api/export/highways     → live JSON ─────┘
What you learn: Everything above was real. Here's how to reproduce it.
Leave-behind:  Repo link, docs link, /claw command to spin up your own agent.
```

---

## The Vocabulary On Screen

Every visible word appears in `dictionary.md`. This table is the copy review:

| Stop | Words introduced | Source |
|------|------------------|--------|
| 0 | signal, receiver, emit | dictionary.md §Primitives |
| 1 | edge, gateway, KV | dictionary.md §Infra |
| 2 | strength, resistance, select, follow, weight, sensitivity | dictionary.md §Paths |
| 3 | sandwich, ADL, toxic, capability, mark, warn | dictionary.md §Flow |
| 4 | LLM, task, generation | dictionary.md §Actors/Things |
| 5 | mark, warn, chain depth, outcome, closed loop, pheromone | dictionary.md §Learning |
| 6 | loop, tick, decay, hypothesis, frontier, evolution, know | dictionary.md §Loops |
| 7 | highway, follow, depth, cached, hardened | dictionary.md §Paths |
| 8 | harden, Sui | dictionary.md §Persistence |

If a stop introduces a word not in this table, W4 `warn(1)` and the stop
rewrites. No marketing synonyms. No invented nouns.

---

## Tutorial Mechanics

**Progressive disclosure.** Each stop unlocks one concept. You cannot skip
forward to stop N without having seen N-1 — unless you deep-link via `?step=N`
(skeptic path). Deep links still render the earlier strip as context.

**One signal, seven stops.** The journey tracks a single `demo-sig-<nonce>`
signal. Its actual path is logged, and every number shown is measured from
that exact signal — not averages, not synthetic.

**Replay.** Button at bottom: "Send another signal." Resets to stop 0 with a
fresh nonce. Skeptics can re-run until they believe the distribution.

**Speed modes.**
- *Real-time* (default) — you watch at actual speed. Signal done in ~2s.
- *Slow-mo* (`?speed=0.1`) — 10× slower so you can read each layer.
- *Fast-forward* (`?speed=50`) — 50× so a CEO sees the whole journey in 40ms.

**Skin switch.** `?skin=ant|brain|team|signal` per `metaphors.md`. Labels
change, mechanics don't. A child gets "ant walks a trail", a CEO gets "agent
follows a workflow", the mechanics underneath are identical.

---

## Component Inventory

**Reuse first, build second.** W1 recon decides import vs fresh.

### Existing (reuse as-is)

| Component | Path | Used where |
|-----------|------|------------|
| `Card`, `Badge`, `Button` | `@/components/ui/*` | every stop's copy-block |
| ws hook | `src/hooks/useTaskWebSocket.ts` | live signal tracking pattern |
| any ReactFlow graph | `src/components/marketplace/` (if exists) | stop 6 highway visual |

### Candidates to import (W1 verifies, W2 picks ≤2)

| Source | Candidate | Intent | Risk |
|--------|-----------|--------|------|
| `../ONE/web/src/components/` | CF/edge visual widgets | stop 1 globe | bundle bloat |
| `../fetchlaunchpad/frontend/` | any counter/meter | stop 2 slider demo | deps, license |

Default is build fresh. An imported component must save >100 LOC and add
<30 KiB gzip or it doesn't earn its way in.

### New components

| Component | ~LOC | Props |
|-----------|------|-------|
| `<SignalStrip>` | 90 | `currentStep`, `elapsed`, `steps[]`, `direction: out|ret` — persistent top bar showing outbound + return trip |
| `<Stop>` | 60 | `step`, `title`, `vocab[]`, `liveNumber`, `code`, children |
| `<SandwichStack>` | 120 | `layers: {name, budget, measured, outcome}[]` |
| `<PathAnimator>` | 100 | `from`, `to`, `strengthBefore`, `strengthAfter`, `polarity: mark|warn` — handles return-trip animation |
| `<LoopsPanel>` | 150 | `loops: L1..L7[]` — persistent side panel from stop 6 forward, subscribes to loop tick ws events, renders heartbeat rows |
| `<RunItBlock>` | 50 | `command`, `liveOutput` (async fetch with SSE) |
| `<SkinSwitcher>` | 40 | reads `?skin`, re-labels via metaphors.md table |

All new components: typed props (`react.md`), named exports, emit
`emitClick('ui:speed:<action>')` per `ui.md`.

---

## Hydration & Bundle

Per `docs/speed.md` Pages worker is locked ≤10 MiB. /speed must not break it.

```
┌──────────────────────────────────┬──────────────────────────┐
│ SignalStrip (top, always on)     │ client:load              │
│ Stop 0-2 (above fold)            │ client:load              │
│ Stop 3-5 (below fold)            │ client:visible           │
│ Stop 6-7 (deep scroll)           │ client:idle              │
│ Any graph lib (stop 6)           │ client:only="react"      │
└──────────────────────────────────┴──────────────────────────┘
```

Astro: `export const prerender = true`. SSR shell is pure HTML. Heavy libs
externalized in `astro.config.mjs` per the bundle-rule lock.

**Budget:** /speed adds ≤200 KiB gzip to Pages bundle. W4 measures, rejects
if over.

---

## Data Wiring

```
/speed page (SSR shell) — prerender, no data fetch at build time
   │
   ├─ on mount — open WS to gateway /ws for live signal events
   │
   ├─ Stop 0 click — POST /api/speed/journey { nonce }
   │      │
   │      └─ server: routes a real demo signal through the sandwich,
   │         emits ws events at each layer boundary with timings
   │
   ├─ SignalStrip subscribes — advances as layer events arrive
   │
   ├─ Stop 1 — fetch /api/health on mount (lazy)
   ├─ Stop 2 — load 1 slice of routing.test.ts benchmarks (static JSON export)
   ├─ Stop 3 — reuses the same journey ws events
   ├─ Stop 4 — the actual LLM round-trip from the journey signal
   ├─ Stop 5 — edge strength before/after from /api/export/paths?edge=<id>
   │           ws emits a `mark` event per edge as the return trip runs
   ├─ Stop 6 — LoopsPanel subscribes to /ws filtered by type in
   │           {loop:L1:tick..loop:L7:tick}
   │           also reads /api/tick for lastAtMs / nextAtMs per loop
   ├─ Stop 7 — /api/export/highways (top 5)
   └─ Stop 8 — /api/sui/recent-hardens (existing or new W3 task)
```

Two new endpoints required:
- `POST /api/speed/journey` — streams sandwich-layer events forward + mark
  events on the return trip.
- Gateway ws emits **loop tick events** (`loop:L1:tick` … `loop:L7:tick`) on
  each tick boundary. If the gateway doesn't already broadcast these, W3
  adds a 10-line emit in `src/engine/loop.ts` after each loop runs. Same
  pattern as the existing TaskBoard ws relay.

All other endpoints already exist in `src/pages/api/`.

---

## Rubric Targets (W4 gate)

| Dimension | Target | How measured |
|-----------|--------|--------------|
| **fit** | ≥0.85 | every on-screen word ∈ `dictionary.md` (grep check) |
| **form** | ≥0.85 | TTFB <200ms, FCP <500ms, journey completes <3s |
| **truth** | ≥0.90 | every number = live endpoint or `speed.md` citation |
| **taste** | ≥0.75 | builder+CEO+skeptic each complete intent in <30s (user test) |

Tutorial-specific check: **a non-technical reader completes stops 0→7 without
consulting any other page.** If they can't, stop copy gets rewritten.

Overall gate ≥0.65 per Rule 3. Below gate → cycle repeats.

---

## What the Page Cannot Do

Negative space matters more than features.

- **Not an editor.** No drag-to-create. That's `/world`.
- **Not a marketplace.** No agent listings. That's `/marketplace`.
- **Not a dashboard.** No aggregated stats beyond what the journey touches.
- **No emoji.** The substrate doesn't speak in emoji.
- **No vibes numbers.** Every timing is live or cited. No "~", no "around".
- **No tour-blocking modals.** The journey is the tour. No secondary popups.

W4 rejects any W3 edit that adds these. `warn(1)` on the routing edge.

---

## Wave Plan (source for TODO-speed-page.md)

```
W1 Haiku recon
  · inventory ../ONE/web components (CF/edge/globe/meter candidates)
  · inventory ../fetchlaunchpad candidates
  · grep src/components/ for reusable bits
  · list every endpoint needed — flag the new ones (/api/speed/journey)
  · baseline: bundle size, current /api/health p50

W2 Opus decide
  · reuse vs import vs new per component — apply >100 LOC saved rule
  · lock the 7-stop script (copy + vocab per stop, no invented words)
  · lock the ws event schema for the journey endpoint
  · write doc edits (cross-link this file from speed.md, dictionary.md)
  · produce task list with id/value/effort/persona/tag per engine.md

W3 Sonnet edit (parallel where possible)
  · create src/pages/speed.astro (prerender=true)
  · create src/components/speed/*.tsx (≤6 new components)
  · create src/pages/api/speed/journey.ts (SSE stream of sandwich events)
  · wire SkinSwitcher to metaphors.md mapping
  · cross-link speed.md ←→ speed-page.md

W4 Sonnet verify
  · bun run verify (biome + tsc + vitest, all 320 green)
  · measure: Lighthouse, bundle delta, journey end-to-end latency
  · dictionary grep on page copy — zero non-canonical words
  · run 3-persona user test (builder/CEO/skeptic stopwatch)
  · markDims(fit, form, truth, taste) via /api/loop/mark-dims
  · self-checkoff TODO boxes, mark() edges on pass
```

---

## See Also

- `docs/speed.md` — the numbers this page proves
- `docs/dictionary.md` — the words this page uses (closed set)
- `docs/world-map-page.md` — sibling build spec (the editor page)
- `docs/routing.md` — the sandwich shown in stop 3
- `docs/lifecycle.md` — the stage ordering the journey follows
- `docs/metaphors.md` — the skin switcher mapping
- `docs/rubrics.md` — how W4 scores this page
- `docs/TODO-template.md` — the shape of the execution TODO
- `.claude/rules/astro.md`, `react.md`, `ui.md` — code rules

---

*One signal. Nine stops. Two halves — outbound in milliseconds, return trip
across seven loops over an hour. You arrive knowing how ONE works — because
you rode the signal out and watched the feedback come home.*
