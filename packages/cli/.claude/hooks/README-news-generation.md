# Automated News Generation from Git Commits

## Overview

Every meaningful commit automatically triggers news article generation using the `agent-writer` agent.

**Flow:**
```
git commit → post-commit hook → write-news.sh → agent-writer → news article
```

## Files Created

### Agent
- `.claude/agents/agent-writer.md` - Content strategist with voice inspired by Alex Hormozi, Wired, Ars Technica, Fast Company, and Theo

### Hook
- `.claude/hooks/write-news.sh` - Postcommit hook that prepares context for news generation
- `.git/hooks/post-commit` - Updated to call write-news.sh

### Output
- `web/src/content/news/*.md` - Generated news articles (no dates in filenames!)

## Usage

### Automatic (After Each Commit)

The hook runs automatically after every commit:

```bash
git commit -m "feat: Add video upload support"
# Hook fires, prepares context for news generation
```

### Skip News Generation

Add `[skip-news]` or `[no-news]` to skip:

```bash
git commit -m "fix: typo [skip-news]"
```

### Manual Generation

Ask Claude Code to use agent-writer:

```
Use agent-writer to create a news article from the latest commit.
```

Claude will:
1. Read commit info from the prepared context
2. Generate engaging article with proper voice
3. Save to `web/src/content/news/[descriptive-slug].md`

## Voice Guidelines

### Style Pillars

1. **Authority** - We know our shit. Zero fluff.
2. **Humor** - Code is serious. Writing about it isn't.
3. **Sarcasm** - When appropriate (earned, not default)
4. **Warmth** - Rooting for the reader
5. **Education** - Every piece teaches something

### Influences

- **Alex Hormozi** - Direct, value-focused, no filler
- **Wired** - Technical depth with narrative
- **Ars Technica** - Respects reader intelligence
- **Fast Company** - Business implications clear
- **Theo (YouTube)** - Modern dev voice, opinionated but fair

### Do This

✅ Benefits before features
✅ Specificity (87% faster, not "faster")
✅ Code examples over walls of text
✅ Self-aware humor

### Avoid This

❌ Jargon without explanation
❌ Features without benefits
❌ Punching down at readers
❌ Humor that obscures the message

## File Naming

**CRITICAL:** Use descriptive slugs, NOT dates.

```bash
✅ video-upload-cloudflare-stream.md
✅ api-separation-rest-graphql.md
✅ lighthouse-perfect-scores.md

❌ 2025-11-08-video-upload.md
```

**Why?**
- Better URLs: `one.ie/news/video-upload` vs `one.ie/news/2025-11-08-video`
- SEO-friendly keywords in URL
- Timeless content (no stale dates)
- Date goes in frontmatter, not filename

## Commit Types That Trigger News

| Type | Generates News? | Category |
|------|----------------|----------|
| `feat` | ✅ Yes | feature |
| `fix` | ✅ Yes | infrastructure |
| `perf` | ✅ Yes | article |
| `refactor` | ✅ Yes | infrastructure |
| `docs` | ❌ No | - |
| `chore` | ❌ No | - |
| `style` | ❌ No | - |
| `test` | ❌ No | - |

## Article Structure

```markdown
---
title: "[Benefit-Focused Headline]"
date: 2025-11-08
description: "One-sentence value proposition"
author: "ONE Platform Team"
type: "feature_update"
tags: ["tag1", "tag2", "tag3"]
category: "feature"
repo: "web"
draft: false
---

## What Changed

[Clear explanation of the update]

## Why This Matters

[Connect to user needs/pain points]

## How It Works

[Technical details with examples]

## What You Can Do Now

[Clear next steps for readers]
```

## Customization

### Change the Voice

Edit `.claude/agents/agent-writer.md`:

```markdown
## Your Voice

[Add your brand personality]

## Your Influences

[List your style inspirations]
```

### Change the Hook Behavior

Edit `.claude/hooks/write-news.sh`:

```bash
# Skip different commit types
if [[ "$COMMIT_TYPE" == "your-type" ]]; then
  exit 0
fi

# Change category mapping
case "$COMMIT_TYPE" in
  custom)
    CATEGORY="your-category"
    ;;
esac
```

## Examples

### Example 1: Feature Launch

**Commit:**
```bash
git commit -m "feat: Add GraphQL API support with auto-generated types"
```

**Generated Article:**
- Title: "Build Integrations 10x Faster With GraphQL API"
- Focuses on user benefits (faster development)
- Shows code examples
- Explains technical implementation
- Clear next steps

### Example 2: Performance Win

**Commit:**
```bash
git commit -m "perf: Reduce build time from 23s to 3s (87% faster)"
```

**Generated Article:**
- Title: "Subsecond Builds: How We Cut Build Time by 87%"
- Opens with developer pain (waiting for builds)
- Explains optimization techniques
- Shows before/after metrics
- Includes lessons learned

### Example 3: Bug Fix

**Commit:**
```bash
git commit -m "fix: Resolve mobile authentication timeout issue"
```

**Generated Article:**
- Title: "Mobile Login Now Works Instantly (Sorry About That)"
- Acknowledges the problem
- Explains what was wrong
- Shows the fix
- Notes testing improvements

## Workflow Integration

### With PRs

Generate news when PR merges:

```bash
# In PR description
Closes #123

[News]
Title: Ship Features Faster With New Deployment Pipeline
Focus: Developer velocity, time savings
```

Hook uses PR description to enhance article.

### With Releases

Generate comprehensive release notes:

```bash
git tag v1.2.0 -m "Release v1.2.0

Features:
- Video upload
- GraphQL API
- Performance improvements"

# Hook generates release announcement
```

## Quality Checklist

Before publishing, verify:
- [ ] Headline is benefit-focused
- [ ] Opening hooks attention in 2 sentences
- [ ] Technical accuracy (no BS)
- [ ] Code examples compile
- [ ] Links work
- [ ] Tone matches voice guidelines
- [ ] Scannable structure (headers, lists, code)
- [ ] Clear CTA
- [ ] Proper tags and metadata
- [ ] Today's date in frontmatter

## Troubleshooting

### Article Not Generated

**Check:**
1. Commit type is newsworthy (feat|fix|perf|refactor)
2. No `[skip-news]` flag in message
3. Hook script is executable: `chmod +x .claude/hooks/write-news.sh`
4. Hook is registered in `.git/hooks/post-commit`

### Article Quality Poor

**Improve:**
1. Write better commit messages (more context)
2. Customize agent-writer voice in `.claude/agents/agent-writer.md`
3. Edit generated article before publishing
4. Provide more detail in commit body

### Wrong Category/Tags

**Fix:**
1. Edit generated article frontmatter
2. Update hook logic in `.claude/hooks/write-news.sh`
3. Improve commit message format

## Best Practices

### Write Good Commit Messages

**Bad:**
```bash
git commit -m "update stuff"
```

**Good:**
```bash
git commit -m "feat: Add Cloudflare Stream integration for video uploads

Enables uploading videos up to 4K resolution without server storage.
Uses Cloudflare Stream API for processing and delivery.
Reduces infrastructure costs by 90%."
```

Better commits = better articles.

### Use Conventional Commits

```bash
type(scope): subject

body

footer
```

**Examples:**
```bash
feat(api): Add GraphQL endpoint with type generation
fix(auth): Resolve mobile session timeout on iOS
perf(build): Reduce bundle size from 800KB to 28KB
refactor(db): Migrate to edge-optimized queries
```

### Tag Strategically

Use tags that users search for:
- Technology: `graphql`, `react`, `cloudflare`
- Feature: `video`, `api`, `auth`
- Benefit: `performance`, `dx`, `security`
- Use case: `ecommerce`, `saas`, `education`

## Future Enhancements

**Coming:**
- ✅ Auto-generate from PR descriptions
- ✅ Multi-language translation
- ✅ Social media post generation
- ✅ Email newsletter compilation
- ✅ Video script generation

## Related Documentation

- **Agent Definition:** `.claude/agents/agent-writer.md`
- **Hook Script:** `.claude/hooks/write-news.sh`
- **Example Article:** `web/src/content/news/automated-news-generation-from-commits.md`
- **Content Schema:** `web/src/content/config.ts` (NewsSchema)

---

**Write code. Ship features. Generate news. Repeat.**
