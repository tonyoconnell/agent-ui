/**
 * Parses a `group.brand` attribute (e.g. "premium:oo-agency") into tier, quota, and pricing.
 * Pure functions — no I/O, no side effects. Import and call directly.
 */

export type Tier = 'public' | 'premium' | 'enterprise'

export interface Quota {
  agents: number
  signalsPerDay: number
  memoryMB: number
  persistence: boolean
}

export interface TenantInfo {
  tier: Tier
  gid: string
  quota: Quota
  priceMonthly: number
}

const TIERS: Record<Tier, { quota: Quota; priceMonthly: number }> = {
  public: {
    quota: { agents: 5, signalsPerDay: 1_000, memoryMB: 100, persistence: false },
    priceMonthly: 0,
  },
  premium: {
    quota: { agents: 50, signalsPerDay: 50_000, memoryMB: 1_000, persistence: true },
    priceMonthly: 499,
  },
  enterprise: {
    quota: { agents: Infinity, signalsPerDay: Infinity, memoryMB: Infinity, persistence: true },
    priceMonthly: 2_999,
  },
}

/** Parse a group.brand attribute like "premium:oo-agency" → TenantInfo */
export function parseTenant(brand: string): TenantInfo {
  const colon = brand.indexOf(':')
  const prefix = colon >= 0 ? brand.slice(0, colon) : ''
  const gid = colon >= 0 ? brand.slice(colon + 1) : brand || 'unknown'

  const tier: Tier = prefix === 'premium' ? 'premium' : prefix === 'enterprise' ? 'enterprise' : 'public'

  const { quota, priceMonthly } = TIERS[tier]
  return { tier, gid, quota, priceMonthly }
}

export function enforceQuota(
  info: TenantInfo,
  usage: { agents?: number; signalsToday?: number; memoryMB?: number },
): { ok: boolean; reason?: string } {
  const { tier, gid, quota } = info
  const label = `${tier}:${gid}`

  if (usage.agents !== undefined && usage.agents > quota.agents)
    return { ok: false, reason: `agents ${usage.agents} > ${quota.agents} for ${label}` }

  if (usage.signalsToday !== undefined && usage.signalsToday > quota.signalsPerDay)
    return {
      ok: false,
      reason: `signalsToday ${usage.signalsToday} > ${quota.signalsPerDay} for ${label}`,
    }

  if (usage.memoryMB !== undefined && usage.memoryMB > quota.memoryMB)
    return { ok: false, reason: `memoryMB ${usage.memoryMB} > ${quota.memoryMB} for ${label}` }

  return { ok: true }
}
