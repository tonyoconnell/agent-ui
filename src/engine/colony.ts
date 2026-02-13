/**
 * COLONY - The Substrate for Emergent Intelligence
 *
 * This is the pattern that ants discovered 100 million years ago.
 * The same pattern brains use. The same pattern neural networks use.
 *
 * Nodes that compute.
 * Edges that connect.
 * Weights that learn.
 * Signals that flow.
 * No controller.
 *
 * 85 lines. The foundation of emergent AI.
 */

import { unit } from "./unit";
import type { Envelope, Unit } from "./unit";

interface ColonyError {
  receiver: string;
  receive?: string;
  error: string;
}

interface UnitJSON {
  id: string;
  name?: string;
  actions?: Record<string, unknown>;
}

interface Edge {
  edge: string;
  strength: number;
}

interface Colony {
  // The graph
  chambers: Record<string, Unit>;
  scent: Record<string, number>;

  // Build
  spawn: (envelope: Envelope) => Unit;
  spawnFromJSON: (data: UnitJSON) => Unit;
  has: (id: string) => boolean;
  list: () => string[];
  get: (id: string) => Unit | undefined;

  // Signal flow
  send: (envelope: Envelope, from?: string) => Promise<unknown>;

  // Learning (stigmergy)
  mark: (edge: string, strength?: number) => void;
  smell: (edge: string) => number;
  fade: (rate?: number) => void;
  highways: (limit?: number) => Edge[];
}

const colony = (): Colony => {
  const chambers: Record<string, Unit> = {};  // Nodes
  const scent: Record<string, number> = {};   // Edge weights
  let lastVisited: string | null = null;      // Track previous node

  /**
   * Mark an edge with scent (strengthen the weight).
   */
  const mark = (edge: string, strength: number = 1): void => {
    scent[edge] = (scent[edge] || 0) + strength;
  };

  /**
   * Smell an edge (read the weight).
   */
  const smell = (edge: string): number => scent[edge] || 0;

  /**
   * Fade all edges (weights decay over time).
   */
  const fade = (rate: number = 0.1): void => {
    for (const edge in scent) {
      scent[edge] *= (1 - rate);
      if (scent[edge] < 0.01) delete scent[edge];
    }
  };

  /**
   * Get the strongest edges (emergent superhighways).
   */
  const highways = (limit: number = 10): Edge[] => {
    return Object.entries(scent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([edge, strength]) => ({ edge, strength }));
  };

  /**
   * Route a signal through the network.
   * Edge strengthens on successful traversal.
   */
  const send = ({ receiver, receive, payload, callback }: Envelope, from: string = "entry"): Promise<unknown> => {
    const target = chambers[receiver!];

    if (!target) {
      return Promise.reject({
        receiver,
        receive,
        error: `Unknown chamber: ${receiver}`
      } as ColonyError);
    }

    const currentNode = `${receiver}:${receive}`;

    return target({ receive, payload, callback }).then((result) => {
      // Mark the EDGE from previous node to current node
      const edge = `${from} → ${currentNode}`;
      mark(edge, 1);

      lastVisited = currentNode;

      return result;
    });
  };

  /**
   * Spawn a chamber (node) into the colony.
   */
  const spawn = (envelope: Envelope): Unit => {
    const chamber = unit(envelope, (env: Envelope) => {
      return send(env, lastVisited || "entry");
    });
    chambers[chamber.id] = chamber;
    return chamber;
  };

  /**
   * Spawn from JSON data.
   */
  const spawnFromJSON = (data: UnitJSON): Unit => {
    const u = spawn({ receiver: data.id });
    for (const [name, result] of Object.entries(data.actions || {})) {
      u.assign(name, () => result);
    }
    return u;
  };

  // Introspection
  const has = (id: string): boolean => id in chambers;
  const list = (): string[] => Object.keys(chambers);
  const get = (id: string): Unit | undefined => chambers[id];

  return {
    chambers,
    scent,
    spawn,
    spawnFromJSON,
    has,
    list,
    get,
    send,
    mark,
    smell,
    fade,
    highways
  };
};

export { colony };
export type { Colony, ColonyError, UnitJSON, Edge };
