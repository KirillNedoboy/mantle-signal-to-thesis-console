import { z } from "zod";
import { MantleRelevanceSchema } from "../schema/enums";
import { Signal } from "../schema/signal";
import { Evidence } from "../schema/evidence";

export type MantleRelevance = z.infer<typeof MantleRelevanceSchema>;

const KEYWORDS: Array<[MantleRelevance, RegExp[]]> = [
  ["mantle_native", [/\bmantle\b/i, /\bmnt\b/i]],
  ["rwa_distribution", [/\brwa\b/i, /real[-\s]?world asset/i, /treasury/i]],
  ["tokenized_assets", [/tokeni[sz]ed stock/i, /stock/i, /equity/i, /spcx/i]],
  ["prediction_markets", [/prediction market/i, /forecast/i, /insightx/i]],
  ["ai_agent_finance", [/ai agent/i, /agentic/i, /ai[-\s]?native/i]],
  ["defi_liquidity", [/defi/i, /liquidity/i, /dex/i, /lending/i, /yield/i]],
];

export function classifyMantleRelevance(signal: Signal, evidence: Evidence[]): MantleRelevance {
  if (signal.chain === "mantle") return "mantle_native";

  const haystack = [
    signal.name,
    signal.symbol ?? "",
    signal.sourceRef ?? "",
    ...evidence.map((item) => `${item.title} ${item.value}`),
  ].join("\n");

  for (const [category, patterns] of KEYWORDS) {
    if (patterns.some((pattern) => pattern.test(haystack))) return category;
  }

  if (signal.source === "hermes" || signal.source === "manual") return "ecosystem_scouting";
  return "not_relevant";
}
