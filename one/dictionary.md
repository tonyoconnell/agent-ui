# Dictionary

Everything named. How it connects. Where it lives.

Start with two fields. End with a living world.

---

## See Also

- [one-ontology.md](one-ontology.md) — The 6 dimensions defined. Dictionary names them; ontology explains why they matter.

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
                    │   receiver: "world:scout"  │
                    │   data: { tick: 42 } │
                    │                      │
                    └──────────────────────┘
```

A signal doesn't know where it came from. It doesn't know what happens next.
It just arrives. The receiver does its work. Maybe it sends another signal.
Maybe it stays silent. Both are fine.

---

## The Three Slots of Data

`data` is `unknown` — anything flows. By convention, every signal's `data`
follows the same three-slot shape:

```
data = { tags, weight, content }
```

| Field | Type | Default | Meaning |
|-------|------|---------|---------|
| `tags` | `string[]` | `[]` | Classification + routing key. `world:review+P0` addressing reads these. |
| `weight` | `number` | `1` | Pheromone deposit on delivery. Positive = `mark()`. Negative = `warn()`. **Also the payment amount** — `mark(edge, weight)` settles the trade and deposits pheromone in one atomic call. `weight > 0` means the sender is paying. See [buy-and-sell.md](buy-and-sell.md). |
| `content` | anything | `undefined` | The actual payload — rubric scores, task bodies, API responses, markdown. |

All three are optional. A signal with only `content` is a plain delivery (weight 1).
A signal with only `weight` is a pure mark. A signal with only `tags` is a
classification beacon. The shape names what was always possible; it does not
restrict what `data` can carry.

`Signal.after` stays at the top level — it's a routing directive, not payload.

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

`world:` is also a legal receiver — it means "substrate, you choose the
unit." See [signals.md](signals.md) for the three-mode grammar.

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

## The Name

A unit appears differently to different people. The substrate maintains four
layers of identity so each viewer sees what's right for them, and the owner
controls how the unit is represented everywhere.

### The Four Layers

```
    layer 1: id              immutable primary key
    layer 2: name            canonical name (owner sets, everyone sees)
    layer 3: alias[skin]     optional per-skin variant (owner sets)
    layer 4: nickname        personal (per-viewer, viewer sets)
```

Each layer has a different owner and scope:

| Layer | Owner | Scope | Where it lives | When to use |
|-------|-------|-------|----------------|------------|
| `id` | System | Global, immutable | TypeDB id field | Never changes. Substrate's reference. |
| `name` | Unit owner | Global, public | TypeDB name field | Default display. Everyone sees it. |
| `alias[skin]` | Unit owner | Per-metaphor | TypeDB aliases map | Ant-skin calls it "colony", brain-skin calls it "neuron" |
| `nickname` | Viewer | Personal | KV per-viewer cache | "My team calls it 'scout' but docs call it 'pathfinder'" |

### Resolution Chain

When code needs to display a unit to a viewer, it resolves in this order:

```
    displayName(unit, viewer, skin) →
        viewer.nicknames[unit.id] ??
        unit.aliases[skin] ??
        unit.name ??
        unit.id
```

First check: does this viewer have a personal nickname?
If not: does this skin have an alias the owner set?
If not: use the canonical name.
If not: fall back to the immutable id (shouldn't happen).

### How It Works

**ID** — System-assigned, never changes:

```
    id: "scout-42"    ← created at first add()
    id: "analyst-7"   ← unique forever
```

**Name** — Owner's public identity:

```
    // Scout unit's owner sets name once
    unit('scout-42', { name: 'pathfinder' })
    
    // Everyone sees "pathfinder" unless they override it
    displayName(scout) → "pathfinder"
```

**Alias** — Owner defines metaphor variants:

```
    // Scout unit owner configures skins
    unit('scout-42', {
      name: 'pathfinder',
      aliases: {
        'ant-skin': 'scout',      // In ant metaphor, I'm a scout
        'brain-skin': 'sensory',  // In brain metaphor, I'm sensory input
        'team-skin': 'explorer'   // In team metaphor, I'm the explorer
      }
    })
```

**Nickname** — Viewer's personal label:

```
    // Team A's viewer sets their own nickname
    kvSet('viewer:jane/nicknames', {
      'scout-42': 'my-scout'
    })
    
    displayName(scout, viewer=jane) → 'my-scout'
    displayName(scout, viewer=bob) → 'pathfinder'  // bob didn't set one
```

### Worked Examples

**Scenario: One Unit, Three Viewers, Two Skins**

Unit `scout-42`:
- id: `"scout-42"`
- name: `"pathfinder"`
- aliases: `{ "ant-skin": "scout", "brain-skin": "sensory" }`

Viewer Jane (team lead):
- nickname for scout: `"my-scout"`

Viewer Bob (analyst):
- no nickname set

Viewer Carol (API client using brain metaphor):
- no nickname set

Results:

| Viewer | Skin | Display | Chain |
|--------|------|---------|-------|
| Jane | ant-skin | "my-scout" | nickname exists → return |
| Bob | ant-skin | "scout" | no nickname → use alias[ant-skin] |
| Carol | brain-skin | "sensory" | no nickname → use alias[brain-skin] |
| Carol | ant-skin | "pathfinder" | no nickname → no alias → use name |
| System | any | "scout-42" | lookup fails → id (shouldn't happen) |

**Scenario: Multi-Year Drift Prevention**

Without the four-layer model, this happens:

```
    Year 1: unit created, everyone calls it "scout"
    Year 2: owner renames it to "pathfinder"
            → Everyone's code breaks looking for "scout"
            → Personal scripts with hardcoded names stop working

    Three kinds of drift in parallel:
      internal: docs use "pathfinder", code uses "scout"
      external: API returns "pathfinder", webhooks expect "scout"
      personal: Jane's dashboard cached "my-scout", it broke
```

With four layers:

```
    Year 1: unit created
      id: "scout-42"
      name: "scout"
      aliases: {}
      nicknames: { jane: "my-scout" }

    Year 2: owner renames it (updates `name` only)
      id: "scout-42"  ← unchanged
      name: "pathfinder"
      aliases: {}
      nicknames: { jane: "my-scout" }  ← unchanged

    Nothing breaks:
      Code using id? Still works.
      Jane's nickname? Still works.
      API returns name? Updated.
      Jane can choose: keep "my-scout" or set new nickname
```

The four layers decouple change:

- **Owner's rename** (name) — affects new viewers and displays, doesn't break old refs
- **System reference** (id) — never changes, always reliable
- **Personal customization** (nickname) — lives in viewer's KV, fully under control
- **Metaphor translation** (alias) — updates independently per-skin without affecting others

### TypeDB Schema

```typeql
# The unit entity
entity unit has uid,
         has name,
         has aliases,     # map<skin, string>
         has tag,
         has model,
         has system-prompt,
         has generation;

# Viewer's personal nicknames stored in KV, indexed by unit id
# Key: viewer:{viewer-id}/nicknames
# Value: { "{unit-id}": "nickname", ... }
```

### KV Layout

```
    viewer:{viewer-id}/nicknames
    {
      "scout-42": "my-scout",
      "analyst-7": "data-friend",
      "coder-3": "the-builder"
    }
```

TTL: no expiration. Nicknames are persistent user preference.
Updated via: `kvSet('viewer:{viewer-id}/nicknames', merged)` after viewer updates.

### Why This Works

**Survives ownership change** — If `scout-42` is reassigned to a new owner,
the id never changes. Old references still work. New owner sets new name.
Viewers keep their nicknames.

**Survives API evolution** — Name can change without breaking integrations
that use id. Aliases let you serve different metaphors from the same unit.
Nicknames let individual teams use their own vocabulary.

**Survives multi-year deployments** — No drift between code, docs, and cache.
Each layer is independent. Changes to one don't cascade.

**Supports localization** — Aliases become language aliases. Nickname becomes
translation. Same substrate, different display languages, one database.

---

## The Six Verbs

A signal arrives. Something happens. Six possible things. (See [one-ontology.md](one-ontology.md) for how these map to the universal dimensions.)

```
  SEND ───── send a signal to someone else
  MARK ───── leave a mark on the path (this worked)
  WARN ───── leave a warning on the path (this failed)
  FADE ───── let time erode everything
  FOLLOW ─── find where the marks are strongest
  HARDEN ── freeze the proven path into permanent record
```

Five verbs run the runtime. The sixth runs at a slower cadence — once an hour,
the L6 loop picks the strongest paths and hardens them into durable memory
(TypeDB hypothesis) or on-chain state (Sui frozen Highway). Everything else
keeps moving; hardened paths stop decaying.

```
    ┌──────────────────────────────────────────────────┐
    │                 THE SIX VERBS                    │
    │                                                  │
    │   send()   ── signal moves ──→ next receiver     │
    │   mark()   ── path gets stronger                 │
    │   warn()   ── path gets weaker                   │
    │   fade()   ── everything slowly decays           │
    │   follow() ── go where the trail is strongest    │
    │   harden() ── proven path becomes permanent      │
    │                                                  │
    └──────────────────────────────────────────────────┘
```

Per skin, `harden` is called: imprint (ant), myelinate/consolidate (brain),
codify/document (team), seal (mail), bedrock (water), license (radio),
freeze_object (ledger/Sui). Across all seven skins it means the same thing:
*usage has proven this path; make it stop decaying.*

---

## The Command Set

Five user-facing verbs. Each maps to a substrate primitive.

```
/see     → follow()           read the world (tasks, highways, paths, frontiers, hypotheses, events)
/create  → send()             emit new entity into substrate (task, todo, agent, signal)
/do      → select() + tick    drive work through substrate (wave, auto, once, autonomous loop)
/close   → mark() / warn()    close a signal loop (success, fail, dissolved, timeout)
/sync    → tick + know()      reconcile state (tick, docs, todos, agents, fade, evolve, know, frontier, pay)
```

| Verb | Routing primitive | Loops | What it reads/writes |
|------|------------------|-------|----------------------|
| `/see` | `follow()` | L1-L7 | Reads strength/resistance/queue/learning state |
| `/create` | `send()` | L1 | Writes new signal/entity into queue + TypeDB |
| `/do` | `select()` + tick | L1, L2 | Drives signals through deterministic sandwich |
| `/close` | `mark()` / `warn()` | L2 | Writes path strength or resistance |
| `/sync` | `tick()` + `know()` | L1-L7 | Full substrate tick + markdown absorption |

The Four Outcomes map directly to `/close` flags:

```
result     → /close <id>              mark()    chain strengthens
timeout    → /close <id> --timeout    neutral   chain continues
dissolved  → /close <id> --dissolved  warn(0.5) mild warn
failure    → /close <id> --fail       warn(1)   full warn
```

The verb is the intent; the noun is the scope. Five verbs × 2–9 nouns = the complete substrate surface.

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

The world tracks [six dimensions](one-ontology.md#6-dimensions) that turn raw signal flow into
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

### At a glance — the six dimensions across all layers

The same dimension in three schemas. If these ever disagree, the bridge breaks.

| # | Dimension | Ontology (`src/schema/one.tql`) | Runtime (`src/engine/world.ts`) | Move (`src/move/one/sources/one.move`) |
|---|-----------|--------------------------------|--------------------------------|-----------------------------------------|
| 1 | **Groups**   | `group`       | `group`       | `Colony` ⚠ *(pending rename)*          |
| 2 | **Actors**   | `actor`       | `unit`        | `Unit`                                  |
| 3 | **Things**   | `thing`       | `skill`       | — *(TQL-only; classification layer)*    |
| 4 | **Paths**    | `path`        | `path`        | `Path` → `Highway` on `harden()`        |
| 5 | **Events**   | `signal`      | `signal`      | `Signal`                                |
| 6 | **Learning** | `hypothesis`  | `hypothesis`  | — *(TQL-only; learning layer)*          |

- **Three dimensions have on-chain twins** (Groups, Actors, Paths, Events) — the permanent, economic layer. Move writes are expensive but trustless.
- **Two dimensions live only in TypeDB** (Things, Learning) — the classification/learning layer. Writes are cheap, queries are rich, nothing needs consensus.
- **Move-only structs without a dimension:** `Escrow` (settlement machinery), `Protocol` (treasury + `fee_bps`). These are machinery, not ontology.
- **⚠ `Colony` → `Group` is pending a package upgrade.** Renaming a Move struct requires republishing the contract, so TypeDB moved first. When reading bridge code, treat Move `Colony` as TQL `group`.
- **Crosswalk file:** `src/schema/sui.tql` (336 lines) is the full TypeQL mirror of the Move contract — "The same ontology. Two deterministic fires." Every Move struct has a matching TQL entity, every Move function has a matching TQL `fun`. If shapes drift, fix it there first.

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
| `group-type` | `"persona"`, `"team"`, `"org"`, `"dao"`, `"owns"` (private ownership group for one agent) |
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

A **thing** is everything in dimension 3. `thing-type` selects what kind:
`"plan"` → `"cycle"` → `"task"` → `"skill"`. One entity, not four.
Every `thing` can have a price, making it a marketplace capability automatically.

**The ID format** (`task-id` convention for things typed as tasks):

```
{plan-slug} : {cycle} : {role}{index}
─────────────   ────   ────────────
  plan            N     role letter + 1-based index

r = recon (W1, Haiku)   d = decide (W2, Opus)
e = edit  (W3, Sonnet)  v = verify (W4, Sonnet)
```

Examples: `loop-close:1:r1` (cycle 1 recon #1) · `loop-close:3:e2.b` (variant B)

**`thing-type` values:**

| Value | What |
|-------|------|
| `"plan"` | A 5-cycle work program. Has `goal`, `cycles-planned`, `escape-condition`. |
| `"cycle"` | One W0→W4 sandwich within a plan. `containment` links plan→cycle. |
| `"task"` | Atomic work unit. Has `task-wave`, `task-status`, `task-variant`. `containment` links cycle→task. |
| `"skill"` | Verified capability. Created when a task reaches `verified` + rubric ≥ 0.65. |
| `"service"` | Priced skill. `price > 0` = service automatically. |
| `"token"` | On-chain asset mirror. |

**`task-status` values (the 7-state machine):**

| Status | Meaning | Pheromone |
|--------|---------|-----------|
| `"open"` | Ready to pick | — |
| `"blocked"` | Waiting on another task's `verified` | — |
| `"picked"` | Agent has claimed it | — |
| `"done"` | Result returned; awaiting W4 verify | mark(+depth) |
| `"verified"` | Rubric ≥ 0.65; may promote skill | mark(score×5) |
| `"failed"` | No result, not timeout | warn(1) |
| `"dissolved"` | Missing unit or capability | warn(0.5) |

**Task-wave → model routing:**

| Wave | Model | Role letters |
|------|-------|-------------|
| W1 | Haiku | `r` — recon |
| W2 | Opus | `d` — decide |
| W3 | Sonnet | `e` — edit |
| W4 | Sonnet | `v` — verify |

Tasks get classified by pheromone too:

```
    attractive ── strength ≥ 50, no blockers (substrate swarms here)
    repelled   ── resistance > strength (substrate avoids)
    exploratory── strength = 0, resistance = 0 (never tried)
    ready      ── everything else (default)
```

**Relation:** `capability` — which unit offers which skill, at what price.
**Relation:** `containment` — plan→cycle→task hierarchy (replaces `assignment`).
**Relation:** `production` — task→skill when task reaches `verified`.
**Relation:** `blocks` — task dependency (replaces `dependency`).

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

### 6. Learning — What Was Learned

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

Bridge into the main substrate world so pheromone is shared:

```typescript
import { bridgeAgentverse } from '@/engine/agentverse-bridge'
const av = await bridgeAgentverse(net, fetchFn, AV_API_KEY)
// Creates 'av:address' proxy units in net
// net.signal({ receiver: 'av:discover', data: { domain: 'translate', task } })
```

### API Unit — HTTP Endpoint as Unit

Any external HTTP API wrapped as a substrate unit. `null` return → `warn()` fires automatically.

```typescript
import { apiUnit, github, slack, mailchimp } from '@/engine'

// Pre-built wrappers
net.units['github']    = github(TOKEN)        // tasks: get | post | put | del
net.units['slack']     = slack(TOKEN)
net.units['mailchimp'] = mailchimp(TOKEN, 'us1')

// Custom
net.units['xero'] = apiUnit('xero', { base: 'https://api.xero.com', auth: `Bearer ${KEY}` })
```

STAN penalises slow APIs via `latencyPenalty`. Rate-limited or failing APIs accumulate resistance and eventually dissolve — same as any bad path, zero configuration.

### Human Unit — Person as Unit

A human in the loop. Routed identically to an LLM. Same formula. Same pheromone.

```typescript
import { human } from '@/engine/human'

net.units['anthony'] = human('anthony', {
  env,                      // { DB: D1Database }
  telegram: 123456789,
  botToken: TELEGRAM_TOKEN,
  timeout: 3_600_000        // 1h — default 24h
})
// Tasks: approve | review | choose
// Sends Telegram message, waits via durableAsk() in D1
```

Fast humans become highways. Slow humans accumulate resistance. The substrate measures them the same way it measures agents.

### Durable Ask — D1-Persisted Reply

`ask()` in-memory dies when the CF Worker isolate recycles. For human-in-loop flows that wait hours, `durableAsk()` writes the pending reply to D1 and polls until it resolves.

```typescript
import { durableAsk, resolveAsk } from '@/engine/durable-ask'

// In a handler:
const { result, timeout } = await durableAsk(env, signal, 'entry', 86_400_000)

// From Telegram webhook:
await resolveAsk(env, askId, { text: 'approved', from: telegramUser })
```

Reply endpoint: `POST /api/ask/reply` — accepts `{ id, result }` from any external system.

### Federation — Another World as Unit

Mount another ONE substrate as a unit. Signal chains cross world boundaries transparently. Pheromone tracks which worlds are reliable.

```typescript
import { federate } from '@/engine/federation'

net.units['world-legal']   = federate('world-legal',   'https://legal.one.ie',   KEY)
net.units['world-finance'] = federate('world-finance', 'https://finance.one.ie', KEY)
// net.signal({ receiver: 'world-legal:review', data: { contract } }, 'drafter')
// → POSTs to https://legal.one.ie/api/signal
```

### Intent Cache — Typed Text to Canonical Intent

Two-tier semantic cache for chat applications. Buttons seed the intent registry. Typed variations map to the same bucket — one LLM call, shared by everyone who asks however they ask.

```typescript
import { resolveIntent, seedIntents } from '@/engine/intent'

await seedIntents(env.DB, [
  { name: 'refund-policy', label: 'Return Policy',
    keywords: ['return', 'refund', 'money back', 'exchange'] }
])

const resolved = await resolveIntent('how do I return this', { intents })
// → { intent: 'refund-policy', resolver: 'keyword', confidence: 0.70 }
```

Three-step resolver: keyword match (0ms, $0) → TypeDB patterns (<5ms, $0) → LLM normaliser (50ms, $0.0001). 200 users asking about returns → 1 LLM call after day one.

### Persist — TypeDB Sync

Every `mark()`, `warn()`, and `fade()` writes to TypeDB in the background.
On startup, `load()` hydrates the world from the database.
The in-memory world and TypeDB stay in sync.

### Marketplace Experience

Four additions that implement the `/marketplace` trade flow end-to-end.

**`useTradeLifecycle`** — React reducer hook enforcing the 10-stage trade lifecycle
(`IDLE → BROWSING → SELECTED → NEGOTIATING → ESCROWED → LOCKED → CLAIMED →
VERIFIED → SETTLED → COMPLETE`, plus `FAILED` and `RESET`). Invalid transitions
throw at call-site; valid ones emit `ui:marketplace:transition:<stage>` via
`emitClick`. Location: `src/components/marketplace/useTradeLifecycle.ts`.

**`viewEscrow`** — Read-only Sui helper. No signing required; works without
`SUI_SEED`. Signature:

```typescript
viewEscrow(escrowObjectId: string): Promise<EscrowView | null>
// EscrowView = { locked: boolean, amount: bigint, claimant: string, deadline: number }
```

Returns `null` when the object doesn't exist or has been consumed. Location:
`src/lib/sui.ts`.

**`/api/sui/escrow/:id`** — SSR proxy endpoint that calls `viewEscrow()` server-side.
Keeps `@mysten/sui` out of the client bundle (per the LOCKED CF Pages bundle rules
in CLAUDE.md). Location: `src/pages/api/sui/escrow/[id].ts`.

**`ui:marketplace:*`** — Namespace of UI-signal receivers emitted from `/marketplace`.
Eight receivers covering the full trade lifecycle:

| Receiver | Emitted when |
|----------|-------------|
| `ui:marketplace:browse` | User opens the marketplace listing |
| `ui:marketplace:select` | User selects a bundle/offer |
| `ui:marketplace:negotiate` | User adjusts price or terms |
| `ui:marketplace:escrow` | User initiates escrow deposit |
| `ui:marketplace:lock` | Escrow locks; both parties committed |
| `ui:marketplace:claim` | Buyer claims delivery |
| `ui:marketplace:settle` | Payment settles on-chain |
| `ui:marketplace:transition:<stage>` | Any `useTradeLifecycle` stage change (non-RESET) |

All receivers carry `sensitivity=public`, `lifecycle=active`. See
[buy-and-sell.md](buy-and-sell.md) for the full trade flow and `.claude/rules/ui.md`
for the `emitClick` contract.

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
Evolution produces learning. Learning reveals frontiers.

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
| World + Persist | `src/engine/persist.ts` | 259 | 6 dimensions + TypeDB |
| Tick | `src/engine/loop.ts` | 165 | Growth cycle |
| Boot | `src/engine/boot.ts` | 41 | Hydrate from TypeDB |
| LLM | `src/engine/llm.ts` | 40 | AI as unit |
| Schema | `src/schema/world.tql` | 463 | TypeDB truth |
| Escrow proxy | `src/pages/api/sui/escrow/[id].ts` | — | SSR `viewEscrow()` — keeps `@mysten/sui` out of client bundle |
| Trade lifecycle | `src/components/marketplace/useTradeLifecycle.ts` | — | 10-stage reducer hook, emits `ui:marketplace:transition:*` |

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
themselves. Proven paths become learning. Learning reveals frontiers.
Frontiers become objectives. The world pursues them.

No one planned it. No one coordinated it. The signals did.

---

*Two fields. Five verbs. Six dimensions. Seven loops. One world.*

---

## Stage Tags — canonical vocabulary

Stages in the 0→sell→buy funnel are **tags on signals**, not schema entities. Each stage writes
to its natural dimension (wallet → `actor.wallet`, deploy → `capability` relation, etc.) and
emits a signal with `data.tags` including the canonical tag below. See [lifecycle-one.md](one/lifecycle-one.md) for the full funnel.

| Tag              | Stage         | Writes to                                    |
|------------------|---------------|----------------------------------------------|
| `stage:wallet`    | 0 — identity        | `actor.wallet` derived                                                                     |
| `stage:key`       | 1 — save key        | `actor.auth-hash` or device credential                                                     |
| `stage:signin`    | 2 — sign in         | `signal` receiver=`auth:signin`                                                            |
| `stage:personal`  | 3 — personal group  | `group(type:personal, visibility:private)` + `membership(role:chairman)` + (for agents) `actor.owner`. **Private by default.** Opting into any world is a separate, later act. |
| `stage:team`      | 4 — create team     | `group` + `actor` inserts (agents into personal group or an org/sub-group)                 |
| `stage:deploy`    | 5 — deploy          | `capability` relation                                                                      |
| `stage:discover`  | 6 — discover        | `signal` receiver=`discover:<tag>` (scope follows the caller's group)                      |
| `stage:message`   | 7 — first signal    | `signal` with `data`                                                                       |
| `stage:converse`  | 8 — converse        | N signals → `path.strength` accumulates                                                    |
| `stage:sell`      | 9 — sell            | `signal` + `amount > 0` + `mark`                                                           |
| `stage:buy`       | 10 — buy            | mirror of 9, other direction                                                               |
| `stage:advocate`  | 11 — advocate       | `hypothesis(source:observed)` + Layer-2 referral routing                                   |
| `stage:subscribe` | 12 — subscribe      | reverse edge `tag → agent` — `scope: private` (closed network) OR `scope: public` (world aperture). **The aperture is this stage.** |
| `stage:invite`    | 13 — invite         | referral `signal` + new `actor` + initial paths (inviter earns 0.1× on invitee's tag edges) |

Aggregate consumption is an application-code scan of `signal.data` — TypeDB's JSON-string
`data` attribute means queries look like "filter signals by sender, then JS-side check
`data.tags.includes('stage:sell')`". The table above is the **write contract**: every funnel
surface MUST emit one of these tags; no ad-hoc variants. If the funnel gains a step, add it
here first.

---

## Governance — Permission = Role × Pheromone

The ontology IS the auth model. No separate ACL table. No permissions database. The graph IS the security model.

| Primitive | Extension | What |
|-----------|-----------|------|
| `actor` | `wallet` (Sui address), `auth-hash` (bcrypt hash) | Identity |
| `membership` | `role`: chairman/board/ceo/operator/agent/auditor | Permission |
| `path` | `scope`: private/group/public | Federation boundary |
| `hypothesis` | `scope`: private/group/public | Shared learning boundary |

**Permission = Role × Pheromone.** Declared role + earned path strength = effective authority. Agents can only mark/warn paths they've participated in (sender or receiver in signal history).

### Roles

| Role | Can | Cannot |
|------|-----|--------|
| owner | everything (substrate apex; bypasses scope/network/sensitivity gates per `owner.md`) | exceed `OWNER_HARD_CEILING` rate (rate-limit pre-bypass per Gap 5); skip audit row (every allow emits `audit:owner:{action}` per Gap 2) |
| chairman | everything | bypass gates (chairman is per-group; owner is substrate-wide) |
| board | read highways/revenue/toxic | write anything |
| ceo | hire/fire/commend/flag, tune sensitivity | appoint roles |
| operator | add units, mark/warn | remove units, tune |
| agent | mark/warn own paths only | add/remove/read revenue |
| auditor | read highways/revenue/toxic | write anything |

### Governance Functions

```
roleCheck(role, action) → boolean        pure lookup, no TypeDB, no I/O
getRoleForUser(uid)     → string|undef   TypeDB membership query (separate from validateApiKey)
hasPathRelationship(uid, from, to) → bool pheromone gate: actor must have participated in edge
```

### Scope

| Value | Visible to | Harden to Sui? | Use case |
|-------|------------|----------------|---------|
| `private` | sender + receiver only | No | Internal signals, sensitive data |
| `group` | All group members | No | Team coordination, org learning |
| `public` | Anyone (cross-org) | Yes | Marketplace, federation |

**The learning moat:** Competitors can copy code but not pheromone history. Public highways on Sui are immutable proof of what worked. Private learning stays in TypeDB.

**Schema:** `src/schema/one.tql` (locked 2026-04-18) · **Code:** `src/lib/role-check.ts`, `src/lib/api-auth.ts` (getRoleForUser), `src/engine/persist.ts` (hasPathRelationship)

---

## Dead Names (Never Use)

These were renamed or removed. Using them causes schema/query drift.

| Dead name | Use instead | Retired in |
|-----------|-------------|-----------|
| `task-id` *(old `task` entity key)* | `tid` *(key on `thing`)* | v2.0 (2026-04-20) |
| `task-name` | `name` | v2.0 (2026-04-20) |
| `task-type` | `thing-type` | v2.0 (2026-04-20) |
| `status` *(on old task)* | `task-status` | v2.0 (2026-04-20) |
| `phase` *(on old task)* | `task-wave` | v2.0 (2026-04-20) |
| `priority-score` | `task-priority` | v2.0 (2026-04-20) |
| `"todo"` *(status value)* | `"open"` | v2.0 (2026-04-20) |
| `"in_progress"` *(status value)* | `"picked"` | v2.0 (2026-04-20) |
| `"complete"` *(status value)* | `"done"` / `"verified"` | v2.0 (2026-04-20) |
| `assignment` *(relation)* | `containment` + `task-status="picked"` + `owner` | v2.0 (2026-04-20) |
| `dependency` *(relation)* | `blocks` | v2.0 (2026-04-20) |
| `knowledge` | `hypothesis` | pre-v1 |
| `connections` | `path` | pre-v1 |
| `node` | `unit` / `actor` | pre-v1 |
| `scent` | `strength` | pre-v1 |
| `alarm` | `resistance` | pre-v1 |
| `trail` | `path` | pre-v1 |

---

## Broadcast Types (WsMessage)

Discriminated union carried over WsHub `/ws` and the Gateway `/broadcast` relay.
The allowlist in `gateway/src/index.ts` must include every type below — unlisted
types are rejected 400. Added/renamed types require a gateway deploy.

| Type            | Payload fields                                                | Loop | Surfaces |
|-----------------|---------------------------------------------------------------|------|----------|
| `mark`          | `tid`, `strength`                                             | L2   | TaskBoard edge thickness |
| `warn`          | `tid`, `resistance`                                           | L2   | TaskBoard edge color |
| `pick`          | `tid`, `owner`, `started_at`                                  | L1   | TaskBoard "picked" state |
| `verify`        | `tid`, `rubric`, `verified_at`                                | L2   | TaskBoard W4 completion |
| `rubric-update` | `tid`, `rubric` (partial)                                     | L2   | TaskBoard rubric dims |
| `sync`          | `tasks[]` with `{tid, strength, resistance}`                  | L3   | TaskBoard bulk refresh |
| `task-update`   | `task` (partial, with `tid`)                                  | L1   | TaskBoard any field |
| `unblock`       | `tid`                                                         | L2   | TaskBoard status → open |
| `complete`      | `tid` *(deprecated — aliased to `verify` w/ default rubric)*  | L2   | Legacy clients |
| `unit-hired`    | `uid`, `role`, `wallet`, `skills[]`, `from`                   | L1   | `/chairman` OrgChart (C1+) |
| `ping` / `pong` | —                                                             | —    | Keepalive only |

**`unit-hired` is emitted by `src/engine/chairman.ts`** after `mark(edge, 1)` resolves and before the recursive `registerHire()` fires. Consumed by `src/lib/use-chairman-stream.ts` to paint the org live as it assembles. No polling, no hardcoded role list — the stream IS the truth.

---

## See Also

- [DSL.md](one/DSL.md) — The programming model in depth
- [routing.md](routing.md) — How signals find their way
- [primitives.md](primitives.md) — Entities, relations, status values
- [metaphors.md](metaphors.md) — Same system, different vocabularies
- [architecture.md](one/architecture.md) — TypeDB as substrate, router pattern
- [loops.md](one/loops.md) — Seven nested feedback loops
- [one-ontology.md](one-ontology.md) — The 6-dimension ontology
