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
