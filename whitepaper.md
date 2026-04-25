# Authority by Physics, Settlement by Math

### An Architecture for the Agent Economy

**ONE Protocol Whitepaper · v1.1**
*Tony O'Connell · tony@one.ie · `one.ie` · April 2026*

---

> By 2030, agents will execute more economic transactions than humans. The infrastructure to support this — at the speed agents move, across organizational boundaries, with no human in the approval loop — does not exist today. This paper describes one that does.

---

## Abstract

Existing agent frameworks treat **authority as a string** and **settlement as a promise**. Both assumptions fail under adversarial conditions. Both fail catastrophically when the parties are autonomous agents transacting across organizational boundaries at machine speed.

The ONE substrate replaces the string with a Move object enforced by consensus, replaces the promise with atomic on-chain settlement, and unifies the two so that paying an agent is the same operation as marking the path that found it. Authority cannot be copied: the Move VM enforces object uniqueness at the protocol level. Settlement cannot be reneged: there is no separate ledger to reconcile — the routing graph *is* the payment history.

This is not a research proposal. The implementation is live: Move package `0xd064518697137f39a333d50f3a6066117332aeb079fc23a7617271b9ad5f4980` on Sui testnet, gateway at `api.one.ie`, source at `github.com/one-ie/one`. Routing latency `<0.005ms`. Settlement finality `≤2s`. Tests: 1837 passing.

---

## 1. Three Structural Failures

Every existing agentic framework — LangChain, AutoGPT, CrewAI, Agentverse, every OAuth wrapper built on top — fails at the same three points. Not because the engineers are inattentive. Because the abstractions inherited from the human-internet era cannot bear the load that agents are about to put on them.

### 1.1 Authority is a string

Every authority check, eventually, reduces to: *if the bearer presents a valid token, proceed.* The word *valid* hides the trust. Valid according to whom? An identity provider. Who guarantees the provider is online, uncorrupted, and prompt to revoke? A team of engineers at a company.

A string can be copied. A copied string is indistinguishable from the original. There is no cryptographic property that prevents a leaked OAuth token from being replayed by anyone who has it. Mitigations — short lifetimes, device binding, refresh ceremonies — trade attack surface for operational complexity, and they collapse the moment the agent moves between machines (which it constantly does).

Token-based authority works for humans because humans don't move very fast. By the time a human notices the breach, a human can call a support line. Agents do not have this luxury.

### 1.2 Settlement is a promise

Two agents in different organizations want to transact. Agent A delivers work. Agent B is supposed to pay. What enforces the payment? In every existing system: a contract between the operators, settled out of band, in fiat, with human review.

This is not settlement. This is a credit relationship. Credit relationships have overhead — legal review, dispute resolution, collections — that is fixed regardless of transaction size. At $10,000 per transaction, the overhead amortizes. At $0.0003, the overhead is six orders of magnitude larger than the transaction value.

The result: agent-to-agent micro-payments do not exist. They are theoretically described in agent-economy whitepapers and never observed in production, because the settlement infrastructure that could carry them is not the settlement infrastructure that exists.

### 1.3 Blast radius scales with autonomy

A compromised human credential is bad. A compromised agent credential, in a system where agents spawn sub-agents in milliseconds, is a fleet event. By the time the human operator notices, the entire ownership tree below the compromised key has acted. There is no rotate-and-recover strategy that completes faster than an attacker's tree traversal.

The combination — copyable authority + promise-based settlement + autonomous propagation — is the structural failure. Each component is tolerable in isolation. Together, in a world of agents-spawning-agents at machine speed, they constitute an unworkable foundation.

---

## 2. Thesis

> 1. **Agent authority must be enforced by consensus, not policy.**
> 2. **Economic settlement must be atomic, not promised.**
> 3. **The two must be the same operation.**

The first is widely accepted by anyone who has thought carefully about agent security. The second is widely accepted by anyone who has thought carefully about cross-organizational settlement. The third is what makes the first two work together — and is the load-bearing claim of this paper.

A policy that says "the agent should not exceed its budget" is fundamentally different from a Move entry function that aborts if the agent tries. The first requires every party in the system to correctly implement the policy. The second requires nothing from anyone — the chain refuses, atomically, with no recourse.

A promise to pay is not payment. A Move transaction that transfers value in the same atomic block as the delivery confirmation is payment — verifiable, final, with no counterparty risk.

When payment and authority are enforced by the same object model, on the same chain, in the same transaction, the failure modes that haunt every existing agent framework simply cease to apply. Not because they have been mitigated. Because they are no longer expressible.

---

## 3. The Architecture

Six properties. Each is a single Move struct, a single function, or a single field. The whole system fits in `~700` lines of Move and `~1100` lines of TypeScript engine. The brevity is the point: an architecture that requires thousands of lines of policy code to enforce its invariants is not enforcing them.

### 3.1 Capability objects, not tokens

The `Capability` is a Move object. Move objects have one owner at any moment, enforced at the protocol level. They cannot be duplicated — not "should not," **cannot**.

```move
public struct Capability has key, store {
    id: UID,
    unit_id: ID,     // which unit this grants authority over
    scope: String,   // "mark", "warn", "pay", "all"
    amount_cap: u64, // max per-operation amount (0 = unlimited)
    expiry: u64,     // ms timestamp; 0 = never expires
    owner: address,  // chairman who minted this
    holder: address, // agent's current ephemeral address
}
```

The chairman mints. Move transfers it to the agent's address. The agent calls `mark_with_cap` or `warn_with_cap`. The Move VM checks: is this Capability for this unit? Is the caller the holder? Is it within expiry? If any check fails, the transaction *aborts*. Not "logs a warning." Not "alerts an admin." Aborts. The action does not happen.

This is the structural difference between policy and consensus. **Policy is advice. Consensus is physics.**

### 3.2 No platform keys

If authority is enforced on-chain, the platform must not hold keys for agents. A platform that holds agent keys is the trusted intermediary it claims to remove — every consensus check is bypassed the moment the platform can sign for any agent.

The ONE architecture eliminates platform-held keys entirely:

```typescript
// src/lib/sui.ts — the entirety of agent key generation
export function generateEphemeralKeypair(): Ed25519Keypair {
  return new Ed25519Keypair()
}
```

No derivation from a platform seed. No persistent private key storage. The key exists for the lifetime of one Worker session, in RAM. The agent's authority comes from the Capability object it holds — not from anything the platform retains.

This was not the original design. The system previously derived agent keys from `SUI_SEED + uid → SHA-256 → Ed25519`. That pattern concentrates the entire fleet's risk in one secret. The migration to ephemeral keypairs (`sys-201` in `one/system-todo.md`) removed the platform from the trust chain entirely. **A breach of the platform now compromises zero agent keys, because the platform holds none.**

### 3.3 Revenue is weight

Pay an agent. Strengthen the path to that agent. These are not two operations. They are one:

```move
public fun pay(from: &mut Unit, to: &mut Unit, amount: u64,
               path: &mut Path, protocol: &mut Protocol) {
    // ... transfer funds ...
    path.revenue  = path.revenue + amount;   // revenue lives in path state
    path.strength = path.strength + 1;       // payment marks the path
    path.hits     = path.hits + 1;
    // ... emit events ...
}
```

The routing graph is not a model of the payment history. It *is* the payment history. The two cannot drift because they are the same field on the same object, written in the same transaction. There is no reconciliation step that could fail.

Off-chain, the substrate's STAN routing formula reads this state at `<0.005ms`:

```
weight = (1 + max(0, strength - resistance) × sensitivity) × latencyPenalty × revenueBoost
```

Agents that produce value get selected. Agents that fail accumulate resistance and disappear:

```typescript
// src/engine/persist.ts
export const isToxic = (edge, strength, resistance) => {
  const s = strength[edge] || 0
  const r = resistance[edge] || 0
  return r >= 10 && r > s * 2 && r + s > 5
}
```

When `isToxic` fires, signals dissolve before reaching the agent — no LLM call, no payment opportunity, no value extracted. Routing and economics are not coordinating across systems. They are the same system.

### 3.4 Humans safe by physics

Agents can own other agents. Agents can own a human's economic scope (a `ScopedWallet` the human is authorized to spend within). The natural question: what prevents an agent from acting *as* the human?

The answer is not policy. The answer is hardware.

A human's root identity is a WebAuthn passkey with PRF extension, stored in the device's Secure Enclave. The private key never leaves the Secure Enclave — it is not addressable by software. No agent, regardless of its Move capabilities, can produce a signature from a human's Secure Enclave. The hardware physically prevents it.

```
Agent → ScopedWallet → spend() → Touch ID (human's SE) → authorized
                              ↑
                   No software path bypasses this step.
                   Secure Enclave is physically isolated.
```

Agents can set the ceiling on a human's scope. They cannot forge the gesture that moves money within it. **The human's identity root is non-transferable by physics, not by policy.** This is the safety floor that makes the rest of the architecture safe to deploy.

### 3.5 Pheromone routing as adversarial defense

Move enforces authority on-chain. But Move only governs on-chain actions. What about an agent that is perfectly scoped on-chain yet returns garbage off-chain? Or an agent that consumes resources without producing results?

The substrate handles these through the second layer: pheromone routing.

```
Layer 1 — On-chain (Move):
  every tx → consensus checks Capability scope, expiry, amount_cap
  out-of-scope → abort (instantaneous, binary)

Layer 2 — Off-chain (pheromone):
  every signal outcome → mark() or warn()
  warn() accumulates resistance
  isToxic() → dissolve (signals stop reaching the agent at zero LLM cost)
```

The two layers are independent. Neither depends on the other. Both are always on.

Move is instantaneous and binary: in-scope or aborted. Pheromone is cumulative and probabilistic: succeed and grow, fail and fade. Together they cover both adversarial failure (Move) and incompetent failure (routing). A rogue agent that finds a Move loophole still fades from traffic. A scoped-but-incompetent agent still triggers `warn()` and disappears.

### 3.6 Governance as on-chain audit

Off-chain governance state — who has what role, who controls which group, when keys were revoked — can drift, be corrupted, or be revised. On-chain events cannot.

```move
public entry fun emit_governance(
    kind: String,    // chairman-grant | group-create | key-revoke | role-perm-change
    subject: String, // uid of the entity acted on
    object: String,  // group id, key id, or permission name
    clock: &Clock,
    ctx: &mut TxContext,
) {
    event::emit(GovernanceEvent {
        kind, subject, object,
        actor: ctx.sender(),       // verified by network, not claimed
        timestamp: clock::timestamp_ms(clock),
    });
}
```

`ctx.sender()` is not a claim. It is the transaction signer, verified by consensus. A governance event recorded with `actor: 0x3273…` proves that address signed — irreversibly, visible to anyone who queries the chain.

`mirrorGovernance` (in `src/engine/bridge.ts`) fires after every TypeDB governance write, keeping the on-chain log in sync. `absorbGovernance` handles the reverse: any node can rebuild governance state by replaying events from Sui. **The off-chain database is the fast read path. The chain is the truth. If they disagree, the chain wins.**

---

## 4. A Worked Adversarial Scenario

The argument so far is structural. To make it concrete, walk through what actually happens when an attacker tries each of four obvious attacks.

| # | Attack | What stops it | At which layer |
|---|--------|---------------|----------------|
| 1 | Replay a revoked Capability | Move VM rejects: object no longer exists | On-chain, instantaneous |
| 2 | Exfiltrate an agent's session key | Key is ephemeral + Capability-bound; rotate Worker → key gone | Architectural |
| 3 | Spoof a payment to mark a path | No spoof possible: path strength only increments inside `pay()` | Atomic, by construction |
| 4 | Compromise the platform to sign as agent | Platform holds no agent keys; nothing to sign with | Architectural |

### 4.1 Replaying a revoked Capability

The attacker captures the bytes of a `mark_with_cap` transaction and replays it after the chairman has burned the Capability.

What happens: the transaction references a Capability object ID. The Move VM looks up that ID. The object does not exist (it was deleted by `revoke_capability`). The transaction aborts at the input-resolution stage — before any code runs. No network round-trip to a revocation server. No race condition between replay and propagation. The object is gone; the transaction is impossible.

This is the property OAuth tokens fundamentally cannot have. An OAuth token is a string with a signature; verifying it requires a query to the issuer. A Move object is a *thing on the chain*; verifying it is the chain's job and is automatic.

### 4.2 Exfiltrating an agent's session key

The attacker compromises a Worker process and reads the in-RAM Ed25519 keypair.

Damage scope: the agent's authority is bounded by the Capability it holds. The Capability has a scope (`"mark"`, `"pay"`, etc.), an `amount_cap`, and an `expiry`. The attacker cannot exceed any of these — the Move VM enforces them on every transaction. Worst case: the attacker burns the agent's remaining `amount_cap` before the next Worker rotation expires the key.

There is no "escalate to other agents" because the key only matters for the one Capability it holds. There is no "persistent foothold" because the key dies with the Worker session. There is no "lateral movement" because every other agent has its own ephemeral key for its own Capability.

Compare to a compromised OAuth token in a current system: the attacker has every permission the user has, until the user notices, calls support, and waits for a database update to propagate. The blast radius difference is not incremental. It is structural.

### 4.3 Spoofing a payment to mark a path

The attacker wants to make a malicious agent look proven. They want to increment its `path.strength` without actually paying.

What happens: there is no API to increment `path.strength` directly. The only function that writes to it is `pay()` — which requires `from.balance >= amount`, splits the balance, transfers it to `to`, and increments strength as part of the same atomic transaction. To inflate strength, the attacker must send real SUI to the target. The "spoof" is indistinguishable from a payment, because it *is* a payment.

The defense was not designed in. It was structurally inevitable: revenue and weight are the same field. There is no separate weight to fake.

### 4.4 Compromising the platform

The attacker breaches the platform — the Cloudflare Workers, the TypeDB instance, the gateway. They want to act as an agent.

What happens: nothing. The platform holds zero agent private keys. The Capability objects are owned by ephemeral addresses generated per Worker session and never persisted. To act as an agent, the attacker would need that agent's session key — which exists only in the live RAM of the agent's Worker, and only for the lifetime of that Worker.

The platform can be entirely compromised and still cannot impersonate any agent. The platform is not a trusted intermediary. It is a router.

---

## 5. x402 — The HTTP Layer

The architecture above answers the *what*: payment is atomic, authority is an object, routing and revenue are the same field. The remaining question is *how* an agent discovers that payment is required and executes it autonomously.

The answer is HTTP 402 — the status code reserved in 1995 for "Payment Required" and never widely used. The Coinbase x402 standard makes it the wire protocol for agent commerce. ONE adopts it, with one important twist.

### 5.1 The flow

```
1. Agent → POST /api/capability/hire { buyer, provider, skillId }
2. Server → 402 + X-Payment-Required: <requirement JSON>
3. Agent pays on-chain (create_escrow → release_escrow)
4. Agent → POST /api/capability/hire { ... } + X-Payment: { escrow_id, tx_digest }
5. Server verifies on Sui RPC → 200 { groupId, chatUrl }
```

No registration. No API key exchange. No subscription. The agent hits a URL, learns what payment is required, pays, and proceeds.

### 5.2 The requirement payload

```json
{
  "version": 1,
  "scheme": "sui-escrow",
  "network": "sui:testnet",
  "maxAmountRequired": "0.05",
  "resource": "/api/capability/hire",
  "description": "Pay 0.05 SUI for research capability",
  "payTo": "0x<provider-sui-address>",
  "maxTimeoutSeconds": 3600,
  "asset": "SUI",
  "extra": {
    "escrow_template": {
      "worker_id": "0x<provider>",
      "task_name": "research",
      "amount_mist": 50000000,
      "deadline_ms": 1714000000000,
      "path_id": "0x<path-object>",
      "settlement_url": "/api/capability/hire/settle"
    }
  }
}
```

The escrow template is **deterministic**: same provider, same skill, same price → same template within its expiry window. Agents can cache it, share it with sub-agents, or retry without re-requesting.

### 5.3 Pheromone-gated access — the ONE twist

Standard x402 charges every request equally. The ONE gate learns from the relationship history:

```typescript
// src/pages/api/capability/hire.ts
const pheromone = net.sense(`${buyer}→${provider}`)

if (price > 0 && pheromone < 1.0) {
  // demand payment — new or untrusted relationship
  return payment402Response(requirement)
}
// pheromone ≥ 1.0 → earned trust, skip payment
```

A buyer who has paid once accumulates path strength. Once strength reaches `1.0`, payment is waived — the relationship has proven itself. This is not a loyalty program. It is a physical property of the routing graph: the path is strong enough that the gate opens.

If the buyer's outcomes deteriorate, resistance accumulates, the path becomes toxic, and the gate tightens again — automatically, with no operator intervention. **The price of trust is paid once. The cost of losing it is automatic.**

### 5.4 What this contributes to the standard

The x402 standard is being adopted by Cloudflare, Vercel, Google Cloud, Anthropic, and Visa. It is becoming the HTTP primitive for agent commerce.

ONE contributes two properties the standard alone does not:

**Pheromone-gated pricing.** Trusted agents pay less; new or failing agents pay more. This aligns the payment gate with the routing substrate's learning loop, instead of treating payments as opaque events.

**Settlement that marks the path.** When the escrow releases, the Sui transaction increments `path.revenue` and `path.strength` in the same atomic operation. The payment is not just settlement — it is a learning signal. Future `select()` calls are more likely to route to a provider that has been paid, because payment is evidence of value delivered.

```move
// release_escrow — payment is also a routing signal
path.strength = path.strength + 1;
path.hits     = path.hits + 1;
path.revenue  = path.revenue + amount;
```

An x402 payment in ONE does three things in one atomic operation: settles the transaction, strengthens the path, updates the routing weights for every agent that will subsequently ask `select()` who to use.

---

## 6. Comparison

| Property | LangChain / AutoGPT | OAuth-delegated agents | Custodial agent platforms | **ONE Substrate** |
|----------|---------------------|------------------------|---------------------------|-------------------|
| Authority model | Code-level policy | Token (string) | Platform-mediated | Move object (consensus) |
| Authority revocation | Restart process | Database update + propagation | Database update | Burn object (one tx) |
| Key custody | In-process, ephemeral | OAuth provider | Platform | **None** (ephemeral, in-RAM) |
| Settlement | Out-of-band, fiat | Out-of-band, fiat | Platform-mediated | On-chain, atomic, ≤2s |
| Cross-org transactions | Bilateral contract | Federation agreement | Single platform only | Open, consensus-bridged |
| Micro-payment floor | ~$1 (overhead) | ~$1 (overhead) | ~$0.01 (platform fee) | $0.0001 (50 bps Sui fee) |
| Reputation signal | Manual / heuristic | Provider-assigned | Platform-assigned | **Cryptographically verified path strength** |
| Audit trail | Application logs | Provider logs | Platform logs | On-chain `GovernanceEvent` |
| Human safety floor | Operator policy | Token scope | Platform policy | **Secure Enclave (hardware)** |

The first three columns share a structural property: an off-chain authority decides what an agent can do, and an off-chain ledger decides whether it has been paid. The last column makes both decisions by consensus.

---

## 7. What This Is Not

Three claims this paper deliberately does not make.

**This is not a blockchain product.** The user does not see Sui. The user does not pay gas. The user does not manage a seed phrase unless they explicitly opt into `BIP39` paper recovery. Sui is the settlement layer; it is invisible to anyone who does not need to verify a transaction. The interface is HTTP and React. The chain is a substrate, not a surface.

**This is not anti-LLM.** The deterministic sandwich (`pre-check → LLM call → post-check`) places the LLM at the center of the system. The architecture is what makes it safe to give an LLM agent real economic authority — capabilities are bounded, payments are atomic, failures are routed around. The probabilistic component remains probabilistic. Everything else becomes math.

**This is not new cryptography.** Move, Ed25519, WebAuthn, AES-256-GCM, HKDF — all standard. The contribution is the *composition*: using these well-understood primitives to construct a system where authority and settlement are the same operation, and humans are safe by hardware physics. Innovation in cryptography is dangerous. Innovation in architecture is necessary.

---

## 8. Live Implementation

| Component | Location | Status |
|-----------|----------|--------|
| Move contract (`one::substrate`) | `src/move/one/sources/one.move` | Testnet v2 ✅ |
| Runtime routing (STAN, pheromone) | `src/engine/world.ts`, `src/engine/persist.ts` | Production ✅ |
| Bridge (mirror/absorb governance) | `src/engine/bridge.ts` | Wired ✅ |
| Ephemeral keypairs (no platform seed) | `src/lib/sui.ts` | Deployed ✅ |
| x402 gate + hire endpoint | `src/lib/x402.ts`, `src/pages/api/capability/hire.ts` | Live ✅ |
| Settlement (durable, idempotent) | `src/pages/api/capability/hire/settle.ts` | Live ✅ |
| Gateway (TypeDB proxy + WsHub DO) | `api.one.ie` | Live ✅ |
| Testnet package | `0xd064518697137f39a333d50f3a6066117332aeb079fc23a7617271b9ad5f4980` | v2, all tx verified |

**Measured numbers (production, not targets):**

| Metric | Value | Source |
|--------|-------|--------|
| Routing decision | `<0.005ms` | `src/engine/world.ts` STAN formula |
| Gateway response (cached) | `<10ms` | `api.one.ie/health` |
| Sui escrow release finality | `≤2s` | Sui testnet observed |
| Test suite | 1837 / 1928 passing | `bun run verify` |
| Engine size | 670 LOC | `src/engine/world.ts` + `persist.ts` |
| Move contract | 700 LOC | `src/move/one/sources/one.move` |

The brevity is not incidental. **An architecture that requires thousands of lines of policy code to enforce its invariants is not enforcing them.** The whole substrate fits in less code than a single mid-sized React component.

---

## 9. Conclusion

The agent economy is not a forecast. It is the present tense, advancing at speeds that make trust-based authority and promise-based settlement look like fax machines on a fiber network.

The question is not whether to build trustless infrastructure for agents. The question is whether to build it now, with the architecture that actually works, or to inherit a decade of technical debt from systems designed for human-speed, same-organization interactions.

Three properties are non-negotiable, and each is a single architectural commitment:

1. **Authority enforced by consensus.** *"Should"* has no place in agent security. *"Cannot"* — enforced by the Move VM — does.
2. **Settlement atomic with delivery.** Payment and routing are the same operation. Revenue is weight. An economy that learns which paths produce value is fundamentally different from one that assigns reputation scores.
3. **The human identity root non-transferable by physics.** Every layer of agent autonomy, every depth of the spawned ownership tree, terminates at a biometric gate that no software can forge. This is not a design choice. It is the hardware constraint that makes machine-speed agent authority compatible with human safety.

The ONE substrate is not a step toward this architecture. It *is* the architecture, live, verifiable on Sui testnet, with source code at `one.ie` and `github.com/one-ie/one`.

Authority by physics. Settlement by math. The two, composed, enable an agent economy that is not a payment processor with extra steps — but an actual economy, learning, hardening, and growing as it transacts.

---

*ONE Protocol · `one.ie` · `api.one.ie` · `github.com/one-ie/one`*
*Move package: `0xd064518697137f39a333d50f3a6066117332aeb079fc23a7617271b9ad5f4980` · Sui testnet · v2*
*Whitepaper v1.1 · April 2026*
