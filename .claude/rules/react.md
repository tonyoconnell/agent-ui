# React 19 Development Rules

Apply when working with `*.tsx` files.

## TypeScript

Always type props with interfaces:

```tsx
// Good
interface AgentCardProps {
  agent: Agent;
  onSelect?: (id: string) => void;
}

export function AgentCard({ agent, onSelect }: AgentCardProps) { ... }

// Bad - no types
export function AgentCard({ agent, onSelect }) { ... }
```

## State Management

Use the right hook for the job:

```tsx
// Simple state
const [isOpen, setIsOpen] = useState(false);

// Complex state with multiple actions
const [state, dispatch] = useReducer(reducer, initialState);

// Async data with Actions (React 19)
const [state, formAction, isPending] = useActionState(asyncFn, initialState);
```

## React 19 Features

Use new React 19 patterns:

```tsx
// Forms with Actions (not onSubmit)
<form action={formAction}>

// Read promises with use()
const data = use(promise); // inside Suspense boundary

// Transitions for non-blocking updates
const [isPending, startTransition] = useTransition();

// Optimistic updates
const [optimistic, addOptimistic] = useOptimistic(state, updateFn);

// ref as prop (no forwardRef needed)
function Input({ ref, ...props }) { ... }
```

## Component Structure

```tsx
// 1. Imports
import { useState } from 'react';
import { Card } from '@/components/ui/card';

// 2. Types
interface Props { ... }

// 3. Component
export function ComponentName({ prop1, prop2 }: Props) {
  // 3a. Hooks
  const [state, setState] = useState();

  // 3b. Handlers
  const handleClick = () => { ... };

  // 3c. Render
  return ( ... );
}
```

## Exports

Use named exports for components:

```tsx
// Good
export function AgentCard() { ... }

// Avoid default exports
export default function AgentCard() { ... }
```

## Styling

Use Tailwind with `cn()` utility:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />
```
