/**
 * GET /api/tasks/:category — Filter tasks by category
 *
 * :category = ready | attractive | repelled | exploratory
 * Supports ?tag=build&tag=P0
 */
import type { APIRoute } from 'astro'

const CATEGORIES = new Set(['ready', 'attractive', 'repelled', 'exploratory'])

export const GET: APIRoute = async ({ params, url }) => {
  const { category } = params
  if (!category || !CATEGORIES.has(category)) {
    return new Response(JSON.stringify({ error: `Unknown category: ${category}` }), { status: 400 })
  }

  const tags = url.searchParams.getAll('tag')
  const qs = new URLSearchParams()
  tags.forEach(t => qs.append('tag', t))

  const res = await fetch(new URL(`/api/tasks?${qs}`, url).href).then(r => r.json() as Promise<any>).catch(() => ({ tasks: [] }))
  const tasks = (res.tasks || []).filter((t: { category: string }) => t.category === category)

  return new Response(JSON.stringify({ tasks }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
