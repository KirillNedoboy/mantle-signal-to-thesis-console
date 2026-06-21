import { Evidence } from "../schema/evidence";
import { Score } from "../schema/score";
import { Signal } from "../schema/signal";
import { nowIso } from "../utils/ids";
import { classifyMantleRelevance } from "./mantleRelevance";
import { computeRiskFlags } from "./riskFlags";

export function scoreSignal(signal: Signal, evidence: Evidence[]): Score {
  const mantleRelevance = classifyMantleRelevance(signal, evidence);
  const riskFlags = computeRiskFlags({ ...signal, mantleRelevance }, evidence);

  let score = 40;
  const reasons: string[] = [];

  if (signal.category === "FAST_ALERT") {
    score += 15;
    reasons.push("FAST_ALERT discovery category");
  }
  if (signal.category === "MANTLE_RESEARCH_SIGNAL") {
    score += 15;
    reasons.push("Mantle research signal category");
  }
  if (mantleRelevance !== "not_relevant") {
    score += 15;
    reasons.push(`Mantle relevance: ${mantleRelevance}`);
  }
  if (evidence.length >= 3) {
    score += 10;
    reasons.push("At least three evidence records");
  }

  score -= Math.min(35, riskFlags.length * 5);
  score = Math.max(0, Math.min(100, score));

  return {
    signalId: signal.id,
    score,
    confidence: evidence.length >= 4 ? 0.8 : evidence.length >= 2 ? 0.55 : 0.35,
    mantleRelevance,
    riskFlags,
    reasons,
    updatedAt: nowIso(),
  };
}
