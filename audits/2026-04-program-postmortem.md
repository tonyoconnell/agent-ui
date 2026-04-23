# Post-Mortem: ONE v0.1.0 — Wallet + Chat + Pay

**Program:** ONE v0.1.0 — Wallet + Chat + Pay
**Date:** 2026-04-23
**Status:** L.5 — gaps documented, launch pending

---

## What Shipped

- 5-state passkey wallet (AES-256-GCM envelope encryption, Touch ID sign flow)
- SuiNS name resolution in Send page
- Scoped wallet Move module (spend caps, pause, revoke, spawn-child)
- Agent co-sign flow (pending approval queue, 5-min TTL, notifications)
- Multi-chain pay links (SUI/ETH/SOL/BTC/BASE/ARB/OPT)
- AI chat with resumable sessions (cursor, 1-hour reattach), ⌘K widget
- 5 rich-message types (PaymentCard, AgentCard, ListingCard, PreSignCard, HandoffCard)
- Sell surface (list capabilities, mint, share)
- Buy discovery (pheromone-weighted listing query)
- Build surface (form-based agent deploy → CF Worker)
- Push/email/webhook notification routing
- Peer agent lifecycle (boot, heartbeat, spawn-child, dead-man cascade)
- Legal pages (terms, privacy, cookie consent)
- Help surface with /chat handoff
- State-1 balance cap ($25 USD, oracle-priced, sponsor-enforced)
- Two-oracle consensus (Pyth + CoinGecko, 60s staleness, 2% deviation)
- AML address screening (local blocklist + optional Chainalysis)
- Reconciliation tick (on-chain vs TypeDB diff alerts)
- CSP hardened (nonce-based script-src)
- Error-copy CI lint (wallet.md §Error copy ↔ errors.ts)

---

## Velocity

- Agents spawned: ~150
- Tokens consumed: ~700k
- Elapsed: ~5 days

---

## What Went Well

- **Interface-first approach.** Specifying surfaces (wallet.md, chat.md, website.md) before implementation kept scope stable. Agent passes rarely needed to revisit goals — they had a fixed spec to anchor against.
- **Worktree isolation.** Each agent operated on its own file slice. Collisions were rare; most waves landed clean with no merge friction.
- **Lean mode for well-scoped work.** The majority of tasks fit the lean classifier (spec locked, variance known, exit scalar, files known). This eliminated recon overhead on roughly 80% of tasks and kept the cycle tight.
- **Deterministic sandwich holding.** Pre-flight checks (capability, toxicity, budget) dissolved bad signals before they consumed LLM budget. The `warn()` / `mark()` loop kept pheromone honest across 150 agents.

---

## What Was Hard

- **Vault cleanup required 3 agent passes.** The AES-256-GCM envelope encryption had a silent state corruption edge case in the migration path from State 1 → State 2. First two passes produced working code that failed under specific key-derivation sequences; the third pass added a deterministic test fixture (`fixtures/vault-v1.json`) that caught the regression.
- **CSP nonce complexity.** Replacing `unsafe-inline` with nonce-based `script-src` was straightforward for Astro SSR pages but broke Cloudflare Worker hydration scripts. Required a custom nonce-injection middleware and a dedicated CSP integration test before the lint gate passed.
- **Oracle consensus plumbing.** Wiring two oracles (Pyth + CoinGecko) with shared staleness + deviation logic produced tight coupling in the sponsor-build path. The 60s staleness window and 2% deviation cap needed a dedicated unit that didn't exist in the original plan — added mid-cycle as a deferred task.
- **Agent co-sign TTL race.** The 5-min TTL on pending approval queue entries was initially implemented as a polling loop. Replaced with a D1-backed expiry check triggered on each signal ingress — simpler, deterministic, no background timer leaks.

---

## Gaps at Close

- **I.3 / I.4 — Testnet integration not complete.** Move contract is deployed on testnet; wallet derivation and address verification pass. Full end-to-end sponsored tx (build → sign → execute → settle) has not been exercised with a real SUI transaction on testnet. Blocked on sponsor Worker wiring.
- **I.5 — VM test not run.** The integration test suite for the vault signer adapter (`src/components/u/lib/signer/`) has not been executed against a live testnet node. Marked as required before mainnet flip.
- **L.2 — Testnet → production flip pending 14-day green window.** Policy: no mainnet flip until testnet has run without reconciliation alert for 14 consecutive days. Clock starts on first real sponsored tx.
- **Error-copy lint is gated on CI only.** The drift check (wallet.md §Error copy ↔ errors.ts) passes locally but has not been wired into the GitHub Actions deploy workflow. Will fail silently until wired.

---

## Next Program Triggers

- First real sponsored tx on mainnet (unblocks L.2 timer)
- Product analytics first cohort (first 100 wallets, conversion through State 1 → State 2)
- SuiNS live usage (first successful name resolution on a user-initiated send)
