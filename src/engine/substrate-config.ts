/**
 * SUBSTRATE CONFIG — Parse substrate.md into runtime config
 *
 * The substrate.md file defines:
 * - Context: docs to load into LLM calls
 * - Timers: signals emitted on schedule
 * - SOPs: prerequisites before signals
 * - Workflows: named sequences
 * - Handlers: what context each handler needs
 *
 * This parser reads that markdown and returns a config object.
 */

// readFile imported dynamically to avoid Cloudflare bundling issues

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type TimerConfig = {
  signal: string
  interval: number
  priority: string
}

export type SopConfig = {
  target: string
  prereqs: string[]
}

export type WorkflowConfig = {
  name: string
  steps: string[]
}

export type HandlerConfig = {
  handler: string
  context: string[]
  description: string
}

export type SubstrateConfig = {
  context: string[]
  timers: TimerConfig[]
  sops: SopConfig[]
  workflows: WorkflowConfig[]
  handlers: HandlerConfig[]
  metrics: { name: string; target: string; alert: string }[]
  raw: string  // original markdown
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSER
// ═══════════════════════════════════════════════════════════════════════════

const parseInterval = (s: string): number => {
  const match = s.match(/^(\d+)(ms|s|m|h|d)?$/)
  if (!match) return 60000  // default 1 minute
  const n = parseInt(match[1], 10)
  const unit = match[2] || 'ms'
  switch (unit) {
    case 'ms': return n
    case 's': return n * 1000
    case 'm': return n * 60 * 1000
    case 'h': return n * 60 * 60 * 1000
    case 'd': return n * 24 * 60 * 60 * 1000
    default: return n
  }
}

const extractSection = (md: string, heading: string): string => {
  const pattern = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i')
  const match = md.match(pattern)
  return match ? match[1].trim() : ''
}

const extractCodeBlock = (section: string): string[] => {
  const match = section.match(/```\n?([\s\S]*?)```/)
  if (!match) return []
  return match[1].trim().split('\n').filter(l => l.trim())
}

const extractTable = (section: string): Record<string, string>[] => {
  const lines = section.split('\n').filter(l => l.includes('|'))
  if (lines.length < 2) return []

  const headers = lines[0].split('|').map(h => h.trim().toLowerCase()).filter(Boolean)
  const rows: Record<string, string>[] = []

  for (let i = 2; i < lines.length; i++) {  // skip header and separator
    const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length >= headers.length) {
      const row: Record<string, string> = {}
      headers.forEach((h, j) => row[h] = cells[j])
      rows.push(row)
    }
  }

  return rows
}

const extractSops = (section: string): SopConfig[] => {
  const sops: SopConfig[] = []
  const blocks = section.split(/### Before `([^`]+)`/)

  for (let i = 1; i < blocks.length; i += 2) {
    const target = blocks[i]
    const content = blocks[i + 1] || ''
    const prereqs = content
      .split('\n')
      .filter(l => l.trim().startsWith('-'))
      .map(l => l.replace(/^-\s*/, '').trim())
      .filter(Boolean)

    if (prereqs.length) {
      sops.push({ target, prereqs })
    }
  }

  return sops
}

const extractWorkflows = (section: string): WorkflowConfig[] => {
  const workflows: WorkflowConfig[] = []
  const blocks = section.split(/### (\S+)/)

  for (let i = 1; i < blocks.length; i += 2) {
    const name = blocks[i]
    const content = blocks[i + 1] || ''
    const steps = content
      .split('\n')
      .filter(l => /^\d+\./.test(l.trim()))
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)

    if (steps.length) {
      workflows.push({ name, steps })
    }
  }

  return workflows
}

const extractHandlers = (section: string): HandlerConfig[] => {
  const rows = extractTable(section)
  return rows.map(r => ({
    handler: r.handler || '',
    context: (r.context || '').split(',').map(s => s.trim()).filter(Boolean),
    description: r.description || '',
  })).filter(h => h.handler)
}

export const parseSubstrate = async (path = 'substrate.md'): Promise<SubstrateConfig> => {
  const { readFile } = await import('node:fs/promises')
  const raw = await readFile(path, 'utf-8')

  // Context
  const contextSection = extractSection(raw, 'Context')
  const context = extractCodeBlock(contextSection)

  // Timers
  const timerSection = extractSection(raw, 'Timers')
  const timerRows = extractTable(timerSection)
  const timers: TimerConfig[] = timerRows.map(r => ({
    signal: r.signal || '',
    interval: parseInterval(r.interval || '1m'),
    priority: r.priority || 'P2',
  })).filter(t => t.signal)

  // SOPs
  const sopSection = extractSection(raw, 'SOPs')
  const sops = extractSops(sopSection)

  // Workflows
  const workflowSection = extractSection(raw, 'Workflows')
  const workflows = extractWorkflows(workflowSection)

  // Handlers
  const handlerSection = extractSection(raw, 'Handlers')
  const handlers = extractHandlers(handlerSection)

  // Metrics
  const metricsSection = extractSection(raw, 'Metrics')
  const metricsRows = extractTable(metricsSection)
  const metrics = metricsRows.map(r => ({
    name: r.metric || '',
    target: r.target || '',
    alert: r['alert if'] || '',
  })).filter(m => m.name)

  return { context, timers, sops, workflows, handlers, metrics, raw }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export const getSopPrereqs = (config: SubstrateConfig, target: string): string[] => {
  const sop = config.sops.find(s => s.target === target)
  return sop?.prereqs || []
}

export const getWorkflowSteps = (config: SubstrateConfig, name: string): string[] => {
  const wf = config.workflows.find(w => w.name === name)
  return wf?.steps || []
}

export const getHandlerContext = (config: SubstrateConfig, handler: string): string[] => {
  const h = config.handlers.find(h => h.handler === handler)
  return h?.context || []
}

// ═══════════════════════════════════════════════════════════════════════════
// ONE FILE. ONE CONFIG. ONE LOOP.
// ═══════════════════════════════════════════════════════════════════════════
