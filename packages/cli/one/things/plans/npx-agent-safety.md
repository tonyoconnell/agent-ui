---
title: npx oneie agent - Safety & Compatibility System
type: plan
status: draft
created: 2025-01-08
tags:
  - cli
  - safety
  - compatibility
  - backup
  - conflict-resolution
---

# npx oneie agent - Safety & Compatibility System

## Core Principle

**Never destroy user data. Always have an undo path.**

When installing ONE into existing projects, we must:
1. Detect what's already there
2. Backup before any changes
3. Choose safe installation strategy
4. Make everything reversible
5. Communicate clearly what happened

## Project Detection Matrix

### Detection Strategy

Run these checks in order:

```typescript
interface ProjectDetection {
  isEmpty: boolean;              // No files except .git
  hasPackageJson: boolean;       // Has package.json
  framework: Framework;          // What framework detected
  hasONE: boolean;              // ONE already installed
  hasEnv: boolean;              // Has .env files
  hasClaude: boolean;           // Has CLAUDE.md or .claude/
  conflicts: string[];          // List of conflicting files
  compatibilityLevel: 'perfect' | 'compatible' | 'conflict' | 'incompatible';
}

type Framework =
  | 'none'       // Empty directory
  | 'astro'      // Astro project (compatible!)
  | 'nextjs'     // Next.js (incompatible)
  | 'react'      // Create React App (incompatible)
  | 'vue'        // Vue (incompatible)
  | 'svelte'     // SvelteKit (incompatible)
  | 'remix'      // Remix (incompatible)
  | 'nuxt'       // Nuxt (incompatible)
  | 'one'        // ONE Platform (upgrade)
  | 'unknown';   // Has package.json but unknown framework
```

### Framework Detection Logic

```typescript
async function detectFramework(): Promise<Framework> {
  if (!fs.existsSync('package.json')) {
    return 'none';
  }

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

  // Check for ONE Platform
  if (pkg.name === 'oneie' || pkg.dependencies?.['@one/platform']) {
    return 'one';
  }

  // Check dependencies and devDependencies
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  // Priority order (most specific first)
  if (allDeps.astro) return 'astro';
  if (allDeps.next) return 'nextjs';
  if (allDeps['@remix-run/react']) return 'remix';
  if (allDeps['@sveltejs/kit']) return 'svelte';
  if (allDeps.nuxt) return 'nuxt';
  if (allDeps.vue) return 'vue';
  if (allDeps['react-scripts']) return 'react';

  return 'unknown';
}
```

## Compatibility Matrix

| Scenario | Framework | Strategy | Reason |
|----------|-----------|----------|--------|
| Empty directory | `none` | **Fresh Install** | No conflicts, perfect |
| Astro project | `astro` | **Merge Install** | Compatible architecture |
| ONE project | `one` | **Upgrade Install** | Update existing |
| Next.js project | `nextjs` | **Subfolder Install** | Different routing |
| React/Vue/Svelte | `react`/`vue`/`svelte` | **Subfolder Install** | Incompatible |
| Unknown project | `unknown` | **Subfolder Install** | Play it safe |

## Installation Strategies

### 1. Fresh Install (Empty Directory)

**When:** No package.json, no source files

**Action:**
```bash
# Install everything normally
./
├── web/              # Full Astro frontend
├── backend/          # Convex backend
├── one/              # Documentation
├── .claude/          # Claude Code config
├── CLAUDE.md         # Root instructions
├── package.json      # Root package file
└── .env              # Environment variables
```

**Risk:** None - directory is empty

### 2. Merge Install (Astro Project)

**When:** Existing Astro project detected

**Action:**
```bash
# Backup first
.one-backups/
└── 2025-01-08T10-30-00/
    ├── package.json
    ├── .env
    ├── CLAUDE.md (if exists)
    └── astro.config.mjs

# Then merge
./
├── src/
│   ├── pages/        # Keep existing + add ONE pages
│   ├── components/   # Keep existing + add ONE components
│   └── content/      # Keep existing + add ONE collections
├── one/              # Add documentation
├── backend/          # Add Convex backend
├── .claude/          # Add Claude config (or merge if exists)
├── CLAUDE.md         # Add or merge
└── package.json      # Merge dependencies
```

**Strategy:**
1. Backup all files that will change
2. Merge package.json dependencies (don't replace)
3. Add ONE-specific files to existing structure
4. Preserve existing pages and components
5. Add ONE documentation to /one folder
6. Merge or create .env files (never overwrite)
7. Update astro.config.mjs carefully

**Risk:** Medium - must preserve existing work

### 3. Subfolder Install (Incompatible Framework)

**When:** Next.js, React, Vue, Svelte, or unknown project

**Action:**
```bash
# Install in subfolder
./
├── [existing project files]
├── package.json      # Original project
└── one-platform/     # ONE installed here
    ├── web/
    ├── backend/
    ├── one/
    ├── .claude/
    ├── CLAUDE.md
    └── package.json
```

**Strategy:**
1. No backup needed (no files modified)
2. Ask for subfolder name (default: `one-platform`)
3. Install complete ONE structure in subfolder
4. Completely isolated from main project
5. Suggest: "Your ONE Platform is in ./one-platform/"

**Risk:** None - completely isolated

### 4. Upgrade Install (ONE Already Exists)

**When:** ONE Platform already detected

**Action:**
```bash
# Backup existing customizations
.one-backups/
└── 2025-01-08T10-30-00/
    ├── one/              # User's docs
    ├── .claude/          # User's agents
    ├── CLAUDE.md         # User's instructions
    └── [installation-folder]/  # User's customizations

# Then upgrade
- Update core files (web/, backend/, one/ templates)
- Preserve user customizations
- Merge new features
- Update dependencies
```

**Strategy:**
1. Detect existing ONE version
2. Backup all user customizations
3. Update core ONE files
4. Preserve installation folders
5. Merge new features from latest version
6. Show upgrade report

**Risk:** Low - existing ONE user, knows the system

## Backup System

### Backup Directory Structure

```bash
.one-backups/
├── 2025-01-08T10-30-00/     # Timestamp format
│   ├── metadata.json        # What was backed up and why
│   ├── package.json
│   ├── .env
│   ├── .env.local
│   ├── CLAUDE.md
│   ├── .claude/
│   └── [any other conflicts]
└── 2025-01-08T11-45-00/     # Next backup
    └── ...
```

### Backup Metadata

```json
{
  "timestamp": "2025-01-08T10:30:00Z",
  "reason": "merge-install",
  "framework": "astro",
  "backedUpFiles": [
    "package.json",
    ".env",
    "CLAUDE.md",
    ".claude/commands/custom.md"
  ],
  "installationStrategy": "merge",
  "canRestore": true,
  "restoreCommand": "npx oneie restore 2025-01-08T10-30-00"
}
```

### Restore Command

```bash
# List available backups
npx oneie restore --list

# Restore specific backup
npx oneie restore 2025-01-08T10-30-00

# Interactive restore (choose what to restore)
npx oneie restore --interactive
```

## File Conflict Resolution

### Protected Files (Never Overwrite Without Backup)

**Critical files:**
- `.env`, `.env.local`, `.env.production`
- `CLAUDE.md`
- `.claude/` directory
- `package.json`, `package-lock.json`
- `tsconfig.json`
- `astro.config.mjs`

**User content:**
- `src/pages/*` (except ONE-specific)
- `src/components/*` (except ONE-specific)
- `src/content/*` (except ONE-specific)
- Installation folders (e.g., `/acme`)

### Merge Strategy for Common Files

#### package.json

```typescript
function mergePackageJson(existing: any, oneTemplate: any): any {
  return {
    ...existing,
    // Preserve user's name, version, etc.
    name: existing.name,
    version: existing.version,
    description: existing.description || oneTemplate.description,

    // Merge scripts (ONE scripts prefixed)
    scripts: {
      ...existing.scripts,
      'one:dev': oneTemplate.scripts.dev,
      'one:build': oneTemplate.scripts.build,
      'one:preview': oneTemplate.scripts.preview,
    },

    // Merge dependencies (ONE + existing)
    dependencies: {
      ...existing.dependencies,
      ...oneTemplate.dependencies,
    },

    // Merge devDependencies
    devDependencies: {
      ...existing.devDependencies,
      ...oneTemplate.devDependencies,
    },
  };
}
```

#### .env files

```typescript
function mergeEnvFile(existing: string, oneTemplate: string): string {
  const existingVars = parseEnv(existing);
  const oneVars = parseEnv(oneTemplate);

  // Never overwrite existing variables
  const merged = { ...oneVars, ...existingVars };

  // Add comment for new ONE variables
  let result = '# Existing environment variables\n';
  result += formatEnv(existingVars);
  result += '\n\n# ONE Platform variables\n';
  result += formatEnv(oneVars);

  return result;
}
```

#### CLAUDE.md

```typescript
function mergeClaude(existing: string, oneTemplate: string): string {
  // Keep existing at top (user's customizations)
  // Add ONE platform instructions at bottom
  return `${existing}

---
# ONE Platform Instructions (Auto-generated)

${oneTemplate}

---

**Note:** Your custom instructions above take precedence over ONE defaults.
`;
}
```

## Safety Checks Before Installation

### Pre-flight Checks

```typescript
interface SafetyCheck {
  name: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  canContinue: boolean;
}

async function runSafetyChecks(): Promise<SafetyCheck[]> {
  return [
    // Critical checks (must pass)
    {
      name: 'git-initialized',
      passed: await hasGit(),
      severity: 'error',
      message: 'Git repository not initialized. Run: git init',
      canContinue: false,
    },
    {
      name: 'git-clean',
      passed: await isGitClean(),
      severity: 'warning',
      message: 'Uncommitted changes detected. Commit first for safety.',
      canContinue: true,
    },
    {
      name: 'node-version',
      passed: await checkNodeVersion('>=18.0.0'),
      severity: 'error',
      message: 'Node.js 18+ required',
      canContinue: false,
    },

    // Compatibility checks
    {
      name: 'framework-compatible',
      passed: await isFrameworkCompatible(),
      severity: 'warning',
      message: 'Incompatible framework detected. Will install in subfolder.',
      canContinue: true,
    },
    {
      name: 'disk-space',
      passed: await hasDiskSpace(500), // 500MB required
      severity: 'error',
      message: 'Insufficient disk space',
      canContinue: false,
    },

    // Backup checks
    {
      name: 'can-backup',
      passed: await canCreateBackup(),
      severity: 'error',
      message: 'Cannot create backup directory',
      canContinue: false,
    },
  ];
}
```

## Agent Command with Safety

### Enhanced Command Flags

```bash
# Safety flags
npx oneie agent --dry-run              # Show plan without executing
npx oneie agent --backup-only          # Just backup, don't install
npx oneie agent --force                # Skip safety checks (dangerous!)
npx oneie agent --no-backup            # Skip backup (not recommended)
npx oneie agent --subfolder="custom"   # Force subfolder install

# Compatibility flags
npx oneie agent --merge                # Force merge strategy
npx oneie agent --isolated             # Force subfolder strategy
npx oneie agent --upgrade              # Force upgrade strategy

# Recovery flags
npx oneie agent --restore="timestamp"  # Restore from backup
npx oneie agent --undo                 # Undo last install
```

### Execution Flow with Safety

```typescript
async function agentInstall(options: AgentOptions) {
  // 1. Detect existing project
  const detection = await detectProject();
  console.log('🔍 Detected:', detection.framework);

  // 2. Run safety checks
  const checks = await runSafetyChecks();
  const errors = checks.filter(c => !c.passed && !c.canContinue);

  if (errors.length > 0) {
    console.log('❌ Safety checks failed:');
    errors.forEach(e => console.log(`  - ${e.message}`));
    return { success: false, errors };
  }

  // 3. Choose installation strategy
  const strategy = chooseStrategy(detection);
  console.log('📋 Strategy:', strategy);

  // 4. Show what will happen (if verbose)
  if (options.verbose || options.dryRun) {
    await showInstallationPlan(detection, strategy);
  }

  if (options.dryRun) {
    console.log('\n✓ Dry run complete (no changes made)');
    return { success: true, dryRun: true };
  }

  // 5. Create backup (unless --no-backup)
  if (!options.noBackup && detection.hasConflicts) {
    const backup = await createBackup(detection);
    console.log('💾 Backup created:', backup.timestamp);
    console.log('   Restore with: npx oneie restore', backup.timestamp);
  }

  // 6. Execute installation
  const result = await executeStrategy(strategy, detection, options);

  // 7. Verify installation
  const verification = await verifyInstallation();

  if (verification.success) {
    console.log('✓ Installation verified');
    return { success: true, ...result };
  } else {
    console.log('⚠️  Installation completed with warnings');
    return { success: false, warnings: verification.warnings };
  }
}
```

## Strategy Decision Logic

```typescript
function chooseStrategy(detection: ProjectDetection): InstallStrategy {
  // Empty directory - perfect!
  if (detection.isEmpty) {
    return 'fresh';
  }

  // ONE already installed - upgrade
  if (detection.framework === 'one') {
    return 'upgrade';
  }

  // Astro project - compatible, can merge
  if (detection.framework === 'astro' && !detection.hasConflicts) {
    return 'merge';
  }

  // Astro with conflicts - ask user
  if (detection.framework === 'astro' && detection.hasConflicts) {
    // In agent mode, default to subfolder (safest)
    return 'subfolder';
  }

  // Any other framework - subfolder for safety
  if (detection.framework !== 'none') {
    return 'subfolder';
  }

  // Unknown situation - play it safe
  return 'subfolder';
}
```

## Output Examples

### Success: Fresh Install

```bash
$ npx oneie agent

🔍 Detected: Empty directory
📋 Strategy: Fresh installation
💾 No backup needed (directory empty)

✓ Created project structure
✓ Installed dependencies (23 packages)
✓ Generated environment files
✓ Your ONE Platform is ready!

Next steps:
  /one              # Show control center
  bun run dev       # Start development
```

### Success: Merge Install

```bash
$ npx oneie agent

🔍 Detected: Astro project
📋 Strategy: Merge installation
💾 Backup created: 2025-01-08T10-30-00
   Restore with: npx oneie restore 2025-01-08T10-30-00

✓ Backed up 4 files
✓ Merged package.json (added 8 dependencies)
✓ Merged .env (preserved existing variables)
✓ Added ONE documentation to /one
✓ Added backend to /backend
✓ Added Claude config to /.claude

⚠️  Your existing pages preserved in:
   src/pages/index.astro
   src/pages/about.astro

✓ Installation complete!

Next steps:
  /one              # See ONE commands
  bun run dev       # Your existing dev script
  bun run one:dev   # ONE-specific dev script
```

### Success: Subfolder Install

```bash
$ npx oneie agent

🔍 Detected: Next.js project
📋 Strategy: Subfolder installation
💾 No backup needed (isolated install)

⚠️  Next.js and ONE use different routing systems.
   Installing ONE in subfolder: ./one-platform

✓ Created ./one-platform
✓ Installed ONE Platform
✓ Completely isolated from your Next.js project

✓ Installation complete!

Your projects:
  ./              Next.js project (unchanged)
  ./one-platform  ONE Platform (new)

Next steps:
  cd one-platform
  /one              # Start using ONE
```

### Success: Upgrade Install

```bash
$ npx oneie agent

🔍 Detected: ONE Platform (v1.0.0)
📋 Strategy: Upgrade to v1.1.0
💾 Backup created: 2025-01-08T10-30-00
   Your customizations backed up

✓ Backed up user customizations
✓ Updated core files
✓ Preserved installation folder: /acme
✓ Preserved custom agents: /.claude/agents/custom-agent.md
✓ Updated dependencies
✓ Merged new features

✓ Upgrade complete!

What's new in v1.1.0:
  - New agent: agent-problem-solver
  - Enhanced cycle workflow
  - Improved documentation

Next steps:
  /one              # See updated commands
```

### Error: Safety Check Failed

```bash
$ npx oneie agent

🔍 Detected: React project
❌ Safety checks failed:
  - Git repository not initialized. Run: git init
  - Node.js 18+ required (found: v16.14.0)

Cannot continue installation.

Fix these issues first:
  git init
  nvm install 18
  nvm use 18

Then run: npx oneie agent
```

## Restore Functionality

### List Backups

```bash
$ npx oneie restore --list

Available backups:
  1. 2025-01-08T10-30-00 (2 hours ago)
     - Reason: merge-install
     - Files: package.json, .env, CLAUDE.md
     - Size: 15 KB

  2. 2025-01-08T08-15-00 (4 hours ago)
     - Reason: upgrade-install
     - Files: package.json, .claude/
     - Size: 42 KB

Restore with: npx oneie restore <timestamp>
```

### Restore Backup

```bash
$ npx oneie restore 2025-01-08T10-30-00

🔍 Backup found: 2025-01-08T10-30-00
📋 Will restore 3 files:
   - package.json
   - .env
   - CLAUDE.md

⚠️  Current files will be backed up first

Continue? (y/n): y

💾 Created safety backup: 2025-01-08T12-45-00
✓ Restored package.json
✓ Restored .env
✓ Restored CLAUDE.md

✓ Restore complete!

Tip: If something went wrong, restore the safety backup:
  npx oneie restore 2025-01-08T12-45-00
```

## Testing Matrix

| Test Case | Framework | Has Files | Expected Strategy | Expected Outcome |
|-----------|-----------|-----------|-------------------|------------------|
| Empty dir | none | No | fresh | Full install |
| New Astro | astro | Yes | merge | Merge success |
| Astro + conflicts | astro | Yes | subfolder | Isolated install |
| Next.js | nextjs | Yes | subfolder | Isolated install |
| ONE v1.0 | one | Yes | upgrade | Upgrade success |
| Unknown | unknown | Yes | subfolder | Isolated install |
| No git | any | Any | error | Exit with error |
| No space | any | Any | error | Exit with error |

## Implementation Checklist

### Phase 1: Detection
- [ ] Implement `detectProject()`
- [ ] Implement `detectFramework()`
- [ ] Implement conflict detection
- [ ] Test with all framework types

### Phase 2: Safety System
- [ ] Implement backup system
- [ ] Implement restore command
- [ ] Implement safety checks
- [ ] Test backup/restore flow

### Phase 3: Strategies
- [ ] Implement fresh install
- [ ] Implement merge install
- [ ] Implement subfolder install
- [ ] Implement upgrade install

### Phase 4: Merge Logic
- [ ] Implement package.json merge
- [ ] Implement .env merge
- [ ] Implement CLAUDE.md merge
- [ ] Implement config file merge

### Phase 5: Testing
- [ ] Test all scenarios in matrix
- [ ] Test restore functionality
- [ ] Test error handling
- [ ] Test agent integration

## Summary

**Key Safety Features:**

1. ✅ **Never overwrites** without backup
2. ✅ **Smart detection** of existing projects
3. ✅ **Safe strategies** for each scenario
4. ✅ **Full restore** capability
5. ✅ **Clear communication** of what happens
6. ✅ **Reversible** operations
7. ✅ **Idempotent** (safe to run multiple times)

**Result:** Agents can confidently run `npx oneie agent` knowing it will:
- Detect the situation
- Choose the safest strategy
- Backup everything important
- Install without destroying work
- Provide clear next steps

**Philosophy:** "Make it safe first, then make it automatic."

---

**Status:** Ready for implementation
**Dependencies:** npx-agent.md (base command design)
**Estimated Completion:** 2 weeks (includes comprehensive testing)
