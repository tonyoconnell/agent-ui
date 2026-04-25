/// <reference types="@cloudflare/workers-types" />
/**
 * Backup Worker — KV snapshots → R2 daily archive
 * Scheduled: 02:00 UTC daily
 *
 * Two jobs:
 *   1. KV → R2   Snapshot the 5 runtime keys to `typedb/{YYYY-MM-DD}/{key}`
 *   2. Prune     Delete R2 objects older than 30 days
 *
 * Restore: see scripts/restore-typedb.ts — reads R2 by date, replays to TypeDB.
 */

interface Env {
  KV: KVNamespace
  BACKUP: R2Bucket
}

const SNAPSHOT_KEYS = ['paths.json', 'units.json', 'skills.json', 'highways.json', 'toxic.json']
const RETENTION_DAYS = 30

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(run(env))
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    await run(env)
    return Response.json({ ok: true })
  },
}

async function run(env: Env): Promise<void> {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  // 1. Backup: read from KV, write to R2
  let backed = 0
  for (const key of SNAPSHOT_KEYS) {
    const data = await env.KV.get(key, 'text')
    if (data) {
      await env.BACKUP.put(`typedb/${date}/${key}`, data, {
        httpMetadata: { contentType: 'application/json' },
        customMetadata: { backedAt: new Date().toISOString() },
      })
      backed++
    }
  }

  // 2. Prune: list and delete objects older than 30 days
  let pruned = 0
  const listed = await env.BACKUP.list({ prefix: 'typedb/' })
  for (const obj of listed.objects) {
    const parts = obj.key.split('/')
    const objDate = parts[1]
    if (objDate && objDate < cutoffStr) {
      await env.BACKUP.delete(obj.key)
      pruned++
    }
  }

  console.log(`[backup] ${date}: backed=${backed} keys pruned=${pruned} cutoff=${cutoffStr}`)
}
