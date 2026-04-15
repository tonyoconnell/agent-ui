# Wallet-Auth Recon Report: agent-launch-toolkit → ONE (Sui)

**Scanned:** toolkit wallet-auth surfaces across SDK, MCP, CLI, scripts, docs
**Baseline:** ONE already has `src/lib/sui.ts` + `src/engine/bridge.ts` (Sui Ed25519 + Move bridge live on testnet)

## File-by-File Inventory

| File | Lines | Purpose | EVM-specific | Cosmos-specific | Translatable Concepts | Category |
|------|-------|---------|--------------|-----------------|----------------------|----------|
| **SDK: wallet-auth.ts** | 460 | Cosmos secp256k1 → ADR-036 signing → Fetch.ai challenge-response | ethers (wallet gen only) | **High:** secp256k1, bech32, ADR-036, RIPEMD160(SHA256) | Challenge-response auth, canonical JSON signing, API key exchange | rewrite-on-substrate |
| **SDK: onchain.ts** | 523 | BSC EVM bonding curve buy/sell via ethers | **High:** ethers, Contract ABI, JSON-RPC, gas, approval flow | 0 | Slippage tolerance, balance validation, allowance checking | replace-with-Sui |
| **SDK: tokens.ts** | 138 | API envelope wrappers for /agents/tokenize, /agents/tokens | 0 (HTTP only) | 0 | API client pattern, tokenize ceremony flow | rewrite-on-substrate |
| **SDK: trading.ts** | 140 | Server-side custodial HD derivation, buy/sell delegation | **High:** BIP-44, ethers tx exec | 0 | Custodial key derivation, server-signed txs, delegation | replace-with-Sui |
| **SDK: payments.ts** | 316 | Multi-token ERC-20 (FET, USDC), invoices via Agentverse storage | **High:** ethers, ERC-20, approval, transferFrom | 0 | Token registry, spending limits, invoice CRUD, fiat onramps | rewrite-on-substrate |
| **MCP: auth.ts** | 301 | wallet_auth, check_auth, generate_wallet tools | EVM in generate | **High:** authenticateWithWallet, deriveCosmosAddress | Tool interface pattern, status check | rewrite-on-substrate |
| **MCP: custodial.ts** | 218 | get_agent_wallet, buy_token, sell_token tools | **High:** BSC testnet links, BNB balance | 0 | Wallet type semantics, result markdown | replace-with-Sui |
| **MCP: payments.ts** | 386 | Multi-token payment, delegation, fiat onramp tools | **High:** ethers, ERC-20, spending limits | 0 | Invoice creation, allowance checking | rewrite-on-substrate |
| **MCP: tokenize.ts** | 305 | Create agent + tokenize combo | 0 (HTTP only) | 0 | Agent code gen, per-agent key provisioning, handoff | rewrite-on-substrate |
| **MCP: trading.ts** | 170 | On-chain buy/sell with dry-run, balance queries | **High:** ethers, BSC RPC, gas | 0 | Dry-run preview, markdown result | replace-with-Sui |
| **CLI: wallet.ts** | 60+ | Wallet balance/send/delegate | **High:** ethers Wallet | 0 | Balance query, chain ID abstraction | rewrite-on-substrate |
| **CLI: auth.ts** | 60+ | Wallet auth, API key validation | **High:** ethers createRandom | **High:** authenticateWithWallet wrapper | Challenge-response CLI UX | rewrite-on-substrate |
| **CLI: buy.ts** | 60+ | Buy token, slippage, approval | **High:** buyTokens, ethers | 0 | CLI arg parsing, tx display | replace-with-Sui |
| **CLI: sell.ts** | 60+ | Sell token, balance check | **High:** sellTokens, ethers | 0 | CLI arg parsing, tx display | replace-with-Sui |
| **CLI: tokenize.ts** | 60+ | Tokenize (create + deploy) | 0 (HTTP only) | 0 | Agent scaffolding, deploy flow | rewrite-on-substrate |
| **CLI: claim/holders/pay.ts** | 60+ ea | Claim rewards, list holders, send payment | **High:** ethers throughout | 0 | Payment UX, reward distribution | rewrite-on-substrate |
| **Scripts: test-wallet-auth*.mjs** | ~100 ea | Secp256k1 signing, ADR-036, challenge flow | EVM in -babble | **High:** ADR-036, canonical JSON, Secp256k1 | Signing ceremony, canonical JSON | lift-shift |
| **Docs: wallet-auth.md** | 256 | ADR-036 spec, flow, dependencies | 0 | **High:** bech32, secp256k1, ADR-036 | Challenge-response pattern | documentation |

## Category Distribution

- **EVM/Cosmos drop-or-rewrite:** 13 files (~2,100 LOC)
- **Lift-shift:** 2 files (test-wallet-auth*.mjs signing logic adapts to Ed25519)
- **Already exists in ONE:** 0 files directly, but `src/lib/sui.ts` + `src/engine/bridge.ts` cover ~80% of needed primitives

## What ONE Already Has (`src/lib/sui.ts`)

1. `deriveKeypair(uid)` — SHA-256(seed || uid) → Ed25519 (Cosmos secp256k1 equivalent)
2. `addressFor(uid)` — Sui address derivation (bech32 equivalent)
3. `signAndExecute(tx, keypair)` — Sign + submit transaction
4. `createUnit()` — Agent signs itself into existence (replaces wallet generation)
5. `send/consume()` — Signal with optional payment (replaces ERC-20 transfer)
6. `pay()` — Direct agent-to-agent payment (replaces approval + transferFrom)
7. `mark/warn()` — Trail updates (no ERC-20 equivalent; new to Sui)
8. `ensureFunded()` — Testnet faucet (gas tank check)

## What ONE Already Has (`src/engine/bridge.ts`)

1. `mirrorMark/mirrorWarn()` — Fire-and-forget Sui updates
2. `mirrorActor()` — Create unit on-chain, cache IDs in TypeDB
3. `absorb()` — Poll Sui events, feed into TypeDB

## What's Missing (Sui-native gaps)

- **Custodial key derivation** — BIP-44 analog for Sui (Phase 2)
- **Bonding curve trading** — buy/sell with slippage (lives in `src/move/one/`)
- **HD wallet for agents** — ONE uses deterministic derivation (same seed → same address); multi-key HD is Phase 2
- **Invoice CRUD** — belongs in TypeDB, not Agentverse storage
- **Token registry** — Move contract + TypeDB schema

## Toolkit Flows That Translate to Sui

### 1. Challenge-Response Auth → Sui Keypair Signing
```
Toolkit:  Cosmos secp256k1 → ADR-036 sign → API key
ONE:      Sui Ed25519 → sign create_unit tx → ownership proof
```

### 2. Custodial Trading → Server-Side Unit Signing
```
Toolkit:  Server derives HD wallet (BIP-44) from seed, signs buy/sell tx
ONE:      Server derives unit keypair from SUI_SEED + uid, signs signal/pay tx
```

### 3. Bonding Curve Tokenomics → Sui Move Atomic Swap
```
Toolkit:  ERC-20 balance check → approve → buyTokens(buyer, minOut, fetAmount)
ONE:      Sui object movement (coin split + mint) in single tx, atomic by linear types
Linear types prevent double-spend intrinsically; no approval pattern needed
```

### 4. Spending Delegation → Sui Capability Objects (Phase 2)
```
Toolkit:  allowance(owner, spender) + approve(spender, amount)
ONE:      Delegation object with Capability pattern
```

### 5. Invoice + Payment → Signal with Payment Amount
```
Toolkit:  Agentverse storage + ERC-20 transfer
ONE:      TypeDB (issuer, payer, amount, status) + pay() with mark to path
```

## Proposed Sui-Native Tokenize + Trading Surface

```typescript
// Tokenization ceremony
export async function tokenizeAgent(
  uid: string,
  name: string,
  symbol: string,
  initialSupply: bigint,
  bonding_curve_params?: { backing_reserve: bigint, fee_percent: number }
): Promise<{ token_id: string; tx_digest: string }>

// Trading on bonding curve
export async function buyTokens(
  buyerUid: string,
  tokenId: string,
  fetAmount: bigint,
  minTokensOut: bigint
): Promise<{ tokens_received: bigint; tx_digest: string }>

export async function sellTokens(
  sellerUid: string,
  tokenId: string,
  tokenAmount: bigint,
  minFetOut: bigint
): Promise<{ fet_received: bigint; tx_digest: string }>

// Holdings → weight on paths
export async function queryHoldings(
  tokenId: string
): Promise<Record<string, { balance: bigint; weight: number }>>
```

### Move contract layer (`src/move/one/`)
- `create_token(supply, params) → Token object`
- `buy_tokens(token_in: Coin<FET>, min_out) → Coin<Token>`
- `sell_tokens(token_in: Coin<Token>, min_out) → Coin<FET>`
- No approvals. Linear type system (Coin moved, not copied) guarantees atomicity.

### TypeDB schema extension
```tql
token sub entity, owns symbol, owns supply, owns bonding-curve;
path owns revenue;      # accumulated from sell trades
unit owns holdings;     # { token_id → balance }
```

### Bridge flow
- `tokenizeAgent()` → `createUnit()` + Move `create_token()` → store in TypeDB
- `buyTokens()` → Move atomic swap → `mark(buyer → token)` + `pay(treasury)` auto-fire
- Holdings → regenerated from on-chain Coin ownership (no off-chain state)

## Migration Plan (effort measured in tasks, not calendar time)

| Toolkit File | Strategy | ONE Location | Tasks |
|--------------|----------|--------------|-------|
| wallet-auth.ts | Rewrite for Sui signing | extend `src/lib/sui.ts` | 3 |
| onchain.ts | Drop (replace with Move) | — | 0 |
| tokens.ts | Rewrite (API → internal) | `src/engine/persist.ts` | 4 |
| trading.ts | Rewrite (custodial → unit signing) | extend `src/engine/bridge.ts` | 5 |
| payments.ts | Rewrite (ERC-20 → Signal+TypeDB) | `src/lib/sui.ts` + schema | 5 |
| MCP auth.ts | Rewrite (Cosmos → Sui) | `packages/mcp/src/tools/auth.ts` | 3 |
| MCP custodial.ts | Replace (BSC → Sui) | `packages/mcp/src/tools/trading.ts` | 3 |
| MCP payments.ts | Rewrite (delegation → Signal) | `packages/mcp/src/tools/payments.ts` | 4 |
| MCP tokenize.ts | Rewrite (keep scaffold, swap backend) | `packages/mcp/src/tools/tokenize.ts` | 3 |
| MCP trading.ts | Replace (ethers → Sui) | `packages/mcp/src/tools/trading.ts` | 3 |
| CLI commands | Rewrite per-feature | `packages/cli/src/commands/` | 8 |
| test-wallet-auth*.mjs | Lift-shift (Sui Ed25519) | `scripts/test-sui-signing.mjs` | 2 |
| wallet-auth.md | Rewrite (ADR-036 → Sui) | `docs/wallet-auth-sui.md` | 2 |

**Total:** ~45 atomic tasks, distributable across one W3 wave.

## Key Insights

1. **Signing ceremony is universal:** Toolkit uses Cosmos ADR-036; ONE uses Sui Ed25519. Both prove identity via challenge-response.

2. **Custodial derivation pattern** exists in both:
   - Toolkit: BIP-44 (EVM HD standard)
   - ONE: HKDF-SHA256 (simpler, Sui-native)

3. **Bonding curve is orthogonal to auth:** Curve math (supply, backing reserve, fee %) is portable. Only the settlement layer differs.

4. **Spending limits are EVM idiom:** `approve()` doesn't exist in Sui. Use Capability pattern for Phase 2. Server-side policy enforces limits until then.

5. **No ADR-036 in ONE:** Agent signs txs because it IS the tx issuer. Simpler than third-party delegation.

## Summary

ONE already has ~80% of the Sui wallet infrastructure. Toolkit brings:
- CLI/MCP/SDK polish (the UX wrapping)
- Tokenization ceremony flow
- Bonding curve math (reusable)
- Invoice + payment UX patterns

Gaps to close: bonding curve Move module, BIP-44-alike custodial routing (Phase 2), Sui-native Capability delegation.
