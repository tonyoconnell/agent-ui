# API Routes

**Skills: `/typedb` for TQL queries, `/astro` for route patterns.**

All API routes use `src/lib/typedb.ts` for TypeDB access. Browser → Cloudflare Worker → TypeDB Cloud.

## Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/signal` | POST | Send signal into substrate, mark pheromone |
| `/api/tick` | GET | Run one growth cycle (interval-gated, 60s default) |
| `/api/state` | GET | Full world state for UI (units, edges, tags) |
| `/api/stats` | GET | Aggregate stats (units, skills, highways, revenue) |
| `/api/tasks` | GET/POST | List skills with pheromone categories. Create skill with tags |
| `/api/tasks/:category` | GET | Filter by category: ready, attractive, repelled, exploratory |
| `/api/tasks/:id/complete` | POST | Mark outcome (reinforce/alarm path + update success-rate) |
| `/api/tasks/import-roadmap` | POST | Seed roadmap as tagged skills + paths |
| `/api/decay` | POST | Manual decay trigger |
| `/api/decay-cycle` | POST | Decay with before/after stats |
| `/api/query` | POST | Run raw TypeQL |
| `/api/chat` | POST | AI chat endpoint (OpenRouter streaming) |
| `/api/auth/[...all]` | ALL | Better Auth endpoints |
| `/api/agents/:id/commend` | POST | Boost agent success-rate +0.1, strengthen outgoing paths |
| `/api/agents/:id/flag` | POST | Lower agent success-rate -0.15, add resistance to paths |
| `/api/agents/:id/status` | POST | Set agent status active/inactive |

## tick.ts caching

`GET /api/tick` caches the `PersistentWorld` at module level. TypeDB is loaded once; pheromone accumulates in-process between ticks. Add `?reload=1` to force a fresh TypeDB hydration.

## Tags

Skills and units use flat tags for classification. Filter with `?tag=build&tag=P0`:

```
GET /api/tasks?tag=P0&tag=commerce     # P0 commerce tasks
GET /api/tasks/attractive?tag=build    # attractive build tasks
```

## Pattern

```typescript
import type { APIRoute } from 'astro'
import { read, write, readParsed } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json()
  const rows = await readParsed(`match ...`)
  return new Response(JSON.stringify({ rows }))
}
```

## TypeDB 3.x Note

**NO `rule` syntax.** Use `fun` functions for classification. Status inference (highway, proven) happens via functions at query time, not automatic rules.
