import fs from "node:fs";
import { z } from "zod";
import { AgentEvent } from "../schema/event";
import { Evidence } from "../schema/evidence";
import { Signal } from "../schema/signal";
import { scoreSignal } from "../scoring/scoreSignal";
import { scoreDegenSignal } from "../scoring/scoreDegenSignal";
import { deterministicId, nowIso } from "../utils/ids";

/**
 * Strict-but-tolerant Zod schema for a single raw Fast DEX JSONL line.
 *
 * Two shapes coexist depending on the cron source file:
 *
 *   1. Legacy/simple rows used by the original Mantle demo importer/tests.
 *   2. Newer Fast DEX alert rows with richer fields (priority, dedupe, live gates,
 *      report/preview paths, etc.) for the Degen Radar surface.
 */
export const FastDexRawRecordSchema = z
  .object({
    // legacy/simple fields
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

    // advanced Fast DEX / Degen fields
    ts: z.string().optional(),
    run_date_utc: z.string().optional(),
    mode: z.string().optional(),
    scan_window_minutes: z.number().optional(),
    market_context: z.string().optional(),
    chain_stats: z.record(z.string(), z.unknown()).optional(),
    fdv_usd: z.number().nonnegative().optional(),
    volume_liquidity_ratio: z.number().nonnegative().optional(),
    priority_bucket: z.enum(["HIGH", "MEDIUM", "LOW", "SCOUT"]).optional(),
    priority_score_fast: z.number().optional(),
    live_eligible: z.boolean().optional(),
    live_block_reason: z.string().optional(),
    dedupe_key: z.string().min(1).optional(),
    preview_path: z.string().optional(),
    report_path: z.string().optional(),
    alert_reasons: z.array(z.string()).optional(),
    sent: z.boolean().optional(),

    // legacy alias from older importer versions
    category: z.enum(["FAST_ALERT", "SCOUT_PREVIEW"]).optional(),
  })
  .passthrough();

export type FastDexRawRecord = z.infer<typeof FastDexRawRecordSchema>;

export type FastDexImportResult = {
  events: AgentEvent[];
  errors: Array<{ line: number; message: string }>;
};

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
    if (!line.trim()) continue;

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(line);
    } catch (err) {
      errors.push({ line: lineNo, message: `Invalid JSON: ${(err as Error).message}` });
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
    if (!record.chain && !record.name && !record.pair_address && !record.contract_address) {
      errors.push({
        line: lineNo,
        message:
          "Schema validation failed: record has no identifier (chain / name / pair_address / contract_address)",
      });
      continue;
    }

    try {
      events.push(...recordToEvents(record));
    } catch (err) {
      errors.push({ line: lineNo, message: `Transform failed: ${(err as Error).message}` });
    }
  }

  return { events, errors };
}

function recordToEvents(record: FastDexRawRecord): AgentEvent[] {
  if (isAdvancedDegenRecord(record)) {
    return recordToDegenEvents(record);
  }
  return recordToLegacyEvents(record);
}

function isAdvancedDegenRecord(record: FastDexRawRecord): boolean {
  return Boolean(
    record.ts ||
      record.run_date_utc ||
      record.priority_bucket ||
      record.priority_score_fast != null ||
      record.live_eligible != null ||
      record.live_block_reason ||
      record.dedupe_key ||
      record.preview_path ||
      record.report_path ||
      record.alert_reasons?.length ||
      record.fdv_usd != null ||
      record.volume_liquidity_ratio != null,
  );
}

function recordToLegacyEvents(record: FastDexRawRecord): AgentEvent[] {
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
    {
      eventId: deterministicId("event", { type: "signal", signalId }),
      createdAt: nowIso(),
      agent: "fast-dex-importer",
      type: "signal_detected",
      signal,
    },
    ...evidence.map((item) => ({
      eventId: deterministicId("event", { type: "evidence", id: item.id }),
      createdAt: nowIso(),
      agent: "fast-dex-importer",
      type: "evidence_added" as const,
      evidence: item,
    })),
    {
      eventId: deterministicId("event", { type: "score", signalId }),
      createdAt: nowIso(),
      agent: "fast-dex-importer",
      type: "score_updated",
      score,
    },
  ];
}

function recordToDegenEvents(record: FastDexRawRecord): AgentEvent[] {
  if (record.mode === "fast_dex_radar_mvp" && !record.symbol && !record.priority_bucket) {
    return [];
  }

  const detectedAt = record.ts ?? record.timestamp ?? record.run_date_utc ?? nowIso();
  const signalId = deterministicId("signal", {
    source: "fast_dex",
    chain: record.chain,
    name: record.name ?? record.symbol,
    symbol: record.symbol,
    pair: record.pair_address ?? record.dedupe_key,
    detectedAt,
  });

  const signal: Signal = {
    id: signalId,
    source: "fast_dex",
    chain: normalizeChain(record.chain),
    name: record.name ?? record.symbol ?? "Unknown Fast DEX Signal",
    symbol: record.symbol,
    contractAddress: record.contract_address,
    pairAddress: record.pair_address,
    detectedAt,
    category: record.alert_category ?? record.category ?? "SCOUT_PREVIEW",
    status: "NEW",
    mantleRelevance: "not_relevant",
    sourceRef:
      record.source_ref ??
      record.dedupe_key ??
      (record.pair_address ?? record.contract_address ?? "fast_dex_jsonl"),
  };

  const evidence = buildDegenEvidence(signalId, record);
  const score = scoreDegenSignal(signal, evidence, record);

  return [
    {
      eventId: deterministicId("event", { type: "signal", signalId }),
      createdAt: nowIso(),
      agent: "fast-dex-importer",
      type: "signal_detected",
      signal,
    },
    ...evidence.map((item) => ({
      eventId: deterministicId("event", { type: "evidence", id: item.id }),
      createdAt: nowIso(),
      agent: "fast-dex-importer",
      type: "evidence_added" as const,
      evidence: item,
    })),
    {
      eventId: deterministicId("event", { type: "score", signalId }),
      createdAt: nowIso(),
      agent: "fast-dex-importer",
      type: "score_updated",
      score,
    },
  ];
}

function buildDegenEvidence(signalId: string, record: FastDexRawRecord): Evidence[] {
  const evidence: Evidence[] = [];
  const base = (kind: string, field: string) =>
    deterministicId("evidence", { signalId, kind, field });
  const createdAt = nowIso();

  const push = (e: Omit<Evidence, "id" | "createdAt">) => {
    evidence.push({ ...e, id: base(e.kind, e.title), createdAt });
  };

  if (record.fdv_usd != null) {
    push({
      signalId,
      kind: "dex_data",
      title: "FDV (USD)",
      value: `FDV: $${formatNumber(record.fdv_usd)}`,
      confidence: "medium",
      sourceRef: record.source_ref,
    });
  }
  if (record.liquidity_usd != null) {
    push({
      signalId,
      kind: "dex_data",
      title: "Liquidity (USD)",
      value: `Liquidity: $${formatNumber(record.liquidity_usd)}`,
      confidence: "medium",
      sourceRef: record.source_ref,
    });
  }
  if (record.volume_24h_usd != null) {
    push({
      signalId,
      kind: "dex_data",
      title: "24h volume (USD)",
      value: `Volume 24h: $${formatNumber(record.volume_24h_usd)}`,
      confidence: "medium",
      sourceRef: record.source_ref,
    });
  }
  if (record.volume_liquidity_ratio != null) {
    push({
      signalId,
      kind: "dex_data",
      title: "Volume / Liquidity",
      value: `V/L: ${record.volume_liquidity_ratio.toFixed(2)}x`,
      confidence: "medium",
      sourceRef: record.source_ref,
    });
  }
  if (record.priority_bucket) {
    push({
      signalId,
      kind: "dex_data",
      title: "Priority bucket",
      value: `Priority: ${record.priority_bucket}${
        record.priority_score_fast != null ? ` (score ${record.priority_score_fast})` : ""
      }`,
      confidence: "high",
      sourceRef: record.source_ref,
    });
  }
  if (record.age_minutes != null) {
    push({
      signalId,
      kind: "dex_data",
      title: "Pair age",
      value: `Age: ${formatAge(record.age_minutes)}`,
      confidence: "medium",
      sourceRef: record.source_ref,
    });
  }
  if (record.live_block_reason) {
    push({
      signalId,
      kind: "contract_check",
      title: "Live block reason",
      value: `Live alert blocked: ${record.live_block_reason}`,
      confidence: "high",
      sourceRef: record.source_ref,
    });
  }
  if (record.alert_reasons && record.alert_reasons.length > 0) {
    push({
      signalId,
      kind: "dex_data",
      title: "Alert reasons",
      value: record.alert_reasons.join("; "),
      confidence: "medium",
      sourceRef: record.source_ref,
    });
  }
  if (record.preview_path || record.report_path) {
    const links: string[] = [];
    if (record.preview_path) links.push(`preview: ${record.preview_path}`);
    if (record.report_path) links.push(`report: ${record.report_path}`);
    push({
      signalId,
      kind: "manual_note",
      title: "Obsidian paths",
      value: links.join(" | "),
      confidence: "high",
      sourceRef: record.source_ref,
    });
  }
  if (record.dedupe_key) {
    push({
      signalId,
      kind: "dex_data",
      title: "Dedupe key",
      value: record.dedupe_key,
      confidence: "high",
      sourceRef: record.source_ref,
    });
  }
  return evidence;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

function formatAge(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 60 * 24) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 60 / 24).toFixed(1)}d`;
}

function normalizeChain(chain: string | undefined): Signal["chain"] {
  switch ((chain ?? "").toLowerCase()) {
    case "mantle":
      return "mantle";
    case "base":
      return "base";
    case "solana":
      return "solana";
    case "ethereum":
      return "ethereum";
    case "arbitrum":
      return "arbitrum";
    case "optimism":
      return "optimism";
    case "bsc":
      return "bsc";
    default:
      return "other";
  }
}

export { scoreSignal };
