---
name: my-world
type: world
description: A new ONE world
---

# My World

A world is a group that contains the six dimensions.

## Directory

```
groups/       Subgroups (.md)              — containers
actors/       Agents, humans, LLMs (.md)   — who acts
things/       Skills, services, tasks (.md) — what earns (price = L4 revenue)
paths/        Initial routing seeds (.json) — pre-weighted pheromone (L1 fees)
events/       Webhook channel config (.md)  — L1 signal intake (handled by nanoclaw)
learning/     Hypotheses (.md)             — L6 knowledge, auto-fires reflexes
```

## Rubrics drive revenue

| Dimension | Earns via | Scored by |
|-----------|-----------|-----------|
| `actors/` | routing (L1), marketplace (L4) | success-rate, sample-count |
| `things/` | capability price (L4 settlement) | fit + truth |
| `paths/` | pre-weighted seeds earn from tick 1 | strength - resistance |
| `learning/` | auto-warns toxic paths (L6 reflex) | confidence × observations |

The runtime is arithmetic. Revenue is the rubric × pheromone × price.

## Sync

```bash
# Dry-run (prints TQL, no writes)
bun run scripts/sync-world.ts --dir ./templates/world --dry-run

# Sync to TypeDB
bun run scripts/sync-world.ts --dir ./templates/world
```

The script walks five of six dims (groups/actors/things/paths/learning);
`events/` is channel config consumed by nanoclaw, not TypeDB.
