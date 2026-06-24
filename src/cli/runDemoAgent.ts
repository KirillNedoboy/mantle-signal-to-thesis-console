import { generateDeterministicResearchNote } from "../agent/researchNote";
import { AgentEvent } from "../schema/event";
import { Evidence } from "../schema/evidence";
import { appendEvents, readEvents } from "../store/eventStore";
import { materializeEvents } from "../store/materialize";
import { DEFAULT_EVENT_STORE_PATH } from "../store/paths";
import { deterministicId, nowIso } from "../utils/ids";
import { bestHitForSignal } from "../skills/mantleDocsSkill";

const state = materializeEvents(readEvents(DEFAULT_EVENT_STORE_PATH));
const events: AgentEvent[] = [];

for (const item of state.signals) {
  if (!item.latestScore) continue;
  if (item.notes.length > 0) continue;

  // 1) Pull a Mantle-docs citation through the official Mantle MCP skill.
  //    This is the Mantle AI Agent Skills bonus hook: every Mantle-native signal
  //    gets a real, citable Mantle-docs URL added as evidence, and the URL is
  //    visible in the dashboard's Evidence Review section.
  const hit = bestHitForSignal(
    item.signal.name,
    item.signal.symbol ?? undefined,
    item.signal.category,
  );

  if (hit && hit.link) {
    const mantleEvidence: Evidence = {
      id: deterministicId("evid", { signalId: item.signal.id, link: hit.link }),
      signalId: item.signal.id,
      kind: "mantle_relevance",
      title: `Mantle docs: ${hit.title || "Reference"}`.trim(),
      value: hit.content || hit.title || "Mantle Network reference",
      confidence: "high",
      sourceRef: hit.link,
      createdAt: nowIso(),
    };
    events.push({
      eventId: deterministicId("event", { type: "evidence_added", evid: mantleEvidence.id }),
      createdAt: nowIso(),
      agent: "mantle-docs-skill",
      type: "evidence_added",
      evidence: mantleEvidence,
    });
  }

  // 2) Re-materialize locally so the new evidence is visible to the note generator
  //    without re-reading the event store.
  const evidenceForNote: Evidence[] = hit
    ? [
        ...item.evidence,
        {
          id: deterministicId("evid", { signalId: item.signal.id, link: hit.link }),
          signalId: item.signal.id,
          kind: "mantle_relevance",
          title: `Mantle docs: ${hit.title || "Reference"}`.trim(),
          value: hit.content || hit.title || "Mantle Network reference",
          confidence: "high",
          sourceRef: hit.link,
          createdAt: nowIso(),
        },
      ]
    : item.evidence;

  const note = generateDeterministicResearchNote(item.signal, evidenceForNote, item.latestScore);

  // 3) If we have a Mantle docs hit, append a short citation block to the thesis
  //    so the AI Research Note visibly links to the official Mantle source.
  if (hit && hit.link) {
    note.thesis = `${note.thesis} Mantle docs reference: ${hit.title || "hit"} (${hit.link}).`;
  }

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
const appended = results.filter((item) => item.appended).length;
const skipped = results.filter((item) => !item.appended).length;
const mantleDocsCalls = events.filter((e) => e.type === "evidence_added" && e.agent === "mantle-docs-skill").length;
console.log(`Demo agent run complete: appended=${appended}, skipped_duplicates=${skipped}, mantle_docs_evidence_added=${mantleDocsCalls}`);
