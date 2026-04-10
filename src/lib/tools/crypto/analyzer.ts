import { z } from 'zod';
import { toolRegistry, type Tool } from '../registry';

/**
 * Crypto Token Analyzer Tool
 *
 * AI-powered comprehensive token analysis combining multiple data sources.
 * Maps to 6-dimension ontology for structured analysis.
 *
 * Ontology mapping:
 * - Analysis = Thing (type: 'token_analysis')
 * - Analysis run = Event (type: 'token_analyzed')
 * - Token → Analysis = Connection (type: 'analyzes')
 */

// ============================================
// Token Analysis Tool
// ============================================

const analyzeTokenParams = z.object({
  tokenId: z.string().describe('CoinGecko token ID (e.g., "virtual-protocol", "bitcoin")'),
  analysisType: z.enum(['quick', 'deep', 'risk', 'comprehensive']).default('quick').describe('Analysis depth'),
});

interface TokenAnalysisResult {
  success: boolean;
  tokenId: string;
  analysisType: string;
  overview: {
    name: string;
    symbol: string;
    price: number;
    priceFormatted: string;
    marketCap: number;
    marketCapFormatted: string;
    rank: number | null;
    change24h: number;
    volume24h: number;
  };
  metrics: {
    circulatingSupply: number;
    totalSupply: number;
    maxSupply: number | null;
    supplyRatio: number;
  };
  performance: {
    change1h?: number;
    change24h: number;
    change7d: number;
    change30d: number;
    ath: number;
    athChangePercent: number;
    atl: number;
    atlChangePercent: number;
  };
  riskAssessment?: {
    overallScore: number;
    volatilityRisk: number;
    liquidityRisk: number;
    concentrationRisk: number;
    redFlags: string[];
    greenFlags: string[];
  };
  chartData?: {
    title: string;
    chartType: string;
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color: string;
    }>;
  };
  followUpSuggestions: string[];
  timestamp: number;
  source: string;
}

// Helper to format large numbers
function formatNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

// Helper to calculate volatility score (0-100, higher = more volatile)
function calculateVolatilityScore(change24h: number, change7d: number, change30d: number): number {
  const avgChange = (Math.abs(change24h) + Math.abs(change7d) + Math.abs(change30d)) / 3;
  // Score: 0-20% avg change = 0-50 score, 20%+ = 50-100
  return Math.min(100, Math.round(avgChange * 2.5));
}

// Helper to calculate liquidity score (0-100, higher = better liquidity)
function calculateLiquidityScore(volume24h: number, marketCap: number): number {
  if (!marketCap || marketCap === 0) return 0;
  const volumeRatio = volume24h / marketCap;
  // Good liquidity: ratio > 0.1 (10% daily volume)
  // Excellent: ratio > 0.2 (20% daily volume)
  return Math.min(100, Math.round(volumeRatio * 500));
}

// Identify red flags based on token data
function identifyRedFlags(data: any): string[] {
  const flags: string[] = [];

  // Low liquidity
  const volumeRatio = data.total_volume?.usd / data.market_cap?.usd;
  if (volumeRatio < 0.01) flags.push('Very low liquidity (< 1% daily volume)');

  // High concentration (if top holders data available)
  // Note: This would require additional on-chain data

  // Large price drops
  if (data.price_change_percentage_24h < -20) flags.push('Price dropped >20% in 24h');
  if (data.price_change_percentage_7d < -30) flags.push('Price dropped >30% in 7 days');

  // Far from ATH
  if (data.ath_change_percentage?.usd < -90) flags.push('Trading >90% below ATH');

  // Very high inflation potential
  if (data.max_supply && data.circulating_supply) {
    const circulatingRatio = data.circulating_supply / data.max_supply;
    if (circulatingRatio < 0.3) flags.push('Only ' + (circulatingRatio * 100).toFixed(0) + '% of max supply circulating');
  }

  return flags;
}

// Identify green flags
function identifyGreenFlags(data: any): string[] {
  const flags: string[] = [];

  // Good liquidity
  const volumeRatio = data.total_volume?.usd / data.market_cap?.usd;
  if (volumeRatio > 0.1) flags.push('Strong liquidity (>10% daily volume)');

  // Positive momentum
  if (data.price_change_percentage_24h > 5 && data.price_change_percentage_7d > 10) {
    flags.push('Positive price momentum');
  }

  // High market cap (established token)
  if (data.market_cap?.usd > 1e9) flags.push('Large cap (>$1B market cap)');

  // Active development (if GitHub data available)
  if (data.developer_data?.commit_count_4_weeks > 50) {
    flags.push('Active development (' + data.developer_data.commit_count_4_weeks + ' commits in 4 weeks)');
  }

  // Strong community
  if (data.community_data?.twitter_followers > 100000) {
    flags.push('Large community (>' + (data.community_data.twitter_followers / 1000).toFixed(0) + 'K Twitter followers)');
  }

  return flags;
}

async function analyzeToken(params: z.infer<typeof analyzeTokenParams>): Promise<TokenAnalysisResult> {
  const { tokenId, analysisType } = params;

  // Fetch data from CoinGecko
  const apiKey = 'CG-uSzUPRnh2hnv8ooVFF8FVDQU';
  const url = `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false&x_cg_demo_api_key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch token data: ${response.status}`);
  }

  const data = await response.json() as any;
  const marketData = data.market_data || {};

  // Build basic overview
  const overview = {
    name: data.name,
    symbol: data.symbol?.toUpperCase(),
    price: marketData.current_price?.usd || 0,
    priceFormatted: formatNumber(marketData.current_price?.usd || 0),
    marketCap: marketData.market_cap?.usd || 0,
    marketCapFormatted: formatNumber(marketData.market_cap?.usd || 0),
    rank: data.market_cap_rank,
    change24h: marketData.price_change_percentage_24h || 0,
    volume24h: marketData.total_volume?.usd || 0,
  };

  // Build metrics
  const metrics = {
    circulatingSupply: marketData.circulating_supply || 0,
    totalSupply: marketData.total_supply || 0,
    maxSupply: marketData.max_supply,
    supplyRatio: marketData.circulating_supply && marketData.total_supply
      ? marketData.circulating_supply / marketData.total_supply
      : 1,
  };

  // Build performance metrics
  const performance = {
    change1h: marketData.price_change_percentage_1h_in_currency?.usd,
    change24h: marketData.price_change_percentage_24h || 0,
    change7d: marketData.price_change_percentage_7d || 0,
    change30d: marketData.price_change_percentage_30d || 0,
    ath: marketData.ath?.usd || 0,
    athChangePercent: marketData.ath_change_percentage?.usd || 0,
    atl: marketData.atl?.usd || 0,
    atlChangePercent: marketData.atl_change_percentage?.usd || 0,
  };

  // Build result object
  const result: TokenAnalysisResult = {
    success: true,
    tokenId,
    analysisType,
    overview,
    metrics,
    performance,
    followUpSuggestions: [],
    timestamp: Date.now(),
    source: 'CoinGecko',
  };

  // Add risk assessment for deep/risk/comprehensive analysis
  if (analysisType !== 'quick') {
    const volatilityRisk = calculateVolatilityScore(
      performance.change24h,
      performance.change7d,
      performance.change30d
    );
    const liquidityRisk = 100 - calculateLiquidityScore(overview.volume24h, overview.marketCap);

    result.riskAssessment = {
      overallScore: Math.round((volatilityRisk + liquidityRisk) / 2),
      volatilityRisk,
      liquidityRisk,
      concentrationRisk: 50, // Default - would need on-chain data for accurate calculation
      redFlags: identifyRedFlags(marketData),
      greenFlags: identifyGreenFlags({ ...marketData, community_data: data.community_data, developer_data: data.developer_data }),
    };
  }

  // Add follow-up suggestions based on analysis type
  switch (analysisType) {
    case 'quick':
      result.followUpSuggestions = [
        `Analyze ${overview.symbol} tokenomics in detail`,
        `Show ${overview.symbol} 30-day price history`,
        `Full risk assessment for ${overview.symbol}`,
        `Compare ${overview.symbol} to similar tokens`,
      ];
      break;
    case 'deep':
      result.followUpSuggestions = [
        `Generate trading signal for ${overview.symbol}`,
        `Analyze whale holdings for ${overview.symbol}`,
        `Check ${overview.symbol} smart contract audit status`,
        `Show ${overview.symbol} social sentiment`,
      ];
      break;
    case 'risk':
      result.followUpSuggestions = [
        `Deep dive into ${overview.symbol} liquidity pools`,
        `Analyze ${overview.symbol} holder distribution`,
        `Check ${overview.symbol} team vesting schedule`,
        `Generate investment thesis for ${overview.symbol}`,
      ];
      break;
    case 'comprehensive':
      result.followUpSuggestions = [
        `Set price alerts for ${overview.symbol}`,
        `Create ${overview.symbol} portfolio allocation`,
        `Monitor ${overview.symbol} for changes`,
        `Generate PDF report for ${overview.symbol}`,
      ];
      break;
  }

  return result;
}

export const analyzeTokenTool: Tool = {
  name: 'analyze_crypto_token',
  description: 'Comprehensive AI-powered cryptocurrency token analysis. Returns overview, metrics, performance data, and risk assessment. Supports quick, deep, risk, and comprehensive analysis modes.',
  category: 'data',
  parameters: analyzeTokenParams,
  execute: analyzeToken,
  cacheable: true,
  cacheTTL: 120000, // Cache for 2 minutes
  tags: ['crypto', 'analysis', 'risk', 'ontology'],
};

// ============================================
// Risk Score Tool
// ============================================

const riskScoreParams = z.object({
  tokenId: z.string().describe('CoinGecko token ID'),
});

async function calculateRiskScore(params: z.infer<typeof riskScoreParams>) {
  const { tokenId } = params;

  // Get full analysis first
  const analysis = await analyzeToken({ tokenId, analysisType: 'risk' });

  if (!analysis.riskAssessment) {
    throw new Error('Could not calculate risk assessment');
  }

  // Create detailed risk breakdown
  const riskBreakdown = {
    overall: {
      score: analysis.riskAssessment.overallScore,
      rating: analysis.riskAssessment.overallScore < 30 ? 'Low Risk' :
              analysis.riskAssessment.overallScore < 60 ? 'Moderate Risk' :
              'High Risk',
      color: analysis.riskAssessment.overallScore < 30 ? '#10b981' :
             analysis.riskAssessment.overallScore < 60 ? '#f59e0b' :
             '#ef4444',
    },
    categories: [
      {
        name: 'Volatility',
        score: analysis.riskAssessment.volatilityRisk,
        description: analysis.riskAssessment.volatilityRisk < 30
          ? 'Relatively stable price action'
          : analysis.riskAssessment.volatilityRisk < 60
          ? 'Moderate price swings expected'
          : 'High volatility - significant price swings',
      },
      {
        name: 'Liquidity',
        score: analysis.riskAssessment.liquidityRisk,
        description: analysis.riskAssessment.liquidityRisk < 30
          ? 'Strong liquidity - easy to trade'
          : analysis.riskAssessment.liquidityRisk < 60
          ? 'Moderate liquidity - some slippage possible'
          : 'Low liquidity - may be difficult to exit positions',
      },
      {
        name: 'Concentration',
        score: analysis.riskAssessment.concentrationRisk,
        description: 'Based on top holder analysis (requires on-chain data for accuracy)',
      },
    ],
    redFlags: analysis.riskAssessment.redFlags,
    greenFlags: analysis.riskAssessment.greenFlags,
  };

  // Create table data for UI
  const tableData = {
    title: `${analysis.overview.symbol} Risk Assessment`,
    headers: ['Risk Category', 'Score', 'Status', 'Notes'],
    rows: riskBreakdown.categories.map(cat => [
      cat.name,
      `${cat.score}/100`,
      cat.score < 30 ? 'Low' : cat.score < 60 ? 'Moderate' : 'High',
      cat.description,
    ]),
  };

  return {
    success: true,
    tokenId,
    symbol: analysis.overview.symbol,
    riskBreakdown,
    tableData,
    recommendation: riskBreakdown.overall.score < 30
      ? 'Suitable for most investors'
      : riskBreakdown.overall.score < 60
      ? 'Suitable for risk-tolerant investors'
      : 'Only for high-risk tolerance portfolios',
    timestamp: Date.now(),
    source: 'Crypto Analyzer',
  };
}

export const riskScoreTool: Tool = {
  name: 'get_crypto_risk_score',
  description: 'Calculate comprehensive risk score for a cryptocurrency token. Returns detailed breakdown of volatility, liquidity, and concentration risks with recommendations.',
  category: 'data',
  parameters: riskScoreParams,
  execute: calculateRiskScore,
  cacheable: true,
  cacheTTL: 300000, // Cache for 5 minutes
  tags: ['crypto', 'risk', 'score', 'analysis'],
};

// ============================================
// Register tools
// ============================================

toolRegistry.register(analyzeTokenTool);
toolRegistry.register(riskScoreTool);
