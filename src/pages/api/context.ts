/**
 * /api/context — Docs as knowledge API
 *
 * GET /api/context                    → doc index
 * GET /api/context?docs=routing,dsl   → merged docs as context
 * GET /api/context?skill=routing      → context for skill
 * GET /api/context?doc=routing        → single doc
 * POST /api/context/ingest            → ingest all docs to TypeDB
 */

import type { APIRoute } from 'astro'
import { CANONICAL, contextForSkill, docIndex, ingestDocs, loadContext, readDoc } from '@/engine/context'

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const docs = url.searchParams.get('docs')
  const skill = url.searchParams.get('skill')
  const doc = url.searchParams.get('doc')

  // Single doc
  if (doc) {
    const content = readDoc(doc)
    if (!content) {
      return new Response(JSON.stringify({ error: 'Doc not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ doc, content }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Context for skill
  if (skill) {
    const context = contextForSkill(skill)
    return new Response(JSON.stringify({ skill, context }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Merged docs
  if (docs) {
    const keys = docs.split(',').map((d) => d.trim())
    const context = loadContext(keys)
    return new Response(JSON.stringify({ docs: keys, context }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Default: index
  const index = docIndex()
  return new Response(
    JSON.stringify({
      canonical: CANONICAL,
      docs: index,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url)

  // Ingest docs to TypeDB
  if (url.pathname.endsWith('/ingest')) {
    const count = await ingestDocs()
    return new Response(JSON.stringify({ ingested: count }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })
}
