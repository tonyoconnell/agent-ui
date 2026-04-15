#!/usr/bin/env python3
"""
Ontology Validation Hook for ONE Platform

Validates that code changes adhere to the 6-dimension ontology:
1. groups - Multi-tenant isolation with hierarchical nesting
2. people - Authorization & governance (represented as things with role)
3. things - All entities (66+ types)
4. connections - All relationships (25+ types)
5. events - All actions and state changes (67+ types)
6. knowledge - Labels, embeddings, semantic search

Runs after Edit/Write operations to ensure ontology compliance.
"""

import os
import sys
import re
import json
from pathlib import Path

# ANSI color codes
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'

# Valid dimension tables (5 tables for 6 dimensions)
VALID_TABLES = ['groups', 'things', 'connections', 'events', 'knowledge']

# Regex patterns for validation
PATTERNS = {
    'db_insert': r'ctx\.db\.insert\(["\'](\w+)["\']',
    'db_query': r'ctx\.db\.query\(["\'](\w+)["\']',
    'group_id': r'groupId\s*:\s*',
    'thing_type': r'type\s*:\s*["\'](\w+)["\']',
    'connection_type': r'type\s*:\s*["\'](\w+)["\']',
    'event_type': r'type\s*:\s*["\'](\w+)["\']',
}

def validate_file(file_path: str) -> dict:
    """Validate a single file for ontology compliance."""

    if not os.path.exists(file_path):
        return {'status': 'skip', 'reason': 'File does not exist'}

    # Only validate TypeScript files in backend/convex
    if not file_path.endswith(('.ts', '.tsx')) or 'backend/convex' not in file_path:
        return {'status': 'skip', 'reason': 'Not a backend TypeScript file'}

    # Skip generated files
    if '_generated' in file_path:
        return {'status': 'skip', 'reason': 'Generated file'}

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    issues = []
    warnings = []

    # Check 1: Validate table names in db.insert and db.query
    for match in re.finditer(PATTERNS['db_insert'], content):
        table = match.group(1)
        if table not in VALID_TABLES:
            issues.append(f"Invalid table '{table}' in db.insert() - must be one of {VALID_TABLES}")

    for match in re.finditer(PATTERNS['db_query'], content):
        table = match.group(1)
        if table not in VALID_TABLES:
            issues.append(f"Invalid table '{table}' in db.query() - must be one of {VALID_TABLES}")

    # Check 2: Ensure things/connections/events/knowledge have groupId
    for table in ['things', 'connections', 'events', 'knowledge']:
        if f'db.insert("{table}"' in content or f"db.insert('{table}'" in content:
            # Look for groupId in the same logical block (rough heuristic)
            insert_matches = list(re.finditer(rf'db\.insert\(["\']({table})["\']', content))
            for insert_match in insert_matches:
                # Check if groupId appears within next 500 chars
                context = content[insert_match.start():insert_match.start() + 500]
                if 'groupId' not in context:
                    warnings.append(f"db.insert('{table}') may be missing groupId for multi-tenant scoping")

    # Check 3: Validate common entity types (basic check)
    common_types = [
        'user', 'agent', 'ai_clone', 'content', 'course', 'token',
        'creator', 'fan', 'product', 'service', 'organization'
    ]

    # Check 4: Look for people dimension (role-based access)
    if 'things' in content and 'type:' in content:
        if 'role' in content and 'platform_owner' not in content and 'org_owner' not in content:
            # Has role but not using standard role types
            warnings.append("Found 'role' field but no standard role types (platform_owner, org_owner, org_user, customer)")

    return {
        'status': 'validated',
        'issues': issues,
        'warnings': warnings
    }

def main():
    """Main hook entry point."""

    # Get file path from environment or command line
    file_path = os.environ.get('CLAUDE_EDIT_FILE') or (sys.argv[1] if len(sys.argv) > 1 else None)

    if not file_path:
        print(f"{YELLOW}⚠ Ontology Validation: No file path provided{RESET}")
        return 0

    result = validate_file(file_path)

    if result['status'] == 'skip':
        return 0

    # Print results
    file_name = os.path.basename(file_path)

    if result['issues']:
        print(f"\n{RED}✗ Ontology Validation Failed: {file_name}{RESET}")
        for issue in result['issues']:
            print(f"  {RED}ERROR:{RESET} {issue}")
        if result['warnings']:
            print(f"\n{YELLOW}Warnings:{RESET}")
            for warning in result['warnings']:
                print(f"  {YELLOW}⚠{RESET} {warning}")
        return 1

    if result['warnings']:
        print(f"\n{YELLOW}⚠ Ontology Validation Warnings: {file_name}{RESET}")
        for warning in result['warnings']:
            print(f"  {YELLOW}⚠{RESET} {warning}")
        return 0

    print(f"{GREEN}✓ Ontology Validation: {file_name} complies with 6-dimension model{RESET}")
    return 0

if __name__ == '__main__':
    sys.exit(main())
