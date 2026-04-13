# Pages

**Skill: `/astro` — Use for ALL page creation. Islands architecture, SSR, hydration.**

## Routes

| Page | Route | Component | Hydration |
|------|-------|-----------|-----------|
| `index.astro` | `/` | `AgentWorkspace` | `client:load` |
| `world.astro` | `/world` | `WorldWorkspace` | `client:load` |
| `tasks.astro` | `/tasks` | `TaskBoard` | `client:load` |
| `chat.astro` | `/chat` | `Chat` | `client:load` |
| `dashboard.astro` | `/dashboard` | `Dashboard` | `client:load` |
| `discover.astro` | `/discover` | `DiscoverGrid` | `client:load` |
| `marketplace.astro` | `/marketplace` | `Marketplace` | `client:load` |
| `build.astro` | `/build` | `AgentBuilder` | `client:load` |
| `ceo.astro` | `/ceo` | `CEOPanel` | `client:load` |

## Substrate Learning

Pages are the surface of the substrate. Each page reads from the learning state:

```
/world      → highways, paths, units (the graph as it learns)
/tasks      → task priority + pheromone (what the substrate recommends)
/dashboard  → aggregate stats (how fast the system is learning)
/ceo        → governance view (which paths are toxic, which are proven)
```

SSR renders from the latest TypeDB/KV state. React islands hydrate with live pheromone data. The learning is visible — highways form, paths fade, toxic edges turn red.

**Context:** [lifecycle.md](../../docs/lifecycle.md) — what users see at each stage. [speed.md](../../docs/speed.md) — TTFB `<200ms`, FCP `<500ms`. [routing.md](../../docs/routing.md) — what the visualized paths mean.

## API Routes

See `api/CLAUDE.md` for API documentation. Core route is `POST /api/signal` —
the substrate routes internally. Legacy task routes are being collapsed.

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
