import { z } from 'zod';
import { toolRegistry, type Tool } from '../registry';

/**
 * Google Sheets - Read public sheets
 *
 * Ontology mapping:
 * - Google Sheet = Thing (type: 'data_source')
 * - Read operation = Event (type: 'data_fetched')
 * - Chat → Sheet = Connection (type: 'connects_to')
 */
const googleSheetsParams = z.object({
  url: z.string().describe('The full Google Sheets URL or spreadsheet ID'),
  range: z.string().optional().describe('Range in A1 notation (optional, defaults to Sheet1!A1:Z1000)'),
});

// Extract spreadsheet ID from URL
function extractSpreadsheetId(input: string): string {
  // If it's already just an ID (no slashes), return it
  if (!input.includes('/')) {
    return input;
  }

  // Extract from URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  throw new Error('Could not extract spreadsheet ID from URL. Please provide a valid Google Sheets URL.');
}

async function readGoogleSheet(params: z.infer<typeof googleSheetsParams>) {
  const apiKey = import.meta.env.GOOGLE_SHEETS_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_SHEETS_API_KEY not configured. Please add it to your .env.local file.');
  }

  const { url: input, range = 'Sheet1!A1:Z1000' } = params;
  const spreadsheetId = extractSpreadsheetId(input);

  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    const error = await response.text();

    // Parse error for better messaging
    try {
      const errorJson = JSON.parse(error);
      if (errorJson.error?.details?.[0]?.reason === 'API_KEY_SERVICE_BLOCKED') {
        throw new Error(
          'Google Sheets API is not enabled for this API key. ' +
          'Enable it at: https://console.cloud.google.com/apis/library/sheets.googleapis.com'
        );
      }
    } catch (parseError) {
      // If parsing fails, use original error
    }

    throw new Error(`Google Sheets API error: ${error}`);
  }

  const data = await response.json() as any;

  return {
    range: data.range,
    values: data.values || [],
    rowCount: data.values?.length || 0,
  };
}

export const googleSheetsTool: Tool = {
  name: 'read_google_sheet',
  description: 'Read data from a public Google Sheet. After calling this tool and receiving the data, you MUST respond in this EXACT order:\n\n1. FIRST: Analyze the data structure (columns, data types, patterns)\n2. SECOND: Provide a clear description of what the data shows\n3. THIRD: Create ONE chart that provides the best insight from the data\n\nResponse format:\n"I\'ve analyzed your Google Sheet data:\n\n**Data Overview:**\n[Describe the data: what it contains, time period, key metrics, etc.]\n\n**Key Insights:**\n- [Insight 1]\n- [Insight 2]\n- [Insight 3]\n\n**Visualization:**\nHere\'s a [chart type] showing [what it shows]:\n\n```ui-chart\n{"title":"[Descriptive Title]","chartType":"[line/bar/pie]","labels":[...],"datasets":[{"label":"[Metric]","data":[...],"color":"#3b82f6"}]}\n```"\n\nIMPORTANT: Choose the chart type that best reveals patterns in the data (line for trends, bar for comparisons, pie for distribution).',
  category: 'integration',
  parameters: googleSheetsParams,
  execute: readGoogleSheet,
};

// Auto-register
toolRegistry.register(googleSheetsTool);
