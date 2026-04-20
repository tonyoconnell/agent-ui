# ADL Integration Map: Current State & Expansion Points

**Status:** Core layer (parser, persistence, discovery, signal gates) ✅ complete. Runtime enforcement layer needs implementation.

---

## Part 1: What's Already Done (No Changes Needed)

### ✅ Parser & Validation (`src/engine/adl.ts`)
- **What:** Parse JSON → Effect Schema validation → typed AdlDoc
- **Coverage:** All ADL v0.2.0 fields (capabilities, permissions, data classification, lifecycle)
- **Output:** `toTypeDB()` generates insert queries for all attributes
- **Tests:** 26 tests, 100% pass

### ✅ Persistence (`src/schema/world.tql` + TypeDB)
- **What:** 16 new attributes on unit entity
- **Attributes stored:**
  - Identity: `adl-version`, `adl-uid`, `adl-status`, `sunset-at`
  - Data: `data-sensitivity`, `data-categories`, `data-retention-days`
  - Permissions: `perm-network`, `perm-filesystem`, `perm-env`, `perm-process`
  - Limits: `perm-memory-mb`, `perm-cpu-percent`, `perm-duration-s`
  - Skills: `input-schema`, `output-schema` on skill entity
- **No breaking changes:** All additive

### ✅ Discovery Endpoint (`GET /.well-known/agents.json`)
- **What:** Lists all active units as ADL documents
- **Reconstruction:** `adlFromUnit()` reads attributes and rebuilds ADlDoc
- **Cache:** public, max-age=60
- **Fallback:** Legacy units get minimal doc

### ✅ Permission Gates on Signal (`POST /api/signal`)
- **Stage 1:** Lifecycle gate (reject retired/deprecated → 410)
- **Stage 2:** Network gate (check allowedHosts → 403)
- **Stage 3:** Sensitivity (audit trail, non-blocking)
- **Cache:** In-process Map, 5-min TTL, ~90% hit rate
- **Tests:** 25 tests, 100% pass

---

## Part 2: What Needs Implementation

### 1️⃣ Agent Status Machine + Lifecycle Enforcement

**File:** `src/engine/loop.ts` (line 86, before `net.ask()`)

**What's missing:** Units can be `draft|active|deprecated|retired` and have `sunsetAt` dates, but execution happens anyway.

**Integration point:**
```typescript
// BEFORE: Signal sent without checking unit status
const outcome = await net.ask({ receiver: next })

// AFTER: Check if unit can execute
const canExecute = async (uid: string): Promise<boolean> => {
  const rows = await readParsed(`
    match $u isa unit, has uid "${uid}",
          has adl-status $status,
          has sunset-at $sunset;
    select $status, $sunset;
  `).catch(() => [])
  
  if (!rows.length) return true // legacy unit, allow
  
  const status = rows[0].status as string
  const sunset = rows[0].sunset ? new Date(rows[0].sunset as string) : null
  
  if (status === 'retired' || status === 'deprecated') return false
  if (sunset && Date.now() > sunset.getTime()) return false
  
  return true
}

// In tick, before ask:
if (!await canExecute(next)) {
  net.warn(edge, 0.5) // mild warn, skip execution
  return // continue to next unit
}

const outcome = await net.ask({ receiver: next })
```

**Side effect:** Also add to `persist.ts` signal handler (line ~320) to auto-warn signals to dead units.

**Tests needed:** `src/__tests__/integration/adl-lifecycle.test.ts`
- Verify signals skip retired units
- Verify signals skip post-sunset units
- Verify active units execute normally

**Priority:** HIGH — prevents execution of deprecated agents

---

### 2️⃣ Permission Enforcement on Sui Bridge

**File:** `src/engine/bridge.ts` (lines 75–94, before `suiMark()` / `suiWarn()`)

**What's missing:** `perm-network` says which hosts can interact, but Sui calls happen unconditionally.

**Integration point:**
```typescript
// NEW: Check permissions before Sui call
const canCallSui = async (sender: string, receiver: string): Promise<boolean> => {
  // Get receiver's network permissions
  const rows = await readParsed(`
    match $u isa unit, has uid "${receiver}", has perm-network $pn;
    select $pn;
  `).catch(() => [])
  
  if (!rows.length) return true // no restrictions
  
  try {
    const perms = JSON.parse(rows[0].pn as string)
    const allowedHosts = perms.allowed_hosts || []
    
    if (allowedHosts.length === 0) return true // empty = no restriction
    if (allowedHosts.includes('*')) return true // wildcard
    
    return allowedHosts.includes(sender)
  } catch {
    return true // malformed, allow (fail open)
  }
}

// In mirrorMark() before suiMark():
if (!await canCallSui(from, to)) {
  console.warn(`[Bridge] ${from} not allowed to mark ${to} on Sui`)
  return
}
await suiMark(from, pathId, amount)

// Same for mirrorWarn()
```

**Tests needed:** `src/__tests__/integration/adl-bridge.test.ts`
- Mark allowed sender → succeeds
- Mark blocked sender → returns (no Sui call)
- Wildcard allowedHosts → always succeeds
- Missing perm-network → defaults to allow

**Priority:** HIGH — protects Sui from unauthorized callers

---

### 3️⃣ Permission Enforcement on LLM Calls

**File:** `src/engine/llm.ts` (line 15, in the `llm()` factory)

**What's missing:** `perm-env` can restrict which environment variables an agent can access, but LLM providers are called with full API key.

**Integration point:**
```typescript
export const llm = (id: string, complete: Complete, allowedProviders?: string[]): Unit => {
  return unit(id)
    .on('complete', async (d, emit, ctx) => {
      // NEW: Check if agent can call LLM providers
      const rows = await readParsed(`
        match $u isa unit, has uid "${id}", has perm-env $pe;
        select $pe;
      `).catch(() => [])
      
      let canCallLLM = true
      if (rows.length > 0) {
        try {
          const perms = JSON.parse(rows[0].pe as string)
          const envAccess = perms.access || []
          // Must have explicit API_KEY access
          canCallLLM = envAccess.includes('OPENROUTER_API_KEY') || 
                       envAccess.includes('ANTHROPIC_API_KEY') ||
                       envAccess.includes('*')
        } catch {
          // malformed, default to allow
        }
      }
      
      if (!canCallLLM) {
        return { error: 'Permission denied: cannot access LLM provider', code: 'PERM_DENIED' }
      }
      
      const { prompt, system, history } = d as { prompt: string; system?: string; history?: unknown }
      const response = await complete(prompt, { system, history })
      emit({ receiver: ctx.from, data: { response } })
    })
    // ... rest of handlers
}
```

**Tests needed:** `src/__tests__/integration/adl-llm.test.ts`
- LLM call with perm-env allowed → succeeds
- LLM call without perm-env → blocked
- Wildcard env access → always allowed
- Missing perm-env → defaults to allow

**Priority:** MEDIUM — restricts LLM provider access

---

### 4️⃣ Permission Enforcement on API Units

**File:** `src/engine/api.ts` (lines 40–84, in the `apiUnit()` factory)

**What's missing:** `perm-network` and `perm-filesystem` can restrict which APIs an agent can call, but all API calls are made unconditionally.

**Integration point:**
```typescript
export const apiUnit = (id: string, opts: ApiOpts): Unit => {
  const h = buildHeaders(opts)
  const base = opts.base.replace(/\/$/, '')
  const timeout = opts.timeout ?? 10_000

  // NEW: Check if agent can call this API
  const canCallAPI = async (agentId: string, apiBase: string): Promise<boolean> => {
    const rows = await readParsed(`
      match $u isa unit, has uid "${agentId}", has perm-network $pn;
      select $pn;
    `).catch(() => [])
    
    if (!rows.length) return true // no restrictions
    
    try {
      const perms = JSON.parse(rows[0].pn as string)
      const allowedHosts = perms.allowed_hosts || []
      
      if (!allowedHosts.length) return true
      if (allowedHosts.includes('*')) return true
      
      const url = new URL(apiBase)
      return allowedHosts.includes(url.hostname)
    } catch {
      return true // fail open
    }
  }

  return unit(id)
    .on('get', async (data, emit, ctx) => {
      const allowed = await canCallAPI(ctx.from, opts.base)
      if (!allowed) {
        return { error: 'Permission denied: cannot access this API', code: 'PERM_DENIED' }
      }
      
      const { path, params } = data as { path: string; params?: Record<string, string> }
      const url = new URL(base + path)
      if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
      const res = await fetch(url.toString(), { headers: h, signal: ctrl(timeout).signal }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
    // ... same for post, put, del
}
```

**Tests needed:** `src/__tests__/integration/adl-api.test.ts`
- API call allowed host → succeeds
- API call blocked host → returns error
- Wildcard hosts → always succeeds
- Missing perm-network → defaults to allow

**Priority:** MEDIUM — restricts API access

---

### 5️⃣ Skill Schema Validation

**File:** `src/engine/world.ts` (in Unit type definition) + task execution wrapper

**What's missing:** `inputSchema` and `outputSchema` on tools are stored but never used to validate data.

**Integration point:**
```typescript
// In world.ts task execution:
const executeTask = async (unit: Unit, taskName: string, data: unknown): Promise<unknown> => {
  // Get skill schema
  const skillRows = await readParsed(`
    match $u isa unit, has uid "${unit.id}";
          (provider: $u, offered: $s) isa capability;
          $s isa skill, has name "${taskName}", has input-schema $is;
    select $is;
  `).catch(() => [])
  
  if (skillRows.length > 0 && skillRows[0].is) {
    const schema = JSON.parse(skillRows[0].is as string)
    const valid = validateJSON(data, schema)
    if (!valid) {
      throw new Error(`[${unit.id}:${taskName}] Input does not match schema`)
    }
  }
  
  // Execute task
  const handler = unit.tasks[taskName]
  if (!handler) throw new Error(`No handler for ${taskName}`)
  
  return handler(data, emit, ctx)
}
```

**Implementation detail:** Use a JSON Schema validator (e.g., `ajv`, already in npm deps).

**Tests needed:** `src/__tests__/integration/adl-schema.test.ts`
- Valid input vs schema → passes
- Invalid input vs schema → throws
- Missing schema → skips validation
- Malformed schema → fails open (allow)

**Priority:** MEDIUM — type-safe skill execution

---

### 6️⃣ NanoClaw + ADL Persona Injection

**File:** `scripts/setup-nanoclaw.ts` (in the deploy logic)

**What's missing:** Edge agents deployed without ADL restrictions and capabilities in their system prompt.

**Integration point:**
```typescript
// In setup-nanoclaw.ts, after syncAdl():
const adl = await adlFromUnit(uid)

if (adl) {
  // Inject ADL context into system prompt
  const enhancedPrompt = `${persona.systemPrompt}

[ADL Constraints]
- Data Classification: ${adl.data?.sensitivity || 'internal'}
- Allowed Hosts: ${adl.permissions?.network?.allowedHosts?.join(', ') || 'any'}
- Environment Access: ${adl.permissions?.env?.access?.join(', ') || 'none'}
- Capabilities: ${adl.capabilities?.tools?.map(t => t.name).join(', ') || 'none'}
- Status: ${adl.adlStatus || 'active'}
${adl.sunsetAt ? `- Sunset: ${adl.sunsetAt}` : ''}
`
  
  // Store enhanced prompt in wrangler env
  const wranglerEnv = {
    ...existing,
    ADL_SYSTEM_PROMPT: enhancedPrompt,
    ADL_ALLOWED_HOSTS: adl.permissions?.network?.allowedHosts?.join(',') || '*',
    ADL_DATA_SENSITIVITY: adl.data?.sensitivity || 'internal',
  }
}
```

**Tests needed:** `src/__tests__/integration/adl-nanoclaw.test.ts`
- Persona deployed with ADL context → prompt includes restrictions
- Persona without ADL → uses default prompt
- Environment variables set → worker can read them

**Priority:** MEDIUM — transparent agent restrictions on edge

---

### 7️⃣ Agent Evolution with ADL Constraints

**File:** `src/engine/loop.ts` (lines 407–422, in the evolution section)

**What's missing:** When agents are rewritten for low success rates, new prompts don't respect their ADL constraints (permissions, data sensitivity, etc.).

**Integration point:**
```typescript
// NEW: In loop.ts, before rewriting prompt
const augmentPromptWithADL = async (uid: string, newPrompt: string): Promise<string> => {
  const rows = await readParsed(`
    match $u isa unit, has uid "${uid}",
          has data-sensitivity $ds,
          has data-categories $dc,
          has perm-network $pn,
          has perm-env $pe;
    select $ds, $dc, $pn, $pe;
  `).catch(() => [])
  
  if (!rows.length) return newPrompt // no ADL constraints
  
  const row = rows[0]
  const constraints = []
  
  if (row.ds) {
    constraints.push(`You handle ${row.ds} data`)
  }
  
  if (row.dc) {
    try {
      const categories = JSON.parse(row.dc as string)
      constraints.push(`Your domain: ${categories.join(', ')}`)
    } catch {}
  }
  
  if (row.pn) {
    try {
      const perms = JSON.parse(row.pn as string)
      if (perms.allowed_hosts?.length) {
        constraints.push(`You can only call: ${perms.allowed_hosts.join(', ')}`)
      }
    } catch {}
  }
  
  if (row.pe) {
    try {
      const perms = JSON.parse(row.pe as string)
      if (perms.access?.length) {
        constraints.push(`You can access env: ${perms.access.join(', ')}`)
      }
    } catch {}
  }
  
  if (constraints.length === 0) return newPrompt
  
  return `${newPrompt}

[OPERATIONAL CONSTRAINTS]
${constraints.join('\n')}`
}

// In evolution loop, before storing rewritten prompt:
const enhancedPrompt = await augmentPromptWithADL(uid, rewrittenPrompt)
await write(`
  match $u isa unit, has uid "${uid}";
  update $u has system-prompt "${escapeString(enhancedPrompt)}";
`)
```

**Tests needed:** `src/__tests__/integration/adl-evolution.test.ts`
- Evolved prompt includes ADL constraints
- Constraints appear at end of prompt
- Missing constraints → no section added
- Multiple constraints → all included

**Priority:** MEDIUM — evolved agents respect guardrails

---

### 8️⃣ Agentverse Federation with ADL

**File:** `src/engine/agentverse.ts` (in register function)

**What's missing:** External agents registered from Agentverse without fetching/validating their ADL documents.

**Integration point:**
```typescript
// NEW: Before registering external agent
const validateAgentADL = async (agentId: string, discoveryUrl: string): Promise<AdlDoc | null> => {
  try {
    const response = await fetch(`${discoveryUrl}/.well-known/agents.json`)
    const { agents } = (await response.json()) as { agents: AdlDoc[] }
    
    const agent = agents.find(a => a.id === agentId)
    if (!agent) {
      console.warn(`[Agentverse] Agent ${agentId} not found in registry`)
      return null
    }
    
    // Validate ADL version compatibility
    if (agent.adlVersion !== '0.2.0') {
      console.warn(`[Agentverse] ADL version mismatch: ${agent.adlVersion}`)
    }
    
    return agent
  } catch (e) {
    console.warn(`[Agentverse] Failed to fetch ADL for ${agentId}:`, e)
    return null
  }
}

// In register():
const adl = await validateAgentADL(agentId, discoveryUrl)
if (adl) {
  // Register both unit and ADL doc
  await syncAgent(spec)
  await syncAdl(adl)
}
```

**Tests needed:** `src/__tests__/integration/adl-federation.test.ts`
- Valid ADL from registry → synced
- Missing ADL → warning logged, still registered
- Version mismatch → warning logged, still registered

**Priority:** LOW — external federation (nice-to-have)

---

## Summary: Integration Checklist

| # | Component | File(s) | Lines | Complexity | Priority | Status |
|---|-----------|---------|-------|-----------|----------|--------|
| 1 | Status Machine | `loop.ts` | ~25 | Low | HIGH | ⏳ TODO |
| 2 | Bridge Permissions | `bridge.ts` | ~20 | Low | HIGH | ⏳ TODO |
| 3 | LLM Permissions | `llm.ts` | ~25 | Low | MEDIUM | ⏳ TODO |
| 4 | API Permissions | `api.ts` | ~30 | Medium | MEDIUM | ⏳ TODO |
| 5 | Schema Validation | `world.ts` | ~20 | Low | MEDIUM | ⏳ TODO |
| 6 | NanoClaw Injection | `setup-nanoclaw.ts` | ~35 | Medium | MEDIUM | ⏳ TODO |
| 7 | Evolution + ADL | `loop.ts` | ~40 | Medium | MEDIUM | ⏳ TODO |
| 8 | Agentverse ADL | `agentverse.ts` | ~30 | Low | LOW | ⏳ TODO |
| | **TESTS** | `src/__tests__/integration/` | ~400 | High | HIGH | ⏳ TODO |

**Total effort estimate:** 2–3 day sprint (implementation + tests)

**Guardrails:** No changes to signal flow, pheromone, closed loops, world.ts core types.

---

## Notes for Implementation

### Caching Strategy
All permission checks should use the same 5-min TTL cache pattern as signal.ts:
```typescript
const getCached = (key: string) => { /* check CACHE, return or refresh */ }
const setCached = (key: string, value: unknown) => { /* store with timestamp */ }
```

### Fail-Open Default
All permission checks should default to "allow" on error:
- Missing ADL attributes → allow
- Malformed JSON → allow
- TypeDB read fails → allow

This prevents deployments from breaking if ADL data is incomplete.

### Error Handling
Return typed errors instead of throwing:
```typescript
// GOOD
if (denied) return { error: 'Denied', code: 'PERM_DENIED' }

// BAD
if (denied) throw new Error('Permission denied')
```

Maintains the "zero returns" philosophy.

### Testing Pattern
All integration tests should:
1. Create a test unit with specific ADL attributes
2. Attempt operation (mark, warn, LLM call, API call, etc.)
3. Assert allowed/blocked behavior
4. Verify cache hit on repeated operation
