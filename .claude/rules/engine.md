# Engine Development Rules

Apply when working with `src/engine/*.ts` files.

## Core Concepts

The Envelope System has these core types:

- **Envelope**: Unit of agent communication
- **Agent**: Executes actions from envelopes
- **Router**: Routes envelopes between agents
- **PromiseTracker**: Tracks async resolution
- **Runtime**: Orchestrates everything

## Envelope Structure

```typescript
interface Envelope {
  id: string;                       // "env-xxx"
  env: {
    envelope: string;               // Self-reference
    action: string;                 // Action to execute
    inputs: Record<string, any>;    // Parameters
  };
  payload: {
    status: "pending" | "resolved" | "rejected";
    results: any | null;
  };
  callback: Envelope | null;        // Chain to next envelope
  metadata?: {
    sender: string;
    receiver: string;
    timestamp: number;
  };
}
```

## Agent Execute Logic

The core execution pattern from the whiteboard:

```typescript
async execute(envelope: Envelope): Promise<void> {
  // 1. Destructure
  const { action, inputs } = envelope.env;
  const { callback } = envelope;

  // 2. Execute action
  let result = await this.actions[action](inputs);

  // 3. Update payload
  envelope.payload.status = "resolved";
  envelope.payload.results = result;

  // 4. Chain to callback if exists
  if (callback) {
    callback.payload.results = { ...result };
    this.substitute(callback, result);
    await this.route(callback);
  }
}
```

## ID Generation

Use consistent ID patterns:

```typescript
// Envelopes
const envId = `env-${crypto.randomUUID().slice(0, 8)}`;

// Promises
const promiseId = `p-${crypto.randomUUID().slice(0, 6)}`;

// Agents (readable names)
const agentId = "agent-processor";
```

## Template Substitution

Replace `{{ }}` patterns in inputs:

```typescript
substitute(envelope: Envelope, previousResults: any): void {
  const inputs = envelope.env.inputs;
  for (const key in inputs) {
    if (typeof inputs[key] === "string" &&
        inputs[key].startsWith("{{") &&
        inputs[key].endsWith("}}")) {
      inputs[key] = previousResults;
    }
  }
}
```

## Event Logging

Log all significant events:

```typescript
this.log("info", `Envelope created: ${envelope.id}`);
this.log("ok", `Promise ${promise.id} resolved`);
this.log("error", `Promise ${promise.id} rejected: ${e.message}`);
```

## Type Safety

Use strict types, no `any` except where interfaces specify:

```typescript
// Good
type ActionHandler = (inputs: Record<string, any>) => any | Promise<any>;

// Bad - untyped
function processEnvelope(env) { ... }
```
