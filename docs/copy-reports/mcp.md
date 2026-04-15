# MCP Package Recon

**Source:** `/Users/toc/Server/agent-launch-toolkit/packages/mcp/`  
**Scope:** Complete toolkit inventory at package/file level for copying to ONE  
**Dimension:** Verbs ONE wants exposed: signal, ask, mark, warn, recall, reveal, forget, frontier, know, highways

---

## Source Files Inventory

| File | LOC | Purpose | Tool Category |
|------|-----|---------|---|
| `src/env.ts` | 10 | Load .env before SDK init | (infrastructure) |
| `src/serve.ts` | 113 | HTTP SSE transport layer | (infrastructure) |
| `src/index.ts` | 1,205 | Tool dispatcher, 40+ tool definitions | (routing) |
| `src/tools/auth.ts` | 300 | wallet_auth, generate_wallet, check_auth | Authentication |
| `src/tools/agentverse.ts` | 340 | deploy_to_agentverse, update_agent_metadata | Deploy |
| `src/tools/calculate.ts` | 94 | calculate_buy, calculate_sell | Trading |
| `src/tools/comments.ts` | 114 | get_comments, post_comment | Discovery |
| `src/tools/commerce.ts` | 568 | deploy_swarm, check_agent_commerce, network_status | Commerce |
| `src/tools/connect/deploy.ts` | 216 | connect_agent (HTTPS proxy) | Connect |
| `src/tools/connect/status.ts` | 118 | get_connection_status | Connect |
| `src/tools/connect/update.ts` | 137 | update_connection | Connect |
| `src/tools/connect/index.ts` | 20 | Handler re-exports | (routing) |
| `src/tools/custodial.ts` | 217 | get_agent_wallet, buy_token, sell_token | Custodial |
| `src/tools/discovery.ts` | 144 | list_tokens, get_token, get_platform_stats | Discovery |
| `src/tools/handoff.ts` | 373 | create_token_record, get_deploy_instructions, get_trade_link | Handoff |
| `src/tools/payments.ts` | 385 | multi_token_payment, check_spending_limit, create_delegation, create_invoice | Payments |
| `src/tools/scaffold.ts` | 453 | scaffold_agent, scaffold_swarm, generate_org_template, scaffold_org_swarm | Scaffold |
| `src/tools/skill.ts` | 202 | get_skill, install_skill | Skill/Bootstrap |
| `src/tools/tokenize.ts` | 304 | create_and_tokenize | Tokenize |
| `src/tools/trading.ts` | 169 | buy_tokens, sell_tokens, get_wallet_balances | Trading |

**Total:** 20 files, 5,482 LOC

---

## Tool Categories (14 domains)

| Category | Tools | Purpose | Translates? |
|---|---|---|---|
| **Auth** | wallet_auth, generate_wallet, check_auth | Fetch.ai wallet signing + Agentverse API key | ❌ Cosmos-specific |
| **Agentverse** | deploy_to_agentverse, update_agent_metadata | Deploy Python agents to Fetch.ai marketplace | ❌ Agentverse HTTP only |
| **Discovery** | list_tokens, get_token, get_platform_stats, get_comments, post_comment | Query bonding-curve token market | Partial (need Sui market) |
| **Calculate** | calculate_buy, calculate_sell | Dry-run token trades (2% fee bonding curve) | Partial (Sui AMM) |
| **Trading** | buy_tokens, sell_tokens, get_wallet_balances | Execute on-chain trades | ❌ EVM BSC (97/56 chains) |
| **Custodial** | get_agent_wallet, buy_token, sell_token | Wallet management + custodial trading | ❌ EVM only |
| **Payments** | multi_token_payment, check_spending_limit, create_delegation, get_fiat_link, create_invoice, list_invoices, get_multi_token_balances | ERC-20 transfer + invoice/delegation system | ❌ EVM (mostly FET/USDC on BSC) |
| **Commerce** | deploy_swarm, check_agent_commerce, network_status | Multi-agent commerce deployment | Mixed (Agentverse + local) |
| **Connect** | connect_agent, get_connection_status, update_connection | HTTPS proxy bridge to external endpoints | ✅ Substrate-agnostic |
| **Scaffold** | scaffold_agent, scaffold_swarm, generate_org_template, scaffold_org_swarm | Code generation from templates | ✅ Mostly substrate-agnostic |
| **Tokenize** | create_and_tokenize | Create token + deploy agent in one go | ❌ EVM BSC bonding curve |
| **Handoff** | create_token_record, get_deploy_instructions, get_trade_link | User-friendly UI flows | ✅ Mostly UI routing |
| **Skill** | get_skill, install_skill | MCP self-discovery + Claude Code install | ✅ CLI orchestration |
| **Payments** (invoice) | create_invoice, list_invoices | Invoice generation + tracking | Mixed (local + Agentverse) |

---

## External Dependencies That DON'T Translate

### Package: `agent-launch-mcp` (v2.3.8)
**Direct deps:**
- `agentlaunch-sdk` (v0.2.11) — **AGENTVERSE WRAPPER** — HTTP client for Fetch.ai API
- `agentlaunch-templates` (v0.4.11) — **TEMPLATE GENERATOR** — Python agent scaffolding
- `@cosmjs/crypto` (v0.32.0) — **COSMOS SIGNING** — Bech32 + secp256k1 (Cosmos ADR-036)
- `ethers` (v6.0.0) — **EVM SIGNING** — BSC tx building
- `bech32` (v2.0.0) — **COSMOS ENCODING** — Cosmos address format
- `@modelcontextprotocol/sdk` (v1.28.0) — **REUSABLE** — MCP protocol
- `dotenv` (v17.3.1) — **REUSABLE** — env loading
- `http` (builtin) — **REUSABLE** — HTTP SSE transport

### Cosmos/Fetch-specific:
- **Wallet auth:** ADR-036 challenge/signing protocol unique to Cosmos
- **Bech32 addresses:** `fetch1...` format, derives from Cosmos mnemonics
- **Agentverse HTTP:** Fixed URLs + shape (agents.fetch.ai, agentverse.ai, agentverse-pilot.deltadao.com)
- **Agent deployment:** Python uAgent framework, Fetch AI registry

### EVM/BSC-specific:
- **Token trades:** Bonding curve lives on BSC (chain 97 testnet, 56 mainnet)
- **Custodial:** ethers.js signing + tx submission to BSC RPC
- **ERC-20 transfers:** Standard ERC-20 interface
- **Fiat onramp:** Likely wired to BSC stablecoin addresses

---

## Copy Categories

| Category | Files | Action | Reason |
|---|---|---|---|
| **Lift-and-shift** | connect/*, scaffold/*, skill.ts, handoff.ts | Copy + rename | Substrate-agnostic routing, template logic, UI flows |
| **Rewrite on substrate** | auth.ts, discovery.ts, commerce.ts, payments.ts (invoice parts) | Rewrite against Sui | Swap Cosmos/EVM wallet → Sui keypairs; HTTP discovery → TypeDB queries |
| **Replace with Sui** | trading.ts, custodial.ts, tokenize.ts, payments.ts (transfer) | New Sui contract + bridge | Bonding curve → Sui Move; ERC-20 → native tokens; custody → on-chain escrow |
| **Drop** | agentverse.ts (deploy), auth.ts (Cosmos parts) | No copy | Fetch-specific growth tactics; no Agentverse bridge yet |
| **Already exists in ONE** | connect/*, handoff.ts, scaffold.ts | Flag for extend | `/claw` covers connect; `/create agent` covers scaffold; `/ask` covers handoff |

---

## Tool Mapping: Toolkit → ONE Substrate Verbs

**ONE's 10 substrate verbs:**
- `signal` — emit a message (edge, unit, skill)
- `ask` — signal + wait for response (closed loop)
- `mark` — strengthen path (success/learning)
- `warn` — weaken path (failure/toxicity)
- `recall` — query hypotheses (bi-temporal)
- `reveal` — full MemoryCard (audit)
- `forget` — GDPR erasure
- `frontier` — unexplored tag clusters
- `know` — promote highways to permanent learning
- `highways` — top paths by strength

**Toolkit tools → Substrate verb mapping:**

| MCP Tool | → Verb | Mapping |
|---|---|---|
| **ask** (signal/ask APIs) | `ask` | Direct: await response |
| **mark/warn** (path strength) | `mark`/`warn` | Direct: update pheromone |
| **recall** (query API) | `recall` | Direct: TypeDB query |
| **reveal** (MemoryCard) | `reveal` | Direct: audit endpoint |
| **forget** (GDPR) | `forget` | Direct: cascade delete |
| **frontier** (unexplored tags) | `frontier` | Direct: tag diff query |
| **know** (highways→learning) | `know` | Direct: promote top paths |
| **highways** (top paths) | `highways` | Direct: strength ranking |
| `wallet_auth`, `generate_wallet` | `signal` | Emit auth signal → persist actor |
| `create_and_tokenize` | `signal` + `mark` | Emit tokenize signal → mark on success |
| `buy_tokens`, `sell_tokens` | `signal` + `mark`/`warn` | Emit trade signal → mark/warn on outcome |
| `scaffold_agent` | `signal` | Emit create signal → mark on success |
| `connect_agent` | `signal` | Emit bridge signal → mark on endpoint health |
| `list_tokens`, `get_token` | `ask` | Query market state (no result deposit) |
| `get_comments`, `post_comment` | `signal` (post) | Comments attach to units/skills as trail metadata |
| `check_spending_limit` | `ask` | Query user capability/limit |
| `get_connection_status` | `ask` | Query bridge status (no deposit) |

**Summary:**
- 8 toolkit concepts (ask/mark/warn/recall/reveal/forget/frontier/know) map **directly** to ONE verbs
- 2 additional (highways, signal) already in toolkit, map 1:1
- Remaining 12 tools require **rewriting** to emit signals instead of direct HTTP calls

---

## Dimensional Tags (6 dimensions of ONE)

| Dimension | Tools | Purpose |
|---|---|---|
| **Thing** (entities) | discover (tokens), skill (manifest), create_token_record | Discoverable objects in world |
| **Actor** (agents) | auth, generate_wallet, scaffold_agent, deploy_to_agentverse | Identity + capability |
| **Group** (teams) | scaffold_swarm, commerce (deploy_swarm), scaffold_org_swarm | Multi-agent coordination |
| **Path** (relationships) | mark/warn (implicit in trading, payments), highways (from pheromone) | Strength between actors |
| **Event** (signals) | buy_tokens, sell_tokens, post_comment, create_invoice | Atomic state changes |
| **Learning** (hypotheses) | recall, frontier, know (from toolkit primitives), check_spending_limit | Knowledge evolution |

---

## Risk Assessment

| Tool | Risk | Complexity |
|---|---|---|
| `wallet_auth`, `generate_wallet` | **HIGH** — Cosmos signature scheme | Rewrite to Sui keypair derivation |
| `buy_tokens`, `sell_tokens` | **HIGH** — EVM BSC trades | Replace with Sui Move contract |
| `create_and_tokenize` | **HIGH** — Depends on above | Replace with Sui contract entry |
| `agentverse.*` | **DEPRECATE** — Fetch-only | No bridge yet; skip W1 |
| `custodial.*` | **HIGH** — EVM wallet management | Replace with Sui account abstraction |
| `payments.multi_token_payment` | **HIGH** — ERC-20 transfers | Replace with Sui coin module |
| `connect_agent` | **LOW** — HTTPS routing | Lift-shift, wire to `/claw` |
| `scaffold_agent`, `scaffold_swarm` | **LOW** — Template logic | Lift-shift, wire to `/create` |
| `list_tokens`, `get_token` | **MEDIUM** — Discovery | Lift-shift, point to TypeDB instead of HTTP |

---

## Proposed @one/mcp Tool List

**Tier 1 (W3 first):**
1. `signal_ask` — emit signal + wait (wraps world.ask)
2. `mark_path` — strengthen edge (wraps world.mark)
3. `warn_path` — weaken edge (wraps world.warn)
4. `recall_hypotheses` — query TypeDB (wraps persist.recall)
5. `reveal_memory` — audit unit (wraps persist.reveal)
6. `forget_actor` — GDPR erasure (wraps persist.forget)
7. `highways` — top paths (wraps world.highways)
8. `frontier_tags` — unexplored clusters (wraps persist.frontier)

**Tier 2 (W3 second pass):**
9. `scaffold_agent` — agent.md generator (lift-shift from toolkit)
10. `list_agents` — browse market (rewrite to TypeDB)
11. `get_agent` — agent details (rewrite to TypeDB)

**Tier 3 (W3 third pass, depends on Sui bridge):**
12. `create_unit_on_sui` — derive agent address (wraps src/lib/sui.ts)
13. `tokenize_on_sui` — bonding curve contract (new Move contract)
14. `buy_on_sui` — trade on Sui AMM (wraps Sui SDK)
15. `sell_on_sui` — trade on Sui AMM (wraps Sui SDK)

**NOT IN W3:**
- `deploy_to_agentverse` — wait for Phase 2 bridge
- `wallet_auth` (Cosmos) — replaced by Sui keypair in #12
- `custodial.*` — replaced by on-chain escrow
- `connect_agent` — already live as `/claw`

---

## Summary Table

| Metric | Count |
|---|---|
| **Total files** | 20 |
| **Total LOC** | 5,482 |
| **Lift-and-shift** | 4 files (connect, scaffold, skill, handoff) = 1,249 LOC |
| **Rewrite on substrate** | 8 files (auth, discovery, commerce, payments partial, trading partial) = ~2,400 LOC |
| **Replace with Sui** | 4 files (trading, custodial, tokenize, payments partial) = 1,270 LOC |
| **Drop** | 1 file (agentverse.ts) = 340 LOC |
| **Already in ONE** | 2 files (connect, scaffold concepts) = noted above |
| **Toolkit → Verb matches** | 8/10 verbs found (ask, mark, warn, recall, reveal, forget, know, highways) |
| **Agentverse-only tools** | 3 (deploy_to_agentverse, wallet_auth Cosmos, custodial EVM) |
| **NEW: Sui-native tools needed** | 4 (derive_agent_address, tokenize_sui, buy_sui, sell_sui) |

---

## Exit Criteria for MCP Porting

```
✓ 8 core substrate verb tools callable via MCP
✓ scaffold_agent returns agent.md ready for TypeDB sync
✓ list/get agent queries hit TypeDB not HTTP
✓ buy/sell on Sui testnet (via new contract + bridge.ts)
✓ Signal emission in all mutating tools (tokenize, trade, scaffold)
✓ Path pheromone auto-marks on completion
✓ 0 hardcoded Agentverse URLs in @one/mcp
✓ @one/mcp exports 12 tools, each with _markdown + schema
```

---

## See Also

- `/Users/toc/Server/agent-launch-toolkit/packages/mcp/` — source
- `docs/TODO-template.md` — structure for W2 tasks
- `docs/DSL.md` — substrate verb definitions
- `src/lib/sui.ts` — Sui client that replaces ethers + @cosmjs
- `src/engine/world.ts` — ask/mark/warn implementation
- `src/engine/persist.ts` — recall/reveal/forget implementation
- `docs/copy-reports/` — other surface recons (cli, sdk, templates, skill, docs, walletauth)
