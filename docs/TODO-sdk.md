---
title: TODO — `@oneie/sdk` Full-Featured TypeScript SDK
type: roadmap
version: 0.2.0
priority: Wire parity → Prove types → Grow React + streams
total_tasks: 24
completed: 0
status: PLANNED
---

# TODO: `@oneie/sdk` Full-Featured

> **Time units:** plan in **tasks → waves → cycles** only. Never days,
> hours, weeks. (See `.claude/rules/engine.md` → Locked Rule 2.)
>
> **Parallelism directive:** **maximize agents per wave.** Every wave
> must fan out in a **single message** with multiple `Agent` tool calls.
> W1 ≥ 4 Haiku, W2 ≥ 2 Opus shards when findings > 20, W3 = one Sonnet
> per file, W4 ≥ 2 Sonnet verifiers by check type.
>
> **Goal:** Bring `@oneie/sdk` to full feature parity with the HTTP API,
> add first-class TypeScript ergonomics (Zod schemas, typed errors, union
> outcome types), and ship React integration (hooks, suspense boundaries,
> optimistic updates) so that the SDK is the most pleasant way for any
> TypeScript project to talk to ONE.
>
> **Source of truth:**
> [TODO-mcp.md](TODO-mcp.md) — sibling; every SDK method matches an MCP tool name + shape,
> [TODO-cli.md](TODO-cli.md) — sibling; every SDK method wraps the same endpoint as the matching CLI verb,
> [src/pages/api/CLAUDE.md](../src/pages/api/CLAUDE.md) — endpoint catalog,
> [DSL.md](DSL.md) + [dictionary.md](dictionary.md) + [rubrics.md](rubrics.md) — always loaded in W2,
> [buy-and-sell.md](buy-and-sell.md) — commerce methods this TODO adds,
> [patterns.md](patterns.md) — four-outcome algebra the Outcome<T> type encodes.
>
> **Shape:** 3 cycles, four waves each. Haiku reads endpoints, Opus
> designs method signatures + types, Sonnet writes, Sonnet verifies.

---

## Why this TODO exists

`@oneie/sdk@0.2.0` has 6 subpath exports and a `SubstrateClient` with
**13 methods**. Compared to the ~150-endpoint HTTP API, that's a thin
slice — TypeScript projects using the SDK today must hand-roll most
calls.

Three gaps block full-featured:

1. **Method coverage.** `SubstrateClient` misses every commerce,
   governance, observability, and lifecycle method. Consumers drop to
   raw `fetch` for anything non-trivial.
2. **Type safety.** Request/response shapes are loosely typed
   (`Promise<unknown>` for `reveal`, `forget`, `frontier`, `know`,
   `select`). No Zod schemas for runtime validation. No union type for
   the four outcomes (`{result} | {timeout} | {dissolved} | {failure}`).
3. **No React story.** The most common SDK consumer — a React app —
   has no `useSubstrate()`, no `useAgent(uid)`, no `useDiscover(skill)`,
   no suspense-compatible async primitives, no optimistic mutation
   helpers. Every consumer re-implements fetch + state management.

Closing the three = 24 new pieces of surface.

---

## Current state (verified from `packages/sdk/src/`)

### Existing surface

| Module | Exports |
|---|---|
| `index.ts` | `SubstrateClient`, `SDK_VERSION`, re-exports from below |
| `client.ts` | `SubstrateClient` with 13 methods: `signal`, `ask`, `mark`, `warn`, `fade`, `highways`, `recall`, `reveal`, `forget`, `frontier`, `know`, `select` (+ constructor) |
| `urls.ts` | URL builders |
| `storage.ts` | Persistence helpers |
| `handoff.ts` | Launch handoff protocol |
| `launch.ts` | `launchToken`, `LaunchOpts`, `LaunchResult` |
| `telemetry.ts` | `emit`, `isDisabled`, `sessionId` (with opt-out) |
| `types.ts` | `Outcome<T>`, `SignalResponse`, `HypothesesResponse`, etc. |

### Gaps (verified)

- No `auth`, `sync`, `discover`, `register`, `pay` methods.
- No commerce: `hire`, `bounty`, `commend`, `flag`, `status`, `capabilities`, `publish`, `escrow`.
- No observability: `stats`, `health`, `revenue`, `export`.
- No Zod schemas; types are hand-written and drift-prone.
- No React integration (no `@oneie/sdk/react` subpath).
- No streaming helper for `chat` / `tail` / SSE endpoints.

---

## Cycle 1 — WIRE: Method Parity (12 methods)

Mirror Cycle 1 of `TODO-mcp.md` and `TODO-cli.md`: identity, publish,
commerce, observability.

### Cycle 1 Deliverables

| # | Method | Endpoint | Returns | Rubric | Skill |
|---|---|---|---|---|---|
| 1 | `client.authAgent(opts?)` | `POST /api/auth/agent` | `{uid, wallet, apiKey, keyId, returning}` | 0.40/0.20/0.30/0.10 | `oneie-sdk:authAgent` |
| 2 | `client.syncAgent(markdown)` | `POST /api/agents/sync` | `{ok, uid, wallet, skills}` | 0.40/0.15/0.35/0.10 | `oneie-sdk:syncAgent` |
| 3 | `client.discover(skill, limit?)` | `GET /api/agents/discover` | `{agents[], count}` | 0.35/0.20/0.35/0.10 | `oneie-sdk:discover` |
| 4 | `client.register(uid, capabilities)` | `POST /api/agents/register` | `{ok, capabilities}` | 0.35/0.20/0.35/0.10 | `oneie-sdk:register` |
| 5 | `client.pay(from, to, task, amount)` | `POST /api/pay` | `{ok, sui?}` | 0.40/0.15/0.40/0.05 | `oneie-sdk:pay` |
| 6 | `client.claw(agentId)` | `POST /api/claw` | `{persona, wranglerConfig, deployCommands, tools}` | 0.35/0.20/0.35/0.10 | `oneie-sdk:claw` |
| 7 | `client.commend(uid)` | `POST /api/agents/:id/commend` | `{ok}` | 0.35/0.20/0.35/0.10 | `oneie-sdk:commend` |
| 8 | `client.flag(uid, reason?)` | `POST /api/agents/:id/flag` | `{ok}` | 0.35/0.20/0.35/0.10 | `oneie-sdk:flag` |
| 9 | `client.status(uid, active)` | `POST /api/agents/:id/status` | `{ok, status}` | 0.30/0.20/0.40/0.10 | `oneie-sdk:status` |
| 10 | `client.capabilities(uid)` | `GET /api/agents/:id/capabilities` | `Capability[]` | 0.35/0.20/0.35/0.10 | `oneie-sdk:capabilities` |
| 11 | `client.stats()` | `GET /api/stats` | `Stats` | 0.30/0.20/0.40/0.10 | `oneie-sdk:stats` |
| 12 | `client.health()` | `GET /api/health` | `Health` | 0.30/0.20/0.40/0.10 | `oneie-sdk:health` |

### Cycle 1 Waves

**W1 — Recon (Haiku × 12, parallel)** — one agent per endpoint. Each reads route handler + existing `client.ts` method that most closely matches (for the return-type shape), reports: body in, response out, error shape, auth. ≤ 300 words, `file:line` citations.

All 12 spawned in a single message.

| Agent | Endpoint | Nearest client.ts pattern |
|---|---|---|
| R1 | `auth/agent.ts` | none — new type shape |
| R2 | `agents/sync.ts` | none |
| R3 | `agents/discover.ts` | none |
| R4 | `agents/register.ts` | none |
| R5 | `pay.ts` | `client.mark()` (POST with small body) |
| R6-R10 | `agents/:id/*` + `claw.ts` | `client.mark()` pattern |
| R11-R12 | `stats.ts`, `health.ts` | `client.highways()` (GET with query) |

**W2 — Decide (Opus × 1)** — 12 findings fit one context. Produce per-method spec: TypeScript signature, request body / query shape, return type (TypeScript interface, NOT `unknown`), error handling. Key decisions:

1. **Method naming** — camelCase TS convention (`authAgent`, `syncAgent`, not the CLI/MCP snake). Document mapping: CLI `auth_agent` ↔ MCP `auth_agent` ↔ SDK `authAgent`.
2. **Client constructor** — add new options: `onRequest?`, `onResponse?` hooks for middleware (logging, retry). Stays backward-compatible with `new SubstrateClient({baseUrl, apiKey})`.
3. **Types file** — `types.ts` gets 12 new exports; consider splitting into `types/agent.ts`, `types/commerce.ts`, `types/observability.ts` if > 500 LOC.

**W3 — Edit (Sonnet × 3, parallel by file)**

| Job | File | Edits |
|---|---|---|
| E1 | `packages/sdk/src/client.ts` | 12 new methods on `SubstrateClient` |
| E2 | `packages/sdk/src/types.ts` | 12 new type exports (Agent, Capability, Stats, Health, Discover, etc.) |
| E3 | `packages/sdk/README.md` | document 12 new methods with TypeScript code examples |

**W4 — Verify (Sonnet × 3, parallel)**

| Shard | Owns |
|---|---|
| V1 | `cd packages/sdk && bun run build` clean; `tsc --noEmit` passes; `dist/` contains the new symbols |
| V2 | Functional: a small test script instantiates `new SubstrateClient(...)`, calls each of 12 new methods with minimal args, handles response types correctly |
| V3 | Cross-ref: every new method has a matching MCP tool in `TODO-mcp.md` Cycle 1 AND matching CLI verb in `TODO-cli.md` Cycle 1 |

**Cycle 1 Gate:**

```bash
# 13 → 25 methods on SubstrateClient
grep -c "^  async \w" packages/sdk/src/client.ts
# 25

# Types surface grew
grep -c "^export " packages/sdk/src/types.ts
# ≥ 20 (was ~8)

# Cross-package consistency: every new SDK method has MCP + CLI twin
for m in authAgent syncAgent discover register pay claw commend flag status capabilities stats health; do
  grep -q "\"$m\"" packages/mcp/src/tools/ && grep -q "\"$m\"" cli/src/commands/ && echo "$m ✓" || echo "$m ✗"
done
```

---

## Cycle 2 — PROVE: Type Safety (Zod + Outcomes + Errors)

Moves SDK from "loosely typed" to "parse-don't-validate". Depends on
Cycle 1 (need method surface before we can type it).

### Cycle 2 Deliverables

| # | Feature | What it does | Rubric | Exit |
|---|---|---|---|---|
| 13 | `@oneie/sdk/schemas` subpath | Zod schemas for every request body + response shape | 0.35/0.20/0.40/0.05 | import schemas, `.parse()` every response, TS infers exact shape |
| 14 | `Outcome<T>` discriminated union | Replace loose `Promise<unknown>` with `{kind: 'result'\|'timeout'\|'dissolved'\|'failure', ...}` everywhere | 0.40/0.15/0.40/0.05 | exhaustive switch narrows type; no `any` casts remain |
| 15 | `SubstrateError` class hierarchy | `SubstrateError → {AuthError, TimeoutError, DissolvedError, ValidationError, RateLimitError}` | 0.40/0.15/0.35/0.10 | `instanceof` narrows; JSON body preserved on all errors |
| 16 | Retry + backoff middleware | Opt-in `new SubstrateClient({retry: {maxAttempts: 3, backoff: 'exp'}})` | 0.30/0.25/0.35/0.10 | flaky 503s retried transparently; non-retryable errors fail fast |
| 17 | `fromApiKey` factory | `SubstrateClient.fromApiKey(key)` auto-selects base URL via key prefix | 0.25/0.30/0.35/0.10 | reduces boilerplate in consumer code |
| 18 | Response validation mode | `new SubstrateClient({validate: 'strict'\|'warn'\|'off'})` controls whether responses are Zod-parsed | 0.30/0.25/0.35/0.10 | dev uses `strict`, prod uses `warn`, tests use `off` |

### Cycle 2 Waves

**W1 — Recon (Haiku × 6, parallel)**

| Agent | Research |
|---|---|
| R1 | Existing Zod schemas elsewhere in the repo (`src/engine/agent-md.ts` has `AgentSpecSchema`) — reuse where possible |
| R2 | Outcome<T> existing shape in `packages/sdk/src/types.ts` — how far from the 4-outcome algebra |
| R3 | Error classes prior-art in SDKs (`@aws-sdk`, `stripe` JS) — naming + hierarchy patterns |
| R4 | Retry middleware — lightweight vs `p-retry`; ESM-first pure-ts implementation |
| R5 | API key prefix conventions in `src/lib/api-key.ts` (e.g. `api_local_*` vs `api_prod_*`) — does one exist? |
| R6 | Which consumers (components, scripts, tests) currently cast through `as any` or `unknown` — the real surface of untypedness |

**W2 — Decide (Opus × 2 shards)** — if W1 surfaces > 20 findings (likely — this cycle touches types across many files), shard by domain: type-design (outcomes, errors, schemas) vs. runtime-behavior (retry, validation mode, factory). Parallel Opus shards produce specs; main context reconciles.

**W3 — Edit (Sonnet × 5, parallel)**

| Job | File | Edits |
|---|---|---|
| E1 | `packages/sdk/src/schemas.ts` | create — Zod schemas for every req/resp |
| E2 | `packages/sdk/src/types.ts` | split types into agent/commerce/observability + update `Outcome<T>` to tagged union |
| E3 | `packages/sdk/src/errors.ts` | create — `SubstrateError` hierarchy |
| E4 | `packages/sdk/src/client.ts` | wire retry middleware, `fromApiKey` factory, validation mode |
| E5 | `packages/sdk/README.md` | document new type guarantees + retry + validation modes |

**W4 — Verify (Sonnet × 3)**

| Shard | Owns |
|---|---|
| V1 | Build + typecheck; `tsd` type tests pass if present |
| V2 | Functional: a test file covers (a) Zod parse happy path, (b) Outcome<T> exhaustive switch, (c) each error class thrown from the right failure mode, (d) retry fires on 503, (e) fromApiKey picks the right URL |
| V3 | Zero regressions: existing Cycle-1 consumers still compile without annotation changes (back-compat: new types refine, not replace) |

**Cycle 2 Gate:** `SubstrateClient`'s public API is fully typed with Zod-validated responses, tagged-union outcomes, a real error hierarchy, opt-in retry, and a `fromApiKey` constructor. No `Promise<unknown>` remains on public methods.

---

## Cycle 3 — GROW: React + Streams (6 features)

Makes the SDK the default way to talk to ONE from a React app.
Depends on Cycle 2 (need typed responses before hooks are useful).

### Cycle 3 Deliverables

| # | Feature | What it does | Rubric | Exit |
|---|---|---|---|---|
| 19 | `@oneie/sdk/react` subpath | React package entry | 0.30/0.30/0.30/0.10 | `import { useSubstrate } from '@oneie/sdk/react'` resolves |
| 20 | `useSubstrate()` provider | `<SubstrateProvider client={...}>...</SubstrateProvider>` + `useSubstrate()` returns client + session | 0.35/0.25/0.30/0.10 | app-wide client instance, tree-shakeable |
| 21 | `useAgent(uid)`, `useDiscover(skill)`, `useHighways()` | Suspense-compatible data hooks, SWR-style | 0.40/0.20/0.30/0.10 | `const { agent } = useAgent("marketing:alice")` suspends until resolved; re-renders on cache invalidate |
| 22 | `useOptimisticMark()`, `useOptimisticPay()` | React 19 `useOptimistic` wrappers with automatic rollback on failure | 0.35/0.20/0.35/0.10 | mark fires locally immediately; rolls back if server rejects |
| 23 | `streamChat()` / `streamTail()` helpers | AsyncIterable wrappers around `/api/chat` and `/api/ws` | 0.40/0.15/0.35/0.10 | `for await (const chunk of streamChat(...))` yields incrementally |
| 24 | Test helpers | `createMockSubstrate()` + `rest` msw handlers for every endpoint | 0.35/0.20/0.30/0.15 | consumers can `jest.config` with zero TypeDB dependency |

### Cycle 3 Waves

**W1 — Recon (Haiku × 6, parallel)**

| Agent | Research |
|---|---|
| R1 | How existing React components use fetch + state — candidates for hook migration |
| R2 | Suspense patterns in React 19 — `use()` for promises, suspense boundaries |
| R3 | Optimistic mutation prior-art — React 19 `useOptimistic`, `useTransition` |
| R4 | Streaming: current SSE/WS endpoints + their response shapes |
| R5 | MSW (Mock Service Worker) patterns in existing tests |
| R6 | `@tanstack/react-query` vs hand-rolled hooks — which we'd lean on, if any |

**W2 — Decide (Opus × 1)** — 6 findings fit one context.

Key decisions:
1. Cache layer — roll our own (matching React 19 `use(promise)`) or depend on `@tanstack/react-query`? Recommend **roll our own** — keeps SDK dependency-free; RQ is a drop-in if consumers want it.
2. Store shape — context + WeakMap cache, or atoms via `nanostores`? Recommend **context + WeakMap**; nanostores already in root deps but SDK should stay zero-dep.
3. MSW in peerDeps or devDeps? **peerDeps** so consumers import the handlers directly without re-declaring them.

**W3 — Edit (Sonnet × 8, parallel)**

| Job | File | Edits |
|---|---|---|
| E1 | `packages/sdk/src/react/index.ts` | subpath entry point |
| E2 | `packages/sdk/src/react/context.tsx` | `SubstrateProvider` + `useSubstrate` |
| E3 | `packages/sdk/src/react/hooks.ts` | `useAgent`, `useDiscover`, `useHighways`, `useSignals`, `useHypotheses` |
| E4 | `packages/sdk/src/react/optimistic.ts` | `useOptimisticMark`, `useOptimisticPay` |
| E5 | `packages/sdk/src/react/stream.ts` | `streamChat`, `streamTail` AsyncIterables |
| E6 | `packages/sdk/src/testing/index.ts` | MSW handlers + `createMockSubstrate` |
| E7 | `packages/sdk/package.json` | subpath exports (`./react`, `./testing`, `./schemas`, `./errors`) |
| E8 | `packages/sdk/README.md` | React section with full example app |

**W4 — Verify (Sonnet × 4, parallel by check type)**

| Shard | Owns |
|---|---|
| V1 | Build + typecheck; all subpath exports resolve |
| V2 | React behavior: hooks render correctly in a test app (jsdom), suspense works, optimistic rollback fires |
| V3 | Stream behavior: AsyncIterable consumers work with `for await` |
| V4 | Test helpers: `createMockSubstrate()` returns a working client against MSW handlers; consumer tests pass without network |

**Cycle 3 Gate:** React consumers can build a full ONE app using only `@oneie/sdk` — no raw fetch, no manual state management, no bespoke test mocks.

---

## Routing

```
    /do TODO-sdk.md
         │
         ▼
    ┌─────────┐
    │  W1     │  Haiku × N per cycle  → endpoint + nearest-method recon
    └────┬────┘
         ▼
    ┌─────────┐
    │  W2     │  Opus × 1 or 2        → method signatures + types + policies
    └────┬────┘
         ▼
    ┌─────────┐
    │  W3     │  Sonnet × M files     → client.ts, types.ts, react/*, testing/*
    └────┬────┘
         ▼
    ┌─────────┐
    │  W4     │  Sonnet × K by check  → build + typecheck + react test + cross-ref
    │         │  → feedback signal    → tags: ['sdk', 'parity'|'types'|'react']
    └─────────┘
```

---

## Canonical decisions (loaded in every W2)

| Item | Canonical | Exceptions |
|------|-----------|------------|
| method name | camelCase; matches MCP/CLI verb but in camelCase (`authAgent` ↔ mcp `auth_agent` ↔ cli `auth_agent`) | none |
| return type | TypeScript interface, never `unknown` | error return → throws typed `SubstrateError` |
| HTTP client | internal `req<T>()` in `client.ts`; no axios, no fetch wrappers beyond this | streaming uses `fetch(...).body` directly |
| Zod schema | live in `schemas.ts`, subpath `@oneie/sdk/schemas` | types in `types.ts` derived via `z.infer<>` once Zod lands (C2) |
| React subpath | `@oneie/sdk/react` with zero runtime deps beyond `react` | `react-dom` for `useOptimistic` (peerDep) |
| Test helpers | `@oneie/sdk/testing` with MSW peer dep | no `.test.ts` files bundled into main entry |

---

## Cross-coordination with `TODO-mcp.md` and `TODO-cli.md`

Every new SDK method lands alongside its MCP tool + CLI verb:

| Stage | SDK method | MCP tool | CLI verb |
|---|---|---|---|
| Cycle 1 | `client.pay()` | `pay` | `oneie pay` |
| Cycle 1 | `client.discover()` | `discover_skill` | `oneie discover` |
| ... | ... | ... | ... |

When Cycle 1 W3 in TODO-sdk.md ships, the matching W3 of TODO-mcp.md
and TODO-cli.md is expected to ship the twin tool + verb. Three
checkboxes flip together.

Cycle 2 (types) is SDK-specific; no mirror in MCP/CLI.
Cycle 3 (React) is SDK-specific; CLI has `repl` as its interactive surface, MCP has its tool-call protocol.

---

## Testing — The Deterministic Sandwich

```
    PRE (before W1)                    POST (after W4)
    ───────────────                    ────────────────
    cd packages/sdk                    cd packages/sdk
    bun install                        bun run build       (compiles clean)
    bun run build                        bun run typecheck   (strict mode)
    bun test                            bun test            (all green)
                                       new tests for new surface
```

### Cycle Gate checklist

- [ ] `bun run build` clean in `packages/sdk/`
- [ ] `tsc --noEmit` passes in strict mode
- [ ] `dist/` exports match the `package.json` `exports` map
- [ ] Every new method/feature has a test
- [ ] Cross-package: MCP + CLI have matching entries
- [ ] README section updated

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Share |
|-------|------|--------|-------|-------|
| 1 | W1 | 12 | Haiku | ~5% |
| 1 | W2 | 1 | Opus | ~15% |
| 1 | W3 | 3 | Sonnet | ~10% |
| 1 | W4 | 3 | Sonnet | ~10% |
| 2 | W1 | 6 | Haiku | ~5% |
| 2 | W2 | 2 | Opus | ~20% |
| 2 | W3 | 5 | Sonnet | ~10% |
| 2 | W4 | 3 | Sonnet | ~10% |
| 3 | W1 | 6 | Haiku | ~5% |
| 3 | W2 | 1 | Opus | ~15% |
| 3 | W3 | 8 | Sonnet | ~15% |
| 3 | W4 | 4 | Sonnet | ~10% |

Hard stop: W4 loops > 3 → halt, escalate.

---

## Status

- [ ] **Cycle 1: WIRE — Method Parity (12 methods)**
  - [ ] W1 — Recon (Haiku × 12, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 3, parallel by file)
  - [ ] W4 — Verify (Sonnet × 3, parallel)
- [ ] **Cycle 2: PROVE — Type Safety (6 features)**
  - [ ] W1 — Recon (Haiku × 6, parallel)
  - [ ] W2 — Decide (Opus × 2 shards)
  - [ ] W3 — Edits (Sonnet × 5, parallel)
  - [ ] W4 — Verify (Sonnet × 3, parallel)
- [ ] **Cycle 3: GROW — React + Streams (6 features)**
  - [ ] W1 — Recon (Haiku × 6, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 8, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel)

---

## Execution

```bash
/do docs/TODO-sdk.md              # advance the next wave
/do docs/TODO-sdk.md --auto       # run W1→W4 until cycle completes

# After each cycle, publish a new SDK version
cd packages/sdk
npm version minor                  # 0.2.0 → 0.3.0 (C1), 0.4.0 (C2), 0.5.0 (C3)
npm publish --access public
```

---

## Finished surface

After three cycles, `@oneie/sdk@0.5.0` ships with:

| Layer | Exports | Count |
|---|---|---|
| `@oneie/sdk` main | `SubstrateClient` with **25 methods**, re-exports | 25 |
| `@oneie/sdk/schemas` | Zod schemas for every request + response | ~40 |
| `@oneie/sdk/errors` | `SubstrateError` hierarchy (AuthError, TimeoutError, etc.) | 6 |
| `@oneie/sdk/react` | `SubstrateProvider`, 7 data hooks, 2 optimistic hooks, 2 streams | 12 |
| `@oneie/sdk/testing` | `createMockSubstrate`, MSW handlers | 1 helper, N handlers |
| `@oneie/sdk/urls` | URL builders (existing) | |
| `@oneie/sdk/storage` | Persistence helpers (existing) | |
| `@oneie/sdk/handoff` | Launch handoff (existing) | |
| `@oneie/sdk/launch` | `launchToken` (existing) | |
| `@oneie/sdk/telemetry` | Telemetry opt-out (existing) | |

A TypeScript project can build a full ONE application using only
`@oneie/sdk` — typed, validated, React-integrated, testable, zero boilerplate.

---

## Out of scope (deliberately)

| Feature | Why excluded |
|---|---|
| Non-React bindings (Vue, Svelte) | Keep the package focused; React is the primary consumer |
| GraphQL wrapper | ONE's surface is REST; adding GQL is a separate layer |
| Node-only helpers (FS, SSR tools) | Belongs in a separate `@oneie/server-sdk` if demand appears |
| Browser-only helpers (auth cookies) | Handoff path is `passkey + Better Auth`, not cookie-managed by SDK |

---

## Upstream follow-ups

Writing SDK wrappers forces re-verifying the HTTP surface; expected:

1. **`client.syncAgent`** — confirm idempotency fixes hold under SDK retry middleware (retry on 503 must not re-insert).
2. **`client.discover`** — `/api/agents/discover` has a known 8–10s cold path; SDK should set a 15s default timeout on this method (not the global 8s).
3. **`client.pay`** — `sui: null` means off-chain fast-path; the return type should make this a discriminated union (`{kind: 'offchain'} | {kind: 'sui', digest}`) so consumers can't miss it.
4. **Zod schemas** — writing them will surface any response-shape drift where the route returns fields the TypeScript type didn't declare.
5. **React hooks** — will force a re-read of every existing React component that fetches from ONE; expected to find 5+ places with copy-pasted fetch logic that should migrate to hooks.

---

## See Also

- [TODO-mcp.md](TODO-mcp.md) — sibling; every SDK method matches an MCP tool
- [TODO-cli.md](TODO-cli.md) — sibling; every SDK method matches a CLI verb
- [cli-reference.md](cli-reference.md) — authoritative verb surface
- [sdk.md](sdk.md) — current SDK documentation (will expand per cycle)
- [src/pages/api/CLAUDE.md](../src/pages/api/CLAUDE.md) — endpoint catalog
- [DSL.md](DSL.md), [dictionary.md](dictionary.md), [rubrics.md](rubrics.md) — loaded in W2
- [patterns.md](patterns.md) — four-outcome algebra the `Outcome<T>` union encodes
- [TODO-template.md](TODO-template.md) — template this doc follows
- [loop-close.md](loop-close.md) — cycle close protocol

---

*3 cycles. 24 new features (12 methods + 6 type features + 6 React features). When done, `@oneie/sdk@0.5.0` ships 25 typed methods, Zod schemas for every I/O, real error hierarchy, full React integration, and MSW test helpers — zero boilerplate for TypeScript consumers.*
