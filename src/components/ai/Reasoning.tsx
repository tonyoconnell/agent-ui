import { Check, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ReasoningStep {
  step: number
  title: string
  description: string
  completed: boolean
}

export interface ReasoningProps {
  steps: ReasoningStep[]
}

export function Reasoning({ steps }: ReasoningProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Agent Reasoning</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {s.completed ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
