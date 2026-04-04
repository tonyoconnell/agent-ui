import { z } from 'zod';
import { toolRegistry, type Tool } from '../registry';

/**
 * CoinGecko API Integration Tools
 *
 * Free API with Demo key for development.
 * Provides real-time crypto prices, market data, and historical charts.
 *
 * API Documentation: https://docs.coingecko.com/reference/introduction
 *
 * Ontology mapping:
 * - Token data = Thing (type: 'crypto_token')
 * - Price fetch = Event (type: 'data_fetched')
 * - API integration = Connection (type: 'data_source')
 */

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Get API key from environment (optional for basic calls)
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env?.COINGECKO_API_KEY) {
    return process.env.COINGECKO_API_KEY;
  }
  // Demo API key for development
  return 'CG-uSzUPRnh2hnv8ooVFF8FVDQU';
};

/**
 * Helper to add API key to URL
 */
const addApiKey = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}x_cg_demo_api_key=${getApiKey()}`;
};

// ============================================
// Tool 1: Get Current Crypto Price
// ============================================

const cryptoPriceParams = z.object({
  ids: z.string().describe('Comma-separated CoinGecko token IDs (e.g., "bitcoin,ethereum,virtual-protocol")'),
  vs_currencies: z.string().default('usd').describe('Quote currency (e.g., "usd", "eur", "btc")'),
  include_market_cap: z.boolean().default(true).describe('Include market cap data'),
  include_24hr_vol: z.boolean().default(true).describe('Include 24h volume'),
  include_24hr_change: z.boolean().default(true).describe('Include 24h price change'),
});

async function getCryptoPrice(params: z.infer<typeof cryptoPriceParams>) {
  // Apply defaults explicitly to handle cases where zod defaults aren't applied
  const ids = params.ids;
  const vs_currencies = params.vs_currencies || 'usd';
  const include_market_cap = params.include_market_cap ?? true;
  const include_24hr_vol = params.include_24hr_vol ?? true;
  const include_24hr_change = params.include_24hr_change ?? true;

  const queryParams = new URLSearchParams({
    ids,
    vs_currencies,
    include_market_cap: String(include_market_cap),
    include_24hr_vol: String(include_24hr_vol),
    include_24hr_change: String(include_24hr_change),
  });

  const url = addApiKey(`${COINGECKO_API_BASE}/simple/price?${queryParams}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Format response for display
    const formattedResults = Object.entries(data).map(([tokenId, priceData]: [string, any]) => ({
      id: tokenId,
      price: priceData[vs_currencies],
      marketCap: priceData[`${vs_currencies}_market_cap`],
      volume24h: priceData[`${vs_currencies}_24h_vol`],
      change24h: priceData[`${vs_currencies}_24h_change`],
      currency: vs_currencies.toUpperCase(),
    }));

    return {
      success: true,
      data: formattedResults,
      timestamp: Date.now(),
      source: 'CoinGecko',
    };
  } catch (error) {
    throw new Error(`Failed to fetch crypto price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const cryptoPriceTool: Tool = {
  name: 'get_crypto_price',
  description: 'Get current cryptocurrency prices from CoinGecko. Returns price, market cap, 24h volume, and 24h change. Use CoinGecko token IDs (e.g., "bitcoin", "ethereum", "virtual-protocol").',
  category: 'integration',
  parameters: cryptoPriceParams,
  execute: getCryptoPrice,
  cacheable: true,
  cacheTTL: 60000, // Cache for 1 minute
  tags: ['crypto', 'price', 'market'],
};

// ============================================
// Tool 2: Get Detailed Token Information
// ============================================

const tokenDetailsParams = z.object({
  id: z.string().describe('CoinGecko token ID (e.g., "virtual-protocol", "bitcoin")'),
});

async function getTokenDetails(params: z.infer<typeof tokenDetailsParams>) {
  const { id } = params;

  const url = addApiKey(
    `${COINGECKO_API_BASE}/coins/${id}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=true&sparkline=false`
  );

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract key information
    return {
      success: true,
      data: {
        // Basic Info
        id: data.id,
        symbol: data.symbol?.toUpperCase(),
        name: data.name,
        description: data.description?.en?.slice(0, 500) || '',

        // Market Data
        currentPrice: data.market_data?.current_price?.usd,
        marketCap: data.market_data?.market_cap?.usd,
        marketCapRank: data.market_cap_rank,
        totalVolume: data.market_data?.total_volume?.usd,

        // Supply
        circulatingSupply: data.market_data?.circulating_supply,
        totalSupply: data.market_data?.total_supply,
        maxSupply: data.market_data?.max_supply,

        // Price Changes
        priceChange24h: data.market_data?.price_change_percentage_24h,
        priceChange7d: data.market_data?.price_change_percentage_7d,
        priceChange30d: data.market_data?.price_change_percentage_30d,

        // ATH/ATL
        ath: data.market_data?.ath?.usd,
        athDate: data.market_data?.ath_date?.usd,
        athChangePercent: data.market_data?.ath_change_percentage?.usd,
        atl: data.market_data?.atl?.usd,
        atlDate: data.market_data?.atl_date?.usd,
        atlChangePercent: data.market_data?.atl_change_percentage?.usd,

        // Additional Info
        categories: data.categories || [],
        platforms: data.platforms || {},
        links: {
          homepage: data.links?.homepage?.[0],
          twitter: data.links?.twitter_screen_name ? `https://twitter.com/${data.links.twitter_screen_name}` : null,
          telegram: data.links?.telegram_channel_identifier ? `https://t.me/${data.links.telegram_channel_identifier}` : null,
          github: data.links?.repos_url?.github?.[0] || null,
        },

        // Community Stats
        community: {
          twitterFollowers: data.community_data?.twitter_followers,
          telegramMembers: data.community_data?.telegram_channel_user_count,
        },

        // Developer Stats
        developer: {
          forks: data.developer_data?.forks,
          stars: data.developer_data?.stars,
          subscribers: data.developer_data?.subscribers,
          totalIssues: data.developer_data?.total_issues,
          closedIssues: data.developer_data?.closed_issues,
          pullRequestsMerged: data.developer_data?.pull_requests_merged,
          commitCount4Weeks: data.developer_data?.commit_count_4_weeks,
        },

        // Sentiment
        sentiment: {
          upVotes: data.sentiment_votes_up_percentage,
          downVotes: data.sentiment_votes_down_percentage,
        },
      },
      timestamp: Date.now(),
      source: 'CoinGecko',
    };
  } catch (error) {
    throw new Error(`Failed to fetch token details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const tokenDetailsTool: Tool = {
  name: 'get_token_details',
  description: 'Get comprehensive token information from CoinGecko including market data, supply metrics, price changes, ATH/ATL, community stats, and developer activity.',
  category: 'integration',
  parameters: tokenDetailsParams,
  execute: getTokenDetails,
  cacheable: true,
  cacheTTL: 300000, // Cache for 5 minutes
  tags: ['crypto', 'token', 'details', 'market'],
};

// ============================================
// Tool 3: Get Price History (for charts)
// ============================================

const priceHistoryParams = z.object({
  id: z.string().describe('CoinGecko token ID'),
  days: z.number().default(7).describe('Number of days (1, 7, 30, 90, 365, max)'),
  interval: z.enum(['minutely', 'hourly', 'daily']).optional().describe('Data interval (auto-detected if not specified)'),
});

async function getPriceHistory(params: z.infer<typeof priceHistoryParams>) {
  const { id, days, interval } = params;

  let url = `${COINGECKO_API_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
  if (interval) {
    url += `&interval=${interval}`;
  }
  url = addApiKey(url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Format for charting
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      if (days <= 1) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (days <= 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    const prices = data.prices.map(([timestamp, price]: [number, number]) => ({
      timestamp,
      date: formatDate(timestamp),
      price: Math.round(price * 10000) / 10000,
    }));

    const volumes = data.total_volumes.map(([timestamp, volume]: [number, number]) => ({
      timestamp,
      date: formatDate(timestamp),
      volume: Math.round(volume),
    }));

    const marketCaps = data.market_caps.map(([timestamp, cap]: [number, number]) => ({
      timestamp,
      date: formatDate(timestamp),
      marketCap: Math.round(cap),
    }));

    // Calculate stats
    const priceValues = prices.map((p: { price: number }) => p.price);
    const high = Math.max(...priceValues);
    const low = Math.min(...priceValues);
    const change = ((priceValues[priceValues.length - 1] - priceValues[0]) / priceValues[0]) * 100;

    return {
      success: true,
      data: {
        tokenId: id,
        days,
        prices,
        volumes,
        marketCaps,
        stats: {
          high,
          low,
          change: Math.round(change * 100) / 100,
          dataPoints: prices.length,
        },
        // Pre-formatted chart data
        chartData: {
          labels: prices.map((p: { date: string }) => p.date),
          datasets: [
            {
              label: 'Price (USD)',
              data: prices.map((p: { price: number }) => p.price),
              color: change >= 0 ? '#10b981' : '#ef4444',
            },
          ],
        },
        volumeChartData: {
          labels: volumes.map((v: { date: string }) => v.date),
          datasets: [
            {
              label: 'Volume (USD)',
              data: volumes.map((v: { volume: number }) => v.volume),
              color: '#3b82f6',
            },
          ],
        },
      },
      timestamp: Date.now(),
      source: 'CoinGecko',
    };
  } catch (error) {
    throw new Error(`Failed to fetch price history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const priceHistoryTool: Tool = {
  name: 'get_price_history',
  description: 'Get historical price data for charts. Returns price, volume, and market cap over time. Useful for creating line/area charts.',
  category: 'integration',
  parameters: priceHistoryParams,
  execute: getPriceHistory,
  cacheable: true,
  cacheTTL: 300000, // Cache for 5 minutes
  tags: ['crypto', 'price', 'history', 'chart'],
};

// ============================================
// Tool 4: Search Tokens
// ============================================

const searchTokensParams = z.object({
  query: z.string().describe('Search query (token name or symbol)'),
});

async function searchTokens(params: z.infer<typeof searchTokensParams>) {
  const { query } = params;

  const url = addApiKey(`${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        coins: data.coins?.slice(0, 10).map((coin: any) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol?.toUpperCase(),
          marketCapRank: coin.market_cap_rank,
          thumb: coin.thumb,
        })) || [],
        exchanges: data.exchanges?.slice(0, 5).map((ex: any) => ({
          id: ex.id,
          name: ex.name,
          marketType: ex.market_type,
        })) || [],
      },
      timestamp: Date.now(),
      source: 'CoinGecko',
    };
  } catch (error) {
    throw new Error(`Failed to search tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const searchTokensTool: Tool = {
  name: 'search_crypto_tokens',
  description: 'Search for cryptocurrency tokens by name or symbol. Returns matching tokens with their CoinGecko IDs for use with other tools.',
  category: 'integration',
  parameters: searchTokensParams,
  execute: searchTokens,
  cacheable: true,
  cacheTTL: 600000, // Cache for 10 minutes
  tags: ['crypto', 'search', 'token'],
};

// ============================================
// Tool 5: Get Trending Tokens
// ============================================

const trendingParams = z.object({});

async function getTrendingTokens() {
  const url = addApiKey(`${COINGECKO_API_BASE}/search/trending`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        coins: data.coins?.map((item: any) => ({
          id: item.item.id,
          name: item.item.name,
          symbol: item.item.symbol?.toUpperCase(),
          marketCapRank: item.item.market_cap_rank,
          score: item.item.score,
          thumb: item.item.thumb,
          priceChange24h: item.item.data?.price_change_percentage_24h?.usd,
          price: item.item.data?.price,
          marketCap: item.item.data?.market_cap,
        })) || [],
      },
      timestamp: Date.now(),
      source: 'CoinGecko',
    };
  } catch (error) {
    throw new Error(`Failed to fetch trending tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const trendingTokensTool: Tool = {
  name: 'get_trending_tokens',
  description: 'Get trending cryptocurrency tokens on CoinGecko. Shows most searched tokens in the last 24 hours.',
  category: 'integration',
  parameters: trendingParams,
  execute: getTrendingTokens,
  cacheable: true,
  cacheTTL: 300000, // Cache for 5 minutes
  tags: ['crypto', 'trending', 'popular'],
};

// ============================================
// Register all tools
// ============================================

toolRegistry.register(cryptoPriceTool);
toolRegistry.register(tokenDetailsTool);
toolRegistry.register(priceHistoryTool);
toolRegistry.register(searchTokensTool);
toolRegistry.register(trendingTokensTool);
