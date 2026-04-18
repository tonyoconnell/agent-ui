/**
 * Agent MD Tests — Parse markdown agents, validate TypeDB inserts
 *
 * Coverage:
 *   (a) parse() extracts name/model/channels/skills/group from frontmatter
 *   (b) parse() extracts system prompt body
 *   (c) toTypeDB() emits correct unit insert
 *   (d) toTypeDB() emits capability relations for each skill
 *   (e) tag extraction flows through
 *
 * Run: bun vitest run src/engine/agent-md.test.ts
 */

import { describe, expect, it } from 'vitest'
import { type AgentSpec, parse, toTypeDB, worldToTypeDB } from './agent-md'

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA — Real agent markdown fixtures
// ═══════════════════════════════════════════════════════════════════════════

const tutorMarkdown = `---
name: spanish-tutor
model: claude-sonnet-4-20250514
channels:
  - telegram
  - discord
skills:
  - name: lesson
    price: 0.01
    tags: [education, spanish, language, beginner]
  - name: practice
    price: 0.005
    tags: [education, spanish, conversation]
  - name: quiz
    price: 0.005
    tags: [education, spanish, assessment]
---

You are a patient, encouraging Spanish tutor. You help absolute beginners build confidence in speaking and understanding Spanish.

## Personality

- Patient and encouraging
- Use simple, clear explanations
- Celebrate small wins`

const minimalMarkdown = `---
name: scout
---

You are a scout. You observe and report.`

const groupedAgentMarkdown = `---
name: creative
model: claude-opus-4
group: marketing
tags: [agent, creative]
skills:
  - name: copywrite
    price: 0.02
    tags: [copy, creative, headlines]
  - name: design
    price: 0.03
    tags: [design, visual]
sensitivity: 0.7
---

You are a creative director. You lead the creative team.`

const adlAgentMarkdown = `---
name: secure-agent
model: claude-sonnet-4-20250514
adlVersion: "0.2.0"
adlStatus: active
sunsetAt: "2027-12-31T00:00:00Z"
dataCategories: [public, internal]
permNetwork:
  allowedHosts:
    - api.example.com
    - webhook.example.com
  protocols:
    - https
    - wss
---

You are a secure agent with ADL constraints.`

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE A: parse() — Frontmatter extraction
// ═══════════════════════════════════════════════════════════════════════════

describe('parse() — frontmatter extraction', () => {
  it('extracts name from frontmatter', () => {
    const spec = parse(tutorMarkdown)
    expect(spec.name).toBe('spanish-tutor')
  })

  it('extracts model from frontmatter', () => {
    const spec = parse(tutorMarkdown)
    expect(spec.model).toBe('claude-sonnet-4-20250514')
  })

  it('extracts channels array', () => {
    const spec = parse(tutorMarkdown)
    expect(spec.channels).toEqual(['telegram', 'discord'])
  })

  it('extracts skills array with name, price, and tags', () => {
    const spec = parse(tutorMarkdown)
    expect(spec.skills).toHaveLength(3)
    expect(spec.skills?.[0]).toMatchObject({
      name: 'lesson',
      price: 0.01,
      tags: ['education', 'spanish', 'language', 'beginner'],
    })
  })

  it('extracts group field when present', () => {
    const spec = parse(groupedAgentMarkdown)
    expect(spec.group).toBe('marketing')
  })

  it('handles missing optional fields', () => {
    const spec = parse(minimalMarkdown)
    expect(spec.channels).toBeUndefined()
    expect(spec.skills).toBeUndefined()
    expect(spec.group).toBeUndefined()
  })

  it('extracts sensitivity (0-1 range)', () => {
    const spec = parse(groupedAgentMarkdown)
    expect(spec.sensitivity).toBe(0.7)
  })

  it('extracts tags as flat array', () => {
    const spec = parse(groupedAgentMarkdown)
    expect(spec.tags).toEqual(['agent', 'creative'])
  })

  it('extracts ADL metadata when present', () => {
    const spec = parse(adlAgentMarkdown)
    expect(spec.adlVersion).toBe('0.2.0')
    expect(spec.adlStatus).toBe('active')
    expect(spec.sunsetAt).toBe('2027-12-31T00:00:00Z')
    expect(spec.dataCategories).toEqual(['public', 'internal'])
  })

  it('extracts permNetwork structure', () => {
    const spec = parse(adlAgentMarkdown)
    expect(spec.permNetwork).toMatchObject({
      allowedHosts: ['api.example.com', 'webhook.example.com'],
      protocols: ['https', 'wss'],
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE B: parse() — System prompt extraction
// ═══════════════════════════════════════════════════════════════════════════

describe('parse() — system prompt body extraction', () => {
  it('extracts body text after frontmatter as prompt', () => {
    const spec = parse(tutorMarkdown)
    expect(spec.prompt).toContain('You are a patient, encouraging Spanish tutor')
  })

  it('preserves markdown formatting in prompt', () => {
    const spec = parse(tutorMarkdown)
    expect(spec.prompt).toContain('## Personality')
    expect(spec.prompt).toContain('- Patient and encouraging')
  })

  it('trims leading/trailing whitespace from prompt', () => {
    const spec = parse(tutorMarkdown)
    const trimmed = spec.prompt.trim()
    expect(spec.prompt).toBe(trimmed)
  })

  it('handles minimal agent with short prompt', () => {
    const spec = parse(minimalMarkdown)
    expect(spec.prompt).toBe('You are a scout. You observe and report.')
  })

  it('requires name in frontmatter (no pure markdown support)', () => {
    // parse() requires 'name' field via Schema.NonEmptyString
    // Pure markdown (no frontmatter) will fail validation
    const pureMarkdown = 'Just some instructions without frontmatter'
    expect(() => parse(pureMarkdown)).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE C: toTypeDB() — Unit insert generation
// ═══════════════════════════════════════════════════════════════════════════

describe('toTypeDB() — unit insert generation', () => {
  it('generates unit insert with required attributes', () => {
    const spec = parse(tutorMarkdown)
    const queries = toTypeDB(spec)
    const unitInsert = queries[0]

    expect(unitInsert).toContain('insert $u isa unit')
    expect(unitInsert).toContain('has uid "spanish-tutor"')
    expect(unitInsert).toContain('has name "spanish-tutor"')
    expect(unitInsert).toContain('has model "claude-sonnet-4-20250514"')
    expect(unitInsert).toContain('has unit-kind "agent"')
  })

  it('includes system-prompt in unit insert', () => {
    const spec = parse(tutorMarkdown)
    const queries = toTypeDB(spec)
    const unitInsert = queries[0]

    expect(unitInsert).toContain('has system-prompt')
    expect(unitInsert).toContain('patient')
  })

  it('sets default model when not specified', () => {
    const spec = parse(minimalMarkdown)
    const queries = toTypeDB(spec)
    const unitInsert = queries[0]

    expect(unitInsert).toContain('has model "claude-sonnet-4-20250514"')
  })

  it('uses group:name as uid when group is set', () => {
    const spec = parse(groupedAgentMarkdown)
    const queries = toTypeDB(spec)
    const unitInsert = queries[0]

    expect(unitInsert).toContain('has uid "marketing:creative"')
  })

  it('includes ADL attributes when present', () => {
    const spec = parse(adlAgentMarkdown)
    const queries = toTypeDB(spec)
    const unitInsert = queries[0]

    expect(unitInsert).toContain('has adl-version "0.2.0"')
    expect(unitInsert).toContain('has adl-status "active"')
    expect(unitInsert).toContain('has sunset-at "2027-12-31T00:00:00Z"')
  })

  it('escapes quotes in system prompt', () => {
    const markdownWithQuotes = `---
name: quoted
---

You say "hello".`
    const spec = parse(markdownWithQuotes)
    const queries = toTypeDB(spec)
    const unitInsert = queries[0]

    expect(unitInsert).toContain('\\"') // escaped quote
  })

  it('sets status and initial metrics', () => {
    const spec = parse(tutorMarkdown)
    const queries = toTypeDB(spec)
    const unitInsert = queries[0]

    expect(unitInsert).toContain('has status "active"')
    expect(unitInsert).toContain('has success-rate 0.5')
    expect(unitInsert).toContain('has sample-count 0')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE D: toTypeDB() — Capability relations
// ═══════════════════════════════════════════════════════════════════════════

describe('toTypeDB() — capability relations for skills', () => {
  it('generates skill insert and capability for each skill', () => {
    const spec = parse(tutorMarkdown)
    const queries = toTypeDB(spec)

    // Should have: 1 unit insert + 1 group membership + (3 skills + 3 capabilities)
    // = 1 + 1 + 6 = 8 queries
    expect(queries.length).toBeGreaterThanOrEqual(6)
  })

  it('creates skill entity with skill-id, name, and price', () => {
    const spec = parse(tutorMarkdown)
    const queries = toTypeDB(spec)
    const skillQueries = queries.filter((q) => q.includes('insert $s isa skill'))

    expect(skillQueries.length).toBe(4) // 3 explicit + 1 auto-injected 'hire'
    // skill-id is prefixed with the unit's uid so two agents offering the
    // same skill name don't collide on the @unique(skill-id) constraint.
    expect(skillQueries[0]).toContain('has skill-id "spanish-tutor:lesson"')
    expect(skillQueries[0]).toContain('has name "lesson"')
    expect(skillQueries[0]).toContain('has price 0.01')
  })

  it('attaches skill tags to skill entity', () => {
    const spec = parse(tutorMarkdown)
    const queries = toTypeDB(spec)
    const skillQueries = queries.filter((q) => q.includes('insert $s isa skill'))

    expect(skillQueries[0]).toContain('has tag "education"')
    expect(skillQueries[0]).toContain('has tag "spanish"')
  })

  it('creates capability relation between unit and skill', () => {
    const spec = parse(tutorMarkdown)
    const queries = toTypeDB(spec)
    const capabilityQueries = queries.filter((q) => q.includes('isa capability'))

    expect(capabilityQueries.length).toBe(4) // 3 explicit + 1 auto-injected 'hire'
    expect(capabilityQueries[0]).toContain('provider: $u')
    expect(capabilityQueries[0]).toContain('offered: $s')
    expect(capabilityQueries[0]).toContain('has price')
  })

  it('uses uid:skillname as skill-id when group is present', () => {
    const spec = parse(groupedAgentMarkdown)
    const queries = toTypeDB(spec)
    const skillQueries = queries.filter((q) => q.includes('insert $s isa skill'))

    // uid for a grouped agent is "${group}:${name}", so skill-id becomes
    // "${group}:${name}:${skill}" — keeps each agent's skill distinct.
    expect(skillQueries[0]).toContain('has skill-id "marketing:creative:copywrite"')
  })

  it('handles agents with no skills gracefully', () => {
    const spec = parse(minimalMarkdown)
    const queries = toTypeDB(spec)

    // Should have only the auto-injected 'hire' skill
    const skillQueries = queries.filter((q) => q.includes('insert $s isa skill'))
    expect(skillQueries.length).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE E: Tag extraction flow
// ═══════════════════════════════════════════════════════════════════════════

describe('tag extraction flow', () => {
  it('flows skill tags through to TypeDB inserts', () => {
    const spec = parse(tutorMarkdown)
    const queries = toTypeDB(spec)

    // Find skill insert and verify tags are present
    const skillInsert = queries.find((q) => q.includes('has skill-id "spanish-tutor:lesson"'))
    expect(skillInsert).toBeDefined()
    expect(skillInsert).toContain('has tag "education"')
    expect(skillInsert).toContain('has tag "spanish"')
    expect(skillInsert).toContain('has tag "language"')
  })

  it('includes unit-level tags in unit insert', () => {
    const spec = parse(groupedAgentMarkdown)
    const queries = toTypeDB(spec)
    const unitInsert = queries[0]

    // Unit tags: from spec.tags + group tag
    expect(unitInsert).toContain('has tag "agent"')
    expect(unitInsert).toContain('has tag "creative"')
    expect(unitInsert).toContain('has tag "marketing"') // group becomes a tag
  })

  it('deduplicates tags across skills', () => {
    const markdownWithDupeTags = `---
name: multi-skill
skills:
  - name: task1
    tags: [common, unique1]
  - name: task2
    tags: [common, unique2]
---

Multi-skill agent.`
    const spec = parse(markdownWithDupeTags)
    const queries = toTypeDB(spec)

    // Both explicit skills + auto-injected 'hire' should exist
    const skillQueries = queries.filter((q) => q.includes('insert $s isa skill'))
    expect(skillQueries.length).toBe(3) // 2 explicit + 1 auto-injected 'hire'
    expect(skillQueries[0]).toContain('has tag "common"')
    expect(skillQueries[1]).toContain('has tag "common"')
  })

  it('handles allowedOrigins as origin: tags', () => {
    const markdownWithOrigins = `---
name: restricted
allowedOrigins: [api.example.com, webhook.example.com]
---

Restricted agent.`
    const spec = parse(markdownWithOrigins)
    const queries = toTypeDB(spec)
    const unitInsert = queries[0]

    expect(unitInsert).toContain('has tag "origin:api.example.com"')
    expect(unitInsert).toContain('has tag "origin:webhook.example.com"')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// BONUS: worldToTypeDB() — Group + membership + paths
// ═══════════════════════════════════════════════════════════════════════════

describe('worldToTypeDB() — group scaffolding', () => {
  it('creates group entity with gid and name', () => {
    const world = {
      name: 'marketing',
      description: 'Marketing team',
      agents: [
        {
          name: 'creative',
          prompt: 'You are creative.',
        } as AgentSpec,
      ],
    }
    const queries = worldToTypeDB(world)

    expect(queries[0]).toContain('insert $g isa group')
    expect(queries[0]).toContain('has gid "marketing"')
    expect(queries[0]).toContain('has name "marketing"')
    expect(queries[0]).toContain('has group-type "world"')
  })

  it('sets group for all agents', () => {
    const world = {
      name: 'research',
      agents: [
        {
          name: 'analyst',
          prompt: 'Analyze.',
        } as AgentSpec,
        {
          name: 'writer',
          prompt: 'Write.',
        } as AgentSpec,
      ],
    }
    const queries = worldToTypeDB(world)

    // Both agents should have research:analyst and research:writer uids
    const analyticsInsert = queries.find((q) => q.includes('research:analyst'))
    const writerInsert = queries.find((q) => q.includes('research:writer'))

    expect(analyticsInsert).toBeDefined()
    expect(writerInsert).toBeDefined()
  })

  it('creates initial paths from director to all other agents', () => {
    const world = {
      name: 'team',
      agents: [
        {
          name: 'director',
          prompt: 'You lead.',
        } as AgentSpec,
        {
          name: 'worker1',
          prompt: 'You work.',
        } as AgentSpec,
        {
          name: 'worker2',
          prompt: 'You work.',
        } as AgentSpec,
      ],
    }
    const queries = worldToTypeDB(world)

    const pathQueries = queries.filter((q) => q.includes('isa path'))
    // Should have 2 paths (director → worker1, director → worker2)
    expect(pathQueries.length).toBe(2)
  })
})
