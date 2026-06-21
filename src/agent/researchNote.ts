import { DecisionValueSchema } from "../schema/enums";
import { Evidence } from "../schema/evidence";
import { ResearchNote } from "../schema/research-note";
import { Score } from "../schema/score";
import { Signal } from "../schema/signal";
import { deterministicId, nowIso } from "../utils/ids";

export function buildResearchPrompt(signal: Signal, evidence: Evidence[], score: Score): string {
  return [
    "You are a read-only Web3 ecosystem research agent.",
    "Do not produce trading execution instructions.",
    "Turn the signal into a short research note with evidence, risks, missing data and next manual checks.",
    `Signal: ${signal.name} ${signal.symbol ?? ""} on ${signal.chain}`,
    `Category: ${signal.category}`,
    `Mantle relevance: ${score.mantleRelevance}`,
    `Risk flags: ${score.riskFlags.join(", ")}`,
    "Evidence:",
    ...evidence.map((item) => `- ${item.title}: ${item.value}`),
  ].join("\n");
}

export function generateDeterministicResearchNote(
  signal: Signal,
  evidence: Evidence[],
  score: Score,
): ResearchNote {
  const missingData = score.riskFlags
    .filter((flag) => flag.startsWith("missing_"))
    .map((flag) => flag.replaceAll("_", " "));

  const suggestedDecision = suggestDecision(score);
  const evidenceSummary = evidence.length > 0
    ? evidence.map((item) => item.title).slice(0, 4).join(", ")
    : "no strong evidence yet";

  return {
    id: deterministicId("note", { signalId: signal.id, score: score.updatedAt, flags: score.riskFlags }),
    signalId: signal.id,
    thesis: `${signal.name} surfaced as a ${signal.category} research object with Mantle relevance classified as ${score.mantleRelevance}. The current score is ${score.score}/100, so it should be treated as research input, not an execution signal.`,
    whySurfaced: `The signal was surfaced by ${signal.source} and has evidence coverage around: ${evidenceSummary}.`,
    riskSummary: score.riskFlags.length > 0
      ? `Current risk flags: ${score.riskFlags.join(", ")}.`
      : "No major risk flags were computed, but this still requires manual verification.",
    missingData,
    nextManualChecks: buildNextChecks(score),
    suggestedDecision,
    disclaimer: "not_a_buy_signal",
    createdAt: nowIso(),
  };
}

function suggestDecision(score: Score): ResearchNote["suggestedDecision"] {
  if (score.riskFlags.includes("insufficient_evidence")) return "NO_ACTION";
  if (score.riskFlags.includes("weak_mantle_relevance") && score.score < 50) return "REJECT";
  if (score.score >= 70) return "ESCALATE";
  if (score.score >= 45) return "WATCH";
  return "REJECT";
}

function buildNextChecks(score: Score): string[] {
  const checks = new Set<string>();
  checks.add("Verify source links and timestamp freshness.");
  checks.add("Check whether this is actually relevant to Mantle ecosystem research.");

  if (score.riskFlags.includes("missing_contract_authority_data")) {
    checks.add("Verify contract authority, mint/freeze controls and upgradeability risk.");
  }
  if (score.riskFlags.includes("missing_lp_lock_data")) {
    checks.add("Verify LP lock or liquidity control status.");
  }
  if (score.riskFlags.includes("missing_holder_data")) {
    checks.add("Check top holder concentration and insider clustering.");
  }
  if (score.riskFlags.includes("profile_only_signal")) {
    checks.add("Do not escalate until pair/liquidity/volume evidence exists.");
  }

  checks.add("Record a human decision before any operational action.");
  return [...checks];
}
