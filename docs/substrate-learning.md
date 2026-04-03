# The Learning Substrate

70 lines. Routes messages. Trains models. Same code.

## ONE: The Meta-Abstraction

The substrate implements the ONE ontology's 6 dimensions:

| ONE Dimension | Substrate Mapping | Training/Inference |
|---------------|-------------------|-------------------|
| **Groups** | Colonies (multi-tenant isolation) | Namespace for learned weights |
| **Actors** | Units (AI, human, process) | Route targets |
| **Things** | Data, resources | Training data |
| **Paths** | Edges with drop/fade weights | The learned model |
| **Events** | Signals flowing | Training examples |
| **Knowledge** | Highways, toxic paths | Inference outputs |

The 6 dimensions ARE the training loop. Paths store what's learned. Events are training data. Knowledge emerges from inference rules.

## The Insight

Ant colonies don't have central intelligence. The paths ARE the intelligence. Pheromones encode what worked. Decay ensures exploration. Alarm pheromones encode what failed.

This is reinforcement learning without:
- Gradient descent on the router
- Centralized reward models
- Explicit policy networks

The substrate does both routing AND learning with:
```
drop(edge)           →  add weight to path
drop(edge, false)    →  resist (alarm pheromone)
fade()               →  decay / forget / explore
```

The verbs: signal, drop, follow, fade, sense.

## The Loop

```
SIGNAL arrives
    ↓
ROUTE by path weight (exploit) or random (explore)
    ↓
EXPERT generates
    ↓
ORACLE scores (human, outcome, reward model)
    ↓
DROP on path (good) or RESIST (bad)
    ↓
FADE all paths
    ↓
HIGHWAYS emerge
```

## Persistence (TypeDB)

Groups (ONE dimension 1) provide multi-tenant isolation. Each colony operates in its own group, with separate learned weights:

```typescript
// drop() → TypeDB (within a Group)
async function drop(group: string, from: string, to: string, score: number) {
  await tx.query(`
    match 
      $g isa group, has gid "${group}";
      $e isa edge, has eid "${from}→${to}";
      (container: $g, member: $e) isa membership;
      ?current = $e.weight;
    update $e has weight (?current + ${score});
  `)
}

// drop(edge, false) → TypeDB (alarm pheromone)
async function resist(group: string, from: string, to: string, score: number) {
  await tx.query(`
    match 
      $g isa group, has gid "${group}";
      $e isa edge, has eid "${from}→${to}";
      (container: $g, member: $e) isa membership;
      ?current = $e.alarm;
    update $e has alarm (?current + ${score});
  `)
}

// fade() → TypeDB (decay within a Group)
async function fade(group: string, rate = 0.1) {
  await tx.query(`
    match 
      $g isa group, has gid "${group}";
      $e isa edge, has weight $w, has alarm $a;
      (container: $g, member: $e) isa membership;
    update $e has weight ($w * ${1 - rate}), has alarm ($a * ${1 - rate});
  `)
}

// follow() → TypeDB (inference handles status)
async function follow(n = 10) {
  return tx.query(`
    match $e isa edge, has status "highway", has weight $w;
    sort $w desc; limit ${n};
    return { $e };
  `)
}

// toxic() → TypeDB (inference handles status)
async function toxic() {
  return tx.query(`
    match $e isa edge, has status "toxic";
    return { $e };
  `)
}
```

## The Three Rules (from unified.tql)

```tql
rule highway:
    when { $e isa edge, has weight $w; $w >= 50.0; }
    then { $e has status "highway"; };

rule fading:
    when { $e isa edge, has weight $w; $w > 0.0; $w < 5.0; }
    then { $e has status "fading"; };

rule toxic:
    when { $e isa edge, has alarm $a, has weight $w; $a > $w; $a >= 10.0; }
    then { $e has status "toxic"; };
```

## What This Means

| Old Way | Substrate Way |
|---------|---------------|
| Train a router model | Highways emerge from use |
| RLHF with reward model | Drop on paths from outcomes |
| Mixture of Experts with gating | Units + pheromone routing |
| Catastrophic forgetting | Fade keeps knowledge fresh |
| Safety fine-tuning | Alarm pheromones on toxic paths |

## The Units

A unit can be:
- A LoRA adapter
- A prompt template
- A full model
- A tool
- An API endpoint
- Another colony

The substrate doesn't care. It routes signals, drops on paths, fades weights. Intelligence emerges from the ONE ontology: Paths store learned weights, Events flow as training data, Knowledge crystallizes through inference rules.

## Why It Works

> "The task an ant performs depends not on any property of the individual, but on what it has experienced recently."
> — Deborah Gordon

No ant knows the colony's goal. No unit knows the system's objective. But highways form. Toxic paths clear. The swarm learns.

## ONE Ontology: The Complete Picture

```
Groups      → Multi-tenant colonies (isolation boundary)
Actors      → Units that process signals
Things      → Data flowing through the system
Paths       → Edges with drop/fade weights (THE MODEL)
Events      → Signals = immutable training examples
Knowledge   → Highways, toxic paths = inference outputs
```

The 6 dimensions aren't just a data model. They ARE the learning loop:
- **Paths** store what the system has learned (weights, alarms)
- **Events** are the training data (every signal is a training example)
- **Knowledge** emerges through inference (highway/toxic rules derive intelligence)

Training and inference collapse into the same substrate.

---

*70 lines. ONE ontology. The substrate.*

---

## See Also

- [flows.md](flows.md) — Visual flow from signals through learning to knowledge
- [signal.md](signal.md) — The primitive that generates training data
- [ontology.md](ontology.md) — Inference rules: highway, fading, toxic
- [emergence.md](emergence.md) — Five forces including stigmergic memory
- [ai-training.md](ai-training.md) — ML training/inference through the same substrate
- [typedb.md](typedb.md) — Persistence of learned weights
