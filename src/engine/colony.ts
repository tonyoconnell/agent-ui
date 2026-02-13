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
 * The colony enables emergence:
 *   Simple units + simple routing = complex behavior
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
 * Colony - the space where units exist
 */
interface Colony {
  spawn: (envelope: Envelope) => Unit;
  spawnFromJSON: (data: UnitJSON) => Unit;
  send: (envelope: Envelope) => Promise<unknown>;
  has: (id: string) => boolean;
  list: () => string[];
  get: (id: string) => Unit | undefined;
  units: Record<string, Unit>;
}

/**
 * Create a colony - a space for units to exist and communicate.
 */
const colony = (): Colony => {
  // All units in this colony, indexed by id
  const units: Record<string, Unit> = {};

  /**
   * Route an envelope to its receiver.
   * This is the shared "air" through which envelopes travel.
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
    return target({ receive, payload, callback });
  };

  /**
   * Spawn a unit into the colony.
   * The unit is born with awareness of the colony's routing.
   */
  const spawn = (envelope: Envelope): Unit => {
    // Create unit with colony's send as its route function
    const u = unit(envelope, send);
    // Register in the colony
    units[u.id] = u;
    return u;
  };

  /**
   * Spawn a unit from JSON data (static actions).
   * Actions return predetermined results.
   */
  const spawnFromJSON = (data: UnitJSON): Unit => {
    const u = spawn({ receiver: data.id });
    // Each action returns its static result
    for (const [name, result] of Object.entries(data.actions || {})) {
      u.assign(name, () => result);
    }
    return u;
  };

  /**
   * Check if a unit exists in the colony.
   */
  const has = (id: string): boolean => id in units;

  /**
   * List all unit ids in the colony.
   */
  const list = (): string[] => Object.keys(units);

  /**
   * Get a unit by id.
   */
  const get = (id: string): Unit | undefined => units[id];

  return {
    spawn,
    spawnFromJSON,
    send,
    has,
    list,
    get,
    units
  };
};

export { colony };
export type { Colony, ColonyError, UnitJSON };
