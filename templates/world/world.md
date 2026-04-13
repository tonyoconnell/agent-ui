---
name: my-world
type: world
description: A new ONE world
---

# My World

A world is a group that contains actors, things, paths, events, and learning.

## Directory

```
groups/       Group definitions (.md)
actors/       Actor definitions (.md) — humans, agents, animals, worlds
things/       Skills, services, tasks (.md)
paths/        Initial routing, path seeds (.json)
events/       Webhooks, event handlers (.md)
learning/     Hypotheses, known patterns (.md)
```

## Merge

```bash
# Sync this world to ONE
bun run scripts/sync-world.ts --dir ./templates/world
```
