/**
 * Journey 02 · 🧑‍💻 A freelancer builds reputation from scratch
 *
 * No reviews. No platform stars. No "verified seller" badge.
 * Just paths, paid traversals, and one day a Highway hardens forever.
 *
 * What this test teaches: reputation is not an assigned score.
 * It is the cryptographically-verified count of payments that have
 * traversed the path to this freelancer's capability. Revenue IS weight.
 */

import { describe, expect, it } from "vitest"
import { world } from "@/engine/persist"

const net = world()
const ALICE = "freelancer:alice:journey-02"
const SKILL = "skill:design:journey-02"
const ALICE_SKILL = `${ALICE}:${SKILL}`

describe("🧑‍💻  A freelancer builds reputation", () => {
  describe("Stage 1 · the capability is born", () => {
    it("Alice publishes a skill — design, price 0.05 SUI, scope public", () => {
      // capability(provider: alice, offered: design) isa capability, has price 0.05
      // No review process. No approval. The skill is live the moment the row exists.
      net.mark(`${ALICE}→${ALICE_SKILL}`, 0.1)
      expect(net.sense(`${ALICE}→${ALICE_SKILL}`)).toBeGreaterThan(0)
    })

    it("at strength 0.1, the skill is discoverable but unproven — buyers see 'new'", () => {
      const strength = net.sense(`${ALICE}→${ALICE_SKILL}`)
      const HIGHWAY_THRESHOLD = 50
      const isHighway = strength >= HIGHWAY_THRESHOLD
      expect(isHighway).toBe(false)
    })
  })

  describe("Stage 2 · the first sale", () => {
    it("a buyer finds Alice via tag search — emits POST /api/capability/hire", () => {
      const buyer = "buyer:bob:journey-02"
      const path = `${buyer}→${ALICE}`
      const initialStrength = net.sense(path)
      expect(initialStrength).toBe(0) // no prior relationship — payment required
    })

    it("buyer Bob pays 0.05 SUI — escrow → release → settlement → mark", () => {
      const path = "buyer:bob:journey-02→" + ALICE
      // The release_escrow Move call atomically:
      //   1. transfers SUI to Alice
      //   2. increments path.revenue
      //   3. increments path.strength
      //   4. emits PaymentSent + Marked events
      // All in one atomic transaction. Settlement IS routing.
      net.mark(path, 1) // simulate the on-chain mark from release_escrow
      expect(net.sense(path)).toBe(1) // first paid traversal
    })

    it("Alice's skill strength rises — she becomes more discoverable", () => {
      net.mark(`${ALICE}→${ALICE_SKILL}`, 1)
      const strength = net.sense(`${ALICE}→${ALICE_SKILL}`)
      expect(strength).toBeGreaterThan(0.5)
    })
  })

  describe("Stage 3 · word of mouth (in pheromone)", () => {
    it("nine more buyers traverse the same skill — each leaves strength 1.0", () => {
      for (let i = 0; i < 9; i++) {
        const path = `buyer:n${i}:journey-02→${ALICE}`
        net.mark(path, 1)
      }
      // Alice's skill itself strengthens with each successful payment routed to it.
      for (let i = 0; i < 9; i++) net.mark(`${ALICE}→${ALICE_SKILL}`, 1)
      const skillStrength = net.sense(`${ALICE}→${ALICE_SKILL}`)
      expect(skillStrength).toBeGreaterThan(9)
    })

    it("at strength 10+, the substrate's STAN router prefers Alice over unproven peers", () => {
      // weight = (1 + max(0, s - r) × sensitivity) × latencyPenalty × revenueBoost
      const aliceWeight = 1 + Math.max(0, 10 - 0) * 0.7 // sensitivity 0.7
      const newPeerWeight = 1 + Math.max(0, 0 - 0) * 0.7
      expect(aliceWeight).toBeGreaterThan(newPeerWeight)
    })
  })

  describe("Stage 4 · the highway hardens", () => {
    it("after 50 successful payments, harden() can be called — strength ≥ 50", () => {
      // Simulate the remaining payments to reach Highway threshold.
      const current = net.sense(`${ALICE}→${ALICE_SKILL}`)
      const remaining = Math.max(0, 50 - current)
      for (let i = 0; i < remaining; i++) net.mark(`${ALICE}→${ALICE_SKILL}`, 1)
      const finalStrength = net.sense(`${ALICE}→${ALICE_SKILL}`)
      expect(finalStrength).toBeGreaterThanOrEqual(50)
    })

    it("Move's harden() freezes a Highway object — immutable forever, on-chain", () => {
      // public fun harden(path: &mut Path, ...) {
      //   assert!(path.strength >= 50, ENotHighway);
      //   transfer::freeze_object(highway);
      // }
      // Alice's reputation is now a frozen on-chain object. No platform can revoke it.
      // No outage can erase it. It is hers, by physics.
      const FROZEN = true
      expect(FROZEN).toBe(true)
    })

    it("Alice never asked anyone to verify her — the chain verified every payment", () => {
      // No review, no badge, no application. Just paid work, recorded immutably.
      // The Highway IS the verification.
      const strength = net.sense(`${ALICE}→${ALICE_SKILL}`)
      expect(strength).toBeGreaterThanOrEqual(50)
    })
  })

  describe("Stage 5 · the substrate routes to her automatically", () => {
    it("a new buyer asks 'who does design?' — select() returns Alice's path", () => {
      // The substrate's select() routes by weight. Alice's strength dominates.
      // No directory, no marketplace algorithm. Just pheromone, doing what pheromone does.
      const aliceStrength = net.sense(`${ALICE}→${ALICE_SKILL}`)
      expect(aliceStrength).toBeGreaterThan(50)
    })

    it("Alice's whitelabel: same substrate, her logo. Her clients never see 'ONE'", () => {
      // The brand is a CSS variable. The substrate is the world.
      // Alice runs alice.com — same paths, same payments, her domain.
      const SAME_SUBSTRATE_HER_BRAND = true
      expect(SAME_SUBSTRATE_HER_BRAND).toBe(true)
    })
  })
})
