# Recon — WebAuthn multi-assertion + Sui multisig (Gap 3 W1)

> Autonomous W1 recon for Gap 3 multi-sig. Written without user input;
> user should ratify or amend before W3 endpoints land. Decisions
> referenced here are summarised in `compliance.md` §W2.

## WebAuthn multi-assertion (browser side)

### Question 1: can a single ceremony cover multiple credentials?

**Answer: no.** WebAuthn `navigator.credentials.get()` resolves with
exactly one assertion. The `allowCredentials` array can list multiple
credIds, but the browser picker shows the user a choice and produces
one signature.

**Implication:** a 3-of-5 multisig requires 3 separate ceremonies, one
per signing member. Each member sees their own Touch ID prompt on
their own device.

### Question 2: how do we coordinate?

Two viable patterns:

1. **Server-orchestrated batched** (chosen for V1):
   - Server issues a challenge for the action + group + nonce
   - Server distributes the challenge to all M members (Slack DM /
     in-app notification / email link)
   - Each member's browser POSTs their assertion individually to
     `/api/auth/passkey/assert?bundle=<bundle-id>`
   - Server collects assertions in a 5-min TTL bundle; when
     count(verified) ≥ N, the action proceeds
   - Audit: every POST emits `multisig:assertion:received`; the
     final dispatch emits `multisig:threshold:reached`.

2. **Client-orchestrated relay** (rejected):
   - One member acts as coordinator; their browser polls the others
   - Adds complexity (poll loops, rendezvous server) for marginal
     UX benefit
   - Each member still has their own Touch ID prompt anyway

### Question 3: assertion window

Survey of comparable systems:

| System | Multi-sig window | Notes |
|---|---|---|
| Gnosis Safe | Indefinite (off-chain queue) | But each sig is an EIP-712 sig with no inherent expiry |
| FIDO2 attestation | 5 min default per RP | Spec'd, widely-implemented |
| AWS IAM role assumption | 1 hour max session | Different threat model |
| Sui multisig | None (chain-level) | Sigs aggregate at tx submission |

**Recommendation: 5 min**. Matches the FIDO2 default; long enough for
cross-timezone members; short enough that a stolen challenge isn't
useful for long-burn attacks.

## Sui multisig (chain side, V2)

### Native primitive: `MultiSigPublicKey`

Sui supports `MultiSigPublicKey` with up to 10 keys, weighted, summing
to a threshold. Every Move tx signed by the multisig is verified
against the threshold by the consensus layer — no application code
needed beyond constructing the multisig pubkey at group creation.

```move
// Conceptual; actual API is in @mysten/sui/multisig
const multisig = new MultiSigPublicKey({
  threshold: 3,
  publicKeys: [
    { publicKey: chairmanA_pk, weight: 1 },
    { publicKey: chairmanB_pk, weight: 1 },
    ...
  ],
})
const address = multisig.toSuiAddress()
```

### Mapping to our data model

- `chairman_multisig` D1 row stores `threshold_n`, `threshold_m`,
  `member_credentials` (JSON of {uid, credId} pairs).
- For V2, also store `member_sui_pubkeys` and the derived multisig
  Sui address. Operations against the chain go through that address.
- For V1, off-chain assertion is enough — Move bypass is just an
  audit-emit (Gap 2) in the API layer.

### V1 → V2 migration

V1 → V2 is additive:

1. V1 ships with off-chain assertion check.
2. When a tenant requests V2, the chairman set publishes their Sui
   pubkeys + a Move multisig wallet is created.
3. Subsequent owner-bypass actions for that group route through the
   on-chain multisig wallet for any tx with on-chain effect.
4. Off-chain actions (read-memory, discover) continue with V1
   assertion-only (no chain write to gate).

V2 plan: out of Gap 3 scope; track in a future `Gap 3.5 — On-chain
multisig` follow-up.

## Recovery (member compromise)

### The narrow case: 1 of N keys lost

- The compromised member's row in `chairman_multisig.member_credentials`
  is marked compromised by an N-1 vote of remaining members.
- The remaining N-1 members re-publish a NEW multisig configuration
  (without the compromised credential).
- The replacement member (if any) enrolls a new passkey + is added
  by another N-1 vote.

### The catastrophic case: N or more compromised

- The substrate owner re-initializes the group's chairman set.
- Owner's actions are audit-logged (Gap 2 §2.r2 — every owner-tier
  action emits `audit:owner:`); the recovery is observable.
- Tenant can demand re-signing of all open actions or a fresh group
  creation.

### Edge: passkey lost but not compromised

- Member who lost their passkey enrolls a new one on a fresh device
  via the existing `/u` flow (BIP39 paper recovery if their phone
  is gone too).
- Other members vote to swap the credId in `member_credentials`.
- No threshold change.

## Field decisions (autonomous, ratify on wake)

| Field | Decision | Why |
|---|---|---|
| Window | 5 min | FIDO2 default; cross-timezone friendly |
| Granularity | Per-group | Matches enterprise governance model |
| Weights | Equal V1 | Simpler UI; rank order rare at same level |
| Recovery quorum | Same N-of-M as actions | Symmetric; no second governance |
| On-chain | V2 deferred | Ship V1 in a week; on-chain when value justifies |
| Action scope | Owner-bypass actions only | Blanket multisig is unusable |

## Open questions for W2

(Already answered autonomously in `compliance.md` §W2. User can
override any of these; the schema in `0033_chairman_multisig.sql` is
flexible to support a different decision.)

1. ~~What's the assertion window?~~ → 5 min
2. ~~Which actions require multisig?~~ → owner-bypass only (Gap 2 path)
3. ~~Can member weights differ?~~ → no, equal V1
4. ~~Where does on-chain wallet live?~~ → V2 — deferred
5. ~~Recovery threshold separate from action threshold?~~ → no, same

## See also

- `compliance.md` — W2 decisions table (the contract for W3)
- `owner-todo.md` Gap 3 — task list
- `owner.md` §"Threat model" — accepted threats
- WebAuthn spec: https://w3c.github.io/webauthn/
- Sui multisig docs: https://docs.sui.io/guides/developer/cryptography/multisig
