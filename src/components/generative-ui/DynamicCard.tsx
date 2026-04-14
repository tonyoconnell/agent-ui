import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function DynamicCard({ data, layout }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        {data.description && <CardDescription>{data.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {typeof data.content === 'string' ? (
          <p className="text-sm">{data.content}</p>
        ) : (
          <pre className="text-xs">{JSON.stringify(data.content, null, 2)}</pre>
        )}
      </CardContent>
      {data.actions && (
        <CardFooter className="flex gap-2">
          {data.actions.map((action: any, i: number) => (
            <Button key={i} variant={action.variant || 'default'} size="sm">
              {action.label}
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
