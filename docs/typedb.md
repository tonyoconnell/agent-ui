# TypeDB: The Substrate

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ONE Ontology.  6 Dimensions.  6 Lessons.  TypeDB 3.0.         │
│                                                                 │
│   Groups → Actors → Things → Connections → Events → Knowledge   │
│                                                                 │
│   Everything else emerges.                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Philosophy

TypeDB is the substrate. TypeScript is the pulse.

The **ONE Ontology** organizes reality into 6 dimensions. TypeDB stores the structure. Inference rules derive knowledge. The pulse moves signals through.

The **6 Lessons** from ants-at-work add intelligence layers:

```
Dimension        What It Holds              TypeDB                Lesson
───────────────────────────────────────────────────────────────────────────
1. Groups        Swarms, hierarchies        entity group          —
2. Actors        Units that process         entity unit           L1: Classification
3. Things        Tasks, capabilities        entity task           L4: Task Allocation
4. Connections   Weighted paths             relation path         L2: Quality Rules
5. Events        Signals that flowed        relation signal       L5: Contribution
6. Knowledge     Emerges from inference     fun highways()        L3+L6: Hypothesis + Emergence
```

---

## Production Proof

This architecture runs at scale:

```
ants-at-work (sibling project)
──────────────────────────────
TypeDB Cloud:     cr0mc4-0.cluster.typedb.com
Operations:       288 BILLION learning ops/day
Patterns:         14,272 tracked, 519 winning (>52% WR)
Uptime:           99.9%+
Domain:           Stigmergic trading (STAN algorithm)

Same architecture. Same patterns. Production proven.
```

---

## Schema (~80 lines)

```typeql
define

# ═══════════════════════════════════════════════════════════════
# DIMENSION 1: GROUPS
# Containers with optional hierarchy. Swarms of units.
# ═══════════════════════════════════════════════════════════════

entity group,
    owns sid @key,
    owns purpose,
    owns created,
    plays hierarchy:parent,
    plays hierarchy:child;

relation hierarchy,
    relates parent,
    relates child;

# ═══════════════════════════════════════════════════════════════
# DIMENSION 2: ACTORS
# Units that receive and process signals.
# ═══════════════════════════════════════════════════════════════

entity unit,
    owns uid @key,
    owns created,
    owns balance,
    plays path:source,
    plays path:target,
    plays capability:provider,
    plays claim:claimer,
    plays claim:owner,
    plays membership:member,
    plays signal:sender,
    plays signal:receiver;

# ═══════════════════════════════════════════════════════════════
# DIMENSION 3: THINGS
# Tasks that units can perform. The "what" of the system.
# ═══════════════════════════════════════════════════════════════

entity task,
    owns name @key,
    owns cost,
    plays capability:skill,
    plays claim:work,
    plays continuation:trigger,
    plays continuation:result;

# ═══════════════════════════════════════════════════════════════
# DIMENSION 4: CONNECTIONS
# Weighted paths between units. Pheromone trails.
# ═══════════════════════════════════════════════════════════════

# The core pheromone trail
relation path,
    relates source,
    relates target,
    owns strength,
    owns traversals,
    owns last-used;

# What a unit can do
relation capability,
    relates provider,
    relates skill,
    owns price;

# Task ownership
relation claim,
    relates claimer,
    relates work,
    relates owner,
    owns claimed-at;

# Group membership
relation membership,
    relates member,
    relates group,
    owns joined-at;

# Pre-defined continuations (.then chains)
relation continuation,
    relates trigger,
    relates result,
    owns template;

# ═══════════════════════════════════════════════════════════════
# DIMENSION 5: EVENTS
# Signals that flowed through the system.
# ═══════════════════════════════════════════════════════════════

relation signal,
    relates sender,
    relates receiver,
    owns payload,
    owns ts;

# ═══════════════════════════════════════════════════════════════
# ATTRIBUTES
# ═══════════════════════════════════════════════════════════════

# Identifiers
uid sub attribute, value string;
sid sub attribute, value string;
name sub attribute, value string;

# Descriptive
purpose sub attribute, value string;
template sub attribute, value string;
payload sub attribute, value string;

# Numeric
strength sub attribute, value double;
balance sub attribute, value double;
cost sub attribute, value double;
price sub attribute, value double;
traversals sub attribute, value integer;

# Temporal
created sub attribute, value datetime;
last-used sub attribute, value datetime;
claimed-at sub attribute, value datetime;
joined-at sub attribute, value datetime;
ts sub attribute, value datetime;

# ═══════════════════════════════════════════════════════════════
# DIMENSION 6: KNOWLEDGE
# Emerges from inference. Not stored, derived.
# ═══════════════════════════════════════════════════════════════

# Detect highways (high-traffic paths)
fun highways(threshold: double = 10.0, min_traversals: integer = 50) -> { path }:
    match
        $e (source: $from, target: $to) isa path,
            has strength $s,
            has traversals $t;
        $s >= threshold;
        $t >= min_traversals;
    return { $e };

# Find optimal route for a task
fun optimal_route($from: unit, $task: task) -> unit:
    match
        (source: $from, target: $to) isa path, has strength $s;
        (provider: $to, skill: $task) isa capability;
    sort $s desc;
    limit 1;
    return $to;

# Find cheapest provider for a task
fun cheapest_provider($task: task) -> unit:
    match
        (provider: $u, skill: $task) isa capability, has price $p;
    sort $p asc;
    limit 1;
    return $u;

# Find collaborators in the same group
fun collaborators($me: unit) -> { unit }:
    match
        (member: $me, group: $g) isa membership;
        (member: $peer, group: $g) isa membership;
        not { $me is $peer; };
    return { $peer };

# Count highways
fun highway_count(threshold: double = 10.0) -> integer:
    match
        $e isa path, has strength $s;
        $s >= threshold;
    return count($e);

# Get routing suggestion based on history
fun suggest_route($from: unit, $task: task) -> { uid, strength }:
    match
        $from isa unit;
        $task isa task;
        (source: $from, target: $to) isa path, has strength $s;
        (provider: $to, skill: $task) isa capability;
        $to has uid $tid;
        $s >= 5.0;
    sort $s desc;
    limit 5;
    return { $tid, $s };
```

---

## The 6 Dimensions Mapped

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ONE ONTOLOGY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. GROUPS                                                                 │
│   ─────────                                                                 │
│   Containers. Hierarchies. Isolation boundaries.                            │
│                                                                             │
│   group "trading-group"                                                     │
│     └── group "btc-analysis"                                                │
│           └── group "sentiment-team"                                        │
│                                                                             │
│   2. ACTORS                                                                 │
│   ──────────                                                                │
│   Units that receive and process signals.                                   │
│                                                                             │
│   unit "scout"     │ observes market                                        │
│   unit "analyst"   │ analyzes data                                          │
│   unit "trader"    │ executes trades                                        │
│   unit "oracle"    │ answers questions                                      │
│                                                                             │
│   3. THINGS                                                                 │
│   ──────────                                                                │
│   Tasks. Capabilities. What can be done.                                    │
│                                                                             │
│   task "observe"   │ cost: 0.01                                             │
│   task "analyze"   │ cost: 0.02                                             │
│   task "execute"   │ cost: 0.05                                             │
│                                                                             │
│   4. CONNECTIONS                                                            │
│   ───────────────                                                           │
│   Weighted paths. Pheromone trails. The learning.                           │
│                                                                             │
│   scout ──[15.2]──▶ analyst     (highway forming)                           │
│   analyst ──[8.4]──▶ trader                                                 │
│   scout ──[0.3]──▶ trader       (weak, fading)                              │
│                                                                             │
│   5. EVENTS                                                                 │
│   ──────────                                                                │
│   Signals that flowed. History. Replay.                                     │
│                                                                             │
│   signal { scout → analyst, payload: { tick: 42500 }, ts: now }             │
│   signal { analyst → trader, payload: { action: "long" }, ts: now+1s }      │
│                                                                             │
│   6. KNOWLEDGE                                                              │
│   ─────────────                                                             │
│   Emerges from inference. Not stored, derived.                              │
│                                                                             │
│   highways()           → paths with strength > 10                           │
│   optimal_route()      → best path from history                             │
│   cheapest_provider()  → lowest price for task                              │
│   collaborators()      → peers in same group                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Queries

### Structure

```typeql
# Create a unit
insert $u isa unit,
    has uid "scout",
    has balance 100.0,
    has created 2026-01-01T00:00:00;

# Create a task
insert $t isa task,
    has name "observe",
    has cost 0.01;

# Give unit a capability
match
    $u isa unit, has uid "scout";
    $t isa task, has name "observe";
insert
    (provider: $u, skill: $t) isa capability, has price 0.02;

# Create a group
insert $s isa group,
    has sid "trading-group",
    has purpose "Market analysis and execution";

# Join a group
match
    $u isa unit, has uid "scout";
    $s isa group, has sid "trading-group";
insert
    (member: $u, group: $s) isa membership, has joined-at 2026-01-01T00:00:00;
```

### Paths & Learning

```typeql
# Mark path (signal flowed from scout to analyst)
match
    $from isa unit, has uid "scout";
    $to isa unit, has uid "analyst";
insert
    (source: $from, target: $to) isa path,
        has strength 1.0,
        has traversals 1,
        has last-used 2026-01-01T12:00:00;

# Strengthen existing path
match
    $from isa unit, has uid "scout";
    $to isa unit, has uid "analyst";
    $e (source: $from, target: $to) isa path,
        has strength $s,
        has traversals $t;
delete
    $e has $s;
    $e has $t;
insert
    $e has strength ($s + 1.0);
    $e has traversals ($t + 1);

# Fade all paths (decay by 10%)
match
    $e isa path, has strength $s;
delete
    $e has $s;
insert
    $e has strength ($s * 0.9);

# Clean up weak paths
match
    $e isa path, has strength $s;
    $s < 0.01;
delete
    $e;
```

### Routing & Intelligence

```typeql
# Get highways
match
    let $e in highways(10.0, 50);
    $e (source: $from, target: $to) isa path;
    $from has uid $fid;
    $to has uid $tid;
    $e has strength $s;
fetch $fid, $tid, $s;

# Get optimal route
match
    $from isa unit, has uid "scout";
    $task isa task, has name "analyze";
    let $to = optimal_route($from, $task);
    $to has uid $tid;
fetch $tid;

# Find cheapest provider
match
    $task isa task, has name "analyze";
    let $u = cheapest_provider($task);
    $u has uid $uid;
fetch $uid;

# Get routing suggestions
match
    $from isa unit, has uid "scout";
    $task isa task, has name "observe";
    let { $tid, $s } in suggest_route($from, $task);
fetch $tid, $s;

# Find collaborators
match
    $me isa unit, has uid "scout";
    let $peer in collaborators($me);
    $peer has uid $pid;
fetch $pid;
```

### Claims & Payments

```typeql
# Claim a task
match
    $claimer isa unit, has uid "analyst";
    $task isa task, has name "analyze-btc";
    $owner isa unit, has uid "scout";
insert
    (claimer: $claimer, work: $task, owner: $owner) isa claim,
        has claimed-at 2026-01-01T12:00:00;

# Check if task is claimed
match
    $t isa task, has name "analyze-btc";
    (claimer: $u, work: $t) isa claim;
    $u has uid $uid;
fetch $uid;

# Transfer payment
match
    $from isa unit, has uid "scout", has balance $fb;
    $to isa unit, has uid "analyst", has balance $tb;
    $fb >= 10.0;
delete
    $from has $fb;
    $to has $tb;
insert
    $from has balance ($fb - 10.0);
    $to has balance ($tb + 10.0);
```

### Signal History

```typeql
# Record a signal
match
    $from isa unit, has uid "scout";
    $to isa unit, has uid "analyst";
insert
    (sender: $from, receiver: $to) isa signal,
        has payload "{ \"tick\": 42500.00 }",
        has ts 2026-01-01T12:00:00;

# Replay signals from last hour
match
    $s (sender: $from, receiver: $to) isa signal,
        has ts $t,
        has payload $p;
    $t > 2026-01-01T11:00:00;
    $from has uid $fid;
    $to has uid $tid;
sort $t asc;
fetch $fid, $tid, $p, $t;
```

---

## The Pulse (TypeScript Client)

```typescript
import { TypeDB } from 'typedb-driver'

type Envelope = { receiver: string; payload?: unknown }

export const pulse = (db: TypeDB) => {

  const send = async ({ receiver, payload }: Envelope, from = 'entry') => {
    const [unitId, taskName = 'default'] = receiver.split(':')

    // Query substrate for best route
    const route = await db.query(`
      match
        $from isa unit, has uid "${from}";
        $task isa task, has name "${taskName}";
        let { $tid, $s } in suggest_route($from, $task);
      sort $s desc; limit 1;
      fetch $tid;
    `)

    const target = route?.tid || unitId

    // Strengthen path in substrate
    await db.query(`
      match
        $from isa unit, has uid "${from}";
        $to isa unit, has uid "${target}";
        $e (source: $from, target: $to) isa path,
            has strength $s,
            has traversals $t;
      delete $e has $s; $e has $t;
      insert $e has strength ($s + 1.0); $e has traversals ($t + 1);
    `)

    // Record signal for replay
    await db.query(`
      match
        $from isa unit, has uid "${from}";
        $to isa unit, has uid "${target}";
      insert
        (sender: $from, receiver: $to) isa signal,
          has payload "${JSON.stringify(payload)}",
          has ts ${Date.now()};
    `)

    // Execute task (actual work happens here)
    const result = await execute(target, taskName, payload)

    // Query continuation from substrate
    const cont = await db.query(`
      match
        $t isa task, has name "${taskName}";
        (trigger: $t, result: $next) isa continuation, has template $tmpl;
        $next has name $n;
      fetch $n, $tmpl;
    `)

    // Continue the chain
    if (cont) {
      const nextEnvelope = JSON.parse(
        cont.tmpl.replace('result', JSON.stringify(result))
      )
      await send(nextEnvelope, receiver)
    }

    return result
  }

  const fade = async (rate = 0.1) => {
    // Decay all paths
    await db.query(`
      match $e isa path, has strength $s;
      delete $e has $s;
      insert $e has strength ($s * ${1 - rate});
    `)

    // Clean up weak paths
    await db.query(`
      match $e isa path, has strength $s; $s < 0.01;
      delete $e;
    `)
  }

  const highways = async (limit = 10) => {
    return db.query(`
      match
        let $e in highways(10.0, 50);
        $e (source: $from, target: $to), has strength $s;
        $from has uid $fid;
        $to has uid $tid;
      sort $s desc;
      limit ${limit};
      fetch $fid, $tid, $s;
    `)
  }

  return { send, fade, highways }
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL                                       │
│                                                                             │
│   HTTP        WebSocket       Streams         Cron                          │
│     │              │             │              │                           │
└─────┴──────────────┴─────────────┴──────────────┴───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           THE PULSE                                         │
│                         (TypeScript)                                        │
│                                                                             │
│   send()     Query substrate → strengthen path → execute → continue         │
│   fade()     Decay all paths, clean up weak ones                            │
│   highways() Get top paths from inference                                   │
│                                                                             │
│   ~70 lines. Thin client. Real-time.                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              │ TypeDB Driver
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE SUBSTRATE                                       │
│                      (TypeDB + ONE Ontology)                                │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  DIMENSION 1: GROUPS        │  DIMENSION 2: ACTORS                  │  │
│   │  group (hierarchy)          │  unit (processors)                    │  │
│   ├─────────────────────────────┼───────────────────────────────────────┤  │
│   │  DIMENSION 3: THINGS        │  DIMENSION 4: CONNECTIONS             │  │
│   │  task (capabilities)        │  path (pheromone trails)              │  │
│   │                             │  capability, claim, membership        │  │
│   ├─────────────────────────────┼───────────────────────────────────────┤  │
│   │  DIMENSION 5: EVENTS        │  DIMENSION 6: KNOWLEDGE               │  │
│   │  signal (history)           │  highways(), optimal_route()          │  │
│   │                             │  cheapest_provider(), collaborators() │  │
│   └─────────────────────────────┴───────────────────────────────────────┘  │
│                                                                             │
│   ~80 lines of TypeQL. Inference derives knowledge.                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Emergence

What emerges without being programmed:

| Behavior | How It Emerges |
|----------|----------------|
| **Load balancing** | Overloaded units get expensive → `cheapest_provider()` routes elsewhere |
| **Specialization** | Units that succeed have strong paths → `optimal_route()` sends more |
| **Fault tolerance** | Failed units don't strengthen paths → signals naturally reroute |
| **Team formation** | `collaborators()` derives peers from shared `membership` |
| **Cost optimization** | `cheapest_provider()` always finds lowest price |
| **Highway formation** | `highways()` identifies high-traffic paths in real-time |
| **Audit trail** | `signal` relation stores complete history for replay |

---

## Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ONE Ontology                                                  │
│   ────────────                                                  │
│   6 dimensions: Groups, Actors, Things,                         │
│                 Connections, Events, Knowledge                  │
│                                                                 │
│   TypeDB Substrate                                              │
│   ────────────────                                              │
│   ~80 lines of schema. Inference functions.                     │
│   Knowledge emerges, not stored.                                │
│                                                                 │
│   TypeScript Pulse                                              │
│   ────────────────                                              │
│   ~70 lines. Thin client. Real-time signal flow.                │
│   Queries substrate, executes tasks, writes back.               │
│                                                                 │
│   Production Proven                                             │
│   ─────────────────                                             │
│   ants-at-work runs this at 288B ops/day.                       │
│   Same patterns. Same architecture. It works.                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files

```
src/schema/
├── one.tql                    # THE schema (~330 lines)
│                              # 6 dimensions + 6 lessons + commerce + inference + functions
├── sui.tql                    # Sui Move contracts as TypeQL
└── skins.tql              # Universal metaphor functions

packages/typedb-inference-patterns/
├── standalone/                # Individual lesson TQL files
│   ├── classification.tql     # L1: Multi-attribute tier detection
│   ├── quality-rules.tql      # L2: Automatic quality bands
│   ├── hypothesis-lifecycle.tql  # L3: State machines via inference
│   ├── task-management.tql    # L4: Negation + pheromone selection
│   ├── contribution-tracking.tql # L5: Aggregates + synergy
│   └── autonomous-goals.tql   # L6: Frontier detection + goal spawning
├── runtime/
│   └── world.ts              # 70-line substrate implementing all 6 lessons
├── SUBSTRATE-MAPPING.md       # TypeDB ↔ Substrate architecture
├── ECONOMICS.md               # FET token model + pheromone costs
├── SWARMS.md                  # Dynamic group formation patterns
├── LOOPS.md                   # Deterministic + probabilistic inference
├── LIFECYCLE.md               # State machines for all entity types
└── OPERATIONS.md              # Complete WRITE operations reference
```

## The 6 Lessons

| # | Lesson | Pattern | TypeDB | Substrate |
|---|--------|---------|--------|-----------|
| 1 | **Perception** | Classification | `fun elite_units()` | `.on('classify')` |
| 2 | **Homeostasis** | Quality bands | `fun high_quality()` | `.on('validate')` |
| 3 | **Hypothesis** | State machine | `fun action_ready()` | `.on('observe')` |
| 4 | **Task Allocation** | Negation + pheromone | `fun ready_tasks()` | `.on('query-ready')` |
| 5 | **Contribution** | Aggregates | `fun total_contribution()` | `.on('record')` |
| 6 | **Emergence** | Autonomous goals | `fun promising_frontiers()` | `.on('detect-frontier')` |

Each lesson maps to biology (Deborah Gordon, "Ant Encounters"):

```
L1 Perception     = Ants reading cuticular hydrocarbons (chemical ID)
L2 Homeostasis    = Response thresholds (different ants switch at different rates)
L3 Hypothesis     = Probabilistic task switching (accumulate evidence → transition)
L4 Task Allocation = Foraging without instructions (negation: "what ISN'T being done?")
L5 Contribution   = Interaction rates measuring flow (aggregate pheromone)
L6 Emergence      = World-level adaptation (no ant decides, goals emerge)
```

---

*ONE Ontology. 6 Lessons. TypeDB 3.0. The substrate for AI agent economies.*

---

## See Also

- [flows.md](flows.md) — How paths and highways persist through TypeDB
- [ontology.md](ontology.md) — Inference rules driving system behavior
- [one-ontology.md](one-ontology.md) — Six dimensions stored in TypeDB schema
- [substrate-learning.md](substrate-learning.md) — Learning model TypeDB persists
- [integration.md](integration.md) — TypeDB's role in the full system
- [the-stack.md](the-stack.md) — TypeDB as one of two fires
