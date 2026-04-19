#!/usr/bin/env python3
"""
Check for files that don't follow kebab-case naming and validate 6-dimension ontology structure.

The 6-Dimension Ontology:
- groups: Hierarchical containers for collaboration
- people: Authorization & governance
- things: All entities (users, agents, content, etc.)
- connections: All relationships between entities
- events: All actions and state changes
- knowledge: Labels, embeddings, and semantic search
"""
import os
import re
from pathlib import Path

# Valid ontology dimensions
VALID_DIMENSIONS = {'groups', 'people', 'things', 'connections', 'events', 'knowledge'}

# Core infrastructure directories to skip
SKIP_DIRS = {'.git', '.obsidian', '.claude', 'node_modules', '.vscode', '.github'}

# Pattern for kebab-case filenames
KEBAB_CASE_PATTERN = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*\.(md|yaml|yml|json)$')

# Pattern for valid installation folder names (lowercase, hyphens allowed, no spaces)
INSTALLATION_PATTERN = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')

def is_installation_folder(path):
    """Check if a directory looks like an installation folder (not infrastructure)."""
    name = os.path.basename(path)

    # Skip core infrastructure
    if name in {'web', 'backend', 'apps', 'cli', 'scripts', 'docs', 'media', 'import', 'one'}:
        return False
    if name in SKIP_DIRS:
        return False

    # Check if it matches installation naming pattern
    return INSTALLATION_PATTERN.match(name) is not None

def validate_ontology_structure(one_dir):
    """Validate that /one/<dimension>/ follows the 6-dimension ontology."""
    errors = []

    if not os.path.exists(one_dir):
        return []

    # Check for invalid dimension directories
    for item in os.listdir(one_dir):
        item_path = os.path.join(one_dir, item)
        if os.path.isdir(item_path) and item not in SKIP_DIRS:
            if item not in VALID_DIMENSIONS:
                errors.append({
                    'type': 'invalid_dimension',
                    'path': item_path,
                    'dimension': item,
                    'message': f"Invalid dimension '{item}'. Must be one of: {', '.join(sorted(VALID_DIMENSIONS))}"
                })

    return errors

def check_filenames(root_dir):
    """Check filenames in /one/ and installation folders."""
    invalid_files = []

    # Check /one/ directory
    one_dir = os.path.join(root_dir, "one")
    if os.path.exists(one_dir):
        for root, dirs, files in os.walk(one_dir):
            # Skip infrastructure directories
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

            for filename in files:
                if filename.endswith(('.md', '.yaml', '.yml', '.json')):
                    if not KEBAB_CASE_PATTERN.match(filename):
                        filepath = os.path.join(root, filename)
                        # Get relative path for clearer output
                        rel_path = os.path.relpath(filepath, root_dir)

                        # Suggest kebab-case name
                        suggested = filename.lower()
                        suggested = re.sub(r'[^a-z0-9.]+', '-', suggested)
                        suggested = re.sub(r'-+', '-', suggested)
                        suggested = re.sub(r'^-|-$', '', suggested)

                        invalid_files.append({
                            'type': 'invalid_filename',
                            'path': rel_path,
                            'filename': filename,
                            'suggested': suggested,
                            'location': 'ontology'
                        })

    # Check installation folders at root level
    for item in os.listdir(root_dir):
        item_path = os.path.join(root_dir, item)
        if os.path.isdir(item_path) and is_installation_folder(item_path):
            # Found an installation folder - check its files
            for root, dirs, files in os.walk(item_path):
                # Skip infrastructure directories
                dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

                for filename in files:
                    if filename.endswith(('.md', '.yaml', '.yml', '.json')):
                        if not KEBAB_CASE_PATTERN.match(filename):
                            filepath = os.path.join(root, filename)
                            rel_path = os.path.relpath(filepath, root_dir)

                            # Suggest kebab-case name
                            suggested = filename.lower()
                            suggested = re.sub(r'[^a-z0-9.]+', '-', suggested)
                            suggested = re.sub(r'-+', '-', suggested)
                            suggested = re.sub(r'^-|-$', '', suggested)

                            invalid_files.append({
                                'type': 'invalid_filename',
                                'path': rel_path,
                                'filename': filename,
                                'suggested': suggested,
                                'location': f'installation: {item}'
                            })

    return invalid_files

def main():
    root_dir = Path(__file__).parent.parent.parent  # Go up from .claude/hooks/

    print("🔍 Checking 6-Dimension Ontology Structure and File Naming...\n")

    # Validate ontology dimensions
    one_dir = os.path.join(root_dir, "one")
    ontology_errors = validate_ontology_structure(one_dir)

    # Check filenames
    filename_errors = check_filenames(root_dir)

    # Report results
    has_errors = False

    if ontology_errors:
        has_errors = True
        print(f"❌ Found {len(ontology_errors)} ontology structure errors:\n")
        for error in ontology_errors:
            print(f"  {error['path']}")
            print(f"  {error['message']}")
            print(f"  Valid dimensions: groups, people, things, connections, events, knowledge\n")

    if filename_errors:
        has_errors = True
        print(f"❌ Found {len(filename_errors)} files with invalid naming:\n")
        for item in filename_errors:
            print(f"  {item['path']}")
            print(f"  Current:   {item['filename']}")
            print(f"  Suggested: {item['suggested']}")
            print(f"  Location:  {item['location']}")
            print()

    if not has_errors:
        print("✅ All files follow kebab-case naming convention!")
        print("✅ Ontology structure is valid!")
        print()
        print("6-Dimension Ontology:")
        print("  • groups:      Hierarchical containers for collaboration")
        print("  • people:      Authorization & governance")
        print("  • things:      All entities (users, agents, content)")
        print("  • connections: All relationships between entities")
        print("  • events:      All actions and state changes")
        print("  • knowledge:   Labels, embeddings, and semantic search")
    else:
        print("\n📚 Reference: See /one/knowledge/ontology.md for the complete specification")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
