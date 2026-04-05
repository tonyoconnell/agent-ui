# AI Training & Inference

The same 6 dimensions. Same 220 lines. Now it learns.

## The Mapping

| Dimension | Training | Inference |
|-----------|----------|-----------|
| **Groups** | Experiments, runs | Tenants, use cases |
| **Actors** | Models, adapters, experts | Models, LoRAs, agents |
| **Things** | Datasets, prompts | Queries, contexts |
| **Paths** | Data → model routing | Task → expert routing |
| **Events** | Training steps, evals | Completions, feedback |
| **Knowledge** | Converged patterns | Proven routes |

## Training as Paths

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

// Training = mark on paths from data to models
function trainStep(data: string, model: string, loss: number) {
  const quality = 1 / (1 + loss)  // Lower loss = higher quality
  w.mark(`${data}->${model}`, quality)
}

// After training
trainStep('dataset-code', 'lora-coding', 0.02)   // Good loss → strong path
trainStep('dataset-code', 'base-model', 0.15)   // Worse loss → weaker path
trainStep('dataset-prose', 'lora-writing', 0.03) // Good loss → strong path

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
    // Skip routing model — follow the path
    const model = w.best(taskType)
    return execute(model, prompt)
  }
  
  // No strong path — use router model
  const model = await routerModel.decide(task)
  return execute(model, prompt)
}

// After execution, record outcome
function recordOutcome(task: string, model: string, quality: number) {
  const edge = `${task}->${model}`
  quality > 0.7
    ? w.mark(edge, quality)
    : w.mark(edge, false)  // resist
}
```

## Mixture of Experts

MoE routing is just paths:

```typescript
const w = world()

// Experts are actors
w.actor('expert-0', 'expert')
w.actor('expert-1', 'expert')
w.actor('expert-2', 'expert')
w.actor('expert-3', 'expert')

// Token types are implicit in paths
function routeToken(token: string, context: string) {
  const tokenType = embedAndClassify(token, context)
  
  // Follow strongest path for this token type
  const expert = w.best('expert')
  
  // Or probabilistic selection weighted by path strength
  const paths = w.follow(4)
  const selected = weightedSample(paths)
  
  return selected.to
}

// After forward pass, mark based on contribution
function updateRouting(expert: string, contribution: number) {
  w.mark(`router->${expert}`, contribution)
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
  
  // Strong path = proven adapter
  const paths = w.follow(10).filter(p => 
    p.from === taskType && actors[p.to]?.type === 'adapter'
  )
  
  if (paths[0]?.weight > 20) {
    return paths[0].to  // Proven route
  }
  
  // Weak paths = try and learn
  return paths[0]?.to || 'base'
}

// Record which adapter worked
function recordAdapterResult(task: string, adapter: string, quality: number) {
  w.mark(`${classify(task)}->${adapter}`, quality)
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
│   │   Strong path to model?  →  Use that model            │ │
│   │   No strong path?        →  Try models, record loss   │ │
│   │                                                        │ │
│   └───────────────────────────────────────────────────────┘ │
│       │                                                      │
│       ▼                                                      │
│   Train step → loss                                          │
│       │                                                      │
│       ▼                                                      │
│   Low loss?  →  mark(data → model)                          │
│   High loss? →  resist(data → model)                        │
│       │                                                      │
│       ▼                                                      │
│   Paths update                                               │
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
│   Good? → mark(task → model)                                │
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
| Router model (learned) | Paths (emergent) |
| Gating networks | `best(type)` |
| Expert load balancing | `fade()` + `mark()` |
| Model selection heuristics | `confidence(type)` |
| A/B testing infrastructure | Groups + paths |
| Experiment tracking | Events |
| Model registry | Actors |

## Multi-Tenant AI

Groups enable isolated AI per tenant:

```typescript
// Each tenant has own paths
w.group('acme', 'tenant')
w.group('globex', 'tenant')

// Same models, different routing
w.actor('claude', 'llm')  // Shared

// Acme's usage patterns
w.mark('coding->claude', 1, { group: 'acme' })

// Globex's usage patterns  
w.mark('writing->claude', 1, { group: 'globex' })

// Queries route based on tenant's patterns
function route(tenant: string, task: string) {
  return w.best(classify(task), { group: tenant })
}

// Acme gets coding-optimized routing
// Globex gets writing-optimized routing
// Same models. Different paths. Personalized AI.
```

## Continuous Learning

```typescript
// Production inference with learning
async function serve(tenant: string, prompt: string) {
  const task = classify(prompt)
  const model = w.best('llm', { group: tenant }) || 'default'
  
  const response = await execute(model, prompt)
  const edge = `${task}->${model}`
  
  // Implicit feedback from usage
  w.mark(edge, 0.1, { group: tenant })
  
  // Explicit feedback if provided
  onFeedback((quality) => {
    quality > 0.5
      ? w.mark(edge, quality, { group: tenant })
      : w.mark(edge, false, { group: tenant })  // resist
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
Training = paths from data to models
Inference = paths from tasks to models
Learning = mark on success, resist on failure
Routing = follow the strongest path

Same 6 dimensions.
Same 220 lines.
Same signal/mark/follow/fade.

Now it trains. Now it infers. Now it learns.
```

---

*ONE. The substrate for intelligence.*

---

## See Also

- [flows.md](flows.md) — How training data flows through the substrate
- [substrate-learning.md](substrate-learning.md) — Reinforcement learning without gradients
- [metaphors.md](metaphors.md) — ML as one of seven metaphor skins
- [code-tutorial.md](code-tutorial.md) — Edge-based learning architecture
- [ontology.md](ontology.md) — Inference rules over learned paths
- [one-ontology.md](one-ontology.md) — Six dimensions applied to ML
