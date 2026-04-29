import { runtimeEnv } from '@/lib/env'

const HARDCODED_TRUSTED = [
  'http://localhost:4321',
  'http://localhost:3000',
  'https://local.one.ie',
  'https://main.one.ie',
  'https://dev.one.ie',
  'https://one.ie',
  'https://pay.one.ie',
]

function getTrustedOrigins(): string[] {
  const extra = (runtimeEnv('BETTER_AUTH_TRUSTED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...HARDCODED_TRUSTED, ...extra]
}

/**
 * Validate a redirect URL. Returns url if same-origin or trusted; else fallback.
 * Prevents open-redirect attacks (attacker uses signin?redirect=https://evil.com).
 */
export function validateRedirect(url: string | null | undefined, fallback = '/app'): string {
  if (!url) return fallback
  // Allow relative paths (reject // protocol-relative bypass attempts)
  if (url.startsWith('/') && !url.startsWith('//')) return url
  try {
    const parsed = new URL(url)
    const trusted = getTrustedOrigins()
    if (trusted.some((origin) => origin === `${parsed.protocol}//${parsed.host}`)) {
      return url
    }
  } catch {
    // not a valid URL — treat as relative only if it's a safe relative path
    if (url.startsWith('/') && !url.startsWith('//')) return url
  }
  return fallback
}
