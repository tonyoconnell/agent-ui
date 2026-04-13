/**
 * STREAM 5 PATCHES FOR WorldGraph.tsx
 *
 * This file contains the code snippets needed to add the 8 gestures to WorldGraph.
 * Copy these into the appropriate locations in WorldGraph.tsx.
 *
 * Version: 1.0
 * Target: src/components/graph/WorldGraph.tsx
 */

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS TO ADD (at top of file, after existing imports)
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
// import { useCallback } from "react"  // Add useCallback if not already imported
// import { useCanvasGestures } from "@/lib/useCanvasGestures"
// import {
//   signalMove,
//   signalRename,
//   signalLink,
//   signalMark,
//   signalWarn,
//   signalRemove,
//   signalGroup,
// } from "@/lib/signalSender"

// ═══════════════════════════════════════════════════════════════════════════════
// RENAME INPUT COMPONENT (add after type definitions)
// ═══════════════════════════════════════════════════════════════════════════════

export function RenameInput({
  initialValue,
  onSubmit,
  onCancel,
  skin,
}: {
  initialValue: string
  onSubmit: (newName: string) => void
  onCancel: () => void
  skin: any
}) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit(value)
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSubmit(value)}
      className="text-white font-medium text-sm px-1 py-0 rounded outline-none flex-1 min-w-0"
      style={{
        backgroundColor: `${skin.colors.primary}40`,
        border: `1px solid ${skin.colors.primary}`,
        color: 'white',
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCE FlowEdge COMPONENT (replace the entire function or patch the specific areas)
// ═══════════════════════════════════════════════════════════════════════════════

// Add these handlers inside FlowEdge function:

export const FlowEdgeEnhancements = `
function FlowEdge(props: EdgeProps) {
  const { skin, t } = useSkin()
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props
  const edgeData = data as FlowEdgeData | undefined
  const strength = edgeData?.strength || 0
  const resistance = edgeData?.resistance || 0  // ADD THIS
  const isOpen = edgeData?.isOpen || false
  const fromTask = edgeData?.fromTask || ""
  const toTask = edgeData?.toTask || ""

  // GESTURE 4+5: Add hover card state and handlers
  const [showHoverCard, setShowHoverCard] = useState(false)
  const gestures = useCanvasGestures()  // Initialize gestures hook

  // ... existing code ...

  const handleMouseEnter = useCallback(() => {
    setShowHoverCard(true)
    gestures.startEdgeHover(id, labelX, labelY)
  }, [id, labelX, labelY, gestures])

  const handleMouseLeave = useCallback(() => {
    setShowHoverCard(false)
    gestures.endEdgeHover()
  }, [gestures])

  const handleMark = useCallback(async () => {
    const [from, to] = id.split("→")
    if (from && to && !gestures.shouldDebounceSlider(id)) {
      await signalMark(from, to)
    }
  }, [id, gestures])

  const handleWarn = useCallback(async () => {
    const [from, to] = id.split("→")
    if (from && to && !gestures.shouldDebounceSlider(id)) {
      await signalWarn(from, to)
    }
  }, [id, gestures])

  // ... rest of existing code ...

  // REPLACE the main edge rendering section with this:
  return (
    <g className="react-flow__edge-path">
      {/* Glow layer */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 14}
        strokeOpacity={glowOpacity}
        className={isOpen ? "animate-pulse" : ""}
      />

      {/* Main flow (clickable for hover card) */}
      <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <BaseEdge
          id={id}
          path={path}
          style={{
            stroke: color,
            strokeWidth,
            strokeLinecap: "round",
            filter: isOpen ? \`drop-shadow(0 0 8px \${color})\` : undefined,
          }}
        />
      </g>

      {/* Particles — metaphor-specific animation */}
      {particleCount > 0 && (
        <g className="flow-particles">
          {Array.from({ length: particleCount }).map((_, i) => (
            <circle
              key={i}
              r={particleSize - i * 0.5}
              fill={skin.colors.success}
              opacity={1 - i * 0.25}
            >
              <animateMotion
                dur={particleDuration}
                repeatCount="indefinite"
                path={path}
                begin={\`\${i * 0.3}s\`}
              />
            </circle>
          ))}
        </g>
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          className={cn(
            "absolute pointer-events-none px-2 py-1 rounded-lg text-[10px] font-mono",
            "transform -translate-x-1/2 -translate-y-1/2 transition-all border",
            selected && "ring-2"
          )}
          style={{
            left: labelX,
            top: labelY,
            backgroundColor: isOpen ? skin.colors.success + "25" : skin.colors.surface,
            borderColor: isOpen ? skin.colors.success + "50" : skin.colors.muted + "30",
            color: isOpen ? skin.colors.success : skin.colors.muted,
            boxShadow: isOpen ? \`0 0 15px \${skin.colors.success}30\` : undefined,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span style={{ color: skin.colors.muted }}>{fromTask}</span>
          <span className="mx-1" style={{ color: skin.colors.muted + "80" }}>→</span>
          <span style={{ color: isOpen ? skin.colors.success : skin.colors.secondary }}>{toTask}</span>
          <span
            className="ml-2 px-1.5 py-0.5 rounded text-[9px]"
            style={{
              backgroundColor: isOpen ? skin.colors.success + "30" : skin.colors.muted + "20",
              color: isOpen ? skin.colors.success : skin.colors.muted,
            }}
          >
            {strength.toFixed(0)}
          </span>
        </div>
      </EdgeLabelRenderer>

      {/* Hover card with mark/warn buttons and sliders (GESTURES 4, 5) */}
      {showHoverCard && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-auto px-3 py-2 rounded-lg text-[10px] border backdrop-blur-sm"
            style={{
              left: labelX,
              top: labelY + 30,
              backgroundColor: skin.colors.surface + "e0",
              borderColor: skin.colors.muted + "40",
              zIndex: 50,
              transform: "translateX(-50%)",
            }}
          >
            {/* Mark/Warn buttons (GESTURE 5) */}
            <div className="flex gap-1 mb-2">
              <button
                className="px-2 py-1 rounded text-[9px] font-medium transition-all hover:scale-110"
                style={{
                  backgroundColor: skin.colors.success + "30",
                  color: skin.colors.success,
                  border: \`1px solid \${skin.colors.success}50\`,
                }}
                onClick={handleMark}
                title="Mark path (+1 strength)"
              >
                +
              </button>
              <button
                className="px-2 py-1 rounded text-[9px] font-medium transition-all hover:scale-110"
                style={{
                  backgroundColor: skin.colors.primary + "30",
                  color: skin.colors.primary,
                  border: \`1px solid \${skin.colors.primary}50\`,
                }}
                onClick={handleWarn}
                title="Warn path (+1 resistance)"
              >
                !
              </button>
            </div>

            {/* Strength slider (GESTURE 4) */}
            <div className="mb-2">
              <label className="text-[8px]" style={{ color: skin.colors.muted }}>strength</label>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.min(strength, 100)}
                onChange={(e) => {
                  const newVal = parseInt(e.currentTarget.value)
                  const oldVal = Math.round(strength)
                  if (newVal > oldVal) {
                    handleMark()
                  } else if (newVal < oldVal) {
                    handleWarn()
                  }
                }}
                className="w-full h-1 rounded"
                style={{
                  accentColor: skin.colors.success,
                }}
              />
              <div className="text-[8px] text-right" style={{ color: skin.colors.muted }}>
                {strength.toFixed(0)}
              </div>
            </div>

            {/* Resistance display */}
            <div>
              <label className="text-[8px]" style={{ color: skin.colors.muted }}>resistance</label>
              <div className="text-[8px] text-right" style={{ color: skin.colors.primary }}>
                {resistance.toFixed(0)}
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  )
}
`

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCE ActorNode COMPONENT (add rename support - GESTURE 2)
// ═══════════════════════════════════════════════════════════════════════════════

export const ActorNodeEnhancements = `
function ActorNode({ data, selected, isConnecting }: NodeProps) {
  const { skin, t } = useSkin()
  const [expanded, setExpanded] = useState(false)
  const gestures = useCanvasGestures()  // Initialize gestures hook
  const d = data as ActorNodeData
  const isOpen = d.isOpen
  const totalStrength = d.incoming.strength + d.outgoing.strength

  // GESTURE 2: Double-click to rename
  const handleDoubleClick = useCallback(() => {
    gestures.startRename(d.id)
  }, [d.id, gestures])

  const handleRenameSubmit = useCallback(
    async (newName: string) => {
      if (newName && newName !== d.name) {
        await signalRename(d.id, newName)
      }
      gestures.cancelRename()
    },
    [d.id, d.name, gestures]
  )

  // GESTURE 6: Select on click for delete support
  const handleNodeClick = useCallback(() => {
    setExpanded(!expanded)
    gestures.selectNode(d.id)
  }, [gestures])

  return (
    <div
      onClick={handleNodeClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "rounded-xl border transition-all duration-300 cursor-pointer select-none",
        "w-[190px]"
      )}
      style={{
        background: \`linear-gradient(to bottom, \${skin.colors.surface}, \${skin.colors.background})\`,
        borderColor: selected
          ? skin.colors.primary
          : isOpen
          ? skin.colors.success + "60"
          : skin.colors.muted + "40",
        boxShadow: isOpen ? \`0 0 25px \${skin.colors.success}30\` : undefined,
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 12,
          height: 12,
          border: \`2px solid \${skin.colors.surface}\`,
          backgroundColor: d.incoming.strength > 0 ? skin.colors.primary : skin.colors.muted,
          left: -6,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 12,
          height: 12,
          border: \`2px solid \${skin.colors.surface}\`,
          backgroundColor: d.outgoing.strength > 0 ? skin.colors.success : skin.colors.muted,
          right: -6,
        }}
      />

      {/* Header with rename support (GESTURE 2) */}
      <div
        className="px-3 py-2.5 border-b"
        style={{ borderColor: skin.colors.muted + "30" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Metaphor icon */}
            <span className="text-lg flex-shrink-0">{skin.icons.actor}</span>
            {/* Status indicator */}
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: isOpen ? skin.colors.success : skin.colors.muted,
                boxShadow: isOpen ? \`0 0 8px \${skin.colors.success}\` : undefined,
              }}
            >
              {isOpen && (
                <div
                  className="w-full h-full rounded-full animate-ping"
                  style={{ backgroundColor: skin.colors.success }}
                />
              )}
            </div>
            {/* Name or inline edit (GESTURE 2) */}
            {gestures.rename.isEditing && gestures.rename.unitId === d.id ? (
              <RenameInput
                initialValue={d.name}
                onSubmit={handleRenameSubmit}
                onCancel={() => gestures.cancelRename()}
                skin={skin}
              />
            ) : (
              <span
                className="text-white font-medium text-sm truncate cursor-text hover:opacity-80"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  handleDoubleClick()
                }}
                title="Double-click to rename"
              >
                {d.name}
              </span>
            )}
          </div>
          {totalStrength > 0 && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                backgroundColor: isOpen ? skin.colors.success + "20" : skin.colors.muted + "20",
                color: isOpen ? skin.colors.success : skin.colors.muted,
              }}
            >
              {totalStrength.toFixed(0)}
            </span>
          )}
        </div>
      </div>

      {/* ... rest of ActorNode code stays the same ... */}
    </div>
  )
}
`

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD GRAPH COMPONENT ENHANCEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const WorldGraphEnhancements = `
export function WorldGraph({ world, agents, highways, onSelectAgent, paths, groups }: WorldGraphProps) {
  const { skin } = useSkin()
  const gestures = useCanvasGestures()  // Initialize gestures hook
  const canvasRef = useRef<HTMLDivElement>(null)

  // ... existing code ...

  // GESTURE 1: Handle node drag end — signal position change
  const handleNodeDragStop = useCallback(
    async (event: any, node: Node) => {
      if (node.type === "actor") {
        await signalMove(node.id, Math.round(node.position.x), Math.round(node.position.y))
      }
    },
    []
  )

  // GESTURE 6: Delete unit on key press
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "Delete" && gestures.selectedNodeId && gestures.selectedNodeId !== "entry") {
        e.preventDefault()
        await signalRemove(gestures.selectedNodeId)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gestures.selectedNodeId])

  // ... existing setup code ...

  return (
    <div
      ref={canvasRef}
      className="h-full w-full"
      style={{ backgroundColor: skin.colors.background }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}  // ADD THIS
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        panOnDrag  // GESTURE 8
        zoomOnScroll  // GESTURE 8
        minZoom={0.3}
        maxZoom={2}
        onNodeClick={(event, node) => {
          // GESTURE 6: Track selected node
          gestures.selectNode(node.id)
          if (node.type === "actor" && onSelectAgent) {
            onSelectAgent(node.id)
          }
        }}
      >
        <Background
          color={skin.colors.muted + "30"}
          gap={30}
          size={1}
        />
        <Controls
          style={{
            backgroundColor: skin.colors.surface,
            borderColor: skin.colors.muted + "30",
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "entry") return skin.colors.success
            const d = node.data as ActorNodeData
            return d?.isOpen ? skin.colors.success : skin.colors.primary
          }}
          maskColor={skin.colors.background + "90"}
          style={{
            backgroundColor: skin.colors.surface,
            borderColor: skin.colors.muted + "30",
          }}
        />
      </ReactFlow>
    </div>
  )
}
`

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY OF CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

export const INTEGRATION_SUMMARY = `
STREAM 5 INTEGRATION CHECKLIST
==============================

1. IMPORTS (top of file)
   [ ] Add: import { useCallback } from "react"
   [ ] Add: import { useCanvasGestures } from "@/lib/useCanvasGestures"
   [ ] Add: import { signalMove, signalRename, signalLink, ... } from "@/lib/signalSender"

2. NEW COMPONENTS
   [ ] Add RenameInput component function

3. FlowEdge ENHANCEMENTS
   [ ] Add showHoverCard state
   [ ] Add gestures hook initialization
   [ ] Add handleMouseEnter/Leave callbacks
   [ ] Add handleMark/Warn callbacks
   [ ] Update return JSX with hover card rendering
   [ ] Add resistance to edgeData destructuring

4. ActorNode ENHANCEMENTS
   [ ] Add gestures hook initialization
   [ ] Add handleDoubleClick callback
   [ ] Add handleRenameSubmit callback
   [ ] Add handleNodeClick callback
   [ ] Add onDoubleClick={handleDoubleClick} to div
   [ ] Update name rendering to show RenameInput when editing
   [ ] Add title/help text to name span

5. WorldGraph COMPONENT
   [ ] Add gestures hook initialization
   [ ] Add canvasRef to root div
   [ ] Add handleNodeDragStop callback
   [ ] Add Delete key listener useEffect
   [ ] Add onNodeDragStop={handleNodeDragStop} to ReactFlow
   [ ] Update onNodeClick to call gestures.selectNode()

6. TESTING
   [ ] Test drag move — verify signal sent to /api/signal
   [ ] Test rename — double-click name, edit, enter
   [ ] Test mark/warn — hover edge, click buttons
   [ ] Test delete — select node, press Delete key
   [ ] Test pan/zoom — already working

FILES CREATED:
  ✓ src/lib/useCanvasGestures.ts — 180 lines, ready
  ✓ src/lib/signalSender.ts — 90 lines, ready
  ✓ src/components/graph/WorldGraph-STREAM5-patches.tsx — this file, snippets only

ESTIMATED EFFORT:
  30 mins to integrate all patches
  15 mins to test all 8 gestures
  5 mins to verify signals in console
`
