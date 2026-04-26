/**
 * Better Auth Plugin: Passkey (WebAuthn) Authentication with PRF
 *
 * One passkey, two jobs:
 *   1. Server session: WebAuthn assertion verified with @simplewebauthn/server
 *      → Better Auth session minted via `ctx.context.internalAdapter.createSession`.
 *   2. Vault unlock: the same credential's PRF extension (HMAC-secret) is used
 *      client-side to unwrap an AES-GCM envelope around the vault master.
 *
 * Flow (sign-in from a fresh browser):
 *   1. Client POSTs `/passkey-webauthn/authenticate/options`
 *      → `{ challenge, rpId, prfSalt }` (HMAC-signed challenge, stateless).
 *   2. Client calls `navigator.credentials.get({publicKey, extensions:{prf:{eval:{first:prfSalt}}}})`
 *      with `allowCredentials: []` (discoverable credential) → browser picker.
 *   3. Client POSTs `/passkey-webauthn/authenticate` with the raw assertion.
 *   4. Server looks up cred_id in D1 → verifies signature + counter →
 *      mints Better Auth session → returns `{ wrappedMaster }`.
 *   5. Client unwraps master with the PRF secret it already has (from step 2),
 *      fetches `/api/vault/fetch`, decrypts, seeds IndexedDB. Done.
 *
 * Registration flow (while signed in, adding a passkey to the account):
 *   1. Client POSTs `/passkey-webauthn/register/options` → creation options.
 *   2. Client creates the credential with PRF enabled, runs a second get()
 *      with the same PRF salt to capture the PRF secret, wraps the vault
 *      master with it, and POSTs the attestation + wrappedMaster.
 *   3. Server verifies, stores `{cred_id, pub_key, sign_count, wrapped_master}`
 *      in D1. Client mirrors the enrollment into the local IndexedDB vault.
 */

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import type { BetterAuthPlugin } from 'better-auth'
import { APIError, createAuthEndpoint } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import { z } from 'zod'
import { getD1 } from '../cf-env'
import { ensureHumanUnit } from '../human-unit'

// ─── helpers ────────────────────────────────────────────────────────────────

const CHALLENGE_TTL_MS = 5 * 60 * 1000 // 5 min

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return b64url(new Uint8Array(sig))
}

/** Stateless challenge: base64(payload).hmac, payload = {c,e,k} where k is purpose tag. */
async function issueChallenge(secret: string, purpose: 'register' | 'authenticate'): Promise<string> {
  const challengeBytes = crypto.getRandomValues(new Uint8Array(32))
  const payload = JSON.stringify({ c: b64url(challengeBytes), e: Date.now() + CHALLENGE_TTL_MS, k: purpose })
  const payloadB64 = b64url(new TextEncoder().encode(payload))
  const sig = await hmac(secret, payloadB64)
  return `${payloadB64}.${sig}`
}

async function verifyChallenge(
  token: string,
  secret: string,
  purpose: 'register' | 'authenticate',
): Promise<{ challenge: string }> {
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) throw new APIError('BAD_REQUEST', { message: 'Malformed challenge' })
  const expected = await hmac(secret, payloadB64)
  if (expected !== sig) throw new APIError('UNAUTHORIZED', { message: 'Challenge signature invalid' })
  let payload: { c: string; e: number; k: string }
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)))
  } catch {
    throw new APIError('BAD_REQUEST', { message: 'Challenge payload invalid' })
  }
  if (payload.k !== purpose) throw new APIError('UNAUTHORIZED', { message: 'Challenge purpose mismatch' })
  if (payload.e < Date.now()) throw new APIError('UNAUTHORIZED', { message: 'Challenge expired' })
  // The authenticator signed the value we put into `options.challenge`, which
  // was `payloadB64` (the JSON-wrapped envelope, not the inner `c`). That's
  // what SWA's `expectedChallenge` must match.
  return { challenge: payloadB64 }
}

/** Global PRF salt — identical for every vault. The PRF output depends on the
 *  credential's private secret too, so a shared salt does not weaken isolation.
 *  Keeping it global makes sign-in from a fresh browser possible because the
 *  client doesn't need to know the salt per-credential up front. */
async function globalPrfSalt(): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('one.ie/vault/prf/v1'))
  return new Uint8Array(digest)
}

/** Browsers send the bare origin (scheme + host + port) as `clientDataJSON.origin`.
 *  Better Auth's `baseURL` includes the `/api/auth` path, which breaks the
 *  strict equality check in @simplewebauthn/server. Strip to origin only. */
function originFromContext(ctx: { context: { baseURL: string }; request?: Request }): string {
  // Prefer the live request URL — it reflects the actual origin the browser is on.
  // baseURL is a build-time constant and may differ from the runtime domain.
  try {
    return new URL(ctx.request?.url ?? ctx.context.baseURL).origin
  } catch {
    return 'http://localhost'
  }
}

// ─── hint storage (D1 only — file fallback removed by passkey-recognition Track D) ──

interface HintRow {
  user_id: string
  pub_key: string
  sign_count: number
  wrapped_master?: string | null
  label?: string | null
  user_id_pub?: string | null
}

/** D1 row type that includes user_id_pub (column added by migration 0024).
 *  Local cast so tsc doesn't complain about the extra column. */
type HintRowWithPub = HintRow & { user_id_pub: string | null }

async function upsertHint(
  db: D1Database | null,
  credId: string,
  row: HintRow,
): Promise<{ ok: true } | { ok: false; err: string; status?: number }> {
  // D1 is mandatory. No file fallback. 503 means "server can't check" —
  // distinct from 401 ("credential unknown").
  if (!db) {
    return { ok: false, err: 'D1 not available on server', status: 503 }
  }
  try {
    await db
      .prepare(
        `INSERT INTO vault_passkey_hints
           (cred_id, user_id, pub_key, sign_count, wrapped_master, label, user_id_pub, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
         ON CONFLICT(cred_id) DO UPDATE SET
           user_id        = excluded.user_id,
           pub_key        = excluded.pub_key,
           sign_count     = excluded.sign_count,
           wrapped_master = excluded.wrapped_master,
           label          = excluded.label,
           user_id_pub    = excluded.user_id_pub,
           updated_at     = unixepoch()`,
      )
      .bind(
        credId,
        row.user_id,
        row.pub_key,
        row.sign_count,
        row.wrapped_master ?? null,
        row.label ?? null,
        row.user_id_pub ?? null,
      )
      .run()
    return { ok: true }
  } catch (e) {
    const msg = (e as Error).message ?? String(e)
    if (msg.includes('no such table')) {
      return {
        ok: false,
        err: 'vault_passkey_hints table missing — apply migration 0023_vault_passkey_hints.sql',
        status: 503,
      }
    }
    if (msg.includes('no such column') && msg.includes('user_id_pub')) {
      return {
        ok: false,
        err: 'user_id_pub column missing — apply migration 0024_user_id_pub.sql',
        status: 503,
      }
    }
    return { ok: false, err: `D1 write failed: ${msg}`, status: 503 }
  }
}

async function findHint(
  db: D1Database | null,
  credId: string,
): Promise<{ hint: HintRowWithPub | null } | { err: string; status?: number }> {
  if (!db) return { err: 'D1 not available on server', status: 503 }
  try {
    const row = await db
      .prepare(
        `SELECT user_id, pub_key, sign_count, wrapped_master, user_id_pub
           FROM vault_passkey_hints WHERE cred_id = ? LIMIT 1`,
      )
      .bind(credId)
      .first<HintRowWithPub>()
    return { hint: row ?? null }
  } catch (e) {
    const msg = (e as Error).message ?? String(e)
    if (msg.includes('no such table')) {
      return {
        err: 'vault_passkey_hints table missing — apply migration 0023_vault_passkey_hints.sql',
        status: 503,
      }
    }
    if (msg.includes('no such column') && msg.includes('user_id_pub')) {
      return {
        err: 'user_id_pub column missing — apply migration 0024_user_id_pub.sql',
        status: 503,
      }
    }
    return { err: `D1 read failed: ${msg}`, status: 503 }
  }
}

async function bumpSignCount(db: D1Database | null, credId: string, newCounter: number): Promise<void> {
  if (!db) return
  try {
    await db
      .prepare(`UPDATE vault_passkey_hints SET sign_count = ?, updated_at = unixepoch() WHERE cred_id = ?`)
      .bind(newCounter, credId)
      .run()
  } catch {
    // best-effort
  }
}

/** Find or create a Better Auth user keyed by `user_id_pub` (the stable
 *  client-derived identity = SHA256("user-id-v1" || master)). Same biometric
 *  → same master → same user_id_pub → same user, on any device, forever.
 *
 *  Lookup order:
 *    1. SELECT user WHERE user_id_pub = ?  (the deterministic key)
 *    2. createUser, then UPDATE user SET user_id_pub = ?
 *
 *  Email is still required by Better Auth but no longer the identity key.
 *  We synthesize it from the first 16 chars of user_id_pub. */
async function findOrCreateUserByPub(
  ctx: {
    context: {
      internalAdapter: {
        createUser: (...args: never[]) => unknown
        findUserByEmail: (...args: never[]) => unknown
      }
    }
  },
  user_id_pub: string,
  db: D1Database | null,
): Promise<{ id: string; email: string | null; name: string | null }> {
  // Step 1: deterministic lookup by user_id_pub
  if (db) {
    try {
      const existing = await db
        .prepare(`SELECT id, email, name FROM user WHERE user_id_pub = ? LIMIT 1`)
        .bind(user_id_pub)
        .first<{ id: string; email: string | null; name: string | null }>()
      if (existing) return existing
    } catch (e) {
      // Column may be missing on old D1 — fall through to create path.
      const msg = (e as Error).message ?? String(e)
      if (!msg.includes('no such column')) {
        console.warn('[passkey-webauthn] user_id_pub lookup failed:', msg)
      }
    }
  }

  // Step 2: create new user, then back-fill user_id_pub
  const handleSlice = user_id_pub.slice(0, 16)
  const email = `${handleSlice}@passkey.one.ie`
  const displayName = `Passkey ${handleSlice.slice(0, 8)}`
  let user: { id: string; email: string | null; name: string | null }
  try {
    user = (await ctx.context.internalAdapter.createUser({
      email,
      name: displayName,
      emailVerified: false,
    })) as { id: string; email: string | null; name: string | null }
  } catch {
    const existing = (await ctx.context.internalAdapter.findUserByEmail(email).catch(() => null)) as {
      user?: { id: string; email: string | null; name: string | null }
    } | null
    if (!existing?.user) throw new Error('could not create or find user for this passkey')
    user = existing.user
  }

  // Back-fill user_id_pub so future lookups hit step 1.
  if (db) {
    try {
      await db
        .prepare(`UPDATE user SET user_id_pub = ? WHERE id = ? AND (user_id_pub IS NULL OR user_id_pub = '')`)
        .bind(user_id_pub, user.id)
        .run()
    } catch (e) {
      console.warn('[passkey-webauthn] failed to back-fill user_id_pub:', (e as Error).message)
    }
  }

  return user
}

// ─── plugin ─────────────────────────────────────────────────────────────────

export interface PasskeyWebauthnOptions {
  /** HMAC secret used to sign ephemeral WebAuthn challenges. */
  challengeSecret: string
  /** Human-readable Relying Party name shown by the authenticator. */
  rpName?: string
  /** Relying Party id (defaults to the request origin's hostname). */
  rpID?: string
  /** Origin(s) accepted during attestation/assertion verification. */
  expectedOrigins?: string[]
}

export const passkeyWebauthn = (opts: PasskeyWebauthnOptions): BetterAuthPlugin => ({
  id: 'passkey-webauthn',

  endpoints: {
    // ── REGISTER: options ──────────────────────────────────────────────────
    passkeyRegisterOptions: createAuthEndpoint(
      '/passkey-webauthn/register/options',
      {
        method: 'POST',
        body: z.object({}).optional(),
      },
      async (ctx) => {
        try {
          const session = await ctx.context.internalAdapter
            .findSession(ctx.request?.headers.get('cookie') ?? '')
            .catch(() => null)
          if (!session?.user?.id) {
            throw new APIError('UNAUTHORIZED', { message: 'Sign in to register a passkey' })
          }

          let rpID = opts.rpID
          if (!rpID) {
            // Prefer the live request URL — it reflects the actual domain the
            // browser is on (dev.one.ie, localhost, etc.). baseURL is a
            // build-time constant (PUBLIC_SITE_URL) and may not match the
            // domain the user is accessing when the build is reused across envs.
            try {
              rpID = new URL(ctx.request?.url ?? ctx.context.baseURL).hostname
            } catch {
              rpID = 'localhost'
            }
          }
          const rpName = opts.rpName ?? 'ONE'
          if (!opts.challengeSecret) {
            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'PASSKEY_CHALLENGE_SECRET not configured',
            })
          }

          // PRF stays out of the library extensions (same reason as in
          // authenticate/options) — the client rebuilds it from `prfSalt`.
          const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userName: session.user.email ?? session.user.id,
            userID: new TextEncoder().encode(session.user.id),
            userDisplayName: session.user.name ?? session.user.email ?? 'ONE user',
            attestationType: 'none',
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              residentKey: 'preferred',
              userVerification: 'required',
            },
            supportedAlgorithmIDs: [-7, -257],
          })

          const signedChallenge = await issueChallenge(opts.challengeSecret, 'register')
          const [payloadB64] = signedChallenge.split('.')
          options.challenge = payloadB64 as typeof options.challenge

          return ctx.json({ options, challengeToken: signedChallenge, prfSalt: b64url(await globalPrfSalt()) })
        } catch (e) {
          if (e instanceof APIError) throw e
          console.error('[passkey-webauthn] register/options failed', e)
          throw new APIError('INTERNAL_SERVER_ERROR', {
            message: `register/options: ${(e as Error)?.message ?? String(e)}`,
          })
        }
      },
    ),

    // ── REGISTER: verify ───────────────────────────────────────────────────
    passkeyRegister: createAuthEndpoint(
      '/passkey-webauthn/register',
      {
        method: 'POST',
        body: z.object({
          challengeToken: z.string(),
          response: z.record(z.string(), z.unknown()),
          wrappedMaster: z.string().optional(),
          label: z.string().max(64).optional(),
        }),
      },
      async (ctx) => {
        const session = await ctx.context.internalAdapter
          .findSession(ctx.request?.headers.get('cookie') ?? '')
          .catch(() => null)
        if (!session?.user?.id) {
          throw new APIError('UNAUTHORIZED', { message: 'Sign in to register a passkey' })
        }

        const { challenge } = await verifyChallenge(ctx.body.challengeToken, opts.challengeSecret, 'register')

        const rpID = opts.rpID ?? new URL(ctx.request?.url ?? ctx.context.baseURL).hostname
        const expectedOrigins = opts.expectedOrigins ?? [originFromContext(ctx)]

        let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>
        try {
          verification = await verifyRegistrationResponse({
            response: ctx.body.response as any,
            expectedChallenge: challenge,
            expectedOrigin: expectedOrigins,
            expectedRPID: rpID,
            requireUserVerification: true,
          })
        } catch (e) {
          throw new APIError('UNAUTHORIZED', { message: `Attestation invalid: ${(e as Error).message}` })
        }
        if (!verification.verified || !verification.registrationInfo) {
          throw new APIError('UNAUTHORIZED', { message: 'Attestation did not verify' })
        }

        const info = verification.registrationInfo
        const credId = info.credential.id
        const pubKey = b64url(new Uint8Array(info.credential.publicKey))
        const signCount = info.credential.counter

        const db = await getD1(undefined)
        const result = await upsertHint(db, credId, {
          user_id: session.user.id,
          pub_key: pubKey,
          sign_count: signCount,
          wrapped_master: null,
          label: ctx.body.label ?? null,
        })
        if (!result.ok) {
          throw new APIError('INTERNAL_SERVER_ERROR', { message: result.err })
        }

        return ctx.json({ ok: true, credId })
      },
    ),

    // ── REGISTER-ANONYMOUS: options ────────────────────────────────────────
    // No Better Auth session required. The client now derives a deterministic
    // `user_id_pub = SHA256("user-id-v1" || master)` from the vault master and
    // sends it here. Same biometric → same master → same user_id_pub → same
    // user, on any device. `deviceHandle` is kept as a transition-period
    // fallback for older clients; once Track E (passkey-cloud.ts) ships, all
    // clients send `user_id_pub`.
    passkeyRegisterAnonymousOptions: createAuthEndpoint(
      '/passkey-webauthn/register-anonymous/options',
      {
        method: 'POST',
        body: z
          .object({
            user_id_pub: z.string().min(40).max(64).optional(),
            deviceHandle: z.string().optional(),
          })
          .optional(),
      },
      async (ctx) => {
        try {
          let rpID = opts.rpID
          if (!rpID) {
            // Prefer the live request URL — it reflects the actual domain the
            // browser is on (dev.one.ie, localhost, etc.). baseURL is a
            // build-time constant (PUBLIC_SITE_URL) and may not match the
            // domain the user is accessing when the build is reused across envs.
            try {
              rpID = new URL(ctx.request?.url ?? ctx.context.baseURL).hostname
            } catch {
              rpID = 'localhost'
            }
          }
          const rpName = opts.rpName ?? 'ONE'
          if (!opts.challengeSecret) {
            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'PASSKEY_CHALLENGE_SECRET not configured',
            })
          }

          // Identity key precedence:
          //   1. user_id_pub (deterministic from biometric — preferred)
          //   2. deviceHandle (legacy clients during rollout)
          //   3. random handle (very old clients only)
          const user_id_pub = ctx.body?.user_id_pub
          const userHandle = user_id_pub ?? ctx.body?.deviceHandle ?? b64url(crypto.getRandomValues(new Uint8Array(16)))

          // WebAuthn `userID`: when we have a user_id_pub (b64url 32 bytes),
          // use the raw decoded bytes — that's the canonical handle for
          // authenticator-side credential replacement. Otherwise fall back to
          // encoding the legacy handle string.
          const userIdBytes = user_id_pub ? b64urlDecode(user_id_pub) : new TextEncoder().encode(userHandle)

          // Server-side excludeCredentials (Gap 6): look up every cred_id
          // already registered for this user_id_pub so the authenticator
          // doesn't accidentally mint a duplicate credential when iCloud
          // Keychain has already synced one across devices.
          const excludeCredentials: Array<{ id: string; type: 'public-key' }> = []
          if (user_id_pub) {
            const db = await getD1(undefined)
            if (db) {
              try {
                const rows = await db
                  .prepare(`SELECT cred_id FROM vault_passkey_hints WHERE user_id_pub = ?`)
                  .bind(user_id_pub)
                  .all<{ cred_id: string }>()
                for (const r of rows.results ?? []) {
                  excludeCredentials.push({ id: r.cred_id, type: 'public-key' })
                }
              } catch (e) {
                // Non-fatal: if the column is missing or D1 is flaky, the
                // worst case is a duplicate cred row, which heal handles.
                console.warn('[passkey-webauthn] excludeCredentials lookup skipped:', (e as Error).message)
              }
            }
          }

          // `userName` is what Apple Passwords / Chrome Passkey Manager show
          // as the headline label. Keep it friendly; the unique identity lives
          // in `userID` (bytes). `userDisplayName` is the subtitle.
          const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userName: 'ONE',
            userID: userIdBytes,
            userDisplayName: 'ONE account',
            attestationType: 'none',
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              residentKey: 'preferred',
              userVerification: 'required',
            },
            supportedAlgorithmIDs: [-7, -257],
            excludeCredentials,
          })

          const signedChallenge = await issueChallenge(opts.challengeSecret, 'register')
          const [payloadB64] = signedChallenge.split('.')
          options.challenge = payloadB64 as typeof options.challenge

          return ctx.json({
            options,
            challengeToken: signedChallenge,
            prfSalt: b64url(await globalPrfSalt()),
            userHandle,
          })
        } catch (e) {
          if (e instanceof APIError) throw e
          console.error('[passkey-webauthn] register-anonymous/options failed', e)
          throw new APIError('INTERNAL_SERVER_ERROR', {
            message: `register-anonymous/options: ${(e as Error)?.message ?? String(e)}`,
          })
        }
      },
    ),

    // ── REGISTER-ANONYMOUS: verify + mint user + session ───────────────────
    passkeyRegisterAnonymous: createAuthEndpoint(
      '/passkey-webauthn/register-anonymous',
      {
        method: 'POST',
        body: z.object({
          challengeToken: z.string(),
          response: z.record(z.string(), z.unknown()),
          // user_id_pub is the deterministic identity key derived from the
          // vault master (SHA256("user-id-v1" || master)). Same biometric →
          // same master → same user_id_pub on every device, forever.
          user_id_pub: z.string().min(40).max(64),
          // userHandle kept optional for backward compat with legacy clients
          // that haven't yet been updated to send user_id_pub.
          userHandle: z.string().optional(),
          label: z.string().max(64).optional(),
        }),
      },
      async (ctx) => {
        const err = (status: number, message: string): Response =>
          new Response(JSON.stringify({ error: message }), {
            status,
            headers: { 'Content-Type': 'application/json' },
          })

        try {
          const { challenge } = await verifyChallenge(ctx.body.challengeToken, opts.challengeSecret, 'register')

          let rpID = opts.rpID
          if (!rpID) {
            // Prefer the live request URL — it reflects the actual domain the
            // browser is on (dev.one.ie, localhost, etc.). baseURL is a
            // build-time constant (PUBLIC_SITE_URL) and may not match the
            // domain the user is accessing when the build is reused across envs.
            try {
              rpID = new URL(ctx.request?.url ?? ctx.context.baseURL).hostname
            } catch {
              rpID = 'localhost'
            }
          }
          const expectedOrigins = opts.expectedOrigins ?? [originFromContext(ctx)]

          let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>
          try {
            verification = await verifyRegistrationResponse({
              response: ctx.body.response as Parameters<typeof verifyRegistrationResponse>[0]['response'],
              expectedChallenge: challenge,
              expectedOrigin: expectedOrigins,
              expectedRPID: rpID,
              requireUserVerification: true,
            })
          } catch (e) {
            return err(401, `Attestation invalid: ${(e as Error).message}`)
          }
          if (!verification.verified || !verification.registrationInfo) {
            return err(401, 'Attestation did not verify')
          }

          const info = verification.registrationInfo
          const credId = info.credential.id
          const pubKey = b64url(new Uint8Array(info.credential.publicKey))
          const signCount = info.credential.counter

          const db = await getD1(undefined)

          // If this exact credential was registered before (browser data was
          // cleared but passkey survived in iCloud Keychain / Apple Passwords),
          // reuse the existing account — same cred_id = same user = same
          // cloud-synced vault. This is the cleared-browser-data recovery path.
          const existingHint = await findHint(db, credId)
          let user: { id: string; email: string | null; name: string | null }
          if ('hint' in existingHint && existingHint.hint) {
            const existingUser = await ctx.context.internalAdapter
              .findUserById(existingHint.hint.user_id)
              .catch(() => null)
            if (existingUser) {
              user = existingUser
            } else {
              // hint exists but user was deleted — fall through to create
              user = await findOrCreateUserByPub(ctx, ctx.body.user_id_pub, db)
            }
          } else {
            // Find or create a Better Auth user keyed by user_id_pub. Same
            // biometric → same master → same user_id_pub → same user, on any
            // device. The server is a CACHE of identity, not the source of truth.
            user = await findOrCreateUserByPub(ctx, ctx.body.user_id_pub, db)
          }

          const upsert = await upsertHint(db, credId, {
            user_id: user.id,
            pub_key: pubKey,
            sign_count: signCount,
            wrapped_master: null,
            label: ctx.body.label ?? null,
            user_id_pub: ctx.body.user_id_pub,
          })
          if (!upsert.ok) return err(500, upsert.err)

          const session = await ctx.context.internalAdapter.createSession(user.id, ctx.request)
          await setSessionCookie(ctx, { session, user })

          // Governance integration (lifecycle.md § 2): every new human gets a
          // TypeDB `unit(unit-kind="human")` + personal group + chairman
          // membership so they can own agents. Fire-and-forget — a TypeDB
          // blip shouldn't block sign-in.
          ensureHumanUnit(user.id, {
            id: user.id,
            email: user.email ?? null,
            name: user.name ?? null,
          }).catch((e) => console.error('[passkey-webauthn] ensureHumanUnit failed', e))

          return ctx.json({
            ok: true,
            credId,
            user: { id: user.id, email: user.email, name: user.name },
            session: { token: session.token, expiresAt: session.expiresAt },
          })
        } catch (e) {
          console.error('[passkey-webauthn] register-anonymous failed', e)
          return err(500, `register-anonymous: ${(e as Error)?.message ?? String(e)}`)
        }
      },
    ),

    // ── HEAL: options ──────────────────────────────────────────────────────
    // Self-heal path. The local vault is intact (master + user_id_pub already
    // in hand) but the server's vault_passkey_hints row went missing — D1
    // wipe, fresh dev environment, or a cred row pruned by accident. The
    // client re-runs a registration ceremony so the server can re-attest the
    // existing credential and re-insert the cred_id row keyed by user_id_pub.
    // No new account is minted; same biometric → same user_id_pub → same user.
    passkeyHealOptions: createAuthEndpoint(
      '/passkey-webauthn/heal/options',
      {
        method: 'POST',
        body: z.object({ user_id_pub: z.string().min(40).max(64) }),
      },
      async (ctx) => {
        try {
          let rpID = opts.rpID
          if (!rpID) {
            // Prefer the live request URL — it reflects the actual domain the
            // browser is on (dev.one.ie, localhost, etc.). baseURL is a
            // build-time constant (PUBLIC_SITE_URL) and may not match the
            // domain the user is accessing when the build is reused across envs.
            try {
              rpID = new URL(ctx.request?.url ?? ctx.context.baseURL).hostname
            } catch {
              rpID = 'localhost'
            }
          }
          const rpName = opts.rpName ?? 'ONE'
          if (!opts.challengeSecret) {
            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'PASSKEY_CHALLENGE_SECRET not configured',
            })
          }

          const user_id_pub = ctx.body.user_id_pub
          // WebAuthn `userID` mirrors the deterministic identity bytes so the
          // authenticator-side handle matches what register-anonymous used.
          const userIdBytes = b64urlDecode(user_id_pub)

          // Look up every cred_id already registered for this user_id_pub so
          // the authenticator can re-attest the right credential. (We do NOT
          // pass excludeCredentials here — that would force a duplicate. The
          // client's navigator.credentials.create() runs without exclude so
          // the OS recognises the existing iCloud-synced passkey.)
          // Kept for symmetry with register-anonymous/options + future use.
          const db = await getD1(undefined)
          const excludeCredentials: Array<{ id: string; type: 'public-key' }> = []
          if (db) {
            try {
              const rows = await db
                .prepare(`SELECT cred_id FROM vault_passkey_hints WHERE user_id_pub = ?`)
                .bind(user_id_pub)
                .all<{ cred_id: string }>()
              for (const r of rows.results ?? []) {
                excludeCredentials.push({ id: r.cred_id, type: 'public-key' })
              }
            } catch (e) {
              // Non-fatal: heal works even if lookup fails. Worst case is a
              // duplicate cred row, which a follow-up heal will reconcile.
              console.warn('[passkey-webauthn] heal/options excludeCredentials lookup skipped:', (e as Error).message)
            }
          }

          const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userName: 'ONE',
            userID: userIdBytes,
            userDisplayName: 'ONE account',
            attestationType: 'none',
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              residentKey: 'preferred',
              userVerification: 'required',
            },
            supportedAlgorithmIDs: [-7, -257],
            // Intentionally no excludeCredentials — heal needs the OS to
            // re-surface the existing passkey, not refuse it as a duplicate.
          })

          const signedChallenge = await issueChallenge(opts.challengeSecret, 'register')
          const [payloadB64] = signedChallenge.split('.')
          options.challenge = payloadB64 as typeof options.challenge

          return ctx.json({ options, challengeToken: signedChallenge, prfSalt: b64url(await globalPrfSalt()) })
        } catch (e) {
          if (e instanceof APIError) throw e
          console.error('[passkey-webauthn] heal/options failed', e)
          throw new APIError('INTERNAL_SERVER_ERROR', {
            message: `heal/options: ${(e as Error)?.message ?? String(e)}`,
          })
        }
      },
    ),

    // ── HEAL: verify + reinsert cred_id row + mint session ─────────────────
    // Heal IS sign-in for a known biometric. Verifying the attestation proves
    // the client controls the same credential the OS already had stored; that
    // plus the deterministic user_id_pub is sufficient to recognise the user
    // and resume their session — exactly the "biometrics IS the security"
    // contract from passkey-recognition.md.
    passkeyHeal: createAuthEndpoint(
      '/passkey-webauthn/heal',
      {
        method: 'POST',
        body: z.object({
          challengeToken: z.string(),
          response: z.record(z.string(), z.unknown()),
          user_id_pub: z.string().min(40).max(64),
        }),
      },
      async (ctx) => {
        const err = (status: number, message: string): Response =>
          new Response(JSON.stringify({ error: message }), {
            status,
            headers: { 'Content-Type': 'application/json' },
          })

        try {
          const { challenge } = await verifyChallenge(ctx.body.challengeToken, opts.challengeSecret, 'register')

          let rpID = opts.rpID
          if (!rpID) {
            // Prefer the live request URL — it reflects the actual domain the
            // browser is on (dev.one.ie, localhost, etc.). baseURL is a
            // build-time constant (PUBLIC_SITE_URL) and may not match the
            // domain the user is accessing when the build is reused across envs.
            try {
              rpID = new URL(ctx.request?.url ?? ctx.context.baseURL).hostname
            } catch {
              rpID = 'localhost'
            }
          }
          const expectedOrigins = opts.expectedOrigins ?? [originFromContext(ctx)]

          let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>
          try {
            verification = await verifyRegistrationResponse({
              response: ctx.body.response as Parameters<typeof verifyRegistrationResponse>[0]['response'],
              expectedChallenge: challenge,
              expectedOrigin: expectedOrigins,
              expectedRPID: rpID,
              requireUserVerification: true,
            })
          } catch (e) {
            return err(401, `Attestation invalid: ${(e as Error).message}`)
          }
          if (!verification.verified || !verification.registrationInfo) {
            return err(401, 'Attestation did not verify')
          }

          const info = verification.registrationInfo
          const credId = info.credential.id
          const pubKey = b64url(new Uint8Array(info.credential.publicKey))
          const signCount = info.credential.counter

          const db = await getD1(undefined)

          // Resolve user via the deterministic identity key. This is the
          // self-heal contract: same biometric → same master → same
          // user_id_pub → same user, every time.
          const user = await findOrCreateUserByPub(ctx, ctx.body.user_id_pub, db)

          const upsert = await upsertHint(db, credId, {
            user_id: user.id,
            pub_key: pubKey,
            sign_count: signCount,
            wrapped_master: null,
            label: null,
            user_id_pub: ctx.body.user_id_pub,
          })
          if (!upsert.ok) return err(500, upsert.err)

          // Heal IS sign-in. The biometric verification just succeeded; mint
          // a session so the client can fetch the vault_blob and resume.
          const session = await ctx.context.internalAdapter.createSession(user.id, ctx.request)
          await setSessionCookie(ctx, { session, user })

          // Same governance integration as register-anonymous: ensure a TypeDB
          // human unit + personal group + chairman membership exist.
          // Fire-and-forget so a TypeDB blip can't block heal.
          ensureHumanUnit(user.id, {
            id: user.id,
            email: user.email ?? null,
            name: user.name ?? null,
          }).catch((e) => console.error('[passkey-webauthn] ensureHumanUnit failed', e))

          return ctx.json({
            healed: true,
            credId,
            user: { id: user.id, email: user.email, name: user.name },
            session: { token: session.token, expiresAt: session.expiresAt },
          })
        } catch (e) {
          console.error('[passkey-webauthn] heal failed', e)
          return err(500, `heal: ${(e as Error)?.message ?? String(e)}`)
        }
      },
    ),

    // ── AUTHENTICATE: options ──────────────────────────────────────────────
    passkeyAuthenticateOptions: createAuthEndpoint(
      '/passkey-webauthn/authenticate/options',
      { method: 'POST', body: z.object({}).optional() },
      async (ctx) => {
        try {
          // Derive rpID defensively: fall back to request host if baseURL is missing.
          let rpID = opts.rpID
          if (!rpID) {
            // Prefer the live request URL — it reflects the actual domain the
            // browser is on (dev.one.ie, localhost, etc.). baseURL is a
            // build-time constant (PUBLIC_SITE_URL) and may not match the
            // domain the user is accessing when the build is reused across envs.
            try {
              rpID = new URL(ctx.request?.url ?? ctx.context.baseURL).hostname
            } catch {
              rpID = 'localhost'
            }
          }

          if (!opts.challengeSecret) {
            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'PASSKEY_CHALLENGE_SECRET (or BETTER_AUTH_SECRET) not configured',
            })
          }

          const signedChallenge = await issueChallenge(opts.challengeSecret, 'authenticate')
          const [payloadB64] = signedChallenge.split('.')
          const prfSalt = await globalPrfSalt()

          // Don't include PRF in the library's extensions — SWA's types don't
          // cover PRF, and a Uint8Array inside it JSON-serialises to junk on
          // the wire. The client rebuilds the PRF extension from `prfSalt`.
          const options = await generateAuthenticationOptions({
            rpID,
            userVerification: 'required',
            allowCredentials: [], // discoverable credential
          })
          options.challenge = payloadB64 as typeof options.challenge

          return ctx.json({ options, challengeToken: signedChallenge, prfSalt: b64url(prfSalt) })
        } catch (e) {
          if (e instanceof APIError) throw e
          console.error('[passkey-webauthn] authenticate/options failed', e)
          throw new APIError('INTERNAL_SERVER_ERROR', {
            message: `authenticate/options: ${(e as Error)?.message ?? String(e)}`,
          })
        }
      },
    ),

    // ── AUTHENTICATE: verify + mint session ────────────────────────────────
    passkeyAuthenticate: createAuthEndpoint(
      '/passkey-webauthn/authenticate',
      {
        method: 'POST',
        body: z.object({
          challengeToken: z.string(),
          response: z.record(z.string(), z.unknown()),
          // Optional: client may send the deterministic user_id_pub so the
          // server can fall back to identity-by-pub when the cred_id row is
          // missing. Primary lookup is still by cred_id from the assertion.
          user_id_pub: z.string().min(40).max(64).optional(),
        }),
      },
      async (ctx) => {
        // Plain-Response error helper — bypasses Better Auth's error pipeline
        // so the body is never eaten. Always returns JSON with a readable
        // message and is safe to read via `await res.text()` client-side.
        const err = (status: number, message: string): Response =>
          new Response(JSON.stringify({ error: message }), {
            status,
            headers: { 'Content-Type': 'application/json' },
          })

        try {
          const { challenge } = await verifyChallenge(ctx.body.challengeToken, opts.challengeSecret, 'authenticate')

          const assertion = ctx.body.response as { id?: string; rawId?: string }
          const credId = assertion.id ?? assertion.rawId
          if (typeof credId !== 'string' || credId.length === 0) {
            return err(400, 'assertion missing credential id')
          }

          const db = await getD1(undefined)
          const lookup = await findHint(db, credId)
          if ('err' in lookup) return err(500, lookup.err)
          const hint = lookup.hint
          if (!hint) {
            return err(
              401,
              'no passkey registered for this credential — sign in with password once and enable passkey sign-in',
            )
          }

          let rpID = opts.rpID
          if (!rpID) {
            // Prefer the live request URL — it reflects the actual domain the
            // browser is on (dev.one.ie, localhost, etc.). baseURL is a
            // build-time constant (PUBLIC_SITE_URL) and may not match the
            // domain the user is accessing when the build is reused across envs.
            try {
              rpID = new URL(ctx.request?.url ?? ctx.context.baseURL).hostname
            } catch {
              rpID = 'localhost'
            }
          }
          const expectedOrigins = opts.expectedOrigins ?? [originFromContext(ctx)]

          let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>
          try {
            verification = await verifyAuthenticationResponse({
              response: ctx.body.response as Parameters<typeof verifyAuthenticationResponse>[0]['response'],
              expectedChallenge: challenge,
              expectedOrigin: expectedOrigins,
              expectedRPID: rpID,
              credential: {
                id: credId,
                publicKey: b64urlDecode(hint.pub_key),
                counter: hint.sign_count,
              },
              requireUserVerification: true,
            })
          } catch (e) {
            return err(401, `Assertion invalid: ${(e as Error).message}`)
          }
          if (!verification.verified) return err(401, 'Assertion did not verify')

          await bumpSignCount(db, credId, verification.authenticationInfo.newCounter)

          const session = await ctx.context.internalAdapter.createSession(hint.user_id, ctx.request)
          const user = await ctx.context.internalAdapter.findUserById(hint.user_id)
          if (!user) return err(500, 'user vanished')
          await setSessionCookie(ctx, { session, user })

          return ctx.json({
            ok: true,
            user: { id: user.id, email: user.email, name: user.name },
            session: { token: session.token, expiresAt: session.expiresAt },
          })
        } catch (e) {
          console.error('[passkey-webauthn] authenticate failed', e)
          return err(500, `authenticate: ${(e as Error)?.message ?? String(e)}`)
        }
      },
    ),
  },
})
