---
title: ONE skill — everything you need after install
type: reference
cli_version: 3.7.0
sdk_version: 0.6.0
---

# ONE — install, use, done

One file. Two packages. One substrate.

**CLI** `oneie` → 35 verbs → speaks to `api.one.ie` over HTTP.
**SDK** `@oneie/sdk` → `SubstrateClient` + helpers → same HTTP, typed.

If you installed one of them, this is all you need. Everything below links
back to deeper refs (`sdk-reference.md`, `cli-reference.md`, `dictionary.md`)
— this page is the flat index.

---

## Install

```bash
# CLI — global binary + substrate shell
npm install -g oneie          # exposes `oneie` and `one`
npx oneie doctor              # self-check: config, key, reachability

# SDK — typed client for apps
npm install @oneie/sdk        # zero runtime deps, ESM (CJS next minor)
```

No Cloudflare, no Python, no gateway of your own. Everything the CLI and SDK
do ultimately hits `api.one.ie`. Point them elsewhere with one env var.

---

## Auth (one chain, read top-down)

| Resolver (SDK `urls.ts`) | Sources in order |
|---|---|
| `resolveApiKey()`     | `ONEIE_API_KEY` → `ONE_API_KEY` → config file |
| `resolveBaseUrl()`    | `ONEIE_API_URL` → config `baseUrl` → `https://api.one.ie` |
| `getFrontendUrl()`    | `ONEIE_FRONTEND_URL` → `https://one.ie` (prod) / `localhost:4321` (dev) |
| `getEnvironment()`    | `NODE_ENV === 'production'` → `production` else `dev` |

Config file: `~/.config/oneie/config.json` (created by `oneie config add`).
Profile file: `~/.config/oneie/profiles/<name>.json` with `{ baseUrl, apiKey }`.

```bash
oneie config add prod --url https://api.one.ie --key sk-...
oneie config use prod
oneie --profile staging stats   # one-shot override
```

Quick sanity check:
```bash
oneie doctor   # [ok] Config · API Key · Substrate · TypeDB — exit 0
```

---

## The six verbs (canonical names from `dictionary.md`)

Every CLI verb and every SDK method resolves to one of six substrate verbs.
Learn these and you know the whole surface.

| Verb | What | CLI | SDK |
|---|---|---|---|
| `signal` | send an event to a receiver | `oneie signal` | `client.signal()` |
| `mark` | strengthen a path (success) | `oneie mark` | `client.mark()` |
| `warn` | weaken a path (failure) | `oneie warn` | `client.warn()` |
| `fade` | decay all paths (resistance 2× faster) | `oneie fade` | `client.fade()` |
| `follow` | pick strongest path (deterministic) | `oneie highways` | `client.highways()` |
| `harden` | promote highways → hypotheses | `oneie know` | `client.know()` |

**Signal type is frozen:** `{ receiver: string; data?: unknown }`. Never try
to narrow `data` — convention (`{ tags?, weight?, content? }`) lives in docs,
not in TypeScript. See `dsl.md`.

---

## Four outcomes (apply everywhere an `ask` returns)

```ts
type Outcome<T> =
  | { result: T }          // success  → mark(edge, chainDepth)
  | { timeout: true }      // slow     → neutral, chain continues
  | { dissolved: true }    // missing  → warn(edge, 0.5)
  | { error: string }      // failure  → warn(edge, 1)
```

Every loop you write closes on one of these. That's Rule 1 — Closed Loop.
See `patterns.md`.

---

## CLI — every verb at a glance

Full reference: [cli-reference.md](cli-reference.md). The table below is the
living contract, generated from `packages/cli/src/commands/`.

### Substrate (12 — `dsl.md`)

| Verb | Usage | API | Loop |
|---|---|---|---|
| `signal` | `oneie signal <receiver> [--data D]` | `POST /api/signal` | L1 |
| `ask` | `oneie ask <receiver> [--data D] [--timeout MS]` | `POST /api/ask` | L1 |
| `mark` | `oneie mark <from->to> [--strength N]` | `POST /api/loop/mark-dims` | L2 |
| `warn` | `oneie warn <from->to> [--strength N]` | `POST /api/loop/mark-dims` | L2 |
| `fade` | `oneie fade [--rate R]` | `POST /api/decay-cycle` | L3 |
| `select` | `oneie select [--type T]` | `GET /api/loop/stage` | L1 |
| `highways` | `oneie highways [--limit N]` | `GET /api/loop/highways` | L2/L6 |
| `know` | `oneie know` | `POST /api/tick?loops=L6` | L6 |
| `recall` | `oneie recall [--subject S]` | `GET /api/hypotheses` | L6 |
| `reveal` | `oneie reveal <uid>` | `GET /api/memory/reveal/:uid` | L6 |
| `forget` | `oneie forget <uid> --yes` | `DELETE /api/memory/forget/:uid` | — |
| `frontier` | `oneie frontier <uid>` | `GET /api/memory/frontier/:uid` | L7 |

### Commerce (8 — [buy-and-sell.md](buy-and-sell.md), [revenue.md](revenue.md))

| Verb | Usage |
|---|---|
| `pay`          | `oneie pay <to> --from <uid> --task <id> [--amount N]` |
| `hire`         | `oneie hire <providerUid> <skillId> [--message <txt>]` |
| `bounty`       | `oneie bounty <uid> <skillId> --price N --deadline N` |
| `commend`      | `oneie commend <agent-id>` |
| `flag`         | `oneie flag <agent-id>` |
| `status`       | `oneie status <agent-id> <active\|inactive>` |
| `capabilities` | `oneie capabilities <agent-id> --task <name> [--price N]` |
| `publish`      | `oneie publish <skillId> --name N --price N [--scope S]` |

### Observability (4 — `speed.md`, `routing.md`)

| Verb | Usage |
|---|---|
| `stats`   | `oneie stats`   — units, skills, highways, revenue, signals |
| `health`  | `oneie health`  — status, uptime, world, version |
| `revenue` | `oneie revenue` — GDP, top earners |
| `export`  | `oneie export <paths\|units\|skills\|highways\|toxic>` |

### Ergonomics / Interactive (9)

| Verb | Usage |
|---|---|
| `config list\|add\|use\|rm` | profile management (`~/.config/oneie/`) |
| `completion bash\|zsh\|fish`| print shell completion script |
| `doctor`                   | 4-check self-diagnosis, exit 0/1 |
| `repl`                     | interactive substrate shell, history at `~/.config/oneie/repl_history` |
| `pipe`                     | NDJSON stdin → signal → NDJSON stdout |
| `tail [--tag filter]`      | live-tail `GET /api/stream` SSE |

### Agents / deploy (6)

| Verb | Usage |
|---|---|
| `init`              | scaffold a new ONE project |
| `agent [<dir>]`     | parse + sync `*.md` → TypeDB. `--watch` for live sync |
| `sync [tick\|fade\|evolve\|know\|frontier]` | `POST /api/tick` |
| `claw <agent-id>`   | generate NanoClaw config from `/api/claw` |
| `launch <agentUid>` | agent-launch `/v1/tokens` + `token-launched` signal |
| `deploy`            | full 8-step pipeline (calls `bun run deploy`) |

### Global flags

`--profile <name>` · `--output table\|json\|yaml` · `--dry-run` · `--quiet` · `--verbose`.

### Admin (monorepo only)

`admin build` · `admin release [patch\|minor\|major]` · `admin sync` · `admin list` · `admin validate`.

---

## SDK — every export at a glance

Full reference: [sdk-reference.md](sdk-reference.md). Surface comes from
`packages/sdk/src/index.ts`.

### Top-level imports

```ts
import {
  // Client — typed HTTP shell over the substrate
  SubstrateClient,
  // URLs / env resolution
  getApiUrl, getFrontendUrl, getEnvironment,
  resolveApiKey, resolveBaseUrl,
  PROD_API_URL, DEV_API_URL, PROD_FRONTEND_URL, DEV_FRONTEND_URL,
  // Namespaces
  storage,                  // sdk.storage.* → /api/storage/:uid[/:key]
  // Handoff
  validateEthAddress, generateDeployLink,
  // Launch
  launchToken,
  type LaunchOpts, type LaunchResult,
  // Errors
  OneSdkError, AuthError, RateLimitError, SubstrateError,
  TimeoutError, ValidationError,
  // Types
  type SdkConfig, type Outcome,
  // Telemetry
  telemetryEmit, isTelemetryDisabled, sessionId,
  // Version
  SDK_VERSION,
} from '@oneie/sdk'
```

### Subpath exports (tree-shaky)

| Subpath                | Gives you                                                  |
| ---------------------- | ---------------------------------------------------------- |
| `@oneie/sdk/client`    | `SubstrateClient` only                                     |
| `@oneie/sdk/urls`      | URL resolvers                                              |
| `@oneie/sdk/storage`   | `listStorage`, `getStorage`, `putStorage`, `deleteStorage` |
| `@oneie/sdk/handoff`   | `validateEthAddress`, `generateDeployLink`                 |
| `@oneie/sdk/launch`    | `launchToken`                                              |
| `@oneie/sdk/schemas`   | Zod schemas for every payload                              |
| `@oneie/sdk/errors`    | typed error classes                                        |
| `@oneie/sdk/react`     | React 19 hooks (opt-in peer: `react ^19`)                  |
| `@oneie/sdk/testing`   | mock client + fixtures                                     |
| `@oneie/sdk/telemetry` | opt-in usage ping                                          |

### `SubstrateClient` methods (1:1 with CLI verbs)

```ts
const one = new SubstrateClient({ baseUrl, apiKey })  // both optional — uses resolvers

// L1 — signal / ask
one.signal(sender, receiver, data?)
one.ask(receiver, data?, timeout?, from?)       // → Outcome<T>
one.select()

// L2/L3 — path economy
one.mark(edge, strength?, dims?)
one.warn(edge, strength?, dims?)
one.fade(trailRate?, resistanceRate?)
one.highways(limit = 10)

// L6/L7 — memory
one.know() · one.recall(status?) · one.reveal(uid) · one.forget(uid) · one.frontier(uid)

// Commerce
one.pay(from, to, task, amount)
one.hire(...)               // returns 402 escrow if unpaid path
one.bounty(opts) · one.bounties(query?)
one.publish(opts) · one.listMarket(opts?)
one.capabilities(uid) · one.discover(skill, limit = 10)

// Agents
one.authAgent(opts?) · one.register(uid, opts?) · one.syncAgent(markdown|world)
one.listAgents() · one.commend(uid) · one.flag(uid) · one.status(uid, active)
one.claw(name, opts?)

// Observability
one.stats() · one.health() · one.state() · one.revenue()
one.signals(opts?) · one.exportData(resource)

// Streams
one.chat(messages, opts?)   // → ReadableStream<Uint8Array>
one.closeLoop(opts)
```

### Error handling

Every method throws on HTTP ≥ 400 with a typed subclass:

| Class | Triggers on |
|---|---|
| `AuthError`       | 401, 403 |
| `ValidationError` | 400, 422 |
| `RateLimitError`  | 429 |
| `TimeoutError`    | 408, 504 |
| `SubstrateError`  | everything else ≥ 400 |

Catch `OneSdkError` if you just want the base class.

---

## Five things a fresh install can do

```bash
# 1 — send your first signal (closed loop, L1)
oneie signal chairman --data '{"tags":["onboard"],"content":"hi"}'

# 2 — ask and wait for an outcome
oneie ask chairman --data '{"tags":["quote"]}' --timeout 15000
#  → { result } | { timeout } | { dissolved } | { error }

# 3 — mark a path that worked (L2)
oneie mark alice->bob --strength 1

# 4 — see the top routes in your world (L2/L6)
oneie highways --limit 10 --output table

# 5 — live-tail the substrate (SSE)
oneie tail --tag signal
```

Same flow from code:

```ts
import { SubstrateClient } from '@oneie/sdk'
const one = new SubstrateClient()

const out = await one.ask('chairman', { tags: ['quote'] }, 15_000)
if ('result' in out)        await one.mark('me->chairman', 1)
else if ('dissolved' in out) await one.warn('me->chairman', 0.5)
else if ('error' in out)    await one.warn('me->chairman', 1)
// timeout → neutral, do nothing
```

---

## Storage (`sdk.storage.*` ↔ `/api/storage/:uid[/:key]`)

```ts
import { storage } from '@oneie/sdk'
await storage.putStorage(uid, 'pref.theme', 'dark', apiKey?)
await storage.getStorage(uid, 'pref.theme', apiKey?)    // → 'dark' | null
await storage.listStorage(uid, apiKey?)                 // → StorageEntry[]
await storage.deleteStorage(uid, 'pref.theme', apiKey?)
```

No CLI equivalent — storage is per-uid scratch space for app code.

---

## Launch handoff (mint lives outside the substrate)

```ts
import { launchToken } from '@oneie/sdk'
const res = await launchToken('marketing:creative', {
  chain: 'sui',             // 'sui' | 'base' | 'solana'
  dryRun: true,
  agentLaunchUrl: 'https://agent-launch.ai/api',
  apiKey: process.env.AGENT_LAUNCH_KEY,
})
// → { tokenId, address?, chain, dryRun, raw }
```

CLI equivalent: `oneie launch <agentUid> [--dry-run] [--chain sui|base|solana]`.

Buy / sell / holders / delegation all live on `agent-launch.ai`. The substrate
just emits `token-launched` into `/api/signal` after a successful mint so the
path can `mark()` the handoff.

---

## Locked rules the CLI and SDK both enforce

1. **Closed loop.** Every signal ends in `mark`, `warn`, or `dissolve`. No silent returns.
2. **Structural time only.** Plan in tasks → waves → cycles. Never days / hours / sprints.
3. **Deterministic results.** Every loop reports verified numbers (tests, ms, rubric) — pheromone without receipts is superstition.

See `patterns.md` and `.claude/rules/engine.md`.

---

## Troubleshooting in order

| Symptom | Fix |
|---|---|
| `[fail] Config`         | `oneie config add <name> --url ... --key ...` then `oneie config use <name>` |
| `[fail] API Key`        | `export ONEIE_API_KEY=sk-...` or add to profile file |
| `[fail] Substrate`      | wrong `ONEIE_API_URL`, or the substrate is down — try `curl https://api.one.ie/health` |
| `[fail] TypeDB`         | gateway up but TypeDB paused/unreachable — contact your operator |
| `AuthError: 401`        | key is valid format but rejected — rotate via `/api/keys` |
| `ValidationError: 400`  | inspect payload against `@oneie/sdk/schemas` Zod types |
| `RateLimitError: 429`   | back off, use `--output json | jq` to batch smarter |
| `TimeoutError: 504`     | substrate is healthy but a downstream (LLM, TypeDB) is slow — retry or `fade` stale paths |

---

## See Also

- [cli-reference.md](cli-reference.md) — every flag, every subcommand
- [sdk-reference.md](sdk-reference.md) — every export, every type
- [dictionary.md](dictionary.md) — canonical names, dead names, six verbs
- [dsl.md](dsl.md) — signal grammar
- [routing.md](routing.md) — L1-L7 loops, formula, select vs follow
- [rubrics.md](rubrics.md) — fit / form / truth / taste scoring
- [patterns.md](patterns.md) — closed loop, deterministic sandwich, zero returns
- [buy-and-sell.md](buy-and-sell.md) — commerce verbs
- [revenue.md](revenue.md) — five revenue layers
- [speed.md](speed.md) — performance budget the CLI observes
- [mcp-tools.md](mcp-tools.md) — 15 MCP tools that wrap the same verbs for editors
- [launch-handoff.md](launch-handoff.md) — the agent-launch contract
