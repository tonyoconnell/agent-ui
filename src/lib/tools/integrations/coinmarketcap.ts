import { z } from 'zod';
import { toolRegistry, type Tool } from '../registry';

/**
 * CoinMarketCap API Integration Tools
 *
 * Requires API key (stored in env.local as COINMARKETCAP_API_KEY)
 * API Documentation: https://coinmarketcap.com/api/documentation/v1/
 *
 * Rate Limits:
 * - Basic: 333 calls/day
 * - Hobbyist: 10,000 calls/month
 *
 * Ontology mapping:
 * - Token data = Thing (type: 'crypto_token')
 * - Price fetch = Event (type: 'data_fetched')
 * - API integration = Connection (type: 'data_source')
 */

const CMC_API_BASE = 'https://pro-api.coinmarketcap.com/v1';

// Get API key from environment
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env?.COINMARKETCAP_API_KEY) {
    return process.env.COINMARKETCAP_API_KEY;
  }
  // Check import.meta.env for Vite/Astro
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.COINMARKETCAP_API_KEY) {
    return (import.meta as any).env.COINMARKETCAP_API_KEY;
  }
  throw new Error('COINMARKETCAP_API_KEY not found in environment');
};

/**
 * Helper to make authenticated requests
 */
const cmcFetch = async (endpoint: string, params?: Record<string, string>) => {
  const apiKey = getApiKey();
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';

  const response = await fetch(`${CMC_API_BASE}${endpoint}${queryString}`, {
    headers: {
      'X-CMC_PRO_API_KEY': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `CoinMarketCap API error: ${response.status} - ${errorData?.status?.error_message || response.statusText}`
    );
  }

  return response.json();
};

// ============================================
// Tool 1: Get Latest Quotes
// ============================================

const latestQuotesParams = z.object({
  symbol: z.string().describe('Comma-separated token symbols (e.g., "BTC,ETH,VIRTUAL")'),
  convert: z.string().default('USD').describe('Quote currency'),
});

async function getLatestQuotes(params: z.infer<typeof latestQuotesParams>) {
  const { symbol, convert } = params;

  try {
    const data = await cmcFetch('/cryptocurrency/quotes/latest', {
      symbol: symbol.toUpperCase(),
      convert: convert.toUpperCase(),
    });

    // Format response
    const results = Object.values(data.data || {}).map((token: any) => {
      const quote = token.quote?.[convert.toUpperCase()] || {};

      return {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        slug: token.slug,
        cmcRank: token.cmc_rank,

        // Supply
        circulatingSupply: token.circulating_supply,
        totalSupply: token.total_supply,
        maxSupply: token.max_supply,

        // Quote data
        price: quote.price,
        volume24h: quote.volume_24h,
        volumeChange24h: quote.volume_change_24h,
        marketCap: quote.market_cap,
        marketCapDominance: quote.market_cap_dominance,
        fullyDilutedMarketCap: quote.fully_diluted_market_cap,

        // Price changes
        percentChange1h: quote.percent_change_1h,
        percentChange24h: quote.percent_change_24h,
        percentChange7d: quote.percent_change_7d,
        percentChange30d: quote.percent_change_30d,
        percentChange60d: quote.percent_change_60d,
        percentChange90d: quote.percent_change_90d,

        lastUpdated: quote.last_updated,
        currency: convert.toUpperCase(),
      };
    });

    return {
      success: true,
      data: results,
      timestamp: Date.now(),
      source: 'CoinMarketCap',
    };
  } catch (error) {
    throw new Error(`Failed to fetch quotes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const latestQuotesTool: Tool = {
  name: 'cmc_get_quotes',
  description: 'Get latest cryptocurrency quotes from CoinMarketCap. Returns price, market cap, volume, and price changes (1h, 24h, 7d, 30d). Use token symbols (e.g., "BTC", "ETH", "VIRTUAL").',
  category: 'integration',
  parameters: latestQuotesParams,
  execute: getLatestQuotes,
  cacheable: true,
  cacheTTL: 60000, // Cache for 1 minute
  tags: ['crypto', 'price', 'cmc'],
};

// ============================================
// Tool 2: Get Token Metadata
// ============================================

const tokenMetadataParams = z.object({
  symbol: z.string().describe('Comma-separated token symbols (e.g., "BTC,ETH")'),
});

async function getTokenMetadata(params: z.infer<typeof tokenMetadataParams>) {
  const { symbol } = params;

  try {
    const data = await cmcFetch('/cryptocurrency/info', {
      symbol: symbol.toUpperCase(),
    });

    // Format response
    const results = Object.values(data.data || {}).map((token: any) => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      slug: token.slug,
      category: token.category,
      description: token.description?.slice(0, 500),
      dateAdded: token.date_added,
      dateLaunched: token.date_launched,

      // Tags and categories
      tags: token.tags || [],
      tagNames: token['tag-names'] || [],
      tagGroups: token['tag-groups'] || [],

      // Platform info (for tokens on other chains)
      platform: token.platform ? {
        id: token.platform.id,
        name: token.platform.name,
        symbol: token.platform.symbol,
        tokenAddress: token.platform.token_address,
      } : null,

      // URLs
      urls: {
        website: token.urls?.website?.[0] || null,
        twitter: token.urls?.twitter?.[0] || null,
        reddit: token.urls?.reddit?.[0] || null,
        messageBoard: token.urls?.message_board?.[0] || null,
        chat: token.urls?.chat?.[0] || null,
        explorer: token.urls?.explorer || [],
        sourceCode: token.urls?.source_code?.[0] || null,
        technicalDoc: token.urls?.technical_doc?.[0] || null,
      },

      logo: token.logo,
      selfReportedCirculatingSupply: token.self_reported_circulating_supply,
      selfReportedMarketCap: token.self_reported_market_cap,
      isAudited: token.is_audited || false,
    }));

    return {
      success: true,
      data: results,
      timestamp: Date.now(),
      source: 'CoinMarketCap',
    };
  } catch (error) {
    throw new Error(`Failed to fetch metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const tokenMetadataTool: Tool = {
  name: 'cmc_get_metadata',
  description: 'Get cryptocurrency metadata from CoinMarketCap including description, links, platform info, tags, and audit status.',
  category: 'integration',
  parameters: tokenMetadataParams,
  execute: getTokenMetadata,
  cacheable: true,
  cacheTTL: 3600000, // Cache for 1 hour (metadata doesn't change often)
  tags: ['crypto', 'metadata', 'cmc'],
};

// ============================================
// Tool 3: Get Top Cryptocurrencies
// ============================================

const topCryptosParams = z.object({
  limit: z.number().default(20).describe('Number of tokens to return (max 100)'),
  start: z.number().default(1).describe('Starting rank (1-based)'),
  convert: z.string().default('USD').describe('Quote currency'),
  sortBy: z.enum(['market_cap', 'volume_24h', 'percent_change_24h', 'percent_change_7d']).default('market_cap').describe('Sort field'),
  sortDir: z.enum(['asc', 'desc']).default('desc').describe('Sort direction'),
});

async function getTopCryptos(params: z.infer<typeof topCryptosParams>) {
  const { limit, start, convert, sortBy, sortDir } = params;

  try {
    const data = await cmcFetch('/cryptocurrency/listings/latest', {
      limit: String(Math.min(limit, 100)),
      start: String(start),
      convert: convert.toUpperCase(),
      sort: sortBy,
      sort_dir: sortDir,
    });

    // Format response
    const results = (data.data || []).map((token: any) => {
      const quote = token.quote?.[convert.toUpperCase()] || {};

      return {
        cmcRank: token.cmc_rank,
        name: token.name,
        symbol: token.symbol,
        slug: token.slug,

        // Supply
        circulatingSupply: token.circulating_supply,
        totalSupply: token.total_supply,
        maxSupply: token.max_supply,

        // Quote
        price: quote.price,
        volume24h: quote.volume_24h,
        marketCap: quote.market_cap,
        percentChange24h: quote.percent_change_24h,
        percentChange7d: quote.percent_change_7d,
        percentChange30d: quote.percent_change_30d,

        // Tags
        tags: token.tags?.slice(0, 5) || [],
      };
    });

    return {
      success: true,
      data: results,
      pagination: {
        start,
        limit,
        total: data.status?.total_count,
      },
      timestamp: Date.now(),
      source: 'CoinMarketCap',
    };
  } catch (error) {
    throw new Error(`Failed to fetch top cryptos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const topCryptosTool: Tool = {
  name: 'cmc_get_top_cryptos',
  description: 'Get top cryptocurrencies from CoinMarketCap ranked by market cap. Useful for market overview and comparisons.',
  category: 'integration',
  parameters: topCryptosParams,
  execute: getTopCryptos,
  cacheable: true,
  cacheTTL: 300000, // Cache for 5 minutes
  tags: ['crypto', 'rankings', 'cmc'],
};

// ============================================
// Tool 4: Get Global Metrics
// ============================================

const globalMetricsParams = z.object({
  convert: z.string().default('USD').describe('Quote currency'),
});

async function getGlobalMetrics(params: z.infer<typeof globalMetricsParams>) {
  const { convert } = params;

  try {
    const data = await cmcFetch('/global-metrics/quotes/latest', {
      convert: convert.toUpperCase(),
    });

    const quote = data.data?.quote?.[convert.toUpperCase()] || {};

    return {
      success: true,
      data: {
        // Market overview
        totalMarketCap: quote.total_market_cap,
        totalVolume24h: quote.total_volume_24h,
        totalVolume24hReported: quote.total_volume_24h_reported,

        // Market changes
        totalMarketCapYesterday: quote.total_market_cap_yesterday,
        totalMarketCapYesterdayChangePercent: quote.total_market_cap_yesterday_percentage_change,

        // Altcoin metrics
        altcoinMarketCap: quote.altcoin_market_cap,
        altcoinVolume24h: quote.altcoin_volume_24h,

        // Bitcoin dominance
        btcDominance: data.data?.btc_dominance,
        ethDominance: data.data?.eth_dominance,

        // Market stats
        activeCryptocurrencies: data.data?.active_cryptocurrencies,
        totalCryptocurrencies: data.data?.total_cryptocurrencies,
        activeMarketPairs: data.data?.active_market_pairs,
        activeExchanges: data.data?.active_exchanges,

        // DeFi metrics
        defiVolume24h: data.data?.defi_volume_24h,
        defiMarketCap: data.data?.defi_market_cap,
        defi24hPercentageChange: data.data?.defi_24h_percentage_change,

        // Stablecoin metrics
        stablecoinVolume24h: data.data?.stablecoin_volume_24h,
        stablecoinMarketCap: data.data?.stablecoin_market_cap,
        stablecoin24hPercentageChange: data.data?.stablecoin_24h_percentage_change,

        lastUpdated: quote.last_updated,
        currency: convert.toUpperCase(),
      },
      timestamp: Date.now(),
      source: 'CoinMarketCap',
    };
  } catch (error) {
    throw new Error(`Failed to fetch global metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const globalMetricsTool: Tool = {
  name: 'cmc_get_global_metrics',
  description: 'Get global cryptocurrency market metrics from CoinMarketCap including total market cap, BTC dominance, DeFi stats, and stablecoin metrics.',
  category: 'integration',
  parameters: globalMetricsParams,
  execute: getGlobalMetrics,
  cacheable: true,
  cacheTTL: 300000, // Cache for 5 minutes
  tags: ['crypto', 'market', 'global', 'cmc'],
};

// ============================================
// Tool 5: Get Category Tokens (e.g., AI tokens)
// ============================================

const categoryTokensParams = z.object({
  category: z.string().describe('Category ID or slug (e.g., "ai-big-data", "defi", "layer-1")'),
  limit: z.number().default(20).describe('Number of tokens to return'),
  convert: z.string().default('USD').describe('Quote currency'),
});

async function getCategoryTokens(params: z.infer<typeof categoryTokensParams>) {
  const { category, limit, convert } = params;

  try {
    // First, get the category to find its ID
    const categoriesData = await cmcFetch('/cryptocurrency/categories');
    const categoryInfo = categoriesData.data?.find((cat: any) =>
      cat.id === category ||
      cat.slug === category ||
      cat.name.toLowerCase().includes(category.toLowerCase())
    );

    if (!categoryInfo) {
      throw new Error(`Category "${category}" not found`);
    }

    // Get tokens in this category
    const tokensData = await cmcFetch('/cryptocurrency/category', {
      id: categoryInfo.id,
      limit: String(limit),
      convert: convert.toUpperCase(),
    });

    const coins = (tokensData.data?.coins || []).map((token: any) => {
      const quote = token.quote?.[convert.toUpperCase()] || {};

      return {
        cmcRank: token.cmc_rank,
        name: token.name,
        symbol: token.symbol,
        slug: token.slug,
        price: quote.price,
        volume24h: quote.volume_24h,
        marketCap: quote.market_cap,
        percentChange24h: quote.percent_change_24h,
        percentChange7d: quote.percent_change_7d,
      };
    });

    return {
      success: true,
      data: {
        category: {
          id: categoryInfo.id,
          name: categoryInfo.name,
          title: categoryInfo.title,
          description: categoryInfo.description,
          numTokens: categoryInfo.num_tokens,
          marketCap: categoryInfo.market_cap,
          marketCapChange: categoryInfo.market_cap_change,
          volume: categoryInfo.volume,
          volumeChange: categoryInfo.volume_change,
        },
        tokens: coins,
      },
      timestamp: Date.now(),
      source: 'CoinMarketCap',
    };
  } catch (error) {
    throw new Error(`Failed to fetch category tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const categoryTokensTool: Tool = {
  name: 'cmc_get_category_tokens',
  description: 'Get tokens by category from CoinMarketCap. Useful for analyzing specific sectors like "ai-big-data", "defi", "layer-1", "gaming".',
  category: 'integration',
  parameters: categoryTokensParams,
  execute: getCategoryTokens,
  cacheable: true,
  cacheTTL: 300000, // Cache for 5 minutes
  tags: ['crypto', 'category', 'sector', 'cmc'],
};

// ============================================
// Register all tools
// ============================================

toolRegistry.register(latestQuotesTool);
toolRegistry.register(tokenMetadataTool);
toolRegistry.register(topCryptosTool);
toolRegistry.register(globalMetricsTool);
toolRegistry.register(categoryTokensTool);
