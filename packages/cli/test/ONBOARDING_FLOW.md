# Onboarding Flow Implementation

## Overview

This document describes the complete onboarding flow from `npx oneie init` through Claude Code building the platform.

## Phase 1: CLI Initialization (`npx oneie init`)

### User Interaction

```bash
$ npx oneie init

╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║    ██████╗ ███╗   ██╗███████╗    Turn ideas into reality         ║
║   ██╔═══██╗████╗  ██║██╔════╝                                    ║
║   ██║   ██║██╔██╗ ██║█████╗      https://one.ie                  ║
║   ██║   ██║██║╚██╗██║██╔══╝                                      ║
║   ╚██████╔╝██║ ╚████║███████╗    npx oneie                       ║
║    ╚═════╝ ╚═╝  ╚═══╝╚══════╝                                    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Welcome! Let's build your platform.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? What's your name? › Tom O'Connor
? Organization name? › ONE Platform
? What's your current website? › https://one.ie
? What email should we use? › tom@one.ie

✅ Information collected!
```

### What the CLI Does

1. **Collects 4 pieces of information:**
   - User name (for personalization)
   - Organization name (will be slugified)
   - Website URL (required - will be analyzed)
   - Email address (for notifications)

2. **Generates organization slug:**
   - `"ONE Platform"` → `"one-platform"`
   - Used as installation folder name

3. **Creates installation folder:**
   ```
   /one-platform/
   ├── .onboarding.json      # Handoff file for Claude
   ├── groups/               # Empty (populated by Claude)
   ├── people/               # Empty
   ├── things/               # Empty
   ├── connections/          # Empty
   ├── events/               # Empty
   └── knowledge/            # Empty (will contain ontology.md)
   ```

4. **Creates `.onboarding.json` handoff file:**
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
       "inferences": [],
       "status": "not_started"
     }
   }
   ```

5. **Updates `.env.local`:**
   ```bash
   # Installation Configuration
   INSTALLATION_NAME=one-platform
   ```

6. **Updates `.gitignore`:**
   ```
   # Installation folder (private docs)
   /one-platform/
   ```

7. **Launches Claude Code:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ Setup Complete!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Created: /one-platform

   Next: Let's analyze your website and build your platform!

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🤖 Launching Claude Code
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   When Claude starts, run:
     /one

   This will analyze your website and recommend features.

   Launching Claude...
   ```

## Phase 2: Claude Code Analysis (`/one` command)

**NOTE:** This phase is NOT implemented yet - it's the next step after CLI.

### What Should Happen

1. **User runs `/one` in Claude Code**

2. **Claude checks for `.onboarding.json`:**
   ```typescript
   const onboardingPath = path.join(process.cwd(), installationName, '.onboarding.json');
   if (fs.existsSync(onboardingPath)) {
     const data = JSON.parse(fs.readFileSync(onboardingPath, 'utf-8'));
     if (data.status === 'pending_analysis') {
       // Start onboarding flow
     }
   }
   ```

3. **Claude invokes `agent-onboard`:**
   - Fetches website content via WebFetch
   - Analyzes HTML, CSS, and content
   - Extracts brand identity:
     - Primary/secondary colors
     - Logo URL
     - Font families
     - Voice/tone
     - Target audience

4. **Claude generates custom ontology:**
   - Based on business type detected
   - Maps to 6-dimension ontology
   - Defines custom thing types
   - Defines custom connection types
   - Defines custom event types

5. **Claude writes results:**
   ```
   /one-platform/knowledge/ontology.md
   /one-platform/knowledge/brand.md
   ```

6. **Claude updates `.onboarding.json`:**
   ```json
   {
     "status": "features_presented",
     "website": {
       "analyzed": true,
       "analyzedAt": 1729468830000,
       "brandExtracted": true,
       "ontologyGenerated": true
     },
     "brand": {
       "colors": {
         "primary": "#FF6B6B",
         "secondary": "#4ECDC4"
       },
       "logo": "/logo.svg",
       "fonts": {
         "heading": "Inter",
         "body": "Inter"
       }
     },
     "ontology": {
       "path": "/one-platform/knowledge/ontology.md",
       "groups": ["organization", "team", "project"],
       "things": ["project", "feature", "deployment"]
     },
     "features": {
       "recommended": [
         {
           "id": "landing-page",
           "name": "Landing Page",
           "inferences": [1, 10],
           "duration": "~5 min",
           "required": true
         },
         {
           "id": "authentication",
           "name": "Authentication",
           "inferences": [11, 20],
           "duration": "~10 min",
           "required": true
         }
       ]
     }
   }
   ```

7. **Claude presents features:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✨ RECOMMENDED FEATURES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Based on https://one.ie analysis:

   FOUNDATION (Always recommended)
     [x] Landing page (Infer 1-10, ~5 min)
     [x] Authentication (Infer 11-20, ~10 min)
     [x] Multi-tenant groups (Infer 21-30, ~10 min)

   DETECTED FROM YOUR SITE
     [ ] Real-time sync (Infer 31-40, ~15 min)
     [ ] Project management (Infer 41-50, ~15 min)
     [ ] AI agents (Infer 61-70, ~20 min)

   Which features would you like to build?
   ```

## Phase 3: User Feature Selection

**User responds:**
```
I want: landing page, authentication, multi-tenant, and ai-agents
```

**Claude updates `.onboarding.json`:**
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
    "totalInferences": 70,
    "estimatedDuration": "~50 min",
    "phases": [
      {
        "name": "Landing Page",
        "inferences": [1, 10],
        "specialist": "agent-frontend",
        "status": "pending"
      },
      {
        "name": "Authentication",
        "inferences": [11, 20],
        "specialist": "agent-backend",
        "status": "pending"
      },
      {
        "name": "Multi-Tenant Groups",
        "inferences": [21, 30],
        "specialist": "agent-backend",
        "status": "pending"
      },
      {
        "name": "AI Agents",
        "inferences": [61, 70],
        "specialist": "agent-builder",
        "status": "pending"
      },
      {
        "name": "Deploy & Document",
        "inferences": [91, 100],
        "specialist": "agent-ops",
        "status": "pending"
      }
    ]
  }
}
```

## Phase 4: Platform Building

**Claude invokes `agent-director`:**

1. **Reads plan from `.onboarding.json`**
2. **Executes phases sequentially:**

```
🚀 Starting build...

[Infer 1/70] Validate ontology
[Infer 2/70] Map landing page to 6 dimensions
[Infer 3/70] Design landing page components
...
[Infer 10/70] Deploy landing page to Cloudflare

✨ Landing page LIVE: https://one-platform.pages.dev

[Infer 11/70] Design authentication schema
[Infer 12/70] Implement auth mutations
...
[Infer 20/70] Test authentication flow

✅ Authentication complete

[Continues through all phases...]
```

3. **Updates `.onboarding.json` after each phase:**
```json
{
  "status": "building",
  "plan": {
    "status": "in_progress",
    "currentInference": 23,
    "totalInferences": 70,
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
      }
    ]
  }
}
```

## Phase 5: Completion

**Final `.onboarding.json`:**
```json
{
  "status": "completed",
  "completedAt": 1729473200000,
  "plan": {
    "status": "completed",
    "currentInference": 70,
    "totalInferences": 70,
    "progress": 100,
    "phases": [
      {
        "name": "Landing Page",
        "status": "completed",
        "url": "https://one-platform.pages.dev"
      },
      {
        "name": "Authentication",
        "status": "completed"
      },
      {
        "name": "Multi-Tenant Groups",
        "status": "completed"
      },
      {
        "name": "AI Agents",
        "status": "completed"
      },
      {
        "name": "Deploy & Document",
        "status": "completed"
      }
    ]
  },
  "deployments": {
    "web": "https://one-platform.pages.dev",
    "backend": "https://one-platform.convex.cloud"
  }
}
```

**Claude notifies user:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PLATFORM COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your platform is live:
  • Web: https://one-platform.pages.dev
  • Backend: https://one-platform.convex.cloud

Features implemented:
  ✓ Landing page
  ✓ Authentication
  ✓ Multi-tenant groups
  ✓ AI agents

Documentation created:
  • /one-platform/knowledge/ontology.md
  • /one-platform/knowledge/brand.md
  • /one-platform/README.md

Next steps:
  1. Visit https://one-platform.pages.dev
  2. Create your first account
  3. Explore the platform

Happy building! 🎉
```

## State Transitions

```
pending_analysis
  ↓ (CLI creates)
analyzing
  ↓ (agent-onboard completes)
features_presented
  ↓ (user selects features)
plan_generated
  ↓ (agent-director starts)
building
  ↓ (all phases complete)
completed
```

## Key Files

### Created by CLI
- `/{org-slug}/.onboarding.json` - Handoff file
- `/{org-slug}/groups/` - Empty directory
- `/{org-slug}/people/` - Empty directory
- `/{org-slug}/things/` - Empty directory
- `/{org-slug}/connections/` - Empty directory
- `/{org-slug}/events/` - Empty directory
- `/{org-slug}/knowledge/` - Empty directory
- `.env.local` - Configuration
- `.gitignore` - Git exclusion

### Created by Claude
- `/{org-slug}/knowledge/ontology.md` - Custom ontology
- `/{org-slug}/knowledge/brand.md` - Brand identity
- `/{org-slug}/README.md` - Platform documentation
- `/web/*` - Frontend code
- `/backend/*` - Backend code

## Implementation Status

✅ **Implemented (CLI Side):**
- User information collection
- Installation folder creation
- `.onboarding.json` generation
- `.env.local` update
- `.gitignore` update
- Claude Code launch

❌ **Not Implemented Yet (Claude Side):**
- `/one` command enhancement
- `agent-onboard` website analysis
- Brand extraction
- Custom ontology generation
- Feature recommendation
- 100-inference plan execution
- Specialized agent coordination
- Iterative building and deployment

## Next Steps

1. Enhance `/one` command to read `.onboarding.json`
2. Create `agent-onboard` for website analysis
3. Implement brand extraction from website
4. Build custom ontology generator
5. Create feature recommendation system
6. Implement 100-inference plan generator
7. Coordinate specialized agents
8. Add iterative deployment
9. Create completion notifications
