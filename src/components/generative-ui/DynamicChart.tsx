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

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DynamicChart({ data, layout }: any) {
  const chartData =
    data.labels?.map((label: string, i: number) => ({
      name: label,
      ...(data.datasets?.reduce(
        (acc: any, dataset: any) => Object.assign(acc, { [dataset.label]: dataset.data[i] }),
        {},
      ) || {}),
    })) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        {data.description && <CardDescription>{data.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
      </CardContent>
    </Card>
  )
}
