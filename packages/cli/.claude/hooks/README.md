# Claude Code Hooks - ONE Platform

Hooks for Claude Code that align with the 6-dimension ontology and cycle-based execution.

## Overview

The hook system logs all hook executions as EVENTS with full ontology context tracking:
- **Cycle number** - Current position in 100-cycle sequence
- **Dimension** - Which dimension is being worked on (groups, people, things, connections, events, knowledge)
- **Specialist agent** - Which AI agent is responsible
- **Duration** - Execution time in milliseconds
- **Exit code** - Success or failure status
- **Ontology version** - Version of ontology specification (1.0.0)

## Hook Logger (hook-logger.sh)

Central logging system that all hooks use.

### Key Features

1. **Ontology-Aware Logging**: Every log entry includes cycle number and dimension
2. **Agent Detection**: Automatically identifies specialist agent from hook name
3. **Event Tracking**: Logs hook execution as structured EVENTS
4. **Performance Monitoring**: Warns if hooks take >5 seconds
5. **Debug Mode**: Optional verbose output to stderr

### Environment Variables

```bash
# Required
CLAUDE_PROJECT_DIR=/path/to/project  # Project root directory

# Optional
LOG_FILE=$CLAUDE_PROJECT_DIR/.claude/hooks.log  # Log file location
DEBUG_MODE=false  # Enable verbose logging to stderr
CYCLE_STATE_FILE=$CLAUDE_PROJECT_DIR/.claude/state/cycle.json  # Cycle state
ONTOLOGY_VERSION=1.0.0  # Ontology specification version
```

### Functions

#### get_cycle_context()
Reads current cycle number from `.claude/state/cycle.json`.

```bash
cycle=$(get_cycle_context)
# Returns: 0-100 (current cycle number)
```

#### get_cycle_dimension(cycle_number)
Maps cycle number to ontology dimension based on 100-cycle sequence.

```bash
dimension=$(get_cycle_dimension 15)
# Returns: "things" (cycle 11-30 = things dimension)
```

**Dimension Mapping:**
- Cycle 1-10: `foundation` (setup and validation)
- Cycle 11-30: `things` (backend schema & frontend components)
- Cycle 31-40: `connections` (integration & relationships)
- Cycle 41-50: `people` (authentication & authorization)
- Cycle 51-60: `knowledge` (RAG & embeddings)
- Cycle 61-70: `quality` (testing & validation)
- Cycle 71-80: `design` (wireframes & UI)
- Cycle 81-90: `events` (performance & optimization)
- Cycle 91-100: `deployment` (deployment & documentation)

#### get_specialist_agent(hook_name)
Detects specialist agent from hook name patterns.

```bash
agent=$(get_specialist_agent "backend-mutation-test")
# Returns: "agent-backend"
```

**Agent Detection Patterns:**
- `*backend*|*mutation*|*query*|*schema*` → agent-backend
- `*frontend*|*component*|*page*|*ui*` → agent-frontend
- `*integration*|*webhook*|*sync*` → agent-integrator
- `*test*|*quality*` → agent-quality
- `*design*|*wireframe*` → agent-designer
- `*clean*|*refactor*` → agent-clean
- `*deploy*|*release*` → agent-ops
- `*problem*|*debug*` → agent-problem-solver
- `*document*|*doc*` → agent-documenter
- Default → agent-director

#### log_message(level, message)
Logs a message with ontology context.

```bash
log_message "INFO" "Processing user entities"
# Output: [2025-11-03 21:32:23] [INFO] [Cycle 15] [things] Processing user entities
```

#### log_hook_execution(hook_name, command, start_time, end_time, exit_code)
Logs hook execution as a structured EVENT.

```bash
start=$(get_time_ms)
# ... execute hook ...
end=$(get_time_ms)
log_hook_execution "backend-mutation" "test" "$start" "$end" 0
```

**Output:**
```
[2025-11-03 21:32:23] [EVENT] hook_executed | hook=backend-mutation | cycle=15 | dimension=things | agent=agent-backend | duration=134ms | exit_code=0 | ontology_version=1.0.0
[2025-11-03 21:32:23] [INFO] [Cycle 15] [things] Hook completed successfully: backend-mutation
```

#### get_time_ms()
Returns current time in milliseconds (cross-platform).

```bash
start=$(get_time_ms)
# Returns: 1762179999000 (Unix timestamp in milliseconds)
```

## Log Format

### Standard Log Entry
```
[timestamp] [level] [Cycle N] [dimension] message
```

Example:
```
[2025-11-03 21:32:23] [INFO] [Cycle 15] [things] Hook completed successfully: backend-mutation
```

### Event Log Entry
```
[timestamp] [EVENT] hook_executed | hook=name | cycle=N | dimension=X | agent=Y | duration=Nms | exit_code=N | ontology_version=X.Y.Z
```

Example:
```
[2025-11-03 21:32:23] [EVENT] hook_executed | hook=backend-mutation | cycle=15 | dimension=things | agent=agent-backend | duration=134ms | exit_code=0 | ontology_version=1.0.0
```

## Usage in Hooks

All hooks should source the logger and use it:

```bash
#!/bin/bash

# Source the logger
source "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-logger.sh"

# Get start time
start_time=$(get_time_ms)

# Your hook logic here
log_message "INFO" "Starting hook execution"

# ... do work ...

# Log completion
end_time=$(get_time_ms)
log_hook_execution "my-hook" "my-command" "$start_time" "$end_time" $?
```

## Ontology Alignment

The hook logger aligns with the 6-dimension ontology:

1. **EVENTS** - Hook executions are logged as events with:
   - `type: hook_executed`
   - `actorId: <agent_id>`
   - `timestamp: <unix_ms>`
   - `metadata: { hook, cycle, dimension, agent, duration, exit_code, ontology_version }`

2. **PEOPLE** - Agent detection identifies which specialist agent (person role) executed the hook

3. **THINGS** - Hooks may operate on things (files, components, schemas)

4. **CONNECTIONS** - Integration hooks track connections between systems

5. **KNOWLEDGE** - Documentation hooks generate knowledge artifacts

6. **GROUPS** - All hooks execute within an organization context

## Testing

Test the logger:

```bash
# Test cycle context
export CLAUDE_PROJECT_DIR=/path/to/project
source .claude/hooks/hook-logger.sh
get_cycle_context
# Should return: 100 (or current cycle)

# Test dimension mapping
get_cycle_dimension 15
# Should return: things

# Test agent detection
get_specialist_agent "backend-mutation-test"
# Should return: agent-backend

# Test complete execution logging
start=$(get_time_ms)
sleep 0.1
end=$(get_time_ms)
log_hook_execution "test-hook" "test" "$start" "$end" 0
# Check .claude/hooks.log for entries
```

## Monitoring

View recent hook executions:

```bash
# Last 10 entries
tail -n 10 .claude/hooks.log

# All events
grep "\[EVENT\]" .claude/hooks.log

# Specific dimension
grep "\[things\]" .claude/hooks.log

# Specific agent
grep "agent=agent-backend" .claude/hooks.log

# Performance issues (>5s)
grep "\[WARN\]" .claude/hooks.log

# Failures
grep "\[ERROR\]" .claude/hooks.log
```

## Best Practices

1. **Always use the logger** - Don't write custom logging
2. **Source at start** - First line should source hook-logger.sh
3. **Log key steps** - Use log_message for important milestones
4. **Track timing** - Always measure hook duration
5. **Handle errors** - Log failures with exit code
6. **Test locally** - Verify hooks work before committing
7. **Monitor performance** - Review logs for slow hooks (>5s)
8. **Use debug mode** - Enable DEBUG_MODE for troubleshooting

## Integration with Cycle System

The hook logger integrates with the cycle-based execution system:

1. Reads current cycle from `.claude/state/cycle.json`
2. Maps cycle to dimension (based on 100-cycle sequence in `one/knowledge/todo.md`)
3. Logs all hook executions with full context
4. Enables tracking of which dimensions are being worked on
5. Provides audit trail for entire feature development

## Version History

- **1.0.0** (2025-11-03) - Initial release with 6-dimension ontology alignment
  - Cycle context tracking
  - Dimension mapping (foundation → deployment)
  - Agent detection (9 specialist agents)
  - Event logging with structured metadata
  - Performance monitoring (>5s warnings)
  - Cross-platform time measurement (macOS + Linux)
  - Debug mode support

## Files

- `hook-logger.sh` - Core logging functions (173 lines)
- `hooks.log` - Log file (generated)
- `README.md` - This documentation

## References

- **6-Dimension Ontology**: `/one/knowledge/ontology.md`
- **100-Cycle Sequence**: `/one/knowledge/todo.md`
- **Agent Definitions**: `/.claude/agents/`
- **Cycle State**: `/.claude/state/cycle.json`

---

**Built with clarity, simplicity, and ontology alignment in mind.**
