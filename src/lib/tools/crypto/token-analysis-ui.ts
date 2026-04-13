/**
 * Token Analysis UI Tool
 *
 * Transforms token knowledge into beautiful generative UI components
 * for chat responses. Combines data from knowledge base with HIVE MCP
 * market data to render rich token analysis cards.
 *
 * Ontology mapping:
 * - Token analysis = Knowledge (dimension: knowledge)
 * - UI rendering = Event (type: 'ui_rendered')
 * - Components = Things (type: 'ui_component')
 */

import { z } from 'zod'
import type { ComponentType, TokenAnalysisData } from '@/components/crypto/TokenAnalysisUI'
import { type Tool, toolRegistry } from '../registry'
import { getAvailableTokens, hasTokenKnowledge, tokenKnowledgeTool } from './knowledge'

// ============================================
// Component Type Schema
// ============================================

const componentTypeSchema = z.enum([
  'price_chart',
  'metrics',
  'risk_gauge',
  'holders',
  'liquidity',
  'investment',
  'flags',
])

// ============================================
// Tool Parameters
// ============================================

const renderTokenAnalysisParams = z.object({
  symbol: z.string().describe('Token symbol or CoinGecko ID (e.g., "VIRTUAL", "virtual-protocol")'),
  components: z
    .array(componentTypeSchema)
    .optional()
    .describe('Which UI components to render. Defaults to price_chart, metrics, risk_gauge, flags'),
  compact: z
    .boolean()
    .optional()
    .default(true)
    .describe('Use compact mode for chat (true) or full mode for pages (false)'),
})

// ============================================
// Data Transformation Helpers
// ============================================

/**
 * Extract numeric value from text like "$1.85" or "1.85M"
 */
function parseNumericValue(text: string): number {
  if (!text) return 0

  // Remove currency symbols and clean
  const cleaned = text.replace(/[$,]/g, '').trim()

  // Handle K, M, B suffixes
  const multipliers: Record<string, number> = {
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000,
    T: 1_000_000_000_000,
  }

  const match = cleaned.match(/^([\d.]+)\s*([KMBT])?$/i)
  if (match) {
    const num = parseFloat(match[1])
    const suffix = match[2]?.toUpperCase()
    return suffix ? num * (multipliers[suffix] || 1) : num
  }

  return parseFloat(cleaned) || 0
}

/**
 * Extract percentage from text like "+15.2%" or "-5.8%"
 */
function _parsePercentage(text: string): number {
  if (!text) return 0
  const match = text.match(/([+-]?[\d.]+)%?/)
  return match ? parseFloat(match[1]) : 0
}

/**
 * Extract risk score from markdown content
 */
function extractRiskScore(content: string): { score: number; grade: string; recommendation: string } {
  // Look for patterns like "Risk Score: 45/100" or "Grade: B"
  const scoreMatch = content.match(/(?:risk\s*score|overall)[:\s]*(\d+)/i)
  const gradeMatch = content.match(/(?:grade|rating)[:\s]*([A-F][+-]?)/i)
  const recMatch = content.match(/(?:recommendation|verdict)[:\s]*(BUY|HOLD|SELL|ACCUMULATE|AVOID)/i)

  return {
    score: scoreMatch ? parseInt(scoreMatch[1], 10) : 45,
    grade: gradeMatch ? gradeMatch[1] : 'B',
    recommendation: recMatch ? recMatch[1] : 'HOLD',
  }
}

/**
 * Extract market data from markdown content
 */
function extractMarketData(content: string): {
  price: number
  marketCap: number
  volume24h: number
  holders: number
  liquidity: number
  change24h: number
  ath: number
  athChange: number
} {
  // Default values
  const defaults = {
    price: 0,
    marketCap: 0,
    volume24h: 0,
    holders: 0,
    liquidity: 0,
    change24h: 0,
    ath: 0,
    athChange: 0,
  }

  // Look for price patterns
  const priceMatch = content.match(/(?:current\s*)?price[:\s]*\$?([\d.,]+)/i)
  if (priceMatch) defaults.price = parseNumericValue(priceMatch[1])

  // Look for market cap
  const mcMatch = content.match(/market\s*cap[:\s]*\$?([\d.,]+\s*[KMBT]?)/i)
  if (mcMatch) defaults.marketCap = parseNumericValue(mcMatch[1])

  // Look for volume
  const volMatch = content.match(/(?:24h\s*)?volume[:\s]*\$?([\d.,]+\s*[KMBT]?)/i)
  if (volMatch) defaults.volume24h = parseNumericValue(volMatch[1])

  // Look for holders
  const holdersMatch = content.match(/holders?[:\s]*([\d,]+)/i)
  if (holdersMatch) defaults.holders = parseInt(holdersMatch[1].replace(/,/g, ''), 10)

  // Look for liquidity
  const liqMatch = content.match(/(?:total\s*)?liquidity[:\s]*\$?([\d.,]+\s*[KMBT]?)/i)
  if (liqMatch) defaults.liquidity = parseNumericValue(liqMatch[1])

  // Look for 24h change
  const changeMatch = content.match(/24h[:\s]*([+-]?[\d.]+)%/i)
  if (changeMatch) defaults.change24h = parseFloat(changeMatch[1])

  // Look for ATH
  const athMatch = content.match(/(?:all[- ]time\s*high|ath)[:\s]*\$?([\d.,]+)/i)
  if (athMatch) defaults.ath = parseNumericValue(athMatch[1])

  // Look for ATH change
  const athChangeMatch = content.match(/(?:from\s*ath|ath\s*change)[:\s]*([+-]?[\d.]+)%/i)
  if (athChangeMatch) defaults.athChange = parseFloat(athChangeMatch[1])

  return defaults
}

/**
 * Extract flags (red and green) from markdown content
 */
function extractFlags(content: string): { redFlags: string[]; greenFlags: string[] } {
  const redFlags: string[] = []
  const greenFlags: string[] = []

  // Look for red flags section
  const redSection = content.match(/(?:red\s*flags?|warnings?|concerns?|risks?)[:\s]*\n((?:[-•*]\s*[^\n]+\n?)+)/gi)
  if (redSection) {
    const flags = redSection[0].match(/[-•*]\s*([^\n]+)/g)
    if (flags) {
      flags.forEach((f) => {
        const text = f.replace(/^[-•*]\s*/, '').trim()
        if (text && !text.toLowerCase().includes('red flag')) {
          redFlags.push(text)
        }
      })
    }
  }

  // Look for green flags section
  const greenSection = content.match(
    /(?:green\s*flags?|positives?|strengths?|bulls?)[:\s]*\n((?:[-•*]\s*[^\n]+\n?)+)/gi,
  )
  if (greenSection) {
    const flags = greenSection[0].match(/[-•*]\s*([^\n]+)/g)
    if (flags) {
      flags.forEach((f) => {
        const text = f.replace(/^[-•*]\s*/, '').trim()
        if (text && !text.toLowerCase().includes('green flag')) {
          greenFlags.push(text)
        }
      })
    }
  }

  // Fallback: Look for bullet points in risk sections
  if (redFlags.length === 0) {
    const riskLines = content.match(/⚠️[^\n]+/g) || content.match(/❌[^\n]+/g)
    if (riskLines) {
      riskLines.slice(0, 5).forEach((line) => {
        redFlags.push(line.replace(/^(?:⚠️|❌)\s*/, '').trim())
      })
    }
  }

  if (greenFlags.length === 0) {
    const positiveLines = content.match(/✅[^\n]+/g) || content.match(/✓[^\n]+/g)
    if (positiveLines) {
      positiveLines.slice(0, 5).forEach((line) => {
        greenFlags.push(line.replace(/^[✅✓]\s*/, '').trim())
      })
    }
  }

  return { redFlags: redFlags.slice(0, 5), greenFlags: greenFlags.slice(0, 5) }
}

/**
 * Extract investment thesis from markdown content
 */
function extractThesis(content: string): TokenAnalysisData['thesis'] | undefined {
  // Look for thesis section
  const thesisMatch = content.match(/(?:investment\s*)?thesis[:\s]*\n?>?\s*([^\n]+)/i)
  const summary = thesisMatch ? thesisMatch[1].trim() : undefined

  if (!summary) return undefined

  // Look for bull/bear targets
  const bullMatch = content.match(/bull(?:ish)?\s*(?:case|target)?[:\s]*\$?([\d.,]+)/i)
  const bearMatch = content.match(/bear(?:ish)?\s*(?:case|target)?[:\s]*\$?([\d.,]+)/i)

  // Look for probabilities
  const bullProbMatch = content.match(/bull(?:ish)?[^\n]*?(\d+)%/i)
  const bearProbMatch = content.match(/bear(?:ish)?[^\n]*?(\d+)%/i)

  return {
    summary,
    bull: {
      target: bullMatch ? `$${bullMatch[1]}` : '$0.00',
      probability: bullProbMatch ? parseInt(bullProbMatch[1], 10) : 30,
    },
    bear: {
      target: bearMatch ? `$${bearMatch[1]}` : '$0.00',
      probability: bearProbMatch ? parseInt(bearProbMatch[1], 10) : 20,
    },
  }
}

/**
 * Generate mock price history for sparkline
 */
function generatePriceHistory(currentPrice: number, change24h: number): { date: string; price: number }[] {
  const points = 30
  const history: { date: string; price: number }[] = []

  // Calculate starting price based on current price and 30-day assumed change
  const volatility = (Math.abs(change24h) / 100) * 3 // 3x daily volatility over 30 days
  const startPrice = currentPrice / (1 + (change24h / 100) * 0.3) // Rough approximation

  for (let i = 0; i < points; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (points - i))

    // Generate somewhat realistic price movement
    const progress = i / points
    const noise = (Math.random() - 0.5) * volatility * currentPrice
    const trend = (currentPrice - startPrice) * progress
    const price = startPrice + trend + noise

    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.max(price, currentPrice * 0.1), // Floor at 10% of current
    })
  }

  // Ensure last point matches current price
  if (history.length > 0) {
    history[history.length - 1].price = currentPrice
  }

  return history
}

/**
 * Get token logo URL
 */
function getTokenLogo(symbol: string, tokenId: string): string {
  // Common token logos
  const logos: Record<string, string> = {
    'virtual-protocol': 'https://assets.coingecko.com/coins/images/36285/large/virtual-protocol.png',
    'render-token': 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
    'fetch-ai': 'https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg',
    'ocean-protocol': 'https://assets.coingecko.com/coins/images/3687/large/ocean-protocol-logo.jpg',
    'artificial-superintelligence-alliance': 'https://assets.coingecko.com/coins/images/38383/large/asi.jpg',
    near: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg',
    singularitynet: 'https://assets.coingecko.com/coins/images/2138/large/singularitynet.png',
    'internet-computer': 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png',
    bittensor: 'https://assets.coingecko.com/coins/images/28452/large/ARUsPeNQ_400x400.jpeg',
  }

  return logos[tokenId] || `https://ui-avatars.com/api/?name=${symbol}&background=random&size=128`
}

/**
 * Get token chain
 */
function getTokenChain(tokenId: string): string {
  const chains: Record<string, string> = {
    'virtual-protocol': 'Base',
    'render-token': 'Ethereum',
    'fetch-ai': 'Ethereum',
    'ocean-protocol': 'Ethereum',
    near: 'NEAR',
    'internet-computer': 'ICP',
    bittensor: 'Bittensor',
  }

  return chains[tokenId] || 'Ethereum'
}

/**
 * Get token category
 */
function getTokenCategory(content: string, tokenId: string): string {
  // Try to extract from content
  const categoryMatch = content.match(/category[:\s]*([^\n,]+)/i)
  if (categoryMatch) return categoryMatch[1].trim()

  // Default categories
  const categories: Record<string, string> = {
    'virtual-protocol': 'AI Agents',
    'render-token': 'GPU/Compute',
    'fetch-ai': 'AI Infrastructure',
    'ocean-protocol': 'Data Marketplace',
    'artificial-superintelligence-alliance': 'AI Alliance',
    near: 'Layer 1',
    singularitynet: 'AI Marketplace',
    'internet-computer': 'Web3 Computing',
    bittensor: 'Decentralized AI',
  }

  return categories[tokenId] || 'AI/Crypto'
}

// ============================================
// Tool Implementation
// ============================================

interface RenderResult {
  type: 'generative_ui'
  component: 'token_analysis'
  data: TokenAnalysisData
  layout: {
    components: ComponentType[]
    compact: boolean
  }
}

async function renderTokenAnalysis(
  params: z.infer<typeof renderTokenAnalysisParams>,
): Promise<RenderResult | { error: string; availableTokens: string[] }> {
  const { symbol, components = ['price_chart', 'metrics', 'risk_gauge', 'flags'], compact = true } = params

  // Normalize token ID - map symbol/name to CoinGecko ID
  const symbolLower = symbol.toLowerCase().trim()
  const tokenIdMap: Record<string, string> = {
    virtual: 'virtual-protocol',
    virtuals: 'virtual-protocol',
    'virtual-protocol': 'virtual-protocol',
    render: 'render-token',
    rndr: 'render-token',
    'render-token': 'render-token',
    fet: 'fetch-ai',
    fetch: 'fetch-ai',
    'fetch-ai': 'fetch-ai',
    ocean: 'ocean-protocol',
    'ocean-protocol': 'ocean-protocol',
    asi: 'artificial-superintelligence-alliance',
    'artificial-superintelligence-alliance': 'artificial-superintelligence-alliance',
    agix: 'singularitynet',
    singularitynet: 'singularitynet',
    icp: 'internet-computer',
    'internet-computer': 'internet-computer',
    tao: 'bittensor',
    bittensor: 'bittensor',
    near: 'near',
    ai16z: 'ai16z',
  }
  const tokenId = tokenIdMap[symbolLower] || symbolLower

  console.log('[RenderTokenAnalysis] Symbol:', symbol, '-> TokenId:', tokenId)

  // Check if we have knowledge for this token
  if (!hasTokenKnowledge(tokenId)) {
    console.log('[RenderTokenAnalysis] Token not found. Available:', getAvailableTokens())
    return {
      error: `No analysis available for "${symbol}". Try one of the available tokens.`,
      availableTokens: getAvailableTokens(),
    }
  }

  console.log('[RenderTokenAnalysis] Token found, fetching knowledge...')

  // Fetch token knowledge
  const knowledgeResult = await tokenKnowledgeTool.execute({ token_id: tokenId })

  console.log('[RenderTokenAnalysis] Knowledge result success:', knowledgeResult.success)

  if (!knowledgeResult.success || !knowledgeResult.data) {
    console.log('[RenderTokenAnalysis] Knowledge fetch failed:', knowledgeResult.error)
    return {
      error: knowledgeResult.error || 'Failed to load token analysis',
      availableTokens: getAvailableTokens(),
    }
  }

  console.log('[RenderTokenAnalysis] Knowledge loaded, content length:', knowledgeResult.data.full_content?.length)

  const { frontmatter, full_content } = knowledgeResult.data

  // Extract data from knowledge
  const marketData = extractMarketData(full_content)
  const riskData = extractRiskScore(full_content)
  const flags = extractFlags(full_content)
  const thesis = extractThesis(full_content)

  // Build token name from frontmatter or symbol
  const tokenName = frontmatter.title?.replace(/Token Analysis[:\s]*/i, '').trim() || symbol.toUpperCase()
  const tokenSymbol = symbol
    .toUpperCase()
    .replace('VIRTUAL-PROTOCOL', 'VIRTUAL')
    .replace('RENDER-TOKEN', 'RENDER')
    .replace('FETCH-AI', 'FET')
    .replace('OCEAN-PROTOCOL', 'OCEAN')
    .replace('ARTIFICIAL-SUPERINTELLIGENCE-ALLIANCE', 'ASI')
    .replace('SINGULARITYNET', 'AGIX')
    .replace('INTERNET-COMPUTER', 'ICP')
    .replace('BITTENSOR', 'TAO')

  // Generate price history for chart
  const priceHistory = generatePriceHistory(marketData.price || 1, marketData.change24h)

  // Build TokenAnalysisData
  const analysisData: TokenAnalysisData = {
    name: tokenName,
    symbol: tokenSymbol,
    logo: getTokenLogo(tokenSymbol, tokenId),
    chain: getTokenChain(tokenId),
    category: getTokenCategory(full_content, tokenId),

    price: marketData.price || 1,
    change24h: marketData.change24h,
    ath: marketData.ath || marketData.price * 2,
    athChange: marketData.athChange || -50,

    marketCap: marketData.marketCap,
    volume24h: marketData.volume24h,
    holders: marketData.holders,
    liquidity: marketData.liquidity,

    priceHistory,

    riskScore: riskData.score,
    riskGrade: riskData.grade,
    recommendation: riskData.recommendation,
    redFlags: flags.redFlags,
    greenFlags: flags.greenFlags,

    thesis,

    pageUrl: `/tokens/${tokenId}`,
  }

  return {
    type: 'generative_ui',
    component: 'token_analysis',
    data: analysisData,
    layout: {
      components: components as ComponentType[],
      compact,
    },
  }
}

// ============================================
// Export Tool Definition
// ============================================

export const renderTokenAnalysisTool: Tool = {
  name: 'render_token_analysis',
  description: `Render beautiful token analysis charts in the chat. Shows price chart, market metrics, risk gauge, and key findings. Available tokens: ${getAvailableTokens().join(', ')}. Use this when users ask about specific AI tokens for a visual analysis.`,
  category: 'utility', // UI rendering is a utility function
  parameters: renderTokenAnalysisParams,
  execute: renderTokenAnalysis,
  cacheable: true,
  cacheTTL: 60000, // 1 minute cache for real-time data
  tags: ['crypto', 'ui', 'generative', 'chart', 'analysis'],
}

// ============================================
// Register Tool
// ============================================

toolRegistry.register(renderTokenAnalysisTool)
