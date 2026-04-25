const DISABLE_KEY = "ONEIE_TELEMETRY_DISABLE";
const ENDPOINT = "https://api.one.ie/api/signal";
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 3_600_000;

// Browser-compatible random session ID generation
function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  // Fallback for older browsers
  const arr = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

let tokenCount = 0;
let windowStart = Date.now();
export const sessionId = generateSessionId();

let runtimeDisabled = false;

function isEnabled(): boolean {
  if (runtimeDisabled) return false;
  // Browser: respect window-scoped opt-out flag (auto-set on first failure).
  if (typeof window !== "undefined") {
    if ((window as unknown as { __ONEIE_TELEMETRY_DISABLE__?: boolean }).__ONEIE_TELEMETRY_DISABLE__) return false;
    return true;
  }
  // Node.js: check env var
  if (typeof process !== "undefined" && process.env?.[DISABLE_KEY]) return false;
  return true;
}

function consume(): boolean {
  const now = Date.now();
  if (now - windowStart > RATE_WINDOW_MS) {
    tokenCount = 0;
    windowStart = now;
  }
  if (tokenCount >= RATE_LIMIT) return false;
  tokenCount++;
  return true;
}

export function emit(
  receiver: string,
  tags: string[],
  content?: Record<string, unknown>,
): void {
  if (!isEnabled() || !consume()) return;
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: `toolkit:${sessionId}`,
      receiver,
      data: JSON.stringify({
        tags: ["telemetry", ...tags],
        weight: 1,
        content: { id: sessionId, ...content },
      }),
    }),
  })
    .then((r) => {
      // Auto-degrade after first failure — endpoint unreachable for this session.
      if (r.status >= 400) runtimeDisabled = true;
    })
    .catch(() => {
      runtimeDisabled = true;
    });
}

export function isDisabled(): boolean {
  return !isEnabled();
}
