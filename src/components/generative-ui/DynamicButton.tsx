import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DynamicButtonProps {
  data: {
    label: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    action?: string
    disabled?: boolean
  }
  layout?: any
}

export function DynamicButton({ data }: DynamicButtonProps) {
  const handleClick = () => {
    if (data.action) {
      try {
        // Safe eval for demo purposes - in production, use proper event handlers
        const func = new Function(data.action)
        func()
      } catch (e) {
        console.error('Button action error:', e)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive Button</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant={data.variant || 'default'}
          size={data.size || 'default'}
          onClick={handleClick}
          disabled={data.disabled}
        >
          {data.label}
        </Button>
      </CardContent>
    </Card>
  )
}
