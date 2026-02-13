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
 * Envelope - The Universal Message Format
 */
interface Envelope<T = unknown> {
  receive?: string;
  receiver?: string;
  payload?: T;
  callback?: Envelope;
}

/**
 * UnitError - Structured Error with Full Context
 */
interface UnitError {
  id: string;
  target: string;
  payload?: unknown;
  error: unknown;
}

/**
 * Unit - A Callable Entity with Services
 */
interface Unit {
  (envelope: Envelope): Promise<unknown>;
  assign: <P, R>(name: string, fn: (payload: P) => R) => Unit;
  role: (name: string, service: string, context: Record<string, unknown>) => Unit;
  has: (name: string) => boolean;
  list: () => string[];
  id: string;
}

/**
 * Route function type for cross-unit communication
 */
type RouteFn = (envelope: Envelope) => Promise<unknown>;

/**
 * Substitute {{result}} patterns in an envelope's payload.
 * This is how data flows between chained operations.
 */
const substitute = (envelope: Envelope, result: unknown): Envelope => {
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(envelope.payload || {})) {
    payload[k] = v === "{{result}}" ? result : v;
  }
  return { ...envelope, payload };
};

/**
 * Create a Unit from an envelope.
 *
 * @param envelope - Birth envelope with { receiver: id }
 * @param route - Optional external routing for cross-unit communication
 * @returns A receive function (the Unit itself)
 */
const unit = (envelope: Envelope, route?: RouteFn): Unit => {
  const { receiver: id } = envelope;
  const s: Record<string, (payload: unknown) => Promise<unknown>> = {};

  /**
   * The receive function IS the unit.
   * Single entry point. Envelope in, promise out.
   */
  const receive = (({ receive: t, payload, callback }: Envelope): Promise<unknown> => {
    // Unknown target: reject with context
    if (!s[t!]) {
      return Promise.reject({ id, target: t, error: `Unknown target: ${t}` } as UnitError);
    }

    return s[t!](payload)
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
        Promise.reject({ id, target: t, payload, error } as UnitError)
      );
  }) as Unit;

  /**
   * Assign a service to this unit.
   * Services are the "verbs" - what the unit can do.
   */
  receive.assign = <P, R>(n: string, f: (payload: P) => R): Unit => (
    s[n] = (p) => Promise.resolve(f(p as P)), receive
  );

  /**
   * Assign a role (context-bound service).
   * Same logic, different perspective.
   */
  receive.role = (n: string, svc: string, ctx: Record<string, unknown>): Unit => (
    s[n] = (p) => s[svc]({ ...ctx, ...(p as Record<string, unknown>) }), receive
  );

  /**
   * Check if a service exists.
   */
  receive.has = (n: string): boolean => n in s;

  /**
   * List all available services.
   */
  receive.list = (): string[] => Object.keys(s);

  /**
   * The unit's identity.
   */
  receive.id = id!;

  return receive;
};

export { unit };
export type { Envelope, Unit, UnitError, RouteFn };
