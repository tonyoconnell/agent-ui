import type { APIRoute } from 'astro'
import { auditSkills } from '@/engine/skill-audit'

export const GET: APIRoute = async ({ url }) => {
  const raw = url.searchParams.get('tags') ?? ''
  const tags = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const budgetParam = url.searchParams.get('budget')
  const budget = budgetParam !== null ? Number(budgetParam) : undefined

  const requesterUid = url.searchParams.get('requester') ?? undefined

  if (tags.length === 0) {
    return Response.json({ error: 'tags param required (comma-separated)' }, { status: 400 })
  }

  const result = await auditSkills(tags, { budget, requesterUid })
  return Response.json(result)
}
