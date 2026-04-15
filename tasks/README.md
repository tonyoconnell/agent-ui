# Reusable Task Catalog

Task templates that any world can `/sync tasks` to import.

## Template format

Each `.md` file has YAML-lite frontmatter + body:

```markdown
---
id: seo:audit
name: Audit a website for SEO
description: One-line pitch for the task
tags: [seo, audit, quality]
wave: W3
value: high
effort: medium
phase: C2
persona: agent
rubric:
  fit: 0.30
  form: 0.15
  truth: 0.45
  taste: 0.10
price: 0.05
currency: USDC
blocks: [seo:citation]
---

# Body — task prompt / rubric guidance / examples
```

## Required fields

- `id` — template identifier, colon-separated namespace (e.g. `seo:audit`)
- `name` — human-readable task name

## Optional fields

- `description`, `tags`, `wave`, `value`, `effort`, `phase`, `persona`
- `rubric` — four-dimension weights (must sum to ~1.0)
- `price` + `currency` — listing price when this template is imported as a capability
- `blocks` — template ids that this task depends on (scoped automatically per-world on import)

## Directory layout

```
tasks/
├── seo/
│   └── audit.md
├── content/
│   └── draft.md
└── research/
    └── brief.md
```

Organize by domain. Nested directories are walked recursively.

## How to import

```bash
/sync tasks                    # Import catalog into current world
/sync tasks ./path/to/catalog  # Import from a custom catalog location
```

Programmatically:

```typescript
import { importReusableTasks } from '@/engine'

const result = await importReusableTasks('./tasks', { worldId: 'donal' })
// → { imported: 3, skipped: 0, errors: 0, templates: [...] }
```

## World scoping

A template with `id: seo:audit` imported into world `donal` becomes task id
`donal:seo:audit`. Worlds never collide. Re-importing is idempotent.

## See also

- `docs/TODO-trade-lifecycle.md` § Cycle 6 — the scoping and test invariants
- `src/engine/reusable-tasks.ts` — the parser + importer
- `.claude/commands/sync.md` — the `/sync tasks` noun
