/**
 * COLONY - The Substrate for Emergent Intelligence
 *
 * Nodes that compute. Edges that connect.
 * Dual scent: trail + alarm. Marks gate.
 * No controller.
 *
 * Signal. Mark. Alarm. Follow. Fade. Highway.
 */

import { unit } from "./unit";
import type { Signal, Unit } from "./unit";

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
  path: string;
  strength: number;
}

type SignalData = { marks?: boolean; weight?: number; [k: string]: unknown }
const asData = (d: unknown): SignalData => (d && typeof d === 'object' ? d as SignalData : {})

interface Colony {
  // The graph
  chambers: Record<string, Unit>;
  scent: Record<string, number>;
  alarm: Record<string, number>;

  // Build
  spawn: (signal: Signal) => Unit;
  spawnFromJSON: (data: UnitJSON) => Unit;
  has: (id: string) => boolean;
  list: () => string[];
  get: (id: string) => Unit | undefined;

  // Signal flow
  signal: (signal: Signal, from?: string) => Promise<unknown>;

  // Backwards compat
  send: (signal: Signal, from?: string) => Promise<unknown>;

  // Learning (stigmergy)
  mark: (edge: string, strength?: number) => void;
  warn: (edge: string, strength?: number) => void;
  sense: (edge: string) => number;
  danger: (edge: string) => number;
  follow: (type?: string) => string | null;
  fade: (rate?: number) => void;
  highways: (limit?: number) => Edge[];
}

const colony = (): Colony => {
  const chambers: Record<string, Unit> = {};
  const scent: Record<string, number> = {};
  const alarm: Record<string, number> = {};
  let lastVisited: string | null = null;

  const mark = (edge: string, strength: number = 1): void => {
    scent[edge] = (scent[edge] || 0) + strength;
  };

  const warn = (edge: string, strength: number = 1): void => {
    alarm[edge] = (alarm[edge] || 0) + strength;
  };

  const sense = (edge: string): number => scent[edge] || 0;
  const danger = (edge: string): number => alarm[edge] || 0;

  // asymmetric: alarm decays 2x faster (failures forgive)
  const fade = (rate: number = 0.1): void => {
    for (const edge in scent) { scent[edge] *= (1 - rate); if (scent[edge] < 0.01) delete scent[edge]; }
    for (const edge in alarm) { alarm[edge] *= (1 - rate * 2); if (alarm[edge] < 0.01) delete alarm[edge]; }
  };

  const highways = (limit: number = 10): Edge[] => {
    return Object.entries(scent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([path, strength]) => ({ path, strength }));
  };

  // follow strongest trail, penalized by alarm
  const follow = (type?: string): string | null => {
    const trails = Object.entries(scent)
      .filter(([e]) => !type || e.includes(type))
      .map(([e, s]) => [e, s - (alarm[e] || 0)] as const)
      .filter(([, s]) => s > 0)
      .sort(([, a], [, b]) => b - a);
    return trails[0]?.[0].split(' → ').pop()?.split(':')[0] || null;
  };

  const signal = ({ receiver, receive, data, payload, callback }: Signal, from: string = "entry"): Promise<unknown> => {
    const target = chambers[receiver!];

    if (!target) {
      return Promise.reject({
        receiver,
        receive,
        error: `Unknown chamber: ${receiver}`
      } as ColonyError);
    }

    const currentNode = `${receiver}:${receive}`;
    const edge = `${from} → ${currentNode}`;

    // marks gate: only drop pheromone on production signals
    const d = asData(data ?? payload);
    d.marks !== false && mark(edge, d.weight ?? 1);

    const previousNode = lastVisited;
    lastVisited = currentNode;

    return target({ receive, data: data ?? payload, callback }).then((result) => {
      return result;
    }).catch((error) => {
      lastVisited = previousNode;
      return Promise.reject(error);
    });
  };

  const spawn = (sig: Signal): Unit => {
    const chamber = unit(sig, (s: Signal) => {
      return signal(s, lastVisited || "entry");
    });
    chambers[chamber.id] = chamber;
    return chamber;
  };

  const spawnFromJSON = (json: UnitJSON): Unit => {
    const u = spawn({ receiver: json.id });
    for (const [name, result] of Object.entries(json.actions || {})) {
      u.assign(name, () => result);
    }
    return u;
  };

  const has = (id: string): boolean => id in chambers;
  const list = (): string[] => Object.keys(chambers);
  const get = (id: string): Unit | undefined => chambers[id];

  return {
    chambers,
    scent,
    alarm,
    spawn,
    spawnFromJSON,
    has,
    list,
    get,
    signal,
    send: signal,  // backwards compat
    mark,
    warn,
    sense,
    danger,
    follow,
    fade,
    highways
  };
};

export { colony };
export type { Colony, ColonyError, UnitJSON, Edge };
