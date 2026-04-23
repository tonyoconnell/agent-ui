import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { resolveRecipient } from "../resolve-address"

// ---------------------------------------------------------------------------
// fetch mock helpers
// ---------------------------------------------------------------------------

type FetchMockReturn = { ok: boolean; json: () => Promise<unknown> }

function makeFetch(responses: Record<string, FetchMockReturn>) {
  return vi.fn(async (url: string) => {
    for (const [pattern, resp] of Object.entries(responses)) {
      if (url.includes(pattern)) return resp
    }
    return { ok: false, json: async () => ({}) }
  })
}

function ok(data: unknown): FetchMockReturn {
  return { ok: true, json: async () => data }
}

function notFound(): FetchMockReturn {
  return { ok: false, json: async () => ({}) }
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// 1. Valid 0x address paths
// ---------------------------------------------------------------------------

describe("resolveRecipient — 0x address", () => {
  it('source="people" when /u/people returns a handle', async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({
        "/u/people?addr=": ok({ handle: "alice" }),
      }),
    )

    const result = await resolveRecipient("0xabc123")
    expect(result.source).toBe("people")
    expect(result.address).toBe("0xabc123")
    expect(result.displayName).toBe("alice")
  })

  it('source="suins" when /u/people has no handle but SuiNS reverse resolves', async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({
        "/u/people?addr=": ok({}),         // no handle
        "suins.io/api/v1/reverse": ok({ name: "bob.sui" }),
      }),
    )

    const result = await resolveRecipient("0xdeadbeef")
    expect(result.source).toBe("suins")
    expect(result.displayName).toBe("bob.sui")
  })

  it('source="direct" when neither people nor SuiNS knows the address', async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({
        "/u/people?addr=": notFound(),
        "suins.io/api/v1/reverse": notFound(),
      }),
    )

    const result = await resolveRecipient("0x1234567890abcdef")
    expect(result.source).toBe("direct")
    expect(result.address).toBe("0x1234567890abcdef")
    expect(result.displayName).toBeUndefined()
  })

  it('source="direct" when fetch throws (network error)', async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")))

    const result = await resolveRecipient("0xfeedcafe")
    expect(result.source).toBe("direct")
    expect(result.address).toBe("0xfeedcafe")
  })
})

// ---------------------------------------------------------------------------
// 2. SuiNS *.sui name
// ---------------------------------------------------------------------------

describe("resolveRecipient — *.sui name", () => {
  it('source="suins" when SuiNS forward resolves', async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({
        "suins.io/api/v1/resolve": ok({ address: "0xsuinsaddr" }),
      }),
    )

    const result = await resolveRecipient("carol.sui")
    expect(result.source).toBe("suins")
    expect(result.address).toBe("0xsuinsaddr")
    expect(result.displayName).toBe("carol.sui")
  })

  it('source="unresolved" when SuiNS forward returns 404', async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({
        "suins.io/api/v1/resolve": notFound(),
      }),
    )

    const result = await resolveRecipient("nonexistent.sui")
    expect(result.source).toBe("unresolved")
    expect(result.address).toBe("")
  })

  it('source="unresolved" when fetch throws', async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")))
    const result = await resolveRecipient("boom.sui")
    expect(result.source).toBe("unresolved")
  })
})

// ---------------------------------------------------------------------------
// 3. @handle
// ---------------------------------------------------------------------------

describe("resolveRecipient — @handle", () => {
  it('source="people" when /u/people by handle returns address', async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({
        "/u/people?handle=": ok({ address: "0xhandleaddr", handle: "dave" }),
      }),
    )

    const result = await resolveRecipient("@dave")
    expect(result.source).toBe("people")
    expect(result.address).toBe("0xhandleaddr")
    expect(result.displayName).toBe("dave")
  })

  it('source="unresolved" when /u/people has no address for handle', async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({
        "/u/people?handle=": notFound(),
      }),
    )

    const result = await resolveRecipient("@ghost")
    expect(result.source).toBe("unresolved")
    expect(result.address).toBe("")
  })

  it("strips the leading @ before querying", async () => {
    const fetchMock = makeFetch({
      "/u/people?handle=eve": ok({ address: "0xeve", handle: "eve" }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await resolveRecipient("@eve")
    expect(result.source).toBe("people")

    // Verify the URL used didn't include the @ symbol
    const calledUrl = (fetchMock.mock.calls[0][0] as string)
    expect(calledUrl).toContain("handle=eve")
    expect(calledUrl).not.toContain("handle=%40eve")
    expect(calledUrl).not.toContain("handle=@eve")
  })
})

// ---------------------------------------------------------------------------
// 4. Unresolvable raw strings
// ---------------------------------------------------------------------------

describe("resolveRecipient — unresolvable", () => {
  it('returns source="unresolved" for a plain word (not address / .sui / @handle)', async () => {
    vi.stubGlobal("fetch", vi.fn()) // should not be called

    const result = await resolveRecipient("just-some-text")
    expect(result.source).toBe("unresolved")
    expect(result.address).toBe("")
  })

  it('returns source="unresolved" for an empty string', async () => {
    vi.stubGlobal("fetch", vi.fn())
    const result = await resolveRecipient("")
    expect(result.source).toBe("unresolved")
  })

  it("trims whitespace before resolving", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch({
        "suins.io/api/v1/resolve": ok({ address: "0xtrimmed" }),
      }),
    )

    const result = await resolveRecipient("  trimmed.sui  ")
    expect(result.source).toBe("suins")
    expect(result.address).toBe("0xtrimmed")
  })
})
