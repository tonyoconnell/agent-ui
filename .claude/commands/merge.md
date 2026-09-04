# /merge

Merge code from an external repo into one.ie deterministically.

## Usage
```
/merge [source]            # run full loop on source
/merge                     # list candidate sources  
/merge [source] --dry-run  # show what would happen without doing it
/merge [source] --explain  # explain each decision step by step
```

## How it works

1. **Resolve** — `source` can be:
   - An alias from `~/.merge-loop/sources/<alias>.yml`
   - A local path (e.g. `~/path/to/repo`)
   - A GitHub URL (auto-cloned to `~/.merge-loop/clones/<alias>/`)

2. **Declare** — run `declare.ts` to generate `features.md` (cached on source_sha)

3. **G0 gate** — render one-screen summary: source, sha, feature count, estimated files, token budget. Confirm before spending tokens.

4. **Classify** — run `classify.sh` on source. Halt if secrets found.

5. **Deduplicate** — remove bit-exact duplicates from the candidate list.

6. **Translate** — for TRANSLATE-mode features, run `ast-rewrite.ts` with the source's `translate.md`.

7. **Port** — for PORT-mode features, run `port-agents.ts` (zero LLM).

8. **Snapshot before** — `ratchet.sh snapshot`

9. **Land** — write files to trunk.

10. **Snapshot after** — `ratchet.sh snapshot --after`

11. **Compress** — run `compress.sh --dry-run` to flag candidates.

12. **Gates** — run `gates.sh` — fail halts.

13. **G1 gate** — render final summary: what landed, delta_loc, ratchet score. Confirm to fast-forward to trunk.

## Source registry

Sources are registered in `~/.merge-loop/sources/<alias>.yml`:
```yaml
alias: donal
path: ~/Server/donal-marketing
description: "OO Marketing Agency — Donal's agents and website editing features"
translate: ~/.merge-loop/translations/donal-marketing.md
```

For GitHub URLs, the command auto-clones to `~/.merge-loop/clones/<alias>/`.

## Execution

This command calls `scripts/merge-loop/index.ts` to orchestrate the full loop.

Run: `bun run scripts/merge-loop/index.ts "$ARGUMENTS"` where `$ARGUMENTS` is the user's input after `/merge`.
