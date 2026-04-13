import { z } from 'zod'
import { type Tool, toolRegistry } from '../registry'

/**
 * Chart Creation Tool - Generate chart visualizations
 *
 * Uses existing DynamicChart component (Recharts-based)
 *
 * Ontology mapping:
 * - Chart = Thing (type: 'chart')
 * - Chart generation = Event (type: 'chart_rendered')
 * - Message → Chart = Connection (type: 'renders')
 */
const chartParams = z.object({
  title: z.string(),
  description: z.string().optional(),
  chartType: z.enum(['line', 'bar', 'pie', 'area', 'doughnut']),
  labels: z.array(z.string()),
  datasets: z.array(
    z.object({
      label: z.string(),
      data: z.array(z.number()),
      color: z.string().optional(),
    }),
  ),
})

async function createChart(params: z.infer<typeof chartParams>) {
  // Return structured data that existing DynamicChart component can render
  // This matches the format already used by /api/chat endpoint
  return {
    type: 'ui',
    component: 'chart',
    data: params,
  }
}

export const createChartTool: Tool = {
  name: 'create_chart',
  description:
    'Create a chart visualization. Supports: line (trends), bar (comparisons), pie (proportions), area (cumulative), doughnut (distribution)',
  category: 'data',
  parameters: chartParams,
  execute: createChart,
}

toolRegistry.register(createChartTool)
