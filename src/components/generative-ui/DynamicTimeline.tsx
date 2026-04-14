import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DynamicTimeline({ data, layout }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.events?.map((event: any, i: number) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-primary" />
                {i < data.events.length - 1 && <div className="h-full w-px bg-border" />}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
