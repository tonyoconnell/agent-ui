# Strategy as Executable Code

**ONE-strategy.md becomes a living TODO. TypeDB + loop.md = org that builds itself.**

---

## Part 1: The Org Blueprint (From ONE-Strategy)

### Adoption Roadmap → Task Hierarchy

We build with AI. We don't plan in weeks — we plan in **cycles**. Each cycle
completes when its exit conditions are met, not when a calendar date arrives.
The substrate's tick counter IS the cycle. ONE-strategy.md defines the sequence:

```
CYCLE   PHASE GROUP           EXIT CONDITIONS                          REVENUE UNLOCK
──────────────────────────────────────────────────────────────────────────────────────
C1      cycle:foundation      8 agents live, 100 signals/day,          First signals
                              dashboard shows paths
                              → agent deployment
                              → telegram wiring

C2      cycle:collab          cross-dept signals flowing,              Inter-org routing
                              2-3 highways formed
                              → cross-dept signals
                              → highway detection

C3      cycle:commerce        x402 working, 1+ paying external agent   x402 on Sui active
                              → revenue routing
                              → payment settlement

C4      cycle:expansion       10+ external users, AgentVerse live      Network effects
                              → agentverse-integration
                              → cross-platform discovery

C5      cycle:analytics       highways hardened, confidence         Data moat starts
                              metrics per path, bottleneck detection
                              → confidence metrics
                              → bottleneck analysis

C6      cycle:products        sensitivity modes live                    Differentiated products
                              → explorer mode
                              → harvester mode
                              → enterprise mode

C7      cycle:scale           10,000+ agents, self-forming coalitions  Equity equivalent
                              → highway hardening
                              → token minting
```

### Mapping to 7 Personas + All 6 Metaphor Skins

Each persona sees the same system differently. Task assignment routes to the persona best equipped:

```
PERSONA        METAPHOR SKIN    LANGUAGE              WHAT THEY BUILD           TASK WEIGHT
─────────────────────────────────────────────────────────────────────────────────────────
CEO            Team             agent:commend         Orgs, hiring, strategy    3.0x (governance)
Developer      Brain/Signal     node:potentiate       API, routing, code        2.5x (infrastructure)
Investor       Water/Economic   pool:carve            Revenue paths, tokens     2.0x (monetization)
Gamer          Ant              ant:deposit           Emergence, trails         2.0x (exploration)
Kid            Ant              ant:forage            Simple rules, discovery   1.5x (learning)
Freelancer     Mail             mailbox:stamp         Skills, services, pricing 1.5x (contribution)
Agent Primitive Signal/Node      signal:emit          Handlers, signals, chains 1.0x (execution)
```

**Vocabulary Mapping for Task Assignment:**

| Task | CEO Sees | Dev Sees | Investor | Gamer | Kid | Freelancer | Agent |
|------|----------|----------|----------|-------|-----|------------|-------|
| **marketing-dept-live** | "Hire & organize" | "Deploy 8 units" | "Market position" | "Establish colony" | "Make ant friends" | "8 jobs to bid on" | "marketing-dept:on" |
| **engineering-dept-live** | "Build capability" | "Wire the pipes" | "Cost of ownership" | "Emerge workflow" | "Build trails" | "Tech jobs available" | "engineering-dept:on" |
| **sales-dept-live** | "Revenue path" | "API for payment" | "Revenue model" | "Harvest food" | "Ants share food" | "Freelance marketplace" | "sales:process" |
| **agentverse-integration** | "Open the gates" | "HTTP/MCP bridge" | "Market access" | "New territory" | "New ant colony" | "Bigger audience" | "agentverse:register" |

---

## Part 2: Task Graph with Initial Weights

Each task has an initial `priority` (0-100) based on:
- **value** (critical > high > medium)
- **phase** (earlier = higher)
- **blocking** (tasks that unblock many others)
- **persona_weight** (1.0 - 3.0 based on who executes)

```typeql
define

# Task entity (complete definition)
entity task,
  owns task-id @key,
  owns name,
  owns description,
  owns phase,               # "cycle:C1", "cycle:C2", etc
  owns value,               # "critical" | "high" | "medium"
  owns weapon,              # "speed" | "language" | "dictionary"
  owns persona,             # "ceo" | "dev" | "investor" | "gamer" | "kid" | "freelancer" | "agent"
  owns priority,            # 0-100 (computed)
  owns priority-formula,    # How priority was calculated (for transparency)
  owns tag @card(0..),      # marketing, P0, engineering, telegra, etc
  owns status @card(1),     # "pending" | "in-progress" | "blocked" | "complete" | "failed"
  owns due-date,
  owns completed-at,
  owns created,
  plays task-dependency:source,
  plays task-dependency:target,
  plays task-execution:task,
  plays task-realization:realizes;

# Task → task: dependency graph
relation task-dependency,
  relates source,           # task that must complete first
  relates target,           # task that's waiting
  owns kind @card(1);       # "blocks" | "enables" | "unlocks" | "speeds-up"

# Unit executes task
relation task-execution,
  relates executor,         # unit (agent, human, group)
  relates task,
  owns started-at,
  owns completed-at,
  owns pheromone-deposited; # weight of success

# Task creates/unlocks skill
relation task-realization,
  relates realizes,         # task
  relates unlocks,          # skill (becomes available when complete)
  owns unlocks-at;

# Task status event (for audit trail)
relation task-event,
  relates executor,         # unit
  relates task,
  owns event-type,          # "started" | "progressed" | "blocked" | "complete" | "failed"
  owns notes,
  owns timestamp;

# Functions for intelligent selection

fun task_priority($t: task) -> integer:
  match
    $t has priority $p;
  return first $p;

fun tasks_by_priority() -> { task }:
  match
    $t isa task, has status "pending", has priority $p;
    $p >= 50;  # Only ready tasks
  return { $t };

fun critical_path() -> { task }:
  match
    $t isa task, has phase "cycle:C1";  # C1 always on critical path
  return { $t };

fun blocking_tasks() -> { task }:
  match
    (source: $t, target: $blocked) isa task-dependency;
    $blocked has status "pending";
  return { $t };

fun unblocked_ready() -> { task }:
  match
    $t isa task, has status "pending";
    not {
      (source: $dep, target: $t) isa task-dependency, has kind "blocks";
      $dep has status "pending";
    };
  return { $t };

fun task_blocking_count($t: task) -> integer:
  match (source: $t, target: $blocked) isa task-dependency;
  return count($blocked);
```

### Initial Task Setup (Cycle C1: Foundation)

```typeql
# C1 Phase Group
insert $g isa group,
  has gid "cycle:C1",
  has name "C1: Foundation",
  has purpose "Marketing alive. First signals. First learning.",
  has group-type "cycle",
  has status "active";

# Task 1: Marketing Department Live (CRITICAL, CEO + DEV, P0)
# Exit: 8 agents responding to signals on Telegram
insert $t1 isa task,
  has task-id "marketing-dept-live",
  has name "Marketing Department Live (8 agents, Telegram)",
  has description "Deploy: director, creative, media-buyer, analyst, content-writer, seo, social, ads-mgr. Enable Telegram channel. First signals flowing.",
  has phase "cycle:C1",
  has value "critical",
  has weapon "language",
  has persona "ceo",
  has priority 95,
  has priority-formula "critical=30 + C1=40 + ceo_weight=3x=25",
  has tag "marketing", has tag "P0", has tag "agents", has tag "telegram",
  has status "pending",
  has created 2026-04-07T00:00:00;

# Task 2: Engineering Department Framework (CRITICAL, DEV, P0)
# Exit: cross-dept signal routing measurable
insert $t2 isa task,
  has task-id "engineering-dept-framework",
  has name "Engineering Department Framework (dev, test, review, deploy)",
  has description "Build 4 engineering agents with interconnected handlers. Enable cross-dept signal routing. Measure first inter-team paths.",
  has phase "cycle:C1",
  has value "critical",
  has weapon "speed",
  has persona "dev",
  has priority 90,
  has priority-formula "critical=30 + C1=40 + dev_weight=2.5x=20",
  has tag "engineering", has tag "P0", has tag "infrastructure",
  has status "pending",
  has created 2026-04-07T00:00:00;

# Task 3: Telegram Integration (HIGH, DEV+CEO, P0)
# Exit: signals visible in @antsatworkbot channel
insert $t3 isa task,
  has task-id "telegram-integration",
  has name "Telegram Integration for Agent Signals",
  has description "Wire signals → Telegram API. Subscribe marketing agents to @antsatworkbot channel. Real-time pheromone visibility.",
  has phase "cycle:C1",
  has value "high",
  has weapon "speed",
  has persona "dev",
  has priority 85,
  has priority-formula "high=25 + C1=40 + enables_marketing=20",
  has tag "telegram", has tag "P0", has tag "wire",
  has status "pending",
  has created 2026-04-07T00:00:00;

# Task 4: Pheromone Dashboard (MEDIUM, DEV+CEO, P1)
# Exit: real-time graph showing 8 agents + edge weights
insert $t4 isa task,
  has task-id "pheromone-dashboard-C1",
  has name "Pheromone Visibility: Basic Dashboard",
  has description "Real-time graph: 8 marketing agents, paths between them, strength/resistance on edges. Show which paths are strongest.",
  has phase "cycle:C1",
  has value "medium",
  has weapon "language",
  has persona "ceo",
  has priority 70,
  has priority-formula "medium=20 + C1=40 + enables_strategy=10",
  has tag "dashboard", has tag "P1", has tag "analytics",
  has status "pending",
  has created 2026-04-07T00:00:00;

# DEPENDENCIES (Task Graph)
insert (source: $t1, target: $t3) isa task-dependency,
  has kind "blocks";  # Telegram task can't finish until marketing agents exist

insert (source: $t1, target: $t4) isa task-dependency,
  has kind "enables";  # Dashboard makes sense after marketing agents are live

insert (source: $t2, target: $t4) isa task-dependency,
  has kind "speeds-up";  # Engineering agents on dashboard makes routing visible
```

---

## Part 3: Agent Specializations & Valuations

### Who Does What Best? (Agent → Task Affinity)

```typeql
# Agent specialization mapping (learned from pheromone, then locked for SOP)

fun agent_best_for($task_type: string) -> { unit }:
  match
    $e (source: $from, target: $u) isa path,
      has task-type $task_type,
      has strength $s,
      has resistance $r;
    let $net = $s - $r;
    $net >= 10;  # Proven on this task type
  return { $u };

fun agent_valuation($u: unit) -> decimal:
  # Price = (success_rate × task_frequency × revenue_per_task) + reputation_bonus
  match
    $u isa unit, has success-rate $sr, has activity-score $as;
    let $base_price = $sr * $as * 0.01;  # $0.01 per successful task
    let $bonus = ($as / 100) * 0.1;       # 10% reputation bonus on score
  return first $base_price + $bonus;

fun agent_capability_price($u: unit, $sk: skill) -> decimal:
  # Per-skill pricing
  match
    (provider: $u, offered: $sk) isa capability, has price $p;
  return first $p;
```

### Valuation for Agents (8 Marketing as Example)

```
AGENT                    SPECIALTY        INITIAL PRICE   SUCCESS TARGET   FORMULA
────────────────────────────────────────────────────────────────────────────────────
director                 routing          $0.05/signal    95% (proven)     routes to best
creative                 content gen      $0.03/task      90% (LLM)        writes copy
media-buyer              placement        $0.02/campaign  85% (new)        buys ads
analyst                  data processing  $0.02/analysis  85% (new)        queries reports
content-writer           blog/posts       $0.02/piece     85% (new)        writes content
seo-specialist           optimization     $0.03/audit     80% (niche)      analyzes SEO
social-media             posting          $0.01/post      80% (scalable)   posts to channels
ads-manager              ppc/bids         $0.02/campaign  85% (new)        manages budget

FORMULA for agent price:
  base = success_rate × activity_score × $0.01
  reputation_bonus = (activity_score / 100) × $0.10
  total = base + bonus

Example: Director with 95% success, activity=100
  = (0.95 × 100 × 0.01) + (100/100 × 0.10)
  = $0.95 + $0.10
  = $1.05 per signal routed (HIGHLY PROFITABLE)
```

---

## Part 4: The Revenue Loop (x402 on Sui)

### How We Make Money Fast

```
┌───────────────────────────────────────────────────────────────┐
│                      x402 REVENUE LOOP                         │
│                   (Fast cash from AI agents)                   │
└───────────────────────────────────────────────────────────────┘

USER (AI AGENT) SIGNALS INTO ONE
        │
        ▼
    ┌─────────────────────────┐
    │ 1. ROUTE to best agent  │ (pheromone-weighted selection)
    │    cost: $0.01-0.05     │ (depends on agent reputation)
    └─────────────────────────┘
        │
        ▼
    ┌─────────────────────────┐
    │ 2. AGENT EXECUTES       │ (handler runs)
    │    - success: mark()    │
    │    - failure: warn()    │
    └─────────────────────────┘
        │
        ▼
    ┌─────────────────────────┐
    │ 3. PAYMENT SETTLES      │ (on Sui, <500ms)
    │    - Agent gets 70%     │
    │    - ONE keeps 30%      │
    │    - Path gets marked   │ (pheromone += revenue)
    └─────────────────────────┘
        │
        ▼
    ┌─────────────────────────┐
    │ 4. PHEROMONE COMPOUNDS  │
    │    weight += log1p(rev) │ (revenue boosts routing)
    │    → agent routed more  │
    │    → earns more         │
    │    → stronger path      │
    └─────────────────────────┘
```

### Revenue Forecast (Conservative)

```
CYCLE    AGENTS  AVG SIGNAL/DAY  PRICE    REVENUE/DAY    MARGIN (30%)
─────────────────────────────────────────────────────────────────────
C1       8       100             $0.02    $16            $4.80
C2       12      500             $0.025   $150           $45
C3       15      2000            $0.03    $1,800         $540
C4       30      10000           $0.03    $9,000         $2,700
C5       100     50000           $0.03    $45,000        $13,500
C6       1000    100000          $0.03    $90,000        $27,000
C7       10000   500000          $0.035   $1,750,000     $525,000
```

**Critical insight:** By C4, we're $2,700/day. By C5, we're cash-flow positive at scale. Cycles complete when exit conditions are met — not by calendar.

---

## Part 5: The Autonomous Loop (How We Execute ONE-Strategy)

### Loop Implementation in loop.md

The `/api/tick` endpoint runs the autonomous loop. We modify it to:

1. **Sense** — Query TypeDB for pending tasks (priority >= 50)
2. **Select** — Pick highest-priority unblocked task
3. **Execute** — Route to best agent (by affinity + reputation)
4. **Verify** — Check result (mark or warn)
5. **Mark** — Deposit pheromone on path
6. **Grow** — Update task status, trigger evolution if needed
7. **Continue** — Loop (every 10 minutes for tasks, every 5 minutes for signals)

```typescript
// Modified /api/tick to handle task orchestration

export const GET: APIRoute = async ({ url }) => {
  const w = persistentWorld()
  
  // ─ SENSE: Query pending tasks by priority
  const readyTasks = await readParsed(`
    match
      $t isa task, has status "pending", has priority $p;
      not {
        (source: $dep, target: $t) isa task-dependency, has kind "blocks";
        $dep has status "pending";
      };
    select $t, $p;
    sort $p desc;
    limit 1;
  `)
  
  if (!readyTasks.length) {
    // No tasks available → run signal loop instead
    const sig = await w.select('signal')
    if (sig) {
      const result = await w.ask({ receiver: sig })
      await mark_or_warn(result)
    }
    return tick_result
  }
  
  // ─ SELECT: Get highest-priority task
  const taskToExecute = readyTasks[0]
  const taskId = taskToExecute.task_id
  
  // Find best agent for this task (by affinity + reputation)
  const agent = await readParsed(`
    match
      $u isa unit;
      $e (source: $from, target: $u) isa path,
        has task-type "${taskToExecute.task_type}",
        has strength $s;
    select $u, $s;
    sort $s desc;
    limit 1;
  `)
  
  // ─ EXECUTE: Send signal to agent
  const executeResult = await w.ask({
    receiver: agent[0].uid,
    data: { task: taskId, ...taskToExecute }
  })
  
  // ─ VERIFY + MARK: Update task status
  if (executeResult.result) {
    // Success
    await write(`
      match $t isa task, has task-id "${taskId}";
      update $t has status "in-progress";
    `)
    await mark('task-path', chainBonus(taskToExecute.priority))
  } else if (executeResult.dissolved) {
    // Blocked or missing capability
    await write(`
      match $t isa task, has task-id "${taskId}";
      update $t has status "blocked";
    `)
    await warn('task-path', 0.5)
  } else if (executeResult.timeout) {
    // Still working, update progress
    await write(`
      match $t isa task, has task-id "${taskId}";
      insert $e isa task-event,
        has event-type "progressed",
        has notes "still executing";
    `)
  }
  
  // ─ GROW: Check for evolution or cascade
  await tick(w)  // Run full growth loop
  
  return {
    ticked: true,
    task_executed: taskId,
    agent: agent[0].uid,
    result: executeResult.result ? 'success' : 'in-progress'
  }
}
```

---

## Part 6: Progressive Context Enhancement

### Docs Guide the Execution

As tasks execute, we reference docs to guide agents:

```
TASK                           GUIDANCE DOCS               WHAT AGENTS LEARN
────────────────────────────────────────────────────────────────────────────
marketing-dept-live            one-ontology.md             What's a unit? A task?
                               metaphors.md               How do agents see signals?
                               dictionary.md              What's mark/warn?

engineering-dept-framework     DSL.md                     Signal routing syntax
                               loop.md                    The 7 loops
                               agent-md.md                Markdown agent format

telegram-integration           integration.md             API contracts
                               x402.md                    Payment settlement

agentverse-integration         agent-launch-toolkit       Cross-platform wiring
                               hermes-agent.md            MCP protocol

pheromone-dashboard            strategy.md                Why routing matters
                               routing.md                 Formula explanation
```

**Implementation:**

```typescript
// Task handler enriches context with docs

async function execute_task_with_context(task, agent) {
  // Load relevant docs based on task tags
  const docMap = {
    'agents': ['dictionary.md', 'one-ontology.md'],
    'infrastructure': ['DSL.md', 'loop.md'],
    'wire': ['integration.md'],
    'analytics': ['routing.md', 'strategy.md'],
    'telegram': ['integration.md'],
  }
  
  const docRefs = task.tags
    .flatMap(tag => docMap[tag] || [])
  
  const context = docRefs
    .map(doc => read(`docs/${doc}`))
    .join('\n---\n')
  
  // Send to agent with context enrichment
  return await agent.execute({
    task,
    context,  // Docs that guide the work
    examples: task.reference_implementations
  })
}
```

---

## Part 7: Success Metrics (How We Know We're Winning)

### Cycle Dashboard

```
METRIC                      C1          C2          C3          C4
────────────────────────────────────────────────────────────────────────
Agents Live                 8           12          15          30
Signals/Day                 100         500         2,000       10,000
Revenue/Day                 $4.80       $45         $540        $2,700
Tasks Complete              2/4         5/8         12/15       40/50
Highways Formed             0           1-2         3-5         15+
Avg Success Rate            80%         82%         85%         88%
New Agent Adoption          0           2           3           15
Code Lines Deployed         0           ~500        ~2000       ~10000
```

### Scale Metrics (C5+)

```
METRIC                      TARGET      SUCCESS CONDITION
──────────────────────────────────────────────────────────
Cash Flow Positive          C4          $2,700/day → sustainable
Retention (30-cycle)        >90%        <1 agent churn per 100
Agent Earnings              >$100/cycle (ensures freelancer quality)
Highways (hardened)     100+        Proven paths → SOP templates
Self-Forming Teams          10+         Humans + agents working together
External Integrations       5+          AgentVerse, Hermes, OpenClaw...
```

---

## Part 8: The Bootstrap Sequence (Cycle by Cycle)

### C1: Foundation

**Phase A:**
- Seed marketing team (8 agents)
- Deploy to dev environment
- Create 4 foundational tasks (marketing-dept-live, telegram-integration, engineering-framework, dashboard)
- Run first 100 signals manually to establish base pheromone

**Phase B:**
- Integrate Telegram (signals visible to team)
- Deploy pheromone dashboard
- Mark paths based on manual execution
- Measure: 80%+ success rate on marketing signals

**Exit Conditions:** 8 agents live, 100 signals/day, dashboard shows paths

### C2: Collaboration

**Tasks:**
- Deploy engineering team (4 agents: dev, test, review, deploy)
- Wire cross-department signals
- Detect first inter-team highways

**Revenue:** $0 (internal only, no external agents yet)
**Signals/Day:** 500
**Exit Conditions:** 2-3 highways formed (marketing→sales, engineering→review)

### C3: Commerce

**Tasks:**
- Deploy sales team (3 agents: outreach, close, onboard)
- Wire x402 payment on Sui
- Accept first external AI agent as customer

**Revenue:** $540/day (first paying external agent)
**Signals/Day:** 2,000
**Exit Conditions:** x402 working, 1+ paying external agents

### C4: Expansion

**Tasks:**
- Enable 10+ external users to create agents via markdown
- AgentVerse integration (discover agents)
- Cross-platform signal routing

**Revenue:** $2,700/day
**Agents:** 30+
**Exit Conditions:** Cash flow positive, adoption accelerating

### C5: Analytics

**Tasks:**
- Highway hardening (permanent knowledge)
- Confidence metrics per path
- Bottleneck detection (which tasks block most work)

**Revenue:** $13,500/day
**Agents:** 100+
**Exit Conditions:** Data moat forming (knowing what works matters more than being first)

---

## Part 9: OneSlide Execution Plan

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  AUTONOMOUS ORG: ONE-Strategy as Code                   │
│                                                          │
│  THE SYSTEM:                                            │
│  • 6-dimension ontology (groups, actors, things,        │
│    paths, events, knowledge)                            │
│  • 7 personas (CEO, dev, investor, gamer, kid,          │
│    freelancer, agent) speaking same formula              │
│  • 7-loop heartbeat (signals → evolution → knowledge)   │
│  • Pheromone routing (stronger paths get more traffic)  │
│                                                          │
│  THE CYCLES (exit-condition driven, not calendar):      │
│  C1:  Marketing (8 agents, Telegram, first routes)      │
│  C2:  Engineering (cross-team signals, highways)        │
│  C3:  Sales (revenue on Sui, x402)                      │
│  C4:  External agents (markdown, AgentVerse)            │
│  C5:  Analytics (highways harden, metrics)         │
│  C6:  Sensitivity products (explorer/harvester)         │
│  C7:  10,000+ agents, self-forming teams, tokens        │
│                                                          │
│  THE MACHINE:                                           │
│  • /api/tick selects highest-priority unblocked task    │
│  • Routes to best agent (by pheromone + affinity)       │
│  • Marks on success (pheromone += revenue)              │
│  • Warns on failure (resistance += 1)                   │
│  • Evolution rewrites struggling agents                 │
│  • Knowledge hardens highways                      │
│                                                          │
│  THE MONEY:                                             │
│  C1:  $4.80/day    (internal learning)                  │
│  C3:  $540/day     (first external agent)               │
│  C4:  $2,700/day   (10+ external agents)                │
│  C5:  $13,500/day  (100 agents, highways proven)        │
│  C7:  $525,000/mo  (10,000 agents)                      │
│                                                          │
│  THE MOAT:                                              │
│  • Pheromone graph = proprietary routing intelligence    │
│  • Hardend highways = permanent best-practices    │
│  • A2A consultation = emergent knowledge network        │
│  • Forking code gets you nothing; the graph is the IP  │
│                                                          │
│  one.ie — Where agents earn. Faster. Better. Free.      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

- [ ] **Schema:** Add `task`, `task-dependency`, `task-execution` entities to `world.tql`
- [ ] **Functions:** Write 6 task selection functions (priority, critical-path, bottleneck, etc.)
- [ ] **Seed:** Insert Phase 1 tasks (marketing, engineering, telegram, dashboard)
- [ ] **Loop:** Modify `/api/tick` to orchestrate tasks
- [ ] **Revenue:** Wire x402 payment routing on Sui (C3)
- [ ] **Docs:** Cross-link dictionary.md + one-ontology.md to task execution
- [ ] **Dashboard:** Show task graph + pheromone in real-time
- [ ] **Agents:** Create 8 marketing agents (markdown or HTTP)
- [ ] **Telegram:** Wire signals to @antsatworkbot channel
- [ ] **Monitoring:** Weekly success metrics dashboard

---

*ONE substrate runs the strategy. The formula is the truth. Usage is discovery. Payment is pheromone. The routing is the product.*
