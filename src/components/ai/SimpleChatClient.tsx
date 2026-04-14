/**
 * Simple Chat Client - OpenRouter Integration
 *
 * Manages state locally and calls API directly
 * Stores API key in localStorage (client-side only)
 */

import { Brain, Code, Lightbulb, MessageSquare, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MessageList } from '@/components/ai/MessageList'
import { PromptInput } from '@/components/ai/PromptInput'
import { Suggestions } from '@/components/ai/Suggestions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { secureGetItem, secureRemoveItem, secureSetItem } from '@/lib/security'

const POPULAR_MODELS = [
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite (Google) - Fast & Free',
  },
  { id: 'openai/gpt-4', name: 'GPT-4 (OpenAI)' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenAI)' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (Anthropic)' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet (Anthropic)' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B (Meta)' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5 (Google)' },
]

const STORAGE_KEY = 'openrouter-api-key'
const MODEL_KEY = 'openrouter-model'

// Demo prompt suggestions showcasing AI capabilities
const PROMPT_SUGGESTIONS = [
  'Write a creative short story about a time traveler',
  'Create a React component for a todo list with TypeScript',
  'Explain how neural networks work in simple terms',
  'Generate 5 unique business ideas for sustainable products',
  'Help me debug this code: function add(a,b) { return a+b }',
  'Analyze the pros and cons of remote work vs office work',
  'Write a professional email requesting a project deadline extension',
  'Create a Python script to analyze CSV data',
]

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export function SimpleChatClient() {
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash-lite')
  const [chatStarted, setChatStarted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load API key and model from secure storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = secureGetItem(STORAGE_KEY)
      const savedModel = localStorage.getItem(MODEL_KEY) // Model selection is not sensitive

      if (savedKey) {
        setApiKey(savedKey)
        setChatStarted(true)
      }
      if (savedModel) {
        setSelectedModel(savedModel)
      }
    }
  }, [])

  // Save to secure storage when starting chat
  const handleStartChat = () => {
    if (apiKey && typeof window !== 'undefined') {
      secureSetItem(STORAGE_KEY, apiKey)
      localStorage.setItem(MODEL_KEY, selectedModel)
      setChatStarted(true)
    }
  }

  // Clear stored key
  const handleClearKey = () => {
    if (typeof window !== 'undefined') {
      secureRemoveItem(STORAGE_KEY)
      localStorage.removeItem(MODEL_KEY)
    }
    setApiKey('')
    setChatStarted(false)
    setMessages([])
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion)
  }

  // Submit message to API
  const handleSubmit = async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
    }

    // Add user message to the chat
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          apiKey,
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`
        console.error('API Error:', errorMessage)
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantContent = ''
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
      }

      // Add empty assistant message that we'll update
      setMessages((prev) => [...prev, assistantMessage])

      // Read streaming response
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.choices?.[0]?.delta?.content) {
                assistantContent += parsed.choices[0].delta.content
                // Update the assistant message content
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: assistantContent } : msg)),
                )
              }
            } catch (_e) {
              // Some chunks might not be valid JSON, that's okay
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      // Remove the user message if there was an error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  // Show API key setup form
  if (!chatStarted) {
    return (
      <div className="container max-w-md mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Start Free Chat</CardTitle>
            <CardDescription>Enter your OpenRouter API key to access all AI models.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Security Notice */}
            <Alert>
              <AlertDescription className="text-xs">
                🔒 <strong>Security:</strong> Your API key is stored in your browser's localStorage (not on our
                servers). Only use this on trusted devices.
                {apiKey && (
                  <button onClick={handleClearKey} className="underline ml-1">
                    Clear stored key
                  </button>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="api-key">OpenRouter API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
                placeholder="sk-or-v1-..."
              />
              <p className="text-xs text-muted-foreground">
                Get your key from{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenRouter
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Select Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleStartChat} disabled={!apiKey} className="w-full">
              Start Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show chat interface
  return (
    <div className="flex flex-col h-screen">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 border-b px-6 py-4 bg-background">
        <div className="container max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">AI Chat</h1>
            <p className="text-xs text-muted-foreground">{POPULAR_MODELS.find((m) => m.id === selectedModel)?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setChatStarted(false)}>
              Change Model
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearKey}>
              Clear Key
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 px-6 py-2 bg-destructive/10">
          <div className="container max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-6 py-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 py-12">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Start a Conversation</h3>
                <p className="text-muted-foreground max-w-md">
                  Try asking me anything! I can help with coding, writing, analysis, and creative tasks.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Code className="h-4 w-4 text-blue-500" />
                  <span>Code Generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span>Problem Solving</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span>Creative Writing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span>Analysis & Insights</span>
                </div>
              </div>

              {/* Prompt Suggestions - Show when no messages */}
              <div className="w-full max-w-2xl pt-4">
                <Suggestions suggestions={PROMPT_SUGGESTIONS} onSuggestionClick={handleSuggestionClick} />
              </div>
            </div>
          ) : (
            <MessageList messages={messages} isLoading={isLoading} />
          )}

          {/* Upgrade prompt - inline with messages */}
          {messages.length > 10 && (
            <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold mb-1">💡 Upgrade to Premium</p>
                  <p className="text-sm opacity-90">
                    Your messages will be lost on page refresh.
                    <a href="/upgrade" className="underline ml-1 font-medium">
                      Enable persistence for $29/mo
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-background">
        <div className="container max-w-4xl mx-auto px-6 py-4">
          <PromptInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder={
              messages.length === 0 ? 'Type your message or choose a suggestion above...' : 'Type your message...'
            }
          />
          {messages.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground text-center">Using OpenRouter with your API key</p>
          )}
        </div>
      </div>
    </div>
  )
}
