-- ONE Substrate — D1 Schema
-- Stable public identity key derived from the vault master.
--
-- user_id_pub = HKDF(master, info="user-id-v1", 256 bits) — same biometric →
-- same master → same user_id_pub on any device, forever. Server stores it as
-- a CACHE of identity, not a SOURCE OF TRUTH: if D1 forgets, the next Touch
-- ID re-derives the same user_id_pub, the existing vault_blob is still keyed
-- by it, and a self-heal endpoint re-inserts the credential row.
--
-- Recovery phrase becomes pure disaster-recovery, no longer a routine
-- fallback for "server forgot."
--
-- Scope: D1-managed tables only. Better Auth's `user` table lives in TypeDB
-- (see src/lib/typedb-auth-adapter.ts → entity `auth-user`), not D1, so it
-- is intentionally NOT touched here. The deterministic email path
-- (handleSlice + "@passkey.one.ie") in findOrCreateUserByPub provides the
-- same biometric→same user invariant via TypeDB's email lookup.
--
-- Spec: plans/one/passkey-recognition.md § 3 Track A

ALTER TABLE vault_blob          ADD COLUMN user_id_pub TEXT;
ALTER TABLE vault_passkey_hints ADD COLUMN user_id_pub TEXT;

CREATE INDEX IF NOT EXISTS idx_vault_blob_user_id_pub          ON vault_blob(user_id_pub);
CREATE INDEX IF NOT EXISTS idx_vault_passkey_hints_user_id_pub ON vault_passkey_hints(user_id_pub);
