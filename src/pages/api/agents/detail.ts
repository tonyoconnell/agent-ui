/**
 * GET /api/agents/detail?id=group:name — Read a single agent from markdown
 *
 * Returns full agent spec including system prompt for chat.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id')
  if (!id) {
    return Response.json({ error: 'id parameter required' }, { status: 400 })
  }

  // Parse id: "group:name" or just "name"
  const parts = id.split(':')
  const name = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  const group = parts.length > 1 ? parts[0] : null

  const agentsDir = join(process.cwd(), 'agents')

  // Search for the agent markdown file
  const searchDirs = group
    ? [join(agentsDir, group)]
    : [
        agentsDir,
        ...(await readdir(agentsDir, { withFileTypes: true }).then((entries) =>
          entries.filter((e) => e.isDirectory()).map((e) => join(agentsDir, e.name)),
        )),
      ]

  for (const dir of searchDirs) {
    const entries = await readdir(dir).catch(() => [] as string[])
    for (const file of entries) {
      if (!file.endsWith('.md') || file === 'README.md') continue
      const content = await readFile(join(dir, file), 'utf-8').catch(() => '')
      if (!content) continue

      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (!match) continue

      const nameMatch = match[1].match(/^name:\s*(.+)/m)
      if (!nameMatch || nameMatch[1].trim() !== name) continue

      // Found the agent — parse it
      const meta = match[1]
      const body = match[2].trim()

      const modelMatch = meta.match(/^model:\s*(.+)/m)
      const groupMatch = meta.match(/^group:\s*(.+)/m)
      const sensitivityMatch = meta.match(/^sensitivity:\s*(.+)/m)

      // Parse channels
      const channelsMatch = meta.match(/^channels:\s*\[([^\]]*)\]/m)
      const channels = channelsMatch ? channelsMatch[1].split(',').map((s) => s.trim()) : []

      // Parse skills (simplified)
      const skills: { name: string; price: number; tags: string[]; description?: string }[] = []
      const skillBlocks = meta.split(/\n\s+-\s+name:\s*/)
      for (let i = 1; i < skillBlocks.length; i++) {
        const block = skillBlocks[i]
        const sName = block.split('\n')[0].trim()
        const priceM = block.match(/price:\s*([\d.]+)/)
        const tagsM = block.match(/tags:\s*\[([^\]]*)\]/)
        const descM = block.match(/description:\s*(.+)/)
        skills.push({
          name: sName,
          price: priceM ? Number(priceM[1]) : 0,
          tags: tagsM ? tagsM[1].split(',').map((s) => s.trim()) : [],
          description: descM ? descM[1].trim() : undefined,
        })
      }

      // Collect tags
      const tagsMatch = meta.match(/^tags:\s*\[([^\]]*)\]/m)
      const explicitTags = tagsMatch ? tagsMatch[1].split(',').map((s) => s.trim()) : []
      const skillTags = skills.flatMap((s) => s.tags)
      const allTags = [...new Set([...explicitTags, ...skillTags])]

      const agentGroup = groupMatch ? groupMatch[1].trim() : group || 'standalone'

      return Response.json({
        id: `${agentGroup !== 'standalone' ? `${agentGroup}:` : ''}${name}`,
        name,
        group: agentGroup,
        model: modelMatch ? modelMatch[1].trim() : 'default',
        tags: allTags,
        skills,
        channels,
        sensitivity: sensitivityMatch ? Number(sensitivityMatch[1]) : 0.5,
        prompt: body,
      })
    }
  }

  return Response.json({ error: 'Agent not found' }, { status: 404 })
}
