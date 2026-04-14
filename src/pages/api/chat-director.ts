/**
// SSR required - API endpoint
export const prerender = false;
 * Agent Director API Endpoint - Multi-Agent Conversation Model
 *
 * Supports group chat conversations where:
 * - Multiple agents can participate simultaneously
 * - Agents listen to all messages and respond when they can add value
 * - Director coordinates which agents should respond to each message
 * - Agents can respond to each other, building on previous responses
 *
 * Uses Claude Code provider directly - Simple & Solid
 */

import { streamText } from 'ai'
import { createClaudeCode } from 'ai-sdk-provider-claude-code'
import type { APIRoute } from 'astro'

// Agent profiles with expertise areas
const AGENT_PROFILES = {
  'agent-frontend': {
    name: 'Frontend Specialist',
    avatar: '🎨',
    expertise: ['UI', 'components', 'pages', 'Astro', 'React', 'styling', 'design'],
  },
  'agent-backend': {
    name: 'Backend Specialist',
    avatar: '⚙️',
    expertise: ['database', 'Convex', 'queries', 'mutations', 'services', 'API'],
  },
  'agent-builder': {
    name: 'Full-Stack Builder',
    avatar: '🔨',
    expertise: ['features', 'integration', 'nanostores', 'state', 'full-stack'],
  },
  'agent-quality': {
    name: 'Quality Assurance',
    avatar: '✅',
    expertise: ['testing', 'validation', 'quality', 'bugs', 'errors'],
  },
  'agent-designer': {
    name: 'Design Specialist',
    avatar: '🎯',
    expertise: ['wireframes', 'mockups', 'design system', 'UX', 'UI design'],
  },
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages } = (await request.json()) as {
      messages?: Array<{ role: string; content: string; metadata?: Record<string, unknown> }>
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create a readable stream for server-sent events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        // Helper to send SSE events
        const sendEvent = (eventType: string, data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: eventType, ...data })}\n\n`))
        }

        try {
          // Send welcome message only on first interaction (when there's only 1 message)
          if (messages.length === 1) {
            sendEvent('message', {
              sender: 'Agent Director',
              content:
                "👋 Welcome! I'm the Agent Director. I'll help coordinate the right specialists to handle your request. Let me analyze what you need...",
              avatar: '🤖',
              timestamp: Date.now(),
            })
          }

          // Build conversation context
          const latestMessage = messages[messages.length - 1]
          const conversationHistory = messages
            .slice(-5)
            .map((m) => `${m.role === 'user' ? 'User' : m.metadata?.sender || 'Assistant'}: ${m.content}`)
            .join('\n')

          // Analyze which agents should respond
          const directorPrompt = `You are the Engineering Director Agent coordinating a multi-agent conversation.

**CONVERSATION CONTEXT:**
${conversationHistory}

**CURRENT MESSAGE:** ${latestMessage.content}
**FROM:** ${latestMessage.role === 'user' ? 'User' : latestMessage.metadata?.sender || 'Assistant'}

**ACTIVE AGENTS IN CONVERSATION:**
${Object.entries(AGENT_PROFILES)
  .map(([id, profile]) => `- ${id}: ${profile.name} ${profile.avatar} (expertise: ${profile.expertise.join(', ')})`)
  .join('\n')}

**YOUR ROLE:**
Analyze the current message and determine which agents should respond. Agents should respond when:
1. Their expertise directly applies to the question/request
2. They can add value beyond what's already been said
3. They can address a specific aspect no one else has covered
4. Multiple agents can work in parallel on independent tasks

**RESPONSE FORMAT:**
First, analyze which agents should respond and why.
Then, for each agent that should respond, explain what they should focus on.

**CRITICAL INSTRUCTIONS:**
- Consider the FULL conversation context, not just the latest message
- Multiple agents can respond if they address different aspects
- Agents should NOT repeat what others have already said
- Always check for existing templates before building from scratch
- Frontend-only by default (99% of requests)
- Only involve backend if explicitly needed

Think step-by-step about who can add value here.`

          // Create Claude Code provider with all tools enabled
          const provider = createClaudeCode({
            defaultSettings: { allowedTools: ['*'] },
          })
          const model = provider('sonnet') // Use 'sonnet' or 'opus'

          // Stream the director's response with tool monitoring
          const result = await streamText({
            model,
            messages: [{ role: 'user', content: directorPrompt }],
            onChunk({ chunk }) {
              // Monitor for tool calls
              if (chunk.type === 'tool-call') {
                sendEvent('message', {
                  sender: 'Agent Director',
                  content: `🔧 Using ${chunk.toolName}`,
                  avatar: '🔧',
                  timestamp: Date.now(),
                  metadata: {
                    toolName: chunk.toolName,
                    args: (chunk as any).input,
                  },
                })
              }
              // Monitor for tool results
              else if (chunk.type === 'tool-result') {
                sendEvent('message', {
                  sender: 'System',
                  content: `✅ ${chunk.toolName} completed`,
                  avatar: '✅',
                  timestamp: Date.now(),
                  metadata: {
                    toolName: chunk.toolName,
                    result: (chunk as any).output,
                  },
                })
              }
            },
          })

          const detectedAgents = new Set<string>()
          let currentText = ''

          // Stream the text
          for await (const textPart of result.textStream) {
            currentText += textPart

            // Send text as streaming message from director
            sendEvent('message', {
              sender: 'Agent Director',
              content: textPart,
              avatar: '🤖',
              timestamp: Date.now(),
              isStreaming: true,
            })

            // Continuously parse for agent mentions
            const agentMatches = currentText.match(/agent-(frontend|backend|builder|quality|designer)/g)
            if (agentMatches && agentMatches.length > 0) {
              const currentAgents = new Set(agentMatches)

              // Find newly mentioned agents
              const newAgents = [...currentAgents].filter((agent) => !detectedAgents.has(agent))

              if (newAgents.length > 0) {
                // Update detected agents
                newAgents.forEach((agent) => detectedAgents.add(agent))

                // Send agent presence update
                sendEvent('agent-presence', {
                  agents: newAgents,
                  action: 'listening',
                  timestamp: Date.now(),
                })

                // Send individual join messages
                for (const agent of newAgents) {
                  const profile = AGENT_PROFILES[agent as keyof typeof AGENT_PROFILES]
                  sendEvent('message', {
                    sender: 'System',
                    content: `${profile.avatar} ${profile.name} is now listening and will respond if they can add value`,
                    avatar: '👂',
                    timestamp: Date.now(),
                  })
                }
              }
            }
          }

          // After director analysis, notify about active agents
          if (detectedAgents.size > 0) {
            sendEvent('message', {
              sender: 'Agent Director',
              content: `${detectedAgents.size} agent${detectedAgents.size > 1 ? 's are' : ' is'} ready to respond: ${[...detectedAgents].map((id) => AGENT_PROFILES[id as keyof typeof AGENT_PROFILES].name).join(', ')}`,
              avatar: '🤖',
              timestamp: Date.now(),
              metadata: {
                agents: [...detectedAgents],
              },
            })

            // 🎯 INVOKE EACH AGENT TO RESPOND
            for (const agentId of detectedAgents) {
              const profile = AGENT_PROFILES[agentId as keyof typeof AGENT_PROFILES]

              // Announce agent is starting to work
              sendEvent('message', {
                sender: profile.name,
                content: `I'll help with ${profile.expertise[0]} aspects of this. Let me take a look...`,
                avatar: profile.avatar,
                timestamp: Date.now(),
              })

              // Build agent-specific prompt
              const agentPrompt = `You are the ${profile.name} agent in a multi-agent conversation.

**YOUR EXPERTISE:** ${profile.expertise.join(', ')}

**CONVERSATION CONTEXT:**
${conversationHistory}

**CURRENT REQUEST:** ${latestMessage.content}

**DIRECTOR'S ANALYSIS:**
${currentText}

**YOUR TASK:**
Based on the director's analysis and your expertise, respond with specific, actionable help.
- Use your tools (Read, Write, Edit, Grep, Glob, Bash) to investigate and make changes
- Focus ONLY on your area of expertise
- Don't repeat what the director or other agents have said
- Be concise and action-oriented
- Show your work (tool calls are visible to the user)

Respond now with your contribution:`

              try {
                // Create provider for this agent
                const agentProvider = createClaudeCode({
                  defaultSettings: { allowedTools: ['*'] },
                })
                const agentModel = agentProvider('sonnet')

                // Stream agent's response
                const agentResult = await streamText({
                  model: agentModel,
                  messages: [{ role: 'user', content: agentPrompt }],
                  onChunk({ chunk }) {
                    // Monitor agent tool calls
                    if (chunk.type === 'tool-call') {
                      sendEvent('message', {
                        sender: profile.name,
                        content: `🔧 Using ${chunk.toolName}`,
                        avatar: '🔧',
                        timestamp: Date.now(),
                        metadata: {
                          toolName: chunk.toolName,
                          args: (chunk as any).input,
                          agent: agentId,
                        },
                      })
                    }
                    // Monitor agent tool results
                    else if (chunk.type === 'tool-result') {
                      sendEvent('message', {
                        sender: 'System',
                        content: `✅ ${chunk.toolName} completed for ${profile.name}`,
                        avatar: '✅',
                        timestamp: Date.now(),
                        metadata: {
                          toolName: chunk.toolName,
                          result: (chunk as any).output,
                          agent: agentId,
                        },
                      })
                    }
                  },
                })

                // Stream agent's text response
                for await (const textPart of agentResult.textStream) {
                  sendEvent('message', {
                    sender: profile.name,
                    content: textPart,
                    avatar: profile.avatar,
                    timestamp: Date.now(),
                    isStreaming: true,
                    metadata: {
                      agent: agentId,
                    },
                  })
                }

                // Agent completed
                sendEvent('message', {
                  sender: 'System',
                  content: `${profile.avatar} ${profile.name} completed their work`,
                  avatar: '✅',
                  timestamp: Date.now(),
                })
              } catch (agentError) {
                console.error(`Agent ${agentId} error:`, agentError)
                sendEvent('message', {
                  sender: 'System',
                  content: `⚠️ ${profile.name} encountered an error: ${agentError instanceof Error ? agentError.message : 'Unknown error'}`,
                  avatar: '⚠️',
                  timestamp: Date.now(),
                })
              }
            }
          }

          sendEvent('done', { timestamp: Date.now() })
          controller.close()
        } catch (error) {
          console.error('Director stream error:', error)
          sendEvent('error', {
            message: error instanceof Error ? error.message : 'Unknown error',
          })
          controller.close()
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
  } catch (error) {
    console.error('Chat director error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
