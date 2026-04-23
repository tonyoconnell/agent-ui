import { describe, it, expect } from "bun:test"
import { isAllowed, parseAllowedTargets, type AllowedTargetSet } from "../allowed-targets"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseSet: AllowedTargetSet = {
  version: 1,
  createdAt: "2026-04-23T00:00:00.000Z",
  updatedAt: "2026-04-23T00:00:00.000Z",
  targets: [
    { kind: "address", value: "0xdeadbeef" },
    { kind: "package", value: "0xa5e6bdda" },
    { kind: "move-fn", value: "0x2::coin::transfer" },
  ],
}

// ---------------------------------------------------------------------------
// isAllowed
// ---------------------------------------------------------------------------

describe("isAllowed", () => {
  it("matches an address target by exact string", () => {
    expect(isAllowed(["0xdeadbeef"], baseSet)).toBe(true)
  })

  it("matches a package target by prefix", () => {
    // The package entry is "0xa5e6bdda"; a txTarget that starts with it matches
    expect(isAllowed(["0xa5e6bdda::market::list"], baseSet)).toBe(true)
  })

  it("matches a move-fn target by exact string", () => {
    expect(isAllowed(["0x2::coin::transfer"], baseSet)).toBe(true)
  })

  it("returns true when all targets are allowed (mixed kinds)", () => {
    expect(
      isAllowed(["0xdeadbeef", "0xa5e6bdda::module::fn", "0x2::coin::transfer"], baseSet)
    ).toBe(true)
  })

  it("returns false when one target is not in the list", () => {
    expect(isAllowed(["0xdeadbeef", "0xunknown"], baseSet)).toBe(false)
  })

  it("returns false when no target is in the list", () => {
    expect(isAllowed(["0xbad"], baseSet)).toBe(false)
  })

  it("returns true for an empty txTargets list (vacuously all allowed)", () => {
    expect(isAllowed([], baseSet)).toBe(true)
  })

  it("does not allow a move-fn entry to match a prefix it does not equal", () => {
    // move-fn kind is exact; "0x2::coin::transfer" should NOT match "0x2::coin::transferAll"
    const exactSet: AllowedTargetSet = {
      ...baseSet,
      targets: [{ kind: "move-fn", value: "0x2::coin::transfer" }],
    }
    expect(isAllowed(["0x2::coin::transferAll"], exactSet)).toBe(false)
  })

  it("does not treat an address entry as a prefix matcher", () => {
    // address kind is exact; "0xdead" should NOT match "0xdeadbeef"
    const addrSet: AllowedTargetSet = {
      ...baseSet,
      targets: [{ kind: "address", value: "0xdead" }],
    }
    expect(isAllowed(["0xdeadbeef"], addrSet)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// parseAllowedTargets — valid input
// ---------------------------------------------------------------------------

describe("parseAllowedTargets — valid input", () => {
  it("parses a well-formed AllowedTargetSet", () => {
    const raw = {
      version: 1,
      createdAt: "2026-04-23T00:00:00.000Z",
      updatedAt: "2026-04-23T00:00:00.000Z",
      targets: [
        { kind: "address", value: "0xabc" },
        { kind: "package", value: "0xdef", description: "my pkg" },
        { kind: "move-fn", value: "0x1::module::fn" },
      ],
    }
    const result = parseAllowedTargets(raw)
    expect(result.version).toBe(1)
    expect(result.targets).toHaveLength(3)
    expect(result.targets[1].description).toBe("my pkg")
  })

  it("accepts targets with no description field", () => {
    const raw = {
      version: 1,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      targets: [{ kind: "address", value: "0x1" }],
    }
    const result = parseAllowedTargets(raw)
    expect(result.targets[0].description).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// parseAllowedTargets — invalid input → throws scope-violation
// ---------------------------------------------------------------------------

describe("parseAllowedTargets — invalid input", () => {
  function expectScopeViolation(raw: unknown) {
    let thrown: unknown
    try {
      parseAllowedTargets(raw)
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeDefined()
    expect((thrown as { kind: string }).kind).toBe("scope-violation")
  }

  it("throws for null input", () => expectScopeViolation(null))
  it("throws for a string input", () => expectScopeViolation("not-an-object"))
  it("throws for missing version", () => expectScopeViolation({ targets: [], createdAt: "x", updatedAt: "x" }))
  it("throws when version is not 1", () =>
    expectScopeViolation({ version: 2, targets: [], createdAt: "x", updatedAt: "x" }))
  it("throws when targets is not an array", () =>
    expectScopeViolation({ version: 1, targets: "bad", createdAt: "x", updatedAt: "x" }))
  it("throws when createdAt is missing", () =>
    expectScopeViolation({ version: 1, targets: [], updatedAt: "x" }))
  it("throws when a target has an unknown kind", () =>
    expectScopeViolation({
      version: 1,
      targets: [{ kind: "unknown", value: "0x1" }],
      createdAt: "x",
      updatedAt: "x",
    }))
  it("throws when a target value is not a string", () =>
    expectScopeViolation({
      version: 1,
      targets: [{ kind: "address", value: 123 }],
      createdAt: "x",
      updatedAt: "x",
    }))
})
