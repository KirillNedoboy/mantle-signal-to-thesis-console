import Link from "next/link";
import { SignalView } from "../src/store/materialize";
import { Badge } from "./Badge";

type Tone = "default" | "good" | "warn" | "bad";

export function SignalTable({ signals }: { signals: SignalView[] }) {
  return (
    <div className="signal-list">
      {signals.map((item) => {
        const latestDecision = item.decisions.at(-1);
        const risk = riskSeverity(item);
        const riskFlags = item.latestScore?.riskFlags ?? [];

        return (
          <Link className="signal-row" href={`/signals/${item.signal.id}`} key={item.signal.id}>
            <div className="signal-primary">
              <div className="row">
                <Badge tone={categoryTone(item.signal.category)}>{item.signal.category}</Badge>
                <Badge tone={statusTone(item.signal.status)}>{item.signal.status}</Badge>
                {riskFlags.includes("not_a_buy_signal") ? <Badge tone="bad">not_a_buy_signal</Badge> : null}
              </div>
              <h3>{item.signal.name}</h3>
              <p className="muted">
                {item.signal.symbol ?? "No symbol"} / {item.signal.chain} / detected {formatDate(item.signal.detectedAt)}
              </p>
            </div>

            <div className="signal-meta-grid">
              <Meta label="Source" value={item.signal.source} />
              <Meta label="Chain" value={item.signal.chain} />
              <Meta label="Mantle relevance" value={item.latestScore?.mantleRelevance ?? item.signal.mantleRelevance} />
              <Meta label="Risk severity" value={risk.label} tone={risk.tone} />
              <Meta label="Latest decision" value={latestDecision?.decision ?? "PENDING"} tone={decisionTone(latestDecision?.decision)} />
              <Meta label="Evidence" value={`${item.evidence.length} items`} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Meta({ label, value, tone = "default" }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="meta">
      <span>{label}</span>
      <strong className={tone === "default" ? undefined : tone}>{value}</strong>
    </div>
  );
}

function statusTone(status: string): Tone {
  if (status === "ESCALATED") return "good";
  if (status === "WATCH") return "warn";
  if (status === "REJECTED" || status === "NO_ACTION") return "bad";
  return "default";
}

function categoryTone(category: string): Tone {
  if (category === "FAST_ALERT") return "warn";
  if (category === "RESEARCH_FINDING") return "good";
  if (category === "SCOUT_PREVIEW") return "default";
  return "good";
}

function decisionTone(decision?: string): Tone {
  if (decision === "ESCALATE") return "good";
  if (decision === "WATCH") return "warn";
  if (decision === "REJECT" || decision === "NO_ACTION") return "bad";
  return "default";
}

function riskSeverity(item: SignalView): { label: string; tone: Tone } {
  const flags = item.latestScore?.riskFlags ?? [];
  if (flags.some((flag) => flag.startsWith("missing") || flag === "weak_mantle_relevance")) {
    return { label: "HIGH", tone: "bad" };
  }
  if (flags.length > 0) return { label: "MEDIUM", tone: "warn" };
  return { label: "LOW", tone: "good" };
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}
