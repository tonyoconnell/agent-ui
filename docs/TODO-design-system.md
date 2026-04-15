---
title: TODO Design System — Full Integration
type: roadmap
version: 2.0.0
priority: Audit → Resolve → Cascade → Learn
total_tasks: 16
completed: 0
status: ACTIVE
---

# TODO: Design System — Full Integration

> **Time units:** plan in **tasks → waves → cycles** only. Width =
> tasks-per-wave. Depth = waves-per-cycle. Learning = cycles-per-path.
>
> **Goal:** Six brand tokens become an ambient property of the entire system.
> One edit in a source-of-truth `brand` object → every web page, every
> Telegram reply, every OG card, every email, every PDF, every chart repaints.
> No component edits unless drift is proven.
>
> **Source of truth:** [plan-design-system-integration.md](plan-design-system-integration.md) —
> vision + architecture + enforcement,
> [PLAN-design-system.md](PLAN-design-system.md) — mapping contract (v1.0 locked),
> [DSL.md](DSL.md) — signal grammar, [dictionary.md](dictionary.md) —
> canonical names, [rubrics.md](rubrics.md) — fit/form/truth/taste.
>
> **Shape:** 4 cycles. Each maps to one phase (A/B/C/D) of the plan. Four
> waves per cycle: Haiku recon (read-only) → Opus decide → Sonnet edit →
> Sonnet verify. **Most Sonnet edits happen on NEW files, not components.**
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `skill` entity tagged
> `design`. `thing owns brand` already present (Cycle 3, v1). `group owns brand`
> added in this cycle.

---

## The Prime Directive (audit-first, edit-last)

Shadcn primitives already honor `hsl(var(--color-*))`. Changing brand = changing
`:root` vars = every primitive repaints for free. **Component edits are
exceptional**, triggered only when an audit proves drift.

```
           HAIKU RECON (parallel, read-only)
           ──────────────────────────────────
               grep hex / hsl / rgb / [#…]
                           │
                    findings list
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
           empty                    non-empty
              │                         │
         dissolve W3           spawn N Sonnets (N = findings)
         (signal has no         one edit per flagged file
          receiver; warn 0.5
          per Rule 1)
```

If the audit returns zero findings, **W3 of that cycle dissolves**. That is a
success, not a gap. It proves the contract held.

---

## Routing

```
   signal DOWN                              result UP
   ──────────                               ─────────
   /do TODO-design-system.md                per-wave marks + rubric
        │                                        │
        ▼                                        │
   ┌──────────┐                                  │
   │   W1     │  Haiku recon (read-only) ───────┤ mark(edge:fit)
   │  audit   │  → findings list                │ mark(edge:form)
   └────┬─────┘                                  │ mark(edge:truth)
        ▼                                        │ mark(edge:taste)
   ┌──────────┐                                  │
   │   W2     │  Opus decide                     │
   │  fold    │  → edit specs (possibly empty)   │
   └────┬─────┘                                  │
        ▼                                        │
   ┌──────────┐                                  │
   │   W3     │  Sonnet edits (N = spec count;   │
   │  apply   │   dissolves if N=0)              │
   └────┬─────┘                                  │
        ▼                                        │
   ┌──────────┐                                  │
   │   W4     │  Sonnet verify ──────────────────┘
   │  score   │  → deterministic gate + rubric
   └──────────┘
```

**Context accumulates down. Quality marks flow up. Empty signals dissolve.**

---

## Testing — The Deterministic Sandwich

```
   PRE (before W1 of any cycle)     POST (after W4 of any cycle)
   ────────────────────────────    ─────────────────────────────
   bun run verify                  bun run verify
                                   + bun run scripts/audit-design-tokens.ts
                                   + curl /design?brand=X → purple cascade
                                   + (when applicable) curl /api/og/[thing].png
```

### W0 — Baseline (before every cycle)

```bash
bun run verify     # biome + tsc + vitest
bun run dev        # confirm localhost:4321 boots
```

Record: test count, literal-count baseline, any existing 500s.

### Cycle Gate

- [ ] `bun run verify` passes
- [ ] `scripts/audit-design-tokens.ts` reports findings ≤ baseline
- [ ] `/design?brand=purple` visibly reskins (M3 < 500ms repaint)
- [ ] Rubric ≥ 0.65 on fit / form / truth / taste

---

```
   CYCLE 1: FOUNDATION      CYCLE 2: SURFACES         CYCLE 3: AUTHORING       CYCLE 4: LEARNING
   Resolver + Layout + Guard Non-web channels          Admin UI + extraction   Signals + highways
   ──────────────────────── ─────────────────────    ──────────────────────  ───────────────────
   ~4 new files, 1 edit     ~4 new files, 0 edits    ~4 new files, 1 edit    ~3 new files, 0 edits
         │                           │                      │                        │
         ▼                           ▼                      ▼                        ▼
   ┌─W1─W2─W3─W4─┐            ┌─W1─W2─W3─W4─┐       ┌─W1─W2─W3─W4─┐         ┌─W1─W2─W3─W4─┐
   │ H  O  S  S  │  ──►       │ H  O  S  S  │  ──►  │ H  O  S  S  │  ──►    │ H  O  S  S  │
   └──────────────┘            └──────────────┘      └──────────────┘         └──────────────┘
```

| Cycle | Goal | Loops activated |
|-------|------|-----------------|
| **1. FOUNDATION** | Every page supports per-request brand; audit guards drift | L1, L2, L3 |
| **2. SURFACES** | Telegram + Discord + OG image + email all derive from same 6 | L4 (economic — each surface is a capability) |
| **3. AUTHORING** | Admin UI edits tokens live; brand extraction from URL; user prefs | L4, L5 |
| **4. LEARNING** | `brand-applied` signals → pheromone → highways surface suggestions | L5, L6, L7 |

---

## Source of Truth

**[plan-design-system-integration.md](plan-design-system-integration.md)** — vision, resolver design, surfaces, enforcement, anti-patterns
**[PLAN-design-system.md](PLAN-design-system.md)** — the locked 6-token contract
**`../ONE/web/src/styles/derive.ts`** — pure `deriveShadcn(brand, mode)` (Cycle 1 v1)
**`src/engine/brand.ts`** — current `injectBrand()` + `purpleBrand`; extended here
**`src/schema/one.tql`** — `thing owns brand` already present
**[rubrics.md](rubrics.md)** — scoring

| Item | Canonical | Exceptions |
|------|-----------|------------|
| Color literals in `src/components/**` | **forbidden** | Brand-logo SVG fills (allowlist) |
| Color literals in `src/pages/**` | **forbidden** | `/design` page (documents token values) |
| Color literals in `src/layouts/**` | **forbidden** | none |
| New `--color-*` tokens | **must land in ONE first** | none |
| Forks of shadcn primitives | **forbidden** | Re-pull from registry via `/shadcn` |

---

## Cycle 1: FOUNDATION — Resolver + Layout + Guard

**New files:**
- `src/engine/brand.ts` (extend) — `resolveBrand`, `renderBrand`, `brandPalette`
- `scripts/audit-design-tokens.ts` (new) — CI drift gate
- `src/engine/brand.test.ts` (new) — unit tests

**Edited files (expected):** `src/layouts/Layout.astro` — already accepts `brandStyle`,
may need a thin change to call `renderBrand()` from any page by default.
**Plus** whatever W1 audit flags (expect 0 to 3 files).

**Why first:** without the resolver, every surface has to re-invent brand
reading. Without the audit, drift re-enters silently. Foundation is everything.

---

### Wave 1 — Recon / Audit (Haiku × 5, parallel, read-only)

| Agent | Target | Report |
|-------|--------|--------|
| R1.1 | `src/components/**/*.{tsx,astro}` | **Drift audit.** Every hex (`#[0-9a-f]{3,8}`), `hsl(…)` / `rgb(…)` *literal* (not `hsl(var(--…))`), tailwind arbitrary `class="...bg-[#…]..."`, inline `style={{ color: …hex… }}`. Format: `file:line | literal | context`. Group by file. Expect ≤ 3 files. |
| R1.2 | `src/pages/**/*.astro` (excluding `design.astro`) | Same drift audit. Expect 0. |
| R1.3 | `src/layouts/**/*.astro` | Same drift audit. We already removed the `!important #0f0f17`; verify none left. |
| R1.4 | `src/engine/brand.ts` + `src/schema/one.tql` | Current API surface. What's missing for `resolveBrand`? Is `group owns brand` present? (no — needs add). |
| R1.5 | `src/engine/persist.ts` + `src/lib/typedb.ts` | How to read a single thing's brand attribute cleanly. Pattern to reuse. |

**Hard rule:** report verbatim with line numbers. Do not propose edits.
A clean file produces `file: clean`. Under 300 words each.

---

### Wave 2 — Decide (Opus, one pass)

**Context loaded:** DSL.md + dictionary.md + plan-design-system-integration.md + R1.1–R1.5.

Decisions to make:

1. **Resolver API shape.** Confirm `resolveBrand(ctx: BrandContext): Promise<BrandTokens>` with fallback chain Thing → Group → User → Default.
2. **Schema addition.** `group owns brand` — add to `one.tql` beside the existing `thing owns brand`.
3. **Audit script location.** `scripts/audit-design-tokens.ts`, invoked from `package.json` `verify` pipeline.
4. **Drift policy.** For each flagged file (if any), classify: (a) **replace** with var, (b) **allowlist** (intentional, e.g. logo SVG), (c) **constant** (migrate to platform constant like `--color-gold`).
5. **Layout integration.** Does every page need to call `renderBrand()` explicitly, or can Layout do it implicitly from an Astro middleware? Recommendation: middleware-free, keep explicit in frontmatter — makes the data flow legible. Provide a 3-line snippet pages can copy-paste.
6. **Default-brand caching.** Resolver runs per-request; default fallback should be a module-level constant (no TypeDB read on cache-hit).

Output: M = 3–6 edit prompts (N new files + any drift-flagged file).

---

### Wave 3 — Edits (Sonnet × M, parallel, one per file)

| Job | File | Change |
|-----|------|--------|
| E1.1 | `src/engine/brand.ts` | **Extend.** Add `resolveBrand`, `renderBrand`, `brandPalette`, `BrandContext`. Keep `injectBrand` + `purpleBrand`. Full fallback chain. ~120 lines total. |
| E1.2 | `src/engine/brand.test.ts` | **Create.** Unit tests for fallback priority, JSON-parse of `thing.brand`, `.dark` selector emission. |
| E1.3 | `src/schema/one.tql` | **Edit.** Add `attribute brand` usage to `group` entity (attribute already declared in v1). |
| E1.4 | `scripts/audit-design-tokens.ts` | **Create.** Scans `src/components/**`, `src/pages/**` (except `design.astro`), `src/layouts/**` for literal colors. Prints findings; exits 1 if count > baseline. Baseline read from `.audit-baseline.json`. |
| E1.5 | `package.json` | **Edit.** Add `"audit:design"` script; append to `verify` pipeline. |
| E1.6..N | *(conditional)* any file flagged by R1.1/R1.2/R1.3 | **Edit.** One agent per file. Replace literal → CSS var. |

**Rule:** one agent per file. Never batch. If W1 returned no drift findings,
jobs E1.6+ dissolve — no-op is the correct outcome (warn 0.5 per Rule 1).

---

### Wave 4 — Verify (Sonnet × 4, parallel by check type)

| Shard | Owns | Reads |
|-------|------|-------|
| V1.1 | **Contract:** `resolveBrand` honors fallback; `renderBrand` emits both `:root` + `.dark` with `!important` | `brand.ts` + `brand.test.ts` |
| V1.2 | **Audit gate:** `bun run audit:design` exits 0; baseline file created; any regression fails CI | `audit-design-tokens.ts` + a canary file with a hex injected |
| V1.3 | **Cascade:** curl `/design?brand=purple` shows brand override in both light and dark rules (regression from v1) | dev server |
| V1.4 | **Rubric:** fit / form / truth / taste scored | all touched files |

**Deterministic gate:**
```bash
bun run verify
bun run audit:design                       # exits 0 at baseline count
bun test src/engine/brand.test.ts
curl -s 'http://localhost:4321/design?brand=purple' | grep -c 'data-brand-override'
# expect 2 (one :root, one .dark)
```

**Rubric marks:** `markDims('foundation', { fit, form, truth, taste })`.
Weak dim < 0.65 → fan out micro-edits.

**Self-checkoff:** on clean verify → `markTaskDone('design:foundation')` →
`mark('loop→design:foundation', 5)` → unblock Cycle 2.

### Cycle 1 Gate

```
[ ] resolveBrand / renderBrand / brandPalette exist and typed
[ ] Fallback chain tested (Thing → Group → User → Default)
[ ] group owns brand in one.tql
[ ] audit:design script passes at baseline 0 (or baseline-N if drift inherited)
[ ] /design?brand=purple still cascades (no regression)
[ ] bun run verify green
```

---

## Cycle 2: SURFACES — Non-Web Channels

**New files:**
- `nanoclaw/src/lib/brand-chrome.ts` — Discord `embed.color` + Telegram tint helpers
- `src/pages/api/og/[thing].png.ts` — Satori-rendered OG cards
- `src/components/email/BrandedEmail.tsx` — MJML/HTML email skeleton
- `src/pages/api/brand/palette.ts` — JSON endpoint: `GET → resolved palette`

**Edited files (expected):** 0 components. Adapters only.

**Depends on:** Cycle 1 complete (needs `resolveBrand` / `brandPalette`).

---

### Wave 2.1 — Recon (Haiku × 4, parallel)

| Agent | Target | Report |
|-------|--------|--------|
| R2.1 | `nanoclaw/src/channels/{telegram,discord,web}.ts` | Current send payload shape. Where does embed color / reply-markup tint plug in? Any hardcoded hex in bot code. |
| R2.2 | `nanoclaw/src/workers/router.ts` | How do we get the current `groupId` per incoming message? Is it in `msg.chat.id` or derived? |
| R2.3 | Envelopes: any existing `@vercel/og` or Satori usage. `package.json` dep check. | Is Satori installed? If not, what's the lightest path to OG generation (Satori vs Resvg vs HTMLCanvas)? |
| R2.4 | `src/components/**/*.tsx` for email-related files; check MJML / react-email deps | What email-auth / email-render infra exists today? Start from scratch or extend? |

---

### Wave 2.2 — Decide (Opus)

Decisions:
1. **Discord embed color.** `hslToInt(palette.primary.dark) → 0xRRGGBB`. Helper lives in `brand-chrome.ts`.
2. **Telegram tinted chrome.** Prefix reply with an inline emoji-divider using primary hue bucket (≤8 buckets mapped to 🔵🟣🟢🟡🟠🔴⚫⚪). Keep it subtle.
3. **OG route shape.** `GET /api/og/[thing].png?mode=dark` → PNG via Satori. Cache headers: 1 hour. Brand resolved server-side.
4. **Email shell.** One HTML template. Inline all `hsl(...)` values at render time. No `<style>` block (email clients drop them).
5. **No channel-specific branding logic.** All four surfaces call the same `brandPalette({ thingId, groupId, mode })` and adapt the output to their format.

Output: M = 4 new files, 1–2 dep adds.

---

### Wave 2.3 — Edits (Sonnet × 5, parallel)

| Job | File | Change |
|-----|------|--------|
| E2.1 | `nanoclaw/src/lib/brand-chrome.ts` | **Create.** `embedColorFor(groupId)`, `telegramTintFor(groupId)`. Pure functions. |
| E2.2 | `nanoclaw/src/channels/discord.ts` (edit) | Consume `embedColorFor`. ~3 lines changed. |
| E2.3 | `nanoclaw/src/channels/telegram.ts` (edit) | Consume `telegramTintFor`. ~3 lines. |
| E2.4 | `src/pages/api/og/[thing].png.ts` | **Create.** Satori-based route. Read `thingId` from params; resolve brand; render. ~80 lines. |
| E2.5 | `src/components/email/BrandedEmail.tsx` | **Create.** React component takes `brand` + `content` props, returns inline-styled HTML. ~120 lines. |

---

### Wave 2.4 — Verify (Sonnet × 4)

| Shard | Owns |
|-------|------|
| V2.1 | **Discord color:** `embedColorFor('test-group')` returns correct int for primary HSL |
| V2.2 | **OG render:** `/api/og/test.png` returns PNG, 200, with expected primary swatch (pixel sample) |
| V2.3 | **Email render:** `BrandedEmail({ brand: purple, ... })` HTML contains `style="background:hsl(280 100% 60%)"` |
| V2.4 | **Rubric:** fit / form / truth / taste |

**Deterministic gate:**
```bash
bun run verify
curl -sf -o /tmp/og.png http://localhost:4321/api/og/test.png && file /tmp/og.png | grep PNG
bun test nanoclaw/src/lib/brand-chrome.test.ts
bun test src/components/email/BrandedEmail.test.tsx
```

### Cycle 2 Gate

```
[ ] Discord embed renders in brand primary
[ ] Telegram reply tinted by brand bucket
[ ] /api/og/[thing].png returns branded PNG
[ ] Email template renders branded HTML, no <style> block
[ ] bun run audit:design still 0 findings
[ ] Rubric ≥ 0.65 all dimensions
```

---

## Cycle 3: AUTHORING — Admin UI + Extraction + User Prefs

**New files:**
- `src/pages/design/edit.astro` — live token editor
- `src/components/design/BrandEditor.tsx` — 6 color pickers, live preview
- `src/pages/api/brand/extract.ts` — URL → 6-token extractor
- `src/pages/api/brand/save.ts` — persist to `thing.brand` / `group.brand`

**Edited files (expected):** ≤ 1 (maybe a small cookie helper in `src/lib/`).

**Depends on:** Cycle 1 (resolver) + Cycle 2 (the resolver has been proven across surfaces).

---

### Wave 3.1 — Recon (Haiku × 4)

| Agent | Target | Report |
|-------|--------|--------|
| R3.1 | shadcn color-picker options; `src/components/ui/` for existing | Is there a `ColorPicker` primitive? If not, what's available — `Slider` + `Input`? |
| R3.2 | Library landscape for color extraction (Vibrant.js, node-vibrant, colorthief, k-means from screenshots) | Which lib is CF Workers-compatible, smallest bundle, reliable on favicons? |
| R3.3 | `src/engine/persist.ts` — how to write `thing.brand` | Current write API + error cases |
| R3.4 | `src/lib/` — any cookie/session helper for user preferences | What's the current pattern? |

---

### Wave 3.2 — Decide (Opus)

Decisions:
1. **Editor UX.** 6 HSL sliders or 6 hex-input fields + swatch. Recommendation: 6 sliders per channel (H/S/L) × 6 tokens = 18 sliders. Plus mode toggle + reset. Live preview re-injects `<style>` on every change via `document.documentElement` var set. No page reload.
2. **Extraction engine.** `node-vibrant` if CF Workers-compatible; else server-side only (`/api/brand/extract` runs on Node, returns JSON).
3. **Save semantics.** `POST /api/brand/save { scope: 'thing'|'group', id: string, brand: BrandTokens }` → persist to TypeDB, invalidate KV cache.
4. **User pref.** Cookie `ds.brand` = base64-encoded JSON of user's chosen BrandTokens (optional; overrides Default but not Thing/Group).
5. **Access control.** Save requires ownership check — resolves via existing auth primitives.

Output: M = 4–5 edits.

---

### Wave 3.3 — Edits (Sonnet × 4, parallel)

| Job | File | Change |
|-----|------|--------|
| E3.1 | `src/pages/design/edit.astro` | **Create.** Wraps `<BrandEditor />`. |
| E3.2 | `src/components/design/BrandEditor.tsx` | **Create.** 18 HSL sliders, live var swap, save button. |
| E3.3 | `src/pages/api/brand/extract.ts` | **Create.** Accepts `{ url }`, returns `{ brand, confidence }`. |
| E3.4 | `src/pages/api/brand/save.ts` | **Create.** Writes to TypeDB via `persist.ts` helpers. |

---

### Wave 3.4 — Verify (Sonnet × 4)

| Shard | Owns |
|-------|------|
| V3.1 | **Editor UX:** dragging primary slider → all `bg-primary` on page repaints live (<100ms) |
| V3.2 | **Save round-trip:** submit → `/design?thing=X` shows saved brand |
| V3.3 | **Extract:** `POST /api/brand/extract { url: 'https://stripe.com' }` returns 6 tokens + confidence |
| V3.4 | **Rubric:** fit / form / truth / taste |

**Deterministic gate:**
```bash
bun run verify
curl -sf -X POST http://localhost:4321/api/brand/extract -d '{"url":"https://stripe.com"}' | jq '.brand.primary.light'
curl -sf -X POST http://localhost:4321/api/brand/save -d '{"scope":"thing","id":"test","brand":{...}}'
curl -s 'http://localhost:4321/design?thing=test' | grep data-brand-override
```

### Cycle 3 Gate

```
[ ] /design/edit live-previews all 6 tokens in <100ms
[ ] /api/brand/extract returns candidate from a real URL
[ ] /api/brand/save persists to TypeDB; /design?thing=X shows it
[ ] User cookie fallback works
[ ] Rubric ≥ 0.65
```

---

## Cycle 4: LEARNING — Signals + Highways + Marketplace

**New files:**
- `src/engine/brand-signals.ts` — emits `brand-applied` signals
- `src/pages/api/brand/highways.ts` — top brand-thing pairings by strength
- `src/components/design/BrandHighways.tsx` — suggestion UI

**Edited files (expected):** 1 (Layout or renderBrand to emit signal on every render).

**Depends on:** Cycles 1–3. The learning is only interesting when there's real
traffic to learn from.

---

### Wave 4.1 — Recon (Haiku × 3)

| Agent | Target | Report |
|-------|--------|--------|
| R4.1 | `src/engine/persist.ts` — `mark` / `warn` / `signal` API | Signature + typical usage in other L2 loops |
| R4.2 | `src/engine/loop.ts` | L6 `know()` promotion rule — threshold + format |
| R4.3 | `src/components/panels/HighwayPanel.tsx` (if exists) | Existing highway visualization pattern to reuse |

---

### Wave 4.2 — Decide (Opus)

Decisions:
1. **Signal shape.** `{ receiver: 'brand-applied', data: { brand: string, thingId?, groupId?, mode } }`. `brand` is a canonical-key (hash or name) so pheromone aggregates cleanly.
2. **Mark formula.** `mark('brand:<key>→thing:<id>', 1)` per render. `warn` on render error (failed brand JSON parse, etc.).
3. **Highway threshold.** Inherit existing `know()` strength gate (~20 per project convention).
4. **Suggestion UI.** `<BrandHighways />` panel on `/design/edit` shows top 5 brand-thing pairings with swatches. "Apply this brand to new tutorial?" CTA.
5. **Privacy.** Brand-applied signals are per-Thing, not per-user. No PII.

Output: M = 3–4 edits.

---

### Wave 4.3 — Edits (Sonnet × 3, parallel)

| Job | File | Change |
|-----|------|--------|
| E4.1 | `src/engine/brand-signals.ts` | **Create.** `emitBrandApplied(ctx)` — called from renderBrand. |
| E4.2 | `src/engine/brand.ts` (edit) | Hook `emitBrandApplied` into `renderBrand`. ~3 lines. |
| E4.3 | `src/pages/api/brand/highways.ts` | **Create.** `GET` returns top N `brand:*→thing:*` paths. |
| E4.4 | `src/components/design/BrandHighways.tsx` | **Create.** Reads `/api/brand/highways`, renders suggestion cards. |

---

### Wave 4.4 — Verify (Sonnet × 4)

| Shard | Owns |
|-------|------|
| V4.1 | **Signal emitted:** every render produces one `brand-applied`; 10 renders → path strength 10 |
| V4.2 | **Highway endpoint:** `/api/brand/highways` returns paths after signal volume |
| V4.3 | **Suggestion UI:** renders at least 1 suggestion after test seeding |
| V4.4 | **Rubric:** fit / form / truth / taste |

**Deterministic gate:**
```bash
bun run verify
for i in 1..10 ; do curl -s "http://localhost:4321/design?thing=t$i&brand=purple" > /dev/null ; done
sleep 1
curl -s http://localhost:4321/api/brand/highways | jq 'length >= 1'
```

### Cycle 4 Gate

```
[ ] brand-applied signal fires on every render
[ ] /api/brand/highways returns non-empty after signal volume
[ ] BrandHighways UI renders suggestions
[ ] No performance regression on /design (render time within Cycle 1 baseline ± 10%)
[ ] Rubric ≥ 0.65
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. share |
|-------|------|--------|-------|-----------|
| 1 | W1 | 5 | Haiku  | ~5% |
| 1 | W2 | 1 | Opus   | ~12% |
| 1 | W3 | 3–6 | Sonnet | ~10% |
| 1 | W4 | 4 | Sonnet | ~8% |
| 2 | W1–W4 | 4+1+5+4 | mixed | ~20% |
| 3 | W1–W4 | 4+1+4+4 | mixed | ~20% |
| 4 | W1–W4 | 3+1+3+4 | mixed | ~15% |

**Parallelism is cheap, serial is expensive.** 5 Haiku in parallel = same cost
as 1 Haiku reading 5 trees, 1/5 the wall time, 5 parallel marks.

**Hard stop:** any W4 looping more than 3 times → halt, escalate.

---

## Status

- [ ] **Cycle 1: FOUNDATION** — resolver + layout + guard
  - [ ] W1 — Recon / audit (Haiku × 5, parallel, read-only)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × M, parallel, M = 3–6)
  - [ ] W4 — Verify (Sonnet × 4, parallel)
- [ ] **Cycle 2: SURFACES** — non-web channels
  - [ ] W1 — Recon (Haiku × 4, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 5, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel)
- [ ] **Cycle 3: AUTHORING** — admin UI + extraction
  - [ ] W1 — Recon (Haiku × 4, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 4, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel)
- [ ] **Cycle 4: LEARNING** — signals + highways
  - [ ] W1 — Recon (Haiku × 3, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 3, parallel)
  - [ ] W4 — Verify (Sonnet × 4, parallel)

---

## Execution

```bash
# Advance one wave
/do TODO-design-system.md

# Full cycle autonomous
/do TODO-design-system.md --auto

# Inspect state
/see tasks --tag design
/see highways
bun run audit:design
```

### How `/do` Orchestrates

```
/do TODO-design-system.md
  │
  ├── reads TODO, finds current cycle + wave
  │
  ├── W1 audit? → spawn N Haiku (read-only, one per directory) in ONE message
  │                collect findings, mark wave [x]
  │
  ├── W2 decide? → Opus synthesizes in main context
  │                 if W1 found 0 drift, E1.6+ dissolve per Rule 1
  │
  ├── W3 edit? → spawn M Sonnet (M = file count) in ONE message
  │               one agent per file, never batch
  │
  └── W4 verify? → spawn 4 Sonnet verifiers in ONE message
                    clean → markDims + advance
                    dirty → parallel micro-edits → re-verify (max 3)
```

---

## Task Metadata (for TypeDB sync)

```typeql
insert $s isa skill,
  has skill-id "design:foundation:resolver",
  has name "Implement resolveBrand + renderBrand + brandPalette",
  has price 0.0,
  has tag "design", has tag "foundation", has tag "P0";

insert $s isa skill,
  has skill-id "design:foundation:audit",
  has name "Drift audit + CI gate",
  has tag "design", has tag "foundation", has tag "P0";

match $a isa skill, has skill-id "design:foundation:resolver";
      $b isa skill, has skill-id "design:surfaces:chat";
insert (blocker: $a, blocked: $b) isa blocks;
```

Run `/sync agents` after editing this file to push tasks into TypeDB.

---

## The One Rule (the prime directive again, because it matters)

> **The audit finds. Only the flagged get edited. Everything else is left
> alone.**

A cycle where W3 dissolves because W1 found no drift is a *success*, not a
gap. It means the contract held across the whole codebase. The pheromone on
`audit→clean` strengthens; the system learns that its components are
trustworthy; future cycles skip them faster.

Every component you *didn't* touch is a vote of confidence in shadcn's
design. Respect it.

---

## See Also

- [plan-design-system-integration.md](plan-design-system-integration.md) — the source vision (this TODO executes it)
- [PLAN-design-system.md](PLAN-design-system.md) — the locked v1 contract
- [DSL.md](DSL.md) — signal grammar (loaded in every W2)
- [dictionary.md](dictionary.md) — canonical names
- [rubrics.md](rubrics.md) — scoring
- [TODO-template.md](TODO-template.md) — the pattern this TODO follows
- [TODO-task-management.md](TODO-task-management.md) — self-learning task system
- `../ONE/web/src/styles/derive.ts` — pure derivation function (Cycle 1 v1 output)
- `src/engine/brand.ts` — current injectBrand + purpleBrand (v1); extended in Cycle 1 of this TODO
- `src/schema/one.tql` — `thing owns brand` (v1); `group owns brand` added here

---

*Six tokens. Four cycles. One integration. Every surface downstream, zero components upstream.*
