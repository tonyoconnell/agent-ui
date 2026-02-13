/**
 * UNIT - The Atom of the Envelope System
 *
 * A Unit is the smallest indivisible piece of computation in this system.
 * It embodies a profound insight: a thing IS its interface.
 *
 * The Unit is not a container that HAS a receive function.
 * The Unit IS the receive function, with properties attached.
 *
 * This collapses the distinction between:
 *   - The actor and the action
 *   - The noun and the verb
 *   - The thing and its behavior
 *
 * Everything flows through one pattern:
 *   envelope in → promise out
 *
 * The envelope is the universal message format:
 *   { receive: "target", payload: data, callback?: nextEnvelope }
 *
 * The promise is the universal response:
 *   - Resolve: the result of computation
 *   - Reject: error with full context (who, what, why)
 */

/**
 * Substitute {{result}} patterns in an envelope's payload.
 *
 * This is how data flows between chained operations.
 * The pattern "{{result}}" is a placeholder that gets replaced
 * with the actual result from the previous computation.
 *
 * This enables declarative pipelines:
 *   "Take the result of step 1 and feed it to step 2"
 *
 * The substitution is shallow (one level) by design.
 * Deep substitution would add complexity without clear benefit.
 *
 * @param {Object} envelope - The envelope containing placeholders
 * @param {*} result - The value to substitute for {{result}}
 * @returns {Object} A new envelope with substitutions applied
 */
const substitute = (envelope, result) => {
  const payload = {};
  for (const [k, v] of Object.entries(envelope.payload || {})) {
    // Only exact match "{{result}}" triggers substitution
    // This is intentional - we want explicit, not magical
    payload[k] = v === "{{result}}" ? result : v;
  }
  return { ...envelope, payload };
};

/**
 * Create a Unit from an envelope.
 *
 * The Unit is born from an envelope - this is significant.
 * The envelope that creates a unit defines its identity.
 *
 *   unit({ receiver: "worker" })
 *
 * This mirrors how entities in the system are addressed:
 * the receiver field names who will receive messages.
 *
 * @param {Object} envelope - Birth envelope with { receiver: id }
 * @returns {Function} A receive function (the Unit itself)
 */
const unit = (envelope) => {
  // Extract identity from the birth envelope
  const { receiver: id } = envelope;

  // Services map: name → function that returns Promise
  // This is private - only accessible through receive
  const s = {};

  /**
   * The receive function IS the unit.
   *
   * It takes an envelope and returns a promise.
   * This is the ONLY way to interact with a unit.
   *
   * The single entry point is a profound constraint:
   *   - All interactions are messages (envelopes)
   *   - All responses are promises (async by default)
   *   - No backdoors, no special access
   *
   * @param {Object} envelope - { receive, payload, callback? }
   * @returns {Promise} Result or structured error
   */
  const receive = ({ receive: t, payload, callback }) => {
    // Unknown target: reject with context
    // The error carries: who (id), what (target), why (error message)
    // This enables intelligent error routing and debugging
    if (!s[t]) {
      return Promise.reject({ id, target: t, error: `Unknown target: ${t}` });
    }

    // Execute the service and handle the result
    return s[t](payload)
      .then((result) => {
        // Callback present: chain to next envelope
        // This enables declarative pipelines without manual orchestration
        if (callback) {
          // Substitute {{result}} with actual result
          const next = substitute(callback, result);
          // Recursive: the next envelope goes through the same receive
          return receive(next);
        }
        // No callback: return the result
        return result;
      })
      .catch((error) =>
        // Wrap all errors with context
        // This is crucial: we never lose information about where errors occur
        Promise.reject({ id, target: t, payload, error })
      );
  };

  /**
   * Assign a service to this unit.
   *
   * A service is a named function that:
   *   - Takes a payload (any shape)
   *   - Returns a result (wrapped in Promise automatically)
   *
   * Services are the "verbs" of the unit - what it can do.
   *
   * Returns the unit for chaining:
   *   unit({ receiver: "x" })
   *     .assign("a", fn1)
   *     .assign("b", fn2)
   *
   * @param {string} n - Service name
   * @param {Function} f - Service implementation
   * @returns {Function} The unit (for chaining)
   */
  receive.assign = (n, f) => (s[n] = (p) => Promise.resolve(f(p)), receive);

  /**
   * Assign a role (context-bound service).
   *
   * A role is a service that wraps another service with preset context.
   * This enables the same logic to behave differently based on role.
   *
   * Example:
   *   .assign("fetch", ({ url, token }) => ...)
   *   .role("fetchAdmin", "fetch", { token: "admin" })
   *   .role("fetchUser", "fetch", { token: "user" })
   *
   * The insight: roles don't add new logic, they add perspective.
   * Same capability, different context.
   *
   * @param {string} n - Role name
   * @param {string} svc - Underlying service name
   * @param {Object} ctx - Context to merge with payload
   * @returns {Function} The unit (for chaining)
   */
  receive.role = (n, svc, ctx) => (s[n] = (p) => s[svc]({ ...ctx, ...p }), receive);

  /**
   * Check if a service exists.
   *
   * Enables conditional routing:
   *   if (unit.has("process")) { ... }
   *
   * @param {string} n - Service name
   * @returns {boolean} True if service exists
   */
  receive.has = (n) => n in s;

  /**
   * List all available services.
   *
   * Enables introspection:
   *   unit.list() → ["add", "mul", "double"]
   *
   * @returns {string[]} Array of service names
   */
  receive.list = () => Object.keys(s);

  /**
   * The unit's identity.
   *
   * This is how the unit is addressed in the system.
   * It comes from the birth envelope's receiver field.
   */
  receive.id = id;

  // The unit IS the receive function
  return receive;
};

export { unit };
