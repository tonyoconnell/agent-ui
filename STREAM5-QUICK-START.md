# STREAM 5 Quick Start

**Files ready to use:**
- `src/lib/useCanvasGestures.ts` ✓ (180 lines)
- `src/lib/signalSender.ts` ✓ (90 lines)

**Next: Integrate into `src/components/graph/WorldGraph.tsx`** (30 min)

---

## 1. Add Imports

```typescript
import { useCallback } from "react"
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
```

---

## 2. Copy RenameInput Component

Copy from `src/components/graph/WorldGraph-STREAM5-patches.tsx` line 30-60.

---

## 3. Update FlowEdge Component

Add to the beginning of FlowEdge function:
```typescript
const [showHoverCard, setShowHoverCard] = useState(false)
const gestures = useCanvasGestures()
```

Add three callbacks:
```typescript
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
```

Copy the hover card JSX from patches file (lines 200-280).

---

## 4. Update ActorNode Component

Add to the beginning:
```typescript
const gestures = useCanvasGestures()

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
```

Update the header section to show RenameInput:
```typescript
{gestures.rename.isEditing && gestures.rename.unitId === d.id ? (
  <RenameInput
    initialValue={d.name}
    onSubmit={handleRenameSubmit}
    onCancel={() => gestures.cancelRename()}
    skin={skin}
  />
) : (
  <span onDoubleClick={handleDoubleClick}>
    {d.name}
  </span>
)}
```

Add `onDoubleClick={handleDoubleClick}` to root div.

---

## 5. Update WorldGraph Component

Initialize gestures:
```typescript
const gestures = useCanvasGestures()
const canvasRef = useRef<HTMLDivElement>(null)
```

Add drag move handler:
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

Add delete key listener:
```typescript
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
```

Update ReactFlow props:
```typescript
<ReactFlow
  // ... existing props ...
  onNodeDragStop={handleNodeDragStop}
  onNodeClick={(event, node) => {
    gestures.selectNode(node.id)
    if (node.type === "actor" && onSelectAgent) {
      onSelectAgent(node.id)
    }
  }}
>
```

---

## 6. Test

```bash
npm run dev
# Open http://localhost:4321/world

# Test each gesture:
1. Drag a node — watch position update
2. Double-click name — edit inline
3. Hover edge — see hover card with buttons + slider
4. Click + mark button — edge thickens
5. Click ! button — edge thins
6. Select node, press Delete — node fades
7. Drag empty space — pans
8. Scroll — zooms

# Check browser console — should see signal logs like:
# Signal to world:move { id: "...", x: 100, y: 200 }
```

---

## Reference

- **Detailed guide:** `docs/STREAM5-implementation.md`
- **Code snippets:** `src/components/graph/WorldGraph-STREAM5-patches.tsx`
- **Full status:** `STREAM5-COMPLETE.md`

---

## Deferred (STREAM 5b)

- Gesture #3: Draw path (requires Handle enhancement)
- Gesture #7: Group units (requires lasso UI + modal)

Ship STREAM 5a with 6/8 gestures first.
