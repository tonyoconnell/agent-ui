---
title: Component Template
dimension: knowledge
category: patterns
tags: backend, frontend
related_dimensions: groups, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the patterns category.
  Location: one/knowledge/patterns/frontend/component-template.md
  Purpose: Documents pattern: react component template
  Related dimensions: groups, things
  For AI agents: Read this to understand component template.
---

# Pattern: React Component Template

**Category:** Frontend
**Context:** When creating React components with shadcn/ui for interactive features
**Problem:** Need consistent component structure that uses DataProvider pattern, handles loading/error states, and follows accessibility guidelines

## Solution

Use shadcn/ui components, Effect.ts services with DataProvider pattern for backend-agnostic data, proper loading/error states, and TypeScript for type safety.

## Template

```tsx
// src/components/features/{EntityName}List.tsx
import { useEffectRunner } from "@/hooks/useEffectRunner";
import { ThingClientService } from "@/services/ThingClientService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Effect } from "effect";

interface {EntityName}ListProps {
  type: string;
  groupId?: string;
  status?: "draft" | "active" | "archived";
  limit?: number;
}

export function {EntityName}List({ type, groupId, status, limit }: {EntityName}ListProps) {
  const { run, loading, error } = useEffectRunner();
  const [items, setItems] = useState<any[]>([]);

  // Fetch data on mount via Effect.ts service
  useEffect(() => {
    const program = Effect.gen(function* () {
      const service = yield* ThingClientService;
      return yield* service.list(type as any, groupId);
    });

    run(program, {
      onSuccess: (results) => setItems(results || [])
    });
  }, [type, groupId]);

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load items: {error}</AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No {type}s found. Create your first {type} to get started.
        </AlertDescription>
        <Button asChild className="mt-4">
          <a href={`/${type}s/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create {type}
          </a>
        </Button>
      </Alert>
    );
  }

  // Success state
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{type}s</h2>
        <Button asChild>
          <a href={`/${type}s/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New {type}
          </a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item._id}>
            <CardHeader>
              <CardTitle>{item.name || "Untitled"}</CardTitle>
              <CardDescription>
                {item.properties?.description || ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Status: {item.status || "unknown"}
                </span>
                <Button asChild variant="outline" size="sm">
                  <a href={`/${type}s/${item._id}`}>View</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Variables

- `{EntityName}` - PascalCase entity name (e.g., "Course", "Lesson")
- `{entity}` - Lowercase entity name (e.g., "course", "lesson")
- `{entities}` - Plural lowercase (e.g., "courses", "lessons")

## Usage

1. Copy template to `src/components/features/{EntityName}List.tsx`
2. Replace all `{EntityName}`, `{entity}`, `{entities}`
3. Import shadcn/ui components as needed
4. Customize card content for entity-specific fields
5. Add filtering/sorting UI if needed

## Example (Course List)

```tsx
// src/components/features/CourseList.tsx
import { useEffectRunner } from "@/hooks/useEffectRunner";
import { ThingClientService } from "@/services/ThingClientService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Effect } from "effect";

interface CourseListProps {
  groupId?: string;
}

export function CourseList({ groupId }: CourseListProps) {
  const { run, loading } = useEffectRunner();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const program = Effect.gen(function* () {
      const service = yield* ThingClientService;
      return yield* service.list("course" as any, groupId);
    });

    run(program, {
      onSuccess: (results) => setCourses(results || [])
    });
  }, [groupId]);

  if (loading && courses.length === 0) {
    return <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
    </div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {courses.map((course) => (
        <Card key={course._id}>
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>{course.name}</CardTitle>
              <Badge>{course.properties?.level}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{course.properties?.description}</p>
            <div className="mt-4 flex justify-between">
              <span className="font-bold">${course.properties?.price}</span>
              <Button asChild size="sm">
                <a href={`/courses/${course._id}`}>View</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Loading States

Always handle three states:

1. **Loading** (`data === undefined`) → Show `Skeleton`
2. **Empty** (`data.length === 0`) → Show empty state with CTA
3. **Success** (`data.length > 0`) → Show data

## Common Mistakes

- **Mistake:** Not handling loading state
  - **Fix:** Check if `data === undefined` and show skeleton
- **Mistake:** Not handling empty state
  - **Fix:** Show helpful message and CTA when no data
- **Mistake:** Not using shadcn/ui components
  - **Fix:** Use Card, Button, etc. for consistency
- **Mistake:** Hardcoding href paths
  - **Fix:** Use template literals with entity IDs
- **Mistake:** Assuming properties exist
  - **Fix:** Use optional chaining (`properties?.field`)

## Related Patterns

- **form-template.md** - Forms for creating/editing
- **page-template.md** - Pages that use these components
- **shadcn/ui docs** - Component API reference
