# Knowledge Tagging Hooks - 6-Dimension Ontology

## Overview

The knowledge tagging hooks automatically map all created/modified artifacts to the **6-dimension ontology**. This enables:

- 📊 Automatic ontology dimension mapping (groups, people, things, connections, events, knowledge)
- 🏷️ Semantic labeling aligned with Reality-as-DSL architecture
- 🔍 RAG-ready artifact indexing for AI agent learning
- 📈 Knowledge tracking per cycle (Cycle 1-100)
- 🧠 Complete audit trail of created knowledge
- 🎯 Guided documentation paths for each dimension

## The 6-Dimension Ontology

**Version:** 3.0.0 (Reality as DSL)

Every artifact created in ONE Platform maps to one of these 6 dimensions:

```
┌──────────────────────────────────────────────────────────────┐
│                         1. GROUPS                             │
│  Multi-tenant isolation with hierarchical nesting             │
│  → /one/groups/ or /<installation-name>/                      │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                         2. PEOPLE                             │
│  Authorization & governance (roles, permissions)              │
│  → /one/people/                                               │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                         3. THINGS                             │
│  All entities (66+ types) - users, products, courses, agents  │
│  → /one/things/, /backend/, /web/                             │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      4. CONNECTIONS                           │
│  All relationships (25+ types) - owns, purchased, enrolled_in │
│  → /one/connections/                                          │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                         5. EVENTS                             │
│  All actions & state changes - created, updated, purchased    │
│  → /one/events/                                               │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                       6. KNOWLEDGE                            │
│  Labels, embeddings, vectors powering RAG & semantic search   │
│  → /one/knowledge/, /test/                                    │
└──────────────────────────────────────────────────────────────┘
```

**Reference:** `/one/knowledge/ontology.md` (Complete specification)

## How It Works

### Pre-Hook: `knowledge-pre.py`

Runs **before** Write/Edit operations to validate and guide ontology mapping:

1. ✅ Maps artifact to correct ontology dimension
2. 🗺️ Shows documentation paths for the dimension
3. 🏷️ Prepares semantic labels (dimension:*, artifact:*, etc.)
4. 📋 Displays ontology structure with highlighted dimension
5. ⚠️ Skips temporary and generated files

**Example Output:**
```
📚 Knowledge Pre-Hook - 6-Dimension Ontology
   Artifact: EntityList.tsx
   Type: code
   Dimension: THINGS
   Docs: /one/things/ or /one/knowledge/ontology.md#things
   Labels: dimension:things, components, ui, frontend
   → Will be tagged in knowledge dimension after creation

    6-Dimension Ontology:
    ┌────────────────────────────────────────┐
    │ 1. GROUPS       - Multi-tenant         │
    │ 2. PEOPLE       - Authorization        │
    │ 3. THINGS       - Entities             │ ← HERE
    │ 4. CONNECTIONS  - Relationships        │
    │ 5. EVENTS       - Actions              │
    │ 6. KNOWLEDGE    - Labels & embeddings  │
    └────────────────────────────────────────┘
```

### Post-Hook: `knowledge-post.py`

Runs **after** Write/Edit operations to create knowledge entries:

1. 📝 Creates knowledge entry with ontology dimension mapping
2. 🏷️ Tags with semantic labels (dimension:*, artifact:*, technology:*, etc.)
3. 🔗 Links to current cycle context (Cycle 1-100)
4. 💾 Saves to daily knowledge log (~/.claude/knowledge-log/)
5. 🔐 Generates content hash for versioning
6. 📊 Tracks ontology version (3.0.0)

**Example Output:**
```
✨ Knowledge Tagged - 6-Dimension Ontology
   Artifact: EntityList.tsx
   Type: code
   Dimension: THINGS
   Labels: dimension:things, components, ui, frontend
   Cycle: 22/100
   Hash: a3f9d2c1b4e5f6a7
   → Logged to: knowledge-2025-11-03.jsonl

    6-Dimension Ontology:
    ┌────────────────────────────────────────┐
    │ 1. GROUPS       - Multi-tenant         │
    │ 2. PEOPLE       - Authorization        │
    │ 3. THINGS       - Entities             │ ✓ Captured
    │ 4. CONNECTIONS  - Relationships        │
    │ 5. EVENTS       - Actions              │
    │ 6. KNOWLEDGE    - Labels & embeddings  │
    └────────────────────────────────────────┘
```

## Knowledge Entry Structure

Each knowledge entry is saved as JSON with ontology dimension mapping:

```json
{
  "type": "knowledge_item",
  "artifact_type": "code",
  "ontology_dimension": "things",
  "file_path": "/Users/toc/Server/ONE/web/src/components/EntityList.tsx",
  "file_name": "EntityList.tsx",
  "labels": [
    "dimension:things",
    "components",
    "ui",
    "frontend",
    "artifact:code"
  ],
  "content_hash": "a3f9d2c1b4e5f6a7",
  "created_at": "2025-11-03T21:30:45.123456",
  "cycle_number": 22,
  "feature": "Entity Management",
  "organization": "Default Org",
  "created_by_role": "platform_owner",
  "content_preview": "import { useQuery } from 'convex/react'...",
  "metadata": {
    "file_size": 1234,
    "directory": "/Users/toc/Server/ONE/web/src/components",
    "extension": ".tsx",
    "ontology_version": "3.0.0"
  }
}
```

## Ontology Dimension Mapping

The hooks automatically map file paths to ontology dimensions:

| Dimension | File Paths | Labels |
|-----------|-----------|--------|
| **GROUPS** | `/one/groups/`, `/<installation>/`, `/groups/` | `dimension:groups`, `multi-tenancy`, `isolation` |
| **PEOPLE** | `/one/people/` | `dimension:people`, `authorization`, `governance`, `roles` |
| **THINGS** | `/one/things/`, `/backend/`, `/web/` | `dimension:things`, `entities`, `schema`, `mutations`, `queries` |
| **CONNECTIONS** | `/one/connections/` | `dimension:connections`, `relationships`, `patterns` |
| **EVENTS** | `/one/events/` | `dimension:events`, `actions`, `audit-trail` |
| **KNOWLEDGE** | `/one/knowledge/`, `/test/` | `dimension:knowledge`, `documentation`, `patterns`, `testing` |

## Semantic Label Taxonomy

Labels follow ontology governance prefixes:

- **dimension:*** - Ontology dimension (groups, people, things, connections, events, knowledge)
- **artifact:*** - Artifact type (code, documentation, test, config, design)
- **technology:*** - Technology stack (react, convex, astro, typescript)
- **pattern:*** - Implementation pattern (crud, event-logging, service)
- **topic:*** - Domain topic (education, commerce, finance)

**Example Labels:**
- `dimension:things` - Maps to THINGS dimension
- `artifact:code` - TypeScript/JavaScript code
- `technology:react` - React component
- `pattern:crud` - CRUD operations pattern
- `topic:education` - Education domain

## Artifact Types

The hooks recognize 5 artifact types:

| Type | Extensions | Labels |
|------|-----------|--------|
| **code** | .py, .ts, .tsx, .js, .jsx, .astro, .json, .yaml | `artifact:code` |
| **documentation** | .md, .mdx, .txt | `artifact:documentation` |
| **test** | .test.ts, .spec.ts, etc. | `artifact:test` |
| **config** | .json, .yaml, .yml, .toml, .ini | `artifact:config` |
| **design** | .fig, .sketch, .svg, .png, .jpg | `artifact:design` |

## Smart Path Mapping

Labels are automatically generated based on file path and ontology dimension:

| Path Pattern | Dimension | Auto Labels |
|-------------|-----------|-------------|
| `/one/groups` | GROUPS | `dimension:groups`, `ontology`, `multi-tenancy` |
| `/one/people` | PEOPLE | `dimension:people`, `ontology`, `authorization`, `governance` |
| `/one/things` | THINGS | `dimension:things`, `ontology`, `entities`, `specifications` |
| `/backend/convex/schema` | THINGS | `dimension:things`, `schema`, `entities`, `backend` |
| `/backend/convex/mutations` | THINGS | `dimension:things`, `mutations`, `write-operations` |
| `/backend/convex/queries` | THINGS | `dimension:things`, `queries`, `read-operations` |
| `/backend/convex/services` | THINGS | `dimension:things`, `services`, `business-logic` |
| `/web/src/components` | THINGS | `dimension:things`, `components`, `ui`, `frontend` |
| `/web/src/pages` | THINGS | `dimension:things`, `pages`, `routing`, `frontend` |
| `/one/connections` | CONNECTIONS | `dimension:connections`, `ontology`, `relationships` |
| `/one/events` | EVENTS | `dimension:events`, `ontology`, `actions`, `audit-trail` |
| `/one/knowledge` | KNOWLEDGE | `dimension:knowledge`, `ontology`, `documentation` |
| `/test` | KNOWLEDGE | `dimension:knowledge`, `testing`, `quality`, `validation` |

## Installation Folders (Multi-Tenancy)

Installation-specific artifacts map to the GROUPS dimension:

| Path Pattern | Dimension | Labels |
|-------------|-----------|--------|
| `/<installation-name>/` | GROUPS | `dimension:groups`, `installation`, `organization` |
| `/<installation>/groups/<group-slug>/` | GROUPS | `dimension:groups`, `group-specific`, `team` |

**Example:** `/acme/knowledge/brand-guide.md` → `dimension:groups`, `installation`, `organization`

## Knowledge Logs

Knowledge entries are saved to `~/.claude/knowledge-log/` as daily JSONL files:

```
~/.claude/knowledge-log/
├── knowledge-2025-11-03.jsonl
├── knowledge-2025-11-02.jsonl
└── knowledge-2025-11-01.jsonl
```

Each line is a complete JSON knowledge entry. This format enables:

- 📊 Easy aggregation and analysis
- 🔍 Fast searching with grep/jq
- 📈 Knowledge growth tracking per dimension
- 🧠 RAG corpus building for AI agents
- 🎯 Ontology dimension coverage metrics

## Cycle Context Integration

The hooks integrate with the cycle tracking system:

- 📍 Current cycle number (1-100)
- 🎯 Feature being implemented
- 🏢 Organization context
- 👤 Person role (platform_owner, org_owner, etc.)

**State File:** `.claude/state/cycle.json`

This links every knowledge artifact back to:
1. The cycle that created it (1-100)
2. The feature being implemented
3. The organization context
4. The person role (authorization dimension)

## Filtering Rules

The hooks **skip** tagging for:

- ❌ Temporary files (`/tmp/`, `/.temp/`)
- ❌ Generated files (`/_generated/`, `/node_modules/`)
- ❌ Non-recognized artifact types
- ❌ Non-Write/Edit operations (Read, Bash, etc.)

## Usage Example

When you create a new component:

```typescript
// Write: web/src/components/TokenBalance.tsx
import { useQuery } from 'convex/react';
export function TokenBalance({ userId }) { ... }
```

**Pre-Hook Output:**
```
📚 Knowledge Pre-Hook - 6-Dimension Ontology
   Artifact: TokenBalance.tsx
   Type: code
   Dimension: THINGS
   Docs: /one/things/ or /one/knowledge/ontology.md#things
   Labels: dimension:things, components, ui, frontend
   → Will be tagged in knowledge dimension after creation

    6-Dimension Ontology:
    ┌────────────────────────────────────────┐
    │ 1. GROUPS       - Multi-tenant         │
    │ 2. PEOPLE       - Authorization        │
    │ 3. THINGS       - Entities             │ ← HERE
    │ 4. CONNECTIONS  - Relationships        │
    │ 5. EVENTS       - Actions              │
    │ 6. KNOWLEDGE    - Labels & embeddings  │
    └────────────────────────────────────────┘
```

**Post-Hook Output:**
```
✨ Knowledge Tagged - 6-Dimension Ontology
   Artifact: TokenBalance.tsx
   Type: code
   Dimension: THINGS
   Labels: dimension:things, components, ui, frontend
   Cycle: 22/100
   Hash: b8c3d4e5f6a7b8c9
   → Logged to: knowledge-2025-11-03.jsonl

    6-Dimension Ontology:
    ┌────────────────────────────────────────┐
    │ 1. GROUPS       - Multi-tenant         │
    │ 2. PEOPLE       - Authorization        │
    │ 3. THINGS       - Entities             │ ✓ Captured
    │ 4. CONNECTIONS  - Relationships        │
    │ 5. EVENTS       - Actions              │
    │ 6. KNOWLEDGE    - Labels & embeddings  │
    └────────────────────────────────────────┘
```

## Querying Knowledge Logs

Use `jq` to query knowledge logs by dimension:

```bash
# All artifacts created today
cat ~/.claude/knowledge-log/knowledge-$(date +%Y-%m-%d).jsonl | jq .

# All THINGS dimension artifacts
cat ~/.claude/knowledge-log/*.jsonl | jq 'select(.ontology_dimension == "things")'

# All GROUPS dimension artifacts (multi-tenancy)
cat ~/.claude/knowledge-log/*.jsonl | jq 'select(.ontology_dimension == "groups")'

# All code artifacts
cat ~/.claude/knowledge-log/*.jsonl | jq 'select(.artifact_type == "code")'

# All artifacts for cycle 22
cat ~/.claude/knowledge-log/*.jsonl | jq 'select(.cycle_number == 22)'

# All frontend components (THINGS dimension)
cat ~/.claude/knowledge-log/*.jsonl | jq 'select(.labels | contains(["dimension:things", "components", "frontend"]))'

# Count by ontology dimension
cat ~/.claude/knowledge-log/*.jsonl | jq -r '.ontology_dimension' | sort | uniq -c

# Ontology coverage (which dimensions have artifacts)
cat ~/.claude/knowledge-log/*.jsonl | jq -r '.ontology_dimension' | sort | uniq
```

## Integration with 6-Dimension Ontology

These hooks implement **Dimension 6: Knowledge** while mapping all artifacts to their correct dimension:

```
1. GROUPS       → Multi-tenant isolation (installation folders)
2. PEOPLE       → Authorization & roles (who can do what)
3. THINGS       → Entities (backend, frontend, schema)
4. CONNECTIONS  → Relationships (how things relate)
5. EVENTS       → Actions (what happened when)
6. KNOWLEDGE    → 🟢 Labels + embeddings + vectors (YOU ARE HERE)
```

Every artifact created is:
1. ✅ Mapped to correct **ontology dimension** (1-6)
2. 🏷️ Tagged with **semantic labels** (dimension:*, artifact:*, etc.)
3. 🔗 Linked to **cycle context** (Cycle 1-100)
4. 📊 Indexed for **RAG search** (embeddings ready)
5. 🎯 Guided to **dimension docs** (ontology alignment)

## Benefits

- **98% AI code generation accuracy** - Agents learn from ontology-aligned knowledge
- **Pattern convergence** - All features map to same 6 dimensions
- **Semantic search** - Find similar implementations by dimension and labels
- **Ontology governance** - Ensure all artifacts align with reality model
- **Knowledge compounding** - Each feature makes the next more accurate

## Future Enhancements

Planned improvements:

- 🧠 Auto-generate embeddings with OpenAI/Anthropic
- 🔍 Vector search across all dimensions
- 📊 Knowledge dashboard visualization by dimension
- 🤖 RAG-powered code search by ontology dimension
- 📈 Ontology coverage metrics (which dimensions need work)
- 🔗 Link artifacts to related things via thingKnowledge junction
- 🎯 Dimension-specific documentation generation

## Troubleshooting

### Hooks not running?

Check that hooks are executable:
```bash
chmod +x .claude/hooks/knowledge-*.py
```

### Knowledge logs not created?

Ensure directory exists:
```bash
mkdir -p ~/.claude/knowledge-log
```

### Want to test hooks manually?

```bash
# Test pre-hook
echo '{"hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"file_path":"/Users/toc/Server/ONE/web/src/components/Test.tsx"}}' | python3 .claude/hooks/knowledge-pre.py

# Test post-hook
echo '{"hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":"/Users/toc/Server/ONE/web/src/components/Test.tsx","content":"test content"}}' | python3 .claude/hooks/knowledge-post.py
```

### Want to disable temporarily?

Remove from `.claude/settings.local.json`:
```json
// Remove these blocks
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/knowledge-pre.py",
  "timeout": 5
}
```

## See Also

- **`validate-ontology-structure.py`**: Validates 6-dimension ontology structure
- **`todo.py`**: Cycle context tracking (Cycle 1-100)
- **`done.py`**: Marks cycles complete
- **`/one/knowledge/ontology.md`**: Complete 6-dimension ontology spec (Version 3.0.0)
- **`/one/knowledge/todo.md`**: 100-cycle execution sequence

---

**Built with clarity, simplicity, and infinite scale in mind.**

The 6-dimension ontology models reality itself. These hooks ensure every artifact aligns with that reality.
