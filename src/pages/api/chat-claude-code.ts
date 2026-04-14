import { streamText } from 'ai'
// SSR required - API endpoint
export const prerender = false

import { type ClaudeCodeSettings, claudeCode } from 'ai-sdk-provider-claude-code'
import type { APIRoute } from 'astro'

/**
 * Claude Code Chat API Endpoint
 *
 * Integrates Claude Code provider with built-in tools (Read, Write, Edit, Bash, etc.)
 * Uses your Claude Pro/Max subscription via Claude Code CLI
 *
 * Features:
 * - Access to Claude 4 Opus and Sonnet models
 * - Built-in file operations (Read, Write, Edit, Grep, Glob)
 * - Bash command execution
 * - Web fetching capabilities
 * - Extended thinking support (10min timeout)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const {
      messages,
      model = 'sonnet',
      allowedTools,
      disallowedTools,
    } = (await request.json()) as {
      messages?: Array<{ role: string; content: string }>
      model?: string
      allowedTools?: string[]
      disallowedTools?: string[]
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Configure Claude Code provider with FULL PERMISSIONS by default
    // Allows: Read, Write, Edit, Bash, Grep, Glob, WebFetch, LS
    const providerConfig: ClaudeCodeSettings = {
      // Enable all tools by default - full write permissions!
      allowedTools: [
        'Read', // Read files
        'Write', // Create/overwrite files
        'Edit', // Edit existing files
        'Bash', // Execute commands
        'Grep', // Search in files
        'Glob', // Find files by pattern
        'WebFetch', // Fetch web content
        'LS', // List directory contents
      ],
    }

    // Allow user to override with custom restrictions if needed
    if (allowedTools && allowedTools.length > 0) {
      providerConfig.allowedTools = allowedTools
    }
    if (disallowedTools && disallowedTools.length > 0) {
      providerConfig.disallowedTools = disallowedTools
    }

    // Get the appropriate Claude Code model
    let selectedModel: ReturnType<typeof claudeCode>
    if (Object.keys(providerConfig).length > 0) {
      const { createClaudeCode } = await import('ai-sdk-provider-claude-code')
      const customProvider = createClaudeCode({ defaultSettings: providerConfig })
      selectedModel = customProvider(model)
    } else {
      selectedModel = claudeCode(model)
    }

    // Create abort controller with 30 second timeout for initial connection
    const controller = new AbortController()
    const connectionTimeout = setTimeout(() => {
      console.error('[Claude Code] Connection timeout - aborting after 30s')
      controller.abort()
    }, 30 * 1000)

    try {
      // Stream the response with AI SDK
      const result = await streamText({
        model: selectedModel,
        messages: messages as any,
        abortSignal: controller.signal,
      })

      // Clear connection timeout once stream starts
      clearTimeout(connectionTimeout)

      // Set longer timeout for actual response streaming (10 minutes)
      const streamTimeout = setTimeout(
        () => {
          console.error('[Claude Code] Stream timeout - aborting after 10 minutes')
          controller.abort()
        },
        10 * 60 * 1000,
      )

      // Convert AI SDK stream to OpenRouter-compatible format WITH tool call data
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Use fullStream to get all parts including tool calls and thinking
            for await (const part of result.fullStream) {
              // Log EVERY part we receive
              console.log('[API] Received part:', part.type, part)

              // Handle reasoning/thinking parts
              if (part.type === 'reasoning-delta') {
                const data = JSON.stringify({
                  choices: [
                    {
                      delta: { reasoning: part.text },
                    },
                  ],
                })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
              // Handle tool call parts
              else if (part.type === 'tool-call') {
                console.log('[API] Tool call received:', part.toolName, part.input)
                const toolData = JSON.stringify({
                  type: 'tool_call',
                  payload: {
                    name: part.toolName,
                    args: part.input, // AI SDK v4 uses 'input' not 'args'
                    state: 'input-available',
                  },
                })
                controller.enqueue(encoder.encode(`data: ${toolData}\n\n`))
              }
              // Handle tool result parts
              else if (part.type === 'tool-result') {
                console.log('[API] Tool result received:', part.toolName)
                const toolResultData = JSON.stringify({
                  type: 'tool_result',
                  payload: {
                    name: part.toolName,
                    result: part.output, // AI SDK v4 uses 'output' not 'result'
                    state: 'output-available',
                  },
                })
                controller.enqueue(encoder.encode(`data: ${toolResultData}\n\n`))
              }
              // Handle text delta parts
              else if (part.type === 'text-delta') {
                const data = JSON.stringify({
                  choices: [
                    {
                      delta: { content: part.text }, // AI SDK v4 uses 'text' not 'textDelta'
                    },
                  ],
                })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
              // Catch all unhandled part types
              else {
                console.warn('[API] Unhandled part type:', part.type, part)
              }
            }

            // Send completion signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
            clearTimeout(streamTimeout)
          } catch (error) {
            console.error('[Claude Code] Streaming error:', error)
            clearTimeout(streamTimeout)
            controller.error(error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    } catch (streamError) {
      clearTimeout(connectionTimeout)
      console.error('[Claude Code] Stream creation error:', streamError)
      throw streamError
    }
  } catch (error) {
    console.error('[Claude Code] Chat error:', error)

    // Provide helpful error messages for common issues
    let errorMessage = 'Failed to connect to Claude Code'

    if (error instanceof Error) {
      if (error.message.includes('auth') || error.message.includes('login')) {
        errorMessage = 'Claude Code authentication required. Please run: claude login'
      } else if (error.message.includes('timeout') || error.message.includes('abort')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.'
      } else {
        errorMessage = error.message
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
