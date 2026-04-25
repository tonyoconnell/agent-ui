-- 0030_owner_audit.sql — owner-todo Gap 2
--
-- Owner-tier action audit log. Every code path with `auth.role === "owner"`
-- emits one row HERE (not in adl_audit) before the bypass short-circuits the
-- gate check in src/pages/api/signal.ts. Append-only — no UPDATE / DELETE.
--
-- Spec: owner.md §"File map" + §Gap 2. Drained from the in-memory ring
-- buffer in src/engine/adl-cache.ts via flushAuditBuffer().
--
-- Rollout flag: OWNER_AUDIT_MODE = audit | enforce
--   audit (default during rollout):
--     - emit failure does NOT block owner allow (defensive)
--     - log via console.warn[adl-audit]
--   enforce (post-rollout target):
--     - emit failure → 503 (do not let owner act unaudited)

CREATE TABLE IF NOT EXISTS owner_audit (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  ts                INTEGER NOT NULL DEFAULT (unixepoch()),
  action            TEXT NOT NULL,            -- owner-tier action e.g. "scope-bypass" / "network-bypass" / "sensitivity-bypass"
  sender            TEXT NOT NULL,            -- caller uid
  receiver          TEXT NOT NULL,            -- target receiver
  payload_hash      TEXT NOT NULL,            -- sha256 of original payload (hex)
  payload_redacted  TEXT NOT NULL,            -- JSON with secrets stripped (see src/lib/audit-redact.ts)
  gate              TEXT NOT NULL,            -- which gate the bypass crossed: scope | network | sensitivity
  decision          TEXT NOT NULL             -- always "owner-bypass-allow" for now (Gap 2); future may add deny
);

CREATE INDEX IF NOT EXISTS idx_owner_audit_ts ON owner_audit(ts);
CREATE INDEX IF NOT EXISTS idx_owner_audit_action ON owner_audit(action);
