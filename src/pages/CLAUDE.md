# Pages

**Skill: `/astro` — Use for ALL page creation. Islands architecture, SSR, hydration.**

## Routes

| Page | Route | Component | Hydration |
|------|-------|-----------|-----------|
| `index.astro` | `/` | `AgentWorkspace` | `client:load` |
| `world.astro` | `/world` | `WorldWorkspace` | `client:load` |
| `tasks.astro` | `/tasks` | `TaskBoard` | `client:load` |
| `chat.astro` | `/chat` | `Chat` | `client:load` |
| `chat-ad-buy.astro` | `/chat-ad-buy` | `AdBuyChat` | `client:load` |
| `dashboard.astro` | `/dashboard` | `Dashboard` | `client:load` |
| `discover.astro` | `/discover` | `DiscoverGrid` | `client:load` |
| `marketplace.astro` | `/marketplace` | `Marketplace` | `client:load` |
| `build.astro` | `/build` | `AgentBuilder` | `client:load` |
| `ceo.astro` | `/ceo` | `CEOPanel` | `client:load` |
| `design.astro` | `/design` | `DesignEditor` | `client:load` |
| `design/edit.astro` | `/design/edit` | `DesignEditView` | `client:load` |
| `market.astro` | `/market` | `MarketView` | `client:load` |
| `market/[sid].astro` | `/market/[sid]` | `MarketSignal` | `client:load` |
| `signup.astro` | `/signup` | `SignupForm` | `client:load` |
| `speed.astro` | `/speed` | `LifecycleSpeedrun` | `client:load` |
| `speedtest.astro` | `/speedtest` | `SpeedTest` | `client:load` |
| `team.astro` | `/team` | `TeamView` | `client:load` |
| `u/[name].astro` | `/u/[name]` | `UserProfile` | `client:load` |
| `settings/keys.astro` | `/settings/keys` | `KeysSettings` | `client:load` |
| `app/[groupId]/index.astro` | `/app/[groupId]` | `AppGroup` | `client:load` |
| `[groupId]/index.astro` | `/[groupId]` | `GroupHome` | `client:load` |

## Substrate Learning

Pages are the surface of the substrate. Each page reads from the learning state:

```
/world      → highways, paths, units (the graph as it learns)
/tasks      → task priority + pheromone (what the substrate recommends)
/dashboard  → aggregate stats (how fast the system is learning)
/ceo        → governance view (which paths are toxic, which are proven)
```

SSR renders from the latest TypeDB/KV state. React islands hydrate with live pheromone data. The learning is visible — highways form, paths fade, toxic edges turn red.

**Context:** [DSL.md](../../docs/DSL.md) — signal grammar that pages emit via `emitClick` and form actions. [dictionary.md](../../docs/dictionary.md) — canonical names for display: `unit` (not agent), `signal` (not event), `strength` (not scent). [lifecycle.md](../../docs/lifecycle.md) — what users see at each stage: `/build` = register, `/discover` = discover, `/world` = highway, `/ceo` = governance. [routing.md](../../docs/routing.md) — what the visualized paths mean; the `/world` page renders live pheromone state. [rubrics.md](../../docs/rubrics.md) — quality dimensions (fit/form/truth/taste) visible on agent cards and task completions. [patterns.md](../../docs/patterns.md) — closed loop applies to every page action: every click emits a signal, every result marks or warns. [speed.md](../../docs/speed.md) — TTFB `<200ms`, FCP `<500ms`. [buy-and-sell.md](../../docs/buy-and-sell.md) — `/marketplace` (LIST/DISCOVER) and `/discover` (Layer 2) are the commerce pages; capability cards show `capability.price`. [revenue.md](../../docs/revenue.md) — Layer 2 discovery + Layer 4 marketplace are what these pages expose to buyers and sellers.

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
