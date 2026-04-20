-- Migration: 0018_federations
-- Platform BaaS Cycle 4 — federation connections between ONE worlds.
--
-- Federation is runtime wiring (see src/engine/federation.ts): one world
-- registers another as a unit, forwards signals via HTTPS POST, and tracks
-- reliability via pheromone on the bridge path. This table records the
-- enduring metadata (url, api-key-id, status) outside TypeDB because it
-- is operational configuration, not ontology.

CREATE TABLE IF NOT EXISTS federations (
  id           TEXT PRIMARY KEY,           -- "fed_${keyId}_${ts36}"
  source_uid   TEXT NOT NULL,              -- caller's uid (the world initiating the bridge)
  target_url   TEXT NOT NULL,              -- HTTPS URL of the remote ONE instance
  target_world TEXT,                       -- optional named world gid (e.g. "world:legal")
  name         TEXT NOT NULL,              -- display label
  api_key_hint TEXT,                       -- non-secret hint (last 4 chars) for diagnostics
  status       TEXT NOT NULL DEFAULT 'active',  -- active | paused | revoked
  created_at   INTEGER NOT NULL            -- unixepoch() seconds
);

CREATE INDEX IF NOT EXISTS idx_federations_source ON federations(source_uid);
CREATE INDEX IF NOT EXISTS idx_federations_status ON federations(status) WHERE status = 'active';
