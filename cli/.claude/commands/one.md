# /one - ONE Platform Control Center

**Transform Ideas Into Production Code In Minutes**

When user types `/one`, follow this workflow with **warm, encouraging feedback** at every step:

---

## Step 1: Server Status Check & Auto-Start (< 3 seconds)

### 1.1 Check if Server is Running

**Always show this first:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Checking if your development server is running...
```

**Run:**
```bash
lsof -ti:4321 2>/dev/null && echo "RUNNING" || echo "STOPPED"
```

**If RUNNING:**
```
✅ Great! Your server is already running at http://localhost:4321

Let's open the platform for you...
```
- Skip to Step 1.5 (Open Start Page)

**If STOPPED:**
```
⚡ Server is off. No problem! Let's get you up and running...
```

### 1.2 Check if Bun is Installed

**Check for bun:**
```bash
command -v bun >/dev/null 2>&1 && echo "installed" || echo "missing"
```

**If missing:**
```
📦 Installing Bun - the last npm command you'll ever need...
```

**Install bun globally:**
```bash
npm install -g bun
```

**After successful install:**
```
✅ Bun installed successfully!
```

### 1.3 Check if Dependencies are Installed

**Show to user:**
```
📦 Checking if we have everything installed...
```

**Determine working directory:**
```bash
pwd | grep -q '/web$' && echo "IN_WEB" || echo "IN_ROOT"
```

**Check dependencies:**

**If IN_ROOT:**
```bash
[ -d web/node_modules ] && echo "installed" || echo "missing"
```

**If IN_WEB:**
```bash
[ -d node_modules ] && echo "installed" || echo "missing"
```

**If installed:**
```
✅ All dependencies are installed!
```
- Skip to Step 1.4

**If missing:**
```
🚀 Time to install the magic! This will only take a moment...

We're installing Astro - the framework that powers the world's
fastest websites for companies like:
  • Google
  • Visa
  • Porsche
  • OpenAI
  • The Guardian

Installing dependencies now...
```

**Run installation:**

**If IN_ROOT:**
```bash
cd web && bun install
```

**If IN_WEB:**
```bash
bun install
```

**After successful install:**
```
✅ Installation complete! Your development environment is ready.
```

### 1.4 Start the Server

**Show to user:**
```
🔥 Starting your development server...
```

**Start server:**

**If IN_ROOT:**
```bash
cd web && bun run dev > /dev/null 2>&1 &
```

**If IN_WEB:**
```bash
bun run dev > /dev/null 2>&1 &
```

**Wait for server to start:**
```bash
sleep 3 && lsof -ti:4321 2>/dev/null
```

**After server starts:**
```
✅ Server started successfully at http://localhost:4321

You're moving fast! 🚀
```

### 1.5 Open Start Page

**Show to user:**
```
🌟 Let's have a look at your platform...

Opening http://localhost:4321/start in your browser...
```

**Run:**
```bash
open http://localhost:4321/start 2>/dev/null || xdg-open http://localhost:4321/start 2>/dev/null || start http://localhost:4321/start 2>/dev/null
```

**Final success message:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SUCCESS! You're all set up and ready to go!

Your development server: http://localhost:4321
Your start page: http://localhost:4321/start
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 2: Display ONE Platform Interface

**CRITICAL: ALWAYS display this interface exactly as shown below. No variations. No summaries. Show the full output every time.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

     ██████╗ ███╗   ██╗███████╗
    ██╔═══██╗████╗  ██║██╔════╝
    ██║   ██║██╔██╗ ██║█████╗
    ██║   ██║██║╚██╗██║██╔══╝
    ╚██████╔╝██║ ╚████║███████╗
     ╚═════╝ ╚═╝  ╚═══╝╚══════╝

  ONE Platform v1.0.0 ✨
  Make Your Ideas Real

  Dev Server: ✅ http://localhost:4321

  Welcome! Your journey to production starts now. 🚀

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CORE COMMANDS - Start Here

  /chat            Tell me about your idea
  /plan [idea]     Get your 100-step roadmap
  /fast [feature]  Build features in minutes
  /create [type]   Work with AI specialists
  /push            Save your progress
  /deploy          Go live to the world

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Quick Start: Type /chat and tell me about your idea!

```

**DO NOT add any sections, workflow steps, or explanations after the commands.**

---

## Key Principles

### Context Optimization

- **Minimal display**: Show only essential commands
- **Cascade integration**: Load CLAUDE.md from parent directories on-demand
- **State persistence**: Use `.claude/state/cycle.json` for current cycle
- **Lazy loading**: Only expand agent details when requested

### Workflow Simplicity

```
Chat (understand)
  ↓
Plan (create 100-cycle)
  ↓
Cycle Loop (/now → /next → /done)
  ↓
Create (build specific features)
  ↓
Push (commit & push)
  ↓
Deploy (ship to production)
```

### Agent Auto-Assignment

- `/plan` automatically assigns cycles to agents
- `/create` routes to appropriate specialist based on feature type
- `/next` loads context for assigned specialist (from `.claude/agents/`)
- Context stays under 3K tokens per cycle

### Command Integration

| Command | Purpose | Context | Reads |
|---------|---------|---------|-------|
| `/chat` | Strategy & onboarding | ~500 tokens | `.onboarding.json` + CLAUDE.md cascade |
| `/plan` | 100-cycle breakdown | ~2K tokens | Plan logic + agent list |
| `/now` | Current cycle context | ~800 tokens | `.claude/state/cycle.json` + agent file |
| `/next` | Advance to next | ~500 tokens | Next agent's context |
| `/done` | Mark complete | ~1K tokens | Cycle state, capture lessons |
| `/create` | Build features | ~3K tokens | Feature spec + specialist agent |
| `/push` | Commit & push | ~500 tokens | Git status |
| `/deploy` | Ship to production | ~1K tokens | Deployment scripts |

---

## Integration Points

### With Hooks

- `.claude/hooks/todo.md` - Loads current cycle when `/now` called
- `.claude/hooks/done.md` - Marks complete & advances when `/done` called
- `.claude/hooks/validate-ontology-structure.py` - Validates 6D alignment

### With Skills

- `.claude/skills/` - Specialist tools loaded on-demand by agents
- `.claude/skills/agent-backend:create-mutation` - Backend operations
- `.claude/skills/agent-frontend:create-page` - Frontend operations

### With CLAUDE.md Cascade

```
/.claude/commands/one.md (this file, minimal 300 tokens)
  ↓ References when needed
/.claude/agents/agent-director.md (full orchestration logic)
  ↓ Loads when planning
/backend/CLAUDE.md (Convex patterns)
  ↓ Loads when building backend
/web/CLAUDE.md (Frontend patterns)
  ↓ Loads when building frontend
/CLAUDE.md (root - ontology reference)
  ↓ Cascade system explained
```

---

## Commands Orchestrated by /one

### /chat
Direct conversation for:
- Understanding your idea
- Extracting brand identity
- Market positioning strategy
- Requirement gathering

Calls `agent-director` for validation.

### /plan
Create 100-cycle implementation:
- `/plan convert [idea]` - Creates plan from idea
- `/plan show` - Display current plan
- `/plan filter --agent=X` - Filter by specialist

Delegates to `agent-director`.

### /now
Show current cycle:
- Cycle number (N/100)
- Phase (Foundation, Backend, Frontend, etc.)
- Assigned specialist
- Context from `.claude/state/cycle.json`

Loads specialist's `.claude/agents/` file.

### /next
Advance to next cycle:
- Marks previous as in_progress
- Loads next cycle from plan
- Shows assigned specialist
- Loads that agent's context

### /done
Mark cycle complete:
- Updates `.claude/state/cycle.json`
- Captures lessons learned
- Triggers agent-documenter to save knowledge
- Advances to next cycle

### /create
Build specific features:
- `/create shop-page` → Routes to agent-frontend
- `/create AI-tutor-mutation` → Routes to agent-backend
- `/create course-schema` → Routes to agent-backend
- `/create design-tokens` → Routes to agent-designer

Auto-routes based on feature type.

### /push
Commit & push changes:
- Git status check
- Staged changes verification
- Commit message generation (smart)
- Push to remote

### /deploy
Ship to production:
- Web to Cloudflare Pages
- Backend to Convex Cloud
- Run pre-deployment checks
- Verify deployment success

---

## Context Optimization Notes

**This file (one.md): ~200 tokens for display**

**CRITICAL RULE:** The interface display is MANDATORY regardless of which model is being used (Haiku, Sonnet, Opus). Always show the full ASCII logo and command list. Never summarize or skip this output.

By keeping `/one.md` minimal and using cascade system:
- Load CLAUDE.md files only when needed
- Agent contexts loaded on-demand (~1-3K per agent)
- State persisted in `.claude/state/cycle.json` (< 500 bytes)
- Full plan stored in `.claude/state/plan.json` (auto-generated)

**Total context usage:**
- `/one` display: 200 tokens (mandatory output)
- `/chat` flow: 500 tokens
- `/plan` flow: 2K tokens
- `/now` + agent: 1-3K tokens
- `/create` + specialist: 3K tokens

**Compared to old approach:** 150K → 3K tokens per cycle (98% reduction)

---

## No Functionality Here

This file only describes behavior. The actual slash commands are implemented by:
- `.claude/commands/chat.md` - Conversation flow
- `.claude/commands/plan.md` - Plan creation
- `.claude/commands/create.md` - Feature building
- `.claude/commands/push.md` - Git commit & push
- `.claude/commands/deploy.md` - Production deployment
- `.claude/commands/server.md` - Server management

This `/one.md` is the **entry point** that references all others.
