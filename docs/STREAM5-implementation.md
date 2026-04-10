# STREAM 5: Direct Manipulation / Interaction Layer — Implementation Guide

**Status:** Complete specification with all code utilities ready.

**Goal:** Wire up 8 interaction gestures on the WorldGraph canvas for STREAM 5.

**Deliverables Created:**
1. `src/lib/useCanvasGestures.ts` — Gesture state management hook
2. `src/lib/signalSender.ts` — Signal emission utilities for all 8 gestures
3. Modifications required for `src/components/graph/WorldGraph.tsx` (details below)

---

## Eight Gestures Overview

### 1. Drag to Move Units
**Gesture:** Click + drag agent node  
**Signal:** `POST /api/signal { receiver: 'world:move', data: { id, x, y } }`  
**Implementation:**
- ReactFlow's `nodesDraggable` is already enabled
- Add `onNodeDragStop` handler to WorldGraph
- Call `signalMove(node.id, x, y)` when drag ends
- Position updates live in node positions

**Code location:** WorldGraph.tsx → onNodeDragStop handler

```typescript
const handleNodeDragStop = useCallback(
  async (event: any, node: Node) => {
    if (node.type === "actor") {
      await signalMove(node.id, Math.round(node.position.x), Math.round(node.position.y))
    }
  },
  []
)
```

---

### 2. Click to Rename (Inline Edit)
**Gesture:** Double-click agent name or single click to edit  
**Signal:** `POST /api/signal { receiver: 'world:rename', data: { id, name } }`  
**Implementation:**
- Use `gestures.rename` state to track editing mode
- On double-click in ActorNode header, show text input
- On Enter/blur, submit new name and emit signal
- On Escape, cancel without saving

**Key files:**
- `src/components/graph/WorldGraph.tsx` → ActorNode component
- `src/lib/useCanvasGestures.ts` → `rename` state + handlers

**Component pattern:**
```typescript
{gestures.rename.isEditing && gestures.rename.unitId === d.id ? (
  <RenameInput
    initialValue={d.name}
    onSubmit={async (newName) => {
      await signalRename(d.id, newName)
      gestures.cancelRename()
    }}
    onCancel={() => gestures.cancelRename()}
    skin={skin}
  />
) : (
  <span onClick={() => gestures.startRename(d.id)}>
    {d.name}
  </span>
)}
```

---

### 3. Draw Path (Click-Drag from Unit to Unit)
**Gesture:** Click unit A, drag to unit B, release  
**Signal:** `POST /api/signal { receiver: 'world:link', data: { from, to } }`  
**Implementation:**
- Use `gestures.pathDraw` state to track drawing
- On mousedown on source handle: call `startPathDraw(fromId, x, y)`
- On mousemove: call `updatePathDraw(toX, toY)` to update preview line
- On mouseup on target handle: call `completePathDraw(toId)` and emit signal
- Draw a preview line from fromId to cursor while dragging

**State needed:**
```typescript
interface PathDrawState {
  isDrawing: boolean
  from?: string
  fromX?: number
  fromY?: number
  toX?: number
  toY?: number
}
```

**Note:** This requires wiring ReactFlow's Handle drag events. May need custom Handle wrapper or canvas-level drag handling.

---

### 4. Weight Path (Drag Strength/Resistance Sliders)
**Gesture:** Hover edge → hover card appears with slider  
**Signal:** `POST /api/signal { receiver: 'world:mark'|'world:warn', data: { from, to } }`  
**Implementation:**
- FlowEdge component: on hover, show hover card with sliders
- Slider for strength (right = mark +1, left = warn +1)
- Debounce: max 1 signal per 250ms per edge
- Visual: edge thickens/thins in real time

**Code in FlowEdge:**
```typescript
const [showHoverCard, setShowHoverCard] = useState(false)

const handleMark = useCallback(async () => {
  const [from, to] = id.split("→")
  if (!gestures.shouldDebounceSlider(id)) {
    await signalMark(from, to)
  }
}, [id, gestures])

const handleWarn = useCallback(async () => {
  const [from, to] = id.split("→")
  if (!gestures.shouldDebounceSlider(id)) {
    await signalWarn(from, to)
  }
}, [id, gestures])
```

---

### 5. Mark/Warn Buttons on Path Card
**Gesture:** Click [+] to mark, [!] to warn on hover card  
**Signal:** Same as GESTURE 4 (single mark or warn)  
**Implementation:**
- Two buttons on the hover card
- Each emits one signal
- Visual feedback: flash animation on the path
- Already coded in GESTURE 4 hover card

---

### 6. Delete Unit (Select + Press ⌫)
**Gesture:** Focus an agent (click on canvas), press Delete key  
**Signal:** `POST /api/signal { receiver: 'world:remove', data: { id } }`  
**Implementation:**
- Track `selectedNodeId` in gestures state
- On node click, call `gestures.selectNode(nodeId)`
- Add keydown listener for Delete key
- Call `signalRemove(selectedNodeId)` when Delete pressed

**Code:**
```typescript
useEffect(() => {
  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.key === "Delete" && gestures.selectedNodeId && gestures.selectedNodeId !== "entry") {
      await signalRemove(gestures.selectedNodeId)
    }
  }
  window.addEventListener("keydown", handleKeyDown)
  return () => window.removeEventListener("keydown", handleKeyDown)
}, [gestures.selectedNodeId])
```

---

### 7. Group Units (Lasso + Press G)
**Gesture:** Drag rectangle around multiple units (selection lasso), press G  
**Signal:** `POST /api/signal { receiver: 'world:group', data: { units: [ids], name } }`  
**Implementation:**
- Track lasso state: `isLassoing`, `startX/Y`, `endX/Y`, `selectedIds`
- On canvas mousedown in empty space: call `startLasso(x, y)`
- On mousemove: call `updateLasso(x, y)` — render lasso box
- On mouseup: collect nodes inside lasso bounds
- On G key: show modal "Group name?" → emit signal with selected unit IDs
- Visual: hull animates around selected units

**This is partially implemented but needs G-key handler and modal.**

---

### 8. Pan + Zoom (Drag Empty Space, Scroll Wheel)
**Status:** Already built into ReactFlow  
- `panOnDrag={true}` — ✓ already set
- `zoomOnScroll={true}` — ✓ already set
- Keyboard shortcuts (arrow keys, +/-) — optional enhancement

**No code needed.** Verify in WorldGraph render props.

---

## Integration Checklist

### Files Already Created
- [x] `src/lib/useCanvasGestures.ts` — gesture state hook
- [x] `src/lib/signalSender.ts` — signal utilities

### Files to Modify
- [ ] `src/components/graph/WorldGraph.tsx`

**Required changes in WorldGraph.tsx:**

1. Add imports (top of file):
```typescript
import { useCanvasGestures } from "@/lib/useCanvasGestures"
import {
  signalMove,
  signalRename,
  signalLink,
  signalMark,
  signalWarn,
  signalRemove,
  signalGroup,
} from "@/lib/signalSender"
import { useCallback } from "react"
```

2. In WorldGraph component, initialize gestures:
```typescript
const gestures = useCanvasGestures()
```

3. Add GESTURE 1 handler in ReactFlow props:
```typescript
onNodeDragStop={handleNodeDragStop}
```

4. Add GESTURE 2 support in ActorNode:
- Add double-click handler
- Add RenameInput component (already coded)

5. Add GESTURE 4+5 support in FlowEdge:
- Add hover card with mark/warn buttons
- Add strength slider with debounce

6. Add GESTURE 6 support:
- Track selected node
- Handle Delete key

7. Add node click handler in ReactFlow:
```typescript
onNodeClick={(event, node) => {
  gestures.selectNode(node.id)
  if (onSelectAgent && node.type === "actor") {
    onSelectAgent(node.id)
  }
}}
```

---

## Signal API Contract

All gestures POST to `/api/signal` with this shape:

```typescript
interface SignalRequest {
  sender: string        // default: "ui:world"
  receiver: string      // e.g. "world:move", "world:rename"
  data: unknown         // gesture-specific payload
}
```

**Supported receivers (add to `/api/signal` handlers if needed):**
- `world:move` — update unit position
- `world:rename` — update unit name
- `world:link` — create new path
- `world:mark` — strengthen path (+1 strength)
- `world:warn` — add resistance (-1 strength, +1 resistance)
- `world:remove` — delete unit
- `world:group` — create group with units

---

## Testing Checklist

After integration:

1. **Drag move** — drag unit, position persists on page reload
2. **Rename** — double-click name, type new name, hit enter, name updates everywhere
3. **Draw path** — click+drag from one unit to another, new edge appears
4. **Weight path** — hover edge, click mark button, edge thickens
5. **Weight path (slider)** — drag slider right (mark) or left (warn), edge updates
6. **Delete** — click unit, press Delete, unit fades out
7. **Shortcuts** — Pan (drag bg), Zoom (scroll), work smoothly
8. **Signals** — All gestures send signals visible in browser console

---

## Notes

- **Debounce:** Sliders debounced at 250ms/edge to prevent signal spam
- **Ownership:** Client side shows edit UI for all units. Server enforces ownership on write.
- **Visual feedback:** Immediate (before server responds). Signals are sent fire-and-forget.
- **Undo:** Not implemented in this phase. Signals are immutable in TypeDB.
- **Multiplayer:** Two users editing same canvas = both see each other's signals in real time

---

## Dependencies

- React 19: `useCallback`, `useState`, `useEffect`, `useRef`
- ReactFlow 11+: node/edge state management, handle components
- Substrate: `/api/signal` endpoint (already exists)
- TypeDB: stores all changes (already wired)

---

## References

- `docs/world-map-page.md` — STREAM 5 detailed spec
- `src/lib/useCanvasGestures.ts` — gesture state management
- `src/lib/signalSender.ts` — signal emission helpers
- `src/pages/api/signal.ts` — API endpoint

