---
title: npx oneie agent - Agent-First CLI Command
type: plan
status: draft
created: 2025-01-08
tags:
  - cli
  - agents
  - automation
  - developer-experience
  - agent-experience
---

# npx oneie agent - Agent-First CLI Command

## Problem Statement

The current `npx oneie` command is designed for **human interaction** with prompts, questions, and manual input. This creates friction for AI agents (like Claude Code) that need to:

1. Run commands programmatically without human input
2. Set up projects automatically during conversations
3. Detect context from existing environment
4. Complete setup in single command execution

**Current friction:**
```bash
# Agent tries to run this:
npx oneie

# Gets stuck on interactive prompt:
? What's your name? › [waiting for input...]
```

## Solution: Agent-First Command

Create `npx oneie agent` - a non-interactive, context-aware command designed for AI agent experience.

### Design Principles

1. **Zero Interaction** - No prompts, runs to completion
2. **Smart Detection** - Auto-detects user context from environment
3. **Sensible Defaults** - Works with zero configuration
4. **Override Ready** - Accepts CLI flags for explicit control
5. **Idempotent** - Safe to run multiple times

## Agent Detection

### Detecting Agent Environment

The CLI should detect when it's being run by an AI agent and suggest the appropriate command:

```typescript
function isAgentEnvironment(): boolean {
  return (
    // Claude Code environment
    !!process.env.CLAUDE_CODE ||
    !!process.env.CLAUDE_USER_NAME ||

    // GitHub Copilot
    !!process.env.GITHUB_COPILOT ||

    // Cursor
    !!process.env.CURSOR_AI ||

    // Other AI environments
    !!process.env.AI_AGENT ||

    // Non-TTY (no interactive terminal)
    !process.stdin.isTTY ||

    // CI/CD environment
    !!process.env.CI
  );
}
```

### Interactive Command Detection

When `npx oneie` (interactive version) is run in an agent environment:

```bash
$ npx oneie

⚠️  Agent environment detected!

You're running the interactive version of ONE CLI in an AI agent environment.
This command requires human input and will hang.

Did you mean to run:
  npx oneie agent

The 'agent' command is designed for AI agents:
  ✓ Zero interaction required
  ✓ Auto-detects context from git, files, and environment
  ✓ Completes in 5-10 seconds
  ✓ Safe for automated workflows

Run this instead:
  npx oneie agent

Or if you're human and want the interactive setup:
  npx oneie --interactive

Aborting to prevent hang...
```

### Automatic Redirect (Optional)

Optionally, auto-redirect to agent mode:

```bash
$ npx oneie

⚠️  Agent environment detected (CLAUDE_CODE=true)

Automatically switching to agent mode...
Running: npx oneie agent

🤖 ONE Agent Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Detected context:
  Name: John Doe
  Email: john@example.com
  Organization: Acme Corp

✓ Installation complete!
```

## Command Design

### Basic Usage

```bash
# Fully automatic (recommended for agents)
npx oneie agent

# This will:
# 1. Detect user from git config
# 2. Detect organization from git remote or package.json
# 3. Use current directory as project root
# 4. Generate installation folder from org name
# 5. Install dependencies
# 6. Create .env files with smart defaults
# 7. Initialize git if not already initialized
```

### With Explicit Arguments

```bash
# Override specific values
npx oneie agent \
  --name="John Doe" \
  --email="john@example.com" \
  --org="Acme Corp" \
  --project-dir="./my-project" \
  --website="https://acme.com"

# Minimal override (use detection for rest)
npx oneie agent --org="My Startup"

# Use git config explicitly
npx oneie agent --use-git-config

# Skip installation folder
npx oneie agent --no-installation-folder

# Quiet mode (minimal output)
npx oneie agent --quiet

# Verbose mode (for debugging)
npx oneie agent --verbose
```

## Context Detection Strategy

### 1. User Identity Detection

**Priority order:**

1. CLI flags: `--name`, `--email` (explicit override)
2. **Claude context**: `--claude-user`, `CLAUDE_USER_NAME`, `CLAUDE_USER_EMAIL`
3. Git config: `git config user.name`, `git config user.email`
4. Environment variables: `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`
5. Defaults: `"Developer"`, `"dev@localhost"`

**Claude Integration:**

When Claude Code runs the command, it can pass user context:

```bash
# Claude Code automatically adds these flags
npx oneie agent \
  --claude-user="John Doe" \
  --claude-email="john@example.com" \
  --claude-org="Acme Corp"

# Or via environment variables
CLAUDE_USER_NAME="John Doe" \
CLAUDE_USER_EMAIL="john@example.com" \
CLAUDE_ORG_NAME="Acme Corp" \
npx oneie agent
```

**Implementation:**
```typescript
async function detectUserIdentity(): Promise<UserIdentity> {
  // 1. Check CLI flags (highest priority - explicit override)
  if (process.argv.includes('--name') || process.argv.includes('--email')) {
    return {
      name: getCliArg('--name') || '',
      email: getCliArg('--email') || '',
    };
  }

  // 2. Check Claude context flags (from Claude Code)
  if (process.argv.includes('--claude-user')) {
    const name = getCliArg('--claude-user');
    const email = getCliArg('--claude-email') || '';
    if (name) {
      return { name, email };
    }
  }

  // 3. Check Claude environment variables
  if (process.env.CLAUDE_USER_NAME) {
    return {
      name: process.env.CLAUDE_USER_NAME,
      email: process.env.CLAUDE_USER_EMAIL || 'dev@localhost',
    };
  }

  // 4. Try git config
  try {
    const name = await exec('git config user.name');
    const email = await exec('git config user.email');
    if (name && email) {
      return { name: name.trim(), email: email.trim() };
    }
  } catch {}

  // 5. Try standard environment variables
  if (process.env.GIT_AUTHOR_NAME && process.env.GIT_AUTHOR_EMAIL) {
    return {
      name: process.env.GIT_AUTHOR_NAME,
      email: process.env.GIT_AUTHOR_EMAIL,
    };
  }

  // 6. Fallback to defaults
  return {
    name: 'Developer',
    email: 'dev@localhost',
  };
}
```

### 2. Organization Detection

**Priority order:**

1. CLI flag: `--org` (explicit override)
2. **Claude context**: `--claude-org`, `CLAUDE_ORG_NAME`
3. Git remote URL (parse from github.com/org-name/repo)
4. package.json: `author.name` or `organization`
5. README.md: First H1 heading
6. Directory name (parent directory)
7. Default: `"Default Organization"`

**Claude Integration:**

Claude can infer organization from conversation context or user account:

```bash
# Claude passes organization context
npx oneie agent --claude-org="Acme Corp"

# Or via environment
CLAUDE_ORG_NAME="Acme Corp" npx oneie agent
```

**Implementation:**
```typescript
async function detectOrganization(): Promise<string> {
  // 1. Check CLI flag (explicit override)
  if (process.argv.includes('--org')) {
    const org = getCliArg('--org');
    if (org) return org;
  }

  // 2. Check Claude context
  if (process.argv.includes('--claude-org')) {
    const org = getCliArg('--claude-org');
    if (org) return org;
  }

  // 3. Check Claude environment variable
  if (process.env.CLAUDE_ORG_NAME) {
    return process.env.CLAUDE_ORG_NAME;
  }

  // 4. Try git remote
  try {
    const remote = await exec('git config --get remote.origin.url');
    const match = remote.match(/github\.com[:/]([^/]+)\//);
    if (match) return match[1];
  } catch {}

  // 5. Try package.json
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    if (pkg.author?.name) return pkg.author.name;
    if (pkg.organization) return pkg.organization;
  }

  // 6. Try README.md
  if (fs.existsSync('README.md')) {
    const readme = fs.readFileSync('README.md', 'utf-8');
    const match = readme.match(/^#\s+(.+)$/m);
    if (match) return match[1];
  }

  // 7. Use parent directory name
  return path.basename(path.resolve('..'));
}
```

### 3. Website Detection

**Priority order:**

1. CLI flag: `--website`
2. package.json: `homepage`
3. README.md: URLs in badges or links
4. Git remote URL (convert to website)
5. Default: `""`

### 4. Project Details

**Auto-detected:**
- **Project name**: Current directory name
- **Project type**: Detect from existing files (Astro, React, etc.)
- **Installation folder**: Slugified org name (e.g., "Acme Corp" → "acme")

## Output Design

### Success Output (Quiet Mode)

```bash
$ npx oneie agent --quiet

✓ ONE Platform initialized

→ cd /path/to/project
→ claude
→ /one
```

### Success Output (Default Mode)

```bash
$ npx oneie agent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 ONE Agent Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Detected context:
  Name: John Doe
  Email: john@example.com
  Organization: Acme Corp
  Project: /Users/john/projects/acme-platform

✓ Created project structure
✓ Installed dependencies (23 packages)
✓ Generated environment files
✓ Created installation folder: /acme
✓ Initialized git repository

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Your ONE Platform is ready!

Next steps (for Claude Code):
  /one                # Show control center
  /chat [idea]        # Start conversation
  /plan convert       # Create 100-cycle plan

Next steps (manual):
  cd /Users/john/projects/acme-platform
  bun run dev         # Start development server

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Error Output

```bash
$ npx oneie agent

✗ Failed to initialize ONE Platform

Reason: Git not configured
Fix: Run these commands first:
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"

Or provide explicit values:
  npx oneie agent --name="Your Name" --email="your@email.com"
```

## Integration with Claude Code

### Automatic Context Passing

Claude Code can automatically provide user context to the CLI:

```typescript
// In Claude Code workflow
async function initializeONEPlatform(userContext: UserContext) {
  // Extract context from Claude's knowledge
  const userName = userContext.name || detectFromConversation();
  const userEmail = userContext.email || detectFromGitConfig();
  const orgName = detectOrgFromConversation() || detectFromGitRepo();

  // Pass context to CLI
  const result = await exec(`npx oneie agent \
    --claude-user="${userName}" \
    --claude-email="${userEmail}" \
    --claude-org="${orgName}" \
    --quiet`);

  // Parse output for next steps
  return {
    success: true,
    nextCommand: '/one',
  };
}
```

**What Claude knows:**
- User's name (from Claude account)
- Conversation context (mentions of company, project)
- Git configuration (can read `git config`)
- File system context (can read package.json, README)
- Previous conversation history

**Smart inference:**
```typescript
// Example: Claude infers from conversation
User: "I'm building a course platform for Acme University"

// Claude automatically extracts:
{
  org: "Acme University",
  project: "course platform",
  purpose: "education"
}

// And passes to CLI:
npx oneie agent --claude-org="Acme University"
```

### Agent Usage Pattern

When Claude Code needs to initialize ONE:

```typescript
// Simple usage (Claude handles detection)
async function initializeONEPlatform() {
  // Claude automatically adds context flags
  const result = await exec('npx oneie agent --quiet');

  // Already has user context from environment
  return {
    success: true,
    nextCommand: '/one',
  };
}
```

### Recommended Workflow

```bash
# User asks: "Set up ONE Platform for my project"
# Agent thinks: "I need to initialize ONE"

# Step 1: Agent runs command with context
npx oneie agent \
  --claude-user="John Doe" \
  --claude-email="john@example.com" \
  --claude-org="Acme Corp"

# Step 2: Agent sees success
✓ ONE Platform initialized
  Detected John Doe <john@example.com>
  Organization: Acme Corp

# Step 3: Agent suggests next action
Now you can use /one to see available commands and start building.
Would you like me to create a plan for your first feature?
```

### Context Detection Fallback Chain

**Best case (All sources available):**
```
Claude context → git config → package.json → README → directory name
```

**Typical flow:**
1. User: "Set up ONE for Acme Corp"
2. Claude extracts: `--claude-org="Acme Corp"`
3. CLI checks git: `git config user.name` → "John Doe"
4. CLI checks git: `git config user.email` → "john@example.com"
5. Result: Full context with zero user input

**If git not configured:**
1. Claude passes: `--claude-user`, `--claude-org`
2. CLI uses Claude values
3. CLI sets up project with Claude's context
4. No interactive prompts needed

### Benefits of Claude Integration

**For Users:**
- ✅ Zero manual input required
- ✅ Claude "knows" who you are
- ✅ Infers organization from conversation
- ✅ No context switching
- ✅ Setup completes in seconds

**For Claude:**
- ✅ Can run `npx oneie agent` confidently
- ✅ No waiting for user input
- ✅ No interrupted workflows
- ✅ Can initialize multiple projects in parallel
- ✅ Full control over setup process

**Example conversation:**
```
User: "I need a ONE Platform for my startup"
Claude: "Let me set that up for you."
Claude: [runs npx oneie agent with inferred context]
Claude: "✓ Done! Your platform is ready. What would you like to build first?"
```

**Time saved:**
- Before: 2-3 minutes (manual prompts)
- After: 5-10 seconds (fully automated)
- Context switches: 0 (agent handles everything)

## CLI Flags Reference

### Required Flags (None!)

All flags are optional - smart detection handles everything.

### Identity Flags

- `--name="John Doe"` - User's full name (explicit override)
- `--email="john@example.com"` - User's email (explicit override)
- `--claude-user="John Doe"` - User name from Claude context
- `--claude-email="john@example.com"` - User email from Claude
- `--use-git-config` - Explicitly use git config (default behavior)

**Environment variables:**
- `CLAUDE_USER_NAME` - User name from Claude Code
- `CLAUDE_USER_EMAIL` - User email from Claude Code

### Organization Flags

- `--org="Acme Corp"` - Organization name (explicit override)
- `--claude-org="Acme Corp"` - Organization from Claude context
- `--website="https://acme.com"` - Organization website
- `--installation-folder="acme"` - Custom installation folder name
- `--no-installation-folder` - Skip installation folder creation

**Environment variables:**
- `CLAUDE_ORG_NAME` - Organization from Claude Code

### Project Flags

- `--project-dir="./my-project"` - Target directory (default: current)
- `--project-name="My Platform"` - Project name (default: directory name)

### Behavior Flags

- `--quiet` - Minimal output (for agents)
- `--verbose` - Detailed output (for debugging)
- `--yes` - Skip all confirmations (default in agent mode)
- `--dry-run` - Show what would be done without doing it

### Advanced Flags

- `--template="default"` - Use specific template (default, minimal, full)
- `--package-manager="bun"` - Use specific package manager (bun, npm, pnpm)
- `--skip-install` - Don't install dependencies
- `--skip-git` - Don't initialize git

## Implementation Plan

### Phase 1: Core Command (Cycle 1-20)

**Files to create:**
- `cli/src/commands/agent.ts` - Main agent command
- `cli/src/lib/detect.ts` - Context detection utilities
- `cli/src/lib/agent-setup.ts` - Non-interactive setup
- `cli/src/lib/agent-detection.ts` - Agent environment detection

**Implementation:**

```typescript
// cli/src/index.ts (Main entry point)
import { Command } from 'commander';
import { isAgentEnvironment } from './lib/agent-detection';
import { agentCommand } from './commands/agent';
import { interactiveCommand } from './commands/interactive';

const program = new Command();

program
  .name('oneie')
  .description('ONE Platform CLI')
  .version('1.0.0');

// Add agent command
program.addCommand(agentCommand);

// Default command (interactive)
program
  .action(() => {
    // Detect if running in agent environment
    if (isAgentEnvironment()) {
      console.log('⚠️  Agent environment detected!\n');
      console.log('You\'re running the interactive version in an AI agent environment.');
      console.log('This command requires human input and will hang.\n');
      console.log('Did you mean to run:');
      console.log('  npx oneie agent\n');
      console.log('The \'agent\' command is designed for AI agents:');
      console.log('  ✓ Zero interaction required');
      console.log('  ✓ Auto-detects context from git, files, and environment');
      console.log('  ✓ Completes in 5-10 seconds');
      console.log('  ✓ Safe for automated workflows\n');
      console.log('Run this instead:');
      console.log('  npx oneie agent\n');
      console.log('Or if you\'re human and want interactive setup:');
      console.log('  npx oneie --interactive\n');
      console.log('Aborting to prevent hang...');
      process.exit(1);
    }

    // Run interactive setup
    interactiveCommand();
  });

program.parse();
```

```typescript
// cli/src/lib/agent-detection.ts
export function isAgentEnvironment(): boolean {
  return (
    // Claude Code environment
    !!process.env.CLAUDE_CODE ||
    !!process.env.CLAUDE_USER_NAME ||
    !!process.env.CLAUDE_ORG_NAME ||

    // GitHub Copilot
    !!process.env.GITHUB_COPILOT ||

    // Cursor AI
    !!process.env.CURSOR_AI ||

    // Windsurf
    !!process.env.CODEIUM_API_KEY ||

    // Generic AI agent marker
    !!process.env.AI_AGENT ||

    // Non-TTY (no interactive terminal)
    !process.stdin.isTTY ||

    // CI/CD environment
    !!process.env.CI ||
    !!process.env.GITHUB_ACTIONS ||
    !!process.env.GITLAB_CI ||
    !!process.env.CIRCLECI
  );
}

export function getAgentType(): string {
  if (process.env.CLAUDE_CODE || process.env.CLAUDE_USER_NAME) {
    return 'Claude Code';
  }
  if (process.env.GITHUB_COPILOT) {
    return 'GitHub Copilot';
  }
  if (process.env.CURSOR_AI) {
    return 'Cursor';
  }
  if (process.env.CODEIUM_API_KEY) {
    return 'Windsurf';
  }
  if (process.env.CI) {
    return 'CI/CD';
  }
  if (!process.stdin.isTTY) {
    return 'Non-interactive';
  }
  return 'Unknown agent';
}
```

```typescript
// cli/src/commands/agent.ts
import { Command } from 'commander';
import { detectContext } from '../lib/detect';
import { setupAgent } from '../lib/agent-setup';
import { getAgentType } from '../lib/agent-detection';

export const agentCommand = new Command('agent')
  .description('Non-interactive setup for AI agents')
  .option('--name <name>', 'User name')
  .option('--email <email>', 'User email')
  .option('--claude-user <name>', 'User name from Claude context')
  .option('--claude-email <email>', 'User email from Claude')
  .option('--claude-org <org>', 'Organization from Claude')
  .option('--org <org>', 'Organization name')
  .option('--website <url>', 'Organization website')
  .option('--quiet', 'Minimal output')
  .option('--verbose', 'Detailed output')
  .option('--dry-run', 'Show what would be done')
  .action(async (options) => {
    // Show agent type if verbose
    if (options.verbose) {
      const agentType = getAgentType();
      console.log(`🤖 Detected: ${agentType}\n`);
    }

    // Detect context
    const context = await detectContext(options);

    // Run setup
    const result = await setupAgent(context, options);

    // Output results
    if (options.quiet) {
      console.log('✓ ONE Platform initialized');
      console.log('\n→ claude');
      console.log('→ /one');
    } else {
      displaySuccessMessage(context, result);
    }
  });
```

### Phase 2: Context Detection (Cycle 21-40)

**Implement detection functions:**
- `detectUserIdentity()` - Git config → env vars → defaults
- `detectOrganization()` - Git remote → package.json → README → defaults
- `detectWebsite()` - package.json → README → git remote
- `detectProjectInfo()` - Directory name, existing files

### Phase 3: Integration (Cycle 41-60)

**Integrate with existing setup:**
- Reuse setup functions from interactive command
- Share template generation logic
- Unify environment file creation
- Common error handling

### Phase 4: Testing (Cycle 61-80)

**Test scenarios:**
- Fresh directory (no git, no package.json)
- Existing git repo
- Existing package.json
- Various git remotes (GitHub, GitLab, Bitbucket)
- Missing git config
- Override with flags

### Phase 5: Documentation (Cycle 81-100)

**Update docs:**
- Add to `/getting-started/quick-start.md`
- Add to `/getting-started/claude-commands.md`
- Create agent-specific guide
- Add troubleshooting section

## Agent Experience Benefits

### Before (Interactive)

```bash
# Agent tries to help user
Agent: "Let me set up ONE Platform for you"
Agent: [runs npx oneie]
Terminal: "What's your name?"
Agent: [stuck waiting for input]
Agent: "I can't complete this setup automatically. Please run npx oneie manually."
User: [has to switch to terminal, fill in prompts]
```

### After (Agent Mode)

```bash
# Agent helps user seamlessly
Agent: "Let me set up ONE Platform for you"
Agent: [runs npx oneie agent]
Agent: [detects context automatically]
Agent: [completes setup in 5 seconds]
Agent: "✓ Done! Your platform is ready. Try /one to see available commands."
User: [immediately productive]
```

## Success Metrics

### Setup Speed
- **Before**: 2-3 minutes (with user input)
- **After**: 5-10 seconds (fully automated)

### Context Switches
- **Before**: 3+ switches (CLI → Terminal → CLI)
- **After**: 0 switches (agent handles everything)

### Error Rate
- **Before**: 40% (users make typos, choose wrong options)
- **After**: 5% (only environment issues)

### Agent Productivity
- **Before**: Can't automate initialization
- **After**: Can initialize 10+ projects in parallel

## Future Enhancements

### Phase 2 Features

1. **AI Context Inference**
   ```bash
   # Agent analyzes conversation history
   npx oneie agent --infer-from-context

   # Uses Claude's conversation context to fill in:
   # - Project purpose from user's description
   # - Feature priorities from discussion
   # - Target audience from requirements
   ```

2. **GitHub Integration**
   ```bash
   # Auto-create GitHub repo
   npx oneie agent --create-repo

   # Clone and initialize existing repo
   npx oneie agent --from-repo="github.com/user/repo"
   ```

3. **Brand Extraction**
   ```bash
   # Analyze existing website
   npx oneie agent --onboard="https://example.com"

   # Extracts:
   # - Colors, fonts, logos
   # - Content structure
   # - Feature set
   # - Creates matching installation folder
   ```

4. **Multi-Project Setup**
   ```bash
   # Set up multiple related projects
   npx oneie agent --projects="web,mobile,api"

   # Creates:
   # - web/ (Astro frontend)
   # - mobile/ (React Native)
   # - api/ (Convex backend)
   # - Shared installation folder
   ```

## Implementation Priority

### Immediate (This Cycle)
- [x] Document requirements in this plan
- [ ] Create `cli/src/commands/agent.ts`
- [ ] Implement basic context detection
- [ ] Test with git config detection
- [ ] Update CLI to include agent command

### Short Term (Next Sprint)
- [ ] Add all detection strategies
- [ ] Implement quiet/verbose modes
- [ ] Add dry-run support
- [ ] Write comprehensive tests
- [ ] Update documentation

### Medium Term (Next Month)
- [ ] GitHub integration
- [ ] Brand extraction from URLs
- [ ] Multi-project setup
- [ ] Template variations

## Questions to Resolve

1. **Should agent command ALWAYS be non-interactive?**
   - Proposed: Yes, always. Use regular `npx oneie` for interactive.

2. **What if detection fails?**
   - Proposed: Use sensible defaults, never prompt. Add `--verbose` to explain.

3. **Should we auto-start dev server?**
   - Proposed: No, let agent decide. Agent can run `/server start` after.

4. **Should we auto-open browser?**
   - Proposed: No, agents can't interact with browsers. Let user open manually.

5. **How to handle multiple projects in same directory?**
   - Proposed: Check for existing ONE installation, offer to update/reconfigure.

## Real-World Scenarios

### Scenario 1: Claude Code User (Correct Command)

```bash
# Claude runs the agent command
$ npx oneie agent

🤖 ONE Agent Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Detected context:
  Name: John Doe (from git config)
  Email: john@example.com (from git config)
  Organization: Acme Corp (from Claude context)

✓ Created project structure
✓ Installed dependencies (23 packages)
✓ Generated environment files

✅ Your ONE Platform is ready!

Next steps:
  /one              # Show control center
```

### Scenario 2: Claude Code User (Wrong Command)

```bash
# Claude accidentally runs interactive command
$ npx oneie

⚠️  Agent environment detected!

You're running the interactive version in an AI agent environment.
This command requires human input and will hang.

Did you mean to run:
  npx oneie agent

The 'agent' command is designed for AI agents:
  ✓ Zero interaction required
  ✓ Auto-detects context from git, files, and environment
  ✓ Completes in 5-10 seconds
  ✓ Safe for automated workflows

Run this instead:
  npx oneie agent

Or if you're human and want interactive setup:
  npx oneie --interactive

Aborting to prevent hang...
```

### Scenario 3: Human User (Interactive)

```bash
# Human runs the command in terminal
$ npx oneie

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Welcome! Let's build your platform.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? What's your name? › John Doe
? Organization name? › Acme Corp
? Project directory? › ./acme-platform

✓ Your ONE Platform is ready!
```

### Scenario 4: CI/CD Environment

```bash
# GitHub Actions runs the command
$ npx oneie

⚠️  Agent environment detected!
# ... suggests npx oneie agent

# Correct usage in CI:
$ npx oneie agent --quiet

✓ ONE Platform initialized

→ /one
```

### Scenario 5: Cursor AI User

```bash
# Cursor AI tries to run setup
$ npx oneie

⚠️  Agent environment detected!
# ... suggests npx oneie agent

# Cursor learns and runs:
$ npx oneie agent --claude-user="Jane Smith"

✓ Installation complete!
```

## Agent Detection Benefits

**For AI Agents:**
- ✅ Never get stuck on interactive prompts
- ✅ Clear guidance to correct command
- ✅ Learn the right pattern immediately
- ✅ Faster execution (no trial and error)

**For Humans:**
- ✅ Interactive experience preserved
- ✅ Can override with `--interactive` flag
- ✅ Clear distinction between modes
- ✅ Better onboarding experience

**For Platform:**
- ✅ Reduces support requests
- ✅ Better telemetry (know who's using agent mode)
- ✅ Improves adoption by AI tools
- ✅ Future-proof for new AI environments

## Conclusion

`npx oneie agent` transforms ONE Platform initialization from a **human-interactive process** to an **agent-automated workflow**, enabling Claude Code to set up projects instantly without context switching or manual input.

### Key Innovations

1. **Agent Detection** - Automatically detects AI agent environments and suggests the correct command
2. **Smart Context Inference** - Extracts user/org info from Claude, git, files, and conversation
3. **Zero Interaction** - Completes setup in 5-10 seconds with no prompts
4. **Safety First** - Never hangs, always provides clear guidance
5. **Universal Support** - Works with Claude Code, Cursor, Windsurf, Copilot, and CI/CD

### The Agent Experience

**Before (Interactive CLI):**
```
Agent → User: "Run npx oneie and answer the prompts"
User → Terminal: [fills in 5+ questions]
Time: 2-3 minutes + context switches
```

**After (Agent Mode with Detection):**
```
Agent: [runs npx oneie] → Detects agent env → Shows: "Use npx oneie agent"
Agent: [runs npx oneie agent] → Auto-detects context → ✓ Done in 5 seconds
Time: 5-10 seconds, zero context switches
```

### Impact

- **98% faster** setup (2-3 min → 5-10 sec)
- **100% automated** (zero manual input required)
- **0 hangs** (agent detection prevents blocking)
- **Universal** (works with all AI coding tools)

**Agent Experience First** - Because agents build faster when they don't have to ask humans to fill in forms, and they never get stuck on interactive prompts they can't answer.

---

**Status:** Ready for implementation
**Assigned:** agent-ops (CLI development)
**Dependencies:** Existing CLI codebase
**Estimated Completion:** 1 sprint (2 weeks)
**Priority:** High - Enables seamless Claude Code integration
