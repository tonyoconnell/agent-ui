---
name: typecheck
description: Run TypeScript type checking on the Envelope System
user-invocable: true
allowed-tools: Bash
---

# TypeScript Type Check

Run TypeScript compiler in check mode without emitting files.

## Command

```bash
cd /Users/toc/Server/envelopes && bunx tsc --noEmit
```

## Expected Output

Success:
```
✓ No type errors found
```

Errors:
```
src/components/workspace/AgentWorkspace.tsx:42:5 - error TS2322: Type 'X' is not assignable to type 'Y'.
```

## Configuration

TypeScript config is in `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "jsx": "preserve",
    "jsxImportSource": "react"
  }
}
```

## Common Issues

1. **Missing type imports**: Add `import type { X } from '...'`
2. **Path alias not resolving**: Check `tsconfig.json` paths
3. **JSX errors**: Ensure `"jsx": "preserve"` is set

## Astro Check (includes TypeScript)

```bash
bunx astro check
```

This also validates Astro components and frontmatter.
