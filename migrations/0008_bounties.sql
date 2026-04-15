-- Bounty state for marketplace Cycle 2: PROVE
-- Stores the link between substrate edge + Sui escrow object + rubric thresholds
-- Status: locked → delivered → released | refunded

CREATE TABLE IF NOT EXISTS bounties (
  id           TEXT    PRIMARY KEY,
  edge         TEXT    NOT NULL,
  skill_id     TEXT    NOT NULL,
  seller_uid   TEXT    NOT NULL,
  poster_uid   TEXT    NOT NULL,
  price        REAL    NOT NULL,
  rubric_json  TEXT    NOT NULL DEFAULT '{}',
  deadline     INTEGER NOT NULL,
  escrow_object_id TEXT,
  status       TEXT    NOT NULL DEFAULT 'locked',
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS bounties_edge   ON bounties(edge);
CREATE INDEX IF NOT EXISTS bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS bounties_seller ON bounties(seller_uid);
