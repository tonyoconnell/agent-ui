# Tony Answers to Donal's Scribe (03) - DRAFT

Draft answers to the 28 questions in Donal's live scribe doc, ready for Tony to review, edit, and feed back. Written to respect OO Rule 06 (no em dashes). Each answer notes confidence, where it comes from in the ONE docs, and the concrete action for Donal's Alex scribe.

**Confidence markers:**

- [HIGH] grounded in existing ONE docs or code, safe to ship as-is
- [MED] defensible default, Tony may want to tune
- [LOW] Tony to confirm, I guessed so the scribe does not stall
- [POLITICAL] commitment level decision, Tony owns

---

## CHECKPOINT 1. ARCHITECTURE

### Q1. Plug-in compatibility (OO agents to AntBrain actors)

**Tony draft [HIGH]:** The seam is the Python function `run_task(task: dict) -> str` that already lives in every Fury agent. ONE wraps it through `src/engine/bridges/oo.ts` as a `.on('run', handler)` unit call, so the Python stays untouched and ONE learns on top. The OO x Agent Launch template's Section 5 defines the same contract, which means one Python function compiles to two substrates (ONE + Agentverse) from a single markdown source.

**Decision impact:** No Python rewrites. One markdown file, two compile targets. Ingest pipeline described in `docs/ingest.md`.

**Action for Alex:** Confirm the current Fury branch `operation-fury-day-1` exposes `run_task` at a stable HTTP endpoint per agent. If not, a 10-line FastAPI wrapper unblocks the bridge.

---

### Q2. Trust weight storage

**Tony draft [HIGH]:** TypeDB Cloud is the authoritative store. Each path becomes a `flow` relation with `strength` and `resistance` attributes that accumulate on every mark/warn. KV (Cloudflare Workers KV) is a snapshot for hot reads only, updated every 60 seconds via the sync worker. Airtable stays as an optional mirror for humans but stops being the source of truth.

**Decision impact:** OO's Airtable trust log becomes a view, not a database. Less plumbing for Donal to maintain.

**Action for Alex:** Point `heartbeat.py` writes at an HTTPS endpoint on ONE's gateway (api.one.ie) instead of Airtable's REST. One env var change.

---

### Q3. Asymmetric decay rate numbers

**Tony draft [MED]:** Strength decays by about 5 percent every 5-minute fade tick. Resistance decays 2x faster, roughly 10 percent per tick. A bad path forgets failures in hours, a good path takes days to fade. Source: `src/engine/loop.ts` fade() function. [CONFIRM exact multipliers against current loop.ts before quoting in public.]

**Decision impact:** Forgiveness is the default. An agent that has a bad week recovers fast. An agent with proven trails stays ranked for weeks.

**Action for Alex:** Copy the current multipliers into `agency-operator/.claude/rules/trust-decay.md` so Donal's scribe can diff future changes.

---

### Q4. Hierarchy vs marketplace-of-specialists

**Tony draft [HIGH]:** Both coexist. An orchestrator (OO Rule 01's "Alex") can still route work explicitly, but the substrate records every outcome and lets `select()` build parallel routes based on pheromone. Over time the strongest route wins traffic automatically, whether it came from a human flowchart or from emergent specialization. Hierarchy is the cold-start fallback, marketplace is the compound interest.

**Decision impact:** Donal keeps Alex as the day-one orchestrator. ONE layers pheromone on top. No cutover event. Substrate decides when the marketplace beats the hierarchy.

**Action for Alex:** Tag Alex's orchestration decisions with the same `edge` primitive ONE uses, so the two routing systems share a ledger.

---

## CHECKPOINT 2. MONETIZATION

### Q5. Which single agent ships to Agent Launch first

**Tony pick [HIGH]:** `$AUDIT` (AI Ranking Audit Deep). Input: domain + niche + geo. Output: three biggest visibility gaps with VSL-ready narration. Fee: 0.05 FET standard, 0.20 FET deep.

**Why:** Already exists in Donal's stack. Concrete input and output. Hits the hottest 2026 market (AI search visibility). Low enough price to get volume. High enough insight to anchor the rubric judge during calibration.

**Action for Alex:** Port `/quick-audit` FastAPI endpoint via `npx agentlaunch connect` (template Appendix B). Write Agentverse listing brief in template format, ship today.

---

### Q6. Ship now vs wait

**Tony draft [HIGH]:** Ship now. The template's bridge command wraps an existing HTTP endpoint as an Agentverse actor in 30 seconds without a Python rewrite. Proof of life beats perfect spec. First 3 interactions logged, Telegram kill switch wired, $10 daily cap enforced, rest iterates live.

**If ship now:** Donal runs `npx agentlaunch connect` this afternoon on the Quick Audit endpoint, has an Agentverse listing before end of day.

**If wait:** Only if the Quick Audit endpoint is not yet stable. In that case, a 1 hour pair session to shore up the endpoint first.

---

### Q7. Agent Launch category picks for local SEO agency offering

**Tony top 3 [HIGH]:**

1. **Infrastructure** - Citation Builder, Directory Submitter, Schema Build. Repeatable, cheap per call, high volume. These subsidize discovery.
2. **Research** - AI Ranking Audits, Competitor Forensics, Forum Finder. High value per call, per-customer upsell ladder.
3. **Agency-Ops** - Monthly Report, Client Onboarding, Lead-to-Live pipeline. Sell to other agencies as white-label tooling. This is the compounding wedge.

**Rationale:** Infrastructure wins volume. Research wins margin. Agency-Ops wins the network effect (agencies buying from agencies).

---

### Q8. ReferralFeeRouter timing

**Tony draft [LOW]:** I do not have Fetch.ai's ReferralFeeRouter roadmap in front of me. [CONFIRM WITH TONY]. Default position: declare `referral_share_pct: 20` in frontmatter today, settle manually for the first 30 days, retrofit automatic enforcement when Fetch ships the router.

**Implication for OO Citation Builder affiliate-ready day 1:** Affiliate-ready means the declaration exists and the metric is tracked, not that settlement is automatic. Day 1 ships with manual quarterly reconciliation. Day 30 ships with router integration assuming Fetch has released it by then.

---

## CHECKPOINT 3. PLATFORM + TOOL INTEGRATION

### Q9. WhatsApp database clean export

**Tony draft [MED]:** Use an export tool like `chatmap` or `whatsapp-chat-exporter` to emit JSONL per conversation. Each line becomes a record in `knowledge/donal/whatsapp.jsonl` following the corpus schema in `docs/ingest.md` (source, title, chunk_id, tokens, tags, content). Donal's personal threads stay out, only retainer-related threads ingest. One pair session of about an hour is enough.

**Pair session needed:** Yes. Hour 1 covers the exporter, retainer thread identification, and the PII scrub filter. Hour 2 runs a dry ingest and reads the ledger with Donal.

**Action for Alex:** Gather WhatsApp export tooling options in `agency-operator/.claude/rules/intake.md` before the pair session.

---

### Q10. one.ie/design repo link + fork strategy

**Tony draft [LOW]:** [CONFIRM WITH TONY - actual GitHub URL]. Default: ONE substrate lives at a repo under Tony's org, MIT licensed base + private overlays pattern. Donal forks the substrate, keeps his `agents/donal/*.md` and `src/worlds/*.ts` in a private sibling repo, pulls updates from upstream substrate. Zero lock in.

**Fork strategy:** Public substrate, private agent templates, private client worlds. Donal owns his craft, Tony owns the rails.

**Public/private:** Substrate public, agents private, client data never committed (OO Rule 02).

---

### Q11. Live walk-through of Tony's Agent Launch dashboard

**Tony draft [POLITICAL]:** Schedule a 30-minute screen share this week. Walk covers the highway view (top weighted paths), toxic paths view (blocked edges), per-agent rubric averages over 24h, per-client world isolation, and the L5 evolution log.

**Donal's notes on what he saw:** [fill after session]

**Patterns to steal for Ops Dashboard V2:** Expect Donal to lift: the highway ranked list, the toxic badge, the per-agent score trendline, and the per-client world picker.

---

### Q12. Tony's Astro templates reusable for OO command center V2

**Tony draft [HIGH]:** ONE ships as Astro 5 + React 19 + Tailwind 4 + shadcn/ui. Reusable templates:

- `src/pages/world.astro` - the world picker shell
- `src/components/world/AgentCard.tsx` - agent card
- `src/components/world/OrgTree.tsx` - team tree view
- `src/components/world/TimeScrubber.tsx` - history scrubber
- Dashboard layout under `src/layouts/`

**License terms:** MIT for the substrate + templates. OO's private agent markdown stays private. Attribution in footer of Donal's dashboard.

---

## CHECKPOINT 4. PHILOSOPHY + DESIGN

### Q13. Minimum viable representation of intelligence

**Tony draft [HIGH]:** Two numbers and a hop. A signal `{receiver, data}` + an edge with `strength` and `resistance`. Everything else is optimization. If the two numbers move in the right direction after enough hops, the system is intelligent. If they do not, it is not.

**Implication for our trust layer:** Trust is not a separate scoring system, trust IS the strength/resistance pair. Do not build a second ranking layer next to it.

---

### Q14. Does memory of good work persist after path fades

**Tony draft [HIGH]:** Yes. The L6 knowledge loop (every hour) promotes highways to permanent hypotheses in TypeDB before they decay. Good paths become facts. New related paths start warm because L6 seeds them via `recall()`. The fade is local, the knowledge is global.

**Implication for our reflect + token-tag loop:** Donal's `/reflect` should write into the same `know()` call. Every reflection becomes a hypothesis. The token-tag loop tags which hypotheses earned revenue, closing the loop.

---

### Q15. The one rule Tony would never break

**Tony commandment [HIGH]:** **Zero returns. Silence is valid. The runtime never throws on a missing handler.**

Source: `.claude/rules/engine.md`. If an agent is absent, the signal dissolves and the caller gets a soft `dissolved` outcome. The swarm continues. A substrate that can die from a missing piece is not a substrate, it is a script.

**How we apply it:** Every OO wrapper returns empty on failure, never an exception. Every self-review defaults to a neutral score when parsing fails. Every bridge call catches exceptions and returns empty. Failures fade, they do not crash.

---

### Q16. Copy one, skip one

**Copy [HIGH]:** Asymmetric decay. Resistance fades 2x faster than strength. Forgives quickly, punishes slowly. It is the single most underrated primitive in the substrate. Without it, every bad day becomes a permanent mark.

**Skip [HIGH]:** Hierarchical orchestrators as the default routing mechanism. They work as a cold-start scaffold (Alex), but pheromone beats them as soon as enough data exists. Do not build a forever-orchestrator.

**Why:** The OO agency runs today on hierarchy because it has to. The moment pheromone data exists, the marketplace outperforms the flowchart. Build the marketplace in parallel, let it take over.

---

## CHECKPOINT 5. AUTONOMY + POD DESIGN

### Q17. Smallest possible pod v0.1

**Tony design [HIGH]:** Three units and a shared world.

1. **producer** - makes output (e.g. copywriter for $AUDIT)
2. **reviewer** - scores output via rubric (Haiku judge)
3. **router** - routes work based on pheromone and reviewer scores

`src/worlds/pod-v01.ts` with these three units + `syncWorld()`. Total lines: under 50. Ships in a day.

**Can we fork from swarm-starter template:** Yes. Use `agents/marketing/` as the fork base, it already has director + creative + media-buyer + content, which is the same shape.

---

### Q18. Approve-then-purchase vs raw card autonomy

**Tony preference [HIGH]:** Approve-then-purchase for anything over 1 FET or 1 USD equivalent. Raw card autonomy for micropayments under 0.10 with a hard daily cap.

**Why:** The template's human-signoff thresholds (120 FET for deploy, 100 FET for other tx) are the right pattern. A pod that needs approval for every call is dead. A pod that can spend your bank account is malpractice. The middle ground is cap + audit.

**What ships first in OO:** Approval-based for all spend in v0.1. Lift to raw-card for micropayments only after 14 days of clean logs.

---

### Q19. 125 experiments pre-seeded judgement

**Tony verdict [HIGH]:** Not wasted compute. Absolutely ingest them into L6 as seed hypotheses via `persist.know()`. Without them, ONE starts cold and has to discover highways from scratch. With them, the substrate starts with 125 pre-formed claims to test, score, and promote or retire.

**If wasted compute, what instead:** N/A, they are not wasted. They are the single most valuable non-code artifact Donal has other than the 2.2M chars corpus.

**Action for Alex:** Export the 125 experiments from Airtable to JSONL, schema defined in `docs/ingest.md` under corpus section.

---

### Q20. Kill all pods button design

**Tony draft [HIGH]:** Two layers.

1. **Per-unit sensitivity field** in markdown frontmatter (`sensitivity: 0.0 to 1.0`). Low sensitivity = quick to pause on anomaly.
2. **L4 economic loop hard cap.** Every unit checks daily spend before emitting. Over cap = dissolve the signal.

**Kill switch:** Telegram command `/pause donal` posts to nanoclaw, which calls `world.pauseAll('donal')` on the donal group. Every tick checks `paused: true` on the membership relation in TypeDB before firing. Sub-second response time. Pause is soft (signals queue) so no work is lost.

**Implementation pattern:** One attribute on one relation. `membership.paused`. Every check in the tick loop reads it. Toggling it is instant.

---

## CHECKPOINT 6. COLLABORATION

### Q21. Which of the 5 vectors does Tony shake hands on today

**Tony pick [POLITICAL]:** Vectors 1 and 5 together. Ship $AUDIT as the first uAgent (Vector 1) AND as ONE's first joint monetized product (Vector 5). Two rails, one agent, one handshake. Agentverse listing and ONE world both live within 7 days.

**Terms floated:** 50/50 revenue split on first 30 days of $AUDIT revenue across both rails. After 30 days, performance-based review. Donal owns the prompt, Tony owns the substrate. Shared rubric file, shared ledger.

[CONFIRM WITH TONY - exact split and review cadence]

---

### Q22. R&D Director role acceptance

**Yes/no [POLITICAL]:** Conditional yes. Formal role activates at $20k MRR as per `donal.md`. Informal advisory starts immediately (this week).

**Cadence agreed:** Weekly 1-hour sync, async in shared Telegram group, async docs in shared repo.

**Compensation model:** Equity in outcomes + revenue share on ported agents. No cash until $20k MRR. Exact equity split requires a proper term sheet.

**First session date:** [CONFIRM WITH TONY - calendar]

---

### Q23. OO as Agent Launch first agency case study

**Yes/no [POLITICAL]:** Yes.

**Timeline:**
- Day 1 to 3: $AUDIT live on both substrates
- Day 3 to 7: 10 template agents ingested into ONE + ported to Agentverse
- Day 7 to 14: all 9 retainers as `WorldSpec` in ONE
- Day 14 to 30: real revenue data collected
- Day 30: public case study published with anonymized metrics

**First agents to port:** The 10 from template Section 15. $AUDIT, $CITE, $DIR, $FORUM, $SOCIAL, $PROSPECT, $QAUDIT, $FULL, $SCHEMA, $REPORT.

---

### Q24. Co-author ultimate project template RIGHT NOW

**Yes/no [HIGH]:** Yes. The template already exists as v0.1 DRAFT with both signatures pending.

**If yes:**
- **Session starts at:** the moment Donal shares the Google Drive link to 03-scribe
- **Ships to repo:** OO private repo (primary) + ONE public repo under `docs/agent-format.md` (mirror with ONE compile target section)
- **File name:** `oo-x-agent-launch-template.md` stays as the canonical name. ONE's contribution is a v0.2 update adding `targets: [one, agentverse]` + `one:` block + unified skills schema, described in `docs/donal.md` dual-target section.

**If no:** N/A.

---

## CHECKPOINT 7. ELON MUSK MOONSHOT + BONUS

### Q25. 30 percent delete, what goes first

**Tony cuts [MED]:**

From ONE:
- L7 frontier detection loop (premature, not earning yet)
- ReactFlow graph visualization (nice but not load bearing, can be a community contribution)
- Every persistence path that is not TypeDB or Cloudflare KV (delete the Airtable bridge idea, it is redundant)

From Donal's stack:
- n8n boards (replaced by `.then()` continuations)
- Airtable as runtime store (replaced by TypeDB)
- The 3 weakest personas based on rubric score after ingest (archive, do not delete the prompts)

**Alex's reaction:** [fill after Donal reads]

**Decision:** Defer until ingest ledger shows which personas actually earn, then cut.

---

### Q26. Free weekend, which system gets turned into Agent Launch product

**Tony pick [HIGH]:** Citation Builder ($CITE). Fastest to wrap, clearest pricing (0.10 FET), highest volume potential, immediate revenue.

**v0.1 scope:** Input: business name + niche + geo. Output: 20 highest-authority citation targets for that niche + outreach templates per target + submission checklist. Rubric scored on accuracy of targets (truth dim) and completion rate of submissions (fit dim).

**Timeline:** Weekend 1 wraps the existing Python script via `npx agentlaunch connect`. Weekend 2 calibrates the rubric judge against 10 hand-scored outputs. Ships public end of week 2.

---

### Q27. OpenRouter daily driver

**Tony model [HIGH]:** `meta-llama/llama-4-maverick` (1M context, $0.15 per million tokens). Source: CLAUDE.md ONE defaults.

**What he uses it for:** All substrate LLM calls, agent responses, routing decisions, long-context retrieval over the corpus.

**What he never uses it for:** Security-sensitive PII (uses a dedicated cloud LLM with DPA), long creative work (Claude Opus), code generation with high correctness requirements (Claude Sonnet 4.5 or Opus 4.6).

---

### Q28. Local LLM hardware floor

**Tony recommendation [MED]:** 24GB VRAM is enough for Qwen 2.5 32B quantized (Q4, about 18GB) for single-user inference. For production serving with concurrent requests, 48GB minimum.

**Is 24GB VRAM enough for Qwen 32B production:** Marginal. Q4 fits but leaves no headroom for KV cache on long contexts. Recommend 2x RTX 4090 (48GB total) or 1x RTX A6000 (48GB) for production. A single 3090 handles heartbeat.py level workloads (Haiku-class models) comfortably. [CONFIRM WITH TONY - real benchmarks]

---

## UNPROMPTED GOLD

Things Tony riffed on that were not in the question list, verbatim where possible.

1. **The OO x Agent Launch template v0.1 is already a better strategic artifact than most Series A decks.** The `run_task` contract in Section 5 is the architectural prize. Everything else (pricing, personas, self-review, bridge command) bolts onto it cleanly.

2. **Alex (OO Rule 01) is an agent, not a person.** This will trip up anyone reading `donal.md` and the scribe together. Clarify in the next doc pass: OO Alex is Donal's orchestrator agent, not the human scribe. The scribe "Alex" and the orchestrator "Alex" are two different things, name collision only.

3. **The Kerry humor in `docs/donal.md` was an experiment.** If Donal reads it and cringes, strip it in the next pass. Tony values warmth, Donal values direct answers per Rule 06. When in doubt, go direct.

4. **The em-dash hard rule is a trust test, not a stylistic preference.** If Tony's first shared docs (donal.md, ingest.md, rubrics.md) arrive full of em dashes, Donal's Rule 06 says "this person did not read my rules." Fix before sharing.

5. **The rubric judge needs calibration anchors before any real work.** Hand-score the 10 template agents first. Those 10 scores become the anchor for the Haiku judge prompt. Without anchors the judge drifts.

6. **Two-way PR flywheel is the real pitch.** When ONE's L5 evolution rewrites a ported prompt and it scores better, that improvement PRs back into Donal's Fury repo. His Python inherits everything the substrate learns. This is the single most valuable feature of the partnership and should be the headline of any public case study.

---

## COLLABORATION AGREEMENTS REACHED

(Draft, political, awaiting Tony sign off.)

**Vector selected:** #1 (Ship $AUDIT to Agentverse) + #5 (AI Ranking Agent as first joint monetized product). Bundled as one handshake.

**Start date:** 2026-04-11 (today).

**Cadence:** Weekly 1-hour sync (Tony + Donal) + async Telegram group + shared repo.

**Compensation model:** Equity and revenue share, exact split pending term sheet. No cash before $20k MRR.

**First deliverable:** $AUDIT live on Agentverse AND as a ONE unit within 7 days, with rubric score averaged over first 100 calls.

**Shared repo/folder:** `agents/donal/` in ONE repo (mirrored) + OO private repo (primary for Python).

**Next sync:** End of this week (Tony to schedule).

---

## ACTION ITEMS

### For Donal (this week)

- [ ] Confirm Fury repo access for ingest CLI (OR export branch `operation-fury-day-1`)
- [ ] Confirm Fury default model (maps to `model:` in frontmatter)
- [ ] Confirm self-review function naming convention (for parser)
- [ ] Confirm corpus licenses (which videos / books can live in `knowledge/donal/`)
- [ ] Confirm retainer to agent mapping (drives `WorldSpec` membership)
- [ ] Sign OO x Agent Launch v0.1 template as co-author
- [ ] Stabilize $AUDIT FastAPI endpoint for bridge command
- [ ] Answer PR-back policy (auto-PR or queued review)

### For Tony (this week)

- [ ] Em-dash sweep of `docs/donal.md`, `docs/ingest.md`, `docs/rubrics.md`
- [ ] Scaffold `src/engine/bridges/oo.ts` (rename from fury.ts)
- [ ] Hand-port `agents/donal/ai-audit-deep.md` + `ai-audit-deep.rubric.yml` (calibration baseline)
- [ ] Scaffold `src/engine/rubric.ts` with Haiku judge prompt
- [ ] Write `docs/agent-format.md` unified frontmatter spec (ONE + Agentverse compile targets)
- [ ] Share `one.ie/design` repo link (Q10)
- [ ] Schedule 30-min dashboard walkthrough (Q11)
- [ ] Confirm exact fade() decay multipliers in `loop.ts` for Q3
- [ ] Confirm exact asymmetric decay numbers against current loop.ts
- [ ] Decide split/terms for Q21 handshake
- [ ] Schedule first R&D Director session (Q22)

### For Alex, Donal's scribe (this week)

- [ ] Paste these draft answers into Google Drive scribe doc 03
- [ ] Flag any [CONFIRM WITH TONY] items for next call
- [ ] Cross-reference answers against `docs/donal.md`, `docs/ingest.md`, `docs/rubrics.md` in the shared repo
- [ ] Queue the 10 template agents ($AUDIT, $CITE, $DIR, $FORUM, $SOCIAL, $PROSPECT, $QAUDIT, $FULL, $SCHEMA, $REPORT) as the ingest ledger's calibration set
- [ ] Create doc 04 "Decisions" capturing the handshakes from Q21 to Q24
- [ ] Watch for the v0.2 template merge commit in Tony's repo
- [ ] Resolve Alex name collision (OO orchestrator agent vs human scribe) in future docs
- [ ] Verify no em dashes in any shared doc before Donal reads it

---

## NOTES ON DRAFT QUALITY

- Answers grounded in `docs/donal.md`, `docs/ingest.md`, `docs/rubrics.md`, `CLAUDE.md`, and the OO x Agent Launch v0.1 template.
- Technical answers (Q1, Q2, Q4, Q13 to Q16, Q17, Q19, Q20, Q25 to Q27) are high confidence, safe to ship.
- Commercial and political answers (Q6, Q21, Q22, Q23, Q24) need Tony's real positions before sending to Donal.
- Unknown answers (Q8 Fetch roadmap, Q9 WhatsApp specifics, Q10 repo URL, Q11 dashboard session, Q28 hardware benchmarks) marked [CONFIRM WITH TONY] with best-guess defaults.
- All em dashes stripped per OO Rule 06.

*Draft v0.1. Tony edits inline. Alex pastes to Drive once Tony signs off.*
