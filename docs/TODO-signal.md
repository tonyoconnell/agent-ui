# TODO: Sync the Doc Tree to `signals.md`

**Goal:** Bring the canonical docs in line with [`signals.md`](signals.md) — the
new spec for the three-mode addressing grammar (`alice`, `world:tag`, bare
`world`) — without rewriting the world.

**Shape:** Four parallel waves. Each wave = one tick of the substrate loop, but
the receivers are Claude models instead of agents. Same pattern: select → ask →
outcome → mark/warn → drain.

```
   WAVE 1            WAVE 2          WAVE 3            WAVE 4
   recon             synth           edits             verify
   ─────             ─────           ─────             ──────
   10× Haiku   ──►   1× Opus   ──►   6× Sonnet   ──►   1× Sonnet
   parallel          (me, here)      parallel          single
   read+report       decide          rewrite           cross-check
```

Each arrow is a `mark()`. If a wave's outcome is bad, `warn()` and re-spawn
with a sharper prompt — don't advance until the wave's marks all hold.

---

## Why this shape

| Wave | Job kind | Model | Why this model |
|------|----------|-------|----------------|
| 1 | Read a file, extract sections, report verbatim | **Haiku** | Pure I/O, no judgment, cost ≈ free |
| 2 | Hold 10 reports + `signals.md` together, decide exact diffs | **Opus** (me) | Synthesis. Never delegate understanding. |
| 3 | Apply specified edits in established voice | **Sonnet** | Prose fit matters, but the *what* is decided |
| 4 | Re-read everything, check internal consistency | **Sonnet** | Needs to hold multiple files in mind, but no decisions left |

The rule: **Haiku reads, Opus decides, Sonnet writes, Sonnet checks.**
Parallelism within waves. Sequential between waves.

---

## Wave 1 — Reconnaissance (parallel Haiku)

Spawn 10 agents in a single message. Each is a one-shot read+report. None of
them need to know about the others. All outputs flow back to me for Wave 2.

**Hard rule for every Wave 1 prompt:** "Report verbatim where possible. Do not
synthesize. Do not propose changes. Under 300 words."

### A1 — `plan-llm-routing.md` triage

> Read `docs/plan-llm-routing.md` end to end. Report: (a) the core problem it
> states, (b) the solution it proposes, (c) any specific receiver/grammar
> proposals it makes, (d) whether the document positions itself as a plan,
> spec, or exploration. Verbatim quotes for anything that looks like a
> grammar or syntax proposal. Under 300 words.

### A2 — `receivers.md` catalog

> Read `docs/receivers.md`. List every "kind" of receiver it catalogs (human,
> API, AI, world, etc.) and any concrete `receiver: '...'` syntax examples it
> shows. Note whether it discusses `world:` style addressing or only direct
> addressing. Under 300 words.

### A3 — `gaps-receivers.md` gap list

> Read `docs/gaps-receivers.md`. List the 5 structural gaps verbatim, with
> their current status. Note any gap that mentions routing, classification,
> or LLM-based receiver resolution. Under 300 words.

### A4 — `plan-receivers.md` build order

> Read `docs/plan-receivers.md`. List the build-order steps verbatim. Note
> which steps relate to addressing/routing vs unrelated work. Under 300 words.

### A5 — `primitives.md` signal shape

> Read `docs/primitives.md`. Find and quote verbatim every place that defines
> the `Signal` shape or shows `{ receiver, data }` examples. Report section
> headers (`##`) so I can locate them. Under 300 words.

### A6 — `events.md` signal shape

> Read `docs/events.md`. Find and quote verbatim every place that defines the
> `Signal` shape or shows receiver-string examples. Report section headers.
> Under 300 words.

### A7 — `DSL.md` Addressing section verbatim

> Read `docs/DSL.md`. Quote verbatim two sections: (1) `## Addressing` (around
> line 277), and (2) `### Emergent Routing` (around line 54). Also quote any
> sentence in the doc that mentions the word "world" as a routing concept.
> Do not edit. Verbatim only.

### A8 — `dictionary.md` Receiver section verbatim

> Read `docs/dictionary.md`. Quote verbatim the section `## The Receiver`
> (around line 40) and any other passage that defines what a receiver is.
> Verbatim only.

### A9 — Tutorial receiver examples

> Grep `docs/tutorial.md`, `docs/code-tutorial.md`, `docs/examples.md`,
> `docs/100-lines.md` for any line containing `receiver:` or `{ receiver`.
> Report the file, line number, and the full code block (3 lines context).
> No commentary. Just the matches.

### A10 — `flows.md` receiver patterns

> Grep `docs/flows.md` for `receiver:` and report matches with 3-line
> context. Note any place that gestures at "world picks" or emergent
> routing. No commentary.

**Wave 1 outcome model:** every agent returns either a report (= `result`),
silence past 60s (= `timeout`, re-spawn once), or "file not found" (=
`dissolved`, drop the task — it means the doc doesn't exist and Wave 2
adapts). I do not advance to Wave 2 until 9 of 10 reports are in. The
missing one becomes a Wave 2 input as "absent."

---

## Wave 2 — Synthesis (Opus, in main context)

This is the wave that **must not be delegated**. I take the 10 reports and
`signals.md` and produce, for each downstream doc, an exact diff specification:
old text → new text, with rationale. Output of this wave is a set of *Wave 3
prompts* — each one a self-contained edit job ready to ship to a Sonnet agent.

**Decisions to make in Wave 2:**

1. **`plan-llm-routing.md` — supersede, merge, or keep?**
   Default: if A1 reports it as solving the same problem signals.md just
   solved, replace its body with a one-line redirect: `**Superseded by
   [signals.md](signals.md).** See that doc for the addressing grammar and
   cold-miss flow.` Keep the file as a tombstone so old links don't 404.
   If A1 reports it covers something *additional* (e.g., model selection,
   not routing), merge the unique parts into signals.md and tombstone the rest.

2. **`receivers.md` — keep, complement.**
   Decision is firm: this doc is about *what kinds of things* can receive
   (humans, APIs, AI, worlds). signals.md is about *how to address them*.
   They're orthogonal. Add a one-line cross-link at the top of receivers.md
   pointing to signals.md and vice versa. No content rewrite.

3. **`gaps-receivers.md` — which gaps just closed?**
   Walk A3's 5 gaps. Any gap about LLM routing or receiver resolution is
   now closed by `world:` + lazy classification. Mark closed gaps with
   `~~strikethrough~~` and a `→ closed by signals.md`. Don't delete — the
   history matters.

4. **`plan-receivers.md` — re-prioritize.**
   Walk A4's build order. Steps that depended on the closed gaps move to
   "done." Steps that remain stay in order. Add a header note pointing to
   the closed gaps.

5. **`DSL.md` `## Addressing` — exact diff.**
   Using A7's verbatim quote, write the new section text. The new version
   must: (a) introduce the three-mode grammar, (b) keep all existing direct
   examples, (c) link to signals.md as the canonical spec, (d) not duplicate
   signals.md's content — be a summary that points there.

6. **`DSL.md` `### Emergent Routing` — exact diff.**
   Using A7's quote, replace the handwave "world picks" with the formal
   `world:tag` syntax. Keep the section short — it's an introduction; the
   spec lives in signals.md.

7. **`dictionary.md` `## The Receiver` — exact diff.**
   Using A8's verbatim quote, add `world:` as a second receiver kind. One
   paragraph + the grammar block. Link to signals.md.

8. **`primitives.md` and `events.md` — touch only if A5/A6 found
   signal-shape definitions.** If they only mention `{ receiver, data }`
   abstractly, no edit needed. If they show direct-only examples, add one
   `world:` example.

9. **Tutorial cosmetic updates — opt-in only.**
   Walk A9's matches. For each tutorial, if a natural place exists to add a
   `world:review` example without disrupting the narrative, write the diff.
   If not, skip — these are nice-to-have, not blocking.

10. **`flows.md` — touch only if A10 found a contradiction.**
    Otherwise leave alone; it's already linked from routing.md See Also.

**Wave 2 output format:** For each decided edit, produce:

```
TARGET:    docs/foo.md
ANCHOR:    "<exact unique substring of existing text>"
ACTION:    replace | insert-after | insert-before | tombstone
NEW:       <new text>
RATIONALE: <one sentence>
```

This format is what Wave 3 consumes. The anchors must be exact substrings so
Sonnet agents can `Edit` without re-reading the whole file.

---

## Wave 3 — Edits (parallel Sonnet)

Spawn one agent per edit job, all in a single message. Each agent gets:

- the target file path
- the exact anchor string
- the new text
- a one-line rationale
- the rule: "Use `Edit` with the anchor as `old_string`. Do not modify
  anything else in the file. Do not add commentary. If the anchor doesn't
  match exactly, return `dissolved` and stop."

**Why Sonnet, not Haiku, for this wave:** the new text needs to fit the
house voice (terse, dense, ASCII-diagram-friendly, `---` separators). Haiku
will technically apply the edit, but Sonnet will catch micro-mismatches —
"the surrounding paragraphs use second person, my new text uses third" —
and adjust. That's the kind of style-fit judgment worth the cost difference.

**Expected jobs (Wave 2 will produce the actual list):**

| ID | File | Anchor (rough) | Why |
|----|------|----------------|-----|
| E1 | `DSL.md` | `## Addressing` | Add three-mode grammar |
| E2 | `DSL.md` | `### Emergent Routing` | Replace handwave with `world:` |
| E3 | `dictionary.md` | `## The Receiver` | Add `world:` as receiver kind |
| E4 | `primitives.md` | (only if Wave 2 says so) | Show `world:` in signal shape |
| E5 | `events.md` | (only if Wave 2 says so) | Same |
| E6 | `gaps-receivers.md` | each closed gap | Strikethrough + redirect |
| E7 | `plan-receivers.md` | top of file | Note about closed gaps |
| E8 | `plan-llm-routing.md` | whole body | Tombstone redirect |
| E9 | `receivers.md` | top of file | Cross-link to signals.md |

**Wave 3 outcomes:**
- `result`: agent reports edit applied. `mark()` the job. Move on.
- `dissolved`: anchor didn't match. The file changed since Wave 1 read it
  (concurrent edit) OR Wave 2's anchor was wrong. `warn(0.5)`, re-read the
  file, regenerate the anchor, re-spawn once. If it dissolves twice,
  escalate to me — something is genuinely off.
- `timeout`: probably hung on a tool call. Re-spawn once.
- `failure`: agent applied a wrong edit. `warn(1)`, revert via git, re-spawn
  with sharper instructions.

---

## Wave 4 — Verify (one Sonnet)

Single agent, sequential. Its job is the cross-check pass — the equivalent
of `know()` in the substrate's loop, where successful patterns get promoted
to permanent knowledge.

**Prompt:**

> Read these files in order: `docs/signals.md`, `docs/routing.md`,
> `docs/DSL.md`, `docs/dictionary.md`, `docs/primitives.md`, `docs/events.md`,
> `docs/receivers.md`, `docs/gaps-receivers.md`, `docs/plan-receivers.md`,
> `docs/plan-llm-routing.md`. Check:
>
> 1. Every doc that mentions a receiver grammar uses the same three-mode
>    syntax (`alice`, `world:tag`, bare `world`).
> 2. Every doc that links to `signals.md` uses the correct relative path.
> 3. No doc still says "Two forms. Nothing else." or similar pre-update
>    language about the receiver count.
> 4. `plan-llm-routing.md` is either tombstoned or contains content that
>    `signals.md` does not cover.
> 5. `gaps-receivers.md` strikethroughs are consistent with closed gaps.
>
> Report any inconsistency. Do not edit — just report. If everything is
> consistent, say so explicitly.

**Wave 4 outcome:**
- "consistent" → mark TODO complete.
- "inconsistencies found" → each one becomes a Wave 3.5 micro-job
  (single Sonnet edit). Re-run Wave 4. Loop until consistent.

---

## The substrate-loop analogy, made literal

```
     ┌──────────────────────────────────────────────────────────┐
     │                                                          │
     │  WAVE 1 (Haiku × 10)                                     │
     │    select: 10 read jobs                                  │
     │    ask:    spawn all in one message                      │
     │    outcome: { result | timeout | dissolved }             │
     │    mark:   each return                                   │
     │    drain:  collect all into Wave 2 inputs                │
     │                                                          │
     │  WAVE 2 (Opus, me, in this conversation)                 │
     │    fold:   10 reports + signals.md → diff specs          │
     │    decide: which gaps closed, which docs touched         │
     │    emit:   N edit prompts                                │
     │                                                          │
     │  WAVE 3 (Sonnet × N)                                     │
     │    select: N edit jobs                                   │
     │    ask:    spawn all in one message                      │
     │    outcome: { result | dissolved | failure }             │
     │    mark:   successful edits                              │
     │    warn:   anchor mismatches → re-spawn once             │
     │    drain:  all edits applied                             │
     │                                                          │
     │  WAVE 4 (Sonnet × 1)                                     │
     │    sense: read all updated docs                          │
     │    check: cross-doc consistency                          │
     │    if clean → mark, done                                 │
     │    if dirty → spawn micro-edits → re-check (loop)        │
     │                                                          │
     └──────────────────────────────────────────────────────────┘
```

Same primitives, different substrate. Reads are signals. Outcomes are
marks. Failures `warn` and re-spawn with sharper prompts. The loop
terminates when Wave 4 reports clean.

---

## Status

- [ ] Wave 1 — Reconnaissance (10 Haiku, parallel)
  - [ ] A1 plan-llm-routing.md triage
  - [ ] A2 receivers.md catalog
  - [ ] A3 gaps-receivers.md gap list
  - [ ] A4 plan-receivers.md build order
  - [ ] A5 primitives.md signal shape
  - [ ] A6 events.md signal shape
  - [ ] A7 DSL.md Addressing verbatim
  - [ ] A8 dictionary.md Receiver verbatim
  - [ ] A9 tutorial receiver examples
  - [ ] A10 flows.md receiver patterns
- [ ] Wave 2 — Synthesis (Opus, main context)
  - [ ] Decide plan-llm-routing.md fate
  - [ ] Walk gaps, mark closed
  - [ ] Walk plan-receivers.md, re-prioritize
  - [ ] Produce diff specs for E1–E9
- [ ] Wave 3 — Edits (Sonnet, parallel)
  - [ ] E1 DSL.md ## Addressing
  - [ ] E2 DSL.md ### Emergent Routing
  - [ ] E3 dictionary.md ## The Receiver
  - [ ] E4 primitives.md (conditional)
  - [ ] E5 events.md (conditional)
  - [ ] E6 gaps-receivers.md
  - [ ] E7 plan-receivers.md
  - [ ] E8 plan-llm-routing.md tombstone
  - [ ] E9 receivers.md cross-link
- [ ] Wave 4 — Verify (Sonnet)
- [ ] Mark complete

---

## Cost discipline

| Wave | Agents | Model | Approx cost share |
|------|--------|-------|-------------------|
| 1 | 10 | Haiku | ~5% |
| 2 | 0 (in main) | Opus | ~0% (already in conversation) |
| 3 | 6–9 | Sonnet | ~70% |
| 4 | 1 | Sonnet | ~15% |
| 3.5 (loop) | variable | Sonnet | ~10% |

The expensive wave is Wave 3, which is unavoidable — that's where prose
quality lives. Wave 1 is nearly free; Wave 4 is a single sequential read
pass. Total job is bounded; no unbounded loops.

**Hard stop:** if Wave 4 loops more than 3 times, halt and escalate. That
means Wave 2's diff specs were wrong and the whole thing needs human review.

---

## What this TODO is *not*

- **Not a replacement for human review.** A maintainer should eyeball the
  diff before commit. The agents apply edits; they don't merge.
- **Not a substrate task graph.** This doc is a one-shot playbook. It does
  not get added to TypeDB or driven by `/work`. (If you want it driven by
  `/work`, the conversion is mechanical: each Wave-3 job becomes a `skill`
  with the prompt as its body.)
- **Not parallel across waves.** Waves are sequential. Parallelism is
  *within* each wave. Wave 2 cannot start until Wave 1's reports are in;
  Wave 3 cannot start until Wave 2's diff specs exist; Wave 4 cannot start
  until Wave 3's edits are applied. This is the same as `signal → ask →
  outcome → mark → drain` — one tick at a time.

---

## See Also

- [signals.md](signals.md) — the spec being propagated
- [routing.md](routing.md) — already updated; reference for tone
- [DSL.md](DSL.md) — primary Wave 3 target
- [dictionary.md](dictionary.md) — secondary Wave 3 target

---

*Four waves. One direction. Haiku reads, Opus decides, Sonnet writes,
Sonnet checks. Same loop as the substrate, different receivers.*
