import { Evidence } from "../schema/evidence";
import { RiskFlagSchema } from "../schema/enums";
import type { z } from "zod";
import { Score } from "../schema/score";
import { Signal } from "../schema/signal";
import { nowIso } from "../utils/ids";
import type { FastDexRawRecord } from "../importers/fastDexJsonlImporter";

type RiskFlag = z.infer<typeof RiskFlagSchema>;

/**
 * Degen-specific scoring for Fast DEX Radar signals.
 *
 * This is intentionally separate from the Mantle-aware `scoreSignal`:
 *   - degen tokens are NEVER mantle-native, so Mantle relevance stays `not_relevant`
 *   - the score weights are tuned for early Base/Solana setups, not for hackathon
 *     demo seed data
 *   - the score reads raw record fields (FDV, V/L, age, priority) directly so we
 *     don't have to reverse-engineer them from evidence strings
 *
 * The user-facing /degen dashboard reads this score; the existing Mantle
 * /signals dashboard still uses `scoreSignal` for demo and manual signals.
 *
 * Thresholds are aligned with `Hermes Alpha Radar — filters v3` and the
 * Fast DEX Radar v1.1 alert rules (HIGH bucket requires 4/6 urgent criteria).
 */

const HARD_REJECT_FLAGS: RiskFlag[] = [
  "not_a_buy_signal",
  "insufficient_evidence",
  "missing_liquidity_data",
  "missing_volume_data",
];

export function scoreDegenSignal(
  signal: Signal,
  evidence: Evidence[],
  record: FastDexRawRecord,
): Score {
  let score = 30; // neutral base for early degen radar
  const reasons: string[] = [];
  const riskFlags: RiskFlag[] = [];

  // --- 1) Priority bucket from Fast DEX Radar (weight 25) ---
  switch (record.priority_bucket) {
    case "HIGH":
      score += 25;
      reasons.push("Fast DEX Radar priority: HIGH");
      break;
    case "MEDIUM":
      score += 15;
      reasons.push("Fast DEX Radar priority: MEDIUM");
      break;
    case "LOW":
      score += 5;
      reasons.push("Fast DEX Radar priority: LOW");
      break;
    case "SCOUT":
      score += 0;
      reasons.push("Fast DEX Radar priority: SCOUT (preview only)");
      break;
    default:
      reasons.push("No priority bucket from Fast DEX Radar");
  }

  // --- 2) Pair age — fresh is good, vertical without pullback is not (weight 10) ---
  if (record.age_minutes != null) {
    if (record.age_minutes < 60 * 6) {
      score += 10;
      reasons.push("Pair age < 6h (priority window)");
    } else if (record.age_minutes < 60 * 24) {
      score += 6;
      reasons.push("Pair age < 24h");
    } else if (record.age_minutes < 60 * 24 * 7) {
      score += 2;
      reasons.push("Pair age < 7d (acceptable)");
    } else {
      score -= 5;
      reasons.push("Pair age > 7d (deprioritised)");
    }
  }

  // --- 3) Volume / Liquidity ratio (weight 10) ---
  if (record.volume_liquidity_ratio != null) {
    if (record.volume_liquidity_ratio >= 2) {
      score += 10;
      reasons.push(`V/L ${record.volume_liquidity_ratio.toFixed(2)}x (strong)`);
    } else if (record.volume_liquidity_ratio >= 1.5) {
      score += 6;
      reasons.push(`V/L ${record.volume_liquidity_ratio.toFixed(2)}x (acceptable)`);
    } else if (record.volume_liquidity_ratio >= 1) {
      score += 2;
    } else {
      score -= 4;
      riskFlags.push("not_a_buy_signal");
      reasons.push(`V/L ${record.volume_liquidity_ratio.toFixed(2)}x (weak)`);
    }
  }

  // --- 4) Liquidity floor (weight 10) ---
  if (record.liquidity_usd == null) {
    riskFlags.push("missing_liquidity_data");
    reasons.push("Missing liquidity data");
  } else if (record.liquidity_usd < 5_000) {
    score -= 10;
    riskFlags.push("liquidity_near_floor");
    reasons.push(`Liquidity $${Math.round(record.liquidity_usd)} is below $5k`);
  } else if (record.liquidity_usd < 30_000) {
    riskFlags.push("liquidity_near_floor");
    reasons.push(`Liquidity $${Math.round(record.liquidity_usd)} below $30k V3 floor`);
  } else if (record.liquidity_usd >= 50_000) {
    score += 10;
    reasons.push(`Liquidity $${Math.round(record.liquidity_usd)} clears $50k`);
  } else {
    score += 4;
  }

  // --- 5) FDV window (weight 5) ---
  if (record.fdv_usd != null) {
    if (record.fdv_usd < 100_000) {
      riskFlags.push("profile_only_signal");
      reasons.push(`FDV $${Math.round(record.fdv_usd)} below $100k V3 minimum`);
    } else if (record.fdv_usd <= 5_000_000) {
      score += 5;
      reasons.push(`FDV $${Math.round(record.fdv_usd)} in priority window`);
    } else if (record.fdv_usd <= 20_000_000) {
      score += 2;
      reasons.push(`FDV $${Math.round(record.fdv_usd)} in acceptable window`);
    } else {
      score -= 3;
      reasons.push(`FDV $${Math.round(record.fdv_usd)} above $20M cap`);
    }
  }

  // --- 6) Live-eligibility flag (weight 10) ---
  if (record.live_eligible === false) {
    score -= 10;
    riskFlags.push("not_a_buy_signal");
    reasons.push(`Live alert blocked${record.live_block_reason ? `: ${record.live_block_reason}` : ""}`);
  } else if (record.live_eligible === true) {
    score += 5;
    reasons.push("Live-eligible per Fast DEX Radar gates");
  }

  // --- 7) Category (weight 5) ---
  if (signal.category === "FAST_ALERT") {
    score += 5;
    reasons.push("FAST_ALERT discovery category");
  }

  // --- 8) Chain bonus (weight 5) — Base/Solana only, no other chains get a bonus ---
  if (signal.chain === "base" || signal.chain === "solana") {
    score += 5;
    reasons.push(`Chain ${signal.chain} (in scope)`);
  } else if (signal.chain === "mantle") {
    reasons.push("Chain mantle — degen radar does not normally cover this; keep in mind");
  } else {
    score -= 5;
    riskFlags.push("not_a_buy_signal");
    reasons.push(`Chain ${signal.chain} is outside Base/Solana scope`);
  }

  // --- 9) Evidence volume (weight 5) ---
  if (evidence.length >= 4) {
    score += 5;
    reasons.push(`At least four evidence records (${evidence.length})`);
  }

  // --- Hard reject guardrails ---
  if (evidence.length < 2) {
    riskFlags.push("insufficient_evidence");
  }
  if (record.fdv_usd == null && record.liquidity_usd == null) {
    riskFlags.push(...HARD_REJECT_FLAGS);
  }

  // dedupe risk flags + drop values that the schema doesn't accept
  const knownFlags = new Set(RiskFlagSchema.options);
  const uniqueFlags = Array.from(new Set(riskFlags)).filter((flag) => knownFlags.has(flag));
  const uniqueReasons = Array.from(new Set(reasons));

  const finalScore = Math.max(0, Math.min(100, score));
  const confidence =
    evidence.length >= 5 ? 0.85 : evidence.length >= 3 ? 0.65 : evidence.length >= 2 ? 0.5 : 0.3;

  return {
    signalId: signal.id,
    score: finalScore,
    confidence,
    mantleRelevance: "not_relevant",
    riskFlags: uniqueFlags,
    reasons: uniqueReasons,
    updatedAt: nowIso(),
  };
}
