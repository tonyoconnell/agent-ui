#!/usr/bin/env bash
# SHARED SIGNAL EMITTER — source this from any hook script.
#
# Fire-and-forget POST to /api/signal. Never blocks the hook. If the dev
# server is down, the helper fails silently (curl returns non-zero, we
# swallow it) and the substrate's cold-start protection does the right
# thing — dissolved paths get mild warn() instead of full warn().
#
# Usage:
#   source "$CLAUDE_PROJECT_DIR/.claude/hooks/lib/signal.sh"
#   emit_signal <receiver> <weight> [key=value ...]
#
# Receiver naming (see .claude/skills/signal.md):
#   hook:<event>:<outcome>   — e.g. hook:post-edit:ok, hook:w4-verify:fail
#
# Weight convention (see docs/dictionary.md § Four Outcomes):
#   +1     result     success
#    0     timeout    slow, not bad
#   -0.5   dissolved  missing unit/capability, server down
#   -1     failure    agent produced nothing, tests regressed
#
# Data is flattened to a space-separated key=value string. Keep it
# human-greppable; don't serialize objects. If the telemetry needs
# structured data, use the TypeScript /lib/signalSender.ts path instead.

emit_signal() {
  local receiver="$1"
  local weight="${2:-1}"
  shift 2 || true
  local data="$*"

  # Minimal JSON escaping for the data field (backslash + double-quote).
  data="${data//\\/\\\\}"
  data="${data//\"/\\\"}"

  local url="${ONE_API_URL:-http://localhost:4321}/api/signal"

  # Background the curl so even a 2s timeout never blocks the hook.
  # stderr and stdout both discarded — telemetry failures are not user-visible.
  curl -sS -o /dev/null --max-time 2 -X POST "$url" \
    -H 'Content-Type: application/json' \
    -d "{\"sender\":\"hook\",\"receiver\":\"$receiver\",\"amount\":$weight,\"data\":\"$data\"}" \
    >/dev/null 2>&1 &

  # Always succeed. Rule 1 says the hook closes its loop by emitting;
  # whether the POST lands is a separate concern (the substrate's
  # cold-start toxicity protection handles lost signals gracefully).
  return 0
}
