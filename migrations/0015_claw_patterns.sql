-- Per-claw configurable regex patterns stored in D1.
-- Checked before LLM call. Actions: reply (canned), tag (inject), block (deny).
CREATE TABLE IF NOT EXISTS claw_patterns (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,           -- human label: 'greeting', 'profanity-block'
  pattern     TEXT NOT NULL,           -- regex string: '^(hi|hello|hey)\b'
  action      TEXT NOT NULL DEFAULT 'tag', -- 'reply' | 'tag' | 'block'
  value       TEXT,                    -- action payload: canned reply text or tag name
  priority    INTEGER NOT NULL DEFAULT 100,
  hit_count   INTEGER NOT NULL DEFAULT 0,
  quality     REAL    NOT NULL DEFAULT 0.5,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_claw_patterns_active   ON claw_patterns(active, priority);
CREATE INDEX IF NOT EXISTS idx_claw_patterns_hit      ON claw_patterns(hit_count DESC);
