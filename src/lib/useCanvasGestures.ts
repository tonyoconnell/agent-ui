/**
 * useCanvasGestures — Gesture state management for STREAM 5
 *
 * Handles 8 direct manipulation gestures:
 * 1. Drag to move units
 * 2. Click to rename (inline edit)
 * 3. Draw path (drag from unit to unit)
 * 4. Weight path (sliders on hover card)
 * 5. Mark/Warn buttons
 * 6. Delete unit (key press)
 * 7. Group units (lasso + G)
 * 8. Pan + Zoom (built into ReactFlow)
 */

import { useCallback, useRef, useState } from 'react'

export interface PathDrawState {
  isDrawing: boolean
  from?: string
  fromX?: number
  fromY?: number
  toX?: number
  toY?: number
}

export interface RenameState {
  unitId?: string
  isEditing: boolean
}

export interface EdgeHoverState {
  edgeId?: string
  x?: number
  y?: number
}

export interface LassoState {
  isLassoing: boolean
  startX: number
  startY: number
  endX: number
  endY: number
  selectedIds: Set<string>
}

/**
 * useCanvasGestures — Central gesture state hook
 */
export function useCanvasGestures() {
  // 1. Drag to move (handled by ReactFlow's nodesDraggable + onNodesChange)
  // State lives in useNodesState — just listen for position updates

  // 2. Rename state
  const [rename, setRename] = useState<RenameState>({ isEditing: false })

  // 3. Path drawing state
  const [pathDraw, setPathDraw] = useState<PathDrawState>({ isDrawing: false })

  // 4. Edge hover (for weight sliders)
  const [edgeHover, setEdgeHover] = useState<EdgeHoverState>({})

  // 5. Path slider debounce (prevent spam signals)
  const sliderDebounceRef = useRef<Record<string, number>>({})

  // 6. Delete state (key press)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // 7. Lasso selection state
  const [lasso, setLasso] = useState<LassoState>({
    isLassoing: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    selectedIds: new Set(),
  })

  // Handlers for each gesture

  const startRename = useCallback((unitId: string) => {
    setRename({ unitId, isEditing: true })
  }, [])

  const cancelRename = useCallback(() => {
    setRename({ isEditing: false })
  }, [])

  const confirmRename = useCallback((unitId: string, newName: string) => {
    setRename({ isEditing: false })
    return newName // caller will emit signal
  }, [])

  const startPathDraw = useCallback((fromId: string, fromX: number, fromY: number) => {
    setPathDraw({
      isDrawing: true,
      from: fromId,
      fromX,
      fromY,
      toX: fromX,
      toY: fromY,
    })
  }, [])

  const updatePathDraw = useCallback((toX: number, toY: number) => {
    setPathDraw((prev) =>
      prev.isDrawing ? { ...prev, toX, toY } : prev
    )
  }, [])

  const cancelPathDraw = useCallback(() => {
    setPathDraw({ isDrawing: false })
  }, [])

  const completePathDraw = useCallback((toId: string) => {
    const result = pathDraw.from && toId ? { from: pathDraw.from, to: toId } : null
    setPathDraw({ isDrawing: false })
    return result // caller will emit signal
  }, [pathDraw])

  const startEdgeHover = useCallback((edgeId: string, x: number, y: number) => {
    setEdgeHover({ edgeId, x, y })
  }, [])

  const endEdgeHover = useCallback(() => {
    setEdgeHover({})
  }, [])

  const shouldDebounceSlider = useCallback((edgeId: string, delayMs = 250): boolean => {
    const now = Date.now()
    const last = sliderDebounceRef.current[edgeId] || 0
    if (now - last >= delayMs) {
      sliderDebounceRef.current[edgeId] = now
      return false // not debounced, safe to emit
    }
    return true // debounced, skip emit
  }, [])

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
  }, [])

  const deselectNode = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const startLasso = useCallback((startX: number, startY: number) => {
    setLasso({
      isLassoing: true,
      startX,
      startY,
      endX: startX,
      endY: startY,
      selectedIds: new Set(),
    })
  }, [])

  const updateLasso = useCallback((endX: number, endY: number) => {
    setLasso((prev) =>
      prev.isLassoing ? { ...prev, endX, endY } : prev
    )
  }, [])

  const completeLasso = useCallback(() => {
    const result = lasso.selectedIds.size > 0 ? Array.from(lasso.selectedIds) : []
    setLasso({
      isLassoing: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      selectedIds: new Set(),
    })
    return result
  }, [lasso])

  return {
    // Rename
    rename,
    startRename,
    cancelRename,
    confirmRename,

    // Path drawing
    pathDraw,
    startPathDraw,
    updatePathDraw,
    cancelPathDraw,
    completePathDraw,

    // Edge hover
    edgeHover,
    startEdgeHover,
    endEdgeHover,

    // Slider debounce
    shouldDebounceSlider,

    // Selection
    selectedNodeId,
    selectNode,
    deselectNode,

    // Lasso
    lasso,
    startLasso,
    updateLasso,
    completeLasso,
  }
}
