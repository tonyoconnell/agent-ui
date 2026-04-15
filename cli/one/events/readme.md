# EVENTS Dimension

The EVENTS dimension is the single source of truth for all changes, tracking, and documentation generation.

## Files in This Directory

**Automatically generated:**
- **`0-changes.md`** - Raw change tracking (updated on every commit)

**Automatically archived from cleanup:**
- **`FILENAME-YYYYMMDD-HHMMSS.md`** - Discarded docs from root
- **`web-FILENAME-YYYYMMDD-HHMMSS.md`** - Discarded docs from `/web/`

**To be generated (ready to implement):**
- **`releases/*.md`** or `release-v*.md` - Generated release notes
- **`news/*.md`** or `news-YYYY-MM-DD-*.md` - Generated announcements
- **`documentation/*.md`** or `doc-*.md` - Generated API documentation
- **`changelog.md`** - Aggregated change history

## Allowed Files

Only these markdown files are permitted in root and `/web/`:

- `README.md` - Project overview
- `CLAUDE.md` - Claude Code instructions
- `AGENTS.md` - AI agent definitions
- `LICENSE.md` - License information
- `SECURITY.md` - Security policy

## How It Works

**Cleanup Hook** (`clean-root-markdown.sh`):
- Runs automatically on every commit
- Moves unwanted markdown files from root and `/web/` here
- Adds timestamps to prevent collisions
- Prefixes with `web-` if from `/web/` directory

**Change Tracking Hook** (`track-changes.sh`):
- Runs automatically on every commit
- Logs all changes to `0-changes.md`
- Records file paths and commit messages
- Tracks template vs customization changes

## Naming Convention

All archived files use timestamps to prevent collisions:

```
FILENAME-YYYYMMDD-HHMMSS.md       (from root)
web-FILENAME-YYYYMMDD-HHMMSS.md   (from /web, with source prefix)
```

Examples:
- `IMPLEMENTATION-GUIDE-20251105-142103.md` (from root)
- `web-CODE-QUALITY-INDEX-20251105-142350.md` (from /web)

## Querying Events Data

Find and list archived files:

```bash
# List by modification date (newest first)
ls -lt one/events/ | grep -E "^\-" | head

# Find files by name
ls one/events/ | grep -i MYFILE

# Get most recent version of a file
ls -t one/events/MYFILE-*.md 2>/dev/null | head -1

# Count total events tracked
ls -1 one/events/ | wc -l
```

## Event-Driven Documentation

The EVENTS dimension feeds automated documentation generation:

**Raw Data:**
- `one/events/0-changes.md` - All commits with file paths

**Processing:**
- Parse `0-changes.md` to extract changes
- Group by type (template vs customization)
- Generate structured outputs

**Generated Outputs:**
- Release notes from commits
- News/announcements from changes
- Changelogs from history
- API documentation updates

See `one/knowledge/event-driven-documentation.md` for implementation templates and automation strategies.

---

**System:** 6-Dimension Ontology (EVENTS dimension)
**Source:** Automatic hooks (`.claude/hooks/track-changes.sh` and `clean-root-markdown.sh`)
**Trigger:** Every commit via `.git/hooks/post-commit`
**Purpose:** Single source of truth for all platform changes and documentation
