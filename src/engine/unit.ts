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
 */

/**
 * Envelope - The Universal Message Format
 *
 * An envelope is how all communication happens in the system.
 * It answers three questions:
 *   - receive: WHO/WHAT should handle this?
 *   - payload: WHAT data is being sent?
 *   - callback: WHAT happens next?
 *
 * The optional callback creates chains - one envelope triggers another.
 * This is declarative flow control: the message describes its own journey.
 */
interface Envelope<T = unknown> {
  receive?: string;      // Target service name (for receiving)
  receiver?: string;     // Unit identity (for creation)
  payload?: T;           // The data being transmitted
  callback?: Envelope;   // Next envelope in the chain
}

/**
 * UnitError - Structured Error with Full Context
 *
 * When things go wrong, we don't just throw an error.
 * We provide complete context for debugging and routing:
 *   - id: Which unit had the problem?
 *   - target: What service was being called?
 *   - payload: What data was sent?
 *   - error: What went wrong?
 *
 * This enables:
 *   - Intelligent error routing
 *   - Detailed debugging
 *   - Error recovery with full context
 */
interface UnitError {
  id: string;
  target: string;
  payload?: unknown;
  error: unknown;
}

/**
 * Unit - A Callable Entity with Services
 *
 * The Unit interface reveals something unusual:
 * it's a function (callable) with properties.
 *
 * This is the "thing IS its interface" principle in TypeScript.
 * The call signature IS the primary interaction:
 *   unit(envelope) → Promise
 *
 * Everything else (assign, role, has, list, id) supports this.
 */
interface Unit {
  // Primary interface: receive an envelope, return a promise
  (envelope: Envelope): Promise<unknown>;

  // Service management
  assign: <P, R>(name: string, fn: (payload: P) => R) => Unit;
  role: (name: string, service: string, context: Record<string, unknown>) => Unit;

  // Introspection
  has: (name: string) => boolean;
  list: () => string[];

  // Identity
  id: string;
}

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
 */
const substitute = (envelope: Envelope, result: unknown): Envelope => {
  const payload: Record<string, unknown> = {};
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
 */
const unit = (envelope: Envelope): Unit => {
  // Extract identity from the birth envelope
  const { receiver: id } = envelope;

  // Services map: name → function that returns Promise
  // This is private - only accessible through receive
  const s: Record<string, (payload: unknown) => Promise<unknown>> = {};

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
   */
  const receive = (({ receive: t, payload, callback }: Envelope): Promise<unknown> => {
    // Unknown target: reject with context
    // The error carries: who (id), what (target), why (error message)
    // This enables intelligent error routing and debugging
    if (!s[t!]) {
      return Promise.reject({ id, target: t, error: `Unknown target: ${t}` } as UnitError);
    }

    // Execute the service and handle the result
    return s[t!](payload)
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
        Promise.reject({ id, target: t, payload, error } as UnitError)
      );
  }) as Unit;

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
   */
  receive.assign = <P, R>(n: string, f: (payload: P) => R): Unit => (
    s[n] = (p) => Promise.resolve(f(p as P)), receive
  );

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
   */
  receive.role = (n: string, svc: string, ctx: Record<string, unknown>): Unit => (
    s[n] = (p) => s[svc]({ ...ctx, ...(p as Record<string, unknown>) }), receive
  );

  /**
   * Check if a service exists.
   * Enables conditional routing.
   */
  receive.has = (n: string): boolean => n in s;

  /**
   * List all available services.
   * Enables introspection and discovery.
   */
  receive.list = (): string[] => Object.keys(s);

  /**
   * The unit's identity.
   * From the birth envelope's receiver field.
   */
  receive.id = id!;

  // The unit IS the receive function
  return receive;
};

export { unit };
export type { Envelope, Unit, UnitError };
