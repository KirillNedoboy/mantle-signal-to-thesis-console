import { describe, expect, it } from "vitest";
import { generateDeterministicResearchNote } from "../src/agent/researchNote";
import { buildDemoEvents } from "../src/demo/demoEvents";
import { materializeEvents } from "../src/store/materialize";

describe("generateDeterministicResearchNote", () => {
  it("always includes not_a_buy_signal disclaimer", () => {
    const state = materializeEvents(buildDemoEvents());
    const item = state.signals.find((signal) => signal.latestScore)!;
    const note = generateDeterministicResearchNote(item.signal, item.evidence, item.latestScore!);
    expect(note.disclaimer).toBe("not_a_buy_signal");
    expect(note.nextManualChecks.length).toBeGreaterThan(0);
  });
});
