---
title: React Component Pattern
dimension: knowledge
category: patterns
tags: ai, backend, frontend
related_dimensions: connections, groups, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the patterns category.
  Location: one/knowledge/patterns/frontend/react-component-pattern.md
  Purpose: Documents react component pattern
  Related dimensions: connections, groups, things
  For AI agents: Read this to understand react component pattern.
---

# React Component Pattern

**Category:** Frontend
**Type:** UI Component
**Used for:** Building reusable, accessible React components with Effect.ts services and DataProvider pattern

---

## Pattern Overview

Every React component should:
1. Use TypeScript for type safety
2. Fetch data with Effect.ts services via useEffectRunner hook
3. Handle loading and error states
4. Follow accessibility best practices
5. Use shadcn/ui components when available
6. Use DataProvider pattern (backend-agnostic)

## Code Template

```typescript
import { useEffectRunner } from "@/hooks/useEffectRunner";
import { ThingClientService } from "@/services/ThingClientService";
import { ConnectionClientService } from "@/services/ConnectionClientService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Effect } from "effect";

interface EntityListProps {
  type: string;
  groupId?: string;
  status?: string;
}

export function EntityList({ type, groupId, status = "active" }: EntityListProps) {
  const { run, loading, error } = useEffectRunner();
  const [entities, setEntities] = useState<any[]>([]);

  // 1. Fetch data with Effect.ts service on mount
  useEffect(() => {
    const program = Effect.gen(function* () {
      const service = yield* ThingClientService;
      return yield* service.list(type as any, groupId);
    });

    run(program, {
      onSuccess: (results) => setEntities(results || []),
      onError: (err) => console.error("Failed to load:", err)
    });
  }, [type, groupId]);

  // 2. Handle loading state
  if (loading && entities.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // 2b. Handle error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-red-600">Error loading {type}s: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // 3. Handle empty state
  if (entities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No {type}s found</p>
        </CardContent>
      </Card>
    );
  }

  // 4. Handle action (delete)
  const handleDelete = () => {
    const program = Effect.gen(function* () {
      const service = yield* ThingClientService;
      // Backend handles actual deletion
      yield* service.delete("id");
    });

    run(program, {
      onSuccess: () => {
        // Refetch list after delete
        window.location.reload();
      }
    });
  };

  // 5. Render list
  return (
    <div className="space-y-4">
      {entities.map((entity) => (
        <Card key={entity._id}>
          <CardHeader>
            <CardTitle>{entity.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {entity.type}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete()}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## When to Use

- Building list views of entities
- Creating forms for entity creation/editing
- Displaying entity details
- Building dashboards and analytics views

## Best Practices

1. **Use Effect.ts services** - Compose operations with `Effect.gen()`, use `useEffectRunner` for React integration
2. **Use DataProvider pattern** - Never import Convex directly, always use services
3. **Handle all states** - Loading, empty, error, and success states
4. **Use shadcn/ui** - Leverage pre-built accessible components
5. **Type everything** - Define interfaces for props and data
6. **Use groupId for scoping** - Always pass groupId to filter by group/organization
7. **Accessibility first** - Use semantic HTML and ARIA attributes

## Common Mistakes

❌ **Don't:** Import Convex directly (`import { useQuery } from "convex/react"`)
✅ **Do:** Use Effect.ts services with `useEffectRunner` hook

❌ **Don't:** Skip error state handling
✅ **Do:** Show error messages alongside loading/empty states

❌ **Don't:** Duplicate server state in local useState
✅ **Do:** Fetch once with Effect.ts service, store in local state

❌ **Don't:** Use `any` type
✅ **Do:** Define proper TypeScript interfaces

❌ **Don't:** Forget groupId scoping
✅ **Do:** Pass groupId to filter results by organization

❌ **Don't:** Forget accessibility
✅ **Do:** Use semantic HTML and ARIA labels

## Related Patterns

- [Astro Islands Pattern](./astro-islands-pattern.md)
- [Form Handling Pattern](./form-handling-pattern.md)
- [Error Boundary Pattern](./error-boundary-pattern.md)
