import { GenerativeUIRenderer } from '@/components/generative-ui/GenerativeUIRenderer'
import { Button } from '@/components/ui/button'
import { Message } from './Message'
import { Reasoning } from './Reasoning'
import { ToolCall } from './ToolCall'

export interface AgentUIMessage {
  type: 'text' | 'ui' | 'action' | 'reasoning' | 'tool_call' | 'error'
  payload: any
  timestamp: number
}

export interface AgentMessageProps {
  message: AgentUIMessage
}

export function AgentMessage({ message }: AgentMessageProps) {
  switch (message.type) {
    case 'text':
      return <Message content={message.payload.text} timestamp={message.timestamp} />
    case 'ui':
      return (
        <div className="p-4">
          <GenerativeUIRenderer payload={message.payload} />
        </div>
      )
    case 'action':
      return (
        <div className="space-y-2 p-4">
          <p className="text-sm font-medium">Suggested actions:</p>
          <div className="flex flex-wrap gap-2">
            {message.payload.actions.map((action: any) => (
              <Button key={action.id} variant="outline" size="sm">
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )
    case 'reasoning':
      return (
        <div className="p-4">
          <Reasoning steps={message.payload.steps} />
        </div>
      )
    case 'tool_call':
      return (
        <div className="p-4">
          <ToolCall {...message.payload} />
        </div>
      )
    default:
      return <Message content="Unknown message type" timestamp={message.timestamp} />
  }
}
