# /do

**Skills:** `/signal` (mark/warn/dissolve outcomes) · `/typedb` (query tasks, write pheromone) · `/todo` (scaffold plans, render dashboard)

> **Before anything else:** Read `docs/TODO.md` AND load the `/todo` skill's *"The world this skill builds for"* block (humans+agents, biometric+Capability, reputation+whitelabel — 7 properties). Every cycle inherits those constraints. A cycle that weakens any of the 7 fails the rubric, regardless of security/stability/simplicity/speed scores.

Drive work through the substrate — select and execute.

---

## Loop optimizations (compounding — every cycle faster + more accurate than the last)

These fire *automatically*. The wave handlers below reference them by number.

| # | Optimization | Fires | Mechanism |
|---|---|---|---|
| 1 | **Recon cache** | W1 | Each agent prompt prepends: *"check `kv:recon:{sha256(path)}:{short_sha}` — hit + age < 14d → return cached, `mark(recon:hit:{topic})`. Miss → read + write cache, `mark(recon:miss:{topic})`."* Stable files become free reads; churning files get re-read. |
| 2 | **W2 context auto-load** | W2 start | Auto-load (no manual injection): `source_of_truth` from frontmatter + last 20 `learnings.md` entries with overlapping tags + `dictionary.md` + `rubrics.md`. W2 begins warm. |
| 3 | **W3 prompts auto-gen** | W2 → W3 | W2 outputs `TARGET / ANCHOR / ACTION / NEW / RATIONALE` blocks. Skill mechanically converts each to one Sonnet agent prompt. Spawn N agents in one message. No hand-crafted prompts. |
| 4 | **Verify-only-what-changed** | W3 → W4 (per-wave) | `git diff --name-only HEAD` → dependency cone (tsc). Run vitest only on tests importing the cone. Full `bun run verify` reserved for cycle close (W4 cycle gate). Cuts W4 latency 70-90% on small cycles. |
| 5 | **Pheromone-routed SELECT** | autonomous loop SELECT | Score = `priority + strength − resistance + tag-warmth`. `tag-warmth` = sum of `loop:feedback` strength on edges matching candidate tags. Loop discovers which work-styles ship; failing patterns starve at the configured `sensitivity` rate. |
| 6 | **Split-test in W3** | W3 when frontmatter declares `split_tests` | For each split point: spawn N variants (different model / prompt / approach — see `template-plan.md` frontmatter). All verified at W4. Winner gets `mark()` on its tags + `(model:X, prompt:Y)`. Losers `warn(0.5)`. Outcome logged to `learnings.md`. |
| 7 | **Cycle-size cap** | every cycle start + every plan write | Refuse cycle with > 5 tasks unless `mode: lean`. Refuse plan > 5 cycles unless every cycle is lean. Hard gate — no override. The 100-cycle anti-pattern dies on arrival. |
| 8 | **Trust budget** | every cycle close | Rolling 7-cycle composite: ≥ 0.85 for 3+ consecutive cycles → `trusted` (skip show-pause); 0.65–0.85 → `standard`; < 0.65 for 2 consecutive cycles → `cautious` (require `/do next`). Counter resets to 0 on any cycle that breaks the streak. Tracked in learnings.md. Emit `loop:trust:{level}`. Default: `standard`. |

**Trust budget** (optimization #8 — earns autonomy through track record):

| Level | Condition | --auto behavior |
|-------|-----------|-----------------|
| `trusted` | composite ≥ 0.85 for 3+ consecutive cycles | skip show-pause; log `[trust:trusted] continuing...`; start next cycle immediately |
| `standard` | composite 0.65–0.85 (default when no history) | normal show-pause after each cycle |
| `cautious` | composite < 0.65 for 2 consecutive cycles | render show-frame + `[trust:cautious] halting — run /do next to continue`; stop |

Counter rules: each counter tracks *consecutive* cycles at that condition. Any cycle that breaks the streak resets the counter to 0 (e.g. one composite ≥ 0.65 resets the cautious counter; one composite < 0.85 resets the trusted counter). `/do next` resumes the next cycle — a passing result resets cautious; a failing result does not re-trigger cautious until 2 consecutive fails accumulate again.

Tracked: rolling 7-cycle composite avg written to learnings.md at each cycle close.
Format: `trust: {level} composite={X.XX} cycles_at_level={N}` (`cycles_at_level` = consecutive cycles at current level)
Transition signals: `loop:trust:trusted` · `loop:trust:standard` · `loop:trust:cautious`

**Compounding effect.** #1+#2 cut tokens per cycle. #3+#4 cut wall-clock. #5+#6 make the loop self-tune. #7 keeps every plan shippable. After 50 cycles: materially smarter task selection, materially faster verification, materially less manual prompt-crafting. Not because we improved the algorithm — because the substrate has memory and the loop reads it.

**Constraint set.** *Minimize context. Maximize accuracy. Be succinct. Progressive. Self-learning. Secure.* Every wave handler MUST honor these. If a wave is doing work that's not covered by one of the 8 optimizations, it's manual labor that should be automated next cycle.

---

## `--show` — autonomous build, human delight

Default behavior of `/do <plan> --auto` for any plan with `show: true` in its frontmatter. The loop runs every cycle without intervention; it pauses at each cycle close to render a **cycle frame** — a single 80-column block that shows the human exactly what just shipped, what it unlocked, and what's next. The pause is a render, not an input wait. Press `Ctrl-C` to stop; otherwise it auto-continues to the next cycle.

### The cycle frame format

```
╭──────────────── C{n} / {plan-slug} / {cycle-name} ────────────────╮
│  ✓ Cycle {n} of {N} complete                       rubric: 0.XX  │
│                                                                   │
│  Wave gates (W0 → W4)                                             │
│  ───────────────                                                  │
│    W0  bun run verify          ✓  {pass}/{total}                  │
│    W1  recon                   ✓  {N} files ({hits} cache hits)   │
│    W2  decide                  ✓  {decisions} decisions           │
│    W3  edit (parallel)         ✓  {marked}/{dissolved-retried}    │
│    W4  verify (scoped)         ✓  +{Δ} tests, biome+tsc clean     │
│                                                                   │
│  Rubric                                                           │
│  ───────                                                          │
│    security {0.XX}  stability {0.XX}  simplicity {0.XX}  speed {0.XX} │
│    composite {0.XX}    ✓ above 0.65 gate                          │
│                                                                   │
│  Speed                                                            │
│  ─────                                                            │
│    {metric}  {value}  (target {budget} {✓|✗})                     │
│                                                                   │
│  What this unlocks                                                │
│  ─────────────────                                                │
│    👤 customer  {one sentence — what a human can now do}          │
│    🤖 agent     {one sentence — what an agent can now do}         │
│                                                                   │
│  Lifecycle  [✓] {stage 1}  →  [✓] ...  →  [ ] {next stage}        │
│                                                                   │
│  Next: C{n+1} — {next cycle name + one-line preview}              │
│                                                                   │
│  Continuing in --auto... (Ctrl-C to stop)                         │
╰───────────────────────────────────────────────────────────────────╯
```

After the final cycle, render a **lifecycle replay**: a short narrative that walks the customer + agent through every stage that the build now supports, in order. This is the moment of delight. The human sees not "4 cycles closed" but "Sarah can now land here, switch groups, edit, rewind time, and verify on-chain — all because of what just shipped."

### What goes in each section

| Section | Source | Rule |
|---|---|---|
| Wave gates | telemetry from each wave's logger | one line per wave, ✓/✗ + one number |
| Rubric | W4 markDims output | four numbers + average + gate-pass status |
| Speed | `/api/speed` budgets relevant to this cycle | only the metrics this cycle changed |
| What unlocks | the plan's `lifecycle_show` frontmatter block | exactly two sentences, customer + agent |
| Lifecycle | the plan's `lifecycle: [stages]` frontmatter | checkbox row, ✓ for done, [ ] for pending |
| Next | next unchecked cycle in plan + first task | one line; if last cycle, render lifecycle replay instead |

### Frontmatter required for show mode

```yaml
show: true
lifecycle: [stage-1, stage-2, stage-3, stage-4, stage-5]   # ordered
lifecycle_show:                                              # one block per cycle
  C1:
    customer: "{one sentence — concrete user, concrete action}"
    agent: "{one sentence — concrete agent, concrete capability}"
    unlocks_stage: "stage-1"
  C2:
    customer: "..."
    agent: "..."
    unlocks_stage: "stage-2"
```

If `show: true` but no `lifecycle_show` block, render the frame with `(no lifecycle narration)` and warn — the plan author should fill it in. This is the soft-gate that nudges every plan to think about who benefits.

### Why this is the default for `--auto`

Without `--show`, `/do --auto` is a wall of agent JSON and test output. The human watches a log scroll. With `--show`, every cycle is a ceremony — a 30-line frame that says: *here's what we built, here's what it cost, here's what it means, here's what's next.* Same execution. Different rendering. The human stays in the loop without being in the way.

Self-correcting hook: each frame emits `ui:do:show:rendered { cycle, rubric, lifecycle_stage }`. Cycles whose frames the human Ctrl-C's get `warn(0.5)` on the cycle's tag — a rendered frame that's stopped is a signal that something looked wrong. Future cycles with similar tags raise their security/stability bar at W2.

## Modes

| Mode | What | Loop |
|------|------|------|
| `<intent>` | Natural language → find context → fastest path | L1, L2 |
| `<TODO-file>` | Advance next wave of the TODO (wave-at-a-time) | L1, L2 |
| `<TODO> --auto` | Run W1→W4 continuously until all cycles done | L1, L2 |
| `<TODO> --wave N` | Run a specific wave (override auto-detect) | L1, L2 |
| *(empty)* | Autonomous loop: pick → execute → mark → repeat | L1, L2 |
| `--once` | Single iteration of the autonomous loop | L1, L2 |

---

## Intent Mode — `/do <natural language>`

When arguments are NOT a TODO filename, --auto, --wave, --once, or empty,
treat them as **intent** and route to the fastest execution path.

### Step 1: Extract Topic

Parse the intent into a **topic slug** (kebab-case, 2-4 words max):

```
"create a landing page"     → landing-page
"fix the auth middleware"   → auth-middleware
"add payment tracking"      → payment-tracking
"refactor the loop"         → loop
```

### Step 2: Search for Context

Search for existing files matching the topic (run in parallel):

```bash
# Pattern 1: TODO files
glob "**/TODO*{topic}*.md" | head -5

# Pattern 2: Spec/plan docs
glob "**/*{topic}*.md" | head -10

# Pattern 3: Source files (for fix/refactor intents)
glob "**/*{topic}*" --type ts,tsx,astro | head -10

# Pattern 4: Task mentions in one/
glob "one/**/*{topic}*.md" | head -5
```

Collect: `{ todos: [], specs: [], sources: [], tasks: [] }`

### Step 3: Reflect — What Do We Have?

| Found | State | Fastest Path |
|-------|-------|--------------|
| TODO file exists | Execution queued | → Use existing TODO mode |
| Spec exists, no TODO | Spec defines scope | → Create TODO from spec, then execute |
| Sources exist, no spec | Code is the spec | → Direct execution (simple) or create TODO (complex) |
| Nothing exists | Greenfield | → Ask user for scope OR create minimal TODO |

**Complexity heuristic** (determines TODO vs direct):
- "create" / "add" / "build" → likely needs TODO (multi-wave)
- "fix" / "update" / "tweak" → likely direct execution
- "refactor" → read scope first, then decide

### Step 4: Report and Route

Output a reflection block before proceeding:

```
┌─ /do intent: "{original intent}"
│
│  Topic:   {topic-slug}
│  Found:   {N} TODOs, {M} specs, {K} sources
│
│  Context:
│    • {file1} — {one-line summary}
│    • {file2} — {one-line summary}
│    ...
│
│  Decision: {direct | create-todo | use-existing}
│  Rationale: {why this path is fastest}
│
└─ Proceeding with: {next action}
```

### Step 5: Execute

**If TODO exists:** Switch to `<TODO-file>` mode with that file.

**If spec exists, no TODO:**
1. Read the spec fully
2. Extract: goal, scope, constraints, exit criteria
3. Create `docs/TODO-{topic}.md` using the TODO template
4. Populate cycles/waves from spec structure
5. Switch to `<TODO-file>` mode with new TODO

**If sources exist, no spec (simple):**
1. Read the relevant source files
2. Execute the fix/update directly
3. Run `bun run verify`
4. Mark outcome via `/close`

**If sources exist, no spec (complex):**
1. Read the relevant source files
2. Create minimal TODO with one cycle
3. Switch to `<TODO-file>` mode

**If nothing exists:**
1. Ask: "No existing context for '{topic}'. What's the goal? (one sentence)"
2. Create `docs/TODO-{topic}.md` with user's answer as the goal
3. Switch to `<TODO-file>` mode

---

## Routing

`/do` maps to `select()` + the tick loop — driving signals through the
deterministic sandwich. Every execution closes its loop per Rule 1:
mark() on result, warn() on failure, warn(0.5) on dissolved, neutral on timeout.

| Mode | Primitive | Termination |
|------|-----------|-------------|
| `<intent>` | search → reflect → route | routes to one of below |
| `<TODO>` | wave handler | one wave completes |
| `--auto` | wave handler × N | all cycles complete |
| `--wave N` | wave handler | one wave completes |
| empty | `select()` | user interrupts |
| `--once` | `select()` | one task completes |

## Wave-Aware Model Routing

Every task has a `task-wave` attribute (W1/W2/W3/W4) that drives model selection:

| Wave | Model | Purpose |
|------|-------|---------|
| W1 | Haiku | Recon — fast parallel reads, pattern detection |
| W2 | Opus | Decide — complex reasoning, tradeoffs |
| W3 | Sonnet | Edit — precise refactors, code synthesis |
| W4 | Haiku × 5 | Verify — parallel rubric (security/stability/simplicity/speed) + adversarial |

When selecting next task, use `task.task-wave` to route the execution to the correct model.
Fallback to `EFFORT_MODEL` (Sonnet) if `task-wave` is absent.

---

## Skill Pre-flight Check

**Before executing ANY task**, verify required skills exist and are current.
This prevents mid-execution failures due to missing capabilities.

### Step 1: Infer Required Skills

Extract skills from task tags, intent, and file types:

```
Task tags: [ui, landing, astro]     → skills: [/astro, /shadcn, /react19]
Task tags: [typedb, schema]          → skills: [/typedb]
Task tags: [sui, wallet, bridge]     → skills: [/sui]
File types: *.astro, *.tsx           → skills: [/astro, /react19]
Intent: "create a landing page"      → skills: [/astro, /shadcn]
```

**Skill inference map:**

| Tag/Pattern | Required Skill | Why |
|-------------|----------------|-----|
| `ui`, `component`, `*.tsx` | `/react19` | React 19 patterns |
| `astro`, `page`, `*.astro` | `/astro` | Astro 6 + CF Workers |
| `shadcn`, `card`, `badge` | `/shadcn` | shadcn/ui components |
| `typedb`, `schema`, `tql` | `/typedb` | TypeDB 3.0 syntax |
| `sui`, `wallet`, `move` | `/sui` | Sui Move contracts |
| `graph`, `flow`, `node` | `/reactflow` | ReactFlow patterns |
| `deploy`, `worker`, `cf` | `/deploy` | Cloudflare deploy |
| `api`, `sdk`, `anthropic` | `/claude-api` | Claude API patterns |

### Step 2: Check Skill Status

For each required skill, check:

```bash
# Skill exists?
ls .claude/skills/{skill-name}/ 2>/dev/null

# Skill is current? (modified within 30 days)
find .claude/skills/{skill-name}/ -mtime -30 -type f | head -1
```

**Status categories:**

| Status | Meaning | Action |
|--------|---------|--------|
| `ready` | Skill exists, recently updated | Proceed |
| `stale` | Skill exists, > 30 days old | Suggest refresh |
| `missing` | Skill doesn't exist | Create or skip |
| `external` | Skill from MCP/plugin | Check MCP connection |

### Step 3: Report Skill Status

Output skill check before execution:

```
┌─ Skill Pre-flight
│
│  Required: /astro, /shadcn, /react19
│
│  Status:
│    ✓ /astro      ready    (updated 2d ago)
│    ✓ /shadcn     ready    (updated 5d ago)
│    ⚠ /react19    stale    (updated 45d ago)
│
│  Action: Proceed with warning — /react19 may need refresh
│
└─ Continuing...
```

### Step 4: Handle Missing Skills

**If skill is missing but required:**

```
┌─ Skill Pre-flight
│
│  Required: /sui
│
│  Status:
│    ✗ /sui        missing
│
│  Options:
│    1. Create skill: /skill new sui (scaffold from template)
│    2. Skip task: This task requires Sui knowledge
│    3. Proceed anyway: Risk of incorrect Move syntax
│
└─ Choice? [1/2/3]
```

**Auto-create for common patterns:**

If the missing skill matches a known template in `.claude/skills/templates/`:
- Offer to scaffold it immediately
- Or fetch from skill registry if available

### Step 5: Refresh Stale Skills

**If skill is stale (> 30 days):**

```
┌─ Skill Refresh Suggested
│
│  /react19 last updated 45 days ago
│
│  Recent changes in ecosystem:
│    • React 19.1 released (check for new patterns)
│    • use() hook behavior clarified
│
│  Options:
│    1. Refresh now: Re-read React 19 docs, update skill
│    2. Proceed: Use current skill (may be outdated)
│    3. Skip: Don't use this skill for this task
│
└─ Choice? [1/2/3]
```

### Integration with Execution

The skill check gates execution:

```
/do "create a landing page"
     │
     ▼
┌─ Intent Mode ─────────────────────┐
│  Topic: landing-page              │
│  Found: plan-landing.md           │
└───────────────────────────────────┘
     │
     ▼
┌─ Skill Pre-flight ────────────────┐
│  Required: /astro, /shadcn        │
│  Status: ✓ ready, ✓ ready         │
└───────────────────────────────────┘
     │
     ▼
┌─ Execute ─────────────────────────┐
│  Running W3 of plan-landing.md    │
└───────────────────────────────────┘
```

**If skills not ready, execution pauses** until resolved. This prevents:
- TypeDB 2.x syntax in a 3.x schema (missing `/typedb`)
- React class components in a hooks codebase (stale `/react19`)
- Move 1.0 patterns in a Move 2.0 contract (missing `/sui`)

---

## Steps

### `<TODO-file>` — Wave execution

Pass a TODO filename as `$ARGUMENTS` (e.g. `/do TODO-commands.md`).
If no argument given, use the most recently modified `docs/TODO-*.md` (excluding TODO-template.md).

Read `docs/<TODO-file>`. Find the current cycle and wave by scanning the Status section
for the first unchecked `- [ ]` wave entry. Execute that wave:

**W0 — Baseline (before first wave of any new cycle)**

```bash
# 1. Verify the starting state is clean
bun run verify   # biome check . && tsc --noEmit && vitest run

# 2. Capture baseline metrics — W4 diffs against these
bun run build 2>&1 | tee /tmp/w0-build.txt
BUILD_MS=$(grep -oE '[0-9]+ms' /tmp/w0-build.txt | tail -1 | tr -d 'ms')

# Bundle sizes (Astro + Worker)
CLIENT_KB=$(du -sk dist/_astro/*.js 2>/dev/null | awk '{sum+=$1} END{print sum}')
WORKER_KB=$(du -sk .wrangler/output/*.js 2>/dev/null | awk '{sum+=$1} END{print sum}')

# Agent/skill body sizes — token proxy (lines × ~4 tokens/line)
AGENT_LINES=$(find agents -name '*.md' 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
SKILL_LINES=$(find web/src -name '*.md' 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')

# Write baseline — W4 reads this file
cat > .w0-baseline.json <<EOF
{
  "cycle": $(grep -c '## [0-9]' docs/improvements.md 2>/dev/null || echo 0),
  "buildMs": ${BUILD_MS:-0},
  "bundleKB": { "client": ${CLIENT_KB:-0}, "worker": ${WORKER_KB:-0} },
  "agentLines": ${AGENT_LINES:-0},
  "skillLines": ${SKILL_LINES:-0},
  "tests": { "passed": $(grep -oE '[0-9]+ passed' /tmp/w0-build.txt | tail -1 | grep -oE '[0-9]+' || echo 0) },
  "lighthouse": "run-at-w4"
}
EOF
```

Record: tests passed/total, any known failures. Fix before proceeding. Don't build on broken ground.
`.w0-baseline.json` is the anchor — W4 compares every metric against it.

---

**W1 — Recon (Haiku, parallel)**

1. **Seed from prior W4** — read `.w4-improvements.json` if it exists. Every open improvement
   from the last cycle becomes a mandatory recon target for this cycle. If an item has appeared
   in 3+ consecutive cycles unfixed, flag it as a systemic gap in your W1 report.

   ```bash
   cat .w4-improvements.json 2>/dev/null || echo "no prior improvements"
   ```

2. Read the TODO's Wave 1 section for the current cycle
3. Spawn ALL recon agents **in a single message** using the Agent tool with `model: "haiku"`
   — include the open improvement files as mandatory reads alongside the TODO's recon targets
4. Each agent reads one file and reports findings verbatim with line numbers
5. Each agent returns **structured JSON only**:
           ```json
           { "file": "<path>", "findings": [
               { "line": N, "type": "current-behavior|gap|pattern",
                 "excerpt": "...", "relevance_score": 0.0-1.0 }
           ]}
           ```
           `relevance_score`: 0.9+ = directly actionable · 0.5–0.9 = context · <0.5 = background.
           Be concise; fidelity over brevity when in conflict. W2 auto-skips findings with `relevance_score < 0.4`.
6. Collect all reports
7. Mark Wave 1 complete in the Status section: `- [ ]` → `- [x]`

Log: `W1: tasks_parallel=N  marked=N  warned=N  dissolved=N`
CLOSE: `/close --todo <slug> --wave 1` — emit `do:close` [`cycle:N`, `wave:1`, `todo:<slug>`]; append to learnings.md (soft gate).

---

**W2 — Decide (Opus, main context)**

1. You ARE the decider. Do not delegate this wave.
2. Read all W1 reports. Auto-skip findings with `relevance_score < 0.4` (log as `filtered:N`).
   Auto-load into context: last 20 `learnings.md` entries with overlapping tags + `dictionary.md` + `rubrics.md`.
   **Context triggers** — after reading W1 findings, scan each excerpt + file path against these default patterns (and any `context_triggers` declared in the TODO frontmatter):
   | Pattern (regex on W1 excerpts + paths) | Inject |
   |----------------------------------------|--------|
   | `signal\(` or `emit\(` or `receiver:` | `one/signals.md` |
   | `\.tql` or `@/engine` or `isa path` | `src/schema/one.tql` (first 80 lines) |
   | `subscribe\(` or `sub:` | `one/signals.md` |
   | `pheromone` or `edges\.json` or `mark\(` | `apps/generate/generate.md` §Pheromone rules |
   Pull matching docs now — before deciding. Do not pull docs whose pattern had zero W1 matches.
   **Zero-findings guard:** if all findings filtered → log `W2: all_filtered` → halt wave → ask user to broaden W1 recon targets. Do not advance with empty diff specs.
3. **Tag the TODO type** — add to the TODO header if absent:
   `type: refactor | fix | feature | doc`
   This controls the Simplicity benchmark in W4 (see `one/rubrics.md` Code Rubric §3).
4. **Focus check** — for every file in the diff spec, state its current line count.
   If the edit will make it noticeably large, ask: "is this file doing one thing?"
   If two responsibilities are visible, split in the plan now — not in W3.
   Reference: the entire substrate (schema + engine) is 200 lines total. A file
   that needs more than that is almost certainly doing more than one thing.
   This is a thinking prompt, not a line limit. Name splits here; W3 executes them.
5. For each finding, decide: **Act** (produce anchor + new text) or **Keep** (it's an exception)
6. Output diff specs:
   ```
   TARGET:    docs/foo.md
   ANCHOR:    "<exact old text>"
   ACTION:    replace
   NEW:       "<new text>"
   RATIONALE: "<one sentence>"
   ```
7. Mark Wave 2 complete

Log: `W2: decisions=N  fan_out=N`
CLOSE: `/close --todo <slug> --wave 2` — emit `do:close` [`cycle:N`, `wave:2`, `todo:<slug>`]; append to learnings.md (soft gate).

---

**W3 — Edits (Sonnet, parallel)**

1. Read the diff specs from Wave 2

           **Pre-validation (before spawning any agent — <2s):**
           ```bash
           # Single-line anchors only. For multi-line anchors use: perl -0777 -ne 'exit 0 if /\Q$anchor/; exit 1'
           # for each (target, anchor) in diff_specs:
           #   grep -qF "$anchor" "$target" || echo "MISS: $target — route back to W2"
           ```
           Any miss → return to W2 with "anchor not found" + current file excerpt at that section.
           If the same anchor misses twice, halt and ask the user — do not loop infinitely.
           Proceed only after all anchors confirmed present.

           **Dependency detection:**
           Overlapping = same file path in two or more diff specs, any line range.
           - No overlap → **W3a**: spawn all agents in one message (fully parallel).
           - Overlap → **W3a** first (one message, independent edits only), then **W3b** (second message, same-file edits sequenced).
             Each W3b agent: "Read current file state before matching anchor — W3a edits already applied."
             If W3b anchor misses after W3a: escalate to W2 for anchor refresh (W2 re-reads post-W3a file, issues corrected anchor) — do not auto-re-spawn with stale anchor.
           W3a is parallel; W3b is sequential-after-W3a. Wave not complete until both marked.

2. Spawn W3a agents in one message (all independent edits)
3. If W3b queue non-empty: spawn W3b agents in one message after W3a marked complete
4. Each agent gets: file path, anchor (exact old_string), replacement, and the rule:
   "Use Edit tool with exact anchor as old_string. Do not modify anything else.
   If anchor doesn't match, report dissolved.
   If the edit makes the file noticeably large and you can see two responsibilities,
   report dissolved with reason 'file needs splitting — W2 to name the two files'.
   The goal is focused files, not a line count."
5. Collect results — mark successful edits, warn on anchor mismatches
6. Re-spawn dissolved agents once with corrected anchors (read the file first)
7. Mark Wave 3 complete

Log: `W3: w3a=N w3b=M  marked=N  warned=N  dissolved=N  reloops=N`
CLOSE: `/close --todo <slug> --wave 3` — emit `do:close` [`cycle:N`, `wave:3`, `todo:<slug>`]; append to learnings.md (soft gate).

---

**W4 — Verify (Haiku × 5, parallel)**

0. **Cross-cycle pre-warm** (runs after gate passes, before cycle-complete report):
   If a next cycle exists in the TODO, spawn ONE Haiku agent to pre-read that cycle's W1 targets.
   Store results in session-context dict `prewarm[path]` with `{content, mtime_at_read}`.
   Next cycle's W1: check `prewarm[path]` — hit only if `file.mtime == prewarm[path].mtime_at_read` (stale if file changed outside loop). Miss or stale → live read.
   Log: `W4: prewarm_targets=N  (next W1 gets up-to-N cache hits if files unchanged)`

1. **Deterministic checks first:**
   ```bash
   bun run verify   # biome + tsc + vitest
   ```
   If any check fails on files touched in W3, route failure back to W3 (max 3 loops).

2. Spawn **5 agents in one message** — 4 rubric scorers + 1 adversarial:
           ```
           agent-security    model: haiku — scores security 0–1    (zero vulns, boundaries validated, no secrets)
           agent-stability   model: haiku — scores stability 0–1   (tests pass, zero type errors, handlers close)
           agent-simplicity  model: haiku — scores simplicity 0–1  (min code, every line earns its place)
           agent-speed       model: haiku — scores speed 0–1       (Lighthouse 100, bundle ≤ W0, tokens lean)
           agent-adversarial model: haiku — finds failure modes, contradictions, spec violations
                                    signal grammar check: if diff contains signal( or emit( calls,
                                    validate each receiver string against grammar:
                                      receiver := (actor|world|all|sub)(:[a-z:+\w]+)?
                                    invalid receiver → finding severity 0.8
                                    output: {"findings": [{"issue": "...", "severity": 0.0-1.0}]}
           ```
           Aggregate: `composite = 0.35·security + 0.30·stability + 0.25·simplicity + 0.10·speed`
3. **Main context** folds all 5 reports:
   - compute composite from 4 rubric scores
   - scan adversarial findings: if **any single finding has severity > 0.5**, gate fails
   - Gate passes only when: composite ≥ 0.65 AND zero adversarial findings with severity > 0.5
4. If clean → mark Wave 4 `[x]` → mark cycle `[x]`
5. If inconsistencies → **Wave 3.5**: spawn one Sonnet agent per dirty file (one message, same W3 rules — pre-validate anchor, Edit tool, report dissolved on miss) → re-run W4 verify on touched files only → max 3 total W4 loops before hard halt.

Log: `W4: security=<N.NN>  stability=<N.NN>  simplicity=<N.NN>  speed=<N.NN>  composite=<N.NN>  adversarial=<pass|fail>  velocity=<±N.NN>  tokens={cacheHit%,agentLinesDelta,skillLinesDelta}  verify=green|red`
CLOSE: `/close --todo <slug> --wave 4` — emit `do:close` [`cycle:N`, `wave:4`, `todo:<slug>`]; append to learnings.md (soft gate).

---

**After each wave:**
- Update TODO Status section (`[x]`)
- Report: `{ marked: N, warned: N, dissolved: N }`
- If all 4 waves complete: run cycle close — `/close --todo <slug> --cycle N` (**hard gate**: emit `do:close` [`wave:gate`], verify learnings.md grew by 1 entry, block next cycle if skipped). Then report "Cycle N complete."
CLOSE: (cycle gate) `/close --todo <slug> --cycle N` — **hard gate**; missing close → `do:close-missing` dissolved; `/do --auto` halts.

**Drift detection (automatic at every cycle close):**
Read the last 3 learnings.md close entries for this TODO. For each rubric dim (security/stability/simplicity/speed):
if dim_score < 0.65 for **3 consecutive** closes on the same wave+tag combo →
  append: `drift: {wave}:{dim} on [{tags}] for 3 cycles — avg {score}`
  emit: `loop:drift:{wave}:{dim}` { todo, tag_combo, scores[], cycles: 3 }
No drift → no entry. Drift records are queryable by --improve.
- If all cycles complete: "All cycles complete."

**Rules:**
- Never skip W2. Understanding is not delegable.
- Always spawn W1 and W3 agents in a SINGLE message — this is how you get parallelism.
- W4 max 3 loops. If still failing after 3, halt and report to user.

---

### `--improve`

**Signal source** (checks in order, first hit wins):
1. `signals.jsonl` — read `loop:drift:*` entries if file exists (real signal infrastructure)
2. `learnings.md` — read all `drift:` entries (polling fallback)

Group by wave+dim+tag_combo. For each group with count ≥ 2, run a one-cycle meta-improvement plan on do.md itself:
- W1: recon the drifting wave section (Haiku — what does the current instruction say?)
- W2: decide a targeted edit to the agent prompt for that wave
  **W2 edit scope (hard limit):** W2 may only propose edits to agent instruction text (what agents are told to do, how to format output, what to read). W2 must never propose changes to: gate thresholds (composite ≥ 0.65, severity > 0.5, relevance < 0.4 — these are numeric limits that change runtime gate behavior, not instruction prose), escape conditions (zero-findings guard, max W4 loops = 3, double-anchor-miss halt — these are numeric loop caps and guard clauses, not instruction prose), or the invariant list itself. If in doubt: if the proposed change alters a number that controls when the loop stops or passes, it is forbidden. Any proposal touching those → reject, escalate to user.
- **Snapshot:** Before W3 spawns, record current do.md content in session dict `improve_snapshot`. **W4 fail = any adversarial finding severity > 0.5 OR composite < 0.65.** On W4 fail: restore snapshot from `improve_snapshot` (prewarm cache is advisory — discard it for the retry, do a live read instead), log `improve: rollback`, then automatically retry — W2 agent re-reads the W4 failure report and produces a revised proposal (no human intervention); W3 applies it; W4 re-verifies. If W4 fails on the retry: escalate to user — do not retry again.
- W3: edit do.md (anchor pre-validated first — edits are within scope per W2 constraints above)
- W4: adversarial verify — check these invariants are preserved:
  never skip W2 · always spawn W1+W3 in a single message · gate thresholds unchanged (0.65 / 0.5 / 0.4 values must appear verbatim) · relevance threshold unchanged (< 0.4 must appear verbatim) · escape conditions unchanged · W2 scope constraint present and unmodified
  **Threshold disguise check:** scan the diff for protected threshold values (0.65, 0.5, 0.4, 3) appearing in *control-flow or gate logic* (e.g. `if`, `≥`, `>`, `<`, `gate`, `pass when`). Threshold values in *informational prose* (e.g. "verify that 0.65 is maintained", "check composite ≥ 0.65 still holds") are permitted — do not flag. Only flag when the value sits inside a conditional or gate definition that changes the runtime behavior → severity 0.8.
After W4 passes: mark drift entries `resolved` in learnings.md.
After W4 fails twice: restore improve_snapshot, escalate to user — loop cannot self-fix this pattern.

### `--auto`

Same as `<TODO-file>` but runs W1→W2→W3→W4 continuously until all cycles are marked `[x]`.

**Trust-aware continuation:**
After each cycle close, read trust level from learnings.md:
- `trusted`: skip show-pause; log `[trust:trusted] continuing...`; start next cycle immediately
- `standard`: render show-frame (cycle N complete); auto-continue after render
- `cautious`: render show-frame + `[trust:cautious] halting — run /do next to continue`; stop

Stop if: W4 loops > 3 (escalate to user), trust=cautious (wait for /do next), or all cycles marked [x].

### `--wave N`

Force a specific wave (1–4) regardless of the Status section.
Useful for re-running a failed wave or skipping ahead.

---

### *(empty)* — Autonomous loop

```
W0: bun run verify (once per session, skip if already passed)

ORIENT: Read docs/TODO.md
        → note the active front (Atomicity / Vocabulary / New Surfaces)
        → note the Top 15 priority list
        → let this shape which task you pick

loop:
  SENSE:    GET http://localhost:4321/api/tasks
            Sort by priority (effective = score + strength − resistance)
            Skip blocked tasks (blockedBy non-empty)

  SELECT:   Pick highest unblocked (P0 > P1, attractive > ready > exploratory)
            If all blocked: GET /api/state → follow pheromone highways (deadlock escape)

  EXECUTE:
    BRIEF (before touching any file):
      source = task.source                  // "do-gen5", "ontology", etc.
      If source missing: grep -l "{task.name}" docs/TODO-*.md
      Read docs/TODO-{source}.md:
        • frontmatter source_of_truth → spec docs to pre-load
        • find checkbox matching task.name → note exit criteria + "See also"
        Read each source_of_truth entry (first 80 lines each)
    WORK: run W1-W4 against the briefing above
      W1 targets files named in task description + source_of_truth
      W4 exit gate: composite ≥ 0.65 AND exit criteria from TODO section

  VERIFY:   bun tsc --noEmit on touched files

  MARK:     POST http://localhost:4321/api/tasks/{id}/complete

  CLOSE:    POST http://localhost:4321/api/loop/cycle-close {
              slug,                       // e.g. "do-gen5", "rubric-impl" (the plan slug)
              kind: "code",               // default for /do; use "msg" only for agent-response cycles
              scores: { security, stability, simplicity, speed }   // each 0–1
            }
            Endpoint fires both the cycle-level mark AND the per-dim marks in one call:
              composite = 0.35·security + 0.30·stability + 0.25·simplicity + 0.10·speed
              composite ≥ 0.65 → mark(loop:cycle:{slug},      composite × 5)
                                  mark(loop:code:cycle:{slug}, composite × 5)
                                  markCodeDims on edge "loop:code:cycle:{slug}" (4 per-dim marks)
              composite < 0.65 → warn equivalents (route back to W3, max 3 W4 loops)
            Response: { ok, slug, kind, composite, gate: "pass"|"fail", marks: { cycle, namespaced } }

            Note: /api/loop/close (without "cycle-") is a different endpoint —
            it manages WorkLoop session/stage tracking (26 stages per session),
            not /do cycle close. Don't confuse them.

  FEEDBACK: POST http://localhost:4321/api/signal {
              receiver: 'loop:feedback',
              data: {
                tags: task.tags,         // what kind of work this was
                strength: rubricAvg,     // how well it went (avg of 4 dims)
                content: { task_id, rubric, outcome: 'result' }
              }
            }
            // The return-path signal — lays pheromone on the trail home.
            // Future select() with matching tags follows this trail.
            // strength >= 0.65 → mark each tag path
            // strength < 0.65 → warn(0.5) each tag path (try specialist)
            // Always emit — even timeout, even dissolved. Every loop closes.

  GROW:     GET http://localhost:4321/api/highways → report learned paths

  → repeat
```

After each task: report name, strength, priority, tests passed, unlocked tasks.

### `--once`

Single iteration of the autonomous loop above.
Pick one task → execute → mark → stop.
Report: name, strength, priority, tests, deterministic outcome (result/timeout/dissolved/failure).

---

*`/do` is `select()` made human-readable. The path remembers every execution.*
