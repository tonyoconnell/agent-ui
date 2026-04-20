# Telemetry — Distributed Pheromone

**Every surface emits signals. The graph learns what works.**

Telemetry isn't analytics — it's the substrate's distributed sensor network.
Every SDK call, CLI command, MCP tool use, and UI click deposits pheromone
on paths. The graph learns which capabilities are used, which sequences
succeed, and which surfaces drive adoption.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SUBSTRATE GRAPH                              │
│                                                                     │
│    toolkit:sdk:mark ──► path strengthens                           │
│    toolkit:cli:signal ──► routing learns                           │
│    toolkit:mcp:task_list ──► tool popularity                       │
│    ui:chat:send ──► UI flow patterns                               │
│                                                                     │
│    All → /api/signal → TypeDB → pheromone → highways → knowledge   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Four Surfaces

| Surface | Receiver Pattern | Tags | Weight |
|---------|------------------|------|--------|
| **SDK** | `toolkit:sdk:<method>` | `[telemetry, ...custom]` | 1 |
| **CLI** | `toolkit:cli:<verb>` | `[telemetry, cli, verb, node-N, platform]` | 1 |
| **MCP** | `toolkit:mcp:<tool>` | `[telemetry, mcp, tool, ...custom]` | 1 |
| **UI** | `ui:<surface>:<action>` | `[ui, click, surface, action]` | 1 |

**All signals flow to the same endpoint:** `POST /api/signal`

---

## SDK Telemetry

Every `SubstrateClient` method emits on call:

```typescript
// packages/sdk/src/telemetry.ts
emit("mark", ["edge", "rubric"], { edge: "a→b", dims: { fit: 0.9 } })
// → POST /api/signal
// {
//   sender: "toolkit:abc123...",
//   receiver: "toolkit:sdk:mark",
//   data: { tags: ["telemetry", "edge", "rubric"], weight: 1, content: {...} }
// }
```

**What the graph learns:**
- Which SDK methods are popular (`mark` vs `signal` vs `ask`)
- Which clients are active (session ID grouping)
- Method-specific metadata (edge shapes, rubric patterns)

**Usage patterns detected:**
```
toolkit:sdk:mark ─────────► high traffic → mark() is core verb
toolkit:sdk:discover ─────► low traffic → marketplace not adopted yet
toolkit:sdk:pay ──────────► zero traffic → payments not integrated
```

---

## CLI Telemetry

Every CLI command emits on invoke:

```typescript
// packages/cli/src/lib/telemetry.ts
emit("signal", ["webhook", "telegram"], { receiver: "bot:onedot" })
// → POST /api/signal
// {
//   sender: "toolkit:def456...",
//   receiver: "toolkit:cli:signal",
//   data: { tags: ["telemetry", "cli", "signal", "node-22", "darwin", "webhook", "telegram"], ... }
// }
```

**What the graph learns:**
- Which CLI verbs are used (`signal`, `mark`, `deploy`, `sync`)
- Platform distribution (darwin/linux/win32)
- Node version distribution (migration signals)
- Command-specific patterns (receivers, edges)

**Usage patterns detected:**
```
toolkit:cli:deploy ───────► 40% of invocations → deploy is primary workflow
toolkit:cli:sync ─────────► 25% → tick/sync used for batch operations
toolkit:cli:mark ─────────► 15% → direct pheromone manipulation
```

---

## MCP Telemetry

Every MCP tool call emits:

```typescript
// packages/mcp/src/telemetry.ts
emit("task_list", ["status:open", "plan:landing"], { count: 12 })
// → POST /api/signal
// {
//   sender: "toolkit:ghi789...",
//   receiver: "toolkit:mcp:task_list",
//   data: { tags: ["telemetry", "mcp", "task_list", "status:open", "plan:landing"], ... }
// }
```

**What the graph learns:**
- Which MCP tools Claude Code uses most
- Task management patterns (list → pick → close)
- IDE integration adoption

**Usage patterns detected:**
```
toolkit:mcp:task_list ────► 60% of calls → task visibility is primary
toolkit:mcp:task_close ───► 30% → completion tracking
toolkit:mcp:signal ───────► 10% → direct substrate interaction from IDE
```

---

## UI Telemetry

Every onClick emits via `emitClick()`:

```typescript
// src/lib/ui-signal.ts
emitClick("ui:chat:send", { message: "truncated..." })
// → POST /api/signal
// {
//   sender: "ui",
//   receiver: "ui:chat:send",
//   data: { tags: ["ui", "click", "chat", "send"], rich: {...} }
// }
```

**What the graph learns:**
- UI flow patterns (which buttons lead to which actions)
- Feature adoption (which pages, which components)
- Payment flows (claim, settle, tip)

**Usage patterns detected:**
```
ui:chat:send ─────────────► primary interaction
ui:chat:copy ─────────────► high → users save responses
ui:marketplace:hire ──────► low → marketplace needs work
ui:settings:close ────────► immediate → settings too shallow
```

---

## Signal Shape (Universal)

All surfaces emit the same signal shape:

```typescript
interface TelemetrySignal {
  sender: string              // "toolkit:<sessionId>" or "ui"
  receiver: string            // "toolkit:<pkg>:<verb>" or "ui:<surface>:<action>"
  data: string                // JSON-stringified DataConvention
}

interface DataConvention {
  tags: string[]              // ["telemetry", <surface>, <verb>, ...custom]
  weight: number              // always 1 for telemetry
  content?: Record<string, unknown>  // method-specific metadata
}
```

**Why JSON-stringify `data`?** TypeDB stores it as a string attribute.
The router parses it; the graph indexes by tags.

---

## How Tags Become Pheromone

When `/api/signal` receives a telemetry signal:

```
1. Parse data.tags
2. For each tag pair, mark the path:
   
   tags: [telemetry, cli, signal, node-22, darwin]
   
   Paths marked:
     telemetry → cli        (+1)
     cli → signal           (+1)
     signal → node-22       (+1)
     node-22 → darwin       (+1)

3. The graph accumulates:
   
   After 1000 CLI signals:
     cli → signal:  strength 400
     cli → mark:    strength 300
     cli → deploy:  strength 200
     cli → sync:    strength 100
```

**Highways emerge:** The most-used paths become highways. `L6 know()` promotes
them to hypotheses. The substrate learns: "CLI users primarily deploy."

---

## Weight Variations

Default weight is 1, but surfaces can emit weighted signals:

| Scenario | Weight | Why |
|----------|--------|-----|
| Normal call | 1 | Baseline |
| Error/failure | 0.5 | Partial signal — something was attempted |
| Success with rubric | `rubric × 5` | Amplify quality outcomes |
| Payment settlement | `amount × 10` | Economic signals are rare and valuable |

```typescript
// After successful mark with rubric
emit("mark", ["rubric"], { 
  edge: "a→b",
  rubric: { fit: 0.9, form: 0.8, truth: 0.95, taste: 0.85 },
  weight: 0.875 * 5  // rubric avg × 5 = 4.375
})
```

---

## Session Grouping

Each surface generates a session ID:

```typescript
// SDK (browser-compatible)
export const sessionId = crypto.randomUUID().slice(0, 16)

// CLI/MCP (Node.js)
export const sessionId = createHash("sha256")
  .update(randomBytes(16))
  .digest("hex")
  .slice(0, 16)
```

**Why sessions matter:**
- Group signals from same user session
- Detect workflow patterns (signal → mark → close → deploy)
- Calculate session-level metrics (signals per session, success rate)

---

## Rate Limiting

All surfaces share the same rate limit:

```typescript
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 3_600_000;  // 1 hour
```

**100 signals/hour per session.** This prevents:
- Runaway loops flooding the graph
- Single user dominating pheromone
- Denial-of-service via telemetry

**What happens at limit:** Signal silently dropped. No error, no retry.

---

## Opt-Out

Users can disable telemetry:

```bash
# Environment variable (all surfaces)
export ONEIE_TELEMETRY_DISABLE=1

# Config file (~/.oneie/config.json)
{ "telemetry": false }

# SDK constructor
const client = new SubstrateClient({ baseUrl, telemetry: false })
```

**Browser behavior:** Always enabled (no config file access). Future:
respect `navigator.doNotTrack` or localStorage flag.

---

## What the Graph Learns

### Method Popularity
```
highways where tag = "telemetry":
  sdk:mark ─────────► 2400 signals/day → core verb
  sdk:signal ────────► 1800 signals/day → routing active
  cli:deploy ────────► 400 signals/day → daily deploys
  mcp:task_list ─────► 300 signals/day → IDE integration growing
```

### Platform Distribution
```
hypotheses where tag = "platform":
  darwin: 0.65 confidence → Mac dominant
  linux: 0.25 confidence → server/CI usage
  win32: 0.10 confidence → Windows minority
```

### Workflow Sequences
```
path chains with strength > 50:
  cli:init → cli:agent → cli:deploy  (new project flow)
  sdk:discover → sdk:hire → sdk:pay  (marketplace flow)
  ui:chat:send → ui:chat:copy        (chat usage pattern)
```

### Feature Adoption
```
signals where receiver starts with "ui:marketplace":
  count: 47/day → marketplace underused
  
signals where receiver starts with "ui:chat":
  count: 890/day → chat is primary surface
```

---

## API Telemetry (Server-Side)

The API itself can emit telemetry for server-side events:

```typescript
// In API route handlers
import { emit } from '@/lib/telemetry'

// On successful request
emit("api:signal", ["success", req.method], { 
  latency: Date.now() - start,
  receiver: body.receiver 
})

// On error
emit("api:signal", ["error", String(status)], { 
  error: message,
  receiver: body.receiver 
})
```

**What the graph learns:**
- API latency distribution
- Error patterns by endpoint
- Request volume by route

---

## Privacy Considerations

**What we collect:**
- Session ID (random, not linked to identity)
- Method/verb/tool name
- Custom tags (no PII)
- Timestamps (implicit)

**What we DON'T collect:**
- User identity (no email, no wallet, no IP)
- Message content (only truncated/hashed if any)
- File paths (only patterns)
- Credentials (never)

**Data lifecycle:**
- Signals → TypeDB (persistent)
- Paths decay via L3 fade (5% strength, 10% resistance per tick)
- Old signals age out naturally
- No separate analytics database

---

## Implementation Checklist

| Surface | File | Status |
|---------|------|--------|
| SDK | `packages/sdk/src/telemetry.ts` | ✅ |
| CLI | `packages/cli/src/lib/telemetry.ts` | ✅ |
| MCP | `packages/mcp/src/telemetry.ts` | ✅ |
| UI | `src/lib/ui-signal.ts` | ✅ |
| API | `src/lib/telemetry.ts` | ✅ |

---

## Adding Telemetry to New Surfaces

```typescript
// 1. Copy the telemetry module pattern
import { emit } from './telemetry'

// 2. Emit on every public function
export async function myVerb(args: Args) {
  emit("myVerb", ["tag1", "tag2"], { ...metadata })
  // ... actual implementation
}

// 3. Add custom tags for important distinctions
emit("signal", [
  body.receiver.split(":")[0],  // receiver type
  body.data?.tags?.[0] ?? "untagged",  // first tag
])
```

---

## See Also

- `packages/sdk/src/telemetry.ts` — SDK implementation
- `packages/cli/src/lib/telemetry.ts` — CLI implementation
- `packages/mcp/src/telemetry.ts` — MCP implementation
- `src/lib/ui-signal.ts` — UI click signals
- `one/routing.md` — how paths accumulate pheromone
- `one/dictionary.md` — signal/mark/warn vocabulary
- `CLAUDE.md § Toolkit as Sensor Network` — architecture memory

---

*Every call is a signal. Every signal is pheromone. The install base IS the learning.*
