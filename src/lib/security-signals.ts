/**
 * Security signal helpers — Cycle 4: LEARN-SIGNALS
 *
 * Every auth failure, probe, replay, or revoke emits a structured
 * security event to TypeDB as an observed hypothesis.
 * Best-effort: failures are silenced so auth paths never throw.
 *
 * emitSecurityEvent() writes the hypothesis only — no world reference here.
 * Callers are responsible for pheromone:
 *   persist.ts  — calls net.warn(`${from}→auth-boundary`, 0.3) at toxic/replay sites
 *   api-auth.ts — calls getNet().warn(`${caller}→auth-boundary`, 0.3) at auth-fail sites
 */
import { writeSilent } from '@/lib/typedb'

export type SecurityEvent =
  | { kind: 'auth-fail'; caller: string; reason: string }
  | { kind: 'replay'; edge: string; nonce: string }
  | { kind: 'toxic'; edge: string }
  | { kind: 'capability-missing'; receiver: string }
  | { kind: 'rate-limit'; edge: string }
  | { kind: 'revoke'; keyId: string; userId: string }

/**
 * Emit a security event to TypeDB as an observed hypothesis.
 * Statement is a JSON snapshot of the event — query with:
 *   `match $h isa hypothesis, has statement $s; $s contains '"kind":"security"';`
 */
export function emitSecurityEvent(event: SecurityEvent): void {
  const ts = new Date().toISOString().replace('Z', '')
  const raw = JSON.stringify(event)
  // Escape backslashes first, then quotes, then truncate
  const statement = raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"').slice(0, 500)
  const hid = `sec-${event.kind}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

  // Promise.resolve() guards against mocked/undefined return values in tests
  void Promise.resolve(
    writeSilent(`
      insert $h isa hypothesis,
        has hid "${hid}",
        has statement "${statement}",
        has hypothesis-status "pending",
        has observations-count 1,
        has p-value 0.0,
        has source "observed",
        has observed-at ${ts},
        has valid-from ${ts};
    `),
  ).catch(() => {})
}
