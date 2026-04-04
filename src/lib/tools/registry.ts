import { z } from 'zod';

/**
 * Tool interface - All tools must implement this
 *
 * Ontology mapping:
 * - Tool = Thing (type: 'tool')
 * - Tool execution = Event (type: 'tool_executed')
 * - Tool → Chat = Connection (type: 'uses_tool')
 */
export interface Tool {
  name: string;
  description: string;
  category: 'integration' | 'data' | 'utility';
  parameters: z.ZodObject<any>;
  execute: (params: any) => Promise<any>;

  // Extended metadata for tool system
  requiresApproval?: boolean;
  version?: string;
  author?: string;
  tags?: string[];
  cacheable?: boolean;
  cacheTTL?: number; // milliseconds
  timeout?: number; // milliseconds
  retryable?: boolean;
  maxRetries?: number;
}

/**
 * Tool metadata for AI SDK integration
 */
export interface ToolMetadata {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, any>;
  requiresApproval: boolean;
  tags: string[];
  version: string;
}

/**
 * Tool registry - Stores all available tools
 */
class ToolRegistry {
  private tools = new Map<string, Tool>();

  /**
   * Register a new tool
   */
  register(tool: Tool): void {
    // Validate tool definition
    this.validateTool(tool);

    if (this.tools.has(tool.name)) {
      console.warn(`Tool ${tool.name} is already registered. Overwriting.`);
    }

    this.tools.set(tool.name, tool);

    // Emit registration event
    this.emitToolRegistered(tool);
  }

  /**
   * Register multiple tools at once
   */
  registerMany(tools: Tool[]): void {
    tools.forEach(tool => this.register(tool));
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get a specific tool by name
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: Tool['category']): Tool[] {
    return this.getAll().filter(t => t.category === category);
  }

  /**
   * Get tools by tag
   */
  getByTag(tag: string): Tool[] {
    return this.getAll().filter(t => t.tags?.includes(tag));
  }

  /**
   * Search tools by name or description
   */
  search(query: string): Tool[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(tool =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get tool metadata (for AI SDK)
   */
  getMetadata(name: string): ToolMetadata | undefined {
    const tool = this.get(name);
    if (!tool) return undefined;

    return {
      name: tool.name,
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters.shape,
      requiresApproval: tool.requiresApproval ?? false,
      tags: tool.tags ?? [],
      version: tool.version ?? '1.0.0',
    };
  }

  /**
   * Get all tool metadata
   */
  getAllMetadata(): ToolMetadata[] {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters.shape,
      requiresApproval: tool.requiresApproval ?? false,
      tags: tool.tags ?? [],
      version: tool.version ?? '1.0.0',
    }));
  }

  /**
   * Get tools that require approval
   */
  getSensitiveTools(): Tool[] {
    return this.getAll().filter(t => t.requiresApproval === true);
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      byCategory: {
        integration: this.getByCategory('integration').length,
        data: this.getByCategory('data').length,
        utility: this.getByCategory('utility').length,
      },
      sensitive: this.getSensitiveTools().length,
      cacheable: all.filter(t => t.cacheable !== false).length,
      retryable: all.filter(t => t.retryable !== false).length,
    };
  }

  /**
   * Validate tool definition
   */
  private validateTool(tool: Tool): void {
    if (!tool.name) {
      throw new Error('Tool name is required');
    }

    if (!tool.description) {
      throw new Error('Tool description is required');
    }

    if (!tool.parameters) {
      throw new Error('Tool parameters schema is required');
    }

    if (typeof tool.execute !== 'function') {
      throw new Error('Tool execute function is required');
    }

    // Validate name format (alphanumeric, underscore, hyphen)
    if (!/^[a-z0-9_-]+$/.test(tool.name)) {
      throw new Error(
        `Tool name '${tool.name}' must be lowercase alphanumeric with underscores or hyphens`
      );
    }
  }

  /**
   * Emit tool registered event
   */
  private emitToolRegistered(tool: Tool): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tool-registered', {
        detail: { tool }
      }));
    }
  }
}

export const toolRegistry = new ToolRegistry();

/**
 * Helper to create tool system prompt
 */
export function getToolSystemPrompt(selectedTool?: string): string {
  const tools = toolRegistry.getAll();

  if (tools.length === 0) {
    return '';
  }

  // Separate native tools from MCP tools (MCP tools have : in their name)
  const nativeTools = tools.filter(t => !t.name.includes(':'));
  const mcpTools = tools.filter(t => t.name.includes(':'));

  // Build tool descriptions
  const nativeDescriptions = nativeTools.map(tool => `
**Tool: ${tool.name}**
Description: ${tool.description}
Parameters: ${JSON.stringify(tool.parameters.shape, null, 2)}
  `.trim()).join('\n\n');

  const mcpDescriptions = mcpTools.length > 0 ? mcpTools.map(tool => {
    const [server, name] = tool.name.split(':');
    return `
**Tool: ${tool.name}** (from ${server} MCP server)
Description: ${tool.description}
Parameters: ${JSON.stringify(tool.parameters.shape, null, 2)}
  `.trim();
  }).join('\n\n') : '';

  let basePrompt = `
You have access to the following tools. To use a tool, respond with a code block:

\`\`\`tool-call
{
  "tool": "tool_name",
  "parameters": {
    "param1": "value1"
  }
}
\`\`\`

CRITICAL RULES FOR TOOLS:
1. **AUTO-DETECT URLs**: When a user pastes a Google Sheets URL (contains "docs.google.com/spreadsheets"), IMMEDIATELY call read_google_sheet - do not ask what they want to do
2. **USE REAL DATA**: When you receive data from a tool, ALWAYS use that actual data. NEVER generate fake/sample data
3. **BE PROACTIVE**: Analyze tool results and suggest relevant visualizations automatically
4. **STAY IN CONTEXT**: Keep tool results in the conversation context for follow-up questions
5. **MCP TOOLS**: For MCP tools (server:tool_name format), use the full name including the server prefix

Available tools:

${nativeDescriptions}
${mcpDescriptions ? `\n\n--- MCP Tools (from external servers) ---\n\n${mcpDescriptions}` : ''}
  `.trim();

  // If a specific tool is selected, add instructions to use it
  if (selectedTool && selectedTool !== 'none') {
    const toolName = {
      'google_sheets': 'read_google_sheet',
      'create_chart': 'create_chart',
      'weather': 'get_weather',
      'web_search': 'web_search',
    }[selectedTool];

    if (toolName) {
      basePrompt += `\n\n**CRITICAL INSTRUCTION**: The user has selected the "${selectedTool}" tool. You MUST use the function calling feature to call the ${toolName} function. When the user provides a Google Sheets URL, you should IMMEDIATELY make a function call - do NOT just describe what you would do or ask for permission. The function calling system is available and ready to use.`;
    }
  }

  return basePrompt;
}
