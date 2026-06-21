import { Evidence } from "../schema/evidence";
import { RiskFlagSchema } from "../schema/enums";
import { Signal } from "../schema/signal";
import { z } from "zod";

export type RiskFlag = z.infer<typeof RiskFlagSchema>;

export function computeRiskFlags(signal: Signal, evidence: Evidence[]): RiskFlag[] {
  const flags = new Set<RiskFlag>(["not_a_buy_signal"]);
  const text = evidence.map((item) => `${item.title} ${item.value}`).join("\n").toLowerCase();

  if (signal.category === "SCOUT_PREVIEW") flags.add("profile_only_signal");
  if (signal.mantleRelevance === "not_relevant") flags.add("weak_mantle_relevance");

  if (!containsAny(text, ["liquidity", "liq"])) flags.add("missing_liquidity_data");
  if (!containsAny(text, ["volume", "24h", "v/l"])) flags.add("missing_volume_data");
  if (!containsAny(text, ["holder", "top1", "top holder"])) flags.add("missing_holder_data");
  if (!containsAny(text, ["lp", "locked", "lock"])) flags.add("missing_lp_lock_data");
  if (!containsAny(text, ["mint", "freeze", "authority", "contract"])) {
    flags.add("missing_contract_authority_data");
  }

  if (/liquidity\s*[:~]?\s*\$?(2\d{4}|3[0-4]\d{3})/i.test(text)) flags.add("liquidity_near_floor");
  if (/\+\s?(7\d{2}|8\d{2}|9\d{2}|\d{4,})%/.test(text)) flags.add("extreme_price_move");
  if (/top1\s*[:~]?\s*(unknown|n\/a)/i.test(text)) flags.add("top_holder_concentration_unknown");
  if (evidence.length < 2) flags.add("insufficient_evidence");

  return [...flags];
}

function containsAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}
