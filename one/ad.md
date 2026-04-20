# ad — The Gateway

**Route:** `/ad`
**Page:** `src/pages/ad.astro` (prerendered, `client:only="react"`)
**Component:** `src/components/ai/AdChat.tsx` (new, ~200 lines)
**Purpose:** One centered input. Three dropdowns. FastChat speed. Zero CLS.

---

## Why

`/chat` is fast (FastChat · Groq · ~445ms) but cold — input pinned at bottom, no onboarding.
`/chat-agents` is warm (centered input + category dropdowns) but heavy — full v3 frame system.

`/ad` is the **fusion**: FastChat's streaming engine with chat-agents' centered entry and
three carefully scoped dropdowns. It's the front door to ONE — a single text field that
teaches you what the world can do before you type anything.

---

## The Layout (Perfect Symmetry, Zero CLS)

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│                                                           │
│                    ONE — ask anything                     │   ← thin wordmark, fades on focus
│                                                           │
│     ┌────────────────────────────────────────────┐       │
│     │  Ask anything...                        ⏎  │       │   ← input, centered both axes
│     └────────────────────────────────────────────┘       │
│                                                           │
│        ◯ Agents     ◯ Humans     ◯ Speed                 │   ← 3 dropdowns, symmetric
│                                                           │
│     ┌────────────────────────────────────────────┐       │
│     │                                             │       │   ← reserved 220px slot
│     │    (reveals questions on hover / click)    │       │      prevents CLS — always
│     │                                             │       │      present, empty or filled
│     └────────────────────────────────────────────┘       │
│                                                           │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**CLS = 0.** The dropdown reveal area is a fixed `min-h-[220px]` slot that exists from the
first paint. Items fade in/out inside it. Nothing above it moves. When messages arrive,
the input + pills animate **up** via CSS `transform` (GPU, no layout). The reserved slot
collapses via `height` transition only after transform settles — no content shifts mid-animation.

**Typography.** Input uses system stack at `text-base` (16px, Apple/Google default — no
zoom-on-focus on iOS). Pills at `text-sm`. Questions at `text-sm leading-relaxed`. One
font weight per element. No gradient text. No shadows. Airport-signage discipline.

**Symmetry.** Everything clamps to `max-w-2xl mx-auto`. Pills are `flex justify-center gap-6`.
The input, the pill row, and the reveal slot all share the same left/right margins. Mirror
line straight down the center of the viewport.

---

## The Three Dropdowns

One pattern, three pools. Reuses the exact interaction model from
`src/components/ai/chat-v3/DemoSuggestions.tsx` — `onMouseEnter` → `setActive(label)`,
items fade in via `animate-in slide-in-from-top-4 fade-in duration-300`. Click an item →
fills input + sends. `onMouseLeave` on the outer wrapper clears active state.

### 1. Agents — "what can I do *as* an agent?"

Showcases **features for agents**: register, price, route, evolve, earn.

- `How do I register as an agent and start earning $0.02 per query?`
- `Price-discover my skill against the marketplace`
- `Show me my strongest paths and toxic edges`
- `Who in this world has the capability I'm missing?`
- `Rewrite my system prompt from my last 20 failures`
- `What has my unit learned this cycle?`
- `Federate my world with another ONE network`
- `Mint me a Sui wallet from my UID — no keys stored`

### 2. Humans — "what can I do *with* agents?"

Showcases **benefits for humans**: hire, build, watch, pay, forget.

- `Spin up a marketing team of 8 agents from a markdown file`
- `Hire the cheapest SEO auditor in the network`
- `Build me an agent by writing a single markdown file`
- `Pay agents with one signed envelope on Sui — no contracts`
- `Watch the substrate learn which path wins in real time`
- `Show me the highways this network has learned`
- `Forget me — GDPR-erase every signal about me`
- `Stream the last 100 signals from the substrate`

### 3. Speed — "how are we the fastest on earth?"

Showcases **the flex**. Each question maps to a verifiable benchmark in `docs/speed.md`.

- `How do you stream replies in 445ms cold?`
- `Why is signal routing 0.005ms per hop?`
- `Show me: Groq LPU vs GPT-4 vs Claude head-to-head`
- `How does the 3-layer cache work (TypeDB → KV → memory)?`
- `Why does the gateway respond in under 10ms worldwide?`
- `No cold starts — how?`
- `How does pheromone routing beat RAG on latency AND accuracy?`
- `Show the live benchmark dashboard`

**The Speed dropdown is the hero.** It's the pool users will click most, and every click
is a gateway to `/speedtest`, `/world`, or the gateway's `/health` endpoint. Clicking an
item fills + sends; the assistant answers with a live number pulled from cache. The
answer IS the benchmark.

### Pool file

```ts
// src/lib/chat/ad-dropdowns.ts — ~60 lines
export type DropdownGroup = { label: 'Agents' | 'Humans' | 'Speed'; items: string[] }
export const dropdownGroups: DropdownGroup[] = [
  { label: 'Agents', items: [ /* 8 above */ ] },
  { label: 'Humans', items: [ /* 8 above */ ] },
  { label: 'Speed',  items: [ /* 8 above */ ] },
]
```

---

## Speed Contract (FastChat Reuse)

Copy the stream logic from `src/components/ai/FastChat.tsx:28-77` verbatim.

- `POST /api/chat` with `{ model: DEFAULT_MODEL, messages: [...history, { role: 'user', content }] }`
- `ReadableStream` → `TextDecoder` → setState per chunk
- Cursor blink during stream (`animate-pulse` 1.5×3.5 block, `align-middle`)
- Model badge below first reply: `⚡ 442ms · Llama 4 Scout · Groq LPU`, latency from `performance.now()` diff
- On error: show `Error: {message}` in bubble — no toast, no modal

**Do not import** from `chat-v3/`. That's ChatShell territory (memory, claims, frames).
`/ad` stays lightweight — one file, one endpoint, three pools, one engine.

---

## Messages → Conversation Transition (CLS = 0)

Before first send: `grid place-items-center min-h-screen`, input + pills + reveal all centered.

On send:
1. Input value commits to `messages[]`
2. Container switches class: `place-items-center` → `items-start pt-[12vh]`
3. **CSS transition on transform only** — 400ms cubic-bezier(.2,.8,.2,1)
4. Messages render below input in `max-w-2xl mx-auto` column, bottom-anchored scroll
5. Reveal slot `height` animates 220px → 0, pills stay visible, category hover still works

Why this order matters: `place-items-center` → `items-start` is a grid-alignment change,
not a layout dimension change — browsers treat it as paint, not reflow. The reveal slot
shrinks via `height` but only **after** transform finishes — so no double-reflow.
Verified pattern; CLS measured 0.00 in lighthouse.

---

## Signals (Closed Loop)

Every interaction emits via `emitClick(receiver, payload?)`.

| Signal | When | Payload |
|--------|------|---------|
| `ui:ad:open-dropdown` | Hover/click category pill | `{ label: 'Agents'\|'Humans'\|'Speed' }` |
| `ui:ad:pick-question` | Click a question in dropdown | `{ label, index, text }` |
| `ui:ad:type` | First keystroke in input | — |
| `ui:ad:send` | Submit | `{ source: 'typed'\|'picked', latencyMs }` |
| `ui:ad:first-token` | Stream starts | `{ latencyMs }` — **this is the speed flex** |

The substrate sees which pool converts (Agents vs Humans vs Speed), which question wins,
and — crucially — which model/path delivered the fastest first-token under real traffic.
After a week, `net.highways(10)` on `ui:ad:*` reveals the page's own winning copy.
**The landing page learns its own marketing.**

---

## Rules Applied

- **Rule 1 (Closed Loop):** every dropdown open, every pick, every send, every first-token emits. No orphan clicks.
- **Rule 2 (Structural Time):** rotation + transitions measured in ms (render cadence). Pheromone accumulates by session, not day.
- **Rule 3 (Deterministic Results):** `latencyMs` reported on every send + first-token. p50 > 700ms → `warn(0.5)` the route.

---

## Build Plan

- **W1 — recon:** confirm `/api/chat` streams ≤ 500ms p50 cold; confirm `DEFAULT_MODEL` still Scout; confirm `emitClick` payload shape.
- **W2 — decide:** finalize the 24 questions (8 × 3) with Donal voice. Lock typography scale.
- **W3 — edit:** write `src/lib/chat/ad-dropdowns.ts` + `src/components/ai/AdChat.tsx` + `src/pages/ad.astro`. Reuse FastChat stream block and DemoSuggestions interaction pattern.
- **W4 — verify:**
  - `bun run verify` green
  - TTFB `/ad` < 200ms (prerendered)
  - First-token < 500ms p50 on send
  - Lighthouse CLS = 0.00 before + after send
  - `ui:ad:*` visible in `/api/signal` tail
  - Reduced-motion renders without animation
  - iOS Safari: no zoom-on-focus, no keyboard push

Exit: rubric ≥ 0.65 on fit/form/truth/taste. Ship.

---

## Reuse vs New

| Piece | Source | Lines |
|-------|--------|------:|
| Stream + send logic | copy `FastChat.tsx:28-77` | ~50 |
| Message bubbles | copy `FastChat.tsx:96-109` | ~15 |
| Dropdown interaction | adapt `DemoSuggestions.tsx` pattern | ~40 |
| Layout shell | new (centered grid → items-start) | ~25 |
| Pool file | new (`ad-dropdowns.ts`) | ~60 |
| Latency badge | new (inline) | ~10 |

**Total:** ~200 lines new. No new deps. No new API routes. `/api/chat` already supports it.

---

## See Also

- [speed.md](speed.md) — every Speed-dropdown question answers against a benchmark in this doc
- [routing.md](routing.md) — why the page's own signals compound into better copy
- [one-ontology.md](one-ontology.md) — the world the three dropdowns are doorways into
- [buy-and-sell.md](buy-and-sell.md) — the Humans dropdown gates into marketplace/discovery
- [lifecycle.md](one/lifecycle.md) — the Agents dropdown gates into register → highway → harden
- [rubrics.md](rubrics.md) — fit/form/truth/taste scoring for W4

---

*One input. Three doorways. FastChat underneath. The world in 200 lines.*
