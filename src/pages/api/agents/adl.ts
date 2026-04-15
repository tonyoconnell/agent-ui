/**
 * POST /api/agents/adl
 *
 * Sync agents from ADL (Agent Definition Language) JSON to TypeDB.
 *
 * Spec: https://www.adl-spec.org/spec
 * ADL is a JSON "passport" for AI agents: identity, capabilities, permissions,
 * data classification, and lifecycle.
 *
 * Authentication: Bearer <api_key> (optional, required for certain operations)
 *
 * Body:
 *   { json: AdlDoc }           - Single ADL document
 *   { documents: AdlDoc[] }    - Multiple ADL documents
 */

import type { APIRoute } from 'astro'
import { parse, syncAdl, toTypeDB, validate } from '@/engine/adl'
import { validateApiKey } from '@/lib/api-auth'

export const POST: APIRoute = async ({ request }) => {
  // Validate API key if provided (optional for now, can be required later)
  const _auth = await validateApiKey(request)

  try {
    const body = (await request.json()) as any

    // Single ADL document
    if (body.json || body.adl) {
      const json = body.json || body.adl
      const validation = validate(json)

      if (!validation.ok) {
        return Response.json({ error: 'Invalid ADL document', details: validation.errors }, { status: 422 })
      }

      const doc = parse(json)
      await syncAdl(doc)

      return Response.json({
        ok: true,
        id: doc.id,
        name: doc.name,
        version: doc.version,
        status: doc.status || 'active',
        skills: doc.capabilities?.tools?.map((t) => t.name) || [],
      })
    }

    // Multiple ADL documents
    if (body.documents && Array.isArray(body.documents)) {
      const results = []

      for (const doc of body.documents) {
        const validation = validate(doc)
        if (!validation.ok) {
          return Response.json(
            { error: `Invalid ADL in batch: ${doc.id}`, details: validation.errors },
            { status: 422 },
          )
        }

        const parsed = parse(doc)
        await syncAdl(parsed)

        results.push({
          id: parsed.id,
          name: parsed.name,
          version: parsed.version,
          status: parsed.status || 'active',
          skills: parsed.capabilities?.tools?.map((t) => t.name) || [],
        })
      }

      return Response.json({
        ok: true,
        count: results.length,
        documents: results,
      })
    }

    return Response.json({ error: 'Invalid body. Provide json (or adl) or documents[]' }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}

// GET: Generate TypeDB queries without executing (dry run)
export const GET: APIRoute = async ({ url }) => {
  const adlJson = url.searchParams.get('json')
  if (!adlJson) {
    return Response.json({ error: 'Provide ?json= query param (URL-encoded ADL JSON)' }, { status: 400 })
  }

  try {
    const parsed = parse(JSON.parse(decodeURIComponent(adlJson)))
    const queries = toTypeDB(parsed)

    return Response.json({
      doc: parsed,
      queries,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON'
    return Response.json({ error: msg }, { status: 400 })
  }
}
