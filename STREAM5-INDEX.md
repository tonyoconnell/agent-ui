# STREAM 5: Direct Manipulation / Interaction Layer — INDEX

**Status:** COMPLETE — Ready for integration (30 min)  
**Gestures:** 8 total (6 ready now, 2 deferred)  
**Code:** 270 lines of production-ready utilities  
**Docs:** 500+ lines of guides and reference

---

## Files (In Reading Order)

### Start Here
1. **`STREAM5-QUICK-START.md`** (100 lines) — 5 min read
   - Copy-paste integration steps
   - Step-by-step setup (6 easy steps)
   - For someone who just wants to get it done

### Deep Dive
2. **`STREAM5-COMPLETE.md`** (300 lines) — 15 min read
   - Full architecture and design
   - All 8 gestures explained with code
   - Testing checklist for each gesture
   - Signal flow diagram
   - For someone who wants to understand it

### Implementation Details
3. **`docs/STREAM5-implementation.md`** (200 lines) — 10 min read
   - Integration checklist
   - Signal API contract
   - Testing procedures
   - Dependencies and notes
   - For someone who needs to implement it

### Reference Code
4. **`src/components/graph/WorldGraph-STREAM5-patches.tsx`** (400 lines) — Copy paste
   - RenameInput component
   - FlowEdge enhancements
   - ActorNode enhancements
   - WorldGraph enhancements
   - For someone who needs the actual code snippets

### Production Ready
5. **`src/lib/useCanvasGestures.ts`** (180 lines) — Already imported
   - Gesture state management hook
   - All state types and handlers
   - Zero dependencies
   - Ready to use

6. **`src/lib/signalSender.ts`** (90 lines) — Already imported
   - Signal emission utilities
   - One function per gesture
   - Routes through existing `/api/signal`
   - Ready to use

---

## The 8 Gestures

| # | Name | Signal | Status | Effort |
|---|------|--------|--------|--------|
| 1 | Drag to Move | `world:move` | ✓ Ready | 3 lines |
| 2 | Rename | `world:rename` | ✓ Ready | 4 callbacks |
| 3 | Draw Path | `world:link` | Deferred | Handle wrapper |
| 4 | Weight Slider | `world:mark/warn` | ✓ Ready | 15 lines |
| 5 | Mark/Warn Btn | `world:mark/warn` | ✓ Ready | 2 buttons |
| 6 | Delete Key | `world:remove` | ✓ Ready | 8 lines |
| 7 | Group Lasso | `world:group` | Deferred | Modal + G-key |
| 8 | Pan/Zoom | (built-in) | ✓ Works | Already done |

**Ship STREAM 5a now:** 6 gestures (1, 2, 4, 5, 6, 8)  
**Add STREAM 5b later:** 2 gestures (3, 7)

---

## Integration Path (30 minutes)

```
5 min:  Read STREAM5-QUICK-START.md
2 min:  Add imports to WorldGraph.tsx
2 min:  Copy RenameInput component
10 min: Enhance FlowEdge (hover card + mark/warn + slider)
5 min:  Enhance ActorNode (rename + selection)
5 min:  Enhance WorldGraph (drag move + delete key)
1 min:  Save and verify TypeScript compiles
```

---

## File Locations

```
/Users/toc/Server/envelopes/
├── STREAM5-INDEX.md                  # This file
├── STREAM5-QUICK-START.md            # Start here (5 min)
├── STREAM5-COMPLETE.md               # Full reference (15 min)
├── docs/
│   └── STREAM5-implementation.md      # Technical guide (10 min)
└── src/
    ├── lib/
    │   ├── useCanvasGestures.ts       # Gesture state hook (180 lines)
    │   └── signalSender.ts            # Signal utilities (90 lines)
    └── components/graph/
        ├── WorldGraph.tsx             # (to be patched — 858 lines)
        └── WorldGraph-STREAM5-patches.tsx  # Code reference (400 lines)
```

---

## Who Should Read What

**I just want to implement it:**
→ Read `STREAM5-QUICK-START.md` (5 min)  
→ Copy code from `WorldGraph-STREAM5-patches.tsx`  
→ Integrate into WorldGraph (25 min)  
→ Test (5 min)

**I want to understand the design:**
→ Read `STREAM5-COMPLETE.md` (15 min)  
→ Review gesture spec in `docs/world-map-page.md` (original STREAM 5 spec)  
→ Then integrate using quick start

**I need to debug or modify:**
→ Read `docs/STREAM5-implementation.md` (10 min)  
→ Check signal contracts  
→ Review testing procedures

**I need the actual code:**
→ Copy from `src/components/graph/WorldGraph-STREAM5-patches.tsx`  
→ Paste into WorldGraph.tsx  
→ Done

---

## What You're Getting

**Utilities (Ready to Use)**
- `useCanvasGestures()` hook — centralized state management
- `signalMove()`, `signalRename()`, `signalMark()`, etc. — 7 signal senders
- `RenameInput` component — inline text editor for names

**Documentation**
- Quick start guide (5 min)
- Complete reference (15 min)
- Implementation guide (10 min)
- Code snippets (ready to copy-paste)

**Design**
- Signal contracts for all 8 gestures
- State management structure
- Event handlers and callbacks
- Debounce strategy

**Testing**
- Checklist for all 8 gestures
- Console logs to verify signals
- Step-by-step test procedures

---

## What You're NOT Getting

**Server changes:**
- No new API endpoints (use existing `/api/signal`)
- No database migrations (schema already supports it)
- No TypeDB changes (strength/resistance already there)

**UI changes:**
- No new pages or components beyond what's in patches
- No TypeDB query changes (read-only on query side)
- No authentication changes (client shows all, server enforces)

**Optional (can add later):**
- Gesture 3: Draw path (requires Handle enhancement)
- Gesture 7: Group lasso (requires modal + G-key)
- Ownership validation (server-side only)
- Undo/redo (TypeDB time-travel queries)

---

## Quick Checklist

Before starting integration:

- [ ] Read STREAM5-QUICK-START.md (5 min)
- [ ] Verify files exist (ls -lh command above)
- [ ] Have WorldGraph.tsx open in editor
- [ ] Have STREAM5-QUICK-START.md in second window
- [ ] Coffee ready (optional but recommended)

---

## Support

Everything you need is in the 4 documents:

| Question | Read | Time |
|----------|------|------|
| How do I integrate this? | STREAM5-QUICK-START.md | 5 min |
| What does gesture X do? | STREAM5-COMPLETE.md | 15 min |
| How do signals work? | docs/STREAM5-implementation.md | 10 min |
| Where's the code? | WorldGraph-STREAM5-patches.tsx | Copy |
| Where are the hooks? | src/lib/useCanvasGestures.ts | Read |
| Where are the senders? | src/lib/signalSender.ts | Read |

---

## Recap

**You have:**
- 2 production-ready utility files (270 lines)
- 4 documentation files (500+ lines)
- 1 code reference file (400 lines)
- Complete gesture system for WorldGraph

**Next step:**
1. Open STREAM5-QUICK-START.md
2. Follow 6-step setup
3. Test all 6 gestures (or all 8 if you add the deferred ones)
4. Ship it

**Effort:** 30 minutes  
**Risk:** Low (isolated, no API changes)  
**Status:** Ready to go

---

**Questions? Everything is documented above. Start with STREAM5-QUICK-START.md.**
