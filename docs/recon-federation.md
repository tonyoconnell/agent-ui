# Recon — Federation across substrates (Gap 6 W1)

> Autonomous W1 recon. Written without user input; user should ratify
> or amend before W3 endpoints land.

## What exists today

Examined: `src/engine/federation.ts` (66 lines) + `src/pages/api/paths/bridge.ts`
(106 lines).

### `federation.ts` (current shape)

The engine module exports `federate(remote, opts)` that wraps a remote
substrate as a unit in the local world. Foreign units are addressed via
`<remote>:<uid>` namespacing. Signals to foreign receivers go out via
HTTP fetch; results come back as response payloads.

### `bridge.ts` (current shape)

`POST /api/paths/bridge` lets two chairmen establish a bridge path
between their respective groups. The path is created in TypeDB with
both groups as participants. There's no per-substrate owner assertion
yet — the V1 implementation trusts the chairman who initiates.

## What Gap 6 adds

### 1. Owner assertion at bridge creation

Both substrates' owners co-sign the bridge handshake. Stored on the
bridge path:

```
peer_owner_address  - the foreign substrate's owner Sui address
peer_owner_version  - the foreign owner's key version (Gap 4 §4.s1)
local_owner_version - this substrate's owner key version at bridge time
created_at          - epoch (seconds)
```

### 2. Foreign signal downgrade

Today: foreign signals route through `federate()` and the receiving
substrate treats them with the role they claim (potentially "owner"
on the foreign side).

Gap 6: when a foreign signal arrives at this substrate, the local
auth middleware DOWNGRADES the role from "owner" → "chairman"
*as far as the local scope/network/sensitivity gates are concerned*.
The foreign owner doesn't get owner-tier bypass on a substrate
where they aren't the substrate-singleton owner.

### 3. Version-mismatch rejection

If the bridge path's `peer_owner_version` < the version the inbound
signal claims (e.g. peer rotated their owner key but bridge wasn't
re-handshaken), reject with `federation:bridge:stale` and require
re-handshake. Prevents stale-key abuse after the peer has rotated.

## Field decisions (autonomous, ratify on wake)

| Field | Choice | Why |
|---|---|---|
| Foreign role at receiver | **chairman** (downgrade from owner) | Safe default; foreign owner is just another tenant in this substrate's world. |
| Bridge versioning | **Track peer_owner_version on the bridge path** | Lets us detect peer rotation and force re-handshake. |
| Version mismatch behavior | **Reject with `federation:bridge:stale`** | Surfaces the issue immediately rather than silently accepting stale keys. |
| Re-handshake trigger | **Manual** (peer or local owner re-runs `/api/paths/bridge`) | Automatic re-handshake risks abuse; explicit re-key is auditable. |
| Cross-substrate identity | **Foreign units namespaced `<remote>:<uid>`** | Already the existing pattern in federation.ts; keep it. |
| Owner key proof | **WebAuthn assertion at bridge time** | Symmetric with the substrate's own owner-tier auth model. |

## Threat model (V1 acceptance)

| Threat | Mitigation |
|---|---|
| Foreign owner abuses owner-tier on local substrate | Downgrade to chairman role; foreign owner subject to local scope/network/sensitivity gates. |
| Foreign substrate's owner key is rotated; old bridge stale | `peer_owner_version` mismatch → reject with `federation:bridge:stale`; require re-handshake. |
| Bridge spoofing (fake foreign substrate) | WebAuthn assertion at handshake binds the bridge to a specific peer owner Sui address. Spoofer can't sign without the foreign PRF. |
| Replay of bridge handshake | Nonce in handshake challenge; bridge path stores `created_at` and rejects duplicate creates within window. |
| Cross-substrate signal flood (foreign substrate DOSes ours) | Existing rate ceiling (Gap 5) applies to bridge inbound — bridges have a key id and get the same hard ceiling. |

## Implementation notes for W3 (deferred)

### `POST /api/paths/bridge` (extension)

```typescript
// Body adds:
{
  ...existing,
  peerOwnerAddress: string,       // foreign substrate's owner Sui address
  peerOwnerVersion: number,       // foreign owner's key version
  peerAssertion: WebAuthnAssertion, // the foreign owner's signed proof
}

// Server:
//   1. Verify peerAssertion via @simplewebauthn/server using the
//      foreign substrate's published JWKS / public key registry
//   2. Local owner asserts (existing flow)
//   3. INSERT bridge path with peer_owner_address + peer_owner_version
```

### `engine/federation.ts` (extension)

```typescript
// In the receive() path, when an inbound signal arrives via a bridge:
async function inbound(signal: Signal, fromBridge: BridgePath) {
  if (signal.role === 'owner') {
    // Downgrade: foreign owner is a chairman in our world
    signal.role = 'chairman'
    audit({ kind: 'federation:downgrade', from: fromBridge.peerOwnerAddress })
  }
  if (signal.peerOwnerVersion !== fromBridge.peerOwnerVersion) {
    return reject({ reason: 'federation:bridge:stale' })
  }
  // ... continue normal routing
}
```

## Open questions

(All answered autonomously. User can override.)

1. ~~How is foreign substrate's WebAuthn pubkey published?~~ → A
   `/.well-known/owner-pubkey.json` discovery endpoint per substrate;
   trusted at bridge handshake time and pinned thereafter.
2. ~~What if foreign substrate uses a different scheme (Sui multisig, etc.)?~~
   → V1 supports single-key foreign owners. Multisig federation is V2.
3. ~~How do we revoke a bridge?~~ → DELETE `/api/paths/bridge` —
   requires both substrates' owners or a unilateral local-side decision
   (with audit row).

## See also

- `federation.md` — V1 protocol spec (W3 deliverable, deferred)
- `owner.md` §"Threat model" — accepted threats
- `owner-todo.md` Gap 6 — task list
- WebAuthn cross-RP federation: not standardized; this is a custom pattern
- Existing `src/engine/federation.ts` + `src/pages/api/paths/bridge.ts`
