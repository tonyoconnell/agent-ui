# News System Commands

Quick reference for using the news curation system.

---

## Basic Commands

### Start News Curation
```bash
/news "AI agents and reasoning"
```

Agent will:
1. Ask clarifying questions (30 sec)
2. Search web for sources (1-2 min)
3. Crawl articles (2-3 min)
4. Rewrite in ONE voice (2-3 min)
5. Show preview for approval (1 min)
6. Publish & collect feedback (< 1 min)

**Total: 7-10 minutes to published article**

### Multiple Topics at Once
```bash
/news "AI agents, Astro framework, DevOps"
```

Agent will curate articles for each topic in sequence (or ask which to start with).

### Check Recent Articles
```bash
/news-check
```

Shows:
- Last 5 published articles
- Dates and categories
- Direct links to articles

### View All News
```bash
/news-list
```

Shows:
- All published articles
- Filter options (category, date, tag)
- Links to view/edit

---

## Configuration Commands

### Set Preferences
```bash
/news-settings
```

Options:
- Default article length (quick/medium/deep)
- Technical level (beginner/intermediate/advanced)
- Preferred categories
- Auto-publish threshold (relevance score minimum)
- Tags to focus on

### Give Feedback
```bash
/news-feedback "Love the style! More of this please"
```

Agent learns from:
- Quality ratings (1-5)
- Style comments
- Topic preferences
- Length preferences

### Configure Auto-Publish
```bash
/news-auto "true"
```

Auto-publish articles > 80 relevance score without waiting for approval (use with caution).

---

## Advanced Commands

### Batch Processing
```bash
/news-batch ["AI agents", "Astro", "DevOps", "Performance"]
```

Process multiple topics in sequence, ask for batch approval before publishing.

### Archive Old Articles
```bash
/news-archive "2025-10-01"
```

Move articles older than date to draft status (not deleted, still searchable).

### Search News
```bash
/news-search "agent reasoning"
```

Find articles by keyword, title, or tag.

### Analytics
```bash
/news-analytics
```

Shows:
- Articles published (total, this week, this month)
- Average quality rating
- Top performing topics
- Reader engagement metrics
- Most used tags

### Sync with Backend
```bash
/news-sync
```

Sync published news to Convex backend (when integrated):
- Store articles in database
- Track views and feedback
- Enable full-text search
- Create newsletter functionality

---

## Workflow Shortcuts

### Quick Article (2 min)
```bash
/news-quick "topic"
```

Agent uses fast mode:
- Skips clarifying questions (use last preferences)
- Crawls 1-2 top sources only
- Brief rewrite
- Auto-publish if relevance > 75

**Result:** Article published in 2-3 minutes

### Deep Dive (15 min)
```bash
/news-deep "topic"
```

Agent uses thorough mode:
- Detailed clarifying questions
- Crawls 5-10 top sources
- Comprehensive rewrite with examples
- Manual approval required

**Result:** In-depth article with maximum relevance

### Weekly Roundup
```bash
/news-roundup
```

Agent creates summary of week's news:
- Compiles 5-10 articles from different topics
- Creates overview article linking to each
- Highlights most important developments
- Email-ready format

---

## Feedback Commands

### Rate Article Quality
```bash
/news-rate "2025-10-30-ai-agents" 5
```

Rate published article (1-5 stars).

### Comment on Style
```bash
/news-comment "2025-10-30-ai-agents" "Perfect balance of technical and practical"
```

Provide feedback to improve future articles.

### Request Revisions
```bash
/news-revise "2025-10-30-ai-agents" "Make it less technical"
```

Request changes to published article (agent will improve).

### Hide Article
```bash
/news-hide "2025-10-30-ai-agents"
```

Mark article as draft without deleting (can restore later).

---

## Topic-Specific Commands

### AI Topic News
```bash
/news-ai
```

Shortcut for `/news "AI, machine learning, neural networks, LLMs"`

### Platform Topic News
```bash
/news-platform
```

Shortcut for `/news "Astro, Convex, deployment, infrastructure"`

### Business Topic News
```bash
/news-business
```

Shortcut for `/news "startups, platform economics, SaaS, Creator economy"`

### Web Dev News
```bash
/news-web
```

Shortcut for `/news "React, TypeScript, performance, frameworks"`

### Community News
```bash
/news-community
```

Shortcut for `/news "user stories, integrations, open source, events"`

---

## Integration Commands

### Email Digest
```bash
/news-email "weekly"
```

Create weekly email digest of top articles (weekly/daily options).

### Slack Channel
```bash
/news-slack "#news"
```

Post new articles to Slack channel (when integrated).

### RSS Feed
```bash
/news-rss
```

Generate RSS feed for news articles.

### Newsletter
```bash
/news-newsletter "create"
```

Create newsletter with latest articles (when integrated with Convex).

---

## Help & Documentation

### Quick Start
```bash
/news-help
```

Shows:
- Quick start guide
- Common commands
- Examples
- Links to full documentation

### Examples
```bash
/news-examples
```

Shows:
- Example workflows
- Sample articles
- Common use cases
- Tips and tricks

### Full Documentation
```bash
/news-docs
```

Links to:
- agent-news.md (full specification)
- NEWS-QUICKSTART.md (quick reference)
- NEWS-README.md (system overview)
- NEWS-SYSTEM-SUMMARY.md (implementation summary)

---

## Example Sessions

### Session 1: AI Agents News (10 min)
```bash
/news "AI agents"
# Agent asks clarifying questions
# You respond: "Research, intermediate, medium"
# Agent searches, crawls, rewrites
# You approve, article published
# You rate: 5 stars, "Love it!"
```

**Result:** One published article, feedback collected

### Session 2: Weekly Roundup (5 min)
```bash
/news-roundup
# Agent compiles week's articles
# Shows summary with 10 articles
# You approve batch
# All published with links
```

**Result:** Comprehensive weekly roundup

### Session 3: Multiple Topics (20 min)
```bash
/news-batch ["AI", "Platform", "Web Dev"]
# Agent processes each topic
# Shows 3 articles total (1 per topic)
# You approve/edit each
# All published at once
```

**Result:** Three curated articles, different topics

---

## Pro Tips

### 1. Be Specific with Topics
```bash
# Good
/news "AI agents with multi-step reasoning"

# Less effective
/news "AI"
```

### 2. Provide Feedback Immediately
```bash
# After publishing
/news-feedback "Perfect style! Keep articles at this technical level"
```

Agent learns faster with prompt feedback.

### 3. Use Quick Mode for Speed
```bash
/news-quick "topic"
```

Perfect for updating regularly (2-3 min per article).

### 4. Batch Similar Topics
```bash
/news-batch ["AI agents", "Agent reasoning", "Multi-agent systems"]
```

Agent finds complementary articles, fewer duplicates.

### 5. Mix Lengths
```bash
/news-quick "breaking news"      # 2 min, brief
/news "deep topic"               # 10 min, thorough
/news-roundup                    # 5 min, compilation
```

### 6. Review Analytics
```bash
/news-analytics
```

See which topics your audience engages with most.

### 7. Schedule Regular Updates
```bash
# Weekly topics
Monday: /news-ai
Wednesday: /news-platform
Friday: /news-roundup
```

Establish routine for consistent publishing.

---

## Troubleshooting

### Articles Taking Too Long?
```bash
# Use quick mode instead
/news-quick "topic"
```

### Articles Not Relevant Enough?
```bash
# Be more specific
/news "AI agents with multi-step reasoning and memory"
# Instead of
/news "AI"
```

### Writing Style Off?
```bash
# Provide immediate feedback
/news-feedback "Less technical, more practical examples"
```

### Want Different Topics?
```bash
# Switch to specific topic shortcut
/news-ai              # AI topics
/news-platform        # Platform topics
/news-business        # Business topics
```

### Need Help?
```bash
/news-help            # Quick reference
/news-examples        # See examples
/news-docs            # Full documentation
```

---

## Command Reference Table

| Command | Purpose | Time | Example |
|---------|---------|------|---------|
| `/news` | Start curation | 7-10 min | `/news "AI agents"` |
| `/news-quick` | Fast curation | 2-3 min | `/news-quick "breaking news"` |
| `/news-deep` | Deep curation | 15 min | `/news-deep "complex topic"` |
| `/news-batch` | Multiple topics | 20-30 min | `/news-batch ["AI", "Web"]` |
| `/news-roundup` | Weekly summary | 5 min | `/news-roundup` |
| `/news-check` | Recent articles | < 1 min | `/news-check` |
| `/news-list` | All articles | < 1 min | `/news-list` |
| `/news-search` | Find articles | < 1 min | `/news-search "agent"` |
| `/news-analytics` | Performance | < 1 min | `/news-analytics` |
| `/news-feedback` | Give feedback | < 1 min | `/news-feedback "msg"` |
| `/news-rate` | Rate article | < 1 min | `/news-rate "slug" 5` |
| `/news-settings` | Configure | 5 min | `/news-settings` |
| `/news-ai` | AI topics | 7-10 min | `/news-ai` |
| `/news-platform` | Platform topics | 7-10 min | `/news-platform` |
| `/news-help` | Get help | < 1 min | `/news-help` |

---

## Getting Started

### Day 1: Understand
```bash
/news-help           # Read quick start
/news-docs           # Read full docs
/news-examples       # See examples
```

### Day 1: Try It
```bash
/news "topic you care about"
```

### Day 1: Give Feedback
```bash
/news-feedback "how was the article?"
```

### Day 2+: Establish Routine
```bash
/news-quick "daily topic"        # 2-3 min
/news "weekly deep dive"         # 10 min
/news-roundup                    # Weekly summary
```

---

**Pro Mode Unlocked:** You've learned the news system!

👉 **Next:** `/news "your first topic"` → Get your first article published in 7-10 minutes.

Questions? → `/news-help`
