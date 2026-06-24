import fs from "node:fs";
import { z } from "zod";
import { AgentEvent } from "../schema/event";
import { Evidence } from "../schema/evidence";
import { Signal } from "../schema/signal";
import { scoreSignal } from "../scoring/scoreSignal";
import { deterministicId, nowIso } from "../utils/ids";

/**
 * Strict Zod schema for a single raw Fast DEX JSONL line.
 *
 * Every field is optional in the *input* so that the importer is tolerant
 * of partial scanner exports, but when a field is present it must be
 * well-typed. This gives us clear error messages per line.
 */
export const FastDexRawRecordSchema = z
  .object({
    timestamp: z.string().datetime({ offset: true }).optional(),
    chain: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    symbol: z.string().min(1).optional(),
    contract_address: z.string().min(1).optional(),
    pair_address: z.string().min(1).optional(),
    alert_category: z.enum(["FAST_ALERT", "SCOUT_PREVIEW"]).optional(),
    liquidity_usd: z.number().nonnegative().optional(),
    volume_24h_usd: z.number().nonnegative().optional(),
    age_minutes: z.number().nonnegative().optional(),
    source_ref: z.string().min(1).optional(),
  })
  .passthrough(); // ignore unknown fields, but typecheck the known ones

export type FastDexRawRecord = z.infer<typeof FastDexRawRecordSchema>;

/**
 * Result of importing a JSONL file.
 * Errors are aggregated per-line and never throw; valid records still produce events.
 */
export type FastDexImportResult = {
  events: AgentEvent[];
  errors: Array<{ line: number; message: string }>;
};

/**
 * Import a Fast DEX JSONL file into AgentEvents.
 *
 * - Empty / whitespace-only lines are skipped silently.
 * - Each non-empty line is JSON-parsed and Zod-validated.
 * - Parse / schema errors are reported with the original 1-based line number
 *   and never abort the whole import.
 * - At least one of (chain, name, pair_address, contract_address) must be
 *   present for a record to be considered meaningful; otherwise it is
 *   reported as a schema-level rejection.
 */
export function importFastDexJsonl(filePath: string): AgentEvent[] {
  return importFastDexJsonlDetailed(filePath).events;
}

export function importFastDexJsonlDetailed(filePath: string): FastDexImportResult {
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) return { events: [], errors: [] };

  const events: AgentEvent[] = [];
  const errors: Array<{ line: number; message: string }> = [];
  const lines = raw.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;
    if (!line.trim()) continue; // skip blank lines silently

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(line);
    } catch (err) {
      errors.push({
        line: lineNo,
        message: `Invalid JSON: ${(err as Error).message}`,
      });
      continue;
    }

    const result = FastDexRawRecordSchema.safeParse(parsedJson);
    if (!result.success) {
      errors.push({
        line: lineNo,
        message: `Schema validation failed: ${result.error.issues
          .map((iss) => `${iss.path.join(".") || "<root>"}: ${iss.message}`)
          .join("; ")}`,
      });
      continue;
    }

    const record = result.data;
    // Meaningfulness check: require at least one identifier.
    if (!record.chain && !record.name && !record.pair_address && !record.contract_address) {
      errors.push({
        line: lineNo,
        message: "Schema validation failed: record has no identifier (chain / name / pair_address / contract_address)",
      });
      continue;
    }

    try {
      events.push(...recordToEvents(record));
    } catch (err) {
      errors.push({
        line: lineNo,
        message: `Transform failed: ${(err as Error).message}`,
      });
    }
  }

  return { events, errors };
}

function recordToEvents(record: FastDexRawRecord): AgentEvent[] {
  const detectedAt = record.timestamp ?? nowIso();
  const signalId = deterministicId("signal", {
    source: "fast_dex",
    chain: record.chain,
    name: record.name,
    symbol: record.symbol,
    pair: record.pair_address,
    detectedAt,
  });

  const signal: Signal = {
    id: signalId,
    source: "fast_dex",
    chain: normalizeChain(record.chain),
    name: record.name ?? "Unknown Fast DEX Signal",
    symbol: record.symbol,
    contractAddress: record.contract_address,
    pairAddress: record.pair_address,
    detectedAt,
    category: record.alert_category ?? "SCOUT_PREVIEW",
    status: "NEW",
    mantleRelevance: "not_relevant",
    sourceRef: record.source_ref,
  };

  const evidence: Evidence[] = [
    {
      id: deterministicId("evidence", { signalId, kind: "dex", field: "liquidity" }),
      signalId,
      kind: "dex_data",
      title: "DEX liquidity",
      value: record.liquidity_usd == null ? "Liquidity: missing" : `Liquidity: $${record.liquidity_usd}`,
      confidence: record.liquidity_usd == null ? "low" : "medium",
      sourceRef: record.source_ref,
      createdAt: nowIso(),
    },
    {
      id: deterministicId("evidence", { signalId, kind: "volume" }),
      signalId,
      kind: "dex_data",
      title: "DEX 24h volume",
      value: record.volume_24h_usd == null ? "Volume 24h: missing" : `Volume 24h: $${record.volume_24h_usd}`,
      confidence: record.volume_24h_usd == null ? "low" : "medium",
      sourceRef: record.source_ref,
      createdAt: nowIso(),
    },
  ];

  const score = scoreSignal(signal, evidence);

  return [
    { eventId: deterministicId("event", { type: "signal", signalId }), createdAt: nowIso(), agent: "fast-dex-importer", type: "signal_detected", signal },
    ...evidence.map((item) => ({ eventId: deterministicId("event", { type: "evidence", id: item.id }), createdAt: nowIso(), agent: "fast-dex-importer", type: "evidence_added" as const, evidence: item })),
    { eventId: deterministicId("event", { type: "score", signalId }), createdAt: nowIso(), agent: "fast-dex-importer", type: "score_updated", score },
  ];
}

function normalizeChain(chain: string | undefined): Signal["chain"] {
  switch ((chain ?? "").toLowerCase()) {
    case "mantle": return "mantle";
    case "base": return "base";
    case "solana": return "solana";
    case "ethereum": return "ethereum";
    case "arbitrum": return "arbitrum";
    case "optimism": return "optimism";
    case "bsc": return "bsc";
    default: return "other";
  }
}
