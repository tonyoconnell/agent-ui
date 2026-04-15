/**
 * Agents markdown guard — every agents/*.md parses to a valid AgentSpec.
 *
 * Why: an agent with a malformed frontmatter silently drops at sync time —
 * the unit never reaches TypeDB, signals for it dissolve forever. Catching
 * the shape mismatch here prevents a whole class of "why isn't the agent
 * responding" incidents.
 *
 * What we check:
 *  - every .md in agents/** parses without throwing
 *  - each has a non-empty name and a non-empty prompt body
 *  - each skill has a name (price/tags optional, but name required)
 *  - parse time per file stays under 5ms (keeps the gate fast)
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { describe, expect, test } from 'vitest'
import { measureSync } from '@/__tests__/helpers/speed'
import { parse } from '@/engine/agent-md'
import { fastGlob } from './_glob'

// README.md / index.md are directory docs, not agents.
const agentFiles = fastGlob('agents', ['.md']).filter((f) => !/\/(README|index|CLAUDE)\.md$/i.test(f))

describe('agents — markdown shape', () => {
  test(`found ${agentFiles.length} agent markdown files`, () => {
    expect(agentFiles.length).toBeGreaterThan(0)
  })

  test('every agent parses without throwing', () => {
    const failures: Array<{ file: string; error: string }> = []
    for (const file of agentFiles) {
      try {
        const md = readFileSync(file, 'utf8')
        parse(md)
      } catch (err) {
        failures.push({ file: basename(file), error: String(err) })
      }
    }
    if (failures.length > 0) {
      throw new Error(`Failed to parse:\n${failures.map((f) => `  ${f.file}: ${f.error}`).join('\n')}`)
    }
  })

  test('every agent has a name and a non-empty prompt', () => {
    const bad: string[] = []
    for (const file of agentFiles) {
      const md = readFileSync(file, 'utf8')
      const spec = parse(md)
      if (!spec.name) bad.push(`${basename(file)}: missing name`)
      if (!spec.prompt || spec.prompt.trim().length < 10) {
        bad.push(`${basename(file)}: empty or trivial prompt`)
      }
    }
    expect(bad).toEqual([])
  })

  test('every skill has a name', () => {
    const bad: string[] = []
    for (const file of agentFiles) {
      const md = readFileSync(file, 'utf8')
      const spec = parse(md)
      for (const skill of spec.skills ?? []) {
        if (!skill.name) bad.push(`${basename(file)}: unnamed skill`)
      }
    }
    expect(bad).toEqual([])
  })

  test('parse stays under budget (median)', () => {
    const samples: number[] = []
    for (const file of agentFiles) {
      const md = readFileSync(file, 'utf8')
      const ms = measureSync(`agents:parse:${basename(file)}`, () => parse(md), 5)
      samples.push(ms)
    }
    samples.sort((a, b) => a - b)
    const median = samples[Math.floor(samples.length / 2)] ?? 0
    expect(median).toBeLessThan(5) // ms per parse, median
  })
})
