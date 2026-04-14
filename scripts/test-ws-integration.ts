#!/usr/bin/env bun
/**
 * WebSocket integration test against live Gateway (api.one.ie).
 *
 * Exercises Cycle 2 runtime tests:
 * 1. Connect to wss://api.one.ie/ws with valid Origin
 * 2. POST to /broadcast with X-Broadcast-Secret
 * 3. Verify WS client receives the broadcast message
 * 4. Verify ping/pong keepalive
 * 5. Verify unauthorized broadcast rejected
 *
 * Uses the `ws` npm library so we can set the Origin header — the Gateway
 * requires a matching Origin on /ws upgrades (origin check in Cycle 0).
 */

import WebSocket from 'ws'

const GATEWAY = 'https://api.one.ie'
const WS_URL = 'wss://api.one.ie/ws'
const ORIGIN = 'http://localhost:4321'
const SECRET = process.env.BROADCAST_SECRET

if (!SECRET) {
  console.error('ERROR: BROADCAST_SECRET env var required')
  process.exit(1)
}

type TestResult = { name: string; passed: boolean; detail?: string }
const results: TestResult[] = []

function logResult(name: string, passed: boolean, detail = ''): void {
  results.push({ name, passed, detail })
  const icon = passed ? '✓' : '✗'
  const color = passed ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}${icon}\x1b[0m  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function main(): Promise<void> {
  console.log('\n🧪 WebSocket Integration Test — api.one.ie\n')

  // Test 1: Connect WebSocket with valid Origin (ws library supports custom headers)
  const ws = new WebSocket(WS_URL, { headers: { Origin: ORIGIN } })

  const connected = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 5000)
    ws.on('open', () => {
      clearTimeout(timer)
      resolve(true)
    })
    ws.on('error', () => {
      clearTimeout(timer)
      resolve(false)
    })
  })
  logResult('WebSocket connects (with Origin header)', connected)
  if (!connected) {
    ws.close()
    return
  }

  // Test 2: Ping/pong keepalive
  const pongReceived = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 3000)
    const handler = (data: WebSocket.RawData) => {
      if (data.toString() === 'pong') {
        clearTimeout(timer)
        ws.off('message', handler)
        resolve(true)
      }
    }
    ws.on('message', handler)
    ws.send('ping')
  })
  logResult('Ping/pong keepalive', pongReceived)

  // Test 3: Unauthorized broadcast → 403
  const unauthRes = await fetch(`${GATEWAY}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'mark', taskId: 'x', strength: 1, timestamp: 0 }),
  })
  logResult('Unauthorized broadcast → 403', unauthRes.status === 403, `got ${unauthRes.status}`)

  // Test 4: Invalid message type → 400
  const invalidTypeRes = await fetch(`${GATEWAY}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Broadcast-Secret': SECRET },
    body: JSON.stringify({ type: 'evil', taskId: 'x' }),
  })
  logResult('Invalid message type → 400', invalidTypeRes.status === 400, `got ${invalidTypeRes.status}`)

  // Test 5: Broadcast → WebSocket receives it
  const testTaskId = `integration-test-${Date.now()}`
  const testMsg = { type: 'mark', taskId: testTaskId, strength: 42, timestamp: Date.now() }

  const receivedPromise = new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 5000)
    const handler = (data: WebSocket.RawData) => {
      const str = data.toString()
      if (str === 'pong') return
      try {
        const msg = JSON.parse(str) as { taskId?: string }
        if (msg.taskId === testTaskId) {
          clearTimeout(timer)
          ws.off('message', handler)
          resolve(true)
        }
      } catch {
        // ignore
      }
    }
    ws.on('message', handler)
  })

  const broadcastRes = await fetch(`${GATEWAY}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Broadcast-Secret': SECRET },
    body: JSON.stringify(testMsg),
  })

  const broadcastOk = broadcastRes.status === 200
  logResult('Broadcast accepted → 200', broadcastOk, `status=${broadcastRes.status}`)

  // With the WsHub Durable Object, broadcasts route to the same DO that holds
  // all WebSocket connections, so cross-isolate delivery works reliably.
  const received = await receivedPromise
  logResult('WebSocket receives broadcast', received, received ? 'DO-routed delivery' : 'broadcast failed to deliver')

  // Test 6: /tasks returns data
  const tasksRes = await fetch(`${GATEWAY}/tasks`, {
    headers: { Origin: ORIGIN },
  })
  logResult('/tasks returns 200', tasksRes.status === 200)

  // Test 7: /ws rejects missing Origin (Cycle 0 origin check)
  const wsNoOriginRes = await fetch(`${GATEWAY}/ws`)
  logResult('/ws without Origin → 403', wsNoOriginRes.status === 403, `got ${wsNoOriginRes.status}`)

  // Test 8: /ws rejects bad Origin
  const wsBadOriginRes = await fetch(`${GATEWAY}/ws`, {
    headers: { Origin: 'https://evil.example.com' },
  })
  logResult('/ws bad Origin → 403', wsBadOriginRes.status === 403, `got ${wsBadOriginRes.status}`)

  // Test 9: Reconnect behavior — close WS, open new one with same Origin
  ws.close()
  await new Promise((r) => setTimeout(r, 500))

  const ws2 = new WebSocket(WS_URL, { headers: { Origin: ORIGIN } })
  const reconnected = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 5000)
    ws2.on('open', () => {
      clearTimeout(timer)
      resolve(true)
    })
    ws2.on('error', () => {
      clearTimeout(timer)
      resolve(false)
    })
  })
  logResult('Client can reconnect after close', reconnected)
  ws2.close()

  // Test 10: Latency — health check should be <500ms (cached edge response)
  const healthStart = Date.now()
  const healthRes = await fetch(`${GATEWAY}/health`)
  const healthTime = Date.now() - healthStart
  logResult('/health responds <500ms', healthRes.ok && healthTime < 500, `${healthTime}ms`)

  // Summary
  console.log('')
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  console.log(`\x1b[1m${passed}/${total} tests passed\x1b[0m`)

  // With the DO, all tests are critical — broadcast delivery is verified
  const allPassed = results.every((r) => r.passed)
  process.exit(allPassed ? 0 : 1)
}

main().catch((e) => {
  console.error('Test suite failed:', e)
  process.exit(1)
})
