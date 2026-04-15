---
title: Frontend Effects
dimension: things
category: plans
tags: ai, backend, frontend, ui
related_dimensions: events, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/frontend-effects.md
  Purpose: Documents frontend effects.ts implementation plan
  Related dimensions: events, people
  For AI agents: Read this to understand frontend effects.
---

# Frontend Effects.ts Implementation Plan

**Comprehensive guide for building backend-agnostic frontend services with Effect.ts, React, and Astro**

**Version:** 1.0.0
**Status:** Planning Ready
**Stack:** Astro 5 + React 19 + Effect.ts + DataProvider Interface
**Target:** Type-safe, composable, testable frontend components that work with ANY backend

---

## Executive Summary

This document focuses exclusively on **frontend Effect.ts patterns** - how to structure the web layer (`/web/src/`) to be completely backend-agnostic while maintaining type safety, composability, and testability.

**Key Principle:** Frontend never knows about backend implementation. It only talks to DataProvider interface.

```
┌─────────────────────────────────────────────────┐
│          FRONTEND (Effect.ts Services)          │
│  • Astro pages (SSR)                            │
│  • React components (islands)                   │
│  • Effect services (type-safe business logic)   │
│  • React hooks (useEffectRunner, useService)    │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓ DataProvider Interface
       (Backend-agnostic contract)
```

---

## Architecture: Three Frontend Layers

### Layer 1: Presentation (Astro Pages + React Components)

**What:** UI rendering, user interaction, form handling

**Example:**

```tsx
// src/pages/courses/[courseId].astro
---
import CourseDetail from "@/components/courses/CourseDetail";
import { CourseService } from "@/services/CourseService";

const courseId = Astro.params.courseId;
// Fetch server-side
const course = await CourseService.get(courseId);
---

<Layout>
  <CourseDetail client:load course={course} />
</Layout>
```

### Layer 2: Business Logic Services (Effect.ts)

**What:** Generic, backend-agnostic operations using DataProvider

**Example:**

```typescript
// src/services/CourseService.ts
import { Effect } from "effect";
import { DataProvider } from "@/providers/DataProvider";

export class CourseService extends Effect.Service<CourseService>()(...) {
  effect: Effect.gen(function* () {
    const provider = yield* DataProvider;  // Backend-agnostic!
    return {
      get: (id) => provider.things.get(id),
      list: (groupId) => provider.things.list({ type: "course", groupId })
    };
  })
}
```

### Layer 3: Data Access (DataProvider Interface)

**What:** Universal contract that ANY backend must implement

**Example:**

```typescript
// src/providers/DataProvider.ts
export interface DataProvider {
  groups: { get; list; update };
  people: { get; list; create };
  things: { get; list; create; update; delete }; // Works with ANY backend
  connections: { create; getRelated };
  events: { log; query };
  knowledge: { search };
}
```

---

## Part 1: Frontend Effect.ts Services (Cycle 51-60 from todo-effects)

### Service Definition Pattern

```typescript
// src/services/ThingService.ts
import { Effect, Context, Layer } from "effect";
import { DataProvider } from "@/providers/DataProvider";

// Define error types (tagged unions)
class ThingNotFoundError extends Data.TaggedError("ThingNotFoundError")<{
  thingId: string;
}> {}

class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

// Define service interface
class ThingService extends Context.Tag("ThingService")<
  ThingService,
  {
    readonly get: (id: string) => Effect.Effect<Thing, ThingNotFoundError>;
    readonly list: (
      type: ThingType,
      groupId: string,
    ) => Effect.Effect<Thing[], Error>;
    readonly create: (
      input: CreateThingInput,
    ) => Effect.Effect<string, ValidationError>;
    readonly update: (
      id: string,
      updates: Partial<Thing>,
    ) => Effect.Effect<void, Error>;
    readonly delete: (id: string) => Effect.Effect<void, ThingNotFoundError>;
  }
>() {}

// Implement with Effect
export const ThingServiceLive = Layer.effect(
  ThingService,
  Effect.gen(function* () {
    const provider = yield* DataProvider; // Inject provider

    return {
      get: (id: string) =>
        Effect.gen(function* () {
          const thing = yield* provider.things.get(id);
          return thing;
        }),

      list: (type: ThingType, groupId: string) =>
        Effect.gen(function* () {
          const things = yield* provider.things.list({
            type,
            organizationId: groupId,
          });
          return things;
        }),

      create: (input: CreateThingInput) =>
        Effect.gen(function* () {
          // Validate
          const validated = yield* validateThingInput(input);

          // Create via provider
          const thingId = yield* provider.things.create({
            type: input.type,
            name: input.name,
            organizationId: input.groupId,
            properties: input.properties,
          });

          // Log event
          yield* provider.events.log({
            type: "thing_created",
            actorId: input.actorId,
            targetId: thingId,
            organizationId: input.groupId,
          });

          return thingId;
        }),

      update: (id: string, updates: Partial<Thing>) =>
        Effect.gen(function* () {
          yield* provider.things.update(id, updates);
          yield* provider.events.log({
            type: "thing_updated",
            targetId: id,
            organizationId: updates.groupId,
          });
        }),

      delete: (id: string) =>
        Effect.gen(function* () {
          yield* provider.things.delete(id);
          yield* provider.events.log({
            type: "thing_deleted",
            targetId: id,
          });
        }),
    };
  }),
);

// Export service class
export { ThingService };
```

### Complete Services (Cycle 51-60)

```typescript
// src/services/index.ts
export { ThingService, ThingServiceLive } from "./ThingService";
export { ConnectionService, ConnectionServiceLive } from "./ConnectionService";
export { EventService, EventServiceLive } from "./EventService";
export { KnowledgeService, KnowledgeServiceLive } from "./KnowledgeService";
export { GroupService, GroupServiceLive } from "./GroupService";
export { PeopleService, PeopleServiceLive } from "./PeopleService";
```

---

## Part 2: React Hooks Integration (Cycle 52-60)

### useEffectRunner Hook (Core Pattern)

**Purpose:** Run Effect programs inside React components

```typescript
// src/hooks/useEffectRunner.ts
import { useState, useCallback } from "react";
import { Effect } from "effect";
import { ClientLayer } from "@/services/ClientLayer";

interface UseEffectRunnerOptions<A> {
  onSuccess?: (result: A) => void;
  onError?: (error: unknown) => void;
  onFinally?: () => void;
}

export function useEffectRunner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(
    async <A, E>(
      effect: Effect.Effect<A, E>,
      options?: UseEffectRunnerOptions<A>,
    ): Promise<A | null> => {
      setLoading(true);
      setError(null);

      try {
        // Run effect with client layer (services + provider)
        const result = await Effect.runPromise(
          effect.pipe(Effect.provide(ClientLayer)),
        );

        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        setError(err);
        options?.onError?.(err);
        return null;
      } finally {
        setLoading(false);
        options?.onFinally?.();
      }
    },
    [],
  );

  return { run, loading, error };
}
```

### useThingService Hook (Generic CRUD)

```typescript
// src/hooks/useThingService.ts
import { useState, useEffect } from "react";
import { Effect } from "effect";
import { ThingService } from "@/services/ThingService";
import { useEffectRunner } from "./useEffectRunner";

export function useThingService(type: ThingType, groupId: string) {
  const [things, setThings] = useState<Thing[]>([]);
  const { run, loading } = useEffectRunner();

  // Load things on mount
  useEffect(() => {
    const program = Effect.gen(function* () {
      const service = yield* ThingService;
      return yield* service.list(type, groupId);
    });

    run(program, { onSuccess: setThings });
  }, [type, groupId]);

  // Create thing
  const create = (input: CreateThingInput) =>
    Effect.gen(function* () {
      const service = yield* ThingService;
      const id = yield* service.create(input);

      // Refresh list
      const updated = yield* service.list(type, groupId);
      setThings(updated);

      return id;
    });

  // Update thing
  const update = (id: string, updates: Partial<Thing>) =>
    Effect.gen(function* () {
      const service = yield* ThingService;
      yield* service.update(id, updates);

      // Refresh list
      const updated = yield* service.list(type, groupId);
      setThings(updated);
    });

  return { things, loading, create, update };
}
```

### useService Hook (Generic Service Access)

```typescript
// src/hooks/useService.ts
import { useCallback } from "react";
import { Effect } from "effect";
import { ClientLayer } from "@/services/ClientLayer";

/**
 * Run any Effect service in React
 *
 * Usage:
 * const thingService = useService(ThingService);
 * const course = thingService.get(courseId);
 */
export function useService<S extends Effect.Service<any, any>>(service: S) {
  return useCallback(
    (operation: (svc: S) => Effect.Effect<any, any>) => {
      const program = Effect.gen(function* () {
        const svc = yield* service;
        return yield* operation(svc);
      });

      return Effect.runPromise(program.pipe(Effect.provide(ClientLayer)));
    },
    [service],
  );
}
```

---

## Part 3: Service Layer Composition (Cycle 53-60)

### ClientLayer (Dependency Injection)

```typescript
// src/services/ClientLayer.ts
import { Layer } from "effect";
import { ThingServiceLive } from "./ThingService";
import { ConnectionServiceLive } from "./ConnectionService";
import { EventServiceLive } from "./EventService";
import { KnowledgeServiceLive } from "./KnowledgeService";
import { GroupServiceLive } from "./GroupService";
import { PeopleServiceLive } from "./PeopleService";
import { convexProvider } from "@/providers/convex";

// Combine all services with provider
export const ClientLayer = Layer.mergeAll(
  convexProvider({ url: import.meta.env.PUBLIC_CONVEX_URL }),
  ThingServiceLive,
  ConnectionServiceLive,
  EventServiceLive,
  KnowledgeServiceLive,
  GroupServiceLive,
  PeopleServiceLive,
);
```

### Service Composition Example

```typescript
// src/services/CourseService.ts - Domain-specific service
import { Effect, Context, Layer } from "effect";
import { ThingService } from "./ThingService";
import { ConnectionService } from "./ConnectionService";

class CourseService extends Context.Tag("CourseService")<
  CourseService,
  {
    readonly createWithInstructor: (
      courseData: CreateCourseInput,
      instructorId: string,
      groupId: string,
    ) => Effect.Effect<string, Error>;
  }
>() {}

export const CourseServiceLive = Layer.effect(
  CourseService,
  Effect.gen(function* () {
    const thingService = yield* ThingService; // Dependency!
    const connectionService = yield* ConnectionService;

    return {
      createWithInstructor: (courseData, instructorId, groupId) =>
        Effect.gen(function* () {
          // 1. Create course (thing)
          const courseId = yield* thingService.create({
            type: "course",
            name: courseData.name,
            groupId,
            properties: courseData.properties,
          });

          // 2. Link instructor (connection)
          yield* connectionService.create({
            fromPersonId: instructorId,
            toThingId: courseId,
            relationshipType: "teaches",
            groupId,
          });

          return courseId;
        }),
    };
  }),
);
```

---

## Part 4: Astro Integration (Cycle 41-43)

### Server-Side Data Fetching

```astro
---
// src/pages/courses/index.astro
import Layout from "@/layouts/Layout.astro";
import CourseList from "@/components/CourseList";
import { ThingService } from "@/services/ThingService";
import { ClientLayer } from "@/services/ClientLayer";
import { Effect } from "effect";

// Server-side: Fetch data with Effect
const groupId = Astro.locals.user?.groupId;
if (!groupId) {
  return Astro.redirect("/login");
}

// Run Effect program on server
const courses = await Effect.runPromise(
  Effect.gen(function* () {
    const service = yield* ThingService;
    return yield* service.list("course", groupId);
  }).pipe(Effect.provide(ClientLayer))
);
---

<Layout>
  <!-- Pass data to client component -->
  <CourseList client:load initialCourses={courses} groupId={groupId} />
</Layout>
```

### Content Layout Wrapper (Astro Collections)

```astro
---
// src/layouts/BlogPost.astro
import BaseLayout from "./BaseLayout.astro";
import { KnowledgeService } from "@/services/KnowledgeService";
import { Effect } from "effect";
import { ClientLayer } from "@/services/ClientLayer";

interface Props {
  frontmatter: any;
}

const { frontmatter } = Astro.props;

// Enrich content with dynamic data
const relatedArticles = await Effect.runPromise(
  Effect.gen(function* () {
    const knowledgeService = yield* KnowledgeService;
    return yield* knowledgeService.search(frontmatter.title);
  }).pipe(Effect.provide(ClientLayer))
);
---

<BaseLayout title={frontmatter.title}>
  <article>
    <h1>{frontmatter.title}</h1>
    <slot /> <!-- Markdown content -->

    {relatedArticles.length > 0 && (
      <aside>
        <h3>Related Articles</h3>
        <ul>
          {relatedArticles.map((article) => (
            <li><a href={article.url}>{article.title}</a></li>
          ))}
        </ul>
      </aside>
    )}
  </article>
</BaseLayout>
```

---

## Part 5: Frontend Components Architecture (Cycle 54-60)

### Component Integration Layer

```tsx
// src/context/EffectContext.tsx
import { createContext, useContext, ReactNode } from "react";
import { Layer } from "effect";
import { ClientLayer } from "@/services/ClientLayer";

interface EffectProviderProps {
  layer?: Layer<any>;
  children: ReactNode;
}

const EffectLayerContext = createContext<Layer<any>>(ClientLayer);

export function EffectProvider({
  layer = ClientLayer,
  children,
}: EffectProviderProps) {
  return (
    <EffectLayerContext.Provider value={layer}>
      {children}
    </EffectLayerContext.Provider>
  );
}

export function useEffectLayer() {
  return useContext(EffectLayerContext);
}
```

### Interactive Component Example

```tsx
// src/components/CreateCourseForm.tsx
import { useState } from "react";
import { useEffectRunner } from "@/hooks/useEffectRunner";
import { ThingService } from "@/services/ThingService";
import { Effect } from "effect";

interface CreateCourseFormProps {
  groupId: string;
  onSuccess?: (courseId: string) => void;
}

export function CreateCourseForm({
  groupId,
  onSuccess,
}: CreateCourseFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
  });

  const { run, loading, error } = useEffectRunner();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Define Effect program
    const program = Effect.gen(function* () {
      const thingService = yield* ThingService;

      const courseId = yield* thingService.create({
        type: "course",
        name: formData.name,
        groupId,
        properties: {
          description: formData.description,
          price: formData.price,
        },
        actorId: "current-user-id", // From context
      });

      return courseId;
    });

    // Run program
    const courseId = await run(program);

    if (courseId) {
      setFormData({ name: "", description: "", price: 0 });
      onSuccess?.(courseId);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Course name"
        required
      />
      <textarea
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder="Description"
      />
      <input
        type="number"
        value={formData.price}
        onChange={(e) =>
          setFormData({ ...formData, price: parseFloat(e.target.value) })
        }
        placeholder="Price"
      />

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Course"}
      </button>

      {error && <div className="error">{String(error)}</div>}
    </form>
  );
}
```

---

## Part 6: Error Handling (Frontend-Specific)

### Domain Error Types

```typescript
// src/lib/errors.ts
import { Data } from "effect";

// Thing errors
class ThingNotFoundError extends Data.TaggedError("ThingNotFoundError")<{
  thingId: string;
}> {}

class InvalidThingTypeError extends Data.TaggedError("InvalidThingTypeError")<{
  type: string;
}> {}

class ThingCreationError extends Data.TaggedError("ThingCreationError")<{
  reason: string;
}> {}

// Connection errors
class ConnectionAlreadyExistsError extends Data.TaggedError(
  "ConnectionAlreadyExistsError",
)<{
  fromId: string;
  toId: string;
}> {}

// Validation errors
class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

// Infrastructure errors (from provider)
class ProviderError extends Data.TaggedError("ProviderError")<{
  provider: string;
  message: string;
}> {}

// Network errors
class NetworkError extends Data.TaggedError("NetworkError")<{
  statusCode: number;
  message: string;
}> {}

export type FrontendError =
  | ThingNotFoundError
  | InvalidThingTypeError
  | ThingCreationError
  | ConnectionAlreadyExistsError
  | ValidationError
  | ProviderError
  | NetworkError;

// Human-friendly error messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof ThingNotFoundError) {
    return `Course not found (${error.thingId})`;
  }
  if (error instanceof ValidationError) {
    return `${error.field}: ${error.message}`;
  }
  if (error instanceof NetworkError) {
    return `Connection failed (${error.statusCode})`;
  }
  return "Something went wrong";
}
```

### Error Handling in Components

```tsx
// src/hooks/useThingWithErrorHandling.ts
import { useState } from "react";
import { Effect } from "effect";
import { ThingService } from "@/services/ThingService";
import { useEffectRunner } from "./useEffectRunner";

export function useThingWithErrorHandling(thingId: string) {
  const [thing, setThing] = useState<Thing | null>(null);
  const { run, error, loading } = useEffectRunner();

  const loadThing = () => {
    const program = Effect.gen(function* () {
      const service = yield* ThingService;
      return yield* service.get(thingId).pipe(
        Effect.catchTag(
          "ThingNotFoundError",
          (error) => Effect.succeed(null as Thing | null), // Graceful fallback
        ),
        Effect.catchAll((error) => {
          console.error("Error loading thing:", error);
          return Effect.succeed(null);
        }),
      );
    });

    run(program, { onSuccess: setThing });
  };

  return { thing, loading, error, loadThing };
}
```

---

## Part 7: State Management with Effect (Cycle 55-57)

### Form State with Effect Validation

```typescript
// src/hooks/useForm.ts
import { useState, useCallback } from "react";
import { Effect, Schema } from "effect";

interface UseFormOptions<T> {
  schema: Schema.Schema<T>;
  onSubmit: (data: T) => Promise<void>;
}

export function useForm<T>(options: UseFormOptions<T>) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback(
    async (data: Partial<T>): Promise<T | null> => {
      const program = Effect.gen(function* () {
        try {
          return yield* Schema.decodeUnknown(options.schema)(data);
        } catch (error) {
          // Extract field errors
          const fieldErrors: Record<string, string> = {};
          // Parse effect validation errors...
          setErrors(fieldErrors);
          return null;
        }
      });

      return await Effect.runPromise(program);
    },
    [options.schema],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      const validated = await validate(formData);
      if (validated) {
        try {
          await options.onSubmit(validated);
        } catch (error) {
          setErrors({ submit: String(error) });
        }
      }

      setIsSubmitting(false);
    },
    [formData, validate, options],
  );

  return {
    formData,
    setFormData,
    errors,
    isSubmitting,
    handleSubmit,
  };
}
```

### Optimistic Updates Pattern

```tsx
// src/hooks/useOptimisticUpdate.ts
import { useState, useCallback } from "react";
import { Effect } from "effect";
import { useEffectRunner } from "./useEffectRunner";

interface UseOptimisticUpdateOptions<T> {
  initial: T;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown, rollback: T) => void;
}

export function useOptimisticUpdate<T>(options: UseOptimisticUpdateOptions<T>) {
  const [data, setData] = useState(options.initial);
  const [isUpdating, setIsUpdating] = useState(false);
  const { run } = useEffectRunner();

  const update = useCallback(
    async (effect: Effect.Effect<T, any>, optimisticData: T) => {
      const rollback = data;

      // Optimistic update
      setData(optimisticData);
      setIsUpdating(true);

      const result = await run(effect);

      if (result) {
        setData(result);
        options.onSuccess?.(result);
      } else {
        // Rollback on error
        setData(rollback);
        options.onError?.(new Error("Update failed"), rollback);
      }

      setIsUpdating(false);
    },
    [data, run, options],
  );

  return { data, isUpdating, update };
}
```

---

## Part 8: Testing Frontend Services (Cycle 58-60)

### Mock Services for Testing

```typescript
// src/services/__mocks__/ThingService.ts
import { Layer } from "effect";
import { ThingService } from "../ThingService";

export const MockThingService = Layer.succeed(ThingService, {
  get: (id) =>
    Effect.succeed({
      _id: id,
      type: "course",
      name: "Test Course",
      properties: {},
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),

  list: (type, groupId) =>
    Effect.succeed([
      {
        _id: "test-1",
        type,
        name: "Test Course 1",
        properties: {},
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]),

  create: (input) => Effect.succeed("new-id-123"),
  update: (id, updates) => Effect.unit,
  delete: (id) => Effect.unit,
});
```

### Component Testing with React Testing Library

```typescript
// src/components/__tests__/CreateCourseForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CreateCourseForm } from "../CreateCourseForm";
import { EffectProvider } from "@/context/EffectContext";
import { Layer } from "effect";
import { MockThingService } from "@/services/__mocks__/ThingService";

describe("CreateCourseForm", () => {
  it("should create course on submit", async () => {
    const onSuccess = vi.fn();
    const mockLayer = Layer.mergeAll(MockThingService);

    render(
      <EffectProvider layer={mockLayer}>
        <CreateCourseForm groupId="test-group" onSuccess={onSuccess} />
      </EffectProvider>
    );

    // Fill form
    fireEvent.change(screen.getByPlaceholderText("Course name"), {
      target: { value: "New Course" },
    });
    fireEvent.change(screen.getByPlaceholderText("Description"), {
      target: { value: "Test description" },
    });
    fireEvent.change(screen.getByPlaceholderText("Price"), {
      target: { value: "99" },
    });

    // Submit
    fireEvent.click(screen.getByText("Create Course"));

    // Verify success callback
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith("new-id-123");
    });
  });

  it("should display error on failure", async () => {
    // Use error mock layer...
    // Verify error is displayed
  });
});
```

---

## Part 9: Type Safety and Validation (Cycle 59-60)

### Frontend Type Safety

```typescript
// src/types/domain.ts
import { Schema } from "effect";

// Define schemas with Effect
export const ThingSchema = Schema.Struct({
  _id: Schema.String,
  type: Schema.String,
  name: Schema.String,
  properties: Schema.Record(Schema.String, Schema.Unknown),
  status: Schema.Literal("draft", "active", "archived"),
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
});

export type Thing = Schema.Schema.Type<typeof ThingSchema>;

export const CreateThingInputSchema = Schema.Struct({
  type: Schema.String,
  name: Schema.String,
  groupId: Schema.String,
  properties: Schema.Record(Schema.String, Schema.Unknown),
});

export type CreateThingInput = Schema.Schema.Type<
  typeof CreateThingInputSchema
>;

// Validation helper
export const validateThing = (data: unknown) =>
  Schema.decodeUnknown(ThingSchema)(data);

export const validateCreateThingInput = (data: unknown) =>
  Schema.decodeUnknown(CreateThingInputSchema)(data);
```

### Runtime Type Checking

```typescript
// src/hooks/useValidatedData.ts
import { useState, useEffect } from "react";
import { Schema } from "effect";

export function useValidatedData<T>(data: unknown, schema: Schema.Schema<T>) {
  const [validated, setValidated] = useState<T | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    Schema.decodeUnknown(schema)(data)
      .then((result) => {
        setValidated(result);
        setValidationError(null);
      })
      .catch((error) => {
        setValidated(null);
        setValidationError(String(error));
      });
  }, [data, schema]);

  return { validated, validationError };
}
```

---

## Part 10: Performance Optimization (Cycle 56-57)

### Memoization with Effect

```typescript
// src/hooks/useMemoEffect.ts
import { useMemo } from "react";
import { Effect } from "effect";
import { ClientLayer } from "@/services/ClientLayer";

export function useMemoEffect<A, E>(effect: Effect.Effect<A, E>, deps: any[]) {
  return useMemo(
    () => Effect.runPromise(effect.pipe(Effect.provide(ClientLayer))),
    deps,
  );
}
```

### Lazy Loading Components

```tsx
// src/components/LazyThingList.tsx
import { Suspense, lazy } from "react";

const ThingList = lazy(() => import("./ThingList"));

export function LazyThingListWrapper({ groupId }: { groupId: string }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThingList groupId={groupId} />
    </Suspense>
  );
}
```

### Request Deduplication

```typescript
// src/lib/requestCache.ts
import { Effect } from "effect";

class RequestCache {
  private cache = new Map<string, Promise<any>>();

  get<A>(key: string, effect: Effect.Effect<A, any>): Promise<A> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const promise = Effect.runPromise(effect);
    this.cache.set(key, promise);

    // Clear cache after 30 seconds
    setTimeout(() => this.cache.delete(key), 30000);

    return promise;
  }
}

export const requestCache = new RequestCache();
```

---

## Directory Structure

```
web/
├── src/
│   ├── pages/                      # Astro pages (SSR)
│   │   ├── index.astro
│   │   ├── courses/
│   │   │   ├── index.astro
│   │   │   └── [courseId].astro
│   │   └── blog/
│   │       └── [...slug].astro
│   │
│   ├── components/                 # React components (islands)
│   │   ├── CreateCourseForm.tsx
│   │   ├── CourseDetail.tsx
│   │   ├── ThingList.tsx
│   │   └── __tests__/
│   │       └── CreateCourseForm.test.tsx
│   │
│   ├── services/                   # Effect.ts services
│   │   ├── index.ts
│   │   ├── ClientLayer.ts          # DI composition
│   │   ├── ThingService.ts         # Generic CRUD
│   │   ├── ConnectionService.ts    # Relationships
│   │   ├── EventService.ts         # Audit trail
│   │   ├── KnowledgeService.ts     # Search
│   │   ├── GroupService.ts
│   │   ├── PeopleService.ts
│   │   ├── CourseService.ts        # Domain-specific
│   │   └── __mocks__/
│   │       └── ThingService.ts
│   │
│   ├── providers/                  # DataProvider implementations
│   │   ├── DataProvider.ts         # Interface
│   │   ├── convex/
│   │   │   └── ConvexProvider.ts
│   │   ├── wordpress/
│   │   │   └── WordPressProvider.ts
│   │   └── supabase/
│   │       └── SupabaseProvider.ts
│   │
│   ├── hooks/                      # React hooks
│   │   ├── useEffectRunner.ts      # Core
│   │   ├── useThingService.ts      # CRUD
│   │   ├── useService.ts           # Generic
│   │   ├── useForm.ts              # Forms
│   │   ├── useOptimisticUpdate.ts  # Optimism
│   │   └── useMemoEffect.ts        # Caching
│   │
│   ├── context/                    # React context
│   │   ├── EffectContext.tsx       # Effect layer
│   │   ├── UserContext.tsx         # Current user
│   │   └── GroupContext.tsx        # Current group
│   │
│   ├── lib/                        # Utilities
│   │   ├── errors.ts               # Error types
│   │   ├── requestCache.ts         # Caching
│   │   └── validation.ts           # Schema validation
│   │
│   ├── types/                      # TypeScript types
│   │   ├── domain.ts               # Domain types with schemas
│   │   └── index.ts
│   │
│   └── layouts/                    # Astro layouts
│       ├── Layout.astro
│       └── BlogPost.astro
│
├── astro.config.ts                 # Provider config
├── tsconfig.json
├── package.json
└── test/                           # E2E tests
    ├── auth.test.ts
    └── courses.test.ts
```

---

## Migration Path: From Current Convex to Backend-Agnostic

### Phase 1: Create DataProvider Interface (3 days)

- Define interface in `/web/src/providers/DataProvider.ts`
- No component changes needed
- Just type definitions

### Phase 2: Implement ConvexProvider (3-5 days)

- Wrap existing Convex client
- Implement all DataProvider methods
- Keep existing Convex integration working

### Phase 3: Build Effect.ts Services (3-5 days)

- Create `ThingService`, `ConnectionService`, etc.
- Services delegate to DataProvider
- No component changes yet

### Phase 4: Create React Hooks (2-3 days)

- Implement `useEffectRunner`, `useThingService`, etc.
- Provide as alternatives to Convex hooks
- Both can coexist

### Phase 5: Migrate Components (2-4 weeks)

- Page by page, replace Convex hooks with Effect services
- Each component still works during migration
- Minimal risk - can rollback any page

### Phase 6: Remove Convex Dependencies (1-2 days)

- Remove `convex` from `package.json`
- Delete `/web/convex/` directory
- Frontend is now backend-agnostic!

---

## Key Principles

✅ **Backend-Agnostic:** Frontend never imports backend-specific code
✅ **Type-Safe:** Full TypeScript + Effect.ts error channels
✅ **Composable:** Services combine via Layer.mergeAll
✅ **Testable:** Mock layers, not databases
✅ **Simple:** DataProvider interface is small, learnable contract
✅ **Gradual:** Migrate page by page, no big-bang rewrite
✅ **Zero-Downtime:** Existing system keeps working during migration

---

## Summary

This document provides a complete roadmap for building a **frontend service layer with Effect.ts** that is:

1. **Completely decoupled from backend** - uses DataProvider interface
2. **Type-safe** - full TypeScript + Effect error tracking
3. **Composable** - services build on each other
4. **Testable** - mock layers for unit tests
5. **Production-ready** - patterns from 14.ai + effect.ts community

The architecture enables:

- **Organizations to choose their backend** (Convex, WordPress, Supabase, Notion, etc.)
- **Developers to work without backend knowledge** (just learn DataProvider interface)
- **Gradual migration** from direct Convex integration
- **Multi-backend support** (route different data types to different backends)
- **Zero-downtime deployment** (pages migrate independently)

---

## Next Steps

1. **Read:** `/one/connections/effect-patterns.md` (Effect.ts fundamentals)
2. **Review:** `/one/knowledge/ontology.md` (6-dimension data model)
3. **Implement:** Phase 1-2 (DataProvider + ConvexProvider)
4. **Test:** Verify existing auth tests still pass
5. **Scale:** Add services, migrate components gradually

**Goal:** Complete backend-agnostic frontend in 4-6 weeks with zero downtime.

---

**Built with type safety, clarity, and infinite flexibility in mind.**
_— ONE Platform Engineering Team_
