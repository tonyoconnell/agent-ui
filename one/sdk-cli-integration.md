# SDK + CLI Integration

**Status:** Foundation Complete ✅ · First Components Migrated ✅  
**Goal:** CLI uses SDK internally; components use SDK hooks — one source of truth for substrate API

---

## What's Done

### CLI Foundation
1. ✅ **CLI added to workspaces** — `packages/cli` in root package.json
2. ✅ **SDK as CLI dependency** — `@oneie/sdk: workspace:*` linked
3. ✅ **SDK client factory** — `packages/cli/src/lib/sdk.ts` with `getClient()`
4. ✅ **Output helper** — `output()` function in `output.ts`
5. ✅ **Build verified** — `bun install && bun run build:pkgs` passes
6. ✅ **7 commands migrated** — stats, health, highways, mark, warn, fade, revenue

### Main Repo (src/components) Integration
7. ✅ **5 new React hooks** — useAgentList, useStats, useHealth, useRevenue, useRecall
8. ✅ **SdkProvider** — wraps components with SubstrateClient context
9. ✅ **AgentList migrated** — first component using SDK hook (useAgentList)

---

## Current State

```
@oneie/sdk (0.6.0)          oneie CLI (3.7.0)
├── SubstrateClient         ├── apiRequest() ← duplicates SDK
├── 35+ methods             ├── 35+ commands ← each calls apiRequest
├── telemetry.ts            ├── telemetry.ts ← duplicated
├── errors.ts               └── commands/*.ts
├── types.ts
└── react hooks

Problem: CLI reimplements what SDK already has.
```

---

## Target Architecture

```
@oneie/sdk (0.7.0)                    oneie CLI (4.0.0)
├── SubstrateClient ─────────────────→ import { SubstrateClient } from "@oneie/sdk"
├── telemetry (universal) ───────────→ import { emit } from "@oneie/sdk/telemetry"
├── errors ──────────────────────────→ import { SubstrateError } from "@oneie/sdk/errors"
├── types ───────────────────────────→ import type { ... } from "@oneie/sdk"
└── react hooks                       │
                                      └── commands/*.ts (thin wrappers)
                                          - parse args
                                          - call sdk.method()
                                          - format output
```

---

## Integration Steps

### 1. Add CLI to Workspaces

```json
// package.json (root)
{
  "workspaces": [
    "packages/sdk",
    "packages/cli",   // ← ADD
    "packages/mcp",
    "packages/templates"
  ]
}
```

### 2. Add SDK as CLI Dependency

```json
// packages/cli/package.json
{
  "dependencies": {
    "@oneie/sdk": "workspace:*",
    // ... existing deps
  }
}
```

### 3. Update CLI Commands to Use SDK

**Before:**
```typescript
// packages/cli/src/commands/mark.ts
import { apiRequest } from "../lib/http.js";
export async function run(argv: string[]): Promise<void> {
  const res = await apiRequest("/api/loop/mark-dims", { method: "POST", body });
  console.log(JSON.stringify(res, null, 2));
}
```

**After:**
```typescript
// packages/cli/src/commands/mark.ts
import { SubstrateClient } from "@oneie/sdk";
import { getConfig } from "../lib/config.js";
import { output } from "../lib/output.js";

export async function run(argv: string[]): Promise<void> {
  const { baseUrl, apiKey } = getConfig();
  const sdk = new SubstrateClient({ baseUrl, apiKey });
  const res = await sdk.mark(edge, { fit, form, truth, taste });
  output(res);
}
```

### 4. Unify Telemetry

SDK telemetry is already browser/Node universal. CLI should import it.

```typescript
// packages/cli/src/lib/telemetry.ts
export { emit, sessionId, isDisabled } from "@oneie/sdk/telemetry";
```

The CLI currently adds `nodeVersion` and `platform` tags — keep that as a wrapper:

```typescript
// packages/cli/src/lib/cli-telemetry.ts
import { emit as sdkEmit, sessionId, isDisabled } from "@oneie/sdk/telemetry";

const nodeVersion = `node-${process.version.replace("v", "").split(".")[0]}`;
const platform = process.platform;

export function emit(
  verb: string,
  tags: string[] = [],
  content?: Record<string, unknown>,
): void {
  sdkEmit(`toolkit:cli:${verb}`, ["cli", verb, nodeVersion, platform, ...tags], content);
}

export { sessionId, isDisabled };
```

### 5. Delete Duplicated Code

After migration:
- Delete `packages/cli/src/lib/http.ts` — SDK handles HTTP
- Thin out `packages/cli/src/lib/telemetry.ts` — just re-exports
- Keep `packages/cli/src/lib/config.ts` — CLI-specific config loading
- Keep `packages/cli/src/lib/args.ts` — CLI-specific arg parsing
- Keep `packages/cli/src/lib/output.ts` — CLI-specific formatting

---

## Command Migration Checklist

Each command needs:
1. Import SubstrateClient
2. Get config (baseUrl, apiKey)
3. Call SDK method
4. Format + output result

| Command | SDK Method | Status |
|---------|-----------|--------|
| signal | sdk.signal() | ☐ |
| ask | sdk.ask() | ☐ |
| mark | sdk.mark() | ✅ |
| warn | sdk.warn() | ✅ |
| fade | sdk.fade() | ✅ |
| highways | sdk.highways() | ✅ |
| know | sdk.know() | ☐ |
| recall | sdk.recall() | ☐ |
| reveal | sdk.reveal() | ☐ |
| forget | sdk.forget() | ☐ |
| frontier | sdk.frontier() | ☐ |
| select | sdk.select() | ☐ |
| sync | (local tick) | ☐ |
| pay | sdk.pay() | ☐ |
| hire | sdk.hire() | ☐ |
| bounty | sdk.bounty() | ☐ |
| commend | sdk.commend() | ☐ |
| flag | sdk.flag() | ☐ |
| status | sdk.status() | ☐ |
| capabilities | sdk.capabilities() | ☐ |
| publish | sdk.publish() | ☐ |
| stats | sdk.stats() | ✅ |
| health | sdk.health() | ✅ |
| revenue | sdk.revenue() | ✅ |
| export | sdk.exportData() | ☐ |
| claw | sdk.claw() | ☐ |
| launch | (separate) | ☐ |
| config | (local) | — |
| completion | (local) | — |
| doctor | (local) | — |
| repl | (local + SDK) | ☐ |
| pipe | (local + SDK) | ☐ |
| tail | (streaming) | ☐ |

---

## Benefits

1. **Single source of truth** — SDK defines types, errors, API shape
2. **DRY** — No duplicate HTTP client, telemetry, error handling
3. **Testable** — SDK already tested; CLI tests just verify arg parsing
4. **Consistent** — SDK and CLI use identical API paths
5. **Type-safe** — CLI inherits SDK's TypeScript types

---

## Telemetry Flow

```
CLI command                      SDK method
  │                                │
  └─ emit("cli:mark", tags)        └─ emit("sdk:mark", tags)
          │                                │
          └────────┬───────────────────────┘
                   │
            api.one.ie/api/signal
                   │
            TypeDB pheromone
                   │
            toolkit:cli:* routes ← CLI usage patterns
            toolkit:sdk:* routes ← SDK usage patterns
```

This lets the substrate learn which CLI commands and SDK methods are used most.

---

## Version Strategy

- SDK 0.6.0 → 0.7.0 (telemetry exports, no breaking changes)
- CLI 3.7.0 → 4.0.0 (internal rewrite, same CLI surface)

---

## Implementation Order

1. **Add CLI to workspaces** (root package.json)
2. **Add SDK as dep** (cli package.json)
3. **Create cli-telemetry wrapper** (preserves node/platform tags)
4. **Migrate 5 simple commands** (mark, warn, fade, highways, stats)
5. **Test + verify** (bun run build in cli)
6. **Migrate remaining commands**
7. **Delete http.ts**
8. **Release CLI 4.0.0**

---

---

## Component Migration (src/)

39 components in `src/components/` use direct `fetch('/api/...')`. These should migrate to SDK hooks.

### Migration Pattern

**Before (direct fetch):**
```tsx
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch('/api/agents/list')
    .then(r => r.json())
    .then(setData)
    .finally(() => setLoading(false))
}, [])
```

**After (SDK hook):**
```tsx
import { useAgentList } from '@oneie/sdk/react'
import { SdkProvider } from '@/components/providers/SdkProvider'

export function AgentList() {
  return (
    <SdkProvider>
      <AgentListInner />
    </SdkProvider>
  )
}

function AgentListInner() {
  const { data, loading, error, refetch } = useAgentList()
  // ... use data directly
}
```

### Available Hooks

| Hook | API Endpoint | Cached |
|------|--------------|--------|
| useAgent(uid) | /api/agents/:uid | ✓ |
| useAgentList() | /api/agents/list | ✓ |
| useDiscover(skill) | /api/agents/discover | ✓ |
| useHighways(limit) | /api/loop/highways | ✓ |
| useStats() | /api/stats | ✓ |
| useHealth() | /api/health | ✓ |
| useRevenue() | /api/revenue | ✓ |
| useRecall(status?) | /api/hypotheses | ✓ |

### Component Migration Progress

| Component | Status |
|-----------|--------|
| AgentList.tsx | ✅ useAgentList |
| Other 38 components | ☐ Pending |

Components using WebSocket (TaskBoard, PheromoneGraph) keep their existing hooks — SDK hooks are for request/response patterns.

---

## See Also

- `packages/sdk/src/client.ts` — SubstrateClient implementation
- `packages/sdk/src/react/hooks.ts` — React hooks
- `packages/sdk/src/telemetry.ts` — Universal telemetry
- `packages/cli/CLAUDE.md` — CLI command reference
- `docs/sdk.md` — SDK public contract
