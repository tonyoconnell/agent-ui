#!/bin/bash

# Security Hook - ONE Platform
# Protects sensitive files and scans for credentials
# Enforces 6-dimension ontology security patterns

set -e

# Get project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# Source the logger
source "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-logger.sh"

# Configuration
FILE_PATH="${1:-}"
MODE="${2:-protect}"  # protect, scan, audit, ontology
ACTION="${3:-warn}"   # warn, block, log

# Sensitive file patterns
SENSITIVE_PATTERNS=(
  "**/.env*"
  "**/secrets/**"
  "**/*secret*"
  "**/.ssh/**"
  "**/*.pem"
  "**/*.p12"
  "**/credentials/**"
  "**/*token*"
  "**/*apikey*"
  "**/*private*"
  "**/installation/**/secrets/**"
)

# Credential regex patterns
CREDENTIAL_PATTERNS=(
  "api[_-]?key[s]?\s*[:=]\s*['\"]?[a-zA-Z0-9_-]{16,}"
  "secret[_-]?key[s]?\s*[:=]\s*['\"]?[a-zA-Z0-9_-]{16,}"
  "password[s]?\s*[:=]\s*['\"]?[a-zA-Z0-9!@#$%^&*()_+-=]{8,}"
  "Bearer [a-zA-Z0-9_.-]{16,}"
  "mongodb://[a-zA-Z0-9_:/@.-]+"
  "postgres://[a-zA-Z0-9_:/@.-]+"
  "CLOUDFLARE_[A-Z_]*=.*"
  "CONVEX_[A-Z_]*=.*"
  "RESEND_[A-Z_]*=.*"
)

# 6-DIMENSION ONTOLOGY SECURITY PATTERNS
# Validates code follows security patterns for each dimension

# GROUPS: Multi-tenant isolation patterns
GROUPS_PATTERNS=(
  "groupId:\s*v\.id\(\"groups\"\)"           # groupId required in args
  "\.get\(args\.groupId\)"                   # Group validation
  "group\.status\s*!==\s*['\"]active['\"]"  # Active group check
  "withIndex\(['\"]group_"                   # Group-scoped indexes
)

# PEOPLE: Authorization patterns
PEOPLE_PATTERNS=(
  "ctx\.auth\.getUserIdentity\(\)"           # Authentication check
  "if\s*\(!identity\)"                       # Auth validation
  "properties\.role"                         # Role checking
  "properties\.userId"                       # User identity linking
)

# THINGS: Entity permission patterns
THINGS_PATTERNS=(
  "isThingType\(args\.type\)"               # Type validation
  "thing\.groupId\s*!==\s*args\.groupId"    # Group ownership check
  "\.get\(.*entityId"                        # Entity access validation
)

# CONNECTIONS: Relationship authorization patterns
CONNECTIONS_PATTERNS=(
  "isConnectionType\(args\.relationshipType\)"  # Type validation
  "fromEntityId.*toEntityId"                     # Bidirectional validation
  "validateConnection"                           # Connection validator
)

# EVENTS: Actor tracking patterns
EVENTS_PATTERNS=(
  "actorId:\s*actor\._id"                   # Actor logging
  "await ctx\.db\.insert\(['\"]events['\"]"  # Event creation
  "type:\s*['\"].*_(created|updated|deleted)" # Event type pattern
  "timestamp:\s*Date\.now\(\)"              # Timestamp required
)

# KNOWLEDGE: Embedding security patterns
KNOWLEDGE_PATTERNS=(
  "embedding:\s*v\.optional"                # Vector storage
  "groupId:\s*v\.id\(\"groups\"\)"         # Knowledge scoped to groups
  "sourceThingId"                           # Source tracking
)

# Log start
log_message "INFO" "security-hook: $MODE mode for ${FILE_PATH:-all files}"
START_TIME=$(get_time_ms)

# Check if file matches sensitive patterns
is_sensitive_file() {
  local file="$1"

  for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    # Convert glob to regex
    local regex=$(echo "$pattern" | sed 's/\*\*/.*/' | sed 's/\*/[^\/]*/')
    if [[ "$file" =~ $regex ]]; then
      return 0
    fi
  done
  return 1
}

# Scan file content for credentials
scan_credentials() {
  local file="$1"

  if [ ! -f "$file" ]; then
    return 0
  fi

  local found=0
  for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
    if grep -qE "$pattern" "$file" 2>/dev/null; then
      local line_num=$(grep -nE "$pattern" "$file" | head -1 | cut -d: -f1)
      echo "⚠️  Line $line_num: Potential credential detected"
      log_message "WARN" "Credential pattern in $file:$line_num"
      found=1
    fi
  done

  return $found
}

# Validate ontology security patterns for a specific dimension
validate_dimension() {
  local file="$1"
  local dimension="$2"

  if [ ! -f "$file" ]; then
    return 0
  fi

  local violations=0

  # Only check TypeScript files in backend/convex
  if [[ ! "$file" =~ backend/convex/.*\.(ts|js)$ ]]; then
    return 0
  fi

  # Detect if file is a mutation (requires stricter checks)
  local is_mutation=0
  if [[ "$file" =~ mutations/ ]]; then
    is_mutation=1
  fi

  # Check for required patterns based on dimension
  case "$dimension" in
    "GROUPS")
      # Mutations must validate groupId
      if [ $is_mutation -eq 1 ]; then
        if ! grep -q "groupId:" "$file" 2>/dev/null; then
          echo "❌ GROUPS: Missing groupId parameter in mutation"
          violations=1
        fi
        if ! grep -qE "\.get\(.*groupId\)" "$file" 2>/dev/null; then
          echo "⚠️  GROUPS: No group validation detected"
          violations=1
        fi
      fi
      ;;
    "PEOPLE")
      # Mutations must authenticate
      if [ $is_mutation -eq 1 ]; then
        if ! grep -q "getUserIdentity()" "$file" 2>/dev/null; then
          echo "❌ PEOPLE: Missing authentication check in mutation"
          violations=1
        fi
      fi
      ;;
    "EVENTS")
      # Mutations creating/updating entities should log events
      if [ $is_mutation -eq 1 ]; then
        if grep -qE "ctx\.db\.insert\(['\"]entities['\"]" "$file" 2>/dev/null; then
          if ! grep -qE "ctx\.db\.insert\(['\"]events['\"]" "$file" 2>/dev/null; then
            echo "⚠️  EVENTS: Entity mutation without event logging"
            violations=1
          fi
          if ! grep -q "actorId:" "$file" 2>/dev/null; then
            echo "⚠️  EVENTS: Event logging without actorId"
            violations=1
          fi
        fi
      fi
      ;;
  esac

  return $violations
}

# Comprehensive ontology security scan
scan_ontology_security() {
  local file="$1"

  if [ ! -f "$file" ]; then
    return 0
  fi

  # Only check backend TypeScript files
  if [[ ! "$file" =~ backend/convex/.*\.(ts|js)$ ]]; then
    return 0
  fi

  echo "🔒 Scanning ontology security patterns: $file"

  local violations=0

  # Check each dimension
  validate_dimension "$file" "GROUPS" GROUPS_PATTERNS
  violations=$((violations + $?))

  validate_dimension "$file" "PEOPLE" PEOPLE_PATTERNS
  violations=$((violations + $?))

  validate_dimension "$file" "EVENTS" EVENTS_PATTERNS
  violations=$((violations + $?))

  # Check for cross-group data leakage patterns (CRITICAL)
  if grep -qE "ctx\.db\.query\(['\"]entities['\"]\)" "$file" 2>/dev/null; then
    if ! grep -q "withIndex" "$file" 2>/dev/null; then
      echo "❌ CRITICAL: Unscoped query detected (potential data leakage)"
      echo "   Use .withIndex('group_type', ...) to scope by groupId"
      violations=$((violations + 1))
    fi
  fi

  # Check for missing soft delete filtering
  if grep -qE "ctx\.db\.query\(['\"]entities['\"]\)" "$file" 2>/dev/null; then
    if ! grep -q "deletedAt" "$file" 2>/dev/null; then
      echo "⚠️  WARNING: Query may return soft-deleted entities"
      echo "   Add .filter(q => q.eq(q.field('deletedAt'), undefined))"
      violations=$((violations + 1))
    fi
  fi

  if [ $violations -eq 0 ]; then
    echo "✅ Ontology security patterns validated"
  else
    log_message "WARN" "Ontology violations in $file: $violations"
  fi

  return $violations
}

# Create audit entry
audit() {
  local file="$1"
  local event="$2"
  local action="$3"

  local audit_file="$CLAUDE_PROJECT_DIR/.claude/security-audit.log"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  echo "[$timestamp] $event | $file | $action" >> "$audit_file"
}

EXIT_CODE=0

case "$MODE" in
  "protect")
    if [ -n "$FILE_PATH" ] && is_sensitive_file "$FILE_PATH"; then
      case "$ACTION" in
        "block")
          echo "🚫 BLOCKED: Cannot modify sensitive file: $FILE_PATH"
          log_message "ERROR" "Blocked: $FILE_PATH"
          audit "$FILE_PATH" "BLOCKED" "sensitive file"
          EXIT_CODE=2
          ;;
        "warn")
          echo "⚠️  WARNING: Modifying sensitive file: $FILE_PATH"
          echo "   Ensure no secrets are being committed"
          log_message "WARN" "Sensitive file modified: $FILE_PATH"
          audit "$FILE_PATH" "WARNED" "sensitive file"
          ;;
        "log")
          log_message "INFO" "Sensitive file access: $FILE_PATH"
          audit "$FILE_PATH" "LOGGED" "sensitive file"
          ;;
      esac
    fi
    ;;

  "scan")
    if [ -n "$FILE_PATH" ] && [ -f "$FILE_PATH" ]; then
      echo "🔍 Scanning $FILE_PATH for credentials..."
      if ! scan_credentials "$FILE_PATH"; then
        echo "✅ No credentials detected"
        audit "$FILE_PATH" "SCAN_PASSED" "clean"
      else
        audit "$FILE_PATH" "SCAN_FAILED" "credentials found"
        if [ "$ACTION" = "block" ]; then
          EXIT_CODE=2
        fi
      fi
    fi
    ;;

  "ontology")
    if [ -n "$FILE_PATH" ] && [ -f "$FILE_PATH" ]; then
      echo "🔒 Validating ontology security patterns..."
      if ! scan_ontology_security "$FILE_PATH"; then
        audit "$FILE_PATH" "ONTOLOGY_PASSED" "compliant"
      else
        echo ""
        echo "📖 Ontology Security Reference:"
        echo "   GROUPS: All mutations must validate groupId and check group.status === 'active'"
        echo "   PEOPLE: All mutations must call ctx.auth.getUserIdentity() and check authentication"
        echo "   THINGS: Use isThingType() to validate entity types from ontology"
        echo "   CONNECTIONS: Validate both fromEntityId and toEntityId belong to same group"
        echo "   EVENTS: Log events with actorId after successful mutations"
        echo "   KNOWLEDGE: Scope embeddings to groupId and track sourceThingId"
        echo ""
        echo "   For details, see: one/knowledge/ontology.md"
        audit "$FILE_PATH" "ONTOLOGY_VIOLATIONS" "security issues found"
        if [ "$ACTION" = "block" ]; then
          EXIT_CODE=2
        else
          EXIT_CODE=1
        fi
      fi
    else
      echo "❌ File not found: $FILE_PATH"
      EXIT_CODE=1
    fi
    ;;

  "audit")
    echo "📋 Security Audit Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "6-DIMENSION ONTOLOGY SECURITY MODEL"
    echo "───────────────────────────────────────"
    echo "1. GROUPS:      Multi-tenant isolation (groupId scoping)"
    echo "2. PEOPLE:      Authentication & authorization (role-based access)"
    echo "3. THINGS:      Entity permissions (type validation)"
    echo "4. CONNECTIONS: Relationship authorization (bidirectional validation)"
    echo "5. EVENTS:      Actor tracking (audit trail)"
    echo "6. KNOWLEDGE:   Embedding security (source tracking)"
    echo ""

    AUDIT_FILE="$CLAUDE_PROJECT_DIR/.claude/security-audit.log"

    if [ -f "$AUDIT_FILE" ]; then
      echo "Recent security events (last 10):"
      echo "───────────────────────────────────────"
      tail -10 "$AUDIT_FILE"
      echo ""
      echo "Statistics:"
      echo "───────────────────────────────────────"
      echo "  Blocked:             $(grep -c "BLOCKED" "$AUDIT_FILE" 2>/dev/null || echo 0)"
      echo "  Warned:              $(grep -c "WARNED" "$AUDIT_FILE" 2>/dev/null || echo 0)"
      echo "  Credential scans failed: $(grep -c "SCAN_FAILED" "$AUDIT_FILE" 2>/dev/null || echo 0)"
      echo "  Ontology violations: $(grep -c "ONTOLOGY_VIOLATIONS" "$AUDIT_FILE" 2>/dev/null || echo 0)"
      echo "  Ontology compliant:  $(grep -c "ONTOLOGY_PASSED" "$AUDIT_FILE" 2>/dev/null || echo 0)"
    else
      echo "No audit log found"
      echo "Run security scans to generate audit trail"
    fi
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ;;

  *)
    echo "❌ Unknown security mode: $MODE"
    echo ""
    echo "Usage: security-hook.sh <file> <mode> <action>"
    echo ""
    echo "Modes:"
    echo "  protect  - Protect sensitive files from modification"
    echo "  scan     - Scan files for hardcoded credentials"
    echo "  ontology - Validate 6-dimension ontology security patterns"
    echo "  audit    - Display security audit summary"
    echo ""
    echo "Actions:"
    echo "  warn  - Display warnings (default)"
    echo "  block - Block operations that fail validation"
    echo "  log   - Log events only"
    EXIT_CODE=1
    ;;
esac

# Log completion
END_TIME=$(get_time_ms)
log_hook_execution "security-hook" "$MODE $FILE_PATH" "$START_TIME" "$END_TIME" "$EXIT_CODE"

exit $EXIT_CODE
