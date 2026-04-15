---
title: Launch handoff — ONE ↔ agent-launch
type: contract
---

# Launch Handoff

ONE is the substrate. [agent-launch](https://agent-launch.ai) is the mint. `oneie launch` is the only boundary between them.

---

## Contract

**Request** (CLI / SDK → agent-launch):

```
POST ${AGENT_LAUNCH_URL}/v1/tokens
Content-Type: application/json
Authorization: Bearer ${AGENT_LAUNCH_API_KEY}   (optional)

{
  "agentUid": "tutor",
  "chain": "sui",              // "sui" | "base" | "solana"
  "dryRun": false,
  "meta": { ... }              // free-form, passed through
}
```

**Response** (agent-launch → caller):

```json
{
  "tokenId": "tkn_01HX...",
  "address": "0xabc…",         // optional on dryRun or chains without addresses
  "chain": "sui",
  "dryRun": false,
  "raw": { /* agent-launch-native fields */ }
}
```

**Substrate side-effect** (SDK best-effort):

```
POST /api/signal
{
  "sender": "launcher",
  "receiver": "agent:${agentUid}",
  "data": { "tags": ["token-launched"], "content": <LaunchResult> },
  "scope": "public"
}
```

If the signal emit fails (local dev, no envelopes server, network error), the launch is still authoritative — the mint receipt lives at agent-launch.

---

## What ONE does not do

Explicitly out of scope for envelopes:

- `tokenize`, `buy`, `sell`, `holders`, `claim`, `delegation`
- Bonding curves, price discovery, liquidity
- ERC-20, ERC-721, wallet management, FIAT onramps
- Cosmos (`@cosmjs/*`), EVM (`ethers`), BSC

Any user asking about these: link to agent-launch.

## What ONE learns from a launch

After a `token-launched` signal lands, the substrate's L6 loop promotes the pattern:

```
hypothesis: "agent ${uid} launched on ${chain}"  confidence: observed
```

Over time, path strength accumulates on `agent:${uid} -> token-launched`. Agents that convert to launches strengthen that path; agents that don't earn resistance.

See [routing.md](routing.md) for the full learning cycle.

---

## See Also

- [sdk-reference.md](sdk-reference.md) — `launchToken()` API
- [cli-reference.md](cli-reference.md) — `oneie launch` verb
- `packages/sdk/src/launch.ts` — the implementation
- `src/engine/loop.ts` — where `token-launched` is observed
