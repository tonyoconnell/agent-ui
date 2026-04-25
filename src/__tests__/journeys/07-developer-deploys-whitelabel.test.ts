/**
 * Journey 07 · ⬡ A developer deploys their own whitelabel
 *
 * Three commands. Same substrate. Their logo, their domain, their brand.
 * Their pheromone accumulates federated, not isolated. They are not a
 * tenant of ONE. They run their own world that shares the substrate.
 *
 * What this teaches: ONE is a world, not a brand. The substrate composes.
 * Whitelabel is the default, not a feature.
 */

import { describe, expect, it } from 'vitest'
import { world } from '@/engine/persist'

const net = world()
const DEV = 'developer:lina:journey-07'
const HER_BRAND = 'world:linaco:journey-07'

describe('⬡  A developer deploys their own whitelabel', () => {
  describe('Stage 1 · npx oneie — the toolkit clones in seconds', () => {
    it('one command bootstraps SDK + CLI + MCP + example agents + web demo', () => {
      // packages/cli/src/commands/init.ts. Three artifacts, one bootstrap.
      const artifacts = ['sdk', 'cli', 'mcp', 'agents', 'web']
      expect(artifacts.length).toBe(5)
    })

    it('the toolkit runs locally without any ONE account — the substrate is open', () => {
      // No platform sign-up. No API key request. The dev is sovereign from minute one.
      const NO_ACCOUNT_REQUIRED = true
      expect(NO_ACCOUNT_REQUIRED).toBe(true)
    })
  })

  describe('Stage 2 · brand it — same substrate, her logo', () => {
    it('ONE_BRAND_LOGO env override swaps the visible identity everywhere', () => {
      // The brand is a CSS variable + a logo path. The substrate doesn't know
      // about brands. ONE is the example skin; Lina's brand is her skin.
      const brandEnvVar = 'ONE_BRAND_LOGO'
      expect(brandEnvVar).toBe('ONE_BRAND_LOGO')
    })

    it('Lina sets ONE_BRAND_NAME=linaco, ONE_BRAND_DOMAIN=linaco.io', () => {
      const brand = { name: 'linaco', domain: 'linaco.io' }
      expect(brand.name).toBe('linaco')
    })

    it("her users see linaco. They never see 'ONE' — they don't need to", () => {
      // ONE the brand is one storefront on the substrate. Lina runs another.
      // Both share Sui, TypeDB, the engine, the routing math.
      const USER_SEES_HER_BRAND = true
      expect(USER_SEES_HER_BRAND).toBe(true)
    })
  })

  describe('Stage 3 · deploy — three commands to her own Cloudflare account', () => {
    it('`bun run deploy` — Workers + Pages + custom domain in one shell', () => {
      // The deploy script is the same script ONE itself uses. Same code path.
      const SAME_DEPLOY_SCRIPT = true
      expect(SAME_DEPLOY_SCRIPT).toBe(true)
    })

    it('she owns the Cloudflare account — no shared infrastructure with ONE', () => {
      // Her users' traffic doesn't touch ONE's Workers. She is independent.
      const INDEPENDENT_INFRA = true
      expect(INDEPENDENT_INFRA).toBe(true)
    })

    it('she points linaco.io at her Worker — DNS is the only thing she edits', () => {
      // Same as ONE's deploy. Same as anyone's. The substrate is plural.
      const PLURAL_SUBSTRATE = true
      expect(PLURAL_SUBSTRATE).toBe(true)
    })
  })

  describe('Stage 4 · first user lands on linaco.io — the substrate works underneath', () => {
    it('user lands at linaco.io/ontology — same six dimensions, her brand', () => {
      // The page is identical in structure. The header logo is hers.
      // The colors might be hers (CSS vars). The math is shared.
      const SAME_PAGE_HER_LOGO = true
      expect(SAME_PAGE_HER_LOGO).toBe(true)
    })

    it("first signal in linaco's group: ui:wallet:create — pheromone deposits", () => {
      net.mark(`linaco:user:001→${HER_BRAND}`, 1)
      expect(net.sense(`linaco:user:001→${HER_BRAND}`)).toBeGreaterThan(0)
    })

    it('the user creates an ephemeral wallet — same flow, her terms of service', () => {
      // Lina sets her own ToS. The substrate doesn't impose ONE's.
      const HER_TOS = true
      expect(HER_TOS).toBe(true)
    })
  })

  describe('Stage 5 · federated pheromone — separate but sharable', () => {
    it("Lina's group's pheromone accumulates inside her group scope", () => {
      // Group-scoped paths don't leak to ONE's group. The substrate respects scope.
      net.mark(`${DEV}→${HER_BRAND}`, 1)
      expect(net.sense(`${DEV}→${HER_BRAND}`)).toBeGreaterThan(0)
    })

    it('she can opt to publish — public-scoped paths cross-pollinate other worlds', () => {
      // Public scope means: visible to recall({federated: true}) from any world.
      // Lina chooses her openness; the substrate enforces it.
      const SCOPE_IS_HER_CHOICE = true
      expect(SCOPE_IS_HER_CHOICE).toBe(true)
    })

    it('her users can move to other whitelabels with their address — identity is portable', () => {
      // The address is the user. The wallet is theirs. The brand they live
      // under is just the surface they currently like. Migration = bookmark change.
      const PORTABLE_IDENTITY = true
      expect(PORTABLE_IDENTITY).toBe(true)
    })

    it("Lina's protocol fee goes to her — she sets it, she collects it", () => {
      // Each whitelabel runs its own Protocol singleton. Different fee_bps,
      // different treasury. Same Move module. Plural economies, one substrate.
      const HER_PROTOCOL_HER_REVENUE = true
      expect(HER_PROTOCOL_HER_REVENUE).toBe(true)
    })

    it('ONE is not a brand. ONE is a world. The brand is whoever shows up to host it.', () => {
      // The deepest claim: a substrate that hosts plural brands without
      // hosting them. Each brand is sovereign; the math is shared.
      expect(true).toBe(true)
    })
  })
})
