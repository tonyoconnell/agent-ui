// Task Mock Data - Simulates TypeQL task-management.tql query output
// Rich task graph with dependencies, trails, categories, milestones

import type {
  TaskFlowJSON,
  RichTaskNode,
  MilestoneNode,
  CategoryNode,
  AssigneeNode,
  TaskTrailEdge,
  TaskDependencyEdge,
  TaskCategory,
  Milestone,
  TaskTag,
  Assignee,
} from "./taskTypes";
import type { Edge } from "@xyflow/react";

// ============================================================================
// REFERENCE DATA
// ============================================================================

export const categories: TaskCategory[] = [
  { id: "cat-backend", name: "Backend", color: "#3b82f6", description: "Server-side code" },
  { id: "cat-frontend", name: "Frontend", color: "#22c55e", description: "UI components" },
  { id: "cat-infra", name: "Infrastructure", color: "#f59e0b", description: "DevOps & deployment" },
  { id: "cat-data", name: "Data", color: "#a855f7", description: "Database & analytics" },
];

export const milestones: Milestone[] = [
  { id: "ms-alpha", name: "Alpha Release", completionPercentage: 0.75, status: "active", targetDate: "2024-03-01" },
  { id: "ms-beta", name: "Beta Release", completionPercentage: 0.30, status: "active", targetDate: "2024-04-15" },
];

export const tags: TaskTag[] = [
  { id: "tag-bug", name: "bug", color: "#ef4444" },
  { id: "tag-feature", name: "feature", color: "#22c55e" },
  { id: "tag-refactor", name: "refactor", color: "#a855f7" },
  { id: "tag-urgent", name: "urgent", color: "#f59e0b" },
  { id: "tag-blocked", name: "blocked", color: "#64748b" },
];

export const assignees: Assignee[] = [
  { id: "user-alice", name: "Alice", type: "human", avatar: "A" },
  { id: "user-bob", name: "Bob", type: "human", avatar: "B" },
  { id: "bot-ci", name: "CI Bot", type: "bot", avatar: "🤖" },
  { id: "team-platform", name: "Platform Team", type: "team", avatar: "👥" },
];

// ============================================================================
// TASK NODES
// ============================================================================

const taskNodes: RichTaskNode[] = [
  // Backend tasks
  {
    id: "task-api-auth",
    type: "richTask",
    position: { x: 100, y: 100 },
    data: {
      id: "task-api-auth",
      title: "Implement OAuth2 authentication",
      description: "Add OAuth2 flow with JWT tokens",
      status: "complete",
      priority: "P0",
      importance: 9,
      effortSize: "large",
      attractive: true,
      category: categories[0],
      milestone: milestones[0],
      tags: [tags[1], tags[3]],
      assignee: assignees[0],
      blocks: ["task-api-users", "task-api-roles"],
    },
  },
  {
    id: "task-api-users",
    type: "richTask",
    position: { x: 400, y: 50 },
    data: {
      id: "task-api-users",
      title: "User management API",
      description: "CRUD endpoints for users",
      status: "in_progress",
      priority: "P1",
      importance: 8,
      effortSize: "medium",
      attractive: true,
      category: categories[0],
      milestone: milestones[0],
      tags: [tags[1]],
      assignee: assignees[0],
      blockedBy: ["task-api-auth"],
      blocks: ["task-ui-users"],
    },
  },
  {
    id: "task-api-roles",
    type: "richTask",
    position: { x: 400, y: 170 },
    data: {
      id: "task-api-roles",
      title: "Role-based access control",
      description: "Implement RBAC middleware",
      status: "todo",
      priority: "P1",
      importance: 8,
      effortSize: "medium",
      category: categories[0],
      milestone: milestones[0],
      tags: [tags[1]],
      assignee: assignees[1],
      blockedBy: ["task-api-auth"],
      blocks: ["task-api-admin"],
    },
  },
  {
    id: "task-api-admin",
    type: "richTask",
    position: { x: 700, y: 170 },
    data: {
      id: "task-api-admin",
      title: "Admin dashboard API",
      description: "Admin-only endpoints",
      status: "blocked",
      priority: "P2",
      importance: 6,
      effortSize: "medium",
      repelled: true,
      blockedReason: "Waiting for RBAC",
      category: categories[0],
      milestone: milestones[1],
      tags: [tags[1], tags[4]],
      blockedBy: ["task-api-roles"],
    },
  },

  // Frontend tasks
  {
    id: "task-ui-design",
    type: "richTask",
    position: { x: 100, y: 350 },
    data: {
      id: "task-ui-design",
      title: "Design system setup",
      description: "Tailwind + shadcn/ui configuration",
      status: "complete",
      priority: "P0",
      importance: 9,
      effortSize: "small",
      attractive: true,
      category: categories[1],
      milestone: milestones[0],
      tags: [tags[1]],
      assignee: assignees[1],
      blocks: ["task-ui-components", "task-ui-users"],
    },
  },
  {
    id: "task-ui-components",
    type: "richTask",
    position: { x: 400, y: 300 },
    data: {
      id: "task-ui-components",
      title: "Core UI components",
      description: "Buttons, inputs, cards, modals",
      status: "complete",
      priority: "P1",
      importance: 8,
      effortSize: "medium",
      attractive: true,
      category: categories[1],
      milestone: milestones[0],
      tags: [tags[1]],
      assignee: assignees[1],
      blockedBy: ["task-ui-design"],
      blocks: ["task-ui-users", "task-ui-dashboard"],
    },
  },
  {
    id: "task-ui-users",
    type: "richTask",
    position: { x: 700, y: 50 },
    data: {
      id: "task-ui-users",
      title: "User management UI",
      description: "User list, profile, settings pages",
      status: "todo",
      priority: "P1",
      importance: 7,
      effortSize: "large",
      category: categories[1],
      milestone: milestones[1],
      tags: [tags[1]],
      assignee: assignees[0],
      blockedBy: ["task-api-users", "task-ui-components"],
    },
  },
  {
    id: "task-ui-dashboard",
    type: "richTask",
    position: { x: 700, y: 350 },
    data: {
      id: "task-ui-dashboard",
      title: "Analytics dashboard",
      description: "Charts, metrics, KPIs",
      status: "todo",
      priority: "P2",
      importance: 6,
      effortSize: "large",
      category: categories[1],
      milestone: milestones[1],
      tags: [tags[1]],
      blockedBy: ["task-ui-components", "task-data-pipeline"],
    },
  },

  // Infrastructure tasks
  {
    id: "task-infra-k8s",
    type: "richTask",
    position: { x: 100, y: 500 },
    data: {
      id: "task-infra-k8s",
      title: "Kubernetes cluster setup",
      description: "EKS cluster with autoscaling",
      status: "complete",
      priority: "P0",
      importance: 10,
      effortSize: "large",
      attractive: true,
      category: categories[2],
      milestone: milestones[0],
      tags: [tags[1]],
      assignee: assignees[3],
      blocks: ["task-infra-ci", "task-infra-monitoring"],
    },
  },
  {
    id: "task-infra-ci",
    type: "richTask",
    position: { x: 400, y: 450 },
    data: {
      id: "task-infra-ci",
      title: "CI/CD pipeline",
      description: "GitHub Actions + ArgoCD",
      status: "in_progress",
      priority: "P1",
      importance: 9,
      effortSize: "medium",
      attractive: true,
      category: categories[2],
      milestone: milestones[0],
      tags: [tags[1]],
      assignee: assignees[2],
      blockedBy: ["task-infra-k8s"],
    },
  },
  {
    id: "task-infra-monitoring",
    type: "richTask",
    position: { x: 400, y: 550 },
    data: {
      id: "task-infra-monitoring",
      title: "Observability stack",
      description: "Prometheus + Grafana + Loki",
      status: "todo",
      priority: "P2",
      importance: 7,
      effortSize: "medium",
      category: categories[2],
      milestone: milestones[1],
      tags: [tags[1]],
      assignee: assignees[3],
      blockedBy: ["task-infra-k8s"],
    },
  },

  // Data tasks
  {
    id: "task-data-schema",
    type: "richTask",
    position: { x: 100, y: 650 },
    data: {
      id: "task-data-schema",
      title: "Database schema design",
      description: "PostgreSQL schema with migrations",
      status: "complete",
      priority: "P0",
      importance: 10,
      effortSize: "medium",
      attractive: true,
      category: categories[3],
      milestone: milestones[0],
      tags: [tags[1]],
      assignee: assignees[0],
      blocks: ["task-data-pipeline", "task-api-auth"],
    },
  },
  {
    id: "task-data-pipeline",
    type: "richTask",
    position: { x: 400, y: 650 },
    data: {
      id: "task-data-pipeline",
      title: "ETL data pipeline",
      description: "Airflow DAGs for analytics",
      status: "todo",
      priority: "P2",
      importance: 6,
      effortSize: "large",
      category: categories[3],
      milestone: milestones[1],
      tags: [tags[1]],
      blockedBy: ["task-data-schema"],
      blocks: ["task-ui-dashboard"],
    },
  },
];

// ============================================================================
// MILESTONE NODES
// ============================================================================

const milestoneNodes: MilestoneNode[] = [
  {
    id: "ms-alpha",
    type: "milestone",
    position: { x: 950, y: 100 },
    data: {
      id: "ms-alpha",
      name: "Alpha Release",
      completionPercentage: 0.75,
      status: "active",
      taskCount: 8,
    },
  },
  {
    id: "ms-beta",
    type: "milestone",
    position: { x: 950, y: 300 },
    data: {
      id: "ms-beta",
      name: "Beta Release",
      completionPercentage: 0.30,
      status: "active",
      taskCount: 6,
    },
  },
];

// ============================================================================
// CATEGORY NODES
// ============================================================================

const categoryNodes: CategoryNode[] = [
  {
    id: "cat-backend",
    type: "category",
    position: { x: -150, y: 100 },
    data: { id: "cat-backend", name: "Backend", color: "#3b82f6", taskCount: 4 },
  },
  {
    id: "cat-frontend",
    type: "category",
    position: { x: -150, y: 350 },
    data: { id: "cat-frontend", name: "Frontend", color: "#22c55e", taskCount: 4 },
  },
  {
    id: "cat-infra",
    type: "category",
    position: { x: -150, y: 500 },
    data: { id: "cat-infra", name: "Infrastructure", color: "#f59e0b", taskCount: 3 },
  },
  {
    id: "cat-data",
    type: "category",
    position: { x: -150, y: 650 },
    data: { id: "cat-data", name: "Data", color: "#a855f7", taskCount: 2 },
  },
];

// ============================================================================
// PHEROMONE TRAIL EDGES (proven paths)
// ============================================================================

const trailEdges: TaskTrailEdge[] = [
  // Backend flow
  {
    id: "trail-auth-users",
    type: "taskTrail",
    source: "task-api-auth",
    target: "task-api-users",
    data: { trail: 85, alarm: 5, status: "proven", completions: 12, failures: 1 },
  },
  {
    id: "trail-auth-roles",
    type: "taskTrail",
    source: "task-api-auth",
    target: "task-api-roles",
    data: { trail: 75, alarm: 8, status: "proven", completions: 10, failures: 2 },
  },
  {
    id: "trail-roles-admin",
    type: "taskTrail",
    source: "task-api-roles",
    target: "task-api-admin",
    data: { trail: 25, alarm: 45, status: "fresh", completions: 3, failures: 5 },
  },

  // Frontend flow
  {
    id: "trail-design-components",
    type: "taskTrail",
    source: "task-ui-design",
    target: "task-ui-components",
    data: { trail: 92, alarm: 2, status: "proven", completions: 18, failures: 1 },
  },
  {
    id: "trail-components-users",
    type: "taskTrail",
    source: "task-ui-components",
    target: "task-ui-users",
    data: { trail: 60, alarm: 10, status: "fresh", completions: 6, failures: 2 },
  },
  {
    id: "trail-components-dashboard",
    type: "taskTrail",
    source: "task-ui-components",
    target: "task-ui-dashboard",
    data: { trail: 45, alarm: 5, status: "fresh", completions: 4, failures: 1 },
  },

  // Cross-domain (API → UI)
  {
    id: "trail-users-api-ui",
    type: "taskTrail",
    source: "task-api-users",
    target: "task-ui-users",
    data: { trail: 70, alarm: 15, status: "proven", completions: 8, failures: 3 },
  },

  // Infrastructure flow
  {
    id: "trail-k8s-ci",
    type: "taskTrail",
    source: "task-infra-k8s",
    target: "task-infra-ci",
    data: { trail: 88, alarm: 3, status: "proven", completions: 15, failures: 1 },
  },
  {
    id: "trail-k8s-monitoring",
    type: "taskTrail",
    source: "task-infra-k8s",
    target: "task-infra-monitoring",
    data: { trail: 55, alarm: 8, status: "fresh", completions: 5, failures: 2 },
  },

  // Data flow
  {
    id: "trail-schema-pipeline",
    type: "taskTrail",
    source: "task-data-schema",
    target: "task-data-pipeline",
    data: { trail: 72, alarm: 12, status: "proven", completions: 9, failures: 3 },
  },
  {
    id: "trail-schema-auth",
    type: "taskTrail",
    source: "task-data-schema",
    target: "task-api-auth",
    data: { trail: 95, alarm: 0, status: "proven", completions: 20, failures: 0 },
  },
  {
    id: "trail-pipeline-dashboard",
    type: "taskTrail",
    source: "task-data-pipeline",
    target: "task-ui-dashboard",
    data: { trail: 8, alarm: 0, status: "fading", completions: 1, failures: 0 },
  },
];

// ============================================================================
// DEPENDENCY EDGES (blockers)
// ============================================================================

const dependencyEdges: Edge[] = [
  // Backend dependencies
  { id: "dep-auth-users", source: "task-api-auth", target: "task-api-users", type: "dependency", data: { blockerStatus: "complete", isBlocking: false } },
  { id: "dep-auth-roles", source: "task-api-auth", target: "task-api-roles", type: "dependency", data: { blockerStatus: "complete", isBlocking: false } },
  { id: "dep-roles-admin", source: "task-api-roles", target: "task-api-admin", type: "dependency", data: { blockerStatus: "todo", isBlocking: true } },

  // Frontend dependencies
  { id: "dep-design-components", source: "task-ui-design", target: "task-ui-components", type: "dependency", data: { blockerStatus: "complete", isBlocking: false } },
  { id: "dep-components-users", source: "task-ui-components", target: "task-ui-users", type: "dependency", data: { blockerStatus: "complete", isBlocking: false } },
  { id: "dep-components-dashboard", source: "task-ui-components", target: "task-ui-dashboard", type: "dependency", data: { blockerStatus: "complete", isBlocking: false } },
  { id: "dep-api-ui-users", source: "task-api-users", target: "task-ui-users", type: "dependency", data: { blockerStatus: "in_progress", isBlocking: true } },

  // Infrastructure dependencies
  { id: "dep-k8s-ci", source: "task-infra-k8s", target: "task-infra-ci", type: "dependency", data: { blockerStatus: "complete", isBlocking: false } },
  { id: "dep-k8s-monitoring", source: "task-infra-k8s", target: "task-infra-monitoring", type: "dependency", data: { blockerStatus: "complete", isBlocking: false } },

  // Data dependencies
  { id: "dep-schema-pipeline", source: "task-data-schema", target: "task-data-pipeline", type: "dependency", data: { blockerStatus: "complete", isBlocking: false } },
  { id: "dep-pipeline-dashboard", source: "task-data-pipeline", target: "task-ui-dashboard", type: "dependency", data: { blockerStatus: "todo", isBlocking: true } },
];

// ============================================================================
// COMBINED FLOW DATA
// ============================================================================

export const mockTaskFlow: TaskFlowJSON = {
  nodes: [...taskNodes],
  edges: [...trailEdges, ...dependencyEdges],
};

export const mockTaskFlowWithMeta: TaskFlowJSON = {
  nodes: [...categoryNodes, ...taskNodes, ...milestoneNodes],
  edges: [...trailEdges, ...dependencyEdges],
};

// ============================================================================
// QUERY FUNCTIONS (simulate TypeQL)
// ============================================================================

export const taskQueries = {
  // All tasks
  all_tasks: (): TaskFlowJSON => ({
    nodes: taskNodes,
    edges: trailEdges,
  }),

  // Tasks by status
  tasks_by_status: (status: string): TaskFlowJSON => ({
    nodes: taskNodes.filter(n => n.data.status === status),
    edges: [],
  }),

  // Ready tasks (todo + no incomplete blockers)
  ready_tasks: (): TaskFlowJSON => {
    const ready = taskNodes.filter(n => {
      if (n.data.status !== "todo") return false;
      const blockers = n.data.blockedBy || [];
      return blockers.every(blockerId => {
        const blocker = taskNodes.find(t => t.id === blockerId);
        return blocker?.data.status === "complete";
      });
    });
    return { nodes: ready, edges: [] };
  },

  // Attractive tasks (ready + strong trail)
  attractive_tasks: (): TaskFlowJSON => ({
    nodes: taskNodes.filter(n => n.data.attractive),
    edges: trailEdges.filter(e => e.data?.status === "proven"),
  }),

  // Repelled tasks (high alarm pheromone)
  repelled_tasks: (): TaskFlowJSON => ({
    nodes: taskNodes.filter(n => n.data.repelled),
    edges: trailEdges.filter(e => (e.data?.alarm || 0) > (e.data?.trail || 0)),
  }),

  // Exploratory tasks (ready + no trail)
  exploratory_tasks: (): TaskFlowJSON => {
    const readyIds = new Set(taskQueries.ready_tasks().nodes.map(n => n.id));
    const trailTargets = new Set(trailEdges.map(e => e.target));
    const exploratory = taskNodes.filter(n =>
      readyIds.has(n.id) && !trailTargets.has(n.id)
    );
    return { nodes: exploratory, edges: [] };
  },

  // Urgent tasks (P0 or P1, not complete)
  urgent_tasks: (): TaskFlowJSON => ({
    nodes: taskNodes.filter(n =>
      (n.data.priority === "P0" || n.data.priority === "P1") &&
      n.data.status !== "complete"
    ),
    edges: [],
  }),

  // Blocked tasks
  blocked_tasks: (): TaskFlowJSON => ({
    nodes: taskNodes.filter(n => n.data.status === "blocked"),
    edges: dependencyEdges.filter(e => (e.data as { isBlocking?: boolean })?.isBlocking),
  }),

  // Proven trails (superhighways)
  superhighway_trails: (): TaskFlowJSON => ({
    nodes: [],
    edges: trailEdges.filter(e => e.data?.status === "proven"),
  }),

  // Fading trails (need reinforcement)
  fading_trails: (): TaskFlowJSON => ({
    nodes: [],
    edges: trailEdges.filter(e => e.data?.status === "fading"),
  }),

  // Full view with categories and milestones
  full_task_view: (): TaskFlowJSON => mockTaskFlowWithMeta,

  // Tasks only (default)
  task_graph: (): TaskFlowJSON => mockTaskFlow,
};

export type TaskQueryName = keyof typeof taskQueries;
