import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DynamicList({ data, layout }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {data.items?.map((item: any, i: number) => (
            <li key={i} className="flex items-center gap-2">
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
