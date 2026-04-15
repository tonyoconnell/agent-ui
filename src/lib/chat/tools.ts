export function getToolDescription(toolName: string, args?: Record<string, unknown>): string {
  const toolDescriptions: Record<string, (args?: Record<string, unknown>) => string> = {
    Glob: (a) => (a?.pattern ? `Searching for files matching "${a.pattern}"` : 'Searching for files'),
    Grep: (a) => (a?.pattern ? `Searching code for "${a.pattern}"` : 'Searching code'),
    Read: (a) => (a?.file_path ? `Reading file ${String(a.file_path).split('/').pop()}` : 'Reading file'),
    Write: (a) => (a?.file_path ? `Writing to ${String(a.file_path).split('/').pop()}` : 'Writing file'),
    Edit: (a) => (a?.file_path ? `Editing ${String(a.file_path).split('/').pop()}` : 'Editing file'),
    Bash: (a) =>
      a?.command
        ? `Running command: ${String(a.command).substring(0, 50)}${String(a.command).length > 50 ? '...' : ''}`
        : 'Running command',
    Task: (a) => (a?.description ? String(a.description) : 'Starting task'),
    WebFetch: (a) => {
      try {
        return a?.url ? `Fetching ${new URL(String(a.url)).hostname}` : 'Fetching web content'
      } catch {
        return 'Fetching web content'
      }
    },
    WebSearch: (a) => (a?.query ? `Searching for "${a.query}"` : 'Searching the web'),
    TodoWrite: () => 'Updating task list',
    AskUserQuestion: () => 'Asking for clarification',
  }

  const descFn = toolDescriptions[toolName]
  return descFn ? descFn(args) : `Using ${toolName}`
}

export function formatToolResult(toolName: string, result: unknown): string {
  if (!result) return 'Completed'

  if (typeof result === 'string') {
    if (toolName === 'Read' || toolName === 'Grep' || toolName === 'Glob') {
      const lines = result.split('\n')
      return lines.length > 1 ? `Found ${lines.length} results` : result.substring(0, 100)
    }
    return result.substring(0, 100)
  }

  if (typeof result === 'object' && result !== null) {
    const r = result as Record<string, unknown>
    if (Array.isArray(r.files)) return `Found ${r.files.length} ${r.files.length === 1 ? 'file' : 'files'}`
    if (r.matches !== undefined) return `Found ${r.matches} ${r.matches === 1 ? 'match' : 'matches'}`
    return JSON.stringify(result).substring(0, 100)
  }

  return String(result).substring(0, 100)
}
