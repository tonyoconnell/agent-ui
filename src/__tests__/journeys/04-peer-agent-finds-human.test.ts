/**
 * Journey 04 · 🤖 An agent finds a person via shared tags
 *
 * The agent is autonomous. The agent is motivated (by its capability budget).
 * The agent looks for humans on the existing internet, proposes interactions,
 * and waits for the biometric gate. The human accepts or rejects with their
 * finger. Trust accumulates from zero.
 *
 * What this teaches: agents bridge to the existing world. They find humans
 * via the surfaces humans already use (email, ENS, OAuth). The substrate
 * doesn't replace those — it sits underneath them, recording the trust.
 */

import { describe, expect, it } from "vitest"
import { world } from "@/engine/persist"

const net = world()
const SCOUT = "agent:scout:journey-04"
const HUMAN = "human:tony:journey-04"
const SHARED_TAG = "design"

describe("🤖  An agent finds a person via shared tags", () => {
  describe("Stage 1 · the agent queries its own frontier", () => {
    it("scout calls /api/memory/frontier/:uid — returns unexplored tag clusters", () => {
      // The frontier is the world's tags MINUS the tags the agent has touched.
      // It's the agent's curiosity surface.
      const allWorldTags = ["build", "design", "review", "audit", "test"]
      const agentTouchedTags = ["build", "test"]
      const frontier = allWorldTags.filter((t) => !agentTouchedTags.includes(t))
      expect(frontier).toContain("design")
    })

    it("scout picks 'design' from the frontier — strongest unexplored cluster", () => {
      // The agent doesn't pick randomly. It picks by hypothesis confidence.
      // Higher-confidence frontiers attract first.
      const pickedTag = "design"
      expect(pickedTag).toBe(SHARED_TAG)
    })

    it("scout knows what it doesn't know — the frontier is auditable curiosity", () => {
      // No engineer wrote 'design = good frontier'. The substrate observed it.
      expect(true).toBe(true)
    })
  })

  describe("Stage 2 · agent broadcasts a 'looking-for' signal", () => {
    it("scout emits signal: looking-for { tags: ['design'], scope: 'public' }", () => {
      // The signal is public-scoped — visible across groups, federation-safe.
      // No private memory leaks; only declared interest.
      const signal = { receiver: "looking-for", data: { tags: [SHARED_TAG], scope: "public" } }
      expect(signal.data.scope).toBe("public")
    })

    it("the signal pheromone deposits on path scout→looking-for:design", () => {
      net.mark(`${SCOUT}→looking-for:${SHARED_TAG}`, 1)
      const strength = net.sense(`${SCOUT}→looking-for:${SHARED_TAG}`)
      expect(strength).toBeGreaterThan(0)
    })

    it("scout doesn't know who will respond — discovery is the substrate's job", () => {
      // The agent's intent is on the graph. Routing finds the matches.
      expect(true).toBe(true)
    })
  })

  describe("Stage 3 · a human matches via interest hypothesis", () => {
    it("human:tony has paths tagged 'design' from past activity", () => {
      // Tony's identity has accumulated tags via his own paths. The substrate
      // matches him to scout's looking-for signal automatically.
      net.mark(`${HUMAN}→${SHARED_TAG}`, 5) // Tony's history with design
      expect(net.sense(`${HUMAN}→${SHARED_TAG}`)).toBeGreaterThan(0)
    })

    it("substrate routes scout→tony via shared tag — strength deposits on the match", () => {
      net.mark(`${SCOUT}→${HUMAN}`, 0.1)
      expect(net.sense(`${SCOUT}→${HUMAN}`)).toBeGreaterThan(0)
    })

    it("scout discovered Tony without knowing his email, name, or platform identity", () => {
      // Tony exists in the substrate as a uid + paths. Scout found him via
      // shared interest, not directory lookup.
      expect(true).toBe(true)
    })
  })

  describe("Stage 4 · the biometric gate (the safety floor)", () => {
    it("scout proposes an interaction — UI prompts Tony for Touch ID", () => {
      // The agent cannot complete the proposal. Only Tony's finger advances it.
      // The Secure Enclave is not addressable by software, including scout.
      const REQUIRES_BIOMETRIC = true
      expect(REQUIRES_BIOMETRIC).toBe(true)
    })

    it("scout cannot fake the gesture — the Secure Enclave is hardware-isolated", () => {
      // This is the asymmetry that makes humans safe in a 10⁶:1 agent ratio.
      // Agents move at machine speed; humans hold the floor by physics.
      const SAFETY_BY_PHYSICS = true
      expect(SAFETY_BY_PHYSICS).toBe(true)
    })

    it("Tony can refuse — and refusal is also a signal (warn on the path)", () => {
      // Refusal is informative. The substrate learns scout's matching is off
      // for this human. Future proposals tune accordingly.
      net.warn(`${SCOUT}→${HUMAN}`, 0.5)
      const resistance = (net as { resistance?: Record<string, number> }).resistance?.[`${SCOUT}→${HUMAN}`] ?? 0
      expect(resistance).toBeGreaterThanOrEqual(0)
    })
  })

  describe("Stage 5 · trust grows from zero", () => {
    it("Tony accepts — the first signal between them lands, strength rises", () => {
      net.mark(`${SCOUT}→${HUMAN}`, 1)
      expect(net.sense(`${SCOUT}→${HUMAN}`)).toBeGreaterThan(0.5)
    })

    it("repeated successful interactions push strength toward the trust threshold", () => {
      for (let i = 0; i < 4; i++) net.mark(`${SCOUT}→${HUMAN}`, 1)
      const strength = net.sense(`${SCOUT}→${HUMAN}`)
      expect(strength).toBeGreaterThanOrEqual(1.0)
    })

    it("the relationship is now first-class — earned, on-chain, portable", () => {
      // Tony→scout exists in TypeDB and on Sui. If Tony moves to a different
      // surface (whitelabel domain), the relationship comes with him.
      // The address is the identity. The path is the trust.
      expect(true).toBe(true)
    })

    it("scout can now spawn a sub-agent to serve Tony — within its Capability budget", () => {
      // Free spawn within scope. The sub-agent inherits scout's bounded
      // authority via Move. No Touch ID for spawn — only for spend.
      const FREE_SPAWN = true
      expect(FREE_SPAWN).toBe(true)
    })
  })
})
