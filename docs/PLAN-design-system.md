# PLAN-design-system.md — Adopt ONE/web Design System as Source of Truth

**Source of truth:** `../ONE/web/` — the design system, verbatim.
**Target:** envelopes consumes it. Zero divergence. Zero local forks.
**Goal:** One elegant design system, defined in ONE, expressed as **6 brand tokens → full shadcn palette**, stable across every Thing (product, course, token, agent) and every consumer repo.

**Ontology anchor:** `src/schema/one.tql` dimension 3 (Things) — a Thing may carry a `brand` attribute (6 HSL triples). Everything downstream is derived.

---

## The Core Insight

The design system has **two layers**. The elegance is in the separation.

```
    BRAND LAYER (6 tokens)          SHADCN LAYER (~24 tokens)
    ──────────────────────          ─────────────────────────
    background   foreground         --color-background    --color-muted
    font         primary            --color-foreground    --color-muted-foreground
    secondary    tertiary           --color-card          --color-accent
                                    --color-card-fg       --color-accent-fg
                                    --color-popover       --color-border
    ↑ extractable from any site     --color-popover-fg    --color-input
    ↑ Thing-level override          --color-primary       --color-ring
    ↑ frozen at v1.0                --color-primary-fg    --color-destructive
                                    --color-secondary     --color-sidebar-*
                                    --color-secondary-fg  --color-chart-*
                                    --color-tertiary      …
                                    --color-tertiary-fg
                                         ↑ derived, not authored
```

**Users author 6. The system derives 24+.** Every shadcn primitive reads from the derived layer. Every Thing overrides the 6 and inherits a fully-themed UI.

---

## The Mapping Contract (LOCKED v1.0)

This is the stable contract. It cannot change without a major version bump.

| Brand token     | Light value   | Dark value    | Drives these shadcn vars |
|-----------------|---------------|---------------|--------------------------|
| `background`    | `0 0% 93.3%`  | `0 0% 10%`    | `--color-card`, `--color-popover`, `--color-sidebar-background` |
| `foreground`    | `0 0% 100%`   | `0 0% 13%`    | `--color-background` (the page surface showing through) |
| `font`          | `0 0% 13%`    | `0 0% 100%`   | `--color-foreground`, `--color-card-foreground`, `--color-popover-foreground`, `--color-sidebar-foreground` |
| `primary`       | `216 55% 25%` | `216 55% 25%` | `--color-primary`, `--color-sidebar-primary`, `--color-ring`, `--color-chart-1` |
| `secondary`     | `219 14% 28%` | `219 14% 32%` | `--color-secondary`, `--color-sidebar-accent`, `--color-chart-3` |
| `tertiary`      | `105 22% 25%` | `105 22% 35%` | `--color-tertiary`, `--color-accent`, `--color-chart-2` |

**Derived automatically:**
- Every `*-foreground` pair computed from contrast against its companion
- `border`, `input`, `muted`, `muted-foreground` derived from `font` at reduced opacity/luminance
- `destructive` is global (not part of the 6) — lives outside brand
- `urgency-stock/offer/timer` and `gold` are **platform constants** — not brand-overridable

**Naming note:** the design page's prose calls `background` the "card surface" and `foreground` the "content area" because that is the *user-facing metaphor* for brand extraction. The CSS layer uses shadcn's literal names (`--color-card`, `--color-background`). Both are correct; they sit on opposite sides of the mapping.

---

## Stability Contract

**Version:** `design-system@1.0` — pinned in `ONE/web/package.json`.

| Change type | Requires |
|-------------|----------|
| Add/remove a brand token (the 6) | **Major bump** + migration for every Thing |
| Change a brand-to-shadcn mapping row | **Major bump** — breaks every consumer |
| Adjust a default brand value (e.g. primary HSL) | **Minor bump** — may shift existing Things' look |
| Add a new shadcn-layer var (e.g. `--color-chart-6`) | **Minor bump** — additive |
| Tweak radius/spacing/motion tokens | **Patch bump** |
| New component in the showcase page | **Patch bump** |

Envelopes must **not** add tokens locally. If it needs one, it lands in ONE/web first, then propagates.

---

## Signal Flow

```
Thing.brand (6 HSL triples) ─┐
default brand (ONE/web)  ────┤
                             ▼
                    deriveShadcn(brand) ─► 24+ --color-* vars
                             │
                             ▼
          injected as :root + .dark CSS variables
                             │
                             ▼
               every shadcn primitive reads hsl(var(--color-*))
                             │
                             ▼
                  UI renders in the Thing's brand
                             │
                             ▼
              mark(edge:design→thing, depth) on render
```

No component knows about brand. It only knows about shadcn vars. Brand swap = CSS var swap. No re-render, no re-build.

---

## Consumer Model (how envelopes pulls from ONE)

Three options, ordered by coupling strength:

1. **Symlinked source (dev):** `src/styles/global.css` → `../ONE/web/src/styles/global.css`. Changes propagate instantly. Good for active co-dev, bad for isolation.
2. **Published package (prod, recommended):** `@one/design-system` on npm, versioned. Envelopes depends on `^1.0.0`. Single upgrade bumps every token in lockstep.
3. **Git subtree (hybrid):** `src/styles/design/` is a subtree of `ONE/web/src/styles/`. Pull to update, push to contribute back.

**Recommended: Option 2.** Package = `@one/design-system` with exports:

```
@one/design-system/tokens.css       # the @theme block
@one/design-system/derive.ts        # deriveShadcn(brand) → Record<string, hsl>
@one/design-system/showcase.astro   # the /design page itself
@one/design-system/components/      # InteractionDemo, MotionDemo, ThemeToggle
```

Until the package is published, envelopes consumes via relative import from `../ONE/web/` during development — **but the PLAN treats ONE as upstream, not as a sibling to diff against**.

---

## Current State

| Layer | ONE/web has | Envelopes has | Gap |
|-------|-------------|---------------|-----|
| Brand tokens (6 defaults) | ✅ in `global.css` `@theme` | ✅ copy already present | **0** — already aligned |
| Shadcn derivation (~24 vars) | ✅ baked into `@theme` by hand | ✅ copy already present | **0** — already aligned |
| Radius/spacing/motion tokens | ✅ | ✅ | 0 |
| Showcase page (`/design`) | ✅ 1338 lines | ❌ missing | **1 file to port** |
| Leaf components | `InteractionDemo`, `MotionDemo`, `ThemeToggle` | `InteractionDemo`, `MotionDemo`, `DesignSystemShowcase` (local) | Verify parity + port `ThemeToggle` |
| `deriveShadcn()` function | ❌ not formalized — hand-authored mapping | ❌ same | **Extract** hand mapping into a pure function, lock as contract |
| Package export | ❌ | ❌ | Future cycle (publish `@one/design-system`) |

**The work is mostly plumbing, not authoring.** The elegance is already written; we're locking the contract and proving it renders.

---

## Wave Structure

### W0 — Baseline

```bash
bun run verify           # lint + tsc + vitest green
bun run dev              # localhost:4321 loads
```

Record: tests passing, any current references to `--color-accent` vs `--color-tertiary` in envelopes code.

---

### W1 — Recon (Haiku × 6, parallel)

| Agent | Target | Report |
|-------|--------|--------|
| R1 | `../ONE/web/src/pages/design.astro` (1338 lines) | Section list + line ranges, every imported component, every hardcoded `hsl(…)` literal (and justify which are documentation vs. styling) |
| R2 | `../ONE/web/src/styles/global.css` lines 145–360 (the `@theme` + `.dark` blocks) | Every `--color-*` var, its light value, its dark value, grouped by brand vs. derived vs. platform-constant |
| R3 | `../ONE/web/src/components/design/*` + `../ONE/web/src/components/shop/ThemeToggle.tsx` | Props, hooks, dependencies, anything that would fail to import in envelopes |
| R4 | `src/styles/global.css` (envelopes) | Diff against R2. Any cell that differs from ONE is a drift bug — flag for removal |
| R5 | Envelopes tree: `rg -n "hsl\(" src/components src/pages` | Every hardcoded color outside the design system. Each is a stability violation — list them all |
| R6 | `../ONE/web/package.json` + `../ONE/web/src/styles/` structure | Is there an existing `@one/design-system` scaffold? Any `deriveShadcn()` function? Any published export path? |

**Hard rule:** verbatim, ≤300 words each, line numbers required.

---

### W2 — Decide (Opus, one pass)

**Context loaded:** this plan + R1–R6 reports + `docs/dictionary.md`.

Decisions, in order:

1. **Consumer model:** adopt Option 2 (package) as the v2.0 target; ship v1.0 via Option 1 (relative import from `../ONE/web/`) until package is published. **Do not** maintain a local fork.
2. **Drift resolution:** any cell where envelopes' `@theme` differs from ONE's — envelopes loses. Rewrite envelopes to match ONE. No negotiation.
3. **`deriveShadcn()` extraction:** author the function now, in ONE/web, as `src/styles/derive.ts`. Use it to regenerate the `@theme` block. If the generated CSS matches what's already hand-authored, the contract is proven.
4. **Hardcoded-color audit policy:** any `hsl(216 55% 25%)` literal inside a component is a violation unless it lives on the `/design` page as documentation of the token value.
5. **Showcase page scope:** full 1338-line port. Trimming the showcase trims the proof.
6. **Dark-mode parity:** light and dark must share the same 6 brand tokens with only luminance deltas. No new hues in dark mode.
7. **ThemeToggle location:** port to `src/components/ui/theme-toggle.tsx` (shadcn-namespace, not `shop/`) — it's part of the design system, not shop.

Output: M = 5–7 edit prompts.

---

### W3 — Edits (Sonnet × M, parallel, one per file)

| Job | File | Change |
|-----|------|--------|
| E1 | `../ONE/web/src/styles/derive.ts` **(new, in ONE)** | Author `deriveShadcn(brand: BrandTokens): Record<string, string>`. Pure function. Map every row of the contract table above. Export `defaultBrand`. |
| E2 | `../ONE/web/src/styles/global.css` | Regenerate the `@theme` block from `deriveShadcn(defaultBrand)`. Commit the generated CSS. Confirm byte-for-byte match with what was already there (sanity check that the contract matches reality). |
| E3 | `src/styles/global.css` (envelopes) | Replace entire `@theme` block with verbatim copy from ONE. Any drift → ONE wins. |
| E4 | `src/pages/design.astro` **(new, in envelopes)** | Full port of ONE's 1338-line showcase. Fix import paths (`@/layouts/Layout.astro`), swap `ThemeToggle` import. |
| E5 | `src/components/ui/theme-toggle.tsx` **(new)** | Port from ONE's `components/shop/ThemeToggle.tsx`. Binds `html.dark` class. |
| E6 | `src/components/design/InteractionDemo.tsx` | Verify byte parity with ONE's version. Sync if drifted. |
| E7 | `src/components/design/MotionDemo.tsx` | Same — sync to ONE. |

**Rule:** `DesignSystemShowcase.tsx` (envelopes-only) stays — it's an envelopes extension. But it must consume only the derived shadcn vars, never the 6 brand tokens directly, and never hardcode hsl literals.

---

### W4 — Verify (Sonnet × 4, parallel by check type)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | **Contract:** `deriveShadcn(defaultBrand)` output matches the hand-authored `@theme` byte-for-byte (light + dark) | `derive.ts`, `global.css` |
| V2 | **No drift:** envelopes `global.css` `@theme` is identical to ONE's | both `global.css` files, `diff` |
| V3 | **No leaks:** zero hardcoded `hsl()` in `src/components/**` and `src/pages/**` except the `/design` page where they document values | R5 report + fresh `rg` |
| V4 | **Live render:** `/design` route returns 200, theme toggle flips all 24 derived vars in both modes, every shadcn primitive on the page renders in brand colors, a synthetic `Thing.brand` override reskins the page without a component edit | chrome-devtools MCP on localhost:4321 |

**Deterministic gate:**

```bash
bun run verify
bun test src/styles/derive.test.ts                    # contract test
diff ../ONE/web/src/styles/global.css \
     src/styles/global.css                            # must only differ in paths/comments
curl -s localhost:4321/design | grep "The 6 Extractable Colors"
```

**Rubric (≥ 0.65):**
- **fit:** every ONE/web token, radius, spacing, motion var is present in envelopes
- **form:** `/design` renders identical layout to ONE/web's `/design`
- **truth:** `deriveShadcn()` is the single source — hand-authored CSS is a *generated artifact*, not a parallel authority
- **taste:** a Thing's `brand = {…}` overrides the entire surface with no component changes; the 6-token elegance is visible in the showcase

---

## Cycle Gate

```bash
[ ] deriveShadcn(defaultBrand) regenerates the exact @theme block in both global.css files
[ ] envelopes /design renders identically to ONE/web /design (pixel-diff acceptable)
[ ] theme toggle cycles both modes, every derived var flips
[ ] zero hardcoded hsl() in src/ outside the design page
[ ] synthetic Thing.brand override reskins cards + buttons + badges on the showcase
[ ] bun run verify green
```

---

## Future Cycles

- **Cycle 2 — Publish `@one/design-system`:** extract tokens, derive.ts, showcase components, ThemeToggle into a versioned npm package. Envelopes depends on `^1.0.0`. Retire relative import.
- **Cycle 3 — Brand extraction:** `POST /api/brand/extract { url }` → scrape site, return the 6 tokens. Wire to nanoclaw so an agent runs it.
- **Cycle 4 — Thing runtime override:** SSR injects `<style>` from `thing.brand` on Thing detail pages. `deriveShadcn()` runs server-side per request.
- **Cycle 5 — Palette marketplace:** Things publish proven palettes as highways; others `follow()` via pheromone.

Each is its own PLAN when scheduled.

---

## See Also

- `../ONE/web/src/pages/design.astro` — the showcase (source of truth, 1338 lines)
- `../ONE/web/src/styles/global.css` — the tokens (source of truth)
- `../ONE/web/one/things/design-system.md` — comprehensive spec (referenced by the page)
- [dictionary.md](dictionary.md) — canonical vocabulary (add `brand` attribute on `thing`)
- [one-ontology.md](one-ontology.md) — dimension 3: Things (where brand lives)
- [PLAN-chat.md](PLAN-chat.md) — sibling "import from ONE" plan
- [TODO-template.md](TODO-template.md) — wave template (this plan uses the lean variant)

---

*Six tokens. Deterministic derivation. Full shadcn palette. Every Thing overrides.
ONE defines. Envelopes consumes. Zero forks.*
