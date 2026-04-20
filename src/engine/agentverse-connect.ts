/**
 * AGENTVERSE-CONNECT — Fast-think bridge between ONE and Agentverse.
 *
 * A signal is a signal. Whether it lands on a local unit or an AV agent
 * 30ms away, the substrate doesn't care. `av:<address>` is just a namespace.
 *
 *   ONE  ─send(addr, data)─►  [av:addr]  ─POST /submit─►  Agentverse
 *   ONE  ◄────signal(to,data,from)────  [webhook]  ◄──POST /api/av/in──  AV
 *
 * Outbound is immediate. Inbound is webhook-driven. Pheromone accumulates
 * in YOUR world — slow/failing AV agents naturally get routed around.
 *
 * No Python bridge. No polling. One HTTP hop. The substrate IS the integration.
 */

import type { Agentverse as AvWorld } from './agentverse'
import { bridgeAgentverse } from './agentverse-bridge'
import type { Edge, World } from './world'

type AgentMeta = ReturnType<AvWorld['discover']>[number]

const DEFAULT_URL = 'https://agentverse.ai/v1'

export type AgentverseConfig = {
  apiKey?: string
  apiUrl?: string
}

export type Agentverse = {
  /** Outbound: emit a signal to an AV agent. `to` is `<address>` or `<address>:<task>`. */
  send: (to: string, data: unknown, from?: string) => void
  /** Inbound: an AV agent sent us a signal. Call this from your webhook. */
  receive: (from: string, to: string, data: unknown) => void
  /** Find agents by domain, ranked by pheromone. */
  discover: (domain: string, limit?: number) => AgentMeta[]
  /** Top proven paths that cross the AV boundary (either direction). */
  highways: (limit?: number) => Edge[]
  /** All bridged AV addresses. */
  list: () => string[]
  /** Raw handle to the underlying bridge (escape hatch). */
  raw: AvWorld
}

export const connectAgentverse = async (w: World, config: AgentverseConfig = {}): Promise<Agentverse | null> => {
  const key = config.apiKey ?? import.meta.env.AGENTVERSE_API_KEY
  if (!key) return null

  const baseUrl = config.apiUrl ?? import.meta.env.AGENTVERSE_API_URL ?? DEFAULT_URL

  // One HTTP hop. Network error → null → substrate treats as `dissolved` (warn 0.5).
  const post = async (address: string, data: unknown): Promise<unknown> => {
    try {
      const res = await fetch(`${baseUrl}/agents/${address}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ payload: data }),
      })
      return res.ok ? await res.json() : null
    } catch {
      return null
    }
  }

  const av = await bridgeAgentverse(w, post, key)
  console.log(`[agentverse] bridged ${av.list().length} agents as av:*`)

  return {
    send: (to, data, from) => w.signal({ receiver: `av:${to}`, data }, from),
    receive: (from, to, data) => w.signal({ receiver: to, data }, `av:${from}`),
    discover: (domain, limit = 10) => av.discover(domain, limit),
    highways: (limit = 20) => w.highways(limit).filter((h) => h.path.includes('av:')),
    list: () => av.list(),
    raw: av,
  }
}
