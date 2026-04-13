# Sui Move Skill

Build secure, production-ready Move contracts for the ONE substrate and agent ecosystem.

**Status:** Testnet complete (Steps 1-5 done). Phase 2 (identity) in flight.

## What This Skill Does

- **Generate Move modules** — scaffolding, best practices, gas optimization
- **Agent wallet integration** — keypair derivation, signing, address generation (Sui + ONE)
- **Envelope contracts** — payment channels, multi-sig, conditional execution
- **TypeDB ↔ Sui sync** — contract state ↔ substrate knowledge (paths, units, skills) via `bridge.ts`
- **Testing & deployment** — Move test suites, devnet/testnet/mainnet
- **ONE patterns** — pheromone trails as contract state, agent reputation on-chain

## Phases (from TODO-SUI)

| Phase | What | Status |
|-------|------|--------|
| 1 | Get on testnet, publish contract, fund protocol | ✅ DONE |
| 2 | Wallet adapter, agent identity, discovery | ⏳ In flight |
| 3 | Escrow, x402 payment flow, multi-currency | 📋 Next |
| 4 | On-chain fade, crystallize highways, frozen objects | 📋 Next |
| 5 | Colony economics, treasury, federation | 📋 Next |
| 6 | Mainnet, audit, SDK, multi-chain | 📋 Next |

## When to Use

- Writing Move smart contracts for ONE agents or payment flows (Phase 2-6)
- Generating agent wallets and keypairs from substrate identity (Phase 2)
- Syncing on-chain state back to TypeDB (via `src/engine/bridge.ts` absorb loop)
- Building envelope payment channels or multi-agent coordination contracts (Phase 3)
- Deploying to Sui (devnet, testnet, mainnet)
- Auditing Move code for security, gas, or ONE patterns

## Core Components (What's Built)

| File | Lines | What |
|------|-------|------|
| `src/move/one/sources/one.move` | 680 | Move contract: Unit, Signal, Path, payment, fade |
| `src/lib/sui.ts` | ~200 | Sui client: all contract functions + faucet |
| `src/engine/bridge.ts` | ~150 | Mirror/absorb: Runtime ↔ Sui ↔ TypeDB sync |
| `src/schema/world.tql` | — | `sui-unit-id`, `sui-path-id` attributes |
| `src/engine/persist.ts` | — | auto-mirror on mark/warn/actor |

**Testnet Package:** `0xa5e6bddae833220f58546ea4d2932a2673208af14a52bb25c4a603492078a09e`  
**Protocol Object:** `SUI_PROTOCOL_ID` (treasury, fee_bps)

## Capabilities

### 1. Mirror to Sui (mark/warn auto-propagate)

```typescript
// From src/engine/bridge.ts
mirrorMark(from, to, strength)     // Runtime → Sui: fire-and-forget
mirrorWarn(from, to, strength)     // Runtime → Sui: fire-and-forget
```

- Called automatically by `persist.ts` on every `mark()` or `warn()`
- Creates Signal object on-chain, fires Marked event
- Zero latency (async, doesn't block signal loop)
- Graceful fallback (Sui down? Signal completes anyway)

### 2. Absorb from Sui (events → TypeDB)

```typescript
// /api/absorb { cursor? }
absorb(cursor?)                    // Sui → TypeDB: poll events, write state
```

- Polls on-chain events (Marked, UnitCreated, SignalSent)
- Writes back to TypeDB (strength updates, new units)
- Cursor-based pagination (resume from last event)
- Runs every 1 min via `/grow` tick

**Events queryable:**
```typescript
queryEvents()  // Returns all events since genesis
getPath(from, to)  // Resolve TypeDB unit ↔ Sui path
```

### 3. Agent Wallet Derivation (Phase 2)

```typescript
// From src/engine/bridge.ts (to be extended)
addressFor(uid)                    // UID → Sui address (deterministic)
deriveKeypair(uid, seed)           // UID + seed → keypair for signing
```

- Deterministic: same `uid + $SUI_SEED` = same address every time
- No private key storage (derives on-the-fly from env)
- Used by `/api/agents/sync` to create wallet
- Multi-chain ready (same pattern for Ethereum, etc.)

### 4. Payment Flow (Phase 3: escrow)

```move
// Move contract functions (one.move)
create_escrow(unit, receiver, amount)  // Lock tokens, await settlement
release_escrow(escrow, result?)        // Success: pay + mark + fee (atomic)
cancel_escrow(escrow)                  // Timeout: return tokens, warn path
```

- Atomic: fee + mark + transfer in single transaction
- Revenue: protocol collects `fee_bps` (50 = 0.5%)
- Idempotent: releasing same escrow twice fails safely
- Enables x402 workflow (402 → create escrow → execute → release)

### 5. Path Strength on-Chain (permanent learning)

```move
// Every path is a Sui object with:
Path {
  from: address,
  to: address,
  strength: u64,      // Marked increments
  resistance: u64,    // Warned increments
  hits: u64,          // Total signals
  type: String,       // "interaction", "payment", etc.
}
```

- Strength = gas rewards (proportional to agent value)
- Resistance = slashing (accumulates from failures)
- Toxic when: `resistance >= 10 && resistance > 2x strength && (r+s) > 5`
- Read by `/api/highways` → mirrors to TypeDB → guides future signals

## Phase 2: What's Next (Identity & Wallet)

```typescript
// Add to src/lib/sui.ts:
export async function deriveAgentKeypair(uid: string) {
  const seed = process.env.SUI_SEED!
  const keypair = deriveSuiKeypair(uid, seed)  // deterministic
  return keypair.getPublicKey().toSuiAddress()
}

// Integrate into /api/agents/sync:
const wallet = await deriveAgentKeypair(spec.uid)
// Returns stable wallet for this agent forever
```

Then:
- [ ] Sui Wallet Adapter (`@mysten/dapp-kit`) for browser connect
- [ ] Read weights from on-chain Path objects
- [ ] Mark paths to Sui without TypeDB intermediate

## Real Examples (from Testnet)

### Agent Created on-Chain

```typescript
// Scout was created with this call:
const unitId = await createUnit("scout", "agent")
// Sui object ID: 0x6fd45656222db69f81dbf61c70873fd466ebd8b157bf6694f81314e3e0c13af8
// TypeDB marked: sui-unit-id = "0x6fd4..."
```

### Signal Sent & Path Created

```typescript
// Signal from scout → analyst
const signalId = await sendSignal(scoutId, analystId, "hello from scout")
// Sui Signal object created
// Sui Path created: scout → analyst, strength = 1
// TypeDB absorb loop: reads event, increments path strength
```

### Payment Flow (Phase 3 pattern)

```typescript
// 1. Create escrow (lock SUI)
const escrow = await createEscrow(scoutId, analystId, 1000n)  // 1000 MIST

// 2. Execute task (analyst does work)
const result = await executeTask(...)

// 3. Release escrow (atomic: pay + mark + fee)
await releaseEscrow(escrow, result)
// Analyst receives 1000 MIST
// Scout path marked with strength++
// Protocol treasury collects 5 MIST (fee_bps = 50)
```

## Documentation

- **Live Contract:** `src/move/one/sources/one.move` (680 lines, all patterns)
- **Client API:** `src/lib/sui.ts` (use this, not raw SDK)
- **Bridge:** `src/engine/bridge.ts` (mirror/absorb/resolve)
- **Integration:** `src/engine/persist.ts` (auto-mirror on mark/warn)
- **Schema:** `src/schema/world.tql` (sui-unit-id, sui-path-id attributes)
- **Testnet Explorer:** https://suiscan.xyz/testnet/object/{OBJECT_ID}
- **Full Guide:** `docs/TODO-SUI.md` (phases 1-6, all tasks)

## Safety (Deterministic Sandwich)

```
PRE:   isToxic(edge)?  → skip contract call (no Sui interaction)
PRE:   capability exists? → TypeDB lookup → skip if missing
LLM:   (if applicable) generates response
POST:  success? → mark(). timeout? → neutral. dissolved? → warn(0.5).
```

- **No private keys in code** — use `$SUI_SEED` environment variable (derives on-the-fly)
- **Pre-flight checks** — isToxic(), capability exists? before contract call (prevents wasted gas)
- **Gas limits** — escrow functions must settle within gas budget
- **Auditability** — all math is deterministic; randomness only from LLM prompts

## Env & Setup

```bash
# .env (required for Phase 2+)
SUI_NETWORK=testnet
SUI_SEED=<32 bytes base64>  # Generates all agent keypairs

SUI_PACKAGE_ID=0xa5e6...  # Published contract package
SUI_PROTOCOL_ID=0x...     # Protocol object (treasury, fee_bps)

# Verify setup
sui client object $SUI_PROTOCOL_ID
# Output: Protocol { treasury: 0, fee_bps: 50 }
```

## Usage in /sui Skill

```bash
# Derive agent wallet (Phase 2)
/sui wallet --agent marketing:creative --seed $SUI_SEED
# Returns: 0xb0e2...6dba (stable forever)

# Create escrow (Phase 3)
/sui escrow --from scout --to analyst --amount 0.001 --settle on-success
# Returns: escrow object ID

# Check path strength on-chain (Phase 4)
/sui path-strength --from scout --to analyst
# Returns: { strength: 5, resistance: 0, hits: 10, type: "interaction" }

# Read highways and sync to TypeDB
/sui highways --limit 10 --absorb
# Runs bridge absorb loop, updates TypeDB from events
```

---

**ONE + Sui = agent wallets, envelope routing, pheromone as on-chain rewards, and deterministic contract security.**
