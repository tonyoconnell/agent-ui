# Owner recovery runbook

> Manual procedures for owner-todo Gap 1 §1.t2 (BIP39 paper recovery) + §1.t3 (testnet cut+remint).
> These are NOT automated tests — they require physical hardware operations and on-chain destruction. Run only with intent.

---

## §1.t2 — BIP39 paper recovery

**Goal:** verify that the BIP39 paper backup written during `mac.md` setup successfully restores the owner identity on a fresh device, and that all existing agents continue to operate after recovery.

### Pre-conditions

- BIP39 mnemonic from initial passkey setup, written on the paper card stored per `mac.md` §"Recovery Key + paper backup"
- Fresh Mac (or fresh-profile Chrome on this Mac) with no IndexedDB state
- Network access to `one.ie` and TypeDB
- List of currently-spawned agents (run `bun --env-file=.env scripts/list-agents.ts` if it exists, or query TypeDB)

### Procedure

1. **Walk** to the paper card. Read the 24-word mnemonic.
2. **Open** a fresh browser profile. Navigate to `https://one.ie/u`.
3. **Click** "Restore from paper" (or whatever the recovery UX surfaces). Enter the mnemonic.
4. **Browser** derives the owner seed → derives the wallet address → enrolls a new passkey (PRF-wrapped under the same seed).
5. **Verify** the wallet address shown matches `OWNER_EXPECTED_ADDRESS` from `.env`. Should be `0x37cad…de3b`.
6. **Sign in** to `one.ie/u` with the new passkey. Owner-tier session should mint successfully.
7. **For each pre-existing agent in `agent_wallet`:** open `https://one.ie/u/agents/<uid>` (or the appropriate UI). The agent's address should remain unchanged (it's a property of the seed in D1, not of the owner). Verify by re-running `POST /api/agents/:uid/unlock` with the agent bearer — should still mint a token.

### Pass criteria

- Owner address matches `OWNER_EXPECTED_ADDRESS` ✓
- Owner-tier auth works on fresh device ✓
- All `agent_wallet` rows still mint unlock tokens for their bearers ✓
- BIP39 → owner PRF → agent KEK derivation chain reproducible (same agent KEK on fresh device produces same successful AES-GCM decrypt of the existing ciphertext) ✓

### Fail conditions + recovery

- **Mnemonic doesn't match address:** the paper was incorrectly transcribed. Compare to a second copy (the second paper backup mentioned in `mac.md` §"Recovery Key + paper backup"). If both fail: the owner identity is unrecoverable; substrate must re-bootstrap (Gap 0 from scratch — destructive, loses on-chain SubstrateOwner pin).
- **Agent unlock fails after recovery:** the new device's PRF doesn't reproduce the original KEK. This is a derivation bug; file under "PRF determinism regression" and do not proceed.

### Frequency

Run quarterly per `mac.md` §"Quarterly verification ritual". Document the date in this runbook's footer.

---

## §1.t3 — Testnet cut + re-mint

**Goal:** decommission existing testnet `ScopedWallet` Move objects and re-spawn each agent through the new `/api/agents/register` flow, populating `agent_wallet` with V2 ciphertext rows.

**Mainnet:** explicitly NOT in scope — this runbook applies to testnet only. Mainnet cutover is a separate plan with its own destructive-operation gates.

### Pre-conditions

- Owner Mac with `sui` CLI on testnet (`sui client active-env` returns `testnet`)
- Owner is signed in to `one.ie` with role `owner` (verified via `POST /api/auth/passkey/assert`)
- Backup of current `agent_wallet` D1 table: `wrangler d1 export <db> --output=agent_wallet-pre-cutover.sql`
- List of agents to migrate (TypeDB `match $u isa unit, has uid $uid; select $uid;`)

### Procedure

For each agent:

1. **Pause** the agent in `nanoclaw` (so it stops accepting new signals): set its env to `BOT_PAUSED=1` or stop the worker.
2. **Identify** the agent's existing on-chain `ScopedWallet` object id (TypeDB `unit.sui-object-id`).
3. **Generate** a new random 32-byte seed in the owner browser. Compute the new address.
4. **Wrap** the seed under `deriveAgentKEK(prf, uid)`.
5. **POST** to `/api/agents/register` with the wrapped payload. Save the returned bearer.
6. **Update** the worker's `AGENT_BEARER` and `AGENT_UID` secrets (e.g. `wrangler secret put AGENT_BEARER --name=<worker>`).
7. **Re-deploy** the worker (`wrangler deploy --name=<worker>`).
8. **Decommission** the old on-chain `ScopedWallet` — call `scoped_wallet::revoke<T>(old_w)` to freeze it. The on-chain event log is preserved (revoke does not delete history).
9. **Verify** the worker boots successfully via `loadAgentToken` (check worker logs for `[agent-boot] token loaded`).
10. **Resume** the worker (`BOT_PAUSED=0` or restart).

### Pass criteria

- Every agent's `agent_wallet` row is populated with V2 ciphertext (kdf_version = 1, address matches the freshly-generated seed) ✓
- All decommissioned `ScopedWallet` objects on testnet show `paused: true` (or `revoked: true`) ✓
- All workers boot successfully on next cold-start ✓
- `grep -r "SUI_SEED" /Users/toc/Server/one.ie/{nanoclaw,gateway,workers,.env}` returns nothing ✓ (already passing; sanity-check)

### Rollback

If any agent fails to boot post-cutover:

1. Restore the D1 backup: `wrangler d1 execute <db> --file=agent_wallet-pre-cutover.sql`
2. Roll worker secrets back to the pre-cutover bearer (kept in `~/.vault.age` per `secrets.md`)
3. Re-deploy the worker
4. Investigate the failure mode in isolation; do not proceed with remaining agents until root cause is found

### Frequency

One-time per environment. After this runs successfully on testnet, mainnet planning begins (separate runbook).

---

## Footer — completion log

| Date | Procedure | Operator | Pass/Fail | Notes |
|---|---|---|---|---|
| _(unrun)_ | §1.t2 BIP39 recovery | — | — | — |
| _(unrun)_ | §1.t3 testnet cut+remint | — | — | — |

Add a row each time the runbook is exercised.
