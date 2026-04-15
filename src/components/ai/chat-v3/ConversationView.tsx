import { ArrowDown, Brain, CheckCheckIcon, ChevronDown, CopyIcon, MessageSquare, Square, Wrench } from 'lucide-react'
import { useRef } from 'react'
import { ChatMessages } from '@/components/ai/ChatMessages'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai/elements/conversation'
import {
  OpenIn,
  OpenInChatGPT,
  OpenInClaude,
  OpenInContent,
  OpenInCursor,
  OpenInTrigger,
  OpenInv0,
} from '@/components/ai/elements/open-in-chat'
import { Reasoning, ReasoningContent } from '@/components/ai/elements/reasoning'
import { SystemMessage, TelegramMessage } from '@/components/ai/TelegramMessage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ExtendedMessage } from '@/lib/chat/types'
import type { ConversationMessage } from '@/lib/claude-code-events'
import { cn } from '@/lib/utils'

interface Props {
  messages: ExtendedMessage[]
  isLoading: boolean
  activeTools: string[]
  thinkingStatus: string
  useDirector: boolean
  activeAgents: string[]
  isAtBottom: boolean
  newMessageSender: string | null
  conversationCopied: boolean
  onScrollStateChange: (atBottom: boolean, sender: string | null) => void
  onCopyConversation: () => void
  onStop: () => void
}

function toConversationMessage(msg: ExtendedMessage): ConversationMessage {
  return {
    id: msg.id,
    type: msg.role === 'user' ? 'user' : msg.metadata?.sender === 'System' ? 'system' : 'director',
    sender: msg.metadata?.sender || (msg.role === 'user' ? 'You' : 'Agent Director'),
    content: msg.content,
    timestamp: msg.timestamp ?? Date.now(),
    avatar: msg.metadata?.avatar,
    isStreaming: msg.metadata?.isStreaming,
    isComplete: msg.metadata?.isComplete,
  }
}

export function ConversationView({
  messages,
  isLoading,
  activeTools,
  thinkingStatus,
  useDirector,
  activeAgents,
  isAtBottom,
  newMessageSender,
  conversationCopied,
  onScrollStateChange,
  onCopyConversation,
  onStop,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const renderMessage = (msg: ExtendedMessage) => {
    const conversationMsg = toConversationMessage(msg)
    const isUser = msg.role === 'user'
    const isSystemMsg = conversationMsg.type === 'system'
    if (msg.metadata?.sender === 'Agent Director' && msg.metadata?.isStreaming) return null
    if (isSystemMsg) return <SystemMessage key={msg.id} message={conversationMsg} />
    return <TelegramMessage key={msg.id} message={conversationMsg} isUser={isUser} />
  }

  return (
    <div className="relative w-full">
      {/* New Message Notification */}
      {!isAtBottom && newMessageSender && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <Button
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
          >
            <span>New message from {newMessageSender}</span>
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Conversation className="w-full" initial="auto" resize="auto">
        <ConversationContent className="w-full md:max-w-3xl mx-auto px-4 pb-[145px]">
          <ChatMessages messages={messages} renderMessage={renderMessage} onScrollStateChange={onScrollStateChange} />

          {/* Director Thinking Visualization */}
          {isLoading &&
            useDirector &&
            messages.length > 0 &&
            (() => {
              const directorMessage = messages
                .slice()
                .reverse()
                .find((m) => m.metadata?.sender === 'Agent Director' && m.metadata?.isStreaming)

              return directorMessage?.content ? (
                <div className="mb-4">
                  <Reasoning isStreaming={isLoading} open={true}>
                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Brain className="h-4 w-4 animate-pulse" />
                        <span className="text-sm font-medium">Agent Director Thinking...</span>
                      </div>
                    </div>
                    <ReasoningContent>{directorMessage.content}</ReasoningContent>
                  </Reasoning>
                </div>
              ) : null
            })()}

          {/* Active Agents Listening */}
          {useDirector && activeAgents.length > 0 && (
            <Card className="border-green-500/50 bg-green-500/5 mb-4">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    👂
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-green-700 dark:text-green-400">Active Agents Listening</p>
                      <Badge variant="outline" className="text-xs border-green-500/30">
                        {activeAgents.length} listening
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These agents are watching the conversation and will respond when they can add value
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {activeAgents.map((agentId, idx) => {
                        const agentName = agentId.replace('agent-', '').replace(/^./, (c) => c.toUpperCase())
                        const agentEmojis: Record<string, string> = {
                          'agent-frontend': '🎨',
                          'agent-backend': '⚙️',
                          'agent-builder': '🔨',
                          'agent-quality': '✅',
                          'agent-designer': '🎯',
                        }
                        return (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs flex items-center gap-1 bg-green-500/10 border-green-500/20"
                          >
                            <span>{agentEmojis[agentId] || '🤖'}</span>
                            {agentName}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Tool Execution Status */}
          {isLoading && activeTools.length > 0 && (
            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 text-blue-500 animate-pulse mt-1" />
                  <div className="flex-1 space-y-2">
                    <p className="font-medium text-sm">{thinkingStatus}</p>
                    <div className="flex flex-wrap gap-2">
                      {activeTools.map((tool, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Regular thinking indicator */}
          {isLoading && activeTools.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4 animate-pulse" />
              <span>{thinkingStatus || 'Thinking...'}</span>
            </div>
          )}

          {/* Action Buttons */}
          {messages.length > 0 && (
            <div className="flex justify-center gap-2 mt-4 mb-5">
              {isLoading && (
                <Button variant="destructive" size="sm" onClick={onStop} className="transition-all duration-200">
                  <Square className="h-4 w-4 mr-2 fill-current" />
                  Stop
                </Button>
              )}

              <Button
                variant={conversationCopied ? 'default' : 'outline'}
                size="sm"
                onClick={onCopyConversation}
                className={cn(
                  'transition-all duration-200',
                  conversationCopied ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : '',
                )}
              >
                {conversationCopied ? (
                  <>
                    <CheckCheckIcon className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-4 w-4 mr-2" />
                    Copy Conversation
                  </>
                )}
              </Button>

              {!isLoading && (
                <OpenIn
                  query={messages
                    .filter((msg) => msg.type !== 'tool_call' && msg.type !== 'tool_result')
                    .map((msg) => {
                      const role = msg.role === 'user' ? 'You' : 'Assistant'
                      const content =
                        typeof msg.content === 'string'
                          ? msg.content
                          : (msg.content as Array<{ type: string; text?: string }>)?.[0]?.type === 'text'
                            ? ((msg.content as Array<{ type: string; text?: string }>)[0].text ?? '')
                            : ''
                      return `${role}: ${content}`
                    })
                    .join('\n\n')}
                >
                  <OpenInTrigger>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open in Chat
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </OpenInTrigger>
                  <OpenInContent>
                    <OpenInChatGPT />
                    <OpenInClaude />
                    <OpenInv0 />
                    <OpenInCursor />
                  </OpenInContent>
                </OpenIn>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  )
}
