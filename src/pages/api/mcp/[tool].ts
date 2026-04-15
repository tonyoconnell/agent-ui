/**
 * POST /api/mcp/:tool — MCP tool HTTP adapter
 * GET  /api/mcp/:tool — returns the tool schema
 *
 * Exposes the 15 @oneie/mcp tools over HTTP so remote clients
 * (Claude Code, Cursor, scripts) can drive the substrate without
 * a local stdio MCP server.
 *
 * Body (POST): arbitrary JSON matching the tool's inputSchema.
 * Response: { result }  on success
 *           { error }   on unknown tool or handler throw
 */

import { createOneRouter } from '@oneie/mcp'
import type { APIRoute } from 'astro'

const router = createOneRouter()

export const GET: APIRoute = ({ params }) => {
  const toolName = params.tool
  if (!toolName) {
    return new Response(JSON.stringify({ error: 'tool name required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (toolName === '__list') {
    const tools = Array.from(router.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }))
    return Response.json({ tools })
  }
  const tool = router.tools.get(toolName)
  if (!tool) {
    return new Response(JSON.stringify({ error: `unknown tool: ${toolName}` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return Response.json({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  })
}

export const POST: APIRoute = async ({ params, request }) => {
  const toolName = params.tool
  if (!toolName) {
    return new Response(JSON.stringify({ error: 'tool name required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const args = (await request.json().catch(() => ({}))) as Record<string, unknown>
  try {
    const result = await router.call(toolName, args)
    return Response.json({ result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const status = msg.startsWith('unknown tool') ? 404 : 500
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
