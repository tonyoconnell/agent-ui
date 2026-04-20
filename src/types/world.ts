/**
 * ONE Types — TypeScript definitions matching one.tql schema
 *
 * 6 Dimensions:
 *   1. Groups    — worlds (personas, teams, colonies)
 *   2. Actors    — units (humans, agents, LLMs)
 *   3. Things    — tasks with optional price (work AND services)
 *   4. Edges     — weighted connections (unit↔unit, task→task)
 *   5. Events    — signals (who sent what, paid how much)
 *   6. Knowledge — hypotheses, frontiers, objectives
 */

import type { Task } from './task'

// =============================================================================
// DIMENSION 1: GROUPS
// =============================================================================

export interface Group {
  gid: string
  name: string
  purpose?: string
  groupType: 'persona' | 'team' | 'colony' | 'dao'
  status: string
  created: Date
  parent?: string // gid of parent group
  children?: string[] // gids of child groups
}

// =============================================================================
// DIMENSION 2: ACTORS
// =============================================================================

export interface Unit {
  uid: string
  name: string
  unitKind: 'human' | 'agent' | 'llm' | 'system'
  wallet?: string // Sui address
  status: 'active' | 'proven' | 'at-risk' // INFERRED
  balance: number
  reputation: number
  // L1 Classification attributes
  successRate: number // 0.0–1.0
  activityScore: number // 0.0–100.0
  sampleCount: number // interaction count
  created: Date
  groups?: string[] // gids of groups this unit belongs to
}

// =============================================================================
// DIMENSION 3: THINGS
// =============================================================================

export type TaskType = 'work' | 'explore' | 'validate' | 'build' | 'inference' | 'analysis' | 'data' | 'compute'

export type { TaskStatus } from '@/types/task'
export type Priority = 'P0' | 'P1' | 'P2' | 'P3'
export type Phase = 'wire' | 'tasks' | 'onboard' | 'commerce' | 'intelligence' | 'scale'

export type { Task } from './task'

// =============================================================================
// DIMENSION 4: EDGES
// =============================================================================

export type EdgeStatus = 'highway' | 'fresh' | 'fading' | 'toxic'
export type TrailStatus = 'proven' | 'fresh' | 'fading' | 'dead'

// Unit-to-unit connection
export interface Edge {
  source: string // uid
  target: string // uid
  strength: number // mark() adds weight here
  resistance: number // warn() adds weight here
  traversals: number
  revenue: number // sum of x402 payments on this edge
  lastUsed: Date
  status: EdgeStatus // INFERRED
}

// Task-to-task connection
export interface Trail {
  sourceTask: string // tid
  destinationTask: string // tid
  strength: number // strength (mark() deposits)
  resistance: number // resistance (warn() deposits)
  completions: number
  failures: number
  revenue: number // x402 revenue from this task sequence
  status: TrailStatus // INFERRED
}

// Unit can do task (at a price)
export interface Capability {
  provider: string // uid
  skill: string // tid
  price: number
}

// =============================================================================
// DIMENSION 5: EVENTS
// =============================================================================

export interface Signal {
  sender: string // uid
  receiver: string // uid
  data: unknown // JSON payload
  amount: number // x402 payment (0 = free)
  success: boolean
  latency: number // ms
  ts: Date
}

// =============================================================================
// DIMENSION 6: KNOWLEDGE
// =============================================================================

export type HypothesisStatus = 'pending' | 'testing' | 'confirmed' | 'rejected'

export interface Hypothesis {
  hid: string
  statement: string
  status: HypothesisStatus
  observationsCount: number
  pValue: number
  actionReady: boolean // INFERRED
}

export type FrontierStatus = 'unexplored' | 'exploring' | 'exhausted'

export interface Frontier {
  fid: string
  frontierType: string
  description: string
  expectedValue: number // potential * probability / cost
  status: FrontierStatus
  objectives?: string[] // oids of spawned objectives
}

export type ObjectiveStatus = 'pending' | 'active' | 'complete'

export interface Objective {
  oid: string
  objectiveType: string
  description: string
  priorityScore: number
  progress: number // 0.0–1.0
  status: ObjectiveStatus
}

export type ContributionType = 'task' | 'signal' | 'payment' | 'discovery'

export interface Contribution {
  contributionId: string
  contributorUid: string
  impactScore: number
  contributionType: ContributionType
}

// =============================================================================
// WORLD STATE
// =============================================================================

export interface WorldState {
  groups: Group[]
  units: Unit[]
  tasks: Task[]
  edges: Edge[]
  trails: Trail[]
  capabilities: Capability[]
  signals: Signal[]
  hypotheses: Hypothesis[]
  frontiers: Frontier[]
  objectives: Objective[]
  contributions: Contribution[]
}

// =============================================================================
// COMPUTED VIEWS
// =============================================================================

export interface WorldStats {
  totalUnits: number
  provenUnits: number
  atRiskUnits: number
  totalTasks: number
  readyTasks: number
  attractiveTasks: number
  highways: number
  totalRevenue: number
  totalContribution: number
}

// Metaphor mapping for UI
export const dimensionLabels = {
  ant: {
    group: 'Colony',
    unit: 'Ant',
    task: 'Trail',
    edge: 'Pheromone',
    signal: 'Chemical',
    knowledge: 'Memory',
  },
  brain: {
    group: 'Network',
    unit: 'Neuron',
    task: 'Pattern',
    edge: 'Synapse',
    signal: 'Impulse',
    knowledge: 'Memory',
  },
  team: {
    group: 'Team',
    unit: 'Member',
    task: 'Task',
    edge: 'Connection',
    signal: 'Message',
    knowledge: 'Learning',
  },
  mail: {
    group: 'Inbox',
    unit: 'Contact',
    task: 'Thread',
    edge: 'Chain',
    signal: 'Email',
    knowledge: 'Archive',
  },
  water: {
    group: 'Basin',
    unit: 'Drop',
    task: 'Channel',
    edge: 'Flow',
    signal: 'Wave',
    knowledge: 'Depth',
  },
  signal: {
    group: 'Grid',
    unit: 'Node',
    task: 'Route',
    edge: 'Link',
    signal: 'Packet',
    knowledge: 'State',
  },
} as const

// =============================================================================
// ~200 lines. All 6 dimensions. Full type safety.
// =============================================================================
