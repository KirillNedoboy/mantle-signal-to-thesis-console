import { Evidence } from "../src/schema/evidence";
import { Badge } from "./Badge";

export function EvidencePanel({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) return <p className="muted">No evidence recorded yet.</p>;

  return (
    <div className="stack">
      {evidence.map((item) => (
        <div className="card" key={item.id}>
          <div className="row">
            <Badge>{item.kind}</Badge>
            <Badge tone={item.confidence === "high" ? "good" : item.confidence === "medium" ? "warn" : "bad"}>{item.confidence}</Badge>
          </div>
          <h3>{item.title}</h3>
          <p className="muted">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
