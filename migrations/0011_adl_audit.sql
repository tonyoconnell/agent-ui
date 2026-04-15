-- ADL audit sink for Cycle 1.5 enforcement-mode rollout.
-- Populated by engine/adl-cache.ts audit() when ADL_ENFORCEMENT_MODE=audit
-- or when a gate fires a fail-closed decision. Queryable from
-- GET /api/adl/denials (Cycle 3 surface).
--
-- Engine modules (bridge, llm, api, persist) cannot bind D1 directly, so
-- audit() pushes to an in-memory ring buffer which Astro routes drain via
-- flushAuditBuffer(db). First flusher is /api/signal (every request);
-- /api/adl/denials flushes at read time too so queries see fresh data.

CREATE TABLE IF NOT EXISTS adl_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  sender TEXT NOT NULL,
  receiver TEXT NOT NULL,
  gate TEXT NOT NULL,              -- lifecycle | network | sensitivity | schema | bridge-network | bridge-error
  decision TEXT NOT NULL,          -- deny | allow-audit | fail-closed | observe
  mode TEXT NOT NULL,              -- audit | enforce
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_adl_audit_ts ON adl_audit(ts);
CREATE INDEX IF NOT EXISTS idx_adl_audit_receiver ON adl_audit(receiver);
CREATE INDEX IF NOT EXISTS idx_adl_audit_gate_decision ON adl_audit(gate, decision);
