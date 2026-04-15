---
title: Todo Onboard
dimension: things
primary_dimension: people
category: todo-onboard.md
tags: agent, ai, cycle, ontology, people
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-onboard.md category.
  Location: one/things/todo-onboard.md
  Purpose: Documents one platform: creator onboarding & team management v1.0.0
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand todo onboard.
---

# ONE Platform: Creator Onboarding & Team Management v1.0.0

**Focus:** Seamless creator registration, wallet setup, team collaboration
**Process:** `Cycle 1-100 cycle sequence`
**Timeline:** 8-12 cycles per specialist per day
**Target:** Foundation for all platform features (Wave 1 - Critical Path)

---

## PHASE 1: FOUNDATION & SETUP (Cycle 1-10)

**Purpose:** Understand onboarding landscape, map to ontology, plan implementation

### Cycle 1: Validate Onboarding Requirements

- [ ] Define target personas:
  - [ ] **Solo Creator:** YouTuber, podcaster, author (want to sell content)
  - [ ] **Agency Owner:** Manage team of creators (want to coordinate)
  - [ ] **AI Agent Developer:** Build + deploy agents (want to integrate)
  - [ ] **Merchant:** Sell products via marketplace (want customers)
- [ ] For each persona, identify:
  - [ ] Why they join
  - [ ] First 5 minutes experience
  - [ ] First day goals
  - [ ] First week goals
- [ ] Document personas in: `one/people/onboard-personas.md`

### Cycle 2: Map Onboarding to 6-Dimension Ontology

- [ ] **Groups:** Creator's workspace group created
- [ ] **People:** Creator registered as person, assigned role
- [ ] **Things:** creator thing, organization thing, wallet thing
- [ ] **Connections:** creator → group (member_of), creator → organization (owns)
- [ ] **Events:** user_registered, email_verified, wallet_connected
- [ ] **Knowledge:** skill labels, expertise labels, interest labels
- [ ] Design onboarding as journey through ontology

### Cycle 3: Review Existing Auth Infrastructure

- [ ] Examine Better Auth setup in `/web` + `/backend`
- [ ] Check existing auth methods:
  - [ ] Email + password
  - [ ] OAuth (GitHub, Google, Discord)
  - [ ] Magic links
  - [ ] 2FA/MFA
- [ ] Plan additions for onboarding:
  - [ ] Wallet connection (viem/wagmi for X402)
  - [ ] Phone verification (optional)
  - [ ] Social media verification (optional)

### Cycle 4: Define Onboarding Flow Stages

- [ ] **Stage 1 (Pre-Auth):** Landing page → Sign up form
- [ ] **Stage 2 (Auth):** Email verification + password
- [ ] **Stage 3 (Profile):** Name, avatar, bio, niche
- [ ] **Stage 4 (Workspace):** Create workspace group + invite team
- [ ] **Stage 5 (Wallet):** Connect crypto wallet (optional but recommended)
- [ ] **Stage 6 (Skills):** Select expertise areas + interests
- [ ] **Stage 7 (Goals):** Set platform goals (monetize, collaborate, learn)
- [ ] **Stage 8 (Welcome):** Dashboard intro + quick wins
- [ ] **Completion:** Creator ready to create/sell/earn
- [ ] Each stage should take < 2 minutes

### Cycle 5: Define Team Management Requirements

- [ ] Workspace = group with members
- [ ] Roles in workspace:
  - [ ] **Owner:** Full permissions, billing, members
  - [ ] **Admin:** Members, content, settings (not billing)
  - [ ] **Editor:** Create + edit content
  - [ ] **Viewer:** View only (for external users)
- [ ] Team features:
  - [ ] Invite via email
  - [ ] Pending invitations
  - [ ] Revoke access
  - [ ] Change roles
  - [ ] Set member permissions

### Cycle 6: Define Wallet Connection Flow

- [ ] Why wallet needed:
  - [ ] Receive X402 payments
  - [ ] Claim earned tokens
  - [ ] Participate in DAO (future)
- [ ] Flow:
  1. Show benefit of wallet connection
  2. User clicks "Connect Wallet"
  3. MetaMask/Rainbow Kit prompts connection
  4. Confirm wallet address
  5. Optional: Sign message to verify ownership
  6. Store wallet address in creator properties
  7. Show success message
- [ ] Make optional but encourage in tour

### Cycle 7: Plan Onboarding Tour (Guided Experience)

- [ ] Build interactive tour showing:
  - [ ] Where to create content
  - [ ] Where to manage team
  - [ ] Where to set up monetization
  - [ ] Where to view analytics
  - [ ] Where to integrate agents
- [ ] Highlights:
  - [ ] Interactive tooltips
  - [ ] Demo endpoints
  - [ ] Quick action buttons
  - [ ] Can skip at any time
- [ ] Track completion in Convex

### Cycle 8: Design Quick Win for First Day

- [ ] First-day checklist:
  - [ ] [ ] Profile 80% complete
  - [ ] [ ] Wallet connected
  - [ ] [ ] First skill added
  - [ ] [ ] First content viewed (not created yet)
  - [ ] [ ] Team member invited
- [ ] Reward on completion:
  - [ ] 🎉 Badge: "Welcome to ONE"
  - [ ] Unlock dashboard features
  - [ ] 100 bonus tokens (for testing)
- [ ] Goal: Creator feels successful + confident

### Cycle 9: Identify Integration Points

- [ ] Onboarding touches:
  - [ ] **Convex:** User thing created, group created, connections
  - [ ] **Better Auth:** User account creation
  - [ ] **Email:** Verification + welcome email
  - [ ] **Wallet:** viem client for connection
  - [ ] **Analytics:** Track onboarding funnel
  - [ ] **X402:** Optionally connect payment wallet
- [ ] Ensure smooth handoff to each system

### Cycle 10: Define Success Metrics

- [ ] Onboarding complete when:
  - [ ] [ ] Email verified
  - [ ] [ ] Profile filled (name, avatar, niche)
  - [ ] [ ] Workspace created
  - [ ] [ ] First team member invited OR opted to solo
  - [ ] [ ] Wallet connected (encouraged)
  - [ ] [ ] Skill added
  - [ ] [ ] Dashboard tour started
- [ ] Tracking:
  - [ ] Funnel: Signup → Verify → Profile → Workspace → Team → Skills → Ready
  - [ ] Dropoff at each stage
  - [ ] Time in each stage
  - [ ] Completion rate
- [ ] Target: 80%+ completion, < 15 min total time

---

## PHASE 2: BACKEND SCHEMA & SERVICES (Cycle 11-20)

**Purpose:** Update Convex schema for onboarding

### Cycle 11: Extend Creator Thing Type

- [ ] Update `backend/convex/schema.ts` creator properties:

  ```typescript
  {
    type: 'creator',
    properties: {
      email: string,
      username: string,  // Unique, URL-safe
      displayName: string,
      bio: string,
      avatar: string,  // Avatar URL

      // Niche + Expertise
      niche: string[],  // [fitness, education, business]
      expertise: string[],  // Skills
      interests: string[],  // Topics of interest

      // Workspace
      workspaceId: Id<'groups'>,  // Primary workspace
      workspaces: Id<'groups'>[],  // All workspaces
      role: 'owner' | 'admin' | 'editor',  // Role in primary workspace

      // Wallet
      walletAddress: string,  // Crypto wallet
      walletVerified: boolean,
      walletConnectedAt: number,

      // Onboarding
      onboardingStep: 'signup' | 'verify' | 'profile' | 'workspace' | 'team' | 'wallet' | 'skills' | 'goals' | 'complete',
      onboardingCompleted: boolean,
      onboardingCompletedAt: number,
      onboardingTourStarted: boolean,
      onboardingTourCompleted: boolean,

      // Settings
      emailVerified: boolean,
      emailVerifiedAt: number,
      twoFactorEnabled: boolean,
      preferredLanguage: string,  // 'en', 'es', etc
      timezone: string,

      // Stats
      totalTeamMembers: number,
      totalContentCreated: number,
      totalEarnings: number,

      // Platform
      agreeToTerms: boolean,
      agreeToPrivacy: boolean,
      marketingEmails: boolean,
    }
  }
  ```

### Cycle 12: Create Workspace (Group) Schema

- [ ] Workspaces are `groups` with type 'organization'
- [ ] Update group schema for workspace features:

  ```typescript
  {
    type: 'organization',
    properties: {
      // Identification
      name: string,
      slug: string,  // Unique URL: one.ie/workspace/slug
      description: string,
      logo: string,  // Logo URL

      // Workspace settings
      visibility: 'private' | 'public',  // Private for creator, public for agency
      joinPolicy: 'invite_only' | 'open',  // How others join

      // Team
      memberCount: number,
      maxMembers: number,  // Upgrade limit

      // Plan
      plan: 'free' | 'pro' | 'enterprise',
      planUpgradedAt: number,

      // Billing
      stripeCustomerId: string,
      billingEmail: string,
      billingAddress: string,

      // Settings
      defaultLanguage: string,
      defaultTimezone: string,
      allowPublicJoin: boolean,
      requireEmailDomain: string[],  // Optional: allowed domains
    }
  }
  ```

### Cycle 13: Create Team Member Connections

- [ ] Team member = person → group relationship
- [ ] Connection type: `member_of` with metadata
- [ ] Connection metadata:
  ```typescript
  {
    role: 'owner' | 'admin' | 'editor' | 'viewer',
    permissions: string[],  // Specific permissions
    invitedBy: Id<'things'>,  // Who invited
    invitedAt: number,
    joinedAt: number,  // When accepted invitation
    status: 'pending' | 'active' | 'inactive',
    lastActiveAt: number,
  }
  ```

### Cycle 14: Create Onboarding Event Types

- [ ] Add to events table:
  - [ ] `user_registered` - New user signup
  - [ ] `email_verification_sent` - Verification email sent
  - [ ] `email_verified` - Email confirmed
  - [ ] `profile_completed` - Profile step done
  - [ ] `workspace_created` - Workspace created
  - [ ] `team_member_invited` - Team invite sent
  - [ ] `team_member_joined` - Invite accepted
  - [ ] `wallet_connected` - Wallet linked
  - [ ] `skill_added` - Expertise tagged
  - [ ] `onboarding_completed` - Full onboarding done
- [ ] Event logging strategy:
  - [ ] Log every transition
  - [ ] Capture metadata (source, device, etc)
  - [ ] Use for analytics + funnel tracking

### Cycle 15: Create Invite Token System

- [ ] New thing type: `invitation_token`
- [ ] Properties:
  ```typescript
  {
    type: 'invitation_token',
    properties: {
      token: string,  // Unique token
      invitedBy: Id<'things'>,  // Creator who invited
      invitedEmail: string,  // Recipient email
      workspaceId: Id<'groups'>,  // Workspace being invited to
      role: 'editor' | 'viewer',  // Role if accepted
      status: 'pending' | 'accepted' | 'expired',
      expiresAt: number,  // 7 days
      acceptedAt: number,
      acceptedBy: Id<'things'>,  // Who accepted
    }
  }
  ```

### Cycle 16: Create Onboarding Service (Effect.ts)

- [ ] Create `backend/convex/services/onboarding.ts`
- [ ] Service methods:
  - [ ] `registerUser()` → Create user + emit event
  - [ ] `sendVerificationEmail()` → Queue email
  - [ ] `verifyEmail()` → Confirm + update status
  - [ ] `updateProfile()` → Fill profile fields
  - [ ] `createWorkspace()` → Create group
  - [ ] `inviteTeamMember()` → Generate invitation
  - [ ] `acceptInvitation()` → Add member to group
  - [ ] `connectWallet()` → Link crypto wallet
  - [ ] `addSkills()` → Tag expertise + interests
  - [ ] `completeOnboarding()` → Mark as complete

### Cycle 17: Create Convex Mutations

- [ ] `mutations/onboarding.ts`:
  - [ ] `registerUser(email, password)` → user created
  - [ ] `sendVerificationEmail(userId)` → email queued
  - [ ] `verifyEmail(userId, code)` → verified
  - [ ] `updateProfile(userId, data)` → profile updated
  - [ ] `createWorkspace(userId, name)` → workspace created
  - [ ] `updateOnboardingStep(userId, step)` → step updated
- [ ] `mutations/teams.ts`:
  - [ ] `inviteTeamMember(workspaceId, email, role)` → invitation created
  - [ ] `acceptTeamInvitation(token)` → member joined
  - [ ] `removeTeamMember(workspaceId, memberId)` → removed
  - [ ] `updateMemberRole(workspaceId, memberId, role)` → role changed

### Cycle 18: Create Convex Queries

- [ ] `queries/onboarding.ts`:
  - [ ] `getCurrentUser()` → current user + workspace
  - [ ] `getOnboardingStatus(userId)` → step + completion %
  - [ ] `checkUsernameAvailable(username)` → true/false
  - [ ] `checkEmailExists(email)` → true/false
- [ ] `queries/teams.ts`:
  - [ ] `getWorkspaceMembers(workspaceId)` → list
  - [ ] `getPendingInvitations(workspaceId)` → list
  - [ ] `getUserWorkspaces(userId)` → list

### Cycle 19: Create Email Templates

- [ ] Create `backend/convex/emails/`
  - [ ] `welcome.email.tsx` - Welcome to ONE
  - [ ] `verify-email.email.tsx` - Confirm email + link
  - [ ] `team-invite.email.tsx` - Join team invitation
  - [ ] `password-reset.email.tsx` - Reset link
  - [ ] `onboarding-reminder.email.tsx` - Complete profile
- [ ] Use `@convex-dev/resend` for sending
- [ ] Personalize with user name + workspace name

### Cycle 20: Set Up Verification System

- [ ] Create `backend/convex/lib/verification.ts`
- [ ] Functions:
  - [ ] `generateVerificationCode()` → 6-digit code
  - [ ] `generateVerificationLink()` → unique URL
  - [ ] `verifyCode(code)` → true/false + validity check
  - [ ] `verifyLink(token)` → true/false + consume link
  - [ ] `rateLimit(email)` → prevent spam (5 attempts/hour)

---

## PHASE 3: FRONTEND COMPONENTS & PAGES (Cycle 21-30)

**Purpose:** Build signup → dashboard journey in React/Astro

### Cycle 21: Create SignupForm Component

- [ ] Component: `web/src/components/onboarding/SignupForm.tsx`
- [ ] Fields:
  - [ ] Email input (validate format)
  - [ ] Password input (show strength meter)
  - [ ] "I agree to terms" checkbox
  - [ ] Submit button
  - [ ] Link to login
- [ ] Behavior:
  - [ ] Validate before submit
  - [ ] Show loading spinner
  - [ ] Handle errors (email exists, etc)
  - [ ] Success → Redirect to email verification

### Cycle 22: Create EmailVerification Component

- [ ] Component: `web/src/components/onboarding/EmailVerification.tsx`
- [ ] Display:
  - [ ] Message: "Check email for verification code"
  - [ ] 6-digit code input (auto-focus, auto-submit)
  - [ ] Resend code button (with cooldown)
  - [ ] Back link
- [ ] Behavior:
  - [ ] Auto-submit when 6 digits entered
  - [ ] Show verification spinner
  - [ ] Success → Show checkmark + proceed
  - [ ] Error → Show which digit is wrong
  - [ ] Expired → Show resend option

### Cycle 23: Create ProfileForm Component

- [ ] Component: `web/src/components/onboarding/ProfileForm.tsx`
- [ ] Form fields:
  - [ ] Avatar upload (with preview)
  - [ ] Display name
  - [ ] Username (with slug preview: one.ie/@username)
  - [ ] Bio (textarea, character count)
  - [ ] Niche selection (multi-select dropdown)
  - [ ] Save & Continue button
- [ ] Validation:
  - [ ] Username unique + URL-safe
  - [ ] Bio < 500 chars
  - [ ] Avatar < 5MB, image format

### Cycle 24: Create WorkspaceSetup Component

- [ ] Component: `web/src/components/onboarding/WorkspaceSetup.tsx`
- [ ] Options:
  - [ ] "I'm solo" → Create personal workspace
  - [ ] "I manage a team" → Create team workspace
- [ ] If team:
  - [ ] Workspace name input
  - [ ] Invite team members (email list)
- [ ] Success → Workspace created

### Cycle 25: Create WalletConnection Component

- [ ] Component: `web/src/components/onboarding/WalletConnection.tsx`
- [ ] Display:
  - [ ] Why wallet needed (earn with X402)
  - [ ] "Connect Wallet" button
  - [ ] Show available wallets (MetaMask, Rainbow, etc)
  - [ ] "Skip for now" link
- [ ] Connected state:
  - [ ] Show wallet address (short format)
  - [ ] Show verified checkmark
  - [ ] Button to disconnect
- [ ] Uses wagmi hooks

### Cycle 26: Create SkillSelection Component

- [ ] Component: `web/src/components/onboarding/SkillSelection.tsx`
- [ ] Display:
  - [ ] Grouped skill tags (education, fitness, tech, etc)
  - [ ] Multi-select (check boxes)
  - [ ] Add custom skill (free text)
  - [ ] Save & Continue
- [ ] Behavior:
  - [ ] Pre-populate if user has niche selected
  - [ ] Show skill descriptions on hover

### Cycle 27: Create OnboardingTour Component

- [ ] Component: `web/src/components/onboarding/OnboardingTour.tsx`
- [ ] Interactive steps:
  1. "Welcome!" - Intro + features
  2. "Create content" - Show editor
  3. "Manage team" - Show team page
  4. "Monetize" - Show X402 + pricing
  5. "Analytics" - Show dashboard
  6. "What's next?" - Call to action
- [ ] Features:
  - [ ] Can skip any time
  - [ ] Highlight relevant UI elements
  - [ ] Show progress (step X of 6)
  - [ ] Next/Back buttons

### Cycle 28: Create OnboardingChecklist Component

- [ ] Component: `web/src/components/onboarding/OnboardingChecklist.tsx`
- [ ] Checklist items:
  - [ ] Profile 80% complete (name, avatar, niche)
  - [ ] Email verified
  - [ ] Workspace created
  - [ ] Team member invited (optional)
  - [ ] Wallet connected (encouraged)
  - [ ] First skill added
- [ ] Visual:
  - [ ] Progress bar (6/6 items)
  - [ ] Checkmarks for completed
  - [ ] Links to incomplete items
  - [ ] Completion reward (badge)

### Cycle 29: Create Onboarding Pages (Astro)

- [ ] `web/src/pages/onboarding/index.astro` - Main entry
- [ ] `web/src/pages/onboarding/signup.astro` - Signup form
- [ ] `web/src/pages/onboarding/verify.astro` - Email verification
- [ ] `web/src/pages/onboarding/profile.astro` - Profile form
- [ ] `web/src/pages/onboarding/workspace.astro` - Workspace setup
- [ ] `web/src/pages/onboarding/wallet.astro` - Wallet connection
- [ ] `web/src/pages/onboarding/skills.astro` - Skill selection
- [ ] `web/src/pages/onboarding/complete.astro` - Success + tour
- [ ] Navigation:
  - [ ] All pages client:load
  - [ ] Form validation on client
  - [ ] Redirect on auth failure
  - [ ] Redirect to dashboard when complete

### Cycle 30: Create Team Management Page

- [ ] `web/src/pages/workspace/settings/team.astro`
- [ ] Components:
  - [ ] Members list table
  - [ ] Invite new member form
  - [ ] Pending invitations section
  - [ ] Member role/permissions modal
- [ ] Actions:
  - [ ] Invite by email
  - [ ] Change member role
  - [ ] Remove member
  - [ ] Resend invitation
  - [ ] View member activity

---

## PHASE 4: INTEGRATION & API ROUTES (Cycle 31-40)

**Purpose:** Connect frontend to backend

### Cycle 31: Create Auth API Routes

- [ ] `web/src/pages/api/auth/signup.ts`
- [ ] `web/src/pages/api/auth/verify.ts`
- [ ] `web/src/pages/api/auth/resend-verification.ts`
- [ ] Each validates + calls Convex mutation
- [ ] Returns user object + auth token

### Cycle 32: Create Profile API Routes

- [ ] `web/src/pages/api/profile/update.ts`
- [ ] `web/src/pages/api/profile/get.ts`
- [ ] `web/src/pages/api/profile/upload-avatar.ts`
- [ ] Avatar upload handling (multipart form data)

### Cycle 33: Create Workspace API Routes

- [ ] `web/src/pages/api/workspace/create.ts`
- [ ] `web/src/pages/api/workspace/list.ts`
- [ ] `web/src/pages/api/workspace/[workspaceId]/get.ts`
- [ ] `web/src/pages/api/workspace/[workspaceId]/update.ts`

### Cycle 34: Create Team API Routes

- [ ] `web/src/pages/api/team/invite.ts`
- [ ] `web/src/pages/api/team/accept-invitation.ts`
- [ ] `web/src/pages/api/team/[workspaceId]/members.ts`
- [ ] `web/src/pages/api/team/[workspaceId]/pending.ts`
- [ ] `web/src/pages/api/team/[workspaceId]/update-role.ts`
- [ ] `web/src/pages/api/team/[workspaceId]/remove.ts`

### Cycle 35: Create Wallet API Route

- [ ] `web/src/pages/api/wallet/connect.ts`
- [ ] Verify wallet signature
- [ ] Store wallet address
- [ ] Return success

### Cycle 36: Create Skill API Routes

- [ ] `web/src/pages/api/skills/add.ts`
- [ ] `web/src/pages/api/skills/list.ts`
- [ ] `web/src/pages/api/skills/remove.ts`

### Cycle 37: Create Email Verification Route

- [ ] `web/src/pages/api/email/send-verification.ts`
- [ ] `web/src/pages/api/email/verify-code.ts`
- [ ] `web/src/pages/api/email/verify-link.ts`

### Cycle 38: Create Onboarding Status Route

- [ ] `web/src/pages/api/onboarding/status.ts` - GET
- [ ] `web/src/pages/api/onboarding/step.ts` - POST (update step)
- [ ] Returns:
  ```typescript
  {
    currentStep: string,
    completedSteps: string[],
    isComplete: boolean,
    percentComplete: number,
  }
  ```

### Cycle 39: Create Redirect Logic

- [ ] Auth middleware for all dashboard routes
- [ ] If not logged in → Redirect to /onboarding
- [ ] If not verified → Redirect to /onboarding/verify
- [ ] If not complete → Redirect to next step
- [ ] If complete → Allow access

### Cycle 40: Create API Documentation

- [ ] Document all auth + onboarding endpoints
- [ ] Curl examples
- [ ] Error codes
- [ ] Rate limits

---

## PHASE 5-10: CONTINUATION

Each phase follows same pattern:

- **Phase 5:** Testing (unit, integration, E2E)
- **Phase 6:** Design + UX finalization
- **Phase 7:** Performance + optimization
- **Phase 8:** Deployment + monitoring
- **Phase 9:** Documentation
- **Phase 10:** Lessons learned

[Abbreviated for space - Full 100 cycles follows same structure as todo-x402.md]

---

## SUCCESS CRITERIA

Onboarding is complete when:

- ✅ User can register with email + password
- ✅ Email verification working
- ✅ Profile form complete
- ✅ Workspace creation functional
- ✅ Team member invitations working
- ✅ Wallet connection optional but encouraged
- ✅ Skills/expertise tagging functional
- ✅ 80%+ of users complete onboarding
- ✅ Average time < 15 minutes
- ✅ Funnel dropoff tracked + optimized
- ✅ New creator can access dashboard + create content
- ✅ Team features tested (invite, roles, permissions)

---

**Status:** Wave 1 - Critical Path Foundation
**Next:** todo-agents.md (Wave 2 - Parallel with skills + sell)
