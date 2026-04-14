#!/bin/bash
# TASK-COMPLETE VERIFY — The W4 Gate
#
# Runs on TaskCompleted. Blocks task mark if tests regress.
# This is the gate between signal and pheromone — prevents corruption.
#
# Exit 0 = task marked (all checks pass)
# Exit 1 = task blocked (tests regressed or type errors detected)

cd "$CLAUDE_PROJECT_DIR" || exit 1

# Run the full verify suite
RESULT=$(bun run verify 2>&1)
EXIT=$?

if [ $EXIT -eq 0 ]; then
  # All checks passed
  exit 0
fi

# Verify failed — extract details
echo "W4 GATE BLOCKED: Verification failed" >&2
echo "" >&2

# Extract test counts
PASSED=$(echo "$RESULT" | grep -o '[0-9]* pass' | head -1 | awk '{print $1}')
FAILED=$(echo "$RESULT" | grep -o '[0-9]* fail' | head -1 | awk '{print $1}')
ERRORS=$(echo "$RESULT" | grep -c "error TS" || echo "0")

if [ -n "$FAILED" ] && [ "$FAILED" -gt 0 ]; then
  echo "Tests: $FAILED failed" >&2
fi
if [ "$ERRORS" -gt 0 ]; then
  echo "TypeScript: $ERRORS type errors" >&2
fi

# Show last 15 lines of output for context
echo "" >&2
echo "Last output:" >&2
echo "$RESULT" | tail -15 >&2
echo "" >&2
echo "Fix baseline before marking task done." >&2

exit 1
