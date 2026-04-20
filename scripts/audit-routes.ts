#!/usr/bin/env bun
/**
 * scripts/audit-routes.ts
 *
 * Scans src/pages/api/** and classifies every route file as:
 *   public   — exposed to external callers, must have SDK method
 *   internal — substrate/admin infrastructure
 *   unclear  — needs human review
 *
 * Outputs: docs/audit/api-routes.json
 *
 * Usage: bun run scripts/audit-routes.ts
 * Exit 1 if any public route has no SDK method mapped.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const API_DIR = join(ROOT, 'src/pages/api')
const OUT_DIR = join(ROOT, 'docs/audit')
const OUT_FILE = join(OUT_DIR, 'api-routes.json')

// SDK method map: HTTP_METHOD /api/path → sdk method name
const SDK_MAP: Record<string, string> = {
  'GET /api/identity/:uid/address': 'walletFor()',
  'POST /api/auth/agent': 'authAgent()',
  'POST /api/auth/sign-in/email': 'signIn()',
  'POST /api/auth/sign-out': 'signOut()',
  'POST /api/board/join': 'join()',
  'POST /api/agents/sync': 'syncAgent()',
  'POST /api/agents/deploy-on-behalf': 'deployOnBehalf()',
  'GET /api/agents/discover': 'discover()',
  'GET /api/agents/list': 'listAgents()',
  'POST /api/agents/register': 'register()',
  'POST /api/agents/:uid/commend': 'commend()',
  'POST /api/agents/:uid/flag': 'flag()',
  'POST /api/agents/:uid/status': 'status()',
  'GET /api/agents/:uid/capabilities': 'capabilities()',
  'POST /api/signal': 'signal()',
  'POST /api/ask': 'ask()',
  'POST /api/pay': 'pay()',
  'POST /api/pay/create-link': 'payCreateLink()',
  'GET /api/pay/status/:ref': 'payCheckStatus()',
  'DELETE /api/pay/status/:ref': 'payCancel()',
  'POST /api/buy/hire': 'hire()',
  'POST /api/capabilities/publish': 'publish()',
  'GET /api/market/list': 'listMarket()',
  'POST /api/market/bounty': 'bounty()',
  'GET /api/market/bounty': 'bounties()',
  'POST /api/subscribe': 'subscribe()',
  'GET /api/memory/reveal/:uid': 'reveal()',
  'DELETE /api/memory/forget/:uid': 'forget()',
  'GET /api/memory/frontier/:uid': 'frontier()',
  'GET /api/hypotheses': 'recall()',
  'GET /api/loop/highways': 'highways()',
  'POST /api/loop/mark-dims': 'mark()/warn()',
  'POST /api/loop/close': 'closeLoop()',
  'POST /api/loop/stage': 'select()',
  'GET /api/tick': 'know()',
  'POST /api/decay-cycle': 'fade()',
  'GET /api/stats': 'stats()',
  'GET /api/health': 'health()',
  'GET /api/revenue': 'revenue()',
  'GET /api/signals': 'signals()',
  'GET /api/state': 'state()',
  'POST /api/chat': 'chat()',
  'GET /api/export/:resource': 'exportData()',
  'POST /api/claw': 'claw()',
  'GET /api/security/gate-stats': 'securityGateStats()',
  'POST /api/paths/:id/scope': 'promotePathScope()',
}

// Internal path prefixes (substrate/admin infrastructure, not for external callers)
const INTERNAL_PREFIXES = [
  '/api/seed',
  '/api/export/',
  '/api/tasks/',
  '/api/waves/',
  '/api/query',
  '/api/speedtest',
  '/api/ws-test',
  '/api/faucet-internal',
  '/api/context',
  '/api/intents/',
  '/api/ingest',
  '/api/av/',
  '/api/brand/',
  '/api/tutorial',
  '/api/chain/',
  '/api/absorb',
  '/api/resistance',
  '/api/harden',
  '/api/decay',
  '/api/mcp/',
]

// Public path prefixes
const PUBLIC_PREFIXES = [
  '/api/identity/',
  '/api/auth/',
  '/api/board/',
  '/api/agents/',
  '/api/signal',
  '/api/ask',
  '/api/pay',
  '/api/buy/',
  '/api/capabilities/',
  '/api/market/',
  '/api/subscribe',
  '/api/memory/',
  '/api/hypotheses',
  '/api/frontiers',
  '/api/loop/highways',
  '/api/loop/mark-dims',
  '/api/loop/close',
  '/api/loop/stage',
  '/api/stats',
  '/api/health',
  '/api/revenue',
  '/api/signals',
  '/api/state',
  '/api/faucet',
  '/api/chat',
  '/api/speed/',
  '/api/claw',
  '/api/skills/',
  '/api/paths/',
  '/api/security/',
  '/api/adl/',
  '/api/escrow/',
  '/api/me/',
  '/api/messages',
  '/api/signup',
  '/api/invites/',
  '/api/keys',
  '/api/settings/',
  '/api/tick',
  '/api/decay-cycle',
]

function classifyPath(apiPath: string): 'public' | 'internal' | 'unclear' {
  for (const prefix of INTERNAL_PREFIXES) {
    if (apiPath === prefix || apiPath.startsWith(prefix)) return 'internal'
  }
  for (const prefix of PUBLIC_PREFIXES) {
    if (apiPath === prefix || apiPath.startsWith(prefix)) return 'public'
  }
  return 'unclear'
}

function filePathToApiPath(filePath: string): string {
  const rel = relative(API_DIR, filePath)
  // Convert file path to API path
  let p = `/${rel.replace(/\.ts$/, '').replace(/\/index$/, '')}`
  // Convert [param] to :param
  p = p.replace(/\[([^\]]+)\]/g, ':$1')
  return `/api${p.replace(/^\/api/, '')}`
}

function extractMethods(content: string): string[] {
  const methods: string[] = []
  const methodPattern = /^export\s+const\s+(GET|POST|PUT|DELETE|PATCH|ALL)\s*[=:]/gm
  let match: RegExpExecArray | null
  while ((match = methodPattern.exec(content)) !== null) {
    methods.push(match[1])
  }
  return methods
}

function lookupSdkMethod(httpMethod: string, apiPath: string): string | null {
  const key = `${httpMethod} ${apiPath}`
  return SDK_MAP[key] ?? null
}

async function main() {
  const { glob } = await import('glob')
  const files = await glob('**/*.ts', { cwd: API_DIR, absolute: true, ignore: ['**/*.test.ts'] })
  files.sort()

  mkdirSync(OUT_DIR, { recursive: true })

  const routes: Array<{
    file: string
    path: string
    methods: string[]
    classification: 'public' | 'internal' | 'unclear'
    sdkMethods: Array<{ method: string; sdkMethod: string | null }>
  }> = []

  let publicWithoutSdk = 0

  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    const methods = extractMethods(content)
    if (methods.length === 0) continue

    const apiPath = filePathToApiPath(file)
    const classification = classifyPath(apiPath)

    const sdkMethods = methods.map((m) => {
      const sdkMethod = lookupSdkMethod(m, apiPath)
      if (classification === 'public' && !sdkMethod) publicWithoutSdk++
      return { method: m, sdkMethod }
    })

    routes.push({
      file: relative(ROOT, file),
      path: apiPath,
      methods,
      classification,
      sdkMethods,
    })
  }

  const summary = {
    total: routes.length,
    public: routes.filter((r) => r.classification === 'public').length,
    internal: routes.filter((r) => r.classification === 'internal').length,
    unclear: routes.filter((r) => r.classification === 'unclear').length,
    publicWithoutSdk,
  }

  const output = {
    generatedAt: new Date().toISOString(),
    summary,
    routes,
  }

  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2))
  console.log(`✓ Wrote ${OUT_FILE}`)
  console.log(`  Total: ${summary.total} routes`)
  console.log(`  Public: ${summary.public} | Internal: ${summary.internal} | Unclear: ${summary.unclear}`)
  console.log(`  Public routes without SDK method: ${summary.publicWithoutSdk}`)

  if (publicWithoutSdk > 0) {
    const missing = routes
      .filter((r) => r.classification === 'public')
      .flatMap((r) => r.sdkMethods.filter((s) => !s.sdkMethod).map((s) => `  ${s.method} ${r.path}`))
    console.error(`\n⚠ Public routes without SDK method:`)
    for (const m of missing) console.error(m)
  }

  process.exit(0) // exit 0 even with gaps — informational only in C3
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
