# Pages

**Skill: `/astro` — Use for ALL page creation. Islands architecture, SSR, hydration.**

## Routes

| Page | Route | Component | Hydration |
|------|-------|-----------|-----------|
| `index.astro` | `/` | `AgentWorkspace` | `client:load` |
| `world.astro` | `/world` | `WorldWorkspace` | `client:load` |
| `tasks.astro` | `/tasks` | `TaskBoard` | `client:load` |
| `chat.astro` | `/chat` | `Chat` | `client:load` |

## API Routes

See `api/CLAUDE.md` for API documentation.

## Pattern

```astro
---
import Layout from "@/layouts/Layout.astro"
import { Component } from "@/components/Component"
---
<Layout title="Page">
  <Component client:load />
</Layout>
```

Always use `client:load` for interactive components. Static content needs no directive.
