import { SignalTable } from "../../components/SignalTable";
import { loadDashboardState } from "../../src/dashboard/loadState";

export default function SignalsPage() {
  const state = loadDashboardState();
  const decisionCount = state.signals.reduce((sum, item) => sum + item.decisions.length, 0);
  const evidenceCount = state.signals.reduce((sum, item) => sum + item.evidence.length, 0);
  const openRiskFlags = state.signals.reduce(
    (sum, item) => sum + (item.latestScore?.riskFlags.length ?? 0),
    0,
  );

  return (
    <div className="operator-layout">
      <aside className="sidebar-panel">
        <div>
          <span className="eyebrow">Mantle research surface</span>
          <h1>Signal Inbox</h1>
          <p className="muted">
            Every row is materialized from append-only agent events. This Mantle-facing
            view is for triage, evidence review, and human decisions only.
          </p>
        </div>
        <div className="sidebar-stat">
          <span>Total signals</span>
          <strong>{state.counts.totalSignals}</strong>
        </div>
        <div className="sidebar-stat">
          <span>Evidence items</span>
          <strong>{evidenceCount}</strong>
        </div>
        <div className="sidebar-stat">
          <span>Risk flags</span>
          <strong>{openRiskFlags}</strong>
        </div>
        <div className="sidebar-stat">
          <span>Recorded decisions</span>
          <strong>{decisionCount}</strong>
        </div>
        <div className="safety-callout">
          <strong>Research console only</strong>
          <span>No wallet connect, no orders, no automated execution.</span>
        </div>
      </aside>

      <section className="stack">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Operator queue</span>
            <h2>Signals requiring review context</h2>
          </div>
          <div className="row">
            <span className="badge warn">WATCH {state.counts.watched}</span>
            <span className="badge good">ESCALATED {state.counts.escalated}</span>
            <span className="badge bad">REJECTED {state.counts.rejected}</span>
          </div>
        </div>
        <SignalTable signals={state.signals} />
      </section>
    </div>
  );
}
