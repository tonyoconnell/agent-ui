/**
 * POST /api/context/ingest — Ingest all docs to TypeDB as knowledge
 *
 * Docs become confirmed hypotheses. The substrate recalls them.
 */

import type { APIRoute } from 'astro'
import { ingestDocs, docIndex } from '@/engine/context'

export const POST: APIRoute = async () => {
  try {
    const count = await ingestDocs()
    const docs = docIndex()
    return new Response(JSON.stringify({
      success: true,
      ingested: count,
      docs: docs.map(d => d.name),
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const GET: APIRoute = async () => {
  const docs = docIndex()
  return new Response(JSON.stringify({
    message: 'POST to ingest docs to TypeDB',
    docs: docs.length,
    preview: docs.slice(0, 10).map(d => ({ name: d.name, title: d.title })),
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
