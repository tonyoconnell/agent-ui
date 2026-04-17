---
title: TODO — Debby / Elevare
type: todo
version: 1.0.0
status: ACTIVE
created: 2026-04-16
plan: docs/PLAN-debby.md
total_tasks: 31
completed: 26
---

# TODO: Debby / Elevare

> **Principle:** Infrastructure lives in the world (nanoclaw shared router).
> Client config lives in agents + personas. All optimizations benefit all claws.

---

## W1: Infrastructure (Done)

- [x] Rename debbie → debby across codebase (21 files)
- [x] Deploy debby-claw worker + create D1 queue
- [x] Wire Telegram webhook (@Elevareworksbot)
- [x] Fix D1 missing tables (turn_meta, identity_links, claw_paths)
- [x] Create school org (14 agents: CEO, 4 Directors, student-facing, internal)
- [x] Switch all 24 agents to Llama 4 Maverick on Groq
- [x] Build `/chat-debby` web page
- [x] Add CORS to nanoclaw router (all workers)
- [x] Direct Groq routing via `resolveLLM()` (~2.4s vs 8-11s)
- [x] Deterministic sandwich on `/message` + `/webhook` (toxic → response → mark)

---

## W2: Student Memory (Done)

- [x] Create D1 `student_profiles` + `amara_sidecar` tables
- [x] Build `nanoclaw/src/units/student.ts` (getStudent, updateStudent, recordSidecar, studentContext)
- [x] Inject student memory into system prompt (both web + Telegram)
- [x] Canned answers (11 questions) with typing animation + D1 context sync via prefill
- [x] Fire-and-forget marks + D1 writes (don't block response)

---

## W3: Agent Wiring (Done)

Wire agents as active signal processors. Signals flow through them, back to students.
All wiring in `nanoclaw/src/` — shared by all claws.

### Amara Side-car Pipeline

- [x] After LLM response, detect if conversation is a tutoring session (tag: amara, practice, lesson)
- [x] Extract side-car from Amara's response: mistakes, new_vocab, praise, lesson_tag
- [x] Write to `amara_sidecar` table via `recordSidecar()`
- [x] Merge into `student_profiles` (rolling window: last 50 mistakes, 100 vocab, 20 strengths)

**Files:** `nanoclaw/src/units/student.ts`, `router.ts afterResponse()`

### Assessment Agent

- [x] Add per-turn hook: every 5 sessions, Assessment reads side-car for a student
- [x] Detect mastery: mistake category disappears from last 10 sessions → mark(student, skill_tag)
- [x] Detect struggle: same mistake in 5+ consecutive sessions → warn(student, skill_tag)
- [x] Weekly summary signal to `debby:edu` (Director of Education) — cron via scheduled()
- [x] Milestone detection → signal `debby:upsell` when student hits 20 sessions / mastery threshold

**Files:** `nanoclaw/src/units/assessment.ts`, `router.ts afterResponse()`

### Welcome Onboarding

- [x] On first message from new student, advance onboarding stage
- [x] Welcome sends stage-appropriate message:
  - Session 1: "Welcome to Elevare!" → stage: welcomed
  - Session 3: "Amara gets better the more you chat" → stage: first-session
  - Session 7: "First week done! Keep going" → stage: active
- [x] Update `student_profiles.onboarding_stage` at each step via direct D1 update

**Files:** `router.ts afterResponse()` (inline), `nanoclaw/src/lib/proactive.ts sendToStudent()`

### Proactive Agent Messages

- [x] Build `sendToStudent(env, uid, message)` — resolves uid → group_id → channel send
- [x] Build `broadcastToStudents(env, filter, message)` — batch messaging
- [x] Upsell agent: "You've completed 20 sessions — ready for Flex Nexus?" (in assessment.ts)
- [x] Support: "We noticed you haven't been back in 5 days" — churn detection in scheduled()
- [x] Assessment: mastery congratulation messages (in assessment.ts)

### Classifier

- [x] Added 5 tutoring tag patterns to classify-fallback.ts (education, practice, pronunciation, assessment, confidence)

**Files:** new `nanoclaw/src/lib/proactive.ts`, hooks in assessment.ts + welcome.ts

---

## W4: API + Observability

- [x] `GET /conversations` — list active conversations with metadata
- [x] `POST /conversations/:group/reply` — admin reply, pushes to student channel
- [x] `ClawAdmin` component — shared admin dashboard (configurable clawUrl + adminName)
- [x] Admin page at `/chat-debby-admin`
- [x] `GET /student/:uid` — read student profile (for Debby's admin view)
- [x] `GET /students` — list all students with session counts + stages
- [x] `GET /sidecar/:uid` — recent Amara session data for a student
- [x] `POST /student/:uid/update` — manually update student goals, level, pillar
- [x] Auth on admin endpoints — protected by existing API_KEY middleware

**Files:** router.ts (new routes), ClawAdmin.tsx, chat-debby-admin.astro

---

## Blocked on Debby

These need her input or action. We provide the infra, she does the work.

- [ ] Voice sample (5 min clean audio) → voice clone training
- [ ] Whop account signup → payment rail
- [ ] Site honesty fixes (WhatsApp number, Team page, Rise copy)
- [ ] `elevare.work` DNS confirmation → Donal configures
- [ ] Meta ad account creation (Donal's is banned)
- [ ] 20 warm contacts list → outreach messages

---

## Architecture Notes

```
SUBSTRATE (shared router.ts)              CLIENT (debby config)
────────────────────────────              ─────────────────────
resolveLLM()                              agents/debby/*.md
deterministic sandwich                    personas.ts → debby entry
student.ts (profiles + sidecar)           wrangler.debby.toml
assessment.ts (mastery detection)         debby-dropdowns.ts
welcome.ts (onboarding drip)             PLAN-debby.md / TODO-debby.md
proactive.ts (agent → student push)       ClawAdmin.tsx (admin dashboard)
identity.ts (cross-channel)               /conversations API
outcome.ts (pheromone deposit)
```

Every feature in the left column benefits ALL nanoclaw workers.
Debby is the first client to exercise them.

---

## Signal Tag Map

How starter question tags route to agents and seed pheromone:

| Tags | Primary Agent | Follow-on |
|------|--------------|-----------|
| `debby, lingua, professional, placement` | concierge | → enrollment |
| `debby, flex-nexus, interview, urgent` | enrollment | → amara (practice) |
| `debby, amara, practice, daily` | amara | → assessment (tracking) |
| `debby, amara, pronunciation, drill` | amara | → assessment (tracking) |
| `debby, amara, tutor, ai, education` | amara | → edu (quality review) |
| `debby, flex-nexus, intensive, premium` | enrollment | → welcome (onboard) |
| `debby, pricing, enrollment, sales` | enrollment | — |
| `debby, trial, amara, concierge` | concierge | → amara (free session) |
| `debby, about, founder, brand` | concierge | — |
| `debby, about, brand, differentiator` | concierge | — |
| `debby, about, location, online` | concierge | — |

As pheromone accumulates, the substrate learns which tags map to which agents.
New free-form questions get classified → tagged → routed by the learned paths.

---

## New Files Created (this session)

| File | Type | What |
|------|------|------|
| `nanoclaw/src/units/assessment.ts` | Substrate | Mastery/struggle detection from side-car data |
| `nanoclaw/src/units/welcome.ts` | Substrate | Onboarding message templates |
| `nanoclaw/src/lib/proactive.ts` | Substrate | sendToStudent() + broadcastToStudents() |
| `src/components/ai/ClawAdmin.tsx` | Substrate | Admin dashboard — configurable for any claw |
| `src/pages/chat-debby-admin.astro` | Client | Debby's admin page |
| `src/lib/chat/debby-dropdowns.ts` | Client | 11 starter questions with answers + tags |
| `src/components/ai/DebbyChat.tsx` | Client | Chat component with typing animation + prefill |

---

*Infra in the world. Agents in config. Students at the centre.*
