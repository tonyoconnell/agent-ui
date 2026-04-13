/**
 * Better Auth Server Configuration with TypeDB Backend
 *
 * Uses Web Crypto API for password hashing (works everywhere).
 * TypeDB accessed via HTTP proxy.
 */

import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { typedbAdapter } from "./typedb-auth-adapter";

// PBKDF2 password hashing (Web Crypto API)
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    passwordKey,
    KEY_LENGTH * 8
  );

  const hash = new Uint8Array(derivedBits);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...hash));

  return `$pbkdf2$${PBKDF2_ITERATIONS}$${saltB64}$${hashB64}`;
}

async function verifyPassword(data: {
  password: string;
  hash: string;
}): Promise<boolean> {
  const { password, hash } = data;

  const parts = hash.split("$");
  if (parts.length !== 5 || parts[1] !== "pbkdf2") {
    return false;
  }

  const iterations = parseInt(parts[2], 10);
  const salt = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0));
  const storedHash = Uint8Array.from(atob(parts[4]), (c) => c.charCodeAt(0));

  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    passwordKey,
    storedHash.length * 8
  );

  const computedHash = new Uint8Array(derivedBits);

  if (computedHash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computedHash.length; i++) {
    diff |= computedHash[i] ^ storedHash[i];
  }
  return diff === 0;
}

export function createAuth() {
  // Public build-time config only
  const publicEnv = {
    TYPEDB_URL: import.meta.env.TYPEDB_URL || "",
    TYPEDB_DATABASE: import.meta.env.TYPEDB_DATABASE || "",
    BETTER_AUTH_SECRET: import.meta.env.BETTER_AUTH_SECRET || "",
    PUBLIC_SITE_URL: import.meta.env.PUBLIC_SITE_URL || "http://localhost:4321",
  };

  // Runtime/secret config (from Worker env, not build time)
  const runtimeEnv = {
    TYPEDB_USERNAME: (globalThis as any).TYPEDB_USERNAME || "admin",
    TYPEDB_PASSWORD: (globalThis as any).TYPEDB_PASSWORD || "",
  };

  return betterAuth({
    ...(publicEnv.BETTER_AUTH_SECRET && { secret: publicEnv.BETTER_AUTH_SECRET }),

    database: typedbAdapter({
      url: publicEnv.TYPEDB_URL,
      database: publicEnv.TYPEDB_DATABASE,
      username: runtimeEnv.TYPEDB_USERNAME,
      password: runtimeEnv.TYPEDB_PASSWORD,
    }),

    baseURL: import.meta.env.PUBLIC_SITE_URL,

    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // refresh every 24h
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 30,
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

    trustedOrigins: [
      "http://localhost:4321",
      "http://localhost:3000",
    ],

    plugins: [
      bearer(),
    ],
  });
}

export const auth = createAuth();

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
