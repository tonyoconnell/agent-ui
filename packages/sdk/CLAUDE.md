# SDK

`@oneie/sdk` — TypeScript client for ONE substrate. Browser, Node, CLI.

**Skills:** `/react19` for hooks, `/typedb` for query patterns.

## Files

| File | Purpose |
|------|---------|
| `src/client.ts` | `SubstrateClient` — 35+ methods for all substrate verbs |
| `src/types.ts` | All response types (export from package root) |
| `src/errors.ts` | `SubstrateError` hierarchy (auth, validation, rate-limit, timeout, dissolved) |
| `src/telemetry.ts` | Universal telemetry — `emit()` fires `toolkit:sdk:<method>` signals |
| `src/react/context.tsx` | `SubstrateProvider` + `useSubstrate()` context |
| `src/react/hooks.ts` | Data-fetching hooks with caching |
| `src/react/optimistic.ts` | `useOptimisticMark`, `useOptimisticPay` |
| `src/react/stream.ts` | `streamChat`, `streamTail` for SSE |

## Usage

### Browser (singleton)
```typescript
import { sdk } from "@/lib/sdk"
const stats = await sdk.stats()
const highways = await sdk.highways(10)
```

### React Hooks
```tsx
import { useAgentList, useHighways } from "@oneie/sdk/react"
import { SdkProvider } from "@/components/providers/SdkProvider"

export function MyComponent() {
  return <SdkProvider><Inner /></SdkProvider>
}

function Inner() {
  const { data, loading, error, refetch } = useAgentList()
  const { data: highways } = useHighways(10)
}
```

### CLI / Scripts
```typescript
import { SubstrateClient } from "@oneie/sdk"
const client = new SubstrateClient({ baseUrl: process.env.ONE_API_URL, apiKey })
const res = await client.mark(edge, { fit: 0.9, form: 0.8 })
```

## Available Hooks

| Hook | API | Returns |
|------|-----|---------|
| `useAgent(uid)` | `/api/agents/:uid` | `{ data, loading, error, refetch }` |
| `useAgentList()` | `/api/agents/list` | `{ data: ListAgentsResponse, ... }` |
| `useDiscover(skill, limit?)` | `/api/agents/discover` | `{ data: DiscoverResponse, ... }` |
| `useHighways(limit?)` | `/api/loop/highways` | `{ data: HighwaysResponse, ... }` |
| `useStats()` | `/api/stats` | `{ data: Stats, ... }` |
| `useHealth()` | `/api/health` | `{ data: Health, ... }` |
| `useRevenue()` | `/api/revenue` | `{ data: RevenueResponse, ... }` |
| `useRecall(status?)` | `/api/hypotheses` | `{ data: HypothesesResponse, ... }` |

All hooks use a module-level cache — identical requests share one Promise.

## Client Methods

Core verbs:
- `signal(receiver, data?)` — L1 send
- `ask(receiver, data?, timeout?)` — L1 send + wait (4-outcome)
- `mark(edge, dims?)` — L2 strengthen
- `warn(edge, dims?)` — L2 weaken
- `fade(trailRate?, resistanceRate?)` — L3 decay
- `highways(limit?)` — L2/L6 proven paths
- `know()` — L6 harden
- `recall(status?)` — L6 query hypotheses

Commerce:
- `discover(skill, limit?)` — find agents by skill
- `hire(sellerUid, skillId)` — initiate hire
- `pay(to, task, amount)` — L4 payment
- `publish(skillId, name, price, opts?)` — list capability

Memory:
- `reveal(uid)` — full MemoryCard
- `forget(uid)` — GDPR erasure
- `frontier(uid)` — unexplored clusters

## Telemetry

Every method emits `toolkit:sdk:<method>` to substrate. Disable with:
```typescript
const client = new SubstrateClient({ baseUrl, telemetry: false })
```

## See Also

- `one/sdk-cli-integration.md` — CLI uses this SDK
- `src/components/CLAUDE.md` — component SDK patterns
- `docs/sdk.md` — public contract
