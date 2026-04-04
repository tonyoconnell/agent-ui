/**
 * ONE Types — TypeScript definitions matching one.tql schema
 *
 * 6 Dimensions:
 *   1. Groups    — swarms (personas, teams, colonies)
 *   2. Actors    — units (humans, agents, LLMs)
 *   3. Things    — tasks with optional price (work AND services)
 *   4. Edges     — weighted connections (unit↔unit, task→task)
 *   5. Events    — signals (who sent what, paid how much)
 *   6. Knowledge — hypotheses, frontiers, objectives
 */

// =============================================================================
// DIMENSION 1: GROUPS
// =============================================================================

export interface Swarm {
  sid: string
  name: string
  purpose?: string
  swarmType: "persona" | "team" | "colony" | "dao"
  status: string
  created: Date
  parent?: string  // sid of parent swarm
  children?: string[]  // sids of child swarms
}

// =============================================================================
// DIMENSION 2: ACTORS
// =============================================================================

export interface Unit {
  uid: string
  name: string
  unitKind: "human" | "agent" | "llm" | "system"
  wallet?: string  // Sui address
  status: "active" | "proven" | "at-risk"  // INFERRED
  balance: number
  reputation: number
  // L1 Classification attributes
  successRate: number    // 0.0–1.0
  activityScore: number  // 0.0–100.0
  sampleCount: number    // interaction count
  created: Date
  swarms?: string[]  // sids of swarms this unit belongs to
}

// =============================================================================
// DIMENSION 3: THINGS
// =============================================================================

export type TaskType =
  | "work" | "explore" | "validate" | "build"
  | "inference" | "analysis" | "data" | "compute"

export type TaskStatus = "todo" | "in_progress" | "complete" | "blocked" | "failed"
export type Priority = "P0" | "P1" | "P2" | "P3"
export type Phase = "wire" | "tasks" | "onboard" | "commerce" | "intelligence" | "scale"

export interface Task {
  tid: string
  name: string
  description?: string
  taskType: TaskType
  status: TaskStatus
  priority: Priority
  phase: Phase
  importance: number  // 1–10
  price: number       // x402 price (0 = free, >0 = paid service)
  currency: "SUI" | "USDC" | "FET"
  timeout?: number    // max latency ms
  // L4 Inferred
  attractive?: boolean
  repelled?: boolean
  // Dependencies
  blockedBy?: string[]  // tids of blocking tasks
}

// =============================================================================
// DIMENSION 4: EDGES
// =============================================================================

export type EdgeStatus = "highway" | "fresh" | "fading" | "toxic"
export type TrailStatus = "proven" | "fresh" | "fading" | "dead"

// Unit-to-unit connection
export interface Edge {
  source: string     // uid
  target: string     // uid
  strength: number   // drop() adds weight here
  alarm: number      // alarm() adds weight here
  traversals: number
  revenue: number    // sum of x402 payments on this edge
  lastUsed: Date
  status: EdgeStatus // INFERRED
}

// Task-to-task connection
export interface Trail {
  sourceTask: string      // tid
  destinationTask: string // tid
  trailPheromone: number  // 0–100 (drop on success)
  alarmPheromone: number  // 0–100 (alarm on failure)
  completions: number
  failures: number
  revenue: number         // x402 revenue from this task sequence
  status: TrailStatus     // INFERRED
}

// Unit can do task (at a price)
export interface Capability {
  provider: string  // uid
  skill: string     // tid
  price: number
}

// =============================================================================
// DIMENSION 5: EVENTS
// =============================================================================

export interface Signal {
  sender: string    // uid
  receiver: string  // uid
  data: unknown     // JSON payload
  amount: number    // x402 payment (0 = free)
  success: boolean
  latency: number   // ms
  ts: Date
}

// =============================================================================
// DIMENSION 6: KNOWLEDGE
// =============================================================================

export type HypothesisStatus = "pending" | "testing" | "confirmed" | "rejected"

export interface Hypothesis {
  hid: string
  statement: string
  status: HypothesisStatus
  observationsCount: number
  pValue: number
  actionReady: boolean  // INFERRED
}

export type FrontierStatus = "unexplored" | "exploring" | "exhausted"

export interface Frontier {
  fid: string
  frontierType: string
  description: string
  expectedValue: number  // potential * probability / cost
  status: FrontierStatus
  objectives?: string[]  // oids of spawned objectives
}

export type ObjectiveStatus = "pending" | "active" | "complete"

export interface Objective {
  oid: string
  objectiveType: string
  description: string
  priorityScore: number
  progress: number  // 0.0–1.0
  status: ObjectiveStatus
}

export type ContributionType = "task" | "signal" | "payment" | "discovery"

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
  swarms: Swarm[]
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
    swarm: "Colony", unit: "Ant", task: "Trail", edge: "Pheromone",
    signal: "Chemical", knowledge: "Memory"
  },
  brain: {
    swarm: "Network", unit: "Neuron", task: "Pattern", edge: "Synapse",
    signal: "Impulse", knowledge: "Memory"
  },
  team: {
    swarm: "Team", unit: "Member", task: "Task", edge: "Connection",
    signal: "Message", knowledge: "Learning"
  },
  mail: {
    swarm: "Inbox", unit: "Contact", task: "Thread", edge: "Chain",
    signal: "Email", knowledge: "Archive"
  },
  water: {
    swarm: "Basin", unit: "Drop", task: "Channel", edge: "Flow",
    signal: "Wave", knowledge: "Depth"
  },
  signal: {
    swarm: "Grid", unit: "Node", task: "Route", edge: "Link",
    signal: "Packet", knowledge: "State"
  }
} as const

// =============================================================================
// ~200 lines. All 6 dimensions. Full type safety.
// =============================================================================
