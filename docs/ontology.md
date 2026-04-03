# The Ontology

The schema controls everything. TypeDB is the DNA.

## One Schema, All Layers

```
┌──────────────────────────────��──────────────────────────────────┐
│                         ONTOLOGY                                 │
│                       (unified.tql)                              │
│                                                                  │
│   Defines what exists, how it connects, what emerges             │
│                                                                  │
└─────────────────────���────────────────────��──────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │ Substrate│        │Agentverse│        │   ASI    │
    │  (70 ln) │        │  (70 ln) │        │  (70 ln) │
    └──────────┘        └──────────┘        └──────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                    ┌─────────────────┐
                    │     TypeDB      │
                    │   (persists)    │
                    └─────────────────┘
```

## The Six Dimensions

Everything maps to six concepts:

```tql
# 1. GROUPS — organizational units
entity colony owns id @key, owns name;
entity mission owns id @key, owns objective;

# 2. ACTORS — things that act
entity node owns id @key, owns kind;  # "agent", "llm", "human", "swarm"

# 3. THINGS — what actors operate on
entity task owns id @key, owns status;
entity token owns address @key, owns price;

# 4. CONNECTIONS — relationships (where pheromones live)
relation edge relates source, target, owns weight, owns alarm;

# 5. EVENTS — state changes
entity traversal owns id @key, owns timestamp, owns success;

# 6. KNOWLEDGE — crystallized patterns
entity pattern owns id @key, owns confidence;
```

## How Ontology Controls Runtime

```typescript
// The TypeScript mirrors the TypeQL

// 1. GROUPS
colony()                    // → entity colony
mission(colony, objective)  // → entity mission

// 2. ACTORS
unit(id)                    // → entity node, owns kind "unit"
llm(id, complete)           // → entity node, owns kind "llm"
agent(address)              // → entity node, owns kind "agent"

// 3. THINGS
envelope({ receiver, payload })  // → not persisted, ephemeral

// 4. CONNECTIONS
mark(edge, strength)        // → relation edge, owns weight
alarm(edge, strength)       // → relation edge, owns alarm
highways()                  // → match $e isa edge, has status "highway"

// 5. EVENTS
send(envelope)              // → insert traversal
onSuccess/onFailure         // → update traversal, owns success

// 6. KNOWLEDGE
crystallize()               // → insert pattern (when threshold met)
```

## Inference Rules = Emergent Behavior

The ontology doesn't just store — it **thinks**:

```tql
# These rules fire automatically in TypeDB

rule highway:
    when { $e isa edge, has weight $w; $w >= 50.0; }
    then { $e has status "highway"; };

rule fading:
    when { $e isa edge, has weight $w; $w > 0.0; $w < 5.0; }
    then { $e has status "fading"; };

rule toxic:
    when { $e isa edge, has alarm $a, has weight $w; $a > $w; $a >= 10.0; }
    then { $e has status "toxic"; };

rule proven-agent:
    when {
        $n isa node, has kind "agent";
        $e (target: $n) isa edge, has weight $w, has alarm $a;
        $w >= 20.0; $w > ($a * 2);
    }
    then { $n has status "proven"; };

rule at-risk-agent:
    when {
        $n isa node, has kind "agent";
        $e (target: $n) isa edge, has alarm $a, has weight $w;
        $a >= 10.0; $a > $w;
    }
    then { $n has status "at-risk"; };
```

## Query = Behavior

The runtime queries; the ontology answers:

```typescript
// "Which agents for translation?"
const agents = await query(`
  match 
    $n isa node, has kind "agent", has status "proven";
    $e (target: $n) isa edge, has weight $w;
    $e has task-type "translation";
  sort $w desc; limit 5;
  return { $n, $w };
`)

// "What paths to avoid?"
const toxic = await query(`
  match $e isa edge, has status "toxic";
  return { $e };
`)

// "How confident are we?"
const confidence = await query(`
  match 
    $e isa edge, has task-type $t, has weight $w;
    $t == "translation";
  return sum($w);
`)
```

## Functions = API

TypeQL functions ARE the API:

```tql
# unified.tql defines these

fun best($task: string) -> node:
    match
        $n isa node, has status "proven";
        $e (target: $n) isa edge, has task-type $task, has weight $w;
    sort $w desc; limit 1;
    return $n;

fun highways($n: integer) -> { edge }:
    match $e isa edge, has status "highway", has weight $w;
    sort $w desc; limit $n;
    return { $e };

fun toxic() -> { edge }:
    match $e isa edge, has status "toxic";
    return { $e };

fun confidence($task: string) -> double:
    match $e isa edge, has task-type $task, has weight $w;
    return sum($w) / 100.0;
```

```typescript
// Runtime just calls functions
const agent = await query(`best("translation")`)
const paths = await query(`highways(10)`)
const avoid = await query(`toxic()`)
const conf = await query(`confidence("translation")`)
```

## Schema Changes = Behavior Changes

```tql
# Want faster graduation to highway?
rule highway:
    when { $e isa edge, has weight $w; $w >= 30.0; }  # was 50
    then { $e has status "highway"; };

# Want slower decay of trust?
rule fading:
    when { $e isa edge, has weight $w; $w > 0.0; $w < 2.0; }  # was 5
    then { $e has status "fading"; };

# Want economic weighting?
rule valuable-agent:
    when {
        $n isa node, has kind "agent";
        $t isa token, has holder $n, has market-cap $mc;
        $mc >= 100000.0;
    }
    then { $n has status "valuable"; };
```

No code changes. Schema changes. Behavior changes.

## The Full Ontology

```tql
# ═════════════════════���═════════════════════════════════════════════
# UNIFIED ONTOLOGY — Controls everything
# ════════════════════════════════════════════════════════════════��══

define

# ───────────────────────────────────────────���─────────────────────
# GROUPS
# ────────────────────────────────────────────────────��────────────
entity colony owns id @key, owns name, plays membership:colony;
entity mission owns id @key, owns objective, owns status;

# ──────────────────────────────────��──────────────────────────────
# ACTORS
# ─────────────────────────────────────────────────────────────────
entity node
    owns id @key,
    owns kind,           # "agent", "llm", "human", "swarm"
    owns status,         # "active", "proven", "at-risk" (inferred)
    owns reputation,
    plays edge:source,
    plays edge:target,
    plays membership:member;

# ─────────────────────────────────��───────────────────────────────
# THINGS
# ─────────────────────────────────────────────────────────────────
entity task owns id @key, owns task-type, owns status;
entity token owns address @key, owns price, owns market-cap, owns holder;

# ─────────────────────────────────────────────────────────────────
# CONNECTIONS
# ─────────────────────────────────────────────────────────────────
relation edge
    owns eid @key,
    relates source,
    relates target,
    owns task-type,
    owns weight,         # success pheromone
    owns alarm,          # failure pheromone
    owns status;         # "highway", "fading", "toxic" (inferred)

relation membership
    relates colony,
    relates member;

# ───────────────────────────────────────��─────────────────────────
# EVENTS
# ─────────────────────────────────────────────────────────────────
entity traversal
    owns id @key,
    owns edge-id,
    owns timestamp,
    owns success,
    owns latency;

# ─────────────────────────────────────────────────────────────────
# KNOWLEDGE
# ─────────────────────────────────────────────────────────────────
entity pattern
    owns id @key,
    owns description,
    owns confidence,
    owns source-edge;

# ─────────────────────────────────────────────────────────────────
# ATTRIBUTES
# ─────────────────────────────────────────────────────────────────
attribute id, value string;
attribute eid, value string;
attribute name, value string;
attribute kind, value string;
attribute status, value string;
attribute objective, value string;
attribute task-type, value string;
attribute description, value string;
attribute address, value string;
attribute holder, value string;
attribute edge-id, value string;
attribute source-edge, value string;
attribute weight, value double;
attribute alarm, value double;
attribute reputation, value double;
attribute price, value double;
attribute market-cap, value double;
attribute confidence, value double;
attribute latency, value double;
attribute success, value boolean;
attribute timestamp, value datetime;

# ─────────────────────────────────────────────────────────────────
# INFERENCE RULES
# ─────────────────────────────────────────────────────────────────
rule highway:
    when { $e isa edge, has weight $w; $w >= 50.0; }
    then { $e has status "highway"; };

rule fading:
    when { $e isa edge, has weight $w; $w > 0.0; $w < 5.0; }
    then { $e has status "fading"; };

rule toxic:
    when { $e isa edge, has alarm $a, has weight $w; $a > $w; $a >= 10.0; }
    then { $e has status "toxic"; };

rule proven-agent:
    when {
        $n isa node, has kind "agent";
        $e (target: $n) isa edge, has weight $w, has alarm $a;
        $w >= 20.0; $w > ($a * 2);
    }
    then { $n has status "proven"; };

rule at-risk-agent:
    when {
        $n isa node, has kind "agent";
        $e (target: $n) isa edge, has alarm $a, has weight $w;
        $a >= 10.0; $a > $w;
    }
    then { $n has status "at-risk"; };

# ────────────────────────────��───────────────────────��────────────
# FUNCTIONS
# ─────────────────────────────────────────────────────────────────
fun best($task: string) -> node:
    match
        $n isa node, has status "proven";
        $e (target: $n) isa edge, has task-type $task, has weight $w;
    sort $w desc; limit 1;
    return $n;

fun highways($limit: integer) -> { edge }:
    match $e isa edge, has status "highway", has weight $w;
    sort $w desc; limit $limit;
    return { $e };

fun toxic() -> { edge }:
    match $e isa edge, has status "toxic";
    return { $e };

fun confidence($task: string) -> double:
    match $e isa edge, has task-type $task, has weight $w;
    return sum($w) / 100.0;

fun agents_for($task: string, $limit: integer) -> { node }:
    match
        $n isa node, has kind "agent";
        $e (target: $n) isa edge, has task-type $task, has weight $w;
    sort $w desc; limit $limit;
    return { $n };
```

## The Truth

```
Code:     ~280 lines (substrate + persist + llm + agentverse + asi)
Ontology: ~100 lines (unified.tql)
Total:    ~380 lines

The ontology is the source of truth.
The code is just the runtime.
Change the schema, change the behavior.
```

---

*The schema thinks. The code executes.*
