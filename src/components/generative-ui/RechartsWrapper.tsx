/**
 * Recharts Wrapper - Proper client-side only rendering
 *
 * This component ensures Recharts loads correctly by:
 * 1. Dynamic import (no SSR)
 * 2. Client-only rendering with proper React context
 * 3. Lazy loading to avoid bundle conflicts
 */

import { lazy, Suspense, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Lazy load Recharts components (client-only)
const LineChart = lazy(() => import('recharts').then((mod) => ({ default: mod.LineChart })))
const BarChart = lazy(() => import('recharts').then((mod) => ({ default: mod.BarChart })))
const Line = lazy(() => import('recharts').then((mod) => ({ default: mod.Line })))
const Bar = lazy(() => import('recharts').then((mod) => ({ default: mod.Bar })))
const XAxis = lazy(() => import('recharts').then((mod) => ({ default: mod.XAxis })))
const YAxis = lazy(() => import('recharts').then((mod) => ({ default: mod.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then((mod) => ({ default: mod.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then((mod) => ({ default: mod.Tooltip })))
const Legend = lazy(() => import('recharts').then((mod) => ({ default: mod.Legend })))
const ResponsiveContainer = lazy(() => import('recharts').then((mod) => ({ default: mod.ResponsiveContainer })))

interface RechartsWrapperProps {
  data: {
    title: string
    description?: string
    chartType: 'line' | 'bar'
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      color: string
    }>
  }
}

export function RechartsWrapper({ data }: RechartsWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  // Only render on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Transform data for Recharts format
  const chartData =
    data.labels?.map((label: string, i: number) => ({
      name: label,
      ...(data.datasets?.reduce(
        (acc: any, dataset: any) => Object.assign(acc, { [dataset.label]: dataset.data[i] }),
        {},
      ) || {}),
    })) || []

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{data.title}</CardTitle>
          {data.description && <CardDescription>{data.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg animate-pulse">
            <p className="text-sm text-muted-foreground">Loading chart...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{data.title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            Recharts {data.chartType === 'line' ? 'Line' : 'Bar'} Chart
          </Badge>
        </div>
        {data.description && <CardDescription>{data.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Loading chart components...</p>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            {data.chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.datasets?.map((dataset: any, i: number) => (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={dataset.label}
                    stroke={dataset.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.datasets?.map((dataset: any, i: number) => (
                  <Bar key={i} dataKey={dataset.label} fill={dataset.color} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </Suspense>
      </CardContent>
    </Card>
  )
}
