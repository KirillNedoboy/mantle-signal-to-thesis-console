import { AgentEvent } from "../schema/event";
import { Decision } from "../schema/decision";
import { Evidence } from "../schema/evidence";
import { ResearchNote } from "../schema/research-note";
import { Score } from "../schema/score";
import { Signal } from "../schema/signal";

export type SignalView = {
  signal: Signal;
  evidence: Evidence[];
  latestScore?: Score;
  notes: ResearchNote[];
  decisions: Decision[];
};

export type ResearchState = {
  signals: SignalView[];
  counts: {
    totalSignals: number;
    fastAlerts: number;
    scoutPreviews: number;
    escalated: number;
    watched: number;
    rejected: number;
  };
};

export function materializeEvents(events: AgentEvent[]): ResearchState {
  const bySignal = new Map<string, SignalView>();

  for (const event of events) {
    switch (event.type) {
      case "signal_detected": {
        bySignal.set(event.signal.id, {
          signal: event.signal,
          evidence: [],
          notes: [],
          decisions: [],
        });
        break;
      }
      case "evidence_added": {
        const item = bySignal.get(event.evidence.signalId);
        if (item) item.evidence.push(event.evidence);
        break;
      }
      case "score_updated": {
        const item = bySignal.get(event.score.signalId);
        if (item) item.latestScore = event.score;
        break;
      }
      case "research_note_created": {
        const item = bySignal.get(event.note.signalId);
        if (item) item.notes.push(event.note);
        break;
      }
      case "decision_recorded": {
        const item = bySignal.get(event.decision.signalId);
        if (item) {
          item.decisions.push(event.decision);
          item.signal = { ...item.signal, status: mapDecisionToStatus(event.decision.decision) };
        }
        break;
      }
    }
  }

  const signals = [...bySignal.values()].sort((a, b) =>
    b.signal.detectedAt.localeCompare(a.signal.detectedAt),
  );

  return {
    signals,
    counts: {
      totalSignals: signals.length,
      fastAlerts: signals.filter((item) => item.signal.category === "FAST_ALERT").length,
      scoutPreviews: signals.filter((item) => item.signal.category === "SCOUT_PREVIEW").length,
      escalated: signals.filter((item) => item.signal.status === "ESCALATED").length,
      watched: signals.filter((item) => item.signal.status === "WATCH").length,
      rejected: signals.filter((item) => item.signal.status === "REJECTED").length,
    },
  };
}

function mapDecisionToStatus(decision: Decision["decision"]): Signal["status"] {
  if (decision === "ESCALATE") return "ESCALATED";
  if (decision === "WATCH") return "WATCH";
  if (decision === "REJECT") return "REJECTED";
  return "NO_ACTION";
}
