-- Fix Better Auth column names: camelCase not snake_case
--
-- Better Auth's kyselyAdapter uses JS field names as SQL column names directly.
-- Migration 0037 incorrectly used snake_case. Tables are empty (new), safe to
-- drop and recreate.

DROP TABLE IF EXISTS rate_limit;
DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS "user";

CREATE TABLE "user" (
  id            TEXT    NOT NULL PRIMARY KEY,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image         TEXT,
  createdAt     INTEGER NOT NULL,
  updatedAt     INTEGER NOT NULL,
  userIdPub     TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS user_email      ON "user"(email);
CREATE INDEX        IF NOT EXISTS user_id_pub_idx ON "user"(userIdPub);

CREATE TABLE session (
  id        TEXT    NOT NULL PRIMARY KEY,
  expiresAt INTEGER NOT NULL,
  token     TEXT    NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId    TEXT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS session_token   ON session(token);
CREATE INDEX        IF NOT EXISTS session_user_id ON session(userId);

CREATE TABLE account (
  id                     TEXT    NOT NULL PRIMARY KEY,
  accountId              TEXT    NOT NULL,
  providerId             TEXT    NOT NULL,
  userId                 TEXT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  accessToken            TEXT,
  refreshToken           TEXT,
  idToken                TEXT,
  accessTokenExpiresAt   INTEGER,
  refreshTokenExpiresAt  INTEGER,
  scope                  TEXT,
  password               TEXT,
  createdAt              INTEGER NOT NULL,
  updatedAt              INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS account_user_id ON account(userId);

CREATE TABLE verification (
  id         TEXT    NOT NULL PRIMARY KEY,
  identifier TEXT    NOT NULL,
  value      TEXT    NOT NULL,
  expiresAt  INTEGER NOT NULL,
  createdAt  INTEGER,
  updatedAt  INTEGER
);

CREATE INDEX IF NOT EXISTS verification_identifier ON verification(identifier);

CREATE TABLE rateLimit (
  id          TEXT    NOT NULL PRIMARY KEY,
  key         TEXT,
  count       INTEGER,
  lastRequest INTEGER
);

CREATE INDEX IF NOT EXISTS rate_limit_key ON rateLimit(key);
