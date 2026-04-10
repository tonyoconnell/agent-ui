/**
 * WORLD CHAT — AI-powered chat for controlling the ONE world
 *
 * Uses AI SDK for streaming responses
 * Parses commands and executes them via colony engine
 * Shows world state changes in real-time
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { useStore } from '@nanostores/react'
import { Send, Mic, Square, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSkin } from '@/contexts/SkinContext'
import { messages$, addMessage, isStreaming$, setStreaming } from '@/stores/chat-store'
import type { World } from '@/engine'

// World command types
type WorldCommand =
  | { type: 'spawn'; id: string; kind: string }
  | { type: 'connect'; from: string; to: string }
  | { type: 'send'; to: string; data?: unknown }
  | { type: 'strengthen'; from: string; to: string }
  | { type: 'query'; query: 'highways' | 'agents' | 'tasks' }
  | { type: 'decay'; rate?: number }
  | { type: 'inject' }

// Parse natural language to commands
function parseCommand(text: string): WorldCommand | null {
  const lower = text.toLowerCase()

  // Spawn: "create/spawn a scout/analyst/trader"
  const spawnMatch = lower.match(/(create|spawn|add)\s+(?:a\s+)?(\w+)(?:\s+agent)?/)
  if (spawnMatch) {
    const kind = spawnMatch[2]
    const id = `${kind}-${Date.now().toString(36)}`
    return { type: 'spawn', id, kind }
  }

  // Connect: "connect scout to analyst"
  const connectMatch = lower.match(/connect\s+(\w+)\s+to\s+(\w+)/)
  if (connectMatch) {
    return { type: 'connect', from: connectMatch[1], to: connectMatch[2] }
  }

  // Send: "send signal to scout"
  const sendMatch = lower.match(/send\s+(?:a\s+)?(?:signal|message)\s+to\s+(\w+)/)
  if (sendMatch) {
    return { type: 'send', to: sendMatch[1] }
  }

  // Strengthen: "strengthen scout to analyst"
  const strengthenMatch = lower.match(/strengthen\s+(\w+)\s+to\s+(\w+)/)
  if (strengthenMatch) {
    return { type: 'strengthen', from: strengthenMatch[1], to: strengthenMatch[2] }
  }

  // Query: "show highways/agents/tasks"
  if (lower.includes('highway') || lower.includes('show') || lower.includes('list')) {
    if (lower.includes('agent') || lower.includes('who')) return { type: 'query', query: 'agents' }
    if (lower.includes('task')) return { type: 'query', query: 'tasks' }
    return { type: 'query', query: 'highways' }
  }

  // Decay: "decay" or "fade"
  if (lower.includes('decay') || lower.includes('fade')) {
    return { type: 'decay', rate: 0.2 }
  }

  // Inject: "inject" or "burst" or "fire"
  if (lower.includes('inject') || lower.includes('burst') || lower.includes('fire')) {
    return { type: 'inject' }
  }

  return null
}

interface WorldChatProps {
  world: World
  agents: Array<{ id: string; name: string; actions: Record<string, unknown> }>
  onWorldUpdate: () => void
}

export function WorldChat({ world, agents, onWorldUpdate }: WorldChatProps) {
  const { skin, t } = useSkin()
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null)
  const localMessages = useStore(messages$)
  const isStreaming = useStore(isStreaming$)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages])

  // Voice input setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript
        setInput((prev) => prev + ' ' + text)
        setListening(false)
      }
      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
    }
    setListening(!listening)
  }

  // Execute command on world
  const executeCommand = useCallback(async (command: WorldCommand): Promise<string> => {
    switch (command.type) {
      case 'spawn': {
        world.add(command.id)
          .on('signal', () => ({}))
          .on('default', () => ({}))
        return `${skin.icons.actor} Spawned ${command.kind}: ${command.id}`
      }

      case 'connect': {
        world.signal({ receiver: `${command.from}:connect`, data: { target: command.to } })
        world.mark(`${command.from}→${command.to}`)
        onWorldUpdate()
        return `${skin.icons.flow} Connected: ${command.from} → ${command.to}`
      }

      case 'send': {
        world.signal({ receiver: `${command.to}:signal`, data: { ping: true } })
        onWorldUpdate()
        return `${skin.icons.entry} Signal sent to ${command.to}`
      }

      case 'strengthen': {
        world.mark(`${command.from}:task → ${command.to}:task`, 10)
        onWorldUpdate()
        return `${skin.icons.open} Strengthened: ${command.from} → ${command.to}`
      }

      case 'query': {
        if (command.query === 'agents') {
          return `${skin.icons.group} ${t('actor')}s:\n${agents
            .map((a) => `  ${skin.icons.actor} ${a.name} (${a.id})`)
            .join('\n')}`
        }
        const flows = world.highways(10)
        return `${skin.icons.open} Top ${t('flow')}s:\n${flows
          .map((f) => `  ${f.path}: ${f.strength.toFixed(0)}`)
          .join('\n')}`
      }

      case 'decay': {
        world.fade(command.rate || 0.2)
        onWorldUpdate()
        return `Decay applied (${((command.rate || 0.2) * 100).toFixed(0)}%). Trails fading...`
      }

      case 'inject': {
        agents.forEach((a) =>
          world.signal({
            receiver: `${a.id}:${Object.keys(a.actions)[0] || 'signal'}`,
            data: { burst: true },
          })
        )
        onWorldUpdate()
        return `${skin.icons.entry} Burst! Signals sent to all ${agents.length} ${t('actor')}s`
      }

      default:
        return 'Unknown command'
    }
  }, [world, agents, skin, t, onWorldUpdate])

  // Handle send
  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return

    const userText = input.trim()
    setInput('')

    // Add user message
    addMessage({ role: 'user', content: userText })
    setStreaming(true)

    // Try to parse as command
    const command = parseCommand(userText)

    let response: string
    if (command) {
      // Execute command
      response = await executeCommand(command)
      addMessage({ role: 'assistant', content: response, command })
    } else {
      // Show help
      response = `Commands:\n• "Create a scout" - spawn agent\n• "Connect scout to analyst" - create flow\n• "Send signal to trader" - transmit\n• "Show highways" - view flows\n• "List agents" - who's here\n• "Decay" - fade trails\n• "Inject" - burst to all`
      addMessage({ role: 'assistant', content: response })
    }

    setStreaming(false)
  }, [input, isStreaming, executeCommand])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: skin.colors.background }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center gap-2"
        style={{ borderColor: skin.colors.muted + '30' }}
      >
        <Sparkles className="w-5 h-5" style={{ color: skin.colors.primary }} />
        <span className="font-medium text-white">World Chat</span>
        <span className="text-xs ml-auto" style={{ color: skin.colors.muted }}>
          {agents.length} {t('actor')}s
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {localMessages.length === 0 && (
          <div className="text-center py-8" style={{ color: skin.colors.muted }}>
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Speak or type to command the world</p>
            <p className="text-xs mt-2 opacity-60">
              "Create a scout" · "Connect scout to analyst" · "Show highways"
            </p>
          </div>
        )}

        {localMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'rounded-lg px-3 py-2 max-w-[85%]',
              msg.role === 'user' ? 'ml-auto' : 'mr-auto'
            )}
            style={{
              backgroundColor:
                msg.role === 'user'
                  ? skin.colors.primary + '20'
                  : skin.colors.surface,
              borderColor:
                msg.role === 'user'
                  ? skin.colors.primary + '40'
                  : skin.colors.muted + '30',
              borderWidth: 1,
            }}
          >
            <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
            {msg.command && (
              <div
                className="mt-2 text-xs px-2 py-1 rounded inline-block"
                style={{
                  backgroundColor: skin.colors.success + '20',
                  color: skin.colors.success,
                }}
              >
                {skin.icons.actor} {msg.command.type}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 border-t"
        style={{ borderColor: skin.colors.muted + '30' }}
      >
        <div className="flex gap-2">
          {/* Voice button */}
          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              'px-3 py-2 rounded-lg transition-all',
              listening && 'animate-pulse'
            )}
            style={{
              backgroundColor: listening ? '#ef4444' : skin.colors.surface,
              color: listening ? 'white' : skin.colors.muted,
            }}
          >
            {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${t('send')} a command...`}
            disabled={isStreaming}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none"
            style={{
              backgroundColor: skin.colors.surface,
              borderColor: skin.colors.muted + '30',
              borderWidth: 1,
            }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: skin.colors.primary,
              color: 'white',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
