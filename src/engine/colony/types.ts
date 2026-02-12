// Colony Types - TypeScript interfaces matching TypeQL schema
// Designed to be generated from TypeDB queries as JSON

import type { Node, Edge } from "@xyflow/react";

// ============================================================================
// ANT CASTES & TIERS
// ============================================================================

export type AntCaste = "scout" | "worker" | "soldier" | "forager" | "nurse";
export type AntTier = "elite" | "standard" | "at-risk";
export type AgentStatus = "ready" | "waiting" | "idle" | "error";

// ============================================================================
// PHEROMONE SYSTEM
// ============================================================================

export type PheromoneType = "trail" | "alarm" | "recruitment" | "assembly" | "completion";
export type TrailStatus = "proven" | "fresh" | "fading" | "dead";

export interface PheromoneConfig {
  type: PheromoneType;
  decayRate: number; // 0.05 for trail, 0.20 for alarm
  color: string;
}

export const PHEROMONE_CONFIG: Record<PheromoneType, PheromoneConfig> = {
  trail: { type: "trail", decayRate: 0.05, color: "#22c55e" },
  alarm: { type: "alarm", decayRate: 0.20, color: "#ef4444" },
  recruitment: { type: "recruitment", decayRate: 0.10, color: "#a855f7" },
  assembly: { type: "assembly", decayRate: 0.15, color: "#a855f7" },
  completion: { type: "completion", decayRate: 0.50, color: "#64748b" },
};

// ============================================================================
// ENTITY TYPES (matching TypeQL schema)
// ============================================================================

export interface AntAgent {
  id: string;
  name: string;
  caste: AntCaste;
  tier: AntTier;
  status: AgentStatus;
  successRate: number;
  activityScore: number;
  sampleCount: number;
  totalContribution: number;
  swarmId?: string;
  responseThreshold: number;
}

export interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "complete" | "blocked";
  priority: "P0" | "P1" | "P2" | "P3";
  attractive?: boolean;
  repelled?: boolean;
  blockedBy?: string[];
}

export interface PheromoneTrail {
  id: string;
  sourceId: string;
  destinationId: string;
  trailPheromone: number;
  alarmPheromone: number;
  completions: number;
  failures: number;
  status: TrailStatus;
}

export interface Swarm {
  id: string;
  purpose: string;
  targetTaskId: string;
  members: string[];
  status: "forming" | "active" | "dissolving" | "dissolved";
  minSize: number;
  maxSize: number;
  collectiveProgress: number;
}

export interface RecruitmentSignal {
  id: string;
  sourceAgentId: string;
  sourceTaskId: string;
  strength: number;
  requiredSkills: string[];
  respondents: number;
  maxRespondents: number;
  status: "active" | "satisfied" | "expired";
}

export interface ColonyEnvelope {
  id: string;
  action: ColonyAction;
  status: "pending" | "resolved" | "rejected";
  sourceAgentId: string;
  targetAgentId: string;
  inputs: Record<string, unknown>;
  results?: unknown;
}

// ============================================================================
// COLONY LOOP ACTIONS (L1-L6)
// ============================================================================

export type ColonyAction =
  // L1: Perception
  | "L1:classify"
  | "L1:sense"
  // L2: Homeostasis
  | "L2:validate"
  | "L2:quality-check"
  // L3: Hypothesis
  | "L3:observe"
  | "L3:test"
  | "L3:confirm"
  // L4: Task Allocation
  | "L4:ready-tasks"
  | "L4:select"
  | "L4:assign"
  // L5: Contribution
  | "L5:record"
  | "L5:aggregate"
  | "L5:synergy"
  // L6: Emergence
  | "L6:detect-frontier"
  | "L6:spawn-objective"
  // Envelope System Actions
  | "processData"
  | "validate"
  | "routeEnvelope"
  | "signPayload";

// ============================================================================
// INFERENCE EVENTS
// ============================================================================

export interface InferenceEvent {
  event: "rule-fired" | "decay-tick" | "swarm-formed" | "trail-updated";
  rule?: string;
  affected: {
    nodes: string[];
    edges: string[];
  };
  animation?: "cascade-wave" | "pulse" | "fade" | "unlock-burst" | "swarm-pulse";
}

// ============================================================================
// REACTFLOW NODE/EDGE DATA TYPES
// ============================================================================

export interface AntNodeData {
  id: string;
  name: string;
  caste: AntCaste;
  tier: AntTier;
  status: AgentStatus;
  successRate: number;
  activityScore: number;
  swarmId?: string;
  totalContribution: number;
}

export interface TaskNodeData {
  id: string;
  title: string;
  status: Task["status"];
  priority: Task["priority"];
  attractive?: boolean;
  repelled?: boolean;
  blockedBy?: string[];
}

export interface EnvelopeNodeData {
  id: string;
  action: ColonyAction;
  status: "pending" | "resolved" | "rejected";
  sourceAgentId: string;
  targetAgentId: string;
}

export interface SwarmNodeData {
  id: string;
  purpose: string;
  status: Swarm["status"];
  memberCount: number;
  maxSize: number;
  collectiveProgress: number;
}

export interface LawNodeData {
  id: string;
  law: "L1" | "L2" | "L3" | "L4" | "L5" | "L6";
  name: string;
  description: string;
  active: boolean;
}

export interface PheromoneEdgeData {
  trail: number;
  alarm: number;
  status: TrailStatus;
  completions: number;
  failures: number;
}

export interface DependencyEdgeData {
  blockerStatus: Task["status"];
  isBlocking: boolean;
}

// ============================================================================
// FLOW JSON SCHEMA (TypeQL query output)
// ============================================================================

export type AntNode = Node<AntNodeData, "ant">;
export type TaskNode = Node<TaskNodeData, "task">;
export type EnvelopeNode = Node<EnvelopeNodeData, "envelope">;
export type SwarmNode = Node<SwarmNodeData, "swarm">;
export type LawNode = Node<LawNodeData, "law">;

export type PheromoneEdge = Edge<PheromoneEdgeData>;
export type DependencyEdge = Edge<DependencyEdgeData>;

export type ColonyNode = AntNode | TaskNode | EnvelopeNode | SwarmNode | LawNode;
export type ColonyEdge = PheromoneEdge | DependencyEdge | Edge;

export interface FlowJSON {
  nodes: ColonyNode[];
  edges: ColonyEdge[];
  events?: InferenceEvent[];
}

// ============================================================================
// VISUAL STYLING CONSTANTS
// ============================================================================

export const CASTE_STYLES: Record<AntCaste, { icon: string; gradient: string; color: string }> = {
  scout: { icon: "S", gradient: "from-amber-500/20 to-orange-500/20", color: "#f59e0b" },
  worker: { icon: "W", gradient: "from-blue-500/20 to-cyan-500/20", color: "#3b82f6" },
  soldier: { icon: "X", gradient: "from-red-500/20 to-rose-500/20", color: "#ef4444" },
  forager: { icon: "F", gradient: "from-green-500/20 to-emerald-500/20", color: "#22c55e" },
  nurse: { icon: "N", gradient: "from-pink-500/20 to-fuchsia-500/20", color: "#ec4899" },
};

export const TIER_STYLES: Record<AntTier, { badge: string; scale: number }> = {
  elite: { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", scale: 1.15 },
  standard: { badge: "bg-slate-500/20 text-slate-400 border-slate-500/30", scale: 1.0 },
  "at-risk": { badge: "bg-red-500/20 text-red-400 border-red-500/30", scale: 0.9 },
};

export const STATUS_COLORS: Record<AgentStatus, string> = {
  ready: "#22c55e",
  waiting: "#eab308",
  idle: "#64748b",
  error: "#ef4444",
};

export const TRAIL_STYLES: Record<TrailStatus, { color: string; dashArray?: string; glow: boolean }> = {
  proven: { color: "#22c55e", glow: true },
  fresh: { color: "#60a5fa", glow: false },
  fading: { color: "#fbbf24", dashArray: "5,5", glow: false },
  dead: { color: "#475569", glow: false },
};
