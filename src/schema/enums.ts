import { z } from "zod";

export const ChainSchema = z.enum([
  "mantle",
  "base",
  "solana",
  "ethereum",
  "arbitrum",
  "optimism",
  "bsc",
  "other",
]);

export const SignalSourceSchema = z.enum(["fast_dex", "hermes", "manual", "demo"]);

export const SignalCategorySchema = z.enum([
  "FAST_ALERT",
  "SCOUT_PREVIEW",
  "RESEARCH_FINDING",
  "MANTLE_RESEARCH_SIGNAL",
]);

export const SignalStatusSchema = z.enum([
  "NEW",
  "WATCH",
  "REJECTED",
  "ESCALATED",
  "ARCHIVED",
  "NO_ACTION",
]);

export const EvidenceKindSchema = z.enum([
  "dex_data",
  "contract_check",
  "holder_check",
  "liquidity_check",
  "social_check",
  "product_check",
  "mantle_relevance",
  "manual_note",
]);

export const ConfidenceSchema = z.enum(["low", "medium", "high"]);

export const MantleRelevanceSchema = z.enum([
  "mantle_native",
  "rwa_distribution",
  "tokenized_assets",
  "prediction_markets",
  "ai_agent_finance",
  "defi_liquidity",
  "ecosystem_scouting",
  "not_relevant",
]);

export const RiskFlagSchema = z.enum([
  "not_a_buy_signal",
  "missing_liquidity_data",
  "missing_volume_data",
  "missing_holder_data",
  "missing_lp_lock_data",
  "missing_contract_authority_data",
  "liquidity_near_floor",
  "extreme_price_move",
  "top_holder_concentration_unknown",
  "weak_mantle_relevance",
  "profile_only_signal",
  "insufficient_evidence",
]);

export const DecisionValueSchema = z.enum(["WATCH", "REJECT", "ESCALATE", "NO_ACTION"]);
export const ActorSchema = z.enum(["agent", "human"]);
