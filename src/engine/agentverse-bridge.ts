/**
 * AgentVerse Bridge — 2M agents in the substrate world.
 *
 * The problem: agentverse.ts creates its own world() instance.
 * You can't signal AV agents from the main substrate. Pheromone stays separate.
 *
 * The fix: proxy units in the main world that forward to AgentVerse.
 * Pheromone in the MAIN world tracks which AV agents are reliable.
 * Slow AV agents accumulate resistance. Good ones become highways.
 * The substrate doesn't know or care that they're in a different system.
 *
 * Usage:
 *   const av = await bridgeAgentverse(net, myFetch, AV_API_KEY)
 *   // All discovered AV agents now routable as 'av:address'
 *   net.signal({ receiver: 'av:discover', data: { domain: 'translate', task: { text: 'Hello', to: 'fr' } } }, 'writer')
 *   // Or route directly by address:
 *   net.signal({ receiver: 'av:agent1abc:translate', data: { text: 'Hello' } }, 'writer')
 */

import type { World } from './world'
import { agentverse, sync, type Agentverse } from './agentverse'

type FetchFn = (address: string, data: unknown) => Promise<unknown>

export const bridgeAgentverse = async (
  net: World,
  fetchFn: FetchFn,
  apiKey: string
): Promise<Agentverse> => {
  const av = agentverse(fetchFn)
  await sync(av, apiKey)

  // Proxy unit per discovered AV agent
  for (const id of av.list()) {
    net.add(`av:${id}`)
      .on('default', async (data) => {
        const result = await av.call(id, 'default', data)
        return result ?? null  // null → warn() in main world
      })
  }

  // Discovery proxy: finds best AV agent by domain, routes to it
  net.add('av')
    .on('discover', async (data) => {
      const { domain, task } = data as { domain: string; task: unknown }
      const agents = av.discover(domain, 5)
      if (!agents.length) return null
      // First call: use AV's own pheromone ranking
      // Subsequent calls: STAN in main world re-ranks by real outcomes
      return await av.call(agents[0].address, domain, task)
    })

  return av
}
