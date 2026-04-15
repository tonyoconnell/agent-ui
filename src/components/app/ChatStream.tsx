import { ChatShell } from '@/components/ai/chat-v3'

interface Props {
  groupId: string
}

export function ChatStream({ groupId }: Props) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ChatShell mode="inline" target={`group:${groupId}`} />
    </div>
  )
}
