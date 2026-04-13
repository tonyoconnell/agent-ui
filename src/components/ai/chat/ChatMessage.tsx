/**
 * ChatMessage - Individual message renderer
 * Supports text, reasoning, tool calls, generative UI, sources, and chain of thought
 */

import { CheckCheck, CheckCircle, Copy, FileText, Lightbulb, Search, User } from 'lucide-react'
import { useState } from 'react'
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai/elements/chain-of-thought'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai/elements/reasoning'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai/elements/sources'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai/elements/tool'
import { WeatherCard } from '@/components/ai/tools/WeatherCard'
import { GenerativeUIRenderer } from '@/components/generative-ui/GenerativeUIRenderer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Message } from '@/stores/chat-store'
import { MarkdownRenderer } from './MarkdownRenderer'

interface ChatMessageProps {
  message: Message
  onCopy?: (text: string) => void
}

export function ChatMessage({ message, onCopy }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  const handleCopy = () => {
    if (onCopy && message.content) {
      onCopy(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // System messages (light style, centered)
  if (isSystem) {
    return (
      <div className="py-4">
        <div className="flex justify-center">
          <div className="bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground">{message.content}</div>
        </div>
      </div>
    )
  }

  // Reasoning trace (expandable)
  if (message.type === 'reasoning') {
    return (
      <div className="py-4">
        <div className="flex items-start justify-center">
          {/* Avatar - OUTSIDE the content box, to the LEFT (hidden on mobile) */}
          <Avatar className="hidden md:flex w-16 h-16 shrink-0 mt-[-12px] mr-4">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <img src="/icon.svg" alt="ONE" className="h-9 w-9 dark:invert-0 invert" />
            </AvatarFallback>
          </Avatar>
          {/* Reasoning content - INSIDE max-w-4xl box with padding */}
          <div className="w-full max-w-4xl px-2 md:px-4">
            <Reasoning isStreaming={message.isReasoningStreaming || false} defaultOpen={false}>
              <ReasoningTrigger />
              <ReasoningContent>
                <pre className="text-sm whitespace-pre-wrap">{message.reasoning}</pre>
              </ReasoningContent>
            </Reasoning>
          </div>
        </div>
      </div>
    )
  }

  // Chain of Thought (step-by-step reasoning display)
  if (message.type === 'chain_of_thought') {
    return (
      <div className="py-4">
        <div className="flex items-start justify-center">
          {/* Avatar - OUTSIDE the content box, to the LEFT (hidden on mobile) */}
          <Avatar className="hidden md:flex w-16 h-16 shrink-0 mt-[-12px] mr-4">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <img src="/icon.svg" alt="ONE" className="h-9 w-9 dark:invert-0 invert" />
            </AvatarFallback>
          </Avatar>
          {/* Chain of Thought content - INSIDE max-w-4xl box with padding */}
          <div className="w-full max-w-4xl px-2 md:px-4">
            <ChainOfThought defaultOpen={true}>
              <ChainOfThoughtHeader>
                {message.isChainOfThoughtStreaming ? 'Thinking...' : 'Reasoning steps'}
              </ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {message.chainOfThought?.map((step) => (
                  <ChainOfThoughtStep
                    key={step.id}
                    label={step.label}
                    description={step.description}
                    status={step.status}
                    icon={
                      step.icon === 'search'
                        ? Search
                        : step.icon === 'file'
                          ? FileText
                          : step.icon === 'lightbulb'
                            ? Lightbulb
                            : CheckCircle
                    }
                  />
                ))}
              </ChainOfThoughtContent>
            </ChainOfThought>
          </div>
        </div>
      </div>
    )
  }

  // Tool call (collapsible with state)
  if (message.type === 'tool_call') {
    // Special handling for weather tool with output
    if (message.toolName === 'get_weather' && message.toolOutput) {
      return (
        <div className="py-4">
          <div className="flex items-start justify-center">
            {/* Avatar - OUTSIDE the content box, to the LEFT (hidden on mobile) */}
            <Avatar className="hidden md:flex w-16 h-16 shrink-0 mt-[-12px] mr-4">
              <AvatarFallback className="bg-muted text-muted-foreground">
                <img src="/icon.svg" alt="ONE" className="h-9 w-9 dark:invert-0 invert" />
              </AvatarFallback>
            </Avatar>
            {/* Weather card - INSIDE max-w-4xl box with padding */}
            <div className="w-full max-w-4xl px-2 md:px-4">
              <WeatherCard data={message.toolOutput as any} />
            </div>
          </div>
        </div>
      )
    }

    // Generic tool display
    return (
      <div className="py-4">
        <div className="flex items-start justify-center">
          {/* Avatar - OUTSIDE the content box, to the LEFT (hidden on mobile) */}
          <Avatar className="hidden md:flex w-16 h-16 shrink-0 mt-[-12px] mr-4">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <img src="/icon.svg" alt="ONE" className="h-9 w-9 dark:invert-0 invert" />
            </AvatarFallback>
          </Avatar>
          {/* Tool content - INSIDE max-w-4xl box with padding */}
          <div className="w-full max-w-4xl px-2 md:px-4">
            <Tool>
              <ToolHeader
                title={message.toolName || 'Tool'}
                type="tool-call"
                state={message.toolState || 'completed'}
              />
              <ToolContent>
                {message.toolInput && (
                  <ToolInput>
                    <pre className="text-xs text-foreground">{JSON.stringify(message.toolInput, null, 2)}</pre>
                  </ToolInput>
                )}
                {message.toolOutput && (
                  <ToolOutput>
                    <pre className="text-xs text-foreground">{JSON.stringify(message.toolOutput, null, 2)}</pre>
                  </ToolOutput>
                )}
              </ToolContent>
            </Tool>
          </div>
        </div>
      </div>
    )
  }

  // Generative UI (charts, tables, forms, etc.)
  if (message.type === 'ui' && message.uiPayload) {
    return (
      <div className="py-4">
        <div className="flex items-start justify-center">
          {/* Avatar - OUTSIDE the content box, to the LEFT (hidden on mobile) */}
          <Avatar className="hidden md:flex w-16 h-16 shrink-0 mt-[-12px] mr-4">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <img src="/icon.svg" alt="ONE" className="h-9 w-9 dark:invert-0 invert" />
            </AvatarFallback>
          </Avatar>
          {/* Generative UI - INSIDE max-w-4xl box with padding */}
          <div className="w-full max-w-4xl px-2 md:px-4 overflow-hidden">
            <GenerativeUIRenderer payload={message.uiPayload} />
          </div>
        </div>
      </div>
    )
  }

  // Text message (default) - ChatGPT-style: beautiful, readable, aligned with input
  return (
    <div className={cn('group py-4 transition-colors duration-200', !isUser && 'hover:bg-muted/20')}>
      {/* Centered container with perfect symmetry */}
      <div className="flex items-start justify-center">
        {/* Assistant avatar - OUTSIDE the content box, to the LEFT (hidden on mobile) */}
        {!isUser && (
          <Avatar className="hidden md:flex w-16 h-16 shrink-0 mt-[-12px] mr-4">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <img src="/icon.svg" alt="ONE" className="h-9 w-9 dark:invert-0 invert" />
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message content - INSIDE max-w-4xl box with padding */}
        <div className="w-full max-w-4xl px-2 md:px-4 min-w-0">
          {/* User messages: bubble matching input style with avatar on RIGHT */}
          {isUser ? (
            <div className="flex justify-end items-start gap-4">
              <div className="relative bg-[hsl(var(--color-sidebar))] rounded-2xl px-4 py-3 max-w-[85%] border-2 border-border">
                <p className="whitespace-pre-wrap break-words text-base leading-[1.6]">{message.content}</p>
              </div>
              {/* User avatar - to the RIGHT of bubble */}
              <Avatar className="w-16 h-16 shrink-0 mt-[-10px]">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            /* Assistant messages: full-width, NO BUBBLE, large prose text */
            <div className="space-y-4">
              {/* Chain of Thought - show reasoning steps */}
              {message.chainOfThought && message.chainOfThought.length > 0 && (
                <ChainOfThought defaultOpen={message.isChainOfThoughtStreaming}>
                  <ChainOfThoughtHeader>
                    {message.isChainOfThoughtStreaming ? 'Thinking...' : 'Reasoning steps'}
                  </ChainOfThoughtHeader>
                  <ChainOfThoughtContent>
                    {message.chainOfThought.map((step) => (
                      <ChainOfThoughtStep
                        key={step.id}
                        label={step.label}
                        description={step.description}
                        status={step.status}
                        icon={
                          step.icon === 'search'
                            ? Search
                            : step.icon === 'file'
                              ? FileText
                              : step.icon === 'lightbulb'
                                ? Lightbulb
                                : CheckCircle
                        }
                      />
                    ))}
                  </ChainOfThoughtContent>
                </ChainOfThought>
              )}

              {/* Main content with markdown + code highlighting */}
              <div className="prose prose-lg max-w-none dark:prose-invert prose-p:text-foreground prose-p:leading-relaxed">
                <MarkdownRenderer content={message.content} className="text-[17px]" />
              </div>

              {/* Sources - show citations */}
              {message.sources && message.sources.length > 0 && (
                <Sources>
                  <SourcesTrigger count={message.sources.length} />
                  <SourcesContent>
                    {message.sources.map((source, idx) => (
                      <Source key={idx} href={source.url} title={source.title} />
                    ))}
                  </SourcesContent>
                </Sources>
              )}

              {/* Action bar - appears on hover */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* Copy button */}
                {message.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs rounded-lg hover:bg-muted/80"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy
                      </>
                    )}
                  </Button>
                )}

                {/* Timestamp */}
                {message.timestamp && (
                  <span className="text-xs text-muted-foreground/50">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
