# @oneie/mcp

MCP server for the ONE substrate — 12 substrate verbs + 3 discovery tools.

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

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `ONEIE_API_URL` | `https://api.one.ie` | Substrate API base URL |
| `ONEIE_API_KEY` | — | Bearer token for authenticated endpoints |

## Programmatic Use

```typescript
import { createOneRouter, serve } from "@oneie/mcp";

const router = createOneRouter();
await serve(router, { name: "oneie", version: "0.1.0" });
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
