/**
 * adl-mcp.test.ts — ADL Cycle 3: MCP surface decision documented
 *
 * Task #10: packages/mcp does not exist. The decision is that MCP tool calls
 * should route through persist.signal() when the MCP integration is added.
 * This test asserts the decision doc exists and contains the key assertions.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('ADL Cycle 3: MCP surface decision', () => {
  it('adl-mcp.md decision doc exists', () => {
    const docPath = resolve(process.cwd(), 'docs/adl-mcp.md')
    expect(() => readFileSync(docPath)).not.toThrow()
  })

  it('decision doc states MCP is pending and routes through persist.signal()', () => {
    const docPath = resolve(process.cwd(), 'docs/adl-mcp.md')
    const content = readFileSync(docPath, 'utf8')
    expect(content).toContain('persist.signal()')
    expect(content).toContain('pending')
  })

  it('decision doc lists current gate coverage table', () => {
    const docPath = resolve(process.cwd(), 'docs/adl-mcp.md')
    const content = readFileSync(docPath, 'utf8')
    expect(content).toContain('Gate Coverage')
  })
})
