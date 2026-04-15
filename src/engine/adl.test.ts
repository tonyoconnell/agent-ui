/**
 * ADL Parser Tests
 *
 * Validates parsing, validation, TypeDB generation, and sensitivity mapping.
 */

import { describe, expect, it } from 'vitest'
import { type AdlDoc, parse, toTypeDB, validate } from './adl'

// ═══════════════════════════════════════════════════════════════════════════
// VALID DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════

const minimalAdl: AdlDoc = {
  id: 'https://example.com/agents/minimal',
  name: 'Minimal Agent',
  version: '1.0.0',
}

const fullAdl: AdlDoc = {
  id: 'https://example.com/agents/full',
  name: 'Full Agent',
  version: '1.0.0',
  adlVersion: '0.2.0',
  description: 'A fully-featured agent',
  status: 'active',
  sunsetAt: '2026-12-31T00:00:00',
  capabilities: {
    tools: [
      {
        name: 'search',
        description: 'Search the web',
        inputSchema: '{"type":"object","properties":{"query":{"type":"string"}}}',
        outputSchema: '{"type":"array","items":{"type":"object"}}',
      },
      {
        name: 'summarize',
        description: 'Summarize text',
      },
    ],
  },
  permissions: {
    network: {
      allowedHosts: ['api.example.com', 'data.example.com'],
      protocols: ['https'],
    },
    filesystem: {
      allowedPaths: ['/tmp', '/home/agent'],
      read: true,
      write: false,
    },
    env: {
      access: ['API_KEY', 'DEBUG'],
    },
    process: true,
    limits: {
      memoryMb: 512,
      cpuPercent: 50,
      durationS: 300,
    },
  },
  data: {
    sensitivity: 'confidential',
    categories: ['pii', 'financial'],
    retention: {
      days: 90,
    },
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('parse()', () => {
  it('should parse minimal ADL', () => {
    const doc = parse(minimalAdl)
    expect(doc.id).toBe('https://example.com/agents/minimal')
    expect(doc.name).toBe('Minimal Agent')
    expect(doc.version).toBe('1.0.0')
  })

  it('should parse full ADL with all attributes', () => {
    const doc = parse(fullAdl)
    expect(doc.name).toBe('Full Agent')
    expect(doc.status).toBe('active')
    expect(doc.data?.sensitivity).toBe('confidential')
    expect(doc.capabilities?.tools).toHaveLength(2)
    expect(doc.permissions?.network?.allowedHosts).toContain('api.example.com')
  })

  it('should throw on invalid JSON', () => {
    expect(() => parse({ name: 'test' } as any)).toThrow()
  })

  it('should throw on missing required fields', () => {
    expect(() => parse({ name: 'Test' })).toThrow()
  })

  it('should throw on invalid status', () => {
    expect(() =>
      parse({
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        status: 'invalid',
      } as any),
    ).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('validate()', () => {
  it('should validate minimal ADL', () => {
    const result = validate(minimalAdl)
    expect(result.ok).toBe(true)
    expect(result.errors).toBeUndefined()
  })

  it('should validate full ADL', () => {
    const result = validate(fullAdl)
    expect(result.ok).toBe(true)
  })

  it('should reject invalid JSON', () => {
    const result = validate({ name: 'test' })
    expect(result.ok).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors?.length).toBeGreaterThan(0)
  })

  it('should reject invalid status', () => {
    const result = validate({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      status: 'unknown',
    })
    expect(result.ok).toBe(false)
  })

  it('should reject missing required fields', () => {
    const result = validate({ id: 'test', name: 'Test' })
    expect(result.ok).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// TYPEDB GENERATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('toTypeDB()', () => {
  it('should generate insert for minimal ADL', () => {
    const queries = toTypeDB(minimalAdl)
    expect(queries.length).toBeGreaterThan(0)
    expect(queries[0]).toContain('insert $u isa unit')
    expect(queries[0]).toContain('has uid')
    expect(queries[0]).toContain('has name')
  })

  it('should include ADL attributes', () => {
    const queries = toTypeDB(minimalAdl)
    const unitQuery = queries[0]
    expect(unitQuery).toContain('has adl-version')
    expect(unitQuery).toContain('has adl-uid')
    expect(unitQuery).toContain('has adl-status')
    expect(unitQuery).toContain('has data-sensitivity')
  })

  it('should default status to active', () => {
    const queries = toTypeDB(minimalAdl)
    expect(queries[0]).toContain('has adl-status "active"')
  })

  it('should default adl-version to 0.2.0', () => {
    const queries = toTypeDB(minimalAdl)
    expect(queries[0]).toContain('has adl-version "0.2.0"')
  })

  it('should include optional attributes when present', () => {
    const queries = toTypeDB(fullAdl)
    const unitQuery = queries[0]
    expect(unitQuery).toContain('has sunset-at')
    expect(unitQuery).toContain('has data-categories')
    expect(unitQuery).toContain('has perm-network')
    expect(unitQuery).toContain('has perm-filesystem')
    expect(unitQuery).toContain('has perm-env')
    expect(unitQuery).toContain('has perm-process')
    expect(unitQuery).toContain('has perm-memory-mb')
    expect(unitQuery).toContain('has perm-cpu-percent')
    expect(unitQuery).toContain('has perm-duration-s')
  })

  it('should generate skill inserts for tools', () => {
    const queries = toTypeDB(fullAdl)
    // Unit insert + 2 skill inserts + 2 capability relations = 5 queries
    expect(queries.length).toBeGreaterThanOrEqual(5)
    expect(queries.some((q) => q.includes('isa skill'))).toBe(true)
    expect(queries.some((q) => q.includes('isa capability'))).toBe(true)
  })

  it('should escape string values to prevent TQL injection', () => {
    const adlWithQuotes: AdlDoc = {
      id: 'test:agent"bad',
      name: 'Agent "with" quotes',
      version: '1.0.0',
    }
    const queries = toTypeDB(adlWithQuotes)
    expect(queries[0]).toContain('\\"')
  })

  it('should store permissions as JSON strings', () => {
    const queries = toTypeDB(fullAdl)
    const unitQuery = queries[0]
    expect(unitQuery).toContain('has perm-network')
    // Should be a string (escaped JSON), not raw object
    expect(unitQuery).toContain('\\')
  })

  it('should include input/output schemas in skill inserts', () => {
    const queries = toTypeDB(fullAdl)
    const skillQueries = queries.filter((q) => q.includes('isa skill'))
    expect(skillQueries.length).toBeGreaterThan(0)
    // At least one skill should have schema
    expect(skillQueries.some((q) => q.includes('has input-schema'))).toBe(true)
    expect(skillQueries.some((q) => q.includes('has output-schema'))).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SENSITIVITY MAPPING TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('sensitivity mapping', () => {
  it('should default to internal when not specified', () => {
    const adl: AdlDoc = { id: 'test', name: 'Test', version: '1.0.0' }
    const queries = toTypeDB(adl)
    expect(queries[0]).toContain('has data-sensitivity "internal"')
  })

  it('should use explicit sensitivity when specified', () => {
    const adl: AdlDoc = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      data: { sensitivity: 'restricted' },
    }
    const queries = toTypeDB(adl)
    expect(queries[0]).toContain('has data-sensitivity "restricted"')
  })

  it('should support all sensitivity levels', () => {
    const sensitivities = ['public', 'internal', 'confidential', 'restricted']
    for (const sensitivity of sensitivities) {
      const adl: AdlDoc = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        data: { sensitivity: sensitivity as any },
      }
      const queries = toTypeDB(adl)
      expect(queries[0]).toContain(`has data-sensitivity "${sensitivity}"`)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe('edge cases', () => {
  it('should handle empty tools array', () => {
    const adl: AdlDoc = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      capabilities: { tools: [] },
    }
    const queries = toTypeDB(adl)
    // Only unit insert, no skill inserts
    expect(queries.length).toBe(1)
  })

  it('should handle undefined optional nested objects', () => {
    const adl: AdlDoc = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      permissions: {},
    }
    const queries = toTypeDB(adl)
    // Should not crash
    expect(queries[0]).toContain('isa unit')
  })

  it('should handle special characters in names', () => {
    const adl: AdlDoc = {
      id: 'test:agent-v2',
      name: 'Test Agent (v2)',
      version: '1.0.0',
    }
    const queries = toTypeDB(adl)
    expect(queries[0]).toContain('has name')
  })

  it('should validate decimal permission limits', () => {
    const adl: AdlDoc = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      permissions: {
        limits: {
          cpuPercent: 33.5,
        },
      },
    }
    const result = validate(adl)
    expect(result.ok).toBe(true)
    const queries = toTypeDB(adl)
    expect(queries[0]).toContain('has perm-cpu-percent 33.5')
  })
})
