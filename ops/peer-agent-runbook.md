# Peer Agent Operational Runbook

Operational procedures for peer agent lifecycle: spawn, rotate, revoke, pause cascade, and heartbeat verification.

All procedures are **on-chain first** — the Move entry functions are the source of truth. TypeDB records follow the on-chain state. Never force TypeDB writes without corresponding on-chain actions.

---

## Overview

**Four main operations:**

| Operation | Move function | TypeDB update | Typical performer | Time to execute |
|-----------|---------------|---------------|------------------|-----------------|
| **Spawn** | `scoped_wallet::create<T>` + `spawn_child<T>` | Insert unit + scoped-wallet-id | Parent agent or human | ~5s (one tx) |
| **Rotate ownership** | `scoped_wallet::rotate_owner<T>` | Update unit owner + membership | Current owner | ~3s (one tx) |
| **Revoke** | `scoped_wallet::revoke<T>` | Mark unit paused, audit trail | Owner or operator | ~3s (one tx) + recovery |
| **Pause cascade** | Automatic via heartbeat check | Mark children paused when parent silent | CF Worker cron | ~100ms per child |
| **Heartbeat verify** | None (monitoring only) | Check/update liveness-last-verified-at | CF Worker every 14d | ~50ms |

---

## 1. Spawn an Agent

**Use case:** Parent agent or human creates a child agent with a capped ScopedWallet.

### Prerequisites

- **Parent must have existing ScopedWallet:** The parent agent or human must already have a ScopedWallet Move object. If parent is an agent, it was created in a prior spawn or as the root. If parent is human, it was created via `ScopedWallet::create<SUI>()`.
- **SUI_SEED configured:** Environment variable `SUI_SEED` (base64 Ed25519 seed, 32 bytes) must be set for keypair derivation.
- **SUI_PACKAGE_ID configured:** Environment variable `SUI_PACKAGE_ID` (the one package ID) must be set.
- **Parent's scoped-wallet-id in TypeDB:** The parent unit's `scoped-wallet-id` attribute must be set; used to resolve the wallet on-chain. If missing, `spawnChild()` will fail with "No ScopedWallet found for parent agent."

### Steps

#### Step 1: Prepare spawn parameters

```typescript
const parentUid = "marketing:creative"      // Parent agent UID
const childUid = "marketing:creative:intern" // Child agent UID (must be unique)
const childAddress = addressFor(childUid)   // Derived child Sui address
const dailyCapMist = 100_000_000n           // 0.1 SUI in MIST
const allowlist = [
  "0x2::sui::SUI",                          // Allow payments to SUI coin
  "0x2::package_id::ModuleType",            // Allow calls to specific package
]

const args: SpawnChildArgs = {
  parentUid,
  childUid,
  childAddress,
  dailyCapMist,
  allowlist,
}
```

#### Step 2: Call spawnChild()

```typescript
import { spawnChild } from '@/lib/peer/spawn-child'

const result = await spawnChild(args)
// Returns: { scopedWalletId: string, txDigest: string }
```

**What happens on-chain:**
1. Parent agent's keypair is derived from `SUI_SEED + parentUid`.
2. Parent's ScopedWallet is resolved from TypeDB.
3. Move `spawn_child<SUI>` is called:
   - Parent's signature validates (parent agent is the sender).
   - Child's daily cap is checked: `dailyCapMist <= parent.daily_cap`.
   - A new ScopedWallet is created with:
     - `owner = parent_wallet_address` (the parent wallet owns the child wallet)
     - `agent = childAddress` (the child agent can spend within the cap)
     - `daily_cap = dailyCapMist`
     - `allowlist = allowlist`
   - Event `ChildSpawned` is emitted with wallet IDs.

#### Step 3: Record in TypeDB

Once the transaction is confirmed:

```typeql
# Insert the child unit
insert $u isa unit,
  has uid "marketing:creative:intern",
  has name "Creative Intern",
  has unit-kind "agent",
  has wallet $childAddress,
  has scoped-wallet-id $scopedWalletId,  # Store the Move object ID
  has created "2026-04-23T10:00:00";

# Update parent's membership (optional, for hierarchy tracking)
# The parent is chairman of a g:owns:{childUid} group
insert $g isa group,
  has gid "g:owns:marketing:creative:intern",
  has group-type "owns",
  has name "Ownership: Creative Intern";
insert (group: $g, member: $p) isa membership,
  has member-role "chairman",
  has joined-at "2026-04-23T10:00:00";
insert (group: $g, member: $u) isa membership,
  has member-role "agent",
  has joined-at "2026-04-23T10:00:00";
```

**If extraction fails:** The Move contract emits `ChildSpawned` event. Query the event log by `txDigest` to find `child_wallet_id`. Then insert the `scoped-wallet-id` manually.

```bash
# Sui RPC call to fetch events
curl -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_queryEvents",
    "params": [{
      "query": { "Transaction": "'$txDigest'" },
      "limit": 100
    }]
  }'
# Extract `child_wallet_id` from `ChildSpawned` event
```

#### Step 4: Boot the child agent

The child agent must boot successfully before it can operate. See **Agent Boot Verification** below.

```typescript
import { bootAgent, verifyScopeMatch } from '@/lib/agent-boot'

const config = await bootAgent(childUid)
// config.walletAddress = derived child address
// config.scopedWalletId = stored in TypeDB

const isValid = await verifyScopeMatch(config)
if (!isValid) {
  console.error("Child wallet scope mismatch — agent will refuse to run")
}
```

---

## 2. Rotate Ownership

**Use case:** Transfer control of a ScopedWallet from one owner to another (e.g., human promotion, team restructuring, key rotation).

### Prerequisites

- **Current owner must sign:** Only the current owner's key (or multisig) can call `rotate_owner`.
- **Scoped-wallet-id in TypeDB:** Same as spawn.
- **New owner address known:** The new owner's Sui address (human multisig, agent address, or group multisig).

### Steps

#### Step 1: Prepare rotation parameters

```typescript
const walletId = "0x1234..."                 // ScopedWallet Move object ID
const currentOwnerUid = "marketing:creative" // Current owner (must sign)
const newOwnerAddress = "0x5678..."          // New owner's Sui address
```

#### Step 2: Call the Move entry function

```typescript
import { deriveKeypair, signAndExecute } from '@/lib/sui'
import { Transaction } from '@mysten/sui/transactions'

const keypair = await deriveKeypair(currentOwnerUid)
const tx = new Transaction()

tx.moveCall({
  target: `${SUI_PACKAGE_ID}::scoped_wallet::rotate_owner`,
  typeArguments: ['0x2::sui::SUI'],
  arguments: [
    tx.object(walletId),
    tx.pure.address(newOwnerAddress),
  ],
})

const result = await signAndExecute(tx, keypair)
// Emits: OwnerRotated { wallet_id, old_owner, new_owner, epoch }
```

**What changes on-chain:**
- `ScopedWallet.owner` is updated to `newOwnerAddress`.
- `ScopedWallet.agent` is *not* changed — the spending authority stays the same.
- All funds remain in the wallet.
- The new owner immediately gains `pause()` and `revoke()` authority.

#### Step 3: Update TypeDB membership

```typeql
# Update the ownership group membership
match $g isa group, has gid "g:owns:marketing:creative";
delete (group: $g, member: $oldUnit) isa membership;
insert (group: $g, member: $newUnit) isa membership,
  has member-role "chairman",
  has joined-at "2026-04-23T11:30:00";
```

### Safety checks

- **Verify on-chain:** Query the wallet object and confirm `owner` field matches the new owner address.
  ```bash
  curl -X POST https://fullnode.mainnet.sui.io:443 \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "id": 1,
      "method": "suix_getObject",
      "params": ["'$walletId'", { "showContent": true }]
    }'
  # Inspect response.result.data.content.fields.owner
  ```
- **Verify TypeDB:** Query the unit's membership group and confirm chairman matches.

---

## 3. Revoke an Agent

**Use case:** Permanently disable a ScopedWallet (e.g., security incident, fired agent, or cleanup).

### Prerequisites

- **Owner must sign:** Only the current owner can call `revoke`.
- **Drain funds first (off-chain):** The wallet may have held coin objects. Move's ownership model keeps funds independent from the ScopedWallet object, but they must be moved manually.

### Steps

#### Step 1: Drain any remaining coin objects

The ScopedWallet itself holds no Balance — only the object at its address holds Coins. If there are any Coin objects owned by the wallet address, move them to a safe account:

```bash
# Query Sui for coins held at the wallet address
curl -X POST https://fullnode.mainnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "suix_getOwnedObjects",
    "params": [
      "'$walletAddress'",
      { "filter": { "MatchCoinType": "0x2::sui::SUI" } }
    ]
  }'
# Returns: list of Coin objects

# Manually transfer each coin to the owner's address or a recovery wallet
# (Use Sui SDK or CLI for the transfer)
```

#### Step 2: Call revoke()

```typescript
const keypair = await deriveKeypair(ownerUid)
const tx = new Transaction()

tx.moveCall({
  target: `${SUI_PACKAGE_ID}::scoped_wallet::revoke`,
  typeArguments: ['0x2::sui::SUI'],
  arguments: [
    tx.object(walletId),
  ],
})

const result = await signAndExecute(tx, keypair)
// Emits: WalletRevoked { wallet_id, by, funds_returned_to, epoch }
```

**What happens on-chain:**
- The ScopedWallet object is **destroyed permanently**. The object ID will never exist again.
- Any remaining Coin objects at the wallet address are **orphaned** and must be recovered manually.
- The event `WalletRevoked` logs the action for audit.

#### Step 3: Mark as revoked in TypeDB

Record the revocation as an audit trail:

```typeql
match $u isa unit, has uid "marketing:creative:intern";
delete $u has scoped-wallet-id $sid;
insert $u has dissolved-at "2026-04-23T12:00:00";

# Optional: log to an audit entity (if you have one)
insert $s isa signal,
  has data "{
    \"action\": \"agent_revoked\",
    \"agent_uid\": \"marketing:creative:intern\",
    \"wallet_id\": \"$walletId\",
    \"revoked_at\": \"2026-04-23T12:00:00\",
    \"reason\": \"terminated\"
  }";
```

### Recovery

Once revoked, the agent **cannot be restored**. If you need to re-use the agent UID:
1. Create a new ScopedWallet (spawn it again or create it directly).
2. Store the new `scoped-wallet-id` in TypeDB.
3. Boot the agent and verify scope match.

---

## 4. Pause and Unpause

**Use case:** Temporarily suspend an agent's spending authority (e.g., security lockdown, maintenance, or manual override).

### Prerequisites

- **Owner must sign** to pause/unpause.
- **Scoped-wallet-id in TypeDB**.

### Steps

#### Pause

```typescript
const keypair = await deriveKeypair(ownerUid)
const tx = new Transaction()

tx.moveCall({
  target: `${SUI_PACKAGE_ID}::scoped_wallet::pause`,
  typeArguments: ['0x2::sui::SUI'],
  arguments: [
    tx.object(walletId),
  ],
})

const result = await signAndExecute(tx, keypair)
// Emits: WalletPaused { wallet_id, by, epoch }

// When paused, all spend() calls abort with E_PAUSED
```

#### Unpause

```typescript
const tx = new Transaction()
tx.moveCall({
  target: `${SUI_PACKAGE_ID}::scoped_wallet::unpause`,
  typeArguments: ['0x2::sui::SUI'],
  arguments: [
    tx.object(walletId),
  ],
})

const result = await signAndExecute(tx, keypair)
// Emits: WalletUnpaused { wallet_id, by, epoch }
```

#### Record in TypeDB

Track pause state (optional but recommended for monitoring):

```typeql
match $u isa unit, has uid "marketing:creative:intern";
delete $u has status $s;
insert $u has status "paused";
# Do NOT insert a paused attribute — use status field instead
```

---

## 5. Pause Cascade (Dead-Man Switch)

**Overview:** A background job (CF Worker) runs every 14 days to check agent liveness. If a parent agent is silent for 30 days, all its child agents are auto-paused.

### Heartbeat Constants

```typescript
export const HEARTBEAT_INTERVAL_DAYS = 14  // How often agents ping
export const DEADMAN_THRESHOLD_DAYS = 30   // Silence threshold before pause
```

**Timing:**
- Agent pings every 14 days via `sendHeartbeat(uid)`.
- If 30+ days of silence (no heartbeat received), cascade triggers.
- Dead-man threshold = 2.14× heartbeat interval.

### How it works

#### Step 1: sendHeartbeat() — called by CF Worker cron every 14 days

```typescript
// From src/workers/heartbeat.ts
export async function sendHeartbeat(uid: string): Promise<void> {
  // 1. POST /api/signal with agent:alive tag
  //    → Substrate records the signal, marks pheromone
  
  // 2. Upsert TypeDB: liveness-last-verified-at = now
  //    Pattern: delete old attribute, insert new
  writeSilent(`
    match $u isa unit, has uid "${uid}";
    delete $u has liveness-last-verified-at $lv;
    insert $u has liveness-last-verified-at "2026-04-23T10:00:00";
  `)

  // 3. Check dead-man cascade for children
  await checkDeadManCascade(uid)
}
```

**TypeDB schema assumption:** The `unit` entity has an optional `liveness-last-verified-at` datetime attribute. It's not yet in `world.tql` — you may need to add it:

```typeql
attribute liveness-last-verified-at, value datetime;
```

Then add to `unit` entity:

```typeql
entity unit,
  ...
  owns liveness-last-verified-at,  # Optional; set by sendHeartbeat()
  ...
```

#### Step 2: checkDeadManCascade() — triggered after each heartbeat

```typescript
export async function checkDeadManCascade(parentUid: string): Promise<void> {
  const thresholdMs = DEADMAN_THRESHOLD_DAYS * MS_PER_DAY
  const cutoff = new Date(Date.now() - thresholdMs).toISOString()

  // Query children owned by this parent (g:owns:* group pattern)
  const children = await readParsed(`
    match
      $g isa group, has gid $gid, has group-type "owns";
      (group: $g, member: $parent) isa membership, has member-role "chairman";
      $parent isa unit, has uid "${parentUid}";
      (group: $g, member: $child) isa membership;
      $child isa unit, has uid $childUid;
      $childUid != "${parentUid}";
    select $childUid, $gid;
  `)

  // For each child, check liveness-last-verified-at
  for (const child of children) {
    const liveness = await readParsed(`
      match $u isa unit, has uid "${childUid}", has liveness-last-verified-at $lv;
      select $lv;
    `)

    let isSilent = false
    if (!liveness.length) {
      // Never pinged — check creation date
      const created = await readParsed(`
        match $u isa unit, has uid "${childUid}", has created $c;
        select $c;
      `)
      if (!created.length) {
        isSilent = true  // No metadata at all — assume old
      } else {
        isSilent = new Date(created[0].c) < new Date(Date.now() - thresholdMs)
      }
    } else {
      isSilent = new Date(liveness[0].lv) < cutoff
    }

    if (isSilent) {
      // Emit agent:paused signal → triggers pause on substrate
      await fetch('https://dev.one.ie/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: parentUid,
          receiver: childUid,
          data: JSON.stringify({
            type: 'agent:paused',
            tags: ['agent:paused', 'deadman'],
            parentUid,
            reason: 'deadman',
            timestamp: new Date().toISOString(),
          }),
        }),
      })
    }
  }
}
```

**What happens:**
1. Parent's `liveness-last-verified-at` is checked.
2. If older than `DEADMAN_THRESHOLD_DAYS` (30 days), or if attribute missing and created date is old, `isSilent = true`.
3. An `agent:paused` signal is emitted to each silent child.
4. The substrate receives the signal and marks the child paused (via `/api/signal` handler).

### Manual pause cascade (emergency)

If you need to manually trigger cascade without waiting for heartbeat:

```typescript
import { checkDeadManCascade } from '@/src/workers/heartbeat'

// Trigger cascade check for a parent
await checkDeadManCascade("marketing:creative")
```

### Monitoring

Check if an agent is alive:

```typeql
match $u isa unit, has uid "marketing:creative", has liveness-last-verified-at $lv;
select $lv;
```

If no result → agent has never pinged. Check `created` date.

Check cascade status (see which children are paused):

```typeql
match
  $g isa group, has group-type "owns";
  (group: $g, member: $parent) isa membership, has member-role "chairman";
  $parent isa unit, has uid "marketing:creative";
  (group: $g, member: $child) isa membership;
  $child isa unit, has status "paused";
select $child;
```

---

## 6. Heartbeat Verification (Monitoring)

**Overview:** Verify agent liveness manually. The system expects each agent to send a heartbeat every 14 days.

### Check liveness

```typeql
# See when an agent last pinged
match $u isa unit, has uid "marketing:creative:intern", has liveness-last-verified-at $lv;
select $lv;
```

**Expected:** A recent timestamp (within 14 days of now).

**If missing or old:** The agent has not pinged. Check:
1. Is the agent booting successfully? Run `bootAgent(uid)` and `verifyScopeMatch()`.
2. Is the CF Worker cron scheduled? Check the worker logs.
3. Is the agent's handler for `agent:alive` signals registered in the substrate?

### Restart a paused agent

If a dead-man cascade paused an agent, manually unpause it:

```typescript
// If the agent is paused on-chain:
await unpause(walletId)

// If the agent is marked paused in TypeDB (status = "paused"):
match $u isa unit, has uid "marketing:creative:intern";
delete $u has status "paused";
insert $u has status "active";
```

Then restart the agent:

```typescript
import { bootAgent, verifyScopeMatch } from '@/lib/agent-boot'
const config = await bootAgent(childUid)
const isValid = await verifyScopeMatch(config)
if (isValid) {
  console.log("Agent is ready to run")
}
```

### Triggering a heartbeat on-demand

For testing or manual recovery:

```typescript
import { sendHeartbeat } from '@/src/workers/heartbeat'

await sendHeartbeat("marketing:creative:intern")
// → POSTs agent:alive signal
// → Updates liveness-last-verified-at in TypeDB
// → Runs checkDeadManCascade for the agent's children
```

---

## Agent Boot Verification

**When:** Every time an agent starts, before it processes signals.

**Steps:**

```typescript
import { bootAgent, verifyScopeMatch } from '@/lib/agent-boot'

// 1. Derive wallet address and fetch TypeDB scoped-wallet-id
const config = await bootAgent(uid)
// Returns: { uid, walletAddress, scopedWalletId? }

// 2. Verify on-chain scope matches
const isValid = await verifyScopeMatch(config)

if (!isValid) {
  console.error("Agent scope mismatch — refusing to run")
  process.exit(1)
}

// 3. Agent is safe to run
console.log("Agent booted successfully")
```

**Scope match logic:**
- **No scopedWalletId in TypeDB:** Agent is unrestricted. Boot succeeds.
- **ScopedWallet exists:** Query Sui RPC, read `fields.agent`, compare to derived address.
  - **Match:** Boot succeeds.
  - **Mismatch:** Boot fails. Scope was rotated, or TypeDB is stale.
  - **Object missing:** Boot fails. Wallet was revoked, or object ID is wrong.

---

## Troubleshooting

### Agent boot fails: "No ScopedWallet found for parent"

**Cause:** `scoped-wallet-id` attribute is not set on the parent unit in TypeDB.

**Fix:**
1. Manually query the parent's Move wallet object ID.
2. Insert it into TypeDB:
   ```typeql
   match $u isa unit, has uid "marketing:creative";
   insert $u has scoped-wallet-id "0x1234...";
   ```

### Agent boot fails: "Scope mismatch"

**Cause:** TypeDB `scoped-wallet-id` points to a wallet with a different `agent` field than the derived address.

**Possible reasons:**
- TypeDB was not updated after `spawn_child`.
- Wallet was transferred or rotated without updating TypeDB.
- Wrong `SUI_SEED` or uid derivation.

**Fix:**
1. Verify on-chain: Query the wallet object and read `fields.agent`.
2. Verify derivation: Recalculate `addressFor(uid)` and compare.
3. If they match: Update TypeDB.
4. If they don't match: The setup is broken. Re-spawn the agent.

### Dead-man cascade didn't trigger

**Cause:** CF Worker cron didn't run, or `checkDeadManCascade` didn't find children.

**Debug:**
1. Check CF Worker logs for `heartbeat.ts`.
2. Manually check the parent's children:
   ```typeql
   match
     $g isa group, has group-type "owns";
     (group: $g, member: $parent) isa membership, has member-role "chairman";
     $parent isa unit, has uid "marketing:creative";
     (group: $g, member: $child) isa membership;
     $child isa unit, has uid $childUid;
   select $childUid;
   ```
3. If no children found, the `g:owns:*` group doesn't exist. Create it:
   ```typeql
   insert $g isa group,
     has gid "g:owns:marketing:creative:intern",
     has group-type "owns";
   insert (group: $g, member: $parent) isa membership,
     has member-role "chairman";
   insert (group: $g, member: $child) isa membership,
     has member-role "agent";
   ```

### Child agent won't spend (E_CAP_EXCEEDED, E_NOT_ALLOWED, etc.)

**Cause:** Move validation rejected the spend.

**Debug:**
1. Check the wallet's state:
   ```bash
   curl -X POST https://fullnode.mainnet.sui.io:443 \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "suix_getObject",
       "params": ["'$walletId'", { "showContent": true }]
     }'
   ```
2. Check:
   - `fields.paused`: If true, wallet is paused. Call `unpause()`.
   - `fields.spent_today` + amount: Does it exceed `fields.daily_cap`? If so, cap is exhausted. Increase cap with `rotate_cap()` or wait for epoch reset.
   - `fields.allowlist`: Is the recipient in the list? If list is empty, any recipient is allowed.
3. Check the epoch:
   - Call `rotate_day()` to reset `spent_today` if epoch changed.

---

## Best Practices

1. **Always store scoped-wallet-id in TypeDB immediately after spawn.**
   - Don't rely on event indexing — the attribute is load-bearing for boot verification.

2. **Run heartbeat checks regularly.**
   - Set CF Worker cron to daily or weekly (not just every 14 days).
   - Allows early detection of silent agents before cascade triggers.

3. **Test pause and unpause before putting in production.**
   - On testnet, spawn an agent, pause it, verify spend fails, unpause, verify spend works.
   - Test at depth — spawn a grandchild and pause the parent, verify cascade pauses the grandchild.

4. **Audit all revokes.**
   - Emit a signal with reason and timestamp.
   - Keep the TypeDB record with `dissolved-at` timestamp for compliance.

5. **Monitor dead-man cascade.**
   - Log each `agent:paused` signal emitted by the cascade.
   - Alert on unexpected cascades (indicates network or agent failure).

6. **Keep move event logs.**
   - Index `ChildSpawned`, `WalletPaused`, `WalletRevoked`, `OwnerRotated` events.
   - Off-chain indexing lets you recover `scoped-wallet-id` if TypeDB is out of sync.

---

## References

- **Move contract:** `src/move/one/sources/scoped_wallet.move` — entry functions, guards, events.
- **Boot verification:** `src/lib/agent-boot.ts` — `bootAgent()`, `verifyScopeMatch()`.
- **Spawn implementation:** `src/lib/peer/spawn-child.ts` — `spawnChild()` with TypeDB resolution.
- **Heartbeat and cascade:** `src/workers/heartbeat.ts` — `sendHeartbeat()`, `checkDeadManCascade()`.
- **Agent architecture:** `/Server/agents.md` — Pattern D (peer agents), safety floor, four patterns.
- **Schema:** `src/schema/world.tql` — unit, group, membership, signal entities.
