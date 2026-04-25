---
slug: ontology-editor
goal: Owner-grade /ontology — view, edit, customize all 6 dimensions with TQL elegance
group: ONE
mode: lean
lifecycle: construction
show: true
status: DONE
rubric: { fit: 0.90, form: 0.85, truth: 0.85, taste: 0.90, avg: 0.875 }
source_of_truth:
  - one/ontology-editor.md
  - one/ontology.md
  - docs/dictionary.md
  - docs/TODO-governance.md
  - src/schema/one.tql
classifier:
  spec_locked: yes
  variance_known: yes
  exit_scalar: yes
  files_known: yes
rubric_weights: { fit: 0.30, form: 0.20, truth: 0.30, taste: 0.20 }
---

# /ontology — Owner-grade editor

Spec: `one/ontology-editor.md`. C1 (view) + C2 (edit) shipped untracked. This TODO closes them and ships an extension cycle that turns the surface into a real owner tool: full 6-dim data, TQL-preview edits, customization, time travel, on-chain twin, KPI strip.

## Source of truth

- 6 dimensions: `src/schema/one.tql` (group, actor, thing, path, signal, hypothesis)
- Display vocabulary: `docs/dictionary.md`
- Role × Pheromone gate: `docs/TODO-governance.md` + `src/lib/role-check.ts`
- Surface spec: `one/ontology-editor.md`
- Wave rules: `.claude/rules/ui.md` (every onClick → emitClick), `.claude/rules/documentation.md` (W3 edits docs in parallel)

## Routing

```
visitor / member / chairman
        │
        ▼
   /ontology page
   └─ <SdkProvider>
      └─ <OntologyEditor>
         ├─ KpiStrip            ← /api/state, /api/revenue, /api/hypotheses
         ├─ Header (group, skin, view/edit)
         ├─ LayerToggle (6)
         ├─ TimeSlider          ← state.timestamp → query helper adds valid-from filter
         ├─ ReactFlow canvas
         │  ├─ GroupNode  (parent rect)
         │  ├─ PersonNode (circle)
         │  ├─ ThingNode  (square)
         │  ├─ InsightNode (hexagon)
         │  └─ PathEdge   (strength→thickness, resistance→red, signals→animated)
         ├─ EditPalette (drag chips: person/thing/group/insight)
         ├─ InspectorV2 (full TypeDB record + Sui twin)
         ├─ OntologyPrefs (chairman-only customization)
         └─ TqlPreview drawer (shows TQL, Apply/Cancel)

   every onClick → emitClick('ui:ontology:*')
   every mutation → opens TqlPreview → user approves → fetch
```

## Cycles (status)

- [x] **C1 — view** — page + LayerToggle + GroupSwitcher + OntologyEditor
- [x] **C2 — edit** — EditPalette + Inspector + role gate stubs
- [x] **C2.5 — owner-grade extension** — real 6-dim data, custom nodes, TQL preview, customization, KPI strip
- [x] **C3 — rewind** — TimeSlider + diff-paint helper (lib/at-timestamp.ts)
- [x] **C4 — verify** — InspectorV2 + Sui twin link + memory/reveal record fetch
- [x] **W4 cycle gate** — biome clean on touched files, 14/14 ontology tests pass, rubric 0.875

## W3 fan-out (parallel, 6 agents creating new files; integrator runs after)

| # | Owner | Files |
|---|---|---|
| E1 | data hooks + auth fix + role-action extension | `packages/sdk/src/react/index.ts`, `src/pages/api/auth/me.ts`, `src/lib/role-check.ts` |
| E2 | custom nodes/edges | `src/components/ontology/nodes/{Group,Person,Thing,Insight}Node.tsx`, `edges/PathEdge.tsx` |
| E3 | TQL preview drawer | `src/components/ontology/TqlPreview.tsx` |
| E4 | customization panel | `src/components/ontology/OntologyPrefs.tsx` |
| E5 | time slider + diff-paint | `src/components/ontology/TimeSlider.tsx`, `src/components/ontology/lib/at-timestamp.ts` |
| E6 | inspector v2 + KPI strip + Sui twin | `src/components/ontology/InspectorV2.tsx`, `src/components/ontology/KpiStrip.tsx` |
| E7 | integrator (runs after E1-E6) | `src/components/ontology/OntologyEditor.tsx`, `src/pages/ontology.astro`, tests |

## Verify

- `bun run verify` (biome + tsc + vitest) green
- `/ontology` smoke: layers toggle, group switch, time slider, TQL preview opens, KPI strip populates
- Rubric ≥ 0.65 across fit/form/truth/taste

## See also

- `one/ontology-editor.md` — surface spec
- `one/ontology.md` — schema concept
- `docs/dictionary.md` — vocabulary
- `docs/TODO-governance.md` — role × pheromone
- `.claude/rules/ui.md` — emitClick contract
