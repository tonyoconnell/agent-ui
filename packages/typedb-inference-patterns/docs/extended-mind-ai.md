# Extended Mind AI: TypeDB as a Cognitive Substrate

How TypeDB classifier functions enable a new AI architecture where intelligence lives in the database, not the model.

## The Problem with Traditional AI

Traditional AI architectures keep intelligence inside the model:

```
Input → Model (intelligence inside) → Output
```

The model is a black box. Knowledge is encoded in weights. When the model restarts, it forgets context. When it makes a decision, you can't inspect why.

## The Extended Mind Hypothesis

In 1998, Andy Clark and David Chalmers proposed the Extended Mind thesis: cognitive processes can extend beyond the brain into the environment. A notebook isn't just storage — it's part of your cognitive system.

Applied to AI, this means:

```
Traditional:    Agent contains intelligence
Extended Mind:  Environment contains intelligence, agents are appendages
```

## TypeDB as Extended Mind

TypeDB's classifier functions make this concrete. Knowledge isn't just stored — it's **active**. Classifier functions evaluate on every query, and explicit `match ... update ...` pipelines materialize derived facts on a schedule. Both are visible in code, type-checked, and auditable — no hidden rule engine.

### Memory → Attribute Values

Every entity attribute is a memory:

```typeql
$item isa scored-item,
    has success-rate 0.82,      # Memory: "this works 82% of the time"
    has activity-score 75.0,    # Memory: "this is heavily used"
    has sample-count 200;       # Memory: "we've seen this 200 times"
```

### Forgetting → Value Decay

Memories can decay over time. An external process reduces values:

```typeql
# Decay activity scores by 5% (run periodically)
match
    $e isa scored-item,
        has activity-score $old;
    $old > 0.0;
    let $new = $old * 0.95;
delete $old of $e;
insert $e has activity-score $new;
```

### Learning → Reinforcement

When something succeeds, increase its score:

```typeql
# Reinforce a successful item
match
    $e isa scored-item, has item-id "item-123",
        has activity-score $old;
    let $new = $old + 5.0;
delete $old of $e;
insert $e has activity-score $new;
```

### Reasoning → Inference Rules

This is where TypeDB shines. Rules automatically derive new facts:

```typeql
rule elite-classification:
    when {
        $e isa scored-item,
            has success-rate $sr, has activity-score $as;
        $sr >= 0.75; $as >= 70.0;
    } then {
        $e has item-tier "elite";
    };
```

No agent needs to run classification logic. The **database itself reasons** about which items are elite. Query for `item-tier "elite"` and TypeDB figures it out.

### Beliefs → Chained Rules

Rules can build on other rules' outputs:

```typeql
# Rule 1: Classify quality
rule high-quality:
    when { $r has effectiveness $e; $e >= 0.7; }
    then { $r has quality-label "high"; };

# Rule 2: Detect cascades (depends on Rule 1)
rule cascade-detected:
    when {
        $source has quality-label "high";
        ($source, $derived) isa learning-chain;
        $derived has quality-label "high";
    } then {
        $source has cascade-potential true;
    };
```

Rule 2 depends on Rule 1's output. TypeDB resolves this automatically. The system develops **beliefs** (cascade potential) from **observations** (effectiveness scores) through **reasoning** (chained rules).

## Architecture Pattern

```
┌─────────────────────────────────────────────────┐
│                  TypeDB (Extended Mind)           │
│                                                   │
│  Entities    = Memories                           │
│  Attributes  = Facts & measurements               │
│  Relations   = Connections between concepts        │
│  Rules       = Automatic reasoning                 │
│  Functions   = On-demand classification            │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Rule A   │→ │ Rule B   │→ │ Rule C   │       │
│  │ classify │  │ cascade  │  │ promote  │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│       ↑              ↑              ↑             │
│       │              │              │             │
│  ┌────┴────────┬─────┴────────┬─────┴──────┐    │
│  │ Attributes  │  Relations   │  Entities   │    │
│  │ (facts)     │ (connections)│  (objects)   │    │
│  └─────────────┴──────────────┴─────────────┘    │
└─────────────────────────────────────────────────┘
         ↑ write                    ↓ read
┌─────────────────────────────────────────────────┐
│              Simple Agents / Services             │
│                                                   │
│  Agent 1: Observe → Write facts to TypeDB         │
│  Agent 2: Read inferred facts → Act               │
│  Agent 3: Write outcomes → TypeDB learns          │
│                                                   │
│  Agents are SIMPLE. TypeDB is SMART.              │
└─────────────────────────────────────────────────┘
```

## Benefits

### 1. Inspectable Intelligence

Every decision can be traced back to facts and rules:

```typeql
# Why is this item "elite"?
match
    $e isa scored-item, has item-id "item-42",
        has success-rate $sr,
        has activity-score $as,
        has sample-count $sc,
        has item-tier $tier;
select $sr, $as, $sc, $tier;
# → sr=0.82, as=85.0, sc=200, tier="elite"
# Because: sr >= 0.75 AND as >= 70.0 AND sc >= 50
```

### 2. Persistent Intelligence

Restart the application — intelligence survives:

```
Traditional: Model restarts → lose context
Extended Mind: TypeDB restarts → all rules still fire, all facts preserved
```

### 3. Composable Intelligence

Rules compose naturally. Add a new rule without changing existing ones:

```typeql
# New rule: elite items with high activity → promote
rule auto-promote:
    when {
        $e has item-tier "elite", has activity-score $as;
        $as >= 90.0;
    } then {
        $e has promotion-ready true;
    };
```

### 4. Multi-Agent Coordination

Multiple agents share the same cognitive substrate without needing to communicate directly:

```
Agent A writes: "item-42 success-rate = 0.82"
TypeDB infers:  "item-42 is elite"
Agent B reads:  "give me all elite items" → gets item-42
```

Agent A and Agent B never talk to each other. They coordinate through the shared extended mind. This is **stigmergy** — indirect coordination through the environment.

This is exactly how ant colonies work. Gordon's research on [task allocation without instructions](https://ants-at-work.com/book/2/) shows that ants coordinate through chemical signatures left in the environment — not by communicating directly. An ant reads the colony's state (pheromone trails, encounter rates with nestmates) and acts. TypeDB is the digital equivalent of the nest surface where pheromones accumulate.

## When to Use This Pattern

**Good fit:**
- Systems with many interacting agents/services
- Domain logic expressible as threshold-based classification
- Need for auditable, inspectable decision-making
- Long-running systems that need persistent knowledge
- Multi-step reasoning chains

**Not ideal for:**
- Real-time sub-millisecond decisions
- Pure statistical pattern matching (use ML models)
- Simple CRUD with no derived knowledge

## Pattern Summary

| Cognitive Function | TypeDB Mechanism | Example |
|---|---|---|
| Memory | Entity attributes | `has success-rate 0.82` |
| Forgetting | Value decay (external) | `activity * 0.95` each cycle |
| Learning | Value reinforcement | `activity + 5.0` on success |
| Reasoning | Inference rules | `when { ... } then { ... }` |
| Beliefs | Chained rules | Rule B reads Rule A's output |
| Classification | Functions | `fun elite_items() -> ...` |
| Coordination | Shared entities | Stigmergic communication |

## Further Reading

- Clark, A., & Chalmers, D. (1998). "The Extended Mind." *Analysis*, 58(1), 7-19.
- Gordon, D. M. (2010). *Ant Encounters: Interaction Networks and Colony Behavior.* — [Chapter 2: Task Allocation Without Instructions](https://ants-at-work.com/book/2/)
- TypeDB documentation: [typedb.com/docs](https://typedb.com/docs)
- Inference patterns in this repository: `patterns/` directory
