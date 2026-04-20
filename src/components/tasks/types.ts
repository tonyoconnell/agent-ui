/**
 * Shared types for the tasks surface.
 *
 * Task represents the substrate's view of work. Lifecycle is the commerce overlay
 * (sell → buy). ChainState is the on-chain receipt. All three compose on one
 * card: you see the work, where it sits in the sell→buy arc, and whether it's
 * been settled on testnet/mainnet.
 */

import type { Task as CanonicalTask, TaskStatus } from '@/types/task'

export type { TaskStatus }
export type Persona = 'human' | 'agent'
export type Network = 'testnet' | 'mainnet' | 'devnet' | 'offchain'

export interface ChainState {
  network: Network
  txDigest?: string
  objectId?: string
  settledAt?: number
  amountMist?: number
}

/**
 * UI-specific Task — canonical + commerce overlay.
 * Extensions here must NOT duplicate fields already on canonical Task.
 */
export type Task = CanonicalTask & {
  listed?: boolean
  price?: number
  chain?: ChainState
  assignee?: string
}

export interface ColumnDef {
  id: ColumnKey
  label: string
  hint: string
  color: string
}

export type ColumnKey = 'todo' | 'doing' | 'done' | 'listed'

export const COLUMNS: ColumnDef[] = [
  { id: 'todo', label: 'To do', hint: 'Ready to start — drop here or auto-assign', color: '#94a3b8' },
  { id: 'doing', label: 'Doing', hint: 'Active work — one task at a time', color: '#fbbf24' },
  { id: 'done', label: 'Done', hint: 'Verified — ready to list for sale', color: '#4ade80' },
  { id: 'listed', label: 'Listed', hint: 'Sellable skill — on-chain when bought', color: '#c084fc' },
]

import type { TaskWave } from '@/types/task'

export type WaveKey = TaskWave | 'unwaved'

export type WaveDef = {
  key: WaveKey
  label: string
  hint: string
  color: string
}

export const WAVES: readonly WaveDef[] = [
  { key: 'W1', label: 'W1 · Recon', hint: 'Haiku reads, reports verbatim', color: '#67e8f9' },
  { key: 'W2', label: 'W2 · Decide', hint: 'Opus produces diff specs', color: '#c084fc' },
  { key: 'W3', label: 'W3 · Edit', hint: 'Sonnet applies changes', color: '#fbbf24' },
  { key: 'W4', label: 'W4 · Verify', hint: 'Rubric + tests + cycle gate', color: '#6ee7b7' },
  { key: 'unwaved', label: 'Backlog', hint: 'No wave assigned', color: '#64748b' },
] as const

/** Bucket a task to a wave key (falls back to 'unwaved' when task_wave is null). */
export function waveForTask(t: { task_wave: TaskWave | null }): WaveKey {
  return t.task_wave ?? 'unwaved'
}

export const columnFor = (status: TaskStatus, listed: boolean | undefined): ColumnKey => {
  if (listed) return 'listed'
  if (status === 'verified' || status === 'done') return 'done'
  if (status === 'picked') return 'doing'
  return 'todo'
}

export const statusForColumn = (key: ColumnKey): TaskStatus => {
  switch (key) {
    case 'doing':
      return 'picked'
    case 'done':
    case 'listed':
      return 'verified'
    default:
      return 'open'
  }
}

// ─── Lifecycle stages (from one/lifecycle-one.md) ────────────────────────

export interface LifecycleStage {
  index: number
  key: string
  label: string
  lane: 'onboard' | 'engage' | 'commerce'
}

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  { index: 0, key: 'wallet', label: 'Wallet', lane: 'onboard' },
  { index: 1, key: 'key', label: 'Key', lane: 'onboard' },
  { index: 2, key: 'signin', label: 'Sign in', lane: 'onboard' },
  { index: 3, key: 'board', label: 'Board', lane: 'onboard' },
  { index: 4, key: 'team', label: 'Team', lane: 'onboard' },
  { index: 5, key: 'deploy', label: 'Deploy', lane: 'onboard' },
  { index: 6, key: 'discover', label: 'Discover', lane: 'engage' },
  { index: 7, key: 'message', label: 'Message', lane: 'engage' },
  { index: 8, key: 'converse', label: 'Converse', lane: 'engage' },
  { index: 9, key: 'sell', label: 'Sell', lane: 'commerce' },
  { index: 10, key: 'buy', label: 'Buy', lane: 'commerce' },
]
