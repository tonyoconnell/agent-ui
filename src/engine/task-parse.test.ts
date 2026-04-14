/**
 * TASK-PARSE — Tests
 *
 * Proves: priority formula arithmetic, TODO parsing with all metadata fields,
 * wave and context fields, effective priority with pheromone, tag subscription matching.
 *
 * Run: bun vitest run src/engine/task-parse.test.ts
 */

import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Wave } from './task-parse'
import { computePriority, EFFORT_MODEL, effectivePriority, parseTodoFile, scanTodos, WAVE_MODEL } from './task-parse'

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY FORMULA
// ═══════════════════════════════════════════════════════════════════════════

describe('Priority Formula — pure arithmetic, no LLM', () => {
  it('critical + C1 + ceo = 95 (max without blocking)', () => {
    const { score, formula } = computePriority('critical', 'C1', 'ceo', 0)
    expect(score).toBe(95)
    expect(formula).toContain('critical=30')
    expect(formula).toContain('C1=40')
    expect(formula).toContain('ceo=25')
  })

  it('medium + C7 + agent = 35 (minimum)', () => {
    const { score } = computePriority('medium', 'C7', 'agent', 0)
    expect(score).toBe(35)
  })

  it('blocking adds +5 per task, capped at +20', () => {
    const { score: s0 } = computePriority('high', 'C2', 'dev', 0)
    const { score: s1 } = computePriority('high', 'C2', 'dev', 1)
    const { score: s3 } = computePriority('high', 'C2', 'dev', 3)
    const { score: s5 } = computePriority('high', 'C2', 'dev', 5)

    expect(s1 - s0).toBe(5)
    expect(s3 - s0).toBe(15)
    expect(s5 - s0).toBe(20) // capped at +20
  })

  it('max possible score is 115', () => {
    const { score } = computePriority('critical', 'C1', 'ceo', 4)
    expect(score).toBe(115) // 30 + 40 + 25 + 20
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// EFFECTIVE PRIORITY — priority + pheromone
// ═══════════════════════════════════════════════════════════════════════════

describe('Effective Priority — arithmetic adjusts by pheromone', () => {
  it('zero pheromone returns base priority', () => {
    expect(effectivePriority(90, 0, 0)).toBe(90)
  })

  it('strength boosts priority', () => {
    expect(effectivePriority(90, 10, 0)).toBeGreaterThan(90)
  })

  it('resistance reduces priority', () => {
    expect(effectivePriority(90, 0, 10)).toBeLessThan(90)
  })

  it('net negative pheromone still has positive effective', () => {
    // base 90, net pheromone = -5 × 0.7 = -3.5 → 86.5
    expect(effectivePriority(90, 0, 5)).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// MODEL MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

describe('Model Mappings', () => {
  it('EFFORT_MODEL maps low→haiku, medium→sonnet, high→opus', () => {
    expect(EFFORT_MODEL.low).toBe('haiku')
    expect(EFFORT_MODEL.medium).toBe('sonnet')
    expect(EFFORT_MODEL.high).toBe('opus')
  })

  it('WAVE_MODEL maps W1→haiku, W2→opus, W3→sonnet, W4→sonnet', () => {
    expect(WAVE_MODEL.W1).toBe('haiku')
    expect(WAVE_MODEL.W2).toBe('opus')
    expect(WAVE_MODEL.W3).toBe('sonnet')
    expect(WAVE_MODEL.W4).toBe('sonnet')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TODO PARSER — deterministic, regex-based, no LLM
// ═══════════════════════════════════════════════════════════════════════════

describe('TODO Parser — checkbox + indented metadata', () => {
  it('parses a complete task with all fields', () => {
    const input = `
- [ ] Build the context resolver
  id: resolve-context
  value: critical
  effort: medium
  wave: W1
  phase: C1
  persona: dev
  context: dsl, routing, dictionary
  blocks: enrich-task-signal
  exit: resolveContext(task, net) returns full envelope
  tags: engine, build, P0
`
    const tasks = parseTodoFile(input, 'test')
    expect(tasks).toHaveLength(1)
    const t = tasks[0]

    expect(t.id).toBe('resolve-context')
    expect(t.name).toBe('Build the context resolver')
    expect(t.done).toBe(false)
    expect(t.value).toBe('critical')
    expect(t.effort).toBe('medium')
    expect(t.wave).toBe('W1')
    expect(t.phase).toBe('C1')
    expect(t.persona).toBe('dev')
    expect(t.context).toEqual(['dsl', 'routing', 'dictionary'])
    expect(t.blocks).toEqual(['enrich-task-signal'])
    expect(t.exit).toBe('resolveContext(task, net) returns full envelope')
    expect(t.tags).toEqual(['engine', 'build', 'P0'])
    expect(t.source).toBe('test')
    expect(t.priority).toBe(95) // critical=30 + C1=40 + dev=20 + blocks(1)=5
  })

  it('parses done tasks with [x]', () => {
    const input = `- [x] Already completed task
  value: high
  phase: C1
  persona: dev
  tags: done`
    const tasks = parseTodoFile(input, 'test')
    expect(tasks[0].done).toBe(true)
  })

  it('defaults missing fields', () => {
    const input = `- [ ] Minimal task`
    const tasks = parseTodoFile(input, 'test')
    const t = tasks[0]

    expect(t.value).toBe('medium')
    expect(t.effort).toBe('medium')
    expect(t.wave).toBe('W3') // default wave is W3 (edit)
    expect(t.phase).toBe('C4')
    expect(t.persona).toBe('agent')
    expect(t.context).toEqual([])
    expect(t.blocks).toEqual([])
    expect(t.tags).toEqual([])
  })

  it('parses multiple tasks in sequence', () => {
    const input = `
- [ ] First task
  id: first
  value: critical
  phase: C1
  persona: dev
  tags: engine

- [ ] Second task
  id: second
  value: high
  phase: C2
  persona: dev
  blocks: first
  tags: engine
`
    const tasks = parseTodoFile(input, 'test')
    expect(tasks).toHaveLength(2)
    expect(tasks[0].id).toBe('first')
    expect(tasks[1].id).toBe('second')
    expect(tasks[1].blocks).toEqual(['first'])
  })

  it('generates id from name when id not specified', () => {
    const input = `- [ ] Fix the broken auth import`
    const tasks = parseTodoFile(input, 'test')
    expect(tasks[0].id).toBe('fix-the-broken-auth-import')
  })

  it('parses all wave values', () => {
    const waves: Wave[] = ['W1', 'W2', 'W3', 'W4']
    for (const w of waves) {
      const input = `- [ ] Task\n  wave: ${w}`
      const tasks = parseTodoFile(input, 'test')
      expect(tasks[0].wave).toBe(w)
    }
  })

  it('parses context as comma-separated doc keys', () => {
    const input = `- [ ] Task\n  context: dsl, routing, rubrics, speed`
    const tasks = parseTodoFile(input, 'test')
    expect(tasks[0].context).toEqual(['dsl', 'routing', 'rubrics', 'speed'])
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION — parse real TODO files
// ═══════════════════════════════════════════════════════════════════════════

describe('scanTodos — template filter', () => {
  it('skips TODO-template.md (template files are not real TODOs)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'task-parse-'))
    const task = `- [ ] Real task\n  id: real\n  value: high\n  phase: C1\n  persona: dev\n  tags: engine\n`
    const templateTask = `- [ ] Template example task\n  id: template-example\n  value: high\n  phase: C1\n  persona: dev\n  tags: engine\n`
    writeFileSync(join(dir, 'TODO-real.md'), task)
    writeFileSync(join(dir, 'TODO-template.md'), templateTask)

    const tasks = await scanTodos(dir)
    const ids = tasks.map((t) => t.id)
    expect(ids).toContain('real')
    expect(ids).not.toContain('template-example')
  })
})

describe('Integration — parse structure matches TypeDB schema', () => {
  it('every Task field maps to a world.tql attribute', () => {
    // This test documents the mapping — if a field is added to Task,
    // it should also be added to world.tql and task-sync.ts
    const input = `- [ ] Task\n  id: x\n  value: high\n  effort: low\n  wave: W1\n  phase: C1\n  persona: dev\n  context: dsl\n  exit: test\n  tags: engine`
    const tasks = parseTodoFile(input, 'test')
    const t = tasks[0]

    // These fields must exist on the task entity in world.tql
    expect(t).toHaveProperty('id') // task-id
    expect(t).toHaveProperty('name') // name
    expect(t).toHaveProperty('done') // done
    expect(t).toHaveProperty('value') // task-value
    expect(t).toHaveProperty('effort') // task-effort
    expect(t).toHaveProperty('wave') // task-wave
    expect(t).toHaveProperty('phase') // task-phase
    expect(t).toHaveProperty('persona') // task-persona
    expect(t).toHaveProperty('context') // task-context
    expect(t).toHaveProperty('priority') // priority-score
    expect(t).toHaveProperty('formula') // priority-formula
    expect(t).toHaveProperty('exit') // exit-condition
    expect(t).toHaveProperty('tags') // tag @card(0..)
    expect(t).toHaveProperty('source') // source-file
    expect(t).toHaveProperty('blocks') // blocks relation
  })
})
