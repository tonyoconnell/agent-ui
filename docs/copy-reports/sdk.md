# SDK Recon Report

**Source:** `/Users/toc/Server/agent-launch-toolkit/packages/sdk/src/`  
**Target:** ONE's substrate (6-dimension + `src/engine/` primitives)  
**Date:** 2026-04-15

---

## File-by-File Analysis

### agentlaunch.ts (752 LOC)
**Purpose:** Fluent wrapper class providing namespaced API surface across all SDK modules.

**Public Exports:**
- `AgentLaunch` class with 10 namespaces: `tokens`, `market`, `handoff`, `agents`, `auth`, `storage`, `commerce`, `onchain`, `payments`, `trading`
- Namespace interfaces: `TokensNamespace`, `MarketNamespace`, `HandoffNamespace`, `AgentsNamespace`, `AuthNamespace`, `StorageNamespace`, `CommerceNamespace`, `OnchainNamespace`, `PaymentsNamespace`, `TradingNamespace`
- `TokenizeResult` type

**External Deps (non-translatable):**
- Agentverse HTTP (`agentverse.ai/v1`) — all auth/storage endpoints
- BSC EVM bonding curve contracts (hardcoded addresses for chains 97, 56)

**Copy Category:** Rewrite-on-substrate  
**Dimensional Tag:** Actor (fluent SDK client interface) + Path (multi-step commerce flows)

**Overlaps:** Wraps all other SDK modules. ONE engine has `world()`, `persist()`, `unit()`, `ask()`, `llm()` — the namespace pattern can be adapted to these primitives.

---

### client.ts (292 LOC)
**Purpose:** HTTP client with exponential backoff retry on 429 rate limits.

**Public Exports:**
- `AgentLaunchClient` class with: `get<T>()`, `post<T>()`, `postPublic<T>()`, `baseUrl` property

**External Deps (non-translatable):**
- AgentLaunch HTTP API endpoints (`/api/*`)

**Copy Category:** Lift-and-shift (rename)  
**Dimensional Tag:** Infrastructure (HTTP layer)

**Overlaps:** ONE's `fetch()` in bridge/ask primitives; could be integrated into `ask()` flow.

---

### types.ts (705 LOC)
**Purpose:** Canonical TypeScript types for all SDK operations.

**Public Exports:**
- `AgentLaunchConfig`, `AgentLaunchError`, `AgentLaunchErrorCode`
- Token types: `TokenizeParams`, `TokenizeResponse`, `Token`, `TokenListParams`, `TokenListResponse`
- Market types: `HolderListResponse`, `CalculateBuyResponse`, `CalculateSellResponse`
- Agent types: `AgentAuthResponse`, `MyAgentsResponse`, `ImportAgentverseResponse`
- Commerce types: `AgentRevenue`, `PricingEntry`, `AgentCommerceStatus`, `NetworkGDP`
- Trading types: `ExecuteBuyParams`, `CustodialBuyResult`, `WalletInfoResponse`
- Payment types: `PaymentToken`, `Invoice`, `SpendingLimit`, `FiatOnrampParams`
- Agentverse types: `AgentverseDeployOptions`, `AgentverseStatusResponse`

**External Deps (non-translatable):**
- Agentverse API shapes (all `/v1/hosting/*` responses)
- BSC chain IDs (97, 56) and EVM addresses

**Copy Category:** Rewrite-on-substrate (rename + adapt for Sui)  
**Dimensional Tag:** Thing (data structures)

**Overlaps:** ONE schema in `src/schema/one.tql` will replace most agent/token/commerce types.

---

### tokens.ts (137 LOC)
**Purpose:** Token CRUD (create, list, fetch by address).

**Public Exports:**
- `tokenize(params, client?)` → creates pending token, returns `{ success, data }`
- `getToken(address, client?)` → fetches deployed token by contract address
- `listTokens(params?, client?)` → lists tokens with pagination

**External Deps (non-translatable):**
- `POST /agents/tokenize`, `GET /tokens/address/{addr}`, `GET /tokens/...` (AgentLaunch API)

**Copy Category:** Rewrite-on-substrate  
**Dimensional Tag:** Thing (token entity)

**Overlaps:** ONE will define tokens in TypeDB + Move contracts; `tokenize()` becomes a `mark()` signal (intent → pheromone route → Sui contract).

---

### market.ts (305 LOC)
**Purpose:** Price queries, holder data, trade-link generation, platform stats.

**Public Exports:**
- `getTokenPrice(address, client?)` → bonding curve price in FET
- `getTokenHolders(address, holderAddress?, client?)` → holder list or single wallet lookup
- `calculateBuy(...)`, `calculateSell(...)` → fee/price impact estimates
- `getPlatformStats()` → network-wide aggregates

**External Deps (non-translatable):**
- `GET /tokens/address/{addr}`, `GET /tokens/holders`, `GET /tokens/stats` (AgentLaunch API)

**Copy Category:** Rewrite-on-substrate  
**Dimensional Tag:** Thing + Event (market data queries, price updates)

**Overlaps:** ONE's event loop will publish price/holder updates via `mark()` on pheromone; `calculateBuy/Sell` logic stays, but calls Sui contract instead of AgentLaunch API.

---

### handoff.ts (296 LOC)
**Purpose:** Synchronous handoff URL generation (no network calls).

**Public Exports:**
- `generateDeployLink(tokenId, baseUrl?)` → `/deploy/{id}` URL
- `generateTradeLink(address, opts?, baseUrl?)` → `/trade/{addr}?action=buy|sell&amount=X`
- `generateBuyLink(address, amount?, baseUrl?)`, `generateSellLink(address, amount?, baseUrl?)`
- `generateDelegationLink(tokenAddress, spenderAddress, amount, baseUrl?)`
- `generateFiatOnrampLink(params)` → MoonPay/Transak onramp URL
- `validateEthAddress(address)`
- `FIAT_PROVIDER_CONFIGS`

**External Deps (non-translatable):**
- MoonPay/Transak API key env vars

**Copy Category:** Lift-and-shift (rename) + replace EVM with Sui  
**Dimensional Tag:** Path (handoff routes)

**Overlaps:** Directly translatable to ONE's handoff pattern; replace EVM address validation with Sui address validation.

---

### agents.ts (137 LOC)
**Purpose:** Agentverse authentication & agent management.

**Public Exports:**
- `authenticate(apiKey, client?)` → exchange API key for JWT
- `getMyAgents(client?)` → list agents owned by API key
- `importFromAgentverse(agentverseApiKey, client?)` → list agents via API key

**External Deps (non-translatable):**
- `POST /agents/auth`, `GET /agents/my-agents`, `POST /agents/import-agentverse` (AgentLaunch API)

**Copy Category:** Drop (Agentverse-specific)  
**Dimensional Tag:** Actor (agent identity)

**Overlaps:** ONE will define agents as `unit` entities in TypeDB; these Agentverse bridge functions are not needed post-port.

---

### agentverse.ts (526 LOC)
**Purpose:** Agentverse deployment: create agent, upload code, set secrets, deploy, poll status, update metadata.

**Public Exports:**
- `createAgent(apiKey, name, metadata?)`, `uploadCode(apiKey, address, sourceCode, filename?)`, `setSecret(...)`
- `startAgent(apiKey, address)`, `stopAgent(...)`, `getAgentStatus(...)`
- `getAgentCode(...)`, `getAgentLogs(...)`
- `deployAgent(options)` → full deploy pipeline
- `deployAgentWithNewWallet(options)` → deploy + wallet provisioning
- `updateAgent(options)` → update metadata
- `buildOptimizationChecklist(opts)`

**External Deps (non-translatable):**
- Agentverse API (`/v1/hosting/*`): create, code upload, secrets, start/stop, status, logs
- Python template (uAgents framework)

**Copy Category:** Drop + rewrite bridge  
**Dimensional Tag:** Path (deployment flow)

**Overlaps:** ONE already has `/deploy` command wrapping nanoclaw + Agentverse bridge. Keep the Agentverse path for backward compat; add Sui path. The pipeline logic (validation, polling, error extraction) is reusable.

---

### storage.ts (261 LOC)
**Purpose:** Agentverse agent storage (key-value read/write).

**Public Exports:**
- `listStorage(agentAddress, apiKey?)` → all keys
- `getStorage(agentAddress, key, apiKey?)` → single value
- `putStorage(agentAddress, key, value, apiKey?)` → set value
- `deleteStorage(agentAddress, key, apiKey?)` → delete key
- `StorageEntry`, `StorageListResponse` types

**External Deps (non-translatable):**
- `GET /v1/hosting/agents/{addr}/storage`, `PUT`, `DELETE` (Agentverse API)

**Copy Category:** Rewrite-on-substrate (bridge to Sui MoveVM storage)  
**Dimensional Tag:** Thing (persistent state)

**Overlaps:** ONE's `persist()` primitive already handles state storage; Agentverse bridge calls can wrap it as a `mark(agent, 'store', key=X, value=Y)` signal.

---

### commerce.ts (392 LOC)
**Purpose:** Commerce data parsing from agent storage (revenue, pricing, GDP).

**Public Exports:**
- `AgentRevenue`, `PricingEntry`, `AgentCommerceStatus`, `NetworkGDP` types
- `getAgentRevenue(agentAddress, apiKey?)` → parse `revenue_summary` + `revenue_log`
- `getPricingTable(agentAddress, apiKey?)` → parse `pricing_table`
- `getAgentCommerceStatus(agentAddress, apiKey?)` → combined status (revenue + pricing + wallet + tier + token data)
- `getNetworkGDP(addresses, apiKey?)` → aggregate GDP

**External Deps (non-translatable):**
- Reads from Agentverse storage (via `getStorage`)

**Copy Category:** Rewrite-on-substrate  
**Dimensional Tag:** Thing + Event (commerce state)

**Overlaps:** ONE schema will define commerce entities in TypeDB (`agent.revenue`, `agent.pricing`); `getAgentCommerceStatus()` becomes a TypeDB query.

---

### comments.ts (98 LOC)
**Purpose:** Token page comments (read public, post authenticated).

**Public Exports:**
- `getComments(tokenAddress, client?)` → fetch all comments
- `postComment(params, client?)` → post a comment
- `Comment`, `PostCommentParams`, `PostCommentResponse` types

**External Deps (non-translatable):**
- `GET /comments/{addr}`, `POST /comments/{addr}` (AgentLaunch API)

**Copy Category:** Drop or rewrite  
**Dimensional Tag:** Event (comment records)

**Overlaps:** ONE will use TypeDB for comment storage; replace HTTP calls with `mark()` signals.

---

### onchain.ts (522 LOC)
**Purpose:** On-chain trading via ethers.js: buy/sell on bonding curve, balance queries, ERC-20 approvals.

**Public Exports:**
- `buyTokens(tokenAddress, fetAmount, config?)`, `sellTokens(tokenAddress, tokenAmount, config?)`
- `getWalletBalances(tokenAddress, config?)`, `getERC20Balance(...)`, `approveERC20(...)`, `getAllowance(...)`, `transferFromERC20(...)`
- Types: `OnchainConfig`, `BuyResult`, `SellResult`, `WalletBalances`, `ChainConfig`
- ABIs: `TOKEN_CONTRACT_ABI`, `ERC20_ABI`
- Constants: `DEFAULT_SLIPPAGE_PERCENT`, `CHAIN_CONFIGS` (97=BSC testnet, 56=BSC mainnet)

**External Deps (non-translatable):**
- ethers.js (optional peer dependency)
- BSC RPC endpoints
- Bonding curve contract ABI (reverse-engineered)

**Copy Category:** Replace-with-Sui  
**Dimensional Tag:** Thing + Path (trading operations)

**Overlaps:** `onchain.ts` + `tokens.ts` + `trading.ts` collapse into a single Sui Move module that exposes `buy()`, `sell()`, balance queries. Contract ABI is replaced with Sui package ID + function signatures.

---

### tokens.ts (already covered above)

### trading.ts (139 LOC)
**Purpose:** Custodial (server-side) trading via platform's HD wallet (no client private key).

**Public Exports:**
- `getWallet(chainId?, agentAddress?, client?)` → custodial wallet address + balances
- `executeBuy(params, client?)`, `executeSell(params, client?)`
- Types: `ExecuteBuyParams`, `ExecuteSellParams`, `CustodialBuyResult`, `CustodialSellResult`, `WalletInfoResponse`

**External Deps (non-translatable):**
- `GET /agents/wallet`, `POST /agents/buy`, `POST /agents/sell` (AgentLaunch API)
- Derivation: `BIP-44 m/44'/60'/0'/0/{hash(identity) % MAX}` on BSC

**Copy Category:** Replace-with-Sui  
**Dimensional Tag:** Actor + Path (wallet derivation + trading)

**Overlaps:** Merge into the Sui trading module. Wallet derivation logic is platform-independent; replace chain ID 97/56 with Sui testnet/mainnet.

---

### payments.ts (315 LOC)
**Purpose:** Multi-token payment operations: token registry, ERC-20 balance queries, transfers, invoices.

**Public Exports:**
- `KNOWN_TOKENS` → FET + USDC on BSC testnet (97) + mainnet (56)
- `getToken(symbol, chainId?)`, `getTokensForChain(chainId?)`
- `getTokenBalance(...)`, `getMultiTokenBalances(...)`, `transferToken(...)`
- `createInvoice(...)`, `getInvoice(...)`, `listInvoices(...)`, `updateInvoiceStatus(...)`
- Types: `PaymentToken`, `TokenAmount`, `Invoice`, `InvoiceStatus`

**External Deps (non-translatable):**
- ethers.js (optional)
- ERC-20 ABI
- Agentverse storage (invoices)

**Copy Category:** Rewrite-on-substrate  
**Dimensional Tag:** Thing (payment state)

**Overlaps:** Replace `KNOWN_TOKENS` with Sui coin objects; invoice storage moves from Agentverse to TypeDB.

---

### delegation.ts (186 LOC)
**Purpose:** ERC-20 spending limits (approve/transferFrom) + handoff links.

**Public Exports:**
- `checkAllowance(tokenAddress, owner, spender, chainId?)` → on-chain allowance
- `spendFromDelegation(...)` → call ERC-20 transferFrom
- `createSpendingLimitHandoff(params, agentAddress)` → handoff link
- `recordDelegation(...)`, `listDelegations(...)` → storage-backed metadata

**External Deps (non-translatable):**
- ERC-20 contracts (BSC chains)

**Copy Category:** Replace-with-Sui  
**Dimensional Tag:** Thing + Path (delegation state + handoff)

**Overlaps:** Replace ERC-20 allowance with Sui transfer policies; handoff link logic is translatable.

---

### connect.ts (623 LOC)
**Purpose:** Connect agent deployment: create relay agent, forward traffic to external HTTP endpoint.

**Public Exports:**
- `connectAgent(config, apiKey?)` → deploy new connect agent
- `updateConnection(address, config, apiKey?)` → update endpoint/auth
- `connectionStatus(address, apiKey?)` → check status (running/stopped/error)
- `connectionLogs(address, options?, apiKey?)` → fetch logs
- Types: `ConnectConfig`, `ConnectionStatus`, `ConnectResult`
- Python template for relay agent

**External Deps (non-translatable):**
- Agentverse deployment (`/v1/hosting/*`)
- Python uAgents framework
- External HTTP endpoint configuration

**Copy Category:** Drop or rewrite bridge  
**Dimensional Tag:** Path (relay/connect flow)

**Overlaps:** ONE has `/claw` for webhook bridges; can adapt connect template to nanoclaw. Keep Agentverse path for backward compat.

---

### wallet-auth.ts (459 LOC)
**Purpose:** Wallet authentication: derive Cosmos address, request/sign challenge, exchange for Agentverse API key.

**Public Exports:**
- `authenticateWithWallet(config)` → sign challenge → get API key
- `deriveCosmosAddress(privateKey)` → derive Cosmos address
- `generateWalletAndAuthenticate(expiresIn?)` → create wallet + auth in one call
- Types: `WalletAuthConfig`, `WalletAuthResult`, `GenerateWalletResult`

**External Deps (non-translatable):**
- @cosmjs/crypto (optional peer dependency)
- bech32 (optional peer dependency)
- ethers.js (optional peer dependency)
- accounts.fetch.ai API (Fetch.ai-specific)

**Copy Category:** Replace-with-Sui  
**Dimensional Tag:** Actor (wallet identity)

**Overlaps:** ONE's wallet auth uses Sui native signing (no Fetch.ai). Derive Sui keypair instead of Cosmos address; sign with Sui signature scheme.

---

### urls.ts (72 LOC)
**Purpose:** URL resolution for API and frontend (dev vs. production).

**Public Exports:**
- `getApiUrl()`, `getFrontendUrl()`, `getEnvironment()`
- `resolveApiKey(configKey?)`, `resolveBaseUrl(configUrl?)`
- Constants: `DEV_API_URL`, `DEV_FRONTEND_URL`, `PROD_API_URL`, `PROD_FRONTEND_URL`

**External Deps (non-translatable):**
- AgentLaunch URLs (dev/prod)

**Copy Category:** Lift-and-shift (rename)  
**Dimensional Tag:** Infrastructure (config)

**Overlaps:** ONE can reuse the pattern; update constants for ONE's API/frontend URLs.

---

### index.ts (224 LOC)
**Purpose:** Re-export barrel (all public APIs).

**Copy Category:** Lift-and-shift (rename)  
**Dimensional Tag:** Infrastructure (module structure)

---

## Summary

| Metric | Count |
|--------|-------|
| Total files | 18 |
| Total LOC | 6,441 |
| Avg LOC/file | 358 |

### Per-Category Breakdown

| Category | Count | Files |
|----------|-------|-------|
| **Lift-and-shift** | 4 | client, handoff (partial), urls, index |
| **Rewrite-on-substrate** | 7 | agentlaunch, types, tokens, market, storage, commerce, payments |
| **Replace-with-Sui** | 4 | onchain, trading, delegation, wallet-auth |
| **Drop** | 3 | agents, comments, connect (partial) |
| **Bridge/both** | 2 | agentverse, connect |

### Dimensional Mapping

| Dimension | Modules |
|-----------|---------|
| **Actor** | agents, trading, wallet-auth, agentlaunch |
| **Thing** | types, tokens, commerce, storage, payments, onchain, delegation, comments |
| **Path** | handoff, connect, agentverse, trading, delegation |
| **Event** | market, comments, commerce |
| **Infrastructure** | client, urls, index |

---

## Module Collapse Proposal

### **@one/sdk-sui** (single Sui module)
Merge `onchain.ts` + `tokens.ts` + `trading.ts` + `delegation.ts` → single Sui Move module:
- `buy(token_id, amount) → Coin<FET>`
- `sell(token, amount) → Coin<FET>`
- `get_balance(wallet, token) → u64`
- `delegate(owner, spender, amount)`

Replace:
- ERC-20 ABI → Sui Move function signatures
- Chain configs (97, 56) → Sui testnet/mainnet
- Bonding curve contract → Sui fungible token module

### **@one/sdk-commerce** (commerce + market data)
Merge `commerce.ts` + `market.ts` → TypeDB queries:
- `agent.revenue`, `agent.pricing`, `agent.commerce_status` entities
- Replace storage reads with TypeDB lookups
- Keep `calculateBuy()`/`calculateSell()` logic, call Sui contract instead

### **@one/sdk-core** (bootstrap)
Merge `client.ts` + `types.ts` + `urls.ts` → core HTTP layer:
- Replace AgentLaunch API calls with ONE's internal `ask()` primitive
- Keep retry/backoff logic
- Rename `AgentLaunchClient` → `OneClient`

### **@one/sdk-handoff** (standalone)
Keep `handoff.ts` mostly as-is:
- Rename EVM address validation → Sui address validation
- Update URL constants for ONE's frontend
- Reuse link generation logic

### **Drop or Bridge**
- `agents.ts` → drop (Agentverse-specific, ONE uses TypeDB)
- `comments.ts` → rewrite (move to TypeDB comments entity)
- `storage.ts` → bridge (wrap ONE's `persist()` primitive)
- `agentverse.ts` → keep as optional bridge (for agents still on Agentverse)
- `connect.ts` → rewrite as `/claw` handoff

---

## Direct ONE Engine Overlaps

| SDK Module | ONE Engine | Action |
|-----------|-----------|--------|
| `client.ts` | `bridge.ts`, `ask()` | Integrate fetch logic into ask() |
| `storage.ts` | `persist.ts` | Wrap persist() calls |
| `commerce.ts` | TypeDB schema | Query instead of HTTP |
| `market.ts` | TypeDB schema + Event | EventEmitter instead of polls |
| `tokens.ts`, `onchain.ts` | Sui Move contracts | Direct interaction |
| `types.ts` | `src/schema/one.tql` | Schema definition |

---

## Proposed `@one/sdk` Module List

```typescript
// Core
export { OneClient } from '@one/sdk/client';
export { ask, persist, world, unit, llm } from '@one/sdk/engine';

// Sui trading + tokens
export { 
  buy, sell, getBalance, delegate 
} from '@one/sdk/sui-trading';

// Commerce & market
export { 
  getAgentRevenue, getPricingTable, calculateBuy, calculateSell 
} from '@one/sdk/commerce';

// Handoff flows
export { 
  generateDeployLink, generateTradeLink, generateBuyLink 
} from '@one/sdk/handoff';

// Wallet auth (Sui-native)
export { 
  authenticateWithWallet, deriveAddress, generateWallet 
} from '@one/sdk/wallet-auth';

// Bridges (optional)
export { 
  deployAgentToAgentverse, connectionStatus 
} from '@one/sdk/bridges/agentverse';
```

---

## Routing Tags (for W2 TODO)

- `tokenize` — create pending token record
- `onchain` — direct Sui contract interaction
- `commerce` — revenue/pricing queries
- `handoff` — human-in-the-loop flows
- `wallet` — account derivation + auth
- `bridge` — Agentverse interop (optional)
- `storage` — persistent state
- `market` — price/holder data
- `payment` — invoice + spending limits
- `delegation` — approval patterns

