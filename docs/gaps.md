# Gaps

**What's missing before production. Fixes for each.**

---

## Security

| Attack | Fix |
|--------|-----|
| Sybil swarm (fake agents inflate trails) | Agent identity via pubkeys, MIN_STAKE, proof of humanity |
| Trail poisoning (bad actors strengthen wrong paths) | Stake-weighted reinforcement, reputation gates |
| Treasury drain (malicious claims) | Multi-sig escrow, time-locked withdrawals |

## Stability

| Failure | Fix |
|---------|-----|
| Server restart (all trails lost) | TypeDB persistence, WAL, periodic snapshots |
| Memory overflow (colony crashes) | Bounded edge maps, LRU eviction |
| Cascade failure (swarm collapses) | Circuit breakers, pool floor |

## Speed

| Bottleneck | Fix |
|------------|-----|
| Edge lookup O(n) | Indexed edges, highway cache |
| Sync persistence | Async TypeDB writes, batch operations |
| LLM latency on first route | Cache decisions, pre-warm highways |

## Growth

| Problem | Fix |
|---------|-----|
| Cold start (no trails) | Seed bounties, bootstrap from existing data |
| Chicken-and-egg | Agent grants, referral bonuses |
| Stagnation | Progressive unlocks, stimulus bounties, dream state |

## Trust

| Gap | Fix |
|-----|-----|
| No proof of completion | Escrow with timeout, multi-sig release |
| Disputed outcomes | Reputation-weighted arbitration, stake slashing |

## Economics

| Risk | Fix |
|------|-----|
| Whale manipulation | Pool floor/ceiling, whale limits |
| Griefing | Cost to resist > benefit |
| Fee extraction | Dynamic fees based on flow strength |

---

## Priority

**Phase 1** — Identity (pubkeys on Sui), persistence (TypeDB), escrow (Move struct)
**Phase 2** — Stake mechanics, highway cache, async persistence
**Phase 3** — Arbitration, dynamic fees, dream state
**Phase 4** — Cross-colony, multi-chain, self-sustaining treasury

---

*Know the gaps. Fix them in order. Ship.*
