# do-guide

> How humans and AI agents use the `/do` loop to build the ONE system autonomously.
>
> **Status:** Hybrid spec. §1–§6 are the *sharpened* current loop. §7 is the path to deterministic inference (the future where the loop's logic lives in TypeQL rules instead of prose).

---

## Who this is for

**Humans** — you want to understand what the loop does, how to start it, how to read its output, and when to step in. Read §1–§5.

**AI agents** — you want the contracts: signal shapes, JSON returns, gate thresholds, the exact `mark()` to fire on each wave-close. Read §6 plus the spec docs referenced inline.

**Architects** — you want to know what moves to TypeDB inference next. Read §7.

---

## 1. The 60-second mental model

```
ORIENT ──► SENSE ──► SELECT ──► EXECUTE ──► CLOSE ──► DIMS ──► FEEDBACK ──► GROW ──► loop
                                  │
                                  ├── BRIEF: open the TODO, load source_of_truth
                                  └── WORK:  W1 recon → W2 decide → W3 edit → W4 verify
```

**One formula** governs every routing decision:

```
weight = 1 + max(0, strength − resistance) × sensitivity
```

— from [`routing.md`](./routing.md). `mark()` raises strength on success. `warn()` raises resistance on failure. Paths that work get stronger; paths that fail get harder to traverse. No configuration — the substrate learns.

**One rubric** decides if a cycle closes:

```
composite = 0.35·security + 0.30·stability + 0.25·simplicity + 0.10·speed
gate:       composite ≥ 0.65 AND zero adversarial findings with severity > 0.5
```

— from [`rubrics.md`](./rubrics.md) §Code Rubric. The Code Rubric scores *code changes* (what `/do` does). The Message Rubric (`fit/form/truth/taste`) scores *agent responses* — different beast, different doc, §4.2 reconciles them.

**One contract** for every message:

```typescript
{ receiver, data }
```

— from [`signals.md`](./signals.md). Two fields. The whole grammar below is about what's legal in `receiver`.

---

## 2. The four primitives

Everything else composes from these. If you don't recognize a term in the loop, it's defined here.

| Primitive | Shape | Owns | Doc |
|-----------|-------|------|-----|
| **signal** | `{ receiver, data }` | Addressing — *what kind of work*, not *who* | [signals.md](./signals.md) |
| **path** | `{ from, to, strength, resistance, traversals }` | Memory — every connection in the colony | [one.tql](../src/schema/one.tql) + [routing.md](./routing.md) |
| **mark / warn / fade / follow / select** | functions on paths | Algebra — how paths evolve | [routing.md](./routing.md) |
| **rubric** | score ∈ [0, 1] per dimension | Quality — turns binary success into graded marks | [rubrics.md](./rubrics.md) |

### Signal address grammar

```
receiver  := unit | world-addr
unit      := <unit-id> [":" <skill>]
world-addr := "world" [":" <tag-expr>] | "all" [":" <skill>] | "sub" [":" <topic>]
tag-expr  := <tag> ("+" <tag>)*
```

Three modes:

- **Direct** (`alice:review`) — committed relationships, SOPs, signed pipelines
- **World** (`world:review+urgent`) — discovery: "substrate, you pick the unit"
- **Bare** (`world`) — escape hatch: strongest highway from sender

### Path algebra at a glance

| Verb | When | Effect | Speed |
|------|------|--------|-------|
| `mark(edge, n)` | Success | `strength += n` | < 0.001ms |
| `warn(edge, n)` | Failure | `resistance += n` | < 0.001ms |
| `fade(edge)` | Tick | `strength *= 0.95` (decay) | < 5ms for 1k edges |
| `follow(edge)` | Query | Strongest path. Deterministic. | < 0.05ms |
| `select(skill, sensitivity)` | Decision | Weighted random by formula | < 1ms for 1k candidates |

---

## 3. The loop — step by step

```
                          ╭───────────────────────╮
                          │   docs/TODO.md        │
                          │   (the orient board)  │
                          ╰──────────┬────────────╯
                                     │
                                     ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────────────────┐
   │ ORIENT  ├───►│  SENSE  ├───►│ SELECT  ├───►│ EXECUTE                 │
   │ frontier│    │/api/    │    │priority │    │  BRIEF: open TODO       │
   │ + top15 │    │tasks    │    │+ unblocked   │  WORK:  W1→W2→W3→W4    │
   └─────────┘    └─────────┘    └─────────┘    └────────┬────────────────┘
                                                          │
                                                          ▼
                                                   ┌─────────┐
                                                   │  CLOSE  │  POST /api/loop/close
                                                   │  rubric │  composite ≥ 0.65?
                                                   └────┬────┘
                                                        │
                                                        ▼
                                                   ┌─────────┐
                                                   │  DIMS   │  mark / warn per dim
                                                   └────┬────┘
                                                        │
                                                        ▼
                                                   ┌─────────┐
                                                   │FEEDBACK │  signal loop:feedback
                                                   │         │  lays the return trail
                                                   └────┬────┘
                                                        │
                                                        ▼
                                                   ┌─────────┐
                                                   │  GROW   │  /api/highways
                                                   └────┬────┘
                                                        │
                                                        └──► next iteration
```

### Step contracts

**ORIENT** — read `docs/TODO.md`. Note the active front + top 15. This shapes which task you pick. No state, no side-effect.

**SENSE** — `GET http://localhost:4321/api/tasks`. Returns priority-sorted tasks with `{tid, name, source, context, blocked_by, strength, resistance, category}`. Owner: [`/api/tasks/index.ts`](../src/pages/api/tasks/index.ts).

**SELECT** — pick highest unblocked (P0 > P1, attractive > ready > exploratory). All blocked? Follow pheromone highways: `GET /api/state` → use the strongest outgoing path from the loop unit. Deadlock escape, not panic.

**EXECUTE** — two sub-steps:

```
BRIEF (before touching any file):
  source = task.source                  // e.g. "do-gen5"
  If source missing: grep -l "{task.name}" docs/TODO-*.md
  Read docs/TODO-{source}.md:
    • frontmatter source_of_truth → spec docs to pre-load
    • find checkbox matching task.name → exit criteria + "See also"
    Read each source_of_truth entry (first 80 lines each)

WORK: run W1-W4 against the briefing above
  W1 Haiku ×N  recon target files (parallel reads, structured JSON output)
  W2 Opus ×1   decide — diff specs against W1 findings + briefing
  W3 Sonnet ×N edit (parallel, anchor pre-validated)
  W4 Haiku ×5  verify — 4 rubric scorers + 1 adversarial (parallel)
```

The full wave spec is in [`.claude/commands/do.md`](../.claude/commands/do.md).

**CLOSE** — `POST /api/loop/close { score: { security, stability, simplicity, speed } }`. Returns `{ composite, passed }`. If `passed=false`, route back to W3 (max 3 W4 loops).

**DIMS** — `POST /api/loop/mark-dims { security, stability, simplicity, speed }`. Each dim ≥ 0.5 fires `mark(loop:<dim>, n × weight)`. Each dim < 0.5 fires `warn(loop:<dim>, (1−n) × weight)`. This is where the loop *learns* what kind of work it does well.

**FEEDBACK** — `POST /api/signal { receiver: "loop:feedback", data: { tags, strength, content } }`. Lays pheromone on the trail home: future `select()` with these tags follows this trail. Always emit, even on timeout, even on dissolved. **Every loop closes.**

**GROW** — `GET /api/highways`. Report learned paths to the operator. Cosmetic for the human; the substrate already learned in DIMS.

---

## 4. Reconciliations — the 5 gaps fixed

The doc cluster had 5 misalignments before this guide. Each gets one canonical answer below.

### 4.1 The 6 dimensions — what they are and why

ONE has **exactly 6 dimensions**. Lock forever. Source: [`system-ontology.md`](../../one-ie/one/one/system-ontology.md) (in the opensource mirror) and [`one.tql`](../src/schema/one.tql).

| # | Dim | Models | Biology |
|---|-----|--------|---------|
| 1 | **Groups** | Containers, scope, isolation | Colony |
| 2 | **Actors** | Who acts (humans, agents, animals, worlds) | Ants |
| 3 | **Things** | What exists (skills, tasks, services, tokens) | Environment |
| 4 | **Paths** | Weighted connections — learned routes | Pheromone trails |
| 5 | **Events** | Signals + payments — what happened | Foraging activity |
| 6 | **Learning** | Hypotheses, frontiers, objectives | Colony memory |

Every named concept in dictionary.md projects onto one of these. The substrate is the schema is the ontology.

### 4.2 Rubric reconciliation — when to use which

There are **two rubrics**. They scoring different things at different times.

| Rubric | Dimensions | Weights | Scores | When |
|--------|------------|---------|--------|------|
| **Message** | fit · form · truth · taste | 0.35 / 0.20 / 0.30 / 0.15 | agent *responses* (text, code, signal data) | per-call, after every `ask()` |
| **Code** | security · stability · simplicity · speed | 0.35 / 0.30 / 0.25 / 0.10 | code *changes* (diffs) | W4 of every `/do` cycle |

**Mapping** (so dimensions don't collide in pheromone):

```
loop:msg:fit         loop:code:security
loop:msg:form        loop:code:stability
loop:msg:truth       loop:code:simplicity
loop:msg:taste       loop:code:speed
```

The `msg:` and `code:` prefixes keep their pheromone strengths independent. An agent strong on `code:security` is not necessarily strong on `msg:truth`. Future `select()` for code work queries `code:` paths; for message work, `msg:` paths.

**Default for `/do`:** code rubric. Message rubric only kicks in when the cycle's deliverable is an agent response (rare in `/do`; common in `/chat`).

### 4.3 The pheromone ledger — every write the loop fires

The loop writes to pheromone in exactly these places. This is the complete list.

| # | Step | Verb | Edge | Amount | Trigger | Where fired |
|---|------|------|------|--------|---------|-------------|
| 1 | SELECT | `follow()` | `loop→builder` | (read only) | every iteration | `/api/tasks` query path |
| 2 | EXECUTE → W3 success | `mark(edge, 1)` | `agent→skill:{tid}` | 1 per task | wave 3 passes | engine loop |
| 3 | EXECUTE → W3 fail | `warn(edge, 1)` | `agent→skill:{tid}` | 1 per dissolve | wave 3 dissolves | engine loop |
| 4 | CLOSE pass — cycle | `mark()` | `loop:cycle:{slug}` | composite × 5 | composite ≥ 0.65 | `/api/loop/cycle-close` ✓ |
| 5 | CLOSE pass — namespaced | `mark()` | `loop:{kind}:cycle:{slug}` | composite × 5 | composite ≥ 0.65 | `/api/loop/cycle-close` ✓ |
| 6 | CLOSE fail — cycle | `warn()` | `loop:cycle:{slug}` | (1−composite) × 5 | composite < 0.65 | `/api/loop/cycle-close` ✓ |
| 7 | CLOSE fail — namespaced | `warn()` | `loop:{kind}:cycle:{slug}` | (1−composite) × 5 | composite < 0.65 | `/api/loop/cycle-close` ✓ |
| 8 | CLOSE — per-dim ≥ 0.5 | `mark()` | `loop:{kind}:cycle:{slug}:{dim}` | dim × dim_weight | every CLOSE | `markCodeDims` / `markDims` ✓ |
| 9 | CLOSE — per-dim < 0.5 | `warn()` | `loop:{kind}:cycle:{slug}:{dim}` | (1−dim) × dim_weight | every CLOSE | `markCodeDims` / `markDims` ✓ |
| 10 | FEEDBACK each tag | `mark(edge, rubricAvg)` | `loop:tag:{tag}` | rubricAvg | strength ≥ 0.65 | `/api/signal` |
| 11 | FEEDBACK each tag | `warn(edge, 0.5)` | `loop:tag:{tag}` | 0.5 | strength < 0.65 | `/api/signal` |
| 12 | GROW | (no write) | — | — | every iteration | `/api/loop/highways` |
| 13 | Tick (background) | `fade(all)` | every edge | `strength *= 0.95` | every 10s | engine tick |

Rows 4–9 fire from a single `POST /api/loop/cycle-close` call (six writes per close). Rows 1, 10, 11, 12, 13 fire elsewhere. Rows 2, 3 fire from the engine's wave-runner.

If a `mark()` or `warn()` call in the codebase doesn't appear on this list, the loop is leaking — file an issue.

### The tick substrate (separate from `/do` loop)

The `/do` cycle ledger above is what the **build loop** writes. Underneath it runs a **tick substrate** — a background loop that ticks every 10s, fires its own pheromone writes for routing chain bonuses, agent evolution, and TypeDB health. These are the L1–L7 loops from `routing.md`, not the W1–W4 cycle waves of `/do`.

Two files implement it:

| File | Shape | Imported by | Status |
|------|-------|-------------|--------|
| `src/engine/loop.ts` | monolithic `tick()` — all 7 loops inline | `src/pages/api/tick.ts` directly | **legacy**, still wired |
| `src/engine/loops.ts` | modular per-loop exports (`signalLoop`, `fadeLoop`, `evolveLoop`, `knowLoop`, `frontierLoop`, `consultLoop`, `docLoop`) | `src/engine/tick.ts` orchestrator | **current architecture** |

Both are active. `loops.ts` is the refactor target; `loop.ts` is what older `/api/tick` still calls.

**Tick substrate ledger** (chain bonuses + evolution + health):

| File:line | Edge | Amount | Trigger |
|-----------|------|--------|---------|
| `loop.ts:178` | `loop→builder:{tid}` | `warn 2.0` | hypothesis-reflex fires on task |
| `loop.ts:281` | `{prev}→{next}` or `entry→{next}` | `mark min(chainDepth, CHAIN_CAP)` | highway routing success |
| `loop.ts:291` | `{prev}→{next}` or `entry→{next}` | `mark min(chainDepth, CHAIN_CAP)` | normal ask success |
| `loop.ts:297` | `{prev}→{next}` or `entry→{next}` | `warn 0.5` | dissolved outcome |
| `loop.ts:302` | `{prev}→{next}` or `entry→{next}` | `warn 1` | default failure |
| `loop.ts:427` | `{prev}→builder` | `mark min(chainDepth, CHAIN_CAP)` | task execution success |
| `loop.ts:446` | `{task→builder}` | `warn outcome.timeout ? 0 : 0.5` | task ask failure |
| `loop.ts:495` | (all edges) | `fade FADE_RATE (0.05)` | tick decay |
| `loop.ts:612` | `{uid}→{uid}:evolve` | `warn 0.3` | evolution failure |
| `loop.ts:633` | `{uid}→{uid}:evolve` | `mark 2.0` | evolution success |
| `loop.ts:651` | `{uid}→{uid}:evolve` | `warn 0.3` | TypeDB write fail on evolve |
| `loop.ts:693` | `{pathName}` (degrading paths) | `warn 0.5` | degrading path detected |
| `loop.ts:968` | `tick→typedb` | `warn min(1, 1 - writeHealth)` | knowledge cycle health fail |
| `loop.ts:971` | `tick→typedb` | `mark 0.1` | knowledge cycle health pass |
| `loops.ts:76` | `{prev}→{receiver}` or `entry→{receiver}` | `mark min(chainDepth, CHAIN_CAP)` | signalLoop highway routing |
| `loops.ts:87` | `{prev}→{receiver}` or `entry→{receiver}` | `mark min(chainDepth, CHAIN_CAP)` | signalLoop ask success |
| `loops.ts:92` | `{edge}` | `warn 0.5` | signalLoop dissolved |
| `loops.ts:96` | `{edge}` | `warn 1` | signalLoop default failure |
| `loops.ts:121` | (all edges) | `fade FADE_RATE` | fadeLoop decay |
| `loops.ts:163` | `{seeker}→{advisor}:advise` | `mark` (implicit 1) | consultLoop success |

**Read both ledgers as one substrate.** The `/do` cycle ledger fires through `/api/loop/cycle-close` (your code triggering it). The tick substrate ledger fires from the background tick (the world running on its own). Together they're the complete pheromone graph.

### 4.4 context_triggers — how the BRIEF chooses what to load

`context_triggers` are regex → doc-injection rules. Defined in plan frontmatter ([`template-plan.md`](./template-plan.md)) and matched during EXECUTE/BRIEF.

**Resolution order** (deterministic, no LLM):

```
1. Read W1 findings (the recon output)
2. For each context_trigger in the plan's frontmatter:
     If pattern (regex) matches any W1 excerpt OR any file path W1 touched:
       Inject the named doc (first 80 lines) into W2's context
3. After plan-specific triggers, apply built-in defaults:
     signal\( | emit\( | receiver:    → one/signals.md
     \.tql | @/engine | isa path       → src/schema/one.tql (first 80)
     pheromone | mark\( | warn\(       → one/routing.md
     rubric | composite                 → one/rubrics.md
4. Deduplicate (same doc only injected once per cycle)
5. Inject in priority order: plan-specific first, defaults second
```

**Who runs the match:** the W2 driver in the loop (not Haiku, not Claude — deterministic regex). Cost: < 5ms for 50 patterns × 100 W1 lines.

### 4.5 Wave routing vs stage tags — precedence rule

A task can carry both a `task-wave` (W1/W2/W3/W4) and one or more `stage:*` tags (`stage:deploy`, `stage:wallet`, etc.). Both look like tags on the signal. Which wins?

**Rule:** `task-wave` chooses the *model* (W1=Haiku, W2=Opus, W3=Sonnet, W4=Haiku×5). `stage:*` tags choose the *pheromone path*. **They never conflict — they answer different questions.**

| Question | Answer | From |
|----------|--------|------|
| Which model runs this? | `task-wave` | dictionary.md `WAVE_MODEL` |
| Which path does success mark? | each `stage:*` tag, independently | DIMS step + tag-walk |
| Which `select()` picks the unit? | tags intersect: `world:{skill}+{stages}` | signals.md grammar |

A task `{task-wave: W3, tags: [stage:deploy, stage:wallet]}` runs on **Sonnet** (because W3) and on close marks **two** paths: `loop:tag:stage:deploy` and `loop:tag:stage:wallet`. Both compound independently.

---

## 5. How humans use it

### Quickstart

```bash
# 1. Make sure the substrate is up
bun run verify   # biome + tsc + vitest — must be green to start
bun run dev      # boots /api/tasks at :4321

# 2. Drop a TODO file with a plan
$EDITOR docs/TODO-myplan.md        # frontmatter + checkboxes (see template-plan.md)
curl -X POST http://localhost:4321/api/tasks/sync  # ingest

# 3. Run the loop
/do                                # one task
/do --once                         # one task, no continuation
/do --auto                         # run continuously until blocked
/do docs/TODO-myplan.md            # run a specific plan's cycles
```

### Reading the cycle frame

After each cycle the loop prints a frame:

```
╭───────── C2 / myplan / Mechanical Parallelism ───────────╮
│  ✓ Cycle 2 of 5 complete                  rubric: 0.87  │
│                                                          │
│  Wave gates (W0 → W4)                                    │
│    W0  bun run verify          ✓  142/142                │
│    W1  recon                   ✓  4 files (3 cache hits) │
│    W2  decide                  ✓  3 decisions            │
│    W3  edit (parallel)         ✓  3/0                    │
│    W4  verify (scoped)         ✓  +2 tests, clean        │
│                                                          │
│  Rubric                                                  │
│    security 0.90  stability 0.95  simplicity 0.80  speed 0.75 │
│    composite 0.87    ✓ above 0.65 gate                  │
│                                                          │
│  What this unlocks                                       │
│    👤 customer  3-second deploys with no manual key paste│
│    🤖 agent     cycle-time logged for trust budget calc  │
╰──────────────────────────────────────────────────────────╯
```

### When to interrupt

- **Ctrl-C during a wave** — the loop emits `warn(0.5)` on the cycle's tag, then halts. The interrupted wave's marks don't fire. Safe to resume with `/do next`.
- **Ctrl-C during the frame** — frame is rendered but you don't accept it. Same `warn(0.5)` semantics. The cycle counts as complete in TypeDB but flagged as "human-objected" — future cycles with similar tags raise the W2 bar.
- **Cycle visibly dying** (composite < 0.5 two cycles running) — let the escape condition fire. The loop emits `loop:escape:{slug}` and halts on its own. Don't yank it; the signal needs to land.

---

## 6. How agents use it

This section is the executable contract. If you're writing an agent that participates in or calls into the loop, this is the spec.

### Calling SENSE

```http
GET /api/tasks
→ 200 { tasks: Task[] }

interface Task {
  tid: string                    // canonical id
  name: string
  source: string                 // "do-gen5" — TODO-{source}.md
  context: string[]              // doc refs from plan frontmatter
  blocked_by: string[]
  blocks: string[]
  strength: number               // pheromone — higher = traveled more
  resistance: number             // pheromone — higher = avoid
  category: "attractive" | "ready" | "exploratory" | "repelled"
  effectivePriority: number      // score + strength − resistance
}
```

Sort descending by `effectivePriority`. Skip any task where `blocked_by.length > 0`.

### W1 output contract (recon)

Each Haiku recon agent returns:

```json
{
  "files_read": ["src/engine/loop.ts:1-120"],
  "findings": [
    {
      "anchor": "exact string from file",
      "relevance": 0.85,
      "kind": "gap | pattern | risk",
      "note": "one-sentence why this matters"
    }
  ],
  "cache_hit": true
}
```

W2 ignores findings with `relevance < 0.4`.

### W2 output contract (decide)

```json
{
  "decisions": [
    {
      "target_file": "src/engine/loop.ts",
      "anchor": "verbatim string (must grep -qF in target file)",
      "diff_spec": "before/after or line-by-line edit description",
      "rationale": "why this change closes the gap"
    }
  ],
  "context_loaded": ["one/signals.md", "src/schema/one.tql"]
}
```

W3 will reject any decision whose `anchor` does not grep cleanly in the target file (anchor pre-validation).

### W4 adversarial output

```json
{
  "findings": [
    { "issue": "...", "severity": 0.0 }
  ]
}
```

Severity > 0.5 on any finding blocks the gate, regardless of composite. Routes back to W3 (max 3 W4 loops total).

### Emitting signals from inside an agent

```typescript
fetch("/api/signal", {
  method: "POST",
  body: JSON.stringify({
    receiver: "loop:feedback",        // or "world:rubric+code", etc.
    data: {
      tags: ["P0", "auth"],
      strength: 0.87,                  // composite from this run
      content: { task_id, rubric, outcome: "result" }
    }
  })
})
```

The receiver grammar is in [signals.md §The Grammar](./signals.md). Stay under three tags per address. If you need more, you're naming a specific agent — use direct addressing.

### Closing the loop yourself (no human in front)

The loop runs until blocked, then either escalates or halts. **Trust budget** (from do.md optimization #8) governs the cadence:

| Level | Composite last 3+ | Pause behavior |
|-------|-------------------|----------------|
| trusted | ≥ 0.85 consecutive | skip show-frames, run continuously |
| standard | between | pause for `/do next` after each cycle |
| cautious | < 0.65 twice | hard pause, require explicit user "go" |

Any cycle that breaks the streak resets the counter. `/do next` resumes — a passing cycle resets `cautious`; a failing one does not re-trigger until 2 consecutive fails.

---

## 7. Path to deterministic inference — the C section

Today's loop is LLM-driven with deterministic gates *around* the LLM. The end-state is a loop where the *logic* is deterministic (TypeQL inference rules) and the LLM is just one step in a sandwich.

### What can move to TypeQL rules today

Each rule below is a candidate for TypeDB 3.x `rule { ... }` definitions in [`one.tql`](../src/schema/one.tql). The current implementation is JS in `src/engine/`; the schema would replace it.

| Current (JS) | TypeQL rule | Win |
|--------------|-------------|-----|
| `effectivePriority = score + (s − r) × sens` | `rule effective-priority: when { $t isa task, has priority-score $p; (source: $u, target: $t) isa path, has strength $s, has resistance $r; } then { $t has effective-priority $eff; }` (computed via expression) | The formula lives in the schema. Audit = query. |
| "skip blocked tasks" in `/api/tasks` | `rule unblocked: when { $t isa task, has task-status "open"; not { (blocker: $b, blocked: $t) isa blocks; $b has done false; }; } then { $t has ready true; }` | Blocked-state derivable, not stored. |
| `mark(edge, n)` → `strength += n` | Direct attribute update — already declarative in TypeDB | No win; keep imperative. |
| Drift detection (3 consecutive < 0.65) | `rule drift: when { $t isa close, has dim $d, has score $s; $s < 0.65; ... 3-tuple match on consecutive } then { $t emits drift-signal; }` | Drift becomes a query result, not a polling computation. |
| Trust level computation | `rule trusted: when { ... rolling-window aggregate ... } then { $u has trust-level "trusted"; }` | Trust is derivable from history, not stored. |
| `context_triggers` regex match | **Stays JS.** Regex isn't TypeQL. | — |
| W1/W2/W3/W4 LLM calls | **Stay LLM.** This is where probabilism belongs. | — |

### What stays LLM (and why)

- **W1 recon** — pattern detection across novel code; LLMs are good at this; rules can't replace pattern recognition.
- **W2 decide** — tradeoff reasoning; LLMs are good at this; rules would freeze the decision space.
- **W3 edit** — synthesis; obviously LLM.
- **W4 rubric scoring** — judgment calls in the gray zone (0.6 vs 0.7); LLMs are better than threshold rules at "is this code simple."
- **W4 adversarial** — finding novel failure modes; rules only catch known ones.
- **`classify()` in signals.md** — semantic classification of cold-miss skills; LLM by design.

### Migration sketch — one cycle at a time

```
Phase 1 (now → +1 plan):
  Reconciliation only. This guide. No code change.
  - Verify the pheromone ledger (§4.3) matches reality (grep for mark/warn calls)
  - Add `code:` and `msg:` prefixes to existing mark calls
  - Land the wave-vs-stage precedence rule (§4.5) in /api/signal

Phase 2 (+2 plans):
  Move priority + ready-state derivation to TypeQL rules.
  - Add `rule effective-priority` and `rule unblocked` to one.tql
  - Delete the equivalent JS in /api/tasks/index.ts
  - Verify with the existing task-parse test suite — outputs must match

Phase 3 (+3 plans):
  Drift + trust as inference.
  - Add `rule drift-detected` reading 3 consecutive `close` rows
  - Add `rule trust-level` over 7-cycle rolling window
  - Trust transitions become reactive (signal-driven), not polled

Phase 4 (long horizon):
  W4 dispatch via rule.
  - Match (composite ≥ 0.65 AND zero adversarial > 0.5) → emit cycle-complete
  - Match (otherwise) → emit cycle-retry { wave: 3.5 }
  - The W4 → W3.5 routing becomes a query result, not a JS conditional
```

Each phase is a separate `/do` plan with its own classifier block, its own W4 gate, and its own rubric receipt. The substrate eats itself, one inference rule at a time.

---

## 8. Anti-patterns

| Don't | Why |
|-------|-----|
| Skip W2 | Understanding is not delegable. The cycle that runs without W2 ships a bug. |
| Spawn W1 or W3 agents sequentially | Both are designed for one-message parallel spawn. Sequential burns 4× the wall-clock. |
| Run > 3 W4 loops | After 3 fails, escalate to the user. Don't grind. The signal is clearer to a human. |
| Mark with composite < 0.65 | That's `warn()` territory. Mixing weakens the pheromone signal. |
| Add a 5th rubric dimension | Anti-pattern from rubrics.md. Four is the cap. Fold novelty into an existing dim. |
| Edit gate thresholds in `--improve` | Hard-limited (see do.md W2 scope). The loop must not be able to lower its own bar. |
| Inject context Claude didn't ask for | Skill bodies stay lean. Default tokens lost across every invocation across every caller forever. |
| Bypass FEEDBACK on timeout | Every loop closes. Timeouts emit `warn(0.5)`. Silent failures break pheromone learning. |

---

## 9. Closing

The loop is small. Four primitives (`signal`, `path`, `mark/warn/fade/follow/select`, `rubric`). One formula. One rubric. One contract per message. Everything else composes from these.

The current implementation is LLM-driven inside deterministic gates. The future is deterministic inside LLM gates. We get there one inference rule at a time — but only after the prose (this guide) makes the logic explicit enough to translate.

> Pick a task. Open its TODO. Brief on the spec. Run W1-W4. Mark the trail. Repeat.
>
> The path remembers every execution.

---

*Spec doc references in this guide:*
- [`routing.md`](./routing.md) — the formula, the sandwich, the algebra
- [`signals.md`](./signals.md) — the receiver grammar, three address modes
- [`dictionary.md`](./dictionary.md) — canonical vocabulary, 6 dimensions
- [`rubrics.md`](./rubrics.md) — message + code rubrics
- [`template-plan.md`](./template-plan.md) — plan format, classifier, split-tests
- [`system-ontology.md`](../../one-ie/one/one/system-ontology.md) — the 6 dimensions, locked
- [`.claude/commands/do.md`](../.claude/commands/do.md) — the wave executor itself
