# Event-Driven Documentation Generation

Use the EVENTS dimension as the single source of truth for documentation, release notes, and news.

## Architecture

All changes flow through the EVENTS dimension:

```
git commit
    ↓
track-changes.sh (logs to one/events/0-changes.md)
    ↓
clean-root-markdown.sh (moves files to one/events/archived/)
    ↓
one/events/ (single source of truth)
    ├── 0-changes.md (raw change data)
    ├── archived/ (discarded docs)
    ├── releases/ (generated release notes)
    ├── news/ (generated announcements)
    └── documentation/ (generated docs)
```

## Data Flow

### 1. Raw Change Data

**File:** `one/events/0-changes.md`

Automatically populated by `track-changes.sh` on every commit:

```markdown
### abc12345 — template:2 custom:3 [customization] — `feat: Add new components`

**Template:**
  - web/src/components/Button.tsx
  - web/src/components/Card.tsx

**Your Changes:**
  - my-site/src/pages/home.astro
  - my-site/src/styles/brand.css
  - my-site/config.json
```

### 2. Archived Cleanup Data

**Directory:** `one/events/archived/`

Files removed from root and `/web/` are archived here with timestamps:

```
one/events/archived/
├── DOCS-SYSTEM-GUIDE-20251105-142103.md
├── FILE-REFERENCE-20251105-142103.md
└── web-CODE-QUALITY-INDEX-20251105-142350.md (prefixed with source)
```

## Use Cases

### Generate Release Notes

Parse `0-changes.md` to generate `one/events/releases/v1.2.3.md`:

```bash
#!/bin/bash
# extract-release.sh

VERSION="${1:-latest}"
CHANGES_FILE="one/events/0-changes.md"

# Count commits since last release tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# Extract relevant commits from 0-changes.md
# Filter for template: changes only (exclude [customization] tag)

cat > "one/events/releases/$VERSION.md" << EOF
# Release $VERSION

Generated from one/events/0-changes.md

## Changes

$(grep -v "\[customization\]" "$CHANGES_FILE" | head -20)

## Files Modified

$(grep "^  - " "$CHANGES_FILE" | head -30)
EOF
```

### Generate News/Announcements

Convert commits to news items in `one/events/news/`:

```bash
#!/bin/bash
# generate-news.sh

# For each commit in past 24 hours
# Create news entry in one/events/news/YYYY-MM-DD-message.md

while IFS= read -r line; do
  # Extract: commit hash, file counts, message
  if [[ $line =~ \*\*([a-f0-9]+)\*\*.*-\s\`(.*)\` ]]; then
    HASH="${BASH_REMATCH[1]}"
    MSG="${BASH_REMATCH[2]}"
    DATE=$(date +%Y-%m-%d)

    # Create news item
    NEWS_FILE="one/events/news/$DATE-${MSG// /-}.md"

    cat > "$NEWS_FILE" << EOF
# $MSG

**Commit:** $HASH
**Date:** $(date)

- Details from commit here
- Files changed
- Impact analysis
EOF
  fi
done < <(cat one/events/0-changes.md)
```

### Generate Changelog

Aggregate all events into `one/events/changelog.md`:

```bash
#!/bin/bash
# generate-changelog.sh

{
  echo "# Changelog"
  echo ""
  echo "All changes tracked automatically from one/events/0-changes.md"
  echo ""

  # Copy raw changes (excluding customizations for public changelog)
  grep -v "\[customization\]" one/events/0-changes.md

} > one/events/changelog.md
```

### Track Template vs Custom Changes

Separate dashboards from `0-changes.md`:

```bash
#!/bin/bash
# analyze-changes.sh

echo "## Template Changes (Last 30 Days)"
grep -v "\[customization\]" one/events/0-changes.md | wc -l
echo " commits"

echo ""
echo "## Your Customizations (Last 30 Days)"
grep "\[customization\]" one/events/0-changes.md | wc -l
echo " customizations"

echo ""
echo "## Files Most Changed"
grep "^  - " one/events/0-changes.md | \
  cut -d/ -f1-2 | \
  sort | uniq -c | sort -rn | head -10
```

## Automation Ideas

### Scheduled Jobs

Run these periodically (via GitHub Actions or cron):

1. **Every commit** - Update `0-changes.md` and archive cleanup docs
2. **Daily** - Generate news items from yesterday's commits
3. **Weekly** - Aggregate changelog and update documentation
4. **On release tag** - Generate release notes and publish

### CI/CD Integration

```yaml
# .github/workflows/document-changes.yml
name: Document Changes

on:
  push:
    branches: [main]

jobs:
  document:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Generate changelog
      - run: ./scripts/generate-changelog.sh

      # Generate news
      - run: ./scripts/generate-news.sh

      # Generate release notes (if tag)
      - run: ./scripts/extract-release.sh
        if: startsWith(github.ref, 'refs/tags/')

      # Commit generated files
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'chore: auto-generate documentation'
```

## Event Dimension Design

The EVENTS dimension is perfect for this because:

1. **Complete audit trail** - Every change is logged
2. **Structured data** - Hash, files, message, timestamp
3. **Queryable** - Easy to grep and filter
4. **Chronological** - Newest first for easy navigation
5. **6D ontology-aligned** - Fits naturally in the 6 dimensions

## Files Structure

```
one/events/
├── 0-changes.md                 # Raw commit data (auto-populated)
├── archived/                     # Discarded docs (auto-moved)
│   ├── DOCS-SYSTEM-GUIDE-*.md
│   └── FILE-REFERENCE-*.md
├── releases/                     # Generated release notes
│   ├── v1.0.0.md
│   └── v1.1.0.md
├── news/                         # Generated announcements
│   ├── 2025-11-05-new-feature.md
│   └── 2025-11-04-bug-fix.md
├── documentation/                # Generated API docs
│   ├── components.md
│   └── functions.md
└── changelog.md                  # Aggregated changelog
```

## Implementation Roadmap

1. **Phase 1** (Done)
   - `track-changes.sh` - logs to `0-changes.md`
   - `clean-root-markdown.sh` - archives to `archived/`

2. **Phase 2** (Ready to implement)
   - `generate-changelog.sh` - creates `changelog.md`
   - `generate-release-notes.sh` - creates `releases/*.md`
   - `generate-news.sh` - creates `news/*.md`

3. **Phase 3** (Future)
   - CI/CD automation (GitHub Actions)
   - Automated publishing (docs site, GitHub releases)
   - Analytics (stats, trends, velocity)

## Benefits

- **Single Source of Truth** - All documentation from `0-changes.md`
- **Zero Maintenance** - Auto-generated from actual changes
- **Complete History** - Never lose change information
- **Easy Querying** - Plain text, grep-able format
- **6D Alignment** - EVENTS dimension perfectly suited

---

**Key Insight:** The EVENTS dimension becomes the hub for everything - tracking, archiving, and documentation generation. One stream, infinite uses.
