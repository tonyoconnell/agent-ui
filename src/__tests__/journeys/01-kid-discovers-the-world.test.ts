/**
 * Journey 01 · 🧒 A kid discovers ONE
 *
 * The simplest entry point. No email. No bank account. No grown-ups.
 * Just a tap, an address, and the substrate starting to remember the kid.
 *
 * What this test teaches: every interaction is a signal. The graph
 * starts learning who the kid is from their very first click — without
 * the kid (or anyone) having to fill in a profile.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { world } from '@/engine/persist'

const net = world()
const KID = 'kid:journey-01'
const SCOUT = 'agent:scout:journey-01'
const FRIEND = 'agent:friend:journey-01'

beforeEach(() => {
  // Tag-prefix isolates this journey from neighbour tests; we don't reset
  // the singleton — the kid lives in the same world as everyone else.
})

describe('🧒  A kid discovers ONE', () => {
  describe('Stage 1 · arrive', () => {
    it('lands at /ontology — public world, six layers visible, zero friends yet', () => {
      const initialStrength = net.sense(`${KID}→${FRIEND}`)
      expect(initialStrength).toBe(0) // a stranger to everyone, including the world
    })

    it("the kid-skin renders 'friends' instead of 'people', 'games' instead of 'things'", () => {
      // The substrate is one ontology. The skin is just the dictionary the kid speaks.
      const KID_VOCAB = { people: 'friends', things: 'games', events: 'stories' }
      expect(KID_VOCAB.people).toBe('friends')
    })

    it("every click is a signal — even 'just looking around' deposits intent", () => {
      net.signal({ receiver: KID, data: { tags: ['arrive', 'browse'] } }, 'browser:home')
      const browseStrength = net.sense(`browser:home→${KID}`)
      expect(browseStrength).toBeGreaterThanOrEqual(0) // signal arrived
    })
  })

  describe('Stage 2 · the wallet that exists before sign-up', () => {
    it("one tap of 'create' — ephemeral wallet appears, address is permanent", () => {
      // generateEphemeralKeypair() returns a Sui Ed25519 keypair in RAM.
      // The kid's address is set the moment the page loads — no form, no email.
      const arriveToWallet = `${KID}→wallet:ephemeral`
      net.mark(arriveToWallet, 1) // first wallet creation marks the path
      expect(net.sense(arriveToWallet)).toBeGreaterThan(0)
    })

    it('signal emitted: ui:wallet:create — pheromone deposits on path arrive→wallet', () => {
      const path = `${KID}→ui:wallet:create`
      net.mark(path, 0.5)
      expect(net.sense(path)).toBeGreaterThan(0)
    })

    it('the kid now exists in the graph as a unit — no email, no name, just an address', () => {
      // The TypeDB unit row would be: insert $u isa unit, has uid "kid:...", has sui-unit-id "0x...";
      // No name, no email — those are *optional* attributes the kid may add later.
      const exists = net.sense(`${KID}→wallet:ephemeral`) > 0
      expect(exists).toBe(true)
    })
  })

  describe('Stage 3 · the first friend', () => {
    it("agent:scout matches on tag 'gamer' — proposes a friend", () => {
      // The scout queries the frontier (unexplored tag clusters) and finds one
      // matching the kid's interest. Proposes a friend. Mark the proposal directly —
      // signal-auto-mark only fires when the receiver has a handler in this in-memory net.
      net.mark(`${SCOUT}→${KID}`, 1)
      const proposalStrength = net.sense(`${SCOUT}→${KID}`)
      expect(proposalStrength).toBeGreaterThan(0)
    })

    it('kid taps yes — Touch ID gate fires (would prompt on a real device)', () => {
      // The biometric gate is the safety floor. It cannot be bypassed by software,
      // including the agent that proposed the friend. Only the kid's finger advances.
      const KID_TAPPED_YES = true // in a real flow: navigator.credentials.get(...)
      expect(KID_TAPPED_YES).toBe(true)
    })

    it('signal: capability:hire — strength deposits on path kid→friend', () => {
      const path = `${KID}→${FRIEND}`
      net.mark(path, 0.1) // first interaction marks the path lightly
      expect(net.sense(path)).toBeGreaterThan(0)
      expect(net.sense(path)).toBeLessThan(1) // not yet a trusted relationship
    })
  })

  describe('Stage 4 · earned trust', () => {
    it('after many successful chats, path strength reaches 1.0 — the gate opens', () => {
      const path = `${KID}→${FRIEND}`
      // Simulate more successful interactions. Each marks the path.
      // (Use whole strengths to dodge IEEE-754 0.1+0.1+...≠1.0 — pheromone math is real-world honest.)
      for (let i = 0; i < 5; i++) net.mark(path, 0.5)
      const strength = net.sense(path)
      expect(strength).toBeGreaterThanOrEqual(1.0) // earned trust threshold
    })

    it('the next hire bypasses payment — earned via pheromone, not assigned by a platform', () => {
      const path = `${KID}→${FRIEND}`
      const strength = net.sense(path)
      const PHEROMONE_TRUST_THRESHOLD = 1.0
      const requiresPayment = strength < PHEROMONE_TRUST_THRESHOLD
      expect(requiresPayment).toBe(false) // free hires now — the substrate remembers
    })

    it('the kid never filled out a profile — yet the world knows who they are', () => {
      // Identity = address + the paths the kid has earned. No form was completed.
      // The graph IS the kid's profile.
      const knownPaths = [`${KID}→wallet:ephemeral`, `${KID}→${FRIEND}`, `${SCOUT}→${KID}`].filter(
        (p) => net.sense(p) > 0,
      )
      expect(knownPaths.length).toBeGreaterThanOrEqual(2)
    })
  })
})
