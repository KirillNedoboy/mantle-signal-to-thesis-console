import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  FastDexRawRecordSchema,
  importFastDexJsonl,
  importFastDexJsonlDetailed,
} from "../src/importers/fastDexJsonlImporter";

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "fastdex-importer-test-"));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function writeFile(name: string, body: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, body, "utf8");
  return p;
}

describe("FastDexRawRecordSchema (Zod)", () => {
  it("accepts a minimal valid record with a chain identifier", () => {
    const r = FastDexRawRecordSchema.safeParse({ chain: "base", name: "Foo" });
    expect(r.success).toBe(true);
  });

  it("rejects negative liquidity_usd", () => {
    const r = FastDexRawRecordSchema.safeParse({ chain: "base", liquidity_usd: -1 });
    expect(r.success).toBe(false);
  });

  it("rejects non-datetime timestamp", () => {
    const r = FastDexRawRecordSchema.safeParse({
      chain: "base",
      timestamp: "yesterday",
    });
    expect(r.success).toBe(false);
  });

  it("rejects unknown alert_category", () => {
    const r = FastDexRawRecordSchema.safeParse({
      chain: "base",
      alert_category: "WHATEVER",
    });
    expect(r.success).toBe(false);
  });
});

describe("importFastDexJsonl", () => {
  it("imports a valid record into signal + evidence + score events", () => {
    const file = writeFile(
      "good.jsonl",
      JSON.stringify({
        timestamp: "2026-01-01T00:00:00.000Z",
        chain: "base",
        name: "Demo",
        symbol: "DMX",
        contract_address: "0xabc",
        pair_address: "0xdef",
        alert_category: "FAST_ALERT",
        liquidity_usd: 12345.67,
        volume_24h_usd: 999,
        age_minutes: 3,
        source_ref: "scanner:run-7",
      }),
    );

    const events = importFastDexJsonl(file);
    // 1 signal + 2 evidence + 1 score = 4 events
    expect(events).toHaveLength(4);
    expect(events.map((e) => e.type)).toEqual([
      "signal_detected",
      "evidence_added",
      "evidence_added",
      "score_updated",
    ]);
  });

  it("reports malformed JSON line with line number and continues", () => {
    const file = writeFile(
      "mixed.jsonl",
      [
        JSON.stringify({ chain: "base", name: "OK" }),
        "{not valid json",
        JSON.stringify({ chain: "base", name: "OK2" }),
      ].join("\n"),
    );

    const res = importFastDexJsonlDetailed(file);
    expect(res.events).toHaveLength(2 * 4); // 2 valid records × 4 events
    expect(res.errors).toEqual([
      { line: 2, message: expect.stringContaining("Invalid JSON") },
    ]);
  });

  it("reports valid JSON with invalid schema (line number, field, message)", () => {
    const file = writeFile(
      "bad-types.jsonl",
      [
        JSON.stringify({ chain: "base", name: "OK" }),
        // alert_category is supposed to be FAST_ALERT | SCOUT_PREVIEW
        JSON.stringify({ chain: "base", alert_category: "WHATEVER" }),
      ].join("\n"),
    );

    const res = importFastDexJsonlDetailed(file);
    expect(res.events).toHaveLength(4); // first record only
    expect(res.errors).toEqual([
      {
        line: 2,
        message: expect.stringMatching(/Schema validation failed.*alert_category/),
      },
    ]);
  });

  it("ignores empty / whitespace-only lines without reporting errors", () => {
    const file = writeFile(
      "blanks.jsonl",
      ["", "  ", JSON.stringify({ chain: "base", name: "OK" }), "", "   "].join("\n"),
    );

    const res = importFastDexJsonlDetailed(file);
    expect(res.errors).toEqual([]);
    expect(res.events).toHaveLength(4);
  });

  it("rejects a record with no identifier (chain / name / pair / contract)", () => {
    const file = writeFile(
      "no-id.jsonl",
      JSON.stringify({ timestamp: "2026-01-01T00:00:00.000Z" }),
    );
    const res = importFastDexJsonlDetailed(file);
    expect(res.events).toEqual([]);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].line).toBe(1);
    expect(res.errors[0].message).toMatch(/no identifier/);
  });

  it("returns empty result for empty file", () => {
    const file = writeFile("empty.jsonl", "");
    expect(importFastDexJsonlDetailed(file)).toEqual({ events: [], errors: [] });
  });
});
