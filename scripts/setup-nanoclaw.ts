#!/usr/bin/env bun
/**
 * setup-nanoclaw.ts — Deploy a NanoClaw instance for an agent in one command.
 *
 * Usage:
 *   bun run scripts/setup-nanoclaw.ts --name donal --persona donal
 *   bun run scripts/setup-nanoclaw.ts --name donal --persona donal --token 1234:ABC...
 *
 * What it does:
 *   1. Generates a secure API key
 *   2. Creates a wrangler config for the agent
 *   3. Creates the CF queue
 *   4. Deploys the worker
 *   5. Sets OPENROUTER_API_KEY and API_KEY secrets
 *   6. Registers Telegram webhook if --token provided
 *   7. Prints full credential summary
 */

import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Config ──────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dir, '..')
const NANOCLAW = resolve(ROOT, 'nanoclaw')
const ENV_FILE = resolve(ROOT, '.env')

// ─── Args ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const get = (flag: string) => {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : null
}

let name = get('--name')
let persona = get('--persona')
const agentId = get('--agent')
const telegramToken = get('--token')

// If --agent is provided, read from agent markdown file
if (agentId) {
  const agentPath = resolve(ROOT, 'agents', `${agentId}.md`)
  const groupPaths = [
    resolve(ROOT, 'agents', 'marketing', `${agentId}.md`),
    resolve(ROOT, 'agents', 'donal', `${agentId}.md`),
    resolve(ROOT, 'agents', 'debbie', `${agentId}.md`),
  ]

  let agentFile: string | null = null
  const tryPath = [agentPath, ...groupPaths].find((p) => existsSync(p))
  if (tryPath) {
    agentFile = readFileSync(tryPath, 'utf8')
  }

  if (!agentFile) {
    console.error(`Agent ${agentId} not found in agents/ directory`)
    console.log(`Tried: ${[agentPath, ...groupPaths].join(', ')}`)
    process.exit(1)
  }

  // Parse agent markdown (simple YAML frontmatter extraction)
  const frontmatterMatch = agentFile.match(/^---\n([\s\S]*?)\n---/)
  const body = agentFile.replace(/^---\n[\s\S]*?\n---\n*/, '').trim()

  if (frontmatterMatch) {
    const fm = frontmatterMatch[1]
    const getName = fm.match(/^name:\s*(.+)$/m)?.[1]?.trim()
    const getModel = fm.match(/^model:\s*(.+)$/m)?.[1]?.trim()

    name = name || getName || agentId
    persona = persona || getName?.toLowerCase().replace(/[^a-z0-9]/g, '') || agentId

    // Dynamically add persona if not in personas.ts
    const { personas } = await import('../nanoclaw/src/personas.ts')
    if (!personas[persona]) {
      console.log(`\n📝 Agent "${agentId}" not in personas.ts — adding dynamically...`)
      const personaEntry = `
  ${persona}: {
    name: '${getName || agentId}',
    description: 'Agent from ${agentId}.md',
    model: '${getModel || 'anthropic/claude-haiku-4-5'}',
    systemPrompt: \`${body.replace(/`/g, '\\`').slice(0, 2000)}\`,
  },`

      const personasPath = resolve(ROOT, 'nanoclaw/src/personas.ts')
      const personasContent = readFileSync(personasPath, 'utf8')
      const updated = personasContent.replace(
        /export const personas: Record<string, Persona> = \{/,
        `export const personas: Record<string, Persona> = {${personaEntry}`,
      )
      writeFileSync(personasPath, updated)
      console.log(`   → Added persona "${persona}" to nanoclaw/src/personas.ts`)
    }
  }
}

if (!name || !persona) {
  const { personas } = await import('../nanoclaw/src/personas.ts')
  console.log(`
Usage:
  bun run scripts/setup-nanoclaw.ts --name <name> --persona <persona> [--token <telegram_token>]
  bun run scripts/setup-nanoclaw.ts --name <name> --agent <agent-id> [--token <telegram_token>]

Available personas:
${Object.entries(personas)
  .map(([k, v]) => `  ${k.padEnd(16)} — ${(v as { description: string }).description}`)
  .join('\n')}

Available agents (agents/*.md):
  ${
    existsSync(resolve(ROOT, 'agents'))
      ? `${execSync('ls agents/*.md agents/**/*.md 2>/dev/null || true', { cwd: ROOT, encoding: 'utf8' })
          .split('\n')
          .filter(Boolean)
          .map((f) => f.replace('agents/', '').replace('.md', ''))
          .slice(0, 10)
          .join(', ')}...`
      : 'none'
  }

Examples:
  bun run scripts/setup-nanoclaw.ts --name donal --persona donal --token 1234:ABC...
  bun run scripts/setup-nanoclaw.ts --name tutor --agent tutor
  bun run scripts/setup-nanoclaw.ts --name creative --agent marketing/creative
`)
  process.exit(1)
}

// ─── Load env ────────────────────────────────────────────────────────────────

function loadEnv(): Record<string, string> {
  if (!existsSync(ENV_FILE)) return {}
  return Object.fromEntries(
    readFileSync(ENV_FILE, 'utf8')
      .split('\n')
      .filter((l) => l.includes('=') && !l.startsWith('#'))
      .map((l) => {
        const [k, ...v] = l.split('=')
        return [k.trim(), v.join('=').trim()]
      }),
  )
}

const env = loadEnv()
const CF_API_KEY = env.CLOUDFLARE_GLOBAL_API_KEY
const CF_EMAIL = env.CLOUDFLARE_EMAIL
const _CF_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID
const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY

if (!CF_API_KEY || !CF_EMAIL) {
  console.error('Missing CLOUDFLARE_GLOBAL_API_KEY or CLOUDFLARE_EMAIL in .env')
  process.exit(1)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CF_ENV = {
  ...process.env,
  CLOUDFLARE_API_KEY: CF_API_KEY,
  CLOUDFLARE_EMAIL: CF_EMAIL,
}

function run(cmd: string, opts: { cwd?: string; silent?: boolean } = {}) {
  try {
    const out = execSync(cmd, {
      cwd: opts.cwd ?? NANOCLAW,
      env: CF_ENV,
      encoding: 'utf8',
      stdio: opts.silent ? 'pipe' : 'inherit',
    })
    return out
  } catch (e: any) {
    if (e.stdout) process.stdout.write(e.stdout)
    if (e.stderr) process.stderr.write(e.stderr)
    throw e
  }
}

function setSecret(workerConfig: string, secretName: string, secretValue: string) {
  const proc = Bun.spawnSync(['npx', 'wrangler', 'secret', 'put', secretName, '--config', workerConfig], {
    cwd: NANOCLAW,
    env: CF_ENV,
    stdin: new TextEncoder().encode(`${secretValue}\n`),
  })
  if (proc.exitCode !== 0) {
    throw new Error(`Failed to set secret ${secretName}: ${new TextDecoder().decode(proc.stderr)}`)
  }
}

function generateApiKey() {
  return randomBytes(32).toString('hex')
}

// ─── Main ────────────────────────────────────────────────────────────────────

const workerName = `${name}-claw`
const queueName = `${name}-agents`
const configPath = resolve(NANOCLAW, `wrangler.${name}.toml`)
const workerUrl = `https://${workerName}.oneie.workers.dev`
const apiKey = generateApiKey()

console.log(`\n🦀 Setting up NanoClaw for: ${name} (persona: ${persona})\n`)

// Step 1 — Write wrangler config
console.log('1/5 Writing wrangler config...')
const wranglerConfig = `# ${workerName} — NanoClaw instance for ${name}
# Generated by scripts/setup-nanoclaw.ts
# Deploy: cd nanoclaw && npx wrangler deploy --config wrangler.${name}.toml

name = "${workerName}"
main = "src/workers/router.ts"
workers_dev = true
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[vars]
VERSION = "1.0.0"
GATEWAY_URL = "https://one-gateway.oneie.workers.dev"
BOT_PERSONA = "${persona}"

[[d1_databases]]
binding = "DB"
database_name = "one"
database_id = "0aa5fceb-667a-470e-b08c-40ead2f4525d"

[[kv_namespaces]]
binding = "KV"
id = "1c1dac4766e54a2c85425022a3b1e9da"

[[queues.producers]]
binding = "AGENT_QUEUE"
queue = "${queueName}"

[[queues.consumers]]
queue = "${queueName}"
max_batch_size = 10
max_batch_timeout = 30
max_retries = 3

# Secrets (set via setup-nanoclaw.ts or: wrangler secret put --config wrangler.${name}.toml)
# OPENROUTER_API_KEY
# API_KEY
# TELEGRAM_TOKEN   (optional — wire after getting token from BotFather)
`
writeFileSync(configPath, wranglerConfig)
console.log(`   → ${configPath}`)

// Step 2 — Create queue
console.log(`\n2/5 Creating queue '${queueName}'...`)
try {
  run(`npx wrangler queues create ${queueName} --config wrangler.${name}.toml`, { silent: true })
  console.log(`   → Queue created`)
} catch {
  console.log(`   → Queue already exists (skipping)`)
}

// Step 3 — Deploy worker
console.log(`\n3/5 Deploying worker '${workerName}'...`)
run(`npx wrangler deploy --config wrangler.${name}.toml`)

// Step 4 — Set secrets
console.log(`\n4/5 Setting secrets...`)
if (OPENROUTER_API_KEY) {
  setSecret(`wrangler.${name}.toml`, 'OPENROUTER_API_KEY', OPENROUTER_API_KEY)
  console.log('   → OPENROUTER_API_KEY set')
} else {
  console.warn('   ⚠ OPENROUTER_API_KEY not in .env — set manually')
}

setSecret(`wrangler.${name}.toml`, 'API_KEY', apiKey)
console.log('   → API_KEY set')

if (telegramToken) {
  setSecret(`wrangler.${name}.toml`, 'TELEGRAM_TOKEN', telegramToken)
  console.log('   → TELEGRAM_TOKEN set')
}

// Step 5 — Register Telegram webhook
if (telegramToken) {
  console.log(`\n5/5 Registering Telegram webhook...`)
  const webhookUrl = `${workerUrl}/webhook/telegram`
  const res = await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${webhookUrl}`)
  const data = (await res.json()) as any
  if (data.ok) {
    console.log(`   → Webhook registered: ${webhookUrl}`)
  } else {
    console.error(`   ✗ Webhook failed: ${data.description}`)
  }
} else {
  console.log(`\n5/5 Skipping webhook (no --token provided)`)
}

// ─── Output credentials ───────────────────────────────────────────────────────

const { personas } = await import('../nanoclaw/src/personas.ts')
const personaInfo = personas[persona]

console.log(`
${'═'.repeat(60)}
  NanoClaw ready: ${workerName}
${'═'.repeat(60)}

  Worker URL : ${workerUrl}
  Persona    : ${personaInfo?.name ?? persona}
  Health     : ${workerUrl}/health  (public)
  Webhooks   : ${workerUrl}/webhook/telegram  (no auth needed)
  API        : requires Authorization: Bearer <key>

  API Key    : ${apiKey}

  Test:
  curl -X POST ${workerUrl}/message \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer ${apiKey}" \\
    -d '{"group":"test","text":"Hello"}'

${telegramToken ? `  Telegram webhook: ${workerUrl}/webhook/telegram\n  Register webhook if bot token changes:\n  curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=${workerUrl}/webhook/telegram"` : `  To wire Telegram later:\n  bun run scripts/setup-nanoclaw.ts --name ${name} --persona ${persona} --token <BOT_TOKEN>\n  (or just re-run with --token — it will skip queue/deploy steps if config exists)`}
${'═'.repeat(60)}
`)
