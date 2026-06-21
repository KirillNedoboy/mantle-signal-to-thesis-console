import { generateDeterministicResearchNote } from "../agent/researchNote";
import { AgentEvent } from "../schema/event";
import { appendEvents, readEvents } from "../store/eventStore";
import { materializeEvents } from "../store/materialize";
import { DEFAULT_EVENT_STORE_PATH } from "../store/paths";
import { deterministicId, nowIso } from "../utils/ids";

const state = materializeEvents(readEvents(DEFAULT_EVENT_STORE_PATH));
const events: AgentEvent[] = [];

for (const item of state.signals) {
  if (!item.latestScore) continue;
  if (item.notes.length > 0) continue;

  const note = generateDeterministicResearchNote(item.signal, item.evidence, item.latestScore);
  events.push({
    eventId: deterministicId("event", { type: "research_note_created", noteId: note.id }),
    createdAt: nowIso(),
    agent: "demo-research-agent",
    type: "research_note_created",
    note,
  });

  events.push({
    eventId: deterministicId("event", { type: "decision_recorded", signalId: item.signal.id, decision: note.suggestedDecision }),
    createdAt: nowIso(),
    agent: "demo-research-agent",
    type: "decision_recorded",
    decision: {
      id: deterministicId("decision", { signalId: item.signal.id, decision: note.suggestedDecision, actor: "agent" }),
      signalId: item.signal.id,
      decision: note.suggestedDecision,
      reason: `Agent suggested ${note.suggestedDecision} based on score ${item.latestScore.score}/100 and risk flags: ${item.latestScore.riskFlags.join(", ")}. Human confirmation is still required.`,
      actor: "agent",
      createdAt: nowIso(),
    },
  });
}

const results = appendEvents(DEFAULT_EVENT_STORE_PATH, events);
console.log(`Demo agent run complete: appended=${results.filter((item) => item.appended).length}, skipped_duplicates=${results.filter((item) => !item.appended).length}`);
