// TaskFlowCanvas - Beautiful animated task flow with ants
// Auto-layout, animated ants following trails, swarm formation

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";

import { RichTaskNode } from "./nodes/RichTaskNode";
import { TaskTrailEdge } from "./edges/TaskTrailEdge";
import { DependencyEdge } from "./edges/DependencyEdge";
import { taskQueries, type TaskQueryName } from "@/engine/colony/taskMockData";
import type { TaskFlowNode } from "@/engine/colony/taskTypes";
import { STATUS_STYLES } from "@/engine/colony/taskTypes";
import { cn } from "@/lib/utils";

// ============================================================================
// DAGRE AUTO-LAYOUT
// ============================================================================

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const NODE_WIDTH = 250;
const NODE_HEIGHT = 180;

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "LR"
): { nodes: Node[]; edges: Edge[] } {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Only use dependency edges for layout (not trail edges)
  edges
    .filter((e) => e.type === "dependency")
    .forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ============================================================================
// ANT PARTICLE COMPONENT
// ============================================================================

interface Ant {
  id: string;
  edgeId: string;
  progress: number; // 0-1
  speed: number;
  color: string;
  size: number;
  carrying: boolean;
}

interface AntParticlesProps {
  edges: Edge[];
  ants: Ant[];
}

function AntParticles({ edges, ants }: AntParticlesProps) {
  const { getNodes } = useReactFlow();
  const nodes = getNodes();

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 1000 }}>
      <defs>
        <filter id="ant-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="ant-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {ants.map((ant) => {
        const edge = edges.find((e) => e.id === ant.edgeId);
        if (!edge) return null;

        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (!sourceNode || !targetNode) return null;

        // Calculate position along edge
        const sx = (sourceNode.position?.x || 0) + NODE_WIDTH;
        const sy = (sourceNode.position?.y || 0) + NODE_HEIGHT / 2;
        const tx = targetNode.position?.x || 0;
        const ty = (targetNode.position?.y || 0) + NODE_HEIGHT / 2;

        // Bezier curve interpolation
        const t = ant.progress;
        const cx1 = sx + (tx - sx) * 0.5;
        const cy1 = sy;
        const cx2 = sx + (tx - sx) * 0.5;
        const cy2 = ty;

        const x =
          Math.pow(1 - t, 3) * sx +
          3 * Math.pow(1 - t, 2) * t * cx1 +
          3 * (1 - t) * Math.pow(t, 2) * cx2 +
          Math.pow(t, 3) * tx;
        const y =
          Math.pow(1 - t, 3) * sy +
          3 * Math.pow(1 - t, 2) * t * cy1 +
          3 * (1 - t) * Math.pow(t, 2) * cy2 +
          Math.pow(t, 3) * ty;

        return (
          <g key={ant.id}>
            {/* Ant body */}
            <circle
              cx={x}
              cy={y}
              r={ant.size}
              fill={ant.color}
              filter="url(#ant-glow)"
            />
            {/* Ant head */}
            <circle
              cx={x + (ant.size * 0.8 * (tx > sx ? 1 : -1))}
              cy={y}
              r={ant.size * 0.5}
              fill={ant.color}
            />
            {/* Carrying indicator */}
            {ant.carrying && (
              <circle
                cx={x}
                cy={y - ant.size * 1.2}
                r={ant.size * 0.4}
                fill="#22c55e"
                className="animate-pulse"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// SWARM INDICATOR
// ============================================================================

interface Swarm {
  id: string;
  taskId: string;
  antCount: number;
  status: "forming" | "active" | "dispersing";
}

function SwarmOverlay({ swarms, nodes }: { swarms: Swarm[]; nodes: Node[] }) {
  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 999 }}>
      <defs>
        <radialGradient id="swarm-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#a855f7" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {swarms.map((swarm) => {
        const node = nodes.find((n) => n.id === swarm.taskId);
        if (!node) return null;

        const cx = (node.position?.x || 0) + NODE_WIDTH / 2;
        const cy = (node.position?.y || 0) + NODE_HEIGHT / 2;
        const radius = 60 + swarm.antCount * 10;

        return (
          <g key={swarm.id}>
            {/* Swarm aura */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="url(#swarm-gradient)"
              className={cn(
                swarm.status === "forming" && "animate-pulse",
                swarm.status === "active" && "animate-ping"
              )}
              style={{ animationDuration: "2s" }}
            />
            {/* Swarm ring */}
            <circle
              cx={cx}
              cy={cy}
              r={radius - 10}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity="0.5"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${cx} ${cy}`}
                to={`360 ${cx} ${cy}`}
                dur="10s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Ant count */}
            <text
              x={cx}
              y={cy - radius - 10}
              textAnchor="middle"
              fill="#a855f7"
              fontSize="12"
              fontWeight="bold"
            >
              {swarm.antCount} ants
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const nodeTypes = { richTask: RichTaskNode };
const edgeTypes = { taskTrail: TaskTrailEdge, dependency: DependencyEdge };

function getNodeColor(node: TaskFlowNode): string {
  if (node.type === "richTask") {
    const status = (node.data as { status?: string })?.status ?? "todo";
    return STATUS_STYLES[status as keyof typeof STATUS_STYLES]?.color || "#64748b";
  }
  return "#64748b";
}

function TaskFlowCanvasInner() {
  const { fitView, getNodes } = useReactFlow();

  // Get initial laid out data
  const initialData = useMemo(() => {
    const data = taskQueries.task_graph();
    return getLayoutedElements(data.nodes, data.edges, "LR");
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);
  const [isSimulating, setIsSimulating] = useState(false);
  const [ants, setAnts] = useState<Ant[]>([]);
  const [swarms, setSwarms] = useState<Swarm[]>([]);
  const [tick, setTick] = useState(0);
  const [speed, setSpeed] = useState(1);

  // Animation frame ref
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Spawn new ant
  const spawnAnt = useCallback(() => {
    const trailEdges = edges.filter((e) => e.type === "taskTrail" && e.data);
    if (trailEdges.length === 0) return;

    // Prefer proven trails (higher probability)
    const provenEdges = trailEdges.filter((e) => (e.data as any)?.status === "proven");
    const edgePool = provenEdges.length > 0 && Math.random() > 0.3 ? provenEdges : trailEdges;
    const edge = edgePool[Math.floor(Math.random() * edgePool.length)];

    const newAnt: Ant = {
      id: `ant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      edgeId: edge.id,
      progress: 0,
      speed: 0.005 + Math.random() * 0.01,
      color: Math.random() > 0.7 ? "#f59e0b" : "#fbbf24",
      size: 4 + Math.random() * 3,
      carrying: Math.random() > 0.5,
    };

    setAnts((prev) => [...prev, newAnt]);
  }, [edges]);

  // Update swarms based on ant activity
  const updateSwarms = useCallback(() => {
    // Group ants by their target task
    const antsByTask: Record<string, number> = {};
    ants.forEach((ant) => {
      const edge = edges.find((e) => e.id === ant.edgeId);
      if (edge && ant.progress > 0.7) {
        antsByTask[edge.target] = (antsByTask[edge.target] || 0) + 1;
      }
    });

    // Create/update swarms for tasks with 3+ ants
    const newSwarms: Swarm[] = [];
    Object.entries(antsByTask).forEach(([taskId, count]) => {
      if (count >= 3) {
        const existing = swarms.find((s) => s.taskId === taskId);
        newSwarms.push({
          id: existing?.id || `swarm-${taskId}`,
          taskId,
          antCount: count,
          status: count >= 5 ? "active" : "forming",
        });
      }
    });

    setSwarms(newSwarms);
  }, [ants, edges, swarms]);

  // Animation loop
  useEffect(() => {
    if (!isSimulating) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const animate = (time: number) => {
      if (time - lastTimeRef.current > 50 / speed) {
        lastTimeRef.current = time;

        // Move ants
        setAnts((prev) =>
          prev
            .map((ant) => ({
              ...ant,
              progress: ant.progress + ant.speed * speed,
            }))
            .filter((ant) => ant.progress < 1)
        );

        // Spawn new ants periodically
        if (Math.random() < 0.15 * speed) {
          spawnAnt();
        }

        // Update tick
        setTick((t) => t + 1);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isSimulating, speed, spawnAnt]);

  // Update swarms when ants change
  useEffect(() => {
    if (isSimulating) updateSwarms();
  }, [ants, isSimulating, updateSwarms]);

  // Fit view on mount
  useEffect(() => {
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [fitView]);

  // Re-layout
  const doLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      "LR"
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  // Stats
  const stats = useMemo(() => {
    const tasks = nodes.filter((n) => n.type === "richTask");
    return {
      total: tasks.length,
      complete: tasks.filter((t) => (t.data as any).status === "complete").length,
      inProgress: tasks.filter((t) => (t.data as any).status === "in_progress").length,
      todo: tasks.filter((t) => (t.data as any).status === "todo").length,
      blocked: tasks.filter((t) => (t.data as any).status === "blocked").length,
    };
  }, [nodes]);

  return (
    <div className="h-full w-full bg-[#0a0a0f] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#1e293b" gap={32} size={1} />
        <Controls className="!bg-[#0f0f14] !border-[#1e293b] [&>button]:!bg-[#0f0f14] [&>button]:!border-[#1e293b] [&>button]:!fill-slate-400" />
        <MiniMap
          nodeColor={getNodeColor}
          maskColor="rgba(10, 10, 15, 0.8)"
          className="!bg-[#0f0f14] !border-[#1e293b]"
        />

        {/* Swarm overlays */}
        <SwarmOverlay swarms={swarms} nodes={nodes} />

        {/* Ant particles */}
        <AntParticles edges={edges} ants={ants} />

        {/* Stats Panel */}
        <Panel position="top-left">
          <div className="p-4 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="text-lg">📊</span>
              Task Overview
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-slate-400">Complete</span>
                <span className="text-sm text-white font-bold ml-auto">{stats.complete}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-400">In Progress</span>
                <span className="text-sm text-white font-bold ml-auto">{stats.inProgress}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-500/10">
                <span className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-xs text-slate-400">Todo</span>
                <span className="text-sm text-white font-bold ml-auto">{stats.todo}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-slate-400">Blocked</span>
                <span className="text-sm text-white font-bold ml-auto">{stats.blocked}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#1e293b]">
              <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(stats.complete / stats.total) * 100}%` }}
                />
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1 text-center">
                {Math.round((stats.complete / stats.total) * 100)}% complete
              </div>
            </div>
          </div>
        </Panel>

        {/* Controls */}
        <Panel position="top-right">
          <div className="space-y-3">
            {/* Simulation controls */}
            <div className="p-4 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="text-lg">🐜</span>
                Colony Simulation
              </div>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    isSimulating
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                  )}
                >
                  {isSimulating ? "⏸ Pause" : "▶ Start"}
                </button>
                <button
                  onClick={doLayout}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-500/20 text-slate-400 border border-slate-500/30"
                >
                  ⟳ Layout
                </button>
              </div>

              {/* Speed control */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Speed</span>
                  <span className="text-white">{speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.5"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Live stats */}
              <div className="mt-3 pt-3 border-t border-[#1e293b] grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">🐜</span>
                  <span className="text-slate-400">Active ants:</span>
                  <span className="text-white font-mono">{ants.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">◉</span>
                  <span className="text-slate-400">Swarms:</span>
                  <span className="text-white font-mono">{swarms.length}</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="p-4 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Trail Legend
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-2 rounded bg-green-500 shadow-lg shadow-green-500/30" />
                  <span className="text-[10px] text-slate-400">Proven (superhighway)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1.5 rounded bg-blue-400" />
                  <span className="text-[10px] text-slate-400">Fresh trail</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 rounded border border-dashed border-amber-400" />
                  <span className="text-[10px] text-slate-400">Fading</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow shadow-amber-400/50" />
                  <span className="text-[10px] text-slate-400">Ant (foraging)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-dashed border-purple-400 opacity-50" />
                  <span className="text-[10px] text-slate-400">Swarm forming</span>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function TaskFlowCanvas() {
  return (
    <ReactFlowProvider>
      <TaskFlowCanvasInner />
    </ReactFlowProvider>
  );
}

export default TaskFlowCanvas;
