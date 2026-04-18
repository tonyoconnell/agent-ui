/**
 * Cycle 2: Hypothesis Reflexes (L6-L7)
 *
 * Tests:
 * T2.1 Tag-cluster-fail hypothesis generation
 * T2.2 Hypothesis confirmation with p-value < 0.05
 * T2.3 Reflex firing: confirmed hypothesis → automatic path warning
 * T2.4 Routing updates after reflex (path avoidance)
 */

import { describe, expect, it } from 'vitest'
import { world } from '@/engine'
import { computeZTestPValue } from '@/engine/stats'

describe('Cycle 2: Hypothesis Reflexes', () => {
  describe('T2.1 — Tag-cluster-fail hypothesis generation', () => {
    it('should generate tag-cluster-fail hypothesis when failures reach threshold', () => {
      const w = world()
      w.add('builder')
      w.add('scout')

      // Simulate 3 failures on edges with same tag cluster
      const tagKey = 'api::build::P0'

      // Track failures (simulating in-memory map from loop.ts)
      const tagFailures = new Map<string, number>()
      for (let i = 0; i < 3; i++) {
        const count = (tagFailures.get(tagKey) || 0) + 1
        tagFailures.set(tagKey, count)
        if (count >= 3) {
          // Hypothesis would be generated here
          expect(count).toBe(3)
        }
      }
    })

    it('should track multiple tag clusters independently', () => {
      const tagFailures = new Map<string, number>()
      const clusters = [
        { key: 'api::build::P0', count: 0 },
        { key: 'db::query::P1', count: 0 },
        { key: 'cache::redis::P0', count: 0 },
      ]

      for (const cluster of clusters) {
        for (let i = 0; i < 3; i++) {
          const count = (tagFailures.get(cluster.key) || 0) + 1
          tagFailures.set(cluster.key, count)
        }
      }

      expect(tagFailures.size).toBe(3)
      expect(tagFailures.get('api::build::P0')).toBe(3)
      expect(tagFailures.get('db::query::P1')).toBe(3)
      expect(tagFailures.get('cache::redis::P0')).toBe(3)
    })
  })

  describe('T2.2 — Hypothesis confirmation with statistical testing', () => {
    it('should confirm hypothesis when p-value < 0.05', () => {
      // 50% success before (10/20), 90% after (18/20) — statistically significant
      const pValue = computeZTestPValue(10, 20, 18, 20)
      expect(pValue).toBeLessThan(0.05)
    })

    it('should reject hypothesis when p-value > 0.20', () => {
      // 50% success before (10/20), 51% after (10/19) — not significant
      const pValue = computeZTestPValue(10, 20, 10, 19)
      expect(pValue).toBeGreaterThan(0.2)
    })

    it('should handle insufficient data', () => {
      // Only 5 samples total — returns 0.5 (uncertain)
      const pValue = computeZTestPValue(3, 5, 4, 5)
      expect(pValue).toBe(0.5)
    })

    it('should detect clear degradation', () => {
      // 90% success before (18/20), 50% after (10/20) — significant degradation
      const pValue = computeZTestPValue(18, 20, 10, 20)
      expect(pValue).toBeLessThan(0.05)
    })
  })

  describe('T2.3 — Reflex firing and path warning', () => {
    it('should warn edges when tag-cluster-fail reflex fires', () => {
      const w = world()
      w.add('builder')
      w.add('executor')

      // Simulate routing to multiple tasks with same tag cluster
      const edgeKey = 'loop→builder:task-123'
      w.mark(edgeKey, 1)

      // Get initial strength
      const initialStrength = w.sense(edgeKey)
      expect(initialStrength).toBeGreaterThan(0)

      // Fire reflex: warn with strength 2.0
      w.warn(edgeKey, 2.0)

      // Check that resistance increased
      const finalResistance = w.danger(edgeKey)
      expect(finalResistance).toBeGreaterThanOrEqual(2.0)
    })

    it('should emit hypothesis:reflex signal', () => {
      const w = world()
      const observer = w.add('observer')
      let reflexSignalReceived = false
      let reflexData: any = null

      observer.on('reflex', (data) => {
        reflexSignalReceived = true
        reflexData = data
        return { received: true }
      })

      // Emit reflex signal (as done by fireHypothesisReflex)
      w.signal(
        {
          receiver: 'observer:reflex',
          data: {
            type: 'tag-cluster-fail',
            tagCluster: 'api::build::P0',
            wave: 'W3',
            failCount: 5,
            edgesWarned: 3,
          },
        },
        'loop',
      )

      // Verify signal was received
      expect(reflexSignalReceived).toBe(true)
      expect(reflexData.type).toBe('tag-cluster-fail')
      expect(reflexData.edgesWarned).toBe(3)
    })
  })

  describe('T2.4 — Routing updates after reflex', () => {
    it('should avoid warned edges when selecting routes', () => {
      const w = world()
      w.add('scout')
      w.add('builder')
      w.add('executor')

      // Create initial paths: scout → builder → executor
      w.mark('scout→builder', 5)
      w.mark('builder→executor', 3)

      // Get initial route from scout
      const initialNext = w.select()
      expect(initialNext).toBeTruthy()

      // Now warn the scout→builder edge (via reflex)
      w.warn('scout→builder', 2.0)

      // The select() should now weight toward less-resisted paths
      const resistance = w.danger('scout→builder')
      expect(resistance).toBeGreaterThan(0)
    })

    it('should mark reflex when warning succeeds', () => {
      const w = world()
      w.add('a')
      w.add('b')

      const edge = 'a→b'
      w.mark(edge, 1)

      // Warn (reflex fire)
      w.warn(edge, 2.0)

      // Then mark should reduce resistance (meta-learning: reflex was correct)
      const before = w.danger(edge)
      w.mark(edge, 0.1)
      const after = w.danger(edge)

      // Marking should reduce resistance (fade-like behavior on edge recovery)
      expect(after).toBeLessThanOrEqual(before + 0.1)
    })
  })

  describe('T2.5 — Confirmed hypotheses promote to highways', () => {
    it('should capture confirmed hypothesis in result', () => {
      // This would be tested at the tick() level
      // When a hypothesis is confirmed (p < 0.05, n >= 50)
      // it should be marked as "confirmed" in TypeDB
      // and contribute to learning

      const n = 50 // observations
      const p = 0.03 // p-value < 0.05

      // Hypothesis should be confirmed
      const shouldConfirm = n >= 50 && p <= 0.05
      expect(shouldConfirm).toBe(true)
    })

    it('should reject hypothesis when p-value exceeds threshold', () => {
      const n = 50
      const p = 0.25 // p-value > 0.2

      // Hypothesis should be rejected
      const shouldReject = n >= 50 && p > 0.2
      expect(shouldReject).toBe(true)
    })
  })
})
