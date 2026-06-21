import { ResearchNote } from "../src/schema/research-note";
import { Badge } from "./Badge";

export function ResearchNoteCard({ note }: { note?: ResearchNote }) {
  if (!note) return <p className="muted">No research note generated yet. Run `pnpm demo:agent-run`.</p>;

  return (
    <div className="card stack">
      <div className="row">
        <Badge tone="bad">{note.disclaimer}</Badge>
        <Badge tone={note.suggestedDecision === "ESCALATE" ? "good" : note.suggestedDecision === "WATCH" ? "warn" : "bad"}>{note.suggestedDecision}</Badge>
      </div>
      <div>
        <h3>Thesis</h3>
        <p className="note">{note.thesis}</p>
      </div>
      <div>
        <h3>Why surfaced</h3>
        <p className="note">{note.whySurfaced}</p>
      </div>
      <div>
        <h3>Risk summary</h3>
        <p className="note">{note.riskSummary}</p>
      </div>
      <div>
        <h3>Next manual checks</h3>
        <ul>
          {note.nextManualChecks.map((check) => <li key={check}>{check}</li>)}
        </ul>
      </div>
    </div>
  );
}
