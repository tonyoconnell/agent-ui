-- 0033_chairman_multisig.sql — owner-todo Gap 3
--
-- Per-group threshold + member-credential storage for tenant chairman
-- multisig. Single row per group; updates replace the whole config.
--
-- Lifecycle:
--   configure:    chairman calls POST /api/groups/:gid/multisig with
--                 {n, m, members: [{uid, credId}]} → INSERT or UPDATE
--   action:       owner-bypass action against this group requires N
--                 verified WebAuthn assertions from distinct members
--                 in member_credentials (within 5-min window)
--   recovery:     other members threshold-vote to swap a credId in
--                 member_credentials JSON (replaces compromised key)
--
-- Spec: compliance.md §W2 decisions (locked); docs/recon-multisig.md
-- §Field decisions (autonomous; user can ratify on wake).

CREATE TABLE IF NOT EXISTS chairman_multisig (
  group_id           TEXT PRIMARY KEY,
  threshold_n        INTEGER NOT NULL,                            -- e.g. 3
  threshold_m        INTEGER NOT NULL,                            -- e.g. 5
  member_credentials TEXT NOT NULL,                               -- JSON: [{uid, credId, addedAt}]
  configured_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  configured_by      TEXT NOT NULL,                               -- chairman uid that posted the config
  CHECK (threshold_n > 0),
  CHECK (threshold_m >= threshold_n),
  CHECK (threshold_m <= 50)                                      -- arbitrary upper bound; enterprise won't realistically need more
);

CREATE INDEX IF NOT EXISTS idx_chairman_multisig_configured_at ON chairman_multisig(configured_at);
