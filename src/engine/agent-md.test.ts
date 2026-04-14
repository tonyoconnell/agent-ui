/**
 * agent-md.test.ts — Test markdown agent parsing and TypeDB generation
 *
 * Tests parse() (frontmatter + body extraction) and toTypeDB() (TQL insert generation).
 * Both are pure functions — no TypeDB mocking needed.
 */

import { describe, expect, it } from 'vitest'
import type { AgentSpec, WorldSpec } from './agent-md'
import { parse, toTypeDB, worldToTypeDB } from './agent-md'

// ── Minimal valid markdown ─────────────────────────────────────────────────

const MINIMAL_MD = `---
name: tutor
---

You are a tutor.`

const FULL_MD = `---
name: creative
model: claude-sonnet-4-20250514
channels: [telegram, discord]
group: marketing
sensitivity: 0.6
tags: [creative, content]
skills:
  - name: copy
    price: 0.02
    tags: [creative, copy, headlines]
  - name: iterate
    price: 0.01
    tags: [creative, iteration]
    description: Iterate on existing copy
---

You are the Creative Director. Generate compelling copy.`

describe('agent-md.ts — parse() and toTypeDB()', () => {
  describe('parse() — frontmatter extraction', () => {
    it('should parse minimal agent name', () => {
      const spec = parse(MINIMAL_MD)
      expect(spec.name).toBe('tutor')
    })

    it('should extract system prompt from body after frontmatter', () => {
      const spec = parse(MINIMAL_MD)
      expect(spec.prompt).toBe('You are a tutor.')
    })

    it('should parse all scalar fields', () => {
      const spec = parse(FULL_MD)
      expect(spec.name).toBe('creative')
      expect(spec.model).toBe('claude-sonnet-4-20250514')
      expect(spec.group).toBe('marketing')
      expect(spec.sensitivity).toBe(0.6)
    })

    it('should parse channels as an array', () => {
      const spec = parse(FULL_MD)
      expect(spec.channels).toEqual(['telegram', 'discord'])
    })

    it('should parse tags as an array', () => {
      const spec = parse(FULL_MD)
      expect(spec.tags).toEqual(['creative', 'content'])
    })

    it('should parse skills with name, price, and tags', () => {
      const spec = parse(FULL_MD)
      expect(spec.skills).toHaveLength(2)
      expect(spec.skills![0].name).toBe('copy')
      expect(spec.skills![0].price).toBe(0.02)
      expect(spec.skills![0].tags).toEqual(['creative', 'copy', 'headlines'])
    })

    it('should parse skill description', () => {
      const spec = parse(FULL_MD)
      const iterate = spec.skills!.find((s) => s.name === 'iterate')
      expect(iterate?.description).toBe('Iterate on existing copy')
    })

    it('should extract multi-line prompt body', () => {
      const md = `---
name: writer
---

First line.
Second line.
Third line.`
      const spec = parse(md)
      expect(spec.prompt).toContain('First line.')
      expect(spec.prompt).toContain('Second line.')
      expect(spec.prompt).toContain('Third line.')
    })

    it('should handle missing optional fields gracefully', () => {
      const spec = parse(MINIMAL_MD)
      expect(spec.model).toBeUndefined()
      expect(spec.group).toBeUndefined()
      expect(spec.skills).toBeUndefined()
      expect(spec.channels).toBeUndefined()
    })

    it('should parse aliases block', () => {
      const md = `---
name: scout
aliases:
  ant: scout-7
  brain: neuron-12
---

You are a scout.`
      const spec = parse(md)
      expect(spec.aliases).toBeDefined()
      expect(spec.aliases!.ant).toBe('scout-7')
      expect(spec.aliases!.brain).toBe('neuron-12')
    })

    it('should return empty prompt for no body', () => {
      const md = `---
name: empty
---`
      const spec = parse(md)
      expect(spec.prompt).toBe('')
    })

    it('should parse context array', () => {
      const md = `---
name: agent
context: [routing, dsl, dictionary]
---

Body.`
      const spec = parse(md)
      expect(spec.context).toEqual(['routing', 'dsl', 'dictionary'])
    })
  })

  describe('toTypeDB() — TQL insert generation', () => {
    it('should generate a unit insert query', () => {
      const spec: AgentSpec = { name: 'tutor', prompt: 'You are a tutor.' }
      const queries = toTypeDB(spec)
      const unitInsert = queries.find((q) => q.includes('isa unit'))
      expect(unitInsert).toBeDefined()
      expect(unitInsert).toContain('has uid "tutor"')
      expect(unitInsert).toContain('has name "tutor"')
      expect(unitInsert).toContain('has unit-kind "agent"')
    })

    it('should use group:name as uid when group is set', () => {
      const spec: AgentSpec = { name: 'creative', group: 'marketing', prompt: '' }
      const queries = toTypeDB(spec)
      const unitInsert = queries.find((q) => q.includes('isa unit'))
      expect(unitInsert).toContain('has uid "marketing:creative"')
    })

    it('should use default model when model is not specified', () => {
      const spec: AgentSpec = { name: 'tutor', prompt: '' }
      const queries = toTypeDB(spec)
      const unitInsert = queries.find((q) => q.includes('isa unit'))
      expect(unitInsert).toContain('claude-sonnet-4-20250514')
    })

    it('should use specified model', () => {
      const spec: AgentSpec = {
        name: 'fast',
        model: 'anthropic/claude-haiku-4-5',
        prompt: '',
      }
      const queries = toTypeDB(spec)
      const unitInsert = queries.find((q) => q.includes('isa unit'))
      expect(unitInsert).toContain('claude-haiku-4-5')
    })

    it('should include tags in unit insert', () => {
      const spec: AgentSpec = { name: 'coder', tags: ['code', 'build'], prompt: '' }
      const queries = toTypeDB(spec)
      const unitInsert = queries.find((q) => q.includes('isa unit'))
      expect(unitInsert).toContain('has tag "code"')
      expect(unitInsert).toContain('has tag "build"')
    })

    it('should auto-tag with group name', () => {
      const spec: AgentSpec = { name: 'writer', group: 'content', prompt: '' }
      const queries = toTypeDB(spec)
      const unitInsert = queries.find((q) => q.includes('isa unit'))
      expect(unitInsert).toContain('has tag "content"')
    })

    it('should generate group membership query when group is set', () => {
      const spec: AgentSpec = { name: 'creative', group: 'marketing', prompt: '' }
      const queries = toTypeDB(spec)
      const membership = queries.find((q) => q.includes('isa membership'))
      expect(membership).toBeDefined()
      expect(membership).toContain('gid "marketing"')
      expect(membership).toContain('uid "marketing:creative"')
    })

    it('should not generate membership query when no group', () => {
      const spec: AgentSpec = { name: 'solo', prompt: '' }
      const queries = toTypeDB(spec)
      const membership = queries.find((q) => q.includes('isa membership'))
      expect(membership).toBeUndefined()
    })

    it('should generate skill and capability queries per skill', () => {
      const spec: AgentSpec = {
        name: 'tutor',
        prompt: '',
        skills: [{ name: 'teach', price: 0.05, tags: ['edu'] }],
      }
      const queries = toTypeDB(spec)
      const skillInsert = queries.find((q) => q.includes('isa skill'))
      const capabilityInsert = queries.find((q) => q.includes('isa capability'))
      expect(skillInsert).toBeDefined()
      expect(skillInsert).toContain('skill-id "teach"')
      expect(skillInsert).toContain('has price 0.05')
      expect(capabilityInsert).toBeDefined()
    })

    it('should prefix skill-id with group when group is set', () => {
      const spec: AgentSpec = {
        name: 'creative',
        group: 'marketing',
        prompt: '',
        skills: [{ name: 'copy', price: 0.02 }],
      }
      const queries = toTypeDB(spec)
      const skillInsert = queries.find((q) => q.includes('isa skill'))
      expect(skillInsert).toContain('skill-id "marketing:copy"')
    })

    it('should escape quotes in system prompt', () => {
      const spec: AgentSpec = {
        name: 'agent',
        prompt: 'Say "hello" to users.',
      }
      const queries = toTypeDB(spec)
      const unitInsert = queries.find((q) => q.includes('isa unit'))
      expect(unitInsert).toContain('\\"hello\\"')
    })

    it('should escape backslashes in system prompt', () => {
      const spec: AgentSpec = {
        name: 'agent',
        prompt: 'Use \\n for newlines.',
      }
      const queries = toTypeDB(spec)
      const unitInsert = queries.find((q) => q.includes('isa unit'))
      expect(unitInsert).toContain('\\\\n')
    })

    it('should include system-prompt in unit insert', () => {
      const spec: AgentSpec = { name: 'tutor', prompt: 'You are a helpful tutor.' }
      const queries = toTypeDB(spec)
      const unitInsert = queries.find((q) => q.includes('isa unit'))
      expect(unitInsert).toContain('You are a helpful tutor.')
    })

    it('should include skill tags', () => {
      const spec: AgentSpec = {
        name: 'agent',
        prompt: '',
        skills: [{ name: 'build', tags: ['engine', 'P0'] }],
      }
      const queries = toTypeDB(spec)
      const skillInsert = queries.find((q) => q.includes('isa skill'))
      expect(skillInsert).toContain('has tag "engine"')
      expect(skillInsert).toContain('has tag "P0"')
    })
  })

  describe('worldToTypeDB() — world TQL generation', () => {
    it('should generate a group insert query', () => {
      const world: WorldSpec = {
        name: 'marketing',
        description: 'Marketing team',
        agents: [],
      }
      const queries = worldToTypeDB(world)
      const groupInsert = queries.find((q) => q.includes('isa group'))
      expect(groupInsert).toBeDefined()
      expect(groupInsert).toContain('has gid "marketing"')
      expect(groupInsert).toContain('group-type "world"')
    })

    it('should include agent queries for each agent', () => {
      const world: WorldSpec = {
        name: 'sales',
        agents: [
          { name: 'lead', prompt: 'You handle leads.' },
          { name: 'closer', prompt: 'You close deals.' },
        ],
      }
      const queries = worldToTypeDB(world)
      // Filter for queries that actually INSERT a unit (not match clauses in membership)
      const unitInserts = queries.filter((q) => q.includes('isa unit') && !q.includes('match'))
      expect(unitInserts).toHaveLength(2)
    })

    it('should assign group to all agents', () => {
      const world: WorldSpec = {
        name: 'ops',
        agents: [{ name: 'runner', prompt: 'Run tasks.' }],
      }
      const queries = worldToTypeDB(world)
      const membershipQuery = queries.find((q) => q.includes('isa membership'))
      expect(membershipQuery).toBeDefined()
      expect(membershipQuery).toContain('gid "ops"')
    })

    it('should create director→agent paths when director exists', () => {
      const world: WorldSpec = {
        name: 'team',
        agents: [
          { name: 'director', prompt: 'Lead the team.' },
          { name: 'worker', prompt: 'Do the work.' },
        ],
      }
      const queries = worldToTypeDB(world)
      const pathInsert = queries.find((q) => q.includes('isa path'))
      expect(pathInsert).toBeDefined()
      expect(pathInsert).toContain('has strength 1.0')
    })

    it('should not create paths when no director exists', () => {
      const world: WorldSpec = {
        name: 'peer',
        agents: [
          { name: 'alice', prompt: 'Alice.' },
          { name: 'bob', prompt: 'Bob.' },
        ],
      }
      const queries = worldToTypeDB(world)
      const pathInsert = queries.find((q) => q.includes('isa path'))
      expect(pathInsert).toBeUndefined()
    })
  })
})
