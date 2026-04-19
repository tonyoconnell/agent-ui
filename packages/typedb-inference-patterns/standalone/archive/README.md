# standalone/archive/ — Pre-TypeDB-3.0 reference material

These files use **TypeDB 2.x `rule` syntax** and are kept for historical reference. They are not loadable against a TypeDB 3.x server and they are not used by the lesson sequence.

## Files

| File | Why archived |
|------|--------------|
| `genesis-pre-3x.tql` (1,449 lines) | Legacy complete colony schema from before the `one.tql` + `world.tql` split. Explicitly superseded by `src/schema/one.tql` (canonical ontology) and `src/schema/world.tql` (runtime schema with modern `fun` classifiers). Rewriting at this size would be redundant — read the production schemas instead. |
| `launchpad-pre-3x.tql` (509 lines) | "Token Launch Intelligence Layer" overlay. Depends on `genesis.tql` for its base colony primitives — becomes meaningless now that `genesis.tql` is archived. The domain logic (token quality / graduation prediction / entry zones) could be resurrected as a 3.x overlay on `world.tql`, but no consumer currently needs it. |

## If you want the 3.x equivalent

For the *substrate* (units, paths, signals, pheromone classification):
- `src/schema/one.tql` — 6-dimension ontology, 272 lines, stable
- `src/schema/world.tql` — runtime schema, 787 lines, uses `fun path_status`, `fun unit_classification`, `fun preflight` (the deterministic sandwich as a function chain)

For the *lesson* on rules-as-functions (what `quality-rules.tql` / `hypothesis-lifecycle.tql` / `task-management.tql` now demonstrate with current 3.x syntax):
- See their sibling files in `../` (not `archive/`) — all three were migrated to 3.x 2026-04-20.

For *domain overlays* (token launches, IoT, social networks, etc.):
- See `../../examples/*.tql` — each is a standalone domain demonstration.

## If you really need to read these files

Treat them as *pedagogical artefacts*. The schema shapes, entity attributes, and classification logic are still correct. Only the `rule name: when { } then { };` syntax is retired; every rule translates mechanically to a `fun name() -> type : match ... return ...;` per the pattern in `../../README.md`.
