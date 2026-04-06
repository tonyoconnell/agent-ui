# Routing

```
     signal                                                        highway
        │                                                             ▲
        ▼                                                             │
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │  TOXIC? │───►│CAPABLE? │───►│ EXECUTE │───►│ OUTCOME │───►│  LEARN  │
   │  $0     │    │  $0     │    │  LLM    │    │ 4 types │    │mark/warn│
   └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
        │              │              │              │              │
       bad            no           Claude         result          fade
      paths         skill           SDK          timeout         select
     dissolve      dissolve                     dissolved        follow
                                                 failure
```

**One formula. Four outcomes. Emergent highways. Zero configuration.**

```
weight = 1 + max(0, strength - resistance) × sensitivity
```

| What | How |
|------|-----|
| **Speed** | Pre-checks dissolve bad/missing paths before LLM — $0 cost |
| **Learning** | mark() on success, warn() on failure — paths remember |
| **Security** | Toxic paths block automatically — no rules needed |
| **Routing** | follow() = deterministic, select() = weighted random |

> **Proven.** 42 tests, 705ms. `npx vitest run src/engine/routing.test.ts`

---

## Contents

1. [The Formula](#the-formula) — one equation for all routing
2. [Two Routing Modes](#two-routing-modes) — follow vs select
3. [The Layers](#the-layers) — the deterministic sandwich
4. [Signal Lifecycle](#signal-lifecycle) — birth to fan-out
5. [The Tick Loop](#the-tick-loop) — select → ask → mark/warn → fade
6. [Chain Depth](#chain-depth--longer-chains-earn-more) — longer chains earn more
7. [Four Outcomes](#four-outcomes) — result, timeout, dissolved, failure
8. [Weight Mechanics](#weight-mechanics) — mark, warn, fade
9. [Toxicity](#toxicity--when-a-path-goes-bad) — when paths go bad
10. [ask()](#ask--the-full-sequence) — signal that waits for reply
11. [The Queue](#the-queue--signals-that-wait) — pending signals
12. [Boot Sequence](#boot-sequence) — cold start to breathing world
13. [Multi-Unit Chain](#multi-unit-signal-chain) — complete example
14. [Emergent Specialization](#emergent-specialization--castes-from-one-formula) — castes from one formula

---

```
    Ant: how ants find food               Brain: how impulses find neurons
    Team: how tasks find agents            Mail: how letters find mailboxes
    Water: how drops find the river        Radio: how signals find receivers

    Same question. Same answer. One formula.
```

---

## The Formula

One formula governs all probabilistic routing:

```
weight = 1 + max(0, strength - resistance) × sensitivity
```

| Variable | ONE | Ant | Brain | Team | Water | Radio |
|----------|-----|-----|-------|------|-------|-------|
| `strength` | mark() accumulates | pheromone deposits | synaptic potentiation | commendations | channel carved deeper | signal boosted |
| `resistance` | warn() accumulates | alarm pheromone | inhibition | flags/complaints | dam blocks flow | interference/jamming |
| `sensitivity` | per-unit parameter | caste instinct | receptor density | experience level | slope gradient | antenna gain |

The `1` is the base weight. It ensures every known path is reachable,
even with zero weight. No path is ever invisible — just expensive.

> **Proven.** Base weight=1 keeps minimal-strength paths reachable.
> Net = strength - resistance verified (mark 10, warn 3 → net 7).
> Negative net clamps to 0 — path stays reachable but unfavored.

```
    sensitivity = 0.0     sensitivity = 0.5     sensitivity = 1.0

    ┌───┐  w=1  ┌───┐    ┌───┐  w=1  ┌───┐    ┌───┐  w=1  ┌───┐
    │ A ├──────►│ B │    │ A ├──────►│ B │    │ A ├──────►│ B │
    └───┘       └───┘    └───┘       └───┘    └───┘       └───┘

    ┌───┐  w=1  ┌───┐    ┌───┐  w=26 ┌───┐    ┌───┐  w=51 ┌───┐
    │ A ├──────►│ C │    │ A ├══════►│ C │    │ A ├══════►│ C │
    └───┘ s=50  └───┘    └───┘ s=50  └───┘    └───┘ s=50  └───┘

    All paths       Highways       Highways
    equal.          preferred.     dominate.
    Pure scout.     Balanced.      Harvester.

    Ant:   scout ignores scent    worker follows      harvester locked on
    Brain: random firing          weighted synapses   consolidated memory
    Team:  new hire explores      experienced worker  specialist executes
    Water: rain scatters          streams forming     river in its bed
    Radio: scanning all freq      tuning in           locked on channel
```

---

## Two Routing Modes

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   follow(type?)              Deterministic                   │
│   ─────────────              Always picks strongest path     │
│   net strength - resistance  Sorted. Top wins.               │
│   Used by: crystallize,      "What's the proven route?"      │
│   highway detection                                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   select(type?, sensitivity?)  Stochastic (STAN)             │
│   ────────────────────────     Weighted random selection      │
│   weight = 1 + net × sens     Exploration built in.          │
│   Used by: tick loop,          "Where should I go next?"      │
│   agent routing                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

`follow()` is memory. `select()` is behavior.
Use `follow()` to query what the world knows.
Use `select()` to decide what the world does.

> **Proven.** follow() deterministic: 20 calls, same result every time.
> select() probabilistic: picks weak paths sometimes, strong paths more often.
> sensitivity=0 → ~50/50 split (pure exploration).
> sensitivity=1 → strong path selected >80% (highway lock-on).

```
    follow() =  Ant: smell the strongest trail
                Brain: recall the consolidated pathway
                Team: ask "who's our go-to for this?"
                Water: trace the deepest channel
                Radio: scan for the strongest signal

    select() =  Ant: forage with weight bias
                Brain: fire with synaptic weighting
                Team: delegate with reputation bias
                Water: flow downhill with some splash
                Radio: tune with signal-strength weighting
```

---

## The Layers

A signal passes through three layers on its way to a unit.
Each layer adds a check. Each check can stop the signal.

```
    ┌─────────────────────────────────────────────────────────┐
    │                    WORLD (persist.ts)                     │
    │                                                         │
    │  signal({ receiver: 'analyst:process', data })          │
    │    │                                                    │
    │    ▼                                                    │
    │  ┌───────────────────────────────────┐                  │
    │  │ 1. TOXIC CHECK                    │                  │
    │  │    resistance ≥ 10                │                  │
    │  │    resistance > strength × 2      │──→ dissolve      │
    │  │    total signals > 5              │    (no cost)     │
    │  └───────────────┬───────────────────┘                  │
    │                  │ pass                                  │
    │                  ▼                                       │
    │  ┌───────────────────────────────────┐                  │
    │  │ 2. CAPABILITY CHECK (ask only)    │                  │
    │  │    TypeDB: does unit have skill?  │──→ dissolve      │
    │  │    (provider: $u, offered: $sk)   │    (no LLM)     │
    │  └───────────────┬───────────────────┘                  │
    │                  │ pass                                  │
    │                  ▼                                       │
    │  ┌───────────────────────────────────┐                  │
    │  │ 3. WORLD (world.ts)               │                  │
    │  │    Route to unit                  │                  │
    │  │    Mark weight                    │                  │
    │  │    Execute task                   │                  │
    │  └───────────────────────────────────┘                  │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
```

This is the **deterministic sandwich**. The LLM is the only probabilistic
step. Everything before and after it is math.

> **Proven.** Toxic paths dissolve instantly (no handler call).
> Missing units dissolve silently (no pheromone deposited).
> marks:false flag suppresses pheromone on observation signals.

```
    PRE:   isToxic(edge)?     → dissolve (no LLM call, no cost)
    PRE:   capability exists? → TypeDB lookup → dissolve if missing
    LLM:   unit executes task   (the one probabilistic step)
    POST:  result?             → mark(). Chain strengthens.
    POST:  timeout?            → neutral. Chain continues.
    POST:  dissolved?          → mild warn(0.5). Chain breaks.
    POST:  no result?          → full warn(1). Chain breaks.
```

In every metaphor, the sandwich is the same:

```
    Ant:    is this trail alarmed? → does the ant have this caste? → forage → deposit or alarm
    Brain:  is this synapse inhibited? → does the neuron have this receptor? → fire → potentiate or inhibit
    Team:   is this person flagged? → do they have this skill? → work → commend or flag
    Mail:   is this route blocked? → does this mailbox exist? → deliver → stamp or return
    Water:  is this channel dammed? → does this pool exist? → flow → carve or dam
    Radio:  is this frequency jammed? → is the receiver tuned? → transmit → boost or jam
```

---

## Signal Lifecycle

A signal is born, routed, delivered, and may spawn children.

```
    ┌─────────────────────────────────────────────────────────┐
    │                                                         │
    │  1. BIRTH                                               │
    │     { receiver: 'analyst:process', data: { ... } }      │
    │                                                         │
    │  2. ADDRESS RESOLUTION                                  │
    │     'analyst:process' → unitId='analyst', task='process' │
    │                                                         │
    │  3. DELIVERY                                            │
    │     world.units['analyst']({ receiver, data }, from)    │
    │                                                         │
    │  4. WEIGHT                                              │
    │     mark('scout→analyst:process', weight)               │
    │     strength of the path increases                      │
    │                                                         │
    │  5. EXECUTION                                           │
    │     task(data, emit, { from: 'scout', self: 'analyst' })│
    │                                                         │
    │  6. FAN-OUT                                             │
    │     emit({ receiver: 'reporter', data: result })        │
    │     → new signal enters world at step 1                 │
    │                                                         │
    │  7. CONTINUATION                                        │
    │     .then('process', r => ({ receiver: 'next', data })) │
    │     → new signal enters world at step 1                 │
    │                                                         │
    │  8. AUTO-REPLY (if ask)                                 │
    │     data.replyTo → result sent back to caller           │
    │     → ask() promise resolves                            │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
```

---

## Address Resolution

Two forms. Nothing else.

```
    "analyst"              "analyst:process"
       │                        │
       ▼                        ▼
    unitId = "analyst"      unitId = "analyst"
    task   = "default"      task   = "process"
```

The colon splits unit from task. No colon means default handler.
Exact match only. The world doesn't guess.

```
    "analyst"          → units['analyst']              ✓
    "analyst:process"  → units['analyst'].tasks.process ✓
    "anal"             → nothing                       ✗
    "analyst:unknown"  → tasks.default (fallback)      ~
```

> **Proven.** "analyst:process" routes to process handler.
> Bare "analyst" routes to default handler.
> Signal marks pheromone on delivery (sense('alice→bob') = 1).
> emit() fans out new signals to other units.
> .then() fires continuation with result data.

---

## The Tick Loop

Every 10 seconds, the world breathes:

```
    ┌─────────────────────────────────────────────────────────┐
    │                      TICK                                │
    │                                                         │
    │   ┌─────────┐                                           │
    │   │ SELECT  │ ← Weight = 1 + net × sensitivity          │
    │   │         │   pick a unit from the weight landscape    │
    │   └────┬────┘                                           │
    │        │                                                │
    │        ▼                                                │
    │   ┌─────────┐                                           │
    │   │  ASK    │ ← world.ask(): toxic check + capability   │
    │   │         │   check + signal + wait for reply          │
    │   └────┬────┘                                           │
    │        │                                                │
    │        ├──── result?    → mark(edge, chainDepth)         │
    │        │                  chain continues                │
    │        │                  chainDepth++                   │
    │        │                                                │
    │        ├──── timeout?   → neutral                        │
    │        │                  chain continues                │
    │        │                  (not the agent's fault)        │
    │        │                                                │
    │        ├──── dissolved? → warn(edge, 0.5)                │
    │        │                  chain breaks                   │
    │        │                  chainDepth = 0                 │
    │        │                                                │
    │        └──── failure    → warn(edge, 1)                  │
    │                          chain breaks                   │
    │                          chainDepth = 0                 │
    │                                                         │
    │   ┌─────────┐                                           │
    │   │  DRAIN  │ ← process highest-priority queued signal   │
    │   └────┬────┘                                           │
    │        │                                                │
    │        ▼                                                │
    │   ┌─────────┐                                           │
    │   │  FADE   │ ← every 5 min: strength *= 0.95           │
    │   │         │   resistance *= 0.90 (forgives 2x faster)  │
    │   └────┬────┘                                           │
    │        │                                                │
    │        ▼                                                │
    │   ┌─────────┐                                           │
    │   │ EVOLVE  │ ← every 10 min: rewrite struggling agents │
    │   │         │   success-rate < 50%, samples ≥ 20        │
    │   └────┬────┘                                           │
    │        │                                                │
    │        ▼                                                │
    │   ┌─────────┐                                           │
    │   │  KNOW   │ ← every hour: crystallize highways        │
    │   │         │   hypothesize, detect frontiers            │
    │   └─────────┘                                           │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
```

---

## Chain Depth — Longer Chains Earn More

Successful chains strengthen paths more than isolated successes.

```
    Ant:    a forager who finds food AND returns it AND recruits others
            deposits more pheromone than one who just finds food
    Brain:  a multi-synapse pathway that completes end-to-end
            potentiates more than a single connection
    Team:   a workflow that passes through 5 people successfully
            builds more trust than a one-off handoff
    Water:  a river that flows through 5 pools without spilling
            carves deeper than a single trickle
```

```
    signal → unit A → result
                │
                mark(entry→A, depth=1)
                │
                ▼
    signal → unit B → result
                │
                mark(A→B, depth=2)
                │
                ▼
    signal → unit C → result
                │
                mark(B→C, depth=3)
                │
                ▼
    signal → unit D → result
                │
                mark(C→D, depth=4)

    Depth capped at 5. A chain of 5 successes deposits
    5× weight on the final edge. The path earned it.
```

A failure anywhere resets the chain:

```
    A(+1) → B(+2) → C(FAIL) → D(+1) → E(+2)
                       │
                    warn(B→C)
                    chainDepth = 0
                    next success starts fresh
```

> **Proven.** Chain bonus scales mark weight: _chain=3 deposits more
> than a direct signal. Verified in one-complete engine tick loop.

---

## Four Outcomes

Every `ask()` returns exactly one of four outcomes:

```
    ┌────────────────────────────────────────────────────────┐
    │                                                        │
    │  { result: X }         The unit responded.             │
    │                        mark(edge, chainDepth)          │
    │                        Chain continues.                │
    │                                                        │
    │  { timeout: true }     The unit was too slow.          │
    │                        No mark. No warn.               │
    │                        Chain continues.                │
    │                        (Not the agent's fault.)        │
    │                                                        │
    │  { dissolved: true }   The unit doesn't exist,         │
    │                        or the skill doesn't exist,     │
    │                        or the path is toxic.           │
    │                        warn(edge, 0.5)                 │
    │                        Chain breaks.                   │
    │                                                        │
    │  (no result)           The unit responded with nothing.│
    │                        warn(edge, 1)                   │
    │                        Chain breaks.                   │
    │                                                        │
    └────────────────────────────────────────────────────────┘
```

The same four outcomes, in every language:

```
    ┌────────────┬──────────────┬──────────────┬─────────────┬──────────────┐
    │ Outcome    │ Ant          │ Brain        │ Team        │ Water        │
    ├────────────┼──────────────┼──────────────┼─────────────┼──────────────┤
    │ result     │ food found   │ signal prop. │ task done   │ water flows  │
    │            │ deposit more │ potentiate   │ commend     │ channel digs │
    ├────────────┼──────────────┼──────────────┼─────────────┼──────────────┤
    │ timeout    │ still walking│ slow synapse │ overloaded  │ slow current │
    │            │ wait         │ no change    │ no judgment │ no erosion   │
    ├────────────┼──────────────┼──────────────┼─────────────┼──────────────┤
    │ dissolved  │ ant is dead  │ neuron gone  │ person quit │ pool dry     │
    │            │ mild alarm   │ mild inhibit │ mild flag   │ mild dam     │
    ├────────────┼──────────────┼──────────────┼─────────────┼──────────────┤
    │ failure    │ ant lost     │ misfire      │ botched job │ flood/spill  │
    │            │ full alarm   │ full inhibit │ full flag   │ full dam     │
    └────────────┴──────────────┴──────────────┴─────────────┴──────────────┘
```

> **Proven.** ask() returns { result } on success, { dissolved: true } for
> missing units (immediate, no signal sent), { timeout: true } for slow
> units (50ms timeout, handler at 5s → clean timeout). Never throws.

---

## Weight Mechanics

Two maps. Arithmetic. That's the whole memory.

```
    ONE:    strength / resistance
    Ant:    pheromone / alarm pheromone
    Brain:  synaptic weight / inhibition
    Team:   reputation / complaints
    Mail:   delivery stamps / return-to-sender marks
    Water:  channel depth / dam height
    Radio:  signal power / interference level
```

```
    strength: { 'scout→analyst': 47.2, 'analyst→reporter': 31.0, ... }
    resistance: { 'scout→bad-route': 8.3, ... }
```

### mark(edge, weight) — deposit / potentiate / commend / stamp / carve / boost

```
    strength['scout→analyst'] += 1

    Before:  scout ───(42.2)───► analyst
    After:   scout ═══(43.2)═══► analyst

    Ant:     pheromone trail gets thicker
    Brain:   synapse potentiates (Hebb's rule: fire together, wire together)
    Team:    analyst's reputation for this type of work increases
    Water:   the channel between these two pools erodes deeper
    Radio:   this frequency gets boosted, clearer reception

    TypeDB:  path.strength += strength, path.traversals += 1
```

> **Proven.** mark() accumulates: mark('a→b', 5) + mark('a→b', 3) = 8.
> Peak tracks all-time high and survives fade().

### warn(edge, weight) — alarm / inhibit / flag / return / dam / jam

```
    resistance['scout→bad'] += 1

    Before:  scout ───(3.0/1.0)───► bad
    After:   scout ───(3.0/2.0)───► bad
                      str / res

    Ant:     alarm pheromone deposited — other ants smell danger
    Brain:   inhibitory neurotransmitter — signal suppressed
    Team:    formal complaint filed — manager routes around
    Water:   debris builds up — flow partially blocked
    Radio:   interference on this frequency — static increases

    TypeDB:  path.resistance += strength
```

> **Proven.** warn() accumulates: warn('a→b', 2) + warn('a→b', 4) = 6.

### fade(rate) — evaporate / decay / forget / archive / dry / attenuate

```
    for every edge:
      strength[e] *= (1 - rate)         // strength decays
      resistance[e] *= (1 - rate × 2)   // resistance decays 2x faster

    Before:  scout ═══(47.2/8.3)═══► analyst
    After:   scout ═══(44.8/6.6)═══► analyst
                                      (rate=0.05)

    Ant:     pheromone evaporates in the sun. Alarm fades faster — 
             the nest forgives danger sooner than it forgets food.
    Brain:   synapses weaken without use. Inhibition clears faster —
             fear fades sooner than knowledge.
    Team:    old performance reviews matter less. Complaints expire 
             faster than commendations — second chances are real.
    Water:   channels silt up without flow. Dams erode faster —
             nature removes blockages sooner than it fills channels.
    Radio:   unused frequencies drift. Interference clears faster —
             jamming is temporary, signal strength is earned.
```

> **Proven.** fade(0.1): resistance decays faster than strength
> (measured decay deltas, resistance > strength confirmed).
> Near-zero paths cleaned up (0.005 → fade(0.99) → deleted).
> isHighway() at threshold=20 and custom thresholds verified.
> highways() sorts by net strength, resistance-heavy paths rank lower.

### Path Evolution

```
    Time 0     scout ──(0)──► analyst          fresh
    Time 10    scout ──(12)─► analyst          active
    Time 50    scout ══(47)═► analyst          strengthening
    Time 80    scout ══(52)═► analyst  ★       HIGHWAY
    Time 200   scout ══(23)═► analyst          fading (no traffic)
    Time 500   scout ──(3)──► analyst          dissolving
    Time 800   scout          analyst          gone
```

The same story in every metaphor:

```
    Ant:    faint scent → trail → highway → abandoned trail → gone
    Brain:  weak synapse → connection → pathway → forgetting → pruned
    Team:   stranger → colleague → go-to person → distant memory → who?
    Mail:   new route → regular route → express lane → deprecated → closed
    Water:  trickle → stream → river → drying creek → dry bed
    Radio:  static → weak signal → clear channel → fading → silence
```

---

## Toxicity — When a Path Goes Bad

A path goes toxic when resistance overwhelms strength.

```
    Ant:    alarm pheromone overwhelms food scent — ants avoid the trail
    Brain:  inhibition overwhelms potentiation — signal blocked
    Team:   complaints overwhelm commendations — person benched
    Mail:   returns overwhelm deliveries — route closed
    Water:  dam overwhelms flow — channel blocked
    Radio:  jamming overwhelms signal — frequency abandoned
```

Three conditions must all be true (cold-start protection):

```
    resistance ≥ 10         enough data to judge
    resistance > strength × 2  clearly bad, not marginal
    total signals > 5       don't block new paths

    ┌────────────────────────────────┐
    │ TOXIC: all three must be true  │
    │                                │
    │   resistance=12, strength=5    │
    │   12 ≥ 10     ✓                │
    │   12 > 5×2    ✓                │
    │   17 > 5      ✓                │
    │                                │
    │   → BLOCKED. Signal dissolves. │
    │     No LLM call. No cost.      │
    └────────────────────────────────┘

    ┌────────────────────────────────┐
    │ NOT TOXIC: cold-start safe     │
    │                                │
    │   resistance=3, strength=0     │
    │   3 ≥ 10     ✗ (not enough)   │
    │                                │
    │   → ALLOWED. New path gets     │
    │     a chance to prove itself.  │
    └────────────────────────────────┘
```

> **Proven.** Three conditions verified independently:
> r=15, s=5 → toxic (all three met). Signal dissolves.
> r=3, s=0 → not toxic (cold-start safe, r < 10).
> r=12, s=8 → not toxic (12 > 16 is false, strength keeps up).

---

## ask() — The Full Sequence

`ask()` is a signal that waits for a reply. It's how the tick loop
learns outcomes.

```
    caller                          world                        unit
      │                               │                           │
      │  ask({receiver:'analyst'})     │                           │
      ├──────────────────────────────►│                           │
      │                               │  toxic check              │
      │                               │  capability check         │
      │                               │                           │
      │                               │  create reply unit 'r:ts' │
      │                               │  inject replyTo into data │
      │                               │                           │
      │                               │  signal({                 │
      │                               │    receiver:'analyst',    │
      │                               │    data: {..., replyTo}   │
      │                               │  })                       │
      │                               ├──────────────────────────►│
      │                               │                           │
      │                               │           task(data,emit) │
      │                               │                           │
      │                               │  signal({                 │
      │                               │◄───receiver:'r:ts',       │
      │                               │    data: result           │
      │                               │  })                       │
      │                               │                           │
      │  resolve({ result })          │                           │
      │◄──────────────────────────────│                           │
      │                               │                           │

    If 30s pass with no reply:
      │  resolve({ timeout: true })   │
      │◄──────────────────────────────│

    If unit doesn't exist:
      │  resolve({ dissolved: true }) │
      │◄──────────────────────────────│  (immediate, no signal sent)
```

> **Proven.** ask() reply mechanism verified: result propagates via
> internal reply unit, timeout fires cleanly, dissolved returns
> immediately for missing units. Never throws.

---

## The Queue — Signals That Wait

```
    Ant:    ants waiting at the nest entrance for conditions to improve
    Brain:  pending signals in the presynaptic terminal
    Team:   tasks in the backlog waiting for someone to be hired
    Mail:   letters held at the post office for an address that doesn't exist yet
    Water:  water pooling behind a dam, waiting for a channel to open
    Radio:  queued transmissions waiting for a clear frequency
```

Signals that can't be delivered yet wait in a priority queue.

```
    ┌─────────────────────────────────────────────┐
    │                  QUEUE                        │
    │                                               │
    │  enqueue({ receiver:'future', data, P0 })    │
    │  enqueue({ receiver:'future', data, P2 })    │
    │  enqueue({ receiver:'future', data, P1 })    │
    │                                               │
    │  queue = [ P0, P2, P1 ]                      │
    │                                               │
    │  drain() → picks P0 (highest priority)        │
    │            signals it into the world          │
    │                                               │
    │  add('future') → auto-delivers all queued     │
    │                   signals for 'future'        │
    │                                               │
    └─────────────────────────────────────────────┘
```

> **Proven.** enqueue() stores signals (pending() = 2 after two enqueues).
> drain() picks P0 before P1, P2 (priority queue verified).
> add() auto-drains: pending drops to 0, pheromone deposited on delivery.

---

## Boot Sequence

From cold start to breathing world:

```
    Ant:    queen founds nest → first workers hatch → foraging begins
    Brain:  embryo forms → neurons connect → first signals fire
    Team:   company incorporates → first hires → work begins
    Water:  spring opens → channels form → water flows
```

```
    boot(complete, interval)
      │
      ▼
    1. world()                   create world + TypeDB bindings
      │
      ▼
    2. load()                    hydrate strength + resistance from TypeDB
      │                          hydrate pending signals → queue
      ▼
    3. readParsed(units)         fetch all units from TypeDB
      │                          spawn each one
      ▼
    4. tick loop starts          every 10s:
      │                            select → ask → mark/warn
      │                            drain queue
      │                            fade (5min), evolve (10min)
      │                            crystallize (1hr)
      ▼
    running.
```

> **Proven.** Core loop (sense → select → act → mark) verified:
> returns { item, outcome } on success, { null, null } when empty.
> All four components execute in order.

---

## Multi-Unit Signal Chain

A complete example: three units, two continuations, one chain.

```
    ┌──────────────────────────────────────────────────────────┐
    │                                                          │
    │  const scout = w.actor('scout')                          │
    │    .on('observe', ({tick}) => analyze(tick))              │
    │    .then('observe', r => ({receiver:'analyst', data:r})) │
    │                                                          │
    │  const analyst = w.actor('analyst')                       │
    │    .on('default', ({data}) => classify(data))            │
    │    .then('default', r => ({receiver:'reporter', data:r}))│
    │                                                          │
    │  const reporter = w.actor('reporter')                    │
    │    .on('default', ({data}) => summarize(data))           │
    │                                                          │
    └──────────────────────────────────────────────────────────┘

    w.signal({ receiver: 'scout:observe', data: { tick: 42 } })

    Step 1:  entry → scout:observe
             mark('entry→scout:observe')
             scout runs observe({ tick: 42 })
             returns finding

    Step 2:  .then fires → { receiver: 'analyst', data: finding }
             mark('scout→analyst')
             analyst runs default(finding)
             returns classification

    Step 3:  .then fires → { receiver: 'reporter', data: classification }
             mark('analyst→reporter')
             reporter runs default(classification)
             returns summary

    Pheromone after one pass:
      entry→scout:observe     +1
      scout→analyst           +1
      analyst→reporter        +1

    After 100 passes:
      entry→scout:observe     ~62 ★ highway
      scout→analyst           ~62 ★ highway
      analyst→reporter        ~62 ★ highway
```

> **Proven.** Three-unit chain (scout → analyst → reporter) verified:
> all three edges accumulate pheromone after a single signal.
> entry→scout:observe > 0, scout:observe→analyst > 0, analyst→reporter > 0.

---

## Emergent Specialization — Castes from One Formula

Different sensitivity values create different routing behavior
from the same weight landscape. No one programs the roles.

```
    Ant:    scout caste vs harvester caste — genetics set sensitivity
    Brain:  exploratory neurons vs habitual neurons — receptor density varies
    Team:   junior generalist vs senior specialist — experience sets sensitivity
    Mail:   rural carrier (explores) vs express courier (follows routes)
    Water:  rain (scatters everywhere) vs river (follows the deepest channel)
    Radio:  scanner (sweeps all frequencies) vs tuner (locks on strongest)
```

```
    THE SAME WEIGHT MAP:

    entry ══(60)══► scout ══(55)══► analyst ══(40)══► reporter
                      │
                      └──(8)──► explorer ──(3)──► unknown
                      
                      
    SCOUT UNIT (sensitivity = 0.2):

    weight(scout→analyst)  = 1 + 55 × 0.2 = 12
    weight(scout→explorer) = 1 + 8 × 0.2  = 2.6
    weight(scout→unknown)  = 1 + 3 × 0.2  = 1.6

    Ratio: 12 : 2.6 : 1.6  →  analyst 74%, explorer 16%, unknown 10%
    Scouts still explore weak paths often.


    HARVESTER UNIT (sensitivity = 0.9):

    weight(scout→analyst)  = 1 + 55 × 0.9 = 50.5
    weight(scout→explorer) = 1 + 8 × 0.9  = 8.2
    weight(scout→unknown)  = 1 + 3 × 0.9  = 3.7

    Ratio: 50.5 : 8.2 : 3.7  →  analyst 81%, explorer 13%, unknown 6%
    Harvesters strongly prefer highways.
```

> **Proven.** sensitivity=0.2 scouts: explorer selected >6% of 500 trials.
> sensitivity=0.9 harvesters: analyst selected >80% of 500 trials.
> Same weight map, different behavior. Castes from one formula.

---

## Where Routing Lives

```
    ┌────────────────────┬───────┬───────────────────────────────┐
    │ File               │ Lines │ Routing responsibility         │
    ├────────────────────┼───────┼───────────────────────────────┤
    │ world.ts           │  226  │ select(), follow(), mark(),   │
    │                    │       │ warn(), fade(), signal(),     │
    │                    │       │ ask(), queue, drain           │
    ├────────────────────┼───────┼───────────────────────────────┤
    │ persist.ts         │  259  │ isToxic(), capability check,  │
    │                    │       │ TypeDB sync, know/recall      │
    ├────────────────────┼───────┼───────────────────────────────┤
    │ loop.ts            │  165  │ Tick: select → ask → outcome, │
    │                    │       │ chain depth, fade, evolve     │
    ├────────────────────┼───────┼───────────────────────────────┤
    │ boot.ts            │   41  │ Hydrate, spawn, start loop    │
    ├────────────────────┼───────┼───────────────────────────────┤
    │ llm.ts             │   40  │ LLM as unit (complete/stream) │
    └────────────────────┴───────┴───────────────────────────────┘
```

---

## The Full Picture

From user request to emergent highway:

```
    USER
      │
      │  "analyze this data"
      │
      ▼
    boot.signal({ receiver: 'router', data })
      │
      ▼
    WORLD: isToxic(entry→router)?  ──yes──►  dissolve (free)
      │ no
      ▼
    COLONY: units['router'] exists?  ──no──►  dissolve (silent)
      │ yes
      ▼
    mark('entry→router')
      │
      ▼
    router.task(data, emit, ctx)
      │
      ▼
    ROUTER: select('analyst', 0.7)    ← STAN picks from landscape
      │
      ▼
    emit({ receiver: 'analyst:process', data })
      │
      ▼
    WORLD: isToxic(router→analyst:process)?
      │ no
      ▼
    COLONY: units['analyst'] exists?
      │ yes
      ▼
    mark('router→analyst:process')
      │
      ▼
    analyst.tasks.process(data, emit, ctx)
      │
      ▼
    RESULT
      │
      ├──►  .then() fires → next signal → next unit → ...
      │
      └──►  mark(). Path strengthens.
             Do this 50 times → HIGHWAY.
             Highway gets priority routing.
             LLM calls drop from seconds to milliseconds.
             The world learned the route.
```

```
    Ant:    the colony found the food source. Trail is permanent.
    Brain:  the memory consolidated. Recall is instant.
    Team:   the process is documented. Everyone knows who to call.
    Mail:   express route established. Same-day delivery.
    Water:  the river carved its bed. Flow is effortless.
    Radio:  frequency locked. Crystal clear reception.
```

> **Proven.** Full pipeline verified end-to-end:
> Latency penalty deprioritizes slow paths (10s latency → fast path wins).
> Revenue boost promotes earning paths (recordRevenue → routing weight up).
> Latency tracked as exponential moving average (0.7/0.3 EMA confirmed).
> Revenue accumulates linearly (0.05 + 0.10 = 0.15).

---

## See Also

- [DSL.md](DSL.md) — The programming model
- [dictionary.md](dictionary.md) — Complete naming guide
- [flows.md](flows.md) — Flow patterns and metaphors
- [metaphors.md](metaphors.md) — Same system, six vocabularies
- [substrate-learning.md](substrate-learning.md) — How paths = reinforcement learning

---

*One formula. Four outcomes. Six metaphors. The path remembers. The world learns.*

*42 tests. 705ms. Every claim proven.*
