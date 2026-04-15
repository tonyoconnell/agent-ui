# Plan: Design System — Full Integration

**One dial at the source. Every surface downstream.**

> Change `primary` from `216 55% 25%` to `280 100% 60%`, and every page, every badge,
> every Telegram embed, every generated OG image, every PDF reskins at once.
> No component edits. No channel edits. No fork, anywhere, ever.

**Status:** Cycles 1–3 complete (contract + showcase + Thing-level override).
**Now:** turn the contract into an ambient property of the whole system.

---

## 1. The Leverage

6 tokens authored. ∞ surfaces rendered.

```
                        ┌──────────────────┐
                        │   6 HSL TRIPLES  │
                        │ background font  │
                        │ foreground       │
                        │ primary          │
                        │ secondary        │
                        │ tertiary         │
                        └────────┬─────────┘
                                 │
                        deriveShadcn(brand, mode)
                                 │
                        ┌────────▼─────────┐
                        │ 41 --color-* vars│
                        └────────┬─────────┘
              ┌──────────────────┼──────────────────────┐
              ▼                  ▼                      ▼
        WEB SURFACE         CHAT SURFACE          IMAGE SURFACE
        ───────────         ────────────          ─────────────
        <style> in head    Telegram buttons       OG cards (Satori)
        every page          Discord embeds         Email hero
        every island        Terminal banners       PDF cover
              │                  │                      │
              └──────────────────┴──────────────────────┘
                                 │
                    mark(brand→thing) per render
                                 │
                    L2 pheromone accumulates
                                 │
                    L6 know()    popular brands
                                 │
                              HIGHWAYS
                              (brand suggestions surface)
```

**The power is not in the 6 tokens. It's in the fact that nothing else exists.**

---

## 1.5. The shadcn Contract — Why Components Don't Get Edited

**shadcn/ui primitives are already brand-agnostic by design.** Every `Button`,
`Card`, `Badge`, `Input`, `Dialog`, etc. reads `hsl(var(--color-primary))`,
`hsl(var(--color-background))`, and friends. Swap the vars at `:root` and
every primitive repaints — **no component code runs, no component edit needed.**

The integration is therefore **audit-first, edit-last**:

```
                HAIKU AUDIT PASS                    DEFAULT VERDICT
                ─────────────────                    ───────────────
   ~200 .tsx files ──► grep for hex/hsl/rgb ──► NO EDIT (the vast majority)
                  ──► grep for bg-[#…]       ──► NO EDIT
                  ──► grep for inline color  ──►
                                                 │
                                              findings?
                                                 │
                                    ┌────────────┴───────────┐
                                    ▼                        ▼
                                   NONE                FLAGGED (~0-5 files)
                                    │                        │
                              do nothing              EDIT ONLY THESE
                              (95%+ case)             (exceptional)
```

**Rules for the Haiku pass:**

1. **Haiku reports, never edits.** The audit produces a list of files with
   drift. An edit agent runs *after*, *only* on flagged files.
2. **Starting baseline is 0.** Envelopes component recon (R1.5, Cycle 1) found
   zero hardcoded `hsl()` literals in `src/components/**`. The audit proves
   that baseline holds cycle-to-cycle.
3. **Flagged ≠ guilty.** Each finding needs a decision: (a) replace with var
   (true drift), (b) allowlist (intentional, e.g. a brand-logo SVG fill), (c)
   migrate to a platform constant (like `--color-gold`, `--color-urgency-*`).
4. **shadcn registry files are off-limits by default.** If you find drift in
   `src/components/ui/button.tsx` etc., question the premise — a shadcn
   primitive that hardcodes a color is either outdated (re-pull from registry)
   or locally patched (revert and re-apply via a wrapper, not a fork).
5. **The 5 places drift actually lives:**
   - Layout files (`*.astro`) — body/html backgrounds, e.g. the now-removed
     `bg-[#0f0f17] !important`
   - Dashboard / graph wrappers — ReactFlow `<Background color="#333">`,
     chart axis tints
   - SVG icons with baked fills
   - Email / OG / PDF templates (no CSS vars available — these *must* inline
     resolved HSL, but via the resolver, not hardcoded)
   - One-off landing sections with "designer-picked" arbitrary tailwind values

**Almost every file Haiku reads will return a `no-op` verdict. That's the
integration working.**

---

## 2. Current State (post-Cycle 3, 2026-04-15)

| Surface | Status | Consumes from |
|---------|--------|---------------|
| `/design` showcase | ✅ wired | Layout `brandStyle` prop |
| Every other envelopes page | ⚠️ cascades via `<html class="dark">` + shadcn vars, but no per-request brand resolution | global `@theme` only |
| Thing-level override | ✅ schema + engine + injection | `thing.brand` + `injectBrand()` |
| Telegram/Discord messages | ❌ plain text, no brand chrome | — |
| OG / social cards | ❌ missing | — |
| Generated PDFs / reports | ❌ missing | — |
| Dashboard charts (ReactFlow, custom) | ⚠️ uses shadcn vars but hardcodes some hex (e.g. `#0a0a0f`) | mixed |
| Email templates | ❌ none authored | — |
| Component lint / hex guard | ❌ no enforcement | — |

**Drift risk today:** low for shadcn primitives (zero hsl literals found in recon),
medium for Tailwind arbitrary values (`bg-[#0f0f17]`, dashboard hex), high for any
new channel we add without the resolver.

---

## 3. The Resolver (one function, many callers)

The whole plan reduces to: **every surface calls the same `resolveBrand(ctx)`.**

```typescript
// src/engine/brand.ts  (extend existing file)

export interface BrandContext {
	thingId?: string     // Thing-level override (highest priority)
	groupId?: string     // Group/org override (middle)
	userId?: string      // User preference (low)
	mode: 'light' | 'dark'
}

export async function resolveBrand(ctx: BrandContext): Promise<BrandTokens> {
	// 1. Thing-level: if ctx.thingId, query TypeDB → thing.brand (JSON)
	// 2. Group-level: if ctx.groupId, query TypeDB → group.brand
	// 3. User preference: read cookie/localStorage (client) or session (server)
	// 4. Fallback: defaultBrand from ONE/web/src/styles/derive
}

export async function renderBrand(ctx: BrandContext): Promise<string> {
	const brand = await resolveBrand(ctx)
	return injectBrand(brand, ctx.mode) + injectBrand(brand, opposite(ctx.mode)).replace(':root', '.dark')
}
```

Every surface calls `renderBrand()`, gets back an HTML-safe `<style>` blob (web)
or a color palette object (non-web), and uses it. **Zero surface re-implements
resolution.**

```
              ┌─────────────────┐
              │ resolveBrand()  │   ← single source of resolution
              │ renderBrand()   │
              │ brandPalette()  │   ← pure object, no <style> wrapping
              └────────┬────────┘
                       │
      ┌────────────────┼─────────────────┐
      ▼                ▼                 ▼
  Layout.astro     nanoclaw bots      OG image gen
  (SSR pages)      (message chrome)   (Satori, Puppeteer)
```

---

## 4. Extension Surfaces

Each surface is a tiny adapter. None of them knows what brand is; they know
only how to consume the resolver's output.

### 4.1 Web (SSR + islands)

**Change:** Layout.astro already accepts `brandStyle`. Every page that wants
per-request brand calls `renderBrand()` in frontmatter:

```astro
---
import { renderBrand } from '@/engine/brand'
const brandStyle = await renderBrand({
  thingId: Astro.url.searchParams.get('thing') ?? undefined,
  mode: 'light',
})
---
<Layout title="…" brandStyle={brandStyle}>
```

**Cost:** ~3 lines per page. **Reach:** every page gets per-request brand for free.

### 4.2 Chat surfaces (Telegram, Discord, terminal)

`nanoclaw` sends rich messages today. Adapters live in `nanoclaw/src/channels/*`.

- **Telegram** supports inline-keyboard button colors via theme hints; embed bars
  don't exist, but we can prefix replies with an emoji-tinted divider based on
  `brand.primary.light`.
- **Discord** embeds have a single `color` field — take `primary` HSL → hex,
  inject as `embed.color`.

```typescript
// nanoclaw/src/lib/brand-chrome.ts
import { brandPalette } from '@/engine/brand'
export async function embedColorFor(groupId: string): Promise<number> {
	const brand = await brandPalette({ groupId, mode: 'dark' })
	return hslToInt(brand.primary.dark)   // 0xRRGGBB
}
```

Every bot message builder calls `embedColorFor(msg.chat.id)`. Done.

### 4.3 OG / social cards

Use `@vercel/og` (Satori) or Puppeteer in a Cloudflare Worker. The template
reads the resolved palette server-side:

```tsx
// src/pages/api/og/[thing].png.ts
const brand = await resolveBrand({ thingId, mode: 'light' })
return new ImageResponse(
	<div style={{ background: `hsl(${brand.background.light})`, color: `hsl(${brand.font.light})` }}>
		<h1 style={{ color: `hsl(${brand.primary.light})` }}>{title}</h1>
	</div>
)
```

### 4.4 PDFs / reports

Same pattern: any renderer (react-pdf, Puppeteer-to-PDF, HTML email) takes
`brand` as context and uses HSL strings directly.

### 4.5 Emails

MJML or HTML-email templates accept `brand` as a prop. No CSS vars (email
clients don't support them well) — we inline the resolved HSL values at send
time. This is the one surface that *materializes* the derivation: `deriveShadcn(brand, mode)` runs server-side, output is baked into `<td style="background:…">`.

### 4.6 Dashboard charts (ReactFlow, Recharts, custom SVG)

Today some dashboards hardcode hex (`#0a0a0f`, `#161622`, `#252538` per
`components/CLAUDE.md`). **These become brand-token reads:**

```tsx
// before
<Background color="#333" gap={20} />

// after
<Background color={`hsl(var(--color-muted-foreground))`} gap={20} />
```

Pure find-and-replace, already caught by the lint rule below.

---

## 5. Authoring Model

Three places the 6 tokens can be set. Resolver reads in priority order.

| Scope | Who sets | Where stored | When applied |
|-------|----------|--------------|--------------|
| **Thing** | Thing owner | `thing.brand` (TypeDB, JSON string) | Any render with `thingId` in context |
| **Group** | Group admin | `group.brand` (TypeDB, same shape) | Any render scoped to a group |
| **User** | End user | cookie `ds.brand` or localStorage | Personal preference, overridable per-thing |
| **Default** | Platform | `defaultBrand` in ONE/web/src/styles/derive.ts | Fallback, always present |

Priority: **Thing > Group > User > Default**. First non-null wins.

### Brand extraction pipeline

Cycle 4 future work (not in this plan's scope but sized here):

```
POST /api/brand/extract { url }
  ↓
fetch favicon + /robots.txt + CSS
  ↓
sample dominant colors (vibrant.js or k-means on rendered screenshot)
  ↓
coerce to 6-token shape + confidence score
  ↓
return { brand, confidence, sources: [...] }
```

User reviews in a preview UI, commits → `thing.brand = stringify(brand)`.

---

## 6. Contract Enforcement (no drift)

The elegance breaks the instant someone types `style="color: #ff00ff"` in a
component. Guardrails:

### 6.1 Biome rule (component + layout files)

Add a custom Biome rule (or a simple pre-commit grep) that rejects:

```regex
(hsl|rgb|rgba|#[0-9a-f]{3,8})\(|=\s*["']#[0-9a-f]{3,8}
```

inside `src/components/**/*.{ts,tsx,astro}` and `src/layouts/**/*.astro`.
**Exception:** `/design` page (documents token values for readers).

### 6.2 CI audit script

`scripts/audit-design-tokens.ts`:

```
for each component file:
  count hsl/rgb/hex literals
for each page file (except design.astro):
  count hsl/rgb/hex literals
fail if count > known-baseline
```

Runs in `bun run verify`. Known-baseline starts at 0 (already clean per recon).

### 6.3 Schema

Tailwind arbitrary values (`bg-[#0f0f17]`) are the silent killer. Lint rule
extension to also flag `\[#[0-9a-f]{3,8}\]` inside `class=` / `className=`.

### 6.4 Runtime canary

In dev, `Layout.astro` can emit a `<script>` that scans computed styles for
any element whose `background-color` or `color` has RGB values that don't
map to any derived var. Console-warn, don't block. Catches regressions at
develop-time.

---

## 7. Substrate Learning Loop (the pheromone angle)

Every brand application emits a signal. The substrate learns which brands
are proven.

```typescript
// after each page render
net.signal({ receiver: 'brand-applied', data: { brand: 'purple', thingId: '…', depth: 1 } })

// handler
.on('brand-applied', ({ brand, thingId }, emit, ctx) => {
  net.mark(`brand:${brand}→thing:${thingId}`, 1)
  // after threshold, brand becomes a highway
})
```

Over time:
- **L2** — paths `brand:X → thing:Y` accumulate strength on successful renders
- **L3** — fade removes unused brand pairings
- **L6** — `know()` promotes high-strength pairings to **brand highways**
- **L7** — frontier detects tag clusters of Things with no brand (opportunity)

Result: the admin UI can suggest "47 tutorial Things use the `academic-blue`
brand and users stay 40% longer — apply to new tutorial?" — a recommendation
grounded in pheromone, not a guess.

---

## 8. Phases

Four cycles, each a separate TODO. Each cycle self-verifies under the W0/W4
sandwich. Skim for effort:

### Phase A — Audit + Resolver + Guard (foundation)

| Cycle | Goal |
|-------|------|
| A0 | **Haiku audit pass (parallel, read-only).** One agent per directory under `src/components/` + `src/layouts/` + `src/pages/`. Each reports: hex/hsl/rgb literals, tailwind arbitrary values `[#…]`, inline `style={{ color: … }}`. Output: a single findings list, typically 0–5 files. **No edits in this cycle.** |
| A1 | Implement `resolveBrand`, `renderBrand`, `brandPalette` in `src/engine/brand.ts` — single function, testable, no I/O in hot path |
| A2 | Plumb through `Layout.astro`. Every page takes optional `thingId` / `groupId` / `mode`. Default = defaultBrand. **Does not touch components.** |
| A3 | Lint rule + audit script + CI gate. Start at the A0 baseline; break build on any regression above it. |
| A4 | **Targeted edits only** — one Sonnet edit per file flagged by A0. Each edit replaces the hex with the correct var. If no files were flagged, this cycle dissolves (per Rule 1, signal has no receiver). |

**Important:** Cycles A0 → A4 are a single "audit and close" loop. Expect A4 to
dissolve in most codebases; that's the contract working. If A0 returns 20+
findings, *that* is the real project — the shadcn migration itself.

### Phase B — Non-web surfaces

| Cycle | Goal |
|-------|------|
| B1 | Nanoclaw: `embedColorFor(groupId)` helper. Discord embeds + Telegram reply chrome use brand. |
| B2 | `/api/og/[thing].png` route using Satori. Cover cards auto-brand per Thing. |
| B3 | Email template system (MJML) with `brand` prop. One template, every brand. |

### Phase C — Authoring + Persistence

| Cycle | Goal |
|-------|------|
| C1 | Admin UI at `/design/edit` — change any of the 6 tokens with live preview (no page reload — CSS vars flip on keystroke). Save persists `group.brand` or `thing.brand` to TypeDB. |
| C2 | `POST /api/brand/extract { url }` — color extraction pipeline (favicon + CSS sampler + k-means). Returns 6-token candidate + confidence. |
| C3 | User-level preference (cookie + localStorage). Resolver picks correctly. |

### Phase D — Learning + Marketplace

| Cycle | Goal |
|-------|------|
| D1 | Signal `brand-applied` on every render. `mark('brand:X→thing:Y', depth)`. |
| D2 | `net.know()` promotion rule: top brand-thing pairings by strength become suggestions. |
| D3 | Palette marketplace: Things publish their brand as a capability; other Things `follow()` via pheromone. |

**Recommendation:** do Phase A end-to-end before any of B/C/D. The resolver
is the lever; everything downstream assumes it exists.

---

## 9. Success Metrics (Rule 3 — measurable)

Each metric is a number, not a vibe.

| # | Metric | Gate | How measured |
|---|--------|------|--------------|
| M1 | Hex/hsl literals in components | `== 0` | `rg` count in CI |
| M2 | Pages that support per-request brand | `== total_pages` | lint rule: every `*.astro` page passes `brandStyle` or explicitly opts out |
| M3 | Time-to-flip-primary (single-token edit → every page repaints) | `< 200ms` on dev, `< 500ms` on prod | benchmark script |
| M4 | Non-web surfaces branded | `>= 3` (chat + OG + email) | integration tests |
| M5 | Resolver call latency (cold) | `< 10ms` p95 | bench against TypeDB cache |
| M6 | Brand-override regression in existing routes | `== 0` | visual diff against W0 baseline screenshots |
| M7 | Brand highways surfaced in admin UI | `>= 5` after 1 month of telemetry | `GET /api/brand/highways` |

**Every cycle W4 reports these numbers.** If M3 regresses, a cycle is flagged.

---

## 10. Anti-Patterns (what NOT to do)

- ❌ **Speculatively "upgrading" components.** If a shadcn primitive already
  reads `hsl(var(--color-*))`, it is **already brand-aware**. Editing it adds
  risk, burns a diff, and can introduce drift the audit script will later
  flag. **No-op is a valid and common cycle outcome.**
- ❌ **Forking shadcn primitives.** If `src/components/ui/button.tsx` needs a
  change, re-pull from the shadcn registry via `/shadcn` skill or wrap it in
  a local primitive — don't hand-edit. Forks drift from upstream forever.
- ❌ **Editing a file just because an agent looked at it.** The Haiku audit
  reads many files. It flags few. Only flagged files go to an edit agent.
  Unflagged files receive zero touches.
- ❌ **Adding a 7th root token.** Breaks the contract. Every new "we need one more color" goes into platform constants (`gold`, `urgency-*`) or becomes a derivation of the existing 6. Major-bump the contract only if absolutely unavoidable.
- ❌ **Per-component brand props.** `<Button brand={…}>` is an anti-pattern; it leaks brand knowledge into every primitive. Brand lives on `:root`, components read CSS vars. Period.
- ❌ **Local theme forks.** Envelopes must never author `--color-*` values locally. If it needs a token, it lands in ONE first.
- ❌ **Client-side only brand.** Must work in SSR, server workers, and static exports. That's why the resolver is sync-ready and takes a serializable context.
- ❌ **Coupling brand to routing.** `?brand=purple` is a dev shortcut. Real resolution happens via Thing/Group/User context, not URL params.
- ❌ **Hardcoded tints in JS.** `const PURPLE = '#8800ff'` in a React component = drift. Always read from computed style or from the resolver.
- ❌ **Skipping `!important` on override.** Cycle 3 proved it: without `!important`, the `.dark` selector in `global.css` wins the cascade against `:root` overrides. Keep the `!important`.
- ❌ **Treating charts as special.** Dashboards must use `--color-chart-*`, not bespoke hex. Phase A audit catches this.

---

## 11. File-level Touch Map (just the anchors)

Deliberately not exhaustive — agents will expand per cycle. The architectural
entry points:

```
src/engine/brand.ts            (+) resolveBrand, renderBrand, brandPalette, extract
src/layouts/Layout.astro       (=) already accepts brandStyle; every page calls renderBrand
src/schema/one.tql             (=) brand attribute on thing; add to group
scripts/audit-design-tokens.ts (+) CI gate
nanoclaw/src/lib/brand-chrome.ts  (+) embed color + telegram tints
src/pages/api/brand/extract.ts (+) Phase C extraction endpoint
src/pages/api/og/[thing].png.ts (+) Phase B OG cards
src/pages/design/edit.astro    (+) Phase C admin editor
src/components/email/*.tsx     (+) Phase B MJML templates
```

Every file above either doesn't exist yet or already hands brand-in-brand-out.
**No component file appears on this list.** That's the whole point.

---

## 12. The One-Line Mental Model

> **Brand is a property of the request, not a property of the component.**

Change the request's brand, every surface repaints. Change a component's
structure, every brand still looks right. They're orthogonal.

**Corollary:** If this integration is done right, the diff across Phase A is
~5 new files (`brand.ts`, `audit-design-tokens.ts`, optional test files) and
~2 edited files (`Layout.astro`, maybe one dashboard). Components should
appear in `git diff` only when the audit found true drift — usually never.

---

## See Also

- [PLAN-design-system.md](PLAN-design-system.md) — the mapping contract (v1.0, locked)
- [TODO-design-system.md](TODO-design-system.md) — Cycles 1–3 (contract + showcase + Thing override, complete)
- `../ONE/web/src/styles/derive.ts` — the pure derivation function
- `src/engine/brand.ts` — current `injectBrand` / `purpleBrand`; extends here
- `src/schema/one.tql` — `thing owns brand` (already added in Cycle 3)
- [dictionary.md](dictionary.md) — canonical names for the 6 tokens
- [rubrics.md](rubrics.md) — how each cycle scores itself

---

*Six tokens. Infinite surfaces. The elegance compounds only if nothing outside the six ever hardcodes a color.*
