import { z } from 'zod';
import { toolRegistry, type Tool } from '../registry';

/**
 * Date Formatter Tool - Format and manipulate dates
 *
 * Ontology mapping:
 * - Date formatting = Event (type: 'data_transformed')
 * - Formatter = Thing (type: 'tool')
 */
const dateFormatterParams = z.object({
  date: z.string().optional().describe('Date string or ISO date (defaults to current date)'),
  operation: z.enum([
    'format',           // Format to readable string
    'relative',         // Format as relative time (e.g., "2 hours ago")
    'add',              // Add time
    'subtract',         // Subtract time
    'diff',             // Difference between dates
    'parse',            // Parse and validate date
    'timestamp',        // Convert to Unix timestamp
    'iso',              // Convert to ISO 8601
  ]).describe('Operation to perform'),
  format: z.string().optional().describe('Output format (e.g., "YYYY-MM-DD", "MMM D, YYYY")'),
  amount: z.number().optional().describe('Amount for add/subtract operations'),
  unit: z.enum(['years', 'months', 'days', 'hours', 'minutes', 'seconds']).optional().describe('Unit for add/subtract/diff operations'),
  compareDate: z.string().optional().describe('Second date for diff operation'),
  timezone: z.string().optional().describe('Target timezone (e.g., "America/New_York", "UTC")'),
});

function parseDate(dateStr?: string): Date {
  if (!dateStr) return new Date();

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  return parsed;
}

function formatDate(date: Date, format?: string): string {
  if (!format) {
    // Default format: "January 15, 2024"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Simple format tokens
  const tokens: Record<string, string> = {
    'YYYY': date.getFullYear().toString(),
    'YY': date.getFullYear().toString().slice(-2),
    'MMMM': date.toLocaleDateString('en-US', { month: 'long' }),
    'MMM': date.toLocaleDateString('en-US', { month: 'short' }),
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'M': String(date.getMonth() + 1),
    'DD': String(date.getDate()).padStart(2, '0'),
    'D': String(date.getDate()),
    'HH': String(date.getHours()).padStart(2, '0'),
    'H': String(date.getHours()),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'm': String(date.getMinutes()),
    'ss': String(date.getSeconds()).padStart(2, '0'),
    's': String(date.getSeconds()),
  };

  let result = format;
  Object.entries(tokens).forEach(([token, value]) => {
    result = result.replace(new RegExp(token, 'g'), value);
  });

  return result;
}

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return diffSeconds <= 1 ? 'just now' : `${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  }
}

function addTime(date: Date, amount: number, unit: string): Date {
  const result = new Date(date);

  switch (unit) {
    case 'years':
      result.setFullYear(result.getFullYear() + amount);
      break;
    case 'months':
      result.setMonth(result.getMonth() + amount);
      break;
    case 'days':
      result.setDate(result.getDate() + amount);
      break;
    case 'hours':
      result.setHours(result.getHours() + amount);
      break;
    case 'minutes':
      result.setMinutes(result.getMinutes() + amount);
      break;
    case 'seconds':
      result.setSeconds(result.getSeconds() + amount);
      break;
  }

  return result;
}

function dateDiff(date1: Date, date2: Date, unit: string): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());

  switch (unit) {
    case 'years':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
    case 'months':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
    case 'days':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'hours':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'minutes':
      return Math.floor(diffMs / (1000 * 60));
    case 'seconds':
      return Math.floor(diffMs / 1000);
    default:
      return diffMs;
  }
}

async function formatDateTool(params: z.infer<typeof dateFormatterParams>) {
  const { date: dateStr, operation, format, amount, unit, compareDate, timezone } = params;

  try {
    const date = parseDate(dateStr);

    switch (operation) {
      case 'format':
        return {
          operation: 'format',
          input: dateStr || 'current date',
          output: formatDate(date, format),
          iso: date.toISOString(),
        };

      case 'relative':
        return {
          operation: 'relative',
          input: dateStr || 'current date',
          output: relativeTime(date),
          iso: date.toISOString(),
        };

      case 'add':
        if (amount === undefined || !unit) {
          throw new Error('amount and unit are required for add operation');
        }
        const addedDate = addTime(date, amount, unit);
        return {
          operation: 'add',
          input: dateStr || 'current date',
          amount,
          unit,
          output: formatDate(addedDate, format),
          iso: addedDate.toISOString(),
        };

      case 'subtract':
        if (amount === undefined || !unit) {
          throw new Error('amount and unit are required for subtract operation');
        }
        const subtractedDate = addTime(date, -amount, unit);
        return {
          operation: 'subtract',
          input: dateStr || 'current date',
          amount,
          unit,
          output: formatDate(subtractedDate, format),
          iso: subtractedDate.toISOString(),
        };

      case 'diff':
        if (!compareDate || !unit) {
          throw new Error('compareDate and unit are required for diff operation');
        }
        const date2 = parseDate(compareDate);
        const difference = dateDiff(date, date2, unit);
        return {
          operation: 'diff',
          date1: dateStr || 'current date',
          date2: compareDate,
          difference,
          unit,
        };

      case 'parse':
        return {
          operation: 'parse',
          input: dateStr,
          valid: true,
          iso: date.toISOString(),
          formatted: formatDate(date),
          timestamp: date.getTime(),
        };

      case 'timestamp':
        return {
          operation: 'timestamp',
          input: dateStr || 'current date',
          timestamp: date.getTime(),
          unix: Math.floor(date.getTime() / 1000),
        };

      case 'iso':
        return {
          operation: 'iso',
          input: dateStr || 'current date',
          iso: date.toISOString(),
        };

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    throw new Error(
      `Date operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const dateFormatterTool: Tool = {
  name: 'format_date',
  description: 'Format and manipulate dates. Operations: format (custom format), relative (time ago), add (add time), subtract (subtract time), diff (difference between dates), parse (validate date), timestamp (Unix timestamp), iso (ISO 8601). Format tokens: YYYY, MM, DD, HH, mm, ss, MMM, MMMM.',
  category: 'utility',
  parameters: dateFormatterParams,
  execute: formatDateTool,
};

toolRegistry.register(dateFormatterTool);
