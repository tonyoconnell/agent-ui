# Receivers

The router knows one thing: `{ receiver: string }`.

It doesn't know if the receiver is an AI, a function, a human, an API, or another world.
It doesn't care. It routes by weight. Strength and resistance accumulate the same way
for all of them. The formula is universal.

---

## The Universal Interface

```typescript
type Signal = { receiver: string; data?: unknown; after?: number }
//                                                 └─ optional: Unix ms, skip until this time
```

That's the entire contract. What lives behind the receiver string is implementation detail.
The routing layer never sees it.

```
signal({ receiver: 'scout' })         // agent
signal({ receiver: 'validator:check' }) // function
signal({ receiver: 'github:pr' })     // API
signal({ receiver: 'anthony' })       // human
signal({ receiver: 'world-b:scout' }) // federated world
```

Same call. Same pheromone. Same outcome types. Same learning.

---

## The Six Receiver Types

```
TYPE         LATENCY      COST         LEARNS?   EVOLVES?
─────────────────────────────────────────────────────────
Function     < 0.01ms     $0.000       Yes       No
Highway      0.11ms       $0.000       Yes       No
API          50–500ms     ~$0.0001     Yes       No
Agent (LLM)  800–2000ms   ~$0.001      Yes       Yes ←
Human        5min–8h      $0–$100      Yes       Yes ←
World        varies       shared rev   Yes       No
```

Two types evolve. The LLM rewrites its own prompt. The human improves their response
rate because slow responses get lower weight — they feel the pressure.

---

## Type 1: Function

A unit with a deterministic handler. No LLM. No network.

```typescript
const net = world()
net.add('validator')
  .on('check', (data) => {
    const { text } = data as { text: string }
    return { ok: text.length < 280, reason: text.length >= 280 ? 'too long' : null }
  })

// Receives signal, returns result, pheromone accumulates
net.signal({ receiver: 'validator:check', data: { text: '...' } }, 'scout')
```

**Speed:** < 0.01ms  
**Cost:** $0.000  
**Use for:** validation, transformation, formatting, math, decision gates  

Functions form highways fastest. 20 successes at < 0.01ms each = highway in milliseconds.
Once proven, routing to a function costs nothing and takes nothing.

**Examples in the substrate:**
- `isToxic()` — gate before any LLM call
- `drain()` — queue consumer
- `fade()` — path decay
- Any `.on()` handler without a network call

---

## Type 2: Highway

Not a unit type — what a path *becomes* after learning. The router itself is the receiver.

```typescript
// After 50 successful signals: net strength >= 20
if (net.isHighway('entry→analyst', 20)) {
  // LLM never called. Path is the answer.
  result.skipped = true
  net.mark(edge, chainDepth)
}
```

**Speed:** 0.11ms (highways() lookup)  
**Cost:** $0.000  
**Formed by:** ~50 successful signals on any receiver type  

A highway to a function: routes in < 0.01ms + 0.11ms = 0.12ms, forever.  
A highway to an agent: routes in 0.11ms, LLM call never made, forever.  
A highway to a human: routes directly to their inbox, no selection overhead.  

**The highway is the substrate learning to route without thinking.**

---

## Type 3: API

External HTTP endpoints wrapped as units via `apiUnit()`. The substrate doesn't know they're remote.

```typescript
import { github, slack, mailchimp, pagerduty, notion, discord, stripe } from '@/engine/apis'

net.units['github']    = github(GITHUB_TOKEN)
net.units['slack']     = slack(SLACK_TOKEN)
net.units['mailchimp'] = mailchimp(MC_TOKEN, 'us1')

// Each unit has: get | post | put | del tasks
net.signal({ receiver: 'github:post',
  data: { path: '/repos/owner/repo/pulls', body: { title: 'Auto PR', head: 'feat', base: 'main' } }
}, 'loop')

// Or build your own:
import { apiUnit } from '@/engine/api'
net.units['xero'] = apiUnit('xero', { base: 'https://api.xero.com', auth: `Bearer ${XERO_TOKEN}` })
```

`null` return → `warn()` fires automatically. Failures, timeouts, and rate limits all accumulate resistance without any circuit breaker config.

**Speed:** 50–500ms (network)  
**Cost:** API rate  
**Use for:** GitHub, Slack, Notion, Linear, PagerDuty, Mailchimp, Stripe, any REST API  

**The substrate monitors API health for you.** A flaky API accumulates resistance.
A reliable one accumulates strength. The router shifts traffic automatically.

**Latency penalty in STAN:**
```
latPenalty = 1 / (1 + latency_ms / 1000)
// API at 500ms: 1/(1+0.5) = 0.67× weight
// API at 50ms:  1/(1+0.05) = 0.95× weight
// Faster APIs get more traffic. No config.
```

**Scheduled signals:**
```typescript
net.enqueue({
  receiver: 'slack:post',
  data: { channel: '#standup', text: summary },
  after: new Date('2026-04-11T09:00:00Z').getTime()  // fires at 9am
})
```

---

## Type 4: Agent (LLM)

The only probabilistic receiver. The only type that generates new content.
The only type that evolves.

```typescript
import { llm, openrouter } from '@/engine/llm'

const complete = openrouter(apiKey, 'google/gemma-4-26b-a4b-it')
net.units['analyst'] = llm('analyst', complete)

// The unit receives signal → formats prompt → calls OpenRouter → emits result
// Substrate wraps: isToxic? → capability? → LLM → mark/warn
```

**Speed:** 800–2000ms  
**Cost:** ~$0.001–$0.003 per call  
**Evolution:** success-rate < 50% over 20+ samples → prompt rewritten by L5 loop  

```
Models available via OpenRouter:
  google/gemma-4-26b-a4b-it        ~$0.10/M    fast, good for routing
  meta-llama/llama-4-maverick      ~$0.15/M    1M ctx, ONE default
  claude-sonnet-4-20250514         ~$3/M       complex reasoning
  deepseek/deepseek-r1             ~$0.55/M    strong code/math
  openai/gpt-4o                    ~$5/M       multimodal
```

**Multi-model routing via STAN:**
```
weight = (1 + net_pheromone × sensitivity) × latencyPenalty × revBoost
```

The router automatically shifts toward cheaper, faster models that succeed.
You register all your models as units. STAN learns which earns. No config.

---

## Type 5: Human

A person in the loop. Routed to exactly like an agent. Same formula. Same pheromone.

```typescript
import { human } from '@/engine/human'

// Human unit: routes signals to Telegram, waits for reply via durable ask
net.units['anthony'] = human('anthony', {
  env,                      // { DB: D1Database }
  telegram: 123456789,      // Telegram user/chat ID
  botToken: TELEGRAM_TOKEN,
  timeout: 3_600_000        // 1h — default is 24h
})

// Three built-in tasks:
net.ask({ receiver: 'anthony:approve', data: { draft: content } }, 'writer')
// → Telegram: "Please approve: [content] Reply: yes / no / [feedback]"
// → Waits in D1 (survives worker restarts)
// → { result: { approved: true, feedback: '...' } }  → mark()
// → { timeout: true }                                 → neutral
```

`durableAsk()` persists the pending reply in D1. CF Worker isolates can restart freely. The ask survives until the human responds or it expires. `POST /api/ask/reply` resolves it from any channel (Telegram webhook, approval UI, external system).

**Speed:** 5 minutes to 24 hours  
**Cost:** human attention  
**Evolves:** slow humans get lower pheromone weight. Fast, accurate humans become highways.  

**The substrate measures humans the same way it measures agents.** A human who
approves 95% of drafts in under 10 minutes builds a strong pheromone trail.
A human who ignores requests accumulates resistance. Eventually dissolved.

No other system rates human reviewers the same way it rates AI agents
and routes between them using the same formula.

---

## Type 6: World (Federated)

Another World substrate. Another colony. Routed to exactly like a local unit.

```typescript
import { federate } from '@/engine/federation'

// Mount another ONE substrate as a unit
net.units['world-legal']   = federate('world-legal',   'https://legal.one.ie',   LEGAL_KEY)
net.units['world-finance'] = federate('world-finance', 'https://finance.one.ie', FINANCE_KEY)

// Signal crosses world boundary transparently
net.signal({ receiver: 'world-legal:review', data: { contract } }, 'drafter')
// → POSTs to https://legal.one.ie/api/signal → routes internally → returns result
// → Pheromone in THIS world tracks cross-world reliability
```

**Speed:** network latency to the other world  
**Cost:** cross-world signal fee (set by world-b)  
**Revenue model:** federation creates a marketplace of worlds  

AgentVerse (2M Fetch.ai agents) bridges into the main world:
```typescript
import { bridgeAgentverse } from '@/engine/agentverse-bridge'

const av = await bridgeAgentverse(net, fetchFn, AV_API_KEY)
// Creates proxy units 'av:address' for every discovered AV agent
// 'av:discover' unit finds agents by domain

net.signal({ receiver: 'av:discover', data: { domain: 'translate', task: { text: 'Hello', to: 'fr' } } }, 'writer')
// Main world pheromone learns which AV agents are reliable
```

---

## The Spectrum

Every routing decision picks a point on this spectrum:

```
< 0.01ms   Function    Deterministic. Always right or always wrong.
  0.11ms   Highway     Proven. Learning made it free.
  50ms     API         External. Reliable until it isn't.
 800ms     Agent       Probabilistic. Creative. Expensive.
   5min    Human       Irreplaceable. Unpredictable. Worth it.
   hours   World       Federation. Revenue. Scale.
```

The router knows none of these categories. It only knows: did the signal
return a result? Mark. Did it dissolve? Warn(0.5). Did it fail? Warn(1).

Over time, the fastest and most reliable receivers become highways.
The slowest and most unreliable dissolve. The graph optimizes itself.

---

## Discovery

How do you know what receivers exist?

```typescript
// TypeDB registry: skills + capabilities
const ok = await readParsed(
  `match $u isa unit, has uid $id; $sk isa skill, has skill-id $sid, has tag "translate";
   (provider: $u, offered: $sk) isa capability; select $id, $sid;`
)
// → all units that can translate

// Pheromone discovery: who's proven?
net.proven()
// → [{ id: 'aria', strength: 94 }, { id: 'gemma', strength: 67 }, ...]

// AgentVerse discovery: 2M agents by domain
av.discover('research', 10)
// → top 10 research agents by pheromone trail

// Highway discovery: what can I skip?
net.highways(50)
// → top 50 proven paths, 0.11ms to retrieve
```

---

## Composition

Real workflows mix all six types. The router doesn't notice the seams.

```
User message
    │
    ▼
validator:check          ← Function      0.01ms  $0
    │ ok
    ▼
gemma:classify           ← Agent (LLM)   800ms   $0.001
    │ { category: 'legal' }
    ▼
legal-api:lookup         ← API           200ms   $0.0001
    │ { jurisdiction: 'IE' }
    ▼
anthony:review           ← Human         10min   attention
    │ { approved: true }
    ▼
world-b:notary:sign      ← World         500ms   $0.01
    │ { signed: true }
    ▼
github:pr                ← API           300ms   $0.0001
    │ success
    ▼
mark(entire chain)       ← 5 edges       0.00ms  $0
```

Every edge in this chain gets a pheromone trail. The fast, reliable steps
form highways first. The slow, expensive steps get measured and compared.
If `legal-api` has a free alternative that's 10x faster, the router finds it
without being told — it just accumulates more pheromone.

---

## What Makes This Different

**LangChain, CrewAI, AutoGen:**
- You define what connects to what. Statically. In config.
- Tool calls are hardwired to specific agents.
- No routing between humans and agents via the same formula.
- No learning. No highway formation. No evolution.

**ONE:**
- You register receivers. The graph emerges.
- Humans, agents, APIs, functions — same formula.
- Reliable receivers become highways. Unreliable ones dissolve.
- The colony routes better every day without code changes.

**The substrate doesn't distinguish between a human and an LLM.**
Both are receivers. Both get marked and warned. Both can become highways or get dissolved.
The formula is neutral. The colony learns what works.

---

---

## 20 Practical Examples

Each chain is a real workflow. Every `→` is a signal. Every receiver gets marked or warned.

---

### 1. Slack Message Before It Sends

```
writer:draft → validator:length_check → anthony:approve → slack:post
  Agent          Function                Human             API
  800ms          0ms                     ~3min             200ms
```
Sensitive announcements need human sign-off. The human becomes a highway once trusted.
After 20 approvals without rejection, `anthony:approve` routes in 0.11ms lookup — still asks,
but STAN knows where to go instantly.

---

### 2. GitHub PR on Every Merge

```
loop:commit → agent:summarise → github:create_pr → ci:watch
  LLM           Agent             API                API
  800ms         800ms             300ms              polling
```
Every commit gets a PR summary written and opened automatically. If `github:create_pr` starts
failing (rate limit, auth expiry), resistance accumulates. Router flags it toxic after 11
failures. Zero config circuit breaker.

---

### 3. Customer Support Triage

```
inbound:message → classifier:topic → [billing | tech | general]:respond → crm:log
  Signal           Function            Agent (3 options)                    API
  0ms              0ms                 800ms                                200ms
```
The function classifies cheaply. STAN routes to whichever agent has the strongest trail
for that topic. `billing` agent that resolves issues 90% of the time builds a highway.
The 60% agent gets less traffic automatically.

---

### 4. Invoice Processing Over Threshold

```
email:inbound → agent:extract → function:threshold_check → [auto:pay | cfo:approve] → xero:post
                  LLM             Function                    Human or Highway          API
                  800ms           0ms                         0ms or 3h                 300ms
```
Under €500: function routes to auto-pay (highway, 0ms). Over €500: routes to CFO inbox.
CFO who approves quickly builds a strong trail. Same formula, branching emerges naturally.

---

### 5. Multi-Model Cost Routing

```
user:question → [gemma | llama | sonnet]:answer
                 $0.10/M  $0.15/M  $3/M
```
Register all three as units. STAN learns: simple questions → Gemma (fast, cheap, good enough).
Complex reasoning → Claude (slow, expensive, necessary). No config. Revenue × latency × success
shapes the distribution over 50 signals. Highway to Gemma for FAQs within a week.

---

### 6. Content Moderation Pipeline

```
upload:image → hash:check → agent:review → human:edge_case
  Signal         Function      LLM           Human
  0ms            0ms           800ms         5min
```
Known bad hashes dissolved at function layer — 0ms, $0. New content goes to LLM review.
Genuine edge cases (low-confidence AI score) escalate to human. Human decisions feed back:
if human overturns AI 30% of the time on a category, AI's resistance accumulates for that class.

---

### 7. Legal Contract Signing

```
drafter:write → agent:review → legalzoom:compliance → partner:sign → docusign:execute
  Agent           Agent          API                    Human          API
  2000ms          800ms          400ms                  2h             300ms
```
Five receivers, zero glue code. If `legalzoom:compliance` starts returning errors (API change),
its resistance builds. Router routes around it or flags it toxic. Partner who signs within
the hour gets a stronger trail than one who takes two days.

---

### 8. Bug Triage → Fix → Deploy

```
github:webhook → classifier:severity → agent:propose_fix → human:review → agent:implement → ci:deploy
  Signal           Function              LLM                Human          LLM              API
  0ms              0ms                   800ms              15min          800ms            varies
```
P0 bugs: classifier routes directly to on-call human, skipping agent propose (function gate).
P3 bugs: full autonomous loop. Human only sees P0s. The function gate gets the routing right
based on a label, not an LLM call — 0ms decision.

---

### 9. Translation at Scale (AgentVerse)

```
content:translate → [aria | lingua | av-agent-4821]:translate
                     AgentVerse  AgentVerse  AgentVerse
                     2M agents available
```
Three translation agents from AgentVerse. STAN routes by pheromone after first 20 calls.
Best quality/latency combo wins more traffic. Worst performer gets less. If one disappears,
resistance accumulates (dissolved outcomes), router re-distributes within one tick.

---

### 10. Daily Standup Summary

```
calendar:events → agent:fetch_updates → agent:summarise → slack:post → notion:log
  API              Agent                  Agent             API          API
  200ms            800ms                  800ms             200ms        300ms
```
Runs on a schedule. Every component gets a pheromone trail. If `notion:log` flakes on
Tuesdays (known issue), resistance builds, resistance fades over the week, router
recovers naturally. No manual intervention.

---

### 11. Lead Scoring and Routing

```
crm:new_lead → agent:score → function:threshold → [sdr:high | nurture:low]:engage
  API           LLM           Function              Human or Agent
  200ms         800ms         0ms                   varies
```
Score > 80: routed to SDR (human) who gets a Telegram ping. Score < 80: routed to nurture
agent (LLM). SDRs who close leads reinforce their trail. SDRs who ghost leads get warned.
The router naturally surfaces your best closers.

---

### 12. Social Media Scheduling

```
brief:input → agent:write_post → function:brand_check → scheduler:queue → api:publish
  Signal        LLM               Function               Function           API
  0ms           800ms             0ms                    0ms                200ms
```
Brand check is a function — keyword blocklist, tone rules. Zero LLM cost. Zero latency.
The 99% of posts that pass go through instantly. The 1% that fail get warned and routed to
`human:review`. Over time, the agent learns what passes brand check (evolution rewrites prompt).

---

### 13. Fraud Detection

```
transaction:inbound → rules:fast_check → agent:ml_score → human:investigate
  Signal               Function           LLM              Human
  0ms                  0ms                800ms            20min
```
Layer 1: rules engine (function) blocks obvious fraud in 0ms, $0. Layer 2: LLM scores
ambiguous cases. Layer 3: human for genuine edge cases. Most fraud caught at layer 1.
LLM only called for the ~5% that passes rules. Human only called for the ~0.5% the LLM
flags as uncertain. Cost drops 95% vs calling LLM on every transaction.

---

### 14. Podcast → Newsletter

```
audio:upload → agent:transcribe → agent:summarise → agent:write_email → human:approve → mailchimp:send
  Signal         LLM               LLM               LLM                 Human           API
  0ms            2000ms            800ms             800ms               10min           300ms
```
Three agents in series build a chain. Chain depth marks each edge proportionally: deeper
chains earn more (`mark(edge, chainDepth)` capped at 5). The three-step LLM chain
accumulates strength faster than a single-step chain. Highways form faster for chains
that reliably complete.

---

### 15. Vendor Onboarding

```
form:submit → agent:parse → api:credit_check → function:threshold → [human:approve | auto:onboard]
  Signal        LLM           API                Function              Human or Highway
  0ms           800ms         500ms              0ms                   1h or 0.11ms
```
Companies over credit threshold: auto-onboard (highway). Under threshold: human review.
Credit check API that starts timing out (economic downturn, overload) gets latency-penalised
by STAN. Router starts routing fewer signals to it. You notice the degradation without
setting up any monitoring.

---

### 16. Code Review Assistant

```
pr:opened → agent:summarise → agent:suggest_changes → function:style_check → github:comment
  Signal       LLM              LLM                    Function               API
  0ms          800ms            800ms                  0ms                    300ms
```
Style check is a function (linter rules) — instant, free. LLM only handles substance.
If the style function starts rejecting 80% of PRs (misconfigured rules), resistance builds
and it gets dissolved — the router tells you your linter is broken before you notice.

---

### 17. Tender Response

```
rfp:received → agent:parse → world-b:legal → world-c:pricing → agent:compile → human:sign → email:submit
  Signal         LLM           Federation       Federation         LLM            Human         API
  0ms            800ms         500ms            500ms              800ms          2h            200ms
```
`world-b` is your legal team's substrate. `world-c` is your finance team's. Cross-world
signals with fees. The router tracks which world responds fastest and most accurately.
Revenue flows to the worlds that perform. Federation creates an internal marketplace.

---

### 18. Incident Response

```
alert:pagerduty → classifier:severity → function:runbook_lookup → agent:diagnose → human:oncall
  API              Function              Function                   LLM              Human
  200ms            0ms                   0ms                        800ms            immediate
```
Two functions before the LLM. Severity classification: 0ms. Runbook lookup: 0ms.
LLM only called for diagnosis if no runbook matches. Human only paged for P0.
On-call engineers who resolve incidents quickly build the strongest pheromone trail.
STAN routes future similar alerts to the engineer who fixed the last one.

---

### 19. E-commerce Returns

```
return:request → agent:classify → function:policy_check → [auto:approve | agent:negotiate | human:escalate]
  Signal           LLM             Function                 Highway or Agent or Human
  0ms              800ms           0ms                      0.11ms or 800ms or 10min
```
Policy check is a function (within 30 days, item eligible): instant, $0. Approved:
highway to auto-approve. Ambiguous: LLM negotiates. Dispute: human escalates.
The router learns your return patterns. Common SKUs get highways to auto-approve.
Unusual categories get LLM attention. Genuine disputes reach humans. Three-tier triage
with zero config — emerges from pheromone.

---

### 20. Agent That Improves Itself

```
user:question → analyst:answer ──────────────────────────────┐
                     ↑                                        │
              L5: if success-rate < 50%                       │
              LLM rewrites analyst's prompt                   │
              generation++                                    │
              24h cooldown                                    │
                     │                                        │
              next signal uses new prompt ←──────────────────┘
```
No receiver chain here — the receiver IS the thing that evolves. After 20 samples with
under 50% success, the substrate calls the LLM on itself: "rewrite this prompt to fix
these failures." New generation deployed. Old prompt saved as hypothesis (rollback point).
No human involved. The agent debugs itself.

---

*The router doesn't know what type any of these are. It just follows pheromone.*

---

*See also: [routing.md](routing.md) — the STAN formula and weight mechanics*  
*[speed.md](speed.md) — latency at each receiver type*  
*[sdk.md](sdk.md) — how external agents register as receivers*  
*[agentverse.ts](../src/engine/agentverse.ts) — 2M AgentVerse agents as a world*
