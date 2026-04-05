#!/usr/bin/env node
/**
 * End-to-end test: Browser → Pages → Worker → TypeDB → KV → Response
 *
 * Tests:
 *   1. Health check (gateway + typedb latency)
 *   2. Query test (full flow)
 *   3. State test (complex query)
 *   4. Latency breakdown (each layer)
 *
 * Run: npx ts-node scripts/e2e-test.ts
 */

import * as http from 'http'
import * as https from 'https'

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL'
  latencyMs: number
  details: Record<string, unknown>
  error?: string
}

const results: TestResult[] = []

// ============================================================================
// CONFIG
// ============================================================================

const PAGES_URL = 'http://localhost:4321'
const GATEWAY_URL = 'http://localhost:8787'
const TYPEDB_URL = process.env.TYPEDB_URL || 'https://flsiu1-0.cluster.typedb.com:1729'

// Test queries
const TEST_QUERIES = {
  health: 'match $u isa unit; limit 1; select $u;',
  unitCount: 'match $u isa unit; select $u;',
  pathCount: 'match $p isa path; select $p;',
}

// ============================================================================
// UTILS
// ============================================================================

function fetchUrl(url: string, options?: Record<string, unknown>): Promise<Response> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    const req = client.request(
      url,
      {
        method: 'GET',
        timeout: 5000,
        ...options,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          const statusCode = res.statusCode ?? 500
          const body = (() => {
            try {
              return JSON.parse(data)
            } catch {
              return data
            }
          })()
          resolve({
            status: statusCode,
            headers: res.headers as Record<string, string>,
            body,
            ok: statusCode >= 200 && statusCode < 300,
          } as unknown as Response)
        })
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Timeout'))
    })
    req.end()
  })
}

function postJson(
  url: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    const jsonBody = JSON.stringify(body)
    const req = client.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(jsonBody),
        },
        timeout: 10000,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          const statusCode = res.statusCode ?? 500
          const responseBody = (() => {
            try {
              return JSON.parse(data)
            } catch {
              return data
            }
          })()
          resolve({
            status: statusCode,
            headers: res.headers as Record<string, string>,
            body: responseBody,
            ok: statusCode >= 200 && statusCode < 300,
          } as unknown as Response)
        })
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Timeout'))
    })
    req.write(jsonBody)
    req.end()
  })
}

async function test(
  name: string,
  fn: () => Promise<{ latencyMs: number; details: Record<string, unknown> }>,
): Promise<void> {
  const t0 = Date.now()
  try {
    const result = await fn()
    const totalLatency = Date.now() - t0
    results.push({
      name,
      status: 'PASS',
      latencyMs: totalLatency,
      details: result.details,
    })
    console.log(
      `✓ ${name} (${totalLatency}ms)`,
    )
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    results.push({
      name,
      status: 'FAIL',
      latencyMs: Date.now() - t0,
      error,
      details: {},
    })
    console.log(`✗ ${name} - ${error}`)
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function testPagesHealth() {
  await test('Pages /api/health', async () => {
    const t0 = Date.now()
    const res = await fetchUrl(`${PAGES_URL}/api/health`)
    const latency = Date.now() - t0

    if (!res.ok) {
      throw new Error(
        `Pages health returned ${res.status}`,
      )
    }

    const body = res.body as Record<string, unknown>
    return {
      latencyMs: latency,
      details: {
        status: body.status,
        typedbLatency: (body as Record<string, Record<string, unknown>>).typedb?.latencyMs,
        version: body.version,
      },
    }
  })
}

async function testGatewayHealth() {
  await test('Gateway /health', async () => {
    const t0 = Date.now()
    const res = await fetchUrl(`${GATEWAY_URL}/health`)
    const latency = Date.now() - t0

    if (!res.ok) {
      throw new Error(
        `Gateway health returned ${res.status}`,
      )
    }

    const body = res.body as Record<string, unknown>
    return {
      latencyMs: latency,
      details: {
        status: body.status,
        database: body.database,
        version: body.version,
      },
    }
  })
}

async function testQueryViaPages() {
  await test('Pages /api/query (TypeQL via gateway)', async () => {
    const t0 = Date.now()

    const res = await postJson(`${PAGES_URL}/api/query`, {
      query: TEST_QUERIES.health,
    })
    const latency = Date.now() - t0

    if (!res.ok) {
      throw new Error(
        `Pages /api/query returned ${res.status}: ${JSON.stringify(res.body)}`,
      )
    }

    const body = res.body as Record<string, unknown>
    const answerCount = Array.isArray(body.rows) ? body.rows.length : 0

    return {
      latencyMs: latency,
      details: {
        query: TEST_QUERIES.health,
        answerCount,
        status: body.status || 'ok',
      },
    }
  })
}

async function testStateQuery() {
  await test('Pages /api/state (full world snapshot)', async () => {
    const t0 = Date.now()
    const res = await fetchUrl(`${PAGES_URL}/api/state`)
    const latency = Date.now() - t0

    if (!res.ok) {
      throw new Error(
        `Pages /api/state returned ${res.status}`,
      )
    }

    const body = res.body as Record<string, unknown[]>
    return {
      latencyMs: latency,
      details: {
        units: (body.units ?? []).length,
        edges: (body.edges ?? []).length,
        skills: (body.skills ?? []).length,
      },
    }
  })
}

async function testSignalEndpoint() {
  await test('Pages /api/signal (send test signal)', async () => {
    const t0 = Date.now()

    const res = await postJson(`${PAGES_URL}/api/signal`, {
      receiver: 'e2e-test',
      data: { test: true, timestamp: Date.now() },
    })
    const latency = Date.now() - t0

    // Signal may not have a receiver, but should respond
    if (res.status > 599) {
      throw new Error(
        `Pages /api/signal returned ${res.status}`,
      )
    }

    const body = res.body as Record<string, unknown>
    return {
      latencyMs: latency,
      details: {
        status: body.status || res.status,
        dissolved: body.dissolved,
      },
    }
  })
}

async function testStatsEndpoint() {
  await test('Pages /api/stats (aggregate metrics)', async () => {
    const t0 = Date.now()
    const res = await fetchUrl(`${PAGES_URL}/api/stats`)
    const latency = Date.now() - t0

    if (!res.ok) {
      throw new Error(
        `Pages /api/stats returned ${res.status}`,
      )
    }

    const body = res.body as Record<string, unknown>
    return {
      latencyMs: latency,
      details: {
        unitCount: body.unitCount,
        skillCount: body.skillCount,
        edgeCount: body.edgeCount,
        topHighways: Array.isArray(body.topHighways) ? body.topHighways.length : 0,
      },
    }
  })
}

// ============================================================================
// REPORT
// ============================================================================

function printResults() {
  console.log('\n' + '='.repeat(80))
  console.log('E2E TEST RESULTS')
  console.log('='.repeat(80))

  const passed = results.filter((r) => r.status === 'PASS')
  const failed = results.filter((r) => r.status === 'FAIL')

  console.log(`\nPassed: ${passed.length}/${results.length}`)
  console.log(`Failed: ${failed.length}/${results.length}`)

  if (failed.length > 0) {
    console.log('\nFailures:')
    failed.forEach((r) => {
      console.log(`  - ${r.name}: ${r.error}`)
    })
  }

  console.log('\n' + '-'.repeat(80))
  console.log('LATENCY BREAKDOWN')
  console.log('-'.repeat(80))

  const sorted = [...results].sort((a, b) => b.latencyMs - a.latencyMs)
  sorted.forEach((r) => {
    const status = r.status === 'PASS' ? '✓' : '✗'
    console.log(`${status} ${r.name.padEnd(40)} ${r.latencyMs.toString().padStart(5)}ms`)
    if (Object.keys(r.details).length > 0) {
      console.log(`  ${JSON.stringify(r.details)}`)
    }
  })

  const avgLatency =
    passed.length > 0
      ? Math.round(passed.reduce((sum, r) => sum + r.latencyMs, 0) / passed.length)
      : 0

  console.log('\n' + '-'.repeat(80))
  console.log(`Average latency (passing tests): ${avgLatency}ms`)
  console.log(`P95 latency: ${sorted[Math.floor(sorted.length * 0.05)]?.latencyMs ?? 'N/A'}ms`)
  console.log(`Max latency: ${sorted[0]?.latencyMs ?? 'N/A'}ms`)
  console.log('='.repeat(80) + '\n')

  const exitCode = failed.length > 0 ? 1 : 0
  process.exit(exitCode)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('Starting E2E tests...\n')
  console.log(`Pages URL: ${PAGES_URL}`)
  console.log(`Gateway URL: ${GATEWAY_URL}`)
  console.log(`TypeDB URL: ${TYPEDB_URL}`)
  console.log('')

  // Test basic health first
  await testPagesHealth()
  await testGatewayHealth()

  // Small delay to let system settle
  await new Promise((r) => setTimeout(r, 500))

  // Test query flows
  await testQueryViaPages()
  await testStateQuery()
  await testSignalEndpoint()
  await testStatsEndpoint()

  printResults()
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
