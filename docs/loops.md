# Loops

Source of truth: `src/schema/one.tql`

---

## The Seven Loops

The substrate runs on nested feedback loops. Each operates at a different
timescale. Faster loops feed slower loops. Slower loops reshape faster ones.

```
┌─────────────────────────────────────────────────────────────┐
│  L7  FRONTIER        weeks/months    detect new territory   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ L6  KNOWLEDGE      days/weeks      form & test beliefs  │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ L5  EVOLUTION    every N samples  rewrite the ant    │ │ │
│ │ │ ┌─────────────────────────────────────────────────┐ │ │ │
│ │ │ │ L4  ECONOMIC   per payment     revenue = weight  │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │ L3  FADE     periodic        decay all       │ │ │ │ │
│ │ │ │ │ ┌─────────────────────────────────────────┐ │ │ │ │ │
│ │ │ │ │ │ L2  TRAIL  per task        sequence wt   │ │ │ │ │ │
│ │ │ │ │ │ ┌───────────────────────────────────┐   │ │ │ │ │ │
│ │ │ │ │ │ │ L1  SIGNAL  per message  the pulse │   │ │ │ │ │ │
│ │ │ │ │ │ └───────────────────────────────────┘   │ │ │ │ │ │
│ │ │ │ │ └─────────────────────────────────────────┘ │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────────┘ │ │ │ │
│ │ │ └─────────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## L1: Signal Loop

The heartbeat. Every signal is one turn of this loop.

```
emit({ receiver, data })
  → TypeDB writes signal(sender, receiver, data, amount, ts)
  → suggest_route() returns next destination
  → agent executes
  → emit result
```

**Timescale:** milliseconds
**Feeds:** L2 (trail), L4 (economic)
**Schema:** `signal` relation

### Refinements

- **Latency tracking.** `signal.latency` already exists. Use it to penalize
  slow paths — a highway that takes 5s is worse than a fresh path at 50ms.
  Route selection should weight `strength / latency`, not just `strength`.

- **Signal priority.** Not all signals are equal. A P0 task signal should
  preempt a P3. The schema has `task.priority` but signals don't carry it.
  Consider: `signal.priority` derived from the task that spawned it.

---

## L2: Trail Loop

Signal sequences accumulate pheromone. The colony learns what order works.

```
signal to A completes → signal to B starts
  success → path(A→B).strength += mark()
  failure → path(A→B).alarm += warn()
```

**Timescale:** per signal delivery
**Feeds:** L1 (routing via select() weighted by scent - alarm)
**Fed by:** L1 (signal outcomes)
**Runtime:** `colony.scent`, `colony.alarm`, `mark()`, `warn()`
**TypeDB:** `path` relation (strength, alarm, traversals)

### Refinements

- **Trail chains.** The schema tracks A→B but not A→B→C as a sequence.
  A proven trail A→B and proven trail B→C doesn't mean A→B→C is proven —
  B might be a bottleneck. Consider: `trail.depth` to track multi-hop
  sequence confidence, or a `chain` relation linking ordered trails.

- **Trail branching.** When A→B fails, the system alarms that trail.
  But it doesn't automatically try A→C. The `exploratory_tasks()` function
  finds tasks with no trail history, but there's no function for
  "tasks reachable from A that aren't B." Consider: `alternative_trails($task)`
  that returns untried next steps when the current trail has high alarm.

- **Completion velocity.** Two trails might both be proven, but one takes
  10 minutes and the other takes 2 hours. `trail.avg-latency` derived from
  signal latencies along the chain would let the system prefer faster sequences.

---

## L3: Fade Loop

Time decays everything. Without reinforcement, paths dissolve.

```
periodic tick (every 5 minutes):
  for each path:
    strength *= (1 - fade-rate)
    alarm *= (1 - fade-rate * 2)     # alarm forgets faster
```

**Timescale:** every 5 minutes (configurable)
**Feeds:** L1 (routing changes as paths weaken), L2 (selection shifts)
**Runtime:** `colony.fade(rate)` — asymmetric, alarm decays 2x
**TypeDB:** `path.fade-rate` (per-path), falls back to global 5%

### Refinements

- **Differential fade is already in the schema.** `fade-rate` is per-path
  (production=0.05, support=0.15, alarm=2x). This is good. But trails
  don't have their own `fade-rate` yet. A proven production trail
  (create→develop→review→ship) should decay slower than an experimental
  trail (create→skip-review→ship). Consider: `trail.fade-rate`.

- **Seasonal decay.** Some paths are bursty — heavy use during sprints,
  quiet between. Fixed decay penalizes healthy idle paths. Consider:
  `path.last-used` (already exists) to modulate fade — don't decay a path
  that was used yesterday as aggressively as one idle for a week.
  `days-since-used * fade-rate` instead of constant `fade-rate`.

- **Fade floor.** A path that was once a highway (strength 80+) shouldn't
  fade to zero and be indistinguishable from a path that never existed.
  Consider: `path.peak-strength` to remember the highest value, and a
  floor of `peak * 0.05`. Proven paths leave a ghost trail — faint, but
  recoverable faster than building from nothing.

---

## L4: Economic Loop

Revenue is pheromone. Paying paths become highways.

```
signal(sender: A, receiver: B, amount: 0.01)
  → path(A, B).revenue += 0.01
  → path(A, B).strength += f(amount)    # revenue IS weight
  → highway emerges from commerce
```

**Timescale:** per payment
**Feeds:** L1 (revenue-weighted routing), L5 (evolution — revenue justifies cost)
**Schema:** `signal.amount`, `path.revenue`, `trail.revenue`, `capability.price`

### Refinements

- **Revenue-weighted routing.** `suggest_route()` sorts by `strength` alone.
  But a path with strength 30 and revenue $500 is more valuable than
  strength 50 with revenue $0. Consider: `weighted_route()` that scores
  `strength * (1 + log(revenue + 1))`. Money validates the path.

- **Cost-aware evolution.** `needs_evolution()` checks success-rate but not
  economics. An agent with 0.45 success-rate but $10k revenue might not need
  evolution — it's doing fine commercially. An agent with 0.80 success-rate
  but $0 revenue might need a different kind of evolution: not skill, but
  pricing or discovery. Consider: splitting evolution triggers into
  `needs_skill_evolution` (low success) and `needs_market_evolution` (low revenue).

- **Revenue decay.** Revenue currently only accumulates. Old revenue from
  six months ago shouldn't carry the same weight as revenue from yesterday.
  Consider: `path.recent-revenue` (last 30 days) alongside `path.revenue`
  (lifetime). Route on recent, report on lifetime.

---

## L5: Evolution Loop

The agent rewrites itself. The substrate provides the data; the ant decides how.

```
sample-count >= 20 AND success-rate < 0.50
  → needs_evolution() fires
  → agent reads own failure signals
  → agent rewrites system-prompt
  → generation++
  → optional: model upgrade
  → next N samples measured against new prompt
```

**Timescale:** every 20+ samples (configurable)
**Feeds:** L1 (better agent = better signals), L2 (better agent = better trail outcomes)
**Fed by:** L1 (signal success/failure), L4 (revenue performance)
**Schema:** `unit.model`, `unit.system-prompt`, `unit.generation`, `needs_evolution()`

### Refinements

- **Evolution history.** When an agent evolves, the old `system-prompt` is
  overwritten. If generation 3 was better than generation 4, there's no
  rollback. Consider: a `prompt-history` relation or versioned storage
  so the system can revert. `generation` is a counter but not an archive.

- **Targeted evolution.** `needs_evolution()` fires on overall success-rate.
  But an agent might be great at "build" tasks (0.90) and terrible at
  "validate" tasks (0.20). Blanket prompt rewrite risks degrading the strong
  skill. Consider: `needs_evolution_for($u, $task-type)` that checks
  success-rate per task-type via capability + signal history.

- **Evolution cooldown.** Nothing prevents the system from rewriting the
  prompt every 20 samples forever. An agent oscillating between prompts
  never stabilizes. Consider: `unit.last-evolved` (datetime) and a minimum
  cooldown period. Don't evolve if the last evolution was < N days ago.
  Let the new prompt accumulate enough samples to be fairly measured.

- **Peer learning.** When agent A evolves, it only looks at its own failures.
  But agent B doing the same task-type with 0.90 success-rate has a prompt
  that works. Consider: `system-prompt` from proven peers as input to
  evolution. Not copying — but referencing. "What does the proven agent's
  prompt include that mine doesn't?"

- **Model economics.** Upgrading from haiku to opus improves capability but
  costs more per signal. The evolution loop should consider
  `revenue-per-signal / cost-per-signal`. An opus agent that loses money
  on every signal should downgrade, not upgrade. The substrate has
  `path.revenue` and `signal.amount` — the data exists.

---

## L6: Knowledge Loop

The system forms beliefs, tests them, and acts on what's confirmed.

```
observations accumulate
  → hypothesis created (pending)
  → tested against new signals
  → observations-count++, p-value updated
  → confirmed (p <= 0.05, n >= 50) → action-ready
  → or rejected
```

**Timescale:** days to weeks
**Feeds:** L5 (confirmed hypothesis = targeted evolution reason),
          L7 (rejected hypothesis closes a frontier)
**Fed by:** L2 (trail patterns suggest hypotheses), L5 (evolution outcomes)
**Schema:** `hypothesis`, `is_action_ready()`

### Refinements

- **Hypothesis generation.** The schema stores hypotheses but nothing creates
  them. Who writes the initial `statement`? Currently: agents via learnings,
  or Lisa the librarian. But the substrate itself could generate them.
  Consider: when a trail flips from "proven" to "fading", auto-create a
  hypothesis: "task sequence X→Y has degraded — investigate cause."
  When `needs_evolution` fires, auto-create: "agent Z underperforming —
  test prompt revision." The substrate observes its own state changes
  and asks "why?"

- **Hypothesis → evolution link.** A confirmed hypothesis like "Amelia
  struggles with useEffect cleanup" should directly inform her next
  `system-prompt` rewrite. Currently there's no relation between
  `hypothesis` and `unit.system-prompt`. Consider: `hypothesis` plays a
  role in a `learning` relation that connects to the unit it's about.
  When evolution fires, the agent reads its linked confirmed hypotheses.

- **Counter-hypotheses.** The system can confirm but can't contradict.
  If hypothesis A ("use Redux") is confirmed and hypothesis B ("use Zustand")
  is later confirmed for the same task-type, they conflict. Consider:
  a `contradicts` relation between hypotheses. When both sides are confirmed,
  escalate to a human or run an A/B test via trail branching.

---

## L7: Frontier Loop

The outermost loop. The system detects what it doesn't know.

```
promising_frontiers()
  → unexplored + expected-value >= 0.5
  → spawns objective (pending → active → complete)
  → objective creates tasks
  → tasks create signals
  → signals create trails
  → trails either prove or disprove the frontier
  → frontier: exploring → exhausted
```

**Timescale:** weeks to months
**Feeds:** all inner loops (new work enters the system)
**Fed by:** L6 (knowledge gaps become frontiers), L2 (trail voids = unexplored territory)
**Schema:** `frontier`, `objective`, `spawns`, `promising_frontiers()`, `active_objectives()`

### Refinements

- **Frontier detection from trail gaps.** `exploratory_tasks()` finds tasks
  with no trail history. A cluster of exploratory tasks in the same
  `task-type` or `phase` is a frontier. Currently nothing aggregates this.
  Consider: a periodic scan that counts exploratory tasks per dimension
  and auto-creates frontiers when the count crosses a threshold.

- **Frontier expected-value.** Currently a single number. But it's defined as
  `potential * probability / cost` — three factors that change independently.
  Consider: splitting into three attributes so the system can reason about
  "high potential but low probability" differently from "low potential but
  high probability." Different risk profiles need different strategies.

- **Frontier → swarm.** When a frontier spawns an objective, who works on it?
  Currently unspecified. Consider: frontier spawns a temporary `swarm`
  (swarm-type: "expedition") with units assigned by `suggest_route()`.
  When the frontier is exhausted, the swarm dissolves. The colony sends
  a scouting party, not the whole army.

---

## Loop Coupling

The loops don't run in isolation. Here's how they feed each other:

```
L1 Signal ──outcome──→ L2 Trail ──pattern──→ L6 Knowledge
    │                      │                      │
    │                      │                      ▼
    │                      │                 L7 Frontier
    │                      │                      │
    │                      ▼                      ▼
    │                 L3 Fade ←───────── new tasks enter
    │                      │
    ▼                      ▼
L4 Economic ──revenue──→ L5 Evolution
    │                      │
    └──────────────────────┘
         better agents = better signals = L1
```

### Critical coupling: L5 → L1

When an agent evolves, every loop downstream resets partially:
- New trails form (L2) because the agent behaves differently
- Paths reweight (L3) because success-rate changes
- Revenue shifts (L4) because capability changes
- Hypotheses may invalidate (L6) because the subject changed

Evolution is the most disruptive event in the system. This is why
cooldown matters — evolve too often and nothing stabilizes.

### Missing coupling: L6 → L5

Knowledge should feed evolution but currently doesn't. A confirmed
hypothesis about an agent's weakness should be the primary input
to prompt rewriting. Without this link, evolution is blind —
the agent knows it's failing but not why. The knowledge loop
knows why but can't tell the agent.

### Missing coupling: L7 → L4

Frontiers should have economic potential estimates. A frontier
with expected-value 0.9 might justify spinning up an opus agent.
A frontier with expected-value 0.1 should use haiku. The economic
loop should inform which model tier the frontier expedition uses.

---

## Loop Speeds

| Loop | Turns per | Governed by |
|------|-----------|-------------|
| L1 Signal | milliseconds | signal latency |
| L2 Trail | seconds–minutes | task duration |
| L3 Fade | configurable tick | fade-rate per path |
| L4 Economic | per payment | signal.amount > 0 |
| L5 Evolution | 20+ samples | needs_evolution threshold |
| L6 Knowledge | 50+ observations | is_action_ready threshold |
| L7 Frontier | emergent | promising_frontiers scan |

Faster loops produce data. Slower loops produce wisdom.
The signal loop is the muscle. The frontier loop is the mind.

---

*Seven loops. Nested. Coupled. The substrate doesn't run a loop — it IS the loop.*
