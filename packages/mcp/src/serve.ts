import { readEnv } from "./env.js";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, env: ReturnType<typeof readEnv>) => Promise<unknown>;
}

export interface McpRouter {
  tools: Map<string, McpTool>;
  register(tool: McpTool): void;
  call(name: string, args: Record<string, unknown>): Promise<unknown>;
}

export function createRouter(): McpRouter {
  const tools = new Map<string, McpTool>();
  const env = readEnv();
  return {
    tools,
    register(tool) {
      tools.set(tool.name, tool);
    },
    async call(name, args) {
      const tool = tools.get(name);
      if (!tool) throw new Error(`unknown tool: ${name}`);
      return tool.handler(args ?? {}, env);
    },
  };
}
