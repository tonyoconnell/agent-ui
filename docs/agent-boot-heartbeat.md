# Agent Boot, Heartbeat, and Spawn-Child

Lifecycle from first boot through ongoing liveness checks to peer spawning.

---

## Boot — `src/lib/agent-boot.ts`

When an agent starts it calls `bootAgent(uid)` then `verifyScopeMatch(config)` before processing any signals.

### What boot does

1. **Derive wallet address** — `addressFor(uid)` produces the deterministic Ed25519 Sui address from `SUI_SEED + uid`. Throws if `SUI_SEED` is absent.
2. **Query TypeDB** — looks for `scoped-wallet-id` on the unit:
   ```typeql
   match $u isa unit, has uid "…", has scoped-wallet-id $s; select $s;
   ```
   Returns `undefined` when the attribute is absent (unrestricted agent).
3. **Return** `AgentBootConfig { uid, walletAddress, scopedWalletId? }`.

### Scope verification

`verifyScopeMatch(config)` reads the on-chain `ScopedWallet` Move object and compares `fields.agent` to `config.walletAddress`.

| Condition | Result |
|-----------|--------|
| `scopedWalletId` absent | `true` — unrestricted |
| `fields.agent` matches (case-insensitive) | `true` — proceed |
| Mismatch or RPC error | `false` — agent refuses to run |

Fail-closed on any RPC error. The agent must not proceed if scope cannot be verified.

### Usage

```typescript
import { bootAgent, verifyScopeMatch } from '@/lib/agent-boot'

const config = await bootAgent(uid)
const ok = await verifyScopeMatch(config)
if (!ok) process.exit(1)
```

---

## Heartbeat — `src/workers/heartbeat.ts`

A CF Worker cron calls `sendHeartbeat(uid)` for each active agent.

### Constants

```typescript
HEARTBEAT_INTERVAL_DAYS = 14   // how often agents ping
DEADMAN_THRESHOLD_DAYS  = 30   // silence before cascade fires
```

### `sendHeartbeat(uid)` — three steps

1. **Emit `agent:alive` signal** to `POST /api/signal`:
   ```json
   { "receiver": "<uid>", "data": { "type": "agent:alive", "tags": ["agent:alive", "heartbeat"] } }
   ```
   Non-fatal if the substrate is unreachable.

2. **Write `liveness-last-verified-at`** to TypeDB (upsert pattern):
   ```typeql
   match $u isa unit, has uid "…";
   delete $u has liveness-last-verified-at $lv;
   insert $u has liveness-last-verified-at <iso-datetime>;
   ```
   This is the authoritative liveness record. The `AgentAlive` event (step 1) is a substrate signal; the TypeDB write is the permanent record.

3. **Run `checkDeadManCascade(uid)`** — checks all children.

### Dead-man cascade

`checkDeadManCascade(parentUid)` queries TypeDB for children (units whose parent is chairman of a `group-type: "owns"` group):

```typeql
match
  $g isa group, has group-type "owns";
  (group: $g, member: $parent) isa membership, has member-role "chairman";
  $parent isa unit, has uid "<parentUid>";
  (group: $g, member: $child) isa membership;
  $child isa unit, has uid $childUid;
  $childUid != "<parentUid>";
select $childUid;
```

For each child it checks `liveness-last-verified-at`. If older than 30 days (or absent and `created` is older than 30 days, or no `created` date at all), an `agent:paused` signal is emitted to that child:

```json
{ "type": "agent:paused", "tags": ["agent:paused", "deadman"], "reason": "deadman" }
```

The cascade is **3-depth** by convention (parent → child → grandchild) — each agent that receives a heartbeat runs the cascade check for its own children.

---

## Spawn-Child — `src/lib/peer/spawn-child.ts`

A parent agent calls `spawnChild(args)` to create a new child with a capped `ScopedWallet` on Sui — no human involvement.

### Flow

```
1. deriveKeypair(parentUid)         → parent Ed25519 keypair
2. TypeDB lookup scoped-wallet-id   → parent's ScopedWallet object ID
3. Build scoped_wallet::spawn_child PTB
4. signAndExecute(tx, parentKeypair) → txDigest + effects
5. Extract child ScopedWallet ID from effects (ChildSpawned event fallback)
6. Return { scopedWalletId, txDigest }
```

The child `ScopedWallet` calls `scoped_wallet::spawn_child<SUI>` with the parent's object, child address, daily cap in MIST (must be ≤ parent cap), and an allowlist. Owned by the parent wallet's object address.

Store `scoped-wallet-id` in TypeDB immediately after the transaction. If extraction from effects fails, query the `ChildSpawned` event by `txDigest` from Sui RPC. Boot the child with `bootAgent` + `verifyScopeMatch` before it processes signals.

**Schema note:** `liveness-last-verified-at` must be added to `unit` in `src/schema/world.tql` as `attribute liveness-last-verified-at, value datetime` if not already present.

---

## References

| File | Purpose |
|------|---------|
| `src/lib/agent-boot.ts` | `bootAgent()`, `verifyScopeMatch()` |
| `src/workers/heartbeat.ts` | `sendHeartbeat()`, `checkDeadManCascade()` |
| `src/lib/peer/spawn-child.ts` | `spawnChild()` |
| `ops/peer-agent-runbook.md` | Operational procedures: spawn, rotate, revoke, pause, troubleshooting |
