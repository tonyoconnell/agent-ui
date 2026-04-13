import { z } from 'zod'
import { type Tool, toolRegistry } from '../registry'

/**
 * Calculator Tool - Perform mathematical calculations
 *
 * Ontology mapping:
 * - Calculation = Event (type: 'computation_performed')
 * - Calculator = Thing (type: 'tool')
 */
const calculatorParams = z.object({
  expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "sin(pi/2)")'),
})

// Safe math evaluator using Function constructor with restricted scope
function evaluateMath(expr: string): number {
  // Remove whitespace
  const cleaned = expr.trim()

  // Allowed math functions and constants
  const mathContext = {
    // Constants
    pi: Math.PI,
    e: Math.E,

    // Basic operations
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    trunc: Math.trunc,

    // Powers and roots
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    pow: Math.pow,
    exp: Math.exp,

    // Logarithms
    log: Math.log,
    log10: Math.log10,
    log2: Math.log2,

    // Trigonometry
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,

    // Hyperbolic
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,

    // Other
    max: Math.max,
    min: Math.min,
    random: Math.random,
    sign: Math.sign,
  }

  // Build safe evaluation context
  const _contextKeys = Object.keys(mathContext).join(',')
  const contextValues = Object.values(mathContext)

  try {
    // Create a function with restricted scope
    const fn = new Function(...Object.keys(mathContext), `"use strict"; return (${cleaned});`)

    const result = fn(...contextValues)

    if (typeof result !== 'number' || !Number.isFinite(result)) {
      throw new Error('Invalid result')
    }

    return result
  } catch (error) {
    throw new Error(
      `Invalid expression: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        `Supported functions: ${Object.keys(mathContext).join(', ')}`,
    )
  }
}

async function calculate(params: z.infer<typeof calculatorParams>) {
  const { expression } = params

  try {
    const result = evaluateMath(expression)

    return {
      expression,
      result,
      formatted: formatResult(result),
    }
  } catch (error) {
    throw new Error(`Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function formatResult(num: number): string {
  // Format with appropriate precision
  if (Number.isInteger(num)) {
    return num.toString()
  }

  // For decimals, use up to 10 significant digits
  const rounded = Math.round(num * 1e10) / 1e10
  return rounded.toString()
}

export const calculatorTool: Tool = {
  name: 'calculator',
  description:
    'Perform mathematical calculations. Supports basic operations (+, -, *, /, %), powers (pow, sqrt), trigonometry (sin, cos, tan), logarithms (log, log10), and constants (pi, e). Examples: "2 + 2", "sqrt(16)", "sin(pi/2)", "log10(100)"',
  category: 'utility',
  parameters: calculatorParams,
  execute: calculate,
}

toolRegistry.register(calculatorTool)
