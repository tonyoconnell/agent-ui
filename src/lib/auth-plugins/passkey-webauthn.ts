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

// ─── hint storage (D1 in prod, in-memory Map in localhost dev) ──────────────

interface HintRow {
  user_id: string
  pub_key: string
  sign_count: number
  wrapped_master?: string | null
  label?: string | null
}

/** Disk-backed Map. Only used when D1 is unavailable AND we're in dev.
 *  Persists across `astro dev` restarts so a registered passkey keeps working
 *  without requiring the user to wipe their local vault every time. */
const DEV_HINT_FILE = '.dev-passkey-hints.json'
const devHintStore = new Map<string, HintRow>()
let devHintStoreLoaded = false

function isDev(): boolean {
  try {
    return import.meta.env.DEV === true
  } catch {
    return false
  }
}

async function loadDevHintStore(): Promise<void> {
  if (devHintStoreLoaded) return
  devHintStoreLoaded = true
  try {
    const fs = await import('node:fs/promises')
    const raw = await fs.readFile(DEV_HINT_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Record<string, HintRow>
    for (const [k, v] of Object.entries(parsed)) devHintStore.set(k, v)
  } catch {
    /* first run or unreadable — start empty */
  }
}

async function saveDevHintStore(): Promise<void> {
  try {
    const fs = await import('node:fs/promises')
    const obj = Object.fromEntries(devHintStore)
    await fs.writeFile(DEV_HINT_FILE, JSON.stringify(obj, null, 2), 'utf8')
  } catch (e) {
    console.warn('[passkey-webauthn] failed to persist dev hint store:', (e as Error).message)
  }
}

async function upsertHint(
  db: D1Database | null,
  credId: string,
  row: HintRow,
): Promise<{ ok: true } | { ok: false; err: string }> {
  if (db) {
    try {
      await db
        .prepare(
          `INSERT INTO vault_passkey_hints
             (cred_id, user_id, pub_key, sign_count, wrapped_master, label, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, unixepoch())
           ON CONFLICT(cred_id) DO UPDATE SET
             user_id        = excluded.user_id,
             pub_key        = excluded.pub_key,
             sign_count     = excluded.sign_count,
             wrapped_master = excluded.wrapped_master,
             label          = excluded.label,
             updated_at     = unixepoch()`,
        )
        .bind(credId, row.user_id, row.pub_key, row.sign_count, row.wrapped_master ?? null, row.label ?? null)
        .run()
      return { ok: true }
    } catch (e) {
      const msg = (e as Error).message ?? String(e)
      if (msg.includes('no such table')) {
        return { ok: false, err: 'vault_passkey_hints table missing — apply migration 0023_vault_passkey_hints.sql' }
      }
      return { ok: false, err: `D1 write failed: ${msg}` }
    }
  }
  if (isDev()) {
    await loadDevHintStore()
    devHintStore.set(credId, row)
    await saveDevHintStore()
    console.warn(`[passkey-webauthn] stored hint in DEV file fallback (${DEV_HINT_FILE})`)
    return { ok: true }
  }
  return { ok: false, err: 'D1 not available on server' }
}

async function findHint(db: D1Database | null, credId: string): Promise<{ hint: HintRow | null } | { err: string }> {
  if (db) {
    try {
      const row = await db
        .prepare(
          `SELECT user_id, pub_key, sign_count, wrapped_master
             FROM vault_passkey_hints WHERE cred_id = ? LIMIT 1`,
        )
        .bind(credId)
        .first<HintRow>()
      return { hint: row ?? null }
    } catch (e) {
      const msg = (e as Error).message ?? String(e)
      if (msg.includes('no such table')) {
        return { err: 'vault_passkey_hints table missing — apply migration 0023_vault_passkey_hints.sql' }
      }
      return { err: `D1 read failed: ${msg}` }
    }
  }
  if (isDev()) {
    await loadDevHintStore()
    return { hint: devHintStore.get(credId) ?? null }
  }
  return { err: 'D1 not available on server' }
}

async function bumpSignCount(db: D1Database | null, credId: string, newCounter: number): Promise<void> {
  if (db) {
    try {
      await db
        .prepare(`UPDATE vault_passkey_hints SET sign_count = ?, updated_at = unixepoch() WHERE cred_id = ?`)
        .bind(newCounter, credId)
        .run()
    } catch {
      // best-effort
    }
    return
  }
  if (isDev()) {
    await loadDevHintStore()
    const row = devHintStore.get(credId)
    if (row) {
      devHintStore.set(credId, { ...row, sign_count: newCounter })
      await saveDevHintStore()
    }
  }
}

async function createOrFindUser(
  ctx: {
    context: {
      internalAdapter: {
        createUser: (...args: never[]) => unknown
        findUserByEmail: (...args: never[]) => unknown
      }
    }
  },
  userHandle: string,
): Promise<{ id: string; email: string | null; name: string | null }> {
  const email = `${userHandle}@passkey.one.ie`
  const displayName = `Passkey ${userHandle.slice(0, 8)}`
  try {
    return await ctx.context.internalAdapter.createUser({ email, name: displayName, emailVerified: false })
  } catch {
    const existing = await ctx.context.internalAdapter.findUserByEmail(email).catch(() => null)
    if (!existing?.user) throw new Error('could not create or find user for this device handle')
    return existing.user
  }
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
    // No Better Auth session required. Creates a fresh random user handle
    // (finalized into a real user row during verify). Used by the
    // "sign in with passkey" flow to auto-create an account when no
    // credential matches server-side.
    passkeyRegisterAnonymousOptions: createAuthEndpoint(
      '/passkey-webauthn/register-anonymous/options',
      { method: 'POST', body: z.object({ deviceHandle: z.string().optional() }).optional() },
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

          // Use the client's stable device handle as userID when provided.
          // Same userID + same RP = authenticator replaces existing credential
          // instead of creating a new one — prevents passkey accumulation.
          // Fall back to a random handle when none is supplied (older clients).
          const userHandle = ctx.body?.deviceHandle ?? b64url(crypto.getRandomValues(new Uint8Array(16)))

          // `userName` is what Apple Passwords / Chrome Passkey Manager show
          // as the headline label. Keep it friendly; the unique identity lives
          // in `userID` (bytes). `userDisplayName` is the subtitle.
          const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userName: 'ONE',
            userID: new TextEncoder().encode(userHandle),
            userDisplayName: 'ONE account',
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
          userHandle: z.string(),
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
              user = await createOrFindUser(ctx, ctx.body.userHandle)
            }
          } else {
            // Find or create a Better Auth user for this passkey.
            // The email is stable: deviceHandle@passkey.one.ie — same device =
            // same handle = same email = same user. Re-registering on the same
            // device (e.g. after a dev restart cleared D1) resumes the old account.
            user = await createOrFindUser(ctx, ctx.body.userHandle)
          }

          const upsert = await upsertHint(db, credId, {
            user_id: user.id,
            pub_key: pubKey,
            sign_count: signCount,
            wrapped_master: null,
            label: ctx.body.label ?? null,
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
