import { z } from 'zod';
import { toolRegistry, type Tool } from '../registry';

/**
 * Data Analyzer Tool - Analyze datasets and compute statistics
 *
 * Ontology mapping:
 * - Analysis = Event (type: 'data_analyzed')
 * - Dataset = Thing (type: 'dataset')
 * - Result = Thing (type: 'analysis_result')
 */
const dataAnalyzerParams = z.object({
  data: z.array(z.record(z.string(), z.any())).describe('Array of data objects to analyze'),
  operations: z.array(
    z.enum([
      'summary',      // Count, min, max, mean, median, mode
      'distribution', // Frequency distribution
      'correlation',  // Correlation between numeric fields
      'outliers',     // Detect outliers
      'trends',       // Identify trends over time
    ])
  ).describe('Analysis operations to perform'),
  fields: z.array(z.string()).optional().describe('Specific fields to analyze (optional)'),
});

interface AnalysisResult {
  operation: string;
  results: any;
}

function calculateSummary(data: any[], fields?: string[]): any {
  const numericFields = fields || Object.keys(data[0] || {}).filter(key =>
    typeof data[0][key] === 'number'
  );

  const summaries: any = {};

  numericFields.forEach(field => {
    const values = data.map(d => d[field]).filter(v => typeof v === 'number');

    if (values.length === 0) return;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];

    // Calculate mode
    const frequency: Record<number, number> = {};
    values.forEach(v => {
      frequency[v] = (frequency[v] || 0) + 1;
    });
    const mode = Number(Object.keys(frequency).reduce((a, b) =>
      frequency[Number(a)] > frequency[Number(b)] ? a : b
    ));

    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    summaries[field] = {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean: Math.round(mean * 100) / 100,
      median,
      mode,
      stdDev: Math.round(stdDev * 100) / 100,
      sum,
    };
  });

  return summaries;
}

function calculateDistribution(data: any[], fields?: string[]): any {
  const targetFields = fields || Object.keys(data[0] || {});
  const distributions: any = {};

  targetFields.forEach(field => {
    const values = data.map(d => d[field]);
    const frequency: Record<string, number> = {};

    values.forEach(v => {
      const key = String(v);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 most frequent

    distributions[field] = {
      total: values.length,
      unique: Object.keys(frequency).length,
      topValues: sorted.map(([value, count]) => ({
        value,
        count,
        percentage: Math.round((count / values.length) * 100 * 100) / 100,
      })),
    };
  });

  return distributions;
}

function detectOutliers(data: any[], fields?: string[]): any {
  const numericFields = fields || Object.keys(data[0] || {}).filter(key =>
    typeof data[0][key] === 'number'
  );

  const outliers: any = {};

  numericFields.forEach(field => {
    const values = data.map(d => d[field]).filter(v => typeof v === 'number');

    if (values.length === 0) return;

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const fieldOutliers = data
      .map((item, index) => ({ ...item, _index: index }))
      .filter(item => {
        const value = item[field];
        return typeof value === 'number' && (value < lowerBound || value > upperBound);
      });

    outliers[field] = {
      count: fieldOutliers.length,
      lowerBound: Math.round(lowerBound * 100) / 100,
      upperBound: Math.round(upperBound * 100) / 100,
      outliers: fieldOutliers.slice(0, 5), // Show first 5
    };
  });

  return outliers;
}

function identifyTrends(data: any[], fields?: string[]): any {
  const numericFields = fields || Object.keys(data[0] || {}).filter(key =>
    typeof data[0][key] === 'number'
  );

  const trends: any = {};

  numericFields.forEach(field => {
    const values = data.map(d => d[field]).filter(v => typeof v === 'number');

    if (values.length < 2) return;

    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((acc, x, i) => acc + x * values[i], 0);
    const sumX2 = indices.reduce((acc, x) => acc + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const direction = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
    const strength = Math.abs(slope);

    trends[field] = {
      direction,
      slope: Math.round(slope * 1000) / 1000,
      intercept: Math.round(intercept * 100) / 100,
      strength: strength < 0.1 ? 'weak' : strength < 1 ? 'moderate' : 'strong',
    };
  });

  return trends;
}

function calculateCorrelation(data: any[], fields?: string[]): any {
  const numericFields = fields || Object.keys(data[0] || {}).filter(key =>
    typeof data[0][key] === 'number'
  );

  if (numericFields.length < 2) {
    return { message: 'Need at least 2 numeric fields for correlation' };
  }

  const correlations: any[] = [];

  for (let i = 0; i < numericFields.length; i++) {
    for (let j = i + 1; j < numericFields.length; j++) {
      const field1 = numericFields[i];
      const field2 = numericFields[j];

      const values1 = data.map(d => d[field1]).filter(v => typeof v === 'number');
      const values2 = data.map(d => d[field2]).filter(v => typeof v === 'number');

      if (values1.length !== values2.length || values1.length === 0) continue;

      const n = values1.length;
      const mean1 = values1.reduce((a, b) => a + b, 0) / n;
      const mean2 = values2.reduce((a, b) => a + b, 0) / n;

      const cov = values1.reduce((acc, v1, idx) =>
        acc + (v1 - mean1) * (values2[idx] - mean2), 0
      ) / n;

      const std1 = Math.sqrt(
        values1.reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) / n
      );
      const std2 = Math.sqrt(
        values2.reduce((acc, v) => acc + Math.pow(v - mean2, 2), 0) / n
      );

      const correlation = cov / (std1 * std2);

      correlations.push({
        field1,
        field2,
        correlation: Math.round(correlation * 1000) / 1000,
        strength: Math.abs(correlation) > 0.7 ? 'strong' :
                  Math.abs(correlation) > 0.4 ? 'moderate' : 'weak',
        direction: correlation > 0 ? 'positive' : 'negative',
      });
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

async function analyzeData(params: z.infer<typeof dataAnalyzerParams>) {
  const { data, operations, fields } = params;

  if (data.length === 0) {
    throw new Error('No data provided for analysis');
  }

  const results: AnalysisResult[] = [];

  for (const operation of operations) {
    let result: any;

    switch (operation) {
      case 'summary':
        result = calculateSummary(data, fields);
        break;
      case 'distribution':
        result = calculateDistribution(data, fields);
        break;
      case 'correlation':
        result = calculateCorrelation(data, fields);
        break;
      case 'outliers':
        result = detectOutliers(data, fields);
        break;
      case 'trends':
        result = identifyTrends(data, fields);
        break;
    }

    results.push({
      operation,
      results: result,
    });
  }

  return {
    dataCount: data.length,
    fieldsAnalyzed: fields || Object.keys(data[0] || {}),
    analyses: results,
  };
}

export const dataAnalyzerTool: Tool = {
  name: 'analyze_data',
  description: 'Analyze datasets to compute statistics, detect patterns, find outliers, and identify trends. Supports summary stats (mean, median, mode), distribution analysis, correlation analysis, outlier detection, and trend identification.',
  category: 'data',
  parameters: dataAnalyzerParams,
  execute: analyzeData,
};

toolRegistry.register(dataAnalyzerTool);
