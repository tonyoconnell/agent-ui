/**
 * UNIT - The Atom of the Envelope System
 *
 * A Unit is the smallest indivisible piece of computation.
 * It embodies a profound insight: a thing IS its interface.
 *
 * The Unit IS the receive function, with properties attached.
 *
 * Everything flows through one pattern:
 *   envelope in → promise out
 */

/**
 * Substitute {{result}} patterns in an envelope's payload.
 * This is how data flows between chained operations.
 */
const substitute = (envelope, result) => {
  const payload = {};
  for (const [k, v] of Object.entries(envelope.payload || {})) {
    payload[k] = v === "{{result}}" ? result : v;
  }
  return { ...envelope, payload };
};

/**
 * Create a Unit from an envelope.
 *
 * @param {Object} envelope - Birth envelope with { receiver: id }
 * @param {Function} route - Optional external routing for cross-unit communication
 * @returns {Function} A receive function (the Unit itself)
 */
const unit = (envelope, route) => {
  const { receiver: id } = envelope;
  const s = {};

  /**
   * The receive function IS the unit.
   * Single entry point. Envelope in, promise out.
   */
  const receive = ({ receive: t, payload, callback }) => {
    // Unknown target: reject with context
    if (!s[t]) {
      return Promise.reject({ id, target: t, error: `Unknown target: ${t}` });
    }

    return s[t](payload)
      .then((result) => {
        if (callback) {
          const next = substitute(callback, result);
          // Cross-unit routing: different receiver + route function available
          if (next.receiver && next.receiver !== id && route) {
            return route(next);
          }
          // Local routing: same unit or no external route
          return receive(next);
        }
        return result;
      })
      .catch((error) =>
        Promise.reject({ id, target: t, payload, error })
      );
  };

  /**
   * Assign a service to this unit.
   * Services are the "verbs" - what the unit can do.
   */
  receive.assign = (n, f) => (s[n] = (p) => Promise.resolve(f(p)), receive);

  /**
   * Assign a role (context-bound service).
   * Same logic, different perspective.
   */
  receive.role = (n, svc, ctx) => (s[n] = (p) => s[svc]({ ...ctx, ...p }), receive);

  /**
   * Check if a service exists.
   */
  receive.has = (n) => n in s;

  /**
   * List all available services.
   */
  receive.list = () => Object.keys(s);

  /**
   * The unit's identity.
   */
  receive.id = id;

  return receive;
};

export { unit };
