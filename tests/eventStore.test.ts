import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appendEvent, appendEvents, readEvents } from "../src/store/eventStore";
import type { AgentEvent } from "../src/schema/event";

function tmpFile(): string {
  return path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "event-store-test-")),
    "events.jsonl",
  );
}

/**
 * Build a valid AgentEvent from a short, human-readable id.
 * Pads to satisfy the AgentEventSchema (eventId >= 12 chars, source enum).
 */
function makeEvent(id: string, n = 0): AgentEvent {
  const eid = `event_${id}_xxxxx`; // ensures >= 12 chars
  const sid = `signal_${id}_xxxx`.slice(0, 32);
  return {
    eventId: eid,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString(),
    agent: "test",
    type: "signal_detected",
    signal: {
      id: sid,
      source: "manual",
      chain: "other",
      name: `Test ${id}`,
      detectedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString(),
      category: "SCOUT_PREVIEW",
      status: "NEW",
      mantleRelevance: "not_relevant",
    },
  };
}

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "event-store-suite-"));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("eventStore.appendEvents", () => {
  it("skips eventIds already present in the file", () => {
    const file = tmpFile();
    const a = makeEvent("alpha");
    const b = makeEvent("beta");
    const c = makeEvent("gamma");
    appendEvent(file, a);
    appendEvent(file, b);

    const results = appendEvents(file, [a, c]);
    expect(results).toEqual([
      { appended: false, eventId: a.eventId, reason: "duplicate" },
      { appended: true, eventId: c.eventId },
    ]);
    expect(readEvents(file).map((e) => e.eventId)).toEqual([a.eventId, b.eventId, c.eventId]);
  });

  it("skips duplicate eventIds inside the same batch (first wins)", () => {
    const file = tmpFile();
    const x = makeEvent("x");
    const y = makeEvent("y");
    const results = appendEvents(file, [x, x, y, y, x]);
    expect(results.map((r) => [r.eventId, r.appended])).toEqual([
      [x.eventId, true],
      [x.eventId, false],
      [y.eventId, true],
      [y.eventId, false],
      [x.eventId, false],
    ]);
    expect(readEvents(file).map((e) => e.eventId)).toEqual([x.eventId, y.eventId]);
  });

  it("preserves input order for valid events", () => {
    const file = tmpFile();
    const ids = ["c", "a", "d", "b"];
    const events = ids.map((id, i) => makeEvent(id, i));
    appendEvents(file, events);
    expect(readEvents(file).map((e) => e.eventId)).toEqual(events.map((e) => e.eventId));
  });

  it("reads the existing file at most once per batch (performance contract)", () => {
    const file = tmpFile();
    // Seed a file with enough events that per-event reads would be noticeable.
    const seed = Array.from({ length: 50 }, (_, i) => makeEvent(`seed_${i}`));
    appendEvents(file, seed);

    // Count how many times fs.readFileSync is called during one appendEvents.
    // We restore the original on test exit regardless of assertion outcome.
    const realReadFileSync = fs.readFileSync;
    let readCalls = 0;
    // The Node typings for readFileSync are overloads; we intentionally
    // replace the function on the fs module to count calls. This is a
    // test-only mutation, restored in `finally`.
    fs.readFileSync = ((..._args: unknown[]) => {
      readCalls += 1;
      return realReadFileSync.apply(fs, _args as Parameters<typeof realReadFileSync>);
    }) as typeof fs.readFileSync;

    try {
      const batch = Array.from({ length: 20 }, (_, i) => makeEvent(`batch_${i}`));
      appendEvents(file, batch);
      // appendEvents itself uses readEvents once internally, which calls
      // readFileSync exactly once.
      expect(readCalls).toBe(1);
    } finally {
      fs.readFileSync = realReadFileSync;
    }
  });

  it("throws on invalid input events with batch index and eventId", () => {
    const file = tmpFile();
    // Construct an invalid event: signal is missing required source/chain/etc.
    const bad = {
      eventId: "bad_event_id_xx",
      createdAt: "2026-01-01T00:00:00.000Z",
      agent: "test",
      type: "signal_detected",
      // signal: omitted -> schema fails
    } as unknown as AgentEvent;
    expect(() => appendEvents(file, [makeEvent("ok"), bad])).toThrow(
      /batch index 1.*eventId=bad_event_id_xx/,
    );
  });

  it("returns [] for an empty batch without touching the file", () => {
    const file = tmpFile();
    expect(appendEvents(file, [])).toEqual([]);
    expect(fs.existsSync(file)).toBe(false);
  });
});
