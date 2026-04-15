# Root Cleanup Hook - 6-Dimension Ontology Alignment

**Purpose:** Automatically moves misplaced documentation files from the root directory to the appropriate `/one/<dimension>/` directory based on the 6-dimension ontology.

## 6-Dimension Ontology

The ONE platform organizes all documentation and data according to six fundamental dimensions:

1. **groups** - Hierarchical containers (organizations, teams, communities)
2. **people** - Authorization & governance (roles, users, governance)
3. **things** - Entities (specs, plans, components, agents)
4. **connections** - Relationships (protocols, workflows, integrations)
5. **events** - Actions & state changes (deployments, releases, reports)
6. **knowledge** - Labels & learning (architecture, patterns, rules, guides)

## Approved Root Files

Only these files are allowed to remain in the root directory:

- `README.md` - Platform overview and quick start
- `LICENSE.md` - Legal terms and conditions
- `SECURITY.md` - Security policy and vulnerability reporting
- `CLAUDE.md` - Claude Code instructions
- `AGENTS.md` - AI agent coordination and rules

All other markdown and text files will be moved to appropriate dimension directories.

## Classification Logic

The hook uses intelligent pattern matching to classify files:

### Groups Dimension
**Keywords:** group, organization, org-, team, community, hierarchy
**Examples:** `team-structure.md`, `organization-chart.md`

### People Dimension
**Keywords:** role, user, people, governance, authorization, auth, permission
**Examples:** `user-roles.md`, `governance-model.md`

### Things Dimension
**Keywords:** spec, plan, component, agent, feature, implementation, design, blueprint
**Examples:** `feature-spec.md`, `agent-clean.md`, `component-design.md`

### Connections Dimension
**Keywords:** protocol, workflow, integration, connection, api, sync, communication
**Examples:** `api-integration.md`, `workflow-automation.md`

### Events Dimension
**Keywords:** deploy, release, report, audit, summary, event, log, history, status
**Examples:** `deployment-report.md`, `audit-summary.md`, `release-notes.md`

### Knowledge Dimension
**Keywords:** guide, pattern, rule, architecture, knowledge, best-practice, convention
**Examples:** `architecture-guide.md`, `best-practices.md`, `patterns.md`

**Default:** Files that don't match any pattern are moved to `events/` as general reports.

## Usage

### Manual Execution
```bash
python3 .claude/hooks/root-cleanup.py
```

### Automatic Execution
The hook runs automatically:
- When triggered by Claude Code workflows
- During release processes
- As part of git pre-commit hooks (if configured)

## Features

### 1. Intelligent Classification
Uses filename pattern matching and content preview (first 500 chars) to determine the best dimension for each file.

### 2. Duplicate Handling
If a file with the same name already exists in the target directory, the hook appends a numeric suffix (`_1`, `_2`, etc.) to avoid conflicts.

### 3. Installation Folder Protection
The hook automatically ignores installation-specific folders:
- Standard folders: `web/`, `backend/`, `apps/`, `cli/`, `scripts/`, `node_modules/`
- Installation folders: `one-inc/`, `nine-padel/`, `onei-ie/`, `one.ie/`

### 4. Detailed Reporting
After execution, the hook provides:
- Count of files moved per dimension
- Reason for each classification
- List of approved files kept in root
- Summary of the 6-dimension structure

## Example Output

```
======================================================================
🧹 ROOT CLEANUP - 6-Dimension Ontology Alignment
======================================================================

✅ Moved 8 files to dimension directories:

  📁 /one/things/ (4 files)
     • ALIGNMENT_AUDIT_QUALITY_AGENT.md
       └─ Thing/entity specification
     • IMPLEMENTATION_STATUS.md
       └─ Thing/entity specification

  📁 /one/events/ (4 files)
     • ALIGNMENT_SUMMARY.md
       └─ Event/report content
     • AUDIT-ONTOLOGY-ALIGNMENT.md
       └─ Event/report content

✅ Kept 5 essential files in root:
   • AGENTS.md
   • CLAUDE.md
   • LICENSE.md
   • README.md
   • SECURITY.md

======================================================================
📖 Approved root files: README.md, LICENSE.md, SECURITY.md,
   CLAUDE.md, AGENTS.md

📁 6 Dimensions: groups, people, things, connections, events, knowledge
======================================================================
```

## Testing

The hook includes comprehensive classification tests:

```bash
# Test classification logic
python3 -c "
exec(open('.claude/hooks/root-cleanup.py').read())
test_files = [
    ('team-structure.md', 'groups'),
    ('user-roles.md', 'people'),
    ('feature-spec.md', 'things'),
    ('api-integration.md', 'connections'),
    ('deployment-report.md', 'events'),
    ('architecture-guide.md', 'knowledge'),
]
for filename, expected in test_files:
    dim, reason = classify_file(filename)
    print(f'{filename} → {dim} (expected: {expected})')
"
```

## Benefits

1. **Consistent Organization** - All documentation follows the 6-dimension ontology
2. **Clean Root** - Only essential files remain in root directory
3. **Automatic Classification** - No manual sorting required
4. **Safe Operations** - Protects approved files and installation folders
5. **Clear Reporting** - Understand what was moved and why
6. **Ontology Compliance** - Enforces architectural standards

## Maintenance

### Adding New Keywords
Edit the `classify_file()` function to add new classification patterns:

```python
# Add new keywords for a dimension
if any(word in lower for word in ["existing", "keywords", "new_keyword"]):
    return ("dimension", "Reason for classification")
```

### Updating Approved Files
Modify the `ALLOWED_ROOT_FILES` set:

```python
ALLOWED_ROOT_FILES = {
    "README.md",
    "LICENSE.md",
    # Add new approved files here
}
```

### Adding Installation Folders
Update the `INSTALLATION_FOLDERS` set:

```python
INSTALLATION_FOLDERS = {
    "web", "backend",
    # Add new installation folders here
}
```

## Related Documentation

- `/one/knowledge/ontology.md` - Complete 6-dimension ontology specification
- `CLAUDE.md` - Root directory file policy
- `.claude/hooks/` - Other automation hooks

---

**Version:** 2.0.0 (6-Dimension Aligned)
**Last Updated:** 2025-11-03
**Maintainer:** Clean Agent
