-- 0024_drop_wallet_backups.sql
-- Drops the wallet_backups table created in 0021_wallet_backups.sql.
-- That table was a Firefox largeBlob fallback — no client code writes to it
-- since the passkey-cloud flow (vault_passkey_hints + vault_blob) replaced it.
-- See lifecycle-auth.md § "Code that must be deleted" for rationale.

DROP TABLE IF EXISTS wallet_backups;
