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

import { unit } from "./unit.js";

/**
 * Create a colony - a space for units to exist and communicate.
 *
 * @returns {Object} Colony with spawn, send, and units
 */
const colony = () => {
  // All units in this colony, indexed by id
  const units = {};

  /**
   * Route an envelope to its receiver.
   * This is the shared "air" through which envelopes travel.
   *
   * @param {Object} envelope - { receiver, receive, payload, callback }
   * @returns {Promise} Result of the receiving unit
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
    return target({ receive, payload, callback });
  };

  /**
   * Spawn a unit into the colony.
   * The unit is born with awareness of the colony's routing.
   *
   * @param {Object} envelope - Birth envelope { receiver: id }
   * @returns {Function} The spawned unit
   */
  const spawn = (envelope) => {
    // Create unit with colony's send as its route function
    const u = unit(envelope, send);
    // Register in the colony
    units[u.id] = u;
    return u;
  };

  /**
   * Spawn a unit from JSON data (static actions).
   * Actions return predetermined results.
   *
   * @param {Object} data - { id, name, actions: { name: result } }
   * @returns {Function} The spawned unit
   */
  const spawnFromJSON = (data) => {
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
  const has = (id) => id in units;

  /**
   * List all unit ids in the colony.
   */
  const list = () => Object.keys(units);

  /**
   * Get a unit by id.
   */
  const get = (id) => units[id];

  return {
    spawn,        // Birth a unit into the colony
    spawnFromJSON,// Birth from static JSON
    send,         // Route an envelope
    has,          // Check if unit exists
    list,         // List all unit ids
    get,          // Get unit by id
    units         // Direct access (for introspection)
  };
};

export { colony };
