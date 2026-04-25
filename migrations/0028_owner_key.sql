-- 0028_owner_key.sql — owner-todo Gap 0
--
-- Substrate owner identity, locked at first-mint. The row count of this
-- table is the substrate's first-mint sentinel: empty = ready for first-mint,
-- non-empty = owner already registered (and locked on-chain in the
-- SubstrateOwner Move pin).
--
-- Schema is intentionally minimal for Gap 0. Gap 4 (`4.m1`) extends this
-- table with versioning columns (`version`, `expires_at`, `role`, `group_id`)
-- via `0032_owner_key_versions.sql`. Until then, the owner is identified by
-- the address column and the system is single-version.

CREATE TABLE IF NOT EXISTS owner_key (
  key_hash    TEXT PRIMARY KEY,                -- bcrypt hash of the owner bearer
  address     TEXT NOT NULL,                   -- Sui address that derived this key (matches OWNER_EXPECTED_ADDRESS)
  issued_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  pin_object  TEXT,                            -- on-chain SubstrateOwner shared object id
  pin_digest  TEXT                             -- tx digest of init_substrate_owner that locked the pin
);

CREATE INDEX IF NOT EXISTS idx_owner_key_address ON owner_key(address);
