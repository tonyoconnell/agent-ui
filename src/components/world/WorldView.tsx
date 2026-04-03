/**
 * WORLD VIEW — Chat + Graph + Metaphors
 *
 * The living interface for the ONE ontology.
 * Speak or type commands. Watch the world respond.
 */

import { useState, useCallback, useEffect, useRef } from "react"
import { colony } from "@/engine"
import type { Colony, Edge } from "@/engine"
import { cn } from "@/lib/utils"
import { MetaphorProvider, useMetaphor } from "@/contexts/MetaphorContext"
import { SkinSwitcher } from "@/components/controls/SkinSwitcher"
import { WorldGraph } from "@/components/graph/WorldGraph"

// Web Speech API types
interface SpeechRecognitionEvent {
  results: { [key: number]: { [key: number]: { transcript: string } } }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ActorData {
  id: string
  name: string
  status: string
  actions: Record<string, unknown>
}

interface WorldState {
  colony: Colony
  actors: ActorData[]
  flows: Edge[]
}

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  command?: WorldCommand
}

type WorldCommand =
  | { type: "spawn"; id: string; kind: string }
  | { type: "connect"; from: string; to: string }
  | { type: "send"; to: string; data?: unknown }
  | { type: "strengthen"; from: string; to: string }
  | { type: "query"; query: "open" | "blocked" | "proven" }

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function ChatPanel({
  messages,
  onSend,
  isLoading,
}: {
  messages: Message[]
  onSend: (text: string) => void
  isLoading: boolean
}) {
  const { skin, t } = useMetaphor()
  const [input, setInput] = useState("")
  const [listening, setListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Voice input
  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript
        setInput((prev) => prev + " " + text)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSend(input.trim())
    setInput("")
  }

  return (
    <div
      className="flex flex-col h-full border-r"
      style={{
        backgroundColor: skin.colors.background,
        borderColor: skin.colors.muted + "30",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center gap-2"
        style={{ borderColor: skin.colors.muted + "30" }}
      >
        <span className="text-xl">{skin.icons.group}</span>
        <span className="font-medium text-white">World Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8" style={{ color: skin.colors.muted }}>
            <p className="text-sm">Speak or type to command the world</p>
            <p className="text-xs mt-2 opacity-60">
              "Create a scout agent" · "Connect scout to analyst" · "Send a signal"
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-lg px-3 py-2 max-w-[85%]",
              msg.role === "user" ? "ml-auto" : "mr-auto"
            )}
            style={{
              backgroundColor:
                msg.role === "user"
                  ? skin.colors.primary + "30"
                  : skin.colors.surface,
              borderColor:
                msg.role === "user"
                  ? skin.colors.primary + "50"
                  : skin.colors.muted + "30",
              borderWidth: 1,
            }}
          >
            <p className="text-sm text-white">{msg.content}</p>
            {msg.command && (
              <div
                className="mt-2 text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: skin.colors.success + "20",
                  color: skin.colors.success,
                }}
              >
                {skin.icons.actor} {msg.command.type}:{" "}
                {JSON.stringify(msg.command).slice(0, 50)}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t"
        style={{ borderColor: skin.colors.muted + "30" }}
      >
        <div className="flex gap-2">
          {/* Voice button */}
          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              "px-3 py-2 rounded-lg transition-all",
              listening && "animate-pulse"
            )}
            style={{
              backgroundColor: listening
                ? "#ef4444"
                : skin.colors.muted + "30",
              color: listening ? "white" : skin.colors.muted,
            }}
          >
            {listening ? "🔴" : "🎤"}
          </button>

          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${t("send")} a command...`}
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none"
            style={{
              backgroundColor: skin.colors.surface,
              borderColor: skin.colors.muted + "30",
              borderWidth: 1,
            }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: skin.colors.primary,
              color: "white",
            }}
          >
            {isLoading ? "..." : "→"}
          </button>
        </div>
      </form>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND PARSER (Simple pattern matching for demo)
// ═══════════════════════════════════════════════════════════════════════════════

function parseCommand(text: string): WorldCommand | null {
  const lower = text.toLowerCase()

  // Spawn: "create/spawn a scout/analyst/trader"
  const spawnMatch = lower.match(/(create|spawn|add)\s+(?:a\s+)?(\w+)(?:\s+agent)?/)
  if (spawnMatch) {
    const kind = spawnMatch[2]
    const id = `${kind}-${Date.now().toString(36)}`
    return { type: "spawn", id, kind }
  }

  // Connect: "connect scout to analyst"
  const connectMatch = lower.match(/connect\s+(\w+)\s+to\s+(\w+)/)
  if (connectMatch) {
    return { type: "connect", from: connectMatch[1], to: connectMatch[2] }
  }

  // Send: "send signal to scout"
  const sendMatch = lower.match(/send\s+(?:a\s+)?(?:signal|message)\s+to\s+(\w+)/)
  if (sendMatch) {
    return { type: "send", to: sendMatch[1] }
  }

  // Strengthen: "strengthen scout to analyst"
  const strengthenMatch = lower.match(/strengthen\s+(\w+)\s+to\s+(\w+)/)
  if (strengthenMatch) {
    return { type: "strengthen", from: strengthenMatch[1], to: strengthenMatch[2] }
  }

  // Query: "show highways/open/blocked"
  if (lower.includes("highway") || lower.includes("open") || lower.includes("best")) {
    return { type: "query", query: "open" }
  }
  if (lower.includes("blocked") || lower.includes("toxic")) {
    return { type: "query", query: "blocked" }
  }

  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS BAR
// ═══════════════════════════════════════════════════════════════════════════════

function StatsBar({ actors, flows }: { actors: ActorData[]; flows: Edge[] }) {
  const { skin, t } = useMetaphor()
  const openFlows = flows.filter((f) => f.strength >= 50).length
  const totalStrength = flows.reduce((sum, f) => sum + f.strength, 0)

  return (
    <div
      className="flex items-center justify-between px-4 py-2 border-b"
      style={{
        backgroundColor: skin.colors.surface,
        borderColor: skin.colors.muted + "30",
      }}
    >
      {/* Left: Nav + Stats */}
      <div className="flex items-center gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Agents
          </a>
          <a
            href="/world"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Graph
          </a>
          <a
            href="/chat"
            className="px-3 py-1.5 text-white text-sm font-medium rounded-lg"
            style={{ backgroundColor: skin.colors.primary }}
          >
            Chat
          </a>
        </div>

        <div className="h-5 w-px bg-slate-700" />

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm">
          <span>
            {skin.icons.actor}{" "}
            <span style={{ color: skin.colors.primary }}>{actors.length}</span>
          </span>
          <span>
            {skin.icons.flow}{" "}
            <span style={{ color: skin.colors.secondary }}>{flows.length}</span>
          </span>
          <span>
            {skin.icons.open}{" "}
            <span style={{ color: skin.colors.success }}>{openFlows}</span>
          </span>
          <span>
            Σ <span style={{ color: skin.colors.warning }}>{totalStrength.toFixed(0)}</span>
          </span>
        </div>
      </div>

      {/* Right: Skin switcher */}
      <SkinSwitcher variant="icons" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD VIEW INNER
// ═══════════════════════════════════════════════════════════════════════════════

function WorldViewInner() {
  const { skin, t } = useMetaphor()
  const [world, setWorld] = useState<WorldState | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Initialize world
  useEffect(() => {
    const net = colony()

    // Spawn some initial actors
    const actors: ActorData[] = [
      { id: "scout", name: "Scout", status: "ready", actions: { observe: {}, scan: {} } },
      { id: "analyst", name: "Analyst", status: "ready", actions: { evaluate: {} } },
      { id: "trader", name: "Trader", status: "ready", actions: { execute: {} } },
    ]

    actors.forEach((a) => net.spawnFromJSON(a))

    // Send initial signals to create flows
    net.send({ receiver: "scout", receive: "observe", payload: { init: true } })
    net.send({
      receiver: "scout",
      receive: "observe",
      payload: {},
      callback: { receiver: "analyst", receive: "evaluate", payload: {} },
    })

    setWorld({ colony: net, actors, flows: net.highways(30) })
  }, [])

  // Periodic decay
  useEffect(() => {
    if (!world) return
    const interval = setInterval(() => {
      world.colony.fade(0.05)
      setWorld((prev) =>
        prev ? { ...prev, flows: world.colony.highways(30) } : null
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [world?.colony])

  // Handle chat message
  const handleSend = useCallback(
    async (text: string) => {
      if (!world) return

      // Add user message
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)

      // Parse command
      const command = parseCommand(text)

      // Execute command
      let response = ""
      if (command) {
        switch (command.type) {
          case "spawn": {
            const newActor: ActorData = {
              id: command.id,
              name: command.kind.charAt(0).toUpperCase() + command.kind.slice(1),
              status: "ready",
              actions: { default: {} },
            }
            world.colony.spawnFromJSON(newActor)
            setWorld((prev) =>
              prev
                ? {
                    ...prev,
                    actors: [...prev.actors, newActor],
                    flows: world.colony.highways(30),
                  }
                : null
            )
            response = `${skin.icons.actor} Spawned ${command.kind}: ${command.id}`
            break
          }
          case "connect": {
            // Send a signal to create the flow
            await world.colony.send({
              receiver: command.from,
              receive: "connect",
              payload: { target: command.to },
              callback: { receiver: command.to, receive: "connected", payload: {} },
            })
            setWorld((prev) =>
              prev ? { ...prev, flows: world.colony.highways(30) } : null
            )
            response = `${skin.icons.flow} Connected: ${command.from} → ${command.to}`
            break
          }
          case "send": {
            await world.colony.send({
              receiver: command.to,
              receive: "signal",
              payload: command.data || { ping: true },
            })
            setWorld((prev) =>
              prev ? { ...prev, flows: world.colony.highways(30) } : null
            )
            response = `${skin.icons.entry} Signal sent to ${command.to}`
            break
          }
          case "strengthen": {
            world.colony.mark(`${command.from}:task → ${command.to}:task`, 10)
            setWorld((prev) =>
              prev ? { ...prev, flows: world.colony.highways(30) } : null
            )
            response = `${skin.icons.open} Strengthened: ${command.from} → ${command.to}`
            break
          }
          case "query": {
            const flows = world.colony.highways(10)
            response = `${skin.icons.open} Top ${t("flow")}s:\n${flows
              .map((f) => `  ${f.edge}: ${f.strength.toFixed(0)}`)
              .join("\n")}`
            break
          }
        }
      } else {
        response = `I understand commands like:\n• "Create a scout agent"\n• "Connect scout to analyst"\n• "Send signal to trader"\n• "Show highways"`
      }

      // Add assistant message
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        command: command || undefined,
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsLoading(false)
    },
    [world, skin, t]
  )

  if (!world) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: skin.colors.background }}
      >
        <span className="text-3xl animate-pulse">{skin.icons.group}</span>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: skin.colors.background }}
    >
      <StatsBar actors={world.actors} flows={world.flows} />
      <div className="flex-1 flex min-h-0">
        <div className="w-[320px]">
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>
        <div className="flex-1">
          <WorldGraph
            colony={world.colony}
            agents={world.actors}
            highways={world.flows}
          />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function WorldView() {
  return (
    <MetaphorProvider initialSkin="team">
      <WorldViewInner />
    </MetaphorProvider>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~400 lines. Chat + Graph + Voice. ONE world.
// ═══════════════════════════════════════════════════════════════════════════════
