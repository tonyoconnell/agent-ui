---
title: Mcp Clear Context Prompt
dimension: things
category: plans
tags: ai
related_dimensions: connections
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/mcp-clear-context-prompt.md
  Purpose: Documents mcp context clearing prompt
  Related dimensions: connections
  For AI agents: Read this to understand mcp clear context prompt.
---

# MCP Context Clearing Prompt

**Purpose:** Run this once to permanently clear MCP documentation from context until needed

---

## The Prompt

```
Claude, from now on and for all future conversations in this project:

AUTOMATICALLY clear all MCP documentation from your active context
unless I'm actually using an MCP tool.

Rules:
1. Default: NO MCP docs loaded (saves ~15,000 tokens)
2. When I use an MCP tool: Load ONLY that MCP's docs
3. After using tool: Clear those docs from context
4. Apply this behavior permanently for this project

Available MCPs (currently using 15.1k tokens):
- shadcn: 7 tools (~4.7k tokens)
- cloudflare-docs: 2 tools (~1.4k tokens)
- cloudflare-builds: 9 tools (~5.7k tokens)
- Framelink_Figma_MCP: 2 tools (~2.0k tokens)
- ide: 2 tools (~1.3k tokens)

Confirm you'll automatically apply this context management going forward
and that MCP docs are now cleared from active context.
```

---

## Expected Result

**Before:**

```
MCP tools: 15.1k tokens (7.5%)
```

**After:**

```
MCP tools: ~0-1k tokens (signatures only)
Savings: ~14k tokens
```

---

## Verification Command

After running the prompt, check context usage:

```
/context
```

Look for "MCP tools" - should be dramatically reduced or minimal.

---

**Run once. Saves 14k tokens forever.**
