---
title: Wave1 Specialist Assignments
dimension: things
category: plans
tags: agent, ai, backend, frontend, cycle, ontology, people, testing
related_dimensions: events, groups, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/wave1-specialist-assignments.md
  Purpose: Documents wave 1: creator onboarding - specialist assignments
  Related dimensions: events, groups, people
  For AI agents: Read this to understand wave1 specialist assignments.
---

# Wave 1: Creator Onboarding - Specialist Assignments

**Version:** 1.0.0
**Status:** Ready for Assignment
**Last Updated:** 2025-11-01

---

## Overview

This document specifies exactly who does what, in what order, with what deliverables and dependencies.

**Total Team:** 5 people

- 1 Backend Specialist
- 1 Frontend Specialist
- 1 Quality Specialist
- 1 Design/Documentation Specialist
- 1 Orchestrator (Director)

**Total Duration:** 10-12 calendar days
**Estimated Effort:** 38 person-days

---

## Specialist 1: Agent-Backend

**Role:** Implement all backend mutations, queries, services, email, and verification logic

**Total Cycles:** 40 (Cycle 11-30 + 51-70)
**Duration:** 10 days (typically 4 cycles per day)
**Start:** Day 1, Cycle 11
**Blocks:** Frontend (needs API ready for Cycle 51+), Integration testing (Cycle 71+)

### Phase 1: Schema & Services (Cycle 11-30)

**Cycle 11-12: Extend Creator Entity Type**

**Input:** Ontology specification from vision doc
**Task:** Update `/backend/convex/schema.ts` with creator properties

**Deliverable:**

```typescript
// Add to schema.ts entities table definition
creator: {
  email: string,
  username: string,
  displayName: string,
  bio: string,
  avatar: string,
  niche: string[],
  expertise: string[],
  interests: string[],
  workspaceId: Id<'groups'>,
  workspaces: Id<'groups'>[],
  role: 'owner' | 'admin' | 'editor',
  walletAddress: string,
  walletVerified: boolean,
  walletConnectedAt: number,
  onboardingStep: string,
  onboardingCompleted: boolean,
  onboardingCompletedAt: number,
  emailVerified: boolean,
  emailVerifiedAt: number,
  agreeToTerms: boolean,
  agreeToPrivacy: boolean,
}
```

**Status:** Ready for implementation
**Time Estimate:** 1 day

---

**Cycle 13-14: Extend Organization Entity Type**

**Task:** Add organization (workspace) properties to schema

**Deliverable:**

```typescript
// Add to schema.ts for organization/workspace type
organization: {
  slug: string,
  description: string,
  logo: string,
  visibility: 'private' | 'public',
  joinPolicy: 'invite_only' | 'open',
  memberCount: number,
  maxMembers: number,
  plan: 'free' | 'pro' | 'enterprise',
  stripeCustomerId: string,
  billingEmail: string,
  defaultLanguage: string,
  defaultTimezone: string,
}
```

**Status:** Ready for implementation
**Time Estimate:** 1 day

---

**Cycle 15-16: Create Invitation Token Type**

**Task:** Add invitation_token entity type for team invitations

**Deliverable:**

```typescript
// Add to schema.ts
invitation_token: {
  token: string,
  invitedBy: Id<'things'>,
  invitedEmail: string,
  workspaceId: Id<'groups'>,
  role: 'editor' | 'viewer',
  status: 'pending' | 'accepted' | 'expired',
  expiresAt: number,
  acceptedAt: number,
  acceptedBy: Id<'things'>,
}
```

**File:** `/backend/convex/schema.ts`
**Status:** Ready for implementation
**Time Estimate:** 0.5 days

---

**Cycle 17: Create Onboarding Service (Effect.ts)**

**Task:** Build pure business logic layer

**File to Create:** `/backend/convex/services/onboarding.ts`

**Deliverable:** Service with methods:

- `registerUser(email, password)` → CreatorEntity
- `sendVerificationEmail(userId, email)` → void
- `verifyEmail(userId, code)` → { verified: boolean }
- `updateProfile(userId, data)` → CreatorEntity
- `createWorkspace(userId, name)` → OrganizationEntity
- `inviteTeamMember(userId, workspaceId, email, role)` → void
- `acceptInvitation(token)` → { joined: boolean }
- `connectWallet(userId, address)` → { verified: boolean }
- `addSkills(userId, skills)` → CreatorEntity
- `completeOnboarding(userId)` → { completed: boolean }

**Status:** Ready for implementation
**Time Estimate:** 1.5 days

---

**Cycle 18-25: Create All Mutations (8 cycles)**

**Files to Create/Update:** `/backend/convex/mutations/auth.ts`, `/backend/convex/mutations/workspace.ts`

**Mutations:**

1. **signUp** (Cycle 18)
   - Email + password signup
   - Create user in Better Auth
   - Create creator entity
   - Send welcome email
   - Log user_registered event
   - Duration: 1 day

2. **verifyEmail** (Cycle 19)
   - Validate 6-digit code
   - Mark email verified
   - Log email_verified event
   - Duration: 0.5 day

3. **updateProfile** (Cycle 20)
   - Validate username unique
   - Handle avatar upload
   - Update creator properties
   - Log profile_updated event
   - Duration: 1 day

4. **createWorkspace** (Cycle 21)
   - Create organization entity
   - Create member_of connection
   - Update creator.workspaceId
   - Log thing_created event
   - Duration: 0.5 day

5. **inviteTeamMember** (Cycle 22)
   - Generate invitation token
   - Create invitation_token entity
   - Send invitation email
   - Log user_invited_to_group event
   - Duration: 1 day

6. **acceptInvitation** (Cycle 23)
   - Validate token + expiry
   - Get or create user
   - Create member_of connection
   - Log user_joined_group event
   - Duration: 0.5 day

7. **connectWallet** (Cycle 24)
   - Validate Ethereum address
   - Update creator.walletAddress
   - Log wallet_connected event
   - Duration: 0.5 day

8. **addSkills** (Cycle 25)
   - Create knowledge items for each skill
   - Link creator to knowledge
   - Update creator.expertise
   - Log thing_updated event
   - Duration: 0.5 day

**Total Duration:** Cycle 18-25 = 5.5 days

**Status:** Ready for implementation

---

**Cycle 26: Create Onboarding Queries**

**File to Create:** `/backend/convex/queries/onboarding.ts`

**Queries:**

- `getCurrentUser()` → Creator + workspace info
- `getOnboardingStatus(userId)` → Step + completion %
- `checkUsernameAvailable(username)` → boolean
- `checkEmailExists(email)` → boolean
- `getWorkspaceMembers(workspaceId)` → Member[]
- `getPendingInvitations(workspaceId)` → Invitation[]
- `getUserWorkspaces(userId)` → Workspace[]

**Status:** Ready for implementation
**Time Estimate:** 1 day

---

**Cycle 27: Create Email Templates**

**Files to Create:** `/backend/convex/emails/*.email.tsx`

**Templates:**

1. `welcome.email.tsx` - "Welcome to ONE"
2. `verify-email.email.tsx` - 6-digit code
3. `team-invite.email.tsx` - Join workspace
4. `password-reset.email.tsx` - Reset link
5. `onboarding-reminder.email.tsx` - Incomplete onboarding

**Status:** Ready for implementation
**Time Estimate:** 1 day

---

**Cycle 28: Create Verification System**

**File to Create:** `/backend/convex/lib/verification.ts`

**Functions:**

- `generateVerificationCode()` → "123456"
- `generateVerificationLink()` → "https://one.ie/verify/TOKEN"
- `verifyCode(code)` → boolean
- `verifyLink(token)` → boolean
- `rateLimit(email)` → boolean (5 per hour)
- `generateInvitationToken()` → unique token

**Status:** Ready for implementation
**Time Estimate:** 0.5 day

---

**Cycle 29: Configure Rate Limiting**

**Task:** Set up @convex-dev/rate-limiter rules

**Rules:**

- signUp: 5 per IP per hour
- sendVerificationEmail: 5 per email per hour
- inviteTeamMember: 20 per workspace per day
- connectWallet: 5 per user per day

**Status:** Ready for implementation
**Time Estimate:** 0.5 day

---

**Cycle 30: Backend Schema Complete**

**Validation Checklist:**

- [ ] All mutations working locally
- [ ] All queries working locally
- [ ] Email templates rendering
- [ ] Rate limiting active
- [ ] Events logging
- [ ] Schema validated against ontology
- [ ] No TypeScript errors
- [ ] Convex types generated

**Blocker Resolution:** Fix any issues before proceeding to Phase 2

**Status:** Ready for implementation
**Time Estimate:** 0.5 day

---

### Phase 2: API Routes & Integration (Cycle 51-70)

**Cycle 51-60: Create API Routes (10 cycles)**

**Auth Routes:** `/api/auth/*`

- `POST /api/auth/signup` → Create user
- `POST /api/auth/verify-email` → Confirm email
- `POST /api/auth/resend-verification` → Resend code
- `POST /api/auth/login` → Login user
- `POST /api/auth/logout` → Logout
- `POST /api/auth/request-password-reset` → Send reset email
- `POST /api/auth/reset-password` → Confirm reset

**Profile Routes:** `/api/profile/*`

- `GET /api/profile` → Get current user
- `POST /api/profile` → Update profile
- `POST /api/profile/avatar` → Upload avatar

**Workspace Routes:** `/api/workspace/*`

- `POST /api/workspace` → Create workspace
- `GET /api/workspace` → List workspaces
- `GET /api/workspace/[id]` → Get workspace
- `PATCH /api/workspace/[id]` → Update workspace

**Team Routes:** `/api/team/*`

- `POST /api/team/invite` → Invite member
- `POST /api/team/accept` → Accept invitation
- `GET /api/team/[workspace]/members` → List members
- `GET /api/team/[workspace]/pending` → List pending
- `PATCH /api/team/[workspace]/members/[id]/role` → Change role
- `DELETE /api/team/[workspace]/members/[id]` → Remove member

**Wallet Routes:** `/api/wallet/*`

- `POST /api/wallet/connect` → Connect wallet
- `POST /api/wallet/verify` → Verify signature

**Skills Routes:** `/api/skills/*`

- `POST /api/skills` → Add skills
- `GET /api/skills` → List available skills

**Onboarding Routes:** `/api/onboarding/*`

- `GET /api/onboarding/status` → Get progress
- `POST /api/onboarding/step` → Update step

**Duration:** Cycle 51-60 = 5 days (2 routes per day)
**Status:** Ready for implementation

---

**Cycle 61-70: Email System & Integration (10 cycles)**

**Task:** Wire up email sending, configure Resend, test delivery

**Activities:**

1. **Configure Resend** (Cycle 61)
   - Set API key
   - Verify sender domain
   - Create email lists
   - Duration: 0.5 day

2. **Implement email sending** (Cycle 62-64)
   - Signup welcome email
   - Verification code email
   - Team invitation email
   - Password reset email
   - Duration: 1.5 days

3. **Test email delivery** (Cycle 65-67)
   - Send test emails
   - Verify delivery timing (< 30s)
   - Check template rendering
   - Test spam filter delivery
   - Duration: 1.5 days

4. **Email tracking** (Cycle 68-70)
   - Track opens
   - Track clicks
   - Log email events
   - Duration: 1.5 days

**Status:** Ready for implementation

---

**Total Backend Duration:** 10 days
**Status:** ✅ Ready to be assigned to specialist

---

## Specialist 2: Agent-Frontend

**Role:** Implement all onboarding pages, components, and team management UI

**Total Cycles:** 20 (Cycle 31-50)
**Duration:** 5-6 days (3-4 cycles per day)
**Start:** Day 3, Cycle 31 (can start while backend is on Cycle 11-30)
**Dependency:** Needs API routes ready by Cycle 51+
**Blocks:** Deployment (Cycle 91+)

### Component Development (Cycle 31-43)

**Cycle 31: SignupForm Component**

**File:** `/web/src/components/onboarding/SignupForm.tsx`

**Requirements:**

- Email input + validation
- Password input + strength meter
- OAuth buttons (Google, GitHub, Discord)
- Checkbox: "I agree to terms"
- Loading state
- Error handling
- Success redirect

**Time Estimate:** 1 day
**Status:** Ready

---

**Cycle 32: EmailVerification Component**

**File:** `/web/src/components/onboarding/EmailVerification.tsx`

**Requirements:**

- 6 separate input fields
- Auto-focus between fields
- Auto-submit when complete
- Resend button (30s cooldown)
- Error messages
- Loading state

**Time Estimate:** 0.5 day
**Status:** Ready

---

**Cycle 33: ProfileForm Component**

**File:** `/web/src/components/onboarding/ProfileForm.tsx`

**Requirements:**

- Avatar upload (preview + drag-drop)
- Display name input
- Username input (with slug preview: one.ie/@username)
- Bio textarea (500 char limit)
- Niche multi-select
- Real-time validation
- Save button

**Time Estimate:** 1.5 days
**Status:** Ready

---

**Cycle 34: WorkspaceSetup Component**

**File:** `/web/src/components/onboarding/WorkspaceSetup.tsx`

**Requirements:**

- Option A: "I'm solo" → Personal workspace
- Option B: "I manage a team" → Team setup
- Workspace name input
- Email list for team members
- Role assignment
- Save button

**Time Estimate:** 1 day
**Status:** Ready

---

**Cycle 35: WalletConnection Component**

**File:** `/web/src/components/onboarding/WalletConnection.tsx`

**Requirements:**

- Explanation of wallet benefits
- "Connect Wallet" button
- Wallet options (MetaMask, Rainbow Kit, WalletConnect)
- Connected state display
- Disconnect option
- "Skip for now" link
- Uses wagmi/viem hooks

**Time Estimate:** 1 day
**Status:** Ready

---

**Cycle 36: SkillSelection Component**

**File:** `/web/src/components/onboarding/SkillSelection.tsx`

**Requirements:**

- Grouped skill tags by category
- Multi-select checkboxes
- Add custom skill input
- Pre-populate from niche
- Skill descriptions on hover
- Save button

**Time Estimate:** 1 day
**Status:** Ready

---

**Cycle 37: OnboardingTour Component**

**File:** `/web/src/components/onboarding/OnboardingTour.tsx`

**Requirements:**

- 6 interactive steps
- Highlight UI elements
- Progress indicator
- Next/Back buttons
- Skip anytime
- Show/hide toggle
- Demo endpoints

**Time Estimate:** 1.5 days
**Status:** Ready

---

**Cycle 38: OnboardingChecklist Component**

**File:** `/web/src/components/onboarding/OnboardingChecklist.tsx`

**Requirements:**

- 6 checklist items
- Progress bar
- Checkmarks for completed
- Links to incomplete items
- Completion reward
- Completion badge

**Time Estimate:** 0.5 day
**Status:** Ready

---

**Cycle 39-40: Helper Components**

**Files:**

- `AvatarUpload.tsx` (Cycle 42)
- `NicheSelection.tsx` (Cycle 43)
- `LoadingStates.tsx` (Cycle 44)
- `ErrorHandling.tsx` (Cycle 45)
- `SuccessAnimations.tsx` (Cycle 46)

**Total Duration:** 1 day
**Status:** Ready

---

### Page Development (Cycle 39-41)

**Cycle 39: Onboarding Pages (Part 1)**

**Files:**

- `/web/src/pages/onboarding/index.astro` - Entry page
- `/web/src/pages/onboarding/signup.astro` - Signup form
- `/web/src/pages/onboarding/verify.astro` - Email verification
- `/web/src/pages/onboarding/profile.astro` - Profile form

**Requirements:**

- All `client:load` (interactive)
- Form validation
- Redirect on auth failure
- Progress indicator
- Mobile responsive

**Time Estimate:** 1 day
**Status:** Ready

---

**Cycle 40: Onboarding Pages (Part 2)**

**Files:**

- `/web/src/pages/onboarding/workspace.astro`
- `/web/src/pages/onboarding/wallet.astro`
- `/web/src/pages/onboarding/skills.astro`
- `/web/src/pages/onboarding/complete.astro`

**Requirements:** Same as Part 1

**Time Estimate:** 1 day
**Status:** Ready

---

**Cycle 41: Team Management Page**

**File:** `/web/src/pages/workspace/settings/team.astro`

**Requirements:**

- Members list (table)
- Invite new member form
- Pending invitations section
- Member role/permissions modal
- Remove member button
- Resend invitation option

**Time Estimate:** 1 day
**Status:** Ready

---

### Polish & Optimization (Cycle 47-50)

**Cycle 47: Mobile Responsive Design**

**Task:** Ensure mobile-first responsive design

**Checklist:**

- [ ] All forms mobile-friendly
- [ ] Avatar upload works on mobile
- [ ] Code input optimized for mobile keyboard
- [ ] Buttons minimum 48px
- [ ] Text readable on small screens
- [ ] No horizontal scrolling
- [ ] Mobile menu for team page

**Time Estimate:** 1 day
**Status:** Ready

---

**Cycle 48: Accessibility Compliance**

**Task:** WCAG 2.1 AA compliance

**Checklist:**

- [ ] Proper labels + aria-labels
- [ ] Keyboard navigation (Tab key)
- [ ] Color contrast (4.5:1 minimum)
- [ ] Focus indicators visible
- [ ] Reduced motion support
- [ ] Screen reader friendly
- [ ] Skip navigation links

**Time Estimate:** 1 day
**Status:** Ready

---

**Cycle 49: Dark Mode Support**

**Task:** Add dark theme support

**Implementation:**

- System preference detection
- Toggle in settings
- Tailwind dark mode utilities
- Stored preference

**Time Estimate:** 0.5 day
**Status:** Ready

---

**Cycle 50: Final Frontend Validation**

**Validation Checklist:**

- [ ] All 8 onboarding pages render
- [ ] Team management page works
- [ ] All components interactive
- [ ] Mobile responsive (70%+ desktop conversion)
- [ ] Accessibility compliant
- [ ] No TypeScript errors
- [ ] No console warnings/errors
- [ ] Ready for API integration

**Time Estimate:** 0.5 day
**Status:** Ready

---

**Total Frontend Duration:** 5-6 days (Cycle 31-50)
**Status:** ✅ Ready to be assigned

---

## Specialist 3: Agent-Quality

**Role:** Test all functionality, verify quality, security, accessibility, performance

**Total Cycles:** 10 (Cycle 81-90)
**Duration:** 2-3 days
**Start:** Day 8, Cycle 81 (after backend + frontend complete)
**Dependency:** Phase 4 (API routes) complete
**Blocks:** Deployment (Cycle 91+)

### Cycle 81-82: Backend Unit Tests

**Task:** Test mutations, queries, services in isolation

**Coverage:**

- Onboarding service (all 10 methods)
- Verification system (code generation, validation)
- Email sending (template rendering)
- Rate limiting (enforcement)

**Target:** 90%+ code coverage

**Tools:** Vitest or Jest

**Time Estimate:** 1 day
**Status:** Ready

---

### Cycle 83-84: Frontend Unit Tests

**Task:** Test React components in isolation

**Coverage:**

- SignupForm (validation, submit)
- EmailVerification (input handling, auto-submit)
- ProfileForm (validation, avatar upload)
- WorkspaceSetup (routing, options)
- All form components

**Target:** 85%+ code coverage

**Tools:** Vitest + React Testing Library

**Time Estimate:** 1 day
**Status:** Ready

---

### Cycle 85-86: Integration Tests

**Task:** Test full feature flows end-to-end

**Scenarios:**

1. Complete signup in < 10 minutes
2. Email verification code delivery
3. Profile + workspace creation
4. Team invitation + acceptance
5. Wallet connection
6. Skill tagging

**Tools:** Playwright or Cypress

**Time Estimate:** 1 day
**Status:** Ready

---

### Cycle 87-88: E2E Tests

**Task:** Test real user journeys in browser

**Scenarios:**

1. New user signup → dashboard access
2. Team member invitation → acceptance
3. Workspace creation + team setup
4. Wallet connection flow
5. Onboarding checklist completion

**Time Estimate:** 0.5 day
**Status:** Ready

---

### Cycle 89: Security & Accessibility Audit

**Task:** Verify security + accessibility compliance

**Security Checklist:**

- [ ] No SQL injection vulnerabilities
- [ ] XSS protection working
- [ ] CSRF tokens present
- [ ] Password hashed (not plaintext)
- [ ] Email verification before action
- [ ] Rate limiting active
- [ ] No sensitive data in logs
- [ ] API input validation

**Accessibility Checklist:**

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast adequate
- [ ] Focus indicators visible

**Time Estimate:** 0.5 day
**Status:** Ready

---

### Cycle 90: Performance Audit

**Task:** Verify performance targets

**Metrics to check:**

- Page load: < 2s (target)
- Form submit: < 1s (target)
- Email delivery: < 30s (target)
- Mobile performance: 70%+ of desktop
- Lighthouse score: > 85
- No memory leaks
- No unnecessary re-renders

**Tools:** Lighthouse, Chrome DevTools, Playwright performance API

**Time Estimate:** 0.5 day
**Status:** Ready

---

**Total Quality Duration:** 2-3 days (Cycle 81-90)
**Status:** ✅ Ready to be assigned

---

## Specialist 4: Agent-Designer / Documenter

**Role:** Create wireframes, component specs, user guides, API documentation

**Total Cycles:** 10 (Cycle 41-50 design + 91-100 documentation)
**Duration:** 5-7 days (can run partially in parallel)
**Start:** Day 1 design work, Day 9 documentation

### Design Phase (Cycle 41-50, parallel with frontend)

**Cycle 41-45: Wireframes & Component Specs**

**Deliverables:**

- 8 onboarding page wireframes
- Component specifications (layouts, spacing, colors)
- Typography guide
- Color palette
- Button styles
- Form input styles
- Mobile layouts

**Files:** Figma or similar design tool

**Time Estimate:** 2 days
**Status:** Ready

---

**Cycle 46-50: Accessibility & Brand Guide**

**Deliverables:**

- Accessibility guidelines (WCAG 2.1 AA)
- Brand color specifications
- Typography sizes + weights
- Icon library
- Spacing/grid system
- Animation guidelines

**Time Estimate:** 2 days
**Status:** Ready

---

### Documentation Phase (Cycle 91-100)

**Cycle 91-92: User Documentation**

**Files to create:**

- `/docs/getting-started.md` - New creator guide
- `/docs/onboarding-guide.md` - Step-by-step walkthrough
- `/docs/team-management.md` - Team features
- `/docs/troubleshooting.md` - FAQ + solutions
- `/docs/faq.md` - Frequently asked questions

**Content:**

- Screenshots/videos of each step
- Common issues + solutions
- Best practices
- Tips for success

**Time Estimate:** 1.5 days
**Status:** Ready

---

**Cycle 93-94: API Documentation**

**Files to create:**

- `/docs/api/overview.md` - API intro
- `/docs/api/auth.md` - Auth endpoints
- `/docs/api/profile.md` - Profile endpoints
- `/docs/api/workspace.md` - Workspace endpoints
- `/docs/api/team.md` - Team endpoints
- `/docs/api/wallet.md` - Wallet endpoints
- `/docs/api/errors.md` - Error codes
- `/docs/api/rate-limits.md` - Rate limiting

**Content per endpoint:**

- Description
- HTTP method + path
- Authentication required
- Request parameters
- Response format
- Example curl command
- Error codes
- Rate limits

**Time Estimate:** 1.5 days
**Status:** Ready

---

**Cycle 95: Developer Setup Guide**

**File:** `/docs/developer-setup.md`

**Content:**

- Clone repository
- Install dependencies (Node, Bun, npm)
- Environment variables (.env.local)
- Database setup (Convex dev)
- Run development server
- Run tests
- Deploy to staging
- Common issues

**Time Estimate:** 0.5 day
**Status:** Ready

---

**Cycle 96: Deployment Checklist**

**File:** `/DEPLOYMENT.md`

**Content:**

- Pre-deployment checklist
  - All tests passing
  - Security audit passed
  - Performance targets met
  - Accessibility compliant
  - Staging tested
- Deployment steps
  - Frontend deployment (Cloudflare Pages)
  - Backend deployment (Convex Cloud)
  - Smoke tests
- Post-deployment
  - Monitoring
  - Analytics
  - User communication
  - Rollback plan

**Time Estimate:** 0.5 day
**Status:** Ready

---

**Cycle 97-98: Deployment & Release Notes**

**Task:** Support production deployment

**Activities:**

- Monitor deployment logs
- Run smoke tests in production
- Check error tracking
- Monitor key metrics
- Create release notes

**Time Estimate:** 1 day
**Status:** Ready

---

**Cycle 99: Analytics & Monitoring Setup**

**Task:** Configure analytics + monitoring

**Setup:**

- Analytics dashboard (signup funnel)
- Error tracking (Sentry or similar)
- Performance monitoring
- User feedback collection
- Email delivery monitoring

**Time Estimate:** 0.5 day
**Status:** Ready

---

**Cycle 100: Lessons Learned & Handoff**

**Deliverable:** Documentation of:

- What worked well
- What was harder than expected
- Team productivity notes
- Infrastructure learnings
- Recommendations for Wave 2

**Time Estimate:** 0.5 day
**Status:** Ready

---

**Total Design/Documentation Duration:** 5-7 days
**Status:** ✅ Ready to be assigned

---

## Specialist 5: Agent-Director (Orchestrator)

**Role:** Coordinate all work, track progress, resolve blockers, validate completion

**Total Duration:** 10 days (throughout project)
**Start:** Day 1, Cycle 1
**Responsibilities:**

### Daily Responsibilities

- Monitor progress across all 4 specialists
- Track cycle completion
- Identify and resolve blockers
- Ensure 6-dimension ontology alignment
- Log events for audit trail
- Answer questions + provide guidance
- Coordinate hand-offs between phases

### Key Milestones to Validate

**Day 2 (Cycle 10):** Vision document approved + ontology validated

- Verify all 6 dimensions mapped
- Approve entity types + event types
- Approve task breakdown
- Gate: All specialists ready to start

**Day 4 (Cycle 30):** Backend schema complete

- Verify schema valid
- All mutations working locally
- Convex types generated
- Gate: Frontend can start integrating

**Day 7 (Cycle 70):** API routes + email ready

- All routes responding
- Email sending working
- Rate limiting active
- Gate: Integration testing can begin

**Day 9 (Cycle 80):** All code complete

- Frontend + backend integrated
- All features working
- No critical bugs
- Gate: Testing complete, ready for deployment

**Day 10-12 (Cycle 91-100):** Deployment + documentation

- Production deployment successful
- Monitoring active
- Documentation complete
- User guides published

### Decision Gates

**Gate 1 (Cycle 10):** Can we proceed with implementation?

- Decision: Approve vision doc + ontology mapping
- If rejected: Rethink feature, return to Phase 1
- If approved: Release all specialists

**Gate 2 (Cycle 30):** Is backend ready for frontend integration?

- Decision: Validate mutations + queries + events
- If not ready: Fix blockers in backend
- If ready: Unblock frontend for API integration

**Gate 3 (Cycle 70):** Is everything integrated correctly?

- Decision: Test full signup → dashboard flow
- If not working: Debug integration issues
- If working: Proceed to testing

**Gate 4 (Cycle 90):** Is quality acceptable for production?

- Decision: Verify tests pass + security audit passed
- If not ready: Fix failing tests + security issues
- If ready: Approve for production

**Gate 5 (Cycle 100):** Is Wave 1 complete?

- Decision: Validate all success criteria
- If not met: Fix remaining issues
- If met: Wave 1 complete, start Wave 2

---

## Dependency Matrix

```
Cycle 1-10 (Foundation)
    ↓ (blocks)
Cycle 11-30 (Backend schema) ← Start alone
    ↓ (blocks)
Cycle 31-50 (Frontend) ← Can start day 3 (parallel)
    ↓ (blocks)
Cycle 51-70 (API routes) ← Needs both above
    ↓ (blocks)
Cycle 71-80 (Integration testing) ← Needs APIs
    ↓ (blocks)
Cycle 81-90 (Quality testing) ← Needs integration
    ↓ (blocks)
Cycle 91-100 (Deployment) ← Needs quality approval
```

**Parallelization Opportunities:**

- Backend + Frontend can run in parallel from Day 3 onward
- Design can run in parallel with frontend
- Documentation can start during testing
- Quality testing can start as soon as code is available

**Sequential Dependencies:**

- Foundation (Cycle 1-10) must complete before anything else
- Backend schema (Cycle 11-30) must complete before API routes
- API routes (Cycle 51-70) must complete before integration testing
- Integration (Cycle 71-80) must complete before quality
- Quality (Cycle 81-90) must complete before deployment

---

## Success Criteria Validation

The Orchestrator must validate ALL of these before marking Wave 1 complete:

**Functional Completeness:**

- [ ] User can sign up with email + password
- [ ] OAuth signup working (Google, GitHub, Discord)
- [ ] Email verification works (code delivery + verification)
- [ ] Profile form complete + avatar upload
- [ ] Workspace creation working
- [ ] Team invitations working (send + accept)
- [ ] Wallet connection optional but functional
- [ ] Skills tagging working
- [ ] Onboarding status tracked
- [ ] All events logged correctly

**User Experience:**

- [ ] 80%+ of test users complete flow
- [ ] Average time < 15 minutes
- [ ] Mobile responsive (70%+ desktop conversion)
- [ ] Accessibility compliant (WCAG 2.1 AA)
- [ ] No critical UI bugs
- [ ] Forms clear + intuitive

**Quality:**

- [ ] 90%+ backend test coverage
- [ ] 85%+ frontend test coverage
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Security audit passed
- [ ] Performance targets met (page load < 2s)
- [ ] No critical bugs
- [ ] No warnings in production logs

**Documentation:**

- [ ] User guides complete
- [ ] API docs complete
- [ ] Developer setup guide complete
- [ ] Deployment checklist complete
- [ ] Troubleshooting guide complete

**Operations:**

- [ ] Live in production
- [ ] Monitoring active
- [ ] Analytics tracking
- [ ] Error tracking configured
- [ ] Rollback plan ready

**Ontology:**

- [ ] All 6 dimensions properly implemented
- [ ] No data scoping issues (group isolation)
- [ ] Events logged for audit trail
- [ ] Connections valid (member_of, owns)
- [ ] Knowledge labels linked to creators

---

## Status Tracking

**Format:** Update daily during standup

```
Daily Standup Template:

COMPLETED CYCLEENCES:
├─ Backend: Cycle 1-15 complete (14%)
├─ Frontend: Cycle 1-10 complete (0%, not started)
├─ Quality: Not started
└─ Design: Cycle 1-5 complete (design specs)

BLOCKERS:
├─ Backend: None
├─ Frontend: Waiting for API routes (unblocks Cycle 71+)
└─ Quality: Waiting for code (unblocks Cycle 81)

RISKS:
├─ Email delivery may need troubleshooting
└─ Mobile responsiveness may need extra day

NEXT 24 HOURS:
├─ Backend: Complete mutations (Cycle 18-25)
├─ Frontend: Complete pages (Cycle 39-50)
├─ Design: Complete wireframes (Cycle 41-45)
└─ Orchestrator: Validate Gate 2 criteria
```

---

## Communication Plan

**Daily Standup:** 15 minutes, 9am

- Each specialist: What done? What blocked? What next?
- Director: Flag risks + dependencies

**Weekly Sync:** 1 hour, end of week

- Review progress against 100-cycle plan
- Adjust timelines if needed
- Plan next week's work

**Blocker Resolution:** As needed

- Slack channel: #wave1-onboarding
- 15-minute huddle to resolve
- Update plan if impact > 1 day

**Final Approval:** Day 11

- Director validates all success criteria
- Specialist signoff (backend, frontend, quality)
- Gate 5 decision: Wave 1 complete or continue

---

## Deliverables Checklist

**Backend Specialist Deliverables:**

- [ ] Updated schema.ts (creator, organization, invitation_token)
- [ ] `/backend/convex/services/onboarding.ts` (service)
- [ ] `/backend/convex/mutations/auth.ts` (signup, verify, profile, wallet, skills)
- [ ] `/backend/convex/mutations/workspace.ts` (workspace, team invitations)
- [ ] `/backend/convex/queries/onboarding.ts` (all queries)
- [ ] Email templates (5 files)
- [ ] Verification system library
- [ ] Rate limiting configured
- [ ] All mutations tested
- [ ] All queries tested
- [ ] API routes (all 25 routes)
- [ ] Email system configured

**Frontend Specialist Deliverables:**

- [ ] SignupForm, EmailVerification, ProfileForm components
- [ ] WorkspaceSetup, WalletConnection, SkillSelection components
- [ ] OnboardingTour, OnboardingChecklist components
- [ ] 8 onboarding pages
- [ ] Team management page
- [ ] Avatar upload, Niche selection components
- [ ] Loading, error, success components
- [ ] Mobile responsive design
- [ ] Accessibility compliance
- [ ] Dark mode support

**Quality Specialist Deliverables:**

- [ ] Backend unit tests (90%+ coverage)
- [ ] Frontend unit tests (85%+ coverage)
- [ ] Integration tests (full flows)
- [ ] E2E tests (real user journeys)
- [ ] Security audit report
- [ ] Accessibility audit report
- [ ] Performance audit report
- [ ] Test coverage reports

**Design/Documentation Specialist Deliverables:**

- [ ] Wireframes (8 pages)
- [ ] Component specifications
- [ ] Brand guidelines
- [ ] Accessibility guidelines
- [ ] User getting-started guide
- [ ] Onboarding step-by-step guide
- [ ] Team management guide
- [ ] Troubleshooting FAQ
- [ ] API documentation (all routes)
- [ ] Developer setup guide
- [ ] Deployment checklist
- [ ] Release notes

**Director/Orchestrator Deliverables:**

- [ ] Wave 1 Vision Document (complete)
- [ ] 100-Cycle Execution Plan (complete)
- [ ] Specialist Assignments (complete)
- [ ] Daily progress tracking
- [ ] Blocker resolution logs
- [ ] Gate approval decisions
- [ ] Event logs (all cycles completed)
- [ ] Lessons learned document

---

## Assignments Summary

| Role        | Cycles                     | Duration | Start                    | Blocks                   |
| ----------- | ------------------------------ | -------- | ------------------------ | ------------------------ |
| Backend     | 40 (11-30, 51-70)              | 10 days  | Day 1                    | Frontend API integration |
| Frontend    | 20 (31-50)                     | 5-6 days | Day 3                    | API routes, deployment   |
| Quality     | 10 (81-90)                     | 2-3 days | Day 8                    | Deployment               |
| Design/Docs | 10 (41-50 design, 91-100 docs) | 5-7 days | Day 1 design, Day 9 docs | None                     |
| Director    | 100 (1-100)                    | 10 days  | Day 1                    | None                     |

**Total Team Effort:** 38 person-days
**Total Calendar Duration:** 10-12 days
**Parallelization Factor:** 3.8x (38 / 10 = 3.8)

---

**Status:** Ready for assignment and execution
**Approved:** Wave 1 Vision Document + Ontology Validation
**Next Step:** Release assignments to specialist agents
