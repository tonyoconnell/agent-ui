/**
 * COLONY EDITOR - Shape Emergent Intelligence
 *
 * The 85 lines made interactive:
 * - Draw edges (create trails)
 * - Adjust pheromones (shape learning)
 * - Spawn nodes (add chambers)
 * - Inject signals (watch flow)
 * - Record & replay signal journeys
 * - Superhighway celebrations
 * - Heat map visualization
 * - Time-lapse evolution
 * - Save/Load colony state
 * - AI self-organization mode
 *
 * Simple interactions. Complex emergence.
 */

import { useCallback, useState, useRef, useEffect, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  MarkerType,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge as FlowEdge,
  type EdgeProps,
  type NodeProps,
  type Connection,
  type OnConnect,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import type { Colony, Edge } from "@/engine"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface AgentData {
  id: string
  name: string
  status?: string
  actions: Record<string, unknown>
}

interface ColonyEditorProps {
  colony: Colony
  agents: AgentData[]
  highways: Edge[]
  onAgentSelect?: (id: string) => void
  onColonyChange?: () => void
}

interface ChamberNodeData {
  id: string
  name: string
  status: string
  actions: string[]
  incoming: number
  outgoing: number
  isSuperhighway: boolean
  heatLevel?: number
  [key: string]: unknown
}

interface TrailEdgeData {
  strength: number
  fromTask: string
  toTask: string
  isSuperhighway: boolean
  celebrating?: boolean
  [key: string]: unknown
}

interface SignalRecord {
  id: string
  timestamp: number
  path: { node: string; task: string }[]
  payload: unknown
}

interface ColonyState {
  agents: AgentData[]
  scent: Record<string, number>
  positions: Record<string, { x: number; y: number }>
}

// ============================================================================
// CELEBRATION PARTICLES - Superhighway formation
// ============================================================================

function CelebrationParticles({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}>
      {/* Central burst */}
      <div className="absolute w-4 h-4 bg-blue-500 rounded-full animate-ping" />

      {/* Radiating particles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * Math.PI / 180
        const distance = 60
        return (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            style={{
              animation: `particle-burst 1s ease-out forwards`,
              animationDelay: `${i * 0.05}s`,
              ["--tx" as string]: `${Math.cos(angle) * distance}px`,
              ["--ty" as string]: `${Math.sin(angle) * distance}px`,
            }}
          />
        )
      })}

      {/* Sparkles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute text-yellow-400 text-lg"
          style={{
            animation: `sparkle 0.8s ease-out forwards`,
            animationDelay: `${i * 0.1}s`,
            left: `${(Math.random() - 0.5) * 80}px`,
            top: `${(Math.random() - 0.5) * 80}px`,
          }}
        >
          ✦
        </div>
      ))}

      {/* SUPERHIGHWAY text */}
      <div className="absolute whitespace-nowrap text-blue-300 font-bold text-sm animate-bounce" style={{ top: -30 }}>
        SUPERHIGHWAY!
      </div>
    </div>
  )
}

// ============================================================================
// SIGNAL TRACER - Animated signal following path
// ============================================================================

function SignalTracer({
  path,
  nodes,
  onComplete
}: {
  path: { node: string; task: string }[]
  nodes: Node[]
  onComplete: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (currentIndex >= path.length) {
      onComplete()
      return
    }

    const currentNode = nodes.find(n => n.id === path[currentIndex].node)
    if (currentNode) {
      setPosition({ x: currentNode.position.x + 90, y: currentNode.position.y + 50 })
    }

    const timer = setTimeout(() => {
      setCurrentIndex(i => i + 1)
    }, 500)

    return () => clearTimeout(timer)
  }, [currentIndex, path, nodes, onComplete])

  if (!position) return null

  return (
    <div
      className="absolute w-6 h-6 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50 z-50 pointer-events-none transition-all duration-300"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        boxShadow: "0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.4)"
      }}
    >
      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping" />
      <div className="absolute inset-1 bg-white rounded-full" />
    </div>
  )
}

// ============================================================================
// PHEROMONE EDITOR POPOVER
// ============================================================================

function PheromoneEditor({
  edgeId,
  strength,
  position,
  onClose,
  onChange,
  onDelete,
}: {
  edgeId: string
  strength: number
  position: { x: number; y: number }
  onClose: () => void
  onChange: (strength: number) => void
  onDelete: () => void
}) {
  const [value, setValue] = useState(strength)

  return (
    <div
      className="absolute z-50 bg-[#0f0f14] border border-[#252538] rounded-lg p-3 shadow-xl min-w-[200px]"
      style={{ left: position.x, top: position.y, transform: "translate(-50%, -100%) translateY(-10px)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400 font-mono">Pheromone Level</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-2xl font-bold font-mono",
            value > 50 ? "text-blue-400" : value > 20 ? "text-indigo-400" : "text-slate-400"
          )}>
            {value.toFixed(0)}
          </span>
          <span className={cn(
            "text-xs px-2 py-1 rounded",
            value > 50 ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-400"
          )}>
            {value > 50 ? "SUPERHIGHWAY" : value > 20 ? "Active" : "Weak"}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          onMouseUp={() => onChange(value)}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        <div className="flex gap-2">
          <button
            onClick={() => { setValue(0); onChange(0); }}
            className="flex-1 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => { setValue(100); onChange(100); }}
            className="flex-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            Max
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SIGNAL INJECTOR
// ============================================================================

function SignalInjector({
  nodeId,
  tasks,
  position,
  onClose,
  onInject,
}: {
  nodeId: string
  tasks: string[]
  position: { x: number; y: number }
  onClose: () => void
  onInject: (task: string) => void
}) {
  return (
    <div
      className="absolute z-50 bg-[#0f0f14] border border-emerald-500/30 rounded-lg p-3 shadow-xl min-w-[180px]"
      style={{ left: position.x, top: position.y, transform: "translate(-50%, 10px)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-emerald-400 font-semibold">Inject Signal</span>
      </div>

      <div className="space-y-1">
        {tasks.map((task) => (
          <button
            key={task}
            onClick={() => { onInject(task); onClose(); }}
            className="w-full px-3 py-2 text-left text-sm bg-slate-800/50 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 rounded transition-colors font-mono"
          >
            {task}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// NODE PALETTE
// ============================================================================

function NodePalette({ onDragStart }: { onDragStart: (type: string, name: string) => void }) {
  const nodeTypes = [
    { type: "worker", name: "Worker", icon: "W", color: "bg-blue-500" },
    { type: "scout", name: "Scout", icon: "S", color: "bg-emerald-500" },
    { type: "analyst", name: "Analyst", icon: "A", color: "bg-purple-500" },
    { type: "trader", name: "Trader", icon: "T", color: "bg-amber-500" },
  ]

  return (
    <div className="bg-[#0a0a0f]/90 border border-[#252538] rounded-lg p-3">
      <div className="text-xs text-slate-500 mb-2 font-semibold">Spawn Node</div>
      <div className="flex gap-2">
        {nodeTypes.map(({ type, name, icon, color }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/reactflow", JSON.stringify({ type, name }))
              e.dataTransfer.effectAllowed = "move"
              onDragStart(type, name)
            }}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center cursor-grab",
              "border border-slate-700 hover:border-slate-500 transition-all",
              "hover:scale-110 active:cursor-grabbing",
              color + "/20"
            )}
            title={`Drag to spawn ${name}`}
          >
            <span className={cn("text-sm font-bold", color.replace("bg-", "text-"))}>{icon}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// CONTROL PANEL - All the magic controls
// ============================================================================

function ControlPanel({
  isRecording,
  isPlaying,
  isAIMode,
  isTimeLapse,
  heatMapEnabled,
  signalHistory,
  onToggleRecord,
  onPlayback,
  onToggleAI,
  onToggleTimeLapse,
  onToggleHeatMap,
  onSave,
  onLoad,
  onClearHistory,
  speed,
  onSpeedChange,
}: {
  isRecording: boolean
  isPlaying: boolean
  isAIMode: boolean
  isTimeLapse: boolean
  heatMapEnabled: boolean
  signalHistory: SignalRecord[]
  onToggleRecord: () => void
  onPlayback: () => void
  onToggleAI: () => void
  onToggleTimeLapse: () => void
  onToggleHeatMap: () => void
  onSave: () => void
  onLoad: () => void
  onClearHistory: () => void
  speed: number
  onSpeedChange: (speed: number) => void
}) {
  return (
    <div className="bg-[#0a0a0f]/95 border border-[#252538] rounded-lg p-4 space-y-4 min-w-[220px]">
      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Colony Controls</div>

      {/* Record & Playback */}
      <div className="space-y-2">
        <div className="text-[10px] text-slate-500 uppercase">Signal Recording</div>
        <div className="flex gap-2">
          <button
            onClick={onToggleRecord}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
              isRecording
                ? "bg-red-500/20 text-red-400 border border-red-500/50"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-slate-500")} />
            {isRecording ? "Stop" : "Record"}
          </button>
          <button
            onClick={onPlayback}
            disabled={signalHistory.length === 0 || isPlaying}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
              isPlaying
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                : signalHistory.length > 0
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-900 text-slate-600 cursor-not-allowed"
            )}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play ({signalHistory.length})
          </button>
        </div>
        {signalHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="w-full px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {/* AI Mode */}
      <div className="space-y-2">
        <div className="text-[10px] text-slate-500 uppercase">AI Self-Organization</div>
        <button
          onClick={onToggleAI}
          className={cn(
            "w-full px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
            isAIMode
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          )}
        >
          <svg className={cn("w-4 h-4", isAIMode && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          {isAIMode ? "AI Active" : "Start AI Mode"}
        </button>
      </div>

      {/* Time-lapse */}
      <div className="space-y-2">
        <div className="text-[10px] text-slate-500 uppercase">Time-lapse Evolution</div>
        <div className="flex gap-2 items-center">
          <button
            onClick={onToggleTimeLapse}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              isTimeLapse
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            {isTimeLapse ? "⏸ Pause" : "▶ Start"}
          </button>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-slate-800 text-slate-300 text-xs rounded-lg px-2 py-2 border-none"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </div>
      </div>

      {/* Heat Map */}
      <div className="space-y-2">
        <div className="text-[10px] text-slate-500 uppercase">Visualization</div>
        <button
          onClick={onToggleHeatMap}
          className={cn(
            "w-full px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
            heatMapEnabled
              ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
          Heat Map {heatMapEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* Save/Load */}
      <div className="space-y-2">
        <div className="text-[10px] text-slate-500 uppercase">Colony State</div>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save
          </button>
          <button
            onClick={onLoad}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Load
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TRAIL EDGE - With celebration support
// ============================================================================

function TrailEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props
  const edgeData = data as TrailEdgeData | undefined
  const strength = edgeData?.strength || 0
  const isSuperhighway = edgeData?.isSuperhighway || false
  const celebrating = edgeData?.celebrating || false
  const fromTask = edgeData?.fromTask || ""
  const toTask = edgeData?.toTask || ""

  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature: 0.3,
  })

  const strokeWidth = Math.max(1, Math.min(strength / 10, 8))
  const color = isSuperhighway ? "#3b82f6" : strength > 20 ? "#6366f1" : "#334155"
  const glowOpacity = isSuperhighway ? 0.4 : celebrating ? 0.6 : 0.1

  return (
    <g className="react-flow__edge-path">
      {/* Glow layer */}
      <path
        d={path}
        fill="none"
        stroke={celebrating ? "#fbbf24" : color}
        strokeWidth={strokeWidth + (celebrating ? 20 : 12)}
        strokeOpacity={glowOpacity}
        className={cn(isSuperhighway && "animate-pulse", celebrating && "animate-ping")}
      />

      {/* Main trail */}
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: celebrating ? "#fbbf24" : color,
          strokeWidth: celebrating ? strokeWidth + 2 : strokeWidth,
          cursor: "pointer",
          filter: isSuperhighway ? "drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))" : undefined
        }}
      />

      {/* Signal particles */}
      {(isSuperhighway || celebrating) && (
        <g className="signal-particles">
          {[0, 0.33, 0.66].map((delay, i) => (
            <circle
              key={i}
              r={celebrating ? 5 - i : 3 - i * 0.5}
              fill={celebrating ? `rgba(251, 191, 36, ${1 - i * 0.2})` : `rgba(147, 197, 253, ${1 - i * 0.2})`}
            >
              <animateMotion dur={celebrating ? "1s" : "2s"} repeatCount="indefinite" path={path} begin={`${delay}s`} />
            </circle>
          ))}
        </g>
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          className={cn(
            "absolute pointer-events-auto px-2 py-1 rounded-md text-[10px] font-mono cursor-pointer",
            "transform -translate-x-1/2 -translate-y-1/2 transition-all",
            celebrating
              ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50 shadow-lg shadow-yellow-500/30 scale-110"
              : isSuperhighway
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/20"
                : "bg-[#0c0c10]/90 text-slate-400 border border-slate-700/50",
            selected && "ring-2 ring-blue-500"
          )}
          style={{ left: labelX, top: labelY }}
        >
          <span className="text-slate-500">{fromTask}</span>
          <span className="mx-1 text-slate-600">→</span>
          <span className={celebrating ? "text-yellow-300" : isSuperhighway ? "text-blue-300" : "text-slate-400"}>{toTask}</span>
          <span className={cn(
            "ml-2 px-1.5 py-0.5 rounded text-[9px]",
            celebrating ? "bg-yellow-500/40 text-yellow-200" : isSuperhighway ? "bg-blue-500/30 text-blue-200" : "bg-slate-800 text-slate-500"
          )}>
            {strength.toFixed(0)}
          </span>
        </div>
      </EdgeLabelRenderer>
    </g>
  )
}

// ============================================================================
// CHAMBER NODE - With heat map support
// ============================================================================

function ChamberNode({ data, selected }: NodeProps) {
  const d = data as ChamberNodeData
  const isActive = d.isSuperhighway
  const totalStrength = d.incoming + d.outgoing
  const heatLevel = d.heatLevel || 0

  // Heat map colors
  const getHeatColor = (level: number) => {
    if (level > 80) return "from-red-900/50 to-red-950/80 border-red-500/60"
    if (level > 60) return "from-orange-900/50 to-orange-950/80 border-orange-500/60"
    if (level > 40) return "from-yellow-900/50 to-yellow-950/80 border-yellow-500/60"
    if (level > 20) return "from-green-900/50 to-green-950/80 border-green-500/60"
    return "from-[#16161f] to-[#0e0e14] border-slate-700/40"
  }

  const heatGradient = heatLevel > 0 ? getHeatColor(heatLevel) : "from-[#16161f] to-[#0e0e14]"

  return (
    <div
      className={cn(
        "bg-gradient-to-b rounded-xl border transition-all duration-200",
        "w-[180px] cursor-pointer select-none",
        heatLevel > 0 ? heatGradient : "from-[#16161f] to-[#0e0e14]",
        isActive && "shadow-lg shadow-blue-500/30",
        selected ? "border-blue-500 ring-2 ring-blue-500/20" :
        isActive ? "border-blue-500/40" :
        heatLevel > 0 ? "" : "border-slate-700/40 hover:border-slate-500/60"
      )}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!w-3 !h-3 !border-2 !-left-1.5 transition-all",
          d.incoming > 0 ? "!bg-blue-400 !border-[#16161f]" : "!bg-slate-600 !border-[#16161f]"
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!w-3 !h-3 !border-2 !-right-1.5 transition-all",
          d.outgoing > 0 ? "!bg-emerald-400 !border-[#16161f]" : "!bg-slate-600 !border-[#16161f]"
        )}
      />

      {/* Heat indicator */}
      {heatLevel > 0 && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-bold"
          style={{
            backgroundColor: heatLevel > 80 ? "rgba(239, 68, 68, 0.8)" :
                            heatLevel > 60 ? "rgba(249, 115, 22, 0.8)" :
                            heatLevel > 40 ? "rgba(234, 179, 8, 0.8)" :
                            "rgba(34, 197, 94, 0.8)",
            color: "white"
          }}
        >
          {heatLevel.toFixed(0)}%
        </div>
      )}

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full transition-all",
              isActive ? "bg-blue-500 shadow-md shadow-blue-500/50" :
              heatLevel > 60 ? "bg-orange-500 shadow-md shadow-orange-500/50" : "bg-slate-600"
            )}>
              {(isActive || heatLevel > 60) && <div className={cn(
                "w-full h-full rounded-full animate-ping",
                isActive ? "bg-blue-400" : "bg-orange-400"
              )} />}
            </div>
            <span className="text-white font-medium text-sm">{d.name}</span>
          </div>
          {totalStrength > 0 && (
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded",
              isActive ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-400"
            )}>
              {totalStrength.toFixed(0)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-b border-slate-700/30">
        <div className="flex flex-wrap gap-1">
          {d.actions.map((name) => (
            <span
              key={name}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-mono",
                isActive ? "bg-blue-500/15 text-blue-300" : "bg-slate-800/60 text-slate-400"
              )}
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Traffic bars */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-slate-500 w-5">IN</span>
          <div className="flex-1 h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", d.incoming > 50 ? "bg-blue-500" : "bg-slate-600")}
              style={{ width: `${Math.min(d.incoming, 100)}%` }}
            />
          </div>
          <span className={cn("text-[8px] font-mono w-5 text-right", d.incoming > 50 ? "text-blue-400" : "text-slate-500")}>
            {d.incoming.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-slate-500 w-5">OUT</span>
          <div className="flex-1 h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", d.outgoing > 50 ? "bg-emerald-500" : "bg-slate-600")}
              style={{ width: `${Math.min(d.outgoing, 100)}%` }}
            />
          </div>
          <span className={cn("text-[8px] font-mono w-5 text-right", d.outgoing > 50 ? "text-emerald-400" : "text-slate-500")}>
            {d.outgoing.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Superhighway badge */}
      {d.isSuperhighway && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
      )}
    </div>
  )
}

// ============================================================================
// ENTRY NODE
// ============================================================================

function EntryNode({ data }: NodeProps) {
  const d = data as { signals: number }
  return (
    <div className={cn(
      "bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 rounded-xl border border-emerald-500/30",
      "px-4 py-3 shadow-lg shadow-emerald-500/10 select-none"
    )}>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-emerald-900 !-right-1.5"
      />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div>
          <div className="text-emerald-300 font-semibold text-sm uppercase tracking-wide">Entry</div>
          <div className="text-emerald-500/70 text-[10px] font-mono">{d.signals} signals</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// NODE & EDGE TYPES
// ============================================================================

const nodeTypes = { chamber: ChamberNode, entry: EntryNode }
const edgeTypes = { trail: TrailEdge }

// ============================================================================
// COLONY EDITOR INNER - The main component (needs ReactFlow context)
// ============================================================================

function ColonyEditorInner({ colony, agents, highways, onAgentSelect, onColonyChange }: ColonyEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI State
  const [edgeEditor, setEdgeEditor] = useState<{ id: string; strength: number; position: { x: number; y: number } } | null>(null)
  const [signalInjector, setSignalInjector] = useState<{ nodeId: string; tasks: string[]; position: { x: number; y: number } } | null>(null)

  // Feature state
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [signalHistory, setSignalHistory] = useState<SignalRecord[]>([])
  const [isAIMode, setIsAIMode] = useState(false)
  const [isTimeLapse, setIsTimeLapse] = useState(false)
  const [timeLapseSpeed, setTimeLapseSpeed] = useState(1)
  const [heatMapEnabled, setHeatMapEnabled] = useState(false)

  // Celebration state
  const [celebrations, setCelebrations] = useState<{ id: string; x: number; y: number }[]>([])

  // Signal tracer
  const [activeTracer, setActiveTracer] = useState<{ path: { node: string; task: string }[] } | null>(null)

  // Track previous strengths for celebration detection
  const prevStrengthsRef = useRef<Record<string, number>>({})

  // Calculate agent stats with heat levels
  const agentStats = useMemo(() => {
    const stats: Record<string, { incoming: number; outgoing: number; isSuperhighway: boolean; heatLevel: number }> = {}
    const totalFlow = highways.reduce((sum, h) => sum + h.strength, 0) || 1

    agents.forEach(a => { stats[a.id] = { incoming: 0, outgoing: 0, isSuperhighway: false, heatLevel: 0 } })

    for (const { edge, strength } of highways) {
      const [from, to] = edge.split(" → ")
      if (!from || !to) continue
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]

      if (stats[sourceId]) {
        stats[sourceId].outgoing += strength
        if (strength > 50) stats[sourceId].isSuperhighway = true
      }
      if (stats[targetId]) {
        stats[targetId].incoming += strength
        if (strength > 50) stats[targetId].isSuperhighway = true
      }
    }

    // Calculate heat levels
    if (heatMapEnabled) {
      Object.keys(stats).forEach(id => {
        const nodeFlow = stats[id].incoming + stats[id].outgoing
        stats[id].heatLevel = Math.min(100, (nodeFlow / totalFlow) * 200)
      })
    }

    return stats
  }, [highways, agents, heatMapEnabled])

  // Build initial nodes
  const initialNodes = useMemo((): Node[] => {
    const colWidth = 280
    const rowHeight = 200
    const startX = 80
    const centerY = 250

    const outgoing: Record<string, Set<string>> = { entry: new Set() }
    agents.forEach(a => { outgoing[a.id] = new Set() })

    for (const { edge } of highways) {
      const [from, to] = edge.split(" → ")
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      if (outgoing[sourceId]) outgoing[sourceId].add(targetId)
    }

    const ranks: Record<string, number> = { entry: 0 }
    const queue = ["entry"]
    const visited = new Set(["entry"])

    while (queue.length) {
      const current = queue.shift()!
      for (const targetId of outgoing[current] || new Set()) {
        if (!visited.has(targetId)) {
          ranks[targetId] = (ranks[current] || 0) + 1
          visited.add(targetId)
          queue.push(targetId)
        }
      }
    }

    let nextRank = 1
    agents.forEach(a => { if (ranks[a.id] === undefined) ranks[a.id] = nextRank++ })

    const byRank: Record<number, string[]> = {}
    Object.entries(ranks).forEach(([id, r]) => {
      if (!byRank[r]) byRank[r] = []
      byRank[r].push(id)
    })

    const positions: Record<string, { x: number; y: number }> = {}
    Object.entries(byRank).forEach(([rankStr, ids]) => {
      const rank = parseInt(rankStr)
      const count = ids.length
      const totalHeight = (count - 1) * rowHeight
      const baseY = centerY - totalHeight / 2
      ids.forEach((id, i) => {
        positions[id] = { x: startX + rank * colWidth, y: baseY + i * rowHeight }
      })
    })

    const entryNode: Node = {
      id: "entry",
      type: "entry",
      position: positions["entry"] || { x: 80, y: 200 },
      data: { signals: highways.filter(h => h.edge.startsWith("entry")).length }
    }

    const chamberNodes: Node[] = agents.map(agent => ({
      id: agent.id,
      type: "chamber",
      position: positions[agent.id] || { x: 300, y: 200 },
      data: {
        id: agent.id,
        name: agent.name,
        status: agent.status || "ready",
        actions: Object.keys(agent.actions),
        incoming: agentStats[agent.id]?.incoming || 0,
        outgoing: agentStats[agent.id]?.outgoing || 0,
        isSuperhighway: agentStats[agent.id]?.isSuperhighway || false,
        heatLevel: agentStats[agent.id]?.heatLevel || 0,
      } as ChamberNodeData
    }))

    return [entryNode, ...chamberNodes]
  }, [agents, highways, agentStats])

  // Build initial edges
  const initialEdges = useMemo((): FlowEdge[] => {
    const edgeMap: Record<string, { strength: number; fromTask: string; toTask: string }> = {}

    for (const { edge, strength } of highways) {
      const [from, to] = edge.split(" → ")
      if (!from || !to) continue
      const sourceId = from === "entry" ? "entry" : from.split(":")[0]
      const targetId = to.split(":")[0]
      if (sourceId === targetId) continue

      const key = `${sourceId}→${targetId}`
      if (!edgeMap[key]) {
        edgeMap[key] = { strength: 0, fromTask: from.split(":")[1] || "signal", toTask: to.split(":")[1] || "receive" }
      }
      edgeMap[key].strength += strength
    }

    return Object.entries(edgeMap)
      .filter(([key]) => {
        const [src, tgt] = key.split("→")
        return (src === "entry" || agents.some(a => a.id === src)) && agents.some(a => a.id === tgt)
      })
      .map(([key, { strength, fromTask, toTask }]) => {
        const [source, target] = key.split("→")
        const isSuperhighway = strength > 50
        return {
          id: key,
          source,
          target,
          type: "trail",
          data: { strength, fromTask, toTask, isSuperhighway, celebrating: false } as TrailEdgeData,
          markerEnd: { type: MarkerType.ArrowClosed, color: isSuperhighway ? "#3b82f6" : "#334155", width: 20, height: 20 }
        }
      })
  }, [highways, agents])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Detect superhighway formation for celebration
  useEffect(() => {
    const currentStrengths: Record<string, number> = {}
    edges.forEach(e => {
      const data = e.data as TrailEdgeData
      currentStrengths[e.id] = data?.strength || 0
    })

    // Check for new superhighways
    edges.forEach(e => {
      const data = e.data as TrailEdgeData
      const prevStrength = prevStrengthsRef.current[e.id] || 0
      const currentStrength = data?.strength || 0

      if (prevStrength <= 50 && currentStrength > 50) {
        // New superhighway formed! Celebrate!
        const sourceNode = nodes.find(n => n.id === e.source)
        const targetNode = nodes.find(n => n.id === e.target)
        if (sourceNode && targetNode) {
          const x = (sourceNode.position.x + targetNode.position.x) / 2 + 90
          const y = (sourceNode.position.y + targetNode.position.y) / 2 + 50

          setCelebrations(prev => [...prev, { id: `${e.id}-${Date.now()}`, x, y }])

          // Mark edge as celebrating
          setEdges(eds => eds.map(edge =>
            edge.id === e.id
              ? { ...edge, data: { ...edge.data, celebrating: true } }
              : edge
          ))

          // Stop celebration after animation
          setTimeout(() => {
            setEdges(eds => eds.map(edge =>
              edge.id === e.id
                ? { ...edge, data: { ...edge.data, celebrating: false } }
                : edge
            ))
          }, 2000)
        }
      }
    })

    prevStrengthsRef.current = currentStrengths
  }, [edges, nodes, setEdges])

  // Update nodes and edges when highways change
  useEffect(() => {
    setNodes(nds => nds.map(node => {
      if (node.id === "entry") return node
      const stats = agentStats[node.id]
      if (!stats) return node
      return {
        ...node,
        data: {
          ...node.data,
          incoming: stats.incoming,
          outgoing: stats.outgoing,
          isSuperhighway: stats.isSuperhighway,
          heatLevel: stats.heatLevel
        }
      }
    }))

    setEdges(eds => eds.map(edge => {
      const highway = highways.find(h => {
        const [from, to] = h.edge.split(" → ")
        const sourceId = from === "entry" ? "entry" : from.split(":")[0]
        const targetId = to.split(":")[0]
        return edge.source === sourceId && edge.target === targetId
      })
      if (!highway) return edge
      const isSuperhighway = highway.strength > 50
      return {
        ...edge,
        data: { ...edge.data, strength: highway.strength, isSuperhighway },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSuperhighway ? "#3b82f6" : "#334155", width: 20, height: 20 }
      }
    }))
  }, [highways, agentStats, setNodes, setEdges])

  // AI Mode - random signal injection
  useEffect(() => {
    if (!isAIMode) return

    const interval = setInterval(() => {
      const availableAgents = agents.filter(a => Object.keys(a.actions).length > 0)
      if (availableAgents.length === 0) return

      const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)]
      const tasks = Object.keys(randomAgent.actions)
      const randomTask = tasks[Math.floor(Math.random() * tasks.length)]

      injectSignal(randomAgent.id, randomTask)
    }, 2000 / timeLapseSpeed)

    return () => clearInterval(interval)
  }, [isAIMode, agents, timeLapseSpeed])

  // Time-lapse mode - accelerated decay
  useEffect(() => {
    if (!isTimeLapse) return

    const interval = setInterval(() => {
      colony.fade(0.1 * timeLapseSpeed)
      onColonyChange?.()
    }, 1000 / timeLapseSpeed)

    return () => clearInterval(interval)
  }, [isTimeLapse, timeLapseSpeed, colony, onColonyChange])

  // Connect handler
  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return

    const edgeKey = `${connection.source}:signal → ${connection.target}:receive`
    colony.mark(edgeKey, 1)

    setEdges(eds => addEdge({
      ...connection,
      type: "trail",
      data: { strength: 1, fromTask: "signal", toTask: "receive", isSuperhighway: false, celebrating: false },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#334155", width: 20, height: 20 }
    }, eds))

    onColonyChange?.()
  }, [colony, setEdges, onColonyChange])

  // Edge click
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: FlowEdge) => {
    const data = edge.data as TrailEdgeData
    setEdgeEditor({
      id: edge.id,
      strength: data?.strength || 0,
      position: { x: event.clientX, y: event.clientY }
    })
  }, [])

  // Node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id === "entry") return

    if (event.detail === 2) {
      const agent = agents.find(a => a.id === node.id)
      if (agent) {
        setSignalInjector({
          nodeId: node.id,
          tasks: Object.keys(agent.actions),
          position: { x: event.clientX, y: event.clientY }
        })
      }
    } else {
      onAgentSelect?.(node.id)
    }
  }, [agents, onAgentSelect])

  // Update pheromone
  const updatePheromone = useCallback((edgeId: string, strength: number) => {
    const [source, target] = edgeId.split("→")

    // Find and update all matching scent entries
    Object.keys(colony.scent).forEach(key => {
      const [from, to] = key.split(" → ")
      const srcId = from === "entry" ? "entry" : from.split(":")[0]
      const tgtId = to.split(":")[0]
      if (srcId === source && tgtId === target) {
        if (strength === 0) {
          delete colony.scent[key]
        } else {
          colony.scent[key] = strength
        }
      }
    })

    setEdges(eds => eds.map(e => {
      if (e.id !== edgeId) return e
      const isSuperhighway = strength > 50
      return {
        ...e,
        data: { ...e.data, strength, isSuperhighway },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSuperhighway ? "#3b82f6" : "#334155", width: 20, height: 20 }
      }
    }))

    onColonyChange?.()
  }, [colony, setEdges, onColonyChange])

  // Delete edge
  const deleteEdge = useCallback((edgeId: string) => {
    const [source, target] = edgeId.split("→")

    Object.keys(colony.scent).forEach(key => {
      if (key.includes(source) && key.includes(target)) {
        delete colony.scent[key]
      }
    })

    setEdges(eds => eds.filter(e => e.id !== edgeId))
    setEdgeEditor(null)
    onColonyChange?.()
  }, [colony, setEdges, onColonyChange])

  // Inject signal with recording
  const injectSignal = useCallback(async (nodeId: string, task: string) => {
    const path: { node: string; task: string }[] = [{ node: nodeId, task }]

    // Build path by following the callback chain
    const agent = agents.find(a => a.id === nodeId)
    if (agent) {
      // Simple path tracing - in real implementation would follow actual callbacks
      const visited = new Set([nodeId])
      let current = nodeId

      // Find outgoing edges to trace path
      edges.forEach(e => {
        if (e.source === current && !visited.has(e.target)) {
          const targetAgent = agents.find(a => a.id === e.target)
          if (targetAgent) {
            const targetTasks = Object.keys(targetAgent.actions)
            if (targetTasks.length > 0) {
              path.push({ node: e.target, task: targetTasks[0] })
              visited.add(e.target)
            }
          }
        }
      })
    }

    // Record if recording
    if (isRecording) {
      setSignalHistory(prev => [...prev, {
        id: `signal-${Date.now()}`,
        timestamp: Date.now(),
        path,
        payload: { source: "manual-injection" }
      }])
    }

    // Show tracer animation
    setActiveTracer({ path })

    // Actually send the signal
    await colony.send({
      receiver: nodeId,
      receive: task,
      payload: { source: "manual-injection" }
    })

    onColonyChange?.()
  }, [colony, agents, edges, isRecording, onColonyChange])

  // Playback recorded signals
  const playbackSignals = useCallback(async () => {
    if (signalHistory.length === 0) return

    setIsPlaying(true)

    for (const record of signalHistory) {
      setActiveTracer({ path: record.path })

      // Inject the signal
      if (record.path.length > 0) {
        await colony.send({
          receiver: record.path[0].node,
          receive: record.path[0].task,
          payload: record.payload
        })
        onColonyChange?.()
      }

      // Wait between signals
      await new Promise(resolve => setTimeout(resolve, 1000 / timeLapseSpeed))
    }

    setIsPlaying(false)
  }, [signalHistory, colony, timeLapseSpeed, onColonyChange])

  // Save colony state
  const saveColony = useCallback(() => {
    const state: ColonyState = {
      agents: agents.map(a => ({
        ...a,
        actions: { ...a.actions }
      })),
      scent: { ...colony.scent },
      positions: nodes.reduce((acc, n) => {
        acc[n.id] = { x: n.position.x, y: n.position.y }
        return acc
      }, {} as Record<string, { x: number; y: number }>)
    }

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `colony-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [agents, colony.scent, nodes])

  // Load colony state
  const loadColony = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileLoad = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result as string) as ColonyState

        // Restore scent
        Object.keys(colony.scent).forEach(key => delete colony.scent[key])
        Object.entries(state.scent).forEach(([key, value]) => {
          colony.scent[key] = value
        })

        // Restore positions
        setNodes(nds => nds.map(node => ({
          ...node,
          position: state.positions[node.id] || node.position
        })))

        onColonyChange?.()
      } catch (err) {
        console.error("Failed to load colony state:", err)
      }
    }
    reader.readAsText(file)

    // Reset input
    event.target.value = ""
  }, [colony, setNodes, onColonyChange])

  // Drop handler
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()

    const data = event.dataTransfer.getData("application/reactflow")
    if (!data) return

    const { type, name } = JSON.parse(data)
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
    if (!reactFlowBounds) return

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    const newId = `${type}-${Date.now()}`

    const unit = colony.spawn({ receiver: newId })
    unit.assign("process", (p: unknown) => ({ processed: true, ...(p as object) }))

    const newNode: Node = {
      id: newId,
      type: "chamber",
      position,
      data: {
        id: newId,
        name: `${name} ${Math.floor(Math.random() * 100)}`,
        status: "ready",
        actions: ["process"],
        incoming: 0,
        outgoing: 0,
        isSuperhighway: false,
        heatLevel: 0,
      }
    }

    setNodes(nds => [...nds, newNode])
    onColonyChange?.()
  }, [colony, setNodes, onColonyChange, reactFlowInstance])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  // Stats
  const stats = useMemo(() => ({
    nodes: nodes.length - 1,
    edges: edges.length,
    superhighways: edges.filter(e => (e.data as TrailEdgeData)?.isSuperhighway).length,
    totalFlow: highways.reduce((s, h) => s + h.strength, 0)
  }), [nodes, edges, highways])

  return (
    <div className="h-full w-full bg-[#060608] relative" ref={reactFlowWrapper}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileLoad}
        className="hidden"
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full shadow-lg",
              isAIMode ? "bg-purple-500 shadow-purple-500/50 animate-pulse" :
              isTimeLapse ? "bg-amber-500 shadow-amber-500/50 animate-pulse" :
              "bg-emerald-500 shadow-emerald-500/50"
            )} />
            <span className="text-lg font-semibold text-white">Colony Editor</span>
            <div className="flex gap-1">
              {isRecording && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">REC</span>}
              {isAIMode && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">AI</span>}
              {isTimeLapse && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded border border-amber-500/30">{timeLapseSpeed}x</span>}
              {heatMapEnabled && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30">HEAT</span>}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Nodes</span>
              <span className="text-white font-mono font-bold">{stats.nodes}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Trails</span>
              <span className="text-white font-mono font-bold">{stats.edges}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Superhighways</span>
              <span className="text-blue-400 font-mono font-bold">{stats.superhighways}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Total Flow</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">{stats.totalFlow.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: "trail" }}
        fitView
        fitViewOptions={{ padding: 0.3, minZoom: 0.4, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        snapToGrid
        snapGrid={[20, 20]}
        nodeOrigin={[0.5, 0.5]}
        className="colony-graph"
        connectionLineStyle={{ stroke: "#3b82f6", strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.Bezier}
      >
        <Background color="#12121a" gap={40} size={1} />
        <Controls showZoom showFitView showInteractive className="!bg-[#0f0f14] !border-[#252538] !shadow-lg !rounded-lg" />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === "entry") return "#22c55e"
            const data = node.data as ChamberNodeData
            if (heatMapEnabled && data?.heatLevel) {
              if (data.heatLevel > 80) return "#ef4444"
              if (data.heatLevel > 60) return "#f97316"
              if (data.heatLevel > 40) return "#eab308"
              if (data.heatLevel > 20) return "#22c55e"
            }
            if (data?.isSuperhighway) return "#3b82f6"
            return "#334155"
          }}
          nodeStrokeColor="#0f0f14"
          nodeBorderRadius={8}
          maskColor="rgba(6, 6, 8, 0.85)"
          className="!bg-[#0a0a0f] !border-[#252538] !rounded-lg"
          pannable
          zoomable
        />

        {/* Node palette */}
        <Panel position="top-left" className="!mt-20 !ml-4">
          <NodePalette onDragStart={() => {}} />
        </Panel>

        {/* Control panel */}
        <Panel position="top-right" className="!mt-20 !mr-4">
          <ControlPanel
            isRecording={isRecording}
            isPlaying={isPlaying}
            isAIMode={isAIMode}
            isTimeLapse={isTimeLapse}
            heatMapEnabled={heatMapEnabled}
            signalHistory={signalHistory}
            onToggleRecord={() => setIsRecording(!isRecording)}
            onPlayback={playbackSignals}
            onToggleAI={() => setIsAIMode(!isAIMode)}
            onToggleTimeLapse={() => setIsTimeLapse(!isTimeLapse)}
            onToggleHeatMap={() => setHeatMapEnabled(!heatMapEnabled)}
            onSave={saveColony}
            onLoad={loadColony}
            onClearHistory={() => setSignalHistory([])}
            speed={timeLapseSpeed}
            onSpeedChange={setTimeLapseSpeed}
          />
        </Panel>

        {/* Instructions */}
        <Panel position="bottom-left" className="!m-4">
          <div className="bg-[#0a0a0f]/90 border border-[#252538] rounded-lg px-3 py-2 text-[10px] text-slate-500 space-y-1">
            <div><kbd className="px-1 bg-slate-800 rounded">drag handle</kbd> create trail</div>
            <div><kbd className="px-1 bg-slate-800 rounded">click edge</kbd> edit pheromone</div>
            <div><kbd className="px-1 bg-slate-800 rounded">double-click</kbd> inject signal</div>
            <div><kbd className="px-1 bg-slate-800 rounded">drag palette</kbd> spawn node</div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Celebrations */}
      {celebrations.map(c => (
        <CelebrationParticles
          key={c.id}
          x={c.x}
          y={c.y}
          onComplete={() => setCelebrations(prev => prev.filter(p => p.id !== c.id))}
        />
      ))}

      {/* Signal tracer */}
      {activeTracer && (
        <SignalTracer
          path={activeTracer.path}
          nodes={nodes}
          onComplete={() => setActiveTracer(null)}
        />
      )}

      {/* Pheromone Editor */}
      {edgeEditor && (
        <PheromoneEditor
          edgeId={edgeEditor.id}
          strength={edgeEditor.strength}
          position={edgeEditor.position}
          onClose={() => setEdgeEditor(null)}
          onChange={(strength) => updatePheromone(edgeEditor.id, strength)}
          onDelete={() => deleteEdge(edgeEditor.id)}
        />
      )}

      {/* Signal Injector */}
      {signalInjector && (
        <SignalInjector
          nodeId={signalInjector.nodeId}
          tasks={signalInjector.tasks}
          position={signalInjector.position}
          onClose={() => setSignalInjector(null)}
          onInject={(task) => injectSignal(signalInjector.nodeId, task)}
        />
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes particle-burst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        @keyframes sparkle {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// COLONY EDITOR - Wrapped with ReactFlowProvider
// ============================================================================

export function ColonyEditor(props: ColonyEditorProps) {
  return (
    <ReactFlowProvider>
      <ColonyEditorInner {...props} />
    </ReactFlowProvider>
  )
}

export default ColonyEditor
