---
title: Close the Loop
slug: loop-close
goal: Plans become pheromones; agents compete; humans sign.
group: ONE
cycles: 5
route_hints:
  primary: [substrate, routing, pheromone, lifecycle]
  secondary: [marketing, commerce, chat, sui]
rubric_weights:
  fit: 0.35
  form: 0.15
  truth: 0.35
  taste: 0.15
split_tests:
  - cycle: 2
    wave: W3
    variants: 3
    dimension: "routing strategy (CEO → director selection)"
  - cycle: 4
    wave: W3
    variants: 2
    dimension: "pitch template shape (long form vs one-liner + link)"
escape:
  condition: "rubric < 0.50 for 2 consecutive cycles OR any W4 reports signal-loss invariant failure"
  action: "emit signal → chairman with trend + pause remaining cycles; keep prior cycle artifacts"
downstream:
  capability: route-design
  price: 0.05
  scope: public
source_of_truth:
  - one/dictionary.md
  - one/patterns.md
  - one/rubrics.md
  - one/lifecycle.md
  - one/lifecycle-one.md
  - one/routing.md
  - one/buy-and-sell.md
  - one/revenue.md
  - one/template-plan.md
  - one/template-todo.md
status: PLAN
---

# Plan: Close the Loop

## 1 — Vision

Today, a plan is a doc, a TODO is a doc, `/do` spawns agents, tests pass,
code ships. Pheromone accumulates — but only on the dev loop, never back
into the plan that spawned it, never forward into a pitch that a human
can sign. **This plan closes both ends of that gap.** A plan becomes a
signal template. Tasks get split-tested so the substrate learns which
routing strategy wins. Winning capabilities auto-pitch into chat URLs.
Humans land in a chat and sign a transaction. The revenue flows back
to pheromone on the plan that produced the capability.

## 2 — The closed loop

```
plan-<slug>.md
     │
     │  /plan compile
     ▼
TODO-<slug>.md ──► /sync todos ──► task signals enter substrate
     │                                     │
     │                                     ▼
     │                              ceo ─follow──► director ─follow──► agents (fan-out)
     │                                     │                              │
     │                                     │                         execute (split-test)
     │                                     │                              │
     │                                     ▼                          outcome
     │                              mark() / warn()            ╔═══════════╗
     │                                     │                   ║  result   ║ → mark(+depth)
     │                                     │                   ║  timeout  ║ → neutral
     │                                     │                   ║ dissolved ║ → warn(0.5)
     │                                     │                   ║  failure  ║ → warn(1)
     │                                     ▼                   ╚═══════════╝
     │                              HIGHWAY forms on winning variant
     │                                     │
     │                                     ▼
     │                              downstream.pitch auto-generated
     │                                     │
     │                                     ▼
     │                              /marketplace publishes skill-id + chat URL
     │                                     │
     │                                     ▼
     │                              agent shares URL via claws (Telegram, email, X)
     │                                     │
     │                                     ▼
     │                              human clicks → /chat/<agent-uid>/<skill-id>
     │                                     │
     │                                     ▼
     │                              chat renders RichMessage transaction card
     │                                     │
     │                                     ▼
     │                              human signs with Sui wallet (or guest keypair)
     │                                     │
     │                                     ▼
     │                              escrow → execute → settle → receipt
     │                                     │
     └◄────── pheromone flows back ────────┘
              revenue → path strength → next plan's W1 routes faster
```

No dangling arrows. No "and then somehow." Every transition is a named
substrate verb or a concrete surface.

## 3 — Fronts

| Front          | Tags                                  | Rubric tilt           | Who picks it up |
|----------------|---------------------------------------|----------------------|-----------------|
| Substrate wire | [substrate, routing, task-entity]     | 0.40 / 0.10 / 0.40 / 0.10 | Director of Engineering (high `substrate` pheromone) |
| Split test     | [split-test, multivariate, pheromone] | 0.30 / 0.10 / 0.50 / 0.10 | Director of Engineering + Science lead |
| Marketing      | [pitch, chat, marketplace, claw]      | 0.25 / 0.35 / 0.20 / 0.20 | CMO — director with `marketing` pheromone |
| Commerce       | [sui, escrow, settle, rich-message]   | 0.35 / 0.15 / 0.40 / 0.10 | Director of Commerce — `sui` pheromone |

Each front's director fan-outs tasks to their own team via pheromone.
No task here names an agent.

## 4 — Cycles

### Cycle 1 — Task entities live in the substrate

**Deliverable:** Every task in every TODO-*.md becomes a real `task` entity in
TypeDB with `task-wave`, `task-tags`, `blocks` relations. `/do` reads tasks
from TypeDB, not from markdown. Pheromone accumulates on `task → agent` edges.

**Rubric weights:** `0.40 / 0.10 / 0.40 / 0.10` (fit + truth dominate — correctness of the wiring)

**Exit:** `/do` can execute a task by uid alone (no markdown dependency) AND
`select()` returns the right task given `[substrate, routing]` tags.

| Wave | What | Parallelism | Closes with |
|------|------|-------------|-------------|
| W1 | Recon `/sync todos`, `one/task-management.md`, `src/pages/api/tasks/*.ts` | 4 Haiku | findings with file:line |
| W2 | Spec: task-entity schema + /do read-path change | 2 Opus shards | anchored diff spec |
| W3 | Edit: update `/sync todos`, `/do`, `/close` to read/write TypeDB tasks | 1 Sonnet per file | files modified |
| W4 | Verify: 10 tasks entered, 5 routed, 5 closed, rubric green | 2 Sonnet verifiers | rubric ≥ 0.65 |

### Cycle 2 — Multivariate split-testing

**Deliverable:** `/do` fans out any task with `task.split-test-group` to N
agent variants in parallel. Each variant emits pheromone on its own path.
Winner determined by rubric dims AND completion speed. Losers get `warn(0.5)`.

**Rubric weights:** `0.30 / 0.10 / 0.50 / 0.10` (truth dominates — the split must measure what it claims)

**Exit:** A single task run 3 ways produces distinguishable pheromone; future
`select()` on similar tags prefers the winning variant's path.

| Wave | What | Parallelism | Closes with |
|------|------|-------------|-------------|
| W1 | Recon current `/do` fan-out logic + `select()` in `persist.ts` | 4 Haiku | findings |
| W2 | Spec: `split-test-group` attribute + fan-out protocol + winner scorer | 2 Opus | diff spec + 3 variant shapes |
| W3 | **Split-test here** — 3 variants of the split-test implementation itself: (A) parallel `ask()` race, (B) sequential with early stop, (C) all-run-then-compare | 3 Sonnet (parallel, different strategies) | 3 working implementations |
| W4 | Verify: pick winner by rubric; losers get warn(0.5) on their path | 2 Sonnet verifiers | rubric ≥ 0.65 + winner pheromone clearly higher |

### Cycle 3 — Capability pitch + chat surface

**Deliverable:** When a path reaches `highway` status (strength ≥ 50), a pitch
signal fires automatically. `/marketplace` publishes the capability. A chat
URL `/chat/<agent-uid>/<skill-id>` is live and demo-able.

**Rubric weights:** `0.25 / 0.35 / 0.20 / 0.20` (form matters — the pitch has to read well)

**Exit:** Curl the chat URL → HTML returns with the agent's system prompt
embedded + a RichMessage transaction card stub.

| Wave | What | Parallelism | Closes with |
|------|------|-------------|-------------|
| W1 | Recon `/marketplace`, `src/pages/api/agents/discover`, `RichMessage` type, current chat surfaces | 4 Haiku | findings |
| W2 | Spec: highway → pitch trigger + `/chat/:uid/:skill` route + pitch template | 2 Opus | diff spec + pitch copy |
| W3 | Edit: add highway→pitch hook in `persist.ts`, add chat route in `src/pages/chat/[uid]/[skill].astro` | 1 Sonnet per file | files modified |
| W4 | Verify: trigger a highway in test → pitch fires → chat URL returns 200 with rich card | 2 Sonnet verifiers | rubric ≥ 0.65 |

### Cycle 4 — Agents pitch to humans via claws

**Deliverable:** An agent at highway status can share its chat URL through
its wired claws (Telegram, Discord, email). Target: one working delivery
path from highway → human inbox.

**Rubric weights:** `0.30 / 0.30 / 0.30 / 0.10`

**Exit:** Telegram bot sends one test message with a chat URL in a button;
clicking the button opens the chat on the live substrate.

| Wave | What | Parallelism | Closes with |
|------|------|-------------|-------------|
| W1 | Recon `nanoclaw/`, bot messaging APIs, button/inline keyboard specs | 3 Haiku | findings |
| W2 | Spec: claw `pitch()` method + rate-limit contract + opt-out | 2 Opus | diff spec + 2 pitch shapes |
| W3 | **Split-test here** — 2 pitch templates: (A) long-form explainer + CTA, (B) one-liner + button. Measure click-through. | 2 Sonnet (different templates) | 2 live variants |
| W4 | Verify: both variants send; click-through tracked; pheromone differentiates | 2 Sonnet verifiers | rubric ≥ 0.65 + CTR diff measurable |

### Cycle 5 — Humans sign transactions in chat

**Deliverable:** The RichMessage transaction card in `/chat/:uid/:skill`
triggers a Sui wallet signature flow for a human (or guest-derived keypair
for first-time users). On success: escrow created, skill executes, settlement
signal fires, pheromone flows back to the plan that produced the capability.

**Rubric weights:** `0.40 / 0.20 / 0.30 / 0.10` (fit + truth — transactions must be correct and settle)

**Exit:** One round-trip completes: human lands on chat → signs → escrow →
execute → settle → receipt rendered → `markDims({fit,form,truth,taste})`
deposits pheromone on the original plan's path.

| Wave | What | Parallelism | Closes with |
|------|------|-------------|-------------|
| W1 | Recon `src/engine/bridge.ts` (Sui mirror/absorb), `one/buy-and-sell.md` trade lifecycle, existing `EscrowBadge` / `ReceiptPanel` | 4 Haiku | findings |
| W2 | Spec: chat-card → sign flow, guest keypair minting, post-settle pheromone hook | 2 Opus | diff spec + escrow params |
| W3 | Edit: wire chat card signature handler, wire post-settle `markDims` on plan path | 1 Sonnet per file | files modified |
| W4 | Verify: end-to-end test from `plan-loop-close.md` → chat sign → settle → this doc's `downstream.capability` path has new strength | 2 Sonnet verifiers | rubric ≥ 0.65 + pheromone delta measurable |

## 5 — Split-tests (details)

### Cycle 2 / W3 — split-test the split-test implementation itself

Meta-split: we're building split-testing by split-testing it.

| Variant | Description | Strength | Weakness |
|---------|-------------|----------|----------|
| A — parallel race | All N variants run in parallel, first `{result}` wins | Fast (latency = fastest variant) | Quality loses to speed |
| B — sequential with early stop | Variants run in order, stop when rubric ≥ target | Cheapest (stops early) | Serial latency if all fail |
| C — all-run then compare | Every variant completes; best rubric wins | Best quality signal | Most expensive |

Winner picked by: (rubric_score × 0.6) + (speed_score × 0.3) + (cost_score × 0.1)
Loser variants: `warn(0.5)` on the path tag `split-test-strategy:{a|b|c}`.

### Cycle 4 / W3 — pitch template split

| Variant | Shape | Hypothesis |
|---------|-------|------------|
| A — long form | Explainer paragraph + CTA button | higher trust, lower CTR |
| B — one-liner | Single line + button | higher CTR, lower trust |

Winner picked by: click-through × conversion rate (needs Cycle 5 before full measurement).

## 6 — Source of truth

| Doc | Locks |
|-----|-------|
| `one/dictionary.md` | canonical names, 6 verbs, 4 outcomes |
| `one/patterns.md` | closed loop, zero returns, deterministic sandwich |
| `one/rubrics.md` | fit/form/truth/taste + gate 0.65 |
| `one/lifecycle.md` | agent arc: REGISTER → CAPABLE → DISCOVER → HIGHWAY → HARDEN |
| `one/lifecycle-one.md` | user funnel: wallet → sign-in → converse → sell → buy |
| `one/routing.md` | `follow` (deterministic) vs `select` (probabilistic), toxicity gate |
| `one/buy-and-sell.md` | trade lifecycle: LIST → OFFER → ESCROW → EXECUTE → VERIFY → SETTLE |
| `one/revenue.md` | five layers; marketplace take on settlement |
| `one/template-plan.md` | this doc's shape |
| `one/template-todo.md` | what this plan compiles into |

## 7 — Escape clause

```
IF  rubric < 0.50 for 2 consecutive cycles
THEN emit signal { receiver: "chairman", data: { plan: "loop-close",
       trend: [c1_rubric, c2_rubric, ...], reason: "quality regression" } }
AND  status → PAUSED
AND  pending cycles → withdrawn from the substrate task queue
AND  prior cycle artifacts preserved (not rolled back)

IF  any W4 reports "signal-loss" invariant failure
       (tasks marked done without mark()/warn() firing)
THEN status → HALTED (no further cycles — Rule 1 violation)
AND  emit signal → chairman + board with offending cycle + wave

IF  Cycle 5 W4 cannot measure pheromone delta end-to-end
THEN status → PAUSED (loop is not actually closing)
AND  escape to chairman for scope review
```

Escape is not failure. It's the closed-loop version of "we were wrong."

## 8 — Downstream pitch

When all 5 cycles close, the capability `route-design` goes live on `/marketplace`:

```yaml
capability: route-design
price: 0.05
scope: public
pitch:
  headline: "Let the substrate route your work."
  body: |
    Drop a task. The CEO picks the director, the director picks the agent,
    pheromone picks the path. You don't assign; you observe. Built on ONE.
  demo_url: /chat/one:router/route-design
  transaction_url: /marketplace/pay?skill=route-design
```

This is what makes Cycle 5's pheromone-back-to-plan measurable: the first
paying customer's settlement deposits the first real pheromone on this
plan's path, and every plan that follows this one will route through
whichever director the substrate learned owns `[substrate, routing]`.

**The plan produces a capability that makes future plans faster.** That's
the flywheel.

## 9 — How to run

```bash
# Generate TODO from this plan
/plan compile plans/one/loop-close.md          # emits TODO-loop-close.md

# Run all 5 cycles
/do TODO-loop-close.md --auto                  # W1→W4 × 5, writes to substrate

# Check progress
/plan status plans/one/loop-close.md           # rubric trend + escape risk

# When cycles close, publish the pitch
/plan pitch plans/one/loop-close.md            # downstream.capability goes live
```

---

## See also

- `one/template-plan.md` — the shape this plan follows
- `one/template-todo.md` — what this plan compiles into
- `one/lifecycle.md` — the arc every capability walks
- `one/routing.md` — follow/select mechanics this plan wires up
- `one/buy-and-sell.md` — trade lifecycle Cycle 5 rides on top of
- `.claude/commands/plan.md` — slash command (to be added Cycle 1/W3)
