# AI Training & Inference

The same 6 dimensions. Same 220 lines. Now it learns.

## The Mapping

| Dimension | Training | Inference |
|-----------|----------|-----------|
| **Groups** | Experiments, runs | Tenants, use cases |
| **Actors** | Models, adapters, experts | Models, LoRAs, agents |
| **Things** | Datasets, prompts | Queries, contexts |
| **Flows** | Data → model routing | Task → expert routing |
| **Events** | Training steps, evals | Completions, feedback |
| **Knowledge** | Converged patterns | Proven routes |

## Training as Flows

```typescript
const w = world()

// Group = experiment
w.group('exp-001', 'experiment')

// Actors = model variants
w.actor('base-model', 'model')
w.actor('lora-coding', 'adapter')
w.actor('lora-writing', 'adapter')

// Things = training data
w.thing('dataset-code', 'dataset')
w.thing('dataset-prose', 'dataset')

// Training = flows from data to models
function trainStep(data: string, model: string, loss: number) {
  const quality = 1 / (1 + loss)  // Lower loss = higher quality
  w.flow(data, model).strengthen(quality)
}

// After training
trainStep('dataset-code', 'lora-coding', 0.02)   // Good loss → strong flow
trainStep('dataset-code', 'base-model', 0.15)   // Worse loss → weaker flow
trainStep('dataset-prose', 'lora-writing', 0.03) // Good loss → strong flow

// Best model for code emerges
w.best('adapter', { group: 'exp-001' })  // → 'lora-coding'
```

## Inference as Routing

```typescript
const w = world()

// Group = production
w.group('prod', 'deployment')

// Actors = deployed models
w.actor('claude', 'llm')
w.actor('gpt4', 'llm')
w.actor('llama', 'llm')
w.actor('code-expert', 'adapter')
w.actor('math-expert', 'adapter')

// Inference = route task to best model
async function infer(task: string, prompt: string) {
  const taskType = classify(task)
  
  // Check if we have a proven route
  if (w.confidence(taskType) > 0.7) {
    // Skip routing model — follow the flow
    const model = w.best(taskType)
    return execute(model, prompt)
  }
  
  // No strong flow — use router model
  const model = await routerModel.decide(task)
  return execute(model, prompt)
}

// After execution, record outcome
function recordOutcome(task: string, model: string, quality: number) {
  quality > 0.7
    ? w.flow(task, model).strengthen(quality)
    : w.flow(task, model).resist(1 - quality)
}
```

## Mixture of Experts

MoE routing is just flows:

```typescript
const w = world()

// Experts are actors
w.actor('expert-0', 'expert')
w.actor('expert-1', 'expert')
w.actor('expert-2', 'expert')
w.actor('expert-3', 'expert')

// Token types are implicit in flows
function routeToken(token: string, context: string) {
  const tokenType = embedAndClassify(token, context)
  
  // Follow strongest flow for this token type
  const expert = w.best('expert')
  
  // Or probabilistic selection weighted by flow strength
  const flows = w.open(4)
  const selected = weightedSample(flows)
  
  return selected.to
}

// After forward pass, reinforce based on contribution
function updateRouting(expert: string, contribution: number) {
  w.flow('router', expert).strengthen(contribution)
}

// Experts that contribute more get more traffic
// Experts that don't contribute fade
setInterval(() => w.fade(0.01), STEP_INTERVAL)
```

## LoRA Selection

```typescript
const w = world()

// Base model + adapters
w.actor('base', 'model')
w.actor('lora-code', 'adapter')
w.actor('lora-chat', 'adapter')
w.actor('lora-math', 'adapter')
w.actor('lora-legal', 'adapter')

// Route task to best adapter
async function selectAdapter(task: string) {
  const taskType = classify(task)
  
  // Strong flow = proven adapter
  const flows = w.open(10).filter(f => 
    f.from === taskType && actors[f.to]?.type === 'adapter'
  )
  
  if (flows[0]?.strength > 20) {
    return flows[0].to  // Proven route
  }
  
  // Weak flows = try and learn
  return flows[0]?.to || 'base'
}

// Record which adapter worked
function recordAdapterResult(task: string, adapter: string, quality: number) {
  w.flow(classify(task), adapter).strengthen(quality)
}
```

## The Training Loop

```
┌─────────────────────────────────────────────────────────────┐
│                      TRAINING                                │
│                                                              │
│   Dataset (thing)                                            │
│       │                                                      │
│       ▼                                                      │
│   ┌───────────────────────────────────────────────────────┐ │
│   │              MODEL SELECTION                           │ │
│   │                                                        │ │
│   │   Strong flow to model?  →  Use that model            │ │
│   │   No strong flow?        →  Try models, record loss   │ │
│   │                                                        │ │
│   └───────────────────────────────────────────────────────┘ │
│       │                                                      │
│       ▼                                                      │
│   Train step → loss                                          │
│       │                                                      │
│       ▼                                                      │
│   Low loss?  →  strengthen(data → model)                    │
│   High loss? →  resist(data → model)                        │
│       │                                                      │
│       ▼                                                      │
│   Flows update                                               │
│       │                                                      │
│       ▼                                                      │
│   Best model for data type emerges                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## The Inference Loop

```
┌─────────────────────────────────────────────────────────────┐
│                      INFERENCE                               │
│                                                              │
│   Query (thing)                                              │
│       │                                                      │
│       ▼                                                      │
│   ┌───────────────────────────────────────────────────────┐ │
│   │              ROUTING                                   │ │
│   │                                                        │ │
│   │   confidence(taskType) > 0.7?                         │ │
│   │       YES → best(taskType)     [skip router model]    │ │
│   │       NO  → routerModel.decide [use LLM routing]      │ │
│   │                                                        │ │
│   └───────────────────────────────────────────────────────┘ │
│       │                                                      │
│       ▼                                                      │
│   Model executes → response                                  │
│       │                                                      │
│       ▼                                                      │
│   Evaluate quality (human, reward model, outcome)           │
│       │                                                      │
│       ▼                                                      │
│   Good? → strengthen(task → model)                          │
│   Bad?  → resist(task → model)                              │
│       │                                                      │
│       ▼                                                      │
│   Next query routed better                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## What This Replaces

| Traditional | ONE |
|-------------|-----|
| Router model (learned) | Flows (emergent) |
| Gating networks | `best(type)` |
| Expert load balancing | `fade()` + `strengthen()` |
| Model selection heuristics | `confidence(type)` |
| A/B testing infrastructure | Groups + flows |
| Experiment tracking | Events |
| Model registry | Actors |

## Multi-Tenant AI

Groups enable isolated AI per tenant:

```typescript
// Each tenant has own flows
w.group('acme', 'tenant')
w.group('globex', 'tenant')

// Same models, different routing
w.actor('claude', 'llm')  // Shared

// Acme's usage patterns
w.flow('coding', 'claude', { group: 'acme' }).strengthen(1)

// Globex's usage patterns  
w.flow('writing', 'claude', { group: 'globex' }).strengthen(1)

// Queries route based on tenant's patterns
function route(tenant: string, task: string) {
  return w.best(classify(task), { group: tenant })
}

// Acme gets coding-optimized routing
// Globex gets writing-optimized routing
// Same models. Different flows. Personalized AI.
```

## Continuous Learning

```typescript
// Production inference with learning
async function serve(tenant: string, prompt: string) {
  const task = classify(prompt)
  const model = w.best('llm', { group: tenant }) || 'default'
  
  const response = await execute(model, prompt)
  
  // Implicit feedback from usage
  w.flow(task, model, { group: tenant }).strengthen(0.1)
  
  // Explicit feedback if provided
  onFeedback((quality) => {
    quality > 0.5
      ? w.flow(task, model, { group: tenant }).strengthen(quality)
      : w.flow(task, model, { group: tenant }).resist(1 - quality)
  })
  
  return response
}

// Decay keeps learning fresh
setInterval(() => {
  w.fade(0.05)  // Old patterns fade
  // Forces re-exploration
  // Adapts to changing model capabilities
  // Prevents stale routing
}, DAY)
```

## The Numbers

| Metric | Traditional | ONE |
|--------|-------------|-----|
| Router model size | 100M+ params | 0 params |
| Routing latency | 10-50ms | <1ms |
| Training signal | Explicit labels | Implicit outcomes |
| Adaptation speed | Retrain | Continuous |
| Multi-tenant | Complex | Built-in |

## The Truth

```
Training = flows from data to models
Inference = flows from tasks to models
Learning = strengthen on success, resist on failure
Routing = follow the strongest flow

Same 6 dimensions.
Same 220 lines.
Same mark/fade/highways.

Now it trains. Now it infers. Now it learns.
```

---

*ONE. The substrate for intelligence.*
