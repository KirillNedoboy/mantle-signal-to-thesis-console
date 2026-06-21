import { describe, expect, it } from "vitest";
import { buildDemoEvents } from "../src/demo/demoEvents";
import { materializeEvents } from "../src/store/materialize";

describe("materializeEvents", () => {
  it("builds signal views from demo events", () => {
    const state = materializeEvents(buildDemoEvents());
    expect(state.counts.totalSignals).toBe(4);
    expect(state.signals[0]?.latestScore).toBeDefined();
  });
});
