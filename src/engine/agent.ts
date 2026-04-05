/**
 * AGENT — Build powerful agents in five lines
 *
 * Thin builder over unit. skill() + pipe() + memory() + tools() + evolve().
 * The substrate does the rest.
 */

import type { World, Unit, Signal, Emit } from './world'
import { writeSilent } from '@/lib/typedb'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type SkillFn = (data: unknown, ctx: AgentCtx) => unknown
type Tool = (...args: unknown[]) => unknown

export type AgentCtx = {
  from: string
  self: string
  memory: Map<string, unknown>
  tools: Record<string, Tool>
  emit: Emit
}

export interface Agent {
  skill: (name: string, fn: SkillFn) => Agent
  pipe: (from: string, to: string) => Agent
  memory: (initial?: Record<string, unknown>) => Agent
  tools: (t: Record<string, Tool>) => Agent
  price: (skill: string, amount: number, currency?: string) => Agent
  evolve: (opts?: { system?: string }) => Agent
  unit: Unit
  id: string
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILDER
// ═══════════════════════════════════════════════════════════════════════════

export const agent = (id: string, net: World): Agent => {
  const u = net.add(id)
  const mem = new Map<string, unknown>()
  const reg: Record<string, Tool> = {}

  const a: Agent = {
    skill: (name, fn) => {
      u.on(name, async (data, emit, ctx) => {
        const actx: AgentCtx = { ...ctx, memory: mem, tools: reg, emit }
        const result = await fn(data, actx)
        // Auto-reply if result returned and not already emitted
        result !== undefined && emit({ receiver: ctx.from, data: result })
        return result
      })
      return a
    },

    pipe: (from, to) => {
      const [target, task] = to.includes(':') ? to.split(':') : [id, to]
      u.then(from, result => ({ receiver: `${target}:${task}`, data: result }))
      return a
    },

    memory: (initial) => {
      initial && Object.entries(initial).forEach(([k, v]) => mem.set(k, v))
      return a
    },

    tools: (t) => {
      Object.assign(reg, t)
      return a
    },

    price: (skill, amount, currency = 'USDC') => {
      writeSilent(`
        insert $sk isa skill, has skill-id "${skill}", has tag "${id}";
      `).catch(() => {})
      writeSilent(`
        match $u isa unit, has uid "${id}"; $sk isa skill, has skill-id "${skill}";
        insert (provider: $u, offered: $sk) isa capability, has price ${amount};
      `).catch(() => {})
      return a
    },

    evolve: (opts) => {
      const system = opts?.system || `You are agent "${id}". Do your tasks well.`
      writeSilent(`
        match $u isa unit, has uid "${id}";
        delete has system-prompt of $u;
        insert $u has system-prompt "${system.replace(/"/g, '\\"')}";
      `).catch(() =>
        writeSilent(`
          insert $u isa unit, has uid "${id}", has unit-kind "agent", has status "active",
            has system-prompt "${system.replace(/"/g, '\\"')}",
            has success-rate 0.5, has activity-score 0.0, has sample-count 0,
            has reputation 0.0, has balance 0.0, has generation 0;
        `).catch(() => {})
      )
      return a
    },

    unit: u,
    id,
  }

  return a
}
