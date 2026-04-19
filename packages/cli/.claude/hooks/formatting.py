#!/usr/bin/env python3
"""
Formatting Hook - ONE Platform
PostToolUse hook that auto-formats TypeScript, Astro, and React files

Triggered after: Edit, Write tools
Formats: .ts, .tsx, .astro files using prettier
Also formats: .json, .css files

Uses prettier with ONE Platform configuration:
- Tailwind v4 CSS formatting
- TypeScript strict mode
- React 19 JSX
- Astro 5 syntax

Exit Codes:
0 - Formatting completed successfully or not needed
1 - Formatting failed (should not block workflow)
"""
import json
import sys
import os
import subprocess
from pathlib import Path

# File extensions to format
FORMATTABLE_EXTENSIONS = {
    '.ts', '.tsx', '.astro', '.json', '.css', '.js', '.jsx', '.md'
}

# Files to skip (generated or config)
SKIP_PATTERNS = [
    '_generated',
    'node_modules',
    '.next',
    'dist',
    'build',
    '.astro',
    'package-lock.json',
    'bun.lockb'
]

def should_format(file_path: str) -> bool:
    """Check if file should be formatted"""
    # Check extension
    ext = Path(file_path).suffix
    if ext not in FORMATTABLE_EXTENSIONS:
        return False

    # Skip generated files and dependencies
    for pattern in SKIP_PATTERNS:
        if pattern in file_path:
            return False

    return True

def format_file(file_path: str) -> tuple[bool, str]:
    """
    Format file using prettier

    Returns:
        (success, message)
    """
    if not os.path.exists(file_path):
        return True, "File does not exist (may have been deleted)"

    try:
        # Determine parser based on extension
        ext = Path(file_path).suffix
        parser_map = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.astro': 'astro',
            '.json': 'json',
            '.css': 'css',
            '.js': 'babel',
            '.jsx': 'babel',
            '.md': 'markdown'
        }
        parser = parser_map.get(ext, 'typescript')

        # Run prettier
        result = subprocess.run(
            ['prettier', '--write', '--parser', parser, file_path],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode == 0:
            return True, f"✅ Formatted: {file_path}"
        else:
            # Prettier errors are warnings, not failures
            return True, f"⚠️  Prettier warning: {result.stderr.strip()}"

    except FileNotFoundError:
        # Prettier not installed - not a blocker
        return True, "⚠️  Prettier not installed (npm install -g prettier)"
    except subprocess.TimeoutExpired:
        return True, f"⚠️  Formatting timeout: {file_path}"
    except Exception as e:
        return True, f"⚠️  Formatting error: {str(e)}"

def check_imports(file_path: str) -> tuple[bool, list[str]]:
    """
    Check import organization and suggest improvements

    Returns:
        (is_organized, suggestions)
    """
    suggestions = []

    try:
        with open(file_path, 'r') as f:
            content = f.read()

        # Check for React 19 edge imports
        if 'react-dom/server' in content and 'react-dom/server.edge' not in content:
            if file_path.endswith('.astro') or 'ssr' in content.lower():
                suggestions.append("💡 Use 'react-dom/server.edge' for Cloudflare Pages SSR")

        # Check for proper path aliases
        if '../' * 3 in content:  # More than 2 levels up
            suggestions.append("💡 Use path alias '@/' instead of '../../../'")

        # Check for Convex direct imports in frontend components
        if 'web/src/components' in file_path:
            if 'from "convex"' in content or "from 'convex'" in content:
                suggestions.append("💡 Import Convex hooks from '@/services' layer, not directly")

        # Check for missing nanostores in frontend-only apps
        if 'web/src/' in file_path and 'useState' in content:
            if 'nanostores' not in content and 'convex' not in content:
                suggestions.append("💡 Consider using nanostores for persistent state (frontend-only)")

    except Exception:
        pass

    return len(suggestions) == 0, suggestions

def main():
    """Main hook entry point"""
    try:
        # Read hook event from stdin
        hook_event = json.loads(sys.stdin.read())

        # Extract file path
        tool_name = hook_event.get("tool_name", "")
        tool_input = hook_event.get("tool_input", {})

        # Only run on Edit and Write operations
        if tool_name not in ["Edit", "Write"]:
            sys.exit(0)

        file_path = tool_input.get("file_path", "")

        # Check if we should format this file
        if not should_format(file_path):
            sys.exit(0)

        # Format the file
        success, message = format_file(file_path)

        # Check imports and organization
        is_organized, suggestions = check_imports(file_path)

        # Print results
        if not success:
            print(message)
        elif suggestions:
            print(f"✅ Formatted: {file_path}")
            print("")
            print("💡 Import Suggestions:")
            for suggestion in suggestions:
                print(f"   {suggestion}")
            print("")

        # Always exit 0 (formatting issues are warnings, not blockers)
        sys.exit(0)

    except Exception as e:
        # Don't fail the workflow on hook errors
        print(f"⚠️  Formatting hook error: {str(e)}", file=sys.stderr)
        sys.exit(0)

if __name__ == "__main__":
    main()
