// Mock Colony Data - simulates TypeQL query output as JSON
// This is what TypeDB queries would return, ready for ReactFlow

import type { FlowJSON, AntNode, TaskNode, PheromoneEdge, SwarmNode, EnvelopeNode } from "./types";
import type { Node, Edge } from "@xyflow/react";
import type { AgentNodeData } from "@/components/flow/nodes/AgentNode";

// ============================================================================
// SAMPLE ANTS
// ============================================================================

const antNodes: AntNode[] = [
  {
    id: "scout-alpha",
    type: "ant",
    position: { x: 100, y: 100 },
    data: {
      id: "scout-alpha",
      name: "Alpha",
      caste: "scout",
      tier: "elite",
      status: "ready",
      successRate: 0.92,
      activityScore: 85,
      totalContribution: 142,
    },
  },
  {
    id: "scout-beta",
    type: "ant",
    position: { x: 100, y: 250 },
    data: {
      id: "scout-beta",
      name: "Beta",
      caste: "scout",
      tier: "standard",
      status: "idle",
      successRate: 0.68,
      activityScore: 45,
      totalContribution: 38,
    },
  },
  {
    id: "worker-gamma",
    type: "ant",
    position: { x: 350, y: 100 },
    data: {
      id: "worker-gamma",
      name: "Gamma",
      caste: "worker",
      tier: "elite",
      status: "ready",
      successRate: 0.88,
      activityScore: 92,
      totalContribution: 256,
    },
  },
  {
    id: "worker-delta",
    type: "ant",
    position: { x: 350, y: 250 },
    data: {
      id: "worker-delta",
      name: "Delta",
      caste: "worker",
      tier: "standard",
      status: "waiting",
      successRate: 0.72,
      activityScore: 58,
      totalContribution: 67,
      swarmId: "swarm-frontier",
    },
  },
  {
    id: "forager-epsilon",
    type: "ant",
    position: { x: 600, y: 175 },
    data: {
      id: "forager-epsilon",
      name: "Epsilon",
      caste: "forager",
      tier: "elite",
      status: "ready",
      successRate: 0.95,
      activityScore: 98,
      totalContribution: 312,
    },
  },
  {
    id: "soldier-zeta",
    type: "ant",
    position: { x: 850, y: 100 },
    data: {
      id: "soldier-zeta",
      name: "Zeta",
      caste: "soldier",
      tier: "standard",
      status: "idle",
      successRate: 0.78,
      activityScore: 62,
      totalContribution: 89,
    },
  },
  {
    id: "nurse-eta",
    type: "ant",
    position: { x: 850, y: 250 },
    data: {
      id: "nurse-eta",
      name: "Eta",
      caste: "nurse",
      tier: "at-risk",
      status: "error",
      successRate: 0.35,
      activityScore: 22,
      totalContribution: 12,
    },
  },
];

// ============================================================================
// SAMPLE TASKS
// ============================================================================

const taskNodes: TaskNode[] = [
  {
    id: "task-frontier",
    type: "task",
    position: { x: 225, y: 400 },
    data: {
      id: "task-frontier",
      title: "Explore frontier zone",
      status: "todo",
      priority: "P1",
      attractive: true,
    },
  },
  {
    id: "task-harvest",
    type: "task",
    position: { x: 475, y: 400 },
    data: {
      id: "task-harvest",
      title: "Harvest resource cache",
      status: "in_progress",
      priority: "P0",
      attractive: true,
    },
  },
  {
    id: "task-repair",
    type: "task",
    position: { x: 725, y: 400 },
    data: {
      id: "task-repair",
      title: "Repair tunnel section",
      status: "blocked",
      priority: "P2",
      repelled: true,
      blockedBy: ["task-survey"],
    },
  },
  {
    id: "task-survey",
    type: "task",
    position: { x: 975, y: 400 },
    data: {
      id: "task-survey",
      title: "Survey damage extent",
      status: "todo",
      priority: "P1",
    },
  },
];

// ============================================================================
// SAMPLE SWARM
// ============================================================================

const swarmNodes: SwarmNode[] = [
  {
    id: "swarm-frontier",
    type: "swarm",
    position: { x: 200, y: 500 },
    data: {
      id: "swarm-frontier",
      purpose: "Frontier Exploration",
      status: "forming",
      memberCount: 2,
      maxSize: 5,
      collectiveProgress: 0.3,
    },
  },
];

// ============================================================================
// PHEROMONE TRAILS
// ============================================================================

const pheromoneEdges: PheromoneEdge[] = [
  // Scout Alpha -> Task Frontier (proven trail)
  {
    id: "trail-alpha-frontier",
    type: "pheromone",
    source: "scout-alpha",
    target: "task-frontier",
    data: {
      trail: 82,
      alarm: 5,
      status: "proven",
      completions: 12,
      failures: 1,
    },
  },
  // Scout Beta -> Task Frontier (fresh trail)
  {
    id: "trail-beta-frontier",
    type: "pheromone",
    source: "scout-beta",
    target: "task-frontier",
    data: {
      trail: 35,
      alarm: 0,
      status: "fresh",
      completions: 3,
      failures: 0,
    },
  },
  // Task Frontier -> Worker Gamma (proven trail)
  {
    id: "trail-frontier-gamma",
    type: "pheromone",
    source: "task-frontier",
    target: "worker-gamma",
    data: {
      trail: 75,
      alarm: 8,
      status: "proven",
      completions: 8,
      failures: 2,
    },
  },
  // Worker Gamma -> Task Harvest (proven trail, high traffic)
  {
    id: "trail-gamma-harvest",
    type: "pheromone",
    source: "worker-gamma",
    target: "task-harvest",
    data: {
      trail: 95,
      alarm: 2,
      status: "proven",
      completions: 24,
      failures: 1,
    },
  },
  // Worker Delta -> Task Harvest (fresh)
  {
    id: "trail-delta-harvest",
    type: "pheromone",
    source: "worker-delta",
    target: "task-harvest",
    data: {
      trail: 45,
      alarm: 0,
      status: "fresh",
      completions: 4,
      failures: 0,
    },
  },
  // Task Harvest -> Forager Epsilon (proven)
  {
    id: "trail-harvest-epsilon",
    type: "pheromone",
    source: "task-harvest",
    target: "forager-epsilon",
    data: {
      trail: 88,
      alarm: 3,
      status: "proven",
      completions: 18,
      failures: 1,
    },
  },
  // Forager Epsilon -> Soldier Zeta (fading - needs reinforcement)
  {
    id: "trail-epsilon-zeta",
    type: "pheromone",
    source: "forager-epsilon",
    target: "soldier-zeta",
    data: {
      trail: 8,
      alarm: 0,
      status: "fading",
      completions: 2,
      failures: 0,
    },
  },
  // Soldier Zeta -> Task Repair (alarmed - failures!)
  {
    id: "trail-zeta-repair",
    type: "pheromone",
    source: "soldier-zeta",
    target: "task-repair",
    data: {
      trail: 25,
      alarm: 45,
      status: "fresh",
      completions: 2,
      failures: 6,
    },
  },
  // Task Repair -> Task Survey (dependency)
  {
    id: "dep-repair-survey",
    type: "dependency",
    source: "task-survey",
    target: "task-repair",
    data: {
      blockerStatus: "todo",
      isBlocking: true,
    },
  },
  // Nurse Eta has no active trails (at-risk)
];

// ============================================================================
// COMBINED FLOW JSON
// ============================================================================

export const mockColonyState: FlowJSON = {
  nodes: [...antNodes, ...taskNodes, ...swarmNodes],
  edges: pheromoneEdges,
  events: [
    {
      event: "rule-fired",
      rule: "high-quality-record",
      affected: {
        nodes: ["forager-epsilon"],
        edges: ["trail-harvest-epsilon"],
      },
      animation: "pulse",
    },
  ],
};

// ============================================================================
// QUERY RESULT SIMULATORS (what TypeQL would return)
// ============================================================================

export const mockQueries = {
  // colony_agents() - all ants with their stats
  colony_agents: (): FlowJSON => ({
    nodes: antNodes,
    edges: [],
  }),

  // ready_tasks() - tasks with no incomplete blockers
  ready_tasks: (): FlowJSON => ({
    nodes: taskNodes.filter(
      (t) => t.data.status === "todo" && !t.data.blockedBy?.length
    ),
    edges: [],
  }),

  // active_trails() - all pheromone trails
  active_trails: (): FlowJSON => ({
    nodes: [],
    edges: pheromoneEdges.filter((e) => e.type === "pheromone"),
  }),

  // attractive_tasks() - tasks with high trail pheromone
  attractive_tasks: (): FlowJSON => ({
    nodes: taskNodes.filter((t) => t.data.attractive),
    edges: [],
  }),

  // elite_agents() - agents meeting elite criteria
  elite_agents: (): FlowJSON => ({
    nodes: antNodes.filter((a) => a.data.tier === "elite"),
    edges: [],
  }),

  // proven_trails() - superhighway trails
  proven_trails: (): FlowJSON => ({
    nodes: [],
    edges: pheromoneEdges.filter(
      (e) => e.type === "pheromone" && e.data?.status === "proven"
    ),
  }),

  // fading_trails() - trails needing reinforcement
  fading_trails: (): FlowJSON => ({
    nodes: [],
    edges: pheromoneEdges.filter(
      (e) => e.type === "pheromone" && e.data?.status === "fading"
    ),
  }),

  // active_swarms() - swarms not dissolved
  active_swarms: (): FlowJSON => ({
    nodes: swarmNodes.filter((s) => s.data.status !== "dissolved"),
    edges: [],
  }),

  // full_colony() - everything
  full_colony: (): FlowJSON => mockColonyState,

  // envelope_system() - Data Processor, Router, Validator
  envelope_system: (): FlowJSON => mockEnvelopeSystem,

  // combined_view() - both envelope agents and ant colony
  combined_view: (): FlowJSON => mockCombinedState,
};

export type QueryName = keyof typeof mockQueries;

// ============================================================================
// ENVELOPE SYSTEM AGENTS (Data Processor, Router, Validator)
// ============================================================================

type AgentNode = Node<AgentNodeData, "agent">;

const envelopeAgentNodes: AgentNode[] = [
  {
    id: "agent-a",
    type: "agent",
    position: { x: 100, y: 150 },
    data: {
      id: "agent-a",
      name: "Data Processor",
      status: "ready",
      actions: ["processData", "validate"],
      envelopeCount: 1,
      role: "processor",
    },
  },
  {
    id: "agent-b",
    type: "agent",
    position: { x: 400, y: 150 },
    data: {
      id: "agent-b",
      name: "Router",
      status: "ready",
      actions: ["routeEnvelope"],
      envelopeCount: 1,
      role: "router",
    },
  },
  {
    id: "agent-c",
    type: "agent",
    position: { x: 700, y: 150 },
    data: {
      id: "agent-c",
      name: "Validator",
      status: "ready",
      actions: ["signPayload"],
      envelopeCount: 1,
      role: "validator",
    },
  },
];

const envelopeNodes: EnvelopeNode[] = [
  {
    id: "env-001",
    type: "envelope",
    position: { x: 100, y: 320 },
    data: {
      id: "env-001",
      action: "processData",
      status: "resolved",
      sourceAgentId: "system",
      targetAgentId: "agent-a",
    },
  },
  {
    id: "env-002",
    type: "envelope",
    position: { x: 400, y: 320 },
    data: {
      id: "env-002",
      action: "routeEnvelope",
      status: "resolved",
      sourceAgentId: "agent-a",
      targetAgentId: "agent-b",
    },
  },
  {
    id: "env-003",
    type: "envelope",
    position: { x: 700, y: 320 },
    data: {
      id: "env-003",
      action: "signPayload",
      status: "resolved",
      sourceAgentId: "agent-b",
      targetAgentId: "agent-c",
    },
  },
];

const envelopeEdges: Edge[] = [
  // Agent to Agent flow (callback chain)
  {
    id: "flow-a-b",
    type: "pheromone",
    source: "agent-a",
    target: "agent-b",
    animated: true,
    data: {
      trail: 90,
      alarm: 0,
      status: "proven",
      completions: 15,
      failures: 0,
    },
  },
  {
    id: "flow-b-c",
    type: "pheromone",
    source: "agent-b",
    target: "agent-c",
    animated: true,
    data: {
      trail: 85,
      alarm: 0,
      status: "proven",
      completions: 12,
      failures: 0,
    },
  },
  // Envelope connections
  {
    id: "env-flow-1",
    source: "env-001",
    target: "agent-a",
    type: "default",
    style: { stroke: "#3b82f6", strokeDasharray: "5,5" },
  },
  {
    id: "env-flow-2",
    source: "agent-a",
    target: "env-002",
    type: "default",
    style: { stroke: "#22c55e", strokeDasharray: "5,5" },
  },
  {
    id: "env-flow-3",
    source: "env-002",
    target: "agent-b",
    type: "default",
    style: { stroke: "#3b82f6", strokeDasharray: "5,5" },
  },
  {
    id: "env-flow-4",
    source: "agent-b",
    target: "env-003",
    type: "default",
    style: { stroke: "#22c55e", strokeDasharray: "5,5" },
  },
  {
    id: "env-flow-5",
    source: "env-003",
    target: "agent-c",
    type: "default",
    style: { stroke: "#3b82f6", strokeDasharray: "5,5" },
  },
  // Callback chain (envelope to envelope)
  {
    id: "callback-1-2",
    source: "env-001",
    target: "env-002",
    type: "default",
    label: "callback",
    style: { stroke: "#eab308", strokeWidth: 2 },
    labelStyle: { fill: "#eab308", fontSize: 10 },
  },
  {
    id: "callback-2-3",
    source: "env-002",
    target: "env-003",
    type: "default",
    label: "callback",
    style: { stroke: "#eab308", strokeWidth: 2 },
    labelStyle: { fill: "#eab308", fontSize: 10 },
  },
];

export const mockEnvelopeSystem: FlowJSON = {
  nodes: [...envelopeAgentNodes, ...envelopeNodes] as FlowJSON["nodes"],
  edges: envelopeEdges as FlowJSON["edges"],
};

// Combined view: Envelope agents + Colony ants
export const mockCombinedState: FlowJSON = {
  nodes: [
    ...envelopeAgentNodes.map(n => ({ ...n, position: { x: n.position.x, y: n.position.y } })),
    ...envelopeNodes.map(n => ({ ...n, position: { x: n.position.x, y: n.position.y + 50 } })),
    ...antNodes.map(n => ({ ...n, position: { x: n.position.x, y: n.position.y + 450 } })),
    ...taskNodes.map(n => ({ ...n, position: { x: n.position.x, y: n.position.y + 450 } })),
  ] as FlowJSON["nodes"],
  edges: [
    ...envelopeEdges,
    ...pheromoneEdges,
  ] as FlowJSON["edges"],
};
