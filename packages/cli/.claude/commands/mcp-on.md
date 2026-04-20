---
allowed-tools: Bash(.claude/hooks/mcp-on.sh:*)
description: Toggle MCP servers on/off to manage context tokens
---

# /mcp-on - MCP Server Management

**Purpose:** Enable/disable MCP (Model Context Protocol) servers to control context token usage.

## Quick Commands

```bash
# Check MCP status
./.claude/hooks/mcp-on.sh status

# Turn MCPs ON (all servers enabled)
./.claude/hooks/mcp-on.sh on

# Turn MCPs OFF (saves ~10k tokens)
./.claude/hooks/mcp-on.sh off
```

## MCP Servers

**Available:**
- **shadcn** - Component registry (UI component access)
- **cloudflare-builds** - Cloudflare Workers build logs
- **cloudflare-observability** - Analytics & monitoring
- **cloudflare-docs** - Cloudflare API documentation
- **chrome-devtools** - Browser debugging & profiling
- **framelink-figma** - Figma design integration
- **astro-docs** - Astro framework documentation
- **stripe** - Stripe API integration

## Token Impact

**MCPs ON:** ~15k tokens
- Full access to all MCP tools
- For intensive development tasks
- Use when building/designing

**MCPs OFF:** ~10k tokens saved
- No MCP server access
- For general development
- Recommended for daily work

## Why Turn Off MCPs?

MCPs consume significant context tokens (~10k) even when not actively used. By turning them off:

1. **Save tokens:** ~10k context tokens freed per session
2. **Focus tools:** Only core tools available (Bash, Read, Edit, Grep, Glob)
3. **Faster inference:** Smaller context = faster response time
4. **Recommended default:** Turn off unless actively building features

## Usage Examples

### Daily Development (Recommended)

```bash
# Start of day: Turn MCPs off
./.claude/hooks/mcp-on.sh off

# Work on features using core tools only
# ... code ... commit ... push ...

# End of day: Optional - keep off
```

### Building Features (Agent-Frontend)

```bash
# Building UI components? Turn on for shadcn + chrome-devtools
./.claude/hooks/mcp-on.sh on

# Build components with full MCP access
# ... design ... test ... optimize ...

# When done: Turn off
./.claude/hooks/mcp-on.sh off
```

### Deploying to Cloudflare (Agent-Ops)

```bash
# Deploying? Turn on for cloudflare MCP access
./.claude/hooks/mcp-on.sh on

# Deploy with full Cloudflare tool access
/deploy

# When done: Turn off
./.claude/hooks/mcp-on.sh off
```

### Designing (Agent-Designer)

```bash
# Designing? Turn on for figma + chrome-devtools
./.claude/hooks/mcp-on.sh on

# Design with Figma integration and performance profiling
# ... design ... iterate ... measure ...

# When done: Turn off
./.claude/hooks/mcp-on.sh off
```

## Configuration Files

**Active configuration:** `.mcp.json`
- Enables all MCP servers
- `"disabled": false` for each server

**Disabled backup:** `.mcp.json.off`
- All servers marked disabled
- `"disabled": true` for each server

**Last enabled config:** `.mcp.json.on`
- Backed up when switching states
- Allows quick restoration

## How It Works

### Turn Off MCPs

```bash
./.claude/hooks/mcp-on.sh off
```

1. Backs up current `.mcp.json` to `.mcp.json.on`
2. Removes `.mcp.json` (disables all MCPs)
3. Freed tokens: ~10k (saved per session)

### Turn On MCPs

```bash
./.claude/hooks/mcp-on.sh on
```

1. Copies `.mcp.json.off` to `.mcp.json`
2. Enables all servers (`disabled: false`)
3. Restores functionality: all MCPs available

### Check Status

```bash
./.claude/hooks/mcp-on.sh status
```

Shows:
- Current MCP state (ON or OFF)
- Active/available servers
- Token usage impact

## After Toggling

**IMPORTANT:** Restart Claude Code after toggling MCPs

1. Run command: `./.claude/hooks/mcp-on.sh on` or `off`
2. See message: "Action Required: Restart Claude Code to apply"
3. Close Claude Code completely
4. Reopen Claude Code
5. New session will use new MCP configuration

## Recommendation

**Default: MCPs OFF**

- Turn off at start of day
- Turn on only when needed (building UI, deploying, designing)
- Turn off when done
- Saves tokens and speeds up inference

**When to turn ON:**
- Building UI components (agent-frontend)
- Deploying to Cloudflare (agent-ops)
- Designing with Figma (agent-designer)
- Performance profiling (chrome-devtools)
- Researching documentation

**When to keep OFF:**
- General development
- Writing business logic
- Refactoring code
- Testing
- Documentation

---

**Token-optimized development** 🚀
