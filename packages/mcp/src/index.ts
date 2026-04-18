#!/usr/bin/env node
import { createRouter, serve } from "./serve.js";
import { substrateTools } from "./tools/substrate.js";
import { discoveryTools } from "./tools/discovery.js";
import { lifecycleTools } from "./tools/lifecycle.js";

export { createRouter, serve } from "./serve.js";
export { readEnv } from "./env.js";
export type { McpTool, McpRouter } from "./serve.js";
export { substrateTools } from "./tools/substrate.js";
export { discoveryTools } from "./tools/discovery.js";
export { lifecycleTools } from "./tools/lifecycle.js";

export const MCP_VERSION = "0.2.0";
export const MCP_TOOLS = {
  substrate: ["signal", "ask", "mark", "warn", "fade", "select", "recall", "reveal", "forget", "frontier", "know", "highways"] as const,
  lifecycle: ["auth_agent", "sync_agent", "discover_skill", "register", "pay"] as const,
  discovery: ["scaffold_agent", "list_agents", "get_agent"] as const,
};

export function createOneRouter() {
  const router = createRouter();
  for (const tool of [...substrateTools(), ...lifecycleTools(), ...discoveryTools()]) {
    router.register(tool);
  }
  return router;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const router = createOneRouter();
  serve(router, { name: "oneie", version: MCP_VERSION }).catch((err) => {
    process.stderr.write(`oneie-mcp: ${err}\n`);
    process.exit(1);
  });
}
