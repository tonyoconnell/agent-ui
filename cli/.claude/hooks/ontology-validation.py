#!/usr/bin/env python3
"""
Ontology Validation Hook - ONE Platform
PostToolUse hook that validates all code changes map to the 6-dimension ontology

Triggered after: Edit, Write tools
Validates: Entity types, connection types, event types, metadata structures

The 6-Dimension Ontology:
1. groups - Multi-tenant isolation (groupId in all tables)
2. people - Authorization (represented as things with type: 'creator')
3. things - All entities (66 types)
4. connections - All relationships (25 types)
5. events - All actions (67 types)
6. knowledge - RAG and embeddings

Exit Codes:
0 - Validation passed or file not relevant to ontology
1 - Validation failed (ontology violation detected)
"""
import json
import sys
import os
import re
from pathlib import Path

# Valid entity types (66 types from ontology)
VALID_THING_TYPES = {
    # Core (People as Things)
    "creator", "ai_clone", "audience_member", "organization",
    # Business Agents
    "strategy_agent", "research_agent", "marketing_agent", "sales_agent",
    "service_agent", "design_agent", "engineering_agent", "finance_agent",
    "legal_agent", "intelligence_agent",
    # Content
    "blog_post", "video", "podcast", "social_post", "email", "course", "lesson",
    # Products
    "digital_product", "membership", "consultation", "nft",
    # Community
    "community", "conversation", "message",
    # Token
    "token", "token_contract",
    # Knowledge
    "knowledge_item", "embedding",
    # Platform
    "website", "landing_page", "template", "livestream", "recording", "media_asset",
    # Business
    "payment", "subscription", "invoice", "metric", "insight", "prediction", "report",
    # Auth Session
    "session", "oauth_account", "verification_token", "password_reset_token",
    # UI Preferences
    "ui_preferences",
    # Marketing
    "notification", "email_campaign", "announcement", "referral", "campaign", "lead",
    # External
    "external_agent", "external_workflow", "external_connection",
    # Protocol
    "mandate", "product",
    # Workflow
    "idea", "plan", "feature", "test", "design", "task", "lesson"
}

# Valid connection types (25 types from ontology)
VALID_CONNECTION_TYPES = {
    # Ownership
    "owns", "created_by",
    # AI Relationships
    "clone_of", "trained_on", "powers",
    # Content Relationships
    "authored", "generated_by", "published_to", "part_of", "references",
    # Community Relationships
    "member_of", "following", "moderates", "participated_in",
    # Product Relationships
    "holds_tokens", "enrolled_in", "purchased", "subscribed_to",
    # Learning Relationships
    "completed", "taught_by", "mentored_by"
}

# Valid event types (67 types from ontology)
VALID_EVENT_TYPES = {
    # Thing Events
    "thing_created", "thing_updated", "thing_deleted", "thing_published", "thing_archived",
    # Connection Events
    "connection_created", "connection_updated", "connection_deleted",
    # Knowledge Events
    "knowledge_created", "knowledge_updated", "knowledge_deleted", "knowledge_embedded",
    # Content Events
    "content_published", "content_viewed", "content_liked", "content_commented",
    # Community Events
    "user_joined", "user_invited", "message_sent", "conversation_started",
    # Token Events
    "tokens_minted", "tokens_burned", "tokens_transferred", "tokens_purchased",
    # Commerce Events
    "payment_initiated", "payment_completed", "payment_failed", "subscription_created",
    "subscription_renewed", "subscription_cancelled", "purchase_completed",
    # Learning Events
    "lesson_started", "lesson_completed", "course_enrolled", "course_completed",
    # AI Events
    "clone_interacted", "ai_generated", "embedding_created",
    # Task Events
    "task_created", "task_started", "task_completed", "task_failed",
    # Agent Events
    "agent_started", "agent_completed", "agent_failed", "agent_executed",
    # Cycle Events
    "cycle_started", "cycle_completed", "cycle_validated", "cycle_skipped",
    # Blockchain Events (consolidated with metadata.protocol)
    "transaction_sent", "transaction_confirmed", "transaction_failed",
    "block_created", "contract_deployed", "contract_called",
    "token_minted", "token_burned", "token_transferred",
    "proposal_created", "proposal_voted", "proposal_executed",
    "delegation_created", "delegation_revoked",
    # System Events
    "hook_executed", "insight_generated", "prediction_made", "metric_calculated"
}

# Required metadata fields for each table
REQUIRED_METADATA = {
    "groups": ["name", "type", "status"],
    "things": ["groupId", "type", "name", "status"],
    "connections": ["groupId", "type", "fromThingId", "toThingId"],
    "events": ["groupId", "type", "timestamp"],
    "knowledge": ["groupId", "content", "labels"]
}

def validate_file(file_path: str, content: str) -> tuple[bool, list[str]]:
    """
    Validate file for ontology compliance

    Returns:
        (is_valid, issues) - True if valid, False if violations found
    """
    issues = []

    # Only validate backend TypeScript files and schema files
    if not (file_path.endswith('.ts') and ('backend/convex' in file_path or 'web/src/services' in file_path)):
        return True, []

    # Skip generated files
    if '_generated' in file_path or '.test.' in file_path:
        return True, []

    # Check for invalid thing types
    thing_type_pattern = r'''type:\s*["']([^"']+)["']'''
    for match in re.finditer(thing_type_pattern, content):
        thing_type = match.group(1)
        if thing_type not in VALID_THING_TYPES:
            issues.append(f"❌ Invalid thing type: '{thing_type}' (line {content[:match.start()].count(chr(10)) + 1})")
            issues.append(f"   Valid types: {', '.join(sorted(VALID_THING_TYPES))}")

    # Check for invalid connection types
    if 'connections' in file_path or 'connection' in content.lower():
        conn_type_pattern = r'''(?:connectionType|type):\s*["']([^"']+)["']'''
        for match in re.finditer(conn_type_pattern, content):
            conn_type = match.group(1)
            # Only validate if it looks like a connection type (snake_case with specific patterns)
            if '_' in conn_type and conn_type not in VALID_CONNECTION_TYPES:
                if any(conn_type.startswith(prefix) for prefix in ['owns', 'created', 'member', 'following', 'holds', 'enrolled', 'purchased']):
                    issues.append(f"❌ Invalid connection type: '{conn_type}' (line {content[:match.start()].count(chr(10)) + 1})")
                    issues.append(f"   Valid types: {', '.join(sorted(VALID_CONNECTION_TYPES))}")

    # Check for invalid event types
    if 'events' in file_path or 'event' in content.lower():
        event_type_pattern = r'''(?:eventType|type):\s*["']([^"']+)["']'''
        for match in re.finditer(event_type_pattern, content):
            event_type = match.group(1)
            # Only validate if it looks like an event type (snake_case with specific patterns)
            if '_' in event_type and event_type not in VALID_EVENT_TYPES:
                if any(event_type.endswith(suffix) for suffix in ['_created', '_updated', '_deleted', '_completed', '_failed', '_started']):
                    issues.append(f"❌ Invalid event type: '{event_type}' (line {content[:match.start()].count(chr(10)) + 1})")
                    issues.append(f"   Valid types: {', '.join(sorted(VALID_EVENT_TYPES))}")

    # Check for missing groupId in database operations
    if 'ctx.db.insert' in content or 'ctx.db.query' in content:
        # Check for things table operations
        if re.search(r'ctx\.db\.insert\(["\']things["\']', content):
            if 'groupId' not in content:
                issues.append(f"⚠️  Things table insert missing 'groupId' (multi-tenant isolation required)")

        # Check for connections table operations
        if re.search(r'ctx\.db\.insert\(["\']connections["\']', content):
            if 'groupId' not in content:
                issues.append(f"⚠️  Connections table insert missing 'groupId' (multi-tenant isolation required)")

        # Check for events table operations
        if re.search(r'ctx\.db\.insert\(["\']events["\']', content):
            if 'groupId' not in content:
                issues.append(f"⚠️  Events table insert missing 'groupId' (multi-tenant isolation required)")

        # Check for knowledge table operations
        if re.search(r'ctx\.db\.insert\(["\']knowledge["\']', content):
            if 'groupId' not in content:
                issues.append(f"⚠️  Knowledge table insert missing 'groupId' (multi-tenant isolation required)")

    # Check for frontend-only violations (backend code when not requested)
    if file_path.startswith('web/src/'):
        # Check for Convex imports in components (should use services layer)
        if re.search(r'''from\s+["']convex/["']''', content) or re.search(r'''from\s+["']@/convex/["']''', content):
            if 'src/services' not in file_path and 'src/providers' not in file_path:
                issues.append(f"⚠️  Direct Convex import in component (use services layer)")
                issues.append(f"   Import from '@/services' instead of 'convex'")

    return len(issues) == 0, issues

def main():
    """Main hook entry point"""
    try:
        # Read hook event from stdin
        hook_event = json.loads(sys.stdin.read())

        # Extract file path and content
        tool_name = hook_event.get("tool_name", "")
        tool_input = hook_event.get("tool_input", {})

        # Only run on Edit and Write operations
        if tool_name not in ["Edit", "Write"]:
            sys.exit(0)

        file_path = tool_input.get("file_path", "")

        # Get content (different for Edit vs Write)
        if tool_name == "Write":
            content = tool_input.get("content", "")
        else:  # Edit
            # For Edit, we need to read the file (it's already been modified)
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
            except Exception:
                # If file doesn't exist or can't be read, skip validation
                sys.exit(0)

        # Validate file
        is_valid, issues = validate_file(file_path, content)

        if not is_valid:
            print(f"⚠️  Ontology Validation Failed: {file_path}")
            print("")
            for issue in issues:
                print(issue)
            print("")
            print("📖 Reference: /one/knowledge/ontology.md")
            print("🔧 Fix: Use correct ontology types from the 6-dimension specification")
            print("")
            sys.exit(1)

        # Success (silent for valid files)
        sys.exit(0)

    except Exception as e:
        # Don't fail the workflow on hook errors
        print(f"⚠️  Ontology validation hook error: {str(e)}", file=sys.stderr)
        sys.exit(0)

if __name__ == "__main__":
    main()
