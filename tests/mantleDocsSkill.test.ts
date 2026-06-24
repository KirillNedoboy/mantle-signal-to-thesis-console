import { describe, expect, it } from "vitest";
import {
  isMantleDocsAvailable,
  searchMantleDocs,
  type MantleDocStatus,
} from "../src/skills/mantleDocsSkill";

describe("mantleDocsSkill", () => {
  it("returns MCP_UNAVAILABLE on empty query (never throws)", () => {
    const r = searchMantleDocs("");
    expect(r.status).toBe<MantleDocStatus>("MCP_UNAVAILABLE");
    expect(r.hits).toEqual([]);
    expect(r.warning).toMatch(/empty query/);
    expect(r.reason).toBe("empty query");
  });

  it("returns MCP_UNAVAILABLE when client is missing (no exception)", () => {
    // This is true in any environment where the optional Hermes skill
    // is not installed. The function must never throw and must clearly
    // mark the result as unavailable so the agent loop and tests can
    // detect and surface it.
    const r = searchMantleDocs("Mantle network overview");
    // We accept either "MCP_UNAVAILABLE" (no client) or "ok"/"ok_empty"
    // (client present on this host). The contract is: never throw, always
    // a well-typed result.
    expect(["MCP_UNAVAILABLE", "ok", "ok_empty"]).toContain(r.status);
    expect(r).toHaveProperty("hits");
    expect(r).toHaveProperty("warning");
    expect(r).toHaveProperty("latencyMs");
    expect(r).toHaveProperty("reason");
  });

  it("isMantleDocsAvailable reports client presence explicitly", () => {
    const v = isMantleDocsAvailable();
    // On hosts with the optional skill installed, v.available === true.
    // On hosts without it, v.available === false and v.reason === "client_missing".
    // Either way the call is synchronous and never throws.
    expect(typeof v.available).toBe("boolean");
    expect(v.reason === null || typeof v.reason === "string").toBe(true);
  });
});
