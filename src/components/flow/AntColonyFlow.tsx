// AntColonyFlow - Ants pass envelopes along pheromone trails
// Each ant is stationed at a task, processes envelopes, passes to next ant

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
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface AntWorker {
  id: string;
  name: string;
  caste: "scout" | "worker" | "forager";
  status: "idle" | "working" | "passing" | "receiving";
  taskId: string;
  currentEnvelope?: Envelope;
}

interface Envelope {
  id: string;
  action: string;
  data: Record<string, unknown>;
  status: "pending" | "processing" | "resolved";
  trail: string[]; // path taken
}

interface TaskStation {
  id: string;
  title: string;
  action: string;
  ant?: AntWorker;
  queue: Envelope[];
  completed: number;
}

interface Trail {
  id: string;
  from: string;
  to: string;
  pheromone: number;
  successCount: number;
}

interface TravelingAnt {
  id: string;
  ant: AntWorker;
  envelope: Envelope;
  fromTask: string;
  toTask: string;
  progress: number;
  speed: number;
}

// ============================================================================
// TASK STATION NODE - Ant stationed here processes envelopes
// ============================================================================

interface TaskStationNodeData {
  id: string;
  title: string;
  action: string;
  ant?: AntWorker;
  queueSize: number;
  completed: number;
  isSource?: boolean;
  isSink?: boolean;
}

function TaskStationNode({ data, selected }: NodeProps<TaskStationNodeData>) {
  const ant = data.ant;

  const casteColors = {
    scout: { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400" },
    worker: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400" },
    forager: { bg: "bg-green-500/20", border: "border-green-500/40", text: "text-green-400" },
  };

  const statusIcons = {
    idle: "💤",
    working: "⚡",
    passing: "📤",
    receiving: "📥",
  };

  const colors = ant ? casteColors[ant.caste] : { bg: "bg-slate-500/20", border: "border-slate-500/40", text: "text-slate-400" };

  return (
    <div
      className={cn(
        "relative bg-[#0f0f14] border-2 rounded-2xl min-w-[200px] overflow-hidden transition-all duration-300",
        selected ? "border-blue-500 shadow-xl shadow-blue-500/20" : "border-[#1e293b]",
        ant?.status === "working" && "ring-2 ring-amber-500/50 animate-pulse",
        ant?.status === "passing" && "ring-2 ring-green-500/50",
        ant?.status === "receiving" && "ring-2 ring-blue-500/50"
      )}
    >
      {/* Source/Sink indicator */}
      {data.isSource && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 text-[10px] text-white font-bold rounded-full">
          START
        </div>
      )}
      {data.isSink && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-500 text-[10px] text-white font-bold rounded-full">
          END
        </div>
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-blue-500 !border-2 !border-[#0f0f14]"
      />

      {/* Task header */}
      <div className="px-4 py-3 border-b border-[#1e293b] bg-[#0a0a0f]">
        <div className="text-white font-medium text-sm">{data.title}</div>
        <div className="text-slate-500 text-xs font-mono mt-1">
          action: {data.action}()
        </div>
      </div>

      {/* Ant station */}
      <div className={cn("p-4", colors.bg)}>
        {ant ? (
          <div className="flex items-center gap-3">
            {/* Ant avatar */}
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
              colors.border, "border-2 bg-[#0f0f14]",
              ant.status === "working" && "animate-bounce"
            )}>
              🐜
            </div>

            {/* Ant info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("font-medium", colors.text)}>{ant.name}</span>
                <span className="text-lg">{statusIcons[ant.status]}</span>
              </div>
              <div className="text-xs text-slate-500 capitalize">{ant.caste}</div>

              {/* Current envelope */}
              {ant.currentEnvelope && (
                <div className="mt-2 px-2 py-1 bg-[#0f0f14] rounded border border-amber-500/30">
                  <div className="text-[10px] text-amber-400 font-mono">
                    📦 {ant.currentEnvelope.action}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-12 text-slate-600 text-sm">
            No ant assigned
          </div>
        )}
      </div>

      {/* Queue & stats */}
      <div className="px-4 py-2 flex items-center justify-between text-xs border-t border-[#1e293b]">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Queue:</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded font-mono",
            data.queueSize > 0 ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/10 text-slate-500"
          )}>
            {data.queueSize}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Done:</span>
          <span className="text-green-400 font-mono">{data.completed}</span>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-green-500 !border-2 !border-[#0f0f14]"
      />
    </div>
  );
}

// ============================================================================
// PHEROMONE TRAIL EDGE
// ============================================================================

interface TrailEdgeData {
  pheromone: number;
  successCount: number;
  isActive?: boolean;
}

function TrailEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  data?: TrailEdgeData;
  selected?: boolean;
}) {
  const pheromone = data?.pheromone ?? 50;
  const isActive = data?.isActive;

  // Bezier path
  const midX = (sourceX + targetX) / 2;
  const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

  // Visual properties based on pheromone strength
  const strokeWidth = Math.max(2, Math.min(8, pheromone / 12));
  const opacity = Math.max(0.3, Math.min(1, pheromone / 80));
  const color = pheromone >= 70 ? "#22c55e" : pheromone >= 30 ? "#60a5fa" : "#fbbf24";

  return (
    <g>
      {/* Glow for strong trails */}
      {pheromone >= 70 && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 8}
          opacity={0.15}
          filter="url(#trail-glow)"
        />
      )}

      {/* Active indicator */}
      {isActive && (
        <path
          d={path}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={strokeWidth + 4}
          opacity={0.4}
          className="animate-pulse"
        />
      )}

      {/* Main trail */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={opacity}
        strokeLinecap="round"
      />

      {/* Pheromone label */}
      <g transform={`translate(${midX}, ${(sourceY + targetY) / 2 - 15})`}>
        <rect
          x="-20"
          y="-10"
          width="40"
          height="20"
          rx="10"
          fill="rgba(15, 15, 20, 0.9)"
          stroke={color}
          strokeWidth="1"
          opacity="0.8"
        />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="10"
          fontFamily="monospace"
        >
          {Math.round(pheromone)}
        </text>
      </g>
    </g>
  );
}

// ============================================================================
// TRAVELING ANT OVERLAY - Ants walk along edges!
// ============================================================================

function TravelingAnts({
  travelers,
  nodes,
  tick,
}: {
  travelers: TravelingAnt[];
  nodes: Node[];
  tick: number;
}) {
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
        <filter id="trail-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {travelers.map((traveler) => {
        const fromNode = nodes.find((n) => n.id === traveler.fromTask);
        const toNode = nodes.find((n) => n.id === traveler.toTask);
        if (!fromNode || !toNode) return null;

        // Edge endpoints
        const sx = (fromNode.position?.x || 0) + 200;
        const sy = (fromNode.position?.y || 0) + 70;
        const tx = toNode.position?.x || 0;
        const ty = (toNode.position?.y || 0) + 70;

        const t = traveler.progress;

        // Control points for smooth bezier
        const cx1 = sx + (tx - sx) * 0.4;
        const cy1 = sy;
        const cx2 = sx + (tx - sx) * 0.6;
        const cy2 = ty;

        // Cubic bezier position
        const x = Math.pow(1-t,3)*sx + 3*Math.pow(1-t,2)*t*cx1 + 3*(1-t)*t*t*cx2 + t*t*t*tx;
        const y = Math.pow(1-t,3)*sy + 3*Math.pow(1-t,2)*t*cy1 + 3*(1-t)*t*t*cy2 + t*t*t*ty;

        // Calculate tangent for rotation (derivative of bezier)
        const dx = 3*Math.pow(1-t,2)*(cx1-sx) + 6*(1-t)*t*(cx2-cx1) + 3*t*t*(tx-cx2);
        const dy = 3*Math.pow(1-t,2)*(cy1-sy) + 6*(1-t)*t*(cy2-cy1) + 3*t*t*(ty-cy2);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        // Walking bobbing motion
        const walkCycle = Math.sin(tick * 0.5 + traveler.progress * 20) * 2;
        const legCycle = Math.sin(tick * 0.8 + traveler.progress * 30);

        const casteColors: Record<string, { body: string; head: string; legs: string }> = {
          scout: { body: "#f59e0b", head: "#fbbf24", legs: "#92400e" },
          worker: { body: "#3b82f6", head: "#60a5fa", legs: "#1e40af" },
          forager: { body: "#22c55e", head: "#4ade80", legs: "#166534" },
        };

        const colors = casteColors[traveler.ant.caste];

        return (
          <g key={traveler.id} transform={`translate(${x}, ${y + walkCycle})`}>
            {/* Pheromone trail droppings */}
            {[0.05, 0.1, 0.15, 0.2, 0.25].map((offset, i) => {
              const pt = Math.max(0, t - offset);
              const px = Math.pow(1-pt,3)*sx + 3*Math.pow(1-pt,2)*pt*cx1 + 3*(1-pt)*pt*pt*cx2 + pt*pt*pt*tx;
              const py = Math.pow(1-pt,3)*sy + 3*Math.pow(1-pt,2)*pt*cy1 + 3*(1-pt)*pt*pt*cy2 + pt*pt*pt*ty;
              return (
                <circle
                  key={i}
                  cx={px - x}
                  cy={py - y - walkCycle}
                  r={3 - i * 0.5}
                  fill={colors.body}
                  opacity={0.4 - i * 0.07}
                />
              );
            })}

            {/* Ant body group - rotated to follow path */}
            <g transform={`rotate(${angle})`}>
              {/* Glow */}
              <ellipse
                cx={0}
                cy={0}
                rx={14}
                ry={8}
                fill={colors.body}
                opacity={0.3}
                filter="url(#ant-glow)"
              />

              {/* Back legs */}
              <g opacity={0.9}>
                <line x1={-6} y1={0} x2={-12} y2={6 + legCycle * 2} stroke={colors.legs} strokeWidth={1.5} strokeLinecap="round" />
                <line x1={-6} y1={0} x2={-12} y2={-6 - legCycle * 2} stroke={colors.legs} strokeWidth={1.5} strokeLinecap="round" />
                <line x1={-2} y1={0} x2={-6} y2={8 - legCycle * 2} stroke={colors.legs} strokeWidth={1.5} strokeLinecap="round" />
                <line x1={-2} y1={0} x2={-6} y2={-8 + legCycle * 2} stroke={colors.legs} strokeWidth={1.5} strokeLinecap="round" />
                <line x1={3} y1={0} x2={0} y2={7 + legCycle * 2} stroke={colors.legs} strokeWidth={1.5} strokeLinecap="round" />
                <line x1={3} y1={0} x2={0} y2={-7 - legCycle * 2} stroke={colors.legs} strokeWidth={1.5} strokeLinecap="round" />
              </g>

              {/* Abdomen (back) */}
              <ellipse
                cx={-8}
                cy={0}
                rx={6}
                ry={5}
                fill={colors.body}
              />

              {/* Thorax (middle) */}
              <ellipse
                cx={0}
                cy={0}
                rx={5}
                ry={4}
                fill={colors.body}
              />

              {/* Head */}
              <ellipse
                cx={8}
                cy={0}
                rx={4}
                ry={3.5}
                fill={colors.head}
              />

              {/* Antennae */}
              <line x1={10} y1={-2} x2={15} y2={-5 + legCycle} stroke={colors.head} strokeWidth={1} strokeLinecap="round" />
              <line x1={10} y1={2} x2={15} y2={5 - legCycle} stroke={colors.head} strokeWidth={1} strokeLinecap="round" />

              {/* Eyes */}
              <circle cx={9} cy={-1.5} r={1} fill="#0f0f14" />
              <circle cx={9} cy={1.5} r={1} fill="#0f0f14" />

              {/* Mandibles */}
              <line x1={11} y1={-1} x2={13} y2={-2 + legCycle * 0.5} stroke={colors.legs} strokeWidth={1.5} strokeLinecap="round" />
              <line x1={11} y1={1} x2={13} y2={2 - legCycle * 0.5} stroke={colors.legs} strokeWidth={1.5} strokeLinecap="round" />
            </g>

            {/* Envelope being carried (on top of ant) */}
            <g transform={`rotate(${angle})`}>
              <g transform="translate(0, -12)">
                <rect
                  x="-10"
                  y="-6"
                  width="20"
                  height="12"
                  rx="2"
                  fill="#1a1a2e"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />
                <text
                  x={0}
                  y={1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fbbf24"
                  fontSize="8"
                  fontWeight="bold"
                >
                  ENV
                </text>
              </g>
            </g>

            {/* Ant name label */}
            <text
              x={0}
              y={22}
              textAnchor="middle"
              fill={colors.body}
              fontSize="9"
              fontWeight="500"
              opacity={0.9}
            >
              {traveler.ant.name.split(' ')[1]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// ENVELOPE LOG PANEL
// ============================================================================

function EnvelopeLog({ envelopes }: { envelopes: Envelope[] }) {
  return (
    <div className="max-h-[200px] overflow-y-auto space-y-1">
      {envelopes.slice(-10).reverse().map((env) => (
        <div
          key={env.id}
          className={cn(
            "px-2 py-1 rounded text-[10px] font-mono flex items-center gap-2",
            env.status === "resolved" && "bg-green-500/10 text-green-400",
            env.status === "processing" && "bg-amber-500/10 text-amber-400",
            env.status === "pending" && "bg-slate-500/10 text-slate-400"
          )}
        >
          <span>{env.status === "resolved" ? "✓" : env.status === "processing" ? "⚡" : "○"}</span>
          <span className="truncate">{env.action}</span>
          <span className="text-slate-600 ml-auto">{env.trail.join(" → ")}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const nodeTypes = { taskStation: TaskStationNode };

const NODE_WIDTH = 200;
const NODE_HEIGHT = 140;

// Initial task stations with ants
const initialStations: TaskStation[] = [
  { id: "input", title: "Data Input", action: "receiveData", completed: 0, queue: [], ant: { id: "ant-1", name: "Scout Alpha", caste: "scout", status: "idle", taskId: "input" } },
  { id: "validate", title: "Validate", action: "validateInput", completed: 0, queue: [], ant: { id: "ant-2", name: "Worker Beta", caste: "worker", status: "idle", taskId: "validate" } },
  { id: "transform", title: "Transform", action: "transformData", completed: 0, queue: [], ant: { id: "ant-3", name: "Worker Gamma", caste: "worker", status: "idle", taskId: "transform" } },
  { id: "enrich", title: "Enrich", action: "enrichData", completed: 0, queue: [], ant: { id: "ant-4", name: "Forager Delta", caste: "forager", status: "idle", taskId: "enrich" } },
  { id: "route", title: "Route", action: "routeEnvelope", completed: 0, queue: [], ant: { id: "ant-5", name: "Scout Epsilon", caste: "scout", status: "idle", taskId: "route" } },
  { id: "output", title: "Output", action: "emitResult", completed: 0, queue: [], ant: { id: "ant-6", name: "Forager Zeta", caste: "forager", status: "idle", taskId: "output" } },
];

const initialTrails: Trail[] = [
  { id: "t1", from: "input", to: "validate", pheromone: 85, successCount: 24 },
  { id: "t2", from: "validate", to: "transform", pheromone: 78, successCount: 20 },
  { id: "t3", from: "validate", to: "route", pheromone: 35, successCount: 8 }, // alternate path
  { id: "t4", from: "transform", to: "enrich", pheromone: 72, successCount: 18 },
  { id: "t5", from: "enrich", to: "route", pheromone: 68, successCount: 16 },
  { id: "t6", from: "route", to: "output", pheromone: 90, successCount: 28 },
  { id: "t7", from: "transform", to: "output", pheromone: 25, successCount: 5 }, // shortcut
];

function createNodes(stations: TaskStation[]): Node[] {
  // Layout using dagre
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 100, ranksep: 180 });
  g.setDefaultEdgeLabel(() => ({}));

  stations.forEach((s) => g.setNode(s.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  initialTrails.forEach((t) => g.setEdge(t.from, t.to));

  dagre.layout(g);

  return stations.map((station) => {
    const pos = g.node(station.id);
    return {
      id: station.id,
      type: "taskStation",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        id: station.id,
        title: station.title,
        action: station.action,
        ant: station.ant,
        queueSize: station.queue.length,
        completed: station.completed,
        isSource: station.id === "input",
        isSink: station.id === "output",
      },
    };
  });
}

function createEdges(trails: Trail[], activeTrailId?: string): Edge[] {
  return trails.map((trail) => ({
    id: trail.id,
    source: trail.from,
    target: trail.to,
    type: "trail",
    data: {
      pheromone: trail.pheromone,
      successCount: trail.successCount,
      isActive: trail.id === activeTrailId,
    },
  }));
}

function AntColonyFlowInner() {
  const { fitView } = useReactFlow();

  const [stations, setStations] = useState<TaskStation[]>(initialStations);
  const [trails, setTrails] = useState<Trail[]>(initialTrails);
  const [travelers, setTravelers] = useState<TravelingAnt[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [animTick, setAnimTick] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [activeTrail, setActiveTrail] = useState<string>();

  const envelopeCounter = useRef(0);

  // Create nodes and edges
  const nodes = useMemo(() => createNodes(stations), [stations]);
  const edges = useMemo(() => createEdges(trails, activeTrail), [trails, activeTrail]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Update flow when data changes
  useEffect(() => {
    setFlowNodes(createNodes(stations));
  }, [stations, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(createEdges(trails, activeTrail));
  }, [trails, activeTrail, setFlowEdges]);

  // Fit view on mount
  useEffect(() => {
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [fitView]);

  // Spawn new envelope at input
  const spawnEnvelope = useCallback(() => {
    envelopeCounter.current++;
    const envelope: Envelope = {
      id: `env-${envelopeCounter.current}`,
      action: "processData",
      data: { value: Math.random() * 100 },
      status: "pending",
      trail: ["input"],
    };

    setStations((prev) =>
      prev.map((s) =>
        s.id === "input" ? { ...s, queue: [...s.queue, envelope] } : s
      )
    );
    setEnvelopes((prev) => [...prev, envelope]);
  }, []);

  // Process queue at a station
  const processStation = useCallback((stationId: string) => {
    setStations((prev) => {
      const station = prev.find((s) => s.id === stationId);
      if (!station || !station.ant || station.queue.length === 0) return prev;
      if (station.ant.status !== "idle") return prev;

      // Pick up envelope
      const [envelope, ...rest] = station.queue;

      return prev.map((s) =>
        s.id === stationId
          ? {
              ...s,
              queue: rest,
              ant: { ...s.ant!, status: "working" as const, currentEnvelope: envelope },
            }
          : s
      );
    });
  }, []);

  // Complete work and start passing
  const completeWork = useCallback((stationId: string) => {
    setStations((prev) => {
      const station = prev.find((s) => s.id === stationId);
      if (!station || !station.ant || station.ant.status !== "working") return prev;
      if (!station.ant.currentEnvelope) return prev;

      const envelope = station.ant.currentEnvelope;

      // Find best trail (highest pheromone)
      const outTrails = trails.filter((t) => t.from === stationId);
      if (outTrails.length === 0) {
        // End of chain - mark complete
        setEnvelopes((envs) =>
          envs.map((e) =>
            e.id === envelope.id ? { ...e, status: "resolved" } : e
          )
        );
        return prev.map((s) =>
          s.id === stationId
            ? {
                ...s,
                completed: s.completed + 1,
                ant: { ...s.ant!, status: "idle" as const, currentEnvelope: undefined },
              }
            : s
        );
      }

      // Pick trail with probability weighted by pheromone
      const totalPheromone = outTrails.reduce((sum, t) => sum + t.pheromone, 0);
      let rand = Math.random() * totalPheromone;
      let selectedTrail = outTrails[0];
      for (const trail of outTrails) {
        rand -= trail.pheromone;
        if (rand <= 0) {
          selectedTrail = trail;
          break;
        }
      }

      setActiveTrail(selectedTrail.id);

      // Create traveling ant
      const traveler: TravelingAnt = {
        id: `travel-${Date.now()}`,
        ant: { ...station.ant, status: "passing" },
        envelope: { ...envelope, trail: [...envelope.trail, selectedTrail.to] },
        fromTask: stationId,
        toTask: selectedTrail.to,
        progress: 0,
        speed: 0.02 * speed,
      };

      setTravelers((prev) => [...prev, traveler]);

      return prev.map((s) =>
        s.id === stationId
          ? {
              ...s,
              completed: s.completed + 1,
              ant: { ...s.ant!, status: "passing" as const, currentEnvelope: undefined },
            }
          : s
      );
    });
  }, [trails, speed]);

  // Animation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Update animation tick for walking motion
      setAnimTick((t) => t + 1);

      // Move travelers
      setTravelers((prev) => {
        const updated = prev.map((t) => ({ ...t, progress: t.progress + t.speed }));

        // Handle arrivals
        const arrived = updated.filter((t) => t.progress >= 1);
        const inTransit = updated.filter((t) => t.progress < 1);

        arrived.forEach((traveler) => {
          // Add envelope to destination queue
          setStations((stations) =>
            stations.map((s) => {
              if (s.id === traveler.toTask) {
                return { ...s, queue: [...s.queue, traveler.envelope] };
              }
              if (s.id === traveler.fromTask) {
                return { ...s, ant: s.ant ? { ...s.ant, status: "idle" as const } : undefined };
              }
              return s;
            })
          );

          // Reinforce trail
          setTrails((trails) =>
            trails.map((t) =>
              t.from === traveler.fromTask && t.to === traveler.toTask
                ? { ...t, pheromone: Math.min(100, t.pheromone + 2), successCount: t.successCount + 1 }
                : t
            )
          );

          setActiveTrail(undefined);
        });

        return inTransit;
      });

      // Process stations
      stations.forEach((station) => {
        if (station.ant?.status === "idle" && station.queue.length > 0) {
          processStation(station.id);
        }
      });

      // Complete work after delay
      stations.forEach((station) => {
        if (station.ant?.status === "working" && Math.random() < 0.15 * speed) {
          completeWork(station.id);
        }
      });

      // Spawn new envelopes
      if (Math.random() < 0.08 * speed) {
        spawnEnvelope();
      }

      // Decay trails
      setTrails((prev) =>
        prev.map((t) => ({ ...t, pheromone: Math.max(10, t.pheromone * 0.998) }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, speed, stations, processStation, completeWork, spawnEnvelope]);

  // Stats
  const stats = useMemo(() => ({
    totalCompleted: stations.reduce((sum, s) => sum + s.completed, 0),
    inQueue: stations.reduce((sum, s) => sum + s.queue.length, 0),
    inTransit: travelers.length,
    resolved: envelopes.filter((e) => e.status === "resolved").length,
  }), [stations, travelers, envelopes]);

  return (
    <div className="h-full w-full bg-[#0a0a0f] relative">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={{ trail: TrailEdge as any }}
        fitView
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="#1e293b" gap={40} size={1} />
        <Controls className="!bg-[#0f0f14] !border-[#1e293b] [&>button]:!bg-[#0f0f14] [&>button]:!border-[#1e293b] [&>button]:!fill-slate-400" />

        {/* Traveling ants */}
        <TravelingAnts travelers={travelers} nodes={flowNodes} tick={animTick} />

        {/* Stats */}
        <Panel position="top-left">
          <div className="p-4 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl min-w-[200px]">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="text-xl">🐜</span>
              Colony Stats
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Envelopes processed</span>
                <span className="text-sm text-green-400 font-mono">{stats.totalCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">In queue</span>
                <span className="text-sm text-amber-400 font-mono">{stats.inQueue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">In transit</span>
                <span className="text-sm text-blue-400 font-mono">{stats.inTransit}</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Controls */}
        <Panel position="top-right">
          <div className="space-y-3">
            <div className="p-4 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                Simulation
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    isRunning
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                  )}
                >
                  {isRunning ? "⏸ Pause" : "▶ Start"}
                </button>
                <button
                  onClick={spawnEnvelope}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30"
                >
                  + Envelope
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
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
                  className="w-full"
                />
              </div>
            </div>

            {/* Envelope log */}
            <div className="p-4 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl max-w-[280px]">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Envelope Log
              </div>
              <EnvelopeLog envelopes={envelopes} />
            </div>
          </div>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-right">
          <div className="p-3 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              The Ant Relay Pattern
            </div>
            <div className="text-[10px] text-slate-400 space-y-1">
              <div>1. Envelope arrives at station</div>
              <div>2. Ant processes envelope ⚡</div>
              <div>3. Ant picks strongest trail 🐜→</div>
              <div>4. Ant carries envelope to next station</div>
              <div>5. Handoff to next ant, trail reinforced</div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function AntColonyFlow() {
  return (
    <ReactFlowProvider>
      <AntColonyFlowInner />
    </ReactFlowProvider>
  );
}

export default AntColonyFlow;
