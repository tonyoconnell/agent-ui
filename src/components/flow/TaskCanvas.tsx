// TaskCanvas - ReactFlow visualization for task-management.tql
// Shows tasks with dependencies, pheromone trails, categories

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type OnConnect,
  addEdge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { RichTaskNode } from "./nodes/RichTaskNode";
import { TaskTrailEdge } from "./edges/TaskTrailEdge";
import { DependencyEdge } from "./edges/DependencyEdge";
import { taskQueries, type TaskQueryName } from "@/engine/colony/taskMockData";
import type { TaskFlowNode } from "@/engine/colony/taskTypes";
import { PRIORITY_STYLES, STATUS_STYLES } from "@/engine/colony/taskTypes";

// Node type registry
const nodeTypes = {
  richTask: RichTaskNode,
};

// Edge type registry
const edgeTypes = {
  taskTrail: TaskTrailEdge,
  dependency: DependencyEdge,
};

// MiniMap colors
function getNodeColor(node: TaskFlowNode): string {
  if (node.type === "richTask") {
    const status = (node.data as { status?: string })?.status ?? "todo";
    return STATUS_STYLES[status as keyof typeof STATUS_STYLES]?.color || "#64748b";
  }
  if (node.type === "milestone") return "#a855f7";
  if (node.type === "category") {
    return (node.data as { color?: string })?.color || "#64748b";
  }
  return "#64748b";
}

interface TaskCanvasProps {
  initialQuery?: TaskQueryName;
}

export function TaskCanvas({ initialQuery = "task_graph" }: TaskCanvasProps) {
  // Load initial state
  const initialState = useMemo(() => taskQueries[initialQuery](), [initialQuery]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialState.edges);
  const [isSimulating, setIsSimulating] = useState(false);
  const [tick, setTick] = useState(0);
  const [activeQuery, setActiveQuery] = useState<TaskQueryName>(initialQuery);
  const [showTrails, setShowTrails] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        type: "taskTrail",
        data: {
          trail: 20,
          alarm: 0,
          status: "fresh" as const,
          completions: 0,
          failures: 0,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Simulation tick - decay trails
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.type !== "taskTrail" || !edge.data) return edge;

          const data = edge.data as {
            trail: number;
            alarm: number;
            status: string;
            completions: number;
            failures: number;
          };

          // Apply decay
          const newTrail = Math.max(0, data.trail * 0.95);
          const newAlarm = Math.max(0, data.alarm * 0.80);

          // Update status
          let newStatus = data.status;
          if (newTrail >= 70 && data.completions >= 10) newStatus = "proven";
          else if (newTrail >= 10) newStatus = "fresh";
          else if (newTrail > 0) newStatus = "fading";
          else newStatus = "dead";

          return {
            ...edge,
            data: { ...data, trail: newTrail, alarm: newAlarm, status: newStatus },
          };
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, [isSimulating, setEdges]);

  // Query selector
  const runQuery = useCallback((queryName: TaskQueryName) => {
    const result = taskQueries[queryName]();
    setNodes(result.nodes);
    setEdges(result.edges);
    setActiveQuery(queryName);
  }, [setNodes, setEdges]);

  // Reset
  const reset = useCallback(() => {
    const state = taskQueries.task_graph();
    setNodes(state.nodes);
    setEdges(state.edges);
    setTick(0);
    setActiveQuery("task_graph");
  }, [setNodes, setEdges]);

  // Filter edges by type
  const filteredEdges = useMemo(() => {
    return edges.filter((edge) => {
      if (edge.type === "taskTrail" && !showTrails) return false;
      if (edge.type === "dependency" && !showDependencies) return false;
      return true;
    });
  }, [edges, showTrails, showDependencies]);

  // Stats
  const stats = useMemo(() => {
    const tasks = nodes.filter((n) => n.type === "richTask");
    const byStatus = {
      todo: tasks.filter((t) => (t.data as { status: string }).status === "todo").length,
      in_progress: tasks.filter((t) => (t.data as { status: string }).status === "in_progress").length,
      complete: tasks.filter((t) => (t.data as { status: string }).status === "complete").length,
      blocked: tasks.filter((t) => (t.data as { status: string }).status === "blocked").length,
    };
    return { total: tasks.length, ...byStatus };
  }, [nodes]);

  return (
    <div className="h-full w-full bg-[#0a0a0f]">
      <ReactFlow
        nodes={nodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-[#0a0a0f]"
      >
        <Background color="#1e293b" gap={24} size={1} />

        <Controls
          className="!bg-[#0f0f14] !border-[#1e293b] !shadow-lg [&>button]:!bg-[#0f0f14] [&>button]:!border-[#1e293b] [&>button]:!fill-slate-400 [&>button:hover]:!bg-[#1a1a24]"
        />

        <MiniMap
          nodeColor={getNodeColor}
          maskColor="rgba(10, 10, 15, 0.8)"
          className="!bg-[#0f0f14] !border-[#1e293b]"
        />

        {/* Stats Panel */}
        <Panel position="top-left">
          <div className="p-3 bg-[#0f0f14] border border-[#1e293b] rounded-lg shadow-lg">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Task Status
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats).filter(([k]) => k !== "total").map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATUS_STYLES[status as keyof typeof STATUS_STYLES]?.color }}
                  />
                  <span className="text-xs text-slate-400 capitalize">
                    {status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-white font-mono ml-auto">{count}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-[#1e293b] flex items-center justify-between">
              <span className="text-xs text-slate-500">Total</span>
              <span className="text-sm text-white font-mono">{stats.total}</span>
            </div>
          </div>
        </Panel>

        {/* Controls Panel */}
        <Panel position="top-right" className="space-y-2">
          {/* Simulation */}
          <div className="flex items-center gap-2 p-3 bg-[#0f0f14] border border-[#1e293b] rounded-lg shadow-lg">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1.5 text-sm font-medium rounded ${
                isSimulating
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-green-500/20 text-green-400 border border-green-500/30"
              }`}
            >
              {isSimulating ? "Pause" : "Run"}
            </button>
            <button
              onClick={reset}
              className="px-3 py-1.5 text-sm font-medium rounded bg-slate-500/20 text-slate-400 border border-slate-500/30"
            >
              Reset
            </button>
            <span className="text-xs text-slate-500 font-mono ml-2">tick: {tick}</span>
          </div>

          {/* Edge filters */}
          <div className="p-3 bg-[#0f0f14] border border-[#1e293b] rounded-lg shadow-lg">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Show Edges
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrails}
                  onChange={(e) => setShowTrails(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600"
                />
                <span className="text-xs text-slate-400">Pheromone Trails</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDependencies}
                  onChange={(e) => setShowDependencies(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600"
                />
                <span className="text-xs text-slate-400">Dependencies</span>
              </label>
            </div>
          </div>

          {/* Query selector */}
          <div className="p-3 bg-[#0f0f14] border border-[#1e293b] rounded-lg shadow-lg max-w-[250px]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              TypeQL Queries
            </div>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(taskQueries) as TaskQueryName[]).map((query) => (
                <button
                  key={query}
                  onClick={() => runQuery(query)}
                  className={`px-2 py-1 text-[9px] font-mono rounded ${
                    activeQuery === query
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20"
                  }`}
                >
                  {query}()
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-right">
          <div className="p-3 bg-[#0f0f14] border border-[#1e293b] rounded-lg shadow-lg">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Trail Status
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1.5 rounded bg-[#22c55e]" />
                <span className="text-[10px] text-slate-400">Proven (superhighway)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 rounded bg-[#60a5fa]" />
                <span className="text-[10px] text-slate-400">Fresh</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded border-b-2 border-dashed border-[#fbbf24]" />
                <span className="text-[10px] text-slate-400">Fading</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 rounded bg-[#ef4444] animate-pulse" />
                <span className="text-[10px] text-slate-400">Alarmed</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default TaskCanvas;
