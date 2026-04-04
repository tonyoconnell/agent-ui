/**
 * ASI — Orchestrator as a unit
 *
 * 70 lines. Routes tasks. Learns from outcomes.
 */

import { colony, unit, type Colony, type Signal } from './substrate'

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
    const trails = net.highways(50).filter(h => h.edge.includes(`→${taskType}→`))
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
      // Ask LLM for routing decision
      const context = net.highways(10)
        .filter(h => h.edge.includes(`→${taskType}→`))
        .map(h => `${h.edge}: ${h.strength.toFixed(1)}`)
        .join('\n')

      const prompt = `Task: ${task}
Known agents for ${taskType}:
${context || 'None yet'}

Return ONLY the agent address to route to.`

      agent = (await complete(prompt)).trim()
      net.mark(`asi→${taskType}→${agent}`, 0.5)  // Record LLM decision
    }

    // Execute via colony
    return new Promise((resolve) => {
      const responseHandler = unit(`response:${Date.now()}`)
        .on('default', (result) => {
          net.mark(`${from}→${taskType}→${agent}`, 1)  // Success
          resolve({ agent, result })
        })

      net.units[responseHandler.id] = responseHandler
      net.signal({ receiver: agent, data: { ...(data as object), replyTo: responseHandler.id } }, from)

      // Timeout → alarm
      setTimeout(() => {
        net.mark(`${from}→${taskType}→${agent}:alarm`, 1)
        delete net.units[responseHandler.id]
      }, 30000)
    })
  }

  return { ...net, orchestrate, confidence }
}
