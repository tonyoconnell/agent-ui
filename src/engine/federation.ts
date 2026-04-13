/**
 * Federation — another ONE substrate as a unit in this world.
 *
 * Signal chains cross world boundaries transparently.
 * Pheromone tracks cross-world reliability: slow or failing worlds
 * accumulate resistance and get routed around, identically to any unit.
 *
 * Usage:
 *   net.units['world-legal']   = federate('world-legal',   'https://legal.one.ie',   LEGAL_KEY)
 *   net.units['world-finance'] = federate('world-finance', 'https://finance.one.ie', FINANCE_KEY)
 *   net.signal({ receiver: 'world-legal:review', data: { contract } }, 'drafter')
 *   // → forwards to https://legal.one.ie/api/signal with { receiver: 'review', data: { contract } }
 */

import { type Unit, unit } from './world'

export const federate = (id: string, baseUrl: string, apiKey: string): Unit => {
  const base = baseUrl.replace(/\/$/, '')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  return unit(id).on('default', async (data) => {
    // data may carry { receiver, ...rest } for intra-world routing
    const { receiver, ...rest } = (data as { receiver?: string } & Record<string, unknown>) ?? {}
    const res = await fetch(`${base}/api/signal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sender: id, receiver: receiver ?? 'entry', data: rest }),
    }).catch(() => null)
    return res?.ok ? await res.json() : null
  })
}

/**
 * Convenience: forward a fully-formed Signal to another world.
 * Useful when the local unit name IS the target unit in the remote world.
 *
 * net.units['world-b:scout'] = federateSignal('world-b:scout', 'https://world-b.one.ie', KEY)
 * net.signal({ receiver: 'world-b:scout', data: {} }, 'entry')
 */
export const federateSignal = (receiver: string, baseUrl: string, apiKey: string): Unit => {
  const base = baseUrl.replace(/\/$/, '')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  return unit(receiver).on('default', async (data) => {
    const res = await fetch(`${base}/api/signal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ receiver, data }),
    }).catch(() => null)
    return res?.ok ? await res.json() : null
  })
}
