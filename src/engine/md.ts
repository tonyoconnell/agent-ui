/**
 * MD — Define agents in markdown
 *
 * No code. The markdown IS the agent.
 *
 * # Name
 * Personality paragraph.
 * ## Steps
 * 1. **name** — prompt for this step
 *    → next-agent (optional cross-agent pipe)
 * ## Skills (unordered, no chain)
 * - **name** — prompt
 *    → target, target (optional fan out)
 * ## Remember
 * - key: value
 * ## Tools
 * - toolName
 * ## Price
 * 0.1 USDC
 */

import { agent, type Agent } from './agent'
import type { Colony } from './substrate'

type Complete = (prompt: string, ctx?: Record<string, unknown>) => Promise<string>

type AgentSpec = {
  id: string
  personality: string
  steps: { name: string; prompt: string; targets?: string[] }[]
  skills: { name: string; prompt: string; targets?: string[] }[]
  memory: Record<string, unknown>
  tools: string[]
  price?: { amount: number; currency: string }
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSE
// ═══════════════════════════════════════════════════════════════════════════

export const parse = (md: string): AgentSpec => {
  const lines = md.split('\n')
  const spec: AgentSpec = { id: '', personality: '', steps: [], skills: [], memory: {}, tools: [] }

  let section = 'top'
  let pendingItem: { name: string; prompt: string; targets?: string[] } | null = null
  const flushItem = () => {
    if (!pendingItem) return
    if (section === 'steps') spec.steps.push(pendingItem)
    else if (section === 'skills') spec.skills.push(pendingItem)
    pendingItem = null
  }

  for (const raw of lines) {
    const line = raw.trim()

    // # Name
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      spec.id = line.slice(2).trim().toLowerCase().replace(/\s+/g, '-')
      continue
    }

    // ## Section headers
    if (line.startsWith('## ')) {
      flushItem()
      const header = line.slice(3).trim().toLowerCase()
      if (header === 'steps') section = 'steps'
      else if (header === 'skills') section = 'skills'
      else if (header.startsWith('remember')) section = 'remember'
      else if (header === 'tools') section = 'tools'
      else if (header === 'price') section = 'price'
      else section = 'other'
      continue
    }

    // Personality: paragraphs before first ## section
    if (section === 'top' && line && spec.id) {
      spec.personality += (spec.personality ? ' ' : '') + line
      continue
    }

    // Arrow lines: → target, target
    if (line.startsWith('→') || line.startsWith('->')) {
      const targets = line.replace(/^(→|->)\s*/, '').split(',').map(t => t.trim()).filter(Boolean)
      if (pendingItem) pendingItem.targets = targets
      continue
    }

    // Steps: 1. **name** — prompt
    if (section === 'steps') {
      const m = line.match(/^\d+\.\s+\*{0,2}(\w[\w-]*)\*{0,2}\s*[—–-]\s*(.+)/)
      if (m) { flushItem(); pendingItem = { name: m[1], prompt: m[2] }; continue }
    }

    // Skills: - **name** — prompt
    if (section === 'skills') {
      const m = line.match(/^[-*]\s+\*{0,2}(\w[\w-]*)\*{0,2}\s*[—–-]\s*(.+)/)
      if (m) { flushItem(); pendingItem = { name: m[1], prompt: m[2] }; continue }
    }

    // Remember: - key: value
    if (section === 'remember') {
      const m = line.match(/^[-*]\s+(\w[\w-]*):\s*(.+)/)
      if (m) {
        const v = m[2].trim()
        spec.memory[m[1]] = v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v
        continue
      }
    }

    // Tools: - toolName
    if (section === 'tools') {
      const m = line.match(/^[-*]\s+(\w[\w-]*)/)
      if (m) { spec.tools.push(m[1]); continue }
    }

    // Price: 0.1 USDC
    if (section === 'price') {
      const m = line.match(/^([\d.]+)\s*(\w+)?/)
      if (m) { spec.price = { amount: +m[1], currency: m[2] || 'USDC' }; continue }
    }
  }

  flushItem()
  return spec
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD
// ═══════════════════════════════════════════════════════════════════════════

export const md = (source: string, net: Colony, complete: Complete, tools?: Record<string, Function>): Agent => {
  const spec = parse(source)
  const a = agent(spec.id, net)

  // Memory
  if (Object.keys(spec.memory).length) a.memory(spec.memory)

  // Tools
  if (tools) a.tools(tools)

  // Steps: ordered skills with implicit chaining
  for (let i = 0; i < spec.steps.length; i++) {
    const step = spec.steps[i]
    a.skill(step.name, async (data, ctx) => {
      const input = typeof data === 'string' ? data : JSON.stringify(data)
      const result = await complete(`${step.prompt}\n\nInput:\n${input}`, { system: spec.personality })
      // Fan out to explicit targets
      step.targets?.forEach(t => ctx.emit({ receiver: t, data: { result } }))
      return { result }
    })
    // Chain: each step pipes to the next
    if (i < spec.steps.length - 1) a.pipe(step.name, spec.steps[i + 1].name)
    // Last step: pipe to explicit target if specified
    if (i === spec.steps.length - 1 && step.targets?.length) {
      step.targets.forEach(t => a.pipe(step.name, t))
    }
  }

  // Skills: unordered, no implicit chain
  for (const skill of spec.skills) {
    a.skill(skill.name, async (data, ctx) => {
      const input = typeof data === 'string' ? data : JSON.stringify(data)
      const result = await complete(`${skill.prompt}\n\nInput:\n${input}`, { system: spec.personality })
      skill.targets?.forEach(t => ctx.emit({ receiver: t, data: { result } }))
      return { result }
    })
  }

  // Price
  if (spec.price) a.price(spec.id, spec.price.amount, spec.price.currency)

  // Evolve (personality becomes system prompt)
  if (spec.personality) a.evolve({ system: spec.personality })

  return a
}
