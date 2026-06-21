import { Score } from "../src/schema/score";
import { Badge } from "./Badge";

export function RiskFlags({ score }: { score?: Score }) {
  if (!score) return <p className="muted">No score yet.</p>;
  return (
    <div className="row">
      {score.riskFlags.map((flag) => (
        <Badge key={flag} tone={flag.startsWith("missing") || flag === "weak_mantle_relevance" ? "bad" : "warn"}>{flag}</Badge>
      ))}
    </div>
  );
}
