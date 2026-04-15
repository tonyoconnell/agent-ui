#!/usr/bin/env python3
"""
ONE Platform - Knowledge Tagging Pre-Hook
Validates that artifacts created will be tagged in the 6-dimension ontology.

This hook runs on PreToolUse to:
- Map artifacts to the correct dimension (groups, people, things, connections, events, knowledge)
- Guide agents to proper documentation paths
- Prepare semantic labels for the knowledge dimension
- Display the ontology structure for context

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
from pathlib import Path
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
# Maps file paths to dimensions and semantic labels
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

def get_dimension_docs(dimension: str) -> str:
    """Get documentation path for a dimension"""
    dimension_docs = {
        "groups": "/one/groups/README.md or /one/knowledge/ontology.md#groups",
        "people": "/one/people/README.md or /one/knowledge/ontology.md#people",
        "things": "/one/things/ or /one/knowledge/ontology.md#things",
        "connections": "/one/connections/ or /one/knowledge/ontology.md#connections",
        "events": "/one/events/ or /one/knowledge/ontology.md#events",
        "knowledge": "/one/knowledge/ or /one/knowledge/ontology.md#knowledge",
    }
    return dimension_docs.get(dimension, "/one/knowledge/ontology.md")

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

def display_ontology_context(dimension: Optional[str], labels: List[str]) -> str:
    """Display the 6-dimension ontology with current dimension highlighted"""
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
        " ← HERE" if dimension == "groups" else "",
        " ← HERE" if dimension == "people" else "",
        " ← HERE" if dimension == "things" else "",
        " ← HERE" if dimension == "connections" else "",
        " ← HERE" if dimension == "events" else "",
        " ← HERE" if dimension == "knowledge" else ""
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

        # Only process PreToolUse for Write/Edit operations
        if hook_event != "PreToolUse":
            sys.exit(0)

        file_path = tool_input.get("file_path")
        if not file_path:
            sys.exit(0)

        # Check if should be tagged as knowledge
        if not should_tag_as_knowledge(file_path, tool_name):
            sys.exit(0)

        # Prepare knowledge metadata
        artifact_type = get_artifact_type(file_path)
        labels = get_knowledge_labels(file_path)
        dimension = get_ontology_dimension(file_path)

        # Output pre-hook message
        msg = f"📚 Knowledge Pre-Hook - 6-Dimension Ontology\n"
        msg += f"   Artifact: {Path(file_path).name}\n"
        msg += f"   Type: {artifact_type}\n"

        if dimension:
            msg += f"   Dimension: {dimension.upper()}\n"
            msg += f"   Docs: {get_dimension_docs(dimension)}\n"

        msg += f"   Labels: {', '.join(labels[:5])}"
        if len(labels) > 5:
            msg += f" (+{len(labels) - 5} more)"

        msg += f"\n   → Will be tagged in knowledge dimension after creation"

        # Show ontology context if dimension is known
        if dimension:
            msg += display_ontology_context(dimension, labels)

        print(msg)
        sys.exit(0)

    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error in knowledge pre-hook: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
