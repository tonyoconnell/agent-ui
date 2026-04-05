/**
 * ASI — Routing intelligence
 *
 * Not a colony. A function that operates on one.
 * Three-tier: substrate -> TypeDB -> LLM
 * Exploration scales inversely with confidence.
 */

import { unit, type Colony } from './substrate'
import { readParsed } from '@/lib/typedb'

type Complete = (prompt: string, ctx?: Record<string, unknown>) => Promise<string>

export type ASI = {
  orchestrate: (task: string, data: unknown, from?: string) => Promise<{ agent: string; result: unknown }>
  confidence: (taskType: string) => number
}

export const asi = (net: Colony, complete: Complete): ASI => {
  const confidence = (taskType: string): number => {
    const trails = net.highways(50).filter(h => h.path.includes(`→${taskType}→`))
    return trails.length ? Math.min(1, trails[0].strength / 50) : 0
  }

  const orchestrate = async (task: string, data: unknown, from = 'user') => {
    const taskType = task.split(' ')[0].toLowerCase()

    // Three-tier: exploration scales with uncertainty
    const agent = net.select(taskType, 1 - confidence(taskType))
      || await readParsed(`
          match (source: $from, target: $to) isa path, has strength $s;
                $from isa unit, has uid "${from}";
                (provider: $to, skill: $task) isa capability;
                $task isa task, has tid "${taskType}";
                $to has uid $id;
          sort $s desc; limit 1; select $id;
        `).then(r => (r[0]?.id as string) || null).catch(() => null)
      || (await complete(`Route "${task}" to: ${net.list().join(', ')}. Name only.`)).trim()

    net.mark(`${from}→${taskType}→${agent}`, 0.5)

    // Load evolved prompt from TypeDB (closes L5)
    const system = await readParsed(
      `match $u isa unit, has uid "${agent}", has system-prompt $sp; select $sp;`
    ).then(r => (r[0]?.sp as string) || undefined).catch(() => undefined)

    return new Promise<{ agent: string; result: unknown }>((resolve) => {
      const rid = `r:${Date.now()}`
      net.units[rid] = unit(rid).on('default', (result) => {
        net.mark(`${from}→${taskType}→${agent}`, 1)
        delete net.units[rid]
        resolve({ agent, result })
      })
      net.signal({ receiver: agent, data: { ...(data as object), replyTo: rid, system } }, from)
      setTimeout(() => {
        net.warn(`${from}→${taskType}→${agent}`, 1)
        delete net.units[rid]
        resolve({ agent, result: undefined })
      }, 30000)
    })
  }

  return { orchestrate, confidence }
}
