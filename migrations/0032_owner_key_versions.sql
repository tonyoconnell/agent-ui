-- 0032_owner_key_versions.sql — owner-todo Gap 4
--
-- Extend owner_key (created in 0028) with the versioning + rotation columns
-- the spec calls for. Lifecycle:
--   issue       → row inserted with version N, expires_at = NULL (active)
--   rotate      → new row with version N+1; both work for cutover window
--   force-revoke → expires_at = unixepoch() (auth middleware rejects on next call)
--   age out     → background job sets expires_at to unixepoch() at end of cadence
--
-- Cadence policy (see one.ie/docs/key-rotation.md):
--   owner    — voluntary; immediate on suspected compromise
--   chairman+ — scheduled 90-day rotation
--
-- Migration is additive; existing rows backfilled with version=1, role='owner'.

ALTER TABLE owner_key ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE owner_key ADD COLUMN expires_at INTEGER;
ALTER TABLE owner_key ADD COLUMN role TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE owner_key ADD COLUMN group_id TEXT;

CREATE INDEX IF NOT EXISTS idx_owner_key_version ON owner_key(version);
CREATE INDEX IF NOT EXISTS idx_owner_key_expires ON owner_key(expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_owner_key_role_group ON owner_key(role, group_id);
