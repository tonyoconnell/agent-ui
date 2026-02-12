// ColonyCanvas - Main ReactFlow container for ant colony visualization

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

import { AntNode, AgentNode, TaskNode, SwarmNode, EnvelopeNode } from "./nodes";
import { PheromoneEdge, DependencyEdge } from "./edges";
import { mockColonyState, mockQueries, type QueryName } from "@/engine/colony";
import type { ColonyNode, ColonyEdge, FlowJSON, CASTE_STYLES, STATUS_COLORS } from "@/engine/colony/types";

// Node type registry
const nodeTypes = {
  ant: AntNode,
  agent: AgentNode,
  task: TaskNode,
  swarm: SwarmNode,
  envelope: EnvelopeNode,
};

// Edge type registry
const edgeTypes = {
  pheromone: PheromoneEdge,
  dependency: DependencyEdge,
};

// MiniMap node colors
function getNodeColor(node: ColonyNode): string {
  if (node.type === "ant") {
    const caste = (node.data as { caste?: string })?.caste ?? "worker";
    const colors: Record<string, string> = {
      scout: "#f59e0b",
      worker: "#3b82f6",
      soldier: "#ef4444",
      forager: "#22c55e",
      nurse: "#ec4899",
    };
    return colors[caste] || "#64748b";
  }
  if (node.type === "agent") {
    const role = (node.data as { role?: string })?.role ?? "generic";
    const colors: Record<string, string> = {
      processor: "#3b82f6",
      router: "#a855f7",
      validator: "#22c55e",
      generic: "#64748b",
    };
    return colors[role] || "#64748b";
  }
  if (node.type === "envelope") {
    const status = (node.data as { status?: string })?.status ?? "pending";
    const colors: Record<string, string> = {
      pending: "#eab308",
      resolved: "#22c55e",
      rejected: "#ef4444",
    };
    return colors[status] || "#eab308";
  }
  if (node.type === "task") {
    const status = (node.data as { status?: string })?.status ?? "todo";
    const colors: Record<string, string> = {
      todo: "#64748b",
      in_progress: "#3b82f6",
      complete: "#22c55e",
      blocked: "#ef4444",
    };
    return colors[status] || "#64748b";
  }
  if (node.type === "swarm") {
    return "#a855f7";
  }
  return "#64748b";
}

interface ColonyCanvasProps {
  initialQuery?: QueryName;
}

export function ColonyCanvas({ initialQuery = "envelope_system" }: ColonyCanvasProps) {
  // Load initial state from mock queries
  const initialState = useMemo(() => mockQueries[initialQuery](), [initialQuery]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialState.edges);
  const [isSimulating, setIsSimulating] = useState(false);
  const [tick, setTick] = useState(0);
  const [activeQuery, setActiveQuery] = useState<QueryName>(initialQuery);

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // Default new edges to pheromone type with fresh status
      const newEdge = {
        ...connection,
        type: "pheromone",
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

  // Simulation tick - decay pheromones
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);

      // Decay pheromone trails
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.type !== "pheromone" || !edge.data) return edge;

          const data = edge.data as {
            trail: number;
            alarm: number;
            status: string;
            completions: number;
            failures: number;
          };

          // Apply decay rates
          const newTrail = Math.max(0, data.trail * 0.95); // 5% decay
          const newAlarm = Math.max(0, data.alarm * 0.80); // 20% decay

          // Update status based on trail level
          let newStatus = data.status;
          if (newTrail >= 70 && data.completions >= 10) newStatus = "proven";
          else if (newTrail >= 10) newStatus = "fresh";
          else if (newTrail > 0) newStatus = "fading";
          else newStatus = "dead";

          return {
            ...edge,
            data: {
              ...data,
              trail: newTrail,
              alarm: newAlarm,
              status: newStatus,
            },
          };
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, [isSimulating, setEdges]);

  // Query selector
  const runQuery = useCallback((queryName: QueryName) => {
    const result = mockQueries[queryName]();
    setNodes(result.nodes);
    setEdges(result.edges);
    setActiveQuery(queryName);
  }, [setNodes, setEdges]);

  // Reset to initial state
  const reset = useCallback(() => {
    const state = mockQueries.full_colony();
    setNodes(state.nodes);
    setEdges(state.edges);
    setTick(0);
    setActiveQuery("full_colony");
  }, [setNodes, setEdges]);

  return (
    <div className="h-full w-full bg-[#0a0a0f]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-[#0a0a0f]"
      >
        {/* Grid background */}
        <Background color="#1e293b" gap={24} size={1} />

        {/* Controls */}
        <Controls
          className="!bg-[#0f0f14] !border-[#1e293b] !shadow-lg [&>button]:!bg-[#0f0f14] [&>button]:!border-[#1e293b] [&>button]:!fill-slate-400 [&>button:hover]:!bg-[#1a1a24]"
        />

        {/* MiniMap */}
        <MiniMap
          nodeColor={getNodeColor}
          maskColor="rgba(10, 10, 15, 0.8)"
          className="!bg-[#0f0f14] !border-[#1e293b]"
        />

        {/* Simulation Controls Panel */}
        <Panel position="top-right" className="space-y-2">
          {/* Simulation controls */}
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

            <div className="w-px h-6 bg-[#1e293b]" />

            <span className="text-xs text-slate-500 font-mono">
              tick: {tick}
            </span>
          </div>

          {/* Query selector */}
          <div className="p-3 bg-[#0f0f14] border border-[#1e293b] rounded-lg shadow-lg">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              TypeQL Queries
            </div>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(mockQueries) as QueryName[]).map((query) => (
                <button
                  key={query}
                  onClick={() => runQuery(query)}
                  className={`px-2 py-1 text-[10px] font-mono rounded ${
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

        {/* Legend Panel */}
        <Panel position="bottom-right">
          <div className="p-3 bg-[#0f0f14] border border-[#1e293b] rounded-lg shadow-lg">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Trail Status
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 rounded bg-[#22c55e]" />
                <span className="text-[10px] text-slate-400">Proven (&ge;70)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 rounded bg-[#60a5fa]" />
                <span className="text-[10px] text-slate-400">Fresh (10-70)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded bg-[#fbbf24]" style={{ borderBottom: "2px dashed #fbbf24" }} />
                <span className="text-[10px] text-slate-400">Fading (&lt;10)</span>
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

export default ColonyCanvas;
