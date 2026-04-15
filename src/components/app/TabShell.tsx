import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActorsTable } from './ActorsTable'
import { ChatStream } from './ChatStream'
import { EventTable } from './EventTable'
import { GroupTree } from './GroupTree'
import { Inspector } from './Inspector'
import { LearningPanel } from './LearningPanel'
import { PathsGraph } from './PathsGraph'
import { ThingsTable } from './ThingsTable'

interface Props {
  groupId: string
}

export function TabShell({ groupId }: Props) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [tab, setTab] = useState('chat')

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="w-64 shrink-0 border-r border-border overflow-hidden flex flex-col">
        <GroupTree groupId={groupId} onSelect={(uid) => setSelectedItem(uid)} />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="border-b border-border rounded-none w-full justify-start px-4">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="actors">Actors</TabsTrigger>
            <TabsTrigger value="things">Things</TabsTrigger>
            <TabsTrigger value="paths">Paths</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 overflow-auto p-4 h-full">
            <ChatStream groupId={groupId} />
          </TabsContent>

          <TabsContent value="actors" className="flex-1 overflow-auto p-4 h-full">
            <ActorsTable groupId={groupId} onSelect={(uid) => setSelectedItem(uid)} />
          </TabsContent>

          <TabsContent value="things" className="flex-1 overflow-auto p-4 h-full">
            <ThingsTable groupId={groupId} onSelect={(uid) => setSelectedItem(uid)} />
          </TabsContent>

          <TabsContent value="paths" className="flex-1 overflow-auto p-4 h-full">
            <PathsGraph groupId={groupId} />
          </TabsContent>

          <TabsContent value="events" className="flex-1 overflow-auto p-4 h-full">
            <EventTable groupId={groupId} />
          </TabsContent>

          <TabsContent value="learning" className="flex-1 overflow-auto p-4 h-full">
            <LearningPanel groupId={groupId} />
          </TabsContent>
        </Tabs>
      </div>

      {selectedItem !== null && (
        <div className="w-80 shrink-0 border-l border-border overflow-hidden flex flex-col">
          <Inspector uid={selectedItem} onClose={() => setSelectedItem(null)} />
        </div>
      )}
    </div>
  )
}
