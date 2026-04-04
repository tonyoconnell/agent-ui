/**
 * UNIT - The Atom of the Substrate
 *
 * A Unit is the smallest indivisible piece of computation.
 * It IS its interface. The receive function IS the unit.
 *
 * Signal in, promise out.
 */

/**
 * Signal - The Universal Primitive
 */
interface Signal<T = unknown> {
  receive?: string;
  receiver?: string;
  data?: T;
  payload?: T;  // backwards compat
  callback?: Signal;
}

/**
 * UnitError - Structured Error with Full Context
 */
interface UnitError {
  id: string;
  target: string;
  data?: unknown;
  error: unknown;
}

/**
 * Unit - A Callable Entity with Services
 */
interface Unit {
  (signal: Signal): Promise<unknown>;
  assign: <P, R>(name: string, fn: (data: P) => R) => Unit;
  role: (name: string, service: string, context: Record<string, unknown>) => Unit;
  has: (name: string) => boolean;
  list: () => string[];
  id: string;
}

/**
 * Route function type for cross-unit communication
 */
type RouteFn = (signal: Signal) => Promise<unknown>;

/**
 * Substitute {{result}} patterns in a signal's data.
 */
const substitute = (signal: Signal, result: unknown): Signal => {
  const source = signal.data || signal.payload || {};
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(source as Record<string, unknown>)) {
    data[k] = v === "{{result}}" ? result : v;
  }
  return { ...signal, data, payload: data };
};

/**
 * Create a Unit from a signal.
 */
const unit = (signal: Signal, route?: RouteFn): Unit => {
  const { receiver: id } = signal;
  const s: Record<string, (data: unknown) => Promise<unknown>> = {};

  const receive = (({ receive: t, data, payload, callback }: Signal): Promise<unknown> => {
    if (!s[t!]) {
      return Promise.reject({ id, target: t, error: `Unknown target: ${t}` } as UnitError);
    }

    return s[t!](data ?? payload)
      .then((result) => {
        if (callback) {
          const next = substitute(callback, result);
          if (next.receiver && next.receiver !== id && route) {
            return route(next);
          }
          return receive(next);
        }
        return result;
      })
      .catch((error) =>
        Promise.reject({ id, target: t, data: data ?? payload, error } as UnitError)
      );
  }) as Unit;

  receive.assign = <P, R>(n: string, f: (data: P) => R): Unit => (
    s[n] = (d) => Promise.resolve(f(d as P)), receive
  );

  receive.role = (n: string, svc: string, ctx: Record<string, unknown>): Unit => (
    s[n] = (d) => s[svc]({ ...ctx, ...(d as Record<string, unknown>) }), receive
  );

  receive.has = (n: string): boolean => n in s;
  receive.list = (): string[] => Object.keys(s);
  receive.id = id!;

  return receive;
};

export { unit };
export type { Signal, Unit, UnitError, RouteFn };
