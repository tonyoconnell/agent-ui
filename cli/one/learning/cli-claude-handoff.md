---
title: Cli Claude Handoff
dimension: knowledge
category: cli-claude-handoff.md
tags: ai, installation
related_dimensions: events, groups, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the cli-claude-handoff.md category.
  Location: one/knowledge/cli-claude-handoff.md
  Purpose: Documents cli → claude code handoff
  Related dimensions: events, groups, people
  For AI agents: Read this to understand cli claude handoff.
---

# CLI → Claude Code Handoff

**Version:** 1.0.0
**Purpose:** Define how `npx oneie` CLI coordinates with Claude Code for onboarding and building

---

## The Handoff Flow

```
┌─────────────────┐
│ npx oneie init  │ ← User runs CLI
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ 1. Collect User Info        │
│    - Name                   │
│    - Organization           │
│    - Website URL            │
│    - Email                  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 2. Create Installation      │
│    - /[org-slug]/           │
│    - .env.local             │
│    - onboarding.json        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 3. Launch Claude Code       │
│    $ claude                 │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 4. User Runs /one           │ ← Existing command
│    (reads onboarding.json)  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 5. Claude Analyzes Website  │
│    - agent-onboard          │
│    - WebFetch website       │
│    - Extract brand          │
│    - Generate ontology      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 6. Claude Presents Features │
│    - Shows recommendations  │
│    - User selects           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 7. Claude Builds Platform   │
│    - 100-cycle plan     │
│    - Specialized agents     │
│    - Deploy iteratively     │
└─────────────────────────────┘
```

---

## Phase 1: CLI Collects Information

### User Experience

```bash
$ npx oneie init

     ██████╗ ███╗   ██╗███████╗
    ██╔═══██╗████╗  ██║██╔════╝
    ██║   ██║██╔██╗ ██║█████╗
    ██║   ██║██║╚██╗██║██╔══╝
    ╚██████╔╝██║ ╚████║███████╗
     ╚═════╝ ╚═╝  ╚═══╝╚══════╝

       Make Your Ideas Real

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Welcome! Let's build your platform.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? What's your name? › Tom O'Connor
? Organization name? › ONE Platform
? What's your current website? › https://one.ie
? What email should we use? › tom@one.ie

✅ Information collected!
```

### CLI Actions

```typescript
// cli/src/commands/init.ts
export async function init() {
  const answers = await prompts([
    {
      type: 'text',
      name: 'name',
      message: "What's your name?",
    },
    {
      type: 'text',
      name: 'organizationName',
      message: 'Organization name?',
    },
    {
      type: 'text',
      name: 'websiteUrl',
      message: "What's your current website?",
      validate: (url) => isValidUrl(url) || 'Please enter a valid URL',
    },
    {
      type: 'text',
      name: 'email',
      message: 'What email should we use?',
      validate: (email) => isValidEmail(email) || 'Please enter a valid email',
    },
  ]);

  // Generate org slug
  const orgSlug = slugify(answers.organizationName);

  // Create installation folder
  await createInstallationFolder(orgSlug, answers);

  // Launch Claude Code
  await launchClaude(orgSlug);
}
```

---

## Phase 2: CLI Creates Installation Folder

### Folder Structure Created

```
/one-platform/                    # Installation root
├── .onboarding.json             # Handoff data for Claude
├── .env.local                   # Initial config
└── knowledge/
    └── .gitkeep
```

### `.onboarding.json` (Handoff File)

This is the **key handoff mechanism** - CLI writes it, Claude reads it:

```json
{
  "version": "1.0.0",
  "status": "pending_analysis",
  "timestamp": 1729468800000,

  "user": {
    "name": "Tom O'Connor",
    "email": "tom@one.ie"
  },

  "organization": {
    "name": "ONE Platform",
    "slug": "one-platform"
  },

  "website": {
    "url": "https://one.ie",
    "analyzed": false,
    "brandExtracted": false,
    "ontologyGenerated": false
  },

  "features": {
    "selected": [],
    "recommended": []
  },

  "plan": {
    "cycles": [],
    "status": "not_started"
  }
}
```

### `.env.local` (Initial Config)

```bash
# Organization
INSTALLATION_NAME="one-platform"
ORG_NAME="ONE Platform"
ORG_SLUG="one-platform"
ORG_OWNER_EMAIL="tom@one.ie"
ORG_OWNER_NAME="Tom O'Connor"

# Website to analyze
ONBOARDING_WEBSITE_URL="https://one.ie"

# Status
ONBOARDING_STATUS="pending_analysis"
```

---

## Phase 3: CLI Launches Claude

### CLI Output

```bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created: /one-platform/
Saved: Website URL (https://one.ie)

Next: Let's analyze your website and build your platform!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Launching Claude Code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When Claude starts, run:
  /one

This will analyze your website and recommend features.

Launching Claude...
```

### CLI Implementation

```typescript
async function launchClaude(orgSlug: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Setup Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Created: /${orgSlug}/`);

  const onboarding = await readJSON(`/${orgSlug}/.onboarding.json`);
  console.log(`Saved: Website URL (${onboarding.website.url})\n`);

  console.log('Next: Let\'s analyze your website and build your platform!\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 Launching Claude Code');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('When Claude starts, run:');
  console.log('  /one\n');
  console.log('This will analyze your website and recommend features.\n');

  console.log('Launching Claude...\n');

  // Launch Claude Code
  const claude = spawn('claude', [], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  claude.on('close', (code) => {
    if (code !== 0) {
      console.error('Claude Code exited with error');
    }
  });
}
```

---

## Phase 4: Claude Reads Onboarding Context

### When User Runs `/one`

The existing `.claude/commands/one.md` should be updated to:

1. **Check for `.onboarding.json`** in installation folders
2. **Read onboarding data** if status is `pending_analysis`
3. **Invoke agent-onboard** to analyze website
4. **Update `.onboarding.json`** with results
5. **Present features** for user selection

### Expected `/one` Behavior

```bash
$ /one

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 ONE PLATFORM ONBOARDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Found onboarding context:
   • Organization: ONE Platform
   • Website: https://one.ie
   • Status: Pending analysis

Starting website analysis...

[agent-onboard activates]

[WebFetch] Fetching https://one.ie
[WebFetch] Analyzing content, extracting brand identity

✅ Brand extracted:
   • Primary color: #FF6B6B (Coral)
   • Secondary color: #4ECDC4 (Teal)
   • Logo: /logo.svg
   • Tone: Technical, friendly, empowering

✅ Custom ontology generated:
   • Groups: organizations, teams, projects
   • Things: projects, features, deployments, agents
   • Events: project_created, feature_deployed

[Write] Saving to /one-platform/knowledge/ontology.md
[Edit] Updating .onboarding.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ RECOMMENDED FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on https://one.ie analysis:

FOUNDATION (Always recommended)
  [x] Landing page (Cycle 1-10, ~5 min)
  [x] Authentication (Cycle 11-20, ~10 min)
  [x] Multi-tenant groups (Cycle 21-30, ~10 min)

DETECTED FROM YOUR SITE
  [ ] Real-time sync (Cycle 31-40, ~15 min)
  [ ] Project management (Cycle 41-50, ~15 min)
  [ ] AI agents (Cycle 61-70, ~20 min)

Which features would you like to build?
```

---

## Phase 5: Onboarding JSON State Transitions

### State Flow

```
pending_analysis
  ↓ (after /one reads website)
analyzing
  ↓ (after agent-onboard completes)
features_presented
  ↓ (after user selects features)
plan_generated
  ↓ (after agent-director creates 100-cycle plan)
building
  ↓ (during iterative builds)
completed
```

### Updated `.onboarding.json` After Analysis

```json
{
  "version": "1.0.0",
  "status": "features_presented",
  "timestamp": 1729468800000,

  "user": {
    "name": "Tom O'Connor",
    "email": "tom@one.ie"
  },

  "organization": {
    "name": "ONE Platform",
    "slug": "one-platform"
  },

  "website": {
    "url": "https://one.ie",
    "analyzed": true,
    "analyzedAt": 1729468830000,
    "brandExtracted": true,
    "ontologyGenerated": true
  },

  "brand": {
    "colors": {
      "primary": "#FF6B6B",
      "secondary": "#4ECDC4",
      "accent": "#95E1D3"
    },
    "logo": "/logo.svg",
    "fonts": {
      "heading": "Inter",
      "body": "Inter"
    },
    "voice": "Technical, friendly, empowering",
    "audience": "Developers, creators, entrepreneurs"
  },

  "ontology": {
    "path": "/one-platform/knowledge/ontology.md",
    "groups": ["organization", "team", "project"],
    "people": ["platform_owner", "developer", "creator"],
    "things": ["project", "feature", "deployment", "agent"],
    "connections": ["owns", "collaborates_on", "deployed_to"],
    "events": ["project_created", "feature_deployed", "agent_executed"],
    "knowledge": ["documentation", "pattern", "lesson"]
  },

  "features": {
    "recommended": [
      {
        "id": "landing-page",
        "name": "Landing Page",
        "cycles": [1, 10],
        "duration": "~5 min",
        "required": true
      },
      {
        "id": "authentication",
        "name": "Authentication",
        "cycles": [11, 20],
        "duration": "~10 min",
        "required": true
      },
      {
        "id": "multi-tenant",
        "name": "Multi-Tenant Groups",
        "cycles": [21, 30],
        "duration": "~10 min",
        "required": true
      },
      {
        "id": "real-time-sync",
        "name": "Real-Time Sync",
        "cycles": [31, 40],
        "duration": "~15 min",
        "detected": true,
        "reason": "Detected Convex backend"
      },
      {
        "id": "project-management",
        "name": "Project Management",
        "cycles": [41, 50],
        "duration": "~15 min",
        "detected": true,
        "reason": "Detected project-focused content"
      },
      {
        "id": "ai-agents",
        "name": "AI Agents",
        "cycles": [61, 70],
        "duration": "~20 min",
        "detected": true,
        "reason": "Detected AI/agent mentions"
      }
    ],
    "selected": []
  },

  "plan": {
    "cycles": [],
    "status": "not_started"
  }
}
```

---

## Phase 6: User Selects Features

### Interactive Selection (In Claude)

User can respond with feature selections:

```
I want: landing page, authentication, multi-tenant, and ai-agents
```

### Claude Updates `.onboarding.json`

```json
{
  "status": "plan_generated",

  "features": {
    "selected": [
      "landing-page",
      "authentication",
      "multi-tenant",
      "ai-agents"
    ]
  },

  "plan": {
    "status": "ready",
    "totalCycles": 70,
    "estimatedDuration": "~50 min",
    "phases": [
      {
        "name": "Landing Page",
        "cycles": [1, 10],
        "specialist": "agent-frontend",
        "status": "pending"
      },
      {
        "name": "Authentication",
        "cycles": [11, 20],
        "specialist": "agent-backend",
        "status": "pending"
      },
      {
        "name": "Multi-Tenant Groups",
        "cycles": [21, 30],
        "specialist": "agent-backend",
        "status": "pending"
      },
      {
        "name": "AI Agents",
        "cycles": [61, 70],
        "specialist": "agent-builder",
        "status": "pending"
      },
      {
        "name": "Deploy & Document",
        "cycles": [91, 100],
        "specialist": "agent-ops",
        "status": "pending"
      }
    ]
  }
}
```

---

## Phase 7: Claude Builds Platform

### agent-director Coordinates

1. **Reads plan** from `.onboarding.json`
2. **Invokes specialists** for each phase
3. **Updates status** after each cycle
4. **Deploys iteratively** (landing page first, then features)
5. **Notifies user** after each milestone

### Status Updates in `.onboarding.json`

```json
{
  "status": "building",

  "plan": {
    "status": "in_progress",
    "currentCycle": 23,
    "totalCycles": 70,
    "progress": 32.8,

    "phases": [
      {
        "name": "Landing Page",
        "status": "completed",
        "completedAt": 1729468900000,
        "url": "https://one-platform.pages.dev"
      },
      {
        "name": "Authentication",
        "status": "completed",
        "completedAt": 1729469500000
      },
      {
        "name": "Multi-Tenant Groups",
        "status": "in_progress",
        "startedAt": 1729469600000
      },
      {
        "name": "AI Agents",
        "status": "pending"
      },
      {
        "name": "Deploy & Document",
        "status": "pending"
      }
    ]
  }
}
```

---

## Key Design Decisions

### 1. `.onboarding.json` is the Source of Truth
- CLI writes initial data
- Claude reads and updates it
- Tracks state throughout entire process
- Enables resumption if interrupted

### 2. Separation of Concerns
- **CLI**: User interaction, folder setup, launch Claude
- **Claude + /one**: Analysis, feature selection, building
- **agent-onboard**: Website analysis
- **agent-director**: Build coordination
- **Specialized agents**: Feature implementation

### 3. Existing `/one` Command Enhanced
- Check for `.onboarding.json`
- If found and status is `pending_analysis`, start onboarding flow
- If not found, normal `/one` behavior
- Backwards compatible

### 4. Transparent Progress
- User sees cycle progress (23/70)
- Status updates in `.onboarding.json`
- URLs appear as features go live
- Can check progress anytime

---

## Implementation Checklist

### CLI Side (`npx oneie`)
- [ ] Implement `init` command with prompts
- [ ] Create installation folder structure
- [ ] Generate `.onboarding.json` handoff file
- [ ] Write initial `.env.local`
- [ ] Launch `claude` command
- [ ] Display instructions for user

### Claude Side (`/one` command)
- [ ] Read `.onboarding.json` if exists
- [ ] Check onboarding status
- [ ] Invoke agent-onboard for website analysis
- [ ] Extract brand identity (colors, logo, fonts)
- [ ] Generate custom ontology
- [ ] Write ontology to installation folder
- [ ] Update `.onboarding.json` with results
- [ ] Present recommended features
- [ ] Accept user feature selection
- [ ] Generate 100-cycle plan
- [ ] Invoke agent-director to execute plan

### Agent Side
- [ ] agent-onboard: Website analysis logic
- [ ] agent-director: Plan generation and coordination
- [ ] agent-frontend: Landing page, UI features
- [ ] agent-backend: Auth, multi-tenancy, data
- [ ] agent-ops: Deployment automation
- [ ] agent-documenter: Knowledge capture

---

## Example Complete Flow

```bash
# Terminal 1: User runs CLI
$ npx oneie init

? Name: Tom O'Connor
? Org: ONE Platform
? Website: https://one.ie
? Email: tom@one.ie

✅ Setup complete!
Created: /one-platform/
Saved: Website URL

🤖 Launching Claude Code...

# Claude starts automatically
# User sees Claude Code interface

# Terminal 2: Claude Code
$ /one

🚀 ONE PLATFORM ONBOARDING

✅ Found onboarding context
Starting analysis...

[5 seconds later]

✅ Analysis complete!

Recommended features:
  [x] Landing page (Cycle 1-10)
  [x] Authentication (Cycle 11-20)
  [x] Multi-tenant (Cycle 21-30)
  [ ] Real-time sync (Cycle 31-40)
  [ ] AI agents (Cycle 61-70)

Which features? › landing page, authentication, multi-tenant, ai-agents

✅ Plan generated: 70 cycles, ~50 min

Ready to build? › Yes

🚀 Starting build...

[Cycle 1/70] Validate ontology
[Cycle 2/70] Map landing page
...
[Cycle 10/70] Deploy landing page

✨ Landing page LIVE: https://one-platform.pages.dev

[Continues building...]
```

---

**This handoff design is clean, stateful, and enables seamless CLI → Claude collaboration!** 🚀
