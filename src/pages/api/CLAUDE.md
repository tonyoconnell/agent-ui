# API Routes

**Skills: `/typedb` for TQL queries, `/astro` for route patterns.**

All API routes use `src/lib/typedb.ts` for TypeDB access. Browser → Cloudflare Worker → TypeDB Cloud.

## Routes

| Route | Method | Purpose | TypeDB Function |
|-------|--------|---------|-----------------|
| `/api/query` | POST | Run raw TypeQL | direct query |
| `/api/signal` | POST | Record signal + strengthen edge | insert signal, update edge |
| `/api/mark` | POST | Add strength to edge | update edge.strength |
| `/api/warn` | POST | Add alarm to edge | update edge.alarm |
| `/api/state` | GET | Full world state for UI | match units, edges, tasks, trails |
| `/api/decay` | POST | Decay all weights | asymmetric: trail 5%, alarm 20% |
| `/api/chat` | POST | AI chat endpoint | — |
| `/api/tasks` | GET/POST | List/create tasks | match/insert task |
| `/api/tasks/ready` | GET | Unblocked tasks | `ready_tasks()` (negation) |
| `/api/tasks/attractive` | GET | Tasks with strong trail | `attractive_tasks()` |
| `/api/tasks/repelled` | GET | Tasks with alarm | `repelled_tasks()` |
| `/api/tasks/exploratory` | GET | Tasks with no trail | `exploratory_tasks()` |
| `/api/tasks/[id]/complete` | POST | Complete + reinforce trail | update status, trail += 5.0 |
| `/api/auth/[...all]` | ALL | Better Auth endpoints | TypeDB auth adapter |

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

**NO `rule` syntax.** Use `fun` functions for classification. Status inference (highway, proven, attractive) happens via functions at query time, not automatic rules.
