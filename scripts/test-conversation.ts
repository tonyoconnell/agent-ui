#!/usr/bin/env node
/**
 * Minimal agent conversation test: CMO → Citation → Social
 *
 * Demonstrates:
 *   1. Signal from CMO (orchestrator) to Citation (specialist)
 *   2. Citation agent executes, returns result
 *   3. Signal from Citation to Social (downstream)
 *   4. Pheromone trail strengthening on both hops
 *
 * Run: npx ts-node scripts/test-conversation.ts
 */

import * as http from 'http'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'

interface Conversation {
  timestamp: number
  sender: string
  receiver: string
  signal: Record<string, unknown>
  result?: {
    ok: boolean
    latencyMs: number
    response?: string
    error?: string
  }
}

const conversations: Conversation[] = []

// ============================================================================
// CONFIG
// ============================================================================

const PAGES_URL = 'http://localhost:4321'

// Test signals
const TEST_FLOW = [
  {
    step: 1,
    label: 'CMO briefs Citation agent',
    sender: 'marketing:cmo',
    receiver: 'marketing:citation',
    signal: {
      task: 'standard',
      context: {
        target: 'elitemovers.ie',
        industry: 'moving',
      },
      prompt:
        'Build 5 citation packets (business name, category, review sites, contact info) for Elite Movers Dublin. Focus on high-authority sites: Google Business, Yelp, Trustpilot, Angi, HomeAdvisor.',
    },
  },
  {
    step: 2,
    label: 'Citation passes citations to Social for profile building',
    sender: 'marketing:citation',
    receiver: 'marketing:social',
    waitFor: 3000, // Wait for first response
    signal: {
      task: 'standard',
      context: {
        target: 'elitemovers.ie',
        tier: 'citation-fed',
      },
      prompt:
        'Using the citation packets from Citation agent, draft 3 social media profiles (LinkedIn, Facebook, Instagram bios). Emphasize trust, reviews, and Dublin expertise.',
    },
  },
]

// ============================================================================
// UTILS
// ============================================================================

function postJson(
  url: string,
  body: Record<string, unknown>,
): Promise<{
  status: number
  body: Record<string, unknown>
}> {
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
        timeout: 120000, // 120s for LLM
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
              return { raw: data }
            }
          })()
          resolve({
            status: statusCode,
            body: responseBody as Record<string, unknown>,
          })
        })
      },
    )

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.write(jsonBody)
    req.end()
  })
}

async function sendSignal(
  sender: string,
  receiver: string,
  signal: Record<string, unknown>,
): Promise<{
  latencyMs: number
  ok: boolean
  response?: string
  error?: string
}> {
  const t0 = Date.now()

  try {
    const res = await postJson(`${PAGES_URL}/api/signal`, {
      sender,
      receiver,
      data: JSON.stringify(signal), // Convert signal to string
    })

    const latencyMs = Date.now() - t0

    // Check for success
    if (res.status >= 200 && res.status < 300) {
      const body = res.body as Record<string, unknown>
      return {
        ok: body.ok === true,
        latencyMs,
        response: body.result ? String(body.result) : body.success === true ? 'Signal processed' : undefined,
      }
    } else {
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${res.status}: ${JSON.stringify(res.body)}`,
      }
    }
  } catch (e) {
    const latencyMs = Date.now() - t0
    return {
      ok: false,
      latencyMs,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function runConversation() {
  console.log('\n' + '='.repeat(80))
  console.log('AGENT CONVERSATION TEST: CMO → Citation → Social')
  console.log('='.repeat(80) + '\n')

  let prevResult: Record<string, unknown> | null = null

  for (const step of TEST_FLOW) {
    // Wait if specified
    if (step.waitFor) {
      console.log(`\n⏳ Waiting ${step.waitFor}ms for previous agent to complete...\n`)
      await new Promise((r) => setTimeout(r, step.waitFor))
    }

    console.log(`STEP ${step.step}: ${step.label}`)
    console.log(`  Sender:   ${step.sender}`)
    console.log(`  Receiver: ${step.receiver}`)
    console.log(`  Signal:   ${JSON.stringify(step.signal, null, 2)}`)

    const result = await sendSignal(step.sender, step.receiver, step.signal)

    conversations.push({
      timestamp: Date.now(),
      sender: step.sender,
      receiver: step.receiver,
      signal: step.signal,
      result: {
        ok: result.ok,
        latencyMs: result.latencyMs,
        response: result.response,
        error: result.error,
      },
    })

    if (result.ok) {
      console.log(`  ✓ Success (${result.latencyMs}ms)`)
      if (result.response) {
        const preview = result.response.substring(0, 200)
        console.log(`  Response (preview): ${preview}${result.response.length > 200 ? '...' : ''}`)
      }
      prevResult = {
        sender: step.sender,
        receiver: step.receiver,
        latencyMs: result.latencyMs,
      }
    } else {
      console.log(`  ✗ Failed (${result.latencyMs}ms)`)
      console.log(`  Error: ${result.error}`)
    }

    console.log()
  }
}

// ============================================================================
// REPORT
// ============================================================================

function printReport() {
  console.log('='.repeat(80))
  console.log('CONVERSATION FLOW SUMMARY')
  console.log('='.repeat(80))

  const passed = conversations.filter((c) => c.result?.ok)
  const failed = conversations.filter((c) => !c.result?.ok)

  console.log(`\nCompleted: ${passed.length}/${conversations.length}`)
  console.log(`Failed: ${failed.length}/${conversations.length}`)

  console.log('\n' + '-'.repeat(80))
  console.log('TIMELINE')
  console.log('-'.repeat(80))

  conversations.forEach((conv, i) => {
    const status = conv.result?.ok ? '✓' : '✗'
    const latency = `${conv.result?.latencyMs ?? 0}ms`.padStart(6)
    console.log(`${status} [${i + 1}] ${conv.sender} → ${conv.receiver} (${latency})`)
    if (!conv.result?.ok) {
      console.log(`    Error: ${conv.result?.error}`)
    }
  })

  console.log('\n' + '-'.repeat(80))
  console.log('METRICS')
  console.log('-'.repeat(80))

  if (passed.length > 0) {
    const totalLatency = passed.reduce((sum, c) => sum + (c.result?.latencyMs ?? 0), 0)
    const avgLatency = Math.round(totalLatency / passed.length)
    const maxLatency = Math.max(...passed.map((c) => c.result?.latencyMs ?? 0))

    console.log(`Total latency: ${totalLatency}ms`)
    console.log(`Average latency: ${avgLatency}ms`)
    console.log(`Max latency: ${maxLatency}ms`)
  }

  // Save full results
  const reportPath = path.join(process.cwd(), 'conversation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(conversations, null, 2))
  console.log(`\nFull report saved to: ${reportPath}`)

  console.log('='.repeat(80) + '\n')
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`Starting conversation test...\n`)
  console.log(`Pages URL: ${PAGES_URL}`)
  console.log(`Agents: marketing:cmo → marketing:citation → marketing:social`)
  console.log('')

  try {
    await runConversation()
    printReport()
  } catch (e) {
    console.error('FATAL:', e)
    process.exit(1)
  }
}

main()
