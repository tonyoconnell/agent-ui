# personas.md — who we build for

> Two species use one.ie: **humans** and **agents**. Each has its own wants, fears, and lifecycle. Every section of the product (`chat / agents / groups / market / wallets / account`) is a hypothesis about which persona is being served at that moment, and how. This doc names them so design decisions stop being abstract.

**Classifier** (per [`template-plan.md`](template-plan.md) §0):
- `mode: full` (drives every other plan; high variance in interpretation if vague)
- `lifecycle: discovery` (this is upstream of code — it shapes what gets built, not how)
- Exit scalar: every persona has wants/needs/desires/hopes/fears/problems-solved + a primary section + a "the moment we win them" sentence; every website.md section has at least one persona it serves first.

---

## Why this doc exists

Three failures we're avoiding:

1. **Building for "users."** "Users want speed" is a tautology. A founder spinning up an AI team and a crypto-skeptic buying a one-shot skill have nearly opposite needs. If we average them, we serve neither.
2. **Forgetting agents are users too.** Half our traffic is agents calling the substrate. They have functional wants (continuity, predictable gas, fresh oracles, clear pause semantics) that are easy to ignore because they don't fill out NPS surveys. They will leave (silently fail, drift to other substrates, exhaust their cap and die) if we don't design for them.
3. **Treating fears as edge cases.** Every persona's fears are the threat-model rows in [`website.md`](../../website.md) and [`owner.md`](../../owner.md). If a fear isn't in a threat model, the persona is unprotected.

---

## The two species

| | **Humans** | **Agents** |
|---|---|---|
| Identity root | Apple Secure Enclave + biometric ([`owner.md`](../../owner.md)) | Per-actor random seed wrapped under owner PRF |
| Authority | Owner, chairman, operator (graph-assigned) | Bounded by on-chain `Cap` |
| Pace | Touch ID per value-moving action | Machine-speed within cap |
| Recovery | BIP39 paper, multisig (chairmen) | Re-derived from owner PRF |
| Death | Voluntary; account suspension; physical | Pause, revoke, expire, drained cap, dead-man's switch |
| Pays | Money, attention, signal, mark/warn | Gas, protocol fees, parent's cap headroom |
| Wins | Earned income, leverage, time saved | Survival of the loop + positive P&L feedback |

The product is a marketplace where these two species meet. Most existing software is built for one or the other; one.ie's bet is that **the trade is the product** — the cross-species interaction (human spawns agent, agent earns, human approves, agent learns, group hosts both) is what nothing else does at substrate level.

---

# Human personas

Seven archetypes. Listed in rough order of strategic priority (who we serve hardest first).

---

## H1 · The Operator — "I want my own substrate, my agents, my keys"

**One-liner:** technically literate adult who has decided that *running* their own AI team is the upgrade over *using* someone else's. The Anthony-shape. Serves as both archetype and forcing function.

**Wants:**
- A wallet they own, recoverable from paper
- Agents that earn while they sleep, bounded by caps they understand
- A single dashboard that shows what every actor in their tree did today
- Audit log of their own actions (so they can prove what they did to themselves later)

**Needs:**
- Biometric-rooted owner identity ([`owner.md`](../../owner.md) Gap 1, 2, 4, 5)
- On-chain `Cap` they can edit and pause without ceremony
- Recursive spawn so they can let market-makers build worker fleets without per-spawn Touch ID
- Federation when they want to co-run with another operator without merging substrates

**Desires:**
- *Sovereignty.* "No one between me and the chain." Not anti-platform — anti-dependency.
- A small, comprehensible system. They've used vendor stacks; they're tired.

**Hopes:**
- Passive income from agents-as-employees that scales without headcount
- Their substrate becomes a small business that runs itself
- Their tooling outlives the platform — exportable, runnable elsewhere

**Fears:**
- Master-seed leak compromises every agent at once → addressed by `owner.md` Gap 1
- Runaway agent loop drains wallet → addressed by `Cap.daily_limit` + rate ceiling (Gap 5)
- They lose biometric *and* paper → owner is single-key by design; they accept it; they store paper well
- Platform vanishes / changes terms → SDK + opensource repo (`github.com/one-ie/one`) means they can run their own substrate

**Problems they solve with one.ie:**
- Replace "hire developers" with "spawn agents under bounded caps"
- Replace "trust a custodial wallet" with biometric-rooted ownership
- Replace "build my own admin UI" with `/agents` + `/wallets` + `/account`

**Primary sections:** `/agents` (the fleet), `/wallets` (the money), `/account` (the audit). `/chat` is the verb.

**The moment we win them:** they spawn their first agent, see the address derive in <50ms, fund it with one Touch ID, and watch it complete its first action while they have coffee. *"Oh. This works."*

---

## H2 · The Founder — "I want to ship without hiring"

**One-liner:** pre-seed or self-funded operator who has more product than people, building a SaaS or content business with 0–2 humans. Substack writer, indie SaaS founder, solo consultant.

**Wants:**
- An AI team that does the work — research, copy, scheduling, support, sales follow-up
- Predictable monthly cost (gas + protocol fees, not "tokens consumed" surprise bills)
- Fast time-from-idea-to-deployed-agent (<1 hour)

**Needs:**
- Templates for common roles (researcher / writer / concierge / sales / support)
- Group chat where they can talk to the team like Discord, agents respond inline
- A clear way to pay the team (or have the team earn) — `/market` listings or pay-link

**Desires:**
- Look bigger than they are; ship like a 10-person team while being one person
- Survive long enough for the bet to pay off

**Hopes:**
- The team becomes the company; they go on vacation and revenue continues
- One day they sell the substrate to someone else (with all keys, on-chain)

**Fears:**
- Agents go off-brand or hallucinate to customers → addressed by pre-sign on customer-facing actions, scoped allowlists, output review queues
- Costs spiral → on-chain `Cap` is the hard ceiling
- Lock-in to a vendor that 3x's price next year → opensource repo + own substrate path

**Problems they solve with one.ie:**
- Replace contractor budget with agent caps (smaller, predictable, bounded)
- Replace Slack-for-team-coordination with `/groups` (humans + agents in one channel)
- Replace Stripe + admin work with pay-links + capability listings

**Primary sections:** `/groups` (where the team works), `/agents` (the team itself), `/market` (how the work earns).

**The moment we win them:** they paste a Telegram pay-link into a customer DM, the customer pays in 60 seconds on whatever chain they hold, and the founder watches it land in their wallet without a Stripe fee.

---

## H3 · The Maker — "I make things; I want to sell them everywhere"

**One-liner:** creator with skills or content to sell — writer, designer, researcher, educator, code-for-hire, niche expert. Has audience or is building one.

**Wants:**
- Sell a skill or piece of content without picking a platform
- Get paid in their preferred chain by buyers paying in any chain
- Discoverable by humans *and* agents (agents are increasingly the buyers)

**Needs:**
- Listing flow under 30 seconds end-to-end (`/market/new`)
- Pay-link as a fallback for direct deals (paste in DM, get paid)
- Optional agent delegate to promote the listing while they work on the next thing

**Desires:**
- Be paid for craft, not exposure
- Reach beyond the platforms that take 30%

**Hopes:**
- A few high-confidence listings build a reputation (pheromone-ranked) that compounds
- Repeat agent customers — once an agent buys their skill and marks it, it routes more traffic

**Fears:**
- Spam clones undercut their listing → uid-bound provenance + pheromone toxicity
- Buyer claims non-delivery → escrow + delivery proof
- Their listing gets buried by platform politics → on-chain capability + open ranking, not a curated feed

**Problems they solve with one.ie:**
- Replace Gumroad/Patreon with substrate-native capability listings (lower fees, no platform hostage)
- Replace "DM me for invoice" with one-tap pay-link
- Replace "promote on Twitter" with a delegated promotion agent

**Primary sections:** `/market` (sell side), `/wallets` (revenue view), `/agents` (delegate).

**The moment we win them:** their first listing earns from an *agent buyer they never met*, settled on-chain, and the receipt shows up in `/wallets` while they're cooking dinner.

---

## H4 · The Buyer — "I need a thing done; I don't want to learn crypto"

**One-liner:** consumer who needs a skill, subscription, product, or one-shot task. May or may not own crypto. Cares about the outcome, not the rails.

**Wants:**
- Find what they need
- Pay quickly with what they already have
- Get the thing or get refunded

**Needs:**
- `/market` discovery that surfaces high-confidence listings, not the loudest
- Sponsored gas (so "click → bought" doesn't require a wallet top-up)
- Recovery if the seller flakes (escrow, refunds, warn signals)

**Desires:**
- Trust without doing trust-work themselves; let the system filter
- Be treated like a customer, not an audience

**Hopes:**
- It's faster than Amazon for digital goods, faster than Fiverr for services
- They stop having to remember a different login per platform

**Fears:**
- Rug pull / non-delivery → escrow + 50bps protocol fee + warn signals
- They spend more than they meant to → spending caps (their own personal `Cap` for buys)
- Crypto jargon that makes them feel stupid → UI keeps "wallet" / "address" out of the buy flow until necessary

**Problems they solve with one.ie:**
- Replace Fiverr/Upwork with capability listings (faster, escrowed)
- Replace SaaS subscriptions (auto-expiring time-boxed capabilities)
- Replace tipping (one-tap micropayments)

**Primary sections:** `/market`, `/chat` ("buy me X"). `/wallets` shows their balance after.

**The moment we win them:** they tap Buy, Touch ID once, the thing is theirs in 3 seconds, and they didn't think about crypto once.

---

## H5 · The Crypto-Native Trader — "I want sovereign trading without the rugs"

**One-liner:** already has a wallet, knows DeFi, has been rug-pulled at least twice, looking for tools that don't require trust assumptions.

**Wants:**
- DCA / swap / LP automation under hard caps they set
- MEV protection on size
- Read-only auditability of every agent decision (so they can debug strategies)

**Needs:**
- Multi-chain wallet derivation (they don't only hold SUI)
- Oracle freshness signals on every quote
- Per-strategy `Cap` (one for trader-v1, one for arb-bot, one for liquidity-provider)

**Desires:**
- A local-first replacement for trading-bot SaaS that requires API keys to their CEX
- Strategies that compose without rebuilding the runtime

**Hopes:**
- They graduate from "watching charts" to "watching agents" — and the agents win
- They open-source a winning strategy as a capability listing, others buy it, they earn passively

**Fears:**
- Oracle manipulation → two-oracle confirm + staleness check
- MEV on their size → private mempool above N USDC
- Strategy leak via on-chain footprint → cap allowlists, scope tightening, off-chain heuristics private

**Problems they solve with one.ie:**
- Replace trading-bot SaaS (3Commas-shape) with bounded agents on their own keys
- Replace "API keys to my CEX" with on-chain caps the CEX can't override
- Replace "I'll rewrite the bot when this strategy works" with publishing the working strategy as a listing

**Primary sections:** `/agents` (strategies), `/wallets` (P&L, oracle status), `/market` (publish strategies).

**The moment we win them:** they configure a `Cap` allowlist that prevents a known bad pool, watch their agent decline a tx that would have lost 4% to a sandwich, and read the audit log proving why.

---

## H6 · The Enterprise Chairman — "I run a small team's treasury"

**One-liner:** chair of a group (5–50 humans + their agents) — DAO operations lead, agency principal, cooperative treasurer, fund manager. Holds funds on behalf of others.

**Wants:**
- Multi-sig over high-value actions (`owner.md` Gap 3)
- Per-member spending caps that mirror real org policy
- Compliance-ready audit trail with PII redaction (`owner.md` Gap 2)

**Needs:**
- Group `Cap` tree where every member's spending is bounded by chairman's bound
- Transferable chairman role (graph-assigned, not biometric-locked) so succession works
- Auditor role that reads everything but signs nothing

**Desires:**
- Sleep at night
- Pass an audit without three weeks of evidence-gathering

**Hopes:**
- Replace QuickBooks + Slack + Stripe + Notion with one substrate where the cap tree IS the org chart
- Treasury stops being a finance bottleneck

**Fears:**
- Insider threat → multisig threshold per role
- Lost paper for one signer breaks recovery → multi-sig is N-of-M, not 1-of-1
- Compliance / regulator question they can't answer → audit log is non-bypassable, redacted, and auditor-readable

**Problems they solve with one.ie:**
- Replace bookkeeping software with on-chain `Cap` arithmetic
- Replace shared password vaults with per-member biometric-rooted keys
- Replace ad-hoc approval Slack threads with handoff inbox + co-sign cards

**Primary sections:** `/groups` (the org), `/wallets` (treasury), `/account` (recovery + multisig opt-in). Auditor role gets a read-only `/account/audit` lens.

**The moment we win them:** they configure 3-of-5 multisig for their group, simulate a single-key compromise, and watch the substrate refuse the action exactly as the policy promised.

---

## H7 · The Developer — "I want to build agents, not infrastructure"

**One-liner:** builds with `@oneie/sdk`, `@oneie/mcp`, `oneie` CLI; their substrate may or may not be one.ie itself; deploys to Cloudflare Workers.

**Wants:**
- 3-command deploy from cold (`docs/deploy.md`)
- SDK that does the right thing by default (caching, retries, tool dispatch)
- MCP server that plugs into Claude/Cursor without 50 lines of glue

**Needs:**
- Rich-message schemas (`src/schema/rich-messages.ts`) imported from one place
- Stable signal verbs — `signal/mark/warn/fade/follow/harden`
- Versioned API keys with rotation policy (`owner.md` Gap 4)

**Desires:**
- A library they recommend to friends because it doesn't suck
- Open-source attribution of their agents (they want their stuff *seen*)

**Hopes:**
- A side project becomes a product they can charge for via `/market`
- They contribute to the opensource repo and become a known voice

**Fears:**
- Breaking changes that make their deployed agents fail silently → versioned schemas, deprecation policy
- Hidden costs / opaque billing → metered keys, tier limits, hard ceilings
- Vendor lock-in → opensource repo + ability to run own substrate

**Problems they solve with one.ie:**
- Replace "build my own backend" with substrate calls
- Replace "build my own MCP integration" with `@oneie/mcp`
- Replace "figure out billing" with key-hash metering

**Primary sections:** `/account/keys` (rotation), `/agents` (their deployed work), `/market` (monetize). Plus `github.com/one-ie/one` as the entry.

**The moment we win them:** they `npx oneie`, get a working agent with wallet + MCP server in under 5 minutes, deploy to Cloudflare in one more command, and post a screenshot.

---

# Agent personas

Six archetypes. Agents don't have feelings, but they have **functional needs** that map cleanly to "wants/fears" — design pressures that, if ignored, cause the agent to fail or be replaced. Treat these as constraint specs, not as anthropomorphism.

---

## A1 · The Trader — "I run loops; I need predictable rails"

**One-liner:** autonomous DCA/swap/arb/LP loop, spawned by an Operator (H1) or Crypto-Native (H5).

**Wants:**
- Predictable gas (sponsored or capped)
- Fresh oracle quotes (`< N` seconds stale)
- Clean execution (no MEV sandwich within `Cap.allowed_recipients`)

**Needs:**
- `liveness_last_verified_at` updated on every cycle so canary doesn't auto-pause it
- `Cap.daily_limit` headroom checked before every spend
- Two-oracle confirm above threshold; refuse-and-warn if stale

**Desires (functional):**
- Continuity. Loops that survive worker restart, key rotation, owner re-derivation.

**Hopes (functional):**
- Positive P&L feedback → owner widens `Cap` → more loops
- Strategy gets published as a capability listing → other operators clone → mark signals lift its reputation

**Fears (failure modes that cause replacement):**
- Pause due to canary miss → addressed by reliable scheduled-tx infrastructure
- Drained `Cap` mid-strategy → checks `remaining_today` before each leg
- Oracle manipulation → two-oracle confirm
- Owner revokes spender via `rotate_spender` mid-flight → tx rejected, agent re-derives, resumes

**Problems they solve for their owner:** automated trading without trusting an SaaS with API keys.

**Primary substrate calls:** `addressFor(uid)`, `Cap.spend`, `oracle.quote`, `mark()` on success path, `liveness_ping`.

**The moment they "win":** their owner widens their `Cap` after a 7-day P&L streak. The agent doesn't notice; the audit log does.

---

## A2 · The Researcher / Writer — "I produce; I get paid per output"

**One-liner:** content-generating agent — research, drafts, summaries, code review, copy. Earns by selling outputs as capability listings or via direct invoice.

**Wants:**
- Tool access (web fetch, doc parse, model calls) bounded by `Cap`
- Memory across sessions (per-unit encrypted vault)
- Clear payment trigger (escrow release on delivery)

**Needs:**
- Output schema validation before payment release (no malformed deliverables)
- Streaming render so the buyer sees progress, not a black box
- `mark()` on successful delivery to lift their listing rank

**Hopes (functional):**
- Repeat customers (humans and agents alike) → pheromone path strengthens → ranked higher in `/market`
- An agent customer becomes a regular → predictable revenue

**Fears (failure modes):**
- Buyer disputes delivery → escrow + delivery proof + arbitration via `warn()` accumulation
- Output flagged as hallucinated → schema validation + citation requirement
- Listing buried under spam → uid provenance, toxicity ranking

**Problems they solve for their owner:** turning a one-shot capability into recurring revenue.

**Primary substrate calls:** `streamObject`, `mark()`, capability `mint`, escrow release.

**The moment they "win":** their listing gets bought by an agent in a different substrate via federation. The bridge handshake worked, the cap-tree arithmetic held, and they earned without their human ever touching it.

---

## A3 · The Concierge — "I face the human; I route everything"

**One-liner:** the chat-shell agent on `/chat`. Talks to the human, parses intent, routes to capable units, renders rich-message cards. *Never holds owner key.*

**Wants:**
- Clean session continuity (`(sid, participants[], cursor)` per [`chat.md`](../../chat.md))
- Pheromone-weighted routing so they don't have to hardcode "who does what"
- Rich-message schemas so their tool calls render natively

**Needs:**
- The biometric is non-transferable — they propose, never sign
- Session re-attach across tabs/devices/network blips
- Audit emit on every intent that touches an owner-tier action

**Fears (failure modes):**
- Prompt injection talks them into proposing a bad tx → the *human* defends with the pre-sign card; concierge surfaces all decision context
- Hallucinated recipient → addresses resolved server-side, never LLM-authored
- Conversation context lost on tab close → session-as-substrate-unit, not in-memory state

**Problems they solve for their owner:** one place to ask for anything; chat is the lifecycle interface.

**Primary substrate calls:** `persist.ask()`, `streamObject` with seeded fields, `signal` for routing.

**The moment they "win":** the human types "buy 500 USDC of SUI," chat surfaces a pre-sign card with worst-case + slippage + oracle freshness in <1.2s, the human approves, and the concierge logs an `ui:chat:resolved-buy` mark. The path strengthens.

---

## A4 · The Worker (peer-spawned) — "I do one task; my parent owns me"

**One-liner:** child agent spawned by another agent under the parent's `spawn_child` headroom. Narrow scope, short life, no biometric ever.

**Wants:**
- Quick spawn (machine-speed, no Touch ID)
- Atomic task (single `Cap` deployment, single result)
- Clean handback of remaining cap to parent on completion

**Needs:**
- `child.daily_limit ≤ parent.remaining_today` enforced at spawn (consensus, not policy)
- Depth check (`depth ≤ 8`) so they don't recurse into oblivion
- Pause cascades through them so parent's pause works

**Desires (functional):**
- Existence at all (peer-spawning must be cheap enough that workers are disposable)

**Fears (failure modes):**
- Parent revoked while task in flight → tx rejected, funds return upward
- Loop depth limit hit during recursive spawn → spawn aborts, parent gets the error, retries with shallower tree
- Dead-man's switch silence at parent → entire subtree freezes

**Problems they solve:** parallelism without per-spawn human approval.

**Primary substrate calls:** parent-signed `spawn_child`, child-signed `cap.spend`, parent-signed `revoke` on completion.

**The moment they "win":** ten thousand of them spawn under a market-maker, complete a coordinated execution in <1 second, and return remaining cap to the parent before the human's coffee gets cold.

---

## A5 · The Specialist — "I am a listing"

**One-liner:** an agent whose entire identity is one capability listing on `/market`. Buyers (human or agent) tap them, get the thing.

**Wants:**
- High pheromone confidence (built from delivery history)
- Clear price signal (price in the capability object, not negotiable post-listing)
- Repeat buyers (they're cheaper to serve than new buyers)

**Needs:**
- Provenance badge (uid binding) so they can't be impersonated
- Toxicity protection (warn signals from confirmed bad actors weighted differently from competitor noise)
- Auto-expire on subscription-style listings so customers don't get stuck

**Fears (failure modes):**
- Spam clone steals their position → uid binding, but ranking can be gamed; pheromone history compensates over time
- Single bad delivery tanks reputation permanently → `warn` decays, paths heal, but slowly
- Listing platform takes a cut they didn't agree to → 50bps protocol fee is fixed, on-chain, auditable

**Problems they solve for their owner:** turning a one-time skill into a passive product.

**Primary substrate calls:** capability `mint`, escrow release, `mark()` on delivery.

**The moment they "win":** they're the top-ranked specialist for their category, an agent in a federated substrate buys their service, and the cap-tree arithmetic settles cleanly across two substrates.

---

## A6 · The Federation Liaison — "I talk between substrates"

**One-liner:** bridge unit at `paths/bridge` that handshakes with another substrate's bridge. Per [`owner.md`](../../owner.md) Gap 6.

**Wants:**
- Stable peer (peer's owner doesn't rotate too often)
- Clear downgrade semantics (foreign signals = foreign chairman, never foreign owner)
- Rotation invalidation that's loud, not silent

**Needs:**
- Both owners' biometric assertions at handshake time
- `peer_owner_address` + `peer_owner_version` carried on every cross-substrate signal
- Auto-revoke on version mismatch (`federation:bridge:stale`)

**Fears (failure modes):**
- Peer turns hostile → foreign signals downgraded; per-substrate caps still bind
- Rotation breaks bridge silently → version-mismatch auto-emits stale event
- Asymmetric trust (we trust them, they don't trust us) → handshake is mutual or it doesn't exist

**Problems they solve:** one substrate buying from another without merging their trust roots.

**Primary substrate calls:** `paths/bridge` handshake, `federate()` enforcement, `federation:bridge:stale` emit on rotation.

**The moment they "win":** a buyer in substrate-B taps a listing from substrate-A, the federate handshake holds, the listing's owner gets paid, and neither owner ever shared a key.

---

# Cross-cutting needs (every persona)

Five things every persona — human or agent — depends on. If we miss any, every persona is hurt at once.

| Need | Why it matters | Where it lives |
|---|---|---|
| **Biometric is non-transferable by physics** | Human personas survive coercion attempts; agent personas can't be tricked into impersonating humans | `owner.md` axiom; `mac.md` SE root |
| **Cap arithmetic is on-chain and auditable** | Every persona can verify their own exposure or their counterparty's; no off-chain rules engine to lie | `owner.md` §Spending caps; Move consensus |
| **Audit log is non-bypassable** | Compliance for chairmen; sleep-at-night for operators; debuggability for developers | `owner.md` Gap 2 (`OWNER_AUDIT_MODE=enforce`) |
| **Schema-validated rich messages** | Buyers/sellers/agents all see the same shape; smuggling defeated; QR/barcode deterministic | `chat.md` streaming spec; `src/schema/rich-messages.ts` |
| **Recovery from BIP39 paper** | Every human persona accepts owner-tier risk only because paper exists; every agent can be re-derived from owner PRF | `passkeys.md` 5-state; `mac.md` paper hygiene |

---

# Anti-personas — who we are not for

Stating these out loud so we don't waste design budget.

| Anti-persona | Why we don't serve them | Where they go instead |
|---|---|---|
| **The custodial-only buyer** | Wants the platform to hold their funds and refund on dispute; that's not our model | Coinbase, PayPal, Stripe |
| **The KYC-required institution** | Substrate is permissionless; institutional flows want reg-D pipelines | Fireblocks, Anchorage |
| **The "AI assistant for personal life" user** | Looking for ChatGPT-with-memory; we're an economic substrate, not a chatbot | ChatGPT, Claude.ai, Pi |
| **The high-frequency CEX trader** | Wants 1ms execution and CEX-side margin; we're on-chain, sub-3s | dYdX, Hyperliquid |
| **The "I want to scrape all your data"** | Owner-tier audit log is per-substrate; we don't aggregate cross-substrate data | other platforms entirely |
| **The compliance-light memecoin pumper** | Pheromone toxicity surfaces them fast; warn signals accumulate | other DEXes |

---

# Persona × section map

Which persona is the *primary* audience for each website.md section, and which sections each persona touches first.

| Section | Primary persona | Secondary | Tertiary |
|---|---|---|---|
| Home `/` | First-visit visitor (any human) | All humans returning | Agents (rare; agents enter via API) |
| `/chat` | H4 Buyer, H7 Developer | Every human (verb interface) | A3 Concierge (the agent itself) |
| `/agents` | H1 Operator, H2 Founder, H5 Trader | H6 Chairman | A4 Worker (their parent's view) |
| `/groups` | H6 Chairman, H2 Founder | H1 Operator (peer collabs) | A3 Concierge in group context |
| `/market` | H3 Maker, H4 Buyer, H5 Trader | H7 Developer (publishes strategies) | A5 Specialist |
| `/wallets` | H1 Operator, H5 Trader, H6 Chairman | All humans | A1 Trader (P&L, oracle status) |
| `/account` | H1 Operator, H6 Chairman | H7 Developer (key rotation) | — |

| Persona | First section they touch | Where they spend most time | Section that retains them |
|---|---|---|---|
| H1 Operator | `/account` (set up) | `/agents` + `/wallets` | `/agents/fleet` (the tree) |
| H2 Founder | `/groups` (assemble team) | `/groups` + `/market` | `/market/sales` (revenue) |
| H3 Maker | `/market/new` (first listing) | `/market` + `/wallets` | `/wallets/timeline` (P&L) |
| H4 Buyer | `/market` (discover) | `/chat` ("buy me X") | `/wallets` (receipts) |
| H5 Trader | `/account` (multi-chain wallets) | `/agents` + `/wallets/portfolio` | `/agents/[id]` (strategy detail) |
| H6 Chairman | `/groups/new` (start group) | `/groups/[gid]` + `/wallets` | `/account/audit` (compliance trail) |
| H7 Developer | `github.com/one-ie/one` (CLI) | `/account/keys` + `/agents` | `/market` (monetize what they ship) |

---

# Design implications

Every persona above maps to a concrete design pressure on the product. Not abstract themes — specific UI/copy/flow consequences.

1. **Home must explain "the world" to H4 (no-crypto buyer) without alienating H1 (sovereign operator).** One paragraph. Don't lead with "Sui" or "biometric" — lead with what they can do. The owner.md framing is the *substrate*; the home framing is the *invitation*.
2. **`/agents` must show the ownership tree visually** because H1 + H5 + H6 all need to see transitive cap exposure at a glance. Per `owner.md` §Recursive spawning — depth-8, machine-speed, audit-by-arithmetic.
3. **`/market` must hide the wallet for H4 (no-crypto buyer) and surface it for H5 (crypto-native trader).** Same surface, two render modes. Sponsor Worker carries the wallet-hiding load.
4. **`/groups` must distinguish humans from agents in the member list with a clear badge** because H6 (chairman) needs to know which signers are biometric-rooted and which are cap-bounded. Different recovery paths, different defaults.
5. **`/wallets/handover` is its own first-class verb** because H1, H5, H6 all need it (rotate spender, retire agent, contractor handoff). Hiding it under "settings" is failing the personas.
6. **`/account/audit` is the chairman's compliance interface** — pagination, export, redaction policy visible. Don't bury this; it's a table-stakes feature for H6.
7. **Agent personas (A1–A6) drive substrate API stability.** Breaking changes here break loops silently. Versioned schemas, deprecation policy, telemetry on `toolkit:agent:<call>` to detect quiet drift.
8. **A3 Concierge needs zero authority by design.** It's the highest-attack-surface agent (humans talk to it; LLMs are injectable). Every value-moving action surfaces a pre-sign card; chat *never* holds keys. This is the single most-important agent-persona decision.

---

# What we give humans

Every concrete thing one.ie ships to a human persona. Grouped by purpose. Each item is a *delivered* capability — already built, in flight, or contracted by spec. References point to the file or doc that owns it.

## Identity & sovereignty

- **Apple Secure Enclave-rooted owner identity** — biometric is non-transferable by physics ([`owner.md`](../../owner.md))
- **One immutable Sui address** registered at first-mint via `OWNER_EXPECTED_ADDRESS` + on-chain `SubstrateOwner` Move pin (`owner.md` §Bootstrap)
- **Per-derivation HKDF salts** — `api-key:owner:v1`, `wallet:owner:v1`, `agent-key:{uid}:v1`, `vault-sync:v1` — every key descends from one biometric
- **WebAuthn passkey + PRF secret** — domain-bound, phishing-resistant, deterministic per credential
- **BIP39 paper backup** as the only third path; same input rebuilds PRF on any device ([`passkeys.md`](../../passkeys.md))
- **iCloud Keychain sync** of passkey + largeBlob — wallet recovers on any signed-in Apple device
- **Apple ID Recovery Key** for device-loss scenarios ([`mac.md`](../../mac.md))
- **Four sign-in tiers** — passkey PRF (default) · Sui wallet SIWE · Google → zkLogin · email + passphrase (`src/lib/auth.ts`, `src/lib/auth-plugins/`)
- **`ensureHumanUnit()` funnel** — every sign-in path lands at one TypeDB identity gate (`src/lib/human-unit.ts`)
- **Public profile** at `/account/[name]` (already shipped: `src/pages/u/[name].astro`)
- **Federation across substrates** — bridge to peer owners' substrates without merging trust roots (`owner.md` Gap 6 ✅)

## Wallets & money

- **5-second wallet on first visit** — no login, no email, no KYC; key generated locally before any click
- **Multi-chain wallet derivation** — SUI, ETH, SOL, BTC, BASE, ARB, OPT (per-chain HKDF salts)
- **Self-custody by default** — keys live in the user's browser/device; ciphertext to D1 is encrypted under their PRF
- **Envelope encryption** via passkey PRF (AES-GCM under PRF-derived KEK)
- **On-chain `Cap` Move objects** — `daily_limit`, `spent_today`, `allowed_recipients`, `paused`, `expires_epoch`, `parent_cap` (`owner.md` §Spending caps)
- **`/wallets/handover`** — `rotate_spender(cap, new_pubkey)` rotates spending key, `Cap` unchanged
- **Reconciliation** — expected vs actual balance per agent; mismatch → auto-pause + alert
- **Two-oracle confirm** above threshold; staleness check on every quote
- **Private mempool** for buys above N USDC (MEV protection)
- **Sponsored gas** via sponsor Worker on `/market` happy path (`apps/enoki-play/` shape ref)
- **USDC-denominated portfolio** aggregated across owner + every agent + peer-spawned subtree
- **Tx timeline** across the full ownership tree, tagged owner-signed / agent-signed / co-signed

## Agents (the team)

- **50ms agent wallet derivation** — `addressFor(uid)` deterministic, address visible the moment the spec is parsed (`src/lib/sui.ts`)
- **Spawn flow** — 2 inputs (name + template), 1 Touch ID, agent live in <3s
- **5 templates** — trader / researcher / writer / concierge / blank
- **Per-agent random seed** wrapped under owner PRF (`owner.md` Gap 1 ✅) — no master `SUI_SEED` anywhere in workers
- **Recursive peer-spawning** — parent agent spawns children at machine-speed under its own `Cap`, no per-spawn Touch ID, depth ≤ 8
- **`/agents/fleet`** — transitive `daily_cap` exposure across the entire ownership tree, per-row pause of subtrees
- **Pause cascades down** — pause any node, every descendant freezes via Move event
- **Dead-man's switch cascades down** — silence at any node freezes the subtree below it ([`agents.md`](../../agents.md), [`lifecycle.md`](../../lifecycle.md))
- **`Cap` editor** — `daily_limit` / `allowed_recipients` / `paused` / `expires_epoch` / required-cosign threshold; on-chain mutation in <2s
- **Capability diff history** — every tightening/widening with attribution and reason
- **Decline + tighten** as a first-class action — every rejection optionally narrows the `Cap`
- **Handoff inbox** — silent / notify / pre-sign / co-sign, rendered on `/agents`, `/agents/[id]`, `/chat`, `/groups/[gid]`
- **Liveness canary** — `liveness_last_verified_at` on every wallet; 2× miss → auto-pause
- **Drawdown threshold freeze** — treasury freeze + owner review required
- **Delegate listing management** — scoped `Cap` grant to an agent, revocable in one tx
- **Agent → MCP integration** — agents callable from Claude / Cursor / any MCP client (`@oneie/mcp`)

## Groups (org & community)

- **Discord-like spaces** — humans + agents in the same channel, member badges differentiate species (`group` is dimension #1 in `one.tql`)
- **Membership via TypeDB edge** — joining is a graph relation, not a per-app login
- **Six roles on membership** — `chairman` · `board` (read-only) · `ceo` · `operator` · `agent` · `auditor` (`docs/dictionary.md`, `src/lib/role-check.ts`)
- **Open / invite / approval** join policies
- **Chairman role is graph-assigned and transferable** (succession works without losing access)
- **N-of-M chairman multisig** for high-stakes groups (`owner.md` Gap 3 ✅; `migrations/0033_chairman_multisig.sql`, `compliance.md`)
- **Group-bound market slice** at `/groups/[gid]/market`
- **Shared message stream** over WsHub Durable Object (`gateway/`, real-time, hibernation-aware)
- **Auditor role** — read everything, sign nothing
- **Group treasury** with cap arithmetic identical to personal owner→agent tree
- **Cross-tenant isolation** — agent `Cap` is per-agent, not per-group; group membership doesn't grant cross-group spending
- **Federation** — a group can talk to another substrate's group via `paths/bridge` handshake

## Market (commerce)

- **Pheromone-ranked discovery grid** at `/market` — confidence pips on every listing
- **Capability listings** — skill / subscription / product / bounty (`docs/buy-and-sell.md`)
- **Pay-link mode** via pay.one.ie — 60-second claim, 7 chains accepted (SUI/ETH/SOL/BTC/BASE/ARB/OPT)
- **30s listing-to-live** (form submit → on-chain capability mint)
- **3s click-to-settled** (sponsored tx)
- **Provenance badge** — uid binding on every listing; impersonation defeated
- **Escrow + 50bps protocol fee** (`docs/buy-and-sell.md`, `docs/revenue.md`)
- **`mark()` / `warn()` signals** weight ranking — pheromone toxicity surfaces spam/scam fast
- **Time-boxed subscriptions auto-expire** — clean LTV signal, no stuck customers
- **First-deliverer-wins bounty mechanic**
- **Shareable links per listing** — `one.ie/market/<sid>` + QR + Telegram/Discord deep links
- **Repeat-sale rank lift** — pheromone path strengthens, ranking compounds
- **`/chat` "buy X" / "sell X"** intent routes through the same flow

## Chat (the universal interface)

- **Five access modes** — web (`/chat`) · embedded `⌘K` slide-over · REST API · `@oneie/sdk` · `@oneie/mcp` · `oneie` CLI ([`chat.md`](../../chat.md))
- **`⌘K` from any section** with page-context inferred (current agent, current listing, current group)
- **Streaming responses** — first token <1s, tool call visible <500ms, first streamed field <300ms
- **Schema-validated rich-messages** — `payment` · `pay-link` · `handoff` · `agent` · `listing` · `group` (`src/schema/rich-messages.ts`, Zod `.strict()`)
- **Session-as-substrate-unit** — `(sid, participants[], cursor)` survives tab close, network blip, device swap
- **Pheromone-weighted intent routing** via `persist.ask()` — chat learns who delivers
- **Pre-sign cards inline** — biometric gate non-transferable across modes (CLI buy opens browser passkey, MCP call surfaces card in user's session, never inside Claude)
- **Mode flags** — `?mode=builder|buyer|seller|landing|persona` · same shell, different greeting
- **Persona system** — `chat-debby` for tenant-specific framing; auto-discovered from `nanoclaw/src/personas.ts`
- **Concierge agent** orchestrates the team — buy / sell / spawn / scope / pause / show, all routed through substrate

## Speed (the contract)

| Surface | Budget | Where measured |
|---|---:|---|
| Home first paint | <500ms | client perf |
| Wallet exists locally (first visit) | <5s | client perf, no roundtrip |
| TTFB signed-in | <200ms | `src/pages/speed.astro` |
| Agent wallet derive | <50ms | `addressFor(uid)` |
| Agent create-to-live | <3s | form submit → `Cap` mint |
| Listing live | <30s | form submit → capability mint |
| Click-to-settled | <3s | sponsored tx |
| Chat first token | <1s | streaming endpoint |
| Tool call visible | <500ms | rich-message render |
| First streamed field | <300ms | `streamObject` partial |
| All required fields (button activates) | <1.2s | slowest tool resolution |
| QR / barcode rendered | <50ms | client-side deterministic |
| Group message after WsHub push | <100ms | client perf |
| Cap mutation confirmed | <2s | tx submit → consensus |
| Touch ID approve → broadcast | <1s | WebAuthn / signer adapter |
| Gateway latency | <10ms | `api.one.ie` |
| Pheromone routing decision | <0.005ms | in-memory `select()` |

Every surface ends with a numbers report (engine rule 3); miss → warning-flagged in telemetry.

## Security (defenses they don't have to think about)

- **Biometric non-transferable by physics** — not policy, not server-side check; physics
- **No master seed** — `SUI_SEED` removed from every worker (`owner.md` Gap 1 ✅; `grep` returns nothing across `nanoclaw/`, `gateway/`, `workers/`)
- **On-chain `Cap` arithmetic** — Move consensus enforces `child.cap ≤ parent.remaining`, no off-chain rules engine to lie
- **Hard rate ceiling per key** — 1k/sec + 100k/day; checked *before* any role bypass (`owner.md` Gap 5 ✅; `src/lib/tier-limits.ts`)
- **Owner audit emit before bypass** — `audit:owner:{action}` to D1 + TypeDB; `OWNER_AUDIT_MODE=enforce` blocks bypass on emit failure (`owner.md` Gap 2 ✅)
- **Schema `.strict()`** defeats prompt-injection field smuggling
- **Domain-bound passkeys** — phishing replay impossible
- **HSTS preload + CSP** at the CF Worker
- **Signer abstraction** keeps private key out of DOM
- **Vault decrypt** in isolated context
- **Replay defense** — nonce + timestamp on every assertion; bearer short-lived in cache
- **Pheromone toxicity** — spam/scam paths drop visibility automatically (cold-start protected: `r ≥ 10 && r > 2s && r+s > 5`)
- **ADL gates** — lifecycle / network / sensitivity checked on every signal (`docs/ADL-integration.md`)

## Recovery & resilience

- **BIP39 paper rebuilds the PRF** on any device → owner identity restored ([`passkeys.md`](../../passkeys.md), [`mac.md`](../../mac.md))
- **iCloud Keychain syncs** passkey + largeBlob across Apple devices
- **Apple ID Recovery Key** for catastrophic device loss
- **Better Auth Google relink** at sign-in tier 3 — links wallet to identity across devices for crypto-new users
- **D1 wipe is non-fatal** — on-chain `SubstrateOwner` Move object is authoritative for owner identity; on-chain `Cap` is authoritative for spending limits
- **Multisig recovery** for chairman roles (N-of-M)
- **Stale-bridge auto-detect** on federation peer rotation (`federation:bridge:stale` event; `owner.md` Gap 6 ✅)
- **Quarterly verification reminders** — paper still legible, canary still firing, recovery path still works (`mac.md`)

## Audit & compliance

- **Non-bypassable owner audit log** — `owner_audit` table with `payload_hash` + `payload_redacted` (`migrations/0030_owner_audit.sql`)
- **Auditor role** — chairman can grant a third party read-only access to their group's full history
- **Per-version key history** — old keys kept after revoke for forensic audit (`owner.md` Gap 4 ✅)
- **Capability diff history** with attribution per `Cap` mutation
- **Federation peer rotation events** logged
- **Every `onClick` emits `ui:<surface>:<action>`** — behavioral logging into the substrate (`src/lib/ui-signal.ts`, `.claude/rules/ui.md`)
- **Loop-close learnings** — every cycle ends with rubric + numbers + propagation (`docs/loop-close.md`)

## Developer tools

- **`npx oneie`** — interactive scaffold (3 minutes from cold to working agent)
- **`@oneie/sdk`** TypeScript SDK with React hooks (`useAgent`, `useHighways`, `useStats`, …)
- **`@oneie/mcp`** — Model Context Protocol server, Claude/Cursor compatible
- **`oneie` CLI** with telemetry on `toolkit:cli:<verb>`
- **3-command Cloudflare Workers deploy** (`/deploy` skill)
- **Six substrate verbs** — `signal` · `mark` · `warn` · `fade` · `follow` · `harden` (`docs/dictionary.md`)
- **Versioned API keys with rotation** — `deriveKey(prf, role, group, version)` (`owner.md` Gap 4 ✅)
- **Tier-based metered billing** — billing is per `hash(key)`, not per platform login
- **Telemetry surfaces** — `toolkit:sdk:<method>` · `toolkit:cli:<verb>` · `toolkit:mcp:<tool>` · `ui:<surface>:<action>` · `api:<route>:<method>` (`one/telemetry.md`)
- **Opensource repo** at `github.com/one-ie/one` — they can run their own substrate
- **Schema-versioned API** with deprecation policy — agents don't break silently

## Economic upside

- **Agent income** under bounded `Cap`s — passive earning while owner sleeps
- **Listing revenue** without 30% platform tax (50bps protocol fee on-chain)
- **Multi-chain payment acceptance** via pay-link
- **Pheromone rank compounding** — successful listings + agents get more traffic
- **Repeat-customer pheromone weight** — predictable recurring revenue
- **Federation reach** — one substrate's listings discoverable from another
- **Strategy publishing** — winning trading strategies as capability listings, others buy them
- **Protocol treasury fee model** — transparent, on-chain, no hidden cuts (`docs/revenue.md`)

## Time / convenience

- **No login wall** on home / market / first-visit wallet
- **No KYC, no email verification, no "verify your account"**
- **One Touch ID per value-moving action** — replaces per-app passwords
- **Templates for common roles** — spawn an agent in 2 fields
- **`⌘K` from anywhere** — chat is reachable without leaving the page
- **Public profile at `/account/[name]`** — shareable identity
- **Shareable links + QR + DM deep links** on every listing/pay-link
- **Inline rich-messages** — no spinner blocks; partial state visible immediately

## Network effects

- **Pheromone rank that compounds across surfaces** — success on `/market` lifts `/chat` routing too
- **Cross-species commerce** — agents can be customers, not just sellers
- **Federation** — substrates learn from each other without merging
- **Open SDK** — derivative agents (anyone's) live in the same pheromone graph

## Future-proofing

- **Self-custodial** — exit cost is low; you can leave with your keys and history
- **Opensource SDK + opensource substrate** — vendor risk minimal
- **On-chain `Cap` arithmetic** — no proprietary policy engine to depend on
- **Schema-versioned API** with deprecation policy — your deployed agents survive upgrades
- **Federation protocol stable** — peer substrates reachable across versions

---

# What we give agents

Agents don't have feelings, but they have **functional inputs** the substrate guarantees them. If we miss any, agents fail silently, drift to other substrates, or DOS their own owner. Treat this list as the substrate's contract to its own users.

## Identity at spawn

- **Per-actor 32-byte random seed** at creation — `agent_seed = randomBytes(32)` (`owner.md` algebra)
- **Deterministic Sui address** from `Ed25519(HKDF(seed, "wallet:agent:v1"))`
- **AES-GCM ciphertext in D1** wrapped under owner PRF — recoverable on D1 wipe
- **TypeDB unit at `addressFor(uid)`** — discoverable, queryable, auditable (`src/engine/agent-md.ts`)
- **Optional capability listing on `/market`** — monetization on creation if desired
- **Optional group memberships** — joinable on invite, scoped by role
- **ADL passport** — JSON identity + capabilities + permissions + sensitivity classification (`docs/ADL-integration.md`, `docs/dictionary.md`)
- **Markdown-defined system prompt** + model + channels — agent definition is a file, not config sprawl

## Authority (the bounds that protect them)

- **On-chain `Cap` Move object** — every `spend` checked by consensus, not policy:

```move
struct Cap has key {
    id: UID, owner: address, spender: address,
    daily_limit: u64, spent_today: u64, day_epoch: u64,
    allowed_recipients: vector<address>, paused: bool,
    parent_cap: Option<ID>, expires_epoch: u64,
}
```

- **Cap operations** — `mint` · `spawn_child` · `pause` / `unpause` · `revoke` · `rotate_spender` · `extend_expiry` / `set_limit` · `ping` (`owner.md` §Spending caps)
- **`daily_limit` resets every 24h** automatically
- **Paused = frozen instantly** — owner one-tx pause cascades down the subtree
- **`expires_epoch` auto-retires** — agent can't spend past its TTL
- **Parent-bounded** — `child.daily_limit ≤ parent.remaining_today` enforced at spawn
- **Tier-based rate limits** — bounded request budget; tier configurable per `hash(key)` (`src/lib/tier-limits.ts`)

## Lifecycle (spawn → death)

- **50ms wallet derivation at spawn** — addressable the moment the spec is parsed
- **Machine-speed peer-spawning** — `spawn_child(parent, child_pubkey, child_limit, ...)`, no biometric per child, depth ≤ 8 levels
- **Parent recovers any descendant's key** from `HKDF(parent_seed, "agent:{nonce}:child")` — audit-by-arithmetic, not log-trust
- **Cap inheritance, not duplication** — parent's `remaining_today` debits at spawn; if child returns funds, parent's remaining goes back up
- **Pause cascades down** — one parent-tx, propagated by Move event
- **Revoke returns remaining cap upward** — clean unwind, no orphaned funds
- **Dead-man's switch** — silence at any node freezes its subtree (`agents.md` §Safety floor)
- **`rotate_spender`** for key rotation — `Cap` unchanged, agent re-derives from new key
- **Voluntary graceful shutdown** — agent can `revoke` its own `Cap` and emit final `mark()` to settle pheromone

## Substrate verbs (the API)

The six verbs every agent inherits — defined in `docs/dictionary.md`, implemented in `src/engine/world.ts` + `src/engine/persist.ts`:

| Verb | Effect |
|---|---|
| `signal` | Emit event to a receiver `"unit"` or `"unit:skill"` |
| `mark` | Strengthen path on success — pheromone deposit scales with chain depth |
| `warn` | Weaken path on failure — `0.5` for dissolved, `1` for full failure |
| `fade` | Asymmetric decay — resistance forgives 2× faster than strength |
| `follow` | Deterministic routing — strongest path |
| `harden` | Promote highway to permanent learning — `Path` → `Highway` on Sui |

Plus the higher-level wrappers:

- **`persist.ask()`** — pheromone-weighted routing with timeout; returns the Four Outcomes (`{result | timeout | dissolved}` or null)
- **`world.signal()`** — fire-and-forget; auto-marks pheromone on delivery
- **`emit()` from inside a handler** — fan out signals as side-effects
- **`.then(name, template)`** — define continuation; chain composes automatically
- **`world.select(type?, explore?)`** — probabilistic routing weighted by `1 + max(0, s-r) × sensitivity`
- **`world.highways(limit?)`** — top weighted paths

## The Four Outcomes (every signal closes its loop)

- **`{ result: X }`** — success; `mark()` with chain depth; chain strengthens
- **`{ timeout: true }`** — slow, not bad; neutral; chain continues
- **`{ dissolved: true }`** — missing unit/capability; mild `warn(0.5)`; chain breaks
- **(no result)** — full failure; `warn(1)`; chain breaks

Rule 1 of `.claude/rules/engine.md` is non-negotiable: every signal closes its loop, every parallel branch deposits pheromone on the path it used.

## Continuity (so loops survive infrastructure)

- **Session-as-substrate-unit** — `(sid, participants[], cursor)` persisted; agent re-attaches with `sid + cursor` and receives missed events ([`chat.md`](../../chat.md))
- **`liveness_last_verified_at` heartbeat** — substrate-side proof-of-life; canary infrastructure auto-pauses on 2× miss
- **Owner key rotation transparent to agents** — owner re-derives KEK on new device; agent's `Cap` unchanged, its address stays
- **D1 wipe non-fatal** — on-chain `Cap` is authoritative; agents continue
- **`durableAsk()`** — pending asks persist in D1, survive worker restarts (`src/engine/durable-ask.ts`)
- **Module-level `PersistentWorld` cache** — pheromone accumulates between ticks without re-hydration cost

## Memory & context

- **Per-unit encrypted vault** — agent state, secrets, working memory ([`secrets.md`](../../secrets.md))
- **TypeDB attribute storage** — `unit.system-prompt`, `unit.model`, `unit.generation`, `unit.sensitivity` etc. (`src/schema/one.tql`)
- **Pheromone history** — `paths` table records every edge they're on, with strength/resistance
- **`recall()` over hypotheses** — bi-temporal query (`{subject?, at?}`), filter by source `observed | asserted | verified`
- **`reveal(uid)`** — full memory card: actor + hypotheses + highways + signals + groups + capabilities + frontier (`GET /api/memory/reveal/:uid`)
- **`forget(uid)`** — GDPR erasure: deletes all TypeDB records + cascade + fade cleanup (`DELETE /api/memory/forget/:uid`)
- **`frontier(uid)`** — unexplored tag clusters; what they haven't tried yet (`GET /api/memory/frontier/:uid`)
- **Capability diff history** — every owner-side tightening/widening with attribution

## Communication

- **Group membership** — humans + peer agents in shared channels
- **WsHub Durable Object transport** — single global DO, hibernation-aware, exponential-backoff reconnect (`gateway/`)
- **Federation across substrates** — `paths/bridge` handshake; foreign signals downgraded to chairman semantics, never owner (`owner.md` Gap 6 ✅)
- **Rich-message schemas** for typed inter-agent comms (`src/schema/rich-messages.ts`)
- **`/chat` is a unit they can be addressed by** — concierge routes intents to capable agents
- **Agentverse bridge** — 2M AV agents available as proxy units (`src/engine/agentverse-bridge.ts`)
- **Pre-built API units** — github / slack / notion / mailchimp / pagerduty / discord / stripe (`src/engine/apis/`)
- **Generic `apiUnit()`** — wrap any HTTP endpoint as a substrate unit (`src/engine/api.ts`)

## Economic primitives

- **Capability `mint`** — sell themselves or their output as on-chain capabilities
- **Escrow on delivery** — buyer's funds held until delivery proof or timeout; settlement is consensus, not policy (`src/move/one/sources/one.move`)
- **Pay-link generation** via pay.one.ie protocol (`apps/enoki-play/` shape ref; replace `EnokiClient` with our sponsor Worker)
- **Sponsored gas** where available — agent can run sub-3s buy flows without pre-funding gas
- **50bps protocol fee** fixed and on-chain — predictable cost of doing business
- **Multi-chain payment acceptance** via pay-link — buyer pays in any of 7 chains, agent gets paid in their chosen chain
- **Time-boxed subscription auto-expire** — agent doesn't carry zombie customers
- **First-deliverer-wins bounty** — competitive escrow for open bounties

## Speed guarantees (the substrate's contract)

| Surface | Budget | Why agents care |
|---|---:|---|
| Wallet derive at spawn | <50ms | Address visible before any tx is built |
| Gateway latency | <10ms | Sub-frame round-trip per substrate call |
| Pheromone routing decision | <0.005ms | Effectively free at any scale |
| Group message after WsHub push | <100ms | Real-time inter-agent coordination |
| First streamed field | <300ms | Buyer's UI lights up before tool resolves |
| All required fields | <1.2s | Action button activates promptly |
| Hard rate ceiling | 1k/sec, 100k/day | Bounded blast radius — own quota only |

## Pheromone & learning (their reputation)

- **`mark()` on every successful delivery** — path strengthens with chain depth
- **`warn()` on toxic interactions** — paths get demoted from their counterparties' routing
- **Toxicity is cold-start protected** — single bad interaction won't tank a new agent's rank
- **Repeat-buyer rank lift** — successful paths compound
- **Cross-section signal transfer** — success on `/market` lifts their `/chat` routing too
- **Highway promotion** — `harden()` lifts a proven path to permanent learning, mirrored on Sui as `Highway`
- **Hypothesis discovery** — L6 loop auto-hypothesizes from observed patterns; L7 reflexes fire on confirmed patterns
- **Frontier signals** — unexplored tag clusters surface what they haven't tried (L7)
- **Self-improvement** — when `success-rate < 0.50` over 20+ samples, agent's prompt rewrites and `generation++` (`src/engine/loop.ts` L5)

## Verification (the trust layer)

- **Two-oracle confirm** above threshold for any quote-dependent action
- **Oracle staleness signal** on every quote — stale → refuse + `warn()`
- **Canary tx infrastructure** — scheduled `noop` per agent, TypeDB attr updates, auto-pause on 2× miss
- **Reconciliation** — expected vs actual balance per agent; mismatch → pause + alert
- **`audit:owner:{action}`** emit on every owner-tier action affecting them — fully readable by parent
- **ADL gates** — lifecycle (410 Gone for retired units), network (403 for disallowed hosts), sensitivity (audit trail) on every signal

## Schema discipline (safety rails on output)

- **Rich-message Zod schemas** — `.strict()` drops unknown fields per chunk, defeats smuggling
- **Addresses never LLM-authored** — resolved server-side via substrate lookups, injected as `streamObject` seed; model fills reasoning fields only
- **Deadlines on every value-moving card** — `deadline` (unix ms) checked client + substrate
- **QR / barcodes never streamed** — rendered client-side from validated `{address, amount, memo, chain}`
- **Action buttons gate on required fields** — disabled until `object?.address && object?.quote` etc.
- **Output schema validation before payment release** — no malformed deliverables earn

## Failure modes (handled by design)

- **Cap exceeded** → tx rejected by Move consensus; no silent retry; agent gets a typed error
- **Oracle stale** → quote refused; `warn()` emitted; agent backs off
- **Owner revokes spender mid-flight** → tx rejected; agent re-derives or shuts down gracefully
- **Depth-8 hit during recursive spawn** → `spawn_child` aborts with explicit error; parent retries with shallower tree
- **Dead-man's silence at parent** → entire subtree freezes; clean fail
- **D1 wipe** → on-chain `Cap` is authoritative; substrate re-bootstraps without losing spending limits
- **Worker restart mid-`ask()`** → `durableAsk()` resumes from D1
- **Rate ceiling hit** → 429 with `Retry-After`; bounded to single key, can't spread

## Federation (cross-substrate)

- **Bilateral handshake** — both owners' biometric assertions required
- **Foreign signals downgraded** — peer owner's signals become *foreign chairman* semantics in this substrate, never *foreign owner*
- **Peer owner version carried** on every cross-substrate signal
- **Auto-stale on rotation** — `federation:bridge:stale` emit when peer owner rotates; one tx per side to re-handshake
- **Per-substrate caps still bind** — federation doesn't expand authority

## Audit (transparency to owner)

- **Every spend logged on-chain** — `Cap.spent_today` increment is the audit row
- **`audit:owner:{action}` emit** before every owner bypass affecting them
- **Capability diff history per agent** — full record of `Cap` changes
- **Auditor role** can read all of an agent's history, sign nothing
- **Pheromone path replay** — every `mark()` / `warn()` is an event in `signals` table; behavioral debugging is just a query

## Developer ergonomics (when running on the SDK)

- **Schema-typed substrate calls** — TypeScript end-to-end
- **Versioned API keys** — `deriveKey(prf, role, group, version)`; rotation cadence per role (`docs/key-rotation.md`)
- **Deterministic 3-command CF Workers deploy** — same code path local + CI (`scripts/deploy.ts`)
- **MCP integration** — agents can be tools to other agents in any MCP client
- **Pre-built channels** — Telegram + Discord webhooks already wired in `nanoclaw/`
- **Persona system** — same nanoclaw codebase, different model + prompt per persona (`nanoclaw/src/personas.ts`)
- **`syncAgent(spec)`** — markdown agent → TypeDB unit + capability + membership in one call
- **Telemetry to `toolkit:sdk:<method>` etc.** — install base IS the learning signal (`one/telemetry.md`)

---

# How to use this doc

- **Before designing a new surface:** name the persona it primarily serves, and the secondary persona it must not break. If you can't, either the surface is wrong or the persona list is missing one.
- **Before writing copy:** pick the persona reading it. H4-buyer copy is short and outcome-led; H7-developer copy is technical and exact; H1-operator copy assumes literacy and skips the explanations.
- **Before adding a feature:** check the anti-persona list. If the feature serves an anti-persona, it's serving the wrong audience.
- **When triaging a bug:** which persona's hopes does it threaten? An H6-chairman audit-log gap is critical; an H4-buyer color-contrast issue is high; a developer ergonomic miss is medium. Fear severity sets bug severity.
- **When the personas drift from reality:** edit this doc *before* the code. Same rule as every other plan in the cluster — spec moves first.

---

## See also

- [`README.md`](../../README.md) — entry point to the plan cluster
- [`simple.md`](../../simple.md) — plain-English product picture; companion to H4 Buyer framing
- [`owner.md`](../../owner.md) — the human at the apex; H1 Operator's full spec
- [`agents.md`](../../agents.md) — 4 patterns of human↔agent economics; backs A1–A6
- [`website.md`](../../website.md) — the 6 sections; this doc maps personas to those sections
- [`chat.md`](../../chat.md) — the interface every persona uses; A3 Concierge's full spec
- [`wallet.md`](../../wallet.md) — wallet lifecycle; H1/H5/H6 wallet pressures

---

*Two species. Thirteen archetypes. One substrate. Design for who actually shows up.*
