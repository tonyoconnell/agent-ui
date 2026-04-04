/**
 * ASI — Orchestrator as a unit
 *
 * 70 lines. Routes tasks. Learns from outcomes.
 */

import { colony, unit, type Colony, type Signal } from './substrate'
import { readParsed } from '@/lib/typedb'

type Complete = (prompt: string) => Promise<string>

export interface ASI extends Colony {
  orchestrate: (task: string, data: unknown, from?: string) => Promise<{ agent: string; result: unknown }>
  confidence: (taskType: string) => number
}

export const asi = (complete: Complete): ASI => {
  const net = colony()
  const router = net.spawn('asi:router')

  // Confidence based on trail strength
  const confidence = (taskType: string): number => {
    const trails = net.highways(50).filter(h => h.path.includes(`→${taskType}→`))
    if (!trails.length) return 0
    return Math.min(1, trails[0].strength / 50)
  }

  // Core orchestration
  const orchestrate = async (task: string, data: unknown, from = 'user') => {
    const taskType = task.split(' ')[0].toLowerCase()

    // Fast path: follow the highway if confidence is high
    const best = net.follow(taskType)

    let agent: string

    if (best && confidence(taskType) > 0.7) {
      // Substrate knows — skip LLM
      agent = best
    } else {
      // Ask TypeDB's suggest_route() — pheromone-weighted routing
      const routes = await readParsed(`
        match $from isa unit, has uid "${from}";
              $task isa task, has tid "${taskType}";
              (source: $from, target: $to) isa path, has strength $s;
              (provider: $to, skill: $task) isa capability;
              $to has uid $id; $s >= 5.0;
        sort $s desc; limit 5; select $id, $s;
      `).catch(() => [])

      if (routes.length) {
        // TypeDB decides — strongest pheromone wins
        agent = routes[0].id as string
      } else {
        // No substrate data — fall back to LLM
        const prompt = `Task: ${task}\nAvailable agents: ${net.list().join(', ')}\nReturn ONLY the agent address to route to.`
        agent = (await complete(prompt)).trim()
      }
      net.mark(`asi→${taskType}→${agent}`, 0.5)  // Record routing decision
    }

    // Execute via colony
    return new Promise<{ agent: string; result: unknown }>((resolve) => {
      const responseHandler = unit(`response:${Date.now()}`)
        .on('default', (result) => {
          net.mark(`${from}→${taskType}→${agent}`, 1)  // Success
          resolve({ agent, result })
        })

      net.units[responseHandler.id] = responseHandler
      net.signal({ receiver: agent, data: { ...(data as object), replyTo: responseHandler.id } }, from)

      // Timeout → alarm, resolve silently (zero returns)
      setTimeout(() => {
        net.warn(`${from}→${taskType}→${agent}`, 1)
        delete net.units[responseHandler.id]
        resolve({ agent, result: undefined })
      }, 30000)
    })
  }

  return { ...net, orchestrate, confidence }
}
