/**
 * WAVE RUNNER — W1→W2→W3→W4 as a .on()/.then() chain
 *
 * Maps the four waves to substrate tasks:
 *   W1 recon  (haiku)  — sense() the task: reads files, returns reports
 *   W2 decide (opus)   — select() on reports + DSL: produces diff specs
 *   W3 edit   (sonnet) — act() on diff specs: applies edits, returns results
 *   W4 verify (sonnet) — mark() on edits: rubric score, returns verified
 *
 * Each .then() carries the accumulated envelope forward.
 * W4 has access to W1, W2, and W3 outputs — the full trace.
 *
 * Two calling conventions:
 *
 *   // Form 1 — world creates and wires (new, preferred):
 *   const runner = waveRunner(net)
 *   net.signal({ receiver: 'wave-runner:recon', data: taskEnvelope })
 *
 *   // Form 2 — wire an existing unit (used by builder.ts):
 *   const runner = waveRunner(net.add('wave-runner'), complete, onDone)
 *   net.signal({ receiver: 'wave-runner:recon', data: taskEnvelope })
 */

import type { PersistentWorld } from './persist'
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
  _replyTo?: string // internal: ask() reply address, carried from W1 → W4
}

type Completer = (prompt: string, model: string) => Promise<string | null>
type OnComplete = (envelope: WaveEnvelope) => void

// ── Stub operations — overridden by callers or grow into real implementations ─

/** W1: sense the task — read files, surface patterns */
async function sense(env: TaskEnvelope): Promise<string> {
  return [
    `recon: ${env.taskName}`,
    env.exit ? `exit: ${env.exit}` : '',
    env.contextDocs?.length ? `docs: ${env.contextDocs.join(', ')}` : '',
    env.tags?.length ? `tags: ${env.tags.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

/** W2: select strategy — choose implementation from reports + DSL */
async function select(env: WaveEnvelope): Promise<string[]> {
  return [
    `1. Read context from: ${env.contextDocs?.join(', ') || 'none'}`,
    `2. Implement: ${env.taskName}`,
    env.exit ? `3. Exit condition: ${env.exit}` : '3. Verify output is non-empty',
  ]
}

/** W3: act — apply edits, return description of changes */
async function act(env: WaveEnvelope): Promise<string> {
  return [
    `edited: ${env.taskName}`,
    env.specs?.length ? `plan applied:\n${env.specs.join('\n')}` : '',
    `recon carried:\n${env.recon || ''}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/** W4: mark — rubric score, verify exit condition */
async function mark(env: WaveEnvelope): Promise<{ ok: boolean; score: number; message: string }> {
  const hasEdits = Boolean(env.edits)
  const hasSpecs = Boolean(env.specs?.length)
  const hasRecon = Boolean(env.recon)
  // score = fraction of waves that produced output
  const score = [hasRecon, hasSpecs, hasEdits].filter(Boolean).length / 3
  return {
    ok: score >= 0.65,
    score,
    message: `fit:${hasEdits ? 1 : 0} form:${hasSpecs ? 1 : 0} truth:${hasRecon ? 1 : 0}`,
  }
}

// ── Form 1: waveRunner(net) ────────────────────────────────────────────────

/**
 * Wire a new 'wave-runner' unit into the world.
 * Handlers call sense/select/act/mark stubs — replace stubs with real LLM
 * calls to graduate from wiring to production.
 *
 * Entry:  net.signal({ receiver: 'wave-runner:recon', data: taskEnvelope })
 * Exit:   'wave-runner:verify' emits final WaveEnvelope back to _replyTo
 */
export function waveRunner(net: PersistentWorld): Unit

/**
 * Wire an existing unit as a 4-wave runner with a live LLM caller.
 * Used by builder.ts: waveRunner(net.add('builder'), complete, onDone)
 */
export function waveRunner(u: Unit, complete: Completer, onDone?: OnComplete): Unit

export function waveRunner(netOrUnit: PersistentWorld | Unit, complete?: Completer, onDone?: OnComplete): Unit {
  // Dispatch: PersistentWorld has .actor(); Unit has .on()
  if ('actor' in netOrUnit) {
    return _wireUnit(netOrUnit.add('wave-runner'))
  }
  return _wireUnitWithLLM(netOrUnit, complete!, onDone)
}

// ── Internal: stub-based wiring (Form 1) ──────────────────────────────────

function _wireUnit(u: Unit): Unit {
  // ENTRY POINT — strips replyTo before entering the wave chain.
  // ask() injects replyTo; this dispatch captures it as _replyTo so
  // world.ts doesn't auto-reply after W1.
  u.on('task', async (data, emit) => {
    const d = data as TaskEnvelope & { replyTo?: string }
    const replyTo = d.replyTo
    delete d.replyTo
    emit({ receiver: `${u.id}:recon`, data: { ...d, ...(replyTo && { _replyTo: replyTo }) } })
    return null
  })

  // W1 RECON — sense(): read files, surface patterns
  u.on('recon', async (data) => {
    const env = data as TaskEnvelope
    const fromRecon = { recon: await sense(env) }
    if (!fromRecon.recon) return null
    return { ...env, ...fromRecon } as WaveEnvelope
  })

  // W1→W2: carry full envelope (W1 output included)
  u.then('recon', (r) => ({
    receiver: `${u.id}:decide`,
    data: r as WaveEnvelope,
  }))

  // W2 DECIDE — select(): choose implementation from reports + DSL
  u.on('decide', async (data) => {
    const env = data as WaveEnvelope
    const fromDecide = { specs: await select(env) }
    if (!fromDecide.specs?.length) return null
    return { ...env, ...fromDecide } as WaveEnvelope
  })

  // W2→W3: carry full envelope (W1 + W2 output included)
  u.then('decide', (r) => ({
    receiver: `${u.id}:edit`,
    data: r as WaveEnvelope,
  }))

  // W3 EDIT — act(): apply edits, return change description
  u.on('edit', async (data) => {
    const env = data as WaveEnvelope
    const fromEdit = { edits: await act(env) }
    if (!fromEdit.edits) return null
    return { ...env, ...fromEdit } as WaveEnvelope
  })

  // W3→W4: carry full envelope (W1 + W2 + W3 output included)
  u.then('edit', (r) => ({
    receiver: `${u.id}:verify`,
    data: r as WaveEnvelope,
  }))

  // W4 VERIFY — mark(): rubric score, verify exit condition
  // W4 sees: env.recon (W1), env.specs (W2), env.edits (W3) — full trace
  u.on('verify', async (data, emit) => {
    const env = data as WaveEnvelope
    const fromVerify = await mark(env)
    const result: WaveEnvelope = { ...env, verify: fromVerify }
    // Close ask(): forward final result back to original caller
    if (env._replyTo) emit({ receiver: env._replyTo, data: result })
    return result
  })

  return u
}

// ── Internal: LLM-based wiring (Form 2, used by builder.ts) ───────────────

function _wireUnitWithLLM(u: Unit, complete: Completer, onDone?: OnComplete): Unit {
  // ENTRY POINT — strips replyTo before entering the wave chain
  u.on('task', async (data, emit) => {
    const d = data as TaskEnvelope & { replyTo?: string }
    const replyTo = d.replyTo
    delete d.replyTo
    emit({ receiver: `${u.id}:recon`, data: { ...d, ...(replyTo && { _replyTo: replyTo }) } })
    return null
  })

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
  u.on('verify', async (data, emit) => {
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

    // Close ask(): forward final result back to the original caller
    if (env._replyTo) emit({ receiver: env._replyTo, data: result })

    return result
  })

  return u
}

// ── Wave routing helper ────────────────────────────────────────────────────

/** Which model handles this wave? */
export const modelForWave = (wave: keyof typeof WAVE_MODEL): string => WAVE_MODEL[wave]
