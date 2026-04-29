-- Better Auth MCP plugin tables
--
-- Turns the auth server into an OAuth 2.0 provider for MCP clients
-- (Claude Desktop, Cursor, etc.). Clients register, get a clientId/secret,
-- then authenticate via the standard OAuth flow before accessing the
-- ONE substrate via @oneie/mcp.
--
-- Three tables mirror the plugin schema (all camelCase per kyselyAdapter):
--   oauthApplication  — registered MCP clients (clientId + secret)
--   oauthAccessToken  — issued access + refresh tokens
--   oauthConsent      — per-user consent grants per client

CREATE TABLE oauthApplication (
  id                TEXT    NOT NULL PRIMARY KEY,
  name              TEXT    NOT NULL,
  icon              TEXT,
  metadata          TEXT,
  clientId          TEXT    NOT NULL,
  clientSecret      TEXT,
  redirectUrls      TEXT    NOT NULL,
  type              TEXT    NOT NULL,
  disabled          INTEGER NOT NULL DEFAULT 0,
  userId            TEXT    REFERENCES "user"(id) ON DELETE CASCADE,
  createdAt         INTEGER NOT NULL,
  updatedAt         INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_app_client_id ON oauthApplication(clientId);
CREATE        INDEX IF NOT EXISTS oauth_app_user_id   ON oauthApplication(userId);

CREATE TABLE oauthAccessToken (
  id                      TEXT    NOT NULL PRIMARY KEY,
  accessToken             TEXT    NOT NULL,
  refreshToken            TEXT    NOT NULL,
  accessTokenExpiresAt    INTEGER NOT NULL,
  refreshTokenExpiresAt   INTEGER NOT NULL,
  clientId                TEXT    NOT NULL REFERENCES oauthApplication(clientId) ON DELETE CASCADE,
  userId                  TEXT    REFERENCES "user"(id) ON DELETE CASCADE,
  scopes                  TEXT    NOT NULL,
  createdAt               INTEGER NOT NULL,
  updatedAt               INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_token_access   ON oauthAccessToken(accessToken);
CREATE UNIQUE INDEX IF NOT EXISTS oauth_token_refresh  ON oauthAccessToken(refreshToken);
CREATE        INDEX IF NOT EXISTS oauth_token_client   ON oauthAccessToken(clientId);
CREATE        INDEX IF NOT EXISTS oauth_token_user     ON oauthAccessToken(userId);

CREATE TABLE oauthConsent (
  id           TEXT    NOT NULL PRIMARY KEY,
  clientId     TEXT    NOT NULL REFERENCES oauthApplication(clientId) ON DELETE CASCADE,
  userId       TEXT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  scopes       TEXT    NOT NULL,
  createdAt    INTEGER NOT NULL,
  updatedAt    INTEGER NOT NULL,
  consentGiven INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS oauth_consent_client ON oauthConsent(clientId);
CREATE INDEX IF NOT EXISTS oauth_consent_user   ON oauthConsent(userId);
