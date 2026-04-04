/**
 * AGENTVERSE — 2M agents as a colony
 *
 * 70 lines. Registry + routing + discovery.
 */

import { colony, unit, type Colony, type Unit, type Signal } from './substrate'

type AgentMeta = {
  address: string
  name: string
  domains: string[]
  endpoint?: string
}

type Fetch = (address: string, data: unknown) => Promise<unknown>

export interface Agentverse extends Colony {
  register: (meta: AgentMeta) => Unit
  discover: (domain: string, limit?: number) => AgentMeta[]
  call: (address: string, task: string, data: unknown) => Promise<unknown>
}

export const agentverse = (fetch: Fetch): Agentverse => {
  const net = colony()
  const meta: Record<string, AgentMeta> = {}

  // Register agent in colony
  const register = (m: AgentMeta): Unit => {
    meta[m.address] = m
    const u = net.spawn(m.address)

    // Default handler: forward to real agent endpoint
    u.on('default', async (data, emit, ctx) => {
      const result = await fetch(m.address, data)
      emit({ receiver: ctx.from, data: result })
    })

    // Index by domains
    m.domains.forEach(d => net.mark(`domain:${d}→${m.address}`, 0.1))

    return u
  }

  // Discover by domain using pheromone trails
  const discover = (domain: string, limit = 10): AgentMeta[] => {
    return net.highways(100)
      .filter(h => h.path.startsWith(`domain:${domain}→`))
      .slice(0, limit)
      .map(h => meta[h.path.split('→')[1]])
      .filter(Boolean)
  }

  // Call agent and record outcome
  const call = async (address: string, task: string, data: unknown): Promise<unknown> => {
    const edge = `call:${task}→${address}`

    try {
      const result = await fetch(address, data)
      net.mark(edge, 1)  // Success strengthens trail
      return result
    } catch {
      net.warn(edge, 1)  // Failure marks alarm — signal dissolves, swarm continues
    }
  }

  return {
    ...net,
    register,
    discover,
    call,
  }
}

// Sync from real Agentverse API
export const sync = async (av: Agentverse, apiKey: string) => {
  const res = await fetch('https://agentverse.ai/v1/agents', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const agents = await res.json() as AgentMeta[]
  agents.forEach(a => av.register(a))
}
