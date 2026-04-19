#!/usr/bin/env python3
"""
Import Validation Hook for ONE Platform

Validates import statements to enforce architecture boundaries:
1. Frontend cannot import backend code directly (must use Convex client)
2. Backend cannot import frontend code
3. Services must follow proper layering
4. Circular dependencies detected
5. Convex imports use proper patterns

Runs after Edit/Write operations to catch architecture violations.
"""

import os
import sys
import re
from pathlib import Path
from typing import List, Tuple

# ANSI color codes
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'

# Import patterns
IMPORT_PATTERNS = [
    r'import\s+.*?\s+from\s+["\']([^"\']+)["\']',  # ES6 imports
    r'require\(["\']([^"\']+)["\']\)',              # CommonJS require
]

def extract_imports(content: str) -> List[str]:
    """Extract all import paths from file content."""
    imports = []
    for pattern in IMPORT_PATTERNS:
        matches = re.finditer(pattern, content)
        imports.extend([match.group(1) for match in matches])
    return imports

def validate_imports(file_path: str, content: str) -> Tuple[List[str], List[str]]:
    """Validate imports for architecture compliance."""

    issues = []
    warnings = []
    imports = extract_imports(content)

    # Determine file location
    is_frontend = '/web/src/' in file_path or '/apps/' in file_path
    is_backend = '/backend/convex/' in file_path
    is_web_convex = '/web/convex/' in file_path  # Legacy location

    for imp in imports:
        # Rule 1: Frontend cannot import backend directly
        if is_frontend and not is_web_convex:
            # Check for direct backend imports (not through Convex client)
            if '../backend/' in imp or 'backend/convex' in imp:
                if not imp.endswith('/_generated/api'):
                    issues.append(
                        f"Frontend importing backend code directly: '{imp}'\n"
                        f"    Use Convex client (useQuery/useMutation) instead"
                    )

            # Check for server-only imports in client code
            if imp.startswith('convex/server'):
                issues.append(
                    f"Frontend importing server-only code: '{imp}'\n"
                    f"    Use 'convex/react' or 'convex/browser' instead"
                )

        # Rule 2: Backend cannot import frontend code
        if is_backend or is_web_convex:
            if '/web/src/components' in imp or '/web/src/pages' in imp:
                issues.append(
                    f"Backend importing frontend code: '{imp}'\n"
                    f"    Backend must remain headless"
                )

            # Check for React imports in backend
            if imp == 'react' or imp.startswith('react/'):
                issues.append(
                    f"Backend importing React: '{imp}'\n"
                    f"    Backend must be framework-agnostic"
                )

        # Rule 3: Validate Convex import patterns
        if is_backend or is_web_convex:
            # Should use relative imports for local modules
            if imp.startswith('convex/') and not imp.startswith('convex/values'):
                if '_generated' not in imp:
                    warnings.append(
                        f"Using absolute 'convex/' import: '{imp}'\n"
                        f"    Consider using relative imports for local modules"
                    )

            # Validate generated imports
            if '_generated' in imp:
                if not (imp.endswith('/api') or imp.endswith('/server') or imp.endswith('/dataModel')):
                    warnings.append(
                        f"Unusual _generated import: '{imp}'\n"
                        f"    Typically use /api, /server, or /dataModel"
                    )

        # Rule 4: Check for circular dependency indicators
        if '../' in imp:
            # Count how many levels up
            up_levels = imp.count('../')
            if up_levels > 3:
                warnings.append(
                    f"Deep relative import (../{up_levels} levels): '{imp}'\n"
                    f"    May indicate architectural issues"
                )

        # Rule 5: Service layer validation
        if '/services/' in file_path:
            # Services should not import UI components
            if '/components/' in imp or '/pages/' in imp:
                issues.append(
                    f"Service importing UI code: '{imp}'\n"
                    f"    Services must be UI-agnostic"
                )

            # Services should use Effect.ts patterns
            if is_backend and 'effect' not in content.lower():
                warnings.append(
                    f"Service file without Effect.ts imports\n"
                    f"    Consider using Effect.ts for services"
                )

    return issues, warnings

def main():
    """Main hook entry point."""

    # Get file path from environment or command line
    file_path = os.environ.get('CLAUDE_EDIT_FILE') or (sys.argv[1] if len(sys.argv) > 1 else None)

    if not file_path:
        print(f"{YELLOW}⚠ Import Validation: No file path provided{RESET}")
        return 0

    if not os.path.exists(file_path):
        return 0

    # Only validate TypeScript/JavaScript files
    if not file_path.endswith(('.ts', '.tsx', '.js', '.jsx', '.mjs')):
        return 0

    # Skip node_modules, dist, generated files
    if any(skip in file_path for skip in ['node_modules', 'dist', '_generated', '.next', '.git']):
        return 0

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    issues, warnings = validate_imports(file_path, content)

    file_name = os.path.basename(file_path)

    # Print results
    if issues:
        print(f"\n{RED}✗ Import Validation Failed: {file_name}{RESET}")
        for issue in issues:
            print(f"  {RED}ERROR:{RESET} {issue}")
        if warnings:
            print(f"\n{YELLOW}Warnings:{RESET}")
            for warning in warnings:
                print(f"  {YELLOW}⚠{RESET} {warning}")
        return 1

    if warnings:
        print(f"\n{YELLOW}⚠ Import Validation Warnings: {file_name}{RESET}")
        for warning in warnings:
            print(f"  {YELLOW}⚠{RESET} {warning}")
        return 0

    print(f"{GREEN}✓ Import Validation: {file_name} follows architecture boundaries{RESET}")
    return 0

if __name__ == '__main__':
    sys.exit(main())
