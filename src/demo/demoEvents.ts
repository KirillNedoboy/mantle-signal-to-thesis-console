import { AgentEvent } from "../schema/event";
import { Evidence } from "../schema/evidence";
import { Signal } from "../schema/signal";
import { scoreSignal } from "../scoring/scoreSignal";
import { deterministicId } from "../utils/ids";

const AGENT = "demo-seed";
const CREATED_AT = "2026-06-21T10:00:00.000Z";

export function buildDemoEvents(): AgentEvent[] {
  const signals: Signal[] = [
    {
      id: "signal_mantle_spcxx_demo01",
      source: "demo",
      chain: "mantle",
      name: "Tokenized SpaceX Research Signal",
      symbol: "SPCXx",
      detectedAt: "2026-06-21T09:00:00.000Z",
      category: "MANTLE_RESEARCH_SIGNAL",
      status: "NEW",
      mantleRelevance: "mantle_native",
      sourceRef: "demo:mantle-research-challenge",
    },
    {
      id: "signal_insightx_demo02",
      source: "demo",
      chain: "mantle",
      name: "InsightX AI Prediction Market",
      symbol: "INSIGHTX",
      detectedAt: "2026-06-21T08:30:00.000Z",
      category: "MANTLE_RESEARCH_SIGNAL",
      status: "NEW",
      mantleRelevance: "prediction_markets",
      sourceRef: "demo:mantle-news",
    },
    {
      id: "signal_fastdex_scout_demo03",
      source: "fast_dex",
      chain: "solana",
      name: "Early GameFi Scout Preview",
      symbol: "GAME",
      detectedAt: "2026-06-21T08:00:00.000Z",
      category: "SCOUT_PREVIEW",
      status: "NEW",
      mantleRelevance: "not_relevant",
      sourceRef: "demo:fast-dex-profile-only",
    },
    {
      id: "signal_hermes_reject_demo04",
      source: "hermes",
      chain: "solana",
      name: "High Concentration Meme Object",
      symbol: "MEME",
      detectedAt: "2026-06-21T07:30:00.000Z",
      category: "RESEARCH_FINDING",
      status: "NEW",
      mantleRelevance: "ecosystem_scouting",
      sourceRef: "demo:hermes-research-rejection",
    },
  ];

  const evidenceBySignal: Record<string, Evidence[]> = {
    signal_mantle_spcxx_demo01: [
      evidence("signal_mantle_spcxx_demo01", "mantle_relevance", "Mantle research theme", "Tokenized stock / RWA distribution theme aligned with Mantle research challenge.", "high"),
      evidence("signal_mantle_spcxx_demo01", "product_check", "Research object", "SPCXx used as a demo research case, not a trading recommendation.", "medium"),
      evidence("signal_mantle_spcxx_demo01", "manual_note", "Operator note", "Needs source verification before publication.", "medium"),
    ],
    signal_insightx_demo02: [
      evidence("signal_insightx_demo02", "mantle_relevance", "Mantle research theme", "AI-native prediction markets are relevant to Mantle ecosystem research.", "high"),
      evidence("signal_insightx_demo02", "product_check", "Product surface", "Prediction market product narrative exists in the demo fixture.", "medium"),
      evidence("signal_insightx_demo02", "social_check", "Narrative", "AI finance narrative should be checked against actual user activity.", "medium"),
    ],
    signal_fastdex_scout_demo03: [
      evidence("signal_fastdex_scout_demo03", "dex_data", "Profile-only DEX signal", "No pair/liquidity/volume evidence yet. This is a SCOUT_PREVIEW only.", "low"),
    ],
    signal_hermes_reject_demo04: [
      evidence("signal_hermes_reject_demo04", "holder_check", "Holder concentration", "Top1 holder around 20.7%; this is a serious concentration risk.", "high"),
      evidence("signal_hermes_reject_demo04", "liquidity_check", "LP status", "LP appears locked in demo evidence, but concentration remains the blocker.", "medium"),
      evidence("signal_hermes_reject_demo04", "contract_check", "Authority check", "Mint/freeze authority appears disabled in demo evidence.", "medium"),
      evidence("signal_hermes_reject_demo04", "dex_data", "Price move", "24h price move +772%, already too vertical for clean research escalation.", "medium"),
    ],
  };

  const events: AgentEvent[] = [];

  for (const signal of signals) {
    events.push({
      eventId: deterministicId("event", { type: "signal_detected", id: signal.id }),
      createdAt: CREATED_AT,
      agent: AGENT,
      type: "signal_detected",
      signal,
    });

    for (const item of evidenceBySignal[signal.id] ?? []) {
      events.push({
        eventId: deterministicId("event", { type: "evidence_added", id: item.id }),
        createdAt: CREATED_AT,
        agent: AGENT,
        type: "evidence_added",
        evidence: item,
      });
    }

    const score = scoreSignal(signal, evidenceBySignal[signal.id] ?? []);
    events.push({
      eventId: deterministicId("event", { type: "score_updated", id: signal.id, score: score.score }),
      createdAt: CREATED_AT,
      agent: AGENT,
      type: "score_updated",
      score: { ...score, updatedAt: CREATED_AT },
    });
  }

  return events;
}

function evidence(
  signalId: string,
  kind: Evidence["kind"],
  title: string,
  value: string,
  confidence: Evidence["confidence"],
): Evidence {
  return {
    id: deterministicId("evidence", { signalId, kind, title, value }),
    signalId,
    kind,
    title,
    value,
    confidence,
    createdAt: CREATED_AT,
  };
}
