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
  const latestDecision = item.decisions.at(-1);
  const riskFlags = item.latestScore?.riskFlags ?? [];
  const mantleRelevance = item.latestScore?.mantleRelevance ?? item.signal.mantleRelevance;

  return (
    <div className="stack page-stack">
      <Link className="text-link" href="/signals">Back to Signal Inbox</Link>

      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="row">
            <Badge>{item.signal.source}</Badge>
            <Badge>{item.signal.chain}</Badge>
            <Badge tone={item.signal.category === "FAST_ALERT" ? "warn" : "default"}>{item.signal.category}</Badge>
            <Badge tone={item.signal.status === "ESCALATED" ? "good" : item.signal.status === "WATCH" ? "warn" : item.signal.status === "REJECTED" ? "bad" : "default"}>{item.signal.status}</Badge>
          </div>
          <h1>{item.signal.name}</h1>
          <p className="muted">
            {item.signal.symbol ?? "No symbol"} / detected {new Date(item.signal.detectedAt).toLocaleString()}
          </p>
        </div>
        <div className="detail-hero-side">
          <span className="eyebrow">Safety state</span>
          <strong>Not a buy signal</strong>
          <p className="muted">This page supports research review only. Decisions are human-confirmed records, not execution instructions.</p>
        </div>
      </section>

      <section className="summary-grid">
        <div className="metric-card">
          <span>Score</span>
          <strong>{item.latestScore ? `${item.latestScore.score}/100` : "No score"}</strong>
          <small>Confidence {item.latestScore ? `${Math.round(item.latestScore.confidence * 100)}%` : "pending"}</small>
        </div>
        <div className="metric-card">
          <span>Mantle relevance</span>
          <strong>{mantleRelevance}</strong>
          <small>Explicitly classified per signal</small>
        </div>
        <div className="metric-card">
          <span>Evidence</span>
          <strong>{item.evidence.length}</strong>
          <small>Validated event-store records</small>
        </div>
        <div className="metric-card">
          <span>Latest decision</span>
          <strong>{latestDecision?.decision ?? "PENDING"}</strong>
          <small>{latestDecision ? `${latestDecision.actor} recorded` : "Awaiting human review"}</small>
        </div>
      </section>

      <section className="detail-grid">
        <div className="stack">
          <Panel eyebrow="Evidence review" title="Evidence">
            <EvidencePanel evidence={item.evidence} />
          </Panel>
          <Panel eyebrow="AI activity" title="AI Research Note">
            <ResearchNoteCard note={latestNote} />
          </Panel>
        </div>
        <div className="stack">
          <Panel eyebrow="Risk scoring" title="Risk Flags">
            <div className="safety-callout compact">
              <strong>Not a buy signal</strong>
              <span>{riskFlags.includes("not_a_buy_signal") ? "Risk flag present in score." : "Research-only safety policy remains active."}</span>
            </div>
            <RiskFlags score={item.latestScore} />
          </Panel>
          <Panel eyebrow="Mantle context" title="Mantle Relevance">
            <p className="note">{mantleRelevance}</p>
            <p className="muted">Signals can be useful research objects even when they are not Mantle-native.</p>
          </Panel>
          <Panel eyebrow="Human review" title="Decision Trail">
            <DecisionTrail decisions={item.decisions} />
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="card panel-card">
      <div className="panel-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
