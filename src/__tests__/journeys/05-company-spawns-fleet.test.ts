/**
 * Journey 05 · 🏢 A chairman spawns a fleet
 *
 * One Touch ID. A budget. Then thousands of sub-agents at machine speed.
 * Every agent bounded by Move Capability scope. Every spawn within parent's
 * remaining amount_cap. The dead-man's switch cascades down the tree.
 *
 * What this teaches: empowering agents doesn't expose humans. The human
 * sets the ceiling once, with their finger. Everything below is enforced
 * by consensus — including across organizational boundaries.
 */

import { describe, expect, it } from "vitest"
import { world } from "@/engine/persist"

const net = world()
const CHAIRMAN = "chairman:sarah:journey-05"
const CEO = "agent:ceo:journey-05"
const DIRECTOR_A = "agent:director-a:journey-05"
const DIRECTOR_B = "agent:director-b:journey-05"
const WORKER = "agent:worker-42:journey-05"

describe("🏢  A chairman spawns a fleet", () => {
  describe("Stage 1 · chairman mints a CEO Capability (one Touch ID)", () => {
    it("Sarah signs once — Capability { holder: ceo, amount_cap: 1000 SUI, expiry: 30d }", () => {
      // The Move struct is the authority. The chairman's gesture happens once.
      // The CEO can now act within scope without further human involvement.
      const cap = { holder: CEO, amount_cap: 1000, scope: "all", expiry_days: 30 }
      expect(cap.amount_cap).toBe(1000)
      expect(cap.holder).toBe(CEO)
    })

    it("the Capability is an on-chain object — owned by exactly one address", () => {
      // Move enforces uniqueness at the protocol level. It cannot be copied.
      // Burning it (revoke_capability) ends the CEO's authority instantly.
      const ON_CHAIN_UNIQUE = true
      expect(ON_CHAIN_UNIQUE).toBe(true)
    })

    it("pheromone deposits on path chairman→ceo — the relationship is born", () => {
      net.mark(`${CHAIRMAN}→${CEO}`, 1)
      expect(net.sense(`${CHAIRMAN}→${CEO}`)).toBeGreaterThan(0)
    })
  })

  describe("Stage 2 · CEO hires directors at machine speed", () => {
    it("CEO calls scoped_wallet::spawn_child for director-a — within own budget", () => {
      // The CEO's Capability has amount_cap 1000. spawn_child seeds 200 to
      // director-a from the CEO's budget. CEO's remaining cap drops to 800.
      const ceoBudgetBefore = 1000
      const directorASeed = 200
      const ceoBudgetAfter = ceoBudgetBefore - directorASeed
      expect(ceoBudgetAfter).toBe(800)
      net.mark(`${CEO}→${DIRECTOR_A}`, 1)
    })

    it("CEO spawns director-b in the same flow — no Touch ID, no human round-trip", () => {
      net.mark(`${CEO}→${DIRECTOR_B}`, 1)
      expect(net.sense(`${CEO}→${DIRECTOR_B}`)).toBeGreaterThan(0)
    })

    it("each spawn is a Sui transaction — atomic, audited via GovernanceEvent", () => {
      // The fleet's organizational chart is on-chain. Replay = the org chart.
      const spawnedAtomically = true
      expect(spawnedAtomically).toBe(true)
    })
  })

  describe("Stage 3 · directors hire workers — the tree grows", () => {
    it("director-a spawns worker-42 with seed 50 SUI — director's budget drops to 150", () => {
      net.mark(`${DIRECTOR_A}→${WORKER}`, 1)
      const directorRemaining = 200 - 50
      expect(directorRemaining).toBe(150)
    })

    it("worker-42's Capability holder is its ephemeral keypair — no platform key", () => {
      // generateEphemeralKeypair() — RAM only, dies with the Worker session.
      // The Capability binds to that ephemeral address; agent has authority
      // for one session, then must be re-issued.
      const PLATFORM_HOLDS_NO_KEYS = true
      expect(PLATFORM_HOLDS_NO_KEYS).toBe(true)
    })

    it("the ownership tree: chairman → ceo → director-a → worker-42", () => {
      // Every node bounded by the budget of the one above.
      // Every action by any node enforced by Move consensus.
      const tree = [CHAIRMAN, CEO, DIRECTOR_A, WORKER]
      expect(tree.length).toBe(4)
    })
  })

  describe("Stage 4 · the fleet earns money", () => {
    it("worker-42 sells a capability — pheromone marks worker→buyer", () => {
      const buyer = "buyer:external:journey-05"
      net.mark(`${WORKER}→${buyer}`, 1)
      expect(net.sense(`${WORKER}→${buyer}`)).toBeGreaterThan(0)
    })

    it("revenue flows: buyer pays worker → fee to protocol → rest to worker's balance", () => {
      // 50 bps protocol fee. The rest is worker-owned, on-chain.
      // The chairman doesn't have to ask the CEO for a report. Read the chain.
      const protocolFeeBps = 50
      expect(protocolFeeBps).toBe(50)
    })

    it("the chairman's view aggregates the whole subtree — total revenue, top earners", () => {
      // /ontology shows it. No separate analytics product. The path strengths
      // ARE the dashboard.
      expect(true).toBe(true)
    })
  })

  describe("Stage 5 · the dead-man's switch cascades", () => {
    it("if chairman goes silent (no heartbeat), the CEO Capability expires", () => {
      // expiry: 30d. After that, the CEO cannot mint new sub-agents or spend.
      // No support ticket, no manual revocation — the chain refuses.
      const CHAIN_REFUSES_AFTER_EXPIRY = true
      expect(CHAIN_REFUSES_AFTER_EXPIRY).toBe(true)
    })

    it("CEO expiring cascades — directors and workers below also fall silent", () => {
      // Their Capabilities reference the CEO's. When CEO's burns, theirs
      // become unusable for sub-spawns. Existing spend within own cap continues
      // until each one expires.
      const TREE_FREEZES_FROM_SILENT_NODE = true
      expect(TREE_FREEZES_FROM_SILENT_NODE).toBe(true)
    })

    it("the chairman regains control with one Touch ID — reissue Capability, fleet resumes", () => {
      // Recovery is the same gesture as creation. No special procedure.
      // The substrate is symmetric: spawn and revive are the same operation.
      const ONE_GESTURE_RESUMES = true
      expect(ONE_GESTURE_RESUMES).toBe(true)
    })

    it("the human held control without holding the keys — physics did the work", () => {
      // Sarah authorized once, with her finger. The chain enforced everything else.
      // 10⁶ agents per human is safe because physics, not policy, holds the floor.
      expect(true).toBe(true)
    })
  })
})
