/**
 * AI Model Configuration
 *
 * Manages model configurations, capabilities, and metadata for the chat system.
 *
 * Ontology Mapping:
 * - Model = Thing (type: 'ai_model')
 * - Model selection = Connection (type: 'uses_model')
 * - Model switched = Event (type: 'model_switched')
 */

export interface AIModel {
  id: string
  name: string
  chef: string // Provider name (OpenAI, Anthropic, Google, etc.)
  chefSlug: string
  providers: string[]
  free: boolean
  context?: string // Context window (e.g., "128K", "1M")
  tier?: string // "Frontier", "Premium", etc.
  requiresAuth?: string // Auth requirement message
  isClaudeCode?: boolean
  hasTools?: boolean
  description?: string
}

export interface ModelCategory {
  name: string
  models: AIModel[]
}

/**
 * Get all available models organized by category
 */
export function getModelCategories(): ModelCategory[] {
  return [
    {
      name: 'Free Models',
      models: FREE_MODELS,
    },
    {
      name: 'Premium Models',
      models: PREMIUM_MODELS,
    },
    {
      name: 'Claude Code',
      models: CLAUDE_CODE_MODELS,
    },
  ]
}

/**
 * Get a specific model by ID
 */
export function getModelById(id: string): AIModel | undefined {
  const allModels = [...FREE_MODELS, ...PREMIUM_MODELS, ...CLAUDE_CODE_MODELS]
  return allModels.find((m) => m.id === id)
}

/**
 * Check if a model is free
 */
export function isModelFree(modelId: string): boolean {
  return FREE_MODELS.some((m) => m.id === modelId)
}

/**
 * Get default model (free model)
 */
export function getDefaultModel(): AIModel {
  return FREE_MODELS[0]
}

/**
 * Get model display name with context
 */
export function getModelDisplayName(model: AIModel): string {
  if (model.context) {
    return `${model.name} (${model.context})`
  }
  return model.name
}

/**
 * Get model tier badge variant
 */
export function getModelTierVariant(model: AIModel): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (model.free) return 'secondary'
  if (model.tier === 'Frontier') return 'destructive'
  if (model.tier === 'Premium') return 'default'
  return 'outline'
}

// Model Definitions

export const FREE_MODELS: AIModel[] = [
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
    free: true,
    context: '1M',
    description: 'Fast, efficient model for everyday tasks',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
    free: true,
    context: '1M',
    description: 'Latest Gemini Flash model with improved performance',
  },
  {
    id: 'deepseek/deepseek-chat-v3.1',
    name: 'DeepSeek Chat V3.1',
    chef: 'DeepSeek',
    chefSlug: 'deepseek',
    providers: ['deepseek'],
    free: true,
    context: '164K',
    description: 'Advanced reasoning and coding capabilities',
  },
  {
    id: 'zhipuai/glm-4.5-air',
    name: 'GLM 4.5 Air',
    chef: 'ZhipuAI',
    chefSlug: 'zhipuai',
    providers: ['zhipuai'],
    free: true,
    context: '131K',
    description: 'Lightweight model for quick responses',
  },
  {
    id: 'x-ai/grok-beta',
    name: 'Grok Beta',
    chef: 'xAI',
    chefSlug: 'x-ai',
    providers: ['x-ai'],
    free: true,
    context: '256K',
    description: 'Latest Grok model with conversational AI',
  },
]

export const PREMIUM_MODELS: AIModel[] = [
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai'],
    free: false,
    context: '400K',
    tier: 'Frontier',
    description: 'Most advanced GPT model with exceptional reasoning',
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['anthropic'],
    free: false,
    context: '1M',
    tier: 'Frontier',
    description: 'Latest Claude with superior analysis and coding',
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
    free: false,
    context: '2M',
    tier: 'Frontier',
    description: 'Preview of next-gen Gemini with extended context',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai'],
    free: false,
    context: '128K',
    tier: 'Premium',
    description: 'Multimodal GPT-4 with vision and advanced reasoning',
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['anthropic'],
    free: false,
    context: '200K',
    tier: 'Premium',
    description: 'Most powerful Claude 3 model for complex tasks',
  },
]

export const CLAUDE_CODE_MODELS: AIModel[] = [
  {
    id: 'claude-code/sonnet-4-20250514',
    name: 'Claude Code Sonnet 4',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['claude-code'],
    free: true,
    context: '200K',
    requiresAuth: 'CLI: claude login',
    isClaudeCode: true,
    hasTools: true,
    description: 'Claude Code with developer tools and file access',
  },
]

/**
 * Model capability matrix
 */
export interface ModelCapabilities {
  streaming: boolean
  toolCalling: boolean
  reasoning: boolean
  vision: boolean
  multimodal: boolean
  codeExecution: boolean
}

export function getModelCapabilities(modelId: string): ModelCapabilities {
  // All models support streaming and tool calling via OpenRouter
  const baseCapabilities: ModelCapabilities = {
    streaming: true,
    toolCalling: true,
    reasoning: false,
    vision: false,
    multimodal: false,
    codeExecution: false,
  }

  // Claude Code has code execution
  if (modelId.startsWith('claude-code/')) {
    return {
      ...baseCapabilities,
      reasoning: true,
      codeExecution: true,
    }
  }

  // GPT-4o has vision and multimodal
  if (modelId === 'openai/gpt-4o') {
    return {
      ...baseCapabilities,
      vision: true,
      multimodal: true,
    }
  }

  // Claude Sonnet 4.5 has reasoning
  if (modelId === 'anthropic/claude-sonnet-4.5') {
    return {
      ...baseCapabilities,
      reasoning: true,
    }
  }

  return baseCapabilities
}
