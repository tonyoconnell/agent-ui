/**
 * Platform BaaS tier limits.
 *
 * Source of truth: one/pricing.md § Pricing tiers.
 * FREE | BUILDER | SCALE | WORLD | ENTERPRISE — what each tier gets.
 *
 * Storage: D1 `developer_tiers` table (per user_id). Set via billing webhook.
 * Default: 'free' when missing.
 */

import type { D1Database } from '@cloudflare/workers-types'

export type Tier = 'free' | 'builder' | 'scale' | 'world' | 'enterprise'

export type LoopId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7'

export type TierLimits = {
  agents: number
  apiCalls: number
  storageMb: number
  teamMembers: number
  loops: LoopId[]
  memoryReveal: boolean
  memoryForget: boolean
  groupScoping: boolean
  federation: boolean
  hostedWebhooks: boolean
}

const INF = Number.POSITIVE_INFINITY

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    agents: 5,
    apiCalls: 10_000,
    storageMb: 100,
    teamMembers: 1,
    loops: ['L1', 'L2', 'L3'],
    memoryReveal: false,
    memoryForget: false,
    groupScoping: false,
    federation: false,
    hostedWebhooks: false,
  },
  builder: {
    agents: 25,
    apiCalls: 100_000,
    storageMb: 1_000,
    teamMembers: 5,
    loops: ['L1', 'L2', 'L3', 'L4', 'L5'],
    memoryReveal: false,
    memoryForget: false,
    groupScoping: false,
    federation: false,
    hostedWebhooks: false,
  },
  scale: {
    agents: 200,
    apiCalls: 1_000_000,
    storageMb: 10_000,
    teamMembers: 20,
    loops: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'],
    memoryReveal: true,
    memoryForget: false,
    groupScoping: true,
    federation: false,
    hostedWebhooks: true,
  },
  world: {
    agents: 1_000,
    apiCalls: 10_000_000,
    storageMb: 100_000,
    teamMembers: INF,
    loops: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'],
    memoryReveal: true,
    memoryForget: true,
    groupScoping: true,
    federation: false,
    hostedWebhooks: true,
  },
  enterprise: {
    agents: INF,
    apiCalls: INF,
    storageMb: INF,
    teamMembers: INF,
    loops: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'],
    memoryReveal: true,
    memoryForget: true,
    groupScoping: true,
    federation: false,
    hostedWebhooks: true,
  },
}

export type TierCheckOk = { ok: true }
export type TierCheckFail = {
  ok: false
  status: 402
  error: string
  tier: Tier
  limit: number
  usage: number
  upgradeUrl: string
}
export type TierCheckResult = TierCheckOk | TierCheckFail

const UPGRADE_URL = 'https://one.ie/pricing'

export function checkApiCallLimit(tier: Tier, usage: number): TierCheckResult {
  const limit = TIER_LIMITS[tier].apiCalls
  if (usage < limit) return { ok: true }
  return {
    ok: false,
    status: 402,
    error: `tier ${tier} exceeds monthly API-call limit (${limit}) — usage ${usage}`,
    tier,
    limit,
    usage,
    upgradeUrl: UPGRADE_URL,
  }
}

export function checkAgentLimit(tier: Tier, current: number): TierCheckResult {
  const limit = TIER_LIMITS[tier].agents
  if (current < limit) return { ok: true }
  return {
    ok: false,
    status: 402,
    error: `tier ${tier} exceeds agent limit (${limit}) — current ${current}`,
    tier,
    limit,
    usage: current,
    upgradeUrl: UPGRADE_URL,
  }
}

export function tierAllowsLoop(tier: Tier, loop: LoopId): boolean {
  return TIER_LIMITS[tier].loops.includes(loop)
}

export function tierAllows(
  tier: Tier,
  feature: 'memoryReveal' | 'memoryForget' | 'groupScoping' | 'federation' | 'hostedWebhooks',
): boolean {
  return TIER_LIMITS[tier][feature]
}

const VALID_TIERS = new Set<string>(['free', 'builder', 'scale', 'world', 'enterprise'])

export function parseTier(raw: unknown): Tier {
  return typeof raw === 'string' && VALID_TIERS.has(raw) ? (raw as Tier) : 'free'
}

/**
 * Look up a user's tier in D1. Safe to call with `null` DB (dev/test) — returns 'free'.
 * Never throws.
 */
export async function resolveTier(userId: string, db: D1Database | null): Promise<Tier> {
  if (!db || !userId) return 'free'
  try {
    const row = await db
      .prepare('SELECT tier FROM developer_tiers WHERE user_id = ?')
      .bind(userId)
      .first<{ tier?: string }>()
    return parseTier(row?.tier)
  } catch {
    return 'free'
  }
}

/**
 * Set a user's tier. Used by billing webhooks on Stripe subscription change.
 * Never throws. Idempotent on (user_id).
 */
export async function setTier(userId: string, tier: Tier, db: D1Database | null): Promise<void> {
  if (!db || !userId) return
  try {
    await db
      .prepare(
        'INSERT INTO developer_tiers (user_id, tier, updated_at) VALUES (?, ?, unixepoch()) ' +
          'ON CONFLICT(user_id) DO UPDATE SET tier=excluded.tier, updated_at=unixepoch()',
      )
      .bind(userId, tier)
      .run()
  } catch {
    /* best-effort */
  }
}

/**
 * Build a 402 Response from a failed tier check. Canonical shape for all gated endpoints.
 */
export function tierLimitResponse(fail: TierCheckFail): Response {
  return new Response(
    JSON.stringify({
      error: fail.error,
      tier: fail.tier,
      limit: fail.limit,
      usage: fail.usage,
      upgradeUrl: fail.upgradeUrl,
    }),
    {
      status: fail.status,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
