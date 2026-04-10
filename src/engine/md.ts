/**
 * MD — Define agents in markdown
 *
 * Same format as the Python parser. Runs on the ONE substrate.
 * Steps, skills, arrows, intervals, memory (per-user), tiers, secrets, tools, price.
 */

import { agent, type Agent } from './agent'
import type { World } from './world'

type Complete = (prompt: string, ctx?: Record<string, unknown>) => Promise<string>

type SkillSpec = { name: string; prompt: string; targets?: string[] }

type TierSpec = {
  name: string
  quota?: number
  period: string
  description: string
  threshold: number
  token: string
}

type AgentSpec = {
  id: string
  personality: string
  steps: SkillSpec[]
  skills: SkillSpec[]
  interval?: { seconds: number; prompt: string }
  memory: Record<string, unknown>
  perUser: boolean
  tiers: TierSpec[]
  secrets: string[]
  tools: string[]
  price?: { amount: number; currency: string }
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSE
// ═══════════════════════════════════════════════════════════════════════════

const parseInterval = (header: string): number | null => {
  const m = header.match(/(\d+)\s*(seconds?|minutes?|hours?|mins?|hrs?|s|m|h)/)
  if (!m) return null
  const n = +m[1], u = m[2][0]
  return n * ({ s: 1, m: 60, h: 3600 } as Record<string, number>)[u]
}

const parseTier = (line: string): TierSpec | null => {
  const m = line.match(/^[-*]\s+(\w+)(?:\s*\((\d+)\s*\$(\w+)\))?\s*:\s*(.+)/)
  if (!m) return null
  const [, name, threshold, token, rest] = m
  const qm = rest.match(/^(\d+)\/(hour|day|minute)\s*,?\s*(.*)/)
  if (qm) return { name, quota: +qm[1], period: qm[2], description: qm[3], threshold: +(threshold || 0), token: token ? `$${token}` : '' }
  return { name, period: 'hour', description: rest.replace(/^unlimited\s*,?\s*/, ''), threshold: +(threshold || 0), token: token ? `$${token}` : '' }
}

export const parse = (md: string): AgentSpec => {
  const lines = md.split('\n')
  const spec: AgentSpec = { id: '', personality: '', steps: [], skills: [], memory: {}, perUser: false, tiers: [], secrets: [], tools: [] }
  let section = 'top'
  let pending: SkillSpec | null = null
  const intervalLines: string[] = []

  const flush = () => {
    if (!pending) return
    if (section === 'steps') spec.steps.push(pending)
    else if (section === 'skills') spec.skills.push(pending)
    pending = null
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (line.startsWith('# ') && !line.startsWith('## ')) {
      spec.id = line.slice(2).trim().toLowerCase().replace(/\s+/g, '-')
      continue
    }

    if (line.startsWith('## ')) {
      flush()
      const header = line.slice(3).trim()
      const hl = header.toLowerCase()
      if (hl === 'steps') section = 'steps'
      else if (hl === 'skills') section = 'skills'
      else if (hl.startsWith('remember')) { section = 'remember'; spec.perUser = hl.includes('per-user') || hl.includes('per user') }
      else if (hl === 'tools') section = 'tools'
      else if (hl === 'tiers') section = 'tiers'
      else if (hl === 'secrets') section = 'secrets'
      else if (hl === 'price') section = 'price'
      else if (hl.startsWith('every')) {
        section = 'every'
        const secs = parseInterval(header)
        if (secs) { spec.interval = { seconds: secs, prompt: '' }; intervalLines.length = 0 }
      }
      else section = 'other'
      continue
    }

    if (section === 'top' && line && spec.id) {
      spec.personality += (spec.personality ? ' ' : '') + line
      continue
    }

    if (line.startsWith('→') || line.startsWith('->')) {
      const targets = line.replace(/^(→|->)\s*/, '').split(',').map(t => t.trim()).filter(Boolean)
      if (pending) pending.targets = targets
      continue
    }

    if (section === 'steps') {
      const m = line.match(/^\d+\.\s+\*{0,2}(\w[\w-]*)\*{0,2}\s*[—–-]\s*(.+)/)
      if (m) { flush(); pending = { name: m[1], prompt: m[2] }; continue }
    }

    if (section === 'skills') {
      const m = line.match(/^[-*]\s+\*{0,2}(\w[\w-]*)\*{0,2}\s*[—–-]\s*(.+)/)
      if (m) { flush(); pending = { name: m[1], prompt: m[2] }; continue }
    }

    if (section === 'every' && line) { intervalLines.push(line); continue }

    if (section === 'remember') {
      const m = line.match(/^[-*]\s+(\w[\w-]*):\s*(.+)/)
      if (m) {
        const v = m[2].trim()
        spec.memory[m[1]] = v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v
        continue
      }
    }

    if (section === 'tiers') { const t = parseTier(line); if (t) spec.tiers.push(t); continue }
    if (section === 'secrets') { const m = line.match(/^[-*]\s+(\w+)/); if (m) spec.secrets.push(m[1]); continue }
    if (section === 'tools') { const m = line.match(/^[-*]\s+(\w[\w-]*)/); if (m) spec.tools.push(m[1]); continue }
    if (section === 'price') { const m = line.match(/^([\d.]+)\s*(\w+)?/); if (m) spec.price = { amount: +m[1], currency: m[2] || 'USDC' }; continue }
  }

  flush()
  if (spec.interval && intervalLines.length) spec.interval.prompt = intervalLines.join(' ')
  return spec
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD — wire spec into substrate agent
// ═══════════════════════════════════════════════════════════════════════════

export const md = (source: string, net: World, complete: Complete, tools?: Record<string, (...args: unknown[]) => unknown>): Agent => {
  const spec = parse(source)
  const a = agent(spec.id, net)

  // Memory
  if (Object.keys(spec.memory).length) a.memory(spec.memory)

  // Tools
  if (tools) a.tools(tools)

  // Steps: ordered chain
  for (let i = 0; i < spec.steps.length; i++) {
    const step = spec.steps[i]
    a.skill(step.name, async (data, ctx) => {
      const input = typeof data === 'string' ? data : JSON.stringify(data)
      const mem = Object.fromEntries(ctx.memory.entries())
      const memCtx = Object.keys(mem).length ? `\n\nYour memory:\n${JSON.stringify(mem)}` : ''
      const result = await complete(`${step.prompt}\n\nInput:\n${input}${memCtx}`, { system: spec.personality })
      step.targets?.forEach(t => ctx.emit({ receiver: t, data: { result } }))
      return { result }
    })
    if (i < spec.steps.length - 1) a.pipe(step.name, spec.steps[i + 1].name)
    if (i === spec.steps.length - 1 && step.targets?.length) {
      step.targets.forEach(t => a.pipe(step.name, t))
    }
  }

  // Skills: unordered
  for (const skill of spec.skills) {
    a.skill(skill.name, async (data, ctx) => {
      const input = typeof data === 'string' ? data : JSON.stringify(data)
      const mem = Object.fromEntries(ctx.memory.entries())
      const memCtx = Object.keys(mem).length ? `\n\nYour memory:\n${JSON.stringify(mem)}` : ''
      const result = await complete(`${skill.prompt}\n\nInput:\n${input}${memCtx}`, { system: spec.personality })
      skill.targets?.forEach(t => ctx.emit({ receiver: t, data: { result } }))
      return { result }
    })
  }

  // Price — register each skill/step as a priced capability
  if (spec.price) {
    const name = spec.steps[0]?.name || spec.skills[0]?.name || spec.id
    a.price(name, spec.price.amount, spec.price.currency)
  }

  // Evolve
  if (spec.personality) a.evolve({ system: spec.personality })

  return a
}
