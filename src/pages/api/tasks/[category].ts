/**
 * GET /api/tasks/:category — Filter tasks by category
 *
 * :category = ready | attractive | repelled | exploratory
 * Supports ?tag=build&tag=P0
 */
import type { APIRoute } from 'astro'
import * as store from '@/lib/tasks-store'

const CATEGORIES = new Set(['ready', 'attractive', 'repelled', 'exploratory'])

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS })

export const GET: APIRoute = async ({ params, url }) => {
  const { category } = params
  if (!category || !CATEGORIES.has(category)) {
    return new Response(JSON.stringify({ error: `Unknown category: ${category}` }), { status: 400 })
  }

  const tags = url.searchParams.getAll('tag')

  // Use local store if available (no HTTP round-trip)
  const localTasks = store.getAllTasks()
  if (localTasks.length > 0) {
    let filtered = localTasks

    if (tags.length > 0) {
      filtered = filtered.filter((t) => tags.every((tag) => t.tags.includes(tag)))
    }

    const result = filtered
      .map((t) => {
        const repelled = t.alarmPheromone >= 30 && t.alarmPheromone > t.trailPheromone
        const attractive = t.trailPheromone >= 50
        const exploratory = t.trailPheromone === 0 && t.alarmPheromone === 0
        const cat = repelled ? 'repelled' : attractive ? 'attractive' : exploratory ? 'exploratory' : 'ready'
        return {
          tid: t.tid,
          name: t.name,
          status: t.status,
          priority: t.priority,
          phase: t.phase,
          value: t.value,
          persona: t.persona,
          tags: t.tags,
          blockedBy: t.blockedBy,
          blocks: t.blocks,
          trailPheromone: t.trailPheromone,
          alarmPheromone: t.alarmPheromone,
          category: cat,
          attractive,
          repelled,
        }
      })
      .filter((t) => t.category === category)

    return new Response(JSON.stringify({ tasks: result }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }

  // Fallback: fetch from TypeDB path via index route (absolute URL required)
  const qs = new URLSearchParams()
  tags.forEach((t) => qs.append('tag', t))
  const base = `${url.protocol}//${url.host}`
  const res = await fetch(`${base}/api/tasks?${qs}`)
    .then((r) => r.json() as Promise<{ tasks: Array<{ category: string }> }>)
    .catch(() => ({ tasks: [] }))
  const tasks = (res.tasks || []).filter((t: { category: string }) => t.category === category)

  return new Response(JSON.stringify({ tasks }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
