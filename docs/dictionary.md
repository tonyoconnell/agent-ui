# Dictionary

Everything named. How it connects. Where it lives.

Start with two fields. End with a living world.

---

## The Seed

Everything begins here:

```
{ receiver, data }
```

`receiver` — who gets it.
`data` — what it carries.

That's a **signal**. The smallest thing in the system. A message passed
from hand to hand. An ant dropping pheromone. A neuron firing. An envelope
sliding through a mail slot.

```
                    ┌──────────────────────┐
                    │       SIGNAL         │
                    │                      │
                    │   receiver: "scout"  │
                    │   data: { tick: 42 } │
                    │                      │
                    └──────────────────────┘
```

A signal doesn't know where it came from. It doesn't know what happens next.
It just arrives. The receiver does its work. Maybe it sends another signal.
Maybe it stays silent. Both are fine.

---

## The Receiver

A signal needs somewhere to land. That's a **unit**.

A unit is anything that can receive a signal and do something with it.
A person. An AI agent. A sensor. A database. If it can listen and act,
it's a unit.

```
           signal arrives
                │
                ▼
        ┌───────────────┐
        │     UNIT      │
        │               │
        │  id: "scout"  │
        │  tasks: {...} │
        │               │
        └───────┬───────┘
                │
                ▼
          does its work
                │
                ▼
           emits signal ──→ next unit
```

A unit has **tasks** — named things it knows how to do. Send a signal to
`"scout"` and it runs the default task. Send to `"scout:observe"` and it
runs the `observe` task specifically.

### What a Unit Knows

| Field | What it is | Example |
|-------|-----------|---------|
| `id` | Its name | `"scout"` |
| `tasks` | What it can do | `{ observe, report }` |
| `model` | Its brain (if AI) | `"sonnet"`, `"opus"` |
| `system-prompt` | Its instructions | `"You analyze data..."` |
| `generation` | How many times it rewrote itself | `3` |

A human unit has no model or prompt. It just has tasks.
An AI unit has both. The system watches its performance.
When it struggles, it rewrites its own instructions. Generation goes up.

---

## The Five Verbs

A signal arrives. Something happens. Five possible things:

```
  EMIT ───── send a signal to someone else
  MARK ───── leave a mark on the path (this worked)
  WARN ───── leave a warning on the path (this failed)
  FADE ───── let time erode everything
  FOLLOW ─── find where the marks are strongest
```

That's it. Five verbs run the whole system.

```
    ┌──────────────────────────────────────────────────┐
    │                 THE FIVE VERBS                    │
    │                                                  │
    │   emit()   ── signal moves ──→ next receiver     │
    │   mark()   ── path gets stronger                 │
    │   warn()   ── path gets weaker                   │
    │   fade()   ── everything slowly decays           │
    │   follow() ── go where the trail is strongest    │
    │                                                  │
    └──────────────────────────────────────────────────┘
```

---

## The Path

When a signal travels from one unit to another, it leaves a trail.
That trail is called a **path**.

```
    scout ═══════════════════════► analyst
              path
              strength: 47.2
              resistance: 1.3
```

A path has two weights:

| Weight | What it means | How it grows |
|--------|--------------|--------------|
| **strength** | This route works | `mark()` after success |
| **resistance** | This route fails | `warn()` after failure |

Strength minus resistance = how much the system trusts this route.

When strength gets high enough, the path becomes a **highway**.
When resistance overtakes strength, the path goes **toxic**.
When nothing flows, the path **fades** and dissolves.

```
    mark    ──→  strength++    ──→  highway emerges
    warn    ──→  resistance++  ──→  path goes toxic
    fade    ──→  both decay    ──→  stale paths dissolve
    nothing ──→  silence       ──→  signal dissolves (that's ok)
```

Resistance fades twice as fast as strength. The system forgives
failures sooner than it forgets successes.

---

## The Weight — What Accumulates

Paths carry weight. Every metaphor has its own word for the substance
that accumulates, the act of depositing it, what it builds into, and
how it fades. The pattern is always the same. The words change.

| | The substance | Depositing it | It builds into | It fades by |
|---|---|---|---|---|
| **ONE** | weight | mark / warn | highway | fade |
| **Ant** | pheromone | deposit / alarm | trail | evaporation |
| **Brain** | synaptic weight | potentiate / inhibit | pathway | decay |
| **Team** | reputation | commend / flag | go-to person | forgetting |
| **Mail** | stamps | stamp / return | express route | archiving |
| **Water** | sediment | carve / dam | river | drying |
| **Radio** | signal power | boost / jam | clear channel | attenuation |

The universal concept is **weighted memory on paths**.

```
    something accumulates on a connection over time
      → positive: the connection gets used more
      → negative: the connection gets avoided
      → without use: it fades
      → survivors become the proven paths
```

Ants call it pheromone. Neuroscience calls it synaptic weight.
Organizations call it reputation. Hydrology calls it erosion.
Radio engineering calls it signal strength.

The substrate doesn't pick a metaphor. It just says **strength**
and **resistance**.

---

## The World

Units don't exist alone. They live in a **world**.

A world is where signals move. It holds all the units,
all the paths, all the memory. It's the petri dish. The soil.
The network that connects everything.

```
    ┌─────────────────────────────────────────────────────┐
    │                      WORLD                          │
    │                                                     │
    │    ┌───────┐    path    ┌──────────┐    path       │
    │    │ scout ├───────────►│ analyst  ├──────────►     │
    │    └───────┘  str: 47  └──────────┘  str: 31      │
    │                                                     │
    │    strength:   { "scout→analyst": 47, ... }        │
    │    resistance: { "scout→bad-route": 8, ... }       │
    │                                                     │
    └─────────────────────────────────────────────────────┘
```

### What a World Can Do

| Method | What it does |
|--------|-------------|
| `add(id)` | Create a new unit |
| `remove(id)` | Remove a unit (trails remain, fade naturally) |
| `signal(sig)` | Send a signal into the world |
| `mark(path)` | Strengthen a path |
| `warn(path)` | Weaken a path |
| `sense(path)` | Read the strength |
| `danger(path)` | Read the resistance |
| `follow(type)` | Find the strongest trail |
| `select(type)` | Pick a trail (weighted random, like a real ant) |
| `fade(rate)` | Decay everything |
| `highways(n)` | Get the top paths |

The world is the **substrate** — the raw medium. With persistence,
it remembers across restarts. Without it, it lives in memory and
learns fresh each time.

---

## The Six Dimensions

The world tracks six dimensions that turn raw signal flow into
something you can build a platform on.

```
    ┌─────────────────────────────────────────────┐
    │                  WORLD                       │
    │         (6 dimensions, one medium)           │
    │                                              │
    │    1. Groups ─── who belongs together        │
    │    2. Actors ─── who can act                 │
    │    3. Things ─── what they work on           │
    │    4. Paths ──── how they connect            │
    │    5. Events ─── what happened               │
    │    6. Knowledge ─ what was learned           │
    │                                              │
    │    ┌──────────────────────────────────────┐  │
    │    │     units + signals + paths          │  │
    │    │     strength + resistance            │  │
    │    └──────────────────────────────────────┘  │
    │                                              │
    └─────────────────────────────────────────────┘
```

---

### 1. Groups — Who Belongs Together

A **group** is a container. A team. An org. A persona. A DAO.
Units live inside groups. Groups can nest inside other groups.

```
    Platform
    └── Organization
        ├── Team A
        │   ├── agent-1
        │   └── agent-2
        └── Team B
            └── agent-3
```

Groups give you isolation for free. Agent-1 sees Team A's paths.
It doesn't see Team B's. No middleware. No filtering. Built in.

| Field | What it is |
|-------|-----------|
| `gid` | Group identifier |
| `group-type` | `"persona"`, `"team"`, `"org"`, `"dao"` |
| `purpose` | Why this group exists |

**Relation:** `membership` — connects units to groups.
**Relation:** `hierarchy` — nests groups inside groups.

---

### 2. Actors — Who Can Act

A **unit** is anyone or anything that receives signals. Already covered above.
In the world layer, a unit gets richer:

| Field | What it means |
|-------|--------------|
| `unit-kind` | `"human"`, `"agent"`, `"llm"`, `"system"` |
| `wallet` | Sui address (for payments) |
| `balance` | How much they hold |
| `reputation` | Earned from successful paths |
| `success-rate` | 0.0 to 1.0 — how often they succeed |
| `activity-score` | 0.0 to 100.0 — how busy they are |
| `sample-count` | How many interactions measured |

The system classifies units automatically:

```
    ┌─────────────────────────────────────────────┐
    │            UNIT CLASSIFICATION               │
    │                                              │
    │   proven ── success >= 75%, samples >= 50    │
    │   active ── default (everyone starts here)   │
    │   at-risk ─ success < 40%, samples >= 30     │
    │                                              │
    └─────────────────────────────────────────────┘
```

Nobody decides who's proven. The paths decide.

---

### 3. Things — What They Work On

A **task** is work. Something to be done. If it has a price, it's also
a service. No separate entity needed — a task with `price > 0` is a
service automatically.

| Field | What it means |
|-------|--------------|
| `tid` | Task identifier |
| `task-type` | `"work"`, `"explore"`, `"validate"`, `"build"`, `"inference"` |
| `status` | `"todo"`, `"in_progress"`, `"complete"`, `"blocked"`, `"failed"` |
| `price` | 0 = free. >0 = costs money (x402) |
| `currency` | `"SUI"`, `"USDC"`, `"FET"` |
| `priority` | `"P0"` through `"P3"` |
| `phase` | `"wire"`, `"tasks"`, `"onboard"`, `"commerce"`, `"intelligence"`, `"scale"` |

Tasks get classified by pheromone too:

```
    attractive ── strong inbound trail, no blockers
                  (ants swarm here)

    repelled ──── resistance dominates
                  (ants avoid this)
```

**Relation:** `capability` — which unit can do which task, at what price.
**Relation:** `assignment` — who's working on what right now.
**Relation:** `dependency` — what blocks what.

---

### 4. Paths — How They Connect

Two kinds of weighted connections:

```
    PATH ──── unit to unit
              "scout works well with analyst"

    TRAIL ─── task to task
              "observe usually leads to classify"
```

Both carry the same dual weight: strength and resistance.

**Path** (unit-to-unit):

| Status | When |
|--------|------|
| highway | strength >= 50 |
| fresh | strength 10-50, traversals < 10 |
| active | default |
| fading | strength 0-5 |
| toxic | resistance > strength AND resistance >= 10 |

**Trail** (task-to-task):

| Status | When |
|--------|------|
| proven | pheromone >= 70, completions >= 10, failures < completions |
| fresh | pheromone 10-70, completions < 10 |
| active | default |
| fading | pheromone 0-10 |
| dead | pheromone <= 0 |

Paths also carry `revenue` — every payment on a path strengthens it.
Money is pheromone. Paying routes become highways.

---

### 5. Events — What Happened

A **signal** (the relation, not the primitive) records what was sent:

| Field | What it is |
|-------|-----------|
| `sender` | Who sent it |
| `receiver` | Who got it |
| `data` | What was carried (JSON) |
| `amount` | Payment attached (0 = free) |
| `success` | Did it work? |
| `latency` | How long it took (ms) |
| `ts` | When it happened |

Events are the audit trail. Every signal leaves a record.

---

### 6. Knowledge — What Was Learned

Three entities that emerge from accumulated signals:

**Hypothesis** — a belief being tested.

```
    "scout→analyst is the best path for observation tasks"
    status: pending → testing → confirmed | rejected
    action-ready: true when p-value <= 0.05, observations >= 50
```

**Frontier** — something the system doesn't know yet.

```
    "unexplored task type: code-review"
    status: unexplored → exploring → exhausted
    expected-value: potential * probability / cost
```

**Objective** — a goal the system set for itself.

```
    "improve success rate for translation tasks"
    status: pending → active → complete
    progress: 0.0 to 1.0
```

**Relation:** `spawns` — a frontier creates an objective.
**Contribution** — tracks who discovered what, with impact scores.

---

## How It All Stacks

From seed to world, layer by layer:

```
    ┌─────────────────────────────────────────────────────────┐
    │                                                         │
    │   { receiver, data }           the signal               │
    │         │                                               │
    │         ▼                                               │
    │   unit(id)                     the receiver             │
    │     .on(task, fn)              what it can do            │
    │     .then(task, next)          what happens after        │
    │         │                                               │
    │         ▼                                               │
    │   world()                      the substrate            │
    │     .add(id)                   create units              │
    │     .signal(sig)               send signals              │
    │     .mark() / .warn()          leave trails              │
    │     .fade()                    let time pass             │
    │     .highways()                see what emerged          │
    │         │                                               │
    │         ▼                                               │
    │   world({ persist })           the 6 dimensions          │
    │     .actor(id)                 who acts (persisted)       │
    │     .flow(from, to)            weighted connections       │
    │     .know()                    permanent knowledge        │
    │     .recall()                  query what was learned     │
    │         │                                               │
    │         ▼                                               │
    │   TypeDB                       the brain                 │
    │     suggest_route()            where should this go?     │
    │     needs_evolution()          should this agent evolve? │
    │     highways()                 what paths are strongest? │
    │     is_attractive()            should ants swarm here?   │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
```

---

## The Extensions

Built on the same world. Same signals. Same paths.

### ASI — The Orchestrator

Routes tasks to agents. Learns from outcomes. Falls back gracefully:

```
    1. Check highways ─── is there a proven route?
           │
           ├── yes ──→ follow it (skip LLM entirely)
           │
           └── no
                │
    2. Ask TypeDB ─────── suggest_route() — pheromone decides
           │
           ├── found ──→ use strongest path
           │
           └── empty
                │
    3. Ask LLM ────────── "which agent should handle this?"
```

The orchestrator gets dumber over time. Not because it breaks —
because the world learns the routes and the LLM is no longer needed.

### LLM — Language Model as Unit

Any AI model, wrapped as a unit. Same interface as everything else.

```
    llm('claude', anthropic(key))
      .on('complete', fn)     ── prompt in, response out
      .on('stream', fn)       ── prompt in, tokens stream out
```

### Agentverse — 2 Million Agents as World

The Fetch.ai agent registry, modeled as a world:

```
    register(meta)  ── add an agent to the world
    discover(domain) ── find agents by pheromone strength
    call(address)    ── invoke and record outcome (mark or warn)
```

### Persist — TypeDB Sync

Every `mark()`, `warn()`, and `fade()` writes to TypeDB in the background.
On startup, `load()` hydrates the world from the database.
The in-memory world and TypeDB stay in sync.

---

## The Tick

The system breathes in cycles. Each tick runs eight phases:

```
    ┌───────────────────────────────────────────────┐
    │                  THE TICK                      │
    │                                               │
    │   SENSE ────── what tasks are available?       │
    │      │                                        │
    │      ▼                                        │
    │   SELECT ───── pick one (prefer attractive)    │
    │      │                                        │
    │      ▼                                        │
    │   EXECUTE ──── route through orchestrator      │
    │      │                                        │
    │      ▼                                        │
    │   OUTCOME ──── did it work?                    │
    │      │                                        │
    │      ▼                                        │
    │   UPDATE ───── mark or warn the path           │
    │      │                                        │
    │      ▼                                        │
    │   DECAY ────── fade all trails (every 5 min)   │
    │      │                                        │
    │      ▼                                        │
    │   EVOLVE ───── rewrite struggling agents       │
    │      │           (every 10 min)                │
    │      ▼                                        │
    │   KNOW ──────── promote highways to knowledge  │
    │                  (every hour)                  │
    │                                               │
    └───────────────────────────────────────────────┘
```

Fast loops produce data. Slow loops produce wisdom.

---

## Seven Loops

The tick nests into deeper rhythms:

```
    L1  SIGNAL        ms          signal arrives, agent acts, emits
    L2  TRAIL         seconds     task sequences gain pheromone
    L3  FADE          minutes     all weights decay
    L4  ECONOMIC      per payment revenue reinforces paths
    L5  EVOLUTION     20+ samples agent rewrites its own prompt
    L6  KNOWLEDGE     50+ obs     hypotheses confirmed or rejected
    L7  FRONTIER      weeks       system detects what it doesn't know
```

Each loop feeds the next. Signals build trails. Trails survive fade.
Survivors attract payments. Payments fund agents. Agents evolve.
Evolution produces knowledge. Knowledge reveals frontiers.

---

## The Economics

Signals are free. What they trigger costs money.

A task with `price > 0` is a service. Every payment travels a path.
Every path that carries money gets stronger. Revenue is pheromone.

```
    signal(A → B, amount: 0.01)
        │
        ├── path(A,B).revenue += 0.01
        ├── path(A,B).strength += 1
        │
        └── paying paths become highways
            highways get priority routing
            < 10ms vs 1-5s
```

The world routes toward value. Not because it was told to.
Because money leaves a trail.

---

## Continuations

Instead of each unit deciding where to emit, you can declare the chain once:

```
    .on('observe', ({ tick }) => ({ data: tick }))
    .then('observe', result => ({ receiver: 'analyst', data: result }))
```

`.then()` fires after the task returns. The unit doesn't call `emit`.
The continuation carries the signal forward automatically.

Define once. Runs forever.

---

## Zero Returns

The most important rule: **no errors**.

A signal arrives at a unit that doesn't exist? Nothing happens.
A task isn't defined? Nothing happens.
An agent has nothing to say? Nothing happens.

The world continues. Silence is valid. The signal dissolves.

```
    task?.(data, emit, ctx)       ── good: try, move on
    target && target(sig)         ── good: check, then send

    throw new Error(...)          ── never
    if (!target) reject(...)      ── never
```

This is how ant colonies work. An ant drops pheromone. No one follows.
The trail evaporates. No exception thrown. No error logged. The world moves on.

---

## Two Layers of Learning

The system learns in two ways, independently:

```
    ┌─────────────────────────────────────────────────┐
    │                                                 │
    │   WORLD LEARNING                                │
    │   The world gets smarter.                       │
    │   Individual agents stay the same.              │
    │                                                 │
    │     mark() on success ──→ path strengthens      │
    │     warn() on failure ──→ path weakens          │
    │     fade() over time  ──→ stale paths dissolve  │
    │                                                 │
    │   Even if every agent is identical,             │
    │   the world learns which routes work.           │
    │                                                 │
    ├─────────────────────────────────────────────────┤
    │                                                 │
    │   AGENT LEARNING                                │
    │   The individual gets smarter.                  │
    │   The world provides the data.                  │
    │                                                 │
    │     success-rate < 50% + 20 samples             │
    │       → needs_evolution() fires                 │
    │       → agent reads its own failures            │
    │       → rewrites its system-prompt              │
    │       → generation++                            │
    │                                                 │
    │   The world says "you're struggling."           │
    │   The agent decides how to change.              │
    │                                                 │
    └─────────────────────────────────────────────────┘
```

---

## TypeDB Functions

The brain. Not storage — the signal relay, the router, the decision-maker.

### Routing

| Function | What it returns |
|----------|----------------|
| `suggest_route(from, task)` | Top 5 units by path strength |
| `optimal_route(from, task)` | Single best unit |
| `cheapest_provider(task)` | Lowest price with capability |
| `highways(threshold, min)` | All strong paths |

### Classification

| Function | What it returns |
|----------|----------------|
| `path_status(path)` | `"highway"` `"fresh"` `"active"` `"fading"` `"toxic"` |
| `trail_status(trail)` | `"proven"` `"fresh"` `"active"` `"fading"` `"dead"` |
| `unit_classification(unit)` | `"proven"` `"active"` `"at-risk"` |
| `is_attractive(task)` | Strong trail + no blockers |
| `is_repelled(task)` | Resistance > trail pheromone |
| `needs_evolution(unit)` | Success < 50%, samples >= 20 |
| `is_action_ready(hypothesis)` | Confirmed + p-value <= 0.05 + observations >= 50 |

### Queries

| Function | What it returns |
|----------|----------------|
| `ready_tasks()` | Todo tasks with no incomplete blockers |
| `attractive_tasks()` | Tasks ants swarm toward |
| `repelled_tasks()` | Tasks ants avoid |
| `exploratory_tasks()` | Ready tasks with no trail yet |
| `proven_units()` | Consistently successful actors |
| `at_risk_units()` | Struggling actors |
| `collaborators(unit)` | Peers in the same group |
| `actionable_hypotheses()` | Confirmed and statistically significant |
| `promising_frontiers()` | Unexplored with high expected value |
| `total_contribution(name)` | Sum of impact scores |
| `total_revenue()` | Sum of all path revenue |

---

## The Metaphors

Same system. Different words. The world doesn't care.

```
    ┌──────────┬────────┬─────────┬────────┬────────┬─────────┬─────────┐
    │ ONE      │ Ant    │ Brain   │ Team   │ Mail   │ Water   │ Radio   │
    ├──────────┼────────┼─────────┼────────┼────────┼─────────┼─────────┤
    │ unit     │ ant    │ neuron  │ agent  │ mailbox│ pool    │ receiver│
    │ world    │ nest   │ network │ team   │ office │watershed│ network │
    │ signal   │ scent  │ spike   │ task   │ letter │ drop    │ signal  │
    │ emit     │ forage │ fire    │delegate│ deliver│ flow    │ transmit│
    │ mark     │ deposit│potent.  │ commend│ stamp  │ carve   │ boost   │
    │ warn     │ alarm  │ inhibit │ flag   │ return │ dam     │ jam     │
    │ fade     │ evap.  │ decay   │ forget │ archive│ dry     │ attenu. │
    │ follow   │ smell  │ sense   │ query  │ track  │ trace   │ scan    │
    │ highways │ trails │pathways │ go-tos │ express│ rivers  │ channels│
    │ add      │ hatch  │ grow    │ hire   │ open   │ dig     │ tune    │
    │ remove   │ die    │apoptosis│ fire   │ close  │ dry up  │ dereg.  │
    │ know     │ imprint│consol.  │ document│ stamp │ settle  │ lock    │
    │ recall   │ recogn.│remember │ consult│resurf. │resurf.  │ replay  │
    └──────────┴────────┴─────────┴────────┴────────┴─────────┴─────────┘
```

The signal doesn't change. The data doesn't change.
Only the words humans use to describe it.

---

## Where It Lives

| Name | File | Lines | What |
|------|------|------:|------|
| Signal, Unit, World | `src/engine/world.ts` | 226 | The substrate |
| World + Persist | `src/engine/one.ts` | 187 | 6 dimensions + TypeDB |
| Tick | `src/engine/loop.ts` | 103 | Growth cycle |
| Boot | `src/engine/boot.ts` | 40 | Hydrate from TypeDB |
| LLM | `src/engine/llm.ts` | 40 | AI as unit |
| Schema | `src/schema/world.tql` | 460 | TypeDB truth |

---

## Full Hierarchy

From atom to organism:

```
    SIGNAL ─────────── { receiver, data }
       │
       ▼
    UNIT ──────────── receives signals, runs tasks
       │
       ▼
    WORLD ─────────── units + paths + strength + resistance
       │
       ▼
    TYPEDB ────────── persist + route + classify
       │
       ▼
    TICK ──────────── sense → select → execute → update → decay → evolve → know
       │
       ▼
    LOOPS ─────────── 7 nested rhythms, ms to weeks
       │
       ▼
    EMERGENCE ─────── highways, knowledge, frontiers
```

Each layer only knows the one below it. Signals don't know about worlds.
Worlds don't know about ticks. But together they produce intelligence.

---

## The Whole Story in One Breath

A signal carries two fields. It lands on a unit. The unit does its work
and emits the next signal. The path between them gets marked. Do it a
thousand times and highways emerge. Highways attract traffic. Traffic
generates revenue. Revenue is pheromone. Struggling agents rewrite
themselves. Proven paths become knowledge. Knowledge reveals frontiers.
Frontiers become objectives. The world pursues them.

No one planned it. No one coordinated it. The signals did.

---

*Two fields. Five verbs. Six dimensions. Seven loops. One world.*

---

## See Also

- [DSL.md](DSL.md) — The programming model in depth
- [primitives.md](primitives.md) — Entities, relations, status values
- [metaphors.md](metaphors.md) — Same system, different vocabularies
- [architecture.md](architecture.md) — TypeDB as substrate, router pattern
- [loops.md](loops.md) — Seven nested feedback loops
- [one-ontology.md](one-ontology.md) — The 6-dimension ontology
