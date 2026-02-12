// AntStigmergy - Beautiful emergence visualization
// Watch chaos become order as ants form superhighways

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
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

interface Ant {
  id: string;
  name: string;
  caste: "scout" | "worker" | "forager";
  homeTaskId: string;
  state: "home" | "walking" | "working" | "returning";
  currentEdge?: string;
  progress: number;
  direction: 1 | -1; // 1 = forward, -1 = returning
  envelope?: Envelope;
  energy: number;
}

interface Envelope {
  id: string;
  data: any;
  origin: string;
  hops: number;
}

interface TaskNode {
  id: string;
  title: string;
  action: string;
  attractive: number; // 0-100 based on incoming pheromones
  workQueue: Envelope[];
  completed: number;
}

interface Trail {
  id: string;
  from: string;
  to: string;
  pheromone: number; // 0-100
  usage: number;
  lastUsed: number;
}

// ============================================================================
// BEAUTIFUL TASK NODE
// ============================================================================

interface TaskNodeData {
  id: string;
  title: string;
  action: string;
  attractive: number;
  queueSize: number;
  completed: number;
  antsHere: number;
  isSource?: boolean;
  isSink?: boolean;
}

function BeautifulTaskNode({ data, selected }: NodeProps<TaskNodeData>) {
  // Attractiveness determines glow intensity
  const glowIntensity = data.attractive / 100;
  const isHot = data.attractive > 70;
  const isWarm = data.attractive > 40;

  return (
    <div
      className={cn(
        "relative bg-[#0c0c14] border-2 rounded-2xl min-w-[180px] overflow-hidden transition-all duration-500",
        selected && "ring-2 ring-blue-500",
        isHot && "border-amber-500/60 shadow-lg shadow-amber-500/20",
        isWarm && !isHot && "border-green-500/40",
        !isWarm && "border-[#1e293b]"
      )}
      style={{
        boxShadow: isHot
          ? `0 0 ${30 * glowIntensity}px ${10 * glowIntensity}px rgba(251, 191, 36, ${glowIntensity * 0.3})`
          : undefined
      }}
    >
      {/* Pulsing attraction indicator */}
      {isHot && (
        <div className="absolute inset-0 bg-amber-500/10 animate-pulse" />
      )}

      {/* Source/Sink badges */}
      {data.isSource && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-[10px] text-white font-bold rounded-full shadow-lg">
          ✦ SOURCE
        </div>
      )}
      {data.isSink && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-[10px] text-white font-bold rounded-full shadow-lg">
          ✦ SINK
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-blue-500 !border-2 !border-[#0c0c14]" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e293b]/50 bg-gradient-to-r from-[#0f0f18] to-[#0c0c14]">
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">{data.title}</span>
          {data.antsHere > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full">
              <span className="text-amber-400 text-xs">🐜</span>
              <span className="text-amber-400 text-xs font-mono">{data.antsHere}</span>
            </div>
          )}
        </div>
        <div className="text-slate-500 text-xs font-mono mt-1">{data.action}()</div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3">
        {/* Attractiveness meter */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Attractiveness</span>
            <span className={cn(
              "font-mono",
              isHot ? "text-amber-400" : isWarm ? "text-green-400" : "text-slate-400"
            )}>
              {Math.round(data.attractive)}%
            </span>
          </div>
          <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isHot ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                isWarm ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                "bg-slate-600"
              )}
              style={{ width: `${data.attractive}%` }}
            />
          </div>
        </div>

        {/* Queue & Completed */}
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Queue</span>
            <span className={cn(
              "px-2 py-0.5 rounded font-mono",
              data.queueSize > 0 ? "bg-blue-500/20 text-blue-400" : "bg-slate-500/10 text-slate-500"
            )}>
              {data.queueSize}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Done</span>
            <span className="text-green-400 font-mono">{data.completed}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !bg-green-500 !border-2 !border-[#0c0c14]" />
    </div>
  );
}

// ============================================================================
// ANTS WALKING ON EDGES
// ============================================================================

function WalkingAnts({
  ants,
  trails,
  nodes,
  tick,
}: {
  ants: Ant[];
  trails: Trail[];
  nodes: Node[];
  tick: number;
}) {
  const walkingAnts = ants.filter(a => a.state === "walking" || a.state === "returning");

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000, overflow: "visible" }}>
      <defs>
        <filter id="ant-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
        </filter>
        <linearGradient id="envelope-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {walkingAnts.map((ant) => {
        if (!ant.currentEdge) return null;

        const trail = trails.find(t => t.id === ant.currentEdge);
        if (!trail) return null;

        const fromId = ant.direction === 1 ? trail.from : trail.to;
        const toId = ant.direction === 1 ? trail.to : trail.from;

        const fromNode = nodes.find(n => n.id === fromId);
        const toNode = nodes.find(n => n.id === toId);
        if (!fromNode || !toNode) return null;

        // Calculate edge path
        const sx = (fromNode.position?.x || 0) + 180;
        const sy = (fromNode.position?.y || 0) + 65;
        const tx = (toNode.position?.x || 0);
        const ty = (toNode.position?.y || 0) + 65;

        // Bezier control points
        const cx1 = sx + (tx - sx) * 0.3;
        const cy1 = sy;
        const cx2 = sx + (tx - sx) * 0.7;
        const cy2 = ty;

        const t = ant.progress;

        // Position on bezier
        const x = (1-t)**3*sx + 3*(1-t)**2*t*cx1 + 3*(1-t)*t**2*cx2 + t**3*tx;
        const y = (1-t)**3*sy + 3*(1-t)**2*t*cy1 + 3*(1-t)*t**2*cy2 + t**3*ty;

        // Tangent for rotation
        const dx = 3*(1-t)**2*(cx1-sx) + 6*(1-t)*t*(cx2-cx1) + 3*t**2*(tx-cx2);
        const dy = 3*(1-t)**2*(cy1-sy) + 6*(1-t)*t*(cy2-cy1) + 3*t**2*(ty-cy2);
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        if (ant.direction === -1) angle += 180;

        // Walking animation
        const walkPhase = tick * 0.4 + ant.progress * 50;
        const bobY = Math.sin(walkPhase) * 1.5;
        const legPhase = Math.sin(walkPhase * 1.5);

        const colors: Record<string, { body: string; accent: string }> = {
          scout: { body: "#f59e0b", accent: "#fbbf24" },
          worker: { body: "#3b82f6", accent: "#60a5fa" },
          forager: { body: "#22c55e", accent: "#4ade80" },
        };
        const c = colors[ant.caste];

        return (
          <g key={ant.id} transform={`translate(${x}, ${y + bobY})`} filter="url(#ant-shadow)">
            {/* Pheromone drops behind */}
            {ant.envelope && [0.03, 0.06, 0.09].map((off, i) => {
              const pt = Math.max(0, t - off);
              const px = (1-pt)**3*sx + 3*(1-pt)**2*pt*cx1 + 3*(1-pt)*pt**2*cx2 + pt**3*tx;
              const py = (1-pt)**3*sy + 3*(1-pt)**2*pt*cy1 + 3*(1-pt)*pt**2*cy2 + pt**3*ty;
              return (
                <circle key={i} cx={px - x} cy={py - y - bobY} r={2} fill={c.body} opacity={0.3 - i * 0.08} />
              );
            })}

            {/* Ant body */}
            <g transform={`rotate(${angle})`}>
              {/* Legs */}
              {[-5, 0, 5].map((lx, i) => (
                <g key={i}>
                  <line
                    x1={lx} y1={0}
                    x2={lx - 4} y2={5 + (i % 2 === 0 ? legPhase : -legPhase) * 2}
                    stroke={c.body} strokeWidth={1.2} strokeLinecap="round" opacity={0.8}
                  />
                  <line
                    x1={lx} y1={0}
                    x2={lx - 4} y2={-5 + (i % 2 === 0 ? -legPhase : legPhase) * 2}
                    stroke={c.body} strokeWidth={1.2} strokeLinecap="round" opacity={0.8}
                  />
                </g>
              ))}

              {/* Abdomen */}
              <ellipse cx={-7} cy={0} rx={5} ry={4} fill={c.body} />

              {/* Thorax */}
              <ellipse cx={0} cy={0} rx={4} ry={3} fill={c.body} />

              {/* Head */}
              <ellipse cx={7} cy={0} rx={3.5} ry={3} fill={c.accent} />

              {/* Antennae */}
              <path d={`M 9 -2 Q 12 ${-4 + legPhase} 14 ${-3 + legPhase}`} stroke={c.accent} strokeWidth={0.8} fill="none" />
              <path d={`M 9 2 Q 12 ${4 - legPhase} 14 ${3 - legPhase}`} stroke={c.accent} strokeWidth={0.8} fill="none" />

              {/* Eyes */}
              <circle cx={8.5} cy={-1.5} r={0.8} fill="#000" />
              <circle cx={8.5} cy={1.5} r={0.8} fill="#000" />
            </g>

            {/* Envelope being carried */}
            {ant.envelope && (
              <g transform={`rotate(${angle}) translate(0, -10)`}>
                <rect x={-8} y={-5} width={16} height={10} rx={2} fill="url(#envelope-gradient)" stroke="#fff" strokeWidth={0.5} opacity={0.95} />
                <text x={0} y={2} textAnchor="middle" fill="#000" fontSize={6} fontWeight="bold">
                  📦
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// PHEROMONE TRAILS (EDGES)
// ============================================================================

function PheromoneTrail({
  id, sourceX, sourceY, targetX, targetY, data
}: {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  data?: { pheromone: number; usage: number };
}) {
  const pheromone = data?.pheromone ?? 10;
  const usage = data?.usage ?? 0;

  // Visual properties based on pheromone strength
  const isSuperhighway = pheromone >= 80;
  const isStrong = pheromone >= 50;
  const isMedium = pheromone >= 25;

  const strokeWidth = Math.max(2, Math.min(12, pheromone / 8));
  const opacity = Math.max(0.2, Math.min(1, pheromone / 60));

  const color = isSuperhighway ? "#fbbf24" : isStrong ? "#22c55e" : isMedium ? "#3b82f6" : "#475569";

  // Bezier path
  const mx = (sourceX + targetX) / 2;
  const path = `M ${sourceX} ${sourceY} C ${mx} ${sourceY}, ${mx} ${targetY}, ${targetX} ${targetY}`;

  return (
    <g>
      {/* Superhighway glow */}
      {isSuperhighway && (
        <>
          <path
            d={path}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={strokeWidth + 16}
            opacity={0.1}
            filter="blur(8px)"
          />
          <path
            d={path}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={strokeWidth + 8}
            opacity={0.2}
            filter="blur(4px)"
          />
        </>
      )}

      {/* Strong trail glow */}
      {isStrong && !isSuperhighway && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 6}
          opacity={0.15}
          filter="blur(4px)"
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

      {/* Animated particles for superhighways */}
      {isSuperhighway && (
        <circle r={3} fill="#fbbf24" opacity={0.8}>
          <animateMotion dur="2s" repeatCount="indefinite" path={path} />
        </circle>
      )}

      {/* Trail label */}
      <g transform={`translate(${mx}, ${(sourceY + targetY) / 2 - 12})`}>
        <rect
          x={-18} y={-9} width={36} height={18} rx={9}
          fill={isSuperhighway ? "rgba(251, 191, 36, 0.2)" : "rgba(15, 15, 20, 0.9)"}
          stroke={color}
          strokeWidth={1}
        />
        <text textAnchor="middle" y={4} fill={color} fontSize={10} fontWeight="bold" fontFamily="monospace">
          {Math.round(pheromone)}
        </text>
      </g>
    </g>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const nodeTypes = { task: BeautifulTaskNode };
const NODE_WIDTH = 180;
const NODE_HEIGHT = 130;

// Initial setup
const initialTasks: TaskNode[] = [
  { id: "source", title: "Source", action: "emit", attractive: 0, workQueue: [], completed: 0 },
  { id: "parse", title: "Parse", action: "parseData", attractive: 0, workQueue: [], completed: 0 },
  { id: "validate", title: "Validate", action: "validate", attractive: 0, workQueue: [], completed: 0 },
  { id: "transform", title: "Transform", action: "transform", attractive: 0, workQueue: [], completed: 0 },
  { id: "enrich", title: "Enrich", action: "enrich", attractive: 0, workQueue: [], completed: 0 },
  { id: "aggregate", title: "Aggregate", action: "aggregate", attractive: 0, workQueue: [], completed: 0 },
  { id: "sink", title: "Sink", action: "collect", attractive: 0, workQueue: [], completed: 0 },
];

const initialTrails: Trail[] = [
  // Multiple paths create choice points
  { id: "t1", from: "source", to: "parse", pheromone: 20, usage: 0, lastUsed: 0 },
  { id: "t2", from: "source", to: "validate", pheromone: 15, usage: 0, lastUsed: 0 }, // alternate
  { id: "t3", from: "parse", to: "validate", pheromone: 18, usage: 0, lastUsed: 0 },
  { id: "t4", from: "parse", to: "transform", pheromone: 12, usage: 0, lastUsed: 0 }, // shortcut
  { id: "t5", from: "validate", to: "transform", pheromone: 22, usage: 0, lastUsed: 0 },
  { id: "t6", from: "transform", to: "enrich", pheromone: 25, usage: 0, lastUsed: 0 },
  { id: "t7", from: "transform", to: "aggregate", pheromone: 10, usage: 0, lastUsed: 0 }, // shortcut
  { id: "t8", from: "enrich", to: "aggregate", pheromone: 20, usage: 0, lastUsed: 0 },
  { id: "t9", from: "aggregate", to: "sink", pheromone: 30, usage: 0, lastUsed: 0 },
  { id: "t10", from: "enrich", to: "sink", pheromone: 8, usage: 0, lastUsed: 0 }, // alternate
];

const initialAnts: Ant[] = [
  { id: "ant-1", name: "Scout Alpha", caste: "scout", homeTaskId: "source", state: "home", progress: 0, direction: 1, energy: 100 },
  { id: "ant-2", name: "Scout Beta", caste: "scout", homeTaskId: "source", state: "home", progress: 0, direction: 1, energy: 100 },
  { id: "ant-3", name: "Worker Gamma", caste: "worker", homeTaskId: "parse", state: "home", progress: 0, direction: 1, energy: 100 },
  { id: "ant-4", name: "Worker Delta", caste: "worker", homeTaskId: "validate", state: "home", progress: 0, direction: 1, energy: 100 },
  { id: "ant-5", name: "Worker Epsilon", caste: "worker", homeTaskId: "transform", state: "home", progress: 0, direction: 1, energy: 100 },
  { id: "ant-6", name: "Forager Zeta", caste: "forager", homeTaskId: "enrich", state: "home", progress: 0, direction: 1, energy: 100 },
  { id: "ant-7", name: "Forager Eta", caste: "forager", homeTaskId: "aggregate", state: "home", progress: 0, direction: 1, energy: 100 },
  { id: "ant-8", name: "Forager Theta", caste: "forager", homeTaskId: "sink", state: "home", progress: 0, direction: 1, energy: 100 },
];

function layoutNodes(tasks: TaskNode[], trails: Trail[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 80, ranksep: 150 });
  g.setDefaultEdgeLabel(() => ({}));

  tasks.forEach(t => g.setNode(t.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  trails.forEach(t => g.setEdge(t.from, t.to));

  dagre.layout(g);

  return tasks.map(task => {
    const pos = g.node(task.id);
    return {
      id: task.id,
      type: "task",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        id: task.id,
        title: task.title,
        action: task.action,
        attractive: task.attractive,
        queueSize: task.workQueue.length,
        completed: task.completed,
        antsHere: 0,
        isSource: task.id === "source",
        isSink: task.id === "sink",
      },
    };
  });
}

function AntStigmergyInner() {
  const { fitView } = useReactFlow();

  const [tasks, setTasks] = useState<TaskNode[]>(initialTasks);
  const [trails, setTrails] = useState<Trail[]>(initialTrails);
  const [ants, setAnts] = useState<Ant[]>(initialAnts);
  const [tick, setTick] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [envelopesDelivered, setEnvelopesDelivered] = useState(0);

  const envelopeCounter = useRef(0);

  // Create flow elements
  const flowNodes = useMemo(() => {
    const nodes = layoutNodes(tasks, trails);
    // Update ants at each node
    const antsAtNode: Record<string, number> = {};
    ants.forEach(a => {
      if (a.state === "home" || a.state === "working") {
        antsAtNode[a.homeTaskId] = (antsAtNode[a.homeTaskId] || 0) + 1;
      }
    });
    return nodes.map(n => ({
      ...n,
      data: { ...n.data, antsHere: antsAtNode[n.id] || 0 }
    }));
  }, [tasks, trails, ants]);

  const flowEdges = useMemo(() => {
    return trails.map(trail => ({
      id: trail.id,
      source: trail.from,
      target: trail.to,
      type: "pheromone",
      data: { pheromone: trail.pheromone, usage: trail.usage },
    }));
  }, [trails]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync state
  useEffect(() => { setNodes(flowNodes); }, [flowNodes, setNodes]);
  useEffect(() => { setEdges(flowEdges); }, [flowEdges, setEdges]);
  useEffect(() => { setTimeout(() => fitView({ padding: 0.15 }), 100); }, [fitView]);

  // Calculate task attractiveness from incoming pheromones
  const updateAttractiveness = useCallback(() => {
    setTasks(prev => prev.map(task => {
      const incoming = trails.filter(t => t.to === task.id);
      const totalPheromone = incoming.reduce((sum, t) => sum + t.pheromone, 0);
      const attractive = Math.min(100, totalPheromone);
      return { ...task, attractive };
    }));
  }, [trails]);

  // Pick next trail based on pheromone (probabilistic)
  const pickTrail = useCallback((fromTaskId: string): Trail | null => {
    const outgoing = trails.filter(t => t.from === fromTaskId);
    if (outgoing.length === 0) return null;

    // Weighted random selection
    const total = outgoing.reduce((sum, t) => sum + Math.pow(t.pheromone, 2), 0);
    let rand = Math.random() * total;

    for (const trail of outgoing) {
      rand -= Math.pow(trail.pheromone, 2);
      if (rand <= 0) return trail;
    }
    return outgoing[0];
  }, [trails]);

  // Main simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTick(t => t + 1);

      // Update ants
      setAnts(prev => prev.map(ant => {
        // Home ants might start walking
        if (ant.state === "home") {
          // Source ants create envelopes
          if (ant.homeTaskId === "source" && Math.random() < 0.1 * speed) {
            const trail = pickTrail("source");
            if (trail) {
              envelopeCounter.current++;
              return {
                ...ant,
                state: "walking" as const,
                currentEdge: trail.id,
                progress: 0,
                direction: 1 as const,
                envelope: {
                  id: `env-${envelopeCounter.current}`,
                  data: { value: Math.random() },
                  origin: "source",
                  hops: 0,
                },
              };
            }
          }
          // Other ants might pick up from queue
          const task = tasks.find(t => t.id === ant.homeTaskId);
          if (task && task.workQueue.length > 0 && Math.random() < 0.15 * speed) {
            const [envelope, ...rest] = task.workQueue;
            setTasks(ts => ts.map(t =>
              t.id === ant.homeTaskId ? { ...t, workQueue: rest } : t
            ));
            const trail = pickTrail(ant.homeTaskId);
            if (trail) {
              return {
                ...ant,
                state: "walking" as const,
                currentEdge: trail.id,
                progress: 0,
                direction: 1 as const,
                envelope: { ...envelope, hops: envelope.hops + 1 },
              };
            }
          }
          return ant;
        }

        // Walking ants progress
        if (ant.state === "walking" && ant.currentEdge) {
          const newProgress = ant.progress + 0.015 * speed;

          if (newProgress >= 1) {
            // Arrived at destination
            const trail = trails.find(t => t.id === ant.currentEdge);
            if (!trail) return { ...ant, state: "home" as const, currentEdge: undefined, progress: 0 };

            const destId = ant.direction === 1 ? trail.to : trail.from;

            // Reinforce trail
            setTrails(ts => ts.map(t =>
              t.id === ant.currentEdge
                ? { ...t, pheromone: Math.min(100, t.pheromone + 3), usage: t.usage + 1, lastUsed: tick }
                : t
            ));

            // If at sink, deliver envelope
            if (destId === "sink" && ant.envelope) {
              setEnvelopesDelivered(d => d + 1);
              setTasks(ts => ts.map(t =>
                t.id === "sink" ? { ...t, completed: t.completed + 1 } : t
              ));
              // Return home
              return {
                ...ant,
                state: "home" as const,
                homeTaskId: "source", // Return to source
                currentEdge: undefined,
                progress: 0,
                envelope: undefined,
              };
            }

            // Drop envelope in queue, pick next trail
            if (ant.envelope) {
              setTasks(ts => ts.map(t =>
                t.id === destId ? { ...t, workQueue: [...t.workQueue, ant.envelope!] } : t
              ));
            }

            // Continue or return home
            const nextTrail = pickTrail(destId);
            if (nextTrail && ant.envelope) {
              return {
                ...ant,
                homeTaskId: destId,
                currentEdge: nextTrail.id,
                progress: 0,
              };
            }

            return {
              ...ant,
              state: "home" as const,
              homeTaskId: destId,
              currentEdge: undefined,
              progress: 0,
              envelope: undefined,
            };
          }

          return { ...ant, progress: newProgress };
        }

        return ant;
      }));

      // Decay pheromones
      setTrails(prev => prev.map(t => ({
        ...t,
        pheromone: Math.max(5, t.pheromone * (1 - 0.002 * speed)),
      })));

      // Update attractiveness
      updateAttractiveness();
    }, 30);

    return () => clearInterval(interval);
  }, [isRunning, speed, tasks, trails, ants, tick, pickTrail, updateAttractiveness]);

  // Stats
  const superhighways = trails.filter(t => t.pheromone >= 80).length;
  const strongTrails = trails.filter(t => t.pheromone >= 50).length;
  const totalPheromone = trails.reduce((sum, t) => sum + t.pheromone, 0);

  return (
    <div className="h-full w-full bg-[#08080c] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={{ pheromone: PheromoneTrail as any }}
        fitView
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="#1a1a2e" gap={50} size={1} />
        <Controls className="!bg-[#0f0f14] !border-[#1e293b] [&>button]:!bg-[#0f0f14] [&>button]:!border-[#1e293b] [&>button]:!fill-slate-400" />

        <WalkingAnts ants={ants} trails={trails} nodes={nodes} tick={tick} />

        {/* Title */}
        <Panel position="top-center">
          <div className="px-6 py-3 bg-gradient-to-r from-[#0f0f14]/95 via-[#0f0f14] to-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-2xl shadow-2xl">
            <div className="text-center">
              <div className="text-white font-bold text-lg flex items-center justify-center gap-2">
                <span className="text-2xl">🐜</span>
                Stigmergic Emergence
                <span className="text-2xl">🐜</span>
              </div>
              <div className="text-slate-500 text-xs mt-1">
                Watch chaos become order as ants form superhighways
              </div>
            </div>
          </div>
        </Panel>

        {/* Stats */}
        <Panel position="top-left">
          <div className="p-4 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl min-w-[200px]">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Colony Metrics</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Envelopes Delivered</span>
                <span className="text-green-400 font-bold text-lg">{envelopesDelivered}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Superhighways</span>
                <span className={cn("font-bold", superhighways > 0 ? "text-amber-400" : "text-slate-500")}>
                  {superhighways}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Strong Trails</span>
                <span className="text-green-400 font-mono">{strongTrails}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Pheromone</span>
                <span className="text-blue-400 font-mono">{Math.round(totalPheromone)}</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Controls */}
        <Panel position="top-right">
          <div className="p-4 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={cn(
                  "flex-1 px-5 py-2.5 text-sm font-bold rounded-lg transition-all",
                  isRunning
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                )}
              >
                {isRunning ? "⏸ Pause" : "▶ Start"}
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Speed</span>
                <span className="text-white font-mono">{speed}x</span>
              </div>
              <input
                type="range" min="0.5" max="3" step="0.5" value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-right">
          <div className="p-4 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Emergence Stages</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 rounded bg-slate-600" />
                <span className="text-slate-400">Chaos (weak trails)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 rounded bg-blue-500" />
                <span className="text-slate-400">Patterns forming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-3 rounded bg-green-500" />
                <span className="text-slate-400">Strong trails</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-4 rounded bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30" />
                <span className="text-amber-400 font-medium">Superhighway!</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function AntStigmergy() {
  return (
    <ReactFlowProvider>
      <AntStigmergyInner />
    </ReactFlowProvider>
  );
}

export default AntStigmergy;
