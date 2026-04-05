# TypeDB: The Brain

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ONE Ontology.  6 Dimensions.  TypeDB 3.0.                     │
│                                                                 │
│   Groups → Actors → Things → Paths → Events → Knowledge        │
│                                                                 │
│   The runtime moves signals. TypeDB remembers.                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Connection

```
Server:   https://flsiu1-0.cluster.typedb.com:80
Database: one
Username: admin
Password: (in .env as TYPEDB_PASSWORD)
```

Two modes:
- **Server (SSR)**: direct to TypeDB Cloud with JWT auth
- **Browser**: fetch → `PUBLIC_GATEWAY_URL` (Cloudflare Worker) → TypeDB Cloud

```typescript
import { read, write, readParsed, writeSilent, decay, callFunction } from '@/lib/typedb'
```

---

## Philosophy

TypeDB is the brain. TypeScript is the nervous system.

Tasks are `.on()` handlers on units in the runtime. Dependencies are `.then()` continuations.
Trails are strength/resistance entries in the runtime's scent map.

TypeDB handles what *remains*:
- Units persist (model, system-prompt, generation)
- Paths persist (strength, resistance, revenue)
- Signals recorded (event log)
- Skills registered (capability relation)
- Knowledge emerges (hypothesis, frontier, objective)
- Classification inferred (path_status, unit_classification, needs_evolution)

---

## Schema (`src/schema/world.tql`, ~230 lines)

### Dimension 1: Groups

Containers. Hierarchy. Isolation boundaries.

```typeql
entity group,
    owns gid @key,
    owns name,
    owns purpose,
    owns group-type,              # "persona", "team", "colony", "dao"
    owns status,
    owns created,
    plays hierarchy:parent,
    plays hierarchy:child,
    plays membership:group;

relation hierarchy,
    relates parent,
    relates child;
```

### Dimension 2: Actors

Units that receive and process signals. Each has a brain (model + prompt + generation).

```typeql
entity unit,
    owns uid @key,
    owns name,
    owns unit-kind,               # "human", "agent", "llm", "system"
    owns wallet,                  # Sui address
    owns status,                  # "active" | "proven" | "at-risk"
    owns balance,
    owns reputation,
    owns success-rate,            # 0.0-1.0
    owns activity-score,          # 0.0-100.0
    owns sample-count,            # interaction count
    owns model,                   # "opus", "sonnet", "haiku"
    owns system-prompt,           # mutable — evolves over time
    owns generation,              # prompt iteration count
    owns last-evolved,            # evolution cooldown
    owns tag @card(0..),          # flat tags
    owns cost-per-signal,         # model economics
    owns created,
    plays path:source,
    plays path:target,
    plays capability:provider,
    plays membership:member,
    plays signal:sender,
    plays signal:receiver,
    plays contribution-event:contributor-unit;
```

### Dimension 3: Things (Skills)

What units can do. A skill with `price > 0` is a service. No lifecycle — that lives in the runtime.

```typeql
entity skill,
    owns skill-id @key,
    owns name,
    owns description,
    owns tag @card(0..),          # "build", "wire", "P0", "frontend"
    owns price,                   # x402 price (0 = free, >0 = paid)
    owns currency,                # "SUI", "USDC", "FET"
    plays capability:offered;
```

### Dimension 4: Paths

Weighted connections. Pheromone trails. The learning.

```typeql
relation path,
    relates source,
    relates target,
    owns strength,                # mark() adds weight
    owns alarm,                   # warn() adds weight
    owns traversals,
    owns revenue,                 # sum of x402 payments
    owns last-used,
    owns fade-rate,               # per-path decay
    owns peak-strength,           # highest strength ever
    owns path-status;             # INFERRED: "highway" | "fresh" | "fading" | "toxic"

relation capability,
    relates provider,
    relates offered,
    owns price;

relation membership,
    relates group,
    relates member,
    owns joined-at;
```

### Dimension 5: Events

Signals that flowed through the system.

```typeql
relation signal,
    relates sender,
    relates receiver,
    owns data,                    # JSON string
    owns amount,                  # x402 payment (0 = free)
    owns success,
    owns latency,                 # ms
    owns ts;
```

### Dimension 6: Knowledge

Emerges from inference. Not stored, derived.

```typeql
entity hypothesis,
    owns hid @key,
    owns statement,
    owns hypothesis-status,       # "pending" | "testing" | "confirmed" | "rejected"
    owns observations-count,
    owns p-value,
    owns action-ready;            # INFERRED

entity frontier,
    owns fid @key,
    owns frontier-type,
    owns frontier-description,
    owns expected-value,
    owns frontier-status,         # "unexplored" | "exploring" | "exhausted"
    plays spawns:frontier;

entity objective,
    owns oid @key,
    owns objective-type,
    owns objective-description,
    owns priority-score,
    owns progress,                # 0.0-1.0
    owns objective-status,        # "pending" | "active" | "complete"
    plays spawns:objective;

relation spawns,
    relates frontier,
    relates objective;

entity contribution,
    owns contribution-id @key,
    owns impact-score,
    owns contribution-type,       # "signal", "payment", "discovery"
    plays contribution-event:contribution;

relation contribution-event,
    relates contributor-unit,
    relates contribution;
```

---

## The 6 Dimensions Mapped

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ONE ONTOLOGY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. GROUPS          group (gid, purpose, group-type)                       │
│                      hierarchy(parent, child)                               │
│                                                                             │
│   2. ACTORS          unit (uid, model, system-prompt, generation,           │
│                            success-rate, balance, wallet, tags)             │
│                                                                             │
│   3. THINGS          skill (skill-id, name, price, currency, tags)          │
│                      capability(provider, offered, price)                   │
│                                                                             │
│   4. PATHS           path(source, target) — strength, alarm, resistance,    │
│                        revenue, fade-rate, peak-strength, traversals        │
│                      membership(group, member)                              │
│                                                                             │
│   5. EVENTS          signal(sender, receiver) — data, amount, success,      │
│                        latency, ts                                          │
│                                                                             │
│   6. KNOWLEDGE       hypothesis (statement, p-value, action-ready)          │
│                      frontier (expected-value, status)                      │
│                      objective (priority-score, progress)                   │
│                      contribution (impact-score, type)                      │
│                      spawns(frontier, objective)                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Classification Functions

The deterministic sandwich. Every LLM call is wrapped in checks.

```typeql
# --- Path status ---
fun path_status($e: path) -> string:
    match $e has strength $s, has resistance $a, has traversals $t;
    return first
        if ($a > $s and $a >= 10.0) then "toxic"
        else if ($s >= 50.0) then "highway"
        else if ($s >= 10.0 and $s < 50.0 and $t < 10) then "fresh"
        else if ($s > 0.0 and $s < 5.0) then "fading"
        else "active";

# --- Unit classification ---
fun unit_classification($u: unit) -> string:
    match $u has success-rate $sr, has activity-score $as, has sample-count $sc;
    return first
        if ($sr >= 0.75 and $as >= 70.0 and $sc >= 50) then "proven"
        else if ($sr < 0.40 and $as >= 25.0 and $sc >= 30) then "at-risk"
        else "active";

# --- Evolution trigger ---
fun needs_evolution($u: unit) -> boolean:
    match $u has success-rate $sr, has sample-count $sc;
          $sr < 0.50; $sc >= 20;
    return first true;

# --- Hypothesis readiness ---
fun is_action_ready($h: hypothesis) -> boolean:
    match $h has hypothesis-status "confirmed",
          has p-value $p, has observations-count $n;
          $p <= 0.05; $n >= 50;
    return first true;
```

### Validation Functions (the sandwich)

```typeql
# PRE: Can this unit receive this skill?
fun can_receive($u: unit, $sk: skill) -> boolean:
    match (provider: $u, offered: $sk) isa capability;
    return first true;

# PRE: Is the path safe? (not toxic)
fun is_safe($from: unit, $to: unit) -> boolean:
    match (source: $from, target: $to) isa path, has strength $s, has resistance $a;
    return first if ($a > $s and $a >= 10.0) then false else true;

# PRE: Within budget?
fun within_budget($u: unit, $sk: skill, $amount: double) -> boolean:
    match (provider: $u, offered: $sk) isa capability, has price $p;
    return first if ($amount >= $p) then true else false;

# POST: Unit exists?
fun unit_exists($uid: string) -> boolean:
    match $u isa unit, has uid $uid;
    return first true;

# POST: Unit trustworthy?
fun is_trustworthy($u: unit) -> boolean:
    match $u has success-rate $sr, has sample-count $sc;
    return first if ($sr >= 0.50 or $sc < 10) then true else false;

# COMBINED: Full pre-flight
fun preflight($from: unit, $to: unit, $sk: skill) -> boolean:
    match (provider: $to, offered: $sk) isa capability;
          (source: $from, target: $to) isa path, has strength $s, has resistance $a;
    return first if ($a > $s and $a >= 10.0) then false else true;
```

---

## Routing Functions

```typeql
# Top paths by strength
fun highways(threshold: double = 10.0, min_traversals: integer = 50) -> { path }:
    match $e isa path, has strength $s, has traversals $t;
          $s >= threshold; $t >= min_traversals;
    return { $e };

# Single best route from unit to skill
fun optimal_route($from: unit, $skill: skill) -> unit:
    match (source: $from, target: $to) isa path, has strength $s;
          (provider: $to, offered: $skill) isa capability;
    sort $s desc; limit 1;
    return $to;

# Lowest price with capability
fun cheapest_provider($skill: skill) -> unit:
    match (provider: $u, offered: $skill) isa capability, has price $p;
    sort $p asc; limit 1;
    return $u;

# Top 5 routes by strength
fun suggest_route($from: unit, $skill: skill) -> { uid, strength }:
    match $from isa unit; $skill isa skill;
          (source: $from, target: $to) isa path, has strength $s;
          (provider: $to, offered: $skill) isa capability;
          $to has uid $id; $s >= 5.0;
    sort $s desc; limit 5;
    return { $id, $s };
```

---

## Actor & Skill Functions

```typeql
fun proven_units() -> { unit }:
    match $u isa unit, has status "proven";
    return { $u };

fun at_risk_units() -> { unit }:
    match $u isa unit, has status "at-risk";
    return { $u };

fun units_by_kind($kind: string) -> { unit }:
    match $u isa unit, has unit-kind $kind, has status "active";
    return { $u };

fun collaborators($me: unit) -> { unit }:
    match (member: $me, group: $g) isa membership;
          (member: $peer, group: $g) isa membership;
          not { $me is $peer; };
    return { $peer };

fun group_members($group_name: string) -> { unit }:
    match $grp isa group, has name $group_name;
          (group: $grp, member: $u) isa membership;
    return { $u };

fun skills_by_tag($tag: string) -> { skill }:
    match $s isa skill, has tag $tag;
    return { $s };

fun priced_skills($tag: string) -> { skill }:
    match $s isa skill, has tag $tag, has price $p; $p > 0.0;
    return { $s };

fun units_by_tag($tag: string) -> { unit }:
    match $u isa unit, has tag $tag;
    return { $u };
```

---

## Knowledge Functions

```typeql
fun actionable_hypotheses() -> { hypothesis }:
    match $h isa hypothesis, has action-ready true;
    return { $h };

fun active_tests() -> { hypothesis }:
    match $h isa hypothesis, has hypothesis-status "testing";
    return { $h };

fun promising_frontiers() -> { frontier }:
    match $f isa frontier, has frontier-status "unexplored", has expected-value $ev;
          $ev >= 0.5;
    return { $f };

fun active_objectives() -> { objective }:
    match $o isa objective, has objective-status $s;
          $s in ["pending", "active"];
    return { $o };
```

---

## Aggregate Functions

```typeql
fun total_contribution($name: string) -> double:
    match $u isa unit, has name $name;
          $ev(contributor-unit: $u, contribution: $c) isa contribution-event;
          $c has impact-score $i;
    return sum($i);

fun highway_count(threshold: double = 10.0) -> integer:
    match $e isa path, has strength $s; $s >= threshold;
    return count($e);

fun total_revenue() -> double:
    match $e isa path, has revenue $r;
    return sum($r);
```

---

## Queries

### Create Structure

```typeql
# Create a unit
insert $u isa unit,
    has uid "scout",
    has name "Scout",
    has unit-kind "agent",
    has model "sonnet",
    has system-prompt "You observe and report findings.",
    has generation 0,
    has balance 100.0,
    has success-rate 1.0,
    has activity-score 0.0,
    has sample-count 0,
    has status "active",
    has created 2026-01-01T00:00:00;

# Create a skill
insert $s isa skill,
    has skill-id "observe",
    has name "Observe",
    has tag "scout",
    has tag "P0",
    has price 0.01,
    has currency "SUI";

# Give unit a capability
match
    $u isa unit, has uid "scout";
    $s isa skill, has skill-id "observe";
insert
    (provider: $u, offered: $s) isa capability, has price 0.02;

# Create a group and add member
insert $g isa group,
    has gid "research",
    has name "Research Team",
    has group-type "team",
    has purpose "Market analysis",
    has status "active";

match
    $u isa unit, has uid "scout";
    $g isa group, has gid "research";
insert
    (member: $u, group: $g) isa membership, has joined-at 2026-01-01T00:00:00;
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
        has alarm 0.0,
        has traversals 1,
        has revenue 0.0,
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

# Warn path (add resistance)
match
    $from isa unit, has uid "scout";
    $to isa unit, has uid "bad-analyst";
    $e (source: $from, target: $to) isa path,
        has alarm $a;
delete
    $e has $a;
insert
    $e has alarm ($a + 1.0);

# Fade all paths (asymmetric: strength 5%, alarm 10%)
match $e isa path, has strength $s; $s > 0.01;
delete $e has $s;
insert $e has strength ($s * 0.95);

match $e isa path, has alarm $a; $a > 0.01;
delete $e has $a;
insert $e has alarm ($a * 0.90);
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
    $skill isa skill, has skill-id "analyze";
    let $to = optimal_route($from, $skill);
    $to has uid $tid;
fetch $tid;

# Get routing suggestions
match
    $from isa unit, has uid "scout";
    $skill isa skill, has skill-id "observe";
    let { $tid, $s } in suggest_route($from, $skill);
fetch $tid, $s;

# Find collaborators
match
    $me isa unit, has uid "scout";
    let $peer in collaborators($me);
    $peer has uid $pid;
fetch $pid;

# Check if path is toxic
match
    $from isa unit, has uid "scout";
    $to isa unit, has uid "bad-analyst";
    let $safe = is_safe($from, $to);
fetch $safe;
```

### Signal History

```typeql
# Record a signal
match
    $from isa unit, has uid "scout";
    $to isa unit, has uid "analyst";
insert
    (sender: $from, receiver: $to) isa signal,
        has data "{ \"tick\": 42500 }",
        has amount 0.01,
        has success true,
        has latency 120.0,
        has ts 2026-01-01T12:00:00;

# Replay signals from last hour
match
    $s (sender: $from, receiver: $to) isa signal,
        has ts $t,
        has data $d;
    $t > 2026-01-01T11:00:00;
    $from has uid $fid;
    $to has uid $tid;
sort $t asc;
fetch $fid, $tid, $d, $t;
```

---

## TypeScript Client (`src/lib/typedb.ts`)

```typescript
import { read, write, readParsed, writeSilent, decay, callFunction } from '@/lib/typedb'

// Read
const rows = await readParsed('match $u isa unit, has name $n; fetch $n;')

// Write
await write('insert $u isa unit, has uid "x", has name "X";')

// Fire and forget
writeSilent('match $e isa path...; delete...; insert...;')

// Asymmetric decay (strength 5%, alarm 20%)
await decay(0.05, 0.20)

// Call a function
const highways = await callFunction('highways', { threshold: 10.0, min_traversals: 50 })
```

The client handles JWT auth automatically. Server-side goes direct to TypeDB Cloud.
Browser goes through the Cloudflare Worker gateway.

---

## Status Thresholds

### Paths

| Status | Condition |
|--------|-----------|
| highway | strength >= 50 |
| fresh | strength 10-50, traversals < 10 |
| active | default |
| fading | strength 0-5 |
| toxic | alarm > strength AND alarm >= 10 |

### Units

| Status | Condition |
|--------|-----------|
| proven | success-rate >= 0.75, activity >= 70, samples >= 50 |
| active | default |
| at-risk | success-rate < 0.40, activity >= 25, samples >= 30 |

### Evolution

| Trigger | Condition |
|---------|-----------|
| needs_evolution | success-rate < 0.50, samples >= 20 |
| is_action_ready | hypothesis confirmed, p-value <= 0.05, observations >= 50 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL                                       │
│                                                                             │
│   HTTP        WebSocket       Cron          Cloudflare Worker               │
│     │              │            │                │                          │
└─────┴──────────────┴────────────┴────────────────┴──────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        src/lib/typedb.ts                                     │
│                                                                             │
│   read()           readParsed()     decay()                                 │
│   write()          writeSilent()    callFunction()                          │
│                                                                             │
│   Server: JWT → TypeDB Cloud direct                                         │
│   Browser: fetch → Cloudflare Worker → TypeDB Cloud                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   TypeDB Cloud (the brain)                                   │
│                   flsiu1-0.cluster.typedb.com                               │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  DIMENSION 1: GROUPS        │  DIMENSION 2: ACTORS                  │  │
│   │  group (hierarchy)          │  unit (model, prompt, generation)     │  │
│   ├─────────────────────────────┼───────────────────────────────────────┤  │
│   │  DIMENSION 3: THINGS        │  DIMENSION 4: PATHS                   │  │
│   │  skill (price, currency)    │  path (strength, alarm, revenue)      │  │
│   │  capability(provider,       │  membership(group, member)            │  │
│   │    offered, price)          │                                       │  │
│   ├─────────────────────────────┼───────────────────────────────────────┤  │
│   │  DIMENSION 5: EVENTS        │  DIMENSION 6: KNOWLEDGE               │  │
│   │  signal (data, amount,      │  hypothesis, frontier, objective      │  │
│   │    success, latency)        │  contribution, spawns                 │  │
│   └─────────────────────────────┴───────────────────────────────────────┘  │
│                                                                             │
│   25+ functions: routing, classification, validation, aggregates            │
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
| **Fault tolerance** | Failed units accumulate alarm → signals naturally reroute |
| **Team formation** | `collaborators()` derives peers from shared `membership` |
| **Cost optimization** | `cheapest_provider()` always finds lowest price |
| **Highway formation** | `highways()` identifies high-traffic paths in real-time |
| **Self-improvement** | `needs_evolution()` triggers prompt rewrite when performance drops |
| **Forgiveness** | Asymmetric decay — alarm fades 2x faster than strength |
| **Audit trail** | `signal` relation stores complete history for replay |

---

## Files

```
src/schema/
├── world.tql          # THE schema (~230 lines): 6 dimensions + 25+ functions
├── skins.tql          # Domain-agnostic ontology (actor/group/connection)
├── sui.tql            # On-chain mirror: Move structs as TQL entities
├── agents.tql         # Legacy envelope system
├── seeds/             # Seed data (engineering-team.tql)
├── patterns/          # Pattern libraries (genesis, substrate, classification, etc.)
└── archive/           # Old versions

src/lib/
├── typedb.ts          # TypeDB client: read/write/decay/callFunction
└── typedb-auth-adapter.ts  # TypeDB adapter for Better Auth
```

---

## Runtime Mapping

| Schema | Runtime (DSL) |
|--------|---------------|
| `unit` entity | `w.add(id)` / `w.actor(id)` |
| `path.strength` | `mark(path)` increments |
| `path.alarm` | `warn(path)` increments |
| `signal` relation | `emit({ receiver, data })` |
| `skill` + `capability` | unit `.on()` handler + TypeDB registration |
| `highways()` | `w.highways(n)` |
| `suggest_route()` | routing decision from TypeDB |
| `needs_evolution()` | trigger for agent self-improvement |
| `is_safe()` | pre-check in the deterministic sandwich |
| `preflight()` | combined pre-check before LLM call |
| `fade()` via client | `w.fade(rate)` / `decay(0.05, 0.20)` |

---

*TypeDB thinks. The runtime moves. `world.tql` is the source of truth.*

---

## See Also

- [DSL.md](DSL.md) — The signal language and six verbs
- [cloudflare.md](cloudflare.md) — TypeDB → KV sync, edge reads
- [metaphors.md](metaphors.md) — Same DSL, different vocabularies
- [flow.md](flow.md) — How paths and highways persist
- [migration.md](migration.md) — Schema evolution notes
