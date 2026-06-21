import { describe, expect, it } from "vitest";
import { SignalSchema } from "../src/schema/signal";

const validSignal = {
  id: "signal_test_123456",
  source: "demo",
  chain: "mantle",
  name: "Test Signal",
  detectedAt: "2026-06-21T00:00:00.000Z",
  category: "MANTLE_RESEARCH_SIGNAL",
  status: "NEW",
  mantleRelevance: "mantle_native",
};

describe("SignalSchema", () => {
  it("accepts a valid signal", () => {
    expect(SignalSchema.parse(validSignal).name).toBe("Test Signal");
  });

  it("rejects missing name", () => {
    expect(() => SignalSchema.parse({ ...validSignal, name: "" })).toThrow();
  });
});
