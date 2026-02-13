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

import { unit } from "./unit.js";

/**
 * Create a colony - a space for units to exist and communicate.
 */
const colony = () => {
  const units = {};
  const scent = {};  // The shared environment — pheromone trails

  /**
   * Route an envelope to its receiver.
   * When an ant completes its journey, it strengthens the trail.
   */
  const send = ({ receiver, receive, payload, callback }) => {
    const target = units[receiver];

    if (!target) {
      return Promise.reject({
        receiver,
        receive,
        error: `Unknown unit: ${receiver}`
      });
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
  const spawn = (envelope) => {
    const u = unit(envelope, send);
    units[u.id] = u;
    return u;
  };

  /**
   * Spawn a unit from JSON data (static actions).
   */
  const spawnFromJSON = (data) => {
    const u = spawn({ receiver: data.id });
    for (const [name, result] of Object.entries(data.actions || {})) {
      u.assign(name, () => result);
    }
    return u;
  };

  /**
   * Mark a trail with scent (deposit pheromone).
   * Called automatically when ants complete journeys.
   * Can also be called manually to influence routing.
   */
  const mark = (trail, strength = 1) => {
    scent[trail] = (scent[trail] || 0) + strength;
  };

  /**
   * Smell a trail (read pheromone strength).
   * Stronger scent = more ants have traveled this path.
   */
  const smell = (trail) => scent[trail] || 0;

  /**
   * Fade all trails (pheromone evaporation).
   * Call periodically to let unused paths weaken.
   * This is how the colony forgets old routes.
   */
  const fade = (rate = 0.1) => {
    for (const trail in scent) {
      scent[trail] *= (1 - rate);
      if (scent[trail] < 0.01) delete scent[trail];
    }
  };

  /**
   * Get the strongest trails (emergent superhighways).
   */
  const highways = (limit = 10) => {
    return Object.entries(scent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([trail, strength]) => ({ trail, strength }));
  };

  // Chamber introspection
  const has = (id) => id in units;
  const list = () => Object.keys(units);
  const get = (id) => units[id];

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

    // Stigmergy (the missing 20%)
    mark,
    smell,
    fade,
    highways,
    scent
  };
};

export { colony };
