/**
 * Composite auth rate limiter (IP + email).
 * Storage: CF Workers KV namespace AUTH_RATE_LIMIT when bound; in-memory fallback.
 *
 * /email/continue:  IP=5/min   email=3/hour   email=10/day
 * /sign-in/email:   IP=20/min  (IP,email)=5/15min → lockout msg
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const LIMITS = {
  'email-continue-ip': { maxRequests: 5, windowMs: 60_000 } as RateLimitConfig,
  'email-continue-email-hour': { maxRequests: 3, windowMs: 60 * 60_000 } as RateLimitConfig,
  'email-continue-email-day': { maxRequests: 10, windowMs: 24 * 60 * 60_000 } as RateLimitConfig,
  'signin-email-ip': { maxRequests: 20, windowMs: 60_000 } as RateLimitConfig,
  'signin-email-pair': { maxRequests: 5, windowMs: 15 * 60_000 } as RateLimitConfig,
}

// In-memory fallback (per-isolate)
const MEM_BUCKETS = new Map<string, { count: number; resetAt: number }>()

function memCheck(key: string, cfg: RateLimitConfig): boolean {
  const now = Date.now()
  let b = MEM_BUCKETS.get(key)
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + cfg.windowMs }
    MEM_BUCKETS.set(key, b)
  }
  b.count++
  return b.count <= cfg.maxRequests
}

async function kvCheck(kv: any, key: string, cfg: RateLimitConfig): Promise<boolean> {
  const now = Date.now()
  const raw = await kv.get(key, 'json').catch(() => null)
  const bucket = raw && raw.resetAt > now ? raw : { count: 0, resetAt: now + cfg.windowMs }
  bucket.count++
  await kv.put(key, JSON.stringify(bucket), { expirationTtl: Math.ceil(cfg.windowMs / 1000) + 60 }).catch(() => {})
  return bucket.count <= cfg.maxRequests
}

async function check(key: string, cfg: RateLimitConfig): Promise<boolean> {
  const kv = (globalThis as any).AUTH_RATE_LIMIT
  if (kv?.get) return kvCheck(kv, key, cfg)
  return memCheck(key, cfg)
}

export interface AuthLimitParams {
  ip: string
  email: string
  action: '/email/continue' | '/sign-in/email'
}

export type AuthLimitResult = { ok: true } | { ok: false; retryAfter: number }

export async function checkAuthLimit({ ip, email, action }: AuthLimitParams): Promise<AuthLimitResult> {
  const norm = email.toLowerCase().replace(/\s/g, '')

  if (action === '/email/continue') {
    const ipOk = await check(`ip:ec:${ip}`, LIMITS['email-continue-ip'])
    const eHour = await check(`em:ec:h:${norm}`, LIMITS['email-continue-email-hour'])
    const eDay = await check(`em:ec:d:${norm}`, LIMITS['email-continue-email-day'])
    if (!ipOk) return { ok: false, retryAfter: 60 }
    if (!eHour) return { ok: false, retryAfter: 3600 }
    if (!eDay) return { ok: false, retryAfter: 86400 }
  }

  if (action === '/sign-in/email') {
    const ipOk = await check(`ip:se:${ip}`, LIMITS['signin-email-ip'])
    const pairOk = await check(`pr:se:${ip}:${norm}`, LIMITS['signin-email-pair'])
    if (!ipOk) return { ok: false, retryAfter: 60 }
    if (!pairOk) return { ok: false, retryAfter: 900 }
  }

  return { ok: true }
}
