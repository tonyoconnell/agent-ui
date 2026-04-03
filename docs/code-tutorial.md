# Code Tutorial: The Unified Substrate

**180 lines. One entity. One relation. Complete system.**

This document teaches you everything you need to understand to refactor the entire system using the unified substrate.

---

## Table of Contents

1. [The Philosophy](#1-the-philosophy)
2. [The Data Model](#2-the-data-model)
3. [The Signal](#3-the-signal)
4. [The TypeQL Schema](#4-the-typeql-schema)
5. [The Python Substrate](#5-the-python-substrate)
6. [How Signals Flow](#6-how-signals-flow)
7. [How Learning Happens](#7-how-learning-happens)
8. [Patterns](#8-patterns)
9. [Migration Guide](#9-migration-guide)
10. [Quick Reference](#10-quick-reference)

---

## 1. The Philosophy

### The Old Way

```
agent entity     → 50 attributes, 10 relations
task entity      → 30 attributes, 8 relations
protocol entity  → 20 attributes, 5 relations
swarm entity     → 15 attributes, 6 relations
...
1800+ lines of schema
```

### The New Way

```
node entity      → 5 attributes
edge relation    → 4 attributes
...
80 lines of schema
```

### Why?

**Everything that receives a signal is a node.**

- An agent? Node.
- A task? Node.
- A protocol? Node.
- A swarm? Node.
- A unit? Node.

They differ only in their `kind` attribute, not their structure.

**Everything we learn is stored on edges.**

- Which path works? Edge weight.
- How many successes? Edge hits.
- How many failures? Edge misses.

### The Core Insight

```
The substrate doesn't care WHAT flows through it.
It only cares WHERE things go and WHAT WORKS.

Everything else is data.
```

---

## 2. The Data Model

### Two Primitives

```
NODE ──────edge──────▶ NODE
              │
           weight
           hits
           misses
```

That's the entire data model.

### Node

A node is anything that can receive a signal.

```
┌─────────────────────────────────────┐
│              NODE                   │
├─────────────────────────────────────┤
│  id        "payment-stripe"         │  ← unique identifier
│  kind      "protocol"               │  ← what type of node
│  category  "payment"                │  ← for routing/grouping
│  schema    "{...}"                  │  ← JSON (optional)
│  status    "ready"                  │  ← current state
└─────────────────────────────────────┘
```

### Edge

An edge is a weighted connection between two nodes. It stores what we've learned.

```
┌─────────────────────────────────────┐
│              EDGE                   │
├─────────────────────────────────────┤
│  source    node A                   │  ← where signal came from
│  target    node B                   │  ← where signal went
│  weight    15.2                     │  ← cumulative strength
│  hits      142                      │  ← successful traversals
│  misses    8                        │  ← failed traversals
│  status    "highway"                │  ← inferred state
└─────────────────────────────────────┘
```

### Node Kinds

| kind | what it represents |
|------|-------------------|
| `"unit"` | A processor that handles signals |
| `"protocol"` | A ONE Protocol handler (stripe, solana, smtp) |
| `"task"` | A unit of work |
| `"agent"` | A human or AI actor |
| `"swarm"` | A dynamic team |

You can add more kinds. The substrate doesn't care.

---

## 3. The Signal

The signal is what flows through the substrate.

```python
@dataclass
class Signal:
    receiver: str       # "unit:task" or just "unit"
    data: Any = None    # anything
```

### Receiver Format

```
"scout"           → signal to scout's default task
"scout:observe"   → signal to scout's observe task
"payment:stripe"  → signal to payment unit's stripe task
```

### Examples

```python
# Simple
Signal("scout", {"tick": 42500})

# With task
Signal("scout:observe", {"tick": 42500})

# With complex data
Signal("payment:stripe", {
    "amount": 1000,
    "currency": "usd",
    "metadata": {"order_id": "abc123"}
})
```

### The Rule

```
Two fields. That's all that flows.

receiver: who
data: what
```

---

## 4. The TypeQL Schema

### Full Schema (80 lines)

```typeql
define

# ONE ENTITY
entity node,
    owns id @key,
    owns kind,
    owns category,
    owns schema,
    owns status,
    plays edge:source,
    plays edge:target;

# ONE RELATION
relation edge,
    owns eid @key,
    relates source,
    relates target,
    owns weight,
    owns hits,
    owns misses,
    owns status;

# ATTRIBUTES
attribute id, value string;
attribute eid, value string;
attribute kind, value string;
attribute category, value string;
attribute schema, value string;
attribute status, value string;
attribute weight, value double;
attribute hits, value integer;
attribute misses, value integer;
```

### Inference Rules

Rules fire automatically when data matches.

```typeql
# Highway: strong edge
rule highway:
    when {
        $e isa edge, has weight $w;
        $w >= 50.0;
    } then {
        $e has status "highway";
    };

# Fading: weak edge
rule fading:
    when {
        $e isa edge, has weight $w;
        $w > 0.0;
        $w < 5.0;
    } then {
        $e has status "fading";
    };
```

**What this means:**
- Insert an edge with weight >= 50 → automatically gets `status: "highway"`
- Insert an edge with weight < 5 → automatically gets `status: "fading"`
- You don't compute this. TypeDB does.

### Inference Functions

Functions are queries you call explicitly.

```typeql
# Best protocol for a category
fun best($cat: string) -> node:
    match
        $n isa node, has kind "protocol", has category $cat;
        (target: $n) isa edge, has weight $w;
    sort $w desc;
    limit 1;
    return $n;
```

**What this means:**
- Call `best("payment")` → returns the protocol with strongest edges
- Not hardcoded. Learned from actual usage.

### All Functions

| Function | Returns | Use |
|----------|---------|-----|
| `best($cat)` | Single node | Best protocol for category |
| `fallback($id)` | Single node | Next best after primary fails |
| `highways()` | Set of edges | All proven paths |
| `fading()` | Set of edges | Paths that need reinforcement |
| `rate($id)` | Double | Success rate for a node |
| `protocols($cat)` | Set of nodes | All protocols in category |
| `ready()` | Set of nodes | All ready units |

---

## 5. The Python Substrate

### Core Classes

#### Signal

```python
@dataclass
class Signal:
    receiver: str
    data: Any = None
```

#### Unit

A unit processes signals.

```python
class Unit:
    def __init__(self, id: str, route: Callable = None):
        self.id = id
        self._route = route      # how to send signals out
        self._tasks = {}         # task_name -> function
        self._next = {}          # task_name -> continuation template

    def on(self, name: str, fn: Task) -> Unit:
        """Register a task handler."""
        self._tasks[name] = fn
        return self

    def then(self, name: str, template: Template) -> Unit:
        """Register a continuation (what happens after task completes)."""
        self._next[name] = template
        return self
```

#### Colony

The colony is the substrate - the container for all units.

```python
class Colony:
    def __init__(self, db=None):
        self.units = {}          # id -> Unit
        self.scent = {}          # edge -> weight (pheromone trails)
        self._db = db            # optional TypeDB connection

    def spawn(self, id: str) -> Unit:
        """Create a new unit."""

    def signal(self, signal: Signal, from_: str = "entry") -> None:
        """Send a signal through the substrate."""

    def drop(self, edge: str, hit: bool = True) -> None:
        """Reinforce or weaken an edge."""

    def fade(self, rate: float = 0.1) -> None:
        """Decay all edges. Forgetting is intelligence."""

    def highways(self, limit: int = 10) -> list:
        """Get top edges by weight."""
```

### The Factory

```python
def colony(db=None) -> Colony:
    """Create a new colony instance."""
    return Colony(db=db)
```

### Task Function Signature

Every task handler receives three arguments:

```python
def my_task(data, emit, ctx):
    # data: the data from the signal
    # emit: function to send more signals
    # ctx: {"from": "who sent this", "self": "my address"}

    # Do work...
    result = process(data)

    # Optionally emit more signals
    emit(Signal("other:task", {"data": result}))

    # Return result (used by continuations)
    return result
```

---

## 6. How Signals Flow

### Step by Step

```
1. SIGNAL
   colony.signal(Signal("scout:observe", {"tick": 42500}))

2. PARSE
   receiver = "scout:observe"
   unit_id = "scout"
   task_name = "observe"

3. DROP
   edge = "entry->scout:observe"
   scent[edge] += 1.0

4. DISPATCH
   unit = units["scout"]
   unit(signal, from_="entry")

5. EXECUTE
   task = unit._tasks["observe"]
   result = task(data, emit, ctx)

6. CONTINUE (if .then defined)
   next_signal = unit._next["observe"](result)
   colony.signal(next_signal, from_="scout:observe")
```

### Visual Flow

```
         ┌─────────────────────────────────────────────┐
         │                                             │
   entry │   ┌───────┐      ┌─────────┐      ┌──────┐ │
    ─────┼──▶│ scout │─────▶│ analyst │─────▶│trader│ │
         │   │       │      │         │      │      │ │
         │   │observe│      │ analyze │      │execute│
         │   └───────┘      └─────────┘      └──────┘ │
         │       │               │              │     │
         │    drop()          drop()         drop()   │
         │       │               │              │     │
         │       ▼               ▼              ▼     │
         │   ┌─────────────────────────────────────┐  │
         │   │             SCENT                   │  │
         │   │  entry->scout:observe      15.2    │  │
         │   │  scout:observe->analyst    12.8    │  │
         │   │  analyst->trader:execute    8.4    │  │
         │   └─────────────────────────────────────┘  │
         │                                             │
         └─────────────────────────────────────────────┘
```

### Context Flow

Every task knows who it is and who called it:

```python
.on("observe", lambda data, emit, ctx: (
    # ctx["from"] = "entry" (who sent the signal)
    # ctx["self"] = "scout:observe" (my full address)

    # Reply to sender
    emit(Signal(ctx["from"], {"response": "done"}))
))
```

---

## 7. How Learning Happens

Weight can come from multiple sources. The substrate doesn't care.

### Mode 1: Simple (Activity-Based)

```python
# Every signal strengthens the edge
def signal(self, sig, from_="entry"):
    if target:
        edge = f"{from_}->{sig.receiver}"
        self.drop(edge)  # +1.0 weight
        target(sig, from_)

# Periodic decay
def fade(self, rate=0.1):
    for edge in self.scent:
        self.scent[edge] *= (1 - rate)  # -10%
        if self.scent[edge] < 0.01:
            del self.scent[edge]  # forget
```

### Mode 2: Staking (Token-Based)

```python
# Stake tokens on edge
colony.stake("agent", "task", 10.0)    # 10 tokens at risk

# Resolve outcome
colony.resolve("agent", "task", success=True)   # 10 → 12 (+20%)
colony.resolve("agent", "task", success=False)  # 10 → 9 (-10%)

# Withdraw to balance
colony.withdraw("agent", "task")       # edge → balance
```

### The Math

```
+20% / -10% means:
  Break-even at 33% success rate
  Succeed more than 1/3 → profit
  Natural selection for competence
```

### Both Modes Together

```python
# Activity adds weight
colony.signal(sig)              # +1

# Success/failure multiplies weight
colony.resolve(agent, task, success=True)   # ×1.2
colony.resolve(agent, task, success=False)  # ×0.9

# Time decays weight
colony.fade(0.1)                # ×0.9

# All affect the same number: edge weight
```

### The Learning Loop

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   DAY 1: Equal weights                                       │
│   ────────────────────                                       │
│   entry -> payment:stripe     1.0                            │
│   entry -> payment:solana     1.0                            │
│   entry -> payment:paypal     1.0                            │
│                                                              │
│   DAY 30: Patterns emerge                                    │
│   ───────────────────────                                    │
│   entry -> payment:stripe    45.2   ← works best             │
│   entry -> payment:solana    12.8   ← sometimes works        │
│   entry -> payment:paypal     0.3   ← fading (failures)      │
│                                                              │
│   DAY 60: Highways form                                      │
│   ─────────────────────                                      │
│   entry -> payment:stripe    89.5   ★ HIGHWAY                │
│   entry -> payment:solana    18.4                            │
│   entry -> payment:paypal    (deleted - decayed to 0)        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Inference Takes Over

Once edges have weight, TypeDB inference kicks in:

```typeql
# Automatically classified as highway
rule highway:
    when { $e isa edge, has weight $w; $w >= 50.0; }
    then { $e has status "highway"; };

# Query best protocol - returns what ACTUALLY WORKS
fun best($cat) -> node:
    match
        $n isa node, has kind "protocol", has category $cat;
        (target: $n) isa edge, has weight $w;
    sort $w desc;
    limit 1;
    return $n;
```

---

## 8. Patterns

### Pattern 1: Request / Response

```python
net.spawn("client") \
    .on("ask", lambda p, emit, ctx:
        emit(Signal("server:answer", {
            "question": p["q"],
            "reply_to": ctx["self"]  # include return address
        }))
    ) \
    .on("response", lambda p, emit, ctx:
        print(f"Got answer: {p['answer']}")
    )

net.spawn("server") \
    .on("answer", lambda p, emit, ctx:
        emit(Signal(p["reply_to"], {
            "answer": compute(p["question"])
        }))
    )

# Use
net.signal(Signal("client:ask", {"q": "What is 2+2?"}))
```

### Pattern 2: Pipeline (Continuations)

```python
net.spawn("ingest") \
    .on("data", lambda p, emit, ctx: parse(p)) \
    .then("data", lambda r: Signal("transform:process", r))

net.spawn("transform") \
    .on("process", lambda p, emit, ctx: transform(p)) \
    .then("process", lambda r: Signal("store:save", r))

net.spawn("store") \
    .on("save", lambda p, emit, ctx: save(p))

# One signal flows through entire pipeline
net.signal(Signal("ingest:data", raw_data))
```

### Pattern 3: Fan Out

```python
net.spawn("broadcaster") \
    .on("publish", lambda p, emit, ctx: (
        emit(Signal("subscriber1:notify", p)),
        emit(Signal("subscriber2:notify", p)),
        emit(Signal("subscriber3:notify", p)),
    ))
```

### Pattern 4: Exclusive Claim

```python
claims = {}

net.spawn("coordinator") \
    .on("claim", lambda p, emit, ctx: (
        # First to claim wins
        claims.setdefault(p["task_id"], ctx["from"]) == ctx["from"] and
        emit(Signal(ctx["from"], {"status": "claimed", "task": p["task_id"]}))
    ))
```

### Pattern 5: Protocol Selection (ONE Protocol)

```python
async def smart_signal(colony, category, data, db):
    # Query TypeDB for best protocol
    best = await db.query(f"""
        match let $n = best("{category}");
        $n has id $id;
        fetch $id;
    """)

    if best:
        colony.signal(Signal(f"{category}:{best['id']}", data))
    else:
        # Fallback to first available
        colony.signal(Signal(f"{category}:default", data))
```

### Pattern 6: Self-Healing

```python
net.spawn("payment") \
    .on("process", lambda p, emit, ctx: (
        try_payment(p) or (
            # Mark failure
            colony.drop(f"{ctx['from']}->{ctx['self']}", hit=False),
            # Try fallback
            emit(Signal("payment:fallback", p))
        )
    )) \
    .on("fallback", lambda p, emit, ctx:
        try_alternative_payment(p)
    )
```

---

## 9. Migration Guide

### From genesis.tql

| Old | New |
|-----|-----|
| `entity agent` | `node` with `kind: "agent"` |
| `entity task` | `node` with `kind: "task"` |
| `entity swarm` | `node` with `kind: "swarm"` |
| `entity hypothesis` | `node` with `kind: "hypothesis"` |
| `entity frontier` | `node` with `kind: "frontier"` |
| `relation pheromone-trail` | `edge` |
| `relation dependency` | `edge` with metadata in `schema` |
| `relation assignment` | `edge` from agent to task |
| 17 inference rules | 2 rules (highway, fading) |
| 50+ functions | 7 functions |

### From substrate.ts

| Old | New |
|-----|-----|
| TypeScript | Python |
| `unit()` | `Unit` class |
| `colony()` | `Colony` class |
| `scent: Record<string, number>` | `self.scent: dict` |
| `spawn(id)` | `colony.spawn(id)` |
| `signal(signal)` | `colony.signal(signal)` |
| `drop(edge)` | `colony.drop(edge)` |
| `fade(rate)` | `colony.fade(rate)` |
| `highways()` | `colony.highways()` |

### Data Migration

```typeql
# Old: Insert agent
insert $a isa agent,
    has agent-id "scout",
    has agent-name "Scout",
    has agent-type "ai";

# New: Insert node
insert $n isa node,
    has id "scout",
    has kind "agent",
    has category "ai",
    has status "ready";
```

```typeql
# Old: Insert pheromone-trail
insert $t (source-task: $a, destination-task: $b) isa pheromone-trail,
    has trail-pheromone 15.2,
    has alarm-pheromone 0.0;

# New: Insert edge
insert $e (source: $a, target: $b) isa edge,
    has eid "a->b",
    has weight 15.2,
    has hits 100,
    has misses 5;
```

### What You Lose (And Why It's OK)

| Lost | Why OK |
|------|--------|
| Separate entity types | `kind` attribute distinguishes them |
| Complex role-playing | Single edge relation covers it |
| 17 inference rules | 2 rules cover the essential classification |
| 50+ functions | 7 functions cover essential queries |
| Swarm infrastructure | Add back when needed with `kind: "swarm"` |
| Hypothesis lifecycle | Add back when needed with `kind: "hypothesis"` |

### What You Gain

| Gain | Why Important |
|------|---------------|
| 10x less code | Easier to understand, debug, maintain |
| Single entity type | No schema changes to add new node types |
| Uniform queries | Same pattern for all nodes |
| Simpler inference | Faster queries, less complexity |
| ONE Protocol ready | Protocols are just nodes with schemas |

---

## 10. Quick Reference

### Create Colony

```python
from unified import colony, Signal

net = colony()
```

### Spawn Unit

```python
net.spawn("unit_id") \
    .on("task_name", handler_function) \
    .then("task_name", continuation_template)
```

### Handler Function

```python
def handler(data, emit, ctx):
    # data: the data
    # emit: function to send more signals
    # ctx: {"from": sender, "self": my_address}

    # Do work
    result = process(data)

    # Emit signals
    emit(Signal("other:task", result))

    # Return for continuation
    return result
```

### Send Signal

```python
net.signal(Signal("receiver:task", data))
```

### Check Learning

```python
# Top paths
net.highways()  # [("entry->scout", 15.2), ...]

# Specific edge
net.follow("entry->scout")  # 15.2
```

### Decay

```python
# Decay all edges by 10%
net.fade(0.1)
```

### Staking (Optional)

```python
# Give agent tokens
net.balances["agent"] = 100.0
net.fund(1000.0)  # reward pool

# Stake
net.stake("agent", "task", 10.0)

# Resolve (+20% success, -10% failure)
net.resolve("agent", "task", success=True)

# Withdraw
net.withdraw("agent", "task")
```

### TypeDB Queries

```typeql
# Best protocol for payment
match let $n = best("payment"); $n has id $id; fetch $id;

# All highways
match let $e in highways();
$e (source: $a, target: $b), has weight $w;
$a has id $aid; $b has id $bid;
fetch $aid, $bid, $w;

# Success rate
match let $r = rate("payment-stripe"); fetch $r;

# Fallback
match let $n = fallback("payment-stripe"); $n has id $id; fetch $id;
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   UNIFIED SUBSTRATE                                             │
│   ─────────────────                                             │
│                                                                 │
│   ~200 lines total                                              │
│                                                                 │
│   ONE entity:    node (id, kind, category, schema, status)      │
│   ONE relation:  edge (source, target, weight, hits, misses)    │
│   ONE signal:    { receiver, data }                             │
│                                                                 │
│   TWO MODES:                                                    │
│   ──────────                                                    │
│   Simple:   signal() → +1, fade() → ×0.9                         │
│   Staking:  stake() → risk, resolve() → +20%/-10%               │
│                                                                 │
│   Weight is weight. Tokens or pheromone. Same math.             │
│                                                                 │
│   Learning:   automatic (activity, success, failure, decay)     │
│   Inference:  automatic (rules fire on data)                    │
│   Routing:    learned (best() returns what works)               │
│   Economics:  optional (stake, resolve, withdraw)               │
│                                                                 │
│   Everything is a node.                                         │
│   Learning is on edges.                                         │
│   The substrate doesn't care what flows through it.             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*~200 lines. One entity. One relation. Two modes. The substrate.*

---

## See Also

- [flows.md](flows.md) — How nodes and edges flow through the complete lifecycle
- [code.md](code.md) — Concise 70-line substrate reference
- [tutorial.md](tutorial.md) — Quick-start introduction
- [metaphors.md](metaphors.md) — Same substrate, seven domain vocabularies
- [ai-training.md](ai-training.md) — ML training as path-weight accumulation
- [ontology.md](ontology.md) — TypeDB schema for inference
