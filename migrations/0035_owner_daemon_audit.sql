--
-- 0035_owner_daemon_audit.sql
--
-- Append-only mirror of the owner-daemon's local JSONL audit log.
-- Each /unwrap call ships one row here for tamper-resistant cross-device storage.

CREATE TABLE IF NOT EXISTS owner_daemon_audit (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ts            INTEGER NOT NULL,                    -- daemon-local unix-second
  agent_uid     TEXT NOT NULL,
  kdf_version   INTEGER NOT NULL DEFAULT 1,
  outcome       TEXT NOT NULL,                       -- ok | session-locked | unwrap-failed | rate-limited
  caller_sig    TEXT NOT NULL,                       -- first 12 chars of X-Daemon-Sig
  received_at   INTEGER NOT NULL DEFAULT (unixepoch()),  -- server-side receive ts
  CHECK (outcome IN ('ok', 'session-locked', 'unwrap-failed', 'rate-limited', 'audit-write-failed'))
);

CREATE INDEX IF NOT EXISTS idx_owner_daemon_audit_ts ON owner_daemon_audit(ts);
CREATE INDEX IF NOT EXISTS idx_owner_daemon_audit_outcome ON owner_daemon_audit(outcome);
