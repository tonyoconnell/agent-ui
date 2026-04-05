# LOOPS.md — The Two Inference Engines

The colony runs on two parallel loops: **Deterministic** and **Probabilistic**.

The deterministic loop is the physics — guaranteed, reproducible, the same every time.
The probabilistic loop is the behavior — adaptive, exploratory, evolving.

Together, they create intelligence.

---

## The Two Loops

```
┌───────────────────────────────────────────────────────────┐
│                   DETERMINISTIC LOOP                      │
│                   (TypeDB Inference)                      │
│                                                           │
│   "What IS true?"                                         │
│                                                           │
│   • Rules fire when conditions match — ALWAYS             │
│   • Functions return exact results — REPRODUCIBLE         │
│   • State transitions are guaranteed — DETERMINISTIC      │
│   • Same input = same output — PHYSICS                    │
│                                                           │
│   This is the SUBSTRATE. The laws of nature.              │
├───────────────────────────────────────────────────────────┤
│                   PROBABILISTIC LOOP                      │
│                   (Agent Behavior)                        │
│                                                           │
│   "What SHOULD I do?"                                     │
│                                                           │
│   • Selection weighted by pheromones — BIASED             │
│   • Response thresholds vary per agent — DIVERSE          │
│   • Exploration vs exploitation — BALANCED                │
│   • Decay introduces forgetting — ADAPTIVE                │
│                                                           │
│   This is the BEHAVIOR. The choices. The evolution.       │
└───────────────────────────────────────────────────────────┘
```

---

## Loop 1: Deterministic Inference

The deterministic loop runs inside TypeDB. It answers: **"Given this data, what is true?"**

### Characteristics

| Property | Description |
|----------|-------------|
| **Trigger** | Data change (insert, update, delete) |
| **Execution** | Automatic — rules fire when conditions match |
| **Output** | Inferred attributes, classifications, state transitions |
| **Guarantee** | Same data = same inference, always |
| **Speed** | Milliseconds (query time) |

### The Deterministic Cycle

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   DATA CHANGE ─────────────────────────────────────────┐  │
│       │                                                │  │
│       ▼                                                │  │
│   ┌───────────────────────────────────────────────┐    │  │
│   │            INFERENCE ENGINE                   │    │  │
│   │                                               │    │  │
│   │   1. CLASSIFICATION (L1)                      │    │  │
│   │      success-rate >= 0.75 → elite             │    │  │
│   │                                               │    │  │
│   │   2. QUALITY RULES (L2)                       │    │  │
│   │      energy=0 + reliable=high → REJECT        │    │  │
│   │                                               │    │  │
│   │   3. STATE TRANSITIONS (L3)                   │    │  │
│   │      obs >= 100, p <= 0.05 → confirmed        │    │  │
│   │                                               │    │  │
│   │   4. AVAILABILITY (L4)                        │    │  │
│   │      no incomplete blockers → ready           │    │  │
│   │                                               │    │  │
│   │   5. AGGREGATION (L5)                         │    │  │
│   │      sum(contributions) → total               │    │  │
│   │                                               │    │  │
│   │   6. EMERGENCE (L6)                           │    │  │
│   │      expected_value >= 0.5 → spawn            │    │  │
│   │                                               │    │  │
│   └───────────────────────────────────────────────┘    │  │
│       │                                                │  │
│       ▼                                                │  │
│   INFERRED FACTS ──────────────────────────────────────┘  │
│       │                                                   │
│       └───────────────────────────────────────────────────┘
│                                                           │
│   Query → Inference → Result. Instant. Guaranteed.        │
└───────────────────────────────────────────────────────────┘
```

### What Gets Inferred

| Lesson | Input | Inferred Output |
|--------|-------|-----------------|
| L1 | Attributes (success-rate, activity) | Tier (elite, standard, at-risk) |
| L2 | State combination | Valid/Invalid, quality-label |
| L3 | Observations count, p-value | Status (pending → confirmed) |
| L4 | Dependencies, pheromone levels | Ready, attractive, repelled |
| L5 | Contribution records | Rank (elite, active, occasional) |
| L6 | Frontier metrics | Objective spawning |

### Deterministic Loop Code

```python
async def deterministic_tick(agent_id: str):
    """One tick of deterministic inference."""

    # L1: What am I?
    tier = await query("match let $a in identify_elites(); ...")

    # L3: What's my hypothesis status?
    status = await query(f"match $h has owner '{agent_id}'; ...")

    # L4: What can I work on?
    ready = await query("match let $t in ready_tasks(); ...")
    attractive = await query("match let $t in attractive_tasks(); ...")

    # L5: What have I contributed?
    contribution = await query(f"let $c = total_contribution('{agent_id}'); ...")

    # L6: Are there new frontiers?
    frontiers = await query("match let $f in promising_frontiers(); ...")

    return {
        "tier": tier,
        "ready_tasks": ready,
        "attractive_tasks": attractive,
        "contribution": contribution,
        "frontiers": frontiers
    }
```

---

## Loop 2: Probabilistic Behavior

The probabilistic loop runs in the agent runtime. It answers: **"Given these options, what should I choose?"**

### Characteristics

| Property | Description |
|----------|-------------|
| **Trigger** | Agent tick (scheduled or event-driven) |
| **Execution** | Weighted random selection from options |
| **Output** | Actions (task selection, exploration, state changes) |
| **Guarantee** | Different each time — stochastic |
| **Speed** | Depends on agent tick rate |

### The Probabilistic Cycle

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   AGENT TICK ──────────────────────────────────────────┐  │
│       │                                                │  │
│       ▼                                                │  │
│   ┌───────────────────────────────────────────────┐    │  │
│   │            BEHAVIOR ENGINE                    │    │  │
│   │                                               │    │  │
│   │   1. GET OPTIONS (from deterministic loop)    │    │  │
│   │      ready = [A, B, C, D]                     │    │  │
│   │      attractive = [A]                         │    │  │
│   │      exploratory = [D]                        │    │  │
│   │                                               │    │  │
│   │   2. CALCULATE WEIGHTS                        │    │  │
│   │      P(task) = pheromone^α * heuristic^β      │    │  │
│   │                                               │    │  │
│   │   3. APPLY RESPONSE THRESHOLD                 │    │  │
│   │      if random() < threshold: consider switch │    │  │
│   │                                               │    │  │
│   │   4. WEIGHTED RANDOM SELECTION                │    │  │
│   │      selected = random.choices(weights)       │    │  │
│   │                                               │    │  │
│   │   5. EXECUTE ACTION                           │    │  │
│   │      outcome = perform(selected)              │    │  │
│   │                                               │    │  │
│   │   6. UPDATE PHEROMONES                        │    │  │
│   │      success → reinforce trail (+5.0)         │    │  │
│   │      failure → deposit alarm (+8.0)           │    │  │
│   │                                               │    │  │
│   └───────────────────────────────────────────────┘    │  │
│       │                                                │  │
│       ▼                                                │  │
│   GRAPH MODIFIED ──────────────────────────────────────┘  │
│       │                                                   │
│       └──► TRIGGERS DETERMINISTIC LOOP                    │
└───────────────────────────────────────────────────────────┘
```

### Probabilistic Mechanisms

#### 1. Pheromone-Weighted Selection

```python
def select_task_probabilistic(ready_tasks, pheromone_network):
    """Select task based on pheromone weights (ACO)."""

    weights = []
    for task in ready_tasks:
        pheromone = pheromone_network.get(task.id, 1.0)
        alpha, beta = 1.0, 2.0
        heuristic = task.priority_score
        weight = (pheromone ** alpha) * (heuristic ** beta)
        weights.append(weight)

    # Normalize and select
    total = sum(weights)
    probs = [w / total for w in weights]
    return random.choices(ready_tasks, weights=probs, k=1)[0]
```

#### 2. Response Threshold Variation

```python
class Agent:
    def __init__(self):
        # Population variance — some sensitive, some persistent
        self.threshold = random.gauss(0.5, 0.15)
        self.threshold = max(0.1, min(0.9, self.threshold))

    def should_switch(self, signal_strength: float) -> bool:
        prob = signal_strength / (signal_strength + self.threshold)
        return random.random() < prob
```

#### 3. Exploration vs Exploitation

```python
def explore_or_exploit(attractive, exploratory, ready):
    """Balance following trails vs discovering new paths."""

    if random.random() < 0.1:  # 10% explore
        if exploratory:
            return random.choice(exploratory)

    if attractive:
        return select_task_probabilistic(attractive)

    return random.choice(ready)
```

#### 4. Pheromone Decay

```python
async def decay_cycle():
    """Forgetting is intelligence."""
    await query("""
        match $trail isa pheromone-trail,
            has trail-pheromone $tp, has alarm-pheromone $ap;
        let $new_tp = $tp * 0.95;   # 5% decay
        let $new_ap = $ap * 0.80;   # 20% decay (faster)
        delete $tp of $trail; delete $ap of $trail;
        insert $trail has trail-pheromone $new_tp,
                      has alarm-pheromone $new_ap;
    """)
```

---

## How The Loops Interact

```
┌───────────────────────────────────────────────────────────┐
│              THE COMPLETE ARCHITECTURE                    │
│                                                           │
│   ┌───────────────────────────────────────────────────┐   │
│   │              PROBABILISTIC LOOP                   │   │
│   │              (Agent Runtime)                      │   │
│   │                                                   │   │
│   │   Agent001    Agent002    Agent003    Agent004    │   │
│   │      │           │           │           │        │   │
│   │      └─────┬─────┴─────┬─────┴─────┬─────┘        │   │
│   │            │           │           │              │   │
│   │         SELECT      SELECT      SELECT            │   │
│   │        (weighted)  (weighted)  (weighted)         │   │
│   │                                                   │   │
│   └───────────────────────┬───────────────────────────┘   │
│                           │                               │
│                           ▼ ACTIONS                       │
│   ┌───────────────────────────────────────────────────┐   │
│   │                  TYPEDB GRAPH                     │   │
│   │                                                   │   │
│   │   agents ── tasks ── trails ── hypotheses         │   │
│   │                                                   │   │
│   └───────────────────────┬───────────────────────────┘   │
│                           │                               │
│                           ▼ TRIGGERS                      │
│   ┌───────────────────────────────────────────────────┐   │
│   │              DETERMINISTIC LOOP                   │   │
│   │              (TypeDB Inference)                   │   │
│   │                                                   │   │
│   │   L1:classify → L2:validate → L3:transition →     │   │
│   │   L4:ready → L5:aggregate → L6:spawn              │   │
│   │                                                   │   │
│   └───────────────────────┬───────────────────────────┘   │
│                           │                               │
│                           ▼ OPTIONS                       │
│   ┌───────────────────────────────────────────────────┐   │
│   │                                                   │   │
│   │   ready_tasks = [A, B, C]                         │   │
│   │   attractive_tasks = [A]                          │   │
│   │   exploratory_tasks = [D]                         │   │
│   │   elite_agents = [001, 003]                       │   │
│   │   spawned_objectives = [O1]                       │   │
│   │                                                   │   │
│   └───────────────────────┬───────────────────────────┘   │
│                           │                               │
│                           ▼ READ                          │
│   ┌───────────────────────────────────────────────────┐   │
│   │              PROBABILISTIC LOOP                   │   │
│   │                  ... CONTINUES ...                │   │
│   └───────────────────────────────────────────────────┘   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## The Complete Tick

```python
async def colony_tick():
    """One complete tick of the colony."""

    # ══════════════════════════════════════════════════════
    # PHASE 1: DETERMINISTIC INFERENCE
    # ══════════════════════════════════════════════════════
    ready = await query("match let $t in ready_tasks(); ...")
    attractive = await query("match let $t in attractive_tasks(); ...")
    exploratory = await query("match let $t in exploratory_tasks(); ...")
    frontiers = await query("match let $f in promising_frontiers(); ...")

    # ══════════════════════════════════════════════════════
    # PHASE 2: PROBABILISTIC SELECTION
    # ══════════════════════════════════════════════════════
    for agent in active_agents:
        if agent.should_switch(signal_strength=len(attractive)):
            if random.random() < EXPLORATION_RATE:
                selected = random.choice(exploratory or ready)
            else:
                selected = select_task_probabilistic(attractive or ready)
            agent.assign_task(selected)

    # ══════════════════════════════════════════════════════
    # PHASE 3: EXECUTION
    # ══════════════════════════════════════════════════════
    for agent in active_agents:
        if agent.current_task:
            outcome = await agent.execute_tick()
            if outcome.completed:
                await record_contribution(agent, outcome)
                if outcome.success:
                    await reinforce_trail(+5.0)
                else:
                    await deposit_warn(+8.0)

    # ══════════════════════════════════════════════════════
    # PHASE 4: DECAY
    # ══════════════════════════════════════════════════════
    if tick_count % DECAY_INTERVAL == 0:
        await decay_pheromones()

    # ══════════════════════════════════════════════════════
    # PHASE 5: SPAWN
    # ══════════════════════════════════════════════════════
    for frontier in frontiers:
        if not frontier.has_objective:
            await spawn_objective(frontier)

    # Loop continues... graph modified → new inference → new options
```

---

## Summary

| Aspect | Deterministic | Probabilistic |
|--------|--------------|---------------|
| **Where** | TypeDB | Agent Runtime |
| **When** | On query | On tick |
| **What** | Classification, validation | Selection, exploration |
| **How** | Inference rules | Weighted random |
| **Output** | Facts (what IS) | Actions (what to DO) |
| **Guarantee** | Reproducible | Stochastic |

---

## Why Both Are Necessary

**Deterministic only:**
- All agents make identical decisions
- No exploration, only exploitation
- Converges to local optima

**Probabilistic only:**
- No shared understanding
- Agents contradict each other
- Chaos, not emergence

**Together:**
- Deterministic provides OPTIONS
- Probabilistic provides SELECTION
- Selection modifies graph
- Graph triggers new inference
- **Intelligence evolves**

---

## The Equation

```
EMERGENCE = DETERMINISTIC_SUBSTRATE + PROBABILISTIC_BEHAVIOR + TIME
```

The substrate provides the physics.
The behavior provides the choices.
Time allows iteration.
Intelligence is what emerges.
