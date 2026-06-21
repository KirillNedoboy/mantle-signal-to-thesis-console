import fs from "node:fs";
import { AgentEvent } from "../schema/event";
import { Evidence } from "../schema/evidence";
import { Signal } from "../schema/signal";
import { scoreSignal } from "../scoring/scoreSignal";
import { deterministicId, nowIso } from "../utils/ids";

export type FastDexRawRecord = {
  timestamp?: string;
  chain?: string;
  name?: string;
  symbol?: string;
  contract_address?: string;
  pair_address?: string;
  alert_category?: "FAST_ALERT" | "SCOUT_PREVIEW";
  liquidity_usd?: number;
  volume_24h_usd?: number;
  age_minutes?: number;
  source_ref?: string;
};

export function importFastDexJsonl(filePath: string): AgentEvent[] {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];
  const records = raw.split("\n").map((line) => JSON.parse(line) as FastDexRawRecord);
  return records.flatMap(recordToEvents);
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
