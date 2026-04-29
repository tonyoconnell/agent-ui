/**
 * Better Auth Server Configuration with TypeDB Backend
 *
 * Uses Web Crypto API for password hashing (works everywhere).
 * TypeDB accessed via HTTP proxy.
 */

import { kyselyAdapter } from '@better-auth/kysely-adapter'
import { betterAuth } from 'better-auth'
import { bearer, magicLink, mcp } from 'better-auth/plugins'
import { Kysely } from 'kysely'
import { ensureHumanUnit } from '@/lib/human-unit'
import { sendEmail } from '@/lib/notify/email'
import { passkeyWebauthn } from './auth-plugins/passkey-webauthn'
import { suiWallet } from './auth-plugins/sui-wallet'
import { LazyD1Dialect } from './d1-kysely-dialect'

// Kysely instance created once per isolate. LazyD1Dialect defers the actual
// D1 binding lookup until the first query (always inside a request handler).
const kysely = new Kysely({ dialect: new LazyD1Dialect() })

// PBKDF2 password hashing (Web Crypto API)
const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16
const KEY_LENGTH = 32

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    KEY_LENGTH * 8,
  )

  const hash = new Uint8Array(derivedBits)
  const saltB64 = btoa(String.fromCharCode(...salt))
  const hashB64 = btoa(String.fromCharCode(...hash))

  return `$pbkdf2$${PBKDF2_ITERATIONS}$${saltB64}$${hashB64}`
}

async function verifyPassword(data: { password: string; hash: string }): Promise<boolean> {
  const { password, hash } = data

  const parts = hash.split('$')
  if (parts.length !== 5 || parts[1] !== 'pbkdf2') {
    return false
  }

  const iterations = parseInt(parts[2], 10)
  const salt = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0))
  const storedHash = Uint8Array.from(atob(parts[4]), (c) => c.charCodeAt(0))

  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    passwordKey,
    storedHash.length * 8,
  )

  const computedHash = new Uint8Array(derivedBits)

  if (computedHash.length !== storedHash.length) return false
  let diff = 0
  for (let i = 0; i < computedHash.length; i++) {
    diff |= computedHash[i] ^ storedHash[i]
  }
  return diff === 0
}

export function createAuth() {
  const publicEnv = {
    BETTER_AUTH_SECRET: (globalThis as any).BETTER_AUTH_SECRET || import.meta.env.BETTER_AUTH_SECRET || '',
  }

  return betterAuth({
    ...(publicEnv.BETTER_AUTH_SECRET && { secret: publicEnv.BETTER_AUTH_SECRET }),

    // D1 (local to the Worker, <10ms) instead of TypeDB (~100ms via gateway).
    // Fixes OAuth state_mismatch: the verification record is written and read
    // within the same D1 instance, no cross-service latency gap.
    database: kyselyAdapter(kysely, { type: 'sqlite' }),

    // Dynamic baseURL: derives issuer + callback URLs from the incoming
    // request host instead of a build-time constant. Required because the
    // Worker runs on dev.one.ie / one.ie / local.one.ie / localhost and
    // wrangler.toml vars are runtime-only (not available to import.meta.env
    // during the Astro build). Dynamic config fixes the MCP OAuth discovery
    // document showing http://localhost:4321 as the issuer.
    baseURL: {
      allowedHosts: ['one.ie', '*.one.ie', 'localhost'],
      fallback: 'https://dev.one.ie',
    },

    // Cross-subdomain cookies: share session between dev.one.ie / one.ie /
    // pay.one.ie. On localhost keep host-only so the cookie attaches.
    // Dynamic baseURL means we can't check publicEnv.PUBLIC_SITE_URL here;
    // we always enable cross-subdomain and the domain check is skipped on
    // localhost because the host won't match '.one.ie'.
    advanced: { crossSubDomainCookies: { enabled: true, domain: '.one.ie' } },

    session: {
      // Browsers cap cookie Max-Age at 400 days (RFC 6265bis), so we set the
      // expiry to 365 days and lean on Better Auth's sliding-window refresh.
      // Every authenticated request issues a fresh cookie; an active user
      // stays signed in indefinitely. Only a 365-day idle gap signs them out.
      expiresIn: 60 * 60 * 24 * 365,
      updateAge: 60 * 60 * 24, // refresh every 24h of activity
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 365,
      },
    },

    socialProviders: {
      google: {
        clientId: (globalThis as any).GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID || '',
        clientSecret: (globalThis as any).GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET || '',
      },
    },

    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['sui-wallet', 'google', 'magic-link'],
      },
    },

    databaseHooks: {
      session: {
        create: {
          after: async (session: { userId: string }) => {
            try {
              await ensureHumanUnit(session.userId, { id: session.userId })
            } catch (e) {
              console.error('[session.create.after] ensureHumanUnit failed', e)
            }
          },
        },
      },
    },

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
    },

    user: {
      changeEmail: {
        enabled: true,
        // Allow immediate email update when the account's email is not yet
        // verified (common for passkey-first or wallet-first accounts).
        // Verified accounts will receive an error until email sending is wired up.
        updateEmailWithoutVerification: true,
      },
      additionalFields: {
        // passkey-recognition: stable public identity derived client-side
        // from the vault master (HKDF(master, "user-id-v1")). Lets the server
        // resolve "same biometric → same user" deterministically without
        // depending on email or device handle. Stored on auth-user in TypeDB
        // via `auth-user-id-pub` (see typedb-auth-adapter.ts FIELD_TO_ATTR).
        userIdPub: { type: 'string', required: false },
      },
    },

    trustedOrigins: [
      'http://localhost:4321',
      'http://localhost:3000',
      'https://local.one.ie',
      'https://main.one.ie',
      'https://dev.one.ie',
      'https://one.ie',
      'https://pay.one.ie',
      ...(
        ((globalThis as any).BETTER_AUTH_TRUSTED_ORIGINS || import.meta.env.BETTER_AUTH_TRUSTED_ORIGINS || '') as string
      )
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
    ],

    plugins: [
      bearer(),
      suiWallet({
        nonceSecret: (globalThis as any).WALLET_NONCE_SECRET || import.meta.env.WALLET_NONCE_SECRET || '',
        sessionSecret: (globalThis as any).SUI_SESSION_SECRET || import.meta.env.SUI_SESSION_SECRET,
      }),
      passkeyWebauthn({
        // Challenge HMAC secret: prefer explicit env, fall back to Better Auth
        // secret, and finally to a stable dev-only constant on localhost so the
        // plugin works without any configuration in local dev. In production,
        // BETTER_AUTH_SECRET must be set — that's already enforced elsewhere.
        challengeSecret:
          (globalThis as any).PASSKEY_CHALLENGE_SECRET ||
          import.meta.env.PASSKEY_CHALLENGE_SECRET ||
          publicEnv.BETTER_AUTH_SECRET ||
          (!import.meta.env.BETTER_AUTH_SECRET ? 'dev-only-passkey-challenge-secret-DO-NOT-USE-IN-PROD' : ''),
        // rpID is left undefined — the plugin derives it from the request origin's
        // hostname (dev.one.ie → rpId=dev.one.ie, localhost → rpId=localhost).
        // This avoids the .well-known/webauthn cross-origin fetch that browsers
        // require when rpId is a parent domain. Cross-subdomain credential sharing
        // can be wired once one.ie completes its Worker cutover (see CLAUDE.md).
        //
        // expectedOrigins: let the plugin default to the current request origin so
        // new passkeys work on any subdomain without manual list maintenance.
        expectedOrigins: [
          'https://one.ie',
          'https://dev.one.ie',
          'https://local.one.ie',
          'https://main.one.ie',
          'https://pay.one.ie',
          'http://localhost:4321',
        ],
      }),
      magicLink({
        sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
          await sendEmail({
            to: email,
            from: (globalThis as any).RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL || 'tony@one.ie',
            subject: 'Your sign-in link for ONE',
            html: `<p>Click to sign in: <a href="${url}">${url}</a></p><p>This link expires in 5 minutes.</p>`,
            text: `Sign in: ${url} (expires in 5 minutes)`,
          })
        },
        expiresIn: 60 * 5,
        disableSignUp: false,
      }),
      // OAuth 2.0 provider for MCP clients (Claude Desktop, Cursor, etc.).
      // Clients register via POST /api/auth/mcp/register, then authenticate
      // via the standard OAuth flow before accessing @oneie/mcp tools.
      mcp({
        loginPage: '/signin',
      }),
    ],
  })
}

export const auth = createAuth()

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
