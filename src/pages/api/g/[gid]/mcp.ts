/**
 * GET /api/g/:gid/mcp — MCP tool manifest for a group
 *
 * Returns an MCP-compatible list of tools derived from the group's
 * public skill capabilities. Each skill becomes a callable tool.
 *
 * Format follows Model Context Protocol tool manifest shape.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const prerender = false

type McpTool = {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required: string[]
  }
}

export const GET: APIRoute = async ({ params }) => {
  const gid = params.gid as string

  try {
    const rows = await readParsed(`
      match
        $g isa group, has group-id "${gid}";
        $u isa unit, has uid $uid, has name $uname;
        (member: $u, group: $g) isa membership;
        $s isa skill, has skill-id $sid, has name $sname;
        (provider: $u, offered: $s) isa capability;
      select $uid, $uname, $sid, $sname;
    `)

    const tools: McpTool[] = rows.map((r) => ({
      name: r.sid as string,
      description: `${r.sname as string} provided by ${r.uname as string}`,
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Input content for the skill' },
        },
        required: ['content'],
      },
    }))

    return Response.json({ tools, group: gid }, { headers: { 'Cache-Control': 'public, max-age=30' } })
  } catch {
    return Response.json({ tools: [], group: gid }, { status: 500 })
  }
}
