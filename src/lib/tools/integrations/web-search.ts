import { z } from 'zod';
import Exa from 'exa-js';
import { toolRegistry, type Tool } from '../registry';

/**
 * Web Search Tool - Search the web for information using Exa
 *
 * Ontology mapping:
 * - Search query = Event (type: 'data_fetched')
 * - Search API = Thing (type: 'data_source')
 * - Search result = Thing (type: 'search_result')
 */
const webSearchParams = z.object({
  query: z.string().describe('Search query'),
  limit: z.number().default(10).describe('Maximum number of results'),
  useAutoprompt: z.boolean().default(true).describe('Use Exa autoprompt to optimize query'),
  type: z.enum(['neural', 'keyword', 'auto']).default('auto').describe('Search type: neural for semantic search, keyword for exact matches'),
});

async function webSearch(params: z.infer<typeof webSearchParams>) {
  const { query, limit, useAutoprompt, type } = params;

  // Get Exa API key from environment
  const apiKey = import.meta.env.EXA_API_KEY;

  if (!apiKey) {
    throw new Error(
      'EXA_API_KEY is required. Get your API key at https://exa.ai and add it to your .env file.'
    );
  }

  try {
    // Initialize Exa client
    const exa = new Exa(apiKey);

    // Perform search with Exa
    const searchResponse = await exa.searchAndContents(query, {
      numResults: limit,
      useAutoprompt,
      type: type === 'auto' ? 'auto' : type,
      text: { maxCharacters: 500 }, // Get text snippets
    });

    // Transform Exa results to our format
    const results = searchResponse.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.text || result.summary || '',
      score: result.score,
      publishedDate: result.publishedDate,
      author: result.author,
    }));

    return {
      query,
      results,
      totalResults: results.length,
      autopromptString: searchResponse.autopromptString, // Optimized query used by Exa
    };
  } catch (error) {
    throw new Error(
      `Exa search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for current information. Use this to find facts, news, or answers to questions that require up-to-date information.',
  category: 'integration',
  parameters: webSearchParams,
  execute: webSearch,
};

toolRegistry.register(webSearchTool);
