# /news - Generate News Article for Changes

Generate a news article for recent changes and save to `web/src/content/news/`.

## Task

You are generating a **news article** about recent changes to the ONE Platform codebase.

### Context to Gather

1. **Check recent commit:**
   ```bash
   git log -1 --pretty=format:"%H%n%s%n%n%b" --stat
   ```

2. **Get changed files:**
   ```bash
   git diff --name-status HEAD~1 HEAD
   ```

3. **Get commit details:**
   ```bash
   git show --stat HEAD
   ```

### Article Generation Instructions

Use **agent-writer** to create a compelling news article with:

**Article Structure:**
- **Title:** Engaging headline (5-10 words) that captures the change
- **Summary:** One paragraph (2-3 sentences) overview
- **What Changed:** Bullet points of key changes
- **Why It Matters:** Impact on users/platform
- **Technical Details:** Implementation specifics
- **What's Next:** Future implications or roadmap hints

**Writing Style:**
- Authority (like Wired/Ars Technica)
- Warmth (accessible, not corporate)
- Educational depth (explain the "why")
- Excitement (make changes feel meaningful)

**Tone Examples:**
- ✅ "The ONE Platform now supports native podcast hosting with chapter navigation—transforming how creators share audio content."
- ✅ "Under the hood, we've eliminated React hydration mismatches by deferring blob URL generation to the client."
- ❌ "We added podcasts." (too dry)
- ❌ "OMG PODCASTS ARE HERE!!!" (too casual)

### File Naming Convention

Generate filename from commit message:
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Add `.md` extension

**Examples:**
- Commit: "feat: Add podcast support" → `add-podcast-support.md`
- Commit: "fix: VideoPlayer hydration" → "fix-videoplayer-hydration.md"
- Commit: "docs: Update API guide" → "update-api-guide.md"

### Frontmatter Template

```yaml
---
title: "Article Title Here"
description: "One-sentence summary of the change"
date: 2025-11-10  # TODAY'S DATE in YYYY-MM-DD format (from <env>)
author: "ONE Platform Team"
category: "feature" # or: fix, performance, docs, release
type: "feature_added" # Activity type (file_created, feature_added, etc.)
tags: ["tag1", "tag2", "tag3"]
featured: false # Set to true for homepage feature
draft: false # Set to true to hide
path: "relative/file/path.md" # Original file path
repo: "web" # Which repo: web, backend, one, cli
---
```

**CRITICAL:** The `date` field MUST:
- Be today's date from `<env>Today's date: YYYY-MM-DD</env>`
- Be in YYYY-MM-DD format (no quotes needed in YAML)
- Match the actual publication date
- NOT be a placeholder like "2025-01-01" or "YYYY-MM-DD"

### Schema Fields (from web/src/content/config.ts)

**Required:**
- `title` (string) - Title of the article/update
- `date` (date) - Publication/update date

**Optional:**
- `description` (string) - Optional description
- `author` (string) - Author name (defaults to "ONE")
- `category` (string) - News category (AI, Platform, Technology, Feature, etc.)
- `type` (string) - Activity type (file_created, feature_added, etc.)
- `tags` (array) - Tags for categorization
- `featured` (boolean) - Feature on homepage (default: false)
- `draft` (boolean) - Hide if draft (default: false)
- `path` (string) - Original file path
- `repo` (string) - Which repo (web, backend, one, cli)

### Content Categories

- **feature:** New capabilities, components, or pages
- **fix:** Bug fixes, performance improvements
- **performance:** Speed, optimization, efficiency gains
- **docs:** Documentation, guides, tutorials
- **release:** Version releases, major milestones
- **AI:** AI/ML advancements, agent features
- **Platform:** Platform infrastructure, architecture
- **Technology:** Tech stack updates, dependencies

### Execution Steps

1. **Analyze the commit:**
   - Read commit message and diff
   - Identify what changed and why
   - Determine impact on users/platform

2. **Launch agent-writer with parallel subagents:**

   **CRITICAL:** Use agent-writer to coordinate multiple specialist agents working in parallel:

   ```
   Use Task tool with subagent_type=agent-writer

   In the prompt, ALWAYS include:
   - Today's date from <env> (e.g., "2025-11-10")
   - Commit hash and details
   - Git diff summary

   Instruct agent-writer to spin up these specialists IN PARALLEL:

   - Research Agent: Analyze git commit, gather technical context
   - Content Strategist: Draft article structure and key messages
   - Technical Writer: Write technical details section
   - Marketing Writer: Write "Why It Matters" and impact sections
   - Editor: Review and unify voice across all sections
   ```

   **Parallel execution benefit:** 5 agents working simultaneously = 5x faster than sequential.

   **Date Handling:** Always provide today's date from the environment. The frontmatter `date` field must be in YYYY-MM-DD format.

3. **agent-writer coordinates:**
   - Launches all 5 specialists in a SINGLE message with multiple Task calls
   - Each specialist works on their section independently
   - agent-writer assembles final article from all sections
   - Ensures consistent voice and tone

4. **Save to correct location:**
   ```
   web/src/content/news/[filename].md
   ```

   **CRITICAL WARNINGS:**
   - ⚠️ ONLY save to `web/src/content/news/` directory
   - ⚠️ DO NOT save to other content collections (blog/, podcasts/, products/)
   - ⚠️ Each collection has its own schema - news articles ONLY go in news/
   - ⚠️ Filename must be lowercase with hyphens, ending in .md

5. **Confirm creation:**
   - Show file path (must be web/src/content/news/*.md)
   - Show article title
   - Show word count
   - Show execution time (compare to sequential)

### Example Usage

**User:** `/news`

**Claude:**
1. Checks latest commit: "feat: Add podcast support with featured ONE ontology episode"
2. Gathers context from git diff
3. Gets today's date from environment: "2025-11-10"
4. Launches agent-writer with parallel execution instructions, including today's date
5. **agent-writer spawns 5 specialists in parallel:**
   - Research Agent: Analyzes commit (git show, git diff)
   - Content Strategist: Outlines article structure
   - Technical Writer: Writes implementation details
   - Marketing Writer: Writes impact and benefits
   - Editor: Reviews and unifies voice
6. **agent-writer assembles final article:**
   - Title: "Native Podcast Support Lands on ONE Platform"
   - Date: 2025-11-10 (from environment)
   - Category: feature
   - Tags: ["podcasts", "audio", "content-collections"]
   - Word count: 487 words
   - Execution time: ~30 seconds (vs. 150s sequential)
7. Saves to: `web/src/content/news/native-podcast-support-lands-on-one-platform.md`
8. Reports: "Created news article (487 words) in 30 seconds using 5 parallel agents"

**Parallel Execution Flow:**
```
Claude
  └─> agent-writer (coordinator)
        ├─> Research Agent ────┐
        ├─> Content Strategist ┤
        ├─> Technical Writer ───┼─> agent-writer assembles ─> Final article
        ├─> Marketing Writer ───┤
        └─> Editor ─────────────┘

        All agents run simultaneously (one message, 5 Task calls)
```

### Advanced Options

If user provides specific commit hash:
```
/news abc123
```

Analyze that specific commit instead of HEAD.

If user provides custom topic:
```
/news "Explain the 6-dimension ontology"
```

Generate article on that topic (not tied to a commit).

### Quality Checklist

Before saving, ensure:
- [ ] Title is engaging and specific
- [ ] Frontmatter is complete and matches NewsSchema
- [ ] Article explains "why" not just "what"
- [ ] Technical details are accurate
- [ ] Tone matches ONE Platform voice
- [ ] Filename follows convention (lowercase-with-hyphens.md)
- [ ] File saved to `web/src/content/news/` (NOT podcasts/, blog/, or other collections)
- [ ] Schema validation will pass (has required title and date fields)

---

## ⚠️ Content Collection Schema Warning

**CRITICAL FOR agent-writer:**

Each content collection has a DIFFERENT schema:

- **news/** - NewsSchema (title, date, description, category, tags)
- **podcasts/** - PodcastSchema (title, description, audioUrl, date, chapters)
- **blog/** - BlogSchema (title, description, date, author)
- **products/** - ProductSchema (name, price, images, category)

**DO NOT create files in other collections unless:**
1. You are specifically asked to create that type of content
2. The frontmatter EXACTLY matches that collection's schema

**For /news command:**
- ALWAYS save to `web/src/content/news/`
- NEVER save to `web/src/content/podcasts/` or other collections
- Use NewsSchema frontmatter ONLY

**Example of WRONG behavior:**
```
❌ Saving news article to web/src/content/podcasts/article.md
❌ Creating technical doc in web/src/content/blog/
❌ Using podcast frontmatter for news article
```

**Example of CORRECT behavior:**
```
✅ Saving news article to web/src/content/news/podcast-feature-launch.md
✅ Using NewsSchema frontmatter (title, date, category, tags)
✅ Following naming convention (lowercase-with-hyphens.md)
```

---

**Generate compelling news articles that educate, excite, and explain changes to the ONE Platform.**
