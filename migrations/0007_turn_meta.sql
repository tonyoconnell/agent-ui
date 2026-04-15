-- Turn metadata — stores classification tags from the last user turn per group.
-- Used by chat:outcome to deposit pheromone on the correct actor→tag paths.
-- Each group_id has at most one row (INSERT OR REPLACE).
CREATE TABLE IF NOT EXISTS turn_meta (
  group_id TEXT    NOT NULL PRIMARY KEY,
  tags     TEXT    NOT NULL, -- comma-separated tag list, e.g. "code,typescript,question"
  ts       INTEGER NOT NULL
);
