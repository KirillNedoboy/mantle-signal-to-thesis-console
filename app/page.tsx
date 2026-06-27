import { SignalTable } from "../components/SignalTable";
import { loadDashboardState } from "../src/dashboard/loadState";
import Link from "next/link";

export default function SignalsPage() {
  const state = loadDashboardState();
  const reviewed = state.signals.filter((item) => item.decisions.length > 0).length;
  const riskFlags = new Set(state.signals.flatMap((item) => item.latestScore?.riskFlags ?? []));

  return (
    <div className="stack page-stack">
      <section className="hero console-hero">
        <div className="eyebrow">Multi-surface research operations console</div>
        <h1>Turn noisy Web3 signals into reviewable thesis trails.</h1>
        <p>
          A watch-only intelligence workspace for turning raw scanner output into
          evidence, risk context, research notes, and human decisions across more
          than one operator surface.
        </p>
        <div className="flow" aria-label="Research workflow">
          <span>raw signal</span>
          <span>evidence</span>
          <span>risk flags</span>
          <span>thesis</span>
          <span>human decision</span>
        </div>
        <div className="hero-actions">
          <Link className="button" href="/signals">Open Mantle Inbox</Link>
          <Link className="button secondary" href="/degen">Open Degen Radar</Link>
          <span className="safety-label">Research console only. Not a buy/sell/execution system.</span>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Console status">
        <div className="metric-card">
          <span>Total signals</span>
          <strong>{state.counts.totalSignals}</strong>
          <small>Materialized from append-only events</small>
        </div>
        <div className="metric-card">
          <span>Human decisions</span>
          <strong>{reviewed}</strong>
          <small>Review trail retained per signal</small>
        </div>
        <div className="metric-card">
          <span>Risk flags</span>
          <strong>{riskFlags.size}</strong>
          <small>Missing data is treated as risk</small>
        </div>
        <div className="metric-card">
          <span>Escalated</span>
          <strong>{state.counts.escalated}</strong>
          <small>Still research, never execution</small>
        </div>
      </section>

      <section className="value-grid">
        <div className="card value-card">
          <span className="card-kicker">01</span>
          <h3>Mantle Research Inbox</h3>
          <p className="muted">Operator-first triage for ecosystem, docs-backed, and thesis-oriented signals.</p>
        </div>
        <div className="card value-card">
          <span className="card-kicker">02</span>
          <h3>Degen Radar Surface</h3>
          <p className="muted">A faster review surface for live Fast DEX Radar imports and early-stage setups.</p>
        </div>
        <div className="card value-card">
          <span className="card-kicker">03</span>
          <h3>Evidence Trail</h3>
          <p className="muted">Each signal keeps the evidence that explains why it surfaced and what is still missing.</p>
        </div>
        <div className="card value-card">
          <span className="card-kicker">04</span>
          <h3>Human Decision Log</h3>
          <p className="muted">Final calls remain human-confirmed, audit-friendly, and separated from execution.</p>
        </div>
      </section>

      <section className="console-preview card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Latest materialized state</span>
            <h2>Mantle research surface</h2>
          </div>
          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            <Link className="text-link" href="/signals">View Mantle inbox</Link>
            <Link className="text-link" href="/degen">View Degen radar</Link>
          </div>
        </div>
        <SignalTable signals={state.signals.slice(0, 3)} />
      </section>
    </div>
  );
}
