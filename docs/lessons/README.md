# Lessons: From Biology to Intelligence

> *"We don't build intelligence. We create conditions where intelligence evolves."*

---

## The Six Lessons

| # | Lesson | Theme | Pattern | Difficulty |
|---|--------|-------|---------|------------|
| 0 | [Philosophy](./00-philosophy.md) | The Emergence Thesis | — | — |
| 1 | [Perception](./01-perception.md) | Chemical Signaling | Classification | Beginner |
| 2 | [Homeostasis](./02-homeostasis.md) | Immune System | Quality Rules | Beginner+ |
| 3 | [Hypothesis](./03-hypothesis.md) | Task Switching | State Machines | Intermediate |
| 4 | [Task Allocation](./04-task-allocation.md) | Pheromone Logic | Negation | Intermediate |
| 5 | [Contribution](./05-contribution.md) | Interaction Rates | Aggregates | Intermediate+ |
| 6 | [Emergence](./06-emergence.md) | Superorganism | Autonomous Goals | Advanced |

---

## The Learning Path

Each lesson builds on the previous:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Lesson 1 (Perception):      IDENTITY — What something IS                   │
│  Lesson 2 (Homeostasis):     BOUNDARIES — What something CANNOT be          │
│  Lesson 3 (Hypothesis):      CHANGE — How states transition                 │
│  Lesson 4 (Task Allocation): AVAILABILITY — What's ready to do              │
│  Lesson 5 (Contribution):    MEASUREMENT — How much was done                │
│  Lesson 6 (Emergence):       AUTONOMY — Self-directed goals                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Each Lesson Contains

1. **Biological Parallel** — What ants do
2. **Use Cases** — Where to apply the pattern
3. **Schema** — The TypeQL entities and attributes
4. **Functions/Rules** — The inference logic
5. **Test Queries** — Verify it works
6. **Mapping Table** — Biology ↔ TypeDB concepts

---

## Quick Start

```bash
# Read the philosophy first
cat lessons/00-philosophy.md

# Work through lessons 1-6
# Each lesson builds on the previous

# Load the standalone TQL files into TypeDB
typedb console --cloud your-cluster.typedb.com:80
> transaction my-db schema write
> source standalone/classification.tql
> commit
```

---

## Choose Your Path

### The Substrate (200 lines)
All 6 patterns in one minimal file. Start here.

```bash
typedb console
> database create colony
> transaction colony schema write
> source standalone/substrate.tql
> commit

> transaction colony data write
> source standalone/seed.tql
> commit

> transaction colony read
> match let $a in elite_agents(); $a has agent-name $n; select $n;
> match let $t in attractive_tasks(); $t has title $title; select $title;
```

### The Genesis (1400+ lines)
Full colony infrastructure with swarms, hypotheses, work cycles.

```bash
> source standalone/genesis.tql
```

### Individual Lessons
Learn each pattern separately:

| Lesson | Standalone File | Lines |
|--------|-----------------|-------|
| 1. Perception | `standalone/classification.tql` | 218 |
| 2. Homeostasis | `standalone/quality-rules.tql` | 258 |
| 3. Hypothesis | `standalone/hypothesis-lifecycle.tql` | 215 |
| 4. Task Allocation | `standalone/task-management.tql` | 602 |
| 5. Contribution | `standalone/contribution-tracking.tql` | 161 |
| 6. Emergence | `standalone/autonomous-goals.tql` | 246 |

---

## The Thesis

```
Everyone has agents. No one has emergence.

We're not building intelligence.
We're building the CONDITIONS where intelligence evolves.
```

---

## Next Steps

After completing the lessons:
1. Explore [Domain Examples](../examples/)
2. Read [Extended Mind AI](../docs/extended-mind-ai.md)
3. Build your own schema
4. Deploy to TypeDB Cloud
