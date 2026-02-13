/**
 * COLONY - The Shared Space Where Units Exist
 *
 * A Colony is not a controller. It is a space.
 * Units are born into the colony. Envelopes travel through it.
 *
 * Like an ant colony:
 *   - No central dispatcher
 *   - Units are autonomous
 *   - Envelopes (ants) know their journey
 *   - The colony just provides the space for interaction
 *
 * STIGMERGY: Indirect communication through the environment.
 * Ants don't talk to each other — they leave scent trails.
 * Other ants smell the trails and follow strong ones.
 * This is how superhighways emerge.
 */

import { unit } from "./unit";
import type { Envelope, Unit } from "./unit";

/**
 * Colony Error - when routing fails
 */
interface ColonyError {
  receiver: string;
  receive?: string;
  error: string;
}

/**
 * JSON format for spawning units from static data
 */
interface UnitJSON {
  id: string;
  name?: string;
  actions?: Record<string, unknown>;
}

/**
 * A trail with its scent strength
 */
interface Highway {
  trail: string;
  strength: number;
}

/**
 * Colony - the space where units exist
 */
interface Colony {
  // Chambers
  spawn: (envelope: Envelope) => Unit;
  spawnFromJSON: (data: UnitJSON) => Unit;
  has: (id: string) => boolean;
  list: () => string[];
  get: (id: string) => Unit | undefined;
  units: Record<string, Unit>;

  // Movement
  send: (envelope: Envelope) => Promise<unknown>;

  // Stigmergy
  mark: (trail: string, strength?: number) => void;
  smell: (trail: string) => number;
  fade: (rate?: number) => void;
  highways: (limit?: number) => Highway[];
  scent: Record<string, number>;
}

/**
 * Create a colony - a space for units to exist and communicate.
 */
const colony = (): Colony => {
  const units: Record<string, Unit> = {};
  const scent: Record<string, number> = {};  // The shared environment — pheromone trails

  /**
   * Mark a trail with scent (deposit pheromone).
   */
  const mark = (trail: string, strength: number = 1): void => {
    scent[trail] = (scent[trail] || 0) + strength;
  };

  /**
   * Route an envelope to its receiver.
   * When an ant completes its journey, it strengthens the trail.
   */
  const send = ({ receiver, receive, payload, callback }: Envelope): Promise<unknown> => {
    const target = units[receiver!];

    if (!target) {
      return Promise.reject({
        receiver,
        receive,
        error: `Unknown unit: ${receiver}`
      } as ColonyError);
    }

    // Forward to the target unit
    return target({ receive, payload, callback }).then((result) => {
      // Ant completed journey — strengthen the trail
      mark(`${receiver}:${receive}`, 1);
      return result;
    });
  };

  /**
   * Spawn a unit into the colony.
   */
  const spawn = (envelope: Envelope): Unit => {
    const u = unit(envelope, send);
    units[u.id] = u;
    return u;
  };

  /**
   * Spawn a unit from JSON data (static actions).
   */
  const spawnFromJSON = (data: UnitJSON): Unit => {
    const u = spawn({ receiver: data.id });
    for (const [name, result] of Object.entries(data.actions || {})) {
      u.assign(name, () => result);
    }
    return u;
  };

  /**
   * Smell a trail (read pheromone strength).
   */
  const smell = (trail: string): number => scent[trail] || 0;

  /**
   * Fade all trails (pheromone evaporation).
   */
  const fade = (rate: number = 0.1): void => {
    for (const trail in scent) {
      scent[trail] *= (1 - rate);
      if (scent[trail] < 0.01) delete scent[trail];
    }
  };

  /**
   * Get the strongest trails (emergent superhighways).
   */
  const highways = (limit: number = 10): Highway[] => {
    return Object.entries(scent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([trail, strength]) => ({ trail, strength }));
  };

  // Chamber introspection
  const has = (id: string): boolean => id in units;
  const list = (): string[] => Object.keys(units);
  const get = (id: string): Unit | undefined => units[id];

  return {
    // Chambers
    spawn,
    spawnFromJSON,
    has,
    list,
    get,
    units,

    // Movement
    send,

    // Stigmergy
    mark,
    smell,
    fade,
    highways,
    scent
  };
};

export { colony };
export type { Colony, ColonyError, UnitJSON, Highway };
