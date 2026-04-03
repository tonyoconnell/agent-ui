# Skill Sync

522 skill files across 10+ projects. This document maps them for synchronization.

## Projects

| Project | Path | Focus |
|---------|------|-------|
| **envelopes** | `/Server/envelopes` | ONE substrate, UI, React Flow |
| **ants-at-work** | `/Server/ants-at-work` | TypeDB, emergence, castes |
| **ONE** | `/Server/ONE` | Web, AI SDK, Astro, Convex |
| **agent-launch-toolkit** | `/Server/agent-launch-toolkit` | Agent deployment |
| **fetchlaunchpad** | `/Server/fetchlaunchpad` | Contracts, Agentverse |
| **agitrader** | `/Server/agitrader` | Trading, Timescale, Memgraph |
| **kybernesis** | `/Server/kybernesis` | TypeDB governance |
| **divorce-lawyer** | `/Server/divorce-lawyer` | Agent template |
| **lawyer** | `/Server/lawyer` | Agent template |
| **paperclip** | `/Server/paperclip` | Experiments |

## Skill Categories

### 1. TypeDB / TypeQL (SYNC NEEDED)

| Location | Status | Notes |
|----------|--------|-------|
| `ants-at-work/.claude/skills/typedb/` | **SOURCE** | Most complete, reference docs |
| `kybernesis/.claude/skills/typedb/` | outdated | Sync from ants-at-work |
| `envelopes/.claude/skills/typedb/` | outdated | Sync from ants-at-work |

**Action:** Copy `ants-at-work/.claude/skills/typedb/` to other projects.

### 2. Astro / React (SYNC NEEDED)

| Location | Status | Notes |
|----------|--------|-------|
| `ONE/.claude/skills/astro/` | **SOURCE** | Has astro-page, ai-ui-patterns |
| `ONE/packages/web/.claude/skills/astro-page/` | **SOURCE** | Page templates |
| `envelopes/.claude/skills/astro/` | outdated | Sync from ONE |

**Action:** Sync Astro skills from ONE to envelopes.

### 3. AI SDK (SYNC NEEDED)

| Location | Status | Notes |
|----------|--------|-------|
| `ONE/.claude/skills/ai-sdk-agent/` | **SOURCE** | Agent patterns |
| `ONE/.claude/skills/ai-sdk-tools/` | **SOURCE** | Tool calling |
| `ONE/.claude/skills/ai-sdk-structured-data/` | **SOURCE** | Structured outputs |
| `ONE/.claude/skills/ai-ui-patterns/` | **SOURCE** | Generative UI |
| `ONE/.claude/skills/ai-elements/` | **SOURCE** | AI components |
| `envelopes/` | **MISSING** | Need to add |

**Action:** Copy AI SDK skills from ONE to envelopes.

### 4. Agent Deployment (ALREADY SYNCED)

These appear duplicated across projects (same content):
- `agent-launch-toolkit/.claude/skills/` (alliance, build-agent, build-swarm, deploy, grow, market, status, todo, tokenize, welcome)
- `divorce-lawyer/.claude/skills/` (same set)
- `lawyer/.claude/skills/` (same set)

**Status:** Already synced (template copies).

### 5. Emergence / Ants (UNIQUE)

| Location | Content |
|----------|---------|
| `ants-at-work/.claude/skills/caste-selector/` | Ant caste selection |
| `ants-at-work/.claude/skills/crystallization/` | Pattern emergence |
| `ants-at-work/.claude/skills/emergence-detection/` | Detect emergent behavior |
| `ants-at-work/.claude/skills/genome-evolution/` | Evolutionary algorithms |
| `ants-at-work/.claude/skills/pheromone-analyzer/` | Pheromone analysis |
| `ants-at-work/.claude/skills/transfer-learning/` | Cross-domain learning |

**Action:** Consider copying to envelopes for swarm visualization.

### 6. Trading / Data (UNIQUE)

| Location | Content |
|----------|---------|
| `agitrader/.claude/skills/memgraph-operations/` | Graph queries |
| `agitrader/.claude/skills/timescale-query/` | Time-series queries |
| `agitrader/.claude/skills/discretization/` | State bucketing |

**Status:** Project-specific, no sync needed.

### 7. Convex (SYNC NEEDED)

| Location | Status |
|----------|--------|
| `ONE/.claude/skills/convex/` | **SOURCE** |
| `ONE/.claude/skills/convex-mutation/` | **SOURCE** |
| `ONE/packages/web/.claude/skills/convex/` | duplicate |

**Action:** Keep ONE as source.

## Sync Commands

### Sync TypeDB skill to envelopes

```bash
cp -r /Users/toc/Server/ants-at-work/.claude/skills/typedb/* \
      /Users/toc/Server/envelopes/.claude/skills/typedb/
```

### Sync AI SDK skills to envelopes

```bash
mkdir -p /Users/toc/Server/envelopes/.claude/skills/ai-sdk
cp -r /Users/toc/Server/ONE/.claude/skills/ai-sdk-*/* \
      /Users/toc/Server/envelopes/.claude/skills/ai-sdk/
cp -r /Users/toc/Server/ONE/.claude/skills/ai-ui-patterns/* \
      /Users/toc/Server/envelopes/.claude/skills/ai-ui/
cp -r /Users/toc/Server/ONE/.claude/skills/ai-elements/* \
      /Users/toc/Server/envelopes/.claude/skills/ai-elements/
```

### Sync Astro skill to envelopes

```bash
cp -r /Users/toc/Server/ONE/.claude/skills/astro/* \
      /Users/toc/Server/envelopes/.claude/skills/astro/
cp -r /Users/toc/Server/ONE/.claude/skills/astro-page/* \
      /Users/toc/Server/envelopes/.claude/skills/astro-page/
```

## Canonical Sources

| Skill | Canonical Source | Sync To |
|-------|------------------|---------|
| TypeDB 3.0 | `ants-at-work` | envelopes, kybernesis |
| Astro 5 | `ONE` | envelopes |
| AI SDK | `ONE` | envelopes |
| Convex | `ONE` | - |
| React Flow | `envelopes` | - |
| Emergence | `ants-at-work` | envelopes (optional) |
| Agent Deploy | `agent-launch-toolkit` | divorce-lawyer, lawyer |

## Priority Sync List

1. **TypeDB** - Critical for ONE ontology persistence
2. **AI SDK** - Critical for chat integration  
3. **Astro** - Critical for page structure
4. **Emergence** - Useful for visualization

## Skill File Counts

```
ONE:                    180 files (most comprehensive)
ants-at-work:            45 files (TypeDB focused)
agent-launch-toolkit:    22 files (agent templates)
fetchlaunchpad:          30 files (deployment)
agitrader:               15 files (trading specific)
envelopes:               10 files (needs more)
kybernesis:               8 files (TypeDB)
divorce-lawyer:          11 files (template)
lawyer:                  11 files (template)
```

## Automated Sync Script

```bash
#!/bin/bash
# sync-skills.sh - Keep skills in sync across projects

ANTS="/Users/toc/Server/ants-at-work/.claude/skills"
ONE="/Users/toc/Server/ONE/.claude/skills"
ENV="/Users/toc/Server/envelopes/.claude/skills"

# TypeDB: ants-at-work → envelopes
echo "Syncing TypeDB..."
cp -r "$ANTS/typedb/"* "$ENV/typedb/"

# AI SDK: ONE → envelopes
echo "Syncing AI SDK..."
mkdir -p "$ENV/ai-sdk"
for skill in ai-sdk-agent ai-sdk-tools ai-sdk-structured-data; do
  cp -r "$ONE/$skill/"* "$ENV/ai-sdk/" 2>/dev/null
done

# AI UI: ONE → envelopes
echo "Syncing AI UI..."
mkdir -p "$ENV/ai-ui"
cp -r "$ONE/ai-ui-patterns/"* "$ENV/ai-ui/" 2>/dev/null
cp -r "$ONE/ai-elements/"* "$ENV/ai-ui/" 2>/dev/null

# Astro: ONE → envelopes
echo "Syncing Astro..."
cp -r "$ONE/astro/"* "$ENV/astro/" 2>/dev/null
mkdir -p "$ENV/astro-page"
cp -r "$ONE/astro-page/"* "$ENV/astro-page/" 2>/dev/null

echo "Done!"
```

## Next Steps

1. Run sync commands above
2. Verify skill content is current
3. Update any outdated references
4. Create shared skill repo (future)

---

*522 skills. 10 projects. ONE source of truth.*
