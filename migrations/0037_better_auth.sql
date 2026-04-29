-- Better Auth tables for D1
--
-- Moves Better Auth's auth database from TypeDB (100ms RTT via gateway) to D1
-- (<10ms local to the Worker). Fixes OAuth state_mismatch caused by TypeDB
-- write latency during the verification record round-trip.
--
-- Column naming: snake_case (Better Auth kyselyAdapter convention for SQLite).
-- Dates: INTEGER (Unix ms). Booleans: INTEGER (0/1).
-- Substrate data (units/paths/signals/hypotheses) stays in TypeDB.

CREATE TABLE IF NOT EXISTS user (
  id             TEXT    NOT NULL PRIMARY KEY,
  name           TEXT    NOT NULL,
  email          TEXT    NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image          TEXT,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  user_id_pub    TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS user_email      ON user(email);
CREATE INDEX        IF NOT EXISTS user_id_pub_idx ON user(user_id_pub);

CREATE TABLE IF NOT EXISTS session (
  id         TEXT    NOT NULL PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  token      TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id    TEXT    NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS session_token   ON session(token);
CREATE INDEX        IF NOT EXISTS session_user_id ON session(user_id);

CREATE TABLE IF NOT EXISTS account (
  id                       TEXT    NOT NULL PRIMARY KEY,
  account_id               TEXT    NOT NULL,
  provider_id              TEXT    NOT NULL,
  user_id                  TEXT    NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  access_token             TEXT,
  refresh_token            TEXT,
  id_token                 TEXT,
  access_token_expires_at  INTEGER,
  refresh_token_expires_at INTEGER,
  scope                    TEXT,
  password                 TEXT,
  created_at               INTEGER NOT NULL,
  updated_at               INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS account_user_id ON account(user_id);

CREATE TABLE IF NOT EXISTS verification (
  id         TEXT    NOT NULL PRIMARY KEY,
  identifier TEXT    NOT NULL,
  value      TEXT    NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS verification_identifier ON verification(identifier);

CREATE TABLE IF NOT EXISTS rate_limit (
  id           TEXT    NOT NULL PRIMARY KEY,
  key          TEXT,
  count        INTEGER,
  last_request INTEGER
);

CREATE INDEX IF NOT EXISTS rate_limit_key ON rate_limit(key);
