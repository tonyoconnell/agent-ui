/**
 * POST /api/claw — Generate NanoClaw config for any agent
 *
 * Body:
 *   { agentId: string }           - Read from agents/<id>.md or TypeDB
 *   { markdown: string }          - Direct markdown input
 *   { name, model, systemPrompt } - Direct config
 *
 * Returns:
 *   { persona, wranglerConfig, deployCommand, webhookCommand }
 *
 * This endpoint generates the config. Actual deployment requires wrangler CLI.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { APIRoute } from 'astro'
import { parse } from '@/engine/agent-md'

interface ClawRequest {
  agentId?: string
  markdown?: string
  name?: string
  model?: string
  systemPrompt?: string
  telegramToken?: string
}

interface Persona {
  name: string
  description: string
  model: string
  systemPrompt: string
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS })

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      usage: 'POST /api/claw with { agentId } or { markdown } or { name, model, systemPrompt }',
      example: {
        agentId: 'tutor',
        telegramToken: '1234567890:ABC... (optional)',
      },
    }),
    { headers: { 'Content-Type': 'application/json', ...CORS } },
  )
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as ClawRequest
    let persona: Persona

    // Option 1: Read from agent markdown file
    if (body.agentId) {
      const agentPath = join(process.cwd(), 'agents', `${body.agentId}.md`)
      const groupPaths = [
        join(process.cwd(), 'agents', 'marketing', `${body.agentId}.md`),
        join(process.cwd(), 'agents', 'donal', `${body.agentId}.md`),
        join(process.cwd(), 'agents', 'debbie', `${body.agentId}.md`),
      ]

      let markdown: string | null = null
      const tryPath = [agentPath, ...groupPaths].find((p) => existsSync(p))
      if (tryPath) {
        markdown = readFileSync(tryPath, 'utf8')
      }

      if (!markdown) {
        return new Response(JSON.stringify({ error: `Agent ${body.agentId} not found in agents/ directory` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...CORS },
        })
      }

      const spec = parse(markdown)
      persona = {
        name: spec.name,
        description: `Agent: ${spec.name}`,
        model: spec.model || 'anthropic/claude-haiku-4-5',
        systemPrompt: spec.prompt || `You are ${spec.name}.`,
      }
    }
    // Option 2: Parse markdown directly
    else if (body.markdown) {
      const spec = parse(body.markdown)
      persona = {
        name: spec.name,
        description: `Agent: ${spec.name}`,
        model: spec.model || 'anthropic/claude-haiku-4-5',
        systemPrompt: spec.prompt || `You are ${spec.name}.`,
      }
    }
    // Option 3: Direct config
    else if (body.name && body.systemPrompt) {
      persona = {
        name: body.name,
        description: `Agent: ${body.name}`,
        model: body.model || 'anthropic/claude-haiku-4-5',
        systemPrompt: body.systemPrompt,
      }
    } else {
      return new Response(JSON.stringify({ error: 'Provide agentId, markdown, or {name, systemPrompt}' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // Generate wrangler config
    const workerName = `${persona.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-claw`
    const queueName = `${workerName}-queue`

    const wranglerConfig = `# ${persona.name} NanoClaw Worker
name = "${workerName}"
main = "src/workers/router.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
BOT_PERSONA = "${persona.name.toLowerCase().replace(/[^a-z0-9]/g, '')}"

[[queues.producers]]
queue = "${queueName}"
binding = "SUBSTRATE_QUEUE"

[[queues.consumers]]
queue = "${queueName}"
max_batch_size = 10

[triggers]
crons = ["* * * * *"]

# Secrets (set with: wrangler secret put)
# OPENROUTER_API_KEY
# TELEGRAM_TOKEN (optional — get from @BotFather)
# API_KEY (optional — enables auth on non-webhook routes)
`

    // Generate persona entry for personas.ts
    const personaEntry = `  ${persona.name.toLowerCase().replace(/[^a-z0-9]/g, '')}: {
    name: '${persona.name}',
    description: '${persona.description}',
    model: '${persona.model}',
    systemPrompt: \`${persona.systemPrompt.replace(/`/g, '\\`')}\`,
  },`

    // Generate deploy commands
    const deployCommands = [
      `# 1. Add persona to nanoclaw/src/personas.ts`,
      `# 2. Create wrangler config: nanoclaw/wrangler.${workerName}.toml`,
      `# 3. Deploy:`,
      `cd nanoclaw`,
      `wrangler deploy --config wrangler.${workerName}.toml`,
      `wrangler secret put OPENROUTER_API_KEY --config wrangler.${workerName}.toml`,
      body.telegramToken
        ? `wrangler secret put TELEGRAM_TOKEN --config wrangler.${workerName}.toml`
        : '# wrangler secret put TELEGRAM_TOKEN --config ... (optional)',
      ``,
      `# 4. Register Telegram webhook (if using Telegram):`,
      body.telegramToken
        ? `curl "https://api.telegram.org/bot${body.telegramToken}/setWebhook?url=https://${workerName}.oneie.workers.dev/webhook/telegram"`
        : `# curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://${workerName}.oneie.workers.dev/webhook/telegram"`,
    ].join('\n')

    // Quick deploy command
    const quickDeploy = `bun run scripts/setup-nanoclaw.ts --name ${persona.name.toLowerCase().replace(/[^a-z0-9]/g, '-')} --agent ${body.agentId || persona.name.toLowerCase()}`

    return new Response(
      JSON.stringify({
        ok: true,
        persona,
        workerName,
        workerUrl: `https://${workerName}.oneie.workers.dev`,
        webhookUrl: `https://${workerName}.oneie.workers.dev/webhook/telegram`,
        wranglerConfig,
        personaEntry,
        deployCommands,
        quickDeploy,
        tools: [
          'signal — emit a signal to the substrate',
          'discover — find agents by tag or capability',
          'remember — store insight in TypeDB',
          'recall — retrieve learned patterns',
          'highways — get proven paths',
          'mark — strengthen a path',
          'warn — weaken a path',
        ],
      }),
      { headers: { 'Content-Type': 'application/json', ...CORS } },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
}
