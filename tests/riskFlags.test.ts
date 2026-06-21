import { describe, expect, it } from "vitest";
import { computeRiskFlags } from "../src/scoring/riskFlags";
import { Signal } from "../src/schema/signal";

const signal: Signal = {
  id: "signal_test_flags",
  source: "fast_dex",
  chain: "solana",
  name: "Profile Only",
  detectedAt: "2026-06-21T00:00:00.000Z",
  category: "SCOUT_PREVIEW",
  status: "NEW",
  mantleRelevance: "not_relevant",
};

describe("computeRiskFlags", () => {
  it("marks profile-only scout previews and missing data", () => {
    const flags = computeRiskFlags(signal, []);
    expect(flags).toContain("profile_only_signal");
    expect(flags).toContain("missing_liquidity_data");
    expect(flags).toContain("not_a_buy_signal");
  });
});
