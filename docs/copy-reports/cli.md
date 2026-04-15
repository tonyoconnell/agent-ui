# CLI Package Recon Report

**Source:** `/Users/toc/Server/agent-launch-toolkit/packages/cli/`  
**Scan Date:** 2026-04-15  
**Status:** Source-of-truth scan, no migrations yet

---

## Executive Summary

The CLI package is a **25-command surface** built on Commander.js with 7,849 lines across commands. All commands depend on `agentlaunch-sdk` for business logic. The CLI is Agentverse/BSC-specific, using HTTP clients for REST APIs and on-chain operations. **Key decisions:**

- **Copy category breakdown:** 10 lift-shift, 9 rewrite-on-substrate, 4 drop, 2 replace-with-Sui
- **Highest priority 5:** `create` (agent scaffolding), `deploy` (to Agentverse), `tokenize` (bonding curve), `wallet` (balance queries), `init` (project setup)
- **Pure duplicates of ONE verbs:** `/create agent` ≈ `create`, `/deploy` ≈ `deploy`, `/sync pay` ≈ `pay`, `/claw` ≈ `connect`
- **External deps to replace:** Agentverse HTTP (→ persist/signal), BSC bonding curve (→ Sui Move), Cosmos wallet auth (→ Sui native)

---

## File Inventory

| File | LOC | Purpose | Copy Category | Dimensions | Key Exports/Commands |
|------|-----|---------|---|---|---|
| **Core** | | | | | |
| `index.ts` | 125 | CLI entry point, command registration | lift-shift | Actor | `registerXCommand` × 19 |
| `config.ts` | 189 | User config file (~/.agentlaunch/), API key mgmt | lift-shift | Thing | `readConfig()`, `writeConfig()`, `requireApiKey()` |
| `http.ts` | 66 | HTTP client wrapper + Agentverse auth | rewrite-on-substrate | Path | `getClient()`, `agentverseRequest()` |
| **Commands (25 total = 7,849 LOC)** | | | | | |
| `auth.ts` | 395 | Wallet auth → Agentverse API key | rewrite-on-substrate | Actor | `registerAuthCommand()`, `agentEnvPrefix()` |
| `alliance.ts` | 196 | Deploy 27-agent ASI Alliance swarm | drop | Event | `registerAllianceCommand()` |
| `buy.ts` | 180 | BSC bonding curve buy execution | replace-with-Sui | Thing | `registerBuyCommand()` |
| `claim.ts` | 82 | BSC testnet faucet claims | drop | Event | `registerClaimCommand()` |
| `comments.ts` | 196 | Token comment threads (read/post) | rewrite-on-substrate | Event | `registerCommentsCommand()` |
| `config.ts` | 78 | Config subcommands (set-key, show, set-url) | lift-shift | Thing | `registerConfigCommand()` |
| `connect.ts` | 277 | Deploy Agentverse HTTP proxy agent | rewrite-on-substrate | Path | `registerConnectCommand()` |
| `connect-logs.ts` | 100 | Fetch connect agent logs | rewrite-on-substrate | Learning | `registerConnectLogsCommand()` |
| `connect-status.ts` | 121 | Check connect agent health | rewrite-on-substrate | Learning | `registerConnectStatusCommand()` |
| `connect-update.ts` | 269 | Modify connect agent endpoint | rewrite-on-substrate | Path | `registerConnectUpdateCommand()` |
| `create.ts` | 850+ | Full agent scaffold → deploy → tokenize | rewrite-on-substrate | Path | `registerCreateCommand()`, `runCreate()` |
| `deploy.ts` | 330 | Deploy agent.py to Agentverse + optimization | rewrite-on-substrate | Path | `registerDeployCommand()` |
| `docs.ts` | 125 | Show skill.md, OpenAPI, integration matrix | already-exists | Learning | `registerDocsCommand()` |
| `holders.ts` | 138 | List token holder addresses + percentages | drop | Learning | `registerHoldersCommand()` |
| `init.ts` | 1,396 | Initialize project: .env, .claude/, .cursor/, skills | rewrite-on-substrate | Thing | `registerInit()` |
| `list.ts` | 194 | List tokens (paginated, sortable table) | rewrite-on-substrate | Thing | `registerListCommand()` |
| `marketing.ts` | 114 | Deploy 7-agent Marketing Team swarm | drop | Event | `registerMarketingCommand()` |
| `optimize.ts` | 150 | Update agent metadata for Agentverse ranking | rewrite-on-substrate | Event | `registerOptimizeCommand()` |
| `org-template.ts` | 28 | (stub; no command) | drop | — | (empty file) |
| `pay.ts` | 210 | Token transfer + invoicing (on-chain) | replace-with-Sui | Event | `registerPayCommand()` |
| `scaffold.ts` | 191 | Scaffold agent directory (legacy name for create) | already-exists | Path | `registerScaffoldCommand()` |
| `sell.ts` | 159 | BSC bonding curve sell execution | replace-with-Sui | Thing | `registerSellCommand()` |
| `skill.ts` | 115 | Fetch/display skill manifest & MCP config | already-exists | Learning | `registerSkillCommand()` |
| `status.ts` | 159 | Show token details (price, market cap, holders) | rewrite-on-substrate | Learning | `registerStatusCommand()` |
| `swarm-from-org.ts` | 352 | Org chart → multi-agent deploy config | rewrite-on-substrate | Group | `registerSwarmFromOrgCommand()` |
| `tokenize.ts` | 346 | Create token on bonding curve + handoff link | replace-with-Sui | Thing | `registerTokenizeCommand()` |
| `wallet.ts` | 313 | Multi-token wallet ops (balances, send, allowance) | replace-with-Sui | Thing | `registerWalletCommand()` |
| **Lib** | | | | | |
| `lib/deploy-swarm.ts` | 225 | Shared swarm orchestration (deploy + scaffold) | rewrite-on-substrate | Path | `deploySwarmAgents()`, `scaffoldSwarm()` |

**Total:** 32 files, 7,849 lines

---

## External Dependencies (DON'T translate)

### 1. **Agentverse HTTP API** (21 commands)
SDK wraps `https://api.agentverse.ai/v1` for:
- Agent CRUD + deployment + compilation polling
- Secrets + metadata updates  
- Discovery + manifest publishing

**ON ONE:** Replace with `persist(signal('deploy-agent', ...))` → pheromone routing to bridging service.

### 2. **BSC Bonding Curve** (3 commands: buy, sell, claim)
- Solidity contracts on BSC testnet (97) & mainnet (56)
- 800M tradeable + 200M DEX reserve per token
- 2% protocol fee (immutable)
- Graduation to DEX at 30k FET target

**ON ONE:** Move entire mechanism to Sui (`src/move/one/bonding.move`). Claim faucet is testnet-specific; drop.

### 3. **Cosmos Wallet Auth** (1 command: auth)
- Derives Cosmos address from private key via `@cosmjs/crypto` + `bech32`
- Signs challenge, exchanges for Agentverse API key

**ON ONE:** Use Sui native (`src/lib/sui.ts`). Private key → Sui address derivation.

### 4. **On-Chain Token Transfers** (1 command: pay)
- Uses ethers.js to sign & broadcast BSC transactions
- Multi-token balance checks (FET, USDC) on BSC

**ON ONE:** Sui Move, use `sui-sdk` for transactions + balance queries.

---

## Copy Categories

### Lift-Shift (No Substrate Changes)
5 files: rename, rewire imports, zero logic change.

- `config.ts` — Store/load API key. **Migrate to:** ~/.one/cli-config.json (or TypeDB Trail for learned keys).
- `config.ts` (command) — Set-key/show/set-url. **No-op:** already in ONE as `/config` or merged into `/sync`.
- Index markers only (auto-discovery of templates, constants).

### Rewrite on Substrate (Agentverse → Persist)
9 files: Core CLI flow that needs signal/persist bridging.

- `create.ts` — scaffold → persist signal for `deploy-agent` → wait for Highway response.
- `deploy.ts` — Same, direct deploy mode.
- `connect.ts/update.ts/logs.ts/status.ts` — Deploy HTTP proxy agent. Becomes nanoclaw with external URL handler.
- `list.ts`, `status.ts`, `comments.ts` — Query cached token metadata (rewrite to TypeDB + pheromone).
- `init.ts` — Project setup. Still generates .env, .claude/, but templates point to Sui + ONE verbs.
- `lib/deploy-swarm.ts` — Wave-based parallel deployment. Keep orchestration; rewrite agent generation.

### Replace with Sui
4 files: BSC-specific → Sui Move.

- `buy.ts`, `sell.ts` — Bonding curve. Maps to Sui coin flip or custom bonding module.
- `tokenize.ts` — Record creation. Becomes TypeDB + Sui deployment in one flow.
- `wallet.ts` — Balance/send. Use sui-sdk for all operations.
- `pay.ts` — Invoicing. Sui Move for on-chain; TypeDB for record keeping.

### Drop (Fetch-specific growth tactics)
4 files: Not needed on ONE.

- `alliance.ts` — ASI Alliance swarm (27 agents). Fetch internal. Demo only; can recreate as example swarm later.
- `marketing.ts` — Marketing team (7 agents). Same; example swarm.
- `claim.ts` — Testnet faucet (BSC). Not applicable once ONE testnet is live.
- `org-template.ts` — Empty stub file. Remove.

### Already Exists in ONE
3 commands with direct mappings.

- `/create agent` ≈ `create.ts` (scaffold + deploy). Extend `/create` to wrap toolkit.
- `/deploy` ≈ `deploy.ts`. Already implemented for nanoclaw/Agentverse bridge.
- `/sync pay` ≈ `pay.ts`. Already implemented for Sui transfers.

---

## Dimensional Mapping

| Dimension | Commands | Notes |
|-----------|----------|-------|
| **Group** | swarm-from-org | Multi-agent orchestration; extends org structure. |
| **Actor** | auth, wallet, init | Identity, credentials, project persona. |
| **Thing** | config, list, status, holders, tokenize, buy, sell, pay | Data objects & commerce. |
| **Path** | create, deploy, connect, scaffold, init, lib/deploy-swarm | Workflows & routing. |
| **Event** | claim, comments, alliance, marketing, optimize | State changes & messaging. |
| **Learning** | docs, status, holders, comments, connect-logs, skill | Discovery & introspection. |

---

## Routing Tags

- **cli**: All commands (25)
- **tokenize**: buy, sell, tokenize, status, holders
- **wallet**: wallet, pay, auth
- **connect**: connect, connect-logs, connect-status, connect-update (Agentverse proxy)
- **deploy**: create, deploy, init, optimize
- **marketing**: alliance, marketing (swarms; drop or demo)
- **create-agent**: create, scaffold (agent scaffolding)

---

## Summary by Copy Category

| Category | Count | Files | Effort |
|----------|-------|-------|--------|
| **Lift-Shift** | 2 | config.ts, index.ts (partial) | 3h (import rewire) |
| **Rewrite** | 9 | create, deploy, connect×4, list, status, comments, init, lib/deploy-swarm | 80h (signal/persist, 6-dim routing) |
| **Replace with Sui** | 4 | buy, sell, tokenize, wallet, pay | 60h (Move contract + TypeDB integration) |
| **Drop** | 4 | alliance, marketing, claim, org-template | 0h |
| **Already Exists** | 3 | docs, skill, scaffold (maps to /create) | 10h (extend ONE verbs) |
| | **TOTAL** | **32** | | **~150h** |

---

## Highest Priority 5 Commands (Porting Order)

1. **`create` (850 LOC)** — Agent scaffold → deploy → tokenize flow. Core user journey. **Blocks:** everything that follows.
2. **`deploy` (330 LOC)** — Push code to nanoclaw (not Agentverse). **Blocks:** create, optimize, init.
3. **`tokenize` (346 LOC)** — Create Sui asset + record. **Blocks:** buy/sell, commerce loop.
4. **`wallet` (313 LOC)** — Sui balance queries, transfers. **Blocks:** buy, sell, pay, auth.
5. **`init` (1,396 LOC)** — Project bootstrap (biggest file). Sets up .claude/, .cursor/, env templates. **Blocks:** developer onboarding.

---

## Absolute Duplicates (Same Functionality, Different Names)

| CLI Command | ONE Verb | Status | Merge Strategy |
|---|---|---|---|
| `create` + `scaffold` | `/create agent` | DUPLICATE | Extend `/create` to use toolkit's templates |
| `deploy` | `/deploy` | DUPLICATE | Extend `/deploy` for nanoclaw + Agentverse bridge |
| `pay` | `/sync pay` | DUPLICATE | Extend `/sync pay` for multi-token + invoicing |
| `connect` + `connect-*` | `/claw` | QUASI | `/claw` is more general (any integration). Merge connect logic into bridge handler. |
| `config` (set-key, etc) | `/config` or settings merge | DUPLICATE | Merge into `/sync` or new `/cli` verb. |

**Action:** W2 decides: extend vs replace vs merge. Recommend extend (`/create agent --toolkit-template`) to preserve ONE UX while adding toolkit power.

---

## External Dependency Tree

```
agentlaunch-sdk (sole dependency)
├─ Agentverse HTTP         → rewrite to persist
├─ BSC Web3 (ethers.js)    → replace with sui-sdk
├─ @cosmjs/crypto          → drop (Sui native)
├─ commander.js            → keep
└─ node: fs, path, readline, child_process → keep
```

**agentlaunch-templates** (optional, used by create/deploy)
- Used for: code generation, env templates, .claude/ rules
- **ON ONE:** Merge into `packages/templates/` + `agents/**/*.md` presets

---

## Risk / Assumptions

1. **Agentverse bridge timing:** W2 must finalize bridge design before W3. Deploy + create both depend on it.
2. **Sui bonding curve:** No existing Move module; must write `src/move/one/bonding.move`. Test on testnet.
3. **TypeDB scaling:** List/status commands query 1000s of tokens. Ensure pheromone caching strategy is ready.
4. **Swarm orchestration:** Alliance/marketing are 27- and 7-agent deployments. Test parallel waves with real wallets.
5. **Private key handling:** Auth command prompts for wallet key. ONE must finalize key storage (vault/managed secret/TypeDB).

---

## See Also

- Copy plan: `/Users/toc/Server/envelopes/docs/agent-launch-copy-plan.md`
- ONE verb reference: `/Users/toc/Server/envelopes/CLAUDE.md`
- CLI reference (source): `../agent-launch-toolkit/docs/cli-reference.md`
- SDK reference (source): `../agent-launch-toolkit/docs/sdk-reference.md`

