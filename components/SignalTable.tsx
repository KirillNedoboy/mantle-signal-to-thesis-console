import Link from "next/link";
import { SignalView } from "../src/store/materialize";
import { Badge } from "./Badge";

export function SignalTable({ signals }: { signals: SignalView[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Signal</th>
          <th>Source</th>
          <th>Category</th>
          <th>Mantle relevance</th>
          <th>Score</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {signals.map((item) => (
          <tr key={item.signal.id}>
            <td>
              <Link href={`/signals/${item.signal.id}`}><strong>{item.signal.name}</strong></Link>
              <div className="muted">{item.signal.symbol ?? "—"} · {item.signal.chain}</div>
            </td>
            <td>{item.signal.source}</td>
            <td><Badge tone={item.signal.category === "FAST_ALERT" ? "warn" : "default"}>{item.signal.category}</Badge></td>
            <td>{item.latestScore?.mantleRelevance ?? item.signal.mantleRelevance}</td>
            <td>{item.latestScore ? `${item.latestScore.score}/100` : "—"}</td>
            <td><Badge tone={statusTone(item.signal.status)}>{item.signal.status}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function statusTone(status: string): "default" | "good" | "warn" | "bad" {
  if (status === "ESCALATED") return "good";
  if (status === "WATCH") return "warn";
  if (status === "REJECTED" || status === "NO_ACTION") return "bad";
  return "default";
}
