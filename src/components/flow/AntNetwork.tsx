// AntNetwork - Ants ARE the nodes, passing envelopes along pheromone edges
// Watch food flow through the colony, forming superhighways and loops

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
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface AntNode {
  id: string;
  name: string;
  caste: "queen" | "scout" | "worker" | "forager" | "nurse";
  action: string;
  state: "idle" | "receiving" | "processing" | "passing";
  heldEnvelope?: Envelope;
  processedCount: number;
}

interface Envelope {
  id: string;
  color: string;
  data: any;
  path: string[];
  age: number;
}

interface PheromoneEdge {
  id: string;
  from: string;
  to: string;
  pheromone: number;
  packets: number;
  isLoop: boolean;
}

interface FlyingEnvelope {
  id: string;
  envelope: Envelope;
  edgeId: string;
  fromAnt: string;
  toAnt: string;
  progress: number;
}

// ============================================================================
// ANT NODE COMPONENT - The ant IS the node
// ============================================================================

interface AntNodeData {
  id: string;
  name: string;
  caste: AntNode["caste"];
  action: string;
  state: AntNode["state"];
  hasEnvelope: boolean;
  envelopeColor?: string;
  processedCount: number;
  incomingPheromone: number;
}

const CASTE_CONFIG: Record<string, { color: string; bg: string; icon: string; size: number }> = {
  queen: { color: "#f59e0b", bg: "from-amber-500/30 to-yellow-500/30", icon: "👑", size: 90 },
  scout: { color: "#3b82f6", bg: "from-blue-500/20 to-cyan-500/20", icon: "🔍", size: 70 },
  worker: { color: "#22c55e", bg: "from-green-500/20 to-emerald-500/20", icon: "⚙", size: 75 },
  forager: { color: "#a855f7", bg: "from-purple-500/20 to-pink-500/20", icon: "🌿", size: 70 },
  nurse: { color: "#ec4899", bg: "from-pink-500/20 to-rose-500/20", icon: "💊", size: 65 },
};

function AntNodeComponent({ data, selected }: NodeProps<AntNodeData>) {
  const config = CASTE_CONFIG[data.caste];
  const isActive = data.state !== "idle";
  const isHot = data.incomingPheromone > 150;

  return (
    <div
      className={cn(
        "relative rounded-full transition-all duration-300 flex items-center justify-center",
        "border-4",
        selected && "ring-4 ring-blue-500/50",
        isActive && "animate-pulse"
      )}
      style={{
        width: config.size,
        height: config.size,
        borderColor: config.color,
        background: `linear-gradient(135deg, ${config.color}15, ${config.color}30)`,
        boxShadow: isHot
          ? `0 0 30px 10px ${config.color}40, 0 0 60px 20px ${config.color}20`
          : isActive
          ? `0 0 20px 5px ${config.color}30`
          : "none",
      }}
    >
      {/* Pheromone attraction ring */}
      {data.incomingPheromone > 100 && (
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: config.size + 20,
            height: config.size + 20,
            border: `2px solid ${config.color}`,
            opacity: 0.3,
          }}
        />
      )}

      {/* Input handles - multiple for incoming edges */}
      <Handle type="target" position={Position.Top} id="top" className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white" />

      {/* Ant body */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Caste icon */}
        <div className="text-2xl">{config.icon}</div>

        {/* Ant emoji with state indicator */}
        <div className={cn(
          "text-3xl transition-transform",
          data.state === "processing" && "animate-bounce",
          data.state === "passing" && "scale-110",
          data.state === "receiving" && "scale-90"
        )}>
          🐜
        </div>

        {/* Held envelope */}
        {data.hasEnvelope && (
          <div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg animate-bounce"
            style={{ backgroundColor: data.envelopeColor || "#fbbf24" }}
          >
            📦
          </div>
        )}
      </div>

      {/* Output handles */}
      <Handle type="source" position={Position.Top} id="top-out" className="!bg-green-500 !w-3 !h-3 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-green-500 !w-3 !h-3 !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} id="bottom-out" className="!bg-green-500 !w-3 !h-3 !border-2 !border-white" />

      {/* Name label */}
      <div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${config.color}30`, color: config.color }}
      >
        {data.name}
      </div>

      {/* Action label */}
      <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-500 font-mono">
        {data.action}()
      </div>

      {/* Processed count */}
      <div
        className="absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ backgroundColor: config.color, color: "#fff" }}
      >
        {data.processedCount}
      </div>
    </div>
  );
}

// ============================================================================
// ENVELOPES MOVING ALONG EDGES - Packages follow the exact edge path
// ============================================================================

function MovingEnvelopes({
  envelopes,
  edges,
  nodes,
  tick,
}: {
  envelopes: FlyingEnvelope[];
  edges: PheromoneEdge[];
  nodes: Node[];
  tick: number;
}) {
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000, overflow: "visible" }}>
      <defs>
        <filter id="envelope-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {envelopes.map((flying) => {
        const edge = edges.find(e => e.id === flying.edgeId);
        if (!edge) return null;

        const fromNode = nodes.find(n => n.id === flying.fromAnt);
        const toNode = nodes.find(n => n.id === flying.toAnt);
        if (!fromNode || !toNode) return null;

        const fromConfig = CASTE_CONFIG[(fromNode.data as any).caste] || CASTE_CONFIG.worker;
        const toConfig = CASTE_CONFIG[(toNode.data as any).caste] || CASTE_CONFIG.worker;

        // Start and end at node centers
        const sx = (fromNode.position?.x || 0) + fromConfig.size / 2;
        const sy = (fromNode.position?.y || 0) + fromConfig.size / 2;
        const tx = (toNode.position?.x || 0) + toConfig.size / 2;
        const ty = (toNode.position?.y || 0) + toConfig.size / 2;

        // Calculate the SAME curve as the edge
        const isLoop = edge.isLoop;
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let cx, cy;
        if (isLoop || Math.abs(dy) > Math.abs(dx) * 2) {
          // Quadratic curve for loops - curve outward
          const curve = dist * 0.5;
          cx = sx + dx * 0.5 + (dy > 0 ? curve : -curve);
          cy = sy + dy * 0.5;
        } else {
          // Standard curve
          cx = (sx + tx) / 2;
          cy = (sy + ty) / 2;
        }

        const t = flying.progress;

        // Quadratic bezier - follows edge exactly
        const x = (1-t)*(1-t)*sx + 2*(1-t)*t*cx + t*t*tx;
        const y = (1-t)*(1-t)*sy + 2*(1-t)*t*cy + t*t*ty;

        // Calculate tangent for rotation
        const tangentX = 2*(1-t)*(cx-sx) + 2*t*(tx-cx);
        const tangentY = 2*(1-t)*(cy-sy) + 2*t*(ty-cy);
        const angle = Math.atan2(tangentY, tangentX) * 180 / Math.PI;

        return (
          <g key={flying.id}>
            {/* Trail particles along the edge */}
            {[0.08, 0.16, 0.24, 0.32].map((off, i) => {
              const pt = Math.max(0, t - off);
              const px = (1-pt)*(1-pt)*sx + 2*(1-pt)*pt*cx + pt*pt*tx;
              const py = (1-pt)*(1-pt)*sy + 2*(1-pt)*pt*cy + pt*pt*ty;
              return (
                <circle
                  key={i}
                  cx={px}
                  cy={py}
                  r={6 - i * 1.2}
                  fill={flying.envelope.color}
                  opacity={0.5 - i * 0.1}
                />
              );
            })}

            {/* Main envelope - rotated to follow edge direction */}
            <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
              {/* Glow */}
              <ellipse
                cx={0}
                cy={0}
                rx={18}
                ry={12}
                fill={flying.envelope.color}
                opacity={0.3}
                filter="url(#envelope-glow)"
              />

              {/* Package body */}
              <rect
                x={-14}
                y={-10}
                width={28}
                height={20}
                rx={4}
                fill={flying.envelope.color}
                stroke="#fff"
                strokeWidth={2}
              />

              {/* Package icon */}
              <text x={0} y={4} textAnchor="middle" fill="#fff" fontSize={12}>
                📦
              </text>
            </g>

            {/* Hop count badge - always upright */}
            <g transform={`translate(${x + 16}, ${y - 14})`}>
              <circle r={9} fill="#0f0f14" stroke={flying.envelope.color} strokeWidth={2} />
              <text y={4} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold">
                {flying.envelope.path.length}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// PHEROMONE EDGE COMPONENT - Uses quadratic bezier for smooth curves
// ============================================================================

function PheromoneEdgeComponent({
  id, sourceX, sourceY, targetX, targetY, data, sourcePosition, targetPosition
}: any) {
  const pheromone = data?.pheromone ?? 10;
  const isLoop = data?.isLoop ?? false;

  const isSuperhighway = pheromone >= 100;
  const isStrong = pheromone >= 60;
  const isMedium = pheromone >= 30;

  const strokeWidth = Math.max(3, Math.min(14, pheromone / 7));
  const opacity = Math.max(0.3, Math.min(1, pheromone / 50));

  const color = isSuperhighway ? "#fbbf24" : isStrong ? "#22c55e" : isMedium ? "#3b82f6" : "#475569";

  // Calculate curve - SAME as MovingEnvelopes uses
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let cx, cy;
  if (isLoop || Math.abs(dy) > Math.abs(dx) * 2) {
    // Curve outward for loops
    const curve = dist * 0.5;
    cx = sourceX + dx * 0.5 + (dy > 0 ? curve : -curve);
    cy = sourceY + dy * 0.5;
  } else {
    // Standard midpoint
    cx = (sourceX + targetX) / 2;
    cy = (sourceY + targetY) / 2;
  }

  // Quadratic bezier path
  const path = `M ${sourceX} ${sourceY} Q ${cx} ${cy} ${targetX} ${targetY}`;

  // Label position on the curve
  const labelT = 0.5;
  const labelX = (1-labelT)*(1-labelT)*sourceX + 2*(1-labelT)*labelT*cx + labelT*labelT*targetX;
  const labelY = (1-labelT)*(1-labelT)*sourceY + 2*(1-labelT)*labelT*cy + labelT*labelT*targetY;

  return (
    <g>
      {/* Superhighway outer glow */}
      {isSuperhighway && (
        <>
          <path d={path} fill="none" stroke="#fbbf24" strokeWidth={strokeWidth + 24} opacity={0.08} style={{ filter: "blur(12px)" }} />
          <path d={path} fill="none" stroke="#fbbf24" strokeWidth={strokeWidth + 12} opacity={0.15} style={{ filter: "blur(6px)" }} />
        </>
      )}

      {/* Strong trail glow */}
      {isStrong && !isSuperhighway && (
        <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth + 8} opacity={0.12} style={{ filter: "blur(4px)" }} />
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

      {/* Arrow at end */}
      <polygon
        points={`${targetX},${targetY} ${targetX - 12},${targetY - 6} ${targetX - 12},${targetY + 6}`}
        fill={color}
        opacity={opacity}
        transform={`rotate(${Math.atan2(targetY - cy, targetX - cx) * 180 / Math.PI}, ${targetX}, ${targetY})`}
      />

      {/* Animated flow particles for superhighways */}
      {isSuperhighway && (
        <>
          <circle r={5} fill="#fbbf24" opacity={0.9}>
            <animateMotion dur="2s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r={4} fill="#fbbf24" opacity={0.6}>
            <animateMotion dur="2s" repeatCount="indefinite" path={path} begin="0.7s" />
          </circle>
          <circle r={3} fill="#fbbf24" opacity={0.4}>
            <animateMotion dur="2s" repeatCount="indefinite" path={path} begin="1.4s" />
          </circle>
        </>
      )}

      {/* Pheromone label on curve */}
      <g transform={`translate(${labelX + (isLoop ? 25 : 0)}, ${labelY - 20})`}>
        <rect
          x={-18} y={-11} width={36} height={22} rx={11}
          fill={isSuperhighway ? "rgba(251, 191, 36, 0.25)" : "rgba(10, 10, 15, 0.9)"}
          stroke={color}
          strokeWidth={isSuperhighway ? 2 : 1}
        />
        <text textAnchor="middle" y={4} fill={color} fontSize={12} fontWeight="bold" fontFamily="monospace">
          {Math.round(pheromone)}
        </text>
      </g>

      {/* Loop indicator */}
      {isLoop && (
        <g transform={`translate(${labelX + 45}, ${labelY - 25})`}>
          <text fontSize={18} opacity={0.9}>🔄</text>
        </g>
      )}
    </g>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const nodeTypes = { ant: AntNodeComponent };
const edgeTypes = { pheromone: PheromoneEdgeComponent };

// Colony layout - circular with queen in center
const COLONY_LAYOUT: Record<string, { x: number; y: number }> = {
  queen: { x: 400, y: 300 },
  scout1: { x: 150, y: 150 },
  scout2: { x: 650, y: 150 },
  worker1: { x: 100, y: 350 },
  worker2: { x: 400, y: 100 },
  worker3: { x: 700, y: 350 },
  forager1: { x: 200, y: 500 },
  forager2: { x: 600, y: 500 },
  nurse1: { x: 400, y: 500 },
};

const initialAnts: AntNode[] = [
  { id: "queen", name: "Queen Aria", caste: "queen", action: "coordinate", state: "idle", processedCount: 0 },
  { id: "scout1", name: "Scout Alpha", caste: "scout", action: "discover", state: "idle", processedCount: 0 },
  { id: "scout2", name: "Scout Beta", caste: "scout", action: "explore", state: "idle", processedCount: 0 },
  { id: "worker1", name: "Worker Gamma", caste: "worker", action: "process", state: "idle", processedCount: 0 },
  { id: "worker2", name: "Worker Delta", caste: "worker", action: "transform", state: "idle", processedCount: 0 },
  { id: "worker3", name: "Worker Epsilon", caste: "worker", action: "validate", state: "idle", processedCount: 0 },
  { id: "forager1", name: "Forager Zeta", caste: "forager", action: "gather", state: "idle", processedCount: 0 },
  { id: "forager2", name: "Forager Eta", caste: "forager", action: "collect", state: "idle", processedCount: 0 },
  { id: "nurse1", name: "Nurse Theta", caste: "nurse", action: "nurture", state: "idle", processedCount: 0 },
];

const initialEdges: PheromoneEdge[] = [
  // Scouts discover and send to workers
  { id: "e1", from: "scout1", to: "worker1", pheromone: 20, packets: 0, isLoop: false },
  { id: "e2", from: "scout1", to: "worker2", pheromone: 15, packets: 0, isLoop: false },
  { id: "e3", from: "scout2", to: "worker2", pheromone: 18, packets: 0, isLoop: false },
  { id: "e4", from: "scout2", to: "worker3", pheromone: 22, packets: 0, isLoop: false },

  // Workers process and send to queen or foragers
  { id: "e5", from: "worker1", to: "queen", pheromone: 30, packets: 0, isLoop: false },
  { id: "e6", from: "worker2", to: "queen", pheromone: 25, packets: 0, isLoop: false },
  { id: "e7", from: "worker3", to: "queen", pheromone: 28, packets: 0, isLoop: false },
  { id: "e8", from: "worker1", to: "forager1", pheromone: 15, packets: 0, isLoop: false },
  { id: "e9", from: "worker3", to: "forager2", pheromone: 12, packets: 0, isLoop: false },

  // Queen coordinates back to workers (LOOPS!)
  { id: "e10", from: "queen", to: "worker1", pheromone: 35, packets: 0, isLoop: true },
  { id: "e11", from: "queen", to: "worker2", pheromone: 30, packets: 0, isLoop: true },
  { id: "e12", from: "queen", to: "worker3", pheromone: 32, packets: 0, isLoop: true },

  // Foragers collect and send to nurse
  { id: "e13", from: "forager1", to: "nurse1", pheromone: 20, packets: 0, isLoop: false },
  { id: "e14", from: "forager2", to: "nurse1", pheromone: 18, packets: 0, isLoop: false },

  // Nurse nurtures back to queen (LOOP!)
  { id: "e15", from: "nurse1", to: "queen", pheromone: 40, packets: 0, isLoop: true },

  // Cross connections for emergent paths
  { id: "e16", from: "worker1", to: "worker2", pheromone: 10, packets: 0, isLoop: false },
  { id: "e17", from: "worker2", to: "worker3", pheromone: 8, packets: 0, isLoop: false },
  { id: "e18", from: "forager1", to: "forager2", pheromone: 12, packets: 0, isLoop: false },
];

const ENVELOPE_COLORS = ["#fbbf24", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#f97316"];

function AntNetworkInner() {
  const { fitView } = useReactFlow();

  const [ants, setAnts] = useState<AntNode[]>(initialAnts);
  const [pheromoneEdges, setPheromoneEdges] = useState<PheromoneEdge[]>(initialEdges);
  const [flyingEnvelopes, setFlyingEnvelopes] = useState<FlyingEnvelope[]>([]);
  const [tick, setTick] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);

  const envelopeCounter = useRef(0);

  // Create flow nodes
  const flowNodes = useMemo((): Node[] => {
    return ants.map(ant => {
      const pos = COLONY_LAYOUT[ant.id] || { x: 400, y: 300 };
      const incoming = pheromoneEdges.filter(e => e.to === ant.id);
      const incomingPheromone = incoming.reduce((sum, e) => sum + e.pheromone, 0);

      return {
        id: ant.id,
        type: "ant",
        position: pos,
        data: {
          id: ant.id,
          name: ant.name,
          caste: ant.caste,
          action: ant.action,
          state: ant.state,
          hasEnvelope: !!ant.heldEnvelope,
          envelopeColor: ant.heldEnvelope?.color,
          processedCount: ant.processedCount,
          incomingPheromone,
        },
      };
    });
  }, [ants, pheromoneEdges]);

  // Create flow edges
  const flowEdges = useMemo((): Edge[] => {
    return pheromoneEdges.map(edge => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: "pheromone",
      data: { pheromone: edge.pheromone, isLoop: edge.isLoop },
    }));
  }, [pheromoneEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => { setNodes(flowNodes); }, [flowNodes, setNodes]);
  useEffect(() => { setEdges(flowEdges); }, [flowEdges, setEdges]);
  useEffect(() => { setTimeout(() => fitView({ padding: 0.2 }), 100); }, [fitView]);

  // Pick next edge based on pheromone
  const pickEdge = useCallback((fromAntId: string): PheromoneEdge | null => {
    const outgoing = pheromoneEdges.filter(e => e.from === fromAntId);
    if (outgoing.length === 0) return null;

    const total = outgoing.reduce((sum, e) => sum + Math.pow(e.pheromone, 1.5), 0);
    let rand = Math.random() * total;

    for (const edge of outgoing) {
      rand -= Math.pow(edge.pheromone, 1.5);
      if (rand <= 0) return edge;
    }
    return outgoing[0];
  }, [pheromoneEdges]);

  // Create new envelope at scout
  const createEnvelope = useCallback((antId: string): Envelope => {
    envelopeCounter.current++;
    return {
      id: `env-${envelopeCounter.current}`,
      color: ENVELOPE_COLORS[envelopeCounter.current % ENVELOPE_COLORS.length],
      data: { value: Math.random() * 100 },
      path: [antId],
      age: 0,
    };
  }, []);

  // Main simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTick(t => t + 1);

      // Move flying envelopes
      setFlyingEnvelopes(prev => {
        const updated: FlyingEnvelope[] = [];
        const arrived: FlyingEnvelope[] = [];

        prev.forEach(f => {
          const newProgress = f.progress + 0.025 * speed;
          if (newProgress >= 1) {
            arrived.push(f);
          } else {
            updated.push({ ...f, progress: newProgress });
          }
        });

        // Handle arrivals
        arrived.forEach(f => {
          // Reinforce pheromone
          setPheromoneEdges(edges => edges.map(e =>
            e.id === f.edgeId
              ? { ...e, pheromone: Math.min(150, e.pheromone + 5), packets: e.packets + 1 }
              : e
          ));

          // Give envelope to receiving ant
          setAnts(ants => ants.map(a =>
            a.id === f.toAnt
              ? {
                  ...a,
                  state: "receiving" as const,
                  heldEnvelope: { ...f.envelope, path: [...f.envelope.path, f.toAnt] },
                }
              : a
          ));
        });

        return updated;
      });

      // Process ants
      setAnts(prev => prev.map(ant => {
        // Receiving -> Processing
        if (ant.state === "receiving" && ant.heldEnvelope) {
          return { ...ant, state: "processing" as const };
        }

        // Processing -> Ready to pass
        if (ant.state === "processing" && ant.heldEnvelope && Math.random() < 0.15 * speed) {
          const edge = pickEdge(ant.id);
          if (edge) {
            // Start flying envelope
            setFlyingEnvelopes(f => [...f, {
              id: `fly-${Date.now()}-${Math.random()}`,
              envelope: ant.heldEnvelope!,
              edgeId: edge.id,
              fromAnt: ant.id,
              toAnt: edge.to,
              progress: 0,
            }]);

            return {
              ...ant,
              state: "passing" as const,
              heldEnvelope: undefined,
              processedCount: ant.processedCount + 1,
            };
          }
        }

        // Passing -> Idle
        if (ant.state === "passing") {
          return { ...ant, state: "idle" as const };
        }

        // Idle scouts create envelopes
        if (ant.state === "idle" && ant.caste === "scout" && Math.random() < 0.08 * speed) {
          const envelope = createEnvelope(ant.id);
          return { ...ant, state: "processing" as const, heldEnvelope: envelope };
        }

        return ant;
      }));

      // Decay pheromones
      setPheromoneEdges(prev => prev.map(e => ({
        ...e,
        pheromone: Math.max(5, e.pheromone * (1 - 0.003 * speed)),
      })));
    }, 30);

    return () => clearInterval(interval);
  }, [isRunning, speed, pickEdge, createEnvelope]);

  // Stats
  const stats = useMemo(() => {
    const superhighways = pheromoneEdges.filter(e => e.pheromone >= 100).length;
    const strongTrails = pheromoneEdges.filter(e => e.pheromone >= 60).length;
    const totalProcessed = ants.reduce((sum, a) => sum + a.processedCount, 0);
    const activeEnvelopes = flyingEnvelopes.length + ants.filter(a => a.heldEnvelope).length;
    return { superhighways, strongTrails, totalProcessed, activeEnvelopes };
  }, [pheromoneEdges, ants, flyingEnvelopes]);

  return (
    <div className="h-full w-full bg-[#06060a] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
          </marker>
        </defs>

        <Background color="#1a1a2e" gap={40} size={1} />
        <Controls className="!bg-[#0f0f14] !border-[#1e293b] [&>button]:!bg-[#0f0f14] [&>button]:!border-[#1e293b] [&>button]:!fill-slate-400" />

        <MovingEnvelopes envelopes={flyingEnvelopes} edges={pheromoneEdges} nodes={nodes} tick={tick} />

        {/* Title */}
        <Panel position="top-center">
          <div className="px-8 py-4 bg-gradient-to-r from-[#0f0f14]/95 via-[#0f0f14] to-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-2xl shadow-2xl">
            <div className="text-center">
              <div className="text-white font-bold text-xl flex items-center justify-center gap-3">
                <span className="text-3xl">🐜</span>
                The Ant Network
                <span className="text-3xl">🐜</span>
              </div>
              <div className="text-slate-400 text-sm mt-1">
                Ants pass envelopes along pheromone trails • Loops reinforce superhighways
              </div>
            </div>
          </div>
        </Panel>

        {/* Stats */}
        <Panel position="top-left">
          <div className="p-5 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl min-w-[220px]">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Network Stats</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Envelopes Processed</span>
                <span className="text-green-400 font-bold text-xl">{stats.totalProcessed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Active Envelopes</span>
                <span className="text-blue-400 font-mono">{stats.activeEnvelopes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Superhighways</span>
                <span className={cn("font-bold", stats.superhighways > 0 ? "text-amber-400" : "text-slate-500")}>
                  {stats.superhighways} 🛣️
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Strong Trails</span>
                <span className="text-green-400 font-mono">{stats.strongTrails}</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Controls */}
        <Panel position="top-right">
          <div className="p-5 bg-[#0f0f14]/95 backdrop-blur border border-[#1e293b] rounded-xl shadow-xl">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                "w-full px-6 py-3 text-sm font-bold rounded-lg transition-all mb-4",
                isRunning
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                  : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
              )}
            >
              {isRunning ? "⏸ Pause Colony" : "▶ Start Colony"}
            </button>
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
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Colony Castes</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(CASTE_CONFIG).map(([caste, config]) => (
                <div key={caste} className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span style={{ color: config.color }} className="capitalize">{caste}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#1e293b] text-[10px] text-slate-500">
              <div>🔄 = Loop (cyclic processing)</div>
              <div>📦 = Envelope (data packet)</div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function AntNetwork() {
  return (
    <ReactFlowProvider>
      <AntNetworkInner />
    </ReactFlowProvider>
  );
}

export default AntNetwork;
