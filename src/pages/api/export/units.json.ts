import type { APIRoute } from 'astro'
import { getUnitMeta } from '@/lib/net'

export const GET: APIRoute = async () => {
  const unitMeta = getUnitMeta()
  const units = Object.entries(unitMeta).map(([id, m]) => ({
    id,
    name: m.name,
    model: 'meta-llama/llama-4-maverick',
    successRate: Math.round(m.successRate * 100),
    group: id.includes(':') ? id.split(':')[0] : undefined,
  }))
  return new Response(JSON.stringify(units), {
    headers: { 'Content-Type': 'application/json' },
  })
}
