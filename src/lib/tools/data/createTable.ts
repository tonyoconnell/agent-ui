import { z } from 'zod';
import { toolRegistry, type Tool } from '../registry';

/**
 * Table Creation Tool - Generate data tables
 *
 * Ontology mapping:
 * - Table = Thing (type: 'data_table')
 * - Table generation = Event (type: 'table_rendered')
 */
const tableParams = z.object({
  title: z.string(),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

async function createTable(params: z.infer<typeof tableParams>) {
  return {
    type: 'ui',
    component: 'table',
    data: params,
  };
}

export const createTableTool: Tool = {
  name: 'create_table',
  description: 'Create a data table with columns and rows',
  category: 'data',
  parameters: tableParams,
  execute: createTable,
};

toolRegistry.register(createTableTool);
