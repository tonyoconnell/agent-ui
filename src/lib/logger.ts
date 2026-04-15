/**
 * logger.ts — secret redactor + safe logger
 *
 * Scans process.env for keys matching sensitive patterns and replaces
 * any matching values found in log output with ***.
 */

const SECRET_KEY_PATTERNS = [/^SUI_/, /KEK/, /SECRET/, /TOKEN/, /API_KEY/]

function collectSecrets(): string[] {
  return Object.entries(process.env)
    .filter(([key]) => SECRET_KEY_PATTERNS.some((p) => p.test(key)))
    .map(([, val]) => val)
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
}

export function redact(input: string): string {
  const secrets = collectSecrets()
  let out = input
  for (const secret of secrets) {
    // Escape regex special chars in the secret value before substituting
    const escaped = secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(new RegExp(escaped, 'g'), '***')
  }
  return out
}

export function safeLog(...args: unknown[]): void {
  console.log(...args.map((a) => redact(String(a))))
}
