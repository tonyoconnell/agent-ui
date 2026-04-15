---
title: Wave1 Onboarding 100 Cycles
dimension: things
category: plans
tags: agent, ai, backend, claude, frontend, cycle, ontology, testing
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/wave1-onboarding-100-cycles.md
  Purpose: Documents wave 1: creator onboarding - 100-cycle execution plan
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand wave1 onboarding 100 cycles.
---

# Wave 1: Creator Onboarding - 100-Cycle Execution Plan

**Version:** 1.0.0
**Total Cycles:** 100 (Cycle 1-100)
**Estimated Duration:** 10-12 days (8-10 cycles per specialist per day)
**Team:** 4 specialists + 1 orchestrator (director)

---

## Overview: The 100-Cycle Breakdown

```
Cycle 1-10:     FOUNDATION & ONTOLOGY VALIDATION
Cycle 11-20:    BACKEND SCHEMA & SERVICES
Cycle 21-30:    BACKEND MUTATIONS & QUERIES
Cycle 31-40:    FRONTEND PAGES & COMPONENTS (Part 1)
Cycle 41-50:    FRONTEND PAGES & COMPONENTS (Part 2)
Cycle 51-60:    API ROUTES & INTEGRATIONS
Cycle 61-70:    EMAIL & VERIFICATION SYSTEM
Cycle 71-80:    TEAM MANAGEMENT & WORKSPACE
Cycle 81-90:    TESTING & QUALITY ASSURANCE
Cycle 91-100:   DEPLOYMENT & DOCUMENTATION
```

Each phase has dependencies clearly marked. **Bold dependencies** block downstream work.

---

## PHASE 1: FOUNDATION & VALIDATION (Cycle 1-10)

**Specialist:** Agent-Director (Orchestration)
**Duration:** 1-2 days
**Output:** Approved vision, ontology mapping, task lists

### Cycle 1: Confirm 6-Dimension Ontology Alignment

**Task:** Validate onboarding maps to ALL 6 dimensions

**Checklist:**

- [ ] Groups dimension: Workspace group creation ✓
- [ ] People dimension: Creator person + team roles ✓
- [ ] Things dimension: Creator, workspace, tokens, preferences ✓
- [ ] Connections dimension: member_of, owns, transacted ✓
- [ ] Events dimension: user_registered, email_verified, profile_updated, etc ✓
- [ ] Knowledge dimension: Skill labels, interest labels, taxonomy ✓

**Deliverable:** `/wave1-onboarding-vision.md` (completed)
**Status:** ✅ COMPLETE

**Decision Gate:**

- If ANY dimension missing → Rethink feature
- If all aligned → Proceed to Cycle 2

---

### Cycle 2: Define Complete Entity Types

**Task:** Specify exact properties for creator, workspace, invitation tokens

**Creator Properties:**

```typescript
{
  type: 'creator',
  name: string,
  properties: {
    email: string,
    username: string,
    displayName: string,
    bio: string,
    avatar: string,

    // Profile
    niche: string[],  // [fitness, education, business]
    expertise: string[],  // Skills
    interests: string[],  // Topics

    // Workspace
    workspaceId: Id<'groups'>,
    workspaces: Id<'groups'>[],
    role: 'owner' | 'admin' | 'editor',

    // Wallet
    walletAddress: string,
    walletVerified: boolean,
    walletConnectedAt: number,

    // Onboarding
    onboardingStep: 'signup' | 'verify' | 'profile' | 'workspace' | 'team' | 'wallet' | 'skills' | 'complete',
    onboardingCompleted: boolean,
    onboardingCompletedAt: number,
    onboardingTourStarted: boolean,
    onboardingTourCompleted: boolean,

    // Settings
    emailVerified: boolean,
    emailVerifiedAt: number,
    twoFactorEnabled: boolean,
    preferredLanguage: string,
    timezone: string,

    // Stats
    totalTeamMembers: number,
    totalContentCreated: number,
    totalEarnings: number,

    // Terms
    agreeToTerms: boolean,
    agreeToPrivacy: boolean,
    marketingEmails: boolean,
  }
}
```

**Organization (Workspace) Properties:**

```typescript
{
  type: 'organization',
  name: string,
  properties: {
    slug: string,
    description: string,
    logo: string,
    visibility: 'private' | 'public',
    joinPolicy: 'invite_only' | 'open',
    memberCount: number,
    maxMembers: number,
    plan: 'free' | 'pro' | 'enterprise',
    planUpgradedAt: number,
    stripeCustomerId: string,
    billingEmail: string,
    defaultLanguage: string,
    defaultTimezone: string,
  }
}
```

**Invitation Token Properties:**

```typescript
{
  type: 'invitation_token',
  name: string,
  properties: {
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
}
```

**Deliverable:** Type specification document
**Status:** ✅ COMPLETE (from vision doc)

---

### Cycle 3: Define Event Types to Log

**Task:** List all events that need logging during onboarding

**Event Types to Create:**

1. `user_registered` - Signup form submitted
2. `email_verification_sent` - Code sent to email
3. `email_verified` - Email confirmed
4. `profile_updated` - Profile form submitted
5. `thing_created` (thingType: organization) - Workspace created
6. `user_invited_to_group` - Team member invited
7. `user_joined_group` - Team member accepted invitation
8. `wallet_connected` - Crypto wallet linked
9. `thing_updated` (thingType: creator) - Skills added
10. `onboarding_completed` - Full journey done

**Event Logging Strategy:**

- Every state transition → event logged
- Metadata captures context (source, device, values changed)
- Timestamp precise (milliseconds)
- Actor ID always logged (who did this)

**Deliverable:** Event specification
**Status:** ✅ COMPLETE

---

### Cycle 4: Define Connection Types

**Task:** Specify relationships that onboarding creates

**Connections to Create:**

1. **Creator → Workspace Group (member_of)**

   ```
   {
     fromThingId: creatorId,
     toThingId: workspaceGroupId,
     relationshipType: 'member_of',
     metadata: {
       role: 'group_owner',
       permissions: ['*'],
       joinedAt: Date.now(),
     }
   }
   ```

2. **Team Member → Workspace Group (member_of)**
   ```
   {
     fromThingId: teamMemberId,
     toThingId: workspaceGroupId,
     relationshipType: 'member_of',
     metadata: {
       role: 'group_user',
       permissions: ['read', 'write'],
       invitedBy: creatorId,
       invitedAt: Date.now(),
       status: 'pending' | 'active',
     }
   }
   ```

**Deliverable:** Connection specification
**Status:** ✅ COMPLETE

---

### Cycle 5: Define Knowledge Labels

**Task:** Specify skill + interest taxonomy for tagging

**Skill Label Categories:**

```
Prefix: skill:*
  skill:video-editing
  skill:copywriting
  skill:social-media
  skill:graphic-design
  skill:course-creation
  skill:podcast-production
  skill:community-management
  skill:sales-funnel
  skill:email-marketing
  skill:seo
  ... (100+ predefined skills)

Prefix: industry:*
  industry:fitness
  industry:education
  industry:finance
  industry:entertainment
  industry:ecommerce
  industry:marketing
  industry:technology
  industry:wellness
  ... (50+ predefined industries)

Prefix: goal:*
  goal:income
  goal:audience
  goal:collaboration
  goal:learning
  goal:brand-building
  goal:automation

Prefix: interest:*
  interest:personal-branding
  interest:monetization
  interest:ai-automation
  interest:team-management
  interest:content-distribution
  ... (free-form, user-created)
```

**Knowledge Pattern:**

```typescript
// Create knowledge item for each skill
{
  knowledgeType: 'label',
  text: 'Video Editing',
  labels: ['skill:video-editing', 'category:technical'],
  metadata: { category: 'skill', searchable: true }
}

// Link creator to knowledge
{
  thingId: creatorId,
  knowledgeId: skillLabelId,
  role: 'label',
  metadata: { proficiency: 'intermediate' }
}
```

**Deliverable:** Taxonomy specification
**Status:** ✅ COMPLETE

---

### Cycle 6: Create Implementation Checklist

**Task:** Break down into manageable tasks for specialists

**Backend Tasks (Cycle 11-30):**

- [ ] Extend creator entity type
- [ ] Extend organization entity type
- [ ] Create invitation_token entity type
- [ ] Create onboarding service (Effect.ts)
- [ ] Create signup mutation
- [ ] Create email verification mutation
- [ ] Create profile update mutation
- [ ] Create workspace creation mutation
- [ ] Create team invitation mutation
- [ ] Create invitation acceptance mutation
- [ ] Create wallet connection mutation
- [ ] Create skill tagging mutation
- [ ] Create all queries (status, users, workspaces, members)
- [ ] Set up email templates (Resend)
- [ ] Create verification system (codes, tokens, expiry)
- [ ] Create rate limiting rules

**Frontend Tasks (Cycle 31-50):**

- [ ] Create SignupForm component
- [ ] Create EmailVerification component
- [ ] Create ProfileForm component
- [ ] Create WorkspaceSetup component
- [ ] Create WalletConnection component
- [ ] Create SkillSelection component
- [ ] Create OnboardingTour component
- [ ] Create OnboardingChecklist component
- [ ] Create onboarding pages (8 Astro pages)
- [ ] Create team management page
- [ ] Create API routes (signup, verify, profile, workspace, team)
- [ ] Create auth middleware
- [ ] Create redirect logic

**Quality Tasks (Cycle 81-90):**

- [ ] Write unit tests (mutations, services)
- [ ] Write integration tests (full flows)
- [ ] Write E2E tests (signup to dashboard)
- [ ] Create test accounts + fixtures
- [ ] Run accessibility audit
- [ ] Run performance audit
- [ ] Run security audit

**Designer Tasks (Cycle 41-60 parallel):**

- [ ] Create wireframes for 8 stages
- [ ] Design component specs
- [ ] Create accessibility guide
- [ ] Design mobile layouts

**Documentation Tasks (Cycle 91-100):**

- [ ] User guide
- [ ] API documentation
- [ ] Developer setup guide
- [ ] Deployment checklist

**Deliverable:** Complete task breakdown
**Status:** ✅ COMPLETE

---

### Cycle 7-10: Reserve for Blockers/Contingency

**Task:** Leave buffer for unexpected issues

**Possible issues:**

- Better Auth integration complexity
- Rate limiting complexity
- Email delivery problems
- Database index optimization
- Security review findings
- Performance optimization
- Mobile responsiveness issues

**Reserve:** 4 cycles (4 days of buffer)

---

## PHASE 2: BACKEND SCHEMA & SERVICES (Cycle 11-30)

**Specialist:** Agent-Backend
**Duration:** 3-4 days (20 cycles)
**Dependency:** ✅ Phase 1 complete
**Blocks:** Phase 3 (can't build frontend without backend mutations)

### Cycle 11-12: Extend Creator Entity Type

**Task:** Update `schema.ts` to include all creator properties

**Files to modify:**

- `/backend/convex/schema.ts` - Add creator properties to entities table

**Deliverable:** Updated schema with creator type
**Output file:** `/backend/convex/schema.ts`
**Status:** Ready for implementation

### Cycle 13-14: Extend Organization Entity Type

**Task:** Add organization properties (workspace)

**Files to modify:**

- `/backend/convex/schema.ts` - Add organization properties

**Deliverable:** Updated schema with organization type
**Status:** Ready for implementation

### Cycle 15-16: Create Invitation Token Type

**Task:** Add invitation_token entity type

**Files to modify:**

- `/backend/convex/schema.ts` - Add invitation_token type

**Deliverable:** Updated schema with invitation_token type
**Status:** Ready for implementation

### Cycle 17: Create Onboarding Service (Effect.ts)

**Task:** Build pure business logic service

**File to create:** `/backend/convex/services/onboarding.ts`

**Methods:**

```typescript
export interface OnboardingService {
  registerUser(email: string, password: string): Effect<CreatorEntity>;
  sendVerificationEmail(userId: Id<"things">, email: string): Effect<void>;
  verifyEmail(
    userId: Id<"things">,
    code: string,
  ): Effect<{ verified: boolean }>;
  updateProfile(userId: Id<"things">, data: ProfileData): Effect<CreatorEntity>;
  createWorkspace(
    userId: Id<"things">,
    name: string,
  ): Effect<OrganizationEntity>;
  inviteTeamMember(
    userId: Id<"things">,
    workspaceId: Id<"groups">,
    email: string,
    role: string,
  ): Effect<void>;
  acceptInvitation(token: string): Effect<{ joined: boolean }>;
  connectWallet(
    userId: Id<"things">,
    address: string,
  ): Effect<{ verified: boolean }>;
  addSkills(userId: Id<"things">, skills: string[]): Effect<CreatorEntity>;
  completeOnboarding(userId: Id<"things">): Effect<{ completed: boolean }>;
}
```

**Deliverable:** Onboarding service with all business logic
**Status:** Ready for implementation

### Cycle 18: Create Signup Mutation

**Task:** Implement `signUp` mutation (call Better Auth + Convex)

**File to create:** `/backend/convex/mutations/auth.ts`

```typescript
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    agreeToTerms: v.boolean(),
    agreeToPrivacy: v.boolean(),
  },
  handler: async (ctx, args) => {
    // 1. Validate email doesn't exist
    // 2. Hash password
    // 3. Create user in Better Auth
    // 4. Create creator entity
    // 5. Log user_registered event
    // 6. Return user + session
  },
});
```

**Deliverable:** Working signup mutation
**Status:** Ready for implementation

### Cycle 19: Create Email Verification Mutation

**Task:** Implement `verifyEmail` mutation

**File to update:** `/backend/convex/mutations/auth.ts`

```typescript
export const verifyEmail = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Validate code format + expiry
    // 2. Find matching verification token
    // 3. Mark creator as emailVerified
    // 4. Log email_verified event
    // 5. Return success
  },
});
```

**Deliverable:** Email verification mutation
**Status:** Ready for implementation

### Cycle 20: Create Profile Update Mutation

**Task:** Implement `updateProfile` mutation

**File to update:** `/backend/convex/mutations/auth.ts`

```typescript
export const updateProfile = mutation({
  args: {
    displayName: v.string(),
    username: v.string(),
    bio: v.string(),
    niche: v.array(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Validate username is unique
    // 2. Upload avatar if provided
    // 3. Update creator properties
    // 4. Log profile_updated event
    // 5. Return updated creator
  },
});
```

**Deliverable:** Profile update mutation
**Status:** Ready for implementation

### Cycle 21: Create Workspace Creation Mutation

**Task:** Implement `createWorkspace` mutation

**File to create:** `/backend/convex/mutations/workspace.ts`

```typescript
export const createWorkspace = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    visibility: v.union(v.literal("private"), v.literal("public")),
  },
  handler: async (ctx, args) => {
    // 1. Validate slug is unique
    // 2. Create group entity
    // 3. Create member_of connection (creator → workspace)
    // 4. Update creator.workspaceId
    // 5. Log thing_created event
    // 6. Return workspace
  },
});
```

**Deliverable:** Workspace creation mutation
**Status:** Ready for implementation

### Cycle 22: Create Team Invitation Mutation

**Task:** Implement `inviteTeamMember` mutation

**File to update:** `/backend/convex/mutations/workspace.ts`

```typescript
export const inviteTeamMember = mutation({
  args: {
    workspaceId: v.id("groups"),
    email: v.string(),
    role: v.union(v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    // 1. Validate workspace exists + user is owner
    // 2. Generate invitation token
    // 3. Create invitation_token entity
    // 4. Send invitation email
    // 5. Log user_invited_to_group event
    // 6. Return invitation
  },
});
```

**Deliverable:** Team invitation mutation
**Status:** Ready for implementation

### Cycle 23: Create Invitation Acceptance Mutation

**Task:** Implement `acceptInvitation` mutation

**File to update:** `/backend/convex/mutations/workspace.ts`

```typescript
export const acceptInvitation = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Find invitation by token
    // 2. Check if expired
    // 3. Get or create user for email
    // 4. Create member_of connection
    // 5. Mark invitation as accepted
    // 6. Log user_joined_group event
    // 7. Return success
  },
});
```

**Deliverable:** Invitation acceptance mutation
**Status:** Ready for implementation

### Cycle 24: Create Wallet Connection Mutation

**Task:** Implement `connectWallet` mutation

**File to update:** `/backend/convex/mutations/auth.ts`

```typescript
export const connectWallet = mutation({
  args: {
    address: v.string(),
    signature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Validate Ethereum address format
    // 2. Optionally verify signature
    // 3. Update creator.walletAddress
    // 4. Update creator.walletVerified
    // 5. Log wallet_connected event
    // 6. Return success
  },
});
```

**Deliverable:** Wallet connection mutation
**Status:** Ready for implementation

### Cycle 25: Create Skill Tagging Mutation

**Task:** Implement `addSkills` mutation

**File to update:** `/backend/convex/mutations/auth.ts`

```typescript
export const addSkills = mutation({
  args: {
    skills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Validate skills exist in taxonomy
    // 2. Get or create knowledge items for each skill
    // 3. Link creator to knowledge items
    // 4. Update creator.expertise
    // 5. Log thing_updated event
    // 6. Return updated creator
  },
});
```

**Deliverable:** Skill tagging mutation
**Status:** Ready for implementation

### Cycle 26: Create Onboarding Status Queries

**Task:** Implement queries for onboarding data

**File to create:** `/backend/convex/queries/onboarding.ts`

```typescript
export const getCurrentUser = query({ ... })  // Get current user + workspace
export const getOnboardingStatus = query({ ... })  // Get step + completion %
export const checkUsernameAvailable = query({ ... })  // Is username taken?
export const checkEmailExists = query({ ... })  // Does email exist?
export const getWorkspaceMembers = query({ ... })  // List workspace members
export const getPendingInvitations = query({ ... })  // List pending invites
export const getUserWorkspaces = query({ ... })  // List user's workspaces
```

**Deliverable:** All onboarding queries
**Status:** Ready for implementation

### Cycle 27: Create Email Templates

**Task:** Build email templates with Resend

**Files to create:**

- `/backend/convex/emails/welcome.email.tsx`
- `/backend/convex/emails/verify-email.email.tsx`
- `/backend/convex/emails/team-invite.email.tsx`
- `/backend/convex/emails/password-reset.email.tsx`

**Email Content:**

1. **Welcome:** "Welcome to ONE! Complete your profile to get started"
2. **Verify Email:** "Your 6-digit code: {code} (valid for 10 minutes)"
3. **Team Invite:** "You're invited to join {workspace}! {invite_link}"
4. **Password Reset:** "Reset your password: {reset_link} (valid for 30 minutes)"

**Deliverable:** All email templates
**Status:** Ready for implementation

### Cycle 28: Create Verification System

**Task:** Build verification code + token system

**File to create:** `/backend/convex/lib/verification.ts`

```typescript
export function generateVerificationCode(): string; // 6-digit code
export function generateVerificationLink(): string; // unique URL
export function verifyCode(code: string): boolean;
export function verifyLink(token: string): boolean;
export function rateLimit(email: string): boolean; // 5/hour
export function generateInvitationToken(): string; // for team invites
```

**Deliverable:** Verification utilities
**Status:** Ready for implementation

### Cycle 29: Set Up Rate Limiting

**Task:** Configure rate limiting for signup, verification

**Mutations to rate limit:**

- signUp (5 per IP per hour)
- sendVerificationEmail (5 per email per hour)
- inviteTeamMember (20 per workspace per day)
- connectWallet (5 per user per day)

**Deliverable:** Rate limiting configured
**Status:** Ready for implementation

### Cycle 30: Setup Complete - Backend Ready

**Task:** Final backend validation before frontend starts

**Checklist:**

- [ ] All mutations tested locally
- [ ] All queries working
- [ ] Email templates rendering
- [ ] Rate limiting active
- [ ] Events logging
- [ ] Schema validated

**Deliverable:** Backend production-ready
**Status:** ✅ Frontend can now start (parallel from Cycle 31)

---

## PHASE 3: FRONTEND COMPONENTS & PAGES (Cycle 31-50)

**Specialist:** Agent-Frontend
**Duration:** 3-4 days (20 cycles)
**Dependency:** ✅ Phase 2 (backend mutations/queries complete)
**Blocks:** API routes (Cycle 51-60)

### Cycle 31: Create SignupForm Component

**Task:** Build signup form with email/password + OAuth

**File to create:** `/web/src/components/onboarding/SignupForm.tsx`

**Features:**

- Email input (with validation)
- Password input (with strength meter)
- "I agree to terms" checkbox
- OAuth buttons (Google, GitHub, Discord)
- Error handling
- Loading state
- Success redirect

**Deliverable:** Working signup form component
**Status:** Ready for implementation

### Cycle 32: Create EmailVerification Component

**Task:** Build 6-digit code input

**File to create:** `/web/src/components/onboarding/EmailVerification.tsx`

**Features:**

- 6 separate input fields (auto-focus, auto-submit)
- "Check email" message
- Resend button (with 30s cooldown)
- Error messages
- Loading state
- Success animation

**Deliverable:** Email verification component
**Status:** Ready for implementation

### Cycle 33: Create ProfileForm Component

**Task:** Build profile completion form

**File to create:** `/web/src/components/onboarding/ProfileForm.tsx`

**Fields:**

- Avatar upload (preview, drag-drop)
- Display name
- Username (with slug preview: one.ie/@username)
- Bio (textarea, char counter)
- Niche selection (multi-select)
- Validation (unique username, bio < 500 chars)
- Save & Continue button

**Deliverable:** Profile form component
**Status:** Ready for implementation

### Cycle 34: Create WorkspaceSetup Component

**Task:** Build workspace creation UI

**File to create:** `/web/src/components/onboarding/WorkspaceSetup.tsx`

**Options:**

- Option A: "I'm solo" → Personal workspace
- Option B: "I manage a team" → Team workspace setup
- If team: Name workspace + invite members (email list)
- Save & Continue button

**Deliverable:** Workspace setup component
**Status:** Ready for implementation

### Cycle 35: Create WalletConnection Component

**Task:** Build optional wallet connection UI

**File to create:** `/web/src/components/onboarding/WalletConnection.tsx`

**Features:**

- Why wallet needed (explanation)
- "Connect Wallet" button
- Wallet options (MetaMask, Rainbow Kit, WalletConnect)
- "Skip for now" link
- Connected state (show address, verified checkmark, disconnect button)
- Uses wagmi/viem hooks

**Deliverable:** Wallet connection component
**Status:** Ready for implementation

### Cycle 36: Create SkillSelection Component

**Task:** Build skill/expertise tagging UI

**File to create:** `/web/src/components/onboarding/SkillSelection.tsx`

**Features:**

- Grouped skill tags (education, fitness, tech, etc)
- Multi-select (checkboxes)
- Add custom skill (free text)
- Save & Continue button
- Pre-populate from niche if selected

**Deliverable:** Skill selection component
**Status:** Ready for implementation

### Cycle 37: Create OnboardingTour Component

**Task:** Build interactive guided tour

**File to create:** `/web/src/components/onboarding/OnboardingTour.tsx`

**Steps:**

1. Welcome - Intro + features
2. Create content - Show editor
3. Manage team - Show team page
4. Monetize - Show X402 + pricing
5. Analytics - Show dashboard
6. What's next - Call to action

**Features:**

- Skip anytime
- Highlight UI elements
- Progress indicator (step X of 6)
- Next/Back buttons
- Show/hide on demand

**Deliverable:** Onboarding tour component
**Status:** Ready for implementation

### Cycle 38: Create OnboardingChecklist Component

**Task:** Build first-day quick wins checklist

**File to create:** `/web/src/components/onboarding/OnboardingChecklist.tsx`

**Checklist items:**

- Profile 80% complete
- Email verified
- Workspace created
- Team member invited (or solo)
- Wallet connected (encouraged)
- First skill added

**Features:**

- Progress bar (X/6 complete)
- Checkmarks + links to incomplete items
- Completion reward/badge
- Show next steps

**Deliverable:** Onboarding checklist component
**Status:** Ready for implementation

### Cycle 39: Create Onboarding Pages (Part 1)

**Task:** Build 4 Astro pages for onboarding flow

**Files to create:**

- `/web/src/pages/onboarding/index.astro` - Main entry
- `/web/src/pages/onboarding/signup.astro` - Signup form
- `/web/src/pages/onboarding/verify.astro` - Email verification
- `/web/src/pages/onboarding/profile.astro` - Profile form

**Features:**

- All `client:load` (interactive)
- Form validation
- Redirect on auth failure
- Progress indicator
- Mobile responsive

**Deliverable:** 4 onboarding pages
**Status:** Ready for implementation

### Cycle 40: Create Onboarding Pages (Part 2)

**Task:** Build remaining 4 Astro pages

**Files to create:**

- `/web/src/pages/onboarding/workspace.astro` - Workspace setup
- `/web/src/pages/onboarding/wallet.astro` - Wallet connection
- `/web/src/pages/onboarding/skills.astro` - Skill selection
- `/web/src/pages/onboarding/complete.astro` - Success + tour

**Features:**

- All `client:load`
- Progress tracking
- Skip options
- Redirect to dashboard when complete
- Mobile responsive

**Deliverable:** 4 more onboarding pages
**Status:** Ready for implementation

### Cycle 41: Create Team Management Page

**Task:** Build workspace settings page for team management

**File to create:** `/web/src/pages/workspace/settings/team.astro`

**Sections:**

- Members list (table)
- Invite new member form
- Pending invitations
- Member role/permissions modal
- Remove member button

**Actions:**

- Invite by email
- Change member role
- Remove member
- Resend invitation
- View activity

**Deliverable:** Team management page
**Status:** Ready for implementation

### Cycle 42: Create Avatar Upload Component

**Task:** Build avatar upload with preview

**File to create:** `/web/src/components/onboarding/AvatarUpload.tsx`

**Features:**

- Drag-drop + click upload
- Image preview
- Cropping (optional)
- Size validation (< 5MB)
- Format validation (jpg, png, webp)
- Upload to cloud storage

**Deliverable:** Avatar upload component
**Status:** Ready for implementation

### Cycle 43: Create Niche Selection Component

**Task:** Build niche/category multi-select

**File to create:** `/web/src/components/onboarding/NicheSelection.tsx`

**Features:**

- Grouped categories (fitness, education, tech, etc)
- Multi-select (checkboxes)
- Descriptions on hover
- Search/filter
- Pre-population logic

**Deliverable:** Niche selection component
**Status:** Ready for implementation

### Cycle 44: Create Loading States

**Task:** Add loading spinners + skeleton screens

**Components:**

- Form submit spinner
- Email sending indicator
- Page loading skeleton
- Image upload progress

**Deliverable:** Loading components
**Status:** Ready for implementation

### Cycle 45: Create Error Handling

**Task:** Build error display + recovery UI

**Features:**

- Error toast notifications
- Field-level error messages
- Retry buttons
- Clear error messaging
- Helpful recovery steps

**Deliverable:** Error handling components
**Status:** Ready for implementation

### Cycle 46: Create Success Animations

**Task:** Add celebration animations

**Animations:**

- Email verified checkmark
- Workspace created success
- Profile completed celebration
- Full onboarding completion confetti

**Deliverable:** Success animation components
**Status:** Ready for implementation

### Cycle 47: Create Mobile Responsive Design

**Task:** Optimize all components for mobile

**Checklist:**

- [ ] All forms mobile-friendly
- [ ] Avatar upload works on mobile
- [ ] Code input optimized for mobile keyboard
- [ ] Buttons large enough (48px min)
- [ ] Text readable on small screens
- [ ] No horizontal scroll

**Deliverable:** Mobile-optimized components
**Status:** Ready for implementation

### Cycle 48: Create Accessibility Features

**Task:** Add WCAG 2.1 AA compliance

**Features:**

- Proper labels + aria-labels
- Keyboard navigation
- Color contrast (4.5:1 minimum)
- Focus indicators
- Reduced motion support
- Screen reader friendly

**Deliverable:** Accessible components
**Status:** Ready for implementation

### Cycle 49: Create Dark Mode Support

**Task:** Add dark theme support

**Features:**

- Color scheme aware
- Stored preference
- System preference detection
- Toggle in settings

**Deliverable:** Dark mode theme
**Status:** Ready for implementation

### Cycle 50: Frontend Complete - Ready for API

**Task:** Final frontend validation

**Checklist:**

- [ ] All 8 onboarding pages working
- [ ] Team management page working
- [ ] All components rendering
- [ ] Mobile responsive
- [ ] Accessibility compliant
- [ ] Ready to connect to API routes

**Deliverable:** Production-ready frontend
**Status:** ✅ Ready for API routes (Cycle 51)

---

## PHASE 4: API ROUTES & INTEGRATION (Cycle 51-80)

**Specialist:** Agent-Integration / Agent-Backend
**Duration:** 3-4 days (30 cycles)
**Dependency:** ✅ Phase 2 (backend) + Phase 3 (frontend) complete
**Blocks:** Testing (Cycle 81-90)

### Cycle 51-60: Create API Routes

**Task:** Build HTTP endpoints connecting frontend to backend

**Routes to create:**

```
/api/auth/signup              POST    Register new user
/api/auth/verify-email        POST    Verify email with code
/api/auth/resend-verification POST    Resend verification code
/api/auth/login               POST    Login (email/password)

/api/profile/get              GET     Get current user profile
/api/profile/update           POST    Update profile
/api/profile/upload-avatar    POST    Upload avatar image

/api/workspace/create         POST    Create workspace
/api/workspace/list           GET     List user's workspaces
/api/workspace/[id]/get       GET     Get workspace details
/api/workspace/[id]/update    POST    Update workspace

/api/team/invite              POST    Invite team member
/api/team/accept-invitation   POST    Accept invite (with token)
/api/team/[workspace]/members GET     List workspace members
/api/team/[workspace]/pending GET     List pending invitations
/api/team/[workspace]/role    POST    Change member role
/api/team/[workspace]/remove  POST    Remove team member

/api/wallet/connect           POST    Connect crypto wallet
/api/wallet/verify            POST    Verify wallet signature

/api/skills/add               POST    Add skills to creator
/api/skills/list              GET     Get available skills

/api/onboarding/status        GET     Get onboarding progress
/api/onboarding/step          POST    Update onboarding step
```

Each route:

- Validates input
- Calls Convex mutation/query
- Handles errors
- Returns JSON
- Logs events

**Deliverable:** All API routes functional
**Status:** Ready for implementation

### Cycle 61-70: Email System Setup

**Task:** Configure email sending with Resend

**Setup:**

- Resend API key configured
- Email templates created
- Verification code system
- Rate limiting (prevent spam)
- Tracking (opens, clicks)

**Emails sent:**

1. Welcome email (after signup)
2. Verification code (6-digit)
3. Team invitation
4. Password reset
5. Onboarding reminder (if abandoned)

**Deliverable:** Email system ready
**Status:** Ready for implementation

### Cycle 71-80: Integration Testing

**Task:** Test frontend → API → backend → database flow

**Test scenarios:**

1. Signup flow (email + password)
2. Email verification
3. Profile completion
4. Workspace creation
5. Team invitation + acceptance
6. Wallet connection
7. Skill tagging
8. Full journey (signup to dashboard)

**Each scenario:**

- Test happy path
- Test error cases
- Test validation
- Test rate limiting
- Verify events logged
- Verify database state

**Deliverable:** Integration tests passing
**Status:** Ready for implementation

---

## PHASE 5: TESTING & QUALITY (Cycle 81-90)

**Specialist:** Agent-Quality
**Duration:** 2-3 days (10 cycles)
**Dependency:** ✅ Phase 4 complete
**Blocks:** Documentation (Cycle 91-100)

### Cycle 81-82: Unit Tests (Backend)

**Task:** Test mutations, queries, services in isolation

**Coverage:**

- Onboarding service (all methods)
- Verification system
- Rate limiting
- Email generation

**Target:** 90%+ coverage

**Deliverable:** Unit tests passing
**Status:** Ready for implementation

### Cycle 83-84: Unit Tests (Frontend)

**Task:** Test React components in isolation

**Coverage:**

- SignupForm validation
- EmailVerification logic
- ProfileForm validation
- WorkspaceSetup routing
- All form components

**Target:** 85%+ coverage

**Deliverable:** Frontend unit tests passing
**Status:** Ready for implementation

### Cycle 85-86: Integration Tests

**Task:** Test full signup → dashboard flow

**Scenarios:**

1. Complete signup in < 10 minutes
2. Verify email delivery timing
3. Workspace creation triggers event
4. Team invitation generates token
5. Skill tagging links to knowledge

**Deliverable:** Integration tests passing
**Status:** Ready for implementation

### Cycle 87-88: E2E Tests

**Task:** Test full user journey in browser

**Scenarios:**

1. New user signup → dashboard access
2. Team member invitation → acceptance → join workspace
3. Wallet connection flow
4. Onboarding checklist completion

**Tools:** Playwright or Cypress

**Deliverable:** E2E tests passing
**Status:** Ready for implementation

### Cycle 89: Security + Accessibility Audit

**Task:** Verify security + accessibility compliance

**Security checks:**

- SQL injection prevention
- XSS protection
- CSRF tokens
- Password hashing
- Email verification required before action

**Accessibility checks:**

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader testing
- Color contrast
- Focus management

**Deliverable:** Audit report + fixes
**Status:** Ready for implementation

### Cycle 90: Performance Audit

**Task:** Verify performance targets met

**Metrics:**

- Page load: < 2s
- Form submit: < 1s
- Email delivery: < 30s
- Mobile performance: 70%+ of desktop
- Lighthouse score: > 85

**Deliverable:** Performance report
**Status:** Ready for implementation

---

## PHASE 6: DEPLOYMENT & DOCUMENTATION (Cycle 91-100)

**Specialist:** Agent-Ops + Agent-Documenter
**Duration:** 1-2 days (10 cycles)
**Dependency:** ✅ Phase 5 complete

### Cycle 91-92: Create User Documentation

**Files:**

- `/docs/getting-started.md` - For new creators
- `/docs/onboarding-guide.md` - Step-by-step walkthrough
- `/docs/team-management.md` - How to manage team
- `/docs/troubleshooting.md` - Common issues + fixes

**Deliverable:** User guides complete
**Status:** Ready for implementation

### Cycle 93-94: Create API Documentation

**Files:**

- `/docs/api/auth.md` - Auth endpoints
- `/docs/api/profile.md` - Profile endpoints
- `/docs/api/workspace.md` - Workspace endpoints
- `/docs/api/team.md` - Team endpoints
- `/docs/api/errors.md` - Error codes + meanings

**Content:**

- Endpoint description
- Request/response examples
- Curl examples
- Error codes
- Rate limits

**Deliverable:** API docs complete
**Status:** Ready for implementation

### Cycle 95: Create Developer Setup Guide

**File:** `/docs/developer-setup.md`

**Content:**

- Clone repo
- Install dependencies
- Environment variables
- Run dev server
- Run tests
- Deploy to staging

**Deliverable:** Setup guide complete
**Status:** Ready for implementation

### Cycle 96: Create Deployment Checklist

**File:** `/DEPLOYMENT.md`

**Checklist:**

- [ ] All tests passing
- [ ] Security audit passed
- [ ] Performance targets met
- [ ] Accessibility compliant
- [ ] Staging environment tested
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Customer notification sent
- [ ] Analytics tracking active

**Deliverable:** Deployment ready
**Status:** Ready for implementation

### Cycle 97-98: Deploy to Production

**Task:** Deploy backend + frontend to production

**Steps:**

1. Deploy backend to Convex Cloud
2. Deploy frontend to Cloudflare Pages
3. Run smoke tests in production
4. Monitor for errors
5. Track key metrics

**Deliverable:** Live production deployment
**Status:** Ready for implementation

### Cycle 99: Monitor + Optimize

**Task:** Monitor production for issues

**Metrics to track:**

- Signup completion rate
- Email delivery rate
- API error rate
- Page load performance
- User feedback

**Optimizations:**

- Fix any performance issues
- Improve UX based on usage
- Fix any bugs found

**Deliverable:** Monitoring active
**Status:** Ready for implementation

### Cycle 100: Wave 1 Complete - Lessons Learned

**Task:** Document lessons for Wave 2

**Document:**

- What worked well
- What was harder than expected
- What would improve next time
- Infrastructure learnings
- Team productivity notes

**Deliverable:** Lessons learned document
**Status:** Ready for implementation

---

## Parallel Execution Strategy

Some phases can run **simultaneously** (not sequentially):

```
Timeline:

Day 1-2:   Cycle 1-10 (Foundation)
           └─ All specialists align on ontology

Day 3:     Cycle 11-20 (Backend schema)
           └─ Only backend specialist

Day 4-5:   Cycle 21-30 (Backend mutations + Cycle 31-50 (Frontend components)
           └─ Backend + Frontend IN PARALLEL
           ├─ Backend: Finish mutations/queries
           └─ Frontend: Build components

Day 6:     Cycle 51-70 (API routes + Email)
           └─ Integration specialist starts
           └─ Backend: API route creation
           └─ Frontend: Component completion

Day 7:     Cycle 71-80 (Integration testing)
           └─ All work tested together

Day 8:     Cycle 81-90 (Quality + Security)
           └─ Quality specialist validates

Day 9-10:  Cycle 91-100 (Deployment + Docs)
           └─ Deploy to production
           └─ Create user/API documentation

TOTAL: 10 days (more like 1.5 weeks with buffers)
```

**Key:** Backend must be ready by Day 6 before API routes. Frontend must be ready by Day 5 for API integration.

---

## Specialist Assignments

### Agent-Backend (Cycle 11-30 + 51-70)

**40 cycles total**

- Schema updates (Cycle 11-16)
- Onboarding service (Cycle 17)
- All mutations (Cycle 18-25)
- All queries (Cycle 26)
- Email templates (Cycle 27)
- Verification system (Cycle 28)
- Rate limiting (Cycle 29)
- API route creation (Cycle 51-60)
- Email system setup (Cycle 61-70)

### Agent-Frontend (Cycle 31-50)

**20 cycles total**

- All 8 onboarding components (Cycle 31-38)
- 8 onboarding pages (Cycle 39-40)
- Team management page (Cycle 41)
- Avatar upload (Cycle 42)
- Niche selection (Cycle 43)
- Loading states (Cycle 44)
- Error handling (Cycle 45)
- Success animations (Cycle 46)
- Mobile responsive (Cycle 47)
- Accessibility (Cycle 48)
- Dark mode (Cycle 49)
- Final validation (Cycle 50)

### Agent-Quality (Cycle 81-90)

**10 cycles total**

- Backend unit tests (Cycle 81-82)
- Frontend unit tests (Cycle 83-84)
- Integration tests (Cycle 85-86)
- E2E tests (Cycle 87-88)
- Security + accessibility audit (Cycle 89)
- Performance audit (Cycle 90)

### Agent-Ops / Agent-Documenter (Cycle 91-100)

**10 cycles total**

- User documentation (Cycle 91-92)
- API documentation (Cycle 93-94)
- Developer setup (Cycle 95)
- Deployment checklist (Cycle 96)
- Production deployment (Cycle 97-98)
- Monitoring (Cycle 99)
- Lessons learned (Cycle 100)

### Agent-Director (Orchestrator)

**Throughout**

- Progress tracking
- Blocker resolution
- Specialist coordination
- Event logging
- Completion validation

---

## Success Criteria for Wave 1 Complete

All of these must be ✅ before Wave 1 is marked done:

- ✅ User can register with email + password
- ✅ OAuth signup works (Google, GitHub, Discord)
- ✅ Email verification working (code sent + verified)
- ✅ Profile form complete + avatar upload
- ✅ Workspace creation working
- ✅ Team member invitations working (send + accept)
- ✅ Wallet connection optional but functional
- ✅ Skills/expertise tagging working
- ✅ Onboarding status tracked (events logged)
- ✅ 80%+ of test users complete flow
- ✅ Average time < 15 minutes
- ✅ Mobile-responsive (70%+ desktop conversion)
- ✅ WCAG 2.1 AA accessibility
- ✅ New creator can access dashboard
- ✅ Team features tested + working
- ✅ Complete audit trail (all events logged)
- ✅ API documented
- ✅ User guides created
- ✅ Deployment checklist complete
- ✅ Live in production

---

## Risk Mitigation

**Potential blockers & solutions:**

| Risk                               | Likelihood | Impact | Mitigation                             |
| ---------------------------------- | ---------- | ------ | -------------------------------------- |
| Better Auth integration complexity | Medium     | High   | Have 2 backend specialists ready       |
| Email delivery delays              | Low        | Medium | Use Resend sandbox for testing         |
| Rate limiting issues               | Low        | Medium | Start simple, iterate based on testing |
| Mobile UI responsive issues        | Medium     | Medium | Test early + often on real devices     |
| Database performance               | Low        | Medium | Index optimization, pre-optimize       |
| Security vulnerabilities           | Low        | High   | Early security audit, follow OWASP     |

---

## Estimated Resource Requirements

| Resource                | Quantity | Days               |
| ----------------------- | -------- | ------------------ |
| Backend Specialist      | 1        | 10 days            |
| Frontend Specialist     | 1        | 10 days            |
| Quality Specialist      | 1        | 3 days             |
| Designer/Documenter     | 1        | 5 days             |
| Orchestrator (Director) | 1        | 10 days            |
| **Total Person-Days**   | **5**    | **38 person-days** |

**Actual Calendar Time:** 10-12 days (due to parallelization)

---

**Status:** Ready for implementation
**Approved:** Engineering Director
**Start Date:** Immediate (Cycle 1)
**Expected Completion:** +10-12 calendar days
