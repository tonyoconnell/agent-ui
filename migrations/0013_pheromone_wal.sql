-- Cycle 1: D1 Write-Ahead Log for pheromone
-- Captures all mark/warn operations with 500ms windowing
-- Enables statistical testing (L6 knowledge reflexes)
-- Synced to TypeDB hourly (L4 economic loop tracks strength/resistance)

CREATE TABLE IF NOT EXISTS marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edge TEXT NOT NULL,                    -- "a→b" path
  delta_s INTEGER NOT NULL DEFAULT 0,    -- strength change (mark adds, warn subtracts)
  delta_r INTEGER NOT NULL DEFAULT 0,    -- resistance change (warn adds)
  count INTEGER NOT NULL DEFAULT 1,      -- how many mark/warn calls in this window
  window INTEGER NOT NULL,               -- floor(ts / 500) for 500ms resolution
  synced INTEGER NOT NULL DEFAULT 0,     -- 1 = synced to TypeDB, safe to delete after 7d
  ts TEXT NOT NULL                       -- ISO timestamp for retention queries
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_marks_synced ON marks(synced, window);
CREATE INDEX IF NOT EXISTS idx_marks_edge ON marks(edge, window);
CREATE INDEX IF NOT EXISTS idx_marks_ts ON marks(ts);
