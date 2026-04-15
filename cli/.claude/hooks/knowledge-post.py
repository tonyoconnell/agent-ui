#!/usr/bin/env python3
"""
ONE Platform - Knowledge Tagging Post-Hook
Tags created/modified artifacts in the 6-dimension ontology.

This hook runs on PostToolUse to:
- Create knowledge entries for new artifacts
- Tag with semantic labels based on ontology dimensions
- Link knowledge to related things (features, tasks, designs)
- Track cycle context and lessons learned
- Build searchable knowledge base for AI agents

6-Dimension Ontology:
  1. GROUPS       - Multi-tenant isolation (/one/groups/)
  2. PEOPLE       - Authorization & governance (/one/people/)
  3. THINGS       - Entities (66+ types) (/one/things/)
  4. CONNECTIONS  - Relationships (25+ types) (/one/connections/)
  5. EVENTS       - Actions & state changes (/one/events/)
  6. KNOWLEDGE    - Labels, embeddings, RAG (/one/knowledge/)

Reference: /one/knowledge/ontology.md (Version 3.0.0)
"""
import json
import sys
import os
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List

# Knowledge artifact types
KNOWLEDGE_ARTIFACT_TYPES = {
    "code": ["py", "ts", "tsx", "js", "jsx", "astro", "json", "yaml", "yml"],
    "documentation": ["md", "mdx", "txt"],
    "design": ["fig", "sketch", "svg", "png", "jpg"],
    "test": ["test.ts", "test.tsx", "spec.ts", "spec.tsx"],
    "config": ["json", "yaml", "yml", "toml", "ini"],
}

# 6-Dimension Ontology Mapping
ONTOLOGY_DIMENSION_LABELS = {
    # Dimension 1: GROUPS (multi-tenant isolation)
    "/one/groups": ["dimension:groups", "ontology", "multi-tenancy", "isolation"],

    # Dimension 2: PEOPLE (authorization & governance)
    "/one/people": ["dimension:people", "ontology", "authorization", "governance", "roles"],

    # Dimension 3: THINGS (entities)
    "/one/things": ["dimension:things", "ontology", "entities", "specifications"],
    "/backend/convex/schema": ["dimension:things", "schema", "entities", "backend"],
    "/backend/convex/mutations": ["dimension:things", "mutations", "write-operations", "backend"],
    "/backend/convex/queries": ["dimension:things", "queries", "read-operations", "backend"],
    "/backend/convex/services": ["dimension:things", "services", "business-logic", "backend"],
    "/web/src/components": ["dimension:things", "components", "ui", "frontend"],
    "/web/src/pages": ["dimension:things", "pages", "routing", "frontend"],

    # Dimension 4: CONNECTIONS (relationships)
    "/one/connections": ["dimension:connections", "ontology", "relationships", "patterns"],

    # Dimension 5: EVENTS (actions & state changes)
    "/one/events": ["dimension:events", "ontology", "actions", "audit-trail"],

    # Dimension 6: KNOWLEDGE (labels, embeddings, RAG)
    "/one/knowledge": ["dimension:knowledge", "ontology", "documentation", "patterns"],

    # Testing (quality validation across all dimensions)
    "/test": ["dimension:knowledge", "testing", "quality", "validation"],

    # Installation-specific (organization customization)
    "/acme": ["dimension:groups", "installation", "organization", "customization"],
    "/groups/": ["dimension:groups", "group-specific", "team", "department"],
}

def get_artifact_type(file_path: str) -> Optional[str]:
    """Determine artifact type from file path"""
    path = Path(file_path)
    ext = path.suffix.lstrip(".")

    # Check for test files first
    if "test" in path.name or "spec" in path.name:
        return "test"

    # Check by extension
    for artifact_type, extensions in KNOWLEDGE_ARTIFACT_TYPES.items():
        if any(path.name.endswith(e) for e in extensions):
            return artifact_type

    return None

def get_ontology_dimension(file_path: str) -> Optional[str]:
    """Determine which of the 6 dimensions this artifact belongs to"""
    # Check path patterns
    if "/one/groups" in file_path or "/groups/" in file_path:
        return "groups"
    elif "/one/people" in file_path:
        return "people"
    elif "/one/things" in file_path or "/backend/" in file_path or "/web/" in file_path:
        return "things"
    elif "/one/connections" in file_path:
        return "connections"
    elif "/one/events" in file_path:
        return "events"
    elif "/one/knowledge" in file_path or "/test/" in file_path:
        return "knowledge"

    # Check for installation folders (map to groups dimension)
    parts = Path(file_path).parts
    if len(parts) > 1 and parts[0] != "one" and parts[0] != "web" and parts[0] != "backend":
        # This is an installation folder
        return "groups"

    return None

def get_knowledge_labels(file_path: str) -> List[str]:
    """Generate semantic labels based on 6-dimension ontology"""
    labels = []

    # Add dimension-specific labels based on path patterns
    for path_pattern, path_labels in ONTOLOGY_DIMENSION_LABELS.items():
        if path_pattern in file_path:
            labels.extend(path_labels)

    # Add artifact type label
    artifact_type = get_artifact_type(file_path)
    if artifact_type:
        labels.append(f"artifact:{artifact_type}")

    # Add ontology dimension label
    dimension = get_ontology_dimension(file_path)
    if dimension and f"dimension:{dimension}" not in labels:
        labels.append(f"dimension:{dimension}")

    return list(set(labels))  # Remove duplicates

def get_cycle_context() -> Dict[str, Any]:
    """Load current cycle context from state file"""
    try:
        # Try project-specific state first
        state_file = Path("/Users/toc/Server/ONE/.claude/state/cycle.json")
        if state_file.exists():
            with open(state_file, 'r') as f:
                state = json.load(f)
                return {
                    "cycle_number": state.get("current_cycle", 0),
                    "feature": state.get("feature_name", "New Feature"),
                    "organization": state.get("organization", "Default Org"),
                    "person_role": state.get("person_role", "platform_owner"),
                }
    except Exception:
        pass

    # Try global todo state
    try:
        todo_state_path = Path.home() / ".claude" / "todo-state.json"
        if todo_state_path.exists():
            with open(todo_state_path, 'r') as f:
                state = json.load(f)
                return {
                    "cycle_number": state.get("current_cycle", 0),
                    "feature": state.get("feature", "New Feature"),
                    "organization": state.get("organization", "Default Org"),
                    "person_role": state.get("person_role", "platform_owner"),
                }
    except Exception:
        pass

    return {
        "cycle_number": 0,
        "feature": "New Feature",
        "organization": "Default Org",
        "person_role": "platform_owner",
    }

def should_tag_as_knowledge(file_path: str, tool_name: str) -> bool:
    """Determine if artifact should be tagged as knowledge"""
    # Only tag Write and Edit operations
    if tool_name not in ["Write", "Edit", "MultiEdit"]:
        return False

    # Don't tag temporary files
    if "/tmp/" in file_path or "/.temp/" in file_path:
        return False

    # Don't tag generated files
    if "/_generated/" in file_path or "/node_modules/" in file_path:
        return False

    # Only tag known artifact types
    artifact_type = get_artifact_type(file_path)
    if not artifact_type:
        return False

    return True

def generate_content_hash(file_path: str) -> str:
    """Generate SHA256 hash of file content"""
    try:
        with open(file_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()[:16]
    except Exception:
        return ""

def create_knowledge_entry(file_path: str, content: Optional[str] = None) -> Dict[str, Any]:
    """Create knowledge entry for artifact mapped to 6-dimension ontology"""
    path = Path(file_path)
    artifact_type = get_artifact_type(file_path)
    labels = get_knowledge_labels(file_path)
    dimension = get_ontology_dimension(file_path)
    cycle_ctx = get_cycle_context()
    content_hash = generate_content_hash(file_path)

    # Build knowledge entry
    entry = {
        "type": "knowledge_item",
        "artifact_type": artifact_type,
        "ontology_dimension": dimension,  # NEW: Maps to 6-dimension ontology
        "file_path": str(path.absolute()),
        "file_name": path.name,
        "labels": labels,
        "content_hash": content_hash,
        "created_at": datetime.now().isoformat(),
        "cycle_number": cycle_ctx["cycle_number"],
        "feature": cycle_ctx["feature"],
        "organization": cycle_ctx["organization"],
        "created_by_role": cycle_ctx["person_role"],
        "metadata": {
            "file_size": path.stat().st_size if path.exists() else 0,
            "directory": str(path.parent),
            "extension": path.suffix,
            "ontology_version": "3.0.0",  # Track ontology version
        }
    }

    # Add content preview if available
    if content:
        entry["content_preview"] = content[:500] if len(content) > 500 else content
    elif path.exists():
        try:
            with open(path, 'r', encoding='utf-8') as f:
                preview = f.read(500)
                entry["content_preview"] = preview
        except Exception:
            pass

    return entry

def save_knowledge_entry(entry: Dict[str, Any]) -> str:
    """Save knowledge entry to knowledge log"""
    # Create knowledge log directory
    knowledge_log_dir = Path.home() / ".claude" / "knowledge-log"
    knowledge_log_dir.mkdir(parents=True, exist_ok=True)

    # Create daily log file
    log_date = datetime.now().strftime("%Y-%m-%d")
    log_file = knowledge_log_dir / f"knowledge-{log_date}.jsonl"

    # Append entry
    with open(log_file, 'a') as f:
        f.write(json.dumps(entry) + "\n")

    return str(log_file)

def display_ontology_context(dimension: Optional[str]) -> str:
    """Display the 6-dimension ontology with current dimension highlighted"""
    if not dimension:
        return ""

    ontology = """
    6-Dimension Ontology:
    ┌────────────────────────────────────────┐
    │ 1. GROUPS       - Multi-tenant         │{}
    │ 2. PEOPLE       - Authorization        │{}
    │ 3. THINGS       - Entities             │{}
    │ 4. CONNECTIONS  - Relationships        │{}
    │ 5. EVENTS       - Actions              │{}
    │ 6. KNOWLEDGE    - Labels & embeddings  │{}
    └────────────────────────────────────────┘
    """.format(
        " ✓ Captured" if dimension == "groups" else "",
        " ✓ Captured" if dimension == "people" else "",
        " ✓ Captured" if dimension == "things" else "",
        " ✓ Captured" if dimension == "connections" else "",
        " ✓ Captured" if dimension == "events" else "",
        " ✓ Captured" if dimension == "knowledge" else ""
    )
    return ontology

def main():
    """Main hook execution"""
    try:
        # Read hook input from stdin
        hook_input = json.load(sys.stdin)

        hook_event = hook_input.get("hook_event_name")
        tool_name = hook_input.get("tool_name")
        tool_input = hook_input.get("tool_input", {})

        # Only process PostToolUse for Write/Edit operations
        if hook_event != "PostToolUse":
            sys.exit(0)

        file_path = tool_input.get("file_path")
        if not file_path:
            sys.exit(0)

        # Check if should be tagged as knowledge
        if not should_tag_as_knowledge(file_path, tool_name):
            sys.exit(0)

        # Create knowledge entry
        content = tool_input.get("content") or tool_input.get("new_string")
        entry = create_knowledge_entry(file_path, content)

        # Save to knowledge log
        log_file = save_knowledge_entry(entry)

        # Output post-hook message
        artifact_type = entry["artifact_type"]
        labels = entry["labels"]
        cycle_num = entry["cycle_number"]
        dimension = entry["ontology_dimension"]

        msg = f"✨ Knowledge Tagged - 6-Dimension Ontology\n"
        msg += f"   Artifact: {entry['file_name']}\n"
        msg += f"   Type: {artifact_type}\n"

        if dimension:
            msg += f"   Dimension: {dimension.upper()}\n"

        msg += f"   Labels: {', '.join(labels[:5])}"
        if len(labels) > 5:
            msg += f" (+{len(labels) - 5} more)"

        if cycle_num > 0:
            msg += f"\n   Cycle: {cycle_num}/100"

        msg += f"\n   Hash: {entry['content_hash']}"
        msg += f"\n   → Logged to: {Path(log_file).name}"

        # Show ontology context if dimension is known
        if dimension:
            msg += display_ontology_context(dimension)

        print(msg)
        sys.exit(0)

    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error in knowledge post-hook: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
