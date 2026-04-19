#!/usr/bin/env python3
"""
Root Cleanup Hook - 6-Dimension Ontology Aligned

Automatically moves misplaced files from root to appropriate /one/<dimension>/ directories.
Keeps root clean with only essential documentation files.

6-Dimension Ontology:
- groups: Hierarchical containers (organizations, teams, communities)
- people: Authorization & governance (roles, users, governance)
- things: Entities (specs, plans, components, agents)
- connections: Relationships (protocols, workflows, integrations)
- events: Actions & state changes (deployments, releases, reports)
- knowledge: Labels & learning (architecture, patterns, rules, guides)
"""
import os
import re
import shutil
from pathlib import Path
from typing import Optional, Tuple

# Root directory
root_dir = Path("/Users/toc/Server/ONE")

# Files allowed to stay in root (per CLAUDE.md)
ALLOWED_ROOT_FILES = {
    "README.md",
    "LICENSE.md",
    "SECURITY.md",
    "CLAUDE.md",
    "AGENTS.md",
}

# Installation/project folders to ignore (not part of ONE platform docs)
INSTALLATION_FOLDERS = {
    "web", "backend", "apps", "cli", "scripts", "node_modules",
    "docs", "media", "import", ".git", ".claude", ".vscode",
    # Installation-specific folders (examples from codebase)
    "one-inc", "nine-padel", "onei-ie", "one.ie",
}


def classify_file(filename: str, content_preview: str = "") -> Tuple[str, str]:
    """
    Classify a file to determine which dimension directory it belongs to.
    Returns (dimension, reason).
    """
    lower = filename.lower()

    # Groups: Group-specific docs, organization structures
    if any(word in lower for word in ["group", "organization", "org-", "team", "community", "hierarchy"]):
        return ("groups", "Group-related content")

    # People: Roles, governance, authorization
    if any(word in lower for word in ["role", "user", "people", "governance", "authorization", "auth", "permission"]):
        return ("people", "People/authorization content")

    # Things: Specifications, plans, components, agents, features
    if any(word in lower for word in [
        "spec", "plan", "component", "agent", "feature",
        "implementation", "design", "blueprint", "architecture-diagram"
    ]):
        return ("things", "Thing/entity specification")

    # Connections: Protocols, workflows, integrations, relationships
    if any(word in lower for word in [
        "protocol", "workflow", "integration", "connection",
        "api", "sync", "communication", "relationship"
    ]):
        return ("connections", "Connection/protocol content")

    # Events: Deployments, releases, reports, audits, summaries
    if any(word in lower for word in [
        "deploy", "release", "report", "audit", "summary",
        "event", "log", "history", "status", "result", "demo", "deliverable"
    ]):
        return ("events", "Event/report content")

    # Knowledge: Architecture, patterns, rules, guides, documentation
    if any(word in lower for word in [
        "guide", "pattern", "rule", "architecture", "knowledge",
        "best-practice", "convention", "standard", "ontology",
        "documentation", "tutorial", "learning"
    ]):
        return ("knowledge", "Knowledge/learning content")

    # Default to events for unclassified files (reports, misc docs)
    return ("events", "General documentation/report")


def is_installation_folder(path: Path) -> bool:
    """Check if a path is within an installation folder."""
    parts = path.parts
    root_parts = root_dir.parts

    if len(parts) <= len(root_parts):
        return False

    # Get the immediate subdirectory of root
    subdir = parts[len(root_parts)]
    return subdir in INSTALLATION_FOLDERS


def move_file(file_path: Path) -> Optional[Tuple[str, str, str]]:
    """
    Move a file to the appropriate dimension directory.
    Returns (filename, dimension, reason) if moved, None if skipped.
    """
    filename = file_path.name

    # Skip allowed files
    if filename in ALLOWED_ROOT_FILES:
        return None

    # Read first 500 chars for classification hints
    content_preview = ""
    try:
        if file_path.suffix in [".md", ".txt"]:
            content_preview = file_path.read_text(encoding="utf-8", errors="ignore")[:500]
    except:
        pass

    # Classify the file
    dimension, reason = classify_file(filename, content_preview)

    # Create destination directory
    dest_dir = root_dir / "one" / dimension
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Move file
    try:
        dest = dest_dir / filename

        # Handle duplicates by appending number
        counter = 1
        while dest.exists():
            stem = file_path.stem
            suffix = file_path.suffix
            dest = dest_dir / f"{stem}_{counter}{suffix}"
            counter += 1

        shutil.move(str(file_path), str(dest))
        return (filename, dimension, reason)
    except Exception as e:
        print(f"❌ Failed to move {filename}: {e}")
        return None


def main():
    """Main cleanup routine."""
    files_moved = []
    files_skipped = []

    # Process markdown files
    for file_path in root_dir.glob("*.md"):
        result = move_file(file_path)
        if result:
            files_moved.append(result)
        else:
            files_skipped.append(file_path.name)

    # Process text files (deliverables, notes)
    for file_path in root_dir.glob("*.txt"):
        # Skip git-related files
        if file_path.name in {"package-lock.txt", ".gitignore"}:
            continue

        result = move_file(file_path)
        if result:
            files_moved.append(result)

    # Report results
    print("=" * 70)
    print("🧹 ROOT CLEANUP - 6-Dimension Ontology Alignment")
    print("=" * 70)
    print()

    if files_moved:
        print(f"✅ Moved {len(files_moved)} files to dimension directories:")
        print()

        # Group by dimension
        by_dimension = {}
        for filename, dimension, reason in files_moved:
            if dimension not in by_dimension:
                by_dimension[dimension] = []
            by_dimension[dimension].append((filename, reason))

        for dimension in ["groups", "people", "things", "connections", "events", "knowledge"]:
            if dimension in by_dimension:
                files = by_dimension[dimension]
                print(f"  📁 /one/{dimension}/ ({len(files)} files)")
                for filename, reason in files:
                    print(f"     • {filename}")
                    print(f"       └─ {reason}")
                print()

    if files_skipped:
        print(f"✅ Kept {len(files_skipped)} essential files in root:")
        for f in sorted(files_skipped):
            print(f"   • {f}")
        print()

    if not files_moved and not files_skipped:
        print("✅ Root is clean - no files to move!")
        print()

    print("=" * 70)
    print("📖 Approved root files: README.md, LICENSE.md, SECURITY.md,")
    print("   CLAUDE.md, AGENTS.md")
    print()
    print("📁 6 Dimensions: groups, people, things, connections, events, knowledge")
    print("=" * 70)


if __name__ == "__main__":
    main()
