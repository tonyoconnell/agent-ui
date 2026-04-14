/**
 * WAVE RUNNER — W1→W2→W3→W4 as a .on()/.then() chain
 *
 * Maps the four waves to substrate tasks:
 *   W1 recon  (haiku)  — read task + context, surface relevant patterns
 *   W2 decide (opus)   — choose implementation strategy
 *   W3 edit   (sonnet) — implement the changes
 *   W4 verify (sonnet) — run verification, mark done, emit pheromone
 *
 * Each .then() carries the accumulated envelope forward.
 * The complete() callback fires on W4 success with the full trace.
 *
 * Usage:
 *   const runner = waveRunner(net.add('wave-runner'), complete, emit)
 *   net.signal({ receiver: 'wave-runner:recon', data: taskEnvelope })
 */

import { WAVE_MODEL } from './task-parse'
import type { Unit } from './world'

// ── Types ──────────────────────────────────────────────────────────────────

export interface TaskEnvelope {
  taskId: string
  taskName: string
  exit?: string
  context?: string // merged doc content
  contextDocs?: string[] // doc keys
  tags?: string[]
  learned?: { pattern: string; confidence: number }[]
  effort?: string
  phase?: string
  priority?: number
}

export interface WaveEnvelope extends TaskEnvelope {
  recon?: string // W1 output: patterns spotted
  specs?: string[] // W2 output: implementation plan
  edits?: string // W3 output: what was changed
  verify?: {
    // W4 output: verification result
    ok: boolean
    score?: number
    message?: string
  }
}

type Completer = (prompt: string, model: string) => Promise<string | null>
type OnComplete = (envelope: WaveEnvelope) => void

// ── Wave Runner Factory ───────────────────────────────────────────────────

/**
 * Wire a unit as a 4-wave runner.
 *
 * @param u         — unit to wire (call net.add(id) first)
 * @param complete  — LLM caller: (prompt, model) => response
 * @param onDone    — fires when W4 verify succeeds with full envelope
 */
export function waveRunner(u: Unit, complete: Completer, onDone?: OnComplete): Unit {
  // W1 RECON — haiku reads task + context, surfaces patterns
  u.on('recon', async (data) => {
    const env = data as TaskEnvelope
    const model = WAVE_MODEL.W1

    const prompt = [
      `TASK: ${env.taskName}`,
      env.exit ? `EXIT: ${env.exit}` : '',
      env.context ? `CONTEXT (excerpt):\n${env.context.slice(0, 2000)}` : '',
      '',
      'W1 RECON: List what files/functions you expect to read or change. No edits yet.',
    ]
      .filter(Boolean)
      .join('\n')

    const recon = await complete(prompt, model)
    if (!recon) return null

    return { ...env, recon } as WaveEnvelope
  })

  // W1→W2 continuation
  u.then('recon', (result) => ({
    receiver: `${u.id}:decide`,
    data: result as WaveEnvelope,
  }))

  // W2 DECIDE — opus decides implementation plan
  u.on('decide', async (data) => {
    const env = data as WaveEnvelope
    const model = WAVE_MODEL.W2

    const prompt = [
      `TASK: ${env.taskName}`,
      env.exit ? `EXIT: ${env.exit}` : '',
      env.recon ? `RECON:\n${env.recon}` : '',
      env.context ? `CONTEXT (excerpt):\n${env.context.slice(0, 2000)}` : '',
      '',
      'W2 DECIDE: Write a numbered implementation plan. Be specific about file paths and function names.',
    ]
      .filter(Boolean)
      .join('\n')

    const decision = await complete(prompt, model)
    if (!decision) return null

    const specs = decision
      .split('\n')
      .filter((l) => /^\d+\./.test(l.trim()))
      .map((l) => l.trim())

    return { ...env, specs: specs.length ? specs : [decision] } as WaveEnvelope
  })

  // W2→W3 continuation
  u.then('decide', (result) => ({
    receiver: `${u.id}:edit`,
    data: result as WaveEnvelope,
  }))

  // W3 EDIT — sonnet implements
  u.on('edit', async (data) => {
    const env = data as WaveEnvelope
    const model = WAVE_MODEL.W3

    const prompt = [
      `TASK: ${env.taskName}`,
      env.exit ? `EXIT: ${env.exit}` : '',
      env.specs?.length ? `PLAN:\n${env.specs.join('\n')}` : '',
      '',
      'W3 EDIT: Implement the plan. Describe every change made (file path + what changed).',
    ]
      .filter(Boolean)
      .join('\n')

    const edits = await complete(prompt, model)
    if (!edits) return null

    return { ...env, edits } as WaveEnvelope
  })

  // W3→W4 continuation
  u.then('edit', (result) => ({
    receiver: `${u.id}:verify`,
    data: result as WaveEnvelope,
  }))

  // W4 VERIFY — sonnet verifies, emits pheromone
  u.on('verify', async (data) => {
    const env = data as WaveEnvelope
    const model = WAVE_MODEL.W4

    const prompt = [
      `TASK: ${env.taskName}`,
      env.exit ? `EXIT CONDITION: ${env.exit}` : '',
      env.edits ? `CHANGES MADE:\n${env.edits}` : '',
      '',
      'W4 VERIFY: Does the exit condition pass? Answer with PASS or FAIL, then explain.',
    ]
      .filter(Boolean)
      .join('\n')

    const verdict = await complete(prompt, model)
    if (!verdict) return null

    const ok = verdict.trim().toUpperCase().startsWith('PASS')
    const result: WaveEnvelope = {
      ...env,
      verify: { ok, message: verdict.slice(0, 200) },
    }

    if (ok) onDone?.(result)
    return result
  })

  return u
}

// ── Wave routing helper ────────────────────────────────────────────────────

/** Which model handles this wave? */
export const modelForWave = (wave: keyof typeof WAVE_MODEL): string => WAVE_MODEL[wave]
