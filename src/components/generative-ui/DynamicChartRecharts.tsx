/**
 * DynamicChart with Recharts - Enhanced Version
 *
 * This is the Recharts-powered version that should work after:
 * 1. Vite config updates (dedupe React, define NODE_ENV)
 * 2. React integration updates (experimentalReactChildren)
 * 3. Client-only rendering with proper lazy loading
 *
 * To test: Rename this file to DynamicChart.tsx (backup the CSS version first)
 */

import { lazy, Suspense, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Dynamically import Recharts to avoid SSR issues
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

export function DynamicChartRecharts({ data, layout }: any) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const chartData =
    data.labels?.map((label: string, i: number) => ({
      name: label,
      ...(data.datasets?.reduce(
        (acc: any, dataset: any) => Object.assign(acc, { [dataset.label]: dataset.data[i] }),
        {},
      ) || {}),
    })) || []

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{data.title}</CardTitle>
          {data.description && <CardDescription>{data.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading Recharts...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        {data.description && <CardDescription>{data.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Rendering chart...</p>
              </div>
            </div>
          }
        >
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {data.chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--color-font))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--color-font))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--color-background))',
                      border: '1px solid hsl(var(--color-border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--color-font))',
                    }}
                    cursor={{ fill: 'hsl(var(--color-font) / 0.03)' }}
                  />
                  <Legend />
                  {data.datasets?.map((dataset: any, i: number) => (
                    <Line
                      key={i}
                      type="monotone"
                      dataKey={dataset.label}
                      stroke={dataset.color || '#3b82f6'}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--color-font))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--color-font))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--color-background))',
                      border: '1px solid hsl(var(--color-border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--color-font))',
                    }}
                    cursor={{ fill: 'hsl(var(--color-font) / 0.03)' }}
                  />
                  <Legend />
                  {data.datasets?.map((dataset: any, i: number) => (
                    <Bar
                      key={i}
                      dataKey={dataset.label}
                      fill={dataset.color || '#3b82f6'}
                      radius={[4, 4, 0, 0]}
                      label={false}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Suspense>
      </CardContent>
    </Card>
  )
}
