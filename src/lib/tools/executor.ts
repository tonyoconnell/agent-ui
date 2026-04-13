import { z } from 'zod'
import { type Tool, toolRegistry } from './registry'

/**
 * Tool Executor - Execute tools with error handling, approval gates, and tracking
 *
 * Ontology mapping:
 * - Tool execution = Event (type: 'tool_executed')
 * - Tool result = Thing (type: 'tool_result')
 * - Execution context = Connection (type: 'executed_by')
 */

// ============================================================================
// Types
// ============================================================================

export type ToolExecutionState =
  | 'pending'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'cached'

export interface ToolExecutionResult<T = any> {
  success: boolean
  state: ToolExecutionState
  result?: T
  error?: string
  errorCode?: string
  executionTime?: number
  fromCache?: boolean
  toolName: string
  timestamp: number
}

export interface ToolExecutionContext {
  userId?: string
  sessionId?: string
  groupId?: string
  requiresApproval?: boolean
  timeout?: number // milliseconds
  enableCache?: boolean
  retryCount?: number
  metadata?: Record<string, any>
}

interface CachedResult {
  result: any
  timestamp: number
  expiresAt: number
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_TIMEOUT = 30000 // 30 seconds
const DEFAULT_RETRY_COUNT = 2
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100

// Tools that require user approval before execution
const SENSITIVE_TOOLS = new Set(['delete_data', 'modify_database', 'send_email', 'external_api_write'])

// ============================================================================
// Cache Management
// ============================================================================

class ToolResultCache {
  private cache = new Map<string, CachedResult>()

  getCacheKey(toolName: string, params: any): string {
    return `${toolName}:${JSON.stringify(params)}`
  }

  get(toolName: string, params: any): any | null {
    const key = this.getCacheKey(toolName, params)
    const cached = this.cache.get(key)

    if (!cached) return null

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cached.result
  }

  set(toolName: string, params: any, result: any, ttl: number = CACHE_TTL): void {
    // Enforce max cache size
    if (this.cache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    const key = this.getCacheKey(toolName, params)
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    })
  }

  clear(): void {
    this.cache.clear()
  }

  clearTool(toolName: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${toolName}:`)) {
        this.cache.delete(key)
      }
    }
  }
}

const resultCache = new ToolResultCache()

// ============================================================================
// Approval Gate
// ============================================================================

interface ApprovalRequest {
  toolName: string
  params: any
  context: ToolExecutionContext
  requestedAt: number
}

class ApprovalGate {
  private pendingApprovals = new Map<string, ApprovalRequest>()
  private approvalCallbacks = new Map<
    string,
    {
      resolve: (approved: boolean) => void
      reject: (error: Error) => void
    }
  >()

  requiresApproval(toolName: string, context?: ToolExecutionContext): boolean {
    // Check if explicitly set in context
    if (context?.requiresApproval !== undefined) {
      return context.requiresApproval
    }

    // Check if tool is in sensitive list
    return SENSITIVE_TOOLS.has(toolName)
  }

  async requestApproval(toolName: string, params: any, context: ToolExecutionContext): Promise<boolean> {
    const requestId = `${toolName}_${Date.now()}`

    const request: ApprovalRequest = {
      toolName,
      params,
      context,
      requestedAt: Date.now(),
    }

    this.pendingApprovals.set(requestId, request)

    // Create promise that resolves when user approves/rejects
    const approvalPromise = new Promise<boolean>((resolve, reject) => {
      this.approvalCallbacks.set(requestId, { resolve, reject })

      // Auto-reject after 60 seconds
      setTimeout(() => {
        if (this.pendingApprovals.has(requestId)) {
          this.rejectApproval(requestId, 'Approval timeout')
        }
      }, 60000)
    })

    // Emit event for UI to show approval dialog
    this.emitApprovalRequest(requestId, request)

    return approvalPromise
  }

  approveRequest(requestId: string): void {
    const callback = this.approvalCallbacks.get(requestId)
    if (callback) {
      callback.resolve(true)
      this.cleanup(requestId)
    }
  }

  rejectApproval(requestId: string, reason?: string): void {
    const callback = this.approvalCallbacks.get(requestId)
    if (callback) {
      callback.reject(new Error(reason || 'User rejected approval'))
      this.cleanup(requestId)
    }
  }

  getPendingApprovals(): Map<string, ApprovalRequest> {
    return new Map(this.pendingApprovals)
  }

  private cleanup(requestId: string): void {
    this.pendingApprovals.delete(requestId)
    this.approvalCallbacks.delete(requestId)
  }

  private emitApprovalRequest(requestId: string, request: ApprovalRequest): void {
    // Emit custom event for UI components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tool-approval-request', {
          detail: { requestId, request },
        }),
      )
    }
  }
}

const approvalGate = new ApprovalGate()

// Export for UI components
export { approvalGate }

// ============================================================================
// Execution Tracking
// ============================================================================

interface ExecutionLog {
  toolName: string
  state: ToolExecutionState
  startTime: number
  endTime?: number
  executionTime?: number
  error?: string
  context?: ToolExecutionContext
}

const executionLogs: ExecutionLog[] = []
const MAX_LOGS = 1000

function logExecution(log: ExecutionLog): void {
  executionLogs.push(log)

  // Keep only last MAX_LOGS entries
  if (executionLogs.length > MAX_LOGS) {
    executionLogs.shift()
  }

  // Emit event for analytics/monitoring
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tool-execution', {
        detail: log,
      }),
    )
  }
}

export function getExecutionLogs(toolName?: string): ExecutionLog[] {
  if (toolName) {
    return executionLogs.filter((log) => log.toolName === toolName)
  }
  return [...executionLogs]
}

export function clearExecutionLogs(): void {
  executionLogs.length = 0
}

// ============================================================================
// Core Executor
// ============================================================================

/**
 * Execute a tool with full error handling, approval gates, and tracking
 */
export async function executeTool<T = any>(
  toolName: string,
  params: any,
  context: ToolExecutionContext = {},
): Promise<ToolExecutionResult<T>> {
  const startTime = Date.now()
  const tool = toolRegistry.get(toolName)

  // Track execution start
  const executionLog: ExecutionLog = {
    toolName,
    state: 'pending',
    startTime,
    context,
  }

  // Tool not found
  if (!tool) {
    const error = `Tool '${toolName}' not found`
    executionLog.state = 'failed'
    executionLog.endTime = Date.now()
    executionLog.executionTime = executionLog.endTime - startTime
    executionLog.error = error
    logExecution(executionLog)

    return {
      success: false,
      state: 'failed',
      error,
      errorCode: 'TOOL_NOT_FOUND',
      toolName,
      timestamp: Date.now(),
    }
  }

  try {
    // Check cache first (if enabled)
    if (context.enableCache !== false) {
      const cached = resultCache.get(toolName, params)
      if (cached !== null) {
        executionLog.state = 'cached'
        executionLog.endTime = Date.now()
        executionLog.executionTime = executionLog.endTime - startTime
        logExecution(executionLog)

        return {
          success: true,
          state: 'cached',
          result: cached,
          fromCache: true,
          executionTime: executionLog.executionTime,
          toolName,
          timestamp: Date.now(),
        }
      }
    }

    // Check if approval required
    if (approvalGate.requiresApproval(toolName, context)) {
      executionLog.state = 'awaiting_approval'
      logExecution({ ...executionLog })

      const approved = await approvalGate.requestApproval(toolName, params, context)

      if (!approved) {
        executionLog.state = 'rejected'
        executionLog.endTime = Date.now()
        executionLog.executionTime = executionLog.endTime - startTime
        executionLog.error = 'User rejected execution'
        logExecution(executionLog)

        return {
          success: false,
          state: 'rejected',
          error: 'User rejected tool execution',
          errorCode: 'APPROVAL_REJECTED',
          toolName,
          timestamp: Date.now(),
        }
      }

      executionLog.state = 'approved'
      logExecution({ ...executionLog })
    }

    // Execute with retry logic
    const retryCount = context.retryCount ?? DEFAULT_RETRY_COUNT
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        executionLog.state = 'executing'
        logExecution({ ...executionLog })

        const result = await executeWithTimeout(tool, params, context.timeout ?? DEFAULT_TIMEOUT)

        const executionTime = Date.now() - startTime

        // Cache successful result
        if (context.enableCache !== false) {
          resultCache.set(toolName, params, result)
        }

        executionLog.state = 'completed'
        executionLog.endTime = Date.now()
        executionLog.executionTime = executionTime
        logExecution(executionLog)

        return {
          success: true,
          state: 'completed',
          result,
          executionTime,
          toolName,
          timestamp: Date.now(),
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry on validation errors
        if (error instanceof z.ZodError) {
          break
        }

        // Wait before retry (exponential backoff)
        if (attempt < retryCount) {
          await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000))
        }
      }
    }

    // All retries failed
    const executionTime = Date.now() - startTime
    const errorMessage = lastError?.message || 'Tool execution failed'

    executionLog.state = 'failed'
    executionLog.endTime = Date.now()
    executionLog.executionTime = executionTime
    executionLog.error = errorMessage
    logExecution(executionLog)

    return {
      success: false,
      state: 'failed',
      error: errorMessage,
      errorCode: getErrorCode(lastError),
      executionTime,
      toolName,
      timestamp: Date.now(),
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    executionLog.state = 'failed'
    executionLog.endTime = Date.now()
    executionLog.executionTime = executionTime
    executionLog.error = errorMessage
    logExecution(executionLog)

    return {
      success: false,
      state: 'failed',
      error: errorMessage,
      errorCode: getErrorCode(error),
      executionTime,
      toolName,
      timestamp: Date.now(),
    }
  }
}

/**
 * Execute tool with timeout
 */
async function executeWithTimeout(tool: Tool, params: any, timeout: number): Promise<any> {
  return Promise.race([
    // Execute tool
    (async () => {
      // Validate params
      const validated = tool.parameters.parse(params)

      // Execute
      return await tool.execute(validated)
    })(),

    // Timeout promise
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Tool execution timeout after ${timeout}ms`))
      }, timeout)
    }),
  ])
}

/**
 * Get error code from error
 */
function getErrorCode(error: any): string {
  if (error instanceof z.ZodError) {
    return 'VALIDATION_ERROR'
  }

  if (error?.message?.includes('timeout')) {
    return 'TIMEOUT'
  }

  if (error?.message?.includes('network')) {
    return 'NETWORK_ERROR'
  }

  if (error?.message?.includes('API')) {
    return 'API_ERROR'
  }

  return 'UNKNOWN_ERROR'
}

// ============================================================================
// Batch Execution
// ============================================================================

/**
 * Execute multiple tools in parallel
 */
export async function executeToolsBatch(
  executions: Array<{
    toolName: string
    params: any
    context?: ToolExecutionContext
  }>,
): Promise<ToolExecutionResult[]> {
  return Promise.all(executions.map(({ toolName, params, context }) => executeTool(toolName, params, context)))
}

/**
 * Execute tools in sequence
 */
export async function executeToolsSequence(
  executions: Array<{
    toolName: string
    params: any
    context?: ToolExecutionContext
  }>,
): Promise<ToolExecutionResult[]> {
  const results: ToolExecutionResult[] = []

  for (const { toolName, params, context } of executions) {
    const result = await executeTool(toolName, params, context)
    results.push(result)

    // Stop on first failure
    if (!result.success) {
      break
    }
  }

  return results
}

// ============================================================================
// Cache Management Exports
// ============================================================================

export function clearToolCache(toolName?: string): void {
  if (toolName) {
    resultCache.clearTool(toolName)
  } else {
    resultCache.clear()
  }
}

// ============================================================================
// Statistics
// ============================================================================

export interface ToolStatistics {
  totalExecutions: number
  successCount: number
  failureCount: number
  averageExecutionTime: number
  cacheHitRate: number
  errorsByCode: Record<string, number>
}

export function getToolStatistics(toolName?: string): ToolStatistics {
  const logs = toolName ? executionLogs.filter((log) => log.toolName === toolName) : executionLogs

  const totalExecutions = logs.length
  const successCount = logs.filter((log) => log.state === 'completed' || log.state === 'cached').length
  const failureCount = logs.filter((log) => log.state === 'failed' || log.state === 'timeout').length
  const cachedCount = logs.filter((log) => log.state === 'cached').length

  const executionTimes = logs.filter((log) => log.executionTime !== undefined).map((log) => log.executionTime!)

  const averageExecutionTime =
    executionTimes.length > 0 ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length : 0

  const cacheHitRate = totalExecutions > 0 ? cachedCount / totalExecutions : 0

  const errorsByCode: Record<string, number> = {}
  logs
    .filter((log) => log.error)
    .forEach((log) => {
      const code = log.error || 'UNKNOWN'
      errorsByCode[code] = (errorsByCode[code] || 0) + 1
    })

  return {
    totalExecutions,
    successCount,
    failureCount,
    averageExecutionTime: Math.round(averageExecutionTime),
    cacheHitRate: Math.round(cacheHitRate * 100) / 100,
    errorsByCode,
  }
}
