---
title: Loop Refinements
type: roadmap
source: docs/loops.md
schema: src/schema/one.tql
status: ACTIVE
total_tasks: 28
completed: 0
priority: L1-L3 (foundation) → L4-L5 (economics+evolution) → L6-L7 (intelligence)
---

# Loop Refinements

> Seven loops. Nested. Coupled. These are the gaps.
>
> Source: `docs/loops.md` and `src/schema/one.tql`

---

## L1: Signal Loop

- [ ] SL-1: Latency-weighted routing — `suggest_route()` should score `strength / latency` not just `strength`. A highway at 5s is worse than a fresh path at 50ms. Requires joining `signal.latency` history into route scoring.
- [ ] SL-2: Signal priority — signals don't carry priority from their spawning task. Add `priority` to `signal` relation derived from `task.priority`. P0 signals preempt P3.

## L2: Trail Loop

- [ ] TL-1: Trail chains — schema tracks A→B but not A→B→C as a sequence. Add `trail.depth` or a `chain` relation to track multi-hop sequence confidence. A proven A→B and proven B→C doesn't mean A→B→C is proven.
- [ ] TL-2: Alternative trails — when A→B has high alarm, nothing suggests trying A→C. Add `alternative_trails($task)` function that returns untried next steps when current trail is alarmed.
- [ ] TL-3: Completion velocity — two proven trails, one takes 10min, one takes 2hrs. Add `trail.avg-latency` derived from signal latencies along the chain. Prefer faster proven sequences.

## L3: Fade Loop

- [ ] FL-1: Trail fade-rate — paths have per-path `fade-rate` but trails don't. A proven production trail (create→develop→review→ship) should decay slower than an experimental trail. Add `trail.fade-rate`.
- [ ] FL-2: Seasonal decay — modulate fade by `last-used`. Don't decay a path used yesterday as aggressively as one idle for a week. `days-since-used * fade-rate` instead of constant.
- [ ] FL-3: Fade floor — a path that peaked at strength 80 shouldn't fade to zero and be indistinguishable from a path that never existed. Add `path.peak-strength`. Floor = `peak * 0.05`. Ghost trails recover faster.

## L4: Economic Loop

- [ ] EL-1: Revenue-weighted routing — `suggest_route()` sorts by strength alone. Score should be `strength * (1 + log(revenue + 1))`. Money validates the path. Add `weighted_route()` function.
- [ ] EL-2: Revenue decay — revenue only accumulates. Old revenue shouldn't carry same weight. Add `path.recent-revenue` (last 30 days) alongside `path.revenue` (lifetime). Route on recent, report on lifetime.
- [ ] EL-3: Cost-aware evolution — `needs_evolution()` ignores economics. Agent with 0.45 success but $10k revenue might be fine. Agent with 0.80 success but $0 revenue needs market evolution, not skill. Split into `needs_skill_evolution` and `needs_market_evolution`.

## L5: Evolution Loop

- [ ] EV-1: Evolution history — old `system-prompt` is overwritten on evolution. If gen 3 was better than gen 4, no rollback. Add `prompt-history` relation or versioned storage. `generation` is a counter, not an archive.
- [ ] EV-2: Targeted evolution — `needs_evolution()` fires on overall success-rate. Agent might be 0.90 on "build" and 0.20 on "validate". Blanket rewrite risks degrading the strong skill. Add `needs_evolution_for($u, $task-type)` checking success per task-type.
- [ ] EV-3: Evolution cooldown — nothing prevents rewriting prompt every 20 samples forever. Oscillating agents never stabilize. Add `unit.last-evolved` (datetime) with minimum cooldown. Let new prompts accumulate fair sample size.
- [ ] EV-4: Peer learning — agent A evolves using only its own failures. But agent B doing the same task-type at 0.90 has a prompt that works. Feed proven peer prompts as reference input during evolution. Not copying — referencing.
- [ ] EV-5: Model economics — upgrading haiku→opus costs more per signal. Evolution should consider `revenue-per-signal / cost-per-signal`. An opus agent losing money on every signal should downgrade. Add `unit.cost-per-signal` attribute.

## L6: Knowledge Loop

- [ ] KL-1: Auto-generate hypotheses — when trail flips proven→fading, auto-create hypothesis: "sequence X→Y degraded." When `needs_evolution` fires, auto-create: "agent Z underperforming." The substrate watches its own state changes and asks "why?"
- [ ] KL-2: Hypothesis→evolution link — confirmed hypothesis "Amelia struggles with useEffect" should inform her next prompt rewrite. Add a `learning` relation connecting `hypothesis` to `unit`. When evolution fires, agent reads its linked confirmed hypotheses.
- [ ] KL-3: Counter-hypotheses — if hypothesis A and B are both confirmed for the same task-type but contradict, the system can't resolve it. Add `contradicts` relation between hypotheses. When both confirmed, escalate to human or A/B test via trail branching.
- [ ] KL-4: Learning promotion — Lisa (librarian agent) documents learnings, but the path from learning→hypothesis→confirmed→prompt-change is manual. Automate: learning with N confirmations auto-promotes to hypothesis. Hypothesis with p<=0.05 auto-links to relevant units.

## L7: Frontier Loop

- [ ] FR-1: Frontier detection from trail gaps — `exploratory_tasks()` finds tasks with no trail. A cluster of exploratory tasks in the same `task-type` or `phase` is a frontier. Add periodic scan that counts per dimension and auto-creates frontiers above threshold.
- [ ] FR-2: Split expected-value — currently a single number defined as `potential * probability / cost`. Split into three attributes so system can reason about "high potential / low probability" differently from "low potential / high probability."
- [ ] FR-3: Frontier→swarm — when frontier spawns objective, who works on it? Frontier spawns temporary `swarm` (swarm-type: "expedition") with units assigned by `suggest_route()`. When exhausted, swarm dissolves. Scouting party, not the whole army.

## Loop Coupling

- [ ] LC-1: Knowledge→Evolution link (L6→L5) — confirmed hypotheses about agent weaknesses should be primary input to prompt rewriting. Without this, evolution is blind: agent knows it's failing but not why. Knowledge loop knows why but can't tell the agent.
- [ ] LC-2: Frontier→Economics link (L7→L4) — frontier expected-value should inform model tier. High-value frontier justifies opus agent. Low-value frontier uses haiku. Economic loop should govern which model tier the expedition uses.
- [ ] LC-3: Evolution disruption protocol (L5→all) — when an agent evolves, downstream loops partially reset. New trails form, paths reweight, hypotheses may invalidate. Need a mechanism to mark "post-evolution" sample window so the system doesn't overreact to temporary instability.

---

## Priority Order

**Foundation (L1–L3):** SL-1, FL-2, FL-3, TL-3
Get the basic loops right. Latency-aware routing, seasonal decay, fade floors, trail velocity.

**Economics + Evolution (L4–L5):** EL-1, EV-3, EV-2, EL-3, EV-1
Revenue-weighted routing, evolution cooldown, targeted evolution. Don't evolve blind.

**Intelligence (L6–L7):** KL-1, KL-2, LC-1, FR-1
Auto-hypotheses, knowledge→evolution link. Close the loop between knowing and improving.

**Polish:** everything else. These refine, not enable.

---

*28 tasks. 7 loops. The substrate learns. Now teach it to learn better.*
