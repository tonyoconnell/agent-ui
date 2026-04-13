/**
 * RUBRIC SCORING TESTS — W4 quality gate examples
 *
 * These tests show how work is scored before mark()/warn() is called.
 * Real substrate: rubrics loaded from YAML, LLM-scored by Haiku.
 * Tests: manual scoring to demonstrate the gate.
 */

import { describe, expect, it } from 'vitest'
import { compositeScore, formatRubric, markDims, scoreInterpretation, scoreWork, w4Verify } from './rubric-score'

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
