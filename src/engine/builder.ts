/**
 * BUILDER — Wave-aware actor for executing tasks through the W1→W4 chain.
 *
 * The builder is the substrate's task executor. It receives a task envelope
 * on its :recon channel, runs it through four waves (haiku→opus→sonnet→sonnet),
 * and calls onDone when W4 passes.
 *
 * Loop.ts routes tasks here via: net.ask({ receiver: 'builder:recon', data: envelope })
 * Each wave transition is a substrate signal — pheromone accumulates automatically.
 *
 * Usage:
 *   const u = registerBuilder(net, complete, (env) => markTaskDone(env.taskId))
 *   // Now loop.ts can route: { receiver: 'builder:recon', data: taskEnvelope }
 */

import type { PersistentWorld } from './persist'
import type { WaveEnvelope } from './wave-runner'
import { waveRunner } from './wave-runner'

export type BuilderComplete = (prompt: string, model: string) => Promise<string | null>
export type BuilderOnDone = (envelope: WaveEnvelope) => void

/**
 * Register the builder actor in the substrate.
 * Wires recon→decide→edit→verify as a .on()/.then() chain.
 *
 * @param net      — the substrate world (must be live)
 * @param complete — LLM caller: (prompt, model) => response
 * @param onDone   — fires when W4 verify passes (task completed)
 */
export const registerBuilder = (net: PersistentWorld, complete: BuilderComplete, onDone?: BuilderOnDone) => {
  const u = net.add('builder')
  return waveRunner(u, complete, onDone, net)
}
