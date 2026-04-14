import { DynamicButton } from './DynamicButton'
import { DynamicCard } from './DynamicCard'
import { DynamicChart } from './DynamicChart'
import { DynamicCheckout } from './DynamicCheckout'
import { DynamicForm } from './DynamicForm'
import { DynamicList } from './DynamicList'
import { DynamicProduct } from './DynamicProduct'
import { DynamicTable } from './DynamicTable'
import { DynamicTimeline } from './DynamicTimeline'

export interface UIPayload {
  component: 'chart' | 'table' | 'card' | 'form' | 'list' | 'timeline' | 'button' | 'product' | 'checkout'
  data: any
  layout?: any
  onAddToCart?: (data: any, quantity: number) => void
}

export function GenerativeUIRenderer({ payload }: { payload: UIPayload }) {
  switch (payload.component) {
    case 'chart':
      return <DynamicChart data={payload.data} layout={payload.layout} />
    case 'table':
      return <DynamicTable data={payload.data} layout={payload.layout} />
    case 'card':
      return <DynamicCard data={payload.data} layout={payload.layout} />
    case 'form':
      return <DynamicForm data={payload.data} layout={payload.layout} />
    case 'list':
      return <DynamicList data={payload.data} layout={payload.layout} />
    case 'timeline':
      return <DynamicTimeline data={payload.data} layout={payload.layout} />
    case 'button':
      return <DynamicButton data={payload.data} layout={payload.layout} />
    case 'product':
      return <DynamicProduct data={payload.data} onAddToCart={payload.onAddToCart} />
    case 'checkout':
      return <DynamicCheckout data={payload.data} />
    default:
      return (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          Unknown component: {payload.component}
        </div>
      )
  }
}
