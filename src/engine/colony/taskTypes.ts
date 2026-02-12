// Task Types - Based on task-management.tql schema
// Rich task model with dependencies, pheromone trails, categories, milestones

import type { Node, Edge } from "@xyflow/react";

// ============================================================================
// TASK ENTITIES
// ============================================================================

export type TaskStatus = "todo" | "in_progress" | "complete" | "blocked";
export type TaskPriority = "P0" | "P1" | "P2" | "P3";
export type EffortSize = "micro" | "small" | "medium" | "large";
export type AssigneeType = "human" | "bot" | "team";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  importance: number; // 1-10
  effortSize: EffortSize;
  estimatedEffort?: number;
  blockedReason?: string;
  attractive?: boolean; // INFERRED: ready + strong trail
  repelled?: boolean;   // INFERRED: high alarm pheromone
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  categoryId?: string;
  milestoneId?: string;
  tags?: string[];
  assigneeId?: string;
  blockedBy?: string[]; // task IDs that block this
  blocks?: string[];    // task IDs this blocks
}

export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  parentCategory?: string;
  color: string;
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  targetDate?: string;
  completionPercentage: number;
  status: "active" | "complete" | "overdue";
}

export interface TaskTag {
  id: string;
  name: string;
  color: string;
}

export interface Assignee {
  id: string;
  name: string;
  type: AssigneeType;
  avatar?: string;
}

// ============================================================================
// PHEROMONE TRAIL (EDGE DATA)
// ============================================================================

export type TrailStatus = "proven" | "fresh" | "fading" | "dead";

export interface TaskTrail {
  id: string;
  sourceTaskId: string;
  destinationTaskId: string;
  trailPheromone: number;  // 0-100
  alarmPheromone: number;  // 0-100
  completions: number;
  failures: number;
  status: TrailStatus;     // INFERRED from rules
}

// ============================================================================
// REACTFLOW NODE DATA
// ============================================================================

export interface RichTaskNodeData {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  importance: number;
  effortSize: EffortSize;
  attractive?: boolean;
  repelled?: boolean;
  blockedBy?: string[];
  blocks?: string[];
  category?: TaskCategory;
  milestone?: Milestone;
  tags?: TaskTag[];
  assignee?: Assignee;
}

export interface MilestoneNodeData {
  id: string;
  name: string;
  completionPercentage: number;
  status: Milestone["status"];
  taskCount: number;
}

export interface CategoryNodeData {
  id: string;
  name: string;
  color: string;
  taskCount: number;
}

export interface AssigneeNodeData {
  id: string;
  name: string;
  type: AssigneeType;
  avatar?: string;
  taskCount: number;
}

export interface TaskTrailEdgeData {
  trail: number;
  alarm: number;
  status: TrailStatus;
  completions: number;
  failures: number;
}

export interface DependencyEdgeData {
  blockerStatus: TaskStatus;
  isBlocking: boolean;
}

// ============================================================================
// FLOW TYPES
// ============================================================================

export type RichTaskNode = Node<RichTaskNodeData, "richTask">;
export type MilestoneNode = Node<MilestoneNodeData, "milestone">;
export type CategoryNode = Node<CategoryNodeData, "category">;
export type AssigneeNode = Node<AssigneeNodeData, "assignee">;

export type TaskFlowNode = RichTaskNode | MilestoneNode | CategoryNode | AssigneeNode;
export type TaskTrailEdge = Edge<TaskTrailEdgeData>;
export type TaskDependencyEdge = Edge<DependencyEdgeData>;
export type TaskFlowEdge = TaskTrailEdge | TaskDependencyEdge | Edge;

export interface TaskFlowJSON {
  nodes: TaskFlowNode[];
  edges: TaskFlowEdge[];
}

// ============================================================================
// STYLING CONSTANTS
// ============================================================================

export const PRIORITY_STYLES: Record<TaskPriority, { color: string; bg: string; label: string }> = {
  P0: { color: "#ef4444", bg: "bg-red-500/20", label: "Critical" },
  P1: { color: "#f59e0b", bg: "bg-amber-500/20", label: "High" },
  P2: { color: "#3b82f6", bg: "bg-blue-500/20", label: "Medium" },
  P3: { color: "#64748b", bg: "bg-slate-500/20", label: "Low" },
};

export const STATUS_STYLES: Record<TaskStatus, { color: string; bg: string; icon: string }> = {
  todo: { color: "#64748b", bg: "bg-slate-500/20", icon: "○" },
  in_progress: { color: "#3b82f6", bg: "bg-blue-500/20", icon: "◐" },
  complete: { color: "#22c55e", bg: "bg-green-500/20", icon: "●" },
  blocked: { color: "#ef4444", bg: "bg-red-500/20", icon: "⊗" },
};

export const EFFORT_STYLES: Record<EffortSize, { color: string; label: string; points: string }> = {
  micro: { color: "#22c55e", label: "XS", points: "1" },
  small: { color: "#3b82f6", label: "S", points: "2" },
  medium: { color: "#f59e0b", label: "M", points: "5" },
  large: { color: "#ef4444", label: "L", points: "8" },
};

export const TRAIL_STATUS_STYLES: Record<TrailStatus, { color: string; glow: boolean; dash?: string }> = {
  proven: { color: "#22c55e", glow: true },
  fresh: { color: "#60a5fa", glow: false },
  fading: { color: "#fbbf24", glow: false, dash: "5,5" },
  dead: { color: "#475569", glow: false },
};
