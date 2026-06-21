import { Decision } from "../src/schema/decision";
import { Badge } from "./Badge";

export function DecisionTrail({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) return <p className="muted">No decisions recorded yet.</p>;

  return (
    <div className="stack">
      {decisions.map((decision) => (
        <div className="card" key={decision.id}>
          <div className="row">
            <Badge>{decision.actor}</Badge>
            <Badge tone={decision.decision === "ESCALATE" ? "good" : decision.decision === "WATCH" ? "warn" : "bad"}>{decision.decision}</Badge>
          </div>
          <p>{decision.reason}</p>
          <p className="muted">{new Date(decision.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
