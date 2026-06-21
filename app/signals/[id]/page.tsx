import { notFound } from "next/navigation";
import Link from "next/link";
import { DecisionTrail } from "../../../components/DecisionTrail";
import { EvidencePanel } from "../../../components/EvidencePanel";
import { ResearchNoteCard } from "../../../components/ResearchNoteCard";
import { RiskFlags } from "../../../components/RiskFlags";
import { Badge } from "../../../components/Badge";
import { loadDashboardState } from "../../../src/dashboard/loadState";

export default async function SignalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = loadDashboardState();
  const item = state.signals.find((signal) => signal.signal.id === id);
  if (!item) return notFound();

  const latestNote = item.notes.at(-1);

  return (
    <div className="stack">
      <Link className="muted" href="/signals">← Back to signals</Link>
      <section className="card stack">
        <div className="row">
          <Badge>{item.signal.source}</Badge>
          <Badge>{item.signal.chain}</Badge>
          <Badge>{item.signal.category}</Badge>
          <Badge>{item.signal.status}</Badge>
        </div>
        <h1>{item.signal.name}</h1>
        <p className="muted">{item.signal.symbol ?? "No symbol"} · detected {new Date(item.signal.detectedAt).toLocaleString()}</p>
        <pre>{JSON.stringify(item.signal, null, 2)}</pre>
      </section>

      <section className="detail-grid">
        <div className="stack">
          <div className="card">
            <h2>Research note</h2>
            <ResearchNoteCard note={latestNote} />
          </div>
          <div className="card">
            <h2>Evidence</h2>
            <EvidencePanel evidence={item.evidence} />
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h2>Score</h2>
            <div className="metric">{item.latestScore ? `${item.latestScore.score}/100` : "—"}</div>
            <p className="muted">Mantle relevance: {item.latestScore?.mantleRelevance ?? item.signal.mantleRelevance}</p>
            <h3>Risk flags</h3>
            <RiskFlags score={item.latestScore} />
          </div>
          <div className="card">
            <h2>Decision trail</h2>
            <DecisionTrail decisions={item.decisions} />
          </div>
        </div>
      </section>
    </div>
  );
}
