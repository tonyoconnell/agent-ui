# @oneie/mcp

MCP server for the ONE substrate — 12 substrate + 5 lifecycle + 3 discovery tools = 20 tools.

Connects Claude Code, Cursor, Windsurf, and any MCP client to a live ONE instance via stdio.

## Install

```bash
npm install -g @oneie/mcp
# or run without installing:
npx @oneie/mcp
```

## Configure in Claude Code

Add to your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "oneie": {
      "command": "npx",
      "args": ["@oneie/mcp"],
      "env": {
        "ONEIE_API_URL": "http://localhost:4321",
        "ONEIE_API_KEY": "your-key-optional"
      }
    }
  }
}
```

Or point at production:

```json
{
  "mcpServers": {
    "oneie": {
      "command": "npx",
      "args": ["@oneie/mcp"],
      "env": {
        "ONEIE_API_URL": "https://api.one.ie"
      }
    }
  }
}
```

## Tools

### Substrate Verbs

| Tool | Loop | What |
|------|------|------|
| `signal` | L1 | Emit a signal to a unit |
| `ask` | L1 | Signal + wait for outcome (result \| timeout \| dissolved) |
| `mark` | L2 | Strengthen a path edge |
| `warn` | L2 | Raise resistance on a path edge |
| `fade` | L3 | Asymmetric decay of all paths |
| `select` | L1 | Probabilistic next unit (pheromone-weighted) |
| `recall` | L6 | Query hypotheses from the brain |
| `reveal` | L6 | Full memory card for a uid |
| `forget` | — | GDPR erasure of all records for a uid |
| `frontier` | L7 | Unexplored tag clusters for a uid |
| `know` | L6 | Promote highways → permanent hypotheses |
| `highways` | L2/L6 | Top weighted paths (proven routes) |

### Discovery

| Tool | What |
|------|------|
| `scaffold_agent` | Create an agent from a preset template |
| `list_agents` | List all available agent presets |
| `get_agent` | Get a preset by name |

### Lifecycle

| Tool | Loop | What |
|------|------|------|
| `auth_agent` | L1 | Register or re-authenticate an agent; returns uid, wallet, and one-time API key |
| `sync_agent` | L1 | Sync an agent markdown spec to TypeDB (unit + skills + capabilities) |
| `discover_skill` | L2 | Find agents offering a named skill, ranked by pheromone strength |
| `register` | L1 | Register a unit with capabilities; optionally link a Sui wallet |
| `pay` | L4 | Record a payment between units; deposits pheromone proportional to amount |

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `ONEIE_API_URL` | `https://api.one.ie` | Substrate API base URL |
| `ONEIE_API_KEY` | — | Bearer token for authenticated endpoints |

## Programmatic Use

```typescript
import { createOneRouter, serve } from "@oneie/mcp";

const router = createOneRouter();
await serve(router, { name: "oneie", version: "0.2.0" });
```

Add custom tools:

```typescript
import { createRouter, serve, substrateTools } from "@oneie/mcp";

const router = createRouter();
for (const tool of substrateTools()) router.register(tool);
router.register({
  name: "my_tool",
  description: "Custom tool",
  inputSchema: { type: "object", properties: { msg: { type: "string" } }, required: ["msg"] },
  handler: async (args) => ({ echo: args.msg }),
});
await serve(router);
```

## License

[one.ie/free-license](https://one.ie/free-license)

## Telemetry

`@oneie/mcp` sends anonymous usage signals to the ONE substrate to improve routing quality.

**What we send:** package version, method name, outcome type, anonymous session ID (hex hash — no PII), call latency.

**What we never send:** your API key, user IDs, email addresses, file paths, or any personally identifiable information.

**Opt out:**
```bash
# Environment variable (per-session)
ONEIE_TELEMETRY_DISABLE=1 node your-script.js

# Permanent opt-out
echo '{"telemetry":false}' > ~/.oneie/config.json
```

When opt-out is active, `oneie --version` prints `telemetry: disabled`.
