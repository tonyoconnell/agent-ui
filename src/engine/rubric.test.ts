/**
 * RUBRIC SCORING TESTS — W4 quality gate examples
 *
 * These tests show how work is scored before mark()/warn() is called.
 * Real substrate: rubrics loaded from YAML, LLM-scored by Haiku.
 * Tests: manual scoring to demonstrate the gate.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_WEIGHTS, markDims as markDimsWeighted, score as parseScore } from './rubric'
import { compositeScore, formatRubric, markDims, scoreInterpretation, scoreWork, w4Verify } from './rubric-score'
import { world as createWorld } from './world'

describe('Rubric Scoring — W4 Quality Gate', () => {
  describe('Golden work (≥0.85 composite)', () => {
    it('Code that hits all four dimensions strongly', () => {
      const task = {
        name: 'Build CEO control panel',
        description: 'Hire/fire/commend/flag agents via UI',
      }

      const result = scoreWork(task, {
        fit: 1.0, // Solves the exact problem: CEO can manage agents
        form: 0.95, // Clean code, tests included, structure clear
        truth: 1.0, // TypeScript types correct, API contract respected
        taste: 0.9, // Matches existing component patterns
      })

      const verify = w4Verify(result)
      expect(verify.pass).toBe(true)
      expect(result.composite).toBeGreaterThanOrEqual(0.85)
      expect(verify.reason).toContain('GOLDEN')
      expect(verify.strength).toBe(result.composite)

      console.log(formatRubric(result, verify))
    })
  })

  describe('Good work (0.65-0.84 composite)', () => {
    it('Code with one weaker dimension', () => {
      const task = {
        name: 'Wire highway visibility',
        description: 'Show top 10 performers in CEO dashboard',
      }

      const result = scoreWork(task, {
        fit: 0.95, // Solves the problem
        form: 0.7, // Some code could be refactored, but works
        truth: 0.85, // Mostly correct, one edge case not covered
        taste: 0.8, // Generally matches style, one pattern off
      })

      const verify = w4Verify(result)
      expect(verify.pass).toBe(true)
      expect(result.composite).toBeGreaterThanOrEqual(0.65)
      expect(result.composite).toBeLessThan(0.85)
      expect(verify.reason).toContain('GOOD')
      expect(verify.strength).toBeLessThan(0.85)

      console.log(formatRubric(result, verify))
    })
  })

  describe('Borderline work (0.50-0.64 composite) — do not mark', () => {
    it('Code that works but needs refinement', () => {
      const task = {
        name: 'Implement isToxic() blocking',
        description: 'Resistance >= 10 AND resistance > 2× strength',
      }

      const result = scoreWork(task, {
        fit: 0.75, // Core logic mostly works
        form: 0.5, // Tests pass but coverage incomplete
        truth: 0.5, // Mostly correct but edge cases fuzzy
        taste: 0.55, // Code style somewhat inconsistent
      })

      const verify = w4Verify(result)
      expect(verify.pass).toBe(false)
      expect(result.composite).toBeLessThan(0.65)
      expect(verify.reason).toContain('BORDERLINE')
      expect(verify.reason).toContain('< 0.65')

      console.log(formatRubric(result, verify))
    })
  })

  describe('Failed work (<0.50 composite or violations) — warn()', () => {
    it('Code that breaks existing tests', () => {
      const task = {
        name: 'Add mark/warn on status change',
        description: 'Call mark() when task status changes',
      }

      const result = scoreWork(task, {
        fit: 0.4, // Incomplete: only handles one status
        form: 0.3, // New tests fail, existing tests broken
        truth: 0.25, // Incorrect: doesn't respect pheromone semantics
        taste: 0.5, // At least follows basic pattern
        violations: ['broke existing tests', 'pheromone semantics violated (marked on wrong edge)'],
      })

      const verify = w4Verify(result)
      expect(verify.pass).toBe(false)
      expect(verify.reason).toContain('VIOLATIONS')
      expect(result.violations.length).toBeGreaterThan(0)

      console.log(formatRubric(result, verify))
    })

    it('Code with weak dimension below 0.5', () => {
      const task = {
        name: 'Add drag-drop cascade',
        description: 'Unblock dependent tasks on complete',
      }

      const result = scoreWork(task, {
        fit: 0.9, // Solves the problem
        form: 0.88, // Good structure
        truth: 0.4, // TypeScript: cascading logic is wrong (breaks type contracts)
        taste: 0.85, // Matches code style
      })

      const verify = w4Verify(result)
      expect(verify.pass).toBe(false)
      expect(verify.reason).toContain('WEAK DIMENSIONS')
      expect(verify.reason).toContain('truth')

      console.log(formatRubric(result, verify))
    })
  })

  describe('Dimension weighting examples', () => {
    it('Perfect fit/form/taste cannot compensate for broken truth', () => {
      // Scenario: Code looks good, works locally, but hallucinated an API
      const result = scoreWork(
        { name: 'Test', description: 'Test' },
        {
          fit: 1.0,
          form: 1.0,
          truth: 0.0, // TypeDB query: API doesn't exist
          taste: 1.0,
        },
      )
      const composite = compositeScore({ fit: 1.0, form: 1.0, truth: 0.0, taste: 1.0 })
      expect(composite).toEqual(0.35 + 0.2 + 0 + 0.15) // = 0.70 but truth gate below 0.5
      const verify = w4Verify(result)
      expect(verify.pass).toBe(false)
      expect(verify.reason).toContain('truth')
    })

    it('Interpretation thresholds match gate levels', () => {
      expect(scoreInterpretation(0.9)).toBe('golden')
      expect(scoreInterpretation(0.75)).toBe('good')
      expect(scoreInterpretation(0.55)).toBe('borderline')
      expect(scoreInterpretation(0.3)).toBe('failed')
    })
  })

  describe('Pheromone marking strategy', () => {
    it('Golden work strengthens path with full composite score', () => {
      const result = scoreWork(
        { name: 'Test', description: 'Test' },
        { fit: 0.95, form: 0.9, truth: 0.92, taste: 0.88 },
      )
      const verify = w4Verify(result)

      // Composite = 0.35·0.95 + 0.20·0.90 + 0.30·0.92 + 0.15·0.88 = 0.9205
      expect(verify.strength).toBeCloseTo(0.9205, 2)
      // In substrate: path accumulates strength at the composite level
      // Next 100 signals using this path will be weighted by this strength
    })

    it('Good work strengthens path with reduced strength', () => {
      const result = scoreWork({ name: 'Test', description: 'Test' }, { fit: 0.85, form: 0.7, truth: 0.8, taste: 0.75 })
      const verify = w4Verify(result)

      // Composite = 0.35·0.85 + 0.20·0.70 + 0.30·0.80 + 0.15·0.75 = 0.7875
      expect(verify.strength).toBeCloseTo(0.7875, 2)
      // Path still strengthens, but routing will prefer the golden path next time
    })

    it('Borderline work gets no pheromone (do not mark)', () => {
      const result = scoreWork(
        { name: 'Test', description: 'Test' },
        { fit: 0.8, form: 0.6, truth: 0.45, taste: 0.7 }, // truth < 0.5 triggers WEAK_DIMENSIONS
      )
      const verify = w4Verify(result)

      expect(verify.pass).toBe(false)
      expect(verify.strength).toBeUndefined()
      // In substrate: warn() is called, path gets resistance instead
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// markDims — 4 tagged edges per rubric score
// ═══════════════════════════════════════════════════════════════════════════

describe('markDims — tagged edge marks', () => {
  it('marks strong dimensions (>= 0.65)', () => {
    const marks: [string, number][] = []
    const warns: [string, number][] = []
    const net = {
      mark: (p: string, a?: number) => {
        marks.push([p, a ?? 1])
      },
      warn: (p: string, a?: number) => {
        warns.push([p, a ?? 1])
      },
    }

    markDims(net, 'scout→analyst', {
      fit: 0.9,
      form: 0.8,
      truth: 1.0,
      taste: 0.7,
      violations: [],
      composite: 0.88,
    })

    expect(marks.length).toBe(4) // all dims >= 0.65
    expect(marks[0]).toEqual(['scout→analyst:fit', 0.9])
    expect(marks[2]).toEqual(['scout→analyst:truth', 1.0])
    expect(warns.length).toBe(0)
  })

  it('warns weak dimensions (< 0.5)', () => {
    const marks: [string, number][] = []
    const warns: [string, number][] = []
    const net = {
      mark: (p: string, a?: number) => {
        marks.push([p, a ?? 1])
      },
      warn: (p: string, a?: number) => {
        warns.push([p, a ?? 1])
      },
    }

    markDims(net, 'scout→analyst', {
      fit: 0.9,
      form: 0.3,
      truth: 0.4,
      taste: 0.8,
      violations: [],
      composite: 0.6,
    })

    expect(marks.length).toBe(2) // fit + taste >= 0.65
    expect(warns.length).toBe(2) // form + truth < 0.5
    expect(warns[0]).toEqual(['scout→analyst:form', 0.7]) // 1 - 0.3
    expect(warns[1]).toEqual(['scout→analyst:truth', 0.6]) // 1 - 0.4
  })

  it('borderline dimensions (0.5-0.64) are neutral — no mark, no warn', () => {
    const marks: [string, number][] = []
    const warns: [string, number][] = []
    const net = {
      mark: (p: string, a?: number) => {
        marks.push([p, a ?? 1])
      },
      warn: (p: string, a?: number) => {
        warns.push([p, a ?? 1])
      },
    }

    markDims(net, 'scout→analyst', {
      fit: 0.55,
      form: 0.6,
      truth: 0.52,
      taste: 0.64,
      violations: [],
      composite: 0.57,
    })

    expect(marks.length).toBe(0) // all borderline
    expect(warns.length).toBe(0) // none below 0.5
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// End-to-end: Rubric → Feedback Signal → Tag pheromone → Routing
// ═══════════════════════════════════════════════════════════════════════════

describe('Rubric → Feedback Signal integration', () => {
  /**
   * This is the full intelligence emergence loop:
   *
   *   Score work (rubric)
   *     → markDims deposits on agent→skill:dim edges (quality per dimension)
   *     → loop:feedback deposits on tag:X edges (quality per task type)
   *     → future select() follows tag paths toward what worked
   *
   * Two different pheromone deposits, two different routing effects:
   *   markDims  → routes which AGENT handles which skill best (specialist routing)
   *   feedback  → routes which TASK TYPE gets assigned to which path (queue routing)
   */
  function bootFeedbackNet() {
    const net = createWorld()
    const marks: [string, number][] = []
    const warns: [string, number][] = []

    // Register loop:feedback (same as boot.ts)
    net.add('loop').on('feedback', (data: unknown) => {
      const d = data as { tags?: string[]; strength?: number; outcome?: string } | null
      const tags = d?.tags ?? []
      const strength = d?.strength ?? 0
      const outcome = d?.outcome ?? 'result'
      for (const tag of tags) {
        const edge = `tag:${tag}`
        if (outcome === 'failure') net.warn(edge, 1)
        else if (outcome === 'dissolved') net.warn(edge, 0.5)
        else if (strength >= 0.65) net.mark(edge, strength * 5)
        else net.warn(edge, 0.5)
      }
    })

    return { net, marks, warns }
  }

  it('golden work deposits on both skill:dim edges AND tag edges', async () => {
    const { net } = bootFeedbackNet()
    const scores = { fit: 0.95, form: 0.9, truth: 1.0, taste: 0.88 }

    // Step 1: markDims — deposits per-dimension quality on skill paths
    markDimsWeighted(net, 'entry→builder', scores)

    // Step 2: feedback signal — deposits quality per task-type tag
    const composite = 0.35 * scores.fit + 0.2 * scores.form + 0.3 * scores.truth + 0.15 * scores.taste
    await net.ask({
      receiver: 'loop:feedback',
      data: { tags: ['engine', 'P0'], strength: composite, outcome: 'result' },
    })

    // markDims created tagged skill edges
    expect(net.sense('entry→builder:fit')).toBeGreaterThan(0)
    expect(net.sense('entry→builder:truth')).toBeGreaterThan(0)

    // feedback created tag routing edges
    expect(net.sense('tag:engine')).toBeGreaterThan(0)
    expect(net.sense('tag:P0')).toBeGreaterThan(0)
  })

  it('weak truth score warns the truth edge AND the feedback signal warns tag paths', async () => {
    const { net } = bootFeedbackNet()
    const scores = { fit: 0.9, form: 0.85, truth: 0.3, taste: 0.8 } // truth is bad

    markDimsWeighted(net, 'entry→agent', scores)

    const composite = 0.35 * scores.fit + 0.2 * scores.form + 0.3 * scores.truth + 0.15 * scores.taste
    // composite ≈ 0.35*0.9 + 0.20*0.85 + 0.30*0.3 + 0.15*0.8 = 0.315+0.17+0.09+0.12 = 0.695
    // composite >= 0.65 but truth < 0.5 → w4Verify fails, feedback still emitted

    await net.ask({
      receiver: 'loop:feedback',
      data: { tags: ['build'], strength: composite, outcome: 'result' },
    })

    // truth edge is warned (score < 0.5)
    expect(net.danger('entry→agent:truth')).toBeGreaterThan(0)
    expect(net.sense('entry→agent:truth')).toBe(0)

    // But composite >= 0.65, so tag path is still marked (feedback uses composite, not dims)
    expect(net.sense('tag:build')).toBeGreaterThan(0)
  })

  it('failure wipes out tag routing regardless of rubric scores', async () => {
    const { net } = bootFeedbackNet()

    // Imagine the code compiled but tests failed → outcome = failure
    await net.ask({
      receiver: 'loop:feedback',
      data: { tags: ['security', 'P0'], strength: 0.9, outcome: 'failure' },
    })

    // No matter how high the strength, failure always warns
    expect(net.sense('tag:security')).toBe(0)
    expect(net.danger('tag:security')).toBe(1)
  })

  it('after 5 golden cycles on engine tasks, engine path has highway-level strength', async () => {
    const { net } = bootFeedbackNet()

    for (let i = 0; i < 5; i++) {
      await net.ask({
        receiver: 'loop:feedback',
        data: { tags: ['engine'], strength: 0.9, outcome: 'result' },
      })
    }

    // 5 × (0.9 × 5) = 22.5 strength on tag:engine — well above highway threshold of 20
    const engineStrength = net.sense('tag:engine')
    expect(engineStrength).toBeGreaterThanOrEqual(20) // highway territory
    expect(net.isHighway('tag:engine', 20)).toBe(true)
  })

  it('mixed signals: engine tasks converge, flaky tasks diverge', async () => {
    const { net } = bootFeedbackNet()

    // engine tasks: consistently golden
    for (let i = 0; i < 3; i++) {
      await net.ask({
        receiver: 'loop:feedback',
        data: { tags: ['engine'], strength: 0.9, outcome: 'result' },
      })
    }

    // deploy tasks: mixed (2 fail, 1 weak success — strength 0.4 < 0.65 → warns, not marks)
    await net.ask({ receiver: 'loop:feedback', data: { tags: ['deploy'], strength: 0.8, outcome: 'failure' } })
    await net.ask({ receiver: 'loop:feedback', data: { tags: ['deploy'], strength: 0.8, outcome: 'failure' } })
    await net.ask({ receiver: 'loop:feedback', data: { tags: ['deploy'], strength: 0.4, outcome: 'result' } })
    // failures: warn(1)×2 → resistance=2; weak success: warn(0.5) → resistance=2.5; strength=0 → net=-2.5

    const engineNet = net.sense('tag:engine') - net.danger('tag:engine')
    const deployNet = net.sense('tag:deploy') - net.danger('tag:deploy')

    // Engine path should be strongly positive; deploy should be negative (all warns, no marks)
    expect(engineNet).toBeGreaterThan(0)
    expect(deployNet).toBeLessThan(0)

    // The substrate now avoids deploying (toxic path) and prefers engine work (proven path)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// markDims (rubric.ts) — weighted tagged edges, threshold at 0.5
// ═══════════════════════════════════════════════════════════════════════════

describe('markDims (rubric.ts) — weighted pheromone per dimension', () => {
  function mockNet() {
    const marks: [string, number][] = []
    const warns: [string, number][] = []
    return {
      net: {
        mark: (p: string, a?: number) => {
          marks.push([p, a ?? 1])
        },
        warn: (p: string, a?: number) => {
          warns.push([p, a ?? 1])
        },
      },
      marks,
      warns,
    }
  }

  it('marks all 4 edges when all scores >= 0.5 (default weights)', () => {
    const { net, marks, warns } = mockNet()

    markDimsWeighted(net, 'a→b', { fit: 0.9, form: 0.8, truth: 1.0, taste: 0.7 })

    expect(marks.length).toBe(4)
    expect(warns.length).toBe(0)

    // fit:  0.9 × 0.35 = 0.315
    expect(marks[0]).toEqual(['a→b:fit', 0.9 * DEFAULT_WEIGHTS.fit])
    // form: 0.8 × 0.20 = 0.16
    expect(marks[1]).toEqual(['a→b:form', 0.8 * DEFAULT_WEIGHTS.form])
    // truth: 1.0 × 0.30 = 0.30
    expect(marks[2]).toEqual(['a→b:truth', 1.0 * DEFAULT_WEIGHTS.truth])
    // taste: 0.7 × 0.15 = 0.105
    expect(marks[3]).toEqual(['a→b:taste', 0.7 * DEFAULT_WEIGHTS.taste])
  })

  it('warns dimensions whose score < 0.5', () => {
    const { net, marks, warns } = mockNet()

    markDimsWeighted(net, 'entry→worker', { fit: 0.9, form: 0.3, truth: 0.4, taste: 0.8 })

    expect(marks.length).toBe(2) // fit + taste
    expect(warns.length).toBe(2) // form + truth

    // form: (1 - 0.3) × 0.20 = 0.14
    expect(warns[0]).toEqual(['entry→worker:form', (1 - 0.3) * DEFAULT_WEIGHTS.form])
    // truth: (1 - 0.4) × 0.30 = 0.18
    expect(warns[1]).toEqual(['entry→worker:truth', (1 - 0.4) * DEFAULT_WEIGHTS.truth])
  })

  it('boundary: score == 0.5 triggers mark, not warn', () => {
    const { net, marks, warns } = mockNet()

    markDimsWeighted(net, 'x→y', { fit: 0.5, form: 0.5, truth: 0.5, taste: 0.5 })

    expect(marks.length).toBe(4)
    expect(warns.length).toBe(0)
  })

  it('score just below 0.5 triggers warn', () => {
    const { net, marks, warns } = mockNet()

    markDimsWeighted(net, 'x→y', { fit: 0.49, form: 0.49, truth: 0.49, taste: 0.49 })

    expect(marks.length).toBe(0)
    expect(warns.length).toBe(4)
  })

  it('custom dimension weights override defaults', () => {
    const { net, marks } = mockNet()

    const custom = {
      fit: { weight: 1.0 },
      form: { weight: 0.0 },
      truth: { weight: 0.5 },
      taste: { weight: 0.5 },
    }

    markDimsWeighted(net, 'a→b', { fit: 0.8, form: 0.9, truth: 0.7, taste: 0.6 }, custom)

    // fit:   0.8 × 1.0 = 0.8
    expect(marks[0]).toEqual(['a→b:fit', 0.8])
    // form:  0.9 × 0.0 = 0  → still marks (score >= 0.5) but amount is 0
    expect(marks[1]).toEqual(['a→b:form', 0])
    // truth: 0.7 × 0.5 = 0.35
    expect(marks[2]).toEqual(['a→b:truth', 0.35])
    // taste: 0.6 × 0.5 = 0.3
    expect(marks[3]).toEqual(['a→b:taste', 0.3])
  })

  it('tagged edge format uses colon separator', () => {
    const { net, marks } = mockNet()

    markDimsWeighted(net, 'entry→wave-runner', { fit: 0.9, form: 0.8, truth: 1.0, taste: 0.7 })

    expect(marks.map(([p]) => p)).toEqual([
      'entry→wave-runner:fit',
      'entry→wave-runner:form',
      'entry→wave-runner:truth',
      'entry→wave-runner:taste',
    ])
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// score() function — heuristic fallback when no LLM response
// ═══════════════════════════════════════════════════════════════════════════

describe('score() — heuristic fallback for LLM response parsing', () => {
  it('extracts numeric dimension scores from verdict text', () => {
    const verdict = 'PASS: fit: 0.9 form: 0.85 truth: 0.95 taste: 0.8'

    const parsed = parseScore(verdict)

    expect(parsed.fit).toBe(0.9)
    expect(parsed.form).toBe(0.85)
    expect(parsed.truth).toBe(0.95)
    expect(parsed.taste).toBe(0.8)
    expect(parsed.violations).toEqual([])
  })

  it('clamps numeric scores to [0, 1] range (for positive values)', () => {
    const verdict = 'fit: 1.5 form: 0.3 truth: 2.0 taste: 0.5'
    const parsed = parseScore(verdict)

    expect(parsed.fit).toBe(1)
    expect(parsed.form).toBe(0.3)
    expect(parsed.truth).toBe(1)
    expect(parsed.taste).toBe(0.5)
  })

  it('falls back to PASS heuristic when no numeric scores found', () => {
    const verdict = 'PASS: Code looks great overall'
    const parsed = parseScore(verdict)

    expect(parsed.fit).toBe(0.85)
    expect(parsed.form).toBe(0.75)
    expect(parsed.truth).toBe(0.8)
    expect(parsed.taste).toBe(0.75)
    expect(parsed.violations).toEqual([])
  })

  it('falls back to FAIL heuristic when no numeric scores and verdict is not PASS', () => {
    const verdict = 'FAIL: Tests broke, schema mismatch'
    const parsed = parseScore(verdict)

    expect(parsed.fit).toBe(0.15)
    expect(parsed.form).toBe(0.5)
    expect(parsed.truth).toBe(0.5)
    expect(parsed.taste).toBe(0.5)
    expect(parsed.violations).toEqual(['FAIL: Tests broke, schema mismatch'])
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// score() → [0,1] ranges for all dimensions
// ═══════════════════════════════════════════════════════════════════════════

describe('score() return values — bounded to [0,1]', () => {
  it('returns all dimensions in [0, 1] for PASS verdict', () => {
    const parsed = parseScore('PASS')

    expect(parsed.fit).toBeGreaterThanOrEqual(0)
    expect(parsed.fit).toBeLessThanOrEqual(1)
    expect(parsed.form).toBeGreaterThanOrEqual(0)
    expect(parsed.form).toBeLessThanOrEqual(1)
    expect(parsed.truth).toBeGreaterThanOrEqual(0)
    expect(parsed.truth).toBeLessThanOrEqual(1)
    expect(parsed.taste).toBeGreaterThanOrEqual(0)
    expect(parsed.taste).toBeLessThanOrEqual(1)
  })

  it('returns all dimensions in [0, 1] for FAIL verdict', () => {
    const parsed = parseScore('FAIL')

    expect(parsed.fit).toBeGreaterThanOrEqual(0)
    expect(parsed.fit).toBeLessThanOrEqual(1)
    expect(parsed.form).toBeGreaterThanOrEqual(0)
    expect(parsed.form).toBeLessThanOrEqual(1)
    expect(parsed.truth).toBeGreaterThanOrEqual(0)
    expect(parsed.truth).toBeLessThanOrEqual(1)
    expect(parsed.taste).toBeGreaterThanOrEqual(0)
    expect(parsed.taste).toBeLessThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Gate threshold at 0.65 composite — pass/no-pass boundary
// ═══════════════════════════════════════════════════════════════════════════

describe('w4Verify gate threshold 0.65 — pass/fail boundary', () => {
  it('composite exactly 0.65 passes', () => {
    const result = scoreWork(
      { name: 'Test', description: 'Test' },
      { fit: 0.65, form: 0.65, truth: 0.65, taste: 0.65 }, // all 0.65 → composite = 0.65
    )
    const verify = w4Verify(result)

    expect(verify.pass).toBe(true)
    expect(verify.reason).toContain('GOOD')
    expect(verify.strength).toBeDefined()
  })

  it('composite just below 0.65 fails (borderline)', () => {
    // Construct scores that total just below 0.65
    const result = scoreWork(
      { name: 'Test', description: 'Test' },
      { fit: 0.6, form: 0.6, truth: 0.6, taste: 0.6 }, // composite ≈ 0.60 < 0.65
    )
    const verify = w4Verify(result)

    expect(verify.pass).toBe(false)
    expect(verify.reason).toContain('BORDERLINE')
    expect(verify.reason).toContain('< 0.65')
    expect(verify.strength).toBeUndefined()
  })

  it('all dims >= 0.65 but composite < 0.85 stays GOOD, not GOLDEN', () => {
    const result = scoreWork(
      { name: 'Test', description: 'Test' },
      { fit: 0.75, form: 0.7, truth: 0.72, taste: 0.7 }, // composite ≈ 0.7195 ∈ [0.65, 0.85)
    )
    const verify = w4Verify(result)

    expect(verify.pass).toBe(true)
    expect(verify.reason).toContain('GOOD')
    expect(verify.reason).not.toContain('GOLDEN')
  })
})
