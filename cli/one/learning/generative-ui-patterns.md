---
title: Generative Ui Patterns
dimension: knowledge
category: patterns
tags: ai, generative-ui, react, components, recharts
related_dimensions: things, knowledge
scope: global
created: 2025-11-10
updated: 2025-11-10
version: 1.0.0
---

# Generative UI Patterns

**Version:** 1.0.0  
**Purpose:** Best practices for dynamic UI component generation by AI agents  
**Stack:** React 19 + shadcn/ui + Recharts + AG-UI Protocol

## Overview

**Generative UI** allows AI agents to dynamically create UI components based on data. Instead of returning HTML strings (security risk), agents return structured component specifications that the frontend renders safely.

**Traditional Approach (Bad):**
```typescript
// Security risk: XSS vulnerability
return "<div class='chart'>...</div>";
```

**Generative UI Approach (Good):**
```typescript
// Type-safe, secure, flexible
return {
  component: 'chart',
  data: {
    chartType: 'line',
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{ label: 'Revenue', data: [10, 20, 30] }]
  }
};
```

## Pattern 1: DynamicChart (Recharts)

### Implementation

```tsx
import { LineChart, BarChart, PieChart, Line, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { ChartComponentData } from '@/convex/protocols/agent-ui';

export function DynamicChart({ data, layout }: { 
  data: ChartComponentData['data']; 
  layout?: any 
}) {
  // Transform data for Recharts
  const chartData = data.labels.map((label, i) => ({
    name: label,
    ...data.datasets.reduce((acc, dataset) => ({
      ...acc,
      [dataset.label]: dataset.data[i]
    }), {})
  }));

  const renderChart = () => {
    switch (data.chartType) {
      case 'line':
        return (
          <LineChart data={chartData} width={600} height={300}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.color || `hsl(var(--chart-${i + 1}))`}
                fill={dataset.fill ? dataset.color : undefined}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={chartData} width={600} height={300}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset, i) => (
              <Bar
                key={i}
                dataKey={dataset.label}
                fill={dataset.color || `hsl(var(--chart-${i + 1}))`}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart width={600} height={300}>
            <Pie
              data={chartData}
              dataKey={data.datasets[0]?.label || 'value'}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill={`hsl(var(--chart-1))`}
              label
            />
            <Tooltip />
          </PieChart>
        );

      default:
        return <p>Unsupported chart type: {data.chartType}</p>;
    }
  };

  return (
    <Card className={layout?.width === 'full' ? 'w-full' : ''}>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        {data.description && <CardDescription>{data.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
```

### Agent Usage

```typescript
// Agent sends chart data
yield* agentUI.sendUI({
  agentId: AGENT_ID,
  conversationId: conversationId,
  component: {
    component: 'chart',
    data: {
      title: 'Revenue Trend (Last 6 Months)',
      description: '20% growth month-over-month',
      chartType: 'line',
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue ($)',
          data: [10000, 12000, 15000, 13000, 18000, 20000],
          color: 'hsl(var(--chart-1))',
          fill: true
        },
        {
          label: 'Profit ($)',
          data: [5000, 6000, 7500, 6500, 9000, 10000],
          color: 'hsl(var(--chart-2))',
          fill: false
        }
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }
  }
});
```

## Pattern 2: DynamicTable (shadcn Table)

### Implementation

```tsx
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TableComponentData } from '@/convex/protocols/agent-ui';
import { useState } from 'react';

export function DynamicTable({ data, layout }: { 
  data: TableComponentData['data']; 
  layout?: any 
}) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Sort rows
  const sortedRows = data.sortable && sortColumn !== null
    ? [...data.rows].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const direction = sortDirection === 'asc' ? 1 : -1;
        return aVal < bVal ? -direction : aVal > bVal ? direction : 0;
      })
    : data.rows;

  // Paginate
  const pageSize = data.pagination?.pageSize || 10;
  const paginatedRows = data.pagination
    ? sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedRows;

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  return (
    <Card className={layout?.width === 'full' ? 'w-full' : ''}>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        {data.description && <CardDescription>{data.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {data.headers.map((header, i) => (
                <TableHead 
                  key={i}
                  onClick={() => data.sortable && handleSort(i)}
                  className={data.sortable ? 'cursor-pointer hover:bg-muted' : ''}
                >
                  {header}
                  {data.sortable && sortColumn === i && (
                    <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{String(cell)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data.pagination && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {data.pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(data.pagination!.totalPages, p + 1))}
                disabled={currentPage === data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Pattern 3: DynamicForm (react-hook-form)

### Implementation

```tsx
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { FormComponentData } from '@/convex/protocols/agent-ui';

export function DynamicForm({ data, layout, onSubmit }: { 
  data: FormComponentData['data']; 
  layout?: any;
  onSubmit: (data: any) => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const renderField = (field: any) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              {...register(field.name, { required: field.required })}
              defaultValue={field.defaultValue}
            />
            {errors[field.name] && (
              <p className="text-sm text-destructive">This field is required</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select {...register(field.name, { required: field.required })}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return <div key={field.name}>Unsupported field type: {field.type}</div>;
    }
  };

  return (
    <Card className={layout?.width === 'full' ? 'w-full' : ''}>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        {data.description && <CardDescription>{data.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {data.fields.map(renderField)}
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full">
          {data.submitLabel || 'Submit'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## Best Practices

### Layout and Styling

**Responsive Widths:**
```typescript
// Let agent specify width
layout: {
  width: 'full',  // 100% width
  width: 'half',  // 50% width (2 columns)
  width: 'third'  // 33% width (3 columns)
}

// CSS implementation
className={
  layout?.width === 'full' ? 'w-full' :
  layout?.width === 'half' ? 'w-full md:w-1/2' :
  layout?.width === 'third' ? 'w-full md:w-1/3' :
  'w-full'
}
```

**Dark Mode Support:**
```typescript
// Use CSS variables (Tailwind v4)
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>

// Chart colors
stroke={dataset.color || `hsl(var(--chart-${i + 1}))`}
```

### Accessibility

**Keyboard Navigation:**
```tsx
<TableHead
  onClick={() => handleSort(i)}
  onKeyDown={(e) => e.key === 'Enter' && handleSort(i)}
  tabIndex={0}
  role="button"
  aria-label={`Sort by ${header}`}
>
  {header}
</TableHead>
```

**Screen Readers:**
```tsx
<Card role="region" aria-label={data.title}>
  <CardHeader>
    <CardTitle id="chart-title">{data.title}</CardTitle>
  </CardHeader>
  <CardContent aria-labelledby="chart-title">
    {/* Chart */}
  </CardContent>
</Card>
```

### Performance Optimization

**Lazy Loading:**
```tsx
import { lazy, Suspense } from 'react';

const DynamicChart = lazy(() => import('./DynamicChart'));
const DynamicTable = lazy(() => import('./DynamicTable'));

export function GenerativeUIRenderer({ payload }) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      {payload.component === 'chart' && <DynamicChart data={payload.data} />}
      {payload.component === 'table' && <DynamicTable data={payload.data} />}
    </Suspense>
  );
}
```

**Virtualization:**
```tsx
import { FixedSizeList } from 'react-window';

export function VirtualizedTable({ rows }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={rows.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <TableRow style={style}>
          {rows[index].map((cell, i) => (
            <TableCell key={i}>{cell}</TableCell>
          ))}
        </TableRow>
      )}
    </FixedSizeList>
  );
}
```

**Memoization:**
```tsx
import { memo } from 'react';

export const DynamicChart = memo(({ data, layout }) => {
  // Expensive chart rendering
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data && 
         prevProps.layout === nextProps.layout;
});
```

## Security Guidelines

**Input Sanitization:**
```typescript
// Validate all component data
const validateChartData = (data: any): ChartComponentData['data'] => {
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Invalid chart title');
  }
  if (!Array.isArray(data.labels) || data.labels.length > 100) {
    throw new Error('Invalid chart labels');
  }
  // ... more validation
  return data as ChartComponentData['data'];
};
```

**Content Security:**
```typescript
// NEVER render user HTML
❌ <div dangerouslySetInnerHTML={{ __html: data.content }} />

// ALWAYS use structured data
✅ <div>{data.content}</div>
✅ <DynamicChart data={data.chartData} />
```

**Action Validation:**
```typescript
// Validate action parameters before execution
const validateAction = async (actionId: string, params: any) => {
  const action = await db.get(actionId);
  if (!action) throw new Error('Invalid action');
  
  // Check user permissions
  const hasPermission = await checkPermission(userId, action.requiredPermission);
  if (!hasPermission) throw new Error('Unauthorized');
  
  // Validate parameters
  const validParams = validateParams(params, action.paramSchema);
  
  return { action, params: validParams };
};
```

## Summary

**Generative UI Patterns provide:**
- Type-safe component generation
- Security (no HTML injection)
- Flexibility (any UI component)
- Accessibility (WCAG compliant)
- Performance (lazy loading, virtualization)

**Key Benefits:**
- AI agents can create rich UIs
- Frontend renders securely
- Consistent user experience
- Easy to extend with new components
- Full TypeScript support

**Related Documentation:**
- [AG-UI Protocol](./ag-ui-protocol.md)
- [AI SDK Implementation](./ai-sdk-implementation.md)
- [Component Patterns](../things/patterns/frontend/)

