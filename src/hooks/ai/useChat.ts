import { useCallback, useReducer, useRef } from 'react'
import { DEMO_RESPONSES, findDemoKey } from '@/lib/chat/demos'
import { POPULAR_MODELS } from '@/lib/chat/models'
import { parseChatStream, parseDirectorStream } from '@/lib/chat/stream'
import { getToolDescription } from '@/lib/chat/tools'
import type { ExtendedMessage } from '@/lib/chat/types'

// ── State ────────────────────────────────────────────────────────────────────

interface ChatState {
  messages: ExtendedMessage[]
  isLoading: boolean
  error: string | null
  thinkingStatus: string
  activeTools: string[]
  activeAgents: string[]
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; message: ExtendedMessage }
  | { type: 'ADD_MESSAGES'; messages: ExtendedMessage[] }
  | { type: 'UPDATE_MESSAGE'; id: string; patch: Partial<ExtendedMessage> }
  | { type: 'APPEND_CONTENT'; id: string; content: string }
  | { type: 'REMOVE_MESSAGE'; id: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_THINKING'; status: string }
  | { type: 'ADD_TOOL'; desc: string }
  | { type: 'REMOVE_TOOL'; desc: string }
  | { type: 'ADD_AGENTS'; agents: string[] }
  | { type: 'MARK_STREAMING_COMPLETE' }
  | { type: 'CLEAR' }

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'ADD_MESSAGES':
      return { ...state, messages: [...state.messages, ...action.messages] }
    case 'UPDATE_MESSAGE':
      return { ...state, messages: state.messages.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)) }
    case 'APPEND_CONTENT':
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.id ? { ...m, content: m.content + action.content } : m)),
      }
    case 'REMOVE_MESSAGE':
      return { ...state, messages: state.messages.filter((m) => m.id !== action.id) }
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'SET_THINKING':
      return { ...state, thinkingStatus: action.status }
    case 'ADD_TOOL':
      return { ...state, activeTools: [...state.activeTools, action.desc] }
    case 'REMOVE_TOOL':
      return { ...state, activeTools: state.activeTools.filter((t) => t !== action.desc) }
    case 'ADD_AGENTS':
      return { ...state, activeAgents: [...new Set([...state.activeAgents, ...action.agents])] }
    case 'MARK_STREAMING_COMPLETE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.metadata?.isStreaming ? { ...m, metadata: { ...m.metadata, isStreaming: false, isComplete: true } } : m,
        ),
      }
    case 'CLEAR':
      return { messages: [], isLoading: false, error: null, thinkingStatus: '', activeTools: [], activeAgents: [] }
    default:
      return state
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UseChatOptions {
  selectedModel: string
  apiKey: string
  serverHasKey: boolean
  useDirector?: boolean
}

export interface SendResult {
  ok?: boolean
  needsKey?: boolean
  modelName?: string
  cancelled?: boolean
  error?: boolean
}

export function useChat({ selectedModel, apiKey, serverHasKey, useDirector = true }: UseChatOptions) {
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    isLoading: false,
    error: null,
    thinkingStatus: '',
    activeTools: [],
    activeAgents: [],
  })
  const abortRef = useRef<AbortController | null>(null)
  // Mutable refs for in-flight accumulation (avoids closure-stale-state issues)
  const streamingIdRef = useRef<string | null>(null)

  const send = useCallback(
    async (text: string): Promise<SendResult> => {
      if (!text.trim() || state.isLoading) return {}

      // Premium gate
      const modelInfo = POPULAR_MODELS.find((m) => m.id === selectedModel)
      if (modelInfo && !modelInfo.free && !apiKey && !serverHasKey && !selectedModel.startsWith('claude-code/')) {
        return { needsKey: true, modelName: modelInfo.name }
      }

      const userMsg: ExtendedMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        type: 'text',
        timestamp: Date.now(),
      }
      dispatch({ type: 'ADD_MESSAGE', message: userMsg })
      dispatch({ type: 'SET_LOADING', loading: true })
      dispatch({ type: 'SET_ERROR', error: null })
      dispatch({ type: 'SET_THINKING', status: 'Thinking...' })
      streamingIdRef.current = null
      abortRef.current = new AbortController()

      // Demo shortcut
      const demoKey = findDemoKey(text)
      if (demoKey && DEMO_RESPONSES[demoKey]) {
        await new Promise((r) => setTimeout(r, 500))
        dispatch({ type: 'ADD_MESSAGES', messages: DEMO_RESPONSES[demoKey] })
        dispatch({ type: 'SET_LOADING', loading: false })
        dispatch({ type: 'SET_THINKING', status: '' })
        abortRef.current = null
        return { ok: true }
      }

      const startMs = Date.now()
      try {
        if (useDirector) {
          await runDirector(text, state.messages, state.activeAgents, abortRef.current, dispatch, streamingIdRef)
        } else {
          await runChat(text, state.messages, selectedModel, apiKey, abortRef.current, dispatch)
        }
        // Rule 1 — Closed Loop: mark chat→model edge on every successful turn
        void fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver: 'chat:outcome',
            data: { outcome: 'result', ms: Date.now() - startMs, model: selectedModel, tags: ['chat', 'outcome'] },
          }),
        }).catch(() => {})
        return { ok: true }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return { cancelled: true }
        dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to send message' })
        dispatch({ type: 'REMOVE_MESSAGE', id: userMsg.id })
        return { error: true }
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false })
        dispatch({ type: 'SET_THINKING', status: '' })
        abortRef.current = null
      }
    },
    // messages and activeAgents are stable in the context we care about — only update when send is called
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.isLoading, state.messages, state.activeAgents, selectedModel, apiKey, serverHasKey, useDirector],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    dispatch({ type: 'SET_LOADING', loading: false })
    dispatch({ type: 'SET_THINKING', status: '' })
  }, [])

  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  return { ...state, canSend: !state.isLoading, send, stop, clear }
}

// ── Director stream ───────────────────────────────────────────────────────────

async function runDirector(
  text: string,
  history: ExtendedMessage[],
  activeAgents: string[],
  abort: AbortController,
  dispatch: React.Dispatch<ChatAction>,
  streamingIdRef: React.MutableRefObject<string | null>,
) {
  const res = await fetch('/api/chat-director', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content, metadata: m.metadata })),
        { role: 'user', content: text },
      ],
      activeAgents,
    }),
    signal: abort.signal,
  })
  if (!res.ok) throw new Error(`Director error: ${res.status}`)
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  for await (const event of parseDirectorStream(reader)) {
    if (event.type === 'message') {
      if (event.isStreaming) {
        if (streamingIdRef.current) {
          // Append to existing streaming message from this sender
          dispatch({ type: 'APPEND_CONTENT', id: streamingIdRef.current, content: event.content })
        } else {
          // First chunk — create new streaming message
          const msgId = `${event.sender}-${event.timestamp}`
          streamingIdRef.current = msgId
          dispatch({
            type: 'ADD_MESSAGE',
            message: {
              id: msgId,
              role: event.sender === 'System' ? 'system' : 'assistant',
              content: event.content,
              type: 'text',
              timestamp: event.timestamp,
              metadata: { sender: event.sender, avatar: event.avatar, isStreaming: true, isComplete: false },
            },
          })
        }
      } else {
        // Non-streaming: just add (dedup by ID)
        const msgId = `${event.sender}-${event.timestamp}`
        dispatch({
          type: 'ADD_MESSAGE',
          message: {
            id: msgId,
            role: event.sender === 'System' ? 'system' : 'assistant',
            content: event.content,
            type: 'text',
            timestamp: event.timestamp,
            metadata: { sender: event.sender, avatar: event.avatar, isStreaming: false, isComplete: true },
          },
        })
      }
    } else if (event.type === 'agent-presence') {
      dispatch({ type: 'ADD_AGENTS', agents: event.agents })
    } else if (event.type === 'done') {
      dispatch({ type: 'MARK_STREAMING_COMPLETE' })
      streamingIdRef.current = null
    } else if (event.type === 'error') {
      throw new Error(event.message)
    }
  }

  dispatch({ type: 'MARK_STREAMING_COMPLETE' })
  streamingIdRef.current = null
}

// ── Chat stream ───────────────────────────────────────────────────────────────

async function runChat(
  text: string,
  history: ExtendedMessage[],
  model: string,
  apiKey: string,
  abort: AbortController,
  dispatch: React.Dispatch<ChatAction>,
) {
  const isClaudeCode = model.startsWith('claude-code/')
  const res = await fetch(isClaudeCode ? '/api/chat-claude-code' : '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      isClaudeCode
        ? {
            messages: [...history.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: text }],
            model: model.split('/')[1],
          }
        : {
            messages: [...history.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: text }],
            apiKey,
            model,
          },
    ),
    signal: abort.signal,
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as { error?: string }
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const assistantId = `assistant-${Date.now()}`
  dispatch({
    type: 'ADD_MESSAGE',
    message: { id: assistantId, role: 'assistant', content: '', type: 'text', timestamp: Date.now() },
  })
  dispatch({ type: 'SET_THINKING', status: 'Receiving response...' })

  let hasData = false

  for await (const event of parseChatStream(reader)) {
    hasData = true
    if (event.type === 'text') {
      dispatch({ type: 'SET_THINKING', status: 'Generating response...' })
      dispatch({ type: 'APPEND_CONTENT', id: assistantId, content: event.content })
      dispatch({
        type: 'UPDATE_MESSAGE',
        id: assistantId,
        patch: { isReasoningStreaming: false, isReasoningComplete: true },
      })
    } else if (event.type === 'reasoning') {
      dispatch({ type: 'SET_THINKING', status: 'Reasoning through the problem...' })
      // Accumulate reasoning in the message — we patch the full reasoning object each time
      // since we can't read current state here; the reducer APPEND_CONTENT handles text, we update reasoning separately
      dispatch({ type: 'UPDATE_MESSAGE', id: assistantId, patch: { isReasoningStreaming: true } })
    } else if (event.type === 'tool_call') {
      const desc = getToolDescription(event.name, event.args)
      dispatch({ type: 'SET_THINKING', status: desc })
      dispatch({ type: 'ADD_TOOL', desc })
    } else if (event.type === 'tool_result') {
      const desc = getToolDescription(event.name, event.args)
      dispatch({ type: 'REMOVE_TOOL', desc })
    } else if (event.type === 'ui') {
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: `ui-${crypto.randomUUID()}`,
          role: 'assistant',
          content: '',
          type: 'ui',
          payload: { component: event.component, ...(event.payload as object) },
          timestamp: Date.now(),
        },
      })
    }
  }

  dispatch({
    type: 'UPDATE_MESSAGE',
    id: assistantId,
    patch: { isReasoningStreaming: false, isReasoningComplete: true },
  })

  if (!hasData) {
    dispatch({ type: 'SET_ERROR', error: 'No response received from the model.' })
    dispatch({ type: 'REMOVE_MESSAGE', id: assistantId })
  }
}
