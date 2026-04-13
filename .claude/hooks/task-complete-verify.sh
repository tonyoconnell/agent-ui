#!/bin/bash
# TASK-COMPLETE VERIFY — The W4 Gate
#
# Runs on TaskCompleted. Blocks task mark if tests regress.
# This is the gate between signal and pheromone — prevents corruption.
#
# Exit 0 = task marked
# Exit 1 = task blocked (tests regressed)

cd "$CLAUDE_PROJECT_DIR" || exit 1

# Run the full verify suite
RESULT=$(npm run verify 2>&1)
EXIT=$?

if [ $EXIT -ne 0 ]; then
  echo "W4 GATE BLOCKED: npm run verify failed" >&2
  echo "Fix baseline before marking task done." >&2
  echo "" >&2
  echo "$RESULT" | tail -20 >&2
  exit 1
fi

# Verify passed — task can be marked
exit 0
