# Lib

**Skills: `/typedb` for query patterns, `/react19` for hooks, `/sui` for Sui client patterns.**

## Files

| File | Purpose | Skill |
|------|---------|-------|
| `typedb.ts` | TypeDB client: read/write/decay/callFunction | `/typedb` |
| `sui.ts` | Sui client: contract functions, keypair derivation, faucet | `/sui` |
| `auth.ts` | Better Auth server config (PBKDF2, TypeDB backend) | — |
| `auth-client.ts` | Better Auth client (React) | `/react19` |
| `typedb-auth-adapter.ts` | TypeDB adapter for Better Auth | `/typedb` |
| `utils.ts` | cn() and other utilities | `/shadcn` |
| `net.ts` | In-process substrate network instance (pattern execution surface) | — |
| `edge.ts` | In-process KV cache (`globalThis._edgeKvCache`), `kvInvalidate()` | — |
| `api-auth.ts` | API request authentication middleware + `getRoleForUser(uid)` + `getGroupsForUser(uid, roles?)` | — |
| `human-unit.ts` | `ensureHumanUnit(uid, user)` — create human actor + personal group + chairman role | — |
| `auth-plugins/sui-wallet.ts` | Better Auth plugin for Sui wallet sign-in (SIWE-style) | `/sui` |
| `auth-plugins/zklogin.ts` | Better Auth plugin for zkLogin (Google OAuth → Sui address) | `/sui` |
| `role-check.ts` | Governance role permission matrix: `roleCheck(role, action)`, `isGovernanceRole()` | — |
| `api-key.ts` | API key generation and validation | — |
| `streamSignals.ts` | SSE stream of substrate signals; carries agent lifecycle events | — |
| `signalSender.ts` | HTTP helper to POST signals to `/api/signal` | — |
| `claw-registry.ts` | `groupId → clawUrl` map + `getClawUrl(gid)` helper | — |
| `sdk.ts` | `@oneie/sdk` singleton `SubstrateClient` for browser/scripts — same-origin via `window.location.origin`, retry on 5xx/429. **Preferred for all API calls.** | — |
| `ui-signal.ts` | `emitClick(id, payload?)` — every UI onClick emits to substrate | `/react19` |
| `telemetry.ts` | API telemetry — `emit()` writes `api:<route>:<method>` signals to TypeDB | — |
| `security-signals.ts` | Emit security/audit signals (auth failure, rate-limit, toxicity) | — |
| `claude-code-events.ts` | Bridge Claude Code hook events → substrate signals | — |
| `tasks-store.ts` | In-memory task state store (pattern execution surface) | — |
| `use-task-websocket.ts` | React hook: WsHub WebSocket with exp-backoff reconnect | `/react19` |
| `useCanvasGestures.ts` | React hook: pinch/pan gestures for canvas components | `/react19` |
| `ws-server.ts` | Dev WebSocket server; carries agent lifecycle events over WS | — |
| `ws-cache.ts` | In-process WebSocket message cache (dedup + replay) | — |
| `dev-ws-server.ts` | Local dev WS server stub (no-op outside dev) | — |
| `speedtest.ts` | Benchmark helpers: mark/warn/fade throughput measurements | — |
| `logger.ts` | Structured logger (level, context, substrate sink) | — |
| `kek.ts` | Key Encryption Key derivation for envelope crypto | — |
| `ui-prefetch.ts` | Prefetch hints for Astro pages | `/astro` |
| `crypto/key-wrap.ts` | AES-KW wrap/unwrap for per-envelope keys | — |
| `ai/chat-engine.ts` | Core chat loop: message → LLM → tool calls → response | — |
| `ai/stream-parser.ts` | Parse OpenRouter SSE stream into typed chunks | — |
| `ai/model-config.ts` | Model registry: context window, pricing, capabilities | — |
| `ai/message-formatter.ts` | Format messages for each model family | — |
| `ai/index.ts` | AI module exports | — |
| `chat/stream.ts` | Chat response streaming over SSE | — |
| `chat/types.ts` | Chat message and session types | — |
| `chat/models.ts` | Chat model selection and fallback | — |
| `chat/tools.ts` | Chat-layer tool definitions (wraps tools/registry) | — |
| `chat/context-pack.ts` | Assemble context (memory + hypotheses + signals) for chat | — |
| `chat/demos.ts` | Demo conversation fixtures | — |
| `tools/registry.ts` | Tool registry: register/discover by tag | — |
| `tools/executor.ts` | Execute tools with ADL permission gates | — |
| `tools/index.ts` | Tools module exports | — |
| `tools/crypto/analyzer.ts` | Crypto token analysis tool | `/sui` |
| `tools/crypto/index.ts` | Crypto tools exports | `/sui` |
| `tools/crypto/knowledge.ts` | Crypto domain knowledge base | `/sui` |
| `tools/crypto/system-prompt.ts` | System prompt for crypto analysis persona | `/sui` |
| `tools/crypto/token-analysis-ui.ts` | Token analysis rich-message renderer | `/sui` |
| `tools/data/createChart.ts` | Chart generation tool | — |
| `tools/data/createTable.ts` | Table generation tool | — |
| `tools/data/data-analyzer.ts` | Data analysis tool | — |
| `tools/data/index.ts` | Data tools exports | — |
| `tools/integrations/coingecko.ts` | CoinGecko API integration | — |
| `tools/integrations/coinmarketcap.ts` | CoinMarketCap API integration | — |
| `tools/integrations/googleSheets.ts` | Google Sheets read/write integration | — |
| `tools/integrations/index.ts` | Integration tools exports | — |
| `tools/integrations/weather.ts` | Weather API integration | — |
| `tools/integrations/web-search.ts` | Web search integration | — |
| `tools/utilities/calculator.ts` | Calculator tool | — |
| `tools/utilities/date-formatter.ts` | Date formatting tool | — |
| `tools/utilities/index.ts` | Utility tools exports | — |

## Substrate Learning

This folder connects the nervous system to the brain. `typedb.ts` is the synapse:

```
mark() in engine  →  writeSilent() in typedb.ts  →  TypeDB Cloud
  <0.001ms              fire-and-forget                ~100ms
  (in-memory)           (non-blocking)                 (persistent)
```

`readParsed()` hydrates the in-memory state from TypeDB on boot. After that, the engine runs at memory speed. TypeDB catches up asynchronously via `writeSilent()`. This is why mark/warn is `<0.001ms` — the write to TypeDB is fire-and-forget.

**Context:** [DSL.md](one/DSL.md) — what flows through these clients. [routing.md](routing.md) — lib is the persistence layer for the routing formula: `typedb.ts` reads/writes `path.strength` and `path.resistance` (the formula's inputs); `typedb.ts:decay()` IS `fade()` for the TypeDB layer; `streamSignals.ts` surfaces the four outcomes (result/timeout/dissolved/failure) as SSE events; `edge.ts` caches the formula inputs at 0ms for hot routing decisions. [speed.md](one/speed.md) — why fire-and-forget matters (43,200 marks/day at memory speed). [buy-and-sell.md](buy-and-sell.md) — `sui.ts` implements the on-chain settlement path: `pay()`, `send()`, `consume()` are Steps 3–4. [revenue.md](one/revenue.md) — `typedb.ts` persists `path.revenue`; `sui.ts` moves the coin that IS that revenue. [dictionary.md](dictionary.md) — canonical names for every type used here (`signal`, `mark`, `unit`, `edge`). [rubrics.md](rubrics.md) — `rubric-score.ts` in `src/engine/` writes dimension scores via the TypeDB client here. [lifecycle.md](one/lifecycle.md) — `streamSignals.ts` and `ws-server.ts` carry agent lifecycle events (register→signal→highway→harden). [patterns.md](one/patterns.md) — `net.ts` and `tasks-store.ts` are pattern execution surfaces.

## TypeDB Client Usage

```typescript
import { read, write, readParsed, writeSilent, writeTracked, decay } from '@/lib/typedb'

// Read
const rows = await readParsed('match $u isa actor, has name $n; select $n;')

// Write — throws on failure
await write('insert $u isa actor, has aid "x", has name "X";')

// Fire and forget — never throws, never reports outcome
writeSilent('match $e isa path...; delete...; insert...;')

// Tracked — never throws, returns Promise<boolean> (accounting-honest)
// Use in loops that must report attempted vs succeeded (Rule 3):
const ok = await writeTracked('insert $h isa hypothesis, ...')
if (ok) result.hypoOk++

// Asymmetric decay (strength 5%, resistance 20%)
await decay(0.05, 0.20)
```

`writeSilent` vs `writeTracked` — same zero-throw semantics, different
reporting. Use `writeSilent` for don't-care writes (lifecycle cache
rotation, opportunistic updates). Use `writeTracked` wherever a loop
result counter would lie under a TypeDB outage. Every L5/L6/L7 insertion
uses `writeTracked` so `result.evolved`, `result.hypotheses`, and
`result.frontiers` report what actually persisted.

## Connection Modes

- **Browser**: fetch → `PUBLIC_GATEWAY_URL` (Cloudflare Worker) → TypeDB Cloud
- **Server (SSR)**: fetch → `TYPEDB_URL` directly → TypeDB Cloud (with JWT)
