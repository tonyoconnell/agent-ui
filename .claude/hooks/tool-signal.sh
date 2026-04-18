#!/usr/bin/env bash
# TOOL SIGNAL EMITTER — every tool call closes its loop
#
# Runs after every PostToolUse. Reads the Claude Code hook JSON payload
# from stdin ($1), classifies the outcome, and emits a substrate signal
# via the canonical `tool:<name>:<outcome>` receiver naming from
# .claude/skills/signal.md.
#
# This is the generic complement to post-edit-check.sh (which does biome
# lint + emits hook:post-edit:*). That hook reports CODE QUALITY; this
# hook reports TOOL USAGE. Both fire on the same PostToolUse event.
#
# Receiver shape: tool:<ToolName>:<outcome>
#   tool:Edit:ok     — file edit succeeded
#   tool:Bash:ok     — bash command exit 0
#   tool:Bash:fail   — bash command exit non-zero
#   tool:Read:ok     — any tool with no error field
#
# Weight convention (docs/dictionary.md § Four Outcomes):
#   +1    success
#   -1    failure (tool_response.error present, or Bash non-zero exit)
#
# Non-goals: never block the tool call, never print errors to user.
# Fire-and-forget, 2s max timeout inherited from emit_signal.

# shellcheck source=lib/signal.sh
source "$CLAUDE_PROJECT_DIR/.claude/hooks/lib/signal.sh"

# Hook payload arrives as JSON on $1. Shape (PostToolUse):
#   { tool_name, tool_input: {...}, tool_response: {...} }
# See: claude-code-events.ts for the streaming-UI event taxonomy
# (this hook consumes the hook-transport shape, which is simpler).
PAYLOAD="$1"
[[ -z "$PAYLOAD" ]] && exit 0

TOOL=$(echo "$PAYLOAD" | jq -r '.tool_name // empty' 2>/dev/null)
[[ -z "$TOOL" ]] && exit 0

# Sanitize: receiver must match ^[a-zA-Z0-9:_-]+$ (signal.ts validateUid).
# Tool names from Claude Code are already safe (Edit, Bash, Read, etc.),
# but MCP tools use `mcp__server__tool` which contains underscores — still safe.
SAFE_TOOL="${TOOL//[^a-zA-Z0-9_-]/}"
[[ -z "$SAFE_TOOL" ]] && exit 0

# Outcome classification:
#   1. If tool_response.error is non-empty → fail
#   2. If Bash and exit code is non-zero → fail
#   3. Otherwise → ok
ERROR=$(echo "$PAYLOAD" | jq -r '.tool_response.error // empty' 2>/dev/null)
OUTCOME="ok"
WEIGHT=1

if [[ -n "$ERROR" ]]; then
  OUTCOME="fail"
  WEIGHT=-1
elif [[ "$TOOL" == "Bash" ]]; then
  # Bash exit code lives at tool_response.exit_code or .interrupted
  EXIT_CODE=$(echo "$PAYLOAD" | jq -r '.tool_response.exit_code // .tool_response.returncode // 0' 2>/dev/null)
  INTERRUPTED=$(echo "$PAYLOAD" | jq -r '.tool_response.interrupted // false' 2>/dev/null)
  if [[ "$EXIT_CODE" != "0" ]] || [[ "$INTERRUPTED" == "true" ]]; then
    OUTCOME="fail"
    WEIGHT=-1
  fi
fi

# Extract a cheap, human-greppable data crumb — don't serialize objects.
# file= for Write/Edit/Read, cmd= (first 60 chars) for Bash, blank otherwise.
DATA=""
case "$TOOL" in
  Write|Edit|MultiEdit|Read|NotebookEdit)
    FILE=$(echo "$PAYLOAD" | jq -r '.tool_input.file_path // .tool_input.notebook_path // .tool_input.path // empty' 2>/dev/null)
    [[ -n "$FILE" ]] && DATA="file=$(basename "$FILE")"
    ;;
  Bash)
    CMD=$(echo "$PAYLOAD" | jq -r '.tool_input.command // empty' 2>/dev/null | head -c 60 | tr '\n' ' ')
    [[ -n "$CMD" ]] && DATA="cmd=$CMD"
    ;;
  Grep|Glob)
    PATTERN=$(echo "$PAYLOAD" | jq -r '.tool_input.pattern // empty' 2>/dev/null | head -c 40)
    [[ -n "$PATTERN" ]] && DATA="pattern=$PATTERN"
    ;;
esac

emit_signal "tool:${SAFE_TOOL}:${OUTCOME}" "$WEIGHT" "$DATA"

exit 0  # Never block — telemetry is fire-and-forget
