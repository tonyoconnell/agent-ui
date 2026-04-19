---
title: Wave1 Onboarding Vision
dimension: things
category: plans
tags: agent, ai, backend, frontend, groups, cycle, ontology
related_dimensions: connections, events, groups, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/wave1-onboarding-vision.md
  Purpose: Documents wave 1: creator onboarding - vision document
  Related dimensions: connections, events, groups, people
  For AI agents: Read this to understand wave1 onboarding vision.
---

# Wave 1: Creator Onboarding - Vision Document

**Version:** 1.0.0
**Status:** Ready for Implementation
**Last Updated:** 2025-11-01

---

## Executive Summary

Wave 1 Creator Onboarding is the **critical path foundation** for the ONE platform. This feature enables creators to register, verify their email, complete their profile, create a workspace, invite team members, connect wallets, and begin monetizing.

This is **NOT** a standalone feature - it's the prerequisite that unblocks all downstream work (monetization, agents, API, e-commerce). Without creator onboarding, no one can use the platform.

**Timeline:** Cycle 1-100 (approximately 8-12 cycles per specialist per day)
**Team:** 4 specialists (backend, frontend, quality, designer) + documentation
**Scope:** 8-stage signup flow + workspace management + team collaboration

---

## 6-Dimension Ontology Validation

### GROUPS (Isolation & Hierarchy)

**Onboarding maps perfectly to the Groups dimension:**

- **Creator's workspace** = New `group` (type: "organization")
- **Team members** = Additional people added to the group via `member_of` connections
- **Hierarchical structure:** Personal workspace (level 1) → optional sub-groups for departments (level 2+)
- **Group ownership:** Creator becomes the `group_owner` of their workspace
- **Data scoping:** All creator's content, team, and settings are scoped to this group

**Example:**

```
Creator "Jane" registers
  ↓ Creates workspace "Jane's Studio" (group)
    ├─ Jane is group_owner (role: "group_owner")
    ├─ Invites Editor "Bob" (role: "group_user")
    └─ All content/analytics scoped to this group
```

### PEOPLE (Authorization & Governance)

**Onboarding maps perfectly to the People dimension:**

- **Creator thing** = Person with properties (email, username, bio, avatar, skills, interests)
- **Roles:** Creator starts as `group_owner` in their workspace
- **Permissions:** Workspace owner can manage team, billing, settings
- **Additional roles:** Editor, Viewer (for team members)
- **Authentication:** Email + password verified via verification code
- **Governance:** Creator controls who can access their workspace

**Role Hierarchy:**

```
Platform Owner (global)
└─ Creator (group_owner)
   ├─ Team Member (group_user) - Editor/Viewer roles
   ├─ Team Member (group_user) - Editor/Viewer roles
   └─ ...
```

### THINGS (Entities)

**Onboarding creates and manages these thing types:**

1. **creator** (person) - The registered user
   - Email, username, displayName, bio, avatar
   - Niche, expertise, interests
   - Workspace IDs, roles
   - Wallet address (optional)
   - Onboarding status/completion tracking

2. **organization** (workspace group) - Created during workspace setup
   - Name, slug, description, logo
   - Plan (starter/pro/enterprise)
   - Member count, visibility settings

3. **invitation_token** - For team member invitations
   - Token, invitedEmail, workspaceId, role
   - Status (pending/accepted/expired), expiresAt

4. **verification_token** - For email verification
   - Token, userId, type (email/2fa)
   - ExpiresAt, attempts, maxAttempts

5. **ui_preferences** - User settings & preferences
   - Theme, language, timezone, notification settings

**All scoped to group:** Every thing is associated with `groupId` (creator's workspace)

### CONNECTIONS (Relationships)

**Onboarding creates these relationship types:**

1. **member_of** (creator → workspace group)
   - Metadata: role (group_owner), permissions, joinedAt

2. **member_of** (team member → workspace group)
   - Metadata: role (group_user), permissions, invitedBy, invitedAt, status

3. **owns** (creator → created content/resources)
   - Will be used for content ownership post-onboarding

**Connection Pattern:**

```
creator_jane → workspace_jane_studio (member_of, role: "group_owner")
editor_bob   → workspace_jane_studio (member_of, role: "group_user", status: "pending/active")
```

### EVENTS (Actions & Audit Trail)

**Onboarding logs these event types:**

- `user_registered` - Signup form submitted
- `email_verification_sent` - Verification code sent
- `email_verified` - Email confirmed
- `profile_updated` - Profile completed
- `thing_created` (thingType: "organization") - Workspace created
- `user_invited_to_group` - Team member invited
- `user_joined_group` - Team member accepted
- `wallet_connected` - Crypto wallet linked
- `thing_updated` (thingType: "creator") - Skills added
- `onboarding_completed` - Full journey done

**Complete Audit Trail:** Every step logged for analytics, funnel tracking, and debugging

### KNOWLEDGE (Taxonomy & RAG)

**Onboarding connects creators to knowledge labels:**

- **Skills/Expertise:** skill:video-editing, skill:copywriting, skill:fitness-coaching
- **Industries:** industry:fitness, industry:education, industry:finance
- **Interests:** topic:personal-branding, topic:monetization, topic:community
- **Platform Goals:** goal:income, goal:audience, goal:collaboration, goal:learning

**Knowledge Pattern:**

```
creator_jane links to knowledge items:
  ├─ skill:fitness-coaching
  ├─ skill:social-media
  ├─ industry:wellness
  ├─ goal:income
  └─ goal:community
```

These labels enable:

- Smart recommendations (show relevant products/courses/agents)
- Cohort discovery (find similar creators)
- Personalized dashboard (show relevant features)
- Semantic search (find by expertise/interest)

---

## User Personas & Motivations

### Persona 1: Solo Creator (YouTuber/Podcaster)

**Why they join:**

- Want to monetize existing audience
- Need passive income stream
- Interested in AI collaboration (avatars, agents)
- Tired of platform dependence (YouTube, Spotify)

**First 5 minutes:**

1. Sign up with Google
2. Verify email (auto-verify from Google)
3. Enter name + bio (copy from YouTube description)
4. Select niche (comedy, education, business)
5. See "Ready to monetize" CTA

**First day goal:**

- Profile 100% complete
- Wallet connected (to receive X402 payments)
- First 3 skills tagged
- See dashboard tour

**First week goal:**

- Create first content piece
- Earn first tokens
- Understand monetization model
- Subscribe to starter plan

### Persona 2: Agency Owner (Team Leader)

**Why they join:**

- Manage multiple creators in one place
- Coordinate team content production
- Track earnings across team
- Automate workflows

**First 5 minutes:**

1. Sign up with email
2. Create workspace (e.g., "Creative Collective")
3. Invite 3 team members via email
4. Set member permissions (editor/viewer)
5. See team dashboard

**First day goal:**

- Workspace created and branded
- Team invited (pending their acceptance)
- Roles defined (who can publish, who can view)
- Settings configured (brand colors, domain)

**First week goal:**

- All team members joined
- First collaborative content created
- Team earnings visible
- Upgrade to pro plan

### Persona 3: AI Agent Developer

**Why they join:**

- Deploy custom AI agents that monetize
- Earn from agent conversations
- Integrate with their own systems
- Use X402 for micropayments

**First 5 minutes:**

1. Sign up with GitHub OAuth
2. Verify email
3. Enter name + bio (copy from GitHub profile)
4. Select interests (AI, automation, integration)
5. See "API Documentation" link

**First day goal:**

- Profile complete
- Wallet connected (for X402 transactions)
- API keys generated
- Read API docs

**First week goal:**

- Deploy first agent
- Make first API call
- Receive first X402 payment
- Subscribe to developer plan

### Persona 4: Product Merchant

**Why they join:**

- Sell digital products (templates, tools, courses)
- Manage inventory + pricing
- Receive payments automatically
- Build customer relationships

**First 5 minutes:**

1. Sign up with email
2. Create workspace (e.g., "Design Templates Store")
3. Complete profile (store name, description)
4. Add first product (template/tool)
5. Set pricing

**First day goal:**

- Store profile created
- First 3 products listed
- Wallet connected (for payouts)
- Store visible to public

**First week goal:**

- Make first sale
- Receive first payout
- Get 10 customers
- Set up email automation

---

## Onboarding Flow (8 Stages)

```
┌─────────────────────────────────────────────────────┐
│  STAGE 1: LANDING (Pre-Auth)                        │
│  "Welcome to ONE"                                   │
│  - Hero section + features                          │
│  - CTA: Sign Up | Sign In                           │
│  - 30 seconds                                       │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  STAGE 2: SIGNUP (Auth)                             │
│  Email, Password, Agree to Terms                    │
│  - Email/password form                              │
│  - OAuth options (Google, GitHub, Discord)          │
│  - "I agree to terms" checkbox                      │
│  - 2 minutes                                        │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  STAGE 3: EMAIL VERIFICATION                        │
│  Confirm email with 6-digit code                    │
│  - "Check your inbox"                               │
│  - 6-digit code input (auto-submit)                 │
│  - Resend option (with cooldown)                    │
│  - 1 minute                                         │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  STAGE 4: PROFILE                                   │
│  Complete creator profile                           │
│  - Avatar upload                                    │
│  - Display name                                     │
│  - Username (unique, URL-safe)                      │
│  - Bio (up to 500 chars)                            │
│  - Niche selection (multi-select)                   │
│  - 3 minutes                                        │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  STAGE 5: WORKSPACE                                 │
│  Create workspace (group)                           │
│  Option A: "I'm solo"                               │
│    → Create personal workspace                      │
│    → 1 minute                                       │
│  Option B: "I manage a team"                        │
│    → Name workspace                                 │
│    → Add team members (email list)                  │
│    → 3 minutes                                      │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  STAGE 6: WALLET (Optional but Encouraged)          │
│  Connect crypto wallet for X402 payments            │
│  - Benefits explanation                             │
│  - "Connect Wallet" button                          │
│  - Wallet selection (MetaMask, Rainbow, etc)        │
│  - "Skip for now" link                              │
│  - 2 minutes or skip                                │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  STAGE 7: SKILLS                                    │
│  Tag expertise + interests                          │
│  - Pre-populated from niche (if selected)           │
│  - Skill groups (education, fitness, tech, etc)     │
│  - Multi-select + custom skill text                 │
│  - 2 minutes                                        │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│  STAGE 8: WELCOME & TOUR                            │
│  Interactive tour + dashboard intro                 │
│  - "Welcome to ONE!" celebration                    │
│  - Quick tour (6 steps, can skip)                   │
│  - Show: create content, manage team, monetize      │
│  - First-day checklist                              │
│  - CTA: "Go to Dashboard"                           │
│  - 2 minutes or skip                                │
└──────────────┬──────────────────────────────────────┘
               ↓
           READY!
        Access Dashboard
      Begin Creating/Selling
```

**Total time:** <15 minutes for complete onboarding (8-10 min focused, 2-5 min skippable)

---

## Success Metrics

### Funnel Metrics (Target: 80%+ completion)

```
Signups: 100%
  ↓
Email Verified: 90%
  ↓
Profile Completed: 85%
  ↓
Workspace Created: 83%
  ↓
Team Member Invited (or Solo): 81%
  ↓
Skills Added: 80%
  ↓
Dashboard Tour Started: 78%
  ↓
FULLY COMPLETE: 75%+
```

### Timing Metrics

| Stage                  | Target Time | Upper Limit |
| ---------------------- | ----------- | ----------- |
| Signup → Email Verify  | 2 min       | 5 min       |
| Email Verify → Profile | 1 min       | 3 min       |
| Profile → Workspace    | 1 min       | 2 min       |
| Workspace → Skills     | 2 min       | 5 min       |
| Skills → Complete      | 1 min       | 2 min       |
| **Total**              | **7 min**   | **15 min**  |

### Quality Metrics

- **Email delivery:** >98% (track hard bounces)
- **Form validation:** Real-time feedback (no surprises at submit)
- **Error resolution:** <30 seconds to recover from any error
- **Mobile conversion:** 70%+ of desktop rate
- **Accessibility:** WCAG 2.1 AA compliance
- **Load time:** <2s initial page load

### Business Metrics (Post-Onboarding)

- **7-day retention:** 70%+ return to dashboard
- **30-day activation:** 50%+ create content or make sale
- **Profile strength:** 85%+ add 3+ skills
- **Wallet adoption:** 40%+ connect wallet
- **Team adoption:** 30%+ invite team member
- **Plan upgrade:** 20%+ upgrade from free to paid within 30 days

---

## First-Day Quick Win Checklist

Goal: Creator feels **successful and confident** after onboarding.

```
Quick Wins Checklist (6 items to complete):

☐ Profile 80% Complete
  ├─ Name + avatar (required)
  ├─ Bio (required)
  └─ Niche selected (required)
  Reward: Profile badge unlocked

☐ Email Verified
  └─ Check! (happens during signup)
  Reward: Email verification badge

☐ Workspace Created
  └─ Personal or team workspace active
  Reward: Workspace badge unlocked

☐ Team Member Invited (or Solo Confirmed)
  └─ Invited 1+ team member OR confirmed solo
  Reward: Collaboration badge (or Solo badge)

☐ Wallet Connected (Encouraged but Optional)
  └─ Crypto wallet linked and verified
  Reward: Ready to Earn badge

☐ First Skill Added
  └─ At least 1 expertise tagged
  Reward: Expert badge unlocked

Final Reward: "Welcome to ONE" achievement + 100 bonus tokens (for testing)
└─ Unlock advanced dashboard features
└─ Access to AI agents (if available)
└─ Community welcome message from platform
```

Completion of all 6 items triggers:

- Email: "You're all set! Here's what's next..."
- Dashboard notification: "You're ready to create & earn"
- Unlock beginner-friendly content (first course, first template, etc)

---

## Integration Points

### 1. Better Auth (Authentication)

**Current state:** Email/password + OAuth working in production
**Onboarding adds:**

- Email verification flow (6-digit code via Resend)
- User creation in Better Auth
- Session creation for authenticated requests
- Login redirect after onboarding complete

**API Integration:**

```
signup → Create user in Better Auth
  ↓
send verification email → Resend
  ↓
verify code → Mark user as verified
  ↓
login → Get session token
```

### 2. Convex (Database)

**Creates:**

- `creator` thing (in entities table)
- `organization` thing (workspace, in entities table)
- `member_of` connection (creator → workspace)
- Verification tokens for email flow
- Events for every transition

**Tables touched:**

- `entities` (creator, workspace things)
- `connections` (team membership)
- `events` (audit trail)
- `groups` (workspace group)

### 3. Email (Resend)

**Sends:**

- Welcome email (after signup)
- Verification code (6-digit, 10-min expiry)
- Team invitation (if inviting others)
- Password reset (if requested)
- Onboarding reminder (if abandoned)

### 4. Wallet (viem/wagmi) - Optional

**For X402 protocol:**

- Detect MetaMask, Rainbow Kit, WalletConnect
- Request wallet connection
- Sign message to verify ownership
- Store wallet address in creator properties
- Display wallet balance (future: X402 earnings)

### 5. Analytics

**Track every transition:**

- Conversion funnel (which stage drops off?)
- Time in each stage
- Device/browser (mobile vs desktop)
- Signup source (direct, OAuth provider, referral)
- Completion rate by cohort

---

## Dependencies

### Block Everything Until Ready

**Wave 1 blocks:**

- Wave 2 (Monetization) - Needs creators first
- Wave 3 (Agents) - Needs authenticated creators
- Wave 4 (API) - Needs API keys (requires creator)
- Wave 5 (E-commerce) - Needs workspace for product management
- All team features - Needs workspace + team members

### Requirements Met

✅ Better Auth working (email/password + OAuth)
✅ Convex schema defined (groups, entities, connections, events)
✅ Resend integrated (email sending)
✅ Production Convex Cloud deployed
✅ Frontend React 19 ready
✅ Backend TypeScript fixed

**Everything needed is ready. This is a pure build.**

---

## Out of Scope (Wave 2+)

These features are intentionally **NOT** in Wave 1:

- **Monetization:** No stripe, no pricing, no products yet
- **AI Agents:** No agent deployment, no AI clone
- **Analytics:** No detailed dashboard stats
- **Advanced team:** No fine-grained permissions, no audit logs per action
- **Advanced wallet:** No balance display, no transaction history
- **Advanced profile:** No portfolio, no testimonials, no verification badges
- **Content creation:** No editor, no publishing system
- **Community:** No forums, no messaging

These are all Wave 2+. Wave 1 is **purely onboarding**.

---

## Success Criteria for Wave 1 Complete

Wave 1 is done when:

- ✅ User can register with email + password
- ✅ Email verification works (code sent + verified)
- ✅ Profile form complete + avatar upload working
- ✅ Workspace creation working
- ✅ Team member invitations working (send + accept)
- ✅ Wallet connection optional but functional
- ✅ Skills/expertise tagging working
- ✅ Onboarding status tracked (events logged)
- ✅ 80%+ of test users complete full flow
- ✅ Average time < 15 minutes
- ✅ Mobile-responsive (70%+ desktop conversion on mobile)
- ✅ Accessibility compliant (WCAG 2.1 AA)
- ✅ New creator can access dashboard
- ✅ Team features tested (invite, accept, roles visible)
- ✅ Complete audit trail (all events logged)
- ✅ API documented + ready for Wave 2

---

## What Happens After Onboarding

**Day 1:**

- Creator sees dashboard
- Dashboard shows quick wins checklist (if not completed)
- Suggestions for next steps (create content, connect wallet, invite team)
- "Recommended for you" section (based on skills/interests)

**Day 2-7:**

- First content created (or first sale)
- First X402 payment received (if wallet connected)
- First team member joins (if invited)
- First earnings visible
- Email: "You earned X tokens!"

**Week 2-4:**

- Decide to upgrade to pro plan
- Buy first AI agent or course
- Publish second piece of content
- Invite more team members
- Build audience

**Month 2+:**

- Platform becomes primary revenue stream
- Team grows
- AI agents deployed
- Community engaged
- Becomes advocate (invites friends)

---

## Architecture Notes

### Frontend Stack

- **Pages:** Astro (SSR) - Fast, server-rendered, minimal JS
- **Components:** React 19 (islands) - Interactive elements only
- **Forms:** Shadcn/ui + Tailwind v4 - Accessible, beautiful
- **Routing:** File-based (Astro routing)
- **State:** Convex hooks (useQuery, useMutation)
- **Auth:** Better Auth client library

### Backend Stack

- **Database:** Convex (Real-time, schema-enforced)
- **Services:** Effect.ts (pure business logic)
- **Mutations:** Thin wrappers (validation + event logging)
- **Email:** Resend (@convex-dev/resend component)
- **Auth:** Better Auth (6 methods: email, Google, GitHub, Discord, magic link, 2FA)
- **Rate Limiting:** @convex-dev/rate-limiter (prevent abuse)

### Security

- Email verification (prevents fake email signup)
- Rate limiting (prevent brute force)
- Password hashing (SHA-256 minimum, bcrypt recommended)
- JWT tokens (refresh + access token pattern)
- CORS validation (frontend/backend same origin)
- Email validation (basic format + delivery check)

### Performance Targets

- Signup page: <2s initial load
- Form submit: <1s response
- Email delivery: <30 seconds
- Dashboard render: <3s after login
- Mobile: 70%+ of desktop speed

---

## Next Steps After Approval

1. **Backend specialist** starts at Cycle 11
   - Extend creator entity type
   - Create onboarding mutations
   - Create verification system
   - Create email templates

2. **Frontend specialist** starts at Cycle 21
   - Build signup → verification → profile flow
   - Build workspace creation UI
   - Build team management UI
   - Build onboarding pages

3. **Quality specialist** starts at Cycle 31
   - Define test cases
   - Build test infrastructure
   - Run integration tests
   - Create test user accounts

4. **Designer specialist** starts at Cycle 41
   - Create wireframes (already have specs)
   - Design system review
   - Component specs
   - Accessibility audit

5. **Orchestration** throughout
   - Monitor progress across all specialists
   - Resolve blockers
   - Ensure 6-dimension alignment
   - Log completion events

---

**Status:** Ready for implementation
**Approved:** Engineering Director (AI Agent)
**Implementation Start:** Immediate (Cycle 1)
