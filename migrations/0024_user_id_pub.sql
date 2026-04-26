-- ONE Substrate — D1 Schema
-- Stable public identity key derived from the vault master.
--
-- user_id_pub = SHA-256("user-id-v1" || master) — same biometric → same
-- master → same user_id_pub on any device, forever. Server stores it as a
-- CACHE of identity, not a SOURCE OF TRUTH: if D1 forgets, the next Touch
-- ID re-derives the same user_id_pub, the existing vault_blob is still
-- keyed by it, and a self-heal endpoint re-inserts the credential row.
--
-- Replaces server-random user_id as the join key across user, vault_blob,
-- and vault_passkey_hints. Recovery phrase becomes pure disaster-recovery,
-- no longer a routine fallback for "server forgot."
--
-- Spec: plans/one/passkey-recognition.md § 3 Track A
-- Indexes are nullable+non-unique during the rollout; uniqueness is
-- enforced at the application layer until backfill completes.

ALTER TABLE user                ADD COLUMN user_id_pub TEXT;
ALTER TABLE vault_blob          ADD COLUMN user_id_pub TEXT;
ALTER TABLE vault_passkey_hints ADD COLUMN user_id_pub TEXT;

CREATE INDEX IF NOT EXISTS idx_user_user_id_pub                ON user(user_id_pub);
CREATE INDEX IF NOT EXISTS idx_vault_blob_user_id_pub          ON vault_blob(user_id_pub);
CREATE INDEX IF NOT EXISTS idx_vault_passkey_hints_user_id_pub ON vault_passkey_hints(user_id_pub);
